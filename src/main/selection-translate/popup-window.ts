import path from "node:path";
import { BrowserWindow, clipboard, ipcMain, screen } from "electron";

import { IPC_CHANNELS } from "../../shared/channels";
import type { SelectionPopupPayload } from "../../shared/selection-translate";

const POPUP_WIDTH = 360;
const POPUP_HEIGHT = 280;
const CURSOR_OFFSET = 16;

let popupWindow: BrowserWindow | null = null;
let dismissBackdropWindow: BrowserWindow | null = null;
let handlersRegistered = false;
let latestPayload: SelectionPopupPayload | null = null;

function resolvePopupPreloadPath(): string {
  return path.join(__dirname, "../../preload/selection-popup.js");
}

function resolvePopupHtmlPath(): string {
  return path.join(__dirname, "../../renderer/selection-popup.html");
}

function getVirtualDesktopBounds(): { x: number; y: number; width: number; height: number } {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const display of screen.getAllDisplays()) {
    const { x, y, width, height } = display.bounds;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY)
  };
}

function clampPopupBounds(point: { x: number; y: number }): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const display = screen.getDisplayNearestPoint(point);
  const { workArea } = display;
  const width = Math.min(POPUP_WIDTH, workArea.width);
  const height = Math.min(POPUP_HEIGHT, workArea.height);
  const x = Math.min(
    Math.max(point.x + CURSOR_OFFSET, workArea.x),
    workArea.x + workArea.width - width
  );
  const y = Math.min(
    Math.max(point.y + CURSOR_OFFSET, workArea.y),
    workArea.y + workArea.height - height
  );
  return { x, y, width, height };
}

function ensureHandlers(): void {
  if (handlersRegistered) {
    return;
  }
  handlersRegistered = true;

  ipcMain.handle(IPC_CHANNELS.selectionPopupClose, () => {
    closeSelectionPopup();
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.selectionPopupCopy, async (_, textInput: unknown) => {
    const text = typeof textInput === "string" ? textInput : "";
    if (!text) {
      return false;
    }
    clipboard.writeText(text);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.selectionPopupPayload, () => latestPayload);
}

function createDismissBackdropWindow(): BrowserWindow {
  const bounds = getVirtualDesktopBounds();
  const window = new BrowserWindow({
    ...bounds,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    hasShadow: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.setAlwaysOnTop(true, "floating");
  void window.loadURL("about:blank");
  window.webContents.on("before-input-event", (_event, input) => {
    if (input.type !== "mouseDown") {
      return;
    }
    closeSelectionPopup();
  });
  window.on("closed", () => {
    if (dismissBackdropWindow === window) {
      dismissBackdropWindow = null;
    }
  });

  return window;
}

async function ensureDismissBackdropVisible(): Promise<void> {
  const bounds = getVirtualDesktopBounds();
  if (!dismissBackdropWindow || dismissBackdropWindow.isDestroyed()) {
    dismissBackdropWindow = createDismissBackdropWindow();
  } else {
    dismissBackdropWindow.setBounds(bounds);
  }

  if (!dismissBackdropWindow.webContents.isLoadingMainFrame()) {
    if (!dismissBackdropWindow.isVisible()) {
      dismissBackdropWindow.showInactive();
    }
    return;
  }

  await new Promise<void>((resolve) => {
    dismissBackdropWindow?.webContents.once("did-finish-load", () => resolve());
  });
  if (dismissBackdropWindow && !dismissBackdropWindow.isDestroyed() && !dismissBackdropWindow.isVisible()) {
    dismissBackdropWindow.showInactive();
  }
}

function closeDismissBackdrop(): void {
  if (!dismissBackdropWindow || dismissBackdropWindow.isDestroyed()) {
    dismissBackdropWindow = null;
    return;
  }
  dismissBackdropWindow.close();
  dismissBackdropWindow = null;
}

function createPopupWindow(bounds: {
  x: number;
  y: number;
  width: number;
  height: number;
}): BrowserWindow {
  const window = new BrowserWindow({
    ...bounds,
    frame: false,
    transparent: false,
    backgroundColor: "#111827",
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    focusable: true,
    show: false,
    webPreferences: {
      preload: resolvePopupPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  window.setAlwaysOnTop(true, "screen-saver");
  window.on("blur", () => {
    setTimeout(() => {
      if (!popupWindow || popupWindow.isDestroyed() || popupWindow !== window) {
        return;
      }
      if (!popupWindow.isFocused()) {
        closeSelectionPopup();
      }
    }, 0);
  });
  window.on("closed", () => {
    if (popupWindow === window) {
      popupWindow = null;
    }
    closeDismissBackdrop();
  });

  return window;
}

export function closeSelectionPopup(): void {
  closeDismissBackdrop();

  if (!popupWindow || popupWindow.isDestroyed()) {
    popupWindow = null;
    return;
  }
  popupWindow.close();
  popupWindow = null;
}

export async function showSelectionPopup(
  payload: SelectionPopupPayload
): Promise<void> {
  ensureHandlers();
  latestPayload = payload;

  const point = screen.getCursorScreenPoint();
  const bounds = clampPopupBounds(point);

  await ensureDismissBackdropVisible();

  if (!popupWindow || popupWindow.isDestroyed()) {
    popupWindow = createPopupWindow(bounds);
    await popupWindow.loadFile(resolvePopupHtmlPath());
  } else {
    popupWindow.setBounds(bounds);
  }

  const deliverPayload = (): void => {
    if (!popupWindow || popupWindow.isDestroyed()) {
      return;
    }
    popupWindow.webContents.send(IPC_CHANNELS.selectionPopupPayload, payload);
  };

  if (popupWindow.webContents.isLoading()) {
    popupWindow.webContents.once("did-finish-load", deliverPayload);
  } else {
    deliverPayload();
  }
  if (!popupWindow.isVisible()) {
    popupWindow.showInactive();
  }
  popupWindow.focus();
}
