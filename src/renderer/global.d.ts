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
  LiteSnapCommitCaptureInput,
  LiteSnapCommitCaptureResult,
  LiteSnapOverlayState,
  LiteSnapPinnedWindowsToggleResult,
  LiteSnapRecognizeTextInput,
  LiteSnapRecognizeTextResult,
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

interface RendererPluginConstants {
  CASHFLOW_PLUGIN_ID: string;
  HARDWARE_INSPECTOR_PLUGIN_ID: string;
  CLIPBOARD_WORKBENCH_PLUGIN_ID: string;
  LITESNAP_PLUGIN_ID: string;
  WEBTOOLS_PASSWORD_PLUGIN_ID: string;
  WEBTOOLS_JSON_PLUGIN_ID: string;
  WEBTOOLS_URL_PLUGIN_ID: string;
  WEBTOOLS_DIFF_PLUGIN_ID: string;
  WEBTOOLS_TIMESTAMP_PLUGIN_ID: string;
  WEBTOOLS_TRANSLATE_PLUGIN_ID: string;
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
  applyWebtoolsUrlPanelPayload(panel: unknown): void;
  renderWebtoolsUrlPanel(): void;
  applyWebtoolsDiffPanelPayload(panel: unknown): void;
  renderWebtoolsDiffPanel(): void;
  applyWebtoolsTimestampPanelPayload(panel: unknown): void;
  renderWebtoolsTimestampPanel(): void;
  applyWebtoolsTranslatePanelPayload(panel: unknown): void;
  renderWebtoolsTranslatePanel(): void;
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


declare global {
  interface Window {
    __LL_PLUGIN_CONSTANTS__?: RendererPluginConstants;
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
      liteSnapPinClipboard(): Promise<boolean>;
      liteSnapTogglePinnedWindows(): Promise<LiteSnapPinnedWindowsToggleResult>;
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
      getTranslateToolSettings(): Promise<TranslateSettings>;
      setTranslateToolSettings(
        patch: Partial<TranslateSettings>
      ): Promise<TranslateSettings>;
      translateToolTranslateText(
        input: TranslateTextInput
      ): Promise<TranslateResult>;
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
      onOpenPanel(handler: (panelPayload: unknown) => void): () => void;
      onDebugKey(handler: (event: DebugKeyEvent) => void): () => void;
    };
  }
}

export {};
