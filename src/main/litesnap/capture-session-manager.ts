import {
  BrowserWindow,
  nativeImage,
  screen,
  type Display,
  type NativeImage
} from "electron";
import type { AppErrorLogInput } from "../../shared/types";

import {
  createDefaultLiteSnapSettings,
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
} from "../../shared/litesnap";
import {
  advanceLiteSnapStitchRange,
  findLiteSnapQuietSeamRow,
  matchLiteSnapVerticalFrames,
  matchLiteSnapVerticalFramesBidirectional
} from "../../shared/litesnap-stitch";
import type { LiteSnapOcrLanguagePreference } from "../../shared/litesnap-ocr-quality";
import { type LiteSnapOcrIssue } from "../../shared/litesnap-ocr-help";
import { IPC_CHANNELS } from "../../shared/channels";
import { createLiteSnapCaptureProvider, type LiteSnapCaptureProvider } from "./capture-provider";
import { createLiteSnapOverlayWindow } from "./overlay-window";
import {
  LiteSnapLongCaptureCoordinator,
  type LiteSnapLongCaptureObservedFrame as LongCaptureObservedFrame,
  type LiteSnapLongCaptureSessionState as LongCaptureSession
} from "./long-capture-coordinator";
import { LiteSnapLongCaptureWindowCoordinator } from "./long-capture-window-coordinator";
import { LiteSnapHistoryStore } from "./history-store";
import { LiteSnapDiagnosticStore } from "./diagnostic-store";
import { LiteSnapImageStore } from "./image-store";
import { LiteSnapPinWindowManager } from "./pin-window-manager";
import { LiteSnapSettingsStore } from "./settings";
import type {
  LiteSnapOcrCapabilityLanguage,
  LiteSnapOcrProbeResult
} from "../../shared/litesnap-ocr-help";
import type { LiteSnapCaptureSession as CaptureSession } from "./capture-session-types";
import { LiteSnapFrameCacheService } from "./frame-cache-service";
import { LiteSnapCaptureImageService } from "./capture-image-service";
import { LiteSnapOcrService } from "./ocr-service";
import { LiteSnapCaptureCommitService } from "./capture-commit-service";
import { LiteSnapOverlayLifecycleService } from "./overlay-lifecycle-service";
import { LiteSnapCaptureDiagnosticService } from "./capture-diagnostic-service";
const FRAME_CACHE_REFRESH_MS = 2200;
const FRAME_CACHE_REFRESH_MAX_MS = 8000;
const DISPLAY_FOLLOW_POLL_MS = 50;
const LONG_CAPTURE_MAX_HEIGHT = 30_000;
const LONG_CAPTURE_MAX_BYTES = 256 * 1024 * 1024;
const LONG_CAPTURE_MAX_MEMORY_BYTES = 512 * 1024 * 1024;
// A relayed wheel gesture gets a short trailing capture, rather than waiting
// for the slower idle poll. This retains overlap for normal manual scrolling.
const LONG_CAPTURE_SCROLL_SETTLE_MS = 90;
const LONG_CAPTURE_STABILITY_CONFIRM_MS = 80;
const LONG_CAPTURE_MAX_SETTLE_CONFIRMATIONS = 3;
const LONG_CAPTURE_MAX_POLLS_PER_SCROLL = 8;
// Some Windows layered-window combinations let the underlying application
// scroll without delivering a wheel event to Electron. Observe the selected
// pixels at a modest rate as the reliable source of truth. Failed matches are
// silent and never spawn a faster retry loop.
const LONG_CAPTURE_PASSIVE_POLL_MS = 120;

export class LiteSnapCaptureSessionManager {
  private session: CaptureSession | null = null;
  private overlayWindow: BrowserWindow | null = null;
  private readonly longCaptureCoordinator = new LiteSnapLongCaptureCoordinator();
  private readonly longCaptureWindows = new LiteSnapLongCaptureWindowCoordinator();
  private readonly overlayLifecycle = new LiteSnapOverlayLifecycleService();
  private startingCapture = false;
  private switchingDisplay = false;
  private displayFollowTimer: NodeJS.Timeout | null = null;
  private frameCacheRefreshTimer: NodeJS.Timeout | null = null;
  private frameCacheIdleRefreshCycles = 0;
  private idleFrameCachePaused = false;
  private longCapture: LongCaptureSession | null = null;
  private recoveringLongCaptureWindows = false;
  private readonly captureProvider: LiteSnapCaptureProvider;
  private readonly frameCacheService: LiteSnapFrameCacheService;
  private readonly imageService = new LiteSnapCaptureImageService();
  private readonly ocrService: LiteSnapOcrService;
  private readonly commitService: LiteSnapCaptureCommitService;
  private readonly diagnostics: LiteSnapCaptureDiagnosticService;
  private readonly e2eLongCaptureSimulation =
    process.env.LITELAUNCHER_E2E_LONG_CAPTURE_SIMULATION === "1";
  private readonly e2eLongCaptureSimulationStartIndex = Math.max(
    0,
    Math.min(6, Number.parseInt(
      process.env.LITELAUNCHER_E2E_LONG_CAPTURE_START_INDEX ?? "0",
      10
    ) || 0)
  );

  public constructor(
    private readonly settingsStore: LiteSnapSettingsStore,
    private readonly imageStore: LiteSnapImageStore,
    private readonly pinWindowManager: LiteSnapPinWindowManager,
    private readonly historyStore: LiteSnapHistoryStore | null = null,
    private readonly diagnosticStore: LiteSnapDiagnosticStore | null = null,
    private readonly reportError?: (input: AppErrorLogInput) => void
  ) {
    this.captureProvider = createLiteSnapCaptureProvider();
    this.frameCacheService = new LiteSnapFrameCacheService(this.captureProvider);
    this.ocrService = new LiteSnapOcrService(this.captureProvider);
    this.diagnostics = new LiteSnapCaptureDiagnosticService(this.diagnosticStore, this.reportError);
    this.commitService = new LiteSnapCaptureCommitService(
      this.settingsStore,
      this.imageStore,
      this.pinWindowManager,
      this.historyStore,
      this.imageService,
      {
        cancelCapture: () => this.cancelCapture(),
        recordDiagnostic: (operation, status, startedAt, message, metrics) =>
          this.diagnostics.record(operation, status, startedAt, message, metrics)
      }
    );
  }

  public prewarmCaptureCache(): void {
    if (process.platform !== "win32" || this.idleFrameCachePaused) {
      return;
    }

    // One-shot warm only. Periodic idle refresh used to steal main-process /
    // GPU time every few seconds and made the whole launcher feel delayed.
    this.frameCacheService.warmDisplay(
      screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
    );
  }

  public pauseIdleFrameCache(): void {
    if (this.idleFrameCachePaused) {
      return;
    }

    this.idleFrameCachePaused = true;
    this.stopFrameCacheRefresh();
    this.frameCacheService.abortWarm();
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
    await this.overlayLifecycle.waitForReady(overlayWindow);
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
      if (this.session || this.idleFrameCachePaused || !this.frameCacheService.shouldRefreshIdle()) {
        this.scheduleNextFrameCacheRefresh();
        return;
      }

      const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
      this.frameCacheService.warmPreview(display);
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

    // A screenshot shortcut pressed while long capture is active must not
    // replace (and therefore dismiss) the long-capture session. Only the
    // explicit Finish, Cancel, or Escape controls may end it.
    if (this.longCapture) {
      this.keepLongCaptureWindowsVisible(this.longCapture);
      return true;
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
    this.frameCacheService.abortWarm();

    if (this.session) {
      await this.cancelCapture();
    }

    this.frameCacheIdleRefreshCycles = 0;

    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const overlayWindow = this.ensureOverlayWindow(display);
    this.overlayLifecycle.activate(overlayWindow, display);

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
      longCaptureExportWidth: null,
      longCaptureSelection: null,
      diagnosticOperation: "capture",
      diagnosticFinalized: false,
      startedAt: Date.now()
    };

    const framesPromise = this.frameCacheService.resolve(display);

    await this.overlayLifecycle.waitForReady(overlayWindow);
    await this.overlayLifecycle.prepareRenderer(overlayWindow);
    this.overlayLifecycle.showPreparing(overlayWindow);
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
      this.frameCacheService.warmDisplay(display);
    } else {
      this.frameCacheService.store(display, resolvedFrames);
    }

    await this.emitOverlayStateChanged(await this.getOverlayState());
    await this.overlayLifecycle.showInteractive(overlayWindow);
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
      annotationLineWidths: { ...settings.annotationLineWidths },
      annotationTextSize: settings.annotationTextSize,
      annotationTool: settings.annotationTool,
      annotationFillShapes: settings.annotationFillShapes,
      recentColors: [...(settings.recentColors ?? [])],
      editorMode: this.session.editorMode,
      longCapture: this.getLongCaptureProgress() ?? undefined,
      longCaptureSelection: this.longCapture ? { ...this.longCapture.selection } : undefined,
      editorSelection:
        this.session.editorMode && this.session.longCaptureSelection
          ? { ...this.session.longCaptureSelection }
          : undefined
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
      this.longCapture ||
      (!this.e2eLongCaptureSimulation &&
        (this.captureProvider.supportsLayeredWindowExclusion?.() !== true ||
          typeof this.captureProvider.captureRegionImage !== "function"))
    ) {
      return false;
    }

    const selection = this.imageService.normalizeSelection(input.selection, session.display);
    if (!selection || !session.sourceImage || session.sourceImage.isEmpty()) {
      return false;
    }

    if (!this.e2eLongCaptureSimulation && !session.overlayWindow.isDestroyed()) {
      // Only long capture excludes this window from native desktop frames.
      // Ordinary F1 capture must remain a normal visible overlay with the
      // screenshot background, selection outline, and outside dimming.
      session.overlayWindow.setContentProtection(true);
      session.overlayWindow.setIgnoreMouseEvents(true);
      session.overlayWindow.setFocusable(false);
      session.overlayWindow.setOpacity(0);
      await new Promise<void>((resolve) => setTimeout(resolve, 32));
      if (this.session !== session || this.longCapture) {
        return false;
      }
    }

    const croppedInitial = this.e2eLongCaptureSimulation
      ? this.imageService.cropSelection(
          session as CaptureSession & { sourceImage: NativeImage },
          selection
        )
      : null;
    const initial = this.e2eLongCaptureSimulation && croppedInitial
      ? this.imageService.createE2ELongCaptureFrame(
          croppedInitial.getSize().width,
          croppedInitial.getSize().height,
          this.e2eLongCaptureSimulationStartIndex
        )
      : await this.captureProvider.captureRegionImage?.(
          session.display,
          selection,
          { includeLayeredWindows: true }
        ) ?? null;
    if (this.session !== session || this.longCapture) {
      return false;
    }
    if (!initial || initial.isEmpty()) {
      this.restoreOverlayAfterLongCaptureStartFailure(session);
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
      this.restoreOverlayAfterLongCaptureStartFailure(session);
      await this.diagnostics.record("long-capture", "failed", session.startedAt, "未找到可滚动的目标窗口。");
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
    session.longCaptureSelection = { ...selection };
    const longCapture = this.longCaptureCoordinator.createSession(
      selection,
      initial,
      "请手动上下滚动；返回已采集区域不会重复，越过边缘后会自动追加。",
      target
    );
    if (!longCapture) {
      return false;
    }
    longCapture.simulationFrameIndex = this.e2eLongCaptureSimulationStartIndex;
    this.longCapture = longCapture;

    if (!session.overlayWindow.isDestroyed()) {
      // Keep a click-through visual mask so the area outside the long-capture
      // selection remains dimmed just like a normal screenshot. The separate
      // guide window below protects and scroll-relays only the selected area.
      session.overlayWindow.setIgnoreMouseEvents(true);
      session.overlayWindow.setFocusable(false);
      session.overlayWindow.setOpacity(0);
    }
    this.longCaptureWindows.open(session.display, selection, () => {
      void this.handleLongCaptureAuxiliaryWindowClosed(longCapture.token);
    });
    await this.emitOverlayStateChanged(await this.getOverlayState());
    longCapture.maskReady = await this.longCaptureWindows.revealMask(
      session.overlayWindow,
      () => this.isCurrentLongCapture(longCapture, session) && longCapture.phase === "capturing"
    );
    if (!longCapture.maskReady && this.isCurrentLongCapture(longCapture, session)) {
      longCapture.maskFailureReason = "mask-ready-timeout";
      longCapture.message = "选区遮罩未能显示，但长截图仍可继续；虚线框和保存结果不受影响。";
      await this.diagnostics.record(
        "long-capture",
        "failed",
        longCapture.startedAt,
        "mask-ready-timeout",
        this.longCaptureCoordinator.buildDiagnosticMetrics(longCapture)
      );
      await this.emitOverlayStateChanged(await this.getOverlayState());
    }
    // Establish the stitch baseline only after Windows has applied display
    // affinity to the mask, guide, and controller. Comparing the pre-overlay
    // frame with the first protected composite can otherwise look like a fake
    // upward scroll before the user has moved the page at all.
    if (!this.e2eLongCaptureSimulation && this.isCurrentLongCapture(longCapture, session)) {
      const baselineStartedAt = Date.now();
      const settledBaseline = await this.captureProvider.captureRegionImage?.(
        session.display,
        selection,
        { includeLayeredWindows: true }
      ) ?? null;
      longCapture.captureMs += Date.now() - baselineStartedAt;
      if (
        settledBaseline &&
        !settledBaseline.isEmpty() &&
        this.isCurrentLongCapture(longCapture, session)
      ) {
        this.longCaptureCoordinator.resetBaseline(longCapture, settledBaseline);
      }
    }
    this.longCaptureWindows.startWatch(
      session.overlayWindow,
      () => this.isCurrentLongCapture(longCapture, session) &&
        (longCapture.phase === "capturing" || longCapture.phase === "paused"),
      () => longCapture.scrollRelayInFlight
    );
    this.keepLongCaptureWindowsVisible(longCapture);
    this.scheduleLongCapturePoll(LONG_CAPTURE_PASSIVE_POLL_MS);
    return true;
  }

  private restoreOverlayAfterLongCaptureStartFailure(session: CaptureSession): void {
    const overlayWindow = session.overlayWindow;
    if (this.session !== session || overlayWindow.isDestroyed()) {
      return;
    }
    overlayWindow.setContentProtection(false);
    overlayWindow.setOpacity(1);
    overlayWindow.setFocusable(true);
    overlayWindow.setIgnoreMouseEvents(false);
    overlayWindow.show();
    overlayWindow.focus();
    overlayWindow.moveTop();
  }

  public async scrollLongCapture(deltaY: number): Promise<boolean> {
    const session = this.session;
    const longCapture = this.longCapture;
    if (
      !session ||
      !longCapture ||
      longCapture.phase !== "capturing" ||
      !Number.isFinite(deltaY) ||
      Math.abs(deltaY) < 0.5
    ) {
      return false;
    }

    if (longCapture.scrollRelayInFlight) {
      // The transparent guide consumes the physical wheel event, so dropping a
      // concurrent IPC call would also drop the user's scroll. Coalesce rapid
      // wheel/trackpad events and relay their signed delta as soon as the
      // current native SendInput call completes.
      longCapture.queuedScrollDelta = Math.max(
        -1_440,
        Math.min(1_440, longCapture.queuedScrollDelta + deltaY)
      );
      return true;
    }

    // DOM wheel deltas are usually pixels while SendInput uses 120-unit
    // wheel notches. This is a direct relay of the user's wheel gesture, not
    // an automatic scrolling timer.
    const magnitude = Math.max(120, Math.min(1_440, Math.round(Math.abs(deltaY) / 120) * 120));
    const nativeDelta = deltaY > 0 ? -magnitude : magnitude;
    const point = {
      x: longCapture.selection.x + Math.round(longCapture.selection.width / 2),
      y: longCapture.selection.y + Math.round(longCapture.selection.height / 2)
    };
    const guideWindow = this.longCaptureWindows.beginScrollRelay();
    if (!guideWindow) {
      return false;
    }
    longCapture.scrollRelayInFlight = true;
    const startedAt = Date.now();
    try {
      // Keep the guide visible while its coordinator yields input routing.
      await new Promise<void>((resolve) => setTimeout(resolve, 16));
      if (!this.isCurrentLongCapture(longCapture, session)) {
        return false;
      }
      const didScroll = this.e2eLongCaptureSimulation
        ? (() => {
            const direction = deltaY > 0 ? 1 : -1;
            const nextIndex = Math.max(
              0,
              Math.min(6, longCapture.simulationFrameIndex + direction)
            );
            if (nextIndex === longCapture.simulationFrameIndex) {
              return false;
            }
            longCapture.simulationFrameIndex = nextIndex;
            return true;
          })()
        : await this.captureProvider.scrollWindowAtPoint?.(
            session.display,
            point.x,
            point.y,
            nativeDelta,
            {
              targetWindowId: longCapture.targetWindowId
            }
          ) ?? false;
      if (!this.e2eLongCaptureSimulation) {
        await new Promise<void>((resolve) => setTimeout(resolve, 24));
      }
      longCapture.scrollMs += Date.now() - startedAt;
      if (didScroll) {
        this.longCaptureCoordinator.recordInputDirection(longCapture, deltaY > 0 ? "down" : "up");
        longCapture.expectedDirection = deltaY > 0 ? "down" : "up";
        longCapture.samplingBurstRemaining = LONG_CAPTURE_MAX_POLLS_PER_SCROLL;
        longCapture.message = "正在等待滚动停止，再自动追加稳定画面。";
        // Re-arm a short trailing capture after every real user wheel event.
        // Consecutive wheel events reset the timer, so we sample only once the
        // target has settled and never initiate an automatic scroll ourselves.
        this.scheduleLongCapturePoll(LONG_CAPTURE_SCROLL_SETTLE_MS);
      }
      return didScroll;
    } finally {
      longCapture.scrollRelayInFlight = false;
      if (this.session === session) {
        this.longCaptureWindows.endScrollRelay(guideWindow);
      }
      const controller = this.longCaptureWindows.controller;
      if (this.isCurrentLongCapture(longCapture, session) && controller && !controller.isDestroyed()) {
        controller.showInactive();
        controller.moveTop();
      }
      this.keepLongCaptureWindowsVisible(longCapture);
      const queuedDelta = longCapture.queuedScrollDelta;
      longCapture.queuedScrollDelta = 0;
      if (
        Math.abs(queuedDelta) >= 0.5 &&
        this.isCurrentLongCapture(longCapture, session) &&
        longCapture.phase === "capturing"
      ) {
        setImmediate(() => {
          void this.scrollLongCapture(queuedDelta);
        });
      }
    }
  }

  public async controlLongCapture(control: LiteSnapLongCaptureControl): Promise<boolean> {
    const longCapture = this.longCapture;
    if (!longCapture) {
      return false;
    }

    if (control === "capture") {
      if (longCapture.phase !== "capturing") {
        return false;
      }
      longCapture.message = "正在校验当前帧…";
      await this.emitOverlayStateChanged(await this.getOverlayState());
      this.clearLongCapturePoll(longCapture);
      longCapture.expectedDirection = "down";
      // This control remains available to the internal E2E bridge to model a
      // manually scrolled target. The visible controller deliberately has no
      // "capture" button: normal users only scroll, then the poller captures.
      await this.runLongCaptureObservation(true);
      if (this.isCurrentLongCapture(longCapture) && longCapture.phase === "capturing") {
        this.keepLongCaptureWindowsVisible(longCapture);
        if (longCapture.pendingFrame) {
          longCapture.samplingBurstRemaining = Math.max(
            longCapture.samplingBurstRemaining,
            LONG_CAPTURE_MAX_SETTLE_CONFIRMATIONS
          );
          this.scheduleLongCapturePoll();
        }
      }
      return true;
    }

    if (control === "cancel") {
      if (longCapture.phase === "finishing") {
        return false;
      }
      await this.cancelLongCapture("已取消长截图。", "cancelled");
      await this.cancelCapture();
      return true;
    }

    if (longCapture.phase !== "capturing" && longCapture.phase !== "paused") {
      return false;
    }

    // Finish is an explicit user command. Stop every pending sample and save
    // the already verified stitched segments immediately. Do not recapture or
    // rematch a dynamic final viewport here: that made the button appear dead
    // on animated pages such as WPS and could never improve verified output.
    this.clearLongCapturePoll(longCapture);
    longCapture.samplingBurstRemaining = 0;
    longCapture.pendingFrame = null;
    longCapture.pendingConfirmationCount = 0;
    await this.finishLongCapture("已由你手动完成长截图并保存。", "success");
    return true;
  }

  public async startHistoryEdit(image: NativeImage): Promise<boolean> {
    if (process.platform !== "win32" || !image || image.isEmpty()) {
      return false;
    }
    if (this.longCapture) {
      this.keepLongCaptureWindowsVisible(this.longCapture);
      return false;
    }
    if (this.session) {
      await this.cancelCapture();
    }

    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const overlayWindow = this.ensureOverlayWindow(display);
    this.overlayLifecycle.activate(overlayWindow, display);
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
      previewImageDataUrl: this.frameCacheService.encodePreviewDataUrl(preview.isEmpty() ? image : preview),
      sourceImage: image,
      sourceImageDataUrl: null,
      displayFollowLocked: true,
      editorMode: true,
      historyEdit: true,
      longCaptureExportWidth: null,
      longCaptureSelection: null,
      diagnosticOperation: "history-edit",
      diagnosticFinalized: false,
      startedAt: Date.now()
    };
    await this.overlayLifecycle.waitForReady(overlayWindow);
    await this.overlayLifecycle.prepareRenderer(overlayWindow);
    await this.emitOverlayStateChanged(await this.getOverlayState());
    await this.overlayLifecycle.showInteractive(overlayWindow);
    return true;
  }

  public getLongCaptureProgress(): LiteSnapLongCaptureProgress | null {
    const longCapture = this.longCapture;
    if (!longCapture) {
      return null;
    }
    return {
      phase: longCapture.phase,
      frameCount: Math.max(1, longCapture.acceptedFrameCount + 1),
      stitchedHeight: longCapture.stitchedHeight,
      elapsedMs: Math.max(0, Date.now() - longCapture.startedAt),
      message: longCapture.message
    };
  }

  private scheduleLongCapturePoll(delayMs = LONG_CAPTURE_STABILITY_CONFIRM_MS): void {
    const longCapture = this.longCapture;
    if (!longCapture || longCapture.phase !== "capturing") {
      return;
    }
    // Wheel events may arrive continuously. Preserve an already-earlier poll
    // instead of debouncing it forever, otherwise a long gesture can move more
    // than one viewport before the first intermediate frame is observed.
    this.longCaptureCoordinator.schedulePoll(longCapture, delayMs, () => {
      void this.pollLongCapture();
    });
  }

  private clearLongCapturePoll(longCapture: LongCaptureSession): void {
    this.longCaptureCoordinator.clearPoll(longCapture);
  }

  private async pollLongCapture(): Promise<void> {
    const longCapture = this.longCapture;
    if (!longCapture || longCapture.phase !== "capturing") {
      return;
    }
    const activeBurst = longCapture.samplingBurstRemaining > 0;
    if (activeBurst) {
      longCapture.samplingBurstRemaining -= 1;
    }
    await this.runLongCaptureObservation(false, !activeBurst);
    if (this.isCurrentLongCapture(longCapture) && longCapture.phase === "capturing") {
      this.keepLongCaptureWindowsVisible(longCapture);
      // Long capture is wheel-event driven. A pending changed frame receives a
      // small, bounded number of settle confirmations; once it is accepted or
      // rejected, sampling stops completely until the user scrolls again.
      if (longCapture.pendingFrame && longCapture.samplingBurstRemaining > 0) {
        this.scheduleLongCapturePoll(LONG_CAPTURE_STABILITY_CONFIRM_MS);
      } else {
        this.scheduleLongCapturePoll(LONG_CAPTURE_PASSIVE_POLL_MS);
      }
    }
  }

  private async runLongCaptureObservation(
    forceSimulationAdvance: boolean,
    passive = false
  ): Promise<void> {
    const longCapture = this.longCapture;
    if (!longCapture || longCapture.phase !== "capturing") {
      return;
    }
    while (longCapture.captureInFlight) {
      await longCapture.captureInFlight;
      if (!this.isCurrentLongCapture(longCapture) || longCapture.phase !== "capturing") {
        return;
      }
    }
    const task = this.captureObservedLongCaptureFrame(forceSimulationAdvance, passive);
    longCapture.captureInFlight = task;
    try {
      await task;
    } finally {
      if (longCapture.captureInFlight === task) {
        longCapture.captureInFlight = null;
      }
    }
  }

  private async captureObservedLongCaptureFrame(
    forceSimulationAdvance: boolean,
    passive: boolean
  ): Promise<void> {
    const session = this.session;
    const longCapture = this.longCapture;
    if (!session || !longCapture || longCapture.phase !== "capturing") {
      return;
    }

    const captureStartedAt = Date.now();
    // The helper windows use Windows display-affinity exclusion, so the native
    // CAPTUREBLT path sees a live composited target while the mask, guide and
    // controller remain visible without entering the captured pixels.
    const source = this.e2eLongCaptureSimulation
      ? this.imageService.createE2ELongCaptureFrame(
          longCapture.currentFrame.frame.width,
          longCapture.currentFrame.frame.height,
          forceSimulationAdvance
            ? ++longCapture.simulationFrameIndex
            : longCapture.simulationFrameIndex
        )
      : await this.captureProvider.captureRegionImage?.(
          session.display,
          longCapture.selection,
          { includeLayeredWindows: true }
        ) ?? null;
    longCapture.captureMs += Date.now() - captureStartedAt;
    if (
      !this.isCurrentLongCapture(longCapture, session) ||
      longCapture.phase !== "capturing"
    ) {
      return;
    }
    if (!source || source.isEmpty()) {
      longCapture.rejectedFrameCount += 1;
      longCapture.lastRejectReason = "capture-unavailable";
      longCapture.pendingFrame = null;
      longCapture.pendingConfirmationCount = 0;
      longCapture.finalFrameUnsafe = true;
      longCapture.message = "获取当前画面失败，未追加。请继续手动滚动后重试，或完成当前结果。";
      await this.emitOverlayStateChanged(await this.getOverlayState());
      return;
    }
    longCapture.sampleCount += 1;

    const previous = longCapture.currentFrame;
    const sourceSize = source.getSize();
    const targetWidth = previous.frame.width;
    const targetHeight = previous.frame.height;
    if (
      Math.abs(targetWidth - sourceSize.width) > 1 ||
      Math.abs(targetHeight - sourceSize.height) > 1
    ) {
      longCapture.rejectedFrameCount += 1;
      longCapture.lastRejectReason = "region-size-mismatch";
      longCapture.pendingFrame = null;
      longCapture.pendingConfirmationCount = 0;
      longCapture.finalFrameUnsafe = true;
      longCapture.message = "选区物理尺寸发生变化，已忽略该帧。请保持显示缩放和选区不变。";
      await this.emitOverlayStateChanged(await this.getOverlayState());
      return;
    }
    const normalizedSource =
      sourceSize.width === targetWidth && sourceSize.height === targetHeight
        ? source
        : source.resize({ width: targetWidth, height: targetHeight, quality: "best" });
    const next = this.longCaptureCoordinator.prepareObservedFrame(normalizedSource);
    if (!next || !previous) {
      longCapture.rejectedFrameCount += 1;
      longCapture.lastRejectReason = "frame-prepare-failed";
      longCapture.pendingFrame = null;
      longCapture.pendingConfirmationCount = 0;
      longCapture.finalFrameUnsafe = true;
      longCapture.message = "当前选区无效，未追加。请完成当前结果或取消。";
      await this.emitOverlayStateChanged(await this.getOverlayState());
      return;
    }

    const previousFrame = previous.frame;
    const nextFrame = next.frame;
    const nextSize = { width: nextFrame.width, height: nextFrame.height };
    const unchangedPixels = this.longCaptureCoordinator.framesEqual(previousFrame, nextFrame);
    if (unchangedPixels) {
      longCapture.pendingFrame = null;
      longCapture.pendingConfirmationCount = 0;
      longCapture.finalFrameUnsafe = false;
      longCapture.noProgressFrames += 1;
      if (longCapture.noProgressFrames === 1) {
        longCapture.message = "正在等待你手动滚动；检测到稳定的新内容后会自动追加。";
        await this.emitOverlayStateChanged(await this.getOverlayState());
      }
      return;
    }

    // A wheel event is the evidence that the viewport may have moved. If the
    // first post-scroll frame safely matches the current viewport, commit it
    // immediately. Requiring a second pixel-identical frame loses every WPS
    // frame whose caret, footer, or page animation keeps changing slightly.
    const directMatchStartedAt = Date.now();
    let directMatch = matchLiteSnapVerticalFramesBidirectional(
      previousFrame,
      nextFrame,
      longCapture.expectedDirection ?? longCapture.lastDirection
    );
    if (
      !directMatch.confident &&
      !longCapture.expectedDirection &&
      longCapture.lastDirection
    ) {
      // Passive observation has no wheel delta. Prefer the last accepted
      // direction to prevent text-heavy pages from oscillating between two
      // plausible seams, but unlock it when that direction truly fails so a
      // deliberate manual reversal can still be detected.
      directMatch = matchLiteSnapVerticalFramesBidirectional(previousFrame, nextFrame);
    }
    longCapture.stitchMs += Date.now() - directMatchStartedAt;
    longCapture.lastMatchScore = directMatch.score;
    longCapture.lastMatchOverlap = directMatch.overlap;
    longCapture.lastMatchAppend = directMatch.appendedHeight;
    longCapture.lastMatchDirection = directMatch.direction;
    if (directMatch.confident) {
      longCapture.pendingFrame = null;
      longCapture.pendingConfirmationCount = 0;
      await this.appendObservedLongCaptureFrame(longCapture, next, directMatch);
      return;
    }

    if (passive) {
      // Animated cursors, status bars, and document reflow can change pixels
      // without representing a scroll. Passive observation ignores those
      // frames quietly and waits for the next low-rate sample. It must never
      // create a pending/error loop or alter the verified stitched output.
      longCapture.pendingFrame = null;
      longCapture.pendingConfirmationCount = 0;
      longCapture.finalFrameUnsafe = false;
      longCapture.changedFrameCount += 1;
      longCapture.rejectedFrameCount += 1;
      longCapture.lastRejectReason = "passive-low-match-confidence";
      return;
    }

    const pending = longCapture.pendingFrame;
    if (!pending) {
      longCapture.changedFrameCount += 1;
      longCapture.pendingFrame = next;
      longCapture.pendingConfirmationCount = 0;
      longCapture.finalFrameUnsafe = true;
      longCapture.message = "检测到画面变化，正在确认滚动已经停止…";
      await this.emitOverlayStateChanged(await this.getOverlayState());
      return;
    }
    const pendingFrame = pending.frame;
    const stablePixels = this.longCaptureCoordinator.framesEqual(pendingFrame, nextFrame);
    const stable = stablePixels
      ? { confident: true, appendedHeight: 0 }
      : matchLiteSnapVerticalFrames(pendingFrame, nextFrame);
    if (stable.confident && stable.appendedHeight <= 2) {
      longCapture.pendingFrame = null;
      await this.appendObservedLongCaptureFrame(longCapture, next);
      return;
    }
    longCapture.changedFrameCount += 1;
    longCapture.pendingConfirmationCount += 1;

    // During a continuous manual wheel gesture the page may never remain
    // pixel-identical for two polls. Keep the prior observed frame as a bridge
    // when both adjacent overlaps confidently agree on the same direction.
    // This preserves intermediate rows instead of jumping from the first frame
    // straight to the bottom and losing overlap.
    const bridgeStartedAt = Date.now();
    const currentToPending = matchLiteSnapVerticalFramesBidirectional(
      previousFrame,
      pendingFrame,
      longCapture.expectedDirection
    );
    const pendingToNext = matchLiteSnapVerticalFramesBidirectional(
      pendingFrame,
      nextFrame,
      longCapture.expectedDirection
    );
    longCapture.stitchMs += Date.now() - bridgeStartedAt;
    if (
      currentToPending.confident &&
      pendingToNext.confident &&
      currentToPending.direction === pendingToNext.direction
    ) {
      longCapture.pendingFrame = null;
      await this.appendObservedLongCaptureFrame(longCapture, pending, currentToPending);
      if (this.isCurrentLongCapture(longCapture) && longCapture.phase === "capturing") {
        longCapture.pendingFrame = next;
        longCapture.pendingConfirmationCount = 0;
        longCapture.finalFrameUnsafe = true;
        longCapture.message = "滚动中已保留一帧连续内容，正在继续确认最新画面…";
        await this.emitOverlayStateChanged(await this.getOverlayState());
      }
      return;
    }

    if (longCapture.pendingConfirmationCount >= LONG_CAPTURE_MAX_SETTLE_CONFIRMATIONS) {
      longCapture.pendingFrame = null;
      longCapture.pendingConfirmationCount = 0;
      longCapture.rejectedFrameCount += 1;
      longCapture.lastRejectReason = "settle-confirmation-limit";
      longCapture.finalFrameUnsafe = true;
      longCapture.message = "页面持续变化，本轮采样已停止；请停止滚动后再小幅滚动一次。";
    } else {
      longCapture.pendingFrame = next;
      longCapture.finalFrameUnsafe = true;
      longCapture.message = "画面仍在滚动，正在进行有限次数的稳定确认…";
    }
    await this.emitOverlayStateChanged(await this.getOverlayState());
  }

  private async appendObservedLongCaptureFrame(
    longCapture: LongCaptureSession,
    next: LongCaptureObservedFrame,
    knownMatch?: ReturnType<typeof matchLiteSnapVerticalFramesBidirectional>
  ): Promise<void> {
    if (!this.isCurrentLongCapture(longCapture) || longCapture.phase !== "capturing") {
      return;
    }
    const previous = longCapture.currentFrame;
    const previousFrame = previous.frame;
    const nextFrame = next.frame;
    const nextSize = { width: nextFrame.width, height: nextFrame.height };
    const stitchStartedAt = Date.now();
    const match = knownMatch ?? matchLiteSnapVerticalFramesBidirectional(
      previousFrame,
      nextFrame,
      longCapture.expectedDirection ?? longCapture.lastDirection
    );
    longCapture.stitchMs += Date.now() - stitchStartedAt;
    if (!match.confident) {
      longCapture.rejectedFrameCount += 1;
      longCapture.lastRejectReason = "low-match-confidence";
      longCapture.pendingFrame = null;
      longCapture.pendingConfirmationCount = 0;
      longCapture.finalFrameUnsafe = true;
      longCapture.message = "这次画面没有安全接上，本轮采样已停止；请向回滚一点后再小幅滚动。";
      await this.emitOverlayStateChanged(await this.getOverlayState());
      return;
    }

    if (match.appendedHeight <= 2) {
      longCapture.noProgressFrames += 1;
      if (longCapture.noProgressFrames === 1) {
        longCapture.message = "正在等待你手动滚动；检测到新内容后会自动追加。";
        await this.emitOverlayStateChanged(await this.getOverlayState());
      }
      return;
    }

    const rangeAdvance = advanceLiteSnapStitchRange(
      {
        currentTop: longCapture.currentTop,
        capturedTop: longCapture.capturedTop,
        capturedBottom: longCapture.capturedBottom
      },
      match.direction,
      match.appendedHeight,
      nextSize.height
    );
    const uniqueHeight = rangeAdvance.prependHeight + rangeAdvance.appendHeight;
    if (uniqueHeight <= 2) {
      this.longCaptureCoordinator.acceptFrame(
        longCapture,
        next,
        match.direction,
        rangeAdvance.nextTop
      );
      longCapture.message = "当前画面已采集；继续滚动并越过已有内容边缘后会自动追加。";
      await this.emitOverlayStateChanged(await this.getOverlayState());
      return;
    }

    const nextHeight = longCapture.stitchedHeight + uniqueHeight;
    const nextBytes = nextSize.width * nextHeight * 4;
    const estimatedMemory = this.longCaptureCoordinator.estimateMemoryBytes(
      longCapture,
      next,
      nextBytes
    );
    longCapture.peakMemoryBytes = Math.max(longCapture.peakMemoryBytes, estimatedMemory);
    if (
      nextHeight > LONG_CAPTURE_MAX_HEIGHT ||
      nextBytes > LONG_CAPTURE_MAX_BYTES ||
      estimatedMemory > LONG_CAPTURE_MAX_MEMORY_BYTES
    ) {
      const reason = nextHeight > LONG_CAPTURE_MAX_HEIGHT
        ? "output-height-limit"
        : nextBytes > LONG_CAPTURE_MAX_BYTES
          ? "output-byte-limit"
          : "memory-limit";
      await this.pauseLongCaptureAtSafetyLimit(longCapture, reason);
      return;
    }

    const nextFrames = longCapture.frames.map((frame) => ({ ...frame }));
    if (rangeAdvance.prependHeight > 0) {
      const seam = findLiteSnapQuietSeamRow(
        nextFrame,
        rangeAdvance.prependHeight,
        "up",
        Math.min(48, nextSize.height - rangeAdvance.prependHeight)
      );
      const replaceExistingTop = seam - rangeAdvance.prependHeight;
      const segment = this.longCaptureCoordinator.createSegment(nextFrame, 0, seam);
      if (
        !segment ||
        !this.longCaptureCoordinator.trimTop(nextFrames, replaceExistingTop)
      ) {
        longCapture.rejectedFrameCount += 1;
        longCapture.lastRejectReason = "prepend-segment-invalid";
        longCapture.message = "向上拼接像素段生成失败，未追加。";
        await this.emitOverlayStateChanged(await this.getOverlayState());
        return;
      }
      nextFrames.unshift({ image: segment, appendFrom: 0, appendTo: seam });
    }
    if (rangeAdvance.appendHeight > 0) {
      const exactSeam = nextSize.height - rangeAdvance.appendHeight;
      const seam = findLiteSnapQuietSeamRow(
        nextFrame,
        exactSeam,
        "down",
        Math.min(48, exactSeam)
      );
      const replaceExistingBottom = exactSeam - seam;
      const segment = this.longCaptureCoordinator.createSegment(
        nextFrame,
        seam,
        nextSize.height
      );
      if (
        !segment ||
        !this.longCaptureCoordinator.trimBottom(nextFrames, replaceExistingBottom)
      ) {
        longCapture.rejectedFrameCount += 1;
        longCapture.lastRejectReason = "append-segment-invalid";
        longCapture.message = "向下拼接像素段生成失败，未追加。";
        await this.emitOverlayStateChanged(await this.getOverlayState());
        return;
      }
      nextFrames.push({
        image: segment,
        appendFrom: 0,
        appendTo: nextSize.height - seam
      });
    }
    longCapture.frames = nextFrames;
    longCapture.capturedTop = rangeAdvance.nextTop < longCapture.capturedTop
      ? rangeAdvance.nextTop
      : longCapture.capturedTop;
    longCapture.capturedBottom = rangeAdvance.nextBottom > longCapture.capturedBottom
      ? rangeAdvance.nextBottom
      : longCapture.capturedBottom;
    longCapture.stitchedHeight = nextHeight;
    this.longCaptureCoordinator.acceptFrame(
      longCapture,
      next,
      match.direction,
      rangeAdvance.nextTop
    );
    longCapture.peakMemoryBytes = Math.max(
      longCapture.peakMemoryBytes,
      this.longCaptureCoordinator.estimateMemoryBytes(longCapture)
    );
    longCapture.message = `已${match.direction === "up" ? "向上" : "向下"}补充新内容；可继续滚动或反向补齐另一端。`;
    await this.emitOverlayStateChanged(await this.getOverlayState());
  }

  private async ensureLongCaptureTargetAvailable(
    session: CaptureSession,
    longCapture: LongCaptureSession
  ): Promise<boolean> {
    if (this.e2eLongCaptureSimulation || Date.now() - longCapture.lastTargetCheckAt < 750) {
      return true;
    }
    longCapture.lastTargetCheckAt = Date.now();
    const point = {
      x: longCapture.selection.x + Math.round(longCapture.selection.width / 2),
      y: longCapture.selection.y + Math.round(longCapture.selection.height / 2)
    };
    const target = await this.captureProvider.getWindowRectAtPoint(
      session.display,
      point.x,
      point.y
    );
    if (!this.isCurrentLongCapture(longCapture, session)) {
      return false;
    }
    const targetChanged = Boolean(
      longCapture.targetWindowId &&
      target?.windowId &&
      target.windowId !== longCapture.targetWindowId
    );
    if (target && !targetChanged) {
      longCapture.targetWindowMisses = 0;
      return true;
    }

    longCapture.targetWindowMisses += 1;
    longCapture.pendingFrame = null;
    longCapture.pendingConfirmationCount = 0;
    longCapture.finalFrameUnsafe = true;
    longCapture.lastRejectReason = targetChanged
      ? "target-window-changed"
      : "target-window-unavailable";
    // Window lookup can be transiently obscured by the transparent guide,
    // system menus, or another topmost window. Never infer that the user has
    // finished and never dismiss the session. Keep retrying until the original
    // target returns; the user remains in control of Finish/Cancel/Escape.
    longCapture.message = targetChanged
      ? "暂时未识别到原目标窗口，本帧未采集；长截图会保持显示并继续重试。"
      : "目标窗口暂时不可用，本帧未采集；长截图会保持显示并继续重试。";
    await this.emitOverlayStateChanged(await this.getOverlayState());
    return false;
  }

  private async handleLongCaptureAuxiliaryWindowClosed(token: number): Promise<void> {
    const longCapture = this.longCapture;
    if (
      !longCapture ||
      longCapture.token !== token ||
      (longCapture.phase !== "capturing" && longCapture.phase !== "paused") ||
      this.recoveringLongCaptureWindows
    ) {
      return;
    }
    const session = this.session;
    if (!session || session.overlayWindow.isDestroyed()) {
      return;
    }

    // An auxiliary guide/controller window may be recreated by Windows after a
    // display/topmost transition. Recover it instead of treating that as a user
    // cancellation and making the whole long-capture UI disappear.
    this.recoveringLongCaptureWindows = true;
    try {
      longCapture.message = "长截图控制窗口已恢复；请继续手动滚动，完成后由你点击“完成并保存”。";
      this.longCaptureWindows.open(session.display, longCapture.selection, () => {
        void this.handleLongCaptureAuxiliaryWindowClosed(longCapture.token);
      });
      await this.emitOverlayStateChanged(await this.getOverlayState());
      longCapture.maskReady = await this.longCaptureWindows.revealMask(
        session.overlayWindow,
        () => this.isCurrentLongCapture(longCapture, session) &&
          (longCapture.phase === "capturing" || longCapture.phase === "paused")
      );
      if (!this.isCurrentLongCapture(longCapture, session)) {
        return;
      }
      this.longCaptureWindows.startWatch(
        session.overlayWindow,
        () => this.isCurrentLongCapture(longCapture, session) &&
          (longCapture.phase === "capturing" || longCapture.phase === "paused"),
        () => longCapture.scrollRelayInFlight
      );
      this.keepLongCaptureWindowsVisible(longCapture);
      if (longCapture.phase === "capturing") {
        this.scheduleLongCapturePoll(LONG_CAPTURE_PASSIVE_POLL_MS);
      }
    } finally {
      this.recoveringLongCaptureWindows = false;
    }
  }

  private async pauseLongCaptureAtSafetyLimit(
    longCapture: LongCaptureSession,
    reason: string
  ): Promise<void> {
    const session = this.session;
    if (
      !session ||
      !this.isCurrentLongCapture(longCapture, session) ||
      longCapture.phase !== "capturing"
    ) {
      return;
    }
    this.clearLongCapturePoll(longCapture);
    longCapture.pendingFrame = null;
    longCapture.lastRejectReason = reason;
    longCapture.phase = "paused";
    longCapture.message = "已达到图片安全容量，采集已暂停；不会自动完成或保存，请由你点击“完成并保存”或“取消”。";
    this.longCaptureWindows.startWatch(
      session.overlayWindow,
      () => this.isCurrentLongCapture(longCapture, session) && longCapture.phase === "paused",
      () => false
    );
    this.keepLongCaptureWindowsVisible(longCapture);
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
    this.clearLongCapturePoll(longCapture);
    this.longCapture = null;
    this.longCaptureWindows.close();
    await this.diagnostics.record(
      "long-capture",
      status,
      longCapture.startedAt,
      message,
      this.longCaptureCoordinator.buildDiagnosticMetrics(longCapture)
    );
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
    this.clearLongCapturePoll(longCapture);
    this.longCaptureWindows.stopWatch();
    longCapture.phase = "finishing";
    longCapture.message = "正在生成长截图…";
    await this.emitOverlayStateChanged(await this.getOverlayState());
    if (!this.isCurrentLongCapture(longCapture, session)) {
      return;
    }
    const composeStartedAt = Date.now();
    const image = this.longCaptureCoordinator.compose(
      longCapture.frames,
      longCapture.stitchedHeight,
      LONG_CAPTURE_MAX_BYTES
    );
    longCapture.composeMs += Date.now() - composeStartedAt;
    if (!image || image.isEmpty()) {
      await this.diagnostics.record(
        "long-capture",
        "failed",
        longCapture.startedAt,
        "生成长截图失败。",
        this.longCaptureCoordinator.buildDiagnosticMetrics(longCapture, {
          composeReason: this.longCaptureCoordinator.lastComposeFailure || "unknown"
        })
      );
      this.diagnostics.reportLongCaptureFailure(longCapture, "compose-failed");
      session.diagnosticOperation = "long-capture";
      session.diagnosticFinalized = true;
      this.longCapture = null;
      this.longCaptureWindows.close();
      await this.cancelCapture();
      return;
    }
    // A completed long capture is intentionally an export-only flow. Reopening
    // it in the full-screen annotation overlay obscures the application and
    // makes a long image appear much larger than the original selected region.
    // Save it immediately using the existing LiteSnap directory and format.
    session.longCaptureExportWidth = Math.max(1, Math.round(longCapture.selection.width));
    const exportStartedAt = Date.now();
    const output = this.imageService.normalizeLongCaptureExportSize(session, image);
    try {
      const settings = await this.settingsStore.getSettings();
      if (!this.isCurrentLongCapture(longCapture, session)) {
        return;
      }
      const savedPath = await this.imageStore.saveImage(output, settings);
      if (!this.isCurrentLongCapture(longCapture, session)) {
        return;
      }
      await this.recordHistory(output, "capture-save");
      if (!this.isCurrentLongCapture(longCapture, session)) {
        return;
      }
      longCapture.exportMs += Date.now() - exportStartedAt;
      await this.diagnostics.record(
        "long-capture",
        status,
        longCapture.startedAt,
        message,
        this.longCaptureCoordinator.buildDiagnosticMetrics(longCapture, {
          stitchedHeight: output.getSize().height,
          width: output.getSize().width
        })
      );
      if (!this.isCurrentLongCapture(longCapture, session)) {
        return;
      }
      session.diagnosticOperation = "long-capture";
      session.diagnosticFinalized = true;
      this.longCapture = null;
      this.longCaptureWindows.close();
      await this.cancelCapture();
      this.commitService.revealSavedCapture(savedPath);
    } catch (error) {
      longCapture.exportMs += Date.now() - exportStartedAt;
      if (this.isCurrentLongCapture(longCapture, session)) {
        longCapture.phase = "capturing";
        longCapture.message = "保存长截图失败，请检查保存目录后点击完成重试。";
        this.longCaptureWindows.startWatch(
          session.overlayWindow,
          () => this.isCurrentLongCapture(longCapture, session) && longCapture.phase === "capturing",
          () => longCapture.scrollRelayInFlight
        );
        await this.emitOverlayStateChanged(await this.getOverlayState());
      }
      console.warn("[litesnap] long capture save failed", error);
    }
  }

  public async commitCapture(
    input: LiteSnapCommitCaptureInput
  ): Promise<LiteSnapCommitCaptureResult> {
    return this.commitService.commit(this.session, input);
  }

  public async recordHistory(
    image: NativeImage,
    source: LiteSnapHistorySource
  ): Promise<void> {
    return this.commitService.recordHistory(image, source);
  }

  public async recordRecentColor(color: string): Promise<string[]> {
    return this.commitService.recordRecentColor(color, this.session);
  }

  private async recognizeSelectionText(
    input: LiteSnapRecognizeTextInput,
    options?: { languagePreference?: LiteSnapOcrLanguagePreference }
  ): Promise<
    | { ok: true; text: string }
    | { ok: false; message: string; ocrIssue?: LiteSnapOcrIssue }
  > {
    const session = this.session;
    if (!session) return { ok: false, message: "截图会话已结束。" };
    if (!session.sourceImage || session.sourceImage.isEmpty()) {
      return { ok: false, message: "截图还在准备中，请稍候。" };
    }
    const cropped = this.imageService.cropSelection(
      session as CaptureSession & { sourceImage: NativeImage },
      input.selection
    );
    if (!cropped || cropped.isEmpty()) return { ok: false, message: "当前选区无效。" };
    return this.ocrService.recognize(cropped, options);
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
      await this.diagnostics.record(
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
    return this.ocrService.probe();
  }

  public listOcrCapabilities() {
    return this.ocrService.listCapabilities();
  }

  public installOcrCapabilities(languages?: LiteSnapOcrCapabilityLanguage[]) {
    return this.ocrService.installCapabilities(languages);
  }

  public async cancelCapture(): Promise<boolean> {
    this.stopDisplayFollowWatch();
    this.switchingDisplay = false;
    const longCapture = this.longCapture;
    if (longCapture) {
      this.clearLongCapturePoll(longCapture);
      this.longCapture = null;
      this.longCaptureWindows.close();
      await this.diagnostics.record(
        "long-capture",
        "cancelled",
        longCapture.startedAt,
        "已取消长截图。",
        this.longCaptureCoordinator.buildDiagnosticMetrics(longCapture)
      );
    }
    const session = this.session;
    this.session = null;
    if (!session) {
      return false;
    }

    if (!session.diagnosticFinalized) {
      session.diagnosticFinalized = true;
      await this.diagnostics.record(
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
      this.overlayLifecycle.park(session.overlayWindow);
    } else {
      await this.emitOverlayStateChanged(null);
    }
    this.frameCacheService.warmDisplay(display);
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

      this.overlayLifecycle.activate(overlayWindow, display);
      this.overlayLifecycle.showPreparing(overlayWindow);
      await this.overlayLifecycle.prepareRenderer(overlayWindow);

      const frames = await this.frameCacheService.resolve(display);
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
        this.frameCacheService.warmDisplay(display);
      } else {
        this.frameCacheService.store(display, frames);
      }

      await this.emitOverlayStateChanged(await this.getOverlayState());
      await this.overlayLifecycle.showInteractive(overlayWindow);
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
      this.frameCacheService.warmDisplay(display);
    }
  }

  private ensureOverlayWindow(display: Display): BrowserWindow {
    const existing = this.overlayWindow;
    if (existing && !existing.isDestroyed()) {
      return existing;
    }

    const overlayWindow = createLiteSnapOverlayWindow(display);
    overlayWindow.on("closed", () => {
      if (this.overlayWindow === overlayWindow) {
        this.overlayWindow = null;
      }
      if (this.session?.overlayWindow === overlayWindow) {
        const longCapture = this.longCapture;
        if (longCapture) {
          this.clearLongCapturePoll(longCapture);
          this.longCapture = null;
          this.longCaptureWindows.close();
          this.diagnostics.reportLongCaptureFailure(longCapture, "overlay-window-closed");
          void this.diagnostics.record(
            "long-capture",
            "failed",
            longCapture.startedAt,
            "长截图遮罩窗口意外关闭。",
            this.longCaptureCoordinator.buildDiagnosticMetrics(longCapture)
          );
        }
        this.session = null;
      }
    });
    this.overlayLifecycle.park(overlayWindow);
    this.overlayWindow = overlayWindow;
    return overlayWindow;
  }

  private keepLongCaptureWindowsVisible(longCapture: LongCaptureSession): void {
    if (
      !this.isCurrentLongCapture(longCapture) ||
      (longCapture.phase !== "capturing" && longCapture.phase !== "paused")
    ) {
      return;
    }
    const mask = this.session?.overlayWindow;
    if (mask && !mask.isDestroyed()) {
      this.longCaptureWindows.ensureStack(mask, !longCapture.scrollRelayInFlight);
    }
  }

  private isCurrentLongCapture(
    longCapture: LongCaptureSession,
    session?: CaptureSession
  ): boolean {
    const current = this.longCapture;
    return current === longCapture &&
      current.token === longCapture.token &&
      (!session || this.session === session);
  }

  private async emitOverlayStateChanged(state: LiteSnapOverlayState | null): Promise<void> {
    const overlay = this.overlayWindow;
    if (overlay && !overlay.isDestroyed() && !overlay.webContents.isDestroyed()) {
      overlay.webContents.send(IPC_CHANNELS.liteSnapOverlayStateChanged, state);
    }
    const controller = this.longCaptureWindows.controller;
    if (controller && !controller.isDestroyed() && !controller.webContents.isDestroyed()) {
      const controllerState = state
        ? { ...state, imageDataUrl: null, sourceImageDataUrl: null }
        : null;
      controller.webContents.send(IPC_CHANNELS.liteSnapOverlayStateChanged, controllerState);
    }
  }

  public ensureSourceImageDataUrl(): string | null {
    return this.imageService.ensureSourceDataUrl(this.session);
  }
}
