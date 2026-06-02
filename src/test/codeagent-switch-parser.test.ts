import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCodeAgentSwitchProfilePreview,
  buildCodeAgentSwitchProfilePreviewFromProfile,
  buildStandaloneCodexProfileToml,
  buildCodeAgentSwitchEnvCommands,
  deleteCodexProfileInToml,
  deleteCodexProviderInToml,
  diagnoseCodexConfig,
  migrateLegacyCodexProfileToStandalone,
  parseCodexTomlConfig,
  updateCodexRootConfigInToml,
  updateCodexRuntimeConfigInToml,
  summarizeCodeAgentSwitchActiveConfig,
  upsertCodexProfileInToml,
  upsertCodexProviderInToml
} from "../shared/codeagent-switch";

const RELAY_CONFIG = `
model_provider = "relay_1"
model = "gpt-5.5"
review_model = "gpt-5.4"
openai_base_url = "https://proxy.openai.example/v1"
model_reasoning_effort = "xhigh"
plan_mode_reasoning_effort = "high"
model_reasoning_summary = "auto"
model_verbosity = "low"
model_supports_reasoning_summaries = true
service_tier = "fast"
web_search = "live"
model_context_window = 128000
model_auto_compact_token_limit = 350000
approval_policy = "on-request"
approvals_reviewer = "auto_review"
allow_login_shell = false
personality = "friendly"
project_doc_max_bytes = 65536
tool_output_token_limit = 12000
disable_response_storage = true
network_access = "enabled"
windows_wsl_setup_acknowledged = true

[windows]
sandbox = "elevated"
sandbox_private_desktop = true

[history]
persistence = "save-all"
max_bytes = 104857600

[model_providers.relay_1]
name = "Relay 1"
base_url = "https://relay.example.com/v1"
wire_api = "responses"
env_key = "RELAY_1_API_KEY"

[model_providers.openai]
name = "OpenAI"
base_url = "https://api.openai.com/v1"
requires_openai_auth = true

[profiles.daily]
model_provider = "relay_1"
model = "gpt-5.4"
review_model = "gpt-5.4"
model_reasoning_effort = "high"
model_auto_compact_token_limit = 250000
`;

test("parses Codex providers, profiles, history, and top-level model fields", () => {
  const config = parseCodexTomlConfig(RELAY_CONFIG);

  assert.equal(config.modelProvider, "relay_1");
  assert.equal(config.model, "gpt-5.5");
  assert.equal(config.reviewModel, "gpt-5.4");
  assert.equal(config.openaiBaseUrl, "https://proxy.openai.example/v1");
  assert.equal(config.modelReasoningEffort, "xhigh");
  assert.equal(config.planModeReasoningEffort, "high");
  assert.equal(config.modelReasoningSummary, "auto");
  assert.equal(config.modelVerbosity, "low");
  assert.equal(config.modelSupportsReasoningSummaries, true);
  assert.equal(config.serviceTier, "fast");
  assert.equal(config.webSearch, "live");
  assert.equal(config.modelContextWindow, 128000);
  assert.equal(config.modelAutoCompactTokenLimit, 350000);
  assert.equal(config.approvalPolicy, "on-request");
  assert.equal(config.approvalsReviewer, "auto_review");
  assert.equal(config.allowLoginShell, false);
  assert.equal(config.personality, "friendly");
  assert.equal(config.projectDocMaxBytes, 65536);
  assert.equal(config.toolOutputTokenLimit, 12000);
  assert.equal(config.disableResponseStorage, true);
  assert.equal(config.networkAccess, "enabled");
  assert.equal(config.windowsWslSetupAcknowledged, true);
  assert.equal(config.windows?.sandbox, "elevated");
  assert.equal(config.windows?.sandboxPrivateDesktop, true);
  assert.equal(config.history?.persistence, "save-all");
  assert.equal(config.history?.maxBytes, 104857600);

  const relay = config.providers.find((provider) => provider.id === "relay_1");
  assert.ok(relay);
  assert.equal(relay.name, "Relay 1");
  assert.equal(relay.baseUrl, "https://relay.example.com/v1");
  assert.equal(relay.wireApi, "responses");
  assert.equal(relay.envKey, "RELAY_1_API_KEY");
  assert.equal(relay.requiresOpenAiAuth, false);

  const openai = config.providers.find((provider) => provider.id === "openai");
  assert.ok(openai);
  assert.equal(openai.requiresOpenAiAuth, true);

  const profile = config.profiles.find((item) => item.id === "daily");
  assert.ok(profile);
  assert.equal(profile.providerId, "relay_1");
  assert.equal(profile.model, "gpt-5.4");
  assert.equal(profile.modelReasoningEffort, "high");
  assert.equal(profile.modelAutoCompactTokenLimit, 250000);
});

test("diagnoses auth conflicts, missing env vars, project overrides, and profile risk", () => {
  const config = parseCodexTomlConfig(`
model_provider = "relay_1"

[model_providers.relay_1]
base_url = "https://relay.example.com/v1"
wire_api = "chat"
env_key = "MISSING_RELAY_KEY"
requires_openai_auth = true

[profiles.daily]
model_provider = "relay_1"
model = "gpt-5.4"
`);

  const diagnostics = diagnoseCodexConfig(config, {
    env: {},
    hasAuthJson: true,
    projectConfigPath: "E:\\\\repo\\\\.codex\\\\config.toml"
  });
  const ids = diagnostics.map((item) => item.id);

  assert.ok(ids.includes("D004"), "mixed auth should be reported");
  assert.ok(ids.includes("D005"), "missing env var should be reported");
  assert.ok(ids.includes("D006"), "project config override should be reported");
  assert.ok(ids.includes("D007"), "non-responses wire_api should be reported");
  assert.ok(ids.includes("D008"), "profiles should include compatibility warning");
  assert.ok(ids.includes("D009"), "auth.json existence should be reported without reading it");
  assert.ok(ids.includes("D010"), "session risk should always be visible");
});

test("diagnoses missing active provider and missing provider base_url", () => {
  const config = parseCodexTomlConfig(`
model_provider = "missing_relay"

[model_providers.empty_relay]
env_key = "EMPTY_RELAY_KEY"
`);

  const diagnostics = diagnoseCodexConfig(config, {
    env: { EMPTY_RELAY_KEY: "secret-value" }
  });
  const ids = diagnostics.map((item) => item.id);

  assert.ok(ids.includes("D002"), "missing model_provider target should be reported");
  assert.ok(ids.includes("D003"), "provider without base_url should be reported");
  assert.equal(
    diagnostics.some((item) => item.message.includes("secret-value")),
    false,
    "diagnostics must not leak env var values"
  );
});

test("rejects invalid TOML with a line-numbered error", () => {
  assert.throws(
    () => parseCodexTomlConfig('model = "unterminated'),
    /line 1/i
  );
  assert.throws(() => parseCodexTomlConfig("[model_providers.relay]\n= bad"), /line 2/i);
});

test("ignores unknown Codex tables that contain literal strings and quoted headers", () => {
  const config = parseCodexTomlConfig(`
model_provider = "codex"

[model_providers.codex]
name = 'Codex Relay'
base_url = 'https://relay.example.com/v1'
env_key = 'CODEX_RELAY_KEY'

[projects.'E:\\项目\\易买房\\yimaifang']
trust_level = "trusted"

[marketplaces.openai-bundled]
last_updated = "2026-05-12T01:46:40Z"
source_type = "local"
source = '\\\\?\\C:\\Users\\lybly\\.codex\\.tmp\\bundled-marketplaces\\openai-bundled'
`);

  assert.equal(config.modelProvider, "codex");
  assert.equal(config.providers[0]?.name, "Codex Relay");
  assert.equal(config.providers[0]?.baseUrl, "https://relay.example.com/v1");
  assert.equal(config.providers[0]?.envKey, "CODEX_RELAY_KEY");
});

test("ignores unknown sections that contain array assignments", () => {
  const config = parseCodexTomlConfig(`
model_provider = "OpenAI"

[model_providers.OpenAI]
base_url = "https://openrouter.icu"
env_key = "RELAY_1_API_KEY"

[mcp_servers.node_repl]
args = []
command = 'C:\\Users\\lybly\\AppData\\Local\\OpenAI\\Codex\\bin\\node_repl.exe'

[mcp_servers.node_repl.env]
NODE_REPL_NATIVE_PIPE_CONNECT_TIMEOUT_MS = "1000"
`);

  assert.equal(config.modelProvider, "OpenAI");
  assert.equal(config.providers[0]?.id, "OpenAI");
  assert.equal(config.providers[0]?.envKey, "RELAY_1_API_KEY");
});

test("builds copyable env commands without storing a real API key", () => {
  const commands = buildCodeAgentSwitchEnvCommands("RELAY_1_API_KEY");

  assert.match(commands.powershellUser, /RELAY_1_API_KEY/);
  assert.match(commands.powershellCurrent, /RELAY_1_API_KEY/);
  assert.match(commands.bash, /RELAY_1_API_KEY/);
  assert.match(commands.powershellUser, /<API_KEY>/);
  assert.match(commands.bash, /<API_KEY>/);
  assert.equal(JSON.stringify(commands).includes("sk-"), false);
});

test("summarizes the active Codex provider and exact matching profile", () => {
  const config = parseCodexTomlConfig(`
model_provider = "relay_1"
model = "gpt-5.5"
review_model = "gpt-5.5"
model_reasoning_effort = "xhigh"
model_auto_compact_token_limit = 350000

[model_providers.relay_1]
name = "Relay 1"
base_url = "https://relay.example.com/v1"
env_key = "RELAY_1_API_KEY"

[profiles.pro]
model_provider = "relay_1"
model = "gpt-5.5"
review_model = "gpt-5.5"
model_reasoning_effort = "xhigh"
model_auto_compact_token_limit = 350000

[profiles.fast]
model_provider = "relay_1"
model = "gpt-5.4"
model_reasoning_effort = "high"
`);

  const summary = summarizeCodeAgentSwitchActiveConfig(config);

  assert.equal(summary.activeProviderId, "relay_1");
  assert.equal(summary.activeProvider?.name, "Relay 1");
  assert.equal(summary.activeProfileId, "pro");
  assert.equal(summary.activeProfileMatch, "exact");
  assert.deepEqual(summary.matchedFields, [
    "model_provider",
    "model",
    "review_model",
    "model_reasoning_effort",
    "model_auto_compact_token_limit"
  ]);
  assert.equal(
    summary.profileMatches.find((item) => item.profileId === "pro")?.level,
    "exact"
  );
  assert.equal(
    summary.profileMatches.find((item) => item.profileId === "fast")?.level,
    "partial"
  );
});

test("summarizes active profiles with Chinese ids and omitted optional fields", () => {
  const config = parseCodexTomlConfig(`
profile = "淘宝1"

[model_providers.taobao_relay]
name = "淘宝中转"
base_url = "https://relay.example.com/v1"
env_key = "TAOBAO_API_KEY"

[profiles."淘宝1"]
model_provider = "taobao_relay"
model = "gpt-5.5"
model_reasoning_effort = "xhigh"
`);

  const summary = summarizeCodeAgentSwitchActiveConfig(config);

  assert.equal(config.profiles[0]?.id, "淘宝1");
  assert.equal(summary.activeProviderId, "taobao_relay");
  assert.equal(summary.activeProfileId, "淘宝1");
  assert.equal(summary.activeProfileMatch, "exact");
  assert.equal(
    summary.profileMatches.find((item) => item.profileId === "淘宝1")?.level,
    "exact"
  );
});

test("summarizes current config source for standalone and legacy embedded profiles", () => {
  const standaloneConfig = parseCodexTomlConfig(`
model_provider = "relay_1"
model = "gpt-5.5"
review_model = "gpt-5.5"

[model_providers.relay_1]
base_url = "https://relay.example.com/v1"
env_key = "RELAY_1_API_KEY"
`);
  standaloneConfig.profiles.push({
    id: "daily",
    providerId: "relay_1",
    model: "gpt-5.5",
    reviewModel: "gpt-5.5",
    storageKind: "standalone",
    sourcePath: "C:\\Users\\lybly\\.codex\\daily.config.toml"
  });

  const standaloneSummary = summarizeCodeAgentSwitchActiveConfig(standaloneConfig);
  assert.equal(standaloneSummary.activeProfileId, "daily");
  assert.equal(standaloneSummary.activeProfileMatch, "exact");
  assert.equal(standaloneSummary.activeSource.kind, "standalone");
  assert.equal(standaloneSummary.activeSource.profileId, "daily");
  assert.match(standaloneSummary.activeSource.detail, /daily\.config\.toml/i);

  const embeddedConfig = parseCodexTomlConfig(`
profile = "legacy"

[model_providers.relay_1]
base_url = "https://relay.example.com/v1"
env_key = "RELAY_1_API_KEY"

[profiles.legacy]
model_provider = "relay_1"
model = "gpt-5.4"
`);
  const embeddedSummary = summarizeCodeAgentSwitchActiveConfig(embeddedConfig);
  assert.equal(embeddedSummary.activeProfileId, "legacy");
  assert.equal(embeddedSummary.activeSource.kind, "embedded");
  assert.equal(embeddedSummary.activeSource.legacy, true);
  assert.match(embeddedSummary.activeSource.label, /legacy/i);
});

test("upserts and deletes Codex profile sections with non-ascii ids", () => {
  const source = `
[model_providers.taobao_relay]
base_url = "https://relay.example.com/v1"
env_key = "TAOBAO_API_KEY"
`;

  const nextSource = upsertCodexProfileInToml(source, {
    id: "淘宝1",
    providerId: "taobao_relay",
    model: "gpt-5.5",
    modelReasoningEffort: "xhigh"
  });

  assert.match(nextSource, /\[profiles\."淘宝1"\]/);
  assert.equal(parseCodexTomlConfig(nextSource).profiles[0]?.id, "淘宝1");

  const deletedSource = deleteCodexProfileInToml(nextSource, "淘宝1");
  assert.equal(deletedSource.includes("淘宝1"), false);
  assert.equal(parseCodexTomlConfig(deletedSource).profiles.length, 0);
});

test("upserts a Codex provider section while preserving unrelated TOML", () => {
  const source = `model_provider = "relay_1"

[model_providers.relay_1]
name = "Relay 1"
base_url = "https://old.example.com/v1"
env_key = "OLD_KEY"

[projects.'E:\\\\AI\\\\LiteLauncher']
trust_level = "trusted"
`;

  const nextSource = upsertCodexProviderInToml(source, {
    id: "relay_1",
    name: "Relay 1 New",
    baseUrl: "https://relay.example.com/v1",
    wireApi: "responses",
    envKey: "RELAY_1_API_KEY",
    requiresOpenAiAuth: false,
    requestMaxRetries: 3
  });

  assert.match(nextSource, /\[projects\.'E:\\\\AI\\\\LiteLauncher'\]/);
  assert.match(nextSource, /name = "Relay 1 New"/);
  assert.match(nextSource, /base_url = "https:\/\/relay\.example\.com\/v1"/);
  assert.match(nextSource, /env_key = "RELAY_1_API_KEY"/);
  assert.match(nextSource, /request_max_retries = 3/);
  assert.equal(nextSource.includes("OLD_KEY"), false);
  assert.equal(parseCodexTomlConfig(nextSource).providers[0]?.envKey, "RELAY_1_API_KEY");
});

test("upserts Codex provider advanced fields", () => {
  const source = `
[model_providers.relay_1]
base_url = "https://old.example.com/v1"
`;

  const nextSource = upsertCodexProviderInToml(source, {
    id: "relay_1",
    name: "Relay 1",
    baseUrl: "https://relay.example.com/v1",
    wireApi: "responses",
    envKey: "RELAY_1_API_KEY",
    envKeyInstructions: "在控制台创建 Key 后写入环境变量。",
    requiresOpenAiAuth: false,
    supportsWebsockets: true,
    httpHeaders: { "X-App": "LiteLauncher" },
    envHttpHeaders: { Authorization: "RELAY_AUTH_HEADER" },
    queryParams: { "api-version": "2026-01-01" }
  });
  const provider = parseCodexTomlConfig(nextSource).providers[0];

  assert.match(nextSource, /env_key_instructions = "在控制台创建 Key 后写入环境变量。"/);
  assert.match(nextSource, /supports_websockets = true/);
  assert.match(nextSource, /\[model_providers\.relay_1\.http_headers\]/);
  assert.match(nextSource, /X-App = "LiteLauncher"/);
  assert.match(nextSource, /\[model_providers\.relay_1\.env_http_headers\]/);
  assert.match(nextSource, /Authorization = "RELAY_AUTH_HEADER"/);
  assert.match(nextSource, /\[model_providers\.relay_1\.query_params\]/);
  assert.match(nextSource, /api-version = "2026-01-01"/);
  assert.equal(provider?.envKeyInstructions, "在控制台创建 Key 后写入环境变量。");
  assert.equal(provider?.supportsWebsockets, true);
  assert.deepEqual(provider?.httpHeaders, { "X-App": "LiteLauncher" });
  assert.deepEqual(provider?.envHttpHeaders, { Authorization: "RELAY_AUTH_HEADER" });
  assert.deepEqual(provider?.queryParams, { "api-version": "2026-01-01" });
});

test("upserts a Codex profile section and can create a new profile", () => {
  const source = `model_provider = "relay_1"
model = "gpt-5.5"

[model_providers.relay_1]
base_url = "https://relay.example.com/v1"
env_key = "RELAY_1_API_KEY"

[settings.theme]
name = "keep-me"
`;

  const nextSource = upsertCodexProfileInToml(source, {
    id: "daily",
    providerId: "relay_1",
    model: "gpt-5.4",
    reviewModel: "gpt-5.4",
    modelReasoningEffort: "high",
    modelAutoCompactTokenLimit: 250000
  });

  assert.match(nextSource, /\[settings\.theme\]/);
  assert.match(nextSource, /\[profiles\.daily\]/);
  assert.match(nextSource, /model_provider = "relay_1"/);
  assert.match(nextSource, /model = "gpt-5.4"/);
  assert.match(nextSource, /model_auto_compact_token_limit = 250000/);
  assert.equal(parseCodexTomlConfig(nextSource).profiles[0]?.id, "daily");
});

test("upserts Codex profile advanced model fields", () => {
  const source = `
[model_providers.relay_1]
base_url = "https://relay.example.com/v1"
env_key = "RELAY_1_API_KEY"
`;

  const nextSource = upsertCodexProfileInToml(source, {
    id: "daily",
    providerId: "relay_1",
    model: "gpt-5.5",
    reviewModel: "gpt-5.5",
    modelReasoningEffort: "high",
    planModeReasoningEffort: "xhigh",
    modelReasoningSummary: "auto",
    modelVerbosity: "low",
    serviceTier: "fast",
    webSearch: "live"
  });
  const profile = parseCodexTomlConfig(nextSource).profiles[0];

  assert.match(nextSource, /plan_mode_reasoning_effort = "xhigh"/);
  assert.match(nextSource, /model_reasoning_summary = "auto"/);
  assert.match(nextSource, /model_verbosity = "low"/);
  assert.match(nextSource, /service_tier = "fast"/);
  assert.match(nextSource, /web_search = "live"/);
  assert.equal(profile?.planModeReasoningEffort, "xhigh");
  assert.equal(profile?.modelReasoningSummary, "auto");
  assert.equal(profile?.modelVerbosity, "low");
  assert.equal(profile?.serviceTier, "fast");
  assert.equal(profile?.webSearch, "live");
});

test("updates Codex runtime security settings while preserving sections", () => {
  const source = `profile = "daily"
network_access = "enabled"

[history]
max_bytes = 104857600

[profiles.daily]
model = "gpt-5.5"
`;

  const nextSource = updateCodexRuntimeConfigInToml(source, {
    approvalPolicy: "on-request",
    sandboxMode: "workspace-write",
    defaultPermissions: "trusted",
    networkAccess: "restricted",
    windowsSandbox: "elevated",
    windowsSandboxPrivateDesktop: true
  });
  const config = parseCodexTomlConfig(nextSource);

  assert.match(nextSource.split("[history]")[0], /approval_policy = "on-request"/);
  assert.match(nextSource.split("[history]")[0], /sandbox_mode = "workspace-write"/);
  assert.match(nextSource.split("[history]")[0], /default_permissions = "trusted"/);
  assert.match(nextSource.split("[history]")[0], /network_access = "restricted"/);
  assert.match(nextSource, /\[windows\]\nsandbox = "elevated"/);
  assert.match(nextSource, /sandbox_private_desktop = true/);
  assert.match(nextSource, /\[profiles\.daily\]/);
  assert.equal(config.approvalPolicy, "on-request");
  assert.equal(config.sandboxMode, "workspace-write");
  assert.equal(config.defaultPermissions, "trusted");
  assert.equal(config.networkAccess, "restricted");
  assert.equal(config.windows?.sandbox, "elevated");
  assert.equal(config.windows?.sandboxPrivateDesktop, true);
});

test("updates Codex root config official fields and clears removed values", () => {
  const source = `model_provider = "relay_1"
model = "gpt-5.5"
review_model = "gpt-5.5"
openai_base_url = "https://old-proxy.example/v1"
model_reasoning_effort = "high"
model_reasoning_summary = "detailed"
model_verbosity = "high"
model_supports_reasoning_summaries = true
service_tier = "fast"
web_search = "live"
model_context_window = 128000
model_auto_compact_token_limit = 350000
approval_policy = "on-request"
approvals_reviewer = "user"
allow_login_shell = false
disable_response_storage = true
network_access = "enabled"
personality = "friendly"
project_doc_max_bytes = 65536
tool_output_token_limit = 12000
windows_wsl_setup_acknowledged = true

[windows]
sandbox = "elevated"
sandbox_private_desktop = true

[history]
persistence = "save-all"
max_bytes = 104857600
`;

  const nextSource = updateCodexRootConfigInToml(source, {
    modelProvider: "relay_2",
    model: "gpt-5.6",
    reviewModel: "gpt-5.6-mini",
    modelReasoningEffort: "minimal",
    planModeReasoningEffort: "xhigh",
    modelReasoningSummary: "concise",
    modelVerbosity: "medium",
    modelSupportsReasoningSummaries: false,
    serviceTier: "flex",
    webSearch: "cached",
    modelContextWindow: 200000,
    modelAutoCompactTokenLimit: 420000,
    approvalPolicy: "never",
    approvalsReviewer: "auto_review",
    allowLoginShell: true,
    sandboxMode: "danger-full-access",
    defaultPermissions: "trusted",
    disableResponseStorage: false,
    networkAccess: "restricted",
    personality: "pragmatic",
    projectDocMaxBytes: 131072,
    toolOutputTokenLimit: 24000,
    windowsWslSetupAcknowledged: false,
    windowsSandbox: "unelevated",
    windowsSandboxPrivateDesktop: false,
    historyPersistence: "none",
    historyMaxBytes: 2048,
    clearFields: ["openaiBaseUrl"]
  });
  const config = parseCodexTomlConfig(nextSource);

  assert.match(nextSource, /^model_provider = "relay_2"$/m);
  assert.match(nextSource, /^model = "gpt-5.6"$/m);
  assert.match(nextSource, /^review_model = "gpt-5.6-mini"$/m);
  assert.doesNotMatch(nextSource, /^openai_base_url = /m);
  assert.match(nextSource, /^model_reasoning_effort = "minimal"$/m);
  assert.match(nextSource, /^plan_mode_reasoning_effort = "xhigh"$/m);
  assert.match(nextSource, /^model_reasoning_summary = "concise"$/m);
  assert.match(nextSource, /^model_verbosity = "medium"$/m);
  assert.match(nextSource, /^model_supports_reasoning_summaries = false$/m);
  assert.match(nextSource, /^service_tier = "flex"$/m);
  assert.match(nextSource, /^web_search = "cached"$/m);
  assert.match(nextSource, /^model_context_window = 200000$/m);
  assert.match(nextSource, /^model_auto_compact_token_limit = 420000$/m);
  assert.match(nextSource, /^approvals_reviewer = "auto_review"$/m);
  assert.match(nextSource, /^allow_login_shell = true$/m);
  assert.match(nextSource, /^disable_response_storage = false$/m);
  assert.match(nextSource, /^personality = "pragmatic"$/m);
  assert.match(nextSource, /^project_doc_max_bytes = 131072$/m);
  assert.match(nextSource, /^tool_output_token_limit = 24000$/m);
  assert.match(nextSource, /^windows_wsl_setup_acknowledged = false$/m);
  assert.match(nextSource, /\[windows\][\s\S]*sandbox = "unelevated"/m);
  assert.match(nextSource, /\[windows\][\s\S]*sandbox_private_desktop = false/m);
  assert.match(nextSource, /\[history\][\s\S]*persistence = "none"/m);
  assert.match(nextSource, /\[history\][\s\S]*max_bytes = 2048/m);
  assert.equal(config.modelProvider, "relay_2");
  assert.equal(config.model, "gpt-5.6");
  assert.equal(config.reviewModel, "gpt-5.6-mini");
  assert.equal(config.openaiBaseUrl, undefined);
  assert.equal(config.planModeReasoningEffort, "xhigh");
  assert.equal(config.modelSupportsReasoningSummaries, false);
  assert.equal(config.approvalsReviewer, "auto_review");
  assert.equal(config.allowLoginShell, true);
  assert.equal(config.disableResponseStorage, false);
  assert.equal(config.personality, "pragmatic");
  assert.equal(config.projectDocMaxBytes, 131072);
  assert.equal(config.toolOutputTokenLimit, 24000);
  assert.equal(config.windowsWslSetupAcknowledged, false);
  assert.equal(config.history?.persistence, "none");
  assert.equal(config.history?.maxBytes, 2048);
});

test("deletes Codex profile sections without touching unrelated sections", () => {
  const source = `model_provider = "relay_1"

[model_providers.relay_1]
base_url = "https://relay.example.com/v1"

[profiles.fast]
model_provider = "relay_1"
model = "gpt-5.4"

[tools.keep]
value = "yes"
`;

  const nextSource = deleteCodexProfileInToml(source, "fast");

  assert.equal(nextSource.includes("[profiles.fast]"), false);
  assert.match(nextSource, /\[tools\.keep\]/);
  assert.equal(parseCodexTomlConfig(nextSource).profiles.length, 0);
});

test("blocks deleting active or referenced Codex providers", () => {
  const activeSource = `model_provider = "relay_1"

[model_providers.relay_1]
base_url = "https://relay.example.com/v1"
`;
  assert.throws(
    () => deleteCodexProviderInToml(activeSource, "relay_1"),
    /active provider/i
  );

  const referencedSource = `
[model_providers.relay_1]
base_url = "https://relay.example.com/v1"

[profiles.daily]
model_provider = "relay_1"
model = "gpt-5.4"
`;
  assert.throws(
    () => deleteCodexProviderInToml(referencedSource, "relay_1"),
    /referenced by profile/i
  );
});

test("deletes unused Codex providers and rejects raw API keys as env key names", () => {
  const source = `
[model_providers.relay_1]
base_url = "https://relay.example.com/v1"

[model_providers.relay_2]
base_url = "https://relay-two.example.com/v1"
env_key = "RELAY_TWO_API_KEY"
`;

  const nextSource = deleteCodexProviderInToml(source, "relay_2");
  assert.equal(nextSource.includes("[model_providers.relay_2]"), false);
  assert.equal(parseCodexTomlConfig(nextSource).providers.length, 1);

  assert.throws(
    () =>
      upsertCodexProviderInToml(source, {
        id: "bad",
        baseUrl: "https://relay.example.com/v1",
        envKey: "sk-real-secret",
        requiresOpenAiAuth: false
      }),
    /environment variable name/i
  );
});

test("builds profile switch preview while preserving unmanaged TOML content", () => {
  const source = `# keep user comment
model_provider = "relay_1"
profile = "old"
model = "gpt-5.5" # keep inline comment
review_model = "gpt-5.5"

[model_providers.relay_1]
name = "Relay 1"
base_url = "https://relay-one.example.com/v1"
env_key = "RELAY_ONE_API_KEY"

[model_providers.relay_2]
name = "Relay 2"
base_url = "https://relay-two.example.com/v1"
env_key = "RELAY_TWO_API_KEY"

[profiles.fast]
model_provider = "relay_2"
model = "gpt-5.4"
review_model = "gpt-5.4"
model_reasoning_effort = "high"

[projects.'E:\\\\AI\\\\LiteLauncher']
trust_level = "trusted"
api_key = "sk-should-not-appear-in-diff"
`;

  const preview = buildCodeAgentSwitchProfilePreview(source, "fast");

  assert.equal(preview.profileId, "fast");
  assert.equal(preview.providerId, "relay_2");
  assert.equal(preview.changedFields.includes("model_provider"), true);
  assert.equal(preview.changedFields.includes("profile"), true);
  assert.match(preview.newSource, /# keep user comment/);
  assert.match(preview.newSource, /\[projects\.'E:\\\\AI\\\\LiteLauncher'\]/);
  const root = preview.newSource.slice(0, preview.newSource.indexOf("[model_providers."));
  assert.doesNotMatch(root, /^model_provider = /m);
  assert.match(preview.newSource, /profile = "fast"/);
  assert.doesNotMatch(root, /^model = /m);
  assert.doesNotMatch(root, /^review_model = /m);
  assert.doesNotMatch(root, /^model_reasoning_effort = /m);
  assert.equal(preview.diffLines.some((line) => line.includes("sk-")), false);
  assert.ok(preview.diffLines.includes('- profile = "old"'));
  assert.ok(preview.diffLines.includes('+ profile = "fast"'));
  assert.equal(parseCodexTomlConfig(preview.newSource).modelProvider, undefined);
  assert.equal(parseCodexTomlConfig(preview.newSource).profile, "fast");
});

test("profile switch preview removes duplicated top-level profile fields", () => {
  const source = `profile = "OpenAI"
model_provider = "OpenAI"
model = "gpt-5.5"
review_model = "gpt-5.5"
model_reasoning_effort = "xhigh"
model_auto_compact_token_limit = 350000

[history]
max_bytes = 104857600

[model_providers.OpenAI]
name = "淘宝1"
base_url = "https://openrouter.icu"
wire_api = "responses"
env_key = "RELAY_1_API_KEY"

[profiles.OpenAI]
model_provider = "OpenAI"
model = "gpt-5.5"
review_model = "gpt-5.5"
model_reasoning_effort = "xhigh"
model_auto_compact_token_limit = 350000
`;

  const preview = buildCodeAgentSwitchProfilePreview(source, "OpenAI");
  const root = preview.newSource.split("[history]")[0];

  assert.equal(preview.changedFields.includes("profile"), false);
  assert.equal(preview.changedFields.includes("model_provider"), true);
  assert.match(root, /^profile = "OpenAI"$/m);
  assert.doesNotMatch(root, /^model_provider = /m);
  assert.doesNotMatch(root, /^model = /m);
  assert.doesNotMatch(root, /^review_model = /m);
  assert.doesNotMatch(root, /^model_reasoning_effort = /m);
  assert.doesNotMatch(root, /^model_auto_compact_token_limit = /m);
  assert.match(preview.newSource, /\[profiles\.OpenAI\]\nmodel_provider = "OpenAI"/);
  assert.ok(preview.diffLines.includes('- model_provider = "OpenAI"'));
  assert.equal(parseCodexTomlConfig(preview.newSource).providers[0]?.name, "淘宝1");
});

test("rejects profile preview when the target provider does not exist", () => {
  assert.throws(
    () =>
      buildCodeAgentSwitchProfilePreview(
        `
[profiles.missing]
model_provider = "missing_relay"
model = "gpt-5.4"
`,
        "missing"
      ),
    /Provider "missing_relay" 不存在/
  );
});

test("builds standalone Codex profile toml without legacy [profiles] wrapper", () => {
  const source = buildStandaloneCodexProfileToml({
    id: "TokenRouter",
    providerId: "TokenRouter",
    model: "gpt-5.4",
    modelReasoningEffort: "high",
    planModeReasoningEffort: "xhigh",
    serviceTier: "fast"
  });

  assert.doesNotMatch(source, /\[profiles\./);
  assert.match(source, /^model_provider = "TokenRouter"$/m);
  assert.match(source, /^model = "gpt-5.4"$/m);
  assert.match(source, /^plan_mode_reasoning_effort = "xhigh"$/m);
  assert.match(source, /^service_tier = "fast"$/m);
});

test("migrates an embedded legacy profile into standalone toml and modern root fields", () => {
  const migration = migrateLegacyCodexProfileToStandalone(
    `profile = "daily"

[model_providers.relay_1]
base_url = "https://relay.example.com/v1"
env_key = "RELAY_1_API_KEY"

[profiles.daily]
model_provider = "relay_1"
model = "gpt-5.4"
review_model = "gpt-5.4"
model_reasoning_effort = "high"
`
,
    "daily"
  );

  assert.equal(migration.profile.id, "daily");
  assert.equal(migration.appliedToRoot, true);
  assert.doesNotMatch(migration.profileSource, /\[profiles\./);
  assert.match(migration.profileSource, /^model_provider = "relay_1"$/m);
  assert.match(migration.profileSource, /^model = "gpt-5.4"$/m);
  assert.doesNotMatch(migration.configSource, /\[profiles\.daily\]/);
  assert.doesNotMatch(migration.configSource, /^profile = /m);
  assert.match(migration.configSource, /^model_provider = "relay_1"$/m);
  assert.match(migration.configSource, /^model = "gpt-5.4"$/m);
});

test("migrates a non-current embedded profile without rewriting current root fields", () => {
  const migration = migrateLegacyCodexProfileToStandalone(
    `profile = "current"
model_provider = "relay_current"
model = "gpt-5.5"

[model_providers.relay_current]
base_url = "https://relay-current.example.com/v1"
env_key = "RELAY_CURRENT_API_KEY"

[model_providers.relay_legacy]
base_url = "https://relay-legacy.example.com/v1"
env_key = "RELAY_LEGACY_API_KEY"

[profiles.current]
model_provider = "relay_current"
model = "gpt-5.5"

[profiles.legacy]
model_provider = "relay_legacy"
model = "gpt-5.4"
`
,
    "legacy"
  );

  assert.equal(migration.profile.id, "legacy");
  assert.equal(migration.appliedToRoot, false);
  assert.match(migration.configSource, /^profile = "current"$/m);
  assert.match(migration.configSource, /^model_provider = "relay_current"$/m);
  assert.doesNotMatch(migration.configSource, /\[profiles\.legacy\]/);
  assert.match(migration.profileSource, /^model_provider = "relay_legacy"$/m);
  assert.match(migration.profileSource, /^model = "gpt-5.4"$/m);
});

test("profile preview from standalone profile removes legacy root profile field and keeps templates untouched", () => {
  const source = `profile = "old"
model_provider = "relay_one"
model = "gpt-5.5"

[model_providers.relay_one]
base_url = "https://relay-one.example.com/v1"
env_key = "RELAY_ONE_API_KEY"

[profiles.fast]
model_provider = "relay_one"
model = "gpt-5.4"
`;

  const preview = buildCodeAgentSwitchProfilePreviewFromProfile(source, {
    id: "TokenRouter",
    providerId: "relay_one",
    model: "gpt-5.4",
    reviewModel: "gpt-5.4",
    modelReasoningEffort: "high",
    storageKind: "standalone",
    sourcePath: "C:\\Users\\lybly\\.codex\\TokenRouter.config.toml"
  });

  assert.doesNotMatch(preview.newSource, /^profile = /m);
  assert.match(preview.newSource, /\[profiles\.fast\]/);
  assert.match(preview.newSource, /^model_provider = "relay_one"$/m);
  assert.match(preview.newSource, /^model = "gpt-5.4"$/m);
  assert.match(preview.newSource, /^review_model = "gpt-5.4"$/m);
  assert.match(preview.newSource, /^model_reasoning_effort = "high"$/m);
  assert.ok(preview.diffLines.includes('- profile = "old"'));
});
