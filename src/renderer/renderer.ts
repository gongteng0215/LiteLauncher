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
const panelImpls = window.__LL_PANEL_IMPLS__;
if (!panelImpls) {
  throw new Error("renderer plugin panel impls not initialized");
}
const panelImplsSafe = panelImpls;
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
let settingsFocusHint: "plugins" | "errors" | "updates" | "pinned" | undefined;
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

function focusInput(selectAll = false): void {
  input.focus();
  if (selectAll) {
    input.select();
  }
}

function setStatus(message: string): void {
  statusText.textContent = message;
}

function setHint(message: string): void {
  hintText.textContent = message;
}

function clearResultsLoadingTimer(): void {
  if (resultsLoadingTimer !== null) {
    window.clearTimeout(resultsLoadingTimer);
    resultsLoadingTimer = null;
  }
}

function setResultsLoading(active: boolean, message = "正在加载..."): void {
  if (!active) {
    clearResultsLoadingTimer();
  }
  isResultsLoading = active;
  results.toggleAttribute("data-loading", active);
  resultsLoading.hidden = !active;
  resultsLoadingText.textContent = message;

  if (mode === "search") {
    const hasQuery = Boolean(currentQuery.trim());
    if (active && hasQuery) {
      commandCenterUi.setCommandSearchStatus(message);
    } else if (!active && !hasQuery) {
      commandCenterUi.setCommandSearchStatus(null);
    }
  }
}

function scheduleResultsLoading(message: string, delayMs = 120): void {
  clearResultsLoadingTimer();
  resultsLoadingTimer = window.setTimeout(() => {
    setResultsLoading(true, message);
    resultsLoadingTimer = null;
  }, delayMs);
}

function clearSearchInputDebounceTimer(): void {
  if (searchInputDebounceTimer !== null) {
    window.clearTimeout(searchInputDebounceTimer);
    searchInputDebounceTimer = null;
  }
}

function markHomeSectionsDirty(): void {
  homeSectionsDirty = true;
  cachedHomeEntries = null;
  cachedHomeSections = null;
  cachedHomeStatus = "";
}

function cacheHomeSectionsSnapshot(statusText: string): void {
  cachedHomeEntries = entries.slice();
  cachedHomeSections = searchSections.map((section) => ({
    ...section,
    indexes: section.indexes.slice()
  }));
  cachedHomeStatus = statusText;
  homeSectionsDirty = false;
}

function tryRestoreCachedHomeSections(): boolean {
  if (
    homeSectionsDirty ||
    !cachedHomeEntries ||
    !cachedHomeSections ||
    mode !== "search"
  ) {
    return false;
  }

  const recentGrid = commandCenterUi.getSectionGrid("recent");
  const hasHomeDom = Boolean(recentGrid && recentGrid.children.length > 0);
  entries = cachedHomeEntries;
  searchSections = cachedHomeSections;
  selectedIndex = 0;
  pagedSearchQueryKey = "";
  searchResultPage = 0;
  cachedSearchLaunchItems = [];
  commandCenterUi.updateCommandCenterQueryState(false);
  const resultsHost = commandCenterUi.getCommandResultsHost();
  if (resultsHost) {
    resultsHost.replaceChildren();
    resultsHost.hidden = true;
  }
  commandCenterUi.setCommandSearchStatus(null);

  if (hasHomeDom) {
    renderPinnedSectionActions();
    setStatus(cachedHomeStatus || "可以开始搜索");
    return true;
  }

  renderList();
  setStatus(cachedHomeStatus || "可以开始搜索");
  return true;
}

/**
 * Synchronously restore Command Center home chrome, then optionally refresh
 * home data. Used on window hide / Esc so reopen never flashes the last search.
 */
function resetLauncherToHomeState(options?: { refreshHome?: boolean }): void {
  const hadNonHomeSurface =
    mode !== "search" ||
    Boolean(input.value.trim()) ||
    Boolean(currentQuery.trim()) ||
    commandCenterUi.isSettingsOverlayOpen() ||
    Boolean(document.querySelector(".launcher-shell.is-searching"));

  clearSearchInputDebounceTimer();
  clearResultsLoadingTimer();
  latestSearchToken += 1;
  setResultsLoading(false);
  closeSearchContextMenu();

  if (pinnedManageMode) {
    setPinnedManageMode(false);
  }
  if (commandCenterUi.isSettingsOverlayOpen()) {
    dismissSettingsOverlay();
  }

  input.value = "";
  currentQuery = "";
  pagedSearchQueryKey = "";
  searchResultPage = 0;
  pluginResultPage = 0;
  selectedIndex = 0;
  cachedSearchLaunchItems = [];

  if (mode !== "search") {
    setMode("search");
  } else {
    input.readOnly = false;
    input.placeholder = "输入命令、搜索应用或插件…";
    commandCenterUi.syncHomeChromeVisibility("search");
  }

  // Drop plugin / panel DOM so the frozen hide frame is home, not the last tool.
  if (listElement) {
    listElement.replaceChildren();
  }
  if (resultsElement) {
    resultsElement.hidden = true;
  }

  commandCenterUi.updateCommandCenterQueryState(false);
  const resultsHost = commandCenterUi.getCommandResultsHost();
  if (resultsHost) {
    resultsHost.replaceChildren();
    resultsHost.hidden = true;
  }
  commandCenterUi.setCommandSearchStatus(null);
  syncWindowSizePreset("search", true);

  // Always try a sync home restore so hide freezes on initialized home tiles.
  const restored = tryRestoreCachedHomeSections();

  if (options?.refreshHome === false) {
    return;
  }

  if (!hadNonHomeSurface || restored) {
    return;
  }

  void refreshEntries("");
}

/** Called from main via executeJavaScript / prepareHide IPC before hide/show. */
function prepareLauncherHide(): void {
  resetLauncherToHomeState({ refreshHome: false });
}

function ackPrepareHideAfterPaint(requestId: number): void {
  const launcher = getLauncherApi();
  const ack = () => {
    launcher?.ackPrepareHide?.(requestId);
  };
  requestAnimationFrame(() => {
    requestAnimationFrame(ack);
  });
}

(
  window as Window & {
    __LL_PREPARE_HIDE__?: () => void;
  }
).__LL_PREPARE_HIDE__ = prepareLauncherHide;

function hasPendingSearchInputDebounce(): boolean {
  return searchInputDebounceTimer !== null;
}

function flushSearchInputDebounce(): void {
  if (!hasPendingSearchInputDebounce()) {
    return;
  }

  clearSearchInputDebounceTimer();
  void refreshEntries(currentQuery);
}

function scheduleSearchRefreshFromInput(
  nextQuery: string,
  options?: { fromKeyboard?: boolean }
): void {
  closeSearchContextMenu();
  currentQuery = nextQuery;

  const trimmed = nextQuery.trim();
  if (mode === "search") {
    if (trimmed && pinnedManageMode) {
      setPinnedManageMode(false);
    }
    commandCenterUi.updateCommandCenterQueryState(Boolean(trimmed));
    if (trimmed) {
      commandCenterUi.setCommandSearchStatus("输入中，准备检索...");
    } else {
      commandCenterUi.setCommandSearchStatus(null);
    }
  }

  const shouldDebounce = shouldDebounceSearchRefresh(
    nextQuery,
    mode === "search",
    Boolean(options?.fromKeyboard)
  );
  if (!shouldDebounce) {
    clearSearchInputDebounceTimer();
    void refreshEntries(currentQuery);
    return;
  }

  clearSearchInputDebounceTimer();
  if (!isResultsLoading) {
    setResultsLoading(true, "输入中，准备检索...");
  } else if (mode === "search" && trimmed) {
    commandCenterUi.setCommandSearchStatus("输入中，准备检索...");
  }
  setStatus("输入中，准备检索...");
  searchInputDebounceTimer = window.setTimeout(() => {
    searchInputDebounceTimer = null;
    void refreshEntries(currentQuery);
  }, SEARCH_INPUT_DEBOUNCE_MS);
}

function parseSearchQuery(rawQuery: string): ParsedSearchQuery {
  const trimmed = rawQuery.trim();
  const lower = trimmed.toLowerCase();

  for (const rule of SEARCH_SCOPE_PREFIX_RULES) {
    for (const prefix of rule.prefixes) {
      if (!lower.startsWith(prefix.toLowerCase())) {
        continue;
      }

      return {
        rawQuery,
        query: trimmed.slice(prefix.length).trim(),
        scope: rule.scope,
        scopeLabel: rule.label,
        explicitScope: true
      };
    }
  }

  return {
    rawQuery,
    query: trimmed,
    scope: "all",
    scopeLabel: "全部",
    explicitScope: false
  };
}

function getLoadingMessage(nextMode: PanelMode, query: string): string {
  if (nextMode === "search") {
    const parsed = parseSearchQuery(query);
    if (!query.trim()) {
      return "正在加载首页...";
    }
    if (parsed.explicitScope) {
      return `正在检索${parsed.scopeLabel}...`;
    }
    return "正在检索...";
  }

  if (nextMode === "clip") {
    return "正在加载剪贴板...";
  }

  return "正在加载...";
}

function formatErrorDetail(input: unknown): string | undefined {
  if (input === null || input === undefined) {
    return undefined;
  }

  if (input instanceof Error) {
    return `${input.message}${input.stack ? `\n${input.stack}` : ""}`;
  }

  const text = String(input);
  return text.trim() ? text : undefined;
}

function formatErrorLogDate(value: number): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "无效时间";
  }
  return date.toLocaleString();
}

function parseErrorLogContext(
  context: string | undefined
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!context) {
    return result;
  }

  for (const part of context.split(/\s+/)) {
    const [key, ...rest] = part.split("=");
    const value = rest.join("=").trim();
    if (!key || !value) {
      continue;
    }
    result[key.trim()] = value;
  }

  return result;
}

function formatPinErrorReasonText(reason: string | undefined): string {
  switch ((reason ?? "").trim()) {
    case "empty-item-id":
      return "\u65e0\u6548\u9879\u76ee";
    case "missing-catalog-item":
      return "\u5f53\u524d\u7ed3\u679c\u5df2\u8fc7\u671f\uff0c\u8bf7\u91cd\u65b0\u641c\u7d22";
    case "invalid-pin-path":
      return "\u8def\u5f84\u65e0\u6548\u6216\u4e0d\u5b58\u5728";
    case "persist-failed":
      return "\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5";
    default:
      return "\u672a\u77e5\u539f\u56e0";
  }
}

function isLauncherTopmostDiagnosticEntry(entry: AppErrorLogEntry): boolean {
  return [
    "Launcher topmost recovery diagnostic",
    "Launcher lost always-on-top state",
    "Launcher blurred shortly after showing"
  ].includes(entry.message);
}

function isPinDiagnosticEntry(entry: AppErrorLogEntry): boolean {
  return ["Pin request rejected", "Pin request failed"].includes(entry.message);
}

function formatLauncherTriggerText(trigger: string | undefined): string {
  switch ((trigger ?? "").trim()) {
    case "global-shortcut":
      return "全局快捷键";
    case "tray-click":
      return "托盘单击";
    case "tray-menu":
      return "托盘菜单";
    case "tray-double-click":
      return "托盘双击";
    case "startup-e2e":
      return "E2E 启动";
    case "second-instance":
      return "重复启动拉起";
    case "second-instance-dev-reload":
      return "开发态重载后拉起";
    case "manual":
    default:
      return "手动显示";
  }
}

function formatLauncherPhaseText(phase: string | undefined): string {
  switch ((phase ?? "").trim()) {
    case "always-on-top-changed":
      return "置顶状态掉线";
    case "window-blur-after-show":
      return "显示后快速失焦";
    case "show-immediate-state":
      return "显示后立即状态异常";
    case "show-recovery-state":
      return "恢复重试后仍异常";
    case "show-recovery-skipped":
      return "恢复重试未执行";
    default:
      return "置顶诊断";
  }
}

function formatLauncherTopmostDiagnosticSummary(entry: AppErrorLogEntry): string {
  const contextMap = parseErrorLogContext(entry.context);
  const trigger = formatLauncherTriggerText(contextMap.trigger);
  const phase = formatLauncherPhaseText(contextMap.phase);
  const state = [
    contextMap.visible ? `可见 ${contextMap.visible === "1" ? "是" : "否"}` : "",
    contextMap.alwaysOnTop
      ? `置顶 ${contextMap.alwaysOnTop === "1" ? "是" : "否"}`
      : "",
    contextMap.focused ? `聚焦 ${contextMap.focused === "1" ? "是" : "否"}` : ""
  ]
    .filter(Boolean)
    .join(" / ");
  const ageText =
    contextMap.showAgeMs && contextMap.showAgeMs !== "-1"
      ? `显示后 ${contextMap.showAgeMs}ms`
      : "";
  const note = entry.detail?.trim() ? entry.detail.trim() : undefined;

  return [
    `[${formatErrorLogDate(entry.createdAt)}] ${phase}`,
    `触发来源: ${trigger}`,
    ageText,
    state ? `窗口状态: ${state}` : "",
    note ? `详情: ${note}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function formatPinDiagnosticSummary(entry: AppErrorLogEntry): string {
  const contextMap = parseErrorLogContext(entry.context);
  const itemId =
    contextMap.itemId === "(empty)"
      ? "（空）"
      : contextMap.itemId || "未知项目";
  const action = contextMap.pinned === "0" ? "取消置顶" : "置顶";

  if (entry.message === "Pin request rejected") {
    const reasonCode = entry.detail?.match(/reason=([a-z-]+)/i)?.[1];
    return [
      `[${formatErrorLogDate(entry.createdAt)}] ${action}请求已拒绝`,
      `项目: ${itemId}`,
      `原因: ${formatPinErrorReasonText(reasonCode)}`
    ].join("\n");
  }

  return [
    `[${formatErrorLogDate(entry.createdAt)}] ${action}保存失败`,
    `项目: ${itemId}`,
    "原因: 保存失败，请重试",
    entry.detail ? `详情: ${entry.detail}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function getLauncherTopmostDiagnosticEntries(
  entries: AppErrorLogEntry[]
): AppErrorLogEntry[] {
  return entries.filter((entry) => isLauncherTopmostDiagnosticEntry(entry)).slice(0, 5);
}

function getPinDiagnosticEntries(entries: AppErrorLogEntry[]): AppErrorLogEntry[] {
  return entries.filter((entry) => isPinDiagnosticEntry(entry)).slice(0, 5);
}

function formatErrorLogEntry(entry: AppErrorLogEntry): string {
  const contextMap = parseErrorLogContext(entry.context);
  const itemId =
    contextMap.itemId === "(empty)"
      ? "\uff08\u7a7a\uff09"
      : contextMap.itemId;
  const action =
    contextMap.pinned === "0"
      ? "\u53d6\u6d88\u7f6e\u9876"
      : "\u7f6e\u9876";

  if (entry.message === "Pin request rejected") {
    const reasonCode = entry.detail?.match(/reason=([a-z-]+)/i)?.[1];
    return [
      `[${formatErrorLogDate(entry.createdAt)}] [${entry.level}] [${entry.scope}] ${action}\u8bf7\u6c42\u5df2\u62d2\u7edd`,
      itemId ? `\u9879\u76ee: ${itemId}` : "",
      `\u539f\u56e0: ${formatPinErrorReasonText(reasonCode)}`
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (entry.message === "Pin request failed") {
    return [
      `[${formatErrorLogDate(entry.createdAt)}] [${entry.level}] [${entry.scope}] ${action}\u4fdd\u5b58\u5931\u8d25`,
      itemId ? `\u9879\u76ee: ${itemId}` : "",
      "\u539f\u56e0: \u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5",
      entry.detail ? `\u8be6\u60c5: ${entry.detail}` : ""
    ]
      .filter(Boolean)
      .join("\n");
  }

  const head = `[${formatErrorLogDate(entry.createdAt)}] [${
    entry.level
  }] [${entry.scope}] ${entry.message}`;
  const context = entry.context ? `上下文: ${entry.context}` : "";
  const detail = entry.detail ? `详情: ${entry.detail}` : "";
  return [head, context, detail].filter(Boolean).join("\n");
}

function formatErrorLogs(entries: AppErrorLogEntry[]): string {
  if (entries.length === 0) {
    return "暂无错误日志";
  }

  return entries.map((entry) => formatErrorLogEntry(entry)).join("\n\n");
}

function formatAppUpdaterStatusSummary(status: AppUpdaterStatus): string {
  if (!status.supported) {
    return status.message ?? "当前环境暂不支持自动更新";
  }

  switch (status.phase) {
    case "checking":
      return "正在检查更新";
    case "available":
      return status.updateVersion
        ? `发现新版本 v${status.updateVersion}，正在准备下载`
        : "发现新版本，正在准备下载";
    case "downloading":
      return typeof status.progressPercent === "number"
        ? `正在下载更新 ${Math.round(status.progressPercent)}%`
        : "正在下载更新";
    case "downloaded":
      return status.updateVersion
        ? `新版本 v${status.updateVersion} 已下载完成`
        : "新版本已下载完成";
    case "not-available":
      return "当前已是最新版本";
    case "error":
      return status.message ?? "检查更新失败";
    case "idle":
    case "unsupported":
    default:
      return status.message ?? "可手动检查更新";
  }
}

function formatAppUpdaterPhaseText(status: AppUpdaterStatus): string {
  if (!status.supported) {
    return "当前环境不支持";
  }

  switch (status.phase) {
    case "checking":
      return "正在检查";
    case "available":
      return status.updateVersion ? `发现 v${status.updateVersion}` : "发现新版本";
    case "downloading":
      return typeof status.progressPercent === "number"
        ? `下载中 ${Math.round(status.progressPercent)}%`
        : "下载中";
    case "downloaded":
      return status.updateVersion ? `已下载 v${status.updateVersion}` : "安装包已就绪";
    case "not-available":
      return "已是最新版本";
    case "error":
      return "检查失败";
    case "idle":
      return "等待检查";
    case "unsupported":
    default:
      return "手动更新";
  }
}

function formatAppUpdaterDiagnosticDetails(
  status: AppUpdaterStatus
): Array<{ label: string; value: string }> {
  const supportValue = !status.supported
    ? "自动更新未启用，当前环境暂不支持"
    : status.autoUpdateEnabled
      ? "自动更新已启用"
      : "自动更新未启用，请前往 GitHub Releases 手动安装";
  const diagnosticValue = status.message?.trim()
    ? status.message.trim()
    : status.phase === "not-available"
      ? "GitHub Releases 未发现比当前版本更新的安装包"
      : status.phase === "downloaded"
        ? "安装包已下载完成，可立即安装并重启"
        : "可在此页手动检查最新版本";

  return [
    {
      label: "当前版本",
      value: status.currentVersion ? `v${status.currentVersion}` : "未知版本"
    },
    {
      label: "目标版本",
      value: status.updateVersion ? `v${status.updateVersion}` : "尚未检测到"
    },
    {
      label: "自动更新",
      value: supportValue
    },
    {
      label: "最近阶段",
      value: formatAppUpdaterPhaseText(status)
    },
    {
      label: "诊断信息",
      value: diagnosticValue
    }
  ];
}

function formatAppUpdaterActionHint(status: AppUpdaterStatus): string {
  if (!status.supported) {
    return status.message ?? "当前环境暂不支持自动更新";
  }

  if (status.phase === "downloaded" && status.downloaded) {
    return "更新包已就绪，可立即安装并重启";
  }

  if (status.phase === "downloading") {
    return "后台下载完成后可直接安装";
  }

  if (status.phase === "not-available") {
    return "GitHub Releases 未发现更新";
  }

  if (status.phase === "error") {
    return status.message ?? "可稍后再次检查";
  }

  return "Windows NSIS 安装版与 macOS 打包版支持自动更新，不支持时请前往 GitHub Releases 手动下载";
}

async function checkForAppUpdatesFromSettings(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.checkForAppUpdates) {
    setStatus("桥接层未加载，无法检查更新");
    return;
  }

  setStatus("正在检查更新...");
  try {
    appUpdaterStatus = await launcher.checkForAppUpdates();
    setStatus(`自动更新：${formatAppUpdaterStatusSummary(appUpdaterStatus)}`);
  } catch {
    setStatus("检查更新失败");
  }

  renderList();
}

async function installAppUpdateNowFromSettings(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.installAppUpdateNow) {
    setStatus("桥接层未加载，无法安装更新");
    return;
  }

  try {
    const ok = await launcher.installAppUpdateNow();
    if (!ok) {
      setStatus("更新尚未下载完成，暂不能安装");
      return;
    }

    setStatus("正在安装更新并重启...");
  } catch {
    setStatus("安装更新失败");
  }
}

function formatPinnedToggleStatus(
  title: string,
  result: PinToggleResult
): string {
  if (result.ok) {
    return result.pinned ? `已置顶：${title}` : `已取消置顶：${title}`;
  }

  const prefix = result.pinned ? "置顶" : "取消置顶";
  switch (result.reason) {
    case "empty-item-id":
      return `${prefix}失败：无效项目`;
    case "missing-catalog-item":
      return `${prefix}失败：当前结果已过期，请重新搜索`;
    case "invalid-pin-path":
      return `${prefix}失败：路径无效或不存在`;
    case "persist-failed":
      return `${prefix}失败：保存失败，请重试`;
    default:
      return `${prefix}失败`;
  }
}

async function reportErrorLog(input: AppErrorLogInput): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher || !launcher.reportErrorLog) {
    return;
  }

  const message = String(input.message ?? "").trim();
  if (!message) {
    return;
  }

  const payload: AppErrorLogInput = {
    scope: input.scope,
    level: input.level === "warn" ? "warn" : "error",
    message,
    context: input.context ? String(input.context) : undefined,
    detail: input.detail ? String(input.detail) : undefined
  };

  try {
    await launcher.reportErrorLog(payload);
  } catch {
    // Ignore logging failures to avoid recursive errors.
  }
}

async function refreshErrorLogs(limit = 40): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher || !launcher.getErrorLogs) {
    errorLogEntries = [];
    return;
  }

  try {
    errorLogEntries = await launcher.getErrorLogs(limit);
  } catch {
    errorLogEntries = [];
  }
}

async function clearErrorLogsFromSettings(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher || !launcher.clearErrorLogs) {
    setStatus("桥接层未加载，无法清空错误日志");
    return;
  }

  try {
    const cleared = await launcher.clearErrorLogs();
    errorLogEntries = [];
    setStatus(`已清空错误日志（${cleared} 条）`);
    renderList();
  } catch {
    setStatus("清空错误日志失败");
  }
}

function applyModeClass(nextMode: PanelMode): void {
  document.body.classList.toggle("mode-cashflow", nextMode === "cashflow");
  document.body.classList.toggle("mode-plugin", nextMode === "plugin");
  document.body.dataset.mode = nextMode;
  if (nextMode !== "plugin") {
    delete document.body.dataset.activePluginId;
  }
}

function requestWindowSizePreset(
  preset: "compact" | "cashflow",
  retriesLeft = 1
): void {
  const launcher = getLauncherApi();
  if (!launcher?.setWindowSizePreset) {
    return;
  }

  pendingWindowSizePreset = preset;
  void launcher
    .setWindowSizePreset(preset)
    .then((applied) => {
      if (applied) {
        if (pendingWindowSizePreset === preset) {
          currentWindowSizePreset = preset;
        } else {
          requestWindowSizePreset(pendingWindowSizePreset, 1);
        }
        return;
      }

      if (retriesLeft > 0 && pendingWindowSizePreset === preset) {
        setTimeout(() => requestWindowSizePreset(preset, retriesLeft - 1), 70);
      }
    })
    .catch(() => {
      if (retriesLeft > 0 && pendingWindowSizePreset === preset) {
        setTimeout(() => requestWindowSizePreset(preset, retriesLeft - 1), 70);
      }
    });
}

function syncWindowSizePreset(nextMode: PanelMode, force = false): void {
  const useExpandedPreset =
    nextMode === "cashflow" || nextMode === "plugin" || nextMode === "settings";
  const preset: "compact" | "cashflow" = useExpandedPreset ? "cashflow" : "compact";
  if (
    !force &&
    preset === currentWindowSizePreset &&
    preset === pendingWindowSizePreset
  ) {
    return;
  }

  requestWindowSizePreset(preset, force ? 2 : 1);
}

function setMode(nextMode: PanelMode): void {
  clearSearchInputDebounceTimer();
  if (nextMode !== "plugin") {
    panelImplsSafe.cleanupPluginPanelTransientState(null);
    releasePluginNativeInteractionLock();
  }
  mode = nextMode;
  syncAutoHideSuspension(nextMode);
  syncWindowSizePreset(nextMode);
  applyModeClass(nextMode);
  commandCenterUi.syncHomeChromeVisibility(nextMode);
  if (nextMode !== "search" && nextMode !== "clip") {
    setResultsLoading(false);
  }
  input.value = "";
  currentQuery = "";
  input.readOnly =
    mode === "settings" ||
    mode === "password" ||
    mode === "cashflow" ||
    mode === "plugin";

  if (mode === "search") {
    input.placeholder = "输入命令、搜索应用或插件…";
    setHint(
      "输入停顿约 0.3 秒后检索 - Enter 执行 - Esc 清空/隐藏 - 方向键移动 - 支持 app:/cmd:/web:/plugin:"
    );
  } else if (mode === "clip") {
    input.placeholder = "\u641c\u7d22\u526a\u8d34\u677f\u5386\u53f2";
    setHint("Enter \u590d\u5236 - Delete \u5220\u9664 - Ctrl+Shift+Delete \u6e05\u7a7a - Esc \u8fd4\u56de");
  } else if (mode === "password") {
    input.placeholder = "\u5bc6\u7801\u751f\u6210\u5668\u9762\u677f";
    setHint("Enter \u751f\u6210\u5e76\u590d\u5236 - Esc \u8fd4\u56de");
  } else if (mode === "cashflow") {
    input.placeholder = "\u73b0\u91d1\u6d41\u6e38\u620f\u9762\u677f";
    setHint("Enter \u4e0b\u4e00\u56de\u5408 - Esc \u8fd4\u56de - \u70b9\u51fb\u6309\u94ae\u64cd\u4f5c");
  } else if (mode === "plugin") {
    input.placeholder = "\u63d2\u4ef6\u9762\u677f";
    setHint(
      "Esc \u8fd4\u56de - Enter \u6267\u884c\u9ed8\u8ba4\u64cd\u4f5c - \u591a\u884c\u6587\u672c\u6846\u5185 Ctrl+Enter \u6267\u884c"
    );
  } else {
    input.placeholder = "\u8bbe\u7f6e\u9762\u677f";
    setHint("Esc \u8fd4\u56de");
  }
}

function clampSettingsValue(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  const rounded = Math.round(value);
  if (rounded < SETTINGS_LIMIT_MIN) {
    return SETTINGS_LIMIT_MIN;
  }

  if (rounded > SETTINGS_LIMIT_MAX) {
    return SETTINGS_LIMIT_MAX;
  }

  return rounded;
}

function normalizeSettingsInput(
  inputConfig: Partial<SearchDisplayConfig>,
  base: SearchDisplayConfig = searchDisplayConfig
): SearchDisplayConfig {
  return {
    recentLimit: clampSettingsValue(inputConfig.recentLimit ?? base.recentLimit, base.recentLimit),
    pinnedLimit: clampSettingsValue(
      inputConfig.pinnedLimit ?? base.pinnedLimit,
      base.pinnedLimit
    ),
    pluginLimit: clampSettingsValue(inputConfig.pluginLimit ?? base.pluginLimit, base.pluginLimit),
    searchLimit: clampSettingsValue(inputConfig.searchLimit ?? base.searchLimit, base.searchLimit)
  };
}

function parseCustomScanDirsText(value: string): string[] {
  const tokens = value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
  const result: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const key = token.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(token);
    if (result.length >= CATALOG_SCAN_CUSTOM_DIRS_MAX) {
      break;
    }
  }
  return result;
}

function parseExcludeScanDirsText(value: string): string[] {
  const tokens = value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
  const result: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const key = token.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(token);
    if (result.length >= CATALOG_SCAN_EXCLUDE_DIRS_MAX) {
      break;
    }
  }
  return result;
}

function parseResultIncludeDirsText(value: string): string[] {
  const tokens = value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
  const result: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const key = token.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(token);
    if (result.length >= CATALOG_RESULT_INCLUDE_DIRS_MAX) {
      break;
    }
  }
  return result;
}

function parseResultExcludeDirsText(value: string): string[] {
  const tokens = value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
  const result: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const key = token.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(token);
    if (result.length >= CATALOG_RESULT_EXCLUDE_DIRS_MAX) {
      break;
    }
  }
  return result;
}

function parseVisiblePluginIdsText(value: string): string[] {
  const tokens = value
    .split(/\r?\n|;/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const result: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    if (seen.has(token)) {
      continue;
    }

    seen.add(token);
    result.push(token);
    if (result.length >= VISIBLE_PLUGIN_IDS_MAX) {
      break;
    }
  }
  return result;
}

function pluginIdFromCatalogItem(item: LaunchItem): string {
  const id = item.id.trim().toLowerCase();
  return id.startsWith("plugin:") ? id.slice("plugin:".length) : id;
}

function createSettingsPluginPickerIcon(item: LaunchItem): HTMLDivElement {
  const icon = document.createElement("div");
  icon.className = "result-icon";

  const fallback = () => {
    icon.replaceChildren();
    icon.classList.add("fallback");
    icon.textContent = item.title.trim().slice(0, 1) || "?";
  };

  const iconPath = item.iconPath?.trim() ?? "";
  if (!iconPath.startsWith("data:image/")) {
    fallback();
    return icon;
  }

  const image = document.createElement("img");
  image.className = "result-icon-image";
  image.addEventListener("error", fallback, { once: true });
  image.src = iconPath;
  image.alt = "";
  icon.appendChild(image);
  return icon;
}

function readVisiblePluginIdsFromSettingsForm(form: HTMLFormElement): string[] {
  const picker = form.querySelector<HTMLElement>("[data-settings-plugin-picker]");
  if (!picker) {
    const legacyNode = form.elements.namedItem("visiblePluginIds");
    if (legacyNode instanceof HTMLTextAreaElement) {
      return parseVisiblePluginIdsText(legacyNode.value);
    }
    return visiblePluginIds;
  }

  const selected = new Set<string>(requiredVisiblePluginIdSet);
  const pinned: string[] = [];
  picker
    .querySelectorAll<HTMLElement>(".settings-plugin-tile.is-selected")
    .forEach((tile) => {
      const pluginId = tile.dataset.pluginId?.trim().toLowerCase();
      if (!pluginId) {
        return;
      }
      selected.add(pluginId);
      if (tile.classList.contains("is-pinned") && !pinned.includes(pluginId)) {
        pinned.push(pluginId);
      }
    });

  const ordered: string[] = [];
  const seen = new Set<string>();
  for (const pluginId of pinned) {
    if (!selected.has(pluginId) || seen.has(pluginId)) {
      continue;
    }
    seen.add(pluginId);
    ordered.push(pluginId);
    if (ordered.length >= VISIBLE_PLUGIN_IDS_MAX) {
      return ordered;
    }
  }

  for (const item of allPluginCatalogItems) {
    const pluginId = pluginIdFromCatalogItem(item);
    if (!selected.has(pluginId) || seen.has(pluginId)) {
      continue;
    }
    seen.add(pluginId);
    ordered.push(pluginId);
    if (ordered.length >= VISIBLE_PLUGIN_IDS_MAX) {
      break;
    }
  }

  for (const pluginId of selected) {
    if (seen.has(pluginId)) {
      continue;
    }
    seen.add(pluginId);
    ordered.push(pluginId);
    if (ordered.length >= VISIBLE_PLUGIN_IDS_MAX) {
      break;
    }
  }

  return ordered;
}

function getPluginSettingsCategory(pluginId: string): string {
  if (
    pluginId === "dictionary" ||
    pluginId === "webtools-translate" ||
    pluginId === "litesnap"
  ) {
    return "词典与翻译";
  }
  if (
    pluginId === "clipboard-workbench" ||
    pluginId === "hardware-inspector" ||
    pluginId === "cashflow-game" ||
    pluginId === "codeagent-switch"
  ) {
    return "工作台";
  }
  if (pluginId.startsWith("webtools-")) {
    return "开发工具";
  }
  return "其他";
}

function createVisiblePluginPicker(
  selectedPluginIds: string[]
): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.className = "settings-plugin-picker";
  wrap.dataset.settingsPluginPicker = "true";

  const summary = document.createElement("div");
  summary.className = "settings-plugin-picker-summary";
  const selectedSet = new Set(
    selectedPluginIds.map((id) => id.trim().toLowerCase())
  );
  for (const pluginId of requiredVisiblePluginIdSet) {
    selectedSet.add(pluginId);
  }
  const pinnedSet = new Set(
    selectedPluginIds
      .slice(0, 8)
      .map((id) => id.trim().toLowerCase())
      .filter((id) => selectedSet.has(id))
  );

  const toolbar = document.createElement("div");
  toolbar.className = "settings-plugin-picker-toolbar";
  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.className = "settings-value settings-plugin-picker-search";
  searchInput.placeholder = "搜索插件名称…";
  searchInput.autocomplete = "off";

  const restoreDefaultsButton = document.createElement("button");
  restoreDefaultsButton.type = "button";
  restoreDefaultsButton.className = "settings-btn settings-btn-secondary";
  restoreDefaultsButton.textContent = "恢复默认可见";
  restoreDefaultsButton.title = "恢复为当前版本默认可见插件集";
  toolbar.append(searchInput, restoreDefaultsButton);

  const defaultVisibleSet = new Set(
    DEFAULT_VISIBLE_PLUGIN_IDS.map((id) => id.trim().toLowerCase())
  );
  const initialVisibleSet = new Set(selectedSet);
  const newlySuggestedIds = [...defaultVisibleSet].filter(
    (id) => !initialVisibleSet.has(id)
  );

  const updateSummary = (): void => {
    const count = wrap.querySelectorAll(".settings-plugin-tile.is-selected").length;
    const pinnedCount = wrap.querySelectorAll(
      ".settings-plugin-tile.is-selected.is-pinned"
    ).length;
    const unselectedDefaults = wrap.querySelectorAll(
      ".settings-plugin-tile.is-default:not(.is-selected)"
    ).length;
    const parts = [
      `已选择 ${count} 个插件（置顶 ${pinnedCount}）`,
      "可搜索、按分类浏览，点击右上角★置顶常用插件"
    ];
    if (newlySuggestedIds.length > 0 || unselectedDefaults > 0) {
      parts.push(
        `有 ${Math.max(newlySuggestedIds.length, unselectedDefaults)} 个默认推荐插件未启用，可点「恢复默认可见」`
      );
    }
    summary.textContent = `${parts.join("；")}。`;
  };

  const groupsHost = document.createElement("div");
  groupsHost.className = "settings-plugin-groups";

  const sortedItems = [...allPluginCatalogItems].sort((left, right) =>
    left.title.localeCompare(right.title, "zh-CN")
  );
  const categoryOrder = ["词典与翻译", "工作台", "开发工具", "其他"];
  const itemsByCategory = new Map<string, LaunchItem[]>();
  for (const item of sortedItems) {
    const category = getPluginSettingsCategory(pluginIdFromCatalogItem(item));
    const list = itemsByCategory.get(category) ?? [];
    list.push(item);
    itemsByCategory.set(category, list);
  }

  const allTiles: HTMLLIElement[] = [];

  for (const category of categoryOrder) {
    const items = itemsByCategory.get(category) ?? [];
    if (items.length === 0) {
      continue;
    }

    const section = document.createElement("section");
    section.className = "settings-plugin-group";
    section.dataset.pluginCategory = category;

    const heading = document.createElement("h4");
    heading.className = "settings-plugin-group-title";
    heading.textContent = category;
    section.appendChild(heading);

    const grid = document.createElement("ul");
    grid.className = "settings-plugin-grid section-grid";

    for (const item of items) {
      const pluginId = pluginIdFromCatalogItem(item);
      const required = requiredVisiblePluginIdSet.has(pluginId);
      const selected = required || selectedSet.has(pluginId);
      const pinned = selected && pinnedSet.has(pluginId);
      const isDefault = defaultVisibleSet.has(pluginId);
      const isNewSuggestion =
        isDefault && newlySuggestedIds.includes(pluginId);

      const tile = document.createElement("li");
      tile.className = "settings-plugin-tile result-item result-tile";
      tile.dataset.pluginId = pluginId;
      tile.dataset.pluginTitle = item.title;
      if (selected) {
        tile.classList.add("is-selected");
      }
      if (isDefault) {
        tile.classList.add("is-default");
      }
      if (required) {
        tile.classList.add("is-required");
        tile.title = `${item.title}（必选插件，无法隐藏）`;
      } else {
        tile.title = selected
          ? `点击隐藏：${item.title}`
          : `点击显示：${item.title}`;
      }
      if (pinned) {
        tile.classList.add("is-pinned");
      }

      const icon = createSettingsPluginPickerIcon(item);
      const title = document.createElement("div");
      title.className = "tile-title";
      title.textContent = item.title;

      const pinButton = document.createElement("button");
      pinButton.type = "button";
      pinButton.className = "settings-plugin-pin-btn";
      pinButton.textContent = pinned ? "★" : "☆";
      pinButton.title = pinned ? "取消置顶" : "置顶到搜索结果靠前";
      pinButton.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!tile.classList.contains("is-selected")) {
          setStatus("请先选择该插件再置顶。");
          return;
        }
        tile.classList.toggle("is-pinned");
        pinButton.textContent = tile.classList.contains("is-pinned") ? "★" : "☆";
        pinButton.title = tile.classList.contains("is-pinned")
          ? "取消置顶"
          : "置顶到搜索结果靠前";
        updateSummary();
      });

      tile.append(icon, title, pinButton);
      if (required) {
        const badge = document.createElement("span");
        badge.className = "settings-plugin-required-badge";
        badge.textContent = "必选";
        tile.appendChild(badge);
      } else if (isNewSuggestion) {
        const badge = document.createElement("span");
        badge.className = "settings-plugin-new-badge";
        badge.textContent = "新增";
        tile.appendChild(badge);
      }

      tile.addEventListener("click", () => {
        if (required) {
          setStatus(`${item.title} 为必选插件，无法隐藏。`);
          return;
        }
        tile.classList.toggle("is-selected");
        const nowSelected = tile.classList.contains("is-selected");
        tile.title = nowSelected
          ? `点击隐藏：${item.title}`
          : `点击显示：${item.title}`;
        if (!nowSelected) {
          tile.classList.remove("is-pinned");
          pinButton.textContent = "☆";
          pinButton.title = "置顶到搜索结果靠前";
        }
        updateSummary();
      });

      grid.appendChild(tile);
      allTiles.push(tile);
    }

    section.appendChild(grid);
    groupsHost.appendChild(section);
    window.requestAnimationFrame(() => {
      applyAdaptiveSectionGridColumns(grid);
    });
  }

  const applySearchFilter = (): void => {
    const query = searchInput.value.trim().toLowerCase();
    for (const tile of allTiles) {
      const pluginId = tile.dataset.pluginId ?? "";
      const title = (tile.dataset.pluginTitle ?? "").toLowerCase();
      const match =
        !query || title.includes(query) || pluginId.includes(query);
      tile.hidden = !match;
    }
    groupsHost.querySelectorAll<HTMLElement>(".settings-plugin-group").forEach((section) => {
      const visibleTiles = section.querySelectorAll(
        ".settings-plugin-tile:not([hidden])"
      ).length;
      section.hidden = visibleTiles === 0;
    });
  };
  searchInput.addEventListener("input", applySearchFilter);

  restoreDefaultsButton.addEventListener("click", () => {
    for (const tile of allTiles) {
      const pluginId = tile.dataset.pluginId ?? "";
      const shouldSelect =
        requiredVisiblePluginIdSet.has(pluginId) || defaultVisibleSet.has(pluginId);
      tile.classList.toggle("is-selected", shouldSelect);
      tile.classList.remove("is-pinned");
      const pinButton = tile.querySelector<HTMLButtonElement>(
        ".settings-plugin-pin-btn"
      );
      if (pinButton) {
        pinButton.textContent = "☆";
        pinButton.title = "置顶到搜索结果靠前";
      }
      if (!requiredVisiblePluginIdSet.has(pluginId)) {
        tile.title = shouldSelect
          ? `点击隐藏：${tile.dataset.pluginTitle ?? pluginId}`
          : `点击显示：${tile.dataset.pluginTitle ?? pluginId}`;
      }
    }
    const preferredPins = ["dictionary", "webtools-translate", "clipboard-workbench"];
    for (const pluginId of preferredPins) {
      const tile = allTiles.find((item) => item.dataset.pluginId === pluginId);
      if (!tile || !tile.classList.contains("is-selected")) {
        continue;
      }
      tile.classList.add("is-pinned");
      const pinButton = tile.querySelector<HTMLButtonElement>(
        ".settings-plugin-pin-btn"
      );
      if (pinButton) {
        pinButton.textContent = "★";
        pinButton.title = "取消置顶";
      }
    }
    updateSummary();
    setStatus("已恢复默认可见插件，保存设置后生效。");
  });

  wrap.append(summary, toolbar, groupsHost);
  updateSummary();
  return wrap;
}

function normalizeCatalogScanConfigInput(
  inputConfig: Partial<CatalogScanConfig>,
  base: CatalogScanConfig = catalogScanConfig
): CatalogScanConfig {
  return {
    scanProgramFiles:
      typeof inputConfig.scanProgramFiles === "boolean"
        ? inputConfig.scanProgramFiles
        : base.scanProgramFiles,
    customScanDirs: Array.isArray(inputConfig.customScanDirs)
      ? parseCustomScanDirsText(inputConfig.customScanDirs.join("\n"))
      : base.customScanDirs.slice(0, CATALOG_SCAN_CUSTOM_DIRS_MAX),
    excludeScanDirs: Array.isArray(inputConfig.excludeScanDirs)
      ? parseExcludeScanDirsText(inputConfig.excludeScanDirs.join("\n"))
      : base.excludeScanDirs.slice(0, CATALOG_SCAN_EXCLUDE_DIRS_MAX),
    resultIncludeDirs: Array.isArray(inputConfig.resultIncludeDirs)
      ? parseResultIncludeDirsText(inputConfig.resultIncludeDirs.join("\n"))
      : base.resultIncludeDirs.slice(0, CATALOG_RESULT_INCLUDE_DIRS_MAX),
    resultExcludeDirs: Array.isArray(inputConfig.resultExcludeDirs)
      ? parseResultExcludeDirsText(inputConfig.resultExcludeDirs.join("\n"))
      : base.resultExcludeDirs.slice(0, CATALOG_RESULT_EXCLUDE_DIRS_MAX)
  };
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}


function normalizeLaunchType(type: LaunchItem["type"]): string {
  if (type === "application") {
    return "App";
  }
  if (type === "folder") {
    return "Folder";
  }
  if (type === "file") {
    return "File";
  }
  if (type === "web") {
    return "Web";
  }
  return "Command";
}

function fallbackIconLabel(entry: ResultEntry): string {
  if (entry.kind === "clip") {
    return "CL";
  }

  if (entry.item.type === "application") {
    return "AP";
  }
  if (entry.item.type === "folder") {
    return "FD";
  }
  if (entry.item.type === "file") {
    return "FL";
  }
  if (entry.item.type === "web") {
    return "WB";
  }
  return "CM";
}

function createResultIcon(entry: ResultEntry): HTMLDivElement {
  const icon = document.createElement("div");
  icon.className = "result-icon";

  const fallback = () => {
    icon.replaceChildren();
    icon.classList.add("fallback");
    icon.textContent = fallbackIconLabel(entry);
  };

  if (entry.kind !== "launch" || !entry.item.iconPath) {
    fallback();
    return icon;
  }

  const iconPath = entry.item.iconPath.trim();
  if (!iconPath.startsWith("data:image/")) {
    fallback();
    return icon;
  }

  const image = document.createElement("img");
  image.className = "result-icon-image";
  image.addEventListener("error", fallback, { once: true });
  image.src = iconPath;
  image.alt = "";
  icon.appendChild(image);
  return icon;
}

async function ensurePluginCatalogLoaded(): Promise<void> {
  if (allPluginCatalogItems.length > 0) {
    return;
  }

  const launcher = getLauncherApi();
  if (!launcher) {
    return;
  }

  try {
    const items = await launcher.getAllPluginItems();
    allPluginCatalogItems = Array.isArray(items) ? items : [];
  } catch {
    allPluginCatalogItems = [];
  }
}

function resolvePluginLaunchItem(pluginId: string, actionName?: string): LaunchItem | null {
  const normalized = pluginId.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const catalogMatches = allPluginCatalogItems.filter(
    (item) => pluginIdFromCatalogItem(item) === normalized
  );
  const defaultItem =
    catalogMatches.find((item) => {
      const target = item.target.trim().toLowerCase();
      return (
        target === `command:plugin:${normalized}` ||
        target.startsWith(`command:plugin:${normalized}?`)
      );
    }) ??
    catalogMatches[0] ??
    null;

  if (actionName) {
    const encodedAction = encodeURIComponent(actionName);
    const actionItem =
      catalogMatches.find((item) =>
        item.target.toLowerCase().includes(`action=${encodedAction.toLowerCase()}`)
      ) ??
      catalogMatches.find((item) =>
        item.target.toLowerCase().includes(`action=${actionName.toLowerCase()}`)
      );
    if (actionItem) {
      return actionItem;
    }

    return {
      id: `plugin:${normalized}:${actionName}`,
      type: "command",
      title: defaultItem?.title ?? normalized,
      subtitle: actionName,
      target: `command:plugin:${normalized}?action=${encodeURIComponent(actionName)}`,
      keywords: ["plugin", normalized, actionName]
    };
  }

  if (defaultItem) {
    return defaultItem;
  }

  return {
    id: `plugin:${normalized}`,
    type: "command",
    title: normalized,
    subtitle: "打开插件",
    target: `command:plugin:${normalized}`,
    keywords: ["plugin", normalized]
  };
}

async function handleSidebarAction(action: {
  type: "plugin" | "settings" | "target";
  pluginId?: string;
  action?: string;
  focus?: "plugins" | "errors" | "updates" | "pinned";
  target?: string;
  title?: string;
}): Promise<void> {
  if (action.type === "settings") {
    settingsFocusHint = action.focus;
    openSettingsPanel();
    return;
  }

  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行");
    return;
  }

  if (action.type === "target") {
    const target = action.target?.trim() ?? "";
    if (!target) {
      return;
    }
    const commandItem: LaunchItem = {
      id: `sidebar:${target}`,
      type: "command",
      title: action.title ?? target,
      subtitle: target,
      target,
      keywords: ["sidebar"]
    };
    const result = await launcher.execute(commandItem);
    if (result.ok) {
      commandCenterUi.showToast(`已打开：${commandItem.title}`);
    } else {
      setStatus(result.message ?? "执行失败");
    }
    return;
  }

  const pluginId = action.pluginId?.trim() ?? "";
  if (!pluginId) {
    return;
  }

  await ensurePluginCatalogLoaded();
  const item = resolvePluginLaunchItem(pluginId, action.action);
  if (!item) {
    commandCenterUi.showToast(`未找到插件：${pluginId}`);
    return;
  }

  const result = await launcher.execute(item);
  if (!result.ok) {
    setStatus(result.message ?? "执行失败");
    return;
  }
  commandCenterUi.showToast(`已打开：${item.title}`);
}

function wrapResultIcon(entry: ResultEntry, _pluginId?: string): HTMLElement {
  const badge = document.createElement("span");
  badge.className = "icon-badge";
  const icon = createResultIcon(entry);
  icon.classList.remove("result-icon");
  badge.appendChild(icon);
  return badge;
}

function clearList(): void {
  if (mode === "search") {
    if (!currentQuery.trim()) {
      commandCenterUi.clearHomeSections();
    } else {
      commandCenterUi.getCommandResultsHost()?.replaceChildren();
    }
    return;
  }

  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }
  list.classList.remove("search-sections");
}

function clipTitle(content: string): string {
  const firstLine = content.split(/\r?\n/, 1)[0] ?? "";
  if (firstLine.length <= 72) {
    return firstLine;
  }
  return `${firstLine.slice(0, 72)}...`;
}

function clipSubtitle(createdAt: number): string {
  const date = new Date(createdAt);
  return `\u590d\u5236\u65f6\u95f4\uff1a${date.toLocaleString()}`;
}

function resetSearchSections(): void {
  entries = [];
  searchSections = [];
}

function getSearchResultSection(): SearchSection | null {
  for (const section of searchSections) {
    if (section.id === "search") {
      return section;
    }
  }
  return null;
}

function isStandaloneToolbarCommand(item: LaunchItem): boolean {
  return item.target.trim().toLowerCase() === "command:settings";
}

function isPanelOpeningLaunchItem(item: LaunchItem): boolean {
  const target = item.target.trim().toLowerCase();
  return item.id.startsWith("plugin:") || target.startsWith("command:plugin:");
}

function getAdaptiveSectionDisplayLimit(items: LaunchItem[]): number {
  return items.length;
}

/** Home "最近访问" stays at most 2 rows so the panels below are not crushed. */
const RECENT_HOME_MAX_ROWS = 2;
const RECENT_GRID_MIN_TILE_WIDTH = 58;
const RECENT_GRID_COLUMN_GAP = 7;

function getRecentHomeDisplayLimit(itemCount: number): number {
  if (itemCount <= 0) {
    return 0;
  }

  const grid = commandCenterUi.getSectionGrid("recent");
  const width =
    grid?.clientWidth ||
    grid?.getBoundingClientRect().width ||
    Math.max(320, Math.floor(window.innerWidth * 0.72));
  const columns = Math.max(
    1,
    Math.floor(
      (width + RECENT_GRID_COLUMN_GAP) /
        (RECENT_GRID_MIN_TILE_WIDTH + RECENT_GRID_COLUMN_GAP)
    )
  );
  return Math.min(itemCount, columns * RECENT_HOME_MAX_ROWS);
}

function addSearchSection(
  id: SectionId,
  title: string,
  items: LaunchItem[],
  displayLimit: number,
  emptyText: string,
  options?: {
    totalCount?: number;
    page?: number;
    pageCount?: number;
  }
): void {
  const indexes: number[] = [];
  const filteredItems =
    id === "search" ? items : items.filter((item) => !isStandaloneToolbarCommand(item));
  const limited = filteredItems.slice(0, displayLimit);

  for (const item of limited) {
    indexes.push(entries.length);
    entries.push({ kind: "launch", item });
  }

  const totalCount = Math.max(
    0,
    Math.round(options?.totalCount ?? filteredItems.length)
  );
  const pageCountRaw =
    options?.pageCount ?? Math.ceil(Math.max(1, totalCount) / Math.max(1, displayLimit));
  const pageCount = Math.max(1, Math.round(pageCountRaw));
  const page = Math.min(
    Math.max(0, Math.round(options?.page ?? 0)),
    pageCount - 1
  );

  searchSections.push({
    id,
    title,
    displayLimit,
    indexes,
    emptyText,
    totalCount,
    page,
    pageCount
  });
}

function mergeUniqueLaunchItems(primary: LaunchItem[], fallback: LaunchItem[]): LaunchItem[] {
  if (fallback.length === 0) {
    return primary;
  }

  const result = [...primary];
  const indexesByKey = new Map<string, number>();
  const getMergeKey = (item: LaunchItem): string => {
    const normalizedTarget = item.target.trim().toLowerCase();
    if (normalizedTarget) {
      return `target:${normalizedTarget}`;
    }
    return `id:${item.id.toLowerCase()}`;
  };
  const getScore = (item: LaunchItem): number => {
    let score = 0;
    if (item.type === "application") {
      score += 20;
    }
    if (item.iconPath?.startsWith("data:image/")) {
      score += 50;
    } else if (item.iconPath?.trim()) {
      score += 25;
    }
    if (item.subtitle?.trim()) {
      score += 10;
    }
    if (
      item.id.startsWith("command:apps-folder:") ||
      item.id.startsWith("app:startapp:")
    ) {
      score += 10;
    }
    return score;
  };

  for (let index = 0; index < result.length; index += 1) {
    indexesByKey.set(getMergeKey(result[index]), index);
  }

  for (const item of fallback) {
    const key = getMergeKey(item);
    const existingIndex = indexesByKey.get(key);
    if (existingIndex !== undefined) {
      const existing = result[existingIndex];
      if (getScore(item) > getScore(existing)) {
        result[existingIndex] = item;
      }
      continue;
    }
    indexesByKey.set(key, result.length);
    result.push(item);
  }
  return result;
}

function updatePinnedState(itemId: string, pinned: boolean): void {
  for (const entry of entries) {
    if (entry.kind !== "launch") {
      continue;
    }

    if (entry.item.id === itemId) {
      entry.item.pinned = pinned;
    }
  }
}

function findLaunchEntryIndexInCurrentEntries(itemId: string): number {
  const normalizedId = String(itemId ?? "").trim();
  if (!normalizedId) {
    return -1;
  }

  return entries.findIndex(
    (entry) => entry.kind === "launch" && entry.item.id === normalizedId
  );
}

function isLaunchEntryPinned(index: number, item: LaunchItem): boolean {
  if (item.pinned) {
    return true;
  }

  // Defensive: items listed under the pinned section are pinned even if a stale
  // icon-cache payload lost the `pinned` flag.
  const pinnedSection = searchSections.find((section) => section.id === "pinned");
  return Boolean(pinnedSection?.indexes.includes(index));
}

function getPathBaseName(filePath: string): string {
  const normalized = filePath.replace(/[\\/]+$/, "");
  const parts = normalized.split(/[\\/]/);
  return parts[parts.length - 1] || filePath;
}

async function addCustomPinnedFromPicker(kind: "file" | "folder"): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法添加置顶");
    return;
  }

  beginPluginNativeInteraction(20000);
  try {
    const selected =
      kind === "file" ? await launcher.pickFilePath() : await launcher.pickDirectoryPath();
    if (!selected) {
      return;
    }

    // Invalidate home cache first — otherwise refreshEntries("") restores the
    // pre-add pinned tiles and looks like the pin never landed.
    markHomeSectionsDirty();
    const result = await launcher.addCustomPinnedPath(selected);
    const title = getPathBaseName(selected);
    if (!result.ok) {
      setStatus(formatPinnedToggleStatus(title, result));
      commandCenterUi.showToast(formatPinnedToggleStatus(title, result));
      return;
    }

    markHomeSectionsDirty();
    setStatus(`已添加置顶：${title}`);
    commandCenterUi.showToast(`已添加置顶：${title}`);
    await refreshEntries(currentQuery);
  } finally {
    schedulePluginNativeInteractionRelease(260);
  }
}

async function removeCustomPinnedItem(item: LaunchItem): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法取消置顶");
    return;
  }

  const result = await launcher.setItemPinned(item.id, false, item);
  if (!result.ok) {
    setStatus(formatPinnedToggleStatus(item.title, result));
    return;
  }

  setStatus(`已取消置顶：${item.title}`);
  markHomeSectionsDirty();
  await refreshEntries(currentQuery);
}

function syncPinnedManageButton(): void {
  const pinnedSection = document.getElementById("cc-pinned");
  pinnedSection?.classList.toggle("is-managing", pinnedManageMode);
  const manageButton = document.getElementById("cc-manage-pinned");
  if (!manageButton) {
    return;
  }
  manageButton.classList.toggle("is-active", pinnedManageMode);
  manageButton.title = pinnedManageMode ? "完成管理" : "管理置顶";
  manageButton.setAttribute("aria-label", manageButton.title);
  manageButton.setAttribute("aria-pressed", pinnedManageMode ? "true" : "false");
}

function setPinnedManageMode(next: boolean): void {
  if (pinnedManageMode === next) {
    syncPinnedManageButton();
    renderPinnedSectionActions();
    return;
  }
  pinnedManageMode = next;
  if (!pinnedManageMode) {
    pinnedManageSelectedIds.clear();
  }
  syncPinnedManageButton();
  renderPinnedSectionActions();
  if (mode === "search" && !currentQuery.trim()) {
    renderList();
  }
}

function togglePinnedManageMode(): void {
  if (currentQuery.trim()) {
    commandCenterUi.showToast("请先清空搜索再管理置顶");
    return;
  }
  setPinnedManageMode(!pinnedManageMode);
}

function getPinnedSectionEntries(): Array<{ index: number; item: LaunchItem }> {
  const section = searchSections.find((item) => item.id === "pinned");
  if (!section) {
    return [];
  }
  const result: Array<{ index: number; item: LaunchItem }> = [];
  for (const index of section.indexes) {
    const entry = entries[index];
    if (entry?.kind === "launch") {
      result.push({ index, item: entry.item });
    }
  }
  return result;
}

function togglePinnedManageSelection(itemId: string): void {
  if (pinnedManageSelectedIds.has(itemId)) {
    pinnedManageSelectedIds.delete(itemId);
  } else {
    pinnedManageSelectedIds.add(itemId);
  }
  renderPinnedSectionActions();
  document
    .querySelectorAll<HTMLElement>("#cc-pinned-list .pinned-chip[data-item-id]")
    .forEach((tile) => {
      const id = tile.dataset.itemId ?? "";
      tile.classList.toggle("is-manage-selected", pinnedManageSelectedIds.has(id));
    });
}

function selectAllPinnedForManage(): void {
  for (const entry of getPinnedSectionEntries()) {
    pinnedManageSelectedIds.add(entry.item.id);
  }
  renderPinnedSectionActions();
  document
    .querySelectorAll<HTMLElement>("#cc-pinned-list .pinned-chip[data-item-id]")
    .forEach((tile) => {
      tile.classList.add("is-manage-selected");
    });
}

function clearPinnedManageSelection(): void {
  pinnedManageSelectedIds.clear();
  renderPinnedSectionActions();
  document
    .querySelectorAll<HTMLElement>("#cc-pinned-list .pinned-chip.is-manage-selected")
    .forEach((tile) => tile.classList.remove("is-manage-selected"));
}

async function unpinSelectedPinnedItems(): Promise<void> {
  if (pinnedManageSelectedIds.size === 0) {
    commandCenterUi.showToast("请先选择要取消置顶的项");
    return;
  }

  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法取消置顶");
    return;
  }

  const selected = getPinnedSectionEntries().filter((entry) =>
    pinnedManageSelectedIds.has(entry.item.id)
  );
  let successCount = 0;
  for (const entry of selected) {
    const result = await launcher.setItemPinned(entry.item.id, false, entry.item);
    if (result.ok) {
      successCount += 1;
    }
  }

  pinnedManageSelectedIds.clear();
  setPinnedManageMode(false);
  setStatus(`已取消置顶 ${successCount} 项`);
  commandCenterUi.showToast(`已取消置顶 ${successCount} 项`);
  markHomeSectionsDirty();
  await refreshEntries("");
}

function createPinnedIconActionButton(
  iconName: string,
  label: string,
  onClick: () => void,
  options?: { danger?: boolean; active?: boolean }
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "icon-action-btn";
  if (options?.danger) {
    button.classList.add("icon-action-btn--danger");
  }
  if (options?.active) {
    button.classList.add("is-active");
  }
  button.title = label;
  button.setAttribute("aria-label", label);
  if (commandCenterIcons) {
    button.appendChild(commandCenterIcons.createIconElement(iconName, true));
  } else {
    button.textContent = label;
  }
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });
  return button;
}

function createCustomPinnedSettingsList(container: HTMLElement): void {
  container.replaceChildren();

  const launcher = getLauncherApi();
  if (!launcher) {
    const hint = document.createElement("p");
    hint.className = "settings-row-hint";
    hint.textContent = "桥接层未加载，无法读取自定义置顶。";
    container.appendChild(hint);
    return;
  }

  void launcher.getPinnedItems().then((items) => {
    const customItems = items.filter((item) => item.id.startsWith("pin:custom:"));
    container.replaceChildren();

    if (customItems.length === 0) {
      const hint = document.createElement("p");
      hint.className = "settings-row-hint";
      hint.textContent = "暂无自定义置顶。可添加不在扫描目录内的程序、文件或文件夹。";
      container.appendChild(hint);
      return;
    }

    const list = document.createElement("div");
    list.className = "custom-pinned-list";

    for (const item of customItems) {
      const row = document.createElement("div");
      row.className = "custom-pinned-item";

      const meta = document.createElement("div");
      meta.className = "custom-pinned-meta";

      const title = document.createElement("div");
      title.className = "custom-pinned-title";
      title.textContent = item.title;

      const subtitle = document.createElement("div");
      subtitle.className = "custom-pinned-subtitle";
      subtitle.textContent = item.subtitle;

      meta.append(title, subtitle);

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "settings-btn settings-btn-secondary";
      removeButton.textContent = "移除";
      removeButton.addEventListener("click", () => {
        void removeCustomPinnedItem(item).then(() => {
          createCustomPinnedSettingsList(container);
        });
      });

      row.append(meta, removeButton);
      list.appendChild(row);
    }

    container.appendChild(list);
  });
}

async function togglePinned(index: number, expectedItemId?: string): Promise<void> {
  if (mode !== "search") {
    return;
  }

  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u7f6e\u9876");
    return;
  }

  const selected = entries[index];
  if (!selected || selected.kind !== "launch") {
    if (expectedItemId) {
      const relocatedIndex = findLaunchEntryIndexInCurrentEntries(expectedItemId);
      if (relocatedIndex >= 0 && relocatedIndex !== index) {
        await togglePinned(relocatedIndex, expectedItemId);
        return;
      }
    }
    setStatus("置顶失败：当前结果已过期，请重新搜索");
    return;
  }

  const item = selected.item;
  if (expectedItemId && item.id !== expectedItemId) {
    const relocatedIndex = findLaunchEntryIndexInCurrentEntries(expectedItemId);
    if (relocatedIndex >= 0 && relocatedIndex !== index) {
      await togglePinned(relocatedIndex, expectedItemId);
      return;
    }
    setStatus("置顶失败：当前结果已过期，请重新搜索");
    return;
  }
  const nextPinned = !isLaunchEntryPinned(index, item);
  const pinResult = await launcher.setItemPinned(item.id, nextPinned, item);
  if (!pinResult.ok) {
    setStatus(formatPinnedToggleStatus(item.title, pinResult));
    return;
  }

  updatePinnedState(item.id, pinResult.pinned);
  setStatus(formatPinnedToggleStatus(item.title, pinResult));
  markHomeSectionsDirty();
  await refreshEntries(currentQuery);
}

function isAdminRunnableItem(item: LaunchItem): boolean {
  return item.type === "application" || item.type === "file";
}

function isRevealableItem(item: LaunchItem): boolean {
  return (
    item.type === "application" ||
    item.type === "file" ||
    item.type === "folder"
  );
}

function closeSearchContextMenu(): void {
  if (!activeSearchContextMenu) {
    return;
  }

  activeSearchContextMenu.remove();
  activeSearchContextMenu = null;
}

async function runAsAdmin(index: number): Promise<void> {
  if (mode !== "search") {
    return;
  }

  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法管理员运行");
    return;
  }

  const selected = entries[index];
  if (!selected || selected.kind !== "launch") {
    return;
  }

  const item = selected.item;
  if (!isAdminRunnableItem(item)) {
    setStatus(`不支持管理员运行：${item.title}`);
    return;
  }

  const commandItem: LaunchItem = {
    id: `command:runas:${item.id}`,
    type: "command",
    title: item.title,
    subtitle: `管理员运行：${item.subtitle}`,
    target: `command:runas:${encodeURIComponent(item.target)}`,
    keywords: ["runas", "admin"]
  };

  const result = await launcher.execute(commandItem);
  if (!result.ok) {
    setStatus(result.message ?? `管理员运行失败：${item.title}`);
    return;
  }

  setStatus(result.message ?? `已请求管理员运行：${item.title}`);
}

async function revealItemLocation(index: number): Promise<void> {
  if (mode !== "search") {
    return;
  }

  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法打开所在位置");
    return;
  }

  const selected = entries[index];
  if (!selected || selected.kind !== "launch") {
    return;
  }

  const item = selected.item;
  if (!isRevealableItem(item)) {
    setStatus(`不支持打开所在位置：${item.title}`);
    return;
  }

  const commandItem: LaunchItem = {
    id: `command:reveal:${item.id}`,
    type: "command",
    title: item.title,
    subtitle: `打开所在位置：${item.subtitle}`,
    target: `command:reveal:${encodeURIComponent(item.target)}`,
    keywords: ["reveal", "location", "folder"]
  };

  const result = await launcher.execute(commandItem);
  if (!result.ok) {
    setStatus(result.message ?? `打开所在位置失败：${item.title}`);
    return;
  }

  setStatus(result.message ?? `已打开所在位置：${item.title}`);
}

function openSearchContextMenu(
  event: MouseEvent,
  index: number,
  entry: ResultEntry
): void {
  if (entry.kind !== "launch") {
    return;
  }

  closeSearchContextMenu();

  const menu = document.createElement("div");
  menu.className = "search-context-menu";
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  menu.addEventListener("mousedown", (menuEvent) => {
    menuEvent.stopPropagation();
  });
  menu.addEventListener("click", (menuEvent) => {
    menuEvent.stopPropagation();
  });

  const pinButton = document.createElement("button");
  pinButton.type = "button";
  pinButton.className = "search-context-menu-item";
  pinButton.textContent = isLaunchEntryPinned(index, entry.item) ? "取消置顶" : "置顶";
  pinButton.addEventListener("click", () => {
    closeSearchContextMenu();
    void togglePinned(index, entry.item.id);
  });
  menu.appendChild(pinButton);

  if (isRevealableItem(entry.item)) {
    const revealButton = document.createElement("button");
    revealButton.type = "button";
    revealButton.className = "search-context-menu-item";
    revealButton.textContent = "打开所在位置";
    revealButton.addEventListener("click", () => {
      closeSearchContextMenu();
      void revealItemLocation(index);
    });
    menu.appendChild(revealButton);
  }

  if (isAdminRunnableItem(entry.item)) {
    const adminButton = document.createElement("button");
    adminButton.type = "button";
    adminButton.className = "search-context-menu-item";
    adminButton.textContent = "管理员运行";
    adminButton.addEventListener("click", () => {
      closeSearchContextMenu();
      void runAsAdmin(index);
    });
    menu.appendChild(adminButton);
  }

  document.body.appendChild(menu);
  activeSearchContextMenu = menu;

  const bounds = menu.getBoundingClientRect();
  let left = bounds.left;
  let top = bounds.top;
  if (bounds.right > window.innerWidth - 8) {
    left = Math.max(8, window.innerWidth - bounds.width - 8);
  }
  if (bounds.bottom > window.innerHeight - 8) {
    top = Math.max(8, window.innerHeight - bounds.height - 8);
  }
  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(top)}px`;
}

function bindResultInteractions(
  element: HTMLElement,
  index: number,
  entry: ResultEntry
): void {
  element.addEventListener("mouseenter", () => {
    if (pinnedManageMode) {
      return;
    }
    const previousIndex = selectedIndex;
    selectedIndex = index;
    if (canUpdateSelectionHighlightInPlace()) {
      updateSelectionHighlight(previousIndex, selectedIndex);
    }
  });

  element.addEventListener("click", (event) => {
    event.stopPropagation();
    if (
      pinnedManageMode &&
      entry.kind === "launch" &&
      element.classList.contains("pinned-chip")
    ) {
      event.preventDefault();
      togglePinnedManageSelection(entry.item.id);
      return;
    }
    const previousIndex = selectedIndex;
    selectedIndex = index;
    if (canUpdateSelectionHighlightInPlace()) {
      updateSelectionHighlight(previousIndex, selectedIndex);
    }
    void executeSelected(index);
  });

  element.addEventListener("contextmenu", (event) => {
    if (mode !== "search" || entry.kind !== "launch") {
      return;
    }
    if (pinnedManageMode) {
      event.preventDefault();
      event.stopPropagation();
      togglePinnedManageSelection(entry.item.id);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const previousIndex = selectedIndex;
    selectedIndex = index;
    // Avoid full renderList() here: it closes the menu and can race with
    // opening a fresh one while selection chips/highlight update in place.
    if (canUpdateSelectionHighlightInPlace()) {
      updateSelectionHighlight(previousIndex, selectedIndex);
    } else {
      renderList();
    }
    openSearchContextMenu(event, index, entry);
  });
}

function changeSearchResultPage(delta: number): void {
  if (mode !== "search") {
    return;
  }

  if (!currentQuery.trim()) {
    return;
  }

  const section = getSearchResultSection();
  if (!section || section.pageCount <= 1) {
    return;
  }

  const nextPage = Math.min(
    Math.max(0, searchResultPage + delta),
    section.pageCount - 1
  );
  if (nextPage === searchResultPage) {
    return;
  }

  searchResultPage = nextPage;
  if (cachedSearchLaunchItems.length > 0 && pagedSearchQueryKey) {
    applyCachedSearchPage();
    return;
  }
  void refreshEntries(currentQuery);
}

function applyCachedSearchPage(): void {
  const parsedQuery = parseSearchQuery(currentQuery);
  const pageSize = Math.max(1, searchDisplayConfig.searchLimit);
  const totalSearchCount = cachedSearchLaunchItems.length;
  const searchPageCount = Math.max(
    1,
    Math.ceil(Math.max(1, totalSearchCount) / pageSize)
  );
  if (searchResultPage >= searchPageCount) {
    searchResultPage = searchPageCount - 1;
  }
  const searchStart = searchResultPage * pageSize;
  const pagedSearchItems = cachedSearchLaunchItems.slice(
    searchStart,
    searchStart + pageSize
  );

  resetSearchSections();
  addSearchSection(
    "search",
    parsedQuery.explicitScope ? `${parsedQuery.scopeLabel}结果` : "搜索结果",
    pagedSearchItems,
    pageSize,
    parsedQuery.explicitScope
      ? `没有匹配的${parsedQuery.scopeLabel}结果`
      : "没有匹配结果",
    {
      totalCount: totalSearchCount,
      page: searchResultPage,
      pageCount: searchPageCount
    }
  );
  selectedIndex = entries.length ? 0 : 0;
  renderList();
  const shownStart = totalSearchCount === 0 ? 0 : searchStart + 1;
  const shownEnd =
    totalSearchCount === 0 ? 0 : searchStart + pagedSearchItems.length;
  const fetchLimit = Math.min(
    SEARCH_PAGE_FETCH_MAX,
    Math.max(pageSize, pageSize * SEARCH_PAGE_FETCH_MULTIPLIER)
  );
  const totalSearchText =
    totalSearchCount >= fetchLimit ? `${totalSearchCount}+` : `${totalSearchCount}`;
  if (parsedQuery.explicitScope) {
    setStatus(
      `${parsedQuery.scopeLabel}搜索 ${shownStart}-${shownEnd}/${totalSearchText}`
    );
  } else {
    setStatus(`搜索 ${shownStart}-${shownEnd}/${totalSearchText}`);
  }
}

function changePluginResultPage(delta: number): void {
  if (mode !== "search") {
    return;
  }

  const section = searchSections.find((item) => item.id === "plugin");
  if (!section || section.pageCount <= 1) {
    return;
  }

  const nextPage = Math.min(
    Math.max(0, pluginResultPage + delta),
    section.pageCount - 1
  );
  if (nextPage === pluginResultPage) {
    return;
  }

  pluginResultPage = nextPage;
  void refreshEntries(currentQuery);
}

function createSearchTile(
  entry: ResultEntry,
  index: number,
  sectionId: SectionId
): HTMLLIElement {
  const tile = document.createElement("li");
  tile.className = "result-item result-tile";
  if (sectionId === "recent") {
    tile.classList.add("recent-tile");
  } else if (sectionId === "pinned") {
    tile.classList.add("pinned-chip");
  } else if (sectionId === "plugin") {
    tile.classList.add("plugin-chip");
  }
  if (index === selectedIndex) {
    tile.classList.add("active");
  }
  if (entry.kind === "launch" && entry.item.pinned) {
    tile.classList.add("is-pinned");
  }
  tile.dataset.index = String(index);

  const pluginId =
    entry.kind === "launch" ? pluginIdFromCatalogItem(entry.item) : undefined;
  const icon = wrapResultIcon(entry, pluginId);
  const title = document.createElement("span");
  title.className = "tile-title";
  title.textContent =
    entry.kind === "launch" ? entry.item.title : clipTitle(entry.item.content);

  tile.title = title.textContent;
  if (entry.kind === "launch") {
    tile.dataset.itemId = entry.item.id;
  }
  tile.append(icon, title);

  if (sectionId === "pinned" && pinnedManageMode && entry.kind === "launch") {
    tile.classList.add("is-manageable");
    if (pinnedManageSelectedIds.has(entry.item.id)) {
      tile.classList.add("is-manage-selected");
    }
    const mark = document.createElement("span");
    mark.className = "pinned-manage-check";
    mark.setAttribute("aria-hidden", "true");
    if (commandCenterIcons) {
      mark.appendChild(commandCenterIcons.createIconElement("check", true));
    }
    tile.appendChild(mark);
  }

  if (entry.kind === "launch" && entry.item.pinned && sectionId !== "pinned") {
    const pinBadge = document.createElement("span");
    pinBadge.className = "tile-pin";
    pinBadge.title = "置顶";
    pinBadge.setAttribute("aria-label", "置顶");
    tile.appendChild(pinBadge);
  }

  bindResultInteractions(tile, index, entry);
  return tile;
}

function getAdaptiveSectionGridColumns(itemCount: number, availableWidth: number): number {
  if (itemCount <= 0 || availableWidth <= 0) {
    return 1;
  }

  const maxColumns = Math.max(
    1,
    Math.floor(
      (availableWidth + SECTION_GRID_GAP) / (SECTION_GRID_TILE_WIDTH + SECTION_GRID_GAP)
    )
  );

  return maxColumns;
}

function applyAdaptiveSectionGridColumns(grid: HTMLUListElement): void {
  const itemCount = grid.children.length;
  const width = grid.clientWidth || grid.getBoundingClientRect().width;
  const columns = getAdaptiveSectionGridColumns(itemCount, width);
  grid.style.setProperty("--section-grid-columns", String(columns));
}

function refreshAdaptiveSectionGrids(): void {
  document
    .querySelectorAll<HTMLUListElement>(".result-list .section-grid")
    .forEach((grid) => applyAdaptiveSectionGridColumns(grid));
}

function scheduleAdaptiveSectionGridRefresh(): void {
  if (sectionGridResizeFrame !== null) {
    window.cancelAnimationFrame(sectionGridResizeFrame);
  }

  sectionGridResizeFrame = window.requestAnimationFrame(() => {
    sectionGridResizeFrame = null;
    refreshAdaptiveSectionGrids();
  });
}

function renderPinnedSectionActions(): void {
  const host = commandCenterUi.getPinnedActionsHost();
  if (!host) {
    return;
  }
  if (currentQuery.trim().length > 0) {
    // Keep home chrome intact behind the search overlay.
    return;
  }

  host.replaceChildren();

  if (pinnedManageMode) {
    const selectedCount = pinnedManageSelectedIds.size;
    const countLabel = document.createElement("span");
    countLabel.className = "pinned-manage-count";
    countLabel.textContent = `已选 ${selectedCount}`;
    host.append(
      countLabel,
      createPinnedIconActionButton("check", "全选", () => selectAllPinnedForManage()),
      createPinnedIconActionButton("close", "清空选择", () => clearPinnedManageSelection()),
      createPinnedIconActionButton(
        "trash",
        selectedCount > 0 ? `取消置顶(${selectedCount})` : "取消置顶",
        () => {
          void unpinSelectedPinnedItems();
        },
        { danger: true }
      ),
      createPinnedIconActionButton("close", "完成", () => setPinnedManageMode(false), {
        active: true
      })
    );
    return;
  }

  host.append(
    createPinnedIconActionButton("file", "添加文件", () => {
      void addCustomPinnedFromPicker("file");
    }),
    createPinnedIconActionButton("folder", "添加文件夹", () => {
      void addCustomPinnedFromPicker("folder");
    })
  );
}

function renderSectionPager(section: SearchSection): void {
  const host =
    section.id === "plugin"
      ? commandCenterUi.getPluginPagerHost()
      : commandCenterUi.getCommandResultsHost();
  if (!host || section.pageCount <= 1) {
    if (section.id === "plugin") {
      commandCenterUi.getPluginPagerHost()?.replaceChildren();
    }
    return;
  }

  const pagerHost = commandCenterUi.getPluginPagerHost();
  if (!pagerHost) {
    return;
  }

  pagerHost.replaceChildren();
  const pager = document.createElement("div");
  pager.className = "section-pager";

  const prevButton = document.createElement("button");
  prevButton.type = "button";
  prevButton.className = "section-page-btn";
  prevButton.textContent = "上一页";
  prevButton.disabled = section.page <= 0;
  prevButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (section.id === "search") {
      changeSearchResultPage(-1);
      return;
    }
    changePluginResultPage(-1);
  });

  const pageInfo = document.createElement("span");
  pageInfo.className = "section-page-info";
  pageInfo.textContent = `${section.page + 1}/${section.pageCount}`;

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "section-page-btn";
  nextButton.textContent = "下一页";
  nextButton.disabled = section.page >= section.pageCount - 1;
  nextButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (section.id === "search") {
      changeSearchResultPage(1);
      return;
    }
    changePluginResultPage(1);
  });

  pager.append(prevButton, pageInfo, nextButton);
  pagerHost.appendChild(pager);
}

function renderCommandResults(section: SearchSection): void {
  const host = commandCenterUi.getCommandResultsHost();
  if (!host) {
    return;
  }

  host.replaceChildren();
  host.hidden = false;

  const summary = document.createElement("div");
  summary.className = "result-summary";
  summary.innerHTML = `<span>搜索结果</span><span>${section.totalCount}</span>`;
  host.appendChild(summary);

  if (section.indexes.length === 0) {
    const empty = document.createElement("div");
    empty.className = "no-results";
    empty.textContent = "没有找到匹配项，试试 app:、cmd:、web: 或 plugin:";
    host.appendChild(empty);
    return;
  }

  for (const index of section.indexes) {
    const entry = entries[index];
    if (!entry) {
      continue;
    }

    const row = document.createElement("button");
    row.type = "button";
    row.className = "command-result";
    if (index === selectedIndex) {
      row.classList.add("active");
    }
    row.dataset.index = String(index);

    const pluginId =
      entry.kind === "launch" ? pluginIdFromCatalogItem(entry.item) : undefined;
    row.appendChild(wrapResultIcon(entry, pluginId));

    const title = document.createElement("span");
    title.className = "command-result__title";
    title.textContent =
      entry.kind === "launch" ? entry.item.title : clipTitle(entry.item.content);

    const kind = document.createElement("span");
    kind.className = "command-result__kind";
    kind.textContent =
      entry.kind === "launch" ? normalizeLaunchType(entry.item.type) : "Clip";

    row.append(title, kind);
    if (commandCenterIcons) {
      const openIcon = commandCenterIcons.createIconElement("open", true);
      row.appendChild(openIcon);
    }

    bindResultInteractions(row, index, entry);
    host.appendChild(row);
  }
}

function renderSearchSections(): void {
  const hasQuery = currentQuery.trim().length > 0;
  commandCenterUi.updateCommandCenterQueryState(hasQuery);
  renderPinnedSectionActions();

  for (const section of searchSections) {
    if (section.id === "search") {
      if (hasQuery) {
        renderCommandResults(section);
      }
      continue;
    }

    if (hasQuery) {
      // Preserve recent / pinned / plugins behind the blurred overlay.
      continue;
    }

    const grid = commandCenterUi.getSectionGrid(section.id);
    if (!grid) {
      continue;
    }

    grid.replaceChildren();
    const total = section.totalCount > 0 ? section.totalCount : section.displayLimit;
    commandCenterUi.updateSectionCount(section.id, section.indexes.length, total);

    if (section.indexes.length === 0) {
      continue;
    }

    for (const index of section.indexes) {
      const entry = entries[index];
      if (!entry) {
        continue;
      }
      grid.appendChild(createSearchTile(entry, index, section.id));
    }

    if (section.id === "plugin") {
      renderSectionPager(section);
      commandCenterUi.appendPluginAddChip(() => {
        settingsFocusHint = "plugins";
        openSettingsPanel();
      });
    }
  }

  refreshAdaptiveSectionGrids();
}

function getVisibleGridColumnCount(selected = selectedIndex): number {
  if (mode !== "search") {
    return 1;
  }

  const tile = document.querySelector<HTMLElement>(
    `.result-item.result-tile[data-index="${selected}"], .command-result[data-index="${selected}"]`
  );
  if (!tile) {
    return 1;
  }

  const grid = tile.closest(".section-grid, .recent-grid, .pinned-grid, .plugin-grid");
  if (!(grid instanceof HTMLElement)) {
    return 1;
  }

  const tiles = Array.from(
    grid.querySelectorAll<HTMLElement>(".result-item.result-tile")
  );
  if (tiles.length === 0) {
    return 1;
  }

  const firstRowTop = tiles[0]?.offsetTop ?? 0;
  let columns = 0;
  for (const item of tiles) {
    if (item.offsetTop !== firstRowTop) {
      break;
    }
    columns += 1;
  }

  return Math.max(1, columns);
}

function renderDetailList(): void {
  entries.forEach((entry, index) => {
    const row = document.createElement("li");
    row.className = "result-item";
    if (index === selectedIndex) {
      row.classList.add("active");
    }
    row.dataset.index = String(index);

    const main = document.createElement("div");
    main.className = "result-main";

    const content = document.createElement("div");
    content.className = "result-content";

    const header = document.createElement("div");
    header.className = "result-header";

    const title = document.createElement("span");
    title.className = "result-title";

    const type = document.createElement("span");
    type.className = "result-type";

    const subtitle = document.createElement("div");
    subtitle.className = "result-subtitle";

    if (entry.kind === "launch") {
      title.textContent = entry.item.title;
      type.textContent = normalizeLaunchType(entry.item.type);
      subtitle.textContent = entry.item.subtitle;
    } else {
      title.textContent = clipTitle(entry.item.content);
      type.textContent = "Clip";
      subtitle.textContent = clipSubtitle(entry.item.createdAt);
    }

    header.append(title, type);
    content.append(header, subtitle);
    main.append(createResultIcon(entry), content);
    row.append(main);

    bindResultInteractions(row, index, entry);
    list.appendChild(row);
  });
}

async function saveSettingsFromForm(form: HTMLFormElement): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u4fdd\u5b58\u8bbe\u7f6e");
    return;
  }

  const readNumber = (name: string): number => {
    const inputNode = form.elements.namedItem(name);
    if (!(inputNode instanceof HTMLInputElement)) {
      return NaN;
    }
    return Number(inputNode.value);
  };

  const inputConfig: Partial<SearchDisplayConfig> = {
    recentLimit: readNumber("recentLimit"),
    pinnedLimit: readNumber("pinnedLimit"),
    pluginLimit: readNumber("pluginLimit"),
    searchLimit: readNumber("searchLimit")
  };
  const scanProgramFilesNode = form.elements.namedItem("scanProgramFiles");
  const customScanDirsNode = form.elements.namedItem("customScanDirs");
  const excludeScanDirsNode = form.elements.namedItem("excludeScanDirs");
  const resultIncludeDirsNode = form.elements.namedItem("resultIncludeDirs");
  const resultExcludeDirsNode = form.elements.namedItem("resultExcludeDirs");
  const catalogInputConfig: Partial<CatalogScanConfig> = {
    scanProgramFiles:
      scanProgramFilesNode instanceof HTMLInputElement
        ? scanProgramFilesNode.checked
        : catalogScanConfig.scanProgramFiles,
    customScanDirs:
      customScanDirsNode instanceof HTMLTextAreaElement
        ? parseCustomScanDirsText(customScanDirsNode.value)
        : catalogScanConfig.customScanDirs,
    excludeScanDirs:
      excludeScanDirsNode instanceof HTMLTextAreaElement
        ? parseExcludeScanDirsText(excludeScanDirsNode.value)
        : catalogScanConfig.excludeScanDirs,
    resultIncludeDirs:
      resultIncludeDirsNode instanceof HTMLTextAreaElement
        ? parseResultIncludeDirsText(resultIncludeDirsNode.value)
        : catalogScanConfig.resultIncludeDirs,
    resultExcludeDirs:
      resultExcludeDirsNode instanceof HTMLTextAreaElement
        ? parseResultExcludeDirsText(resultExcludeDirsNode.value)
        : catalogScanConfig.resultExcludeDirs
  };
  const nextVisiblePluginIds = readVisiblePluginIdsFromSettingsForm(form);

  const launchAtLoginNode = form.elements.namedItem("launchAtLogin");
  const nextLaunchAtLoginEnabled =
    launchAtLoginNode instanceof HTMLInputElement
      ? launchAtLoginNode.checked
      : launchAtLoginStatus.enabled;

  const previousVisiblePluginIds = visiblePluginIds;
  let visiblePluginsChanged = false;

  const themeApi = getUiThemeApi();
  const presetNode = form.elements.namedItem("uiThemePresetId");
  const accentNode = form.elements.namedItem("uiThemeAccent");
  const nextThemeInput: Partial<UiThemeConfig> = {
    ...uiThemeConfig
  };
  if (presetNode instanceof HTMLInputElement && presetNode.value) {
    nextThemeInput.presetId = presetNode.value as UiThemePresetId;
  }
  if (accentNode instanceof HTMLInputElement && accentNode.value) {
    if (nextThemeInput.presetId === "custom" && themeApi) {
      Object.assign(nextThemeInput, themeApi.fromAccent(accentNode.value, uiThemeConfig));
    } else if (nextThemeInput.presetId === "custom") {
      nextThemeInput.accent = accentNode.value;
    }
  }

  try {
    const normalized = normalizeSettingsInput(inputConfig);
    const normalizedCatalog = normalizeCatalogScanConfigInput(catalogInputConfig);
    const [
      nextSearchDisplayConfig,
      nextCatalogScanConfig,
      nextAppliedVisiblePluginIds,
      nextLaunchAtLoginStatus,
      nextUiThemeConfig
    ] = await Promise.all([
      launcher.setSearchDisplayConfig(normalized),
      launcher.setCatalogScanConfig(normalizedCatalog),
      launcher.setVisiblePluginIds(nextVisiblePluginIds),
      launcher.setLaunchAtLoginEnabled(nextLaunchAtLoginEnabled),
      launcher.setUiThemeConfig(nextThemeInput)
    ]);
    searchDisplayConfig = nextSearchDisplayConfig;
    catalogScanConfig = nextCatalogScanConfig;
    visiblePluginIds = nextAppliedVisiblePluginIds;
    launchAtLoginStatus = nextLaunchAtLoginStatus;
    applyUiThemeConfig(nextUiThemeConfig);
    visiblePluginsChanged =
      previousVisiblePluginIds.length !== visiblePluginIds.length ||
      previousVisiblePluginIds.some((id, index) => id !== visiblePluginIds[index]);
    if (visiblePluginsChanged) {
      markHomeSectionsDirty();
    }
    setStatus(
      `\u8bbe\u7f6e\u5df2\u4fdd\u5b58（可见插件 ${visiblePluginIds.length} 个；索引源改动需重建索引后生效）`
    );
  } catch {
    setStatus("\u4fdd\u5b58\u8bbe\u7f6e\u5931\u8d25");
  }

  // Only the visible-plugin list affects other panels (home sections,
  // plugin catalog). Other fields are just clamped/deduped versions of what
  // the user already sees in the form, so skip the full settings-panel
  // rebuild when nothing structural changed.
  if (visiblePluginsChanged) {
    renderList();
  }
}

async function rebuildCatalogFromSettings(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u91cd\u5efa\u7d22\u5f15");
    return;
  }

  setStatus("\u6b63\u5728\u91cd\u5efa\u7d22\u5f15...");
  try {
    const result = await launcher.rebuildCatalog();
    const durationText = `${Math.max(0, Math.round(result.durationMs))}ms`;
    setStatus(`${result.message}（${durationText}）`);
    markHomeSectionsDirty();
    await refreshEntries(currentQuery);
  } catch {
    setStatus("\u91cd\u5efa\u7d22\u5f15\u5931\u8d25");
  }
}

function renderSettingsPanel(
  target: HTMLElement = list,
  options?: { listItemWrap?: boolean }
): void {
  const wrapInListItem = options?.listItemWrap ?? target === list;
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel settings-panel-structured cc-settings-shell";

  const header = document.createElement("header");
  header.className = "cc-settings-header";

  const headerCopy = document.createElement("div");
  const eyebrow = document.createElement("div");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "LiteLauncher";
  const title = document.createElement("h2");
  title.textContent = "设置中心";
  headerCopy.append(eyebrow, title);

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "cc-settings-close icon-only";
  closeButton.setAttribute("aria-label", "关闭设置");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", () => {
    dismissSettingsOverlay();
  });
  header.append(headerCopy, closeButton);

  const form = document.createElement("form");
  form.className = "settings-form settings-form-grouped";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveSettingsFromForm(form);
  });

  const settingsBody = document.createElement("div");
  settingsBody.className = "settings-body";

  const settingsNav = document.createElement("nav");
  settingsNav.setAttribute("aria-label", "设置分组");

  const settingsContent = document.createElement("div");
  settingsContent.className = "settings-content";

  type SettingsTabId =
    | "appearance"
    | "display"
    | "scan"
    | "pinned"
    | "plugins"
    | "updates"
    | "errors";

  const settingsTabs: Array<{ id: SettingsTabId; label: string }> = [
    { id: "appearance", label: "外观主题" },
    { id: "display", label: "搜索展示" },
    { id: "scan", label: "索引扫描" },
    { id: "pinned", label: "自定义置顶" },
    { id: "plugins", label: "插件可见性" },
    { id: "updates", label: "系统与更新" },
    { id: "errors", label: "错误日志" }
  ];

  const initialTab: SettingsTabId =
    settingsFocusHint === "errors"
      ? "errors"
      : settingsFocusHint === "plugins"
        ? "plugins"
        : settingsFocusHint === "pinned"
          ? "pinned"
          : settingsFocusHint === "updates"
            ? "updates"
            : "appearance";

  const navButtons = new Map<SettingsTabId, HTMLButtonElement>();
  const groupSections = new Map<SettingsTabId, HTMLElement>();

  const showSettingsTab = (tabId: SettingsTabId): void => {
    for (const [id, section] of groupSections) {
      section.hidden = id !== tabId;
    }
    for (const [id, button] of navButtons) {
      button.classList.toggle("is-active", id === tabId);
    }
  };

  for (const tab of settingsTabs) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = tab.label;
    button.dataset.settingsTab = tab.id;
    button.addEventListener("click", () => {
      showSettingsTab(tab.id);
    });
    navButtons.set(tab.id, button);
    settingsNav.appendChild(button);
  }

  settingsBody.append(settingsNav, settingsContent);

  const createGroup = (
    groupTitle: string,
    groupDescription: string
  ): {
    section: HTMLElement;
    body: HTMLDivElement;
  } => {
    const section = document.createElement("section");
    section.className = "settings-group";

    const head = document.createElement("div");
    head.className = "settings-group-head";

    const titleNode = document.createElement("h4");
    titleNode.className = "settings-group-title";
    titleNode.textContent = groupTitle;

    const descriptionNode = document.createElement("p");
    descriptionNode.className = "settings-group-description";
    descriptionNode.textContent = groupDescription;

    const body = document.createElement("div");
    body.className = "settings-group-body";

    head.append(titleNode, descriptionNode);
    section.append(head, body);
    return { section, body };
  };

  const createRow = (
    rowLabel: string,
    rowHint: string,
    options?: { textarea?: boolean }
  ): {
    row: HTMLDivElement;
    control: HTMLDivElement;
    hint: HTMLSpanElement;
  } => {
    const row = document.createElement("div");
    row.className = options?.textarea
      ? "settings-row settings-row-textarea"
      : "settings-row";

    const labelNode = document.createElement("span");
    labelNode.className = "settings-row-label";
    labelNode.textContent = rowLabel;

    const control = document.createElement("div");
    control.className = "settings-control";

    const hintNode = document.createElement("span");
    hintNode.className = "settings-row-hint";
    hintNode.textContent = rowHint;

    row.append(labelNode, control, hintNode);
    return { row, control, hint: hintNode };
  };

  type FieldItem = {
    key: keyof SearchDisplayConfig;
    label: string;
    hint: string;
  };

  const fields: FieldItem[] = [
    {
      key: "searchLimit",
      label: "\u641c\u7d22\u7ed3\u679c",
      hint: "\u8f93\u5165\u540e\u5206\u533a"
    }
  ];

  const themeApi = getUiThemeApi();
  const appearanceGroup = createGroup(
    "外观主题",
    "切换预设或自定义主色；改动会立即预览，点保存后持久生效。"
  );
  appearanceGroup.section.dataset.settingsGroup = "appearance";
  groupSections.set("appearance", appearanceGroup.section);

  const presetRow = createRow("主题预设", "一键切换整套配色");
  const presetGrid = document.createElement("div");
  presetGrid.className = "settings-theme-presets";

  const presetHidden = document.createElement("input");
  presetHidden.type = "hidden";
  presetHidden.name = "uiThemePresetId";
  presetHidden.value = uiThemeConfig.presetId;

  const accentRow = createRow("自定义主色", "选色后自动生成强调色");
  const accentControl = document.createElement("div");
  accentControl.className = "settings-theme-accent";

  const accentInput = document.createElement("input");
  accentInput.className = "settings-theme-accent-input";
  accentInput.type = "color";
  accentInput.name = "uiThemeAccent";
  accentInput.value = uiThemeConfig.accent;

  const accentHex = document.createElement("span");
  accentHex.className = "settings-theme-accent-hex";
  accentHex.textContent = uiThemeConfig.accent;

  const syncThemeControls = (theme: UiThemeConfig): void => {
    presetHidden.value = theme.presetId;
    accentInput.value = theme.accent;
    accentHex.textContent = theme.accent;
    presetGrid
      .querySelectorAll<HTMLButtonElement>("[data-theme-preset]")
      .forEach((button) => {
        button.classList.toggle(
          "is-active",
          button.dataset.themePreset === theme.presetId
        );
      });
  };

  const presets = themeApi?.PRESETS ?? [
    {
      id: "violet" as const,
      label: "暗紫",
      theme: {
        accent: "#9d63ff",
        accentStrong: "#6f3bc2",
        accentSoft: "#c4a0ff",
        bg: "#070612",
        surface: "#0d0b1d",
        text: "#f1edff"
      }
    }
  ];

  for (const preset of presets) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "settings-theme-preset";
    button.dataset.themePreset = preset.id;
    button.title = preset.label;
    button.setAttribute("aria-label", preset.label);

    const swatch = document.createElement("span");
    swatch.className = "settings-theme-preset-swatch";
    swatch.style.setProperty("--theme-swatch", preset.theme.accent);
    swatch.style.setProperty("--theme-swatch-bg", preset.theme.surface);

    const label = document.createElement("span");
    label.className = "settings-theme-preset-label";
    label.textContent = preset.label;

    button.append(swatch, label);
    button.addEventListener("click", () => {
      const next = themeApi
        ? themeApi.fromPreset(preset.id)
        : { presetId: preset.id, ...preset.theme };
      applyUiThemeConfig(next);
      syncThemeControls(uiThemeConfig);
      void persistUiThemeConfig(uiThemeConfig).then((saved) => {
        if (saved) {
          setStatus(`已切换主题：${preset.label}`);
        } else {
          setStatus("主题已预览，保存设置后持久生效");
        }
      });
    });
    presetGrid.appendChild(button);
  }

  const customButton = document.createElement("button");
  customButton.type = "button";
  customButton.className = "settings-theme-preset";
  customButton.dataset.themePreset = "custom";
  customButton.title = "自定义";
  customButton.setAttribute("aria-label", "自定义");
  const customSwatch = document.createElement("span");
  customSwatch.className = "settings-theme-preset-swatch is-custom";
  customSwatch.style.setProperty("--theme-swatch", uiThemeConfig.accent);
  customSwatch.style.setProperty("--theme-swatch-bg", uiThemeConfig.surface);
  const customLabel = document.createElement("span");
  customLabel.className = "settings-theme-preset-label";
  customLabel.textContent = "自定义";
  customButton.append(customSwatch, customLabel);
  customButton.addEventListener("click", () => {
    accentInput.click();
  });
  presetGrid.appendChild(customButton);

  accentInput.addEventListener("input", () => {
    const next = themeApi
      ? themeApi.fromAccent(accentInput.value, uiThemeConfig)
      : {
          ...uiThemeConfig,
          presetId: "custom" as const,
          accent: accentInput.value
        };
    applyUiThemeConfig(next);
    customSwatch.style.setProperty("--theme-swatch", uiThemeConfig.accent);
    syncThemeControls(uiThemeConfig);
  });
  accentInput.addEventListener("change", () => {
    void persistUiThemeConfig(uiThemeConfig).then((saved) => {
      setStatus(saved ? "自定义主色已保存" : "主色已预览，保存设置后持久生效");
    });
  });

  presetRow.control.append(presetHidden, presetGrid);
  accentControl.append(accentInput, accentHex);
  accentRow.control.appendChild(accentControl);
  appearanceGroup.body.append(presetRow.row, accentRow.row);
  settingsContent.appendChild(appearanceGroup.section);
  syncThemeControls(uiThemeConfig);

  const displayGroup = createGroup(
    "搜索展示",
    "控制输入关键词后的搜索结果数量；首页分区已按实际内容和宽度自适应。"
  );
  displayGroup.section.dataset.settingsGroup = "display";
  groupSections.set("display", displayGroup.section);
  for (const field of fields) {
    const { row, control, hint } = createRow(
      field.label,
      `${field.hint} 范围 ${SETTINGS_LIMIT_MIN}-${SETTINGS_LIMIT_MAX}`
    );

    const inputNode = document.createElement("input");
    inputNode.className = "settings-number";
    inputNode.type = "number";
    inputNode.name = field.key;
    inputNode.min = String(SETTINGS_LIMIT_MIN);
    inputNode.max = String(SETTINGS_LIMIT_MAX);
    inputNode.step = "1";
    inputNode.value = String(searchDisplayConfig[field.key]);

    control.appendChild(inputNode);
    hint.dataset.compact = "true";
    displayGroup.body.appendChild(row);
  }
  settingsContent.appendChild(displayGroup.section);

  const scanGroup = createGroup(
    "索引扫描",
    "配置扫描目录与结果过滤规则。开始菜单安装/卸载一般会自动更新；改扫描源后也可立即重建。"
  );
  scanGroup.section.dataset.settingsGroup = "scan";
  groupSections.set("scan", scanGroup.section);
  const {
    row: scanProgramRow,
    control: scanProgramControl,
    hint: scanProgramHint
  } = createRow(
    "\u626b\u63cf Program Files",
    "Windows 下扫描 Program Files / Program Files (x86) / LocalAppData\\\\Programs"
  );

  const scanProgramWrap = document.createElement("div");
  scanProgramWrap.className = "password-checkbox-wrap";

  const scanProgramInput = document.createElement("input");
  scanProgramInput.type = "checkbox";
  scanProgramInput.name = "scanProgramFiles";
  scanProgramInput.className = "password-checkbox";
  scanProgramInput.checked = catalogScanConfig.scanProgramFiles;

  const scanProgramText = document.createElement("span");
  scanProgramText.className = "settings-row-hint";
  scanProgramText.textContent = catalogScanConfig.scanProgramFiles
    ? "\u5df2\u5f00\u542f"
    : "\u672a\u5f00\u542f";
  scanProgramInput.addEventListener("change", () => {
    scanProgramText.textContent = scanProgramInput.checked
      ? "\u5df2\u5f00\u542f"
      : "\u672a\u5f00\u542f";
  });
  scanProgramWrap.append(scanProgramInput, scanProgramText);
  scanProgramControl.appendChild(scanProgramWrap);
  scanProgramHint.dataset.compact = "true";
  scanGroup.body.appendChild(scanProgramRow);

  const {
    row: customDirsRow,
    control: customDirsControl
  } = createRow(
    "\u81ea\u5b9a\u4e49\u626b\u63cf\u76ee\u5f55",
    `可填 ${CATALOG_SCAN_CUSTOM_DIRS_MAX} 个，一行一个目录`,
    { textarea: true }
  );

  const customDirsInput = document.createElement("textarea");
  customDirsInput.name = "customScanDirs";
  customDirsInput.className = "settings-value settings-textarea";
  customDirsInput.placeholder =
    "一行一个目录，例如：\nC:\\\\Tools\nD:\\\\Apps\n按填写顺序优先扫描";
  customDirsInput.value = catalogScanConfig.customScanDirs.join("\n");
  customDirsControl.appendChild(customDirsInput);
  scanGroup.body.appendChild(customDirsRow);

  const {
    row: excludeDirsRow,
    control: excludeDirsControl
  } = createRow(
    "排除扫描目录",
    `可填 ${CATALOG_SCAN_EXCLUDE_DIRS_MAX} 个，命中目录及其子目录会跳过`,
    { textarea: true }
  );

  const excludeDirsInput = document.createElement("textarea");
  excludeDirsInput.name = "excludeScanDirs";
  excludeDirsInput.className = "settings-value settings-textarea";
  excludeDirsInput.placeholder =
    "一行一个目录，例如：\nC:\\\\Program Files\\\\WindowsApps\nD:\\\\Games";
  excludeDirsInput.value = catalogScanConfig.excludeScanDirs.join("\n");
  excludeDirsControl.appendChild(excludeDirsInput);
  scanGroup.body.appendChild(excludeDirsRow);

  const {
    row: resultIncludeRow,
    control: resultIncludeControl
  } = createRow(
    "结果白名单目录",
    `可填 ${CATALOG_RESULT_INCLUDE_DIRS_MAX} 个；填写后仅显示命中目录内的应用/文件/文件夹`,
    { textarea: true }
  );

  const resultIncludeInput = document.createElement("textarea");
  resultIncludeInput.name = "resultIncludeDirs";
  resultIncludeInput.className = "settings-value settings-textarea";
  resultIncludeInput.placeholder = "一行一个目录，可留空表示不过滤";
  resultIncludeInput.value = catalogScanConfig.resultIncludeDirs.join("\n");
  resultIncludeControl.appendChild(resultIncludeInput);
  scanGroup.body.appendChild(resultIncludeRow);

  const {
    row: resultExcludeRow,
    control: resultExcludeControl
  } = createRow(
    "结果黑名单目录",
    `可填 ${CATALOG_RESULT_EXCLUDE_DIRS_MAX} 个；命中目录会从搜索结果中剔除`,
    { textarea: true }
  );

  const resultExcludeInput = document.createElement("textarea");
  resultExcludeInput.name = "resultExcludeDirs";
  resultExcludeInput.className = "settings-value settings-textarea";
  resultExcludeInput.placeholder = "一行一个目录，建议用来屏蔽噪声目录";
  resultExcludeInput.value = catalogScanConfig.resultExcludeDirs.join("\n");
  resultExcludeControl.appendChild(resultExcludeInput);
  scanGroup.body.appendChild(resultExcludeRow);

  const scanActions = document.createElement("div");
  scanActions.className = "settings-group-actions";

  const rebuildButton = document.createElement("button");
  rebuildButton.type = "button";
  rebuildButton.className = "settings-btn settings-btn-secondary";
  rebuildButton.textContent = "\u91cd\u5efa\u7d22\u5f15";
  rebuildButton.addEventListener("click", () => {
    void rebuildCatalogFromSettings();
  });
  scanActions.appendChild(rebuildButton);
  scanGroup.section.appendChild(scanActions);
  settingsContent.appendChild(scanGroup.section);

  const pinnedGroup = createGroup(
    "自定义置顶",
    "手动选择文件或文件夹加入首页置顶区，适合不在扫描目录内的程序与工具。"
  );
  pinnedGroup.section.dataset.settingsGroup = "pinned";
  groupSections.set("pinned", pinnedGroup.section);
  const pinnedActions = document.createElement("div");
  pinnedActions.className = "settings-inline-actions";

  const addPinnedFileButton = document.createElement("button");
  addPinnedFileButton.type = "button";
  addPinnedFileButton.className = "settings-btn settings-btn-secondary";
  addPinnedFileButton.textContent = "添加文件";
  addPinnedFileButton.addEventListener("click", () => {
    void addCustomPinnedFromPicker("file").then(() => {
      createCustomPinnedSettingsList(customPinnedList);
    });
  });

  const addPinnedFolderButton = document.createElement("button");
  addPinnedFolderButton.type = "button";
  addPinnedFolderButton.className = "settings-btn settings-btn-secondary";
  addPinnedFolderButton.textContent = "添加文件夹";
  addPinnedFolderButton.addEventListener("click", () => {
    void addCustomPinnedFromPicker("folder").then(() => {
      createCustomPinnedSettingsList(customPinnedList);
    });
  });

  pinnedActions.append(addPinnedFileButton, addPinnedFolderButton);
  pinnedGroup.body.appendChild(pinnedActions);

  const customPinnedList = document.createElement("div");
  customPinnedList.className = "custom-pinned-settings-list";
  pinnedGroup.body.appendChild(customPinnedList);
  createCustomPinnedSettingsList(customPinnedList);
  settingsContent.appendChild(pinnedGroup.section);

  const pluginGroup = createGroup(
    "插件可见性",
    "可搜索、按分类浏览；点击图标选择显示，★ 置顶常用插件。"
  );
  pluginGroup.section.dataset.settingsGroup = "plugins";
  groupSections.set("plugins", pluginGroup.section);
  const pickerRow = document.createElement("div");
  pickerRow.className = "settings-row settings-row-plugin-picker";
  const pickerControl = document.createElement("div");
  pickerControl.className = "settings-control settings-control-wide";
  pickerControl.appendChild(createVisiblePluginPicker(visiblePluginIds));
  pickerRow.appendChild(pickerControl);
  pluginGroup.body.appendChild(pickerRow);
  settingsContent.appendChild(pluginGroup.section);

  const systemGroup = createGroup(
    "系统",
    "管理应用的启动行为、自动更新与当前版本信息。"
  );
  systemGroup.section.dataset.settingsGroup = "updates";
  groupSections.set("updates", systemGroup.section);
  systemGroup.section.classList.add("settings-system-group");
  const {
    row: launchAtLoginRow,
    control: launchAtLoginControl
  } = createRow(
    "\u5f00\u673a\u542f\u52a8",
    launchAtLoginStatus.supported
      ? "Windows 登录后自动启动 LiteLauncher"
      : launchAtLoginStatus.reason ?? "当前环境暂不支持"
  );

  const launchAtLoginWrap = document.createElement("div");
  launchAtLoginWrap.className = "password-checkbox-wrap";

  const launchAtLoginInput = document.createElement("input");
  launchAtLoginInput.type = "checkbox";
  launchAtLoginInput.name = "launchAtLogin";
  launchAtLoginInput.className = "password-checkbox";
  launchAtLoginInput.checked = launchAtLoginStatus.enabled;
  launchAtLoginInput.disabled = !launchAtLoginStatus.supported;

  const launchAtLoginText = document.createElement("span");
  launchAtLoginText.className = "settings-row-hint";
  launchAtLoginText.textContent = launchAtLoginStatus.enabled
    ? "\u5df2\u542f\u7528"
    : "\u672a\u542f\u7528";
  launchAtLoginInput.addEventListener("change", () => {
    launchAtLoginText.textContent = launchAtLoginInput.checked
      ? "\u5df2\u542f\u7528"
      : "\u672a\u542f\u7528";
  });
  launchAtLoginWrap.append(launchAtLoginInput, launchAtLoginText);
  launchAtLoginControl.appendChild(launchAtLoginWrap);
  systemGroup.body.appendChild(launchAtLoginRow);

  const { row: versionRow, control: versionControl, hint: versionHint } = createRow(
    "应用版本",
    "当前运行中的桌面端版本"
  );
  const versionValue = document.createElement("div");
  versionValue.className = "settings-static-value settings-system-value-chip";
  versionValue.textContent = /^\d/.test(appVersion) ? `v${appVersion}` : appVersion;
  versionControl.appendChild(versionValue);
  versionHint.dataset.compact = "true";
  systemGroup.body.appendChild(versionRow);

  const {
    row: updaterRow,
    control: updaterControl,
    hint: updaterHint
  } = createRow(
    "自动更新",
    formatAppUpdaterActionHint(appUpdaterStatus)
  );
  updaterRow.classList.add("settings-system-update-row");
  const updaterCard = document.createElement("div");
  updaterCard.className = "settings-system-update-card";

  const updaterValue = document.createElement("div");
  updaterValue.className = "settings-static-value settings-system-value-chip";
  updaterValue.textContent = formatAppUpdaterStatusSummary(appUpdaterStatus);

  const updaterMeta = document.createElement("div");
  updaterMeta.className = "settings-system-update-meta";
  const updaterVersionText = [
    appUpdaterStatus.currentVersion
      ? `当前版本 v${appUpdaterStatus.currentVersion}`
      : "",
    appUpdaterStatus.updateVersion
      ? `目标版本 v${appUpdaterStatus.updateVersion}`
      : ""
  ]
    .filter(Boolean)
    .join(" -> ");
  updaterMeta.textContent =
    updaterVersionText || "支持 Windows NSIS 安装版与 macOS 打包版自动更新";

  const updaterDetails = document.createElement("div");
  updaterDetails.className = "settings-system-update-details";
  for (const detail of formatAppUpdaterDiagnosticDetails(appUpdaterStatus)) {
    const detailRow = document.createElement("div");
    detailRow.className = "settings-system-update-detail-row";

    const detailLabel = document.createElement("span");
    detailLabel.className = "settings-system-update-detail-label";
    detailLabel.textContent = detail.label;

    const detailValue = document.createElement("span");
    detailValue.className = "settings-system-update-detail-value";
    detailValue.textContent = detail.value;

    detailRow.append(detailLabel, detailValue);
    updaterDetails.appendChild(detailRow);
  }

  const updaterNotes = document.createElement("div");
  updaterNotes.className = "settings-system-update-notes";
  renderAppUpdaterReleaseNotes(updaterNotes, appUpdaterStatus.releaseNotes);

  const updaterActions = document.createElement("div");
  updaterActions.className = "settings-inline-actions settings-system-update-actions";

  const checkUpdatesButton = document.createElement("button");
  checkUpdatesButton.type = "button";
  checkUpdatesButton.className =
    "settings-btn settings-btn-secondary settings-system-action-btn";
  checkUpdatesButton.textContent = "检查更新";
  checkUpdatesButton.disabled =
    appUpdaterStatus.phase === "checking" ||
    appUpdaterStatus.phase === "downloading";
  checkUpdatesButton.addEventListener("click", () => {
    void checkForAppUpdatesFromSettings();
  });
  updaterActions.appendChild(checkUpdatesButton);

  if (appUpdaterStatus.downloaded && appUpdaterStatus.phase === "downloaded") {
    const installNowButton = document.createElement("button");
    installNowButton.type = "button";
    installNowButton.className =
      "settings-btn settings-btn-primary settings-system-action-btn";
    installNowButton.textContent = "立即安装并重启";
    installNowButton.addEventListener("click", () => {
      void installAppUpdateNowFromSettings();
    });
    updaterActions.appendChild(installNowButton);
  }

  updaterCard.append(
    updaterValue,
    updaterMeta,
    updaterDetails,
    updaterNotes,
    updaterActions
  );
  updaterControl.appendChild(updaterCard);
  updaterHint.dataset.compact = "true";
  systemGroup.body.appendChild(updaterRow);
  settingsContent.appendChild(systemGroup.section);

  const logGroup = createGroup(
    "错误日志",
    "显示最近 40 条运行异常记录，便于定位使用中的问题。"
  );
  logGroup.section.dataset.settingsGroup = "errors";
  groupSections.set("errors", logGroup.section);

  const errorLogContainer = document.createElement("div");
  errorLogContainer.className = "settings-error-log";

  const topmostDiagnosticEntries = getLauncherTopmostDiagnosticEntries(errorLogEntries);
  const pinDiagnosticEntries = getPinDiagnosticEntries(errorLogEntries);
  if (topmostDiagnosticEntries.length > 0 || pinDiagnosticEntries.length > 0) {
    const highlightList = document.createElement("div");
    highlightList.className = "settings-diagnostic-summary-list";

    for (const entry of topmostDiagnosticEntries) {
      const highlightCard = document.createElement("div");
      highlightCard.className = "settings-error-log-highlight-card settings-diagnostic-summary-card";

      const highlightTitle = document.createElement("div");
      highlightTitle.className = "settings-error-log-highlight-title";
      highlightTitle.textContent = formatLauncherPhaseText(
        parseErrorLogContext(entry.context).phase
      );

      const highlightMeta = document.createElement("div");
      highlightMeta.className = "settings-error-log-highlight-meta";
      highlightMeta.textContent = `${formatErrorLogDate(entry.createdAt)} · ${
        entry.level === "warn" ? "警告" : "错误"
      }`;

      const highlightBody = document.createElement("pre");
      highlightBody.className = "settings-error-log-highlight-body";
      highlightBody.textContent = formatLauncherTopmostDiagnosticSummary(entry);

      highlightCard.append(highlightTitle, highlightMeta, highlightBody);
      highlightList.appendChild(highlightCard);
    }

    for (const entry of pinDiagnosticEntries) {
      const highlightCard = document.createElement("div");
      highlightCard.className =
        "settings-error-log-highlight-card settings-diagnostic-summary-card";

      const highlightTitle = document.createElement("div");
      highlightTitle.className = "settings-error-log-highlight-title";
      highlightTitle.textContent = entry.message === "Pin request failed" ? "置顶保存失败" : "置顶请求被拒绝";

      const highlightMeta = document.createElement("div");
      highlightMeta.className = "settings-error-log-highlight-meta";
      highlightMeta.textContent = `${formatErrorLogDate(entry.createdAt)} · ${
        entry.level === "warn" ? "警告" : "错误"
      }`;

      const highlightBody = document.createElement("pre");
      highlightBody.className = "settings-error-log-highlight-body";
      highlightBody.textContent = formatPinDiagnosticSummary(entry);

      highlightCard.append(highlightTitle, highlightMeta, highlightBody);
      highlightList.appendChild(highlightCard);
    }

    errorLogContainer.appendChild(highlightList);
  }

  const errorLogActions = document.createElement("div");
  errorLogActions.className = "settings-inline-actions";

  const refreshErrorLogButton = document.createElement("button");
  refreshErrorLogButton.type = "button";
  refreshErrorLogButton.className = "settings-btn settings-btn-secondary";
  refreshErrorLogButton.textContent = "刷新日志";
  refreshErrorLogButton.addEventListener("click", () => {
    void refreshErrorLogs(40).then(() => {
      setStatus(`错误日志已刷新（${errorLogEntries.length} 条）`);
      renderList();
    });
  });

  const clearErrorLogButton = document.createElement("button");
  clearErrorLogButton.type = "button";
  clearErrorLogButton.className = "settings-btn settings-btn-secondary";
  clearErrorLogButton.textContent = "清空日志";
  clearErrorLogButton.addEventListener("click", () => {
    void clearErrorLogsFromSettings();
  });

  const copyErrorLogButton = document.createElement("button");
  copyErrorLogButton.type = "button";
  copyErrorLogButton.className = "settings-btn settings-btn-secondary";
  copyErrorLogButton.textContent = "复制日志";
  copyErrorLogButton.addEventListener("click", () => {
    void copyTextToClipboard(formatErrorLogs(errorLogEntries)).then((copied) => {
      setStatus(copied ? "错误日志已复制" : "复制错误日志失败");
    });
  });

  errorLogActions.append(refreshErrorLogButton, copyErrorLogButton, clearErrorLogButton);

  const errorLogOutput = document.createElement("textarea");
  errorLogOutput.className = "settings-value settings-textarea settings-log-output";
  errorLogOutput.rows = 9;
  errorLogOutput.readOnly = true;
  errorLogOutput.spellcheck = false;
  errorLogOutput.value = formatErrorLogs(errorLogEntries);

  const errorLogHint = document.createElement("span");
  errorLogHint.className = "settings-row-hint";
  errorLogHint.textContent = "显示最近 40 条，按时间倒序";

  errorLogContainer.append(errorLogActions, errorLogOutput, errorLogHint);
  logGroup.body.appendChild(errorLogContainer);
  settingsContent.appendChild(logGroup.section);

  const footer = document.createElement("div");
  footer.className = "settings-panel-footer";

  const footerMeta = document.createElement("div");
  footerMeta.className = "settings-footer-meta";
  footerMeta.textContent =
    "保存后立即生效；扫描源或扫描排除目录变更后建议重建索引。";

  const actions = document.createElement("div");
  actions.className = "settings-actions settings-panel-actions";

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "settings-btn settings-btn-secondary";
  resetButton.textContent = "\u6062\u590d\u9ed8\u8ba4\u5e76\u4fdd\u5b58";
  resetButton.addEventListener("click", () => {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u6062\u590d\u9ed8\u8ba4\u8bbe\u7f6e");
      return;
    }

    searchDisplayConfig = {
      recentLimit: 20,
      pinnedLimit: 20,
      pluginLimit: 20,
      searchLimit: 50
    };
    catalogScanConfig = {
      scanProgramFiles: false,
      customScanDirs: [],
      excludeScanDirs: [],
      resultIncludeDirs: [],
      resultExcludeDirs: []
    };
    visiblePluginIds = [...DEFAULT_VISIBLE_PLUGIN_IDS];
    const defaultTheme = getUiThemeApi()?.DEFAULT ?? {
      presetId: "violet" as const,
      accent: "#9d63ff",
      accentStrong: "#6f3bc2",
      accentSoft: "#c4a0ff",
      bg: "#070612",
      surface: "#0d0b1d",
      text: "#f1edff"
    };
    applyUiThemeConfig(defaultTheme);
    void Promise.all([
      launcher.setSearchDisplayConfig(searchDisplayConfig),
      launcher.setCatalogScanConfig(catalogScanConfig),
      launcher.setVisiblePluginIds(visiblePluginIds),
      launcher.setUiThemeConfig(defaultTheme)
    ])
      .then(
        ([
          savedSearchConfig,
          savedCatalogScanConfig,
          savedVisiblePluginIds,
          savedUiThemeConfig
        ]) => {
        searchDisplayConfig = savedSearchConfig;
        catalogScanConfig = savedCatalogScanConfig;
        visiblePluginIds = savedVisiblePluginIds;
        applyUiThemeConfig(savedUiThemeConfig);
        setStatus(
          `\u5df2\u6062\u590d\u9ed8\u8ba4\u8bbe\u7f6e（可见插件 ${visiblePluginIds.length} 个）`
        );
        renderList();
        }
      )
      .catch(() => {
        setStatus("\u6062\u590d\u9ed8\u8ba4\u8bbe\u7f6e\u5931\u8d25");
      });
  });

  const saveButton = document.createElement("button");
  saveButton.type = "submit";
  saveButton.className = "settings-btn settings-btn-primary";
  saveButton.textContent = "\u4fdd\u5b58";

  actions.append(resetButton, saveButton);
  footer.append(footerMeta, actions);
  form.append(settingsBody, footer);

  panel.append(header, form);
  if (wrapInListItem) {
    panelItem.appendChild(panel);
    target.appendChild(panelItem);
  } else {
    target.appendChild(panel);
  }

  showSettingsTab(initialTab);
  settingsFocusHint = undefined;
}

function dismissSettingsOverlay(): void {
  commandCenterUi.closeSettingsOverlay();
  settingsFocusHint = undefined;
  syncAutoHideSuspension();
}

async function loadSettingsPanelData(): Promise<boolean> {
  const launcher = getLauncherApi();
  if (!launcher) {
    return false;
  }

  try {
    const [
      nextSearchConfig,
      nextUiThemeConfig,
      nextCatalogScanConfig,
      nextVisiblePluginIds,
      nextAllPluginItems,
      nextRequiredVisiblePluginIds,
      nextLaunchAtLoginStatus,
      nextAppUpdaterStatus,
      nextAppVersion,
      nextErrorLogs
    ] = await Promise.all([
      launcher.getSearchDisplayConfig(),
      launcher.getUiThemeConfig().catch(() => uiThemeConfig),
      launcher.getCatalogScanConfig(),
      launcher.getVisiblePluginIds(),
      launcher.getAllPluginItems(),
      launcher.getRequiredVisiblePluginIds(),
      launcher.getLaunchAtLoginStatus(),
      launcher.getAppUpdaterStatus().catch(() => appUpdaterStatus),
      launcher.getAppVersion().catch(() => ""),
      launcher.getErrorLogs(40).catch(() => [])
    ]);

    searchDisplayConfig = nextSearchConfig;
    applyUiThemeConfig(nextUiThemeConfig);
    catalogScanConfig = nextCatalogScanConfig;
    visiblePluginIds = Array.isArray(nextVisiblePluginIds)
      ? parseVisiblePluginIdsText(nextVisiblePluginIds.join("\n"))
      : [];
    allPluginCatalogItems = Array.isArray(nextAllPluginItems)
      ? nextAllPluginItems
      : [];
    requiredVisiblePluginIdSet = new Set(
      Array.isArray(nextRequiredVisiblePluginIds)
        ? nextRequiredVisiblePluginIds.map((id) => id.trim().toLowerCase())
        : []
    );
    launchAtLoginStatus = nextLaunchAtLoginStatus;
    appUpdaterStatus = nextAppUpdaterStatus;
    errorLogEntries = Array.isArray(nextErrorLogs) ? nextErrorLogs : [];
    appVersion =
      typeof nextAppVersion === "string" && nextAppVersion.trim()
        ? nextAppVersion.trim()
        : "未知版本";
    return true;
  } catch {
    return false;
  }
}

async function openSettingsPanel(): Promise<void> {
  if (commandCenterUi.isSettingsOverlayOpen()) {
    return;
  }
  setAutoHideSuspended(true);
  const loaded = await loadSettingsPanelData();
  if (!loaded) {
    setStatus(
      "桥接层未加载，请先彻底退出 LiteLauncher 后再执行 pnpm start"
    );
    syncAutoHideSuspension();
    return;
  }
  commandCenterUi.openSettingsOverlay((container) => {
    renderSettingsPanel(container, { listItemWrap: false });
  });
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) {
    return false;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Continue with legacy fallback.
  }

  try {
    const holder = document.createElement("textarea");
    holder.value = text;
    holder.setAttribute("readonly", "true");
    holder.style.position = "fixed";
    holder.style.opacity = "0";
    holder.style.pointerEvents = "none";
    holder.style.left = "-9999px";
    holder.style.top = "-9999px";
    document.body.appendChild(holder);
    holder.focus();
    holder.select();
    const copied = document.execCommand("copy");
    holder.remove();
    return copied;
  } catch {
    return false;
  }
}

function renderList(): void {
  closeSearchContextMenu();
  clearList();

  if (mode === "settings") {
    renderSettingsPanel();
    return;
  }

  if (mode === "password") {
    panelImplsSafe.renderPasswordPanel();
    return;
  }

  if (mode === "cashflow") {
    panelImplsSafe.renderCashflowPanel();
    return;
  }

  if (mode === "plugin") {
    panelImplsSafe.renderActivePluginPanel();
    return;
  }

  if (entries.length === 0 && mode !== "search") {
    const empty = document.createElement("li");
    empty.className = "empty-item";
    empty.textContent = mode === "clip" ? "\u672a\u627e\u5230\u526a\u8d34\u677f\u5185\u5bb9" : "\u6ca1\u6709\u5339\u914d\u7ed3\u679c";
    list.appendChild(empty);
    return;
  }

  if (mode === "search") {
    renderSearchSections();
    return;
  }

  renderDetailList();
}

function canUpdateSelectionHighlightInPlace(): boolean {
  if (entries.length === 0) {
    return false;
  }

  if (
    mode === "settings" ||
    mode === "password" ||
    mode === "cashflow" ||
    mode === "plugin"
  ) {
    return false;
  }

  if (isResultsLoading) {
    return false;
  }

  return (
    document.querySelector('.result-item[data-index="0"]') !== null ||
    document.querySelector('.command-result[data-index="0"]') !== null
  );
}

function updateSelectionHighlight(previousIndex: number, nextIndex: number): void {
  if (previousIndex === nextIndex) {
    return;
  }

  const previousItem = document.querySelector<HTMLElement>(
    `.result-item[data-index="${previousIndex}"], .command-result[data-index="${previousIndex}"]`
  );
  const nextItem = document.querySelector<HTMLElement>(
    `.result-item[data-index="${nextIndex}"], .command-result[data-index="${nextIndex}"]`
  );

  previousItem?.classList.remove("active");
  nextItem?.classList.add("active");
  nextItem?.scrollIntoView({ block: "nearest" });
}

function moveSelection(delta: number): void {
  if (entries.length === 0) {
    return;
  }

  const previousIndex = selectedIndex;
  selectedIndex = (selectedIndex + delta + entries.length) % entries.length;

  if (canUpdateSelectionHighlightInPlace()) {
    updateSelectionHighlight(previousIndex, selectedIndex);
    return;
  }

  renderList();
}

async function refreshEntries(query: string): Promise<void> {
  const token = ++latestSearchToken;
  const shouldShowLoading =
    mode === "clip" || (mode === "search" && Boolean(query.trim()));
  if (shouldShowLoading) {
    const loadingMessage = getLoadingMessage(mode, query);
    scheduleResultsLoading(loadingMessage);
    setStatus(loadingMessage);
  } else {
    setResultsLoading(false);
  }

  try {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus(
        "\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u8bf7\u5148\u5f7b\u5e95\u9000\u51fa LiteLauncher \u540e\u518d\u6267\u884c pnpm start"
      );
      return;
    }

    if (mode === "settings") {
      const loaded = await loadSettingsPanelData();
      if (!loaded) {
        setStatus(
          "\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u8bf7\u5148\u5f7b\u5e95\u9000\u51fa LiteLauncher \u540e\u518d\u6267\u884c pnpm start"
        );
        return;
      }
      if (token !== latestSearchToken) {
        return;
      }
      resetSearchSections();
      selectedIndex = 0;
      renderList();
      setStatus("\u8bbe\u7f6e\u5df2\u52a0\u8f7d");
      return;
    }

    if (mode === "password") {
      if (token !== latestSearchToken) {
        return;
      }
      resetSearchSections();
      selectedIndex = 0;
      renderList();
      setStatus("\u8bf7\u914d\u7f6e\u5bc6\u7801\u53c2\u6570\u540e\u751f\u6210");
      return;
    }

    if (mode === "cashflow") {
      const ok = await panelImplsSafe.refreshCashflowPanel();
      if (token !== latestSearchToken) {
        return;
      }
      resetSearchSections();
      selectedIndex = 0;
      renderList();
      if (!ok) {
        setStatus("\u73b0\u91d1\u6d41\u6e38\u620f\u52a0\u8f7d\u5931\u8d25");
      }
      return;
    }

    if (mode === "plugin") {
      if (token !== latestSearchToken) {
        return;
      }
      resetSearchSections();
      selectedIndex = 0;
      renderList();
      const activePluginTitle = panelImplsSafe.getActivePluginPanelTitle();
      setStatus(activePluginTitle ? `已打开插件面板：${activePluginTitle}` : "已打开插件面板");
      return;
    }

    if (mode === "search") {
      const parsedQuery = parseSearchQuery(query);
      const trimmed = query.trim();

      if (trimmed) {
        const pageSize = Math.max(1, searchDisplayConfig.searchLimit);
        const fetchLimit = Math.min(
          SEARCH_PAGE_FETCH_MAX,
          Math.max(pageSize, pageSize * SEARCH_PAGE_FETCH_MULTIPLIER)
        );
        const queryKey = `${parsedQuery.scope}:${parsedQuery.query.toLowerCase()}`;
        if (queryKey !== pagedSearchQueryKey) {
          pagedSearchQueryKey = queryKey;
          searchResultPage = 0;
          cachedSearchLaunchItems = [];
        }

        let launchItems = cachedSearchLaunchItems;
        if (launchItems.length === 0) {
          // search() already includes dynamic PATH / alias / WindowsApps hits.
          launchItems = await launcher.search(parsedQuery.query, {
            limit: fetchLimit,
            scope: parsedQuery.scope
          });
          if (token !== latestSearchToken) {
            return;
          }
          cachedSearchLaunchItems = launchItems;
        }

        const totalSearchCount = launchItems.length;
        const searchPageCount = Math.max(
          1,
          Math.ceil(Math.max(1, totalSearchCount) / pageSize)
        );
        if (searchResultPage >= searchPageCount) {
          searchResultPage = searchPageCount - 1;
        }

        const searchStart = searchResultPage * pageSize;
        const pagedSearchItems = launchItems.slice(searchStart, searchStart + pageSize);

        resetSearchSections();
        addSearchSection(
          "search",
          parsedQuery.explicitScope ? `${parsedQuery.scopeLabel}结果` : "\u641c\u7d22\u7ed3\u679c",
          pagedSearchItems,
          pageSize,
          parsedQuery.explicitScope
            ? `没有匹配的${parsedQuery.scopeLabel}结果`
            : "\u6ca1\u6709\u5339\u914d\u7ed3\u679c",
          {
            totalCount: totalSearchCount,
            page: searchResultPage,
            pageCount: searchPageCount
          }
        );
        selectedIndex = entries.length ? 0 : 0;
        renderList();
        const shownStart = totalSearchCount === 0 ? 0 : searchStart + 1;
        const shownEnd = totalSearchCount === 0 ? 0 : searchStart + pagedSearchItems.length;
        const totalSearchText =
          totalSearchCount >= fetchLimit ? `${totalSearchCount}+` : `${totalSearchCount}`;
        if (parsedQuery.explicitScope) {
          setStatus(
            `${parsedQuery.scopeLabel}搜索 ${shownStart}-${shownEnd}/${totalSearchText}`
          );
        } else {
          setStatus(`\u641c\u7d22 ${shownStart}-${shownEnd}/${totalSearchText}`);
        }
        return;
      }

      pagedSearchQueryKey = "";
      searchResultPage = 0;
      cachedSearchLaunchItems = [];

      if (tryRestoreCachedHomeSections()) {
        return;
      }

      const homeSections = await launcher.getHomeSections();
      void ensurePluginCatalogLoaded();
      if (token !== latestSearchToken) {
        return;
      }

      const recentItems = homeSections.recent;
      const pinnedItems = homeSections.pinned;
      const pluginItems = homeSections.plugin;

      const recentDisplayLimit = getRecentHomeDisplayLimit(recentItems.length);
      const pinnedDisplayLimit = getAdaptiveSectionDisplayLimit(pinnedItems);
      const pluginPageSize = getAdaptiveSectionDisplayLimit(pluginItems);
      const pluginPageCount = 1;
      pluginResultPage = 0;

      resetSearchSections();
      addSearchSection(
        "recent",
        "\u6700\u8fd1\u8bbf\u95ee",
        recentItems,
        recentDisplayLimit,
        "\u6682\u65e0\u6700\u8fd1\u8bbf\u95ee"
      );
      addSearchSection(
        "pinned",
        "\u7f6e\u9876",
        pinnedItems,
        pinnedDisplayLimit,
        "\u6682\u65e0\u7f6e\u9876\u9879\uff08\u53ef\u70b9\u300c\u6dfb\u52a0\u6587\u4ef6/\u6587\u4ef6\u5939\u300d\u6216\u5728\u641c\u7d22\u7ed3\u679c\u53f3\u952e\u7f6e\u9876\uff09"
      );
      addSearchSection(
        "plugin",
        "\u63d2\u4ef6",
        pluginItems,
        pluginPageSize,
        "\u6682\u65e0\u63d2\u4ef6",
        {
          totalCount: pluginItems.length,
          page: pluginResultPage,
          pageCount: pluginPageCount
        }
      );
      selectedIndex = entries.length ? 0 : 0;
      renderList();
      const homeStatus = `\u6700\u8fd1 ${recentItems.length} \u00b7 \u7f6e\u9876 ${pinnedItems.length} \u00b7 \u63d2\u4ef6 ${pluginItems.length}`;
      setStatus(homeStatus);
      cacheHomeSectionsSnapshot(homeStatus);
      return;
    }

    const clipItems = await launcher.getClipItems(query);
    if (token !== latestSearchToken) {
      return;
    }

    entries = clipItems.map((item) => ({ kind: "clip", item }));
    searchSections = [];
    selectedIndex = entries.length ? 0 : 0;
    renderList();
    setStatus(`\u526a\u8d34\u677f\u6761\u76ee\uff1a${entries.length}`);
  } catch {
    setStatus("\u52a0\u8f7d\u6570\u636e\u5931\u8d25");
  } finally {
    if (token === latestSearchToken) {
      setResultsLoading(false);
    }
  }
}

async function executeSelected(index = selectedIndex): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u6267\u884c");
    return;
  }

  if (index < 0 || index >= entries.length) {
    return;
  }

  selectedIndex = index;
  const selected = entries[index];
  if (!selected) {
    return;
  }

  if (selected.kind === "launch") {
    const modeBeforeExecute = mode;
    const queryBeforeExecute = currentQuery;
    const result = await launcher.execute(selected.item);
    if (!result.ok) {
      setStatus(result.message ?? "\u6267\u884c\u5931\u8d25");
      return;
    }

    setStatus(result.message ?? "执行完成");
    if (selected.kind === "launch") {
      commandCenterUi.showToast(`已打开：${selected.item.title}`);
    }
    markHomeSectionsDirty();
    if (!result.keepOpen) {
      return;
    }
    if (isPanelOpeningLaunchItem(selected.item)) {
      return;
    }
    if (mode !== modeBeforeExecute || currentQuery !== queryBeforeExecute) {
      return;
    }
    await refreshEntries(currentQuery);
    return;
  }

  const copied = await launcher.copyClipItem(selected.item.id);
  if (!copied) {
    setStatus("\u590d\u5236\u526a\u8d34\u677f\u6761\u76ee\u5931\u8d25");
    return;
  }

  setStatus("\u5df2\u590d\u5236\u526a\u8d34\u677f\u6761\u76ee");
}

async function deleteSelectedClipItem(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u5220\u9664");
    return;
  }

  const selected = entries[selectedIndex];
  if (!selected || selected.kind !== "clip") {
    return;
  }

  const deleted = await launcher.deleteClipItem(selected.item.id);
  if (!deleted) {
    setStatus("\u5220\u9664\u526a\u8d34\u677f\u6761\u76ee\u5931\u8d25");
    return;
  }

  setStatus("\u5df2\u5220\u9664\u526a\u8d34\u677f\u6761\u76ee");
  await refreshEntries(currentQuery);
}

async function clearAllClipItems(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u6e05\u7a7a");
    return;
  }

  const removed = await launcher.clearClipItems();
  setStatus(`\u5df2\u6e05\u7a7a ${removed} \u6761\u526a\u8d34\u677f\u8bb0\u5f55`);
  await refreshEntries(currentQuery);
}

function backToSearch(): void {
  clearSearchInputDebounceTimer();
  if (commandCenterUi.isSettingsOverlayOpen()) {
    dismissSettingsOverlay();
    return;
  }
  if (mode !== "search") {
    resetLauncherToHomeState();
    return;
  }

  if (UI_TUNING_KEEP_OPEN) {
    setStatus("调 UI 中：主页保持打开（Esc / 失焦不关闭）");
    return;
  }

  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u9690\u85cf\u7a97\u53e3");
    return;
  }
  // Paint + initialize home first so the frozen hide frame is never search/plugin.
  // Full home data refresh still runs via clearInput after hide.
  resetLauncherToHomeState({ refreshHome: false });
  void launcher.hide();
}

function handleLauncherOpenPanel(panelPayload: unknown): void {
  const genericPluginOpen = panelImplsSafe.handleGenericPluginPanelPayload(panelPayload);
  if (genericPluginOpen) {
    pushDebugLog(`renderer openPanel=plugin:${genericPluginOpen}`);
    return;
  }

  const standalonePanelOpen = panelImplsSafe.handleStandalonePanelPayload(panelPayload);
  if (standalonePanelOpen) {
    pushDebugLog(`renderer openPanel=${standalonePanelOpen}`);
    return;
  }

  const panel = typeof panelPayload === "string" ? panelPayload.trim() : "";
  if (panel === "clip") {
    setMode("clip");
    pushDebugLog("renderer openPanel=clip");
    void refreshEntries("");
    return;
  }

  if (panel === "settings") {
    pushDebugLog("renderer openPanel=settings");
    openSettingsPanel();
    return;
  }
}

function handlePanelModeKeydown(
  event: KeyboardEvent,
  options: {
    isEnter: boolean;
    isEscape: boolean;
    isMultilineEditorTarget: boolean;
  }
): boolean {
  const { isEnter, isEscape, isMultilineEditorTarget } = options;

  if (mode === "password") {
    if (isEscape) {
      event.preventDefault();
      pushDebugLog("renderer action: password -> backToSearch");
      backToSearch();
      return true;
    }

    if (isEnter) {
      event.preventDefault();
      const form = list.querySelector("form.password-form");
      if (form instanceof HTMLFormElement) {
        pushDebugLog("renderer action: password generate");
        panelImplsSafe.handlePasswordPanelEnter();
      }
      return true;
    }

    return true;
  }

  if (mode === "cashflow") {
    if (isEscape) {
      event.preventDefault();
      pushDebugLog("renderer action: cashflow -> backToSearch");
      backToSearch();
      return true;
    }

    if (isEnter) {
      event.preventDefault();
      pushDebugLog("renderer action: cashflow nextTurn");
      panelImplsSafe.handleCashflowPanelEnter();
      return true;
    }

    return true;
  }

  if (mode === "plugin") {
    if (isEscape) {
      event.preventDefault();
      if (panelImplsSafe.handleActivePluginPanelEscape()) {
        return true;
      }
      pushDebugLog("renderer action: plugin -> backToSearch");
      backToSearch();
      return true;
    }

    if (isEnter) {
      if (isMultilineEditorTarget && !event.ctrlKey && !event.metaKey) {
        return true;
      }
      event.preventDefault();
      panelImplsSafe.handleActivePluginPanelEnter();
      return true;
    }

    return true;
  }

  return false;
}

function handleKeydown(event: KeyboardEvent): void {
  if (handledEvents.has(event)) {
    return;
  }
  handledEvents.add(event);

  const target = event.target as HTMLElement | null;
  const targetName = target?.tagName?.toLowerCase() ?? "unknown";
  const key = event.key;
  const code = event.code;
  const isArrowLeft = key === "ArrowLeft" || key === "Left";
  const isArrowRight = key === "ArrowRight" || key === "Right";
  const isArrowDown = key === "ArrowDown" || key === "Down";
  const isArrowUp = key === "ArrowUp" || key === "Up";
  const isPageDown = key === "PageDown";
  const isPageUp = key === "PageUp";
  const isEnter =
    key === "Enter" ||
    key === "Return" ||
    code === "Enter" ||
    code === "NumpadEnter";
  const isEscape = key === "Escape" || key === "Esc";
  const isDelete = key === "Delete" || key === "Del";
  const isMultilineEditorTarget =
    target instanceof HTMLTextAreaElement || target?.isContentEditable === true;

  if (target === input) {
    pendingSearchInputFromKeyboard = isKeyboardDrivenSearchInputKey(event);
  }

  pushDebugLog(
    `renderer keydown ${formatMods(
      event.ctrlKey,
      event.altKey,
      event.shiftKey,
      event.metaKey
    )}${key} code=${code || "-"} target=${targetName}`
  );

  if (isEscape && activeSearchContextMenu) {
    event.preventDefault();
    closeSearchContextMenu();
    return;
  }

  if (mode === "settings" && !isEscape) {
    return;
  }

  if (commandCenterUi.isSettingsOverlayOpen() && !isEscape) {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest(".cc-settings-overlay-dialog")) {
      return;
    }
  }

  const handledPanelMode = handlePanelModeKeydown(event, {
    isEnter,
    isEscape,
    isMultilineEditorTarget
  });
  if (handledPanelMode) {
    return;
  }

  if (mode === "search" && currentQuery.trim()) {
    if (isPageDown) {
      event.preventDefault();
      pushDebugLog("renderer action: search page +1");
      changeSearchResultPage(1);
      return;
    }
    if (isPageUp) {
      event.preventDefault();
      pushDebugLog("renderer action: search page -1");
      changeSearchResultPage(-1);
      return;
    }
  }

  if (isArrowLeft) {
    event.preventDefault();
    pushDebugLog("renderer action: moveSelection(-1)");
    moveSelection(-1);
    return;
  }

  if (isArrowRight) {
    event.preventDefault();
    pushDebugLog("renderer action: moveSelection(+1)");
    moveSelection(1);
    return;
  }

  if (isArrowDown) {
    event.preventDefault();
    const step = mode === "search" ? getVisibleGridColumnCount() : 1;
    pushDebugLog(`renderer action: moveSelection(+${step})`);
    moveSelection(step);
    return;
  }

  if (isArrowUp) {
    event.preventDefault();
    const step = mode === "search" ? getVisibleGridColumnCount() : 1;
    pushDebugLog(`renderer action: moveSelection(-${step})`);
    moveSelection(-step);
    return;
  }

  if (isEnter) {
    event.preventDefault();
    if (mode === "search" && hasPendingSearchInputDebounce()) {
      pushDebugLog("renderer action: flush search debounce");
      flushSearchInputDebounce();
      return;
    }
    if (!entries[selectedIndex]) {
      setStatus("\u5f53\u524d\u6ca1\u6709\u53ef\u6267\u884c\u9879");
      pushDebugLog("renderer action: executeSelected skipped (no entry)");
      return;
    }
    pushDebugLog("renderer action: executeSelected()");
    void executeSelected();
    return;
  }

  if (mode === "clip" && isDelete && event.ctrlKey && event.shiftKey) {
    event.preventDefault();
    pushDebugLog("renderer action: clearAllClipItems()");
    void clearAllClipItems();
    return;
  }

  if (mode === "clip" && isDelete) {
    event.preventDefault();
    pushDebugLog("renderer action: deleteSelectedClipItem()");
    void deleteSelectedClipItem();
    return;
  }

  if (isEscape) {
    event.preventDefault();
    pushDebugLog("renderer action: escape pressed");
    if (pinnedManageMode) {
      setPinnedManageMode(false);
      return;
    }
    if (commandCenterUi.isSettingsOverlayOpen()) {
      dismissSettingsOverlay();
      return;
    }
    if (mode === "settings") {
      pushDebugLog("renderer action: settings -> backToSearch");
      backToSearch();
      return;
    }
    if (input.value.trim()) {
      clearSearchInputDebounceTimer();
      input.value = "";
      currentQuery = "";
      pushDebugLog("renderer action: clear query");
      // Sync chrome immediately; do not wait for home refresh.
      commandCenterUi.updateCommandCenterQueryState(false);
      commandCenterUi.setCommandSearchStatus(null);
      latestSearchToken += 1;
      setResultsLoading(false);
      if (!tryRestoreCachedHomeSections()) {
        void refreshEntries("");
      }
      return;
    }
    pushDebugLog("renderer action: backToSearch/hide");
    backToSearch();
  }
}

function registerEvents(): void {
  settingsShortcutButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    pushDebugLog("renderer action: toolbar settings");
    openSettingsPanel();
  });

  input.addEventListener("input", () => {
    scheduleSearchRefreshFromInput(input.value, {
      fromKeyboard: pendingSearchInputFromKeyboard
    });
    pendingSearchInputFromKeyboard = false;
  });

  input.addEventListener("keydown", handleKeydown, true);

  window.addEventListener(
    "keydown",
    (event) => {
      if (event.target === input) {
        return;
      }
      handleKeydown(event);
    },
    true
  );

  document.addEventListener("keydown", handleKeydown, true);
  document.addEventListener("mousedown", () => {
    closeSearchContextMenu();
  });
  list.addEventListener("scroll", () => {
    closeSearchContextMenu();
  });
  window.addEventListener("blur", () => {
    closeSearchContextMenu();
  });
  window.addEventListener("resize", () => {
    scheduleAdaptiveSectionGridRefresh();
  });

  const launcher = getLauncherApi();
  if (launcher?.onFocusInput) {
    launcher.onFocusInput(() => {
      if (document.activeElement === input) {
        return;
      }
      focusInput(true);
      pushDebugLog("renderer onFocusInput received");
    });
  }

  if (launcher?.onClearInput) {
    launcher.onClearInput(() => {
      pushDebugLog("renderer clearInput received");
      // Always restore home on hide (search / plugin / settings), sync first
      // so the next show never paints the previous query chrome.
      resetLauncherToHomeState();
    });
  }

  if (launcher?.onPrepareHide) {
    launcher.onPrepareHide((requestId) => {
      pushDebugLog("renderer prepareHide received");
      prepareLauncherHide();
      ackPrepareHideAfterPaint(requestId);
    });
  }

  if (launcher?.onOpenPanel) {
    launcher.onOpenPanel(handleLauncherOpenPanel);
  }

  window.addEventListener("focus", () => {
    pushDebugLog("renderer window focus");
    syncWindowSizePreset(mode, false);
    if (pluginNativeInteractionLocked) {
      schedulePluginNativeInteractionRelease();
    }
    focusInput(false);
  });

  if (launcher?.onDebugKey) {
    launcher.onDebugKey((event) => {
      debugMode = true;
      setStatus("\u8c03\u8bd5\u6a21\u5f0f\u5df2\u542f\u7528\uff0c\u53f3\u4e0b\u89d2\u663e\u793a\u6309\u952e\u65e5\u5fd7");
      pushDebugLog(formatDebugEvent(event));
    });
  }
}

function bootstrap(): void {
  markRendererBootstrapped();
  initDebugPanel();
  const launcher = getLauncherApi();
  debugMode = launcher?.isDebugKeysEnabled?.() ?? false;
  if (debugMode) {
    pushDebugLog("renderer debug enabled (from preload)");
  }

  window.addEventListener("error", (event) => {
    debugMode = true;
    pushDebugLog(`renderer error: ${event.message}`);
    setStatus(`\u6e32\u67d3\u5c42\u9519\u8bef\uff1a${event.message}`);
    void reportErrorLog({
      scope: "renderer",
      level: "error",
      message: event.message || "渲染层错误",
      context: `${event.filename}:${event.lineno}:${event.colno}`,
      detail: formatErrorDetail(event.error)
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    debugMode = true;
    const detail = formatErrorDetail(event.reason);
    pushDebugLog(`renderer unhandledrejection: ${detail ?? "unknown"}`);
    setStatus("\u6e32\u67d3\u5c42 Promise \u5f02\u5e38");
    void reportErrorLog({
      scope: "renderer",
      level: "error",
      message: "渲染层未处理 Promise 异常",
      detail
    });
  });

  setMode("search");
  commandCenterUi.initCommandCenterUi({
    onSidebarAction: (action) => {
      void handleSidebarAction(action);
    },
    onTogglePinnedManage: () => {
      togglePinnedManageMode();
    }
  });
  if (commandCenterIcons) {
    const headingMap: Record<string, string> = {
      ".cc-heading-icon--clock": "clock",
      ".cc-heading-icon--flash": "flash",
      ".cc-heading-icon--arrow": "arrow",
      ".cc-heading-icon--settings": "settings",
      ".cc-heading-icon--pin": "pin",
      ".cc-heading-icon--plugin": "plugin"
    };
    for (const [selector, iconName] of Object.entries(headingMap)) {
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        element.innerHTML = commandCenterIcons.icons[iconName] ?? "";
      });
    }
  }
  registerEvents();
  syncAutoHideSuspension();
  setStatus(
    UI_TUNING_KEEP_OPEN
      ? "调 UI 中：主页保持打开（Esc / 失焦不关闭）"
      : "\u53ef\u4ee5\u5f00\u59cb\u641c\u7d22"
  );
  focusInput(false);
  if (launcher?.getUiThemeConfig) {
    void launcher
      .getUiThemeConfig()
      .then((theme) => {
        applyUiThemeConfig(theme);
      })
      .catch(() => {
        applyUiThemeConfig(uiThemeConfig);
      });
  } else {
    applyUiThemeConfig(uiThemeConfig);
  }
  void refreshEntries("");
}

bootstrap();
