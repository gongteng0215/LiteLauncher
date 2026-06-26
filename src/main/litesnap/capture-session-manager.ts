import {
  clipboard,
  nativeImage,
  screen,
  shell,
  type BrowserWindow,
  type Display,
  type NativeImage
} from "electron";

import {
  type LiteSnapCommitCaptureInput,
  type LiteSnapCommitCaptureResult,
  type LiteSnapOverlaySelection,
  type LiteSnapOverlayState
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
  previewImage: NativeImage | null;
  previewImageDataUrl: string | null;
  sourceImage: NativeImage | null;
  sourceImageDataUrl: string | null;
};

export class LiteSnapCaptureSessionManager {
  private session: CaptureSession | null = null;
  private overlayWindow: BrowserWindow | null = null;
  private readonly captureProvider: LiteSnapCaptureProvider;

  public constructor(
    private readonly settingsStore: LiteSnapSettingsStore,
    private readonly imageStore: LiteSnapImageStore,
    private readonly pinWindowManager: LiteSnapPinWindowManager
  ) {
    this.captureProvider = createLiteSnapCaptureProvider();
  }

  public async prewarmOverlay(): Promise<boolean> {
    if (process.platform !== "win32") {
      return false;
    }

    this.ensureOverlayWindow(
      screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
    );
    return true;
  }

  public async startCapture(
    beforeImageCapture?: () => Promise<void> | void
  ): Promise<boolean> {
    if (process.platform !== "win32") {
      return false;
    }

    await this.cancelCapture();

    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const overlayWindow = this.ensureOverlayWindow(display);
    this.activateOverlayWindow(overlayWindow, display);
    await this.prepareOverlayRenderer(overlayWindow);

    const captureId = `capture-${Date.now()}`;
    this.session = {
      captureId,
      overlayWindow,
      display,
      previewImage: null,
      previewImageDataUrl: null,
      sourceImage: null,
      sourceImageDataUrl: null
    };

    await beforeImageCapture?.();
    const prepared = await this.prepareSessionImage(captureId, display);
    if (!prepared) {
      return false;
    }
    // The high-resolution source image must be captured while the overlay is
    // still hidden. Capturing it after showInteractiveOverlay would bake the
    // selection box, handles, and toolbar into the saved screenshot.
    await this.upgradeSessionSourceImage(captureId, display);
    await this.emitOverlayStateChanged(await this.getOverlayState());
    await this.showInteractiveOverlay(overlayWindow);
    return true;
  }

  public async getOverlayState(): Promise<LiteSnapOverlayState | null> {
    if (!this.session) {
      return null;
    }

    const settings = await this.settingsStore.getSettings();
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
      await this.emitOverlayStateChanged(null);
      return false;
    }

    if (!session.overlayWindow.isDestroyed()) {
      session.overlayWindow.hide();
      this.parkOverlayWindow(session.overlayWindow);
    }
    await this.emitOverlayStateChanged(null);
    return true;
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

  private async waitForOverlayPaint(overlayWindow: BrowserWindow): Promise<void> {
    if (overlayWindow.isDestroyed() || overlayWindow.webContents.isDestroyed()) {
      return;
    }

    // Wait for two animation frames so the freshly applied screenshot frame is
    // actually painted into the (still transparent) window before we reveal it.
    const painted = overlayWindow.webContents
      .executeJavaScript(
        "new Promise((resolve) => { requestAnimationFrame(() => requestAnimationFrame(() => resolve(true))); });",
        true
      )
      .catch(() => undefined);
    const fallback = new Promise<void>((resolve) => setTimeout(resolve, 120));
    await Promise.race([painted, fallback]);
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
    // The window is parked at opacity 0, so showing it cannot flash the stale
    // previous screenshot. Reveal it only once the new frame has painted.
    overlayWindow.show();
    await this.waitForOverlayPaint(overlayWindow);
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

  private async prepareSessionImage(
    captureId: string,
    display: Display
  ): Promise<boolean> {
    const image = await this.captureProvider.capturePreviewImage(display);
    if (!image || image.isEmpty()) {
      if (this.session?.captureId === captureId) {
        await this.cancelCapture();
      }
      return false;
    }

    if (this.session?.captureId === captureId) {
      this.session.previewImage = image;
      this.session.previewImageDataUrl = image.toDataURL();
      return true;
    }

    return false;
  }

  private async upgradeSessionSourceImage(
    captureId: string,
    display: Display
  ): Promise<void> {
    const image = await this.captureProvider.captureSourceImage(display);
    if (!image || image.isEmpty()) {
      return;
    }

    if (this.session?.captureId === captureId) {
      this.session.sourceImage = image;
      this.session.sourceImageDataUrl = image.toDataURL();
    }
  }

  private resolveCommitImage(
    session: CaptureSession & { sourceImage: NativeImage },
    input: LiteSnapCommitCaptureInput
  ): NativeImage | null {
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
