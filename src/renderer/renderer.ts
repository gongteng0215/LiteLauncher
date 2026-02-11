type PanelMode = "search" | "clip" | "settings" | "password" | "cashflow";
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

interface PasswordPanelPayload {
  panel: "password";
  draft?: Partial<PasswordGeneratorOptions>;
}

interface CashflowPanelPayload {
  panel: "cashflow";
  reset?: boolean;
  role?: string;
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
  getSearchDisplayConfig(): Promise<SearchDisplayConfig>;
  setSearchDisplayConfig(
    config: Partial<SearchDisplayConfig>
  ): Promise<SearchDisplayConfig>;
  setItemPinned(itemId: string, pinned: boolean): Promise<boolean>;
  search(query: string): Promise<LaunchItem[]>;
  execute(item: LaunchItem): Promise<ExecuteResult>;
  hide(): Promise<boolean>;
  getClipItems(query: string): Promise<ClipItem[]>;
  copyClipItem(itemId: string): Promise<boolean>;
  deleteClipItem(itemId: string): Promise<boolean>;
  clearClipItems(): Promise<number>;
  onFocusInput(handler: () => void): () => void;
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
}

const inputElement = document.getElementById(
  "search-input"
) as HTMLInputElement | null;
const listElement = document.getElementById(
  "result-list"
) as HTMLUListElement | null;
const statusElement = document.getElementById(
  "status-text"
) as HTMLDivElement | null;
const hintElement = document.getElementById("hint-text") as HTMLDivElement | null;

if (!inputElement || !listElement || !statusElement || !hintElement) {
  throw new Error("\u6e32\u67d3\u5c42\u521d\u59cb\u5316\u5931\u8d25\uff1a\u7f3a\u5c11\u5fc5\u8981 DOM \u8282\u70b9");
}

const input = inputElement;
const list = listElement;
const statusText = statusElement;
const hintText = hintElement;

let entries: ResultEntry[] = [];
let searchSections: SearchSection[] = [];
let selectedIndex = 0;
let currentQuery = "";
let latestSearchToken = 0;
let mode: PanelMode = "search";
let debugMode = false;
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

const DEBUG_LOG_LIMIT = 22;
const GRID_COLUMNS = 10;
const SETTINGS_LIMIT_MIN = 5;
const SETTINGS_LIMIT_MAX = 50;
const PASSWORD_LENGTH_MIN = 4;
const PASSWORD_LENGTH_MAX = 64;
const PASSWORD_COUNT_MIN = 1;
const PASSWORD_COUNT_MAX = 20;
const CASHFLOW_PLUGIN_ID = "cashflow-game";
const CURRENCY_FORMATTER = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0
});
const debugLogs: string[] = [];
const debugPanel = document.createElement("div");
let searchDisplayConfig: SearchDisplayConfig = {
  recentLimit: 20,
  pinnedLimit: 20,
  pluginLimit: 20,
  searchLimit: 20
};

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

function setMode(nextMode: PanelMode): void {
  mode = nextMode;
  input.value = "";
  currentQuery = "";
  input.readOnly = mode === "settings" || mode === "password" || mode === "cashflow";

  if (mode === "search") {
    input.placeholder = "\u641c\u7d22\u5e94\u7528\uff08\u56fe\u6807\u7f51\u683c\uff09";
    setHint("Enter \u6267\u884c - Esc \u6e05\u7a7a/\u9690\u85cf - \u65b9\u5411\u952e\u79fb\u52a8 - \u53f3\u952e\u7f6e\u9876");
  } else if (mode === "clip") {
    input.placeholder = "\u641c\u7d22\u526a\u8d34\u677f\u5386\u53f2";
    setHint("Enter \u590d\u5236 - Delete \u5220\u9664 - Ctrl+Shift+Delete \u6e05\u7a7a - Esc \u8fd4\u56de");
  } else if (mode === "password") {
    input.placeholder = "\u5bc6\u7801\u751f\u6210\u5668\u9762\u677f";
    setHint("Enter \u751f\u6210\u5e76\u590d\u5236 - Esc \u8fd4\u56de");
  } else if (mode === "cashflow") {
    input.placeholder = "\u73b0\u91d1\u6d41\u6e38\u620f\u9762\u677f";
    setHint("Enter \u4e0b\u4e00\u56de\u5408 - Esc \u8fd4\u56de - \u70b9\u51fb\u6309\u94ae\u64cd\u4f5c");
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

function formatMoney(value: number): string {
  return CURRENCY_FORMATTER.format(value);
}

function formatPercent(value: number): string {
  const percent = value * 100;
  return `${percent.toFixed(1)}%`;
}

function cashflowPhaseLabel(phase: CashflowPhase): string {
  return phase === "freedom-phase" ? "自由阶段" : "老鼠赛跑";
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
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

function addSearchSection(
  id: SectionId,
  title: string,
  items: LaunchItem[],
  displayLimit: number,
  emptyText: string
): void {
  const indexes: number[] = [];
  const limited = items.slice(0, displayLimit);

  for (const item of limited) {
    indexes.push(entries.length);
    entries.push({ kind: "launch", item });
  }

  searchSections.push({ id, title, displayLimit, indexes, emptyText });
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
    void togglePinned(index);
  });
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
    heading.className = "section-title";
    heading.textContent = `${section.title} (${section.indexes.length}/${section.displayLimit})`;

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

  const normalized = normalizeSettingsInput(inputConfig);
  searchDisplayConfig = await launcher.setSearchDisplayConfig(normalized);
  setStatus("\u8bbe\u7f6e\u5df2\u4fdd\u5b58");
  renderList();
}

function renderSettingsPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = "\u641c\u7d22\u663e\u793a\u6570\u91cf";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent = "\u4fee\u6539\u540e\u70b9\u51fb\u4fdd\u5b58\uff0c\u7acb\u5373\u5f71\u54cd\u9996\u9875\u548c\u641c\u7d22\u7ed3\u679c\u6570\u91cf\u3002";

  const form = document.createElement("form");
  form.className = "settings-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveSettingsFromForm(form);
  });

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

  for (const field of fields) {
    const row = document.createElement("label");
    row.className = "settings-row";

    const label = document.createElement("span");
    label.className = "settings-row-label";
    label.textContent = field.label;

    const inputNode = document.createElement("input");
    inputNode.className = "settings-number";
    inputNode.type = "number";
    inputNode.name = field.key;
    inputNode.min = String(SETTINGS_LIMIT_MIN);
    inputNode.max = String(SETTINGS_LIMIT_MAX);
    inputNode.step = "1";
    inputNode.value = String(searchDisplayConfig[field.key]);

    const hint = document.createElement("span");
    hint.className = "settings-row-hint";
    hint.textContent = `${field.hint} \u8303\u56f4 ${SETTINGS_LIMIT_MIN}-${SETTINGS_LIMIT_MAX}`;

    row.append(label, inputNode, hint);
    form.appendChild(row);
  }

  const actions = document.createElement("div");
  actions.className = "settings-actions";

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
      searchLimit: 20
    };
    void launcher
      .setSearchDisplayConfig(searchDisplayConfig)
      .then((saved) => {
        searchDisplayConfig = saved;
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
  form.appendChild(actions);

  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
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

  const outputRow = document.createElement("div");
  outputRow.className = "password-output-row";
  const outputLabel = document.createElement("div");
  outputLabel.className = "settings-row-label";
  outputLabel.textContent = "\u751f\u6210\u7ed3\u679c";
  const output = document.createElement("textarea");
  output.className = "password-output";
  output.readOnly = true;
  output.placeholder = "\u70b9\u51fb\u751f\u6210\u540e\uff0c\u7ed3\u679c\u4f1a\u663e\u793a\u5728\u8fd9\u91cc";
  output.value = passwordPanelGenerated.join("\n");
  outputRow.append(outputLabel, output);

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
    empty.textContent = "暂无数据";
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

  if (state.phase === "freedom-phase") {
    const phaseNote = document.createElement("div");
    phaseNote.className = "cashflow-phase-note";
    phaseNote.textContent =
      "\u5df2\u8fdb\u5165\u81ea\u7531\u9636\u6bb5\uff1a\u673a\u4f1a\u89c4\u6a21\u66f4\u5927\uff0c\u4f46\u4e8b\u4ef6\u98ce\u9669\u4e5f\u4f1a\u63d0\u5347\u3002";
    panel.append(phaseNote);
  }

  const statGrid = document.createElement("div");
  statGrid.className = "cashflow-stats";
  const salaryAfterTax = Math.max(0, Math.round(state.salary * (1 - state.taxRate)));
  const totalExpenses = state.expenses + state.debtPayment;
  const monthlyNet = salaryAfterTax + state.passiveIncome - totalExpenses;
  statGrid.append(
    createCashflowStat("\u9636\u6bb5", cashflowPhaseLabel(state.phase), state.phase === "freedom-phase"),
    createCashflowStat("\u804c\u4e1a", state.role),
    createCashflowStat("\u6708\u4efd", `M${state.turn}`),
    createCashflowStat("\u73b0\u91d1", formatMoney(state.cash), true),
    createCashflowStat("\u7a0e\u540e\u5de5\u8d44", `${formatMoney(salaryAfterTax)}/\u6708`),
    createCashflowStat(
      "\u88ab\u52a8\u6536\u5165",
      `${formatMoney(state.passiveIncome)}/\u6708`,
      true
    ),
    createCashflowStat("\u751f\u6d3b\u652f\u51fa", `${formatMoney(state.expenses)}/\u6708`),
    createCashflowStat("\u503a\u52a1\u4ed8\u6b3e", `${formatMoney(state.debtPayment)}/\u6708`),
    createCashflowStat("\u5269\u4f59\u503a\u52a1", formatMoney(state.debt)),
    createCashflowStat("\u603b\u652f\u51fa", `${formatMoney(totalExpenses)}/\u6708`),
    createCashflowStat("\u4e2a\u7a0e\u7a0e\u7387", formatPercent(state.taxRate)),
    createCashflowStat(
      "\u6708\u51c0\u73b0\u91d1\u6d41",
      `${monthlyNet >= 0 ? "+" : ""}${formatMoney(monthlyNet)}/\u6708`,
      monthlyNet >= 0
    ),
    createCashflowStat(
      "\u5f53\u524d\u72b6\u6001",
      state.won ? "\u5df2\u8fbe\u6210\u8d22\u52a1\u81ea\u7531" : state.lost ? "\u672c\u5c40\u5931\u8d25" : "\u8fdb\u884c\u4e2d",
      state.won || state.lost
    )
  );

  const roleBlock = document.createElement("section");
  roleBlock.className = "cashflow-block";
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
        `${job.role} · \u7a0e\u7387 ${formatPercent(job.taxRate)} · \u503a\u52a1 ${formatMoney(job.initialDebt)}`;
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
  const aiTitle = document.createElement("h4");
  aiTitle.className = "cashflow-block-title";
  aiTitle.textContent = "AI 玩家";
  aiBlock.appendChild(aiTitle);

  if (!state.aiEnabled || state.aiPlayers.length === 0) {
    const emptyAi = document.createElement("div");
    emptyAi.className = "cashflow-empty";
    emptyAi.textContent = "当前为单人模式，可点击“开启 AI 对战”加入对手。";
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
      nameNode.textContent = `${aiPlayer.name}（${aiPlayer.role}）`;
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
        `现金 ${formatMoney(aiPlayer.cash)} · ` +
        `被动收入 ${formatMoney(aiPlayer.passiveIncome)}/月 · ` +
        `债务 ${formatMoney(aiPlayer.debt)} · ` +
        `月净现金流 ${monthlyNetAi >= 0 ? "+" : ""}${formatMoney(monthlyNetAi)}/月 · ` +
        `资产 ${assetsCount} 项`;

      const decision = document.createElement("div");
      decision.className = "cashflow-ai-decision";
      if (aiPlayer.won) {
        decision.textContent = "状态：已达成财务自由";
      } else if (aiPlayer.lost) {
        decision.textContent = `状态：失败（${aiPlayer.lossReason ?? "未知原因"}）`;
      } else {
        decision.textContent = `最近决策：${aiPlayer.lastDecision ?? "暂无"}`;
      }

      card.append(head, stats, decision);
      aiList.appendChild(card);
    }
    aiBlock.appendChild(aiList);
  }

  const opportunityBlock = document.createElement("section");
  opportunityBlock.className = "cashflow-block";
  const opportunityTitle = document.createElement("h4");
  opportunityTitle.className = "cashflow-block-title";
  opportunityTitle.textContent = "\u5f53\u524d\u673a\u4f1a";
  opportunityBlock.appendChild(opportunityTitle);
  if (state.currentOpportunity) {
    const nameNode = document.createElement("div");
    nameNode.className = "cashflow-opportunity-title";
    nameNode.textContent =
      state.currentOpportunity.dealClass === "big-deal"
        ? `\u3010Big Deal\u3011 ${state.currentOpportunity.title}`
        : state.currentOpportunity.title;

    const descNode = document.createElement("div");
    descNode.className = "cashflow-opportunity-desc";
    descNode.textContent = state.currentOpportunity.description;

    const metaNode = document.createElement("div");
    metaNode.className = "cashflow-opportunity-meta";
    metaNode.textContent =
      `\u6295\u8d44\u989d ${formatMoney(state.currentOpportunity.cost)} \u00b7 ` +
      `\u88ab\u52a8\u6536\u5165 +${formatMoney(state.currentOpportunity.cashflow)}/\u6708`;

    opportunityBlock.append(nameNode, descNode, metaNode);

    if (state.currentOpportunity.dealClass === "big-deal") {
      const riskNode = document.createElement("div");
      riskNode.className = "cashflow-opportunity-big-deal";
      riskNode.textContent =
        "Big Deal：低概率出现，高影响高风险；买入后可能触发额外收益或额外亏损。";
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
      : "\u6682\u65e0\u673a\u4f1a\uff0c\u53ef\u4ee5\u5148\u70b9\u201c\u4e0b\u4e00\u56de\u5408\u201d\u5237\u65b0\u5e02\u573a\u3002";
    opportunityBlock.appendChild(emptyNode);
  }

  const assetsBlock = document.createElement("section");
  assetsBlock.className = "cashflow-block";
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
  const reportsTitle = document.createElement("h4");
  reportsTitle.className = "cashflow-block-title";
  reportsTitle.textContent = "财务报表";
  reportsBlock.appendChild(reportsTitle);
  if (!reports) {
    const empty = document.createElement("div");
    empty.className = "cashflow-empty";
    empty.textContent = "报表加载中...";
    reportsBlock.appendChild(empty);
  } else {
    const reportGrid = document.createElement("div");
    reportGrid.className = "cashflow-report-grid";
    reportGrid.append(
      createCashflowReportList("收入", reports.income),
      createCashflowReportList("支出", reports.expenses)
    );

    const balance = document.createElement("div");
    balance.className = "cashflow-report-item";
    const balanceTitle = document.createElement("div");
    balanceTitle.className = "cashflow-report-item-title";
    balanceTitle.textContent = "资产负债";
    balance.append(
      balanceTitle,
      createCashflowMetricRow("现金", formatMoney(reports.balanceSheet.cash)),
      createCashflowMetricRow(
        "资产",
        formatMoney(reports.balanceSheet.assetsTotal)
      ),
      createCashflowMetricRow(
        "负债",
        formatMoney(reports.balanceSheet.debtsTotal)
      ),
      createCashflowMetricRow(
        "净资产",
        formatMoney(reports.balanceSheet.netWorth)
      )
    );

    const metrics = document.createElement("div");
    metrics.className = "cashflow-report-item";
    const metricsTitle = document.createElement("div");
    metricsTitle.className = "cashflow-report-item-title";
    metricsTitle.textContent = "关键指标";
    metrics.append(
      metricsTitle,
      createCashflowMetricRow(
        "月净现金流",
        `${reports.metrics.monthlyNet >= 0 ? "+" : ""}${formatMoney(
          reports.metrics.monthlyNet
        )}/月`
      ),
      createCashflowMetricRow(
        "被动收入覆盖率",
        formatPercent(reports.metrics.passiveIncomeRatio)
      ),
      createCashflowMetricRow("负债率", formatPercent(reports.metrics.debtRatio)),
      createCashflowMetricRow(
        "现金储备月数",
        `${reports.metrics.cashReserveMonths.toFixed(1)} 月`
      )
    );
    reportGrid.append(balance, metrics);
    reportsBlock.appendChild(reportGrid);
  }

  const logsBlock = document.createElement("section");
  logsBlock.className = "cashflow-block";
  const logsTitle = document.createElement("h4");
  logsTitle.className = "cashflow-block-title";
  logsTitle.textContent = "\u56de\u5408\u8bb0\u5f55";
  logsBlock.appendChild(logsTitle);
  const logList = document.createElement("ul");
  logList.className = "cashflow-log-list";
  for (const entry of state.logs) {
    const item = document.createElement("li");
    item.className = "cashflow-log-item";
    item.textContent = entry;
    logList.appendChild(item);
  }
  logsBlock.appendChild(logList);

  const actions = document.createElement("div");
  actions.className = "settings-actions cashflow-actions";

  const nextTurnButton = document.createElement("button");
  nextTurnButton.type = "button";
  nextTurnButton.className = "settings-btn settings-btn-primary";
  nextTurnButton.textContent = "\u4e0b\u4e00\u56de\u5408";
  nextTurnButton.addEventListener("click", () => {
    void nextCashflowTurn();
  });

  const buyButton = document.createElement("button");
  buyButton.type = "button";
  buyButton.className = "settings-btn settings-btn-primary";
  buyButton.textContent = "\u73b0\u91d1\u4e70\u5165";
  buyButton.disabled = !state.currentOpportunity || state.won || state.lost;
  buyButton.addEventListener("click", () => {
    void buyCashflowOpportunity();
  });

  const buyWithLoanButton = document.createElement("button");
  buyWithLoanButton.type = "button";
  buyWithLoanButton.className = "settings-btn settings-btn-secondary";
  buyWithLoanButton.textContent = "\u8d37\u6b3e\u4e70\u5165";
  buyWithLoanButton.disabled =
    !state.currentOpportunity ||
    state.won ||
    state.lost ||
    state.cash >= state.currentOpportunity.cost;
  buyWithLoanButton.addEventListener("click", () => {
    void buyCashflowOpportunityWithLoan();
  });

  const skipButton = document.createElement("button");
  skipButton.type = "button";
  skipButton.className = "settings-btn settings-btn-secondary";
  skipButton.textContent = "\u8df3\u8fc7\u673a\u4f1a";
  skipButton.disabled = !state.currentOpportunity || state.won || state.lost;
  skipButton.addEventListener("click", () => {
    void skipCashflowOpportunity();
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
  aiButton.textContent = state.aiEnabled ? "AI 已开启" : "开启 AI 对战";
  aiButton.disabled = state.aiEnabled;
  aiButton.addEventListener("click", () => {
    void executeCashflowAction("ai").then((result) => {
      if (result) {
        renderList();
      }
    });
  });

  nextTurnButton.disabled = state.won || state.lost;
  actions.append(
    nextTurnButton,
    buyButton,
    buyWithLoanButton,
    skipButton,
    aiButton,
    resetButton
  );

  panel.append(
    title,
    description,
    statGrid,
    roleBlock,
    aiBlock,
    opportunityBlock,
    assetsBlock,
    reportsBlock,
    logsBlock,
    actions
  );
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function renderList(): void {
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

  try {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus(
        "\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u8bf7\u5148\u5f7b\u5e95\u9000\u51fa LiteLauncher \u540e\u518d\u6267\u884c pnpm start"
      );
      return;
    }

    if (mode === "settings") {
      searchDisplayConfig = await launcher.getSearchDisplayConfig();
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

    if (mode === "search") {
      const trimmed = query.trim();

      if (trimmed) {
        const launchItems = await launcher.search(query);
        if (token !== latestSearchToken) {
          return;
        }

        resetSearchSections();
        addSearchSection(
          "search",
          "\u641c\u7d22\u7ed3\u679c",
          launchItems,
          searchDisplayConfig.searchLimit,
          "\u6ca1\u6709\u5339\u914d\u7ed3\u679c"
        );
        selectedIndex = entries.length ? 0 : 0;
        renderList();
        setStatus(`\u641c\u7d22\u7ed3\u679c\uff1a${entries.length}`);
        return;
      }

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
    void refreshEntries("");
    return;
  }

  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u9690\u85cf\u7a97\u53e3");
    return;
  }
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
    const step = mode === "search" ? GRID_COLUMNS : 1;
    pushDebugLog(`renderer action: moveSelection(+${step})`);
    moveSelection(step);
    return;
  }

  if (isArrowUp) {
    event.preventDefault();
    const step = mode === "search" ? GRID_COLUMNS : 1;
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
  input.addEventListener("input", () => {
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

  const launcher = getLauncherApi();
  if (launcher?.onFocusInput) {
    launcher.onFocusInput(() => {
      focusInput(true);
      pushDebugLog("renderer onFocusInput received");
      setTimeout(() => focusInput(true), 30);
    });
  }

  if (launcher?.onOpenPanel) {
    launcher.onOpenPanel((panelPayload) => {
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
        setMode("settings");
        pushDebugLog("renderer openPanel=settings");
        void refreshEntries("");
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
  });

  setMode("search");
  registerEvents();
  setStatus("\u53ef\u4ee5\u5f00\u59cb\u641c\u7d22");
  focusInput(false);
  void refreshEntries("");
}

bootstrap();
