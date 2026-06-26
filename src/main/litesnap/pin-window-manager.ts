import { BrowserWindow, clipboard, screen, type NativeImage } from "electron";

import { type LiteSnapWindowRect } from "../../shared/litesnap";

function buildPinWindowHtml(imageDataUrl: string, exact: boolean): string {
  const shellRadius = exact ? "0" : "14px";
  const initialShadowClass = exact ? "" : " is-shadow-enabled";
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
        background: transparent;
        font-family: "Segoe UI", "Microsoft YaHei", sans-serif;
      }
      .pin-shell {
        position: fixed;
        inset: 0;
        -webkit-app-region: drag;
        border-radius: ${shellRadius};
        overflow: hidden;
        box-shadow: none;
        background: rgba(15, 23, 42, 0.08);
      }
      .pin-shell.is-shadow-enabled {
        box-shadow: 0 18px 48px rgba(15, 23, 42, 0.35);
      }
      .pin-shell.is-border-enabled {
        outline: 1px solid rgba(255, 255, 255, 0.45);
        outline-offset: -1px;
      }
      .pin-stage {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        transform-origin: center center;
      }
      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        pointer-events: none;
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
    <div class="pin-shell${initialShadowClass}" id="pin-shell">
      <button type="button" class="pin-close" id="close-btn" title="关闭">×</button>
      <div class="pin-stage" id="pin-stage">
        <img src="${imageDataUrl}" alt="LiteSnap Pinned Image" />
      </div>
      <div class="pin-menu" id="pin-menu" hidden>
        <div class="pin-menu__label" id="pin-menu-label">缩放 100% / 透明度 100%</div>
        <button type="button" data-command="zoom-in">放大</button>
        <button type="button" data-command="zoom-out">缩小</button>
        <button type="button" data-command="opacity-up">增加不透明度</button>
        <button type="button" data-command="opacity-down">降低不透明度</button>
        <button type="button" data-command="reset">重置缩放和透明度</button>
        <div class="pin-menu__divider"></div>
        <button type="button" data-command="toggle-shadow">切换阴影</button>
        <button type="button" data-command="toggle-border">切换边框</button>
        <div class="pin-menu__divider"></div>
        <button type="button" data-command="close">关闭贴图</button>
      </div>
    </div>
    <script>
      const shell = document.getElementById("pin-shell");
      const stage = document.getElementById("pin-stage");
      const menu = document.getElementById("pin-menu");
      const menuLabel = document.getElementById("pin-menu-label");
      let scale = 1;
      let opacity = 1;

      function applyTransform() {
        if (!stage) {
          return;
        }
        stage.style.transform = "scale(" + scale.toFixed(3) + ")";
        stage.style.opacity = opacity.toFixed(2);
        if (menuLabel) {
          menuLabel.textContent = "缩放 " + Math.round(scale * 100) + "% / 透明度 " + Math.round(opacity * 100) + "%";
        }
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
        applyTransform();
        menu.hidden = false;
        const rect = menu.getBoundingClientRect();
        menu.style.left = Math.min(x, window.innerWidth - rect.width - 8) + "px";
        menu.style.top = Math.min(y, window.innerHeight - rect.height - 8) + "px";
      }

      function resetTransform() {
        scale = 1;
        opacity = 1;
        applyTransform();
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
        } else if (command === "toggle-shadow") {
          shell?.classList.toggle("is-shadow-enabled");
        } else if (command === "toggle-border") {
          shell?.classList.toggle("is-border-enabled");
        } else if (command === "close") {
          window.close();
          return;
        }
        applyTransform();
      }

      document.getElementById("close-btn")?.addEventListener("click", function () {
        window.close();
      });
      window.addEventListener("dblclick", function () {
        window.close();
      });
      window.addEventListener("wheel", function (event) {
        event.preventDefault();
        if (event.ctrlKey) {
          opacity = Math.min(1, Math.max(0.2, opacity + (event.deltaY < 0 ? 0.05 : -0.05)));
        } else {
          scale = Math.min(4, Math.max(0.2, scale * (event.deltaY < 0 ? 1.08 : 0.92)));
        }
        applyTransform();
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
      applyTransform();
    </script>
  </body>
</html>`;
}

export class LiteSnapPinWindowManager {
  private readonly windows = new Set<BrowserWindow>();
  private hiddenByManager = false;

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

    if (
      placement &&
      placement.width > 0 &&
      placement.height > 0
    ) {
      // Pin exactly where the screenshot was taken, at its original on-screen
      // size, so the pinned image visually replaces the captured region.
      x = Math.round(placement.x);
      y = Math.round(placement.y);
      width = Math.max(1, Math.round(placement.width));
      height = Math.max(1, Math.round(placement.height));
    } else {
      const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
      const maxWidth = Math.max(280, Math.floor(display.workArea.width * 0.42));
      const maxHeight = Math.max(220, Math.floor(display.workArea.height * 0.42));
      const scale = Math.min(maxWidth / size.width, maxHeight / size.height, 1);
      width = Math.max(180, Math.round(size.width * scale));
      height = Math.max(120, Math.round(size.height * scale));
      x = Math.round(display.workArea.x + (display.workArea.width - width) / 2);
      y = Math.round(display.workArea.y + (display.workArea.height - height) / 2);
    }

    const window = new BrowserWindow({
      x,
      y,
      width,
      height,
      frame: false,
      transparent: true,
      backgroundColor: "#00000000",
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: true,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      hasShadow: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    });

    window.setAlwaysOnTop(true, "screen-saver");
    this.windows.add(window);
    window.on("closed", () => {
      this.windows.delete(window);
    });
    window.webContents.on("before-input-event", (event, input) => {
      if (input.type === "keyDown" && input.key === "Escape") {
        event.preventDefault();
        window.close();
      }
    });

    const exactPlacement = Boolean(
      placement && placement.width > 0 && placement.height > 0
    );
    await window.loadURL(
      `data:text/html;charset=UTF-8,${encodeURIComponent(
        buildPinWindowHtml(image.toDataURL(), exactPlacement)
      )}`
    );
    window.show();
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
