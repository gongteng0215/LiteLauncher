import { app, BrowserWindow, Menu, Tray, nativeImage } from "electron";

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

async function resolveTrayIcon() {
  try {
    const icon = await app.getFileIcon(process.execPath, { size: "small" });
    if (!icon.isEmpty()) {
      return icon;
    }
  } catch {
    // Ignore and fallback below.
  }

  return nativeImage.createFromDataURL(FALLBACK_ICON_DATA_URL);
}

function buildTrayMenu(window: BrowserWindow): Menu {
  return Menu.buildFromTemplate([
    {
      label: "显示主页面",
      click: () => {
        if (!window.isDestroyed()) {
          showLauncherWindow(window);
        }
      }
    },
    { type: "separator" },
    {
      label: "退出 LiteLauncher",
      click: () => {
        app.quit();
      }
    }
  ]);
}

export async function setupAppTray(window: BrowserWindow): Promise<void> {
  const menu = buildTrayMenu(window);

  if (!appTray) {
    const icon = await resolveTrayIcon();
    appTray = new Tray(icon);
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

  appTray.setContextMenu(menu);
}

export function destroyAppTray(): void {
  if (!appTray) {
    return;
  }

  appTray.destroy();
  appTray = null;
}
