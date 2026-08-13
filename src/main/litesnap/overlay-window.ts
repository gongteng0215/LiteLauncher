import path from "node:path";

import { BrowserWindow, type Display } from "electron";

export function createLiteSnapOverlayWindow(display: Display): BrowserWindow {
  const window = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    frame: false,
    // Long capture temporarily reduces this window to a selection outline.
    // The native window itself must therefore support alpha; CSS transparency
    // alone cannot reveal the underlying application from an opaque window.
    transparent: true,
    backgroundColor: "#00000000",
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

export function createLiteSnapLongCaptureController(display: Display): BrowserWindow {
  const window = new BrowserWindow({
    x: display.workArea.x + Math.max(12, Math.round((display.workArea.width - 360) / 2)),
    y: display.workArea.y + Math.max(12, display.workArea.height - 132),
    width: 360,
    height: 132,
    frame: false,
    transparent: true,
    backgroundColor: "#151023",
    show: false,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, "../../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false
    }
  });
  window.setMenuBarVisibility(false);
  window.setContentProtection(true);
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  window.loadFile(path.join(__dirname, "../../renderer/litesnap-long-capture.html"));
  return window;
}

export function createLiteSnapLongCaptureGuide(bounds: {
  x: number;
  y: number;
  width: number;
  height: number;
}): BrowserWindow {
  const window = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: Math.max(1, Math.round(bounds.width)),
    height: Math.max(1, Math.round(bounds.height)),
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    show: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: true,
    alwaysOnTop: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "../../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false
    }
  });
  window.setMenuBarVisibility(false);
  window.setContentProtection(true);
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  window.loadFile(path.join(__dirname, "../../renderer/litesnap-long-capture-guide.html"));
  return window;
}
