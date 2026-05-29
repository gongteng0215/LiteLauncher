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
  setItemPinned(itemId: string, pinned: boolean): Promise<PinToggleResult>;
  search(query: string, options?: SearchRequestOptions): Promise<LaunchItem[]>;
  resolveCommandQuery(query: string): Promise<LaunchItem[]>;
  execute(item: LaunchItem): Promise<ExecuteResult>;
  setWindowSizePreset(preset: "compact" | "cashflow"): Promise<boolean>;
  setAutoHideSuspended(suspended: boolean): Promise<boolean>;
  pickFilePath(): Promise<string | null>;
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
const resultsElement = document.querySelector(".results") as HTMLElement | null;
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
let mode: PanelMode = "search";
let debugMode = false;
let isResultsLoading = false;
let resultsLoadingTimer: number | null = null;
let searchInputDebounceTimer: number | null = null;
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
const SEARCH_PAGE_FETCH_MULTIPLIER = 5;
const SEARCH_PAGE_FETCH_MAX = 500;
const SEARCH_INPUT_DEBOUNCE_MS = 1200;
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
let catalogScanConfig: CatalogScanConfig = {
  scanProgramFiles: false,
  customScanDirs: [],
  excludeScanDirs: [],
  resultIncludeDirs: [],
  resultExcludeDirs: []
};
let visiblePluginIds: string[] = [...DEFAULT_VISIBLE_PLUGIN_IDS];
let launchAtLoginStatus: LaunchAtLoginStatus = {
  enabled: false,
  supported: false,
  reason: "状态未知"
};
let appVersion = "未知版本";
let errorLogEntries: AppErrorLogEntry[] = [];
let activeSearchContextMenu: HTMLDivElement | null = null;
let pluginNativeInteractionLocked = false;
let pluginNativeInteractionReleaseTimer: number | null = null;

function getLauncherApi(): LauncherApi | null {
  return ((window as Window & { launcher?: LauncherApi }).launcher ??
    null) as LauncherApi | null;
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

function releasePluginNativeInteractionLock(): void {
  clearPluginNativeInteractionReleaseTimer();
  if (!pluginNativeInteractionLocked) {
    return;
  }

  pluginNativeInteractionLocked = false;
  setAutoHideSuspended(false);
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
    setAutoHideSuspended(true);
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

function scheduleSearchRefreshFromInput(nextQuery: string): void {
  closeSearchContextMenu();
  currentQuery = nextQuery;

  const shouldDebounce = mode === "search" && Boolean(nextQuery.trim());
  if (!shouldDebounce) {
    clearSearchInputDebounceTimer();
    void refreshEntries(currentQuery);
    return;
  }

  clearSearchInputDebounceTimer();
  setResultsLoading(true, "输入中，暂停检索...");
  setStatus("输入中，暂停检索...");
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
    case "persist-failed":
      return "\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5";
    default:
      return "\u672a\u77e5\u539f\u56e0";
  }
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
  syncWindowSizePreset(nextMode);
  applyModeClass(nextMode);
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
    input.placeholder =
      "搜索应用，支持 app:/cmd:/web:/plugin: 范围前缀";
    setHint(
      "输入停顿约 1 秒后检索 - Enter 执行 - Esc 清空/隐藏 - 方向键移动 - PageUp/PageDown 翻页 - 支持 app:/cmd:/web:/plugin:"
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

function clearList(): void {
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

async function togglePinned(index: number): Promise<void> {
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
    return;
  }

  const item = selected.item;
  const nextPinned = !Boolean(item.pinned);
  const pinResult = await launcher.setItemPinned(item.id, nextPinned);
  if (!pinResult.ok) {
    setStatus(formatPinnedToggleStatus(item.title, pinResult));
    return;
  }

  updatePinnedState(item.id, pinResult.pinned);
  setStatus(formatPinnedToggleStatus(item.title, pinResult));
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
  pinButton.textContent = entry.item.pinned ? "取消置顶" : "置顶";
  pinButton.addEventListener("click", () => {
    closeSearchContextMenu();
    void togglePinned(index);
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
    selectedIndex = index;
  });

  element.addEventListener("click", (event) => {
    event.stopPropagation();
    selectedIndex = index;
    renderList();
    void executeSelected(index);
  });

  element.addEventListener("contextmenu", (event) => {
    if (mode !== "search" || entry.kind !== "launch") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    selectedIndex = index;
    renderList();
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
  void refreshEntries(currentQuery);
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

function createSearchTile(entry: ResultEntry, index: number): HTMLLIElement {
  const tile = document.createElement("li");
  tile.className = "result-item result-tile";
  if (index === selectedIndex) {
    tile.classList.add("active");
  }
  if (entry.kind === "launch" && entry.item.pinned) {
    tile.classList.add("is-pinned");
  }
  tile.dataset.index = String(index);

  const icon = createResultIcon(entry);
  const title = document.createElement("div");
  title.className = "tile-title";
  title.textContent =
    entry.kind === "launch" ? entry.item.title : clipTitle(entry.item.content);

  tile.title = title.textContent;
  tile.append(icon, title);

  if (entry.kind === "launch" && entry.item.pinned) {
    const pinBadge = document.createElement("span");
    pinBadge.className = "tile-pin";
    pinBadge.title = "\u7f6e\u9876";
    pinBadge.setAttribute("aria-label", "\u7f6e\u9876");
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
  list
    .querySelectorAll<HTMLUListElement>(".section-grid")
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

function renderSearchSections(): void {
  list.classList.add("search-sections");

  for (const section of searchSections) {
    const block = document.createElement("li");
    block.className = "section-block";
    block.dataset.sectionId = section.id;

    const heading = document.createElement("div");
    heading.className = "section-title-row";

    const title = document.createElement("div");
    title.className = "section-title";
    if ((section.id === "search" || section.id === "plugin") && section.pageCount > 1) {
      const start =
        section.totalCount === 0 ? 0 : section.page * section.displayLimit + 1;
      const end =
        section.totalCount === 0
          ? 0
          : Math.min(
              section.totalCount,
              section.page * section.displayLimit + section.indexes.length
            );
      title.textContent = `${section.title} (${start}-${end}/${section.totalCount})`;
    } else {
      const total = section.totalCount > 0 ? section.totalCount : section.displayLimit;
      title.textContent = `${section.title} (${section.indexes.length}/${total})`;
    }
    heading.appendChild(title);

    if ((section.id === "search" || section.id === "plugin") && section.pageCount > 1) {
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
      heading.appendChild(pager);
    }

    block.appendChild(heading);

    if (section.indexes.length === 0) {
      const empty = document.createElement("div");
      empty.className = "section-empty";
      empty.textContent = section.emptyText;
      block.appendChild(empty);
      list.appendChild(block);
      continue;
    }

    const grid = document.createElement("ul");
    grid.className = "section-grid";
    grid.dataset.sectionId = section.id;

    for (const index of section.indexes) {
      const entry = entries[index];
      if (!entry) {
        continue;
      }
      grid.appendChild(createSearchTile(entry, index));
    }

    block.appendChild(grid);
    list.appendChild(block);
  }

  refreshAdaptiveSectionGrids();
}

function getVisibleGridColumnCount(selected = selectedIndex): number {
  if (mode !== "search") {
    return 1;
  }

  const tile = list.querySelector<HTMLElement>(
    `.result-item.result-tile[data-index="${selected}"]`
  );
  if (!tile) {
    return 1;
  }

  const grid = tile.closest(".section-grid");
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
  const visiblePluginIdsNode = form.elements.namedItem("visiblePluginIds");
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
  const nextVisiblePluginIds =
    visiblePluginIdsNode instanceof HTMLTextAreaElement
      ? parseVisiblePluginIdsText(visiblePluginIdsNode.value)
      : visiblePluginIds;

  const launchAtLoginNode = form.elements.namedItem("launchAtLogin");
  const nextLaunchAtLoginEnabled =
    launchAtLoginNode instanceof HTMLInputElement
      ? launchAtLoginNode.checked
      : launchAtLoginStatus.enabled;

  try {
    const normalized = normalizeSettingsInput(inputConfig);
    const normalizedCatalog = normalizeCatalogScanConfigInput(catalogInputConfig);
    const [
      nextSearchDisplayConfig,
      nextCatalogScanConfig,
      nextAppliedVisiblePluginIds,
      nextLaunchAtLoginStatus
    ] = await Promise.all([
      launcher.setSearchDisplayConfig(normalized),
      launcher.setCatalogScanConfig(normalizedCatalog),
      launcher.setVisiblePluginIds(nextVisiblePluginIds),
      launcher.setLaunchAtLoginEnabled(nextLaunchAtLoginEnabled)
    ]);
    searchDisplayConfig = nextSearchDisplayConfig;
    catalogScanConfig = nextCatalogScanConfig;
    visiblePluginIds = nextAppliedVisiblePluginIds;
    launchAtLoginStatus = nextLaunchAtLoginStatus;
    setStatus(
      `\u8bbe\u7f6e\u5df2\u4fdd\u5b58（可见插件 ${visiblePluginIds.length} 个；索引源改动需重建索引后生效）`
    );
  } catch {
    setStatus("\u4fdd\u5b58\u8bbe\u7f6e\u5931\u8d25");
  }

  renderList();
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
    await refreshEntries(currentQuery);
  } catch {
    setStatus("\u91cd\u5efa\u7d22\u5f15\u5931\u8d25");
  }
}

function renderSettingsPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel settings-panel-structured";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = "LiteLauncher 设置";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    "统一管理搜索展示、索引扫描、系统行为和错误日志。索引源变更后需要手动重建索引。";

  const form = document.createElement("form");
  form.className = "settings-form settings-form-grouped";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveSettingsFromForm(form);
  });

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

  const displayGroup = createGroup(
    "搜索展示",
    "控制输入关键词后的搜索结果数量；首页分区已按实际内容和宽度自适应。"
  );
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
  form.appendChild(displayGroup.section);

  const scanGroup = createGroup(
    "索引扫描",
    "配置扫描目录与结果过滤规则，减少无关结果；扫描源改动后可立即重建索引。"
  );
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
  form.appendChild(scanGroup.section);

  const pluginGroup = createGroup(
    "插件可见性",
    "按插件 ID 控制主界面插件分区显示项，一行一个，留空表示隐藏全部插件。"
  );
  const {
    row: visiblePluginIdsRow,
    control: visiblePluginIdsControl
  } = createRow(
    "可见插件 ID",
    `最多 ${VISIBLE_PLUGIN_IDS_MAX} 个，可写插件完整 ID（如 webtools-json）`,
    { textarea: true }
  );
  const visiblePluginIdsInput = document.createElement("textarea");
  visiblePluginIdsInput.name = "visiblePluginIds";
  visiblePluginIdsInput.className = "settings-value settings-textarea";
  visiblePluginIdsInput.placeholder =
    "一行一个插件 ID，例如：\ncashflow-game\nwebtools-password\nwebtools-json";
  visiblePluginIdsInput.value = visiblePluginIds.join("\n");
  visiblePluginIdsControl.appendChild(visiblePluginIdsInput);
  pluginGroup.body.appendChild(visiblePluginIdsRow);
  form.appendChild(pluginGroup.section);

  const systemGroup = createGroup(
    "系统",
    "管理应用的启动行为与当前版本信息。"
  );
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
  versionValue.className = "settings-static-value";
  versionValue.textContent = /^\d/.test(appVersion) ? `v${appVersion}` : appVersion;
  versionControl.appendChild(versionValue);
  versionHint.dataset.compact = "true";
  systemGroup.body.appendChild(versionRow);
  form.appendChild(systemGroup.section);

  const logGroup = createGroup(
    "错误日志",
    "显示最近 40 条运行异常记录，便于定位使用中的问题。"
  );

  const errorLogContainer = document.createElement("div");
  errorLogContainer.className = "settings-error-log";

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

  errorLogActions.append(refreshErrorLogButton, clearErrorLogButton);

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
  form.appendChild(logGroup.section);

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
    void Promise.all([
      launcher.setSearchDisplayConfig(searchDisplayConfig),
      launcher.setCatalogScanConfig(catalogScanConfig),
      launcher.setVisiblePluginIds(visiblePluginIds)
    ])
      .then(
        ([
          savedSearchConfig,
          savedCatalogScanConfig,
          savedVisiblePluginIds
        ]) => {
        searchDisplayConfig = savedSearchConfig;
        catalogScanConfig = savedCatalogScanConfig;
        visiblePluginIds = savedVisiblePluginIds;
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
  form.appendChild(footer);

  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function openSettingsPanel(): void {
  setMode("settings");
  void refreshEntries("");
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

function moveSelection(delta: number): void {
  if (entries.length === 0) {
    return;
  }

  selectedIndex = (selectedIndex + delta + entries.length) % entries.length;
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
      const [
        nextSearchConfig,
        nextCatalogScanConfig,
        nextVisiblePluginIds,
        nextLaunchAtLoginStatus,
        nextAppVersion,
        nextErrorLogs
      ] =
        await Promise.all([
          launcher.getSearchDisplayConfig(),
          launcher.getCatalogScanConfig(),
          launcher.getVisiblePluginIds(),
          launcher.getLaunchAtLoginStatus(),
          launcher.getAppVersion().catch(() => ""),
          launcher.getErrorLogs(40).catch(() => [])
        ]);
      searchDisplayConfig = nextSearchConfig;
      catalogScanConfig = nextCatalogScanConfig;
      visiblePluginIds = Array.isArray(nextVisiblePluginIds)
        ? parseVisiblePluginIdsText(nextVisiblePluginIds.join("\n"))
        : [];
      launchAtLoginStatus = nextLaunchAtLoginStatus;
      errorLogEntries = Array.isArray(nextErrorLogs) ? nextErrorLogs : [];
      appVersion =
        typeof nextAppVersion === "string" && nextAppVersion.trim()
          ? nextAppVersion.trim()
          : "未知版本";
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
        }

        const [searchItems, commandFallbackItems, pinnedItems, pluginItems] = await Promise.all([
          launcher.search(parsedQuery.query, {
            limit: fetchLimit,
            scope: parsedQuery.scope
          }),
          parsedQuery.scope === "all" || parsedQuery.scope === "command"
            ? launcher.resolveCommandQuery(parsedQuery.query)
            : Promise.resolve([]),
          parsedQuery.explicitScope ? Promise.resolve([]) : launcher.getPinnedItems(),
          parsedQuery.explicitScope ? Promise.resolve([]) : launcher.getPluginItems()
        ]);
        if (token !== latestSearchToken) {
          return;
        }

        const launchItems = mergeUniqueLaunchItems(searchItems, commandFallbackItems);

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
        if (!parsedQuery.explicitScope) {
          const pluginTotalCount = pluginItems.length;
          const pluginPageSize = getAdaptiveSectionDisplayLimit(pluginItems);
          const pluginPageCount = 1;
          pluginResultPage = 0;

          addSearchSection(
            "pinned",
            "\u7f6e\u9876",
            pinnedItems,
            getAdaptiveSectionDisplayLimit(pinnedItems),
            "\u6682\u65e0\u7f6e\u9876\u9879\uff08\u53ef\u5728\u641c\u7d22\u7ed3\u679c\u53f3\u952e\u7f6e\u9876\uff09"
          );
          addSearchSection(
            "plugin",
            "\u63d2\u4ef6",
            pluginItems,
            pluginPageSize,
            "\u6682\u65e0\u63d2\u4ef6",
            {
              totalCount: pluginTotalCount,
              page: pluginResultPage,
              pageCount: pluginPageCount
            }
          );
        }
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
          setStatus(
            `\u641c\u7d22 ${shownStart}-${shownEnd}/${totalSearchText} \u00b7 \u7f6e\u9876 ${pinnedItems.length} \u00b7 \u63d2\u4ef6 ${pluginItems.length}`
          );
        }
        return;
      }

      pagedSearchQueryKey = "";
      searchResultPage = 0;

      const [recentItems, pinnedItems, pluginItems] = await Promise.all([
        launcher.getInitialItems(),
        launcher.getPinnedItems(),
        launcher.getPluginItems()
      ]);
      if (token !== latestSearchToken) {
        return;
      }

      const recentDisplayLimit = getAdaptiveSectionDisplayLimit(recentItems);
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
        "\u6682\u65e0\u7f6e\u9876\u9879\uff08\u53ef\u5728\u641c\u7d22\u7ed3\u679c\u53f3\u952e\u7f6e\u9876\uff09"
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
      setStatus(
        `\u6700\u8fd1 ${recentItems.length} \u00b7 \u7f6e\u9876 ${pinnedItems.length} \u00b7 \u63d2\u4ef6 ${pluginItems.length}`
      );
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

    setStatus(result.message ?? "\u6267\u884c\u5b8c\u6210");
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
  if (mode !== "search") {
    setMode("search");
    syncWindowSizePreset("search", true);
    void refreshEntries("");
    return;
  }

  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u9690\u85cf\u7a97\u53e3");
    return;
  }
  syncWindowSizePreset("search", true);
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
      void refreshEntries("");
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
    scheduleSearchRefreshFromInput(input.value);
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
      focusInput(true);
      pushDebugLog("renderer onFocusInput received");
      setTimeout(() => focusInput(true), 30);
    });
  }

  if (launcher?.onClearInput) {
    launcher.onClearInput(() => {
      if (!input.value && !currentQuery) {
        return;
      }

      input.value = "";
      currentQuery = "";
      pushDebugLog("renderer clearInput received");
      clearSearchInputDebounceTimer();

      if (mode === "search" || mode === "clip") {
        void refreshEntries("");
      }
    });
  }

  if (launcher?.onOpenPanel) {
    launcher.onOpenPanel(handleLauncherOpenPanel);
  }

  window.addEventListener("focus", () => {
    pushDebugLog("renderer window focus");
    syncWindowSizePreset(mode, true);
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
  registerEvents();
  setStatus("\u53ef\u4ee5\u5f00\u59cb\u641c\u7d22");
  focusInput(false);
  void refreshEntries("");
}

bootstrap();
