import { contextBridge, ipcRenderer } from "electron";

import { IPC_CHANNELS } from "../shared/channels";
import type { SelectionPopupPayload } from "../shared/selection-translate";

const api = {
  close(): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.selectionPopupClose);
  },
  copyText(text: string): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.selectionPopupCopy, text);
  },
  getPayload(): Promise<SelectionPopupPayload | null> {
    return ipcRenderer.invoke(IPC_CHANNELS.selectionPopupPayload);
  },
  onPayload(listener: (payload: SelectionPopupPayload) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, payload: SelectionPopupPayload) => {
      listener(payload);
    };
    ipcRenderer.on(IPC_CHANNELS.selectionPopupPayload, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.selectionPopupPayload, handler);
    };
  }
};

contextBridge.exposeInMainWorld("selectionPopup", api);
