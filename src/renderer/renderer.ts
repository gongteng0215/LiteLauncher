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

interface WebtoolsPasswordOptions {
  length: number;
  count: number;
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeDigits: boolean;
  includeSymbols: boolean;
  symbolChars: string;
  excludeSimilar: boolean;
}

interface WebtoolsPasswordResultRow {
  password: string;
  strength: "弱" | "中" | "强" | "很强";
}

interface WebtoolsJsonState {
  input: string;
  output: string;
  info: string;
  valid: boolean | null;
  sourceFormat: "json" | "csv" | "text" | "escaped";
  targetFormat: "json" | "csv" | "text" | "escaped";
  compressed: boolean;
}

interface WebtoolsUrlQueryRow {
  key: string;
  value: string;
}

interface WebtoolsUrlState {
  input: string;
  output: string;
  info: string;
  queryRows: WebtoolsUrlQueryRow[];
}

type WebtoolsDiffRowType = "same" | "added" | "removed" | "changed";

interface WebtoolsDiffRow {
  index: number;
  type: WebtoolsDiffRowType;
  left: string;
  right: string;
}

interface WebtoolsDiffSummary {
  same: number;
  added: number;
  removed: number;
  changed: number;
  total: number;
  shown: number;
}

interface WebtoolsRegexMatchRow {
  index: number;
  match: string;
  groups: string[];
}

interface WebtoolsApiKvRow {
  key: string;
  value: string;
  enabled: boolean;
}

interface PasswordPanelPayload {
  panel: "password";
  draft?: Partial<PasswordGeneratorOptions>;
}

interface CashflowPanelPayload {
  panel: "cashflow";
  reset?: boolean;
  role?: string;
}

interface GenericPluginPanelPayload {
  panel: "plugin";
  pluginId: string;
  title?: string;
  subtitle?: string;
  message?: string;
  data?: Record<string, unknown>;
}

interface ActivePluginPanelState {
  pluginId: string;
  title: string;
  subtitle: string;
  message?: string;
  data?: Record<string, unknown>;
}

interface PluginPanelHandler {
  render: () => void;
  onOpen?: (panel: ActivePluginPanelState) => void;
  onEnter?: () => void;
}

interface CashflowOpportunity {
  id: string;
  key: string;
  tier?: "small" | "medium" | "big";
  dealClass?: "normal" | "big-deal";
  title: string;
  description: string;
  cost: number;
  cashflow: number;
}

interface CashflowAsset {
  key: string;
  title: string;
  totalCost: number;
  totalCashflow: number;
  count: number;
}

type CashflowPhase = "rat-race" | "freedom-phase";

interface CashflowState {
  jobKey: string;
  turn: number;
  phase: CashflowPhase;
  aiEnabled: boolean;
  aiPlayers: CashflowAiPlayer[];
  role: string;
  taxRate: number;
  debt: number;
  debtPayment: number;
  salary: number;
  expenses: number;
  passiveIncome: number;
  cash: number;
  currentOpportunity: CashflowOpportunity | null;
  assets: CashflowAsset[];
  logs: string[];
  won: boolean;
  lost: boolean;
  lossReason: string | null;
}

interface CashflowAiPlayer {
  id: string;
  profileKey: string;
  name: string;
  profileDescription: string;
  jobKey: string;
  turn: number;
  phase: CashflowPhase;
  role: string;
  taxRate: number;
  debt: number;
  debtPayment: number;
  salary: number;
  expenses: number;
  passiveIncome: number;
  cash: number;
  currentOpportunity: CashflowOpportunity | null;
  assets: CashflowAsset[];
  logs: string[];
  won: boolean;
  lost: boolean;
  lossReason: string | null;
  lastDecision: string | null;
}

type CashflowAction =
  | "open"
  | "state"
  | "reports"
  | "next-turn"
  | "buy"
  | "buy-loan"
  | "skip"
  | "reset"
  | "ai";

interface CashflowIncomeReportItem {
  name: string;
  amount: number;
}

interface CashflowExpenseReportItem {
  name: string;
  amount: number;
}

interface CashflowBalanceSheetReport {
  cash: number;
  assetsTotal: number;
  debtsTotal: number;
  netWorth: number;
}

interface CashflowMetricsReport {
  monthlyNet: number;
  passiveIncomeRatio: number;
  debtRatio: number;
  cashReserveMonths: number;
}

interface CashflowReports {
  income: CashflowIncomeReportItem[];
  expenses: CashflowExpenseReportItem[];
  balanceSheet: CashflowBalanceSheetReport;
  metrics: CashflowMetricsReport;
}

interface CashflowJobOption {
  key: string;
  role: string;
  salary: number;
  expenses: number;
  taxRate: number;
  initialDebt: number;
  debtPayment: number;
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
let latestSearchToken = 0;
let mode: PanelMode = "search";
let debugMode = false;
let isResultsLoading = false;
let resultsLoadingTimer: number | null = null;
const handledEvents = new WeakSet<KeyboardEvent>();
let passwordPanelOptions: PasswordGeneratorOptions = {
  length: 16,
  includeSymbols: true,
  count: 1
};
let passwordPanelGenerated: string[] = [];
let cashflowState: CashflowState | null = null;
let cashflowReports: CashflowReports | null = null;
let cashflowJobs: CashflowJobOption[] = [];
let activePluginPanel: ActivePluginPanelState | null = null;
let webtoolsPasswordOptions: WebtoolsPasswordOptions = {
  length: 16,
  count: 10,
  includeLowercase: true,
  includeUppercase: true,
  includeDigits: true,
  includeSymbols: true,
  symbolChars: "!@#$%^&*",
  excludeSimilar: false
};
let webtoolsPasswordRows: WebtoolsPasswordResultRow[] = [];
let webtoolsJsonState: WebtoolsJsonState = {
  input:
    '{"project":"WebTools","version":1.0,"features":["JSON","CSV","Cron"],"active":true}',
  output: "",
  info: "",
  valid: null,
  sourceFormat: "text",
  targetFormat: "json",
  compressed: false
};
let webtoolsUrlState: WebtoolsUrlState = {
  input: "",
  output: "",
  info: "",
  queryRows: []
};
let webtoolsDiffLeft = "";
let webtoolsDiffRight = "";
let webtoolsDiffIgnoreCase = false;
let webtoolsDiffIgnoreWhitespace = false;
let webtoolsDiffRows: WebtoolsDiffRow[] = [];
let webtoolsDiffSummary: WebtoolsDiffSummary | null = null;
let webtoolsDiffTruncated = false;
let webtoolsTimestampInput = "";
let webtoolsTimestampOutput = "";
let webtoolsTimestampInfo = "";
let webtoolsRegexPattern = "";
let webtoolsRegexFlags = "g";
let webtoolsRegexInput = "";
let webtoolsRegexReplacement = "";
let webtoolsRegexOutput = "";
let webtoolsRegexInfo = "";
let webtoolsRegexRows: WebtoolsRegexMatchRow[] = [];
let webtoolsCronExpression = "5 4 * * *";
let webtoolsCronReadable = "";
let webtoolsCronNextRun = "";
let webtoolsCronUpcoming: string[] = [];
let webtoolsJsonAutoTimer: number | null = null;
let webtoolsCronAutoTimer: number | null = null;
let webtoolsPasswordRequestToken = 0;
let webtoolsJsonRequestToken = 0;
let webtoolsCronRequestToken = 0;
let webtoolsCryptoAlgorithm = "MD5";
let webtoolsCryptoMode: "encrypt" | "decrypt" = "encrypt";
let webtoolsCryptoInput = "";
let webtoolsCryptoOutput = "";
let webtoolsCryptoInfo = "";
let webtoolsCryptoSecret = "";
let webtoolsCryptoIv = "";
let webtoolsCryptoPublicKey = "";
let webtoolsCryptoPrivateKey = "";
let webtoolsCryptoRsaBits = 2048;
let webtoolsCryptoAutoTimer: number | null = null;
let webtoolsCryptoRequestToken = 0;
let webtoolsJwtToken = "";
let webtoolsJwtHeader = "";
let webtoolsJwtPayload = "";
let webtoolsJwtSecret = "your-256-bit-secret";
let webtoolsJwtMode: "jws" | "jwe" = "jws";
let webtoolsJwtAlgorithm: "HS256" | "RS256" = "HS256";
let webtoolsJwtJweAlg: "dir" | "A256KW" = "dir";
let webtoolsJwtJweEnc: "A256GCM" | "A128GCM" = "A256GCM";
let webtoolsJwtVerified: boolean | null = null;
let webtoolsJwtInfo = "";
let webtoolsJwtAutoTimer: number | null = null;
let webtoolsJwtSignTimer: number | null = null;
let webtoolsJwtRequestToken = 0;
let webtoolsStringsInput = "hello_world_variable";
let webtoolsStringsCaseType = "camel";
let webtoolsStringsOutput = "";
let webtoolsStringsUuidCount = 5;
let webtoolsStringsUuidItems: string[] = [];
let webtoolsColorsInput = "#6c5ce7";
let webtoolsColorsHex = "#6c5ce7";
let webtoolsColorsRgb = "rgb(108, 92, 231)";
let webtoolsColorsHsl = "hsl(247, 74%, 63%)";
let webtoolsColorsShades: string[] = [];
let webtoolsImageBase64Input = "";
let webtoolsImageBase64DataUrl = "";
let webtoolsImageBase64Raw = "";
let webtoolsImageBase64Mime = "";
let webtoolsImageBase64SizeText = "";
let webtoolsConfigSource = "yaml";
let webtoolsConfigTarget = "properties";
let webtoolsConfigInput = "";
let webtoolsConfigOutput = "";
let webtoolsConfigInfo = "";
let webtoolsSqlInput =
  "SELECT a,b,c FROM table_test JOIN other_table ON table_test.id = other_table.id WHERE a > 10 AND b LIKE '%test%' ORDER BY c DESC LIMIT 10";
let webtoolsSqlOutput = "";
let webtoolsSqlDialect = "sql";
let webtoolsSqlUppercase = true;
let webtoolsSqlIndent = 2;
let webtoolsSqlInfo = "";
let webtoolsUnitStorageValue = 1;
let webtoolsUnitStorageUnit = "MB";
let webtoolsUnitStorageValues: Record<string, number> = {};
let webtoolsUnitPixel = 160;
let webtoolsUnitRem = 10;
let webtoolsUnitBasePx = 16;
let webtoolsQrText = "https://github.com";
let webtoolsQrSize = 300;
let webtoolsQrLevel = "M";
let webtoolsQrUrl = "";
let webtoolsMarkdownInput = "# Markdown 预览\n\n在这里输入 Markdown 内容。";
let webtoolsMarkdownHtml = "";
let webtoolsMarkdownInfo = "";
let webtoolsUaInput = "";
let webtoolsUaResult: Record<string, string> = {};
let webtoolsApiMethod = "GET";
let webtoolsApiUrl = "https://jsonplaceholder.typicode.com/posts/1";
let webtoolsApiParamsText = "";
let webtoolsApiHeadersText = "Content-Type=application/json";
let webtoolsApiBodyType = "json";
let webtoolsApiBodyContent = "{\n  \"title\": \"foo\",\n  \"body\": \"bar\",\n  \"userId\": 1\n}";
let webtoolsApiFormText = "";
let webtoolsApiResponseStatus = "";
let webtoolsApiResponseMeta = "";
let webtoolsApiResponseBody = "";
let webtoolsApiResponseHeaders: Record<string, string> = {};

const DEBUG_LOG_LIMIT = 22;
const SETTINGS_LIMIT_MIN = 5;
const SETTINGS_LIMIT_MAX = 100;
const CATALOG_SCAN_CUSTOM_DIRS_MAX = 50;
const CATALOG_SCAN_EXCLUDE_DIRS_MAX = 50;
const CATALOG_RESULT_INCLUDE_DIRS_MAX = 50;
const CATALOG_RESULT_EXCLUDE_DIRS_MAX = 50;
const SEARCH_PAGE_FETCH_MULTIPLIER = 5;
const SEARCH_PAGE_FETCH_MAX = 500;
const PASSWORD_LENGTH_MIN = 4;
const PASSWORD_LENGTH_MAX = 64;
const PASSWORD_COUNT_MIN = 1;
const PASSWORD_COUNT_MAX = 20;
const WEBTOOLS_PASSWORD_COUNT_MAX = 50;
const CASHFLOW_PLUGIN_ID = "cashflow-game";
const WEBTOOLS_PASSWORD_PLUGIN_ID = "webtools-password";
const WEBTOOLS_JSON_PLUGIN_ID = "webtools-json";
const WEBTOOLS_URL_PLUGIN_ID = "webtools-url-parse";
const WEBTOOLS_DIFF_PLUGIN_ID = "webtools-diff";
const WEBTOOLS_TIMESTAMP_PLUGIN_ID = "webtools-timestamp";
const WEBTOOLS_REGEX_PLUGIN_ID = "webtools-regex";
const WEBTOOLS_CRON_PLUGIN_ID = "webtools-cron";
const WEBTOOLS_CRYPTO_PLUGIN_ID = "webtools-crypto";
const WEBTOOLS_JWT_PLUGIN_ID = "webtools-jwt";
const WEBTOOLS_STRINGS_PLUGIN_ID = "webtools-strings";
const WEBTOOLS_COLORS_PLUGIN_ID = "webtools-colors";
const WEBTOOLS_IMAGE_BASE64_PLUGIN_ID = "webtools-image-base64";
const WEBTOOLS_CONFIG_PLUGIN_ID = "webtools-config-convert";
const WEBTOOLS_SQL_PLUGIN_ID = "webtools-sql-format";
const WEBTOOLS_UNIT_PLUGIN_ID = "webtools-unit-convert";
const WEBTOOLS_QRCODE_PLUGIN_ID = "webtools-qrcode";
const WEBTOOLS_MARKDOWN_PLUGIN_ID = "webtools-markdown";
const WEBTOOLS_UA_PLUGIN_ID = "webtools-ua";
const WEBTOOLS_API_PLUGIN_ID = "webtools-api-client";
const WEBTOOLS_PASSWORD_DEFAULT_SYMBOLS = "!@#$%^&*";
const WEBTOOLS_JWT_DEFAULT_SECRET = "your-256-bit-secret";
const WEBTOOLS_JWT_SAMPLE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ." +
  "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
const WEBTOOLS_JWT_SAMPLE_HEADER = `{
  "alg": "HS256",
  "typ": "JWT"
}`;
const WEBTOOLS_JWT_SAMPLE_PAYLOAD = `{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022
}`;
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
let launchAtLoginStatus: LaunchAtLoginStatus = {
  enabled: false,
  supported: false,
  reason: "状态未知"
};
let appVersion = "未知版本";
let errorLogEntries: AppErrorLogEntry[] = [];
let activeSearchContextMenu: HTMLDivElement | null = null;

function getLauncherApi(): LauncherApi | null {
  return ((window as Window & { launcher?: LauncherApi }).launcher ??
    null) as LauncherApi | null;
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

function formatErrorLogs(entries: AppErrorLogEntry[]): string {
  if (entries.length === 0) {
    return "暂无错误日志";
  }

  return entries
    .map((entry) => {
      const head = `[${formatErrorLogDate(entry.createdAt)}] [${
        entry.level
      }] [${entry.scope}] ${entry.message}`;
      const context = entry.context ? `上下文: ${entry.context}` : "";
      const detail = entry.detail ? `详情: ${entry.detail}` : "";
      return [head, context, detail].filter(Boolean).join("\n");
    })
    .join("\n\n");
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
  const preset: "compact" | "cashflow" =
    nextMode === "cashflow" ? "cashflow" : "compact";
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
      "Enter 执行 - Esc 清空/隐藏 - 方向键移动 - PageUp/PageDown 翻页 - 支持 app:/cmd:/web:/plugin:"
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
    setHint("Esc \u8fd4\u56de - Enter \u6267\u884c\u9ed8\u8ba4\u64cd\u4f5c");
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

function clampPasswordLength(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  const rounded = Math.round(value);
  if (rounded < PASSWORD_LENGTH_MIN) {
    return PASSWORD_LENGTH_MIN;
  }
  if (rounded > PASSWORD_LENGTH_MAX) {
    return PASSWORD_LENGTH_MAX;
  }
  return rounded;
}

function clampPasswordCount(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  const rounded = Math.round(value);
  if (rounded < PASSWORD_COUNT_MIN) {
    return PASSWORD_COUNT_MIN;
  }
  if (rounded > PASSWORD_COUNT_MAX) {
    return PASSWORD_COUNT_MAX;
  }
  return rounded;
}

function clampWebtoolsPasswordCount(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  const rounded = Math.round(value);
  if (rounded < PASSWORD_COUNT_MIN) {
    return PASSWORD_COUNT_MIN;
  }
  if (rounded > WEBTOOLS_PASSWORD_COUNT_MAX) {
    return WEBTOOLS_PASSWORD_COUNT_MAX;
  }
  return rounded;
}

function normalizePasswordOptions(
  inputOptions: Partial<PasswordGeneratorOptions>,
  base: PasswordGeneratorOptions = passwordPanelOptions
): PasswordGeneratorOptions {
  const includeSymbols =
    typeof inputOptions.includeSymbols === "boolean"
      ? inputOptions.includeSymbols
      : base.includeSymbols;

  const requiredLength = includeSymbols ? 4 : 3;
  const length = Math.max(
    requiredLength,
    clampPasswordLength(inputOptions.length ?? base.length, base.length)
  );

  return {
    length,
    includeSymbols,
    count: clampPasswordCount(inputOptions.count ?? base.count, base.count)
  };
}

function normalizeWebtoolsPasswordOptions(
  inputOptions: Partial<WebtoolsPasswordOptions>,
  base: WebtoolsPasswordOptions = webtoolsPasswordOptions
): WebtoolsPasswordOptions {
  let includeLowercase =
    typeof inputOptions.includeLowercase === "boolean"
      ? inputOptions.includeLowercase
      : base.includeLowercase;
  let includeUppercase =
    typeof inputOptions.includeUppercase === "boolean"
      ? inputOptions.includeUppercase
      : base.includeUppercase;
  let includeDigits =
    typeof inputOptions.includeDigits === "boolean"
      ? inputOptions.includeDigits
      : base.includeDigits;
  const includeSymbols =
    typeof inputOptions.includeSymbols === "boolean"
      ? inputOptions.includeSymbols
      : base.includeSymbols;
  const excludeSimilar =
    typeof inputOptions.excludeSimilar === "boolean"
      ? inputOptions.excludeSimilar
      : base.excludeSimilar;

  if (!includeLowercase && !includeUppercase && !includeDigits && !includeSymbols) {
    includeLowercase = true;
    includeUppercase = true;
    includeDigits = true;
  }

  const symbolCharsRaw =
    typeof inputOptions.symbolChars === "string"
      ? inputOptions.symbolChars
      : base.symbolChars;
  const symbolChars = (symbolCharsRaw || WEBTOOLS_PASSWORD_DEFAULT_SYMBOLS).trim();

  const selectedGroupsCount =
    Number(includeLowercase) +
    Number(includeUppercase) +
    Number(includeDigits) +
    Number(includeSymbols);
  const requiredLength = Math.max(1, selectedGroupsCount);
  const length = Math.max(
    requiredLength,
    clampPasswordLength(inputOptions.length ?? base.length, base.length)
  );

  return {
    length,
    count: clampWebtoolsPasswordCount(inputOptions.count ?? base.count, base.count),
    includeLowercase,
    includeUppercase,
    includeDigits,
    includeSymbols,
    symbolChars,
    excludeSimilar
  };
}

function parsePasswordPanelPayload(payload: unknown): PasswordPanelPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (record.panel !== "password") {
    return null;
  }

  const draftRaw = record.draft;
  let draft: Partial<PasswordGeneratorOptions> | undefined;
  if (draftRaw && typeof draftRaw === "object") {
    const draftRecord = draftRaw as Record<string, unknown>;
    draft = {
      length:
        typeof draftRecord.length === "number"
          ? draftRecord.length
          : undefined,
      count:
        typeof draftRecord.count === "number"
          ? draftRecord.count
          : undefined,
      includeSymbols:
        typeof draftRecord.includeSymbols === "boolean"
          ? draftRecord.includeSymbols
          : undefined
    };
  }

  return {
    panel: "password",
    draft
  };
}

function parseCashflowPanelPayload(payload: unknown): CashflowPanelPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (record.panel !== "cashflow") {
    return null;
  }

  return {
    panel: "cashflow",
    reset: typeof record.reset === "boolean" ? record.reset : undefined,
    role: typeof record.role === "string" ? record.role : undefined
  };
}

function parseGenericPluginPanelPayload(
  payload: unknown
): GenericPluginPanelPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (record.panel !== "plugin") {
    return null;
  }

  if (typeof record.pluginId !== "string") {
    return null;
  }

  const pluginId = record.pluginId.trim();
  if (!pluginId) {
    return null;
  }

  return {
    panel: "plugin",
    pluginId,
    title: typeof record.title === "string" ? record.title : undefined,
    subtitle: typeof record.subtitle === "string" ? record.subtitle : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
    data:
      record.data && typeof record.data === "object"
        ? (record.data as Record<string, unknown>)
        : undefined
  };
}

function formatMoney(value: number): string {
  return CURRENCY_FORMATTER.format(value);
}

function formatPercent(value: number): string {
  const percent = value * 100;
  return `${percent.toFixed(1)}%`;
}

function cashflowPhaseLabel(phase: CashflowPhase): string {
  return phase === "freedom-phase" ? "閼奉亞鏁遍梼鑸殿唽" : "閼颁線绱剁挧娑滅獓";
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

function parseKeyValueText(text: string): WebtoolsApiKvRow[] {
  const rows: WebtoolsApiKvRow[] = [];
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      rows.push({
        key: trimmed,
        value: "",
        enabled: true
      });
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!key) {
      continue;
    }
    rows.push({
      key,
      value,
      enabled: true
    });
  }

  return rows;
}

function parseCashflowOpportunity(value: unknown): CashflowOpportunity | null {
  const record = toRecord(value);
  if (!record) {
    return null;
  }

  if (
    typeof record.id !== "string" ||
    typeof record.key !== "string" ||
    typeof record.title !== "string" ||
    typeof record.description !== "string" ||
    typeof record.cost !== "number" ||
    typeof record.cashflow !== "number"
  ) {
    return null;
  }

  const tier =
    record.tier === "small" || record.tier === "medium" || record.tier === "big"
      ? record.tier
      : undefined;
  const dealClass =
    record.dealClass === "big-deal" || record.dealClass === "normal"
      ? record.dealClass
      : undefined;

  return {
    id: record.id,
    key: record.key,
    tier,
    dealClass,
    title: record.title,
    description: record.description,
    cost: record.cost,
    cashflow: record.cashflow
  };
}

function parseCashflowAsset(value: unknown): CashflowAsset | null {
  const record = toRecord(value);
  if (!record) {
    return null;
  }

  if (
    typeof record.key !== "string" ||
    typeof record.title !== "string" ||
    typeof record.totalCost !== "number" ||
    typeof record.totalCashflow !== "number" ||
    typeof record.count !== "number"
  ) {
    return null;
  }

  return {
    key: record.key,
    title: record.title,
    totalCost: record.totalCost,
    totalCashflow: record.totalCashflow,
    count: record.count
  };
}

function parseCashflowAiPlayer(value: unknown): CashflowAiPlayer | null {
  const record = toRecord(value);
  if (!record) {
    return null;
  }

  if (
    typeof record.id !== "string" ||
    typeof record.profileKey !== "string" ||
    typeof record.name !== "string" ||
    typeof record.profileDescription !== "string" ||
    typeof record.turn !== "number" ||
    typeof record.role !== "string" ||
    typeof record.salary !== "number" ||
    typeof record.expenses !== "number" ||
    typeof record.passiveIncome !== "number" ||
    typeof record.cash !== "number" ||
    typeof record.won !== "boolean"
  ) {
    return null;
  }

  const jobKey = typeof record.jobKey === "string" ? record.jobKey : "";
  const phase: CashflowPhase =
    record.phase === "freedom-phase" ? "freedom-phase" : "rat-race";
  const taxRate =
    typeof record.taxRate === "number" && Number.isFinite(record.taxRate)
      ? record.taxRate
      : 0;
  const debt =
    typeof record.debt === "number" && Number.isFinite(record.debt)
      ? record.debt
      : 0;
  const debtPayment =
    typeof record.debtPayment === "number" && Number.isFinite(record.debtPayment)
      ? record.debtPayment
      : 0;
  const lost = typeof record.lost === "boolean" ? record.lost : false;
  const lossReason =
    typeof record.lossReason === "string" && record.lossReason.trim()
      ? record.lossReason
      : null;
  const lastDecision =
    typeof record.lastDecision === "string" && record.lastDecision.trim()
      ? record.lastDecision
      : null;

  const currentOpportunity =
    record.currentOpportunity === null
      ? null
      : parseCashflowOpportunity(record.currentOpportunity);
  if (record.currentOpportunity !== null && !currentOpportunity) {
    return null;
  }

  if (!Array.isArray(record.assets) || !Array.isArray(record.logs)) {
    return null;
  }

  const assets: CashflowAsset[] = [];
  for (const item of record.assets) {
    const parsed = parseCashflowAsset(item);
    if (!parsed) {
      return null;
    }
    assets.push(parsed);
  }

  const logs = record.logs.filter(
    (item): item is string => typeof item === "string"
  );

  return {
    id: record.id,
    profileKey: record.profileKey,
    name: record.name,
    profileDescription: record.profileDescription,
    jobKey,
    turn: record.turn,
    phase,
    role: record.role,
    taxRate,
    debt,
    debtPayment,
    salary: record.salary,
    expenses: record.expenses,
    passiveIncome: record.passiveIncome,
    cash: record.cash,
    currentOpportunity,
    assets,
    logs,
    won: record.won,
    lost,
    lossReason,
    lastDecision
  };
}

function parseCashflowState(value: unknown): CashflowState | null {
  const record = toRecord(value);
  if (!record) {
    return null;
  }

  if (
    typeof record.turn !== "number" ||
    typeof record.role !== "string" ||
    typeof record.salary !== "number" ||
    typeof record.expenses !== "number" ||
    typeof record.passiveIncome !== "number" ||
    typeof record.cash !== "number" ||
    typeof record.won !== "boolean"
  ) {
    return null;
  }

  const jobKey = typeof record.jobKey === "string" ? record.jobKey : "";
  const phase: CashflowPhase =
    record.phase === "freedom-phase" ? "freedom-phase" : "rat-race";
  const taxRate =
    typeof record.taxRate === "number" && Number.isFinite(record.taxRate)
      ? record.taxRate
      : 0;
  const debt =
    typeof record.debt === "number" && Number.isFinite(record.debt)
      ? record.debt
      : 0;
  const debtPayment =
    typeof record.debtPayment === "number" && Number.isFinite(record.debtPayment)
      ? record.debtPayment
      : 0;
  const lost = typeof record.lost === "boolean" ? record.lost : false;
  const lossReason =
    typeof record.lossReason === "string" && record.lossReason.trim()
      ? record.lossReason
      : null;

  const currentOpportunity =
    record.currentOpportunity === null
      ? null
      : parseCashflowOpportunity(record.currentOpportunity);
  if (record.currentOpportunity !== null && !currentOpportunity) {
    return null;
  }

  if (!Array.isArray(record.assets) || !Array.isArray(record.logs)) {
    return null;
  }

  const assets: CashflowAsset[] = [];
  for (const item of record.assets) {
    const parsed = parseCashflowAsset(item);
    if (!parsed) {
      return null;
    }
    assets.push(parsed);
  }

  const logs = record.logs.filter(
    (item): item is string => typeof item === "string"
  );
  const aiEnabled = typeof record.aiEnabled === "boolean" ? record.aiEnabled : false;
  const aiPlayersRaw = Array.isArray(record.aiPlayers) ? record.aiPlayers : [];
  const aiPlayers: CashflowAiPlayer[] = [];
  for (const item of aiPlayersRaw) {
    const parsed = parseCashflowAiPlayer(item);
    if (!parsed) {
      return null;
    }
    aiPlayers.push(parsed);
  }

  return {
    jobKey,
    turn: record.turn,
    phase,
    aiEnabled,
    aiPlayers,
    role: record.role,
    taxRate,
    debt,
    debtPayment,
    salary: record.salary,
    expenses: record.expenses,
    passiveIncome: record.passiveIncome,
    cash: record.cash,
    currentOpportunity,
    assets,
    logs,
    won: record.won,
    lost,
    lossReason
  };
}

function parseCashflowAmountItem(
  value: unknown
): CashflowIncomeReportItem | CashflowExpenseReportItem | null {
  const record = toRecord(value);
  if (!record) {
    return null;
  }

  if (typeof record.name !== "string" || typeof record.amount !== "number") {
    return null;
  }

  return {
    name: record.name,
    amount: record.amount
  };
}

function parseCashflowBalanceSheetReport(
  value: unknown
): CashflowBalanceSheetReport | null {
  const record = toRecord(value);
  if (!record) {
    return null;
  }

  if (
    typeof record.cash !== "number" ||
    typeof record.assetsTotal !== "number" ||
    typeof record.debtsTotal !== "number" ||
    typeof record.netWorth !== "number"
  ) {
    return null;
  }

  return {
    cash: record.cash,
    assetsTotal: record.assetsTotal,
    debtsTotal: record.debtsTotal,
    netWorth: record.netWorth
  };
}

function parseCashflowMetricsReport(value: unknown): CashflowMetricsReport | null {
  const record = toRecord(value);
  if (!record) {
    return null;
  }

  if (
    typeof record.monthlyNet !== "number" ||
    typeof record.passiveIncomeRatio !== "number" ||
    typeof record.debtRatio !== "number" ||
    typeof record.cashReserveMonths !== "number"
  ) {
    return null;
  }

  return {
    monthlyNet: record.monthlyNet,
    passiveIncomeRatio: record.passiveIncomeRatio,
    debtRatio: record.debtRatio,
    cashReserveMonths: record.cashReserveMonths
  };
}

function parseCashflowReports(value: unknown): CashflowReports | null {
  const record = toRecord(value);
  if (!record) {
    return null;
  }

  if (!Array.isArray(record.income) || !Array.isArray(record.expenses)) {
    return null;
  }

  const income: CashflowIncomeReportItem[] = [];
  for (const item of record.income) {
    const parsed = parseCashflowAmountItem(item);
    if (!parsed) {
      return null;
    }
    income.push(parsed);
  }

  const expenses: CashflowExpenseReportItem[] = [];
  for (const item of record.expenses) {
    const parsed = parseCashflowAmountItem(item);
    if (!parsed) {
      return null;
    }
    expenses.push(parsed);
  }

  const balanceSheet = parseCashflowBalanceSheetReport(record.balanceSheet);
  const metrics = parseCashflowMetricsReport(record.metrics);
  if (!balanceSheet || !metrics) {
    return null;
  }

  return {
    income,
    expenses,
    balanceSheet,
    metrics
  };
}

function parseCashflowJobOption(value: unknown): CashflowJobOption | null {
  const record = toRecord(value);
  if (!record) {
    return null;
  }

  if (
    typeof record.key !== "string" ||
    typeof record.role !== "string" ||
    typeof record.salary !== "number" ||
    typeof record.expenses !== "number" ||
    typeof record.taxRate !== "number" ||
    typeof record.initialDebt !== "number" ||
    typeof record.debtPayment !== "number"
  ) {
    return null;
  }

  return {
    key: record.key,
    role: record.role,
    salary: record.salary,
    expenses: record.expenses,
    taxRate: record.taxRate,
    initialDebt: record.initialDebt,
    debtPayment: record.debtPayment
  };
}

function extractCashflowState(result: ExecuteResult): CashflowState | null {
  const data = toRecord(result.data);
  if (!data) {
    return null;
  }
  return parseCashflowState(data.cashflowState);
}

function extractCashflowReports(result: ExecuteResult): CashflowReports | null {
  const data = toRecord(result.data);
  if (!data) {
    return null;
  }
  return parseCashflowReports(data.cashflowReports);
}

function extractCashflowJobs(result: ExecuteResult): CashflowJobOption[] | null {
  const data = toRecord(result.data);
  if (!data) {
    return null;
  }

  if (!Array.isArray(data.cashflowJobs)) {
    return null;
  }

  const jobs: CashflowJobOption[] = [];
  for (const item of data.cashflowJobs) {
    const parsed = parseCashflowJobOption(item);
    if (!parsed) {
      return null;
    }
    jobs.push(parsed);
  }
  return jobs;
}

function buildCashflowTarget(
  action: CashflowAction,
  options?: { roleKey?: string }
): string {
  const params = new URLSearchParams();
  params.set("action", action);
  if (options?.roleKey) {
    params.set("role", options.roleKey);
  }
  return `command:plugin:${CASHFLOW_PLUGIN_ID}?${params.toString()}`;
}

function createCashflowActionItem(
  action: CashflowAction,
  options?: { roleKey?: string }
): LaunchItem {
  return {
    id: `plugin:${CASHFLOW_PLUGIN_ID}:${action}`,
    type: "command",
    title: "\u5bcc\u7238\u7238\u73b0\u91d1\u6d41",
    subtitle: `\u6e38\u620f\u52a8\u4f5c\uff1a${action}`,
    target: buildCashflowTarget(action, options),
    keywords: ["plugin", "cashflow", "cash", "cf", "\u73b0\u91d1\u6d41"]
  };
}

function cashflowStatusSummary(state: CashflowState): string {
  const totalExpenses = state.expenses + state.debtPayment;
  if (state.lost) {
    return state.lossReason ?? "\u672c\u5c40\u5df2\u5931\u8d25\uff0c\u8bf7\u65b0\u5f00\u4e00\u5c40";
  }
  if (state.won) {
    return `\u5df2\u8fbe\u6210\u8d22\u52a1\u81ea\u7531\uff08${cashflowPhaseLabel(state.phase)}\uff09\uff01${formatMoney(
      state.passiveIncome
    )} >= ${formatMoney(totalExpenses)}`;
  }
  return `${cashflowPhaseLabel(state.phase)} \u00b7 \u73b0\u91d1 ${formatMoney(state.cash)} \u00b7 \u88ab\u52a8\u6536\u5165 ${formatMoney(
    state.passiveIncome
  )}/\u6708 \u00b7 \u503a\u52a1 ${formatMoney(state.debt)}`;
}

async function executeCashflowAction(
  action: CashflowAction,
  options?: { roleKey?: string }
): Promise<ExecuteResult | null> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u6267\u884c\u73b0\u91d1\u6d41\u64cd\u4f5c");
    return null;
  }

  const item = createCashflowActionItem(action, options);
  const result = await launcher.execute(item);
  if (!result.ok) {
    setStatus(result.message ?? "\u73b0\u91d1\u6d41\u64cd\u4f5c\u5931\u8d25");
    return null;
  }

  const nextState = extractCashflowState(result);
  if (nextState) {
    cashflowState = nextState;
  }
  const nextReports = extractCashflowReports(result);
  cashflowReports = nextReports;
  const nextJobs = extractCashflowJobs(result);
  if (nextJobs) {
    cashflowJobs = nextJobs;
  }

  if (result.message) {
    setStatus(result.message);
  } else if (cashflowState) {
    setStatus(cashflowStatusSummary(cashflowState));
  }

  return result;
}

async function nextCashflowTurn(): Promise<void> {
  const result = await executeCashflowAction("next-turn");
  if (!result) {
    return;
  }
  renderList();
}

async function buyCashflowOpportunity(): Promise<void> {
  const result = await executeCashflowAction("buy");
  if (!result) {
    return;
  }
  renderList();
}

async function buyCashflowOpportunityWithLoan(): Promise<void> {
  const result = await executeCashflowAction("buy-loan");
  if (!result) {
    return;
  }
  renderList();
}

async function skipCashflowOpportunity(): Promise<void> {
  const result = await executeCashflowAction("skip");
  if (!result) {
    return;
  }
  renderList();
}

async function resetCashflowGame(roleKey?: string): Promise<void> {
  const result = await executeCashflowAction("reset", { roleKey });
  if (!result) {
    return;
  }
  renderList();
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
  const savedPinned = await launcher.setItemPinned(item.id, nextPinned);
  if (nextPinned && !savedPinned) {
    setStatus(`\u7f6e\u9876\u5931\u8d25\uff1a${item.title}`);
    return;
  }

  updatePinnedState(item.id, savedPinned);
  setStatus(
    savedPinned
      ? `\u5df2\u7f6e\u9876\uff1a${item.title}`
      : `\u5df2\u53d6\u6d88\u7f6e\u9876\uff1a${item.title}`
  );
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
    pinBadge.textContent = "\u7f6e\u9876";
    tile.appendChild(pinBadge);
  }

  bindResultInteractions(tile, index, entry);
  return tile;
}

function renderSearchSections(): void {
  list.classList.add("search-sections");

  for (const section of searchSections) {
    const block = document.createElement("li");
    block.className = "section-block";

    const heading = document.createElement("div");
    heading.className = "section-title-row";

    const title = document.createElement("div");
    title.className = "section-title";
    if (section.id === "search" && section.pageCount > 1) {
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

    if (section.id === "search" && section.pageCount > 1) {
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
        changeSearchResultPage(-1);
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
        changeSearchResultPage(1);
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

  const launchAtLoginNode = form.elements.namedItem("launchAtLogin");
  const nextLaunchAtLoginEnabled =
    launchAtLoginNode instanceof HTMLInputElement
      ? launchAtLoginNode.checked
      : launchAtLoginStatus.enabled;

  try {
    const normalized = normalizeSettingsInput(inputConfig);
    const normalizedCatalog = normalizeCatalogScanConfigInput(catalogInputConfig);
    searchDisplayConfig = await launcher.setSearchDisplayConfig(normalized);
    catalogScanConfig = await launcher.setCatalogScanConfig(normalizedCatalog);
    launchAtLoginStatus = await launcher.setLaunchAtLoginEnabled(
      nextLaunchAtLoginEnabled
    );
    setStatus("\u8bbe\u7f6e\u5df2\u4fdd\u5b58（索引源改动需重建索引后生效）");
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
    { key: "recentLimit", label: "\u6700\u8fd1\u8bbf\u95ee", hint: "\u7a7a\u8f93\u5165\u5206\u533a" },
    { key: "pinnedLimit", label: "\u7f6e\u9876", hint: "\u7a7a\u8f93\u5165\u5206\u533a" },
    { key: "pluginLimit", label: "\u63d2\u4ef6", hint: "\u7a7a\u8f93\u5165\u5206\u533a" },
    { key: "searchLimit", label: "\u641c\u7d22\u7ed3\u679c", hint: "\u8f93\u5165\u540e\u5206\u533a" }
  ];

  const displayGroup = createGroup(
    "搜索展示",
    "控制主界面各分区默认显示数量。"
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
  errorLogOutput.readOnly = true;
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
    void Promise.all([
      launcher.setSearchDisplayConfig(searchDisplayConfig),
      launcher.setCatalogScanConfig(catalogScanConfig)
    ])
      .then(([savedSearchConfig, savedCatalogScanConfig]) => {
        searchDisplayConfig = savedSearchConfig;
        catalogScanConfig = savedCatalogScanConfig;
        setStatus("\u5df2\u6062\u590d\u9ed8\u8ba4\u8bbe\u7f6e");
        renderList();
      })
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

function buildPasswordGenerateTarget(options: PasswordGeneratorOptions): string {
  const params = new URLSearchParams();
  params.set("action", "generate");
  params.set("length", String(options.length));
  params.set("count", String(options.count));
  params.set("symbols", options.includeSymbols ? "1" : "0");
  return `command:plugin:password-generator?${params.toString()}`;
}

function extractGeneratedPasswords(result: ExecuteResult): string[] {
  const raw = result.data?.passwords;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
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

function createPasswordResultRow(passwords: string[]): HTMLDivElement {
  const outputRow = document.createElement("div");
  outputRow.className = "password-output-row";

  const outputLabel = document.createElement("div");
  outputLabel.className = "settings-row-label";
  outputLabel.textContent = "生成结果";

  const resultList = document.createElement("div");
  resultList.className = "password-result-list";

  if (passwords.length === 0) {
    const empty = document.createElement("div");
    empty.className = "password-result-empty";
    empty.textContent = "点击生成后，结果会显示在这里";
    resultList.appendChild(empty);
  } else {
    passwords.forEach((password, index) => {
      const row = document.createElement("div");
      row.className = "password-result-item";

      const value = document.createElement("input");
      value.className = "password-result-value";
      value.type = "text";
      value.readOnly = true;
      value.value = password;
      value.title = password;
      value.addEventListener("focus", () => {
        value.select();
      });
      value.addEventListener("click", () => {
        value.select();
      });

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className =
        "settings-btn settings-btn-secondary password-result-copy";
      copyButton.textContent = "复制";
      copyButton.addEventListener("click", () => {
        void (async () => {
          const copied = await copyTextToClipboard(password);
          if (copied) {
            setStatus(`已复制第 ${index + 1} 条密码`);
            return;
          }
          setStatus("复制失败，请手动复制");
        })();
      });

      row.append(value, copyButton);
      resultList.appendChild(row);
    });
  }

  outputRow.append(outputLabel, resultList);
  return outputRow;
}

async function generateFromPasswordPanel(form: HTMLFormElement): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u751f\u6210\u5bc6\u7801");
    return;
  }

  const lengthNode = form.elements.namedItem("passwordLength");
  const countNode = form.elements.namedItem("passwordCount");
  const symbolsNode = form.elements.namedItem("passwordSymbols");

  const inputOptions: Partial<PasswordGeneratorOptions> = {
    length:
      lengthNode instanceof HTMLInputElement ? Number(lengthNode.value) : undefined,
    count:
      countNode instanceof HTMLInputElement ? Number(countNode.value) : undefined,
    includeSymbols:
      symbolsNode instanceof HTMLInputElement ? symbolsNode.checked : undefined
  };

  const normalized = normalizePasswordOptions(inputOptions);
  passwordPanelOptions = normalized;

  const item: LaunchItem = {
    id: "plugin:password-generator",
    type: "command",
    title: "\u5bc6\u7801\u751f\u6210\u5668",
    subtitle: "\u9762\u677f\u751f\u6210",
    target: buildPasswordGenerateTarget(normalized),
    keywords: ["plugin", "password", "pwd"]
  };

  const result = await launcher.execute(item);
  if (!result.ok) {
    setStatus(result.message ?? "\u5bc6\u7801\u751f\u6210\u5931\u8d25");
    return;
  }

  passwordPanelGenerated = extractGeneratedPasswords(result);
  setStatus(result.message ?? "\u5bc6\u7801\u5df2\u751f\u6210\u5e76\u590d\u5236");
  renderList();
}

function renderPasswordPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = "\u5bc6\u7801\u751f\u6210\u5668";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    "\u8bbe\u7f6e\u957f\u5ea6\u3001\u6570\u91cf\u3001\u662f\u5426\u5305\u542b\u7279\u6b8a\u7b26\u53f7\uff0c\u70b9\u51fb\u751f\u6210\u540e\u5c06\u81ea\u52a8\u590d\u5236\u5230\u526a\u8d34\u677f\u3002";

  const form = document.createElement("form");
  form.className = "settings-form password-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void generateFromPasswordPanel(form);
  });

  const lengthRow = document.createElement("label");
  lengthRow.className = "settings-row";
  const lengthLabel = document.createElement("span");
  lengthLabel.className = "settings-row-label";
  lengthLabel.textContent = "\u5bc6\u7801\u957f\u5ea6";
  const lengthInput = document.createElement("input");
  lengthInput.className = "settings-number";
  lengthInput.type = "number";
  lengthInput.name = "passwordLength";
  lengthInput.min = String(PASSWORD_LENGTH_MIN);
  lengthInput.max = String(PASSWORD_LENGTH_MAX);
  lengthInput.step = "1";
  lengthInput.value = String(passwordPanelOptions.length);
  const lengthHint = document.createElement("span");
  lengthHint.className = "settings-row-hint";
  lengthHint.textContent = `${PASSWORD_LENGTH_MIN}-${PASSWORD_LENGTH_MAX}`;
  lengthRow.append(lengthLabel, lengthInput, lengthHint);

  const countRow = document.createElement("label");
  countRow.className = "settings-row";
  const countLabel = document.createElement("span");
  countLabel.className = "settings-row-label";
  countLabel.textContent = "\u751f\u6210\u6570\u91cf";
  const countInput = document.createElement("input");
  countInput.className = "settings-number";
  countInput.type = "number";
  countInput.name = "passwordCount";
  countInput.min = String(PASSWORD_COUNT_MIN);
  countInput.max = String(PASSWORD_COUNT_MAX);
  countInput.step = "1";
  countInput.value = String(passwordPanelOptions.count);
  const countHint = document.createElement("span");
  countHint.className = "settings-row-hint";
  countHint.textContent = `${PASSWORD_COUNT_MIN}-${PASSWORD_COUNT_MAX}`;
  countRow.append(countLabel, countInput, countHint);

  const symbolsRow = document.createElement("label");
  symbolsRow.className = "settings-row";
  const symbolsLabel = document.createElement("span");
  symbolsLabel.className = "settings-row-label";
  symbolsLabel.textContent = "\u7279\u6b8a\u7b26\u53f7";
  const symbolsWrap = document.createElement("div");
  symbolsWrap.className = "password-checkbox-wrap";
  const symbolsInput = document.createElement("input");
  symbolsInput.type = "checkbox";
  symbolsInput.name = "passwordSymbols";
  symbolsInput.className = "password-checkbox";
  symbolsInput.checked = passwordPanelOptions.includeSymbols;
  const symbolsText = document.createElement("span");
  symbolsText.className = "settings-row-hint";
  symbolsText.textContent = "\u542f\u7528";
  symbolsWrap.append(symbolsInput, symbolsText);
  const symbolsHint = document.createElement("span");
  symbolsHint.className = "settings-row-hint";
  symbolsHint.textContent = "\u4f8b\uff1a!@#$%";
  symbolsRow.append(symbolsLabel, symbolsWrap, symbolsHint);

  const outputRow = createPasswordResultRow(passwordPanelGenerated);

  const actions = document.createElement("div");
  actions.className = "settings-actions";
  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "settings-btn settings-btn-secondary";
  clearButton.textContent = "\u6e05\u7a7a\u7ed3\u679c";
  clearButton.addEventListener("click", () => {
    passwordPanelGenerated = [];
    renderList();
  });

  const generateButton = document.createElement("button");
  generateButton.type = "submit";
  generateButton.className = "settings-btn settings-btn-primary";
  generateButton.textContent = "\u751f\u6210\u5e76\u590d\u5236";

  actions.append(clearButton, generateButton);

  form.append(lengthRow, countRow, symbolsRow, outputRow, actions);
  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function buildWebtoolsPasswordGenerateTarget(
  options: WebtoolsPasswordOptions
): string {
  const params = new URLSearchParams();
  params.set("action", "generate");
  params.set("copy", "0");
  params.set("length", String(options.length));
  params.set("count", String(options.count));
  params.set("lower", options.includeLowercase ? "1" : "0");
  params.set("upper", options.includeUppercase ? "1" : "0");
  params.set("digits", options.includeDigits ? "1" : "0");
  params.set("symbols", options.includeSymbols ? "1" : "0");
  params.set("symbolChars", options.symbolChars);
  params.set("excludeSimilar", options.excludeSimilar ? "1" : "0");
  return `command:plugin:${WEBTOOLS_PASSWORD_PLUGIN_ID}?${params.toString()}`;
}

function extractWebtoolsPasswordOptionsFromUnknown(
  value: unknown
): Partial<WebtoolsPasswordOptions> {
  const record = toRecord(value);
  if (!record) {
    return {};
  }

  return {
    length: typeof record.length === "number" ? record.length : undefined,
    count: typeof record.count === "number" ? record.count : undefined,
    includeLowercase:
      typeof record.includeLowercase === "boolean"
        ? record.includeLowercase
        : undefined,
    includeUppercase:
      typeof record.includeUppercase === "boolean"
        ? record.includeUppercase
        : undefined,
    includeDigits:
      typeof record.includeDigits === "boolean" ? record.includeDigits : undefined,
    includeSymbols:
      typeof record.includeSymbols === "boolean" ? record.includeSymbols : undefined,
    symbolChars:
      typeof record.symbolChars === "string" ? record.symbolChars : undefined,
    excludeSimilar:
      typeof record.excludeSimilar === "boolean"
        ? record.excludeSimilar
        : undefined
  };
}

function normalizeStrength(value: string | undefined): WebtoolsPasswordResultRow["strength"] {
  if (value === "弱" || value === "中" || value === "强" || value === "很强") {
    return value;
  }
  return "中";
}

function extractWebtoolsPasswordRows(result: ExecuteResult): WebtoolsPasswordResultRow[] {
  const rawRows = result.data?.rows;
  if (Array.isArray(rawRows)) {
    const parsed: WebtoolsPasswordResultRow[] = [];
    for (const item of rawRows) {
      const record = toRecord(item);
      if (!record) {
        continue;
      }

      if (typeof record.password !== "string") {
        continue;
      }

      const password = record.password.trim();
      if (!password) {
        continue;
      }

      parsed.push({
        password,
        strength: normalizeStrength(
          typeof record.strength === "string" ? record.strength : undefined
        )
      });
    }

    if (parsed.length > 0) {
      return parsed;
    }
  }

  return extractGeneratedPasswords(result).map((password) => ({
    password,
    strength: "中"
  }));
}

function createWebtoolsPasswordResultTable(
  rows: WebtoolsPasswordResultRow[]
): HTMLDivElement {
  const outputRow = document.createElement("div");
  outputRow.className = "password-output-row";

  const outputLabel = document.createElement("div");
  outputLabel.className = "settings-row-label";
  outputLabel.textContent = "生成结果";

  const tableWrap = document.createElement("div");
  tableWrap.className = "webtools-password-table-wrap";

  if (rows.length === 0) {
    const empty = document.createElement("div");
    empty.className = "password-result-empty";
    empty.textContent = "点击“生成密码”后，结果会显示在这里";
    tableWrap.appendChild(empty);
    outputRow.append(outputLabel, tableWrap);
    return outputRow;
  }

  const table = document.createElement("table");
  table.className = "webtools-password-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["序号", "密码串", "强度评估", "操作"].forEach((title) => {
    const th = document.createElement("th");
    th.textContent = title;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  const tbody = document.createElement("tbody");
  rows.forEach((row, index) => {
    const tr = document.createElement("tr");

    const indexCell = document.createElement("td");
    indexCell.textContent = String(index + 1);

    const passwordCell = document.createElement("td");
    passwordCell.className = "webtools-password-cell-value";
    passwordCell.textContent = row.password;
    passwordCell.title = row.password;

    const strengthCell = document.createElement("td");
    const strengthBadge = document.createElement("span");
    strengthBadge.className = "webtools-password-strength";
    if (row.strength === "弱") {
      strengthBadge.classList.add("webtools-password-strength-weak");
    } else if (row.strength === "中") {
      strengthBadge.classList.add("webtools-password-strength-medium");
    } else if (row.strength === "强") {
      strengthBadge.classList.add("webtools-password-strength-strong");
    } else {
      strengthBadge.classList.add("webtools-password-strength-very-strong");
    }
    strengthBadge.textContent = row.strength;
    strengthCell.appendChild(strengthBadge);

    const actionCell = document.createElement("td");
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "settings-btn settings-btn-secondary webtools-password-copy-btn";
    copyButton.textContent = "复制";
    copyButton.addEventListener("click", () => {
      void (async () => {
        const copied = await copyTextToClipboard(row.password);
        if (copied) {
          setStatus(`已复制第 ${index + 1} 条密码`);
          return;
        }
        setStatus("复制失败，请手动复制");
      })();
    });
    actionCell.appendChild(copyButton);

    tr.append(indexCell, passwordCell, strengthCell, actionCell);
    tbody.appendChild(tr);
  });

  table.append(thead, tbody);
  tableWrap.appendChild(table);
  outputRow.append(outputLabel, tableWrap);
  return outputRow;
}

function refreshWebtoolsPasswordResultInForm(form: HTMLFormElement): void {
  const host = form.querySelector(".webtools-password-result-host");
  if (!(host instanceof HTMLDivElement)) {
    return;
  }
  host.replaceChildren(createWebtoolsPasswordResultTable(webtoolsPasswordRows));
}

function applyWebtoolsPasswordPanelPayload(panel: ActivePluginPanelState): void {
  const optionsRaw = panel.data?.options;
  const parsed = extractWebtoolsPasswordOptionsFromUnknown(optionsRaw);
  webtoolsPasswordOptions = normalizeWebtoolsPasswordOptions(
    parsed,
    webtoolsPasswordOptions
  );
  webtoolsPasswordRows = [];
}

async function generateFromWebtoolsPasswordPanel(
  form: HTMLFormElement,
  options: { render?: boolean } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法生成密码");
    return;
  }
  const shouldRender = options.render ?? true;

  const lengthNode = form.elements.namedItem("webtoolsLength");
  const countNode = form.elements.namedItem("webtoolsCount");
  const lowerNode = form.elements.namedItem("webtoolsLowercase");
  const upperNode = form.elements.namedItem("webtoolsUppercase");
  const digitsNode = form.elements.namedItem("webtoolsDigits");
  const symbolsNode = form.elements.namedItem("webtoolsSymbols");
  const symbolCharsNode = form.elements.namedItem("webtoolsSymbolChars");
  const excludeSimilarNode = form.elements.namedItem("webtoolsExcludeSimilar");
  const readNumberField = (
    node: Element | RadioNodeList | null,
    fallback: number
  ): number => {
    if (node instanceof HTMLInputElement || node instanceof HTMLSelectElement) {
      const parsed = Number(node.value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return fallback;
  };

  const inputOptions: Partial<WebtoolsPasswordOptions> = {
    length: readNumberField(lengthNode, webtoolsPasswordOptions.length),
    count: readNumberField(countNode, webtoolsPasswordOptions.count),
    includeLowercase: lowerNode instanceof HTMLInputElement ? lowerNode.checked : undefined,
    includeUppercase: upperNode instanceof HTMLInputElement ? upperNode.checked : undefined,
    includeDigits: digitsNode instanceof HTMLInputElement ? digitsNode.checked : undefined,
    includeSymbols: symbolsNode instanceof HTMLInputElement ? symbolsNode.checked : undefined,
    symbolChars:
      symbolCharsNode instanceof HTMLInputElement
        ? symbolCharsNode.value
        : undefined,
    excludeSimilar:
      excludeSimilarNode instanceof HTMLInputElement
        ? excludeSimilarNode.checked
        : undefined
  };

  const normalized = normalizeWebtoolsPasswordOptions(
    inputOptions,
    webtoolsPasswordOptions
  );
  webtoolsPasswordOptions = normalized;
  const requestToken = ++webtoolsPasswordRequestToken;

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_PASSWORD_PLUGIN_ID}`,
    type: "command",
    title: "密码工具",
    subtitle: "面板生成",
    target: buildWebtoolsPasswordGenerateTarget(normalized),
    keywords: ["plugin", "password", "pwd", "密码", "随机密码"]
  };

  const result = await launcher.execute(item);
  if (requestToken !== webtoolsPasswordRequestToken) {
    return;
  }
  if (!result.ok) {
    setStatus(result.message ?? "密码生成失败");
    return;
  }

  webtoolsPasswordRows = extractWebtoolsPasswordRows(result);
  setStatus("密码已生成");
  if (shouldRender) {
    renderList();
    return;
  }

  refreshWebtoolsPasswordResultInForm(form);
}

function renderWebtoolsPasswordPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const form = document.createElement("form");
  form.className = "settings-form webtools-password-form webtools-password-lab";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void generateFromWebtoolsPasswordPanel(form, { render: false });
  });

  const hero = document.createElement("h3");
  hero.className = "webtools-password-hero";
  hero.textContent = "随机密码";

  const createOptionRow = (labelText: string): {
    row: HTMLDivElement;
    main: HTMLDivElement;
  } => {
    const row = document.createElement("div");
    row.className = "webtools-password-option";

    const label = document.createElement("div");
    label.className = "webtools-password-option-label";
    label.textContent = labelText;

    const main = document.createElement("div");
    main.className = "webtools-password-option-main";

    row.append(label, main);
    return { row, main };
  };

  const charsRowNodes = createOptionRow("字符选项");
  const charsWrap = document.createElement("div");
  charsWrap.className = "webtools-password-flags";

  const lowerWrap = document.createElement("label");
  lowerWrap.className = "webtools-password-flag";
  const lowerInput = document.createElement("input");
  lowerInput.type = "checkbox";
  lowerInput.name = "webtoolsLowercase";
  lowerInput.className = "password-checkbox";
  lowerInput.checked = webtoolsPasswordOptions.includeLowercase;
  const lowerText = document.createElement("span");
  lowerText.textContent = "小写字母 (a-z)";
  lowerWrap.append(lowerInput, lowerText);

  const upperWrap = document.createElement("label");
  upperWrap.className = "webtools-password-flag";
  const upperInput = document.createElement("input");
  upperInput.type = "checkbox";
  upperInput.name = "webtoolsUppercase";
  upperInput.className = "password-checkbox";
  upperInput.checked = webtoolsPasswordOptions.includeUppercase;
  const upperText = document.createElement("span");
  upperText.textContent = "大写字母 (A-Z)";
  upperWrap.append(upperInput, upperText);

  const digitsWrap = document.createElement("label");
  digitsWrap.className = "webtools-password-flag";
  const digitsInput = document.createElement("input");
  digitsInput.type = "checkbox";
  digitsInput.name = "webtoolsDigits";
  digitsInput.className = "password-checkbox";
  digitsInput.checked = webtoolsPasswordOptions.includeDigits;
  const digitsText = document.createElement("span");
  digitsText.textContent = "数字 (0-9)";
  digitsWrap.append(digitsInput, digitsText);

  charsWrap.append(lowerWrap, upperWrap, digitsWrap);
  charsRowNodes.main.append(charsWrap);

  const symbolsRowNodes = createOptionRow("特殊字符");
  const symbolsWrap = document.createElement("div");
  symbolsWrap.className = "webtools-password-symbols";

  const includeSymbolsWrap = document.createElement("label");
  includeSymbolsWrap.className = "webtools-password-flag";
  const includeSymbolsInput = document.createElement("input");
  includeSymbolsInput.type = "checkbox";
  includeSymbolsInput.name = "webtoolsSymbols";
  includeSymbolsInput.className = "password-checkbox";
  includeSymbolsInput.checked = webtoolsPasswordOptions.includeSymbols;
  const includeSymbolsText = document.createElement("span");
  includeSymbolsText.textContent = "特殊字符";
  includeSymbolsWrap.append(includeSymbolsInput, includeSymbolsText);

  const symbolsInput = document.createElement("input");
  symbolsInput.className = "settings-value webtools-password-symbol-input";
  symbolsInput.type = "text";
  symbolsInput.name = "webtoolsSymbolChars";
  symbolsInput.value = webtoolsPasswordOptions.symbolChars;
  symbolsInput.placeholder = "!@#$%^&*";

  const excludeSimilarWrap = document.createElement("label");
  excludeSimilarWrap.className = "webtools-password-flag";
  const excludeSimilarInput = document.createElement("input");
  excludeSimilarInput.type = "checkbox";
  excludeSimilarInput.name = "webtoolsExcludeSimilar";
  excludeSimilarInput.className = "password-checkbox";
  excludeSimilarInput.checked = webtoolsPasswordOptions.excludeSimilar;
  const excludeSimilarText = document.createElement("span");
  excludeSimilarText.textContent = "排除相似字符";
  excludeSimilarWrap.append(excludeSimilarInput, excludeSimilarText);

  symbolsWrap.append(includeSymbolsWrap, symbolsInput, excludeSimilarWrap);
  symbolsRowNodes.main.append(symbolsWrap);

  const lengthRowNodes = createOptionRow("密码长度");
  const lengthInput = document.createElement("select");
  lengthInput.className = "settings-number webtools-password-length-select";
  lengthInput.name = "webtoolsLength";
  [
    { value: 8, label: "8 位密码 (低强度)" },
    { value: 12, label: "12 位密码 (中强度)" },
    { value: 16, label: "16 位密码 (高强度)" },
    { value: 20, label: "20 位密码 (高强度)" },
    { value: 32, label: "32 位密码 (极高强度)" },
    { value: 64, label: "64 位密码 (极高强度)" }
  ].forEach((entry) => {
    const option = document.createElement("option");
    option.value = String(entry.value);
    option.textContent = entry.label;
    option.selected = entry.value === webtoolsPasswordOptions.length;
    lengthInput.appendChild(option);
  });
  if (lengthInput.selectedIndex === -1) {
    const fallback = document.createElement("option");
    fallback.value = String(webtoolsPasswordOptions.length);
    fallback.textContent = `${webtoolsPasswordOptions.length} 位密码 (自定义)`;
    fallback.selected = true;
    lengthInput.appendChild(fallback);
  }
  const lengthHint = document.createElement("span");
  lengthHint.className = "webtools-password-safe-hint";
  lengthHint.textContent = "密码长度很安全";
  lengthRowNodes.main.append(lengthInput, lengthHint);

  const countRowNodes = createOptionRow("生成数量");
  const countInput = document.createElement("select");
  countInput.className = "settings-number webtools-password-count-select";
  countInput.name = "webtoolsCount";
  [1, 5, 10, 20, 50].forEach((count) => {
    const option = document.createElement("option");
    option.value = String(count);
    option.textContent = String(count);
    option.selected = count === webtoolsPasswordOptions.count;
    countInput.appendChild(option);
  });
  if (countInput.selectedIndex === -1) {
    const fallback = document.createElement("option");
    fallback.value = String(webtoolsPasswordOptions.count);
    fallback.textContent = String(webtoolsPasswordOptions.count);
    fallback.selected = true;
    countInput.appendChild(fallback);
  }
  countRowNodes.main.append(countInput);

  const outputHost = document.createElement("div");
  outputHost.className = "webtools-password-result-host";
  outputHost.appendChild(createWebtoolsPasswordResultTable(webtoolsPasswordRows));

  const generateWrap = document.createElement("div");
  generateWrap.className = "webtools-password-generate-wrap";

  const generateButton = document.createElement("button");
  generateButton.type = "submit";
  generateButton.className = "settings-btn settings-btn-primary webtools-password-generate-btn";
  generateButton.textContent = "生成密码";
  generateWrap.appendChild(generateButton);

  const actions = document.createElement("div");
  actions.className = "settings-actions webtools-password-tools-actions";

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "settings-btn settings-btn-secondary";
  clearButton.textContent = "清空结果";
  clearButton.addEventListener("click", () => {
    webtoolsPasswordRows = [];
    refreshWebtoolsPasswordResultInForm(form);
    setStatus("已清空密码结果");
  });

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "settings-btn settings-btn-secondary";
  backButton.textContent = "返回搜索";
  backButton.addEventListener("click", () => {
    backToSearch();
  });

  actions.append(clearButton, backButton);

  form.append(
    hero,
    charsRowNodes.row,
    symbolsRowNodes.row,
    lengthRowNodes.row,
    countRowNodes.row,
    generateWrap,
    outputHost,
    actions
  );
  panel.append(form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function applyWebtoolsJsonPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;

  const input =
    data && typeof data.input === "string"
      ? data.input
      : webtoolsJsonState.input;
  const sourceFormat =
    data &&
    (data.sourceFormat === "json" ||
      data.sourceFormat === "csv" ||
      data.sourceFormat === "text" ||
      data.sourceFormat === "escaped")
      ? data.sourceFormat
      : webtoolsJsonState.sourceFormat;
  const targetFormat =
    data &&
    (data.targetFormat === "json" ||
      data.targetFormat === "csv" ||
      data.targetFormat === "text" ||
      data.targetFormat === "escaped")
      ? data.targetFormat
      : webtoolsJsonState.targetFormat;
  const compressed =
    data && typeof data.compressed === "boolean"
      ? data.compressed
      : webtoolsJsonState.compressed;

  webtoolsJsonState = {
    input,
    output: "",
    info: "",
    valid: null,
    sourceFormat,
    targetFormat,
    compressed
  };
}

function buildWebtoolsJsonTarget(): string {
  const params = new URLSearchParams();
  params.set("action", "convert");
  params.set("input", webtoolsJsonState.input);
  params.set("sourceFormat", webtoolsJsonState.sourceFormat);
  params.set("targetFormat", webtoolsJsonState.targetFormat);
  params.set("compressed", webtoolsJsonState.compressed ? "1" : "0");
  return `command:plugin:${WEBTOOLS_JSON_PLUGIN_ID}?${params.toString()}`;
}

function buildWebtoolsJsonInfoState(): {
  text: string;
  state: "ok" | "error" | "idle";
} {
  if (webtoolsJsonState.valid === true) {
    return {
      text: `校验通过${webtoolsJsonState.info ? ` · ${webtoolsJsonState.info}` : ""}`,
      state: "ok"
    };
  }
  if (webtoolsJsonState.valid === false) {
    return {
      text: `处理失败${webtoolsJsonState.info ? ` · ${webtoolsJsonState.info}` : ""}`,
      state: "error"
    };
  }
  return {
    text: webtoolsJsonState.info || "请选择格式并输入，结果会自动转换",
    state: "idle"
  };
}

function refreshWebtoolsJsonResultInForm(form: HTMLFormElement): void {
  const outputNode = form.elements.namedItem("webtoolsJsonOutput");
  if (outputNode instanceof HTMLTextAreaElement) {
    outputNode.value = webtoolsJsonState.output;
  }

  const infoNode = form.querySelector(".webtools-json-info");
  if (infoNode instanceof HTMLDivElement) {
    const infoState = buildWebtoolsJsonInfoState();
    infoNode.textContent = infoState.text;
    infoNode.dataset.state = infoState.state;
  }
}

function scheduleWebtoolsJsonAutoConvert(
  form: HTMLFormElement,
  immediate = false
): void {
  if (webtoolsJsonAutoTimer !== null) {
    window.clearTimeout(webtoolsJsonAutoTimer);
  }

  webtoolsJsonAutoTimer = window.setTimeout(() => {
    webtoolsJsonAutoTimer = null;
    if (!form.isConnected) {
      return;
    }
    void executeWebtoolsJsonConvert(form, { render: false });
  }, immediate ? 0 : 220);
}

async function executeWebtoolsJsonConvert(
  form: HTMLFormElement,
  options: { render?: boolean } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行 JSON 工具");
    return;
  }
  const shouldRender = options.render ?? true;

  const inputNode = form.elements.namedItem("webtoolsJsonInput");
  const sourceNode = form.elements.namedItem("webtoolsJsonSource");
  const targetNode = form.elements.namedItem("webtoolsJsonTarget");
  const compressedNode = form.elements.namedItem("webtoolsJsonCompressed");

  webtoolsJsonState.input =
    inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
  webtoolsJsonState.sourceFormat =
    sourceNode instanceof HTMLSelectElement &&
    (sourceNode.value === "json" ||
      sourceNode.value === "csv" ||
      sourceNode.value === "text" ||
      sourceNode.value === "escaped")
      ? sourceNode.value
      : "text";
  webtoolsJsonState.targetFormat =
    targetNode instanceof HTMLSelectElement &&
    (targetNode.value === "json" ||
      targetNode.value === "csv" ||
      targetNode.value === "text" ||
      targetNode.value === "escaped")
      ? targetNode.value
      : "json";
  webtoolsJsonState.compressed =
    compressedNode instanceof HTMLInputElement ? compressedNode.checked : false;
  const requestToken = ++webtoolsJsonRequestToken;

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_JSON_PLUGIN_ID}:convert`,
    type: "command",
    title: "JSON 工具",
    subtitle: "面板执行",
    target: buildWebtoolsJsonTarget(),
    keywords: ["plugin", "json", "csv", "format", "convert", "实验室"]
  };

  const result = await launcher.execute(item);
  if (requestToken !== webtoolsJsonRequestToken) {
    return;
  }
  const data = toRecord(result.data);

  webtoolsJsonState.output =
    data && typeof data.output === "string" ? data.output : "";
  webtoolsJsonState.info =
    data && typeof data.info === "string" ? data.info : "";
  webtoolsJsonState.valid =
    data && typeof data.valid === "boolean" ? data.valid : null;

  setStatus(result.message ?? (result.ok ? "转换完成" : "转换失败"));
  if (shouldRender) {
    renderList();
    return;
  }
  refreshWebtoolsJsonResultInForm(form);
}

function renderWebtoolsJsonPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "JSON & CSV 实验室";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "支持 JSON/CSV/纯文本/Escaped 双向转换。";

  const form = document.createElement("form");
  form.className = "settings-form webtools-json-form webtools-json-lab";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsJsonConvert(form, { render: false });
  });

  const topActions = document.createElement("div");
  topActions.className = "webtools-json-toolbar";
  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "settings-btn settings-btn-secondary";
  clearButton.textContent = "清空";
  clearButton.addEventListener("click", () => {
    webtoolsJsonState.input = "";
    webtoolsJsonState.output = "";
    webtoolsJsonState.info = "";
    webtoolsJsonState.valid = null;
    inputArea.value = "";
    outputArea.value = "";
    refreshWebtoolsJsonResultInForm(form);
    setStatus("已清空输入与输出");
  });
  topActions.append(clearButton);

  const converterBar = document.createElement("div");
  converterBar.className = "webtools-json-converter";

  const sourceGroup = document.createElement("label");
  sourceGroup.className = "webtools-json-converter-group";
  const sourceLabel = document.createElement("span");
  sourceLabel.className = "webtools-json-converter-label";
  sourceLabel.textContent = "源格式";
  const sourceSelect = document.createElement("select");
  sourceSelect.className = "settings-number webtools-json-select";
  sourceSelect.name = "webtoolsJsonSource";
  [
    ["text", "纯文本"],
    ["json", "JSON"],
    ["csv", "CSV"],
    ["escaped", "Escaped"]
  ].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = webtoolsJsonState.sourceFormat === value;
    sourceSelect.appendChild(option);
  });
  sourceGroup.append(sourceLabel, sourceSelect);

  const swapButton = document.createElement("button");
  swapButton.type = "button";
  swapButton.className = "settings-btn settings-btn-secondary webtools-json-swap";
  swapButton.textContent = "⇅";

  const targetGroup = document.createElement("label");
  targetGroup.className = "webtools-json-converter-group";
  const targetLabel = document.createElement("span");
  targetLabel.className = "webtools-json-converter-label";
  targetLabel.textContent = "目标格式";
  const targetSelect = document.createElement("select");
  targetSelect.className = "settings-number webtools-json-select";
  targetSelect.name = "webtoolsJsonTarget";
  [
    ["json", "JSON"],
    ["csv", "CSV"],
    ["text", "纯文本"],
    ["escaped", "Escaped"]
  ].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = webtoolsJsonState.targetFormat === value;
    targetSelect.appendChild(option);
  });
  targetGroup.append(targetLabel, targetSelect);

  const formatHint = document.createElement("div");
  formatHint.className = "webtools-json-route";

  const inputArea = document.createElement("textarea");
  inputArea.className = "settings-value webtools-textarea webtools-json-textarea";
  inputArea.name = "webtoolsJsonInput";
  inputArea.placeholder = "请输入内容";
  inputArea.value = webtoolsJsonState.input;

  const compressedWrap = document.createElement("label");
  compressedWrap.className = "webtools-password-flag webtools-json-compressed";
  const compressedInput = document.createElement("input");
  compressedInput.type = "checkbox";
  compressedInput.className = "password-checkbox";
  compressedInput.name = "webtoolsJsonCompressed";
  compressedInput.checked = webtoolsJsonState.compressed;
  const compressedText = document.createElement("span");
  compressedText.textContent = "压缩输出 (Minify)";
  compressedWrap.append(compressedInput, compressedText);

  const outputMeta = document.createElement("div");
  outputMeta.className = "webtools-json-pane-controls";
  outputMeta.append(compressedWrap);

  const outputArea = document.createElement("textarea");
  outputArea.className = "settings-value webtools-textarea webtools-json-textarea";
  outputArea.name = "webtoolsJsonOutput";
  outputArea.readOnly = true;
  outputArea.placeholder = "转换后结果";
  outputArea.value = webtoolsJsonState.output;

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className =
    "settings-btn settings-btn-secondary webtools-json-copy-btn";
  copyButton.textContent = "复制";
  copyButton.addEventListener("click", () => {
    void (async () => {
      const copied = await copyTextToClipboard(outputArea.value);
      setStatus(copied ? "已复制输出内容" : "复制失败");
    })();
  });
  outputMeta.append(copyButton);

  const updateJsonFormHead = (): void => {
    const source = sourceSelect.value.toUpperCase();
    const target = targetSelect.value.toUpperCase();
    formatHint.textContent = `${source} -> ${target}`;
    compressedWrap.style.display = targetSelect.value === "json" ? "" : "none";
  };

  swapButton.addEventListener("click", () => {
    const source = sourceSelect.value;
    sourceSelect.value = (targetSelect.value || "json") as string;
    targetSelect.value = source as string;

    if (webtoolsJsonState.output.trim()) {
      inputArea.value = webtoolsJsonState.output;
      webtoolsJsonState.output = "";
      outputArea.value = "";
    }
    updateJsonFormHead();
    scheduleWebtoolsJsonAutoConvert(form, true);
  });

  sourceSelect.addEventListener("change", () => {
    updateJsonFormHead();
    scheduleWebtoolsJsonAutoConvert(form, true);
  });
  targetSelect.addEventListener("change", () => {
    updateJsonFormHead();
    scheduleWebtoolsJsonAutoConvert(form, true);
  });
  compressedInput.addEventListener("change", () => {
    scheduleWebtoolsJsonAutoConvert(form, true);
  });
  inputArea.addEventListener("input", () => {
    scheduleWebtoolsJsonAutoConvert(form);
  });
  updateJsonFormHead();

  converterBar.append(sourceGroup, swapButton, targetGroup);

  const editors = document.createElement("div");
  editors.className = "webtools-json-editors";

  const inputPane = document.createElement("section");
  inputPane.className = "webtools-json-pane";
  const inputHead = document.createElement("div");
  inputHead.className = "webtools-json-pane-head";
  const inputTitle = document.createElement("span");
  inputTitle.className = "webtools-json-pane-title";
  inputTitle.textContent = "输入";
  const inputMeta = document.createElement("span");
  inputMeta.className = "webtools-json-pane-meta";
  inputMeta.textContent = "源文本";
  inputHead.append(inputTitle, inputMeta);
  inputPane.append(inputHead, inputArea);

  const outputPane = document.createElement("section");
  outputPane.className = "webtools-json-pane";
  const outputHead = document.createElement("div");
  outputHead.className = "webtools-json-pane-head";
  const outputTitle = document.createElement("span");
  outputTitle.className = "webtools-json-pane-title";
  outputTitle.textContent = "输出";
  outputHead.append(outputTitle, outputMeta);
  outputPane.append(outputHead, outputArea);

  editors.append(inputPane, outputPane);

  const info = document.createElement("div");
  info.className = "webtools-json-info";
  const infoState = buildWebtoolsJsonInfoState();
  info.textContent = infoState.text;
  info.dataset.state = infoState.state;

  form.append(topActions, converterBar, formatHint, editors, info);
  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);

  scheduleWebtoolsJsonAutoConvert(form, true);
}

function applyWebtoolsUrlPanelPayload(panel: ActivePluginPanelState): void {
  const input =
    panel.data && typeof panel.data.input === "string"
      ? panel.data.input
      : webtoolsUrlState.input;

  webtoolsUrlState = {
    input,
    output: "",
    info: "",
    queryRows: []
  };
}

function buildWebtoolsUrlTarget(action: string, input: string): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("input", input);
  return `command:plugin:${WEBTOOLS_URL_PLUGIN_ID}?${params.toString()}`;
}

async function executeWebtoolsUrlAction(
  action: "parse" | "encode" | "decode",
  input: string
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行 URL 工具");
    return;
  }

  webtoolsUrlState.input = input;

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_URL_PLUGIN_ID}:${action}`,
    type: "command",
    title: "URL 解析",
    subtitle: "面板执行",
    target: buildWebtoolsUrlTarget(action, input),
    keywords: ["plugin", "url", "query", "参数", "解析", "编码", "解码"]
  };

  const result = await launcher.execute(item);
  const data = toRecord(result.data);

  webtoolsUrlState.output =
    data && typeof data.output === "string" ? data.output : "";
  webtoolsUrlState.info =
    data && typeof data.info === "string" ? data.info : "";

  const nextRows: WebtoolsUrlQueryRow[] = [];
  const rawRows = data?.queryRows;
  if (Array.isArray(rawRows)) {
    for (const row of rawRows) {
      const record = toRecord(row);
      if (!record) {
        continue;
      }
      if (typeof record.key !== "string" || typeof record.value !== "string") {
        continue;
      }
      nextRows.push({ key: record.key, value: record.value });
    }
  }
  webtoolsUrlState.queryRows = nextRows;

  setStatus(result.message ?? (result.ok ? "执行完成" : "执行失败"));
  renderList();
}

function renderWebtoolsUrlPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "URL 解析";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "支持 URL 拆解、编码、解码。";

  const form = document.createElement("form");
  form.className = "settings-form webtools-url-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const inputNode = form.elements.namedItem("webtoolsUrlInput");
    const input = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
    void executeWebtoolsUrlAction("parse", input);
  });

  const inputRow = document.createElement("label");
  inputRow.className = "settings-row webtools-row-full";
  const inputLabel = document.createElement("span");
  inputLabel.className = "settings-row-label";
  inputLabel.textContent = "URL / 文本";
  const inputArea = document.createElement("textarea");
  inputArea.className = "settings-value webtools-textarea";
  inputArea.name = "webtoolsUrlInput";
  inputArea.placeholder = "请输入 URL 或需要编码/解码的文本";
  inputArea.value = webtoolsUrlState.input;
  const inputHint = document.createElement("span");
  inputHint.className = "settings-row-hint";
  inputHint.textContent = "可直接粘贴链接";
  inputRow.append(inputLabel, inputArea, inputHint);

  const outputRow = document.createElement("div");
  outputRow.className = "settings-row webtools-row-full";
  const outputLabel = document.createElement("span");
  outputLabel.className = "settings-row-label";
  outputLabel.textContent = "结果";
  const outputArea = document.createElement("textarea");
  outputArea.className = "settings-value webtools-textarea";
  outputArea.readOnly = true;
  outputArea.placeholder = "执行后显示结果";
  outputArea.value = webtoolsUrlState.output;
  const outputHint = document.createElement("span");
  outputHint.className = "settings-row-hint";
  outputHint.textContent = webtoolsUrlState.info || "-";
  outputRow.append(outputLabel, outputArea, outputHint);

  const actions = document.createElement("div");
  actions.className = "settings-actions";

  const encodeButton = document.createElement("button");
  encodeButton.type = "button";
  encodeButton.className = "settings-btn settings-btn-secondary";
  encodeButton.textContent = "编码";
  encodeButton.addEventListener("click", () => {
    const inputNode = form.elements.namedItem("webtoolsUrlInput");
    const input = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
    void executeWebtoolsUrlAction("encode", input);
  });

  const decodeButton = document.createElement("button");
  decodeButton.type = "button";
  decodeButton.className = "settings-btn settings-btn-secondary";
  decodeButton.textContent = "解码";
  decodeButton.addEventListener("click", () => {
    const inputNode = form.elements.namedItem("webtoolsUrlInput");
    const input = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
    void executeWebtoolsUrlAction("decode", input);
  });

  const parseButton = document.createElement("button");
  parseButton.type = "submit";
  parseButton.className = "settings-btn settings-btn-primary";
  parseButton.textContent = "解析";

  actions.append(encodeButton, decodeButton, parseButton);

  form.append(inputRow, outputRow);

  if (webtoolsUrlState.queryRows.length > 0) {
    const tableWrap = document.createElement("div");
    tableWrap.className = "webtools-mini-table-wrap";
    const table = document.createElement("table");
    table.className = "webtools-mini-table";
    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    ["参数", "值"].forEach((titleText) => {
      const th = document.createElement("th");
      th.textContent = titleText;
      hr.appendChild(th);
    });
    thead.appendChild(hr);

    const tbody = document.createElement("tbody");
    for (const row of webtoolsUrlState.queryRows) {
      const tr = document.createElement("tr");
      const keyCell = document.createElement("td");
      keyCell.textContent = row.key;
      const valueCell = document.createElement("td");
      valueCell.textContent = row.value;
      tr.append(keyCell, valueCell);
      tbody.appendChild(tr);
    }

    table.append(thead, tbody);
    tableWrap.appendChild(table);
    form.appendChild(tableWrap);
  }

  form.append(actions);
  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function applyWebtoolsDiffPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  webtoolsDiffLeft = data && typeof data.left === "string" ? data.left : webtoolsDiffLeft;
  webtoolsDiffRight =
    data && typeof data.right === "string" ? data.right : webtoolsDiffRight;
  webtoolsDiffIgnoreCase =
    data && typeof data.ignoreCase === "boolean"
      ? data.ignoreCase
      : webtoolsDiffIgnoreCase;
  webtoolsDiffIgnoreWhitespace =
    data && typeof data.ignoreWhitespace === "boolean"
      ? data.ignoreWhitespace
      : webtoolsDiffIgnoreWhitespace;
  webtoolsDiffRows = [];
  webtoolsDiffSummary = null;
  webtoolsDiffTruncated = false;
}

function buildWebtoolsDiffTarget(): string {
  const params = new URLSearchParams();
  params.set("action", "compare");
  params.set("left", webtoolsDiffLeft);
  params.set("right", webtoolsDiffRight);
  params.set("ignoreCase", webtoolsDiffIgnoreCase ? "1" : "0");
  params.set("ignoreWhitespace", webtoolsDiffIgnoreWhitespace ? "1" : "0");
  return `command:plugin:${WEBTOOLS_DIFF_PLUGIN_ID}?${params.toString()}`;
}

async function executeWebtoolsDiffCompare(form: HTMLFormElement): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行文本对比");
    return;
  }

  const leftNode = form.elements.namedItem("webtoolsDiffLeft");
  const rightNode = form.elements.namedItem("webtoolsDiffRight");
  const ignoreCaseNode = form.elements.namedItem("webtoolsDiffIgnoreCase");
  const ignoreWhitespaceNode = form.elements.namedItem("webtoolsDiffIgnoreWhitespace");

  webtoolsDiffLeft = leftNode instanceof HTMLTextAreaElement ? leftNode.value : "";
  webtoolsDiffRight = rightNode instanceof HTMLTextAreaElement ? rightNode.value : "";
  webtoolsDiffIgnoreCase =
    ignoreCaseNode instanceof HTMLInputElement ? ignoreCaseNode.checked : false;
  webtoolsDiffIgnoreWhitespace =
    ignoreWhitespaceNode instanceof HTMLInputElement
      ? ignoreWhitespaceNode.checked
      : false;

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_DIFF_PLUGIN_ID}:compare`,
    type: "command",
    title: "文本对比",
    subtitle: "面板执行",
    target: buildWebtoolsDiffTarget(),
    keywords: ["plugin", "diff", "compare", "文本", "对比", "差异"]
  };

  const result = await launcher.execute(item);
  const data = toRecord(result.data);

  const rows: WebtoolsDiffRow[] = [];
  const rawRows = data?.rows;
  if (Array.isArray(rawRows)) {
    for (const row of rawRows) {
      const record = toRecord(row);
      if (!record) {
        continue;
      }

      if (
        typeof record.index !== "number" ||
        typeof record.left !== "string" ||
        typeof record.right !== "string" ||
        (record.type !== "same" &&
          record.type !== "added" &&
          record.type !== "removed" &&
          record.type !== "changed")
      ) {
        continue;
      }

      rows.push({
        index: record.index,
        type: record.type,
        left: record.left,
        right: record.right
      });
    }
  }
  webtoolsDiffRows = rows;

  const summaryRecord = toRecord(data?.summary);
  if (
    summaryRecord &&
    typeof summaryRecord.same === "number" &&
    typeof summaryRecord.added === "number" &&
    typeof summaryRecord.removed === "number" &&
    typeof summaryRecord.changed === "number" &&
    typeof summaryRecord.total === "number" &&
    typeof summaryRecord.shown === "number"
  ) {
    webtoolsDiffSummary = {
      same: summaryRecord.same,
      added: summaryRecord.added,
      removed: summaryRecord.removed,
      changed: summaryRecord.changed,
      total: summaryRecord.total,
      shown: summaryRecord.shown
    };
  } else {
    webtoolsDiffSummary = null;
  }

  webtoolsDiffTruncated =
    data && typeof data.truncated === "boolean" ? data.truncated : false;

  setStatus(result.message ?? (result.ok ? "对比完成" : "对比失败"));
  renderList();
}

function renderWebtoolsDiffPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "文本对比";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "按行比较左右文本，输出差异结果。";

  const form = document.createElement("form");
  form.className = "settings-form webtools-diff-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsDiffCompare(form);
  });

  const editors = document.createElement("div");
  editors.className = "webtools-diff-editors";

  const leftWrap = document.createElement("label");
  leftWrap.className = "webtools-diff-editor";
  const leftLabel = document.createElement("span");
  leftLabel.className = "settings-row-label";
  leftLabel.textContent = "左侧文本";
  const leftArea = document.createElement("textarea");
  leftArea.className = "settings-value webtools-textarea";
  leftArea.name = "webtoolsDiffLeft";
  leftArea.value = webtoolsDiffLeft;
  leftArea.placeholder = "输入左侧文本";
  leftWrap.append(leftLabel, leftArea);

  const rightWrap = document.createElement("label");
  rightWrap.className = "webtools-diff-editor";
  const rightLabel = document.createElement("span");
  rightLabel.className = "settings-row-label";
  rightLabel.textContent = "右侧文本";
  const rightArea = document.createElement("textarea");
  rightArea.className = "settings-value webtools-textarea";
  rightArea.name = "webtoolsDiffRight";
  rightArea.value = webtoolsDiffRight;
  rightArea.placeholder = "输入右侧文本";
  rightWrap.append(rightLabel, rightArea);

  editors.append(leftWrap, rightWrap);

  const optionsRow = document.createElement("div");
  optionsRow.className = "webtools-password-flags";

  const ignoreCaseWrap = document.createElement("label");
  ignoreCaseWrap.className = "webtools-password-flag";
  const ignoreCaseInput = document.createElement("input");
  ignoreCaseInput.type = "checkbox";
  ignoreCaseInput.name = "webtoolsDiffIgnoreCase";
  ignoreCaseInput.className = "password-checkbox";
  ignoreCaseInput.checked = webtoolsDiffIgnoreCase;
  const ignoreCaseText = document.createElement("span");
  ignoreCaseText.textContent = "忽略大小写";
  ignoreCaseWrap.append(ignoreCaseInput, ignoreCaseText);

  const ignoreWhitespaceWrap = document.createElement("label");
  ignoreWhitespaceWrap.className = "webtools-password-flag";
  const ignoreWhitespaceInput = document.createElement("input");
  ignoreWhitespaceInput.type = "checkbox";
  ignoreWhitespaceInput.name = "webtoolsDiffIgnoreWhitespace";
  ignoreWhitespaceInput.className = "password-checkbox";
  ignoreWhitespaceInput.checked = webtoolsDiffIgnoreWhitespace;
  const ignoreWhitespaceText = document.createElement("span");
  ignoreWhitespaceText.textContent = "忽略空白";
  ignoreWhitespaceWrap.append(ignoreWhitespaceInput, ignoreWhitespaceText);

  optionsRow.append(ignoreCaseWrap, ignoreWhitespaceWrap);

  const actions = document.createElement("div");
  actions.className = "settings-actions";
  const compareButton = document.createElement("button");
  compareButton.type = "submit";
  compareButton.className = "settings-btn settings-btn-primary";
  compareButton.textContent = "开始对比";
  actions.append(compareButton);

  form.append(editors, optionsRow, actions);

  if (webtoolsDiffSummary) {
    const summary = document.createElement("div");
    summary.className = "settings-description";
    summary.textContent =
      `总行数 ${webtoolsDiffSummary.total} · 相同 ${webtoolsDiffSummary.same} · 新增 ${webtoolsDiffSummary.added} · 删除 ${webtoolsDiffSummary.removed} · 变更 ${webtoolsDiffSummary.changed}` +
      (webtoolsDiffTruncated ? " · 结果已截断" : "");
    form.appendChild(summary);
  }

  if (webtoolsDiffRows.length > 0) {
    const tableWrap = document.createElement("div");
    tableWrap.className = "webtools-mini-table-wrap";
    const table = document.createElement("table");
    table.className = "webtools-mini-table";

    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    ["行", "类型", "左侧", "右侧"].forEach((titleText) => {
      const th = document.createElement("th");
      th.textContent = titleText;
      hr.appendChild(th);
    });
    thead.appendChild(hr);

    const tbody = document.createElement("tbody");
    for (const row of webtoolsDiffRows) {
      const tr = document.createElement("tr");
      tr.className = `webtools-diff-row-${row.type}`;

      const indexCell = document.createElement("td");
      indexCell.textContent = String(row.index);
      const typeCell = document.createElement("td");
      typeCell.textContent = row.type;
      const leftCell = document.createElement("td");
      leftCell.textContent = row.left;
      const rightCell = document.createElement("td");
      rightCell.textContent = row.right;

      tr.append(indexCell, typeCell, leftCell, rightCell);
      tbody.appendChild(tr);
    }

    table.append(thead, tbody);
    tableWrap.appendChild(table);
    form.appendChild(tableWrap);
  }

  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function applyWebtoolsTimestampPanelPayload(panel: ActivePluginPanelState): void {
  const input =
    panel.data && typeof panel.data.input === "string"
      ? panel.data.input
      : webtoolsTimestampInput;

  webtoolsTimestampInput = input;
  webtoolsTimestampOutput = "";
  webtoolsTimestampInfo = "";
}

function buildWebtoolsTimestampTarget(
  action: "toDate" | "toTimestamp",
  input: string
): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("input", input);
  return `command:plugin:${WEBTOOLS_TIMESTAMP_PLUGIN_ID}?${params.toString()}`;
}

async function executeWebtoolsTimestampAction(
  action: "toDate" | "toTimestamp",
  input: string
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行时间戳工具");
    return;
  }

  webtoolsTimestampInput = input;

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_TIMESTAMP_PLUGIN_ID}:${action}`,
    type: "command",
    title: "时间戳工具",
    subtitle: "面板执行",
    target: buildWebtoolsTimestampTarget(action, input),
    keywords: ["plugin", "timestamp", "time", "date", "时间戳", "日期", "转换"]
  };

  const result = await launcher.execute(item);
  const data = toRecord(result.data);
  webtoolsTimestampOutput =
    data && typeof data.output === "string" ? data.output : "";
  webtoolsTimestampInfo = data && typeof data.info === "string" ? data.info : "";

  setStatus(result.message ?? (result.ok ? "转换完成" : "转换失败"));
  renderList();
}

function renderWebtoolsTimestampPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "时间戳工具";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "支持时间戳与日期时间双向转换。";

  const form = document.createElement("form");
  form.className = "settings-form webtools-timestamp-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const inputNode = form.elements.namedItem("webtoolsTimestampInput");
    const input = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
    void executeWebtoolsTimestampAction("toDate", input);
  });

  const inputRow = document.createElement("label");
  inputRow.className = "settings-row webtools-row-full";
  const inputLabel = document.createElement("span");
  inputLabel.className = "settings-row-label";
  inputLabel.textContent = "输入";
  const inputArea = document.createElement("textarea");
  inputArea.className = "settings-value webtools-textarea";
  inputArea.name = "webtoolsTimestampInput";
  inputArea.placeholder =
    "输入时间戳或日期时间，例如 1712345678 或 2026-03-06 10:00:00";
  inputArea.value = webtoolsTimestampInput;
  const inputHint = document.createElement("span");
  inputHint.className = "settings-row-hint";
  inputHint.textContent = "时间戳支持秒或毫秒";
  inputRow.append(inputLabel, inputArea, inputHint);

  const outputRow = document.createElement("div");
  outputRow.className = "settings-row webtools-row-full";
  const outputLabel = document.createElement("span");
  outputLabel.className = "settings-row-label";
  outputLabel.textContent = "输出";
  const outputArea = document.createElement("textarea");
  outputArea.className = "settings-value webtools-textarea";
  outputArea.readOnly = true;
  outputArea.placeholder = "转换后结果";
  outputArea.value = webtoolsTimestampOutput;
  const outputHint = document.createElement("span");
  outputHint.className = "settings-row-hint";
  outputHint.textContent = webtoolsTimestampInfo || "-";
  outputRow.append(outputLabel, outputArea, outputHint);

  const actions = document.createElement("div");
  actions.className = "settings-actions";

  const toTimestampButton = document.createElement("button");
  toTimestampButton.type = "button";
  toTimestampButton.className = "settings-btn settings-btn-secondary";
  toTimestampButton.textContent = "转时间戳";
  toTimestampButton.addEventListener("click", () => {
    const inputNode = form.elements.namedItem("webtoolsTimestampInput");
    const input = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
    void executeWebtoolsTimestampAction("toTimestamp", input);
  });

  const toDateButton = document.createElement("button");
  toDateButton.type = "submit";
  toDateButton.className = "settings-btn settings-btn-primary";
  toDateButton.textContent = "转日期";

  actions.append(toTimestampButton, toDateButton);

  form.append(inputRow, outputRow, actions);
  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function applyWebtoolsRegexPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  if (data && typeof data.pattern === "string") {
    webtoolsRegexPattern = data.pattern;
  }
  if (data && typeof data.flags === "string") {
    webtoolsRegexFlags = data.flags || "g";
  }
  if (data && typeof data.input === "string") {
    webtoolsRegexInput = data.input;
  }
  if (data && typeof data.replacement === "string") {
    webtoolsRegexReplacement = data.replacement;
  }
  webtoolsRegexOutput = "";
  webtoolsRegexInfo = "";
  webtoolsRegexRows = [];
}

function buildWebtoolsRegexTarget(action: "test" | "replace"): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("pattern", webtoolsRegexPattern);
  params.set("flags", webtoolsRegexFlags);
  params.set("input", webtoolsRegexInput);
  params.set("replacement", webtoolsRegexReplacement);
  return `command:plugin:${WEBTOOLS_REGEX_PLUGIN_ID}?${params.toString()}`;
}

async function executeWebtoolsRegexAction(
  action: "test" | "replace",
  form: HTMLFormElement
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行正则工具");
    return;
  }

  const patternNode = form.elements.namedItem("webtoolsRegexPattern");
  const flagsNode = form.elements.namedItem("webtoolsRegexFlags");
  const inputNode = form.elements.namedItem("webtoolsRegexInput");
  const replacementNode = form.elements.namedItem("webtoolsRegexReplacement");

  webtoolsRegexPattern =
    patternNode instanceof HTMLInputElement ? patternNode.value : "";
  webtoolsRegexFlags = flagsNode instanceof HTMLInputElement ? flagsNode.value : "g";
  webtoolsRegexInput =
    inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
  webtoolsRegexReplacement =
    replacementNode instanceof HTMLInputElement ? replacementNode.value : "";

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_REGEX_PLUGIN_ID}:${action}`,
    type: "command",
    title: "正则工具",
    subtitle: "面板执行",
    target: buildWebtoolsRegexTarget(action),
    keywords: ["plugin", "regex", "regexp", "正则", "匹配", "替换"]
  };

  const result = await launcher.execute(item);
  const data = toRecord(result.data);

  webtoolsRegexOutput =
    data && typeof data.output === "string" ? data.output : "";
  webtoolsRegexInfo = data && typeof data.info === "string" ? data.info : "";

  const rows: WebtoolsRegexMatchRow[] = [];
  const rawRows = data?.rows;
  if (Array.isArray(rawRows)) {
    for (const row of rawRows) {
      const record = toRecord(row);
      if (!record) {
        continue;
      }
      if (
        typeof record.index !== "number" ||
        typeof record.match !== "string" ||
        !Array.isArray(record.groups)
      ) {
        continue;
      }

      const groups = record.groups
        .filter((item): item is string => typeof item === "string")
        .map((item) => item);

      rows.push({
        index: record.index,
        match: record.match,
        groups
      });
    }
  }
  webtoolsRegexRows = rows;

  setStatus(result.message ?? (result.ok ? "执行完成" : "执行失败"));
  renderList();
}

function renderWebtoolsRegexPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "正则工具";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "支持正则匹配测试和替换。";

  const form = document.createElement("form");
  form.className = "settings-form webtools-regex-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsRegexAction("test", form);
  });

  const patternRow = document.createElement("label");
  patternRow.className = "settings-row webtools-row-full";
  const patternLabel = document.createElement("span");
  patternLabel.className = "settings-row-label";
  patternLabel.textContent = "表达式";
  const patternInput = document.createElement("input");
  patternInput.className = "settings-value";
  patternInput.name = "webtoolsRegexPattern";
  patternInput.value = webtoolsRegexPattern;
  patternInput.placeholder = "例如: \\\\w+@\\\\w+\\\\.\\\\w+";
  const patternHint = document.createElement("span");
  patternHint.className = "settings-row-hint";
  patternHint.textContent = "JavaScript RegExp 语法";
  patternRow.append(patternLabel, patternInput, patternHint);

  const flagsRow = document.createElement("label");
  flagsRow.className = "settings-row";
  const flagsLabel = document.createElement("span");
  flagsLabel.className = "settings-row-label";
  flagsLabel.textContent = "Flags";
  const flagsInput = document.createElement("input");
  flagsInput.className = "settings-number";
  flagsInput.type = "text";
  flagsInput.name = "webtoolsRegexFlags";
  flagsInput.value = webtoolsRegexFlags;
  const flagsHint = document.createElement("span");
  flagsHint.className = "settings-row-hint";
  flagsHint.textContent = "常见: g i m";
  flagsRow.append(flagsLabel, flagsInput, flagsHint);

  const inputRow = document.createElement("label");
  inputRow.className = "settings-row webtools-row-full";
  const inputLabel = document.createElement("span");
  inputLabel.className = "settings-row-label";
  inputLabel.textContent = "输入文本";
  const inputArea = document.createElement("textarea");
  inputArea.className = "settings-value webtools-textarea";
  inputArea.name = "webtoolsRegexInput";
  inputArea.value = webtoolsRegexInput;
  inputArea.placeholder = "输入待匹配文本";
  const inputHint = document.createElement("span");
  inputHint.className = "settings-row-hint";
  inputHint.textContent = "支持多行";
  inputRow.append(inputLabel, inputArea, inputHint);

  const replacementRow = document.createElement("label");
  replacementRow.className = "settings-row webtools-row-full";
  const replacementLabel = document.createElement("span");
  replacementLabel.className = "settings-row-label";
  replacementLabel.textContent = "替换文本";
  const replacementInput = document.createElement("input");
  replacementInput.className = "settings-value";
  replacementInput.name = "webtoolsRegexReplacement";
  replacementInput.value = webtoolsRegexReplacement;
  replacementInput.placeholder = "replace 动作使用";
  const replacementHint = document.createElement("span");
  replacementHint.className = "settings-row-hint";
  replacementHint.textContent = "可用 $1 $2 引用分组";
  replacementRow.append(replacementLabel, replacementInput, replacementHint);

  const outputRow = document.createElement("div");
  outputRow.className = "settings-row webtools-row-full";
  const outputLabel = document.createElement("span");
  outputLabel.className = "settings-row-label";
  outputLabel.textContent = "输出";
  const outputArea = document.createElement("textarea");
  outputArea.className = "settings-value webtools-textarea";
  outputArea.readOnly = true;
  outputArea.value = webtoolsRegexOutput;
  outputArea.placeholder = "replace 动作结果会显示在这里";
  const outputHint = document.createElement("span");
  outputHint.className = "settings-row-hint";
  outputHint.textContent = webtoolsRegexInfo || "-";
  outputRow.append(outputLabel, outputArea, outputHint);

  const actions = document.createElement("div");
  actions.className = "settings-actions";

  const replaceButton = document.createElement("button");
  replaceButton.type = "button";
  replaceButton.className = "settings-btn settings-btn-secondary";
  replaceButton.textContent = "替换";
  replaceButton.addEventListener("click", () => {
    void executeWebtoolsRegexAction("replace", form);
  });

  const testButton = document.createElement("button");
  testButton.type = "submit";
  testButton.className = "settings-btn settings-btn-primary";
  testButton.textContent = "匹配测试";

  actions.append(replaceButton, testButton);

  form.append(patternRow, flagsRow, inputRow, replacementRow, outputRow, actions);

  if (webtoolsRegexRows.length > 0) {
    const tableWrap = document.createElement("div");
    tableWrap.className = "webtools-mini-table-wrap";
    const table = document.createElement("table");
    table.className = "webtools-mini-table";
    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    ["索引", "匹配内容", "分组"].forEach((titleText) => {
      const th = document.createElement("th");
      th.textContent = titleText;
      hr.appendChild(th);
    });
    thead.appendChild(hr);

    const tbody = document.createElement("tbody");
    for (const row of webtoolsRegexRows) {
      const tr = document.createElement("tr");
      const indexCell = document.createElement("td");
      indexCell.textContent = String(row.index);
      const matchCell = document.createElement("td");
      matchCell.textContent = row.match;
      const groupsCell = document.createElement("td");
      groupsCell.textContent = row.groups.join(" | ");
      tr.append(indexCell, matchCell, groupsCell);
      tbody.appendChild(tr);
    }

    table.append(thead, tbody);
    tableWrap.appendChild(table);
    form.appendChild(tableWrap);
  }

  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function applyWebtoolsCronPanelPayload(panel: ActivePluginPanelState): void {
  if (panel.data && typeof panel.data.expression === "string") {
    webtoolsCronExpression = panel.data.expression;
  }
  webtoolsCronReadable = "";
  webtoolsCronNextRun = "";
  webtoolsCronUpcoming = [];
}

function buildWebtoolsCronTarget(action: "parse" | "random", expression: string): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("expression", expression);
  return `command:plugin:${WEBTOOLS_CRON_PLUGIN_ID}?${params.toString()}`;
}

function getWebtoolsCronPartValues(expression: string): string[] {
  const parts = expression.trim().split(/\s+/).filter(Boolean);
  while (parts.length < 5) {
    parts.push("*");
  }
  return parts.slice(0, 5);
}

function refreshWebtoolsCronResultInForm(form: HTMLFormElement): void {
  const expressionNode = form.elements.namedItem("webtoolsCronExpression");
  if (expressionNode instanceof HTMLInputElement) {
    expressionNode.value = webtoolsCronExpression;
  }

  const readableNode = form.querySelector(".webtools-cron-readable");
  if (readableNode instanceof HTMLDivElement) {
    readableNode.textContent = webtoolsCronReadable || "-";
  }

  const nextNode = form.querySelector(".webtools-cron-next");
  if (nextNode instanceof HTMLSpanElement) {
    nextNode.textContent = webtoolsCronNextRun
      ? `下一次: ${webtoolsCronNextRun}`
      : "-";
  }

  const partValues = getWebtoolsCronPartValues(webtoolsCronExpression);
  const partCells = form.querySelectorAll<HTMLTableCellElement>(
    ".webtools-cron-part-cell"
  );
  partValues.forEach((value, index) => {
    const cell = partCells.item(index);
    if (cell) {
      cell.textContent = value;
    }
  });

  const upcomingNode = form.querySelector(".webtools-cron-upcoming-value");
  if (upcomingNode instanceof HTMLDivElement) {
    upcomingNode.textContent =
      webtoolsCronUpcoming.length > 0 ? webtoolsCronUpcoming.join("\n") : "-";
  }
}

function scheduleWebtoolsCronAutoParse(
  form: HTMLFormElement,
  immediate = false
): void {
  if (webtoolsCronAutoTimer !== null) {
    window.clearTimeout(webtoolsCronAutoTimer);
  }

  webtoolsCronAutoTimer = window.setTimeout(() => {
    webtoolsCronAutoTimer = null;
    if (!form.isConnected) {
      return;
    }
    const node = form.elements.namedItem("webtoolsCronExpression");
    const expression = node instanceof HTMLInputElement ? node.value : "";
    void executeWebtoolsCronAction("parse", expression, {
      render: false,
      form
    });
  }, immediate ? 0 : 260);
}

async function executeWebtoolsCronAction(
  action: "parse" | "random",
  expression: string,
  options: { render?: boolean; form?: HTMLFormElement } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行 Cron 工具");
    return;
  }
  const shouldRender = options.render ?? true;

  webtoolsCronExpression = expression;
  const requestToken = ++webtoolsCronRequestToken;

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_CRON_PLUGIN_ID}:${action}`,
    type: "command",
    title: "Cron 生成器",
    subtitle: "面板执行",
    target: buildWebtoolsCronTarget(action, expression),
    keywords: ["plugin", "cron", "schedule", "定时", "表达式"]
  };

  const result = await launcher.execute(item);
  if (requestToken !== webtoolsCronRequestToken) {
    return;
  }
  const data = toRecord(result.data);

  webtoolsCronExpression =
    data && typeof data.expression === "string"
      ? data.expression
      : webtoolsCronExpression;
  webtoolsCronReadable =
    data && typeof data.readable === "string" ? data.readable : "";
  webtoolsCronNextRun =
    data && typeof data.nextRun === "string" ? data.nextRun : "";

  const nextUpcoming: string[] = [];
  if (data && Array.isArray(data.upcoming)) {
    for (const value of data.upcoming) {
      if (typeof value === "string") {
        nextUpcoming.push(value);
      }
    }
  }
  webtoolsCronUpcoming = nextUpcoming;

  setStatus(result.message ?? (result.ok ? "解析完成" : "解析失败"));
  if (shouldRender) {
    renderList();
    return;
  }

  if (options.form) {
    refreshWebtoolsCronResultInForm(options.form);
  }
}

function renderWebtoolsCronPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "Cron 生成器";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "定时表达式解析与执行时间预测。";

  const cronPartValues = getWebtoolsCronPartValues(webtoolsCronExpression);

  const form = document.createElement("form");
  form.className = "settings-form webtools-cron-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const node = form.elements.namedItem("webtoolsCronExpression");
    const expression = node instanceof HTMLInputElement ? node.value : "";
    void executeWebtoolsCronAction("parse", expression, {
      render: false,
      form
    });
  });

  const expressionRow = document.createElement("label");
  expressionRow.className = "settings-row webtools-row-full";
  const expressionLabel = document.createElement("span");
  expressionLabel.className = "settings-row-label";
  expressionLabel.textContent = "Cron 表达式";
  const expressionInput = document.createElement("input");
  expressionInput.className = "settings-value";
  expressionInput.name = "webtoolsCronExpression";
  expressionInput.value = webtoolsCronExpression;
  expressionInput.placeholder = "例如: 5 4 * * *";
  expressionInput.addEventListener("input", () => {
    scheduleWebtoolsCronAutoParse(form);
  });
  expressionInput.addEventListener("change", () => {
    scheduleWebtoolsCronAutoParse(form, true);
  });
  const expressionHint = document.createElement("span");
  expressionHint.className = "settings-row-hint";
  expressionHint.textContent = "格式: 分 时 日 月 周";
  expressionRow.append(expressionLabel, expressionInput, expressionHint);

  const readableRow = document.createElement("div");
  readableRow.className = "settings-row webtools-row-full";
  const readableLabel = document.createElement("span");
  readableLabel.className = "settings-row-label";
  readableLabel.textContent = "可读描述";
  const readableValue = document.createElement("div");
  readableValue.className = "settings-value settings-wrap webtools-cron-readable";
  readableValue.textContent = webtoolsCronReadable || "-";
  const readableHint = document.createElement("span");
  readableHint.className = "settings-row-hint webtools-cron-next";
  readableHint.textContent = webtoolsCronNextRun
    ? `下一次: ${webtoolsCronNextRun}`
    : "-";
  readableRow.append(readableLabel, readableValue, readableHint);

  const partsWrap = document.createElement("div");
  partsWrap.className = "webtools-mini-table-wrap";
  const partsTable = document.createElement("table");
  partsTable.className = "webtools-mini-table";
  const partsHead = document.createElement("thead");
  const partsHeadRow = document.createElement("tr");
  ["分", "时", "日", "月", "周"].forEach((name) => {
    const th = document.createElement("th");
    th.textContent = name;
    partsHeadRow.appendChild(th);
  });
  partsHead.appendChild(partsHeadRow);
  const partsBody = document.createElement("tbody");
  const partsBodyRow = document.createElement("tr");
  cronPartValues.forEach((value) => {
    const td = document.createElement("td");
    td.className = "webtools-cron-part-cell";
    td.textContent = value;
    partsBodyRow.appendChild(td);
  });
  partsBody.appendChild(partsBodyRow);
  partsTable.append(partsHead, partsBody);
  partsWrap.appendChild(partsTable);

  const syntaxWrap = document.createElement("div");
  syntaxWrap.className = "webtools-mini-table-wrap";
  const syntaxTable = document.createElement("table");
  syntaxTable.className = "webtools-mini-table";
  const syntaxBody = document.createElement("tbody");
  [
    ["*", "任意值"],
    [",", "列表分隔符"],
    ["-", "数值范围"],
    ["/", "步进值"]
  ].forEach(([symbol, meaning]) => {
    const row = document.createElement("tr");
    const symbolCell = document.createElement("td");
    symbolCell.textContent = symbol;
    const meaningCell = document.createElement("td");
    meaningCell.textContent = meaning;
    row.append(symbolCell, meaningCell);
    syntaxBody.appendChild(row);
  });
  syntaxTable.appendChild(syntaxBody);
  syntaxWrap.appendChild(syntaxTable);

  const actions = document.createElement("div");
  actions.className = "settings-actions";

  const randomButton = document.createElement("button");
  randomButton.type = "button";
  randomButton.className = "settings-btn settings-btn-secondary";
  randomButton.textContent = "随机生成";
  randomButton.addEventListener("click", () => {
    const node = form.elements.namedItem("webtoolsCronExpression");
    const expression = node instanceof HTMLInputElement ? node.value : "";
    void executeWebtoolsCronAction("random", expression, {
      render: false,
      form
    });
  });

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "settings-btn settings-btn-secondary";
  copyButton.textContent = "复制";
  copyButton.addEventListener("click", () => {
    void (async () => {
      const copied = await copyTextToClipboard(expressionInput.value);
      setStatus(copied ? "已复制 Cron 表达式" : "复制失败");
    })();
  });

  actions.append(randomButton, copyButton);
  form.append(expressionRow, readableRow, partsWrap, syntaxWrap, actions);

  const listWrap = document.createElement("div");
  listWrap.className = "settings-row webtools-row-full";
  const listLabel = document.createElement("span");
  listLabel.className = "settings-row-label";
  listLabel.textContent = "未来 7 次执行";
  const listValue = document.createElement("div");
  listValue.className = "settings-value settings-wrap webtools-cron-upcoming-value";
  listValue.textContent =
    webtoolsCronUpcoming.length > 0 ? webtoolsCronUpcoming.join("\n") : "-";
  listValue.style.whiteSpace = "pre-line";
  listWrap.append(listLabel, listValue);
  form.appendChild(listWrap);

  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);

  scheduleWebtoolsCronAutoParse(form, true);
}

function applyWebtoolsCryptoPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  if (data && typeof data.algorithm === "string") {
    webtoolsCryptoAlgorithm = normalizeWebtoolsCryptoAlgorithm(data.algorithm);
  }
  if (data && (data.mode === "encrypt" || data.mode === "decrypt")) {
    webtoolsCryptoMode = data.mode;
  }
  if (data && typeof data.input === "string") {
    webtoolsCryptoInput = data.input;
  }
  if (data && typeof data.secretKey === "string") {
    webtoolsCryptoSecret = data.secretKey;
  }
  if (data && typeof data.iv === "string") {
    webtoolsCryptoIv = data.iv;
  }
  if (data && typeof data.publicKey === "string") {
    webtoolsCryptoPublicKey = data.publicKey;
  }
  if (data && typeof data.privateKey === "string") {
    webtoolsCryptoPrivateKey = data.privateKey;
  }
  if (
    data &&
    typeof data.rsaBits === "number" &&
    (data.rsaBits === 1024 || data.rsaBits === 2048 || data.rsaBits === 4096)
  ) {
    webtoolsCryptoRsaBits = data.rsaBits;
  }
  webtoolsCryptoOutput = "";
  webtoolsCryptoInfo = "";
}

function normalizeWebtoolsCryptoAlgorithm(value: string): string {
  const normalized = value.trim();
  return [
    "MD5",
    "SHA1",
    "SHA256",
    "SHA512",
    "AES",
    "DES",
    "RSA",
    "Ed25519",
    "Base64",
    "URL"
  ].includes(normalized)
    ? normalized
    : "MD5";
}

function webtoolsCryptoSupportsDecrypt(algorithm: string): boolean {
  return ["AES", "DES", "Base64", "URL", "RSA"].includes(algorithm);
}

function isWebtoolsCryptoSymmetricAlgorithm(algorithm: string): boolean {
  return algorithm === "AES" || algorithm === "DES";
}

function isWebtoolsCryptoAsymmetricAlgorithm(algorithm: string): boolean {
  return algorithm === "RSA" || algorithm === "Ed25519";
}

function refreshWebtoolsCryptoResultInForm(form: HTMLFormElement): void {
  const outputNode = form.elements.namedItem("webtoolsCryptoOutput");
  if (outputNode instanceof HTMLTextAreaElement) {
    outputNode.value = webtoolsCryptoOutput;
  }
  const infoNode = form.querySelector(".webtools-crypto-info");
  if (infoNode instanceof HTMLDivElement) {
    infoNode.textContent = webtoolsCryptoInfo;
    infoNode.style.display = webtoolsCryptoInfo ? "" : "none";
  }
}

function buildWebtoolsCryptoTarget(action: "process" | "generateKeys"): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("algorithm", webtoolsCryptoAlgorithm);
  params.set("mode", webtoolsCryptoMode);
  params.set("input", webtoolsCryptoInput);
  params.set("secretKey", webtoolsCryptoSecret);
  params.set("iv", webtoolsCryptoIv);
  params.set("publicKey", webtoolsCryptoPublicKey);
  params.set("privateKey", webtoolsCryptoPrivateKey);
  params.set("rsaBits", String(webtoolsCryptoRsaBits));
  return `command:plugin:${WEBTOOLS_CRYPTO_PLUGIN_ID}?${params.toString()}`;
}

function scheduleWebtoolsCryptoAutoProcess(
  form: HTMLFormElement,
  immediate = false
): void {
  if (webtoolsCryptoAutoTimer !== null) {
    window.clearTimeout(webtoolsCryptoAutoTimer);
  }

  webtoolsCryptoAutoTimer = window.setTimeout(() => {
    webtoolsCryptoAutoTimer = null;
    if (!form.isConnected) {
      return;
    }

    const inputNode = form.elements.namedItem("webtoolsCryptoInput");
    if (
      inputNode instanceof HTMLTextAreaElement &&
      inputNode.value.trim().length === 0
    ) {
      webtoolsCryptoInput = "";
      webtoolsCryptoOutput = "";
      webtoolsCryptoInfo = "";
      refreshWebtoolsCryptoResultInForm(form);
      setStatus("就绪");
      return;
    }

    void executeWebtoolsCryptoProcess(form, { render: false });
  }, immediate ? 0 : 260);
}

async function executeWebtoolsCryptoProcess(
  form: HTMLFormElement,
  options: { render?: boolean } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行加密工具");
    return;
  }
  const shouldRender = options.render ?? true;

  const algorithmNode = form.elements.namedItem("webtoolsCryptoAlgorithm");
  const modeNode = form.elements.namedItem("webtoolsCryptoMode");
  const inputNode = form.elements.namedItem("webtoolsCryptoInput");
  const secretNode = form.elements.namedItem("webtoolsCryptoSecret");
  const ivNode = form.elements.namedItem("webtoolsCryptoIv");
  const publicNode = form.elements.namedItem("webtoolsCryptoPublicKey");
  const privateNode = form.elements.namedItem("webtoolsCryptoPrivateKey");
  const rsaBitsNode = form.elements.namedItem("webtoolsCryptoRsaBits");

  webtoolsCryptoAlgorithm =
    algorithmNode instanceof HTMLSelectElement
      ? normalizeWebtoolsCryptoAlgorithm(algorithmNode.value)
      : "MD5";
  webtoolsCryptoMode =
    modeNode instanceof HTMLInputElement && modeNode.value === "decrypt"
      ? "decrypt"
      : "encrypt";
  if (!webtoolsCryptoSupportsDecrypt(webtoolsCryptoAlgorithm)) {
    webtoolsCryptoMode = "encrypt";
  }
  webtoolsCryptoInput = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
  webtoolsCryptoSecret = secretNode instanceof HTMLInputElement ? secretNode.value : "";
  webtoolsCryptoIv = ivNode instanceof HTMLInputElement ? ivNode.value : "";
  webtoolsCryptoPublicKey =
    publicNode instanceof HTMLTextAreaElement ? publicNode.value : "";
  webtoolsCryptoPrivateKey =
    privateNode instanceof HTMLTextAreaElement ? privateNode.value : "";
  webtoolsCryptoRsaBits =
    rsaBitsNode instanceof HTMLSelectElement
      ? Number(rsaBitsNode.value) || 2048
      : 2048;
  const requestToken = ++webtoolsCryptoRequestToken;

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_CRYPTO_PLUGIN_ID}:process`,
    type: "command",
    title: "加密工具",
    subtitle: "面板执行",
    target: buildWebtoolsCryptoTarget("process"),
    keywords: ["plugin", "crypto", "hash", "aes", "rsa", "加密"]
  };

  const result = await launcher.execute(item);
  if (requestToken !== webtoolsCryptoRequestToken) {
    return;
  }
  const data = toRecord(result.data);

  webtoolsCryptoOutput =
    data && typeof data.output === "string" ? data.output : "";
  webtoolsCryptoInfo =
    data && typeof data.info === "string" ? data.info : "";

  setStatus(result.message ?? (result.ok ? "处理完成" : "处理失败"));
  if (shouldRender) {
    renderList();
    return;
  }
  refreshWebtoolsCryptoResultInForm(form);
}

async function executeWebtoolsCryptoGenerateKeys(
  form: HTMLFormElement,
  options: { autoEncryptAfterRsaKeys?: boolean } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法生成密钥");
    return;
  }

  const algorithmNode = form.elements.namedItem("webtoolsCryptoAlgorithm");
  const rsaBitsNode = form.elements.namedItem("webtoolsCryptoRsaBits");
  webtoolsCryptoAlgorithm =
    algorithmNode instanceof HTMLSelectElement
      ? normalizeWebtoolsCryptoAlgorithm(algorithmNode.value)
      : "MD5";
  webtoolsCryptoRsaBits =
    rsaBitsNode instanceof HTMLSelectElement
      ? Number(rsaBitsNode.value) || 2048
      : 2048;

  if (!isWebtoolsCryptoAsymmetricAlgorithm(webtoolsCryptoAlgorithm)) {
    setStatus("当前算法不支持生成密钥");
    return;
  }

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_CRYPTO_PLUGIN_ID}:generateKeys`,
    type: "command",
    title: "加密工具",
    subtitle: "生成密钥",
    target: buildWebtoolsCryptoTarget("generateKeys"),
    keywords: ["plugin", "crypto", "rsa", "ed25519", "keys", "加密"]
  };

  const result = await launcher.execute(item);
  const data = toRecord(result.data);
  if (data && typeof data.publicKey === "string") {
    webtoolsCryptoPublicKey = data.publicKey;
  }
  if (data && typeof data.privateKey === "string") {
    webtoolsCryptoPrivateKey = data.privateKey;
  }
  if (
    data &&
    typeof data.rsaBits === "number" &&
    (data.rsaBits === 1024 || data.rsaBits === 2048 || data.rsaBits === 4096)
  ) {
    webtoolsCryptoRsaBits = data.rsaBits;
  }
  webtoolsCryptoInfo =
    data && typeof data.info === "string" ? data.info : webtoolsCryptoInfo;

  const publicNode = form.elements.namedItem("webtoolsCryptoPublicKey");
  if (publicNode instanceof HTMLTextAreaElement) {
    publicNode.value = webtoolsCryptoPublicKey;
  }
  const privateNode = form.elements.namedItem("webtoolsCryptoPrivateKey");
  if (privateNode instanceof HTMLTextAreaElement) {
    privateNode.value = webtoolsCryptoPrivateKey;
  }
  refreshWebtoolsCryptoResultInForm(form);
  setStatus(result.message ?? (result.ok ? "密钥生成完成" : "密钥生成失败"));

  if (!result.ok || !options.autoEncryptAfterRsaKeys || webtoolsCryptoAlgorithm !== "RSA") {
    return;
  }

  const inputNode = form.elements.namedItem("webtoolsCryptoInput");
  if (!(inputNode instanceof HTMLTextAreaElement) || inputNode.value.trim().length === 0) {
    return;
  }

  const modeNode = form.elements.namedItem("webtoolsCryptoMode");
  if (modeNode instanceof HTMLInputElement) {
    modeNode.value = "encrypt";
  }
  webtoolsCryptoMode = "encrypt";

  await executeWebtoolsCryptoProcess(form, { render: false });
}

function renderWebtoolsCryptoPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel webtools-crypto-panel";

  const form = document.createElement("form");
  form.className = "settings-form webtools-crypto-form webtools-crypto-lab";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsCryptoProcess(form, { render: false });
  });

  const header = document.createElement("div");
  header.className = "webtools-crypto-header";

  const title = document.createElement("h3");
  title.className = "settings-title webtools-crypto-title";
  title.textContent = activePluginPanel?.title || "加密助手";

  const toolbar = document.createElement("div");
  toolbar.className = "webtools-crypto-toolbar";

  const algorithmSelect = document.createElement("select");
  algorithmSelect.className = "settings-number webtools-crypto-select";
  algorithmSelect.name = "webtoolsCryptoAlgorithm";

  const appendGroupDivider = (labelText: string): void => {
    const divider = document.createElement("option");
    divider.value = `__group_${labelText}`;
    divider.textContent = `── ${labelText} ──`;
    divider.disabled = true;
    algorithmSelect.appendChild(divider);
  };
  const appendAlgorithmOption = (value: string): void => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = webtoolsCryptoAlgorithm === value;
    algorithmSelect.appendChild(option);
  };

  appendGroupDivider("哈希摘要");
  ["MD5", "SHA1", "SHA256", "SHA512"].forEach(appendAlgorithmOption);
  appendGroupDivider("对称加密");
  ["AES", "DES"].forEach(appendAlgorithmOption);
  appendGroupDivider("非对称 (RSA)");
  ["RSA", "Ed25519"].forEach(appendAlgorithmOption);
  appendGroupDivider("编码转换");
  ["Base64", "URL"].forEach(appendAlgorithmOption);

  const modeInput = document.createElement("input");
  modeInput.type = "hidden";
  modeInput.name = "webtoolsCryptoMode";
  modeInput.value = webtoolsCryptoMode;

  const modeSwitch = document.createElement("div");
  modeSwitch.className = "webtools-crypto-mode-switch";
  const encryptButton = document.createElement("button");
  encryptButton.type = "button";
  encryptButton.className = "webtools-crypto-mode-btn";
  encryptButton.textContent = "加密";
  encryptButton.addEventListener("click", () => {
    modeInput.value = "encrypt";
    webtoolsCryptoMode = "encrypt";
    updateCryptoUiState();
    scheduleWebtoolsCryptoAutoProcess(form, true);
  });
  const decryptButton = document.createElement("button");
  decryptButton.type = "button";
  decryptButton.className = "webtools-crypto-mode-btn";
  decryptButton.textContent = "解密";
  decryptButton.addEventListener("click", () => {
    modeInput.value = "decrypt";
    webtoolsCryptoMode = "decrypt";
    updateCryptoUiState();
    scheduleWebtoolsCryptoAutoProcess(form, true);
  });
  modeSwitch.append(encryptButton, decryptButton);

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "settings-btn settings-btn-secondary";
  clearButton.textContent = "清空";
  clearButton.addEventListener("click", () => {
    const inputNode = form.elements.namedItem("webtoolsCryptoInput");
    if (inputNode instanceof HTMLTextAreaElement) {
      inputNode.value = "";
    }
    webtoolsCryptoInput = "";
    webtoolsCryptoOutput = "";
    webtoolsCryptoInfo = "";
    refreshWebtoolsCryptoResultInForm(form);
    setStatus("已清空");
  });

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "settings-btn settings-btn-primary";
  copyButton.textContent = "复制";
  copyButton.addEventListener("click", () => {
    void (async () => {
      const copied = await copyTextToClipboard(webtoolsCryptoOutput);
      setStatus(copied ? "已复制输出内容" : "复制失败");
    })();
  });

  toolbar.append(algorithmSelect, modeSwitch, clearButton, copyButton);
  header.append(title, toolbar);

  const symmetricConfig = document.createElement("div");
  symmetricConfig.className = "webtools-crypto-config";

  const secretField = document.createElement("label");
  secretField.className = "webtools-crypto-config-item";
  const secretLabel = document.createElement("span");
  secretLabel.className = "webtools-crypto-config-label";
  secretLabel.textContent = "密钥";
  const secretInput = document.createElement("input");
  secretInput.className = "settings-value";
  secretInput.name = "webtoolsCryptoSecret";
  secretInput.value = webtoolsCryptoSecret;
  secretInput.placeholder = "请输入密钥";
  secretField.append(secretLabel, secretInput);

  const ivField = document.createElement("label");
  ivField.className = "webtools-crypto-config-item";
  const ivLabel = document.createElement("span");
  ivLabel.className = "webtools-crypto-config-label";
  ivLabel.textContent = "IV";
  const ivInput = document.createElement("input");
  ivInput.className = "settings-value";
  ivInput.name = "webtoolsCryptoIv";
  ivInput.value = webtoolsCryptoIv;
  ivInput.placeholder = "可选（AES 16字节 / DES 8字节）";
  ivField.append(ivLabel, ivInput);
  symmetricConfig.append(secretField, ivField);

  const asymmetricConfig = document.createElement("div");
  asymmetricConfig.className = "webtools-crypto-config webtools-crypto-asymmetric";

  const rsaBitsField = document.createElement("label");
  rsaBitsField.className = "webtools-crypto-config-item";
  const rsaBitsLabel = document.createElement("span");
  rsaBitsLabel.className = "webtools-crypto-config-label";
  rsaBitsLabel.textContent = "RSA 位数";
  const rsaBitsSelect = document.createElement("select");
  rsaBitsSelect.className = "settings-number";
  rsaBitsSelect.name = "webtoolsCryptoRsaBits";
  [1024, 2048, 4096].forEach((bits) => {
    const option = document.createElement("option");
    option.value = String(bits);
    option.textContent = String(bits);
    option.selected = webtoolsCryptoRsaBits === bits;
    rsaBitsSelect.appendChild(option);
  });
  rsaBitsField.append(rsaBitsLabel, rsaBitsSelect);

  const publicKeyField = document.createElement("label");
  publicKeyField.className = "webtools-crypto-config-item webtools-crypto-config-item-full";
  const publicKeyLabel = document.createElement("span");
  publicKeyLabel.className = "webtools-crypto-config-label";
  publicKeyLabel.textContent = "公钥";
  const publicArea = document.createElement("textarea");
  publicArea.className = "settings-value webtools-textarea webtools-crypto-key-area";
  publicArea.name = "webtoolsCryptoPublicKey";
  publicArea.value = webtoolsCryptoPublicKey;
  publicArea.placeholder = "RSA/Ed25519 公钥";
  publicKeyField.append(publicKeyLabel, publicArea);

  const privateKeyField = document.createElement("label");
  privateKeyField.className = "webtools-crypto-config-item webtools-crypto-config-item-full";
  const privateKeyLabel = document.createElement("span");
  privateKeyLabel.className = "webtools-crypto-config-label";
  privateKeyLabel.textContent = "私钥";
  const privateArea = document.createElement("textarea");
  privateArea.className = "settings-value webtools-textarea webtools-crypto-key-area";
  privateArea.name = "webtoolsCryptoPrivateKey";
  privateArea.value = webtoolsCryptoPrivateKey;
  privateArea.placeholder = "RSA/Ed25519 私钥";
  privateKeyField.append(privateKeyLabel, privateArea);

  const keyActions = document.createElement("div");
  keyActions.className = "webtools-crypto-key-actions";
  const generateKeysButton = document.createElement("button");
  generateKeysButton.type = "button";
  generateKeysButton.className = "settings-btn settings-btn-secondary";
  generateKeysButton.textContent = "生成密钥";
  generateKeysButton.addEventListener("click", () => {
    void (async () => {
      await executeWebtoolsCryptoGenerateKeys(form, { autoEncryptAfterRsaKeys: true });
      updateCryptoUiState();
    })();
  });
  keyActions.append(generateKeysButton);

  asymmetricConfig.append(
    rsaBitsField,
    publicKeyField,
    privateKeyField,
    keyActions
  );

  const editors = document.createElement("div");
  editors.className = "webtools-crypto-editors";

  const inputPane = document.createElement("section");
  inputPane.className = "webtools-crypto-pane";
  const inputPaneLabel = document.createElement("div");
  inputPaneLabel.className = "webtools-crypto-pane-label";
  inputPaneLabel.textContent = "输入";
  const inputArea = document.createElement("textarea");
  inputArea.className = "settings-value webtools-textarea webtools-crypto-pane-area";
  inputArea.name = "webtoolsCryptoInput";
  inputArea.value = webtoolsCryptoInput;
  inputArea.placeholder = "输入...";
  inputPane.append(inputPaneLabel, inputArea);

  const outputPane = document.createElement("section");
  outputPane.className = "webtools-crypto-pane";
  const outputPaneLabel = document.createElement("div");
  outputPaneLabel.className = "webtools-crypto-pane-label";
  outputPaneLabel.textContent = "输出";
  const outputArea = document.createElement("textarea");
  outputArea.className = "settings-value webtools-textarea webtools-crypto-pane-area";
  outputArea.name = "webtoolsCryptoOutput";
  outputArea.readOnly = true;
  outputArea.value = webtoolsCryptoOutput;
  outputArea.placeholder = "输出...";
  outputPane.append(outputPaneLabel, outputArea);
  editors.append(inputPane, outputPane);

  const info = document.createElement("div");
  info.className = "webtools-crypto-info";
  info.textContent = webtoolsCryptoInfo;
  info.style.display = webtoolsCryptoInfo ? "" : "none";

  const updateCryptoUiState = (): void => {
    const algorithm = normalizeWebtoolsCryptoAlgorithm(algorithmSelect.value);
    webtoolsCryptoAlgorithm = algorithm;

    const canDecrypt = webtoolsCryptoSupportsDecrypt(algorithm);
    if (!canDecrypt && modeInput.value === "decrypt") {
      modeInput.value = "encrypt";
      webtoolsCryptoMode = "encrypt";
    } else {
      webtoolsCryptoMode = modeInput.value === "decrypt" ? "decrypt" : "encrypt";
    }

    modeSwitch.style.display = canDecrypt ? "" : "none";
    encryptButton.classList.toggle("active", modeInput.value === "encrypt");
    decryptButton.classList.toggle("active", modeInput.value === "decrypt");

    const symmetric = isWebtoolsCryptoSymmetricAlgorithm(algorithm);
    symmetricConfig.style.display = symmetric ? "" : "none";

    const asymmetric = isWebtoolsCryptoAsymmetricAlgorithm(algorithm);
    asymmetricConfig.style.display = asymmetric ? "" : "none";
    rsaBitsField.style.display = algorithm === "RSA" ? "" : "none";
  };

  algorithmSelect.addEventListener("change", () => {
    updateCryptoUiState();
    scheduleWebtoolsCryptoAutoProcess(form, true);
  });
  [
    inputArea,
    secretInput,
    ivInput,
    publicArea,
    privateArea
  ].forEach((node) => {
    node.addEventListener("input", () => {
      scheduleWebtoolsCryptoAutoProcess(form);
    });
  });
  rsaBitsSelect.addEventListener("change", () => {
    webtoolsCryptoRsaBits = Number(rsaBitsSelect.value) || 2048;
    scheduleWebtoolsCryptoAutoProcess(form, true);
  });
  modeInput.addEventListener("change", () => {
    updateCryptoUiState();
  });
  updateCryptoUiState();

  form.append(
    modeInput,
    header,
    symmetricConfig,
    asymmetricConfig,
    editors,
    info
  );
  panel.append(form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);

  if (inputArea.value.trim().length > 0) {
    scheduleWebtoolsCryptoAutoProcess(form, true);
  }
}

function applyWebtoolsJwtPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  if (data && typeof data.token === "string") {
    webtoolsJwtToken = data.token;
  }
  if (data && typeof data.header === "string") {
    webtoolsJwtHeader = data.header;
  }
  if (data && typeof data.payload === "string") {
    webtoolsJwtPayload = data.payload;
  }
  if (data && typeof data.secret === "string") {
    webtoolsJwtSecret = data.secret;
  }
  if (data && typeof data.mode === "string") {
    webtoolsJwtMode = data.mode === "jwe" ? "jwe" : "jws";
  }
  if (data && typeof data.algorithm === "string") {
    webtoolsJwtAlgorithm = data.algorithm === "RS256" ? "RS256" : "HS256";
  }
  if (data && typeof data.jweAlg === "string") {
    webtoolsJwtJweAlg = data.jweAlg === "A256KW" ? "A256KW" : "dir";
  }
  if (data && typeof data.jweEnc === "string") {
    webtoolsJwtJweEnc = data.jweEnc === "A128GCM" ? "A128GCM" : "A256GCM";
  }
  if (!webtoolsJwtSecret.trim()) {
    webtoolsJwtSecret = WEBTOOLS_JWT_DEFAULT_SECRET;
  }
  if (
    !webtoolsJwtToken.trim() &&
    !webtoolsJwtHeader.trim() &&
      !webtoolsJwtPayload.trim()
  ) {
    webtoolsJwtToken = WEBTOOLS_JWT_SAMPLE_TOKEN;
    webtoolsJwtHeader = WEBTOOLS_JWT_SAMPLE_HEADER;
    webtoolsJwtPayload = WEBTOOLS_JWT_SAMPLE_PAYLOAD;
    webtoolsJwtMode = "jws";
    webtoolsJwtAlgorithm = "HS256";
  }
  webtoolsJwtVerified = null;
  webtoolsJwtInfo = "";
}

function buildWebtoolsJwtTarget(action: "parse" | "sign" | "verify"): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("mode", webtoolsJwtMode);
  params.set("algorithm", webtoolsJwtAlgorithm);
  params.set("jweAlg", webtoolsJwtJweAlg);
  params.set("jweEnc", webtoolsJwtJweEnc);
  params.set("token", webtoolsJwtToken);
  params.set("header", webtoolsJwtHeader);
  params.set("payload", webtoolsJwtPayload);
  params.set("secret", webtoolsJwtSecret);
  return `command:plugin:${WEBTOOLS_JWT_PLUGIN_ID}?${params.toString()}`;
}

function refreshWebtoolsJwtModeUi(form: HTMLFormElement): void {
  const modeNode = form.elements.namedItem("webtoolsJwtMode");
  const mode = modeNode instanceof HTMLInputElement && modeNode.value === "jwe" ? "jwe" : "jws";

  const jwsBtn = form.querySelector('.webtools-jwt-mode-btn[data-mode=\"jws\"]');
  const jweBtn = form.querySelector('.webtools-jwt-mode-btn[data-mode=\"jwe\"]');
  if (jwsBtn instanceof HTMLButtonElement) {
    jwsBtn.classList.toggle("active", mode === "jws");
  }
  if (jweBtn instanceof HTMLButtonElement) {
    jweBtn.classList.toggle("active", mode === "jwe");
  }

  const jwsControls = form.querySelector(".webtools-jwt-jws-controls");
  const jweControls = form.querySelector(".webtools-jwt-jwe-controls");
  if (jwsControls instanceof HTMLDivElement) {
    jwsControls.style.display = mode === "jws" ? "" : "none";
  }
  if (jweControls instanceof HTMLDivElement) {
    jweControls.style.display = mode === "jwe" ? "" : "none";
  }
}

function refreshWebtoolsJwtResultInForm(form: HTMLFormElement): void {
  const tokenNode = form.elements.namedItem("webtoolsJwtToken");
  const headerNode = form.elements.namedItem("webtoolsJwtHeader");
  const payloadNode = form.elements.namedItem("webtoolsJwtPayload");
  const secretNode = form.elements.namedItem("webtoolsJwtSecret");
  const modeNode = form.elements.namedItem("webtoolsJwtMode");
  const algorithmNode = form.elements.namedItem("webtoolsJwtAlgorithm");
  const jweAlgNode = form.elements.namedItem("webtoolsJwtJweAlg");
  const jweEncNode = form.elements.namedItem("webtoolsJwtJweEnc");

  if (tokenNode instanceof HTMLTextAreaElement) {
    tokenNode.value = webtoolsJwtToken;
  }
  if (headerNode instanceof HTMLTextAreaElement) {
    headerNode.value = webtoolsJwtHeader;
  }
  if (payloadNode instanceof HTMLTextAreaElement) {
    payloadNode.value = webtoolsJwtPayload;
  }
  if (secretNode instanceof HTMLInputElement) {
    secretNode.value = webtoolsJwtSecret;
  }
  if (modeNode instanceof HTMLInputElement) {
    modeNode.value = webtoolsJwtMode;
  }
  if (algorithmNode instanceof HTMLSelectElement) {
    algorithmNode.value = webtoolsJwtAlgorithm;
  }
  if (jweAlgNode instanceof HTMLSelectElement) {
    jweAlgNode.value = webtoolsJwtJweAlg;
  }
  if (jweEncNode instanceof HTMLSelectElement) {
    jweEncNode.value = webtoolsJwtJweEnc;
  }
  refreshWebtoolsJwtModeUi(form);

  const hintNode = form.querySelector(".webtools-jwt-hint");
  if (hintNode instanceof HTMLSpanElement) {
    if (webtoolsJwtVerified === true) {
      hintNode.textContent = "签名已验证";
      hintNode.dataset.state = "ok";
    } else if (webtoolsJwtVerified === false) {
      hintNode.textContent = "签名校验失败";
      hintNode.dataset.state = "error";
    } else if (webtoolsJwtInfo) {
      hintNode.textContent = webtoolsJwtInfo;
      hintNode.dataset.state = "idle";
    } else {
      hintNode.textContent = "就绪";
      hintNode.dataset.state = "idle";
    }
  }

  const infoNode = form.querySelector(".webtools-jwt-info");
  if (infoNode instanceof HTMLDivElement) {
    infoNode.textContent = webtoolsJwtInfo;
    infoNode.style.display = webtoolsJwtInfo ? "" : "none";
  }
}

function scheduleWebtoolsJwtAutoParse(form: HTMLFormElement, immediate = false): void {
  if (webtoolsJwtAutoTimer !== null) {
    window.clearTimeout(webtoolsJwtAutoTimer);
  }

  webtoolsJwtAutoTimer = window.setTimeout(() => {
    webtoolsJwtAutoTimer = null;
    if (!form.isConnected) {
      return;
    }

    const tokenNode = form.elements.namedItem("webtoolsJwtToken");
    if (!(tokenNode instanceof HTMLTextAreaElement)) {
      return;
    }

    if (tokenNode.value.trim().length === 0) {
      webtoolsJwtToken = "";
      webtoolsJwtVerified = null;
      webtoolsJwtInfo = "";
      refreshWebtoolsJwtResultInForm(form);
      setStatus("就绪");
      return;
    }

    void executeWebtoolsJwtAction("parse", form, { render: false });
  }, immediate ? 0 : 260);
}

function scheduleWebtoolsJwtAutoSign(form: HTMLFormElement, immediate = false): void {
  if (webtoolsJwtSignTimer !== null) {
    window.clearTimeout(webtoolsJwtSignTimer);
  }

  webtoolsJwtSignTimer = window.setTimeout(() => {
    webtoolsJwtSignTimer = null;
    if (!form.isConnected) {
      return;
    }

    const headerNode = form.elements.namedItem("webtoolsJwtHeader");
    const payloadNode = form.elements.namedItem("webtoolsJwtPayload");
    const tokenNode = form.elements.namedItem("webtoolsJwtToken");

    const hasHeader = headerNode instanceof HTMLTextAreaElement && headerNode.value.trim().length > 0;
    const hasPayload =
      payloadNode instanceof HTMLTextAreaElement && payloadNode.value.trim().length > 0;
    const hasToken = tokenNode instanceof HTMLTextAreaElement && tokenNode.value.trim().length > 0;

    if (!hasHeader && !hasPayload && !hasToken) {
      return;
    }

    void executeWebtoolsJwtAction("sign", form, { render: false });
  }, immediate ? 0 : 280);
}

async function executeWebtoolsJwtAction(
  action: "parse" | "sign" | "verify",
  form: HTMLFormElement,
  options: { render?: boolean } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行 JWT 工具");
    return;
  }
  const shouldRender = options.render ?? true;

  const tokenNode = form.elements.namedItem("webtoolsJwtToken");
  const headerNode = form.elements.namedItem("webtoolsJwtHeader");
  const payloadNode = form.elements.namedItem("webtoolsJwtPayload");
  const secretNode = form.elements.namedItem("webtoolsJwtSecret");
  const modeNode = form.elements.namedItem("webtoolsJwtMode");
  const algorithmNode = form.elements.namedItem("webtoolsJwtAlgorithm");
  const jweAlgNode = form.elements.namedItem("webtoolsJwtJweAlg");
  const jweEncNode = form.elements.namedItem("webtoolsJwtJweEnc");

  webtoolsJwtToken = tokenNode instanceof HTMLTextAreaElement ? tokenNode.value : "";
  webtoolsJwtHeader =
    headerNode instanceof HTMLTextAreaElement ? headerNode.value : "";
  webtoolsJwtPayload =
    payloadNode instanceof HTMLTextAreaElement ? payloadNode.value : "";
  webtoolsJwtSecret = secretNode instanceof HTMLInputElement ? secretNode.value : "";
  webtoolsJwtMode = modeNode instanceof HTMLInputElement && modeNode.value === "jwe" ? "jwe" : "jws";
  webtoolsJwtAlgorithm =
    algorithmNode instanceof HTMLSelectElement && algorithmNode.value === "RS256"
      ? "RS256"
      : "HS256";
  webtoolsJwtJweAlg =
    jweAlgNode instanceof HTMLSelectElement && jweAlgNode.value === "A256KW"
      ? "A256KW"
      : "dir";
  webtoolsJwtJweEnc =
    jweEncNode instanceof HTMLSelectElement && jweEncNode.value === "A128GCM"
      ? "A128GCM"
      : "A256GCM";
  if (!webtoolsJwtSecret.trim()) {
    webtoolsJwtSecret = WEBTOOLS_JWT_DEFAULT_SECRET;
  }
  const requestToken = ++webtoolsJwtRequestToken;

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_JWT_PLUGIN_ID}:${action}`,
    type: "command",
    title: "JWT 工具",
    subtitle: "面板执行",
    target: buildWebtoolsJwtTarget(action),
    keywords: ["plugin", "jwt", "token", "verify", "sign", "鉴权"]
  };

  const result = await launcher.execute(item);
  if (requestToken !== webtoolsJwtRequestToken) {
    return;
  }
  const data = toRecord(result.data);

  if (data && typeof data.token === "string") {
    webtoolsJwtToken = data.token;
  }
  if (data && typeof data.header === "string") {
    webtoolsJwtHeader = data.header;
  }
  if (data && typeof data.payload === "string") {
    webtoolsJwtPayload = data.payload;
  }
  if (data && typeof data.mode === "string") {
    webtoolsJwtMode = data.mode === "jwe" ? "jwe" : "jws";
  }
  if (data && typeof data.algorithm === "string") {
    webtoolsJwtAlgorithm = data.algorithm === "RS256" ? "RS256" : "HS256";
  }
  if (data && typeof data.jweAlg === "string") {
    webtoolsJwtJweAlg = data.jweAlg === "A256KW" ? "A256KW" : "dir";
  }
  if (data && typeof data.jweEnc === "string") {
    webtoolsJwtJweEnc = data.jweEnc === "A128GCM" ? "A128GCM" : "A256GCM";
  }
  webtoolsJwtVerified =
    data && typeof data.verified === "boolean" ? data.verified : null;
  webtoolsJwtInfo =
    data && typeof data.info === "string" ? data.info : "";

  setStatus(result.message ?? (result.ok ? "执行完成" : "执行失败"));
  if (shouldRender) {
    renderList();
    return;
  }
  refreshWebtoolsJwtResultInForm(form);
}

function renderWebtoolsJwtPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel webtools-jwt-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "JWT 工具";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "支持 JWS/JWE 解析与生成（HS256/RS256）。";

  const form = document.createElement("form");
  form.className = "settings-form webtools-jwt-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsJwtAction("parse", form, { render: false });
  });

  const modeInput = document.createElement("input");
  modeInput.type = "hidden";
  modeInput.name = "webtoolsJwtMode";
  modeInput.value = webtoolsJwtMode;

  const toolbar = document.createElement("div");
  toolbar.className = "webtools-jwt-toolbar";

  const modeTabs = document.createElement("div");
  modeTabs.className = "webtools-jwt-mode-tabs";
  const jwsModeBtn = document.createElement("button");
  jwsModeBtn.type = "button";
  jwsModeBtn.className = "webtools-jwt-mode-btn";
  jwsModeBtn.dataset.mode = "jws";
  jwsModeBtn.textContent = "JWS (Sign)";
  const jweModeBtn = document.createElement("button");
  jweModeBtn.type = "button";
  jweModeBtn.className = "webtools-jwt-mode-btn";
  jweModeBtn.dataset.mode = "jwe";
  jweModeBtn.textContent = "JWE (Encrypt)";
  modeTabs.append(jwsModeBtn, jweModeBtn);

  const jwsControls = document.createElement("div");
  jwsControls.className = "webtools-jwt-jws-controls";
  const algorithmSelect = document.createElement("select");
  algorithmSelect.className = "settings-number";
  algorithmSelect.name = "webtoolsJwtAlgorithm";
  [
    { value: "HS256", label: "HS256 (HMAC + SHA256)" },
    { value: "RS256", label: "RS256 (RSA + SHA256)" }
  ].forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.value;
    option.textContent = entry.label;
    option.selected = webtoolsJwtAlgorithm === entry.value;
    algorithmSelect.appendChild(option);
  });
  jwsControls.appendChild(algorithmSelect);

  const jweControls = document.createElement("div");
  jweControls.className = "webtools-jwt-jwe-controls";
  const jweAlgSelect = document.createElement("select");
  jweAlgSelect.className = "settings-number";
  jweAlgSelect.name = "webtoolsJwtJweAlg";
  [
    { value: "dir", label: "dir (Direct)" },
    { value: "A256KW", label: "A256KW" }
  ].forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.value;
    option.textContent = entry.label;
    option.selected = webtoolsJwtJweAlg === entry.value;
    jweAlgSelect.appendChild(option);
  });
  const jweEncSelect = document.createElement("select");
  jweEncSelect.className = "settings-number";
  jweEncSelect.name = "webtoolsJwtJweEnc";
  [
    { value: "A256GCM", label: "A256GCM" },
    { value: "A128GCM", label: "A128GCM" }
  ].forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.value;
    option.textContent = entry.label;
    option.selected = webtoolsJwtJweEnc === entry.value;
    jweEncSelect.appendChild(option);
  });
  jweControls.append(jweAlgSelect, jweEncSelect);

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "settings-btn settings-btn-secondary";
  clearButton.textContent = "清空";
  clearButton.addEventListener("click", () => {
    webtoolsJwtToken = "";
    webtoolsJwtHeader = "";
    webtoolsJwtPayload = "";
    webtoolsJwtVerified = null;
    webtoolsJwtInfo = "";
    refreshWebtoolsJwtResultInForm(form);
    setStatus("已清空");
  });

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "settings-btn settings-btn-primary";
  copyButton.textContent = "复制";
  copyButton.addEventListener("click", () => {
    void (async () => {
      const copied = await copyTextToClipboard(webtoolsJwtToken);
      setStatus(copied ? "已复制 Token" : "复制失败");
    })();
  });

  toolbar.append(modeTabs, jwsControls, jweControls, clearButton, copyButton);

  const body = document.createElement("div");
  body.className = "webtools-jwt-layout";

  const tokenPane = document.createElement("section");
  tokenPane.className = "webtools-jwt-pane";
  const tokenLabel = document.createElement("div");
  tokenLabel.className = "webtools-jwt-pane-label";
  tokenLabel.textContent = "编码后的 TOKEN";
  const tokenArea = document.createElement("textarea");
  tokenArea.className = "settings-value webtools-textarea webtools-jwt-token-area";
  tokenArea.name = "webtoolsJwtToken";
  tokenArea.value = webtoolsJwtToken;
  tokenArea.placeholder = "粘贴 JWT/JWE";
  tokenPane.append(tokenLabel, tokenArea);

  const decodedPane = document.createElement("section");
  decodedPane.className = "webtools-jwt-pane webtools-jwt-decoded";

  const secretRow = document.createElement("label");
  secretRow.className = "settings-row webtools-row-full";
  const secretLabel = document.createElement("span");
  secretLabel.className = "settings-row-label webtools-jwt-secret-label";
  secretLabel.textContent = "密钥 / 私钥";
  const secretInput = document.createElement("input");
  secretInput.className = "settings-value";
  secretInput.name = "webtoolsJwtSecret";
  secretInput.value = webtoolsJwtSecret;
  secretInput.placeholder = "HS256 Secret";
  const secretHint = document.createElement("span");
  secretHint.className = "settings-row-hint webtools-jwt-hint";
  if (webtoolsJwtVerified === null) {
    secretHint.textContent = webtoolsJwtInfo || "就绪";
    secretHint.dataset.state = "idle";
  } else {
    secretHint.textContent = webtoolsJwtVerified ? "签名已验证" : "签名校验失败";
    secretHint.dataset.state = webtoolsJwtVerified ? "ok" : "error";
  }
  secretRow.append(secretLabel, secretInput, secretHint);

  const headerRow = document.createElement("label");
  headerRow.className = "settings-row webtools-row-full";
  const headerLabel = document.createElement("span");
  headerLabel.className = "settings-row-label";
  headerLabel.textContent = "标头 (Header)";
  const headerArea = document.createElement("textarea");
  headerArea.className = "settings-value webtools-textarea";
  headerArea.name = "webtoolsJwtHeader";
  headerArea.value = webtoolsJwtHeader;
  headerArea.placeholder = '{"alg":"HS256","typ":"JWT"}';
  headerRow.append(headerLabel, headerArea);

  const payloadRow = document.createElement("label");
  payloadRow.className = "settings-row webtools-row-full";
  const payloadLabel = document.createElement("span");
  payloadLabel.className = "settings-row-label";
  payloadLabel.textContent = "载荷 (Payload)";
  const payloadArea = document.createElement("textarea");
  payloadArea.className = "settings-value webtools-textarea";
  payloadArea.name = "webtoolsJwtPayload";
  payloadArea.value = webtoolsJwtPayload;
  payloadArea.placeholder = '{"sub":"123","name":"John Doe"}';
  payloadRow.append(payloadLabel, payloadArea);

  const info = document.createElement("div");
  info.className = "webtools-jwt-info";
  info.textContent = webtoolsJwtInfo;
  info.style.display = webtoolsJwtInfo ? "" : "none";

  const changeMode = (mode: "jws" | "jwe"): void => {
    modeInput.value = mode;
    webtoolsJwtMode = mode;
    refreshWebtoolsJwtModeUi(form);
    scheduleWebtoolsJwtAutoSign(form, true);
  };

  jwsModeBtn.addEventListener("click", () => {
    changeMode("jws");
  });
  jweModeBtn.addEventListener("click", () => {
    changeMode("jwe");
  });
  algorithmSelect.addEventListener("change", () => {
    webtoolsJwtAlgorithm = algorithmSelect.value === "RS256" ? "RS256" : "HS256";
    scheduleWebtoolsJwtAutoSign(form, true);
  });
  jweAlgSelect.addEventListener("change", () => {
    webtoolsJwtJweAlg = jweAlgSelect.value === "A256KW" ? "A256KW" : "dir";
    scheduleWebtoolsJwtAutoSign(form, true);
  });
  jweEncSelect.addEventListener("change", () => {
    webtoolsJwtJweEnc = jweEncSelect.value === "A128GCM" ? "A128GCM" : "A256GCM";
    scheduleWebtoolsJwtAutoSign(form, true);
  });
  tokenArea.addEventListener("input", () => {
    scheduleWebtoolsJwtAutoParse(form);
  });
  tokenArea.addEventListener("blur", () => {
    scheduleWebtoolsJwtAutoParse(form, true);
  });
  headerArea.addEventListener("input", () => {
    scheduleWebtoolsJwtAutoSign(form);
  });
  payloadArea.addEventListener("input", () => {
    scheduleWebtoolsJwtAutoSign(form);
  });
  secretInput.addEventListener("input", () => {
    webtoolsJwtVerified = null;
    refreshWebtoolsJwtResultInForm(form);
    const tokenValue = tokenArea.value.trim();
    if (tokenValue) {
      scheduleWebtoolsJwtAutoParse(form, true);
      return;
    }
    scheduleWebtoolsJwtAutoSign(form);
  });

  decodedPane.append(headerRow, payloadRow, secretRow, info);
  body.append(tokenPane, decodedPane);
  form.append(modeInput, toolbar, body);
  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);

  refreshWebtoolsJwtModeUi(form);
  if (tokenArea.value.trim().length > 0) {
    scheduleWebtoolsJwtAutoParse(form, true);
  }
}

function applyWebtoolsStringsPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  if (data && typeof data.input === "string") {
    webtoolsStringsInput = data.input;
  }
  if (data && typeof data.caseType === "string") {
    webtoolsStringsCaseType = data.caseType;
  }
  if (data && typeof data.count === "number") {
    webtoolsStringsUuidCount = data.count;
  }
  webtoolsStringsOutput = "";
  webtoolsStringsUuidItems = [];
}

function buildWebtoolsStringsTarget(action: "convert" | "uuid"): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("input", webtoolsStringsInput);
  params.set("caseType", webtoolsStringsCaseType);
  params.set("count", String(webtoolsStringsUuidCount));
  return `command:plugin:${WEBTOOLS_STRINGS_PLUGIN_ID}?${params.toString()}`;
}

async function executeWebtoolsStringsAction(
  action: "convert" | "uuid",
  form: HTMLFormElement
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行字符串工具");
    return;
  }

  const inputNode = form.elements.namedItem("webtoolsStringsInput");
  const caseNode = form.elements.namedItem("webtoolsStringsCaseType");
  const countNode = form.elements.namedItem("webtoolsStringsCount");

  webtoolsStringsInput =
    inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
  webtoolsStringsCaseType =
    caseNode instanceof HTMLSelectElement ? caseNode.value : "camel";
  webtoolsStringsUuidCount =
    countNode instanceof HTMLInputElement ? Number(countNode.value) : 5;

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_STRINGS_PLUGIN_ID}:${action}`,
    type: "command",
    title: "字符串工具",
    subtitle: "面板执行",
    target: buildWebtoolsStringsTarget(action),
    keywords: ["plugin", "string", "uuid", "case", "字符串", "转换"]
  };

  const result = await launcher.execute(item);
  const data = toRecord(result.data);

  webtoolsStringsOutput =
    data && typeof data.output === "string" ? data.output : "";
  webtoolsStringsUuidItems = [];
  if (data && Array.isArray(data.items)) {
    for (const value of data.items) {
      if (typeof value === "string") {
        webtoolsStringsUuidItems.push(value);
      }
    }
  }

  setStatus(result.message ?? (result.ok ? "执行完成" : "执行失败"));
  renderList();
}

function renderWebtoolsStringsPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "字符串工具";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "大小写转换与 UUID 批量生成。";

  const form = document.createElement("form");
  form.className = "settings-form webtools-strings-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsStringsAction("convert", form);
  });

  const inputRow = document.createElement("label");
  inputRow.className = "settings-row webtools-row-full";
  const inputLabel = document.createElement("span");
  inputLabel.className = "settings-row-label";
  inputLabel.textContent = "输入文本";
  const inputArea = document.createElement("textarea");
  inputArea.className = "settings-value webtools-textarea";
  inputArea.name = "webtoolsStringsInput";
  inputArea.value = webtoolsStringsInput;
  inputArea.placeholder = "请输入字符串";
  inputRow.append(inputLabel, inputArea);

  const caseRow = document.createElement("label");
  caseRow.className = "settings-row";
  const caseLabel = document.createElement("span");
  caseLabel.className = "settings-row-label";
  caseLabel.textContent = "大小写转换";
  const caseSelect = document.createElement("select");
  caseSelect.className = "settings-number";
  caseSelect.name = "webtoolsStringsCaseType";
  [
    { value: "camel", label: "camelCase" },
    { value: "snake", label: "snake_case" },
    { value: "pascal", label: "PascalCase" },
    { value: "kebab", label: "kebab-case" },
    { value: "upper", label: "UPPER" },
    { value: "lower", label: "lower" }
  ].forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.value;
    option.textContent = entry.label;
    option.selected = webtoolsStringsCaseType === entry.value;
    caseSelect.appendChild(option);
  });
  caseRow.append(caseLabel, caseSelect);

  const uuidRow = document.createElement("label");
  uuidRow.className = "settings-row";
  const uuidLabel = document.createElement("span");
  uuidLabel.className = "settings-row-label";
  uuidLabel.textContent = "UUID 数量";
  const uuidCountInput = document.createElement("input");
  uuidCountInput.className = "settings-number";
  uuidCountInput.type = "number";
  uuidCountInput.name = "webtoolsStringsCount";
  uuidCountInput.min = "1";
  uuidCountInput.max = "100";
  uuidCountInput.step = "1";
  uuidCountInput.value = String(webtoolsStringsUuidCount);
  const uuidHint = document.createElement("span");
  uuidHint.className = "settings-row-hint";
  uuidHint.textContent = "1-100";
  uuidRow.append(uuidLabel, uuidCountInput, uuidHint);

  const outputRow = document.createElement("div");
  outputRow.className = "settings-row webtools-row-full";
  const outputLabel = document.createElement("span");
  outputLabel.className = "settings-row-label";
  outputLabel.textContent = "输出";
  const outputArea = document.createElement("textarea");
  outputArea.className = "settings-value webtools-textarea";
  outputArea.readOnly = true;
  outputArea.value = webtoolsStringsOutput;
  outputArea.placeholder = "转换结果或 UUID 列表";
  outputRow.append(outputLabel, outputArea);

  const actions = document.createElement("div");
  actions.className = "settings-actions";

  const uuidButton = document.createElement("button");
  uuidButton.type = "button";
  uuidButton.className = "settings-btn settings-btn-secondary";
  uuidButton.textContent = "生成 UUID";
  uuidButton.addEventListener("click", () => {
    void executeWebtoolsStringsAction("uuid", form);
  });

  const convertButton = document.createElement("button");
  convertButton.type = "submit";
  convertButton.className = "settings-btn settings-btn-primary";
  convertButton.textContent = "转换";

  actions.append(uuidButton, convertButton);
  form.append(inputRow, caseRow, uuidRow, outputRow, actions);

  if (webtoolsStringsUuidItems.length > 0) {
    const tableWrap = document.createElement("div");
    tableWrap.className = "webtools-mini-table-wrap";
    const table = document.createElement("table");
    table.className = "webtools-mini-table";
    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    ["序号", "UUID"].forEach((titleText) => {
      const th = document.createElement("th");
      th.textContent = titleText;
      hr.appendChild(th);
    });
    thead.appendChild(hr);

    const tbody = document.createElement("tbody");
    webtoolsStringsUuidItems.forEach((value, index) => {
      const tr = document.createElement("tr");
      const indexCell = document.createElement("td");
      indexCell.textContent = String(index + 1);
      const valueCell = document.createElement("td");
      valueCell.textContent = value;
      tr.append(indexCell, valueCell);
      tbody.appendChild(tr);
    });
    table.append(thead, tbody);
    tableWrap.appendChild(table);
    form.appendChild(tableWrap);
  }

  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function applyWebtoolsColorsPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  if (data && typeof data.color === "string") {
    webtoolsColorsInput = data.color;
  }
  webtoolsColorsHex = webtoolsColorsInput || "#6c5ce7";
  webtoolsColorsRgb = "";
  webtoolsColorsHsl = "";
  webtoolsColorsShades = [];
}

function buildWebtoolsColorsTarget(color: string): string {
  const params = new URLSearchParams();
  params.set("action", "convert");
  params.set("color", color);
  return `command:plugin:${WEBTOOLS_COLORS_PLUGIN_ID}?${params.toString()}`;
}

async function executeWebtoolsColorsConvert(color: string): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行颜色工具");
    return;
  }

  webtoolsColorsInput = color;

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_COLORS_PLUGIN_ID}:convert`,
    type: "command",
    title: "颜色工具",
    subtitle: "面板执行",
    target: buildWebtoolsColorsTarget(color),
    keywords: ["plugin", "color", "hex", "rgb", "hsl", "颜色"]
  };

  const result = await launcher.execute(item);
  const data = toRecord(result.data);

  webtoolsColorsHex =
    data && typeof data.hex === "string" ? data.hex : webtoolsColorsHex;
  webtoolsColorsRgb = data && typeof data.rgb === "string" ? data.rgb : "";
  webtoolsColorsHsl = data && typeof data.hsl === "string" ? data.hsl : "";

  const shades: string[] = [];
  if (data && Array.isArray(data.shades)) {
    for (const value of data.shades) {
      if (typeof value === "string") {
        shades.push(value);
      }
    }
  }
  webtoolsColorsShades = shades;

  setStatus(result.message ?? (result.ok ? "转换完成" : "转换失败"));
  renderList();
}

function renderWebtoolsColorsPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "颜色工具";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "HEX / RGB / HSL 转换与色阶预览。";

  const form = document.createElement("form");
  form.className = "settings-form webtools-colors-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const inputNode = form.elements.namedItem("webtoolsColorsInput");
    const color = inputNode instanceof HTMLInputElement ? inputNode.value : "";
    void executeWebtoolsColorsConvert(color);
  });

  const colorRow = document.createElement("label");
  colorRow.className = "settings-row";
  const colorLabel = document.createElement("span");
  colorLabel.className = "settings-row-label";
  colorLabel.textContent = "颜色值";
  const colorInput = document.createElement("input");
  colorInput.className = "settings-value";
  colorInput.name = "webtoolsColorsInput";
  colorInput.value = webtoolsColorsInput || webtoolsColorsHex;
  colorInput.placeholder = "#6c5ce7 / rgb(108,92,231) / hsl(...)";
  const colorPicker = document.createElement("input");
  colorPicker.type = "color";
  colorPicker.value = /^#([0-9a-f]{6})$/i.test(webtoolsColorsHex)
    ? webtoolsColorsHex
    : "#6c5ce7";
  colorPicker.addEventListener("input", () => {
    colorInput.value = colorPicker.value;
  });
  const colorHint = document.createElement("span");
  colorHint.className = "settings-row-hint";
  colorHint.textContent = "支持 HEX / rgb() / hsl()";
  colorRow.append(colorLabel, colorInput, colorPicker, colorHint);

  const resultRow = document.createElement("div");
  resultRow.className = "settings-row webtools-row-full";
  const resultLabel = document.createElement("span");
  resultLabel.className = "settings-row-label";
  resultLabel.textContent = "转换结果";
  const resultValue = document.createElement("div");
  resultValue.className = "settings-value settings-wrap";
  resultValue.textContent = `HEX: ${webtoolsColorsHex || "-"}\nRGB: ${webtoolsColorsRgb || "-"}\nHSL: ${webtoolsColorsHsl || "-"}`;
  resultValue.style.whiteSpace = "pre-line";
  resultRow.append(resultLabel, resultValue);

  const actions = document.createElement("div");
  actions.className = "settings-actions";
  const convertButton = document.createElement("button");
  convertButton.type = "submit";
  convertButton.className = "settings-btn settings-btn-primary";
  convertButton.textContent = "转换";
  actions.append(convertButton);

  form.append(colorRow, resultRow, actions);

  if (webtoolsColorsShades.length > 0) {
    const shadesRow = document.createElement("div");
    shadesRow.className = "settings-row webtools-row-full";
    const shadesLabel = document.createElement("span");
    shadesLabel.className = "settings-row-label";
    shadesLabel.textContent = "色阶";
    const shadesWrap = document.createElement("div");
    shadesWrap.className = "settings-value settings-wrap";
    shadesWrap.style.display = "flex";
    shadesWrap.style.gap = "6px";
    shadesWrap.style.alignItems = "center";
    for (const color of webtoolsColorsShades) {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.title = color;
      swatch.style.width = "22px";
      swatch.style.height = "22px";
      swatch.style.borderRadius = "4px";
      swatch.style.border = "1px solid rgba(255,255,255,0.2)";
      swatch.style.cursor = "pointer";
      swatch.style.background = color;
      swatch.addEventListener("click", () => {
        colorInput.value = color;
        void executeWebtoolsColorsConvert(color);
      });
      shadesWrap.appendChild(swatch);
    }
    shadesRow.append(shadesLabel, shadesWrap);
    form.appendChild(shadesRow);
  }

  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function applyWebtoolsImageBase64PanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  if (data && typeof data.input === "string") {
    webtoolsImageBase64Input = data.input;
  }
  webtoolsImageBase64DataUrl = "";
  webtoolsImageBase64Raw = "";
  webtoolsImageBase64Mime = "";
  webtoolsImageBase64SizeText = "";
}

function buildWebtoolsImageBase64Target(input: string): string {
  const params = new URLSearchParams();
  params.set("action", "normalize");
  params.set("input", input);
  return `command:plugin:${WEBTOOLS_IMAGE_BASE64_PLUGIN_ID}?${params.toString()}`;
}

async function executeWebtoolsImageBase64Normalize(input: string): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行图片 Base64 工具");
    return;
  }

  webtoolsImageBase64Input = input;
  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_IMAGE_BASE64_PLUGIN_ID}:normalize`,
    type: "command",
    title: "图片 Base64",
    subtitle: "面板执行",
    target: buildWebtoolsImageBase64Target(input),
    keywords: ["plugin", "image", "base64", "图片", "编码"]
  };

  const result = await launcher.execute(item);
  const data = toRecord(result.data);

  webtoolsImageBase64DataUrl =
    data && typeof data.dataUrl === "string" ? data.dataUrl : "";
  webtoolsImageBase64Raw =
    data && typeof data.rawBase64 === "string" ? data.rawBase64 : "";
  webtoolsImageBase64Mime =
    data && typeof data.mime === "string" ? data.mime : "";
  webtoolsImageBase64SizeText =
    data && typeof data.sizeText === "string" ? data.sizeText : "";

  setStatus(result.message ?? (result.ok ? "转换完成" : "转换失败"));
  renderList();
}

function renderWebtoolsImageBase64Panel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "图片 Base64";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "DataURL 与 Base64 文本互转/预览。";

  const form = document.createElement("form");
  form.className = "settings-form webtools-image-base64-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const node = form.elements.namedItem("webtoolsImageBase64Input");
    const inputValue = node instanceof HTMLTextAreaElement ? node.value : "";
    void executeWebtoolsImageBase64Normalize(inputValue);
  });

  const uploadRow = document.createElement("div");
  uploadRow.className = "settings-row";
  const uploadLabel = document.createElement("span");
  uploadLabel.className = "settings-row-label";
  uploadLabel.textContent = "本地图片";
  const uploadInput = document.createElement("input");
  uploadInput.type = "file";
  uploadInput.accept = "image/*";
  uploadInput.addEventListener("change", () => {
    const file = uploadInput.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const resultValue = typeof reader.result === "string" ? reader.result : "";
      const area = form.elements.namedItem("webtoolsImageBase64Input");
      if (area instanceof HTMLTextAreaElement) {
        area.value = resultValue;
      }
      void executeWebtoolsImageBase64Normalize(resultValue);
    };
    reader.readAsDataURL(file);
  });
  const uploadHint = document.createElement("span");
  uploadHint.className = "settings-row-hint";
  uploadHint.textContent = "选择图片后自动转换";
  uploadRow.append(uploadLabel, uploadInput, uploadHint);

  const inputRow = document.createElement("label");
  inputRow.className = "settings-row webtools-row-full";
  const inputLabel = document.createElement("span");
  inputLabel.className = "settings-row-label";
  inputLabel.textContent = "输入";
  const inputArea = document.createElement("textarea");
  inputArea.className = "settings-value webtools-textarea";
  inputArea.name = "webtoolsImageBase64Input";
  inputArea.value = webtoolsImageBase64Input;
  inputArea.placeholder = "粘贴 Base64 或 DataURL";
  inputRow.append(inputLabel, inputArea);

  const outputRow = document.createElement("label");
  outputRow.className = "settings-row webtools-row-full";
  const outputLabel = document.createElement("span");
  outputLabel.className = "settings-row-label";
  outputLabel.textContent = "DataURL 输出";
  const outputArea = document.createElement("textarea");
  outputArea.className = "settings-value webtools-textarea";
  outputArea.readOnly = true;
  outputArea.value = webtoolsImageBase64DataUrl;
  outputArea.placeholder = "转换结果";
  outputRow.append(outputLabel, outputArea);

  const infoRow = document.createElement("div");
  infoRow.className = "settings-row webtools-row-full";
  const infoLabel = document.createElement("span");
  infoLabel.className = "settings-row-label";
  infoLabel.textContent = "信息";
  const infoValue = document.createElement("div");
  infoValue.className = "settings-value settings-wrap";
  infoValue.textContent =
    webtoolsImageBase64Mime || webtoolsImageBase64SizeText
      ? `MIME: ${webtoolsImageBase64Mime}\n大小: ${webtoolsImageBase64SizeText}`
      : "-";
  infoValue.style.whiteSpace = "pre-line";
  infoRow.append(infoLabel, infoValue);

  const actions = document.createElement("div");
  actions.className = "settings-actions";
  const normalizeButton = document.createElement("button");
  normalizeButton.type = "submit";
  normalizeButton.className = "settings-btn settings-btn-primary";
  normalizeButton.textContent = "转换";
  actions.append(normalizeButton);

  form.append(uploadRow, inputRow, outputRow, infoRow, actions);

  if (webtoolsImageBase64DataUrl.startsWith("data:image/")) {
    const previewRow = document.createElement("div");
    previewRow.className = "settings-row webtools-row-full";
    const previewLabel = document.createElement("span");
    previewLabel.className = "settings-row-label";
    previewLabel.textContent = "预览";
    const imageWrap = document.createElement("div");
    imageWrap.className = "settings-value settings-wrap";
    const image = document.createElement("img");
    image.src = webtoolsImageBase64DataUrl;
    image.alt = "base64 preview";
    image.style.maxWidth = "220px";
    image.style.maxHeight = "220px";
    image.style.borderRadius = "8px";
    imageWrap.appendChild(image);
    previewRow.append(previewLabel, imageWrap);
    form.appendChild(previewRow);
  }

  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function applyWebtoolsConfigPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  if (data && typeof data.source === "string") {
    webtoolsConfigSource = data.source;
  }
  if (data && typeof data.target === "string") {
    webtoolsConfigTarget = data.target;
  }
  if (data && typeof data.input === "string") {
    webtoolsConfigInput = data.input;
  }
  webtoolsConfigOutput = "";
  webtoolsConfigInfo = "";
}

function buildWebtoolsConfigTarget(): string {
  const params = new URLSearchParams();
  params.set("action", "convert");
  params.set("source", webtoolsConfigSource);
  params.set("target", webtoolsConfigTarget);
  params.set("input", webtoolsConfigInput);
  return `command:plugin:${WEBTOOLS_CONFIG_PLUGIN_ID}?${params.toString()}`;
}

async function executeWebtoolsConfigConvert(form: HTMLFormElement): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行配置转换");
    return;
  }

  const sourceNode = form.elements.namedItem("webtoolsConfigSource");
  const targetNode = form.elements.namedItem("webtoolsConfigTarget");
  const inputNode = form.elements.namedItem("webtoolsConfigInput");

  webtoolsConfigSource =
    sourceNode instanceof HTMLSelectElement ? sourceNode.value : "yaml";
  webtoolsConfigTarget =
    targetNode instanceof HTMLSelectElement ? targetNode.value : "properties";
  webtoolsConfigInput = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_CONFIG_PLUGIN_ID}:convert`,
    type: "command",
    title: "配置转换",
    subtitle: "面板执行",
    target: buildWebtoolsConfigTarget(),
    keywords: ["plugin", "config", "yaml", "json", "properties", "转换"]
  };

  const result = await launcher.execute(item);
  const data = toRecord(result.data);

  webtoolsConfigOutput =
    data && typeof data.output === "string" ? data.output : "";
  webtoolsConfigInfo = data && typeof data.info === "string" ? data.info : "";

  setStatus(result.message ?? (result.ok ? "转换完成" : "转换失败"));
  renderList();
}

function renderWebtoolsConfigPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "配置转换";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "YAML / JSON / Properties 双向转换。";

  const form = document.createElement("form");
  form.className = "settings-form webtools-config-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsConfigConvert(form);
  });

  const sourceRow = document.createElement("label");
  sourceRow.className = "settings-row";
  const sourceLabel = document.createElement("span");
  sourceLabel.className = "settings-row-label";
  sourceLabel.textContent = "源格式";
  const sourceSelect = document.createElement("select");
  sourceSelect.className = "settings-number";
  sourceSelect.name = "webtoolsConfigSource";
  ["yaml", "json", "properties"].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value.toUpperCase();
    option.selected = webtoolsConfigSource === value;
    sourceSelect.appendChild(option);
  });
  sourceRow.append(sourceLabel, sourceSelect);

  const targetRow = document.createElement("label");
  targetRow.className = "settings-row";
  const targetLabel = document.createElement("span");
  targetLabel.className = "settings-row-label";
  targetLabel.textContent = "目标格式";
  const targetSelect = document.createElement("select");
  targetSelect.className = "settings-number";
  targetSelect.name = "webtoolsConfigTarget";
  ["properties", "yaml", "json"].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value.toUpperCase();
    option.selected = webtoolsConfigTarget === value;
    targetSelect.appendChild(option);
  });
  const targetHint = document.createElement("span");
  targetHint.className = "settings-row-hint";
  targetHint.textContent = webtoolsConfigInfo || "-";
  targetRow.append(targetLabel, targetSelect, targetHint);

  const inputRow = document.createElement("label");
  inputRow.className = "settings-row webtools-row-full";
  const inputLabel = document.createElement("span");
  inputLabel.className = "settings-row-label";
  inputLabel.textContent = "输入";
  const inputArea = document.createElement("textarea");
  inputArea.className = "settings-value webtools-textarea";
  inputArea.name = "webtoolsConfigInput";
  inputArea.value = webtoolsConfigInput;
  inputArea.placeholder = "输入配置内容";
  inputRow.append(inputLabel, inputArea);

  const outputRow = document.createElement("label");
  outputRow.className = "settings-row webtools-row-full";
  const outputLabel = document.createElement("span");
  outputLabel.className = "settings-row-label";
  outputLabel.textContent = "输出";
  const outputArea = document.createElement("textarea");
  outputArea.className = "settings-value webtools-textarea";
  outputArea.readOnly = true;
  outputArea.value = webtoolsConfigOutput;
  outputArea.placeholder = "转换结果";
  outputRow.append(outputLabel, outputArea);

  const actions = document.createElement("div");
  actions.className = "settings-actions";

  const swapButton = document.createElement("button");
  swapButton.type = "button";
  swapButton.className = "settings-btn settings-btn-secondary";
  swapButton.textContent = "交换方向";
  swapButton.addEventListener("click", () => {
    const temp = webtoolsConfigSource;
    webtoolsConfigSource = webtoolsConfigTarget;
    webtoolsConfigTarget = temp;
    if (webtoolsConfigOutput.trim()) {
      webtoolsConfigInput = webtoolsConfigOutput;
      webtoolsConfigOutput = "";
    }
    renderList();
  });

  const convertButton = document.createElement("button");
  convertButton.type = "submit";
  convertButton.className = "settings-btn settings-btn-primary";
  convertButton.textContent = "转换";

  actions.append(swapButton, convertButton);
  form.append(sourceRow, targetRow, inputRow, outputRow, actions);
  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function applyWebtoolsSqlPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  if (data && typeof data.input === "string") {
    webtoolsSqlInput = data.input;
  }
  if (data && typeof data.dialect === "string") {
    webtoolsSqlDialect = data.dialect;
  }
  if (data && typeof data.uppercase === "boolean") {
    webtoolsSqlUppercase = data.uppercase;
  }
  if (data && typeof data.indent === "number") {
    webtoolsSqlIndent = data.indent;
  }
  webtoolsSqlOutput = "";
  webtoolsSqlInfo = "";
}

function buildWebtoolsSqlTarget(): string {
  const params = new URLSearchParams();
  params.set("action", "format");
  params.set("input", webtoolsSqlInput);
  params.set("dialect", webtoolsSqlDialect);
  params.set("uppercase", webtoolsSqlUppercase ? "1" : "0");
  params.set("indent", String(webtoolsSqlIndent));
  return `command:plugin:${WEBTOOLS_SQL_PLUGIN_ID}?${params.toString()}`;
}

async function executeWebtoolsSqlFormat(form: HTMLFormElement): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行 SQL 格式化");
    return;
  }

  const inputNode = form.elements.namedItem("webtoolsSqlInput");
  const dialectNode = form.elements.namedItem("webtoolsSqlDialect");
  const uppercaseNode = form.elements.namedItem("webtoolsSqlUppercase");
  const indentNode = form.elements.namedItem("webtoolsSqlIndent");

  webtoolsSqlInput = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
  webtoolsSqlDialect =
    dialectNode instanceof HTMLSelectElement ? dialectNode.value : "sql";
  webtoolsSqlUppercase =
    uppercaseNode instanceof HTMLInputElement ? uppercaseNode.checked : true;
  webtoolsSqlIndent =
    indentNode instanceof HTMLInputElement ? Number(indentNode.value) : 2;

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_SQL_PLUGIN_ID}:format`,
    type: "command",
    title: "SQL 格式化",
    subtitle: "面板执行",
    target: buildWebtoolsSqlTarget(),
    keywords: ["plugin", "sql", "format", "格式化"]
  };

  const result = await launcher.execute(item);
  const data = toRecord(result.data);

  webtoolsSqlOutput = data && typeof data.output === "string" ? data.output : "";
  webtoolsSqlInfo = data && typeof data.info === "string" ? data.info : "";

  setStatus(result.message ?? (result.ok ? "格式化完成" : "格式化失败"));
  renderList();
}

function renderWebtoolsSqlPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "SQL 格式化";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "SQL 语句格式整理与关键字规范。";

  const form = document.createElement("form");
  form.className = "settings-form webtools-sql-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsSqlFormat(form);
  });

  const dialectRow = document.createElement("label");
  dialectRow.className = "settings-row";
  const dialectLabel = document.createElement("span");
  dialectLabel.className = "settings-row-label";
  dialectLabel.textContent = "方言";
  const dialectSelect = document.createElement("select");
  dialectSelect.className = "settings-number";
  dialectSelect.name = "webtoolsSqlDialect";
  ["sql", "mysql", "postgresql", "sqlite", "tsql"].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = webtoolsSqlDialect === value;
    dialectSelect.appendChild(option);
  });
  const dialectHint = document.createElement("span");
  dialectHint.className = "settings-row-hint";
  dialectHint.textContent = webtoolsSqlInfo || "-";
  dialectRow.append(dialectLabel, dialectSelect, dialectHint);

  const indentRow = document.createElement("label");
  indentRow.className = "settings-row";
  const indentLabel = document.createElement("span");
  indentLabel.className = "settings-row-label";
  indentLabel.textContent = "缩进";
  const indentInput = document.createElement("input");
  indentInput.className = "settings-number";
  indentInput.type = "number";
  indentInput.name = "webtoolsSqlIndent";
  indentInput.min = "1";
  indentInput.max = "8";
  indentInput.step = "1";
  indentInput.value = String(webtoolsSqlIndent);
  const uppercaseWrap = document.createElement("label");
  uppercaseWrap.className = "webtools-password-flag";
  const uppercaseInput = document.createElement("input");
  uppercaseInput.type = "checkbox";
  uppercaseInput.className = "password-checkbox";
  uppercaseInput.name = "webtoolsSqlUppercase";
  uppercaseInput.checked = webtoolsSqlUppercase;
  const uppercaseText = document.createElement("span");
  uppercaseText.textContent = "关键字大写";
  uppercaseWrap.append(uppercaseInput, uppercaseText);
  indentRow.append(indentLabel, indentInput, uppercaseWrap);

  const inputRow = document.createElement("label");
  inputRow.className = "settings-row webtools-row-full";
  const inputLabel = document.createElement("span");
  inputLabel.className = "settings-row-label";
  inputLabel.textContent = "SQL 输入";
  const inputArea = document.createElement("textarea");
  inputArea.className = "settings-value webtools-textarea";
  inputArea.name = "webtoolsSqlInput";
  inputArea.value = webtoolsSqlInput;
  inputArea.placeholder = "输入 SQL";
  inputRow.append(inputLabel, inputArea);

  const outputRow = document.createElement("label");
  outputRow.className = "settings-row webtools-row-full";
  const outputLabel = document.createElement("span");
  outputLabel.className = "settings-row-label";
  outputLabel.textContent = "格式化结果";
  const outputArea = document.createElement("textarea");
  outputArea.className = "settings-value webtools-textarea";
  outputArea.readOnly = true;
  outputArea.value = webtoolsSqlOutput;
  outputArea.placeholder = "格式化后输出";
  outputRow.append(outputLabel, outputArea);

  const actions = document.createElement("div");
  actions.className = "settings-actions";
  const formatButton = document.createElement("button");
  formatButton.type = "submit";
  formatButton.className = "settings-btn settings-btn-primary";
  formatButton.textContent = "格式化";
  actions.append(formatButton);

  form.append(dialectRow, indentRow, inputRow, outputRow, actions);
  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function applyWebtoolsUnitPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  if (data && typeof data.storageValue === "number") {
    webtoolsUnitStorageValue = data.storageValue;
  }
  if (data && typeof data.storageUnit === "string") {
    webtoolsUnitStorageUnit = data.storageUnit;
  }
  if (data && typeof data.pixel === "number") {
    webtoolsUnitPixel = data.pixel;
  }
  if (data && typeof data.rem === "number") {
    webtoolsUnitRem = data.rem;
  }
  if (data && typeof data.basePx === "number") {
    webtoolsUnitBasePx = data.basePx;
  }
}

function buildWebtoolsUnitTarget(action: "storage" | "screen", source: "px" | "rem"): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("storageValue", String(webtoolsUnitStorageValue));
  params.set("storageUnit", webtoolsUnitStorageUnit);
  params.set("pixel", String(webtoolsUnitPixel));
  params.set("rem", String(webtoolsUnitRem));
  params.set("basePx", String(webtoolsUnitBasePx));
  params.set("source", source);
  return `command:plugin:${WEBTOOLS_UNIT_PLUGIN_ID}?${params.toString()}`;
}

async function executeWebtoolsUnitStorage(form: HTMLFormElement): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行单位换算");
    return;
  }

  const valueNode = form.elements.namedItem("webtoolsUnitStorageValue");
  const unitNode = form.elements.namedItem("webtoolsUnitStorageUnit");

  webtoolsUnitStorageValue =
    valueNode instanceof HTMLInputElement ? Number(valueNode.value) : 1;
  webtoolsUnitStorageUnit =
    unitNode instanceof HTMLSelectElement ? unitNode.value : "MB";

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_UNIT_PLUGIN_ID}:storage`,
    type: "command",
    title: "单位换算",
    subtitle: "面板执行",
    target: buildWebtoolsUnitTarget("storage", "px"),
    keywords: ["plugin", "unit", "storage", "容量", "换算"]
  };

  const result = await launcher.execute(item);
  const data = toRecord(result.data);
  const values = toRecord(data?.values);
  webtoolsUnitStorageValues = {};
  if (values) {
    Object.entries(values).forEach(([key, value]) => {
      if (typeof value === "number") {
        webtoolsUnitStorageValues[key] = value;
      }
    });
  }

  setStatus(result.message ?? (result.ok ? "换算完成" : "换算失败"));
  renderList();
}

async function executeWebtoolsUnitScreen(
  form: HTMLFormElement,
  source: "px" | "rem"
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行单位换算");
    return;
  }

  const pixelNode = form.elements.namedItem("webtoolsUnitPixel");
  const remNode = form.elements.namedItem("webtoolsUnitRem");
  const baseNode = form.elements.namedItem("webtoolsUnitBasePx");

  webtoolsUnitPixel = pixelNode instanceof HTMLInputElement ? Number(pixelNode.value) : 160;
  webtoolsUnitRem = remNode instanceof HTMLInputElement ? Number(remNode.value) : 10;
  webtoolsUnitBasePx = baseNode instanceof HTMLInputElement ? Number(baseNode.value) : 16;

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_UNIT_PLUGIN_ID}:screen:${source}`,
    type: "command",
    title: "单位换算",
    subtitle: "面板执行",
    target: buildWebtoolsUnitTarget("screen", source),
    keywords: ["plugin", "unit", "px", "rem", "屏幕"]
  };

  const result = await launcher.execute(item);
  const data = toRecord(result.data);
  if (data && typeof data.px === "number") {
    webtoolsUnitPixel = data.px;
  }
  if (data && typeof data.rem === "number") {
    webtoolsUnitRem = data.rem;
  }
  if (data && typeof data.basePx === "number") {
    webtoolsUnitBasePx = data.basePx;
  }

  setStatus(result.message ?? (result.ok ? "换算完成" : "换算失败"));
  renderList();
}

function renderWebtoolsUnitPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "单位换算";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "存储容量与 px/rem 换算。";

  const form = document.createElement("form");
  form.className = "settings-form webtools-unit-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsUnitStorage(form);
  });

  const storageRow = document.createElement("label");
  storageRow.className = "settings-row";
  const storageLabel = document.createElement("span");
  storageLabel.className = "settings-row-label";
  storageLabel.textContent = "容量";
  const storageInput = document.createElement("input");
  storageInput.className = "settings-number";
  storageInput.type = "number";
  storageInput.name = "webtoolsUnitStorageValue";
  storageInput.value = String(webtoolsUnitStorageValue);
  const storageUnitSelect = document.createElement("select");
  storageUnitSelect.className = "settings-number";
  storageUnitSelect.name = "webtoolsUnitStorageUnit";
  ["B", "KB", "MB", "GB", "TB"].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = webtoolsUnitStorageUnit === value;
    storageUnitSelect.appendChild(option);
  });
  storageRow.append(storageLabel, storageInput, storageUnitSelect);

  const screenRow = document.createElement("div");
  screenRow.className = "settings-row";
  const screenLabel = document.createElement("span");
  screenLabel.className = "settings-row-label";
  screenLabel.textContent = "屏幕单位";
  const baseInput = document.createElement("input");
  baseInput.className = "settings-number";
  baseInput.type = "number";
  baseInput.name = "webtoolsUnitBasePx";
  baseInput.value = String(webtoolsUnitBasePx);
  baseInput.title = "根字体 px";
  const pxInput = document.createElement("input");
  pxInput.className = "settings-number";
  pxInput.type = "number";
  pxInput.name = "webtoolsUnitPixel";
  pxInput.value = String(webtoolsUnitPixel);
  pxInput.title = "px";
  const remInput = document.createElement("input");
  remInput.className = "settings-number";
  remInput.type = "number";
  remInput.name = "webtoolsUnitRem";
  remInput.value = String(webtoolsUnitRem);
  remInput.title = "rem";
  screenRow.append(screenLabel, baseInput, pxInput, remInput);

  const resultRow = document.createElement("div");
  resultRow.className = "settings-row webtools-row-full";
  const resultLabel = document.createElement("span");
  resultLabel.className = "settings-row-label";
  resultLabel.textContent = "容量结果";
  const resultValue = document.createElement("div");
  resultValue.className = "settings-value settings-wrap";
  resultValue.style.whiteSpace = "pre-line";
  const lines = Object.keys(webtoolsUnitStorageValues)
    .sort()
    .map((unit) => `${unit}: ${webtoolsUnitStorageValues[unit]}`);
  resultValue.textContent = lines.length > 0 ? lines.join("\n") : "-";
  resultRow.append(resultLabel, resultValue);

  const actions = document.createElement("div");
  actions.className = "settings-actions";

  const storageButton = document.createElement("button");
  storageButton.type = "submit";
  storageButton.className = "settings-btn settings-btn-secondary";
  storageButton.textContent = "容量换算";

  const pxToRemButton = document.createElement("button");
  pxToRemButton.type = "button";
  pxToRemButton.className = "settings-btn settings-btn-secondary";
  pxToRemButton.textContent = "px → rem";
  pxToRemButton.addEventListener("click", () => {
    void executeWebtoolsUnitScreen(form, "px");
  });

  const remToPxButton = document.createElement("button");
  remToPxButton.type = "button";
  remToPxButton.className = "settings-btn settings-btn-primary";
  remToPxButton.textContent = "rem → px";
  remToPxButton.addEventListener("click", () => {
    void executeWebtoolsUnitScreen(form, "rem");
  });

  actions.append(storageButton, pxToRemButton, remToPxButton);
  form.append(storageRow, screenRow, resultRow, actions);
  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function applyWebtoolsQrcodePanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  if (data && typeof data.text === "string") {
    webtoolsQrText = data.text;
  }
  if (data && typeof data.size === "number") {
    webtoolsQrSize = data.size;
  }
  if (data && typeof data.level === "string") {
    webtoolsQrLevel = data.level;
  }
  webtoolsQrUrl = "";
}

function buildWebtoolsQrcodeTarget(): string {
  const params = new URLSearchParams();
  params.set("action", "generate");
  params.set("text", webtoolsQrText);
  params.set("size", String(webtoolsQrSize));
  params.set("level", webtoolsQrLevel);
  return `command:plugin:${WEBTOOLS_QRCODE_PLUGIN_ID}?${params.toString()}`;
}

async function executeWebtoolsQrcodeGenerate(form: HTMLFormElement): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行二维码工具");
    return;
  }

  const textNode = form.elements.namedItem("webtoolsQrText");
  const sizeNode = form.elements.namedItem("webtoolsQrSize");
  const levelNode = form.elements.namedItem("webtoolsQrLevel");

  webtoolsQrText = textNode instanceof HTMLTextAreaElement ? textNode.value : "";
  webtoolsQrSize = sizeNode instanceof HTMLInputElement ? Number(sizeNode.value) : 300;
  webtoolsQrLevel = levelNode instanceof HTMLSelectElement ? levelNode.value : "M";

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_QRCODE_PLUGIN_ID}:generate`,
    type: "command",
    title: "二维码生成",
    subtitle: "面板执行",
    target: buildWebtoolsQrcodeTarget(),
    keywords: ["plugin", "qrcode", "qr", "二维码", "生成"]
  };

  const result = await launcher.execute(item);
  const data = toRecord(result.data);
  webtoolsQrUrl = data && typeof data.qrUrl === "string" ? data.qrUrl : "";

  setStatus(result.message ?? (result.ok ? "生成完成" : "生成失败"));
  renderList();
}

function renderWebtoolsQrcodePanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "二维码生成";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "文本/链接转二维码图片。";

  const form = document.createElement("form");
  form.className = "settings-form webtools-qrcode-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsQrcodeGenerate(form);
  });

  const textRow = document.createElement("label");
  textRow.className = "settings-row webtools-row-full";
  const textLabel = document.createElement("span");
  textLabel.className = "settings-row-label";
  textLabel.textContent = "文本/链接";
  const textArea = document.createElement("textarea");
  textArea.className = "settings-value webtools-textarea";
  textArea.name = "webtoolsQrText";
  textArea.value = webtoolsQrText;
  textArea.placeholder = "输入文本或链接";
  textRow.append(textLabel, textArea);

  const configRow = document.createElement("div");
  configRow.className = "settings-row";
  const configLabel = document.createElement("span");
  configLabel.className = "settings-row-label";
  configLabel.textContent = "参数";
  const sizeInput = document.createElement("input");
  sizeInput.className = "settings-number";
  sizeInput.type = "number";
  sizeInput.name = "webtoolsQrSize";
  sizeInput.min = "100";
  sizeInput.max = "1000";
  sizeInput.step = "10";
  sizeInput.value = String(webtoolsQrSize);
  const levelSelect = document.createElement("select");
  levelSelect.className = "settings-number";
  levelSelect.name = "webtoolsQrLevel";
  ["L", "M", "Q", "H"].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = webtoolsQrLevel === value;
    levelSelect.appendChild(option);
  });
  configRow.append(configLabel, sizeInput, levelSelect);

  const actions = document.createElement("div");
  actions.className = "settings-actions";
  const generateButton = document.createElement("button");
  generateButton.type = "submit";
  generateButton.className = "settings-btn settings-btn-primary";
  generateButton.textContent = "生成二维码";
  actions.append(generateButton);

  form.append(textRow, configRow, actions);

  if (webtoolsQrUrl) {
    const previewRow = document.createElement("div");
    previewRow.className = "settings-row webtools-row-full";
    const previewLabel = document.createElement("span");
    previewLabel.className = "settings-row-label";
    previewLabel.textContent = "预览";
    const previewWrap = document.createElement("div");
    previewWrap.className = "settings-value settings-wrap";
    const image = document.createElement("img");
    image.src = webtoolsQrUrl;
    image.alt = "qrcode";
    image.style.maxWidth = "220px";
    image.style.maxHeight = "220px";
    image.style.borderRadius = "8px";
    previewWrap.appendChild(image);

    const downloadButton = document.createElement("button");
    downloadButton.type = "button";
    downloadButton.className = "settings-btn settings-btn-secondary";
    downloadButton.textContent = "下载";
    downloadButton.addEventListener("click", () => {
      const link = document.createElement("a");
      link.href = webtoolsQrUrl;
      link.download = "qrcode.png";
      link.click();
    });

    previewRow.append(previewLabel, previewWrap, downloadButton);
    form.appendChild(previewRow);
  }

  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function applyWebtoolsMarkdownPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  if (data && typeof data.input === "string") {
    webtoolsMarkdownInput = data.input;
  }
  webtoolsMarkdownHtml = "";
  webtoolsMarkdownInfo = "";
}

function buildWebtoolsMarkdownTarget(input: string): string {
  const params = new URLSearchParams();
  params.set("action", "render");
  params.set("input", input);
  return `command:plugin:${WEBTOOLS_MARKDOWN_PLUGIN_ID}?${params.toString()}`;
}

async function executeWebtoolsMarkdownRender(input: string): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行 Markdown 工具");
    return;
  }

  webtoolsMarkdownInput = input;
  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_MARKDOWN_PLUGIN_ID}:render`,
    type: "command",
    title: "Markdown 预览",
    subtitle: "面板执行",
    target: buildWebtoolsMarkdownTarget(input),
    keywords: ["plugin", "markdown", "md", "预览", "html"]
  };

  const result = await launcher.execute(item);
  const data = toRecord(result.data);
  webtoolsMarkdownHtml = data && typeof data.html === "string" ? data.html : "";
  webtoolsMarkdownInfo = data && typeof data.info === "string" ? data.info : "";

  setStatus(result.message ?? (result.ok ? "渲染完成" : "渲染失败"));
  renderList();
}

function renderWebtoolsMarkdownPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "Markdown 预览";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "Markdown 转 HTML 预览。";

  const form = document.createElement("form");
  form.className = "settings-form webtools-markdown-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const node = form.elements.namedItem("webtoolsMarkdownInput");
    const inputValue = node instanceof HTMLTextAreaElement ? node.value : "";
    void executeWebtoolsMarkdownRender(inputValue);
  });

  const inputRow = document.createElement("label");
  inputRow.className = "settings-row webtools-row-full";
  const inputLabel = document.createElement("span");
  inputLabel.className = "settings-row-label";
  inputLabel.textContent = "Markdown 输入";
  const inputArea = document.createElement("textarea");
  inputArea.className = "settings-value webtools-textarea";
  inputArea.name = "webtoolsMarkdownInput";
  inputArea.value = webtoolsMarkdownInput;
  inputArea.placeholder = "输入 Markdown";
  inputRow.append(inputLabel, inputArea);

  const actions = document.createElement("div");
  actions.className = "settings-actions";
  const renderButton = document.createElement("button");
  renderButton.type = "submit";
  renderButton.className = "settings-btn settings-btn-primary";
  renderButton.textContent = "渲染";
  actions.append(renderButton);

  const htmlRow = document.createElement("div");
  htmlRow.className = "settings-row webtools-row-full";
  const htmlLabel = document.createElement("span");
  htmlLabel.className = "settings-row-label";
  htmlLabel.textContent = "HTML 输出";
  const htmlArea = document.createElement("textarea");
  htmlArea.className = "settings-value webtools-textarea";
  htmlArea.readOnly = true;
  htmlArea.value = webtoolsMarkdownHtml;
  htmlArea.placeholder = "渲染后 HTML";
  const htmlHint = document.createElement("span");
  htmlHint.className = "settings-row-hint";
  htmlHint.textContent = webtoolsMarkdownInfo || "-";
  htmlRow.append(htmlLabel, htmlArea, htmlHint);

  form.append(inputRow, actions, htmlRow);

  if (webtoolsMarkdownHtml.trim()) {
    const previewRow = document.createElement("div");
    previewRow.className = "settings-row webtools-row-full";
    const previewLabel = document.createElement("span");
    previewLabel.className = "settings-row-label";
    previewLabel.textContent = "预览";
    const previewWrap = document.createElement("div");
    previewWrap.className = "settings-value settings-wrap";
    previewWrap.innerHTML = webtoolsMarkdownHtml;
    previewRow.append(previewLabel, previewWrap);
    form.appendChild(previewRow);
  }

  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function applyWebtoolsUaPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  if (data && typeof data.ua === "string") {
    webtoolsUaInput = data.ua;
  } else {
    webtoolsUaInput = navigator.userAgent;
  }
  webtoolsUaResult = {};
}

function buildWebtoolsUaTarget(ua: string): string {
  const params = new URLSearchParams();
  params.set("action", "parse");
  params.set("ua", ua);
  return `command:plugin:${WEBTOOLS_UA_PLUGIN_ID}?${params.toString()}`;
}

async function executeWebtoolsUaParse(ua: string): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行 UA 解析");
    return;
  }

  webtoolsUaInput = ua;
  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_UA_PLUGIN_ID}:parse`,
    type: "command",
    title: "UA 解析",
    subtitle: "面板执行",
    target: buildWebtoolsUaTarget(ua),
    keywords: ["plugin", "ua", "user-agent", "浏览器", "解析"]
  };

  const result = await launcher.execute(item);
  const data = toRecord(result.data);
  const parsed: Record<string, string> = {};

  [
    "browser",
    "browserVersion",
    "os",
    "osVersion",
    "device",
    "engine",
    "cpu"
  ].forEach((key) => {
    if (data && typeof data[key] === "string") {
      parsed[key] = data[key] as string;
    }
  });

  webtoolsUaResult = parsed;
  setStatus(result.message ?? (result.ok ? "解析完成" : "解析失败"));
  renderList();
}

function renderWebtoolsUaPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "UA 解析";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "解析浏览器、系统、设备信息。";

  const form = document.createElement("form");
  form.className = "settings-form webtools-ua-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const node = form.elements.namedItem("webtoolsUaInput");
    const ua = node instanceof HTMLTextAreaElement ? node.value : "";
    void executeWebtoolsUaParse(ua);
  });

  const inputRow = document.createElement("label");
  inputRow.className = "settings-row webtools-row-full";
  const inputLabel = document.createElement("span");
  inputLabel.className = "settings-row-label";
  inputLabel.textContent = "UA 字符串";
  const inputArea = document.createElement("textarea");
  inputArea.className = "settings-value webtools-textarea";
  inputArea.name = "webtoolsUaInput";
  inputArea.value = webtoolsUaInput || navigator.userAgent;
  inputArea.placeholder = "粘贴 User-Agent";
  inputRow.append(inputLabel, inputArea);

  const actions = document.createElement("div");
  actions.className = "settings-actions";

  const useCurrentButton = document.createElement("button");
  useCurrentButton.type = "button";
  useCurrentButton.className = "settings-btn settings-btn-secondary";
  useCurrentButton.textContent = "使用当前 UA";
  useCurrentButton.addEventListener("click", () => {
    inputArea.value = navigator.userAgent;
    void executeWebtoolsUaParse(navigator.userAgent);
  });

  const parseButton = document.createElement("button");
  parseButton.type = "submit";
  parseButton.className = "settings-btn settings-btn-primary";
  parseButton.textContent = "解析";

  actions.append(useCurrentButton, parseButton);
  form.append(inputRow, actions);

  const entries = Object.entries(webtoolsUaResult);
  if (entries.length > 0) {
    const tableWrap = document.createElement("div");
    tableWrap.className = "webtools-mini-table-wrap";
    const table = document.createElement("table");
    table.className = "webtools-mini-table";
    const tbody = document.createElement("tbody");
    const labels: Record<string, string> = {
      browser: "浏览器",
      browserVersion: "浏览器版本",
      os: "系统",
      osVersion: "系统版本",
      device: "设备",
      engine: "引擎",
      cpu: "CPU"
    };

    entries.forEach(([key, value]) => {
      const tr = document.createElement("tr");
      const keyCell = document.createElement("td");
      keyCell.textContent = labels[key] ?? key;
      const valueCell = document.createElement("td");
      valueCell.textContent = value;
      tr.append(keyCell, valueCell);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableWrap.appendChild(table);
    form.appendChild(tableWrap);
  }

  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function applyWebtoolsApiPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  if (data && typeof data.method === "string") {
    webtoolsApiMethod = data.method;
  }
  if (data && typeof data.url === "string") {
    webtoolsApiUrl = data.url;
  }
  if (data && typeof data.bodyType === "string") {
    webtoolsApiBodyType = data.bodyType;
  }
  if (data && typeof data.bodyContent === "string") {
    webtoolsApiBodyContent = data.bodyContent;
  }

  if (data && Array.isArray(data.params)) {
    const lines: string[] = [];
    data.params.forEach((row) => {
      const record = toRecord(row);
      if (!record) {
        return;
      }
      if (
        typeof record.key === "string" &&
        typeof record.value === "string" &&
        (typeof record.enabled !== "boolean" || record.enabled)
      ) {
        lines.push(`${record.key}=${record.value}`);
      }
    });
    webtoolsApiParamsText = lines.join("\n");
  }

  if (data && Array.isArray(data.headers)) {
    const lines: string[] = [];
    data.headers.forEach((row) => {
      const record = toRecord(row);
      if (!record) {
        return;
      }
      if (
        typeof record.key === "string" &&
        typeof record.value === "string" &&
        (typeof record.enabled !== "boolean" || record.enabled)
      ) {
        lines.push(`${record.key}=${record.value}`);
      }
    });
    webtoolsApiHeadersText = lines.join("\n");
  }

  if (data && Array.isArray(data.formRows)) {
    const lines: string[] = [];
    data.formRows.forEach((row) => {
      const record = toRecord(row);
      if (!record) {
        return;
      }
      if (
        typeof record.key === "string" &&
        typeof record.value === "string" &&
        (typeof record.enabled !== "boolean" || record.enabled)
      ) {
        lines.push(`${record.key}=${record.value}`);
      }
    });
    webtoolsApiFormText = lines.join("\n");
  }

  webtoolsApiResponseStatus = "";
  webtoolsApiResponseMeta = "";
  webtoolsApiResponseBody = "";
  webtoolsApiResponseHeaders = {};
}

function buildWebtoolsApiTarget(): string {
  const params = new URLSearchParams();
  params.set("action", "request");
  params.set("method", webtoolsApiMethod);
  params.set("url", webtoolsApiUrl);
  params.set("params", JSON.stringify(parseKeyValueText(webtoolsApiParamsText)));
  params.set("headers", JSON.stringify(parseKeyValueText(webtoolsApiHeadersText)));
  params.set("bodyType", webtoolsApiBodyType);
  params.set("bodyContent", webtoolsApiBodyContent);
  params.set("formRows", JSON.stringify(parseKeyValueText(webtoolsApiFormText)));
  return `command:plugin:${WEBTOOLS_API_PLUGIN_ID}?${params.toString()}`;
}

async function executeWebtoolsApiRequest(form: HTMLFormElement): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行 API 调试");
    return;
  }

  const methodNode = form.elements.namedItem("webtoolsApiMethod");
  const urlNode = form.elements.namedItem("webtoolsApiUrl");
  const paramsNode = form.elements.namedItem("webtoolsApiParams");
  const headersNode = form.elements.namedItem("webtoolsApiHeaders");
  const bodyTypeNode = form.elements.namedItem("webtoolsApiBodyType");
  const bodyNode = form.elements.namedItem("webtoolsApiBody");
  const formNode = form.elements.namedItem("webtoolsApiForm");

  webtoolsApiMethod = methodNode instanceof HTMLSelectElement ? methodNode.value : "GET";
  webtoolsApiUrl = urlNode instanceof HTMLInputElement ? urlNode.value : "";
  webtoolsApiParamsText =
    paramsNode instanceof HTMLTextAreaElement ? paramsNode.value : "";
  webtoolsApiHeadersText =
    headersNode instanceof HTMLTextAreaElement ? headersNode.value : "";
  webtoolsApiBodyType =
    bodyTypeNode instanceof HTMLSelectElement ? bodyTypeNode.value : "json";
  webtoolsApiBodyContent =
    bodyNode instanceof HTMLTextAreaElement ? bodyNode.value : "";
  webtoolsApiFormText = formNode instanceof HTMLTextAreaElement ? formNode.value : "";

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_API_PLUGIN_ID}:request`,
    type: "command",
    title: "API 调试",
    subtitle: "面板执行",
    target: buildWebtoolsApiTarget(),
    keywords: ["plugin", "api", "http", "request", "调试"]
  };

  const result = await launcher.execute(item);
  const data = toRecord(result.data);

  const status = data && typeof data.status === "number" ? data.status : 0;
  const statusText =
    data && typeof data.statusText === "string" ? data.statusText : "";
  webtoolsApiResponseStatus = status ? `${status} ${statusText}` : "请求失败";

  const timeMs = data && typeof data.timeMs === "number" ? data.timeMs : 0;
  const sizeText = data && typeof data.sizeText === "string" ? data.sizeText : "";
  const fullUrl = data && typeof data.fullUrl === "string" ? data.fullUrl : "";
  webtoolsApiResponseMeta = `URL: ${fullUrl}\n耗时: ${timeMs} ms\n响应大小: ${sizeText}`;

  webtoolsApiResponseBody =
    data && typeof data.body === "string" ? data.body : "";
  webtoolsApiResponseHeaders = {};
  const headersRecord = toRecord(data?.headers);
  if (headersRecord) {
    Object.entries(headersRecord).forEach(([key, value]) => {
      if (typeof value === "string") {
        webtoolsApiResponseHeaders[key] = value;
      }
    });
  }

  setStatus(result.message ?? (result.ok ? "请求完成" : "请求失败"));
  renderList();
}

function renderWebtoolsApiPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "API 调试";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "HTTP 请求构建与响应查看。";

  const form = document.createElement("form");
  form.className = "settings-form webtools-api-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsApiRequest(form);
  });

  const requestRow = document.createElement("div");
  requestRow.className = "settings-row";
  const requestLabel = document.createElement("span");
  requestLabel.className = "settings-row-label";
  requestLabel.textContent = "请求";
  const methodSelect = document.createElement("select");
  methodSelect.className = "settings-number";
  methodSelect.name = "webtoolsApiMethod";
  ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].forEach((method) => {
    const option = document.createElement("option");
    option.value = method;
    option.textContent = method;
    option.selected = webtoolsApiMethod === method;
    methodSelect.appendChild(option);
  });
  const urlInput = document.createElement("input");
  urlInput.className = "settings-value";
  urlInput.name = "webtoolsApiUrl";
  urlInput.value = webtoolsApiUrl;
  urlInput.placeholder = "https://example.com/api";
  requestRow.append(requestLabel, methodSelect, urlInput);

  const paramsRow = document.createElement("label");
  paramsRow.className = "settings-row webtools-row-full";
  const paramsLabel = document.createElement("span");
  paramsLabel.className = "settings-row-label";
  paramsLabel.textContent = "Query 参数";
  const paramsArea = document.createElement("textarea");
  paramsArea.className = "settings-value webtools-textarea";
  paramsArea.name = "webtoolsApiParams";
  paramsArea.value = webtoolsApiParamsText;
  paramsArea.placeholder = "key=value，每行一组";
  paramsRow.append(paramsLabel, paramsArea);

  const headersRow = document.createElement("label");
  headersRow.className = "settings-row webtools-row-full";
  const headersLabel = document.createElement("span");
  headersLabel.className = "settings-row-label";
  headersLabel.textContent = "Headers";
  const headersArea = document.createElement("textarea");
  headersArea.className = "settings-value webtools-textarea";
  headersArea.name = "webtoolsApiHeaders";
  headersArea.value = webtoolsApiHeadersText;
  headersArea.placeholder = "Header=Value，每行一组";
  headersRow.append(headersLabel, headersArea);

  const bodyTypeRow = document.createElement("label");
  bodyTypeRow.className = "settings-row";
  const bodyTypeLabel = document.createElement("span");
  bodyTypeLabel.className = "settings-row-label";
  bodyTypeLabel.textContent = "Body 类型";
  const bodyTypeSelect = document.createElement("select");
  bodyTypeSelect.className = "settings-number";
  bodyTypeSelect.name = "webtoolsApiBodyType";
  [
    { value: "json", label: "JSON" },
    { value: "text", label: "文本" },
    { value: "formdata", label: "FormData" }
  ].forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.value;
    option.textContent = entry.label;
    option.selected = webtoolsApiBodyType === entry.value;
    bodyTypeSelect.appendChild(option);
  });
  bodyTypeRow.append(bodyTypeLabel, bodyTypeSelect);

  const bodyRow = document.createElement("label");
  bodyRow.className = "settings-row webtools-row-full";
  const bodyLabel = document.createElement("span");
  bodyLabel.className = "settings-row-label";
  bodyLabel.textContent = "Body 内容";
  const bodyArea = document.createElement("textarea");
  bodyArea.className = "settings-value webtools-textarea";
  bodyArea.name = "webtoolsApiBody";
  bodyArea.value = webtoolsApiBodyContent;
  bodyArea.placeholder = "JSON 或文本请求体";
  bodyRow.append(bodyLabel, bodyArea);

  const formRow = document.createElement("label");
  formRow.className = "settings-row webtools-row-full";
  const formLabel = document.createElement("span");
  formLabel.className = "settings-row-label";
  formLabel.textContent = "FormData 键值";
  const formArea = document.createElement("textarea");
  formArea.className = "settings-value webtools-textarea";
  formArea.name = "webtoolsApiForm";
  formArea.value = webtoolsApiFormText;
  formArea.placeholder = "key=value，每行一组";
  formRow.append(formLabel, formArea);

  const actions = document.createElement("div");
  actions.className = "settings-actions";
  const requestButton = document.createElement("button");
  requestButton.type = "submit";
  requestButton.className = "settings-btn settings-btn-primary";
  requestButton.textContent = "发送请求";
  actions.append(requestButton);

  form.append(
    requestRow,
    paramsRow,
    headersRow,
    bodyTypeRow,
    bodyRow,
    formRow,
    actions
  );

  if (webtoolsApiResponseStatus) {
    const responseMetaRow = document.createElement("div");
    responseMetaRow.className = "settings-row webtools-row-full";
    const responseMetaLabel = document.createElement("span");
    responseMetaLabel.className = "settings-row-label";
    responseMetaLabel.textContent = "响应状态";
    const responseMetaValue = document.createElement("div");
    responseMetaValue.className = "settings-value settings-wrap";
    responseMetaValue.textContent = `${webtoolsApiResponseStatus}\n${webtoolsApiResponseMeta}`;
    responseMetaValue.style.whiteSpace = "pre-line";
    responseMetaRow.append(responseMetaLabel, responseMetaValue);
    form.appendChild(responseMetaRow);
  }

  if (webtoolsApiResponseBody) {
    const responseBodyRow = document.createElement("label");
    responseBodyRow.className = "settings-row webtools-row-full";
    const responseBodyLabel = document.createElement("span");
    responseBodyLabel.className = "settings-row-label";
    responseBodyLabel.textContent = "响应 Body";
    const responseBodyArea = document.createElement("textarea");
    responseBodyArea.className = "settings-value webtools-textarea";
    responseBodyArea.readOnly = true;
    responseBodyArea.value = webtoolsApiResponseBody;
    responseBodyRow.append(responseBodyLabel, responseBodyArea);
    form.appendChild(responseBodyRow);
  }

  if (Object.keys(webtoolsApiResponseHeaders).length > 0) {
    const responseHeadersRow = document.createElement("div");
    responseHeadersRow.className = "settings-row webtools-row-full";
    const responseHeadersLabel = document.createElement("span");
    responseHeadersLabel.className = "settings-row-label";
    responseHeadersLabel.textContent = "响应 Headers";
    const responseHeadersValue = document.createElement("div");
    responseHeadersValue.className = "settings-value settings-wrap";
    responseHeadersValue.style.whiteSpace = "pre-line";
    responseHeadersValue.textContent = Object.entries(webtoolsApiResponseHeaders)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
    responseHeadersRow.append(responseHeadersLabel, responseHeadersValue);
    form.appendChild(responseHeadersRow);
  }

  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function renderPluginPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const plugin = activePluginPanel;
  const titleText = plugin?.title || "\u63d2\u4ef6\u9762\u677f";
  const subtitleText =
    plugin?.subtitle || "\u8be5\u63d2\u4ef6\u5df2\u63a5\u5165\uff0c\u53ef\u89c6\u5316\u9875\u9762\u6b63\u5728\u5b9e\u88c5";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = titleText;

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent = subtitleText;

  const info = document.createElement("div");
  info.className = "settings-value settings-wrap";
  info.textContent = plugin
    ? `\u63d2\u4ef6 ID\uff1a${plugin.pluginId}`
    : "\u672a\u9009\u4e2d\u63d2\u4ef6";

  const hint = document.createElement("p");
  hint.className = "settings-description";
  hint.textContent = plugin?.message
    ? plugin.message
    : "\u5f53\u524d\u4e3a\u7edf\u4e00\u63d2\u4ef6\u9762\u677f\u9aa8\u67b6\uff0c\u4e0b\u4e00\u6b65\u5c06\u9010\u4e2a\u8865\u9f50\u529f\u80fd\u754c\u9762\u3002";

  const actions = document.createElement("div");
  actions.className = "settings-actions";

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "settings-btn settings-btn-primary";
  backButton.textContent = "\u8fd4\u56de\u641c\u7d22";
  backButton.addEventListener("click", () => {
    backToSearch();
  });

  actions.append(backButton);
  panel.append(title, description, info, hint, actions);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function getPluginPanelHandler(pluginId: string): PluginPanelHandler | null {
  if (pluginId === WEBTOOLS_PASSWORD_PLUGIN_ID) {
    return {
      render: renderWebtoolsPasswordPanel,
      onOpen: applyWebtoolsPasswordPanelPayload,
      onEnter: () => {
        const form = list.querySelector("form.webtools-password-form");
        if (form instanceof HTMLFormElement) {
          void generateFromWebtoolsPasswordPanel(form, { render: false });
        }
      }
    };
  }

  if (pluginId === WEBTOOLS_JSON_PLUGIN_ID) {
    return {
      render: renderWebtoolsJsonPanel,
      onOpen: applyWebtoolsJsonPanelPayload,
      onEnter: () => {
        const form = list.querySelector("form.webtools-json-form");
        if (form instanceof HTMLFormElement) {
          void executeWebtoolsJsonConvert(form, { render: false });
        }
      }
    };
  }

  if (pluginId === WEBTOOLS_URL_PLUGIN_ID) {
    return {
      render: renderWebtoolsUrlPanel,
      onOpen: applyWebtoolsUrlPanelPayload,
      onEnter: () => {
        const form = list.querySelector("form.webtools-url-form");
        if (!(form instanceof HTMLFormElement)) {
          return;
        }

        const inputNode = form.elements.namedItem("webtoolsUrlInput");
        const input = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
        void executeWebtoolsUrlAction("parse", input);
      }
    };
  }

  if (pluginId === WEBTOOLS_DIFF_PLUGIN_ID) {
    return {
      render: renderWebtoolsDiffPanel,
      onOpen: applyWebtoolsDiffPanelPayload,
      onEnter: () => {
        const form = list.querySelector("form.webtools-diff-form");
        if (form instanceof HTMLFormElement) {
          void executeWebtoolsDiffCompare(form);
        }
      }
    };
  }

  if (pluginId === WEBTOOLS_TIMESTAMP_PLUGIN_ID) {
    return {
      render: renderWebtoolsTimestampPanel,
      onOpen: applyWebtoolsTimestampPanelPayload,
      onEnter: () => {
        const form = list.querySelector("form.webtools-timestamp-form");
        if (!(form instanceof HTMLFormElement)) {
          return;
        }

        const inputNode = form.elements.namedItem("webtoolsTimestampInput");
        const input = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
        void executeWebtoolsTimestampAction("toDate", input);
      }
    };
  }

  if (pluginId === WEBTOOLS_REGEX_PLUGIN_ID) {
    return {
      render: renderWebtoolsRegexPanel,
      onOpen: applyWebtoolsRegexPanelPayload,
      onEnter: () => {
        const form = list.querySelector("form.webtools-regex-form");
        if (form instanceof HTMLFormElement) {
          void executeWebtoolsRegexAction("test", form);
        }
      }
    };
  }

  if (pluginId === WEBTOOLS_CRON_PLUGIN_ID) {
    return {
      render: renderWebtoolsCronPanel,
      onOpen: applyWebtoolsCronPanelPayload,
      onEnter: () => {
        const form = list.querySelector("form.webtools-cron-form");
        if (!(form instanceof HTMLFormElement)) {
          return;
        }
        const node = form.elements.namedItem("webtoolsCronExpression");
        const expression = node instanceof HTMLInputElement ? node.value : "";
        void executeWebtoolsCronAction("parse", expression, {
          render: false,
          form
        });
      }
    };
  }

  if (pluginId === WEBTOOLS_CRYPTO_PLUGIN_ID) {
    return {
      render: renderWebtoolsCryptoPanel,
      onOpen: applyWebtoolsCryptoPanelPayload,
      onEnter: () => {
        const form = list.querySelector("form.webtools-crypto-form");
        if (form instanceof HTMLFormElement) {
          void executeWebtoolsCryptoProcess(form, { render: false });
        }
      }
    };
  }

  if (pluginId === WEBTOOLS_JWT_PLUGIN_ID) {
    return {
      render: renderWebtoolsJwtPanel,
      onOpen: applyWebtoolsJwtPanelPayload,
      onEnter: () => {
        const form = list.querySelector("form.webtools-jwt-form");
        if (form instanceof HTMLFormElement) {
          void executeWebtoolsJwtAction("parse", form, { render: false });
        }
      }
    };
  }

  if (pluginId === WEBTOOLS_STRINGS_PLUGIN_ID) {
    return {
      render: renderWebtoolsStringsPanel,
      onOpen: applyWebtoolsStringsPanelPayload,
      onEnter: () => {
        const form = list.querySelector("form.webtools-strings-form");
        if (form instanceof HTMLFormElement) {
          void executeWebtoolsStringsAction("convert", form);
        }
      }
    };
  }

  if (pluginId === WEBTOOLS_COLORS_PLUGIN_ID) {
    return {
      render: renderWebtoolsColorsPanel,
      onOpen: applyWebtoolsColorsPanelPayload,
      onEnter: () => {
        const form = list.querySelector("form.webtools-colors-form");
        if (!(form instanceof HTMLFormElement)) {
          return;
        }
        const node = form.elements.namedItem("webtoolsColorsInput");
        const color = node instanceof HTMLInputElement ? node.value : "";
        void executeWebtoolsColorsConvert(color);
      }
    };
  }

  if (pluginId === WEBTOOLS_IMAGE_BASE64_PLUGIN_ID) {
    return {
      render: renderWebtoolsImageBase64Panel,
      onOpen: applyWebtoolsImageBase64PanelPayload,
      onEnter: () => {
        const form = list.querySelector("form.webtools-image-base64-form");
        if (!(form instanceof HTMLFormElement)) {
          return;
        }
        const node = form.elements.namedItem("webtoolsImageBase64Input");
        const inputValue = node instanceof HTMLTextAreaElement ? node.value : "";
        void executeWebtoolsImageBase64Normalize(inputValue);
      }
    };
  }

  if (pluginId === WEBTOOLS_CONFIG_PLUGIN_ID) {
    return {
      render: renderWebtoolsConfigPanel,
      onOpen: applyWebtoolsConfigPanelPayload,
      onEnter: () => {
        const form = list.querySelector("form.webtools-config-form");
        if (form instanceof HTMLFormElement) {
          void executeWebtoolsConfigConvert(form);
        }
      }
    };
  }

  if (pluginId === WEBTOOLS_SQL_PLUGIN_ID) {
    return {
      render: renderWebtoolsSqlPanel,
      onOpen: applyWebtoolsSqlPanelPayload,
      onEnter: () => {
        const form = list.querySelector("form.webtools-sql-form");
        if (form instanceof HTMLFormElement) {
          void executeWebtoolsSqlFormat(form);
        }
      }
    };
  }

  if (pluginId === WEBTOOLS_UNIT_PLUGIN_ID) {
    return {
      render: renderWebtoolsUnitPanel,
      onOpen: applyWebtoolsUnitPanelPayload,
      onEnter: () => {
        const form = list.querySelector("form.webtools-unit-form");
        if (form instanceof HTMLFormElement) {
          void executeWebtoolsUnitStorage(form);
        }
      }
    };
  }

  if (pluginId === WEBTOOLS_QRCODE_PLUGIN_ID) {
    return {
      render: renderWebtoolsQrcodePanel,
      onOpen: applyWebtoolsQrcodePanelPayload,
      onEnter: () => {
        const form = list.querySelector("form.webtools-qrcode-form");
        if (form instanceof HTMLFormElement) {
          void executeWebtoolsQrcodeGenerate(form);
        }
      }
    };
  }

  if (pluginId === WEBTOOLS_MARKDOWN_PLUGIN_ID) {
    return {
      render: renderWebtoolsMarkdownPanel,
      onOpen: applyWebtoolsMarkdownPanelPayload,
      onEnter: () => {
        const form = list.querySelector("form.webtools-markdown-form");
        if (!(form instanceof HTMLFormElement)) {
          return;
        }
        const node = form.elements.namedItem("webtoolsMarkdownInput");
        const inputValue = node instanceof HTMLTextAreaElement ? node.value : "";
        void executeWebtoolsMarkdownRender(inputValue);
      }
    };
  }

  if (pluginId === WEBTOOLS_UA_PLUGIN_ID) {
    return {
      render: renderWebtoolsUaPanel,
      onOpen: applyWebtoolsUaPanelPayload,
      onEnter: () => {
        const form = list.querySelector("form.webtools-ua-form");
        if (!(form instanceof HTMLFormElement)) {
          return;
        }
        const node = form.elements.namedItem("webtoolsUaInput");
        const ua = node instanceof HTMLTextAreaElement ? node.value : "";
        void executeWebtoolsUaParse(ua);
      }
    };
  }

  if (pluginId === WEBTOOLS_API_PLUGIN_ID) {
    return {
      render: renderWebtoolsApiPanel,
      onOpen: applyWebtoolsApiPanelPayload,
      onEnter: () => {
        const form = list.querySelector("form.webtools-api-form");
        if (form instanceof HTMLFormElement) {
          void executeWebtoolsApiRequest(form);
        }
      }
    };
  }

  return null;
}

function renderActivePluginPanel(): void {
  const plugin = activePluginPanel;
  if (!plugin) {
    renderPluginPanel();
    return;
  }

  const handler = getPluginPanelHandler(plugin.pluginId);
  if (!handler) {
    renderPluginPanel();
    return;
  }

  handler.render();
}

function handleActivePluginPanelEnter(): void {
  const plugin = activePluginPanel;
  if (!plugin) {
    setStatus("未选中插件");
    return;
  }

  const handler = getPluginPanelHandler(plugin.pluginId);
  if (!handler?.onEnter) {
    setStatus("该插件未定义默认 Enter 动作，可按 Esc 返回搜索");
    return;
  }

  handler.onEnter();
}

function createCashflowStat(
  label: string,
  value: string,
  emphasize = false
): HTMLDivElement {
  const node = document.createElement("div");
  node.className = "cashflow-stat";
  if (emphasize) {
    node.classList.add("cashflow-stat-emphasis");
  }

  const labelNode = document.createElement("div");
  labelNode.className = "cashflow-stat-label";
  labelNode.textContent = label;

  const valueNode = document.createElement("div");
  valueNode.className = "cashflow-stat-value";
  valueNode.textContent = value;

  node.append(labelNode, valueNode);
  return node;
}

function createCashflowReportList(
  title: string,
  items: Array<{ name: string; amount: number }>
): HTMLDivElement {
  const block = document.createElement("div");
  block.className = "cashflow-report-item";

  const head = document.createElement("div");
  head.className = "cashflow-report-item-title";
  head.textContent = title;
  block.appendChild(head);

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "cashflow-empty";
    empty.textContent = "暂无条目";
    block.appendChild(empty);
    return block;
  }

  const listNode = document.createElement("ul");
  listNode.className = "cashflow-report-list";
  for (const item of items) {
    const row = document.createElement("li");
    row.className = "cashflow-report-row";

    const name = document.createElement("span");
    name.className = "cashflow-report-name";
    name.textContent = item.name;

    const amount = document.createElement("span");
    amount.className = "cashflow-report-amount";
    amount.textContent = formatMoney(item.amount);

    row.append(name, amount);
    listNode.appendChild(row);
  }
  block.appendChild(listNode);
  return block;
}

function createCashflowMetricRow(label: string, value: string): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "cashflow-metric-row";

  const name = document.createElement("span");
  name.className = "cashflow-metric-label";
  name.textContent = label;

  const val = document.createElement("span");
  val.className = "cashflow-metric-value";
  val.textContent = value;

  row.append(name, val);
  return row;
}

function createCashflowBadge(
  text: string,
  tone: "info" | "success" | "warning" | "danger" = "info"
): HTMLSpanElement {
  const badge = document.createElement("span");
  badge.className = `cashflow-badge cashflow-badge-${tone}`;
  badge.textContent = text;
  return badge;
}

function renderCashflowPanel(): void {
  const state = cashflowState;
  const reports = cashflowReports;
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel cashflow-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = "\u5bcc\u7238\u7238\u73b0\u91d1\u6d41\uff08\u63d2\u4ef6\u6e38\u620f\uff09";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    "\u76ee\u6807\uff1a\u628a\u88ab\u52a8\u6536\u5165\u63d0\u9ad8\u5230\u4e0d\u4f4e\u4e8e\u603b\u652f\u51fa\uff0c\u8fbe\u6210\u8d22\u52a1\u81ea\u7531\u3002";

  if (!state) {
    const loading = document.createElement("div");
    loading.className = "cashflow-empty";
    loading.textContent = "\u6b63\u5728\u52a0\u8f7d\u6e38\u620f\u6570\u636e...";
    panel.append(title, description, loading);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);
    return;
  }

  const salaryAfterTax = Math.max(0, Math.round(state.salary * (1 - state.taxRate)));
  const totalExpenses = state.expenses + state.debtPayment;
  const monthlyNet = salaryAfterTax + state.passiveIncome - totalExpenses;
  const freedomTarget = Math.max(1, totalExpenses);
  const freedomProgress = Math.max(
    0,
    Math.min(1, state.passiveIncome / freedomTarget)
  );
  const freedomGap = Math.max(0, totalExpenses - state.passiveIncome);

  const hud = document.createElement("section");
  hud.className = "cashflow-hud";

  const hudTop = document.createElement("div");
  hudTop.className = "cashflow-hud-top";
  const hudTitle = document.createElement("div");
  hudTitle.className = "cashflow-hud-title";
  hudTitle.textContent = "\u8d22\u52a1\u81ea\u7531\u6311\u6218";

  const hudBadges = document.createElement("div");
  hudBadges.className = "cashflow-hud-badges";
  hudBadges.append(
    createCashflowBadge(cashflowPhaseLabel(state.phase), "info"),
    createCashflowBadge(`M${state.turn}`, "warning"),
    createCashflowBadge(
      state.won
        ? "\u5df2\u901a\u5173"
        : state.lost
        ? "\u672c\u5c40\u5931\u8d25"
        : "\u6e38\u620f\u4e2d",
      state.won ? "success" : state.lost ? "danger" : "info"
    )
  );
  hudTop.append(hudTitle, hudBadges);

  const progressLabel = document.createElement("div");
  progressLabel.className = "cashflow-progress-label";
  progressLabel.textContent = `\u8d22\u52a1\u81ea\u7531\u8fdb\u5ea6 ${Math.round(
    freedomProgress * 100
  )}%`;

  const progressTrack = document.createElement("div");
  progressTrack.className = "cashflow-progress-track";
  const progressFill = document.createElement("div");
  progressFill.className = "cashflow-progress-fill";
  progressFill.style.width = `${Math.round(freedomProgress * 100)}%`;
  progressTrack.appendChild(progressFill);

  const progressHint = document.createElement("div");
  progressHint.className = "cashflow-progress-hint";
  progressHint.textContent = state.won
    ? `\u5df2\u8fbe\u6210\uff1a${formatMoney(state.passiveIncome)} \u2265 ${formatMoney(
        totalExpenses
      )}`
    : state.lost
    ? "\u5f53\u524d\u5bf9\u5c40\u5df2\u7ed3\u675f\uff0c\u53ef\u76f4\u63a5\u65b0\u5f00\u4e00\u5c40"
    : `\u8ddd\u79bb\u901a\u5173\u8fd8\u5dee ${formatMoney(freedomGap)}/\u6708 \u88ab\u52a8\u6536\u5165`;

  hud.append(hudTop, progressLabel, progressTrack, progressHint);

  const statGrid = document.createElement("div");
  statGrid.className = "cashflow-stats";
  statGrid.append(
    createCashflowStat("\u73b0\u91d1", formatMoney(state.cash), true),
    createCashflowStat(
      "\u88ab\u52a8\u6536\u5165",
      `${formatMoney(state.passiveIncome)}/\u6708`,
      true
    ),
    createCashflowStat(
      "\u6708\u51c0\u73b0\u91d1\u6d41",
      `${monthlyNet >= 0 ? "+" : ""}${formatMoney(monthlyNet)}/\u6708`,
      monthlyNet >= 0
    ),
    createCashflowStat("\u5269\u4f59\u503a\u52a1", formatMoney(state.debt)),
    createCashflowStat(
      "\u7a0e\u540e\u5de5\u8d44",
      `${formatMoney(salaryAfterTax)}/\u6708`
    ),
    createCashflowStat("\u603b\u652f\u51fa", `${formatMoney(totalExpenses)}/\u6708`),
    createCashflowStat("\u804c\u4e1a", state.role),
    createCashflowStat(
      "\u72b6\u6001",
      state.won
        ? "\u5df2\u8fbe\u6210\u8d22\u52a1\u81ea\u7531"
        : state.lost
        ? "\u672c\u5c40\u5931\u8d25"
        : "\u7a33\u6b65\u7d2f\u79ef\u4e2d",
      state.won || state.lost
    )
  );

  const roleBlock = document.createElement("section");
  roleBlock.className = "cashflow-block";
  roleBlock.classList.add("cashflow-block-role");
  const roleTitle = document.createElement("h4");
  roleTitle.className = "cashflow-block-title";
  roleTitle.textContent = "\u5f00\u5c40\u804c\u4e1a";
  roleBlock.appendChild(roleTitle);

  if (cashflowJobs.length === 0) {
    const emptyJobs = document.createElement("div");
    emptyJobs.className = "cashflow-empty";
    emptyJobs.textContent = "\u804c\u4e1a\u5217\u8868\u52a0\u8f7d\u4e2d...";
    roleBlock.appendChild(emptyJobs);
  } else {
    const roleForm = document.createElement("div");
    roleForm.className = "cashflow-role-picker";

    const roleSelect = document.createElement("select");
    roleSelect.className = "cashflow-role-select";
    for (const job of cashflowJobs) {
      const option = document.createElement("option");
      option.value = job.key;
      option.textContent =
        `${job.role} \u00b7 \u7a0e\u7387 ${formatPercent(job.taxRate)} \u00b7 \u503a\u52a1 ${formatMoney(job.initialDebt)}`;
      if (job.key === state.jobKey) {
        option.selected = true;
      }
      roleSelect.appendChild(option);
    }

    const roleResetButton = document.createElement("button");
    roleResetButton.type = "button";
    roleResetButton.className = "settings-btn settings-btn-secondary";
    roleResetButton.textContent = "\u4ee5\u8be5\u804c\u4e1a\u65b0\u5f00";
    roleResetButton.addEventListener("click", () => {
      void resetCashflowGame(roleSelect.value);
    });

    roleForm.append(roleSelect, roleResetButton);
    roleBlock.appendChild(roleForm);
  }

  if (state.lost) {
    const lostNote = document.createElement("div");
    lostNote.className = "cashflow-failed-note";
    lostNote.textContent = state.lossReason ?? "\u672c\u5c40\u5931\u8d25\uff0c\u8bf7\u65b0\u5f00\u4e00\u5c40\u3002";
    roleBlock.appendChild(lostNote);
  }

  const aiBlock = document.createElement("section");
  aiBlock.className = "cashflow-block";
  aiBlock.classList.add("cashflow-block-ai");
  const aiTitle = document.createElement("h4");
  aiTitle.className = "cashflow-block-title";
  aiTitle.textContent = "AI \u5bf9\u624b";
  aiBlock.appendChild(aiTitle);

  if (!state.aiEnabled || state.aiPlayers.length === 0) {
    const emptyAi = document.createElement("div");
    emptyAi.className = "cashflow-empty";
    emptyAi.textContent =
      "\u5f53\u524d\u4e3a\u5355\u4eba\u6a21\u5f0f\uff0c\u53ef\u5728\u4e0b\u65b9\u6309\u94ae\u5f00\u542f AI \u5bf9\u6218\u3002";
    aiBlock.appendChild(emptyAi);
  } else {
    const aiList = document.createElement("div");
    aiList.className = "cashflow-ai-list";
    for (const aiPlayer of state.aiPlayers) {
      const card = document.createElement("article");
      card.className = "cashflow-ai-card";

      const head = document.createElement("div");
      head.className = "cashflow-ai-head";
      const nameNode = document.createElement("div");
      nameNode.className = "cashflow-ai-name";
      nameNode.textContent = `${aiPlayer.name}\uff08${aiPlayer.role}\uff09`;
      const phaseNode = document.createElement("div");
      phaseNode.className = "cashflow-ai-phase";
      phaseNode.textContent = cashflowPhaseLabel(aiPlayer.phase);
      head.append(nameNode, phaseNode);

      const totalExpensesAi = aiPlayer.expenses + aiPlayer.debtPayment;
      const salaryAfterTaxAi = Math.max(
        0,
        Math.round(aiPlayer.salary * (1 - aiPlayer.taxRate))
      );
      const monthlyNetAi =
        salaryAfterTaxAi + aiPlayer.passiveIncome - totalExpensesAi;
      const assetsCount = aiPlayer.assets.reduce(
        (sum, asset) => sum + asset.count,
        0
      );

      const stats = document.createElement("div");
      stats.className = "cashflow-ai-stats";
      stats.textContent =
        `\u73b0\u91d1 ${formatMoney(aiPlayer.cash)} \u00b7 ` +
        `\u88ab\u52a8\u6536\u5165 ${formatMoney(aiPlayer.passiveIncome)}/\u6708 \u00b7 ` +
        `\u503a\u52a1 ${formatMoney(aiPlayer.debt)} \u00b7 ` +
        `\u6708\u51c0\u73b0\u91d1\u6d41 ${monthlyNetAi >= 0 ? "+" : ""}${formatMoney(monthlyNetAi)}/\u6708 \u00b7 ` +
        `\u8d44\u4ea7 ${assetsCount} \u9879`;

      const decision = document.createElement("div");
      decision.className = "cashflow-ai-decision";
      if (aiPlayer.won) {
        decision.textContent = "\u72b6\u6001\uff1a\u5df2\u8fbe\u6210\u8d22\u52a1\u81ea\u7531";
      } else if (aiPlayer.lost) {
        decision.textContent = `\u72b6\u6001\uff1a\u5931\u8d25\uff08${aiPlayer.lossReason ?? "\u672a\u77e5\u539f\u56e0"}\uff09`;
      } else {
        decision.textContent = `\u6700\u8fd1\u51b3\u7b56\uff1a${aiPlayer.lastDecision ?? "\u6682\u65e0"}`;
      }

      card.append(head, stats, decision);
      aiList.appendChild(card);
    }
    aiBlock.appendChild(aiList);
  }

  const opportunityBlock = document.createElement("section");
  opportunityBlock.className = "cashflow-block";
  opportunityBlock.classList.add("cashflow-block-opportunity");
  const opportunityTitle = document.createElement("h4");
  opportunityTitle.className = "cashflow-block-title";
  opportunityTitle.textContent = "\u5f53\u524d\u673a\u4f1a";
  opportunityBlock.appendChild(opportunityTitle);
  if (state.currentOpportunity) {
    const opportunityCard = document.createElement("article");
    opportunityCard.className = "cashflow-opportunity-card";

    const nameNode = document.createElement("div");
    nameNode.className = "cashflow-opportunity-title";
    nameNode.textContent =
      state.currentOpportunity.dealClass === "big-deal"
        ? `[Big Deal] ${state.currentOpportunity.title}`
        : state.currentOpportunity.title;

    const descNode = document.createElement("div");
    descNode.className = "cashflow-opportunity-desc";
    descNode.textContent = state.currentOpportunity.description;

    const tags = document.createElement("div");
    tags.className = "cashflow-opportunity-tags";
    const tierText =
      state.currentOpportunity.tier === "big"
        ? "\u9ad8\u7ea7\u673a\u4f1a"
        : state.currentOpportunity.tier === "medium"
        ? "\u4e2d\u7b49\u673a\u4f1a"
        : "\u57fa\u7840\u673a\u4f1a";
    tags.append(
      createCashflowBadge(tierText, "info"),
      createCashflowBadge(
        `\u6295\u5165 ${formatMoney(state.currentOpportunity.cost)}`,
        "warning"
      ),
      createCashflowBadge(
        `+\u73b0\u91d1\u6d41 ${formatMoney(state.currentOpportunity.cashflow)}/\u6708`,
        "success"
      )
    );

    if (state.currentOpportunity.cashflow > 0) {
      const paybackMonths =
        state.currentOpportunity.cost / state.currentOpportunity.cashflow;
      tags.append(
        createCashflowBadge(
          `\u56de\u672c ${paybackMonths.toFixed(1)} \u6708`,
          "info"
        )
      );
    }

    const quickActions = document.createElement("div");
    quickActions.className = "cashflow-opportunity-actions";

    const buyButton = document.createElement("button");
    buyButton.type = "button";
    buyButton.className = "settings-btn settings-btn-primary";
    buyButton.textContent = "\u73b0\u91d1\u4e70\u5165";
    buyButton.disabled = state.won || state.lost;
    buyButton.addEventListener("click", () => {
      void buyCashflowOpportunity();
    });

    const buyWithLoanButton = document.createElement("button");
    buyWithLoanButton.type = "button";
    buyWithLoanButton.className = "settings-btn settings-btn-secondary";
    buyWithLoanButton.textContent = "\u8d37\u6b3e\u4e70\u5165";
    buyWithLoanButton.disabled =
      state.won || state.lost || state.cash >= state.currentOpportunity.cost;
    buyWithLoanButton.addEventListener("click", () => {
      void buyCashflowOpportunityWithLoan();
    });

    const skipButton = document.createElement("button");
    skipButton.type = "button";
    skipButton.className = "settings-btn settings-btn-secondary";
    skipButton.textContent = "\u8df3\u8fc7\u673a\u4f1a";
    skipButton.disabled = state.won || state.lost;
    skipButton.addEventListener("click", () => {
      void skipCashflowOpportunity();
    });
    quickActions.append(buyButton, buyWithLoanButton, skipButton);

    opportunityCard.append(nameNode, descNode, tags, quickActions);
    opportunityBlock.appendChild(opportunityCard);

    if (state.currentOpportunity.dealClass === "big-deal") {
      const riskNode = document.createElement("div");
      riskNode.className = "cashflow-opportunity-big-deal";
      riskNode.textContent =
        "Big Deal\uff1a\u4f4e\u6982\u7387\u51fa\u73b0\uff0c\u9ad8\u5f71\u54cd\u9ad8\u98ce\u9669\uff0c\u4e70\u5165\u524d\u8bf7\u5148\u9884\u7b97\u73b0\u91d1\u7f13\u51b2\u3002";
      opportunityBlock.appendChild(riskNode);
    }

    if (state.cash < state.currentOpportunity.cost) {
      const shortfallNode = document.createElement("div");
      shortfallNode.className = "cashflow-opportunity-shortfall";
      shortfallNode.textContent = `\u8d44\u91d1\u7f3a\u53e3 ${formatMoney(
        state.currentOpportunity.cost - state.cash
      )}\uff0c\u53ef\u9009\u62e9\u8d37\u6b3e\u4e70\u5165`;
      opportunityBlock.appendChild(shortfallNode);
    }
  } else {
    const emptyNode = document.createElement("div");
    emptyNode.className = "cashflow-empty";
    emptyNode.textContent = state.lost
      ? "\u672c\u5c40\u5df2\u5931\u8d25\uff0c\u8bf7\u5148\u65b0\u5f00\u4e00\u5c40\u3002"
      : "\u6682\u65e0\u673a\u4f1a\uff0c\u53ef\u4ee5\u5148\u70b9\u201c\u63a8\u8fdb\u4e00\u56de\u5408\u201d\u5237\u65b0\u5e02\u573a\u3002";
    opportunityBlock.appendChild(emptyNode);
  }

  const assetsBlock = document.createElement("section");
  assetsBlock.className = "cashflow-block";
  assetsBlock.classList.add("cashflow-block-assets");
  const assetsTitle = document.createElement("h4");
  assetsTitle.className = "cashflow-block-title";
  assetsTitle.textContent = "\u8d44\u4ea7\u7ec4\u5408";
  assetsBlock.appendChild(assetsTitle);
  if (state.assets.length === 0) {
    const emptyNode = document.createElement("div");
    emptyNode.className = "cashflow-empty";
    emptyNode.textContent =
      "\u8fd8\u6ca1\u6709\u8d44\u4ea7\uff0c\u5148\u4ece\u201c\u5f53\u524d\u673a\u4f1a\u201d\u5f00\u59cb\u8d2d\u4e70\u3002";
    assetsBlock.appendChild(emptyNode);
  } else {
    const totalAssetCashflow = state.assets.reduce(
      (sum, asset) => sum + asset.totalCashflow,
      0
    );
    const summary = document.createElement("div");
    summary.className = "cashflow-opportunity-meta";
    summary.textContent = `\u5df2\u6301\u6709 ${state.assets.length} \u7c7b\u8d44\u4ea7 \u00b7 \u8d21\u732e\u73b0\u91d1\u6d41 +${formatMoney(
      totalAssetCashflow
    )}/\u6708`;
    assetsBlock.appendChild(summary);

    const assetList = document.createElement("ul");
    assetList.className = "cashflow-assets-list";
    for (const asset of state.assets) {
      const item = document.createElement("li");
      item.className = "cashflow-assets-item";

      const nameNode = document.createElement("span");
      nameNode.className = "cashflow-assets-name";
      nameNode.textContent = `${asset.title} x${asset.count}`;

      const costNode = document.createElement("span");
      costNode.className = "cashflow-assets-cost";
      costNode.textContent = `\u6210\u672c ${formatMoney(asset.totalCost)}`;

      const cashflowNode = document.createElement("span");
      cashflowNode.className = "cashflow-assets-cashflow";
      cashflowNode.textContent = `+\u73b0\u91d1\u6d41 ${formatMoney(asset.totalCashflow)}/\u6708`;

      item.append(nameNode, costNode, cashflowNode);
      assetList.appendChild(item);
    }
    assetsBlock.appendChild(assetList);
  }

  const reportsBlock = document.createElement("section");
  reportsBlock.className = "cashflow-block";
  reportsBlock.classList.add("cashflow-block-reports");
  const reportsTitle = document.createElement("h4");
  reportsTitle.className = "cashflow-block-title";
  reportsTitle.textContent = "\u8d22\u52a1\u62a5\u8868";
  reportsBlock.appendChild(reportsTitle);
  if (!reports) {
    const empty = document.createElement("div");
    empty.className = "cashflow-empty";
    empty.textContent = "\u62a5\u8868\u52a0\u8f7d\u4e2d...";
    reportsBlock.appendChild(empty);
  } else {
    const reportGrid = document.createElement("div");
    reportGrid.className = "cashflow-report-grid";
    reportGrid.append(
      createCashflowReportList("\u6536\u5165", reports.income),
      createCashflowReportList("\u652f\u51fa", reports.expenses)
    );

    const balance = document.createElement("div");
    balance.className = "cashflow-report-item";
    const balanceTitle = document.createElement("div");
    balanceTitle.className = "cashflow-report-item-title";
    balanceTitle.textContent = "\u8d44\u4ea7\u8d1f\u503a";
    balance.append(
      balanceTitle,
      createCashflowMetricRow("\u73b0\u91d1", formatMoney(reports.balanceSheet.cash)),
      createCashflowMetricRow(
        "\u8d44\u4ea7",
        formatMoney(reports.balanceSheet.assetsTotal)
      ),
      createCashflowMetricRow(
        "\u8d1f\u503a",
        formatMoney(reports.balanceSheet.debtsTotal)
      ),
      createCashflowMetricRow(
        "\u51c0\u8d44\u4ea7",
        formatMoney(reports.balanceSheet.netWorth)
      )
    );

    const metrics = document.createElement("div");
    metrics.className = "cashflow-report-item";
    const metricsTitle = document.createElement("div");
    metricsTitle.className = "cashflow-report-item-title";
    metricsTitle.textContent = "\u5173\u952e\u6307\u6807";
    metrics.append(
      metricsTitle,
      createCashflowMetricRow(
        "\u6708\u51c0\u73b0\u91d1\u6d41",
        `${reports.metrics.monthlyNet >= 0 ? "+" : ""}${formatMoney(
          reports.metrics.monthlyNet
        )}/\u6708`
      ),
      createCashflowMetricRow(
        "\u88ab\u52a8\u6536\u5165\u8986\u76d6\u7387",
        formatPercent(reports.metrics.passiveIncomeRatio)
      ),
      createCashflowMetricRow(
        "\u8d1f\u503a\u7387",
        formatPercent(reports.metrics.debtRatio)
      ),
      createCashflowMetricRow(
        "\u73b0\u91d1\u50a8\u5907\u6708\u6570",
        `${reports.metrics.cashReserveMonths.toFixed(1)} \u4e2a\u6708`
      )
    );
    reportGrid.append(balance, metrics);
    reportsBlock.appendChild(reportGrid);
  }

  const logsBlock = document.createElement("section");
  logsBlock.className = "cashflow-block";
  logsBlock.classList.add("cashflow-block-logs");
  const logsTitle = document.createElement("h4");
  logsTitle.className = "cashflow-block-title";
  logsTitle.textContent = "\u56de\u5408\u8bb0\u5f55";
  logsBlock.appendChild(logsTitle);
  const logList = document.createElement("ul");
  logList.className = "cashflow-log-list";
  for (const [index, entry] of state.logs.entries()) {
    const item = document.createElement("li");
    item.className = "cashflow-log-item";
    const logIndex = document.createElement("span");
    logIndex.className = "cashflow-log-index";
    logIndex.textContent = `#${state.logs.length - index}`;
    const logText = document.createElement("span");
    logText.className = "cashflow-log-text";
    logText.textContent = entry;
    item.append(logIndex, logText);
    logList.appendChild(item);
  }
  if (state.logs.length === 0) {
    const emptyLog = document.createElement("li");
    emptyLog.className = "cashflow-empty";
    emptyLog.textContent = "\u6682\u65e0\u56de\u5408\u8bb0\u5f55";
    logList.appendChild(emptyLog);
  }
  logsBlock.appendChild(logList);

  const board = document.createElement("div");
  board.className = "cashflow-board";
  const mainColumn = document.createElement("div");
  mainColumn.className = "cashflow-column cashflow-column-main";
  mainColumn.append(opportunityBlock, roleBlock, assetsBlock);

  const sideColumn = document.createElement("div");
  sideColumn.className = "cashflow-column cashflow-column-side";
  sideColumn.append(aiBlock, reportsBlock);

  board.append(mainColumn, sideColumn, logsBlock);

  const actions = document.createElement("div");
  actions.className = "settings-actions cashflow-actions";

  const nextTurnButton = document.createElement("button");
  nextTurnButton.type = "button";
  nextTurnButton.className = "settings-btn settings-btn-primary cashflow-action-main";
  nextTurnButton.textContent = "\u63a8\u8fdb\u4e00\u56de\u5408";
  nextTurnButton.addEventListener("click", () => {
    void nextCashflowTurn();
  });

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "settings-btn settings-btn-secondary";
  resetButton.textContent = "\u65b0\u5f00\u4e00\u5c40";
  resetButton.addEventListener("click", () => {
    void resetCashflowGame();
  });

  const aiButton = document.createElement("button");
  aiButton.type = "button";
  aiButton.className = "settings-btn settings-btn-secondary";
  aiButton.textContent = state.aiEnabled ? "AI \u5df2\u5f00\u542f" : "\u5f00\u542f AI \u5bf9\u6218";
  aiButton.disabled = state.aiEnabled;
  aiButton.addEventListener("click", () => {
    void executeCashflowAction("ai").then((result) => {
      if (result) {
        renderList();
      }
    });
  });

  nextTurnButton.disabled = state.won || state.lost;
  actions.append(nextTurnButton, aiButton, resetButton);

  panel.append(title, description, hud, statGrid, board, actions);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function renderList(): void {
  closeSearchContextMenu();
  clearList();

  if (mode === "settings") {
    renderSettingsPanel();
    return;
  }

  if (mode === "password") {
    renderPasswordPanel();
    return;
  }

  if (mode === "cashflow") {
    renderCashflowPanel();
    return;
  }

  if (mode === "plugin") {
    renderActivePluginPanel();
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
        nextLaunchAtLoginStatus,
        nextAppVersion,
        nextErrorLogs
      ] =
        await Promise.all([
          launcher.getSearchDisplayConfig(),
          launcher.getCatalogScanConfig(),
          launcher.getLaunchAtLoginStatus(),
          launcher.getAppVersion().catch(() => ""),
          launcher.getErrorLogs(40).catch(() => [])
        ]);
      searchDisplayConfig = nextSearchConfig;
      catalogScanConfig = nextCatalogScanConfig;
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
      const result = await executeCashflowAction("state");
      if (token !== latestSearchToken) {
        return;
      }
      resetSearchSections();
      selectedIndex = 0;
      renderList();
      if (!result && !cashflowState) {
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
      setStatus(
        activePluginPanel
          ? `已打开插件：${activePluginPanel.title}`
          : "已打开插件面板"
      );
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

        const [launchItems, pinnedItems, pluginItems] = await Promise.all([
          launcher.search(parsedQuery.query, {
            limit: fetchLimit,
            scope: parsedQuery.scope
          }),
          parsedQuery.explicitScope ? Promise.resolve([]) : launcher.getPinnedItems(),
          parsedQuery.explicitScope ? Promise.resolve([]) : launcher.getPluginItems()
        ]);
        if (token !== latestSearchToken) {
          return;
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
        if (!parsedQuery.explicitScope) {
          addSearchSection(
            "pinned",
            "\u7f6e\u9876",
            pinnedItems,
            searchDisplayConfig.pinnedLimit,
            "\u6682\u65e0\u7f6e\u9876\u9879\uff08\u53ef\u5728\u641c\u7d22\u7ed3\u679c\u53f3\u952e\u7f6e\u9876\uff09"
          );
          addSearchSection(
            "plugin",
            "\u63d2\u4ef6",
            pluginItems,
            searchDisplayConfig.pluginLimit,
            "\u6682\u65e0\u63d2\u4ef6"
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
            `\u641c\u7d22 ${shownStart}-${shownEnd}/${totalSearchText} \u00b7 \u7f6e\u9876 ${Math.min(
              pinnedItems.length,
              searchDisplayConfig.pinnedLimit
            )} \u00b7 \u63d2\u4ef6 ${Math.min(
              pluginItems.length,
              searchDisplayConfig.pluginLimit
            )}`
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

      resetSearchSections();
      addSearchSection(
        "recent",
        "\u6700\u8fd1\u8bbf\u95ee",
        recentItems,
        searchDisplayConfig.recentLimit,
        "\u6682\u65e0\u6700\u8fd1\u8bbf\u95ee"
      );
      addSearchSection(
        "pinned",
        "\u7f6e\u9876",
        pinnedItems,
        searchDisplayConfig.pinnedLimit,
        "\u6682\u65e0\u7f6e\u9876\u9879\uff08\u53ef\u5728\u641c\u7d22\u7ed3\u679c\u53f3\u952e\u7f6e\u9876\uff09"
      );
      addSearchSection(
        "plugin",
        "\u63d2\u4ef6",
        pluginItems,
        searchDisplayConfig.pluginLimit,
        "\u6682\u65e0\u63d2\u4ef6"
      );
      selectedIndex = entries.length ? 0 : 0;
      renderList();
      setStatus(
        `\u6700\u8fd1 ${Math.min(recentItems.length, searchDisplayConfig.recentLimit)} \u00b7 \u7f6e\u9876 ${Math.min(
          pinnedItems.length,
          searchDisplayConfig.pinnedLimit
        )} \u00b7 \u63d2\u4ef6 ${Math.min(pluginItems.length, searchDisplayConfig.pluginLimit)}`
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
    const result = await launcher.execute(selected.item);
    if (!result.ok) {
      setStatus(result.message ?? "\u6267\u884c\u5931\u8d25");
      return;
    }

    setStatus(result.message ?? "\u6267\u884c\u5b8c\u6210");
    if (!result.keepOpen) {
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

function openPasswordPanel(draft?: Partial<PasswordGeneratorOptions>): void {
  passwordPanelOptions = normalizePasswordOptions(
    draft ?? {},
    passwordPanelOptions
  );
  passwordPanelGenerated = [];
  setMode("password");
  void refreshEntries("");
}

function openGenericPluginPanel(payload: GenericPluginPanelPayload): void {
  activePluginPanel = {
    pluginId: payload.pluginId,
    title: (payload.title ?? "").trim() || payload.pluginId,
    subtitle: (payload.subtitle ?? "").trim() || "\u63d2\u4ef6\u9762\u677f",
    message: (payload.message ?? "").trim() || undefined,
    data: payload.data
  };

  const handler = getPluginPanelHandler(activePluginPanel.pluginId);
  handler?.onOpen?.(activePluginPanel);

  setMode("plugin");
  void refreshEntries("");
}

async function openCashflowPanel(reset = false): Promise<void> {
  setMode("cashflow");
  if (reset) {
    await executeCashflowAction("reset");
  } else {
    await executeCashflowAction("state");
    if (cashflowState?.lost) {
      const roleKey = cashflowState.jobKey.trim() || undefined;
      const restarted = await executeCashflowAction("reset", { roleKey });
      if (restarted) {
        setStatus(
          `检测到上局已结束，已自动新开一局${roleKey ? `（${cashflowState.role}）` : ""}`
        );
      }
    }
  }
  renderList();
}

function backToSearch(): void {
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

  if (mode === "password") {
    if (isEscape) {
      event.preventDefault();
      pushDebugLog("renderer action: password -> backToSearch");
      backToSearch();
      return;
    }

    if (isEnter) {
      event.preventDefault();
      const form = list.querySelector("form.password-form");
      if (form instanceof HTMLFormElement) {
        pushDebugLog("renderer action: password generate");
        void generateFromPasswordPanel(form);
      }
      return;
    }

    return;
  }

  if (mode === "cashflow") {
    if (isEscape) {
      event.preventDefault();
      pushDebugLog("renderer action: cashflow -> backToSearch");
      backToSearch();
      return;
    }

    if (isEnter) {
      event.preventDefault();
      pushDebugLog("renderer action: cashflow nextTurn");
      void nextCashflowTurn();
      return;
    }

    return;
  }

  if (mode === "plugin") {
    if (isEscape) {
      event.preventDefault();
      pushDebugLog("renderer action: plugin -> backToSearch");
      backToSearch();
      return;
    }

    if (isEnter) {
      event.preventDefault();
      handleActivePluginPanelEnter();
      return;
    }

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
    closeSearchContextMenu();
    currentQuery = input.value;
    void refreshEntries(currentQuery);
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

      if (mode === "search" || mode === "clip") {
        void refreshEntries("");
      }
    });
  }

  if (launcher?.onOpenPanel) {
    launcher.onOpenPanel((panelPayload) => {
      const genericPluginPayload = parseGenericPluginPanelPayload(panelPayload);
      if (genericPluginPayload) {
        pushDebugLog(
          `renderer openPanel=plugin:${genericPluginPayload.pluginId}`
        );
        openGenericPluginPanel(genericPluginPayload);
        return;
      }

      const passwordPayload = parsePasswordPanelPayload(panelPayload);
      if (passwordPayload) {
        pushDebugLog("renderer openPanel=password(payload)");
        openPasswordPanel(passwordPayload.draft);
        return;
      }

      const cashflowPayload = parseCashflowPanelPayload(panelPayload);
      if (cashflowPayload) {
        pushDebugLog("renderer openPanel=cashflow(payload)");
        void openCashflowPanel(Boolean(cashflowPayload.reset));
        return;
      }

      const panel =
        typeof panelPayload === "string" ? panelPayload.trim() : "";
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

      if (panel === "password") {
        pushDebugLog("renderer openPanel=password");
        openPasswordPanel();
        return;
      }

      if (panel === "cashflow") {
        pushDebugLog("renderer openPanel=cashflow");
        void openCashflowPanel();
      }
    });
  }

  window.addEventListener("focus", () => {
    pushDebugLog("renderer window focus");
    syncWindowSizePreset(mode, true);
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






