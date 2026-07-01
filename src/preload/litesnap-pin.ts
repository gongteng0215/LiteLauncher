import { contextBridge, ipcRenderer } from "electron";

const PIN_VISUAL_STATE_CHANNEL = "litesnap-pin:visual-state";
const PIN_COPY_CHANNEL = "litesnap-pin:copy";
const PIN_SAVE_CHANNEL = "litesnap-pin:save";
const PIN_MOVE_CHANNEL = "litesnap-pin:move-by";

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
  moveBy(deltaX: number, deltaY: number): void {
    if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
      return;
    }

    ipcRenderer.send(PIN_MOVE_CHANNEL, deltaX, deltaY);
  }
});
