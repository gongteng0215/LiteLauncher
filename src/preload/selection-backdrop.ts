import { contextBridge, ipcRenderer } from "electron";

import { IPC_CHANNELS } from "../shared/channels";

const api = {
  close(): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.selectionPopupClose);
  }
};

contextBridge.exposeInMainWorld("selectionBackdrop", api);
