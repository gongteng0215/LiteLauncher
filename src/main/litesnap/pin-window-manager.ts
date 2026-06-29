import { BrowserWindow, clipboard, ipcMain, nativeImage, screen, type BrowserWindowConstructorOptions, type NativeImage } from "electron";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { type LiteSnapWindowRect } from "../../shared/litesnap";

const PIN_VISUAL_STATE_CHANNEL = "litesnap-pin:visual-state";
const PIN_COPY_CHANNEL = "litesnap-pin:copy";

type PinWindowMeta = {
  baseWidth: number;
  baseHeight: number;
  lastScale: number;
  lastOpacity: number;
  imagePath: string;
};

let pinVisualHandlersRegistered = false;
let pinCopyHandlerRegistered = false;
const pinWindowMeta = new Map<number, PinWindowMeta>();

function ensurePinCopyHandler(): void {
  if (pinCopyHandlerRegistered) {
    return;
  }

  pinCopyHandlerRegistered = true;
  ipcMain.on(PIN_COPY_CHANNEL, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || window.isDestroyed()) {
      return;
    }

    const meta = pinWindowMeta.get(window.id);
    if (!meta?.imagePath) {
      return;
    }

    const image = nativeImage.createFromPath(meta.imagePath);
    if (!image.isEmpty()) {
      clipboard.writeImage(image);
    }
  });
}

function ensurePinVisualHandlers(): void {
  if (pinVisualHandlersRegistered) {
    return;
  }

  pinVisualHandlersRegistered = true;
  ipcMain.on(PIN_VISUAL_STATE_CHANNEL, (event, scale: number, opacity: number) => {
    if (!Number.isFinite(scale) || !Number.isFinite(opacity)) {
      return;
    }

    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || window.isDestroyed()) {
      return;
    }

    const meta = pinWindowMeta.get(window.id);
    if (!meta) {
      return;
    }

    const nextScale = Math.min(4, Math.max(0.2, scale));
    const nextOpacity = Math.min(1, Math.max(0.2, opacity));
    const scaleChanged = Math.abs(nextScale - meta.lastScale) > 0.001;
    const opacityChanged = Math.abs(nextOpacity - meta.lastOpacity) > 0.001;

    if (scaleChanged) {
      const [x, y] = window.getPosition();
      const [currentWidth, currentHeight] = window.getSize();
      const nextWidth = Math.max(40, Math.round(meta.baseWidth * nextScale));
      const nextHeight = Math.max(40, Math.round(meta.baseHeight * nextScale));
      const nextX = Math.round(x + (currentWidth - nextWidth) / 2);
      const nextY = Math.round(y + (currentHeight - nextHeight) / 2);

      window.setBounds(
        {
          x: nextX,
          y: nextY,
          width: nextWidth,
          height: nextHeight
        },
        false
      );
      meta.lastScale = nextScale;
    }

    if (opacityChanged) {
      window.setOpacity(nextOpacity);
      meta.lastOpacity = nextOpacity;
    }
  });
}

function resolvePinPreloadPath(): string {
  return path.join(__dirname, "../../preload/litesnap-pin.js");
}

function preparePinDisplayImage(
  image: NativeImage,
  windowWidth: number,
  windowHeight: number,
  scaleFactor: number
): NativeImage {
  const targetWidth = Math.max(1, Math.round(windowWidth * scaleFactor));
  const targetHeight = Math.max(1, Math.round(windowHeight * scaleFactor));
  const size = image.getSize();
  const targetPixels = targetWidth * targetHeight;

  if (size.width === targetWidth && size.height === targetHeight) {
    return image;
  }

  if (size.width * size.height <= targetPixels) {
    return image.resize({
      width: targetWidth,
      height: targetHeight,
      quality: "good"
    });
  }

  return image.resize({
    width: targetWidth,
    height: targetHeight,
    quality: "good"
  });
}

function imageLikelyHasTransparency(image: NativeImage): boolean {
  if (image.isEmpty()) {
    return false;
  }

  try {
    const bitmap = image.toBitmap();
    const step = Math.max(4, Math.floor(bitmap.length / 4 / 2048)) * 4;
    for (let offset = 3; offset < bitmap.length; offset += step) {
      if (bitmap[offset] < 250) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

function buildPinWindowHtml(
  imageFileName: string,
  options: { exact: boolean; imageWidth: number; imageHeight: number }
): string {
  const shellRadius = options.exact ? "0" : "14px";
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>LiteSnap Pin</title>
    <style>
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #000000;
        font-family: "Segoe UI", "Microsoft YaHei", sans-serif;
      }
      .pin-shell {
        position: fixed;
        inset: 0;
        -webkit-app-region: drag;
        border-radius: ${shellRadius};
        overflow: hidden;
        background: #000000;
      }
      .pin-shell.is-border-enabled {
        outline: 1px solid rgba(255, 255, 255, 0.45);
        outline-offset: -1px;
      }
      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: fill;
        pointer-events: none;
        user-select: none;
        -webkit-user-drag: none;
      }
      .pin-close {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 28px;
        height: 28px;
        border: 0;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.72);
        color: #f8fafc;
        cursor: pointer;
        -webkit-app-region: no-drag;
      }
      .pin-menu {
        position: absolute;
        min-width: 168px;
        padding: 6px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 10px;
        background: rgba(15, 23, 42, 0.94);
        color: #e2e8f0;
        box-shadow: 0 14px 36px rgba(2, 6, 23, 0.36);
        -webkit-app-region: no-drag;
      }
      .pin-menu[hidden] {
        display: none;
      }
      .pin-menu button {
        display: block;
        width: 100%;
        padding: 7px 10px;
        border: 0;
        border-radius: 7px;
        background: transparent;
        color: inherit;
        font: 13px/1.25 "Segoe UI", "Microsoft YaHei", sans-serif;
        text-align: left;
        cursor: pointer;
      }
      .pin-menu button:hover {
        background: rgba(125, 211, 252, 0.16);
      }
      .pin-menu__label {
        padding: 5px 10px 7px;
        color: #94a3b8;
        font-size: 11px;
      }
      .pin-menu__divider {
        height: 1px;
        margin: 5px 4px;
        background: rgba(255, 255, 255, 0.1);
      }
    </style>
  </head>
  <body>
    <div class="pin-shell" id="pin-shell">
      <img
        src="${imageFileName}"
        alt="LiteSnap Pinned Image"
        width="${options.imageWidth}"
        height="${options.imageHeight}"
        decoding="sync"
        draggable="false"
      />
      <button type="button" class="pin-close" id="close-btn" title="关闭">×</button>
      <div class="pin-menu" id="pin-menu" hidden>
        <div class="pin-menu__label" id="pin-menu-label">缩放 100% / 透明度 100%</div>
        <button type="button" data-command="zoom-in">放大</button>
        <button type="button" data-command="zoom-out">缩小</button>
        <button type="button" data-command="opacity-up">增加不透明度</button>
        <button type="button" data-command="opacity-down">降低不透明度</button>
        <button type="button" data-command="reset">重置缩放和透明度</button>
        <div class="pin-menu__divider"></div>
        <button type="button" data-command="toggle-border">切换边框</button>
        <div class="pin-menu__divider"></div>
        <button type="button" data-command="close">关闭贴图</button>
      </div>
    </div>
    <script>
      const shell = document.getElementById("pin-shell");
      const menu = document.getElementById("pin-menu");
      const menuLabel = document.getElementById("pin-menu-label");
      const pinApi = window.liteSnapPin;
      let scale = 1;
      let opacity = 1;
      let visualFrame = 0;

      function applyVisualState() {
        if (visualFrame) {
          return;
        }

        visualFrame = requestAnimationFrame(function () {
          visualFrame = 0;
          pinApi?.setVisualState(scale, opacity);
          if (menuLabel) {
            menuLabel.textContent =
              "缩放 " + Math.round(scale * 100) + "% / 透明度 " + Math.round(opacity * 100) + "%";
          }
        });
      }

      function hideMenu() {
        if (menu) {
          menu.hidden = true;
        }
      }

      function showMenu(x, y) {
        if (!menu) {
          return;
        }
        menu.hidden = false;
        const rect = menu.getBoundingClientRect();
        menu.style.left = Math.min(x, window.innerWidth - rect.width - 8) + "px";
        menu.style.top = Math.min(y, window.innerHeight - rect.height - 8) + "px";
      }

      function resetTransform() {
        scale = 1;
        opacity = 1;
        applyVisualState();
      }

      function runCommand(command) {
        if (command === "zoom-in") {
          scale = Math.min(4, scale * 1.12);
        } else if (command === "zoom-out") {
          scale = Math.max(0.2, scale * 0.88);
        } else if (command === "opacity-up") {
          opacity = Math.min(1, opacity + 0.08);
        } else if (command === "opacity-down") {
          opacity = Math.max(0.2, opacity - 0.08);
        } else if (command === "reset") {
          resetTransform();
          return;
        } else if (command === "toggle-border") {
          shell?.classList.toggle("is-border-enabled");
          return;
        } else if (command === "close") {
          window.close();
          return;
        }
        applyVisualState();
      }

      document.getElementById("close-btn")?.addEventListener("click", function () {
        window.close();
      });
      window.addEventListener("dblclick", function () {
        pinApi?.copyToClipboard?.();
      });
      window.addEventListener("wheel", function (event) {
        event.preventDefault();
        if (event.ctrlKey) {
          opacity = Math.min(1, Math.max(0.2, opacity + (event.deltaY < 0 ? 0.05 : -0.05)));
        } else {
          scale = Math.min(4, Math.max(0.2, scale * (event.deltaY < 0 ? 1.08 : 0.92)));
        }
        applyVisualState();
      }, { passive: false });
      window.addEventListener("contextmenu", function (event) {
        event.preventDefault();
        showMenu(event.clientX, event.clientY);
      });
      window.addEventListener("pointerdown", function (event) {
        if (!menu || menu.hidden || menu.contains(event.target)) {
          return;
        }
        hideMenu();
      });
      menu?.addEventListener("click", function (event) {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) {
          return;
        }
        runCommand(target.dataset.command || "");
        hideMenu();
      });
      window.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          event.preventDefault();
          if (menu && !menu.hidden) {
            hideMenu();
          } else {
            window.close();
          }
        } else if (event.key === "0") {
          event.preventDefault();
          resetTransform();
        }
      });
    </script>
  </body>
</html>`;
}

async function writePinWindowAssets(
  displayImage: NativeImage,
  exact: boolean
): Promise<{ htmlPath: string; imagePath: string; cleanup: () => Promise<void> }> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ll-pin-"));
  const imageSize = displayImage.getSize();
  const usePng = imageLikelyHasTransparency(displayImage);
  const imageFileName = usePng ? "pin.png" : "pin.jpg";
  const imagePath = path.join(dir, imageFileName);
  const htmlPath = path.join(dir, "pin.html");
  const imageBytes = usePng ? displayImage.toPNG() : displayImage.toJPEG(88);

  await Promise.all([
    fs.writeFile(imagePath, imageBytes),
    fs.writeFile(
      htmlPath,
      buildPinWindowHtml(imageFileName, {
        exact,
        imageWidth: imageSize.width,
        imageHeight: imageSize.height
      }),
      "utf8"
    )
  ]);

  return {
    htmlPath,
    imagePath,
    cleanup: async () => {
      await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined);
    }
  };
}

function createPinBrowserWindowOptions(
  bounds: { x: number; y: number; width: number; height: number }
): BrowserWindowConstructorOptions {
  return {
    ...bounds,
    frame: false,
    transparent: false,
    backgroundColor: "#000000",
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    hasShadow: false,
    thickFrame: false,
    roundedCorners: false,
    show: false,
    webPreferences: {
      preload: resolvePinPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false
    }
  };
}

export class LiteSnapPinWindowManager {
  private readonly windows = new Set<BrowserWindow>();
  private hiddenByManager = false;
  private prewarmedWindow: BrowserWindow | null = null;

  public prewarmPinWindow(): void {
    if (process.platform !== "win32" || this.prewarmedWindow) {
      return;
    }

    const window = new BrowserWindow(
      createPinBrowserWindowOptions({
        x: -32000,
        y: -32000,
        width: 1,
        height: 1
      })
    );
    window.on("closed", () => {
      if (this.prewarmedWindow === window) {
        this.prewarmedWindow = null;
      }
    });

    void window.loadURL("about:blank").then(() => {
      if (!window.isDestroyed()) {
        this.prewarmedWindow = window;
      }
    });
  }

  private takePrewarmedWindow(
    bounds: { x: number; y: number; width: number; height: number }
  ): BrowserWindow {
    const prewarmed = this.prewarmedWindow;
    this.prewarmedWindow = null;
    if (prewarmed && !prewarmed.isDestroyed()) {
      prewarmed.setBounds(bounds, false);
      prewarmed.setOpacity(1);
      return prewarmed;
    }

    return new BrowserWindow(createPinBrowserWindowOptions(bounds));
  }

  private async revealPinWindow(window: BrowserWindow): Promise<void> {
    await new Promise<void>((resolve) => {
      if (window.isDestroyed() || window.isVisible()) {
        resolve();
        return;
      }

      let settled = false;
      const finish = (): void => {
        if (settled) {
          return;
        }
        settled = true;
        resolve();
      };

      // The pin HTML has already finished loading before revealPinWindow runs,
      // so if the webContents is idle we can show immediately. A reused
      // prewarmed window already emitted "ready-to-show" for its about:blank
      // load and will not emit it again, so relying solely on that event would
      // hang the second pin onward. Keep the event as a fast path but always
      // fall back to a short timer so the window is guaranteed to appear.
      if (!window.webContents.isLoading()) {
        finish();
        return;
      }

      window.once("ready-to-show", finish);
      const timer = setTimeout(finish, 150);
      timer.unref?.();
    });

    if (!window.isDestroyed()) {
      window.show();
    }
  }

  public async pinClipboardImage(): Promise<boolean> {
    const image = clipboard.readImage();
    if (!image || image.isEmpty()) {
      return false;
    }

    return this.pinImage(image);
  }

  public async pinImage(
    image: NativeImage,
    placement?: LiteSnapWindowRect
  ): Promise<boolean> {
    if (!image || image.isEmpty()) {
      return false;
    }

    const size = image.getSize();
    if (size.width <= 0 || size.height <= 0) {
      return false;
    }

    let x: number;
    let y: number;
    let width: number;
    let height: number;
    let display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());

    if (
      placement &&
      placement.width > 0 &&
      placement.height > 0
    ) {
      x = Math.round(placement.x);
      y = Math.round(placement.y);
      width = Math.max(1, Math.round(placement.width));
      height = Math.max(1, Math.round(placement.height));
      display = screen.getDisplayMatching({ x, y, width, height });
    } else {
      display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
      const maxWidth = Math.max(280, Math.floor(display.workArea.width * 0.42));
      const maxHeight = Math.max(220, Math.floor(display.workArea.height * 0.42));
      const scale = Math.min(maxWidth / size.width, maxHeight / size.height, 1);
      width = Math.max(180, Math.round(size.width * scale));
      height = Math.max(120, Math.round(size.height * scale));
      x = Math.round(display.workArea.x + (display.workArea.width - width) / 2);
      y = Math.round(display.workArea.y + (display.workArea.height - height) / 2);
    }

    const exactPlacement = Boolean(
      placement && placement.width > 0 && placement.height > 0
    );
    const displayImage = preparePinDisplayImage(
      image,
      width,
      height,
      display.scaleFactor
    );

    ensurePinVisualHandlers();
    ensurePinCopyHandler();

    const window = this.takePrewarmedWindow({ x, y, width, height });
    void this.prewarmPinWindow();

    const assets = await writePinWindowAssets(displayImage, exactPlacement);

    pinWindowMeta.set(window.id, {
      baseWidth: width,
      baseHeight: height,
      lastScale: 1,
      lastOpacity: 1,
      imagePath: assets.imagePath
    });

    window.setAlwaysOnTop(true, "screen-saver");
    this.windows.add(window);
    window.webContents.on("before-input-event", (event, input) => {
      if (input.type === "keyDown" && input.key === "Escape") {
        event.preventDefault();
        window.close();
      }
    });

    window.on("closed", () => {
      pinWindowMeta.delete(window.id);
      this.windows.delete(window);
      void assets.cleanup();
    });

    try {
      await window.loadFile(assets.htmlPath);
      await this.revealPinWindow(window);
    } catch (error) {
      pinWindowMeta.delete(window.id);
      await assets.cleanup();
      if (!window.isDestroyed()) {
        window.close();
      }
      throw error;
    }

    return true;
  }

  public togglePinnedWindowsVisibility(): { hidden: boolean; count: number } {
    const windows = [...this.windows].filter((window) => !window.isDestroyed());
    if (windows.length === 0) {
      this.hiddenByManager = false;
      return { hidden: false, count: 0 };
    }

    const shouldHide = windows.some((window) => window.isVisible());
    for (const window of windows) {
      if (shouldHide) {
        window.hide();
      } else {
        window.showInactive();
      }
    }
    this.hiddenByManager = shouldHide;
    return { hidden: this.hiddenByManager, count: windows.length };
  }
}
