namespace RendererPanelRuntime {

  export const pluginConstants = window.__LL_PLUGIN_CONSTANTS__;

  if (!pluginConstants) {
    throw new Error("renderer plugin constants not initialized");
  }

  export const {
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

  export function createHardwareInspectorMetricGrid(
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

  export const CURRENCY_FORMATTER = new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0
  });

  export let activePluginPanel: ActivePluginPanelState | null = null;

  export let webtoolsPasswordOptions: WebtoolsPasswordOptions = {
    length: 16,
    count: 10,
    includeLowercase: true,
    includeUppercase: true,
    includeDigits: true,
    includeSymbols: true,
    symbolChars: "!@#$%^&*",
    excludeSimilar: false
  };

  export let webtoolsPasswordRows: WebtoolsPasswordResultRow[] = [];

  export let webtoolsJsonState: WebtoolsJsonState = {
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

  export type WebtoolsJsonSchemaValidationError = {
    path: string;
    message: string;
  };

  export let webtoolsJsonSchemaText = JSON.stringify(
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

  export let webtoolsJsonSchemaPayload = JSON.stringify({ name: "Alice", age: 28 }, null, 2);

  export let webtoolsJsonSchemaValid: boolean | null = null;

  export let webtoolsJsonSchemaInfo = "";

  export let webtoolsJsonSchemaErrors: WebtoolsJsonSchemaValidationError[] = [];

  export let webtoolsJsonSchemaAutoTimer: number | null = null;

  export let webtoolsJsonSchemaRequestToken = 0;

  export type WebtoolsDataMaskFakeKind = "name" | "email" | "phone" | "uuid" | "company";

  export let webtoolsDataMaskInput =
    "联系人：张三，手机 13812345678，邮箱 zhangsan@example.com，身份证 110101199001011234";

  export let webtoolsDataMaskOutput = "";

  export let webtoolsDataMaskInfo = "";

  export let webtoolsDataMaskPhone = true;

  export let webtoolsDataMaskEmail = true;

  export let webtoolsDataMaskIdCard = true;

  export let webtoolsDataMaskFakeKind: WebtoolsDataMaskFakeKind = "uuid";

  export let webtoolsDataMaskFakeCount = 5;

  export let webtoolsDataMaskMode: "mask" | "generate" = "mask";

  export const DEFAULT_WEBTOOLS_URL_INPUT =
    "https://www.example.com:8080/path/to/page?name=test&id=123#section-1";

  export function createEmptyWebtoolsUrlParts(): WebtoolsUrlParts {
    return {
      protocol: "",
      host: "",
      port: "",
      pathname: "",
      search: "",
      hash: ""
    };
  }

  export let webtoolsUrlState: WebtoolsUrlState = {
    input: DEFAULT_WEBTOOLS_URL_INPUT,
    info: "",
    valid: null,
    parts: createEmptyWebtoolsUrlParts(),
    queryRows: []
  };

  export let webtoolsDiffLeft = "";

  export let webtoolsDiffRight = "";

  export let webtoolsDiffIgnoreCase = false;

  export let webtoolsDiffIgnoreWhitespace = false;

  export let webtoolsDiffPrettyHtml = "";

  export let webtoolsDiffSummary: WebtoolsDiffSummary | null = null;

  export let webtoolsDiffAutoTimer: number | null = null;

  export let webtoolsDiffRequestToken = 0;

  export let webtoolsTimestampUnixInput = "";

  export let webtoolsTimestampDateInput = "";

  export let webtoolsTimestampDateOutput = "";

  export let webtoolsTimestampTimestampOutput = "";

  export let webtoolsTimestampUnit: "s" | "ms" = "s";

  export let webtoolsTimestampInfo = "";

  export let webtoolsTimestampAutoTimer: number | null = null;

  export let webtoolsTimestampClockTimer: number | null = null;

  export let webtoolsTimestampToDateRequestToken = 0;

  export let webtoolsTimestampToTimestampRequestToken = 0;

  export let webtoolsRegexPattern = "([a-z0-9_.-]+)@([a-z0-9.-]+)\\.([a-z.]{2,6})";

  export let webtoolsRegexFlags = "g";

  export let webtoolsRegexInput =
    "My emails are test@example.com and dev.ops-123@google.co.uk. Please feel free to match them!";

  export let webtoolsRegexReplacement = "";

  export let webtoolsRegexOutput = "";

  export let webtoolsRegexInfo = "";

  export let webtoolsRegexError = "";

  export let webtoolsRegexHighlightedHtml = "";

  export let webtoolsRegexRows: WebtoolsRegexMatchRow[] = [];

  export let webtoolsJsonAutoTimer: number | null = null;

  export let webtoolsPasswordRequestToken = 0;

  export let webtoolsJsonRequestToken = 0;

  export let webtoolsCryptoAlgorithm = "MD5";

  export let webtoolsCryptoMode: "encrypt" | "decrypt" = "encrypt";

  export let webtoolsCryptoInput = "";

  export let webtoolsCryptoOutput = "";

  export let webtoolsCryptoInfo = "";

  export let webtoolsCryptoSecret = "";

  export let webtoolsCryptoIv = "";

  export let webtoolsCryptoPublicKey = "";

  export let webtoolsCryptoPrivateKey = "";

  export let webtoolsCryptoRsaBits = 2048;

  export let webtoolsCryptoAutoTimer: number | null = null;

  export let webtoolsCryptoRequestToken = 0;

  export let removeActiveCryptoAlgorithmMenuListener: (() => void) | null = null;

  export let webtoolsJwtToken = "";

  export let webtoolsJwtHeader = "";

  export let webtoolsJwtPayload = "";

  export let webtoolsJwtSecret = "your-256-bit-secret";

  export let webtoolsJwtMode: "jws" | "jwe" = "jws";

  export let webtoolsJwtAlgorithm: "HS256" | "RS256" = "HS256";

  export let webtoolsJwtJweAlg: "dir" | "A256KW" = "dir";

  export let webtoolsJwtJweEnc: "A256GCM" | "A128GCM" = "A256GCM";

  export let webtoolsJwtVerified: boolean | null = null;

  export let webtoolsJwtInfo = "";

  export let webtoolsJwtAutoTimer: number | null = null;

  export let webtoolsJwtSignTimer: number | null = null;

  export let webtoolsJwtRequestToken = 0;

  export let webtoolsStringsInput = "hello_world_variable";

  export let webtoolsStringsCaseType = "camel";

  export let webtoolsStringsOutput = "";

  export let webtoolsStringsUuidCount = 5;

  export let webtoolsStringsUuidItems: string[] = [];

  export let webtoolsColorsInput = "#6c5ce7";

  export let webtoolsColorsHex = "#6c5ce7";

  export let webtoolsColorsRgb = "rgb(108, 92, 231)";

  export let webtoolsColorsHsl = "hsl(247, 74%, 63%)";

  export let webtoolsColorsShades: string[] = [];

  export let webtoolsColorsAutoTimer: number | null = null;

  export let webtoolsColorsRequestToken = 0;

  export const WEBTOOLS_COLORS_PRESETS = [
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

  export const WEBTOOLS_REGEX_DEFAULT_PATTERN = "([a-z0-9_.-]+)@([a-z0-9.-]+)\\.([a-z.]{2,6})";

  export const WEBTOOLS_REGEX_DEFAULT_INPUT =
    "My emails are test@example.com and dev.ops-123@google.co.uk. Please feel free to match them!";

  export const WEBTOOLS_REGEX_SAFE_FLAGS = "gimsuyd";

  export const WEBTOOLS_REGEX_TEMPLATES = [
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

  export const WEBTOOLS_PASSWORD_DEFAULT_SYMBOLS = "!@#$%^&*";

  export const WEBTOOLS_JWT_DEFAULT_SECRET = "your-256-bit-secret";

  export const WEBTOOLS_JWT_SAMPLE_TOKEN =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
    "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ." +
    "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

  export const WEBTOOLS_JWT_SAMPLE_HEADER = `{
    "alg": "HS256",
    "typ": "JWT"
  }`;

  export const WEBTOOLS_JWT_SAMPLE_PAYLOAD = `{
    "sub": "1234567890",
    "name": "John Doe",
    "iat": 1516239022
  }`;

  export const PASSWORD_LENGTH_MIN = 4;

  export const PASSWORD_LENGTH_MAX = 64;

  export const PASSWORD_COUNT_MIN = 1;

  export const PASSWORD_COUNT_MAX = 20;

  export const WEBTOOLS_PASSWORD_COUNT_MAX = 50;

  export let passwordPanelOptions: PasswordGeneratorOptions = {
    length: 16,
    includeSymbols: true,
    count: 1
  };

  export let passwordPanelGenerated: string[] = [];

  export let cashflowState: CashflowState | null = null;

  export let cashflowReports: CashflowReports | null = null;

  export let cashflowReviewMode = false;

  export let cashflowReviewHistory: CashflowReviewGame[] = [];

  export let cashflowReviewSelectedGameId: number | null = null;

  export let cashflowJobs: CashflowJobOption[] = [];

}
