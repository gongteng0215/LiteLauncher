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
  type LiteSnapSettings
} from "../../shared/litesnap";
import { IPC_CHANNELS } from "../../shared/channels";
import {
  createLiteSnapCaptureProvider,
  type LiteSnapCaptureProvider
} from "./capture-provider";
import { createLiteSnapOverlayWindow } from "./overlay-window";
import { LiteSnapImageStore } from "./image-store";
import { LiteSnapPinWindowManager } from "./pin-window-manager";
import { LiteSnapSettingsStore } from "./settings";

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
const FRAME_CACHE_REFRESH_MAX_MS = 8000;
const PREVIEW_JPEG_QUALITY = 92;

export class LiteSnapCaptureSessionManager {
  private session: CaptureSession | null = null;
  private overlayWindow: BrowserWindow | null = null;
  private overlayReadyPromise: Promise<void> | null = null;
  private frameCache: DisplayFrameCache | null = null;
  private frameCacheWarmPromise: Promise<void> | null = null;
  private frameCacheWarmDisplayId: number | null = null;
  private frameCacheRefreshTimer: NodeJS.Timeout | null = null;
  private frameCacheIdleRefreshCycles = 0;
  private readonly captureProvider: LiteSnapCaptureProvider;

  public constructor(
    private readonly settingsStore: LiteSnapSettingsStore,
    private readonly imageStore: LiteSnapImageStore,
    private readonly pinWindowManager: LiteSnapPinWindowManager
  ) {
    this.captureProvider = createLiteSnapCaptureProvider();
  }

  public prewarmCaptureCache(): void {
    if (process.platform !== "win32") {
      return;
    }

    this.startFrameCacheRefresh();
    this.warmDisplayFrameCache(
      screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
    );
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

    const resolvedFrames = await Promise.all([
      this.waitForOverlayReady(overlayWindow),
      this.prepareOverlayRenderer(overlayWindow),
      beforeImageCapture?.(),
      this.settingsStore.getSettings().then((settings) => {
        if (this.session?.captureId === captureId) {
          this.session.settings = settings;
        }
      }),
      framesPromise
    ]).then((results) => results[4]);

    if (this.session?.captureId !== captureId) {
      return false;
    }

    if (!resolvedFrames) {
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
      message: "Screenshot pinned to the screen."
    };
  }

  public async cancelCapture(): Promise<boolean> {
    const session = this.session;
    this.session = null;
    if (!session) {
      return false;
    }

    const display = session.display;
    if (!session.overlayWindow.isDestroyed()) {
      session.overlayWindow.hide();
      this.parkOverlayWindow(session.overlayWindow);
    }
    await this.emitOverlayStateChanged(null);
    this.warmDisplayFrameCache(display);
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

    if (!this.overlayReadyPromise) {
      this.overlayReadyPromise = new Promise<void>((resolve) => {
        const finish = (): void => {
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
      });
    }

    return this.overlayReadyPromise;
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

    this.frameCacheWarmDisplayId = display.id;
    this.frameCacheWarmPromise = task().finally(() => {
      this.frameCacheWarmPromise = null;
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

      const sourceImage = await this.captureProvider.captureSourceImage(display);
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

    const frames = await this.captureProvider.captureDisplayFrames(display);
    if (
      !frames ||
      frames.previewImage.isEmpty() ||
      frames.sourceImage.isEmpty()
    ) {
      return null;
    }

    return {
      previewImage: frames.previewImage,
      previewImageDataUrl: this.encodePreviewDataUrl(frames.previewImage),
      sourceImage: frames.sourceImage,
      fromCache: false
    };
  }

  private async captureAndStoreFrameCache(display: Display): Promise<void> {
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
