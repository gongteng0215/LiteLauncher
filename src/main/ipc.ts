import { BrowserWindow, ipcMain } from "electron";

import { IPC_CHANNELS } from "../shared/channels";
import { ClipItem, ExecuteResult, LaunchItem } from "../shared/types";
import { executeItem } from "./actions";
import { UsageStore } from "./usage-store";

type SearchProvider = {
  getInitialItems: (limit: number) => Promise<LaunchItem[]>;
  searchItems: (query: string, limit: number) => Promise<LaunchItem[]>;
};

type ClipProvider = {
  getClipItems: (query: string, limit: number) => Promise<ClipItem[]>;
  copyClipItem: (itemId: string) => Promise<boolean>;
  deleteClipItem: (itemId: string) => Promise<boolean>;
  clearClipItems: () => Promise<number>;
};

type IpcOptions = {
  searchProvider: SearchProvider;
  clipProvider: ClipProvider;
  usageStore: UsageStore;
  onItemUsed?: (itemId: string) => Promise<void>;
};

const HANDLED_CHANNELS = [
  IPC_CHANNELS.getInitialItems,
  IPC_CHANNELS.search,
  IPC_CHANNELS.execute,
  IPC_CHANNELS.hide,
  IPC_CHANNELS.getClipItems,
  IPC_CHANNELS.copyClipItem,
  IPC_CHANNELS.deleteClipItem,
  IPC_CHANNELS.clearClipItems
] as const;

export function registerIpcHandlers(
  window: BrowserWindow,
  options: IpcOptions
): void {
  for (const channel of HANDLED_CHANNELS) {
    ipcMain.removeHandler(channel);
  }

  ipcMain.handle(IPC_CHANNELS.getInitialItems, async () => {
    return options.searchProvider.getInitialItems(10);
  });

  ipcMain.handle(IPC_CHANNELS.search, async (_, query: string) => {
    return options.searchProvider.searchItems(query ?? "", 20);
  });

  ipcMain.handle(IPC_CHANNELS.execute, async (_, itemInput: LaunchItem) => {
    const selected = itemInput;
    if (!selected) {
      return { ok: false, message: "No selected item" } satisfies ExecuteResult;
    }

    const result = await executeItem(selected, window);
    if (result.ok) {
      options.usageStore.markUsed(selected.id);
      if (options.onItemUsed) {
        await options.onItemUsed(selected.id);
      }
      if (!result.keepOpen) {
        window.hide();
      }
    }

    return result;
  });

  ipcMain.handle(IPC_CHANNELS.hide, () => {
    window.hide();
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.getClipItems, async (_, query: string) => {
    return options.clipProvider.getClipItems(query ?? "", 50);
  });

  ipcMain.handle(IPC_CHANNELS.copyClipItem, async (_, itemId: string) => {
    return options.clipProvider.copyClipItem(itemId);
  });

  ipcMain.handle(IPC_CHANNELS.deleteClipItem, async (_, itemId: string) => {
    return options.clipProvider.deleteClipItem(itemId);
  });

  ipcMain.handle(IPC_CHANNELS.clearClipItems, async () => {
    return options.clipProvider.clearClipItems();
  });
}
