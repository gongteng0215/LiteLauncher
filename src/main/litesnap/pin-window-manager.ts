import { BrowserWindow, clipboard, globalShortcut, ipcMain, screen, type BrowserWindowConstructorOptions, type NativeImage } from "electron";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { type LiteSnapWindowRect } from "../../shared/litesnap";

const PIN_SET_OPACITY_CHANNEL = "litesnap-pin:set-opacity";
const PIN_RESET_SIZE_CHANNEL = "litesnap-pin:reset-size";
const PIN_COPY_CHANNEL = "litesnap-pin:copy";
const PIN_SAVE_CHANNEL = "litesnap-pin:save";
const PIN_DRAG_BEGIN_CHANNEL = "litesnap-pin:drag-begin";
const PIN_MOVE_CHANNEL = "litesnap-pin:move-to";
const PIN_DRAG_END_CHANNEL = "litesnap-pin:drag-end";
const PIN_SET_CLICK_THROUGH_CHANNEL = "litesnap-pin:set-click-through";
const PIN_CLOSE_ALL_CHANNEL = "litesnap-pin:close-all";
const PIN_IMAGE_UPDATED_CHANNEL = "litesnap-pin:image-updated";
const PIN_CLICK_THROUGH_CHANGED_CHANNEL = "litesnap-pin:click-through-changed";
const PIN_CLICK_THROUGH_ESCAPE_ACCELERATOR = "Escape";

type PinDragOrigin = {
  startScreenX: number;
  startScreenY: number;
  originX: number;
  originY: number;
};

type PinWindowMeta = {
  initialWidth: number;
  initialHeight: number;
  lastOpacity: number;
  imagePath: string;
  sourceImage: NativeImage;
  bakedScaleFactor: number;
  bakedWidth: number;
  bakedHeight: number;
  usePng: boolean;
  clickThrough: boolean;
  dragOrigin: PinDragOrigin | null;
  rebakeTimer: NodeJS.Timeout | null;
  rebakeInFlight: boolean;
  rebakePending: boolean;
};

type PinSaveImageProvider = (image: NativeImage) => Promise<string>;

let pinOpacityHandlerRegistered = false;
let pinResetSizeHandlerRegistered = false;
let pinCopyHandlerRegistered = false;
let pinSaveHandlerRegistered = false;
let pinDragBeginHandlerRegistered = false;
let pinMoveHandlerRegistered = false;
let pinDragEndHandlerRegistered = false;
let pinClickThroughHandlerRegistered = false;
let pinCloseAllHandlerRegistered = false;
let pinClickThroughEscapeRegistered = false;
let pinSaveImageProvider: PinSaveImageProvider | null = null;
let activePinWindowManager: LiteSnapPinWindowManager | null = null;
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
    if (!meta?.sourceImage || meta.sourceImage.isEmpty()) {
      return;
    }

    clipboard.writeImage(meta.sourceImage);
  });
}

function ensurePinSaveHandler(): void {
  if (pinSaveHandlerRegistered) {
    return;
  }

  pinSaveHandlerRegistered = true;
  ipcMain.on(PIN_SAVE_CHANNEL, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || window.isDestroyed()) {
      return;
    }

    const meta = pinWindowMeta.get(window.id);
    if (!meta?.sourceImage || meta.sourceImage.isEmpty() || !pinSaveImageProvider) {
      return;
    }

    void pinSaveImageProvider(meta.sourceImage).catch(() => undefined);
  });
}

function applyPinnedWindowBounds(
  window: BrowserWindow,
  x: number,
  y: number
): void {
  const bounds = window.getBounds();
  // Preserve the user's current manual size while moving. Position must be
  // absolute (not delta+getBounds) or IPC backlog drops motion and leaves ghosts.
  window.setBounds(
    {
      x: Math.round(x),
      y: Math.round(y),
      width: bounds.width,
      height: bounds.height
    },
    false
  );
}

function ensurePinDragBeginHandler(): void {
  if (pinDragBeginHandlerRegistered) {
    return;
  }

  pinDragBeginHandlerRegistered = true;
  ipcMain.on(PIN_DRAG_BEGIN_CHANNEL, (event, screenX: number, screenY: number) => {
    if (!Number.isFinite(screenX) || !Number.isFinite(screenY)) {
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

    const bounds = window.getBounds();
    meta.dragOrigin = {
      startScreenX: screenX,
      startScreenY: screenY,
      originX: bounds.x,
      originY: bounds.y
    };
  });
}

function ensurePinMoveHandler(): void {
  if (pinMoveHandlerRegistered) {
    return;
  }

  pinMoveHandlerRegistered = true;
  ipcMain.on(PIN_MOVE_CHANNEL, (event, screenX: number, screenY: number) => {
    if (!Number.isFinite(screenX) || !Number.isFinite(screenY)) {
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

    if (!meta.dragOrigin) {
      const bounds = window.getBounds();
      meta.dragOrigin = {
        startScreenX: screenX,
        startScreenY: screenY,
        originX: bounds.x,
        originY: bounds.y
      };
    }

    const origin = meta.dragOrigin;
    applyPinnedWindowBounds(
      window,
      origin.originX + (screenX - origin.startScreenX),
      origin.originY + (screenY - origin.startScreenY)
    );
  });
}

function syncPinWindowConstraints(window: BrowserWindow, meta: PinWindowMeta): void {
  if (window.isDestroyed()) {
    return;
  }
  const bounds = window.getBounds();
  const display = screen.getDisplayMatching(bounds);
  const aspectRatio = meta.initialWidth / Math.max(1, meta.initialHeight);
  const minScale = 80 / Math.max(1, Math.min(meta.initialWidth, meta.initialHeight));
  const maxScale = Math.max(
    0.01,
    Math.min(
      display.workArea.width / Math.max(1, meta.initialWidth),
      display.workArea.height / Math.max(1, meta.initialHeight)
    )
  );
  const effectiveMinScale = Math.min(minScale, maxScale);
  window.setAspectRatio(aspectRatio);
  window.setMinimumSize(
    Math.max(1, Math.round(meta.initialWidth * effectiveMinScale)),
    Math.max(1, Math.round(meta.initialHeight * effectiveMinScale))
  );
  window.setMaximumSize(
    Math.max(1, Math.floor(meta.initialWidth * maxScale)),
    Math.max(1, Math.floor(meta.initialHeight * maxScale))
  );
}

async function rebakePinImageForWindow(
  window: BrowserWindow,
  meta: PinWindowMeta
): Promise<void> {
  if (window.isDestroyed()) {
    return;
  }
  const bounds = window.getBounds();
  const display = screen.getDisplayMatching(bounds);
  const scaleFactor = display.scaleFactor;
  if (!Number.isFinite(scaleFactor) || scaleFactor <= 0) {
    return;
  }
  if (
    bounds.width === meta.bakedWidth &&
    bounds.height === meta.bakedHeight &&
    Math.abs(scaleFactor - meta.bakedScaleFactor) < 0.001
  ) {
    return;
  }

  const displayImage = preparePinDisplayImage(
    meta.sourceImage,
    bounds.width,
    bounds.height,
    scaleFactor
  );
  if (displayImage.isEmpty()) {
    return;
  }

  const imageBytes = meta.usePng ? displayImage.toPNG() : displayImage.toJPEG(88);
  await fs.writeFile(meta.imagePath, imageBytes);
  meta.bakedScaleFactor = scaleFactor;
  meta.bakedWidth = bounds.width;
  meta.bakedHeight = bounds.height;

  if (!window.isDestroyed()) {
    window.webContents.send(PIN_IMAGE_UPDATED_CHANNEL);
    // Re-affirm mouse hit-testing after rewriting the bitmap on HiDPI screens.
    if (!meta.clickThrough) {
      window.setIgnoreMouseEvents(false);
    }
  }
}

function schedulePinImageRebake(
  window: BrowserWindow,
  meta: PinWindowMeta,
  delayMs = 140
): void {
  if (meta.rebakeTimer) {
    clearTimeout(meta.rebakeTimer);
  }
  meta.rebakeTimer = setTimeout(() => {
    meta.rebakeTimer = null;
    if (meta.rebakeInFlight) {
      meta.rebakePending = true;
      return;
    }
    meta.rebakeInFlight = true;
    void rebakePinImageForWindow(window, meta)
      .catch(() => undefined)
      .finally(() => {
        meta.rebakeInFlight = false;
        if (meta.rebakePending && !window.isDestroyed()) {
          meta.rebakePending = false;
          schedulePinImageRebake(window, meta, 0);
        }
      });
  }, delayMs);
  meta.rebakeTimer.unref?.();
}

function ensurePinDragEndHandler(): void {
  if (pinDragEndHandlerRegistered) {
    return;
  }

  pinDragEndHandlerRegistered = true;
  ipcMain.on(PIN_DRAG_END_CHANNEL, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || window.isDestroyed()) {
      return;
    }

    const meta = pinWindowMeta.get(window.id);
    if (!meta?.sourceImage || meta.sourceImage.isEmpty()) {
      return;
    }

    meta.dragOrigin = null;

    syncPinWindowConstraints(window, meta);
    schedulePinImageRebake(window, meta, 0);
  });
}

function applyPinClickThrough(window: BrowserWindow, meta: PinWindowMeta, enabled: boolean): void {
  meta.clickThrough = enabled;
  if (window.isDestroyed()) {
    syncPinClickThroughEscapeWatch();
    return;
  }

  // On Windows, restoring interactions must call setIgnoreMouseEvents(false)
  // without the forward option, otherwise hit-testing can stay broken.
  if (enabled) {
    window.setResizable(false);
    window.setIgnoreMouseEvents(true, { forward: true });
  } else {
    window.setIgnoreMouseEvents(false);
    window.setResizable(true);
    syncPinWindowConstraints(window, meta);
  }
  window.webContents.send(PIN_CLICK_THROUGH_CHANGED_CHANNEL, enabled);
  syncPinClickThroughEscapeWatch();
}

function anyPinClickThroughEnabled(): boolean {
  for (const meta of pinWindowMeta.values()) {
    if (meta.clickThrough) {
      return true;
    }
  }
  return false;
}

function syncPinClickThroughEscapeWatch(): void {
  const shouldWatch = anyPinClickThroughEnabled();
  if (shouldWatch && !pinClickThroughEscapeRegistered) {
    try {
      const ok = globalShortcut.register(PIN_CLICK_THROUGH_ESCAPE_ACCELERATOR, () => {
        activePinWindowManager?.disableAllClickThrough();
      });
      pinClickThroughEscapeRegistered = ok;
    } catch {
      pinClickThroughEscapeRegistered = false;
    }
    return;
  }

  if (!shouldWatch && pinClickThroughEscapeRegistered) {
    try {
      globalShortcut.unregister(PIN_CLICK_THROUGH_ESCAPE_ACCELERATOR);
    } catch {
      // Ignore unregister failures.
    }
    pinClickThroughEscapeRegistered = false;
  }
}

function ensurePinClickThroughHandler(): void {
  if (pinClickThroughHandlerRegistered) {
    return;
  }

  pinClickThroughHandlerRegistered = true;
  ipcMain.on(PIN_SET_CLICK_THROUGH_CHANNEL, (event, enabledInput: unknown) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || window.isDestroyed()) {
      return;
    }

    const meta = pinWindowMeta.get(window.id);
    if (!meta) {
      return;
    }

    applyPinClickThrough(window, meta, Boolean(enabledInput));
  });
}

function ensurePinCloseAllHandler(): void {
  if (pinCloseAllHandlerRegistered) {
    return;
  }

  pinCloseAllHandlerRegistered = true;
  ipcMain.on(PIN_CLOSE_ALL_CHANNEL, () => {
    activePinWindowManager?.closeAllPinnedWindows();
  });
}

function resetPinWindowSize(window: BrowserWindow, meta: PinWindowMeta): void {
  if (window.isDestroyed()) {
    return;
  }
  const bounds = window.getBounds();
  const display = screen.getDisplayMatching(bounds);
  const restoreScale = Math.min(
    1,
    display.workArea.width / Math.max(1, meta.initialWidth),
    display.workArea.height / Math.max(1, meta.initialHeight)
  );
  const width = Math.max(1, Math.round(meta.initialWidth * restoreScale));
  const height = Math.max(1, Math.round(meta.initialHeight * restoreScale));
  const centeredX = Math.round(bounds.x + (bounds.width - width) / 2);
  const centeredY = Math.round(bounds.y + (bounds.height - height) / 2);
  const x = Math.min(
    display.workArea.x + display.workArea.width - width,
    Math.max(display.workArea.x, centeredX)
  );
  const y = Math.min(
    display.workArea.y + display.workArea.height - height,
    Math.max(display.workArea.y, centeredY)
  );
  window.setBounds({ x, y, width, height }, false);
  syncPinWindowConstraints(window, meta);
  schedulePinImageRebake(window, meta, 0);
}

function ensurePinOpacityHandler(): void {
  if (pinOpacityHandlerRegistered) {
    return;
  }

  pinOpacityHandlerRegistered = true;
  ipcMain.on(PIN_SET_OPACITY_CHANNEL, (event, opacity: number) => {
    if (!Number.isFinite(opacity)) {
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

    const nextOpacity = Math.min(1, Math.max(0.2, opacity));
    const opacityChanged = Math.abs(nextOpacity - meta.lastOpacity) > 0.001;

    if (opacityChanged) {
      window.setOpacity(nextOpacity);
      meta.lastOpacity = nextOpacity;
    }
  });
}

function ensurePinResetSizeHandler(): void {
  if (pinResetSizeHandlerRegistered) {
    return;
  }
  pinResetSizeHandlerRegistered = true;
  ipcMain.on(PIN_RESET_SIZE_CHANNEL, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || window.isDestroyed()) {
      return;
    }
    const meta = pinWindowMeta.get(window.id);
    if (meta) {
      resetPinWindowSize(window, meta);
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
        -webkit-app-region: no-drag;
        border-radius: ${shellRadius};
        overflow: hidden;
        background: #000000;
        cursor: grab;
      }
      .pin-shell.is-dragging {
        cursor: grabbing;
      }
      .pin-shell:hover:not(.is-dragging):not(.is-click-through) {
        outline: 1px solid rgba(125, 211, 252, 0.72);
        outline-offset: -1px;
      }
      .pin-shell.is-border-enabled {
        outline: 1px solid rgba(255, 255, 255, 0.45);
        outline-offset: -1px;
      }
      .pin-shell.is-click-through {
        outline: 2px dashed rgba(125, 211, 252, 0.95);
        outline-offset: -2px;
      }
      .pin-click-through-banner {
        position: absolute;
        left: 10px;
        right: 46px;
        top: 10px;
        padding: 6px 10px;
        border-radius: 8px;
        background: rgba(8, 47, 73, 0.88);
        color: #e0f2fe;
        font-size: 11px;
        line-height: 1.35;
        pointer-events: none;
        -webkit-app-region: no-drag;
      }
      .pin-click-through-banner[hidden] {
        display: none;
      }
      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
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
      .pin-menu__opacity-row {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 8px;
        padding: 6px 10px 8px;
      }
      .pin-menu__opacity-label {
        color: #cbd5e1;
        font-size: 12px;
        white-space: nowrap;
      }
      .pin-menu__opacity-slider {
        width: 100%;
        margin: 0;
        accent-color: #7dd3fc;
        cursor: pointer;
      }
      .pin-menu__opacity-value {
        min-width: 36px;
        color: #94a3b8;
        font-size: 11px;
        text-align: right;
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
      <div class="pin-click-through-banner" id="pin-click-through-banner" hidden>
        点击穿透中 · Esc 退出穿透 · Ctrl+Shift+T 也可切换
      </div>
      <div class="pin-menu" id="pin-menu" hidden>
        <div class="pin-menu__label" id="pin-menu-label">透明度 100%</div>
        <div class="pin-menu__opacity-row">
          <label class="pin-menu__opacity-label" for="pin-opacity-slider">透明度</label>
          <input
            type="range"
            id="pin-opacity-slider"
            class="pin-menu__opacity-slider"
            min="20"
            max="100"
            step="1"
            value="100"
          />
          <span class="pin-menu__opacity-value" id="pin-opacity-value">100%</span>
        </div>
        <button type="button" data-command="reset-size">恢复初始大小</button>
        <div class="pin-menu__divider"></div>
        <button type="button" data-command="copy">复制到剪贴板</button>
        <button type="button" data-command="save">保存图片</button>
        <button type="button" data-command="toggle-border">切换边框</button>
        <button type="button" data-command="toggle-click-through" id="pin-click-through-btn">点击穿透</button>
        <div class="pin-menu__divider"></div>
        <button type="button" data-command="close">关闭贴图</button>
        <button type="button" data-command="close-all">关闭所有贴图</button>
      </div>
    </div>
    <script>
      const shell = document.getElementById("pin-shell");
      const menu = document.getElementById("pin-menu");
      const menuLabel = document.getElementById("pin-menu-label");
      const opacitySlider = document.getElementById("pin-opacity-slider");
      const opacityValue = document.getElementById("pin-opacity-value");
      const pinImage = shell ? shell.querySelector("img") : null;
      const clickThroughBtn = document.getElementById("pin-click-through-btn");
      const clickThroughBanner = document.getElementById("pin-click-through-banner");
      const pinApi = window.liteSnapPin;
      const imgBaseSrc = pinImage ? pinImage.getAttribute("src") || "" : "";
      let opacity = 1;
      let opacityFrame = 0;
      let dragging = false;
      let dragMoveFrame = 0;
      let pendingScreenX = 0;
      let pendingScreenY = 0;
      let hasPendingMove = false;
      let clickThrough = false;
      const nativeResizeMargin = 10;

      function isInNativeResizeZone(event) {
        return (
          event.clientX <= nativeResizeMargin ||
          event.clientY <= nativeResizeMargin ||
          event.clientX >= window.innerWidth - nativeResizeMargin ||
          event.clientY >= window.innerHeight - nativeResizeMargin
        );
      }

      function syncClickThroughLabel() {
        if (clickThroughBtn) {
          clickThroughBtn.textContent = clickThrough
            ? "取消点击穿透"
            : "点击穿透";
        }
        if (clickThroughBanner) {
          clickThroughBanner.hidden = !clickThrough;
        }
        shell?.classList.toggle("is-click-through", clickThrough);
      }

      function setClickThroughState(enabled) {
        clickThrough = Boolean(enabled);
        syncClickThroughLabel();
      }

      function syncOpacityControls() {
        const percent = Math.round(opacity * 100);
        if (opacitySlider instanceof HTMLInputElement) {
          opacitySlider.value = String(percent);
        }
        if (opacityValue) {
          opacityValue.textContent = percent + "%";
        }
      }

      function applyOpacity() {
        if (opacityFrame) {
          return;
        }

        opacityFrame = requestAnimationFrame(function () {
          opacityFrame = 0;
          pinApi?.setOpacity(opacity);
          syncOpacityControls();
          if (menuLabel) {
            menuLabel.textContent = "透明度 " + Math.round(opacity * 100) + "%";
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
        syncOpacityControls();
        syncClickThroughLabel();
        const rect = menu.getBoundingClientRect();
        menu.style.left = Math.min(x, window.innerWidth - rect.width - 8) + "px";
        menu.style.top = Math.min(y, window.innerHeight - rect.height - 8) + "px";
      }

      function runCommand(command) {
        if (command === "reset-size") {
          pinApi?.resetSize?.();
          return;
        } else if (command === "copy") {
          pinApi?.copyToClipboard?.();
          return;
        } else if (command === "save") {
          pinApi?.saveToFile?.();
          return;
        } else if (command === "toggle-border") {
          shell?.classList.toggle("is-border-enabled");
          return;
        } else if (command === "toggle-click-through") {
          const next = !clickThrough;
          setClickThroughState(next);
          pinApi?.setClickThrough?.(next);
          return;
        } else if (command === "close") {
          window.close();
          return;
        } else if (command === "close-all") {
          pinApi?.closeAllPins?.();
          return;
        }
      }

      document.getElementById("close-btn")?.addEventListener("click", function () {
        window.close();
      });
      window.addEventListener("dblclick", function () {
        pinApi?.copyToClipboard?.();
      });
      opacitySlider?.addEventListener("input", function (event) {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) {
          return;
        }
        const next = Number(target.value);
        if (!Number.isFinite(next)) {
          return;
        }
        opacity = Math.min(1, Math.max(0.2, next / 100));
        applyOpacity();
      });
      window.addEventListener("contextmenu", function (event) {
        event.preventDefault();
        showMenu(event.clientX, event.clientY);
      });
      window.addEventListener(
        "pointerdown",
        function (event) {
          if (event.button !== 0) {
            return;
          }

          const target = event.target;
          const menuOpen = Boolean(menu && !menu.hidden);
          const insideMenu =
            menuOpen && target instanceof Node && menu.contains(target);

          if (menuOpen && !insideMenu) {
            hideMenu();
          }

          if (insideMenu) {
            return;
          }

          // Leave all four native edges and corners exclusively to Windows.
          // Starting the custom content drag here would move the pin at the
          // same time as the OS resize gesture.
          if (isInNativeResizeZone(event)) {
            return;
          }

          if (
            target instanceof HTMLElement &&
            (target.closest("button") || target.closest("input"))
          ) {
            return;
          }

          dragging = true;
          hasPendingMove = false;
          if (dragMoveFrame) {
            cancelAnimationFrame(dragMoveFrame);
            dragMoveFrame = 0;
          }
          shell?.classList.add("is-dragging");
          shell?.setPointerCapture?.(event.pointerId);
          pinApi?.beginDrag?.(event.screenX, event.screenY);
        },
        true
      );
      window.addEventListener("pointermove", function (event) {
        if (!dragging) {
          return;
        }
        pendingScreenX = event.screenX;
        pendingScreenY = event.screenY;
        hasPendingMove = true;
        if (dragMoveFrame) {
          return;
        }
        dragMoveFrame = requestAnimationFrame(function () {
          dragMoveFrame = 0;
          if (!dragging || !hasPendingMove) {
            return;
          }
          hasPendingMove = false;
          pinApi?.moveTo?.(pendingScreenX, pendingScreenY);
        });
      });
      function endDrag(event) {
        if (!dragging) {
          return;
        }
        dragging = false;
        if (dragMoveFrame) {
          cancelAnimationFrame(dragMoveFrame);
          dragMoveFrame = 0;
        }
        if (hasPendingMove) {
          hasPendingMove = false;
          pinApi?.moveTo?.(pendingScreenX, pendingScreenY);
        }
        shell?.classList.remove("is-dragging");
        shell?.releasePointerCapture?.(event.pointerId);
        pinApi?.notifyDragEnd?.();
      }
      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);
      window.addEventListener("blur", function () {
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
          pinApi?.resetSize?.();
        }
      });
      pinApi?.onImageRefresh?.(function () {
        if (!pinImage || !imgBaseSrc) {
          return;
        }
        pinImage.src = imgBaseSrc + "?v=" + Date.now();
      });
      pinApi?.onClickThroughChanged?.(function (enabled) {
        setClickThroughState(enabled);
      });
      syncClickThroughLabel();
    </script>
  </body>
</html>`;
}

async function writePinWindowAssets(
  displayImage: NativeImage,
  exact: boolean
): Promise<{
  htmlPath: string;
  imagePath: string;
  usePng: boolean;
  cleanup: () => Promise<void>;
}> {
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
    usePng,
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
    resizable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    hasShadow: false,
    thickFrame: true,
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
  private pinningClipboard = false;

  public constructor() {
    activePinWindowManager = this;
  }

  // Lets the host wire saving a pinned image to disk (settings-aware save +
  // reveal in Explorer) without this module depending on the settings/image
  // stores directly.
  public setSaveImageProvider(provider: PinSaveImageProvider | null): void {
    pinSaveImageProvider = provider;
  }

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

    // Guard against rapid re-triggering of the global pin shortcut, which would
    // otherwise spawn a burst of pin windows (and prewarm churn) from a single
    // held keypress.
    if (this.pinningClipboard) {
      return true;
    }
    this.pinningClipboard = true;
    try {
      return await this.pinImage(image);
    } finally {
      this.pinningClipboard = false;
    }
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

    ensurePinOpacityHandler();
    ensurePinResetSizeHandler();
    ensurePinCopyHandler();
    ensurePinSaveHandler();
    ensurePinDragBeginHandler();
    ensurePinMoveHandler();
    ensurePinDragEndHandler();
    ensurePinClickThroughHandler();
    ensurePinCloseAllHandler();

    const window = this.takePrewarmedWindow({ x, y, width, height });
    void this.prewarmPinWindow();

    const assets = await writePinWindowAssets(displayImage, exactPlacement);

    const meta: PinWindowMeta = {
      initialWidth: width,
      initialHeight: height,
      lastOpacity: 1,
      imagePath: assets.imagePath,
      sourceImage: image,
      bakedScaleFactor: display.scaleFactor,
      bakedWidth: width,
      bakedHeight: height,
      usePng: assets.usePng,
      clickThrough: false,
      dragOrigin: null,
      rebakeTimer: null,
      rebakeInFlight: false,
      rebakePending: false
    };
    pinWindowMeta.set(window.id, meta);
    window.setResizable(true);
    syncPinWindowConstraints(window, meta);

    window.setAlwaysOnTop(true, "screen-saver");
    // Always start interactive; reused/prewarmed windows can inherit a bad
    // ignore-mouse state from previous pins on some Windows DPI setups.
    window.setIgnoreMouseEvents(false);
    this.windows.add(window);
    window.webContents.on("before-input-event", (event, input) => {
      if (input.type === "keyDown" && input.key === "Escape") {
        event.preventDefault();
        const meta = pinWindowMeta.get(window.id);
        if (meta?.clickThrough) {
          applyPinClickThrough(window, meta, false);
          return;
        }
        window.close();
      }
    });

    window.on("resize", () => {
      const current = pinWindowMeta.get(window.id);
      if (current) {
        schedulePinImageRebake(window, current);
      }
    });
    window.on("resized", () => {
      const current = pinWindowMeta.get(window.id);
      if (current) {
        schedulePinImageRebake(window, current, 0);
      }
    });
    window.on("moved", () => {
      const current = pinWindowMeta.get(window.id);
      if (current) {
        syncPinWindowConstraints(window, current);
        schedulePinImageRebake(window, current, 0);
      }
    });

    window.on("closed", () => {
      const current = pinWindowMeta.get(window.id);
      if (current?.rebakeTimer) {
        clearTimeout(current.rebakeTimer);
      }
      pinWindowMeta.delete(window.id);
      this.windows.delete(window);
      syncPinClickThroughEscapeWatch();
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

  public closeAllPinnedWindows(): { count: number } {
    // Restore hit-testing first so close paths are reliable even if some
    // windows were left in click-through mode.
    this.disableAllClickThrough();
    const windows = [...this.windows].filter((window) => !window.isDestroyed());
    for (const window of windows) {
      window.close();
    }
    this.hiddenByManager = false;
    return { count: windows.length };
  }

  public disableAllClickThrough(): { count: number } {
    let count = 0;
    for (const window of this.windows) {
      if (window.isDestroyed()) {
        continue;
      }
      const meta = pinWindowMeta.get(window.id);
      if (!meta?.clickThrough) {
        // Also repair windows that somehow lost mouse hit-testing.
        window.setIgnoreMouseEvents(false);
        continue;
      }
      applyPinClickThrough(window, meta, false);
      count += 1;
    }
    syncPinClickThroughEscapeWatch();
    return { count };
  }

  public toggleNearestPinClickThrough(): {
    toggled: boolean;
    enabled: boolean;
    count: number;
  } {
    const windows = [...this.windows].filter((window) => !window.isDestroyed());
    if (windows.length === 0) {
      return { toggled: false, enabled: false, count: 0 };
    }

    // If any pin is already transparent to clicks, prefer clearing them all so
    // a stuck pin never requires hunting for the "nearest" window.
    if (anyPinClickThroughEnabled()) {
      const cleared = this.disableAllClickThrough();
      return { toggled: cleared.count > 0, enabled: false, count: windows.length };
    }

    const cursor = screen.getCursorScreenPoint();
    let bestWindow: BrowserWindow | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const window of windows) {
      const bounds = window.getBounds();
      const contains =
        cursor.x >= bounds.x &&
        cursor.x <= bounds.x + bounds.width &&
        cursor.y >= bounds.y &&
        cursor.y <= bounds.y + bounds.height;
      if (contains) {
        bestWindow = window;
        break;
      }

      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;
      const distance =
        (centerX - cursor.x) * (centerX - cursor.x) +
        (centerY - cursor.y) * (centerY - cursor.y);
      if (distance < bestScore) {
        bestScore = distance;
        bestWindow = window;
      }
    }

    if (!bestWindow) {
      return { toggled: false, enabled: false, count: windows.length };
    }

    const meta = pinWindowMeta.get(bestWindow.id);
    if (!meta) {
      return { toggled: false, enabled: false, count: windows.length };
    }

    const next = !meta.clickThrough;
    applyPinClickThrough(bestWindow, meta, next);
    return { toggled: true, enabled: next, count: windows.length };
  }
}
