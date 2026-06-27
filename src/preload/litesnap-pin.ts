import { contextBridge, ipcRenderer } from "electron";

const PIN_VISUAL_STATE_CHANNEL = "litesnap-pin:visual-state";
const PIN_COPY_CHANNEL = "litesnap-pin:copy";

contextBridge.exposeInMainWorld("liteSnapPin", {
  setVisualState(scale: number, opacity: number): void {
    if (!Number.isFinite(scale) || !Number.isFinite(opacity)) {
      return;
    }

    ipcRenderer.send(PIN_VISUAL_STATE_CHANNEL, scale, opacity);
  },
  copyToClipboard(): void {
    ipcRenderer.send(PIN_COPY_CHANNEL);
  }
});
