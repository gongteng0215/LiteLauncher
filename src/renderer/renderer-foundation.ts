type SearchInputKeyLike = {
  key?: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
};

/** Temporary: keep home open while tuning Command Center UI. Set false when done. */
const UI_TUNING_KEEP_OPEN = false;

const NON_TYPING_SEARCH_INPUT_KEYS = new Set<string>([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Left",
  "Right",
  "Up",
  "Down",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  "Escape",
  "Esc",
  "Enter",
  "Return",
  "Tab",
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "NumLock",
  "ScrollLock",
  "Insert"
]);

function isKeyboardDrivenSearchInputKey(
  event: SearchInputKeyLike | null | undefined
): boolean {
  const key = String(event?.key ?? "").trim();
  if (!key) {
    return false;
  }

  if (event?.metaKey || event?.altKey) {
    return false;
  }

  if (event?.ctrlKey) {
    return ["v", "x", "z", "y", "Backspace", "Delete", "Del"].includes(key);
  }

  if (NON_TYPING_SEARCH_INPUT_KEYS.has(key)) {
    return false;
  }

  return true;
}

function shouldDebounceSearchRefresh(
  query: string,
  isSearchMode: boolean,
  fromKeyboard: boolean
): boolean {
  if (!isSearchMode) {
    return false;
  }

  if (fromKeyboard) {
    return true;
  }

  return Boolean(query.trim());
}

const APP_UPDATER_RELEASE_NOTES_ALLOWED_TAGS = new Set<string>([
  "a",
  "blockquote",
  "br",
  "code",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "ul"
]);

const APP_UPDATER_RELEASE_NOTES_HTML_PATTERN = /<\/?[a-z][\s\S]*>/i;

const APP_UPDATER_RELEASE_NOTES_SAFE_HREF_PATTERN = /^(https?:|mailto:)/i;

function sanitizeAppUpdaterReleaseNotesNode(node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent ?? "");
  }

  if (!(node instanceof HTMLElement)) {
    return null;
  }

  const tagName = node.tagName.toLowerCase();
  const fragment = document.createDocumentFragment();
  for (const child of Array.from(node.childNodes)) {
    const sanitizedChild = sanitizeAppUpdaterReleaseNotesNode(child);
    if (sanitizedChild) {
      fragment.appendChild(sanitizedChild);
    }
  }

  if (!APP_UPDATER_RELEASE_NOTES_ALLOWED_TAGS.has(tagName)) {
    return fragment;
  }

  const element = document.createElement(tagName);
  if (tagName === "a") {
    const href = String(node.getAttribute("href") ?? "").trim();
    if (APP_UPDATER_RELEASE_NOTES_SAFE_HREF_PATTERN.test(href)) {
      element.setAttribute("href", href);
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noreferrer noopener");
    }
  }

  element.appendChild(fragment);
  return element;
}

function renderAppUpdaterReleaseNotes(
  container: HTMLElement,
  releaseNotes?: string
): void {
  const notes = String(releaseNotes ?? "").trim();
  container.replaceChildren();
  container.removeAttribute("data-empty");
  container.removeAttribute("data-format");

  if (!notes) {
    container.dataset.empty = "true";
    container.dataset.format = "plain";
    container.textContent =
      "未附带更新说明时，可前往 GitHub Releases 查看完整发布日志。";
    return;
  }

  if (!APP_UPDATER_RELEASE_NOTES_HTML_PATTERN.test(notes)) {
    container.dataset.format = "plain";
    container.textContent = notes;
    return;
  }

  const template = document.createElement("template");
  template.innerHTML = notes;

  const fragment = document.createDocumentFragment();
  for (const child of Array.from(template.content.childNodes)) {
    const sanitizedChild = sanitizeAppUpdaterReleaseNotesNode(child);
    if (sanitizedChild) {
      fragment.appendChild(sanitizedChild);
    }
  }

  if (!fragment.childNodes.length) {
    container.dataset.format = "plain";
    container.textContent = notes;
    return;
  }

  container.dataset.format = "rich";
  container.appendChild(fragment);
}

type PinToggleResult = import("../shared/types").PinToggleResult;

type PanelMode =
  | "search"
  | "clip"
  | "settings"
  | "password"
  | "cashflow"
  | "plugin";

type ItemType = "application" | "folder" | "file" | "web" | "command";

type SectionId = "recent" | "pinned" | "plugin" | "search";

interface LaunchItem {
  id: string;
  type: ItemType;
  title: string;
  subtitle: string;
  target: string;
  keywords: string[];
  iconPath?: string;
  pinned?: boolean;
}

interface ClipItem {
  id: string;
  content: string;
  hash: string;
  createdAt: number;
}

interface ExecuteResult {
  ok: boolean;
  message?: string;
  keepOpen?: boolean;
  data?: Record<string, unknown>;
}

interface PasswordGeneratorOptions {
  length: number;
  includeSymbols: boolean;
  count: number;
}

interface SearchDisplayConfig {
  recentLimit: number;
  pinnedLimit: number;
  pluginLimit: number;
  searchLimit: number;
}

type UiThemeConfig = import("../shared/ui-theme").UiThemeConfig;

type UiThemePresetId = import("../shared/ui-theme").UiThemePresetId;

type SearchScope =
  | "all"
  | "application"
  | "folder"
  | "file"
  | "web"
  | "command"
  | "plugin";

interface SearchRequestOptions {
  limit?: number;
  scope?: SearchScope;
}

interface CatalogScanConfig {
  scanProgramFiles: boolean;
  customScanDirs: string[];
  excludeScanDirs: string[];
  resultIncludeDirs: string[];
  resultExcludeDirs: string[];
}

interface CatalogRebuildResult {
  ok: boolean;
  message: string;
  totalItems: number;
  applicationItems: number;
  durationMs: number;
}

type AppErrorLogScope = "main" | "renderer" | "ipc" | "execute" | "system";

type AppErrorLogLevel = "error" | "warn";

interface AppErrorLogInput {
  scope: AppErrorLogScope;
  message: string;
  level?: AppErrorLogLevel;
  context?: string;
  detail?: string;
}

interface AppErrorLogEntry {
  id: number;
  scope: AppErrorLogScope;
  level: AppErrorLogLevel;
  message: string;
  context?: string;
  detail?: string;
  createdAt: number;
}

interface LaunchAtLoginStatus {
  enabled: boolean;
  supported: boolean;
  reason?: string;
}

interface AppUpdaterStatus {
  supported: boolean;
  phase:
    | "idle"
    | "checking"
    | "available"
    | "downloading"
    | "downloaded"
    | "not-available"
    | "unsupported"
    | "error";
  currentVersion: string;
  updateVersion?: string;
  downloaded: boolean;
  autoUpdateEnabled: boolean;
  releaseNotes?: string;
  progressPercent?: number;
  message?: string;
}

interface DebugKeyEvent {
  source: "main" | "renderer";
  phase: string;
  key: string;
  code?: string;
  alt?: boolean;
  control?: boolean;
  shift?: boolean;
  meta?: boolean;
  repeat?: boolean;
  ts: number;
  note?: string;
}

interface LauncherApi {
  isDebugKeysEnabled(): boolean;
  getInitialItems(): Promise<LaunchItem[]>;
  getPinnedItems(): Promise<LaunchItem[]>;
  getPluginItems(): Promise<LaunchItem[]>;
  getHomeSections(): Promise<{
    recent: LaunchItem[];
    pinned: LaunchItem[];
    plugin: LaunchItem[];
  }>;
  getAppVersion(): Promise<string>;
  getAppUpdaterStatus(): Promise<AppUpdaterStatus>;
  getSearchDisplayConfig(): Promise<SearchDisplayConfig>;
  setSearchDisplayConfig(
    config: Partial<SearchDisplayConfig>
  ): Promise<SearchDisplayConfig>;
  getUiThemeConfig(): Promise<UiThemeConfig>;
  setUiThemeConfig(config: Partial<UiThemeConfig>): Promise<UiThemeConfig>;
  getCatalogScanConfig(): Promise<CatalogScanConfig>;
  setCatalogScanConfig(
    config: Partial<CatalogScanConfig>
  ): Promise<CatalogScanConfig>;
  getVisiblePluginIds(): Promise<string[]>;
  setVisiblePluginIds(pluginIds: string[]): Promise<string[]>;
  getAllPluginItems(): Promise<LaunchItem[]>;
  getRequiredVisiblePluginIds(): Promise<string[]>;
  getLiteSnapSettings(): Promise<unknown>;
  setLiteSnapSettings(patch: Record<string, unknown>): Promise<unknown>;
  liteSnapStartCapture(): Promise<boolean>;
  liteSnapStartColorCapture(): Promise<boolean>;
  liteSnapPinClipboard(): Promise<boolean>;
  liteSnapTogglePinnedWindows(): Promise<{ hidden: boolean; count: number }>;
  liteSnapCloseAllPinnedWindows(): Promise<{ count: number }>;
  liteSnapToggleNearestPinClickThrough(): Promise<{
    toggled: boolean;
    enabled: boolean;
    count: number;
  }>;
  liteSnapRecordRecentColor(color: string): Promise<string[]>;
  liteSnapListHistory(): Promise<
    Array<{
      id: string;
      filePath: string;
      thumbPath: string | null;
      width: number;
      height: number;
      source: string;
      createdAt: number;
    }>
  >;
  liteSnapDeleteHistoryItem(id: string): Promise<boolean>;
  liteSnapClearHistory(): Promise<number>;
  liteSnapHistoryCopy(id: string): Promise<boolean>;
  liteSnapHistoryPin(id: string): Promise<boolean>;
  liteSnapHistoryEdit(id: string): Promise<boolean>;
  liteSnapStartLongCapture(input: import("../shared/litesnap").LiteSnapLongCaptureStartInput): Promise<boolean>;
  liteSnapScrollLongCapture(deltaY: number): Promise<boolean>;
  liteSnapControlLongCapture(
    control: import("../shared/litesnap").LiteSnapLongCaptureControl
  ): Promise<boolean>;
  liteSnapGetLongCaptureProgress(): Promise<import("../shared/litesnap").LiteSnapLongCaptureProgress | null>;
  liteSnapGetDiagnostics(): Promise<import("../shared/litesnap").LiteSnapDiagnosticEntry[]>;
  liteSnapClearDiagnostics(): Promise<number>;
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
  onPrepareHide(handler: (requestId: number) => void): () => void;
  ackPrepareHide(requestId: number): void;
  onOpenPanel(handler: (panelPayload: unknown) => void): () => void;
  onDebugKey(handler: (event: DebugKeyEvent) => void): () => void;
  getTranslateToolSettings?(): Promise<{
    baiduAppId: string;
    baiduSecret: string;
    baiduEngine: "standard" | "llm";
    baiduApiKey: string;
  }>;
  setTranslateToolSettings?(patch: {
    baiduAppId?: string;
    baiduSecret?: string;
    baiduEngine?: "standard" | "llm";
    baiduApiKey?: string;
  }): Promise<{
    baiduAppId: string;
    baiduSecret: string;
    baiduEngine: "standard" | "llm";
    baiduApiKey: string;
  }>;
  translateToolTranslateText?(input: {
    text: string;
    appId?: string;
    secret?: string;
    apiKey?: string;
    engine?: "standard" | "llm";
  }): Promise<{
    ok: boolean;
    sourceText: string;
    translatedText: string;
    message: string;
  }>;
  lookupDictionaryWord?(word: string): Promise<
    | {
        word: string;
        phonetic: string;
        translation: string;
        definition: string;
        pos: string;
        tags: string;
        collins: number;
        oxford: number;
        exchange: string;
      }
    | undefined
  >;
  lookupDictionaryCandidates?(
    word: string,
    limit?: number
  ): Promise<
    Array<{
      word: string;
      phonetic: string;
      translation: string;
      definition: string;
      pos: string;
      tags: string;
      collins: number;
      oxford: number;
      exchange: string;
    }>
  >;
  getDictionaryPanelState?(): Promise<{
    history: Array<{
      word: string;
      phonetic: string;
      translationPreview: string;
      savedAt: number;
    }>;
    favorites: Array<{
      word: string;
      phonetic: string;
      translationPreview: string;
      savedAt: number;
    }>;
    ttsEnabled?: boolean;
  }>;
  exportDictionaryFavoritesCsv?(): Promise<{
    ok: boolean;
    message: string;
    path?: string;
  }>;
  setDictionaryTtsEnabled?(
    enabled: boolean
  ): Promise<{
    history: Array<{
      word: string;
      phonetic: string;
      translationPreview: string;
      savedAt: number;
    }>;
    favorites: Array<{
      word: string;
      phonetic: string;
      translationPreview: string;
      savedAt: number;
    }>;
    ttsEnabled?: boolean;
  }>;
  getDictionaryPackStatus?(): Promise<import("../shared/dictionary").DictionaryPackStatus>;
  downloadDictionaryPack?(): Promise<{
    ok: boolean;
    message: string;
    packPath?: string;
  }>;
  onDictionaryPackDownloadProgress?(
    handler: (progress: import("../shared/dictionary").DictionaryPackDownloadProgress) => void
  ): () => void;
  recordDictionaryLookup?(input: {
    query: string;
    entry?: {
      word: string;
      phonetic: string;
      translation: string;
      definition: string;
      pos: string;
      tags: string;
      collins: number;
      oxford: number;
      exchange: string;
    } | null;
  }): Promise<{
    history: Array<{
      word: string;
      phonetic: string;
      translationPreview: string;
      savedAt: number;
    }>;
    favorites: Array<{
      word: string;
      phonetic: string;
      translationPreview: string;
      savedAt: number;
    }>;
  }>;
  toggleDictionaryFavorite?(input: {
    word: string;
    entry?: {
      word: string;
      phonetic: string;
      translation: string;
      definition: string;
      pos: string;
      tags: string;
    } | null;
  }): Promise<{
    history: Array<{
      word: string;
      phonetic: string;
      translationPreview: string;
      savedAt: number;
    }>;
    favorites: Array<{
      word: string;
      phonetic: string;
      translationPreview: string;
      savedAt: number;
    }>;
  }>;
  removeDictionaryHistoryItem?(word: string): Promise<{
    history: Array<{
      word: string;
      phonetic: string;
      translationPreview: string;
      savedAt: number;
    }>;
    favorites: Array<{
      word: string;
      phonetic: string;
      translationPreview: string;
      savedAt: number;
    }>;
  }>;
  clearDictionaryHistory?(): Promise<{
    history: Array<{
      word: string;
      phonetic: string;
      translationPreview: string;
      savedAt: number;
    }>;
    favorites: Array<{
      word: string;
      phonetic: string;
      translationPreview: string;
      savedAt: number;
    }>;
  }>;
  removeDictionaryFavorite?(word: string): Promise<{
    history: Array<{
      word: string;
      phonetic: string;
      translationPreview: string;
      note?: string;
      savedAt: number;
    }>;
    favorites: Array<{
      word: string;
      phonetic: string;
      translationPreview: string;
      note?: string;
      savedAt: number;
    }>;
  }>;
  updateDictionaryFavoriteNote?(input: {
    word: string;
    note: string;
  }): Promise<{
    history: Array<{
      word: string;
      phonetic: string;
      translationPreview: string;
      note?: string;
      savedAt: number;
    }>;
    favorites: Array<{
      word: string;
      phonetic: string;
      translationPreview: string;
      note?: string;
      savedAt: number;
    }>;
  }>;
  getSelectionTranslateSettings?(): Promise<{
    enabled: boolean;
    hotkey: string;
    restoreClipboard: boolean;
    dismissOnOutsideClick: boolean;
  }>;
  setSelectionTranslateSettings?(patch: {
    enabled?: boolean;
    hotkey?: string;
    restoreClipboard?: boolean;
    dismissOnOutsideClick?: boolean;
  }): Promise<{
    enabled: boolean;
    hotkey: string;
    restoreClipboard: boolean;
    dismissOnOutsideClick: boolean;
  }>;
  liteSnapProbeOcr?(): Promise<{
    ok: boolean;
    message: string;
    ocrIssue?: "module_missing" | "language_pack";
    moduleLoaded: boolean;
    nativeAddonExists: boolean;
    availableLanguages: string[];
    chineseReady: boolean;
    englishReady: boolean;
    capabilities?: Array<{
      languageTag: "zh-CN" | "en-US";
      capabilityName: string;
      state: string;
      installed: boolean;
    }>;
  }>;
  liteSnapGetOcrCapabilities?(): Promise<{
    ok: boolean;
    message: string;
    capabilities: Array<{
      languageTag: "zh-CN" | "en-US";
      capabilityName: string;
      state: string;
      installed: boolean;
    }>;
  }>;
  liteSnapInstallOcrCapabilities?(
    languages?: Array<"zh-CN" | "en-US">
  ): Promise<{
    ok: boolean;
    message: string;
    cancelled?: boolean;
    capabilities: Array<{
      languageTag: "zh-CN" | "en-US";
      capabilityName: string;
      state: string;
      installed: boolean;
    }>;
  }>;
  liteSnapGetOcrProbeCache?(): Promise<{
    ready: boolean;
    summary: string;
    probeState: {
      ok: boolean;
      moduleLoaded: boolean;
      chineseReady: boolean;
      englishReady: boolean;
    };
    capabilities?: Array<{
      languageTag: "zh-CN" | "en-US";
      capabilityName: string;
      state: string;
      installed: boolean;
    }>;
    checkedAt: number;
  } | null>;
  liteSnapSetOcrProbeCache?(cache: {
    ready: boolean;
    summary: string;
    probeState: {
      ok: boolean;
      moduleLoaded: boolean;
      chineseReady: boolean;
      englishReady: boolean;
    };
    capabilities?: Array<{
      languageTag: "zh-CN" | "en-US";
      capabilityName: string;
      state: string;
      installed: boolean;
    }>;
    checkedAt: number;
  }): Promise<boolean>;
}

type ResultEntry =
  | { kind: "launch"; item: LaunchItem }
  | { kind: "clip"; item: ClipItem };

interface SearchSection {
  id: SectionId;
  title: string;
  displayLimit: number;
  indexes: number[];
  emptyText: string;
  totalCount: number;
  page: number;
  pageCount: number;
}

const SECTION_GRID_TILE_WIDTH = 64;

const SECTION_GRID_GAP = 3;

const inputElement = document.getElementById(
  "search-input"
) as HTMLInputElement | null;

const resultsElement = document.querySelector(".panel-section") as HTMLElement | null;

const listElement = document.getElementById(
  "result-list"
) as HTMLUListElement | null;

const resultsLoadingElement = document.getElementById(
  "results-loading"
) as HTMLDivElement | null;

const resultsLoadingTextElement = document.getElementById(
  "results-loading-text"
) as HTMLSpanElement | null;

const statusElement = document.getElementById(
  "status-text"
) as HTMLDivElement | null;

const hintElement = document.getElementById("hint-text") as HTMLDivElement | null;

const settingsShortcutButtonElement = document.getElementById(
  "settings-shortcut-btn"
) as HTMLButtonElement | null;

if (
  !inputElement ||
  !resultsElement ||
  !listElement ||
  !resultsLoadingElement ||
  !resultsLoadingTextElement ||
  !statusElement ||
  !hintElement ||
  !settingsShortcutButtonElement
) {
  throw new Error("\u6e32\u67d3\u5c42\u521d\u59cb\u5316\u5931\u8d25\uff1a\u7f3a\u5c11\u5fc5\u8981 DOM \u8282\u70b9");
}

const commandCenterUi = window.__LL_COMMAND_CENTER_UI__ as NonNullable<
  typeof window.__LL_COMMAND_CENTER_UI__
>;

const commandCenterIcons = window.__LL_COMMAND_CENTER_ICONS__;

if (!window.__LL_COMMAND_CENTER_UI__) {
  throw new Error("command center ui not initialized");
}

const input = inputElement;

const results = resultsElement;

const list = listElement;

const resultsLoading = resultsLoadingElement;

const resultsLoadingText = resultsLoadingTextElement;

const statusText = statusElement;

const hintText = hintElement;

const settingsShortcutButton = settingsShortcutButtonElement;

let entries: ResultEntry[] = [];

let searchSections: SearchSection[] = [];

let selectedIndex = 0;

let currentQuery = "";

let pagedSearchQueryKey = "";

let searchResultPage = 0;

let pluginResultPage = 0;

let latestSearchToken = 0;

let cachedSearchLaunchItems: LaunchItem[] = [];

let homeSectionsDirty = true;

let cachedHomeEntries: ResultEntry[] | null = null;

let cachedHomeSections: SearchSection[] | null = null;

let cachedHomeStatus = "";

let mode: PanelMode = "search";

let debugMode = false;

let isResultsLoading = false;

let resultsLoadingTimer: number | null = null;

let searchInputDebounceTimer: number | null = null;

let pendingSearchInputFromKeyboard = false;

let sectionGridResizeFrame: number | null = null;

const handledEvents = new WeakSet<KeyboardEvent>();

const DEBUG_LOG_LIMIT = 22;

const SETTINGS_LIMIT_MIN = 5;

const SETTINGS_LIMIT_MAX = 100;

const CATALOG_SCAN_CUSTOM_DIRS_MAX = 50;

const CATALOG_SCAN_EXCLUDE_DIRS_MAX = 50;

const CATALOG_RESULT_INCLUDE_DIRS_MAX = 50;

const CATALOG_RESULT_EXCLUDE_DIRS_MAX = 50;

const VISIBLE_PLUGIN_IDS_MAX = 50;

const SEARCH_PAGE_FETCH_MULTIPLIER = 3;

const SEARCH_PAGE_FETCH_MAX = 180;

const SEARCH_INPUT_DEBOUNCE_MS = 320;

const PASSWORD_LENGTH_MIN = 4;

const PASSWORD_LENGTH_MAX = 64;

const PASSWORD_COUNT_MIN = 1;

const PASSWORD_COUNT_MAX = 20;

const WEBTOOLS_PASSWORD_COUNT_MAX = 50;

const pluginConstants = window.__LL_PLUGIN_CONSTANTS__;

if (!pluginConstants) {
  throw new Error("renderer plugin constants not initialized");
}

const {
  CASHFLOW_PLUGIN_ID,
  HARDWARE_INSPECTOR_PLUGIN_ID,
  CLIPBOARD_WORKBENCH_PLUGIN_ID,
  WEBTOOLS_PASSWORD_PLUGIN_ID,
  WEBTOOLS_JSON_PLUGIN_ID,
  WEBTOOLS_URL_PLUGIN_ID,
  WEBTOOLS_DIFF_PLUGIN_ID,
  WEBTOOLS_TIMESTAMP_PLUGIN_ID,
  WEBTOOLS_REGEX_PLUGIN_ID,
  WEBTOOLS_CRON_PLUGIN_ID,
  WEBTOOLS_CRYPTO_PLUGIN_ID,
  WEBTOOLS_JWT_PLUGIN_ID,
  WEBTOOLS_STRINGS_PLUGIN_ID,
  WEBTOOLS_COLORS_PLUGIN_ID,
  WEBTOOLS_IMAGE_BASE64_PLUGIN_ID,
  WEBTOOLS_IMAGE_PROMPT_PLUGIN_ID,
  WEBTOOLS_CONFIG_PLUGIN_ID,
  WEBTOOLS_SQL_PLUGIN_ID,
  WEBTOOLS_UNIT_PLUGIN_ID,
  WEBTOOLS_FILE_HASH_PLUGIN_ID,
  WEBTOOLS_PORT_HELPER_PLUGIN_ID,
  WEBTOOLS_QRCODE_PLUGIN_ID,
  WEBTOOLS_MARKDOWN_PLUGIN_ID,
  WEBTOOLS_UA_PLUGIN_ID,
  WEBTOOLS_API_PLUGIN_ID,
  WEBTOOLS_HTTP_MOCK_PLUGIN_ID,
  CODEAGENT_SWITCH_PLUGIN_ID,
  DEFAULT_VISIBLE_PLUGIN_IDS
} = pluginConstants;

const CURRENCY_FORMATTER = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0
});

const debugLogs: string[] = [];

const debugPanel = document.createElement("div");

const SEARCH_SCOPE_PREFIX_RULES: Array<{
  scope: SearchScope;
  label: string;
  prefixes: string[];
}> = [
  {
    scope: "application",
    label: "应用",
    prefixes: ["app:", "app：", "应用:", "应用：", "程序:", "程序："]
  },
  {
    scope: "command",
    label: "命令",
    prefixes: ["cmd:", "cmd：", "command:", "command：", "命令:", "命令："]
  },
  {
    scope: "web",
    label: "网页",
    prefixes: ["web:", "web：", "url:", "url：", "网页:", "网页："]
  },
  {
    scope: "plugin",
    label: "插件",
    prefixes: ["plugin:", "plugin：", "插件:", "插件："]
  },
  {
    scope: "file",
    label: "文件",
    prefixes: ["file:", "file：", "文件:", "文件："]
  },
  {
    scope: "folder",
    label: "文件夹",
    prefixes: [
      "folder:",
      "folder：",
      "dir:",
      "dir：",
      "目录:",
      "目录：",
      "文件夹:",
      "文件夹："
    ]
  }
];

type ParsedSearchQuery = {
  rawQuery: string;
  query: string;
  scope: SearchScope;
  scopeLabel: string;
  explicitScope: boolean;
};

let currentWindowSizePreset: "compact" | "cashflow" = "compact";

let pendingWindowSizePreset: "compact" | "cashflow" = "compact";

let searchDisplayConfig: SearchDisplayConfig = {
  recentLimit: 20,
  pinnedLimit: 20,
  pluginLimit: 20,
  searchLimit: 50
};

let uiThemeConfig: UiThemeConfig = {
  presetId: "violet",
  accent: "#9d63ff",
  accentStrong: "#6f3bc2",
  accentSoft: "#c4a0ff",
  bg: "#070612",
  surface: "#0d0b1d",
  text: "#f1edff"
};

let catalogScanConfig: CatalogScanConfig = {
  scanProgramFiles: false,
  customScanDirs: [],
  excludeScanDirs: [],
  resultIncludeDirs: [],
  resultExcludeDirs: []
};

let visiblePluginIds: string[] = [...DEFAULT_VISIBLE_PLUGIN_IDS];

let allPluginCatalogItems: LaunchItem[] = [];

type SettingsTabId =
  | "appearance"
  | "display"
  | "scan"
  | "pinned"
  | "plugins"
  | "updates"
  | "errors";

let settingsFocusHint: SettingsTabId | undefined;

let activeSettingsTab: SettingsTabId = "appearance";

let requiredVisiblePluginIdSet = new Set<string>();

let launchAtLoginStatus: LaunchAtLoginStatus = {
  enabled: false,
  supported: false,
  reason: "状态未知"
};

let appUpdaterStatus: AppUpdaterStatus = {
  supported: false,
  phase: "unsupported",
  currentVersion: "",
  downloaded: false,
  autoUpdateEnabled: false,
  message: "自动更新状态未知"
};

let appVersion = "未知版本";

let errorLogEntries: AppErrorLogEntry[] = [];

let activeSearchContextMenu: HTMLDivElement | null = null;

let pluginNativeInteractionLocked = false;

let pluginNativeInteractionReleaseTimer: number | null = null;

let pinnedManageMode = false;

const pinnedManageSelectedIds = new Set<string>();

function getLauncherApi(): LauncherApi | null {
  return ((window as Window & { launcher?: LauncherApi }).launcher ??
    null) as LauncherApi | null;
}

function getUiThemeApi(): NonNullable<Window["__LL_UI_THEME__"]> | null {
  return window.__LL_UI_THEME__ ?? null;
}

function applyUiThemeConfig(theme: UiThemeConfig): void {
  const api = getUiThemeApi();
  uiThemeConfig = api ? api.normalize(theme) : theme;
  api?.apply(uiThemeConfig);
}

async function persistUiThemeConfig(
  theme: Partial<UiThemeConfig>
): Promise<UiThemeConfig | null> {
  const launcher = getLauncherApi();
  const api = getUiThemeApi();
  const next = api ? api.normalize(theme) : { ...uiThemeConfig, ...theme };
  applyUiThemeConfig(next as UiThemeConfig);
  if (!launcher?.setUiThemeConfig) {
    return uiThemeConfig;
  }
  try {
    const saved = await launcher.setUiThemeConfig(next);
    applyUiThemeConfig(saved);
    return saved;
  } catch {
    return null;
  }
}

function clearPluginNativeInteractionReleaseTimer(): void {
  if (pluginNativeInteractionReleaseTimer !== null) {
    window.clearTimeout(pluginNativeInteractionReleaseTimer);
    pluginNativeInteractionReleaseTimer = null;
  }
}

function setAutoHideSuspended(suspended: boolean): void {
  const launcher = getLauncherApi();
  if (!launcher?.setAutoHideSuspended) {
    return;
  }

  void launcher.setAutoHideSuspended(suspended).catch(() => {
    // Ignore bridge failures and keep the renderer responsive.
  });
}

function shouldSuspendAutoHideForMode(nextMode: PanelMode): boolean {
  return (
    nextMode === "cashflow" ||
    nextMode === "plugin" ||
    nextMode === "settings" ||
    commandCenterUi.isSettingsOverlayOpen()
  );
}

function syncAutoHideSuspension(nextMode: PanelMode = mode): void {
  setAutoHideSuspended(
    UI_TUNING_KEEP_OPEN ||
      shouldSuspendAutoHideForMode(nextMode) ||
      pluginNativeInteractionLocked
  );
}

function releasePluginNativeInteractionLock(): void {
  clearPluginNativeInteractionReleaseTimer();
  if (!pluginNativeInteractionLocked) {
    return;
  }

  pluginNativeInteractionLocked = false;
  syncAutoHideSuspension();
}

function schedulePluginNativeInteractionRelease(delayMs = 180): void {
  clearPluginNativeInteractionReleaseTimer();
  pluginNativeInteractionReleaseTimer = window.setTimeout(() => {
    releasePluginNativeInteractionLock();
  }, delayMs);
}

function beginPluginNativeInteraction(timeoutMs = 15000): void {
  clearPluginNativeInteractionReleaseTimer();
  if (!pluginNativeInteractionLocked) {
    pluginNativeInteractionLocked = true;
    syncAutoHideSuspension();
  }

  pluginNativeInteractionReleaseTimer = window.setTimeout(() => {
    releasePluginNativeInteractionLock();
  }, timeoutMs);
}

function markRendererBootstrapped(): void {
  (
    window as Window & {
      __LL_RENDERER_BOOTSTRAPPED__?: boolean;
    }
  ).__LL_RENDERER_BOOTSTRAPPED__ = true;
}

function initDebugPanel(): void {
  debugPanel.id = "debug-key-panel";
  debugPanel.style.position = "fixed";
  debugPanel.style.right = "8px";
  debugPanel.style.bottom = "8px";
  debugPanel.style.width = "360px";
  debugPanel.style.maxHeight = "42vh";
  debugPanel.style.overflow = "auto";
  debugPanel.style.padding = "8px";
  debugPanel.style.border = "1px solid rgba(255,255,255,0.25)";
  debugPanel.style.background = "rgba(6, 10, 16, 0.9)";
  debugPanel.style.color = "#b7f8ff";
  debugPanel.style.fontSize = "11px";
  debugPanel.style.fontFamily = "Consolas, 'Courier New', monospace";
  debugPanel.style.whiteSpace = "pre-wrap";
  debugPanel.style.lineHeight = "1.4";
  debugPanel.style.zIndex = "9999";
  debugPanel.style.display = "none";
  document.body.appendChild(debugPanel);
}

function pushDebugLog(line: string): void {
  if (!debugMode) {
    return;
  }

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const text = `[${hh}:${mm}:${ss}] ${line}`;

  debugLogs.push(text);
  if (debugLogs.length > DEBUG_LOG_LIMIT) {
    debugLogs.shift();
  }

  debugPanel.textContent = debugLogs.join("\n");
  debugPanel.style.display = "block";
  debugPanel.scrollTop = debugPanel.scrollHeight;
}

function formatMods(
  control?: boolean,
  alt?: boolean,
  shift?: boolean,
  meta?: boolean
): string {
  const mods = [
    control ? "Ctrl" : "",
    alt ? "Alt" : "",
    shift ? "Shift" : "",
    meta ? "Meta" : ""
  ].filter(Boolean);
  return mods.length ? `${mods.join("+")}+` : "";
}

function formatDebugEvent(event: DebugKeyEvent): string {
  return `${event.source} ${event.phase} ${formatMods(
    event.control,
    event.alt,
    event.shift,
    event.meta
  )}${event.key}${event.code ? ` (${event.code})` : ""}${
    event.note ? ` [${event.note}]` : ""
  }`;
}
