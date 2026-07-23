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
  LiteSnapTogglePinClickThroughResult,
  LiteSnapTranslateSelectionInput,
  LiteSnapTranslateSelectionResult,
  LiteSnapSettings,
  LiteSnapSettingsUpdateResult
} from "../shared/litesnap";
import {
  TranslateResult,
  TranslateSettings,
  TranslateTextInput
} from "../shared/translate";
import {
  UiThemeConfig,
  UiThemePresetId
} from "../shared/ui-theme";

interface RendererPluginConstants {
  CASHFLOW_PLUGIN_ID: string;
  HARDWARE_INSPECTOR_PLUGIN_ID: string;
  CLIPBOARD_WORKBENCH_PLUGIN_ID: string;
  LITESNAP_PLUGIN_ID: string;
  WEBTOOLS_PASSWORD_PLUGIN_ID: string;
  WEBTOOLS_JSON_PLUGIN_ID: string;
  WEBTOOLS_JSON_SCHEMA_PLUGIN_ID: string;
  WEBTOOLS_DATA_MASK_PLUGIN_ID: string;
  WEBTOOLS_URL_PLUGIN_ID: string;
  WEBTOOLS_DIFF_PLUGIN_ID: string;
  WEBTOOLS_TIMESTAMP_PLUGIN_ID: string;
  WEBTOOLS_TRANSLATE_PLUGIN_ID: string;
  DICTIONARY_PLUGIN_ID: string;
  WEBTOOLS_REGEX_PLUGIN_ID: string;
  WEBTOOLS_CRON_PLUGIN_ID: string;
  WEBTOOLS_CRYPTO_PLUGIN_ID: string;
  WEBTOOLS_JWT_PLUGIN_ID: string;
  WEBTOOLS_STRINGS_PLUGIN_ID: string;
  WEBTOOLS_COLORS_PLUGIN_ID: string;
  WEBTOOLS_IMAGE_BASE64_PLUGIN_ID: string;
  WEBTOOLS_IMAGE_PROMPT_PLUGIN_ID: string;
  WEBTOOLS_CONFIG_PLUGIN_ID: string;
  WEBTOOLS_SQL_PLUGIN_ID: string;
  WEBTOOLS_UNIT_PLUGIN_ID: string;
  WEBTOOLS_FILE_HASH_PLUGIN_ID: string;
  WEBTOOLS_PORT_HELPER_PLUGIN_ID: string;
  WEBTOOLS_QRCODE_PLUGIN_ID: string;
  WEBTOOLS_MARKDOWN_PLUGIN_ID: string;
  WEBTOOLS_UA_PLUGIN_ID: string;
  WEBTOOLS_API_PLUGIN_ID: string;
  WEBTOOLS_HTTP_MOCK_PLUGIN_ID: string;
  CODEAGENT_SWITCH_PLUGIN_ID: string;
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

interface RendererImagePromptData {
  products: Array<{
    id: string;
    label: string;
    description: string;
  }>;
  optionGroups: Array<{
    key: string;
    label: string;
    description: string;
    options: string[];
    categories?: Array<{ label: string; options: string[] }>;
    allowCustom: boolean;
  }>;
  stylePresets: Array<{
    id: string;
    group: string;
    label: string;
    description: string;
    defaults: Partial<Record<string, string[]>>;
    optionGroups: Partial<Record<string, string[]>>;
    textDefaults?: Partial<{
      exact: string;
      position: string;
      style: string;
      designId: string;
      design: string;
      title: string;
      subtitle: string;
      label: string;
      name: string;
      age: string;
      layout: string;
      hierarchy: string;
      color: string;
      effect: string;
      safeArea: string;
      flags: string[];
    }>;
  }>;
  smartTemplates: Array<{
    id: string;
    label: string;
    description: string;
    stylePresetId: string;
    patch: {
      selections?: Partial<Record<string, string[]>>;
      custom?: Partial<Record<string, string>>;
      text?: Partial<{
        exact: string;
        position: string;
        style: string;
        designId: string;
        design: string;
        title: string;
        subtitle: string;
        label: string;
        name: string;
        age: string;
        layout: string;
        hierarchy: string;
        color: string;
        effect: string;
        safeArea: string;
        flags: string[];
      }>;
      photoDescription?: string;
      constraints?: string[];
    };
  }>;
  textOptions: {
    positions: string[];
    styles: string[];
    designs: Array<{
      id: string;
      label: string;
      summary: string;
      typography: string;
      color: string;
      effect: string;
      layout: string;
      hierarchy: string;
      safeArea: string;
      keywords: string[];
    }>;
    flags: string[];
  };
}

interface RendererPanelImpls {
  handleStandalonePanelPayload(panelPayload: unknown): string | null;
  handleGenericPluginPanelPayload(panelPayload: unknown): string | null;
  renderPasswordPanel(): void;
  handlePasswordPanelEnter(): void;
  renderCashflowPanel(): void;
  refreshCashflowPanel(): Promise<boolean>;
  handleCashflowPanelEnter(): void;
  renderActivePluginPanel(): void;
  handleActivePluginPanelEnter(): void;
  handleActivePluginPanelEscape(): boolean;
  getActivePluginPanelTitle(): string | null;
  cleanupPluginPanelTransientState(activePluginId: string | null): void;
  applyHardwareInspectorPanelPayload(panel: unknown): void;
  renderHardwareInspectorPanel(): void;
  applyClipboardWorkbenchPanelPayload(panel: unknown): void;
  renderClipboardWorkbenchPanel(): void;
  applyLiteSnapPanelPayload(panel: unknown): void;
  renderLiteSnapPanel(): void;
  applyWebtoolsPasswordPanelPayload(panel: unknown): void;
  renderWebtoolsPasswordPanel(): void;
  applyWebtoolsJsonPanelPayload(panel: unknown): void;
  renderWebtoolsJsonPanel(): void;
  applyWebtoolsJsonSchemaPanelPayload(panel: unknown): void;
  renderWebtoolsJsonSchemaPanel(): void;
  applyWebtoolsDataMaskPanelPayload(panel: unknown): void;
  renderWebtoolsDataMaskPanel(): void;
  applyWebtoolsUrlPanelPayload(panel: unknown): void;
  renderWebtoolsUrlPanel(): void;
  applyWebtoolsDiffPanelPayload(panel: unknown): void;
  renderWebtoolsDiffPanel(): void;
  applyWebtoolsTimestampPanelPayload(panel: unknown): void;
  renderWebtoolsTimestampPanel(): void;
  applyWebtoolsTranslatePanelPayload(panel: unknown): void;
  renderWebtoolsTranslatePanel(): void;
  applyDictionaryPanelPayload(panel: unknown): void;
  renderDictionaryPanel(): void;
  applyWebtoolsRegexPanelPayload(panel: unknown): void;
  renderWebtoolsRegexPanel(): void;
  applyWebtoolsCryptoPanelPayload(panel: unknown): void;
  renderWebtoolsCryptoPanel(): void;
  applyWebtoolsJwtPanelPayload(panel: unknown): void;
  renderWebtoolsJwtPanel(): void;
  applyWebtoolsStringsPanelPayload(panel: unknown): void;
  renderWebtoolsStringsPanel(): void;
  applyWebtoolsColorsPanelPayload(panel: unknown): void;
  renderWebtoolsColorsPanel(): void;
  applyWebtoolsImageBase64PanelPayload(panel: unknown): void;
  renderWebtoolsImageBase64Panel(): void;
  applyWebtoolsImagePromptPanelPayload(panel: unknown): void;
  renderWebtoolsImagePromptPanel(): void;
  applyWebtoolsConfigPanelPayload(panel: unknown): void;
  renderWebtoolsConfigPanel(): void;
  applyWebtoolsSqlPanelPayload(panel: unknown): void;
  renderWebtoolsSqlPanel(): void;
  applyWebtoolsUnitPanelPayload(panel: unknown): void;
  renderWebtoolsUnitPanel(): void;
  applyWebtoolsFileHashPanelPayload(panel: unknown): void;
  renderWebtoolsFileHashPanel(): void;
  applyWebtoolsPortHelperPanelPayload(panel: unknown): void;
  renderWebtoolsPortHelperPanel(): void;
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
  applyCodeAgentSwitchPanelPayload(panel: unknown): void;
  renderCodeAgentSwitchPanel(): void;
}


interface RendererCommandCenterConfig {
  quickEntries: Array<{
    label: string;
    icon: string;
    action: {
      type: "plugin" | "settings" | "target";
      pluginId?: string;
      action?: string;
      focus?: "plugins" | "errors" | "updates" | "pinned";
      target?: string;
      title?: string;
    };
    danger?: boolean;
  }>;
  systemEntries: RendererCommandCenterConfig["quickEntries"];
  footerEntries: RendererCommandCenterConfig["quickEntries"];
  suggestions: string[];
}

interface RendererCommandCenterIcons {
  createIconElement: (name: string, compact?: boolean) => HTMLSpanElement;
  pluginColors: Record<string, string>;
  icons: Record<string, string>;
}

interface RendererCommandCenterUi {
  initCommandCenterUi: (hooks: {
    onSidebarAction: (action: RendererCommandCenterConfig["quickEntries"][number]["action"]) => void;
    onTogglePinnedManage?: () => void;
  }) => void;
  syncHomeChromeVisibility: (
    mode: "search" | "clip" | "settings" | "password" | "cashflow" | "plugin"
  ) => void;
  clearHomeSections: () => void;
  updateCommandCenterQueryState: (hasQuery: boolean) => void;
  setCommandSearchStatus: (message: string | null) => void;
  showToast: (message: string) => void;
  getSectionGrid: (sectionId: "recent" | "pinned" | "plugin") => HTMLUListElement | null;
  updateSectionCount: (
    sectionId: "recent" | "pinned" | "plugin",
    visible: number,
    total: number
  ) => void;
  appendPluginAddChip: (onClick: () => void) => void;
  scrollToPlugins: () => void;
  openSettingsOverlay: (render: (container: HTMLElement) => void) => void;
  closeSettingsOverlay: () => void;
  isSettingsOverlayOpen: () => boolean;
  getPinnedActionsHost: () => HTMLElement | null;
  getPluginPagerHost: () => HTMLElement | null;
  getCommandResultsHost: () => HTMLElement | null;
}

declare global {
  interface Window {
    __LL_PLUGIN_CONSTANTS__?: RendererPluginConstants;
    __LL_COMMAND_CENTER_CONFIG__?: RendererCommandCenterConfig;
    __LL_COMMAND_CENTER_ICONS__?: RendererCommandCenterIcons;
    __LL_COMMAND_CENTER_UI__?: RendererCommandCenterUi;
    __LL_PLUGIN_STATIC_DATA__?: RendererPluginStaticData;
    __LL_IMAGE_PROMPT_DATA__?: RendererImagePromptData;
    __LL_PLUGIN_HANDLER_CONFIGS__?: RendererPluginHandlerConfigItem[];
    __LL_LITESNAP_TEXT_UTILS__?: {
      normalizeLiteSnapOcrText(text: string): string;
      getLiteSnapOcrHelp(issue: "module_missing" | "language_pack"): {
        title: string;
        steps: string[];
        showRelaunchButton: boolean;
      };
      inferLiteSnapOcrIssue(message: string): "module_missing" | "language_pack" | null;
      isLiteSnapOcrIssue(value: unknown): value is "module_missing" | "language_pack";
      WINDOWS_10_OCR_SETUP_STEPS: readonly string[];
      resolveMissingOcrCapabilityLanguages(
        capabilities: Array<{ languageTag: "zh-CN" | "en-US"; installed: boolean }> | null | undefined,
        probe?: { chineseReady?: boolean; englishReady?: boolean } | null
      ): Array<"zh-CN" | "en-US">;
      shouldShowLiteSnapOcrInstallButton(
        capabilities: Array<{ languageTag: "zh-CN" | "en-US"; installed: boolean }> | null | undefined,
        probe?: {
          ok?: boolean;
          moduleLoaded?: boolean;
          chineseReady?: boolean;
          englishReady?: boolean;
        } | null
      ): boolean;
      formatLiteSnapOcrInstallButtonLabel(
        languages: Array<"zh-CN" | "en-US">
      ): string;
      reconcileOcrCapabilitiesWithProbe(
        capabilities: Array<{
          languageTag: "zh-CN" | "en-US";
          capabilityName: string;
          state: string;
          installed: boolean;
        }>,
        probe: { chineseReady?: boolean; englishReady?: boolean }
      ): Array<{
        languageTag: "zh-CN" | "en-US";
        capabilityName: string;
        state: string;
        installed: boolean;
      }>;
    };
    __LL_PANEL_IMPLS__?: RendererPanelImpls;
    __LL_PREPARE_HIDE__?: () => void;
    __LL_UI_THEME__?: {
      DEFAULT: UiThemeConfig;
      PRESETS: Array<{
        id: Exclude<UiThemePresetId, "custom">;
        label: string;
        theme: Omit<UiThemeConfig, "presetId">;
      }>;
      normalize(input: Partial<UiThemeConfig> | null | undefined): UiThemeConfig;
      fromPreset(id: Exclude<UiThemePresetId, "custom">): UiThemeConfig;
      fromAccent(accent: string, base?: UiThemeConfig): UiThemeConfig;
      apply(theme: UiThemeConfig): void;
    };
    launcher: {
      isDebugKeysEnabled(): boolean;
      getInitialItems(): Promise<LaunchItem[]>;
      getPinnedItems(): Promise<LaunchItem[]>;
      getPluginItems(): Promise<LaunchItem[]>;
      getHomeSections(): Promise<HomeSections>;
      getAppVersion(): Promise<string>;
      getAppUpdaterStatus(): Promise<AppUpdaterStatus>;
      setE2EAppUpdaterCheckFailure(message: string | null): Promise<boolean>;
      getSearchDisplayConfig(): Promise<SearchDisplayConfig>;
      setSearchDisplayConfig(
        config: Partial<SearchDisplayConfig>
      ): Promise<SearchDisplayConfig>;
      getUiThemeConfig(): Promise<UiThemeConfig>;
      setUiThemeConfig(
        config: Partial<UiThemeConfig>
      ): Promise<UiThemeConfig>;
      getCatalogScanConfig(): Promise<CatalogScanConfig>;
      setCatalogScanConfig(
        config: Partial<CatalogScanConfig>
      ): Promise<CatalogScanConfig>;
      getVisiblePluginIds(): Promise<string[]>;
      setVisiblePluginIds(pluginIds: string[]): Promise<string[]>;
      getAllPluginItems(): Promise<LaunchItem[]>;
      getRequiredVisiblePluginIds(): Promise<string[]>;
      getLiteSnapSettings(): Promise<LiteSnapSettings>;
      setLiteSnapSettings(
        patch: Partial<LiteSnapSettings>
      ): Promise<LiteSnapSettingsUpdateResult>;
      liteSnapStartCapture(): Promise<boolean>;
      liteSnapStartColorCapture(): Promise<boolean>;
      liteSnapPinClipboard(): Promise<boolean>;
      liteSnapTogglePinnedWindows(): Promise<LiteSnapPinnedWindowsToggleResult>;
      liteSnapCloseAllPinnedWindows(): Promise<LiteSnapCloseAllPinnedWindowsResult>;
      liteSnapToggleNearestPinClickThrough(): Promise<LiteSnapTogglePinClickThroughResult>;
      liteSnapListHistory(): Promise<LiteSnapHistoryItem[]>;
      liteSnapDeleteHistoryItem(id: string): Promise<boolean>;
      liteSnapClearHistory(): Promise<number>;
      liteSnapHistoryCopy(id: string): Promise<boolean>;
      liteSnapHistoryPin(id: string): Promise<boolean>;
      liteSnapGetOverlayState(): Promise<LiteSnapOverlayState | null>;
      liteSnapGetWindowRectAtPoint(
        x: number,
        y: number
      ): Promise<LiteSnapOverlaySelection | null>;
      onLiteSnapOverlayStateChanged(
        handler: (state: LiteSnapOverlayState | null) => void
      ): () => void;
      liteSnapCommitCapture(
        input: LiteSnapCommitCaptureInput
      ): Promise<LiteSnapCommitCaptureResult>;
      liteSnapRecognizeText(
        input: LiteSnapRecognizeTextInput
      ): Promise<LiteSnapRecognizeTextResult>;
      liteSnapTranslateSelection(
        input: LiteSnapTranslateSelectionInput
      ): Promise<LiteSnapTranslateSelectionResult>;
      liteSnapRecordRecentColor(color: string): Promise<string[]>;
      getTranslateToolSettings(): Promise<TranslateSettings>;
      setTranslateToolSettings(
        patch: Partial<TranslateSettings>
      ): Promise<TranslateSettings>;
      translateToolTranslateText(
        input: TranslateTextInput
      ): Promise<TranslateResult>;
      lookupDictionaryWord(
        word: string
      ): Promise<import("../shared/dictionary").DictionaryEntry | undefined>;
      lookupDictionaryCandidates(
        word: string,
        limit?: number
      ): Promise<import("../shared/dictionary").DictionaryEntry[]>;
      getDictionaryPanelState(): Promise<
        import("../shared/dictionary").DictionaryPanelState
      >;
      recordDictionaryLookup(input: {
        query: string;
        entry?: import("../shared/dictionary").DictionaryEntry | null;
      }): Promise<import("../shared/dictionary").DictionaryPanelState>;
      toggleDictionaryFavorite(input: {
        word: string;
        entry?: import("../shared/dictionary").DictionaryEntry | null;
      }): Promise<import("../shared/dictionary").DictionaryPanelState>;
      removeDictionaryHistoryItem(
        word: string
      ): Promise<import("../shared/dictionary").DictionaryPanelState>;
      clearDictionaryHistory(): Promise<
        import("../shared/dictionary").DictionaryPanelState
      >;
      removeDictionaryFavorite(
        word: string
      ): Promise<import("../shared/dictionary").DictionaryPanelState>;
      updateDictionaryFavoriteNote(input: {
        word: string;
        note: string;
      }): Promise<import("../shared/dictionary").DictionaryPanelState>;
      exportDictionaryFavoritesCsv(): Promise<{
        ok: boolean;
        message: string;
        path?: string;
      }>;
      setDictionaryTtsEnabled(
        enabled: boolean
      ): Promise<import("../shared/dictionary").DictionaryPanelState>;
      getDictionaryPackStatus(): Promise<import("../shared/dictionary").DictionaryPackStatus>;
      downloadDictionaryPack(): Promise<{
        ok: boolean;
        message: string;
        packPath?: string;
      }>;
      onDictionaryPackDownloadProgress(
        handler: (progress: import("../shared/dictionary").DictionaryPackDownloadProgress) => void
      ): () => void;
      getSelectionTranslateSettings(): Promise<
        import("../shared/selection-translate").SelectionTranslateSettings
      >;
      setSelectionTranslateSettings(
        patch: Partial<
          import("../shared/selection-translate").SelectionTranslateSettings
        >
      ): Promise<
        import("../shared/selection-translate").SelectionTranslateSettings
      >;
      liteSnapProbeOcr(): Promise<import("../shared/litesnap-ocr-help").LiteSnapOcrProbeResult>;
      liteSnapGetOcrCapabilities(): Promise<
        import("../shared/litesnap-ocr-help").LiteSnapOcrCapabilitiesResult
      >;
      liteSnapInstallOcrCapabilities(
        languages?: import("../shared/litesnap-ocr-help").LiteSnapOcrCapabilityLanguage[]
      ): Promise<
        import("../shared/litesnap-ocr-help").LiteSnapOcrCapabilityInstallResult
      >;
      liteSnapCancelCapture(): Promise<boolean>;
      liteSnapSetDisplayFollowLocked(locked: boolean): Promise<boolean>;
      liteSnapEnsureSourceImage(): Promise<string | null>;
      rebuildCatalog(): Promise<CatalogRebuildResult>;
      getLaunchAtLoginStatus(): Promise<LaunchAtLoginStatus>;
      setLaunchAtLoginEnabled(enabled: boolean): Promise<LaunchAtLoginStatus>;
      checkForAppUpdates(): Promise<AppUpdaterStatus>;
      installAppUpdateNow(): Promise<boolean>;
      setItemPinned(
        itemId: string,
        pinned: boolean,
        item?: LaunchItem
      ): Promise<PinToggleResult>;
      addCustomPinnedPath(rawPath: string): Promise<PinToggleResult>;
      search(query: string, options?: SearchRequestOptions): Promise<LaunchItem[]>;
      resolveCommandQuery(query: string): Promise<LaunchItem[]>;
      execute(item: LaunchItem): Promise<ExecuteResult>;
      setWindowSizePreset(preset: "compact" | "cashflow"): Promise<boolean>;
      setAutoHideSuspended(suspended: boolean): Promise<boolean>;
      pickFilePath(): Promise<string | null>;
      pickDirectoryPath(): Promise<string | null>;
  hide(): Promise<boolean>;
  relaunchApp(): Promise<boolean>;
      getClipItems(query: string): Promise<ClipItem[]>;
      copyClipItem(itemId: string): Promise<boolean>;
      deleteClipItem(itemId: string): Promise<boolean>;
      clearClipItems(): Promise<number>;
      reportErrorLog(input: AppErrorLogInput): Promise<boolean>;
      getErrorLogs(limit?: number): Promise<AppErrorLogEntry[]>;
      clearErrorLogs(): Promise<number>;
      onFocusInput(handler: () => void): () => void;
      onClearInput(handler: () => void): () => void;
      onPrepareHide?(handler: (requestId: number) => void): () => void;
      ackPrepareHide?(requestId: number): void;
      onOpenPanel(handler: (panelPayload: unknown) => void): () => void;
      onDebugKey(handler: (event: DebugKeyEvent) => void): () => void;
    };
  }
}

export {};
