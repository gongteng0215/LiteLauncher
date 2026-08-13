namespace RendererPanelRuntime {

  export let webtoolsCronExpression = "5 4 * * *";

  export let webtoolsCronReadable = "";

  export let webtoolsCronNextRun = "";

  export let webtoolsCronUpcoming: string[] = [];

  export let webtoolsCronStatus: WebtoolsCronStatus = "";

  export let webtoolsCronErrorMessage = "";

  export let webtoolsCronErrorField: WebtoolsCronFieldKey | "" = "";

  export let webtoolsCronWarnings: string[] = [];

  export let webtoolsCronTemplateKey = "";

  export let webtoolsCronTemplateSummary = "";

  export let webtoolsCronFieldMeta: WebtoolsCronFieldMeta[] = [];

  export let webtoolsCronCopyState: WebtoolsCronCopyState = "";

  export let webtoolsCronAutoTimer: number | null = null;

  export let webtoolsCronRequestToken = 0;

  export let webtoolsCronTemplates: WebtoolsCronTemplateItem[] = [];

  export let webtoolsCronEditingTemplateKey = "";

  export type WebtoolsCronTemplateAction =
    | "save-template"
    | "update-template"
    | "delete-template"
    | "reset-templates";

  export type WebtoolsCronTemplateItem = {
    key: string;
    expression: string;
    summary: string;
  };

  export const WEBTOOLS_CRON_FIELD_FALLBACKS: ReadonlyArray<{
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

  export function parseWebtoolsCronTemplates(value: unknown): WebtoolsCronTemplateItem[] {
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

  export function hydrateWebtoolsCronTemplates(data: Record<string, unknown> | null): void {
    const templates = data ? parseWebtoolsCronTemplates(data.templates) : [];
    if (templates.length > 0) {
      webtoolsCronTemplates = templates;
    }
  }

  export function normalizeWebtoolsCronStatus(value: unknown): WebtoolsCronStatus {
    return value === "success" || value === "warning" || value === "error" ? value : "";
  }

  export function normalizeWebtoolsCronErrorField(value: unknown): WebtoolsCronFieldKey | "" {
    return value === "minute" ||
      value === "hour" ||
      value === "day" ||
      value === "month" ||
      value === "weekday"
      ? value
      : "";
  }

  export function getWebtoolsCronPartValues(expression: string): string[] {
    const parts = expression.trim().split(/\s+/).filter(Boolean);
    while (parts.length < 5) {
      parts.push("*");
    }
    return parts.slice(0, 5);
  }

  export function buildWebtoolsCronFallbackFieldMeta(
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

  export function parseWebtoolsCronFieldMeta(
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

  export function getWebtoolsCronFieldMeta(): WebtoolsCronFieldMeta[] {
    return webtoolsCronFieldMeta.length > 0
      ? webtoolsCronFieldMeta
      : buildWebtoolsCronFallbackFieldMeta(webtoolsCronExpression, webtoolsCronErrorField);
  }

  export function getWebtoolsCronTemplates(): ReadonlyArray<WebtoolsCronTemplateItem> {
    return webtoolsCronTemplates;
  }

  export function buildWebtoolsCronTemplateTarget(
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

  export function readWebtoolsCronTemplateEditorValues(form: HTMLFormElement): {
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

  export function fillWebtoolsCronTemplateEditor(
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

  export function renderWebtoolsCronTemplateGrid(
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

  export function refreshWebtoolsCronTemplatesInForm(form: HTMLFormElement): void {
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

  export async function executeWebtoolsCronTemplateAction(
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

  export function rebuildWebtoolsCronExpressionFromFields(form: HTMLFormElement): string {
    const keys: WebtoolsCronFieldKey[] = ["minute", "hour", "day", "month", "weekday"];
    return keys
      .map((key) => {
        const node = form.elements.namedItem(`webtoolsCronField-${key}`);
        return node instanceof HTMLInputElement && node.value.trim() ? node.value.trim() : "*";
      })
      .join(" ");
  }

  export async function copyWebtoolsCronText(
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

  export function resetWebtoolsCronState(expression = webtoolsCronExpression): void {
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

  export function hydrateWebtoolsCronState(data: Record<string, unknown> | null): void {
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

  export function buildWebtoolsCronTarget(action: "parse" | "random", expression: string): string {
    const params = new URLSearchParams();
    params.set("action", action);
    params.set("expression", expression);
    return `command:plugin:${WEBTOOLS_CRON_PLUGIN_ID}?${params.toString()}`;
  }

  export function refreshWebtoolsCronResultInForm(form: HTMLFormElement): void {
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

  export function scheduleWebtoolsCronAutoParse(
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

  export async function executeWebtoolsCronAction(
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

  export let webtoolsImageBase64Input = "";

  export let webtoolsImageBase64DataUrl = "";

  export let webtoolsImageBase64Raw = "";

  export let webtoolsImageBase64Mime = "";

  export let webtoolsImageBase64SizeText = "";

  export let webtoolsImageBase64Info = "";

  export let webtoolsImageBase64Error = "";

  export let webtoolsImageBase64Dragging = false;

  export let webtoolsImageBase64FileName = "";

  export let webtoolsImageBase64AutoTimer: number | null = null;

  export let webtoolsImageBase64RequestToken = 0;

  export function buildWebtoolsImageBase64Target(input: string): string {
    const params = new URLSearchParams();
    params.set("action", "normalize");
    params.set("input", input);
    return `command:plugin:${WEBTOOLS_IMAGE_BASE64_PLUGIN_ID}?${params.toString()}`;
  }

  export function getWebtoolsImageBase64DownloadName(): string {
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

  export function readWebtoolsImageBase64FileAsDataUrl(file: File): Promise<string> {
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

  export function refreshWebtoolsImageBase64PanelInForm(form: HTMLFormElement): void {
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

  export function scheduleWebtoolsImageBase64AutoNormalize(
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

  export async function executeWebtoolsImageBase64Normalize(
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

  export function findWebtoolsImagePromptTextDesign(idOrLabel: string | undefined): WebtoolsImagePromptTextDesign {
    return (
      WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.designs.find(
        (design) => design.id === idOrLabel || design.label === idOrLabel
      ) ?? WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.designs[0]
    );
  }

  export function createWebtoolsImagePromptTextState(
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

  export function applyWebtoolsImagePromptTextDesign(
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

  export function createEmptyWebtoolsImagePromptSelections(): Record<
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

  export function createEmptyWebtoolsImagePromptCustom(): Record<
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

  export function compactWebtoolsImagePromptOptions(options: string[]): string[] {
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

  export function normalizeWebtoolsImagePromptStylePresetId(
    value: string | undefined
  ): WebtoolsImagePromptStylePresetId {
    return WEBTOOLS_IMAGE_PROMPT_STYLE_PRESETS_FROM_SHARED.some((preset) => preset.id === value)
      ? (value as WebtoolsImagePromptStylePresetId)
      : "ecommerce-main";
  }

  export function getWebtoolsImagePromptStylePreset(
    id: WebtoolsImagePromptStylePresetId
  ): WebtoolsImagePromptStylePreset {
    return (
      WEBTOOLS_IMAGE_PROMPT_STYLE_PRESETS_FROM_SHARED.find((preset) => preset.id === id) ??
      WEBTOOLS_IMAGE_PROMPT_STYLE_PRESETS_FROM_SHARED[0]
    );
  }

  export function createWebtoolsImagePromptSelectionStateFromPreset(
    stylePresetId: WebtoolsImagePromptStylePresetId
  ): Record<WebtoolsImagePromptOptionGroupKey, string[]> {
    const preset = getWebtoolsImagePromptStylePreset(stylePresetId);
    const selections = createEmptyWebtoolsImagePromptSelections();
    for (const key of Object.keys(preset.defaults) as WebtoolsImagePromptOptionGroupKey[]) {
      selections[key] = [...(preset.defaults[key] ?? [])];
    }
    return selections;
  }

  export function getWebtoolsImagePromptOptionGroupsForStyle(
    stylePresetId: WebtoolsImagePromptStylePresetId
  ): WebtoolsImagePromptOptionGroup[] {
    const preset = getWebtoolsImagePromptStylePreset(stylePresetId);
    return WEBTOOLS_IMAGE_PROMPT_OPTION_GROUPS.map((group) => ({
      ...group,
      options: [...(preset.optionGroups[group.key] ?? group.options)],
      categories: undefined
    }));
  }

  export function createDefaultWebtoolsImagePromptState(
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

  export function normalizeWebtoolsImagePromptSmartTemplateId(
    value: string | undefined
  ): WebtoolsImagePromptSmartTemplateId {
    return WEBTOOLS_IMAGE_PROMPT_SMART_TEMPLATES.some((template) => template.id === value)
      ? (value as WebtoolsImagePromptSmartTemplateId)
      : "ecommerce-main-image";
  }

  export function getWebtoolsImagePromptSmartTemplate(
    templateId: WebtoolsImagePromptSmartTemplateId
  ): WebtoolsImagePromptSmartTemplate {
    return (
      WEBTOOLS_IMAGE_PROMPT_SMART_TEMPLATES.find((template) => template.id === templateId) ??
      WEBTOOLS_IMAGE_PROMPT_SMART_TEMPLATES[0]
    );
  }

  export function createWebtoolsImagePromptSmartTemplateState(
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

  export function cloneWebtoolsImagePromptState(
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

  export function getWebtoolsImagePromptSelectedOptions(
    state: WebtoolsImagePromptState,
    key: WebtoolsImagePromptOptionGroupKey
  ): string[] {
    return key === "constraints"
      ? [...state.selections.constraints, ...state.constraints]
      : state.selections[key];
  }

  export const WEBTOOLS_IMAGE_PROMPT_EXAMPLE: WebtoolsImagePromptState = {
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

  export const WEBTOOLS_IMAGE_PROMPT_BIRTHDAY_EXAMPLES: Array<{
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

  export let webtoolsImagePromptState: WebtoolsImagePromptState =
    createDefaultWebtoolsImagePromptState();

  export let webtoolsImagePromptOutput = "";

  export let webtoolsImagePromptInfo = "";

  export let webtoolsImagePromptRequestToken = 0;

  export function normalizeWebtoolsImagePromptProductId(value: string): WebtoolsImagePromptProductId {
    return value === "chatgpt-images-2" ? "chatgpt-images-2" : "chatgpt-images-2";
  }

  export function filterWebtoolsImagePromptStateForStyle(
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

  export function readWebtoolsImagePromptStringList(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
  }

  export function normalizeWebtoolsImagePromptState(value: unknown): WebtoolsImagePromptState {
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

  export function collectWebtoolsImagePromptState(form: HTMLFormElement): WebtoolsImagePromptState {
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

  export function syncWebtoolsImagePromptForm(form: HTMLFormElement, state: WebtoolsImagePromptState): void {
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

  export function createClearedWebtoolsImagePromptState(): WebtoolsImagePromptState {
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

  export function buildWebtoolsImagePromptTarget(state: WebtoolsImagePromptState): string {
    const params = new URLSearchParams();
    params.set("action", "build");
    params.set("state", JSON.stringify(state));
    return `command:plugin:${WEBTOOLS_IMAGE_PROMPT_PLUGIN_ID}?${params.toString()}`;
  }

  export function refreshWebtoolsImagePromptPanelInForm(form: HTMLFormElement): void {
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

  export async function executeWebtoolsImagePromptBuild(
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

  export const WEBTOOLS_UNIT_STORAGE_FACTORS: Record<WebtoolsUnitStorageKey, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4
  };

  export let webtoolsConfigSource = "yaml";

  export let webtoolsConfigTarget = "properties";

  export let webtoolsConfigInput = "";

  export let webtoolsConfigOutput = "";

  export let webtoolsConfigInfo = "";

  export let webtoolsConfigError = "";

  export let webtoolsConfigAutoTimer: number | null = null;

  export let webtoolsConfigRequestToken = 0;

  export let webtoolsSqlInput =
    "SELECT a,b,c FROM table_test JOIN other_table ON table_test.id = other_table.id WHERE a > 10 AND b LIKE '%test%' ORDER BY c DESC LIMIT 10";

  export let webtoolsSqlOutput = "";

  export let webtoolsSqlDialect = "sql";

  export let webtoolsSqlUppercase = true;

  export let webtoolsSqlIndent = 2;

  export let webtoolsSqlInfo = "";

  export let webtoolsSqlError = "";

  export let webtoolsSqlAutoTimer: number | null = null;

  export let webtoolsSqlRequestToken = 0;

  export let webtoolsUnitActiveTab: WebtoolsUnitTab = "storage";

  export let webtoolsUnitStorageValue = 1;

  export let webtoolsUnitStorageUnit: WebtoolsUnitStorageKey = "MB";

  export let webtoolsUnitStorageValues: Record<WebtoolsUnitStorageKey, number> = {
    B: 1048576,
    KB: 1024,
    MB: 1,
    GB: 0.0009765625,
    TB: 0.00000095367431640625
  };

}
