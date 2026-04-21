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

interface WebtoolsUrlParts {
  protocol: string;
  host: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
}

interface WebtoolsUrlState {
  input: string;
  info: string;
  valid: boolean | null;
  parts: WebtoolsUrlParts;
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
  levenshtein?: number;
  identical?: boolean;
  rawIdentical?: boolean;
  leftLength?: number;
  rightLength?: number;
  leftLines?: number;
  rightLines?: number;
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

interface HardwareInspectorVolume {
  deviceId: string | null;
  volumeName: string | null;
  fileSystem: string | null;
  size: number | null;
  freeSpace: number | null;
  driveType: number | null;
}

interface HardwareInspectorPartition {
  index: number | null;
  name: string | null;
  type: string | null;
  size: number | null;
  bootPartition: boolean | null;
  primaryPartition: boolean | null;
  volumes: HardwareInspectorVolume[];
}

interface HardwareInspectorDisk {
  index: number | null;
  deviceId: string | null;
  model: string | null;
  manufacturer: string | null;
  serialNumber: string | null;
  interfaceType: string | null;
  mediaType: string | null;
  size: number | null;
  partitionCount: number | null;
  firmwareRevision: string | null;
  pnpDeviceId: string | null;
  storageMediaType: string | null;
  busType: string | null;
  healthStatus: string | null;
  operationalStatus: string | null;
  smartPredictFailure: boolean | null;
  smartReason: number | null;
  spindleSpeed: number | null;
  logicalSectorSize: number | null;
  physicalSectorSize: number | null;
  slotNumber: number | null;
  enclosureNumber: number | null;
  firmwareVersion: string | null;
  usage: string | null;
  canPool: boolean | null;
  temperatureCelsius: number | null;
  temperatureMaxCelsius: number | null;
  wearPercentage: number | null;
  powerOnHours: number | null;
  partitions: HardwareInspectorPartition[];
}

interface HardwareInspectorGpu {
  name: string | null;
  manufacturer: string | null;
  adapterRam: number | null;
  driverVersion: string | null;
  driverDate: string | null;
  videoProcessor: string | null;
  horizontalResolution: number | null;
  verticalResolution: number | null;
  refreshRate: number | null;
  status: string | null;
  pnpDeviceId: string | null;
  temperatureCelsius: number | null;
  temperatureSource: string | null;
}

interface HardwareInspectorMemoryModule {
  bankLabel: string | null;
  deviceLocator: string | null;
  manufacturer: string | null;
  partNumber: string | null;
  serialNumber: string | null;
  capacity: number | null;
  speed: number | null;
  configuredClockSpeed: number | null;
  formFactor: string | null;
  memoryType: string | null;
}

interface HardwareInspectorCpu {
  name: string | null;
  manufacturer: string | null;
  description: string | null;
  numberOfCores: number | null;
  numberOfLogicalProcessors: number | null;
  maxClockSpeed: number | null;
  currentClockSpeed: number | null;
  socketDesignation: string | null;
  addressWidth: number | null;
  dataWidth: number | null;
  processorId: string | null;
  architecture: string | null;
  virtualizationFirmwareEnabled: boolean | null;
  vmMonitorModeExtensions: boolean | null;
  secondLevelAddressTranslationExtensions: boolean | null;
  temperatureCelsius: number | null;
  temperatureSource: string | null;
}

interface HardwareInspectorSnapshot {
  collectedAt: string;
  computerSystem: {
    name: string | null;
    manufacturer: string | null;
    model: string | null;
    systemType: string | null;
    totalPhysicalMemory: number | null;
  };
  operatingSystem: {
    caption: string | null;
    version: string | null;
    buildNumber: string | null;
    architecture: string | null;
    lastBootUpTime: string | null;
    installDate: string | null;
  };
  cpus: HardwareInspectorCpu[];
  baseBoard: {
    manufacturer: string | null;
    product: string | null;
    version: string | null;
    serialNumber: string | null;
  };
  bios: {
    manufacturer: string | null;
    smbiosBiosVersion: string | null;
    version: string | null;
    releaseDate: string | null;
    serialNumber: string | null;
  };
  memoryModules: HardwareInspectorMemoryModule[];
  gpus: HardwareInspectorGpu[];
  disks: HardwareInspectorDisk[];
}

interface HardwareInspectorDiffState {
  hasBaseline: boolean;
  hasChanges: boolean;
  summary: string[];
  overviewChangedKeys: string[];
  computerSystemChanges: string[];
  operatingSystemChanges: string[];
  baseBoardChanges: string[];
  biosChanges: string[];
  cpuChanges: Record<string, string[]>;
  memoryChanges: Record<string, string[]>;
  gpuChanges: Record<string, string[]>;
  diskChanges: Record<string, string[]>;
  previousCollectedAt: string | null;
  currentCollectedAt: string | null;
}

type WebtoolsUnitTab = "storage" | "screen";
type WebtoolsUnitStorageKey = "B" | "KB" | "MB" | "GB" | "TB";
type WebtoolsApiRequestTab = "params" | "headers" | "body";
type WebtoolsApiResponseTab = "body" | "headers";
type WebtoolsHttpMockMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";

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
let pluginResultPage = 0;
let latestSearchToken = 0;
let mode: PanelMode = "search";
let debugMode = false;
let isResultsLoading = false;
let resultsLoadingTimer: number | null = null;
let searchInputDebounceTimer: number | null = null;
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
const DEFAULT_WEBTOOLS_URL_INPUT =
  "https://www.example.com:8080/path/to/page?name=test&id=123#section-1";
const WEBTOOLS_UNIT_STORAGE_FACTORS: Record<WebtoolsUnitStorageKey, number> = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4
};
function createEmptyWebtoolsUrlParts(): WebtoolsUrlParts {
  return {
    protocol: "",
    host: "",
    port: "",
    pathname: "",
    search: "",
    hash: ""
  };
}
let webtoolsUrlState: WebtoolsUrlState = {
  input: DEFAULT_WEBTOOLS_URL_INPUT,
  info: "",
  valid: null,
  parts: createEmptyWebtoolsUrlParts(),
  queryRows: []
};
let webtoolsDiffLeft = "";
let webtoolsDiffRight = "";
let webtoolsDiffIgnoreCase = false;
let webtoolsDiffIgnoreWhitespace = false;
let webtoolsDiffPrettyHtml = "";
let webtoolsDiffSummary: WebtoolsDiffSummary | null = null;
let webtoolsDiffAutoTimer: number | null = null;
let webtoolsDiffRequestToken = 0;
let webtoolsTimestampUnixInput = "";
let webtoolsTimestampDateInput = "";
let webtoolsTimestampDateOutput = "";
let webtoolsTimestampTimestampOutput = "";
let webtoolsTimestampUnit: "s" | "ms" = "s";
let webtoolsTimestampInfo = "";
let webtoolsTimestampAutoTimer: number | null = null;
let webtoolsTimestampClockTimer: number | null = null;
let webtoolsTimestampToDateRequestToken = 0;
let webtoolsTimestampToTimestampRequestToken = 0;
let webtoolsRegexPattern = "([a-z0-9_.-]+)@([a-z0-9.-]+)\\.([a-z.]{2,6})";
let webtoolsRegexFlags = "g";
let webtoolsRegexInput =
  "My emails are test@example.com and dev.ops-123@google.co.uk. Please feel free to match them!";
let webtoolsRegexReplacement = "";
let webtoolsRegexOutput = "";
let webtoolsRegexInfo = "";
let webtoolsRegexError = "";
let webtoolsRegexHighlightedHtml = "";
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
let webtoolsImageBase64Info = "";
let webtoolsImageBase64Error = "";
let webtoolsImageBase64Dragging = false;
let webtoolsColorsAutoTimer: number | null = null;
let webtoolsColorsRequestToken = 0;
let webtoolsImageBase64FileName = "";
let webtoolsImageBase64AutoTimer: number | null = null;
let webtoolsImageBase64RequestToken = 0;
let webtoolsConfigSource = "yaml";
let webtoolsConfigTarget = "properties";
let webtoolsConfigInput = "";
let webtoolsConfigOutput = "";
let webtoolsConfigInfo = "";
let webtoolsConfigError = "";
let webtoolsConfigAutoTimer: number | null = null;
let webtoolsConfigRequestToken = 0;
let webtoolsSqlInput =
  "SELECT a,b,c FROM table_test JOIN other_table ON table_test.id = other_table.id WHERE a > 10 AND b LIKE '%test%' ORDER BY c DESC LIMIT 10";
let webtoolsSqlOutput = "";
let webtoolsSqlDialect = "sql";
let webtoolsSqlUppercase = true;
let webtoolsSqlIndent = 2;
let webtoolsSqlInfo = "";
let webtoolsSqlError = "";
let webtoolsSqlAutoTimer: number | null = null;
let webtoolsSqlRequestToken = 0;
let webtoolsUnitActiveTab: WebtoolsUnitTab = "storage";
let webtoolsUnitStorageValue = 1;
let webtoolsUnitStorageUnit: WebtoolsUnitStorageKey = "MB";
let webtoolsUnitStorageValues: Record<WebtoolsUnitStorageKey, number> = {
  B: 1048576,
  KB: 1024,
  MB: 1,
  GB: 0.0009765625,
  TB: 0.00000095367431640625
};
let webtoolsUnitPixel = 160;
let webtoolsUnitRem = 10;
let webtoolsUnitBasePx = 16;
let webtoolsQrText = "LiteLauncher 本地二维码示例";
let webtoolsQrSize = 300;
let webtoolsQrLevel = "M";
let webtoolsQrDarkColor = "#102136";
let webtoolsQrLightColor = "#ffffff";
let webtoolsQrLogoMode: "none" | "text" | "image" = "none";
let webtoolsQrLogoText = "";
let webtoolsQrLogoImageDataUrl = "";
let webtoolsQrLogoImageName = "";
let webtoolsQrUrl = "";
let webtoolsQrInfo = "";
let webtoolsQrAutoTimer: number | null = null;
let webtoolsQrRequestToken = 0;
let webtoolsMarkdownInput = "# Markdown 预览\n\n在这里输入 Markdown 内容。";
let webtoolsMarkdownHtml = "";
let webtoolsMarkdownInfo = "";
let webtoolsMarkdownAutoTimer: number | null = null;
let webtoolsMarkdownRequestToken = 0;
let webtoolsUaInput = "";
let webtoolsUaResult: Record<string, string> = {};
let webtoolsUaInfo = "";
let webtoolsUaError = "";
let webtoolsUaAutoTimer: number | null = null;
let webtoolsUaRequestToken = 0;
let webtoolsApiMethod = "GET";
let webtoolsApiUrl = "https://jsonplaceholder.typicode.com/posts/1";
let webtoolsApiRequestTab: WebtoolsApiRequestTab = "params";
let webtoolsApiResponseTab: WebtoolsApiResponseTab = "body";
let webtoolsApiParams: WebtoolsApiKvRow[] = [{ key: "", value: "", enabled: true }];
let webtoolsApiHeaders: WebtoolsApiKvRow[] = [
  { key: "Content-Type", value: "application/json", enabled: true },
  { key: "", value: "", enabled: true }
];
let webtoolsApiBodyType: "json" | "text" | "formdata" = "json";
let webtoolsApiBodyContent = "{\n  \"title\": \"foo\",\n  \"body\": \"bar\",\n  \"userId\": 1\n}";
let webtoolsApiFormRows: WebtoolsApiKvRow[] = [{ key: "", value: "", enabled: true }];
let webtoolsApiResponseStatus = "";
let webtoolsApiResponseBody = "";
let webtoolsApiResponseHeaders: Record<string, string> = {};
let webtoolsApiResponseTimeMs = 0;
let webtoolsApiResponseSizeText = "";
let webtoolsApiResponseUrl = "";
let webtoolsApiResponseError = "";
let webtoolsApiRequestToken = 0;
let webtoolsApiHasResponse = false;
let webtoolsApiIsLoading = false;
let webtoolsHttpMockRunning = false;
let webtoolsHttpMockUrl = "";
let webtoolsHttpMockPort = 17777;
let webtoolsHttpMockPath = "/mock";
let webtoolsHttpMockMethod: WebtoolsHttpMockMethod = "GET";
let webtoolsHttpMockStatusCode = 200;
let webtoolsHttpMockContentType = "application/json; charset=utf-8";
let webtoolsHttpMockBody = '{\n  "ok": true,\n  "source": "LiteLauncher HTTP Mock",\n  "timestamp": "{{now}}"\n}';
let webtoolsHttpMockRequestCount = 0;
let webtoolsHttpMockInfo = "";
let webtoolsHttpMockError = "";
let webtoolsHttpMockRequestToken = 0;
let hardwareInspectorSnapshot: HardwareInspectorSnapshot | null = null;
let hardwareInspectorLastSnapshot: HardwareInspectorSnapshot | null = null;
let hardwareInspectorDiffState: HardwareInspectorDiffState | null = null;
let hardwareInspectorInfo = "";
let hardwareInspectorError = "";
let hardwareInspectorLoading = false;
let hardwareInspectorExporting = false;
let hardwareInspectorRequestToken = 0;
let hardwareInspectorExpandedDiskKeys = new Set<string>();

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
const CASHFLOW_PLUGIN_ID = "cashflow-game";
const HARDWARE_INSPECTOR_PLUGIN_ID = "hardware-inspector";
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
const WEBTOOLS_HTTP_MOCK_PLUGIN_ID = "webtools-http-mock";
const WEBTOOLS_SQL_DEFAULT_INPUT =
  "SELECT a,b,c FROM table_test JOIN other_table ON table_test.id = other_table.id WHERE a > 10 AND b LIKE '%test%' ORDER BY c DESC LIMIT 10";
const WEBTOOLS_SQL_DIALECT_OPTIONS = [
  { value: "sql", label: "Standard SQL" },
  { value: "mysql", label: "MySQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "sqlite", label: "SQLite" },
  { value: "tsql", label: "T-SQL" }
] as const;
const WEBTOOLS_SQL_INDENT_OPTIONS = [
  { value: 2, label: "2 空格" },
  { value: 4, label: "4 空格" },
  { value: 1, label: "1 空格" }
] as const;
const WEBTOOLS_CONFIG_DEFAULT_INPUT = `server:
  port: 8080
  servlet:
    context-path: /api
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/db`;
const WEBTOOLS_CONFIG_FORMAT_OPTIONS = [
  { value: "yaml", label: "YAML" },
  { value: "json", label: "JSON" },
  { value: "properties", label: "Properties" }
] as const;
const WEBTOOLS_COLORS_PRESETS = [
  "#f44336",
  "#e91e63",
  "#9c27b0",
  "#673ab7",
  "#3f51b5",
  "#2196f3",
  "#03a9f4",
  "#00bcd4",
  "#009688",
  "#4caf50",
  "#8bc34a",
  "#cddc39",
  "#ffeb3b",
  "#ffc107",
  "#ff9800",
  "#ff5722",
  "#795548",
  "#9e9e9e",
  "#607d8b",
  "#2d3436",
  "#6c5ce7",
  "#00b894",
  "#0984e3",
  "#fd79a8"
] as const;
const WEBTOOLS_REGEX_DEFAULT_PATTERN = "([a-z0-9_.-]+)@([a-z0-9.-]+)\\.([a-z.]{2,6})";
const WEBTOOLS_REGEX_DEFAULT_INPUT =
  "My emails are test@example.com and dev.ops-123@google.co.uk. Please feel free to match them!";
const WEBTOOLS_REGEX_SAFE_FLAGS = "gimsuyd";
const WEBTOOLS_REGEX_TEMPLATES = [
  {
    label: "邮箱地址",
    pattern: "([a-z0-9_.-]+)@([a-z0-9.-]+)\\.([a-z.]{2,6})",
    flags: "g"
  },
  {
    label: "手机号",
    pattern: "1[3-9]\\d{9}",
    flags: "g"
  },
  {
    label: "IP 地址",
    pattern:
      "((2(5[0-5]|[0-4]\\d))|[0-1]?\\d{1,2})(\\.((2(5[0-5]|[0-4]\\d))|[0-1]?\\d{1,2})){3}",
    flags: "g"
  },
  {
    label: "网址 URL",
    pattern: "https?://[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-_~:/?#[\\]@!$&'()*+,;=.]+",
    flags: "g"
  }
] as const;
const DEFAULT_VISIBLE_PLUGIN_IDS = [
  "cashflow-game",
  "hardware-inspector",
  "webtools-password",
  "webtools-cron",
  "webtools-json",
  "webtools-crypto",
  "webtools-jwt",
  "webtools-timestamp",
  "webtools-strings",
  "webtools-colors",
  "webtools-diff",
  "webtools-http-mock",
  "webtools-image-base64",
  "webtools-config-convert",
  "webtools-sql-format",
  "webtools-unit-convert",
  "webtools-regex",
  "webtools-url-parse",
  "webtools-qrcode",
  "webtools-markdown",
  "webtools-ua",
  "webtools-api-client"
];
const WEBTOOLS_PASSWORD_DEFAULT_SYMBOLS = "!@#$%^&*";
const panelImpls = window.__LL_PANEL_IMPLS__;
if (!panelImpls) {
  throw new Error("renderer plugin panel impls not initialized");
}
const panelImplsSafe = panelImpls;
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
    clearWebtoolsTimestampAutoTimer();
    clearWebtoolsTimestampClockTimer();
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

function formatHardwareInspectorBytes(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return "未知";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  const digits = size >= 100 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(digits)} ${units[index]}`;
}

function formatHardwareInspectorClockMhz(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "未知";
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} GHz`;
  }
  return `${value} MHz`;
}

function formatHardwareInspectorRpm(value: number | null | undefined): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0 ||
    value >= 4294967295
  ) {
    return "未知";
  }

  return `${Math.round(value)} RPM`;
}

function formatHardwareInspectorDate(value: string | null | undefined): string {
  if (!value) {
    return "未知";
  }

  const trimmed = value.trim();
  const dotNetMatch = trimmed.match(/^\/Date\((\d+)(?:[+-]\d+)?\)\/$/);
  if (dotNetMatch) {
    const timestamp = Number(dotNetMatch[1]);
    if (Number.isFinite(timestamp)) {
      return new Date(timestamp).toLocaleString("zh-CN", {
        hour12: false
      });
    }
  }

  const dmtfMatch = trimmed.match(
    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\.(\d+))?(?:([+-])(\d{3}))?$/
  );
  if (dmtfMatch) {
    const [, year, month, day, hour, minute, second] = dmtfMatch;
    const parsedDmtf = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );
    if (!Number.isNaN(parsedDmtf.getTime())) {
      return parsedDmtf.toLocaleString("zh-CN", {
        hour12: false
      });
    }
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }

  return parsed.toLocaleString("zh-CN", {
    hour12: false
  });
}

function formatHardwareInspectorBoolean(value: boolean | null | undefined): string {
  if (typeof value !== "boolean") {
    return "未知";
  }
  return value ? "支持" : "不支持";
}

function formatHardwareInspectorNullableBoolean(
  value: boolean | null | undefined,
  trueText: string,
  falseText: string
): string {
  if (typeof value !== "boolean") {
    return "未知";
  }

  return value ? trueText : falseText;
}

function formatHardwareInspectorText(value: string | null | undefined): string {
  return value && value.trim() ? value.trim() : "未知";
}

function formatHardwareInspectorSectorSize(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "未知";
  }

  return `${value} B`;
}

function formatHardwareInspectorTemperature(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "不可用";
  }

  return `${value} °C`;
}

function formatHardwareInspectorPercentage(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return "不可用";
  }

  return `${value}%`;
}

function formatHardwareInspectorHours(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return "不可用";
  }

  return `${value} 小时`;
}

function isHardwareInspectorDiskAtRisk(disk: HardwareInspectorDisk): boolean {
  const health = formatHardwareInspectorText(disk.healthStatus);
  const operational = formatHardwareInspectorText(disk.operationalStatus);
  return (
    disk.smartPredictFailure === true ||
    health.includes("警告") ||
    health.includes("故障") ||
    operational.includes("预测故障") ||
    operational.includes("错误") ||
    operational.includes("降级")
  );
}

function countHardwareInspectorRiskDisks(snapshot: HardwareInspectorSnapshot): number {
  return snapshot.disks.filter((disk) => isHardwareInspectorDiskAtRisk(disk)).length;
}

function getHardwareInspectorCpuKey(cpu: HardwareInspectorCpu, index: number): string {
  return (
    cpu.processorId ||
    cpu.socketDesignation ||
    cpu.name ||
    `cpu-${index}`
  );
}

function getHardwareInspectorMemoryKey(
  memory: HardwareInspectorMemoryModule,
  index: number
): string {
  return (
    memory.serialNumber ||
    memory.deviceLocator ||
    memory.bankLabel ||
    memory.partNumber ||
    `memory-${index}`
  );
}

function getHardwareInspectorGpuKey(gpu: HardwareInspectorGpu, index: number): string {
  return gpu.pnpDeviceId || gpu.name || `gpu-${index}`;
}

function getHardwareInspectorDiskKey(
  disk: HardwareInspectorDisk,
  index: number
): string {
  return (
    disk.deviceId ||
    disk.serialNumber ||
    [disk.model, String(index)].filter(Boolean).join("#") ||
    `disk-${index}`
  );
}

type HardwareInspectorFieldSpec<T> = {
  label: string;
  get: (item: T) => unknown;
};

type HardwareInspectorEntityEntry<T> = {
  item: T;
  index: number;
  name: string;
};

function normalizeHardwareInspectorComparableValue(
  value: unknown
): string | number | boolean | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return JSON.stringify(value);
}

function areHardwareInspectorComparableValuesEqual(a: unknown, b: unknown): boolean {
  return (
    normalizeHardwareInspectorComparableValue(a) ===
    normalizeHardwareInspectorComparableValue(b)
  );
}

function addHardwareInspectorChange(
  target: Record<string, string[]>,
  key: string,
  labels: string[]
): void {
  if (labels.length === 0) {
    return;
  }

  target[key] = labels;
}

function collectHardwareInspectorObjectChanges<T>(
  previous: T,
  current: T,
  specs: HardwareInspectorFieldSpec<T>[]
): string[] {
  const labels: string[] = [];
  specs.forEach((spec) => {
    if (!areHardwareInspectorComparableValuesEqual(spec.get(previous), spec.get(current))) {
      labels.push(spec.label);
    }
  });
  return labels;
}

function collectHardwareInspectorEntityChanges<T>(
  previousItems: T[],
  currentItems: T[],
  keyOf: (item: T, index: number) => string,
  nameOf: (item: T, index: number) => string,
  specs: HardwareInspectorFieldSpec<T>[],
  prefix: string
): { changes: Record<string, string[]>; summary: string[] } {
  const previousMap = new Map<string, HardwareInspectorEntityEntry<T>>();
  previousItems.forEach((item, index) => {
    previousMap.set(keyOf(item, index), {
      item,
      index,
      name: nameOf(item, index)
    });
  });

  const currentMap = new Map<string, HardwareInspectorEntityEntry<T>>();
  currentItems.forEach((item, index) => {
    currentMap.set(keyOf(item, index), {
      item,
      index,
      name: nameOf(item, index)
    });
  });

  const allKeys = new Set<string>([...previousMap.keys(), ...currentMap.keys()]);
  const changes: Record<string, string[]> = {};
  const summary: string[] = [];

  allKeys.forEach((key) => {
    const previousEntry = previousMap.get(key);
    const currentEntry = currentMap.get(key);
    const labels: string[] = [];
    const name = currentEntry?.name || previousEntry?.name || key;

    if (!previousEntry && currentEntry) {
      labels.push("新增");
    } else if (previousEntry && !currentEntry) {
      labels.push("移除");
    } else if (previousEntry && currentEntry) {
      labels.push(
        ...collectHardwareInspectorObjectChanges(
          previousEntry.item,
          currentEntry.item,
          specs
        )
      );
    }

    if (labels.length > 0) {
      addHardwareInspectorChange(changes, key, labels);
      summary.push(`${prefix}${name}：${labels.join("、")}`);
    }
  });

  return { changes, summary };
}

function createHardwareInspectorInitialDiffState(
  snapshot: HardwareInspectorSnapshot
): HardwareInspectorDiffState {
  return {
    hasBaseline: false,
    hasChanges: false,
    summary: ["首次采集，下一次刷新将显示变化对比"],
    overviewChangedKeys: [],
    computerSystemChanges: [],
    operatingSystemChanges: [],
    baseBoardChanges: [],
    biosChanges: [],
    cpuChanges: {},
    memoryChanges: {},
    gpuChanges: {},
    diskChanges: {},
    previousCollectedAt: null,
    currentCollectedAt: snapshot.collectedAt
  };
}

function buildHardwareInspectorDiffState(
  previous: HardwareInspectorSnapshot | null,
  current: HardwareInspectorSnapshot
): HardwareInspectorDiffState {
  if (!previous) {
    return createHardwareInspectorInitialDiffState(current);
  }

  const overviewChangedKeys = new Set<string>();
  const summary: string[] = [];

  const currentRiskDisks = countHardwareInspectorRiskDisks(current);
  const previousRiskDisks = countHardwareInspectorRiskDisks(previous);
  if (
    !areHardwareInspectorComparableValuesEqual(
      [previous.computerSystem.manufacturer, previous.computerSystem.model].join(" "),
      [current.computerSystem.manufacturer, current.computerSystem.model].join(" ")
    )
  ) {
    overviewChangedKeys.add("device");
    summary.push("设备信息已变化");
  }
  if (
    !areHardwareInspectorComparableValuesEqual(
      [previous.operatingSystem.caption, previous.operatingSystem.buildNumber].join(" / "),
      [current.operatingSystem.caption, current.operatingSystem.buildNumber].join(" / ")
    )
  ) {
    overviewChangedKeys.add("system");
    summary.push("系统版本已变化");
  }
  if (
    !areHardwareInspectorComparableValuesEqual(previous.cpus[0]?.name, current.cpus[0]?.name)
  ) {
    overviewChangedKeys.add("cpu");
    summary.push("CPU 摘要已变化");
  }
  if (
    !areHardwareInspectorComparableValuesEqual(
      previous.computerSystem.totalPhysicalMemory,
      current.computerSystem.totalPhysicalMemory
    )
  ) {
    overviewChangedKeys.add("totalMemory");
    summary.push("总内存已变化");
  }
  if (!areHardwareInspectorComparableValuesEqual(previous.gpus.length, current.gpus.length)) {
    overviewChangedKeys.add("gpuCount");
    summary.push(`显卡数量 ${previous.gpus.length} -> ${current.gpus.length}`);
  }
  if (!areHardwareInspectorComparableValuesEqual(previous.disks.length, current.disks.length)) {
    overviewChangedKeys.add("diskCount");
    summary.push(`磁盘数量 ${previous.disks.length} -> ${current.disks.length}`);
  }
  if (!areHardwareInspectorComparableValuesEqual(previousRiskDisks, currentRiskDisks)) {
    overviewChangedKeys.add("riskDiskCount");
    summary.push(`风险磁盘 ${previousRiskDisks} -> ${currentRiskDisks}`);
  }

  const computerSystemChanges = collectHardwareInspectorObjectChanges(
    previous.computerSystem,
    current.computerSystem,
    [
      { label: "厂商", get: (item) => item.manufacturer },
      { label: "型号", get: (item) => item.model },
      { label: "系统类型", get: (item) => item.systemType },
      { label: "总内存", get: (item) => item.totalPhysicalMemory }
    ]
  );
  if (computerSystemChanges.length > 0) {
    summary.push(`设备信息：${computerSystemChanges.join("、")}`);
  }

  const operatingSystemChanges = collectHardwareInspectorObjectChanges(
    previous.operatingSystem,
    current.operatingSystem,
    [
      { label: "系统名称", get: (item) => item.caption },
      { label: "版本", get: (item) => item.version },
      { label: "构建号", get: (item) => item.buildNumber },
      { label: "架构", get: (item) => item.architecture },
      { label: "启动时间", get: (item) => item.lastBootUpTime }
    ]
  );
  if (operatingSystemChanges.length > 0) {
    summary.push(`系统信息：${operatingSystemChanges.join("、")}`);
  }

  const baseBoardChanges = collectHardwareInspectorObjectChanges(
    previous.baseBoard,
    current.baseBoard,
    [
      { label: "厂商", get: (item) => item.manufacturer },
      { label: "型号", get: (item) => item.product },
      { label: "版本", get: (item) => item.version },
      { label: "序列号", get: (item) => item.serialNumber }
    ]
  );
  if (baseBoardChanges.length > 0) {
    summary.push(`主板信息：${baseBoardChanges.join("、")}`);
  }

  const biosChanges = collectHardwareInspectorObjectChanges(previous.bios, current.bios, [
    { label: "厂商", get: (item) => item.manufacturer },
    { label: "版本", get: (item) => item.smbiosBiosVersion || item.version },
    { label: "发布日期", get: (item) => item.releaseDate },
    { label: "序列号", get: (item) => item.serialNumber }
  ]);
  if (biosChanges.length > 0) {
    summary.push(`BIOS：${biosChanges.join("、")}`);
  }

  const cpuDiff = collectHardwareInspectorEntityChanges(
    previous.cpus,
    current.cpus,
    getHardwareInspectorCpuKey,
    (item, index) => item.name || `处理器 ${index + 1}`,
    [
      { label: "型号", get: (item) => item.name },
      { label: "厂商", get: (item) => item.manufacturer },
      { label: "插槽", get: (item) => item.socketDesignation },
      { label: "核心 / 线程", get: (item) => `${item.numberOfCores}/${item.numberOfLogicalProcessors}` },
      { label: "最大频率", get: (item) => item.maxClockSpeed },
      { label: "温度(可选)", get: (item) => item.temperatureCelsius },
      { label: "温度来源", get: (item) => item.temperatureSource },
      { label: "架构", get: (item) => item.architecture },
      { label: "虚拟化", get: (item) => item.virtualizationFirmwareEnabled },
      { label: "SLAT", get: (item) => item.secondLevelAddressTranslationExtensions }
    ],
    "CPU "
  );

  const memoryDiff = collectHardwareInspectorEntityChanges(
    previous.memoryModules,
    current.memoryModules,
    getHardwareInspectorMemoryKey,
    (item, index) => item.deviceLocator || item.bankLabel || `内存 ${index + 1}`,
    [
      { label: "容量", get: (item) => item.capacity },
      { label: "频率", get: (item) => item.configuredClockSpeed || item.speed },
      { label: "类型", get: (item) => item.memoryType },
      { label: "形态", get: (item) => item.formFactor },
      { label: "厂商", get: (item) => item.manufacturer },
      { label: "型号", get: (item) => item.partNumber },
      { label: "序列号", get: (item) => item.serialNumber }
    ],
    "内存 "
  );

  const gpuDiff = collectHardwareInspectorEntityChanges(
    previous.gpus,
    current.gpus,
    getHardwareInspectorGpuKey,
    (item, index) => item.name || `显卡 ${index + 1}`,
    [
      { label: "名称", get: (item) => item.name },
      { label: "厂商", get: (item) => item.manufacturer },
      { label: "显存", get: (item) => item.adapterRam },
      { label: "驱动版本", get: (item) => item.driverVersion },
      { label: "驱动日期", get: (item) => item.driverDate },
      { label: "视频处理器", get: (item) => item.videoProcessor },
      { label: "温度(可选)", get: (item) => item.temperatureCelsius },
      { label: "温度来源", get: (item) => item.temperatureSource },
      {
        label: "分辨率",
        get: (item) =>
          `${item.horizontalResolution ?? ""}x${item.verticalResolution ?? ""}@${item.refreshRate ?? ""}`
      },
      { label: "状态", get: (item) => item.status }
    ],
    "显卡 "
  );

  const diskDiff = collectHardwareInspectorEntityChanges(
    previous.disks,
    current.disks,
    getHardwareInspectorDiskKey,
    (item, index) => item.model || `磁盘 ${index + 1}`,
    [
      { label: "厂商", get: (item) => item.manufacturer },
      { label: "容量", get: (item) => item.size },
      { label: "媒体类型", get: (item) => item.storageMediaType || item.mediaType },
      { label: "总线", get: (item) => item.busType || item.interfaceType },
      { label: "固件", get: (item) => item.firmwareVersion || item.firmwareRevision },
      { label: "健康状态", get: (item) => item.healthStatus },
      { label: "运行状态", get: (item) => item.operationalStatus },
      { label: "预测故障", get: (item) => item.smartPredictFailure },
      { label: "预测原因", get: (item) => item.smartReason },
      { label: "逻辑扇区", get: (item) => item.logicalSectorSize },
      { label: "物理扇区", get: (item) => item.physicalSectorSize },
      { label: "温度", get: (item) => item.temperatureCelsius },
      { label: "最高温度", get: (item) => item.temperatureMaxCelsius },
      { label: "磨损", get: (item) => item.wearPercentage },
      { label: "通电时长", get: (item) => item.powerOnHours },
      { label: "槽位", get: (item) => item.slotNumber },
      { label: "机箱槽", get: (item) => item.enclosureNumber },
      { label: "用途", get: (item) => item.usage },
      { label: "可加入存储池", get: (item) => item.canPool },
      { label: "序列号", get: (item) => item.serialNumber },
      { label: "分区数", get: (item) => item.partitionCount }
    ],
    "磁盘 "
  );

  summary.push(...cpuDiff.summary, ...memoryDiff.summary, ...gpuDiff.summary, ...diskDiff.summary);

  const limitedSummary = summary.slice(0, 10);
  return {
    hasBaseline: true,
    hasChanges:
      overviewChangedKeys.size > 0 ||
      computerSystemChanges.length > 0 ||
      operatingSystemChanges.length > 0 ||
      baseBoardChanges.length > 0 ||
      biosChanges.length > 0 ||
      Object.keys(cpuDiff.changes).length > 0 ||
      Object.keys(memoryDiff.changes).length > 0 ||
      Object.keys(gpuDiff.changes).length > 0 ||
      Object.keys(diskDiff.changes).length > 0,
    summary: limitedSummary.length > 0 ? limitedSummary : ["与上次采集一致"],
    overviewChangedKeys: [...overviewChangedKeys],
    computerSystemChanges,
    operatingSystemChanges,
    baseBoardChanges,
    biosChanges,
    cpuChanges: cpuDiff.changes,
    memoryChanges: memoryDiff.changes,
    gpuChanges: gpuDiff.changes,
    diskChanges: diskDiff.changes,
    previousCollectedAt: previous.collectedAt,
    currentCollectedAt: current.collectedAt
  };
}

function applyHardwareInspectorSnapshot(
  snapshot: HardwareInspectorSnapshot,
  infoText?: string
): void {
  hardwareInspectorSnapshot = snapshot;
  hardwareInspectorDiffState = buildHardwareInspectorDiffState(
    hardwareInspectorLastSnapshot,
    snapshot
  );
  hardwareInspectorLastSnapshot = snapshot;
  hardwareInspectorInfo =
    infoText && infoText.trim() ? infoText : buildHardwareInspectorSummaryText(snapshot);
}

function formatHardwareInspectorResolution(gpu: HardwareInspectorGpu): string {
  if (!gpu.horizontalResolution || !gpu.verticalResolution) {
    return "未知";
  }

  const base = `${gpu.horizontalResolution} × ${gpu.verticalResolution}`;
  return gpu.refreshRate ? `${base} @ ${gpu.refreshRate}Hz` : base;
}

function getHardwareInspectorSnapshotFromData(
  data: Record<string, unknown> | null
): HardwareInspectorSnapshot | null {
  const snapshot = data?.snapshot;
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }
  return snapshot as HardwareInspectorSnapshot;
}

function buildHardwareInspectorSummaryText(snapshot: HardwareInspectorSnapshot): string {
  const systemName = [snapshot.computerSystem.manufacturer, snapshot.computerSystem.model]
    .filter(Boolean)
    .join(" ");
  const cpuName = snapshot.cpus[0]?.name ?? "未知 CPU";
  const memoryText = formatHardwareInspectorBytes(
    snapshot.computerSystem.totalPhysicalMemory
  );
  return [
    systemName || "未知设备",
    cpuName,
    `内存 ${memoryText}`,
    `显卡 ${snapshot.gpus.length} 张`,
    `磁盘 ${snapshot.disks.length} 块`
  ].join(" / ");
}

async function executeHardwareInspectorRefresh(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行硬件检测");
    return;
  }

  const requestToken = ++hardwareInspectorRequestToken;
  hardwareInspectorLoading = true;
  hardwareInspectorError = "";
  hardwareInspectorInfo = "正在采集硬件信息...";
  if (mode === "plugin" && activePluginPanel?.pluginId === HARDWARE_INSPECTOR_PLUGIN_ID) {
    renderList();
  }
  setStatus("正在采集硬件信息...");

  const item: LaunchItem = {
    id: `plugin:${HARDWARE_INSPECTOR_PLUGIN_ID}:refresh`,
    type: "command",
    title: "硬件检测",
    subtitle: "刷新硬件信息",
    target: `command:plugin:${HARDWARE_INSPECTOR_PLUGIN_ID}?action=refresh`,
    keywords: ["plugin", "hardware", "systeminfo", "硬件", "刷新"]
  };

  const result = await launcher.execute(item);
  if (requestToken !== hardwareInspectorRequestToken) {
    return;
  }

  hardwareInspectorLoading = false;
  const data = toRecord(result.data);
  const snapshot = getHardwareInspectorSnapshotFromData(data);
  if (snapshot) {
    applyHardwareInspectorSnapshot(
      snapshot,
      typeof data?.info === "string" ? data.info : ""
    );
  } else {
    hardwareInspectorSnapshot = null;
    hardwareInspectorInfo = typeof data?.info === "string" ? data.info : "";
  }

  hardwareInspectorError =
    typeof data?.error === "string" && data.error.trim()
      ? data.error
      : result.ok
        ? ""
        : result.message ?? "硬件信息采集失败";

  setStatus(
    result.message ??
      (result.ok ? "硬件信息采集完成" : hardwareInspectorError || "硬件信息采集失败")
  );
  if (mode === "plugin" && activePluginPanel?.pluginId === HARDWARE_INSPECTOR_PLUGIN_ID) {
    renderList();
  }
}

async function executeHardwareInspectorExportReport(
  format: "markdown" | "html"
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus(`桥接层未加载，无法导出${format === "html" ? "HTML" : "Markdown"}报告`);
    return;
  }

  hardwareInspectorExporting = true;
  hardwareInspectorError = "";
  beginPluginNativeInteraction();
  if (mode === "plugin" && activePluginPanel?.pluginId === HARDWARE_INSPECTOR_PLUGIN_ID) {
    renderList();
  }
  setStatus(`正在导出${format === "html" ? "HTML" : "Markdown"}报告...`);

  const item: LaunchItem = {
    id: `plugin:${HARDWARE_INSPECTOR_PLUGIN_ID}:${format === "html" ? "export-html" : "export-report"}`,
    type: "command",
    title: "硬件检测",
    subtitle: `导出硬件${format === "html" ? " HTML" : " Markdown"}报告`,
    target: `command:plugin:${HARDWARE_INSPECTOR_PLUGIN_ID}?action=${format === "html" ? "export-html" : "export-report"}`,
    keywords: ["plugin", "hardware", "report", "导出", "硬件报告", format]
  };

  try {
    const result = await launcher.execute(item);
    const data = toRecord(result.data);
    const snapshot = getHardwareInspectorSnapshotFromData(data);
    if (snapshot) {
      applyHardwareInspectorSnapshot(
        snapshot,
        typeof data?.info === "string" ? data.info : ""
      );
    }

    hardwareInspectorError =
      typeof data?.error === "string" && data.error.trim()
        ? data.error
        : result.ok
          ? ""
          : result.message ?? `导出${format === "html" ? "HTML" : "Markdown"}报告失败`;

    setStatus(
      result.message ??
        (result.ok
          ? `${format === "html" ? "HTML" : "Markdown"}报告已导出`
          : hardwareInspectorError || `导出${format === "html" ? "HTML" : "Markdown"}报告失败`)
    );
  } finally {
    hardwareInspectorExporting = false;
    schedulePluginNativeInteractionRelease();
    if (mode === "plugin" && activePluginPanel?.pluginId === HARDWARE_INSPECTOR_PLUGIN_ID) {
      renderList();
    }
  }
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

function cloneWebtoolsApiRows(rows: WebtoolsApiKvRow[]): WebtoolsApiKvRow[] {
  return rows.map((row) => ({
    key: row.key,
    value: row.value,
    enabled: row.enabled
  }));
}

function normalizeWebtoolsApiRows(
  rows: unknown,
  fallback: WebtoolsApiKvRow[] = [{ key: "", value: "", enabled: true }]
): WebtoolsApiKvRow[] {
  if (!Array.isArray(rows)) {
    return cloneWebtoolsApiRows(fallback);
  }

  const normalized: WebtoolsApiKvRow[] = [];
  rows.forEach((value) => {
    const record = toRecord(value);
    if (!record) {
      return;
    }
    normalized.push({
      key: typeof record.key === "string" ? record.key : "",
      value: typeof record.value === "string" ? record.value : "",
      enabled: typeof record.enabled === "boolean" ? record.enabled : true
    });
  });

  return normalized.length > 0 ? normalized : cloneWebtoolsApiRows(fallback);
}

function ensureWebtoolsApiEditableRows(rows: WebtoolsApiKvRow[]): WebtoolsApiKvRow[] {
  return rows.length > 0 ? rows : [{ key: "", value: "", enabled: true }];
}

function syncWebtoolsApiContentTypeHeader(): void {
  const headerIndex = webtoolsApiHeaders.findIndex(
    (row) => row.key.trim().toLowerCase() === "content-type"
  );

  if (webtoolsApiBodyType === "formdata") {
    if (headerIndex >= 0) {
      webtoolsApiHeaders[headerIndex].key = "Content-Type";
      webtoolsApiHeaders[headerIndex].value = "自动处理";
      webtoolsApiHeaders[headerIndex].enabled = false;
      return;
    }
    webtoolsApiHeaders = [
      { key: "Content-Type", value: "自动处理", enabled: false },
      ...webtoolsApiHeaders
    ];
    return;
  }

  const expectedValue = webtoolsApiBodyType === "text" ? "text/plain" : "application/json";
  if (headerIndex >= 0) {
    webtoolsApiHeaders[headerIndex].key = "Content-Type";
    webtoolsApiHeaders[headerIndex].value = expectedValue;
    webtoolsApiHeaders[headerIndex].enabled = true;
    return;
  }

  webtoolsApiHeaders = [
    { key: "Content-Type", value: expectedValue, enabled: true },
    ...webtoolsApiHeaders
  ];
}

function buildWebtoolsApiPreviewUrl(): string {
  const raw = webtoolsApiUrl.trim();
  if (!raw) {
    return "";
  }
  try {
    const url = new URL(raw);
    webtoolsApiParams.forEach((row) => {
      if (row.enabled && row.key.trim()) {
        url.searchParams.set(row.key.trim(), row.value);
      }
    });
    return url.toString();
  } catch {
    try {
      const url = new URL(`https://${raw}`);
      webtoolsApiParams.forEach((row) => {
        if (row.enabled && row.key.trim()) {
          url.searchParams.set(row.key.trim(), row.value);
        }
      });
      return url.toString();
    } catch {
      return raw;
    }
  }
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
    if (item.id.startsWith("command:apps-folder:")) {
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
  panelImplsSafe.applyWebtoolsPasswordPanelPayload(panel);
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
  panelImplsSafe.renderWebtoolsPasswordPanel();
}

function applyWebtoolsJsonPanelPayload(panel: ActivePluginPanelState): void {
  panelImplsSafe.applyWebtoolsJsonPanelPayload(panel);
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

  const inputMetaNode = form.querySelector<HTMLElement>(".webtools-json-input-meta");
  if (inputMetaNode) {
    inputMetaNode.textContent = webtoolsJsonState.sourceFormat.toUpperCase();
  }

  const outputMetaNode = form.querySelector<HTMLElement>(".webtools-json-output-meta");
  if (outputMetaNode) {
    outputMetaNode.textContent = webtoolsJsonState.targetFormat.toUpperCase();
  }

  const errorNode = form.querySelector<HTMLDivElement>(".webtools-json-error");
  if (errorNode) {
    const hasError = webtoolsJsonState.valid === false && Boolean(webtoolsJsonState.info);
    errorNode.textContent = hasError ? webtoolsJsonState.info : "";
    errorNode.hidden = !hasError;
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
  panelImplsSafe.renderWebtoolsJsonPanel();
}

function applyWebtoolsUrlPanelPayload(panel: ActivePluginPanelState): void {
  panelImplsSafe.applyWebtoolsUrlPanelPayload(panel);
}

function tryParseWebtoolsUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const hasExplicitProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
  const looksLikeUrl =
    hasExplicitProtocol ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("localhost") ||
    /^[\w.-]+\.[a-z]{2,}/i.test(trimmed) ||
    /^\d{1,3}(?:\.\d{1,3}){3}/.test(trimmed) ||
    /[/?#:]/.test(trimmed);

  if (!looksLikeUrl) {
    return null;
  }

  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
}

function parseWebtoolsUrlInput(input: string): void {
  webtoolsUrlState.input = input;

  const trimmed = input.trim();
  if (!trimmed) {
    webtoolsUrlState.valid = null;
    webtoolsUrlState.info = "输入 URL 后自动解析";
    webtoolsUrlState.parts = createEmptyWebtoolsUrlParts();
    webtoolsUrlState.queryRows = [];
    return;
  }

  const parsed = tryParseWebtoolsUrl(trimmed);
  if (!parsed) {
    webtoolsUrlState.valid = false;
    webtoolsUrlState.info = "当前输入不是有效 URL，请输入完整链接或域名";
    webtoolsUrlState.parts = createEmptyWebtoolsUrlParts();
    webtoolsUrlState.queryRows = [];
    return;
  }

  const queryRows = Array.from(parsed.searchParams.entries()).map(([key, value]) => ({
    key,
    value
  }));
  const defaultPort = parsed.protocol === "https:" ? "443" : "80";

  webtoolsUrlState.valid = true;
  webtoolsUrlState.parts = {
    protocol: parsed.protocol,
    host: parsed.host,
    port: parsed.port || defaultPort,
    pathname: parsed.pathname,
    search: parsed.search,
    hash: parsed.hash
  };
  webtoolsUrlState.queryRows = queryRows;
  webtoolsUrlState.info = `已解析 ${queryRows.length} 个查询参数`;
}

function rebuildWebtoolsUrlFromQueryRows(): boolean {
  const parsed = tryParseWebtoolsUrl(webtoolsUrlState.input);
  if (!parsed) {
    webtoolsUrlState.valid = false;
    webtoolsUrlState.info = "当前输入不是有效 URL，无法回写参数";
    return false;
  }

  parsed.search = "";
  for (const row of webtoolsUrlState.queryRows) {
    if (!row.key.trim()) {
      continue;
    }
    parsed.searchParams.append(row.key, row.value);
  }

  webtoolsUrlState.input = parsed.toString();
  parseWebtoolsUrlInput(webtoolsUrlState.input);
  return true;
}

function refreshWebtoolsUrlPartsInForm(form: HTMLFormElement): void {
  form.querySelectorAll<HTMLInputElement>("[data-webtools-url-part]").forEach((node) => {
    const key = node.dataset.webtoolsUrlPart as keyof WebtoolsUrlParts | undefined;
    if (!key) {
      return;
    }
    node.value = webtoolsUrlState.parts[key] ?? "";
  });
}

function renderWebtoolsUrlQueryEditor(
  form: HTMLFormElement,
  host: HTMLElement,
  inputArea: HTMLTextAreaElement
): void {
  host.textContent = "";

  const table = document.createElement("div");
  table.className = "webtools-url-query-table";

  const header = document.createElement("div");
  header.className = "webtools-url-query-header";
  ["键", "值", "操作"].forEach((titleText) => {
    const node = document.createElement("div");
    node.textContent = titleText;
    header.appendChild(node);
  });
  table.appendChild(header);

  if (webtoolsUrlState.queryRows.length === 0) {
    const empty = document.createElement("div");
    empty.className = "webtools-url-query-empty";
    empty.textContent = "当前没有查询参数";
    table.appendChild(empty);
    host.appendChild(table);
    return;
  }

  webtoolsUrlState.queryRows.forEach((row, index) => {
    const line = document.createElement("div");
    line.className = "webtools-url-query-row";

    const keyInput = document.createElement("input");
    keyInput.className = "settings-value webtools-tool-input";
    keyInput.value = row.key;
    keyInput.placeholder = "键";
    keyInput.addEventListener("input", () => {
      webtoolsUrlState.queryRows[index].key = keyInput.value;
      rebuildWebtoolsUrlFromQueryRows();
      inputArea.value = webtoolsUrlState.input;
      refreshWebtoolsUrlPartsInForm(form);
      refreshWebtoolsUrlInfoInForm(form);
    });

    const valueInput = document.createElement("input");
    valueInput.className = "settings-value webtools-tool-input";
    valueInput.value = row.value;
    valueInput.placeholder = "值";
    valueInput.addEventListener("input", () => {
      webtoolsUrlState.queryRows[index].value = valueInput.value;
      rebuildWebtoolsUrlFromQueryRows();
      inputArea.value = webtoolsUrlState.input;
      refreshWebtoolsUrlPartsInForm(form);
      refreshWebtoolsUrlInfoInForm(form);
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "settings-btn settings-btn-secondary webtools-url-remove-btn";
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => {
      webtoolsUrlState.queryRows.splice(index, 1);
      rebuildWebtoolsUrlFromQueryRows();
      inputArea.value = webtoolsUrlState.input;
      refreshWebtoolsUrlPanelInForm(form, { rebuildQueryRows: true });
    });

    line.append(keyInput, valueInput, removeButton);
    table.appendChild(line);
  });

  host.appendChild(table);
}

function refreshWebtoolsUrlInfoInForm(form: HTMLFormElement): void {
  const infoNode = form.querySelector<HTMLElement>(".webtools-url-info");
  if (!infoNode) {
    return;
  }

  infoNode.textContent = webtoolsUrlState.info;
  infoNode.dataset.state =
    webtoolsUrlState.valid === false
      ? "error"
      : webtoolsUrlState.valid === true
        ? "ok"
        : "idle";
}

function refreshWebtoolsUrlPanelInForm(
  form: HTMLFormElement,
  options: { rebuildQueryRows?: boolean; syncInput?: boolean } = {}
): void {
  const inputArea = form.elements.namedItem("webtoolsUrlInput");
  if (inputArea instanceof HTMLTextAreaElement && options.syncInput) {
    inputArea.value = webtoolsUrlState.input;
  }

  refreshWebtoolsUrlPartsInForm(form);
  refreshWebtoolsUrlInfoInForm(form);

  if (options.rebuildQueryRows) {
    const queryHost = form.querySelector<HTMLElement>(".webtools-url-query-host");
    const textarea = form.elements.namedItem("webtoolsUrlInput");
    if (queryHost && textarea instanceof HTMLTextAreaElement) {
      renderWebtoolsUrlQueryEditor(form, queryHost, textarea);
    }
  }
}

function createWebtoolsUrlPartField(
  labelText: string,
  partKey: keyof WebtoolsUrlParts,
  full = false
): HTMLLabelElement {
  const field = document.createElement("label");
  field.className = full ? "webtools-url-part webtools-url-part-full" : "webtools-url-part";

  const label = document.createElement("div");
  label.className = "webtools-url-part-label";
  label.textContent = labelText;
  const input = document.createElement("input");
  input.className = "settings-value webtools-tool-input webtools-url-part-input";
  input.readOnly = true;
  input.dataset.webtoolsUrlPart = partKey;
  field.append(label, input);
  return field;
}

function renderWebtoolsUrlPanel(): void {
  panelImplsSafe.renderWebtoolsUrlPanel();
}

function applyWebtoolsDiffPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  webtoolsDiffLeft =
    data && typeof data.left === "string"
      ? data.left
      : "Hello World\nThis is a test of the diff utility.\nSome lines stay the same.";
  webtoolsDiffRight =
    data && typeof data.right === "string"
      ? data.right
      : "Hello Everyone\nThis is a test of the diff engine.\nSome lines stay the same.\nAdded a new line here!";
  webtoolsDiffIgnoreCase =
    data && typeof data.ignoreCase === "boolean"
      ? data.ignoreCase
      : webtoolsDiffIgnoreCase;
  webtoolsDiffIgnoreWhitespace =
    data && typeof data.ignoreWhitespace === "boolean"
      ? data.ignoreWhitespace
      : webtoolsDiffIgnoreWhitespace;
  webtoolsDiffPrettyHtml = "";
  webtoolsDiffSummary = null;
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

function createWebtoolsDiffStatCard(label: string, value: string): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "webtools-diff-stat";

  const valueNode = document.createElement("div");
  valueNode.className = "webtools-diff-stat-value";
  valueNode.textContent = value;

  const labelNode = document.createElement("div");
  labelNode.className = "webtools-diff-stat-label";
  labelNode.textContent = label;

  card.append(valueNode, labelNode);
  return card;
}

function refreshWebtoolsDiffResultInForm(form: HTMLFormElement): void {
  const summaryNode = form.querySelector(".webtools-diff-summary");
  if (summaryNode instanceof HTMLDivElement) {
    summaryNode.replaceChildren();

    const status = document.createElement("div");
    status.className = "webtools-diff-summary-status";

    const cards = document.createElement("div");
    cards.className = "webtools-diff-stats";

    const leftEmpty = !webtoolsDiffLeft.trim();
    const rightEmpty = !webtoolsDiffRight.trim();
    if (leftEmpty && rightEmpty) {
      status.textContent = "输入左右文本后自动生成差异视图";
      status.dataset.state = "idle";
      summaryNode.append(status);
    } else if (webtoolsDiffSummary) {
      status.textContent = webtoolsDiffSummary.identical
        ? webtoolsDiffSummary.rawIdentical
          ? "两侧文本一致"
          : "按当前忽略规则，两侧文本一致"
        : "已检测到文本差异";
      status.dataset.state = webtoolsDiffSummary.identical ? "same" : "changed";

      cards.append(
        createWebtoolsDiffStatCard("新增", String(webtoolsDiffSummary.added)),
        createWebtoolsDiffStatCard("删除", String(webtoolsDiffSummary.removed)),
        createWebtoolsDiffStatCard("相同", String(webtoolsDiffSummary.same)),
        createWebtoolsDiffStatCard(
          "编辑距离",
          String(webtoolsDiffSummary.levenshtein ?? 0)
        ),
        createWebtoolsDiffStatCard(
          "A 行数",
          String(webtoolsDiffSummary.leftLines ?? 0)
        ),
        createWebtoolsDiffStatCard(
          "B 行数",
          String(webtoolsDiffSummary.rightLines ?? 0)
        )
      );
      summaryNode.append(status, cards);
    } else {
      status.textContent = "暂未生成差异结果";
      status.dataset.state = "idle";
      summaryNode.append(status);
    }
  }

  const viewerNode = form.querySelector(".webtools-diff-viewer");
  if (viewerNode instanceof HTMLDivElement) {
    if (webtoolsDiffPrettyHtml.trim()) {
      viewerNode.innerHTML = webtoolsDiffPrettyHtml;
    } else if (!webtoolsDiffLeft.trim() && !webtoolsDiffRight.trim()) {
      viewerNode.textContent = "等待输入左右文本";
    } else if (webtoolsDiffSummary?.identical) {
      viewerNode.textContent = "两侧文本一致，没有可展示的差异片段";
    } else {
      viewerNode.textContent = "暂无差异结果";
    }
  }
}

function scheduleWebtoolsDiffAutoCompare(
  form: HTMLFormElement,
  immediate = false
): void {
  if (webtoolsDiffAutoTimer !== null) {
    window.clearTimeout(webtoolsDiffAutoTimer);
  }

  webtoolsDiffAutoTimer = window.setTimeout(() => {
    webtoolsDiffAutoTimer = null;
    if (!form.isConnected) {
      return;
    }
    void executeWebtoolsDiffCompare(form, { render: false });
  }, immediate ? 0 : 220);
}

async function executeWebtoolsDiffCompare(
  form: HTMLFormElement,
  options: { render?: boolean } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行文本对比");
    return;
  }
  const shouldRender = options.render ?? true;

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
  const requestToken = ++webtoolsDiffRequestToken;

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_DIFF_PLUGIN_ID}:compare`,
    type: "command",
    title: "文本对比",
    subtitle: "面板执行",
    target: buildWebtoolsDiffTarget(),
    keywords: ["plugin", "diff", "compare", "文本", "对比", "差异"]
  };

  const result = await launcher.execute(item);
  if (requestToken !== webtoolsDiffRequestToken) {
    return;
  }
  const data = toRecord(result.data);
  webtoolsDiffPrettyHtml =
    data && typeof data.prettyHtml === "string" ? data.prettyHtml : "";

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
      shown: summaryRecord.shown,
      identical:
        typeof summaryRecord.identical === "boolean"
          ? summaryRecord.identical
          : undefined,
      rawIdentical:
        typeof summaryRecord.rawIdentical === "boolean"
          ? summaryRecord.rawIdentical
          : undefined,
      leftLength:
        typeof summaryRecord.leftLength === "number"
          ? summaryRecord.leftLength
          : undefined,
      rightLength:
        typeof summaryRecord.rightLength === "number"
          ? summaryRecord.rightLength
          : undefined,
      leftLines:
        typeof summaryRecord.leftLines === "number"
          ? summaryRecord.leftLines
          : undefined,
      rightLines:
        typeof summaryRecord.rightLines === "number"
          ? summaryRecord.rightLines
          : undefined,
      levenshtein:
        typeof summaryRecord.levenshtein === "number"
          ? summaryRecord.levenshtein
          : undefined
    };
  } else {
    webtoolsDiffSummary = null;
  }

  setStatus(result.message ?? (result.ok ? "对比完成" : "对比失败"));
  if (shouldRender) {
    renderList();
    return;
  }
  refreshWebtoolsDiffResultInForm(form);
}

function renderWebtoolsDiffPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel webtools-diff-panel";

  const form = document.createElement("form");
  form.className = "settings-form webtools-diff-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsDiffCompare(form, { render: false });
  });

  const header = document.createElement("div");
  header.className = "webtools-diff-header";
  const headerText = document.createElement("div");
  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "文本对比";
  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "实时比较两段文本并输出高亮差异视图。";
  headerText.append(title, description);
  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "settings-btn settings-btn-secondary";
  clearButton.textContent = "清空";
  clearButton.addEventListener("click", () => {
    webtoolsDiffLeft = "";
    webtoolsDiffRight = "";
    webtoolsDiffPrettyHtml = "";
    webtoolsDiffSummary = null;
    const leftNode = form.elements.namedItem("webtoolsDiffLeft");
    const rightNode = form.elements.namedItem("webtoolsDiffRight");
    if (leftNode instanceof HTMLTextAreaElement) {
      leftNode.value = "";
    }
    if (rightNode instanceof HTMLTextAreaElement) {
      rightNode.value = "";
    }
    refreshWebtoolsDiffResultInForm(form);
    setStatus("已清空文本对比内容");
  });
  header.append(headerText, clearButton);

  const editors = document.createElement("div");
  editors.className = "webtools-diff-editors";

  const leftWrap = document.createElement("label");
  leftWrap.className = "webtools-diff-editor";
  const leftLabel = document.createElement("span");
  leftLabel.className = "settings-row-label";
  leftLabel.textContent = "原文本 (A)";
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
  rightLabel.textContent = "新文本 (B)";
  const rightArea = document.createElement("textarea");
  rightArea.className = "settings-value webtools-textarea";
  rightArea.name = "webtoolsDiffRight";
  rightArea.value = webtoolsDiffRight;
  rightArea.placeholder = "输入右侧文本";
  rightWrap.append(rightLabel, rightArea);

  editors.append(leftWrap, rightWrap);

  const optionsRow = document.createElement("div");
  optionsRow.className = "webtools-password-flags webtools-diff-options";

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

  const summary = document.createElement("div");
  summary.className = "webtools-diff-summary";

  const resultPane = document.createElement("section");
  resultPane.className = "webtools-diff-result";
  const resultLabel = document.createElement("div");
  resultLabel.className = "webtools-diff-result-label";
  resultLabel.textContent = "差异视图";
  const viewer = document.createElement("div");
  viewer.className = "webtools-diff-viewer";
  resultPane.append(resultLabel, viewer);

  [leftArea, rightArea].forEach((node) => {
    node.addEventListener("input", () => {
      scheduleWebtoolsDiffAutoCompare(form);
    });
  });
  [ignoreCaseInput, ignoreWhitespaceInput].forEach((node) => {
    node.addEventListener("change", () => {
      scheduleWebtoolsDiffAutoCompare(form, true);
    });
  });

  form.append(header, editors, optionsRow, summary, resultPane);
  panel.append(form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);

  refreshWebtoolsDiffResultInForm(form);
  scheduleWebtoolsDiffAutoCompare(form, true);
}

function normalizeWebtoolsTimestampUnit(value: unknown): "s" | "ms" {
  return value === "ms" ? "ms" : "s";
}

function formatWebtoolsTimestampDate(value: Date): string {
  const yyyy = String(value.getFullYear());
  const mm = String(value.getMonth() + 1).padStart(2, "0");
  const dd = String(value.getDate()).padStart(2, "0");
  const hh = String(value.getHours()).padStart(2, "0");
  const mi = String(value.getMinutes()).padStart(2, "0");
  const ss = String(value.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function getWebtoolsTimestampNowUnix(unit: "s" | "ms"): string {
  const nowMs = Date.now();
  if (unit === "ms") {
    return String(nowMs);
  }
  return String(Math.floor(nowMs / 1000));
}

function clearWebtoolsTimestampAutoTimer(): void {
  if (webtoolsTimestampAutoTimer !== null) {
    window.clearTimeout(webtoolsTimestampAutoTimer);
    webtoolsTimestampAutoTimer = null;
  }
}

function clearWebtoolsTimestampClockTimer(): void {
  if (webtoolsTimestampClockTimer !== null) {
    window.clearInterval(webtoolsTimestampClockTimer);
    webtoolsTimestampClockTimer = null;
  }
}

function ensureWebtoolsTimestampDefaults(): void {
  if (!webtoolsTimestampDateInput.trim()) {
    webtoolsTimestampDateInput = formatWebtoolsTimestampDate(new Date());
  }
  if (!webtoolsTimestampUnixInput.trim()) {
    webtoolsTimestampUnixInput = getWebtoolsTimestampNowUnix(webtoolsTimestampUnit);
  }
}

function applyWebtoolsTimestampPanelPayload(panel: ActivePluginPanelState): void {
  panelImplsSafe.applyWebtoolsTimestampPanelPayload(panel);
}

function buildWebtoolsTimestampTarget(
  action: "toDate" | "toTimestamp",
  input: string
): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("input", input);
  params.set("unit", webtoolsTimestampUnit);
  return `command:plugin:${WEBTOOLS_TIMESTAMP_PLUGIN_ID}?${params.toString()}`;
}

function refreshWebtoolsTimestampResultInForm(form: HTMLFormElement): void {
  const dateOutputNode = form.elements.namedItem("webtoolsTimestampDateOutput");
  if (dateOutputNode instanceof HTMLInputElement) {
    dateOutputNode.value = webtoolsTimestampDateOutput;
  }

  const tsOutputNode = form.elements.namedItem("webtoolsTimestampTimestampOutput");
  if (tsOutputNode instanceof HTMLInputElement) {
    tsOutputNode.value = webtoolsTimestampTimestampOutput;
  }

  const infoNode = form.querySelector(".webtools-timestamp-info-value");
  if (infoNode instanceof HTMLSpanElement) {
    infoNode.textContent = webtoolsTimestampInfo || "-";
  }

  const tsUnitNode = form.querySelector("[data-webtools-timestamp-unit-label]");
  if (tsUnitNode instanceof HTMLSpanElement) {
    tsUnitNode.textContent = webtoolsTimestampUnit === "s" ? "秒 (s)" : "毫秒 (ms)";
  }
}

function scheduleWebtoolsTimestampAutoConvert(
  form: HTMLFormElement,
  action: "toDate" | "toTimestamp",
  immediate = false
): void {
  clearWebtoolsTimestampAutoTimer();

  webtoolsTimestampAutoTimer = window.setTimeout(() => {
    webtoolsTimestampAutoTimer = null;
    if (!form.isConnected) {
      return;
    }

    const input =
      action === "toDate" ? webtoolsTimestampUnixInput : webtoolsTimestampDateInput;
    if (!input.trim()) {
      if (action === "toDate") {
        webtoolsTimestampDateOutput = "";
      } else {
        webtoolsTimestampTimestampOutput = "";
      }
      webtoolsTimestampInfo = "等待输入";
      refreshWebtoolsTimestampResultInForm(form);
      return;
    }

    void executeWebtoolsTimestampAction(action, input, { render: false, form });
  }, immediate ? 0 : 220);
}

async function executeWebtoolsTimestampAction(
  action: "toDate" | "toTimestamp",
  input: string,
  options: { render?: boolean; form?: HTMLFormElement } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行时间戳工具");
    return;
  }
  const shouldRender = options.render ?? true;

  if (action === "toDate") {
    webtoolsTimestampUnixInput = input;
  } else {
    webtoolsTimestampDateInput = input;
  }

  const requestToken =
    action === "toDate"
      ? ++webtoolsTimestampToDateRequestToken
      : ++webtoolsTimestampToTimestampRequestToken;

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_TIMESTAMP_PLUGIN_ID}:${action}`,
    type: "command",
    title: "时间戳工具",
    subtitle: "面板执行",
    target: buildWebtoolsTimestampTarget(action, input),
    keywords: ["plugin", "timestamp", "time", "date", "时间戳", "日期", "转换"]
  };

  const result = await launcher.execute(item);
  if (
    (action === "toDate" && requestToken !== webtoolsTimestampToDateRequestToken) ||
    (action === "toTimestamp" &&
      requestToken !== webtoolsTimestampToTimestampRequestToken)
  ) {
    return;
  }

  const data = toRecord(result.data);
  if (data && typeof data.unit === "string") {
    webtoolsTimestampUnit = normalizeWebtoolsTimestampUnit(data.unit);
  }

  if (action === "toDate") {
    webtoolsTimestampDateOutput =
      (data && typeof data.date === "string" && data.date) ||
      (data && typeof data.output === "string" && data.output) ||
      "";
    if (!result.ok) {
      webtoolsTimestampDateOutput = "";
    }
  } else {
    webtoolsTimestampTimestampOutput =
      (data && typeof data.timestamp === "string" && data.timestamp) ||
      (data && typeof data.output === "string" && data.output) ||
      "";
    if (!result.ok) {
      webtoolsTimestampTimestampOutput = "";
    }
  }

  webtoolsTimestampInfo =
    (data && typeof data.info === "string" && data.info) || result.message || "";

  setStatus(result.message ?? (result.ok ? "转换完成" : "转换失败"));
  if (shouldRender) {
    renderList();
    return;
  }
  if (options.form) {
    refreshWebtoolsTimestampResultInForm(options.form);
  }
}

function renderWebtoolsTimestampPanel(): void {
  panelImplsSafe.renderWebtoolsTimestampPanel();
}

function escapeWebtoolsRegexHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeWebtoolsRegexFlags(flags: string): string {
  const normalized = flags
    .split("")
    .filter((flag, index, list) => list.indexOf(flag) === index)
    .filter((flag) => WEBTOOLS_REGEX_SAFE_FLAGS.includes(flag))
    .join("");

  return normalized || "g";
}

function refreshWebtoolsRegexState(): void {
  webtoolsRegexFlags = sanitizeWebtoolsRegexFlags(webtoolsRegexFlags);
  webtoolsRegexRows = [];
  webtoolsRegexInfo = "";
  webtoolsRegexError = "";
  webtoolsRegexHighlightedHtml = escapeWebtoolsRegexHtml(webtoolsRegexInput);
  webtoolsRegexOutput = "";

  if (!webtoolsRegexInput) {
    webtoolsRegexInfo = "请输入测试文本";
    return;
  }

  if (!webtoolsRegexPattern.trim()) {
    webtoolsRegexInfo = "请输入正则表达式";
    return;
  }

  try {
    const directRegex = new RegExp(webtoolsRegexPattern, webtoolsRegexFlags);
    const searchFlags = webtoolsRegexFlags.includes("g")
      ? webtoolsRegexFlags
      : sanitizeWebtoolsRegexFlags(`${webtoolsRegexFlags}g`);
    const searchRegex = new RegExp(webtoolsRegexPattern, searchFlags);
    const rows: WebtoolsRegexMatchRow[] = [];
    const parts: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null = searchRegex.exec(webtoolsRegexInput);

    while (match) {
      if (match.index > lastIndex) {
        parts.push(escapeWebtoolsRegexHtml(webtoolsRegexInput.slice(lastIndex, match.index)));
      }
      parts.push(
        `<span class="webtools-regex-highlight">${escapeWebtoolsRegexHtml(match[0] ?? "")}</span>`
      );
      rows.push({
        index: match.index,
        match: match[0] ?? "",
        groups: match.slice(1).map((item) => item ?? "")
      });
      lastIndex = searchRegex.lastIndex;

      if ((match[0] ?? "") === "") {
        searchRegex.lastIndex += 1;
        lastIndex = searchRegex.lastIndex;
      }

      match = searchRegex.exec(webtoolsRegexInput);
    }

    if (lastIndex < webtoolsRegexInput.length) {
      parts.push(escapeWebtoolsRegexHtml(webtoolsRegexInput.slice(lastIndex)));
    }

    webtoolsRegexRows = rows;
    webtoolsRegexHighlightedHtml = parts.join("") || escapeWebtoolsRegexHtml(webtoolsRegexInput);
    webtoolsRegexInfo = rows.length > 0 ? `匹配数: ${rows.length}` : "未匹配到结果";

    if (webtoolsRegexReplacement) {
      webtoolsRegexOutput = webtoolsRegexInput.replace(directRegex, webtoolsRegexReplacement);
    }
  } catch (error) {
    webtoolsRegexRows = [];
    webtoolsRegexHighlightedHtml = escapeWebtoolsRegexHtml(webtoolsRegexInput);
    webtoolsRegexError =
      error instanceof Error && error.message ? error.message : "正则表达式无效";
    webtoolsRegexInfo = "表达式存在错误";
  }
}

function refreshWebtoolsRegexPreviewInForm(form: HTMLFormElement): void {
  const flagsNode = form.elements.namedItem("webtoolsRegexFlags");
  if (flagsNode instanceof HTMLInputElement) {
    flagsNode.value = webtoolsRegexFlags;
  }

  const errorNode = form.querySelector<HTMLDivElement>(".webtools-regex-error");
  if (errorNode) {
    errorNode.textContent = webtoolsRegexError;
    errorNode.hidden = !webtoolsRegexError;
  }

  const infoNode = form.querySelector<HTMLDivElement>(".webtools-regex-info");
  if (infoNode) {
    infoNode.textContent = webtoolsRegexInfo || "等待输入";
    infoNode.dataset.state = webtoolsRegexError
      ? "error"
      : webtoolsRegexRows.length > 0
        ? "ok"
        : "idle";
  }

  const previewNode = form.querySelector<HTMLDivElement>(".webtools-regex-highlight-box");
  if (previewNode) {
    previewNode.innerHTML = webtoolsRegexHighlightedHtml || "&nbsp;";
  }

  const rowsNode = form.querySelector<HTMLDivElement>(".webtools-regex-match-list");
  if (rowsNode) {
    rowsNode.replaceChildren();
    if (webtoolsRegexRows.length === 0) {
      const empty = document.createElement("div");
      empty.className = "webtools-regex-match-empty";
      empty.textContent = webtoolsRegexError ? "表达式错误" : "暂无匹配明细";
      rowsNode.appendChild(empty);
    } else {
      webtoolsRegexRows.forEach((row, index) => {
        const item = document.createElement("div");
        item.className = "webtools-regex-match-item";
        const title = document.createElement("div");
        title.className = "webtools-regex-match-title";
        title.textContent = `#${index + 1} @ ${row.index}`;
        const value = document.createElement("div");
        value.className = "webtools-regex-match-value";
        value.textContent = row.match;
        item.append(title, value);

        if (row.groups.length > 0) {
          const groups = document.createElement("div");
          groups.className = "webtools-regex-match-groups";
          groups.textContent = row.groups.join(" | ");
          item.appendChild(groups);
        }

        rowsNode.appendChild(item);
      });
    }
  }
}

function applyWebtoolsCronPanelPayload(panel: ActivePluginPanelState): void {
  panelImplsSafe.applyWebtoolsCronPanelPayload(panel);
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
  panelImplsSafe.renderWebtoolsCronPanel();
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
  const copyButton = form.querySelector(".webtools-crypto-copy-btn");
  if (copyButton instanceof HTMLButtonElement) {
    copyButton.disabled = webtoolsCryptoOutput.trim().length === 0;
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
    algorithmNode instanceof HTMLSelectElement || algorithmNode instanceof HTMLInputElement
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
    algorithmNode instanceof HTMLSelectElement || algorithmNode instanceof HTMLInputElement
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

  const algorithmGroups = [
    { label: "哈希摘要", values: ["MD5", "SHA1", "SHA256", "SHA512"] },
    { label: "对称加密", values: ["AES", "DES"] },
    { label: "非对称 (RSA)", values: ["RSA", "Ed25519"] },
    { label: "编码转换", values: ["Base64", "URL"] }
  ] as const;

  const algorithmPicker = document.createElement("div");
  algorithmPicker.className = "webtools-crypto-picker";
  algorithmPicker.dataset.open = "false";

  const algorithmInput = document.createElement("input");
  algorithmInput.type = "hidden";
  algorithmInput.name = "webtoolsCryptoAlgorithm";
  algorithmInput.value = webtoolsCryptoAlgorithm;

  const algorithmTrigger = document.createElement("button");
  algorithmTrigger.type = "button";
  algorithmTrigger.className = "webtools-crypto-picker-trigger";
  algorithmTrigger.setAttribute("aria-haspopup", "listbox");
  algorithmTrigger.setAttribute("aria-expanded", "false");

  const algorithmTriggerValue = document.createElement("span");
  algorithmTriggerValue.className = "webtools-crypto-picker-value";
  algorithmTriggerValue.textContent = webtoolsCryptoAlgorithm;

  const algorithmTriggerArrow = document.createElement("span");
  algorithmTriggerArrow.className = "webtools-crypto-picker-arrow";
  algorithmTriggerArrow.textContent = "▾";
  algorithmTrigger.append(algorithmTriggerValue, algorithmTriggerArrow);

  const algorithmMenu = document.createElement("div");
  algorithmMenu.className = "webtools-crypto-picker-menu";
  algorithmMenu.setAttribute("role", "listbox");

  let removeAlgorithmOutsideListener: (() => void) | null = null;

  const closeAlgorithmMenu = (): void => {
    algorithmPicker.dataset.open = "false";
    algorithmTrigger.setAttribute("aria-expanded", "false");
    if (removeAlgorithmOutsideListener) {
      removeAlgorithmOutsideListener();
      removeAlgorithmOutsideListener = null;
    }
  };

  const openAlgorithmMenu = (): void => {
    if (algorithmPicker.dataset.open === "true") {
      return;
    }
    algorithmPicker.dataset.open = "true";
    algorithmTrigger.setAttribute("aria-expanded", "true");
    const handleOutsidePointer = (event: PointerEvent): void => {
      const target = event.target;
      if (target instanceof Node && algorithmPicker.contains(target)) {
        return;
      }
      closeAlgorithmMenu();
    };
    document.addEventListener("pointerdown", handleOutsidePointer, true);
    removeAlgorithmOutsideListener = () => {
      document.removeEventListener("pointerdown", handleOutsidePointer, true);
    };
  };

  const setAlgorithmValue = (value: string): void => {
    webtoolsCryptoAlgorithm = normalizeWebtoolsCryptoAlgorithm(value);
    algorithmInput.value = webtoolsCryptoAlgorithm;
    algorithmTriggerValue.textContent = webtoolsCryptoAlgorithm;
    Array.from(
      algorithmMenu.querySelectorAll<HTMLButtonElement>(".webtools-crypto-picker-option")
    ).forEach((button) => {
      button.classList.toggle("active", button.dataset.value === webtoolsCryptoAlgorithm);
    });
  };

  algorithmGroups.forEach((group) => {
    const groupNode = document.createElement("section");
    groupNode.className = "webtools-crypto-picker-group";

    const groupTitle = document.createElement("div");
    groupTitle.className = "webtools-crypto-picker-group-title";
    groupTitle.textContent = group.label;

    const optionList = document.createElement("div");
    optionList.className = "webtools-crypto-picker-option-list";

    group.values.forEach((value) => {
      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "webtools-crypto-picker-option";
      optionButton.dataset.value = value;
      optionButton.setAttribute("role", "option");
      optionButton.textContent = value;
      optionButton.classList.toggle("active", webtoolsCryptoAlgorithm === value);
      optionButton.addEventListener("click", () => {
        setAlgorithmValue(value);
        closeAlgorithmMenu();
        updateCryptoUiState();
        scheduleWebtoolsCryptoAutoProcess(form, true);
      });
      optionList.appendChild(optionButton);
    });

    groupNode.append(groupTitle, optionList);
    algorithmMenu.appendChild(groupNode);
  });

  algorithmTrigger.addEventListener("click", () => {
    if (algorithmPicker.dataset.open === "true") {
      closeAlgorithmMenu();
      return;
    }
    openAlgorithmMenu();
  });

  algorithmPicker.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAlgorithmMenu();
      algorithmTrigger.focus();
    }
  });

  algorithmPicker.append(algorithmInput, algorithmTrigger, algorithmMenu);

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
  copyButton.className = "settings-btn settings-btn-primary webtools-crypto-copy-btn";
  copyButton.textContent = "复制";
  copyButton.addEventListener("click", () => {
    void (async () => {
      const copied = await copyTextToClipboard(webtoolsCryptoOutput);
      setStatus(copied ? "已复制输出内容" : "复制失败");
    })();
  });

  toolbar.append(algorithmPicker, modeSwitch, clearButton, copyButton);
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
    const algorithm = normalizeWebtoolsCryptoAlgorithm(algorithmInput.value);
    webtoolsCryptoAlgorithm = algorithm;
    algorithmInput.value = algorithm;
    algorithmTriggerValue.textContent = algorithm;

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

  refreshWebtoolsCryptoResultInForm(form);
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

function getWebtoolsJwtSecretLabel(mode: "jws" | "jwe", algorithm: "HS256" | "RS256"): string {
  if (mode === "jwe") {
    return "密钥 / 解密密钥";
  }
  if (algorithm === "RS256") {
    return "密钥 / PEM 密钥";
  }
  return "密钥 / Secret";
}

function getWebtoolsJwtSecretPlaceholder(
  mode: "jws" | "jwe",
  algorithm: "HS256" | "RS256",
  jweAlg: "dir" | "A256KW"
): string {
  if (mode === "jwe") {
    return jweAlg === "A256KW"
      ? "输入 A256KW 密钥，生成与解密都使用同一包装密钥"
      : "输入 JWE Secret，系统会按长度自动补零/截断";
  }
  if (algorithm === "RS256") {
    return "签名时填 PKCS8 私钥，解析/校验时填 SPKI 公钥";
  }
  return "输入 HS256 Secret";
}

function getWebtoolsJwtStatusContent(): {
  text: string;
  state: "ok" | "error" | "idle";
} {
  if (webtoolsJwtVerified === true) {
    return {
      text: webtoolsJwtMode === "jwe" ? "解密 / 校验通过" : "签名验证通过",
      state: "ok"
    };
  }
  if (webtoolsJwtVerified === false) {
    return {
      text: webtoolsJwtMode === "jwe" ? "解密 / 校验失败" : "签名验证失败",
      state: "error"
    };
  }
  if (webtoolsJwtInfo.trim()) {
    return {
      text: webtoolsJwtInfo,
      state: "idle"
    };
  }
  return {
    text: "等待输入 Token 或编辑 Header / Payload",
    state: "idle"
  };
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

  const secretLabelNode = form.querySelector(".webtools-jwt-secret-caption");
  if (secretLabelNode instanceof HTMLSpanElement) {
    secretLabelNode.textContent = getWebtoolsJwtSecretLabel(mode, webtoolsJwtAlgorithm);
  }

  const secretInput = form.elements.namedItem("webtoolsJwtSecret");
  if (secretInput instanceof HTMLInputElement) {
    secretInput.placeholder = getWebtoolsJwtSecretPlaceholder(
      mode,
      webtoolsJwtAlgorithm,
      webtoolsJwtJweAlg
    );
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

  const status = getWebtoolsJwtStatusContent();
  const statusNode = form.querySelector(".webtools-jwt-status");
  if (statusNode instanceof HTMLDivElement) {
    statusNode.dataset.state = status.state;
  }
  const statusTextNode = form.querySelector(".webtools-jwt-status-text");
  if (statusTextNode instanceof HTMLSpanElement) {
    statusTextNode.textContent = status.text;
  }

  const copyButton = form.querySelector(".webtools-jwt-copy-btn");
  if (copyButton instanceof HTMLButtonElement) {
    copyButton.disabled = webtoolsJwtToken.trim().length === 0;
  }

  const infoNode = form.querySelector(".webtools-jwt-info");
  if (infoNode instanceof HTMLDivElement) {
    infoNode.textContent = webtoolsJwtInfo;
    infoNode.style.display =
      webtoolsJwtInfo && webtoolsJwtInfo !== status.text ? "" : "none";
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

  const header = document.createElement("div");
  header.className = "webtools-jwt-header";

  const titleGroup = document.createElement("div");
  titleGroup.className = "webtools-jwt-title-group";
  const title = document.createElement("h3");
  title.className = "settings-title webtools-jwt-title";
  title.textContent = activePluginPanel?.title || "JWT 调试器";
  const description = document.createElement("p");
  description.className = "webtools-jwt-subtitle";
  description.textContent =
    activePluginPanel?.subtitle || "支持 JWS/JWE 解析、签名、加密与校验。";
  titleGroup.append(title, description);

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
  copyButton.className = "settings-btn settings-btn-primary webtools-jwt-copy-btn";
  copyButton.textContent = "复制";
  copyButton.addEventListener("click", () => {
    void (async () => {
      const copied = await copyTextToClipboard(webtoolsJwtToken);
      setStatus(copied ? "已复制 Token" : "复制失败");
    })();
  });

  toolbar.append(modeTabs, jwsControls, jweControls, clearButton, copyButton);
  header.append(titleGroup, toolbar);

  const body = document.createElement("div");
  body.className = "webtools-jwt-layout";

  const tokenPane = document.createElement("section");
  tokenPane.className = "webtools-jwt-pane webtools-jwt-encoded-pane";
  const tokenLabel = document.createElement("div");
  tokenLabel.className = "webtools-jwt-pane-label";
  tokenLabel.textContent = "编码后的 TOKEN";
  const tokenArea = document.createElement("textarea");
  tokenArea.className = "settings-value webtools-textarea webtools-jwt-token-area";
  tokenArea.name = "webtoolsJwtToken";
  tokenArea.value = webtoolsJwtToken;
  tokenArea.placeholder = "粘贴 JWT/JWE";
  tokenArea.spellcheck = false;
  tokenPane.append(tokenLabel, tokenArea);

  const decodedPane = document.createElement("section");
  decodedPane.className = "webtools-jwt-pane webtools-jwt-decoded";

  const headerSection = document.createElement("section");
  headerSection.className = "webtools-jwt-decoded-section";
  const headerLabel = document.createElement("div");
  headerLabel.className = "webtools-jwt-pane-label webtools-jwt-pane-label-header";
  headerLabel.textContent = "标头 (Header)";
  const headerArea = document.createElement("textarea");
  headerArea.className = "settings-value webtools-textarea webtools-jwt-json-area";
  headerArea.name = "webtoolsJwtHeader";
  headerArea.value = webtoolsJwtHeader;
  headerArea.placeholder = '{"alg":"HS256","typ":"JWT"}';
  headerArea.spellcheck = false;
  headerSection.append(headerLabel, headerArea);

  const payloadSection = document.createElement("section");
  payloadSection.className = "webtools-jwt-decoded-section";
  const payloadLabel = document.createElement("div");
  payloadLabel.className = "webtools-jwt-pane-label webtools-jwt-pane-label-payload";
  payloadLabel.textContent = "载荷 (Payload)";
  const payloadArea = document.createElement("textarea");
  payloadArea.className = "settings-value webtools-textarea webtools-jwt-json-area";
  payloadArea.name = "webtoolsJwtPayload";
  payloadArea.value = webtoolsJwtPayload;
  payloadArea.placeholder = '{"sub":"123","name":"John Doe"}';
  payloadArea.spellcheck = false;
  payloadSection.append(payloadLabel, payloadArea);

  const signatureSection = document.createElement("section");
  signatureSection.className = "webtools-jwt-decoded-section webtools-jwt-signature-section";
  const signatureLabel = document.createElement("div");
  signatureLabel.className = "webtools-jwt-pane-label webtools-jwt-pane-label-signature";
  signatureLabel.textContent = "签名 / 密钥";

  const signatureBody = document.createElement("div");
  signatureBody.className = "webtools-jwt-signature-body";

  const secretField = document.createElement("label");
  secretField.className = "webtools-jwt-secret-field";
  const secretCaption = document.createElement("span");
  secretCaption.className = "webtools-jwt-secret-caption";
  secretCaption.textContent = getWebtoolsJwtSecretLabel(webtoolsJwtMode, webtoolsJwtAlgorithm);
  const secretInput = document.createElement("input");
  secretInput.className = "settings-value webtools-jwt-secret-input";
  secretInput.name = "webtoolsJwtSecret";
  secretInput.value = webtoolsJwtSecret;
  secretInput.placeholder = getWebtoolsJwtSecretPlaceholder(
    webtoolsJwtMode,
    webtoolsJwtAlgorithm,
    webtoolsJwtJweAlg
  );
  secretField.append(secretCaption, secretInput);

  const status = getWebtoolsJwtStatusContent();
  const statusBox = document.createElement("div");
  statusBox.className = "webtools-jwt-status";
  statusBox.dataset.state = status.state;
  const statusText = document.createElement("span");
  statusText.className = "webtools-jwt-status-text";
  statusText.textContent = status.text;
  statusBox.appendChild(statusText);

  const info = document.createElement("div");
  info.className = "webtools-jwt-info";
  info.textContent = webtoolsJwtInfo;
  info.style.display = webtoolsJwtInfo && webtoolsJwtInfo !== status.text ? "" : "none";

  signatureBody.append(secretField, statusBox, info);
  signatureSection.append(signatureLabel, signatureBody);

  const changeMode = (mode: "jws" | "jwe"): void => {
    modeInput.value = mode;
    webtoolsJwtMode = mode;
    webtoolsJwtVerified = null;
    refreshWebtoolsJwtModeUi(form);
    refreshWebtoolsJwtResultInForm(form);
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
    webtoolsJwtVerified = null;
    refreshWebtoolsJwtResultInForm(form);
    scheduleWebtoolsJwtAutoSign(form, true);
  });
  jweAlgSelect.addEventListener("change", () => {
    webtoolsJwtJweAlg = jweAlgSelect.value === "A256KW" ? "A256KW" : "dir";
    webtoolsJwtVerified = null;
    refreshWebtoolsJwtResultInForm(form);
    scheduleWebtoolsJwtAutoSign(form, true);
  });
  jweEncSelect.addEventListener("change", () => {
    webtoolsJwtJweEnc = jweEncSelect.value === "A128GCM" ? "A128GCM" : "A256GCM";
    webtoolsJwtVerified = null;
    refreshWebtoolsJwtResultInForm(form);
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

  decodedPane.append(headerSection, payloadSection, signatureSection);
  body.append(tokenPane, decodedPane);
  form.append(modeInput, header, body);
  panel.append(form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);

  refreshWebtoolsJwtResultInForm(form);
  if (tokenArea.value.trim().length > 0) {
    scheduleWebtoolsJwtAutoParse(form, true);
  }
}

function applyWebtoolsStringsPanelPayload(panel: ActivePluginPanelState): void {
  panelImplsSafe.applyWebtoolsStringsPanelPayload(panel);
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
  form: HTMLFormElement,
  options: { caseType?: string } = {}
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
    typeof options.caseType === "string"
      ? options.caseType
      : caseNode instanceof HTMLSelectElement
      ? caseNode.value
      : webtoolsStringsCaseType;
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
  if (action === "convert" && webtoolsStringsOutput.trim()) {
    webtoolsStringsInput = webtoolsStringsOutput;
  }

  setStatus(result.message ?? (result.ok ? "执行完成" : "执行失败"));
  renderList();
}

function renderWebtoolsStringsPanel(): void {
  panelImplsSafe.renderWebtoolsStringsPanel();
}

function applyWebtoolsColorsPanelPayload(panel: ActivePluginPanelState): void {
  panelImplsSafe.applyWebtoolsColorsPanelPayload(panel);
}

function buildWebtoolsColorsTarget(color: string): string {
  const params = new URLSearchParams();
  params.set("action", "convert");
  params.set("color", color);
  return `command:plugin:${WEBTOOLS_COLORS_PLUGIN_ID}?${params.toString()}`;
}

function getWebtoolsColorsPreviewTextColor(): string {
  const match = webtoolsColorsHex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!match) {
    return "#f4f8ff";
  }

  const value = match[1] ?? "6c5ce7";
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 152 ? "#0f172a" : "#f8fbff";
}

function refreshWebtoolsColorsPanelInForm(form: HTMLFormElement): void {
  const preview = form.querySelector("[data-webtools-colors-preview]");
  if (preview instanceof HTMLDivElement) {
    preview.style.background = webtoolsColorsHex || "#6c5ce7";
  }

  const previewText = form.querySelector("[data-webtools-colors-preview-text]");
  if (previewText instanceof HTMLSpanElement) {
    previewText.textContent = webtoolsColorsHex || "#6c5ce7";
    previewText.style.color = getWebtoolsColorsPreviewTextColor();
  }

  const picker = form.elements.namedItem("webtoolsColorsPicker");
  if (picker instanceof HTMLInputElement) {
    picker.value = /^#([0-9a-f]{6})$/i.test(webtoolsColorsHex) ? webtoolsColorsHex : "#6c5ce7";
  }

  const hexOutput = form.querySelector("[data-webtools-colors-output='hex']");
  if (hexOutput instanceof HTMLDivElement) {
    hexOutput.textContent = webtoolsColorsHex || "-";
  }
  const rgbOutput = form.querySelector("[data-webtools-colors-output='rgb']");
  if (rgbOutput instanceof HTMLDivElement) {
    rgbOutput.textContent = webtoolsColorsRgb || "-";
  }
  const hslOutput = form.querySelector("[data-webtools-colors-output='hsl']");
  if (hslOutput instanceof HTMLDivElement) {
    hslOutput.textContent = webtoolsColorsHsl || "-";
  }

  form.querySelectorAll<HTMLElement>("[data-webtools-colors-preset]").forEach((node) => {
    node.dataset.active =
      node.dataset.webtoolsColorsPreset?.toLowerCase() === webtoolsColorsHex.toLowerCase()
        ? "true"
        : "false";
  });

  const shadesWrap = form.querySelector("[data-webtools-colors-shades]");
  if (shadesWrap instanceof HTMLDivElement) {
    shadesWrap.textContent = "";
    const shades = webtoolsColorsShades.length > 0 ? webtoolsColorsShades : [webtoolsColorsHex];
    shades.forEach((color) => {
      const shade = document.createElement("button");
      shade.type = "button";
      shade.className = "webtools-colors-shade-item";
      shade.title = color;
      shade.style.background = color;
      shade.addEventListener("click", () => {
        const inputNode = form.elements.namedItem("webtoolsColorsInput");
        if (inputNode instanceof HTMLInputElement) {
          inputNode.value = color;
        }
        void executeWebtoolsColorsConvert(color, { render: false, form });
      });
      shadesWrap.appendChild(shade);
    });
  }
}

function scheduleWebtoolsColorsAutoConvert(
  form: HTMLFormElement,
  color: string,
  immediate = false
): void {
  if (webtoolsColorsAutoTimer !== null) {
    window.clearTimeout(webtoolsColorsAutoTimer);
  }

  webtoolsColorsAutoTimer = window.setTimeout(() => {
    webtoolsColorsAutoTimer = null;
    if (!form.isConnected) {
      return;
    }
    void executeWebtoolsColorsConvert(color, { render: false, form });
  }, immediate ? 0 : 160);
}

async function executeWebtoolsColorsConvert(
  color: string,
  options: { render?: boolean; form?: HTMLFormElement } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行颜色工具");
    return;
  }

  webtoolsColorsInput = color;
  const requestToken = ++webtoolsColorsRequestToken;
  const shouldRender = options.render ?? true;

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_COLORS_PLUGIN_ID}:convert`,
    type: "command",
    title: "颜色工具",
    subtitle: "面板执行",
    target: buildWebtoolsColorsTarget(color),
    keywords: ["plugin", "color", "hex", "rgb", "hsl", "颜色"]
  };

  const result = await launcher.execute(item);
  if (requestToken !== webtoolsColorsRequestToken) {
    return;
  }
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
  if (shouldRender) {
    renderList();
    return;
  }
  if (options.form) {
    refreshWebtoolsColorsPanelInForm(options.form);
  }
}

function renderWebtoolsColorsPanel(): void {
  panelImplsSafe.renderWebtoolsColorsPanel();
}

function applyWebtoolsImageBase64PanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  if (data && typeof data.input === "string") {
    webtoolsImageBase64Input = data.input;
  } else {
    webtoolsImageBase64Input = "";
  }
  webtoolsImageBase64DataUrl = "";
  webtoolsImageBase64Raw = "";
  webtoolsImageBase64Mime = "";
  webtoolsImageBase64SizeText = "";
  webtoolsImageBase64Info = "";
  webtoolsImageBase64Error = "";
  webtoolsImageBase64Dragging = false;
  webtoolsImageBase64FileName = "";
}

function buildWebtoolsImageBase64Target(input: string): string {
  const params = new URLSearchParams();
  params.set("action", "normalize");
  params.set("input", input);
  return `command:plugin:${WEBTOOLS_IMAGE_BASE64_PLUGIN_ID}?${params.toString()}`;
}

function getWebtoolsImageBase64DownloadName(): string {
  if (webtoolsImageBase64FileName.trim()) {
    return webtoolsImageBase64FileName.trim();
  }

  const mime = webtoolsImageBase64Mime.trim().toLowerCase();
  if (mime === "image/jpeg") {
    return "image.jpg";
  }
  if (mime === "image/webp") {
    return "image.webp";
  }
  if (mime === "image/gif") {
    return "image.gif";
  }
  if (mime === "image/svg+xml") {
    return "image.svg";
  }
  return "image.png";
}

function refreshWebtoolsImageBase64PanelInForm(form: HTMLFormElement): void {
  const previewHost = form.querySelector<HTMLDivElement>(".webtools-image-base64-preview-host");
  if (previewHost) {
    previewHost.replaceChildren();
    if (webtoolsImageBase64DataUrl.startsWith("data:image/")) {
      const image = document.createElement("img");
      image.className = "webtools-image-base64-preview-image";
      image.src = webtoolsImageBase64DataUrl;
      image.alt = "base64 preview";
      previewHost.appendChild(image);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "webtools-image-base64-placeholder";
      placeholder.textContent =
        "拖拽图片到这里，或上传本地图片；也可以在右侧粘贴 Base64 / DataURL。";
      previewHost.appendChild(placeholder);
    }
  }

  const outputArea = form.querySelector<HTMLTextAreaElement>("[data-webtools-image-base64-output]");
  if (outputArea) {
    outputArea.value = webtoolsImageBase64DataUrl;
  }

  const metaNode = form.querySelector<HTMLDivElement>(".webtools-image-base64-meta");
  if (metaNode) {
    const parts = [
      webtoolsImageBase64FileName.trim() ? `文件: ${webtoolsImageBase64FileName.trim()}` : "",
      webtoolsImageBase64Mime.trim() ? `MIME: ${webtoolsImageBase64Mime.trim()}` : "",
      webtoolsImageBase64SizeText.trim() ? `大小: ${webtoolsImageBase64SizeText.trim()}` : ""
    ].filter(Boolean);
    metaNode.textContent = parts.join(" · ") || "等待图片或 Base64 输入";
  }

  const infoNode = form.querySelector<HTMLDivElement>(".webtools-tool-info");
  if (infoNode) {
    if (webtoolsImageBase64Error) {
      infoNode.dataset.state = "error";
      infoNode.textContent = webtoolsImageBase64Error;
    } else if (webtoolsImageBase64DataUrl) {
      infoNode.dataset.state = "ok";
      infoNode.textContent = webtoolsImageBase64Info || "转换完成";
    } else {
      infoNode.dataset.state = "idle";
      infoNode.textContent = "支持粘贴 Base64、DataURL，或直接上传图片";
    }
  }

  const dropzone = form.querySelector<HTMLDivElement>(".webtools-image-base64-dropzone");
  if (dropzone) {
    dropzone.dataset.dragging = webtoolsImageBase64Dragging ? "true" : "false";
  }

  const copyRawButton = form.querySelector<HTMLButtonElement>("[data-webtools-image-copy-raw]");
  if (copyRawButton) {
    copyRawButton.disabled = !webtoolsImageBase64Raw.trim();
  }

  const copyDataUrlButton =
    form.querySelector<HTMLButtonElement>("[data-webtools-image-copy-dataurl]");
  if (copyDataUrlButton) {
    copyDataUrlButton.disabled = !webtoolsImageBase64DataUrl.trim();
  }

  const downloadButton =
    form.querySelector<HTMLButtonElement>("[data-webtools-image-download]");
  if (downloadButton) {
    downloadButton.disabled = !webtoolsImageBase64DataUrl.startsWith("data:image/");
  }

  const clearButton = form.querySelector<HTMLButtonElement>("[data-webtools-image-clear]");
  if (clearButton) {
    clearButton.disabled =
      !webtoolsImageBase64Input.trim() &&
      !webtoolsImageBase64DataUrl.trim() &&
      !webtoolsImageBase64FileName.trim();
  }
}

function scheduleWebtoolsImageBase64AutoNormalize(
  form: HTMLFormElement,
  immediate = false
): void {
  if (webtoolsImageBase64AutoTimer !== null) {
    window.clearTimeout(webtoolsImageBase64AutoTimer);
  }

  webtoolsImageBase64AutoTimer = window.setTimeout(() => {
    webtoolsImageBase64AutoTimer = null;
    if (!form.isConnected) {
      return;
    }

    const node = form.elements.namedItem("webtoolsImageBase64Input");
    const inputValue = node instanceof HTMLTextAreaElement ? node.value : "";
    if (!inputValue.trim()) {
      webtoolsImageBase64RequestToken += 1;
      webtoolsImageBase64Input = "";
      webtoolsImageBase64DataUrl = "";
      webtoolsImageBase64Raw = "";
      webtoolsImageBase64Mime = "";
      webtoolsImageBase64SizeText = "";
      webtoolsImageBase64Info = "";
      webtoolsImageBase64Error = "";
      refreshWebtoolsImageBase64PanelInForm(form);
      setStatus("已清空图片 Base64 输入");
      return;
    }

    void executeWebtoolsImageBase64Normalize(inputValue, { render: false, form });
  }, immediate ? 0 : 260);
}

async function executeWebtoolsImageBase64Normalize(
  input: string,
  options: { render?: boolean; form?: HTMLFormElement } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行图片 Base64 工具");
    return;
  }
  const shouldRender = options.render ?? true;
  const requestToken = ++webtoolsImageBase64RequestToken;

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
  if (requestToken !== webtoolsImageBase64RequestToken) {
    return;
  }
  const data = toRecord(result.data);

  webtoolsImageBase64DataUrl =
    data && typeof data.dataUrl === "string" ? data.dataUrl : "";
  webtoolsImageBase64Raw =
    data && typeof data.rawBase64 === "string" ? data.rawBase64 : "";
  webtoolsImageBase64Mime =
    data && typeof data.mime === "string" ? data.mime : "";
  webtoolsImageBase64SizeText =
    data && typeof data.sizeText === "string" ? data.sizeText : "";
  webtoolsImageBase64Info = result.ok ? result.message ?? "转换完成" : "";
  webtoolsImageBase64Error = result.ok ? "" : result.message ?? "转换失败";

  setStatus(result.message ?? (result.ok ? "转换完成" : "转换失败"));
  if (shouldRender) {
    renderList();
    return;
  }
  if (options.form) {
    refreshWebtoolsImageBase64PanelInForm(options.form);
  }
}

function renderWebtoolsImageBase64Panel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel webtools-image-base64-panel";

  const form = document.createElement("form");
  form.className = "settings-form webtools-image-base64-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const node = form.elements.namedItem("webtoolsImageBase64Input");
    const inputValue = node instanceof HTMLTextAreaElement ? node.value : "";
    void executeWebtoolsImageBase64Normalize(inputValue, { render: false, form });
  });

  const readImageFile = (file: File): void => {
    if (!file.type.startsWith("image/")) {
      webtoolsImageBase64DataUrl = "";
      webtoolsImageBase64Raw = "";
      webtoolsImageBase64Mime = "";
      webtoolsImageBase64SizeText = "";
      webtoolsImageBase64FileName = "";
      webtoolsImageBase64Error = "请选择图片文件";
      webtoolsImageBase64Info = "";
      refreshWebtoolsImageBase64PanelInForm(form);
      setStatus("请选择图片文件");
      return;
    }

    webtoolsImageBase64FileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      const resultValue = typeof reader.result === "string" ? reader.result : "";
      const area = form.elements.namedItem("webtoolsImageBase64Input");
      if (area instanceof HTMLTextAreaElement) {
        area.value = resultValue;
      }
      void executeWebtoolsImageBase64Normalize(resultValue, { render: false, form });
    };
    reader.readAsDataURL(file);
  };

  const header = document.createElement("div");
  header.className = "webtools-image-base64-header";
  const titleGroup = document.createElement("div");
  const title = document.createElement("h3");
  title.className = "webtools-image-base64-title";
  title.textContent = activePluginPanel?.title || "图片 Base64";
  const description = document.createElement("p");
  description.className = "webtools-image-base64-description";
  description.textContent =
    activePluginPanel?.subtitle || "DataURL 与 Base64 文本互转/预览。";
  titleGroup.append(title, description);

  const toolbar = document.createElement("div");
  toolbar.className = "webtools-image-base64-toolbar";

  const copyRawButton = document.createElement("button");
  copyRawButton.type = "button";
  copyRawButton.className = "settings-btn settings-btn-secondary";
  copyRawButton.dataset.webtoolsImageCopyRaw = "1";
  copyRawButton.textContent = "复制 Base64";
  copyRawButton.addEventListener("click", async () => {
    if (!webtoolsImageBase64Raw.trim()) {
      setStatus("当前没有可复制的 Base64");
      return;
    }
    await navigator.clipboard.writeText(webtoolsImageBase64Raw);
    setStatus("已复制 Base64");
  });

  const copyDataUrlButton = document.createElement("button");
  copyDataUrlButton.type = "button";
  copyDataUrlButton.className = "settings-btn settings-btn-secondary";
  copyDataUrlButton.dataset.webtoolsImageCopyDataurl = "1";
  copyDataUrlButton.textContent = "复制 DataURL";
  copyDataUrlButton.addEventListener("click", async () => {
    if (!webtoolsImageBase64DataUrl.trim()) {
      setStatus("当前没有可复制的 DataURL");
      return;
    }
    await navigator.clipboard.writeText(webtoolsImageBase64DataUrl);
    setStatus("已复制 DataURL");
  });

  const downloadButton = document.createElement("button");
  downloadButton.type = "button";
  downloadButton.className = "settings-btn settings-btn-primary";
  downloadButton.dataset.webtoolsImageDownload = "1";
  downloadButton.textContent = "下载图片";
  downloadButton.addEventListener("click", () => {
    beginPluginNativeInteraction(1500);
    if (!webtoolsImageBase64DataUrl.startsWith("data:image/")) {
      schedulePluginNativeInteractionRelease();
      setStatus("当前没有可下载的图片");
      return;
    }
    const link = document.createElement("a");
    link.href = webtoolsImageBase64DataUrl;
    link.download = getWebtoolsImageBase64DownloadName();
    link.click();
    setStatus("已开始下载图片");
  });

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "settings-btn settings-btn-secondary";
  clearButton.dataset.webtoolsImageClear = "1";
  clearButton.textContent = "清空";
  clearButton.addEventListener("click", () => {
    if (webtoolsImageBase64AutoTimer !== null) {
      window.clearTimeout(webtoolsImageBase64AutoTimer);
      webtoolsImageBase64AutoTimer = null;
    }
    webtoolsImageBase64RequestToken += 1;
    webtoolsImageBase64Input = "";
    webtoolsImageBase64DataUrl = "";
    webtoolsImageBase64Raw = "";
    webtoolsImageBase64Mime = "";
    webtoolsImageBase64SizeText = "";
    webtoolsImageBase64Info = "";
    webtoolsImageBase64Error = "";
    webtoolsImageBase64FileName = "";
    const input = form.elements.namedItem("webtoolsImageBase64Input");
    if (input instanceof HTMLTextAreaElement) {
      input.value = "";
    }
    refreshWebtoolsImageBase64PanelInForm(form);
    setStatus("已清空图片 Base64 内容");
  });
  toolbar.append(copyRawButton, copyDataUrlButton, downloadButton, clearButton);
  header.append(titleGroup, toolbar);

  const layout = document.createElement("div");
  layout.className = "webtools-image-base64-layout";

  const previewColumn = document.createElement("div");
  previewColumn.className = "webtools-image-base64-preview";
  const previewHost = document.createElement("div");
  previewHost.className = "webtools-image-base64-preview-host";
  const meta = document.createElement("div");
  meta.className = "webtools-image-base64-meta";

  const dropzone = document.createElement("div");
  dropzone.className = "webtools-image-base64-dropzone";
  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    webtoolsImageBase64Dragging = true;
    refreshWebtoolsImageBase64PanelInForm(form);
  });
  dropzone.addEventListener("dragleave", () => {
    webtoolsImageBase64Dragging = false;
    refreshWebtoolsImageBase64PanelInForm(form);
  });
  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    webtoolsImageBase64Dragging = false;
    refreshWebtoolsImageBase64PanelInForm(form);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      readImageFile(file);
    }
  });
  const dropzoneTitle = document.createElement("div");
  dropzoneTitle.className = "webtools-image-base64-dropzone-title";
  dropzoneTitle.textContent = "拖拽图片到这里";
  const dropzoneHint = document.createElement("div");
  dropzoneHint.className = "webtools-image-base64-dropzone-hint";
  dropzoneHint.textContent = "支持直接上传图片，或在右侧粘贴 Base64 / DataURL";
  const uploadButton = document.createElement("label");
  uploadButton.className = "settings-btn settings-btn-secondary webtools-image-base64-upload";
  uploadButton.textContent = "选择图片";
  uploadButton.addEventListener("click", () => {
    beginPluginNativeInteraction();
  });
  const uploadInput = document.createElement("input");
  uploadInput.type = "file";
  uploadInput.accept = "image/*";
  uploadInput.className = "webtools-image-base64-file-input";
  uploadInput.addEventListener("click", () => {
    beginPluginNativeInteraction();
  });
  uploadInput.addEventListener("change", () => {
    const file = uploadInput.files?.[0];
    if (!file) {
      schedulePluginNativeInteractionRelease();
      return;
    }
    schedulePluginNativeInteractionRelease();
    readImageFile(file);
  });
  uploadButton.appendChild(uploadInput);
  dropzone.append(dropzoneTitle, dropzoneHint, uploadButton);
  previewColumn.append(previewHost, meta, dropzone);

  const editorColumn = document.createElement("div");
  editorColumn.className = "webtools-image-base64-editor";

  const inputPane = document.createElement("div");
  inputPane.className = "webtools-tool-pane";
  const inputHead = document.createElement("div");
  inputHead.className = "webtools-tool-pane-head";
  const inputLabel = document.createElement("div");
  inputLabel.className = "webtools-image-base64-input-label";
  inputLabel.textContent = "Base64 / DataURL 输入";
  const inputMeta = document.createElement("div");
  inputMeta.className = "webtools-tool-pane-meta";
  inputMeta.textContent = "输入后自动解析";
  inputHead.append(inputLabel, inputMeta);
  const inputArea = document.createElement("textarea");
  inputArea.className = "settings-value webtools-textarea webtools-image-base64-textarea";
  inputArea.name = "webtoolsImageBase64Input";
  inputArea.value = webtoolsImageBase64Input;
  inputArea.placeholder = "粘贴 Base64 或 DataURL";
  inputArea.spellcheck = false;
  inputArea.addEventListener("input", () => {
    webtoolsImageBase64Input = inputArea.value;
    webtoolsImageBase64FileName = "";
    webtoolsImageBase64Error = "";
    webtoolsImageBase64Info = "";
    scheduleWebtoolsImageBase64AutoNormalize(form);
  });
  inputPane.append(inputHead, inputArea);

  const outputPane = document.createElement("div");
  outputPane.className = "webtools-tool-pane";
  const outputHead = document.createElement("div");
  outputHead.className = "webtools-tool-pane-head";
  const outputLabel = document.createElement("div");
  outputLabel.className = "webtools-image-base64-input-label";
  outputLabel.textContent = "标准 DataURL 输出";
  const outputMeta = document.createElement("div");
  outputMeta.className = "webtools-tool-pane-meta";
  outputMeta.textContent = "只读";
  outputHead.append(outputLabel, outputMeta);
  const outputArea = document.createElement("textarea");
  outputArea.className = "settings-value webtools-textarea webtools-image-base64-textarea";
  outputArea.dataset.webtoolsImageBase64Output = "1";
  outputArea.readOnly = true;
  outputArea.value = webtoolsImageBase64DataUrl;
  outputArea.placeholder = "转换结果";
  outputPane.append(outputHead, outputArea);

  const infoNode = document.createElement("div");
  infoNode.className = "webtools-tool-info";

  editorColumn.append(inputPane, infoNode, outputPane);
  layout.append(previewColumn, editorColumn);

  form.append(header, layout);
  panel.append(form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);

  refreshWebtoolsImageBase64PanelInForm(form);
  if (webtoolsImageBase64Input.trim()) {
    scheduleWebtoolsImageBase64AutoNormalize(form, true);
  }
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
  if (!webtoolsConfigInput.trim()) {
    webtoolsConfigInput = WEBTOOLS_CONFIG_DEFAULT_INPUT;
  }
  webtoolsConfigOutput = data && typeof data.output === "string" ? data.output : "";
  webtoolsConfigInfo = data && typeof data.info === "string" ? data.info : "";
  webtoolsConfigError = data && typeof data.error === "string" ? data.error : "";
  if (!webtoolsConfigInfo && !webtoolsConfigError) {
    webtoolsConfigInfo = "输入内容后自动转换";
  }
}

function buildWebtoolsConfigTarget(): string {
  const params = new URLSearchParams();
  params.set("action", "convert");
  params.set("source", webtoolsConfigSource);
  params.set("target", webtoolsConfigTarget);
  params.set("input", webtoolsConfigInput);
  return `command:plugin:${WEBTOOLS_CONFIG_PLUGIN_ID}?${params.toString()}`;
}

function normalizeWebtoolsConfigFormat(
  value: string | undefined,
  fallback: "yaml" | "json" | "properties"
): "yaml" | "json" | "properties" {
  const normalized = (value ?? fallback).trim().toLowerCase();
  if (normalized === "yaml" || normalized === "json" || normalized === "properties") {
    return normalized;
  }
  return fallback;
}

function refreshWebtoolsConfigResultInForm(form: HTMLFormElement): void {
  const outputNode = form.elements.namedItem("webtoolsConfigOutput");
  if (outputNode instanceof HTMLTextAreaElement) {
    outputNode.value = webtoolsConfigOutput;
  }

  const inputLabel = form.querySelector("[data-webtools-config-input-label]");
  if (inputLabel instanceof HTMLDivElement) {
    inputLabel.textContent = `输入 (${webtoolsConfigSource.toUpperCase()})`;
  }

  const outputLabel = form.querySelector("[data-webtools-config-output-label]");
  if (outputLabel instanceof HTMLDivElement) {
    outputLabel.textContent = `输出 (${webtoolsConfigTarget.toUpperCase()})`;
  }

  const copyButton = form.querySelector("[data-webtools-config-copy]");
  if (copyButton instanceof HTMLButtonElement) {
    const hasOutput = Boolean(webtoolsConfigOutput.trim());
    copyButton.hidden = !hasOutput;
    copyButton.disabled = !hasOutput;
  }

  const errorNode = form.querySelector(".webtools-config-error");
  if (errorNode instanceof HTMLDivElement) {
    errorNode.hidden = !webtoolsConfigError;
    errorNode.textContent = webtoolsConfigError;
  }

  const infoNode = form.querySelector(".webtools-config-info");
  if (infoNode instanceof HTMLDivElement) {
    let text = webtoolsConfigInfo || "输入内容后自动转换";
    let state = "idle";
    if (webtoolsConfigError) {
      text = "配置转换失败，请检查输入格式";
      state = "error";
    } else if (webtoolsConfigOutput.trim()) {
      text = webtoolsConfigInfo || "转换完成";
      state = "ok";
    } else if (!webtoolsConfigInput.trim()) {
      text = webtoolsConfigInfo || "等待输入待转换内容";
      state = "empty";
    }
    infoNode.textContent = text;
    infoNode.dataset.state = state;
  }
}

function scheduleWebtoolsConfigAutoConvert(
  form: HTMLFormElement,
  immediate = false
): void {
  if (webtoolsConfigAutoTimer !== null) {
    window.clearTimeout(webtoolsConfigAutoTimer);
  }

  webtoolsConfigAutoTimer = window.setTimeout(() => {
    webtoolsConfigAutoTimer = null;
    if (!form.isConnected) {
      return;
    }

    const inputNode = form.elements.namedItem("webtoolsConfigInput");
    const value = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
    if (!value.trim()) {
      webtoolsConfigRequestToken += 1;
      webtoolsConfigInput = "";
      webtoolsConfigOutput = "";
      webtoolsConfigInfo = "等待输入待转换内容";
      webtoolsConfigError = "";
      refreshWebtoolsConfigResultInForm(form);
      setStatus("等待输入待转换内容");
      return;
    }

    void executeWebtoolsConfigConvert(form, { render: false });
  }, immediate ? 0 : 180);
}

async function executeWebtoolsConfigConvert(
  form: HTMLFormElement,
  options: { render?: boolean } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行配置转换");
    return;
  }
  const shouldRender = options.render ?? true;

  const sourceNode = form.elements.namedItem("webtoolsConfigSource");
  const targetNode = form.elements.namedItem("webtoolsConfigTarget");
  const inputNode = form.elements.namedItem("webtoolsConfigInput");

  webtoolsConfigSource =
    sourceNode instanceof HTMLSelectElement
      ? normalizeWebtoolsConfigFormat(sourceNode.value, "yaml")
      : "yaml";
  webtoolsConfigTarget =
    targetNode instanceof HTMLSelectElement
      ? normalizeWebtoolsConfigFormat(targetNode.value, "properties")
      : "properties";
  webtoolsConfigInput = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";

  if (!webtoolsConfigInput.trim()) {
    webtoolsConfigRequestToken += 1;
    webtoolsConfigOutput = "";
    webtoolsConfigInfo = "等待输入待转换内容";
    webtoolsConfigError = "";
    refreshWebtoolsConfigResultInForm(form);
    setStatus("等待输入待转换内容");
    return;
  }

  webtoolsConfigError = "";
  const requestToken = ++webtoolsConfigRequestToken;

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_CONFIG_PLUGIN_ID}:convert`,
    type: "command",
    title: "配置转换",
    subtitle: "面板执行",
    target: buildWebtoolsConfigTarget(),
    keywords: ["plugin", "config", "yaml", "json", "properties", "转换"]
  };

  const result = await launcher.execute(item);
  if (requestToken !== webtoolsConfigRequestToken) {
    return;
  }
  const data = toRecord(result.data);

  webtoolsConfigOutput =
    data && typeof data.output === "string" ? data.output : "";
  webtoolsConfigInfo = data && typeof data.info === "string" ? data.info : "";
  webtoolsConfigError = data && typeof data.error === "string" ? data.error : "";
  if (!result.ok && !webtoolsConfigError) {
    webtoolsConfigError = result.message ?? "配置转换失败";
  }
  if (!webtoolsConfigInfo) {
    webtoolsConfigInfo = result.ok ? "转换完成" : "转换失败";
  }

  setStatus(result.message ?? (result.ok ? "转换完成" : "转换失败"));
  if (shouldRender) {
    renderList();
    return;
  }
  refreshWebtoolsConfigResultInForm(form);
}

function renderWebtoolsConfigPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel webtools-config-panel";

  const form = document.createElement("form");
  form.className = "settings-form webtools-config-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsConfigConvert(form, { render: false });
  });

  const header = document.createElement("div");
  header.className = "webtools-config-header";
  const headerText = document.createElement("div");
  headerText.className = "webtools-config-header-text";
  const title = document.createElement("h3");
  title.className = "webtools-config-title";
  title.textContent = activePluginPanel?.title || "配置转换";
  const description = document.createElement("p");
  description.className = "webtools-config-subtitle";
  description.textContent =
    activePluginPanel?.subtitle || "YAML / JSON / Properties 双向转换";
  headerText.append(title, description);
  const toolbar = document.createElement("div");
  toolbar.className = "webtools-config-toolbar";
  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "settings-btn settings-btn-secondary";
  clearButton.textContent = "清空";
  clearButton.addEventListener("click", () => {
    if (webtoolsConfigAutoTimer !== null) {
      window.clearTimeout(webtoolsConfigAutoTimer);
      webtoolsConfigAutoTimer = null;
    }
    webtoolsConfigRequestToken += 1;
    webtoolsConfigInput = "";
    webtoolsConfigOutput = "";
    webtoolsConfigInfo = "等待输入待转换内容";
    webtoolsConfigError = "";
    const inputNode = form.elements.namedItem("webtoolsConfigInput");
    if (inputNode instanceof HTMLTextAreaElement) {
      inputNode.value = "";
    }
    refreshWebtoolsConfigResultInForm(form);
    setStatus("已清空配置转换内容");
  });
  toolbar.append(clearButton);
  header.append(headerText, toolbar);

  const bar = document.createElement("div");
  bar.className = "webtools-config-bar";

  const sourceRow = document.createElement("label");
  sourceRow.className = "webtools-config-select-wrap";
  const sourceLabel = document.createElement("span");
  sourceLabel.className = "webtools-config-select-label";
  sourceLabel.textContent = "源格式";
  const sourceSelect = document.createElement("select");
  sourceSelect.className = "settings-number webtools-config-select";
  sourceSelect.name = "webtoolsConfigSource";
  WEBTOOLS_CONFIG_FORMAT_OPTIONS.forEach(({ value, label }) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = webtoolsConfigSource === value;
    sourceSelect.appendChild(option);
  });
  sourceRow.append(sourceLabel, sourceSelect);

  const targetRow = document.createElement("label");
  targetRow.className = "webtools-config-select-wrap";
  const targetLabel = document.createElement("span");
  targetLabel.className = "webtools-config-select-label";
  targetLabel.textContent = "目标格式";
  const targetSelect = document.createElement("select");
  targetSelect.className = "settings-number webtools-config-select";
  targetSelect.name = "webtoolsConfigTarget";
  ["properties", "yaml", "json"].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value.toUpperCase();
    option.selected = webtoolsConfigTarget === value;
    targetSelect.appendChild(option);
  });
  targetRow.append(targetLabel, targetSelect);

  const swapButton = document.createElement("button");
  swapButton.type = "button";
  swapButton.className = "webtools-config-swap";
  swapButton.textContent = "⇅";
  swapButton.addEventListener("click", () => {
    const temp = webtoolsConfigSource;
    webtoolsConfigSource = webtoolsConfigTarget;
    webtoolsConfigTarget = temp;
    sourceSelect.value = webtoolsConfigSource;
    targetSelect.value = webtoolsConfigTarget;
    if (webtoolsConfigOutput.trim() && !webtoolsConfigError) {
      webtoolsConfigInput = webtoolsConfigOutput;
      const inputNode = form.elements.namedItem("webtoolsConfigInput");
      if (inputNode instanceof HTMLTextAreaElement) {
        inputNode.value = webtoolsConfigInput;
      }
    }
    scheduleWebtoolsConfigAutoConvert(form, true);
  });
  bar.append(sourceRow, swapButton, targetRow);

  const editors = document.createElement("div");
  editors.className = "webtools-config-editors";

  const inputRow = document.createElement("div");
  inputRow.className = "webtools-config-editor";
  const inputHead = document.createElement("div");
  inputHead.className = "webtools-config-pane-head";
  const inputLabel = document.createElement("div");
  inputLabel.className = "webtools-config-pane-label";
  inputLabel.dataset.webtoolsConfigInputLabel = "1";
  inputLabel.textContent = "输入";
  const inputMeta = document.createElement("div");
  inputMeta.className = "webtools-config-pane-meta";
  inputMeta.textContent = "输入后自动转换";
  inputHead.append(inputLabel, inputMeta);
  const inputArea = document.createElement("textarea");
  inputArea.className = "settings-value webtools-textarea webtools-config-textarea";
  inputArea.name = "webtoolsConfigInput";
  inputArea.value = webtoolsConfigInput;
  inputArea.placeholder = "输入配置内容";
  inputArea.spellcheck = false;
  const error = document.createElement("div");
  error.className = "webtools-config-error";
  error.hidden = true;
  inputRow.append(inputHead, inputArea, error);

  const outputRow = document.createElement("div");
  outputRow.className = "webtools-config-editor";
  const outputHead = document.createElement("div");
  outputHead.className = "webtools-config-pane-head";
  const outputLabel = document.createElement("div");
  outputLabel.className = "webtools-config-pane-label";
  outputLabel.dataset.webtoolsConfigOutputLabel = "1";
  outputLabel.textContent = "输出";
  const outputActions = document.createElement("div");
  outputActions.className = "webtools-config-pane-actions";
  const outputMeta = document.createElement("div");
  outputMeta.className = "webtools-config-pane-meta";
  outputMeta.textContent = "只读";
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "settings-btn settings-btn-primary webtools-config-copy";
  copyButton.dataset.webtoolsConfigCopy = "1";
  copyButton.textContent = "复制";
  copyButton.hidden = !webtoolsConfigOutput.trim();
  copyButton.addEventListener("click", async () => {
    if (!webtoolsConfigOutput.trim()) {
      setStatus("当前没有可复制内容");
      return;
    }
    const copied = await copyTextToClipboard(webtoolsConfigOutput);
    setStatus(copied ? "已复制配置结果" : "复制配置结果失败");
  });
  outputActions.append(outputMeta, copyButton);
  outputHead.append(outputLabel, outputActions);
  const outputArea = document.createElement("textarea");
  outputArea.className = "settings-value webtools-textarea webtools-config-textarea";
  outputArea.name = "webtoolsConfigOutput";
  outputArea.readOnly = true;
  outputArea.value = webtoolsConfigOutput;
  outputArea.placeholder = "转换结果";
  outputArea.spellcheck = false;
  outputRow.append(outputHead, outputArea);
  editors.append(inputRow, outputRow);

  const info = document.createElement("div");
  info.className = "webtools-config-info";

  [sourceSelect, targetSelect].forEach((node) => {
    node.addEventListener("change", () => {
      scheduleWebtoolsConfigAutoConvert(form, true);
    });
  });
  inputArea.addEventListener("input", () => {
    scheduleWebtoolsConfigAutoConvert(form);
  });

  form.append(header, bar, editors, info);
  panel.append(form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);

  refreshWebtoolsConfigResultInForm(form);
  scheduleWebtoolsConfigAutoConvert(form, true);
}

function normalizeWebtoolsSqlDialect(value: string | undefined): string {
  const normalized = (value ?? "sql").trim().toLowerCase();
  switch (normalized) {
    case "mysql":
    case "postgresql":
    case "sqlite":
    case "tsql":
      return normalized;
    case "sql":
    default:
      return "sql";
  }
}

function normalizeWebtoolsSqlIndent(value: number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 2);
  if (parsed === 1 || parsed === 2 || parsed === 4) {
    return parsed;
  }
  return 2;
}

function applyWebtoolsSqlPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  if (data && typeof data.input === "string") {
    webtoolsSqlInput = data.input;
  }
  if (data && typeof data.dialect === "string") {
    webtoolsSqlDialect = normalizeWebtoolsSqlDialect(data.dialect);
  }
  if (data && typeof data.uppercase === "boolean") {
    webtoolsSqlUppercase = data.uppercase;
  }
  if (data && (typeof data.indent === "number" || typeof data.indent === "string")) {
    webtoolsSqlIndent = normalizeWebtoolsSqlIndent(data.indent);
  }
  webtoolsSqlOutput = data && typeof data.output === "string" ? data.output : "";
  webtoolsSqlInfo = data && typeof data.info === "string" ? data.info : "";
  webtoolsSqlError = data && typeof data.error === "string" ? data.error : "";
  if (!webtoolsSqlInput.trim()) {
    webtoolsSqlInput = WEBTOOLS_SQL_DEFAULT_INPUT;
  }
  if (!webtoolsSqlInfo && !webtoolsSqlError) {
    webtoolsSqlInfo = "输入 SQL 后自动格式化";
  }
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

function refreshWebtoolsSqlResultInForm(form: HTMLFormElement): void {
  const outputNode = form.elements.namedItem("webtoolsSqlOutput");
  if (outputNode instanceof HTMLTextAreaElement) {
    outputNode.value = webtoolsSqlOutput;
  }

  const copyButton = form.querySelector("[data-webtools-sql-copy]");
  if (copyButton instanceof HTMLButtonElement) {
    const hasOutput = Boolean(webtoolsSqlOutput.trim());
    copyButton.hidden = !hasOutput;
    copyButton.disabled = !hasOutput;
  }

  const errorNode = form.querySelector(".webtools-sql-error");
  if (errorNode instanceof HTMLDivElement) {
    errorNode.hidden = !webtoolsSqlError;
    errorNode.textContent = webtoolsSqlError;
  }

  const infoNode = form.querySelector(".webtools-sql-info");
  if (infoNode instanceof HTMLDivElement) {
    let text = webtoolsSqlInfo || "输入 SQL 后自动格式化";
    let state = "idle";
    if (webtoolsSqlError) {
      text = "SQL 格式化失败，请检查语法或方言";
      state = "error";
    } else if (webtoolsSqlOutput.trim()) {
      text = webtoolsSqlInfo || "SQL 格式化完成";
      state = "ok";
    } else if (!webtoolsSqlInput.trim()) {
      text = webtoolsSqlInfo || "等待输入 SQL";
      state = "empty";
    }
    infoNode.textContent = text;
    infoNode.dataset.state = state;
  }
}

function scheduleWebtoolsSqlAutoFormat(
  form: HTMLFormElement,
  immediate = false
): void {
  if (webtoolsSqlAutoTimer !== null) {
    window.clearTimeout(webtoolsSqlAutoTimer);
  }

  webtoolsSqlAutoTimer = window.setTimeout(() => {
    webtoolsSqlAutoTimer = null;
    if (!form.isConnected) {
      return;
    }

    const inputNode = form.elements.namedItem("webtoolsSqlInput");
    const value = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
    if (!value.trim()) {
      webtoolsSqlRequestToken += 1;
      webtoolsSqlInput = "";
      webtoolsSqlOutput = "";
      webtoolsSqlInfo = "等待输入 SQL";
      webtoolsSqlError = "";
      refreshWebtoolsSqlResultInForm(form);
      setStatus("等待输入 SQL");
      return;
    }

    void executeWebtoolsSqlFormat(form, { render: false });
  }, immediate ? 0 : 180);
}

async function executeWebtoolsSqlFormat(
  form: HTMLFormElement,
  options: { render?: boolean } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行 SQL 格式化");
    return;
  }
  const shouldRender = options.render ?? true;

  const inputNode = form.elements.namedItem("webtoolsSqlInput");
  const dialectNode = form.elements.namedItem("webtoolsSqlDialect");
  const uppercaseNode = form.elements.namedItem("webtoolsSqlUppercase");
  const indentNode = form.elements.namedItem("webtoolsSqlIndent");

  webtoolsSqlInput = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
  webtoolsSqlDialect =
    dialectNode instanceof HTMLSelectElement
      ? normalizeWebtoolsSqlDialect(dialectNode.value)
      : "sql";
  webtoolsSqlUppercase =
    uppercaseNode instanceof HTMLInputElement ? uppercaseNode.checked : true;
  webtoolsSqlIndent =
    indentNode instanceof HTMLSelectElement ? normalizeWebtoolsSqlIndent(indentNode.value) : 2;

  if (!webtoolsSqlInput.trim()) {
    webtoolsSqlRequestToken += 1;
    webtoolsSqlOutput = "";
    webtoolsSqlInfo = "等待输入 SQL";
    webtoolsSqlError = "";
    refreshWebtoolsSqlResultInForm(form);
    setStatus("等待输入 SQL");
    return;
  }

  webtoolsSqlError = "";
  const requestToken = ++webtoolsSqlRequestToken;

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_SQL_PLUGIN_ID}:format`,
    type: "command",
    title: "SQL 格式化",
    subtitle: "面板执行",
    target: buildWebtoolsSqlTarget(),
    keywords: ["plugin", "sql", "format", "格式化"]
  };

  const result = await launcher.execute(item);
  if (requestToken !== webtoolsSqlRequestToken) {
    return;
  }
  const data = toRecord(result.data);

  webtoolsSqlOutput = data && typeof data.output === "string" ? data.output : "";
  webtoolsSqlInfo = data && typeof data.info === "string" ? data.info : "";
  webtoolsSqlError = data && typeof data.error === "string" ? data.error : "";
  if (!result.ok && !webtoolsSqlError) {
    webtoolsSqlError = result.message ?? "SQL 格式化失败";
  }
  if (!webtoolsSqlInfo) {
    webtoolsSqlInfo = result.ok ? "SQL 格式化完成" : "格式化失败";
  }

  setStatus(result.message ?? (result.ok ? "格式化完成" : "格式化失败"));
  if (shouldRender) {
    renderList();
    return;
  }
  refreshWebtoolsSqlResultInForm(form);
}

function renderWebtoolsSqlPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel webtools-sql-panel";

  const form = document.createElement("form");
  form.className = "settings-form webtools-sql-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsSqlFormat(form);
  });

  const header = document.createElement("div");
  header.className = "webtools-sql-header";
  const title = document.createElement("h3");
  title.className = "webtools-sql-title";
  title.textContent = activePluginPanel?.title || "SQL 格式化";
  const description = document.createElement("p");
  description.className = "webtools-sql-subtitle";
  description.textContent =
    activePluginPanel?.subtitle || "整理 SQL 语句排版与关键字样式";
  header.append(title, description);

  const bar = document.createElement("div");
  bar.className = "webtools-sql-config";
  const dialectGroup = document.createElement("label");
  dialectGroup.className = "webtools-sql-config-item";
  const dialectLabel = document.createElement("span");
  dialectLabel.className = "webtools-sql-config-label";
  dialectLabel.textContent = "方言";
  const dialectSelect = document.createElement("select");
  dialectSelect.className = "settings-value webtools-sql-config-select";
  dialectSelect.name = "webtoolsSqlDialect";
  WEBTOOLS_SQL_DIALECT_OPTIONS.forEach(({ value, label }) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = webtoolsSqlDialect === value;
    dialectSelect.appendChild(option);
  });
  dialectGroup.append(dialectLabel, dialectSelect);

  const indentGroup = document.createElement("label");
  indentGroup.className = "webtools-sql-config-item";
  const indentLabel = document.createElement("span");
  indentLabel.className = "webtools-sql-config-label";
  indentLabel.textContent = "缩进";
  const indentInput = document.createElement("select");
  indentInput.className = "settings-value webtools-sql-config-select";
  indentInput.name = "webtoolsSqlIndent";
  WEBTOOLS_SQL_INDENT_OPTIONS.forEach(({ value, label }) => {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = label;
    option.selected = webtoolsSqlIndent === value;
    indentInput.appendChild(option);
  });
  const uppercaseWrap = document.createElement("label");
  uppercaseWrap.className = "webtools-sql-config-toggle";
  const uppercaseInput = document.createElement("input");
  uppercaseInput.type = "checkbox";
  uppercaseInput.className = "password-checkbox";
  uppercaseInput.name = "webtoolsSqlUppercase";
  uppercaseInput.checked = webtoolsSqlUppercase;
  const uppercaseText = document.createElement("span");
  uppercaseText.textContent = "关键字大写";
  uppercaseWrap.append(uppercaseInput, uppercaseText);
  indentGroup.append(indentLabel, indentInput);
  bar.append(dialectGroup, indentGroup, uppercaseWrap);

  const editors = document.createElement("div");
  editors.className = "webtools-sql-editors";

  const inputPane = document.createElement("div");
  inputPane.className = "webtools-sql-pane";
  const inputHead = document.createElement("div");
  inputHead.className = "webtools-sql-pane-header";
  const inputTitle = document.createElement("span");
  inputTitle.className = "webtools-sql-pane-label";
  inputTitle.textContent = "输入 SQL";
  const inputActions = document.createElement("div");
  inputActions.className = "webtools-sql-pane-actions";
  const inputMeta = document.createElement("span");
  inputMeta.className = "webtools-sql-pane-meta";
  inputMeta.textContent = "输入后自动格式化";
  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "settings-btn settings-btn-secondary webtools-sql-inline-action";
  clearButton.textContent = "清空";
  clearButton.addEventListener("click", () => {
    if (webtoolsSqlAutoTimer !== null) {
      window.clearTimeout(webtoolsSqlAutoTimer);
      webtoolsSqlAutoTimer = null;
    }
    webtoolsSqlRequestToken += 1;
    webtoolsSqlInput = "";
    webtoolsSqlOutput = "";
    webtoolsSqlInfo = "等待输入 SQL";
    webtoolsSqlError = "";
    inputArea.value = "";
    refreshWebtoolsSqlResultInForm(form);
    setStatus("已清空 SQL 输入");
    inputArea.focus();
  });
  inputActions.append(inputMeta, clearButton);
  inputHead.append(inputTitle, inputActions);
  const inputArea = document.createElement("textarea");
  inputArea.className = "settings-value webtools-textarea webtools-sql-input";
  inputArea.name = "webtoolsSqlInput";
  inputArea.value = webtoolsSqlInput;
  inputArea.placeholder = "输入 SQL";
  inputArea.spellcheck = false;
  const error = document.createElement("div");
  error.className = "webtools-sql-error";
  error.hidden = true;
  inputPane.append(inputHead, inputArea, error);

  const outputPane = document.createElement("div");
  outputPane.className = "webtools-sql-pane";
  const outputHead = document.createElement("div");
  outputHead.className = "webtools-sql-pane-header";
  const outputTitle = document.createElement("span");
  outputTitle.className = "webtools-sql-pane-label";
  outputTitle.textContent = "格式化结果";
  const outputActions = document.createElement("div");
  outputActions.className = "webtools-sql-pane-actions";
  const outputMeta = document.createElement("span");
  outputMeta.className = "webtools-sql-pane-meta";
  outputMeta.textContent = "只读";
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "settings-btn settings-btn-primary webtools-sql-inline-action";
  copyButton.textContent = "复制";
  copyButton.dataset.webtoolsSqlCopy = "1";
  copyButton.hidden = !webtoolsSqlOutput.trim();
  copyButton.addEventListener("click", async () => {
    if (!webtoolsSqlOutput.trim()) {
      setStatus("暂无可复制的 SQL 结果");
      return;
    }
    await navigator.clipboard.writeText(webtoolsSqlOutput);
    setStatus("已复制格式化结果");
  });
  outputActions.append(outputMeta, copyButton);
  outputHead.append(outputTitle, outputActions);
  const outputArea = document.createElement("textarea");
  outputArea.className = "settings-value webtools-textarea webtools-sql-output";
  outputArea.readOnly = true;
  outputArea.name = "webtoolsSqlOutput";
  outputArea.value = webtoolsSqlOutput;
  outputArea.placeholder = "格式化后输出";
  outputArea.spellcheck = false;
  outputPane.append(outputHead, outputArea);
  editors.append(inputPane, outputPane);

  const info = document.createElement("div");
  info.className = "webtools-tool-info webtools-sql-info";

  [dialectSelect, indentInput, uppercaseInput].forEach((node) => {
    node.addEventListener("change", () => {
      scheduleWebtoolsSqlAutoFormat(form, true);
    });
  });
  inputArea.addEventListener("input", () => {
    scheduleWebtoolsSqlAutoFormat(form);
  });

  form.append(header, bar, editors, info);
  panel.append(form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);

  refreshWebtoolsSqlResultInForm(form);
  scheduleWebtoolsSqlAutoFormat(form, true);
}

function normalizeWebtoolsUnitNumber(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return value;
}

function updateWebtoolsUnitStorageFrom(
  sourceUnit: WebtoolsUnitStorageKey,
  rawValue: number
): void {
  const normalizedValue = normalizeWebtoolsUnitNumber(rawValue, 0);
  const bytes = normalizedValue * WEBTOOLS_UNIT_STORAGE_FACTORS[sourceUnit];
  webtoolsUnitStorageValue = normalizedValue;
  webtoolsUnitStorageUnit = sourceUnit;

  (Object.keys(WEBTOOLS_UNIT_STORAGE_FACTORS) as WebtoolsUnitStorageKey[]).forEach((unit) => {
    webtoolsUnitStorageValues[unit] = Number(
      (bytes / WEBTOOLS_UNIT_STORAGE_FACTORS[unit]).toFixed(8)
    );
  });
}

function updateWebtoolsUnitFromPixel(pixelValue: number, basePxValue: number): void {
  webtoolsUnitPixel = normalizeWebtoolsUnitNumber(pixelValue, 160);
  webtoolsUnitBasePx = Math.max(1, normalizeWebtoolsUnitNumber(basePxValue, 16));
  webtoolsUnitRem = Number((webtoolsUnitPixel / webtoolsUnitBasePx).toFixed(4));
}

function updateWebtoolsUnitFromRem(remValue: number, basePxValue: number): void {
  webtoolsUnitRem = normalizeWebtoolsUnitNumber(remValue, 10);
  webtoolsUnitBasePx = Math.max(1, normalizeWebtoolsUnitNumber(basePxValue, 16));
  webtoolsUnitPixel = Number((webtoolsUnitRem * webtoolsUnitBasePx).toFixed(2));
}

function formatWebtoolsUnitStorageValue(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  if (value === 0) {
    return "0";
  }

  const abs = Math.abs(value);
  const maxFractionDigits = abs >= 1 ? 8 : 12;
  return value.toLocaleString("en-US", {
    useGrouping: false,
    maximumFractionDigits: maxFractionDigits
  });
}

function refreshWebtoolsUnitStorageInputs(form: HTMLFormElement): void {
  form.querySelectorAll<HTMLInputElement>("[data-unit-storage]").forEach((input) => {
    const unit = input.dataset.unitStorage as WebtoolsUnitStorageKey | undefined;
    if (!unit) {
      return;
    }
    input.value = formatWebtoolsUnitStorageValue(webtoolsUnitStorageValues[unit]);
  });
}

function refreshWebtoolsUnitScreenInputs(form: HTMLFormElement): void {
  const pixelNode = form.elements.namedItem("webtoolsUnitPixel");
  if (pixelNode instanceof HTMLInputElement) {
    pixelNode.value = Number(webtoolsUnitPixel.toFixed(4)).toString();
  }

  const remNode = form.elements.namedItem("webtoolsUnitRem");
  if (remNode instanceof HTMLInputElement) {
    remNode.value = Number(webtoolsUnitRem.toFixed(4)).toString();
  }

  const baseNode = form.elements.namedItem("webtoolsUnitBasePx");
  if (baseNode instanceof HTMLInputElement) {
    baseNode.value = Number(webtoolsUnitBasePx.toFixed(4)).toString();
  }
}

function refreshWebtoolsUnitInfo(form: HTMLFormElement): void {
  const infoNode = form.querySelector<HTMLElement>(".webtools-unit-info");
  if (!infoNode) {
    return;
  }

  infoNode.textContent =
    webtoolsUnitActiveTab === "storage"
      ? `当前基准：${formatWebtoolsUnitStorageValue(webtoolsUnitStorageValue)} ${webtoolsUnitStorageUnit}`
      : `1rem = ${Number(webtoolsUnitBasePx.toFixed(4))}px`;
}

function refreshWebtoolsUnitPanelInForm(form: HTMLFormElement): void {
  refreshWebtoolsUnitStorageInputs(form);
  refreshWebtoolsUnitScreenInputs(form);
  refreshWebtoolsUnitInfo(form);
}

window.__LL_PANEL_DELEGATES__ = {
  applyWebtoolsCryptoPanelPayload,
  renderWebtoolsCryptoPanel,
  applyWebtoolsJwtPanelPayload,
  renderWebtoolsJwtPanel
};

function applyWebtoolsQrcodePanelPayload(panel: ActivePluginPanelState): void {
  panelImplsSafe.applyWebtoolsQrcodePanelPayload(panel);
}

function normalizeWebtoolsQrcodeColor(value: string, fallback: string): string {
  const trimmed = value.trim();
  const matched = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!matched) {
    return fallback;
  }

  const hex = matched[1].toLowerCase();
  if (hex.length === 3) {
    return `#${hex
      .split("")
      .map((char) => `${char}${char}`)
      .join("")}`;
  }

  return `#${hex}`;
}

function buildWebtoolsQrcodeTarget(): string {
  const params = new URLSearchParams();
  params.set("action", "generate");
  params.set("text", webtoolsQrText);
  params.set("size", String(webtoolsQrSize));
  params.set("level", webtoolsQrLevel);
  params.set("darkColor", webtoolsQrDarkColor);
  params.set("lightColor", webtoolsQrLightColor);
  params.set("logoMode", webtoolsQrLogoMode);
  params.set("logoText", webtoolsQrLogoText);
  params.set("logoImageDataUrl", webtoolsQrLogoImageDataUrl);
  return `command:plugin:${WEBTOOLS_QRCODE_PLUGIN_ID}?${params.toString()}`;
}

async function executeWebtoolsQrcodeGenerate(form: HTMLFormElement): Promise<void> {
  await executeWebtoolsQrcodeGenerateInForm(form);
}

function readWebtoolsQrcodeFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => {
      reject(new Error("读取 Logo 图片失败"));
    };
    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result.startsWith("data:image/")) {
        resolve(reader.result);
        return;
      }
      reject(new Error("Logo 图片格式无效"));
    };
    reader.readAsDataURL(file);
  });
}

function loadWebtoolsQrcodeImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("加载图片失败"));
    image.src = src;
  });
}

async function normalizeWebtoolsQrcodeLogoImage(
  file: File
): Promise<{ dataUrl: string; name: string }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("请选择图片文件作为 Logo");
  }

  const rawDataUrl = await readWebtoolsQrcodeFileAsDataUrl(file);
  const image = await loadWebtoolsQrcodeImage(rawDataUrl);
  const longestSide = Math.max(image.naturalWidth || 0, image.naturalHeight || 0);
  const limit = 256;
  const scale = longestSide > limit ? limit / longestSide : 1;
  const width = Math.max(1, Math.round((image.naturalWidth || 1) * scale));
  const height = Math.max(1, Math.round((image.naturalHeight || 1) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("浏览器画布不可用，无法处理 Logo");
  }

  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return {
    dataUrl: canvas.toDataURL("image/png"),
    name: file.name
  };
}

async function downloadWebtoolsQrcodePng(): Promise<void> {
  if (!webtoolsQrUrl) {
    throw new Error("当前没有可下载的二维码");
  }

  const image = await loadWebtoolsQrcodeImage(webtoolsQrUrl);
  const size = Math.max(100, Math.round(webtoolsQrSize) || 300);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("浏览器画布不可用，无法导出 PNG");
  }

  context.clearRect(0, 0, size, size);
  context.drawImage(image, 0, 0, size, size);
  const downloadUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "qrcode.png";
  link.click();
}

function refreshWebtoolsQrcodePanelInForm(form: HTMLFormElement): void {
  const previewHost = form.querySelector("[data-webtools-qrcode-preview]");
  if (previewHost instanceof HTMLDivElement) {
    previewHost.textContent = "";
    const box = document.createElement("div");
    box.className = "webtools-qrcode-preview-box";
    if (webtoolsQrUrl) {
      const image = document.createElement("img");
      image.className = "webtools-qrcode-preview-image";
      image.src = webtoolsQrUrl;
      image.alt = "qrcode";
      box.appendChild(image);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "webtools-qrcode-placeholder";
      placeholder.textContent = "输入二维码内容后自动生成";
      box.appendChild(placeholder);
    }
    previewHost.appendChild(box);
  }

  const infoNode = form.querySelector(".webtools-qrcode-info");
  if (infoNode instanceof HTMLDivElement) {
    infoNode.textContent = webtoolsQrInfo || "输入后自动生成";
  }

  const darkColorValueNode = form.querySelector<HTMLElement>("[data-webtools-qrcode-dark-value]");
  if (darkColorValueNode) {
    darkColorValueNode.textContent = webtoolsQrDarkColor;
  }

  const lightColorValueNode = form.querySelector<HTMLElement>("[data-webtools-qrcode-light-value]");
  if (lightColorValueNode) {
    lightColorValueNode.textContent = webtoolsQrLightColor;
  }

  const downloadButton =
    form.querySelector<HTMLButtonElement>("[data-webtools-qrcode-download]");
  if (downloadButton) {
    downloadButton.disabled = !webtoolsQrUrl;
  }

  const logoMetaNode = form.querySelector<HTMLElement>("[data-webtools-qrcode-logo-meta]");
  if (logoMetaNode) {
    if (webtoolsQrLogoMode === "text" && webtoolsQrLogoText.trim()) {
      logoMetaNode.textContent = `当前：文字 Logo（${webtoolsQrLogoText.trim()}）`;
    } else if (webtoolsQrLogoMode === "image" && webtoolsQrLogoImageDataUrl) {
      logoMetaNode.textContent = `当前：图片 Logo${webtoolsQrLogoImageName ? `（${webtoolsQrLogoImageName}）` : ""}`;
    } else {
      logoMetaNode.textContent = "当前：无 Logo";
    }
  }

  const logoTextField = form.querySelector<HTMLElement>("[data-webtools-qrcode-logo-text-field]");
  if (logoTextField) {
    logoTextField.hidden = webtoolsQrLogoMode !== "text";
  }

  const logoImageField = form.querySelector<HTMLElement>("[data-webtools-qrcode-logo-image-field]");
  if (logoImageField) {
    logoImageField.hidden = webtoolsQrLogoMode !== "image";
  }

  const logoImageNameNode = form.querySelector<HTMLElement>("[data-webtools-qrcode-logo-image-name]");
  if (logoImageNameNode) {
    logoImageNameNode.textContent = webtoolsQrLogoImageName || "未选择图片";
  }

  const clearLogoButton =
    form.querySelector<HTMLButtonElement>("[data-webtools-qrcode-clear-logo]");
  if (clearLogoButton) {
    const hasLogo =
      (webtoolsQrLogoMode === "text" && webtoolsQrLogoText.trim().length > 0) ||
      (webtoolsQrLogoMode === "image" && webtoolsQrLogoImageDataUrl.length > 0);
    clearLogoButton.hidden = !hasLogo;
  }
}

function scheduleWebtoolsQrcodeAutoGenerate(
  form: HTMLFormElement,
  immediate = false
): void {
  if (webtoolsQrAutoTimer !== null) {
    window.clearTimeout(webtoolsQrAutoTimer);
  }

  webtoolsQrAutoTimer = window.setTimeout(() => {
    webtoolsQrAutoTimer = null;
    if (!form.isConnected) {
      return;
    }
    void executeWebtoolsQrcodeGenerateInForm(form, { render: false });
  }, immediate ? 0 : 180);
}

async function executeWebtoolsQrcodeGenerateInForm(
  form: HTMLFormElement,
  options: { render?: boolean } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行二维码工具");
    return;
  }
  const shouldRender = options.render ?? true;

  const textNode = form.elements.namedItem("webtoolsQrText");
  const sizeNode = form.elements.namedItem("webtoolsQrSize");
  const levelNode = form.elements.namedItem("webtoolsQrLevel");
  const darkColorNode = form.elements.namedItem("webtoolsQrDarkColor");
  const lightColorNode = form.elements.namedItem("webtoolsQrLightColor");
  const logoModeNode = form.elements.namedItem("webtoolsQrLogoMode");
  const logoTextNode = form.elements.namedItem("webtoolsQrLogoText");

  webtoolsQrText = textNode instanceof HTMLTextAreaElement ? textNode.value : "";
  webtoolsQrSize = sizeNode instanceof HTMLInputElement ? Number(sizeNode.value) : 300;
  webtoolsQrLevel = levelNode instanceof HTMLSelectElement ? levelNode.value : "M";
  webtoolsQrDarkColor =
    darkColorNode instanceof HTMLInputElement
      ? normalizeWebtoolsQrcodeColor(darkColorNode.value, "#102136")
      : "#102136";
  webtoolsQrLightColor =
    lightColorNode instanceof HTMLInputElement
      ? normalizeWebtoolsQrcodeColor(lightColorNode.value, "#ffffff")
      : "#ffffff";
  webtoolsQrLogoMode =
    logoModeNode instanceof HTMLSelectElement &&
    (logoModeNode.value === "text" || logoModeNode.value === "image")
      ? logoModeNode.value
      : "none";
  webtoolsQrLogoText =
    logoTextNode instanceof HTMLInputElement ? logoTextNode.value.trim().slice(0, 6) : "";

  if (!webtoolsQrText.trim()) {
    webtoolsQrRequestToken += 1;
    webtoolsQrUrl = "";
    webtoolsQrInfo = "等待输入二维码内容";
    refreshWebtoolsQrcodePanelInForm(form);
    setStatus("等待输入二维码内容");
    return;
  }

  const requestToken = ++webtoolsQrRequestToken;

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_QRCODE_PLUGIN_ID}:generate`,
    type: "command",
    title: "二维码生成",
    subtitle: "面板执行",
    target: buildWebtoolsQrcodeTarget(),
    keywords: ["plugin", "qrcode", "qr", "二维码", "生成"]
  };

  const result = await launcher.execute(item);
  if (requestToken !== webtoolsQrRequestToken) {
    return;
  }
  const data = toRecord(result.data);
  webtoolsQrUrl = data && typeof data.qrUrl === "string" ? data.qrUrl : "";
  webtoolsQrInfo = data && typeof data.info === "string" ? data.info : "";
  webtoolsQrDarkColor =
    data && typeof data.darkColor === "string"
      ? normalizeWebtoolsQrcodeColor(data.darkColor, webtoolsQrDarkColor)
      : webtoolsQrDarkColor;
  webtoolsQrLightColor =
    data && typeof data.lightColor === "string"
      ? normalizeWebtoolsQrcodeColor(data.lightColor, webtoolsQrLightColor)
      : webtoolsQrLightColor;

  setStatus(result.message ?? (result.ok ? "生成完成" : "生成失败"));
  if (shouldRender) {
    renderList();
    return;
  }
  refreshWebtoolsQrcodePanelInForm(form);
}

function renderWebtoolsQrcodePanel(): void {
  panelImplsSafe.renderWebtoolsQrcodePanel();
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

function refreshWebtoolsMarkdownPanelInForm(form: HTMLFormElement): void {
  const previewNode = form.querySelector("[data-webtools-markdown-preview]");
  if (previewNode instanceof HTMLDivElement) {
    if (webtoolsMarkdownHtml.trim()) {
      previewNode.innerHTML = webtoolsMarkdownHtml;
      previewNode.dataset.state = "ok";
    } else {
      previewNode.textContent = "输入 Markdown 后自动预览";
      previewNode.dataset.state = "empty";
    }
  }

  const htmlNode = form.elements.namedItem("webtoolsMarkdownHtml");
  if (htmlNode instanceof HTMLTextAreaElement) {
    htmlNode.value = webtoolsMarkdownHtml;
  }

  const copyButton = form.querySelector("[data-webtools-markdown-copy]");
  if (copyButton instanceof HTMLButtonElement) {
    const hasHtml = Boolean(webtoolsMarkdownHtml.trim());
    copyButton.hidden = !hasHtml;
    copyButton.disabled = !hasHtml;
  }

  const infoNode = form.querySelector(".webtools-markdown-info");
  if (infoNode instanceof HTMLDivElement) {
    let text = webtoolsMarkdownInfo || "输入 Markdown 后自动预览";
    let state = "idle";
    if (!webtoolsMarkdownInput.trim()) {
      text = "等待输入 Markdown";
      state = "empty";
    } else if (webtoolsMarkdownHtml.trim()) {
      text = webtoolsMarkdownInfo || "预览已更新";
      state = "ok";
    }
    infoNode.textContent = text;
    infoNode.dataset.state = state;
  }
}

function scheduleWebtoolsMarkdownAutoRender(
  form: HTMLFormElement,
  immediate = false
): void {
  if (webtoolsMarkdownAutoTimer !== null) {
    window.clearTimeout(webtoolsMarkdownAutoTimer);
  }

  webtoolsMarkdownAutoTimer = window.setTimeout(() => {
    webtoolsMarkdownAutoTimer = null;
    if (!form.isConnected) {
      return;
    }

    const inputNode = form.elements.namedItem("webtoolsMarkdownInput");
    const inputValue = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
    if (!inputValue.trim()) {
      webtoolsMarkdownRequestToken += 1;
      webtoolsMarkdownInput = "";
      webtoolsMarkdownHtml = "";
      webtoolsMarkdownInfo = "等待输入 Markdown";
      refreshWebtoolsMarkdownPanelInForm(form);
      setStatus("等待输入 Markdown");
      return;
    }

    void executeWebtoolsMarkdownRender(form, { render: false });
  }, immediate ? 0 : 180);
}

async function executeWebtoolsMarkdownRender(
  form: HTMLFormElement,
  options: { render?: boolean } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行 Markdown 工具");
    return;
  }
  const shouldRender = options.render ?? true;

  const inputNode = form.elements.namedItem("webtoolsMarkdownInput");
  webtoolsMarkdownInput =
    inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";

  if (!webtoolsMarkdownInput.trim()) {
    webtoolsMarkdownRequestToken += 1;
    webtoolsMarkdownHtml = "";
    webtoolsMarkdownInfo = "等待输入 Markdown";
    refreshWebtoolsMarkdownPanelInForm(form);
    setStatus("等待输入 Markdown");
    return;
  }

  const requestToken = ++webtoolsMarkdownRequestToken;
  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_MARKDOWN_PLUGIN_ID}:render`,
    type: "command",
    title: "Markdown 预览",
    subtitle: "面板执行",
    target: buildWebtoolsMarkdownTarget(webtoolsMarkdownInput),
    keywords: ["plugin", "markdown", "md", "预览", "html"]
  };

  const result = await launcher.execute(item);
  if (requestToken !== webtoolsMarkdownRequestToken) {
    return;
  }
  const data = toRecord(result.data);
  webtoolsMarkdownHtml = data && typeof data.html === "string" ? data.html : "";
  webtoolsMarkdownInfo = data && typeof data.info === "string" ? data.info : "";

  setStatus(result.message ?? (result.ok ? "渲染完成" : "渲染失败"));
  if (shouldRender) {
    renderList();
    return;
  }
  refreshWebtoolsMarkdownPanelInForm(form);
}

function renderWebtoolsMarkdownPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel webtools-markdown-panel";

  const form = document.createElement("form");
  form.className = "settings-form webtools-markdown-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsMarkdownRender(form);
  });

  const header = document.createElement("div");
  header.className = "webtools-markdown-header";
  const titleGroup = document.createElement("div");
  const title = document.createElement("h3");
  title.className = "webtools-markdown-title";
  title.textContent = activePluginPanel?.title || "Markdown 预览";
  const description = document.createElement("p");
  description.className = "webtools-markdown-description";
  description.textContent =
    activePluginPanel?.subtitle || "Markdown 转 HTML 实时预览";
  titleGroup.append(title, description);

  const toolbar = document.createElement("div");
  toolbar.className = "webtools-markdown-toolbar";
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "settings-btn settings-btn-secondary";
  copyButton.dataset.webtoolsMarkdownCopy = "1";
  copyButton.textContent = "复制 HTML";
  copyButton.addEventListener("click", async () => {
    const copied = await copyTextToClipboard(webtoolsMarkdownHtml);
    setStatus(copied ? "已复制 HTML" : "复制 HTML 失败");
  });
  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "settings-btn settings-btn-secondary";
  clearButton.textContent = "清空";
  clearButton.addEventListener("click", () => {
    if (webtoolsMarkdownAutoTimer !== null) {
      window.clearTimeout(webtoolsMarkdownAutoTimer);
      webtoolsMarkdownAutoTimer = null;
    }
    webtoolsMarkdownRequestToken += 1;
    webtoolsMarkdownInput = "";
    webtoolsMarkdownHtml = "";
    webtoolsMarkdownInfo = "等待输入 Markdown";
    const node = form.elements.namedItem("webtoolsMarkdownInput");
    if (node instanceof HTMLTextAreaElement) {
      node.value = "";
      node.focus();
    }
    refreshWebtoolsMarkdownPanelInForm(form);
    setStatus("已清空 Markdown 内容");
  });
  toolbar.append(copyButton, clearButton);
  header.append(titleGroup, toolbar);

  const layout = document.createElement("div");
  layout.className = "webtools-markdown-layout";

  const editorPane = document.createElement("div");
  editorPane.className = "webtools-markdown-pane";
  const editorHead = document.createElement("div");
  editorHead.className = "webtools-markdown-pane-head";
  editorHead.textContent = "Markdown 输入";
  const inputArea = document.createElement("textarea");
  inputArea.className = "settings-value webtools-textarea webtools-markdown-editor";
  inputArea.name = "webtoolsMarkdownInput";
  inputArea.value = webtoolsMarkdownInput;
  inputArea.placeholder = "输入 Markdown";
  inputArea.spellcheck = false;
  inputArea.addEventListener("input", () => {
    webtoolsMarkdownInput = inputArea.value;
    scheduleWebtoolsMarkdownAutoRender(form);
  });
  editorPane.append(editorHead, inputArea);

  const previewPane = document.createElement("div");
  previewPane.className = "webtools-markdown-pane";
  const previewHead = document.createElement("div");
  previewHead.className = "webtools-markdown-pane-head";
  previewHead.textContent = "实时预览";
  const previewBody = document.createElement("div");
  previewBody.className = "webtools-markdown-preview-body";
  previewBody.dataset.webtoolsMarkdownPreview = "1";
  previewPane.append(previewHead, previewBody);

  layout.append(editorPane, previewPane);

  const htmlBlock = document.createElement("div");
  htmlBlock.className = "webtools-markdown-html-block";
  const htmlHead = document.createElement("div");
  htmlHead.className = "webtools-markdown-html-head";
  htmlHead.textContent = "HTML 输出";
  const htmlArea = document.createElement("textarea");
  htmlArea.className = "settings-value webtools-textarea webtools-markdown-html";
  htmlArea.name = "webtoolsMarkdownHtml";
  htmlArea.readOnly = true;
  htmlArea.placeholder = "渲染后 HTML";
  const info = document.createElement("div");
  info.className = "webtools-markdown-info";
  htmlBlock.append(htmlHead, htmlArea, info);

  form.append(header, layout, htmlBlock);
  panel.append(form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);

  refreshWebtoolsMarkdownPanelInForm(form);
  scheduleWebtoolsMarkdownAutoRender(form, true);
}

function applyWebtoolsUaPanelPayload(panel: ActivePluginPanelState): void {
  panelImplsSafe.applyWebtoolsUaPanelPayload(panel);
}

function buildWebtoolsUaTarget(ua: string): string {
  const params = new URLSearchParams();
  params.set("action", "parse");
  params.set("ua", ua);
  return `command:plugin:${WEBTOOLS_UA_PLUGIN_ID}?${params.toString()}`;
}

function refreshWebtoolsUaResultInForm(form: HTMLFormElement): void {
  const copyButton = form.querySelector<HTMLButtonElement>("[data-webtools-ua-copy]");
  if (copyButton) {
    copyButton.disabled = !webtoolsUaInput.trim();
  }

  const infoNode = form.querySelector<HTMLDivElement>(".webtools-ua-info");
  if (infoNode) {
    let text = webtoolsUaInfo || "等待解析结果";
    let state = "idle";
    if (webtoolsUaError) {
      text = webtoolsUaError;
      state = "error";
    } else if (!webtoolsUaInput.trim()) {
      text = "请输入或粘贴 User-Agent";
      state = "empty";
    } else if (Object.keys(webtoolsUaResult).length > 0) {
      text = webtoolsUaInfo || "已自动解析当前 UA";
      state = "ok";
    }
    infoNode.textContent = text;
    infoNode.dataset.state = state;
  }

  const grid = form.querySelector<HTMLDivElement>(".webtools-ua-grid");
  if (!grid) {
    return;
  }
  grid.replaceChildren();

  const fields: Array<{ label: string; value: string; meta?: string }> = [
    {
      label: "浏览器",
      value: [webtoolsUaResult.browser, webtoolsUaResult.browserVersion].filter(Boolean).join(" ") || "-",
      meta: webtoolsUaResult.browserMajor ? `主版本 ${webtoolsUaResult.browserMajor}` : "-"
    },
    {
      label: "系统",
      value: [webtoolsUaResult.os, webtoolsUaResult.osVersion].filter(Boolean).join(" ") || "-"
    },
    {
      label: "设备",
      value:
        [
          webtoolsUaResult.deviceVendor && webtoolsUaResult.deviceVendor !== "-"
            ? webtoolsUaResult.deviceVendor
            : "",
          webtoolsUaResult.deviceModel && webtoolsUaResult.deviceModel !== "-"
            ? webtoolsUaResult.deviceModel
            : ""
        ]
          .filter(Boolean)
          .join(" ") || webtoolsUaResult.device || "-",
      meta: webtoolsUaResult.deviceType || "desktop"
    },
    {
      label: "引擎",
      value: [webtoolsUaResult.engine, webtoolsUaResult.engineVersion].filter(Boolean).join(" ") || "-"
    },
      {
        label: "CPU 架构",
        value: webtoolsUaResult.cpu || "-"
      }
    ];

  fields.forEach(({ label, value, meta }) => {
    const card = document.createElement("div");
    card.className = "webtools-ua-card";
    const labelNode = document.createElement("div");
    labelNode.className = "webtools-ua-card-label";
    labelNode.textContent = label;
    const valueNode = document.createElement("div");
    valueNode.className = "webtools-ua-card-value";
    valueNode.textContent = value || "-";
    card.append(labelNode, valueNode);
    if (meta && meta !== "-") {
      const metaNode = document.createElement("div");
      metaNode.className = "webtools-ua-card-meta";
      metaNode.textContent = meta;
      card.appendChild(metaNode);
    }
    grid.appendChild(card);
  });
}

function scheduleWebtoolsUaAutoParse(
  form: HTMLFormElement,
  immediate = false
): void {
  if (webtoolsUaAutoTimer !== null) {
    window.clearTimeout(webtoolsUaAutoTimer);
  }

  webtoolsUaAutoTimer = window.setTimeout(() => {
    webtoolsUaAutoTimer = null;
    if (!form.isConnected) {
      return;
    }

    const node = form.elements.namedItem("webtoolsUaInput");
    const ua = node instanceof HTMLTextAreaElement ? node.value : "";
    if (!ua.trim()) {
      webtoolsUaRequestToken += 1;
      webtoolsUaInput = "";
      webtoolsUaResult = {};
      webtoolsUaInfo = "";
      webtoolsUaError = "";
      refreshWebtoolsUaResultInForm(form);
      setStatus("请输入 UA 字符串");
      return;
    }

    void executeWebtoolsUaParse(ua, { render: false, form });
  }, immediate ? 0 : 220);
}

async function executeWebtoolsUaParse(
  ua: string,
  options: { render?: boolean; form?: HTMLFormElement } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行 UA 解析");
    return;
  }
  const shouldRender = options.render ?? true;
  const requestToken = ++webtoolsUaRequestToken;

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
  if (requestToken !== webtoolsUaRequestToken) {
    return;
  }
  const data = toRecord(result.data);
  const parsed: Record<string, string> = {};

  [
    "browser",
    "browserVersion",
    "browserMajor",
    "os",
    "osVersion",
    "device",
    "deviceVendor",
    "deviceModel",
    "deviceType",
    "engine",
    "engineVersion",
    "cpu"
  ].forEach((key) => {
    if (data && typeof data[key] === "string") {
      parsed[key] = data[key] as string;
    }
  });

  webtoolsUaResult = parsed;
  webtoolsUaInfo = data && typeof data.info === "string" ? data.info : "";
  webtoolsUaError = data && typeof data.error === "string" ? data.error : "";
  if (!result.ok && !webtoolsUaError) {
    webtoolsUaError = result.message ?? "UA 解析失败";
  }
  setStatus(result.message ?? (result.ok ? "解析完成" : "解析失败"));
  if (shouldRender) {
    renderList();
    return;
  }
  if (options.form) {
    refreshWebtoolsUaResultInForm(options.form);
  }
}

function renderWebtoolsUaPanel(): void {
  panelImplsSafe.renderWebtoolsUaPanel();
}

function applyWebtoolsApiPanelPayload(panel: ActivePluginPanelState): void {
  panelImplsSafe.applyWebtoolsApiPanelPayload(panel);
}

function buildWebtoolsApiTarget(): string {
  const params = new URLSearchParams();
  params.set("action", "request");
  params.set("method", webtoolsApiMethod);
  params.set("url", webtoolsApiUrl);
  params.set("params", JSON.stringify(webtoolsApiParams));
  params.set("headers", JSON.stringify(webtoolsApiHeaders));
  params.set("bodyType", webtoolsApiBodyType);
  params.set("bodyContent", webtoolsApiBodyContent);
  params.set("formRows", JSON.stringify(webtoolsApiFormRows));
  return `command:plugin:${WEBTOOLS_API_PLUGIN_ID}?${params.toString()}`;
}

function getWebtoolsApiRowsByGroup(
  group: "params" | "headers" | "formdata"
): WebtoolsApiKvRow[] {
  if (group === "params") {
    return webtoolsApiParams;
  }
  if (group === "headers") {
    return webtoolsApiHeaders;
  }
  return webtoolsApiFormRows;
}

function setWebtoolsApiRowsByGroup(
  group: "params" | "headers" | "formdata",
  rows: WebtoolsApiKvRow[]
): void {
  if (group === "params") {
    webtoolsApiParams = rows;
    return;
  }
  if (group === "headers") {
    webtoolsApiHeaders = rows;
    return;
  }
  webtoolsApiFormRows = rows;
}

function refreshWebtoolsApiTabs(form: HTMLFormElement): void {
  form.querySelectorAll<HTMLElement>("[data-api-request-tab]").forEach((node) => {
    node.dataset.active = String(node.dataset.apiRequestTab === webtoolsApiRequestTab);
  });
  form.querySelectorAll<HTMLElement>("[data-api-request-panel]").forEach((node) => {
    node.hidden = node.dataset.apiRequestPanel !== webtoolsApiRequestTab;
  });
  form.querySelectorAll<HTMLElement>("[data-api-response-tab]").forEach((node) => {
    node.dataset.active = String(node.dataset.apiResponseTab === webtoolsApiResponseTab);
  });
  form.querySelectorAll<HTMLElement>("[data-api-response-panel]").forEach((node) => {
    node.hidden = node.dataset.apiResponsePanel !== webtoolsApiResponseTab;
  });
}

function refreshWebtoolsApiPreview(form: HTMLFormElement): void {
  const previewNode = form.querySelector<HTMLElement>(".webtools-api-preview");
  if (previewNode) {
    previewNode.textContent = buildWebtoolsApiPreviewUrl() || "-";
  }
}

function refreshWebtoolsApiMethodUi(form: HTMLFormElement): void {
  const methodNode = form.elements.namedItem("webtoolsApiMethod");
  if (methodNode instanceof HTMLSelectElement) {
    methodNode.dataset.method = methodNode.value.trim().toLowerCase();
  }
}

function refreshWebtoolsApiResponseHeadersHost(host: HTMLElement): void {
  host.textContent = "";
  if (Object.keys(webtoolsApiResponseHeaders).length === 0) {
    host.textContent = "暂无响应头";
    return;
  }

  const fragment = document.createDocumentFragment();
  Object.entries(webtoolsApiResponseHeaders).forEach(([key, value]) => {
    const row = document.createElement("div");
    row.className = "webtools-api-header-row";

    const keyNode = document.createElement("span");
    keyNode.className = "webtools-api-header-key";
    keyNode.textContent = `${key}:`;

    const valueNode = document.createElement("span");
    valueNode.className = "webtools-api-header-value";
    valueNode.textContent = value;

    row.append(keyNode, valueNode);
    fragment.appendChild(row);
  });
  host.appendChild(fragment);
}

function refreshWebtoolsApiResponseInForm(form: HTMLFormElement): void {
  refreshWebtoolsApiPreview(form);
  refreshWebtoolsApiTabs(form);
  refreshWebtoolsApiMethodUi(form);

  const sendButton = form.querySelector<HTMLButtonElement>(".webtools-api-send-btn");
  if (sendButton) {
    sendButton.disabled = webtoolsApiIsLoading;
    sendButton.textContent = webtoolsApiIsLoading ? "发送中..." : "发送";
  }

  const copyButton = form.querySelector<HTMLButtonElement>(".webtools-api-copy-btn");
  if (copyButton) {
    const canCopyHeaders =
      webtoolsApiResponseTab === "headers" &&
      Object.keys(webtoolsApiResponseHeaders).length > 0;
    const canCopyBody =
      webtoolsApiResponseTab === "body" && webtoolsApiResponseBody.trim().length > 0;
    copyButton.textContent = webtoolsApiResponseTab === "headers" ? "复制响应头" : "复制响应体";
    copyButton.disabled = !(webtoolsApiHasResponse && (canCopyHeaders || canCopyBody));
  }

  const responseSection = form.querySelector<HTMLElement>(".webtools-api-response-section");
  if (responseSection) {
    responseSection.hidden = !webtoolsApiHasResponse && !webtoolsApiIsLoading;
  }

  const statusNode = form.querySelector<HTMLElement>(".webtools-api-status");
  if (statusNode) {
    statusNode.textContent = webtoolsApiIsLoading
      ? "发送中..."
      : webtoolsApiResponseStatus || "未发送";
    statusNode.dataset.state =
      webtoolsApiIsLoading
        ? "loading"
        : webtoolsApiResponseError
        ? "error"
        : webtoolsApiResponseStatus.startsWith("2")
          ? "ok"
          : webtoolsApiResponseStatus
            ? "warn"
            : "idle";
  }

  const timeNode = form.querySelector<HTMLElement>(".webtools-api-time");
  if (timeNode) {
    timeNode.hidden = webtoolsApiIsLoading || !webtoolsApiHasResponse;
    timeNode.textContent = `${webtoolsApiResponseTimeMs} ms`;
  }

  const sizeNode = form.querySelector<HTMLElement>(".webtools-api-size");
  if (sizeNode) {
    sizeNode.hidden = webtoolsApiIsLoading || !webtoolsApiHasResponse;
    sizeNode.textContent = webtoolsApiResponseSizeText || "0 B";
  }

  const errorNode = form.querySelector<HTMLElement>(".webtools-api-error");
  if (errorNode) {
    errorNode.textContent = webtoolsApiResponseError || "";
    errorNode.hidden = !webtoolsApiResponseError;
  }

  const responseUrlNode = form.querySelector<HTMLElement>(".webtools-api-response-url");
  if (responseUrlNode) {
    responseUrlNode.textContent = webtoolsApiResponseUrl || buildWebtoolsApiPreviewUrl() || "-";
    responseUrlNode.hidden = !webtoolsApiHasResponse && !webtoolsApiIsLoading;
  }

  const responseTabs = form.querySelector<HTMLElement>(".webtools-api-response-tabs");
  if (responseTabs) {
    responseTabs.hidden = !webtoolsApiHasResponse || !!webtoolsApiResponseError;
  }

  const responsePanels = form.querySelector<HTMLElement>(".webtools-api-response-panels");
  if (responsePanels) {
    responsePanels.hidden = !webtoolsApiHasResponse || !!webtoolsApiResponseError;
  }

  const bodyNode = form.querySelector<HTMLElement>(".webtools-api-response-body");
  if (bodyNode) {
    bodyNode.textContent = webtoolsApiIsLoading
      ? "等待响应..."
      : webtoolsApiResponseBody.trim() || "（空响应体）";
  }

  const headersNode = form.querySelector<HTMLElement>(".webtools-api-response-headers-host");
  if (headersNode) {
    refreshWebtoolsApiResponseHeadersHost(headersNode);
  }
}

function createWebtoolsApiRowsEditor(
  form: HTMLFormElement,
  group: "params" | "headers" | "formdata"
): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.className = "webtools-api-kv-list";
  const rows = ensureWebtoolsApiEditableRows(
    cloneWebtoolsApiRows(getWebtoolsApiRowsByGroup(group))
  );
  setWebtoolsApiRowsByGroup(group, rows);

  rows.forEach((row, index) => {
    const rowNode = document.createElement("div");
    rowNode.className = "webtools-api-kv-row";

    const enabled = document.createElement("input");
    enabled.type = "checkbox";
    enabled.checked = row.enabled;
    enabled.className = "password-checkbox";
    enabled.addEventListener("change", () => {
      const target = getWebtoolsApiRowsByGroup(group);
      target[index].enabled = enabled.checked;
      if (group === "params") {
        refreshWebtoolsApiPreview(form);
      }
    });

    const keyInput = document.createElement("input");
    keyInput.className = "settings-value webtools-tool-input";
    keyInput.placeholder = "键";
    keyInput.value = row.key;
    keyInput.addEventListener("input", () => {
      const target = getWebtoolsApiRowsByGroup(group);
      target[index].key = keyInput.value;
      if (group === "params") {
        refreshWebtoolsApiPreview(form);
      }
    });

    const valueInput = document.createElement("input");
    valueInput.className = "settings-value webtools-tool-input";
    valueInput.placeholder = "值";
    valueInput.value = row.value;
    valueInput.addEventListener("input", () => {
      const target = getWebtoolsApiRowsByGroup(group);
      target[index].value = valueInput.value;
      if (group === "params") {
        refreshWebtoolsApiPreview(form);
      }
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "settings-btn settings-btn-secondary webtools-api-row-btn";
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => {
      const next = ensureWebtoolsApiEditableRows(
        getWebtoolsApiRowsByGroup(group).filter((_, rowIndex) => rowIndex !== index)
      );
      setWebtoolsApiRowsByGroup(group, next);
      renderList();
    });

    rowNode.append(enabled, keyInput, valueInput, removeButton);
    wrap.appendChild(rowNode);
  });

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "settings-btn settings-btn-secondary webtools-api-add-btn";
  addButton.textContent = "+ 添加一行";
  addButton.addEventListener("click", () => {
    const next = [...getWebtoolsApiRowsByGroup(group), { key: "", value: "", enabled: true }];
    setWebtoolsApiRowsByGroup(group, next);
    renderList();
  });
  wrap.appendChild(addButton);

  return wrap;
}

async function executeWebtoolsApiRequest(
  form: HTMLFormElement,
  options: { render?: boolean } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行 API 调试");
    return;
  }
  const shouldRender = options.render ?? true;
  const requestToken = ++webtoolsApiRequestToken;

  const methodNode = form.elements.namedItem("webtoolsApiMethod");
  const urlNode = form.elements.namedItem("webtoolsApiUrl");
  const bodyTypeNode = form.elements.namedItem("webtoolsApiBodyType");
  const bodyNode = form.elements.namedItem("webtoolsApiBody");

  webtoolsApiMethod = methodNode instanceof HTMLSelectElement ? methodNode.value : "GET";
  webtoolsApiUrl = urlNode instanceof HTMLInputElement ? urlNode.value : "";
  webtoolsApiBodyType =
    bodyTypeNode instanceof HTMLSelectElement || bodyTypeNode instanceof HTMLInputElement
      ? (bodyTypeNode.value as "json" | "text" | "formdata")
      : "json";
  webtoolsApiBodyContent =
    bodyNode instanceof HTMLTextAreaElement ? bodyNode.value : "";
  syncWebtoolsApiContentTypeHeader();
  webtoolsApiIsLoading = true;
  webtoolsApiResponseError = "";
  webtoolsApiHasResponse = false;
  refreshWebtoolsApiResponseInForm(form);

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_API_PLUGIN_ID}:request`,
    type: "command",
    title: "API 调试",
    subtitle: "面板执行",
    target: buildWebtoolsApiTarget(),
    keywords: ["plugin", "api", "http", "request", "调试"]
  };

  const result = await launcher.execute(item);
  if (requestToken !== webtoolsApiRequestToken) {
    return;
  }
  const data = toRecord(result.data);
  webtoolsApiIsLoading = false;

  const status = data && typeof data.status === "number" ? data.status : 0;
  const statusText =
    data && typeof data.statusText === "string" ? data.statusText : "";
  webtoolsApiResponseStatus = status ? `${status} ${statusText}` : "请求失败";

  webtoolsApiResponseTimeMs = data && typeof data.timeMs === "number" ? data.timeMs : 0;
  webtoolsApiResponseSizeText =
    data && typeof data.sizeText === "string" ? data.sizeText : "0 B";
  webtoolsApiResponseUrl = data && typeof data.fullUrl === "string" ? data.fullUrl : "";
  webtoolsApiResponseError = status > 0 ? "" : result.message ?? "请求失败";
  webtoolsApiHasResponse =
    Boolean(webtoolsApiResponseStatus) ||
    Boolean(webtoolsApiResponseError) ||
    Boolean(webtoolsApiResponseBody) ||
    Object.keys(webtoolsApiResponseHeaders).length > 0;

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
  if (shouldRender) {
    renderList();
    return;
  }
  refreshWebtoolsApiResponseInForm(form);
}

function renderWebtoolsApiPanel(): void {
  panelImplsSafe.renderWebtoolsApiPanel();
}

function normalizeWebtoolsHttpMockMethod(value: string): WebtoolsHttpMockMethod {
  const normalized = value.trim().toUpperCase();
  if (
    normalized === "GET" ||
    normalized === "POST" ||
    normalized === "PUT" ||
    normalized === "PATCH" ||
    normalized === "DELETE" ||
    normalized === "OPTIONS"
  ) {
    return normalized;
  }
  return "GET";
}

function normalizeWebtoolsHttpMockPath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "/mock";
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function applyWebtoolsHttpMockPanelPayload(panel: ActivePluginPanelState): void {
  panelImplsSafe.applyWebtoolsHttpMockPanelPayload(panel);
}

function buildWebtoolsHttpMockTarget(action: "open" | "start" | "stop" | "status"): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("port", String(webtoolsHttpMockPort));
  params.set("path", webtoolsHttpMockPath);
  params.set("method", webtoolsHttpMockMethod);
  params.set("statusCode", String(webtoolsHttpMockStatusCode));
  params.set("contentType", webtoolsHttpMockContentType);
  params.set("body", webtoolsHttpMockBody);
  return `command:plugin:${WEBTOOLS_HTTP_MOCK_PLUGIN_ID}?${params.toString()}`;
}

function refreshWebtoolsHttpMockPanelInForm(form: HTMLFormElement): void {
  const methodNode = form.elements.namedItem("webtoolsHttpMockMethod");
  if (methodNode instanceof HTMLSelectElement) {
    methodNode.value = webtoolsHttpMockMethod;
  }
  const portNode = form.elements.namedItem("webtoolsHttpMockPort");
  if (portNode instanceof HTMLInputElement) {
    portNode.value = String(webtoolsHttpMockPort);
  }
  const pathNode = form.elements.namedItem("webtoolsHttpMockPath");
  if (pathNode instanceof HTMLInputElement) {
    pathNode.value = webtoolsHttpMockPath;
  }
  const statusNode = form.elements.namedItem("webtoolsHttpMockStatusCode");
  if (statusNode instanceof HTMLInputElement) {
    statusNode.value = String(webtoolsHttpMockStatusCode);
  }
  const contentTypeNode = form.elements.namedItem("webtoolsHttpMockContentType");
  if (contentTypeNode instanceof HTMLInputElement) {
    contentTypeNode.value = webtoolsHttpMockContentType;
  }
  const bodyNode = form.elements.namedItem("webtoolsHttpMockBody");
  if (bodyNode instanceof HTMLTextAreaElement) {
    bodyNode.value = webtoolsHttpMockBody;
  }

  const runtimeNode = form.querySelector<HTMLElement>(".webtools-http-mock-runtime");
  if (runtimeNode) {
    runtimeNode.textContent = webtoolsHttpMockRunning
      ? `运行中：${webtoolsHttpMockMethod} ${webtoolsHttpMockUrl || `http://127.0.0.1:${webtoolsHttpMockPort}${webtoolsHttpMockPath}`}`
      : "当前未启动";
    runtimeNode.dataset.state = webtoolsHttpMockRunning ? "ok" : "idle";
  }

  const countNode = form.querySelector<HTMLElement>(".webtools-http-mock-count");
  if (countNode) {
    countNode.textContent = `请求次数：${webtoolsHttpMockRequestCount}`;
  }

  const infoNode = form.querySelector<HTMLElement>(".webtools-http-mock-info");
  if (infoNode) {
    const text = webtoolsHttpMockError || webtoolsHttpMockInfo || "可配置后启动本地 Mock";
    infoNode.textContent = text;
    infoNode.dataset.state = webtoolsHttpMockError
      ? "error"
      : webtoolsHttpMockRunning
        ? "ok"
        : "idle";
  }
}

async function executeWebtoolsHttpMockAction(
  action: "start" | "stop" | "status",
  form?: HTMLFormElement
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行 HTTP Mock");
    return;
  }

  if (form) {
    const methodNode = form.elements.namedItem("webtoolsHttpMockMethod");
    const portNode = form.elements.namedItem("webtoolsHttpMockPort");
    const pathNode = form.elements.namedItem("webtoolsHttpMockPath");
    const statusNode = form.elements.namedItem("webtoolsHttpMockStatusCode");
    const contentTypeNode = form.elements.namedItem("webtoolsHttpMockContentType");
    const bodyNode = form.elements.namedItem("webtoolsHttpMockBody");

    webtoolsHttpMockMethod =
      methodNode instanceof HTMLSelectElement
        ? normalizeWebtoolsHttpMockMethod(methodNode.value)
        : webtoolsHttpMockMethod;
    if (portNode instanceof HTMLInputElement) {
      const parsed = Number(portNode.value);
      if (Number.isFinite(parsed)) {
        webtoolsHttpMockPort = Math.min(65535, Math.max(1024, Math.floor(parsed)));
      }
    }
    if (pathNode instanceof HTMLInputElement) {
      webtoolsHttpMockPath = normalizeWebtoolsHttpMockPath(pathNode.value);
    }
    if (statusNode instanceof HTMLInputElement) {
      const parsed = Number(statusNode.value);
      if (Number.isFinite(parsed)) {
        webtoolsHttpMockStatusCode = Math.min(599, Math.max(100, Math.floor(parsed)));
      }
    }
    if (contentTypeNode instanceof HTMLInputElement && contentTypeNode.value.trim()) {
      webtoolsHttpMockContentType = contentTypeNode.value.trim();
    }
    if (bodyNode instanceof HTMLTextAreaElement) {
      webtoolsHttpMockBody = bodyNode.value;
    }
  }

  const requestToken = ++webtoolsHttpMockRequestToken;
  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_HTTP_MOCK_PLUGIN_ID}:${action}`,
    type: "command",
    title: "HTTP Mock Server",
    subtitle: "面板执行",
    target: buildWebtoolsHttpMockTarget(action),
    keywords: ["plugin", "http", "mock", "api"]
  };

  const result = await launcher.execute(item);
  if (requestToken !== webtoolsHttpMockRequestToken) {
    return;
  }

  const data = toRecord(result.data);
  if (typeof data?.running === "boolean") {
    webtoolsHttpMockRunning = data.running;
  }
  if (typeof data?.url === "string") {
    webtoolsHttpMockUrl = data.url;
  }
  if (typeof data?.requestCount === "number" && Number.isFinite(data.requestCount)) {
    webtoolsHttpMockRequestCount = Math.max(0, Math.floor(data.requestCount));
  }
  if (typeof data?.port === "number" && Number.isFinite(data.port)) {
    webtoolsHttpMockPort = Math.min(65535, Math.max(1024, Math.floor(data.port)));
  }
  if (typeof data?.path === "string") {
    webtoolsHttpMockPath = normalizeWebtoolsHttpMockPath(data.path);
  }
  if (typeof data?.method === "string") {
    webtoolsHttpMockMethod = normalizeWebtoolsHttpMockMethod(data.method);
  }
  if (typeof data?.statusCode === "number" && Number.isFinite(data.statusCode)) {
    webtoolsHttpMockStatusCode = Math.min(599, Math.max(100, Math.floor(data.statusCode)));
  }
  if (typeof data?.contentType === "string" && data.contentType.trim()) {
    webtoolsHttpMockContentType = data.contentType;
  }
  if (typeof data?.body === "string") {
    webtoolsHttpMockBody = data.body;
  }

  webtoolsHttpMockError = result.ok ? "" : result.message || "HTTP Mock 执行失败";
  webtoolsHttpMockInfo = result.message || (result.ok ? "执行完成" : "执行失败");
  setStatus(result.message ?? (result.ok ? "HTTP Mock 执行完成" : "HTTP Mock 执行失败"));
  if (form) {
    refreshWebtoolsHttpMockPanelInForm(form);
  }
}

function renderWebtoolsHttpMockPanel(): void {
  panelImplsSafe.renderWebtoolsHttpMockPanel();
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

function runWithPluginForm(
  selector: string,
  action: (form: HTMLFormElement) => void
): () => void {
  return () => {
    const form = list.querySelector(selector);
    if (form instanceof HTMLFormElement) {
      action(form);
    }
  };
}

const pluginPanelHandlers: Readonly<Record<string, PluginPanelHandler>> = {
  [HARDWARE_INSPECTOR_PLUGIN_ID]: {
    render: panelImplsSafe.renderHardwareInspectorPanel,
    onOpen: panelImplsSafe.applyHardwareInspectorPanelPayload,
    onEnter: () => {
      void executeHardwareInspectorRefresh();
    }
  },
  [WEBTOOLS_PASSWORD_PLUGIN_ID]: {
    render: renderWebtoolsPasswordPanel,
    onOpen: applyWebtoolsPasswordPanelPayload,
    onEnter: runWithPluginForm("form.webtools-password-form", (form) => {
      void generateFromWebtoolsPasswordPanel(form, { render: false });
    })
  },
  [WEBTOOLS_JSON_PLUGIN_ID]: {
    render: renderWebtoolsJsonPanel,
    onOpen: applyWebtoolsJsonPanelPayload,
    onEnter: runWithPluginForm("form.webtools-json-form", (form) => {
      void executeWebtoolsJsonConvert(form, { render: false });
    })
  },
  [WEBTOOLS_URL_PLUGIN_ID]: {
    render: renderWebtoolsUrlPanel,
    onOpen: applyWebtoolsUrlPanelPayload,
    onEnter: runWithPluginForm("form.webtools-url-form", (form) => {
      const inputNode = form.elements.namedItem("webtoolsUrlInput");
      const input = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
      parseWebtoolsUrlInput(input);
      refreshWebtoolsUrlPanelInForm(form, { rebuildQueryRows: true });
      setStatus(webtoolsUrlState.valid === false ? webtoolsUrlState.info : "URL 解析完成");
    })
  },
  [WEBTOOLS_DIFF_PLUGIN_ID]: {
    render: renderWebtoolsDiffPanel,
    onOpen: applyWebtoolsDiffPanelPayload,
    onEnter: runWithPluginForm("form.webtools-diff-form", (form) => {
      void executeWebtoolsDiffCompare(form);
    })
  },
  [WEBTOOLS_TIMESTAMP_PLUGIN_ID]: {
    render: renderWebtoolsTimestampPanel,
    onOpen: applyWebtoolsTimestampPanelPayload,
    onEnter: runWithPluginForm("form.webtools-timestamp-form", (form) => {
      const inputNode = form.elements.namedItem("webtoolsTimestampUnixInput");
      const input = inputNode instanceof HTMLInputElement ? inputNode.value : "";
      void executeWebtoolsTimestampAction("toDate", input, { render: false, form });
    })
  },
  [WEBTOOLS_REGEX_PLUGIN_ID]: {
    render: panelImplsSafe.renderWebtoolsRegexPanel,
    onOpen: panelImplsSafe.applyWebtoolsRegexPanelPayload,
    onEnter: runWithPluginForm("form.webtools-regex-form", (form) => {
      const patternNode = form.elements.namedItem("webtoolsRegexPattern");
      const flagsNode = form.elements.namedItem("webtoolsRegexFlags");
      const inputNode = form.elements.namedItem("webtoolsRegexInput");
      webtoolsRegexPattern = patternNode instanceof HTMLInputElement ? patternNode.value : "";
      webtoolsRegexFlags = flagsNode instanceof HTMLInputElement ? flagsNode.value : "g";
      webtoolsRegexInput = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
      refreshWebtoolsRegexState();
      refreshWebtoolsRegexPreviewInForm(form);
      setStatus(webtoolsRegexError || webtoolsRegexInfo || "已刷新正则结果");
    })
  },
  [WEBTOOLS_CRON_PLUGIN_ID]: {
    render: renderWebtoolsCronPanel,
    onOpen: applyWebtoolsCronPanelPayload,
    onEnter: runWithPluginForm("form.webtools-cron-form", (form) => {
      const node = form.elements.namedItem("webtoolsCronExpression");
      const expression = node instanceof HTMLInputElement ? node.value : "";
      void executeWebtoolsCronAction("parse", expression, {
        render: false,
        form
      });
    })
  },
  [WEBTOOLS_CRYPTO_PLUGIN_ID]: {
    render: panelImplsSafe.renderWebtoolsCryptoPanel,
    onOpen: panelImplsSafe.applyWebtoolsCryptoPanelPayload,
    onEnter: runWithPluginForm("form.webtools-crypto-form", (form) => {
      void executeWebtoolsCryptoProcess(form, { render: false });
    })
  },
  [WEBTOOLS_JWT_PLUGIN_ID]: {
    render: panelImplsSafe.renderWebtoolsJwtPanel,
    onOpen: panelImplsSafe.applyWebtoolsJwtPanelPayload,
    onEnter: runWithPluginForm("form.webtools-jwt-form", (form) => {
      void executeWebtoolsJwtAction("parse", form, { render: false });
    })
  },
  [WEBTOOLS_STRINGS_PLUGIN_ID]: {
    render: renderWebtoolsStringsPanel,
    onOpen: applyWebtoolsStringsPanelPayload,
    onEnter: runWithPluginForm("form.webtools-strings-form", (form) => {
      void executeWebtoolsStringsAction("convert", form);
    })
  },
  [WEBTOOLS_COLORS_PLUGIN_ID]: {
    render: renderWebtoolsColorsPanel,
    onOpen: applyWebtoolsColorsPanelPayload,
    onEnter: runWithPluginForm("form.webtools-colors-form", (form) => {
      const node = form.elements.namedItem("webtoolsColorsInput");
      const color = node instanceof HTMLInputElement ? node.value : "";
      void executeWebtoolsColorsConvert(color);
    })
  },
  [WEBTOOLS_IMAGE_BASE64_PLUGIN_ID]: {
    render: renderWebtoolsImageBase64Panel,
    onOpen: applyWebtoolsImageBase64PanelPayload,
    onEnter: runWithPluginForm("form.webtools-image-base64-form", (form) => {
      const node = form.elements.namedItem("webtoolsImageBase64Input");
      const inputValue = node instanceof HTMLTextAreaElement ? node.value : "";
      void executeWebtoolsImageBase64Normalize(inputValue);
    })
  },
  [WEBTOOLS_CONFIG_PLUGIN_ID]: {
    render: renderWebtoolsConfigPanel,
    onOpen: applyWebtoolsConfigPanelPayload,
    onEnter: runWithPluginForm("form.webtools-config-form", (form) => {
      void executeWebtoolsConfigConvert(form);
    })
  },
  [WEBTOOLS_SQL_PLUGIN_ID]: {
    render: renderWebtoolsSqlPanel,
    onOpen: applyWebtoolsSqlPanelPayload,
    onEnter: runWithPluginForm("form.webtools-sql-form", (form) => {
      void executeWebtoolsSqlFormat(form);
    })
  },
  [WEBTOOLS_UNIT_PLUGIN_ID]: {
    render: panelImplsSafe.renderWebtoolsUnitPanel,
    onOpen: panelImplsSafe.applyWebtoolsUnitPanelPayload,
    onEnter: runWithPluginForm("form.webtools-unit-form", (form) => {
      if (webtoolsUnitActiveTab === "screen") {
        refreshWebtoolsUnitPanelInForm(form);
        setStatus("px/rem 换算完成");
        return;
      }
      refreshWebtoolsUnitPanelInForm(form);
      setStatus("容量换算完成");
    })
  },
  [WEBTOOLS_QRCODE_PLUGIN_ID]: {
    render: renderWebtoolsQrcodePanel,
    onOpen: applyWebtoolsQrcodePanelPayload,
    onEnter: runWithPluginForm("form.webtools-qrcode-form", (form) => {
      void executeWebtoolsQrcodeGenerate(form);
    })
  },
  [WEBTOOLS_MARKDOWN_PLUGIN_ID]: {
    render: renderWebtoolsMarkdownPanel,
    onOpen: applyWebtoolsMarkdownPanelPayload,
    onEnter: runWithPluginForm("form.webtools-markdown-form", (form) => {
      void executeWebtoolsMarkdownRender(form);
    })
  },
  [WEBTOOLS_UA_PLUGIN_ID]: {
    render: renderWebtoolsUaPanel,
    onOpen: applyWebtoolsUaPanelPayload,
    onEnter: runWithPluginForm("form.webtools-ua-form", (form) => {
      const node = form.elements.namedItem("webtoolsUaInput");
      const ua = node instanceof HTMLTextAreaElement ? node.value : "";
      void executeWebtoolsUaParse(ua);
    })
  },
  [WEBTOOLS_API_PLUGIN_ID]: {
    render: renderWebtoolsApiPanel,
    onOpen: applyWebtoolsApiPanelPayload,
    onEnter: runWithPluginForm("form.webtools-api-form", (form) => {
      void executeWebtoolsApiRequest(form);
    })
  },
  [WEBTOOLS_HTTP_MOCK_PLUGIN_ID]: {
    render: renderWebtoolsHttpMockPanel,
    onOpen: applyWebtoolsHttpMockPanelPayload,
    onEnter: runWithPluginForm("form.webtools-http-mock-form", (form) => {
      void executeWebtoolsHttpMockAction("start", form);
    })
  }
};

function getPluginPanelHandler(pluginId: string): PluginPanelHandler | null {
  return pluginPanelHandlers[pluginId] ?? null;
}

function renderActivePluginPanel(): void {
  const plugin = activePluginPanel;
  if (!plugin || plugin.pluginId !== WEBTOOLS_JSON_PLUGIN_ID) {
    if (webtoolsJsonAutoTimer !== null) {
      window.clearTimeout(webtoolsJsonAutoTimer);
      webtoolsJsonAutoTimer = null;
    }
  }
  if (!plugin || plugin.pluginId !== WEBTOOLS_DIFF_PLUGIN_ID) {
    if (webtoolsDiffAutoTimer !== null) {
      window.clearTimeout(webtoolsDiffAutoTimer);
      webtoolsDiffAutoTimer = null;
    }
  }
  if (!plugin || plugin.pluginId !== WEBTOOLS_TIMESTAMP_PLUGIN_ID) {
    clearWebtoolsTimestampAutoTimer();
    clearWebtoolsTimestampClockTimer();
  }
  if (!plugin || plugin.pluginId !== WEBTOOLS_CRON_PLUGIN_ID) {
    if (webtoolsCronAutoTimer !== null) {
      window.clearTimeout(webtoolsCronAutoTimer);
      webtoolsCronAutoTimer = null;
    }
  }
  if (!plugin || plugin.pluginId !== WEBTOOLS_CRYPTO_PLUGIN_ID) {
    if (webtoolsCryptoAutoTimer !== null) {
      window.clearTimeout(webtoolsCryptoAutoTimer);
      webtoolsCryptoAutoTimer = null;
    }
  }
  if (!plugin || plugin.pluginId !== WEBTOOLS_JWT_PLUGIN_ID) {
    if (webtoolsJwtAutoTimer !== null) {
      window.clearTimeout(webtoolsJwtAutoTimer);
      webtoolsJwtAutoTimer = null;
    }
    if (webtoolsJwtSignTimer !== null) {
      window.clearTimeout(webtoolsJwtSignTimer);
      webtoolsJwtSignTimer = null;
    }
  }
  if (!plugin || plugin.pluginId !== WEBTOOLS_COLORS_PLUGIN_ID) {
    if (webtoolsColorsAutoTimer !== null) {
      window.clearTimeout(webtoolsColorsAutoTimer);
      webtoolsColorsAutoTimer = null;
    }
  }
  if (!plugin || plugin.pluginId !== WEBTOOLS_IMAGE_BASE64_PLUGIN_ID) {
    if (webtoolsImageBase64AutoTimer !== null) {
      window.clearTimeout(webtoolsImageBase64AutoTimer);
      webtoolsImageBase64AutoTimer = null;
    }
  }
  if (!plugin || plugin.pluginId !== WEBTOOLS_CONFIG_PLUGIN_ID) {
    if (webtoolsConfigAutoTimer !== null) {
      window.clearTimeout(webtoolsConfigAutoTimer);
      webtoolsConfigAutoTimer = null;
    }
  }
  if (!plugin || plugin.pluginId !== WEBTOOLS_SQL_PLUGIN_ID) {
    if (webtoolsSqlAutoTimer !== null) {
      window.clearTimeout(webtoolsSqlAutoTimer);
      webtoolsSqlAutoTimer = null;
    }
  }
  if (!plugin || plugin.pluginId !== WEBTOOLS_QRCODE_PLUGIN_ID) {
    if (webtoolsQrAutoTimer !== null) {
      window.clearTimeout(webtoolsQrAutoTimer);
      webtoolsQrAutoTimer = null;
    }
  }
  if (!plugin || plugin.pluginId !== WEBTOOLS_MARKDOWN_PLUGIN_ID) {
    if (webtoolsMarkdownAutoTimer !== null) {
      window.clearTimeout(webtoolsMarkdownAutoTimer);
      webtoolsMarkdownAutoTimer = null;
    }
  }
  if (!plugin || plugin.pluginId !== WEBTOOLS_UA_PLUGIN_ID) {
    if (webtoolsUaAutoTimer !== null) {
      window.clearTimeout(webtoolsUaAutoTimer);
      webtoolsUaAutoTimer = null;
    }
  }
  if (!plugin) {
    delete document.body.dataset.activePluginId;
    renderPluginPanel();
    return;
  }

  document.body.dataset.activePluginId = plugin.pluginId;

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
          const pluginPageSize = Math.max(1, searchDisplayConfig.pluginLimit);
          const pluginTotalCount = pluginItems.length;
          const pluginPageCount = Math.max(
            1,
            Math.ceil(Math.max(1, pluginTotalCount) / pluginPageSize)
          );
          if (pluginResultPage >= pluginPageCount) {
            pluginResultPage = pluginPageCount - 1;
          }
          const pluginStart = pluginResultPage * pluginPageSize;
          const pagedPluginItems = pluginItems.slice(
            pluginStart,
            pluginStart + pluginPageSize
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
            pagedPluginItems,
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
          const pluginPageSize = Math.max(1, searchDisplayConfig.pluginLimit);
          const pluginShownStart =
            pluginItems.length === 0 ? 0 : pluginResultPage * pluginPageSize + 1;
          const pluginShownEnd =
            pluginItems.length === 0
              ? 0
              : Math.min(
                  pluginItems.length,
                  pluginResultPage * pluginPageSize + pluginPageSize
                );
          setStatus(
            `\u641c\u7d22 ${shownStart}-${shownEnd}/${totalSearchText} \u00b7 \u7f6e\u9876 ${Math.min(
              pinnedItems.length,
              searchDisplayConfig.pinnedLimit
            )} \u00b7 \u63d2\u4ef6 ${pluginShownStart}-${pluginShownEnd}/${pluginItems.length}`
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

      const pluginPageSize = Math.max(1, searchDisplayConfig.pluginLimit);
      const pluginPageCount = Math.max(
        1,
        Math.ceil(Math.max(1, pluginItems.length) / pluginPageSize)
      );
      if (pluginResultPage >= pluginPageCount) {
        pluginResultPage = pluginPageCount - 1;
      }
      const pluginStart = pluginResultPage * pluginPageSize;
      const pagedPluginItems = pluginItems.slice(pluginStart, pluginStart + pluginPageSize);

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
        pagedPluginItems,
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
        `\u6700\u8fd1 ${Math.min(recentItems.length, searchDisplayConfig.recentLimit)} \u00b7 \u7f6e\u9876 ${Math.min(
          pinnedItems.length,
          searchDisplayConfig.pinnedLimit
        )} \u00b7 \u63d2\u4ef6 ${
          pluginItems.length === 0 ? 0 : pluginStart + 1
        }-${pluginItems.length === 0 ? 0 : pluginStart + pagedPluginItems.length}/${pluginItems.length}`
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
      if (isMultilineEditorTarget && !event.ctrlKey && !event.metaKey) {
        return;
      }
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
