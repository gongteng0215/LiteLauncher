import path from "node:path";

import { BrowserWindow, type Display } from "electron";

export function createLiteSnapOverlayWindow(display: Display): BrowserWindow {
  const window = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    frame: false,
    transparent: false,
    backgroundColor: "#0a0f16",
    show: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: false,
    alwaysOnTop: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "../../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  window.setMenuBarVisibility(false);
  window.setIgnoreMouseEvents(true);
  window.loadFile(path.join(__dirname, "../../renderer/litesnap-overlay.html"));

  return window;
}
