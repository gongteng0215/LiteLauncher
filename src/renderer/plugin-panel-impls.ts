(() => {
const pluginConstants = window.__LL_PLUGIN_CONSTANTS__;
if (!pluginConstants) {
  throw new Error("renderer plugin constants not initialized");
}
const {
  CASHFLOW_PLUGIN_ID,
  HARDWARE_INSPECTOR_PLUGIN_ID,
  CLIPBOARD_WORKBENCH_PLUGIN_ID,
  LITESNAP_PLUGIN_ID,
  WEBTOOLS_PASSWORD_PLUGIN_ID,
  WEBTOOLS_JSON_PLUGIN_ID,
  WEBTOOLS_JSON_SCHEMA_PLUGIN_ID,
  WEBTOOLS_DATA_MASK_PLUGIN_ID,
  WEBTOOLS_URL_PLUGIN_ID,
  WEBTOOLS_DIFF_PLUGIN_ID,
  WEBTOOLS_TIMESTAMP_PLUGIN_ID,
  WEBTOOLS_TRANSLATE_PLUGIN_ID,
  DICTIONARY_PLUGIN_ID,
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
  CODEAGENT_SWITCH_PLUGIN_ID
} = pluginConstants;

function createHardwareInspectorMetricGrid(
  items: Array<{ label: string; value: string; changed?: boolean }>
): HTMLDivElement {
  const grid = document.createElement("div");
  grid.className = "hardware-inspector-metric-grid";

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "hardware-inspector-metric";
    if (item.changed) {
      row.dataset.changed = "true";
    }
    const label = document.createElement("div");
    label.className = "hardware-inspector-metric-label";
    label.textContent = item.label;
    const value = document.createElement("div");
    value.className = "hardware-inspector-metric-value";
    value.textContent = item.value;
    row.append(label, value);
    grid.appendChild(row);
  });

  return grid;
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0
});
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
  compressed: false,
  preview: null,
  errorPosition: null,
  selectedFields: []
};
type WebtoolsJsonSchemaValidationError = {
  path: string;
  message: string;
};
let webtoolsJsonSchemaText = JSON.stringify(
  {
    type: "object",
    required: ["name", "age"],
    properties: {
      name: { type: "string", minLength: 1 },
      age: { type: "integer", minimum: 0 }
    },
    additionalProperties: false
  },
  null,
  2
);
let webtoolsJsonSchemaPayload = JSON.stringify({ name: "Alice", age: 28 }, null, 2);
let webtoolsJsonSchemaValid: boolean | null = null;
let webtoolsJsonSchemaInfo = "";
let webtoolsJsonSchemaErrors: WebtoolsJsonSchemaValidationError[] = [];
let webtoolsJsonSchemaAutoTimer: number | null = null;
let webtoolsJsonSchemaRequestToken = 0;
type WebtoolsDataMaskFakeKind = "name" | "email" | "phone" | "uuid" | "company";
let webtoolsDataMaskInput =
  "联系人：张三，手机 13812345678，邮箱 zhangsan@example.com，身份证 110101199001011234";
let webtoolsDataMaskOutput = "";
let webtoolsDataMaskInfo = "";
let webtoolsDataMaskPhone = true;
let webtoolsDataMaskEmail = true;
let webtoolsDataMaskIdCard = true;
let webtoolsDataMaskFakeKind: WebtoolsDataMaskFakeKind = "uuid";
let webtoolsDataMaskFakeCount = 5;
let webtoolsDataMaskMode: "mask" | "generate" = "mask";
const DEFAULT_WEBTOOLS_URL_INPUT =
  "https://www.example.com:8080/path/to/page?name=test&id=123#section-1";
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
let webtoolsJsonAutoTimer: number | null = null;
let webtoolsPasswordRequestToken = 0;
let webtoolsJsonRequestToken = 0;
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
// Tracks the algorithm picker's outside-click listener so it can be torn
// down from cleanupPluginPanelTransientState even if the panel is replaced
// (e.g. via renderList()) while the menu is still open.
let removeActiveCryptoAlgorithmMenuListener: (() => void) | null = null;
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
let webtoolsColorsAutoTimer: number | null = null;
let webtoolsColorsRequestToken = 0;
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
    label: "提取 URL",
    pattern: "https?://[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-_~:/?#[\\]@!$&'()*+,;=.]+",
    flags: "g"
  }
] as const;
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
const PASSWORD_LENGTH_MIN = 4;
const PASSWORD_LENGTH_MAX = 64;
const PASSWORD_COUNT_MIN = 1;
const PASSWORD_COUNT_MAX = 20;
const WEBTOOLS_PASSWORD_COUNT_MAX = 50;

let passwordPanelOptions: PasswordGeneratorOptions = {
  length: 16,
  includeSymbols: true,
  count: 1
};
let passwordPanelGenerated: string[] = [];
let cashflowState: CashflowState | null = null;
let cashflowReports: CashflowReports | null = null;
let cashflowReviewMode = false;
let cashflowJobs: CashflowJobOption[] = [];

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
    role: typeof record.role === "string" ? record.role : undefined,
    review: record.review === true
  };
}

function formatMoney(value: number): string {
  return CURRENCY_FORMATTER.format(value);
}

function formatPercent(value: number): string {
  const percent = value * 100;
  return `${percent.toFixed(1)}%`;
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

function buildPasswordGenerateTarget(options: PasswordGeneratorOptions): string {
  const params = new URLSearchParams();
  params.set("action", "generate");
  params.set("length", String(options.length));
  params.set("symbols", options.includeSymbols ? "1" : "0");
  params.set("count", String(options.count));
  return `command:plugin:password-generator?${params.toString()}`;
}

function extractGeneratedPasswords(result: ExecuteResult): string[] {
  const raw = result.data?.passwords;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter(
    (value): value is string => typeof value === "string" && value.length > 0
  );
}

function createPasswordResultRow(passwords: string[]): HTMLDivElement {
  const outputRow = document.createElement("div");
  outputRow.className = "password-output-row";

  const outputLabel = document.createElement("div");
  outputLabel.className = "settings-row-label";
  outputLabel.textContent = "\u751f\u6210\u7ed3\u679c";

  const resultList = document.createElement("div");
  resultList.className = "password-result-list";

  if (passwords.length === 0) {
    const empty = document.createElement("div");
    empty.className = "password-result-empty";
    empty.textContent = "\u70b9\u51fb\u751f\u6210\u540e\uff0c\u7ed3\u679c\u4f1a\u663e\u793a\u5728\u8fd9\u91cc";
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
      copyButton.textContent = "\u590d\u5236";
      copyButton.addEventListener("click", () => {
        void (async () => {
          const copied = await copyTextToClipboard(password);
          if (copied) {
            setStatus(`\u5df2\u590d\u5236\u7b2c ${index + 1} \u6761\u5bc6\u7801`);
            return;
          }
          setStatus("\u590d\u5236\u5931\u8d25\uff0c\u8bf7\u624b\u52a8\u590d\u5236");
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

function renderStandalonePasswordPanelView(): void {
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

function openStandalonePasswordPanel(
  draft?: Partial<PasswordGeneratorOptions>
): void {
  passwordPanelOptions = normalizePasswordOptions(draft ?? {}, passwordPanelOptions);
  passwordPanelGenerated = [];
  setMode("password");
  void refreshEntries("");
}

function cashflowPhaseLabel(phase: CashflowPhase): string {
  return phase === "freedom-phase"
    ? "\u8d22\u5bcc\u81ea\u7531\u9636\u6bb5"
    : "\u8001\u9f20\u8d5b\u8dd1\u9636\u6bb5";
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

function buildCashflowReviewScore(state: CashflowState, reports: CashflowReports | null): number {
  const totalExpenses = state.expenses + state.debtPayment;
  const freedomRatio =
    totalExpenses > 0 ? Math.min(1, state.passiveIncome / totalExpenses) : state.passiveIncome > 0 ? 1 : 0;
  const assetScore = Math.min(1, state.assets.length / 6);
  const turnPenalty = Math.max(0, 1 - state.turn / 80);
  let outcomeBonus = 0;
  if (state.won) {
    outcomeBonus = 0.25;
  } else if (state.lost) {
    outcomeBonus = -0.15;
  }
  const debtPenalty =
    reports && reports.balanceSheet.debtsTotal > 0
      ? Math.min(0.2, reports.metrics.debtRatio * 0.2)
      : 0;
  const raw =
    freedomRatio * 55 + assetScore * 20 + turnPenalty * 10 + outcomeBonus * 100 - debtPenalty * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function buildCashflowReviewAdvice(state: CashflowState, score: number): string {
  if (state.won) {
    return "本局已达成财务自由，可复盘哪些资产组合最有效，并尝试更高难度职业或 AI 对战。";
  }
  if (state.lost) {
    return state.lossReason
      ? `失败主因：${state.lossReason}。下一局优先控制负债、保留现金储备，并避免连续大额贷款投资。`
      : "本局已失败，下一局优先控制负债并提高被动收入覆盖总支出的比例。";
  }
  if (score >= 75) {
    return "节奏良好，继续优先选择能显著提升被动收入的机会，并留意现金储备是否足够应对突发支出。";
  }
  if (score >= 45) {
    return "已有积累但尚未脱离老鼠赛跑，建议减少无效跳过，聚焦现金流为正且回本周期短的机会。";
  }
  return "开局阶段建议先稳定现金流，避免过早加杠杆；每回合都记录机会成本，再决定是否买入。";
}

function renderCashflowReviewPanelView(state: CashflowState, reports: CashflowReports | null): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel cashflow-panel cashflow-panel-review";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = "现金流复盘";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent = "按时间线回顾本局关键决策，并查看结算总结。";

  const score = buildCashflowReviewScore(state, reports);
  const summaryCard = document.createElement("section");
  summaryCard.className = "cashflow-review-summary";
  const summaryTitle = document.createElement("h4");
  summaryTitle.className = "cashflow-block-title";
  summaryTitle.textContent = "结算总结";
  const scoreNode = document.createElement("div");
  scoreNode.className = "cashflow-review-score";
  scoreNode.textContent = `综合评分 ${score} / 100`;
  const adviceNode = document.createElement("p");
  adviceNode.className = "cashflow-review-advice";
  adviceNode.textContent = buildCashflowReviewAdvice(state, score);
  const metaNode = document.createElement("div");
  metaNode.className = "cashflow-review-meta";
  metaNode.textContent =
    `${state.role} · 第 ${state.turn} 回合 · ${cashflowPhaseLabel(state.phase)} · ` +
    `被动收入 ${formatMoney(state.passiveIncome)}/月 · 现金 ${formatMoney(state.cash)}`;
  summaryCard.append(summaryTitle, scoreNode, adviceNode, metaNode);

  const timelineBlock = document.createElement("section");
  timelineBlock.className = "cashflow-block cashflow-block-review-timeline";
  const timelineTitle = document.createElement("h4");
  timelineTitle.className = "cashflow-block-title";
  timelineTitle.textContent = "决策时间线";
  timelineBlock.appendChild(timelineTitle);

  const timelineList = document.createElement("ol");
  timelineList.className = "cashflow-review-timeline";
  const timelineEntries = [...state.logs].reverse();
  for (const entry of timelineEntries) {
    const item = document.createElement("li");
    item.className = "cashflow-review-timeline-item";
    item.textContent = entry;
    timelineList.appendChild(item);
  }
  if (timelineEntries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "cashflow-empty";
    empty.textContent = "暂无决策记录，先进行几回合游戏后再复盘。";
    timelineBlock.appendChild(empty);
  } else {
    timelineBlock.appendChild(timelineList);
  }

  if (state.aiEnabled && state.aiPlayers.length > 0) {
    const aiBlock = document.createElement("section");
    aiBlock.className = "cashflow-block";
    const aiTitle = document.createElement("h4");
    aiTitle.className = "cashflow-block-title";
    aiTitle.textContent = "AI 对手摘要";
    aiBlock.appendChild(aiTitle);
    const aiList = document.createElement("ul");
    aiList.className = "cashflow-review-ai-list";
    for (const aiPlayer of state.aiPlayers) {
      const item = document.createElement("li");
      item.textContent =
        `${aiPlayer.name} · 现金 ${formatMoney(aiPlayer.cash)} · 被动收入 ${formatMoney(aiPlayer.passiveIncome)}/月 · ` +
        `最近决策：${aiPlayer.lastDecision ?? "暂无"}`;
      aiList.appendChild(item);
    }
    aiBlock.appendChild(aiList);
    panel.append(title, description, summaryCard, timelineBlock, aiBlock);
  } else {
    panel.append(title, description, summaryCard, timelineBlock);
  }

  const actions = document.createElement("div");
  actions.className = "settings-actions cashflow-actions";
  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "settings-btn settings-btn-primary";
  backButton.textContent = "返回游戏面板";
  backButton.addEventListener("click", () => {
    cashflowReviewMode = false;
    renderList();
  });
  const refreshButton = document.createElement("button");
  refreshButton.type = "button";
  refreshButton.className = "settings-btn settings-btn-secondary";
  refreshButton.textContent = "刷新复盘";
  refreshButton.addEventListener("click", () => {
    void refreshStandaloneCashflowPanel().then((ok) => {
      if (ok) {
        renderList();
      }
    });
  });
  actions.append(backButton, refreshButton);
  panel.appendChild(actions);

  panelItem.appendChild(panel);
  list.appendChild(panelItem);
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
    empty.textContent = "\u6682\u65e0\u6761\u76ee";
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

function renderStandaloneCashflowPanelView(): void {
  const state = cashflowState;
  const reports = cashflowReports;
  if (state && cashflowReviewMode) {
    renderCashflowReviewPanelView(state, reports);
    return;
  }

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
  const freedomProgress = Math.max(0, Math.min(1, state.passiveIncome / freedomTarget));
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
      const assetsCount = aiPlayer.assets.reduce((sum, asset) => sum + asset.count, 0);

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
        createCashflowBadge(`\u56de\u672c ${paybackMonths.toFixed(1)} \u6708`, "info")
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
      createCashflowMetricRow("\u8d44\u4ea7", formatMoney(reports.balanceSheet.assetsTotal)),
      createCashflowMetricRow("\u8d1f\u503a", formatMoney(reports.balanceSheet.debtsTotal)),
      createCashflowMetricRow("\u51c0\u8d44\u4ea7", formatMoney(reports.balanceSheet.netWorth))
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
      createCashflowMetricRow("\u8d1f\u503a\u7387", formatPercent(reports.metrics.debtRatio)),
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

async function refreshStandaloneCashflowPanel(): Promise<boolean> {
  const result = await executeCashflowAction("state");
  return Boolean(result || cashflowState);
}

async function openStandaloneCashflowPanel(
  reset = false,
  options?: { reviewMode?: boolean }
): Promise<void> {
  cashflowReviewMode = options?.reviewMode === true;
  setMode("cashflow");
  if (reset) {
    await executeCashflowAction("reset");
  } else {
    await executeCashflowAction("state");
    if (cashflowState?.lost) {
      const roleKey = cashflowState.jobKey.trim() || undefined;
      const roleName = cashflowState.role;
      const restarted = await executeCashflowAction("reset", { roleKey });
      if (restarted) {
        setStatus(
          `\u68c0\u6d4b\u5230\u4e0a\u5c40\u5df2\u7ed3\u675f\uff0c\u5df2\u81ea\u52a8\u65b0\u5f00\u4e00\u5c40${roleKey ? `\uff08${roleName}\uff09` : ""}`
        );
      }
    }
  }
  renderList();
}

type CodeAgentSwitchDiagnosticView = {
  id: string;
  level: "error" | "warning" | "info";
  message: string;
  suggestion: string;
};

type CodeAgentSwitchProviderView = {
  id: string;
  name?: string;
  baseUrl?: string;
  wireApi?: string;
  envKey?: string;
  envKeyInstructions?: string;
  requiresOpenAiAuth?: boolean;
  requestMaxRetries?: number;
  streamMaxRetries?: number;
  streamIdleTimeoutMs?: number;
  supportsWebsockets?: boolean;
  httpHeaders?: Record<string, string>;
  envHttpHeaders?: Record<string, string>;
  queryParams?: Record<string, string>;
};

type CodeAgentSwitchProfileView = {
  id: string;
  name?: string;
  providerId?: string;
  model?: string;
  reviewModel?: string;
  modelReasoningEffort?: string;
  planModeReasoningEffort?: string;
  modelReasoningSummary?: string;
  modelVerbosity?: string;
  serviceTier?: string;
  webSearch?: string;
  modelAutoCompactTokenLimit?: number;
};

type CodeAgentSwitchBackupView = {
  id: string;
  fileName?: string;
  path?: string;
  sizeBytes?: number;
  createdAtMs?: number;
};

type CodeAgentSwitchToolView = {
  id: string;
  label: string;
  status: "ready" | "planned";
  description: string;
};

type CodeAgentSwitchProfileMatchView = {
  profileId: string;
  level: "exact" | "partial" | "none";
  matchedFields?: string[];
  mismatchedFields?: string[];
};

let codeAgentSwitchData: {
  tool?: string;
  tools?: CodeAgentSwitchToolView[];
  exists?: boolean;
  configPath?: string;
  configSource?: string;
  rootSource?: string;
  config?: {
    profile?: string;
    modelProvider?: string;
    model?: string;
    reviewModel?: string;
    openaiBaseUrl?: string;
    modelReasoningEffort?: string;
    planModeReasoningEffort?: string;
    modelReasoningSummary?: string;
    modelVerbosity?: string;
    modelSupportsReasoningSummaries?: boolean;
    serviceTier?: string;
    webSearch?: string;
    modelContextWindow?: number;
    modelAutoCompactTokenLimit?: number;
    approvalPolicy?: string;
    approvalsReviewer?: string;
    allowLoginShell?: boolean;
    sandboxMode?: string;
    defaultPermissions?: string;
    disableResponseStorage?: boolean;
    networkAccess?: string;
    personality?: string;
    projectDocMaxBytes?: number;
    toolOutputTokenLimit?: number;
    windowsWslSetupAcknowledged?: boolean;
    history?: {
      persistence?: string;
      maxBytes?: number;
    };
    windows?: {
      sandbox?: string;
      sandboxPrivateDesktop?: boolean;
    };
    providers?: CodeAgentSwitchProviderView[];
    profiles?: CodeAgentSwitchProfileView[];
  };
  active?: {
    activeProviderId?: string;
    activeProvider?: CodeAgentSwitchProviderView;
    activeProfileId?: string;
    activeProfile?: CodeAgentSwitchProfileView;
    activeSource?: {
      kind?: "root" | "embedded" | "standalone" | "snapshot";
      profileId?: string;
      label?: string;
      detail?: string;
      legacy?: boolean;
    };
    activeProfileMatch?: "exact" | "partial" | "none";
    matchedFields?: string[];
    profileMatches?: CodeAgentSwitchProfileMatchView[];
  };
  diagnostics?: CodeAgentSwitchDiagnosticView[];
  envCommands?: Record<string, string>;
  backups?: CodeAgentSwitchBackupView[];
  preview: {
    profileId?: string;
    providerId?: string;
    changedFields?: string[];
    diffLines?: string[];
  };
  rootChangedFields?: string[];
  applied?: boolean;
  restored?: boolean;
  savedProvider?: boolean;
  deletedProvider?: boolean;
  setProviderKey?: boolean;
  keyAppliedEnvKey?: string;
  savedProfile?: boolean;
  savedRuntime?: boolean;
  deletedProfile?: boolean;
  backupPath?: string;
  restoredBackupPath?: string;
  error?: string;
} = { preview: {} };
let codeAgentSwitchCopyState: "" | "env" | "diagnostics" | "diff" | "key" = "";
type CodeAgentSwitchSelectedKind = "provider" | "profile";
let codeAgentSwitchSelectedKind: CodeAgentSwitchSelectedKind = "profile";
let codeAgentSwitchSelectedId = "";
let codeAgentSwitchSelectionMode: "auto" | "manual" = "auto";

function getCodeAgentSwitchDataFromPanel(panel: unknown): typeof codeAgentSwitchData {
  const record = panel && typeof panel === "object" ? (panel as { data?: unknown }) : {};
  const data = record.data && typeof record.data === "object" ? record.data : {};
  const nextData = data as typeof codeAgentSwitchData;
  if (!nextData.preview) {
    nextData.preview = {};
  }
  return nextData;
}

function getCodeAgentSwitchProviders(): CodeAgentSwitchProviderView[] {
  return codeAgentSwitchData.config?.providers ?? [];
}

function getCodeAgentSwitchProfiles(): CodeAgentSwitchProfileView[] {
  return codeAgentSwitchData.config?.profiles ?? [];
}

function isCodeAgentSwitchSelectedEntityPresent(
  kind: CodeAgentSwitchSelectedKind,
  id: string
): boolean {
  if (!id) {
    return true;
  }
  return kind === "provider"
    ? getCodeAgentSwitchProviders().some((provider) => provider.id === id)
    : getCodeAgentSwitchProfiles().some((profile) => profile.id === id);
}

function chooseDefaultCodeAgentSwitchSelection(): void {
  const providers = getCodeAgentSwitchProviders();
  const profiles = getCodeAgentSwitchProfiles();
  const active = codeAgentSwitchData.active ?? {};
  const exactProfileId =
    active.activeProfileId ??
    active.profileMatches?.find((match) => match.level === "exact")?.profileId;

  if (exactProfileId && profiles.some((profile) => profile.id === exactProfileId)) {
    codeAgentSwitchSelectedKind = "profile";
    codeAgentSwitchSelectedId = exactProfileId;
    return;
  }

  const previewProfileId = codeAgentSwitchData.preview?.profileId;
  if (previewProfileId && profiles.some((profile) => profile.id === previewProfileId)) {
    codeAgentSwitchSelectedKind = "profile";
    codeAgentSwitchSelectedId = previewProfileId;
    return;
  }

  const partialProfileId = active.profileMatches?.find((match) => match.level === "partial")?.profileId;
  if (partialProfileId && profiles.some((profile) => profile.id === partialProfileId)) {
    codeAgentSwitchSelectedKind = "profile";
    codeAgentSwitchSelectedId = partialProfileId;
    return;
  }

  if (profiles[0]) {
    codeAgentSwitchSelectedKind = "profile";
    codeAgentSwitchSelectedId = profiles[0].id;
    return;
  }

  const activeProviderId = active.activeProviderId ?? codeAgentSwitchData.config?.modelProvider;
  if (activeProviderId && providers.some((provider) => provider.id === activeProviderId)) {
    codeAgentSwitchSelectedKind = "provider";
    codeAgentSwitchSelectedId = activeProviderId;
    return;
  }

  if (providers[0]) {
    codeAgentSwitchSelectedKind = "provider";
    codeAgentSwitchSelectedId = providers[0].id;
    return;
  }

  codeAgentSwitchSelectedKind = "profile";
  codeAgentSwitchSelectedId = "";
}

function syncCodeAgentSwitchSelectionFromData(): void {
  if (
    codeAgentSwitchSelectionMode === "manual" &&
    isCodeAgentSwitchSelectedEntityPresent(codeAgentSwitchSelectedKind, codeAgentSwitchSelectedId)
  ) {
    return;
  }
  codeAgentSwitchSelectionMode = "auto";
  chooseDefaultCodeAgentSwitchSelection();
}

function selectCodeAgentSwitchDetail(kind: CodeAgentSwitchSelectedKind, id: string): void {
  codeAgentSwitchSelectedKind = kind;
  codeAgentSwitchSelectedId = id;
  codeAgentSwitchSelectionMode = "manual";
  syncCodeAgentSwitchSelectionUi();
}

function getCodeAgentSwitchForm(): HTMLFormElement | null {
  return list.querySelector<HTMLFormElement>("form.codeagent-switch-form");
}

function syncCodeAgentSwitchSelectionUi(): void {
  const form = getCodeAgentSwitchForm();
  const shell = form?.querySelector<HTMLElement>(".codeagent-switch-shell");
  if (!form || !shell) {
    renderList();
    return;
  }

  const config = codeAgentSwitchData.config ?? {};
  const active = codeAgentSwitchData.active ?? {};
  const providers = config.providers ?? [];
  const profiles = config.profiles ?? [];

  const nextListPanel = createCodeAgentSwitchListPanel(profiles, active, config);
  const nextDetailPanel = createCodeAgentSwitchDetailPanel(
    providers,
    profiles,
    active,
    config
  );

  const currentListPanel = shell.querySelector(".codeagent-switch-list-panel");
  const currentDetailPanel = shell.querySelector(".codeagent-switch-detail-panel");
  if (!currentListPanel || !currentDetailPanel) {
    renderList();
    return;
  }

  shell.replaceChild(nextListPanel, currentListPanel);
  shell.replaceChild(nextDetailPanel, currentDetailPanel);
}

function createCodeAgentSwitchMetric(labelText: string, valueText: string): HTMLDivElement {
  const item = document.createElement("div");
  item.className = "codeagent-switch-metric";
  const label = document.createElement("div");
  label.className = "codeagent-switch-metric-label";
  label.textContent = labelText;
  const value = document.createElement("div");
  value.className = "codeagent-switch-metric-value";
  value.textContent = valueText || "未配置";
  item.append(label, value);
  return item;
}

function createCodeAgentSwitchCommandItem(labelText: string, commandText: string): HTMLDivElement {
  const item = document.createElement("div");
  item.className = "codeagent-switch-command";
  const label = document.createElement("div");
  label.className = "codeagent-switch-command-label";
  label.textContent = labelText;
  const code = document.createElement("code");
  code.className = "codeagent-switch-command-code";
  code.textContent = commandText;
  item.append(label, code);
  return item;
}

function createCodeAgentSwitchPill(text: string, tone: "active" | "muted" = "muted"): HTMLSpanElement {
  const pill = document.createElement("span");
  pill.className = "codeagent-switch-active-pill";
  pill.dataset.tone = tone;
  pill.textContent = text;
  return pill;
}

function createCodeAgentSwitchStateBadge(
  text: string,
  tone: "active" | "selected" | "muted" = "muted"
): HTMLSpanElement {
  const badge = document.createElement("span");
  badge.className = "codeagent-switch-state-badge";
  badge.dataset.tone = tone;
  badge.textContent = text;
  return badge;
}

function createCodeAgentSwitchOverviewItem(labelText: string, valueText: string): HTMLDivElement {
  const item = document.createElement("div");
  item.className = "codeagent-switch-overview-item";
  const label = document.createElement("span");
  label.className = "codeagent-switch-overview-label";
  label.textContent = labelText;
  const value = document.createElement("span");
  value.className = "codeagent-switch-overview-value";
  value.textContent = valueText || "未配置";
  item.append(label, value);
  return item;
}

function createCodeAgentSwitchDetailOverview(
  items: Array<{ label: string; value: string | undefined }>
): HTMLDivElement {
  const grid = document.createElement("div");
  grid.className = "codeagent-switch-detail-overview";
  for (const item of items) {
    grid.appendChild(createCodeAgentSwitchOverviewItem(item.label, item.value ?? ""));
  }
  return grid;
}

function deriveCodeAgentSwitchEnvKeyName(providerId: string): string {
  const normalized = providerId
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
  return `CODEAGENT_${normalized || "PROVIDER"}_API_KEY`;
}

function deriveCodeAgentSwitchProviderName(providerId: string, baseUrl = ""): string {
  const host = (() => {
    try {
      return baseUrl ? new URL(baseUrl).hostname : "";
    } catch {
      return "";
    }
  })();
  const hostPart = host
    .split(".")
    .find((part) => part && !["api", "gateway", "www", "v1"].includes(part.toLowerCase()));
  const source = hostPart || providerId || "provider";
  const words = source
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const readable = words
    .map((word) =>
      word.toLowerCase() === "openai"
        ? "OpenAI"
        : `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`
    )
    .join(" ");
  return readable || "Provider";
}

function deriveCodeAgentSwitchProviderId(source: string): string {
  const host = (() => {
    try {
      return source ? new URL(source).hostname : "";
    } catch {
      return "";
    }
  })();
  const raw = host || source || "provider";
  const normalized = raw
    .replace(/\.[^.]+$/u, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  return normalized || "provider";
}

function makeUniqueCodeAgentSwitchId(baseId: string, existingIds: Set<string>): string {
  const base = deriveCodeAgentSwitchProviderId(baseId);
  if (!existingIds.has(base)) {
    return base;
  }
  let index = 2;
  while (existingIds.has(`${base}_${index}`)) {
    index += 1;
  }
  return `${base}_${index}`;
}

function createCodeAgentSwitchInput(
  labelText: string,
  name: string,
  value: string | number | undefined,
  placeholder = "",
  type = "text"
): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "codeagent-switch-editor-field";
  const text = document.createElement("span");
  text.textContent = labelText;
  const input = document.createElement("input");
  input.className = "settings-value webtools-tool-input";
  input.name = name;
  input.type = type;
  input.value = value === undefined ? "" : String(value);
  input.placeholder = placeholder;
  label.append(text, input);
  return label;
}

function createCodeAgentSwitchTextarea(
  labelText: string,
  name: string,
  value: string | undefined,
  placeholder = ""
): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "codeagent-switch-editor-field codeagent-switch-editor-field-wide";
  const text = document.createElement("span");
  text.textContent = labelText;
  const textarea = document.createElement("textarea");
  textarea.className = "settings-value webtools-tool-input codeagent-switch-textarea";
  textarea.name = name;
  textarea.value = value ?? "";
  textarea.placeholder = placeholder;
  label.append(text, textarea);
  return label;
}

function createCodeAgentSwitchSelect(
  labelText: string,
  name: string,
  value: string | undefined,
  options: Array<{ value: string; label: string }>
): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "codeagent-switch-editor-field";
  const text = document.createElement("span");
  text.textContent = labelText;
  const select = document.createElement("select");
  select.className = "settings-value webtools-tool-input";
  select.name = name;
  const normalizedOptions = [...options];
  if (value && !normalizedOptions.some((option) => option.value === value)) {
    normalizedOptions.unshift({ value, label: `当前：${value}` });
  }
  for (const option of normalizedOptions) {
    const node = document.createElement("option");
    node.value = option.value;
    node.textContent = option.label;
    select.appendChild(node);
  }
  select.value = value ?? "";
  label.append(text, select);
  return label;
}

function createCodeAgentSwitchCheckbox(
  labelText: string,
  name: string,
  checked: boolean | undefined
): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "codeagent-switch-editor-field";
  const text = document.createElement("span");
  text.textContent = labelText;
  const input = document.createElement("input");
  input.name = name;
  input.type = "checkbox";
  input.checked = checked === true;
  label.append(text, input);
  return label;
}

function formatCodeAgentSwitchStringMap(map?: Record<string, string>): string {
  return Object.entries(map ?? {})
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

function getCodeAgentSwitchProfileMatch(
  profileId: string
): CodeAgentSwitchProfileMatchView | undefined {
  return codeAgentSwitchData.active?.profileMatches?.find(
    (item) => item.profileId === profileId
  );
}

function createCodeAgentSwitchToolSidebar(): HTMLDivElement {
  const sidebar = document.createElement("div");
  sidebar.className = "codeagent-switch-tool-sidebar";
  const label = document.createElement("div");
  label.className = "codeagent-switch-sidebar-label";
  label.textContent = "工具";
  const stack = document.createElement("div");
  stack.className = "codeagent-switch-tool-stack";
  const tools =
    codeAgentSwitchData.tools && codeAgentSwitchData.tools.length > 0
      ? codeAgentSwitchData.tools
      : [
          {
            id: "codex",
            label: "Codex",
            status: "ready" as const,
            description: "已接入 config.toml 读写"
          },
          {
            id: "claude-code",
            label: "Claude Code",
            status: "planned" as const,
            description: "Adapter 规划中"
          },
          {
            id: "gemini-cli",
            label: "Gemini CLI",
            status: "planned" as const,
            description: "Adapter 规划中"
          }
        ];
  for (const tool of tools) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "codeagent-switch-tool-button";
    button.dataset.active = String((codeAgentSwitchData.tool || "codex") === tool.id);
    button.dataset.status = tool.status;
    button.setAttribute("aria-pressed", String((codeAgentSwitchData.tool || "codex") === tool.id));
    button.title = tool.description;
    button.disabled = tool.status !== "ready";
    const name = document.createElement("span");
    name.className = "codeagent-switch-tool-name";
    name.textContent = tool.label;
    const state = document.createElement("span");
    state.className = "codeagent-switch-tool-state";
    state.textContent = tool.status === "ready" ? "已接入" : "规划中";
    button.append(name, state);
    stack.appendChild(button);
  }
  sidebar.append(label, stack);
  return sidebar;
}

function createCodeAgentSwitchDetailSection(
  titleText: string,
  descriptionText = "",
  extraClass = ""
): HTMLElement {
  const section = document.createElement("section");
  section.className = `codeagent-switch-detail-section${extraClass ? ` ${extraClass}` : ""}`;
  const head = document.createElement("div");
  head.className = "codeagent-switch-section-head";
  const titleWrap = document.createElement("div");
  titleWrap.className = "codeagent-switch-detail-section-title";
  const title = document.createElement("h3");
  title.textContent = titleText;
  titleWrap.appendChild(title);
  if (descriptionText) {
    const description = document.createElement("div");
    description.className = "codeagent-switch-list-detail";
    description.textContent = descriptionText;
    titleWrap.appendChild(description);
  }
  head.appendChild(titleWrap);
  section.appendChild(head);
  return section;
}

function createCodeAgentSwitchEditorGroup(
  titleText: string,
  ...fields: HTMLElement[]
): HTMLDivElement {
  const group = document.createElement("div");
  group.className = "codeagent-switch-editor-group";

  const title = document.createElement("div");
  title.className = "codeagent-switch-editor-group-title";
  title.textContent = titleText;

  const grid = document.createElement("div");
  grid.className = "codeagent-switch-editor-grid";
  grid.append(...fields);

  group.append(title, grid);
  return group;
}

function createCodeAgentSwitchProviderEditor(
  provider?: CodeAgentSwitchProviderView,
  options?: { showSaveButton?: boolean }
): HTMLDivElement {
  const editor = document.createElement("div");
  editor.className = "codeagent-switch-editor codeagent-switch-provider-editor";
  const providerId =
    provider?.id ??
    makeUniqueCodeAgentSwitchId(
      "relay",
      new Set(getCodeAgentSwitchProviders().map((item) => item.id))
    );
  const derivedEnvKey = provider?.envKey || deriveCodeAgentSwitchEnvKeyName(providerId);

  const grid = document.createElement("div");
  grid.className = "codeagent-switch-editor-grid";
  grid.append(
    createCodeAgentSwitchInput("ID", "providerId", providerId, "自动生成"),
    createCodeAgentSwitchInput(
      "显示名称",
      "providerName",
      provider?.name ?? deriveCodeAgentSwitchProviderName(providerId, provider?.baseUrl),
      "自动生成"
    ),
    createCodeAgentSwitchInput(
      "Base URL",
      "providerBaseUrl",
      provider?.baseUrl,
      "https://relay.example.com/v1"
    ),
    createCodeAgentSwitchInput("wire_api", "providerWireApi", provider?.wireApi || "responses"),
    createCodeAgentSwitchSelect(
      "认证方式",
      "providerAuth",
      provider?.requiresOpenAiAuth ? "openai_auth" : "env_key",
      [
        { value: "env_key", label: "env_key 环境变量" },
        { value: "openai_auth", label: "OpenAI 登录态" }
      ]
    ),
    createCodeAgentSwitchInput(
      "请求重试",
      "providerRequestMaxRetries",
      provider?.requestMaxRetries,
      "可选",
      "number"
    ),
    createCodeAgentSwitchInput(
      "流式重试",
      "providerStreamMaxRetries",
      provider?.streamMaxRetries,
      "可选",
      "number"
    ),
    createCodeAgentSwitchInput(
      "流式超时 ms",
      "providerStreamIdleTimeoutMs",
      provider?.streamIdleTimeoutMs,
      "可选",
      "number"
    ),
    createCodeAgentSwitchInput(
      "env_key_instructions",
      "providerEnvKeyInstructions",
      provider?.envKeyInstructions,
      "例如：在控制台创建 Key 后写入环境变量"
    ),
    createCodeAgentSwitchSelect(
      "WebSocket",
      "providerSupportsWebsockets",
      provider?.supportsWebsockets === true ? "true" : "",
      [
        { value: "", label: "默认" },
        { value: "true", label: "支持" }
      ]
    ),
    createCodeAgentSwitchTextarea(
      "http_headers",
      "providerHttpHeaders",
      formatCodeAgentSwitchStringMap(provider?.httpHeaders),
      "X-App=LiteLauncher\nX-Team=AI"
    ),
    createCodeAgentSwitchTextarea(
      "env_http_headers",
      "providerEnvHttpHeaders",
      formatCodeAgentSwitchStringMap(provider?.envHttpHeaders),
      "Authorization=RELAY_AUTH_HEADER"
    ),
    createCodeAgentSwitchTextarea(
      "query_params",
      "providerQueryParams",
      formatCodeAgentSwitchStringMap(provider?.queryParams),
      "api-version=2026-01-01"
    )
  );
  const providerIdNode = grid.querySelector('[name="providerId"]');
  const providerNameNode = grid.querySelector('[name="providerName"]');
  const providerBaseUrlNode = grid.querySelector('[name="providerBaseUrl"]');
  let syncKeyEnvName = (): void => {};
  const syncProviderGeneratedFields = () => {
    const nextProviderId = providerIdNode instanceof HTMLInputElement ? providerIdNode.value : "";
    const nextBaseUrl = providerBaseUrlNode instanceof HTMLInputElement ? providerBaseUrlNode.value : "";
    if (providerNameNode instanceof HTMLInputElement && !providerNameNode.dataset.userEdited) {
      providerNameNode.value = deriveCodeAgentSwitchProviderName(nextProviderId, nextBaseUrl);
    }
  };
  if (providerNameNode instanceof HTMLInputElement) {
    providerNameNode.addEventListener("input", () => {
      providerNameNode.dataset.userEdited = "true";
    });
  }
  if (providerIdNode instanceof HTMLInputElement) {
    providerIdNode.addEventListener("input", () => {
      providerIdNode.dataset.userEdited = "true";
    });
  }
  if (providerIdNode instanceof HTMLInputElement) {
    providerIdNode.addEventListener("input", syncProviderGeneratedFields);
  }
  if (providerBaseUrlNode instanceof HTMLInputElement) {
    providerBaseUrlNode.addEventListener("input", () => {
      if (!provider && providerIdNode instanceof HTMLInputElement && !providerIdNode.dataset.userEdited) {
        providerIdNode.value = makeUniqueCodeAgentSwitchId(
          providerBaseUrlNode.value,
          new Set(getCodeAgentSwitchProviders().map((item) => item.id))
        );
      }
      syncProviderGeneratedFields();
      syncKeyEnvName();
    });
  }

  const keySection = document.createElement("div");
  keySection.className = "codeagent-switch-key-box";
  const keyHead = document.createElement("div");
  keyHead.className = "codeagent-switch-key-head";
  const keyTitle = document.createElement("div");
  keyTitle.className = "codeagent-switch-key-title";
  keyTitle.textContent = "Key 设置";
  const keyHint = document.createElement("div");
  keyHint.className = "codeagent-switch-list-detail";
  keyHint.textContent = "变量名自动生成，写入 Windows 用户级环境变量，不保存明文 Key。";
  keyHead.append(keyTitle, keyHint);
  const keyGrid = document.createElement("div");
  keyGrid.className = "codeagent-switch-editor-grid codeagent-switch-key-grid";
  keyGrid.append(
    createCodeAgentSwitchInput("自动变量名", "providerEnvKeyAuto", derivedEnvKey, "保存时自动生成"),
    createCodeAgentSwitchInput("API Key（不保存）", "providerApiKey", undefined, "粘贴后写入系统", "password")
  );
  keySection.append(keyHead, keyGrid);
  const keyEnvAutoNode = keyGrid.querySelector('[name="providerEnvKeyAuto"]');
  if (keyEnvAutoNode instanceof HTMLInputElement) {
    keyEnvAutoNode.readOnly = true;
  }
  syncKeyEnvName = () => {
    if (keyEnvAutoNode instanceof HTMLInputElement && providerIdNode instanceof HTMLInputElement) {
      keyEnvAutoNode.value = deriveCodeAgentSwitchEnvKeyName(providerIdNode.value);
    }
  };
  if (providerIdNode instanceof HTMLInputElement) {
    providerIdNode.addEventListener("input", syncKeyEnvName);
  }

  const actions = document.createElement("div");
  actions.className = "codeagent-switch-inline-actions";
  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "settings-btn settings-btn-primary";
  saveButton.textContent = provider ? "保存 Provider" : "新增 Provider";
  saveButton.addEventListener("click", () => {
    void executeCodeAgentSwitchSaveProvider(editor);
  });
  const applyKeyButton = document.createElement("button");
  applyKeyButton.type = "button";
  applyKeyButton.className = "settings-btn settings-btn-primary";
  applyKeyButton.textContent =
    codeAgentSwitchData.setProviderKey && codeAgentSwitchData.keyAppliedEnvKey === derivedEnvKey
      ? "已写入系统 Key"
      : "写入系统 Key";
  applyKeyButton.addEventListener("click", () => {
    void executeCodeAgentSwitchSetProviderKey(editor);
  });
  const copyKeyButton = document.createElement("button");
  copyKeyButton.type = "button";
  copyKeyButton.className = "settings-btn settings-btn-secondary";
  copyKeyButton.textContent = codeAgentSwitchCopyState === "key" ? "已复制 Key 命令" : "复制命令";
  copyKeyButton.addEventListener("click", () => {
    void copyCodeAgentSwitchProviderKeyCommand(editor);
  });
  if (options?.showSaveButton !== false) {
    actions.appendChild(saveButton);
  }
  actions.append(applyKeyButton, copyKeyButton);
  editor.append(grid, keySection, actions);
  return editor;
}

function createCodeAgentSwitchProfileEditor(
  profile?: CodeAgentSwitchProfileView,
  providers: CodeAgentSwitchProviderView[] = [],
  options?: {
    draftProfile?: CodeAgentSwitchProfileView;
    submitLabel?: string;
  }
): HTMLDivElement {
  const seedProfile = profile ?? options?.draftProfile;
  const editor = document.createElement("div");
  editor.className = "codeagent-switch-editor codeagent-switch-profile-editor";

  const providerOptions = [
    { value: "", label: "选择 Provider" },
    ...providers.map((provider) => ({
      value: provider.id,
      label: provider.name ? `${provider.name} (${provider.id})` : provider.id
    }))
  ];
  const grid = document.createElement("div");
  grid.className = "codeagent-switch-editor-grid";
  grid.append(
    createCodeAgentSwitchInput("ID", "profileId", seedProfile?.id, "daily"),
    createCodeAgentSwitchInput("配置名", "profileName", seedProfile?.name, "日常配置"),
    createCodeAgentSwitchSelect(
      "Provider",
      "profileProvider",
      seedProfile?.providerId,
      providerOptions
    ),
    createCodeAgentSwitchInput("模型", "profileModel", seedProfile?.model, "gpt-5.5"),
    createCodeAgentSwitchInput(
      "Review",
      "profileReviewModel",
      seedProfile?.reviewModel,
      "gpt-5.5"
    ),
    createCodeAgentSwitchSelect("Reasoning", "profileReasoning", seedProfile?.modelReasoningEffort, [
      { value: "", label: "默认" },
      { value: "low", label: "low" },
      { value: "medium", label: "medium" },
      { value: "high", label: "high" },
      { value: "xhigh", label: "xhigh" }
    ]),
    createCodeAgentSwitchSelect(
      "Plan reasoning",
      "profilePlanReasoning",
      seedProfile?.planModeReasoningEffort,
      [
        { value: "", label: "默认" },
        { value: "low", label: "low" },
        { value: "medium", label: "medium" },
        { value: "high", label: "high" },
        { value: "xhigh", label: "xhigh" }
      ]
    ),
    createCodeAgentSwitchSelect(
      "Summary",
      "profileReasoningSummary",
      seedProfile?.modelReasoningSummary,
      [
        { value: "", label: "默认" },
        { value: "auto", label: "auto" },
        { value: "concise", label: "concise" },
        { value: "detailed", label: "detailed" },
        { value: "none", label: "none" }
      ]
    ),
    createCodeAgentSwitchSelect("Verbosity", "profileVerbosity", seedProfile?.modelVerbosity, [
      { value: "", label: "默认" },
      { value: "low", label: "low" },
      { value: "medium", label: "medium" },
      { value: "high", label: "high" }
    ]),
    createCodeAgentSwitchSelect("Service tier", "profileServiceTier", seedProfile?.serviceTier, [
      { value: "", label: "默认" },
      { value: "auto", label: "auto" },
      { value: "flex", label: "flex" },
      { value: "fast", label: "fast" }
    ]),
    createCodeAgentSwitchSelect("Web search", "profileWebSearch", seedProfile?.webSearch, [
      { value: "", label: "默认" },
      { value: "disabled", label: "disabled" },
      { value: "cached", label: "cached" },
      { value: "live", label: "live" }
    ]),
    createCodeAgentSwitchInput(
      "Compact token",
      "profileCompactLimit",
      seedProfile?.modelAutoCompactTokenLimit,
      "350000",
      "number"
    )
  );

  const actions = document.createElement("div");
  actions.className = "codeagent-switch-inline-actions";
  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "settings-btn settings-btn-primary";
  saveButton.textContent = profile ? "保存配置组" : options?.submitLabel ?? "新增配置组";
  saveButton.addEventListener("click", () => {
    void executeCodeAgentSwitchSaveProfile(editor);
  });
  actions.appendChild(saveButton);
  editor.append(grid, actions);
  return editor;
}

function createCodeAgentSwitchRuntimeEditor(
  config: NonNullable<typeof codeAgentSwitchData.config>,
  options?: { showSaveButton?: boolean }
): HTMLElement {
  const runtime = createCodeAgentSwitchDetailSection(
    "Root 配置",
    "对应 Codex 官方完整 config.toml 的 Root 字段，保存后会写回最终 Root 配置。",
    "codeagent-switch-runtime"
  );
  const editor = document.createElement("div");
  editor.className = "codeagent-switch-editor codeagent-switch-runtime-editor";
  const modelGroup = createCodeAgentSwitchEditorGroup(
    "模型与接入",
    createCodeAgentSwitchInput("model_provider", "runtimeProvider", config.modelProvider, "relay_1"),
    createCodeAgentSwitchInput("model", "runtimeModel", config.model, "gpt-5"),
    createCodeAgentSwitchInput(
      "review_model",
      "runtimeReviewModel",
      config.reviewModel,
      "gpt-5-mini"
    ),
    createCodeAgentSwitchInput(
      "openai_base_url",
      "runtimeOpenAiBaseUrl",
      config.openaiBaseUrl,
      "https://api.openai.com/v1"
    ),
    createCodeAgentSwitchSelect("service_tier", "runtimeServiceTier", config.serviceTier, [
      { value: "", label: "Default" },
      { value: "auto", label: "auto" },
      { value: "default", label: "default" },
      { value: "flex", label: "flex" },
      { value: "fast", label: "fast" },
      { value: "priority", label: "priority" }
    ])
  );
  const reasoningGroup = createCodeAgentSwitchEditorGroup(
    "推理与上下文",
    createCodeAgentSwitchSelect(
      "model_reasoning_effort",
      "runtimeReasoning",
      config.modelReasoningEffort,
      [
        { value: "", label: "Default" },
        { value: "minimal", label: "minimal" },
        { value: "low", label: "low" },
        { value: "medium", label: "medium" },
        { value: "high", label: "high" },
        { value: "xhigh", label: "xhigh" }
      ]
    ),
    createCodeAgentSwitchSelect(
      "plan_mode_reasoning_effort",
      "runtimePlanReasoning",
      config.planModeReasoningEffort,
      [
        { value: "", label: "Default" },
        { value: "minimal", label: "minimal" },
        { value: "low", label: "low" },
        { value: "medium", label: "medium" },
        { value: "high", label: "high" },
        { value: "xhigh", label: "xhigh" }
      ]
    ),
    createCodeAgentSwitchSelect(
      "model_reasoning_summary",
      "runtimeReasoningSummary",
      config.modelReasoningSummary,
      [
        { value: "", label: "Default" },
        { value: "auto", label: "auto" },
        { value: "brief", label: "brief" },
        { value: "concise", label: "concise" },
        { value: "detailed", label: "detailed" }
      ]
    ),
    createCodeAgentSwitchSelect("model_verbosity", "runtimeVerbosity", config.modelVerbosity, [
      { value: "", label: "Default" },
      { value: "low", label: "low" },
      { value: "medium", label: "medium" },
      { value: "high", label: "high" }
    ]),
    createCodeAgentSwitchSelect(
      "model_supports_reasoning_summaries",
      "runtimeModelSupportsReasoningSummaries",
      config.modelSupportsReasoningSummaries === undefined
        ? ""
        : config.modelSupportsReasoningSummaries
          ? "true"
          : "false",
      [
        { value: "", label: "Default" },
        { value: "true", label: "true" },
        { value: "false", label: "false" }
      ]
    ),
    createCodeAgentSwitchSelect("web_search", "runtimeWebSearch", config.webSearch, [
      { value: "", label: "Default" },
      { value: "disabled", label: "disabled" },
      { value: "cached", label: "cached" },
      { value: "live", label: "live" }
    ]),
    createCodeAgentSwitchInput(
      "model_context_window",
      "runtimeModelContextWindow",
      config.modelContextWindow,
      "200000",
      "number"
    ),
    createCodeAgentSwitchInput(
      "model_auto_compact_token_limit",
      "runtimeCompactLimit",
      config.modelAutoCompactTokenLimit,
      "350000",
      "number"
    ),
    createCodeAgentSwitchInput("personality", "runtimePersonality", config.personality, "pragmatic"),
    createCodeAgentSwitchInput(
      "tool_output_token_limit",
      "runtimeToolOutputTokenLimit",
      config.toolOutputTokenLimit,
      "24000",
      "number"
    )
  );
  const securityGroup = createCodeAgentSwitchEditorGroup(
    "安全与权限",
    createCodeAgentSwitchSelect("approval_policy", "runtimeApprovalPolicy", config.approvalPolicy, [
      { value: "", label: "默认" },
      { value: "untrusted", label: "untrusted" },
      { value: "on-failure", label: "on-failure" },
      { value: "on-request", label: "on-request" },
      { value: "never", label: "never" }
    ]),
    createCodeAgentSwitchInput(
      "approvals_reviewer",
      "runtimeApprovalsReviewer",
      config.approvalsReviewer,
      "auto_review"
    ),
    createCodeAgentSwitchSelect(
      "allow_login_shell",
      "runtimeAllowLoginShell",
      config.allowLoginShell === undefined ? "" : config.allowLoginShell ? "true" : "false",
      [
        { value: "", label: "Default" },
        { value: "true", label: "true" },
        { value: "false", label: "false" }
      ]
    ),
    createCodeAgentSwitchSelect("sandbox_mode", "runtimeSandboxMode", config.sandboxMode, [
      { value: "", label: "默认" },
      { value: "read-only", label: "read-only" },
      { value: "workspace-write", label: "workspace-write" },
      { value: "danger-full-access", label: "danger-full-access" }
    ]),
    createCodeAgentSwitchSelect(
      "default_permissions",
      "runtimeDefaultPermissions",
      config.defaultPermissions,
      [
        { value: "", label: "默认" },
        { value: "trusted", label: "trusted" },
        { value: "untrusted", label: "untrusted" }
      ]
    ),
    createCodeAgentSwitchSelect(
      "disable_response_storage",
      "runtimeDisableResponseStorage",
      config.disableResponseStorage === undefined
        ? ""
        : config.disableResponseStorage
          ? "true"
          : "false",
      [
        { value: "", label: "Default" },
        { value: "true", label: "true" },
        { value: "false", label: "false" }
      ]
    ),
    createCodeAgentSwitchSelect("network_access", "runtimeNetworkAccess", config.networkAccess, [
      { value: "", label: "默认" },
      { value: "enabled", label: "enabled" },
      { value: "restricted", label: "restricted" },
      { value: "disabled", label: "disabled" }
    ])
  );
  const platformGroup = createCodeAgentSwitchEditorGroup(
    "历史与平台",
    createCodeAgentSwitchInput(
      "project_doc_max_bytes",
      "runtimeProjectDocMaxBytes",
      config.projectDocMaxBytes,
      "131072",
      "number"
    ),
    createCodeAgentSwitchSelect(
      "windows_wsl_setup_acknowledged",
      "runtimeWindowsWslSetupAcknowledged",
      config.windowsWslSetupAcknowledged === undefined
        ? ""
        : config.windowsWslSetupAcknowledged
          ? "true"
          : "false",
      [
        { value: "", label: "Default" },
        { value: "true", label: "true" },
        { value: "false", label: "false" }
      ]
    ),
    createCodeAgentSwitchSelect("windows.sandbox", "runtimeWindowsSandbox", config.windows?.sandbox, [
      { value: "", label: "默认" },
      { value: "read-only", label: "read-only" },
      { value: "workspace-write", label: "workspace-write" },
      { value: "elevated", label: "elevated" },
      { value: "unelevated", label: "unelevated" }
    ]),
    createCodeAgentSwitchSelect(
      "windows.private_desktop",
      "runtimeWindowsSandboxPrivateDesktop",
      config.windows?.sandboxPrivateDesktop === undefined
        ? ""
        : config.windows.sandboxPrivateDesktop
          ? "true"
          : "false",
      [
        { value: "", label: "默认" },
        { value: "true", label: "true" },
        { value: "false", label: "false" }
      ]
    ),
    createCodeAgentSwitchSelect(
      "history.persistence",
      "runtimeHistoryPersistence",
      config.history?.persistence,
      [
        { value: "", label: "Default" },
        { value: "none", label: "none" },
        { value: "save-all", label: "save-all" }
      ]
    ),
    createCodeAgentSwitchInput(
      "history.max_bytes",
      "runtimeHistoryMaxBytes",
      config.history?.maxBytes,
      "104857600",
      "number"
    )
  );
  const actions = document.createElement("div");
  actions.className = "codeagent-switch-inline-actions";
  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "settings-btn settings-btn-primary";
  saveButton.textContent = "保存 Root 配置";
  saveButton.addEventListener("click", () => {
    void executeCodeAgentSwitchSaveRuntime(editor);
  });
  if (options?.showSaveButton !== false) {
    actions.appendChild(saveButton);
    editor.append(modelGroup, reasoningGroup, securityGroup, platformGroup, actions);
  } else {
    editor.append(modelGroup, reasoningGroup, securityGroup, platformGroup);
  }
  runtime.appendChild(editor);
  return runtime;
}

function getCodeAgentSwitchProviderSummary(provider: CodeAgentSwitchProviderView): string {
  const auth = provider.envKey || (provider.requiresOpenAiAuth ? "OpenAI 登录态" : "未配置认证");
  return `${provider.id} · ${provider.baseUrl || "未配置 base_url"} · ${auth}`;
}

function getCodeAgentSwitchProfileLabel(profile: CodeAgentSwitchProfileView | undefined): string {
  if (!profile) {
    return "";
  }
  return profile.name || profile.id;
}

function getCodeAgentSwitchProfileSummary(profile: CodeAgentSwitchProfileView): string {
  return `${profile.providerId || "未绑定 Provider"} · ${
    profile.model || "未配置模型"
  } · ${profile.modelReasoningEffort || "默认 reasoning"}`;
}

function getCodeAgentSwitchEffectiveProfile(
  active: NonNullable<typeof codeAgentSwitchData.active>,
  config: NonNullable<typeof codeAgentSwitchData.config>
): CodeAgentSwitchProfileView | undefined {
  const profileId = active.activeProfileId ?? active.activeProfile?.id ?? config.profile;
  return profileId
    ? (config.profiles ?? []).find((profile) => profile.id === profileId)
    : undefined;
}

function getCodeAgentSwitchEffectiveModelInfo(
  active: NonNullable<typeof codeAgentSwitchData.active>,
  config: NonNullable<typeof codeAgentSwitchData.config>
): {
  providerId?: string;
  model?: string;
  reviewModel?: string;
  reasoning?: string;
} {
  const profile = getCodeAgentSwitchEffectiveProfile(active, config);
  return {
    providerId: active.activeProviderId ?? config.modelProvider ?? profile?.providerId,
    model: config.model ?? profile?.model,
    reviewModel: config.reviewModel ?? profile?.reviewModel,
    reasoning: config.modelReasoningEffort ?? profile?.modelReasoningEffort
  };
}

function buildCodeAgentSwitchDraftProfile(
  active: NonNullable<typeof codeAgentSwitchData.active>,
  config: NonNullable<typeof codeAgentSwitchData.config>
): CodeAgentSwitchProfileView {
  const currentProfile = active.activeProfile ?? getCodeAgentSwitchEffectiveProfile(active, config);
  const existingIds = new Set((config.profiles ?? []).map((profile) => profile.id));
  const baseId =
    active.activeProfileId ??
    currentProfile?.id ??
    config.profile ??
    [
      active.activeProviderId ?? config.modelProvider ?? currentProfile?.providerId ?? "current",
      config.model ?? currentProfile?.model ?? "config"
    ]
      .filter(Boolean)
      .join("_");

  return {
    id: makeUniqueCodeAgentSwitchId(baseId || "current_config", existingIds),
    name: currentProfile?.name,
    providerId: active.activeProviderId ?? config.modelProvider ?? currentProfile?.providerId,
    model: config.model ?? currentProfile?.model,
    reviewModel: config.reviewModel ?? currentProfile?.reviewModel,
    modelReasoningEffort: config.modelReasoningEffort ?? currentProfile?.modelReasoningEffort,
    planModeReasoningEffort:
      config.planModeReasoningEffort ?? currentProfile?.planModeReasoningEffort,
    modelReasoningSummary: config.modelReasoningSummary ?? currentProfile?.modelReasoningSummary,
    modelVerbosity: config.modelVerbosity ?? currentProfile?.modelVerbosity,
    serviceTier: config.serviceTier ?? currentProfile?.serviceTier,
    webSearch: config.webSearch ?? currentProfile?.webSearch,
    modelAutoCompactTokenLimit:
      config.modelAutoCompactTokenLimit ?? currentProfile?.modelAutoCompactTokenLimit
  };
}

function getCodeAgentSwitchActiveConfigLabel(
  active: NonNullable<typeof codeAgentSwitchData.active>
): string {
  return active.activeProfileId || active.activeSource?.label || "当前 Root 配置";
}

function openCodeAgentSwitchProviderDetail(providerId?: string): void {
  selectCodeAgentSwitchDetail("provider", providerId ?? "");
}

function createCodeAgentSwitchProviderKeyButton(
  providerId: string | undefined,
  label = "当前 Provider / Key"
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "settings-btn settings-btn-secondary";
  button.textContent = label;
  button.addEventListener("click", () => {
    openCodeAgentSwitchProviderDetail(providerId);
  });
  return button;
}

function createCodeAgentSwitchListButton(
  kind: CodeAgentSwitchSelectedKind,
  id: string,
  titleText: string,
  detailText: string,
  options: {
    active?: boolean;
    selected?: boolean;
    pills?: HTMLSpanElement[];
  } = {}
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "codeagent-switch-list-item codeagent-switch-list-button";
  button.dataset.kind = kind;
  button.dataset.selected = String(Boolean(options.selected));
  if (options.active) {
    button.dataset.active = "true";
  }
  button.addEventListener("click", () => {
    selectCodeAgentSwitchDetail(kind, id);
  });

  const body = document.createElement("div");
  body.className = "codeagent-switch-list-body";
  const titleLine = document.createElement("div");
  titleLine.className = "codeagent-switch-list-title";
  titleLine.textContent = titleText;
  if (options.selected) {
    titleLine.appendChild(createCodeAgentSwitchStateBadge("选中", "selected"));
  }
  if (options.active) {
    titleLine.appendChild(createCodeAgentSwitchStateBadge("当前", "active"));
  }
  for (const pill of options.pills ?? []) {
    titleLine.appendChild(pill);
  }
  const detail = document.createElement("div");
  detail.className = "codeagent-switch-list-detail";
  detail.textContent = detailText;
  body.append(titleLine, detail);
  button.appendChild(body);
  return button;
}

function createCodeAgentSwitchCurrentCard(
  active: NonNullable<typeof codeAgentSwitchData.active>,
  config: NonNullable<typeof codeAgentSwitchData.config>,
  profiles: CodeAgentSwitchProfileView[]
): HTMLElement {
  const effective = getCodeAgentSwitchEffectiveModelInfo(active, config);
  const providerDetailTargetId = effective.providerId;
  const card = document.createElement("section");
  card.className = "codeagent-switch-current-card";
  const head = document.createElement("div");
  head.className = "codeagent-switch-current-head";
  const titleWrap = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = "当前配置";
  const subtitle = document.createElement("div");
  subtitle.className = "codeagent-switch-list-detail";
  subtitle.textContent =
    active.activeProfileId || active.activeProfileMatch === "partial"
      ? active.activeProfileId
        ? `${active.activeProfileId} · exact`
        : `partial · ${(active.matchedFields ?? []).join(", ") || "字段匹配"}`
      : "当前配置未绑定配置组";
  titleWrap.append(title, subtitle);
  head.append(titleWrap, createCodeAgentSwitchStateBadge("生效中", "active"));

  if (providerDetailTargetId || profiles.length === 0) {
    const currentActions = document.createElement("div");
    currentActions.className = "codeagent-switch-current-actions";
    currentActions.appendChild(
      createCodeAgentSwitchProviderKeyButton(
        providerDetailTargetId,
        providerDetailTargetId ? "当前 Provider / Key" : "新增 Provider / Key"
      )
    );
    if (profiles.length === 0) {
      subtitle.textContent = "当前还没有独立配置组，仍在使用 Root 配置";
      const addConfigButton = document.createElement("button");
      addConfigButton.type = "button";
      addConfigButton.className = "settings-btn settings-btn-secondary";
      addConfigButton.textContent = "从当前配置生成配置组";
      addConfigButton.addEventListener("click", () => {
        selectCodeAgentSwitchDetail("profile", "");
      });
      currentActions.appendChild(addConfigButton);
    }
    head.appendChild(currentActions);
  }

  const overview = createCodeAgentSwitchDetailOverview([
    { label: "Provider", value: effective.providerId },
    { label: "Model", value: effective.model },
    { label: "Review", value: effective.reviewModel },
    { label: "Reasoning", value: effective.reasoning }
  ]);
  card.append(head, overview);
  return card;
}

function createCodeAgentSwitchListPanel(
  profiles: CodeAgentSwitchProfileView[],
  active: NonNullable<typeof codeAgentSwitchData.active>,
  config: NonNullable<typeof codeAgentSwitchData.config>
): HTMLDivElement {
  const createFromCurrentLabel =
    profiles.length === 0 ? "从当前配置生成配置组" : "新增配置组";
  const listPanel = document.createElement("div");
  listPanel.className = "codeagent-switch-list-panel";
  listPanel.appendChild(createCodeAgentSwitchCurrentCard(active, config, profiles));
  const profileSection = document.createElement("section");
  profileSection.className = "codeagent-switch-section codeagent-switch-profile-list";
  const profileHead = document.createElement("div");
  profileHead.className = "codeagent-switch-section-head";
  const profileTitle = document.createElement("h3");
  profileTitle.textContent = "配置组";
  const addConfigButton = document.createElement("button");
  addConfigButton.type = "button";
  addConfigButton.className = "settings-btn settings-btn-secondary";
  addConfigButton.textContent = createFromCurrentLabel;
  addConfigButton.addEventListener("click", () => {
    selectCodeAgentSwitchDetail("profile", "");
  });
  profileHead.append(profileTitle, addConfigButton);
  profileSection.appendChild(profileHead);

  const profileItems = document.createElement("div");
  profileItems.className = "codeagent-switch-profile-list-items";

  if (profiles.length === 0) {
    const empty = document.createElement("div");
    empty.className = "codeagent-switch-list-item codeagent-switch-empty-state";
    const emptyTitle = document.createElement("div");
    emptyTitle.className = "codeagent-switch-list-title";
    emptyTitle.textContent = "当前还没有配置组";
    const emptyDetail = document.createElement("div");
    emptyDetail.className = "codeagent-switch-list-detail";
    emptyDetail.textContent = `当前生效配置仍然来自 Root 配置（${
      codeAgentSwitchData.configPath ?? "~/.codex/config.toml"
    }）。`;
    const emptyTip = document.createElement("div");
    emptyTip.className = "codeagent-switch-empty-tip";
    emptyTip.textContent = "点下面的按钮，可直接把当前配置另存为一组，后续就能一键切换。";
    const emptyActions = document.createElement("div");
    emptyActions.className = "codeagent-switch-empty-actions";
    const createButton = document.createElement("button");
    createButton.type = "button";
    createButton.className = "settings-btn settings-btn-secondary";
    createButton.textContent = createFromCurrentLabel;
    createButton.addEventListener("click", () => {
      selectCodeAgentSwitchDetail("profile", "");
    });
    emptyActions.appendChild(createButton);
    empty.append(emptyTitle, emptyDetail, emptyTip, emptyActions);
    profileItems.appendChild(empty);
  }

  for (const profile of profiles) {
    const match = getCodeAgentSwitchProfileMatch(profile.id);
    const isActive = match?.level === "exact";
    const isSelected =
      codeAgentSwitchSelectedKind === "profile" && codeAgentSwitchSelectedId === profile.id;
    const pills: HTMLSpanElement[] = [];
    if (match?.level === "exact") {
      pills.push(createCodeAgentSwitchPill("当前 exact", "active"));
    } else if (match?.level === "partial") {
      pills.push(createCodeAgentSwitchPill("部分匹配", "muted"));
    }
    if (profile.id === codeAgentSwitchData.preview?.profileId) {
      pills.push(createCodeAgentSwitchPill("已预览", "muted"));
    }
    const row = createCodeAgentSwitchListButton(
      "profile",
      profile.id,
      profile.name || profile.id,
      getCodeAgentSwitchProfileSummary(profile),
      {
        active: isActive,
        selected: isSelected,
        pills
      }
    );
    const actions = document.createElement("div");
    actions.className = "codeagent-switch-list-switch-actions";
    const previewButton = document.createElement("button");
    previewButton.type = "button";
    previewButton.className = "settings-btn settings-btn-secondary";
    previewButton.textContent = "预览";
    previewButton.addEventListener("click", (event) => {
      event.stopPropagation();
      void executeCodeAgentSwitchAction("preview", profile.id);
    });
    const applyButton = document.createElement("button");
    applyButton.type = "button";
    applyButton.className = "settings-btn settings-btn-primary";
    applyButton.textContent = isActive ? "当前" : "设为当前";
    applyButton.disabled = isActive;
    applyButton.addEventListener("click", (event) => {
      event.stopPropagation();
      void executeCodeAgentSwitchAction("apply", profile.id);
    });
    actions.append(previewButton, applyButton);
    row.appendChild(actions);
    profileItems.appendChild(row);
  }
  profileSection.appendChild(profileItems);
  listPanel.appendChild(profileSection);
  return listPanel;
}

function createCodeAgentSwitchPreviewSection(): HTMLElement {
  const preview = createCodeAgentSwitchDetailSection(
    "切换预览",
    "Profile 应用前先看 managed fields 的 diff，确认后再写入。",
    "codeagent-switch-preview"
  );
  const head = preview.querySelector(".codeagent-switch-section-head");
  const copyDiffButton = document.createElement("button");
  copyDiffButton.type = "button";
  copyDiffButton.className = "settings-btn settings-btn-secondary";
  copyDiffButton.textContent = codeAgentSwitchCopyState === "diff" ? "已复制" : "复制 diff";
  copyDiffButton.disabled = !(codeAgentSwitchData.preview?.diffLines ?? []).length;
  copyDiffButton.addEventListener("click", () => {
    void copyCodeAgentSwitchText(
      "diff",
      (codeAgentSwitchData.preview?.diffLines ?? []).join("\n"),
      "已复制 diff",
      "暂无可复制的 diff"
    );
  });
  head?.appendChild(copyDiffButton);

  const previewMeta = document.createElement("div");
  previewMeta.className = "codeagent-switch-preview-meta";
  const currentPreview = codeAgentSwitchData.preview;
  previewMeta.textContent = currentPreview?.profileId
    ? `Profile ${currentPreview.profileId || "-"} · Provider ${
        currentPreview.providerId || "-"
      } · 字段 ${(currentPreview.changedFields ?? []).join(", ") || "无变化"}`
    : "选择 Profile 后先生成 diff 预览。";
  const diff = document.createElement("pre");
  diff.className = "codeagent-switch-diff";
  diff.textContent = (codeAgentSwitchData.preview?.diffLines ?? []).join("\n") || "暂无 diff";
  preview.append(previewMeta, diff);
  if (codeAgentSwitchData.backupPath) {
    const backup = document.createElement("div");
    backup.className = "codeagent-switch-backup";
    backup.textContent = codeAgentSwitchData.restored
      ? `恢复前备份：${codeAgentSwitchData.backupPath}`
      : `备份：${codeAgentSwitchData.backupPath}`;
    preview.appendChild(backup);
  }
  return preview;
}

function createCodeAgentSwitchRootPreviewSection(): HTMLElement {
  const rootPreviewTitle = "完整 config.toml";
  const rootSaveLabel = "保存 Root 配置";
  const section = createCodeAgentSwitchDetailSection(
    "Root 预览",
    "完整 config.toml 预览，用来确认 Root 配置最终保存后的结果。",
    "codeagent-switch-root-preview"
  );
  const head = section.querySelector(".codeagent-switch-section-head");
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "settings-btn settings-btn-secondary";
  copyButton.textContent = codeAgentSwitchCopyState === "diff" ? "已复制" : "复制 config.toml";
  copyButton.disabled = !(codeAgentSwitchData.rootSource ?? codeAgentSwitchData.configSource ?? "").trim();
  copyButton.addEventListener("click", () => {
    void copyCodeAgentSwitchText(
      "diff",
      codeAgentSwitchData.rootSource ?? codeAgentSwitchData.configSource ?? "",
      `已复制${rootPreviewTitle}`,
      "当前没有可复制的 config.toml"
    );
  });
  head?.appendChild(copyButton);

  const meta = document.createElement("div");
  meta.className = "codeagent-switch-preview-meta";
  meta.textContent = `${rootPreviewTitle} · ${rootSaveLabel}`;

  const rootChangedFields = codeAgentSwitchData.rootChangedFields ?? [];
  const summary = document.createElement("div");
  summary.className = "codeagent-switch-root-preview-summary";
  if (rootChangedFields.length > 0) {
    const changedHead = document.createElement("div");
    changedHead.className = "codeagent-switch-preview-meta";
    changedHead.textContent = `最近更新 ${rootChangedFields.length} 个 Root 字段`;
    const changedList = document.createElement("div");
    changedList.className = "codeagent-switch-root-change-list";
    for (const field of rootChangedFields) {
      changedList.appendChild(createCodeAgentSwitchStateBadge(field, "selected"));
    }
    summary.append(changedHead, changedList);
  } else {
    const empty = document.createElement("div");
    empty.className = "codeagent-switch-preview-meta";
    empty.textContent = "保存后会在这里显示最近更新的 Root 字段。";
    summary.appendChild(empty);
  }

  const source = document.createElement("pre");
  source.className = "codeagent-switch-config-source codeagent-switch-root-source";
  source.textContent =
    codeAgentSwitchData.rootSource ??
    codeAgentSwitchData.configSource ??
    "暂无 config.toml 内容";

  section.append(meta, summary, source);
  return section;
}

const CODEAGENT_SWITCH_ROOT_SECTION_TITLE = "保存 Root 配置";

function createCodeAgentSwitchDiagnosticsSection(): HTMLElement {
  const diagnostics = createCodeAgentSwitchDetailSection(
    "诊断",
    "集中显示认证、Provider、项目级覆盖等风险。",
    "codeagent-switch-diagnostics"
  );
  const head = diagnostics.querySelector(".codeagent-switch-section-head");
  const copyDiagnosticsButton = document.createElement("button");
  copyDiagnosticsButton.type = "button";
  copyDiagnosticsButton.className = "settings-btn settings-btn-secondary";
  copyDiagnosticsButton.textContent = codeAgentSwitchCopyState === "diagnostics" ? "已复制" : "复制诊断";
  copyDiagnosticsButton.addEventListener("click", () => {
    const text = (codeAgentSwitchData.diagnostics ?? [])
      .map((item) => `[${item.id}] ${item.level}: ${item.message} - ${item.suggestion}`)
      .join("\n");
    void copyCodeAgentSwitchText("diagnostics", text, "已复制诊断报告", "暂无可复制的诊断报告");
  });
  head?.appendChild(copyDiagnosticsButton);

  const items = codeAgentSwitchData.diagnostics ?? [];
  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "codeagent-switch-list-item";
    empty.textContent = "暂无诊断问题";
    diagnostics.appendChild(empty);
  }
  for (const item of items) {
    const row = document.createElement("div");
    row.className = "codeagent-switch-diagnostic";
    row.dataset.level = item.level;
    row.textContent = `[${item.id}] ${item.message}；${item.suggestion}`;
    diagnostics.appendChild(row);
  }
  return diagnostics;
}

function createCodeAgentSwitchCommandsSection(): HTMLElement {
  const commands = createCodeAgentSwitchDetailSection(
    "环境变量命令",
    "只生成设置命令，不保存真实 API Key。",
    "codeagent-switch-env-commands"
  );
  const head = commands.querySelector(".codeagent-switch-section-head");
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "settings-btn settings-btn-secondary";
  copyButton.textContent = codeAgentSwitchCopyState === "env" ? "已复制" : "复制命令";
  copyButton.addEventListener("click", () => {
    const text = Object.entries(codeAgentSwitchData.envCommands ?? {})
      .map(([label, value]) => `${label}: ${value}`)
      .join("\n");
    void copyCodeAgentSwitchText("env", text, "已复制环境变量命令", "暂无可复制的环境变量命令");
  });
  head?.appendChild(copyButton);

  const entries = Object.entries(codeAgentSwitchData.envCommands ?? {});
  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "codeagent-switch-list-item";
    empty.textContent = "暂无环境变量命令";
    commands.appendChild(empty);
  }
  for (const [label, command] of entries) {
    commands.appendChild(createCodeAgentSwitchCommandItem(label, command));
  }
  return commands;
}

function createCodeAgentSwitchBackupsSection(): HTMLElement {
  const backups = createCodeAgentSwitchDetailSection(
    "备份",
    "应用和恢复前都会保留当前 config.toml。",
    "codeagent-switch-backups"
  );
  const head = backups.querySelector(".codeagent-switch-section-head");
  const refreshBackupsButton = document.createElement("button");
  refreshBackupsButton.type = "button";
  refreshBackupsButton.className = "settings-btn settings-btn-secondary";
  refreshBackupsButton.textContent = "刷新备份";
  refreshBackupsButton.addEventListener("click", () => {
    void executeCodeAgentSwitchAction("backups");
  });
  head?.appendChild(refreshBackupsButton);

  const backupItems = codeAgentSwitchData.backups ?? [];
  if (backupItems.length === 0) {
    const emptyBackup = document.createElement("div");
    emptyBackup.className = "codeagent-switch-list-item";
    emptyBackup.textContent = "暂无插件创建的配置备份";
    backups.appendChild(emptyBackup);
  }
  for (const backup of backupItems) {
    const row = document.createElement("div");
    row.className = "codeagent-switch-list-item codeagent-switch-backup-item";
    if (backup.path === codeAgentSwitchData.restoredBackupPath) {
      row.dataset.active = "true";
    }
    const body = document.createElement("div");
    body.className = "codeagent-switch-list-body";
    body.textContent = `${backup.fileName || backup.id} · ${formatCodeAgentSwitchBackupSize(
      backup.sizeBytes
    )} · ${formatCodeAgentSwitchBackupTime(backup.createdAtMs)}`;
    const actions = document.createElement("div");
    actions.className = "codeagent-switch-inline-actions";
    const restoreButton = document.createElement("button");
    restoreButton.type = "button";
    restoreButton.className = "settings-btn settings-btn-secondary";
    restoreButton.textContent = "恢复";
    restoreButton.addEventListener("click", () => {
      void executeCodeAgentSwitchAction("restore", undefined, backup.id);
    });
    actions.appendChild(restoreButton);
    row.append(body, actions);
    backups.appendChild(row);
  }
  return backups;
}

function createCodeAgentSwitchDetailPanel(
  providers: CodeAgentSwitchProviderView[],
  profiles: CodeAgentSwitchProfileView[],
  active: NonNullable<typeof codeAgentSwitchData.active>,
  config: NonNullable<typeof codeAgentSwitchData.config>
): HTMLElement {
  const detailPanel = document.createElement("div");
  detailPanel.className = "codeagent-switch-detail-panel";

  const selectedProvider =
    codeAgentSwitchSelectedKind === "provider"
      ? providers.find((provider) => provider.id === codeAgentSwitchSelectedId)
      : undefined;
  const selectedProfile =
    codeAgentSwitchSelectedKind === "profile"
      ? profiles.find((profile) => profile.id === codeAgentSwitchSelectedId)
      : undefined;
  const draftProfile =
    codeAgentSwitchSelectedKind === "profile" && !selectedProfile && profiles.length === 0
      ? buildCodeAgentSwitchDraftProfile(active, config)
      : undefined;
  const profileDetail = selectedProfile ?? draftProfile;
  const providerDetailTargetId =
    profileDetail?.providerId ?? active.activeProviderId ?? config.modelProvider;
  const selectedProviderIsActive =
    Boolean(selectedProvider?.id) &&
    (selectedProvider?.id === active.activeProviderId ||
      selectedProvider?.id === config.modelProvider);
  const isProviderDetail = codeAgentSwitchSelectedKind === "provider";
  const providerDetailEditor = isProviderDetail
    ? createCodeAgentSwitchProviderEditor(selectedProvider, {
        showSaveButton: false
      })
    : undefined;
  const providerDetailRuntimeEditor = isProviderDetail
    ? createCodeAgentSwitchRuntimeEditor(config, {
        showSaveButton: false
      })
    : undefined;

  const hero = document.createElement("section");
  hero.className = "codeagent-switch-detail-section codeagent-switch-detail-hero";
  const head = document.createElement("div");
  head.className = "codeagent-switch-section-head";
  const titleWrap = document.createElement("div");
  titleWrap.className = "codeagent-switch-detail-title";
  const title = document.createElement("h3");
  title.textContent = isProviderDetail
    ? selectedProvider
      ? selectedProvider.name || selectedProvider.id
      : "新增 Provider"
      : profileDetail
        ? getCodeAgentSwitchProfileLabel(profileDetail)
        : "新增配置组";
  const subtitle = document.createElement("div");
  subtitle.className = "codeagent-switch-list-detail";
  subtitle.textContent = isProviderDetail
    ? selectedProvider
      ? selectedProviderIsActive
        ? `${getCodeAgentSwitchActiveConfigLabel(
            active
          )} 正在使用的底层 Provider · ${getCodeAgentSwitchProviderSummary(selectedProvider)}`
        : getCodeAgentSwitchProviderSummary(selectedProvider)
      : "配置当前配置组使用的底层 Provider 连接、登录态和接口参数"
    : selectedProfile
      ? getCodeAgentSwitchProfileSummary(selectedProfile)
      : draftProfile
        ? "当前仍在使用 Root 配置，这里已按当前配置预填，可直接另存为独立配置组。"
        : "新增一组完整配置，绑定 Provider、模型、review、reasoning 和 compact 限制";
  titleWrap.append(title, subtitle);

  const pills = document.createElement("div");
  pills.className = "codeagent-switch-detail-pills";
  pills.appendChild(createCodeAgentSwitchPill("已选中", "muted"));
  let selectedProfileIsActive = false;
  if (isProviderDetail) {
    const providerId = selectedProvider?.id ?? "";
    if (providerId && selectedProviderIsActive) {
      pills.appendChild(createCodeAgentSwitchPill("当前 Provider", "active"));
    }
  } else if (selectedProfile) {
    const match = getCodeAgentSwitchProfileMatch(selectedProfile.id);
    selectedProfileIsActive = match?.level === "exact";
    if (match?.level === "exact") {
      pills.appendChild(createCodeAgentSwitchPill("当前配置组", "active"));
    } else if (match?.level === "partial") {
      pills.appendChild(createCodeAgentSwitchPill("部分匹配", "muted"));
    }
  } else if (draftProfile) {
    pills.appendChild(createCodeAgentSwitchPill("当前配置草稿", "muted"));
  }
  const heroAside = document.createElement("div");
  heroAside.className = "codeagent-switch-detail-hero-aside";
  heroAside.appendChild(pills);
  if (isProviderDetail) {
    const heroActions = document.createElement("div");
    heroActions.className = "codeagent-switch-detail-hero-actions";
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "settings-btn settings-btn-primary";
    saveButton.textContent = "Save Provider + Root";
    saveButton.addEventListener("click", () => {
      if (providerDetailEditor && providerDetailRuntimeEditor) {
        void executeCodeAgentSwitchSaveProviderAndRuntime(
          providerDetailEditor,
          providerDetailRuntimeEditor
        );
      }
    });
    heroActions.appendChild(saveButton);
    heroAside.appendChild(heroActions);
  } else if (profileDetail) {
    const heroActions = document.createElement("div");
    heroActions.className = "codeagent-switch-detail-hero-actions";
    heroActions.appendChild(
      createCodeAgentSwitchProviderKeyButton(
        providerDetailTargetId,
        providerDetailTargetId ? "当前 Provider / Key" : "新增 Provider / Key"
      )
    );
    if (selectedProfile) {
      const previewButton = document.createElement("button");
      previewButton.type = "button";
      previewButton.className = "settings-btn settings-btn-secondary";
      previewButton.textContent = "预览";
      previewButton.addEventListener("click", () => {
        void executeCodeAgentSwitchAction("preview", selectedProfile.id);
      });
      const applyButton = document.createElement("button");
      applyButton.type = "button";
      applyButton.className = "settings-btn settings-btn-primary";
      applyButton.textContent = selectedProfileIsActive ? "当前配置" : "设为当前";
      applyButton.disabled = selectedProfileIsActive;
      applyButton.addEventListener("click", () => {
        void executeCodeAgentSwitchAction("apply", selectedProfile.id);
      });
      heroActions.append(previewButton, applyButton);
    }
    heroAside.appendChild(heroActions);
  }
  head.append(titleWrap, heroAside);
  hero.appendChild(head);
  hero.appendChild(
    createCodeAgentSwitchDetailOverview(
      isProviderDetail
        ? [
            { label: "ID", value: selectedProvider?.id ?? codeAgentSwitchSelectedId },
            { label: "Base URL", value: selectedProvider?.baseUrl },
            { label: "Auth", value: selectedProvider?.requiresOpenAiAuth ? "OpenAI 登录态" : "env_key" },
            { label: "env_key", value: selectedProvider?.envKey }
          ]
        : [
            { label: "ID", value: profileDetail?.id ?? codeAgentSwitchSelectedId },
            { label: "Provider", value: profileDetail?.providerId },
            { label: "Model", value: profileDetail?.model },
            { label: "Reasoning", value: profileDetail?.modelReasoningEffort }
          ]
    )
  );
  detailPanel.appendChild(hero);

  if (isProviderDetail) {
    const providerConfig = createCodeAgentSwitchDetailSection(
      "Provider 配置",
      "管理 base_url、wire_api、认证方式、headers、query 和 env_key 名称。"
    );
    if (providerDetailEditor) {
      providerConfig.appendChild(providerDetailEditor);
    }
    detailPanel.appendChild(providerConfig);
    detailPanel.append(
      providerDetailRuntimeEditor ?? createCodeAgentSwitchRuntimeEditor(config),
      createCodeAgentSwitchRootPreviewSection(),
      createCodeAgentSwitchCommandsSection(),
      createCodeAgentSwitchDiagnosticsSection(),
      createCodeAgentSwitchBackupsSection()
    );
    if (selectedProvider) {
      const danger = createCodeAgentSwitchDetailSection(
        "危险区",
        "删除 Provider 不会删除真实环境变量，但会改写 Codex 配置。",
        "codeagent-switch-danger-zone"
      );
      const actions = document.createElement("div");
      actions.className = "codeagent-switch-inline-actions codeagent-switch-detail-actions";
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "settings-btn settings-btn-secondary";
      deleteButton.textContent = "删除 Provider";
      deleteButton.disabled =
        selectedProvider.id === active.activeProviderId || selectedProvider.id === config.modelProvider;
      deleteButton.addEventListener("click", () => {
        void executeCodeAgentSwitchDeleteProvider(selectedProvider.id);
      });
      actions.appendChild(deleteButton);
      danger.appendChild(actions);
      detailPanel.appendChild(danger);
    }
    return detailPanel;
  }

  const profileConfig = createCodeAgentSwitchDetailSection(
    "配置组",
    "新增或调整一组完整配置。Provider 在这里作为依赖项选择，不再单独作为主切换对象。"
  );
  profileConfig.appendChild(
    createCodeAgentSwitchProfileEditor(selectedProfile, providers, {
      draftProfile,
      submitLabel: draftProfile ? "从当前配置生成配置组" : undefined
    })
  );
  detailPanel.appendChild(profileConfig);
  if (selectedProfile) {
    const switchActions = createCodeAgentSwitchDetailSection(
      "切换操作",
      "先预览 diff，再应用到 Codex config.toml。",
      "codeagent-switch-detail-primary-actions"
    );
    const actions = document.createElement("div");
    actions.className = "codeagent-switch-inline-actions codeagent-switch-detail-actions";
    const previewButton = document.createElement("button");
    previewButton.type = "button";
    previewButton.className = "settings-btn settings-btn-secondary";
    previewButton.textContent = "预览切换";
    previewButton.addEventListener("click", () => {
      void executeCodeAgentSwitchAction("preview", selectedProfile.id);
    });
    const applyButton = document.createElement("button");
    applyButton.type = "button";
    applyButton.className = "settings-btn settings-btn-primary";
    applyButton.textContent = selectedProfileIsActive ? "当前配置" : "设为当前";
    applyButton.disabled = selectedProfileIsActive;
    applyButton.addEventListener("click", () => {
      void executeCodeAgentSwitchAction("apply", selectedProfile.id);
    });
    actions.append(previewButton, applyButton);
    switchActions.appendChild(actions);
    detailPanel.appendChild(switchActions);
  }
  detailPanel.append(
    createCodeAgentSwitchRuntimeEditor(config),
    createCodeAgentSwitchRootPreviewSection(),
    createCodeAgentSwitchPreviewSection(),
    createCodeAgentSwitchDiagnosticsSection(),
    createCodeAgentSwitchBackupsSection(),
    createCodeAgentSwitchCommandsSection()
  );
  if (selectedProfile) {
    const danger = createCodeAgentSwitchDetailSection(
      "危险区",
      "删除配置组只移除这组预设，不会清理真实环境变量。",
      "codeagent-switch-danger-zone"
    );
    const actions = document.createElement("div");
    actions.className = "codeagent-switch-inline-actions codeagent-switch-detail-actions";
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "settings-btn settings-btn-secondary";
    deleteButton.textContent = "删除配置组";
    deleteButton.addEventListener("click", () => {
      void executeCodeAgentSwitchDeleteProfile(selectedProfile.id);
    });
    actions.appendChild(deleteButton);
    danger.appendChild(actions);
    detailPanel.appendChild(danger);
  }

  return detailPanel;
}

function renderCodeAgentSwitchPanelV2(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel codeagent-switch-panel";

  const form = document.createElement("form");
  form.className = "settings-form codeagent-switch-form webtools-tool-panel";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeCodeAgentSwitchAction("read");
  });

  const header = document.createElement("div");
  header.className = "webtools-tool-header";
  const titleGroup = document.createElement("div");
  titleGroup.className = "webtools-tool-title-group";
  const title = document.createElement("h2");
  title.className = "webtools-tool-title";
  title.textContent = activePluginPanel?.title || "CodeAgent Switch";
  const subtitle = document.createElement("p");
  subtitle.className = "webtools-tool-subtitle";
  subtitle.textContent = "Codex 配置组管理。新增的是一组完整配置，Provider 作为底层连接资源在配置组里选择。";
  titleGroup.append(title, subtitle);

  const toolbar = document.createElement("div");
  toolbar.className = "webtools-tool-toolbar";
  const refreshButton = document.createElement("button");
  refreshButton.type = "button";
  refreshButton.className = "settings-btn settings-btn-primary";
  refreshButton.textContent = "重新读取";
  refreshButton.dataset.actionKey = "codeagent-switch-read";
  refreshButton.addEventListener("click", () => {
    void executeCodeAgentSwitchAction("read");
  });
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "settings-btn settings-btn-secondary";
  copyButton.textContent = codeAgentSwitchCopyState === "env" ? "已复制" : "复制环境变量命令";
  copyButton.addEventListener("click", () => {
    const text = Object.entries(codeAgentSwitchData.envCommands ?? {})
      .map(([label, value]) => `${label}: ${value}`)
      .join("\n");
    void copyCodeAgentSwitchText("env", text, "已复制环境变量命令", "暂无可复制的环境变量命令");
  });
  const copyDiagnosticsButton = document.createElement("button");
  copyDiagnosticsButton.type = "button";
  copyDiagnosticsButton.className = "settings-btn settings-btn-secondary";
  copyDiagnosticsButton.textContent = codeAgentSwitchCopyState === "diagnostics" ? "已复制" : "复制诊断";
  copyDiagnosticsButton.addEventListener("click", () => {
    const text = (codeAgentSwitchData.diagnostics ?? [])
      .map((item) => `[${item.id}] ${item.level}: ${item.message} - ${item.suggestion}`)
      .join("\n");
    void copyCodeAgentSwitchText("diagnostics", text, "已复制诊断报告", "暂无可复制的诊断报告");
  });
  toolbar.append(refreshButton, copyButton, copyDiagnosticsButton);
  header.append(titleGroup, toolbar);

  const status = document.createElement("div");
  status.className = "codeagent-switch-status";
  const hasSaveSuccess =
    codeAgentSwitchData.savedProvider ||
    codeAgentSwitchData.savedRuntime ||
    codeAgentSwitchData.savedProfile ||
    codeAgentSwitchData.deletedProvider ||
    codeAgentSwitchData.deletedProfile ||
    codeAgentSwitchData.restored ||
    codeAgentSwitchData.applied;
  status.dataset.state =
    codeAgentSwitchData.error
      ? "error"
      : (codeAgentSwitchData.diagnostics ?? []).some((item) => item.level === "error")
        ? "error"
        : (codeAgentSwitchData.diagnostics ?? []).some((item) => item.level === "warning")
          ? "warning"
          : hasSaveSuccess
            ? "ok"
            : "info";
  status.textContent = codeAgentSwitchData.error
    ? `执行失败：${codeAgentSwitchData.error}`
    : codeAgentSwitchData.savedProvider && codeAgentSwitchData.savedRuntime
      ? "已保存 Codex Provider + Root 配置，写入前已备份当前配置。"
      : codeAgentSwitchData.savedProvider
        ? "已保存 Codex Provider 配置，写入前已备份当前配置。"
      : codeAgentSwitchData.setProviderKey
        ? `已写入用户级系统环境变量：${codeAgentSwitchData.keyAppliedEnvKey ?? ""}`
      : codeAgentSwitchData.savedRuntime
        ? "已保存 Codex Root 配置，写入前已备份当前配置。"
      : codeAgentSwitchData.savedProfile
        ? "已保存配置组，写入前已备份当前配置。"
        : codeAgentSwitchData.deletedProvider
          ? "已删除 Provider，写入前已备份当前配置。"
          : codeAgentSwitchData.deletedProfile
            ? "已删除配置组，写入前已备份当前配置。"
            : codeAgentSwitchData.restored
              ? "已从备份恢复 Codex 配置。"
              : codeAgentSwitchData.applied
                ? "已备份并写入 Codex 配置，新会话可能看到不同 Provider / 模型。"
      : codeAgentSwitchData.preview?.profileId
                  ? "已生成切换预览，确认 diff 后再应用。"
                  : "只保存环境变量名，不保存真实 API Key；切换 Provider 可能影响新会话显示。";

  const config = codeAgentSwitchData.config ?? {};
  const active = codeAgentSwitchData.active ?? {};
  const providers = config.providers ?? [];
  const profiles = config.profiles ?? [];
  const effective = getCodeAgentSwitchEffectiveModelInfo(active, config);

  const metrics = document.createElement("div");
  metrics.className = "codeagent-switch-metrics";
  metrics.append(
    createCodeAgentSwitchMetric("配置路径", codeAgentSwitchData.configPath ?? "~/.codex/config.toml"),
    createCodeAgentSwitchMetric("当前 Provider", effective.providerId ?? ""),
    createCodeAgentSwitchMetric("当前模型", effective.model ?? ""),
    createCodeAgentSwitchMetric("Review 模型", effective.reviewModel ?? ""),
    createCodeAgentSwitchMetric("Reasoning", effective.reasoning ?? ""),
    createCodeAgentSwitchMetric(
      "当前配置组",
      active.activeProfileId
        ? `${active.activeProfileId} · exact`
        : active.activeProfileMatch === "partial"
          ? `partial · ${(active.matchedFields ?? []).join(", ")}`
          : ""
    ),
    createCodeAgentSwitchMetric("Provider 数量", String(providers.length)),
    createCodeAgentSwitchMetric("配置组数量", String(profiles.length))
  );

  const shell = document.createElement("div");
  shell.className = "codeagent-switch-shell codeagent-switch-master-detail";
  shell.append(
    createCodeAgentSwitchToolSidebar(),
    createCodeAgentSwitchListPanel(profiles, active, config),
    createCodeAgentSwitchDetailPanel(providers, profiles, active, config)
  );

  form.append(
    header,
    status,
    metrics,
    shell
  );
  panel.appendChild(form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);
}

function renderWebtoolsCronPanelV2(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel webtools-cron-panel";

  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "Cron 生成器";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "定时表达式解析、模板套用与未来执行预览。";

  const cronFieldMeta = getWebtoolsCronFieldMeta();

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

  const toolbar = document.createElement("div");
  toolbar.className = "webtools-cron-toolbar";

  const expressionBlock = document.createElement("label");
  expressionBlock.className = "webtools-cron-expression-block";
  const expressionLabel = document.createElement("span");
  expressionLabel.className = "webtools-cron-expression-label";
  expressionLabel.textContent = "Cron 表达式";
  const expressionInput = document.createElement("input");
  expressionInput.className = "settings-value webtools-cron-expression-input";
  expressionInput.name = "webtoolsCronExpression";
  expressionInput.value = webtoolsCronExpression;
  expressionInput.placeholder = "例如: */15 9-18 * * 1-5";
  expressionInput.addEventListener("input", () => {
    scheduleWebtoolsCronAutoParse(form);
  });
  expressionInput.addEventListener("change", () => {
    scheduleWebtoolsCronAutoParse(form, true);
  });
  const expressionHint = document.createElement("span");
  expressionHint.className = "webtools-cron-expression-hint";
  expressionHint.textContent = "格式: 分 时 日 月 周";
  expressionBlock.append(expressionLabel, expressionInput, expressionHint);

  const toolbarActions = document.createElement("div");
  toolbarActions.className = "webtools-cron-toolbar-actions";

  const randomButton = document.createElement("button");
  randomButton.type = "button";
  randomButton.className = "settings-btn settings-btn-secondary";
  randomButton.textContent = "随机";
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
  copyButton.setAttribute("data-webtools-cron-copy", "expression");
  copyButton.textContent =
    webtoolsCronCopyState === "expression" ? "已复制表达式" : "复制表达式";
  copyButton.addEventListener("click", () => {
    void copyWebtoolsCronText("expression", webtoolsCronExpression, form);
  });

  const copyReadableButton = document.createElement("button");
  copyReadableButton.type = "button";
  copyReadableButton.className = "settings-btn settings-btn-secondary";
  copyReadableButton.setAttribute("data-webtools-cron-copy", "readable");
  copyReadableButton.textContent =
    webtoolsCronCopyState === "readable" ? "已复制说明" : "复制说明";
  copyReadableButton.addEventListener("click", () => {
    void copyWebtoolsCronText(
      "readable",
      webtoolsCronReadable || webtoolsCronErrorMessage,
      form
    );
  });

  const parseButton = document.createElement("button");
  parseButton.type = "submit";
  parseButton.className = "settings-btn settings-btn-primary";
  parseButton.textContent = "解析";

  toolbarActions.append(randomButton, copyButton, copyReadableButton, parseButton);
  toolbar.append(expressionBlock, toolbarActions);

  const workspace = document.createElement("div");
  workspace.className = "webtools-cron-workspace";
  const leftColumn = document.createElement("div");
  leftColumn.className = "webtools-cron-column webtools-cron-column-main";
  const rightColumn = document.createElement("div");
  rightColumn.className = "webtools-cron-column webtools-cron-column-results";

  const templatesSection = document.createElement("section");
  templatesSection.className = "webtools-cron-section";
  const templatesHead = document.createElement("div");
  templatesHead.className = "webtools-cron-section-head";
  const templatesTitle = document.createElement("h4");
  templatesTitle.textContent = "快速模板";
  const templatesMeta = document.createElement("span");
  templatesMeta.className = "webtools-cron-section-meta";
  templatesMeta.textContent = "先套模板，再细调字段";
  templatesHead.append(templatesTitle, templatesMeta);
  const templateGrid = document.createElement("div");
  templateGrid.className = "webtools-cron-template-grid";
  renderWebtoolsCronTemplateGrid(templateGrid, form);

  const templateEditorRow = document.createElement("div");
  templateEditorRow.className = "webtools-cron-template-editor-row";

  const summaryField = document.createElement("label");
  summaryField.className = "webtools-cron-template-editor-field";
  const summaryLabel = document.createElement("span");
  summaryLabel.textContent = "名称";
  const summaryInput = document.createElement("input");
  summaryInput.className = "settings-value";
  summaryInput.name = "webtoolsCronTemplateSummary";
  summaryInput.placeholder = "例如：每 15 分钟";
  summaryField.append(summaryLabel, summaryInput);

  const templateExpressionField = document.createElement("label");
  templateExpressionField.className = "webtools-cron-template-editor-field";
  const templateExpressionLabel = document.createElement("span");
  templateExpressionLabel.textContent = "表达式";
  const templateExpressionInput = document.createElement("input");
  templateExpressionInput.className = "settings-value";
  templateExpressionInput.name = "webtoolsCronTemplateExpression";
  templateExpressionInput.placeholder = "0 */15 * * *";
  templateExpressionField.append(templateExpressionLabel, templateExpressionInput);

  const templateEditorActions = document.createElement("div");
  templateEditorActions.className = "webtools-cron-template-editor-actions";

  const useCurrentExpressionButton = document.createElement("button");
  useCurrentExpressionButton.type = "button";
  useCurrentExpressionButton.className = "settings-btn settings-btn-secondary";
  useCurrentExpressionButton.textContent = "用当前表达式";
  useCurrentExpressionButton.addEventListener("click", () => {
    const expressionNode = form.elements.namedItem("webtoolsCronExpression");
    if (expressionNode instanceof HTMLInputElement) {
      templateExpressionInput.value = expressionNode.value;
    }
    if (!summaryInput.value.trim() && webtoolsCronReadable.trim()) {
      summaryInput.value = webtoolsCronReadable.trim().slice(0, 40);
    }
  });

  const saveTemplateButton = document.createElement("button");
  saveTemplateButton.type = "button";
  saveTemplateButton.className = "settings-btn settings-btn-primary";
  saveTemplateButton.setAttribute("data-webtools-cron-template-save", "true");
  saveTemplateButton.textContent = "保存模板";
  saveTemplateButton.addEventListener("click", () => {
    const editorValues = readWebtoolsCronTemplateEditorValues(form);
    const action: WebtoolsCronTemplateAction = webtoolsCronEditingTemplateKey
      ? "update-template"
      : "save-template";
    void executeWebtoolsCronTemplateAction(
      action,
      {
        summary: editorValues.summary,
        expression: editorValues.expression,
        key: webtoolsCronEditingTemplateKey
      },
      form
    );
  });

  const resetTemplatesButton = document.createElement("button");
  resetTemplatesButton.type = "button";
  resetTemplatesButton.className =
    "settings-btn settings-btn-secondary webtools-cron-template-reset";
  resetTemplatesButton.textContent = "恢复默认";
  resetTemplatesButton.addEventListener("click", () => {
    void executeWebtoolsCronTemplateAction("reset-templates", {}, form);
  });

  templateEditorActions.append(
    useCurrentExpressionButton,
    saveTemplateButton,
    resetTemplatesButton
  );
  templateEditorRow.append(summaryField, templateExpressionField, templateEditorActions);
  templatesSection.append(templatesHead, templateGrid, templateEditorRow);

  const fieldsSection = document.createElement("section");
  fieldsSection.className = "webtools-cron-section";
  const fieldsHead = document.createElement("div");
  fieldsHead.className = "webtools-cron-section-head";
  const fieldsTitle = document.createElement("h4");
  fieldsTitle.textContent = "字段编辑";
  const fieldsMeta = document.createElement("span");
  fieldsMeta.className = "webtools-cron-section-meta";
  fieldsMeta.textContent = "五段式直接改";
  fieldsHead.append(fieldsTitle, fieldsMeta);
  const fieldGrid = document.createElement("div");
  fieldGrid.className = "webtools-cron-field-grid";
  cronFieldMeta.forEach((field) => {
    const card = document.createElement("label");
    card.className = field.hasError
      ? "webtools-cron-field-card is-error"
      : "webtools-cron-field-card";
    card.setAttribute("data-webtools-cron-field-card", field.key);
    const label = document.createElement("span");
    label.className = "webtools-cron-field-label";
    label.textContent = field.label;
    const input = document.createElement("input");
    input.className = "settings-value webtools-cron-field-input";
    input.name = `webtoolsCronField-${field.key}`;
    input.setAttribute("data-webtools-cron-field", field.key);
    input.value = field.value;
    input.addEventListener("input", () => {
      const nextExpression = rebuildWebtoolsCronExpressionFromFields(form);
      const expressionNode = form.elements.namedItem("webtoolsCronExpression");
      if (expressionNode instanceof HTMLInputElement) {
        expressionNode.value = nextExpression;
      }
      scheduleWebtoolsCronAutoParse(form);
    });
    input.addEventListener("change", () => {
      const nextExpression = rebuildWebtoolsCronExpressionFromFields(form);
      const expressionNode = form.elements.namedItem("webtoolsCronExpression");
      if (expressionNode instanceof HTMLInputElement) {
        expressionNode.value = nextExpression;
      }
      scheduleWebtoolsCronAutoParse(form, true);
    });
    const hint = document.createElement("span");
    hint.className = "webtools-cron-field-hint";
    hint.setAttribute("data-webtools-cron-field-hint", field.key);
    hint.textContent = field.hint;
    card.append(label, input, hint);
    fieldGrid.appendChild(card);
  });
  fieldsSection.append(fieldsHead, fieldGrid);

  const guideSection = document.createElement("section");
  guideSection.className = "webtools-cron-section webtools-cron-guide-section";
  const guideHead = document.createElement("div");
  guideHead.className = "webtools-cron-section-head";
  const guideTitle = document.createElement("h4");
  guideTitle.textContent = "语法速览";
  const guideMeta = document.createElement("span");
  guideMeta.className = "webtools-cron-section-meta";
  guideMeta.textContent = "常用符号";
  guideHead.append(guideTitle, guideMeta);
  const guideList = document.createElement("div");
  guideList.className = "webtools-cron-guide-list";
  [
    ["*", "任意值"],
    [",", "多个值"],
    ["-", "范围"],
    ["/", "步进"]
  ].forEach(([token, text]) => {
    const item = document.createElement("div");
    item.className = "webtools-cron-guide-item";
    const tokenNode = document.createElement("code");
    tokenNode.className = "webtools-cron-guide-token";
    tokenNode.textContent = token;
    const textNode = document.createElement("span");
    textNode.className = "webtools-cron-guide-text";
    textNode.textContent = text;
    item.append(tokenNode, textNode);
    guideList.appendChild(item);
  });
  guideSection.append(guideHead, guideList);

  const summaryCard = document.createElement("section");
  summaryCard.className = "webtools-cron-section webtools-cron-summary-card";
  const summaryHead = document.createElement("div");
  summaryHead.className = "webtools-cron-section-head";
  const summaryTitle = document.createElement("h4");
  summaryTitle.textContent = "解析结果";
  const statusBadge = document.createElement("span");
  statusBadge.className = "webtools-cron-status-badge";
  statusBadge.textContent = webtoolsCronReadable ? "已解析" : "待输入";
  summaryHead.append(summaryTitle, statusBadge);
  const summaryText = document.createElement("div");
  summaryText.className = "webtools-cron-summary";
  summaryText.textContent =
    webtoolsCronErrorMessage ||
    webtoolsCronTemplateSummary ||
    webtoolsCronReadable ||
    "编辑表达式后自动解析";
  const readableValue = document.createElement("div");
  readableValue.className = "webtools-cron-readable";
  readableValue.textContent = webtoolsCronReadable || "-";
  const nextValue = document.createElement("span");
  nextValue.className = "webtools-cron-next";
  nextValue.textContent = webtoolsCronNextRun ? `下一次 ${webtoolsCronNextRun}` : "-";
  summaryCard.append(summaryHead, summaryText, readableValue, nextValue);

  const resultsSection = document.createElement("section");
  resultsSection.className = "webtools-cron-section";
  const resultsHead = document.createElement("div");
  resultsHead.className = "webtools-cron-section-head";
  const resultsTitle = document.createElement("h4");
  resultsTitle.textContent = "接下来 7 次";
  const resultsMeta = document.createElement("span");
  resultsMeta.className = "webtools-cron-section-meta";
  resultsMeta.textContent = "未来执行时间";
  resultsHead.append(resultsTitle, resultsMeta);
  const resultsGrid = document.createElement("div");
  resultsGrid.className = "webtools-cron-results-grid";
  const upcomingValue = document.createElement("div");
  upcomingValue.className = "webtools-cron-upcoming-value";
  upcomingValue.textContent =
    webtoolsCronUpcoming.length > 0 ? webtoolsCronUpcoming.join("\n") : "-";
  upcomingValue.style.whiteSpace = "pre-line";
  resultsGrid.appendChild(upcomingValue);
  resultsSection.append(resultsHead, resultsGrid);

  leftColumn.append(templatesSection, fieldsSection);
  rightColumn.append(summaryCard, resultsSection);
  workspace.append(leftColumn, rightColumn);

  form.append(toolbar, workspace, guideSection);
  panel.append(title, description, form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);

  refreshWebtoolsCronResultInForm(form);
  refreshWebtoolsCronTemplatesInForm(form);
  scheduleWebtoolsCronAutoParse(form, true);
}

type CodeAgentSwitchUiAction =
  | "read"
  | "preview"
  | "apply"
  | "backups"
  | "restore"
  | "save-provider"
  | "save-provider-runtime"
  | "set-provider-key"
  | "delete-provider"
  | "save-profile"
  | "save-runtime"
  | "delete-profile";

function buildCodeAgentSwitchTarget(
  action: CodeAgentSwitchUiAction,
  profileId?: string,
  backupId?: string,
  extraParams?: Record<string, string | number | boolean | undefined>
): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("tool", codeAgentSwitchData.tool || "codex");
  if (codeAgentSwitchData.configPath) {
    params.set("configPath", codeAgentSwitchData.configPath);
  }
  if (profileId) {
    params.set("profile", profileId);
  }
  if (backupId) {
    params.set("backup", backupId);
  }
  for (const [key, value] of Object.entries(extraParams ?? {})) {
    if (value === undefined || value === "") {
      continue;
    }
    params.set(key, String(value));
  }
  return `command:plugin:${CODEAGENT_SWITCH_PLUGIN_ID}?${params.toString()}`;
}

async function executeCodeAgentSwitchAction(
  action: CodeAgentSwitchUiAction,
  profileId?: string,
  backupId?: string,
  extraParams?: Record<string, string | number | boolean | undefined>
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行 CodeAgent Switch");
    return;
  }

  const item: LaunchItem = {
    id: `plugin:${CODEAGENT_SWITCH_PLUGIN_ID}:${action}${profileId ? `:${profileId}` : ""}${
      backupId ? `:${backupId}` : ""
    }`,
    type: "command",
    title: "CodeAgent Switch",
    subtitle: "面板执行",
    target: buildCodeAgentSwitchTarget(action, profileId, backupId, extraParams),
    keywords: ["plugin", "codex", "codeagent", "switch", "profile"]
  };

  const result = await launcher.execute(item);
  setStatus(result.message ?? (result.ok ? "CodeAgent Switch 已执行" : "CodeAgent Switch 执行失败"));
}

function getCodeAgentSwitchFormValue(container: HTMLElement, name: string): string {
  const node =
    container instanceof HTMLFormElement
      ? container.elements.namedItem(name)
      : container.querySelector(`[name="${name}"]`);
  if (
    node instanceof HTMLInputElement ||
    node instanceof HTMLSelectElement ||
    node instanceof HTMLTextAreaElement
  ) {
    return node.value.trim();
  }
  return "";
}

function getCodeAgentSwitchOptionalNumber(container: HTMLElement, name: string): number | undefined {
  const value = getCodeAgentSwitchFormValue(container, name);
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildCodeAgentSwitchProviderSavePayload(
  container: HTMLElement
):
  | {
      providerId: string;
      params: Record<string, string | number | boolean | undefined>;
    }
  | undefined {
  const providerId = getCodeAgentSwitchFormValue(container, "providerId");
  if (!providerId) {
    setStatus("请先填写 Provider ID");
    return undefined;
  }
  const auth = getCodeAgentSwitchFormValue(container, "providerAuth") || "env_key";
  const baseUrl = getCodeAgentSwitchFormValue(container, "providerBaseUrl");
  const name =
    getCodeAgentSwitchFormValue(container, "providerName") ||
    deriveCodeAgentSwitchProviderName(providerId, baseUrl);
  return {
    providerId,
    params: {
      provider: providerId,
      name,
      baseUrl,
      wireApi: getCodeAgentSwitchFormValue(container, "providerWireApi") || "responses",
      auth,
      envKey: auth === "openai_auth" ? undefined : deriveCodeAgentSwitchEnvKeyName(providerId),
      envKeyInstructions: getCodeAgentSwitchFormValue(container, "providerEnvKeyInstructions"),
      supportsWebsockets:
        getCodeAgentSwitchFormValue(container, "providerSupportsWebsockets") === "true"
          ? true
          : undefined,
      httpHeaders: getCodeAgentSwitchFormValue(container, "providerHttpHeaders"),
      envHttpHeaders: getCodeAgentSwitchFormValue(container, "providerEnvHttpHeaders"),
      queryParams: getCodeAgentSwitchFormValue(container, "providerQueryParams"),
      requestMaxRetries: getCodeAgentSwitchOptionalNumber(container, "providerRequestMaxRetries"),
      streamMaxRetries: getCodeAgentSwitchOptionalNumber(container, "providerStreamMaxRetries"),
      streamIdleTimeoutMs: getCodeAgentSwitchOptionalNumber(container, "providerStreamIdleTimeoutMs")
    }
  };
}

function buildCodeAgentSwitchRuntimeSavePayload(
  container: HTMLElement
): Record<string, string | number | boolean | undefined> {
  return {
    provider: getCodeAgentSwitchFormValue(container, "runtimeProvider"),
    model: getCodeAgentSwitchFormValue(container, "runtimeModel"),
    reviewModel: getCodeAgentSwitchFormValue(container, "runtimeReviewModel"),
    openaiBaseUrl: getCodeAgentSwitchFormValue(container, "runtimeOpenAiBaseUrl"),
    reasoning: getCodeAgentSwitchFormValue(container, "runtimeReasoning"),
    planReasoning: getCodeAgentSwitchFormValue(container, "runtimePlanReasoning"),
    reasoningSummary: getCodeAgentSwitchFormValue(container, "runtimeReasoningSummary"),
    verbosity: getCodeAgentSwitchFormValue(container, "runtimeVerbosity"),
    modelSupportsReasoningSummaries:
      getCodeAgentSwitchFormValue(container, "runtimeModelSupportsReasoningSummaries") === "true"
        ? true
        : getCodeAgentSwitchFormValue(container, "runtimeModelSupportsReasoningSummaries") === "false"
          ? false
          : undefined,
    serviceTier: getCodeAgentSwitchFormValue(container, "runtimeServiceTier"),
    webSearch: getCodeAgentSwitchFormValue(container, "runtimeWebSearch"),
    modelContextWindow: getCodeAgentSwitchOptionalNumber(container, "runtimeModelContextWindow"),
    compactLimit: getCodeAgentSwitchOptionalNumber(container, "runtimeCompactLimit"),
    approvalPolicy: getCodeAgentSwitchFormValue(container, "runtimeApprovalPolicy"),
    approvalsReviewer: getCodeAgentSwitchFormValue(container, "runtimeApprovalsReviewer"),
    allowLoginShell:
      getCodeAgentSwitchFormValue(container, "runtimeAllowLoginShell") === "true"
        ? true
        : getCodeAgentSwitchFormValue(container, "runtimeAllowLoginShell") === "false"
          ? false
          : undefined,
    sandboxMode: getCodeAgentSwitchFormValue(container, "runtimeSandboxMode"),
    defaultPermissions: getCodeAgentSwitchFormValue(container, "runtimeDefaultPermissions"),
    disableResponseStorage:
      getCodeAgentSwitchFormValue(container, "runtimeDisableResponseStorage") === "true"
        ? true
        : getCodeAgentSwitchFormValue(container, "runtimeDisableResponseStorage") === "false"
          ? false
          : undefined,
    networkAccess: getCodeAgentSwitchFormValue(container, "runtimeNetworkAccess"),
    personality: getCodeAgentSwitchFormValue(container, "runtimePersonality"),
    projectDocMaxBytes: getCodeAgentSwitchOptionalNumber(container, "runtimeProjectDocMaxBytes"),
    toolOutputTokenLimit: getCodeAgentSwitchOptionalNumber(container, "runtimeToolOutputTokenLimit"),
    windowsWslSetupAcknowledged:
      getCodeAgentSwitchFormValue(container, "runtimeWindowsWslSetupAcknowledged") === "true"
        ? true
        : getCodeAgentSwitchFormValue(container, "runtimeWindowsWslSetupAcknowledged") === "false"
          ? false
          : undefined,
    windowsSandbox: getCodeAgentSwitchFormValue(container, "runtimeWindowsSandbox"),
    windowsSandboxPrivateDesktop:
      getCodeAgentSwitchFormValue(container, "runtimeWindowsSandboxPrivateDesktop") === "true"
        ? true
        : getCodeAgentSwitchFormValue(container, "runtimeWindowsSandboxPrivateDesktop") === "false"
          ? false
        : undefined
    ,
    historyPersistence: getCodeAgentSwitchFormValue(container, "runtimeHistoryPersistence"),
    historyMaxBytes: getCodeAgentSwitchOptionalNumber(container, "runtimeHistoryMaxBytes")
  };
}

async function executeCodeAgentSwitchSaveProvider(container: HTMLElement): Promise<void> {
  const providerId = getCodeAgentSwitchFormValue(container, "providerId");
  if (!providerId) {
    setStatus("请先填写 Provider ID");
    return;
  }
  codeAgentSwitchSelectedKind = "provider";
  codeAgentSwitchSelectedId = providerId;
  codeAgentSwitchSelectionMode = "manual";
  const auth = getCodeAgentSwitchFormValue(container, "providerAuth") || "env_key";
  const baseUrl = getCodeAgentSwitchFormValue(container, "providerBaseUrl");
  const name =
    getCodeAgentSwitchFormValue(container, "providerName") ||
    deriveCodeAgentSwitchProviderName(providerId, baseUrl);
  await executeCodeAgentSwitchAction("save-provider", undefined, undefined, {
    provider: providerId,
    name,
    baseUrl,
    wireApi: getCodeAgentSwitchFormValue(container, "providerWireApi") || "responses",
    auth,
    envKey: auth === "openai_auth" ? undefined : deriveCodeAgentSwitchEnvKeyName(providerId),
    envKeyInstructions: getCodeAgentSwitchFormValue(container, "providerEnvKeyInstructions"),
    supportsWebsockets:
      getCodeAgentSwitchFormValue(container, "providerSupportsWebsockets") === "true" ? true : undefined,
    httpHeaders: getCodeAgentSwitchFormValue(container, "providerHttpHeaders"),
    envHttpHeaders: getCodeAgentSwitchFormValue(container, "providerEnvHttpHeaders"),
    queryParams: getCodeAgentSwitchFormValue(container, "providerQueryParams"),
    requestMaxRetries: getCodeAgentSwitchOptionalNumber(container, "providerRequestMaxRetries"),
    streamMaxRetries: getCodeAgentSwitchOptionalNumber(container, "providerStreamMaxRetries"),
    streamIdleTimeoutMs: getCodeAgentSwitchOptionalNumber(container, "providerStreamIdleTimeoutMs")
  });
}

function encodeCodeAgentSwitchUtf8Base64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index] ?? 0);
  }
  return window.btoa(binary);
}

function buildCodeAgentSwitchPowerShellUserEnvScript(
  envKey: string,
  apiKey: string,
  includeCurrentSession = false
): string {
  const envKeyBase64 = encodeCodeAgentSwitchUtf8Base64(envKey);
  const apiKeyBase64 = encodeCodeAgentSwitchUtf8Base64(apiKey);
  const lines = [
    `$envName = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${envKeyBase64}'))`,
    `$envValue = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${apiKeyBase64}'))`
  ];
  if (includeCurrentSession) {
    lines.push('Set-Item -Path ("Env:" + $envName) -Value $envValue');
  }
  lines.push("[System.Environment]::SetEnvironmentVariable($envName, $envValue, 'User')");
  return lines.join("\n");
}

async function copyCodeAgentSwitchProviderKeyCommand(container: HTMLElement): Promise<void> {
  const providerId = getCodeAgentSwitchFormValue(container, "providerId");
  if (!providerId) {
    setStatus("请先填写 Provider ID");
    return;
  }
  const apiKey = getCodeAgentSwitchFormValue(container, "providerApiKey");
  if (!apiKey) {
    setStatus("请先粘贴 API Key，插件只用于复制命令，不会保存它");
    return;
  }
  const envKey = deriveCodeAgentSwitchEnvKeyName(providerId);
  const text = buildCodeAgentSwitchPowerShellUserEnvScript(envKey, apiKey, true);
  await copyCodeAgentSwitchText(
    "key",
    text,
    `已复制 ${envKey} 的 Key 设置命令`,
    "暂无可复制的 Key 设置命令"
  );
}

async function executeCodeAgentSwitchSetProviderKey(container: HTMLElement): Promise<void> {
  const providerId = getCodeAgentSwitchFormValue(container, "providerId");
  if (!providerId) {
    setStatus("请先填写 Provider ID");
    return;
  }
  const apiKey = getCodeAgentSwitchFormValue(container, "providerApiKey");
  if (!apiKey) {
    setStatus("请先粘贴 API Key，插件会写入用户级系统环境变量，不会保存它");
    return;
  }
  const envKey = deriveCodeAgentSwitchEnvKeyName(providerId);
  await executeCodeAgentSwitchAction("set-provider-key", undefined, undefined, {
    provider: providerId,
    envKey,
    apiKey
  });
}

async function executeCodeAgentSwitchDeleteProvider(providerId: string): Promise<void> {
  if (!providerId) {
    setStatus("请先选择 Provider");
    return;
  }
  codeAgentSwitchSelectionMode = "auto";
  await executeCodeAgentSwitchAction("delete-provider", undefined, undefined, {
    provider: providerId
  });
}

async function executeCodeAgentSwitchSaveProfile(container: HTMLElement): Promise<void> {
  const profileId = getCodeAgentSwitchFormValue(container, "profileId");
  if (!profileId) {
    setStatus("请先填写 Profile ID");
    return;
  }
  codeAgentSwitchSelectedKind = "profile";
  codeAgentSwitchSelectedId = profileId;
  codeAgentSwitchSelectionMode = "manual";
  await executeCodeAgentSwitchAction("save-profile", profileId, undefined, {
    profileName: getCodeAgentSwitchFormValue(container, "profileName"),
    provider: getCodeAgentSwitchFormValue(container, "profileProvider"),
    model: getCodeAgentSwitchFormValue(container, "profileModel"),
    reviewModel: getCodeAgentSwitchFormValue(container, "profileReviewModel"),
    reasoning: getCodeAgentSwitchFormValue(container, "profileReasoning"),
    planReasoning: getCodeAgentSwitchFormValue(container, "profilePlanReasoning"),
    reasoningSummary: getCodeAgentSwitchFormValue(container, "profileReasoningSummary"),
    verbosity: getCodeAgentSwitchFormValue(container, "profileVerbosity"),
    serviceTier: getCodeAgentSwitchFormValue(container, "profileServiceTier"),
    webSearch: getCodeAgentSwitchFormValue(container, "profileWebSearch"),
    compactLimit: getCodeAgentSwitchOptionalNumber(container, "profileCompactLimit")
  });
}

async function executeCodeAgentSwitchSaveRuntime(container: HTMLElement): Promise<void> {
  await executeCodeAgentSwitchAction(
    "save-runtime",
    undefined,
    undefined,
    buildCodeAgentSwitchRuntimeSavePayload(container)
  );
}

async function executeCodeAgentSwitchSaveProviderAndRuntime(
  providerContainer: HTMLElement,
  runtimeContainer: HTMLElement
): Promise<void> {
  const providerPayload = buildCodeAgentSwitchProviderSavePayload(providerContainer);
  if (!providerPayload) {
    return;
  }
  codeAgentSwitchSelectedKind = "provider";
  codeAgentSwitchSelectedId = providerPayload.providerId;
  codeAgentSwitchSelectionMode = "manual";
  await executeCodeAgentSwitchAction("save-provider-runtime", undefined, undefined, {
    ...providerPayload.params,
    ...buildCodeAgentSwitchRuntimeSavePayload(runtimeContainer)
  });
}

async function executeCodeAgentSwitchDeleteProfile(profileId: string): Promise<void> {
  if (!profileId) {
    setStatus("请先选择 Profile");
    return;
  }
  codeAgentSwitchSelectionMode = "auto";
  await executeCodeAgentSwitchAction("delete-profile", profileId);
}

async function copyCodeAgentSwitchText(
  kind: "env" | "diagnostics" | "diff" | "key",
  text: string,
  successText: string,
  emptyText: string
): Promise<void> {
  if (!text.trim()) {
    setStatus(emptyText);
    return;
  }
  const ok = await copyTextToClipboard(text);
  if (!ok) {
    setStatus("复制失败");
    return;
  }
  codeAgentSwitchCopyState = kind;
  setStatus(successText);
  renderList();
  window.setTimeout(() => {
    codeAgentSwitchCopyState = "";
    if (mode === "plugin" && activePluginPanel?.pluginId === CODEAGENT_SWITCH_PLUGIN_ID) {
      renderList();
    }
  }, 1400);
}

function formatCodeAgentSwitchBackupSize(sizeBytes: number | undefined): string {
  if (typeof sizeBytes !== "number" || !Number.isFinite(sizeBytes) || sizeBytes < 0) {
    return "-";
  }
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }
  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatCodeAgentSwitchBackupTime(createdAtMs: number | undefined): string {
  if (typeof createdAtMs !== "number" || !Number.isFinite(createdAtMs)) {
    return "-";
  }
  const date = new Date(createdAtMs);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

const WEBTOOLS_IMAGE_PROMPT_VISIBLE_OPTION_LIMIT = 8;
const imagePromptData = window.__LL_IMAGE_PROMPT_DATA__ as WebtoolsImagePromptData | undefined;
if (!imagePromptData) {
  throw new Error("renderer image prompt data not initialized");
}
const WEBTOOLS_IMAGE_PROMPT_PRODUCTS = imagePromptData.products;
const WEBTOOLS_IMAGE_PROMPT_GROUP_KEYS: WebtoolsImagePromptOptionGroupKey[] = [
  "subject",
  "style",
  "composition",
  "lighting",
  "materials",
  "environment",
  "mood",
  "constraints"
];
const WEBTOOLS_IMAGE_PROMPT_OPTION_GROUPS = imagePromptData.optionGroups;
const WEBTOOLS_IMAGE_PROMPT_STYLE_PRESETS_FROM_SHARED = imagePromptData.stylePresets;
const WEBTOOLS_IMAGE_PROMPT_SMART_TEMPLATES = imagePromptData.smartTemplates;
const WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS = imagePromptData.textOptions;
const webtoolsImagePromptExpandedGroups = new Set<WebtoolsImagePromptOptionGroupKey>();
let webtoolsImagePromptStyleGroup: WebtoolsImagePromptStylePresetGroup | "" = "";
let webtoolsImagePromptSmartTemplateId: WebtoolsImagePromptSmartTemplateId | "" = "";

type ClipboardWorkbenchPanelKind = "text" | "image" | "files";
type ClipboardWorkbenchPanelSource = "auto" | "manual" | "screenshot";

interface ClipboardWorkbenchPanelItemView {
  id: string;
  kind: ClipboardWorkbenchPanelKind;
  source: ClipboardWorkbenchPanelSource;
  title: string;
  summary: string;
  note: string;
  tags: string[];
  favorite: boolean;
  pinned: boolean;
  sensitive: boolean;
  createdAt: number;
  updatedAt: number;
  previewText?: string;
  filePaths?: string[];
  assetPath?: string;
  assetUrl?: string;
}

interface ClipboardWorkbenchPanelData {
  items: ClipboardWorkbenchPanelItemView[];
  groups: Array<{ id: string; name: string; count: number }>;
  settings: {
    autoCollect: boolean;
    sensitiveMode: boolean;
    maxItems: number;
    maxBytes: number;
  };
  stats: {
    totalItems: number;
    totalBytes: number;
  };
  query: {
    search: string;
    scope: string;
    groupId: string;
  };
}

const CLIPBOARD_WORKBENCH_SCOPE_OPTIONS = [
  { key: "all", label: "全部" },
  { key: "recent", label: "最近" },
  { key: "favorites", label: "收藏" },
  { key: "pinned", label: "置顶" },
  { key: "text", label: "文本" },
  { key: "image", label: "图片" },
  { key: "files", label: "文件" },
  { key: "screenshots", label: "截图" }
] as const;

let clipboardWorkbenchPanelData: ClipboardWorkbenchPanelData =
  createDefaultClipboardWorkbenchPanelData();
let clipboardWorkbenchActiveItemId = "";
let clipboardWorkbenchSelectedItemIds = new Set<string>();
let clipboardWorkbenchManualTextDraft = "";
let clipboardWorkbenchSearchDraft = "";

function createDefaultClipboardWorkbenchPanelData(): ClipboardWorkbenchPanelData {
  return {
    items: [],
    groups: [],
    settings: {
      autoCollect: true,
      sensitiveMode: false,
      maxItems: 50,
      maxBytes: 512 * 1024 * 1024
    },
    stats: {
      totalItems: 0,
      totalBytes: 0
    },
    query: {
      search: "",
      scope: "all",
      groupId: ""
    }
  };
}

function toClipboardWorkbenchStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toClipboardWorkbenchPanelItem(
  value: unknown
): ClipboardWorkbenchPanelItemView | null {
  const record = toRecord(value);
  if (!record) {
    return null;
  }

  const id = typeof record.id === "string" ? record.id.trim() : "";
  const summary = typeof record.summary === "string" ? record.summary.trim() : "";
  if (!id || !summary) {
    return null;
  }

  const kind =
    record.kind === "image" || record.kind === "files" ? record.kind : "text";
  const source =
    record.source === "manual" || record.source === "screenshot"
      ? record.source
      : "auto";
  const createdAt =
    typeof record.createdAt === "number" && Number.isFinite(record.createdAt)
      ? record.createdAt
      : 0;
  const updatedAt =
    typeof record.updatedAt === "number" && Number.isFinite(record.updatedAt)
      ? record.updatedAt
      : createdAt;

  return {
    id,
    kind,
    source,
    title:
      typeof record.title === "string" && record.title.trim()
        ? record.title.trim()
        : summary,
    summary,
    note:
      typeof record.note === "string" && record.note.trim()
        ? record.note.trim()
        : "",
    tags: toClipboardWorkbenchStringArray(record.tags),
    favorite: record.favorite === true,
    pinned: record.pinned === true,
    sensitive: record.sensitive === true,
    createdAt,
    updatedAt,
    previewText:
      typeof record.previewText === "string" && record.previewText.trim()
        ? record.previewText
        : undefined,
    filePaths: toClipboardWorkbenchStringArray(record.filePaths),
    assetPath:
      typeof record.assetPath === "string" && record.assetPath.trim()
        ? record.assetPath.trim()
        : undefined,
    assetUrl:
      typeof record.assetUrl === "string" && record.assetUrl.trim()
        ? record.assetUrl.trim()
        : undefined
  };
}

function normalizeClipboardWorkbenchPanelData(
  value: unknown
): ClipboardWorkbenchPanelData {
  const base = createDefaultClipboardWorkbenchPanelData();
  const record = toRecord(value);
  if (!record) {
    return base;
  }

  const items = Array.isArray(record.items)
    ? record.items
        .map((item) => toClipboardWorkbenchPanelItem(item))
        .filter((item): item is ClipboardWorkbenchPanelItemView => item !== null)
    : [];

  const groups = Array.isArray(record.groups)
    ? record.groups
        .map((group) => {
          const next = toRecord(group);
          if (!next) {
            return null;
          }

          const id = typeof next.id === "string" ? next.id.trim() : "";
          const name = typeof next.name === "string" ? next.name.trim() : "";
          const count =
            typeof next.count === "number" && Number.isFinite(next.count)
              ? Math.max(0, Math.round(next.count))
              : 0;
          if (!id || !name) {
            return null;
          }

          return { id, name, count };
        })
        .filter(
          (group): group is { id: string; name: string; count: number } =>
            group !== null
        )
    : [];

  const settings = toRecord(record.settings);
  const stats = toRecord(record.stats);
  const query = toRecord(record.query);

  return {
    items,
    groups,
    settings: {
      autoCollect:
        typeof settings?.autoCollect === "boolean"
          ? settings.autoCollect
          : base.settings.autoCollect,
      sensitiveMode:
        typeof settings?.sensitiveMode === "boolean"
          ? settings.sensitiveMode
          : base.settings.sensitiveMode,
      maxItems:
        typeof settings?.maxItems === "number" && Number.isFinite(settings.maxItems)
          ? Math.max(1, Math.round(settings.maxItems))
          : base.settings.maxItems,
      maxBytes:
        typeof settings?.maxBytes === "number" && Number.isFinite(settings.maxBytes)
          ? Math.max(0, Math.round(settings.maxBytes))
          : base.settings.maxBytes
    },
    stats: {
      totalItems:
        typeof stats?.totalItems === "number" && Number.isFinite(stats.totalItems)
          ? Math.max(0, Math.round(stats.totalItems))
          : items.length,
      totalBytes:
        typeof stats?.totalBytes === "number" && Number.isFinite(stats.totalBytes)
          ? Math.max(0, Math.round(stats.totalBytes))
          : 0
    },
    query: {
      search:
        typeof query?.search === "string" ? query.search : base.query.search,
      scope:
        typeof query?.scope === "string" && query.scope.trim()
          ? query.scope.trim()
          : base.query.scope,
      groupId:
        typeof query?.groupId === "string" ? query.groupId : base.query.groupId
    }
  };
}

function ensureClipboardWorkbenchSelection(): void {
  const visibleIds = new Set(
    clipboardWorkbenchPanelData.items.map((item) => item.id)
  );
  clipboardWorkbenchSelectedItemIds = new Set(
    [...clipboardWorkbenchSelectedItemIds].filter((itemId) => visibleIds.has(itemId))
  );

  const firstId = clipboardWorkbenchPanelData.items[0]?.id ?? "";
  if (!firstId) {
    clipboardWorkbenchActiveItemId = "";
    clipboardWorkbenchSelectedItemIds.clear();
    return;
  }

  const exists = clipboardWorkbenchPanelData.items.some(
    (item) => item.id === clipboardWorkbenchActiveItemId
  );
  if (!exists) {
    clipboardWorkbenchActiveItemId = firstId;
  }
}

function getClipboardWorkbenchActiveItem(): ClipboardWorkbenchPanelItemView | null {
  ensureClipboardWorkbenchSelection();
  return (
    clipboardWorkbenchPanelData.items.find(
      (item) => item.id === clipboardWorkbenchActiveItemId
    ) ?? null
  );
}

function getClipboardWorkbenchSelectedItems(): ClipboardWorkbenchPanelItemView[] {
  ensureClipboardWorkbenchSelection();
  return clipboardWorkbenchPanelData.items.filter((item) =>
    clipboardWorkbenchSelectedItemIds.has(item.id)
  );
}

function isClipboardWorkbenchItemSelected(itemId: string): boolean {
  return clipboardWorkbenchSelectedItemIds.has(itemId);
}

function toggleClipboardWorkbenchItemSelection(itemId: string): void {
  if (!itemId) {
    return;
  }

  if (clipboardWorkbenchSelectedItemIds.has(itemId)) {
    clipboardWorkbenchSelectedItemIds.delete(itemId);
  } else {
    clipboardWorkbenchSelectedItemIds.add(itemId);
  }
  clipboardWorkbenchActiveItemId = itemId;
  syncClipboardWorkbenchSelectionUi();
}

function clearClipboardWorkbenchSelection(): void {
  if (clipboardWorkbenchSelectedItemIds.size === 0) {
    return;
  }
  clipboardWorkbenchSelectedItemIds.clear();
  syncClipboardWorkbenchSelectionUi();
}

function buildClipboardWorkbenchQueryParams(
  overrides: Partial<ClipboardWorkbenchPanelData["query"]> = {}
): Record<string, string> {
  const nextSearch =
    overrides.search ??
    clipboardWorkbenchSearchDraft ??
    clipboardWorkbenchPanelData.query.search;
  const nextScope = overrides.scope ?? clipboardWorkbenchPanelData.query.scope;
  const nextGroupId = overrides.groupId ?? clipboardWorkbenchPanelData.query.groupId;

  const params: Record<string, string> = {};
  if (typeof nextSearch === "string" && nextSearch.trim()) {
    params.search = nextSearch;
  }
  if (
    typeof nextScope === "string" &&
    nextScope.trim() &&
    nextScope.trim().toLowerCase() !== "all"
  ) {
    params.scope = nextScope.trim();
  }
  if (typeof nextGroupId === "string" && nextGroupId.trim()) {
    params.groupId = nextGroupId.trim();
  }
  return params;
}

function createClipboardWorkbenchBadge(
  text: string,
  tone: "neutral" | "accent" | "warning" | "success" = "neutral"
): HTMLSpanElement {
  const badge = document.createElement("span");
  badge.className = "clipboard-workbench-badge";
  badge.dataset.tone = tone;
  badge.textContent = text;
  return badge;
}

function formatClipboardWorkbenchBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let next = value;
  let index = 0;
  while (next >= 1024 && index < units.length - 1) {
    next /= 1024;
    index += 1;
  }
  const digits = next >= 100 ? 0 : next >= 10 ? 1 : 2;
  return `${next.toFixed(digits)} ${units[index]}`;
}

function formatClipboardWorkbenchTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "未知时间";
  }
  return new Date(value).toLocaleString();
}

function getClipboardWorkbenchKindLabel(kind: ClipboardWorkbenchPanelKind): string {
  switch (kind) {
    case "image":
      return "图片";
    case "files":
      return "文件";
    default:
      return "文本";
  }
}

function getClipboardWorkbenchSourceLabel(
  source: ClipboardWorkbenchPanelSource
): string {
  switch (source) {
    case "manual":
      return "手动保存";
    case "screenshot":
      return "截图采集";
    default:
      return "自动采集";
  }
}

function getClipboardWorkbenchItemPreview(
  item: ClipboardWorkbenchPanelItemView
): string {
  if (item.kind === "files") {
    const count = item.filePaths?.length ?? 0;
    return count > 0 ? `${count} 个文件路径` : item.summary;
  }
  if (item.kind === "image") {
    return item.assetUrl ? "可预览图片" : item.summary;
  }
  return item.previewText ?? item.summary;
}

function getClipboardWorkbenchForm(): HTMLFormElement | null {
  return list.querySelector<HTMLFormElement>("form.clipboard-workbench-form");
}

function clipboardWorkbenchItemIdsSignature(
  items: ClipboardWorkbenchPanelItemView[]
): string {
  return items.map((item) => item.id).join("\u0000");
}

function shouldFullyRerenderClipboardWorkbenchPanel(
  previousItems: ClipboardWorkbenchPanelItemView[]
): boolean {
  return (
    clipboardWorkbenchItemIdsSignature(previousItems) !==
    clipboardWorkbenchItemIdsSignature(clipboardWorkbenchPanelData.items)
  );
}

function refreshClipboardWorkbenchListMeta(): void {
  const meta = getClipboardWorkbenchForm()?.querySelector<HTMLElement>(
    ".clipboard-workbench-list-meta"
  );
  if (!meta) {
    return;
  }

  const selectedCount = getClipboardWorkbenchSelectedItems().length;
  meta.textContent =
    selectedCount > 0
      ? `${clipboardWorkbenchPanelData.items.length} 条可见 · ${selectedCount} 条已选`
      : `${clipboardWorkbenchPanelData.items.length} 条可见`;
}

function updateClipboardWorkbenchItemMarkedStates(): void {
  const form = getClipboardWorkbenchForm();
  if (!form) {
    return;
  }

  form.querySelectorAll<HTMLElement>(".clipboard-workbench-item").forEach((card) => {
    const itemId = card.dataset.clipboardWorkbenchItemId ?? "";
    card.dataset.marked = String(isClipboardWorkbenchItemSelected(itemId));
  });
}

function clearClipboardWorkbenchDetailNode(detail: HTMLElement): void {
  while (detail.firstChild) {
    detail.removeChild(detail.firstChild);
  }
}

function appendClipboardWorkbenchDetailContent(
  detail: HTMLElement,
  activeItem: ClipboardWorkbenchPanelItemView | null
): void {
  const detailTitle = document.createElement("div");
  detailTitle.className = "clipboard-workbench-section-title";
  detailTitle.textContent = "详情";
  detail.appendChild(detailTitle);

  if (!activeItem) {
    const empty = document.createElement("div");
    empty.className = "clipboard-workbench-empty";
    empty.textContent = "选择一条记录查看详情。";
    detail.appendChild(empty);
    return;
  }

  const hero = document.createElement("div");
  hero.className = "clipboard-workbench-detail-hero";
  const heroTitle = document.createElement("div");
  heroTitle.className = "clipboard-workbench-detail-title";
  heroTitle.textContent = activeItem.title || activeItem.summary;
  const heroMeta = document.createElement("div");
  heroMeta.className = "clipboard-workbench-detail-meta";
  heroMeta.append(
    createClipboardWorkbenchBadge(getClipboardWorkbenchKindLabel(activeItem.kind), "accent"),
    createClipboardWorkbenchBadge(getClipboardWorkbenchSourceLabel(activeItem.source)),
    createClipboardWorkbenchBadge(clipboardWorkbenchPanelData.query.scope || "all")
  );
  hero.append(heroTitle, heroMeta);
  detail.appendChild(hero);

  const preview = document.createElement("div");
  preview.className = "clipboard-workbench-preview";
  if (activeItem.kind === "text") {
    const pre = document.createElement("pre");
    pre.className = "clipboard-workbench-preview-text";
    pre.textContent = activeItem.previewText ?? activeItem.summary;
    preview.appendChild(pre);
  } else if (activeItem.kind === "files") {
    const listNode = document.createElement("ul");
    listNode.className = "clipboard-workbench-file-list";
    (activeItem.filePaths ?? []).forEach((filePath) => {
      const row = document.createElement("li");
      row.className = "clipboard-workbench-file-row";
      row.textContent = filePath;
      listNode.appendChild(row);
    });
    preview.appendChild(listNode);
  } else if (activeItem.assetUrl) {
    const image = document.createElement("img");
    image.className = "clipboard-workbench-preview-image";
    image.src = activeItem.assetUrl;
    image.alt = activeItem.summary;
    preview.appendChild(image);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "clipboard-workbench-image-placeholder";
    placeholder.textContent = "当前没有可预览图片。";
    preview.appendChild(placeholder);
  }
  detail.appendChild(preview);

  const metaGrid = document.createElement("div");
  metaGrid.className = "clipboard-workbench-detail-grid";
  [
    { label: "摘要", value: activeItem.summary },
    { label: "更新时间", value: formatClipboardWorkbenchTime(activeItem.updatedAt) },
    { label: "创建时间", value: formatClipboardWorkbenchTime(activeItem.createdAt) },
    {
      label: "标签",
      value: activeItem.tags.length > 0 ? activeItem.tags.join(", ") : "无"
    }
  ].forEach((entry) => {
    const row = document.createElement("div");
    row.className = "clipboard-workbench-detail-row";
    const label = document.createElement("div");
    label.className = "clipboard-workbench-detail-label";
    label.textContent = entry.label;
    const value = document.createElement("div");
    value.className = "clipboard-workbench-detail-value";
    value.textContent = entry.value;
    row.append(label, value);
    metaGrid.appendChild(row);
  });
  detail.appendChild(metaGrid);

  const note = document.createElement("div");
  note.className = "clipboard-workbench-note";
  note.textContent = activeItem.note || "暂未为这条记录保存备注。";
  detail.appendChild(note);

  const detailActions = document.createElement("div");
  detailActions.className = "clipboard-workbench-detail-actions";

  const restoreButton = document.createElement("button");
  restoreButton.type = "button";
  restoreButton.className = "settings-btn settings-btn-primary";
  restoreButton.textContent = "恢复到剪贴板";
  restoreButton.addEventListener("click", () => {
    void executeClipboardWorkbenchAction("restore-item", {
      itemId: activeItem.id
    });
  });

  const batchButton = document.createElement("button");
  batchButton.type = "button";
  batchButton.className = "settings-btn settings-btn-secondary";
  batchButton.textContent = isClipboardWorkbenchItemSelected(activeItem.id)
    ? "移出批量"
    : "加入批量";
  batchButton.addEventListener("click", () => {
    toggleClipboardWorkbenchItemSelection(activeItem.id);
  });

  detailActions.append(restoreButton, batchButton);
  detail.appendChild(detailActions);
}

function createClipboardWorkbenchBulkBar(
  selectedItems: ClipboardWorkbenchPanelItemView[]
): HTMLDivElement {
  const selectedItemIds = selectedItems.map((item) => item.id);
  const canMergeSelectedItems =
    selectedItems.length > 0 &&
    (selectedItems.every((item) => item.kind === "text") ||
      selectedItems.every((item) => item.kind === "files"));

  const bulkBar = document.createElement("div");
  bulkBar.className = "clipboard-workbench-bulk-bar";

  const bulkMeta = document.createElement("div");
  bulkMeta.className = "clipboard-workbench-bulk-meta";
  bulkMeta.textContent = `${selectedItems.length} 条已选`;

  const bulkActions = document.createElement("div");
  bulkActions.className = "clipboard-workbench-bulk-actions";

  const sequentialButton = document.createElement("button");
  sequentialButton.type = "button";
  sequentialButton.className = "settings-btn settings-btn-primary";
  sequentialButton.dataset.clipboardWorkbenchBulkAction = "sequential";
  sequentialButton.textContent = "顺序粘贴";
  sequentialButton.addEventListener("click", () => {
    void executeClipboardWorkbenchAction("paste-batch", {
      itemIds: selectedItemIds,
      pasteMode: "sequential"
    });
  });

  const mergeButton = document.createElement("button");
  mergeButton.type = "button";
  mergeButton.className = "settings-btn settings-btn-secondary";
  mergeButton.dataset.clipboardWorkbenchBulkAction = "merge-once";
  mergeButton.textContent = "合并一次";
  mergeButton.disabled = !canMergeSelectedItems;
  mergeButton.addEventListener("click", () => {
    void executeClipboardWorkbenchAction("paste-batch", {
      itemIds: selectedItemIds,
      pasteMode: "merge-once",
      mergeSeparatorMode: "newline"
    });
  });

  const clearSelectionButton = document.createElement("button");
  clearSelectionButton.type = "button";
  clearSelectionButton.className = "settings-btn settings-btn-secondary";
  clearSelectionButton.textContent = "清空选择";
  clearSelectionButton.addEventListener("click", () => {
    clearClipboardWorkbenchSelection();
  });

  bulkActions.append(sequentialButton, mergeButton, clearSelectionButton);
  bulkBar.append(bulkMeta, bulkActions);

  if (!canMergeSelectedItems) {
    const bulkNote = document.createElement("div");
    bulkNote.className = "clipboard-workbench-note";
    bulkNote.textContent = "合并粘贴目前仅支持纯文本或纯文件路径记录。";
    bulkBar.appendChild(bulkNote);
  }

  return bulkBar;
}

function refreshClipboardWorkbenchDetail(): void {
  const detail = getClipboardWorkbenchForm()?.querySelector<HTMLElement>(
    ".clipboard-workbench-detail"
  );
  if (!detail) {
    renderList();
    return;
  }

  clearClipboardWorkbenchDetailNode(detail);
  appendClipboardWorkbenchDetailContent(detail, getClipboardWorkbenchActiveItem());
}

function refreshClipboardWorkbenchBulkBar(): void {
  const listSection = getClipboardWorkbenchForm()?.querySelector<HTMLElement>(
    ".clipboard-workbench-list"
  );
  if (!listSection) {
    return;
  }

  listSection.querySelector(".clipboard-workbench-bulk-bar")?.remove();
  const selectedItems = getClipboardWorkbenchSelectedItems();
  if (selectedItems.length > 0) {
    listSection.appendChild(createClipboardWorkbenchBulkBar(selectedItems));
  }
}

function updateClipboardWorkbenchActiveItem(previousId: string, nextId: string): void {
  const form = getClipboardWorkbenchForm();
  if (!form) {
    renderList();
    return;
  }

  if (previousId) {
    const previousCard = form.querySelector<HTMLElement>(
      `.clipboard-workbench-item[data-clipboard-workbench-item-id="${CSS.escape(previousId)}"]`
    );
    const previousButton = previousCard?.querySelector<HTMLElement>(
      ".clipboard-workbench-item-main"
    );
    previousCard?.setAttribute("data-active", "false");
    previousButton?.setAttribute("data-selected", "false");
  }

  if (nextId) {
    const nextCard = form.querySelector<HTMLElement>(
      `.clipboard-workbench-item[data-clipboard-workbench-item-id="${CSS.escape(nextId)}"]`
    );
    const nextButton = nextCard?.querySelector<HTMLElement>(
      ".clipboard-workbench-item-main"
    );
    nextCard?.setAttribute("data-active", "true");
    nextButton?.setAttribute("data-selected", "true");
    nextButton?.scrollIntoView({ block: "nearest" });
  }

  refreshClipboardWorkbenchDetail();
  refreshClipboardWorkbenchListMeta();
}

function syncClipboardWorkbenchSelectionUi(): void {
  if (!getClipboardWorkbenchForm()) {
    renderList();
    return;
  }

  updateClipboardWorkbenchItemMarkedStates();
  refreshClipboardWorkbenchListMeta();
  refreshClipboardWorkbenchDetail();
  refreshClipboardWorkbenchBulkBar();
}

function refreshClipboardWorkbenchPanelAfterPayload(
  previousItems: ClipboardWorkbenchPanelItemView[],
  action: string
): void {
  if (shouldFullyRerenderClipboardWorkbenchPanel(previousItems)) {
    renderList();
    return;
  }

  if (action === "restore-item") {
    syncClipboardWorkbenchSelectionUi();
    return;
  }

  renderList();
}

async function executeClipboardWorkbenchAction(
  action: string,
  actionParams: Record<string, string | string[]> = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("启动器桥接暂不可用。");
    return;
  }

  const params = new URLSearchParams();
  params.set("action", action);
  Object.entries(actionParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value
        .map((entry) => entry.trim())
        .filter(Boolean)
        .forEach((entry) => {
          params.append(key, entry);
        });
      return;
    }

    const nextValue = value.trim();
    if (nextValue) {
      params.set(key, nextValue);
    }
  });
  const result = await launcher.execute({
    id: `plugin:${CLIPBOARD_WORKBENCH_PLUGIN_ID}:${action}`,
    type: "command",
    title: "剪贴板工作台",
    subtitle: "面板操作",
    target: `command:plugin:${CLIPBOARD_WORKBENCH_PLUGIN_ID}?${params.toString()}`,
    keywords: ["plugin", "clipboard", "workbench"]
  });

  if (!result.ok) {
    setStatus(result.message ?? "剪贴板工作台操作失败。");
    return;
  }

  if (activePluginPanel) {
    const previousItems = clipboardWorkbenchPanelData.items;
    activePluginPanel.data = result.data ?? activePluginPanel.data;
    window.__LL_PANEL_IMPLS__?.applyClipboardWorkbenchPanelPayload(activePluginPanel);
    if (action === "save-manual-text") {
      const manualText = actionParams.manualText;
      if (typeof manualText === "string" && manualText.trim()) {
        clipboardWorkbenchManualTextDraft = "";
      }
    }
    refreshClipboardWorkbenchPanelAfterPayload(previousItems, action);
  }

  setStatus(result.message ?? "剪贴板工作台已更新。");
}

function syncWebtoolsImagePromptSmartTemplateSelection(container: HTMLElement): void {
  container
    .querySelectorAll<HTMLButtonElement>("[data-webtools-image-prompt-smart-template]")
    .forEach((button) => {
      button.dataset.selected = String(button.value === webtoolsImagePromptSmartTemplateId);
    });
}

let hardwareInspectorSnapshot: HardwareInspectorSnapshot | null = null;
let hardwareInspectorLastSnapshot: HardwareInspectorSnapshot | null = null;
let hardwareInspectorDiffState: HardwareInspectorDiffState | null = null;
let hardwareInspectorInfo = "";
let hardwareInspectorError = "";
let hardwareInspectorLoading = false;
let hardwareInspectorExporting = false;
let hardwareInspectorRequestToken = 0;
let hardwareInspectorExpandedDiskKeys = new Set<string>();
let hardwareInspectorPreviewImageUrl = "";
let hardwareInspectorPreviewLoading = false;
let hardwareInspectorPreviewError = "";
let hardwareInspectorPreviewRequestToken = 0;

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
  return cpu.processorId || cpu.socketDesignation || cpu.name || `cpu-${index}`;
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
      {
        label: "核心 / 线程",
        get: (item) => `${item.numberOfCores}/${item.numberOfLogicalProcessors}`
      },
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

function formatHardwareInspectorResolution(gpu: HardwareInspectorGpu): string {
  if (!gpu.horizontalResolution || !gpu.verticalResolution) {
    return "未知";
  }

  const base = `${gpu.horizontalResolution} × ${gpu.verticalResolution}`;
  return gpu.refreshRate ? `${base} @ ${gpu.refreshRate}Hz` : base;
}

function createHardwareInspectorSection(
  titleText: string,
  descriptionText?: string
): { section: HTMLDivElement; body: HTMLDivElement } {
  const section = document.createElement("div");
  section.className = "hardware-inspector-section";

  const head = document.createElement("div");
  head.className = "hardware-inspector-section-head";
  const title = document.createElement("h4");
  title.className = "hardware-inspector-section-title";
  title.textContent = titleText;
  head.appendChild(title);

  if (descriptionText) {
    const description = document.createElement("div");
    description.className = "hardware-inspector-section-description";
    description.textContent = descriptionText;
    head.appendChild(description);
  }

  const body = document.createElement("div");
  body.className = "hardware-inspector-section-body";
  section.append(head, body);
  return { section, body };
}

function createHardwareInspectorCard(titleText: string): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "hardware-inspector-card";
  const header = document.createElement("div");
  header.className = "hardware-inspector-card-header";
  const title = document.createElement("div");
  title.className = "hardware-inspector-card-title";
  title.textContent = titleText;
  header.appendChild(title);
  card.appendChild(header);
  return card;
}

function createHardwareInspectorBadge(
  text: string,
  tone: "neutral" | "success" | "warning" | "danger" = "neutral"
): HTMLSpanElement {
  const badge = document.createElement("span");
  badge.className = "hardware-inspector-badge";
  badge.dataset.tone = tone;
  badge.textContent = text;
  return badge;
}

function getHardwareInspectorTemperatureSourceTone(
  source: string | null | undefined
): "neutral" | "success" | "warning" {
  const normalized = source?.trim().toLowerCase() ?? "";
  if (!normalized) {
    return "neutral";
  }
  if (normalized.includes("acpi") || normalized.includes("best effort")) {
    return "warning";
  }
  return "success";
}

function formatHardwareInspectorTemperatureSourceBadge(
  source: string | null | undefined
): string {
  const normalized = source?.trim().toLowerCase() ?? "";
  if (!normalized) {
    return "温度来源不可用";
  }
  if (normalized.includes("acpi")) {
    return "来源: ACPI 热区";
  }
  if (normalized.includes("librehardwaremonitor")) {
    return "来源: LibreHardwareMonitor";
  }
  if (normalized.includes("openhardwaremonitor")) {
    return "来源: OpenHardwareMonitor";
  }
  return "来源: 监控传感器";
}

function createHardwareInspectorTemperatureBadgeRow(
  temperatureCelsius: number | null | undefined,
  temperatureSource: string | null | undefined
): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "hardware-inspector-badge-row";

  const hasTemperature =
    typeof temperatureCelsius === "number" &&
    Number.isFinite(temperatureCelsius) &&
    temperatureCelsius > 0;
  const sourceTone = getHardwareInspectorTemperatureSourceTone(temperatureSource);

  row.appendChild(
    createHardwareInspectorBadge(
      hasTemperature ? "温度已采集" : "温度不可用",
      hasTemperature ? sourceTone : "neutral"
    )
  );

  if (temperatureSource?.trim()) {
    row.appendChild(
      createHardwareInspectorBadge(
        formatHardwareInspectorTemperatureSourceBadge(temperatureSource),
        sourceTone
      )
    );
  }

  return row;
}

function countHardwareInspectorDiskVolumes(disk: HardwareInspectorDisk): number {
  return disk.partitions.reduce((count, partition) => count + partition.volumes.length, 0);
}

function formatHardwareInspectorDriveType(value: number | null | undefined): string {
  switch (value) {
    case 0:
      return "未知";
    case 1:
      return "不可用";
    case 2:
      return "可移动";
    case 3:
      return "本地磁盘";
    case 4:
      return "网络驱动器";
    case 5:
      return "光驱";
    case 6:
      return "RAM 磁盘";
    default:
      return typeof value === "number" && Number.isFinite(value) ? `类型 ${value}` : "不可用";
  }
}

function addHardwareInspectorCardAction(
  card: HTMLDivElement,
  label: string,
  onClick: () => void
): void {
  const header = card.querySelector(".hardware-inspector-card-header");
  if (!(header instanceof HTMLDivElement)) {
    return;
  }

  let actions = header.querySelector(".hardware-inspector-card-actions");
  if (!(actions instanceof HTMLDivElement)) {
    actions = document.createElement("div");
    actions.className = "hardware-inspector-card-actions";
    header.appendChild(actions);
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "settings-btn settings-btn-secondary hardware-inspector-inline-btn";
  button.textContent = label;
  button.addEventListener("click", onClick);
  actions.appendChild(button);
}

function addHardwareInspectorInlineAction(
  header: HTMLDivElement,
  actionsClassName: string,
  label: string,
  onClick: () => void
): void {
  let actions = header.querySelector(`.${actionsClassName}`);
  if (!(actions instanceof HTMLDivElement)) {
    actions = document.createElement("div");
    actions.className = actionsClassName;
    header.appendChild(actions);
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "settings-btn settings-btn-secondary hardware-inspector-inline-btn";
  button.textContent = label;
  button.addEventListener("click", onClick);
  actions.appendChild(button);
}

async function copyHardwareInspectorDetail(
  title: string,
  lines: string[],
  successText: string
): Promise<void> {
  const content = [title, ...lines].join("\n").trim();
  const ok = await copyTextToClipboard(content);
  setStatus(ok ? successText : "复制失败");
}

function createHardwareInspectorMetricItems(
  items: Array<{ label: string; value: string }>,
  changedLabels: readonly string[] = []
): Array<{ label: string; value: string; changed?: boolean }> {
  const changedSet = new Set(changedLabels);
  return items.map((item) => ({
    ...item,
    changed: changedSet.has(item.label)
  }));
}

function applyHardwareInspectorCardChangeState(
  card: HTMLDivElement,
  labels: readonly string[]
): void {
  if (labels.length === 0) {
    return;
  }

  card.dataset.changed = "true";
  const summary = document.createElement("div");
  summary.className = "hardware-inspector-card-change";
  summary.textContent = `变化：${labels.join("、")}`;
  card.appendChild(summary);
}

function applyHardwareInspectorSnapshot(
  snapshot: HardwareInspectorSnapshot,
  infoText?: string,
  options?: { loadPreview?: boolean }
): void {
  hardwareInspectorSnapshot = snapshot;
  hardwareInspectorDiffState = buildHardwareInspectorDiffState(
    hardwareInspectorLastSnapshot,
    snapshot
  );
  hardwareInspectorLastSnapshot = snapshot;
  hardwareInspectorInfo =
    infoText && infoText.trim() ? infoText : buildHardwareInspectorSummaryText(snapshot);
  if (options?.loadPreview !== false) {
    void loadHardwareInspectorPreview(hardwareInspectorRequestToken);
  }
}

async function loadHardwareInspectorPreview(requestToken: number): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher || !hardwareInspectorSnapshot) {
    return;
  }

  const previewToken = ++hardwareInspectorPreviewRequestToken;
  hardwareInspectorPreviewLoading = true;
  hardwareInspectorPreviewError = "";
  hardwareInspectorPreviewImageUrl = "";
  if (mode === "plugin" && activePluginPanel?.pluginId === HARDWARE_INSPECTOR_PLUGIN_ID) {
    renderList();
  }

  const item: LaunchItem = {
    id: `plugin:${HARDWARE_INSPECTOR_PLUGIN_ID}:preview-image`,
    type: "command",
    title: "硬件检测",
    subtitle: "生成硬件配置预览图",
    target: `command:plugin:${HARDWARE_INSPECTOR_PLUGIN_ID}?action=preview-image`,
    keywords: ["plugin", "hardware", "preview", "硬件", "预览图"]
  };

  try {
    const result = await launcher.execute(item);
    if (
      requestToken !== hardwareInspectorRequestToken ||
      previewToken !== hardwareInspectorPreviewRequestToken
    ) {
      return;
    }

    const data = toRecord(result.data);
    const previewImageDataUrl =
      typeof data?.previewImageDataUrl === "string" ? data.previewImageDataUrl.trim() : "";
    hardwareInspectorPreviewError =
      typeof data?.error === "string" && data.error.trim()
        ? data.error
        : result.ok
          ? ""
          : result.message ?? "生成预览图失败";
    hardwareInspectorPreviewImageUrl =
      previewImageDataUrl && previewImageDataUrl.startsWith("data:image/")
        ? previewImageDataUrl
        : "";
  } catch (error) {
    if (
      requestToken !== hardwareInspectorRequestToken ||
      previewToken !== hardwareInspectorPreviewRequestToken
    ) {
      return;
    }
    hardwareInspectorPreviewError =
      error instanceof Error && error.message ? error.message : "生成预览图失败";
    hardwareInspectorPreviewImageUrl = "";
  } finally {
    if (
      requestToken === hardwareInspectorRequestToken &&
      previewToken === hardwareInspectorPreviewRequestToken
    ) {
      hardwareInspectorPreviewLoading = false;
      if (mode === "plugin" && activePluginPanel?.pluginId === HARDWARE_INSPECTOR_PLUGIN_ID) {
        renderList();
      }
    }
  }
}

function createHardwareInspectorPreviewPanel(): HTMLElement {
  const aside = document.createElement("aside");
  aside.className = "hardware-inspector-preview";

  const head = document.createElement("div");
  head.className = "hardware-inspector-preview-head";
  const title = document.createElement("h4");
  title.className = "hardware-inspector-preview-title";
  title.textContent = "配置预览图";
  const hint = document.createElement("p");
  hint.className = "hardware-inspector-preview-hint";
  hint.textContent = "与「导出精简图」相同，采集完成后自动生成";
  head.append(title, hint);

  const frame = document.createElement("div");
  frame.className = "hardware-inspector-preview-frame";
  if (hardwareInspectorPreviewLoading) {
    const loading = document.createElement("div");
    loading.className = "hardware-inspector-preview-placeholder";
    loading.textContent = "正在生成预览图...";
    frame.appendChild(loading);
  } else if (hardwareInspectorPreviewError) {
    const errorNode = document.createElement("div");
    errorNode.className =
      "hardware-inspector-preview-placeholder hardware-inspector-preview-placeholder-error";
    errorNode.textContent = hardwareInspectorPreviewError;
    frame.appendChild(errorNode);
  } else if (hardwareInspectorPreviewImageUrl) {
    const image = document.createElement("img");
    image.className = "hardware-inspector-preview-image";
    image.alt = "硬件配置预览图";
    image.src = hardwareInspectorPreviewImageUrl;
    frame.appendChild(image);
  } else {
    const waiting = document.createElement("div");
    waiting.className = "hardware-inspector-preview-placeholder";
    waiting.textContent = "等待生成预览图...";
    frame.appendChild(waiting);
  }

  const actions = document.createElement("div");
  actions.className = "hardware-inspector-preview-actions";

  const refreshPreviewButton = document.createElement("button");
  refreshPreviewButton.type = "button";
  refreshPreviewButton.className = "settings-btn settings-btn-secondary";
  refreshPreviewButton.textContent = hardwareInspectorPreviewLoading ? "生成中..." : "刷新预览";
  refreshPreviewButton.disabled =
    hardwareInspectorLoading || hardwareInspectorExporting || hardwareInspectorPreviewLoading;
  refreshPreviewButton.addEventListener("click", () => {
    void loadHardwareInspectorPreview(hardwareInspectorRequestToken);
  });

  const exportCompactButton = document.createElement("button");
  exportCompactButton.type = "button";
  exportCompactButton.className = "settings-btn settings-btn-secondary";
  exportCompactButton.textContent = hardwareInspectorExporting ? "导出中..." : "导出精简图";
  exportCompactButton.disabled = hardwareInspectorLoading || hardwareInspectorExporting;
  exportCompactButton.addEventListener("click", () => {
    void executeHardwareInspectorExportReport("image-compact");
  });

  const exportFullButton = document.createElement("button");
  exportFullButton.type = "button";
  exportFullButton.className = "settings-btn settings-btn-secondary";
  exportFullButton.textContent = hardwareInspectorExporting ? "导出中..." : "导出长图";
  exportFullButton.disabled = hardwareInspectorLoading || hardwareInspectorExporting;
  exportFullButton.addEventListener("click", () => {
    void executeHardwareInspectorExportReport("image");
  });

  actions.append(refreshPreviewButton, exportCompactButton, exportFullButton);
  aside.append(head, frame, actions);
  return aside;
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
  format: "markdown" | "html" | "image" | "image-compact"
): Promise<void> {
  const launcher = getLauncherApi();
  const labelFor = (value: typeof format): string =>
    value === "html"
      ? "HTML"
      : value === "image"
        ? "完整图片"
        : value === "image-compact"
          ? "精简图片"
          : "Markdown";
  if (!launcher) {
    setStatus(`桥接层未加载，无法导出${labelFor(format)}报告`);
    return;
  }

  hardwareInspectorExporting = true;
  hardwareInspectorError = "";
  beginPluginNativeInteraction();
  if (mode === "plugin" && activePluginPanel?.pluginId === HARDWARE_INSPECTOR_PLUGIN_ID) {
    renderList();
  }
  const exportLabel = labelFor(format);
  setStatus(`正在导出${exportLabel}报告...`);

  const action =
    format === "html"
      ? "export-html"
      : format === "image"
        ? "export-image"
        : format === "image-compact"
          ? "export-image-compact"
          : "export-report";
  const item: LaunchItem = {
    id: `plugin:${HARDWARE_INSPECTOR_PLUGIN_ID}:${action}`,
    type: "command",
    title: "硬件检测",
    subtitle: `导出硬件${exportLabel}报告`,
    target: `command:plugin:${HARDWARE_INSPECTOR_PLUGIN_ID}?action=${action}`,
    keywords: ["plugin", "hardware", "report", "导出", "硬件报告", format]
  };

  try {
    const result = await launcher.execute(item);
    const data = toRecord(result.data);
    const snapshot = getHardwareInspectorSnapshotFromData(data);
    if (snapshot) {
      applyHardwareInspectorSnapshot(
        snapshot,
        typeof data?.info === "string" ? data.info : "",
        { loadPreview: false }
      );
    }

    hardwareInspectorError =
      typeof data?.error === "string" && data.error.trim()
        ? data.error
        : result.ok
          ? ""
          : result.message ?? `导出${exportLabel}报告失败`;

    setStatus(
      result.message ??
        (result.ok
          ? `${exportLabel}报告已导出`
          : hardwareInspectorError || `导出${exportLabel}报告失败`)
    );
  } finally {
    hardwareInspectorExporting = false;
    schedulePluginNativeInteractionRelease();
    if (mode === "plugin" && activePluginPanel?.pluginId === HARDWARE_INSPECTOR_PLUGIN_ID) {
      renderList();
    }
  }
}

// --- Cron state ---
let webtoolsCronExpression = "5 4 * * *";
let webtoolsCronReadable = "";
let webtoolsCronNextRun = "";
let webtoolsCronUpcoming: string[] = [];
let webtoolsCronStatus: WebtoolsCronStatus = "";
let webtoolsCronErrorMessage = "";
let webtoolsCronErrorField: WebtoolsCronFieldKey | "" = "";
let webtoolsCronWarnings: string[] = [];
let webtoolsCronTemplateKey = "";
let webtoolsCronTemplateSummary = "";
let webtoolsCronFieldMeta: WebtoolsCronFieldMeta[] = [];
let webtoolsCronCopyState: WebtoolsCronCopyState = "";
let webtoolsCronAutoTimer: number | null = null;
let webtoolsCronRequestToken = 0;
let webtoolsCronTemplates: WebtoolsCronTemplateItem[] = [];
let webtoolsCronEditingTemplateKey = "";

type WebtoolsCronTemplateAction =
  | "save-template"
  | "update-template"
  | "delete-template"
  | "reset-templates";

type WebtoolsCronTemplateItem = {
  key: string;
  expression: string;
  summary: string;
};

const WEBTOOLS_CRON_FIELD_FALLBACKS: ReadonlyArray<{
  key: WebtoolsCronFieldKey;
  label: string;
  hint: string;
}> = [
  { key: "minute", label: "Minute", hint: "Minute (0-59)" },
  { key: "hour", label: "Hour", hint: "Hour (0-23)" },
  { key: "day", label: "Day", hint: "Day (1-31)" },
  { key: "month", label: "Month", hint: "Month (1-12)" },
  { key: "weekday", label: "Weekday", hint: "Weekday (0-6)" }
];

function parseWebtoolsCronTemplates(value: unknown): WebtoolsCronTemplateItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = toRecord(item);
      if (!record) {
        return null;
      }
      const key = typeof record.key === "string" ? record.key.trim() : "";
      const summary = typeof record.summary === "string" ? record.summary.trim() : "";
      const expression =
        typeof record.expression === "string" ? record.expression.trim() : "";
      if (!key || !summary || !expression) {
        return null;
      }
      return { key, summary, expression };
    })
    .filter((item): item is WebtoolsCronTemplateItem => item !== null);
}

function hydrateWebtoolsCronTemplates(data: Record<string, unknown> | null): void {
  const templates = data ? parseWebtoolsCronTemplates(data.templates) : [];
  if (templates.length > 0) {
    webtoolsCronTemplates = templates;
  }
}

function normalizeWebtoolsCronStatus(value: unknown): WebtoolsCronStatus {
  return value === "success" || value === "warning" || value === "error" ? value : "";
}

function normalizeWebtoolsCronErrorField(value: unknown): WebtoolsCronFieldKey | "" {
  return value === "minute" ||
    value === "hour" ||
    value === "day" ||
    value === "month" ||
    value === "weekday"
    ? value
    : "";
}

function getWebtoolsCronPartValues(expression: string): string[] {
  const parts = expression.trim().split(/\s+/).filter(Boolean);
  while (parts.length < 5) {
    parts.push("*");
  }
  return parts.slice(0, 5);
}

function buildWebtoolsCronFallbackFieldMeta(
  expression: string,
  errorField: WebtoolsCronFieldKey | ""
): WebtoolsCronFieldMeta[] {
  const values = getWebtoolsCronPartValues(expression);
  return WEBTOOLS_CRON_FIELD_FALLBACKS.map((field, index) => ({
    key: field.key,
    label: field.label,
    value: values[index] ?? "*",
    hint: field.hint,
    hasError: field.key === errorField
  }));
}

function parseWebtoolsCronFieldMeta(
  value: unknown,
  expression: string,
  errorField: WebtoolsCronFieldKey | ""
): WebtoolsCronFieldMeta[] {
  if (!Array.isArray(value)) {
    return buildWebtoolsCronFallbackFieldMeta(expression, errorField);
  }

  const items = value
    .map((item) => {
      const record = toRecord(item);
      if (!record) {
        return null;
      }
      const key = normalizeWebtoolsCronErrorField(record.key);
      if (!key) {
        return null;
      }
      return {
        key,
        label: typeof record.label === "string" ? record.label : key,
        value: typeof record.value === "string" ? record.value : "",
        hint: typeof record.hint === "string" ? record.hint : "",
        hasError: typeof record.hasError === "boolean" ? record.hasError : key === errorField
      } satisfies WebtoolsCronFieldMeta;
    })
    .filter((item): item is WebtoolsCronFieldMeta => item !== null);

  if (items.length !== WEBTOOLS_CRON_FIELD_FALLBACKS.length) {
    return buildWebtoolsCronFallbackFieldMeta(expression, errorField);
  }

  return items;
}

function getWebtoolsCronFieldMeta(): WebtoolsCronFieldMeta[] {
  return webtoolsCronFieldMeta.length > 0
    ? webtoolsCronFieldMeta
    : buildWebtoolsCronFallbackFieldMeta(webtoolsCronExpression, webtoolsCronErrorField);
}

function getWebtoolsCronTemplates(): ReadonlyArray<WebtoolsCronTemplateItem> {
  return webtoolsCronTemplates;
}

function buildWebtoolsCronTemplateTarget(
  action: WebtoolsCronTemplateAction,
  input: { expression?: string; summary?: string; key?: string }
): string {
  const params = new URLSearchParams();
  params.set("action", action);
  if (input.expression?.trim()) {
    params.set("expression", input.expression.trim());
  }
  if (input.summary?.trim()) {
    params.set("summary", input.summary.trim());
  }
  if (input.key?.trim()) {
    params.set("key", input.key.trim());
  }
  return `command:plugin:${WEBTOOLS_CRON_PLUGIN_ID}?${params.toString()}`;
}

function readWebtoolsCronTemplateEditorValues(form: HTMLFormElement): {
  summary: string;
  expression: string;
} {
  const summaryNode = form.elements.namedItem("webtoolsCronTemplateSummary");
  const expressionNode = form.elements.namedItem("webtoolsCronTemplateExpression");
  return {
    summary: summaryNode instanceof HTMLInputElement ? summaryNode.value.trim() : "",
    expression:
      expressionNode instanceof HTMLInputElement ? expressionNode.value.trim() : ""
  };
}

function fillWebtoolsCronTemplateEditor(
  form: HTMLFormElement,
  template: WebtoolsCronTemplateItem | null
): void {
  webtoolsCronEditingTemplateKey = template?.key ?? "";
  const summaryNode = form.elements.namedItem("webtoolsCronTemplateSummary");
  const expressionNode = form.elements.namedItem("webtoolsCronTemplateExpression");
  const saveButton = form.querySelector<HTMLButtonElement>("[data-webtools-cron-template-save]");
  if (summaryNode instanceof HTMLInputElement) {
    summaryNode.value = template?.summary ?? "";
  }
  if (expressionNode instanceof HTMLInputElement) {
    expressionNode.value = template?.expression ?? "";
  }
  if (saveButton) {
    saveButton.textContent = template ? "更新模板" : "保存模板";
  }
}

function renderWebtoolsCronTemplateGrid(
  templateGrid: HTMLDivElement,
  form: HTMLFormElement
): void {
  templateGrid.replaceChildren();
  getWebtoolsCronTemplates().forEach((template) => {
    const item = document.createElement("div");
    item.className = "webtools-cron-template-item has-delete";

    const button = document.createElement("button");
    button.type = "button";
    button.className =
      template.key === webtoolsCronEditingTemplateKey ||
      template.key === webtoolsCronTemplateKey
        ? "settings-btn webtools-cron-template-chip is-active"
        : "settings-btn webtools-cron-template-chip";
    button.setAttribute("data-webtools-cron-template", template.key);
    button.textContent = template.summary;
    button.title = template.expression;
    button.addEventListener("click", () => {
      fillWebtoolsCronTemplateEditor(form, template);
      const expressionNode = form.elements.namedItem("webtoolsCronExpression");
      if (expressionNode instanceof HTMLInputElement) {
        expressionNode.value = template.expression;
      }
      renderWebtoolsCronTemplateGrid(templateGrid, form);
      void executeWebtoolsCronAction("parse", template.expression, {
        render: false,
        form
      });
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "settings-btn webtools-cron-template-delete";
    deleteButton.setAttribute("data-webtools-cron-template-delete", template.key);
    deleteButton.setAttribute("aria-label", `删除模板 ${template.summary}`);
    deleteButton.textContent = "×";
    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      void executeWebtoolsCronTemplateAction("delete-template", { key: template.key }, form);
    });

    item.append(button, deleteButton);
    templateGrid.appendChild(item);
  });
}

function refreshWebtoolsCronTemplatesInForm(form: HTMLFormElement): void {
  const templateGrid = form.querySelector<HTMLDivElement>(".webtools-cron-template-grid");
  if (templateGrid) {
    renderWebtoolsCronTemplateGrid(templateGrid, form);
  }
  fillWebtoolsCronTemplateEditor(
    form,
    webtoolsCronEditingTemplateKey
      ? getWebtoolsCronTemplates().find((item) => item.key === webtoolsCronEditingTemplateKey) ??
          null
      : null
  );
}

async function executeWebtoolsCronTemplateAction(
  action: WebtoolsCronTemplateAction,
  input: { expression?: string; summary?: string; key?: string },
  form: HTMLFormElement
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行 Cron 工具");
    return;
  }

  if (action === "reset-templates") {
    const confirmed = window.confirm("确定恢复为默认 5 个模板吗？当前自定义内容将被覆盖。");
    if (!confirmed) {
      return;
    }
  }

  const editorValues = readWebtoolsCronTemplateEditorValues(form);
  const expression =
    input.expression?.trim() ||
    editorValues.expression ||
    webtoolsCronExpression;
  const summary = input.summary?.trim() || editorValues.summary;
  const requestToken = ++webtoolsCronRequestToken;

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_CRON_PLUGIN_ID}:${action}`,
    type: "command",
    title: "Cron 生成器",
    subtitle: "模板管理",
    target: buildWebtoolsCronTemplateTarget(action, {
      expression,
      summary,
      key: input.key ?? webtoolsCronEditingTemplateKey
    }),
    keywords: ["plugin", "cron", "template", "定时", "表达式"]
  };

  const result = await launcher.execute(item);
  if (requestToken !== webtoolsCronRequestToken) {
    return;
  }

  const data = toRecord(result.data);
  hydrateWebtoolsCronTemplates(data);
  if (data && typeof data.expression === "string") {
    hydrateWebtoolsCronState(data);
  }

  if (action === "delete-template") {
    if (webtoolsCronEditingTemplateKey === input.key) {
      webtoolsCronEditingTemplateKey = "";
    }
  } else if (action === "reset-templates" && result.ok) {
    webtoolsCronEditingTemplateKey = "";
  } else if (
    (action === "save-template" || action === "update-template") &&
    result.ok
  ) {
    const saved = getWebtoolsCronTemplates().find((item) => item.expression === expression);
    webtoolsCronEditingTemplateKey = saved?.key ?? "";
  }

  setStatus(result.message ?? (result.ok ? "模板操作完成" : "模板操作失败"));
  refreshWebtoolsCronTemplatesInForm(form);
  refreshWebtoolsCronResultInForm(form);
}

function rebuildWebtoolsCronExpressionFromFields(form: HTMLFormElement): string {
  const keys: WebtoolsCronFieldKey[] = ["minute", "hour", "day", "month", "weekday"];
  return keys
    .map((key) => {
      const node = form.elements.namedItem(`webtoolsCronField-${key}`);
      return node instanceof HTMLInputElement && node.value.trim() ? node.value.trim() : "*";
    })
    .join(" ");
}

async function copyWebtoolsCronText(
  kind: WebtoolsCronCopyState,
  text: string,
  form?: HTMLFormElement
): Promise<void> {
  if (!text.trim()) {
    setStatus("当前没有可复制的内容");
    return;
  }
  const copied =
    kind === "expression"
      ? await copyTextToClipboard(webtoolsCronExpression)
      : kind === "readable"
        ? webtoolsCronReadable.trim()
          ? await copyTextToClipboard(webtoolsCronReadable)
          : await copyTextToClipboard(webtoolsCronErrorMessage)
        : await copyTextToClipboard(text);
  webtoolsCronCopyState = copied ? kind : "";
  setStatus(copied ? "Cron 内容已复制" : "复制失败");
  if (form) {
    refreshWebtoolsCronResultInForm(form);
  }
}

function resetWebtoolsCronState(expression = webtoolsCronExpression): void {
  webtoolsCronExpression = expression.trim() || "5 4 * * *";
  webtoolsCronReadable = "";
  webtoolsCronNextRun = "";
  webtoolsCronUpcoming = [];
  webtoolsCronStatus = "";
  webtoolsCronErrorMessage = "";
  webtoolsCronErrorField = "";
  webtoolsCronWarnings = [];
  webtoolsCronTemplateKey = "";
  webtoolsCronTemplateSummary = "";
  webtoolsCronFieldMeta = buildWebtoolsCronFallbackFieldMeta(webtoolsCronExpression, "");
  webtoolsCronCopyState = "";
}

function hydrateWebtoolsCronState(data: Record<string, unknown> | null): void {
  const nextExpression =
    data && typeof data.expression === "string" ? data.expression : webtoolsCronExpression;
  webtoolsCronExpression = nextExpression.trim() || "5 4 * * *";
  webtoolsCronReadable = data && typeof data.readable === "string" ? data.readable : "";
  webtoolsCronNextRun = data && typeof data.nextRun === "string" ? data.nextRun : "";
  webtoolsCronUpcoming = data ? toStringArray(data.upcoming) : [];
  webtoolsCronStatus = data ? normalizeWebtoolsCronStatus(data.status) : "";
  webtoolsCronErrorMessage =
    data && typeof data.errorMessage === "string" ? data.errorMessage : "";
  webtoolsCronErrorField = data ? normalizeWebtoolsCronErrorField(data.errorField) : "";
  webtoolsCronWarnings = data ? toStringArray(data.warnings) : [];
  webtoolsCronTemplateKey = data && typeof data.templateKey === "string" ? data.templateKey : "";
  webtoolsCronTemplateSummary =
    data && typeof data.templateSummary === "string" ? data.templateSummary : "";
  webtoolsCronFieldMeta = parseWebtoolsCronFieldMeta(
    data?.fieldMeta,
    webtoolsCronExpression,
    webtoolsCronErrorField
  );
  hydrateWebtoolsCronTemplates(data);
}

function buildWebtoolsCronTarget(action: "parse" | "random", expression: string): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("expression", expression);
  return `command:plugin:${WEBTOOLS_CRON_PLUGIN_ID}?${params.toString()}`;
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
      ? `下一次 ${webtoolsCronNextRun}`
      : "-";
  }

  getWebtoolsCronFieldMeta().forEach((field) => {
    const node = form.elements.namedItem(`webtoolsCronField-${field.key}`);
    if (node instanceof HTMLInputElement) {
      node.value = field.value;
    }
    const card = form.querySelector<HTMLElement>(
      `[data-webtools-cron-field-card="${field.key}"]`
    );
    if (card) {
      card.classList.toggle("is-error", field.hasError);
    }
    const hint = form.querySelector<HTMLElement>(`[data-webtools-cron-field-hint="${field.key}"]`);
    if (hint) {
      hint.textContent = field.hint;
    }
  });

  form
    .querySelectorAll<HTMLButtonElement>("[data-webtools-cron-template]")
    .forEach((button) => {
      const active =
        button.dataset.webtoolsCronTemplate === webtoolsCronTemplateKey ||
        button.dataset.webtoolsCronTemplate === webtoolsCronEditingTemplateKey;
      button.classList.toggle("is-active", active);
    });

  const upcomingNode = form.querySelector(".webtools-cron-upcoming-value");
  if (upcomingNode instanceof HTMLDivElement) {
    upcomingNode.textContent =
      webtoolsCronUpcoming.length > 0 ? webtoolsCronUpcoming.join("\n") : "-";
  }

  const summaryNode = form.querySelector(".webtools-cron-summary");
  if (summaryNode instanceof HTMLDivElement) {
    if (webtoolsCronErrorMessage) {
      summaryNode.textContent = webtoolsCronErrorMessage;
      summaryNode.dataset.state = "error";
    } else if (webtoolsCronWarnings.length > 0) {
      summaryNode.textContent = webtoolsCronWarnings.join(" ");
      summaryNode.dataset.state = "warning";
    } else if (webtoolsCronTemplateSummary) {
      summaryNode.textContent = webtoolsCronTemplateSummary;
      summaryNode.dataset.state = webtoolsCronStatus || "success";
    } else {
      summaryNode.textContent = webtoolsCronReadable || "编辑表达式后自动解析";
      summaryNode.dataset.state = webtoolsCronStatus || "idle";
    }
  }

  const statusNode = form.querySelector(".webtools-cron-status-badge");
  if (statusNode instanceof HTMLSpanElement) {
    const badgeText =
      webtoolsCronStatus === "error"
        ? "错误"
        : webtoolsCronStatus === "warning"
          ? "提醒"
          : webtoolsCronReadable
            ? "已解析"
            : "待输入";
    statusNode.textContent = badgeText;
    statusNode.dataset.state =
      webtoolsCronStatus || (webtoolsCronReadable || webtoolsCronExpression ? "success" : "idle");
  }

  const expressionCopyButton = form.querySelector<HTMLButtonElement>(
    '[data-webtools-cron-copy="expression"]'
  );
  if (expressionCopyButton) {
    expressionCopyButton.textContent =
      webtoolsCronCopyState === "expression" ? "已复制表达式" : "复制表达式";
  }

  const readableCopyButton = form.querySelector<HTMLButtonElement>(
    '[data-webtools-cron-copy="readable"]'
  );
  if (readableCopyButton) {
    readableCopyButton.textContent =
      webtoolsCronCopyState === "readable" ? "已复制说明" : "复制说明";
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
  webtoolsCronCopyState = "";
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
  resetWebtoolsCronState(expression);
  hydrateWebtoolsCronState(data);

  setStatus(result.message ?? (result.ok ? "解析完成" : "解析失败"));
  if (shouldRender) {
    renderList();
    return;
  }

  if (options.form) {
    refreshWebtoolsCronResultInForm(options.form);
  }
}

// --- ImageBase64 state ---
let webtoolsImageBase64Input = "";
let webtoolsImageBase64DataUrl = "";
let webtoolsImageBase64Raw = "";
let webtoolsImageBase64Mime = "";
let webtoolsImageBase64SizeText = "";
let webtoolsImageBase64Info = "";
let webtoolsImageBase64Error = "";
let webtoolsImageBase64Dragging = false;
let webtoolsImageBase64FileName = "";
let webtoolsImageBase64AutoTimer: number | null = null;
let webtoolsImageBase64RequestToken = 0;

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
  if (mime === "image/jpeg") return "image.jpg";
  if (mime === "image/webp") return "image.webp";
  if (mime === "image/gif") return "image.gif";
  if (mime === "image/svg+xml") return "image.svg";
  return "image.png";
}

function readWebtoolsImageBase64FileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => {
      reject(new Error("读取图片失败"));
    };
    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result.startsWith("data:image/")) {
        resolve(reader.result);
        return;
      }
      reject(new Error("图片格式无效"));
    };
    reader.readAsDataURL(file);
  });
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

// --- ImagePrompt early helpers ---
function findWebtoolsImagePromptTextDesign(idOrLabel: string | undefined): WebtoolsImagePromptTextDesign {
  return (
    WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.designs.find(
      (design) => design.id === idOrLabel || design.label === idOrLabel
    ) ?? WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.designs[0]
  );
}

function createWebtoolsImagePromptTextState(
  defaults: Partial<WebtoolsImagePromptTextState> = {}
): WebtoolsImagePromptTextState {
  const design = findWebtoolsImagePromptTextDesign(defaults.designId ?? defaults.design);
  return {
    exact: defaults.exact ?? "",
    position: defaults.position ?? "顶部居中",
    style: defaults.style ?? "无衬线加粗",
    designId: defaults.designId ?? design.id,
    design: defaults.design ?? design.label,
    title: defaults.title ?? "",
    subtitle: defaults.subtitle ?? "",
    label: defaults.label ?? "",
    name: defaults.name ?? "",
    age: defaults.age ?? "",
    layout: defaults.layout ?? design.layout,
    hierarchy: defaults.hierarchy ?? design.hierarchy,
    color: defaults.color ?? design.color,
    effect: defaults.effect ?? design.effect,
    safeArea: defaults.safeArea ?? design.safeArea,
    flags: [...(defaults.flags ?? ["高对比", "仅出现一次"])]
  };
}

function applyWebtoolsImagePromptTextDesign(
  text: WebtoolsImagePromptTextState,
  design: WebtoolsImagePromptTextDesign
): WebtoolsImagePromptTextState {
  return {
    ...text,
    designId: design.id,
    design: design.label,
    layout: design.layout,
    hierarchy: design.hierarchy,
    color: design.color,
    effect: design.effect,
    safeArea: design.safeArea
  };
}

function createEmptyWebtoolsImagePromptSelections(): Record<
  WebtoolsImagePromptOptionGroupKey,
  string[]
> {
  return {
    subject: [],
    style: [],
    composition: [],
    lighting: [],
    materials: [],
    environment: [],
    mood: [],
    constraints: []
  };
}

function createEmptyWebtoolsImagePromptCustom(): Record<
  Exclude<WebtoolsImagePromptOptionGroupKey, "constraints">,
  string
> {
  return {
    subject: "",
    style: "",
    composition: "",
    lighting: "",
    materials: "",
    environment: "",
    mood: ""
  };
}

function compactWebtoolsImagePromptOptions(options: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const option of options) {
    const normalized = option.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function normalizeWebtoolsImagePromptStylePresetId(
  value: string | undefined
): WebtoolsImagePromptStylePresetId {
  return WEBTOOLS_IMAGE_PROMPT_STYLE_PRESETS_FROM_SHARED.some((preset) => preset.id === value)
    ? (value as WebtoolsImagePromptStylePresetId)
    : "ecommerce-main";
}

function getWebtoolsImagePromptStylePreset(
  id: WebtoolsImagePromptStylePresetId
): WebtoolsImagePromptStylePreset {
  return (
    WEBTOOLS_IMAGE_PROMPT_STYLE_PRESETS_FROM_SHARED.find((preset) => preset.id === id) ??
    WEBTOOLS_IMAGE_PROMPT_STYLE_PRESETS_FROM_SHARED[0]
  );
}

function createWebtoolsImagePromptSelectionStateFromPreset(
  stylePresetId: WebtoolsImagePromptStylePresetId
): Record<WebtoolsImagePromptOptionGroupKey, string[]> {
  const preset = getWebtoolsImagePromptStylePreset(stylePresetId);
  const selections = createEmptyWebtoolsImagePromptSelections();
  for (const key of Object.keys(preset.defaults) as WebtoolsImagePromptOptionGroupKey[]) {
    selections[key] = [...(preset.defaults[key] ?? [])];
  }
  return selections;
}

function getWebtoolsImagePromptOptionGroupsForStyle(
  stylePresetId: WebtoolsImagePromptStylePresetId
): WebtoolsImagePromptOptionGroup[] {
  const preset = getWebtoolsImagePromptStylePreset(stylePresetId);
  return WEBTOOLS_IMAGE_PROMPT_OPTION_GROUPS.map((group) => ({
    ...group,
    options: [...(preset.optionGroups[group.key] ?? group.options)],
    categories: undefined
  }));
}

function createDefaultWebtoolsImagePromptState(
  stylePresetId: WebtoolsImagePromptStylePresetId = "ecommerce-main"
): WebtoolsImagePromptState {
  const normalizedPresetId = normalizeWebtoolsImagePromptStylePresetId(stylePresetId);
  const preset = getWebtoolsImagePromptStylePreset(normalizedPresetId);
  return {
    productId: "chatgpt-images-2",
    stylePresetId: normalizedPresetId,
    photoDescription: "",
    selections: createWebtoolsImagePromptSelectionStateFromPreset(normalizedPresetId),
    custom: createEmptyWebtoolsImagePromptCustom(),
    text: createWebtoolsImagePromptTextState(preset.textDefaults),
    constraints: ["无水印", "无logo", "无额外文字"]
  };
}

function normalizeWebtoolsImagePromptSmartTemplateId(
  value: string | undefined
): WebtoolsImagePromptSmartTemplateId {
  return WEBTOOLS_IMAGE_PROMPT_SMART_TEMPLATES.some((template) => template.id === value)
    ? (value as WebtoolsImagePromptSmartTemplateId)
    : "ecommerce-main-image";
}

function getWebtoolsImagePromptSmartTemplate(
  templateId: WebtoolsImagePromptSmartTemplateId
): WebtoolsImagePromptSmartTemplate {
  return (
    WEBTOOLS_IMAGE_PROMPT_SMART_TEMPLATES.find((template) => template.id === templateId) ??
    WEBTOOLS_IMAGE_PROMPT_SMART_TEMPLATES[0]
  );
}

function createWebtoolsImagePromptSmartTemplateState(
  templateId: WebtoolsImagePromptSmartTemplateId
): WebtoolsImagePromptState {
  const template = getWebtoolsImagePromptSmartTemplate(
    normalizeWebtoolsImagePromptSmartTemplateId(templateId)
  );
  const state = createDefaultWebtoolsImagePromptState(template.stylePresetId);
  const patch = template.patch;

  if (patch.photoDescription !== undefined) {
    state.photoDescription = patch.photoDescription;
  }

  for (const key of Object.keys(patch.selections ?? {}) as WebtoolsImagePromptOptionGroupKey[]) {
    state.selections[key] = [...(patch.selections?.[key] ?? [])];
  }

  for (const key of Object.keys(patch.custom ?? {}) as Array<
    Exclude<WebtoolsImagePromptOptionGroupKey, "constraints">
  >) {
    state.custom[key] = patch.custom?.[key] ?? "";
  }

  state.text = {
    ...state.text,
    ...(patch.text ?? {}),
    flags: patch.text?.flags ? [...patch.text.flags] : [...state.text.flags]
  };
  if (patch.constraints) {
    state.constraints = [...patch.constraints];
  }

  return state;
}

function cloneWebtoolsImagePromptState(
  state: WebtoolsImagePromptState
): WebtoolsImagePromptState {
  return {
    productId: state.productId,
    stylePresetId: state.stylePresetId,
    photoDescription: state.photoDescription,
    selections: {
      subject: [...state.selections.subject],
      style: [...state.selections.style],
      composition: [...state.selections.composition],
      lighting: [...state.selections.lighting],
      materials: [...state.selections.materials],
      environment: [...state.selections.environment],
      mood: [...state.selections.mood],
      constraints: [...state.selections.constraints]
    },
    custom: { ...state.custom },
    text: {
      exact: state.text.exact,
      position: state.text.position,
      style: state.text.style,
      designId: state.text.designId,
      design: state.text.design,
      title: state.text.title,
      subtitle: state.text.subtitle,
      label: state.text.label,
      name: state.text.name,
      age: state.text.age,
      layout: state.text.layout,
      hierarchy: state.text.hierarchy,
      color: state.text.color,
      effect: state.text.effect,
      safeArea: state.text.safeArea,
      flags: [...state.text.flags]
    },
    constraints: [...state.constraints]
  };
}

function getWebtoolsImagePromptSelectedOptions(
  state: WebtoolsImagePromptState,
  key: WebtoolsImagePromptOptionGroupKey
): string[] {
  return key === "constraints"
    ? [...state.selections.constraints, ...state.constraints]
    : state.selections[key];
}

const WEBTOOLS_IMAGE_PROMPT_EXAMPLE: WebtoolsImagePromptState = {
  productId: "chatgpt-images-2",
  stylePresetId: "ecommerce-main",
  photoDescription: "",
  selections: {
    subject: ["一款无线蓝牙耳机悬浮在画面中央"],
    style: ["商业摄影风格"],
    composition: ["居中构图", "产品占画面70%", "顶部留白用于文字", "3:4比例"],
    lighting: ["柔光棚拍", "均匀阴影"],
    materials: ["磨砂塑料材质带细腻反光"],
    environment: ["白色渐变背景"],
    mood: ["高级质感", "整体干净专业氛围"],
    constraints: []
  },
  custom: createEmptyWebtoolsImagePromptCustom(),
  text: {
    exact: "降噪黑科技",
    position: "顶部居中",
    style: "无衬线加粗",
    designId: WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.designs[0]?.id ?? "",
    design: WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.designs[0]?.label ?? "",
    title: "",
    subtitle: "",
    label: "",
    name: "",
    age: "",
    layout: WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.designs[0]?.layout ?? "",
    hierarchy: WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.designs[0]?.hierarchy ?? "",
    color: WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.designs[0]?.color ?? "",
    effect: WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.designs[0]?.effect ?? "",
    safeArea: WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.designs[0]?.safeArea ?? "",
    flags: ["高对比", "仅出现一次"]
  },
  constraints: ["无水印", "无logo", "无额外文字"]
};

const WEBTOOLS_IMAGE_PROMPT_BIRTHDAY_EXAMPLES: Array<{
  label: string;
  state: WebtoolsImagePromptState;
}> = [
  {
    label: "1周岁宝宝",
    state: {
      ...createDefaultWebtoolsImagePromptState("birthday-party"),
      photoDescription: "1岁宝宝，圆脸，笑着看镜头，穿浅色生日服",
      text: {
        ...createDefaultWebtoolsImagePromptState("birthday-party").text,
        exact: "1周岁生日",
        age: "1周岁"
      },
      selections: {
        ...createWebtoolsImagePromptSelectionStateFromPreset("birthday-party"),
        style: ["宝宝周岁生日海报风格"],
        mood: ["可爱治愈氛围", "温暖家庭氛围"]
      }
    }
  },
  {
    label: "3周岁儿童",
    state: {
      ...createDefaultWebtoolsImagePromptState("birthday-party"),
      photoDescription: "3岁儿童，笑容自然，穿浅色毛衣，看向镜头",
      text: {
        ...createDefaultWebtoolsImagePromptState("birthday-party").text,
        exact: "3周岁生日",
        age: "3周岁"
      }
    }
  },
  {
    label: "公主风女孩",
    state: {
      ...createDefaultWebtoolsImagePromptState("birthday-party"),
      photoDescription: "6岁小女孩，穿公主裙，笑着看镜头，发型整洁",
      text: {
        ...createDefaultWebtoolsImagePromptState("birthday-party").text,
        exact: "6周岁生日",
        age: "6周岁"
      },
      selections: {
        ...createWebtoolsImagePromptSelectionStateFromPreset("birthday-party"),
        style: ["梦幻气球派对视觉风格"],
        environment: ["柔和粉色渐变背景", "彩色气球和彩带布置"],
        mood: ["梦幻甜美氛围", "欢乐庆祝氛围"]
      }
    }
  },
  {
    label: "宇航员男孩",
    state: {
      ...createDefaultWebtoolsImagePromptState("birthday-party"),
      photoDescription: "5岁小男孩，穿蓝色上衣，活泼笑容，看向镜头",
      text: {
        ...createDefaultWebtoolsImagePromptState("birthday-party").text,
        exact: "5周岁生日",
        age: "5周岁"
      },
      selections: {
        ...createWebtoolsImagePromptSelectionStateFromPreset("birthday-party"),
        style: ["儿童生日派对摄影风格"],
        lighting: ["彩色氛围灯", "轻微闪光点缀"],
        mood: ["生日惊喜感", "轻松派对感"]
      }
    }
  },
  {
    label: "成人简约",
    state: {
      ...createDefaultWebtoolsImagePromptState("birthday-party"),
      photoDescription: "成年人半身照片，笑容自然，穿简洁服装，背景干净",
      text: {
        ...createDefaultWebtoolsImagePromptState("birthday-party").text,
        exact: "生日快乐",
        age: ""
      },
      selections: {
        ...createWebtoolsImagePromptSelectionStateFromPreset("birthday-party"),
        style: ["生日邀请函视觉风格"],
        environment: ["柔和粉色渐变背景"],
        mood: ["精致高级庆生氛围", "温暖家庭氛围"]
      }
    }
  },
  {
    label: "长辈温馨",
    state: {
      ...createDefaultWebtoolsImagePromptState("birthday-party"),
      photoDescription: "长辈半身照片，神态慈祥，穿得体服装，笑容温和",
      text: {
        ...createDefaultWebtoolsImagePromptState("birthday-party").text,
        exact: "生日快乐",
        age: ""
      },
      selections: {
        ...createWebtoolsImagePromptSelectionStateFromPreset("birthday-party"),
        style: ["温暖家庭庆生摄影风格"],
        environment: ["温暖家居庆生背景"],
        mood: ["温暖家庭氛围", "精致高级庆生氛围"]
      }
    }
  }
];

// --- ImagePrompt state ---
let webtoolsImagePromptState: WebtoolsImagePromptState =
  createDefaultWebtoolsImagePromptState();
let webtoolsImagePromptOutput = "";
let webtoolsImagePromptInfo = "";
let webtoolsImagePromptRequestToken = 0;

// --- ImagePrompt helpers ---
function normalizeWebtoolsImagePromptProductId(value: string): WebtoolsImagePromptProductId {
  return value === "chatgpt-images-2" ? "chatgpt-images-2" : "chatgpt-images-2";
}

function filterWebtoolsImagePromptStateForStyle(
  state: WebtoolsImagePromptState
): WebtoolsImagePromptState {
  const optionGroups = getWebtoolsImagePromptOptionGroupsForStyle(state.stylePresetId);
  const allowed = new Map<WebtoolsImagePromptOptionGroupKey, Set<string>>();
  optionGroups.forEach((group) => {
    allowed.set(group.key, new Set(group.options));
  });
  const next = cloneWebtoolsImagePromptState(state);
  for (const key of WEBTOOLS_IMAGE_PROMPT_GROUP_KEYS) {
    const groupAllowed = allowed.get(key);
    if (!groupAllowed) {
      continue;
    }
    next.selections[key] = next.selections[key].filter((item) => groupAllowed.has(item));
  }
  next.constraints = next.constraints.filter((item) => allowed.get("constraints")?.has(item));
  return next;
}

function readWebtoolsImagePromptStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
}

function normalizeWebtoolsImagePromptState(value: unknown): WebtoolsImagePromptState {
  const data = toRecord(value);
  const next = createDefaultWebtoolsImagePromptState();

  if (!data) {
    return next;
  }
  if (typeof data.productId === "string") {
    next.productId = normalizeWebtoolsImagePromptProductId(data.productId);
  }
  if (typeof data.stylePresetId === "string") {
    next.stylePresetId = normalizeWebtoolsImagePromptStylePresetId(data.stylePresetId);
  }
  if (typeof data.photoDescription === "string") {
    next.photoDescription = data.photoDescription;
  }

  const selections = toRecord(data.selections);
  if (selections) {
    for (const key of WEBTOOLS_IMAGE_PROMPT_GROUP_KEYS) {
      next.selections[key] = readWebtoolsImagePromptStringList(selections[key]);
    }
  }

  const custom = toRecord(data.custom);
  if (custom) {
    for (const key of WEBTOOLS_IMAGE_PROMPT_GROUP_KEYS) {
      if (key === "constraints") {
        continue;
      }
      const customValue = custom[key];
      if (typeof customValue === "string") {
        next.custom[key] = customValue;
      }
    }
  }

  const text = toRecord(data.text);
  if (text) {
    if (typeof text.exact === "string") {
      next.text.exact = text.exact;
    }
    if (typeof text.position === "string") {
      next.text.position = text.position;
    }
    if (typeof text.style === "string") {
      next.text.style = text.style;
    }
    if (typeof text.designId === "string") {
      next.text = applyWebtoolsImagePromptTextDesign(
        next.text,
        findWebtoolsImagePromptTextDesign(text.designId)
      );
    }
    if (typeof text.design === "string") {
      const design = findWebtoolsImagePromptTextDesign(text.design);
      next.text = applyWebtoolsImagePromptTextDesign(next.text, design);
    }
    if (typeof text.title === "string") {
      next.text.title = text.title;
    }
    if (typeof text.subtitle === "string") {
      next.text.subtitle = text.subtitle;
    }
    if (typeof text.label === "string") {
      next.text.label = text.label;
    }
    if (typeof text.name === "string") {
      next.text.name = text.name;
    }
    if (typeof text.age === "string") {
      next.text.age = text.age;
    }
    if (typeof text.layout === "string") {
      next.text.layout = text.layout;
    }
    if (typeof text.hierarchy === "string") {
      next.text.hierarchy = text.hierarchy;
    }
    if (typeof text.color === "string") {
      next.text.color = text.color;
    }
    if (typeof text.effect === "string") {
      next.text.effect = text.effect;
    }
    if (typeof text.safeArea === "string") {
      next.text.safeArea = text.safeArea;
    }
    next.text.flags = readWebtoolsImagePromptStringList(text.flags);
  }

  next.constraints = readWebtoolsImagePromptStringList(data.constraints);

  return next;
}

function collectWebtoolsImagePromptState(form: HTMLFormElement): WebtoolsImagePromptState {
  const readValue = (name: string): string => {
    const node = form.elements.namedItem(name);
    return node instanceof HTMLTextAreaElement ||
      node instanceof HTMLInputElement ||
      node instanceof HTMLSelectElement
      ? node.value.trim()
      : "";
  };
  const readCheckedValues = (name: string): string[] =>
    Array.from(form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`))
      .map((node) => node.value.trim())
      .filter(Boolean);
  const productNode = form.elements.namedItem("webtoolsImagePromptProduct");
  const stylePresetValue = readCheckedValues("webtoolsImagePromptStylePreset")[0];
  const stylePresetId = stylePresetValue
    ? normalizeWebtoolsImagePromptStylePresetId(stylePresetValue)
    : webtoolsImagePromptState.stylePresetId;
  const textDesign = findWebtoolsImagePromptTextDesign(
    readValue("webtoolsImagePromptTextDesign") || webtoolsImagePromptState.text.designId
  );
  const state: WebtoolsImagePromptState = {
    productId:
      productNode instanceof HTMLSelectElement
        ? normalizeWebtoolsImagePromptProductId(productNode.value)
        : "chatgpt-images-2",
    stylePresetId,
    photoDescription: readValue("webtoolsImagePromptPhotoDescription"),
    selections: createEmptyWebtoolsImagePromptSelections(),
    custom: createEmptyWebtoolsImagePromptCustom(),
    text: createWebtoolsImagePromptTextState({
      exact: readValue("webtoolsImagePromptTextExact"),
      position: readValue("webtoolsImagePromptTextPosition") || "顶部居中",
      style: readValue("webtoolsImagePromptTextStyle") || "无衬线加粗",
      designId: textDesign.id,
      design: textDesign.label,
      title: readValue("webtoolsImagePromptTextTitle"),
      subtitle: readValue("webtoolsImagePromptTextSubtitle"),
      label: readValue("webtoolsImagePromptTextLabel"),
      name: readValue("webtoolsImagePromptTextName"),
      age: readValue("webtoolsImagePromptTextAge"),
      flags: readCheckedValues("webtoolsImagePromptTextFlag")
    }),
    constraints: readCheckedValues("webtoolsImagePromptSelection-constraints")
  };

  for (const key of WEBTOOLS_IMAGE_PROMPT_GROUP_KEYS) {
    if (key === "constraints") {
      continue;
    }
    state.selections[key] = readCheckedValues(`webtoolsImagePromptSelection-${key}`);
    state.custom[key] = readValue(`webtoolsImagePromptCustom-${key}`);
  }

  return filterWebtoolsImagePromptStateForStyle(state);
}

function syncWebtoolsImagePromptForm(form: HTMLFormElement, state: WebtoolsImagePromptState): void {
  const setValue = (name: string, value: string): void => {
    const node = form.elements.namedItem(name);
    if (
      node instanceof HTMLInputElement ||
      node instanceof HTMLSelectElement ||
      node instanceof HTMLTextAreaElement
    ) {
      node.value = value;
    }
  };
  const setCheckedValues = (name: string, values: string[]): void => {
    const selected = new Set(values);
    form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`).forEach((node) => {
      node.checked = selected.has(node.value);
      const label = node.closest<HTMLElement>(".webtools-image-prompt-chip");
      if (label) {
        label.dataset.selected = String(node.checked);
      }
    });
  };

  setValue("webtoolsImagePromptProduct", state.productId);
  setCheckedValues("webtoolsImagePromptStylePreset", [state.stylePresetId]);
  setValue("webtoolsImagePromptPhotoDescription", state.photoDescription);
  for (const key of WEBTOOLS_IMAGE_PROMPT_GROUP_KEYS) {
    setCheckedValues(
      `webtoolsImagePromptSelection-${key}`,
      getWebtoolsImagePromptSelectedOptions(state, key)
    );
    if (key !== "constraints") {
      setValue(`webtoolsImagePromptCustom-${key}`, state.custom[key]);
    }
  }
  setValue("webtoolsImagePromptTextExact", state.text.exact);
  setValue("webtoolsImagePromptTextPosition", state.text.position);
  setValue("webtoolsImagePromptTextStyle", state.text.style);
  setValue("webtoolsImagePromptTextDesign", state.text.designId);
  setValue("webtoolsImagePromptTextTitle", state.text.title);
  setValue("webtoolsImagePromptTextSubtitle", state.text.subtitle);
  setValue("webtoolsImagePromptTextLabel", state.text.label);
  setValue("webtoolsImagePromptTextName", state.text.name);
  setValue("webtoolsImagePromptTextAge", state.text.age);
  setCheckedValues("webtoolsImagePromptTextFlag", state.text.flags);
}

function createClearedWebtoolsImagePromptState(): WebtoolsImagePromptState {
  return {
    productId: "chatgpt-images-2",
    stylePresetId: "ecommerce-main",
    photoDescription: "",
    selections: createEmptyWebtoolsImagePromptSelections(),
    custom: createEmptyWebtoolsImagePromptCustom(),
    text: createWebtoolsImagePromptTextState({
      exact: "",
      position: "顶部居中",
      style: "无衬线加粗",
      flags: []
    }),
    constraints: []
  };
}

function buildWebtoolsImagePromptTarget(state: WebtoolsImagePromptState): string {
  const params = new URLSearchParams();
  params.set("action", "build");
  params.set("state", JSON.stringify(state));
  return `command:plugin:${WEBTOOLS_IMAGE_PROMPT_PLUGIN_ID}?${params.toString()}`;
}

function refreshWebtoolsImagePromptPanelInForm(form: HTMLFormElement): void {
  const output = form.elements.namedItem("webtoolsImagePromptOutput");
  if (output instanceof HTMLTextAreaElement) {
    output.value = webtoolsImagePromptOutput;
  }
  const info = form.querySelector<HTMLElement>(".webtools-image-prompt-info");
  if (info) {
    info.textContent =
      webtoolsImagePromptInfo ||
      (webtoolsImagePromptOutput.trim()
        ? `已生成 ${webtoolsImagePromptOutput.length} 字符`
        : "选择模块后生成提示词");
    info.dataset.state = webtoolsImagePromptOutput.trim() ? "ok" : "idle";
  }
  const copyButton = form.querySelector<HTMLButtonElement>("[data-webtools-image-prompt-copy]");
  if (copyButton) {
    copyButton.disabled = !webtoolsImagePromptOutput.trim();
  }
}

async function executeWebtoolsImagePromptBuild(
  form: HTMLFormElement,
  options: { render?: boolean; state?: WebtoolsImagePromptState } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法生成图片提示词");
    return;
  }
  const shouldRender = options.render ?? true;
  const requestToken = ++webtoolsImagePromptRequestToken;
  webtoolsImagePromptState = options.state
    ? filterWebtoolsImagePromptStateForStyle(options.state)
    : collectWebtoolsImagePromptState(form);

  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_IMAGE_PROMPT_PLUGIN_ID}:build`,
    type: "command",
    title: "图片提示词",
    subtitle: "面板执行",
    target: buildWebtoolsImagePromptTarget(webtoolsImagePromptState),
    keywords: ["plugin", "prompt", "image", "提示词", "图片"]
  };

  const result = await launcher.execute(item);
  if (requestToken !== webtoolsImagePromptRequestToken) {
    return;
  }
  const data = toRecord(result.data);
  webtoolsImagePromptOutput =
    data && typeof data.output === "string" ? data.output : "";
  webtoolsImagePromptInfo = result.message ?? (result.ok ? "图片提示词已生成" : "生成失败");

  setStatus(webtoolsImagePromptInfo);
  if (shouldRender) {
    renderList();
    return;
  }
  refreshWebtoolsImagePromptPanelInForm(form);
}


// --- Config/SQL/Unit state ---
const WEBTOOLS_UNIT_STORAGE_FACTORS: Record<WebtoolsUnitStorageKey, number> = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4
};

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

// --- Config/SQL/Unit helpers ---
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

function refreshWebtoolsUnitCards(form: HTMLFormElement): void {
  const setCardValue = (key: string, value: string): void => {
    form.querySelectorAll<HTMLElement>(`[data-webtools-unit-card="${key}"]`).forEach((node) => {
      node.textContent = value;
    });
  };

  if (webtoolsUnitActiveTab === "storage") {
    (["B", "KB", "MB", "GB", "TB"] as WebtoolsUnitStorageKey[]).forEach((unit) => {
      setCardValue(unit, `${formatWebtoolsUnitStorageValue(webtoolsUnitStorageValues[unit])} ${unit}`);
    });
    return;
  }

  setCardValue("pixel", `${Number(webtoolsUnitPixel.toFixed(4))} px`);
  setCardValue("rem", `${Number(webtoolsUnitRem.toFixed(4))} rem`);
  setCardValue("basePx", `${Number(webtoolsUnitBasePx.toFixed(4))} px`);
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
  refreshWebtoolsUnitCards(form);
  refreshWebtoolsUnitInfo(form);
}


// --- Markdown/UA state ---
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

// --- Markdown/UA helpers ---
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

  const unitSelectNode = form.elements.namedItem("webtoolsTimestampUnit");
  if (unitSelectNode instanceof HTMLSelectElement && unitSelectNode.value !== webtoolsTimestampUnit) {
    unitSelectNode.value = webtoolsTimestampUnit;
  }
}

function refreshWebtoolsPasswordResultInForm(form: HTMLFormElement): void {
  const host = form.querySelector(".webtools-password-result-host");
  if (!(host instanceof HTMLDivElement)) {
    return;
  }
  host.replaceChildren(createWebtoolsPasswordResultTable(webtoolsPasswordRows));
  form.dispatchEvent(new CustomEvent("webtools-password-sync"));
}

async function generateFromWebtoolsPasswordPanel(
  form: HTMLFormElement,
  options: { render?: boolean } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法生成密码。");
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
  setStatus("密码已生成。");
  if (shouldRender) {
    renderList();
    return;
  }

  refreshWebtoolsPasswordResultInForm(form);
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

function normalizeWebtoolsTimestampUnit(value: unknown): "s" | "ms" {
  return value === "ms" ? "ms" : "s";
}

function formatWebtoolsTimestampDate(value: Date, withMs = false): string {
  const yyyy = String(value.getFullYear());
  const mm = String(value.getMonth() + 1).padStart(2, "0");
  const dd = String(value.getDate()).padStart(2, "0");
  const hh = String(value.getHours()).padStart(2, "0");
  const mi = String(value.getMinutes()).padStart(2, "0");
  const ss = String(value.getSeconds()).padStart(2, "0");
  const base = `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  if (!withMs) {
    return base;
  }
  return `${base}.${String(value.getMilliseconds()).padStart(3, "0")}`;
}

function convertWebtoolsTimestampUnixValue(
  value: string,
  from: "s" | "ms",
  to: "s" | "ms"
): string | null {
  const trimmed = value.trim();
  if (!trimmed || from === to) {
    return null;
  }
  if (!/^[+-]?\d+$/.test(trimmed)) {
    return null;
  }
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  if (from === "s" && to === "ms") {
    return String(Math.round(numeric * 1000));
  }
  if (from === "ms" && to === "s") {
    return String(Math.floor(numeric / 1000));
  }
  return null;
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
    webtoolsTimestampDateInput = formatWebtoolsTimestampDate(
      new Date(),
      webtoolsTimestampUnit === "ms"
    );
  }
  if (!webtoolsTimestampUnixInput.trim()) {
    webtoolsTimestampUnixInput = getWebtoolsTimestampNowUnix(webtoolsTimestampUnit);
  }
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

// --- API/HttpMock state ---
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

// --- API/HttpMock helpers ---
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

// --- QRCode/FileHash/PortHelper state ---
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
let webtoolsFileHashFilePath = "";
let webtoolsFileHashAlgorithm: WebtoolsFileHashAlgorithm = "sha256";
let webtoolsFileHashExpectedHash = "";
let webtoolsFileHashOutput = "";
let webtoolsFileHashInfo = "";
let webtoolsFileHashError = "";
let webtoolsFileHashSize = "";
let webtoolsFileHashMatched: boolean | null = null;
let webtoolsFileHashRequestToken = 0;
let webtoolsPortHelperPort = "";
let webtoolsPortHelperProtocol: WebtoolsPortHelperProtocol = "all";
let webtoolsPortHelperPid = "";
let webtoolsPortHelperRecords: WebtoolsPortHelperRecord[] = [];
let webtoolsPortHelperInfo = "";
let webtoolsPortHelperError = "";
let webtoolsPortHelperBusy = false;
let webtoolsPortHelperRequestToken = 0;

// --- QRCode/FileHash/PortHelper helpers ---
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
    logoTextNode instanceof HTMLInputElement ? logoTextNode.value.trim().slice(0, 40) : "";

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



function normalizeWebtoolsFileHashAlgorithm(value: string): WebtoolsFileHashAlgorithm {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "md5" ||
    normalized === "sha1" ||
    normalized === "sha256" ||
    normalized === "sha512"
  ) {
    return normalized;
  }
  return "sha256";
}

function buildWebtoolsFileHashTarget(action: "hash"): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("filePath", webtoolsFileHashFilePath);
  params.set("algorithm", webtoolsFileHashAlgorithm);
  params.set("expectedHash", webtoolsFileHashExpectedHash);
  return `command:plugin:${WEBTOOLS_FILE_HASH_PLUGIN_ID}?${params.toString()}`;
}

function refreshWebtoolsFileHashPanelInForm(form: HTMLFormElement): void {
  const pathNode = form.elements.namedItem("webtoolsFileHashPath");
  if (pathNode instanceof HTMLInputElement) {
    pathNode.value = webtoolsFileHashFilePath;
  }

  const algorithmNode = form.elements.namedItem("webtoolsFileHashAlgorithm");
  if (algorithmNode instanceof HTMLSelectElement) {
    algorithmNode.value = webtoolsFileHashAlgorithm;
  }

  const expectedNode = form.elements.namedItem("webtoolsFileHashExpected");
  if (expectedNode instanceof HTMLInputElement) {
    expectedNode.value = webtoolsFileHashExpectedHash;
  }

  const outputNode = form.elements.namedItem("webtoolsFileHashOutput");
  if (outputNode instanceof HTMLTextAreaElement) {
    outputNode.value = webtoolsFileHashOutput;
  }

  const verifyNode = form.querySelector<HTMLElement>(".webtools-file-hash-verify");
  if (verifyNode) {
    if (!webtoolsFileHashExpectedHash.trim()) {
      verifyNode.textContent = "未设置期望哈希（仅展示计算结果）";
      verifyNode.dataset.state = "idle";
    } else if (webtoolsFileHashMatched === true) {
      verifyNode.textContent = "校验结果：匹配";
      verifyNode.dataset.state = "ok";
    } else if (webtoolsFileHashMatched === false) {
      verifyNode.textContent = "校验结果：不匹配";
      verifyNode.dataset.state = "error";
    } else {
      verifyNode.textContent = "请输入文件并执行计算";
      verifyNode.dataset.state = "idle";
    }
  }

  const fileInfoNode = form.querySelector<HTMLElement>(".webtools-file-hash-size");
  if (fileInfoNode) {
    const filePath = webtoolsFileHashFilePath.trim();
    if (filePath && webtoolsFileHashSize) {
      fileInfoNode.textContent = `${filePath} · ${webtoolsFileHashSize}`;
    } else {
      fileInfoNode.textContent = filePath || "未选择文件";
    }
  }

  const infoNode = form.querySelector<HTMLElement>(".webtools-file-hash-info");
  if (infoNode) {
    const text = webtoolsFileHashError || webtoolsFileHashInfo || "输入文件路径后点击计算";
    infoNode.textContent = text;
    infoNode.dataset.state = webtoolsFileHashError
      ? "error"
      : webtoolsFileHashOutput
        ? "ok"
        : "idle";
  }
}

async function executeWebtoolsFileHashCalculate(form: HTMLFormElement): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行文件哈希");
    return;
  }

  const pathNode = form.elements.namedItem("webtoolsFileHashPath");
  const algorithmNode = form.elements.namedItem("webtoolsFileHashAlgorithm");
  const expectedNode = form.elements.namedItem("webtoolsFileHashExpected");

  webtoolsFileHashFilePath = pathNode instanceof HTMLInputElement ? pathNode.value.trim() : "";
  webtoolsFileHashAlgorithm =
    algorithmNode instanceof HTMLSelectElement
      ? normalizeWebtoolsFileHashAlgorithm(algorithmNode.value)
      : "sha256";
  webtoolsFileHashExpectedHash =
    expectedNode instanceof HTMLInputElement ? expectedNode.value.trim() : "";
  webtoolsFileHashError = "";
  webtoolsFileHashInfo = "计算中...";
  refreshWebtoolsFileHashPanelInForm(form);

  const requestToken = ++webtoolsFileHashRequestToken;
  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_FILE_HASH_PLUGIN_ID}:hash`,
    type: "command",
    title: "文件哈希",
    subtitle: "面板执行",
    target: buildWebtoolsFileHashTarget("hash"),
    keywords: ["plugin", "hash", "checksum", "file", "文件哈希"]
  };

  const result = await launcher.execute(item);
  if (requestToken !== webtoolsFileHashRequestToken) {
    return;
  }

  const data = toRecord(result.data);
  if (typeof data?.filePath === "string") {
    webtoolsFileHashFilePath = data.filePath;
  }
  if (typeof data?.algorithm === "string") {
    webtoolsFileHashAlgorithm = normalizeWebtoolsFileHashAlgorithm(data.algorithm);
  }
  if (typeof data?.expectedHash === "string") {
    webtoolsFileHashExpectedHash = data.expectedHash;
  }
  if (typeof data?.hash === "string") {
    webtoolsFileHashOutput = data.hash;
  } else if (!result.ok) {
    webtoolsFileHashOutput = "";
  }
  if (typeof data?.matched === "boolean") {
    webtoolsFileHashMatched = data.matched;
  } else {
    webtoolsFileHashMatched = null;
  }
  if (typeof data?.size === "number" && Number.isFinite(data.size) && data.size >= 0) {
    webtoolsFileHashSize = formatHardwareInspectorBytes(data.size);
  } else {
    webtoolsFileHashSize = "";
  }
  if (typeof data?.info === "string") {
    webtoolsFileHashInfo = data.info;
  }

  const matchedError = typeof data?.matched === "boolean" ? data.matched === false : false;
  webtoolsFileHashError = !result.ok && !matchedError ? result.message || "哈希计算失败" : "";
  if (!webtoolsFileHashError && result.message) {
    webtoolsFileHashInfo = result.message;
  }
  setStatus(result.message ?? (result.ok ? "哈希计算完成" : "哈希计算失败"));
  refreshWebtoolsFileHashPanelInForm(form);
}

function normalizeWebtoolsPortHelperProtocol(value: string): WebtoolsPortHelperProtocol {
  const normalized = value.trim().toLowerCase();
  if (normalized === "all" || normalized === "tcp" || normalized === "udp") {
    return normalized;
  }
  return "all";
}

function parseWebtoolsPortHelperRecords(value: unknown): WebtoolsPortHelperRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: WebtoolsPortHelperRecord[] = [];
  value.forEach((item) => {
    const record = toRecord(item);
    if (!record) {
      return;
    }
    const localPort = Number(record.localPort);
    const pid = Number(record.pid);
    if (!Number.isInteger(localPort) || !Number.isInteger(pid)) {
      return;
    }
    result.push({
      protocol: typeof record.protocol === "string" ? record.protocol : "-",
      localAddress: typeof record.localAddress === "string" ? record.localAddress : "-",
      localPort,
      remoteAddress: typeof record.remoteAddress === "string" ? record.remoteAddress : "-",
      state: typeof record.state === "string" ? record.state : "-",
      pid,
      processName: typeof record.processName === "string" ? record.processName : ""
    });
  });

  return result;
}

function buildWebtoolsPortHelperTarget(
  action: "query" | "kill",
  pidOverride?: string | null
): string {
  const params = new URLSearchParams();
  params.set("action", action);
  const portValue = webtoolsPortHelperPort.trim();
  if (portValue) {
    params.set("port", portValue);
  }
  params.set("protocol", webtoolsPortHelperProtocol);
  const pidValue = (pidOverride ?? webtoolsPortHelperPid).trim();
  if (pidValue) {
    params.set("pid", pidValue);
  }
  return `command:plugin:${WEBTOOLS_PORT_HELPER_PLUGIN_ID}?${params.toString()}`;
}

function refreshWebtoolsPortHelperPanelInForm(form: HTMLFormElement): void {
  const portNode = form.elements.namedItem("webtoolsPortHelperPort");
  if (portNode instanceof HTMLInputElement) {
    portNode.value = webtoolsPortHelperPort;
  }

  const protocolNode = form.elements.namedItem("webtoolsPortHelperProtocol");
  if (protocolNode instanceof HTMLSelectElement) {
    protocolNode.value = webtoolsPortHelperProtocol;
  }

  const pidNode = form.elements.namedItem("webtoolsPortHelperPid");
  if (pidNode instanceof HTMLInputElement) {
    pidNode.value = webtoolsPortHelperPid;
  }

  const queryButton = form.querySelector<HTMLButtonElement>("[data-webtools-port-query]");
  if (queryButton) {
    queryButton.disabled = webtoolsPortHelperBusy;
    queryButton.textContent = webtoolsPortHelperBusy ? "查询中..." : "查询占用";
  }

  const killButton = form.querySelector<HTMLButtonElement>("[data-webtools-port-kill]");
  if (killButton) {
    killButton.disabled = webtoolsPortHelperBusy;
  }

  const infoNode = form.querySelector<HTMLElement>(".webtools-port-helper-info");
  if (infoNode) {
    const text =
      webtoolsPortHelperError ||
      webtoolsPortHelperInfo ||
      "端口/PID 二选一，可组合筛选；都留空则查询全部占用";
    infoNode.textContent = text;
    infoNode.dataset.state = webtoolsPortHelperError
      ? "error"
      : webtoolsPortHelperRecords.length > 0
        ? "ok"
        : "idle";
  }

  const recordsNode = form.querySelector<HTMLElement>(".webtools-port-helper-results");
  if (!recordsNode) {
    return;
  }
  recordsNode.textContent = "";

  if (webtoolsPortHelperRecords.length === 0) {
    const empty = document.createElement("div");
    empty.className = "webtools-port-helper-empty";
    empty.textContent = webtoolsPortHelperBusy ? "正在查询..." : "暂无端口占用记录";
    recordsNode.appendChild(empty);
    return;
  }

  webtoolsPortHelperRecords.forEach((record) => {
    const row = document.createElement("div");
    row.className = "webtools-port-helper-row";

    const left = document.createElement("div");
    left.className = "webtools-port-helper-row-main";
    const address = document.createElement("div");
    address.className = "webtools-port-helper-row-address webtools-tool-code";
    address.textContent = `${record.protocol} ${record.localAddress} -> ${record.remoteAddress}`;
    const meta = document.createElement("div");
    meta.className = "webtools-port-helper-row-meta";
    const processText = record.processName || "未知进程";
    meta.textContent = `PID ${record.pid} · ${processText} · ${record.state || "-"}`;
    left.append(address, meta);

    const actionGroup = document.createElement("div");
    actionGroup.className = "webtools-port-helper-row-actions";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "settings-btn settings-btn-secondary";
    copyButton.textContent = "复制";
    copyButton.addEventListener("click", () => {
      const line = `${record.protocol} ${record.localAddress} -> ${record.remoteAddress} | PID ${record.pid} | ${record.processName || "未知进程"} | ${record.state}`;
      void (async () => {
        const copied = await copyTextToClipboard(line);
        setStatus(copied ? "已复制端口记录" : "复制失败");
      })();
    });

    const rowKillButton = document.createElement("button");
    rowKillButton.type = "button";
    rowKillButton.className = "settings-btn settings-btn-secondary";
    rowKillButton.textContent = "结束进程";
    rowKillButton.disabled = webtoolsPortHelperBusy;
    rowKillButton.addEventListener("click", () => {
      void executeWebtoolsPortHelperAction("kill", form, String(record.pid));
    });

    actionGroup.append(copyButton, rowKillButton);
    row.append(left, actionGroup);
    recordsNode.appendChild(row);
  });
}

async function executeWebtoolsPortHelperAction(
  action: "query" | "kill",
  form?: HTMLFormElement,
  pidOverride?: string | null
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行端口助手");
    return;
  }

  if (form) {
    const portNode = form.elements.namedItem("webtoolsPortHelperPort");
    const protocolNode = form.elements.namedItem("webtoolsPortHelperProtocol");
    const pidNode = form.elements.namedItem("webtoolsPortHelperPid");
    webtoolsPortHelperPort = portNode instanceof HTMLInputElement ? portNode.value.trim() : "";
    webtoolsPortHelperProtocol =
      protocolNode instanceof HTMLSelectElement
        ? normalizeWebtoolsPortHelperProtocol(protocolNode.value)
        : "all";
    webtoolsPortHelperPid = pidNode instanceof HTMLInputElement ? pidNode.value.trim() : "";
  }

  const portRaw = webtoolsPortHelperPort.trim();
  const hasPort = portRaw.length > 0;
  if (hasPort) {
    const portNumber = Number(portRaw);
    if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
      webtoolsPortHelperError = "端口需为 1-65535，留空可查询全部";
      webtoolsPortHelperInfo = "";
      setStatus(webtoolsPortHelperError);
      if (form) {
        refreshWebtoolsPortHelperPanelInForm(form);
      }
      return;
    }
    webtoolsPortHelperPort = String(Math.floor(portNumber));
  } else {
    webtoolsPortHelperPort = "";
  }

  const pidRaw =
    typeof pidOverride === "string" && pidOverride.trim()
      ? pidOverride.trim()
      : webtoolsPortHelperPid.trim();
  const hasPid = pidRaw.length > 0;
  let normalizedPid = "";
  if (hasPid) {
    const pidNumber = Number(pidRaw);
    if (!Number.isInteger(pidNumber) || pidNumber <= 0) {
      webtoolsPortHelperError = "PID 必须为正整数";
      webtoolsPortHelperInfo = "";
      setStatus(webtoolsPortHelperError);
      if (form) {
        refreshWebtoolsPortHelperPanelInForm(form);
      }
      return;
    }
    normalizedPid = String(Math.floor(pidNumber));
    if (!(action === "kill" && typeof pidOverride === "string" && pidOverride.trim())) {
      webtoolsPortHelperPid = normalizedPid;
    }
  } else {
    webtoolsPortHelperPid = "";
  }
  if (action === "kill" && !hasPort && !hasPid) {
    webtoolsPortHelperError = "结束进程时请填写端口或 PID";
    webtoolsPortHelperInfo = "";
    setStatus(webtoolsPortHelperError);
    if (form) {
      refreshWebtoolsPortHelperPanelInForm(form);
    }
    return;
  }

  webtoolsPortHelperBusy = true;
  webtoolsPortHelperError = "";
  webtoolsPortHelperInfo = action === "kill" ? "正在结束进程..." : "正在查询端口占用...";
  if (form) {
    refreshWebtoolsPortHelperPanelInForm(form);
  }

  const requestToken = ++webtoolsPortHelperRequestToken;
  const item: LaunchItem = {
    id: `plugin:${WEBTOOLS_PORT_HELPER_PLUGIN_ID}:${action}`,
    type: "command",
    title: "端口助手",
    subtitle: "面板执行",
    target: buildWebtoolsPortHelperTarget(action, normalizedPid || null),
    keywords: ["plugin", "port", "pid", "netstat", "端口", "占用"]
  };

  const result = await launcher.execute(item);
  if (requestToken !== webtoolsPortHelperRequestToken) {
    return;
  }

  webtoolsPortHelperBusy = false;
  const data = toRecord(result.data);

  if (typeof data?.port === "number" && Number.isFinite(data.port)) {
    webtoolsPortHelperPort = String(Math.floor(data.port));
  } else if (typeof data?.port === "string" && data.port.trim()) {
    webtoolsPortHelperPort = data.port.trim();
  }
  if (typeof data?.protocol === "string") {
    webtoolsPortHelperProtocol = normalizeWebtoolsPortHelperProtocol(data.protocol);
  }
  webtoolsPortHelperRecords = parseWebtoolsPortHelperRecords(data?.records);

  webtoolsPortHelperError = result.ok ? "" : result.message || "端口操作失败";
  if (typeof data?.info === "string" && data.info.trim()) {
    webtoolsPortHelperInfo = data.info;
  } else if (result.message) {
    webtoolsPortHelperInfo = result.message;
  }
  setStatus(result.message ?? (result.ok ? "端口助手执行完成" : "端口助手执行失败"));

  if (form) {
    refreshWebtoolsPortHelperPanelInForm(form);
  }
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

function parseWebtoolsJsonPreviewSummary(value: unknown): WebtoolsJsonPreviewSummary | null {
  const record = toRecord(value);
  if (!record || typeof record.summary !== "string" || typeof record.kind !== "string") {
    return null;
  }

  const fields = Array.isArray(record.fields)
    ? record.fields
        .map((item) => {
          const field = toRecord(item);
          if (!field || typeof field.key !== "string") {
            return null;
          }
          const nextField: WebtoolsJsonPreviewField = {
            key: field.key,
          };
          if (typeof field.count === "number") {
            nextField.count = field.count;
          }
          return nextField;
        })
        .filter((item): item is WebtoolsJsonPreviewField => item !== null)
    : [];

  const sampleRows = Array.isArray(record.sampleRows)
    ? record.sampleRows
        .map((item) => toRecord(item))
        .filter((item): item is Record<string, unknown> => item !== null)
    : [];

  if (
    record.kind !== "json-object" &&
    record.kind !== "json-array" &&
    record.kind !== "csv" &&
    record.kind !== "text" &&
    record.kind !== "escaped" &&
    record.kind !== "unknown"
  ) {
    return null;
  }

  return {
    kind: record.kind,
    summary: record.summary,
    fields,
    sampleRows
  };
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
  ["#", "密码", "强度", ""].forEach((title) => {
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

function buildWebtoolsJsonTarget(action: "convert" | "validate" = "convert"): string {
  const params = new URLSearchParams();
  params.set("action", action);
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
    const positionText =
      hasError && typeof webtoolsJsonState.errorPosition === "number"
        ? `（位置 ${webtoolsJsonState.errorPosition}）`
        : "";
    errorNode.textContent = hasError ? `${webtoolsJsonState.info}${positionText}` : "";
    errorNode.hidden = !hasError;
  }

  const infoNode = form.querySelector(".webtools-json-info");
  if (infoNode instanceof HTMLDivElement) {
    const infoState = buildWebtoolsJsonInfoState();
    infoNode.textContent = infoState.text;
    infoNode.dataset.state = infoState.state;
  }

  form.dispatchEvent(new CustomEvent("webtools-json-sync"));
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

function buildWebtoolsJsonSchemaTarget(action: "validate" = "validate"): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("schema", webtoolsJsonSchemaText);
  params.set("payload", webtoolsJsonSchemaPayload);
  return `command:plugin:${WEBTOOLS_JSON_SCHEMA_PLUGIN_ID}?${params.toString()}`;
}

function refreshWebtoolsJsonSchemaResultInForm(form: HTMLFormElement): void {
  const infoNode = form.querySelector<HTMLDivElement>(".webtools-json-schema-info");
  if (infoNode) {
    infoNode.dataset.state =
      webtoolsJsonSchemaValid === true
        ? "ok"
        : webtoolsJsonSchemaValid === false
          ? "error"
          : "idle";
    infoNode.textContent =
      webtoolsJsonSchemaInfo ||
      (webtoolsJsonSchemaValid === true
        ? "校验通过"
        : "输入 Schema 与 Payload，结果会自动校验");
  }

  const errorsNode = form.querySelector<HTMLUListElement>(".webtools-json-schema-errors");
  if (errorsNode) {
    errorsNode.replaceChildren();
    for (const error of webtoolsJsonSchemaErrors) {
      const item = document.createElement("li");
      item.className = "webtools-json-schema-error-item";
      const pathNode = document.createElement("code");
      pathNode.className = "webtools-json-schema-error-path";
      pathNode.textContent = error.path || "/";
      const messageNode = document.createElement("span");
      messageNode.className = "webtools-json-schema-error-message";
      messageNode.textContent = error.message;
      item.append(pathNode, messageNode);
      errorsNode.appendChild(item);
    }
    errorsNode.hidden = webtoolsJsonSchemaErrors.length === 0;
  }
}

function scheduleWebtoolsJsonSchemaAutoValidate(
  form: HTMLFormElement,
  immediate = false
): void {
  if (webtoolsJsonSchemaAutoTimer !== null) {
    window.clearTimeout(webtoolsJsonSchemaAutoTimer);
  }

  webtoolsJsonSchemaAutoTimer = window.setTimeout(() => {
    webtoolsJsonSchemaAutoTimer = null;
    if (!form.isConnected) {
      return;
    }
    void executeWebtoolsJsonSchemaValidate(form, { render: false });
  }, immediate ? 0 : 220);
}

async function executeWebtoolsJsonSchemaValidate(
  form: HTMLFormElement,
  options: { render?: boolean } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行 JSON Schema 校验");
    return;
  }

  const shouldRender = options.render ?? true;
  const schemaNode = form.elements.namedItem("webtoolsJsonSchemaText");
  const payloadNode = form.elements.namedItem("webtoolsJsonSchemaPayload");
  webtoolsJsonSchemaText =
    schemaNode instanceof HTMLTextAreaElement ? schemaNode.value : webtoolsJsonSchemaText;
  webtoolsJsonSchemaPayload =
    payloadNode instanceof HTMLTextAreaElement ? payloadNode.value : webtoolsJsonSchemaPayload;

  const requestToken = ++webtoolsJsonSchemaRequestToken;
  const result = await launcher.execute({
    id: `plugin:${WEBTOOLS_JSON_SCHEMA_PLUGIN_ID}:validate`,
    type: "command",
    title: "JSON Schema 校验",
    subtitle: "",
    target: buildWebtoolsJsonSchemaTarget(),
    keywords: ["plugin", "json-schema"]
  });

  if (requestToken !== webtoolsJsonSchemaRequestToken) {
    return;
  }

  const data = toRecord(result.data);
  webtoolsJsonSchemaValid =
    typeof data?.valid === "boolean" ? data.valid : result.ok ? true : false;
  webtoolsJsonSchemaInfo =
    typeof result.message === "string"
      ? result.message
      : typeof data?.schemaError === "string"
        ? data.schemaError
        : typeof data?.payloadError === "string"
          ? data.payloadError
          : "";
  webtoolsJsonSchemaErrors = Array.isArray(data?.errors)
    ? data.errors
        .map((entry) => toRecord(entry))
        .filter((entry): entry is Record<string, unknown> => Boolean(entry))
        .map((entry) => ({
          path: typeof entry.path === "string" ? entry.path : "/",
          message: typeof entry.message === "string" ? entry.message : "校验失败"
        }))
    : [];

  refreshWebtoolsJsonSchemaResultInForm(form);
  setStatus(webtoolsJsonSchemaInfo || (webtoolsJsonSchemaValid ? "校验通过" : "校验失败"));
  if (shouldRender) {
    renderList();
  }
}

function buildWebtoolsDataMaskTarget(
  action: "mask" | "generate" = webtoolsDataMaskMode
): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("input", webtoolsDataMaskInput);
  params.set("maskPhone", webtoolsDataMaskPhone ? "1" : "0");
  params.set("maskEmail", webtoolsDataMaskEmail ? "1" : "0");
  params.set("maskIdCard", webtoolsDataMaskIdCard ? "1" : "0");
  params.set("fakeKind", webtoolsDataMaskFakeKind);
  params.set("fakeCount", String(webtoolsDataMaskFakeCount));
  return `command:plugin:${WEBTOOLS_DATA_MASK_PLUGIN_ID}?${params.toString()}`;
}

function refreshWebtoolsDataMaskResultInForm(form: HTMLFormElement): void {
  const outputNode = form.elements.namedItem("webtoolsDataMaskOutput");
  if (outputNode instanceof HTMLTextAreaElement) {
    outputNode.value = webtoolsDataMaskOutput;
  }

  const infoNode = form.querySelector<HTMLDivElement>(".webtools-data-mask-info");
  if (infoNode) {
    infoNode.textContent = webtoolsDataMaskInfo || "选择脱敏规则或假数据类型后执行";
    infoNode.dataset.state = webtoolsDataMaskOutput.trim() ? "ok" : "idle";
  }
}

async function executeWebtoolsDataMaskAction(
  form: HTMLFormElement,
  action: "mask" | "generate",
  options: { render?: boolean } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行文本脱敏");
    return;
  }

  const shouldRender = options.render ?? true;
  const inputNode = form.elements.namedItem("webtoolsDataMaskInput");
  webtoolsDataMaskInput =
    inputNode instanceof HTMLTextAreaElement ? inputNode.value : webtoolsDataMaskInput;
  webtoolsDataMaskMode = action;

  const phoneNode = form.elements.namedItem("webtoolsDataMaskPhone");
  const emailNode = form.elements.namedItem("webtoolsDataMaskEmail");
  const idNode = form.elements.namedItem("webtoolsDataMaskIdCard");
  if (phoneNode instanceof HTMLInputElement) {
    webtoolsDataMaskPhone = phoneNode.checked;
  }
  if (emailNode instanceof HTMLInputElement) {
    webtoolsDataMaskEmail = emailNode.checked;
  }
  if (idNode instanceof HTMLInputElement) {
    webtoolsDataMaskIdCard = idNode.checked;
  }

  const kindNode = form.elements.namedItem("webtoolsDataMaskFakeKind");
  if (kindNode instanceof HTMLSelectElement) {
    webtoolsDataMaskFakeKind = kindNode.value as WebtoolsDataMaskFakeKind;
  }
  const countNode = form.elements.namedItem("webtoolsDataMaskFakeCount");
  if (countNode instanceof HTMLInputElement) {
    webtoolsDataMaskFakeCount = Math.max(1, Math.min(50, Number(countNode.value) || 5));
  }

  const result = await launcher.execute({
    id: `plugin:${WEBTOOLS_DATA_MASK_PLUGIN_ID}:${action}`,
    type: "command",
    title: "文本脱敏 / 假数据",
    subtitle: "",
    target: buildWebtoolsDataMaskTarget(action),
    keywords: ["plugin", "data-mask"]
  });

  const data = toRecord(result.data);
  webtoolsDataMaskOutput = typeof data?.output === "string" ? data.output : "";
  webtoolsDataMaskInfo = typeof result.message === "string" ? result.message : "";
  refreshWebtoolsDataMaskResultInForm(form);
  setStatus(webtoolsDataMaskInfo || (result.ok ? "处理完成" : "处理失败"));
  if (shouldRender) {
    renderList();
  }
}

async function executeWebtoolsJsonConvert(
  form: HTMLFormElement,
  options: { render?: boolean; action?: "convert" | "validate" } = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行 JSON 工具");
    return;
  }
  const shouldRender = options.render ?? true;
  const action = options.action ?? "convert";

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
    target: buildWebtoolsJsonTarget(action),
    keywords: ["plugin", "json", "csv", "format", "convert", "实验室"]
  };

  const result = await launcher.execute(item);
  if (requestToken !== webtoolsJsonRequestToken) {
    return;
  }
  const data = toRecord(result.data);

  if (action !== "validate") {
    webtoolsJsonState.output =
      data && typeof data.output === "string" ? data.output : "";
  }
  webtoolsJsonState.info =
    data && typeof data.info === "string" ? data.info : "";
  webtoolsJsonState.valid =
    data && typeof data.valid === "boolean" ? data.valid : null;
  webtoolsJsonState.preview = parseWebtoolsJsonPreviewSummary(data?.preview);
  webtoolsJsonState.errorPosition =
    data && typeof data.errorPosition === "number" ? data.errorPosition : null;
  const availableFields = new Set(
    (webtoolsJsonState.preview?.fields ?? []).map((field) => field.key)
  );
  webtoolsJsonState.selectedFields = webtoolsJsonState.selectedFields.filter((field) =>
    availableFields.has(field)
  );

  setStatus(result.message ?? (result.ok ? "转换完成" : "转换失败"));
  if (shouldRender) {
    renderList();
    return;
  }
  refreshWebtoolsJsonResultInForm(form);
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

function getRegisteredPanelImpls(): NonNullable<Window["__LL_PANEL_IMPLS__"]> {
  const impls = window.__LL_PANEL_IMPLS__;
  if (!impls) {
    throw new Error("renderer plugin panel impls not initialized");
  }
  return impls;
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

function renderPluginPanelFallback(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const plugin = activePluginPanel;
  const titleText = plugin?.title || "\u63d2\u4ef6\u9762\u677f";
  const subtitleText =
    plugin?.subtitle ||
    "\u8be5\u63d2\u4ef6\u5df2\u63a5\u5165\uff0c\u53ef\u89c6\u5316\u9875\u9762\u6b63\u5728\u5b9e\u88c5";

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

function createSubmitPluginPanelHandler(
  render: () => void,
  onOpen: (panel: ActivePluginPanelState) => void,
  formSelector: string
): PluginPanelHandler {
  return {
    render,
    onOpen,
    onEnter: runWithPluginForm(formSelector, (form) => {
      form.requestSubmit();
    })
  };
}

interface LiteSnapPanelData {
  settings: {
    screenshotShortcut: string;
    pinShortcut: string;
    colorShortcut: string;
    togglePinClickThroughShortcut: string;
    saveDirectory: string;
    saveFormat: "png" | "jpg";
    postCaptureBehavior: "toolbar" | "copy" | "save" | "pin";
    annotationColor: string;
    annotationLineWidth: number;
    annotationTextSize: number;
    annotationTool: string;
    annotationFillShapes: boolean;
    recentColors: string[];
    historyEnabled: boolean;
    historyMaxItems: number;
  };
  statusMessage: string;
  ocrIssue?: "module_missing" | "language_pack";
}

const DEFAULT_LITESNAP_PANEL_DATA: LiteSnapPanelData = {
  settings: {
    screenshotShortcut: "F1",
    pinShortcut: "F3",
    colorShortcut: "",
    togglePinClickThroughShortcut: "Ctrl+Shift+T",
    saveDirectory: "",
    saveFormat: "png",
    postCaptureBehavior: "toolbar",
    annotationColor: "#ff3b30",
    annotationLineWidth: 3,
    annotationTextSize: 16,
    annotationTool: "select",
    annotationFillShapes: false,
    recentColors: [],
    historyEnabled: true,
    historyMaxItems: 20
  },
  statusMessage: "按 F1 进入截图，主窗口会保持可见，便于截取启动器界面。"
};

let liteSnapPanelData: LiteSnapPanelData = {
  settings: { ...DEFAULT_LITESNAP_PANEL_DATA.settings },
  statusMessage: DEFAULT_LITESNAP_PANEL_DATA.statusMessage
};
let liteSnapOcrIssue: "module_missing" | "language_pack" | null = null;
let liteSnapPanelView: "main" | "settings" | "ocr" | "translate" | "history" | "diagnostics" =
  "main";
let liteSnapHistoryItems: Array<{
  id: string;
  filePath: string;
  thumbPath: string | null;
  width: number;
  height: number;
  source: string;
  createdAt: number;
}> = [];
let liteSnapDiagnostics: Array<{
  id: string;
  operation: string;
  status: string;
  createdAt: number;
  durationMs: number;
  metrics: Record<string, number | string | boolean>;
  message: string;
}> = [];
let liteSnapOcrText = "";
let liteSnapTranslateSourceText = "";
let liteSnapTranslateText = "";
let liteSnapOcrProbeSummary = "";
let liteSnapOcrProbeIssue: "module_missing" | "language_pack" | null = null;
let liteSnapOcrProbeState: {
  ok: boolean;
  moduleLoaded: boolean;
  chineseReady: boolean;
  englishReady: boolean;
} | null = null;
let liteSnapOcrCapabilities: Array<{
  languageTag: "zh-CN" | "en-US";
  capabilityName: string;
  state: string;
  installed: boolean;
}> | null = null;
let liteSnapOcrCacheLoadPromise: Promise<void> | null = null;
let liteSnapOcrCacheHydrated = false;

function applyLiteSnapOcrProbeResult(
  result: {
    ok: boolean;
    message: string;
    ocrIssue?: "module_missing" | "language_pack";
    moduleLoaded: boolean;
    chineseReady: boolean;
    englishReady: boolean;
    capabilities?: Array<{
      languageTag: "zh-CN" | "en-US";
      capabilityName: string;
      state: string;
      installed: boolean;
    }>;
  },
  options: { persist?: boolean } = {}
): void {
  liteSnapOcrProbeState = {
    ok: result.ok,
    moduleLoaded: result.moduleLoaded,
    chineseReady: result.chineseReady,
    englishReady: result.englishReady
  };
  liteSnapOcrProbeSummary = result.message;
  liteSnapOcrProbeIssue = result.ok
    ? null
    : result.ocrIssue ?? inferLiteSnapOcrIssueFromMessage(result.message);
  if (result.capabilities && result.capabilities.length > 0) {
    liteSnapOcrCapabilities = result.capabilities;
  }

  if (options.persist !== false && isLiteSnapOcrRuntimeReady()) {
    void persistLiteSnapOcrProbeCacheIfReady();
  }
}

async function persistLiteSnapOcrProbeCacheIfReady(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.liteSnapSetOcrProbeCache || !liteSnapOcrProbeState) {
    return;
  }

  if (!isLiteSnapOcrRuntimeReady()) {
    return;
  }

  try {
    await launcher.liteSnapSetOcrProbeCache({
      ready: true,
      summary: liteSnapOcrProbeSummary,
      probeState: { ...liteSnapOcrProbeState },
      capabilities: liteSnapOcrCapabilities ?? undefined,
      checkedAt: Date.now()
    });
  } catch (error) {
    console.warn("[litesnap] OCR probe cache persist failed", error);
  }
}

async function loadLiteSnapOcrProbeCache(): Promise<void> {
  if (liteSnapOcrCacheHydrated) {
    return;
  }

  const launcher = getLauncherApi();
  if (!launcher?.liteSnapGetOcrProbeCache) {
    liteSnapOcrCacheHydrated = true;
    return;
  }

  const previousSummary = liteSnapOcrProbeSummary;
  const previousReady = isLiteSnapOcrRuntimeReady();

  try {
    const cache = await launcher.liteSnapGetOcrProbeCache();
    if (cache?.ready) {
      applyLiteSnapOcrProbeResult(
        {
          ok: cache.probeState.ok,
          message: cache.summary,
          moduleLoaded: cache.probeState.moduleLoaded,
          chineseReady: cache.probeState.chineseReady,
          englishReady: cache.probeState.englishReady,
          capabilities: cache.capabilities
        },
        { persist: false }
      );
    }
  } catch (error) {
    console.warn("[litesnap] OCR probe cache load failed", error);
  } finally {
    liteSnapOcrCacheHydrated = true;
    const stateChanged =
      liteSnapOcrProbeSummary !== previousSummary ||
      isLiteSnapOcrRuntimeReady() !== previousReady;
    if (stateChanged) {
      renderList();
    }
  }
}

function ensureLiteSnapOcrCacheLoaded(): void {
  if (liteSnapOcrCacheLoadPromise) {
    return;
  }

  liteSnapOcrCacheLoadPromise = loadLiteSnapOcrProbeCache();
}

function isLiteSnapOcrRuntimeReady(): boolean {
  if (
    liteSnapOcrProbeState?.moduleLoaded &&
    liteSnapOcrProbeState.chineseReady &&
    liteSnapOcrProbeState.englishReady
  ) {
    return true;
  }

  if (liteSnapOcrProbeState?.ok) {
    return true;
  }

  const summary = liteSnapOcrProbeSummary.trim();
  if (!summary) {
    return false;
  }

  return (
    summary.includes("OCR 检测通过") &&
    summary.includes("中文引擎：可用") &&
    summary.includes("英文引擎：可用")
  );
}

function formatLiteSnapOcrEngineStatus(): string {
  const format = (ready: boolean | undefined): string => {
    if (ready === true) {
      return "已就绪";
    }
    if (ready === false) {
      return "未就绪";
    }
    return "未检测";
  };

  return `中文：${format(liteSnapOcrProbeState?.chineseReady)}；英文：${format(
    liteSnapOcrProbeState?.englishReady
  )}`;
}

function resolveLiteSnapMissingOcrLanguages(): Array<"zh-CN" | "en-US"> {
  if (isLiteSnapOcrRuntimeReady()) {
    return [];
  }

  const utils = window.__LL_LITESNAP_TEXT_UTILS__;
  return (
    utils?.resolveMissingOcrCapabilityLanguages?.(
      liteSnapOcrCapabilities,
      liteSnapOcrProbeState
    ) ?? ["zh-CN", "en-US"]
  );
}

function shouldShowLiteSnapOcrInstallAction(): boolean {
  if (isLiteSnapOcrRuntimeReady()) {
    return false;
  }

  const utils = window.__LL_LITESNAP_TEXT_UTILS__;
  if (utils?.shouldShowLiteSnapOcrInstallButton) {
    return utils.shouldShowLiteSnapOcrInstallButton(
      liteSnapOcrCapabilities,
      liteSnapOcrProbeState
    );
  }

  return resolveLiteSnapMissingOcrLanguages().length > 0;
}

function formatLiteSnapOcrInstallActionLabel(
  languages: Array<"zh-CN" | "en-US">
): string {
  const utils = window.__LL_LITESNAP_TEXT_UTILS__;
  return (
    utils?.formatLiteSnapOcrInstallButtonLabel?.(languages) ??
    "一键安装 OCR（中+英）"
  );
}

function normalizeLiteSnapOcrPanelText(text: string): string {
  const utils = window.__LL_LITESNAP_TEXT_UTILS__;
  if (utils?.normalizeLiteSnapOcrText) {
    return utils.normalizeLiteSnapOcrText(text);
  }
  return text;
}

function resolveLiteSnapOcrIssue(
  dataRecord: Record<string, unknown> | null,
  statusMessage: string
): "module_missing" | "language_pack" | null {
  const utils = window.__LL_LITESNAP_TEXT_UTILS__;
  const rawIssue = dataRecord?.ocrIssue;
  if (utils?.isLiteSnapOcrIssue?.(rawIssue)) {
    return rawIssue;
  }
  return utils?.inferLiteSnapOcrIssue?.(statusMessage) ?? null;
}

function relaunchLiteLauncherApp(): void {
  const launcher = getLauncherApi();
  if (!launcher?.relaunchApp) {
    setStatus("请从托盘图标右键完全退出 LiteLauncher，再重新打开。");
    return;
  }
  void launcher.relaunchApp();
}

function createLiteSnapOcrSetupGuideSection(): HTMLDivElement {
  const section = document.createElement("div");
  section.className = "litesnap-ocr-help";

  const title = document.createElement("div");
  title.className = "litesnap-ocr-help-title";
  title.textContent = "Windows OCR 配置指引";
  section.appendChild(title);

  const list = document.createElement("ol");
  list.className = "litesnap-ocr-help-steps";
  const utils = window.__LL_LITESNAP_TEXT_UTILS__;
  const steps =
    utils?.WINDOWS_10_OCR_SETUP_STEPS ??
    ([
      "点「一键安装 OCR（中+英）」，在 UAC 提示里选「是」。",
      "等待安装完成，不要关闭弹出的 PowerShell 窗口。",
      "点「重启 LiteLauncher」，再点「检测 OCR」。"
    ] as const);
  for (const step of steps) {
    const item = document.createElement("li");
    item.textContent = step;
    list.appendChild(item);
  }
  section.appendChild(list);

  return section;
}

function buildLiteSnapOcrConfigurationSection(options: {
  resultTextareaId: string;
  includeFailureHelp?: boolean;
}): HTMLElement[] {
  const missingLanguages = resolveLiteSnapMissingOcrLanguages();
  const showInstallButton = shouldShowLiteSnapOcrInstallAction();
  const installButtonLabel = formatLiteSnapOcrInstallActionLabel(missingLanguages);
  const ocrReady = isLiteSnapOcrRuntimeReady();

  const ocrProbeInfo = createLiteSnapInfoRow(
    "文字识别 (OCR)",
    ocrReady
      ? "系统 OCR 组件已就绪"
      : "Win10/11 可用一键安装系统 OCR 组件（需管理员 UAC）",
    ocrReady
      ? "可直接使用截图文字识别；如有异常请点「检测 OCR」"
      : showInstallButton
        ? `推荐先点「${installButtonLabel}」，装完重启再检测`
        : "点「检测 OCR」查看模块与语言包状态"
  );

  const ocrEngineInfo = createLiteSnapInfoRow(
    "OCR 语言引擎",
    formatLiteSnapOcrEngineStatus(),
    "Windows 本地 OCR 会在已就绪的中文/英文引擎间自动选择"
  );

  const ocrSetupGuide = createLiteSnapOcrSetupGuideSection();

  const ocrProbeResultField = document.createElement("div");
  ocrProbeResultField.className = "settings-field litesnap-ocr-field";

  const ocrProbeResultLabel = document.createElement("label");
  ocrProbeResultLabel.className = "settings-field-label";
  ocrProbeResultLabel.textContent = "检测结果";
  ocrProbeResultLabel.htmlFor = options.resultTextareaId;

  const ocrProbeResultTextarea = document.createElement("textarea");
  ocrProbeResultTextarea.id = options.resultTextareaId;
  ocrProbeResultTextarea.className = "litesnap-ocr-textarea";
  ocrProbeResultTextarea.rows = 5;
  ocrProbeResultTextarea.spellcheck = false;
  ocrProbeResultTextarea.readOnly = true;
  ocrProbeResultTextarea.value = liteSnapOcrProbeSummary;
  ocrProbeResultTextarea.placeholder =
    liteSnapOcrProbeSummary ||
    (isLiteSnapOcrRuntimeReady()
      ? "上次检测已通过，可直接使用 OCR；如需复查请点「检测 OCR」"
      : "点「检测 OCR」查看模块与语言包状态");
  ocrProbeResultField.append(ocrProbeResultLabel, ocrProbeResultTextarea);

  const ocrProbeActions = document.createElement("div");
  ocrProbeActions.className = "settings-actions litesnap-ocr-help-actions";

  if (showInstallButton) {
    const installOcrButton = document.createElement("button");
    installOcrButton.type = "button";
    installOcrButton.className = "settings-btn settings-btn-primary";
    installOcrButton.textContent = installButtonLabel;
    installOcrButton.addEventListener("click", () => {
      void runLiteSnapInstallOcrCapabilities(
        installOcrButton,
        ocrProbeResultTextarea,
        missingLanguages
      );
    });
    ocrProbeActions.appendChild(installOcrButton);
  }

  const ocrProbeButton = document.createElement("button");
  ocrProbeButton.type = "button";
  ocrProbeButton.className = "settings-btn settings-btn-secondary";
  ocrProbeButton.textContent = "检测 OCR";
  ocrProbeButton.addEventListener("click", () => {
    void runLiteSnapSettingsOcrProbe(ocrProbeButton, ocrProbeResultTextarea);
  });

  const relaunchButton = document.createElement("button");
  relaunchButton.type = "button";
  relaunchButton.className = "settings-btn settings-btn-secondary";
  relaunchButton.textContent = "重启 LiteLauncher";
  relaunchButton.addEventListener("click", () => {
    relaunchLiteLauncherApp();
  });

  ocrProbeActions.append(ocrProbeButton, relaunchButton);

  const nodes: HTMLElement[] = [
    ocrProbeInfo,
    ocrEngineInfo,
    ...(ocrReady ? [] : [ocrSetupGuide]),
    ocrProbeResultField,
    ocrProbeActions
  ];

  if (options.includeFailureHelp && liteSnapOcrProbeIssue) {
    nodes.push(createLiteSnapOcrHelpSection(liteSnapOcrProbeIssue));
  }

  return nodes;
}

function createLiteSnapOcrHelpSection(
  issue: "module_missing" | "language_pack"
): HTMLDivElement {
  const utils = window.__LL_LITESNAP_TEXT_UTILS__;
  const help = utils?.getLiteSnapOcrHelp?.(issue) ?? {
    title: issue === "module_missing" ? "OCR 组件未加载" : "需要安装 Windows OCR 语言包",
    steps: [
      "点「一键安装 OCR（中+英）」，在 UAC 提示里选「是」。",
      "安装完成后点「重启 LiteLauncher」，再点「检测 OCR」。"
    ],
    showRelaunchButton: true
  };

  const section = document.createElement("div");
  section.className = "litesnap-ocr-help";

  const title = document.createElement("div");
  title.className = "litesnap-ocr-help-title";
  title.textContent = help.title;
  section.appendChild(title);

  const list = document.createElement("ol");
  list.className = "litesnap-ocr-help-steps";
  for (const step of help.steps) {
    const item = document.createElement("li");
    item.textContent = step;
    list.appendChild(item);
  }
  section.appendChild(list);

  if (help.showRelaunchButton) {
    const actions = document.createElement("div");
    actions.className = "settings-actions litesnap-ocr-help-actions";

    const relaunchButton = document.createElement("button");
    relaunchButton.type = "button";
    relaunchButton.className = "settings-btn settings-btn-primary";
    relaunchButton.textContent = "重启 LiteLauncher";
    relaunchButton.addEventListener("click", () => {
      relaunchLiteLauncherApp();
    });
    actions.appendChild(relaunchButton);
    section.appendChild(actions);
  }

  return section;
}

function normalizeLiteSnapPanelData(value: unknown): LiteSnapPanelData {
  const record = toRecord(value);
  const settingsRecord = toRecord(record?.settings);

  const recentColors = Array.isArray(settingsRecord?.recentColors)
    ? settingsRecord.recentColors.filter(
        (entry): entry is string => typeof entry === "string"
      )
    : DEFAULT_LITESNAP_PANEL_DATA.settings.recentColors;
  const historyMaxItemsRaw =
    typeof settingsRecord?.historyMaxItems === "number"
      ? settingsRecord.historyMaxItems
      : DEFAULT_LITESNAP_PANEL_DATA.settings.historyMaxItems;

  return {
    settings: {
      screenshotShortcut:
        typeof settingsRecord?.screenshotShortcut === "string"
          ? settingsRecord.screenshotShortcut
          : DEFAULT_LITESNAP_PANEL_DATA.settings.screenshotShortcut,
      pinShortcut:
        typeof settingsRecord?.pinShortcut === "string"
          ? settingsRecord.pinShortcut
          : DEFAULT_LITESNAP_PANEL_DATA.settings.pinShortcut,
      colorShortcut: "",
      togglePinClickThroughShortcut:
        typeof settingsRecord?.togglePinClickThroughShortcut === "string"
          ? settingsRecord.togglePinClickThroughShortcut
          : DEFAULT_LITESNAP_PANEL_DATA.settings.togglePinClickThroughShortcut,
      saveDirectory:
        typeof settingsRecord?.saveDirectory === "string"
          ? settingsRecord.saveDirectory
          : DEFAULT_LITESNAP_PANEL_DATA.settings.saveDirectory,
      saveFormat:
        settingsRecord?.saveFormat === "jpg" ? "jpg" : "png",
      postCaptureBehavior:
        settingsRecord?.postCaptureBehavior === "copy" ||
        settingsRecord?.postCaptureBehavior === "save" ||
        settingsRecord?.postCaptureBehavior === "pin"
          ? settingsRecord.postCaptureBehavior
          : "toolbar",
      annotationColor:
        typeof settingsRecord?.annotationColor === "string"
          ? settingsRecord.annotationColor
          : DEFAULT_LITESNAP_PANEL_DATA.settings.annotationColor,
      annotationLineWidth:
        typeof settingsRecord?.annotationLineWidth === "number"
          ? settingsRecord.annotationLineWidth
          : DEFAULT_LITESNAP_PANEL_DATA.settings.annotationLineWidth,
      annotationTextSize:
        typeof settingsRecord?.annotationTextSize === "number"
          ? settingsRecord.annotationTextSize
          : DEFAULT_LITESNAP_PANEL_DATA.settings.annotationTextSize,
      annotationTool:
        typeof settingsRecord?.annotationTool === "string"
          ? settingsRecord.annotationTool
          : DEFAULT_LITESNAP_PANEL_DATA.settings.annotationTool,
      annotationFillShapes:
        typeof settingsRecord?.annotationFillShapes === "boolean"
          ? settingsRecord.annotationFillShapes
          : DEFAULT_LITESNAP_PANEL_DATA.settings.annotationFillShapes,
      recentColors,
      historyEnabled:
        typeof settingsRecord?.historyEnabled === "boolean"
          ? settingsRecord.historyEnabled
          : DEFAULT_LITESNAP_PANEL_DATA.settings.historyEnabled,
      historyMaxItems: Number.isFinite(historyMaxItemsRaw)
        ? Math.min(50, Math.max(5, Math.round(historyMaxItemsRaw)))
        : DEFAULT_LITESNAP_PANEL_DATA.settings.historyMaxItems
    },
    statusMessage:
      typeof record?.statusMessage === "string"
        ? record.statusMessage
        : DEFAULT_LITESNAP_PANEL_DATA.statusMessage
  };
}

function buildLiteSnapTarget(
  action:
    | "start-capture"
    | "pin-from-clipboard"
    | "open-settings"
    | "open-history"
    | "open-diagnostics"
    | "start-color-capture"
): string {
  const params = new URLSearchParams();
  params.set("action", action);
  return `command:plugin:${LITESNAP_PLUGIN_ID}?${params.toString()}`;
}

function formatLiteSnapPostCaptureBehavior(
  behavior: LiteSnapPanelData["settings"]["postCaptureBehavior"]
): string {
  switch (behavior) {
    case "copy":
      return "截图后直接复制";
    case "save":
      return "截图后直接保存";
    case "pin":
      return "截图后直接贴图";
    default:
      return "保留工具条";
  }
}

function createLiteSnapFormSection(children: HTMLElement[]): HTMLDivElement {
  const section = document.createElement("div");
  section.className = "litesnap-form-section";
  section.append(...children);
  return section;
}

function createLiteSnapFieldsGrid(rows: HTMLElement[]): HTMLDivElement {
  const grid = document.createElement("div");
  grid.className = "litesnap-fields-grid";
  for (const row of rows) {
    row.classList.add("litesnap-fields-grid-item");
    grid.appendChild(row);
  }
  return grid;
}

function createLiteSnapInfoRow(
  labelText: string,
  valueText: string,
  hintText?: string
): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "settings-row settings-row-textarea settings-row-info";

  const label = document.createElement("div");
  label.className = "settings-row-label";
  label.textContent = labelText;

  const value = document.createElement("div");
  value.className = "settings-value settings-row-info-value";
  value.textContent = valueText;

  row.append(label, value);

  if (hintText) {
    const hint = document.createElement("div");
    hint.className = "settings-row-hint";
    hint.textContent = hintText;
    row.appendChild(hint);
  }

  return row;
}

function createLiteSnapFieldRow(
  labelText: string,
  control: HTMLElement,
  hintText?: string
): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "litesnap-settings-field";

  const label = document.createElement("label");
  label.className = "settings-row-label";
  label.textContent = labelText;
  if (control.id) {
    label.htmlFor = control.id;
  }

  row.append(label, control);

  if (hintText) {
    const hint = document.createElement("div");
    hint.className = "settings-row-hint";
    hint.textContent = hintText;
    row.appendChild(hint);
  }

  return row;
}

function createLiteSnapTextInput(
  id: string,
  name: string,
  value: string,
  placeholder = "",
  type = "text"
): HTMLInputElement {
  const input = document.createElement("input");
  input.id = id;
  input.name = name;
  input.type = type;
  input.className = "settings-number";
  input.value = value;
  input.placeholder = placeholder;
  return input;
}

function formatLiteSnapShortcutFromEvent(event: KeyboardEvent): string | null {
  const key = event.key;
  if (!key || key === "Control" || key === "Shift" || key === "Alt" || key === "Meta") {
    return null;
  }
  if (key === "Escape") {
    return "";
  }

  const parts: string[] = [];
  if (event.ctrlKey) {
    parts.push("Ctrl");
  }
  if (event.altKey) {
    parts.push("Alt");
  }
  if (event.shiftKey) {
    parts.push("Shift");
  }

  const normalizedKey =
    key.length === 1
      ? key.toUpperCase()
      : key === " "
        ? "Space"
        : key.replace(/^Arrow/, "");
  parts.push(normalizedKey);
  return parts.join("+");
}

function getLiteSnapShortcutValidationError(shortcut: string): string | null {
  const normalized = shortcut.trim();
  if (!normalized) {
    return "快捷键不能为空。";
  }
  if (/\s/.test(normalized)) {
    return "快捷键不能包含空格。";
  }
  if (/^F(?:[1-9]|1[0-9]|2[0-4])$/i.test(normalized)) {
    return null;
  }
  if (normalized.includes("+")) {
    const parts = normalized.split("+").filter(Boolean);
    const key = parts[parts.length - 1] ?? "";
    const modifiers = new Set(parts.slice(0, -1).map((part) => part.toLowerCase()));
    if (!key || modifiers.size === 0) {
      return "组合快捷键需要包含主按键。";
    }
    if (modifiers.has("ctrl") || modifiers.has("alt") || modifiers.has("shift")) {
      return null;
    }
  }
  return "请使用 F1-F24，或 Ctrl/Alt/Shift 组合快捷键。";
}

function createLiteSnapShortcutControl(
  id: string,
  name: string,
  value: string,
  placeholder: string
): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = "litesnap-settings-inline-control";

  const input = createLiteSnapTextInput(id, name, value, placeholder);

  const recordButton = document.createElement("button");
  recordButton.type = "button";
  recordButton.className =
    "settings-btn settings-btn-secondary litesnap-settings-inline-btn";
  recordButton.textContent = "录制";
  recordButton.addEventListener("click", () => {
    const originalText = recordButton.textContent ?? "录制";
    recordButton.textContent = "按下快捷键...";
    input.focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      event.preventDefault();
      event.stopPropagation();
      const shortcut = formatLiteSnapShortcutFromEvent(event);
      if (shortcut === null) {
        return;
      }
      if (shortcut) {
        const error = getLiteSnapShortcutValidationError(shortcut);
        if (error) {
          setStatus(error);
        } else {
          input.value = shortcut;
        }
      }
      recordButton.textContent = originalText;
      input.removeEventListener("keydown", onKeyDown, true);
    };

    input.addEventListener("keydown", onKeyDown, true);
  });

  wrapper.append(input, recordButton);
  return wrapper;
}

function createLiteSnapDirectoryControl(
  id: string,
  name: string,
  value: string,
  placeholder: string
): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = "litesnap-settings-inline-control";

  const input = createLiteSnapTextInput(id, name, value, placeholder);

  const pickButton = document.createElement("button");
  pickButton.type = "button";
  pickButton.className =
    "settings-btn settings-btn-secondary litesnap-settings-inline-btn";
  pickButton.textContent = "选择";
  pickButton.addEventListener("click", () => {
    const launcher = getLauncherApi();
    if (!launcher?.pickDirectoryPath) {
      setStatus("当前版本不支持选择文件夹，请手动输入保存目录。");
      return;
    }
    beginPluginNativeInteraction(20000);
    void launcher
      .pickDirectoryPath()
      .then((selectedPath) => {
        if (typeof selectedPath === "string" && selectedPath.trim()) {
          input.value = selectedPath.trim();
        }
      })
      .finally(() => schedulePluginNativeInteractionRelease(260));
  });

  wrapper.append(input, pickButton);
  return wrapper;
}

function createLiteSnapNumberInput(
  id: string,
  name: string,
  value: number,
  min: number,
  max: number
): HTMLInputElement {
  const input = document.createElement("input");
  input.id = id;
  input.name = name;
  input.type = "number";
  input.className = "settings-number";
  input.min = String(min);
  input.max = String(max);
  input.step = "1";
  input.value = String(value);
  return input;
}

function createLiteSnapSelect(
  id: string,
  name: string,
  value: string,
  options: Array<{ value: string; label: string }>
): HTMLSelectElement {
  const select = document.createElement("select");
  select.id = id;
  select.name = name;
  select.className = "settings-number";
  for (const option of options) {
    const optionNode = document.createElement("option");
    optionNode.value = option.value;
    optionNode.textContent = option.label;
    optionNode.selected = option.value === value;
    select.appendChild(optionNode);
  }
  return select;
}

function createLiteSnapCheckbox(
  id: string,
  name: string,
  checked: boolean
): HTMLInputElement {
  const input = document.createElement("input");
  input.id = id;
  input.name = name;
  input.type = "checkbox";
  input.checked = checked;
  return input;
}

async function runLiteSnapInstallOcrCapabilities(
  installButton: HTMLButtonElement,
  resultTextarea: HTMLTextAreaElement,
  languages: Array<"zh-CN" | "en-US">
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.liteSnapInstallOcrCapabilities) {
    setStatus("当前版本不支持一键安装，请升级 LiteLauncher 或手动运行 PowerShell。");
    return;
  }

  const installLanguages =
    languages.length > 0 ? languages : resolveLiteSnapMissingOcrLanguages();
  if (installLanguages.length === 0) {
    setStatus("系统 OCR 组件已全部安装，无需重复安装。");
    renderList();
    return;
  }

  const defaultLabel = formatLiteSnapOcrInstallActionLabel(installLanguages);
  const previousLabel = installButton.textContent ?? defaultLabel;
  installButton.disabled = true;
  installButton.textContent = "安装中…";
  resultTextarea.placeholder =
    "正在请求管理员权限并安装 OCR 组件，可能需要几分钟，请勿关闭弹出的 PowerShell 窗口…";
  beginPluginNativeInteraction(1_800_000);

  try {
    const result = await launcher.liteSnapInstallOcrCapabilities(installLanguages);
    const capLines = result.capabilities
      .map(
        (cap) =>
          `${cap.languageTag}: ${cap.installed ? "已安装" : cap.state || "未安装"}`
      )
      .join("\n");
    const zhCap = result.capabilities.find((cap) => cap.languageTag === "zh-CN");
    const enCap = result.capabilities.find((cap) => cap.languageTag === "en-US");
    applyLiteSnapOcrProbeResult({
      ok: result.ok,
      message: [result.message, capLines].filter(Boolean).join("\n"),
      moduleLoaded: liteSnapOcrProbeState?.moduleLoaded ?? true,
      chineseReady: zhCap?.installed ?? liteSnapOcrProbeState?.chineseReady ?? false,
      englishReady: enCap?.installed ?? liteSnapOcrProbeState?.englishReady ?? false,
      capabilities: result.capabilities,
      ocrIssue: result.ok ? undefined : "language_pack"
    });
    resultTextarea.value = liteSnapOcrProbeSummary;
    resultTextarea.placeholder = "";
    setStatus(
      result.cancelled
        ? "已取消管理员授权。"
        : result.ok
          ? "OCR 组件安装完成，请重启 LiteLauncher。"
          : result.message
    );
    renderList();
  } catch (error) {
    console.warn("[litesnap] OCR capability install failed", error);
    liteSnapOcrProbeSummary = "安装失败，请确认已点击 UAC「是」授予管理员权限。";
    liteSnapOcrProbeIssue = "language_pack";
    resultTextarea.value = liteSnapOcrProbeSummary;
    setStatus("OCR 安装失败。");
    renderList();
  } finally {
    installButton.disabled = false;
    installButton.textContent = previousLabel;
    schedulePluginNativeInteractionRelease(260);
  }
}

async function runLiteSnapSettingsOcrProbe(
  probeButton: HTMLButtonElement,
  resultTextarea: HTMLTextAreaElement
): Promise<void> {
  const launcher = getLauncherApi();
  const previousLabel = probeButton.textContent ?? "检测 OCR";
  probeButton.disabled = true;
  probeButton.textContent = "检测中…";
  resultTextarea.value = "";
  resultTextarea.placeholder = "正在检测 Windows OCR 模块与语言包…";
  liteSnapOcrProbeIssue = null;
  beginPluginNativeInteraction(25_000);

  if (!launcher?.liteSnapProbeOcr) {
    liteSnapOcrProbeSummary = [
      "当前版本未加载 OCR 检测接口，请先重启 LiteLauncher。",
      "若仍不可用，请确认已安装最新版，并点「一键安装 OCR（中+英）」。"
    ].join("\n");
    liteSnapOcrProbeIssue = "module_missing";
    resultTextarea.value = liteSnapOcrProbeSummary;
    resultTextarea.placeholder = "";
    setStatus("请先重启应用，再试一键安装 OCR。");
    probeButton.disabled = false;
    probeButton.textContent = previousLabel;
    schedulePluginNativeInteractionRelease(260);
    return;
  }

  let shouldRefreshPanel = false;
  try {
    const result = await launcher.liteSnapProbeOcr();
    applyLiteSnapOcrProbeResult(result);
    resultTextarea.value = liteSnapOcrProbeSummary;
    resultTextarea.placeholder = "";
    setStatus(
      result.ok
        ? "OCR 检测通过。"
        : shouldShowLiteSnapOcrInstallAction()
          ? `OCR 检测未通过，请点「${formatLiteSnapOcrInstallActionLabel(
              resolveLiteSnapMissingOcrLanguages()
            )}」或「重启 LiteLauncher」。`
          : "OCR 检测未通过，请点「重启 LiteLauncher」。"
    );
    shouldRefreshPanel = true;
  } catch (error) {
    console.warn("[litesnap] settings OCR probe failed", error);
    liteSnapOcrProbeSummary = [
      "检测失败，请完全退出 LiteLauncher 后重试。",
      "可先点「一键安装 OCR（中+英）」安装系统语言包。"
    ].join("\n");
    liteSnapOcrProbeIssue = "module_missing";
    resultTextarea.value = liteSnapOcrProbeSummary;
    resultTextarea.placeholder = "";
    setStatus("OCR 检测失败，请重试一键安装。");
    shouldRefreshPanel = true;
  } finally {
    probeButton.disabled = false;
    probeButton.textContent = previousLabel;
    schedulePluginNativeInteractionRelease(260);
    if (shouldRefreshPanel) {
      renderList();
    }
  }
}

function inferLiteSnapOcrIssueFromMessage(
  message: string
): "module_missing" | "language_pack" | null {
  const utils = window.__LL_LITESNAP_TEXT_UTILS__;
  return utils?.inferLiteSnapOcrIssue?.(message) ?? null;
}

async function saveLiteSnapSettings(form: HTMLFormElement): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("启动器桥接暂不可用。");
    return;
  }

  const submitButton = form.querySelector<HTMLButtonElement>(
    'button[type="submit"]'
  );
  if (submitButton?.disabled) {
    return;
  }

  const formData = new FormData(form);
  const screenshotShortcut = String(formData.get("screenshotShortcut") ?? "").trim();
  const pinShortcut = String(formData.get("pinShortcut") ?? "").trim();
  const togglePinClickThroughShortcut = String(
    formData.get("togglePinClickThroughShortcut") ?? ""
  ).trim();
  const screenshotShortcutError = getLiteSnapShortcutValidationError(screenshotShortcut);
  if (screenshotShortcutError) {
    setStatus(`截图快捷键无效：${screenshotShortcutError}`);
    return;
  }
  const pinShortcutError = getLiteSnapShortcutValidationError(pinShortcut);
  if (pinShortcutError) {
    setStatus(`贴图快捷键无效：${pinShortcutError}`);
    return;
  }
  if (togglePinClickThroughShortcut) {
    const togglePinClickThroughError = getLiteSnapShortcutValidationError(
      togglePinClickThroughShortcut
    );
    if (togglePinClickThroughError) {
      setStatus(`点击穿透快捷键无效：${togglePinClickThroughError}`);
      return;
    }
  }

  const historyMaxItemsRaw = Number(formData.get("historyMaxItems"));
  const historyMaxItems = Number.isFinite(historyMaxItemsRaw)
    ? Math.min(50, Math.max(5, Math.round(historyMaxItemsRaw)))
    : DEFAULT_LITESNAP_PANEL_DATA.settings.historyMaxItems;

  const patch = {
    screenshotShortcut,
    pinShortcut,
    colorShortcut: "",
    togglePinClickThroughShortcut,
    saveDirectory: String(formData.get("saveDirectory") ?? "").trim(),
    saveFormat:
      formData.get("saveFormat") === "jpg" ? "jpg" : "png",
    postCaptureBehavior:
      formData.get("postCaptureBehavior") === "copy" ||
      formData.get("postCaptureBehavior") === "save" ||
      formData.get("postCaptureBehavior") === "pin"
        ? formData.get("postCaptureBehavior")
        : "toolbar",
    annotationColor: String(formData.get("annotationColor") ?? "").trim(),
    annotationLineWidth: Number(formData.get("annotationLineWidth")),
    annotationTextSize: Number(formData.get("annotationTextSize")),
    annotationFillShapes: formData.get("annotationFillShapes") === "on",
    historyEnabled: formData.get("historyEnabled") === "on",
    historyMaxItems
  };

  const previousLabel = submitButton?.textContent ?? "保存设置";
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "保存中…";
  }

  try {
    const settings = await launcher.setLiteSnapSettings(patch);
    const shortcutRegistration = toRecord(toRecord(settings)?.shortcutRegistration);
    const statusMessage =
      typeof shortcutRegistration?.message === "string"
        ? `LiteSnap 设置已保存。${shortcutRegistration.message}`
        : "LiteSnap 设置已保存。";
    liteSnapPanelData = normalizeLiteSnapPanelData({
      settings,
      statusMessage
    });
    liteSnapPanelView = "settings";
    setStatus(statusMessage);
    // The form already reflects the values the user just submitted, so a
    // full renderList() rebuild here is unnecessary and would only reset
    // scroll position/focus. Just restore the submit button in place.
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = previousLabel;
    }
  } catch (error) {
    console.warn("[litesnap] save settings failed", error);
    setStatus("保存设置失败，请重试。");
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = previousLabel;
    }
  }
}

async function hydrateLiteSnapPanelFromSettings(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.getLiteSnapSettings) {
    return;
  }

  try {
    const settings = await launcher.getLiteSnapSettings();
    liteSnapPanelData = normalizeLiteSnapPanelData({
      ...liteSnapPanelData,
      settings
    });
    if (activePluginPanel?.pluginId === LITESNAP_PLUGIN_ID) {
      renderList();
    }
  } catch {
    // Keep the last known panel state if settings cannot be loaded.
  }
}

interface TranslateToolPanelData {
  settings: {
    baiduAppId: string;
    baiduSecret: string;
    baiduEngine: "standard" | "llm";
    baiduApiKey: string;
  };
  statusMessage: string;
}

const DEFAULT_TRANSLATE_TOOL_PANEL_DATA: TranslateToolPanelData = {
  settings: {
    baiduAppId: "",
    baiduSecret: "",
    baiduEngine: "standard",
    baiduApiKey: ""
  },
  statusMessage: "粘贴或输入文字，翻译为中文（英译中，使用百度翻译）。"
};

let translateToolPanelData: TranslateToolPanelData = {
  settings: { ...DEFAULT_TRANSLATE_TOOL_PANEL_DATA.settings },
  statusMessage: DEFAULT_TRANSLATE_TOOL_PANEL_DATA.statusMessage
};
let translateToolPanelView: "main" | "settings" = "main";
let translateToolSourceText = "";
let translateToolResultText = "";
let translateToolDictionaryEntry: {
  word: string;
  phonetic: string;
  translation: string;
  definition: string;
  pos: string;
  tags: string;
} | null = null;
let selectionTranslateSettingsState = {
  enabled: true,
  hotkey: "F4",
  restoreClipboard: true,
  dismissOnOutsideClick: true
};
type DictionaryPanelEntry = {
  word: string;
  phonetic: string;
  translation: string;
  definition: string;
  pos: string;
  tags: string;
  exchange?: string;
};
let dictionaryQueryText = "";
let dictionaryPanelEntry: DictionaryPanelEntry | null = null;
let dictionaryPanelCandidates: DictionaryPanelEntry[] = [];
let dictionaryPanelStatusMessage = "输入英文单词或词组后查询。";
let dictionaryPanelHistoryFilter: "all" | "en" | "zh" = "all";
let dictionaryPanelTtsEnabled = false;
let dictionaryPackStatus: import("../shared/dictionary").DictionaryPackStatus | null = null;
let dictionaryPackDownloadProgress: import("../shared/dictionary").DictionaryPackDownloadProgress | null =
  null;
let dictionaryPanelHistory: Array<{
  word: string;
  phonetic: string;
  translationPreview: string;
  note?: string;
  savedAt: number;
}> = [];
let dictionaryPanelFavorites: Array<{
  word: string;
  phonetic: string;
  translationPreview: string;
  note?: string;
  savedAt: number;
}> = [];

function applyDictionaryPanelState(state: {
  history: typeof dictionaryPanelHistory;
  favorites: typeof dictionaryPanelFavorites;
  ttsEnabled?: boolean;
}): void {
  dictionaryPanelHistory = [...state.history];
  dictionaryPanelFavorites = [...state.favorites];
  if (typeof state.ttsEnabled === "boolean") {
    dictionaryPanelTtsEnabled = state.ttsEnabled;
  }
}

function formatDictionaryExchangeForPanel(exchange: string): string {
  const trimmed = exchange.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = /^([a-z]):(.+)$/i.exec(part);
      if (!match) {
        return part;
      }
      const kind = match[1]?.toLowerCase() ?? "";
      const value = match[2] ?? "";
      const labels: Record<string, string> = {
        p: "过去式",
        d: "过去分词",
        i: "现在分词",
        3: "第三人称",
        s: "复数",
        r: "比较级",
        t: "最高级",
        0: "原型",
        1: "原型"
      };
      const label = labels[kind];
      return label ? `${label}: ${value}` : part;
    })
    .join(" · ");
}

function speakDictionaryEntry(entry: DictionaryPanelEntry): void {
  if (typeof window.speechSynthesis === "undefined") {
    setStatus("当前环境不支持系统朗读。");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(entry.word);
  utterance.lang = /[\u3400-\u9fff]/.test(entry.word) ? "zh-CN" : "en-US";
  window.speechSynthesis.speak(utterance);
  setStatus(`正在朗读「${entry.word}」。`);
}

function isCurrentDictionaryEntryFavorited(): boolean {
  if (!dictionaryPanelEntry) {
    return false;
  }
  const key = dictionaryPanelEntry.word.trim().toLowerCase();
  return dictionaryPanelFavorites.some(
    (item) => item.word.trim().toLowerCase() === key
  );
}

function formatDictionaryBookmarkTime(savedAt: number): string {
  return new Date(savedAt).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function hydrateDictionaryPanelState(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.getDictionaryPanelState) {
    return;
  }
  try {
    const state = await launcher.getDictionaryPanelState();
    applyDictionaryPanelState(state);
  } catch (error) {
    console.warn("[dictionary] load panel state failed", error);
  }
}

async function exportDictionaryFavoritesFromPanel(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.exportDictionaryFavoritesCsv) {
    setStatus("导出接口不可用，请重启应用后重试。");
    return;
  }
  if (dictionaryPanelFavorites.length === 0) {
    setStatus("当前没有收藏词条可导出。");
    return;
  }
  setStatus("正在导出收藏 CSV…");
  try {
    const result = await launcher.exportDictionaryFavoritesCsv();
    setStatus(result.message);
  } catch (error) {
    console.warn("[dictionary] export favorites failed", error);
    setStatus("导出收藏失败，请稍后重试。");
  }
}

async function setDictionaryPanelTtsEnabled(enabled: boolean): Promise<void> {
  const launcher = getLauncherApi();
  dictionaryPanelTtsEnabled = enabled;
  if (!launcher?.setDictionaryTtsEnabled) {
    return;
  }
  try {
    const state = await launcher.setDictionaryTtsEnabled(enabled);
    applyDictionaryPanelState(state);
    setStatus(enabled ? "已开启查词后朗读。" : "已关闭查词后朗读。");
  } catch (error) {
    console.warn("[dictionary] set tts failed", error);
    setStatus("更新朗读设置失败，请稍后重试。");
  }
}

function formatDictionaryPackDownloadProgress(
  progress: import("../shared/dictionary").DictionaryPackDownloadProgress
): string {
  const receivedMb = (progress.received / (1024 * 1024)).toFixed(1);
  if (progress.total && progress.total > 0) {
    const totalMb = (progress.total / (1024 * 1024)).toFixed(1);
    const percent = Math.min(100, Math.round((progress.received / progress.total) * 100));
    return `已下载 ${receivedMb} / ${totalMb} MB（${percent}%）`;
  }
  return `已下载 ${receivedMb} MB`;
}

function buildDictionaryPackStatusText(
  status: import("../shared/dictionary").DictionaryPackStatus | null
): string {
  if (!status) {
    return "词典词库状态未知";
  }
  if (status.tier === "full") {
    return status.usingUserPack
      ? `完整词库（约 ${Math.round(status.entryCount / 1000)}k 词，含 FTS 中译英加速）`
      : "安装包已含完整词库";
  }
  if (status.tier === "seed") {
    return "种子词库（约 7k 词，覆盖中考/四六级常用词）";
  }
  return `当前词库约 ${status.entryCount} 词`;
}

function buildDictionaryPackStatusHint(
  status: import("../shared/dictionary").DictionaryPackStatus | null
): string {
  if (!status) {
    return "完整词库约 160MB，按需下载到本机用户目录";
  }
  if (status.packPath) {
    return `路径：${status.packPath}`;
  }
  if (status.tier === "seed") {
    return "可在下方下载完整词库（约 160MB，含全量词条和 FTS 索引）";
  }
  return "完整词库约 160MB，按需下载到本机用户目录";
}

async function hydrateDictionaryPackStatus(): Promise<
  import("../shared/dictionary").DictionaryPackStatus | null
> {
  const launcher = getLauncherApi();
  if (!launcher?.getDictionaryPackStatus) {
    return null;
  }
  try {
    dictionaryPackStatus = await launcher.getDictionaryPackStatus();
    return dictionaryPackStatus;
  } catch (error) {
    console.warn("[dictionary] pack status failed", error);
    return null;
  }
}

async function downloadDictionaryPackFromPanel(
  downloadButton: HTMLButtonElement,
  progressWrap?: HTMLElement,
  progressBar?: HTMLProgressElement,
  progressText?: HTMLElement
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.downloadDictionaryPack) {
    setStatus("词典下载接口不可用，请重启应用后重试。");
    return;
  }
  const previous = downloadButton.textContent ?? "下载完整词库";
  const stopProgress =
    launcher.onDictionaryPackDownloadProgress?.((progress) => {
      dictionaryPackDownloadProgress = progress;
      if (progressBar) {
        if (progress.total && progress.total > 0) {
          progressBar.max = progress.total;
          progressBar.value = progress.received;
        } else {
          progressBar.removeAttribute("value");
        }
      }
      if (progressText) {
        progressText.textContent = formatDictionaryPackDownloadProgress(progress);
      }
      if (progressWrap) {
        progressWrap.hidden = false;
      }
    }) ?? (() => undefined);
  downloadButton.disabled = true;
  downloadButton.textContent = "下载中…";
  if (progressWrap) {
    progressWrap.hidden = false;
  }
  if (progressText) {
    progressText.textContent = "正在连接…";
  }
  setStatus("正在下载完整词库，请稍候…");
  try {
    const result = await launcher.downloadDictionaryPack();
    setStatus(result.message);
    if (result.ok) {
      dictionaryPackDownloadProgress = null;
      await hydrateDictionaryPackStatus();
      if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
        renderList();
      }
    }
  } catch (error) {
    console.warn("[dictionary] download pack failed", error);
    setStatus("下载完整词库失败，请稍后重试。");
  } finally {
    stopProgress();
    downloadButton.disabled = false;
    downloadButton.textContent = previous;
    if (progressWrap) {
      progressWrap.hidden = true;
    }
    dictionaryPackDownloadProgress = null;
  }
}

function renderDictionaryBookmarkList(
  container: HTMLElement,
  items: typeof dictionaryPanelHistory,
  options: {
    emptyText: string;
    removeLabel: string;
    onSelect: (word: string) => void;
    onRemove: (word: string) => void;
  }
): void {
  container.replaceChildren();
  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "dictionary-word-empty";
    empty.textContent = options.emptyText;
    container.appendChild(empty);
    return;
  }

  for (const item of items) {
    const row = document.createElement("article");
    row.className = "dictionary-word-row";

    const mainButton = document.createElement("button");
    mainButton.type = "button";
    mainButton.className = "dictionary-word-row-main";
    const wordEl = document.createElement("div");
    wordEl.className = "dictionary-word-row-word";
    wordEl.textContent = item.word;
    const previewEl = document.createElement("div");
    previewEl.className = "dictionary-word-row-preview";
    previewEl.textContent =
      item.note?.trim()
        ? item.note.trim()
        : item.translationPreview || item.phonetic
          ? [item.phonetic ? `/${item.phonetic}/` : "", item.translationPreview]
              .filter(Boolean)
              .join(" · ")
          : "点击再次查询";
    const timeEl = document.createElement("div");
    timeEl.className = "dictionary-word-row-time";
    timeEl.textContent = formatDictionaryBookmarkTime(item.savedAt);
    mainButton.append(wordEl, previewEl, timeEl);
    mainButton.addEventListener("click", () => {
      options.onSelect(item.word);
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "dictionary-word-row-remove";
    removeButton.textContent = options.removeLabel;
    removeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      void options.onRemove(item.word);
    });

    row.append(mainButton, removeButton);
    container.appendChild(row);
  }
}

async function lookupDictionaryWordFromPanel(
  form: HTMLFormElement,
  word: string
): Promise<void> {
  dictionaryQueryText = word;
  const input = form.querySelector<HTMLInputElement>("#dictionary-query");
  if (input) {
    input.value = word;
  }
  await runDictionaryPanelLookup(form);
}

async function toggleDictionaryPanelFavorite(form: HTMLFormElement): Promise<void> {
  if (!dictionaryPanelEntry) {
    setStatus("请先查询一个词再收藏。");
    return;
  }
  const launcher = getLauncherApi();
  if (!launcher?.toggleDictionaryFavorite) {
    setStatus("收藏功能不可用，请重启应用后重试。");
    return;
  }
  try {
    const state = await launcher.toggleDictionaryFavorite({
      word: dictionaryPanelEntry.word,
      entry: dictionaryPanelEntry
    });
    applyDictionaryPanelState(state);
    if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
      renderList();
    }
    setStatus(
      isCurrentDictionaryEntryFavorited()
        ? `已收藏「${dictionaryPanelEntry.word}」。`
        : `已取消收藏「${dictionaryPanelEntry.word}」。`
    );
  } catch (error) {
    console.warn("[dictionary] toggle favorite failed", error);
    setStatus("收藏操作失败，请稍后重试。");
  }
}

async function removeDictionaryPanelHistoryItem(
  form: HTMLFormElement,
  word: string
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.removeDictionaryHistoryItem) {
    return;
  }
  try {
    const state = await launcher.removeDictionaryHistoryItem(word);
    applyDictionaryPanelState(state);
    if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
      renderList();
    }
    setStatus(`已移除历史记录「${word}」。`);
  } catch (error) {
    console.warn("[dictionary] remove history failed", error);
    setStatus("移除历史失败，请稍后重试。");
  }
}

async function clearDictionaryPanelHistory(form: HTMLFormElement): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.clearDictionaryHistory) {
    return;
  }
  try {
    const state = await launcher.clearDictionaryHistory();
    applyDictionaryPanelState(state);
    if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
      renderList();
    }
    setStatus("已清空查询历史。");
  } catch (error) {
    console.warn("[dictionary] clear history failed", error);
    setStatus("清空历史失败，请稍后重试。");
  }
}

async function removeDictionaryPanelFavorite(
  form: HTMLFormElement,
  word: string
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.removeDictionaryFavorite) {
    return;
  }
  try {
    const state = await launcher.removeDictionaryFavorite(word);
    applyDictionaryPanelState(state);
    if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
      renderList();
    }
    setStatus(`已取消收藏「${word}」。`);
  } catch (error) {
    console.warn("[dictionary] remove favorite failed", error);
    setStatus("取消收藏失败，请稍后重试。");
  }
}

async function saveDictionaryFavoriteNote(
  form: HTMLFormElement,
  word: string,
  note: string
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.updateDictionaryFavoriteNote) {
    setStatus("收藏备注不可用，请重启应用后重试。");
    return;
  }
  try {
    const state = await launcher.updateDictionaryFavoriteNote({ word, note });
    applyDictionaryPanelState(state);
    if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
      renderList();
    }
    setStatus(`已更新「${word}」的收藏备注。`);
  } catch (error) {
    console.warn("[dictionary] update favorite note failed", error);
    setStatus("更新收藏备注失败，请稍后重试。");
  }
}

function populateDictionaryEntryCard(
  card: HTMLElement,
  entry: DictionaryPanelEntry
): void {
  card.replaceChildren();
  const wordEl = document.createElement("div");
  wordEl.className = "translate-dictionary-card__word";
  wordEl.textContent = entry.word;
  card.appendChild(wordEl);
  if (entry.phonetic) {
    const phoneticEl = document.createElement("div");
    phoneticEl.className = "translate-dictionary-card__phonetic";
    phoneticEl.textContent = `/${entry.phonetic}/`;
    card.appendChild(phoneticEl);
  }
  const metaText = [entry.pos, entry.tags].filter(Boolean).join(" · ");
  if (metaText) {
    const metaEl = document.createElement("div");
    metaEl.className = "translate-dictionary-card__meta";
    metaEl.textContent = metaText;
    card.appendChild(metaEl);
  }
  if (entry.translation) {
    const translationLabel = document.createElement("div");
    translationLabel.className = "translate-dictionary-card__meta";
    translationLabel.textContent = "中文释义";
    const translationEl = document.createElement("div");
    translationEl.className = "translate-dictionary-card__text";
    translationEl.textContent = entry.translation;
    card.append(translationLabel, translationEl);
  }
  if (entry.definition) {
    const definitionLabel = document.createElement("div");
    definitionLabel.className = "translate-dictionary-card__meta";
    definitionLabel.textContent = "英文释义";
    definitionLabel.style.marginTop = entry.translation ? "8px" : "";
    const definitionEl = document.createElement("div");
    definitionEl.className = "translate-dictionary-card__text";
    definitionEl.textContent = entry.definition;
    card.append(definitionLabel, definitionEl);
  }
  const exchangeText = formatDictionaryExchangeForPanel(entry.exchange ?? "");
  if (exchangeText) {
    const exchangeLabel = document.createElement("div");
    exchangeLabel.className = "translate-dictionary-card__meta";
    exchangeLabel.textContent = "词形变化";
    exchangeLabel.style.marginTop = "8px";
    const exchangeEl = document.createElement("div");
    exchangeEl.className = "translate-dictionary-card__text";
    exchangeEl.textContent = exchangeText;
    card.append(exchangeLabel, exchangeEl);
  }
}

function normalizeDictionaryPanelData(value: unknown): {
  query: string;
  statusMessage: string;
} {
  const record = toRecord(value);
  return {
    query: typeof record?.query === "string" ? record.query : "",
    statusMessage:
      typeof record?.statusMessage === "string"
        ? record.statusMessage
        : dictionaryPanelStatusMessage
  };
}

function isDictionaryLookupText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }
  if (trimmed.length <= 64 && /^[A-Za-z][A-Za-z' \-]*$/.test(trimmed)) {
    return true;
  }
  if (!/[\u3400-\u9fff]/.test(trimmed) || trimmed.length > 32) {
    return false;
  }
  return /^[\u3400-\u9fffA-Za-z0-9\s·，、；：""''（）()《》【】…—\-]+$/.test(
    trimmed
  );
}

async function runDictionaryPanelLookup(form: HTMLFormElement): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("词典接口不可用，请重启应用后重试。");
    return;
  }
  const input = form.querySelector<HTMLInputElement>("#dictionary-query");
  const lookupButton = form.querySelector<HTMLButtonElement>(
    'button[data-action="dictionary-lookup"]'
  );
  const cardHost = form.querySelector<HTMLElement>("#dictionary-result-card");
  const text = input?.value.replace(/\r\n/g, "\n").trim() ?? "";
  dictionaryQueryText = text;

  if (!text) {
    dictionaryPanelEntry = null;
    if (cardHost) {
      cardHost.hidden = true;
      cardHost.replaceChildren();
    }
    setStatus("请输入英文单词或词组。");
    return;
  }

  if (!isDictionaryLookupText(text)) {
    dictionaryPanelEntry = null;
    if (cardHost) {
      cardHost.hidden = true;
      cardHost.replaceChildren();
    }
    setStatus("仅支持英文或中文单词/词组查询。");
    return;
  }

  if (!launcher.lookupDictionaryWord && !launcher.lookupDictionaryCandidates) {
    setStatus("词典接口不可用，请重启应用后重试。");
    return;
  }

  const previousLabel = lookupButton?.textContent ?? "查询";
  if (lookupButton) {
    lookupButton.disabled = true;
    lookupButton.textContent = "查询中…";
  }
  setStatus(`正在查询「${text}」…`);

  try {
    const candidates =
      typeof launcher.lookupDictionaryCandidates === "function"
        ? await launcher.lookupDictionaryCandidates(text, 8)
        : launcher.lookupDictionaryWord
          ? [await launcher.lookupDictionaryWord(text)].filter(
              (item): item is NonNullable<typeof item> => Boolean(item)
            )
          : [];
    const entry = candidates[0];
    if (!entry) {
      dictionaryPanelEntry = null;
      dictionaryPanelCandidates = [];
      if (cardHost) {
        cardHost.hidden = true;
        cardHost.replaceChildren();
      }
      setStatus(`离线词典未收录「${text}」，请检查拼写或尝试词组变体。`);
      return;
    }

    dictionaryPanelCandidates = candidates.map((item) => ({
      word: item.word,
      phonetic: item.phonetic,
      translation: item.translation,
      definition: item.definition,
      pos: item.pos,
      tags: item.tags,
      exchange: item.exchange
    }));
    dictionaryPanelEntry = dictionaryPanelCandidates[0] ?? null;
    if (launcher.recordDictionaryLookup && dictionaryPanelEntry) {
      try {
        const state = await launcher.recordDictionaryLookup({
          query: text,
          entry
        });
        applyDictionaryPanelState(state);
      } catch (error) {
        console.warn("[dictionary] record lookup failed", error);
      }
    }
    if (cardHost && dictionaryPanelEntry) {
      cardHost.hidden = false;
      populateDictionaryEntryCard(cardHost, dictionaryPanelEntry);
    }
    if (dictionaryPanelTtsEnabled && dictionaryPanelEntry) {
      speakDictionaryEntry(dictionaryPanelEntry);
    } else {
      setStatus(
        dictionaryPanelCandidates.length > 1
          ? `已找到「${entry.word}」，另有 ${dictionaryPanelCandidates.length - 1} 个相关词条。`
          : `已找到「${entry.word}」。`
      );
    }
    if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
      renderList();
    }
  } catch (error) {
    console.warn("[dictionary] lookup failed", error);
    dictionaryPanelEntry = null;
    dictionaryPanelCandidates = [];
    if (cardHost) {
      cardHost.hidden = true;
      cardHost.replaceChildren();
    }
    setStatus("查询失败，请稍后重试。");
  } finally {
    if (lookupButton) {
      lookupButton.disabled = false;
      lookupButton.textContent = previousLabel;
    }
  }
}

async function maybeAutoRunDictionaryPanelLookup(): Promise<void> {
  if (!dictionaryQueryText.trim()) {
    return;
  }
  const form = document.querySelector<HTMLFormElement>("form.dictionary-form");
  if (!form) {
    return;
  }
  const input = form.querySelector<HTMLInputElement>("#dictionary-query");
  if (input && !input.value.trim()) {
    input.value = dictionaryQueryText;
  }
  await runDictionaryPanelLookup(form);
}

function normalizeTranslateToolPanelData(value: unknown): TranslateToolPanelData {
  const record = toRecord(value);
  const settingsRecord = toRecord(record?.settings);
  return {
    settings: {
      baiduAppId:
        typeof settingsRecord?.baiduAppId === "string"
          ? settingsRecord.baiduAppId
          : DEFAULT_TRANSLATE_TOOL_PANEL_DATA.settings.baiduAppId,
      baiduSecret:
        typeof settingsRecord?.baiduSecret === "string"
          ? settingsRecord.baiduSecret
          : DEFAULT_TRANSLATE_TOOL_PANEL_DATA.settings.baiduSecret,
      baiduEngine:
        settingsRecord?.baiduEngine === "llm" ||
        settingsRecord?.baiduEngine === "standard"
          ? settingsRecord.baiduEngine
          : DEFAULT_TRANSLATE_TOOL_PANEL_DATA.settings.baiduEngine,
      baiduApiKey:
        typeof settingsRecord?.baiduApiKey === "string"
          ? settingsRecord.baiduApiKey
          : DEFAULT_TRANSLATE_TOOL_PANEL_DATA.settings.baiduApiKey
    },
    statusMessage:
      typeof record?.statusMessage === "string"
        ? record.statusMessage
        : DEFAULT_TRANSLATE_TOOL_PANEL_DATA.statusMessage
  };
}

function openTranslateToolSettingsView(): void {
  translateToolPanelView = "settings";
  if (activePluginPanel?.pluginId === WEBTOOLS_TRANSLATE_PLUGIN_ID) {
    renderList();
  }
}

function returnToTranslateToolMainView(): void {
  translateToolPanelView = "main";
  if (activePluginPanel?.pluginId === WEBTOOLS_TRANSLATE_PLUGIN_ID) {
    renderList();
  }
}

async function hydrateTranslateToolPanelFromSettings(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.getTranslateToolSettings) {
    return;
  }

  try {
    const settings = await launcher.getTranslateToolSettings();
    translateToolPanelData = normalizeTranslateToolPanelData({
      ...translateToolPanelData,
      settings
    });
    if (launcher.getSelectionTranslateSettings) {
      selectionTranslateSettingsState =
        await launcher.getSelectionTranslateSettings();
    }
    if (activePluginPanel?.pluginId === WEBTOOLS_TRANSLATE_PLUGIN_ID) {
      renderList();
    }
  } catch {
    // Keep the last known panel state if settings cannot be loaded.
  }
}

async function runTranslateToolPanelTranslate(form: HTMLFormElement): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.translateToolTranslateText) {
    setStatus("翻译功能未加载，请重启 LiteLauncher。");
    return;
  }

  const sourceTextarea = form.querySelector<HTMLTextAreaElement>(
    "#webtools-translate-source"
  );
  if (!sourceTextarea) {
    return;
  }

  const text = sourceTextarea.value.replace(/\r\n/g, "\n").trim();
  if (!text) {
    setStatus("请输入要翻译的文字。");
    return;
  }

  const resultTextarea = form.querySelector<HTMLTextAreaElement>(
    "#webtools-translate-result"
  );
  const translateButton = form.querySelector<HTMLButtonElement>(
    'button[data-action="translate-run"]'
  );
  const previousLabel = translateButton?.textContent ?? "翻译";
  if (translateButton) {
    translateButton.disabled = true;
    translateButton.textContent = "翻译中…";
  }
  if (resultTextarea) {
    resultTextarea.value = "";
    resultTextarea.placeholder = "正在翻译，请稍候…";
  }

  const dictionaryCardHost = form.querySelector<HTMLElement>(
    "#webtools-translate-dictionary-card"
  );
  if (dictionaryCardHost) {
    dictionaryCardHost.hidden = true;
    dictionaryCardHost.replaceChildren();
  }
  translateToolDictionaryEntry = null;

  try {
    const formData = new FormData(form);
    if (
      text.length <= 64 &&
      (typeof launcher.lookupDictionaryCandidates === "function" ||
        typeof launcher.lookupDictionaryWord === "function")
    ) {
      const isLookupText =
        /^[A-Za-z][A-Za-z' \-]*$/.test(text) ||
        (/[\u3400-\u9fff]/.test(text) &&
          /^[\u3400-\u9fffA-Za-z0-9\s·，、；：""''（）()《》【】…—\-]+$/.test(text));
      if (isLookupText) {
        const candidates =
          typeof launcher.lookupDictionaryCandidates === "function"
            ? await launcher.lookupDictionaryCandidates(text, 1)
            : launcher.lookupDictionaryWord
              ? [await launcher.lookupDictionaryWord(text)].filter(
                  (item): item is NonNullable<typeof item> => Boolean(item)
                )
              : [];
        const entry = candidates[0];
        if (entry) {
          translateToolDictionaryEntry = {
            word: entry.word,
            phonetic: entry.phonetic,
            translation: entry.translation,
            definition: entry.definition,
            pos: entry.pos,
            tags: entry.tags
          };
          if (dictionaryCardHost) {
            dictionaryCardHost.hidden = false;
            const wordEl = document.createElement("div");
            wordEl.className = "translate-dictionary-card__word";
            wordEl.textContent = entry.word;
            dictionaryCardHost.appendChild(wordEl);
            if (entry.phonetic) {
              const phoneticEl = document.createElement("div");
              phoneticEl.className = "translate-dictionary-card__phonetic";
              phoneticEl.textContent = `/${entry.phonetic}/`;
              dictionaryCardHost.appendChild(phoneticEl);
            }
            const metaText = [entry.pos, entry.tags].filter(Boolean).join(" · ");
            if (metaText) {
              const metaEl = document.createElement("div");
              metaEl.className = "translate-dictionary-card__meta";
              metaEl.textContent = metaText;
              dictionaryCardHost.appendChild(metaEl);
            }
            if (entry.translation) {
              const translationEl = document.createElement("div");
              translationEl.className = "translate-dictionary-card__text";
              translationEl.textContent = entry.translation;
              dictionaryCardHost.appendChild(translationEl);
            }
          }
        }
      }
    }

    const result = await launcher.translateToolTranslateText({
      text,
      appId: String(formData.get("baiduAppId") ?? "").trim() || undefined,
      secret: String(formData.get("baiduSecret") ?? "").trim() || undefined,
      apiKey: String(formData.get("baiduApiKey") ?? "").trim() || undefined,
      engine:
        formData.get("baiduEngine") === "llm"
          ? "llm"
          : formData.get("baiduEngine") === "standard"
            ? "standard"
            : undefined
    });
    translateToolSourceText = text;
    translateToolResultText = result.ok ? result.translatedText : "";
    if (resultTextarea) {
      resultTextarea.value = translateToolResultText;
      resultTextarea.placeholder = result.ok
        ? ""
        : result.message || "翻译失败，请检查百度翻译配置。";
    }
    setStatus(
      result.ok
        ? translateToolDictionaryEntry
          ? "已显示词典释义，并完成在线翻译。"
          : "翻译完成。"
        : result.message
    );
  } catch (error) {
    console.warn("[webtools-translate] translate failed", error);
    if (resultTextarea) {
      resultTextarea.placeholder = "翻译失败，请检查网络后重试。";
    }
    setStatus("翻译失败，请检查网络后重试。");
  } finally {
    if (translateButton) {
      translateButton.disabled = false;
      translateButton.textContent = previousLabel;
    }
  }
}

async function saveTranslateToolSettings(form: HTMLFormElement): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.setTranslateToolSettings) {
    setStatus("启动器桥接暂不可用。");
    return;
  }

  const submitButton = form.querySelector<HTMLButtonElement>(
    'button[type="submit"]'
  );
  if (submitButton?.disabled) {
    return;
  }

  const formData = new FormData(form);
  const patch = {
    baiduAppId: String(formData.get("baiduAppId") ?? "").trim(),
    baiduSecret: String(formData.get("baiduSecret") ?? "").trim(),
    baiduEngine:
      formData.get("baiduEngine") === "llm" ? ("llm" as const) : ("standard" as const),
    baiduApiKey: String(formData.get("baiduApiKey") ?? "").trim()
  };
  const selectionPatch = {
    enabled: formData.get("selectionTranslateEnabled") === "on",
    hotkey: String(formData.get("selectionTranslateHotkey") ?? "").trim() || "F4",
    restoreClipboard: formData.get("selectionTranslateRestoreClipboard") === "on",
    dismissOnOutsideClick:
      formData.get("selectionTranslateDismissOutside") === "on"
  };

  const previousLabel = submitButton?.textContent ?? "保存设置";
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "保存中…";
  }

  try {
    const settings = await launcher.setTranslateToolSettings(patch);
    translateToolPanelData = normalizeTranslateToolPanelData({
      ...translateToolPanelData,
      settings
    });
    if (launcher.setSelectionTranslateSettings) {
      selectionTranslateSettingsState =
        await launcher.setSelectionTranslateSettings(selectionPatch);
    }
    setStatus("翻译设置已保存。");
    returnToTranslateToolMainView();
  } catch (error) {
    console.warn("[webtools-translate] save settings failed", error);
    setStatus("保存翻译设置失败，请重试。");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = previousLabel;
    }
  }
}

async function executeLiteSnapPanelAction(
  action:
    | "start-capture"
    | "pin-from-clipboard"
    | "toggle-pinned-windows"
    | "close-all-pinned-windows"
    | "open-settings"
    | "open-history"
    | "open-diagnostics"
    | "start-color-capture"
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("启动器桥接暂不可用。");
    return;
  }

  if (action === "open-settings") {
    openLiteSnapSettingsView();
    return;
  }

  if (action === "open-history") {
    openLiteSnapHistoryView();
    return;
  }

  if (action === "open-diagnostics") {
    openLiteSnapDiagnosticsView();
    return;
  }

  if (action === "start-capture") {
    const ok = await launcher.liteSnapStartCapture();
    setStatus(ok ? "已进入截图模式，主窗口保持可见。" : "LiteSnap 截图启动失败。");
    return;
  }

  if (action === "start-color-capture") {
    if (!launcher.liteSnapStartColorCapture) {
      setStatus("当前版本暂不支持取色，请升级 LiteLauncher。");
      return;
    }
    const ok = await launcher.liteSnapStartColorCapture();
    setStatus(ok ? "已进入取色模式。" : "LiteSnap 取色启动失败。");
    return;
  }

  if (action === "toggle-pinned-windows") {
    const result = await launcher.liteSnapTogglePinnedWindows();
    if (result.count === 0) {
      setStatus("当前没有打开的贴图窗口。");
    } else {
      setStatus(result.hidden ? `已隐藏 ${result.count} 个贴图。` : `已显示 ${result.count} 个贴图。`);
    }
    return;
  }

  if (action === "close-all-pinned-windows") {
    if (!launcher.liteSnapCloseAllPinnedWindows) {
      setStatus("当前版本暂不支持关闭全部贴图，请升级 LiteLauncher。");
      return;
    }
    const result = await launcher.liteSnapCloseAllPinnedWindows();
    setStatus(
      result.count === 0
        ? "当前没有打开的贴图窗口。"
        : `已关闭 ${result.count} 个贴图。`
    );
    return;
  }

  const ok = await launcher.liteSnapPinClipboard();
  setStatus(ok ? "已尝试将剪贴板图片贴到屏幕。" : "剪贴板里没有可贴图的图片，或贴图功能暂不可用。");
}

function openLiteSnapSettingsView(): void {
  liteSnapPanelView = "settings";
  setStatus("已进入 LiteSnap 设置页。");
  renderList();
}

function openLiteSnapHistoryView(): void {
  liteSnapPanelView = "history";
  setStatus("已进入截图历史。");
  renderList();
  void hydrateLiteSnapHistory();
}

function openLiteSnapDiagnosticsView(): void {
  liteSnapPanelView = "diagnostics";
  setStatus("已进入 LiteSnap 诊断页。");
  renderList();
  void hydrateLiteSnapDiagnostics();
}

function returnToLiteSnapMainView(): void {
  liteSnapPanelView = "main";
  setStatus("已返回 LiteSnap 主页面。");
  renderList();
}

function toLiteSnapFileUrl(filePath: string): string {
  const trimmed = filePath.trim();
  if (!trimmed) {
    return "";
  }
  if (/^(?:file|data|https?):/i.test(trimmed)) {
    return trimmed;
  }
  const normalized = trimmed.replace(/\\/g, "/");
  if (/^[A-Za-z]:\//.test(normalized)) {
    return `file:///${normalized}`;
  }
  if (normalized.startsWith("/")) {
    return `file://${normalized}`;
  }
  return `file:///${normalized}`;
}

function formatLiteSnapHistorySource(source: string): string {
  switch (source) {
    case "capture-copy":
      return "复制";
    case "capture-save":
      return "保存";
    case "capture-pin":
      return "贴图";
    case "clipboard-pin":
      return "剪贴板贴图";
    case "history-edit":
      return "二次编辑";
    default:
      return source;
  }
}

function formatLiteSnapHistoryTime(createdAt: number): string {
  if (!Number.isFinite(createdAt) || createdAt <= 0) {
    return "";
  }
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const now = Date.now();
  const deltaMs = Math.max(0, now - createdAt);
  if (deltaMs < 60_000) {
    return "刚刚";
  }
  if (deltaMs < 3_600_000) {
    return `${Math.floor(deltaMs / 60_000)} 分钟前`;
  }
  if (deltaMs < 86_400_000) {
    return `${Math.floor(deltaMs / 3_600_000)} 小时前`;
  }
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
}

async function hydrateLiteSnapHistory(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.liteSnapListHistory) {
    liteSnapHistoryItems = [];
    return;
  }

  try {
    const items = await launcher.liteSnapListHistory();
    liteSnapHistoryItems = Array.isArray(items)
      ? items.map((item) => ({
          id: item.id,
          filePath: item.filePath,
          thumbPath: item.thumbPath,
          width: item.width,
          height: item.height,
          source: item.source,
          createdAt: item.createdAt
        }))
      : [];
  } catch (error) {
    console.warn("[litesnap] list history failed", error);
    liteSnapHistoryItems = [];
  }

  if (
    activePluginPanel?.pluginId === LITESNAP_PLUGIN_ID &&
    liteSnapPanelView === "history"
  ) {
    renderList();
  }
}

const LITESNAP_DIAGNOSTIC_METRIC_LABELS: Record<string, string> = {
  sampleFrames: "采样帧数",
  changedFrames: "变化帧数",
  acceptedFrames: "接受帧数",
  rejectedFrames: "拒绝帧数",
  lastRejectReason: "最近拒绝原因",
  outputSegments: "输出片段数",
  directionSwitches: "方向切换次数",
  targetWindowMisses: "目标窗口连续丢失次数",
  stitchedHeight: "拼接高度",
  width: "输出宽度",
  physicalWidth: "选区物理宽度",
  physicalHeight: "选区物理高度",
  peakMemoryBytes: "峰值内存估算",
  finishSettleMs: "终帧等待耗时",
  scrollMs: "滚动转发耗时",
  captureMs: "采集耗时",
  stitchMs: "匹配耗时",
  composeMs: "合成耗时",
  exportMs: "保存耗时",
  maskReady: "遮罩已就绪",
  maskState: "遮罩状态",
  capturePath: "截图路径",
  composeReason: "合成失败原因"
};

function formatLiteSnapDiagnostic(entry: (typeof liteSnapDiagnostics)[number]): string {
  const metrics = Object.entries(entry.metrics)
    .map(([key, value]) => `${LITESNAP_DIAGNOSTIC_METRIC_LABELS[key] ?? key}=${value}`)
    .join(" · ");
  return [
    `${entry.operation} / ${entry.status}`,
    `${Math.max(0, Math.round(entry.durationMs))} ms`,
    metrics,
    entry.message
  ]
    .filter(Boolean)
    .join("\n");
}

async function formatLiteSnapDiagnosticsForClipboard(): Promise<string> {
  let version = "unknown";
  try {
    const status = await getLauncherApi()?.getAppUpdaterStatus?.();
    version = status?.currentVersion || version;
  } catch {
    // Diagnostics remain useful even if the updater status is unavailable.
  }
  const system = navigator.userAgent.replace(/\s+/g, " ").trim();
  return [
    "LiteSnap 诊断",
    `应用版本=${version}`,
    `系统信息=${system}`,
    ...liteSnapDiagnostics.map((entry) => `${new Date(entry.createdAt).toISOString()} ${formatLiteSnapDiagnostic(entry).replace(/\n/g, " | ")}`)
  ].join("\n");
}

async function hydrateLiteSnapDiagnostics(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.liteSnapGetDiagnostics) {
    liteSnapDiagnostics = [];
    return;
  }
  try {
    const entries = await launcher.liteSnapGetDiagnostics();
    liteSnapDiagnostics = Array.isArray(entries) ? entries.map((entry) => ({
      id: entry.id,
      operation: entry.operation,
      status: entry.status,
      createdAt: entry.createdAt,
      durationMs: entry.durationMs,
      metrics: { ...entry.metrics },
      message: entry.message
    })) : [];
  } catch (error) {
    console.warn("[litesnap] list diagnostics failed", error);
    liteSnapDiagnostics = [];
  }
  if (activePluginPanel?.pluginId === LITESNAP_PLUGIN_ID && liteSnapPanelView === "diagnostics") {
    renderList();
  }
}

async function runLiteSnapHistoryEdit(id: string): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.liteSnapHistoryEdit) {
    setStatus("当前版本暂不支持二次编辑，请升级 LiteLauncher。");
    return;
  }
  try {
    const ok = await launcher.liteSnapHistoryEdit(id);
    if (!ok) {
      setStatus("无法打开该历史截图，请重试。");
      return;
    }
    setStatus("已在编辑器中打开历史截图；导出会新建一条历史记录。");
    backToSearch();
  } catch (error) {
    console.warn("[litesnap] history edit failed", error);
    setStatus("打开历史截图失败，请重试。");
  }
}

async function runLiteSnapCopyDiagnostics(): Promise<void> {
  const copied = await copyTextToClipboard(await formatLiteSnapDiagnosticsForClipboard());
  setStatus(copied ? "已复制诊断信息。" : "复制诊断信息失败，请重试。");
}

async function runLiteSnapClearDiagnostics(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.liteSnapClearDiagnostics) {
    setStatus("当前版本暂不支持清空诊断，请升级 LiteLauncher。");
    return;
  }
  try {
    await launcher.liteSnapClearDiagnostics();
    liteSnapDiagnostics = [];
    setStatus("已清空 LiteSnap 诊断。");
    if (liteSnapPanelView === "diagnostics") {
      renderList();
    }
  } catch (error) {
    console.warn("[litesnap] clear diagnostics failed", error);
    setStatus("清空诊断失败，请重试。");
  }
}

async function runLiteSnapHistoryCopy(id: string): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.liteSnapHistoryCopy) {
    setStatus("当前版本暂不支持历史复制，请升级 LiteLauncher。");
    return;
  }
  try {
    const ok = await launcher.liteSnapHistoryCopy(id);
    setStatus(ok ? "已复制历史截图到剪贴板。" : "复制失败，请重试。");
  } catch (error) {
    console.warn("[litesnap] history copy failed", error);
    setStatus("复制失败，请重试。");
  }
}

async function runLiteSnapHistoryPin(id: string): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.liteSnapHistoryPin) {
    setStatus("当前版本暂不支持历史贴图，请升级 LiteLauncher。");
    return;
  }
  try {
    const ok = await launcher.liteSnapHistoryPin(id);
    setStatus(ok ? "已将历史截图贴到屏幕。" : "贴图失败，请重试。");
  } catch (error) {
    console.warn("[litesnap] history pin failed", error);
    setStatus("贴图失败，请重试。");
  }
}

async function runLiteSnapHistoryDelete(id: string): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.liteSnapDeleteHistoryItem) {
    setStatus("当前版本暂不支持删除历史，请升级 LiteLauncher。");
    return;
  }
  try {
    const ok = await launcher.liteSnapDeleteHistoryItem(id);
    if (ok) {
      liteSnapHistoryItems = liteSnapHistoryItems.filter((item) => item.id !== id);
      setStatus("已删除该历史记录。");
      if (liteSnapPanelView === "history") {
        renderList();
      }
    } else {
      setStatus("删除失败，请重试。");
    }
  } catch (error) {
    console.warn("[litesnap] history delete failed", error);
    setStatus("删除失败，请重试。");
  }
}

async function runLiteSnapClearHistory(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.liteSnapClearHistory) {
    setStatus("当前版本暂不支持清空历史，请升级 LiteLauncher。");
    return;
  }
  try {
    const count = await launcher.liteSnapClearHistory();
    liteSnapHistoryItems = [];
    setStatus(count === 0 ? "历史记录已为空。" : `已清空 ${count} 条历史记录。`);
    if (liteSnapPanelView === "history") {
      renderList();
    }
  } catch (error) {
    console.warn("[litesnap] clear history failed", error);
    setStatus("清空历史失败，请重试。");
  }
}

const pluginPanelHandlers: Readonly<Record<string, PluginPanelHandler>> = {
  [HARDWARE_INSPECTOR_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderHardwareInspectorPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyHardwareInspectorPanelPayload(panel);
    },
    "form.hardware-inspector-form"
  ),
  [CLIPBOARD_WORKBENCH_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderClipboardWorkbenchPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyClipboardWorkbenchPanelPayload(panel);
    },
    "form.clipboard-workbench-form"
  ),
  [LITESNAP_PLUGIN_ID]: {
    render: () => {
      getRegisteredPanelImpls().renderLiteSnapPanel();
    },
    onOpen: (panel) => {
      getRegisteredPanelImpls().applyLiteSnapPanelPayload(panel);
      void hydrateLiteSnapPanelFromSettings();
    },
    onEnter: runWithPluginForm("form.litesnap-form", (form) => {
      form.requestSubmit();
    })
  },
  [WEBTOOLS_PASSWORD_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsPasswordPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsPasswordPanelPayload(panel);
    },
    "form.webtools-password-form"
  ),
  [WEBTOOLS_JSON_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsJsonPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsJsonPanelPayload(panel);
    },
    "form.webtools-json-form"
  ),
  [WEBTOOLS_JSON_SCHEMA_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsJsonSchemaPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsJsonSchemaPanelPayload(panel);
    },
    "form.webtools-json-schema-form"
  ),
  [WEBTOOLS_DATA_MASK_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsDataMaskPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsDataMaskPanelPayload(panel);
    },
    "form.webtools-data-mask-form"
  ),
  [WEBTOOLS_URL_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsUrlPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsUrlPanelPayload(panel);
    },
    "form.webtools-url-form"
  ),
  [WEBTOOLS_DIFF_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsDiffPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsDiffPanelPayload(panel);
    },
    "form.webtools-diff-form"
  ),
  [WEBTOOLS_TIMESTAMP_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsTimestampPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsTimestampPanelPayload(panel);
    },
    "form.webtools-timestamp-form"
  ),
  [WEBTOOLS_TRANSLATE_PLUGIN_ID]: {
    render: () => {
      getRegisteredPanelImpls().renderWebtoolsTranslatePanel();
    },
    onOpen: (panel) => {
      getRegisteredPanelImpls().applyWebtoolsTranslatePanelPayload(panel);
      void hydrateTranslateToolPanelFromSettings();
    },
    onEnter: runWithPluginForm("form.webtools-translate-form", (form) => {
      form.requestSubmit();
    })
  },
  [DICTIONARY_PLUGIN_ID]: {
    render: () => {
      getRegisteredPanelImpls().renderDictionaryPanel();
    },
    onOpen: (panel) => {
      getRegisteredPanelImpls().applyDictionaryPanelPayload(panel);
      void Promise.all([
        hydrateDictionaryPanelState(),
        hydrateDictionaryPackStatus()
      ]).then(async () => {
        if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
          renderList();
        }
        await maybeAutoRunDictionaryPanelLookup();
      });
    },
    onEnter: runWithPluginForm("form.dictionary-form", (form) => {
      form.requestSubmit();
    })
  },
  [WEBTOOLS_REGEX_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsRegexPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsRegexPanelPayload(panel);
    },
    "form.webtools-regex-form"
  ),
  [WEBTOOLS_CRON_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsCronPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsCronPanelPayload(panel);
    },
    "form.webtools-cron-form"
  ),
  [WEBTOOLS_CRYPTO_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsCryptoPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsCryptoPanelPayload(panel);
    },
    "form.webtools-crypto-form"
  ),
  [WEBTOOLS_JWT_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsJwtPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsJwtPanelPayload(panel);
    },
    "form.webtools-jwt-form"
  ),
  [WEBTOOLS_STRINGS_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsStringsPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsStringsPanelPayload(panel);
    },
    "form.webtools-strings-form"
  ),
  [WEBTOOLS_COLORS_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsColorsPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsColorsPanelPayload(panel);
    },
    "form.webtools-colors-form"
  ),
  [WEBTOOLS_IMAGE_BASE64_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsImageBase64Panel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsImageBase64PanelPayload(panel);
    },
    "form.webtools-image-base64-form"
  ),
  [WEBTOOLS_IMAGE_PROMPT_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsImagePromptPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsImagePromptPanelPayload(panel);
    },
    "form.webtools-image-prompt-form"
  ),
  [WEBTOOLS_CONFIG_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsConfigPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsConfigPanelPayload(panel);
    },
    "form.webtools-config-form"
  ),
  [WEBTOOLS_SQL_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsSqlPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsSqlPanelPayload(panel);
    },
    "form.webtools-sql-form"
  ),
  [WEBTOOLS_UNIT_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsUnitPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsUnitPanelPayload(panel);
    },
    "form.webtools-unit-form"
  ),
  [WEBTOOLS_FILE_HASH_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsFileHashPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsFileHashPanelPayload(panel);
    },
    "form.webtools-file-hash-form"
  ),
  [WEBTOOLS_PORT_HELPER_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsPortHelperPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsPortHelperPanelPayload(panel);
    },
    "form.webtools-port-helper-form"
  ),
  [WEBTOOLS_QRCODE_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsQrcodePanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsQrcodePanelPayload(panel);
    },
    "form.webtools-qrcode-form"
  ),
  [WEBTOOLS_MARKDOWN_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsMarkdownPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsMarkdownPanelPayload(panel);
    },
    "form.webtools-markdown-form"
  ),
  [WEBTOOLS_UA_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsUaPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsUaPanelPayload(panel);
    },
    "form.webtools-ua-form"
  ),
  [WEBTOOLS_API_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsApiPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsApiPanelPayload(panel);
    },
    "form.webtools-api-form"
  ),
  [WEBTOOLS_HTTP_MOCK_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderWebtoolsHttpMockPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyWebtoolsHttpMockPanelPayload(panel);
    },
    "form.webtools-http-mock-form"
  ),
  [CODEAGENT_SWITCH_PLUGIN_ID]: createSubmitPluginPanelHandler(
    () => {
      getRegisteredPanelImpls().renderCodeAgentSwitchPanel();
    },
    (panel) => {
      getRegisteredPanelImpls().applyCodeAgentSwitchPanelPayload(panel);
    },
    "form.codeagent-switch-form"
  )
};

function getPluginPanelHandler(pluginId: string): PluginPanelHandler | null {
  return pluginPanelHandlers[pluginId] ?? null;
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
  // Render immediately so OCR/translate panels are not dropped when a stale
  // refreshEntries() call loses the latestSearchToken race.
  renderList();
  void refreshEntries("");
}

window.__LL_PANEL_IMPLS__ = {
  handleStandalonePanelPayload(panelPayload: unknown): string | null {
    const passwordPayload = parsePasswordPanelPayload(panelPayload);
    if (passwordPayload) {
      openStandalonePasswordPanel(passwordPayload.draft);
      return "password";
    }

    const cashflowPayload = parseCashflowPanelPayload(panelPayload);
    if (cashflowPayload) {
      void openStandaloneCashflowPanel(Boolean(cashflowPayload.reset), {
        reviewMode: cashflowPayload.review === true
      });
      return "cashflow";
    }

    const panel =
      typeof panelPayload === "string" ? panelPayload.trim() : "";
    if (panel === "password") {
      openStandalonePasswordPanel();
      return "password";
    }
    if (panel === "cashflow") {
      void openStandaloneCashflowPanel();
      return "cashflow";
    }
    return null;
  },

  handleGenericPluginPanelPayload(panelPayload: unknown): string | null {
    const genericPluginPayload = parseGenericPluginPanelPayload(panelPayload);
    if (!genericPluginPayload) {
      return null;
    }

    openGenericPluginPanel(genericPluginPayload);
    return genericPluginPayload.pluginId;
  },

  renderPasswordPanel(): void {
    renderStandalonePasswordPanelView();
  },

  handlePasswordPanelEnter(): void {
    const form = list.querySelector("form.password-form");
    if (form instanceof HTMLFormElement) {
      void generateFromPasswordPanel(form);
    }
  },

  renderCashflowPanel(): void {
    renderStandaloneCashflowPanelView();
  },

  async refreshCashflowPanel(): Promise<boolean> {
    return refreshStandaloneCashflowPanel();
  },

  handleCashflowPanelEnter(): void {
    void nextCashflowTurn();
  },

  renderActivePluginPanel(): void {
    const plugin = activePluginPanel;
    getRegisteredPanelImpls().cleanupPluginPanelTransientState(
      plugin?.pluginId ?? null
    );
    if (!plugin) {
      delete document.body.dataset.activePluginId;
      renderPluginPanelFallback();
      return;
    }

    document.body.dataset.activePluginId = plugin.pluginId;

    const handler = getPluginPanelHandler(plugin.pluginId);
    if (!handler) {
      renderPluginPanelFallback();
      return;
    }

    handler.render();
  },

  handleActivePluginPanelEnter(): void {
    const plugin = activePluginPanel;
    if (!plugin) {
      setStatus("\u672a\u9009\u4e2d\u63d2\u4ef6");
      return;
    }

    const handler = getPluginPanelHandler(plugin.pluginId);
    if (!handler?.onEnter) {
      setStatus(
        "\u5f53\u524d\u63d2\u4ef6\u9762\u677f\u4e0d\u652f\u6301 Enter\uff0c\u8bf7\u4f7f\u7528 Esc \u8fd4\u56de"
      );
      return;
    }

    handler.onEnter();
  },

  handleActivePluginPanelEscape(): boolean {
    if (activePluginPanel?.pluginId === WEBTOOLS_TRANSLATE_PLUGIN_ID) {
      if (translateToolPanelView === "settings") {
        returnToTranslateToolMainView();
        return true;
      }
      return false;
    }

    if (activePluginPanel?.pluginId !== LITESNAP_PLUGIN_ID) {
      return false;
    }

    if (
      liteSnapPanelView === "settings" ||
      liteSnapPanelView === "ocr" ||
      liteSnapPanelView === "translate" ||
      liteSnapPanelView === "history" ||
      liteSnapPanelView === "diagnostics"
    ) {
      returnToLiteSnapMainView();
      return true;
    }

    return false;
  },

  getActivePluginPanelTitle(): string | null {
    return activePluginPanel?.title ?? null;
  },

  cleanupPluginPanelTransientState(activePluginId: string | null): void {
    if (activePluginId !== LITESNAP_PLUGIN_ID) {
      liteSnapPanelView = "main";
      liteSnapHistoryItems = [];
      liteSnapDiagnostics = [];
    }
    if (activePluginId !== WEBTOOLS_TRANSLATE_PLUGIN_ID) {
      translateToolPanelView = "main";
      translateToolSourceText = "";
      translateToolResultText = "";
    }
    if (activePluginId !== DICTIONARY_PLUGIN_ID) {
      dictionaryQueryText = "";
      dictionaryPanelEntry = null;
      dictionaryPanelCandidates = [];
    }
    if (activePluginId !== WEBTOOLS_JSON_PLUGIN_ID && webtoolsJsonAutoTimer !== null) {
      window.clearTimeout(webtoolsJsonAutoTimer);
      webtoolsJsonAutoTimer = null;
    }
    if (activePluginId !== WEBTOOLS_JSON_SCHEMA_PLUGIN_ID && webtoolsJsonSchemaAutoTimer !== null) {
      window.clearTimeout(webtoolsJsonSchemaAutoTimer);
      webtoolsJsonSchemaAutoTimer = null;
    }
    if (activePluginId !== WEBTOOLS_DIFF_PLUGIN_ID && webtoolsDiffAutoTimer !== null) {
      window.clearTimeout(webtoolsDiffAutoTimer);
      webtoolsDiffAutoTimer = null;
    }
    if (activePluginId !== WEBTOOLS_TIMESTAMP_PLUGIN_ID) {
      clearWebtoolsTimestampAutoTimer();
      clearWebtoolsTimestampClockTimer();
    }
    if (activePluginId !== WEBTOOLS_CRON_PLUGIN_ID && webtoolsCronAutoTimer !== null) {
      window.clearTimeout(webtoolsCronAutoTimer);
      webtoolsCronAutoTimer = null;
    }
    if (activePluginId !== WEBTOOLS_CRYPTO_PLUGIN_ID) {
      if (webtoolsCryptoAutoTimer !== null) {
        window.clearTimeout(webtoolsCryptoAutoTimer);
        webtoolsCryptoAutoTimer = null;
      }
      if (removeActiveCryptoAlgorithmMenuListener) {
        removeActiveCryptoAlgorithmMenuListener();
        removeActiveCryptoAlgorithmMenuListener = null;
      }
    }
    if (activePluginId !== WEBTOOLS_JWT_PLUGIN_ID) {
      if (webtoolsJwtAutoTimer !== null) {
        window.clearTimeout(webtoolsJwtAutoTimer);
        webtoolsJwtAutoTimer = null;
      }
      if (webtoolsJwtSignTimer !== null) {
        window.clearTimeout(webtoolsJwtSignTimer);
        webtoolsJwtSignTimer = null;
      }
    }
    if (activePluginId !== WEBTOOLS_COLORS_PLUGIN_ID && webtoolsColorsAutoTimer !== null) {
      window.clearTimeout(webtoolsColorsAutoTimer);
      webtoolsColorsAutoTimer = null;
    }
    if (
      activePluginId !== WEBTOOLS_IMAGE_BASE64_PLUGIN_ID &&
      webtoolsImageBase64AutoTimer !== null
    ) {
      window.clearTimeout(webtoolsImageBase64AutoTimer);
      webtoolsImageBase64AutoTimer = null;
    }
    if (activePluginId !== WEBTOOLS_IMAGE_PROMPT_PLUGIN_ID) {
      webtoolsImagePromptRequestToken += 1;
    }
    if (activePluginId !== WEBTOOLS_CONFIG_PLUGIN_ID && webtoolsConfigAutoTimer !== null) {
      window.clearTimeout(webtoolsConfigAutoTimer);
      webtoolsConfigAutoTimer = null;
    }
    if (activePluginId !== WEBTOOLS_SQL_PLUGIN_ID && webtoolsSqlAutoTimer !== null) {
      window.clearTimeout(webtoolsSqlAutoTimer);
      webtoolsSqlAutoTimer = null;
    }
    if (activePluginId !== WEBTOOLS_QRCODE_PLUGIN_ID && webtoolsQrAutoTimer !== null) {
      window.clearTimeout(webtoolsQrAutoTimer);
      webtoolsQrAutoTimer = null;
    }
    if (
      activePluginId !== WEBTOOLS_MARKDOWN_PLUGIN_ID &&
      webtoolsMarkdownAutoTimer !== null
    ) {
      window.clearTimeout(webtoolsMarkdownAutoTimer);
      webtoolsMarkdownAutoTimer = null;
    }
    if (activePluginId !== WEBTOOLS_UA_PLUGIN_ID && webtoolsUaAutoTimer !== null) {
      window.clearTimeout(webtoolsUaAutoTimer);
      webtoolsUaAutoTimer = null;
    }
    if (
      activePluginId !== HARDWARE_INSPECTOR_PLUGIN_ID &&
      hardwareInspectorExpandedDiskKeys.size > 0
    ) {
      hardwareInspectorExpandedDiskKeys.clear();
    }
    if (activePluginId !== HARDWARE_INSPECTOR_PLUGIN_ID) {
      hardwareInspectorPreviewImageUrl = "";
      hardwareInspectorPreviewLoading = false;
      hardwareInspectorPreviewError = "";
      hardwareInspectorPreviewRequestToken += 1;
    }
  },

  applyHardwareInspectorPanelPayload(panel: ActivePluginPanelState): void {
    const data = toRecord(panel.data);
    hardwareInspectorLoading = data?.loading === true;
    hardwareInspectorInfo = typeof data?.info === "string" ? data.info : "";
    hardwareInspectorError = typeof data?.error === "string" ? data.error : "";
    const snapshot = getHardwareInspectorSnapshotFromData(data);
    if (snapshot) {
      applyHardwareInspectorSnapshot(snapshot, hardwareInspectorInfo);
      return;
    }

    hardwareInspectorSnapshot = null;
  },

  renderHardwareInspectorPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel hardware-inspector-panel";

    const form = document.createElement("form");
    form.className = "settings-form hardware-inspector-form hardware-inspector-shell";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeHardwareInspectorRefresh();
    });

    const header = document.createElement("div");
    header.className = "hardware-inspector-header";
    const titleWrap = document.createElement("div");
    titleWrap.className = "hardware-inspector-title-wrap";
    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "硬件检测";
    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle || "查看主板、CPU、内存、显卡、硬盘等详细信息";
    titleWrap.append(title, description);

    const actions = document.createElement("div");
    actions.className = "hardware-inspector-actions";

    const refreshButton = document.createElement("button");
    refreshButton.type = "button";
    refreshButton.className = "settings-btn settings-btn-primary";
    refreshButton.textContent = hardwareInspectorLoading ? "刷新中..." : "刷新";
    refreshButton.disabled = hardwareInspectorLoading || hardwareInspectorExporting;
    refreshButton.addEventListener("click", () => {
      void executeHardwareInspectorRefresh();
    });

    const exportMarkdownButton = document.createElement("button");
    exportMarkdownButton.type = "button";
    exportMarkdownButton.className = "settings-btn settings-btn-secondary";
    exportMarkdownButton.textContent = hardwareInspectorExporting ? "导出中..." : "导出 MD";
    exportMarkdownButton.disabled = hardwareInspectorLoading || hardwareInspectorExporting;
    exportMarkdownButton.addEventListener("click", () => {
      void executeHardwareInspectorExportReport("markdown");
    });

    const exportHtmlButton = document.createElement("button");
    exportHtmlButton.type = "button";
    exportHtmlButton.className = "settings-btn settings-btn-secondary";
    exportHtmlButton.textContent = hardwareInspectorExporting ? "导出中..." : "导出 HTML";
    exportHtmlButton.disabled = hardwareInspectorLoading || hardwareInspectorExporting;
    exportHtmlButton.addEventListener("click", () => {
      void executeHardwareInspectorExportReport("html");
    });

    const exportImageCompactButton = document.createElement("button");
    exportImageCompactButton.type = "button";
    exportImageCompactButton.className = "settings-btn settings-btn-secondary";
    exportImageCompactButton.textContent = hardwareInspectorExporting ? "导出中..." : "导出精简图";
    exportImageCompactButton.disabled = hardwareInspectorLoading || hardwareInspectorExporting;
    exportImageCompactButton.addEventListener("click", () => {
      void executeHardwareInspectorExportReport("image-compact");
    });

    const exportImageButton = document.createElement("button");
    exportImageButton.type = "button";
    exportImageButton.className = "settings-btn settings-btn-secondary";
    exportImageButton.textContent = hardwareInspectorExporting ? "导出中..." : "导出长图";
    exportImageButton.disabled = hardwareInspectorLoading || hardwareInspectorExporting;
    exportImageButton.addEventListener("click", () => {
      void executeHardwareInspectorExportReport("image");
    });

    const copySummaryButton = document.createElement("button");
    copySummaryButton.type = "button";
    copySummaryButton.className = "settings-btn settings-btn-secondary";
    copySummaryButton.textContent = "复制摘要";
    copySummaryButton.disabled = !hardwareInspectorSnapshot;
    copySummaryButton.addEventListener("click", () => {
      if (!hardwareInspectorSnapshot) {
        setStatus("暂无可复制的硬件摘要");
        return;
      }
      void (async () => {
        const ok = await copyTextToClipboard(
          buildHardwareInspectorSummaryText(hardwareInspectorSnapshot)
        );
        setStatus(ok ? "已复制硬件摘要" : "复制失败");
      })();
    });

    const copyJsonButton = document.createElement("button");
    copyJsonButton.type = "button";
    copyJsonButton.className = "settings-btn settings-btn-secondary";
    copyJsonButton.textContent = "复制 JSON";
    copyJsonButton.disabled = !hardwareInspectorSnapshot;
    copyJsonButton.addEventListener("click", () => {
      if (!hardwareInspectorSnapshot) {
        setStatus("暂无可复制的硬件数据");
        return;
      }
      void (async () => {
        const ok = await copyTextToClipboard(
          JSON.stringify(hardwareInspectorSnapshot, null, 2)
        );
        setStatus(ok ? "已复制硬件 JSON" : "复制失败");
      })();
    });

    actions.append(
      refreshButton,
      exportMarkdownButton,
      exportHtmlButton,
      exportImageCompactButton,
      exportImageButton,
      copySummaryButton,
      copyJsonButton
    );
    header.append(titleWrap, actions);
    form.appendChild(header);

    const status = document.createElement("div");
    status.className = "hardware-inspector-status";
    status.dataset.state = hardwareInspectorError
      ? "error"
      : hardwareInspectorLoading
        ? "loading"
        : hardwareInspectorExporting
          ? "loading"
        : hardwareInspectorSnapshot
          ? "ok"
          : "idle";
    status.textContent = hardwareInspectorError
      ? hardwareInspectorError
      : hardwareInspectorLoading
        ? "正在采集硬件信息..."
        : hardwareInspectorExporting
          ? "正在导出硬件报告..."
        : hardwareInspectorInfo || "打开面板后会自动采集一次硬件信息";
    form.appendChild(status);

    if (hardwareInspectorSnapshot) {
      const snapshot = hardwareInspectorSnapshot;
      const diffState = hardwareInspectorDiffState;
      const overviewChangedSet = new Set(diffState?.overviewChangedKeys ?? []);
      const cpuChanges = diffState?.cpuChanges ?? {};
      const memoryChanges = diffState?.memoryChanges ?? {};
      const gpuChanges = diffState?.gpuChanges ?? {};
      const diskChanges = diffState?.diskChanges ?? {};
      const body = document.createElement("div");
      body.className = "hardware-inspector-body";
      const main = document.createElement("div");
      main.className = "hardware-inspector-main";
      const overview = document.createElement("div");
      overview.className = "hardware-inspector-overview";
      const systemName =
        [snapshot.computerSystem.manufacturer, snapshot.computerSystem.model]
          .filter(Boolean)
          .join(" ") || "未知设备";
      const osName =
        [snapshot.operatingSystem.caption, snapshot.operatingSystem.buildNumber]
          .filter(Boolean)
          .join(" / ") || "未知系统";
      const cpuName = snapshot.cpus[0]?.name ?? "未知 CPU";
      const totalMemory = formatHardwareInspectorBytes(
        snapshot.computerSystem.totalPhysicalMemory
      );
      const riskDiskCount = countHardwareInspectorRiskDisks(snapshot);
      const overviewItems: Array<{
        key: string;
        label: string;
        value: string;
        tone?: "success" | "warning" | "danger";
      }> = [
        { key: "device", label: "设备", value: systemName },
        { key: "system", label: "系统", value: osName },
        { key: "cpu", label: "CPU", value: cpuName },
        { key: "totalMemory", label: "总内存", value: totalMemory },
        { key: "gpuCount", label: "显卡", value: `${snapshot.gpus.length} 张` },
        { key: "diskCount", label: "磁盘", value: `${snapshot.disks.length} 块` },
        {
          key: "riskDiskCount",
          label: "风险磁盘",
          value: riskDiskCount > 0 ? `${riskDiskCount} 块` : "无",
          tone: riskDiskCount > 0 ? "danger" : "success"
        }
      ];
      overviewItems.forEach((item) => {
        const card = document.createElement("div");
        card.className = "hardware-inspector-overview-card";
        if (overviewChangedSet.has(item.key)) {
          card.dataset.changed = "true";
        }
        if (item.tone) {
          card.dataset.tone = item.tone;
        }
        const label = document.createElement("div");
        label.className = "hardware-inspector-overview-label";
        label.textContent = item.label;
        const value = document.createElement("div");
        value.className = "hardware-inspector-overview-value";
        value.textContent = item.value;
        card.append(label, value);
        overview.appendChild(card);
      });
      main.appendChild(overview);

      const compare = document.createElement("div");
      compare.className = "hardware-inspector-compare";
      compare.dataset.state = !diffState?.hasBaseline
        ? "first"
        : diffState.hasChanges
          ? "changed"
          : "stable";
      const compareTitle = document.createElement("div");
      compareTitle.className = "hardware-inspector-compare-title";
      compareTitle.textContent = !diffState?.hasBaseline
        ? "变化对比：首次采集"
        : diffState.hasChanges
          ? "变化对比：检测到变化"
          : "变化对比：与上次一致";
      compare.appendChild(compareTitle);
      const compareMeta = document.createElement("div");
      compareMeta.className = "hardware-inspector-compare-meta";
      compareMeta.textContent = diffState?.hasBaseline
        ? `上次：${formatHardwareInspectorDate(diffState.previousCollectedAt)} / 本次：${formatHardwareInspectorDate(diffState.currentCollectedAt)}`
        : `本次：${formatHardwareInspectorDate(snapshot.collectedAt)}`;
      compare.appendChild(compareMeta);
      const compareList = document.createElement("div");
      compareList.className = "hardware-inspector-compare-list";
      (diffState?.summary ?? ["首次采集，下一次刷新将显示变化对比"]).forEach((itemText) => {
        const item = document.createElement("div");
        item.className = "hardware-inspector-compare-item";
        item.textContent = itemText;
        compareList.appendChild(item);
      });
      compare.appendChild(compareList);
      main.appendChild(compare);

      const meta = document.createElement("div");
      meta.className = "hardware-inspector-meta";
      [
        `采集时间 ${formatHardwareInspectorDate(snapshot.collectedAt)}`,
        `启动时间 ${formatHardwareInspectorDate(snapshot.operatingSystem.lastBootUpTime)}`,
        `CPU ${snapshot.cpus.length} 颗`,
        `内存 ${snapshot.memoryModules.length} 条`,
        `显卡 ${snapshot.gpus.length} 张`,
        `磁盘 ${snapshot.disks.length} 块`
      ].forEach((text) => {
        const item = document.createElement("span");
        item.className = "hardware-inspector-meta-item";
        item.textContent = text;
        meta.appendChild(item);
      });
      main.appendChild(meta);

      const cpuSection = createHardwareInspectorSection("CPU", `共 ${snapshot.cpus.length} 颗`);
      snapshot.cpus.forEach((cpu, index) => {
        const card = createHardwareInspectorCard(`处理器 ${index + 1}`);
        const changeLabels = cpuChanges[getHardwareInspectorCpuKey(cpu, index)] ?? [];
        applyHardwareInspectorCardChangeState(card, changeLabels);
        card.appendChild(
          createHardwareInspectorTemperatureBadgeRow(
            cpu.temperatureCelsius,
            cpu.temperatureSource
          )
        );
        card.appendChild(
          createHardwareInspectorMetricGrid(createHardwareInspectorMetricItems([
            { label: "型号", value: formatHardwareInspectorText(cpu.name) },
            { label: "厂商", value: formatHardwareInspectorText(cpu.manufacturer) },
            { label: "插槽", value: formatHardwareInspectorText(cpu.socketDesignation) },
            {
              label: "核心 / 线程",
              value: `${cpu.numberOfCores ?? "?"} / ${cpu.numberOfLogicalProcessors ?? "?"}`
            },
            { label: "最大频率", value: formatHardwareInspectorClockMhz(cpu.maxClockSpeed) },
            { label: "当前频率", value: formatHardwareInspectorClockMhz(cpu.currentClockSpeed) },
            { label: "温度(可选)", value: formatHardwareInspectorTemperature(cpu.temperatureCelsius) },
            { label: "温度来源", value: cpu.temperatureSource || "不可用" },
            { label: "架构", value: formatHardwareInspectorText(cpu.architecture) },
            { label: "位宽", value: cpu.addressWidth ? `${cpu.addressWidth} bit` : "未知" },
            {
              label: "虚拟化",
              value: formatHardwareInspectorBoolean(cpu.virtualizationFirmwareEnabled)
            },
            {
              label: "SLAT",
              value: formatHardwareInspectorBoolean(
                cpu.secondLevelAddressTranslationExtensions
              )
            }
          ], changeLabels))
        );
        cpuSection.body.appendChild(card);
      });
      main.appendChild(cpuSection.section);

      const boardSection = createHardwareInspectorSection("主板 / BIOS");
      const boardCard = createHardwareInspectorCard("主板");
      applyHardwareInspectorCardChangeState(boardCard, diffState?.baseBoardChanges ?? []);
      boardCard.appendChild(
        createHardwareInspectorMetricGrid(createHardwareInspectorMetricItems([
          { label: "厂商", value: formatHardwareInspectorText(snapshot.baseBoard.manufacturer) },
          { label: "型号", value: formatHardwareInspectorText(snapshot.baseBoard.product) },
          { label: "版本", value: formatHardwareInspectorText(snapshot.baseBoard.version) },
          { label: "序列号", value: formatHardwareInspectorText(snapshot.baseBoard.serialNumber) }
        ], diffState?.baseBoardChanges ?? []))
      );
      const biosCard = createHardwareInspectorCard("BIOS");
      applyHardwareInspectorCardChangeState(biosCard, diffState?.biosChanges ?? []);
      biosCard.appendChild(
        createHardwareInspectorMetricGrid(createHardwareInspectorMetricItems([
          { label: "厂商", value: formatHardwareInspectorText(snapshot.bios.manufacturer) },
          {
            label: "版本",
            value: formatHardwareInspectorText(snapshot.bios.smbiosBiosVersion || snapshot.bios.version)
          },
          { label: "发布日期", value: formatHardwareInspectorDate(snapshot.bios.releaseDate) },
          { label: "序列号", value: formatHardwareInspectorText(snapshot.bios.serialNumber) }
        ], diffState?.biosChanges ?? []))
      );
      boardSection.body.append(boardCard, biosCard);
      main.appendChild(boardSection.section);

      const memorySection = createHardwareInspectorSection(
        "内存",
        `共 ${snapshot.memoryModules.length} 条`
      );
      snapshot.memoryModules.forEach((memory, index) => {
        const slotName = memory.deviceLocator || memory.bankLabel || `内存 ${index + 1}`;
        const card = createHardwareInspectorCard(slotName);
        const changeLabels = memoryChanges[getHardwareInspectorMemoryKey(memory, index)] ?? [];
        addHardwareInspectorCardAction(card, "复制", () => {
          void copyHardwareInspectorDetail(
            `内存：${slotName}`,
            [
              `容量：${formatHardwareInspectorBytes(memory.capacity)}`,
              `频率：${formatHardwareInspectorClockMhz(
                memory.configuredClockSpeed || memory.speed
              )}`,
              `类型：${formatHardwareInspectorText(memory.memoryType)}`,
              `形态：${formatHardwareInspectorText(memory.formFactor)}`,
              `厂商：${formatHardwareInspectorText(memory.manufacturer)}`,
              `型号：${formatHardwareInspectorText(memory.partNumber)}`,
              `序列号：${formatHardwareInspectorText(memory.serialNumber)}`
            ],
            "已复制内存信息"
          );
        });
        applyHardwareInspectorCardChangeState(card, changeLabels);
        card.appendChild(
          createHardwareInspectorMetricGrid(createHardwareInspectorMetricItems([
            { label: "容量", value: formatHardwareInspectorBytes(memory.capacity) },
            {
              label: "频率",
              value: formatHardwareInspectorClockMhz(
                memory.configuredClockSpeed || memory.speed
              )
            },
            { label: "类型", value: formatHardwareInspectorText(memory.memoryType) },
            { label: "形态", value: formatHardwareInspectorText(memory.formFactor) },
            { label: "厂商", value: formatHardwareInspectorText(memory.manufacturer) },
            { label: "型号", value: formatHardwareInspectorText(memory.partNumber) },
            { label: "序列号", value: formatHardwareInspectorText(memory.serialNumber) }
          ], changeLabels))
        );
        memorySection.body.appendChild(card);
      });
      main.appendChild(memorySection.section);

      const gpuSection = createHardwareInspectorSection(
        "显卡",
        `共 ${snapshot.gpus.length} 张`
      );
      snapshot.gpus.forEach((gpu, index) => {
        const card = createHardwareInspectorCard(gpu.name || `显卡 ${index + 1}`);
        const changeLabels = gpuChanges[getHardwareInspectorGpuKey(gpu, index)] ?? [];
        addHardwareInspectorCardAction(card, "复制", () => {
          void copyHardwareInspectorDetail(
            `显卡：${gpu.name || `显卡 ${index + 1}`}`,
            [
              `厂商：${formatHardwareInspectorText(gpu.manufacturer)}`,
              `视频处理器：${formatHardwareInspectorText(gpu.videoProcessor)}`,
              `显存：${formatHardwareInspectorBytes(gpu.adapterRam)}`,
              `驱动版本：${formatHardwareInspectorText(gpu.driverVersion)}`,
              `驱动日期：${formatHardwareInspectorDate(gpu.driverDate)}`,
              `温度(可选)：${formatHardwareInspectorTemperature(gpu.temperatureCelsius)}`,
              `温度来源：${gpu.temperatureSource || "不可用"}`,
              `分辨率：${formatHardwareInspectorResolution(gpu)}`,
              `状态：${formatHardwareInspectorText(gpu.status)}`
            ],
            "已复制显卡信息"
          );
        });
        applyHardwareInspectorCardChangeState(card, changeLabels);
        card.appendChild(
          createHardwareInspectorTemperatureBadgeRow(
            gpu.temperatureCelsius,
            gpu.temperatureSource
          )
        );
        card.appendChild(
          createHardwareInspectorMetricGrid(createHardwareInspectorMetricItems([
            { label: "厂商", value: formatHardwareInspectorText(gpu.manufacturer) },
            { label: "视频处理器", value: formatHardwareInspectorText(gpu.videoProcessor) },
            { label: "显存", value: formatHardwareInspectorBytes(gpu.adapterRam) },
            { label: "驱动版本", value: formatHardwareInspectorText(gpu.driverVersion) },
            { label: "驱动日期", value: formatHardwareInspectorDate(gpu.driverDate) },
            { label: "温度(可选)", value: formatHardwareInspectorTemperature(gpu.temperatureCelsius) },
            { label: "温度来源", value: gpu.temperatureSource || "不可用" },
            { label: "分辨率", value: formatHardwareInspectorResolution(gpu) },
            { label: "状态", value: formatHardwareInspectorText(gpu.status) }
          ], changeLabels))
        );
        gpuSection.body.appendChild(card);
      });
      main.appendChild(gpuSection.section);

      const diskSection = createHardwareInspectorSection(
        "存储",
        `共 ${snapshot.disks.length} 块`
      );
      snapshot.disks.forEach((disk, index) => {
        const card = createHardwareInspectorCard(disk.model || `磁盘 ${index + 1}`);
        const diskKey = getHardwareInspectorDiskKey(disk, index);
        const changeLabels = diskChanges[diskKey] ?? [];
        addHardwareInspectorCardAction(card, "复制", () => {
          void copyHardwareInspectorDetail(
            `磁盘：${disk.model || `磁盘 ${index + 1}`}`,
            [
              `厂商：${formatHardwareInspectorText(disk.manufacturer)}`,
              `容量：${formatHardwareInspectorBytes(disk.size)}`,
              `媒体类型：${formatHardwareInspectorText(disk.storageMediaType || disk.mediaType)}`,
              `总线：${formatHardwareInspectorText(disk.busType || disk.interfaceType)}`,
              `固件：${formatHardwareInspectorText(
                disk.firmwareVersion || disk.firmwareRevision
              )}`,
              `健康状态：${formatHardwareInspectorText(disk.healthStatus)}`,
              `运行状态：${formatHardwareInspectorText(disk.operationalStatus)}`,
              `预测故障：${formatHardwareInspectorNullableBoolean(
                disk.smartPredictFailure,
                "是",
                "否"
              )}`,
              `预测原因：${
                typeof disk.smartReason === "number" && Number.isFinite(disk.smartReason)
                  ? String(disk.smartReason)
                  : "未知"
              }`,
              `温度：${formatHardwareInspectorTemperature(disk.temperatureCelsius)}`,
              `最高温度：${formatHardwareInspectorTemperature(disk.temperatureMaxCelsius)}`,
              `磨损：${formatHardwareInspectorPercentage(disk.wearPercentage)}`,
              `通电时长：${formatHardwareInspectorHours(disk.powerOnHours)}`,
              `转速：${formatHardwareInspectorRpm(disk.spindleSpeed)}`,
              `逻辑扇区：${formatHardwareInspectorSectorSize(disk.logicalSectorSize)}`,
              `物理扇区：${formatHardwareInspectorSectorSize(disk.physicalSectorSize)}`,
              `序列号：${formatHardwareInspectorText(disk.serialNumber)}`,
              `分区 / 卷：${disk.partitions.length} / ${countHardwareInspectorDiskVolumes(disk)}`
            ],
            "已复制磁盘信息"
          );
        });
        applyHardwareInspectorCardChangeState(card, changeLabels);
        const isRiskDisk = isHardwareInspectorDiskAtRisk(disk);
        card.dataset.healthTone =
          formatHardwareInspectorText(disk.healthStatus) === "未知"
            ? "neutral"
            : isRiskDisk
              ? disk.smartPredictFailure
                ? "danger"
                : "warning"
              : "success";
        const badgeRow = document.createElement("div");
        badgeRow.className = "hardware-inspector-badge-row";
        badgeRow.appendChild(
          createHardwareInspectorBadge(
            formatHardwareInspectorText(disk.storageMediaType || disk.mediaType),
            "neutral"
          )
        );
        badgeRow.appendChild(
          createHardwareInspectorBadge(
            formatHardwareInspectorText(disk.busType || disk.interfaceType),
            "neutral"
          )
        );
        badgeRow.appendChild(
          createHardwareInspectorBadge(
            formatHardwareInspectorText(disk.healthStatus),
            card.dataset.healthTone === "warning" || card.dataset.healthTone === "danger"
              ? (card.dataset.healthTone as "warning" | "danger")
              : card.dataset.healthTone === "success"
                ? "success"
                : "neutral"
          )
        );
        badgeRow.appendChild(
          createHardwareInspectorBadge(
            formatHardwareInspectorNullableBoolean(
              disk.smartPredictFailure,
              "预测故障",
              "未预测故障"
            ),
            disk.smartPredictFailure === true ? "danger" : "neutral"
          )
        );
        card.appendChild(badgeRow);
        card.appendChild(
          createHardwareInspectorMetricGrid(createHardwareInspectorMetricItems([
            { label: "厂商", value: formatHardwareInspectorText(disk.manufacturer) },
            { label: "容量", value: formatHardwareInspectorBytes(disk.size) },
            { label: "媒体类型", value: formatHardwareInspectorText(disk.storageMediaType || disk.mediaType) },
            { label: "总线", value: formatHardwareInspectorText(disk.busType || disk.interfaceType) },
            {
              label: "固件",
              value: formatHardwareInspectorText(disk.firmwareVersion || disk.firmwareRevision)
            },
            { label: "健康状态", value: formatHardwareInspectorText(disk.healthStatus) },
            { label: "运行状态", value: formatHardwareInspectorText(disk.operationalStatus) },
            {
              label: "预测故障",
              value: formatHardwareInspectorNullableBoolean(
                disk.smartPredictFailure,
                "是",
                "否"
              )
            },
            {
              label: "预测原因",
              value:
                typeof disk.smartReason === "number" && Number.isFinite(disk.smartReason)
                  ? String(disk.smartReason)
                  : "未知"
            },
            { label: "温度", value: formatHardwareInspectorTemperature(disk.temperatureCelsius) },
            {
              label: "最高温度",
              value: formatHardwareInspectorTemperature(disk.temperatureMaxCelsius)
            },
            { label: "磨损", value: formatHardwareInspectorPercentage(disk.wearPercentage) },
            { label: "通电时长", value: formatHardwareInspectorHours(disk.powerOnHours) },
            { label: "转速", value: formatHardwareInspectorRpm(disk.spindleSpeed) },
            { label: "逻辑扇区", value: formatHardwareInspectorSectorSize(disk.logicalSectorSize) },
            { label: "物理扇区", value: formatHardwareInspectorSectorSize(disk.physicalSectorSize) },
            {
              label: "槽位",
              value:
                typeof disk.slotNumber === "number" && Number.isFinite(disk.slotNumber)
                  ? String(disk.slotNumber)
                  : "未知"
            },
            {
              label: "机箱槽",
              value:
                typeof disk.enclosureNumber === "number" && Number.isFinite(disk.enclosureNumber)
                  ? String(disk.enclosureNumber)
                  : "未知"
            },
            { label: "用途", value: formatHardwareInspectorText(disk.usage) },
            {
              label: "可加入存储池",
              value: formatHardwareInspectorNullableBoolean(
                disk.canPool,
                "可加入",
                "不可加入"
              )
            },
            { label: "序列号", value: formatHardwareInspectorText(disk.serialNumber) },
            {
              label: "分区数",
              value:
                typeof disk.partitionCount === "number" ? String(disk.partitionCount) : "未知"
            }
          ], changeLabels))
        );

        if (disk.partitions.length > 0) {
          const volumeCount = countHardwareInspectorDiskVolumes(disk);
          const expansionKey = diskKey;
          const isExpanded = hardwareInspectorExpandedDiskKeys.has(expansionKey);
          const partitionSummary = document.createElement("div");
          partitionSummary.className = "hardware-inspector-collapsible-head";
          const partitionMeta = document.createElement("div");
          partitionMeta.className = "hardware-inspector-collapsible-meta";
          partitionMeta.textContent = `分区 ${disk.partitions.length} 个 / 卷 ${volumeCount} 个`;
          const toggleButton = document.createElement("button");
          toggleButton.type = "button";
          toggleButton.className = "settings-btn settings-btn-secondary hardware-inspector-toggle-btn";
          toggleButton.textContent = isExpanded ? "收起分区" : "展开分区";
          toggleButton.addEventListener("click", () => {
            if (hardwareInspectorExpandedDiskKeys.has(expansionKey)) {
              hardwareInspectorExpandedDiskKeys.delete(expansionKey);
            } else {
              hardwareInspectorExpandedDiskKeys.add(expansionKey);
            }
            renderList();
          });
          partitionSummary.append(partitionMeta, toggleButton);
          card.appendChild(partitionSummary);

          const partitionWrap = document.createElement("div");
          partitionWrap.className = "hardware-inspector-sublist";
          partitionWrap.hidden = !isExpanded;
          disk.partitions.forEach((partition) => {
            const partitionNode = document.createElement("div");
            partitionNode.className = "hardware-inspector-subitem";
            const partitionHeader = document.createElement("div");
            partitionHeader.className = "hardware-inspector-subitem-header";
            const partitionTitle = document.createElement("div");
            partitionTitle.className = "hardware-inspector-subitem-title";
            partitionTitle.textContent = partition.name || `分区 ${partition.index ?? "?"}`;
            partitionHeader.appendChild(partitionTitle);
            addHardwareInspectorInlineAction(
              partitionHeader,
              "hardware-inspector-subitem-actions",
              "复制",
              () => {
                void copyHardwareInspectorDetail(
                  `分区：${partition.name || `分区 ${partition.index ?? "?"}`}`,
                  [
                    `容量：${formatHardwareInspectorBytes(partition.size)}`,
                    `类型：${formatHardwareInspectorText(partition.type)}`,
                    `启动分区：${formatHardwareInspectorBoolean(partition.bootPartition)}`,
                    `主分区：${formatHardwareInspectorBoolean(partition.primaryPartition)}`,
                    `卷数量：${partition.volumes.length}`
                  ],
                  "已复制分区信息"
                );
              }
            );
            partitionNode.appendChild(partitionHeader);
            partitionNode.appendChild(
              createHardwareInspectorMetricGrid([
                { label: "容量", value: formatHardwareInspectorBytes(partition.size) },
                { label: "类型", value: formatHardwareInspectorText(partition.type) },
                {
                  label: "启动分区",
                  value: formatHardwareInspectorBoolean(partition.bootPartition)
                },
                {
                  label: "主分区",
                  value: formatHardwareInspectorBoolean(partition.primaryPartition)
                }
              ])
            );

            if (partition.volumes.length > 0) {
              const volumeWrap = document.createElement("div");
              volumeWrap.className = "hardware-inspector-volume-list";
              partition.volumes.forEach((volume) => {
                const volumeNode = document.createElement("div");
                volumeNode.className = "hardware-inspector-volume-item";
                const volumeHeader = document.createElement("div");
                volumeHeader.className = "hardware-inspector-volume-header";
                const head = document.createElement("div");
                head.className = "hardware-inspector-volume-title";
                head.textContent =
                  [volume.deviceId, volume.volumeName].filter(Boolean).join(" / ") || "卷";
                volumeHeader.appendChild(head);
                addHardwareInspectorInlineAction(
                  volumeHeader,
                  "hardware-inspector-volume-actions",
                  "复制",
                  () => {
                    void copyHardwareInspectorDetail(
                      `卷：${[volume.deviceId, volume.volumeName].filter(Boolean).join(" / ") || "卷"}`,
                      [
                        `文件系统：${formatHardwareInspectorText(volume.fileSystem)}`,
                        `总空间：${formatHardwareInspectorBytes(volume.size)}`,
                        `可用空间：${formatHardwareInspectorBytes(volume.freeSpace)}`,
                        `驱动器类型：${formatHardwareInspectorDriveType(volume.driveType)}`
                      ],
                      "已复制卷信息"
                    );
                  }
                );
                volumeNode.appendChild(volumeHeader);
                volumeNode.appendChild(
                  createHardwareInspectorMetricGrid([
                    { label: "文件系统", value: formatHardwareInspectorText(volume.fileSystem) },
                    { label: "总空间", value: formatHardwareInspectorBytes(volume.size) },
                    { label: "可用空间", value: formatHardwareInspectorBytes(volume.freeSpace) },
                    {
                      label: "驱动器类型",
                      value: formatHardwareInspectorDriveType(volume.driveType)
                    }
                  ])
                );
                volumeWrap.appendChild(volumeNode);
              });
              partitionNode.appendChild(volumeWrap);
            }
            partitionWrap.appendChild(partitionNode);
          });
          card.appendChild(partitionWrap);
        }

        diskSection.body.appendChild(card);
      });
      main.appendChild(diskSection.section);
      body.append(main, createHardwareInspectorPreviewPanel());
      form.appendChild(body);
    }

    panel.append(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    if (!hardwareInspectorSnapshot && !hardwareInspectorLoading && !hardwareInspectorError) {
      queueMicrotask(() => {
        if (mode === "plugin" && activePluginPanel?.pluginId === HARDWARE_INSPECTOR_PLUGIN_ID) {
          void executeHardwareInspectorRefresh();
        }
      });
    }
  },

  applyClipboardWorkbenchPanelPayload(panel: ActivePluginPanelState): void {
    clipboardWorkbenchPanelData = normalizeClipboardWorkbenchPanelData(panel.data);
    clipboardWorkbenchSearchDraft = clipboardWorkbenchPanelData.query.search;
    ensureClipboardWorkbenchSelection();
  },

  renderClipboardWorkbenchPanel(): void {
    ensureClipboardWorkbenchSelection();
    const selectedItems = getClipboardWorkbenchSelectedItems();
    const activeItem = getClipboardWorkbenchActiveItem();

    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel clipboard-workbench-panel";

    const form = document.createElement("form");
    form.className = "settings-form clipboard-workbench-form";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeClipboardWorkbenchAction(
        "refresh",
        buildClipboardWorkbenchQueryParams()
      );
    });

    const shell = document.createElement("div");
    shell.className = "clipboard-workbench-shell";

    const toolbar = document.createElement("div");
    toolbar.className = "clipboard-workbench-toolbar";

    const toolbarHead = document.createElement("div");
    toolbarHead.className = "clipboard-workbench-toolbar-head";
    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "剪贴板工作台";
    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle ||
      "搜索并查看文本、图片与文件列表的剪贴板记录。";
    toolbarHead.append(title, description);

    const toolbarMeta = document.createElement("div");
    toolbarMeta.className = "clipboard-workbench-toolbar-meta";
    toolbarMeta.append(
      createClipboardWorkbenchBadge(
        clipboardWorkbenchPanelData.settings.autoCollect
          ? "自动采集开启"
          : "自动采集暂停",
        clipboardWorkbenchPanelData.settings.autoCollect ? "success" : "warning"
      ),
      createClipboardWorkbenchBadge(
        clipboardWorkbenchPanelData.settings.sensitiveMode
          ? "敏感模式开启"
          : "敏感模式关闭",
        clipboardWorkbenchPanelData.settings.sensitiveMode ? "warning" : "neutral"
      ),
      createClipboardWorkbenchBadge(
        `上限 ${clipboardWorkbenchPanelData.settings.maxItems}`,
        "accent"
      )
    );

    const toolbarStats = document.createElement("div");
    toolbarStats.className = "clipboard-workbench-toolbar-stats";
    [
      {
        label: "条目",
        value: String(clipboardWorkbenchPanelData.stats.totalItems)
      },
      {
        label: "容量",
        value: formatClipboardWorkbenchBytes(
          clipboardWorkbenchPanelData.stats.totalBytes
        )
      },
      {
        label: "搜索",
        value: clipboardWorkbenchPanelData.query.search.trim() || "无"
      }
    ].forEach((entry) => {
      const card = document.createElement("div");
      card.className = "clipboard-workbench-stat";
      const statLabel = document.createElement("div");
      statLabel.className = "clipboard-workbench-stat-label";
      statLabel.textContent = entry.label;
      const statValue = document.createElement("div");
      statValue.className = "clipboard-workbench-stat-value";
      statValue.textContent = entry.value;
      card.append(statLabel, statValue);
      toolbarStats.appendChild(card);
    });

    const toolbarControls = document.createElement("div");
    toolbarControls.className = "clipboard-workbench-toolbar-controls";

    const searchRow = document.createElement("div");
    searchRow.className = "clipboard-workbench-search-row";
    const searchInput = document.createElement("input");
    searchInput.className = "settings-value clipboard-workbench-search-input";
    searchInput.name = "clipboardWorkbenchSearch";
    searchInput.type = "text";
    searchInput.placeholder = "搜索摘要、备注、标签和文件路径";
    searchInput.value = clipboardWorkbenchSearchDraft;
    searchInput.addEventListener("input", () => {
      clipboardWorkbenchSearchDraft = searchInput.value;
    });
    const searchButton = document.createElement("button");
    searchButton.type = "submit";
    searchButton.className = "settings-btn settings-btn-primary";
    searchButton.textContent = "搜索";
    const clearSearchButton = document.createElement("button");
    clearSearchButton.type = "button";
    clearSearchButton.className = "settings-btn settings-btn-secondary";
    clearSearchButton.textContent = "清空";
    clearSearchButton.addEventListener("click", () => {
      clipboardWorkbenchSearchDraft = "";
      void executeClipboardWorkbenchAction(
        "refresh",
        buildClipboardWorkbenchQueryParams({ search: "", groupId: "" })
      );
    });
    searchRow.append(searchInput, searchButton, clearSearchButton);

    const toolbarActions = document.createElement("div");
    toolbarActions.className = "clipboard-workbench-toolbar-actions";

    const refreshButton = document.createElement("button");
    refreshButton.type = "button";
    refreshButton.className = "settings-btn settings-btn-secondary";
    refreshButton.textContent = "刷新";
    refreshButton.addEventListener("click", () => {
      void executeClipboardWorkbenchAction(
        "refresh",
        buildClipboardWorkbenchQueryParams()
      );
    });

    const saveCurrentButton = document.createElement("button");
    saveCurrentButton.type = "button";
    saveCurrentButton.className = "settings-btn settings-btn-secondary";
    saveCurrentButton.textContent = "保存当前剪贴板";
    saveCurrentButton.addEventListener("click", () => {
      void executeClipboardWorkbenchAction("save-current");
    });

    const toggleCollectButton = document.createElement("button");
    toggleCollectButton.type = "button";
    toggleCollectButton.className = "settings-btn settings-btn-secondary";
    toggleCollectButton.textContent = clipboardWorkbenchPanelData.settings.autoCollect
      ? "暂停采集"
      : "恢复采集";
    toggleCollectButton.addEventListener("click", () => {
      void executeClipboardWorkbenchAction("toggle-collect");
    });

    const toggleSensitiveButton = document.createElement("button");
    toggleSensitiveButton.type = "button";
    toggleSensitiveButton.className = "settings-btn settings-btn-secondary";
    toggleSensitiveButton.textContent = clipboardWorkbenchPanelData.settings.sensitiveMode
      ? "关闭敏感模式"
      : "开启敏感模式";
    toggleSensitiveButton.addEventListener("click", () => {
      void executeClipboardWorkbenchAction("toggle-sensitive");
    });

    toolbarActions.append(
      refreshButton,
      saveCurrentButton,
      toggleCollectButton,
      toggleSensitiveButton
    );

    const composer = document.createElement("div");
    composer.className = "clipboard-workbench-composer";
    const composerTitle = document.createElement("div");
    composerTitle.className = "clipboard-workbench-section-title";
    composerTitle.textContent = "手动文本草稿";

    const manualTextInput = document.createElement("textarea");
    manualTextInput.className = "settings-textarea clipboard-workbench-manual-text";
    manualTextInput.name = "clipboardWorkbenchManualText";
    manualTextInput.placeholder = "输入或粘贴文本后保存到工作台。";
    manualTextInput.value = clipboardWorkbenchManualTextDraft;

    const composerRow = document.createElement("div");
    composerRow.className = "clipboard-workbench-composer-row";
    const saveManualButton = document.createElement("button");
    saveManualButton.type = "button";
    saveManualButton.className = "settings-btn settings-btn-primary";
    saveManualButton.dataset.clipboardWorkbenchSaveManual = "1";
    saveManualButton.textContent = "保存草稿";
    saveManualButton.disabled = clipboardWorkbenchManualTextDraft.trim().length === 0;

    manualTextInput.addEventListener("input", () => {
      clipboardWorkbenchManualTextDraft = manualTextInput.value;
      saveManualButton.disabled = clipboardWorkbenchManualTextDraft.trim().length === 0;
    });
    saveManualButton.addEventListener("click", () => {
      void executeClipboardWorkbenchAction("save-manual-text", {
        manualText: clipboardWorkbenchManualTextDraft
      });
    });
    composerRow.append(manualTextInput, saveManualButton);
    composer.append(composerTitle, composerRow);

    toolbarControls.append(searchRow, toolbarActions, composer);
    toolbar.append(toolbarHead, toolbarMeta, toolbarStats, toolbarControls);

    const rail = document.createElement("aside");
    rail.className = "clipboard-workbench-rail";
    const railTitle = document.createElement("div");
    railTitle.className = "clipboard-workbench-section-title";
    railTitle.textContent = "视图";
    rail.appendChild(railTitle);

    const scopeList = document.createElement("div");
    scopeList.className = "clipboard-workbench-scope-list";
    CLIPBOARD_WORKBENCH_SCOPE_OPTIONS.forEach((scope) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "clipboard-workbench-scope-btn";
      button.dataset.selected = String(
        clipboardWorkbenchPanelData.query.scope === scope.key
      );
      button.textContent = scope.label;
      button.addEventListener("click", () => {
        const nextScope =
          clipboardWorkbenchPanelData.query.scope === scope.key ? "all" : scope.key;
        void executeClipboardWorkbenchAction(
          "refresh",
          buildClipboardWorkbenchQueryParams({ scope: nextScope, groupId: "" })
        );
      });
      scopeList.appendChild(button);
    });
    rail.appendChild(scopeList);

    const groupTitle = document.createElement("div");
    groupTitle.className = "clipboard-workbench-section-title";
    groupTitle.textContent = "分组";
    rail.appendChild(groupTitle);

    const groupList = document.createElement("div");
    groupList.className = "clipboard-workbench-group-list";
    if (clipboardWorkbenchPanelData.groups.length === 0) {
      const empty = document.createElement("div");
      empty.className = "clipboard-workbench-empty";
      empty.textContent = "暂无分组。";
      groupList.appendChild(empty);
    } else {
      clipboardWorkbenchPanelData.groups.forEach((group) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "clipboard-workbench-group-chip";
        chip.dataset.selected = String(
          clipboardWorkbenchPanelData.query.groupId === group.id
        );
        chip.textContent = `${group.name} (${group.count})`;
        chip.addEventListener("click", () => {
          const nextGroupId =
            clipboardWorkbenchPanelData.query.groupId === group.id ? "" : group.id;
          void executeClipboardWorkbenchAction(
            "refresh",
            buildClipboardWorkbenchQueryParams({ groupId: nextGroupId })
          );
        });
        groupList.appendChild(chip);
      });
    }
    rail.appendChild(groupList);

    const listSection = document.createElement("section");
    listSection.className = "clipboard-workbench-list";
    const listHeader = document.createElement("div");
    listHeader.className = "clipboard-workbench-list-head";
    const listTitle = document.createElement("div");
    listTitle.className = "clipboard-workbench-section-title";
    listTitle.textContent = "记录";
    const listMeta = document.createElement("div");
    listMeta.className = "clipboard-workbench-list-meta";
    listMeta.textContent =
      selectedItems.length > 0
        ? `${clipboardWorkbenchPanelData.items.length} 条可见 · ${selectedItems.length} 条已选`
        : `${clipboardWorkbenchPanelData.items.length} 条可见`;
    listHeader.append(listTitle, listMeta);
    listSection.appendChild(listHeader);

    const itemList = document.createElement("div");
    itemList.className = "clipboard-workbench-item-list";
    if (clipboardWorkbenchPanelData.items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "clipboard-workbench-empty";
      empty.textContent = "暂时还没有剪贴板记录。";
      itemList.appendChild(empty);
    } else {
      clipboardWorkbenchPanelData.items.forEach((item) => {
        const selected = isClipboardWorkbenchItemSelected(item.id);

        const card = document.createElement("article");
        card.className = "clipboard-workbench-item";
        card.dataset.active = String(item.id === clipboardWorkbenchActiveItemId);
        card.dataset.marked = String(selected);
        card.dataset.clipboardWorkbenchItemId = item.id;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "clipboard-workbench-item-main";
        button.dataset.selected = String(item.id === clipboardWorkbenchActiveItemId);
        button.addEventListener("click", () => {
          const previousActiveId = clipboardWorkbenchActiveItemId;
          clipboardWorkbenchActiveItemId = item.id;
          updateClipboardWorkbenchActiveItem(previousActiveId, item.id);
        });

        if (item.kind === "image" && item.assetUrl) {
          const thumb = document.createElement("img");
          thumb.className = "clipboard-workbench-item-thumb";
          thumb.src = item.assetUrl;
          thumb.alt = item.summary;
          thumb.loading = "lazy";
          card.appendChild(thumb);
        }

        const itemTitle = document.createElement("div");
        itemTitle.className = "clipboard-workbench-item-title";
        itemTitle.textContent = item.title || item.summary;
        itemTitle.title = item.title || item.summary;

        const itemFoot = document.createElement("div");
        itemFoot.className = "clipboard-workbench-item-foot";
        itemFoot.textContent = formatClipboardWorkbenchTime(item.updatedAt);

        button.append(itemTitle, itemFoot);

        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "clipboard-workbench-item-copy";
        copyButton.dataset.clipboardWorkbenchItemCopy = item.id;
        copyButton.textContent = "复制";
        copyButton.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          clipboardWorkbenchActiveItemId = item.id;
          void executeClipboardWorkbenchAction("restore-item", {
            itemId: item.id
          });
        });

        card.append(button, copyButton);
        itemList.appendChild(card);
      });
    }
    listSection.appendChild(itemList);

    if (selectedItems.length > 0) {
      listSection.appendChild(createClipboardWorkbenchBulkBar(selectedItems));
    }

    const detail = document.createElement("aside");
    detail.className = "clipboard-workbench-detail";
    appendClipboardWorkbenchDetailContent(detail, activeItem);

    shell.append(toolbar, rail, listSection, detail);
    form.appendChild(shell);
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);
  },

  applyLiteSnapPanelPayload(panel: unknown): void {
    const panelRecord = toRecord(panel);
    const dataRecord = toRecord(panelRecord?.data ?? panel);
    liteSnapPanelData = normalizeLiteSnapPanelData(dataRecord);
    const statusMessage =
      typeof dataRecord?.statusMessage === "string"
        ? dataRecord.statusMessage
        : liteSnapPanelData.statusMessage;
    liteSnapOcrIssue = resolveLiteSnapOcrIssue(dataRecord, statusMessage);
    if (dataRecord?.preferredView === "ocr") {
      liteSnapPanelView = "ocr";
      const rawOcrText =
        typeof dataRecord?.ocrText === "string" ? dataRecord.ocrText : "";
      liteSnapOcrText = normalizeLiteSnapOcrPanelText(rawOcrText);
    } else if (dataRecord?.preferredView === "translate") {
      liteSnapPanelView = "translate";
      liteSnapTranslateSourceText =
        typeof dataRecord?.translateSourceText === "string"
          ? dataRecord.translateSourceText
          : "";
      liteSnapTranslateText =
        typeof dataRecord?.translateText === "string"
          ? dataRecord.translateText
          : "";
    } else if (dataRecord?.preferredView === "settings") {
      liteSnapPanelView = "settings";
    } else if (dataRecord?.preferredView === "history") {
      liteSnapPanelView = "history";
      void hydrateLiteSnapHistory();
    } else if (dataRecord?.preferredView === "diagnostics") {
      liteSnapPanelView = "diagnostics";
      void hydrateLiteSnapDiagnostics();
    } else {
      liteSnapPanelView = "main";
    }
  },

  renderLiteSnapPanel(): void {
    ensureLiteSnapOcrCacheLoaded();

    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel litesnap-panel";

    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "截图贴图";

    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle ||
      "快速截图、基础标注、复制、保存与贴图。";

    const form = document.createElement("form");
    form.className = "settings-form litesnap-form";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (liteSnapPanelView === "settings") {
        void saveLiteSnapSettings(form);
      } else if (
        liteSnapPanelView === "ocr" ||
        liteSnapPanelView === "translate" ||
        liteSnapPanelView === "history" ||
        liteSnapPanelView === "diagnostics"
      ) {
        // OCR / translate / history views use explicit buttons; Enter should not start a capture.
      } else {
        void executeLiteSnapPanelAction("start-capture");
      }
    });

    if (liteSnapPanelView === "ocr") {
      const ocrStatusRow = createLiteSnapInfoRow(
        "文字识别",
        liteSnapPanelData.statusMessage || "已识别文字，可编辑后复制。",
        `识别使用 Windows 本地 OCR（中/英引擎自动选择）；${formatLiteSnapOcrEngineStatus()}；可在下方编辑`
      );

      const ocrField = document.createElement("div");
      ocrField.className = "settings-field litesnap-ocr-field";

      const ocrLabel = document.createElement("label");
      ocrLabel.className = "settings-field-label";
      ocrLabel.textContent = "识别结果";
      ocrLabel.htmlFor = "litesnap-ocr-text";

      const ocrTextarea = document.createElement("textarea");
      ocrTextarea.id = "litesnap-ocr-text";
      ocrTextarea.className = "litesnap-ocr-textarea";
      ocrTextarea.rows = 10;
      ocrTextarea.spellcheck = false;
      ocrTextarea.value = liteSnapOcrText;
      if (!liteSnapOcrText.trim()) {
        ocrTextarea.placeholder =
          liteSnapPanelData.statusMessage &&
          liteSnapPanelData.statusMessage !== "已识别文字，可编辑后复制。"
            ? liteSnapPanelData.statusMessage
            : "未识别到文字，请重试或检查 Windows OCR 语言包。";
      }
      ocrTextarea.addEventListener("input", () => {
        liteSnapOcrText = ocrTextarea.value;
      });

      ocrField.append(ocrLabel, ocrTextarea);

      const ocrActions = document.createElement("div");
      ocrActions.className = "litesnap-panel-footer";

      const ocrFailureIssue =
        liteSnapOcrIssue ??
        (!liteSnapOcrText.trim()
          ? inferLiteSnapOcrIssueFromMessage(liteSnapPanelData.statusMessage)
          : null);
      const ocrHelpSection = ocrFailureIssue
        ? createLiteSnapOcrHelpSection(ocrFailureIssue)
        : !liteSnapOcrText.trim()
          ? createLiteSnapOcrSetupGuideSection()
          : null;

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "settings-btn settings-btn-primary";
      copyButton.textContent = "复制文字";
      copyButton.addEventListener("click", () => {
        const value = ocrTextarea.value;
        void navigator.clipboard
          .writeText(value)
          .then(() => setStatus("已复制识别文字到剪贴板。"))
          .catch(() => setStatus("复制失败，请手动选择文字复制。"));
      });

      const captureAgainButton = document.createElement("button");
      captureAgainButton.type = "button";
      captureAgainButton.className = "settings-btn settings-btn-secondary";
      captureAgainButton.textContent = "重新截图识别";
      captureAgainButton.addEventListener("click", () => {
        void executeLiteSnapPanelAction("start-capture");
      });

      const footerSpacer = document.createElement("div");
      footerSpacer.className = "litesnap-panel-footer-spacer";

      const backToMainButton = document.createElement("button");
      backToMainButton.type = "button";
      backToMainButton.className = "settings-btn settings-btn-secondary";
      backToMainButton.textContent = "返回主页面";
      backToMainButton.addEventListener("click", () => {
        returnToLiteSnapMainView();
      });

      const backToSearchButton = document.createElement("button");
      backToSearchButton.type = "button";
      backToSearchButton.className = "settings-btn settings-btn-secondary";
      backToSearchButton.textContent = "返回搜索";
      backToSearchButton.addEventListener("click", () => {
        backToSearch();
      });

      ocrActions.append(
        copyButton,
        captureAgainButton,
        footerSpacer,
        backToMainButton,
        backToSearchButton
      );
      if (ocrHelpSection) {
        form.append(ocrStatusRow, ocrHelpSection, ocrField, ocrActions);
      } else {
        form.append(ocrStatusRow, ocrField, ocrActions);
      }
    } else if (liteSnapPanelView === "translate") {
      const translateStatusRow = createLiteSnapInfoRow(
        "截图翻译",
        liteSnapPanelData.statusMessage || "已翻译为中文，可编辑后复制。",
        "识别使用 Windows 本地 OCR，翻译使用百度翻译 API（英译中）；凭证请在「文本翻译」插件设置。"
      );

      const sourceField = document.createElement("div");
      sourceField.className = "settings-field litesnap-ocr-field";

      const sourceLabel = document.createElement("label");
      sourceLabel.className = "settings-field-label";
      sourceLabel.textContent = "识别原文";
      sourceLabel.htmlFor = "litesnap-translate-source";

      const sourceTextarea = document.createElement("textarea");
      sourceTextarea.id = "litesnap-translate-source";
      sourceTextarea.className = "litesnap-ocr-textarea";
      sourceTextarea.rows = 6;
      sourceTextarea.spellcheck = false;
      sourceTextarea.readOnly = true;
      sourceTextarea.value = liteSnapTranslateSourceText;
      sourceField.append(sourceLabel, sourceTextarea);

      const translateField = document.createElement("div");
      translateField.className = "settings-field litesnap-ocr-field";

      const translateLabel = document.createElement("label");
      translateLabel.className = "settings-field-label";
      translateLabel.textContent = "中文译文";
      translateLabel.htmlFor = "litesnap-translate-text";

      const translateTextarea = document.createElement("textarea");
      translateTextarea.id = "litesnap-translate-text";
      translateTextarea.className = "litesnap-ocr-textarea";
      translateTextarea.rows = 8;
      translateTextarea.spellcheck = false;
      translateTextarea.placeholder =
        liteSnapTranslateText.trim().length > 0
          ? ""
          : "正在在线翻译，请稍候…";
      translateTextarea.value = liteSnapTranslateText;
      translateTextarea.addEventListener("input", () => {
        liteSnapTranslateText = translateTextarea.value;
      });
      translateField.append(translateLabel, translateTextarea);

      const translateActions = document.createElement("div");
      translateActions.className = "litesnap-panel-footer";

      const translateHelpSection =
        liteSnapOcrIssue ??
        (!liteSnapTranslateSourceText.trim()
          ? inferLiteSnapOcrIssueFromMessage(liteSnapPanelData.statusMessage)
          : null);
      const translateOcrHelpSection = translateHelpSection
        ? createLiteSnapOcrHelpSection(translateHelpSection)
        : !liteSnapTranslateSourceText.trim() &&
            inferLiteSnapOcrIssueFromMessage(liteSnapPanelData.statusMessage)
          ? createLiteSnapOcrSetupGuideSection()
          : null;

      const copyTranslationButton = document.createElement("button");
      copyTranslationButton.type = "button";
      copyTranslationButton.className = "settings-btn settings-btn-primary";
      copyTranslationButton.textContent = "复制译文";
      copyTranslationButton.addEventListener("click", () => {
        const value = translateTextarea.value;
        void navigator.clipboard
          .writeText(value)
          .then(() => setStatus("已复制译文到剪贴板。"))
          .catch(() => setStatus("复制失败，请手动选择文字复制。"));
      });

      const captureAgainButton = document.createElement("button");
      captureAgainButton.type = "button";
      captureAgainButton.className = "settings-btn settings-btn-secondary";
      captureAgainButton.textContent = "重新截图翻译";
      captureAgainButton.addEventListener("click", () => {
        void executeLiteSnapPanelAction("start-capture");
      });

      const translateFooterSpacer = document.createElement("div");
      translateFooterSpacer.className = "litesnap-panel-footer-spacer";

      const backToMainButton = document.createElement("button");
      backToMainButton.type = "button";
      backToMainButton.className = "settings-btn settings-btn-secondary";
      backToMainButton.textContent = "返回主页面";
      backToMainButton.addEventListener("click", () => {
        returnToLiteSnapMainView();
      });

      const backToSearchButton = document.createElement("button");
      backToSearchButton.type = "button";
      backToSearchButton.className = "settings-btn settings-btn-secondary";
      backToSearchButton.textContent = "返回搜索";
      backToSearchButton.addEventListener("click", () => {
        backToSearch();
      });

      translateActions.append(
        copyTranslationButton,
        captureAgainButton,
        translateFooterSpacer,
        backToMainButton,
        backToSearchButton
      );
      if (translateOcrHelpSection) {
        form.append(
          translateStatusRow,
          translateOcrHelpSection,
          sourceField,
          translateField,
          translateActions
        );
      } else {
        form.append(
          translateStatusRow,
          sourceField,
          translateField,
          translateActions
        );
      }
    } else if (liteSnapPanelView === "settings") {
      const settingsStatusRow = createLiteSnapInfoRow(
        "设置说明",
        "修改后点击保存即可生效",
        "快捷键保存后会立即重新注册；若被占用会显示失败提示"
      );
      const shortcutStatusRow = createLiteSnapInfoRow(
        "快捷键状态",
        liteSnapPanelData.statusMessage,
        "注册失败时会保留旧的可用快捷键"
      );
      const settingsRows = [
        createLiteSnapFieldRow(
          "截图快捷键",
          createLiteSnapShortcutControl(
            "litesnap-screenshot-shortcut",
            "screenshotShortcut",
            liteSnapPanelData.settings.screenshotShortcut,
            "F1"
          ),
          "例如 F1、Ctrl+Alt+S"
        ),
        createLiteSnapFieldRow(
          "贴图快捷键",
          createLiteSnapShortcutControl(
            "litesnap-pin-shortcut",
            "pinShortcut",
            liteSnapPanelData.settings.pinShortcut,
            "F3"
          ),
          "例如 F3、Ctrl+Alt+P"
        ),
        createLiteSnapFieldRow(
          "贴图点击穿透",
          createLiteSnapShortcutControl(
            "litesnap-toggle-pin-click-through",
            "togglePinClickThroughShortcut",
            liteSnapPanelData.settings.togglePinClickThroughShortcut,
            "Ctrl+Shift+T"
          ),
          "可留空关闭；例如 Ctrl+Shift+T"
        ),
        (() => {
          const row = createLiteSnapFieldRow(
            "保存目录",
            createLiteSnapDirectoryControl(
              "litesnap-save-directory",
              "saveDirectory",
              liteSnapPanelData.settings.saveDirectory,
              "留空使用图片/LiteSnap"
            ),
            "留空时保存到系统图片目录下的 LiteSnap 文件夹"
          );
          row.classList.add("litesnap-fields-grid-item--wide");
          return row;
        })(),
        createLiteSnapFieldRow(
          "保存格式",
          createLiteSnapSelect(
            "litesnap-save-format",
            "saveFormat",
            liteSnapPanelData.settings.saveFormat,
            [
              { value: "png", label: "PNG" },
              { value: "jpg", label: "JPG" }
            ]
          )
        ),
        createLiteSnapFieldRow(
          "截图后动作",
          createLiteSnapSelect(
            "litesnap-post-capture",
            "postCaptureBehavior",
            liteSnapPanelData.settings.postCaptureBehavior,
            [
              { value: "toolbar", label: "保留工具条" },
              { value: "copy", label: "截图后直接复制" },
              { value: "save", label: "截图后直接保存" },
              { value: "pin", label: "截图后直接贴图" }
            ]
          )
        ),
        createLiteSnapFieldRow(
          "标注颜色",
          createLiteSnapTextInput(
            "litesnap-annotation-color",
            "annotationColor",
            /^#[0-9a-f]{6}$/i.test(liteSnapPanelData.settings.annotationColor)
              ? liteSnapPanelData.settings.annotationColor
              : "#ff3b30",
            "#ff3b30",
            "color"
          ),
          "点击色块选择默认标注颜色"
        ),
        createLiteSnapFieldRow(
          "默认线宽",
          createLiteSnapNumberInput(
            "litesnap-annotation-line-width",
            "annotationLineWidth",
            liteSnapPanelData.settings.annotationLineWidth,
            1,
            60
          ),
          "范围 1–60 px；截图标注会自动记住最后使用的粗细"
        ),
        createLiteSnapFieldRow(
          "文字大小",
          createLiteSnapNumberInput(
            "litesnap-annotation-text-size",
            "annotationTextSize",
            liteSnapPanelData.settings.annotationTextSize,
            8,
            72
          )
        ),
        createLiteSnapFieldRow(
          "形状填充",
          createLiteSnapCheckbox(
            "litesnap-annotation-fill",
            "annotationFillShapes",
            liteSnapPanelData.settings.annotationFillShapes
          ),
          "开启后矩形/椭圆默认填充颜色"
        ),
        createLiteSnapFieldRow(
          "启用截图历史",
          createLiteSnapCheckbox(
            "litesnap-history-enabled",
            "historyEnabled",
            liteSnapPanelData.settings.historyEnabled
          ),
          "关闭后不再写入截图历史"
        ),
        createLiteSnapFieldRow(
          "历史条数上限",
          createLiteSnapNumberInput(
            "litesnap-history-max-items",
            "historyMaxItems",
            liteSnapPanelData.settings.historyMaxItems,
            5,
            50
          ),
          "范围 5–50，超出部分会自动清理"
        )
      ];

      const ocrConfigurationNodes = buildLiteSnapOcrConfigurationSection({
        resultTextareaId: "litesnap-settings-ocr-probe-result",
        includeFailureHelp: true
      });

      const settingsActions = document.createElement("div");
      settingsActions.className = "litesnap-panel-footer";

      const saveButton = document.createElement("button");
      saveButton.type = "submit";
      saveButton.className = "settings-btn settings-btn-primary";
      saveButton.textContent = "保存设置";

      const resetShortcutsButton = document.createElement("button");
      resetShortcutsButton.type = "button";
      resetShortcutsButton.className = "settings-btn settings-btn-secondary";
      resetShortcutsButton.textContent = "恢复默认快捷键";
      resetShortcutsButton.addEventListener("click", () => {
        const screenshotInput = form.elements.namedItem("screenshotShortcut");
        const pinInput = form.elements.namedItem("pinShortcut");
        const togglePinClickThroughInput = form.elements.namedItem(
          "togglePinClickThroughShortcut"
        );
        if (screenshotInput instanceof HTMLInputElement) {
          screenshotInput.value = "F1";
        }
        if (pinInput instanceof HTMLInputElement) {
          pinInput.value = "F3";
        }
        if (togglePinClickThroughInput instanceof HTMLInputElement) {
          togglePinClickThroughInput.value = "Ctrl+Shift+T";
        }
        setStatus("已填入默认快捷键，点击保存后生效。");
      });

      const settingsFooterSpacer = document.createElement("div");
      settingsFooterSpacer.className = "litesnap-panel-footer-spacer";

      const backToMainButton = document.createElement("button");
      backToMainButton.type = "button";
      backToMainButton.className = "settings-btn settings-btn-secondary";
      backToMainButton.textContent = "返回主页面";
      backToMainButton.addEventListener("click", () => {
        returnToLiteSnapMainView();
      });

      const backToSearchButton = document.createElement("button");
      backToSearchButton.type = "button";
      backToSearchButton.className = "settings-btn settings-btn-secondary";
      backToSearchButton.textContent = "返回搜索";
      backToSearchButton.addEventListener("click", () => {
        backToSearch();
      });

      settingsActions.append(
        saveButton,
        resetShortcutsButton,
        settingsFooterSpacer,
        backToMainButton,
        backToSearchButton
      );
      form.append(
        settingsStatusRow,
        shortcutStatusRow,
        createLiteSnapFormSection(ocrConfigurationNodes),
        createLiteSnapFieldsGrid(settingsRows),
        settingsActions
      );
    } else if (liteSnapPanelView === "diagnostics") {
      const diagnosticsStatus = createLiteSnapInfoRow(
        "LiteSnap 诊断",
        `最近 ${liteSnapDiagnostics.length} 条操作记录（最多保留 20 条）`,
        "仅保存耗时、尺寸、帧数和技术状态；不保存截图、文件路径、OCR 文本或剪贴板内容。"
      );

      const diagnosticsList = document.createElement("div");
      diagnosticsList.className = "litesnap-history-list";
      if (liteSnapDiagnostics.length === 0) {
        const empty = document.createElement("div");
        empty.className = "litesnap-history-empty";
        empty.textContent = "暂无诊断记录。完成一次截图、OCR 或二次编辑后会显示在这里。";
        diagnosticsList.appendChild(empty);
      } else {
        for (const entry of liteSnapDiagnostics) {
          const row = document.createElement("article");
          row.className = "litesnap-history-row";
          const body = document.createElement("div");
          body.className = "litesnap-history-row-body";
          const titleRow = document.createElement("div");
          titleRow.className = "litesnap-history-row-top";
          const operation = document.createElement("span");
          operation.className = "litesnap-history-source";
          operation.textContent = `${entry.operation} · ${entry.status}`;
          const duration = document.createElement("span");
          duration.className = "litesnap-history-size";
          duration.textContent = `${Math.max(0, Math.round(entry.durationMs))} ms`;
          titleRow.append(operation, duration);
          const timestamp = document.createElement("div");
          timestamp.className = "litesnap-history-time";
          timestamp.textContent = formatLiteSnapHistoryTime(entry.createdAt);
          const detail = document.createElement("pre");
          detail.className = "litesnap-history-time";
          detail.style.whiteSpace = "pre-wrap";
          detail.style.margin = "6px 0 0";
          detail.textContent = formatLiteSnapDiagnostic(entry);
          body.append(titleRow, timestamp, detail);
          row.appendChild(body);
          diagnosticsList.appendChild(row);
        }
      }

      const footer = document.createElement("div");
      footer.className = "litesnap-panel-footer";
      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "settings-btn settings-btn-secondary";
      copyButton.textContent = "复制诊断";
      copyButton.addEventListener("click", () => {
        void runLiteSnapCopyDiagnostics();
      });
      const clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "settings-btn settings-btn-secondary";
      clearButton.textContent = "清空诊断";
      clearButton.disabled = liteSnapDiagnostics.length === 0;
      clearButton.addEventListener("click", () => {
        void runLiteSnapClearDiagnostics();
      });
      const spacer = document.createElement("div");
      spacer.className = "litesnap-panel-footer-spacer";
      const backButton = document.createElement("button");
      backButton.type = "button";
      backButton.className = "settings-btn settings-btn-secondary";
      backButton.textContent = "返回主页面";
      backButton.addEventListener("click", () => {
        returnToLiteSnapMainView();
      });
      const searchButton = document.createElement("button");
      searchButton.type = "button";
      searchButton.className = "settings-btn settings-btn-secondary";
      searchButton.textContent = "返回搜索";
      searchButton.addEventListener("click", () => {
        backToSearch();
      });
      footer.append(copyButton, clearButton, spacer, backButton, searchButton);
      form.append(diagnosticsStatus, diagnosticsList, footer);
    } else if (liteSnapPanelView === "history") {
      const historyHead = document.createElement("div");
      historyHead.className = "litesnap-history-head";

      const historyTitleGroup = document.createElement("div");
      historyTitleGroup.className = "litesnap-history-title-group";
      const historyTitle = document.createElement("div");
      historyTitle.className = "litesnap-history-title";
      historyTitle.textContent = "截图历史";
      const historyMeta = document.createElement("div");
      historyMeta.className = "litesnap-history-meta";
      historyMeta.textContent = liteSnapPanelData.settings.historyEnabled
        ? `最近 ${liteSnapHistoryItems.length} 条 · 最多保留 ${liteSnapPanelData.settings.historyMaxItems} 条`
        : "历史写入已关闭，仅可管理现有条目";
      historyTitleGroup.append(historyTitle, historyMeta);
      historyHead.appendChild(historyTitleGroup);

      const historyList = document.createElement("div");
      historyList.className = "litesnap-history-list";

      if (liteSnapHistoryItems.length === 0) {
        const empty = document.createElement("div");
        empty.className = "litesnap-history-empty";
        empty.textContent = "暂无截图历史。完成截图后会显示在这里。";
        historyList.appendChild(empty);
      } else {
        for (const item of liteSnapHistoryItems) {
          const row = document.createElement("article");
          row.className = "litesnap-history-row";

          const thumbWrap = document.createElement("div");
          thumbWrap.className = "litesnap-history-thumb-wrap";
          const thumbSrc = toLiteSnapFileUrl(item.thumbPath || item.filePath);
          if (thumbSrc) {
            const thumb = document.createElement("img");
            thumb.className = "litesnap-history-thumb";
            thumb.src = thumbSrc;
            thumb.alt = formatLiteSnapHistorySource(item.source);
            thumb.loading = "lazy";
            thumbWrap.appendChild(thumb);
          }

          const body = document.createElement("div");
          body.className = "litesnap-history-row-body";

          const bodyTop = document.createElement("div");
          bodyTop.className = "litesnap-history-row-top";
          const sourceBadge = document.createElement("span");
          sourceBadge.className = "litesnap-history-source";
          sourceBadge.textContent = formatLiteSnapHistorySource(item.source);
          const sizeText = document.createElement("span");
          sizeText.className = "litesnap-history-size";
          sizeText.textContent = `${item.width}×${item.height}`;
          bodyTop.append(sourceBadge, sizeText);

          const timeText = document.createElement("div");
          timeText.className = "litesnap-history-time";
          timeText.textContent = formatLiteSnapHistoryTime(item.createdAt);

          const itemActions = document.createElement("div");
          itemActions.className = "litesnap-history-row-actions";

          const copyButton = document.createElement("button");
          copyButton.type = "button";
          copyButton.className = "litesnap-history-action";
          copyButton.textContent = "复制";
          copyButton.addEventListener("click", () => {
            void runLiteSnapHistoryCopy(item.id);
          });

          const editButton = document.createElement("button");
          editButton.type = "button";
          editButton.className = "litesnap-history-action";
          editButton.textContent = "编辑";
          editButton.addEventListener("click", () => {
            void runLiteSnapHistoryEdit(item.id);
          });

          const pinButton = document.createElement("button");
          pinButton.type = "button";
          pinButton.className = "litesnap-history-action is-primary";
          pinButton.textContent = "贴图";
          pinButton.addEventListener("click", () => {
            void runLiteSnapHistoryPin(item.id);
          });

          const deleteButton = document.createElement("button");
          deleteButton.type = "button";
          deleteButton.className = "litesnap-history-action is-danger";
          deleteButton.textContent = "删除";
          deleteButton.addEventListener("click", () => {
            void runLiteSnapHistoryDelete(item.id);
          });

          itemActions.append(copyButton, editButton, pinButton, deleteButton);
          body.append(bodyTop, timeText, itemActions);
          row.append(thumbWrap, body);
          historyList.appendChild(row);
        }
      }

      const historyFooter = document.createElement("div");
      historyFooter.className = "litesnap-panel-footer";

      const clearHistoryButton = document.createElement("button");
      clearHistoryButton.type = "button";
      clearHistoryButton.className = "settings-btn settings-btn-secondary";
      clearHistoryButton.textContent = "清空历史";
      clearHistoryButton.disabled = liteSnapHistoryItems.length === 0;
      clearHistoryButton.addEventListener("click", () => {
        void runLiteSnapClearHistory();
      });

      const footerSpacer = document.createElement("div");
      footerSpacer.className = "litesnap-panel-footer-spacer";

      const backToMainButton = document.createElement("button");
      backToMainButton.type = "button";
      backToMainButton.className = "settings-btn settings-btn-secondary";
      backToMainButton.textContent = "返回主页面";
      backToMainButton.addEventListener("click", () => {
        returnToLiteSnapMainView();
      });

      const backToSearchButton = document.createElement("button");
      backToSearchButton.type = "button";
      backToSearchButton.className = "settings-btn settings-btn-secondary";
      backToSearchButton.textContent = "返回搜索";
      backToSearchButton.addEventListener("click", () => {
        backToSearch();
      });

      historyFooter.append(
        clearHistoryButton,
        footerSpacer,
        backToMainButton,
        backToSearchButton
      );
      form.append(historyHead, historyList, historyFooter);
    } else {
      const statusRow = createLiteSnapInfoRow(
        "使用提示",
        "按 F1 进入截图时，主窗口会保持可见，便于截取启动器界面。",
        "也可在设置中调整快捷键、保存目录与截图后动作"
      );
      const saveDirectory = liteSnapPanelData.settings.saveDirectory.trim();
      const settingsRows = [
        createLiteSnapInfoRow(
          "截图快捷键",
          liteSnapPanelData.settings.screenshotShortcut,
          "默认 F1"
        ),
        createLiteSnapInfoRow(
          "贴图快捷键",
          liteSnapPanelData.settings.pinShortcut,
          "默认 F3"
        ),
        createLiteSnapInfoRow(
          "保存格式",
          liteSnapPanelData.settings.saveFormat.toUpperCase(),
          saveDirectory ? `保存目录：${saveDirectory}` : "默认保存到图片/LiteSnap"
        ),
        createLiteSnapInfoRow(
          "截图后动作",
          formatLiteSnapPostCaptureBehavior(
            liteSnapPanelData.settings.postCaptureBehavior
          )
        ),
        createLiteSnapInfoRow(
          "标注预设",
          `${liteSnapPanelData.settings.annotationColor} / ${liteSnapPanelData.settings.annotationLineWidth}px / ${liteSnapPanelData.settings.annotationTextSize}px`,
          "颜色、线宽、字号和填充会自动记住；框选后恢复上次标注工具"
        )
      ];

      const mainOcrNodes = buildLiteSnapOcrConfigurationSection({
        resultTextareaId: "litesnap-main-ocr-probe-result",
        includeFailureHelp: true
      });

      const primaryActions = document.createElement("div");
      primaryActions.className = "litesnap-action-row litesnap-action-row--primary";

      const captureButton = document.createElement("button");
      captureButton.type = "submit";
      captureButton.className = "settings-btn settings-btn-primary";
      captureButton.textContent = `开始截图 (${liteSnapPanelData.settings.screenshotShortcut})`;

      const pinButton = document.createElement("button");
      pinButton.type = "button";
      pinButton.className = "settings-btn settings-btn-secondary";
      pinButton.textContent = `贴图 (${liteSnapPanelData.settings.pinShortcut})`;
      pinButton.addEventListener("click", () => {
        void executeLiteSnapPanelAction("pin-from-clipboard");
      });

      const colorButton = document.createElement("button");
      colorButton.type = "button";
      colorButton.className = "settings-btn settings-btn-secondary";
      colorButton.textContent = "取色";
      colorButton.addEventListener("click", () => {
        void executeLiteSnapPanelAction("start-color-capture");
      });

      primaryActions.append(captureButton, pinButton, colorButton);

      const secondaryActions = document.createElement("div");
      secondaryActions.className =
        "litesnap-action-row litesnap-action-row--secondary";

      const historyButton = document.createElement("button");
      historyButton.type = "button";
      historyButton.className = "settings-btn settings-btn-secondary";
      historyButton.textContent = "截图历史";
      historyButton.addEventListener("click", () => {
        void executeLiteSnapPanelAction("open-history");
      });

      const diagnosticsButton = document.createElement("button");
      diagnosticsButton.type = "button";
      diagnosticsButton.className = "settings-btn settings-btn-secondary";
      diagnosticsButton.textContent = "性能诊断";
      diagnosticsButton.addEventListener("click", () => {
        void executeLiteSnapPanelAction("open-diagnostics");
      });

      const togglePinsButton = document.createElement("button");
      togglePinsButton.type = "button";
      togglePinsButton.className = "settings-btn settings-btn-secondary";
      togglePinsButton.textContent = "隐藏/显示贴图";
      togglePinsButton.addEventListener("click", () => {
        void executeLiteSnapPanelAction("toggle-pinned-windows");
      });

      const closeAllPinsButton = document.createElement("button");
      closeAllPinsButton.type = "button";
      closeAllPinsButton.className = "settings-btn settings-btn-secondary";
      closeAllPinsButton.textContent = "关闭全部贴图";
      closeAllPinsButton.addEventListener("click", () => {
        void executeLiteSnapPanelAction("close-all-pinned-windows");
      });

      secondaryActions.append(
        historyButton,
        diagnosticsButton,
        togglePinsButton,
        closeAllPinsButton
      );

      const footer = document.createElement("div");
      footer.className = "litesnap-panel-footer";

      const settingsButton = document.createElement("button");
      settingsButton.type = "button";
      settingsButton.className = "settings-btn settings-btn-secondary";
      settingsButton.textContent = "打开设置";
      settingsButton.addEventListener("click", () => {
        openLiteSnapSettingsView();
      });

      const footerSpacer = document.createElement("div");
      footerSpacer.className = "litesnap-panel-footer-spacer";

      const backButton = document.createElement("button");
      backButton.type = "button";
      backButton.className = "settings-btn settings-btn-secondary";
      backButton.textContent = "返回搜索";
      backButton.addEventListener("click", () => {
        backToSearch();
      });

      footer.append(settingsButton, footerSpacer, backButton);
      form.append(
        statusRow,
        createLiteSnapFormSection(mainOcrNodes),
        createLiteSnapFieldsGrid(settingsRows),
        primaryActions,
        secondaryActions,
        footer
      );
    }

    panel.append(title, description, form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);
  },

  applyWebtoolsFileHashPanelPayload(panel: ActivePluginPanelState): void {
    const data = toRecord(panel.data);
    if (!data) {
      return;
    }

    webtoolsFileHashOutput = "";
    webtoolsFileHashInfo = "";
    webtoolsFileHashError = "";
    webtoolsFileHashSize = "";
    webtoolsFileHashMatched = null;

    if (typeof data.filePath === "string") {
      webtoolsFileHashFilePath = data.filePath;
    }
    if (typeof data.algorithm === "string") {
      webtoolsFileHashAlgorithm = normalizeWebtoolsFileHashAlgorithm(data.algorithm);
    }
    if (typeof data.expectedHash === "string") {
      webtoolsFileHashExpectedHash = data.expectedHash;
    }
    if (typeof data.hash === "string") {
      webtoolsFileHashOutput = data.hash;
    }
    if (typeof data.matched === "boolean") {
      webtoolsFileHashMatched = data.matched;
    } else {
      webtoolsFileHashMatched = null;
    }
    if (typeof data.size === "number" && Number.isFinite(data.size) && data.size >= 0) {
      webtoolsFileHashSize = formatHardwareInspectorBytes(data.size);
    }
    if (typeof data.info === "string") {
      webtoolsFileHashInfo = data.info;
    }
  },

  renderWebtoolsFileHashPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-file-hash-form webtools-tool-panel";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsFileHashCalculate(form);
    });

    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "文件哈希";

    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle || "计算文件 MD5 / SHA1 / SHA256 / SHA512 并可校验期望值";

    const pathRow = document.createElement("div");
    pathRow.className = "settings-row webtools-row-full";
    const pathLabel = document.createElement("span");
    pathLabel.className = "settings-row-label";
    pathLabel.textContent = "文件路径";
    const pathInput = document.createElement("input");
    pathInput.className = "settings-value webtools-tool-input webtools-tool-code";
    pathInput.name = "webtoolsFileHashPath";
    pathInput.type = "text";
    pathInput.placeholder = "例如：C:\\\\Users\\\\me\\\\Downloads\\\\file.zip";
    pathInput.addEventListener("input", () => {
      webtoolsFileHashFilePath = pathInput.value;
    });
    const pickButton = document.createElement("button");
    pickButton.type = "button";
    pickButton.className = "settings-btn settings-btn-secondary";
    pickButton.textContent = "选择文件";
    pickButton.addEventListener("click", () => {
      const launcher = getLauncherApi();
      if (!launcher?.pickFilePath) {
        setStatus("当前版本不支持系统文件选择，请手动粘贴文件路径");
        return;
      }

      beginPluginNativeInteraction(20000);
      void launcher
        .pickFilePath()
        .then((selectedPath) => {
          if (typeof selectedPath === "string" && selectedPath.trim()) {
            webtoolsFileHashFilePath = selectedPath.trim();
            webtoolsFileHashError = "";
            webtoolsFileHashInfo = "已选择文件，点击“计算哈希”开始";
          }
        })
        .catch(() => {
          setStatus("打开文件选择器失败");
        })
        .finally(() => {
          schedulePluginNativeInteractionRelease(260);
          refreshWebtoolsFileHashPanelInForm(form);
        });
    });
    pathRow.append(pathLabel, pathInput, pickButton);

    const configRow = document.createElement("div");
    configRow.className = "webtools-tool-bar";

    const algorithmWrap = document.createElement("label");
    algorithmWrap.className = "webtools-tool-bar-group";
    const algorithmLabel = document.createElement("span");
    algorithmLabel.className = "webtools-tool-bar-label";
    algorithmLabel.textContent = "算法";
    const algorithmSelect = document.createElement("select");
    algorithmSelect.className = "settings-number webtools-tool-select";
    algorithmSelect.name = "webtoolsFileHashAlgorithm";
    ["md5", "sha1", "sha256", "sha512"].forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value.toUpperCase();
      algorithmSelect.appendChild(option);
    });
    algorithmSelect.addEventListener("change", () => {
      webtoolsFileHashAlgorithm = normalizeWebtoolsFileHashAlgorithm(algorithmSelect.value);
    });
    algorithmWrap.append(algorithmLabel, algorithmSelect);

    const expectedWrap = document.createElement("label");
    expectedWrap.className = "webtools-tool-bar-group webtools-file-hash-expected-group";
    const expectedLabel = document.createElement("span");
    expectedLabel.className = "webtools-tool-bar-label";
    expectedLabel.textContent = "期望哈希（可选）";
    const expectedInput = document.createElement("input");
    expectedInput.className = "settings-value webtools-tool-input webtools-tool-code";
    expectedInput.name = "webtoolsFileHashExpected";
    expectedInput.type = "text";
    expectedInput.placeholder = "粘贴用于对比的哈希值";
    expectedInput.addEventListener("input", () => {
      webtoolsFileHashExpectedHash = expectedInput.value;
    });
    expectedWrap.append(expectedLabel, expectedInput);

    configRow.append(algorithmWrap, expectedWrap);

    const outputWrap = document.createElement("label");
    outputWrap.className = "webtools-tool-pane";
    const outputHead = document.createElement("div");
    outputHead.className = "webtools-tool-pane-head";
    const outputTitle = document.createElement("span");
    outputTitle.className = "webtools-tool-pane-title";
    outputTitle.textContent = "哈希结果";
    const fileInfo = document.createElement("span");
    fileInfo.className = "webtools-tool-pane-meta webtools-file-hash-size webtools-tool-code";
    outputHead.append(outputTitle, fileInfo);
    const outputText = document.createElement("textarea");
    outputText.className = "settings-value webtools-textarea webtools-tool-code webtools-file-hash-output";
    outputText.name = "webtoolsFileHashOutput";
    outputText.readOnly = true;
    outputText.spellcheck = false;
    outputWrap.append(outputHead, outputText);

    const verifyLine = document.createElement("div");
    verifyLine.className = "webtools-tool-info webtools-file-hash-verify";

    const infoLine = document.createElement("div");
    infoLine.className = "webtools-tool-info webtools-file-hash-info";

    const actions = document.createElement("div");
    actions.className = "settings-actions";

    const calculateButton = document.createElement("button");
    calculateButton.type = "submit";
    calculateButton.className = "settings-btn settings-btn-primary";
    calculateButton.textContent = "计算哈希";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "settings-btn settings-btn-secondary";
    copyButton.textContent = "复制结果";
    copyButton.addEventListener("click", () => {
      if (!webtoolsFileHashOutput.trim()) {
        setStatus("暂无可复制的哈希结果");
        return;
      }
      void (async () => {
        const copied = await copyTextToClipboard(webtoolsFileHashOutput);
        setStatus(copied ? "已复制哈希结果" : "复制失败");
      })();
    });

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "settings-btn settings-btn-secondary";
    clearButton.textContent = "清空";
    clearButton.addEventListener("click", () => {
      webtoolsFileHashFilePath = "";
      webtoolsFileHashExpectedHash = "";
      webtoolsFileHashOutput = "";
      webtoolsFileHashInfo = "";
      webtoolsFileHashError = "";
      webtoolsFileHashSize = "";
      webtoolsFileHashMatched = null;
      refreshWebtoolsFileHashPanelInForm(form);
      setStatus("已清空文件哈希输入");
    });

    actions.append(calculateButton, copyButton, clearButton);

    form.append(
      title,
      description,
      pathRow,
      configRow,
      outputWrap,
      verifyLine,
      infoLine,
      actions
    );
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsFileHashPanelInForm(form);
  },

  applyWebtoolsPortHelperPanelPayload(panel: ActivePluginPanelState): void {
    const data = toRecord(panel.data);
    if (!data) {
      return;
    }

    webtoolsPortHelperRecords = [];
    webtoolsPortHelperError = "";

    if (typeof data.port === "number" && Number.isFinite(data.port)) {
      webtoolsPortHelperPort = String(Math.floor(data.port));
    } else if (typeof data.port === "string" && data.port.trim()) {
      webtoolsPortHelperPort = data.port.trim();
    }
    if (typeof data.protocol === "string") {
      webtoolsPortHelperProtocol = normalizeWebtoolsPortHelperProtocol(data.protocol);
    }
    if (typeof data.pid === "number" && Number.isFinite(data.pid) && data.pid > 0) {
      webtoolsPortHelperPid = String(Math.floor(data.pid));
    } else if (typeof data.pid === "string" && data.pid.trim()) {
      webtoolsPortHelperPid = data.pid.trim();
    }
    if (Array.isArray(data.records)) {
      webtoolsPortHelperRecords = parseWebtoolsPortHelperRecords(data.records);
    }
    if (typeof data.info === "string") {
      webtoolsPortHelperInfo = data.info;
    } else if (panel.message) {
      webtoolsPortHelperInfo = panel.message;
    }
  },

  renderWebtoolsPortHelperPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-port-helper-form webtools-tool-panel";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsPortHelperAction("query", form);
    });

    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "端口助手";

    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle || "查看端口占用、定位进程并支持结束占用进程";

    const controls = document.createElement("div");
    controls.className = "webtools-tool-bar webtools-port-helper-controls";

    const portWrap = document.createElement("label");
    portWrap.className = "webtools-tool-bar-group";
    const portLabel = document.createElement("span");
    portLabel.className = "webtools-tool-bar-label";
    portLabel.textContent = "端口";
    const portInput = document.createElement("input");
    portInput.className = "settings-value webtools-tool-input";
    portInput.type = "number";
    portInput.name = "webtoolsPortHelperPort";
    portInput.min = "1";
    portInput.max = "65535";
    portInput.placeholder = "例如 3000（留空=全部）";
    portInput.addEventListener("input", () => {
      webtoolsPortHelperPort = portInput.value;
    });
    portWrap.append(portLabel, portInput);

    const protocolWrap = document.createElement("label");
    protocolWrap.className = "webtools-tool-bar-group";
    const protocolLabel = document.createElement("span");
    protocolLabel.className = "webtools-tool-bar-label";
    protocolLabel.textContent = "协议";
    const protocolSelect = document.createElement("select");
    protocolSelect.className = "settings-number webtools-tool-select";
    protocolSelect.name = "webtoolsPortHelperProtocol";
    [
      { value: "all", label: "TCP + UDP" },
      { value: "tcp", label: "TCP" },
      { value: "udp", label: "UDP" }
    ].forEach((item) => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      protocolSelect.appendChild(option);
    });
    protocolSelect.addEventListener("change", () => {
      webtoolsPortHelperProtocol = normalizeWebtoolsPortHelperProtocol(protocolSelect.value);
    });
    protocolWrap.append(protocolLabel, protocolSelect);

    const pidWrap = document.createElement("label");
    pidWrap.className = "webtools-tool-bar-group";
    const pidLabel = document.createElement("span");
    pidLabel.className = "webtools-tool-bar-label";
    pidLabel.textContent = "PID（可选）";
    const pidInput = document.createElement("input");
    pidInput.className = "settings-value webtools-tool-input";
    pidInput.type = "number";
    pidInput.min = "1";
    pidInput.name = "webtoolsPortHelperPid";
    pidInput.placeholder = "可单独查询/结束进程";
    pidInput.addEventListener("input", () => {
      webtoolsPortHelperPid = pidInput.value;
    });
    pidWrap.append(pidLabel, pidInput);

    controls.append(portWrap, protocolWrap, pidWrap);

    const actions = document.createElement("div");
    actions.className = "settings-actions";

    const queryButton = document.createElement("button");
    queryButton.type = "submit";
    queryButton.className = "settings-btn settings-btn-primary";
    queryButton.setAttribute("data-webtools-port-query", "1");
    queryButton.textContent = "查询占用";

    const killButton = document.createElement("button");
    killButton.type = "button";
    killButton.className = "settings-btn settings-btn-secondary";
    killButton.setAttribute("data-webtools-port-kill", "1");
    killButton.textContent = "结束进程";
    killButton.addEventListener("click", () => {
      void executeWebtoolsPortHelperAction("kill", form);
    });

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "settings-btn settings-btn-secondary";
    clearButton.textContent = "清空";
    clearButton.addEventListener("click", () => {
      webtoolsPortHelperPort = "";
      webtoolsPortHelperProtocol = "all";
      webtoolsPortHelperPid = "";
      webtoolsPortHelperRecords = [];
      webtoolsPortHelperInfo = "";
      webtoolsPortHelperError = "";
      refreshWebtoolsPortHelperPanelInForm(form);
      setStatus("已清空端口助手输入");
    });

    actions.append(queryButton, killButton, clearButton);

    const info = document.createElement("div");
    info.className = "webtools-tool-info webtools-port-helper-info";

    const records = document.createElement("div");
    records.className = "webtools-port-helper-results";

    form.append(title, description, controls, actions, info, records);
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsPortHelperPanelInForm(form);
  },

  applyWebtoolsPasswordPanelPayload(panel: ActivePluginPanelState): void {
    const optionsRaw = panel.data?.options;
    const parsed = extractWebtoolsPasswordOptionsFromUnknown(optionsRaw);
    webtoolsPasswordOptions = normalizeWebtoolsPasswordOptions(
      parsed,
      webtoolsPasswordOptions
    );
    webtoolsPasswordRows = [];
  },

  renderWebtoolsPasswordPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel settings-panel-structured";

    const form = document.createElement("form");
    form.className =
      "settings-form settings-form-grouped webtools-password-form webtools-password-lab";

    const panelTitle = activePluginPanel?.title || "随机密码";
    const panelSubtitle =
      activePluginPanel?.subtitle || "按场景切换预设，再微调字符池、长度和批量数量。";
    const lengthOptions = [
      { value: 6, label: "6 位 · PIN / 验证码" },
      { value: 8, label: "8 位 · 低强度" },
      { value: 12, label: "12 位 · 日常登录" },
      { value: 16, label: "16 位 · 高强度" },
      { value: 20, label: "20 位 · 更稳妥" },
      { value: 24, label: "24 位 · Token / 密钥" },
      { value: 32, label: "32 位 · 极高强度" },
      { value: 64, label: "64 位 · 长串密钥" }
    ];
    const countOptions = [
      { value: 1, label: "1 条" },
      { value: 5, label: "5 条" },
      { value: 10, label: "10 条" },
      { value: 20, label: "20 条" },
      { value: 50, label: "50 条" }
    ];
    const quickLengthValues = [8, 12, 16, 20, 24, 32, 64];
    const symbolPresets = [
      { label: "常用", value: "!@#$%^&*" },
      { label: "兼容", value: "-_+=." },
      { label: "严格", value: "!#$%&*+-=?@" },
      { label: "扩展", value: "-_!@#$%^&*+=" }
    ];
    const passwordPresets = [
      {
        id: "daily-login",
        label: "日常登录",
        description: "账号",
        usage: "适合常规网站账号，兼顾强度和手动输入体验。",
        options: {
          length: 12,
          count: 5,
          includeLowercase: true,
          includeUppercase: true,
          includeDigits: true,
          includeSymbols: false,
          symbolChars: WEBTOOLS_PASSWORD_DEFAULT_SYMBOLS,
          excludeSimilar: true
        }
      },
      {
        id: "secure-admin",
        label: "后台",
        description: "强安全",
        usage: "优先安全性，适合不常手动输入的重要账号。",
        options: {
          length: 20,
          count: 10,
          includeLowercase: true,
          includeUppercase: true,
          includeDigits: true,
          includeSymbols: true,
          symbolChars: "!@#$%^&*",
          excludeSimilar: true
        }
      },
      {
        id: "numeric-pin",
        label: "数字 PIN",
        description: "短码",
        usage: "只保留数字，适合键盘或遥控器输入场景。",
        options: {
          length: 6,
          count: 10,
          includeLowercase: false,
          includeUppercase: false,
          includeDigits: true,
          includeSymbols: false,
          symbolChars: WEBTOOLS_PASSWORD_DEFAULT_SYMBOLS,
          excludeSimilar: true
        }
      },
      {
        id: "dev-token",
        label: "开发密钥",
        description: "Token",
        usage: "长度更长，适合 API Token、临时环境密钥一类场景。",
        options: {
          length: 24,
          count: 5,
          includeLowercase: true,
          includeUppercase: true,
          includeDigits: true,
          includeSymbols: true,
          symbolChars: "-_!@#$%^&*+=",
          excludeSimilar: false
        }
      },
      {
        id: "readable",
        label: "易读",
        description: "人工录入",
        usage: "排除相似字符且不用符号，适合需要口述或手输的场景。",
        options: {
          length: 14,
          count: 5,
          includeLowercase: true,
          includeUppercase: true,
          includeDigits: true,
          includeSymbols: false,
          symbolChars: WEBTOOLS_PASSWORD_DEFAULT_SYMBOLS,
          excludeSimilar: true
        }
      },
      {
        id: "wifi",
        label: "Wi-Fi",
        description: "路由器",
        usage: "适合 Wi-Fi、共享设备和家庭网络密码。",
        options: {
          length: 16,
          count: 5,
          includeLowercase: true,
          includeUppercase: true,
          includeDigits: true,
          includeSymbols: true,
          symbolChars: "-_+=.",
          excludeSimilar: true
        }
      },
      {
        id: "temporary",
        label: "临时",
        description: "一次性",
        usage: "适合短期共享、测试账号和低风险临时登录。",
        options: {
          length: 10,
          count: 10,
          includeLowercase: true,
          includeUppercase: true,
          includeDigits: true,
          includeSymbols: false,
          symbolChars: WEBTOOLS_PASSWORD_DEFAULT_SYMBOLS,
          excludeSimilar: true
        }
      },
      {
        id: "archive",
        label: "长期",
        description: "保险箱",
        usage: "适合长期保存的核心账号、密钥库和保险箱记录。",
        options: {
          length: 32,
          count: 5,
          includeLowercase: true,
          includeUppercase: true,
          includeDigits: true,
          includeSymbols: true,
          symbolChars: "!#$%&*+-=?@",
          excludeSimilar: true
        }
      }
    ].map((preset) => ({
      ...preset,
      options: normalizeWebtoolsPasswordOptions(preset.options, webtoolsPasswordOptions)
    }));

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void (async () => {
        await generateFromWebtoolsPasswordPanel(form, { render: false });
        syncPasswordWorkbench();
      })();
    });
    form.addEventListener("webtools-password-sync", () => {
      syncPasswordWorkbench();
    });

    const syncSelectOptions = (
      select: HTMLSelectElement,
      options: Array<{ value: number; label: string }>,
      selectedValue: number,
      fallbackLabel: (value: number) => string
    ): void => {
      select.replaceChildren();
      options.forEach((entry) => {
        const option = document.createElement("option");
        option.value = String(entry.value);
        option.textContent = entry.label;
        option.selected = entry.value === selectedValue;
        select.appendChild(option);
      });
      if (options.every((entry) => entry.value !== selectedValue)) {
        const fallback = document.createElement("option");
        fallback.value = String(selectedValue);
        fallback.textContent = fallbackLabel(selectedValue);
        fallback.selected = true;
        select.appendChild(fallback);
      }
      select.value = String(selectedValue);
    };

    const createChip = (text: string, tone: "" | "accent" | "warning" = ""): HTMLSpanElement => {
      const chip = document.createElement("span");
      chip.className = "webtools-password-chip";
      if (tone) {
        chip.dataset.tone = tone;
      }
      chip.textContent = text;
      return chip;
    };

    const createCardHead = (titleText: string, subtitleText: string): HTMLDivElement => {
      const head = document.createElement("div");
      head.className = "webtools-password-card-head";

      const title = document.createElement("div");
      title.className = "webtools-password-card-title";
      title.textContent = titleText;

      const subtitle = document.createElement("div");
      subtitle.className = "webtools-password-card-subtitle";
      subtitle.textContent = subtitleText;

      head.append(title, subtitle);
      return head;
    };

    const createBlock = (
      titleText: string,
      subtitleText: string
    ): { block: HTMLDivElement; body: HTMLDivElement } => {
      const block = document.createElement("div");
      block.className = "webtools-password-block";

      const head = document.createElement("div");
      head.className = "webtools-password-block-head";

      const title = document.createElement("div");
      title.className = "webtools-password-block-title";
      title.textContent = titleText;

      const subtitle = document.createElement("div");
      subtitle.className = "webtools-password-block-subtitle";
      subtitle.textContent = subtitleText;

      const body = document.createElement("div");
      body.className = "webtools-password-block-body";

      head.append(title, subtitle);
      block.append(head, body);
      return { block, body };
    };

    const createFlagCard = (
      inputName: string,
      labelText: string,
      metaText: string,
      checked: boolean
    ): { wrap: HTMLLabelElement; input: HTMLInputElement } => {
      const wrap = document.createElement("label");
      wrap.className = "webtools-password-flag webtools-password-flag-card";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = inputName;
      input.className = "password-checkbox";
      input.checked = checked;

      const copy = document.createElement("span");
      copy.className = "webtools-password-flag-copy";

      const title = document.createElement("strong");
      title.textContent = labelText;

      const meta = document.createElement("small");
      meta.textContent = metaText;

      copy.append(title, meta);
      wrap.append(input, copy);
      return { wrap, input };
    };

    const getPasswordPoolSize = (options: WebtoolsPasswordOptions): number => {
      let size = 0;
      if (options.includeLowercase) {
        size += 26;
      }
      if (options.includeUppercase) {
        size += 26;
      }
      if (options.includeDigits) {
        size += 10;
      }
      if (options.includeSymbols) {
        size += Math.max(1, new Set(options.symbolChars.split("")).size);
      }
      return size;
    };

    const getStrengthMeta = (
      entropy: number
    ): {
      label: WebtoolsPasswordResultRow["strength"];
      toneClass:
        | "webtools-password-strength-weak"
        | "webtools-password-strength-medium"
        | "webtools-password-strength-strong"
        | "webtools-password-strength-very-strong";
      description: string;
    } => {
      if (entropy < 45) {
        return {
          label: "弱",
          toneClass: "webtools-password-strength-weak",
          description: "更适合临时用途，重要账号建议继续加长或增加字符类型。"
        };
      }
      if (entropy < 65) {
        return {
          label: "中",
          toneClass: "webtools-password-strength-medium",
          description: "适合一般登录场景，再加长度会更稳。"
        };
      }
      if (entropy < 90) {
        return {
          label: "强",
          toneClass: "webtools-password-strength-strong",
          description: "已经足够稳妥，适合后台、工作账号等核心场景。"
        };
      }
      return {
        label: "很强",
        toneClass: "webtools-password-strength-very-strong",
        description: "更适合高敏感账号、长期凭证和开发密钥。"
      };
    };

    const findMatchingPreset = (
      options: WebtoolsPasswordOptions
    ): (typeof passwordPresets)[number] | undefined =>
      passwordPresets.find((preset) => {
        const presetOptions = preset.options;
        return (
          presetOptions.length === options.length &&
          presetOptions.count === options.count &&
          presetOptions.includeLowercase === options.includeLowercase &&
          presetOptions.includeUppercase === options.includeUppercase &&
          presetOptions.includeDigits === options.includeDigits &&
          presetOptions.includeSymbols === options.includeSymbols &&
          presetOptions.excludeSimilar === options.excludeSimilar &&
          (!options.includeSymbols || presetOptions.symbolChars === options.symbolChars)
        );
      });

    const hero = document.createElement("div");
    hero.className = "webtools-password-hero";
    const heroCopy = document.createElement("div");
    heroCopy.className = "webtools-password-hero-copy";
    const heroTitle = document.createElement("h3");
    heroTitle.className = "webtools-password-hero-title";
    heroTitle.textContent = panelTitle;
    const heroSubtitle = document.createElement("p");
    heroSubtitle.className = "webtools-password-hero-subtitle";
    heroSubtitle.textContent = panelSubtitle;
    const heroBadges = document.createElement("div");
    heroBadges.className = "webtools-password-hero-badges";
    heroCopy.append(heroTitle, heroSubtitle);
    hero.append(heroCopy, heroBadges);

    const workbench = document.createElement("div");
    workbench.className = "webtools-password-workbench";

    const configCard = document.createElement("section");
    configCard.className =
      "settings-group webtools-password-card webtools-password-config-card webtools-password-command-deck";
    configCard.appendChild(createCardHead("生成配置", "预设、字符、长度、数量集中操作。"));

    const presetStrip = document.createElement("div");
    presetStrip.className = "webtools-password-preset-strip";
    const presetStripCopy = document.createElement("div");
    presetStripCopy.className = "webtools-password-strip-copy";
    const presetStripLabel = document.createElement("div");
    presetStripLabel.className = "webtools-password-strip-label";
    presetStripLabel.textContent = "快捷预设";
    const presetStripHint = document.createElement("div");
    presetStripHint.className = "webtools-password-strip-hint";
    presetStripHint.textContent = "按场景切换组合。";
    presetStripCopy.append(presetStripLabel, presetStripHint);
    const presetGrid = document.createElement("div");
    presetGrid.className = "webtools-password-preset-grid";
    const presetButtons: HTMLButtonElement[] = [];
    passwordPresets.forEach((preset) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "webtools-password-preset";
      button.dataset.presetId = preset.id;
      button.title = preset.usage;

      const title = document.createElement("strong");
      title.textContent = preset.label;
      button.appendChild(title);
      button.addEventListener("click", () => {
        applyOptionsToForm(preset.options);
        syncPasswordWorkbench();
        setStatus(`已切换到 ${preset.label}`);
      });
      presetButtons.push(button);
      presetGrid.appendChild(button);
    });
    presetStrip.append(presetStripCopy, presetGrid);

    const controlsGrid = document.createElement("div");
    controlsGrid.className =
      "webtools-password-control-grid webtools-password-control-matrix";

    const charsBlockNodes = createBlock("字符池", "勾选参与生成的字符类型。");
    const charsWrap = document.createElement("div");
    charsWrap.className = "webtools-password-flags webtools-password-flag-grid";

    const lowerNodes = createFlagCard(
      "webtoolsLowercase",
      "小写字母",
      "a-z",
      webtoolsPasswordOptions.includeLowercase
    );
    const lowerInput = lowerNodes.input;
    const upperNodes = createFlagCard(
      "webtoolsUppercase",
      "大写字母",
      "A-Z",
      webtoolsPasswordOptions.includeUppercase
    );
    const upperInput = upperNodes.input;
    const digitsNodes = createFlagCard(
      "webtoolsDigits",
      "数字",
      "0-9",
      webtoolsPasswordOptions.includeDigits
    );
    const digitsInput = digitsNodes.input;

    charsWrap.append(lowerNodes.wrap, upperNodes.wrap, digitsNodes.wrap);
    charsBlockNodes.body.appendChild(charsWrap);

    const symbolsBlockNodes = createBlock("符号与容错", "符号集可一键切换。");
    const symbolsWrap = document.createElement("div");
    symbolsWrap.className = "webtools-password-symbols webtools-password-symbol-stack";

    const includeSymbolsNodes = createFlagCard(
      "webtoolsSymbols",
      "特殊字符",
      "提升复杂度",
      webtoolsPasswordOptions.includeSymbols
    );
    includeSymbolsNodes.wrap.classList.add("webtools-password-symbol-toggle");
    const includeSymbolsInput = includeSymbolsNodes.input;

    const symbolsInput = document.createElement("input");
    symbolsInput.className = "settings-value webtools-password-symbol-input";
    symbolsInput.type = "text";
    symbolsInput.name = "webtoolsSymbolChars";
    symbolsInput.value = webtoolsPasswordOptions.symbolChars;
    symbolsInput.placeholder = "!@#$%^&*";

    const symbolsField = document.createElement("label");
    symbolsField.className = "webtools-password-input-field";
    symbolsField.classList.add("webtools-password-symbol-field");
    const symbolsFieldLabel = document.createElement("span");
    symbolsFieldLabel.className = "webtools-password-field-label";
    symbolsFieldLabel.textContent = "符号集合";
    symbolsField.append(symbolsFieldLabel, symbolsInput);

    const symbolQuickGrid = document.createElement("div");
    symbolQuickGrid.className = "webtools-password-quick-grid webtools-password-symbol-quick";
    const symbolQuickButtons: HTMLButtonElement[] = [];
    symbolPresets.forEach((preset) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "webtools-password-mini-btn";
      button.textContent = preset.label;
      button.title = preset.value;
      button.addEventListener("click", () => {
        includeSymbolsInput.checked = true;
        symbolsInput.value = preset.value;
        syncPasswordWorkbench();
        setStatus(`已套用${preset.label}符号集`);
      });
      symbolQuickButtons.push(button);
      symbolQuickGrid.appendChild(button);
    });

    const excludeSimilarNodes = createFlagCard(
      "webtoolsExcludeSimilar",
      "排除相似字符",
      "避免 0/O、1/l 混淆",
      webtoolsPasswordOptions.excludeSimilar
    );
    excludeSimilarNodes.wrap.classList.add("webtools-password-similar-toggle");
    const excludeSimilarInput = excludeSimilarNodes.input;

    symbolsWrap.append(includeSymbolsNodes.wrap, symbolsField, symbolQuickGrid, excludeSimilarNodes.wrap);
    symbolsBlockNodes.body.appendChild(symbolsWrap);

    const sizingBlockNodes = createBlock(
      "长度与批量",
      "长度和批量都在同一个区块内快速调整。"
    );
    const sizingGrid = document.createElement("div");
    sizingGrid.className = "webtools-password-sizing-grid";

    const lengthField = document.createElement("label");
    lengthField.className = "webtools-password-field";
    const lengthLabel = document.createElement("span");
    lengthLabel.className = "webtools-password-field-label";
    lengthLabel.textContent = "密码长度";
    const lengthInput = document.createElement("select");
    lengthInput.className = "settings-number webtools-password-length-select";
    lengthInput.name = "webtoolsLength";
    const lengthHint = document.createElement("span");
    lengthHint.className = "webtools-password-field-hint webtools-password-safe-hint";
    lengthField.append(lengthLabel, lengthInput, lengthHint);

    const quickLengthGrid = document.createElement("div");
    quickLengthGrid.className = "webtools-password-quick-grid webtools-password-length-quick";
    const quickLengthButtons: HTMLButtonElement[] = [];
    quickLengthValues.forEach((value) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "webtools-password-mini-btn";
      button.textContent = String(value);
      button.addEventListener("click", () => {
        syncSelectOptions(
          lengthInput,
          lengthOptions,
          value,
          (customValue) => `${customValue} 位 · 自定义`
        );
        syncPasswordWorkbench();
      });
      quickLengthButtons.push(button);
      quickLengthGrid.appendChild(button);
    });

    const countField = document.createElement("label");
    countField.className = "webtools-password-field";
    const countLabel = document.createElement("span");
    countLabel.className = "webtools-password-field-label";
    countLabel.textContent = "生成数量";
    const countInput = document.createElement("select");
    countInput.className = "settings-number webtools-password-count-select";
    countInput.name = "webtoolsCount";
    const countHint = document.createElement("span");
    countHint.className = "webtools-password-field-hint";
    countField.append(countLabel, countInput, countHint);
    const lengthStack = document.createElement("div");
    lengthStack.className = "webtools-password-field-stack";
    lengthStack.append(lengthField, quickLengthGrid);
    sizingGrid.append(lengthStack, countField);
    sizingBlockNodes.body.appendChild(sizingGrid);
    controlsGrid.append(charsBlockNodes.block, symbolsBlockNodes.block, sizingBlockNodes.block);

    const actionRow = document.createElement("div");
    actionRow.className =
      "webtools-password-action-row webtools-password-action-rail";

    const generateButton = document.createElement("button");
    generateButton.type = "submit";
    generateButton.className = "settings-btn settings-btn-primary webtools-password-generate-btn";
    generateButton.textContent = "生成密码";
    actionRow.appendChild(generateButton);

    const generateCopyButton = document.createElement("button");
    generateCopyButton.type = "button";
    generateCopyButton.className =
      "settings-btn settings-btn-primary webtools-password-generate-copy-btn";
    generateCopyButton.textContent = "生成并复制";
    generateCopyButton.addEventListener("click", () => {
      void (async () => {
        await generateFromWebtoolsPasswordPanel(form, { render: false });
        syncPasswordWorkbench();
        const firstPassword = webtoolsPasswordRows[0]?.password;
        if (!firstPassword) {
          return;
        }
        const copied = await copyTextToClipboard(firstPassword);
        setStatus(copied ? "已生成并复制首条密码" : "密码已生成，复制失败");
      })();
    });
    actionRow.appendChild(generateCopyButton);

    const copyFirstButton = document.createElement("button");
    copyFirstButton.type = "button";
    copyFirstButton.className =
      "settings-btn settings-btn-secondary webtools-password-copy-first-btn";
    copyFirstButton.textContent = "复制首条";
    copyFirstButton.addEventListener("click", () => {
      const firstPassword = webtoolsPasswordRows[0]?.password;
      if (!firstPassword) {
        setStatus("还没有可复制的密码");
        return;
      }
      void (async () => {
        const copied = await copyTextToClipboard(firstPassword);
        setStatus(copied ? "已复制首条密码" : "复制失败");
      })();
    });
    actionRow.appendChild(copyFirstButton);

    const toolbarRow = document.createElement("div");
    toolbarRow.className = "webtools-password-toolbar-row";
    toolbarRow.append(presetStrip, actionRow);

    configCard.append(toolbarRow, controlsGrid);

    const summaryCard = document.createElement("aside");
    summaryCard.className =
      "settings-group webtools-password-card webtools-password-summary-card";
    summaryCard.appendChild(createCardHead("摘要", "实时看强度和结果。"));

    const summaryGrid = document.createElement("div");
    summaryGrid.className = "webtools-password-summary-grid webtools-password-metric-strip";

    const createMetric = (
      labelText: string
    ): { metric: HTMLDivElement; value: HTMLDivElement } => {
      const metric = document.createElement("div");
      metric.className = "webtools-password-metric";
      const label = document.createElement("div");
      label.className = "webtools-password-metric-label";
      label.textContent = labelText;
      const value = document.createElement("div");
      value.className = "webtools-password-metric-value";
      metric.append(label, value);
      return { metric, value };
    };

    const lengthMetric = createMetric("长度");
    const poolMetric = createMetric("字符池");
    const groupMetric = createMetric("字符类型");
    const countMetric = createMetric("批量数量");
    summaryGrid.append(
      lengthMetric.metric,
      poolMetric.metric,
      groupMetric.metric,
      countMetric.metric
    );

    const strengthPanel = document.createElement("div");
    strengthPanel.className = "webtools-password-strength-panel";
    const strengthBadge = document.createElement("span");
    strengthBadge.className = "webtools-password-strength";
    const strengthDescription = document.createElement("div");
    strengthDescription.className = "webtools-password-entropy";
    strengthPanel.append(strengthBadge, strengthDescription);

    const summaryBadges = document.createElement("div");
    summaryBadges.className = "webtools-password-summary-badges";

    const summaryFocus = document.createElement("div");
    summaryFocus.className =
      "webtools-password-summary-focus webtools-password-insight-strip";

    const preview = document.createElement("div");
    preview.className = "webtools-password-preview";
    const previewHead = document.createElement("div");
    previewHead.className = "webtools-password-preview-head";
    const previewTitle = document.createElement("div");
    previewTitle.className = "webtools-password-preview-title";
    previewTitle.textContent = "首条预览";
    const previewMeta = document.createElement("div");
    previewMeta.className = "webtools-password-card-subtitle";
    previewHead.append(previewTitle, previewMeta);
    const previewValue = document.createElement("code");
    previewValue.className = "webtools-password-preview-value";
    preview.append(previewHead, previewValue);

    summaryFocus.append(strengthPanel, preview);

    const tips = document.createElement("div");
    tips.className = "webtools-password-tip-list";

    const summaryNotes = document.createElement("div");
    summaryNotes.className = "webtools-password-summary-notes";
    summaryNotes.append(summaryBadges, tips);

    summaryFocus.append(summaryNotes);
    summaryCard.append(summaryGrid, summaryFocus);

    workbench.append(configCard, summaryCard);

    const resultsCard = document.createElement("section");
    resultsCard.className =
      "settings-group webtools-password-card webtools-password-results-card webtools-password-results-stage";
    const resultsHead = document.createElement("div");
    resultsHead.className = "webtools-password-results-head";
    const resultsHeadCopy = createCardHead("生成结果", "结果会按强度展示，并支持逐条复制。");
    const resultsActions = document.createElement("div");
    resultsActions.className = "webtools-password-results-actions";
    let passwordResultsMasked = false;

    const updatePasswordMaskState = (): void => {
      resultsCard.dataset.masked = passwordResultsMasked ? "true" : "false";
    };

    const copyPasswordRows = (
      mode: "plain" | "numbered" | "json",
      successText: string
    ): void => {
      if (webtoolsPasswordRows.length === 0) {
        setStatus("还没有可复制的密码");
        return;
      }
      let content = "";
      if (mode === "json") {
        content = JSON.stringify(webtoolsPasswordRows, null, 2);
      } else if (mode === "numbered") {
        content = webtoolsPasswordRows
          .map((row, index) => `${index + 1}. ${row.password}`)
          .join("\n");
      } else {
        content = webtoolsPasswordRows.map((row) => row.password).join("\n");
      }
      void (async () => {
        const copied = await copyTextToClipboard(content);
        setStatus(copied ? successText : "复制失败");
      })();
    };

    const actions = document.createElement("div");
    actions.className = "settings-actions webtools-password-tools-actions";

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "settings-btn settings-btn-secondary";
    clearButton.textContent = "清空结果";
    clearButton.addEventListener("click", () => {
      webtoolsPasswordRows = [];
      refreshWebtoolsPasswordResultInForm(form);
      syncPasswordWorkbench();
      setStatus("已清空密码结果");
    });
    resultsActions.appendChild(clearButton);

    const maskButton = document.createElement("button");
    maskButton.type = "button";
    maskButton.className = "settings-btn settings-btn-secondary webtools-password-mask-btn";
    maskButton.textContent = "隐藏密码";
    maskButton.addEventListener("click", () => {
      passwordResultsMasked = !passwordResultsMasked;
      maskButton.textContent = passwordResultsMasked ? "显示密码" : "隐藏密码";
      updatePasswordMaskState();
    });
    resultsActions.appendChild(maskButton);

    const copyAllButton = document.createElement("button");
    copyAllButton.type = "button";
    copyAllButton.className = "settings-btn settings-btn-secondary webtools-password-copy-all-btn";
    copyAllButton.textContent = "复制全部";
    copyAllButton.addEventListener("click", () => {
      copyPasswordRows("plain", `已复制 ${webtoolsPasswordRows.length} 条密码`);
    });
    resultsActions.appendChild(copyAllButton);

    const copyNumberedButton = document.createElement("button");
    copyNumberedButton.type = "button";
    copyNumberedButton.className =
      "settings-btn settings-btn-secondary webtools-password-copy-numbered-btn";
    copyNumberedButton.textContent = "复制编号";
    copyNumberedButton.addEventListener("click", () => {
      copyPasswordRows("numbered", `已复制 ${webtoolsPasswordRows.length} 条带编号密码`);
    });
    resultsActions.appendChild(copyNumberedButton);

    const copyJsonButton = document.createElement("button");
    copyJsonButton.type = "button";
    copyJsonButton.className = "settings-btn settings-btn-secondary webtools-password-copy-json-btn";
    copyJsonButton.textContent = "复制 JSON";
    copyJsonButton.addEventListener("click", () => {
      copyPasswordRows("json", "已复制密码 JSON");
    });
    resultsActions.appendChild(copyJsonButton);

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "settings-btn settings-btn-secondary webtools-password-back-btn";
    backButton.textContent = "返回搜索";
    backButton.addEventListener("click", () => {
      backToSearch();
    });
    resultsActions.appendChild(backButton);

    resultsHead.append(resultsHeadCopy, resultsActions);

    const outputHost = document.createElement("div");
    outputHost.className = "webtools-password-result-host";
    outputHost.appendChild(createWebtoolsPasswordResultTable(webtoolsPasswordRows));
    resultsCard.append(resultsHead, outputHost);

    const readDraftOptions = (): Partial<WebtoolsPasswordOptions> => ({
      length: Number(lengthInput.value),
      count: Number(countInput.value),
      includeLowercase: lowerInput.checked,
      includeUppercase: upperInput.checked,
      includeDigits: digitsInput.checked,
      includeSymbols: includeSymbolsInput.checked,
      symbolChars: symbolsInput.value,
      excludeSimilar: excludeSimilarInput.checked
    });

    const applyOptionsToForm = (nextOptions: Partial<WebtoolsPasswordOptions>): void => {
      const normalized = normalizeWebtoolsPasswordOptions(nextOptions, webtoolsPasswordOptions);
      lowerInput.checked = normalized.includeLowercase;
      upperInput.checked = normalized.includeUppercase;
      digitsInput.checked = normalized.includeDigits;
      includeSymbolsInput.checked = normalized.includeSymbols;
      excludeSimilarInput.checked = normalized.excludeSimilar;
      symbolsInput.value = normalized.symbolChars;
      syncSelectOptions(
        lengthInput,
        lengthOptions,
        normalized.length,
        (value) => `${value} 位 · 自定义`
      );
      syncSelectOptions(
        countInput,
        countOptions,
        normalized.count,
        (value) => `${value} 条`
      );
    };

    const syncPasswordWorkbench = (): void => {
      const draftOptions = readDraftOptions();
      const rawGroupCount =
        Number(lowerInput.checked) +
        Number(upperInput.checked) +
        Number(digitsInput.checked) +
        Number(includeSymbolsInput.checked);
      const normalized = normalizeWebtoolsPasswordOptions(draftOptions, webtoolsPasswordOptions);
      const poolSize = getPasswordPoolSize(normalized);
      const entropy = normalized.length * Math.log2(Math.max(2, poolSize));
      const strength = getStrengthMeta(entropy);
      const matchedPreset = findMatchingPreset(normalized);

      syncSelectOptions(
        lengthInput,
        lengthOptions,
        normalized.length,
        (value) => `${value} 位 · 自定义`
      );
      syncSelectOptions(
        countInput,
        countOptions,
        normalized.count,
        (value) => `${value} 条`
      );

      heroBadges.replaceChildren(
        createChip(matchedPreset?.label || "自定义"),
        createChip(`${normalized.length} 位`),
        createChip(`${normalized.count} 条`, normalized.count >= 10 ? "accent" : "")
      );

      lengthHint.textContent =
        normalized.length >= 24
          ? "更适合 Token、密钥和长期凭证。"
          : normalized.length >= 16
            ? "兼顾安全性与常规登录使用。"
            : normalized.length >= 12
              ? "适合大多数站点登录。"
              : "更适合短 PIN 或一次性场景。";
      countHint.textContent =
        normalized.count >= 20 ? "更适合批量抽样挑选。" : "更适合手动逐条查看。";

      lengthMetric.value.textContent = `${normalized.length} 位`;
      poolMetric.value.textContent = `${poolSize} 种`;
      groupMetric.value.textContent = `${Math.max(rawGroupCount, 1)} 类`;
      countMetric.value.textContent = `${normalized.count} 条`;

      strengthBadge.className = "webtools-password-strength";
      strengthBadge.classList.add(strength.toneClass);
      strengthBadge.textContent = strength.label;
      strengthDescription.textContent = `约 ${Math.round(entropy)} bit 熵值 · ${strength.description}`;

      summaryBadges.replaceChildren();
      if (normalized.includeLowercase) {
        summaryBadges.appendChild(createChip("小写字母"));
      }
      if (normalized.includeUppercase) {
        summaryBadges.appendChild(createChip("大写字母"));
      }
      if (normalized.includeDigits) {
        summaryBadges.appendChild(createChip("数字"));
      }
      if (normalized.includeSymbols) {
        summaryBadges.appendChild(createChip("特殊字符", "accent"));
      }
      if (normalized.excludeSimilar) {
        summaryBadges.appendChild(createChip("排除相似字符"));
      }
      if (rawGroupCount === 0) {
        summaryBadges.appendChild(createChip("生成时会自动回退到字母+数字", "warning"));
      }

      const firstPassword = webtoolsPasswordRows[0]?.password;
      if (firstPassword) {
        previewValue.textContent = firstPassword;
        previewValue.dataset.empty = "false";
        previewMeta.textContent = `已生成 ${webtoolsPasswordRows.length} 条，可逐条复制。`;
      } else {
        previewValue.textContent = "还没有生成结果，先选个预设再点生成。";
        previewValue.dataset.empty = "true";
        previewMeta.textContent = matchedPreset?.usage || "右侧会在生成后展示最近首条。";
      }

      tips.replaceChildren();
      const tipTexts = [
        matchedPreset?.usage ||
          "没有完全匹配的预设，当前组合会按你的勾选生成。",
        normalized.includeSymbols
          ? `当前符号池含 ${Math.max(1, new Set(normalized.symbolChars.split("")).size)} 种字符。`
          : "未启用特殊字符，输入体验更轻，但强度会低一些。",
        normalized.excludeSimilar
          ? "已尽量避开容易看错的字符，更适合人工录入。"
          : "保留所有字符可扩大组合空间，适合复制粘贴型场景。"
      ];
      tipTexts.forEach((tipText) => {
        const item = document.createElement("div");
        item.className = "webtools-password-tip";
        item.textContent = tipText;
        tips.appendChild(item);
      });

      const resultsMeta = resultsHeadCopy.querySelector(".webtools-password-card-subtitle");
      if (resultsMeta instanceof HTMLDivElement) {
        resultsMeta.textContent = firstPassword
          ? `共 ${webtoolsPasswordRows.length} 条，支持逐条复制和首条快捷复制。`
          : "结果会按强度展示，并支持逐条复制。";
      }

      copyFirstButton.disabled = !firstPassword;
      copyAllButton.disabled = webtoolsPasswordRows.length === 0;
      copyNumberedButton.disabled = webtoolsPasswordRows.length === 0;
      copyJsonButton.disabled = webtoolsPasswordRows.length === 0;
      maskButton.disabled = webtoolsPasswordRows.length === 0;
      clearButton.disabled = webtoolsPasswordRows.length === 0;
      symbolsInput.disabled = !includeSymbolsInput.checked;
      symbolQuickButtons.forEach((button, index) => {
        button.dataset.active =
          includeSymbolsInput.checked && symbolPresets[index]?.value === normalized.symbolChars
            ? "true"
            : "false";
      });
      quickLengthButtons.forEach((button) => {
        button.dataset.active = button.textContent === String(normalized.length) ? "true" : "false";
      });

      presetButtons.forEach((button) => {
        button.dataset.active =
          button.dataset.presetId === matchedPreset?.id ? "true" : "false";
      });
    };

    [
      lowerInput,
      upperInput,
      digitsInput,
      includeSymbolsInput,
      excludeSimilarInput,
      lengthInput,
      countInput
    ].forEach((inputNode) => {
      inputNode.addEventListener("change", () => {
        syncPasswordWorkbench();
      });
    });
    symbolsInput.addEventListener("input", () => {
      syncPasswordWorkbench();
    });

    updatePasswordMaskState();

    form.append(
      hero,
      workbench,
      resultsCard
    );
    panel.append(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    applyOptionsToForm(webtoolsPasswordOptions);
    syncPasswordWorkbench();
  },

  applyWebtoolsJsonPanelPayload(panel: ActivePluginPanelState): void {
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
      compressed,
      preview: null,
      errorPosition: null,
      selectedFields: []
    };
  },

  renderWebtoolsJsonPanel(): void {
    type JsonFormat = "json" | "csv" | "text" | "escaped";

    const formatOptions: Array<{ value: JsonFormat; label: string }> = [
      { value: "json", label: "JSON" },
      { value: "csv", label: "CSV" },
      { value: "text", label: "纯文本" },
      { value: "escaped", label: "Escaped" }
    ];
    const routePresets: Array<{
      label: string;
      source: JsonFormat;
      target: JsonFormat;
      compressed?: boolean;
    }> = [
      { label: "JSON -> CSV", source: "json", target: "csv" },
      { label: "CSV -> JSON", source: "csv", target: "json" },
      { label: "格式化 JSON", source: "json", target: "json", compressed: false },
      { label: "压缩 JSON", source: "json", target: "json", compressed: true },
      { label: "JSON -> Escaped", source: "json", target: "escaped" },
      { label: "Escaped -> JSON", source: "escaped", target: "json" },
      { label: "Text -> JSON", source: "text", target: "json" },
      { label: "Text -> Escaped", source: "text", target: "escaped" }
    ];
    const sampleInputs: Array<{
      label: string;
      note: string;
      source: JsonFormat;
      target: JsonFormat;
      input: string;
      compressed?: boolean;
    }> = [
      {
        label: "订单 JSON",
        note: "数组转表格",
        source: "json",
        target: "csv",
        input:
          "[\n" +
          "  {\"orderId\":\"T1001\",\"buyer\":\"Alice\",\"amount\":128.5,\"paid\":true},\n" +
          "  {\"orderId\":\"T1002\",\"buyer\":\"Bob\",\"amount\":89,\"paid\":false}\n" +
          "]"
      },
      {
        label: "CSV 表格",
        note: "表格转对象",
        source: "csv",
        target: "json",
        input: "name,role,active\nAlice,Admin,true\nBob,Editor,false"
      },
      {
        label: "接口返回",
        note: "格式化查看",
        source: "json",
        target: "json",
        input:
          "{\"code\":0,\"data\":{\"items\":[{\"id\":1,\"title\":\"发布提醒\"},{\"id\":2,\"title\":\"订单同步\"}],\"page\":1},\"traceId\":\"demo-2026\"}"
      },
      {
        label: "Escaped",
        note: "反转义 JSON",
        source: "escaped",
        target: "json",
        input: JSON.stringify(
          JSON.stringify({
            title: "发布提醒",
            done: false,
            tags: ["json", "escaped"]
          })
        )
      },
      {
        label: "多行文本",
        note: "转字符串",
        source: "text",
        target: "escaped",
        input: "第一行文本\n第二行包含 \"引号\" 和路径 C:\\\\temp"
      }
    ];
    const formatLabel = (value: string): string =>
      formatOptions.find((option) => option.value === value)?.label ?? value.toUpperCase();
    const summarizeText = (value: string): string => {
      if (!value) {
        return "0 字符 · 0 行";
      }
      return `${value.length} 字符 · ${value.split(/\r\n|\r|\n/).length} 行`;
    };
    const describePayload = (value: string, format: string): string => {
      const trimmed = value.trim();
      if (!trimmed) {
        return "等待输入";
      }
      if (format === "csv") {
        const lines = trimmed.split(/\r\n|\r|\n/).filter(Boolean);
        const columns = lines[0]?.split(",").length ?? 0;
        return `${lines.length} 行 · ${columns} 列`;
      }
      if (format === "json") {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return `数组 · ${parsed.length} 项`;
          }
          if (parsed && typeof parsed === "object") {
            return `对象 · ${Object.keys(parsed as Record<string, unknown>).length} 键`;
          }
          return typeof parsed;
        } catch {
          return "等待校验";
        }
      }
      if (format === "escaped") {
        return "JSON 字符串";
      }
      return "纯文本";
    };
    const markButton = (button: HTMLButtonElement, text: string, resetText: string): void => {
      button.textContent = text;
      window.setTimeout(() => {
        if (button.isConnected) {
          button.textContent = resetText;
        }
      }, 1200);
    };

    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-json-form webtools-tool-panel webtools-json-lab";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsJsonConvert(form, { render: false });
    });

    const header = document.createElement("div");
    header.className = "webtools-tool-header webtools-json-header";
    const titleGroup = document.createElement("div");
    titleGroup.className = "webtools-tool-title-group";
    const title = document.createElement("h3");
    title.className = "webtools-tool-title";
    title.textContent = activePluginPanel?.title || "JSON & CSV 实验室";
    const description = document.createElement("p");
    description.className = "webtools-tool-subtitle";
    description.textContent =
      activePluginPanel?.subtitle || "格式转换、校验、转义和样例测试集中在一个紧凑工作台。";
    titleGroup.append(title, description);

    const headerActions = document.createElement("div");
    headerActions.className = "webtools-json-toolbar";
    const convertButton = document.createElement("button");
    convertButton.type = "submit";
    convertButton.className = "settings-btn settings-btn-primary webtools-json-convert-btn";
    convertButton.textContent = "转换";
    const validateButton = document.createElement("button");
    validateButton.type = "button";
    validateButton.className =
      "settings-btn settings-btn-secondary webtools-json-validate-btn";
    validateButton.textContent = "校验";
    validateButton.addEventListener("click", () => {
      void executeWebtoolsJsonConvert(form, { render: false, action: "validate" });
    });
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "settings-btn settings-btn-secondary webtools-json-clear-btn";
    clearButton.textContent = "清空";
    clearButton.addEventListener("click", () => {
      webtoolsJsonState.input = "";
      webtoolsJsonState.output = "";
      webtoolsJsonState.info = "";
      webtoolsJsonState.valid = null;
      webtoolsJsonState.preview = null;
      webtoolsJsonState.errorPosition = null;
      webtoolsJsonState.selectedFields = [];
      inputArea.value = "";
      outputArea.value = "";
      refreshWebtoolsJsonResultInForm(form);
      setStatus("已清空输入与输出");
    });
    headerActions.append(convertButton, validateButton, clearButton);
    header.append(titleGroup, headerActions);

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
    formatOptions.forEach(({ value, label }) => {
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
    swapButton.textContent = "交换";

    const targetGroup = document.createElement("label");
    targetGroup.className = "webtools-json-converter-group";
    const targetLabel = document.createElement("span");
    targetLabel.className = "webtools-json-converter-label";
    targetLabel.textContent = "目标格式";
    const targetSelect = document.createElement("select");
    targetSelect.className = "settings-number webtools-json-select";
    targetSelect.name = "webtoolsJsonTarget";
    formatOptions.forEach(({ value, label }) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = webtoolsJsonState.targetFormat === value;
      targetSelect.appendChild(option);
    });
    targetGroup.append(targetLabel, targetSelect);

    const formatHint = document.createElement("div");
    formatHint.className = "webtools-json-route";

    const controlPanel = document.createElement("section");
    controlPanel.className = "webtools-json-control-panel";

    const routePresetWrap = document.createElement("div");
    routePresetWrap.className = "webtools-json-route-presets";
    const routePresetLabel = document.createElement("span");
    routePresetLabel.className = "webtools-json-mini-label";
    routePresetLabel.textContent = "常用路线";
    const routeButtonWrap = document.createElement("div");
    routeButtonWrap.className = "webtools-json-chip-row";
    const routeButtons: HTMLButtonElement[] = [];
    routePresets.forEach((preset) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "webtools-json-chip-btn";
      button.textContent = preset.label;
      button.addEventListener("click", () => {
        sourceSelect.value = preset.source;
        targetSelect.value = preset.target;
        compressedInput.checked = preset.compressed ?? false;
        updateJsonFormHead();
        scheduleWebtoolsJsonAutoConvert(form, true);
      });
      routeButtons.push(button);
      routeButtonWrap.appendChild(button);
    });
    routePresetWrap.append(routePresetLabel, routeButtonWrap);

    const sampleWrap = document.createElement("div");
    sampleWrap.className = "webtools-json-sample-strip";
    const sampleLabel = document.createElement("span");
    sampleLabel.className = "webtools-json-mini-label";
    sampleLabel.textContent = "快速样例";
    const sampleButtonWrap = document.createElement("div");
    sampleButtonWrap.className = "webtools-json-sample-grid";
    sampleInputs.forEach((sample) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "webtools-json-sample-btn";
      const buttonTitle = document.createElement("strong");
      buttonTitle.textContent = sample.label;
      const buttonNote = document.createElement("span");
      buttonNote.textContent = sample.note;
      button.append(buttonTitle, buttonNote);
      button.addEventListener("click", () => {
      inputArea.value = sample.input;
      outputArea.value = "";
      webtoolsJsonState.output = "";
      webtoolsJsonState.selectedFields = [];
      sourceSelect.value = sample.source;
      targetSelect.value = sample.target;
      compressedInput.checked = sample.compressed ?? false;
        updateJsonFormHead();
        updateJsonStats();
        scheduleWebtoolsJsonAutoConvert(form, true);
        setStatus(`已载入${sample.label}样例`);
      });
      sampleButtonWrap.appendChild(button);
    });
    sampleWrap.append(sampleLabel, sampleButtonWrap);

    const stats = document.createElement("div");
    stats.className = "webtools-json-stats";
    const routeStat = document.createElement("span");
    routeStat.className = "webtools-json-stat webtools-json-route-stat";
    const inputStat = document.createElement("span");
    inputStat.className = "webtools-json-stat webtools-json-input-stat";
    const outputStat = document.createElement("span");
    outputStat.className = "webtools-json-stat webtools-json-output-stat";
    const payloadStat = document.createElement("span");
    payloadStat.className = "webtools-json-stat webtools-json-payload-stat";
    stats.append(routeStat, inputStat, outputStat, payloadStat);

    const utilityDeck = document.createElement("section");
    utilityDeck.className = "webtools-json-utility-deck";

    const structureCard = document.createElement("section");
    structureCard.className = "webtools-json-structure-card";
    const structureHead = document.createElement("div");
    structureHead.className = "webtools-json-card-head";
    const structureTitle = document.createElement("span");
    structureTitle.className = "webtools-json-card-title";
    structureTitle.textContent = "结构预览";
    const structureMeta = document.createElement("span");
    structureMeta.className = "webtools-json-card-meta";
    structureHead.append(structureTitle, structureMeta);
    const structureSummary = document.createElement("div");
    structureSummary.className = "webtools-json-structure-summary";
    const structureFields = document.createElement("div");
    structureFields.className = "webtools-json-structure-fields";
    const structureSample = document.createElement("pre");
    structureSample.className = "webtools-json-structure-sample";
    structureCard.append(structureHead, structureSummary, structureFields, structureSample);

    const cleanActionsCard = document.createElement("section");
    cleanActionsCard.className = "webtools-json-clean-actions";
    const cleanHead = document.createElement("div");
    cleanHead.className = "webtools-json-card-head";
    const cleanTitle = document.createElement("span");
    cleanTitle.className = "webtools-json-card-title";
    cleanTitle.textContent = "一键清洗";
    const cleanMeta = document.createElement("span");
    cleanMeta.className = "webtools-json-card-meta";
    cleanMeta.textContent = "作用于输入区";
    cleanHead.append(cleanTitle, cleanMeta);
    const cleanButtonGrid = document.createElement("div");
    cleanButtonGrid.className = "webtools-json-clean-button-grid";
    cleanActionsCard.append(cleanHead, cleanButtonGrid);

    const fieldsCard = document.createElement("section");
    fieldsCard.className = "webtools-json-fields-card";
    const fieldsHead = document.createElement("div");
    fieldsHead.className = "webtools-json-card-head";
    const fieldsTitle = document.createElement("span");
    fieldsTitle.className = "webtools-json-card-title";
    fieldsTitle.textContent = "字段提取";
    const fieldsMeta = document.createElement("span");
    fieldsMeta.className = "webtools-json-card-meta";
    fieldsHead.append(fieldsTitle, fieldsMeta);
    const fieldsHint = document.createElement("div");
    fieldsHint.className = "webtools-json-fields-hint";
    const fieldActions = document.createElement("div");
    fieldActions.className = "webtools-json-fields-actions";
    const fieldChipWrap = document.createElement("div");
    fieldChipWrap.className = "webtools-json-field-chip-row";
    fieldsCard.append(fieldsHead, fieldsHint, fieldActions, fieldChipWrap);

    utilityDeck.append(structureCard, cleanActionsCard, fieldsCard);

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

    const inputActions = document.createElement("div");
    inputActions.className = "webtools-json-pane-controls";
    const copyInputButton = document.createElement("button");
    copyInputButton.type = "button";
    copyInputButton.className =
      "settings-btn settings-btn-secondary webtools-json-copy-input-btn";
    copyInputButton.textContent = "复制输入";
    copyInputButton.addEventListener("click", () => {
      void (async () => {
        if (!inputArea.value) {
          setStatus("当前没有可复制的输入内容");
          return;
        }
        const copied = await copyTextToClipboard(inputArea.value);
        if (copied) {
          markButton(copyInputButton, "已复制", "复制输入");
        }
        setStatus(copied ? "已复制输入内容" : "复制失败");
      })();
    });
    inputActions.append(copyInputButton);

    const outputArea = document.createElement("textarea");
    outputArea.className = "settings-value webtools-textarea webtools-json-textarea";
    outputArea.name = "webtoolsJsonOutput";
    outputArea.readOnly = true;
    outputArea.placeholder = "转换后结果";
    outputArea.value = webtoolsJsonState.output;

    const outputMeta = document.createElement("div");
    outputMeta.className = "webtools-json-pane-controls";
    outputMeta.append(compressedWrap);

    const useOutputButton = document.createElement("button");
    useOutputButton.type = "button";
    useOutputButton.className =
      "settings-btn settings-btn-secondary webtools-json-use-output-btn";
    useOutputButton.textContent = "回填";
    useOutputButton.addEventListener("click", () => {
      if (!outputArea.value.trim()) {
        setStatus("当前没有可回填的输出内容");
        return;
      }
      inputArea.value = outputArea.value;
      sourceSelect.value = targetSelect.value;
      webtoolsJsonState.output = "";
      webtoolsJsonState.selectedFields = [];
      outputArea.value = "";
      updateJsonFormHead();
      updateJsonStats();
      scheduleWebtoolsJsonAutoConvert(form, true);
      setStatus("已将输出回填为输入");
    });

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className =
      "settings-btn settings-btn-secondary webtools-json-copy-btn";
    copyButton.textContent = "复制输出";
    copyButton.addEventListener("click", () => {
      void (async () => {
        if (!outputArea.value) {
          setStatus("当前没有可复制的输出内容");
          return;
        }
        const copied = await copyTextToClipboard(outputArea.value);
        if (copied) {
          markButton(copyButton, "已复制", "复制输出");
        }
        setStatus(copied ? "已复制输出内容" : "复制失败");
      })();
    });
    outputMeta.append(useOutputButton, copyButton);

    const sortJsonKeys = (value: unknown): unknown => {
      if (Array.isArray(value)) {
        return value.map((item) => sortJsonKeys(item));
      }
      if (value && typeof value === "object") {
        return Object.keys(value as Record<string, unknown>)
          .sort((left, right) => left.localeCompare(right))
          .reduce<Record<string, unknown>>((result, key) => {
            result[key] = sortJsonKeys((value as Record<string, unknown>)[key]);
            return result;
          }, {});
      }
      return value;
    };

    const pruneJsonValue = (value: unknown): unknown => {
      if (Array.isArray(value)) {
        const items = value
          .map((item) => pruneJsonValue(item))
          .filter(
            (item) =>
              item !== null &&
              item !== "" &&
              !(Array.isArray(item) && item.length === 0) &&
              !(item && typeof item === "object" && Object.keys(item as Record<string, unknown>).length === 0)
          );
        return items;
      }
      if (value && typeof value === "object") {
        const nextEntries = Object.entries(value as Record<string, unknown>)
          .map(([key, item]) => [key, pruneJsonValue(item)] as const)
          .filter(
            ([, item]) =>
              item !== null &&
              item !== "" &&
              !(Array.isArray(item) && item.length === 0) &&
              !(item && typeof item === "object" && Object.keys(item as Record<string, unknown>).length === 0)
          );
        return Object.fromEntries(nextEntries);
      }
      return value;
    };

    const updateJsonInputValue = (nextInput: string, statusText: string): void => {
      inputArea.value = nextInput;
      webtoolsJsonState.input = nextInput;
      webtoolsJsonState.output = "";
      webtoolsJsonState.valid = null;
      webtoolsJsonState.info = "";
      webtoolsJsonState.errorPosition = null;
      updateJsonStats();
      scheduleWebtoolsJsonAutoConvert(form, true);
      setStatus(statusText);
    };

    const applyJsonCleanAction = (
      label: string,
      transform: (source: string) => string
    ): void => {
      try {
        updateJsonInputValue(transform(inputArea.value), `已执行${label}`);
      } catch (error) {
        const message = error instanceof Error && error.message ? error.message : `${label}失败`;
        setStatus(message);
      }
    };

    const renderPreviewFieldPills = (): void => {
      structureFields.replaceChildren();
      const fields = webtoolsJsonState.preview?.fields ?? [];
      if (fields.length === 0) {
        const empty = document.createElement("span");
        empty.className = "webtools-json-inline-empty";
        empty.textContent = "当前结构里还没有可识别字段";
        structureFields.appendChild(empty);
        return;
      }
      fields.slice(0, 8).forEach((field) => {
        const pill = document.createElement("span");
        pill.className = "webtools-json-inline-pill";
        pill.textContent =
          typeof field.count === "number" ? `${field.key} · ${field.count}` : field.key;
        structureFields.appendChild(pill);
      });
    };

    const renderStructurePreview = (): void => {
      const preview = webtoolsJsonState.preview;
      structureMeta.textContent = preview?.kind ?? "unknown";
      structureSummary.textContent = preview?.summary ?? "等待自动识别输入结构";
      renderPreviewFieldPills();
      structureSample.textContent =
        preview && preview.sampleRows.length > 0
          ? JSON.stringify(preview.sampleRows, null, 2)
          : "暂无样例行";
    };

    const applySelectedFields = (): void => {
      const selected = webtoolsJsonState.selectedFields;
      if (selected.length === 0) {
        setStatus("请先选择至少一个字段");
        return;
      }
      try {
        if (sourceSelect.value === "csv") {
          const lines = inputArea.value.split(/\r?\n/).filter((line) => line.length > 0);
          if (lines.length === 0) {
            setStatus("当前没有可提取的 CSV 内容");
            return;
          }
          const headers = lines[0].split(",");
          const indexes = selected
            .map((key) => headers.indexOf(key))
            .filter((index) => index >= 0);
          const nextLines = lines.map((line, index) => {
            const cells = line.split(",");
            if (index === 0) {
              return indexes.map((cellIndex) => cells[cellIndex] ?? "").join(",");
            }
            return indexes.map((cellIndex) => cells[cellIndex] ?? "").join(",");
          });
          updateJsonInputValue(nextLines.join("\n"), `已提取 ${selected.length} 个字段`);
          return;
        }

        const parsed = JSON.parse(inputArea.value);
        const pickObject = (row: Record<string, unknown>) =>
          selected.reduce<Record<string, unknown>>((result, key) => {
            if (key in row) {
              result[key] = row[key];
            }
            return result;
          }, {});

        const nextValue = Array.isArray(parsed)
          ? parsed.map((item) =>
              item && typeof item === "object" && !Array.isArray(item)
                ? pickObject(item as Record<string, unknown>)
                : item
            )
          : parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? pickObject(parsed as Record<string, unknown>)
          : parsed;
        const nextInput = JSON.stringify(nextValue, null, 2);
        updateJsonInputValue(nextInput, `已提取 ${selected.length} 个字段`);
      } catch (error) {
        const message = error instanceof Error && error.message ? error.message : "字段提取失败";
        setStatus(message);
      }
    };

    const renderFieldSelector = (): void => {
      fieldChipWrap.replaceChildren();
      fieldActions.replaceChildren();
      const fields = webtoolsJsonState.preview?.fields ?? [];
      fieldsMeta.textContent = fields.length > 0 ? `${fields.length} 个字段` : "不可用";
      fieldsHint.textContent =
        fields.length > 0
          ? "选中后可直接把当前输入收敛成目标字段"
          : "解析到对象数组或 CSV 表头后，这里会出现可选字段";
      if (fields.length === 0) {
        return;
      }

      const selectAllButton = document.createElement("button");
      selectAllButton.type = "button";
      selectAllButton.className = "settings-btn settings-btn-secondary webtools-json-mini-btn";
      selectAllButton.textContent = "全选";
      selectAllButton.addEventListener("click", () => {
        webtoolsJsonState.selectedFields = fields.map((field) => field.key);
        renderFieldSelector();
      });

      const clearSelectButton = document.createElement("button");
      clearSelectButton.type = "button";
      clearSelectButton.className = "settings-btn settings-btn-secondary webtools-json-mini-btn";
      clearSelectButton.textContent = "清空";
      clearSelectButton.addEventListener("click", () => {
        webtoolsJsonState.selectedFields = [];
        renderFieldSelector();
      });

      const applyFieldsButton = document.createElement("button");
      applyFieldsButton.type = "button";
      applyFieldsButton.className = "settings-btn settings-btn-secondary webtools-json-mini-btn";
      applyFieldsButton.textContent = "应用字段";
      applyFieldsButton.addEventListener("click", () => {
        applySelectedFields();
      });

      fieldActions.append(selectAllButton, clearSelectButton, applyFieldsButton);

      fields.forEach((field) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "webtools-json-field-chip";
        const selected = webtoolsJsonState.selectedFields.includes(field.key);
        chip.dataset.active = String(selected);
        chip.textContent =
          typeof field.count === "number" ? `${field.key} (${field.count})` : field.key;
        chip.addEventListener("click", () => {
          if (selected) {
            webtoolsJsonState.selectedFields = webtoolsJsonState.selectedFields.filter(
              (key) => key !== field.key
            );
          } else {
            webtoolsJsonState.selectedFields = [...webtoolsJsonState.selectedFields, field.key];
          }
          renderFieldSelector();
        });
        fieldChipWrap.appendChild(chip);
      });
    };

    [
      {
        label: "格式化 JSON",
        action: () =>
          applyJsonCleanAction("格式化 JSON", (source) =>
            JSON.stringify(JSON.parse(source), null, 2)
          )
      },
      {
        label: "压缩 JSON",
        action: () =>
          applyJsonCleanAction("压缩 JSON", (source) => JSON.stringify(JSON.parse(source)))
      },
      {
        label: "字段排序",
        action: () =>
          applyJsonCleanAction("字段排序", (source) =>
            JSON.stringify(sortJsonKeys(JSON.parse(source)), null, 2)
          )
      },
      {
        label: "移除空值",
        action: () =>
          applyJsonCleanAction("移除空值", (source) =>
            JSON.stringify(pruneJsonValue(JSON.parse(source)), null, 2)
          )
      }
    ].forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "settings-btn settings-btn-secondary webtools-json-clean-btn";
      button.textContent = item.label;
      button.addEventListener("click", item.action);
      cleanButtonGrid.appendChild(button);
    });

    let jsonStatsDebounceHandle: number | null = null;

    const updateJsonStats = (): void => {
      routeStat.textContent = `${formatLabel(sourceSelect.value)} -> ${formatLabel(targetSelect.value)}`;
      inputStat.textContent = `输入 ${summarizeText(inputArea.value)}`;
      outputStat.textContent = `输出 ${summarizeText(outputArea.value)}`;
      payloadStat.textContent = describePayload(inputArea.value, sourceSelect.value);
      payloadStat.dataset.state = webtoolsJsonState.valid === false ? "error" : "idle";
      renderStructurePreview();
      renderFieldSelector();
    };

    // `describePayload` runs JSON.parse and the structure/field preview
    // rebuilds DOM nodes; debounce the per-keystroke call so large payloads
    // don't re-parse on every single character.
    const scheduleUpdateJsonStats = (): void => {
      if (jsonStatsDebounceHandle !== null) {
        window.clearTimeout(jsonStatsDebounceHandle);
      }
      jsonStatsDebounceHandle = window.setTimeout(() => {
        jsonStatsDebounceHandle = null;
        updateJsonStats();
      }, 220);
    };

    const updateJsonFormHead = (): void => {
      const source = formatLabel(sourceSelect.value);
      const target = formatLabel(targetSelect.value);
      const minifyText = targetSelect.value === "json" && compressedInput.checked ? " · Minify" : "";
      formatHint.textContent = `${source} -> ${target}${minifyText}`;
      compressedWrap.style.display = targetSelect.value === "json" ? "" : "none";
      inputMeta.textContent = sourceSelect.value.toUpperCase();
      outputMetaText.textContent = targetSelect.value.toUpperCase();
      routeButtons.forEach((button, index) => {
        const preset = routePresets[index];
        button.dataset.active = String(
          sourceSelect.value === preset.source &&
            targetSelect.value === preset.target &&
            (preset.compressed === undefined ||
              compressedInput.checked === Boolean(preset.compressed))
        );
      });
      updateJsonStats();
    };

    swapButton.addEventListener("click", () => {
      const source = sourceSelect.value;
      sourceSelect.value = (targetSelect.value || "json") as string;
      targetSelect.value = source as string;

      if (webtoolsJsonState.output.trim()) {
        inputArea.value = webtoolsJsonState.output;
        webtoolsJsonState.output = "";
        webtoolsJsonState.selectedFields = [];
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
      updateJsonFormHead();
      scheduleWebtoolsJsonAutoConvert(form, true);
    });
    inputArea.addEventListener("input", () => {
      webtoolsJsonState.selectedFields = [];
      scheduleUpdateJsonStats();
      scheduleWebtoolsJsonAutoConvert(form);
    });

    converterBar.append(sourceGroup, swapButton, targetGroup, formatHint);
    controlPanel.append(converterBar, routePresetWrap, sampleWrap, stats);

    const editors = document.createElement("div");
    editors.className = "webtools-json-shell webtools-json-editors";

    const inputPane = document.createElement("section");
    inputPane.className = "webtools-json-pane";
    const inputHead = document.createElement("div");
    inputHead.className = "webtools-json-pane-head";
    const inputTitle = document.createElement("span");
    inputTitle.className = "webtools-json-pane-title";
    inputTitle.textContent = "输入";
    const inputMeta = document.createElement("span");
    inputMeta.className = "webtools-json-pane-meta webtools-json-input-meta";
    inputMeta.textContent = webtoolsJsonState.sourceFormat.toUpperCase();
    const inputTitleWrap = document.createElement("div");
    inputTitleWrap.className = "webtools-json-pane-title-wrap";
    inputTitleWrap.append(inputTitle, inputMeta);
    inputHead.append(inputTitleWrap, inputActions);
    const inputError = document.createElement("div");
    inputError.className = "webtools-json-error";
    inputError.hidden = true;
    inputPane.append(inputHead, inputArea, inputError);

    const outputPane = document.createElement("section");
    outputPane.className = "webtools-json-pane";
    const outputHead = document.createElement("div");
    outputHead.className = "webtools-json-pane-head";
    const outputTitle = document.createElement("span");
    outputTitle.className = "webtools-json-pane-title";
    outputTitle.textContent = "输出";
    const outputTitleWrap = document.createElement("div");
    outputTitleWrap.className = "webtools-json-pane-title-wrap";
    const outputMetaText = document.createElement("span");
    outputMetaText.className = "webtools-json-pane-meta webtools-json-output-meta";
    outputMetaText.textContent = webtoolsJsonState.targetFormat.toUpperCase();
    outputTitleWrap.append(outputTitle, outputMetaText);
    outputHead.append(outputTitleWrap, outputMeta);
    outputPane.append(outputHead, outputArea);

    editors.append(inputPane, outputPane);

    const info = document.createElement("div");
    info.className = "webtools-json-info";
    const infoState = buildWebtoolsJsonInfoState();
    info.textContent = infoState.text;
    info.dataset.state = infoState.state;

    form.addEventListener("webtools-json-sync", () => {
      updateJsonFormHead();
      updateJsonStats();
    });
    updateJsonFormHead();

    form.append(header, controlPanel, utilityDeck, editors, info);
    panel.append(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    scheduleWebtoolsJsonAutoConvert(form, true);
  },

  applyWebtoolsUrlPanelPayload(panel: ActivePluginPanelState): void {
    const input =
      panel.data && typeof panel.data.input === "string"
        ? panel.data.input
        : webtoolsUrlState.input || DEFAULT_WEBTOOLS_URL_INPUT;

    webtoolsUrlState = {
      input: input.trim() || DEFAULT_WEBTOOLS_URL_INPUT,
      info: "",
      valid: null,
      parts: createEmptyWebtoolsUrlParts(),
      queryRows: []
    };

    parseWebtoolsUrlInput(webtoolsUrlState.input);
  },

  renderWebtoolsUrlPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-url-form webtools-tool-panel";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const inputNode = form.elements.namedItem("webtoolsUrlInput");
      const input = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
      parseWebtoolsUrlInput(input);
      refreshWebtoolsUrlPanelInForm(form, { rebuildQueryRows: true });
      setStatus(webtoolsUrlState.valid === false ? webtoolsUrlState.info : "URL 解析完成");
    });

    const header = document.createElement("div");
    header.className = "webtools-tool-header";
    const titleGroup = document.createElement("div");
    titleGroup.className = "webtools-tool-title-group";
    const title = document.createElement("h3");
    title.className = "webtools-tool-title";
    title.textContent = activePluginPanel?.title || "URL 解析";
    const description = document.createElement("p");
    description.className = "webtools-tool-subtitle";
    description.textContent =
      activePluginPanel?.subtitle || "输入 URL 后自动拆解，并支持查询参数可视化编辑。";
    titleGroup.append(title, description);

    const toolbar = document.createElement("div");
    toolbar.className = "webtools-tool-toolbar";
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "settings-btn settings-btn-secondary";
    copyButton.textContent = "复制 URL";
    copyButton.addEventListener("click", async () => {
      const value = webtoolsUrlState.input.trim();
      if (!value) {
        setStatus("当前没有可复制的 URL");
        return;
      }
      await navigator.clipboard.writeText(value);
      setStatus("已复制 URL");
    });
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "settings-btn settings-btn-secondary";
    clearButton.textContent = "清空";
    clearButton.addEventListener("click", () => {
      parseWebtoolsUrlInput("");
      refreshWebtoolsUrlPanelInForm(form, { rebuildQueryRows: true, syncInput: true });
      setStatus("已清空 URL 输入");
    });
    toolbar.append(copyButton, clearButton);
    header.append(titleGroup, toolbar);

    const inputPane = document.createElement("label");
    inputPane.className = "webtools-tool-pane";
    const inputHead = document.createElement("div");
    inputHead.className = "webtools-tool-pane-head";
    const inputLabel = document.createElement("div");
    inputLabel.className = "webtools-tool-pane-title";
    inputLabel.textContent = "URL";
    const inputMeta = document.createElement("div");
    inputMeta.className = "webtools-tool-pane-meta";
    inputMeta.textContent = "输入后自动解析";
    inputHead.append(inputLabel, inputMeta);
    const inputArea = document.createElement("textarea");
    inputArea.className = "settings-value webtools-textarea webtools-url-input";
    inputArea.name = "webtoolsUrlInput";
    inputArea.value = webtoolsUrlState.input;
    inputArea.placeholder = "输入 URL";
    inputArea.spellcheck = false;
    inputArea.addEventListener("input", () => {
      parseWebtoolsUrlInput(inputArea.value);
      refreshWebtoolsUrlPanelInForm(form, { rebuildQueryRows: true });
      setStatus(webtoolsUrlState.info);
    });
    const inputInfo = document.createElement("div");
    inputInfo.className = "webtools-tool-info webtools-url-info";
    inputPane.append(inputHead, inputArea, inputInfo);

    const partsGrid = document.createElement("div");
    partsGrid.className = "webtools-url-parts-grid";
    partsGrid.append(
      createWebtoolsUrlPartField("协议", "protocol"),
      createWebtoolsUrlPartField("主机", "host"),
      createWebtoolsUrlPartField("端口", "port"),
      createWebtoolsUrlPartField("路径", "pathname", true),
      createWebtoolsUrlPartField("查询串", "search", true),
      createWebtoolsUrlPartField("锚点", "hash", true)
    );

    const querySection = document.createElement("section");
    querySection.className = "webtools-url-query-section";
    const queryHead = document.createElement("div");
    queryHead.className = "webtools-url-query-head";
    const queryTitle = document.createElement("h4");
    queryTitle.className = "webtools-url-query-title";
    queryTitle.textContent = "查询参数";
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "settings-btn settings-btn-secondary webtools-url-add-btn";
    addButton.textContent = "+ 添加";
    addButton.addEventListener("click", () => {
      webtoolsUrlState.queryRows.push({ key: "", value: "" });
      refreshWebtoolsUrlPanelInForm(form, { rebuildQueryRows: true });
    });
    queryHead.append(queryTitle, addButton);
    const queryHost = document.createElement("div");
    queryHost.className = "webtools-url-query-host";
    querySection.append(queryHead, queryHost);

    form.append(header, inputPane, partsGrid, querySection);
    panel.append(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsUrlPanelInForm(form, { rebuildQueryRows: true, syncInput: true });
  },

  applyWebtoolsTimestampPanelPayload(panel: ActivePluginPanelState): void {
    const payloadUnit =
      panel.data && typeof panel.data.unit === "string"
        ? normalizeWebtoolsTimestampUnit(panel.data.unit)
        : webtoolsTimestampUnit;
    webtoolsTimestampUnit = payloadUnit;

    const input =
      panel.data && typeof panel.data.input === "string" ? panel.data.input.trim() : "";
    if (input) {
      if (/^[+-]?\d+$/.test(input)) {
        webtoolsTimestampUnixInput = input;
        if (!(panel.data && typeof panel.data.unit === "string")) {
          webtoolsTimestampUnit = input.length > 10 ? "ms" : "s";
        }
      } else {
        webtoolsTimestampDateInput = input;
      }
    }

    ensureWebtoolsTimestampDefaults();
    webtoolsTimestampDateOutput = "";
    webtoolsTimestampTimestampOutput = "";
    webtoolsTimestampInfo = "";
  },

  renderWebtoolsTimestampPanel(): void {
    clearWebtoolsTimestampClockTimer();
    ensureWebtoolsTimestampDefaults();

    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-timestamp-panel";

    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "时间戳工具";

    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle || "支持时间戳与日期时间双向转换。";

    const form = document.createElement("form");
    form.className = "settings-form webtools-timestamp-form webtools-timestamp-lab";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsTimestampAction("toDate", webtoolsTimestampUnixInput, {
        render: false,
        form
      });
    });

    const currentLine = document.createElement("div");
    currentLine.className = "webtools-timestamp-current";
    const currentLocalLabel = document.createElement("span");
    currentLocalLabel.className = "webtools-timestamp-current-label";
    currentLocalLabel.textContent = "当前本地时间:";
    const currentLocalValue = document.createElement("span");
    currentLocalValue.className = "webtools-timestamp-current-value";
    const currentUnixLabel = document.createElement("span");
    currentUnixLabel.className = "webtools-timestamp-current-label";
    currentUnixLabel.textContent = "Unix 时间戳:";
    const currentUnixValue = document.createElement("span");
    currentUnixValue.className = "webtools-timestamp-current-value";
    currentLine.append(
      currentLocalLabel,
      currentLocalValue,
      currentUnixLabel,
      currentUnixValue
    );

    const updateCurrentClock = (): void => {
      if (
        !form.isConnected ||
        mode !== "plugin" ||
        activePluginPanel?.pluginId !== WEBTOOLS_TIMESTAMP_PLUGIN_ID
      ) {
        clearWebtoolsTimestampClockTimer();
        return;
      }
      const now = new Date();
      currentLocalValue.textContent = formatWebtoolsTimestampDate(now);
      currentUnixValue.textContent =
        webtoolsTimestampUnit === "s"
          ? String(Math.floor(now.getTime() / 1000))
          : String(now.getTime());
    };
    updateCurrentClock();
    webtoolsTimestampClockTimer = window.setInterval(updateCurrentClock, 1000);

    const toDateSection = document.createElement("section");
    toDateSection.className = "webtools-timestamp-section";
    const toDateTitle = document.createElement("h4");
    toDateTitle.className = "webtools-timestamp-section-title";
    toDateTitle.textContent = "Unix 时间戳 → 日期字符串";

    const toDateControls = document.createElement("div");
    toDateControls.className = "webtools-timestamp-controls";
    const unixInput = document.createElement("input");
    unixInput.type = "text";
    unixInput.className = "settings-number webtools-timestamp-input";
    unixInput.name = "webtoolsTimestampUnixInput";
    unixInput.placeholder = "例如：1773132180";
    unixInput.value = webtoolsTimestampUnixInput;

    const unitSelect = document.createElement("select");
    unitSelect.className = "settings-number webtools-timestamp-select";
    unitSelect.name = "webtoolsTimestampUnit";
    (
      [
        ["s", "秒 (s)"],
        ["ms", "毫秒 (ms)"]
      ] as const
    ).forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = webtoolsTimestampUnit === value;
      unitSelect.appendChild(option);
    });

    const toDateButton = document.createElement("button");
    toDateButton.type = "button";
    toDateButton.className = "settings-btn settings-btn-primary";
    toDateButton.textContent = "转换为日期";
    toDateButton.addEventListener("click", () => {
      webtoolsTimestampUnixInput = unixInput.value;
      void executeWebtoolsTimestampAction("toDate", webtoolsTimestampUnixInput, {
        render: false,
        form
      });
    });

    const nowButton = document.createElement("button");
    nowButton.type = "button";
    nowButton.className = "settings-btn settings-btn-secondary";
    nowButton.textContent = "获取当前";
    nowButton.addEventListener("click", () => {
      webtoolsTimestampUnixInput = getWebtoolsTimestampNowUnix(webtoolsTimestampUnit);
      unixInput.value = webtoolsTimestampUnixInput;
      void executeWebtoolsTimestampAction("toDate", webtoolsTimestampUnixInput, {
        render: false,
        form
      });
      updateCurrentClock();
    });

    toDateControls.append(unixInput, unitSelect, toDateButton, nowButton);

    const toDateResult = document.createElement("div");
    toDateResult.className = "webtools-timestamp-result";
    const toDateResultLabel = document.createElement("label");
    toDateResultLabel.className = "webtools-timestamp-result-label";
    toDateResultLabel.textContent = "日期字符串:";
    const toDateResultValue = document.createElement("input");
    toDateResultValue.type = "text";
    toDateResultValue.readOnly = true;
    toDateResultValue.className = "settings-number webtools-timestamp-result-input";
    toDateResultValue.name = "webtoolsTimestampDateOutput";
    toDateResultValue.value = webtoolsTimestampDateOutput;
    toDateResult.append(toDateResultLabel, toDateResultValue);

    toDateSection.append(toDateTitle, toDateControls, toDateResult);

    const divider = document.createElement("div");
    divider.className = "webtools-timestamp-divider";

    const toTimestampSection = document.createElement("section");
    toTimestampSection.className = "webtools-timestamp-section";
    const toTimestampTitle = document.createElement("h4");
    toTimestampTitle.className = "webtools-timestamp-section-title";
    toTimestampTitle.textContent = "日期字符串 → Unix 时间戳";

    const toTimestampControls = document.createElement("div");
    toTimestampControls.className = "webtools-timestamp-controls";
    const dateInput = document.createElement("input");
    dateInput.type = "text";
    dateInput.className = "settings-number webtools-timestamp-input";
    dateInput.name = "webtoolsTimestampDateInput";
    dateInput.placeholder = "YYYY-MM-DD HH:mm:ss";
    dateInput.value = webtoolsTimestampDateInput;

    const toTimestampButton = document.createElement("button");
    toTimestampButton.type = "button";
    toTimestampButton.className = "settings-btn settings-btn-primary";
    toTimestampButton.textContent = "转换为时间戳";
    toTimestampButton.addEventListener("click", () => {
      webtoolsTimestampDateInput = dateInput.value;
      void executeWebtoolsTimestampAction("toTimestamp", webtoolsTimestampDateInput, {
        render: false,
        form
      });
    });

    toTimestampControls.append(dateInput, toTimestampButton);

    const toTimestampResult = document.createElement("div");
    toTimestampResult.className = "webtools-timestamp-result";
    const toTimestampResultLabel = document.createElement("label");
    toTimestampResultLabel.className = "webtools-timestamp-result-label";
    toTimestampResultLabel.textContent = "Unix 时间戳 (";
    const unitLabel = document.createElement("span");
    unitLabel.dataset.webtoolsTimestampUnitLabel = "1";
    unitLabel.textContent = webtoolsTimestampUnit === "s" ? "秒 (s)" : "毫秒 (ms)";
    toTimestampResultLabel.append(unitLabel, "):");

    const toTimestampResultValue = document.createElement("input");
    toTimestampResultValue.type = "text";
    toTimestampResultValue.readOnly = true;
    toTimestampResultValue.className = "settings-number webtools-timestamp-result-input";
    toTimestampResultValue.name = "webtoolsTimestampTimestampOutput";
    toTimestampResultValue.value = webtoolsTimestampTimestampOutput;
    toTimestampResult.append(toTimestampResultLabel, toTimestampResultValue);

    toTimestampSection.append(toTimestampTitle, toTimestampControls, toTimestampResult);

    const infoLine = document.createElement("div");
    infoLine.className = "webtools-timestamp-info";
    const infoLabel = document.createElement("span");
    infoLabel.className = "webtools-timestamp-info-label";
    infoLabel.textContent = "结果说明:";
    const infoValue = document.createElement("span");
    infoValue.className = "webtools-timestamp-info-value";
    infoValue.textContent = webtoolsTimestampInfo || "-";
    infoLine.append(infoLabel, infoValue);

    unixInput.addEventListener("input", () => {
      webtoolsTimestampUnixInput = unixInput.value;
      scheduleWebtoolsTimestampAutoConvert(form, "toDate");
    });

    dateInput.addEventListener("input", () => {
      webtoolsTimestampDateInput = dateInput.value;
      scheduleWebtoolsTimestampAutoConvert(form, "toTimestamp");
    });

    unitSelect.addEventListener("change", () => {
      const previousUnit = webtoolsTimestampUnit;
      const nextUnit = normalizeWebtoolsTimestampUnit(unitSelect.value);
      // Re-express the existing unix value in the newly selected unit so the left
      // field visibly tracks the unit (s <-> ms multiplies/divides by 1000).
      const convertedUnix = convertWebtoolsTimestampUnixValue(
        webtoolsTimestampUnixInput,
        previousUnit,
        nextUnit
      );
      if (convertedUnix !== null) {
        webtoolsTimestampUnixInput = convertedUnix;
        unixInput.value = convertedUnix;
      }
      webtoolsTimestampUnit = nextUnit;
      updateCurrentClock();
      refreshWebtoolsTimestampResultInForm(form);
      void executeWebtoolsTimestampAction("toDate", webtoolsTimestampUnixInput, {
        render: false,
        form
      });
      void executeWebtoolsTimestampAction("toTimestamp", webtoolsTimestampDateInput, {
        render: false,
        form
      });
    });

    form.append(currentLine, toDateSection, divider, toTimestampSection, infoLine);
    panel.append(title, description, form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    void executeWebtoolsTimestampAction("toDate", webtoolsTimestampUnixInput, {
      render: false,
      form
    });
    void executeWebtoolsTimestampAction("toTimestamp", webtoolsTimestampDateInput, {
      render: false,
      form
    });
  },

  applyWebtoolsRegexPanelPayload(panel: ActivePluginPanelState): void {
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
    if (!webtoolsRegexPattern.trim()) {
      webtoolsRegexPattern = WEBTOOLS_REGEX_DEFAULT_PATTERN;
    }
    if (!webtoolsRegexInput.trim()) {
      webtoolsRegexInput = WEBTOOLS_REGEX_DEFAULT_INPUT;
    }
    webtoolsRegexOutput = "";
    webtoolsRegexInfo = "";
    webtoolsRegexError = "";
    webtoolsRegexHighlightedHtml = "";
    webtoolsRegexRows = [];
  },

  renderWebtoolsRegexPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-regex-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-regex-form webtools-tool-panel";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const patternNode = form.elements.namedItem("webtoolsRegexPattern");
      const flagsNode = form.elements.namedItem("webtoolsRegexFlags");
      const inputNode = form.elements.namedItem("webtoolsRegexInput");
      webtoolsRegexPattern = patternNode instanceof HTMLInputElement ? patternNode.value : "";
      webtoolsRegexFlags = flagsNode instanceof HTMLInputElement ? flagsNode.value : "g";
      webtoolsRegexInput = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
      refreshWebtoolsRegexState();
      refreshWebtoolsRegexPreviewInForm(form);
      setStatus(webtoolsRegexError || webtoolsRegexInfo || "已刷新正则结果");
    });

    const header = document.createElement("div");
    header.className = "webtools-tool-header webtools-regex-header";
    const titleGroup = document.createElement("div");
    titleGroup.className = "webtools-tool-title-group";
    const title = document.createElement("h3");
    title.className = "webtools-tool-title webtools-regex-title";
    title.textContent = activePluginPanel?.title || "正则测试";
    const description = document.createElement("p");
    description.className = "webtools-tool-subtitle";
    description.textContent =
      activePluginPanel?.subtitle || "实时匹配高亮，内置常用正则模板。";
    titleGroup.append(title, description);

    const toolbar = document.createElement("div");
    toolbar.className = "webtools-tool-toolbar";
    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "settings-btn settings-btn-secondary";
    resetButton.textContent = "重置";
    resetButton.addEventListener("click", () => {
      webtoolsRegexPattern = WEBTOOLS_REGEX_DEFAULT_PATTERN;
      webtoolsRegexFlags = "g";
      webtoolsRegexInput = WEBTOOLS_REGEX_DEFAULT_INPUT;
      webtoolsRegexReplacement = "";

      const patternNode = form.elements.namedItem("webtoolsRegexPattern");
      if (patternNode instanceof HTMLInputElement) {
        patternNode.value = webtoolsRegexPattern;
      }
      const flagsNode = form.elements.namedItem("webtoolsRegexFlags");
      if (flagsNode instanceof HTMLInputElement) {
        flagsNode.value = webtoolsRegexFlags;
      }
      const inputNode = form.elements.namedItem("webtoolsRegexInput");
      if (inputNode instanceof HTMLTextAreaElement) {
        inputNode.value = webtoolsRegexInput;
      }

      refreshWebtoolsRegexState();
      refreshWebtoolsRegexPreviewInForm(form);
      setStatus("已重置正则测试");
    });
    toolbar.append(resetButton);
    header.append(titleGroup, toolbar);

    const inputBar = document.createElement("div");
    inputBar.className = "webtools-regex-input-section";
    const line = document.createElement("div");
    line.className = "webtools-regex-input-line";
    const slashLeft = document.createElement("span");
    slashLeft.className = "webtools-regex-slash";
    slashLeft.textContent = "/";
    const patternInput = document.createElement("input");
    patternInput.className = "settings-value webtools-regex-main";
    patternInput.name = "webtoolsRegexPattern";
    patternInput.value = webtoolsRegexPattern;
    patternInput.placeholder = "正则表达式";
    const slashRight = document.createElement("span");
    slashRight.className = "webtools-regex-slash";
    slashRight.textContent = "/";
    const flagsInput = document.createElement("input");
    flagsInput.className = "settings-value webtools-regex-flags";
    flagsInput.type = "text";
    flagsInput.name = "webtoolsRegexFlags";
    flagsInput.value = webtoolsRegexFlags;
    flagsInput.placeholder = "g";
    flagsInput.title = "g, i, m, s, u, y, d";
    line.append(slashLeft, patternInput, slashRight, flagsInput);
    const error = document.createElement("div");
    error.className = "webtools-regex-error";
    error.hidden = true;
    inputBar.append(line, error);

    const templates = document.createElement("div");
    templates.className = "webtools-regex-templates";
    const templatesLabel = document.createElement("span");
    templatesLabel.className = "webtools-regex-templates-label";
    templatesLabel.textContent = "模板";
    templates.appendChild(templatesLabel);
    WEBTOOLS_REGEX_TEMPLATES.forEach((template) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "webtools-regex-template-btn";
      button.textContent = template.label;
      button.addEventListener("click", () => {
        webtoolsRegexPattern = template.pattern;
        webtoolsRegexFlags = template.flags;
        patternInput.value = webtoolsRegexPattern;
        flagsInput.value = webtoolsRegexFlags;
        refreshWebtoolsRegexState();
        refreshWebtoolsRegexPreviewInForm(form);
        setStatus(`已应用模板：${template.label}`);
      });
      templates.appendChild(button);
    });

    const layout = document.createElement("div");
    layout.className = "webtools-regex-layout";

    const inputPane = document.createElement("div");
    inputPane.className = "webtools-regex-pane";
    const inputLabel = document.createElement("label");
    inputLabel.className = "webtools-regex-pane-label";
    inputLabel.textContent = "测试文本";
    const inputArea = document.createElement("textarea");
    inputArea.className = "settings-value webtools-textarea webtools-regex-textarea";
    inputArea.name = "webtoolsRegexInput";
    inputArea.value = webtoolsRegexInput;
    inputArea.placeholder = "输入待测试文本";
    inputPane.append(inputLabel, inputArea);

    const previewPane = document.createElement("div");
    previewPane.className = "webtools-regex-pane";
    const previewLabel = document.createElement("label");
    previewLabel.className = "webtools-regex-pane-label";
    previewLabel.textContent = "匹配结果";
    const previewBox = document.createElement("div");
    previewBox.className = "webtools-regex-highlight-box";
    previewPane.append(previewLabel, previewBox);
    layout.append(inputPane, previewPane);

    const footer = document.createElement("div");
    footer.className = "webtools-regex-footer";
    const info = document.createElement("div");
    info.className = "webtools-regex-info";
    const matchList = document.createElement("div");
    matchList.className = "webtools-regex-match-list";
    footer.append(info, matchList);

    const refresh = () => {
      webtoolsRegexPattern = patternInput.value;
      webtoolsRegexFlags = flagsInput.value || "g";
      webtoolsRegexInput = inputArea.value;
      refreshWebtoolsRegexState();
      refreshWebtoolsRegexPreviewInForm(form);
    };

    patternInput.addEventListener("input", refresh);
    flagsInput.addEventListener("input", refresh);
    inputArea.addEventListener("input", refresh);

    form.append(header, inputBar, templates, layout, footer);
    panel.append(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsRegexState();
    refreshWebtoolsRegexPreviewInForm(form);
  },

  applyWebtoolsCryptoPanelPayload(panel: ActivePluginPanelState): void {
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
},

  renderWebtoolsCryptoPanel(): void {
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

  const closeAlgorithmMenu = (): void => {
    algorithmPicker.dataset.open = "false";
    algorithmTrigger.setAttribute("aria-expanded", "false");
    if (removeActiveCryptoAlgorithmMenuListener) {
      removeActiveCryptoAlgorithmMenuListener();
      removeActiveCryptoAlgorithmMenuListener = null;
    }
  };

  const openAlgorithmMenu = (): void => {
    if (algorithmPicker.dataset.open === "true") {
      return;
    }
    // Closing any listener left over from a stale render before attaching
    // a new one keeps at most one document-level listener alive at a time.
    if (removeActiveCryptoAlgorithmMenuListener) {
      removeActiveCryptoAlgorithmMenuListener();
      removeActiveCryptoAlgorithmMenuListener = null;
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
    removeActiveCryptoAlgorithmMenuListener = () => {
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
},

  applyWebtoolsJwtPanelPayload(panel: ActivePluginPanelState): void {
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
},

  renderWebtoolsJwtPanel(): void {
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
},

  applyWebtoolsDiffPanelPayload(panel: ActivePluginPanelState): void {
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
},

  renderWebtoolsDiffPanel(): void {
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
},

  applyWebtoolsImageBase64PanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    webtoolsImageBase64Input = data && typeof data.input === "string" ? data.input : "";
    webtoolsImageBase64DataUrl = "";
    webtoolsImageBase64Raw = "";
    webtoolsImageBase64Mime = "";
    webtoolsImageBase64SizeText = "";
    webtoolsImageBase64Info = "";
    webtoolsImageBase64Error = "";
    webtoolsImageBase64Dragging = false;
    webtoolsImageBase64FileName = "";
  },

  renderWebtoolsImageBase64Panel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-image-base64-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-image-base64-form";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsImageBase64Normalize(input.value, { render: false, form });
    });

    const header = document.createElement("div");
    header.className = "webtools-image-base64-header";

    const headerText = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "settings-title webtools-image-base64-title";
    title.textContent = activePluginPanel?.title || "图片 Base64";
    const description = document.createElement("p");
    description.className = "settings-description webtools-image-base64-description";
    description.textContent =
      activePluginPanel?.subtitle || "拖入图片或粘贴 Base64 / DataURL，实时转换、预览与导出。";
    headerText.append(title, description);

    const toolbar = document.createElement("div");
    toolbar.className = "webtools-image-base64-toolbar";

    const previewHost = document.createElement("div");
    previewHost.className = "webtools-image-base64-preview-host";

    const meta = document.createElement("div");
    meta.className = "webtools-image-base64-meta";

    const dropzone = document.createElement("div");
    dropzone.className = "webtools-image-base64-dropzone";

    const dropzoneTitle = document.createElement("div");
    dropzoneTitle.className = "webtools-image-base64-dropzone-title";
    dropzoneTitle.textContent = "拖拽图片到这里";

    const dropzoneHint = document.createElement("div");
    dropzoneHint.className = "webtools-image-base64-dropzone-hint";
    dropzoneHint.textContent = "支持 PNG、JPG、WebP、GIF、SVG，也可以直接粘贴 DataURL。";

    const uploadButton = document.createElement("label");
    uploadButton.className = "settings-btn settings-btn-secondary webtools-image-base64-upload";
    uploadButton.textContent = "选择图片";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.className = "webtools-image-base64-file-input";
    uploadButton.appendChild(fileInput);
    dropzone.append(dropzoneTitle, dropzoneHint, uploadButton);

    const input = document.createElement("textarea");
    input.className = "settings-value webtools-textarea webtools-image-base64-textarea";
    input.name = "webtoolsImageBase64Input";
    input.value = webtoolsImageBase64Input;
    input.placeholder = "粘贴 Base64 或 DataURL，或从左侧拖入图片。";

    const output = document.createElement("textarea");
    output.className = "settings-value webtools-textarea webtools-image-base64-textarea";
    output.readOnly = true;
    output.value = webtoolsImageBase64DataUrl;
    output.setAttribute("data-webtools-image-base64-output", "1");
    output.placeholder = "转换后会在这里输出完整 DataURL。";

    const info = document.createElement("div");
    info.className = "webtools-tool-info";

    const copyRaw = document.createElement("button");
    copyRaw.type = "button";
    copyRaw.className = "settings-btn settings-btn-secondary";
    copyRaw.textContent = "复制 Base64";
    copyRaw.setAttribute("data-webtools-image-copy-raw", "1");

    const copyDataUrl = document.createElement("button");
    copyDataUrl.type = "button";
    copyDataUrl.className = "settings-btn settings-btn-secondary";
    copyDataUrl.textContent = "复制 DataURL";
    copyDataUrl.setAttribute("data-webtools-image-copy-dataurl", "1");

    const download = document.createElement("button");
    download.type = "button";
    download.className = "settings-btn settings-btn-primary";
    download.textContent = "下载图片";
    download.setAttribute("data-webtools-image-download", "1");

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "settings-btn settings-btn-secondary";
    clear.textContent = "清空";
    clear.setAttribute("data-webtools-image-clear", "1");

    toolbar.append(copyRaw, copyDataUrl, download, clear);
    header.append(headerText, toolbar);

    const layout = document.createElement("div");
    layout.className = "webtools-image-base64-layout";

    const previewPane = document.createElement("section");
    previewPane.className = "webtools-image-base64-preview";
    previewPane.append(previewHost, meta, dropzone);

    const editorPane = document.createElement("section");
    editorPane.className = "webtools-image-base64-editor";

    const inputWrap = document.createElement("label");
    inputWrap.className = "webtools-colors-section";
    const inputLabel = document.createElement("span");
    inputLabel.className = "webtools-image-base64-input-label";
    inputLabel.textContent = "输入内容";
    inputWrap.append(inputLabel, input);

    const outputWrap = document.createElement("label");
    outputWrap.className = "webtools-colors-section";
    const outputLabel = document.createElement("span");
    outputLabel.className = "webtools-image-base64-input-label";
    outputLabel.textContent = "标准化输出";
    outputWrap.append(outputLabel, output);

    editorPane.append(inputWrap, info, outputWrap);
    layout.append(previewPane, editorPane);

    const loadImageFile = async (file: File): Promise<void> => {
      if (!file.type.startsWith("image/")) {
        setStatus("请选择图片文件");
        return;
      }
      try {
        const dataUrl = await readWebtoolsImageBase64FileAsDataUrl(file);
        webtoolsImageBase64Dragging = false;
        webtoolsImageBase64FileName = file.name;
        webtoolsImageBase64Input = dataUrl;
        input.value = dataUrl;
        refreshWebtoolsImageBase64PanelInForm(form);
        await executeWebtoolsImageBase64Normalize(dataUrl, { render: false, form });
      } catch (error) {
        webtoolsImageBase64Dragging = false;
        webtoolsImageBase64DataUrl = "";
        webtoolsImageBase64Raw = "";
        webtoolsImageBase64Mime = "";
        webtoolsImageBase64SizeText = "";
        webtoolsImageBase64Info = "";
        webtoolsImageBase64Error =
          error instanceof Error && error.message.trim() ? error.message : "读取图片失败";
        refreshWebtoolsImageBase64PanelInForm(form);
        setStatus(webtoolsImageBase64Error);
      }
    };

    copyRaw.addEventListener("click", async () => {
      if (!webtoolsImageBase64Raw.trim()) {
        setStatus("没有可复制的 Base64");
        return;
      }
      await navigator.clipboard.writeText(webtoolsImageBase64Raw);
      setStatus("已复制 Base64");
    });

    copyDataUrl.addEventListener("click", async () => {
      if (!webtoolsImageBase64DataUrl.trim()) {
        setStatus("没有可复制的 DataURL");
        return;
      }
      await navigator.clipboard.writeText(webtoolsImageBase64DataUrl);
      setStatus("已复制 DataURL");
    });

    download.addEventListener("click", () => {
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
      schedulePluginNativeInteractionRelease();
      setStatus("已开始下载图片");
    });

    clear.addEventListener("click", () => {
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
      input.value = "";
      fileInput.value = "";
      refreshWebtoolsImageBase64PanelInForm(form);
      setStatus("已清空");
    });

    input.addEventListener("input", () => {
      webtoolsImageBase64Input = input.value;
      webtoolsImageBase64FileName = "";
      scheduleWebtoolsImageBase64AutoNormalize(form);
    });

    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) {
        return;
      }
      void loadImageFile(file);
      fileInput.value = "";
    });

    dropzone.addEventListener("dragenter", (event) => {
      event.preventDefault();
      webtoolsImageBase64Dragging = true;
      refreshWebtoolsImageBase64PanelInForm(form);
    });
    dropzone.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (!webtoolsImageBase64Dragging) {
        webtoolsImageBase64Dragging = true;
        refreshWebtoolsImageBase64PanelInForm(form);
      }
    });
    dropzone.addEventListener("dragleave", (event) => {
      event.preventDefault();
      webtoolsImageBase64Dragging = false;
      refreshWebtoolsImageBase64PanelInForm(form);
    });
    dropzone.addEventListener("drop", (event) => {
      event.preventDefault();
      webtoolsImageBase64Dragging = false;
      refreshWebtoolsImageBase64PanelInForm(form);
      const file = event.dataTransfer?.files?.[0];
      if (!file) {
        setStatus("未检测到图片文件");
        return;
      }
      void loadImageFile(file);
    });

    form.append(header, layout);
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsImageBase64PanelInForm(form);
    if (webtoolsImageBase64Input.trim()) {
      scheduleWebtoolsImageBase64AutoNormalize(form, true);
    }
  },

  applyWebtoolsImagePromptPanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    webtoolsImagePromptState = normalizeWebtoolsImagePromptState(data);
    webtoolsImagePromptOutput = data && typeof data.output === "string" ? data.output : "";
    webtoolsImagePromptInfo = "";
  },

  renderWebtoolsImagePromptPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-image-prompt-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-image-prompt-form";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsImagePromptBuild(form, { render: false });
    });

    const header = document.createElement("div");
    header.className = "webtools-image-prompt-header";
    const titleGroup = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "webtools-image-prompt-title";
    title.textContent = activePluginPanel?.title || "图片提示词";
    const description = document.createElement("p");
    description.className = "webtools-image-prompt-description";
    description.textContent =
      activePluginPanel?.subtitle || "点选模块生成 ChatGPT Images 2.0 商业提示词";
    titleGroup.append(title, description);

    const productWrap = document.createElement("label");
    productWrap.className = "webtools-image-prompt-product";
    const productLabel = document.createElement("span");
    productLabel.textContent = "产品";
    const productSelect = document.createElement("select");
    productSelect.name = "webtoolsImagePromptProduct";
    productSelect.className = "settings-number webtools-tool-select";
    WEBTOOLS_IMAGE_PROMPT_PRODUCTS.forEach((product) => {
      const option = document.createElement("option");
      option.value = product.id;
      option.textContent = product.label;
      option.selected = webtoolsImagePromptState.productId === product.id;
      productSelect.appendChild(option);
    });
    productSelect.addEventListener("change", () => {
      webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
    });
    productWrap.append(productLabel, productSelect);
    header.append(titleGroup, productWrap);

    const updateSelectionFromState = (state: WebtoolsImagePromptState): void => {
      webtoolsImagePromptState = filterWebtoolsImagePromptStateForStyle(state);
      syncWebtoolsImagePromptForm(form, webtoolsImagePromptState);
    };

    const smartTemplateSection = document.createElement("section");
    smartTemplateSection.className =
      "webtools-image-prompt-preset-section webtools-image-prompt-smart-section";
    const smartTemplateTitle = document.createElement("div");
    smartTemplateTitle.className = "webtools-image-prompt-preset-title";
    smartTemplateTitle.textContent = "智能模板";
    const smartTemplateOptions = document.createElement("div");
    smartTemplateOptions.className = "webtools-image-prompt-template-grid";
    WEBTOOLS_IMAGE_PROMPT_SMART_TEMPLATES.forEach((template) => {
      const templateButton = document.createElement("button");
      templateButton.type = "button";
      templateButton.className = "webtools-image-prompt-template";
      templateButton.dataset.webtoolsImagePromptSmartTemplate = "1";
      templateButton.dataset.selected = String(webtoolsImagePromptSmartTemplateId === template.id);
      templateButton.value = template.id;
      templateButton.title = template.description;
      templateButton.textContent = template.label;
      templateButton.addEventListener("click", () => {
        webtoolsImagePromptRequestToken += 1;
        webtoolsImagePromptSmartTemplateId = template.id;
        syncWebtoolsImagePromptSmartTemplateSelection(smartTemplateOptions);
        const next = createWebtoolsImagePromptSmartTemplateState(template.id);
        next.productId = normalizeWebtoolsImagePromptProductId(productSelect.value);
        const nextPreset = getWebtoolsImagePromptStylePreset(next.stylePresetId);
        webtoolsImagePromptStyleGroup = nextPreset.group;
        webtoolsImagePromptOutput = "";
        updateSelectionFromState(next);
        renderList();
        setStatus(`已套用${template.label}`);
        void executeWebtoolsImagePromptBuild(form, { render: true, state: next });
      });
      smartTemplateOptions.appendChild(templateButton);
    });
    smartTemplateSection.append(smartTemplateTitle, smartTemplateOptions);

    const presetSection = document.createElement("section");
    presetSection.className = "webtools-image-prompt-preset-section";
    const presetTitle = document.createElement("div");
    presetTitle.className = "webtools-image-prompt-preset-title";
    presetTitle.textContent = "风格";
    const styleGroups = Array.from(
      new Set(WEBTOOLS_IMAGE_PROMPT_STYLE_PRESETS_FROM_SHARED.map((preset) => preset.group))
    );
    const activePreset = getWebtoolsImagePromptStylePreset(webtoolsImagePromptState.stylePresetId);
    if (
      !webtoolsImagePromptStyleGroup ||
      !styleGroups.some((group) => group === webtoolsImagePromptStyleGroup)
    ) {
      webtoolsImagePromptStyleGroup = activePreset.group;
    }
    const presetGroupTabs = document.createElement("div");
    presetGroupTabs.className = "webtools-image-prompt-preset-groups";
    styleGroups.forEach((group) => {
      const groupButton = document.createElement("button");
      groupButton.type = "button";
      groupButton.className = "webtools-image-prompt-preset-group";
      groupButton.name = "webtoolsImagePromptStyleGroup";
      groupButton.value = group;
      groupButton.dataset.selected = String(webtoolsImagePromptStyleGroup === group);
      groupButton.textContent = group;
      groupButton.addEventListener("click", () => {
        webtoolsImagePromptStyleGroup = group;
        renderList();
      });
      presetGroupTabs.appendChild(groupButton);
    });
    const presetOptions = document.createElement("div");
    presetOptions.className = "webtools-image-prompt-preset-options";
    WEBTOOLS_IMAGE_PROMPT_STYLE_PRESETS_FROM_SHARED.filter(
      (preset) => preset.group === webtoolsImagePromptStyleGroup
    ).forEach((preset) => {
      const presetChip = document.createElement("label");
      presetChip.className = "webtools-image-prompt-preset-chip";
      presetChip.dataset.selected = String(webtoolsImagePromptState.stylePresetId === preset.id);
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "webtoolsImagePromptStylePreset";
      input.value = preset.id;
      input.checked = webtoolsImagePromptState.stylePresetId === preset.id;
      input.addEventListener("change", () => {
        if (!input.checked) {
          return;
        }
        webtoolsImagePromptRequestToken += 1;
        const next = createDefaultWebtoolsImagePromptState(preset.id);
        next.productId = normalizeWebtoolsImagePromptProductId(productSelect.value);
        webtoolsImagePromptState = next;
        webtoolsImagePromptStyleGroup = preset.group;
        webtoolsImagePromptSmartTemplateId = "";
        webtoolsImagePromptOutput = "";
        webtoolsImagePromptInfo = "";
        renderList();
        setStatus(`已切换到${preset.label}`);
      });
      const label = document.createElement("strong");
      label.textContent = preset.label;
      const description = document.createElement("span");
      description.textContent = preset.description;
      presetChip.append(input, label, description);
      presetOptions.appendChild(presetChip);
    });
    presetSection.append(presetTitle, presetGroupTabs, presetOptions);

    const grid = document.createElement("div");
    grid.className = "webtools-image-prompt-grid";
    const createChip = (
      name: string,
      value: string,
      selected: boolean,
      onChange?: () => void
    ): HTMLLabelElement => {
      const chip = document.createElement("label");
      chip.className = "webtools-image-prompt-chip";
      chip.dataset.selected = String(selected);
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = name;
      input.value = value;
      input.checked = selected;
      input.addEventListener("change", () => {
        chip.dataset.selected = String(input.checked);
        webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
        onChange?.();
      });
      const text = document.createElement("span");
      text.textContent = value;
      chip.append(input, text);
      return chip;
    };

    getWebtoolsImagePromptOptionGroupsForStyle(webtoolsImagePromptState.stylePresetId).forEach((group) => {
      const row = document.createElement("section");
      row.className = "webtools-image-prompt-field";
      row.dataset.group = group.key;
      const fieldHead = document.createElement("span");
      fieldHead.className = "webtools-image-prompt-field-head";
      const fieldLabel = document.createElement("strong");
      fieldLabel.textContent = group.label;
      const hint = document.createElement("span");
      hint.textContent = group.description;
      fieldHead.append(fieldLabel, hint);

      const options = document.createElement("div");
      options.className = "webtools-image-prompt-options";
      const selected = new Set(
        getWebtoolsImagePromptSelectedOptions(webtoolsImagePromptState, group.key)
      );
      const categories = group.categories ?? [{ label: "", options: group.options }];
      categories.forEach((category) => {
        const categoryBlock = document.createElement("div");
        categoryBlock.className = "webtools-image-prompt-category";
        if (category.label) {
          const categoryTitle = document.createElement("div");
          categoryTitle.className = "webtools-image-prompt-category-title";
          categoryTitle.textContent = category.label;
          categoryBlock.appendChild(categoryTitle);
        }
        const categoryOptions = document.createElement("div");
        categoryOptions.className = "webtools-image-prompt-options";
        const isExpanded = webtoolsImagePromptExpandedGroups.has(group.key);
        const visibleOptions = isExpanded
          ? category.options
          : compactWebtoolsImagePromptOptions([
              ...category.options.slice(0, WEBTOOLS_IMAGE_PROMPT_VISIBLE_OPTION_LIMIT),
              ...category.options.filter((option) => selected.has(option))
            ]);
        visibleOptions.forEach((option) => {
          categoryOptions.appendChild(
            createChip(
              `webtoolsImagePromptSelection-${group.key}`,
              option,
              selected.has(option)
            )
          );
        });
        categoryBlock.appendChild(categoryOptions);
        options.appendChild(categoryBlock);
      });
      row.append(fieldHead, options);

      if (group.options.length > WEBTOOLS_IMAGE_PROMPT_VISIBLE_OPTION_LIMIT) {
        const moreButton = document.createElement("button");
        moreButton.type = "button";
        moreButton.className = "webtools-image-prompt-more";
        moreButton.textContent = webtoolsImagePromptExpandedGroups.has(group.key)
          ? "收起"
          : `更多 ${group.options.length - WEBTOOLS_IMAGE_PROMPT_VISIBLE_OPTION_LIMIT} 项`;
        moreButton.addEventListener("click", () => {
          if (webtoolsImagePromptExpandedGroups.has(group.key)) {
            webtoolsImagePromptExpandedGroups.delete(group.key);
          } else {
            webtoolsImagePromptExpandedGroups.add(group.key);
          }
          renderList();
        });
        row.appendChild(moreButton);
      }

      if (group.allowCustom && group.key !== "constraints") {
        const customInput = document.createElement("input");
        customInput.type = "text";
        customInput.className =
          "settings-value webtools-tool-input webtools-image-prompt-custom";
        customInput.name = `webtoolsImagePromptCustom-${group.key}`;
        customInput.value = webtoolsImagePromptState.custom[group.key];
        customInput.placeholder = "自定义补充";
        customInput.addEventListener("input", () => {
          webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
        });
        row.appendChild(customInput);
      }
      grid.appendChild(row);
    });

    const textBlock = document.createElement("section");
    textBlock.className = "webtools-image-prompt-field webtools-image-prompt-text-block";
    const textHead = document.createElement("span");
    textHead.className = "webtools-image-prompt-field-head";
    const textLabel = document.createElement("strong");
    textLabel.textContent = "文字";
    const textHint = document.createElement("span");
    textHint.textContent = "EXACT 文案、位置、字形、场景化文字设计和出现次数";
    textHead.append(textLabel, textHint);

    const textControls = document.createElement("div");
    textControls.className = "webtools-image-prompt-text-controls";
    const exactInput = document.createElement("input");
    exactInput.type = "text";
    exactInput.name = "webtoolsImagePromptTextExact";
    exactInput.className = "settings-value webtools-tool-input";
    exactInput.placeholder = "例如：降噪黑科技";
    exactInput.value = webtoolsImagePromptState.text.exact;
    exactInput.addEventListener("input", () => {
      webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
    });

    const positionSelect = document.createElement("select");
    positionSelect.name = "webtoolsImagePromptTextPosition";
    positionSelect.className = "settings-number webtools-tool-select";
    WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.positions.forEach((position) => {
      const option = document.createElement("option");
      option.value = position;
      option.textContent = position;
      option.selected = webtoolsImagePromptState.text.position === position;
      positionSelect.appendChild(option);
    });
    positionSelect.addEventListener("change", () => {
      webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
    });

    const styleSelect = document.createElement("select");
    styleSelect.name = "webtoolsImagePromptTextStyle";
    styleSelect.className = "settings-number webtools-tool-select";
    WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.styles.forEach((style) => {
      const option = document.createElement("option");
      option.value = style;
      option.textContent = style;
      option.selected = webtoolsImagePromptState.text.style === style;
      styleSelect.appendChild(option);
    });
    styleSelect.addEventListener("change", () => {
      webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
    });

    const designSelect = document.createElement("select");
    designSelect.name = "webtoolsImagePromptTextDesign";
    designSelect.className = "settings-number webtools-tool-select";
    WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.designs.forEach((design) => {
      const option = document.createElement("option");
      option.value = design.id;
      option.textContent = design.label;
      option.selected = webtoolsImagePromptState.text.designId === design.id;
      designSelect.appendChild(option);
    });
    designSelect.addEventListener("change", () => {
      webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
      renderList();
    });

    const subtitleInput = document.createElement("input");
    subtitleInput.type = "text";
    subtitleInput.name = "webtoolsImagePromptTextSubtitle";
    subtitleInput.className = "settings-value webtools-tool-input";
    subtitleInput.placeholder = "副标题，可留空";
    subtitleInput.value = webtoolsImagePromptState.text.subtitle;
    subtitleInput.addEventListener("input", () => {
      webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
    });

    textControls.append(exactInput, positionSelect, styleSelect, designSelect, subtitleInput);

    const selectedTextDesign = findWebtoolsImagePromptTextDesign(
      webtoolsImagePromptState.text.designId
    );
    const designCard = document.createElement("div");
    designCard.className = "webtools-image-prompt-text-design-card";
    const designCardTitle = document.createElement("strong");
    designCardTitle.textContent = selectedTextDesign.label;
    const designSummary = document.createElement("span");
    designSummary.textContent = selectedTextDesign.summary;
    const designDetails = document.createElement("div");
    designDetails.className = "webtools-image-prompt-text-design-details";
    [
      ["字形", selectedTextDesign.typography],
      ["颜色", selectedTextDesign.color],
      ["效果", selectedTextDesign.effect],
      ["布局", selectedTextDesign.layout],
      ["安全区", selectedTextDesign.safeArea]
    ].forEach(([labelText, valueText]) => {
      const item = document.createElement("span");
      item.textContent = `${labelText}：${valueText}`;
      designDetails.appendChild(item);
    });
    const keywordRow = document.createElement("div");
    keywordRow.className = "webtools-image-prompt-text-design-keywords";
    selectedTextDesign.keywords.forEach((keyword) => {
      const keywordChip = document.createElement("span");
      keywordChip.textContent = keyword;
      keywordRow.appendChild(keywordChip);
    });
    designCard.append(designCardTitle, designSummary, designDetails, keywordRow);

    const textFlags = document.createElement("div");
    textFlags.className = "webtools-image-prompt-options";
    const selectedFlags = new Set(webtoolsImagePromptState.text.flags);
    WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.flags.forEach((flag) => {
      textFlags.appendChild(
        createChip("webtoolsImagePromptTextFlag", flag, selectedFlags.has(flag))
      );
    });
    textBlock.append(textHead, textControls, designCard, textFlags);
    if (webtoolsImagePromptState.stylePresetId === "birthday-party") {
      const photoControls = document.createElement("div");
      photoControls.className = "webtools-image-prompt-photo-controls";

      const createBirthdayInput = (
        name: string,
        labelText: string,
        placeholder: string,
        value: string
      ): HTMLLabelElement => {
        const wrap = document.createElement("label");
        wrap.className = "webtools-image-prompt-photo-input";
        const label = document.createElement("span");
        label.textContent = labelText;
        const input = document.createElement("input");
        input.type = "text";
        input.name = name;
        input.className = "settings-value webtools-tool-input";
        input.placeholder = placeholder;
        input.value = value;
        input.addEventListener("input", () => {
          webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
        });
        wrap.append(label, input);
        return wrap;
      };

      const photoWrap = document.createElement("label");
      photoWrap.className = "webtools-image-prompt-photo-input";
      const photoLabel = document.createElement("span");
      photoLabel.textContent = "照片 / 人物";
      const photoInput = document.createElement("input");
      photoInput.type = "text";
      photoInput.name = "webtoolsImagePromptPhotoDescription";
      photoInput.className = "settings-value webtools-tool-input";
      photoInput.placeholder = "例如：3岁小女孩，穿白色连衣裙，笑着看镜头";
      photoInput.value = webtoolsImagePromptState.photoDescription;
      photoInput.addEventListener("input", () => {
        webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
      });
      photoWrap.append(photoLabel, photoInput);

      const birthdayFields = document.createElement("div");
      birthdayFields.className = "webtools-image-prompt-birthday-fields";
      birthdayFields.append(
        createBirthdayInput(
          "webtoolsImagePromptTextAge",
          "年龄",
          "例如：3周岁",
          webtoolsImagePromptState.text.age
        ),
        createBirthdayInput(
          "webtoolsImagePromptTextTitle",
          "祝福语",
          "例如：生日快乐",
          webtoolsImagePromptState.text.title
        ),
        createBirthdayInput(
          "webtoolsImagePromptTextName",
          "姓名",
          "可留空",
          webtoolsImagePromptState.text.name
        ),
        createBirthdayInput(
          "webtoolsImagePromptTextLabel",
          "小标签",
          "例如：HAPPY BIRTHDAY",
          webtoolsImagePromptState.text.label
        )
      );

      const birthdayExamples = document.createElement("div");
      birthdayExamples.className = "webtools-image-prompt-birthday-examples";
      WEBTOOLS_IMAGE_PROMPT_BIRTHDAY_EXAMPLES.forEach((example) => {
        const exampleChip = document.createElement("button");
        exampleChip.type = "button";
        exampleChip.className = "webtools-image-prompt-template";
        exampleChip.textContent = example.label;
        exampleChip.addEventListener("click", () => {
          webtoolsImagePromptSmartTemplateId = "";
          updateSelectionFromState(cloneWebtoolsImagePromptState(example.state));
          void executeWebtoolsImagePromptBuild(form, { render: false });
        });
        birthdayExamples.appendChild(exampleChip);
      });

      photoControls.append(photoWrap, birthdayFields, birthdayExamples);
      textBlock.appendChild(photoControls);
    }
    grid.appendChild(textBlock);

    const outputBlock = document.createElement("div");
    outputBlock.className = "webtools-image-prompt-output-block";
    const outputHead = document.createElement("div");
    outputHead.className = "webtools-image-prompt-output-head";
    const outputTitle = document.createElement("span");
    outputTitle.textContent = "生成提示词";
    const info = document.createElement("span");
    info.className = "webtools-image-prompt-info";
    outputHead.append(outputTitle, info);
    const output = document.createElement("textarea");
    output.className = "settings-value webtools-textarea webtools-image-prompt-output";
    output.name = "webtoolsImagePromptOutput";
    output.readOnly = true;
    output.value = webtoolsImagePromptOutput;
    outputBlock.append(outputHead, output);

    const actions = document.createElement("div");
    actions.className = "settings-actions webtools-image-prompt-actions";

    const buildButton = document.createElement("button");
    buildButton.type = "submit";
    buildButton.className = "settings-btn settings-btn-primary";
    buildButton.textContent = "生成提示词";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "settings-btn settings-btn-secondary";
    copyButton.dataset.webtoolsImagePromptCopy = "1";
    copyButton.textContent = "复制";
    copyButton.addEventListener("click", async () => {
      if (!webtoolsImagePromptOutput.trim()) {
        setStatus("当前没有可复制的提示词");
        return;
      }
      const copied = await copyTextToClipboard(webtoolsImagePromptOutput);
      if (!copied) {
        webtoolsImagePromptInfo = "复制失败";
        refreshWebtoolsImagePromptPanelInForm(form);
        setStatus("复制失败");
        return;
      }

      webtoolsImagePromptInfo = "已复制到剪贴板";
      refreshWebtoolsImagePromptPanelInForm(form);
      copyButton.textContent = "已复制";
      copyButton.dataset.state = "ok";
      const feedbackToken = String(Date.now());
      copyButton.dataset.feedbackToken = feedbackToken;
      window.setTimeout(() => {
        if (copyButton.dataset.feedbackToken !== feedbackToken) {
          return;
        }
        copyButton.textContent = "复制";
        delete copyButton.dataset.state;
        delete copyButton.dataset.feedbackToken;
        copyButton.disabled = !webtoolsImagePromptOutput.trim();
      }, 1200);
      setStatus("已复制图片提示词");
    });

    const exampleButton = document.createElement("button");
    exampleButton.type = "button";
    exampleButton.className = "settings-btn settings-btn-secondary";
    exampleButton.textContent = "耳机示例";
    exampleButton.addEventListener("click", () => {
      webtoolsImagePromptSmartTemplateId = "";
      updateSelectionFromState(cloneWebtoolsImagePromptState(WEBTOOLS_IMAGE_PROMPT_EXAMPLE));
      void executeWebtoolsImagePromptBuild(form, { render: false });
    });

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "settings-btn settings-btn-secondary";
    clearButton.textContent = "清空";
    clearButton.addEventListener("click", () => {
      webtoolsImagePromptRequestToken += 1;
      webtoolsImagePromptSmartTemplateId = "";
      updateSelectionFromState(createClearedWebtoolsImagePromptState());
      webtoolsImagePromptOutput = "";
      webtoolsImagePromptInfo = "";
      refreshWebtoolsImagePromptPanelInForm(form);
      setStatus("已清空图片提示词");
    });

    actions.append(buildButton, copyButton, exampleButton, clearButton);
    form.append(header, smartTemplateSection, presetSection, grid, outputBlock, actions);
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);
    refreshWebtoolsImagePromptPanelInForm(form);
  },

  applyWebtoolsConfigPanelPayload(panel: ActivePluginPanelState): void {
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
},

  renderWebtoolsConfigPanel(): void {
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
},

  applyWebtoolsSqlPanelPayload(panel: ActivePluginPanelState): void {
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
},

  renderWebtoolsSqlPanel(): void {
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
},

  applyWebtoolsUnitPanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    if (data && typeof data.storageValue === "number") {
      webtoolsUnitStorageValue = data.storageValue;
    }
    if (data && typeof data.storageUnit === "string") {
      const normalized = data.storageUnit.toUpperCase();
      if (
        normalized === "B" ||
        normalized === "KB" ||
        normalized === "MB" ||
        normalized === "GB" ||
        normalized === "TB"
      ) {
        webtoolsUnitStorageUnit = normalized;
      }
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
    updateWebtoolsUnitStorageFrom(webtoolsUnitStorageUnit, webtoolsUnitStorageValue);
  },

  renderWebtoolsUnitPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-unit-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-unit-form webtools-tool-panel";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      refreshWebtoolsUnitPanelInForm(form);
      setStatus(webtoolsUnitActiveTab === "storage" ? "容量换算完成" : "px/rem 换算完成");
    });

    const createUnitResultCard = (
      labelText: string,
      key: string,
      emptyText = "-"
    ): HTMLDivElement => {
      const card = document.createElement("div");
      card.className = "webtools-unit-card";
      const label = document.createElement("div");
      label.className = "webtools-unit-card-label";
      label.textContent = labelText;
      const value = document.createElement("div");
      value.className = "webtools-unit-card-value";
      value.dataset.webtoolsUnitCard = key;
      value.textContent = emptyText;
      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "settings-btn settings-btn-secondary webtools-unit-copy-btn";
      copyButton.textContent = "复制";
      copyButton.addEventListener("click", () => {
        const content = value.textContent?.trim() ?? "";
        if (!content || content === emptyText) {
          setStatus("当前没有可复制的 " + labelText);
          return;
        }
        void (async () => {
          const copied = await copyTextToClipboard(content);
          setStatus(copied ? "已复制 " + labelText : "复制失败");
        })();
      });
      card.append(label, value, copyButton);
      return card;
    };

    const header = document.createElement("div");
    header.className = "webtools-tool-header";
    const titleGroup = document.createElement("div");
    titleGroup.className = "webtools-tool-title-group";
    const title = document.createElement("h3");
    title.className = "webtools-tool-title";
    title.textContent = activePluginPanel?.title || "单位换算";
    const description = document.createElement("p");
    description.className = "webtools-tool-subtitle";
    description.textContent =
      activePluginPanel?.subtitle || "存储容量与 px/rem 换算。";
    titleGroup.append(title, description);

    const tabs = document.createElement("div");
    tabs.className = "webtools-unit-tabs";
    [
      { id: "storage" as const, label: "容量换算" },
      { id: "screen" as const, label: "px / rem" }
    ].forEach(({ id, label }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "webtools-unit-tab";
      button.dataset.active = String(webtoolsUnitActiveTab === id);
      button.textContent = label;
      button.addEventListener("click", () => {
        webtoolsUnitActiveTab = id;
        renderList();
      });
      tabs.appendChild(button);
    });
    header.append(titleGroup, tabs);
    form.appendChild(header);

    if (webtoolsUnitActiveTab === "storage") {
      const stack = document.createElement("div");
      stack.className = "webtools-unit-storage-stack";
      (
        [
          { unit: "B", label: "Byte (B)" },
          { unit: "KB", label: "KB" },
          { unit: "MB", label: "MB" },
          { unit: "GB", label: "GB" },
          { unit: "TB", label: "TB" }
        ] as Array<{ unit: WebtoolsUnitStorageKey; label: string }>
      ).forEach(({ unit, label }) => {
        const field = document.createElement("label");
        field.className = "webtools-unit-field";
        const fieldLabel = document.createElement("div");
        fieldLabel.className = "webtools-unit-field-label";
        fieldLabel.textContent = label;
        const input = document.createElement("input");
        input.className = "settings-value webtools-tool-input webtools-tool-code";
        input.type = "number";
        input.step = "any";
        input.dataset.unitStorage = unit;
        input.addEventListener("input", () => {
          updateWebtoolsUnitStorageFrom(unit, Number(input.value));
          refreshWebtoolsUnitPanelInForm(form);
        });
        field.append(fieldLabel, input);
        stack.appendChild(field);
      });

      const summaryGrid = document.createElement("div");
      summaryGrid.className = "webtools-unit-grid";
      summaryGrid.append(
        createUnitResultCard("当前 B", "B"),
        createUnitResultCard("当前 KB", "KB"),
        createUnitResultCard("当前 MB", "MB"),
        createUnitResultCard("当前 GB", "GB"),
        createUnitResultCard("当前 TB", "TB")
      );

      const info = document.createElement("div");
      info.className = "webtools-tool-info webtools-unit-info";
      form.append(stack, summaryGrid, info);
      panel.append(form);
      panelItem.appendChild(panel);
      list.appendChild(panelItem);
      refreshWebtoolsUnitPanelInForm(form);
      return;
    }

    const screenBox = document.createElement("div");
    screenBox.className = "webtools-unit-screen-box";

    const rootSetup = document.createElement("div");
    rootSetup.className = "webtools-unit-root-setup";
    const rootLabel = document.createElement("label");
    rootLabel.className = "webtools-unit-root-label";
    rootLabel.textContent = "根字号(px)：";
    const baseInput = document.createElement("input");
    baseInput.className = "settings-value webtools-tool-input webtools-unit-root-input";
    baseInput.type = "number";
    baseInput.step = "0.01";
    baseInput.name = "webtoolsUnitBasePx";
    const rootHint = document.createElement("p");
    rootHint.className = "webtools-unit-root-hint";
    rootHint.textContent = "通常浏览器默认根字号为 16px";
    rootSetup.append(rootLabel, baseInput, rootHint);

    const divider = document.createElement("div");
    divider.className = "webtools-unit-divider";

    const dualInput = document.createElement("div");
    dualInput.className = "webtools-unit-dual-input";
    const pxField = document.createElement("label");
    pxField.className = "webtools-unit-field";
    const pxLabel = document.createElement("div");
    pxLabel.className = "webtools-unit-field-label";
    pxLabel.textContent = "Pixel (px)";
    const pxInput = document.createElement("input");
    pxInput.className = "settings-value webtools-tool-input webtools-tool-code";
    pxInput.type = "number";
    pxInput.step = "0.01";
    pxInput.name = "webtoolsUnitPixel";
    pxField.append(pxLabel, pxInput);

    const swapIcon = document.createElement("div");
    swapIcon.className = "webtools-unit-swap-icon";
    swapIcon.textContent = "⇄";

    const remField = document.createElement("label");
    remField.className = "webtools-unit-field";
    const remLabel = document.createElement("div");
    remLabel.className = "webtools-unit-field-label";
    remLabel.textContent = "REM (rem)";
    const remInput = document.createElement("input");
    remInput.className = "settings-value webtools-tool-input webtools-tool-code";
    remInput.type = "number";
    remInput.step = "0.0001";
    remInput.name = "webtoolsUnitRem";
    remField.append(remLabel, remInput);
    dualInput.append(pxField, swapIcon, remField);

    const summaryGrid = document.createElement("div");
    summaryGrid.className = "webtools-unit-screen-grid";
    summaryGrid.append(
      createUnitResultCard("当前 px", "pixel"),
      createUnitResultCard("当前 rem", "rem"),
      createUnitResultCard("根字号", "basePx")
    );

    const info = document.createElement("div");
    info.className = "webtools-tool-info webtools-unit-info";

    baseInput.addEventListener("input", () => {
      updateWebtoolsUnitFromPixel(webtoolsUnitPixel, Number(baseInput.value));
      refreshWebtoolsUnitPanelInForm(form);
    });
    pxInput.addEventListener("input", () => {
      updateWebtoolsUnitFromPixel(Number(pxInput.value), Number(baseInput.value));
      refreshWebtoolsUnitPanelInForm(form);
    });
    remInput.addEventListener("input", () => {
      updateWebtoolsUnitFromRem(Number(remInput.value), Number(baseInput.value));
      refreshWebtoolsUnitPanelInForm(form);
    });

    screenBox.append(rootSetup, divider, dualInput);
    form.append(screenBox, summaryGrid, info);
    panel.append(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);
    refreshWebtoolsUnitPanelInForm(form);
  },

  applyWebtoolsMarkdownPanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    if (data && typeof data.input === "string") {
      webtoolsMarkdownInput = data.input;
    }
    webtoolsMarkdownHtml = "";
    webtoolsMarkdownInfo = "";
  },

  renderWebtoolsMarkdownPanel(): void {
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
  },

  applyWebtoolsStringsPanelPayload(panel: ActivePluginPanelState): void {
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
  },

  renderWebtoolsStringsPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-strings-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-strings-form";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsStringsAction("convert", form);
    });

    const header = document.createElement("div");
    header.className = "webtools-strings-header";

    const title = document.createElement("h3");
    title.className = "webtools-strings-title";
    title.textContent = activePluginPanel?.title || "字符串工具";

    const subtitle = document.createElement("p");
    subtitle.className = "webtools-strings-subtitle";
    subtitle.textContent =
      activePluginPanel?.subtitle || "大小写转换与 UUID 批量生成，适合整理变量名、接口字段和测试数据。";

    header.append(title, subtitle);

    const caseSection = document.createElement("section");
    caseSection.className = "webtools-strings-section";
    const caseSectionTitle = document.createElement("h4");
    caseSectionTitle.className = "webtools-strings-section-title";
    caseSectionTitle.textContent = "大小写转换";
    const caseSectionDescription = document.createElement("p");
    caseSectionDescription.className = "webtools-strings-section-description";
    caseSectionDescription.textContent = "先输入原始文本，再选择目标命名风格。";

    const caseBox = document.createElement("div");
    caseBox.className = "webtools-strings-case-box";

    const input = document.createElement("textarea");
    input.className = "settings-value webtools-textarea webtools-strings-textarea";
    input.name = "webtoolsStringsInput";
    input.value = webtoolsStringsInput;
    input.placeholder = "例如：hello_world_variable";
    input.spellcheck = false;

    const inputField = document.createElement("label");
    inputField.className = "webtools-strings-field";
    const inputLabel = document.createElement("span");
    inputLabel.className = "settings-row-label";
    inputLabel.textContent = "原始文本";
    inputField.append(inputLabel, input);

    const caseType = document.createElement("select");
    caseType.className = "webtools-strings-case-select";
    caseType.name = "webtoolsStringsCaseType";
    const caseOptions = [
      { value: "camel", label: "camelCase" },
      { value: "snake", label: "snake_case" },
      { value: "pascal", label: "PascalCase" },
      { value: "kebab", label: "kebab-case" },
      { value: "upper", label: "UPPER CASE" },
      { value: "lower", label: "lower case" }
    ] as const;
    caseOptions.forEach(({ value, label }) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      opt.selected = webtoolsStringsCaseType === value;
      caseType.appendChild(opt);
    });

    const caseButtonGrid = document.createElement("div");
    caseButtonGrid.className = "webtools-strings-button-grid";
    const caseButtons: Array<{ value: string; button: HTMLButtonElement }> = [];
    const syncCaseButtons = (): void => {
      caseButtons.forEach(({ value, button }) => {
        const active = caseType.value === value;
        button.className = `settings-btn ${active ? "settings-btn-primary" : "settings-btn-secondary"} webtools-strings-case-btn`;
        button.dataset.active = String(active);
        button.setAttribute("aria-pressed", String(active));
      });
    };
    caseOptions.forEach(({ value, label }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", () => {
        caseType.value = value;
        webtoolsStringsCaseType = value;
        syncCaseButtons();
      });
      caseButtons.push({ value, button });
      caseButtonGrid.appendChild(button);
    });
    syncCaseButtons();

    const convertActions = document.createElement("div");
    convertActions.className = "settings-actions";

    const count = document.createElement("input");
    count.type = "number";
    count.name = "webtoolsStringsCount";
    count.value = String(webtoolsStringsUuidCount);
    count.min = "1";
    count.max = "100";
    count.className = "settings-value webtools-tool-input webtools-strings-uuid-input";

    const convert = document.createElement("button");
    convert.type = "button";
    convert.className = "settings-btn settings-btn-primary";
    convert.textContent = "转换";
    convert.addEventListener("click", () => {
      void executeWebtoolsStringsAction("convert", form);
    });

    const copyConverted = document.createElement("button");
    copyConverted.type = "button";
    copyConverted.className = "settings-btn settings-btn-secondary";
    copyConverted.textContent = "复制结果";
    copyConverted.disabled = !webtoolsStringsOutput.trim();
    copyConverted.addEventListener("click", () => {
      void (async () => {
        const copied = await copyTextToClipboard(webtoolsStringsOutput);
        setStatus(copied ? "已复制转换结果" : "复制失败");
      })();
    });

    convertActions.append(convert, copyConverted);

    const outputField = document.createElement("label");
    outputField.className = "webtools-strings-field";
    const outputLabel = document.createElement("span");
    outputLabel.className = "settings-row-label";
    outputLabel.textContent = "转换结果";
    const output = document.createElement("textarea");
    output.className = "settings-value webtools-textarea webtools-strings-textarea";
    output.readOnly = true;
    output.value = webtoolsStringsOutput;
    output.placeholder = "点击“转换”后会在这里显示结果。";
    output.spellcheck = false;
    outputField.append(outputLabel, output);

    caseBox.append(inputField, caseType, caseButtonGrid, convertActions, outputField);
    caseSection.append(caseSectionTitle, caseSectionDescription, caseBox);

    const divider = document.createElement("div");
    divider.className = "webtools-strings-divider";

    const uuidSection = document.createElement("section");
    uuidSection.className = "webtools-strings-section";
    const uuidSectionTitle = document.createElement("h4");
    uuidSectionTitle.className = "webtools-strings-section-title";
    uuidSectionTitle.textContent = "UUID 批量生成";
    const uuidSectionDescription = document.createElement("p");
    uuidSectionDescription.className = "webtools-strings-section-description";
    uuidSectionDescription.textContent = "快速生成测试数据、主键样例或临时标识。";

    const uuidBox = document.createElement("div");
    uuidBox.className = "webtools-strings-uuid-box";

    const uuidControl = document.createElement("div");
    uuidControl.className = "webtools-strings-uuid-control";

    const countLabel = document.createElement("label");
    countLabel.className = "webtools-strings-uuid-label";
    countLabel.textContent = "生成数量";
    countLabel.appendChild(count);

    const uuid = document.createElement("button");
    uuid.type = "button";
    uuid.className = "settings-btn settings-btn-secondary";
    uuid.textContent = "生成 UUID";
    uuid.addEventListener("click", () => {
      void executeWebtoolsStringsAction("uuid", form);
    });

    const copyAllUuid = document.createElement("button");
    copyAllUuid.type = "button";
    copyAllUuid.className = "settings-btn settings-btn-secondary";
    copyAllUuid.textContent = "复制全部";
    copyAllUuid.disabled = webtoolsStringsUuidItems.length === 0;
    copyAllUuid.addEventListener("click", () => {
      void (async () => {
        const copied = await copyTextToClipboard(webtoolsStringsUuidItems.join("\n"));
        setStatus(copied ? "已复制全部 UUID" : "复制失败");
      })();
    });

    uuidControl.append(countLabel, uuid, copyAllUuid);

    const uuidResults = document.createElement("div");
    uuidResults.className = "webtools-strings-uuid-results";
    if (webtoolsStringsUuidItems.length === 0) {
      const empty = document.createElement("div");
      empty.className = "webtools-strings-uuid-empty";
      empty.textContent = "点击“生成 UUID”后，这里会列出批量结果。";
      uuidResults.appendChild(empty);
    } else {
      webtoolsStringsUuidItems.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "webtools-strings-uuid-item";
        const code = document.createElement("code");
        code.className = "webtools-strings-uuid-code";
        code.textContent = item;
        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "settings-btn settings-btn-secondary";
        copyButton.textContent = `复制 #${index + 1}`;
        copyButton.addEventListener("click", () => {
          void (async () => {
            const copied = await copyTextToClipboard(item);
            setStatus(copied ? `已复制 UUID #${index + 1}` : "复制失败");
          })();
        });
        row.append(code, copyButton);
        uuidResults.appendChild(row);
      });
    }

    uuidBox.append(uuidControl, uuidResults);
    uuidSection.append(uuidSectionTitle, uuidSectionDescription, uuidBox);

    form.append(header, caseSection, divider, uuidSection);
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);
  },

  applyWebtoolsColorsPanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    if (data && typeof data.color === "string") {
      webtoolsColorsInput = data.color;
    }
    webtoolsColorsHex = webtoolsColorsInput || "#6c5ce7";
    webtoolsColorsRgb = "";
    webtoolsColorsHsl = "";
    webtoolsColorsShades = [];
  },

  renderWebtoolsColorsPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-colors-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-colors-form webtools-colors-lab";

    const presetColors = [
      "#6c5ce7",
      "#00b894",
      "#0984e3",
      "#fdcb6e",
      "#e17055",
      "#d63031",
      "#2d3436",
      "#f8fafc",
      "#1abc9c",
      "#8e44ad",
      "#ff7675",
      "#00cec9"
    ];

    const header = document.createElement("div");
    header.className = "webtools-colors-header";
    const headerText = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "webtools-colors-title";
    title.textContent = activePluginPanel?.title || "颜色工具";
    const description = document.createElement("p");
    description.className = "webtools-colors-description";
    description.textContent =
      activePluginPanel?.subtitle || "HEX / RGB / HSL 转换与常用色板快速取色";
    headerText.append(title, description);
    header.appendChild(headerText);

    const layout = document.createElement("div");
    layout.className = "webtools-colors-layout";

    const leftColumn = document.createElement("div");
    leftColumn.className = "webtools-colors-column";

    const preview = document.createElement("div");
    preview.className = "webtools-colors-preview";
    preview.setAttribute("data-webtools-colors-preview", "1");
    const previewText = document.createElement("span");
    previewText.className = "webtools-colors-preview-text";
    previewText.setAttribute("data-webtools-colors-preview-text", "1");
    preview.appendChild(previewText);

    const paletteSection = document.createElement("div");
    paletteSection.className = "webtools-colors-section";
    const paletteTitle = document.createElement("div");
    paletteTitle.className = "webtools-colors-section-title";
    paletteTitle.textContent = "常用色板";
    const palette = document.createElement("div");
    palette.className = "webtools-colors-palette";
    presetColors.forEach((color) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "webtools-colors-palette-item";
      button.title = color;
      button.style.background = color;
      button.dataset.webtoolsColorsPreset = color;
      button.addEventListener("click", () => {
        input.value = color;
        void executeWebtoolsColorsConvert(color, { render: false, form });
      });
      palette.appendChild(button);
    });
    paletteSection.append(paletteTitle, palette);

    const pickerSection = document.createElement("div");
    pickerSection.className = "webtools-colors-section";
    const pickerTitle = document.createElement("div");
    pickerTitle.className = "webtools-colors-section-title";
    pickerTitle.textContent = "手动取色";

    const picker = document.createElement("input");
    picker.type = "color";
    picker.className = "webtools-colors-picker-native";
    picker.name = "webtoolsColorsPicker";

    const pickerWrap = document.createElement("label");
    pickerWrap.className = "webtools-colors-picker";
    const pickerText = document.createElement("span");
    pickerText.className = "webtools-colors-picker-text";
    pickerText.textContent = "拖动色板或直接输入颜色值";
    pickerWrap.append(picker, pickerText);

    const input = document.createElement("input");
    input.name = "webtoolsColorsInput";
    input.className = "settings-value";
    input.placeholder = "#6c5ce7";

    const inputField = document.createElement("label");
    inputField.className = "webtools-colors-field";
    const inputLabel = document.createElement("span");
    inputLabel.className = "webtools-colors-field-label";
    inputLabel.textContent = "颜色值";
    const inputHint = document.createElement("span");
    inputHint.className = "webtools-colors-field-hint";
    inputHint.textContent = "支持 Hex，实时转换到 RGB / HSL。";
    inputField.append(inputLabel, input, inputHint);
    pickerSection.append(pickerTitle, pickerWrap, inputField);

    leftColumn.append(preview, paletteSection, pickerSection);

    const rightColumn = document.createElement("div");
    rightColumn.className = "webtools-colors-column webtools-colors-details";

    const outputsSection = document.createElement("div");
    outputsSection.className = "webtools-colors-section";
    const outputsTitle = document.createElement("div");
    outputsTitle.className = "webtools-colors-section-title";
    outputsTitle.textContent = "格式输出";
    const outputsList = document.createElement("div");
    outputsList.className = "webtools-colors-output-list";

    const createOutputRow = (
      labelText: string,
      key: "hex" | "rgb" | "hsl"
    ): HTMLDivElement => {
      const output = document.createElement("div");
      output.className = "webtools-colors-output";

      const label = document.createElement("div");
      label.className = "webtools-colors-output-label";
      label.textContent = labelText;

      const row = document.createElement("div");
      row.className = "webtools-colors-output-row";

      const value = document.createElement("div");
      value.className = "webtools-colors-output-value";
      value.setAttribute("data-webtools-colors-output", key);

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "settings-btn settings-btn-secondary";
      copyButton.textContent = "复制";
      copyButton.addEventListener("click", () => {
        const content = value.textContent?.trim() ?? "";
        if (!content || content === "-") {
          setStatus(`当前没有可复制的 ${labelText}`);
          return;
        }
        void (async () => {
          const copied = await copyTextToClipboard(content);
          setStatus(copied ? `已复制 ${labelText}` : "复制失败");
        })();
      });

      row.append(value, copyButton);
      output.append(label, row);
      return output;
    };
    outputsList.append(
      createOutputRow("HEX", "hex"),
      createOutputRow("RGB", "rgb"),
      createOutputRow("HSL", "hsl")
    );
    outputsSection.append(outputsTitle, outputsList);

    const shadesSection = document.createElement("div");
    shadesSection.className = "webtools-colors-section";
    const shadesTitle = document.createElement("div");
    shadesTitle.className = "webtools-colors-section-title";
    shadesTitle.textContent = "明暗阶";

    const shades = document.createElement("div");
    shades.className = "webtools-colors-shades";
    shades.setAttribute("data-webtools-colors-shades", "1");
    shadesSection.append(shadesTitle, shades);

    rightColumn.append(outputsSection, shadesSection);

    picker.addEventListener("input", () => {
      input.value = picker.value;
      void executeWebtoolsColorsConvert(picker.value, { render: false, form });
    });
    input.addEventListener("input", () => {
      scheduleWebtoolsColorsAutoConvert(form, input.value);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsColorsConvert(input.value, { render: false, form });
    });

    layout.append(leftColumn, rightColumn);
    form.append(header, layout);
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsColorsPanelInForm(form);
    scheduleWebtoolsColorsAutoConvert(form, input.value || webtoolsColorsHex, true);
  },

  applyWebtoolsQrcodePanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    webtoolsQrText = data && typeof data.text === "string" ? data.text : "LiteLauncher QR";
    webtoolsQrSize = data && typeof data.size === "number" ? data.size : 300;
    webtoolsQrLevel = data && typeof data.level === "string" ? data.level : "M";
    webtoolsQrDarkColor =
      data && typeof data.darkColor === "string"
        ? normalizeWebtoolsQrcodeColor(data.darkColor, "#102136")
        : "#102136";
    webtoolsQrLightColor =
      data && typeof data.lightColor === "string"
        ? normalizeWebtoolsQrcodeColor(data.lightColor, "#ffffff")
        : "#ffffff";
    webtoolsQrLogoMode =
      data && typeof data.logoMode === "string"
        ? data.logoMode === "text" || data.logoMode === "image"
          ? data.logoMode
          : "none"
        : "none";
    webtoolsQrLogoText = data && typeof data.logoText === "string" ? data.logoText : "";
    webtoolsQrLogoImageDataUrl =
      data && typeof data.logoImageDataUrl === "string" ? data.logoImageDataUrl : "";
    webtoolsQrLogoImageName = "";
    webtoolsQrUrl = "";
    webtoolsQrInfo = "";
  },

  renderWebtoolsQrcodePanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-qrcode-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-qrcode-form";

    const header = document.createElement("div");
    header.className = "webtools-qrcode-header";
    const headerText = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "webtools-qrcode-title";
    title.textContent = activePluginPanel?.title || "二维码生成";
    const description = document.createElement("p");
    description.className = "webtools-qrcode-description";
    description.textContent =
      activePluginPanel?.subtitle || "输入文本后自动生成二维码，可配置容错级别、配色与 Logo。";
    headerText.append(title, description);

    const info = document.createElement("div");
    info.className = "webtools-qrcode-info";
    header.append(headerText, info);

    const layout = document.createElement("div");
    layout.className = "webtools-qrcode-layout";

    const setup = document.createElement("section");
    setup.className = "webtools-qrcode-setup";

    const text = document.createElement("textarea");
    text.className = "settings-value webtools-textarea webtools-qrcode-textarea";
    text.name = "webtoolsQrText";
    text.value = webtoolsQrText;
    text.spellcheck = false;
    const textField = document.createElement("label");
    textField.className = "webtools-qrcode-field";
    const textLabel = document.createElement("span");
    textLabel.className = "webtools-qrcode-field-label";
    textLabel.textContent = "二维码内容";
    textField.append(textLabel, text);

    const size = document.createElement("input");
    size.type = "number";
    size.className = "settings-value webtools-tool-input";
    size.name = "webtoolsQrSize";
    size.value = String(webtoolsQrSize);

    const level = document.createElement("select");
    level.className = "settings-value webtools-tool-select";
    level.name = "webtoolsQrLevel";
    ["L", "M", "Q", "H"].forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      opt.selected = webtoolsQrLevel === v;
      level.appendChild(opt);
    });

    const dark = document.createElement("input");
    dark.type = "color";
    dark.className = "webtools-qrcode-color-picker";
    dark.name = "webtoolsQrDarkColor";
    dark.value = webtoolsQrDarkColor;

    const darkValue = document.createElement("span");
    darkValue.className = "webtools-qrcode-color-value";
    darkValue.setAttribute("data-webtools-qrcode-dark-value", "1");

    const light = document.createElement("input");
    light.type = "color";
    light.className = "webtools-qrcode-color-picker";
    light.name = "webtoolsQrLightColor";
    light.value = webtoolsQrLightColor;

    const lightValue = document.createElement("span");
    lightValue.className = "webtools-qrcode-color-value";
    lightValue.setAttribute("data-webtools-qrcode-light-value", "1");

    const configGrid = document.createElement("div");
    configGrid.className = "webtools-qrcode-config-grid";

    const sizeField = document.createElement("label");
    sizeField.className = "webtools-qrcode-field";
    const sizeLabel = document.createElement("span");
    sizeLabel.className = "webtools-qrcode-field-label";
    sizeLabel.textContent = "输出尺寸";
    sizeField.append(sizeLabel, size);

    const levelField = document.createElement("label");
    levelField.className = "webtools-qrcode-field";
    const levelLabel = document.createElement("span");
    levelLabel.className = "webtools-qrcode-field-label";
    levelLabel.textContent = "容错级别";
    levelField.append(levelLabel, level);

    const darkField = document.createElement("div");
    darkField.className = "webtools-qrcode-field";
    const darkLabel = document.createElement("span");
    darkLabel.className = "webtools-qrcode-field-label";
    darkLabel.textContent = "深色";
    const darkControl = document.createElement("div");
    darkControl.className = "webtools-qrcode-color-control";
    darkControl.append(dark, darkValue);
    darkField.append(darkLabel, darkControl);

    const lightField = document.createElement("div");
    lightField.className = "webtools-qrcode-field";
    const lightLabel = document.createElement("span");
    lightLabel.className = "webtools-qrcode-field-label";
    lightLabel.textContent = "浅色";
    const lightControl = document.createElement("div");
    lightControl.className = "webtools-qrcode-color-control";
    lightControl.append(light, lightValue);
    lightField.append(lightLabel, lightControl);

    configGrid.append(sizeField, levelField, darkField, lightField);

    const logoMeta = document.createElement("span");
    logoMeta.className = "webtools-qrcode-logo-meta";
    logoMeta.setAttribute("data-webtools-qrcode-logo-meta", "1");

    const logoMode = document.createElement("select");
    logoMode.className = "settings-value webtools-tool-select";
    logoMode.name = "webtoolsQrLogoMode";
    [
      ["none", "无 Logo"],
      ["text", "文字 Logo"],
      ["image", "图片 Logo"]
    ].forEach(([value, label]) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      opt.selected = webtoolsQrLogoMode === value;
      logoMode.appendChild(opt);
    });

    const logoSection = document.createElement("section");
    logoSection.className = "webtools-qrcode-logo-section";
    const logoHead = document.createElement("div");
    logoHead.className = "webtools-qrcode-logo-head";
    const logoTitle = document.createElement("span");
    logoTitle.className = "webtools-qrcode-field-label";
    logoTitle.textContent = "Logo 设置";

    const logoTextField = document.createElement("div");
    logoTextField.className = "webtools-qrcode-field";
    logoTextField.setAttribute("data-webtools-qrcode-logo-text-field", "1");
    const logoTextLabel = document.createElement("span");
    logoTextLabel.className = "webtools-qrcode-field-label";
    logoTextLabel.textContent = "文字 Logo";
    const logoText = document.createElement("input");
    logoText.className = "settings-value webtools-tool-input";
    logoText.name = "webtoolsQrLogoText";
    logoText.value = webtoolsQrLogoText;
    logoTextField.append(logoTextLabel, logoText);

    const logoImageField = document.createElement("div");
    logoImageField.className = "webtools-qrcode-logo-image-field";
    logoImageField.setAttribute("data-webtools-qrcode-logo-image-field", "1");
    const logoImageLabel = document.createElement("span");
    logoImageLabel.className = "webtools-qrcode-field-label";
    logoImageLabel.textContent = "图片 Logo";
    const logoImageRow = document.createElement("div");
    logoImageRow.className = "webtools-qrcode-logo-image-row";
    const logoUpload = document.createElement("button");
    logoUpload.type = "button";
    logoUpload.className = "settings-btn settings-btn-secondary";
    logoUpload.textContent = "选择图片";
    const logoFileInput = document.createElement("input");
    logoFileInput.type = "file";
    logoFileInput.accept = "image/*";
    logoFileInput.hidden = true;
    const logoImageName = document.createElement("span");
    logoImageName.className = "webtools-qrcode-logo-image-name";
    logoImageName.setAttribute("data-webtools-qrcode-logo-image-name", "1");
    logoImageRow.append(logoUpload, logoImageName, logoFileInput);
    logoImageField.append(logoImageLabel, logoImageRow);

    const clearLogo = document.createElement("button");
    clearLogo.type = "button";
    clearLogo.className = "settings-btn settings-btn-secondary webtools-qrcode-clear-logo-btn";
    clearLogo.setAttribute("data-webtools-qrcode-clear-logo", "1");
    clearLogo.textContent = "清除 Logo";
    clearLogo.addEventListener("click", () => {
      if (webtoolsQrLogoMode === "text") {
        webtoolsQrLogoText = "";
        logoText.value = "";
      } else if (webtoolsQrLogoMode === "image") {
        webtoolsQrLogoImageDataUrl = "";
        webtoolsQrLogoImageName = "";
      }
      refreshWebtoolsQrcodePanelInForm(form);
      scheduleWebtoolsQrcodeAutoGenerate(form, true);
    });

    logoHead.append(logoTitle, logoMeta, clearLogo);

    const logoBody = document.createElement("div");
    logoBody.className = "webtools-qrcode-logo-body";
    const logoModeField = document.createElement("label");
    logoModeField.className = "webtools-qrcode-field";
    const logoModeLabel = document.createElement("span");
    logoModeLabel.className = "webtools-qrcode-field-label";
    logoModeLabel.textContent = "Logo 类型";
    logoModeField.append(logoModeLabel, logoMode);
    logoBody.append(logoModeField, logoTextField, logoImageField);
    logoSection.append(logoHead, logoBody);

    const actions = document.createElement("div");
    actions.className = "webtools-qrcode-actions";

    const generate = document.createElement("button");
    generate.type = "submit";
    generate.className = "settings-btn settings-btn-primary";
    generate.textContent = "生成二维码";

    const download = document.createElement("button");
    download.type = "button";
    download.className = "settings-btn settings-btn-secondary webtools-qrcode-download-btn";
    download.setAttribute("data-webtools-qrcode-download", "1");
    download.textContent = "下载 PNG";
    download.addEventListener("click", async () => {
      beginPluginNativeInteraction(1500);
      try {
        await downloadWebtoolsQrcodePng();
        setStatus("已下载二维码");
      } catch (error) {
        const reason = error instanceof Error ? error.message : "下载失败";
        setStatus(reason);
      } finally {
        schedulePluginNativeInteractionRelease();
      }
    });
    actions.append(generate, download);

    const preview = document.createElement("section");
    preview.className = "webtools-qrcode-preview";
    const previewHost = document.createElement("div");
    previewHost.className = "webtools-qrcode-preview-host";
    previewHost.setAttribute("data-webtools-qrcode-preview", "1");
    preview.appendChild(previewHost);

    [text, size, level].forEach((node) => {
      node.addEventListener("input", () => {
        scheduleWebtoolsQrcodeAutoGenerate(form);
      });
      node.addEventListener("change", () => {
        scheduleWebtoolsQrcodeAutoGenerate(form, true);
      });
    });

    dark.addEventListener("input", () => {
      webtoolsQrDarkColor = normalizeWebtoolsQrcodeColor(dark.value, "#102136");
      refreshWebtoolsQrcodePanelInForm(form);
      scheduleWebtoolsQrcodeAutoGenerate(form, true);
    });

    light.addEventListener("input", () => {
      webtoolsQrLightColor = normalizeWebtoolsQrcodeColor(light.value, "#ffffff");
      refreshWebtoolsQrcodePanelInForm(form);
      scheduleWebtoolsQrcodeAutoGenerate(form, true);
    });

    logoMode.addEventListener("change", () => {
      webtoolsQrLogoMode =
        logoMode.value === "text" || logoMode.value === "image" ? logoMode.value : "none";
      refreshWebtoolsQrcodePanelInForm(form);
      scheduleWebtoolsQrcodeAutoGenerate(form, true);
    });

    logoText.addEventListener("input", () => {
      webtoolsQrLogoText = logoText.value.trim().slice(0, 40);
      refreshWebtoolsQrcodePanelInForm(form);
      scheduleWebtoolsQrcodeAutoGenerate(form);
    });

    logoUpload.addEventListener("click", () => {
      beginPluginNativeInteraction(1500);
      logoFileInput.click();
      schedulePluginNativeInteractionRelease();
    });

    logoFileInput.addEventListener("change", () => {
      const file = logoFileInput.files?.[0];
      logoFileInput.value = "";
      if (!file) {
        return;
      }
      void (async () => {
        try {
          const normalized = await normalizeWebtoolsQrcodeLogoImage(file);
          webtoolsQrLogoMode = "image";
          logoMode.value = "image";
          webtoolsQrLogoImageDataUrl = normalized.dataUrl;
          webtoolsQrLogoImageName = normalized.name;
          refreshWebtoolsQrcodePanelInForm(form);
          scheduleWebtoolsQrcodeAutoGenerate(form, true);
        } catch (error) {
          setStatus(error instanceof Error ? error.message : "Logo 图片处理失败");
        }
      })();
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsQrcodeGenerateInForm(form);
    });

    setup.append(textField, configGrid, logoSection, actions);
    layout.append(setup, preview);
    form.append(header, layout);
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsQrcodePanelInForm(form);
    scheduleWebtoolsQrcodeAutoGenerate(form, true);
  },

  applyWebtoolsUaPanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    if (data && typeof data.ua === "string") {
      webtoolsUaInput = data.ua;
    } else {
      webtoolsUaInput = navigator.userAgent;
    }
    webtoolsUaResult = {};
    webtoolsUaInfo = "";
    webtoolsUaError = "";
  },

  renderWebtoolsUaPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-ua-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-ua-form";

    const header = document.createElement("div");
    header.className = "webtools-ua-header";
    const headerText = document.createElement("div");
    headerText.className = "webtools-ua-header-text";
    const title = document.createElement("h3");
    title.className = "webtools-ua-title";
    title.textContent = activePluginPanel?.title || "UA 解析";
    const subtitle = document.createElement("p");
    subtitle.className = "webtools-ua-subtitle";
    subtitle.textContent =
      activePluginPanel?.subtitle || "自动识别浏览器、系统、设备与渲染引擎信息。";
    headerText.append(title, subtitle);

    const actions = document.createElement("div");
    actions.className = "webtools-ua-actions";

    const input = document.createElement("textarea");
    input.className = "settings-value webtools-textarea webtools-ua-input";
    input.name = "webtoolsUaInput";
    input.value = webtoolsUaInput || navigator.userAgent;
    input.spellcheck = false;

    const info = document.createElement("div");
    info.className = "webtools-ua-info";

    const grid = document.createElement("div");
    grid.className = "webtools-ua-grid";

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "settings-btn settings-btn-primary";
    copy.textContent = "复制 UA";
    copy.setAttribute("data-webtools-ua-copy", "1");

    const current = document.createElement("button");
    current.type = "button";
    current.className = "settings-btn settings-btn-secondary";
    current.textContent = "当前 UA";

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "settings-btn settings-btn-secondary";
    clear.textContent = "清空";

    actions.append(current, clear, copy);
    header.append(headerText, actions);

    const editor = document.createElement("div");
    editor.className = "webtools-ua-editor";
    const inputSection = document.createElement("section");
    inputSection.className = "webtools-ua-input-section";
    const inputHead = document.createElement("div");
    inputHead.className = "webtools-ua-input-head";
    const inputLabel = document.createElement("div");
    inputLabel.className = "webtools-ua-input-label";
    inputLabel.textContent = "User-Agent 字符串";
    const inputMeta = document.createElement("div");
    inputMeta.className = "webtools-ua-input-meta";
    inputMeta.textContent = "支持粘贴浏览器、App 或抓包里的完整 UA。";
    inputHead.append(inputLabel, inputMeta);
    inputSection.append(inputHead, input);
    editor.append(inputSection, info, grid);

    current.addEventListener("click", () => {
      input.value = navigator.userAgent;
      scheduleWebtoolsUaAutoParse(form, true);
    });

    clear.addEventListener("click", () => {
      if (webtoolsUaAutoTimer !== null) {
        window.clearTimeout(webtoolsUaAutoTimer);
        webtoolsUaAutoTimer = null;
      }
      webtoolsUaRequestToken += 1;
      webtoolsUaInput = "";
      webtoolsUaResult = {};
      webtoolsUaInfo = "";
      webtoolsUaError = "";
      input.value = "";
      refreshWebtoolsUaResultInForm(form);
      setStatus("已清空 UA");
    });

    copy.addEventListener("click", async () => {
      const value = input.value.trim();
      if (!value) {
        setStatus("没有可复制的 UA");
        return;
      }
      await navigator.clipboard.writeText(value);
      setStatus("已复制 UA");
    });

    input.addEventListener("input", () => {
      webtoolsUaInput = input.value;
      scheduleWebtoolsUaAutoParse(form);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsUaParse(input.value);
    });

    form.append(header, editor);
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsUaResultInForm(form);
    scheduleWebtoolsUaAutoParse(form, true);
  },

  applyWebtoolsApiPanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    if (data && typeof data.method === "string") {
      webtoolsApiMethod = data.method;
    }
    if (data && typeof data.url === "string") {
      webtoolsApiUrl = data.url;
    }
    if (data && typeof data.bodyType === "string") {
      webtoolsApiBodyType =
        data.bodyType === "text" || data.bodyType === "formdata" ? data.bodyType : "json";
    }
    if (data && typeof data.bodyContent === "string") {
      webtoolsApiBodyContent = data.bodyContent;
    }

    webtoolsApiParams = normalizeWebtoolsApiRows(data?.params);
    webtoolsApiHeaders = normalizeWebtoolsApiRows(data?.headers, [
      { key: "Content-Type", value: "application/json", enabled: true },
      { key: "", value: "", enabled: true }
    ]);
    webtoolsApiFormRows = normalizeWebtoolsApiRows(data?.formRows);
    syncWebtoolsApiContentTypeHeader();

    webtoolsApiResponseStatus = "";
    webtoolsApiResponseBody = "";
    webtoolsApiResponseHeaders = {};
    webtoolsApiResponseTimeMs = 0;
    webtoolsApiResponseSizeText = "";
    webtoolsApiResponseUrl = "";
    webtoolsApiResponseError = "";
    webtoolsApiHasResponse = false;
    webtoolsApiIsLoading = false;
  },

  renderWebtoolsApiPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-api-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-api-form webtools-tool-panel";

    const title = document.createElement("h3");
    title.className = "webtools-tool-title";
    title.textContent = activePluginPanel?.title || "API 调试";

    const requestRow = document.createElement("div");
    requestRow.className = "webtools-api-request";

    const method = document.createElement("select");
    method.className = "settings-value webtools-tool-select webtools-api-method";
    method.name = "webtoolsApiMethod";
    ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      opt.selected = webtoolsApiMethod === m;
      method.appendChild(opt);
    });

    const url = document.createElement("input");
    url.className = "settings-value webtools-tool-input webtools-api-url";
    url.name = "webtoolsApiUrl";
    url.value = webtoolsApiUrl;

    const send = document.createElement("button");
    send.type = "submit";
    send.className = "settings-btn settings-btn-primary webtools-api-send-btn";
    send.textContent = "发送";

    requestRow.append(method, url, send);

    const previewRow = document.createElement("div");
    previewRow.className = "webtools-api-preview-row";
    const previewLabel = document.createElement("div");
    previewLabel.className = "webtools-api-preview-label";
    previewLabel.textContent = "请求预览";
    const preview = document.createElement("div");
    preview.className = "webtools-api-preview webtools-tool-code";
    previewRow.append(previewLabel, preview);

    const requestTabs = document.createElement("div");
    requestTabs.className = "webtools-api-tabs";
    [
      ["params", "参数"],
      ["headers", "请求头"],
      ["body", "请求体"]
    ].forEach(([id, label]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "webtools-api-tab";
      btn.setAttribute("data-api-request-tab", id);
      btn.textContent = label;
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        webtoolsApiRequestTab = id as "params" | "headers" | "body";
        refreshWebtoolsApiTabs(form);
      });
      requestTabs.appendChild(btn);
    });

    const requestPanels = document.createElement("div");
    requestPanels.className = "webtools-api-panels";
    const paramsPanel = document.createElement("div");
    paramsPanel.className = "webtools-api-panel-card";
    paramsPanel.setAttribute("data-api-request-panel", "params");
    paramsPanel.appendChild(createWebtoolsApiRowsEditor(form, "params"));

    const headersPanel = document.createElement("div");
    headersPanel.className = "webtools-api-panel-card";
    headersPanel.setAttribute("data-api-request-panel", "headers");
    headersPanel.appendChild(createWebtoolsApiRowsEditor(form, "headers"));

    const bodyPanel = document.createElement("div");
    bodyPanel.className = "webtools-api-panel-card";
    bodyPanel.setAttribute("data-api-request-panel", "body");
    const bodyTypes = document.createElement("div");
    bodyTypes.className = "webtools-api-body-types";
    [
      ["json", "JSON"],
      ["text", "纯文本"],
      ["formdata", "FormData"]
    ].forEach(([value, label]) => {
      const option = document.createElement("label");
      option.className = "webtools-api-body-type";
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "webtoolsApiBodyTypeDisplay";
      radio.value = value;
      radio.checked = webtoolsApiBodyType === value;
      radio.addEventListener("change", () => {
        if (!radio.checked) {
          return;
        }
        webtoolsApiBodyType = value as "json" | "text" | "formdata";
        syncWebtoolsApiContentTypeHeader();
        renderList();
      });
      const text = document.createElement("span");
      text.textContent = label;
      option.append(radio, text);
      bodyTypes.appendChild(option);
    });

    const bodyTypeInput = document.createElement("input");
    bodyTypeInput.type = "hidden";
    bodyTypeInput.name = "webtoolsApiBodyType";
    bodyTypeInput.value = webtoolsApiBodyType;

    bodyPanel.append(bodyTypeInput, bodyTypes);
    if (webtoolsApiBodyType === "formdata") {
      bodyPanel.appendChild(createWebtoolsApiRowsEditor(form, "formdata"));
    } else {
      const body = document.createElement("textarea");
      body.className = "settings-value webtools-textarea webtools-api-body";
      body.name = "webtoolsApiBody";
      body.value = webtoolsApiBodyContent;
      body.addEventListener("input", () => {
        webtoolsApiBodyContent = body.value;
      });
      bodyPanel.appendChild(body);
    }

    requestPanels.append(paramsPanel, headersPanel, bodyPanel);

    const responseSection = document.createElement("section");
    responseSection.className = "webtools-api-response-section";
    const responseHead = document.createElement("div");
    responseHead.className = "webtools-api-response-head";
    const metrics = document.createElement("div");
    metrics.className = "webtools-api-metrics";
    const status = document.createElement("div");
    status.className = "webtools-api-status";
    const time = document.createElement("span");
    time.className = "webtools-api-time";
    const size = document.createElement("span");
    size.className = "webtools-api-size";
    const err = document.createElement("div");
    err.className = "webtools-api-error";
    metrics.append(status, time, size);
    responseHead.append(metrics, err);
    const responseUrl = document.createElement("div");
    responseUrl.className = "webtools-api-response-url webtools-tool-code";
    const responseTabs = document.createElement("div");
    responseTabs.className = "webtools-api-tabs webtools-api-response-tabs";

    [
      ["body", "响应体"],
      ["headers", "响应头"]
    ].forEach(([id, label]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "webtools-api-tab";
      btn.setAttribute("data-api-response-tab", id);
      btn.textContent = label;
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        webtoolsApiResponseTab = id as "body" | "headers";
        refreshWebtoolsApiTabs(form);
        refreshWebtoolsApiResponseInForm(form);
      });
      responseTabs.appendChild(btn);
    });

    const responsePanels = document.createElement("div");
    responsePanels.className = "webtools-api-panels webtools-api-response-panels";
    const responseBodyPanel = document.createElement("div");
    responseBodyPanel.className = "webtools-api-panel-card";
    responseBodyPanel.setAttribute("data-api-response-panel", "body");
    const responseBody = document.createElement("pre");
    responseBody.className = "webtools-api-response-body webtools-tool-code";
    responseBodyPanel.appendChild(responseBody);

    const responseHeadersPanel = document.createElement("div");
    responseHeadersPanel.className = "webtools-api-panel-card";
    responseHeadersPanel.setAttribute("data-api-response-panel", "headers");
    const responseHeadersHost = document.createElement("div");
    responseHeadersHost.className = "webtools-api-response-headers-host";
    responseHeadersPanel.appendChild(responseHeadersHost);

    responsePanels.append(responseBodyPanel, responseHeadersPanel);
    responseSection.append(responseHead, responseUrl, responseTabs, responsePanels);

    method.addEventListener("change", () => {
      webtoolsApiMethod = method.value;
      refreshWebtoolsApiMethodUi(form);
    });
    url.addEventListener("input", () => {
      webtoolsApiUrl = url.value;
      refreshWebtoolsApiPreview(form);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsApiRequest(form, { render: false });
    });

    form.append(title, requestRow, previewRow, requestTabs, requestPanels, responseSection);
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsApiResponseInForm(form);
  },

  applyWebtoolsHttpMockPanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    if (!data) {
      return;
    }

    if (typeof data.running === "boolean") {
      webtoolsHttpMockRunning = data.running;
    }
    if (typeof data.url === "string") {
      webtoolsHttpMockUrl = data.url;
    }
    if (typeof data.port === "number" && Number.isFinite(data.port)) {
      webtoolsHttpMockPort = Math.min(65535, Math.max(1024, Math.floor(data.port)));
    }
    if (typeof data.path === "string") {
      webtoolsHttpMockPath = normalizeWebtoolsHttpMockPath(data.path);
    }
    if (typeof data.method === "string") {
      webtoolsHttpMockMethod = normalizeWebtoolsHttpMockMethod(data.method);
    }
    if (typeof data.statusCode === "number" && Number.isFinite(data.statusCode)) {
      webtoolsHttpMockStatusCode = Math.min(599, Math.max(100, Math.floor(data.statusCode)));
    }
    if (typeof data.contentType === "string" && data.contentType.trim()) {
      webtoolsHttpMockContentType = data.contentType;
    }
    if (typeof data.body === "string") {
      webtoolsHttpMockBody = data.body;
    }
    if (typeof data.requestCount === "number" && Number.isFinite(data.requestCount)) {
      webtoolsHttpMockRequestCount = Math.max(0, Math.floor(data.requestCount));
    }
    webtoolsHttpMockInfo = panel.message || "";
    webtoolsHttpMockError = "";
  },

  renderWebtoolsHttpMockPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-http-mock-form webtools-tool-panel";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsHttpMockAction("start", form);
    });

    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "HTTP Mock Server";

    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle || "本地临时接口模拟（MVP 第二阶段）";

    const row = document.createElement("div");
    row.className = "webtools-url-parts-grid";

    const methodField = document.createElement("label");
    methodField.className = "webtools-url-part";
    const methodLabel = document.createElement("div");
    methodLabel.className = "webtools-url-part-label";
    methodLabel.textContent = "方法";
    const methodSelect = document.createElement("select");
    methodSelect.className = "settings-number webtools-tool-input";
    methodSelect.name = "webtoolsHttpMockMethod";
    ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"].forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      methodSelect.appendChild(option);
    });
    methodField.append(methodLabel, methodSelect);

    const portField = document.createElement("label");
    portField.className = "webtools-url-part";
    const portLabel = document.createElement("div");
    portLabel.className = "webtools-url-part-label";
    portLabel.textContent = "端口";
    const portInput = document.createElement("input");
    portInput.className = "settings-value webtools-tool-input";
    portInput.name = "webtoolsHttpMockPort";
    portInput.type = "number";
    portField.append(portLabel, portInput);

    const pathField = document.createElement("label");
    pathField.className = "webtools-url-part webtools-url-part-full";
    const pathLabel = document.createElement("div");
    pathLabel.className = "webtools-url-part-label";
    pathLabel.textContent = "路径";
    const pathInput = document.createElement("input");
    pathInput.className = "settings-value webtools-tool-input";
    pathInput.name = "webtoolsHttpMockPath";
    pathInput.type = "text";
    pathField.append(pathLabel, pathInput);

    const statusField = document.createElement("label");
    statusField.className = "webtools-url-part";
    const statusLabel = document.createElement("div");
    statusLabel.className = "webtools-url-part-label";
    statusLabel.textContent = "状态码";
    const statusInput = document.createElement("input");
    statusInput.className = "settings-value webtools-tool-input";
    statusInput.name = "webtoolsHttpMockStatusCode";
    statusInput.type = "number";
    statusField.append(statusLabel, statusInput);

    const contentTypeField = document.createElement("label");
    contentTypeField.className = "webtools-url-part webtools-url-part-full";
    const contentTypeLabel = document.createElement("div");
    contentTypeLabel.className = "webtools-url-part-label";
    contentTypeLabel.textContent = "Content-Type";
    const contentTypeInput = document.createElement("input");
    contentTypeInput.className = "settings-value webtools-tool-input";
    contentTypeInput.name = "webtoolsHttpMockContentType";
    contentTypeInput.type = "text";
    contentTypeField.append(contentTypeLabel, contentTypeInput);

    row.append(methodField, portField, pathField, statusField, contentTypeField);

    const bodyField = document.createElement("label");
    bodyField.className = "webtools-tool-pane";
    const bodyLabel = document.createElement("div");
    bodyLabel.className = "webtools-tool-pane-title";
    bodyLabel.textContent = "响应 Body";
    const bodyInput = document.createElement("textarea");
    bodyInput.className = "settings-value webtools-textarea";
    bodyInput.name = "webtoolsHttpMockBody";
    bodyInput.spellcheck = false;
    bodyField.append(bodyLabel, bodyInput);

    const runtime = document.createElement("div");
    runtime.className = "webtools-tool-info webtools-http-mock-runtime";

    const count = document.createElement("div");
    count.className = "webtools-tool-info webtools-http-mock-count";

    const info = document.createElement("div");
    info.className = "webtools-tool-info webtools-http-mock-info";

    const actions = document.createElement("div");
    actions.className = "settings-actions";

    const startButton = document.createElement("button");
    startButton.type = "button";
    startButton.className = "settings-btn settings-btn-primary";
    startButton.textContent = "启动";
    startButton.setAttribute("data-webtools-http-mock-start", "1");
    startButton.addEventListener("click", () => {
      void executeWebtoolsHttpMockAction("start", form);
    });

    const statusButton = document.createElement("button");
    statusButton.type = "button";
    statusButton.className = "settings-btn settings-btn-secondary";
    statusButton.textContent = "刷新状态";
    statusButton.setAttribute("data-webtools-http-mock-status", "1");
    statusButton.addEventListener("click", () => {
      void executeWebtoolsHttpMockAction("status", form);
    });

    const stopButton = document.createElement("button");
    stopButton.type = "button";
    stopButton.className = "settings-btn settings-btn-secondary";
    stopButton.textContent = "停止";
    stopButton.setAttribute("data-webtools-http-mock-stop", "1");
    stopButton.addEventListener("click", () => {
      void executeWebtoolsHttpMockAction("stop", form);
    });

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "settings-btn settings-btn-secondary";
    backButton.textContent = "返回搜索";
    backButton.addEventListener("click", () => {
      backToSearch();
    });

    actions.append(startButton, statusButton, stopButton, backButton);

    form.append(title, description, row, bodyField, runtime, count, info, actions);
    panel.append(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsHttpMockPanelInForm(form);
  },

  applyDictionaryPanelPayload(panel: ActivePluginPanelState): void {
    const data = normalizeDictionaryPanelData(panel.data);
    dictionaryQueryText = data.query;
    dictionaryPanelStatusMessage = data.statusMessage;
    dictionaryPanelEntry = null;
    dictionaryPanelCandidates = [];
  },

  renderDictionaryPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel dictionary-panel";

    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "离线词典";

    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle ||
      "ECDICT 英汉词典，支持单词与词组离线查询。";

    const form = document.createElement("form");
    form.className = "settings-form dictionary-form";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void runDictionaryPanelLookup(form);
    });

    const statusRow = createLiteSnapInfoRow(
      "使用提示",
      dictionaryPanelStatusMessage,
      "约 76 万词条，支持英译中与中译英；连字符词组会自动尝试多种写法"
    );

    const packStatusText = buildDictionaryPackStatusText(dictionaryPackStatus);
    const packStatusRow = createLiteSnapInfoRow(
      "词典词库",
      packStatusText,
      buildDictionaryPackStatusHint(dictionaryPackStatus)
    );

    const packProgressWrap = document.createElement("div");
    packProgressWrap.className = "dictionary-pack-progress";
    packProgressWrap.hidden = true;
    const packProgressBar = document.createElement("progress");
    packProgressBar.className = "dictionary-pack-progress__bar";
    packProgressBar.max = 100;
    packProgressBar.value = 0;
    const packProgressText = document.createElement("span");
    packProgressText.className = "dictionary-pack-progress__text";
    packProgressWrap.append(packProgressBar, packProgressText);

    const ttsField = document.createElement("div");
    ttsField.className = "settings-field";
    const ttsLabel = document.createElement("label");
    ttsLabel.className = "settings-check";
    const ttsInput = document.createElement("input");
    ttsInput.type = "checkbox";
    ttsInput.name = "dictionaryTtsEnabled";
    ttsInput.checked = dictionaryPanelTtsEnabled;
    ttsInput.addEventListener("change", () => {
      void setDictionaryPanelTtsEnabled(ttsInput.checked);
    });
    const ttsText = document.createElement("span");
    ttsText.textContent = "查词成功后朗读（系统 TTS，默认关闭）";
    ttsLabel.append(ttsInput, ttsText);
    ttsField.appendChild(ttsLabel);

    const queryField = document.createElement("div");
    queryField.className = "settings-field";

    const queryLabel = document.createElement("label");
    queryLabel.className = "settings-field-label";
    queryLabel.textContent = "查询词（英文或中文）";
    queryLabel.htmlFor = "dictionary-query";

    const queryInput = document.createElement("input");
    queryInput.id = "dictionary-query";
    queryInput.name = "dictionaryQuery";
    queryInput.type = "text";
    queryInput.className = "settings-value";
    queryInput.spellcheck = false;
    queryInput.autocomplete = "off";
    queryInput.placeholder = "例如：apple、context-path、苹果、上下文";
    queryInput.value = dictionaryQueryText;
    queryInput.addEventListener("input", () => {
      dictionaryQueryText = queryInput.value;
    });
    queryField.append(queryLabel, queryInput);

    const dictionaryCard = document.createElement("div");
    dictionaryCard.id = "dictionary-result-card";
    dictionaryCard.className = "translate-dictionary-card";
    dictionaryCard.hidden = !dictionaryPanelEntry;
    if (dictionaryPanelEntry) {
      populateDictionaryEntryCard(dictionaryCard, dictionaryPanelEntry);
    }

    const favoriteNoteField = document.createElement("div");
    favoriteNoteField.className = "settings-field dictionary-favorite-note-field";
    favoriteNoteField.hidden = !isCurrentDictionaryEntryFavorited();
    const favoriteNoteLabel = document.createElement("label");
    favoriteNoteLabel.className = "settings-field-label";
    favoriteNoteLabel.textContent = "收藏备注";
    favoriteNoteLabel.htmlFor = "dictionary-favorite-note";
    const favoriteNoteInput = document.createElement("input");
    favoriteNoteInput.id = "dictionary-favorite-note";
    favoriteNoteInput.type = "text";
    favoriteNoteInput.className = "settings-value";
    favoriteNoteInput.maxLength = 120;
    favoriteNoteInput.placeholder = "可选，例如：工作常用 / 考试词汇";
    favoriteNoteInput.value =
      dictionaryPanelFavorites.find(
        (item) =>
          dictionaryPanelEntry &&
          item.word.trim().toLowerCase() ===
            dictionaryPanelEntry.word.trim().toLowerCase()
      )?.note ?? "";
    const favoriteNoteActions = document.createElement("div");
    favoriteNoteActions.className = "dictionary-favorite-note-actions";
    const favoriteNoteSave = document.createElement("button");
    favoriteNoteSave.type = "button";
    favoriteNoteSave.className = "settings-btn settings-btn-secondary";
    favoriteNoteSave.textContent = "保存备注";
    favoriteNoteSave.addEventListener("click", () => {
      if (!dictionaryPanelEntry) {
        return;
      }
      void saveDictionaryFavoriteNote(
        form,
        dictionaryPanelEntry.word,
        favoriteNoteInput.value
      );
    });
    favoriteNoteActions.appendChild(favoriteNoteSave);
    favoriteNoteField.append(
      favoriteNoteLabel,
      favoriteNoteInput,
      favoriteNoteActions
    );

    const candidatesSection = document.createElement("section");
    candidatesSection.className = "dictionary-side-section";
    candidatesSection.hidden = dictionaryPanelCandidates.length <= 1;
    const candidatesHead = document.createElement("div");
    candidatesHead.className = "dictionary-side-head";
    const candidatesTitle = document.createElement("h4");
    candidatesTitle.className = "dictionary-side-title";
    candidatesTitle.textContent = "其他释义";
    const candidatesMeta = document.createElement("span");
    candidatesMeta.className = "dictionary-side-meta";
    candidatesMeta.textContent = `${Math.max(0, dictionaryPanelCandidates.length - 1)} 条`;
    candidatesHead.append(candidatesTitle, candidatesMeta);
    const candidatesList = document.createElement("div");
    candidatesList.className = "dictionary-word-list";
    for (const candidate of dictionaryPanelCandidates.slice(1)) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "dictionary-word-row-main";
      const wordEl = document.createElement("div");
      wordEl.className = "dictionary-word-row-word";
      wordEl.textContent = candidate.word;
      const previewEl = document.createElement("div");
      previewEl.className = "dictionary-word-row-preview";
      previewEl.textContent =
        candidate.translation.split("\n")[0]?.trim() ||
        (candidate.phonetic ? `/${candidate.phonetic}/` : "点击切换到该词条");
      row.append(wordEl, previewEl);
      row.addEventListener("click", () => {
        dictionaryPanelEntry = candidate;
        dictionaryPanelCandidates = [
          candidate,
          ...dictionaryPanelCandidates.filter((item) => item.word !== candidate.word)
        ];
        if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
          renderList();
        }
        setStatus(`已切换到「${candidate.word}」。`);
      });
      candidatesList.appendChild(row);
    }
    candidatesSection.append(candidatesHead, candidatesList);

    const favoritesSection = document.createElement("section");
    favoritesSection.className = "dictionary-side-section";
    const favoritesHead = document.createElement("div");
    favoritesHead.className = "dictionary-side-head";
    const favoritesTitle = document.createElement("h4");
    favoritesTitle.className = "dictionary-side-title";
    favoritesTitle.textContent = "收藏";
    const favoritesMeta = document.createElement("span");
    favoritesMeta.className = "dictionary-side-meta";
    favoritesMeta.textContent = `${dictionaryPanelFavorites.length} 条`;
    favoritesHead.append(favoritesTitle, favoritesMeta);
    const favoritesList = document.createElement("div");
    favoritesList.className = "dictionary-word-list";
    renderDictionaryBookmarkList(favoritesList, dictionaryPanelFavorites, {
      emptyText: "还没有收藏词。查询后点「收藏」即可加入。",
      removeLabel: "取消",
      onSelect: (word) => {
        void lookupDictionaryWordFromPanel(form, word);
      },
      onRemove: (word) => {
        void removeDictionaryPanelFavorite(form, word);
      }
    });
    favoritesSection.append(favoritesHead, favoritesList);

    const historySection = document.createElement("section");
    historySection.className = "dictionary-side-section";
    const historyHead = document.createElement("div");
    historyHead.className = "dictionary-side-head";
    const historyTitle = document.createElement("h4");
    historyTitle.className = "dictionary-side-title";
    historyTitle.textContent = "最近查询";
    const historyMeta = document.createElement("span");
    historyMeta.className = "dictionary-side-meta";
    const filteredHistory = dictionaryPanelHistory.filter((item) => {
      if (dictionaryPanelHistoryFilter === "en") {
        return /^[A-Za-z]/.test(item.word);
      }
      if (dictionaryPanelHistoryFilter === "zh") {
        return /[\u3400-\u9fff]/.test(item.word) || /[\u3400-\u9fff]/.test(item.translationPreview);
      }
      return true;
    });
    historyMeta.textContent = `${filteredHistory.length} / ${dictionaryPanelHistory.length}`;
    const clearHistoryButton = document.createElement("button");
    clearHistoryButton.type = "button";
    clearHistoryButton.className = "dictionary-side-action";
    clearHistoryButton.textContent = "清空";
    clearHistoryButton.disabled = dictionaryPanelHistory.length === 0;
    clearHistoryButton.addEventListener("click", () => {
      void clearDictionaryPanelHistory(form);
    });
    historyHead.append(historyTitle, historyMeta, clearHistoryButton);

    const historyFilterRow = document.createElement("div");
    historyFilterRow.className = "dictionary-history-filters";
    (
      [
        ["all", "全部"],
        ["en", "英文"],
        ["zh", "中文"]
      ] as const
    ).forEach(([value, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `dictionary-history-filter${
        dictionaryPanelHistoryFilter === value ? " is-active" : ""
      }`;
      button.textContent = label;
      button.addEventListener("click", () => {
        dictionaryPanelHistoryFilter = value;
        if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
          renderList();
        }
      });
      historyFilterRow.appendChild(button);
    });

    const historyList = document.createElement("div");
    historyList.className = "dictionary-word-list";
    renderDictionaryBookmarkList(historyList, filteredHistory, {
      emptyText:
        dictionaryPanelHistoryFilter === "all"
          ? "还没有查询记录。成功查词后会显示在这里。"
          : "当前筛选下没有记录。",
      removeLabel: "删除",
      onSelect: (word) => {
        void lookupDictionaryWordFromPanel(form, word);
      },
      onRemove: (word) => {
        void removeDictionaryPanelHistoryItem(form, word);
      }
    });
    historySection.append(historyHead, historyFilterRow, historyList);

    const actions = document.createElement("div");
    actions.className = "settings-actions";

    const lookupButton = document.createElement("button");
    lookupButton.type = "submit";
    lookupButton.className = "settings-btn settings-btn-primary";
    lookupButton.textContent = "查询";
    lookupButton.setAttribute("data-action", "dictionary-lookup");

    const favoriteButton = document.createElement("button");
    favoriteButton.type = "button";
    favoriteButton.className = "settings-btn settings-btn-secondary";
    favoriteButton.textContent = isCurrentDictionaryEntryFavorited()
      ? "取消收藏"
      : "收藏";
    favoriteButton.disabled = !dictionaryPanelEntry;
    favoriteButton.addEventListener("click", () => {
      void toggleDictionaryPanelFavorite(form);
    });

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "settings-btn settings-btn-secondary";
    copyButton.textContent = "复制释义";
    copyButton.addEventListener("click", () => {
      if (!dictionaryPanelEntry) {
        setStatus("没有可复制的释义。");
        return;
      }
      const exchangeText = formatDictionaryExchangeForPanel(
        dictionaryPanelEntry.exchange ?? ""
      );
      const parts = [
        dictionaryPanelEntry.word,
        dictionaryPanelEntry.phonetic ? `/${dictionaryPanelEntry.phonetic}/` : "",
        dictionaryPanelEntry.translation,
        dictionaryPanelEntry.definition,
        exchangeText ? `词形变化：${exchangeText}` : ""
      ].filter(Boolean);
      void navigator.clipboard
        .writeText(parts.join("\n"))
        .then(() => setStatus("已复制释义到剪贴板。"))
        .catch(() => setStatus("复制失败，请手动选择文字复制。"));
    });

    const speakButton = document.createElement("button");
    speakButton.type = "button";
    speakButton.className = "settings-btn settings-btn-secondary";
    speakButton.textContent = "朗读";
    speakButton.disabled = !dictionaryPanelEntry;
    speakButton.setAttribute("data-action", "dictionary-speak");
    speakButton.addEventListener("click", () => {
      if (!dictionaryPanelEntry) {
        setStatus("没有可朗读的词条。");
        return;
      }
      speakDictionaryEntry(dictionaryPanelEntry);
    });

    const exportFavoritesButton = document.createElement("button");
    exportFavoritesButton.type = "button";
    exportFavoritesButton.className = "settings-btn settings-btn-secondary";
    exportFavoritesButton.textContent = "导出收藏 CSV";
    exportFavoritesButton.setAttribute("data-action", "dictionary-export-csv");
    exportFavoritesButton.disabled = dictionaryPanelFavorites.length === 0;
    exportFavoritesButton.addEventListener("click", () => {
      void exportDictionaryFavoritesFromPanel();
    });

    const downloadPackButton = document.createElement("button");
    downloadPackButton.type = "button";
    downloadPackButton.className = "settings-btn settings-btn-secondary";
    downloadPackButton.textContent =
      dictionaryPackStatus?.tier === "full" && dictionaryPackStatus.usingUserPack
        ? "重新下载完整词库"
        : "下载完整词库（约 160MB）";
    downloadPackButton.setAttribute("data-action", "dictionary-download-pack");
    downloadPackButton.hidden = Boolean(
      dictionaryPackStatus?.tier === "full" && !dictionaryPackStatus.usingUserPack
    );
    downloadPackButton.addEventListener("click", () => {
      void downloadDictionaryPackFromPanel(
        downloadPackButton,
        packProgressWrap,
        packProgressBar,
        packProgressText
      );
    });

    const backToSearchButton = document.createElement("button");
    backToSearchButton.type = "button";
    backToSearchButton.className = "settings-btn settings-btn-secondary";
    backToSearchButton.textContent = "返回搜索";
    backToSearchButton.addEventListener("click", () => {
      backToSearch();
    });

    actions.append(
      lookupButton,
      favoriteButton,
      speakButton,
      copyButton,
      exportFavoritesButton,
      downloadPackButton,
      backToSearchButton
    );
    form.append(
      statusRow,
      packStatusRow,
      packProgressWrap,
      ttsField,
      queryField,
      dictionaryCard,
      favoriteNoteField,
      candidatesSection,
      favoritesSection,
      historySection,
      actions
    );
    panel.append(title, description, form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);
  },

  applyWebtoolsTranslatePanelPayload(panel: ActivePluginPanelState): void {
    translateToolPanelData = normalizeTranslateToolPanelData(panel.data);
    translateToolPanelView = "main";
    translateToolSourceText = "";
    translateToolResultText = "";
    translateToolDictionaryEntry = null;
  },

  renderWebtoolsTranslatePanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-translate-panel";

    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "文本翻译";

    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle ||
      "粘贴文字在线翻译为中文（百度翻译）。";

    const form = document.createElement("form");
    form.className = "settings-form webtools-translate-form";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (translateToolPanelView === "settings") {
        void saveTranslateToolSettings(form);
      } else {
        void runTranslateToolPanelTranslate(form);
      }
    });

    if (translateToolPanelView === "settings") {
      const settingsStatusRow = createLiteSnapInfoRow(
        "百度翻译设置",
        "配置后截图翻译与文本翻译共用同一套凭证",
        "通用版用 AppID+密钥；大模型版用 AppID+API Key"
      );

      const settingsRows = [
        createLiteSnapFieldRow(
          "翻译引擎",
          createLiteSnapSelect(
            "webtools-translate-baidu-engine",
            "baiduEngine",
            translateToolPanelData.settings.baiduEngine,
            [
              { value: "standard", label: "通用文本翻译" },
              { value: "llm", label: "大模型文本翻译" }
            ]
          ),
          "两种引擎使用不同的百度翻译 API"
        ),
        createLiteSnapFieldRow(
          "百度翻译 AppID",
          createLiteSnapTextInput(
            "webtools-translate-baidu-appid",
            "baiduAppId",
            translateToolPanelData.settings.baiduAppId,
            "在百度翻译开放平台创建应用后获取"
          ),
          "两种翻译引擎都需要"
        ),
        createLiteSnapFieldRow(
          "百度翻译密钥",
          createLiteSnapTextInput(
            "webtools-translate-baidu-secret",
            "baiduSecret",
            translateToolPanelData.settings.baiduSecret,
            "通用文本翻译使用",
            "password"
          ),
          "仅通用文本翻译需要，保存在本机"
        ),
        createLiteSnapFieldRow(
          "百度翻译 API Key",
          createLiteSnapTextInput(
            "webtools-translate-baidu-apikey",
            "baiduApiKey",
            translateToolPanelData.settings.baiduApiKey,
            "在开放平台「API Key 管理」创建",
            "password"
          ),
          "仅大模型文本翻译需要，保存在本机"
        ),
        createLiteSnapFieldRow(
          "启用划词翻译",
          createLiteSnapCheckbox(
            "webtools-selection-translate-enabled",
            "selectionTranslateEnabled",
            selectionTranslateSettingsState.enabled
          ),
          "选中文字后按快捷键弹出词典/翻译卡片"
        ),
        createLiteSnapFieldRow(
          "划词快捷键",
          createLiteSnapTextInput(
            "webtools-selection-translate-hotkey",
            "selectionTranslateHotkey",
            selectionTranslateSettingsState.hotkey,
            "F4"
          ),
          "默认 F4，可改为 Ctrl+Shift+D 等"
        ),
        createLiteSnapFieldRow(
          "恢复剪贴板",
          createLiteSnapCheckbox(
            "webtools-selection-translate-restore",
            "selectionTranslateRestoreClipboard",
            selectionTranslateSettingsState.restoreClipboard
          ),
          "划词抓取后还原原剪贴板内容，避免污染"
        ),
        createLiteSnapFieldRow(
          "点击空白关闭",
          createLiteSnapCheckbox(
            "webtools-selection-translate-dismiss-outside",
            "selectionTranslateDismissOutside",
            selectionTranslateSettingsState.dismissOnOutsideClick
          ),
          "开启后点击弹窗外空白处或失焦时自动关闭；关闭则需手动点关闭按钮或 Esc"
        )
      ];

      const settingsActions = document.createElement("div");
      settingsActions.className = "settings-actions";

      const saveButton = document.createElement("button");
      saveButton.type = "submit";
      saveButton.className = "settings-btn settings-btn-primary";
      saveButton.textContent = "保存设置";

      const backButton = document.createElement("button");
      backButton.type = "button";
      backButton.className = "settings-btn settings-btn-secondary";
      backButton.textContent = "返回翻译";
      backButton.addEventListener("click", () => {
        returnToTranslateToolMainView();
      });

      const backToSearchButton = document.createElement("button");
      backToSearchButton.type = "button";
      backToSearchButton.className = "settings-btn settings-btn-secondary";
      backToSearchButton.textContent = "返回搜索";
      backToSearchButton.addEventListener("click", () => {
        backToSearch();
      });

      settingsActions.append(saveButton, backButton, backToSearchButton);
      form.append(settingsStatusRow, ...settingsRows, settingsActions);
    } else {
      const statusRow = createLiteSnapInfoRow(
        "使用提示",
        translateToolPanelData.statusMessage,
        "英译中；可在设置中配置百度翻译凭证"
      );

      const sourceField = document.createElement("div");
      sourceField.className = "settings-field litesnap-ocr-field";

      const sourceLabel = document.createElement("label");
      sourceLabel.className = "settings-field-label";
      sourceLabel.textContent = "原文";
      sourceLabel.htmlFor = "webtools-translate-source";

      const sourceTextarea = document.createElement("textarea");
      sourceTextarea.id = "webtools-translate-source";
      sourceTextarea.name = "webtoolsTranslateSource";
      sourceTextarea.className = "litesnap-ocr-textarea";
      sourceTextarea.rows = 6;
      sourceTextarea.spellcheck = false;
      sourceTextarea.placeholder = "粘贴或输入要翻译的文字（英译中）";
      sourceTextarea.value = translateToolSourceText;
      sourceTextarea.addEventListener("input", () => {
        translateToolSourceText = sourceTextarea.value;
      });
      sourceField.append(sourceLabel, sourceTextarea);

      const dictionaryCard = document.createElement("div");
      dictionaryCard.id = "webtools-translate-dictionary-card";
      dictionaryCard.className = "translate-dictionary-card";
      dictionaryCard.hidden = !translateToolDictionaryEntry;
      if (translateToolDictionaryEntry) {
        const wordEl = document.createElement("div");
        wordEl.className = "translate-dictionary-card__word";
        wordEl.textContent = translateToolDictionaryEntry.word;
        dictionaryCard.appendChild(wordEl);
        if (translateToolDictionaryEntry.phonetic) {
          const phoneticEl = document.createElement("div");
          phoneticEl.className = "translate-dictionary-card__phonetic";
          phoneticEl.textContent = `/${translateToolDictionaryEntry.phonetic}/`;
          dictionaryCard.appendChild(phoneticEl);
        }
        const metaText = [
          translateToolDictionaryEntry.pos,
          translateToolDictionaryEntry.tags
        ]
          .filter(Boolean)
          .join(" · ");
        if (metaText) {
          const metaEl = document.createElement("div");
          metaEl.className = "translate-dictionary-card__meta";
          metaEl.textContent = metaText;
          dictionaryCard.appendChild(metaEl);
        }
        if (translateToolDictionaryEntry.translation) {
          const translationEl = document.createElement("div");
          translationEl.className = "translate-dictionary-card__text";
          translationEl.textContent = translateToolDictionaryEntry.translation;
          dictionaryCard.appendChild(translationEl);
        }
      }

      const resultField = document.createElement("div");
      resultField.className = "settings-field litesnap-ocr-field";

      const resultLabel = document.createElement("label");
      resultLabel.className = "settings-field-label";
      resultLabel.textContent = "中文译文";
      resultLabel.htmlFor = "webtools-translate-result";

      const resultTextarea = document.createElement("textarea");
      resultTextarea.id = "webtools-translate-result";
      resultTextarea.className = "litesnap-ocr-textarea";
      resultTextarea.rows = 6;
      resultTextarea.spellcheck = false;
      resultTextarea.readOnly = true;
      resultTextarea.value = translateToolResultText;
      resultTextarea.placeholder = "翻译结果将显示在这里";
      resultField.append(resultLabel, resultTextarea);

      const actions = document.createElement("div");
      actions.className = "settings-actions";

      const translateButton = document.createElement("button");
      translateButton.type = "submit";
      translateButton.className = "settings-btn settings-btn-primary";
      translateButton.textContent = "翻译";
      translateButton.setAttribute("data-action", "translate-run");

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "settings-btn settings-btn-secondary";
      copyButton.textContent = "复制译文";
      copyButton.addEventListener("click", () => {
        const value = resultTextarea.value;
        if (!value.trim()) {
          setStatus("没有可复制的译文。");
          return;
        }
        void navigator.clipboard
          .writeText(value)
          .then(() => setStatus("已复制译文到剪贴板。"))
          .catch(() => setStatus("复制失败，请手动选择文字复制。"));
      });

      const settingsButton = document.createElement("button");
      settingsButton.type = "button";
      settingsButton.className = "settings-btn settings-btn-secondary";
      settingsButton.textContent = "翻译设置";
      settingsButton.addEventListener("click", () => {
        openTranslateToolSettingsView();
      });

      const backToSearchButton = document.createElement("button");
      backToSearchButton.type = "button";
      backToSearchButton.className = "settings-btn settings-btn-secondary";
      backToSearchButton.textContent = "返回搜索";
      backToSearchButton.addEventListener("click", () => {
        backToSearch();
      });

      actions.append(
        translateButton,
        copyButton,
        settingsButton,
        backToSearchButton
      );
      form.append(statusRow, sourceField, dictionaryCard, resultField, actions);
    }

    panel.append(title, description, form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);
  },

  applyCodeAgentSwitchPanelPayload(panel: unknown): void {
    codeAgentSwitchData = getCodeAgentSwitchDataFromPanel(panel);
    codeAgentSwitchCopyState = "";
    syncCodeAgentSwitchSelectionFromData();
  },

  renderCodeAgentSwitchPanel(): void {
    renderCodeAgentSwitchPanelV2();
  },

  applyWebtoolsCronPanelPayload(panel: ActivePluginPanelState): void {
    const data = toRecord(panel.data);
    hydrateWebtoolsCronTemplates(data);
    resetWebtoolsCronState(
      data && typeof data.expression === "string" ? data.expression : webtoolsCronExpression
    );
    hydrateWebtoolsCronState(data);
  },

  renderWebtoolsCronPanel(): void {
    renderWebtoolsCronPanelV2();
    return;

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
  },

  applyWebtoolsJsonSchemaPanelPayload(panel: ActivePluginPanelState): void {
    const data = toRecord(panel.data);
    webtoolsJsonSchemaText =
      data && typeof data.schema === "string" ? data.schema : webtoolsJsonSchemaText;
    webtoolsJsonSchemaPayload =
      data && typeof data.payload === "string" ? data.payload : webtoolsJsonSchemaPayload;
    webtoolsJsonSchemaValid = null;
    webtoolsJsonSchemaInfo = "";
    webtoolsJsonSchemaErrors = [];
  },

  renderWebtoolsJsonSchemaPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-json-schema-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-json-schema-form";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsJsonSchemaValidate(form, { render: false });
    });

    const header = document.createElement("div");
    header.className = "webtools-json-schema-header";
    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "JSON Schema 校验";
    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle || "左侧 Schema，右侧 Payload，自动展示错误路径。";
    header.append(title, description);

    const editors = document.createElement("div");
    editors.className = "webtools-json-schema-editors";

    const schemaWrap = document.createElement("label");
    schemaWrap.className = "webtools-json-schema-editor";
    const schemaLabel = document.createElement("span");
    schemaLabel.className = "settings-row-label";
    schemaLabel.textContent = "Schema";
    const schemaArea = document.createElement("textarea");
    schemaArea.className = "settings-value webtools-textarea";
    schemaArea.name = "webtoolsJsonSchemaText";
    schemaArea.value = webtoolsJsonSchemaText;
    schemaArea.placeholder = "输入 JSON Schema";
    schemaWrap.append(schemaLabel, schemaArea);

    const payloadWrap = document.createElement("label");
    payloadWrap.className = "webtools-json-schema-editor";
    const payloadLabel = document.createElement("span");
    payloadLabel.className = "settings-row-label";
    payloadLabel.textContent = "Payload";
    const payloadArea = document.createElement("textarea");
    payloadArea.className = "settings-value webtools-textarea";
    payloadArea.name = "webtoolsJsonSchemaPayload";
    payloadArea.value = webtoolsJsonSchemaPayload;
    payloadArea.placeholder = "输入待校验 JSON";
    payloadWrap.append(payloadLabel, payloadArea);

    editors.append(schemaWrap, payloadWrap);

    const info = document.createElement("div");
    info.className = "webtools-json-schema-info";
    info.dataset.state = "idle";

    const errors = document.createElement("ul");
    errors.className = "webtools-json-schema-errors";
    errors.hidden = true;

    const actions = document.createElement("div");
    actions.className = "settings-actions";
    const validateButton = document.createElement("button");
    validateButton.type = "submit";
    validateButton.className = "settings-btn settings-btn-primary";
    validateButton.textContent = "立即校验";
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "settings-btn settings-btn-secondary";
    copyButton.textContent = "复制结果";
    copyButton.addEventListener("click", () => {
      const lines =
        webtoolsJsonSchemaValid === true
          ? ["校验通过"]
          : webtoolsJsonSchemaErrors.map((error) => `${error.path} ${error.message}`);
      void copyTextToClipboard(lines.join("\n")).then((copied) => {
        setStatus(copied ? "已复制校验结果" : "复制失败");
      });
    });
    actions.append(validateButton, copyButton);

    [schemaArea, payloadArea].forEach((node) => {
      node.addEventListener("input", () => {
        scheduleWebtoolsJsonSchemaAutoValidate(form);
      });
    });

    form.append(header, editors, info, errors, actions);
    panel.append(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsJsonSchemaResultInForm(form);
    scheduleWebtoolsJsonSchemaAutoValidate(form, true);
  },

  applyWebtoolsDataMaskPanelPayload(panel: ActivePluginPanelState): void {
    const data = toRecord(panel.data);
    webtoolsDataMaskInput =
      data && typeof data.input === "string" ? data.input : webtoolsDataMaskInput;
    webtoolsDataMaskPhone =
      data && typeof data.maskPhone === "boolean" ? data.maskPhone : webtoolsDataMaskPhone;
    webtoolsDataMaskEmail =
      data && typeof data.maskEmail === "boolean" ? data.maskEmail : webtoolsDataMaskEmail;
    webtoolsDataMaskIdCard =
      data && typeof data.maskIdCard === "boolean" ? data.maskIdCard : webtoolsDataMaskIdCard;
    webtoolsDataMaskFakeKind =
      data &&
      (data.fakeKind === "name" ||
        data.fakeKind === "email" ||
        data.fakeKind === "phone" ||
        data.fakeKind === "uuid" ||
        data.fakeKind === "company")
        ? data.fakeKind
        : webtoolsDataMaskFakeKind;
    webtoolsDataMaskFakeCount =
      data && typeof data.fakeCount === "number"
        ? Math.max(1, Math.min(50, Math.round(data.fakeCount)))
        : webtoolsDataMaskFakeCount;
    webtoolsDataMaskOutput = "";
    webtoolsDataMaskInfo = "";
  },

  renderWebtoolsDataMaskPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-data-mask-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-data-mask-form";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsDataMaskAction(form, webtoolsDataMaskMode, { render: false });
    });

    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "文本脱敏 / 假数据";
    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle || "日志分享前脱敏，或一键生成测试数据。";

    const inputWrap = document.createElement("label");
    inputWrap.className = "settings-row webtools-row-full";
    const inputLabel = document.createElement("span");
    inputLabel.className = "settings-row-label";
    inputLabel.textContent = "输入文本";
    const inputArea = document.createElement("textarea");
    inputArea.className = "settings-value webtools-textarea";
    inputArea.name = "webtoolsDataMaskInput";
    inputArea.value = webtoolsDataMaskInput;
    inputWrap.append(inputLabel, inputArea);

    const optionsRow = document.createElement("div");
    optionsRow.className = "webtools-password-flags webtools-data-mask-options";
    [
      ["webtoolsDataMaskPhone", "脱敏手机号", webtoolsDataMaskPhone],
      ["webtoolsDataMaskEmail", "脱敏邮箱", webtoolsDataMaskEmail],
      ["webtoolsDataMaskIdCard", "脱敏身份证", webtoolsDataMaskIdCard]
    ].forEach(([name, label, checked]) => {
      const wrap = document.createElement("label");
      wrap.className = "webtools-password-flag";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = String(name);
      input.className = "password-checkbox";
      input.checked = Boolean(checked);
      const text = document.createElement("span");
      text.textContent = String(label);
      wrap.append(input, text);
      optionsRow.appendChild(wrap);
    });

    const fakeRow = document.createElement("div");
    fakeRow.className = "webtools-data-mask-fake-row";
    const kindWrap = document.createElement("label");
    kindWrap.className = "settings-row";
    const kindLabel = document.createElement("span");
    kindLabel.className = "settings-row-label";
    kindLabel.textContent = "假数据类型";
    const kindSelect = document.createElement("select");
    kindSelect.className = "settings-value";
    kindSelect.name = "webtoolsDataMaskFakeKind";
    [
      ["uuid", "UUID"],
      ["name", "姓名"],
      ["email", "邮箱"],
      ["phone", "手机号"],
      ["company", "公司名"]
    ].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = webtoolsDataMaskFakeKind === value;
      kindSelect.appendChild(option);
    });
    kindWrap.append(kindLabel, kindSelect);

    const countWrap = document.createElement("label");
    countWrap.className = "settings-row";
    const countLabel = document.createElement("span");
    countLabel.className = "settings-row-label";
    countLabel.textContent = "生成条数";
    const countInput = document.createElement("input");
    countInput.className = "settings-value";
    countInput.type = "number";
    countInput.min = "1";
    countInput.max = "50";
    countInput.name = "webtoolsDataMaskFakeCount";
    countInput.value = String(webtoolsDataMaskFakeCount);
    countWrap.append(countLabel, countInput);
    fakeRow.append(kindWrap, countWrap);

    const outputWrap = document.createElement("label");
    outputWrap.className = "settings-row webtools-row-full";
    const outputLabel = document.createElement("span");
    outputLabel.className = "settings-row-label";
    outputLabel.textContent = "输出";
    const outputArea = document.createElement("textarea");
    outputArea.className = "settings-value webtools-textarea";
    outputArea.name = "webtoolsDataMaskOutput";
    outputArea.readOnly = true;
    outputArea.value = webtoolsDataMaskOutput;
    outputWrap.append(outputLabel, outputArea);

    const info = document.createElement("div");
    info.className = "webtools-data-mask-info";
    info.dataset.state = "idle";

    const actions = document.createElement("div");
    actions.className = "settings-actions";
    const maskButton = document.createElement("button");
    maskButton.type = "button";
    maskButton.className = "settings-btn settings-btn-primary";
    maskButton.textContent = "执行脱敏";
    maskButton.addEventListener("click", () => {
      webtoolsDataMaskMode = "mask";
      void executeWebtoolsDataMaskAction(form, "mask", { render: false });
    });
    const generateButton = document.createElement("button");
    generateButton.type = "button";
    generateButton.className = "settings-btn settings-btn-secondary";
    generateButton.textContent = "生成假数据";
    generateButton.addEventListener("click", () => {
      webtoolsDataMaskMode = "generate";
      void executeWebtoolsDataMaskAction(form, "generate", { render: false });
    });
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "settings-btn settings-btn-secondary";
    copyButton.textContent = "复制输出";
    copyButton.addEventListener("click", () => {
      void copyTextToClipboard(outputArea.value).then((copied) => {
        setStatus(copied ? "已复制输出" : "复制失败");
      });
    });
    actions.append(maskButton, generateButton, copyButton);

    form.append(title, description, inputWrap, optionsRow, fakeRow, outputWrap, info, actions);
    panel.append(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsDataMaskResultInForm(form);
  }
};
})();
