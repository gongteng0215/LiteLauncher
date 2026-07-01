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
let cachedTrayIcon: NativeImage | null = null;
let trayIconSourceLogged = false;

export interface SetupAppTrayOptions {
  showLauncherWindow?: () => void;
  showLauncherWindowFromDoubleClick?: () => void;
  toggleLauncherWindow?: () => void;
}

function buildFallbackTrayIcon(): NativeImage {
  return nativeImage.createFromDataURL(FALLBACK_ICON_DATA_URL);
}

function resolveTrayIcon(): NativeImage {
  if (cachedTrayIcon && !cachedTrayIcon.isEmpty()) {
    return cachedTrayIcon;
  }

  const bundledIconPath = resolveBundledAppIconPath();
  const bundledTrayIcon = loadBundledTrayIcon();
  if (bundledTrayIcon && !bundledTrayIcon.isEmpty()) {
    if (!trayIconSourceLogged) {
      if (bundledIconPath) {
        console.info(`[tray] using bundled icon: ${bundledIconPath}`);
      } else {
        console.info("[tray] using bundled icon");
      }
      trayIconSourceLogged = true;
    }
    cachedTrayIcon = bundledTrayIcon;
    return cachedTrayIcon;
  }

  if (bundledIconPath) {
    if (!trayIconSourceLogged) {
      console.warn(
        `[tray] failed to decode bundled icon, using generated fallback icon: ${bundledIconPath}`
      );
      trayIconSourceLogged = true;
    }
    cachedTrayIcon = buildFallbackTrayIcon();
    return cachedTrayIcon;
  }

  if (!trayIconSourceLogged) {
    console.warn("[tray] bundled icon not found, using generated fallback icon");
    trayIconSourceLogged = true;
  }
  cachedTrayIcon = buildFallbackTrayIcon();
  return cachedTrayIcon;
}

function buildTrayMenu(
  window: BrowserWindow,
  options: SetupAppTrayOptions
): Menu {
  const showWindow = options.showLauncherWindow ?? (() => showLauncherWindow(window));

  return Menu.buildFromTemplate([
    {
      label: "\u663e\u793a\u4e3b\u754c\u9762",
      click: () => {
        if (!window.isDestroyed()) {
          showWindow();
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

export async function setupAppTray(
  window: BrowserWindow,
  options: SetupAppTrayOptions = {}
): Promise<void> {
  const icon = resolveTrayIcon();
  const menu = buildTrayMenu(window, options);
  const toggleWindow =
    options.toggleLauncherWindow ?? (() => toggleLauncherWindow(window));
  const showWindow =
    options.showLauncherWindow ?? (() => showLauncherWindow(window));
  const showWindowFromDoubleClick =
    options.showLauncherWindowFromDoubleClick ?? showWindow;

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
      toggleWindow();
    });

    appTray.on("double-click", () => {
      if (window.isDestroyed()) {
        return;
      }
      showWindowFromDoubleClick();
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
  cachedTrayIcon = null;
}
