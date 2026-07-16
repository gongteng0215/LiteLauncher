import { contextBridge, ipcRenderer } from "electron";

import { IPC_CHANNELS } from "../shared/channels";
import {
  LiteSnapCloseAllPinnedWindowsResult,
  LiteSnapCommitCaptureInput,
  LiteSnapCommitCaptureResult,
  LiteSnapHistoryItem,
  LiteSnapOverlaySelection,
  LiteSnapOverlayState,
  LiteSnapPinnedWindowsToggleResult,
  LiteSnapRecognizeTextInput,
  LiteSnapRecognizeTextResult,
  LiteSnapSettings,
  LiteSnapSettingsUpdateResult,
  LiteSnapTogglePinClickThroughResult,
  LiteSnapTranslateSelectionInput,
  LiteSnapTranslateSelectionResult
} from "../shared/litesnap";
import {
  TranslateResult,
  TranslateSettings,
  TranslateTextInput
} from "../shared/translate";
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
  HomeSections,
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
  getHomeSections(): Promise<HomeSections> {
    return ipcRenderer.invoke(IPC_CHANNELS.getHomeSections);
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
  getAllPluginItems(): Promise<LaunchItem[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.getAllPluginItems);
  },
  getRequiredVisiblePluginIds(): Promise<string[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.getRequiredVisiblePluginIds);
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
  liteSnapStartColorCapture(): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapStartColorCapture);
  },
  liteSnapPinClipboard(): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapPinClipboard);
  },
  liteSnapTogglePinnedWindows(): Promise<LiteSnapPinnedWindowsToggleResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapTogglePinnedWindows);
  },
  liteSnapCloseAllPinnedWindows(): Promise<LiteSnapCloseAllPinnedWindowsResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapCloseAllPinnedWindows);
  },
  liteSnapToggleNearestPinClickThrough(): Promise<LiteSnapTogglePinClickThroughResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapToggleNearestPinClickThrough);
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
  liteSnapRecognizeText(
    input: LiteSnapRecognizeTextInput
  ): Promise<LiteSnapRecognizeTextResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapRecognizeText, input);
  },
  liteSnapTranslateSelection(
    input: LiteSnapTranslateSelectionInput
  ): Promise<LiteSnapTranslateSelectionResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapTranslateSelection, input);
  },
  liteSnapRecordRecentColor(color: string): Promise<string[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapRecordRecentColor, color);
  },
  liteSnapListHistory(): Promise<LiteSnapHistoryItem[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapListHistory);
  },
  liteSnapDeleteHistoryItem(id: string): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapDeleteHistoryItem, id);
  },
  liteSnapClearHistory(): Promise<number> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapClearHistory);
  },
  liteSnapHistoryCopy(id: string): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapHistoryCopy, id);
  },
  liteSnapHistoryPin(id: string): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapHistoryPin, id);
  },
  getTranslateToolSettings(): Promise<TranslateSettings> {
    return ipcRenderer.invoke(IPC_CHANNELS.getTranslateToolSettings);
  },
  setTranslateToolSettings(
    patch: Partial<TranslateSettings>
  ): Promise<TranslateSettings> {
    return ipcRenderer.invoke(IPC_CHANNELS.setTranslateToolSettings, patch);
  },
  translateToolTranslateText(
    input: TranslateTextInput
  ): Promise<TranslateResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.translateToolTranslateText, input);
  },
  lookupDictionaryWord(
    word: string
  ): Promise<import("../shared/dictionary").DictionaryEntry | undefined> {
    return ipcRenderer.invoke(IPC_CHANNELS.lookupDictionaryWord, word);
  },
  getSelectionTranslateSettings(): Promise<
    import("../shared/selection-translate").SelectionTranslateSettings
  > {
    return ipcRenderer.invoke(IPC_CHANNELS.getSelectionTranslateSettings);
  },
  setSelectionTranslateSettings(
    patch: Partial<
      import("../shared/selection-translate").SelectionTranslateSettings
    >
  ): Promise<import("../shared/selection-translate").SelectionTranslateSettings> {
    return ipcRenderer.invoke(IPC_CHANNELS.setSelectionTranslateSettings, patch);
  },
  liteSnapProbeOcr(): Promise<import("../shared/litesnap-ocr-help").LiteSnapOcrProbeResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapProbeOcr);
  },
  liteSnapGetOcrCapabilities(): Promise<
    import("../shared/litesnap-ocr-help").LiteSnapOcrCapabilitiesResult
  > {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapGetOcrCapabilities);
  },
  liteSnapInstallOcrCapabilities(
    languages?: import("../shared/litesnap-ocr-help").LiteSnapOcrCapabilityLanguage[]
  ): Promise<
    import("../shared/litesnap-ocr-help").LiteSnapOcrCapabilityInstallResult
  > {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapInstallOcrCapabilities, languages);
  },
  liteSnapGetOcrProbeCache(): Promise<
    import("../shared/litesnap-ocr-help").LiteSnapOcrProbeCache | null
  > {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapGetOcrProbeCache);
  },
  liteSnapSetOcrProbeCache(
    cache: import("../shared/litesnap-ocr-help").LiteSnapOcrProbeCache
  ): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapSetOcrProbeCache, cache);
  },
  liteSnapCancelCapture(): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapCancelCapture);
  },
  liteSnapSetDisplayFollowLocked(locked: boolean): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapSetDisplayFollowLocked, Boolean(locked));
  },
  liteSnapEnsureSourceImage(): Promise<string | null> {
    return ipcRenderer.invoke(IPC_CHANNELS.liteSnapEnsureSourceImage);
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
  relaunchApp(): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.relaunchApp);
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
