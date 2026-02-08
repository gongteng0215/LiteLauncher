import { BrowserWindow, screen } from "electron";
import path from "node:path";

import { IPC_CHANNELS } from "../shared/channels";

const DEFAULT_WINDOW_WIDTH = 760;
const DEFAULT_WINDOW_HEIGHT = 460;

export function createLauncherWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    frame: false,
    resizable: false,
    show: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: "#10161f",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  window.loadFile(path.join(__dirname, "../renderer/index.html"));
  return window;
}

export function showLauncherWindow(window: BrowserWindow): void {
  const cursorPoint = screen.getCursorScreenPoint();
  const targetDisplay = screen.getDisplayNearestPoint(cursorPoint);
  const { x, y, width, height } = targetDisplay.workArea;
  const [windowWidth, windowHeight] = window.getSize();

  const targetX = Math.round(x + (width - windowWidth) / 2);
  const targetY = Math.round(y + (height - windowHeight) / 2);

  window.setPosition(targetX, targetY);
  window.show();
  window.moveTop();
  window.focus();
  window.webContents.focus();

  // Focus can be dropped by OS focus-stealing prevention.
  // Retry a few times to make the input reliably active.
  window.webContents.send(IPC_CHANNELS.focusInput);
  setTimeout(() => {
    if (window.isVisible()) {
      window.webContents.send(IPC_CHANNELS.focusInput);
    }
  }, 40);
  setTimeout(() => {
    if (window.isVisible()) {
      window.webContents.send(IPC_CHANNELS.focusInput);
    }
  }, 120);
}

export function toggleLauncherWindow(window: BrowserWindow): void {
  if (window.isVisible()) {
    window.hide();
    return;
  }

  showLauncherWindow(window);
}
