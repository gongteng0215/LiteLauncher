namespace RendererPanelRuntime {

  export let codeAgentSwitchCopyState: "" | "env" | "diagnostics" | "diff" | "key" = "";

  export type CodeAgentSwitchSelectedKind = "provider" | "profile";

  export let codeAgentSwitchSelectedKind: CodeAgentSwitchSelectedKind = "profile";

  export let codeAgentSwitchSelectedId = "";

  export let codeAgentSwitchSelectionMode: "auto" | "manual" = "auto";

  export function getCodeAgentSwitchDataFromPanel(panel: unknown): typeof codeAgentSwitchData {
    const record = panel && typeof panel === "object" ? (panel as { data?: unknown }) : {};
    const data = record.data && typeof record.data === "object" ? record.data : {};
    const nextData = data as typeof codeAgentSwitchData;
    if (!nextData.preview) {
      nextData.preview = {};
    }
    return nextData;
  }

  export function getCodeAgentSwitchProviders(): CodeAgentSwitchProviderView[] {
    return codeAgentSwitchData.config?.providers ?? [];
  }

  export function getCodeAgentSwitchProfiles(): CodeAgentSwitchProfileView[] {
    return codeAgentSwitchData.config?.profiles ?? [];
  }

  export function isCodeAgentSwitchSelectedEntityPresent(
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

  export function chooseDefaultCodeAgentSwitchSelection(): void {
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

  export function syncCodeAgentSwitchSelectionFromData(): void {
    if (
      codeAgentSwitchSelectionMode === "manual" &&
      isCodeAgentSwitchSelectedEntityPresent(codeAgentSwitchSelectedKind, codeAgentSwitchSelectedId)
    ) {
      return;
    }
    codeAgentSwitchSelectionMode = "auto";
    chooseDefaultCodeAgentSwitchSelection();
  }

  export function selectCodeAgentSwitchDetail(kind: CodeAgentSwitchSelectedKind, id: string): void {
    codeAgentSwitchSelectedKind = kind;
    codeAgentSwitchSelectedId = id;
    codeAgentSwitchSelectionMode = "manual";
    syncCodeAgentSwitchSelectionUi();
  }

  export function getCodeAgentSwitchForm(): HTMLFormElement | null {
    return list.querySelector<HTMLFormElement>("form.codeagent-switch-form");
  }

  export function syncCodeAgentSwitchSelectionUi(): void {
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

  export function createCodeAgentSwitchMetric(labelText: string, valueText: string): HTMLDivElement {
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

  export function createCodeAgentSwitchCommandItem(labelText: string, commandText: string): HTMLDivElement {
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

  export function createCodeAgentSwitchPill(text: string, tone: "active" | "muted" = "muted"): HTMLSpanElement {
    const pill = document.createElement("span");
    pill.className = "codeagent-switch-active-pill";
    pill.dataset.tone = tone;
    pill.textContent = text;
    return pill;
  }

  export function createCodeAgentSwitchStateBadge(
    text: string,
    tone: "active" | "selected" | "muted" = "muted"
  ): HTMLSpanElement {
    const badge = document.createElement("span");
    badge.className = "codeagent-switch-state-badge";
    badge.dataset.tone = tone;
    badge.textContent = text;
    return badge;
  }

  export function createCodeAgentSwitchOverviewItem(labelText: string, valueText: string): HTMLDivElement {
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

  export function createCodeAgentSwitchDetailOverview(
    items: Array<{ label: string; value: string | undefined }>
  ): HTMLDivElement {
    const grid = document.createElement("div");
    grid.className = "codeagent-switch-detail-overview";
    for (const item of items) {
      grid.appendChild(createCodeAgentSwitchOverviewItem(item.label, item.value ?? ""));
    }
    return grid;
  }

  export function deriveCodeAgentSwitchEnvKeyName(providerId: string): string {
    const normalized = providerId
      .trim()
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toUpperCase();
    return `CODEAGENT_${normalized || "PROVIDER"}_API_KEY`;
  }

  export function deriveCodeAgentSwitchProviderName(providerId: string, baseUrl = ""): string {
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

  export function deriveCodeAgentSwitchProviderId(source: string): string {
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

  export function makeUniqueCodeAgentSwitchId(baseId: string, existingIds: Set<string>): string {
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

  export function createCodeAgentSwitchInput(
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

  export function createCodeAgentSwitchTextarea(
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

  export function createCodeAgentSwitchSelect(
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

  export function createCodeAgentSwitchCheckbox(
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

  export function formatCodeAgentSwitchStringMap(map?: Record<string, string>): string {
    return Object.entries(map ?? {})
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");
  }

  export function getCodeAgentSwitchProfileMatch(
    profileId: string
  ): CodeAgentSwitchProfileMatchView | undefined {
    return codeAgentSwitchData.active?.profileMatches?.find(
      (item) => item.profileId === profileId
    );
  }

  export function createCodeAgentSwitchToolSidebar(): HTMLDivElement {
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

  export function createCodeAgentSwitchDetailSection(
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

  export function createCodeAgentSwitchEditorGroup(
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

  export function createCodeAgentSwitchProviderEditor(
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

  export function createCodeAgentSwitchProfileEditor(
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

  export function createCodeAgentSwitchRuntimeEditor(
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

  export function getCodeAgentSwitchProviderSummary(provider: CodeAgentSwitchProviderView): string {
    const auth = provider.envKey || (provider.requiresOpenAiAuth ? "OpenAI 登录态" : "未配置认证");
    return `${provider.id} · ${provider.baseUrl || "未配置 base_url"} · ${auth}`;
  }

  export function getCodeAgentSwitchProfileLabel(profile: CodeAgentSwitchProfileView | undefined): string {
    if (!profile) {
      return "";
    }
    return profile.name || profile.id;
  }

  export function getCodeAgentSwitchProfileSummary(profile: CodeAgentSwitchProfileView): string {
    return `${profile.providerId || "未绑定 Provider"} · ${
      profile.model || "未配置模型"
    } · ${profile.modelReasoningEffort || "默认 reasoning"}`;
  }

  export function getCodeAgentSwitchEffectiveProfile(
    active: NonNullable<typeof codeAgentSwitchData.active>,
    config: NonNullable<typeof codeAgentSwitchData.config>
  ): CodeAgentSwitchProfileView | undefined {
    const profileId = active.activeProfileId ?? active.activeProfile?.id ?? config.profile;
    return profileId
      ? (config.profiles ?? []).find((profile) => profile.id === profileId)
      : undefined;
  }

  export function getCodeAgentSwitchEffectiveModelInfo(
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

  export function buildCodeAgentSwitchDraftProfile(
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

  export function getCodeAgentSwitchActiveConfigLabel(
    active: NonNullable<typeof codeAgentSwitchData.active>
  ): string {
    return active.activeProfileId || active.activeSource?.label || "当前 Root 配置";
  }

  export function openCodeAgentSwitchProviderDetail(providerId?: string): void {
    selectCodeAgentSwitchDetail("provider", providerId ?? "");
  }

  export function createCodeAgentSwitchProviderKeyButton(
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

  export function createCodeAgentSwitchListButton(
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

  export function createCodeAgentSwitchCurrentCard(
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

  export function createCodeAgentSwitchListPanel(
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

  export function createCodeAgentSwitchPreviewSection(): HTMLElement {
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

  export function createCodeAgentSwitchRootPreviewSection(): HTMLElement {
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

  export const CODEAGENT_SWITCH_ROOT_SECTION_TITLE = "保存 Root 配置";

  export function createCodeAgentSwitchDiagnosticsSection(): HTMLElement {
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

  export function createCodeAgentSwitchCommandsSection(): HTMLElement {
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

  export function createCodeAgentSwitchBackupsSection(): HTMLElement {
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

  export function createCodeAgentSwitchDetailPanel(
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

  export function renderCodeAgentSwitchPanelV2(): void {
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

  export function renderWebtoolsCronPanelV2(): void {
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

  export type CodeAgentSwitchUiAction =
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

  export function buildCodeAgentSwitchTarget(
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

  export async function executeCodeAgentSwitchAction(
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

  export function getCodeAgentSwitchFormValue(container: HTMLElement, name: string): string {
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

  export function getCodeAgentSwitchOptionalNumber(container: HTMLElement, name: string): number | undefined {
    const value = getCodeAgentSwitchFormValue(container, name);
    if (!value) {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  export function buildCodeAgentSwitchProviderSavePayload(
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

  export function buildCodeAgentSwitchRuntimeSavePayload(
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

  export async function executeCodeAgentSwitchSaveProvider(container: HTMLElement): Promise<void> {
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

  export function encodeCodeAgentSwitchUtf8Base64(value: string): string {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    for (let index = 0; index < bytes.length; index += 1) {
      binary += String.fromCharCode(bytes[index] ?? 0);
    }
    return window.btoa(binary);
  }

  export function buildCodeAgentSwitchPowerShellUserEnvScript(
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

  export async function copyCodeAgentSwitchProviderKeyCommand(container: HTMLElement): Promise<void> {
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

  export async function executeCodeAgentSwitchSetProviderKey(container: HTMLElement): Promise<void> {
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

  export async function executeCodeAgentSwitchDeleteProvider(providerId: string): Promise<void> {
    if (!providerId) {
      setStatus("请先选择 Provider");
      return;
    }
    codeAgentSwitchSelectionMode = "auto";
    await executeCodeAgentSwitchAction("delete-provider", undefined, undefined, {
      provider: providerId
    });
  }

  export async function executeCodeAgentSwitchSaveProfile(container: HTMLElement): Promise<void> {
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

  export async function executeCodeAgentSwitchSaveRuntime(container: HTMLElement): Promise<void> {
    await executeCodeAgentSwitchAction(
      "save-runtime",
      undefined,
      undefined,
      buildCodeAgentSwitchRuntimeSavePayload(container)
    );
  }

  export async function executeCodeAgentSwitchSaveProviderAndRuntime(
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

  export async function executeCodeAgentSwitchDeleteProfile(profileId: string): Promise<void> {
    if (!profileId) {
      setStatus("请先选择 Profile");
      return;
    }
    codeAgentSwitchSelectionMode = "auto";
    await executeCodeAgentSwitchAction("delete-profile", profileId);
  }

  export async function copyCodeAgentSwitchText(
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

  export function formatCodeAgentSwitchBackupSize(sizeBytes: number | undefined): string {
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

  export function formatCodeAgentSwitchBackupTime(createdAtMs: number | undefined): string {
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

  export const WEBTOOLS_IMAGE_PROMPT_VISIBLE_OPTION_LIMIT = 8;

  export const imagePromptData = window.__LL_IMAGE_PROMPT_DATA__ as WebtoolsImagePromptData | undefined;

  if (!imagePromptData) {
    throw new Error("renderer image prompt data not initialized");
  }

  export const WEBTOOLS_IMAGE_PROMPT_PRODUCTS = imagePromptData.products;

  export const WEBTOOLS_IMAGE_PROMPT_GROUP_KEYS: WebtoolsImagePromptOptionGroupKey[] = [
    "subject",
    "style",
    "composition",
    "lighting",
    "materials",
    "environment",
    "mood",
    "constraints"
  ];

  export const WEBTOOLS_IMAGE_PROMPT_OPTION_GROUPS = imagePromptData.optionGroups;

  export const WEBTOOLS_IMAGE_PROMPT_STYLE_PRESETS_FROM_SHARED = imagePromptData.stylePresets;

  export const WEBTOOLS_IMAGE_PROMPT_SMART_TEMPLATES = imagePromptData.smartTemplates;

  export const WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS = imagePromptData.textOptions;

  export const webtoolsImagePromptExpandedGroups = new Set<WebtoolsImagePromptOptionGroupKey>();

  export let webtoolsImagePromptStyleGroup: WebtoolsImagePromptStylePresetGroup | "" = "";

  export let webtoolsImagePromptSmartTemplateId: WebtoolsImagePromptSmartTemplateId | "" = "";

  export type ClipboardWorkbenchPanelKind = "text" | "image" | "files";

  export type ClipboardWorkbenchPanelSource = "auto" | "manual" | "screenshot";

  export interface ClipboardWorkbenchPanelItemView {
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

  export interface ClipboardWorkbenchPanelData {
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

  export function applyCodeAgentSwitchPanelPayload(panel: unknown): void {
      codeAgentSwitchData = getCodeAgentSwitchDataFromPanel(panel);
      codeAgentSwitchCopyState = "";
      syncCodeAgentSwitchSelectionFromData();
    }

  export function renderCodeAgentSwitchPanel(): void {
      renderCodeAgentSwitchPanelV2();
    }

}
