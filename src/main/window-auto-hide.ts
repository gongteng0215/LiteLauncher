import { BrowserWindow } from "electron";

const autoHideSuspendedState = new WeakMap<BrowserWindow, boolean>();

export function isWindowAutoHideSuspended(window: BrowserWindow): boolean {
  return autoHideSuspendedState.get(window) === true;
}

export function setWindowAutoHideSuspended(
  window: BrowserWindow,
  suspended: boolean
): boolean {
  if (window.isDestroyed()) {
    return false;
  }

  autoHideSuspendedState.set(window, suspended);
  return true;
}
