import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { app } from "electron";

import { IPC_CHANNELS } from "../../../shared/channels";
import {
  buildCodeAgentSwitchProfilePreview,
  buildCodeAgentSwitchEnvCommands,
  CodeAgentSwitchProfilePreview,
  CodexParsedConfig,
  CodexProviderConfigInput,
  deleteCodexProfileInToml,
  deleteCodexProviderInToml,
  diagnoseCodexConfig,
  parseCodexTomlConfig,
  summarizeCodeAgentSwitchActiveConfig,
  updateCodexRuntimeConfigInToml,
  upsertCodexProfileInToml,
  upsertCodexProviderInToml
} from "../../../shared/codeagent-switch";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type CodeAgentSwitchAction =
  | "open"
  | "read"
  | "diagnose"
  | "preview"
  | "apply"
  | "backups"
  | "restore"
  | "save-provider"
  | "set-provider-key"
  | "delete-provider"
  | "save-profile"
  | "save-runtime"
  | "delete-profile";

interface CodeAgentSwitchCommand {
  action: CodeAgentSwitchAction;
  tool?: string;
  configPath?: string;
  profile?: string;
  provider?: string;
  name?: string;
  baseUrl?: string;
  wireApi?: string;
  envKey?: string;
  envKeyInstructions?: string;
  apiKey?: string;
  requiresOpenAiAuth?: boolean;
  supportsWebsockets?: boolean;
  httpHeaders?: string;
  envHttpHeaders?: string;
  queryParams?: string;
  model?: string;
  reviewModel?: string;
  reasoning?: string;
  planReasoning?: string;
  reasoningSummary?: string;
  verbosity?: string;
  serviceTier?: string;
  webSearch?: string;
  compactLimit?: number;
  approvalPolicy?: string;
  sandboxMode?: string;
  defaultPermissions?: string;
  networkAccess?: string;
  windowsSandbox?: string;
  windowsSandboxPrivateDesktop?: boolean;
  requestMaxRetries?: number;
  streamMaxRetries?: number;
  streamIdleTimeoutMs?: number;
  backup?: string;
  backupRoot?: string;
}

const PLUGIN_ID = "codeagent-switch";
const DEFAULT_CONFIG = `model_provider = "relay_1"
model = "gpt-5.5"
review_model = "gpt-5.5"
model_reasoning_effort = "xhigh"
model_auto_compact_token_limit = 350000

[history]
max_bytes = 104857600

[model_providers.relay_1]
name = "Relay 1"
base_url = "https://relay.example.com/v1"
wire_api = "responses"
env_key = "RELAY_1_API_KEY"

[profiles.daily]
model_provider = "relay_1"
model = "gpt-5.4"
model_reasoning_effort = "high"
`;
const QUERY_ALIASES = [
  "codex",
  "codex switch",
  "codex doctor",
  "codex profile",
  "codex config",
  "codeagent",
  "codeagent switch",
  "中转站",
  "配置诊断",
  "模型切换"
];

type CodeAgentSwitchEnvWriter = (name: string, value: string) => void;

function writeUserEnvironmentVariable(name: string, value: string): void {
  if (process.platform !== "win32") {
    throw new Error("当前系统暂只支持自动写入 Windows 用户级环境变量");
  }
  execFileSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      "param([string]$Name,[string]$Value) [Environment]::SetEnvironmentVariable($Name, $Value, 'User')",
      name,
      value
    ],
    { windowsHide: true }
  );
}

let codeAgentSwitchEnvWriter: CodeAgentSwitchEnvWriter = writeUserEnvironmentVariable;

export function setCodeAgentSwitchEnvWriterForTest(
  writer: CodeAgentSwitchEnvWriter
): () => void {
  const previous = codeAgentSwitchEnvWriter;
  codeAgentSwitchEnvWriter = writer;
  return () => {
    codeAgentSwitchEnvWriter = previous;
  };
}

function buildTarget(action: CodeAgentSwitchAction): string {
  const params = new URLSearchParams();
  params.set("action", action);
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseCommand(optionsText: string | undefined): CodeAgentSwitchCommand {
  if (!optionsText) {
    return { action: "open" };
  }
  const params = new URLSearchParams(optionsText);
  const action = (params.get("action") ?? "open").trim().toLowerCase();
  const tool = (params.get("tool") ?? "codex").trim().toLowerCase() || "codex";
  const configPath = (params.get("configPath") ?? "").trim() || undefined;
  const profile = (params.get("profile") ?? "").trim() || undefined;
  const provider = (params.get("provider") ?? "").trim() || undefined;
  const name = (params.get("name") ?? "").trim() || undefined;
  const baseUrl = (params.get("baseUrl") ?? "").trim() || undefined;
  const wireApi = (params.get("wireApi") ?? "").trim() || undefined;
  const envKey = (params.get("envKey") ?? "").trim() || undefined;
  const envKeyInstructions = (params.get("envKeyInstructions") ?? "").trim() || undefined;
  const apiKey = (params.get("apiKey") ?? "").trim() || undefined;
  const supportsWebsockets = params.get("supportsWebsockets") === "true" ? true : undefined;
  const httpHeaders = (params.get("httpHeaders") ?? "").trim() || undefined;
  const envHttpHeaders = (params.get("envHttpHeaders") ?? "").trim() || undefined;
  const queryParams = (params.get("queryParams") ?? "").trim() || undefined;
  const auth = (params.get("auth") ?? "").trim().toLowerCase();
  const requiresOpenAiAuth =
    auth === "openai_auth" ||
    auth === "openai" ||
    params.get("requiresOpenAiAuth") === "true";
  const model = (params.get("model") ?? "").trim() || undefined;
  const reviewModel = (params.get("reviewModel") ?? "").trim() || undefined;
  const reasoning = (params.get("reasoning") ?? "").trim() || undefined;
  const planReasoning = (params.get("planReasoning") ?? "").trim() || undefined;
  const reasoningSummary = (params.get("reasoningSummary") ?? "").trim() || undefined;
  const verbosity = (params.get("verbosity") ?? "").trim() || undefined;
  const serviceTier = (params.get("serviceTier") ?? "").trim() || undefined;
  const webSearch = (params.get("webSearch") ?? "").trim() || undefined;
  const compactLimit = parseOptionalNumber(params.get("compactLimit"));
  const approvalPolicy = (params.get("approvalPolicy") ?? "").trim() || undefined;
  const sandboxMode = (params.get("sandboxMode") ?? "").trim() || undefined;
  const defaultPermissions = (params.get("defaultPermissions") ?? "").trim() || undefined;
  const networkAccess = (params.get("networkAccess") ?? "").trim() || undefined;
  const windowsSandbox = (params.get("windowsSandbox") ?? "").trim() || undefined;
  const windowsSandboxPrivateDesktop =
    params.get("windowsSandboxPrivateDesktop") === "true" ? true : undefined;
  const requestMaxRetries = parseOptionalNumber(params.get("requestMaxRetries"));
  const streamMaxRetries = parseOptionalNumber(params.get("streamMaxRetries"));
  const streamIdleTimeoutMs = parseOptionalNumber(params.get("streamIdleTimeoutMs"));
  const backup = (params.get("backup") ?? "").trim() || undefined;
  const backupRoot = (params.get("backupRoot") ?? "").trim() || undefined;
  if (
    action === "read" ||
    action === "diagnose" ||
    action === "preview" ||
    action === "apply" ||
    action === "backups" ||
    action === "restore" ||
    action === "save-provider" ||
    action === "set-provider-key" ||
    action === "delete-provider" ||
    action === "save-profile" ||
    action === "save-runtime" ||
    action === "delete-profile"
  ) {
    return {
      action,
      tool,
      configPath,
      profile,
      provider,
      name,
      baseUrl,
      wireApi,
      envKey,
      envKeyInstructions,
      apiKey,
      supportsWebsockets,
      httpHeaders,
      envHttpHeaders,
      queryParams,
      requiresOpenAiAuth,
      model,
      reviewModel,
      reasoning,
      planReasoning,
      reasoningSummary,
      verbosity,
      serviceTier,
      webSearch,
      compactLimit,
      approvalPolicy,
      sandboxMode,
      defaultPermissions,
      networkAccess,
      windowsSandbox,
      windowsSandboxPrivateDesktop,
      requestMaxRetries,
      streamMaxRetries,
      streamIdleTimeoutMs,
      backup,
      backupRoot
    };
  }
  return { action: "open", tool, configPath, profile, provider, backup, backupRoot };
}

function parseOptionalNumber(value: string | null): number | undefined {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return undefined;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseStringMapParam(value: string | undefined): Record<string, string> | undefined {
  if (!value) {
    return undefined;
  }
  const entries = value
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const equalsIndex = line.indexOf("=");
      if (equalsIndex <= 0) {
        return undefined;
      }
      const key = line.slice(0, equalsIndex).trim();
      const mapValue = line.slice(equalsIndex + 1).trim();
      return key && mapValue ? ([key, mapValue] as const) : undefined;
    })
    .filter((entry): entry is readonly [string, string] => entry !== undefined);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function matchesAlias(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return QUERY_ALIASES.some((alias) => {
    const value = alias.trim().toLowerCase();
    return normalized === value || normalized.startsWith(`${value} `);
  });
}

function createCatalogItem(): LaunchItem {
  return {
    id: `plugin:${PLUGIN_ID}`,
    type: "command",
    title: "CodeAgent Switch",
    subtitle: "Codex 配置切换、Provider 管理、Profile 诊断",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget("open"),
    keywords: [
      "plugin",
      "codex",
      "codeagent",
      "switch",
      "provider",
      "profile",
      "config",
      "toml",
      "中转站",
      "模型切换",
      "配置诊断",
      "AI 编程"
    ]
  };
}

function getDefaultCodexConfigPath(): string {
  return path.join(os.homedir(), ".codex", "config.toml");
}

function getDefaultBackupRoot(): string {
  try {
    return path.join(app.getPath("userData"), "codeagent-switch", "backups");
  } catch {
    return path.join(os.homedir(), ".litelauncher", "codeagent-switch", "backups");
  }
}

function formatBackupTimestamp(date = new Date()): string {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
}

function createPanelData(): {
  tool: string;
  tools: Array<{
    id: string;
    label: string;
    status: "ready" | "planned";
    description: string;
  }>;
  configPath: string;
  exists: boolean;
  config: CodexParsedConfig;
  active: ReturnType<typeof summarizeCodeAgentSwitchActiveConfig>;
  diagnostics: ReturnType<typeof diagnoseCodexConfig>;
  envCommands: ReturnType<typeof buildCodeAgentSwitchEnvCommands>;
  backups: CodeAgentSwitchBackupEntry[];
  preview?: CodeAgentSwitchProfilePreview;
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
} {
  return createPanelDataForPath(getDefaultCodexConfigPath(), false);
}

interface CodeAgentSwitchBackupEntry {
  id: string;
  fileName: string;
  path: string;
  sizeBytes: number;
  createdAtMs: number;
}

function createEmptyConfig(): CodexParsedConfig {
  return {
    providers: [],
    profiles: []
  };
}

function createPanelDataForPath(
  configPath: string,
  preferFile: boolean,
  extra: Partial<ReturnType<typeof createPanelData>> & { backupRoot?: string } = {}
): ReturnType<typeof createPanelData> {
  let exists = false;
  let error: string | undefined;
  let config: CodexParsedConfig;
  try {
    exists = fs.existsSync(configPath);
    if (exists) {
      config = parseCodexTomlConfig(fs.readFileSync(configPath, "utf8"));
    } else {
      config = preferFile ? createEmptyConfig() : parseCodexTomlConfig(DEFAULT_CONFIG);
    }
  } catch (readError) {
    config = createEmptyConfig();
    error = readError instanceof Error ? readError.message : String(readError);
  }
  const firstEnvKey =
    config.providers.find((provider) => provider.envKey)?.envKey ?? "RELAY_API_KEY";
  const diagnostics = diagnoseCodexConfig(config, {
    env: process.env as Record<string, string | undefined>
  });
  if (error) {
    diagnostics.unshift({
      id: "D001",
      level: "error",
      message: `TOML 解析失败：${error}`,
      suggestion: "请修复 config.toml 后再切换配置。"
    });
  }
  const { backupRoot, ...panelExtra } = extra;
  return {
    tool: "codex",
    tools: [
      {
        id: "codex",
        label: "Codex",
        status: "ready",
        description: "已接入 config.toml 读写"
      },
      {
        id: "claude-code",
        label: "Claude Code",
        status: "planned",
        description: "Adapter 规划中"
      },
      {
        id: "gemini-cli",
        label: "Gemini CLI",
        status: "planned",
        description: "Adapter 规划中"
      }
    ],
    configPath,
    exists,
    config,
    active: summarizeCodeAgentSwitchActiveConfig(config),
    diagnostics,
    envCommands: buildCodeAgentSwitchEnvCommands(firstEnvKey),
    backups: listBackupEntries(configPath, backupRoot),
    ...panelExtra
  };
}

function sendCodeAgentSwitchPanel(
  context: Parameters<LauncherPlugin["execute"]>[1],
  data: ReturnType<typeof createPanelData>
): void {
  context.window.webContents.send(IPC_CHANNELS.openPanel, {
    panel: "plugin",
    pluginId: PLUGIN_ID,
    title: "CodeAgent Switch",
    subtitle: "Codex 配置切换、Provider 管理、Profile 诊断",
    data
  });
}

function createProfilePreviewData(
  command: CodeAgentSwitchCommand
): ReturnType<typeof createPanelData> {
  const configPath = command.configPath ?? getDefaultCodexConfigPath();
  if (!command.profile) {
    throw new Error("请选择要预览的 Profile");
  }
  const source = fs.readFileSync(configPath, "utf8");
  const preview = buildCodeAgentSwitchProfilePreview(source, command.profile);
  return createPanelDataForPath(configPath, true, { preview });
}

function getBackupPath(configPath: string, backupRoot?: string): string {
  const root = backupRoot || getDefaultBackupRoot();
  const fileName = `${path.basename(configPath)}.${formatBackupTimestamp()}.bak`;
  return path.join(root, "codex", fileName);
}

function getBackupDirectory(backupRoot?: string): string {
  return path.join(backupRoot || getDefaultBackupRoot(), "codex");
}

function isBackupFileName(fileName: string, configPath: string): boolean {
  const escapedBaseName = path
    .basename(configPath)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escapedBaseName}\\.\\d{8}_\\d{6}\\.bak$`).test(fileName);
}

function listBackupEntries(
  configPath: string,
  backupRoot?: string
): CodeAgentSwitchBackupEntry[] {
  const backupDirectory = getBackupDirectory(backupRoot);
  if (!fs.existsSync(backupDirectory)) {
    return [];
  }

  return fs
    .readdirSync(backupDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isBackupFileName(entry.name, configPath))
    .map((entry) => {
      const backupPath = path.join(backupDirectory, entry.name);
      const stats = fs.statSync(backupPath);
      return {
        id: entry.name,
        fileName: entry.name,
        path: backupPath,
        sizeBytes: stats.size,
        createdAtMs: stats.mtimeMs
      };
    })
    .sort((a, b) => b.fileName.localeCompare(a.fileName));
}

function resolveBackupPath(
  configPath: string,
  backupId: string | undefined,
  backupRoot?: string
): string {
  const normalizedBackupId = (backupId ?? "").trim();
  if (!normalizedBackupId || path.basename(normalizedBackupId) !== normalizedBackupId) {
    throw new Error("备份文件不合法");
  }
  if (!isBackupFileName(normalizedBackupId, configPath)) {
    throw new Error("备份文件不合法");
  }
  const backupDirectory = path.resolve(getBackupDirectory(backupRoot));
  const backupPath = path.resolve(backupDirectory, normalizedBackupId);
  const relative = path.relative(backupDirectory, backupPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("备份文件不合法");
  }
  if (!fs.existsSync(backupPath)) {
    throw new Error("备份文件不存在");
  }
  return backupPath;
}

function restoreBackup(command: CodeAgentSwitchCommand): ReturnType<typeof createPanelData> {
  const configPath = command.configPath ?? getDefaultCodexConfigPath();
  const restorePath = resolveBackupPath(configPath, command.backup, command.backupRoot);
  const restoreSource = fs.readFileSync(restorePath, "utf8");
  parseCodexTomlConfig(restoreSource);

  const backupPath = fs.existsSync(configPath)
    ? getBackupPath(configPath, command.backupRoot)
    : undefined;
  if (backupPath) {
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.copyFileSync(configPath, backupPath);
  } else {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
  }

  const tempPath = `${configPath}.${process.pid}.${Date.now()}.restore.tmp`;
  try {
    fs.writeFileSync(tempPath, restoreSource, "utf8");
    parseCodexTomlConfig(fs.readFileSync(tempPath, "utf8"));
    fs.renameSync(tempPath, configPath);
  } catch (error) {
    if (fs.existsSync(tempPath)) {
      fs.rmSync(tempPath, { force: true });
    }
    throw error;
  }

  return createPanelDataForPath(configPath, true, {
    restored: true,
    restoredBackupPath: restorePath,
    backupPath,
    backupRoot: command.backupRoot
  });
}

function writeCodexConfigWithBackup(
  configPath: string,
  nextSource: string,
  backupRoot?: string
): string | undefined {
  parseCodexTomlConfig(nextSource);
  const exists = fs.existsSync(configPath);
  const backupPath = exists ? getBackupPath(configPath, backupRoot) : undefined;
  if (backupPath) {
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.copyFileSync(configPath, backupPath);
  } else {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
  }

  const tempPath = `${configPath}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(tempPath, nextSource, "utf8");
    parseCodexTomlConfig(fs.readFileSync(tempPath, "utf8"));
    fs.renameSync(tempPath, configPath);
  } catch (error) {
    if (fs.existsSync(tempPath)) {
      fs.rmSync(tempPath, { force: true });
    }
    throw error;
  }

  return backupPath;
}

function applyProfileSwitch(
  command: CodeAgentSwitchCommand
): ReturnType<typeof createPanelData> {
  const configPath = command.configPath ?? getDefaultCodexConfigPath();
  if (!command.profile) {
    throw new Error("请选择要切换的 Profile");
  }
  const source = fs.readFileSync(configPath, "utf8");
  const preview = buildCodeAgentSwitchProfilePreview(source, command.profile);
  const backupPath = writeCodexConfigWithBackup(
    configPath,
    preview.newSource,
    command.backupRoot
  );

  return createPanelDataForPath(configPath, true, {
    preview,
    applied: true,
    backupPath,
    backupRoot: command.backupRoot
  });
}

function readCodexConfigSource(configPath: string): string {
  return fs.existsSync(configPath) ? fs.readFileSync(configPath, "utf8") : "";
}

function saveProvider(command: CodeAgentSwitchCommand): ReturnType<typeof createPanelData> {
  const configPath = command.configPath ?? getDefaultCodexConfigPath();
  const providerId = command.provider;
  if (!providerId) {
    throw new Error("请选择要保存的 Provider");
  }
  const input: CodexProviderConfigInput = {
    id: providerId,
    name: command.name,
    baseUrl: command.baseUrl,
    wireApi: command.wireApi || "responses",
    envKey: command.requiresOpenAiAuth ? undefined : command.envKey,
    envKeyInstructions: command.envKeyInstructions,
    requiresOpenAiAuth: command.requiresOpenAiAuth,
    requestMaxRetries: command.requestMaxRetries,
    streamMaxRetries: command.streamMaxRetries,
    streamIdleTimeoutMs: command.streamIdleTimeoutMs,
    supportsWebsockets: command.supportsWebsockets,
    httpHeaders: parseStringMapParam(command.httpHeaders),
    envHttpHeaders: parseStringMapParam(command.envHttpHeaders),
    queryParams: parseStringMapParam(command.queryParams)
  };
  const nextSource = upsertCodexProviderInToml(readCodexConfigSource(configPath), input);
  const backupPath = writeCodexConfigWithBackup(
    configPath,
    nextSource,
    command.backupRoot
  );
  return createPanelDataForPath(configPath, true, {
    savedProvider: true,
    backupPath,
    backupRoot: command.backupRoot
  });
}

function setProviderKey(command: CodeAgentSwitchCommand): ReturnType<typeof createPanelData> {
  const configPath = command.configPath ?? getDefaultCodexConfigPath();
  const envKey = command.envKey;
  const apiKey = command.apiKey;
  if (!envKey) {
    throw new Error("缺少要写入的环境变量名");
  }
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(envKey)) {
    throw new Error("环境变量名格式不正确");
  }
  if (!apiKey) {
    throw new Error("请先填写 API Key");
  }
  codeAgentSwitchEnvWriter(envKey, apiKey);
  process.env[envKey] = apiKey;
  return createPanelDataForPath(configPath, true, {
    setProviderKey: true,
    keyAppliedEnvKey: envKey,
    backupRoot: command.backupRoot
  });
}

function deleteProvider(command: CodeAgentSwitchCommand): ReturnType<typeof createPanelData> {
  const configPath = command.configPath ?? getDefaultCodexConfigPath();
  if (!command.provider) {
    throw new Error("请选择要删除的 Provider");
  }
  const nextSource = deleteCodexProviderInToml(
    readCodexConfigSource(configPath),
    command.provider
  );
  const backupPath = writeCodexConfigWithBackup(
    configPath,
    nextSource,
    command.backupRoot
  );
  return createPanelDataForPath(configPath, true, {
    deletedProvider: true,
    backupPath,
    backupRoot: command.backupRoot
  });
}

function saveProfile(command: CodeAgentSwitchCommand): ReturnType<typeof createPanelData> {
  const configPath = command.configPath ?? getDefaultCodexConfigPath();
  if (!command.profile) {
    throw new Error("请选择要保存的 Profile");
  }
  const nextSource = upsertCodexProfileInToml(readCodexConfigSource(configPath), {
    id: command.profile,
    providerId: command.provider,
    model: command.model,
    reviewModel: command.reviewModel,
    modelReasoningEffort: command.reasoning,
    planModeReasoningEffort: command.planReasoning,
    modelReasoningSummary: command.reasoningSummary,
    modelVerbosity: command.verbosity,
    serviceTier: command.serviceTier,
    webSearch: command.webSearch,
    modelAutoCompactTokenLimit: command.compactLimit
  });
  const backupPath = writeCodexConfigWithBackup(
    configPath,
    nextSource,
    command.backupRoot
  );
  return createPanelDataForPath(configPath, true, {
    savedProfile: true,
    backupPath,
    backupRoot: command.backupRoot
  });
}

function saveRuntime(command: CodeAgentSwitchCommand): ReturnType<typeof createPanelData> {
  const configPath = command.configPath ?? getDefaultCodexConfigPath();
  const nextSource = updateCodexRuntimeConfigInToml(readCodexConfigSource(configPath), {
    approvalPolicy: command.approvalPolicy,
    sandboxMode: command.sandboxMode,
    defaultPermissions: command.defaultPermissions,
    networkAccess: command.networkAccess,
    windowsSandbox: command.windowsSandbox,
    windowsSandboxPrivateDesktop: command.windowsSandboxPrivateDesktop
  });
  const backupPath = writeCodexConfigWithBackup(
    configPath,
    nextSource,
    command.backupRoot
  );
  return createPanelDataForPath(configPath, true, {
    savedRuntime: true,
    backupPath,
    backupRoot: command.backupRoot
  });
}

function deleteProfile(command: CodeAgentSwitchCommand): ReturnType<typeof createPanelData> {
  const configPath = command.configPath ?? getDefaultCodexConfigPath();
  if (!command.profile) {
    throw new Error("请选择要删除的 Profile");
  }
  const nextSource = deleteCodexProfileInToml(
    readCodexConfigSource(configPath),
    command.profile
  );
  const backupPath = writeCodexConfigWithBackup(
    configPath,
    nextSource,
    command.backupRoot
  );
  return createPanelDataForPath(configPath, true, {
    deletedProfile: true,
    backupPath,
    backupRoot: command.backupRoot
  });
}

function getCodeAgentSwitchMessage(action: CodeAgentSwitchAction): string {
  switch (action) {
    case "preview":
      return "已生成 CodeAgent Switch 预览";
    case "apply":
      return "已备份并写入 Codex 配置";
    case "restore":
      return "已从备份恢复 Codex 配置";
    case "backups":
      return "已刷新 CodeAgent Switch 备份列表";
    case "save-provider":
      return "已保存 Codex Provider 配置";
    case "set-provider-key":
      return "已写入用户级系统环境变量";
    case "delete-provider":
      return "已删除 Codex Provider 配置";
    case "save-profile":
      return "已保存 Codex Profile 配置";
    case "save-runtime":
      return "已保存 Codex 运行权限配置";
    case "delete-profile":
      return "已删除 Codex Profile 配置";
    default:
      return "已打开 CodeAgent Switch";
  }
}

export const codeAgentSwitchPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "CodeAgent Switch",
  createCatalogItems() {
    return [createCatalogItem()];
  },
  getQueryItems(query) {
    if (!matchesAlias(query)) {
      return [];
    }
    return [createCatalogItem()];
  },
  execute(optionsText, context): ExecuteResult {
    const command = parseCommand(optionsText);
    try {
      const data =
        command.action === "preview"
          ? createProfilePreviewData(command)
          : command.action === "apply"
            ? applyProfileSwitch(command)
            : command.action === "restore"
              ? restoreBackup(command)
            : command.action === "save-provider"
              ? saveProvider(command)
              : command.action === "set-provider-key"
                ? setProviderKey(command)
              : command.action === "delete-provider"
                  ? deleteProvider(command)
                  : command.action === "save-profile"
                    ? saveProfile(command)
                    : command.action === "save-runtime"
                      ? saveRuntime(command)
                    : command.action === "delete-profile"
                      ? deleteProfile(command)
              : command.action === "backups"
                ? createPanelDataForPath(
                    command.configPath ?? getDefaultCodexConfigPath(),
                    true,
                    { backupRoot: command.backupRoot }
                  )
            : command.configPath
              ? createPanelDataForPath(command.configPath, true)
              : createPanelData();
      sendCodeAgentSwitchPanel(context, data);

      return {
        ok: true,
        keepOpen: true,
        data,
        message:
          getCodeAgentSwitchMessage(command.action)
      };
    } catch (error) {
      const configPath = command.configPath ?? getDefaultCodexConfigPath();
      const data = createPanelDataForPath(configPath, true, {
        error: error instanceof Error ? error.message : String(error)
      });
      sendCodeAgentSwitchPanel(context, data);
      return {
        ok: false,
        keepOpen: true,
        data,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }
};
