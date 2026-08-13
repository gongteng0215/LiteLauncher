import { nativeImage, type NativeImage, type Rectangle } from "electron";

import type {
  LiteSnapLongCaptureProgress,
  LiteSnapOverlaySelection
} from "../../shared/litesnap";
import {
  prepareLiteSnapStitchFrame,
  type LiteSnapPreparedStitchFrame,
  type LiteSnapStitchDirection
} from "../../shared/litesnap-stitch";

export type LiteSnapLongCaptureFrameSegment = {
  image: NativeImage;
  appendFrom: number;
  appendTo: number;
};

export type LiteSnapLongCaptureObservedFrame = {
  frame: LiteSnapPreparedStitchFrame;
};

export type LiteSnapLongCaptureSessionState = {
  token: number;
  selection: LiteSnapOverlaySelection;
  targetWindowId: string;
  targetWindowBounds: Rectangle | null;
  lastTargetCheckAt: number;
  targetWindowMisses: number;
  startedAt: number;
  phase: LiteSnapLongCaptureProgress["phase"];
  frames: LiteSnapLongCaptureFrameSegment[];
  currentFrame: LiteSnapLongCaptureObservedFrame;
  pendingFrame: LiteSnapLongCaptureObservedFrame | null;
  currentTop: number;
  capturedTop: number;
  capturedBottom: number;
  stitchedHeight: number;
  sampleCount: number;
  changedFrameCount: number;
  acceptedFrameCount: number;
  rejectedFrameCount: number;
  lastRejectReason: string;
  lastMatchScore: number;
  lastMatchOverlap: number;
  lastMatchAppend: number;
  lastMatchDirection: LiteSnapStitchDirection | "";
  directionSwitches: number;
  lastDirection: LiteSnapStitchDirection | null;
  expectedDirection: LiteSnapStitchDirection | null;
  finishSettleMs: number;
  composeMs: number;
  exportMs: number;
  peakMemoryBytes: number;
  physicalWidth: number;
  physicalHeight: number;
  noProgressFrames: number;
  pendingConfirmationCount: number;
  samplingBurstRemaining: number;
  finalFrameUnsafe: boolean;
  simulationFrameIndex: number;
  scrollMs: number;
  captureMs: number;
  stitchMs: number;
  failureReported: boolean;
  maskReady: boolean;
  maskFailureReason: string;
  message: string;
  pollTimer: NodeJS.Timeout | null;
  pollDueAt: number;
  captureInFlight: Promise<void> | null;
  scrollRelayInFlight: boolean;
  queuedScrollDelta: number;
};

export class LiteSnapLongCaptureCoordinator {
  private token = 0;
  private composeFailure = "";

  public get lastComposeFailure(): string {
    return this.composeFailure;
  }

  public createSession(
    selection: LiteSnapOverlaySelection,
    initial: NativeImage,
    message: string,
    targetWindow?: Rectangle & { windowId?: string }
  ): LiteSnapLongCaptureSessionState | null {
    const initialObserved = this.prepareObservedFrame(initial);
    if (!initialObserved) {
      return null;
    }
    const size = initial.getSize();
    return {
      token: ++this.token,
      selection,
      targetWindowId: targetWindow?.windowId ?? "",
      targetWindowBounds: targetWindow
        ? {
            x: targetWindow.x,
            y: targetWindow.y,
            width: targetWindow.width,
            height: targetWindow.height
          }
        : null,
      lastTargetCheckAt: 0,
      targetWindowMisses: 0,
      startedAt: Date.now(),
      phase: "capturing",
      frames: [{ image: initial, appendFrom: 0, appendTo: size.height }],
      currentFrame: initialObserved,
      pendingFrame: null,
      currentTop: 0,
      capturedTop: 0,
      capturedBottom: size.height,
      stitchedHeight: size.height,
      sampleCount: 1,
      changedFrameCount: 0,
      acceptedFrameCount: 0,
      rejectedFrameCount: 0,
      lastRejectReason: "",
      lastMatchScore: 0,
      lastMatchOverlap: 0,
      lastMatchAppend: 0,
      lastMatchDirection: "",
      directionSwitches: 0,
      lastDirection: null,
      expectedDirection: null,
      finishSettleMs: 0,
      composeMs: 0,
      exportMs: 0,
      peakMemoryBytes: size.width * size.height * 8,
      physicalWidth: size.width,
      physicalHeight: size.height,
      noProgressFrames: 0,
      pendingConfirmationCount: 0,
      samplingBurstRemaining: 0,
      finalFrameUnsafe: false,
      simulationFrameIndex: 0,
      scrollMs: 0,
      captureMs: 0,
      stitchMs: 0,
      failureReported: false,
      maskReady: false,
      maskFailureReason: "",
      message,
      pollTimer: null,
      pollDueAt: 0,
      captureInFlight: null,
      scrollRelayInFlight: false,
      queuedScrollDelta: 0
    };
  }

  public schedulePoll(
    session: LiteSnapLongCaptureSessionState,
    delayMs: number,
    callback: () => void
  ): void {
    if (session.phase !== "capturing") {
      return;
    }
    const dueAt = Date.now() + Math.max(0, delayMs);
    if (session.pollTimer && session.pollDueAt <= dueAt) {
      return;
    }
    this.clearPoll(session);
    session.pollDueAt = dueAt;
    session.pollTimer = setTimeout(() => {
      session.pollTimer = null;
      session.pollDueAt = 0;
      callback();
    }, Math.max(0, delayMs));
    session.pollTimer.unref?.();
  }

  public resetBaseline(
    session: LiteSnapLongCaptureSessionState,
    image: NativeImage
  ): boolean {
    const observed = this.prepareObservedFrame(image);
    if (!observed) {
      return false;
    }
    const size = image.getSize();
    if (
      Math.abs(size.width - session.physicalWidth) > 1 ||
      Math.abs(size.height - session.physicalHeight) > 1
    ) {
      return false;
    }
    session.frames = [{ image, appendFrom: 0, appendTo: size.height }];
    session.currentFrame = observed;
    session.pendingFrame = null;
    session.currentTop = 0;
    session.capturedTop = 0;
    session.capturedBottom = size.height;
    session.stitchedHeight = size.height;
    session.sampleCount = 1;
    session.changedFrameCount = 0;
    session.acceptedFrameCount = 0;
    session.rejectedFrameCount = 0;
    session.lastRejectReason = "";
    session.lastMatchScore = 0;
    session.lastMatchOverlap = 0;
    session.lastMatchAppend = 0;
    session.lastMatchDirection = "";
    session.directionSwitches = 0;
    session.lastDirection = null;
    session.expectedDirection = null;
    session.noProgressFrames = 0;
    session.pendingConfirmationCount = 0;
    session.finalFrameUnsafe = false;
    session.peakMemoryBytes = size.width * size.height * 8;
    return true;
  }

  public clearPoll(session: LiteSnapLongCaptureSessionState): void {
    if (session.pollTimer) {
      clearTimeout(session.pollTimer);
      session.pollTimer = null;
    }
    session.pollDueAt = 0;
  }

  public async confirmFinalFrame(
    session: LiteSnapLongCaptureSessionState,
    timeoutMs: number,
    confirmIntervalMs: number,
    observe: () => Promise<void>,
    isActive: () => boolean
  ): Promise<boolean> {
    this.clearPoll(session);
    const startedAt = Date.now();
    const deadline = startedAt + timeoutMs;
    do {
      await observe();
      if (!isActive()) {
        return false;
      }
      if (!session.pendingFrame && !session.finalFrameUnsafe) {
        session.finishSettleMs += Date.now() - startedAt;
        this.clearPoll(session);
        return true;
      }
      await new Promise<void>((resolve) => {
        setTimeout(resolve, confirmIntervalMs);
      });
    } while (Date.now() < deadline);
    session.finishSettleMs += Date.now() - startedAt;
    return false;
  }

  public prepareObservedFrame(image: NativeImage): LiteSnapLongCaptureObservedFrame | null {
    if (!image || image.isEmpty()) {
      return null;
    }
    const size = image.getSize();
    if (size.width <= 0 || size.height <= 0) {
      return null;
    }
    const data = image.toBitmap();
    if (data.length < size.width * size.height * 4) {
      return null;
    }
    return {
      frame: prepareLiteSnapStitchFrame({ width: size.width, height: size.height, data })
    };
  }

  public framesEqual(
    left: LiteSnapPreparedStitchFrame,
    right: LiteSnapPreparedStitchFrame
  ): boolean {
    if (
      left.width !== right.width ||
      left.height !== right.height ||
      left.data.byteLength !== right.data.byteLength
    ) {
      return false;
    }
    const leftBuffer = Buffer.from(left.data.buffer, left.data.byteOffset, left.data.byteLength);
    const rightBuffer = Buffer.from(right.data.buffer, right.data.byteOffset, right.data.byteLength);
    return leftBuffer.equals(rightBuffer);
  }

  public acceptFrame(
    session: LiteSnapLongCaptureSessionState,
    next: LiteSnapLongCaptureObservedFrame,
    direction: LiteSnapStitchDirection,
    nextTop: number
  ): void {
    if (session.lastDirection && session.lastDirection !== direction) {
      session.directionSwitches += 1;
    }
    session.lastDirection = direction;
    // A wheel-derived direction only applies to the frame produced by that
    // gesture. Keeping it after an accepted frame prevents a later manual
    // reversal from ever being considered when Windows does not forward the
    // next wheel event to the guide window.
    session.expectedDirection = null;
    session.acceptedFrameCount += 1;
    session.currentFrame = next;
    session.currentTop = nextTop;
    session.pendingFrame = null;
    session.noProgressFrames = 0;
    session.pendingConfirmationCount = 0;
    session.finalFrameUnsafe = false;
  }

  public createSegment(
    frame: LiteSnapPreparedStitchFrame,
    fromRow: number,
    toRow: number
  ): NativeImage | null {
    const start = Math.max(0, Math.min(frame.height, Math.round(fromRow)));
    const end = Math.max(start, Math.min(frame.height, Math.round(toRow)));
    const height = end - start;
    if (frame.width <= 0 || height <= 0) {
      return null;
    }
    const rowBytes = frame.width * 4;
    const segmentData = Buffer.allocUnsafe(rowBytes * height);
    Buffer.from(frame.data.buffer, frame.data.byteOffset, frame.data.byteLength).copy(
      segmentData,
      0,
      start * rowBytes,
      end * rowBytes
    );
    const segment = nativeImage.createFromBitmap(segmentData, { width: frame.width, height });
    return segment.isEmpty() ? null : segment;
  }

  public trimTop(frames: LiteSnapLongCaptureFrameSegment[], rows: number): boolean {
    let remaining = Math.max(0, Math.round(rows));
    while (remaining > 0 && frames.length > 0) {
      const frame = frames[0];
      if (!frame) {
        break;
      }
      const available = frame.appendTo - frame.appendFrom;
      if (available <= 0 || remaining >= available) {
        frames.shift();
        remaining -= Math.max(0, available);
      } else {
        frame.appendFrom += remaining;
        remaining = 0;
      }
    }
    return remaining === 0 && frames.length > 0;
  }

  public trimBottom(frames: LiteSnapLongCaptureFrameSegment[], rows: number): boolean {
    let remaining = Math.max(0, Math.round(rows));
    while (remaining > 0 && frames.length > 0) {
      const frame = frames.at(-1);
      if (!frame) {
        break;
      }
      const available = frame.appendTo - frame.appendFrom;
      if (available <= 0 || remaining >= available) {
        frames.pop();
        remaining -= Math.max(0, available);
      } else {
        frame.appendTo -= remaining;
        remaining = 0;
      }
    }
    return remaining === 0 && frames.length > 0;
  }

  public estimateMemoryBytes(
    session: LiteSnapLongCaptureSessionState,
    candidate?: LiteSnapLongCaptureObservedFrame,
    outputBytesOverride?: number
  ): number {
    const storedOutputBytes = outputBytesOverride ?? session.frames.reduce(
      (total, frame) => {
        const size = frame.image.getSize();
        return total + Math.max(0, size.width * size.height * 4);
      },
      0
    );
    const currentBytes = session.currentFrame.frame.data.byteLength;
    const pendingBytes = session.pendingFrame?.frame.data.byteLength ?? 0;
    const candidateBytes = candidate?.frame.data.byteLength ?? 0;
    const largestViewportBytes = Math.max(currentBytes, pendingBytes, candidateBytes);
    const featureBytes = [session.currentFrame, session.pendingFrame, candidate].reduce(
      (total, observed) => observed
        ? total + observed.frame.rowLuminance.byteLength +
          observed.frame.rowMinimum.byteLength + observed.frame.rowMaximum.byteLength
        : total,
      0
    );
    return storedOutputBytes + currentBytes + pendingBytes + candidateBytes +
      largestViewportBytes + featureBytes;
  }

  public compose(
    frames: LiteSnapLongCaptureFrameSegment[],
    stitchedHeight: number,
    maxOutputBytes: number
  ): NativeImage | null {
    this.composeFailure = "";
    const first = frames[0]?.image;
    if (!first || first.isEmpty() || stitchedHeight <= 0) {
      this.composeFailure = "missing-first-frame";
      return null;
    }
    const width = first.getSize().width;
    const bytes = width * stitchedHeight * 4;
    if (bytes <= 0 || bytes > maxOutputBytes) {
      this.composeFailure = "output-byte-limit";
      return null;
    }
    const output = Buffer.allocUnsafe(bytes);
    let outputRow = 0;
    for (const frame of frames) {
      const size = frame.image.getSize();
      if (
        size.width !== width ||
        frame.appendFrom < 0 ||
        frame.appendTo > size.height ||
        frame.appendTo <= frame.appendFrom
      ) {
        this.composeFailure = "frame-size-mismatch";
        return null;
      }
      const bitmap = frame.image.toBitmap();
      const sourceOffset = frame.appendFrom * width * 4;
      const sourceEnd = frame.appendTo * width * 4;
      const available = sourceEnd - sourceOffset;
      if ((outputRow * width * 4) + available > output.length) {
        this.composeFailure = "output-overflow";
        return null;
      }
      Buffer.from(bitmap).copy(output, outputRow * width * 4, sourceOffset, sourceEnd);
      outputRow += frame.appendTo - frame.appendFrom;
    }
    if (outputRow !== stitchedHeight) {
      this.composeFailure = "stitched-height-mismatch";
      return null;
    }
    const image = nativeImage.createFromBitmap(output, { width, height: stitchedHeight });
    if (image.isEmpty()) {
      this.composeFailure = "native-image-empty";
      return null;
    }
    return image;
  }

  public buildDiagnosticMetrics(
    session: LiteSnapLongCaptureSessionState,
    extra: Record<string, number | string | boolean> = {}
  ): Record<string, number | string | boolean> {
    return {
      sampleFrames: session.sampleCount,
      changedFrames: session.changedFrameCount,
      acceptedFrames: session.acceptedFrameCount,
      rejectedFrames: session.rejectedFrameCount,
      lastRejectReason: session.lastRejectReason,
      lastMatchScore: Number.isFinite(session.lastMatchScore)
        ? Math.round(session.lastMatchScore * 100) / 100
        : -1,
      lastMatchOverlap: session.lastMatchOverlap,
      lastMatchAppend: session.lastMatchAppend,
      lastMatchDirection: session.lastMatchDirection,
      outputSegments: session.frames.length,
      directionSwitches: session.directionSwitches,
      targetWindowMisses: session.targetWindowMisses,
      stitchedHeight: session.stitchedHeight,
      physicalWidth: session.physicalWidth,
      physicalHeight: session.physicalHeight,
      peakMemoryBytes: session.peakMemoryBytes,
      finishSettleMs: session.finishSettleMs,
      scrollMs: session.scrollMs,
      captureMs: session.captureMs,
      stitchMs: session.stitchMs,
      composeMs: session.composeMs,
      exportMs: session.exportMs,
      maskReady: session.maskReady,
      maskState: session.maskReady ? "ready" : session.maskFailureReason || "hidden",
      capturePath: "windows-native-region",
      ...extra
    };
  }
}
