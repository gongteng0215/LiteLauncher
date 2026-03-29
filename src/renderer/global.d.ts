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

interface RendererPluginConstants {
  CASHFLOW_PLUGIN_ID: string;
  WEBTOOLS_PASSWORD_PLUGIN_ID: string;
  WEBTOOLS_JSON_PLUGIN_ID: string;
  WEBTOOLS_URL_PLUGIN_ID: string;
  WEBTOOLS_DIFF_PLUGIN_ID: string;
  WEBTOOLS_TIMESTAMP_PLUGIN_ID: string;
  WEBTOOLS_REGEX_PLUGIN_ID: string;
  WEBTOOLS_CRON_PLUGIN_ID: string;
  WEBTOOLS_CRYPTO_PLUGIN_ID: string;
  WEBTOOLS_JWT_PLUGIN_ID: string;
  WEBTOOLS_STRINGS_PLUGIN_ID: string;
  WEBTOOLS_COLORS_PLUGIN_ID: string;
  WEBTOOLS_IMAGE_BASE64_PLUGIN_ID: string;
  WEBTOOLS_CONFIG_PLUGIN_ID: string;
  WEBTOOLS_SQL_PLUGIN_ID: string;
  WEBTOOLS_UNIT_PLUGIN_ID: string;
  WEBTOOLS_QRCODE_PLUGIN_ID: string;
  WEBTOOLS_MARKDOWN_PLUGIN_ID: string;
  WEBTOOLS_UA_PLUGIN_ID: string;
  WEBTOOLS_API_PLUGIN_ID: string;
  WEBTOOLS_HTTP_MOCK_PLUGIN_ID: string;
  DEFAULT_VISIBLE_PLUGIN_IDS: string[];
}

interface RendererPluginStaticData {
  WEBTOOLS_SQL_DEFAULT_INPUT: string;
  WEBTOOLS_SQL_DIALECT_OPTIONS: Array<{ value: string; label: string }>;
  WEBTOOLS_SQL_INDENT_OPTIONS: Array<{ value: number; label: string }>;
  WEBTOOLS_CONFIG_DEFAULT_INPUT: string;
  WEBTOOLS_CONFIG_FORMAT_OPTIONS: Array<{ value: string; label: string }>;
  WEBTOOLS_COLORS_PRESETS: string[];
  WEBTOOLS_REGEX_DEFAULT_PATTERN: string;
  WEBTOOLS_REGEX_DEFAULT_INPUT: string;
  WEBTOOLS_REGEX_SAFE_FLAGS: string;
  WEBTOOLS_REGEX_TEMPLATES: Array<{ label: string; pattern: string; flags: string }>;
  WEBTOOLS_PASSWORD_DEFAULT_SYMBOLS: string;
  WEBTOOLS_JWT_DEFAULT_SECRET: string;
  WEBTOOLS_JWT_SAMPLE_TOKEN: string;
  WEBTOOLS_JWT_SAMPLE_HEADER: string;
  WEBTOOLS_JWT_SAMPLE_PAYLOAD: string;
  SEARCH_SCOPE_PREFIX_RULES: Array<{
    scope: string;
    label: string;
    prefixes: string[];
  }>;
}

interface RendererPluginHandlerConfigItem {
  pluginId: string;
  formSelector: string;
  enterActionKey: string;
}

interface RendererPanelImpls {
  applyWebtoolsPasswordPanelPayload(panel: unknown): void;
  renderWebtoolsPasswordPanel(): void;
  applyWebtoolsJsonPanelPayload(panel: unknown): void;
  renderWebtoolsJsonPanel(): void;
  applyWebtoolsUrlPanelPayload(panel: unknown): void;
  renderWebtoolsUrlPanel(): void;
  applyWebtoolsDiffPanelPayload(panel: unknown): void;
  renderWebtoolsDiffPanel(): void;
  applyWebtoolsTimestampPanelPayload(panel: unknown): void;
  renderWebtoolsTimestampPanel(): void;
  applyWebtoolsStringsPanelPayload(panel: unknown): void;
  renderWebtoolsStringsPanel(): void;
  applyWebtoolsColorsPanelPayload(panel: unknown): void;
  renderWebtoolsColorsPanel(): void;
  applyWebtoolsImageBase64PanelPayload(panel: unknown): void;
  renderWebtoolsImageBase64Panel(): void;
  applyWebtoolsConfigPanelPayload(panel: unknown): void;
  renderWebtoolsConfigPanel(): void;
  applyWebtoolsSqlPanelPayload(panel: unknown): void;
  renderWebtoolsSqlPanel(): void;
  applyWebtoolsQrcodePanelPayload(panel: unknown): void;
  renderWebtoolsQrcodePanel(): void;
  applyWebtoolsMarkdownPanelPayload(panel: unknown): void;
  renderWebtoolsMarkdownPanel(): void;
  applyWebtoolsCronPanelPayload(panel: unknown): void;
  renderWebtoolsCronPanel(): void;
  applyWebtoolsUaPanelPayload(panel: unknown): void;
  renderWebtoolsUaPanel(): void;
  applyWebtoolsApiPanelPayload(panel: unknown): void;
  renderWebtoolsApiPanel(): void;
  applyWebtoolsHttpMockPanelPayload(panel: unknown): void;
  renderWebtoolsHttpMockPanel(): void;
}

declare global {
  interface Window {
    __LL_PLUGIN_CONSTANTS__?: RendererPluginConstants;
    __LL_PLUGIN_STATIC_DATA__?: RendererPluginStaticData;
    __LL_PLUGIN_HANDLER_CONFIGS__?: RendererPluginHandlerConfigItem[];
    __LL_PANEL_IMPLS__?: RendererPanelImpls;
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
      getVisiblePluginIds(): Promise<string[]>;
      setVisiblePluginIds(pluginIds: string[]): Promise<string[]>;
      rebuildCatalog(): Promise<CatalogRebuildResult>;
      getLaunchAtLoginStatus(): Promise<LaunchAtLoginStatus>;
      setLaunchAtLoginEnabled(enabled: boolean): Promise<LaunchAtLoginStatus>;
      setItemPinned(itemId: string, pinned: boolean): Promise<boolean>;
      search(query: string, options?: SearchRequestOptions): Promise<LaunchItem[]>;
      resolveCommandQuery(query: string): Promise<LaunchItem[]>;
      execute(item: LaunchItem): Promise<ExecuteResult>;
      setWindowSizePreset(preset: "compact" | "cashflow"): Promise<boolean>;
      setAutoHideSuspended(suspended: boolean): Promise<boolean>;
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
