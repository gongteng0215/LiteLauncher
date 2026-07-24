import { contextBridge, ipcRenderer } from "electron";

const PIN_VISUAL_STATE_CHANNEL = "litesnap-pin:visual-state";
const PIN_COPY_CHANNEL = "litesnap-pin:copy";
const PIN_SAVE_CHANNEL = "litesnap-pin:save";
const PIN_DRAG_BEGIN_CHANNEL = "litesnap-pin:drag-begin";
const PIN_MOVE_CHANNEL = "litesnap-pin:move-to";
const PIN_DRAG_END_CHANNEL = "litesnap-pin:drag-end";
const PIN_SET_CLICK_THROUGH_CHANNEL = "litesnap-pin:set-click-through";
const PIN_CLOSE_ALL_CHANNEL = "litesnap-pin:close-all";
const PIN_IMAGE_UPDATED_CHANNEL = "litesnap-pin:image-updated";
const PIN_CLICK_THROUGH_CHANGED_CHANNEL = "litesnap-pin:click-through-changed";

contextBridge.exposeInMainWorld("liteSnapPin", {
  setVisualState(scale: number, opacity: number): void {
    if (!Number.isFinite(scale) || !Number.isFinite(opacity)) {
      return;
    }

    ipcRenderer.send(PIN_VISUAL_STATE_CHANNEL, scale, opacity);
  },
  copyToClipboard(): void {
    ipcRenderer.send(PIN_COPY_CHANNEL);
  },
  saveToFile(): void {
    ipcRenderer.send(PIN_SAVE_CHANNEL);
  },
  beginDrag(screenX: number, screenY: number): void {
    if (!Number.isFinite(screenX) || !Number.isFinite(screenY)) {
      return;
    }

    ipcRenderer.send(PIN_DRAG_BEGIN_CHANNEL, screenX, screenY);
  },
  moveTo(screenX: number, screenY: number): void {
    if (!Number.isFinite(screenX) || !Number.isFinite(screenY)) {
      return;
    }

    ipcRenderer.send(PIN_MOVE_CHANNEL, screenX, screenY);
  },
  notifyDragEnd(): void {
    ipcRenderer.send(PIN_DRAG_END_CHANNEL);
  },
  setClickThrough(enabled: boolean): void {
    ipcRenderer.send(PIN_SET_CLICK_THROUGH_CHANNEL, Boolean(enabled));
  },
  closeAllPins(): void {
    ipcRenderer.send(PIN_CLOSE_ALL_CHANNEL);
  },
  onImageRefresh(callback: () => void): () => void {
    const listener = (): void => {
      callback();
    };
    ipcRenderer.on(PIN_IMAGE_UPDATED_CHANNEL, listener);
    return () => {
      ipcRenderer.removeListener(PIN_IMAGE_UPDATED_CHANNEL, listener);
    };
  },
  onClickThroughChanged(callback: (enabled: boolean) => void): () => void {
    const listener = (_event: Electron.IpcRendererEvent, enabled: unknown): void => {
      callback(Boolean(enabled));
    };
    ipcRenderer.on(PIN_CLICK_THROUGH_CHANGED_CHANNEL, listener);
    return () => {
      ipcRenderer.removeListener(PIN_CLICK_THROUGH_CHANGED_CHANNEL, listener);
    };
  }
});
