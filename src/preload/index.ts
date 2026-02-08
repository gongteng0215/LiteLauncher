import { contextBridge, ipcRenderer } from "electron";

import { IPC_CHANNELS } from "../shared/channels";
import { ClipItem, ExecuteResult, LaunchItem } from "../shared/types";

type Cleanup = () => void;

function on(
  channel: string,
  handler: (...args: unknown[]) => void
): Cleanup {
  const wrapped = (_event: unknown, ...args: unknown[]) => handler(...args);
  ipcRenderer.on(channel, wrapped);
  return () => {
    ipcRenderer.removeListener(channel, wrapped);
  };
}

const api = {
  getInitialItems(): Promise<LaunchItem[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.getInitialItems);
  },
  search(query: string): Promise<LaunchItem[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.search, query);
  },
  execute(item: LaunchItem): Promise<ExecuteResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.execute, item);
  },
  hide(): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.hide);
  },
  getClipItems(query: string): Promise<ClipItem[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.getClipItems, query);
  },
  copyClipItem(itemId: string): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.copyClipItem, itemId);
  },
  deleteClipItem(itemId: string): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.deleteClipItem, itemId);
  },
  clearClipItems(): Promise<number> {
    return ipcRenderer.invoke(IPC_CHANNELS.clearClipItems);
  },
  onFocusInput(handler: () => void): Cleanup {
    return on(IPC_CHANNELS.focusInput, handler);
  },
  onOpenPanel(handler: (panel: string) => void): Cleanup {
    return on(IPC_CHANNELS.openPanel, (panel) => handler(String(panel)));
  }
};

contextBridge.exposeInMainWorld("launcher", api);
