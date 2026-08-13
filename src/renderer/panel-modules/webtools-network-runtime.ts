namespace RendererPanelRuntime {

  export async function executeWebtoolsTimestampAction(
    action: "toDate" | "toTimestamp",
    input: string,
    options: { render?: boolean; form?: HTMLFormElement } = {}
  ): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("桥接层未加载，无法执行时间戳工具");
      return;
    }
    const shouldRender = options.render ?? true;

    if (action === "toDate") {
      webtoolsTimestampUnixInput = input;
    } else {
      webtoolsTimestampDateInput = input;
    }

    const requestToken =
      action === "toDate"
        ? ++webtoolsTimestampToDateRequestToken
        : ++webtoolsTimestampToTimestampRequestToken;

    const item: LaunchItem = {
      id: `plugin:${WEBTOOLS_TIMESTAMP_PLUGIN_ID}:${action}`,
      type: "command",
      title: "时间戳工具",
      subtitle: "面板执行",
      target: buildWebtoolsTimestampTarget(action, input),
      keywords: ["plugin", "timestamp", "time", "date", "时间戳", "日期", "转换"]
    };

    const result = await launcher.execute(item);
    if (
      (action === "toDate" && requestToken !== webtoolsTimestampToDateRequestToken) ||
      (action === "toTimestamp" &&
        requestToken !== webtoolsTimestampToTimestampRequestToken)
    ) {
      return;
    }

    const data = toRecord(result.data);
    if (data && typeof data.unit === "string") {
      webtoolsTimestampUnit = normalizeWebtoolsTimestampUnit(data.unit);
    }

    if (action === "toDate") {
      webtoolsTimestampDateOutput =
        (data && typeof data.date === "string" && data.date) ||
        (data && typeof data.output === "string" && data.output) ||
        "";
      if (!result.ok) {
        webtoolsTimestampDateOutput = "";
      }
    } else {
      webtoolsTimestampTimestampOutput =
        (data && typeof data.timestamp === "string" && data.timestamp) ||
        (data && typeof data.output === "string" && data.output) ||
        "";
      if (!result.ok) {
        webtoolsTimestampTimestampOutput = "";
      }
    }

    webtoolsTimestampInfo =
      (data && typeof data.info === "string" && data.info) || result.message || "";

    setStatus(result.message ?? (result.ok ? "转换完成" : "转换失败"));
    if (shouldRender) {
      renderList();
      return;
    }
    if (options.form) {
      refreshWebtoolsTimestampResultInForm(options.form);
    }
  }

  export function buildWebtoolsUaTarget(ua: string): string {
    const params = new URLSearchParams();
    params.set("action", "parse");
    params.set("ua", ua);
    return `command:plugin:${WEBTOOLS_UA_PLUGIN_ID}?${params.toString()}`;
  }

  export function refreshWebtoolsUaResultInForm(form: HTMLFormElement): void {
    const copyButton = form.querySelector<HTMLButtonElement>("[data-webtools-ua-copy]");
    if (copyButton) {
      copyButton.disabled = !webtoolsUaInput.trim();
    }

    const infoNode = form.querySelector<HTMLDivElement>(".webtools-ua-info");
    if (infoNode) {
      let text = webtoolsUaInfo || "等待解析结果";
      let state = "idle";
      if (webtoolsUaError) {
        text = webtoolsUaError;
        state = "error";
      } else if (!webtoolsUaInput.trim()) {
        text = "请输入或粘贴 User-Agent";
        state = "empty";
      } else if (Object.keys(webtoolsUaResult).length > 0) {
        text = webtoolsUaInfo || "已自动解析当前 UA";
        state = "ok";
      }
      infoNode.textContent = text;
      infoNode.dataset.state = state;
    }

    const grid = form.querySelector<HTMLDivElement>(".webtools-ua-grid");
    if (!grid) {
      return;
    }
    grid.replaceChildren();

    const fields: Array<{ label: string; value: string; meta?: string }> = [
      {
        label: "浏览器",
        value: [webtoolsUaResult.browser, webtoolsUaResult.browserVersion].filter(Boolean).join(" ") || "-",
        meta: webtoolsUaResult.browserMajor ? `主版本 ${webtoolsUaResult.browserMajor}` : "-"
      },
      {
        label: "系统",
        value: [webtoolsUaResult.os, webtoolsUaResult.osVersion].filter(Boolean).join(" ") || "-"
      },
      {
        label: "设备",
        value:
          [
            webtoolsUaResult.deviceVendor && webtoolsUaResult.deviceVendor !== "-"
              ? webtoolsUaResult.deviceVendor
              : "",
            webtoolsUaResult.deviceModel && webtoolsUaResult.deviceModel !== "-"
              ? webtoolsUaResult.deviceModel
              : ""
          ]
            .filter(Boolean)
            .join(" ") || webtoolsUaResult.device || "-",
        meta: webtoolsUaResult.deviceType || "desktop"
      },
      {
        label: "引擎",
        value: [webtoolsUaResult.engine, webtoolsUaResult.engineVersion].filter(Boolean).join(" ") || "-"
      },
        {
          label: "CPU 架构",
          value: webtoolsUaResult.cpu || "-"
        }
      ];

    fields.forEach(({ label, value, meta }) => {
      const card = document.createElement("div");
      card.className = "webtools-ua-card";
      const labelNode = document.createElement("div");
      labelNode.className = "webtools-ua-card-label";
      labelNode.textContent = label;
      const valueNode = document.createElement("div");
      valueNode.className = "webtools-ua-card-value";
      valueNode.textContent = value || "-";
      card.append(labelNode, valueNode);
      if (meta && meta !== "-") {
        const metaNode = document.createElement("div");
        metaNode.className = "webtools-ua-card-meta";
        metaNode.textContent = meta;
        card.appendChild(metaNode);
      }
      grid.appendChild(card);
    });
  }

  export function scheduleWebtoolsUaAutoParse(
    form: HTMLFormElement,
    immediate = false
  ): void {
    if (webtoolsUaAutoTimer !== null) {
      window.clearTimeout(webtoolsUaAutoTimer);
    }

    webtoolsUaAutoTimer = window.setTimeout(() => {
      webtoolsUaAutoTimer = null;
      if (!form.isConnected) {
        return;
      }

      const node = form.elements.namedItem("webtoolsUaInput");
      const ua = node instanceof HTMLTextAreaElement ? node.value : "";
      if (!ua.trim()) {
        webtoolsUaRequestToken += 1;
        webtoolsUaInput = "";
        webtoolsUaResult = {};
        webtoolsUaInfo = "";
        webtoolsUaError = "";
        refreshWebtoolsUaResultInForm(form);
        setStatus("请输入 UA 字符串");
        return;
      }

      void executeWebtoolsUaParse(ua, { render: false, form });
    }, immediate ? 0 : 220);
  }

  export async function executeWebtoolsUaParse(
    ua: string,
    options: { render?: boolean; form?: HTMLFormElement } = {}
  ): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("桥接层未加载，无法执行 UA 解析");
      return;
    }
    const shouldRender = options.render ?? true;
    const requestToken = ++webtoolsUaRequestToken;

    webtoolsUaInput = ua;
    const item: LaunchItem = {
      id: `plugin:${WEBTOOLS_UA_PLUGIN_ID}:parse`,
      type: "command",
      title: "UA 解析",
      subtitle: "面板执行",
      target: buildWebtoolsUaTarget(ua),
      keywords: ["plugin", "ua", "user-agent", "浏览器", "解析"]
    };

    const result = await launcher.execute(item);
    if (requestToken !== webtoolsUaRequestToken) {
      return;
    }
    const data = toRecord(result.data);
    const parsed: Record<string, string> = {};

    [
      "browser",
      "browserVersion",
      "browserMajor",
      "os",
      "osVersion",
      "device",
      "deviceVendor",
      "deviceModel",
      "deviceType",
      "engine",
      "engineVersion",
      "cpu"
    ].forEach((key) => {
      if (data && typeof data[key] === "string") {
        parsed[key] = data[key] as string;
      }
    });

    webtoolsUaResult = parsed;
    webtoolsUaInfo = data && typeof data.info === "string" ? data.info : "";
    webtoolsUaError = data && typeof data.error === "string" ? data.error : "";
    if (!result.ok && !webtoolsUaError) {
      webtoolsUaError = result.message ?? "UA 解析失败";
    }
    setStatus(result.message ?? (result.ok ? "解析完成" : "解析失败"));
    if (shouldRender) {
      renderList();
      return;
    }
    if (options.form) {
      refreshWebtoolsUaResultInForm(options.form);
    }
  }

  export let webtoolsApiMethod = "GET";

  export let webtoolsApiUrl = "https://jsonplaceholder.typicode.com/posts/1";

  export let webtoolsApiRequestTab: WebtoolsApiRequestTab = "params";

  export let webtoolsApiResponseTab: WebtoolsApiResponseTab = "body";

  export let webtoolsApiParams: WebtoolsApiKvRow[] = [{ key: "", value: "", enabled: true }];

  export let webtoolsApiHeaders: WebtoolsApiKvRow[] = [
    { key: "Content-Type", value: "application/json", enabled: true },
    { key: "", value: "", enabled: true }
  ];

  export let webtoolsApiBodyType: "json" | "text" | "formdata" = "json";

  export let webtoolsApiBodyContent = "{\n  \"title\": \"foo\",\n  \"body\": \"bar\",\n  \"userId\": 1\n}";

  export let webtoolsApiFormRows: WebtoolsApiKvRow[] = [{ key: "", value: "", enabled: true }];

  export let webtoolsApiResponseStatus = "";

  export let webtoolsApiResponseBody = "";

  export let webtoolsApiResponseHeaders: Record<string, string> = {};

  export let webtoolsApiResponseTimeMs = 0;

  export let webtoolsApiResponseSizeText = "";

  export let webtoolsApiResponseUrl = "";

  export let webtoolsApiResponseError = "";

  export let webtoolsApiRequestToken = 0;

  export let webtoolsApiHasResponse = false;

  export let webtoolsApiIsLoading = false;

  export let webtoolsHttpMockRunning = false;

  export let webtoolsHttpMockUrl = "";

  export let webtoolsHttpMockPort = 17777;

  export let webtoolsHttpMockPath = "/mock";

  export let webtoolsHttpMockMethod: WebtoolsHttpMockMethod = "GET";

  export let webtoolsHttpMockStatusCode = 200;

  export let webtoolsHttpMockContentType = "application/json; charset=utf-8";

  export let webtoolsHttpMockBody = '{\n  "ok": true,\n  "source": "LiteLauncher HTTP Mock",\n  "timestamp": "{{now}}"\n}';

  export let webtoolsHttpMockRequestCount = 0;

  export let webtoolsHttpMockInfo = "";

  export let webtoolsHttpMockError = "";

  export let webtoolsHttpMockRequestToken = 0;

  export function parseKeyValueText(text: string): WebtoolsApiKvRow[] {
    const rows: WebtoolsApiKvRow[] = [];
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separator = trimmed.indexOf("=");
      if (separator === -1) {
        rows.push({
          key: trimmed,
          value: "",
          enabled: true
        });
        continue;
      }

      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      if (!key) {
        continue;
      }
      rows.push({
        key,
        value,
        enabled: true
      });
    }

    return rows;
  }

  export function cloneWebtoolsApiRows(rows: WebtoolsApiKvRow[]): WebtoolsApiKvRow[] {
    return rows.map((row) => ({
      key: row.key,
      value: row.value,
      enabled: row.enabled
    }));
  }

  export function normalizeWebtoolsApiRows(
    rows: unknown,
    fallback: WebtoolsApiKvRow[] = [{ key: "", value: "", enabled: true }]
  ): WebtoolsApiKvRow[] {
    if (!Array.isArray(rows)) {
      return cloneWebtoolsApiRows(fallback);
    }

    const normalized: WebtoolsApiKvRow[] = [];
    rows.forEach((value) => {
      const record = toRecord(value);
      if (!record) {
        return;
      }
      normalized.push({
        key: typeof record.key === "string" ? record.key : "",
        value: typeof record.value === "string" ? record.value : "",
        enabled: typeof record.enabled === "boolean" ? record.enabled : true
      });
    });

    return normalized.length > 0 ? normalized : cloneWebtoolsApiRows(fallback);
  }

  export function ensureWebtoolsApiEditableRows(rows: WebtoolsApiKvRow[]): WebtoolsApiKvRow[] {
    return rows.length > 0 ? rows : [{ key: "", value: "", enabled: true }];
  }

  export function syncWebtoolsApiContentTypeHeader(): void {
    const headerIndex = webtoolsApiHeaders.findIndex(
      (row) => row.key.trim().toLowerCase() === "content-type"
    );

    if (webtoolsApiBodyType === "formdata") {
      if (headerIndex >= 0) {
        webtoolsApiHeaders[headerIndex].key = "Content-Type";
        webtoolsApiHeaders[headerIndex].value = "自动处理";
        webtoolsApiHeaders[headerIndex].enabled = false;
        return;
      }
      webtoolsApiHeaders = [
        { key: "Content-Type", value: "自动处理", enabled: false },
        ...webtoolsApiHeaders
      ];
      return;
    }

    const expectedValue = webtoolsApiBodyType === "text" ? "text/plain" : "application/json";
    if (headerIndex >= 0) {
      webtoolsApiHeaders[headerIndex].key = "Content-Type";
      webtoolsApiHeaders[headerIndex].value = expectedValue;
      webtoolsApiHeaders[headerIndex].enabled = true;
      return;
    }

    webtoolsApiHeaders = [
      { key: "Content-Type", value: expectedValue, enabled: true },
      ...webtoolsApiHeaders
    ];
  }

  export function buildWebtoolsApiPreviewUrl(): string {
    const raw = webtoolsApiUrl.trim();
    if (!raw) {
      return "";
    }
    try {
      const url = new URL(raw);
      webtoolsApiParams.forEach((row) => {
        if (row.enabled && row.key.trim()) {
          url.searchParams.set(row.key.trim(), row.value);
        }
      });
      return url.toString();
    } catch {
      try {
        const url = new URL(`https://${raw}`);
        webtoolsApiParams.forEach((row) => {
          if (row.enabled && row.key.trim()) {
            url.searchParams.set(row.key.trim(), row.value);
          }
        });
        return url.toString();
      } catch {
        return raw;
      }
    }
  }

  export function buildWebtoolsApiTarget(): string {
    const params = new URLSearchParams();
    params.set("action", "request");
    params.set("method", webtoolsApiMethod);
    params.set("url", webtoolsApiUrl);
    params.set("params", JSON.stringify(webtoolsApiParams));
    params.set("headers", JSON.stringify(webtoolsApiHeaders));
    params.set("bodyType", webtoolsApiBodyType);
    params.set("bodyContent", webtoolsApiBodyContent);
    params.set("formRows", JSON.stringify(webtoolsApiFormRows));
    return `command:plugin:${WEBTOOLS_API_PLUGIN_ID}?${params.toString()}`;
  }

  export function getWebtoolsApiRowsByGroup(
    group: "params" | "headers" | "formdata"
  ): WebtoolsApiKvRow[] {
    if (group === "params") {
      return webtoolsApiParams;
    }
    if (group === "headers") {
      return webtoolsApiHeaders;
    }
    return webtoolsApiFormRows;
  }

  export function setWebtoolsApiRowsByGroup(
    group: "params" | "headers" | "formdata",
    rows: WebtoolsApiKvRow[]
  ): void {
    if (group === "params") {
      webtoolsApiParams = rows;
      return;
    }
    if (group === "headers") {
      webtoolsApiHeaders = rows;
      return;
    }
    webtoolsApiFormRows = rows;
  }

  export function refreshWebtoolsApiTabs(form: HTMLFormElement): void {
    form.querySelectorAll<HTMLElement>("[data-api-request-tab]").forEach((node) => {
      node.dataset.active = String(node.dataset.apiRequestTab === webtoolsApiRequestTab);
    });
    form.querySelectorAll<HTMLElement>("[data-api-request-panel]").forEach((node) => {
      node.hidden = node.dataset.apiRequestPanel !== webtoolsApiRequestTab;
    });
    form.querySelectorAll<HTMLElement>("[data-api-response-tab]").forEach((node) => {
      node.dataset.active = String(node.dataset.apiResponseTab === webtoolsApiResponseTab);
    });
    form.querySelectorAll<HTMLElement>("[data-api-response-panel]").forEach((node) => {
      node.hidden = node.dataset.apiResponsePanel !== webtoolsApiResponseTab;
    });
  }

  export function refreshWebtoolsApiPreview(form: HTMLFormElement): void {
    const previewNode = form.querySelector<HTMLElement>(".webtools-api-preview");
    if (previewNode) {
      previewNode.textContent = buildWebtoolsApiPreviewUrl() || "-";
    }
  }

  export function refreshWebtoolsApiMethodUi(form: HTMLFormElement): void {
    const methodNode = form.elements.namedItem("webtoolsApiMethod");
    if (methodNode instanceof HTMLSelectElement) {
      methodNode.dataset.method = methodNode.value.trim().toLowerCase();
    }
  }

  export function refreshWebtoolsApiResponseHeadersHost(host: HTMLElement): void {
    host.textContent = "";
    if (Object.keys(webtoolsApiResponseHeaders).length === 0) {
      host.textContent = "暂无响应头";
      return;
    }

    const fragment = document.createDocumentFragment();
    Object.entries(webtoolsApiResponseHeaders).forEach(([key, value]) => {
      const row = document.createElement("div");
      row.className = "webtools-api-header-row";

      const keyNode = document.createElement("span");
      keyNode.className = "webtools-api-header-key";
      keyNode.textContent = `${key}:`;

      const valueNode = document.createElement("span");
      valueNode.className = "webtools-api-header-value";
      valueNode.textContent = value;

      row.append(keyNode, valueNode);
      fragment.appendChild(row);
    });
    host.appendChild(fragment);
  }

  export function refreshWebtoolsApiResponseInForm(form: HTMLFormElement): void {
    refreshWebtoolsApiPreview(form);
    refreshWebtoolsApiTabs(form);
    refreshWebtoolsApiMethodUi(form);

    const sendButton = form.querySelector<HTMLButtonElement>(".webtools-api-send-btn");
    if (sendButton) {
      sendButton.disabled = webtoolsApiIsLoading;
      sendButton.textContent = webtoolsApiIsLoading ? "发送中..." : "发送";
    }

    const copyButton = form.querySelector<HTMLButtonElement>(".webtools-api-copy-btn");
    if (copyButton) {
      const canCopyHeaders =
        webtoolsApiResponseTab === "headers" &&
        Object.keys(webtoolsApiResponseHeaders).length > 0;
      const canCopyBody =
        webtoolsApiResponseTab === "body" && webtoolsApiResponseBody.trim().length > 0;
      copyButton.textContent = webtoolsApiResponseTab === "headers" ? "复制响应头" : "复制响应体";
      copyButton.disabled = !(webtoolsApiHasResponse && (canCopyHeaders || canCopyBody));
    }

    const responseSection = form.querySelector<HTMLElement>(".webtools-api-response-section");
    if (responseSection) {
      responseSection.hidden = !webtoolsApiHasResponse && !webtoolsApiIsLoading;
    }

    const statusNode = form.querySelector<HTMLElement>(".webtools-api-status");
    if (statusNode) {
      statusNode.textContent = webtoolsApiIsLoading
        ? "发送中..."
        : webtoolsApiResponseStatus || "未发送";
      statusNode.dataset.state =
        webtoolsApiIsLoading
          ? "loading"
          : webtoolsApiResponseError
          ? "error"
          : webtoolsApiResponseStatus.startsWith("2")
            ? "ok"
            : webtoolsApiResponseStatus
              ? "warn"
              : "idle";
    }

    const timeNode = form.querySelector<HTMLElement>(".webtools-api-time");
    if (timeNode) {
      timeNode.hidden = webtoolsApiIsLoading || !webtoolsApiHasResponse;
      timeNode.textContent = `${webtoolsApiResponseTimeMs} ms`;
    }

    const sizeNode = form.querySelector<HTMLElement>(".webtools-api-size");
    if (sizeNode) {
      sizeNode.hidden = webtoolsApiIsLoading || !webtoolsApiHasResponse;
      sizeNode.textContent = webtoolsApiResponseSizeText || "0 B";
    }

    const errorNode = form.querySelector<HTMLElement>(".webtools-api-error");
    if (errorNode) {
      errorNode.textContent = webtoolsApiResponseError || "";
      errorNode.hidden = !webtoolsApiResponseError;
    }

    const responseUrlNode = form.querySelector<HTMLElement>(".webtools-api-response-url");
    if (responseUrlNode) {
      responseUrlNode.textContent = webtoolsApiResponseUrl || buildWebtoolsApiPreviewUrl() || "-";
      responseUrlNode.hidden = !webtoolsApiHasResponse && !webtoolsApiIsLoading;
    }

    const responseTabs = form.querySelector<HTMLElement>(".webtools-api-response-tabs");
    if (responseTabs) {
      responseTabs.hidden = !webtoolsApiHasResponse || !!webtoolsApiResponseError;
    }

    const responsePanels = form.querySelector<HTMLElement>(".webtools-api-response-panels");
    if (responsePanels) {
      responsePanels.hidden = !webtoolsApiHasResponse || !!webtoolsApiResponseError;
    }

    const bodyNode = form.querySelector<HTMLElement>(".webtools-api-response-body");
    if (bodyNode) {
      bodyNode.textContent = webtoolsApiIsLoading
        ? "等待响应..."
        : webtoolsApiResponseBody.trim() || "（空响应体）";
    }

    const headersNode = form.querySelector<HTMLElement>(".webtools-api-response-headers-host");
    if (headersNode) {
      refreshWebtoolsApiResponseHeadersHost(headersNode);
    }
  }

  export function createWebtoolsApiRowsEditor(
    form: HTMLFormElement,
    group: "params" | "headers" | "formdata"
  ): HTMLDivElement {
    const wrap = document.createElement("div");
    wrap.className = "webtools-api-kv-list";
    const rows = ensureWebtoolsApiEditableRows(
      cloneWebtoolsApiRows(getWebtoolsApiRowsByGroup(group))
    );
    setWebtoolsApiRowsByGroup(group, rows);

    rows.forEach((row, index) => {
      const rowNode = document.createElement("div");
      rowNode.className = "webtools-api-kv-row";

      const enabled = document.createElement("input");
      enabled.type = "checkbox";
      enabled.checked = row.enabled;
      enabled.className = "password-checkbox";
      enabled.addEventListener("change", () => {
        const target = getWebtoolsApiRowsByGroup(group);
        target[index].enabled = enabled.checked;
        if (group === "params") {
          refreshWebtoolsApiPreview(form);
        }
      });

      const keyInput = document.createElement("input");
      keyInput.className = "settings-value webtools-tool-input";
      keyInput.placeholder = "键";
      keyInput.value = row.key;
      keyInput.addEventListener("input", () => {
        const target = getWebtoolsApiRowsByGroup(group);
        target[index].key = keyInput.value;
        if (group === "params") {
          refreshWebtoolsApiPreview(form);
        }
      });

      const valueInput = document.createElement("input");
      valueInput.className = "settings-value webtools-tool-input";
      valueInput.placeholder = "值";
      valueInput.value = row.value;
      valueInput.addEventListener("input", () => {
        const target = getWebtoolsApiRowsByGroup(group);
        target[index].value = valueInput.value;
        if (group === "params") {
          refreshWebtoolsApiPreview(form);
        }
      });

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "settings-btn settings-btn-secondary webtools-api-row-btn";
      removeButton.textContent = "×";
      removeButton.addEventListener("click", () => {
        const next = ensureWebtoolsApiEditableRows(
          getWebtoolsApiRowsByGroup(group).filter((_, rowIndex) => rowIndex !== index)
        );
        setWebtoolsApiRowsByGroup(group, next);
        renderList();
      });

      rowNode.append(enabled, keyInput, valueInput, removeButton);
      wrap.appendChild(rowNode);
    });

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "settings-btn settings-btn-secondary webtools-api-add-btn";
    addButton.textContent = "+ 添加一行";
    addButton.addEventListener("click", () => {
      const next = [...getWebtoolsApiRowsByGroup(group), { key: "", value: "", enabled: true }];
      setWebtoolsApiRowsByGroup(group, next);
      renderList();
    });
    wrap.appendChild(addButton);

    return wrap;
  }

  export async function executeWebtoolsApiRequest(
    form: HTMLFormElement,
    options: { render?: boolean } = {}
  ): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("桥接层未加载，无法执行 API 调试");
      return;
    }
    const shouldRender = options.render ?? true;
    const requestToken = ++webtoolsApiRequestToken;

    const methodNode = form.elements.namedItem("webtoolsApiMethod");
    const urlNode = form.elements.namedItem("webtoolsApiUrl");
    const bodyTypeNode = form.elements.namedItem("webtoolsApiBodyType");
    const bodyNode = form.elements.namedItem("webtoolsApiBody");

    webtoolsApiMethod = methodNode instanceof HTMLSelectElement ? methodNode.value : "GET";
    webtoolsApiUrl = urlNode instanceof HTMLInputElement ? urlNode.value : "";
    webtoolsApiBodyType =
      bodyTypeNode instanceof HTMLSelectElement || bodyTypeNode instanceof HTMLInputElement
        ? (bodyTypeNode.value as "json" | "text" | "formdata")
        : "json";
    webtoolsApiBodyContent =
      bodyNode instanceof HTMLTextAreaElement ? bodyNode.value : "";
    syncWebtoolsApiContentTypeHeader();
    webtoolsApiIsLoading = true;
    webtoolsApiResponseError = "";
    webtoolsApiHasResponse = false;
    refreshWebtoolsApiResponseInForm(form);

    const item: LaunchItem = {
      id: `plugin:${WEBTOOLS_API_PLUGIN_ID}:request`,
      type: "command",
      title: "API 调试",
      subtitle: "面板执行",
      target: buildWebtoolsApiTarget(),
      keywords: ["plugin", "api", "http", "request", "调试"]
    };

    const result = await launcher.execute(item);
    if (requestToken !== webtoolsApiRequestToken) {
      return;
    }
    const data = toRecord(result.data);
    webtoolsApiIsLoading = false;

    const status = data && typeof data.status === "number" ? data.status : 0;
    const statusText =
      data && typeof data.statusText === "string" ? data.statusText : "";
    webtoolsApiResponseStatus = status ? `${status} ${statusText}` : "请求失败";

    webtoolsApiResponseTimeMs = data && typeof data.timeMs === "number" ? data.timeMs : 0;
    webtoolsApiResponseSizeText =
      data && typeof data.sizeText === "string" ? data.sizeText : "0 B";
    webtoolsApiResponseUrl = data && typeof data.fullUrl === "string" ? data.fullUrl : "";
    webtoolsApiResponseError = status > 0 ? "" : result.message ?? "请求失败";
    webtoolsApiHasResponse =
      Boolean(webtoolsApiResponseStatus) ||
      Boolean(webtoolsApiResponseError) ||
      Boolean(webtoolsApiResponseBody) ||
      Object.keys(webtoolsApiResponseHeaders).length > 0;

    webtoolsApiResponseBody =
      data && typeof data.body === "string" ? data.body : "";
    webtoolsApiResponseHeaders = {};
    const headersRecord = toRecord(data?.headers);
    if (headersRecord) {
      Object.entries(headersRecord).forEach(([key, value]) => {
        if (typeof value === "string") {
          webtoolsApiResponseHeaders[key] = value;
        }
      });
    }

    setStatus(result.message ?? (result.ok ? "请求完成" : "请求失败"));
    if (shouldRender) {
      renderList();
      return;
    }
    refreshWebtoolsApiResponseInForm(form);
  }

  export function normalizeWebtoolsHttpMockMethod(value: string): WebtoolsHttpMockMethod {
    const normalized = value.trim().toUpperCase();
    if (
      normalized === "GET" ||
      normalized === "POST" ||
      normalized === "PUT" ||
      normalized === "PATCH" ||
      normalized === "DELETE" ||
      normalized === "OPTIONS"
    ) {
      return normalized;
    }
    return "GET";
  }

  export function normalizeWebtoolsHttpMockPath(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
      return "/mock";
    }
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  export function buildWebtoolsHttpMockTarget(action: "open" | "start" | "stop" | "status"): string {
    const params = new URLSearchParams();
    params.set("action", action);
    params.set("port", String(webtoolsHttpMockPort));
    params.set("path", webtoolsHttpMockPath);
    params.set("method", webtoolsHttpMockMethod);
    params.set("statusCode", String(webtoolsHttpMockStatusCode));
    params.set("contentType", webtoolsHttpMockContentType);
    params.set("body", webtoolsHttpMockBody);
    return `command:plugin:${WEBTOOLS_HTTP_MOCK_PLUGIN_ID}?${params.toString()}`;
  }

  export function refreshWebtoolsHttpMockPanelInForm(form: HTMLFormElement): void {
    const methodNode = form.elements.namedItem("webtoolsHttpMockMethod");
    if (methodNode instanceof HTMLSelectElement) {
      methodNode.value = webtoolsHttpMockMethod;
    }
    const portNode = form.elements.namedItem("webtoolsHttpMockPort");
    if (portNode instanceof HTMLInputElement) {
      portNode.value = String(webtoolsHttpMockPort);
    }
    const pathNode = form.elements.namedItem("webtoolsHttpMockPath");
    if (pathNode instanceof HTMLInputElement) {
      pathNode.value = webtoolsHttpMockPath;
    }
    const statusNode = form.elements.namedItem("webtoolsHttpMockStatusCode");
    if (statusNode instanceof HTMLInputElement) {
      statusNode.value = String(webtoolsHttpMockStatusCode);
    }
    const contentTypeNode = form.elements.namedItem("webtoolsHttpMockContentType");
    if (contentTypeNode instanceof HTMLInputElement) {
      contentTypeNode.value = webtoolsHttpMockContentType;
    }
    const bodyNode = form.elements.namedItem("webtoolsHttpMockBody");
    if (bodyNode instanceof HTMLTextAreaElement) {
      bodyNode.value = webtoolsHttpMockBody;
    }

    const runtimeNode = form.querySelector<HTMLElement>(".webtools-http-mock-runtime");
    if (runtimeNode) {
      runtimeNode.textContent = webtoolsHttpMockRunning
        ? `运行中：${webtoolsHttpMockMethod} ${webtoolsHttpMockUrl || `http://127.0.0.1:${webtoolsHttpMockPort}${webtoolsHttpMockPath}`}`
        : "当前未启动";
      runtimeNode.dataset.state = webtoolsHttpMockRunning ? "ok" : "idle";
    }

    const countNode = form.querySelector<HTMLElement>(".webtools-http-mock-count");
    if (countNode) {
      countNode.textContent = `请求次数：${webtoolsHttpMockRequestCount}`;
    }

    const infoNode = form.querySelector<HTMLElement>(".webtools-http-mock-info");
    if (infoNode) {
      const text = webtoolsHttpMockError || webtoolsHttpMockInfo || "可配置后启动本地 Mock";
      infoNode.textContent = text;
      infoNode.dataset.state = webtoolsHttpMockError
        ? "error"
        : webtoolsHttpMockRunning
          ? "ok"
          : "idle";
    }
  }

  export async function executeWebtoolsHttpMockAction(
    action: "start" | "stop" | "status",
    form?: HTMLFormElement
  ): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("桥接层未加载，无法执行 HTTP Mock");
      return;
    }

    if (form) {
      const methodNode = form.elements.namedItem("webtoolsHttpMockMethod");
      const portNode = form.elements.namedItem("webtoolsHttpMockPort");
      const pathNode = form.elements.namedItem("webtoolsHttpMockPath");
      const statusNode = form.elements.namedItem("webtoolsHttpMockStatusCode");
      const contentTypeNode = form.elements.namedItem("webtoolsHttpMockContentType");
      const bodyNode = form.elements.namedItem("webtoolsHttpMockBody");

      webtoolsHttpMockMethod =
        methodNode instanceof HTMLSelectElement
          ? normalizeWebtoolsHttpMockMethod(methodNode.value)
          : webtoolsHttpMockMethod;
      if (portNode instanceof HTMLInputElement) {
        const parsed = Number(portNode.value);
        if (Number.isFinite(parsed)) {
          webtoolsHttpMockPort = Math.min(65535, Math.max(1024, Math.floor(parsed)));
        }
      }
      if (pathNode instanceof HTMLInputElement) {
        webtoolsHttpMockPath = normalizeWebtoolsHttpMockPath(pathNode.value);
      }
      if (statusNode instanceof HTMLInputElement) {
        const parsed = Number(statusNode.value);
        if (Number.isFinite(parsed)) {
          webtoolsHttpMockStatusCode = Math.min(599, Math.max(100, Math.floor(parsed)));
        }
      }
      if (contentTypeNode instanceof HTMLInputElement && contentTypeNode.value.trim()) {
        webtoolsHttpMockContentType = contentTypeNode.value.trim();
      }
      if (bodyNode instanceof HTMLTextAreaElement) {
        webtoolsHttpMockBody = bodyNode.value;
      }
    }

    const requestToken = ++webtoolsHttpMockRequestToken;
    const item: LaunchItem = {
      id: `plugin:${WEBTOOLS_HTTP_MOCK_PLUGIN_ID}:${action}`,
      type: "command",
      title: "HTTP Mock Server",
      subtitle: "面板执行",
      target: buildWebtoolsHttpMockTarget(action),
      keywords: ["plugin", "http", "mock", "api"]
    };

    const result = await launcher.execute(item);
    if (requestToken !== webtoolsHttpMockRequestToken) {
      return;
    }

    const data = toRecord(result.data);
    if (typeof data?.running === "boolean") {
      webtoolsHttpMockRunning = data.running;
    }
    if (typeof data?.url === "string") {
      webtoolsHttpMockUrl = data.url;
    }
    if (typeof data?.requestCount === "number" && Number.isFinite(data.requestCount)) {
      webtoolsHttpMockRequestCount = Math.max(0, Math.floor(data.requestCount));
    }
    if (typeof data?.port === "number" && Number.isFinite(data.port)) {
      webtoolsHttpMockPort = Math.min(65535, Math.max(1024, Math.floor(data.port)));
    }
    if (typeof data?.path === "string") {
      webtoolsHttpMockPath = normalizeWebtoolsHttpMockPath(data.path);
    }
    if (typeof data?.method === "string") {
      webtoolsHttpMockMethod = normalizeWebtoolsHttpMockMethod(data.method);
    }
    if (typeof data?.statusCode === "number" && Number.isFinite(data.statusCode)) {
      webtoolsHttpMockStatusCode = Math.min(599, Math.max(100, Math.floor(data.statusCode)));
    }
    if (typeof data?.contentType === "string" && data.contentType.trim()) {
      webtoolsHttpMockContentType = data.contentType;
    }
    if (typeof data?.body === "string") {
      webtoolsHttpMockBody = data.body;
    }

    webtoolsHttpMockError = result.ok ? "" : result.message || "HTTP Mock 执行失败";
    webtoolsHttpMockInfo = result.message || (result.ok ? "执行完成" : "执行失败");
    setStatus(result.message ?? (result.ok ? "HTTP Mock 执行完成" : "HTTP Mock 执行失败"));
    if (form) {
      refreshWebtoolsHttpMockPanelInForm(form);
    }
  }

  export let webtoolsQrText = "LiteLauncher 本地二维码示例";

  export let webtoolsQrSize = 300;

  export let webtoolsQrLevel = "M";

  export let webtoolsQrDarkColor = "#102136";

  export let webtoolsQrLightColor = "#ffffff";

  export let webtoolsQrLogoMode: "none" | "text" | "image" = "none";

  export let webtoolsQrLogoText = "";

  export let webtoolsQrLogoImageDataUrl = "";

  export let webtoolsQrLogoImageName = "";

  export let webtoolsQrUrl = "";

  export let webtoolsQrInfo = "";

  export let webtoolsQrAutoTimer: number | null = null;

  export let webtoolsQrRequestToken = 0;

  export let webtoolsFileHashFilePath = "";

  export let webtoolsFileHashAlgorithm: WebtoolsFileHashAlgorithm = "sha256";

  export let webtoolsFileHashExpectedHash = "";

  export let webtoolsFileHashOutput = "";

  export let webtoolsFileHashInfo = "";

  export let webtoolsFileHashError = "";

  export let webtoolsFileHashSize = "";

  export let webtoolsFileHashMatched: boolean | null = null;

  export let webtoolsFileHashRequestToken = 0;

  export let webtoolsPortHelperPort = "";

  export let webtoolsPortHelperProtocol: WebtoolsPortHelperProtocol = "all";

  export let webtoolsPortHelperPid = "";

  export let webtoolsPortHelperRecords: WebtoolsPortHelperRecord[] = [];

  export let webtoolsPortHelperInfo = "";

  export let webtoolsPortHelperError = "";

  export let webtoolsPortHelperBusy = false;

  export let webtoolsPortHelperRequestToken = 0;

  export function normalizeWebtoolsQrcodeColor(value: string, fallback: string): string {
    const trimmed = value.trim();
    const matched = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!matched) {
      return fallback;
    }

    const hex = matched[1].toLowerCase();
    if (hex.length === 3) {
      return `#${hex
        .split("")
        .map((char) => `${char}${char}`)
        .join("")}`;
    }

    return `#${hex}`;
  }

  export function buildWebtoolsQrcodeTarget(): string {
    const params = new URLSearchParams();
    params.set("action", "generate");
    params.set("text", webtoolsQrText);
    params.set("size", String(webtoolsQrSize));
    params.set("level", webtoolsQrLevel);
    params.set("darkColor", webtoolsQrDarkColor);
    params.set("lightColor", webtoolsQrLightColor);
    params.set("logoMode", webtoolsQrLogoMode);
    params.set("logoText", webtoolsQrLogoText);
    params.set("logoImageDataUrl", webtoolsQrLogoImageDataUrl);
    return `command:plugin:${WEBTOOLS_QRCODE_PLUGIN_ID}?${params.toString()}`;
  }

  export async function executeWebtoolsQrcodeGenerate(form: HTMLFormElement): Promise<void> {
    await executeWebtoolsQrcodeGenerateInForm(form);
  }

  export function readWebtoolsQrcodeFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => {
        reject(new Error("读取 Logo 图片失败"));
      };
      reader.onload = () => {
        if (typeof reader.result === "string" && reader.result.startsWith("data:image/")) {
          resolve(reader.result);
          return;
        }
        reject(new Error("Logo 图片格式无效"));
      };
      reader.readAsDataURL(file);
    });
  }

  export function loadWebtoolsQrcodeImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("加载图片失败"));
      image.src = src;
    });
  }

  export async function normalizeWebtoolsQrcodeLogoImage(
    file: File
  ): Promise<{ dataUrl: string; name: string }> {
    if (!file.type.startsWith("image/")) {
      throw new Error("请选择图片文件作为 Logo");
    }

    const rawDataUrl = await readWebtoolsQrcodeFileAsDataUrl(file);
    const image = await loadWebtoolsQrcodeImage(rawDataUrl);
    const longestSide = Math.max(image.naturalWidth || 0, image.naturalHeight || 0);
    const limit = 256;
    const scale = longestSide > limit ? limit / longestSide : 1;
    const width = Math.max(1, Math.round((image.naturalWidth || 1) * scale));
    const height = Math.max(1, Math.round((image.naturalHeight || 1) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("浏览器画布不可用，无法处理 Logo");
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return {
      dataUrl: canvas.toDataURL("image/png"),
      name: file.name
    };
  }

  export async function downloadWebtoolsQrcodePng(): Promise<void> {
    if (!webtoolsQrUrl) {
      throw new Error("当前没有可下载的二维码");
    }

    const image = await loadWebtoolsQrcodeImage(webtoolsQrUrl);
    const size = Math.max(100, Math.round(webtoolsQrSize) || 300);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("浏览器画布不可用，无法导出 PNG");
    }

    context.clearRect(0, 0, size, size);
    context.drawImage(image, 0, 0, size, size);
    const downloadUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "qrcode.png";
    link.click();
  }

  export function refreshWebtoolsQrcodePanelInForm(form: HTMLFormElement): void {
    const previewHost = form.querySelector("[data-webtools-qrcode-preview]");
    if (previewHost instanceof HTMLDivElement) {
      previewHost.textContent = "";
      const box = document.createElement("div");
      box.className = "webtools-qrcode-preview-box";
      if (webtoolsQrUrl) {
        const image = document.createElement("img");
        image.className = "webtools-qrcode-preview-image";
        image.src = webtoolsQrUrl;
        image.alt = "qrcode";
        box.appendChild(image);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "webtools-qrcode-placeholder";
        placeholder.textContent = "输入二维码内容后自动生成";
        box.appendChild(placeholder);
      }
      previewHost.appendChild(box);
    }

    const infoNode = form.querySelector(".webtools-qrcode-info");
    if (infoNode instanceof HTMLDivElement) {
      infoNode.textContent = webtoolsQrInfo || "输入后自动生成";
    }

    const darkColorValueNode = form.querySelector<HTMLElement>("[data-webtools-qrcode-dark-value]");
    if (darkColorValueNode) {
      darkColorValueNode.textContent = webtoolsQrDarkColor;
    }

    const lightColorValueNode = form.querySelector<HTMLElement>("[data-webtools-qrcode-light-value]");
    if (lightColorValueNode) {
      lightColorValueNode.textContent = webtoolsQrLightColor;
    }

    const downloadButton =
      form.querySelector<HTMLButtonElement>("[data-webtools-qrcode-download]");
    if (downloadButton) {
      downloadButton.disabled = !webtoolsQrUrl;
    }

    const logoMetaNode = form.querySelector<HTMLElement>("[data-webtools-qrcode-logo-meta]");
    if (logoMetaNode) {
      if (webtoolsQrLogoMode === "text" && webtoolsQrLogoText.trim()) {
        logoMetaNode.textContent = `当前：文字 Logo（${webtoolsQrLogoText.trim()}）`;
      } else if (webtoolsQrLogoMode === "image" && webtoolsQrLogoImageDataUrl) {
        logoMetaNode.textContent = `当前：图片 Logo${webtoolsQrLogoImageName ? `（${webtoolsQrLogoImageName}）` : ""}`;
      } else {
        logoMetaNode.textContent = "当前：无 Logo";
      }
    }

    const logoTextField = form.querySelector<HTMLElement>("[data-webtools-qrcode-logo-text-field]");
    if (logoTextField) {
      logoTextField.hidden = webtoolsQrLogoMode !== "text";
    }

    const logoImageField = form.querySelector<HTMLElement>("[data-webtools-qrcode-logo-image-field]");
    if (logoImageField) {
      logoImageField.hidden = webtoolsQrLogoMode !== "image";
    }

    const logoImageNameNode = form.querySelector<HTMLElement>("[data-webtools-qrcode-logo-image-name]");
    if (logoImageNameNode) {
      logoImageNameNode.textContent = webtoolsQrLogoImageName || "未选择图片";
    }

    const clearLogoButton =
      form.querySelector<HTMLButtonElement>("[data-webtools-qrcode-clear-logo]");
    if (clearLogoButton) {
      const hasLogo =
        (webtoolsQrLogoMode === "text" && webtoolsQrLogoText.trim().length > 0) ||
        (webtoolsQrLogoMode === "image" && webtoolsQrLogoImageDataUrl.length > 0);
      clearLogoButton.hidden = !hasLogo;
    }
  }

  export function scheduleWebtoolsQrcodeAutoGenerate(
    form: HTMLFormElement,
    immediate = false
  ): void {
    if (webtoolsQrAutoTimer !== null) {
      window.clearTimeout(webtoolsQrAutoTimer);
    }

    webtoolsQrAutoTimer = window.setTimeout(() => {
      webtoolsQrAutoTimer = null;
      if (!form.isConnected) {
        return;
      }
      void executeWebtoolsQrcodeGenerateInForm(form, { render: false });
    }, immediate ? 0 : 180);
  }

  export async function executeWebtoolsQrcodeGenerateInForm(
    form: HTMLFormElement,
    options: { render?: boolean } = {}
  ): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("桥接层未加载，无法执行二维码工具");
      return;
    }
    const shouldRender = options.render ?? true;

    const textNode = form.elements.namedItem("webtoolsQrText");
    const sizeNode = form.elements.namedItem("webtoolsQrSize");
    const levelNode = form.elements.namedItem("webtoolsQrLevel");
    const darkColorNode = form.elements.namedItem("webtoolsQrDarkColor");
    const lightColorNode = form.elements.namedItem("webtoolsQrLightColor");
    const logoModeNode = form.elements.namedItem("webtoolsQrLogoMode");
    const logoTextNode = form.elements.namedItem("webtoolsQrLogoText");

    webtoolsQrText = textNode instanceof HTMLTextAreaElement ? textNode.value : "";
    webtoolsQrSize = sizeNode instanceof HTMLInputElement ? Number(sizeNode.value) : 300;
    webtoolsQrLevel = levelNode instanceof HTMLSelectElement ? levelNode.value : "M";
    webtoolsQrDarkColor =
      darkColorNode instanceof HTMLInputElement
        ? normalizeWebtoolsQrcodeColor(darkColorNode.value, "#102136")
        : "#102136";
    webtoolsQrLightColor =
      lightColorNode instanceof HTMLInputElement
        ? normalizeWebtoolsQrcodeColor(lightColorNode.value, "#ffffff")
        : "#ffffff";
    webtoolsQrLogoMode =
      logoModeNode instanceof HTMLSelectElement &&
      (logoModeNode.value === "text" || logoModeNode.value === "image")
        ? logoModeNode.value
        : "none";
    webtoolsQrLogoText =
      logoTextNode instanceof HTMLInputElement ? logoTextNode.value.trim().slice(0, 40) : "";

    if (!webtoolsQrText.trim()) {
      webtoolsQrRequestToken += 1;
      webtoolsQrUrl = "";
      webtoolsQrInfo = "等待输入二维码内容";
      refreshWebtoolsQrcodePanelInForm(form);
      setStatus("等待输入二维码内容");
      return;
    }

    const requestToken = ++webtoolsQrRequestToken;

    const item: LaunchItem = {
      id: `plugin:${WEBTOOLS_QRCODE_PLUGIN_ID}:generate`,
      type: "command",
      title: "二维码生成",
      subtitle: "面板执行",
      target: buildWebtoolsQrcodeTarget(),
      keywords: ["plugin", "qrcode", "qr", "二维码", "生成"]
    };

    const result = await launcher.execute(item);
    if (requestToken !== webtoolsQrRequestToken) {
      return;
    }
    const data = toRecord(result.data);
    webtoolsQrUrl = data && typeof data.qrUrl === "string" ? data.qrUrl : "";
    webtoolsQrInfo = data && typeof data.info === "string" ? data.info : "";
    webtoolsQrDarkColor =
      data && typeof data.darkColor === "string"
        ? normalizeWebtoolsQrcodeColor(data.darkColor, webtoolsQrDarkColor)
        : webtoolsQrDarkColor;
    webtoolsQrLightColor =
      data && typeof data.lightColor === "string"
        ? normalizeWebtoolsQrcodeColor(data.lightColor, webtoolsQrLightColor)
        : webtoolsQrLightColor;

    setStatus(result.message ?? (result.ok ? "生成完成" : "生成失败"));
    if (shouldRender) {
      renderList();
      return;
    }
    refreshWebtoolsQrcodePanelInForm(form);
  }

  export function normalizeWebtoolsFileHashAlgorithm(value: string): WebtoolsFileHashAlgorithm {
    const normalized = value.trim().toLowerCase();
    if (
      normalized === "md5" ||
      normalized === "sha1" ||
      normalized === "sha256" ||
      normalized === "sha512"
    ) {
      return normalized;
    }
    return "sha256";
  }

  export function buildWebtoolsFileHashTarget(action: "hash"): string {
    const params = new URLSearchParams();
    params.set("action", action);
    params.set("filePath", webtoolsFileHashFilePath);
    params.set("algorithm", webtoolsFileHashAlgorithm);
    params.set("expectedHash", webtoolsFileHashExpectedHash);
    return `command:plugin:${WEBTOOLS_FILE_HASH_PLUGIN_ID}?${params.toString()}`;
  }

  export function refreshWebtoolsFileHashPanelInForm(form: HTMLFormElement): void {
    const pathNode = form.elements.namedItem("webtoolsFileHashPath");
    if (pathNode instanceof HTMLInputElement) {
      pathNode.value = webtoolsFileHashFilePath;
    }

    const algorithmNode = form.elements.namedItem("webtoolsFileHashAlgorithm");
    if (algorithmNode instanceof HTMLSelectElement) {
      algorithmNode.value = webtoolsFileHashAlgorithm;
    }

    const expectedNode = form.elements.namedItem("webtoolsFileHashExpected");
    if (expectedNode instanceof HTMLInputElement) {
      expectedNode.value = webtoolsFileHashExpectedHash;
    }

    const outputNode = form.elements.namedItem("webtoolsFileHashOutput");
    if (outputNode instanceof HTMLTextAreaElement) {
      outputNode.value = webtoolsFileHashOutput;
    }

    const verifyNode = form.querySelector<HTMLElement>(".webtools-file-hash-verify");
    if (verifyNode) {
      if (!webtoolsFileHashExpectedHash.trim()) {
        verifyNode.textContent = "未设置期望哈希（仅展示计算结果）";
        verifyNode.dataset.state = "idle";
      } else if (webtoolsFileHashMatched === true) {
        verifyNode.textContent = "校验结果：匹配";
        verifyNode.dataset.state = "ok";
      } else if (webtoolsFileHashMatched === false) {
        verifyNode.textContent = "校验结果：不匹配";
        verifyNode.dataset.state = "error";
      } else {
        verifyNode.textContent = "请输入文件并执行计算";
        verifyNode.dataset.state = "idle";
      }
    }

    const fileInfoNode = form.querySelector<HTMLElement>(".webtools-file-hash-size");
    if (fileInfoNode) {
      const filePath = webtoolsFileHashFilePath.trim();
      if (filePath && webtoolsFileHashSize) {
        fileInfoNode.textContent = `${filePath} · ${webtoolsFileHashSize}`;
      } else {
        fileInfoNode.textContent = filePath || "未选择文件";
      }
    }

    const infoNode = form.querySelector<HTMLElement>(".webtools-file-hash-info");
    if (infoNode) {
      const text = webtoolsFileHashError || webtoolsFileHashInfo || "输入文件路径后点击计算";
      infoNode.textContent = text;
      infoNode.dataset.state = webtoolsFileHashError
        ? "error"
        : webtoolsFileHashOutput
          ? "ok"
          : "idle";
    }
  }

  export async function executeWebtoolsFileHashCalculate(form: HTMLFormElement): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("桥接层未加载，无法执行文件哈希");
      return;
    }

    const pathNode = form.elements.namedItem("webtoolsFileHashPath");
    const algorithmNode = form.elements.namedItem("webtoolsFileHashAlgorithm");
    const expectedNode = form.elements.namedItem("webtoolsFileHashExpected");

    webtoolsFileHashFilePath = pathNode instanceof HTMLInputElement ? pathNode.value.trim() : "";
    webtoolsFileHashAlgorithm =
      algorithmNode instanceof HTMLSelectElement
        ? normalizeWebtoolsFileHashAlgorithm(algorithmNode.value)
        : "sha256";
    webtoolsFileHashExpectedHash =
      expectedNode instanceof HTMLInputElement ? expectedNode.value.trim() : "";
    webtoolsFileHashError = "";
    webtoolsFileHashInfo = "计算中...";
    refreshWebtoolsFileHashPanelInForm(form);

    const requestToken = ++webtoolsFileHashRequestToken;
    const item: LaunchItem = {
      id: `plugin:${WEBTOOLS_FILE_HASH_PLUGIN_ID}:hash`,
      type: "command",
      title: "文件哈希",
      subtitle: "面板执行",
      target: buildWebtoolsFileHashTarget("hash"),
      keywords: ["plugin", "hash", "checksum", "file", "文件哈希"]
    };

    const result = await launcher.execute(item);
    if (requestToken !== webtoolsFileHashRequestToken) {
      return;
    }

    const data = toRecord(result.data);
    if (typeof data?.filePath === "string") {
      webtoolsFileHashFilePath = data.filePath;
    }
    if (typeof data?.algorithm === "string") {
      webtoolsFileHashAlgorithm = normalizeWebtoolsFileHashAlgorithm(data.algorithm);
    }
    if (typeof data?.expectedHash === "string") {
      webtoolsFileHashExpectedHash = data.expectedHash;
    }
    if (typeof data?.hash === "string") {
      webtoolsFileHashOutput = data.hash;
    } else if (!result.ok) {
      webtoolsFileHashOutput = "";
    }
    if (typeof data?.matched === "boolean") {
      webtoolsFileHashMatched = data.matched;
    } else {
      webtoolsFileHashMatched = null;
    }
    if (typeof data?.size === "number" && Number.isFinite(data.size) && data.size >= 0) {
      webtoolsFileHashSize = formatHardwareInspectorBytes(data.size);
    } else {
      webtoolsFileHashSize = "";
    }
    if (typeof data?.info === "string") {
      webtoolsFileHashInfo = data.info;
    }

    const matchedError = typeof data?.matched === "boolean" ? data.matched === false : false;
    webtoolsFileHashError = !result.ok && !matchedError ? result.message || "哈希计算失败" : "";
    if (!webtoolsFileHashError && result.message) {
      webtoolsFileHashInfo = result.message;
    }
    setStatus(result.message ?? (result.ok ? "哈希计算完成" : "哈希计算失败"));
    refreshWebtoolsFileHashPanelInForm(form);
  }

  export function normalizeWebtoolsPortHelperProtocol(value: string): WebtoolsPortHelperProtocol {
    const normalized = value.trim().toLowerCase();
    if (normalized === "all" || normalized === "tcp" || normalized === "udp") {
      return normalized;
    }
    return "all";
  }

  export function parseWebtoolsPortHelperRecords(value: unknown): WebtoolsPortHelperRecord[] {
    if (!Array.isArray(value)) {
      return [];
    }

    const result: WebtoolsPortHelperRecord[] = [];
    value.forEach((item) => {
      const record = toRecord(item);
      if (!record) {
        return;
      }
      const localPort = Number(record.localPort);
      const pid = Number(record.pid);
      if (!Number.isInteger(localPort) || !Number.isInteger(pid)) {
        return;
      }
      result.push({
        protocol: typeof record.protocol === "string" ? record.protocol : "-",
        localAddress: typeof record.localAddress === "string" ? record.localAddress : "-",
        localPort,
        remoteAddress: typeof record.remoteAddress === "string" ? record.remoteAddress : "-",
        state: typeof record.state === "string" ? record.state : "-",
        pid,
        processName: typeof record.processName === "string" ? record.processName : ""
      });
    });

    return result;
  }

  export function buildWebtoolsPortHelperTarget(
    action: "query" | "kill",
    pidOverride?: string | null
  ): string {
    const params = new URLSearchParams();
    params.set("action", action);
    const portValue = webtoolsPortHelperPort.trim();
    if (portValue) {
      params.set("port", portValue);
    }
    params.set("protocol", webtoolsPortHelperProtocol);
    const pidValue = (pidOverride ?? webtoolsPortHelperPid).trim();
    if (pidValue) {
      params.set("pid", pidValue);
    }
    return `command:plugin:${WEBTOOLS_PORT_HELPER_PLUGIN_ID}?${params.toString()}`;
  }

}
