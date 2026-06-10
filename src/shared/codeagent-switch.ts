export type CodeAgentSwitchDiagnosticLevel = "error" | "warning" | "info";

export interface CodexProviderConfig {
  id: string;
  name?: string;
  baseUrl?: string;
  wireApi?: string;
  envKey?: string;
  envKeyInstructions?: string;
  requiresOpenAiAuth: boolean;
  requestMaxRetries?: number;
  streamMaxRetries?: number;
  streamIdleTimeoutMs?: number;
  supportsWebsockets?: boolean;
  httpHeaders?: Record<string, string>;
  envHttpHeaders?: Record<string, string>;
  queryParams?: Record<string, string>;
}

export interface CodexProfileConfig {
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
  storageKind?: "embedded" | "standalone" | "snapshot";
  sourcePath?: string;
}

export interface CodexParsedConfig {
  profileName?: string;
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
  windows?: {
    sandbox?: string;
    sandboxPrivateDesktop?: boolean;
  };
  history?: {
    persistence?: string;
    maxBytes?: number;
  };
  providers: CodexProviderConfig[];
  profiles: CodexProfileConfig[];
}

export interface CodeAgentSwitchDiagnostic {
  id: string;
  level: CodeAgentSwitchDiagnosticLevel;
  message: string;
  suggestion: string;
}

export interface CodexDiagnoseOptions {
  env?: Record<string, string | undefined>;
  hasAuthJson?: boolean;
  projectConfigPath?: string;
}

export interface CodeAgentSwitchEnvCommands {
  powershellCurrent: string;
  powershellUser: string;
  bash: string;
}

function encodeCodeAgentSwitchBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index] ?? 0);
  }
  return globalThis.btoa(binary);
}

export function buildCodeAgentSwitchPowerShellUserEnvScript(
  envKey: string,
  apiKey: string,
  includeCurrentSession = false
): string {
  const envKeyBase64 = encodeCodeAgentSwitchBase64Utf8(envKey);
  const apiKeyBase64 = encodeCodeAgentSwitchBase64Utf8(apiKey);
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

export interface CodeAgentSwitchProfilePreview {
  profileId: string;
  providerId?: string;
  changedFields: string[];
  diffLines: string[];
  newSource: string;
}

export function listCodexRootChangedFields(input: CodexRootConfigInput): string[] {
  const changedFields: string[] = [];

  for (const [inputKey, { key, clearField }] of new Map<
    string,
    {
      key: (typeof ROOT_CONFIG_FIELD_ORDER)[number];
      clearField: string;
    }
  >([
    ["modelProvider", { key: "model_provider", clearField: "modelProvider" }],
    ["model", { key: "model", clearField: "model" }],
    ["reviewModel", { key: "review_model", clearField: "reviewModel" }],
    ["openaiBaseUrl", { key: "openai_base_url", clearField: "openaiBaseUrl" }],
    [
      "modelReasoningEffort",
      { key: "model_reasoning_effort", clearField: "modelReasoningEffort" }
    ],
    [
      "planModeReasoningEffort",
      { key: "plan_mode_reasoning_effort", clearField: "planModeReasoningEffort" }
    ],
    [
      "modelReasoningSummary",
      { key: "model_reasoning_summary", clearField: "modelReasoningSummary" }
    ],
    ["modelVerbosity", { key: "model_verbosity", clearField: "modelVerbosity" }],
    [
      "modelSupportsReasoningSummaries",
      {
        key: "model_supports_reasoning_summaries",
        clearField: "modelSupportsReasoningSummaries"
      }
    ],
    ["serviceTier", { key: "service_tier", clearField: "serviceTier" }],
    ["webSearch", { key: "web_search", clearField: "webSearch" }],
    ["modelContextWindow", { key: "model_context_window", clearField: "modelContextWindow" }],
    [
      "modelAutoCompactTokenLimit",
      {
        key: "model_auto_compact_token_limit",
        clearField: "modelAutoCompactTokenLimit"
      }
    ],
    ["approvalPolicy", { key: "approval_policy", clearField: "approvalPolicy" }],
    ["approvalsReviewer", { key: "approvals_reviewer", clearField: "approvalsReviewer" }],
    ["allowLoginShell", { key: "allow_login_shell", clearField: "allowLoginShell" }],
    ["sandboxMode", { key: "sandbox_mode", clearField: "sandboxMode" }],
    ["defaultPermissions", { key: "default_permissions", clearField: "defaultPermissions" }],
    [
      "disableResponseStorage",
      { key: "disable_response_storage", clearField: "disableResponseStorage" }
    ],
    ["networkAccess", { key: "network_access", clearField: "networkAccess" }],
    ["personality", { key: "personality", clearField: "personality" }],
    [
      "projectDocMaxBytes",
      { key: "project_doc_max_bytes", clearField: "projectDocMaxBytes" }
    ],
    [
      "toolOutputTokenLimit",
      { key: "tool_output_token_limit", clearField: "toolOutputTokenLimit" }
    ],
    [
      "windowsWslSetupAcknowledged",
      {
        key: "windows_wsl_setup_acknowledged",
        clearField: "windowsWslSetupAcknowledged"
      }
    ]
  ]).entries()) {
    const value = input[inputKey as keyof CodexRootConfigInput];
    if (value !== undefined || hasClearField(input, clearField)) {
      changedFields.push(key);
    }
  }

  if (
    normalizeOptionalString(input.windowsSandbox) !== undefined ||
    hasClearField(input, "windowsSandbox")
  ) {
    changedFields.push("windows.sandbox");
  }
  if (
    typeof input.windowsSandboxPrivateDesktop === "boolean" ||
    hasClearField(input, "windowsSandboxPrivateDesktop")
  ) {
    changedFields.push("windows.private_desktop");
  }
  if (
    normalizeOptionalString(input.historyPersistence) !== undefined ||
    hasClearField(input, "historyPersistence")
  ) {
    changedFields.push("history.persistence");
  }
  if (
    normalizeOptionalNumber(input.historyMaxBytes) !== undefined ||
    hasClearField(input, "historyMaxBytes")
  ) {
    changedFields.push("history.max_bytes");
  }

  return [...new Set(changedFields)];
}

export type CodeAgentSwitchProfileMatchLevel = "exact" | "partial" | "none";

export interface CodeAgentSwitchProfileMatch {
  profileId: string;
  level: CodeAgentSwitchProfileMatchLevel;
  matchedFields: string[];
  mismatchedFields: string[];
}

export interface CodeAgentSwitchActiveSummary {
  activeProviderId?: string;
  activeProvider?: CodexProviderConfig;
  activeProfileId?: string;
  activeProfile?: CodexProfileConfig;
  activeProfileMatch: CodeAgentSwitchProfileMatchLevel;
  matchedFields: string[];
  profileMatches: CodeAgentSwitchProfileMatch[];
  activeSource: CodeAgentSwitchActiveSource;
}

export interface CodeAgentSwitchActiveSource {
  kind: "root" | "embedded" | "standalone" | "snapshot";
  profileId?: string;
  label: string;
  detail: string;
  legacy?: boolean;
}

export interface CodeAgentSwitchLegacyMigrationResult {
  profile: CodexProfileConfig;
  configSource: string;
  profileSource: string;
  appliedToRoot: boolean;
}

export type CodexProviderConfigInput = Omit<
  CodexProviderConfig,
  "requiresOpenAiAuth"
> & {
  requiresOpenAiAuth?: boolean;
};

type TomlScalar = string | number | boolean;
type TomlPrimitive = TomlScalar | TomlScalar[];

const DOTTED_HEADER_PATTERN = /^([A-Za-z0-9_-]+)\.(.+)$/;
const PROFILE_SWITCH_FIELD_ORDER = [
  "profile",
  "model_provider",
  "model",
  "review_model",
  "model_reasoning_effort",
  "plan_mode_reasoning_effort",
  "model_reasoning_summary",
  "model_verbosity",
  "service_tier",
  "web_search",
  "model_auto_compact_token_limit"
] as const;
const TOP_LEVEL_PROFILE_TEMPLATE_FIELDS = PROFILE_SWITCH_FIELD_ORDER.filter(
  (key) => key !== "profile"
);
const TOML_BARE_SECTION_ID_PATTERN = /^[A-Za-z0-9_.-]+$/;
const ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TOML_BARE_KEY_PATTERN = /^[A-Za-z0-9_-]+$/;

function toCamelCodexKey(key: string): string {
  switch (key) {
    case "model_provider":
      return "modelProvider";
    case "profile":
      return "profile";
    case "review_model":
      return "reviewModel";
    case "openai_base_url":
      return "openaiBaseUrl";
    case "model_reasoning_effort":
      return "modelReasoningEffort";
    case "plan_mode_reasoning_effort":
      return "planModeReasoningEffort";
    case "model_reasoning_summary":
      return "modelReasoningSummary";
    case "model_verbosity":
      return "modelVerbosity";
    case "model_supports_reasoning_summaries":
      return "modelSupportsReasoningSummaries";
    case "service_tier":
      return "serviceTier";
    case "web_search":
      return "webSearch";
    case "model_context_window":
      return "modelContextWindow";
    case "model_auto_compact_token_limit":
      return "modelAutoCompactTokenLimit";
    case "approval_policy":
      return "approvalPolicy";
    case "approvals_reviewer":
      return "approvalsReviewer";
    case "allow_login_shell":
      return "allowLoginShell";
    case "sandbox_mode":
      return "sandboxMode";
    case "default_permissions":
      return "defaultPermissions";
    case "disable_response_storage":
      return "disableResponseStorage";
    case "network_access":
      return "networkAccess";
    case "personality":
      return "personality";
    case "project_doc_max_bytes":
      return "projectDocMaxBytes";
    case "tool_output_token_limit":
      return "toolOutputTokenLimit";
    case "windows_wsl_setup_acknowledged":
      return "windowsWslSetupAcknowledged";
    case "base_url":
      return "baseUrl";
    case "wire_api":
      return "wireApi";
    case "env_key":
      return "envKey";
    case "env_key_instructions":
      return "envKeyInstructions";
    case "requires_openai_auth":
      return "requiresOpenAiAuth";
    case "request_max_retries":
      return "requestMaxRetries";
    case "stream_max_retries":
      return "streamMaxRetries";
    case "stream_idle_timeout_ms":
      return "streamIdleTimeoutMs";
    case "supports_websockets":
      return "supportsWebsockets";
    case "sandbox_private_desktop":
      return "sandboxPrivateDesktop";
    case "persistence":
      return "persistence";
    case "max_bytes":
      return "maxBytes";
    default:
      return key;
  }
}

function findTomlCommentIndex(line: string): number {
  let inDoubleString = false;
  let inLiteralString = false;
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\" && inDoubleString) {
      escaped = true;
      continue;
    }
    if (char === '"' && !inLiteralString) {
      inDoubleString = !inDoubleString;
      continue;
    }
    if (char === "'" && !inDoubleString) {
      inLiteralString = !inLiteralString;
      continue;
    }
    if (char === "#" && !inDoubleString && !inLiteralString) {
      return index;
    }
  }
  return -1;
}

function splitTomlComment(line: string): { content: string; comment: string } {
  const commentIndex = findTomlCommentIndex(line);
  if (commentIndex === -1) {
    return { content: line, comment: "" };
  }
  return {
    content: line.slice(0, commentIndex),
    comment: line.slice(commentIndex)
  };
}

function stripTomlComment(line: string): string {
  return splitTomlComment(line).content;
}

function splitTomlArrayItems(value: string, lineNumber: number): string[] {
  const items: string[] = [];
  let buffer = "";
  let inDoubleString = false;
  let inLiteralString = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (escaped) {
      buffer += char;
      escaped = false;
      continue;
    }
    if (char === "\\" && inDoubleString) {
      buffer += char;
      escaped = true;
      continue;
    }
    if (char === '"' && !inLiteralString) {
      inDoubleString = !inDoubleString;
      buffer += char;
      continue;
    }
    if (char === "'" && !inDoubleString) {
      inLiteralString = !inLiteralString;
      buffer += char;
      continue;
    }
    if (char === "," && !inDoubleString && !inLiteralString) {
      items.push(buffer.trim());
      buffer = "";
      continue;
    }
    buffer += char;
  }

  if (inDoubleString || inLiteralString || escaped) {
    throw new Error(`Invalid TOML array at line ${lineNumber}`);
  }

  items.push(buffer.trim());
  return items.filter((item) => item.length > 0);
}

function parseTomlValue(rawValue: string, lineNumber: number): TomlPrimitive {
  const value = rawValue.trim();
  if (!value) {
    throw new Error(`Invalid TOML value at line ${lineNumber}`);
  }
  if (value.startsWith("[")) {
    if (!value.endsWith("]")) {
      throw new Error(`Invalid TOML array at line ${lineNumber}`);
    }
    const inner = value.slice(1, -1).trim();
    if (!inner) {
      return [];
    }
    return splitTomlArrayItems(inner, lineNumber).map((item) => {
      const parsed = parseTomlValue(item, lineNumber);
      if (Array.isArray(parsed)) {
        throw new Error(`Nested TOML arrays are not supported at line ${lineNumber}`);
      }
      return parsed;
    });
  }
  if (value.startsWith('"')) {
    if (!value.endsWith('"') || value.length === 1) {
      throw new Error(`Invalid TOML string at line ${lineNumber}`);
    }
    return value
      .slice(1, -1)
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'") || value.length === 1) {
      throw new Error(`Invalid TOML literal string at line ${lineNumber}`);
    }
    return value.slice(1, -1);
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (/^-?\d+$/.test(value)) {
    return Number(value);
  }
  throw new Error(`Unsupported TOML value at line ${lineNumber}`);
}

function assignTopLevel(config: CodexParsedConfig, key: string, value: TomlPrimitive): void {
  const camelKey = toCamelCodexKey(key);
  switch (camelKey) {
    case "name":
      if (typeof value === "string") {
        config.profileName = value;
      }
      return;
    case "modelProvider":
    case "profile":
    case "model":
    case "reviewModel":
    case "openaiBaseUrl":
    case "modelReasoningEffort":
    case "planModeReasoningEffort":
    case "modelReasoningSummary":
    case "modelVerbosity":
    case "serviceTier":
    case "webSearch":
    case "approvalPolicy":
    case "approvalsReviewer":
    case "sandboxMode":
    case "defaultPermissions":
    case "networkAccess":
    case "personality":
      if (typeof value === "string") {
        config[camelKey] = value;
      }
      return;
    case "modelSupportsReasoningSummaries":
    case "allowLoginShell":
    case "disableResponseStorage":
    case "windowsWslSetupAcknowledged":
      if (typeof value === "boolean") {
        config[camelKey] = value;
      }
      return;
    case "modelContextWindow":
    case "modelAutoCompactTokenLimit":
    case "projectDocMaxBytes":
    case "toolOutputTokenLimit":
      if (typeof value === "number") {
        config[camelKey] = value;
      }
      return;
    default:
      return;
  }
}

function assignWindows(config: CodexParsedConfig, key: string, value: TomlPrimitive): void {
  if (!config.windows) {
    config.windows = {};
  }
  const camelKey = toCamelCodexKey(key);
  switch (camelKey) {
    case "sandbox":
      if (typeof value === "string") {
        config.windows.sandbox = value;
      }
      return;
    case "sandboxPrivateDesktop":
      if (typeof value === "boolean") {
        config.windows.sandboxPrivateDesktop = value;
      }
      return;
    default:
      return;
  }
}

function assignHistory(
  config: CodexParsedConfig,
  key: string,
  value: TomlPrimitive
): void {
  if (!config.history) {
    config.history = {};
  }
  const camelKey = toCamelCodexKey(key);
  if (camelKey === "persistence" && typeof value === "string") {
    config.history.persistence = value;
    return;
  }
  if (camelKey === "maxBytes" && typeof value === "number") {
    config.history.maxBytes = value;
  }
}

function ensureProvider(
  config: CodexParsedConfig,
  id: string
): CodexProviderConfig {
  let provider = config.providers.find((item) => item.id === id);
  if (!provider) {
    provider = { id, requiresOpenAiAuth: false };
    config.providers.push(provider);
  }
  return provider;
}

function ensureProfile(config: CodexParsedConfig, id: string): CodexProfileConfig {
  let profile = config.profiles.find((item) => item.id === id);
  if (!profile) {
    profile = { id, storageKind: "embedded" };
    config.profiles.push(profile);
  } else if (!profile.storageKind) {
    profile.storageKind = "embedded";
  }
  return profile;
}

function assignProvider(
  provider: CodexProviderConfig,
  key: string,
  value: TomlPrimitive
): void {
  const camelKey = toCamelCodexKey(key);
  switch (camelKey) {
    case "name":
    case "baseUrl":
    case "wireApi":
    case "envKey":
    case "envKeyInstructions":
      if (typeof value === "string") {
        provider[camelKey] = value;
      }
      return;
    case "requiresOpenAiAuth":
      if (typeof value === "boolean") {
        provider.requiresOpenAiAuth = value;
      }
      return;
    case "supportsWebsockets":
      if (typeof value === "boolean") {
        provider.supportsWebsockets = value;
      }
      return;
    case "requestMaxRetries":
    case "streamMaxRetries":
    case "streamIdleTimeoutMs":
      if (typeof value === "number") {
        provider[camelKey] = value;
      }
      return;
    default:
      return;
  }
}

function assignProviderStringMap(
  provider: CodexProviderConfig,
  key: string,
  value: TomlPrimitive,
  mapName: "httpHeaders" | "envHttpHeaders" | "queryParams"
): void {
  if (typeof value !== "string") {
    return;
  }
  if (!provider[mapName]) {
    provider[mapName] = {};
  }
  provider[mapName]![key] = value;
}

function assignProfile(
  profile: CodexProfileConfig,
  key: string,
  value: TomlPrimitive
): void {
  const camelKey = toCamelCodexKey(key);
  switch (camelKey) {
    case "name":
      if (typeof value === "string") {
        profile.name = value;
      }
      return;
    case "modelProvider":
      if (typeof value === "string") {
        profile.providerId = value;
      }
      return;
    case "model":
    case "reviewModel":
    case "modelReasoningEffort":
    case "planModeReasoningEffort":
    case "modelReasoningSummary":
    case "modelVerbosity":
    case "serviceTier":
    case "webSearch":
      if (typeof value === "string") {
        profile[camelKey] = value;
      }
      return;
    case "modelAutoCompactTokenLimit":
      if (typeof value === "number") {
        profile.modelAutoCompactTokenLimit = value;
      }
      return;
    default:
      return;
  }
}

export function parseCodexTomlConfig(source: string): CodexParsedConfig {
  const config: CodexParsedConfig = {
    providers: [],
    profiles: []
  };
  let section: {
    kind:
      | "root"
      | "history"
      | "windows"
      | "provider"
      | "providerStringMap"
      | "profile"
      | "unknown";
    id?: string;
    mapName?: "httpHeaders" | "envHttpHeaders" | "queryParams";
  } = {
    kind: "root"
  };

  const lines = source.split(/\r?\n/);
  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = stripTomlComment(rawLine).trim();
    if (!line) {
      return;
    }

    if (line.startsWith("[")) {
      if (!line.endsWith("]") || line.startsWith("[[")) {
        throw new Error(`Unsupported TOML header at line ${lineNumber}`);
      }
      const header = line.slice(1, -1).trim();
      if (header === "history") {
        section = { kind: "history" };
        return;
      }
      if (header === "windows") {
        section = { kind: "windows" };
        return;
      }
      const dotted = DOTTED_HEADER_PATTERN.exec(header);
      if (dotted?.[1] === "model_providers" && dotted[2]) {
        const parts = parseTomlDottedPath(dotted[2], lineNumber);
        const id = parts[0];
        const subTable = parts[1];
        if (!id) {
          throw new Error(`Invalid TOML header at line ${lineNumber}`);
        }
        if (
          parts.length === 2 &&
          (subTable === "http_headers" ||
            subTable === "env_http_headers" ||
            subTable === "query_params")
        ) {
          const mapName =
            subTable === "http_headers"
              ? "httpHeaders"
              : subTable === "env_http_headers"
                ? "envHttpHeaders"
                : "queryParams";
          section = { kind: "providerStringMap", id, mapName };
          ensureProvider(config, id);
          return;
        }
        if (parts.length !== 1) {
          section = { kind: "unknown" };
          return;
        }
        section = { kind: "provider", id };
        ensureProvider(config, id);
        return;
      }
      if (dotted?.[1] === "profiles" && dotted[2]) {
        const id = parseTomlDottedId(dotted[2], lineNumber);
        section = { kind: "profile", id };
        ensureProfile(config, id);
        return;
      }
      section = { kind: "unknown" };
      return;
    }

    if (section.kind === "unknown") {
      return;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex <= 0) {
      throw new Error(`Invalid TOML assignment at line ${lineNumber}`);
    }
    const key = line.slice(0, equalsIndex).trim();
    const rawValue = line.slice(equalsIndex + 1);
    if (!key) {
      throw new Error(`Invalid TOML key at line ${lineNumber}`);
    }
    const value = parseTomlValue(rawValue, lineNumber);

    if (section.kind === "history") {
      assignHistory(config, key, value);
      return;
    }
    if (section.kind === "windows") {
      assignWindows(config, key, value);
      return;
    }
    if (section.kind === "provider" && section.id) {
      assignProvider(ensureProvider(config, section.id), key, value);
      return;
    }
    if (section.kind === "providerStringMap" && section.id && section.mapName) {
      assignProviderStringMap(ensureProvider(config, section.id), key, value, section.mapName);
      return;
    }
    if (section.kind === "profile" && section.id) {
      assignProfile(ensureProfile(config, section.id), key, value);
      return;
    }
    if (section.kind === "root") {
      assignTopLevel(config, key, value);
    }
  });

  return config;
}

function formatTomlValue(value: TomlPrimitive): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => formatTomlValue(item)).join(", ")}]`;
  }
  if (typeof value === "string") {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
}

function parseTomlDottedId(rawId: string, lineNumber = 0): string {
  const id = rawId.trim();
  if (!id) {
    throw new Error(lineNumber > 0 ? `Invalid TOML header at line ${lineNumber}` : "Invalid TOML header");
  }
  if (id.startsWith('"')) {
    if (!id.endsWith('"') || id.length === 1) {
      throw new Error(lineNumber > 0 ? `Invalid TOML header at line ${lineNumber}` : "Invalid TOML header");
    }
    return id
      .slice(1, -1)
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
  if (id.startsWith("'")) {
    if (!id.endsWith("'") || id.length === 1) {
      throw new Error(lineNumber > 0 ? `Invalid TOML header at line ${lineNumber}` : "Invalid TOML header");
    }
    return id.slice(1, -1);
  }
  return id;
}

function parseTomlDottedPath(rawPath: string, lineNumber = 0): string[] {
  const path = rawPath.trim();
  if (!path) {
    throw new Error(lineNumber > 0 ? `Invalid TOML header at line ${lineNumber}` : "Invalid TOML header");
  }
  const parts: string[] = [];
  let buffer = "";
  let inDoubleString = false;
  let inLiteralString = false;
  let escaped = false;
  for (let index = 0; index < path.length; index += 1) {
    const char = path[index];
    if (escaped) {
      buffer += char;
      escaped = false;
      continue;
    }
    if (char === "\\" && inDoubleString) {
      buffer += char;
      escaped = true;
      continue;
    }
    if (char === '"' && !inLiteralString) {
      inDoubleString = !inDoubleString;
      buffer += char;
      continue;
    }
    if (char === "'" && !inDoubleString) {
      inLiteralString = !inLiteralString;
      buffer += char;
      continue;
    }
    if (char === "." && !inDoubleString && !inLiteralString) {
      parts.push(parseTomlDottedId(buffer, lineNumber));
      buffer = "";
      continue;
    }
    buffer += char;
  }
  parts.push(parseTomlDottedId(buffer, lineNumber));
  return parts;
}

function formatTomlDottedId(id: string): string {
  return TOML_BARE_SECTION_ID_PATTERN.test(id)
    ? id
    : `"${id.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function formatTomlKey(key: string): string {
  return TOML_BARE_KEY_PATTERN.test(key)
    ? key
    : `"${key.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function assertTomlSectionId(id: string, label: string): string {
  const normalized = id.trim();
  if (!normalized) {
    throw new Error(`${label} id is required`);
  }
  if (/[\u0000-\u001f\u007f[\]\r\n]/u.test(normalized)) {
    throw new Error(`${label} id contains unsupported TOML table characters`);
  }
  return normalized;
}

function assertEnvKeyName(envKey: string | undefined): string | undefined {
  const normalized = normalizeOptionalString(envKey);
  if (!normalized) {
    return undefined;
  }
  if (!ENV_KEY_PATTERN.test(normalized)) {
    throw new Error("env_key must be an environment variable name, not a raw API key");
  }
  if (/^(sk-|sess-|eyJ)/i.test(normalized) || normalized.length > 80) {
    throw new Error("env_key must be an environment variable name, not a raw API key");
  }
  return normalized;
}

function normalizeProviderInput(input: CodexProviderConfigInput): CodexProviderConfig {
  const id = assertTomlSectionId(input.id, "Provider");
  const envKey = assertEnvKeyName(input.envKey);
  const requiresOpenAiAuth = Boolean(input.requiresOpenAiAuth);
  if (envKey && requiresOpenAiAuth) {
    throw new Error("Provider cannot use both env_key and requires_openai_auth");
  }
  const baseUrl = normalizeOptionalString(input.baseUrl);
  if (baseUrl && !/^https?:\/\//i.test(baseUrl)) {
    throw new Error("Provider base_url must start with http:// or https://");
  }
  return {
    id,
    name: normalizeOptionalString(input.name),
    baseUrl,
    wireApi: normalizeOptionalString(input.wireApi),
    envKey,
    envKeyInstructions: normalizeOptionalString(input.envKeyInstructions),
    requiresOpenAiAuth,
    requestMaxRetries: normalizeOptionalNumber(input.requestMaxRetries),
    streamMaxRetries: normalizeOptionalNumber(input.streamMaxRetries),
    streamIdleTimeoutMs: normalizeOptionalNumber(input.streamIdleTimeoutMs),
    supportsWebsockets:
      typeof input.supportsWebsockets === "boolean" ? input.supportsWebsockets : undefined,
    httpHeaders: normalizeStringMap(input.httpHeaders),
    envHttpHeaders: normalizeStringMap(input.envHttpHeaders),
    queryParams: normalizeStringMap(input.queryParams)
  };
}

function normalizeProfileInput(input: CodexProfileConfig): CodexProfileConfig {
  return {
    id: assertTomlSectionId(input.id, "Profile"),
    name: normalizeOptionalString(input.name),
    providerId: normalizeOptionalString(input.providerId),
    model: normalizeOptionalString(input.model),
    reviewModel: normalizeOptionalString(input.reviewModel),
    modelReasoningEffort: normalizeOptionalString(input.modelReasoningEffort),
    planModeReasoningEffort: normalizeOptionalString(input.planModeReasoningEffort),
    modelReasoningSummary: normalizeOptionalString(input.modelReasoningSummary),
    modelVerbosity: normalizeOptionalString(input.modelVerbosity),
    serviceTier: normalizeOptionalString(input.serviceTier),
    webSearch: normalizeOptionalString(input.webSearch),
    modelAutoCompactTokenLimit: normalizeOptionalNumber(
      input.modelAutoCompactTokenLimit
    ),
    storageKind: input.storageKind,
    sourcePath: input.sourcePath
  };
}

function normalizeOptionalNumber(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeStringMap(
  value: Record<string, string> | undefined
): Record<string, string> | undefined {
  if (!value) {
    return undefined;
  }
  const entries = Object.entries(value)
    .map(([key, mapValue]) => [key.trim(), mapValue.trim()] as const)
    .filter(([key, mapValue]) => key.length > 0 && mapValue.length > 0);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function appendTomlAssignment(
  lines: string[],
  key: string,
  value: TomlPrimitive | undefined
): void {
  if (value === undefined || value === "") {
    return;
  }
  lines.push(`${key} = ${formatTomlValue(value)}`);
}

function appendTomlStringMapSection(
  lines: string[],
  header: string,
  values: Record<string, string> | undefined
): void {
  const entries = Object.entries(values ?? {});
  if (entries.length === 0) {
    return;
  }
  lines.push("", header);
  for (const [key, value] of entries) {
    appendTomlAssignment(lines, formatTomlKey(key), value);
  }
}

function buildProviderSectionLines(provider: CodexProviderConfig): string[] {
  const lines = [`[model_providers.${formatTomlDottedId(provider.id)}]`];
  appendTomlAssignment(lines, "name", provider.name);
  appendTomlAssignment(lines, "base_url", provider.baseUrl);
  appendTomlAssignment(lines, "wire_api", provider.wireApi);
  appendTomlAssignment(lines, "env_key", provider.envKey);
  appendTomlAssignment(lines, "env_key_instructions", provider.envKeyInstructions);
  if (provider.requiresOpenAiAuth) {
    appendTomlAssignment(lines, "requires_openai_auth", true);
  }
  appendTomlAssignment(lines, "request_max_retries", provider.requestMaxRetries);
  appendTomlAssignment(lines, "stream_max_retries", provider.streamMaxRetries);
  appendTomlAssignment(
    lines,
    "stream_idle_timeout_ms",
    provider.streamIdleTimeoutMs
  );
  appendTomlAssignment(lines, "supports_websockets", provider.supportsWebsockets);
  const providerHeader = `[model_providers.${formatTomlDottedId(provider.id)}`;
  appendTomlStringMapSection(lines, `${providerHeader}.http_headers]`, provider.httpHeaders);
  appendTomlStringMapSection(
    lines,
    `${providerHeader}.env_http_headers]`,
    provider.envHttpHeaders
  );
  appendTomlStringMapSection(lines, `${providerHeader}.query_params]`, provider.queryParams);
  return lines;
}

function buildProfileSectionLines(profile: CodexProfileConfig): string[] {
  const lines = [`[profiles.${formatTomlDottedId(profile.id)}]`];
  appendTomlAssignment(lines, "name", profile.name);
  appendTomlAssignment(lines, "model_provider", profile.providerId);
  appendTomlAssignment(lines, "model", profile.model);
  appendTomlAssignment(lines, "review_model", profile.reviewModel);
  appendTomlAssignment(
    lines,
    "model_reasoning_effort",
    profile.modelReasoningEffort
  );
  appendTomlAssignment(
    lines,
    "plan_mode_reasoning_effort",
    profile.planModeReasoningEffort
  );
  appendTomlAssignment(lines, "model_reasoning_summary", profile.modelReasoningSummary);
  appendTomlAssignment(lines, "model_verbosity", profile.modelVerbosity);
  appendTomlAssignment(lines, "service_tier", profile.serviceTier);
  appendTomlAssignment(lines, "web_search", profile.webSearch);
  appendTomlAssignment(
    lines,
    "model_auto_compact_token_limit",
    profile.modelAutoCompactTokenLimit
  );
  return lines;
}

function buildStandaloneProfileLines(profile: CodexProfileConfig): string[] {
  const lines: string[] = [];
  appendTomlAssignment(lines, "name", profile.name);
  appendTomlAssignment(lines, "model_provider", profile.providerId);
  appendTomlAssignment(lines, "model", profile.model);
  appendTomlAssignment(lines, "review_model", profile.reviewModel);
  appendTomlAssignment(
    lines,
    "model_reasoning_effort",
    profile.modelReasoningEffort
  );
  appendTomlAssignment(
    lines,
    "plan_mode_reasoning_effort",
    profile.planModeReasoningEffort
  );
  appendTomlAssignment(lines, "model_reasoning_summary", profile.modelReasoningSummary);
  appendTomlAssignment(lines, "model_verbosity", profile.modelVerbosity);
  appendTomlAssignment(lines, "service_tier", profile.serviceTier);
  appendTomlAssignment(lines, "web_search", profile.webSearch);
  appendTomlAssignment(
    lines,
    "model_auto_compact_token_limit",
    profile.modelAutoCompactTokenLimit
  );
  return lines;
}

function getNewline(source: string): string {
  return source.includes("\r\n") ? "\r\n" : "\n";
}

function getTomlHeader(rawLine: string): string | undefined {
  const line = stripTomlComment(rawLine).trim();
  if (!line.startsWith("[") || !line.endsWith("]") || line.startsWith("[[")) {
    return undefined;
  }
  return line.slice(1, -1).trim();
}

function findSectionRange(
  source: string,
  tableName: "model_providers" | "profiles",
  id: string
): { start: number; end: number } | undefined {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line, index) => {
    const header = getTomlHeader(line);
    if (!header) {
      return false;
    }
    const dotted = DOTTED_HEADER_PATTERN.exec(header);
    if (dotted?.[1] !== tableName || dotted[2] === undefined) {
      return false;
    }
    const parts = parseTomlDottedPath(dotted[2], index + 1);
    return parts.length === 1 && parts[0] === id;
  });
  if (start === -1) {
    return undefined;
  }
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (getTomlHeader(lines[index]) !== undefined) {
      end = index;
      break;
    }
  }
  return { start, end };
}

function findProviderSectionRangeWithSubtables(
  source: string,
  id: string
): { start: number; end: number } | undefined {
  const lines = source.split(/\r?\n/);
  const baseRange = findSectionRange(source, "model_providers", id);
  if (!baseRange) {
    return undefined;
  }
  let end = baseRange.end;
  for (let index = baseRange.end; index < lines.length; index += 1) {
    const header = getTomlHeader(lines[index]);
    if (!header) {
      continue;
    }
    const dotted = DOTTED_HEADER_PATTERN.exec(header);
    if (dotted?.[1] !== "model_providers" || dotted[2] === undefined) {
      break;
    }
    const parts = parseTomlDottedPath(dotted[2], index + 1);
    if (parts[0] !== id) {
      break;
    }
    end = lines.length;
    for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
      if (getTomlHeader(lines[nextIndex]) !== undefined) {
        end = nextIndex;
        break;
      }
    }
    index = end - 1;
  }
  return { start: baseRange.start, end };
}

function replaceOrAppendSection(
  source: string,
  tableName: "model_providers" | "profiles",
  id: string,
  sectionLines: string[]
): string {
  const newline = getNewline(source);
  const lines = source.split(/\r?\n/);
  const range =
    tableName === "model_providers"
      ? findProviderSectionRangeWithSubtables(source, id)
      : findSectionRange(source, tableName, id);
  if (range) {
    lines.splice(range.start, range.end - range.start, ...sectionLines);
    return lines.join(newline);
  }

  const nextLines = [...lines];
  while (nextLines.length > 0 && nextLines[nextLines.length - 1] === "") {
    nextLines.pop();
  }
  if (nextLines.length > 0) {
    nextLines.push("");
  }
  nextLines.push(...sectionLines);
  return `${nextLines.join(newline)}${newline}`;
}

function deleteSection(
  source: string,
  tableName: "model_providers" | "profiles",
  id: string
): string {
  const newline = getNewline(source);
  const lines = source.split(/\r?\n/);
  const range = findSectionRange(source, tableName, id);
  if (!range) {
    throw new Error(`${tableName === "profiles" ? "Profile" : "Provider"} "${id}" does not exist`);
  }
  let deleteEnd = range.end;
  while (deleteEnd < lines.length && lines[deleteEnd]?.trim() === "") {
    deleteEnd += 1;
    break;
  }
  lines.splice(range.start, deleteEnd - range.start);
  return lines.join(newline);
}

function getTopLevelFieldValue(
  config: CodexParsedConfig,
  key: (typeof PROFILE_SWITCH_FIELD_ORDER)[number]
): TomlPrimitive | undefined {
  switch (key) {
    case "profile":
      return config.profile;
    case "model_provider":
      return config.modelProvider;
    case "model":
      return config.model;
    case "review_model":
      return config.reviewModel;
    case "model_reasoning_effort":
      return config.modelReasoningEffort;
    case "plan_mode_reasoning_effort":
      return config.planModeReasoningEffort;
    case "model_reasoning_summary":
      return config.modelReasoningSummary;
    case "model_verbosity":
      return config.modelVerbosity;
    case "service_tier":
      return config.serviceTier;
    case "web_search":
      return config.webSearch;
    case "model_auto_compact_token_limit":
      return config.modelAutoCompactTokenLimit;
    default:
      return undefined;
  }
}

function getProfileSwitchValues(profile: CodexProfileConfig): Map<string, TomlPrimitive> {
  const values = new Map<string, TomlPrimitive>();
  values.set("profile", profile.id);
  return values;
}

function getProfileTemplateValues(profile: CodexProfileConfig): Map<string, TomlPrimitive> {
  const values = new Map<string, TomlPrimitive>();
  if (profile.providerId) {
    values.set("model_provider", profile.providerId);
  }
  if (profile.model) {
    values.set("model", profile.model);
  }
  if (profile.reviewModel) {
    values.set("review_model", profile.reviewModel);
  }
  if (profile.modelReasoningEffort) {
    values.set("model_reasoning_effort", profile.modelReasoningEffort);
  }
  if (profile.planModeReasoningEffort) {
    values.set("plan_mode_reasoning_effort", profile.planModeReasoningEffort);
  }
  if (profile.modelReasoningSummary) {
    values.set("model_reasoning_summary", profile.modelReasoningSummary);
  }
  if (profile.modelVerbosity) {
    values.set("model_verbosity", profile.modelVerbosity);
  }
  if (profile.serviceTier) {
    values.set("service_tier", profile.serviceTier);
  }
  if (profile.webSearch) {
    values.set("web_search", profile.webSearch);
  }
  if (typeof profile.modelAutoCompactTokenLimit === "number") {
    values.set(
      "model_auto_compact_token_limit",
      profile.modelAutoCompactTokenLimit
    );
  }
  return values;
}

function getCurrentSwitchValues(config: CodexParsedConfig): Map<string, TomlPrimitive> {
  const values = new Map<string, TomlPrimitive>();
  for (const key of PROFILE_SWITCH_FIELD_ORDER) {
    const value = getTopLevelFieldValue(config, key);
    if (value !== undefined) {
      values.set(key, value);
    }
  }
  return values;
}

function buildProfileMatch(
  config: CodexParsedConfig,
  profile: CodexProfileConfig
): CodeAgentSwitchProfileMatch {
  const matchedFields: string[] = [];
  const mismatchedFields: string[] = [];
  if (typeof config.profile === "string" && config.profile.length > 0) {
    if (config.profile === profile.id) {
      matchedFields.push("profile");
    } else {
      mismatchedFields.push("profile");
    }
  } else {
    const current = getCurrentSwitchValues(config);
    const desired = getProfileTemplateValues(profile);
    for (const [key, desiredValue] of desired.entries()) {
      const currentValue = current.get(key as (typeof PROFILE_SWITCH_FIELD_ORDER)[number]);
      if (desiredValue === undefined) {
        continue;
      }
      if (currentValue !== undefined && desiredValue === currentValue) {
        matchedFields.push(key);
        continue;
      }
      mismatchedFields.push(key);
    }
  }

  const level =
    matchedFields.length > 0 && mismatchedFields.length === 0
      ? "exact"
      : matchedFields.length > 0
        ? "partial"
        : "none";

  return {
    profileId: profile.id,
    level,
    matchedFields,
    mismatchedFields
  };
}

function getPathBaseName(sourcePath: string | undefined): string | undefined {
  if (!sourcePath) {
    return undefined;
  }
  const normalized = sourcePath.replace(/\\/g, "/");
  const segments = normalized.split("/");
  return segments[segments.length - 1] || sourcePath;
}

function buildActiveSourceSummary(
  config: CodexParsedConfig,
  activeProfile: CodexProfileConfig | undefined,
  activeProfileMatch: CodeAgentSwitchProfileMatchLevel
): CodeAgentSwitchActiveSource {
  if (activeProfile) {
    if (activeProfile.storageKind === "standalone") {
      return {
        kind: "standalone",
        profileId: activeProfile.id,
        label: "独立 Profile",
        detail:
          getPathBaseName(activeProfile.sourcePath) ??
          `${activeProfile.id}.config.toml`
      };
    }
    if (activeProfile.storageKind === "snapshot") {
      return {
        kind: "snapshot",
        profileId: activeProfile.id,
        label: "历史快照",
        detail: getPathBaseName(activeProfile.sourcePath) ?? activeProfile.id
      };
    }
    return {
      kind: "embedded",
      profileId: activeProfile.id,
      label: "Legacy 内嵌 Profile",
      detail: `[profiles.${formatTomlDottedId(activeProfile.id)}] in config.toml`,
      legacy: true
    };
  }

  const rootDetail =
    activeProfileMatch === "partial"
      ? "config.toml 顶层字段与某个 Profile 部分匹配"
      : typeof config.profile === "string" && config.profile
        ? `config.toml legacy profile = "${config.profile}"`
        : "config.toml 顶层字段";
  return {
    kind: "root",
    label: "主配置",
    detail: rootDetail,
    legacy: typeof config.profile === "string" && config.profile.length > 0
  };
}

export function summarizeCodeAgentSwitchActiveConfig(
  config: CodexParsedConfig
): CodeAgentSwitchActiveSummary {
  const profileMatches = config.profiles.map((profile) =>
    buildProfileMatch(config, profile)
  );
  const exactMatch = profileMatches.find((match) => match.level === "exact");
  const fallbackMatch = exactMatch ?? profileMatches.find((match) => match.level === "partial");
  const matchedProfile = fallbackMatch
    ? config.profiles.find((profile) => profile.id === fallbackMatch.profileId)
    : undefined;
  const activeProviderId = config.modelProvider ?? matchedProfile?.providerId;
  const activeProvider = config.providers.find(
    (provider) => provider.id === activeProviderId
  );
  const activeProfile = exactMatch
    ? config.profiles.find((profile) => profile.id === exactMatch.profileId)
    : matchedProfile;
  const activeProfileMatch = exactMatch ? "exact" : fallbackMatch ? "partial" : "none";

  return {
    activeProviderId,
    activeProvider,
    activeProfileId: exactMatch?.profileId,
    activeProfile,
    activeProfileMatch,
    matchedFields: fallbackMatch?.matchedFields ?? [],
    profileMatches,
    activeSource: buildActiveSourceSummary(config, activeProfile, activeProfileMatch)
  };
}

export function upsertCodexProviderInToml(
  source: string,
  input: CodexProviderConfigInput
): string {
  parseCodexTomlConfig(source);
  const provider = normalizeProviderInput(input);
  const nextSource = replaceOrAppendSection(
    source,
    "model_providers",
    provider.id,
    buildProviderSectionLines(provider)
  );
  parseCodexTomlConfig(nextSource);
  return nextSource;
}

export function deleteCodexProviderInToml(source: string, providerId: string): string {
  const id = assertTomlSectionId(providerId, "Provider");
  const config = parseCodexTomlConfig(source);
  if (!config.providers.some((provider) => provider.id === id)) {
    throw new Error(`Provider "${id}" does not exist`);
  }
  if (config.modelProvider === id) {
    throw new Error(`Cannot delete active provider "${id}"`);
  }
  const referencingProfile = config.profiles.find(
    (profile) => profile.providerId === id
  );
  if (referencingProfile) {
    throw new Error(
      `Cannot delete provider "${id}" because it is referenced by profile "${referencingProfile.id}"`
    );
  }
  const nextSource = deleteSection(source, "model_providers", id);
  parseCodexTomlConfig(nextSource);
  return nextSource;
}

export function upsertCodexProfileInToml(
  source: string,
  input: CodexProfileConfig
): string {
  const config = parseCodexTomlConfig(source);
  const profile = normalizeProfileInput(input);
  if (profile.providerId && !config.providers.some((item) => item.id === profile.providerId)) {
    throw new Error(`Provider "${profile.providerId}" does not exist`);
  }
  const nextSource = replaceOrAppendSection(
    source,
    "profiles",
    profile.id,
    buildProfileSectionLines(profile)
  );
  parseCodexTomlConfig(nextSource);
  return nextSource;
}

export function deleteCodexProfileInToml(source: string, profileId: string): string {
  const id = assertTomlSectionId(profileId, "Profile");
  const config = parseCodexTomlConfig(source);
  if (!config.profiles.some((profile) => profile.id === id)) {
    throw new Error(`Profile "${id}" does not exist`);
  }
  const nextSource = deleteSection(source, "profiles", id);
  parseCodexTomlConfig(nextSource);
  return nextSource;
}

export interface CodexRuntimeConfigInput {
  approvalPolicy?: string;
  sandboxMode?: string;
  defaultPermissions?: string;
  networkAccess?: string;
  windowsSandbox?: string;
  windowsSandboxPrivateDesktop?: boolean;
}

export interface CodexRootConfigInput extends CodexRuntimeConfigInput {
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
  approvalsReviewer?: string;
  allowLoginShell?: boolean;
  personality?: string;
  projectDocMaxBytes?: number;
  toolOutputTokenLimit?: number;
  disableResponseStorage?: boolean;
  windowsWslSetupAcknowledged?: boolean;
  historyPersistence?: string;
  historyMaxBytes?: number;
  clearFields?: string[];
}

const RUNTIME_ROOT_FIELD_ORDER = [
  "approval_policy",
  "sandbox_mode",
  "default_permissions",
  "network_access"
] as const;

const ROOT_CONFIG_FIELD_ORDER = [
  "model_provider",
  "model",
  "review_model",
  "openai_base_url",
  "model_reasoning_effort",
  "plan_mode_reasoning_effort",
  "model_reasoning_summary",
  "model_verbosity",
  "model_supports_reasoning_summaries",
  "service_tier",
  "web_search",
  "model_context_window",
  "model_auto_compact_token_limit",
  "approval_policy",
  "approvals_reviewer",
  "allow_login_shell",
  "sandbox_mode",
  "default_permissions",
  "disable_response_storage",
  "network_access",
  "personality",
  "project_doc_max_bytes",
  "tool_output_token_limit",
  "windows_wsl_setup_acknowledged"
] as const;

function getRuntimeInputValue(
  input: CodexRuntimeConfigInput,
  key: (typeof RUNTIME_ROOT_FIELD_ORDER)[number]
): TomlPrimitive | undefined {
  switch (key) {
    case "approval_policy":
      return normalizeOptionalString(input.approvalPolicy);
    case "sandbox_mode":
      return normalizeOptionalString(input.sandboxMode);
    case "default_permissions":
      return normalizeOptionalString(input.defaultPermissions);
    case "network_access":
      return normalizeOptionalString(input.networkAccess);
    default:
      return undefined;
  }
}

function getRootInputValue(
  input: CodexRootConfigInput,
  key: (typeof ROOT_CONFIG_FIELD_ORDER)[number]
): TomlPrimitive | undefined {
  switch (key) {
    case "model_provider":
      return normalizeOptionalString(input.modelProvider);
    case "model":
      return normalizeOptionalString(input.model);
    case "review_model":
      return normalizeOptionalString(input.reviewModel);
    case "openai_base_url":
      return normalizeOptionalString(input.openaiBaseUrl);
    case "model_reasoning_effort":
      return normalizeOptionalString(input.modelReasoningEffort);
    case "plan_mode_reasoning_effort":
      return normalizeOptionalString(input.planModeReasoningEffort);
    case "model_reasoning_summary":
      return normalizeOptionalString(input.modelReasoningSummary);
    case "model_verbosity":
      return normalizeOptionalString(input.modelVerbosity);
    case "model_supports_reasoning_summaries":
      return typeof input.modelSupportsReasoningSummaries === "boolean"
        ? input.modelSupportsReasoningSummaries
        : undefined;
    case "service_tier":
      return normalizeOptionalString(input.serviceTier);
    case "web_search":
      return normalizeOptionalString(input.webSearch);
    case "model_context_window":
      return normalizeOptionalNumber(input.modelContextWindow);
    case "model_auto_compact_token_limit":
      return normalizeOptionalNumber(input.modelAutoCompactTokenLimit);
    case "approval_policy":
      return normalizeOptionalString(input.approvalPolicy);
    case "approvals_reviewer":
      return normalizeOptionalString(input.approvalsReviewer);
    case "allow_login_shell":
      return typeof input.allowLoginShell === "boolean" ? input.allowLoginShell : undefined;
    case "sandbox_mode":
      return normalizeOptionalString(input.sandboxMode);
    case "default_permissions":
      return normalizeOptionalString(input.defaultPermissions);
    case "disable_response_storage":
      return typeof input.disableResponseStorage === "boolean"
        ? input.disableResponseStorage
        : undefined;
    case "network_access":
      return normalizeOptionalString(input.networkAccess);
    case "personality":
      return normalizeOptionalString(input.personality);
    case "project_doc_max_bytes":
      return normalizeOptionalNumber(input.projectDocMaxBytes);
    case "tool_output_token_limit":
      return normalizeOptionalNumber(input.toolOutputTokenLimit);
    case "windows_wsl_setup_acknowledged":
      return typeof input.windowsWslSetupAcknowledged === "boolean"
        ? input.windowsWslSetupAcknowledged
        : undefined;
    default:
      return undefined;
  }
}

function hasClearField(input: CodexRootConfigInput, field: string): boolean {
  return input.clearFields?.includes(field) === true;
}

function upsertRootAssignments(
  source: string,
  values: Map<string, TomlPrimitive>
): string {
  return updateTrackedRootAssignments(source, new Set(values.keys()), values);
}

function updateTrackedRootAssignments(
  source: string,
  trackedKeys: Set<string>,
  values: Map<string, TomlPrimitive>
): string {
  const newline = getNewline(source);
  const lines = source.split(/\r?\n/);
  const firstHeaderIndex = lines.findIndex((line) => isTomlHeaderLine(line));
  const rootEndIndex = firstHeaderIndex === -1 ? lines.length : firstHeaderIndex;
  const seen = new Set<string>();
  for (let index = 0; index < rootEndIndex; index += 1) {
    const rawLine = lines[index] ?? "";
    const content = stripTomlComment(rawLine);
    const equalsIndex = content.indexOf("=");
    if (equalsIndex <= 0) {
      continue;
    }
    const key = content.slice(0, equalsIndex).trim();
    if (!trackedKeys.has(key)) {
      continue;
    }
    const value = values.get(key);
    if (value === undefined) {
      lines[index] = removeTopLevelAssignmentLine(rawLine);
    } else {
      lines[index] = replaceTomlAssignmentValue(rawLine, value);
      seen.add(key);
    }
  }
  const insertedLines: string[] = [];
  for (const [key, value] of values.entries()) {
    if (seen.has(key)) {
      continue;
    }
    insertedLines.push(`${key} = ${formatTomlValue(value)}`);
  }
  if (insertedLines.length > 0) {
    let insertIndex = rootEndIndex;
    while (insertIndex > 0 && lines[insertIndex - 1]?.trim() === "") {
      insertIndex -= 1;
    }
    lines.splice(insertIndex, 0, ...insertedLines);
  }
  return lines.join(newline);
}

function updateNamedSectionAssignments(
  source: string,
  headerName: string,
  trackedKeys: Set<string>,
  values: Map<string, TomlPrimitive>
): string {
  const newline = getNewline(source);
  const lines = source.split(/\r?\n/);
  const range = findNamedSectionRange(source, headerName);
  if (!range) {
    if (values.size === 0) {
      return source;
    }
    const sectionLines = [`[${headerName}]`];
    for (const [key, value] of values.entries()) {
      sectionLines.push(`${key} = ${formatTomlValue(value)}`);
    }
    return replaceOrAppendNamedSection(source, headerName, sectionLines);
  }

  const sectionLines = lines.slice(range.start, range.end);
  const nextSectionLines = [sectionLines[0] ?? `[${headerName}]`];
  const seen = new Set<string>();
  for (let index = 1; index < sectionLines.length; index += 1) {
    const rawLine = sectionLines[index] ?? "";
    const content = stripTomlComment(rawLine);
    const equalsIndex = content.indexOf("=");
    if (equalsIndex <= 0) {
      nextSectionLines.push(rawLine);
      continue;
    }
    const key = content.slice(0, equalsIndex).trim();
    if (!trackedKeys.has(key)) {
      nextSectionLines.push(rawLine);
      continue;
    }
    const value = values.get(key);
    if (value === undefined) {
      continue;
    }
    nextSectionLines.push(replaceTomlAssignmentValue(rawLine, value));
    seen.add(key);
  }

  for (const [key, value] of values.entries()) {
    if (seen.has(key)) {
      continue;
    }
    nextSectionLines.push(`${key} = ${formatTomlValue(value)}`);
  }

  const hasBody = nextSectionLines
    .slice(1)
    .some((line) => stripTomlComment(line).trim().length > 0);
  if (!hasBody) {
    lines.splice(range.start, range.end - range.start);
    return lines.join(newline);
  }
  lines.splice(range.start, range.end - range.start, ...nextSectionLines);
  return lines.join(newline);
}

export function updateCodexRootConfigInToml(
  source: string,
  input: CodexRootConfigInput
): string {
  parseCodexTomlConfig(source);

  const rootValues = new Map<string, TomlPrimitive>();
  const trackedRootKeys = new Set<string>();
  const rootFieldMap = new Map<
    string,
    {
      key: (typeof ROOT_CONFIG_FIELD_ORDER)[number];
      clearField: string;
    }
  >([
    ["modelProvider", { key: "model_provider", clearField: "modelProvider" }],
    ["model", { key: "model", clearField: "model" }],
    ["reviewModel", { key: "review_model", clearField: "reviewModel" }],
    ["openaiBaseUrl", { key: "openai_base_url", clearField: "openaiBaseUrl" }],
    [
      "modelReasoningEffort",
      { key: "model_reasoning_effort", clearField: "modelReasoningEffort" }
    ],
    [
      "planModeReasoningEffort",
      { key: "plan_mode_reasoning_effort", clearField: "planModeReasoningEffort" }
    ],
    [
      "modelReasoningSummary",
      { key: "model_reasoning_summary", clearField: "modelReasoningSummary" }
    ],
    ["modelVerbosity", { key: "model_verbosity", clearField: "modelVerbosity" }],
    [
      "modelSupportsReasoningSummaries",
      {
        key: "model_supports_reasoning_summaries",
        clearField: "modelSupportsReasoningSummaries"
      }
    ],
    ["serviceTier", { key: "service_tier", clearField: "serviceTier" }],
    ["webSearch", { key: "web_search", clearField: "webSearch" }],
    ["modelContextWindow", { key: "model_context_window", clearField: "modelContextWindow" }],
    [
      "modelAutoCompactTokenLimit",
      {
        key: "model_auto_compact_token_limit",
        clearField: "modelAutoCompactTokenLimit"
      }
    ],
    ["approvalPolicy", { key: "approval_policy", clearField: "approvalPolicy" }],
    ["approvalsReviewer", { key: "approvals_reviewer", clearField: "approvalsReviewer" }],
    ["allowLoginShell", { key: "allow_login_shell", clearField: "allowLoginShell" }],
    ["sandboxMode", { key: "sandbox_mode", clearField: "sandboxMode" }],
    ["defaultPermissions", { key: "default_permissions", clearField: "defaultPermissions" }],
    [
      "disableResponseStorage",
      { key: "disable_response_storage", clearField: "disableResponseStorage" }
    ],
    ["networkAccess", { key: "network_access", clearField: "networkAccess" }],
    ["personality", { key: "personality", clearField: "personality" }],
    [
      "projectDocMaxBytes",
      { key: "project_doc_max_bytes", clearField: "projectDocMaxBytes" }
    ],
    [
      "toolOutputTokenLimit",
      { key: "tool_output_token_limit", clearField: "toolOutputTokenLimit" }
    ],
    [
      "windowsWslSetupAcknowledged",
      {
        key: "windows_wsl_setup_acknowledged",
        clearField: "windowsWslSetupAcknowledged"
      }
    ]
  ]);
  for (const { key, clearField } of rootFieldMap.values()) {
    const value = getRootInputValue(input, key);
    if (value !== undefined || hasClearField(input, clearField)) {
      trackedRootKeys.add(key);
    }
    if (value !== undefined) {
      rootValues.set(key, value);
    }
  }

  let nextSource = updateTrackedRootAssignments(source, trackedRootKeys, rootValues);

  const windowsValues = new Map<string, TomlPrimitive>();
  const trackedWindowsKeys = new Set<string>();
  if (
    normalizeOptionalString(input.windowsSandbox) !== undefined ||
    hasClearField(input, "windowsSandbox")
  ) {
    trackedWindowsKeys.add("sandbox");
  }
  if (normalizeOptionalString(input.windowsSandbox) !== undefined) {
    windowsValues.set("sandbox", normalizeOptionalString(input.windowsSandbox) as string);
  }
  if (
    typeof input.windowsSandboxPrivateDesktop === "boolean" ||
    hasClearField(input, "windowsSandboxPrivateDesktop")
  ) {
    trackedWindowsKeys.add("sandbox_private_desktop");
  }
  if (typeof input.windowsSandboxPrivateDesktop === "boolean") {
    windowsValues.set("sandbox_private_desktop", input.windowsSandboxPrivateDesktop);
  }
  nextSource = updateNamedSectionAssignments(
    nextSource,
    "windows",
    trackedWindowsKeys,
    windowsValues
  );

  const historyValues = new Map<string, TomlPrimitive>();
  const trackedHistoryKeys = new Set<string>();
  if (
    normalizeOptionalString(input.historyPersistence) !== undefined ||
    hasClearField(input, "historyPersistence")
  ) {
    trackedHistoryKeys.add("persistence");
  }
  if (normalizeOptionalString(input.historyPersistence) !== undefined) {
    historyValues.set(
      "persistence",
      normalizeOptionalString(input.historyPersistence) as string
    );
  }
  if (
    normalizeOptionalNumber(input.historyMaxBytes) !== undefined ||
    hasClearField(input, "historyMaxBytes")
  ) {
    trackedHistoryKeys.add("max_bytes");
  }
  if (normalizeOptionalNumber(input.historyMaxBytes) !== undefined) {
    historyValues.set("max_bytes", normalizeOptionalNumber(input.historyMaxBytes) as number);
  }
  nextSource = updateNamedSectionAssignments(
    nextSource,
    "history",
    trackedHistoryKeys,
    historyValues
  );

  parseCodexTomlConfig(nextSource);
  return nextSource;
}

export function updateCodexRuntimeConfigInToml(
  source: string,
  input: CodexRuntimeConfigInput
): string {
  return updateCodexRootConfigInToml(source, {
    approvalPolicy: input.approvalPolicy,
    sandboxMode: input.sandboxMode,
    defaultPermissions: input.defaultPermissions,
    networkAccess: input.networkAccess,
    windowsSandbox: input.windowsSandbox,
    windowsSandboxPrivateDesktop: input.windowsSandboxPrivateDesktop
  });
}

function findNamedSectionRange(
  source: string,
  headerName: string
): { start: number; end: number } | undefined {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => getTomlHeader(line) === headerName);
  if (start === -1) {
    return undefined;
  }
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (getTomlHeader(lines[index]) !== undefined) {
      end = index;
      break;
    }
  }
  return { start, end };
}

function replaceOrAppendNamedSection(
  source: string,
  headerName: string,
  sectionLines: string[]
): string {
  const newline = getNewline(source);
  const lines = source.split(/\r?\n/);
  const range = findNamedSectionRange(source, headerName);
  if (range) {
    lines.splice(range.start, range.end - range.start, ...sectionLines);
    return lines.join(newline);
  }
  const nextLines = [...lines];
  while (nextLines.length > 0 && nextLines[nextLines.length - 1] === "") {
    nextLines.pop();
  }
  if (nextLines.length > 0) {
    nextLines.push("");
  }
  nextLines.push(...sectionLines);
  return `${nextLines.join(newline)}${newline}`;
}

function isTomlHeaderLine(rawLine: string): boolean {
  const line = stripTomlComment(rawLine).trim();
  return line.startsWith("[") && line.endsWith("]");
}

function replaceTomlAssignmentValue(rawLine: string, nextValue: TomlPrimitive): string {
  const { content, comment } = splitTomlComment(rawLine);
  const equalsIndex = content.indexOf("=");
  const prefix = content.slice(0, equalsIndex + 1);
  const rawValue = content.slice(equalsIndex + 1);
  const spacing = rawValue.match(/^\s*/)?.[0] || " ";
  const nextLine = `${prefix}${spacing}${formatTomlValue(nextValue)}`;
  return comment ? `${nextLine} ${comment.trimStart()}` : nextLine;
}

function trimDiffLine(line: string): string {
  return line.trim();
}

function removeTopLevelAssignmentLine(_rawLine: string): string {
  return "";
}

export function buildStandaloneCodexProfileToml(profileInput: CodexProfileConfig): string {
  const profile = normalizeProfileInput(profileInput);
  const lines = buildStandaloneProfileLines(profile);
  const source = lines.length > 0 ? `${lines.join("\n")}\n` : "";
  parseCodexTomlConfig(source);
  return source;
}

export function migrateLegacyCodexProfileToStandalone(
  source: string,
  profileId: string
): CodeAgentSwitchLegacyMigrationResult {
  const normalizedProfileId = profileId.trim();
  if (!normalizedProfileId) {
    throw new Error("请选择要迁移的 Profile");
  }

  const config = parseCodexTomlConfig(source);
  const profile = config.profiles.find((item) => item.id === normalizedProfileId);
  if (!profile) {
    throw new Error(`Profile "${normalizedProfileId}" does not exist`);
  }
  if (profile.storageKind && profile.storageKind !== "embedded") {
    throw new Error(`Profile "${normalizedProfileId}" is not a legacy embedded profile`);
  }

  const normalizedProfile: CodexProfileConfig = {
    ...normalizeProfileInput(profile),
    storageKind: "standalone"
  };
  const profileSource = buildStandaloneCodexProfileToml(normalizedProfile);
  const configWithoutProfile = deleteCodexProfileInToml(source, normalizedProfile.id);
  const profileMatch = buildProfileMatch(config, profile);
  const appliedToRoot =
    config.profile === normalizedProfile.id || profileMatch.level === "exact";
  const configSource = appliedToRoot
    ? buildCodeAgentSwitchProfilePreviewFromProfile(
        configWithoutProfile,
        normalizedProfile,
        config.providers
      ).newSource
    : configWithoutProfile;

  parseCodexTomlConfig(configSource);
  return {
    profile: normalizedProfile,
    configSource,
    profileSource,
    appliedToRoot
  };
}

export function buildCodeAgentSwitchProfilePreviewFromProfile(
  source: string,
  profileInput: CodexProfileConfig,
  extraProviders: CodexProviderConfig[] = []
): CodeAgentSwitchProfilePreview {
  const profile = normalizeProfileInput(profileInput);
  const config = parseCodexTomlConfig(source);
  const availableProviders = [...config.providers];
  for (const provider of extraProviders) {
    if (!availableProviders.some((item) => item.id === provider.id)) {
      availableProviders.push(provider);
    }
  }
  if (
    profile.providerId &&
    !availableProviders.some((provider) => provider.id === profile.providerId)
  ) {
    throw new Error(`Provider "${profile.providerId}" 不存在`);
  }

  const desired = getProfileTemplateValues(profile);
  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  const lines = source.split(/\r?\n/);
  const nextLines = [...lines];
  const firstHeaderIndex = lines.findIndex((line) => isTomlHeaderLine(line));
  const rootEndIndex = firstHeaderIndex === -1 ? lines.length : firstHeaderIndex;
  const seenFields = new Set<string>();
  const changedFields: string[] = [];
  const diffLines: string[] = [];

  for (let index = 0; index < rootEndIndex; index += 1) {
    const rawLine = nextLines[index] ?? "";
    const content = stripTomlComment(rawLine);
    const equalsIndex = content.indexOf("=");
    if (equalsIndex <= 0) {
      continue;
    }
    const key = content.slice(0, equalsIndex).trim();
    if (key === "profile") {
      const replacement = removeTopLevelAssignmentLine(rawLine);
      nextLines[index] = replacement;
      changedFields.push(key);
      diffLines.push(`- ${trimDiffLine(rawLine)}`);
      continue;
    }
    if (PROFILE_SWITCH_FIELD_ORDER.includes(key as (typeof PROFILE_SWITCH_FIELD_ORDER)[number])) {
      const desiredValue = desired.get(key);
      if (desiredValue === undefined) {
        const replacement = removeTopLevelAssignmentLine(rawLine);
        nextLines[index] = replacement;
        changedFields.push(key);
        diffLines.push(`- ${trimDiffLine(rawLine)}`);
        continue;
      }
    }
    if (!desired.has(key)) {
      continue;
    }
    const value = desired.get(key);
    if (value === undefined) {
      continue;
    }
    seenFields.add(key);
    const replacement = replaceTomlAssignmentValue(rawLine, value);
    if (replacement !== rawLine) {
      nextLines[index] = replacement;
      changedFields.push(key);
      diffLines.push(`- ${trimDiffLine(rawLine)}`);
      diffLines.push(`+ ${trimDiffLine(replacement)}`);
    }
  }

  const insertedLines: string[] = [];
  for (const key of PROFILE_SWITCH_FIELD_ORDER) {
    if (key === "profile" || !desired.has(key) || seenFields.has(key)) {
      continue;
    }
    const value = desired.get(key);
    if (value === undefined) {
      continue;
    }
    insertedLines.push(`${key} = ${formatTomlValue(value)}`);
    changedFields.push(key);
    diffLines.push(`+ ${key} = ${formatTomlValue(value)}`);
  }

  if (insertedLines.length > 0) {
    let insertIndex = rootEndIndex;
    while (insertIndex > 0 && nextLines[insertIndex - 1]?.trim() === "") {
      insertIndex -= 1;
    }
    nextLines.splice(insertIndex, 0, ...insertedLines);
  }

  const changedFieldSet = new Set(changedFields);
  for (const key of PROFILE_SWITCH_FIELD_ORDER) {
    if (key === "profile") {
      continue;
    }
    const desiredValue = desired.get(key);
    if (
      desiredValue !== undefined &&
      getTopLevelFieldValue(config, key) !== desiredValue &&
      !changedFieldSet.has(key)
    ) {
      changedFields.push(key);
      changedFieldSet.add(key);
    }
  }

  let newSource = nextLines.join(newline);
  for (const provider of extraProviders) {
    newSource = upsertCodexProviderInToml(newSource, provider);
  }
  parseCodexTomlConfig(newSource);

  return {
    profileId: profile.id,
    providerId: profile.providerId,
    changedFields: [...new Set(changedFields)],
    diffLines,
    newSource
  };
}

export function buildCodeAgentSwitchProfilePreview(
  source: string,
  profileId: string
): CodeAgentSwitchProfilePreview {
  const normalizedProfileId = profileId.trim();
  if (!normalizedProfileId) {
    throw new Error("请选择要切换的 Profile");
  }

  const config = parseCodexTomlConfig(source);
  const profile = config.profiles.find((item) => item.id === normalizedProfileId);
  if (!profile) {
    throw new Error(`Profile "${normalizedProfileId}" 不存在`);
  }
  if (
    profile.providerId &&
    !config.providers.some((provider) => provider.id === profile.providerId)
  ) {
    throw new Error(`Provider "${profile.providerId}" 不存在`);
  }

  const desired = getProfileSwitchValues(profile);

  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  const lines = source.split(/\r?\n/);
  const nextLines = [...lines];
  const firstHeaderIndex = lines.findIndex((line) => isTomlHeaderLine(line));
  const rootEndIndex = firstHeaderIndex === -1 ? lines.length : firstHeaderIndex;
  const seenFields = new Set<string>();
  const changedFields: string[] = [];
  const diffLines: string[] = [];

  for (let index = 0; index < rootEndIndex; index += 1) {
    const rawLine = nextLines[index] ?? "";
    const content = stripTomlComment(rawLine);
    const equalsIndex = content.indexOf("=");
    if (equalsIndex <= 0) {
      continue;
    }
    const key = content.slice(0, equalsIndex).trim();
    if (TOP_LEVEL_PROFILE_TEMPLATE_FIELDS.includes(key as typeof TOP_LEVEL_PROFILE_TEMPLATE_FIELDS[number])) {
      const replacement = removeTopLevelAssignmentLine(rawLine);
      nextLines[index] = replacement;
      changedFields.push(key);
      diffLines.push(`- ${trimDiffLine(rawLine)}`);
      continue;
    }
    if (!desired.has(key)) {
      continue;
    }

    const value = desired.get(key);
    if (value === undefined) {
      continue;
    }
    seenFields.add(key);
    const replacement = replaceTomlAssignmentValue(rawLine, value);
    if (replacement !== rawLine) {
      nextLines[index] = replacement;
      changedFields.push(key);
      diffLines.push(`- ${trimDiffLine(rawLine)}`);
      diffLines.push(`+ ${trimDiffLine(replacement)}`);
    }
  }

  const insertedLines: string[] = [];
  for (const key of PROFILE_SWITCH_FIELD_ORDER) {
    if (!desired.has(key) || seenFields.has(key)) {
      continue;
    }
    const value = desired.get(key);
    if (value === undefined) {
      continue;
    }
    insertedLines.push(`${key} = ${formatTomlValue(value)}`);
    changedFields.push(key);
    diffLines.push(`+ ${key} = ${formatTomlValue(value)}`);
  }

  if (insertedLines.length > 0) {
    let insertIndex = rootEndIndex;
    while (insertIndex > 0 && nextLines[insertIndex - 1]?.trim() === "") {
      insertIndex -= 1;
    }
    nextLines.splice(insertIndex, 0, ...insertedLines);
  }

  const changedFieldSet = new Set(changedFields);
  for (const key of PROFILE_SWITCH_FIELD_ORDER) {
    const desiredValue = desired.get(key);
    if (
      desiredValue !== undefined &&
      getTopLevelFieldValue(config, key) !== desiredValue &&
      !changedFieldSet.has(key)
    ) {
      changedFields.push(key);
      changedFieldSet.add(key);
    }
  }

  const newSource = nextLines.join(newline);
  parseCodexTomlConfig(newSource);

  return {
    profileId: normalizedProfileId,
    providerId: profile.providerId,
    changedFields: [...new Set(changedFields)],
    diffLines,
    newSource
  };
}

function createDiagnostic(
  id: string,
  level: CodeAgentSwitchDiagnosticLevel,
  message: string,
  suggestion: string
): CodeAgentSwitchDiagnostic {
  return { id, level, message, suggestion };
}

export function diagnoseCodexConfig(
  config: CodexParsedConfig,
  options: CodexDiagnoseOptions = {}
): CodeAgentSwitchDiagnostic[] {
  const diagnostics: CodeAgentSwitchDiagnostic[] = [];
  const providerIds = new Set(config.providers.map((provider) => provider.id));
  const env = options.env ?? {};

  if (config.modelProvider && !providerIds.has(config.modelProvider)) {
    diagnostics.push(
      createDiagnostic(
        "D002",
        "error",
        `当前 model_provider "${config.modelProvider}" 不存在`,
        "请选择已存在的 Provider，或先创建对应中转站预设。"
      )
    );
  }

  for (const provider of config.providers) {
    if (!provider.baseUrl) {
      diagnostics.push(
        createDiagnostic(
          "D003",
          "error",
          `Provider "${provider.id}" 缺少 base_url`,
          "补全 OpenAI-compatible API 地址后再切换。"
        )
      );
    }
    if (provider.envKey && provider.requiresOpenAiAuth) {
      diagnostics.push(
        createDiagnostic(
          "D004",
          "error",
          `Provider "${provider.id}" 同时配置 env_key 和 requires_openai_auth`,
          "中转站 Key 模式和 OpenAI 登录态模式建议二选一。"
        )
      );
    }
    if (provider.envKey && !env[provider.envKey]) {
      diagnostics.push(
        createDiagnostic(
          "D005",
          "warning",
          `当前进程未检测到环境变量 ${provider.envKey}`,
          "如果刚设置过环境变量，请重启 LiteLauncher 或当前 shell。"
        )
      );
    }
    if (provider.wireApi && provider.wireApi !== "responses") {
      diagnostics.push(
        createDiagnostic(
          "D007",
          "warning",
          `Provider "${provider.id}" 的 wire_api 不是 responses`,
          "当前 Codex 官方口径以 responses 为准，请确认中转站兼容性。"
        )
      );
    }
  }

  if (options.projectConfigPath) {
    diagnostics.push(
      createDiagnostic(
        "D006",
        "warning",
        `检测到项目级配置 ${options.projectConfigPath}`,
        "项目级 .codex/config.toml 可能覆盖用户级配置。"
      )
    );
  }

  if (
    typeof config.profile === "string" ||
    config.profiles.some((profile) => profile.storageKind === "embedded")
  ) {
    diagnostics.push(
      createDiagnostic(
        "D008",
        "warning",
        "检测到旧版 Codex profile 配置写法",
        "Codex 0.134.0+ 不再支持顶层 profile 和 [profiles.*]；请迁移到独立的 <name>.config.toml 文件，或直接把当前生效配置写入 config.toml。"
      )
    );
  }

  if (options.hasAuthJson) {
    diagnostics.push(
      createDiagnostic(
        "D009",
        "info",
        "检测到 auth.json 存在",
        "插件只检测登录态文件是否存在，不读取其中敏感内容。"
      )
    );
  }

  diagnostics.push(
    createDiagnostic(
      "D010",
      "info",
      "切换 Provider / Base URL / 认证方式后，会话显示可能发生变化",
      "CodeAgent Switch 不合并、不迁移、不修改历史会话。"
    )
  );

  return diagnostics;
}

export function buildCodeAgentSwitchEnvCommands(
  envKey: string
): CodeAgentSwitchEnvCommands {
  const normalized = envKey.trim() || "RELAY_API_KEY";
  const escapedPowerShellKey = normalized.replace(/'/g, "''");
  const escapedBashKey = normalized.replace(/[^A-Za-z0-9_]/g, "_");
  return {
    powershellCurrent: `$env:${escapedPowerShellKey}="<API_KEY>"`,
    powershellUser: `[Environment]::SetEnvironmentVariable('${escapedPowerShellKey}', '<API_KEY>', 'User')`,
    bash: `export ${escapedBashKey}="<API_KEY>"`
  };
}
