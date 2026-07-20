import { contextBridge, ipcRenderer } from "electron";

import { IPC_CHANNELS } from "../shared/channels";

const api = {
  close(point?: { x: number; y: number }): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.selectionPopupClose, point);
  }
};

contextBridge.exposeInMainWorld("selectionBackdrop", api);
