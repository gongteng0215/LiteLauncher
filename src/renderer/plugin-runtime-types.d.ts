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

interface WebtoolsJsonPreviewField {
  key: string;
  count?: number;
}

interface WebtoolsJsonPreviewSummary {
  kind: "json-object" | "json-array" | "csv" | "text" | "escaped" | "unknown";
  summary: string;
  fields: WebtoolsJsonPreviewField[];
  sampleRows: Array<Record<string, unknown>>;
}

interface WebtoolsJsonState {
  input: string;
  output: string;
  info: string;
  valid: boolean | null;
  sourceFormat: "json" | "csv" | "text" | "escaped";
  targetFormat: "json" | "csv" | "text" | "escaped";
  compressed: boolean;
  preview: WebtoolsJsonPreviewSummary | null;
  errorPosition: number | null;
  selectedFields: string[];
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

type WebtoolsCronStatus = "success" | "warning" | "error" | "";
type WebtoolsCronFieldKey = "minute" | "hour" | "day" | "month" | "weekday";
type WebtoolsCronCopyState = "" | "expression" | "readable";

interface WebtoolsCronFieldMeta {
  key: WebtoolsCronFieldKey;
  label: string;
  value: string;
  hint: string;
  hasError: boolean;
}

interface WebtoolsApiKvRow {
  key: string;
  value: string;
  enabled: boolean;
}

type WebtoolsImagePromptProductId = "chatgpt-images-2";

type WebtoolsImagePromptStylePresetId =
  | "ecommerce-main"
  | "social-cover"
  | "movie-poster"
  | "portrait-photo"
  | "interior-architecture"
  | "illustration-ip"
  | "food-drink"
  | "education-poster"
  | "festival-campaign"
  | "birthday-party"
  | "app-saas"
  | "travel-landscape"
  | "beauty-fashion"
  | "livestream-commerce"
  | "brand-key-visual"
  | "packaging-design"
  | "home-decoration"
  | "automotive-transport"
  | "parent-child"
  | "medical-health"
  | "finance-business"
  | "recruitment-brand"
  | "public-service"
  | "guochao-culture"
  | "minimalist-print"
  | "retro-magazine";

type WebtoolsImagePromptStylePresetGroup =
  | "商品商业"
  | "内容封面"
  | "人像角色"
  | "空间建筑"
  | "餐饮生活"
  | "科技软件"
  | "活动节日"
  | "行业服务"
  | "艺术表现";

type WebtoolsImagePromptOptionGroupKey =
  | "subject"
  | "style"
  | "composition"
  | "lighting"
  | "materials"
  | "environment"
  | "mood"
  | "constraints";

interface WebtoolsImagePromptProductTemplate {
  id: WebtoolsImagePromptProductId;
  label: string;
  description: string;
}

interface WebtoolsImagePromptOptionCategory {
  label: string;
  options: string[];
}

interface WebtoolsImagePromptOptionGroup {
  key: WebtoolsImagePromptOptionGroupKey;
  label: string;
  description: string;
  options: string[];
  categories?: WebtoolsImagePromptOptionCategory[];
  allowCustom: boolean;
}

interface WebtoolsImagePromptStylePreset {
  id: WebtoolsImagePromptStylePresetId;
  group: WebtoolsImagePromptStylePresetGroup;
  label: string;
  description: string;
  defaults: Partial<Record<WebtoolsImagePromptOptionGroupKey, string[]>>;
  optionGroups: Partial<Record<WebtoolsImagePromptOptionGroupKey, string[]>>;
  textDefaults?: Partial<WebtoolsImagePromptTextState>;
}

type WebtoolsImagePromptSmartTemplateId =
  | "ecommerce-main-image"
  | "brand-kv-launch"
  | "xiaohongshu-cover"
  | "short-video-cover"
  | "birthday-photo"
  | "child-first-birthday"
  | "food-magazine"
  | "saas-hero"
  | "movie-poster-drama"
  | "travel-campaign"
  | "medical-health-poster"
  | "finance-business-poster";

interface WebtoolsImagePromptSmartTemplatePatch {
  selections?: Partial<Record<WebtoolsImagePromptOptionGroupKey, string[]>>;
  custom?: Partial<Record<Exclude<WebtoolsImagePromptOptionGroupKey, "constraints">, string>>;
  text?: Partial<WebtoolsImagePromptTextState>;
  photoDescription?: string;
  constraints?: string[];
}

interface WebtoolsImagePromptSmartTemplate {
  id: WebtoolsImagePromptSmartTemplateId;
  label: string;
  description: string;
  stylePresetId: WebtoolsImagePromptStylePresetId;
  patch: WebtoolsImagePromptSmartTemplatePatch;
}

interface WebtoolsImagePromptTextOptions {
  positions: string[];
  styles: string[];
  designs: WebtoolsImagePromptTextDesign[];
  flags: string[];
}

interface WebtoolsImagePromptTextDesign {
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
}

interface WebtoolsImagePromptTextState {
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
}

interface WebtoolsImagePromptState {
  productId: WebtoolsImagePromptProductId;
  stylePresetId: WebtoolsImagePromptStylePresetId;
  photoDescription: string;
  selections: Record<WebtoolsImagePromptOptionGroupKey, string[]>;
  custom: Record<Exclude<WebtoolsImagePromptOptionGroupKey, "constraints">, string>;
  text: WebtoolsImagePromptTextState;
  constraints: string[];
}

interface WebtoolsImagePromptData {
  products: WebtoolsImagePromptProductTemplate[];
  optionGroups: WebtoolsImagePromptOptionGroup[];
  stylePresets: WebtoolsImagePromptStylePreset[];
  smartTemplates: WebtoolsImagePromptSmartTemplate[];
  textOptions: WebtoolsImagePromptTextOptions;
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
  adapterRamSource:
    | "registry-qword"
    | "nvidia-smi"
    | "wmi-uint32"
    | "wmi-uint32-limited"
    | null;
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
type WebtoolsFileHashAlgorithm = "md5" | "sha1" | "sha256" | "sha512";
type WebtoolsPortHelperProtocol = "all" | "tcp" | "udp";

interface WebtoolsPortHelperRecord {
  protocol: string;
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  state: string;
  pid: number;
  processName: string;
}

interface PasswordPanelPayload {
  panel: "password";
  draft?: Partial<PasswordGeneratorOptions>;
}

interface CashflowPanelPayload {
  panel: "cashflow";
  reset?: boolean;
  role?: string;
  review?: boolean;
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

interface CashflowReviewDecision {
  turn: number;
  action: string;
  message: string;
  createdAt: number;
}

interface CashflowReviewCheckpoint {
  turn: number;
  passiveIncome: number;
  cash: number;
  monthlyNet: number;
  netWorth: number;
  createdAt: number;
}

interface CashflowReviewGame {
  id: number;
  status: string;
  role: string;
  currentTurn: number;
  won: boolean;
  lost: boolean;
  lossReason: string | null;
  createdAt: number;
  updatedAt: number;
  state: CashflowState;
  decisions: CashflowReviewDecision[];
  checkpoints: CashflowReviewCheckpoint[];
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
  | "ai"
  | "review"
  | "review-data";

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
