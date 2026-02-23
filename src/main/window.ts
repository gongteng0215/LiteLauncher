import { BrowserWindow, screen } from "electron";
import path from "node:path";

import { IPC_CHANNELS } from "../shared/channels";
import { resolveBundledAppIconPath } from "./app-icon";

const COMPACT_WINDOW_WIDTH = 760;
const COMPACT_WINDOW_HEIGHT = 460;
const CASHFLOW_WINDOW_WIDTH = 1040;
const CASHFLOW_WINDOW_HEIGHT = 680;
const MIN_WINDOW_WIDTH = 760;
const MIN_WINDOW_HEIGHT = 460;

export type WindowSizePreset = "compact" | "cashflow";

function getPresetSize(preset: WindowSizePreset): [number, number] {
  if (preset === "cashflow") {
    return [CASHFLOW_WINDOW_WIDTH, CASHFLOW_WINDOW_HEIGHT];
  }
  return [COMPACT_WINDOW_WIDTH, COMPACT_WINDOW_HEIGHT];
}

function centerWindow(window: BrowserWindow): void {
  const cursorPoint = screen.getCursorScreenPoint();
  const targetDisplay = screen.getDisplayNearestPoint(cursorPoint);
  const { x, y, width, height } = targetDisplay.workArea;
  const [windowWidth, windowHeight] = window.getSize();

  const targetX = Math.round(x + (width - windowWidth) / 2);
  const targetY = Math.round(y + (height - windowHeight) / 2);

  window.setPosition(targetX, targetY);
}

function getCenteredBounds(
  window: BrowserWindow,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number } {
  const cursorPoint = screen.getCursorScreenPoint();
  const targetDisplay = screen.getDisplayNearestPoint(cursorPoint);
  const { x, y, width: areaWidth, height: areaHeight } = targetDisplay.workArea;
  const centeredX = Math.round(x + (areaWidth - width) / 2);
  const centeredY = Math.round(y + (areaHeight - height) / 2);
  return {
    x: centeredX,
    y: centeredY,
    width,
    height
  };
}

export function applyLauncherWindowSizePreset(
  window: BrowserWindow,
  preset: WindowSizePreset
): void {
  if (window.isDestroyed()) {
    return;
  }

  const [targetWidth, targetHeight] = getPresetSize(preset);
  const [currentWidth, currentHeight] = window.getSize();
  if (currentWidth !== targetWidth || currentHeight !== targetHeight) {
    const wasResizable = window.isResizable();
    if (!wasResizable) {
      window.setResizable(true);
    }

    const bounds = getCenteredBounds(window, targetWidth, targetHeight);
    window.setBounds(bounds);

    if (!wasResizable) {
      window.setResizable(false);
    }
    return;
  }

  centerWindow(window);
}

export function createLauncherWindow(): BrowserWindow {
  const iconPath = resolveBundledAppIconPath();
  const window = new BrowserWindow({
    width: COMPACT_WINDOW_WIDTH,
    height: COMPACT_WINDOW_HEIGHT,
    frame: false,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    resizable: false,
    show: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: "#10161f",
    icon: iconPath,
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
  centerWindow(window);
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
    applyLauncherWindowSizePreset(window, "compact");
    window.hide();
    return;
  }

  showLauncherWindow(window);
}
