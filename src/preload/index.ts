import { contextBridge, ipcRenderer } from "electron";

import { IPC_CHANNELS } from "../shared/channels";
import {
  LiteSnapCommitCaptureInput,
  LiteSnapCommitCaptureResult,
  LiteSnapOverlaySelection,
  LiteSnapOverlayState,
  LiteSnapPinnedWindowsToggleResult,
  LiteSnapSettings,
  LiteSnapSettingsUpdateResult
} from "../shared/litesnap";
import {
  AppErrorLogEntry,
  AppErrorLogInput,
  AppUpdaterStatus,
  CatalogRebuildResult,
  CatalogScanConfig,
  ClipItem,
  DebugKeyEvent,
  ExecuteResult,
  LaunchItem,
  LaunchAtLoginStatus,
  PinToggleResult,
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
  getAppUpdaterStatus(): Promise<AppUpdaterStatus> {
    return ipcRenderer.invoke(IPC_CHANNELS.getAppUpdaterStatus);
  },
  setE2EAppUpdaterCheckFailure(message: string | null): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.setE2EAppUpdaterCheckFailure, message);
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
  getVisiblePluginIds(): Promise<string[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.getVisiblePluginIds);
  },
  setVisiblePluginIds(pluginIds: string[]): Promise<string[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.setVisiblePluginIds, pluginIds);
  },
  getLiteSnapSettings(): Promise<LiteSnapSettings> {
    return ipcRenderer.invoke(IPC_CHANNELS.getLiteSnapSettings);
  },
  setLiteSnapSettings(
    patch: Partial<LiteSnapSettings>
  ): Promise<LiteSnapSettingsUpdateResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.setLiteSnapSettings, patch);
  },
  liteSnapStartCapture(): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapStartCapture);
  },
  liteSnapPinClipboard(): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapPinClipboard);
  },
  liteSnapTogglePinnedWindows(): Promise<LiteSnapPinnedWindowsToggleResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapTogglePinnedWindows);
  },
  liteSnapGetOverlayState(): Promise<LiteSnapOverlayState | null> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapGetOverlayState);
  },
  liteSnapGetWindowRectAtPoint(
    x: number,
    y: number
  ): Promise<LiteSnapOverlaySelection | null> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapGetWindowRectAtPoint, x, y);
  },
  onLiteSnapOverlayStateChanged(
    handler: (state: LiteSnapOverlayState | null) => void
  ): Cleanup {
    return on(IPC_CHANNELS.liteSnapOverlayStateChanged, (state) =>
      handler(state as LiteSnapOverlayState | null)
    );
  },
  liteSnapCommitCapture(
    input: LiteSnapCommitCaptureInput
  ): Promise<LiteSnapCommitCaptureResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapCommitCapture, input);
  },
  liteSnapCancelCapture(): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapCancelCapture);
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
  checkForAppUpdates(): Promise<AppUpdaterStatus> {
    return ipcRenderer.invoke(IPC_CHANNELS.checkForAppUpdates);
  },
  installAppUpdateNow(): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.installAppUpdateNow);
  },
  setItemPinned(
    itemId: string,
    pinned: boolean,
    item?: LaunchItem
  ): Promise<PinToggleResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.setItemPinned, itemId, pinned, item);
  },
  search(query: string, options?: SearchRequestOptions): Promise<LaunchItem[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.search, query, options);
  },
  resolveCommandQuery(query: string): Promise<LaunchItem[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.resolveCommandQuery, query);
  },
  execute(item: LaunchItem): Promise<ExecuteResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.execute, item);
  },
  setWindowSizePreset(preset: "compact" | "cashflow"): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.setWindowSizePreset, preset);
  },
  setAutoHideSuspended(suspended: boolean): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.setAutoHideSuspended, suspended);
  },
  pickFilePath(): Promise<string | null> {
    return ipcRenderer.invoke(IPC_CHANNELS.pickFilePath);
  },
  pickDirectoryPath(): Promise<string | null> {
    return ipcRenderer.invoke(IPC_CHANNELS.pickDirectoryPath);
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
