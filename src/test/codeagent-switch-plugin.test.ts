import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { IPC_CHANNELS } from "../shared/channels";
import { LaunchItem } from "../shared/types";
import { executePluginCommand } from "../main/plugins";

type SentMessage = {
  channel: string;
  payload: unknown;
};

function createSelectedItem(): LaunchItem {
  return {
    id: "plugin:codeagent-switch:test",
    type: "command",
    title: "CodeAgent Switch",
    subtitle: "test",
    target: "command:plugin:codeagent-switch",
    keywords: ["plugin", "codex"]
  };
}

function createMockWindow(): {
  window: { webContents: { send: (channel: string, payload: unknown) => void } };
  sent: SentMessage[];
} {
  const sent: SentMessage[] = [];
  return {
    window: {
      webContents: {
        send(channel: string, payload: unknown): void {
          sent.push({ channel, payload });
        }
      }
    },
    sent
  };
}

test("CodeAgent Switch reads configPath from command options", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-codeagent-switch-"));
  const configPath = path.join(dir, "config.toml");
  fs.writeFileSync(
    configPath,
    `model_provider = "relay_test"
model = "gpt-5.5"

[model_providers.relay_test]
base_url = "https://relay.test/v1"
wire_api = "responses"
env_key = "RELAY_TEST_KEY"
`,
    "utf8"
  );
  const { window, sent } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "read");
  params.set("configPath", configPath);

  const result = await executePluginCommand(
    `codeagent-switch?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, true);
  assert.equal(sent[0]?.channel, IPC_CHANNELS.openPanel);
  const payload = sent[0]?.payload as {
    data?: {
      configPath?: string;
      exists?: boolean;
      configSource?: string;
      rootSource?: string;
      config?: { modelProvider?: string; providers?: Array<{ id?: string }> };
    };
  };
  assert.equal(payload.data?.configPath, configPath);
  assert.equal(payload.data?.exists, true);
  assert.match(payload.data?.configSource ?? "", /\[model_providers\.relay_test\]/);
  assert.match(payload.data?.rootSource ?? "", /^model_provider = "relay_test"$/m);
  assert.match(payload.data?.rootSource ?? "", /\[model_providers\.relay_test\]/);
  assert.equal(payload.data?.config?.modelProvider, "relay_test");
  assert.equal(payload.data?.config?.providers?.[0]?.id, "relay_test");
});

test("CodeAgent Switch reports active source details for standalone profiles", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-codeagent-switch-active-source-"));
  const configPath = path.join(dir, "config.toml");
  fs.writeFileSync(
    configPath,
    `model_provider = "relay_one"
model = "gpt-5.5"
review_model = "gpt-5.5"

[model_providers.relay_one]
base_url = "https://relay.example.com/v1"
env_key = "RELAY_ONE_API_KEY"
`,
    "utf8"
  );
  fs.writeFileSync(
    path.join(dir, "daily.config.toml"),
    `model_provider = "relay_one"
model = "gpt-5.5"
review_model = "gpt-5.5"
`,
    "utf8"
  );
  const { window, sent } = createMockWindow();

  const result = await executePluginCommand(
    `codeagent-switch?configPath=${encodeURIComponent(configPath)}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, true);
  const payload = sent[0]?.payload as {
    data?: {
      active?: {
        activeSource?: { kind?: string; profileId?: string; detail?: string };
      };
    };
  };
  assert.equal(payload.data?.active?.activeSource?.kind, "standalone");
  assert.equal(payload.data?.active?.activeSource?.profileId, "daily");
  assert.match(payload.data?.active?.activeSource?.detail ?? "", /daily\.config\.toml/i);
});

test("CodeAgent Switch returns empty state when config file does not exist", async () => {
  const missingPath = path.join(os.tmpdir(), "ll-codeagent-switch-missing", "config.toml");
  const { window, sent } = createMockWindow();
  const params = new URLSearchParams();
  params.set("configPath", missingPath);

  const result = await executePluginCommand(
    `codeagent-switch?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, true);
  const payload = sent[0]?.payload as {
    data?: {
      exists?: boolean;
      config?: { providers?: unknown[]; profiles?: unknown[] };
      diagnostics?: Array<{ id?: string; level?: string }>;
    };
  };
  assert.equal(payload.data?.exists, false);
  assert.deepEqual(payload.data?.config?.providers, []);
  assert.deepEqual(payload.data?.config?.profiles, []);
  assert.ok(payload.data?.diagnostics?.some((item) => item.id === "D010"));
});

test("CodeAgent Switch previews a profile switch without writing config", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-codeagent-switch-preview-"));
  const configPath = path.join(dir, "config.toml");
  const original = `profile = "old"
model_provider = "relay_one"
model = "gpt-5.5"

[model_providers.relay_one]
base_url = "https://relay-one.example.com/v1"
env_key = "RELAY_ONE_API_KEY"

[model_providers.relay_two]
base_url = "https://relay-two.example.com/v1"
env_key = "RELAY_TWO_API_KEY"
`;
  fs.writeFileSync(configPath, original, "utf8");
  fs.writeFileSync(
    path.join(dir, "fast.config.toml"),
    `model_provider = "relay_two"
model = "gpt-5.4"
model_reasoning_effort = "high"
`,
    "utf8"
  );
  const { window, sent } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "preview");
  params.set("profile", "fast");
  params.set("configPath", configPath);

  const result = await executePluginCommand(
    `codeagent-switch?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, true);
  assert.equal(fs.readFileSync(configPath, "utf8"), original);
  const payload = sent[0]?.payload as {
    data?: {
      preview?: {
        profileId?: string;
        diffLines?: string[];
        newSource?: string;
      };
      config?: { modelProvider?: string };
    };
  };
  assert.equal(payload.data?.preview?.profileId, "fast");
  assert.ok(payload.data?.preview?.diffLines?.includes('- model_provider = "relay_one"'));
  assert.ok(payload.data?.preview?.diffLines?.includes('- model = "gpt-5.5"'));
  assert.ok(payload.data?.preview?.diffLines?.includes('- profile = "old"'));
  assert.ok(payload.data?.preview?.diffLines?.includes('+ model_provider = "relay_two"'));
  assert.match(payload.data?.preview?.newSource ?? "", /model_provider = "relay_two"/);
  assert.match(payload.data?.preview?.newSource ?? "", /model_reasoning_effort = "high"/);
  assert.equal(payload.data?.config?.modelProvider, "relay_one");
});

test("CodeAgent Switch previews a profile switch with Chinese provider names intact", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-codeagent-switch-preview-cn-"));
  const configPath = path.join(dir, "config.toml");
  const original = `profile = "淘宝1"
model_provider = "OpenAI"
model = "gpt-5.5"

[model_providers.OpenAI]
name = "淘宝1"
base_url = "https://openrouter.icu"
env_key = "RELAY_ONE_API_KEY"

[profiles."淘宝1"]
model_provider = "OpenAI"
model = "gpt-5.5"
`;
  fs.writeFileSync(configPath, original, "utf8");
  const { window, sent } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "preview");
  params.set("profile", "淘宝1");
  params.set("configPath", configPath);

  const result = await executePluginCommand(
    `codeagent-switch?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, true);
  assert.equal(fs.readFileSync(configPath, "utf8"), original);
  const payload = sent[0]?.payload as {
    data?: {
      config?: { providers?: Array<{ name?: string }> };
      preview?: { newSource?: string; profileId?: string };
    };
  };
  assert.equal(payload.data?.config?.providers?.[0]?.name, "淘宝1");
  assert.equal(payload.data?.preview?.profileId, "淘宝1");
  assert.doesNotMatch(payload.data?.preview?.newSource ?? "", /娣|閾|�/);
});

test("CodeAgent Switch applies a profile switch with backup and validation", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-codeagent-switch-apply-"));
  const configPath = path.join(dir, "config.toml");
  const backupRoot = path.join(dir, "backups");
  const original = `profile = "old"
model_provider = "relay_one"
model = "gpt-5.5"

[model_providers.relay_one]
base_url = "https://relay-one.example.com/v1"
env_key = "RELAY_ONE_API_KEY"

[model_providers.relay_two]
base_url = "https://relay-two.example.com/v1"
env_key = "RELAY_TWO_API_KEY"
`;
  fs.writeFileSync(configPath, original, "utf8");
  fs.writeFileSync(
    path.join(dir, "fast.config.toml"),
    `model_provider = "relay_two"
model = "gpt-5.4"
model_reasoning_effort = "high"
`,
    "utf8"
  );
  const { window, sent } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "apply");
  params.set("profile", "fast");
  params.set("configPath", configPath);
  params.set("backupRoot", backupRoot);

  const result = await executePluginCommand(
    `codeagent-switch?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, true);
  const nextSource = fs.readFileSync(configPath, "utf8");
  assert.doesNotMatch(nextSource, /^profile = /m);
  assert.match(nextSource, /^model_provider = "relay_two"$/m);
  assert.match(nextSource, /^model = "gpt-5.4"$/m);
  assert.match(nextSource, /^model_reasoning_effort = "high"$/m);
  const backups = fs.readdirSync(backupRoot, { recursive: true }) as string[];
  const backupFile = backups.find((item) => item.endsWith(".bak"));
  assert.ok(backupFile, "backup file should be created before write");
  assert.equal(fs.readFileSync(path.join(backupRoot, backupFile), "utf8"), original);

  const payload = sent[0]?.payload as {
    data?: {
      applied?: boolean;
      backupPath?: string;
      config?: { profile?: string; modelProvider?: string; model?: string };
      preview?: { profileId?: string };
    };
  };
  assert.equal(payload.data?.applied, true);
  assert.equal(payload.data?.config?.modelProvider, "relay_two");
  assert.equal(payload.data?.config?.model, "gpt-5.4");
  assert.ok(payload.data?.backupPath?.endsWith(".bak"));
  assert.equal(payload.data?.preview?.profileId, "fast");
});

test("CodeAgent Switch saves a provider with backup and returns active summary", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-codeagent-switch-save-provider-"));
  const configPath = path.join(dir, "config.toml");
  const backupRoot = path.join(dir, "backups");
  const original = `model_provider = "relay_one"
model = "gpt-5.5"

[model_providers.relay_one]
name = "Relay One"
base_url = "https://old.example.com/v1"
env_key = "OLD_KEY"

[profiles.pro]
model_provider = "relay_one"
model = "gpt-5.5"
`;
  fs.writeFileSync(configPath, original, "utf8");
  const { window, sent } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "save-provider");
  params.set("configPath", configPath);
  params.set("backupRoot", backupRoot);
  params.set("provider", "relay_one");
  params.set("name", "Relay One Updated");
  params.set("baseUrl", "https://relay.example.com/v1");
  params.set("wireApi", "responses");
  params.set("envKey", "RELAY_ONE_API_KEY");

  const result = await executePluginCommand(
    `codeagent-switch?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, true);
  const nextSource = fs.readFileSync(configPath, "utf8");
  assert.match(nextSource, /name = "Relay One Updated"/);
  assert.match(nextSource, /env_key = "RELAY_ONE_API_KEY"/);
  assert.equal(nextSource.includes("OLD_KEY"), false);
  const backups = fs.readdirSync(path.join(backupRoot, "codex"));
  assert.equal(backups.some((item) => item.endsWith(".bak")), true);
  const payload = sent[0]?.payload as {
    data?: {
      savedProvider?: boolean;
      active?: { activeProviderId?: string; activeProvider?: { envKey?: string } };
    };
  };
  assert.equal(payload.data?.savedProvider, true);
  assert.equal(payload.data?.active?.activeProviderId, "relay_one");
  assert.equal(payload.data?.active?.activeProvider?.envKey, "RELAY_ONE_API_KEY");
});

test("CodeAgent Switch writes provider API keys to the user environment without changing config", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-codeagent-switch-set-key-"));
  const configPath = path.join(dir, "config.toml");
  const envKey = "CODEAGENT_RELAY_ONE_API_KEY";
  const apiKey = "sk-test-codeagent-switch";
  const original = `model_provider = "relay_one"
model = "gpt-5.5"

[model_providers.relay_one]
base_url = "https://relay.example.com/v1"
env_key = "${envKey}"
`;
  fs.writeFileSync(configPath, original, "utf8");
  const previousEnvValue = process.env[envKey];
  delete process.env[envKey];
  const pluginModule = (await import("../main/plugins/codeagent-switch")) as unknown as {
    setCodeAgentSwitchEnvWriterForTest?: (
      writer: (name: string, value: string) => void
    ) => () => void;
  };
  const writes: Array<{ name: string; value: string }> = [];
  const restoreWriter = pluginModule.setCodeAgentSwitchEnvWriterForTest?.((name, value) => {
    writes.push({ name, value });
  });
  assert.equal(typeof restoreWriter, "function");

  try {
    const { window, sent } = createMockWindow();
    const params = new URLSearchParams();
    params.set("action", "set-provider-key");
    params.set("configPath", configPath);
    params.set("envKey", envKey);
    params.set("apiKey", apiKey);

    const result = await executePluginCommand(
      `codeagent-switch?${params.toString()}`,
      window as never,
      createSelectedItem()
    );

    assert.equal(result.ok, true);
    assert.deepEqual(writes, [{ name: envKey, value: apiKey }]);
    assert.equal(process.env[envKey], apiKey);
    assert.equal(fs.readFileSync(configPath, "utf8"), original);
    const payload = sent[0]?.payload as {
      data?: {
        setProviderKey?: boolean;
        keyAppliedEnvKey?: string;
        diagnostics?: Array<{ id?: string; message?: string }>;
      };
    };
    assert.equal(payload.data?.setProviderKey, true);
    assert.equal(payload.data?.keyAppliedEnvKey, envKey);
    assert.equal(
      payload.data?.diagnostics?.some(
        (item) => item.id === "D006" && item.message?.includes(envKey)
      ),
      false
    );
  } finally {
    restoreWriter?.();
    if (previousEnvValue === undefined) {
      delete process.env[envKey];
    } else {
      process.env[envKey] = previousEnvValue;
    }
  }
});

test("CodeAgent Switch saves provider advanced fields through plugin commands", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-codeagent-switch-save-provider-advanced-"));
  const configPath = path.join(dir, "config.toml");
  const backupRoot = path.join(dir, "backups");
  fs.writeFileSync(
    configPath,
    `
[model_providers.relay_one]
base_url = "https://old.example.com/v1"
`,
    "utf8"
  );
  const { window, sent } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "save-provider");
  params.set("configPath", configPath);
  params.set("backupRoot", backupRoot);
  params.set("provider", "relay_one");
  params.set("baseUrl", "https://relay.example.com/v1");
  params.set("envKey", "RELAY_ONE_API_KEY");
  params.set("envKeyInstructions", "在 Provider 控制台创建 Key。");
  params.set("supportsWebsockets", "true");
  params.set("httpHeaders", "X-App=LiteLauncher\nX-Team=AI");
  params.set("envHttpHeaders", "Authorization=RELAY_AUTH_HEADER");
  params.set("queryParams", "api-version=2026-01-01");

  const result = await executePluginCommand(
    `codeagent-switch?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, true);
  const nextSource = fs.readFileSync(configPath, "utf8");
  assert.match(nextSource, /env_key_instructions = "在 Provider 控制台创建 Key。"/);
  assert.match(nextSource, /supports_websockets = true/);
  assert.match(nextSource, /\[model_providers\.relay_one\.http_headers\]/);
  assert.match(nextSource, /X-App = "LiteLauncher"/);
  assert.match(nextSource, /\[model_providers\.relay_one\.env_http_headers\]/);
  assert.match(nextSource, /Authorization = "RELAY_AUTH_HEADER"/);
  assert.match(nextSource, /\[model_providers\.relay_one\.query_params\]/);
  assert.match(nextSource, /api-version = "2026-01-01"/);
  const payload = sent[0]?.payload as {
    data?: {
      savedProvider?: boolean;
      config?: { providers?: Array<{ supportsWebsockets?: boolean }> };
    };
  };
  assert.equal(payload.data?.savedProvider, true);
  assert.equal(payload.data?.config?.providers?.[0]?.supportsWebsockets, true);
});

test("CodeAgent Switch saves provider and root config together through plugin commands", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-codeagent-switch-save-provider-runtime-"));
  const configPath = path.join(dir, "config.toml");
  const backupRoot = path.join(dir, "backups");
  fs.writeFileSync(
    configPath,
    `model_provider = "relay_old"
default_permissions = "trusted"
approval_policy = "never"
sandbox_mode = "read-only"

[history]
persistence = "save-all"

[model_providers.relay_old]
name = "Relay Old"
base_url = "https://old.example.com/v1"
env_key = "OLD_KEY"
`,
    "utf8"
  );
  const { window, sent } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "save-provider-runtime");
  params.set("configPath", configPath);
  params.set("backupRoot", backupRoot);
  params.set("provider", "relay_new");
  params.set("name", "Relay New");
  params.set("baseUrl", "https://relay.example.com/v1");
  params.set("wireApi", "responses");
  params.set("envKey", "RELAY_NEW_API_KEY");
  params.set("model", "gpt-5.6");
  params.set("reviewModel", "gpt-5.6-mini");
  params.set("reasoningSummary", "concise");
  params.set("personality", "pragmatic");
  params.set("historyPersistence", "none");
  params.set("approvalPolicy", "on-request");
  params.set("sandboxMode", "danger-full-access");
  params.set("defaultPermissions", "untrusted");
  params.set("networkAccess", "enabled");

  const result = await executePluginCommand(
    `codeagent-switch?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, true);
  const nextSource = fs.readFileSync(configPath, "utf8");
  assert.match(nextSource, /^model_provider = "relay_new"$/m);
  assert.match(nextSource, /^model = "gpt-5.6"$/m);
  assert.match(nextSource, /^review_model = "gpt-5.6-mini"$/m);
  assert.match(nextSource, /^model_reasoning_summary = "concise"$/m);
  assert.match(nextSource, /^personality = "pragmatic"$/m);
  assert.match(nextSource, /^approval_policy = "on-request"$/m);
  assert.match(nextSource, /^sandbox_mode = "danger-full-access"$/m);
  assert.match(nextSource, /^default_permissions = "untrusted"$/m);
  assert.match(nextSource, /^network_access = "enabled"$/m);
  assert.match(nextSource, /\[history\][\s\S]*persistence = "none"/m);
  assert.match(nextSource, /\[model_providers\.relay_new\]/);
  assert.match(nextSource, /name = "Relay New"/);
  assert.match(nextSource, /base_url = "https:\/\/relay\.example\.com\/v1"/);
  assert.match(nextSource, /env_key = "RELAY_NEW_API_KEY"/);
  const backups = fs.readdirSync(path.join(backupRoot, "codex"));
  assert.equal(backups.some((item) => item.endsWith(".bak")), true);

  const payload = sent[0]?.payload as {
    data?: {
      savedProvider?: boolean;
      savedRuntime?: boolean;
      rootSource?: string;
      config?: {
        modelProvider?: string;
        model?: string;
        reviewModel?: string;
        personality?: string;
        history?: { persistence?: string };
        approvalPolicy?: string;
        sandboxMode?: string;
        defaultPermissions?: string;
        networkAccess?: string;
        providers?: Array<{ id?: string; envKey?: string }>;
      };
    };
  };
  const savedProvider = payload.data?.config?.providers?.find((provider) => provider.id === "relay_new");
  assert.equal(payload.data?.savedProvider, true);
  assert.equal(payload.data?.savedRuntime, true);
  assert.equal(payload.data?.config?.modelProvider, "relay_new");
  assert.equal(payload.data?.config?.model, "gpt-5.6");
  assert.equal(payload.data?.config?.reviewModel, "gpt-5.6-mini");
  assert.equal(payload.data?.config?.personality, "pragmatic");
  assert.equal(payload.data?.config?.history?.persistence, "none");
  assert.equal(payload.data?.config?.approvalPolicy, "on-request");
  assert.equal(payload.data?.config?.sandboxMode, "danger-full-access");
  assert.equal(payload.data?.config?.defaultPermissions, "untrusted");
  assert.equal(payload.data?.config?.networkAccess, "enabled");
  assert.equal(savedProvider?.id, "relay_new");
  assert.equal(savedProvider?.envKey, "RELAY_NEW_API_KEY");
  assert.match(payload.data?.rootSource ?? "", /^model_provider = "relay_new"$/m);
  assert.match(payload.data?.rootSource ?? "", /\[history\][\s\S]*persistence = "none"/m);
});

test("CodeAgent Switch saves and deletes profiles through plugin commands", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-codeagent-switch-save-profile-"));
  const configPath = path.join(dir, "config.toml");
  const backupRoot = path.join(dir, "backups");
  fs.writeFileSync(
    configPath,
    `model_provider = "relay_one"
model = "gpt-5.5"

[model_providers.relay_one]
base_url = "https://relay.example.com/v1"
env_key = "RELAY_ONE_API_KEY"
`,
    "utf8"
  );
  const { window, sent } = createMockWindow();
  const saveParams = new URLSearchParams();
  saveParams.set("action", "save-profile");
  saveParams.set("configPath", configPath);
  saveParams.set("backupRoot", backupRoot);
  saveParams.set("profile", "daily");
  saveParams.set("provider", "relay_one");
  saveParams.set("model", "gpt-5.4");
  saveParams.set("reviewModel", "gpt-5.4");
  saveParams.set("reasoning", "high");
  saveParams.set("compactLimit", "250000");

  const saveResult = await executePluginCommand(
    `codeagent-switch?${saveParams.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(saveResult.ok, true);
  const profilePath = path.join(dir, "daily.config.toml");
  assert.equal(fs.existsSync(profilePath), true);
  assert.doesNotMatch(fs.readFileSync(configPath, "utf8"), /\[profiles\.daily\]/);
  assert.match(fs.readFileSync(profilePath, "utf8"), /^model = "gpt-5.4"$/m);
  const savePayload = sent[0]?.payload as {
    data?: { savedProfile?: boolean; config?: { profiles?: Array<{ id?: string }> } };
  };
  assert.equal(savePayload.data?.savedProfile, true);
  assert.equal(savePayload.data?.config?.profiles?.[0]?.id, "daily");

  const deleteParams = new URLSearchParams();
  deleteParams.set("action", "delete-profile");
  deleteParams.set("configPath", configPath);
  deleteParams.set("backupRoot", backupRoot);
  deleteParams.set("profile", "daily");

  const deleteResult = await executePluginCommand(
    `codeagent-switch?${deleteParams.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(deleteResult.ok, true);
  assert.equal(fs.existsSync(profilePath), false);
  const deletePayload = sent[1]?.payload as {
    data?: { deletedProfile?: boolean; config?: { profiles?: unknown[] } };
  };
  assert.equal(deletePayload.data?.deletedProfile, true);
  assert.equal(deletePayload.data?.config?.profiles?.length, 0);
});

test("CodeAgent Switch saves legacy embedded profiles back out as standalone files", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-codeagent-switch-save-profile-legacy-"));
  const configPath = path.join(dir, "config.toml");
  const backupRoot = path.join(dir, "backups");
  fs.writeFileSync(
    configPath,
    `profile = "daily"
model_provider = "relay_one"
model = "gpt-5.4"

[model_providers.relay_one]
base_url = "https://relay.example.com/v1"
env_key = "RELAY_ONE_API_KEY"

[profiles.daily]
model_provider = "relay_one"
model = "gpt-5.4"
review_model = "gpt-5.4"
model_reasoning_effort = "medium"
`,
    "utf8"
  );
  const { window, sent } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "save-profile");
  params.set("configPath", configPath);
  params.set("backupRoot", backupRoot);
  params.set("profile", "daily");
  params.set("provider", "relay_one");
  params.set("model", "gpt-5.5");
  params.set("reviewModel", "gpt-5.5");
  params.set("reasoning", "high");

  const result = await executePluginCommand(
    `codeagent-switch?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, true);
  const profilePath = path.join(dir, "daily.config.toml");
  const nextConfig = fs.readFileSync(configPath, "utf8");
  const nextProfile = fs.readFileSync(profilePath, "utf8");
  assert.equal(fs.existsSync(profilePath), true);
  assert.doesNotMatch(nextConfig, /\[profiles\.daily\]/);
  assert.doesNotMatch(nextConfig, /^profile = /m);
  assert.match(nextConfig, /^model_provider = "relay_one"$/m);
  assert.match(nextConfig, /^model = "gpt-5.5"$/m);
  assert.match(nextProfile, /^model = "gpt-5.5"$/m);
  assert.match(nextProfile, /^review_model = "gpt-5.5"$/m);
  const backups = fs.readdirSync(path.join(backupRoot, "codex"));
  assert.equal(backups.some((item) => item.endsWith(".bak")), true);

  const payload = sent[0]?.payload as {
    data?: {
      savedProfile?: boolean;
      config?: {
        profiles?: Array<{ id?: string; storageKind?: string; sourcePath?: string }>;
      };
      active?: { activeSource?: { kind?: string; profileId?: string } };
    };
  };
  assert.equal(payload.data?.savedProfile, true);
  assert.equal(payload.data?.config?.profiles?.[0]?.id, "daily");
  assert.equal(payload.data?.config?.profiles?.[0]?.storageKind, "standalone");
  assert.match(payload.data?.config?.profiles?.[0]?.sourcePath ?? "", /daily\.config\.toml/i);
  assert.equal(payload.data?.active?.activeSource?.kind, "standalone");
  assert.equal(payload.data?.active?.activeSource?.profileId, "daily");
});

test("CodeAgent Switch migrates embedded legacy profiles into standalone files", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-codeagent-switch-migrate-profile-"));
  const configPath = path.join(dir, "config.toml");
  const backupRoot = path.join(dir, "backups");
  fs.writeFileSync(
    configPath,
    `profile = "daily"

[model_providers.relay_one]
base_url = "https://relay.example.com/v1"
env_key = "RELAY_ONE_API_KEY"

[profiles.daily]
model_provider = "relay_one"
model = "gpt-5.4"
review_model = "gpt-5.4"
model_reasoning_effort = "high"
`,
    "utf8"
  );
  const { window, sent } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "migrate-profile");
  params.set("configPath", configPath);
  params.set("backupRoot", backupRoot);
  params.set("profile", "daily");

  const result = await executePluginCommand(
    `codeagent-switch?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, true);
  const profilePath = path.join(dir, "daily.config.toml");
  assert.equal(fs.existsSync(profilePath), true);
  const nextConfig = fs.readFileSync(configPath, "utf8");
  const nextProfile = fs.readFileSync(profilePath, "utf8");
  assert.doesNotMatch(nextConfig, /\[profiles\.daily\]/);
  assert.doesNotMatch(nextConfig, /^profile = /m);
  assert.match(nextConfig, /^model_provider = "relay_one"$/m);
  assert.match(nextProfile, /^model_provider = "relay_one"$/m);
  assert.match(nextProfile, /^model = "gpt-5.4"$/m);
  const backups = fs.readdirSync(path.join(backupRoot, "codex"));
  assert.equal(backups.some((item) => item.endsWith(".bak")), true);

  const payload = sent[0]?.payload as {
    data?: {
      migratedProfile?: boolean;
      migratedProfilePath?: string;
      config?: { profiles?: Array<{ id?: string; storageKind?: string }> };
      active?: { activeSource?: { kind?: string; profileId?: string } };
    };
  };
  assert.equal(payload.data?.migratedProfile, true);
  assert.match(payload.data?.migratedProfilePath ?? "", /daily\.config\.toml/i);
  assert.equal(payload.data?.config?.profiles?.[0]?.storageKind, "standalone");
  assert.equal(payload.data?.active?.activeSource?.kind, "standalone");
  assert.equal(payload.data?.active?.activeSource?.profileId, "daily");
});

test("CodeAgent Switch saves profile advanced fields through plugin commands", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-codeagent-switch-save-profile-advanced-"));
  const configPath = path.join(dir, "config.toml");
  const backupRoot = path.join(dir, "backups");
  fs.writeFileSync(
    configPath,
    `
[model_providers.relay_one]
base_url = "https://relay.example.com/v1"
env_key = "RELAY_ONE_API_KEY"
`,
    "utf8"
  );
  const { window, sent } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "save-profile");
  params.set("configPath", configPath);
  params.set("backupRoot", backupRoot);
  params.set("profile", "daily");
  params.set("provider", "relay_one");
  params.set("model", "gpt-5.5");
  params.set("reviewModel", "gpt-5.5");
  params.set("reasoning", "high");
  params.set("planReasoning", "xhigh");
  params.set("reasoningSummary", "auto");
  params.set("verbosity", "low");
  params.set("serviceTier", "fast");
  params.set("webSearch", "live");

  const result = await executePluginCommand(
    `codeagent-switch?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, true);
  const nextSource = fs.readFileSync(path.join(dir, "daily.config.toml"), "utf8");
  assert.match(nextSource, /plan_mode_reasoning_effort = "xhigh"/);
  assert.match(nextSource, /model_reasoning_summary = "auto"/);
  assert.match(nextSource, /model_verbosity = "low"/);
  assert.match(nextSource, /service_tier = "fast"/);
  assert.match(nextSource, /web_search = "live"/);
  const payload = sent[0]?.payload as {
    data?: {
      savedProfile?: boolean;
      config?: { profiles?: Array<{ planModeReasoningEffort?: string }> };
    };
  };
  assert.equal(payload.data?.savedProfile, true);
  assert.equal(payload.data?.config?.profiles?.[0]?.planModeReasoningEffort, "xhigh");
});

test("CodeAgent Switch saves runtime security fields through plugin commands", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-codeagent-switch-save-runtime-"));
  const configPath = path.join(dir, "config.toml");
  const backupRoot = path.join(dir, "backups");
  fs.writeFileSync(
    configPath,
    `
[profiles.daily]
model = "gpt-5.5"
`,
    "utf8"
  );
  const { window, sent } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "save-runtime");
  params.set("configPath", configPath);
  params.set("backupRoot", backupRoot);
  params.set("approvalPolicy", "on-request");
  params.set("sandboxMode", "workspace-write");
  params.set("defaultPermissions", "trusted");
  params.set("networkAccess", "restricted");
  params.set("windowsSandbox", "elevated");
  params.set("windowsSandboxPrivateDesktop", "true");

  const result = await executePluginCommand(
    `codeagent-switch?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, true);
  const nextSource = fs.readFileSync(configPath, "utf8");
  assert.match(nextSource, /approval_policy = "on-request"/);
  assert.match(nextSource, /sandbox_mode = "workspace-write"/);
  assert.match(nextSource, /default_permissions = "trusted"/);
  assert.match(nextSource, /network_access = "restricted"/);
  assert.match(nextSource, /\[windows\]/);
  assert.match(nextSource, /sandbox = "elevated"/);
  assert.match(nextSource, /sandbox_private_desktop = true/);
  const payload = sent[0]?.payload as {
    data?: {
      savedRuntime?: boolean;
      savedProfile?: boolean;
      rootChangedFields?: string[];
      config?: { windows?: { sandboxPrivateDesktop?: boolean } };
    };
  };
  assert.equal(payload.data?.savedRuntime, true);
  assert.equal(payload.data?.savedProfile, undefined);
  assert.deepEqual(payload.data?.rootChangedFields, [
    "approval_policy",
    "sandbox_mode",
    "default_permissions",
    "network_access",
    "windows.sandbox",
    "windows.private_desktop"
  ]);
  assert.equal(payload.data?.config?.windows?.sandboxPrivateDesktop, true);
});

test("CodeAgent Switch saves root config official fields through plugin commands", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-codeagent-switch-save-root-"));
  const configPath = path.join(dir, "config.toml");
  const backupRoot = path.join(dir, "backups");
  fs.writeFileSync(
    configPath,
    `model_provider = "relay_old"
openai_base_url = "https://old.example/v1"

[history]
persistence = "save-all"
max_bytes = 104857600
`,
    "utf8"
  );
  const { window, sent } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "save-runtime");
  params.set("configPath", configPath);
  params.set("backupRoot", backupRoot);
  params.set("provider", "relay_new");
  params.set("model", "gpt-5.6");
  params.set("reviewModel", "gpt-5.6-mini");
  params.set("reasoning", "minimal");
  params.set("planReasoning", "xhigh");
  params.set("reasoningSummary", "concise");
  params.set("verbosity", "medium");
  params.set("modelSupportsReasoningSummaries", "false");
  params.set("serviceTier", "flex");
  params.set("webSearch", "cached");
  params.set("modelContextWindow", "200000");
  params.set("compactLimit", "420000");
  params.set("approvalPolicy", "never");
  params.set("approvalsReviewer", "auto_review");
  params.set("allowLoginShell", "true");
  params.set("sandboxMode", "danger-full-access");
  params.set("defaultPermissions", "trusted");
  params.set("disableResponseStorage", "false");
  params.set("networkAccess", "restricted");
  params.set("personality", "pragmatic");
  params.set("projectDocMaxBytes", "131072");
  params.set("toolOutputTokenLimit", "24000");
  params.set("windowsWslSetupAcknowledged", "false");
  params.set("windowsSandbox", "unelevated");
  params.set("windowsSandboxPrivateDesktop", "false");
  params.set("historyPersistence", "none");
  params.set("historyMaxBytes", "2048");
  params.set("clearFields", "openaiBaseUrl");

  const result = await executePluginCommand(
    `codeagent-switch?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, true);
  const nextSource = fs.readFileSync(configPath, "utf8");
  assert.match(nextSource, /^model_provider = "relay_new"$/m);
  assert.match(nextSource, /^model = "gpt-5.6"$/m);
  assert.match(nextSource, /^review_model = "gpt-5.6-mini"$/m);
  assert.match(nextSource, /^plan_mode_reasoning_effort = "xhigh"$/m);
  assert.match(nextSource, /^model_reasoning_summary = "concise"$/m);
  assert.match(nextSource, /^model_verbosity = "medium"$/m);
  assert.match(nextSource, /^model_supports_reasoning_summaries = false$/m);
  assert.match(nextSource, /^service_tier = "flex"$/m);
  assert.match(nextSource, /^web_search = "cached"$/m);
  assert.match(nextSource, /^model_context_window = 200000$/m);
  assert.match(nextSource, /^approvals_reviewer = "auto_review"$/m);
  assert.match(nextSource, /^allow_login_shell = true$/m);
  assert.match(nextSource, /^disable_response_storage = false$/m);
  assert.match(nextSource, /^personality = "pragmatic"$/m);
  assert.match(nextSource, /^project_doc_max_bytes = 131072$/m);
  assert.match(nextSource, /^tool_output_token_limit = 24000$/m);
  assert.match(nextSource, /^windows_wsl_setup_acknowledged = false$/m);
  assert.doesNotMatch(nextSource, /^openai_base_url = /m);
  assert.match(nextSource, /\[windows\][\s\S]*sandbox = "unelevated"/m);
  assert.match(nextSource, /\[windows\][\s\S]*sandbox_private_desktop = false/m);
  assert.match(nextSource, /\[history\][\s\S]*persistence = "none"/m);
  assert.match(nextSource, /\[history\][\s\S]*max_bytes = 2048/m);
  const payload = sent[0]?.payload as {
    data?: {
      savedRuntime?: boolean;
      rootChangedFields?: string[];
      rootSource?: string;
      configSource?: string;
      config?: {
        modelProvider?: string;
        personality?: string;
        history?: { persistence?: string };
      };
    };
  };
  assert.equal(payload.data?.savedRuntime, true);
  assert.deepEqual(payload.data?.rootChangedFields, [
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
    "windows_wsl_setup_acknowledged",
    "windows.sandbox",
    "windows.private_desktop",
    "history.persistence",
    "history.max_bytes"
  ]);
  assert.equal(payload.data?.config?.modelProvider, "relay_new");
  assert.equal(payload.data?.config?.personality, "pragmatic");
  assert.equal(payload.data?.config?.history?.persistence, "none");
  assert.match(payload.data?.rootSource ?? "", /^model_provider = "relay_new"$/m);
  assert.match(payload.data?.rootSource ?? "", /\[history\][\s\S]*persistence = "none"/m);
  assert.match(payload.data?.rootSource ?? "", /\[windows\][\s\S]*sandbox = "unelevated"/m);
  assert.equal(payload.data?.rootSource, payload.data?.configSource);
});

test("CodeAgent Switch blocks deleting active providers through plugin commands", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-codeagent-switch-delete-provider-"));
  const configPath = path.join(dir, "config.toml");
  fs.writeFileSync(
    configPath,
    `model_provider = "relay_one"

[model_providers.relay_one]
base_url = "https://relay.example.com/v1"
`,
    "utf8"
  );
  const { window } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "delete-provider");
  params.set("configPath", configPath);
  params.set("provider", "relay_one");

  const result = await executePluginCommand(
    `codeagent-switch?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, false);
  assert.match(result.message ?? "", /active provider/i);
  assert.match(fs.readFileSync(configPath, "utf8"), /\[model_providers\.relay_one\]/);
});

test("CodeAgent Switch lists plugin-owned backups newest first", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-codeagent-switch-backups-"));
  const backupRoot = path.join(dir, "backups");
  const backupDir = path.join(backupRoot, "codex");
  fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(
    path.join(backupDir, "config.toml.20260512_101010.bak"),
    'model_provider = "old"\n',
    "utf8"
  );
  fs.writeFileSync(
    path.join(backupDir, "config.toml.20260512_111111.bak"),
    'model_provider = "new"\n',
    "utf8"
  );
  fs.writeFileSync(path.join(backupDir, "not-a-backup.txt"), "ignore", "utf8");
  const configPath = path.join(dir, "config.toml");
  fs.writeFileSync(configPath, 'model_provider = "current"\n', "utf8");
  const { window, sent } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "backups");
  params.set("configPath", configPath);
  params.set("backupRoot", backupRoot);

  const result = await executePluginCommand(
    `codeagent-switch?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, true);
  const payload = sent[0]?.payload as {
    data?: {
      backups?: Array<{ id?: string; fileName?: string; sizeBytes?: number }>;
    };
  };
  assert.equal(payload.data?.backups?.length, 2);
  assert.equal(payload.data?.backups?.[0]?.fileName, "config.toml.20260512_111111.bak");
  assert.equal(payload.data?.backups?.[1]?.fileName, "config.toml.20260512_101010.bak");
  assert.ok(payload.data?.backups?.[0]?.id);
  assert.equal(typeof payload.data?.backups?.[0]?.sizeBytes, "number");
});

test("CodeAgent Switch restores a backup after backing up current config", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-codeagent-switch-restore-"));
  const configPath = path.join(dir, "config.toml");
  const backupRoot = path.join(dir, "backups");
  const backupDir = path.join(backupRoot, "codex");
  fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(configPath, 'model_provider = "current"\n', "utf8");
  const restoreFileName = "config.toml.20260512_121212.bak";
  fs.writeFileSync(
    path.join(backupDir, restoreFileName),
    'model_provider = "restored"\n',
    "utf8"
  );
  const { window, sent } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "restore");
  params.set("backup", restoreFileName);
  params.set("configPath", configPath);
  params.set("backupRoot", backupRoot);

  const result = await executePluginCommand(
    `codeagent-switch?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, true);
  assert.equal(fs.readFileSync(configPath, "utf8"), 'model_provider = "restored"\n');
  const backups = fs.readdirSync(backupDir).filter((item) => item.endsWith(".bak"));
  assert.equal(
    backups.some((item) => item !== restoreFileName),
    true,
    "restore should preserve current config as a new backup before replacing it"
  );

  const payload = sent[0]?.payload as {
    data?: {
      restored?: boolean;
      restoredBackupPath?: string;
      backupPath?: string;
      backups?: Array<{ fileName?: string }>;
      config?: { modelProvider?: string };
    };
  };
  assert.equal(payload.data?.restored, true);
  assert.equal(payload.data?.config?.modelProvider, "restored");
  assert.ok(payload.data?.restoredBackupPath?.endsWith(restoreFileName));
  assert.ok(payload.data?.backupPath?.endsWith(".bak"));
  assert.ok(payload.data?.backups?.some((item) => item.fileName === restoreFileName));
});

test("CodeAgent Switch rejects restoring backups outside the backup directory", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-codeagent-switch-restore-bad-"));
  const configPath = path.join(dir, "config.toml");
  const backupRoot = path.join(dir, "backups");
  fs.writeFileSync(configPath, 'model_provider = "current"\n', "utf8");
  const { window } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "restore");
  params.set("backup", "..\\outside.bak");
  params.set("configPath", configPath);
  params.set("backupRoot", backupRoot);

  const result = await executePluginCommand(
    `codeagent-switch?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, false);
  assert.match(result.message ?? "", /备份文件不合法/);
  assert.equal(fs.readFileSync(configPath, "utf8"), 'model_provider = "current"\n');
});
