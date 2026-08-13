namespace RendererPanelRuntime {

  export function clampPasswordLength(value: number, fallback: number): number {
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

  export function clampPasswordCount(value: number, fallback: number): number {
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

  export function clampWebtoolsPasswordCount(value: number, fallback: number): number {
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

  export function normalizePasswordOptions(
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

  export function parsePasswordPanelPayload(payload: unknown): PasswordPanelPayload | null {
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

  export function parseCashflowPanelPayload(payload: unknown): CashflowPanelPayload | null {
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

  export function formatMoney(value: number): string {
    return CURRENCY_FORMATTER.format(value);
  }

  export function formatPercent(value: number): string {
    const percent = value * 100;
    return `${percent.toFixed(1)}%`;
  }

  export function toRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object") {
      return null;
    }
    return value as Record<string, unknown>;
  }

  export function toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is string => typeof item === "string");
  }

  export function tryParseWebtoolsUrl(input: string): URL | null {
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

  export function buildPasswordGenerateTarget(options: PasswordGeneratorOptions): string {
    const params = new URLSearchParams();
    params.set("action", "generate");
    params.set("length", String(options.length));
    params.set("symbols", options.includeSymbols ? "1" : "0");
    params.set("count", String(options.count));
    return `command:plugin:password-generator?${params.toString()}`;
  }

  export function extractGeneratedPasswords(result: ExecuteResult): string[] {
    const raw = result.data?.passwords;
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw.filter(
      (value): value is string => typeof value === "string" && value.length > 0
    );
  }

  export function createPasswordResultRow(passwords: string[]): HTMLDivElement {
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

  export async function generateFromPasswordPanel(form: HTMLFormElement): Promise<void> {
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

  export function renderStandalonePasswordPanelView(): void {
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

  export function openStandalonePasswordPanel(
    draft?: Partial<PasswordGeneratorOptions>
  ): void {
    passwordPanelOptions = normalizePasswordOptions(draft ?? {}, passwordPanelOptions);
    passwordPanelGenerated = [];
    setMode("password");
    void refreshEntries("");
  }

  export function renderPasswordPanel(): void {
      renderStandalonePasswordPanelView();
    }

  export function handlePasswordPanelEnter(): void {
      const form = list.querySelector("form.password-form");
      if (form instanceof HTMLFormElement) {
        void generateFromPasswordPanel(form);
      }
    }

  export function applyWebtoolsPasswordPanelPayload(panel: ActivePluginPanelState): void {
      const optionsRaw = panel.data?.options;
      const parsed = extractWebtoolsPasswordOptionsFromUnknown(optionsRaw);
      webtoolsPasswordOptions = normalizeWebtoolsPasswordOptions(
        parsed,
        webtoolsPasswordOptions
      );
      webtoolsPasswordRows = [];
    }

  export function renderWebtoolsPasswordPanel(): void {
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
    }

}
