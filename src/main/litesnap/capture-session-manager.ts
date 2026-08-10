import {
  app,
  BrowserWindow,
  clipboard,
  nativeImage,
  screen,
  shell,
  type Display,
  type NativeImage
} from "electron";
import type { AppErrorLogInput } from "../../shared/types";

import {
  createDefaultLiteSnapSettings,
  pushLiteSnapRecentColor,
  type LiteSnapCommitCaptureInput,
  type LiteSnapCommitCaptureResult,
  type LiteSnapDiagnosticOperation,
  type LiteSnapHistorySource,
  type LiteSnapLongCaptureControl,
  type LiteSnapLongCaptureProgress,
  type LiteSnapLongCaptureStartInput,
  type LiteSnapOverlayMode,
  type LiteSnapOverlaySelection,
  type LiteSnapOverlayState,
  type LiteSnapRecognizeTextInput,
  type LiteSnapRecognizeTextResult,
  type LiteSnapSettings,
  normalizeLiteSnapOcrText
} from "../../shared/litesnap";
import { matchLiteSnapVerticalFrames } from "../../shared/litesnap-stitch";
import {
  looksLikeMisrecognizedEnglish,
  scoreLiteSnapOcrText,
  type LiteSnapOcrLanguagePreference
} from "../../shared/litesnap-ocr-quality";
import { type LiteSnapOcrIssue } from "../../shared/litesnap-ocr-help";
import { IPC_CHANNELS } from "../../shared/channels";
import {
  captureDisplayFramesWithFallback,
  captureSourceImageWithFallback,
  createLiteSnapCaptureProvider,
  type LiteSnapCaptureProvider
} from "./capture-provider";
import { createLiteSnapLongCaptureController, createLiteSnapOverlayWindow } from "./overlay-window";
import { LiteSnapHistoryStore } from "./history-store";
import { LiteSnapDiagnosticStore } from "./diagnostic-store";
import { LiteSnapImageStore } from "./image-store";
import { LiteSnapPinWindowManager } from "./pin-window-manager";
import { LiteSnapSettingsStore } from "./settings";
import { probeLiteSnapOcr } from "./ocr-probe";
import {
  installLiteSnapOcrCapabilities,
  listLiteSnapOcrCapabilities
} from "./ocr-capability-installer";
import type {
  LiteSnapOcrCapabilityLanguage,
  LiteSnapOcrProbeResult
} from "../../shared/litesnap-ocr-help";
import {
  formatLiteSnapOcrProbeSummary,
  inferOcrCapabilitiesFromEngineProbe,
  reconcileOcrCapabilitiesWithProbe
} from "../../shared/litesnap-ocr-help";

type CaptureSession = {
  captureId: string;
  mode: LiteSnapOverlayMode;
  overlayWindow: BrowserWindow;
  display: Display;
  settings: LiteSnapSettings;
  previewImage: NativeImage | null;
  previewImageDataUrl: string | null;
  sourceImage: NativeImage | null;
  sourceImageDataUrl: string | null;
  displayFollowLocked: boolean;
  editorMode: boolean;
  historyEdit: boolean;
  diagnosticOperation: LiteSnapDiagnosticOperation;
  diagnosticFinalized: boolean;
  startedAt: number;
};

type LongCaptureFrame = {
  image: NativeImage;
  appendFrom: number;
};

type LongCaptureSession = {
  selection: LiteSnapOverlaySelection;
  point: { x: number; y: number };
  startedAt: number;
  phase: LiteSnapLongCaptureProgress["phase"];
  frames: LongCaptureFrame[];
  stitchedHeight: number;
  noProgressFrames: number;
  simulationFrameIndex: number;
  scrollMs: number;
  captureMs: number;
  stitchMs: number;
  failureReported: boolean;
  timer: NodeJS.Timeout | null;
  message: string;
};

type DisplayFrameCache = {
  displayId: number;
  scaleFactor: number;
  previewImage: NativeImage;
  previewImageDataUrl: string;
  sourceImage: NativeImage | null;
  capturedAt: number;
};

const FRAME_CACHE_TTL_MS = 1200;
const FRAME_CACHE_REFRESH_MS = 2200;
const OVERLAY_READY_TIMEOUT_MS = 8000;
const FRAME_CACHE_REFRESH_MAX_MS = 8000;
const PREVIEW_JPEG_QUALITY = 92;
const DISPLAY_FOLLOW_POLL_MS = 50;
const LONG_CAPTURE_DELAY_MS = 220;
const LONG_CAPTURE_MAX_FRAMES = 120;
const LONG_CAPTURE_MAX_DURATION_MS = 120_000;
const LONG_CAPTURE_MAX_HEIGHT = 30_000;
const LONG_CAPTURE_MAX_BYTES = 256 * 1024 * 1024;

export class LiteSnapCaptureSessionManager {
  private session: CaptureSession | null = null;
  private overlayWindow: BrowserWindow | null = null;
  private longCaptureController: BrowserWindow | null = null;
  private overlayReadyPromise: Promise<void> | null = null;
  private startingCapture = false;
  private switchingDisplay = false;
  private displayFollowTimer: NodeJS.Timeout | null = null;
  private frameCache: DisplayFrameCache | null = null;
  private frameCacheWarmPromise: Promise<void> | null = null;
  private frameCacheWarmDisplayId: number | null = null;
  private frameCacheRefreshTimer: NodeJS.Timeout | null = null;
  private frameCacheIdleRefreshCycles = 0;
  private frameCacheWarmGeneration = 0;
  private idleFrameCachePaused = false;
  private longCapture: LongCaptureSession | null = null;
  private lastLongCaptureComposeFailure = "";
  private readonly captureProvider: LiteSnapCaptureProvider;
  private readonly e2eLongCaptureSimulation =
    process.env.LITELAUNCHER_E2E_LONG_CAPTURE_SIMULATION === "1";

  public constructor(
    private readonly settingsStore: LiteSnapSettingsStore,
    private readonly imageStore: LiteSnapImageStore,
    private readonly pinWindowManager: LiteSnapPinWindowManager,
    private readonly historyStore: LiteSnapHistoryStore | null = null,
    private readonly diagnosticStore: LiteSnapDiagnosticStore | null = null,
    private readonly reportError?: (input: AppErrorLogInput) => void
  ) {
    this.captureProvider = createLiteSnapCaptureProvider();
  }

  public prewarmCaptureCache(): void {
    if (process.platform !== "win32" || this.idleFrameCachePaused) {
      return;
    }

    // One-shot warm only. Periodic idle refresh used to steal main-process /
    // GPU time every few seconds and made the whole launcher feel delayed.
    this.warmDisplayFrameCache(
      screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
    );
  }

  public pauseIdleFrameCache(): void {
    if (this.idleFrameCachePaused) {
      return;
    }

    this.idleFrameCachePaused = true;
    this.stopFrameCacheRefresh();
    this.abortFrameCacheWarm();
  }

  public resumeIdleFrameCache(): void {
    if (!this.idleFrameCachePaused) {
      return;
    }

    this.idleFrameCachePaused = false;
  }

  public async prewarmOverlay(): Promise<boolean> {
    if (process.platform !== "win32") {
      return false;
    }

    const overlayWindow = this.ensureOverlayWindow(
      screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
    );
    await this.waitForOverlayReady(overlayWindow);
    return true;
  }

  public startFrameCacheRefresh(): void {
    if (this.frameCacheRefreshTimer || process.platform !== "win32") {
      return;
    }

    this.frameCacheIdleRefreshCycles = 0;
    this.scheduleNextFrameCacheRefresh();
  }

  private stopFrameCacheRefresh(): void {
    if (!this.frameCacheRefreshTimer) {
      return;
    }

    clearTimeout(this.frameCacheRefreshTimer);
    this.frameCacheRefreshTimer = null;
  }

  private abortFrameCacheWarm(): void {
    this.frameCacheWarmGeneration += 1;
    this.frameCacheWarmPromise = null;
    this.frameCacheWarmDisplayId = null;
  }

  private scheduleNextFrameCacheRefresh(): void {
    if (process.platform !== "win32") {
      return;
    }

    const delay = Math.min(
      FRAME_CACHE_REFRESH_MAX_MS,
      FRAME_CACHE_REFRESH_MS * (1 + Math.min(3, this.frameCacheIdleRefreshCycles))
    );
    this.frameCacheRefreshTimer = setTimeout(() => {
      this.frameCacheRefreshTimer = null;
      if (this.session || !this.shouldRefreshIdleFrameCache()) {
        this.scheduleNextFrameCacheRefresh();
        return;
      }

      const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
      this.warmPreviewFrameCache(display);
      this.frameCacheIdleRefreshCycles += 1;
      this.scheduleNextFrameCacheRefresh();
    }, delay);
    this.frameCacheRefreshTimer.unref?.();
  }

  public async startCapture(
    beforeImageCapture?: () => Promise<void> | void
  ): Promise<boolean> {
    return this.startCaptureWithMode("capture", beforeImageCapture);
  }

  public async startColorCapture(
    beforeImageCapture?: () => Promise<void> | void
  ): Promise<boolean> {
    return this.startCaptureWithMode("color", beforeImageCapture);
  }

  private async startCaptureWithMode(
    mode: LiteSnapOverlayMode,
    beforeImageCapture?: () => Promise<void> | void
  ): Promise<boolean> {
    if (process.platform !== "win32") {
      return false;
    }

    // Guard against rapid re-triggering (e.g. holding the global shortcut).
    // Without this, overlapping startCapture calls each cancel/recreate the
    // session, race on captureId (returning false), and pile up concurrent
    // load/executeJavaScript listeners on the overlay webContents.
    if (this.startingCapture) {
      return true;
    }
    this.startingCapture = true;
    try {
      return await this.startCaptureInternal(mode, beforeImageCapture);
    } finally {
      this.startingCapture = false;
    }
  }

  private async startCaptureInternal(
    mode: LiteSnapOverlayMode,
    beforeImageCapture?: () => Promise<void> | void
  ): Promise<boolean> {
    this.stopFrameCacheRefresh();
    this.abortFrameCacheWarm();

    if (this.session) {
      await this.cancelCapture();
    }

    this.frameCacheIdleRefreshCycles = 0;

    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const overlayWindow = this.ensureOverlayWindow(display);
    this.activateOverlayWindow(overlayWindow, display);

    const captureId = `capture-${Date.now()}`;
    this.session = {
      captureId,
      mode,
      overlayWindow,
      display,
      settings: createDefaultLiteSnapSettings(),
      previewImage: null,
      previewImageDataUrl: null,
      sourceImage: null,
      sourceImageDataUrl: null,
      displayFollowLocked: mode === "color",
      editorMode: false,
      historyEdit: false,
      diagnosticOperation: "capture",
      diagnosticFinalized: false,
      startedAt: Date.now()
    };

    const framesPromise = this.resolveCaptureFrames(display);

    await this.waitForOverlayReady(overlayWindow);
    await this.prepareOverlayRenderer(overlayWindow);
    this.showPreparingOverlay(overlayWindow);
    await beforeImageCapture?.();
    await new Promise<void>((resolve) => setImmediate(resolve));

    const [resolvedFrames] = await Promise.all([
      framesPromise,
      this.settingsStore.getSettings().then((settings) => {
        if (this.session?.captureId === captureId) {
          this.session.settings = settings;
        }
      })
    ]);

    if (this.session?.captureId !== captureId) {
      console.warn("[litesnap] capture aborted: session was replaced before frames arrived");
      return false;
    }

    if (!resolvedFrames) {
      console.warn("[litesnap] capture failed: no frames available for the target display");
      await this.cancelCapture();
      return false;
    }

    this.session.previewImage = resolvedFrames.previewImage;
    this.session.previewImageDataUrl = resolvedFrames.previewImageDataUrl;
    this.session.sourceImage = resolvedFrames.sourceImage;
    this.session.sourceImageDataUrl = null;

    if (resolvedFrames.fromCache) {
      this.warmDisplayFrameCache(display);
    } else {
      this.frameCache = {
        displayId: display.id,
        scaleFactor: display.scaleFactor,
        previewImage: resolvedFrames.previewImage,
        previewImageDataUrl: resolvedFrames.previewImageDataUrl,
        sourceImage: resolvedFrames.sourceImage,
        capturedAt: Date.now()
      };
    }

    await this.emitOverlayStateChanged(await this.getOverlayState());
    await this.showInteractiveOverlay(overlayWindow);
    this.warmSiblingDisplays(display);
    this.startDisplayFollowWatch();
    return true;
  }

  public setDisplayFollowLocked(locked: boolean): void {
    if (!this.session) {
      return;
    }
    this.session.displayFollowLocked = Boolean(locked);
  }

  public async getOverlayState(): Promise<LiteSnapOverlayState | null> {
    if (!this.session) {
      return null;
    }

    const settings = this.session.settings;
    return {
      captureId: this.session.captureId,
      mode: this.session.mode ?? "capture",
      // Send only the display-sized preview to the overlay renderer. Encoding and
      // IPC-ing the full physical-resolution source as a data URL can take many
      // seconds (or fail outright) on high-DPI displays, which makes F1 appear
      // dead. The NativeImage source stays in the main process for sharp crops.
      imageDataUrl: this.session.previewImageDataUrl,
      sourceImageDataUrl: this.session.sourceImageDataUrl,
      viewportWidth: this.session.display.bounds.width,
      viewportHeight: this.session.display.bounds.height,
      selectionMinSize: 24,
      annotationColor: settings.annotationColor,
      annotationLineWidth: settings.annotationLineWidth,
      annotationTextSize: settings.annotationTextSize,
      annotationTool: settings.annotationTool,
      annotationFillShapes: settings.annotationFillShapes,
      recentColors: [...(settings.recentColors ?? [])],
      editorMode: this.session.editorMode,
      longCapture: this.getLongCaptureProgress() ?? undefined
    };
  }

  public async getWindowRectAtPoint(
    x: number,
    y: number
  ): Promise<LiteSnapOverlaySelection | null> {
    const session = this.session;
    if (!session) {
      return null;
    }

    const rect = await this.captureProvider.getWindowRectAtPoint(
      session.display,
      x,
      y
    );
    if (!rect || rect.width <= 8 || rect.height <= 8) {
      return null;
    }
    return rect;
  }

  public async startLongCapture(input: LiteSnapLongCaptureStartInput): Promise<boolean> {
    const session = this.session;
    if (
      process.platform !== "win32" ||
      !session ||
      session.mode !== "capture" ||
      session.editorMode ||
      this.longCapture
    ) {
      return false;
    }

    const selection = this.normalizeSelection(input.selection, session.display);
    if (!selection || !session.sourceImage || session.sourceImage.isEmpty()) {
      return false;
    }

    const croppedInitial = this.cropSelection(session as CaptureSession & { sourceImage: NativeImage }, {
      action: "copy",
      selection
    });
    const initial = this.e2eLongCaptureSimulation && croppedInitial
      ? this.createE2ELongCaptureFrame(croppedInitial.getSize().width, croppedInitial.getSize().height, 0)
      : croppedInitial;
    if (!initial || initial.isEmpty()) {
      return false;
    }

    const point = {
      x: selection.x + Math.round(selection.width / 2),
      y: selection.y + Math.round(selection.height / 2)
    };
    const target = this.e2eLongCaptureSimulation
      ? { x: 0, y: 0, width: 1, height: 1 }
      : await this.captureProvider.getWindowRectAtPoint(session.display, point.x, point.y);
    if (!target) {
      await this.recordDiagnostic("long-capture", "failed", session.startedAt, "未找到可滚动的目标窗口。");
      this.reportError?.({
        scope: "main",
        level: "error",
        message: "LiteSnap long capture failed",
        context: "litesnap-long-capture",
        detail: "reason=target-window-unavailable"
      });
      return false;
    }

    this.stopDisplayFollowWatch();
    const longCapture: LongCaptureSession = {
      selection,
      point,
      startedAt: Date.now(),
      phase: "capturing",
      frames: [{ image: initial, appendFrom: 0 }],
      stitchedHeight: initial.getSize().height,
      noProgressFrames: 0,
      simulationFrameIndex: 0,
      scrollMs: 0,
      captureMs: 0,
      stitchMs: 0,
      failureReported: false,
      timer: null,
      message: "正在自动滚动并拼接…"
    };
    this.longCapture = longCapture;

    if (!session.overlayWindow.isDestroyed()) {
      session.overlayWindow.setIgnoreMouseEvents(true);
      session.overlayWindow.setFocusable(false);
      session.overlayWindow.hide();
    }
    this.showLongCaptureController(session.display, selection);
    await this.emitOverlayStateChanged(await this.getOverlayState());
    this.scheduleLongCaptureStep(0);
    return true;
  }

  public async controlLongCapture(control: LiteSnapLongCaptureControl): Promise<boolean> {
    const longCapture = this.longCapture;
    if (!longCapture) {
      return false;
    }

    if (control === "pause") {
      if (longCapture.phase !== "capturing") {
        return false;
      }
      this.clearLongCaptureTimer(longCapture);
      longCapture.phase = "paused";
      longCapture.message = "已暂停，可继续、完成或取消。";
      await this.emitOverlayStateChanged(await this.getOverlayState());
      return true;
    }

    if (control === "resume") {
      if (longCapture.phase !== "paused") {
        return false;
      }
      longCapture.phase = "capturing";
      longCapture.message = "正在继续自动滚动并拼接…";
      await this.emitOverlayStateChanged(await this.getOverlayState());
      this.scheduleLongCaptureStep(0);
      return true;
    }

    if (control === "cancel") {
      await this.cancelLongCapture("已取消长截图。", "cancelled");
      await this.cancelCapture();
      return true;
    }

    await this.finishLongCapture("已完成长截图，可继续标注。", "success");
    return true;
  }

  public async startHistoryEdit(image: NativeImage): Promise<boolean> {
    if (process.platform !== "win32" || !image || image.isEmpty()) {
      return false;
    }
    if (this.session) {
      await this.cancelCapture();
    }

    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const overlayWindow = this.ensureOverlayWindow(display);
    this.activateOverlayWindow(overlayWindow, display);
    const captureId = `edit-${Date.now()}`;
    const settings = await this.settingsStore.getSettings();
    const preview = image.resize({
      width: Math.max(1, Math.round(display.bounds.width * display.scaleFactor)),
      height: Math.max(1, Math.round(display.bounds.height * display.scaleFactor)),
      quality: "good"
    });
    this.session = {
      captureId,
      mode: "edit",
      overlayWindow,
      display,
      settings,
      previewImage: preview.isEmpty() ? image : preview,
      previewImageDataUrl: this.encodePreviewDataUrl(preview.isEmpty() ? image : preview),
      sourceImage: image,
      sourceImageDataUrl: null,
      displayFollowLocked: true,
      editorMode: true,
      historyEdit: true,
      diagnosticOperation: "history-edit",
      diagnosticFinalized: false,
      startedAt: Date.now()
    };
    await this.waitForOverlayReady(overlayWindow);
    await this.prepareOverlayRenderer(overlayWindow);
    await this.emitOverlayStateChanged(await this.getOverlayState());
    await this.showInteractiveOverlay(overlayWindow);
    return true;
  }

  public getLongCaptureProgress(): LiteSnapLongCaptureProgress | null {
    const longCapture = this.longCapture;
    if (!longCapture) {
      return null;
    }
    return {
      phase: longCapture.phase,
      frameCount: longCapture.frames.length,
      stitchedHeight: longCapture.stitchedHeight,
      elapsedMs: Math.max(0, Date.now() - longCapture.startedAt),
      message: longCapture.message
    };
  }

  private scheduleLongCaptureStep(delay: number): void {
    const longCapture = this.longCapture;
    if (!longCapture || longCapture.phase !== "capturing") {
      return;
    }
    this.clearLongCaptureTimer(longCapture);
    longCapture.timer = setTimeout(() => {
      longCapture.timer = null;
      void this.captureLongCaptureStep();
    }, delay);
    longCapture.timer.unref?.();
  }

  private clearLongCaptureTimer(longCapture: LongCaptureSession): void {
    if (!longCapture.timer) {
      return;
    }
    clearTimeout(longCapture.timer);
    longCapture.timer = null;
  }

  private async captureLongCaptureStep(): Promise<void> {
    const session = this.session;
    const longCapture = this.longCapture;
    if (!session || !longCapture || longCapture.phase !== "capturing") {
      return;
    }
    const elapsed = Date.now() - longCapture.startedAt;
    if (
      longCapture.frames.length >= LONG_CAPTURE_MAX_FRAMES ||
      elapsed >= LONG_CAPTURE_MAX_DURATION_MS ||
      longCapture.stitchedHeight >= LONG_CAPTURE_MAX_HEIGHT
    ) {
      await this.finishLongCapture("已达到长截图安全上限，已保留当前结果。", "success");
      return;
    }

    const targetWindow = this.e2eLongCaptureSimulation
      ? { x: 0, y: 0, width: 1, height: 1 }
      : await this.captureProvider.getWindowRectAtPoint(
          session.display,
          longCapture.point.x,
          longCapture.point.y
        );
    if (!targetWindow) {
      await this.finishLongCapture("目标窗口已关闭，已保留当前结果。", "success");
      return;
    }

    // Approximate one 70%-viewport page of downward movement in standard
    // Windows wheel deltas. Applications retain their own wheel settings, so
    // overlap matching remains the source of truth for every appended frame.
    const wheelNotches = Math.max(
      1,
      Math.min(24, Math.round((longCapture.selection.height * 0.7) / 120))
    );
    const scrollStartedAt = Date.now();
    const scrolled = this.e2eLongCaptureSimulation
      ? true
      : await this.captureProvider.scrollWindowAtPoint?.(
          session.display,
          longCapture.point.x,
          longCapture.point.y,
          -120 * wheelNotches
        ) ?? false;
    longCapture.scrollMs += Date.now() - scrollStartedAt;
    if (!scrolled) {
      await this.pauseLongCapture("无法向目标窗口发送滚动指令，请完成当前结果或取消。", true);
      return;
    }

    await new Promise<void>((resolve) =>
      setTimeout(resolve, this.e2eLongCaptureSimulation ? 32 : LONG_CAPTURE_DELAY_MS)
    );
    const captureStartedAt = Date.now();
    const source = this.e2eLongCaptureSimulation
      ? this.createE2ELongCaptureFrame(
          longCapture.frames[0]?.image.getSize().width ?? 0,
          longCapture.frames[0]?.image.getSize().height ?? 0,
          ++longCapture.simulationFrameIndex
        )
      : await captureSourceImageWithFallback(this.captureProvider, session.display);
    longCapture.captureMs += Date.now() - captureStartedAt;
    if (!source || source.isEmpty()) {
      await this.pauseLongCapture("获取滚动后的画面失败，请完成当前结果或取消。", true);
      return;
    }
    const next = this.e2eLongCaptureSimulation
      ? source
      : this.cropImageForSelection(source, session.display, longCapture.selection);
    const previous = longCapture.frames.at(-1)?.image;
    if (!next || next.isEmpty() || !previous || previous.isEmpty()) {
      await this.pauseLongCapture("当前滚动区域无效，请完成当前结果或取消。", true);
      return;
    }
    const stitchStartedAt = Date.now();
    const match = matchLiteSnapVerticalFrames(
      { width: previous.getSize().width, height: previous.getSize().height, data: previous.toBitmap() },
      { width: next.getSize().width, height: next.getSize().height, data: next.toBitmap() }
    );
    longCapture.stitchMs += Date.now() - stitchStartedAt;
    if (!match.confident) {
      await this.pauseLongCapture("无法可靠识别重叠区域，已暂停以避免拼接错位。", true);
      return;
    }
    if (match.appendedHeight <= 2) {
      longCapture.noProgressFrames += 1;
      if (longCapture.noProgressFrames >= 2) {
        await this.finishLongCapture("已到达滚动内容末尾。", "success");
        return;
      }
    } else {
      longCapture.noProgressFrames = 0;
      const nextHeight = longCapture.stitchedHeight + match.appendedHeight;
      const nextBytes = next.getSize().width * nextHeight * 4;
      if (nextHeight > LONG_CAPTURE_MAX_HEIGHT || nextBytes > LONG_CAPTURE_MAX_BYTES) {
        await this.finishLongCapture("已达到长截图安全上限，已保留当前结果。", "success");
        return;
      }
      longCapture.frames.push({ image: next, appendFrom: match.overlap });
      longCapture.stitchedHeight = nextHeight;
    }
    longCapture.message = `正在拼接第 ${longCapture.frames.length} 帧…`;
    await this.emitOverlayStateChanged(await this.getOverlayState());
    this.scheduleLongCaptureStep(LONG_CAPTURE_DELAY_MS);
  }

  private async pauseLongCapture(message: string, terminalFailure: boolean): Promise<void> {
    const longCapture = this.longCapture;
    if (!longCapture) {
      return;
    }
    this.clearLongCaptureTimer(longCapture);
    longCapture.phase = "paused";
    longCapture.message = message;
    // Pausing protects the current verified result. The final terminal state
    // (finish or cancel) is recorded once the user chooses what to do with it.
    void terminalFailure;
    await this.emitOverlayStateChanged(await this.getOverlayState());
  }

  private async cancelLongCapture(
    message: string,
    status: "cancelled" | "failed"
  ): Promise<void> {
    const longCapture = this.longCapture;
    if (!longCapture) {
      return;
    }
    this.clearLongCaptureTimer(longCapture);
    this.longCapture = null;
    this.closeLongCaptureController();
    await this.recordDiagnostic("long-capture", status, longCapture.startedAt, message, {
      frames: longCapture.frames.length,
      stitchedHeight: longCapture.stitchedHeight,
      scrollMs: longCapture.scrollMs,
      captureMs: longCapture.captureMs,
      stitchMs: longCapture.stitchMs,
      capturePath: "windows-native"
    });
    if (this.session) {
      this.session.diagnosticOperation = "long-capture";
      this.session.diagnosticFinalized = true;
    }
  }

  private async finishLongCapture(message: string, status: "success" | "failed"): Promise<void> {
    const session = this.session;
    const longCapture = this.longCapture;
    if (!session || !longCapture) {
      return;
    }
    this.clearLongCaptureTimer(longCapture);
    longCapture.phase = "finishing";
    longCapture.message = "正在生成长截图…";
    await this.emitOverlayStateChanged(await this.getOverlayState());
    const image = this.composeLongCaptureImage(longCapture.frames, longCapture.stitchedHeight);
    this.longCapture = null;
    if (!image || image.isEmpty()) {
      await this.recordDiagnostic("long-capture", "failed", longCapture.startedAt, "生成长截图失败。", {
        frames: longCapture.frames.length,
        stitchedHeight: longCapture.stitchedHeight,
        scrollMs: longCapture.scrollMs,
        captureMs: longCapture.captureMs,
        stitchMs: longCapture.stitchMs,
        capturePath: "windows-native",
        composeReason: this.lastLongCaptureComposeFailure || "unknown"
      });
      this.reportLongCaptureFailure(longCapture, "compose-failed");
      session.diagnosticOperation = "long-capture";
      session.diagnosticFinalized = true;
      this.closeLongCaptureController();
      await this.cancelCapture();
      return;
    }
    await this.recordDiagnostic("long-capture", status, longCapture.startedAt, message, {
      frames: longCapture.frames.length,
      stitchedHeight: image.getSize().height,
      width: image.getSize().width,
      scrollMs: longCapture.scrollMs,
      captureMs: longCapture.captureMs,
      stitchMs: longCapture.stitchMs,
      capturePath: "windows-native"
    });
    session.diagnosticOperation = "long-capture";
    session.diagnosticFinalized = true;
    session.mode = "edit";
    session.editorMode = true;
    session.captureId = `long-${Date.now()}`;
    session.sourceImage = image;
    session.sourceImageDataUrl = null;
    const preview = image.resize({
      width: Math.max(1, Math.round(session.display.bounds.width * session.display.scaleFactor)),
      height: Math.max(1, Math.round(session.display.bounds.height * session.display.scaleFactor)),
      quality: "good"
    });
    session.previewImage = preview.isEmpty() ? image : preview;
    session.previewImageDataUrl = this.encodePreviewDataUrl(session.previewImage);
    await this.emitOverlayStateChanged(await this.getOverlayState());
    this.closeLongCaptureController();
    this.activateOverlayWindow(session.overlayWindow, session.display);
    await this.showInteractiveOverlay(session.overlayWindow);
  }

  private composeLongCaptureImage(
    frames: LongCaptureFrame[],
    stitchedHeight: number
  ): NativeImage | null {
    this.lastLongCaptureComposeFailure = "";
    const first = frames[0]?.image;
    if (!first || first.isEmpty() || stitchedHeight <= 0) {
      this.lastLongCaptureComposeFailure = "missing-first-frame";
      return null;
    }
    const width = first.getSize().width;
    const bytes = width * stitchedHeight * 4;
    if (bytes <= 0 || bytes > LONG_CAPTURE_MAX_BYTES) {
      this.lastLongCaptureComposeFailure = "output-byte-limit";
      return null;
    }
    const output = Buffer.allocUnsafe(bytes);
    let outputRow = 0;
    for (const frame of frames) {
      const size = frame.image.getSize();
      if (size.width !== width || size.height <= frame.appendFrom) {
        this.lastLongCaptureComposeFailure = `frame-size-mismatch:${size.width}x${size.height}:append=${frame.appendFrom}:expected-width=${width}`;
        return null;
      }
      const bitmap = frame.image.toBitmap();
      const sourceOffset = frame.appendFrom * width * 4;
      const available = (size.height - frame.appendFrom) * width * 4;
      if ((outputRow * width * 4) + available > output.length) {
        this.lastLongCaptureComposeFailure = "output-overflow";
        return null;
      }
      Buffer.from(bitmap).copy(output, outputRow * width * 4, sourceOffset, sourceOffset + available);
      outputRow += size.height - frame.appendFrom;
    }
    if (outputRow !== stitchedHeight) {
      this.lastLongCaptureComposeFailure = "stitched-height-mismatch";
      return null;
    }
    const image = nativeImage.createFromBitmap(output, { width, height: stitchedHeight });
    if (image.isEmpty()) {
      this.lastLongCaptureComposeFailure = "native-image-empty";
      return null;
    }
    return image;
  }

  private createE2ELongCaptureFrame(
    width: number,
    height: number,
    frameIndex: number
  ): NativeImage | null {
    if (width <= 0 || height <= 0) {
      return null;
    }
    const data = Buffer.allocUnsafe(width * height * 4);
    const edge = Math.round(height * 0.12);
    const offset = frameIndex * Math.max(1, Math.round(height * 0.7));
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        const value =
          y < edge ? 245 : y >= height - edge ? 12 : ((offset + y - edge) * 37 + x * 17) % 251;
        data[index] = value;
        data[index + 1] = (value * 3) % 255;
        data[index + 2] = (value * 7) % 255;
        data[index + 3] = 255;
      }
    }
    const image = nativeImage.createFromBitmap(data, { width, height });
    return image.isEmpty() ? null : image;
  }

  private normalizeSelection(
    selection: LiteSnapOverlaySelection,
    display: Display
  ): LiteSnapOverlaySelection | null {
    const x = Math.max(0, Math.round(selection.x));
    const y = Math.max(0, Math.round(selection.y));
    const width = Math.min(display.bounds.width - x, Math.round(selection.width));
    const height = Math.min(display.bounds.height - y, Math.round(selection.height));
    if (width < 24 || height < 24) {
      return null;
    }
    return { x, y, width, height };
  }

  private cropImageForSelection(
    image: NativeImage,
    display: Display,
    selection: LiteSnapOverlaySelection
  ): NativeImage | null {
    const imageSize = image.getSize();
    const ratioX = imageSize.width / Math.max(1, display.bounds.width);
    const ratioY = imageSize.height / Math.max(1, display.bounds.height);
    const left = Math.max(0, Math.floor(selection.x * ratioX));
    const top = Math.max(0, Math.floor(selection.y * ratioY));
    const width = Math.max(1, Math.round(selection.width * ratioX));
    const height = Math.max(1, Math.round(selection.height * ratioY));
    if (left + width > imageSize.width || top + height > imageSize.height) {
      return null;
    }
    return image.crop({ x: left, y: top, width, height });
  }

  private async recordDiagnostic(
    operation: LiteSnapDiagnosticOperation,
    status: "success" | "cancelled" | "failed",
    startedAt: number,
    message: string,
    metrics?: Record<string, number | string | boolean>
  ): Promise<void> {
    try {
      await this.diagnosticStore?.record({ operation, status, startedAt, message, metrics });
    } catch (error) {
      console.warn("[litesnap] diagnostic record failed", error);
    }
  }

  private reportLongCaptureFailure(
    longCapture: LongCaptureSession,
    reason: string
  ): void {
    if (longCapture.failureReported) {
      return;
    }
    longCapture.failureReported = true;
    this.reportError?.({
      scope: "main",
      level: "error",
      message: "LiteSnap long capture failed",
      context: "litesnap-long-capture",
      detail: `reason=${reason}; frames=${longCapture.frames.length}; height=${longCapture.stitchedHeight}`
    });
  }

  public async commitCapture(
    input: LiteSnapCommitCaptureInput
  ): Promise<LiteSnapCommitCaptureResult> {
    const session = this.session;
    if (!session) {
      return {
        ok: false,
        message: "LiteSnap capture session is not available."
      };
    }

    if (!session.sourceImage || session.sourceImage.isEmpty()) {
      return {
        ok: false,
        message: "LiteSnap is still preparing the screenshot."
      };
    }

    // When the renderer has drawn annotations it sends back a fully composited
    // PNG (cropped selection + annotation layer). Otherwise we crop the
    // high-resolution source image in the main process to keep maximum quality.
    const cropped = this.resolveCommitImage(
      session as CaptureSession & { sourceImage: NativeImage },
      input
    );
    if (!cropped || cropped.isEmpty()) {
      return {
        ok: false,
        message: "The current selection is invalid."
      };
    }

    const operation = session.diagnosticOperation;
    const historySource: LiteSnapHistorySource = session.historyEdit
      ? "history-edit"
      : "capture-copy";
    const exportStartedAt = Date.now();

    if (input.action === "copy") {
      clipboard.writeImage(cropped);
      await this.recordHistory(cropped, historySource);
      session.diagnosticFinalized = true;
      await this.cancelCapture();
      if (operation !== "long-capture") {
        await this.recordDiagnostic(operation, "success", session.startedAt, "已复制截图。", {
          width: cropped.getSize().width,
          height: cropped.getSize().height,
          exportMs: Date.now() - exportStartedAt
        });
      }
      return {
        ok: true,
        message: "Screenshot copied to the clipboard."
      };
    }

    if (input.action === "save") {
      try {
        const settings = await this.settingsStore.getSettings();
        // The overlay is closed before the native save dialog / filesystem work.
        // Mark it as an export-in-progress so that teardown is not recorded as a
        // user cancellation.
        session.diagnosticFinalized = true;
        await this.cancelCapture();
        await this.yieldAfterOverlayTeardown();
        const savedPath = await this.imageStore.saveImage(cropped, settings);
        this.revealSavedCapture(savedPath);
        await this.recordHistory(cropped, session.historyEdit ? "history-edit" : "capture-save");
        session.diagnosticFinalized = true;
        if (operation !== "long-capture") {
          await this.recordDiagnostic(operation, "success", session.startedAt, "已保存截图。", {
            width: cropped.getSize().width,
            height: cropped.getSize().height,
            exportMs: Date.now() - exportStartedAt
          });
        }
        return {
          ok: true,
          message: `Screenshot saved: ${savedPath}`,
          savedPath
        };
      } catch (error) {
        session.diagnosticFinalized = true;
        if (operation !== "long-capture") {
          await this.recordDiagnostic(operation, "failed", session.startedAt, "保存截图失败。", {});
        }
        return {
          ok: false,
          message:
            error instanceof Error ? error.message : "Saving the screenshot failed."
        };
      }
    }

    // The overlay selection is in display-relative DIP coordinates, so the
    // pinned window is placed at the captured region's exact screen position and
    // size. This keeps the pinned image identical in size and location to what
    // was just captured.
    const placement = {
      x: session.display.bounds.x + input.selection.x,
      y: session.display.bounds.y + input.selection.y,
      width: input.selection.width,
      height: input.selection.height
    };
    // Pin to screen and copy to clipboard in one step, matching common snipping-tool UX.
    clipboard.writeImage(cropped);
    const pinned = await this.pinWindowManager.pinImage(cropped, placement);
    if (!pinned) {
      return {
        ok: false,
        message: "Pinning the screenshot failed."
      };
    }

    await this.recordHistory(cropped, session.historyEdit ? "history-edit" : "capture-pin");
    session.diagnosticFinalized = true;
    await this.cancelCapture();
    if (operation !== "long-capture") {
      await this.recordDiagnostic(operation, "success", session.startedAt, "已贴图截图。", {
        width: cropped.getSize().width,
        height: cropped.getSize().height,
        exportMs: Date.now() - exportStartedAt
      });
    }
    return {
      ok: true,
      message: "Screenshot pinned to the screen and copied to the clipboard."
    };
  }

  public async recordHistory(
    image: NativeImage,
    source: LiteSnapHistorySource
  ): Promise<void> {
    if (!this.historyStore) {
      return;
    }
    try {
      const settings = await this.settingsStore.getSettings();
      if (!settings.historyEnabled) {
        return;
      }
      await this.historyStore.add(image, source, settings.historyMaxItems);
    } catch (error) {
      console.warn("[litesnap] history record failed", error);
    }
  }

  public async recordRecentColor(color: string): Promise<string[]> {
    const nextColor = color.trim().toLowerCase();
    if (!/^#[0-9a-f]{6}$/.test(nextColor)) {
      const settings = await this.settingsStore.getSettings();
      return settings.recentColors;
    }

    const settings = await this.settingsStore.getSettings();
    const recentColors = pushLiteSnapRecentColor(settings.recentColors, nextColor);
    const next = await this.settingsStore.updateSettings({ recentColors });
    if (this.session) {
      this.session.settings = {
        ...this.session.settings,
        recentColors: [...next.recentColors]
      };
    }
    return next.recentColors;
  }

  private async recognizeWithLanguage(
    cropped: NativeImage,
    languagePreference: LiteSnapOcrLanguagePreference
  ): Promise<string | null> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (attempt > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, 80));
      }

      try {
        const text = await this.captureProvider.recognizeText(cropped, {
          languagePreference
        });
        if (typeof text === "string" && text.trim()) {
          return text;
        }
      } catch (error) {
        console.warn("[litesnap] OCR recognition failed", error);
      }
    }

    return null;
  }

  private prepareOcrImage(image: NativeImage): NativeImage {
    const size = image.getSize();
    const minEdge = Math.min(size.width, size.height);
    const minOcrEdge = 56;
    if (minEdge >= minOcrEdge) {
      return image;
    }

    const scale = Math.min(4, Math.ceil(minOcrEdge / Math.max(1, minEdge)));
    const resized = image.resize({
      width: Math.max(1, Math.round(size.width * scale)),
      height: Math.max(1, Math.round(size.height * scale)),
      quality: "best"
    });
    return resized.isEmpty() ? image : resized;
  }

  private async recognizeOcrWithFallback(
    image: NativeImage,
    options?: { languagePreference?: LiteSnapOcrLanguagePreference }
  ): Promise<string | null> {
    const preference = options?.languagePreference ?? "chinese";

    if (preference === "english") {
      let text = await this.recognizeWithLanguage(image, "english");
      if (!text) {
        text = await this.recognizeWithLanguage(image, "chinese");
      }
      return text;
    }

    const chineseText = await this.recognizeWithLanguage(image, "chinese");
    if (chineseText) {
      const normalizedChinese = normalizeLiteSnapOcrText(chineseText);
      if (
        normalizedChinese &&
        !looksLikeMisrecognizedEnglish(normalizedChinese)
      ) {
        return chineseText;
      }

      const englishText = await this.recognizeWithLanguage(image, "english");
      if (englishText) {
        const normalizedEnglish = normalizeLiteSnapOcrText(englishText);
        if (
          !normalizedChinese ||
          scoreLiteSnapOcrText(normalizedEnglish) >
            scoreLiteSnapOcrText(normalizedChinese)
        ) {
          return englishText;
        }
      }

      return chineseText;
    }

    return this.recognizeWithLanguage(image, "english");
  }

  private buildOcrFailureMessage(): string {
    return "未识别到文字。请检查是否已安装 Windows OCR 语言包（英文或中文简体）。";
  }

  private async recognizeSelectionText(
    input: LiteSnapRecognizeTextInput,
    options?: { languagePreference?: LiteSnapOcrLanguagePreference }
  ): Promise<
    | { ok: true; text: string }
    | { ok: false; message: string; ocrIssue?: LiteSnapOcrIssue }
  > {
    const session = this.session;
    if (!session) {
      return { ok: false, message: "截图会话已结束。" };
    }

    if (!session.sourceImage || session.sourceImage.isEmpty()) {
      return { ok: false, message: "截图还在准备中，请稍候。" };
    }

    const cropped = this.cropSelection(
      session as CaptureSession & { sourceImage: NativeImage },
      { action: "copy", selection: input.selection }
    );
    if (!cropped || cropped.isEmpty()) {
      return { ok: false, message: "当前选区无效。" };
    }

    if (!this.captureProvider.supportsTextRecognition()) {
      return {
        ok: false,
        ocrIssue: "module_missing",
        message:
          "当前未加载 Windows OCR 模块。请完全退出 LiteLauncher 后重新启动；若仍失败，请安装最新版本或重新编译 native 模块。"
      };
    }

    const ocrImage = this.prepareOcrImage(cropped);
    const text = await this.recognizeOcrWithFallback(ocrImage, options);

    if (text === null) {
      return {
        ok: false,
        ocrIssue: "language_pack",
        message: this.buildOcrFailureMessage()
      };
    }

    const normalized = normalizeLiteSnapOcrText(text);
    if (!normalized) {
      return { ok: false, message: "未识别到文字。" };
    }

    return { ok: true, text: normalized };
  }

  public async recognizeSelection(
    input: LiteSnapRecognizeTextInput
  ): Promise<LiteSnapRecognizeTextResult> {
    const session = this.session;
    const ocrStartedAt = Date.now();
    const result = await this.recognizeSelectionText(input);
    if (session) {
      session.diagnosticOperation = "ocr";
      session.diagnosticFinalized = true;
      await this.recordDiagnostic(
        "ocr",
        result.ok ? "success" : "failed",
        session.startedAt,
        result.ok ? "OCR completed." : "OCR failed.",
        result.ok
          ? { textLength: result.text.length, ocrMs: Date.now() - ocrStartedAt }
          : { ocrMs: Date.now() - ocrStartedAt }
      );
    }
    await this.cancelCapture();

    if (!result.ok) {
      return {
        ok: false,
        text: "",
        message: result.message,
        ocrIssue: result.ocrIssue
      };
    }

    return { ok: true, text: result.text, message: "已识别文字。" };
  }

  public async recognizeTextFromSelection(
    input: LiteSnapRecognizeTextInput,
    options?: { languagePreference?: LiteSnapOcrLanguagePreference }
  ): Promise<
    | { ok: true; text: string }
    | { ok: false; message: string; ocrIssue?: LiteSnapOcrIssue }
  > {
    return this.recognizeSelectionText(input, options);
  }

  public async recognizeSelectionForTranslate(
    input: LiteSnapRecognizeTextInput
  ): Promise<
    | { ok: true; text: string }
    | { ok: false; message: string; ocrIssue?: LiteSnapOcrIssue }
  > {
    return this.recognizeSelectionText(input, { languagePreference: "english" });
  }

  public async probeOcrStatusAsync(): Promise<LiteSnapOcrProbeResult> {
    const result = probeLiteSnapOcr(this.captureProvider);

    if (
      result.moduleLoaded &&
      result.chineseReady &&
      result.englishReady
    ) {
      result.capabilities = inferOcrCapabilitiesFromEngineProbe(result);
    } else {
      try {
        const listed = await listLiteSnapOcrCapabilities();
        if (listed.ok) {
          result.capabilities = reconcileOcrCapabilitiesWithProbe(
            listed.capabilities,
            result
          );
        }
      } catch {
        // ignore capability listing errors
      }
    }

    if (
      !result.moduleLoaded &&
      result.capabilities?.some((cap) => cap.installed)
    ) {
      result.message = result.nativeAddonExists
        ? "系统 OCR 组件已安装，但 LiteLauncher 的 OCR 原生模块未加载。请完全退出后重新打开，或重新安装最新版 LiteLauncher。"
        : "系统 OCR 组件已安装，但未找到 LiteLauncher 的 OCR 原生模块（litesnap-capture.node）。请重新安装最新版 LiteLauncher；开发者请执行 pnpm run build。";
      result.ocrIssue = "module_missing";
    }

    result.message = formatLiteSnapOcrProbeSummary(result);
    result.message = `当前版本 v${app.getVersion()}\n${result.message}`;
    return result;
  }

  public listOcrCapabilities() {
    return listLiteSnapOcrCapabilities();
  }

  public installOcrCapabilities(languages?: LiteSnapOcrCapabilityLanguage[]) {
    return installLiteSnapOcrCapabilities(languages);
  }

  public async cancelCapture(): Promise<boolean> {
    this.stopDisplayFollowWatch();
    this.switchingDisplay = false;
    const longCapture = this.longCapture;
    if (longCapture) {
      this.clearLongCaptureTimer(longCapture);
      this.longCapture = null;
      this.closeLongCaptureController();
      await this.recordDiagnostic("long-capture", "cancelled", longCapture.startedAt, "已取消长截图。", {
        frames: longCapture.frames.length,
        stitchedHeight: longCapture.stitchedHeight
      });
    }
    const session = this.session;
    this.session = null;
    if (!session) {
      return false;
    }

    if (!session.diagnosticFinalized) {
      session.diagnosticFinalized = true;
      await this.recordDiagnostic(
        session.diagnosticOperation,
        "cancelled",
        session.startedAt,
        "Capture cancelled."
      );
    }

    const display = session.display;
    if (!session.overlayWindow.isDestroyed()) {
      await this.emitOverlayStateChanged(null);
      session.overlayWindow.hide();
      this.parkOverlayWindow(session.overlayWindow);
    } else {
      await this.emitOverlayStateChanged(null);
    }
    this.warmDisplayFrameCache(display);
    return true;
  }

  private startDisplayFollowWatch(): void {
    this.stopDisplayFollowWatch();
    if (process.platform !== "win32" || screen.getAllDisplays().length < 2) {
      return;
    }

    this.displayFollowTimer = setInterval(() => {
      void this.maybeFollowCursorDisplay();
    }, DISPLAY_FOLLOW_POLL_MS);
    this.displayFollowTimer.unref?.();
  }

  private stopDisplayFollowWatch(): void {
    if (!this.displayFollowTimer) {
      return;
    }
    clearInterval(this.displayFollowTimer);
    this.displayFollowTimer = null;
  }

  private async maybeFollowCursorDisplay(): Promise<void> {
    const session = this.session;
    if (
      !session ||
      session.displayFollowLocked ||
      this.switchingDisplay ||
      this.startingCapture
    ) {
      return;
    }

    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    if (display.id === session.display.id) {
      return;
    }

    await this.switchCaptureDisplay(display);
  }

  private async switchCaptureDisplay(display: Display): Promise<void> {
    const session = this.session;
    if (!session || this.switchingDisplay || session.displayFollowLocked) {
      return;
    }

    const overlayWindow = session.overlayWindow;
    if (overlayWindow.isDestroyed()) {
      return;
    }

    this.switchingDisplay = true;
    try {
      const captureId = `capture-${Date.now()}`;
      session.captureId = captureId;
      session.display = display;
      session.previewImage = null;
      session.previewImageDataUrl = null;
      session.sourceImage = null;
      session.sourceImageDataUrl = null;
      session.displayFollowLocked = false;

      this.activateOverlayWindow(overlayWindow, display);
      this.showPreparingOverlay(overlayWindow);
      await this.prepareOverlayRenderer(overlayWindow);

      const frames = await this.resolveCaptureFrames(display);
      if (this.session?.captureId !== captureId) {
        return;
      }
      if (!frames) {
        console.warn("[litesnap] display switch failed: no frames for target display");
        await this.cancelCapture();
        return;
      }

      session.previewImage = frames.previewImage;
      session.previewImageDataUrl = frames.previewImageDataUrl;
      session.sourceImage = frames.sourceImage;
      session.sourceImageDataUrl = null;

      if (frames.fromCache) {
        this.warmDisplayFrameCache(display);
      } else {
        this.frameCache = {
          displayId: display.id,
          scaleFactor: display.scaleFactor,
          previewImage: frames.previewImage,
          previewImageDataUrl: frames.previewImageDataUrl,
          sourceImage: frames.sourceImage,
          capturedAt: Date.now()
        };
      }

      await this.emitOverlayStateChanged(await this.getOverlayState());
      await this.showInteractiveOverlay(overlayWindow);
      this.warmSiblingDisplays(display);
    } finally {
      this.switchingDisplay = false;
    }
  }

  private warmSiblingDisplays(activeDisplay: Display): void {
    for (const display of screen.getAllDisplays()) {
      if (display.id === activeDisplay.id) {
        continue;
      }
      this.warmDisplayFrameCache(display);
    }
  }

  private ensureOverlayWindow(display: Display): BrowserWindow {
    const existing = this.overlayWindow;
    if (existing && !existing.isDestroyed()) {
      return existing;
    }

    const overlayWindow = createLiteSnapOverlayWindow(display);
    this.overlayReadyPromise = null;
    overlayWindow.on("closed", () => {
      if (this.overlayWindow === overlayWindow) {
        this.overlayWindow = null;
      }
      if (this.session?.overlayWindow === overlayWindow) {
        this.session = null;
      }
    });
    this.parkOverlayWindow(overlayWindow);
    this.overlayWindow = overlayWindow;
    return overlayWindow;
  }

  private showLongCaptureController(
    display: Display,
    selection: LiteSnapOverlaySelection
  ): void {
    let controller = this.longCaptureController;
    if (!controller || controller.isDestroyed()) {
      controller = createLiteSnapLongCaptureController(display);
      this.longCaptureController = controller;
      controller.on("closed", () => {
        if (this.longCaptureController === controller) {
          this.longCaptureController = null;
        }
      });
    }
    const width = 360;
    const height = 112;
    const preferredX = display.bounds.x + selection.x + Math.round((selection.width - width) / 2);
    const preferredY = display.bounds.y + selection.y + selection.height + 12;
    const maxX = display.workArea.x + display.workArea.width - width - 12;
    const maxY = display.workArea.y + display.workArea.height - height - 12;
    controller.setBounds({
      x: Math.max(display.workArea.x + 12, Math.min(maxX, preferredX)),
      y: Math.max(display.workArea.y + 12, Math.min(maxY, preferredY)),
      width,
      height
    });
    controller.show();
    controller.moveTop();
  }

  private closeLongCaptureController(): void {
    const controller = this.longCaptureController;
    this.longCaptureController = null;
    if (controller && !controller.isDestroyed()) {
      controller.close();
    }
  }

  private activateOverlayWindow(
    overlayWindow: BrowserWindow,
    display: Display
  ): void {
    overlayWindow.setBounds(display.bounds);
    overlayWindow.setFocusable(false);
    overlayWindow.setIgnoreMouseEvents(true);
    overlayWindow.setAlwaysOnTop(true, "screen-saver");
    overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }

  private parkOverlayWindow(overlayWindow: BrowserWindow): void {
    overlayWindow.setIgnoreMouseEvents(true);
    overlayWindow.setAlwaysOnTop(false);
    overlayWindow.setVisibleOnAllWorkspaces(false);
    overlayWindow.setFocusable(false);
    // Keep the parked window fully transparent. A hidden window retains its
    // last painted frame (the previous screenshot) in the GPU buffer, so the
    // next show() would flash that stale frame for an instant. By keeping the
    // window at opacity 0 while parked and only restoring opacity after the new
    // frame is painted (see showInteractiveOverlay), that stale frame is never
    // visible.
    overlayWindow.setOpacity(0);
  }

  private showPreparingOverlay(overlayWindow: BrowserWindow): void {
    if (overlayWindow.isDestroyed()) {
      return;
    }

    // Keep the preparing overlay transparent until the new screenshot is painted.
    // Showing the previous dim/selection state here looked like a full-screen grey
    // overlay, especially right after OCR closes the previous capture session.
    overlayWindow.setIgnoreMouseEvents(true);
    overlayWindow.setFocusable(false);
    overlayWindow.setOpacity(0);
    overlayWindow.show();
    overlayWindow.moveTop();
  }

  private async prepareOverlayRenderer(overlayWindow: BrowserWindow): Promise<void> {
    if (overlayWindow.isDestroyed()) {
      return;
    }

    await overlayWindow.webContents.executeJavaScript(
      "window.__LL_LITESNAP_PREPARE_CAPTURE__?.();",
      true
    ).catch(() => undefined);
  }

  private async waitForOverlayFrameReady(overlayWindow: BrowserWindow): Promise<boolean> {
    if (overlayWindow.isDestroyed() || overlayWindow.webContents.isDestroyed()) {
      return false;
    }

    // Wait until the renderer has decoded the screenshot, applied it as the
    // overlay background (data-ready="true"), and painted two animation frames.
    // Without this the very first capture (which has no warmed cache) would
    // flash the overlay's flat fill color for a moment before the screenshot
    // becomes visible, making the whole screen look grey/blank.
    const result = await overlayWindow.webContents
      .executeJavaScript(
        `new Promise((resolve) => {
          const settle = () =>
            requestAnimationFrame(() =>
              requestAnimationFrame(() => resolve(true))
            );
          const start = Date.now();
          const poll = () => {
            const node = document.getElementById("litesnap-overlay");
            if (node && node.dataset.ready === "true") {
              settle();
              return;
            }
            if (Date.now() - start > 2500) {
              resolve(false);
              return;
            }
            requestAnimationFrame(poll);
          };
          poll();
        });`,
        true
      )
      .catch(() => false);

    return result === true;
  }

  private waitForOverlayReady(overlayWindow: BrowserWindow): Promise<void> {
    if (overlayWindow.isDestroyed() || overlayWindow.webContents.isDestroyed()) {
      return Promise.resolve();
    }

    if (!overlayWindow.webContents.isLoading()) {
      return Promise.resolve();
    }

    const waitForLoad = (): Promise<void> => {
      if (!this.overlayReadyPromise) {
        this.overlayReadyPromise = new Promise<void>((resolve) => {
          let settled = false;
          const finish = (): void => {
            if (settled) {
              return;
            }
            settled = true;
            if (!overlayWindow.webContents.isDestroyed()) {
              overlayWindow.webContents.removeListener("did-finish-load", finish);
              overlayWindow.webContents.removeListener("did-stop-loading", finish);
              overlayWindow.webContents.removeListener("did-fail-load", finish);
            }
            this.overlayReadyPromise = null;
            resolve();
          };

          if (overlayWindow.isDestroyed() || overlayWindow.webContents.isDestroyed()) {
            finish();
            return;
          }

          if (!overlayWindow.webContents.isLoading()) {
            finish();
            return;
          }

          overlayWindow.webContents.once("did-finish-load", finish);
          overlayWindow.webContents.once("did-stop-loading", finish);
          overlayWindow.webContents.once("did-fail-load", finish);
        });
      }

      return this.overlayReadyPromise;
    };

    return Promise.race([
      waitForLoad(),
      new Promise<void>((resolve) => {
        setTimeout(() => {
          console.warn("[litesnap] overlay ready wait timed out, continuing capture");
          resolve();
        }, OVERLAY_READY_TIMEOUT_MS);
      })
    ]);
  }

  private async emitOverlayStateChanged(state: LiteSnapOverlayState | null): Promise<void> {
    const overlay = this.overlayWindow;
    if (overlay && !overlay.isDestroyed() && !overlay.webContents.isDestroyed()) {
      overlay.webContents.send(IPC_CHANNELS.liteSnapOverlayStateChanged, state);
    }
    const controller = this.longCaptureController;
    if (controller && !controller.isDestroyed() && !controller.webContents.isDestroyed()) {
      const controllerState = state
        ? { ...state, imageDataUrl: null, sourceImageDataUrl: null }
        : null;
      controller.webContents.send(IPC_CHANNELS.liteSnapOverlayStateChanged, controllerState);
    }
  }

  private async showInteractiveOverlay(
    overlayWindow: BrowserWindow
  ): Promise<void> {
    if (overlayWindow.isDestroyed()) {
      return;
    }

    overlayWindow.setIgnoreMouseEvents(false);
    overlayWindow.setFocusable(true);
    overlayWindow.show();
    let frameReady = await this.waitForOverlayFrameReady(overlayWindow);
    if (!frameReady) {
      await new Promise<void>((resolve) => setTimeout(resolve, 32));
      frameReady = await this.waitForOverlayFrameReady(overlayWindow);
    }
    if (overlayWindow.isDestroyed()) {
      return;
    }
    overlayWindow.setOpacity(1);
    overlayWindow.focus();
    overlayWindow.moveTop();
  }

  private async yieldAfterOverlayTeardown(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }

  private revealSavedCapture(savedPath: string): void {
    setTimeout(() => {
      try {
        shell.showItemInFolder(savedPath);
      } catch {
        // Revealing in Explorer is best-effort; saving and closing the overlay
        // must stay reliable even if the shell is busy.
      }
    }, 250);
  }

  private encodePreviewDataUrl(image: NativeImage): string {
    return `data:image/jpeg;base64,${image.toJPEG(PREVIEW_JPEG_QUALITY).toString("base64")}`;
  }

  private async encodePreviewDataUrlAsync(image: NativeImage): Promise<string> {
    await new Promise<void>((resolve) => setImmediate(resolve));
    return this.encodePreviewDataUrl(image);
  }

  private getCachedFrames(display: Display): DisplayFrameCache | null {
    const cache = this.frameCache;
    if (!cache) {
      return null;
    }

    if (
      cache.displayId !== display.id ||
      cache.scaleFactor !== display.scaleFactor ||
      Date.now() - cache.capturedAt > FRAME_CACHE_TTL_MS
    ) {
      return null;
    }

    return cache;
  }

  private shouldRefreshIdleFrameCache(): boolean {
    if (this.idleFrameCachePaused) {
      return false;
    }

    return BrowserWindow.getAllWindows().some(
      (window) => !window.isDestroyed() && window.isFocused()
    );
  }

  private warmDisplayFrameCache(display: Display): void {
    this.scheduleFrameCacheWarm(display, () => this.captureAndStoreFrameCache(display));
  }

  private warmPreviewFrameCache(display: Display): void {
    this.scheduleFrameCacheWarm(display, () => this.captureAndStorePreviewCache(display));
  }

  private scheduleFrameCacheWarm(
    display: Display,
    task: () => Promise<void>
  ): void {
    if (
      this.frameCacheWarmPromise &&
      this.frameCacheWarmDisplayId === display.id
    ) {
      return;
    }

    const generation = this.frameCacheWarmGeneration;
    this.frameCacheWarmDisplayId = display.id;
    this.frameCacheWarmPromise = task().finally(() => {
      if (this.frameCacheWarmGeneration === generation) {
        this.frameCacheWarmPromise = null;
      }
    });
  }

  private async resolveCaptureFrames(display: Display): Promise<{
    previewImage: NativeImage;
    previewImageDataUrl: string;
    sourceImage: NativeImage;
    fromCache: boolean;
  } | null> {
    const cachedFrames = this.getCachedFrames(display);
    if (cachedFrames) {
      if (cachedFrames.sourceImage && !cachedFrames.sourceImage.isEmpty()) {
        return {
          previewImage: cachedFrames.previewImage,
          previewImageDataUrl: cachedFrames.previewImageDataUrl,
          sourceImage: cachedFrames.sourceImage,
          fromCache: true
        };
      }

      const sourceImage = await captureSourceImageWithFallback(
        this.captureProvider,
        display
      );
      if (!sourceImage || sourceImage.isEmpty()) {
        return null;
      }

      return {
        previewImage: cachedFrames.previewImage,
        previewImageDataUrl: cachedFrames.previewImageDataUrl,
        sourceImage,
        fromCache: false
      };
    }

    const frames = await captureDisplayFramesWithFallback(
      this.captureProvider,
      display
    );
    if (!frames) {
      return null;
    }

    return {
      previewImage: frames.previewImage,
      previewImageDataUrl: await this.encodePreviewDataUrlAsync(frames.previewImage),
      sourceImage: frames.sourceImage,
      fromCache: false
    };
  }

  private async captureAndStoreFrameCache(display: Display): Promise<void> {
    const generation = this.frameCacheWarmGeneration;
    await new Promise<void>((resolve) => setImmediate(resolve));
    if (generation !== this.frameCacheWarmGeneration) {
      return;
    }

    const frames = await this.captureProvider.captureDisplayFrames(display);
    if (!frames) {
      return;
    }

    const { previewImage, sourceImage } = frames;
    if (previewImage.isEmpty() || sourceImage.isEmpty()) {
      return;
    }

    this.frameCache = {
      displayId: display.id,
      scaleFactor: display.scaleFactor,
      previewImage,
      previewImageDataUrl: this.encodePreviewDataUrl(previewImage),
      sourceImage,
      capturedAt: Date.now()
    };
  }

  private async captureAndStorePreviewCache(display: Display): Promise<void> {
    const generation = this.frameCacheWarmGeneration;
    await new Promise<void>((resolve) => setImmediate(resolve));
    if (generation !== this.frameCacheWarmGeneration) {
      return;
    }

    const previewImage = await this.captureProvider.capturePreviewImage(display);
    if (!previewImage || previewImage.isEmpty()) {
      return;
    }

    this.frameCache = {
      displayId: display.id,
      scaleFactor: display.scaleFactor,
      previewImage,
      previewImageDataUrl: this.encodePreviewDataUrl(previewImage),
      sourceImage: null,
      capturedAt: Date.now()
    };
  }

  public ensureSourceImageDataUrl(): string | null {
    const session = this.session;
    if (!session?.sourceImage || session.sourceImage.isEmpty()) {
      return null;
    }

    if (!session.sourceImageDataUrl) {
      session.sourceImageDataUrl = session.sourceImage.toDataURL();
    }

    return session.sourceImageDataUrl;
  }

  private resolveCompositedBuffer(input: LiteSnapCommitCaptureInput): Buffer | null {
    const { imagePngBuffer } = input;
    if (imagePngBuffer instanceof ArrayBuffer && imagePngBuffer.byteLength > 0) {
      return Buffer.from(imagePngBuffer);
    }
    if (ArrayBuffer.isView(imagePngBuffer) && imagePngBuffer.byteLength > 0) {
      return Buffer.from(
        imagePngBuffer.buffer,
        imagePngBuffer.byteOffset,
        imagePngBuffer.byteLength
      );
    }
    return null;
  }

  private resolveCommitImage(
    session: CaptureSession & { sourceImage: NativeImage },
    input: LiteSnapCommitCaptureInput
  ): NativeImage | null {
    const compositedBuffer = this.resolveCompositedBuffer(input);
    if (compositedBuffer) {
      const composited = nativeImage.createFromBuffer(compositedBuffer);
      if (!composited.isEmpty()) {
        return composited;
      }
    }

    if (typeof input.imageDataUrl === "string" && input.imageDataUrl.startsWith("data:image/")) {
      const composited = nativeImage.createFromDataURL(input.imageDataUrl);
      if (!composited.isEmpty()) {
        return composited;
      }
    }

    return this.cropSelection(session, input);
  }

  private cropSelection(
    session: CaptureSession & { sourceImage: NativeImage },
    input: LiteSnapCommitCaptureInput
  ): NativeImage | null {
    const { sourceImage, display } = session;
    const imageSize = sourceImage.getSize();
    const ratioX = imageSize.width / Math.max(1, display.bounds.width);
    const ratioY = imageSize.height / Math.max(1, display.bounds.height);
    const left = Math.max(0, Math.floor(input.selection.x * ratioX));
    const top = Math.max(0, Math.floor(input.selection.y * ratioY));
    const width = Math.max(1, Math.round(input.selection.width * ratioX));
    const height = Math.max(1, Math.round(input.selection.height * ratioY));
    const right = Math.min(imageSize.width, left + width);
    const bottom = Math.min(imageSize.height, top + height);

    if (right <= left || bottom <= top) {
      return null;
    }

    return sourceImage.crop({
      x: left,
      y: top,
      width: right - left,
      height: bottom - top
    });
  }
}
