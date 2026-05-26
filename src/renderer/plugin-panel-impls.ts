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
  config?: {
    profile?: string;
    modelProvider?: string;
    model?: string;
    reviewModel?: string;
    modelReasoningEffort?: string;
    modelAutoCompactTokenLimit?: number;
    approvalPolicy?: string;
    sandboxMode?: string;
    defaultPermissions?: string;
    networkAccess?: string;
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

  const activeProviderId = active.activeProviderId ?? codeAgentSwitchData.config?.modelProvider;
  if (activeProviderId && providers.some((provider) => provider.id === activeProviderId)) {
    codeAgentSwitchSelectedKind = "provider";
    codeAgentSwitchSelectedId = activeProviderId;
    return;
  }

  if (profiles[0]) {
    codeAgentSwitchSelectedKind = "profile";
    codeAgentSwitchSelectedId = profiles[0].id;
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
  renderList();
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

function createCodeAgentSwitchProviderEditor(provider?: CodeAgentSwitchProviderView): HTMLDivElement {
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
  actions.append(saveButton, applyKeyButton, copyKeyButton);
  editor.append(grid, keySection, actions);
  return editor;
}

function createCodeAgentSwitchProfileEditor(
  profile?: CodeAgentSwitchProfileView,
  providers: CodeAgentSwitchProviderView[] = []
): HTMLDivElement {
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
    createCodeAgentSwitchInput("ID", "profileId", profile?.id, "daily"),
    createCodeAgentSwitchSelect("Provider", "profileProvider", profile?.providerId, providerOptions),
    createCodeAgentSwitchInput("模型", "profileModel", profile?.model, "gpt-5.5"),
    createCodeAgentSwitchInput("Review", "profileReviewModel", profile?.reviewModel, "gpt-5.5"),
    createCodeAgentSwitchSelect("Reasoning", "profileReasoning", profile?.modelReasoningEffort, [
      { value: "", label: "默认" },
      { value: "low", label: "low" },
      { value: "medium", label: "medium" },
      { value: "high", label: "high" },
      { value: "xhigh", label: "xhigh" }
    ]),
    createCodeAgentSwitchSelect(
      "Plan reasoning",
      "profilePlanReasoning",
      profile?.planModeReasoningEffort,
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
      profile?.modelReasoningSummary,
      [
        { value: "", label: "默认" },
        { value: "auto", label: "auto" },
        { value: "concise", label: "concise" },
        { value: "detailed", label: "detailed" },
        { value: "none", label: "none" }
      ]
    ),
    createCodeAgentSwitchSelect("Verbosity", "profileVerbosity", profile?.modelVerbosity, [
      { value: "", label: "默认" },
      { value: "low", label: "low" },
      { value: "medium", label: "medium" },
      { value: "high", label: "high" }
    ]),
    createCodeAgentSwitchSelect("Service tier", "profileServiceTier", profile?.serviceTier, [
      { value: "", label: "默认" },
      { value: "auto", label: "auto" },
      { value: "flex", label: "flex" },
      { value: "fast", label: "fast" }
    ]),
    createCodeAgentSwitchSelect("Web search", "profileWebSearch", profile?.webSearch, [
      { value: "", label: "默认" },
      { value: "disabled", label: "disabled" },
      { value: "cached", label: "cached" },
      { value: "live", label: "live" }
    ]),
    createCodeAgentSwitchInput(
      "Compact token",
      "profileCompactLimit",
      profile?.modelAutoCompactTokenLimit,
      "350000",
      "number"
    )
  );

  const actions = document.createElement("div");
  actions.className = "codeagent-switch-inline-actions";
  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "settings-btn settings-btn-primary";
  saveButton.textContent = profile ? "保存 Profile" : "新增 Profile";
  saveButton.addEventListener("click", () => {
    void executeCodeAgentSwitchSaveProfile(editor);
  });
  actions.appendChild(saveButton);
  editor.append(grid, actions);
  return editor;
}

function createCodeAgentSwitchRuntimeEditor(
  config: NonNullable<typeof codeAgentSwitchData.config>
): HTMLElement {
  const runtime = createCodeAgentSwitchDetailSection(
    "运行权限",
    "对应 Codex 官方 config.toml 的 approval、sandbox、network 和 Windows 沙箱字段。",
    "codeagent-switch-runtime"
  );
  const editor = document.createElement("div");
  editor.className = "codeagent-switch-editor codeagent-switch-runtime-editor";
  const grid = document.createElement("div");
  grid.className = "codeagent-switch-editor-grid";
  grid.append(
    createCodeAgentSwitchSelect("approval_policy", "runtimeApprovalPolicy", config.approvalPolicy, [
      { value: "", label: "默认" },
      { value: "untrusted", label: "untrusted" },
      { value: "on-failure", label: "on-failure" },
      { value: "on-request", label: "on-request" },
      { value: "never", label: "never" }
    ]),
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
    createCodeAgentSwitchSelect("network_access", "runtimeNetworkAccess", config.networkAccess, [
      { value: "", label: "默认" },
      { value: "enabled", label: "enabled" },
      { value: "restricted", label: "restricted" },
      { value: "disabled", label: "disabled" }
    ]),
    createCodeAgentSwitchSelect("windows.sandbox", "runtimeWindowsSandbox", config.windows?.sandbox, [
      { value: "", label: "默认" },
      { value: "read-only", label: "read-only" },
      { value: "workspace-write", label: "workspace-write" },
      { value: "elevated", label: "elevated" }
    ]),
    createCodeAgentSwitchSelect(
      "windows.private_desktop",
      "runtimeWindowsSandboxPrivateDesktop",
      config.windows?.sandboxPrivateDesktop === true ? "true" : "",
      [
        { value: "", label: "默认" },
        { value: "true", label: "启用" }
      ]
    )
  );
  const actions = document.createElement("div");
  actions.className = "codeagent-switch-inline-actions";
  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "settings-btn settings-btn-primary";
  saveButton.textContent = "保存运行权限";
  saveButton.addEventListener("click", () => {
    void executeCodeAgentSwitchSaveRuntime(editor);
  });
  actions.appendChild(saveButton);
  editor.append(grid, actions);
  runtime.appendChild(editor);
  return runtime;
}

function getCodeAgentSwitchProviderSummary(provider: CodeAgentSwitchProviderView): string {
  const auth = provider.envKey || (provider.requiresOpenAiAuth ? "OpenAI 登录态" : "未配置认证");
  return `${provider.id} · ${provider.baseUrl || "未配置 base_url"} · ${auth}`;
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
  config: NonNullable<typeof codeAgentSwitchData.config>
): HTMLElement {
  const effective = getCodeAgentSwitchEffectiveModelInfo(active, config);
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
      : "未匹配到 Profile";
  titleWrap.append(title, subtitle);
  head.append(titleWrap, createCodeAgentSwitchStateBadge("生效中", "active"));

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
  providers: CodeAgentSwitchProviderView[],
  profiles: CodeAgentSwitchProfileView[],
  active: NonNullable<typeof codeAgentSwitchData.active>,
  config: NonNullable<typeof codeAgentSwitchData.config>
): HTMLDivElement {
  const listPanel = document.createElement("div");
  listPanel.className = "codeagent-switch-list-panel";
  listPanel.appendChild(createCodeAgentSwitchCurrentCard(active, config));

  const providerSection = document.createElement("section");
  providerSection.className = "codeagent-switch-provider-strip";
  const providerHead = document.createElement("div");
  providerHead.className = "codeagent-switch-section-head";
  const providerTitle = document.createElement("h3");
  providerTitle.textContent = "Provider";
  const addProviderButton = document.createElement("button");
  addProviderButton.type = "button";
  addProviderButton.className = "settings-btn settings-btn-secondary";
  addProviderButton.textContent = "新增";
  addProviderButton.addEventListener("click", () => {
    selectCodeAgentSwitchDetail("provider", "");
  });
  providerHead.append(providerTitle, addProviderButton);
  providerSection.appendChild(providerHead);

  const providerItems = document.createElement("div");
  providerItems.className = "codeagent-switch-provider-strip-items";
  if (providers.length === 0) {
    const empty = document.createElement("div");
    empty.className = "codeagent-switch-list-item";
    empty.textContent = "当前配置还没有 Provider";
    providerItems.appendChild(empty);
  }

  for (const provider of providers) {
    const isActive = provider.id === active.activeProviderId || provider.id === config.modelProvider;
    const isSelected =
      codeAgentSwitchSelectedKind === "provider" && codeAgentSwitchSelectedId === provider.id;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "codeagent-switch-provider-chip";
    button.dataset.active = String(isActive);
    button.dataset.selected = String(isSelected);
    button.addEventListener("click", () => {
      selectCodeAgentSwitchDetail("provider", provider.id);
    });
    const titleLine = document.createElement("span");
    titleLine.className = "codeagent-switch-provider-chip-title";
    titleLine.textContent = provider.name || provider.id;
    const detail = document.createElement("span");
    detail.className = "codeagent-switch-provider-chip-detail";
    detail.textContent = provider.envKey || (provider.requiresOpenAiAuth ? "OpenAI 登录态" : provider.id);
    button.append(titleLine, detail);
    if (isSelected) {
      button.appendChild(createCodeAgentSwitchStateBadge("选中", "selected"));
    }
    if (isActive) {
      button.appendChild(createCodeAgentSwitchStateBadge("当前", "active"));
    }
    providerItems.appendChild(button);
  }
  providerSection.appendChild(providerItems);

  const profileSection = document.createElement("section");
  profileSection.className = "codeagent-switch-section codeagent-switch-profile-list";
  const profileHead = document.createElement("div");
  profileHead.className = "codeagent-switch-section-head";
  const profileTitle = document.createElement("h3");
  profileTitle.textContent = "Profiles";
  const addProfileButton = document.createElement("button");
  addProfileButton.type = "button";
  addProfileButton.className = "settings-btn settings-btn-secondary";
  addProfileButton.textContent = "新增";
  addProfileButton.addEventListener("click", () => {
    selectCodeAgentSwitchDetail("profile", "");
  });
  profileHead.append(profileTitle, addProfileButton);
  profileSection.appendChild(profileHead);

  const profileItems = document.createElement("div");
  profileItems.className = "codeagent-switch-profile-list-items";
  if (profiles.length === 0) {
    const empty = document.createElement("div");
    empty.className = "codeagent-switch-list-item";
    empty.textContent = "当前配置还没有 Profile";
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
      profile.id,
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

  listPanel.append(providerSection, profileSection);
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
  const isProviderDetail = codeAgentSwitchSelectedKind === "provider";

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
      : selectedProfile
        ? selectedProfile.id
        : "新增 Profile";
  const subtitle = document.createElement("div");
  subtitle.className = "codeagent-switch-list-detail";
  subtitle.textContent = isProviderDetail
    ? selectedProvider
      ? getCodeAgentSwitchProviderSummary(selectedProvider)
      : "配置 Codex 访问的中转、官方登录态或兼容端点"
    : selectedProfile
      ? getCodeAgentSwitchProfileSummary(selectedProfile)
      : "组合 Provider、模型、reasoning 和 compact 限制";
  titleWrap.append(title, subtitle);

  const pills = document.createElement("div");
  pills.className = "codeagent-switch-detail-pills";
  pills.appendChild(createCodeAgentSwitchPill("已选中", "muted"));
  let selectedProfileIsActive = false;
  if (isProviderDetail) {
    const providerId = selectedProvider?.id ?? "";
    if (providerId && (providerId === active.activeProviderId || providerId === config.modelProvider)) {
      pills.appendChild(createCodeAgentSwitchPill("当前 Provider", "active"));
    }
  } else if (selectedProfile) {
    const match = getCodeAgentSwitchProfileMatch(selectedProfile.id);
    selectedProfileIsActive = match?.level === "exact";
    if (match?.level === "exact") {
      pills.appendChild(createCodeAgentSwitchPill("当前 Profile", "active"));
    } else if (match?.level === "partial") {
      pills.appendChild(createCodeAgentSwitchPill("部分匹配", "muted"));
    }
  }
  const heroAside = document.createElement("div");
  heroAside.className = "codeagent-switch-detail-hero-aside";
  heroAside.appendChild(pills);
  if (!isProviderDetail && selectedProfile) {
    const heroActions = document.createElement("div");
    heroActions.className = "codeagent-switch-detail-hero-actions";
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
            { label: "ID", value: selectedProfile?.id ?? codeAgentSwitchSelectedId },
            { label: "Provider", value: selectedProfile?.providerId },
            { label: "Model", value: selectedProfile?.model },
            { label: "Reasoning", value: selectedProfile?.modelReasoningEffort }
          ]
    )
  );
  detailPanel.appendChild(hero);

  if (isProviderDetail) {
    const providerConfig = createCodeAgentSwitchDetailSection(
      "Provider 配置",
      "管理 base_url、wire_api、认证方式、headers、query 和 env_key 名称。"
    );
    providerConfig.appendChild(createCodeAgentSwitchProviderEditor(selectedProvider));
    detailPanel.appendChild(providerConfig);
    detailPanel.append(
      createCodeAgentSwitchRuntimeEditor(config),
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
    "Profile 配置",
    "选择 Provider，并配置主模型、review 模型、reasoning、summary、verbosity 和 compact。"
  );
  profileConfig.appendChild(createCodeAgentSwitchProfileEditor(selectedProfile, providers));
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
    createCodeAgentSwitchPreviewSection(),
    createCodeAgentSwitchDiagnosticsSection(),
    createCodeAgentSwitchBackupsSection(),
    createCodeAgentSwitchCommandsSection()
  );
  if (selectedProfile) {
    const danger = createCodeAgentSwitchDetailSection(
      "危险区",
      "删除 Profile 只移除预设，不会清理真实环境变量。",
      "codeagent-switch-danger-zone"
    );
    const actions = document.createElement("div");
    actions.className = "codeagent-switch-inline-actions codeagent-switch-detail-actions";
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "settings-btn settings-btn-secondary";
    deleteButton.textContent = "删除 Profile";
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
  subtitle.textContent = "Codex 配置管理，Provider / Profile 可编辑，Claude 和 Gemini 适配器规划中";
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
  status.dataset.state =
    codeAgentSwitchData.error
      ? "error"
      : (codeAgentSwitchData.diagnostics ?? []).some((item) => item.level === "error")
        ? "error"
        : (codeAgentSwitchData.diagnostics ?? []).some((item) => item.level === "warning")
          ? "warning"
          : "ok";
  status.textContent = codeAgentSwitchData.error
    ? `执行失败：${codeAgentSwitchData.error}`
    : codeAgentSwitchData.savedProvider
      ? "已保存 Provider，写入前已备份当前配置。"
      : codeAgentSwitchData.setProviderKey
        ? `已写入用户级系统环境变量：${codeAgentSwitchData.keyAppliedEnvKey ?? ""}`
      : codeAgentSwitchData.savedRuntime
        ? "已保存运行权限，写入前已备份当前配置。"
      : codeAgentSwitchData.savedProfile
        ? "已保存 Profile，写入前已备份当前配置。"
        : codeAgentSwitchData.deletedProvider
          ? "已删除 Provider，写入前已备份当前配置。"
          : codeAgentSwitchData.deletedProfile
            ? "已删除 Profile，写入前已备份当前配置。"
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
      "当前 Profile",
      active.activeProfileId
        ? `${active.activeProfileId} · exact`
        : active.activeProfileMatch === "partial"
          ? `partial · ${(active.matchedFields ?? []).join(", ")}`
          : ""
    ),
    createCodeAgentSwitchMetric("Provider 数量", String(providers.length)),
    createCodeAgentSwitchMetric("Profile 数量", String(profiles.length))
  );

  const shell = document.createElement("div");
  shell.className = "codeagent-switch-shell codeagent-switch-master-detail";
  shell.append(
    createCodeAgentSwitchToolSidebar(),
    createCodeAgentSwitchListPanel(providers, profiles, active, config),
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
  const cronTemplates = getWebtoolsCronTemplates();

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
  cronTemplates.forEach((template) => {
    const button = document.createElement("button");
    button.type = "button";
    button.value = template.key;
    button.className =
      template.key === webtoolsCronTemplateKey
        ? "settings-btn webtools-cron-template-chip is-active"
        : "settings-btn webtools-cron-template-chip";
    button.setAttribute("data-webtools-cron-template", template.key);
    button.textContent = template.summary;
    button.addEventListener("click", () => {
      const expressionNode = form.elements.namedItem("webtoolsCronExpression");
      if (expressionNode instanceof HTMLInputElement) {
        expressionNode.value = template.expression;
      }
      void executeWebtoolsCronAction("parse", template.expression, {
        render: false,
        form
      });
    });
    templateGrid.appendChild(button);
  });
  templatesSection.append(templatesHead, templateGrid);

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
  scheduleWebtoolsCronAutoParse(form, true);
}

type CodeAgentSwitchUiAction =
  | "read"
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
  const escapedKey = envKey.replace(/'/g, "''");
  const escapedValue = apiKey.replace(/'/g, "''");
  const text = `$env:${envKey}='${escapedValue}'\n[Environment]::SetEnvironmentVariable('${escapedKey}', '${escapedValue}', 'User')`;
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
  await executeCodeAgentSwitchAction("save-runtime", undefined, undefined, {
    approvalPolicy: getCodeAgentSwitchFormValue(container, "runtimeApprovalPolicy"),
    sandboxMode: getCodeAgentSwitchFormValue(container, "runtimeSandboxMode"),
    defaultPermissions: getCodeAgentSwitchFormValue(container, "runtimeDefaultPermissions"),
    networkAccess: getCodeAgentSwitchFormValue(container, "runtimeNetworkAccess"),
    windowsSandbox: getCodeAgentSwitchFormValue(container, "runtimeWindowsSandbox"),
    windowsSandboxPrivateDesktop:
      getCodeAgentSwitchFormValue(container, "runtimeWindowsSandboxPrivateDesktop") === "true"
        ? true
        : undefined
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
  { key: "all", label: "All" },
  { key: "recent", label: "Recent" },
  { key: "favorites", label: "Favorites" },
  { key: "pinned", label: "Pinned" },
  { key: "text", label: "Text" },
  { key: "image", label: "Images" },
  { key: "files", label: "Files" },
  { key: "screenshots", label: "Screenshots" }
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
  renderList();
}

function clearClipboardWorkbenchSelection(): void {
  if (clipboardWorkbenchSelectedItemIds.size === 0) {
    return;
  }
  clipboardWorkbenchSelectedItemIds.clear();
  renderList();
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
    return "Unknown";
  }
  return new Date(value).toLocaleString();
}

function getClipboardWorkbenchKindLabel(kind: ClipboardWorkbenchPanelKind): string {
  switch (kind) {
    case "image":
      return "Image";
    case "files":
      return "Files";
    default:
      return "Text";
  }
}

function getClipboardWorkbenchSourceLabel(
  source: ClipboardWorkbenchPanelSource
): string {
  switch (source) {
    case "manual":
      return "Manual";
    case "screenshot":
      return "Screenshot";
    default:
      return "Auto";
  }
}

function getClipboardWorkbenchItemPreview(
  item: ClipboardWorkbenchPanelItemView
): string {
  if (item.kind === "files") {
    const count = item.filePaths?.length ?? 0;
    return count > 0 ? `${count} file path${count === 1 ? "" : "s"}` : item.summary;
  }
  if (item.kind === "image") {
    return item.assetUrl ? "Image preview available" : item.summary;
  }
  return item.previewText ?? item.summary;
}

async function executeClipboardWorkbenchAction(
  action: string,
  actionParams: Record<string, string | string[]> = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("Launcher bridge is unavailable.");
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
    title: "Clipboard Workbench",
    subtitle: "panel action",
    target: `command:plugin:${CLIPBOARD_WORKBENCH_PLUGIN_ID}?${params.toString()}`,
    keywords: ["plugin", "clipboard", "workbench"]
  });

  if (!result.ok) {
    setStatus(result.message ?? "Clipboard Workbench action failed.");
    return;
  }

  if (activePluginPanel) {
    activePluginPanel.data = result.data ?? activePluginPanel.data;
    window.__LL_PANEL_IMPLS__?.applyClipboardWorkbenchPanelPayload(activePluginPanel);
    if (action === "save-manual-text") {
      const manualText = actionParams.manualText;
      if (typeof manualText === "string" && manualText.trim()) {
        clipboardWorkbenchManualTextDraft = "";
      }
    }
    renderList();
  }

  setStatus(result.message ?? "Clipboard Workbench updated.");
}

function syncWebtoolsImagePromptSmartTemplateSelection(container: HTMLElement): void {
  container
    .querySelectorAll<HTMLButtonElement>("[data-webtools-image-prompt-smart-template]")
    .forEach((button) => {
      button.dataset.selected = String(button.value === webtoolsImagePromptSmartTemplateId);
    });
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

const WEBTOOLS_CRON_TEMPLATES: ReadonlyArray<{
  key: string;
  expression: string;
  summary: string;
}> = [
  { key: "weekday-9am", expression: "0 9 * * 1-5", summary: "工作日 09:00 执行" },
  { key: "daily-noon", expression: "0 12 * * *", summary: "每天 12:00 执行" },
  { key: "daily-midnight", expression: "0 0 * * *", summary: "每天 00:00 执行" },
  { key: "hourly-top", expression: "0 * * * *", summary: "每小时整点执行" },
  { key: "every-minute", expression: "* * * * *", summary: "每分钟执行" }
];

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

function getWebtoolsCronTemplates(): ReadonlyArray<{
  key: string;
  expression: string;
  summary: string;
}> {
  return WEBTOOLS_CRON_TEMPLATES;
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
      const active = button.dataset.webtoolsCronTemplate === webtoolsCronTemplateKey;
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


window.__LL_PANEL_IMPLS__ = {
  applyHardwareInspectorPanelPayload(panel: ActivePluginPanelState): void {
    const data = toRecord(panel.data);
    hardwareInspectorSnapshot = getHardwareInspectorSnapshotFromData(data);
    hardwareInspectorLoading = data?.loading === true;
    hardwareInspectorInfo = typeof data?.info === "string" ? data.info : "";
    hardwareInspectorError = typeof data?.error === "string" ? data.error : "";
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
      form.appendChild(overview);

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
      form.appendChild(compare);

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
      form.appendChild(meta);

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
      form.appendChild(cpuSection.section);

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
      form.appendChild(boardSection.section);

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
      form.appendChild(memorySection.section);

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
      form.appendChild(gpuSection.section);

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
      form.appendChild(diskSection.section);
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
    const selectedItemIds = selectedItems.map((item) => item.id);
    const canMergeSelectedItems =
      selectedItems.length > 0 &&
      (selectedItems.every((item) => item.kind === "text") ||
        selectedItems.every((item) => item.kind === "files"));

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
    title.textContent = activePluginPanel?.title || "Clipboard Workbench";
    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle ||
      "Search and inspect captured clipboard items across text, images, and file lists.";
    toolbarHead.append(title, description);

    const toolbarMeta = document.createElement("div");
    toolbarMeta.className = "clipboard-workbench-toolbar-meta";
    toolbarMeta.append(
      createClipboardWorkbenchBadge(
        clipboardWorkbenchPanelData.settings.autoCollect
          ? "Auto collect on"
          : "Auto collect paused",
        clipboardWorkbenchPanelData.settings.autoCollect ? "success" : "warning"
      ),
      createClipboardWorkbenchBadge(
        clipboardWorkbenchPanelData.settings.sensitiveMode
          ? "Sensitive mode"
          : "Sensitive mode off",
        clipboardWorkbenchPanelData.settings.sensitiveMode ? "warning" : "neutral"
      ),
      createClipboardWorkbenchBadge(
        `Limit ${clipboardWorkbenchPanelData.settings.maxItems}`,
        "accent"
      )
    );

    const toolbarStats = document.createElement("div");
    toolbarStats.className = "clipboard-workbench-toolbar-stats";
    [
      {
        label: "Items",
        value: String(clipboardWorkbenchPanelData.stats.totalItems)
      },
      {
        label: "Bytes",
        value: formatClipboardWorkbenchBytes(
          clipboardWorkbenchPanelData.stats.totalBytes
        )
      },
      {
        label: "Search",
        value: clipboardWorkbenchPanelData.query.search.trim() || "None"
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
    searchInput.placeholder = "Search summaries, notes, tags, and file paths";
    searchInput.value = clipboardWorkbenchSearchDraft;
    searchInput.addEventListener("input", () => {
      clipboardWorkbenchSearchDraft = searchInput.value;
    });
    const searchButton = document.createElement("button");
    searchButton.type = "submit";
    searchButton.className = "settings-btn settings-btn-primary";
    searchButton.textContent = "Search";
    const clearSearchButton = document.createElement("button");
    clearSearchButton.type = "button";
    clearSearchButton.className = "settings-btn settings-btn-secondary";
    clearSearchButton.textContent = "Clear";
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
    refreshButton.textContent = "Refresh";
    refreshButton.addEventListener("click", () => {
      void executeClipboardWorkbenchAction(
        "refresh",
        buildClipboardWorkbenchQueryParams()
      );
    });

    const saveCurrentButton = document.createElement("button");
    saveCurrentButton.type = "button";
    saveCurrentButton.className = "settings-btn settings-btn-secondary";
    saveCurrentButton.textContent = "Save clipboard";
    saveCurrentButton.addEventListener("click", () => {
      void executeClipboardWorkbenchAction("save-current");
    });

    const toggleCollectButton = document.createElement("button");
    toggleCollectButton.type = "button";
    toggleCollectButton.className = "settings-btn settings-btn-secondary";
    toggleCollectButton.textContent = clipboardWorkbenchPanelData.settings.autoCollect
      ? "Pause collect"
      : "Resume collect";
    toggleCollectButton.addEventListener("click", () => {
      void executeClipboardWorkbenchAction("toggle-collect");
    });

    const toggleSensitiveButton = document.createElement("button");
    toggleSensitiveButton.type = "button";
    toggleSensitiveButton.className = "settings-btn settings-btn-secondary";
    toggleSensitiveButton.textContent = clipboardWorkbenchPanelData.settings.sensitiveMode
      ? "Disable sensitive"
      : "Enable sensitive";
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
    composerTitle.textContent = "Manual text draft";

    const manualTextInput = document.createElement("textarea");
    manualTextInput.className = "settings-textarea clipboard-workbench-manual-text";
    manualTextInput.name = "clipboardWorkbenchManualText";
    manualTextInput.placeholder = "Type or paste text here, then save it into the workbench.";
    manualTextInput.value = clipboardWorkbenchManualTextDraft;

    const composerRow = document.createElement("div");
    composerRow.className = "clipboard-workbench-composer-row";
    const saveManualButton = document.createElement("button");
    saveManualButton.type = "button";
    saveManualButton.className = "settings-btn settings-btn-primary";
    saveManualButton.dataset.clipboardWorkbenchSaveManual = "1";
    saveManualButton.textContent = "Save draft";
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
    railTitle.textContent = "Views";
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
    groupTitle.textContent = "Groups";
    rail.appendChild(groupTitle);

    const groupList = document.createElement("div");
    groupList.className = "clipboard-workbench-group-list";
    if (clipboardWorkbenchPanelData.groups.length === 0) {
      const empty = document.createElement("div");
      empty.className = "clipboard-workbench-empty";
      empty.textContent = "No groups yet.";
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
    listTitle.textContent = "Items";
    const listMeta = document.createElement("div");
    listMeta.className = "clipboard-workbench-list-meta";
    listMeta.textContent =
      selectedItems.length > 0
        ? `${clipboardWorkbenchPanelData.items.length} visible - ${selectedItems.length} selected`
        : `${clipboardWorkbenchPanelData.items.length} visible`;
    listHeader.append(listTitle, listMeta);
    listSection.appendChild(listHeader);

    const itemList = document.createElement("div");
    itemList.className = "clipboard-workbench-item-list";
    if (clipboardWorkbenchPanelData.items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "clipboard-workbench-empty";
      empty.textContent = "No clipboard items are available yet.";
      itemList.appendChild(empty);
    } else {
      clipboardWorkbenchPanelData.items.forEach((item) => {
        const selected = isClipboardWorkbenchItemSelected(item.id);

        const card = document.createElement("article");
        card.className = "clipboard-workbench-item";
        card.dataset.active = String(item.id === clipboardWorkbenchActiveItemId);
        card.dataset.marked = String(selected);
        card.dataset.clipboardWorkbenchItemId = item.id;

        const itemTop = document.createElement("div");
        itemTop.className = "clipboard-workbench-item-top";
        const itemSelectHint = document.createElement("div");
        itemSelectHint.className = "clipboard-workbench-item-select-hint";
        itemSelectHint.textContent = selected ? "Selected for batch" : "Add to batch";
        const toggleButton = document.createElement("button");
        toggleButton.type = "button";
        toggleButton.className = "clipboard-workbench-item-toggle";
        toggleButton.dataset.clipboardWorkbenchItemToggle = item.id;
        toggleButton.dataset.selected = String(selected);
        toggleButton.textContent = selected ? "Selected" : "Select";
        toggleButton.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          toggleClipboardWorkbenchItemSelection(item.id);
        });
        itemTop.append(itemSelectHint, toggleButton);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "clipboard-workbench-item-main";
        button.dataset.selected = String(item.id === clipboardWorkbenchActiveItemId);
        button.addEventListener("click", () => {
          clipboardWorkbenchActiveItemId = item.id;
          renderList();
        });

        if (item.kind === "image" && item.assetUrl) {
          const thumb = document.createElement("img");
          thumb.className = "clipboard-workbench-item-thumb";
          thumb.src = item.assetUrl;
          thumb.alt = item.summary;
          thumb.loading = "lazy";
          card.appendChild(thumb);
        }

        const itemHead = document.createElement("div");
        itemHead.className = "clipboard-workbench-item-head";
        const itemTitle = document.createElement("div");
        itemTitle.className = "clipboard-workbench-item-title";
        itemTitle.textContent = item.title || item.summary;
        const badgeRow = document.createElement("div");
        badgeRow.className = "clipboard-workbench-item-badges";
        badgeRow.append(
          createClipboardWorkbenchBadge(getClipboardWorkbenchKindLabel(item.kind), "accent"),
          createClipboardWorkbenchBadge(getClipboardWorkbenchSourceLabel(item.source))
        );
        if (item.favorite) {
          badgeRow.appendChild(createClipboardWorkbenchBadge("Favorite", "success"));
        }
        if (item.pinned) {
          badgeRow.appendChild(createClipboardWorkbenchBadge("Pinned", "accent"));
        }
        if (item.sensitive) {
          badgeRow.appendChild(createClipboardWorkbenchBadge("Sensitive", "warning"));
        }
        itemHead.append(itemTitle, badgeRow);

        const itemSummary = document.createElement("div");
        itemSummary.className = "clipboard-workbench-item-summary";
        itemSummary.textContent = item.summary;

        const itemPreview = document.createElement("div");
        itemPreview.className = "clipboard-workbench-item-preview";
        itemPreview.textContent = getClipboardWorkbenchItemPreview(item);

        const itemFoot = document.createElement("div");
        itemFoot.className = "clipboard-workbench-item-foot";
        itemFoot.textContent = formatClipboardWorkbenchTime(item.updatedAt);

        button.append(itemHead, itemSummary, itemPreview, itemFoot);
        card.append(itemTop, button);
        itemList.appendChild(card);
      });
    }
    listSection.appendChild(itemList);

    if (selectedItems.length > 0) {
      const bulkBar = document.createElement("div");
      bulkBar.className = "clipboard-workbench-bulk-bar";

      const bulkMeta = document.createElement("div");
      bulkMeta.className = "clipboard-workbench-bulk-meta";
      bulkMeta.textContent = `${selectedItems.length} selected`;

      const bulkActions = document.createElement("div");
      bulkActions.className = "clipboard-workbench-bulk-actions";

      const sequentialButton = document.createElement("button");
      sequentialButton.type = "button";
      sequentialButton.className = "settings-btn settings-btn-primary";
      sequentialButton.dataset.clipboardWorkbenchBulkAction = "sequential";
      sequentialButton.textContent = "Paste sequentially";
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
      mergeButton.textContent = "Merge once";
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
      clearSelectionButton.textContent = "Clear selection";
      clearSelectionButton.addEventListener("click", () => {
        clearClipboardWorkbenchSelection();
      });

      bulkActions.append(
        sequentialButton,
        mergeButton,
        clearSelectionButton
      );
      bulkBar.append(bulkMeta, bulkActions);

      if (!canMergeSelectedItems) {
        const bulkNote = document.createElement("div");
        bulkNote.className = "clipboard-workbench-note";
        bulkNote.textContent =
          "Merge once currently supports text-only or file-list-only selections.";
        bulkBar.appendChild(bulkNote);
      }

      listSection.appendChild(bulkBar);
    }

    const detail = document.createElement("aside");
    detail.className = "clipboard-workbench-detail";
    const detailTitle = document.createElement("div");
    detailTitle.className = "clipboard-workbench-section-title";
    detailTitle.textContent = "Details";
    detail.appendChild(detailTitle);

    const activeItem = getClipboardWorkbenchActiveItem();
    if (!activeItem) {
      const empty = document.createElement("div");
      empty.className = "clipboard-workbench-empty";
      empty.textContent = "Select an item to inspect its detail view.";
      detail.appendChild(empty);
    } else {
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
        createClipboardWorkbenchBadge(
          clipboardWorkbenchPanelData.query.scope || "all"
        )
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
        placeholder.textContent = "No preview image is available.";
        preview.appendChild(placeholder);
      }
      detail.appendChild(preview);

      const metaGrid = document.createElement("div");
      metaGrid.className = "clipboard-workbench-detail-grid";
      [
        { label: "Summary", value: activeItem.summary },
        { label: "Updated", value: formatClipboardWorkbenchTime(activeItem.updatedAt) },
        { label: "Created", value: formatClipboardWorkbenchTime(activeItem.createdAt) },
        {
          label: "Tags",
          value: activeItem.tags.length > 0 ? activeItem.tags.join(", ") : "None"
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
      note.textContent = activeItem.note || "No note saved for this item yet.";
      detail.appendChild(note);

      const detailActions = document.createElement("div");
      detailActions.className = "clipboard-workbench-detail-actions";

      const restoreButton = document.createElement("button");
      restoreButton.type = "button";
      restoreButton.className = "settings-btn settings-btn-primary";
      restoreButton.textContent = "Restore to clipboard";
      restoreButton.addEventListener("click", () => {
        void executeClipboardWorkbenchAction("restore-item", {
          itemId: activeItem.id
        });
      });

      const batchButton = document.createElement("button");
      batchButton.type = "button";
      batchButton.className = "settings-btn settings-btn-secondary";
      batchButton.textContent = isClipboardWorkbenchItemSelected(activeItem.id)
        ? "Remove from batch"
        : "Add to batch";
      batchButton.addEventListener("click", () => {
        toggleClipboardWorkbenchItemSelection(activeItem.id);
      });

      detailActions.append(restoreButton, batchButton);
      detail.appendChild(detailActions);
    }

    shell.append(toolbar, rail, listSection, detail);
    form.appendChild(shell);
    panel.appendChild(form);
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
    configCard.className = "settings-group webtools-password-card webtools-password-config-card";
    configCard.appendChild(createCardHead("生成配置", "预设、字符、长度、数量集中操作。"));

    const presetBlockNodes = createBlock("快捷预设", "按场景切组合。");
    const presetGrid = document.createElement("div");
    presetGrid.className = "webtools-password-preset-grid";
    const presetButtons: HTMLButtonElement[] = [];
    passwordPresets.forEach((preset) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "webtools-password-preset";
      button.dataset.presetId = preset.id;

      const title = document.createElement("strong");
      title.textContent = preset.label;

      const description = document.createElement("span");
      description.textContent = preset.description;

      button.append(title, description);
      button.addEventListener("click", () => {
        applyOptionsToForm(preset.options);
        syncPasswordWorkbench();
        setStatus(`已切换到 ${preset.label}`);
      });
      presetButtons.push(button);
      presetGrid.appendChild(button);
    });
    presetBlockNodes.body.appendChild(presetGrid);

    const controlsGrid = document.createElement("div");
    controlsGrid.className = "webtools-password-control-grid";

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
    const includeSymbolsInput = includeSymbolsNodes.input;

    const symbolsInput = document.createElement("input");
    symbolsInput.className = "settings-value webtools-password-symbol-input";
    symbolsInput.type = "text";
    symbolsInput.name = "webtoolsSymbolChars";
    symbolsInput.value = webtoolsPasswordOptions.symbolChars;
    symbolsInput.placeholder = "!@#$%^&*";

    const symbolsField = document.createElement("label");
    symbolsField.className = "webtools-password-input-field";
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
    const excludeSimilarInput = excludeSimilarNodes.input;

    symbolsWrap.append(includeSymbolsNodes.wrap, symbolsField, symbolQuickGrid, excludeSimilarNodes.wrap);
    symbolsBlockNodes.body.appendChild(symbolsWrap);

    controlsGrid.append(charsBlockNodes.block, symbolsBlockNodes.block);

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

    const actionRow = document.createElement("div");
    actionRow.className = "webtools-password-action-row";

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

    configCard.append(presetBlockNodes.block, controlsGrid, sizingGrid, actionRow);

    const summaryCard = document.createElement("aside");
    summaryCard.className =
      "settings-group webtools-password-card webtools-password-summary-card";
    summaryCard.appendChild(createCardHead("摘要", "实时看强度和结果。"));

    const summaryGrid = document.createElement("div");
    summaryGrid.className = "webtools-password-summary-grid";

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

    const preview = document.createElement("div");
    preview.className = "webtools-password-preview";
    const previewHead = document.createElement("div");
    previewHead.className = "webtools-password-preview-head";
    const previewTitle = document.createElement("div");
    previewTitle.className = "webtools-password-preview-title";
    previewTitle.textContent = "最近首条";
    const previewMeta = document.createElement("div");
    previewMeta.className = "webtools-password-card-subtitle";
    previewHead.append(previewTitle, previewMeta);
    const previewValue = document.createElement("code");
    previewValue.className = "webtools-password-preview-value";
    preview.append(previewHead, previewValue);

    const tips = document.createElement("div");
    tips.className = "webtools-password-tip-list";

    summaryCard.append(summaryGrid, strengthPanel, summaryBadges, preview, tips);

    workbench.append(configCard, summaryCard);

    const resultsCard = document.createElement("section");
    resultsCard.className =
      "settings-group webtools-password-card webtools-password-results-card";
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

    const updateJsonStats = (): void => {
      routeStat.textContent = `${formatLabel(sourceSelect.value)} -> ${formatLabel(targetSelect.value)}`;
      inputStat.textContent = `输入 ${summarizeText(inputArea.value)}`;
      outputStat.textContent = `输出 ${summarizeText(outputArea.value)}`;
      payloadStat.textContent = describePayload(inputArea.value, sourceSelect.value);
      payloadStat.dataset.state = webtoolsJsonState.valid === false ? "error" : "idle";
      renderStructurePreview();
      renderFieldSelector();
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
      updateJsonStats();
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
      createWebtoolsUrlPartField("Protocol", "protocol"),
      createWebtoolsUrlPartField("Host", "host"),
      createWebtoolsUrlPartField("Port", "port"),
      createWebtoolsUrlPartField("路径", "pathname", true),
      createWebtoolsUrlPartField("查询串", "search", true),
      createWebtoolsUrlPartField("Hash", "hash", true)
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
      webtoolsTimestampUnit = normalizeWebtoolsTimestampUnit(unitSelect.value);
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

    const previewHost = document.createElement("div");
    previewHost.className = "webtools-image-base64-preview-host";

    const meta = document.createElement("div");
    meta.className = "webtools-image-base64-meta";

    const dropzone = document.createElement("div");
    dropzone.className = "webtools-image-base64-dropzone";

    const input = document.createElement("textarea");
    input.className = "settings-value webtools-textarea webtools-image-base64-textarea";
    input.name = "webtoolsImageBase64Input";
    input.value = webtoolsImageBase64Input;

    const output = document.createElement("textarea");
    output.className = "settings-value webtools-textarea webtools-image-base64-textarea";
    output.readOnly = true;
    output.value = webtoolsImageBase64DataUrl;
    output.setAttribute("data-webtools-image-base64-output", "1");

    const info = document.createElement("div");
    info.className = "webtools-tool-info";

    const copyRaw = document.createElement("button");
    copyRaw.type = "button";
    copyRaw.className = "settings-btn settings-btn-secondary";
    copyRaw.textContent = "Copy Base64";
    copyRaw.setAttribute("data-webtools-image-copy-raw", "1");

    const copyDataUrl = document.createElement("button");
    copyDataUrl.type = "button";
    copyDataUrl.className = "settings-btn settings-btn-secondary";
    copyDataUrl.textContent = "Copy DataURL";
    copyDataUrl.setAttribute("data-webtools-image-copy-dataurl", "1");

    const download = document.createElement("button");
    download.type = "button";
    download.className = "settings-btn settings-btn-primary";
    download.textContent = "Download";
    download.setAttribute("data-webtools-image-download", "1");

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "settings-btn settings-btn-secondary";
    clear.textContent = "Clear";
    clear.setAttribute("data-webtools-image-clear", "1");

    copyRaw.addEventListener("click", async () => {
      if (!webtoolsImageBase64Raw.trim()) {
        setStatus("No Base64 to copy");
        return;
      }
      await navigator.clipboard.writeText(webtoolsImageBase64Raw);
      setStatus("Copied Base64");
    });

    copyDataUrl.addEventListener("click", async () => {
      if (!webtoolsImageBase64DataUrl.trim()) {
        setStatus("No DataURL to copy");
        return;
      }
      await navigator.clipboard.writeText(webtoolsImageBase64DataUrl);
      setStatus("Copied DataURL");
    });

    download.addEventListener("click", () => {
      beginPluginNativeInteraction(1500);
      if (!webtoolsImageBase64DataUrl.startsWith("data:image/")) {
        schedulePluginNativeInteractionRelease();
        setStatus("No image available");
        return;
      }
      const link = document.createElement("a");
      link.href = webtoolsImageBase64DataUrl;
      link.download = getWebtoolsImageBase64DownloadName();
      link.click();
      schedulePluginNativeInteractionRelease();
      setStatus("Download started");
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
      refreshWebtoolsImageBase64PanelInForm(form);
      setStatus("Cleared");
    });

    input.addEventListener("input", () => {
      webtoolsImageBase64Input = input.value;
      scheduleWebtoolsImageBase64AutoNormalize(form);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsImageBase64Normalize(input.value, { render: false, form });
    });

    form.append(copyRaw, copyDataUrl, download, clear, previewHost, meta, dropzone, input, info, output);
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

      const info = document.createElement("div");
      info.className = "webtools-tool-info webtools-unit-info";
      form.append(stack, info);
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
    form.append(screenBox, info);
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

    const input = document.createElement("textarea");
    input.className = "settings-value webtools-textarea webtools-strings-textarea";
    input.name = "webtoolsStringsInput";
    input.value = webtoolsStringsInput;

    const caseType = document.createElement("select");
    caseType.name = "webtoolsStringsCaseType";
    ["camel", "snake", "pascal", "kebab", "upper", "lower"].forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      opt.selected = webtoolsStringsCaseType === v;
      caseType.appendChild(opt);
    });

    const count = document.createElement("input");
    count.type = "number";
    count.name = "webtoolsStringsCount";
    count.value = String(webtoolsStringsUuidCount);

    const convert = document.createElement("button");
    convert.type = "button";
    convert.className = "settings-btn settings-btn-primary";
    convert.textContent = "Convert";
    convert.addEventListener("click", () => {
      void executeWebtoolsStringsAction("convert", form);
    });

    const uuid = document.createElement("button");
    uuid.type = "button";
    uuid.className = "settings-btn settings-btn-secondary";
    uuid.textContent = "UUID";
    uuid.addEventListener("click", () => {
      void executeWebtoolsStringsAction("uuid", form);
    });

    form.append(input, caseType, count, convert, uuid);
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

    const preview = document.createElement("div");
    preview.setAttribute("data-webtools-colors-preview", "1");
    const previewText = document.createElement("span");
    previewText.setAttribute("data-webtools-colors-preview-text", "1");
    preview.appendChild(previewText);

    const picker = document.createElement("input");
    picker.type = "color";
    picker.name = "webtoolsColorsPicker";

    const input = document.createElement("input");
    input.name = "webtoolsColorsInput";
    input.className = "settings-value";

    const hex = document.createElement("div");
    hex.setAttribute("data-webtools-colors-output", "hex");
    const rgb = document.createElement("div");
    rgb.setAttribute("data-webtools-colors-output", "rgb");
    const hsl = document.createElement("div");
    hsl.setAttribute("data-webtools-colors-output", "hsl");

    const shades = document.createElement("div");
    shades.setAttribute("data-webtools-colors-shades", "1");

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

    form.append(preview, picker, input, hex, rgb, hsl, shades);
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

    const title = document.createElement("h3");
    title.className = "webtools-qrcode-title";
    title.textContent = activePluginPanel?.title || "二维码生成";

    const info = document.createElement("div");
    info.className = "webtools-qrcode-info";

    const text = document.createElement("textarea");
    text.className = "settings-value webtools-textarea webtools-qrcode-textarea";
    text.name = "webtoolsQrText";
    text.value = webtoolsQrText;

    const size = document.createElement("input");
    size.type = "number";
    size.name = "webtoolsQrSize";
    size.value = String(webtoolsQrSize);

    const level = document.createElement("select");
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
    dark.name = "webtoolsQrDarkColor";
    dark.value = webtoolsQrDarkColor;

    const darkValue = document.createElement("span");
    darkValue.setAttribute("data-webtools-qrcode-dark-value", "1");

    const light = document.createElement("input");
    light.type = "color";
    light.name = "webtoolsQrLightColor";
    light.value = webtoolsQrLightColor;

    const lightValue = document.createElement("span");
    lightValue.setAttribute("data-webtools-qrcode-light-value", "1");

    const logoMeta = document.createElement("span");
    logoMeta.className = "webtools-qrcode-logo-meta";
    logoMeta.setAttribute("data-webtools-qrcode-logo-meta", "1");

    const logoMode = document.createElement("select");
    logoMode.name = "webtoolsQrLogoMode";
    [
      ["none", "No Logo"],
      ["text", "Text Logo"],
      ["image", "Image Logo"]
    ].forEach(([value, label]) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      opt.selected = webtoolsQrLogoMode === value;
      logoMode.appendChild(opt);
    });

    const logoTextField = document.createElement("div");
    logoTextField.setAttribute("data-webtools-qrcode-logo-text-field", "1");
    const logoText = document.createElement("input");
    logoText.name = "webtoolsQrLogoText";
    logoText.value = webtoolsQrLogoText;
    logoTextField.appendChild(logoText);

    const logoImageField = document.createElement("div");
    logoImageField.setAttribute("data-webtools-qrcode-logo-image-field", "1");
    const logoImageName = document.createElement("span");
    logoImageName.className = "webtools-qrcode-logo-image-name";
    logoImageName.setAttribute("data-webtools-qrcode-logo-image-name", "1");
    logoImageField.appendChild(logoImageName);

    const clearLogo = document.createElement("button");
    clearLogo.type = "button";
    clearLogo.className = "settings-btn settings-btn-secondary";
    clearLogo.setAttribute("data-webtools-qrcode-clear-logo", "1");
    clearLogo.textContent = "Clear Logo";
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

    const download = document.createElement("button");
    download.type = "button";
    download.className = "settings-btn settings-btn-primary webtools-qrcode-download-btn";
    download.setAttribute("data-webtools-qrcode-download", "1");
    download.textContent = "Download PNG";
    download.addEventListener("click", async () => {
      beginPluginNativeInteraction(1500);
      try {
        await downloadWebtoolsQrcodePng();
        setStatus("QR downloaded");
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Download failed";
        setStatus(reason);
      } finally {
        schedulePluginNativeInteractionRelease();
      }
    });

    const previewHost = document.createElement("div");
    previewHost.className = "webtools-qrcode-preview-host";
    previewHost.setAttribute("data-webtools-qrcode-preview", "1");

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
      webtoolsQrLogoText = logoText.value.trim().slice(0, 6);
      refreshWebtoolsQrcodePanelInForm(form);
      scheduleWebtoolsQrcodeAutoGenerate(form);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsQrcodeGenerateInForm(form);
    });

    form.append(
      title,
      info,
      text,
      size,
      level,
      dark,
      darkValue,
      light,
      lightValue,
      logoMeta,
      logoMode,
      logoTextField,
      logoImageField,
      clearLogo,
      download,
      previewHost
    );
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

    const input = document.createElement("textarea");
    input.className = "settings-value webtools-textarea webtools-ua-input";
    input.name = "webtoolsUaInput";
    input.value = webtoolsUaInput || navigator.userAgent;

    const info = document.createElement("div");
    info.className = "webtools-ua-info";

    const grid = document.createElement("div");
    grid.className = "webtools-ua-grid";

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "settings-btn settings-btn-primary";
    copy.textContent = "Copy";
    copy.setAttribute("data-webtools-ua-copy", "1");

    const current = document.createElement("button");
    current.type = "button";
    current.className = "settings-btn settings-btn-secondary";
    current.textContent = "Current UA";

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "settings-btn settings-btn-secondary";
    clear.textContent = "Clear";

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
      setStatus("Cleared UA input");
    });

    copy.addEventListener("click", async () => {
      const value = input.value.trim();
      if (!value) {
        setStatus("No UA to copy");
        return;
      }
      await navigator.clipboard.writeText(value);
      setStatus("Copied UA");
    });

    input.addEventListener("input", () => {
      webtoolsUaInput = input.value;
      scheduleWebtoolsUaAutoParse(form);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsUaParse(input.value);
    });

    form.append(current, clear, copy, input, info, grid);
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

    const preview = document.createElement("div");
    preview.className = "webtools-api-preview webtools-tool-code";

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
      bodyTypes.append(radio, text);
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

    const send = document.createElement("button");
    send.type = "submit";
    send.className = "settings-btn settings-btn-primary webtools-api-send-btn";
    send.textContent = "发送";

    const responseSection = document.createElement("section");
    responseSection.className = "webtools-api-response-section";
    const status = document.createElement("div");
    status.className = "webtools-api-status";
    const time = document.createElement("span");
    time.className = "webtools-api-time";
    const size = document.createElement("span");
    size.className = "webtools-api-size";
    const err = document.createElement("div");
    err.className = "webtools-api-error";
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
    responseSection.append(status, time, size, err, responseUrl, responseTabs, responsePanels);

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

    form.append(title, method, url, send, preview, requestTabs, requestPanels, responseSection);
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
  }
};
