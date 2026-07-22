import { BrowserWindow, screen } from "electron";
import path from "node:path";

import { IPC_CHANNELS } from "../shared/channels";
import { resolveBundledAppIconPath } from "./app-icon";

const COMPACT_WINDOW_WIDTH = 960;
const COMPACT_WINDOW_HEIGHT = 640;
const COMPACT_WINDOW_MAX_WIDTH = 1400;
const COMPACT_WINDOW_MAX_HEIGHT = 900;
const COMPACT_WINDOW_WIDTH_RATIO = 0.78;
const COMPACT_WINDOW_HEIGHT_RATIO = 0.72;

const CASHFLOW_WINDOW_WIDTH = 1040;
const CASHFLOW_WINDOW_HEIGHT = 680;
const CASHFLOW_WINDOW_MAX_WIDTH = 1680;
const CASHFLOW_WINDOW_MAX_HEIGHT = 980;
const CASHFLOW_WINDOW_WIDTH_RATIO = 0.88;
const CASHFLOW_WINDOW_HEIGHT_RATIO = 0.82;

const MIN_WINDOW_WIDTH = 960;
const MIN_WINDOW_HEIGHT = 640;
const WINDOW_WORKAREA_MARGIN_X = 40;
const WINDOW_WORKAREA_MARGIN_Y = 60;

export type WindowSizePreset = "compact" | "cashflow";
export type LauncherWindowShowTrigger =
  | "manual"
  | "global-shortcut"
  | "tray-click"
  | "tray-menu"
  | "tray-double-click"
  | "startup-e2e"
  | "second-instance"
  | "second-instance-dev-reload"
  | "litesnap-ocr"
  | "litesnap-translate";

export interface LauncherWindowDiagnosticEvent {
  trigger: LauncherWindowShowTrigger;
  phase: "show-immediate-state" | "show-recovery-state" | "show-recovery-skipped";
  isVisible: boolean;
  isAlwaysOnTop: boolean;
  isFocused: boolean;
  retryDelayMs?: number;
  note?: string;
}

export interface ShowLauncherWindowOptions {
  trigger?: LauncherWindowShowTrigger;
  reportDiagnostic?: (event: LauncherWindowDiagnosticEvent) => void;
}

function clampWindowDimension(
  target: number,
  min: number,
  max: number,
  available: number
): number {
  const safeAvailable = Math.max(320, Math.floor(available));
  const safeMax = Math.min(max, safeAvailable);
  if (safeMax < min) {
    return safeMax;
  }
  return Math.max(min, Math.min(Math.round(target), safeMax));
}

function getDisplayForCursor() {
  const cursorPoint = screen.getCursorScreenPoint();
  return screen.getDisplayNearestPoint(cursorPoint);
}

function getPresetSize(preset: WindowSizePreset): [number, number] {
  const targetDisplay = getDisplayForCursor();
  const areaWidth = targetDisplay.workArea.width;
  const areaHeight = targetDisplay.workArea.height;
  const availableWidth = areaWidth - WINDOW_WORKAREA_MARGIN_X;
  const availableHeight = areaHeight - WINDOW_WORKAREA_MARGIN_Y;

  if (preset === "cashflow") {
    return [
      clampWindowDimension(
        areaWidth * CASHFLOW_WINDOW_WIDTH_RATIO,
        CASHFLOW_WINDOW_WIDTH,
        CASHFLOW_WINDOW_MAX_WIDTH,
        availableWidth
      ),
      clampWindowDimension(
        areaHeight * CASHFLOW_WINDOW_HEIGHT_RATIO,
        CASHFLOW_WINDOW_HEIGHT,
        CASHFLOW_WINDOW_MAX_HEIGHT,
        availableHeight
      )
    ];
  }

  return [
    clampWindowDimension(
      areaWidth * COMPACT_WINDOW_WIDTH_RATIO,
      COMPACT_WINDOW_WIDTH,
      COMPACT_WINDOW_MAX_WIDTH,
      availableWidth
    ),
    clampWindowDimension(
      areaHeight * COMPACT_WINDOW_HEIGHT_RATIO,
      COMPACT_WINDOW_HEIGHT,
      COMPACT_WINDOW_MAX_HEIGHT,
      availableHeight
    )
  ];
}

function centerWindow(window: BrowserWindow): void {
  const targetDisplay = getDisplayForCursor();
  const { x, y, width, height } = targetDisplay.workArea;
  const [windowWidth, windowHeight] = window.getSize();

  const targetX = Math.round(x + (width - windowWidth) / 2);
  const targetY = Math.round(y + (height - windowHeight) / 2);

  window.setPosition(targetX, targetY);
}

function getLauncherWindowState(window: BrowserWindow): Pick<
  LauncherWindowDiagnosticEvent,
  "isVisible" | "isAlwaysOnTop" | "isFocused"
> {
  if (window.isDestroyed()) {
    return {
      isVisible: false,
      isAlwaysOnTop: false,
      isFocused: false
    };
  }

  return {
    isVisible: window.isVisible(),
    isAlwaysOnTop: window.isAlwaysOnTop(),
    isFocused: window.isFocused()
  };
}

function reportLauncherDiagnostic(
  window: BrowserWindow,
  options: ShowLauncherWindowOptions,
  phase: LauncherWindowDiagnosticEvent["phase"],
  note?: string,
  retryDelayMs?: number
): void {
  const { reportDiagnostic, trigger = "manual" } = options;
  if (!reportDiagnostic) {
    return;
  }

  const state = getLauncherWindowState(window);
  reportDiagnostic({
    trigger,
    phase,
    ...state,
    retryDelayMs,
    note
  });
}

function reportIfTopmostStateLooksWrong(
  window: BrowserWindow,
  options: ShowLauncherWindowOptions,
  phase: LauncherWindowDiagnosticEvent["phase"],
  note: string,
  retryDelayMs?: number
): void {
  const state = getLauncherWindowState(window);
  if (state.isVisible && state.isAlwaysOnTop) {
    return;
  }

  reportLauncherDiagnostic(window, options, phase, note, retryDelayMs);
}

function scheduleTopmostRecovery(
  window: BrowserWindow,
  options: ShowLauncherWindowOptions,
  delayMs: number
): void {
  setTimeout(() => {
    if (window.isDestroyed()) {
      reportLauncherDiagnostic(
        window,
        options,
        "show-recovery-skipped",
        `window destroyed before ${delayMs}ms recovery`,
        delayMs
      );
      return;
    }
    if (!window.isVisible()) {
      reportLauncherDiagnostic(
        window,
        options,
        "show-recovery-skipped",
        `window hidden before ${delayMs}ms recovery`,
        delayMs
      );
      return;
    }

    window.setAlwaysOnTop(true);
    window.moveTop();
    window.webContents.send(IPC_CHANNELS.focusInput);

    reportIfTopmostStateLooksWrong(
      window,
      options,
      "show-recovery-state",
      `launcher remained non-topmost after ${delayMs}ms recovery`,
      delayMs
    );
  }, delayMs);
}

function getCenteredBounds(
  window: BrowserWindow,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number } {
  const targetDisplay = getDisplayForCursor();
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
  const [initialWidth, initialHeight] = getPresetSize("compact");
  const window = new BrowserWindow({
    width: initialWidth,
    height: initialHeight,
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

export function showLauncherWindow(
  window: BrowserWindow,
  options: ShowLauncherWindowOptions = {}
): void {
  centerWindow(window);
  window.setAlwaysOnTop(true);
  window.show();
  window.setAlwaysOnTop(true);
  window.moveTop();
  window.focus();
  window.webContents.focus();

  // Focus can be dropped by OS focus-stealing prevention.
  // Retry a few times to make the input reliably active.
  window.webContents.send(IPC_CHANNELS.focusInput);
  reportIfTopmostStateLooksWrong(
    window,
    options,
    "show-immediate-state",
    "launcher show completed without visible topmost state"
  );
  scheduleTopmostRecovery(window, options, 40);
  scheduleTopmostRecovery(window, options, 120);
}

export function toggleLauncherWindow(
  window: BrowserWindow,
  options: ShowLauncherWindowOptions = {}
): void {
  if (window.isVisible()) {
    applyLauncherWindowSizePreset(window, "compact");
    window.hide();
    return;
  }

  applyLauncherWindowSizePreset(window, "compact");
  showLauncherWindow(window, options);
}
