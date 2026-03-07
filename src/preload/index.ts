import { contextBridge, ipcRenderer } from "electron";

import { IPC_CHANNELS } from "../shared/channels";
import {
  AppErrorLogEntry,
  AppErrorLogInput,
  CatalogRebuildResult,
  CatalogScanConfig,
  ClipItem,
  DebugKeyEvent,
  ExecuteResult,
  LaunchItem,
  LaunchAtLoginStatus,
  SearchRequestOptions,
  SearchDisplayConfig
} from "../shared/types";

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
  isDebugKeysEnabled(): boolean {
    return process.env.LITELAUNCHER_DEBUG_KEYS === "1";
  },
  getInitialItems(): Promise<LaunchItem[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.getInitialItems);
  },
  getPinnedItems(): Promise<LaunchItem[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.getPinnedItems);
  },
  getPluginItems(): Promise<LaunchItem[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.getPluginItems);
  },
  getAppVersion(): Promise<string> {
    return ipcRenderer.invoke(IPC_CHANNELS.getAppVersion);
  },
  getSearchDisplayConfig(): Promise<SearchDisplayConfig> {
    return ipcRenderer.invoke(IPC_CHANNELS.getSearchDisplayConfig);
  },
  setSearchDisplayConfig(
    config: Partial<SearchDisplayConfig>
  ): Promise<SearchDisplayConfig> {
    return ipcRenderer.invoke(IPC_CHANNELS.setSearchDisplayConfig, config);
  },
  getCatalogScanConfig(): Promise<CatalogScanConfig> {
    return ipcRenderer.invoke(IPC_CHANNELS.getCatalogScanConfig);
  },
  setCatalogScanConfig(
    config: Partial<CatalogScanConfig>
  ): Promise<CatalogScanConfig> {
    return ipcRenderer.invoke(IPC_CHANNELS.setCatalogScanConfig, config);
  },
  rebuildCatalog(): Promise<CatalogRebuildResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.rebuildCatalog);
  },
  getLaunchAtLoginStatus(): Promise<LaunchAtLoginStatus> {
    return ipcRenderer.invoke(IPC_CHANNELS.getLaunchAtLoginStatus);
  },
  setLaunchAtLoginEnabled(enabled: boolean): Promise<LaunchAtLoginStatus> {
    return ipcRenderer.invoke(IPC_CHANNELS.setLaunchAtLoginEnabled, enabled);
  },
  setItemPinned(itemId: string, pinned: boolean): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.setItemPinned, itemId, pinned);
  },
  search(query: string, options?: SearchRequestOptions): Promise<LaunchItem[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.search, query, options);
  },
  execute(item: LaunchItem): Promise<ExecuteResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.execute, item);
  },
  setWindowSizePreset(preset: "compact" | "cashflow"): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.setWindowSizePreset, preset);
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
  reportErrorLog(input: AppErrorLogInput): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.reportErrorLog, input);
  },
  getErrorLogs(limit?: number): Promise<AppErrorLogEntry[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.getErrorLogs, limit);
  },
  clearErrorLogs(): Promise<number> {
    return ipcRenderer.invoke(IPC_CHANNELS.clearErrorLogs);
  },
  onFocusInput(handler: () => void): Cleanup {
    return on(IPC_CHANNELS.focusInput, handler);
  },
  onClearInput(handler: () => void): Cleanup {
    return on(IPC_CHANNELS.clearInput, handler);
  },
  onOpenPanel(handler: (panelPayload: unknown) => void): Cleanup {
    return on(IPC_CHANNELS.openPanel, (panelPayload) => handler(panelPayload));
  },
  onDebugKey(handler: (event: DebugKeyEvent) => void): Cleanup {
    return on(IPC_CHANNELS.debugKey, (event) =>
      handler(event as DebugKeyEvent)
    );
  }
};

contextBridge.exposeInMainWorld("launcher", api);
