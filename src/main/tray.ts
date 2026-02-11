import { app, BrowserWindow, Menu, NativeImage, Tray, nativeImage } from "electron";

import {
  loadBundledTrayIcon,
  resolveBundledAppIconPath
} from "./app-icon";
import { showLauncherWindow, toggleLauncherWindow } from "./window";

const FALLBACK_ICON_SVG = [
  "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>",
  "<rect x='1' y='1' width='14' height='14' rx='3' fill='#102030'/>",
  "<path d='M5 4h2v8H5zM9 4h2v8H9z' fill='#7dd3fc'/>",
  "</svg>"
].join("");

const FALLBACK_ICON_DATA_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  FALLBACK_ICON_SVG
)}`;

let appTray: Tray | null = null;

function buildFallbackTrayIcon(): NativeImage {
  return nativeImage.createFromDataURL(FALLBACK_ICON_DATA_URL);
}

function resolveTrayIcon(): NativeImage {
  const bundledIconPath = resolveBundledAppIconPath();
  const bundledTrayIcon = loadBundledTrayIcon();
  if (bundledTrayIcon && !bundledTrayIcon.isEmpty()) {
    if (bundledIconPath) {
      console.info(`[tray] using bundled icon: ${bundledIconPath}`);
    } else {
      console.info("[tray] using bundled icon");
    }
    return bundledTrayIcon;
  }

  if (bundledIconPath) {
    console.warn(
      `[tray] failed to decode bundled icon, using generated fallback icon: ${bundledIconPath}`
    );
    return buildFallbackTrayIcon();
  }

  console.warn("[tray] bundled icon not found, using generated fallback icon");
  return buildFallbackTrayIcon();
}

function buildTrayMenu(window: BrowserWindow): Menu {
  return Menu.buildFromTemplate([
    {
      label: "\u663e\u793a\u4e3b\u754c\u9762",
      click: () => {
        if (!window.isDestroyed()) {
          showLauncherWindow(window);
        }
      }
    },
    { type: "separator" },
    {
      label: "\u9000\u51fa LiteLauncher",
      click: () => {
        app.quit();
      }
    }
  ]);
}

export async function setupAppTray(window: BrowserWindow): Promise<void> {
  const icon = resolveTrayIcon();
  const menu = buildTrayMenu(window);

  if (!appTray) {
    try {
      appTray = new Tray(icon);
    } catch (error) {
      console.warn("Failed to create tray with preferred icon, fallback to built-in", error);
      appTray = new Tray(buildFallbackTrayIcon());
    }
    appTray.setToolTip("LiteLauncher");

    appTray.on("click", () => {
      if (window.isDestroyed()) {
        return;
      }
      toggleLauncherWindow(window);
    });

    appTray.on("double-click", () => {
      if (window.isDestroyed()) {
        return;
      }
      showLauncherWindow(window);
    });
  }

  try {
    appTray.setImage(icon);
  } catch (error) {
    console.warn("Failed to update tray icon, fallback to built-in", error);
    appTray.setImage(buildFallbackTrayIcon());
  }
  appTray.setContextMenu(menu);
}

export function destroyAppTray(): void {
  if (!appTray) {
    return;
  }

  appTray.destroy();
  appTray = null;
}
