import {
  BrowserWindow,
  clipboard,
  nativeImage,
  screen,
  shell,
  type Display,
  type NativeImage
} from "electron";

import {
  createDefaultLiteSnapSettings,
  type LiteSnapCommitCaptureInput,
  type LiteSnapCommitCaptureResult,
  type LiteSnapOverlaySelection,
  type LiteSnapOverlayState,
  type LiteSnapRecognizeTextInput,
  type LiteSnapRecognizeTextResult,
  type LiteSnapSettings,
  normalizeLiteSnapOcrText
} from "../../shared/litesnap";
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
import { createLiteSnapOverlayWindow } from "./overlay-window";
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
  overlayWindow: BrowserWindow;
  display: Display;
  settings: LiteSnapSettings;
  previewImage: NativeImage | null;
  previewImageDataUrl: string | null;
  sourceImage: NativeImage | null;
  sourceImageDataUrl: string | null;
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

export class LiteSnapCaptureSessionManager {
  private session: CaptureSession | null = null;
  private overlayWindow: BrowserWindow | null = null;
  private overlayReadyPromise: Promise<void> | null = null;
  private startingCapture = false;
  private frameCache: DisplayFrameCache | null = null;
  private frameCacheWarmPromise: Promise<void> | null = null;
  private frameCacheWarmDisplayId: number | null = null;
  private frameCacheRefreshTimer: NodeJS.Timeout | null = null;
  private frameCacheIdleRefreshCycles = 0;
  private frameCacheWarmGeneration = 0;
  private idleFrameCachePaused = false;
  private readonly captureProvider: LiteSnapCaptureProvider;

  public constructor(
    private readonly settingsStore: LiteSnapSettingsStore,
    private readonly imageStore: LiteSnapImageStore,
    private readonly pinWindowManager: LiteSnapPinWindowManager
  ) {
    this.captureProvider = createLiteSnapCaptureProvider();
  }

  public prewarmCaptureCache(): void {
    if (process.platform !== "win32" || this.idleFrameCachePaused) {
      return;
    }

    this.startFrameCacheRefresh();
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
    if (!this.session) {
      this.startFrameCacheRefresh();
    }
  }

  public async prewarmOverlay(): Promise<boolean> {
    if (process.platform !== "win32") {
      return false;
    }

    this.prewarmCaptureCache();

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
      return await this.startCaptureInternal(beforeImageCapture);
    } finally {
      this.startingCapture = false;
    }
  }

  private async startCaptureInternal(
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
      overlayWindow,
      display,
      settings: createDefaultLiteSnapSettings(),
      previewImage: null,
      previewImageDataUrl: null,
      sourceImage: null,
      sourceImageDataUrl: null
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
    return true;
  }

  public async getOverlayState(): Promise<LiteSnapOverlayState | null> {
    if (!this.session) {
      return null;
    }

    const settings = this.session.settings;
    return {
      captureId: this.session.captureId,
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
      annotationFillShapes: settings.annotationFillShapes
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

    if (input.action === "copy") {
      clipboard.writeImage(cropped);
      await this.cancelCapture();
      return {
        ok: true,
        message: "Screenshot copied to the clipboard."
      };
    }

    if (input.action === "save") {
      try {
        const settings = await this.settingsStore.getSettings();
        await this.cancelCapture();
        await this.yieldAfterOverlayTeardown();
        const savedPath = await this.imageStore.saveImage(cropped, settings);
        this.revealSavedCapture(savedPath);
        return {
          ok: true,
          message: `Screenshot saved: ${savedPath}`,
          savedPath
        };
      } catch (error) {
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

    await this.cancelCapture();
    return {
      ok: true,
      message: "Screenshot pinned to the screen and copied to the clipboard."
    };
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
    const result = await this.recognizeSelectionText(input);
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
    return result;
  }

  public listOcrCapabilities() {
    return listLiteSnapOcrCapabilities();
  }

  public installOcrCapabilities(languages?: LiteSnapOcrCapabilityLanguage[]) {
    return installLiteSnapOcrCapabilities(languages);
  }

  public async cancelCapture(): Promise<boolean> {
    const session = this.session;
    this.session = null;
    if (!session) {
      return false;
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
    if (!this.idleFrameCachePaused) {
      this.startFrameCacheRefresh();
    }
    return true;
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
    const overlayWindow = this.overlayWindow;
    if (!overlayWindow || overlayWindow.isDestroyed() || overlayWindow.webContents.isDestroyed()) {
      return;
    }

    overlayWindow.webContents.send(IPC_CHANNELS.liteSnapOverlayStateChanged, state);
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
