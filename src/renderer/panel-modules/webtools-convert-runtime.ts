namespace RendererPanelRuntime {

  export let webtoolsUnitPixel = 160;

  export let webtoolsUnitRem = 10;

  export let webtoolsUnitBasePx = 16;

  export const WEBTOOLS_SQL_DEFAULT_INPUT =
    "SELECT a,b,c FROM table_test JOIN other_table ON table_test.id = other_table.id WHERE a > 10 AND b LIKE '%test%' ORDER BY c DESC LIMIT 10";

  export const WEBTOOLS_SQL_DIALECT_OPTIONS = [
    { value: "sql", label: "Standard SQL" },
    { value: "mysql", label: "MySQL" },
    { value: "postgresql", label: "PostgreSQL" },
    { value: "sqlite", label: "SQLite" },
    { value: "tsql", label: "T-SQL" }
  ] as const;

  export const WEBTOOLS_SQL_INDENT_OPTIONS = [
    { value: 2, label: "2 空格" },
    { value: 4, label: "4 空格" },
    { value: 1, label: "1 空格" }
  ] as const;

  export const WEBTOOLS_CONFIG_DEFAULT_INPUT = `server:
    port: 8080
    servlet:
      context-path: /api
  spring:
    datasource:
      url: jdbc:mysql://localhost:3306/db`;

  export const WEBTOOLS_CONFIG_FORMAT_OPTIONS = [
    { value: "yaml", label: "YAML" },
    { value: "json", label: "JSON" },
    { value: "properties", label: "Properties" }
  ] as const;

  export function buildWebtoolsConfigTarget(): string {
    const params = new URLSearchParams();
    params.set("action", "convert");
    params.set("source", webtoolsConfigSource);
    params.set("target", webtoolsConfigTarget);
    params.set("input", webtoolsConfigInput);
    return `command:plugin:${WEBTOOLS_CONFIG_PLUGIN_ID}?${params.toString()}`;
  }

  export function normalizeWebtoolsConfigFormat(
    value: string | undefined,
    fallback: "yaml" | "json" | "properties"
  ): "yaml" | "json" | "properties" {
    const normalized = (value ?? fallback).trim().toLowerCase();
    if (normalized === "yaml" || normalized === "json" || normalized === "properties") {
      return normalized;
    }
    return fallback;
  }

  export function refreshWebtoolsConfigResultInForm(form: HTMLFormElement): void {
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

  export function scheduleWebtoolsConfigAutoConvert(
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

  export async function executeWebtoolsConfigConvert(
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

  export function normalizeWebtoolsSqlDialect(value: string | undefined): string {
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

  export function normalizeWebtoolsSqlIndent(value: number | string | undefined): number {
    const parsed = typeof value === "number" ? value : Number(value ?? 2);
    if (parsed === 1 || parsed === 2 || parsed === 4) {
      return parsed;
    }
    return 2;
  }

  export function buildWebtoolsSqlTarget(): string {
    const params = new URLSearchParams();
    params.set("action", "format");
    params.set("input", webtoolsSqlInput);
    params.set("dialect", webtoolsSqlDialect);
    params.set("uppercase", webtoolsSqlUppercase ? "1" : "0");
    params.set("indent", String(webtoolsSqlIndent));
    return `command:plugin:${WEBTOOLS_SQL_PLUGIN_ID}?${params.toString()}`;
  }

  export function refreshWebtoolsSqlResultInForm(form: HTMLFormElement): void {
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

  export function scheduleWebtoolsSqlAutoFormat(
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

  export async function executeWebtoolsSqlFormat(
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

  export function normalizeWebtoolsUnitNumber(value: number, fallback: number): number {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return value;
  }

  export function updateWebtoolsUnitStorageFrom(
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

  export function updateWebtoolsUnitFromPixel(pixelValue: number, basePxValue: number): void {
    webtoolsUnitPixel = normalizeWebtoolsUnitNumber(pixelValue, 160);
    webtoolsUnitBasePx = Math.max(1, normalizeWebtoolsUnitNumber(basePxValue, 16));
    webtoolsUnitRem = Number((webtoolsUnitPixel / webtoolsUnitBasePx).toFixed(4));
  }

  export function updateWebtoolsUnitFromRem(remValue: number, basePxValue: number): void {
    webtoolsUnitRem = normalizeWebtoolsUnitNumber(remValue, 10);
    webtoolsUnitBasePx = Math.max(1, normalizeWebtoolsUnitNumber(basePxValue, 16));
    webtoolsUnitPixel = Number((webtoolsUnitRem * webtoolsUnitBasePx).toFixed(2));
  }

  export function formatWebtoolsUnitStorageValue(value: number): string {
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

  export function refreshWebtoolsUnitStorageInputs(form: HTMLFormElement): void {
    form.querySelectorAll<HTMLInputElement>("[data-unit-storage]").forEach((input) => {
      const unit = input.dataset.unitStorage as WebtoolsUnitStorageKey | undefined;
      if (!unit) {
        return;
      }
      input.value = formatWebtoolsUnitStorageValue(webtoolsUnitStorageValues[unit]);
    });
  }

  export function refreshWebtoolsUnitScreenInputs(form: HTMLFormElement): void {
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

  export function refreshWebtoolsUnitCards(form: HTMLFormElement): void {
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

  export function refreshWebtoolsUnitInfo(form: HTMLFormElement): void {
    const infoNode = form.querySelector<HTMLElement>(".webtools-unit-info");
    if (!infoNode) {
      return;
    }

    infoNode.textContent =
      webtoolsUnitActiveTab === "storage"
        ? `当前基准：${formatWebtoolsUnitStorageValue(webtoolsUnitStorageValue)} ${webtoolsUnitStorageUnit}`
        : `1rem = ${Number(webtoolsUnitBasePx.toFixed(4))}px`;
  }

  export function refreshWebtoolsUnitPanelInForm(form: HTMLFormElement): void {
    refreshWebtoolsUnitStorageInputs(form);
    refreshWebtoolsUnitScreenInputs(form);
    refreshWebtoolsUnitCards(form);
    refreshWebtoolsUnitInfo(form);
  }

  export let webtoolsMarkdownInput = "# Markdown 预览\n\n在这里输入 Markdown 内容。";

  export let webtoolsMarkdownHtml = "";

  export let webtoolsMarkdownInfo = "";

  export let webtoolsMarkdownAutoTimer: number | null = null;

  export let webtoolsMarkdownRequestToken = 0;

  export let webtoolsUaInput = "";

  export let webtoolsUaResult: Record<string, string> = {};

  export let webtoolsUaInfo = "";

  export let webtoolsUaError = "";

  export let webtoolsUaAutoTimer: number | null = null;

  export let webtoolsUaRequestToken = 0;

  export function buildWebtoolsMarkdownTarget(input: string): string {
    const params = new URLSearchParams();
    params.set("action", "render");
    params.set("input", input);
    return `command:plugin:${WEBTOOLS_MARKDOWN_PLUGIN_ID}?${params.toString()}`;
  }

  export function refreshWebtoolsMarkdownPanelInForm(form: HTMLFormElement): void {
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

  export function scheduleWebtoolsMarkdownAutoRender(
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

  export async function executeWebtoolsMarkdownRender(
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

  export function buildWebtoolsStringsTarget(action: "convert" | "uuid"): string {
    const params = new URLSearchParams();
    params.set("action", action);
    params.set("input", webtoolsStringsInput);
    params.set("caseType", webtoolsStringsCaseType);
    params.set("count", String(webtoolsStringsUuidCount));
    return `command:plugin:${WEBTOOLS_STRINGS_PLUGIN_ID}?${params.toString()}`;
  }

  export async function executeWebtoolsStringsAction(
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

  export function buildWebtoolsColorsTarget(color: string): string {
    const params = new URLSearchParams();
    params.set("action", "convert");
    params.set("color", color);
    return `command:plugin:${WEBTOOLS_COLORS_PLUGIN_ID}?${params.toString()}`;
  }

  export function getWebtoolsColorsPreviewTextColor(): string {
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

  export function refreshWebtoolsColorsPanelInForm(form: HTMLFormElement): void {
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

  export function scheduleWebtoolsColorsAutoConvert(
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

  export async function executeWebtoolsColorsConvert(
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

  export function buildWebtoolsDiffTarget(): string {
    const params = new URLSearchParams();
    params.set("action", "compare");
    params.set("left", webtoolsDiffLeft);
    params.set("right", webtoolsDiffRight);
    params.set("ignoreCase", webtoolsDiffIgnoreCase ? "1" : "0");
    params.set("ignoreWhitespace", webtoolsDiffIgnoreWhitespace ? "1" : "0");
    return `command:plugin:${WEBTOOLS_DIFF_PLUGIN_ID}?${params.toString()}`;
  }

  export function createWebtoolsDiffStatCard(label: string, value: string): HTMLDivElement {
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

  export function refreshWebtoolsDiffResultInForm(form: HTMLFormElement): void {
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

  export function scheduleWebtoolsDiffAutoCompare(
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

  export async function executeWebtoolsDiffCompare(
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

  export function parseWebtoolsUrlInput(input: string): void {
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

  export function rebuildWebtoolsUrlFromQueryRows(): boolean {
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

  export function refreshWebtoolsUrlPartsInForm(form: HTMLFormElement): void {
    form.querySelectorAll<HTMLInputElement>("[data-webtools-url-part]").forEach((node) => {
      const key = node.dataset.webtoolsUrlPart as keyof WebtoolsUrlParts | undefined;
      if (!key) {
        return;
      }
      node.value = webtoolsUrlState.parts[key] ?? "";
    });
  }

  export function renderWebtoolsUrlQueryEditor(
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

  export function refreshWebtoolsUrlInfoInForm(form: HTMLFormElement): void {
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

  export function refreshWebtoolsUrlPanelInForm(
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

  export function createWebtoolsUrlPartField(
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

  export function buildWebtoolsTimestampTarget(
    action: "toDate" | "toTimestamp",
    input: string
  ): string {
    const params = new URLSearchParams();
    params.set("action", action);
    params.set("input", input);
    params.set("unit", webtoolsTimestampUnit);
    return `command:plugin:${WEBTOOLS_TIMESTAMP_PLUGIN_ID}?${params.toString()}`;
  }

  export function refreshWebtoolsTimestampResultInForm(form: HTMLFormElement): void {
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

  export function refreshWebtoolsPasswordResultInForm(form: HTMLFormElement): void {
    const host = form.querySelector(".webtools-password-result-host");
    if (!(host instanceof HTMLDivElement)) {
      return;
    }
    host.replaceChildren(createWebtoolsPasswordResultTable(webtoolsPasswordRows));
    form.dispatchEvent(new CustomEvent("webtools-password-sync"));
  }

  export async function generateFromWebtoolsPasswordPanel(
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

  export function scheduleWebtoolsTimestampAutoConvert(
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

  export function normalizeWebtoolsTimestampUnit(value: unknown): "s" | "ms" {
    return value === "ms" ? "ms" : "s";
  }

  export function formatWebtoolsTimestampDate(value: Date, withMs = false): string {
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

  export function convertWebtoolsTimestampUnixValue(
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

  export function getWebtoolsTimestampNowUnix(unit: "s" | "ms"): string {
    const nowMs = Date.now();
    if (unit === "ms") {
      return String(nowMs);
    }
    return String(Math.floor(nowMs / 1000));
  }

  export function clearWebtoolsTimestampAutoTimer(): void {
    if (webtoolsTimestampAutoTimer !== null) {
      window.clearTimeout(webtoolsTimestampAutoTimer);
      webtoolsTimestampAutoTimer = null;
    }
  }

  export function clearWebtoolsTimestampClockTimer(): void {
    if (webtoolsTimestampClockTimer !== null) {
      window.clearInterval(webtoolsTimestampClockTimer);
      webtoolsTimestampClockTimer = null;
    }
  }

  export function ensureWebtoolsTimestampDefaults(): void {
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

}
