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

declare global {
  interface Window {
    launcher: {
      isDebugKeysEnabled(): boolean;
      getInitialItems(): Promise<LaunchItem[]>;
      getPinnedItems(): Promise<LaunchItem[]>;
      getPluginItems(): Promise<LaunchItem[]>;
      getAppVersion(): Promise<string>;
      getSearchDisplayConfig(): Promise<SearchDisplayConfig>;
      setSearchDisplayConfig(
        config: Partial<SearchDisplayConfig>
      ): Promise<SearchDisplayConfig>;
      getCatalogScanConfig(): Promise<CatalogScanConfig>;
      setCatalogScanConfig(
        config: Partial<CatalogScanConfig>
      ): Promise<CatalogScanConfig>;
      rebuildCatalog(): Promise<CatalogRebuildResult>;
      getLaunchAtLoginStatus(): Promise<LaunchAtLoginStatus>;
      setLaunchAtLoginEnabled(enabled: boolean): Promise<LaunchAtLoginStatus>;
      setItemPinned(itemId: string, pinned: boolean): Promise<boolean>;
      search(query: string, options?: SearchRequestOptions): Promise<LaunchItem[]>;
      execute(item: LaunchItem): Promise<ExecuteResult>;
      setWindowSizePreset(preset: "compact" | "cashflow"): Promise<boolean>;
      hide(): Promise<boolean>;
      getClipItems(query: string): Promise<ClipItem[]>;
      copyClipItem(itemId: string): Promise<boolean>;
      deleteClipItem(itemId: string): Promise<boolean>;
      clearClipItems(): Promise<number>;
      reportErrorLog(input: AppErrorLogInput): Promise<boolean>;
      getErrorLogs(limit?: number): Promise<AppErrorLogEntry[]>;
      clearErrorLogs(): Promise<number>;
      onFocusInput(handler: () => void): () => void;
      onClearInput(handler: () => void): () => void;
      onOpenPanel(handler: (panelPayload: unknown) => void): () => void;
      onDebugKey(handler: (event: DebugKeyEvent) => void): () => void;
    };
  }
}

export {};
