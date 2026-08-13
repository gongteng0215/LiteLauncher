namespace RendererPanelRuntime {

  export function refreshWebtoolsPortHelperPanelInForm(form: HTMLFormElement): void {
    const portNode = form.elements.namedItem("webtoolsPortHelperPort");
    if (portNode instanceof HTMLInputElement) {
      portNode.value = webtoolsPortHelperPort;
    }

    const protocolNode = form.elements.namedItem("webtoolsPortHelperProtocol");
    if (protocolNode instanceof HTMLSelectElement) {
      protocolNode.value = webtoolsPortHelperProtocol;
    }

    const pidNode = form.elements.namedItem("webtoolsPortHelperPid");
    if (pidNode instanceof HTMLInputElement) {
      pidNode.value = webtoolsPortHelperPid;
    }

    const queryButton = form.querySelector<HTMLButtonElement>("[data-webtools-port-query]");
    if (queryButton) {
      queryButton.disabled = webtoolsPortHelperBusy;
      queryButton.textContent = webtoolsPortHelperBusy ? "查询中..." : "查询占用";
    }

    const killButton = form.querySelector<HTMLButtonElement>("[data-webtools-port-kill]");
    if (killButton) {
      killButton.disabled = webtoolsPortHelperBusy;
    }

    const infoNode = form.querySelector<HTMLElement>(".webtools-port-helper-info");
    if (infoNode) {
      const text =
        webtoolsPortHelperError ||
        webtoolsPortHelperInfo ||
        "端口/PID 二选一，可组合筛选；都留空则查询全部占用";
      infoNode.textContent = text;
      infoNode.dataset.state = webtoolsPortHelperError
        ? "error"
        : webtoolsPortHelperRecords.length > 0
          ? "ok"
          : "idle";
    }

    const recordsNode = form.querySelector<HTMLElement>(".webtools-port-helper-results");
    if (!recordsNode) {
      return;
    }
    recordsNode.textContent = "";

    if (webtoolsPortHelperRecords.length === 0) {
      const empty = document.createElement("div");
      empty.className = "webtools-port-helper-empty";
      empty.textContent = webtoolsPortHelperBusy ? "正在查询..." : "暂无端口占用记录";
      recordsNode.appendChild(empty);
      return;
    }

    webtoolsPortHelperRecords.forEach((record) => {
      const row = document.createElement("div");
      row.className = "webtools-port-helper-row";

      const left = document.createElement("div");
      left.className = "webtools-port-helper-row-main";
      const address = document.createElement("div");
      address.className = "webtools-port-helper-row-address webtools-tool-code";
      address.textContent = `${record.protocol} ${record.localAddress} -> ${record.remoteAddress}`;
      const meta = document.createElement("div");
      meta.className = "webtools-port-helper-row-meta";
      const processText = record.processName || "未知进程";
      meta.textContent = `PID ${record.pid} · ${processText} · ${record.state || "-"}`;
      left.append(address, meta);

      const actionGroup = document.createElement("div");
      actionGroup.className = "webtools-port-helper-row-actions";

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "settings-btn settings-btn-secondary";
      copyButton.textContent = "复制";
      copyButton.addEventListener("click", () => {
        const line = `${record.protocol} ${record.localAddress} -> ${record.remoteAddress} | PID ${record.pid} | ${record.processName || "未知进程"} | ${record.state}`;
        void (async () => {
          const copied = await copyTextToClipboard(line);
          setStatus(copied ? "已复制端口记录" : "复制失败");
        })();
      });

      const rowKillButton = document.createElement("button");
      rowKillButton.type = "button";
      rowKillButton.className = "settings-btn settings-btn-secondary";
      rowKillButton.textContent = "结束进程";
      rowKillButton.disabled = webtoolsPortHelperBusy;
      rowKillButton.addEventListener("click", () => {
        void executeWebtoolsPortHelperAction("kill", form, String(record.pid));
      });

      actionGroup.append(copyButton, rowKillButton);
      row.append(left, actionGroup);
      recordsNode.appendChild(row);
    });
  }

  export async function executeWebtoolsPortHelperAction(
    action: "query" | "kill",
    form?: HTMLFormElement,
    pidOverride?: string | null
  ): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("桥接层未加载，无法执行端口助手");
      return;
    }

    if (form) {
      const portNode = form.elements.namedItem("webtoolsPortHelperPort");
      const protocolNode = form.elements.namedItem("webtoolsPortHelperProtocol");
      const pidNode = form.elements.namedItem("webtoolsPortHelperPid");
      webtoolsPortHelperPort = portNode instanceof HTMLInputElement ? portNode.value.trim() : "";
      webtoolsPortHelperProtocol =
        protocolNode instanceof HTMLSelectElement
          ? normalizeWebtoolsPortHelperProtocol(protocolNode.value)
          : "all";
      webtoolsPortHelperPid = pidNode instanceof HTMLInputElement ? pidNode.value.trim() : "";
    }

    const portRaw = webtoolsPortHelperPort.trim();
    const hasPort = portRaw.length > 0;
    if (hasPort) {
      const portNumber = Number(portRaw);
      if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
        webtoolsPortHelperError = "端口需为 1-65535，留空可查询全部";
        webtoolsPortHelperInfo = "";
        setStatus(webtoolsPortHelperError);
        if (form) {
          refreshWebtoolsPortHelperPanelInForm(form);
        }
        return;
      }
      webtoolsPortHelperPort = String(Math.floor(portNumber));
    } else {
      webtoolsPortHelperPort = "";
    }

    const pidRaw =
      typeof pidOverride === "string" && pidOverride.trim()
        ? pidOverride.trim()
        : webtoolsPortHelperPid.trim();
    const hasPid = pidRaw.length > 0;
    let normalizedPid = "";
    if (hasPid) {
      const pidNumber = Number(pidRaw);
      if (!Number.isInteger(pidNumber) || pidNumber <= 0) {
        webtoolsPortHelperError = "PID 必须为正整数";
        webtoolsPortHelperInfo = "";
        setStatus(webtoolsPortHelperError);
        if (form) {
          refreshWebtoolsPortHelperPanelInForm(form);
        }
        return;
      }
      normalizedPid = String(Math.floor(pidNumber));
      if (!(action === "kill" && typeof pidOverride === "string" && pidOverride.trim())) {
        webtoolsPortHelperPid = normalizedPid;
      }
    } else {
      webtoolsPortHelperPid = "";
    }
    if (action === "kill" && !hasPort && !hasPid) {
      webtoolsPortHelperError = "结束进程时请填写端口或 PID";
      webtoolsPortHelperInfo = "";
      setStatus(webtoolsPortHelperError);
      if (form) {
        refreshWebtoolsPortHelperPanelInForm(form);
      }
      return;
    }

    webtoolsPortHelperBusy = true;
    webtoolsPortHelperError = "";
    webtoolsPortHelperInfo = action === "kill" ? "正在结束进程..." : "正在查询端口占用...";
    if (form) {
      refreshWebtoolsPortHelperPanelInForm(form);
    }

    const requestToken = ++webtoolsPortHelperRequestToken;
    const item: LaunchItem = {
      id: `plugin:${WEBTOOLS_PORT_HELPER_PLUGIN_ID}:${action}`,
      type: "command",
      title: "端口助手",
      subtitle: "面板执行",
      target: buildWebtoolsPortHelperTarget(action, normalizedPid || null),
      keywords: ["plugin", "port", "pid", "netstat", "端口", "占用"]
    };

    const result = await launcher.execute(item);
    if (requestToken !== webtoolsPortHelperRequestToken) {
      return;
    }

    webtoolsPortHelperBusy = false;
    const data = toRecord(result.data);

    if (typeof data?.port === "number" && Number.isFinite(data.port)) {
      webtoolsPortHelperPort = String(Math.floor(data.port));
    } else if (typeof data?.port === "string" && data.port.trim()) {
      webtoolsPortHelperPort = data.port.trim();
    }
    if (typeof data?.protocol === "string") {
      webtoolsPortHelperProtocol = normalizeWebtoolsPortHelperProtocol(data.protocol);
    }
    webtoolsPortHelperRecords = parseWebtoolsPortHelperRecords(data?.records);

    webtoolsPortHelperError = result.ok ? "" : result.message || "端口操作失败";
    if (typeof data?.info === "string" && data.info.trim()) {
      webtoolsPortHelperInfo = data.info;
    } else if (result.message) {
      webtoolsPortHelperInfo = result.message;
    }
    setStatus(result.message ?? (result.ok ? "端口助手执行完成" : "端口助手执行失败"));

    if (form) {
      refreshWebtoolsPortHelperPanelInForm(form);
    }
  }

  export function buildWebtoolsJwtTarget(action: "parse" | "sign" | "verify"): string {
    const params = new URLSearchParams();
    params.set("action", action);
    params.set("mode", webtoolsJwtMode);
    params.set("algorithm", webtoolsJwtAlgorithm);
    params.set("jweAlg", webtoolsJwtJweAlg);
    params.set("jweEnc", webtoolsJwtJweEnc);
    params.set("token", webtoolsJwtToken);
    params.set("header", webtoolsJwtHeader);
    params.set("payload", webtoolsJwtPayload);
    params.set("secret", webtoolsJwtSecret);
    return `command:plugin:${WEBTOOLS_JWT_PLUGIN_ID}?${params.toString()}`;
  }

  export function getWebtoolsJwtSecretLabel(mode: "jws" | "jwe", algorithm: "HS256" | "RS256"): string {
    if (mode === "jwe") {
      return "密钥 / 解密密钥";
    }
    if (algorithm === "RS256") {
      return "密钥 / PEM 密钥";
    }
    return "密钥 / Secret";
  }

  export function getWebtoolsJwtSecretPlaceholder(
    mode: "jws" | "jwe",
    algorithm: "HS256" | "RS256",
    jweAlg: "dir" | "A256KW"
  ): string {
    if (mode === "jwe") {
      return jweAlg === "A256KW"
        ? "输入 A256KW 密钥，生成与解密都使用同一包装密钥"
        : "输入 JWE Secret，系统会按长度自动补零/截断";
    }
    if (algorithm === "RS256") {
      return "签名时填 PKCS8 私钥，解析/校验时填 SPKI 公钥";
    }
    return "输入 HS256 Secret";
  }

  export function getWebtoolsJwtStatusContent(): {
    text: string;
    state: "ok" | "error" | "idle";
  } {
    if (webtoolsJwtVerified === true) {
      return {
        text: webtoolsJwtMode === "jwe" ? "解密 / 校验通过" : "签名验证通过",
        state: "ok"
      };
    }
    if (webtoolsJwtVerified === false) {
      return {
        text: webtoolsJwtMode === "jwe" ? "解密 / 校验失败" : "签名验证失败",
        state: "error"
      };
    }
    if (webtoolsJwtInfo.trim()) {
      return {
        text: webtoolsJwtInfo,
        state: "idle"
      };
    }
    return {
      text: "等待输入 Token 或编辑 Header / Payload",
      state: "idle"
    };
  }

  export function refreshWebtoolsJwtModeUi(form: HTMLFormElement): void {
    const modeNode = form.elements.namedItem("webtoolsJwtMode");
    const mode = modeNode instanceof HTMLInputElement && modeNode.value === "jwe" ? "jwe" : "jws";

    const jwsBtn = form.querySelector('.webtools-jwt-mode-btn[data-mode=\"jws\"]');
    const jweBtn = form.querySelector('.webtools-jwt-mode-btn[data-mode=\"jwe\"]');
    if (jwsBtn instanceof HTMLButtonElement) {
      jwsBtn.classList.toggle("active", mode === "jws");
    }
    if (jweBtn instanceof HTMLButtonElement) {
      jweBtn.classList.toggle("active", mode === "jwe");
    }

    const jwsControls = form.querySelector(".webtools-jwt-jws-controls");
    const jweControls = form.querySelector(".webtools-jwt-jwe-controls");
    if (jwsControls instanceof HTMLDivElement) {
      jwsControls.style.display = mode === "jws" ? "" : "none";
    }
    if (jweControls instanceof HTMLDivElement) {
      jweControls.style.display = mode === "jwe" ? "" : "none";
    }

    const secretLabelNode = form.querySelector(".webtools-jwt-secret-caption");
    if (secretLabelNode instanceof HTMLSpanElement) {
      secretLabelNode.textContent = getWebtoolsJwtSecretLabel(mode, webtoolsJwtAlgorithm);
    }

    const secretInput = form.elements.namedItem("webtoolsJwtSecret");
    if (secretInput instanceof HTMLInputElement) {
      secretInput.placeholder = getWebtoolsJwtSecretPlaceholder(
        mode,
        webtoolsJwtAlgorithm,
        webtoolsJwtJweAlg
      );
    }
  }

  export function refreshWebtoolsJwtResultInForm(form: HTMLFormElement): void {
    const tokenNode = form.elements.namedItem("webtoolsJwtToken");
    const headerNode = form.elements.namedItem("webtoolsJwtHeader");
    const payloadNode = form.elements.namedItem("webtoolsJwtPayload");
    const secretNode = form.elements.namedItem("webtoolsJwtSecret");
    const modeNode = form.elements.namedItem("webtoolsJwtMode");
    const algorithmNode = form.elements.namedItem("webtoolsJwtAlgorithm");
    const jweAlgNode = form.elements.namedItem("webtoolsJwtJweAlg");
    const jweEncNode = form.elements.namedItem("webtoolsJwtJweEnc");

    if (tokenNode instanceof HTMLTextAreaElement) {
      tokenNode.value = webtoolsJwtToken;
    }
    if (headerNode instanceof HTMLTextAreaElement) {
      headerNode.value = webtoolsJwtHeader;
    }
    if (payloadNode instanceof HTMLTextAreaElement) {
      payloadNode.value = webtoolsJwtPayload;
    }
    if (secretNode instanceof HTMLInputElement) {
      secretNode.value = webtoolsJwtSecret;
    }
    if (modeNode instanceof HTMLInputElement) {
      modeNode.value = webtoolsJwtMode;
    }
    if (algorithmNode instanceof HTMLSelectElement) {
      algorithmNode.value = webtoolsJwtAlgorithm;
    }
    if (jweAlgNode instanceof HTMLSelectElement) {
      jweAlgNode.value = webtoolsJwtJweAlg;
    }
    if (jweEncNode instanceof HTMLSelectElement) {
      jweEncNode.value = webtoolsJwtJweEnc;
    }
    refreshWebtoolsJwtModeUi(form);

    const status = getWebtoolsJwtStatusContent();
    const statusNode = form.querySelector(".webtools-jwt-status");
    if (statusNode instanceof HTMLDivElement) {
      statusNode.dataset.state = status.state;
    }
    const statusTextNode = form.querySelector(".webtools-jwt-status-text");
    if (statusTextNode instanceof HTMLSpanElement) {
      statusTextNode.textContent = status.text;
    }

    const copyButton = form.querySelector(".webtools-jwt-copy-btn");
    if (copyButton instanceof HTMLButtonElement) {
      copyButton.disabled = webtoolsJwtToken.trim().length === 0;
    }

    const infoNode = form.querySelector(".webtools-jwt-info");
    if (infoNode instanceof HTMLDivElement) {
      infoNode.textContent = webtoolsJwtInfo;
      infoNode.style.display =
        webtoolsJwtInfo && webtoolsJwtInfo !== status.text ? "" : "none";
    }
  }

  export function scheduleWebtoolsJwtAutoParse(form: HTMLFormElement, immediate = false): void {
    if (webtoolsJwtAutoTimer !== null) {
      window.clearTimeout(webtoolsJwtAutoTimer);
    }

    webtoolsJwtAutoTimer = window.setTimeout(() => {
      webtoolsJwtAutoTimer = null;
      if (!form.isConnected) {
        return;
      }

      const tokenNode = form.elements.namedItem("webtoolsJwtToken");
      if (!(tokenNode instanceof HTMLTextAreaElement)) {
        return;
      }

      if (tokenNode.value.trim().length === 0) {
        webtoolsJwtToken = "";
        webtoolsJwtVerified = null;
        webtoolsJwtInfo = "";
        refreshWebtoolsJwtResultInForm(form);
        setStatus("就绪");
        return;
      }

      void executeWebtoolsJwtAction("parse", form, { render: false });
    }, immediate ? 0 : 260);
  }

  export function scheduleWebtoolsJwtAutoSign(form: HTMLFormElement, immediate = false): void {
    if (webtoolsJwtSignTimer !== null) {
      window.clearTimeout(webtoolsJwtSignTimer);
    }

    webtoolsJwtSignTimer = window.setTimeout(() => {
      webtoolsJwtSignTimer = null;
      if (!form.isConnected) {
        return;
      }

      const headerNode = form.elements.namedItem("webtoolsJwtHeader");
      const payloadNode = form.elements.namedItem("webtoolsJwtPayload");
      const tokenNode = form.elements.namedItem("webtoolsJwtToken");

      const hasHeader = headerNode instanceof HTMLTextAreaElement && headerNode.value.trim().length > 0;
      const hasPayload =
        payloadNode instanceof HTMLTextAreaElement && payloadNode.value.trim().length > 0;
      const hasToken = tokenNode instanceof HTMLTextAreaElement && tokenNode.value.trim().length > 0;

      if (!hasHeader && !hasPayload && !hasToken) {
        return;
      }

      void executeWebtoolsJwtAction("sign", form, { render: false });
    }, immediate ? 0 : 280);
  }

  export async function executeWebtoolsJwtAction(
    action: "parse" | "sign" | "verify",
    form: HTMLFormElement,
    options: { render?: boolean } = {}
  ): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("桥接层未加载，无法执行 JWT 工具");
      return;
    }
    const shouldRender = options.render ?? true;

    const tokenNode = form.elements.namedItem("webtoolsJwtToken");
    const headerNode = form.elements.namedItem("webtoolsJwtHeader");
    const payloadNode = form.elements.namedItem("webtoolsJwtPayload");
    const secretNode = form.elements.namedItem("webtoolsJwtSecret");
    const modeNode = form.elements.namedItem("webtoolsJwtMode");
    const algorithmNode = form.elements.namedItem("webtoolsJwtAlgorithm");
    const jweAlgNode = form.elements.namedItem("webtoolsJwtJweAlg");
    const jweEncNode = form.elements.namedItem("webtoolsJwtJweEnc");

    webtoolsJwtToken = tokenNode instanceof HTMLTextAreaElement ? tokenNode.value : "";
    webtoolsJwtHeader =
      headerNode instanceof HTMLTextAreaElement ? headerNode.value : "";
    webtoolsJwtPayload =
      payloadNode instanceof HTMLTextAreaElement ? payloadNode.value : "";
    webtoolsJwtSecret = secretNode instanceof HTMLInputElement ? secretNode.value : "";
    webtoolsJwtMode = modeNode instanceof HTMLInputElement && modeNode.value === "jwe" ? "jwe" : "jws";
    webtoolsJwtAlgorithm =
      algorithmNode instanceof HTMLSelectElement && algorithmNode.value === "RS256"
        ? "RS256"
        : "HS256";
    webtoolsJwtJweAlg =
      jweAlgNode instanceof HTMLSelectElement && jweAlgNode.value === "A256KW"
        ? "A256KW"
        : "dir";
    webtoolsJwtJweEnc =
      jweEncNode instanceof HTMLSelectElement && jweEncNode.value === "A128GCM"
        ? "A128GCM"
        : "A256GCM";
    if (!webtoolsJwtSecret.trim()) {
      webtoolsJwtSecret = WEBTOOLS_JWT_DEFAULT_SECRET;
    }
    const requestToken = ++webtoolsJwtRequestToken;

    const item: LaunchItem = {
      id: `plugin:${WEBTOOLS_JWT_PLUGIN_ID}:${action}`,
      type: "command",
      title: "JWT 工具",
      subtitle: "面板执行",
      target: buildWebtoolsJwtTarget(action),
      keywords: ["plugin", "jwt", "token", "verify", "sign", "鉴权"]
    };

    const result = await launcher.execute(item);
    if (requestToken !== webtoolsJwtRequestToken) {
      return;
    }
    const data = toRecord(result.data);

    if (data && typeof data.token === "string") {
      webtoolsJwtToken = data.token;
    }
    if (data && typeof data.header === "string") {
      webtoolsJwtHeader = data.header;
    }
    if (data && typeof data.payload === "string") {
      webtoolsJwtPayload = data.payload;
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
    webtoolsJwtVerified =
      data && typeof data.verified === "boolean" ? data.verified : null;
    webtoolsJwtInfo =
      data && typeof data.info === "string" ? data.info : "";

    setStatus(result.message ?? (result.ok ? "执行完成" : "执行失败"));
    if (shouldRender) {
      renderList();
      return;
    }
    refreshWebtoolsJwtResultInForm(form);
  }

  export function buildWebtoolsPasswordGenerateTarget(
    options: WebtoolsPasswordOptions
  ): string {
    const params = new URLSearchParams();
    params.set("action", "generate");
    params.set("copy", "0");
    params.set("length", String(options.length));
    params.set("count", String(options.count));
    params.set("lower", options.includeLowercase ? "1" : "0");
    params.set("upper", options.includeUppercase ? "1" : "0");
    params.set("digits", options.includeDigits ? "1" : "0");
    params.set("symbols", options.includeSymbols ? "1" : "0");
    params.set("symbolChars", options.symbolChars);
    params.set("excludeSimilar", options.excludeSimilar ? "1" : "0");
    return `command:plugin:${WEBTOOLS_PASSWORD_PLUGIN_ID}?${params.toString()}`;
  }

  export function extractWebtoolsPasswordOptionsFromUnknown(
    value: unknown
  ): Partial<WebtoolsPasswordOptions> {
    const record = toRecord(value);
    if (!record) {
      return {};
    }

    return {
      length: typeof record.length === "number" ? record.length : undefined,
      count: typeof record.count === "number" ? record.count : undefined,
      includeLowercase:
        typeof record.includeLowercase === "boolean"
          ? record.includeLowercase
          : undefined,
      includeUppercase:
        typeof record.includeUppercase === "boolean"
          ? record.includeUppercase
          : undefined,
      includeDigits:
        typeof record.includeDigits === "boolean" ? record.includeDigits : undefined,
      includeSymbols:
        typeof record.includeSymbols === "boolean" ? record.includeSymbols : undefined,
      symbolChars:
        typeof record.symbolChars === "string" ? record.symbolChars : undefined,
      excludeSimilar:
        typeof record.excludeSimilar === "boolean"
          ? record.excludeSimilar
          : undefined
    };
  }

  export function normalizeWebtoolsPasswordOptions(
    inputOptions: Partial<WebtoolsPasswordOptions>,
    base: WebtoolsPasswordOptions = webtoolsPasswordOptions
  ): WebtoolsPasswordOptions {
    let includeLowercase =
      typeof inputOptions.includeLowercase === "boolean"
        ? inputOptions.includeLowercase
        : base.includeLowercase;
    let includeUppercase =
      typeof inputOptions.includeUppercase === "boolean"
        ? inputOptions.includeUppercase
        : base.includeUppercase;
    let includeDigits =
      typeof inputOptions.includeDigits === "boolean"
        ? inputOptions.includeDigits
        : base.includeDigits;
    const includeSymbols =
      typeof inputOptions.includeSymbols === "boolean"
        ? inputOptions.includeSymbols
        : base.includeSymbols;
    const excludeSimilar =
      typeof inputOptions.excludeSimilar === "boolean"
        ? inputOptions.excludeSimilar
        : base.excludeSimilar;

    if (!includeLowercase && !includeUppercase && !includeDigits && !includeSymbols) {
      includeLowercase = true;
      includeUppercase = true;
      includeDigits = true;
    }

    const symbolCharsRaw =
      typeof inputOptions.symbolChars === "string"
        ? inputOptions.symbolChars
        : base.symbolChars;
    const symbolChars = (symbolCharsRaw || WEBTOOLS_PASSWORD_DEFAULT_SYMBOLS).trim();

    const selectedGroupsCount =
      Number(includeLowercase) +
      Number(includeUppercase) +
      Number(includeDigits) +
      Number(includeSymbols);
    const requiredLength = Math.max(1, selectedGroupsCount);
    const length = Math.max(
      requiredLength,
      clampPasswordLength(inputOptions.length ?? base.length, base.length)
    );

    return {
      length,
      count: clampWebtoolsPasswordCount(inputOptions.count ?? base.count, base.count),
      includeLowercase,
      includeUppercase,
      includeDigits,
      includeSymbols,
      symbolChars,
      excludeSimilar
    };
  }

  export function normalizeStrength(value: string | undefined): WebtoolsPasswordResultRow["strength"] {
    if (value === "弱" || value === "中" || value === "强" || value === "很强") {
      return value;
    }
    return "中";
  }

  export function extractWebtoolsPasswordRows(result: ExecuteResult): WebtoolsPasswordResultRow[] {
    const rawRows = result.data?.rows;
    if (Array.isArray(rawRows)) {
      const parsed: WebtoolsPasswordResultRow[] = [];
      for (const item of rawRows) {
        const record = toRecord(item);
        if (!record) {
          continue;
        }

        if (typeof record.password !== "string") {
          continue;
        }

        const password = record.password.trim();
        if (!password) {
          continue;
        }

        parsed.push({
          password,
          strength: normalizeStrength(
            typeof record.strength === "string" ? record.strength : undefined
          )
        });
      }

      if (parsed.length > 0) {
        return parsed;
      }
    }

    return extractGeneratedPasswords(result).map((password) => ({
      password,
      strength: "中"
    }));
  }

  export function parseWebtoolsJsonPreviewSummary(value: unknown): WebtoolsJsonPreviewSummary | null {
    const record = toRecord(value);
    if (!record || typeof record.summary !== "string" || typeof record.kind !== "string") {
      return null;
    }

    const fields = Array.isArray(record.fields)
      ? record.fields
          .map((item) => {
            const field = toRecord(item);
            if (!field || typeof field.key !== "string") {
              return null;
            }
            const nextField: WebtoolsJsonPreviewField = {
              key: field.key,
            };
            if (typeof field.count === "number") {
              nextField.count = field.count;
            }
            return nextField;
          })
          .filter((item): item is WebtoolsJsonPreviewField => item !== null)
      : [];

    const sampleRows = Array.isArray(record.sampleRows)
      ? record.sampleRows
          .map((item) => toRecord(item))
          .filter((item): item is Record<string, unknown> => item !== null)
      : [];

    if (
      record.kind !== "json-object" &&
      record.kind !== "json-array" &&
      record.kind !== "csv" &&
      record.kind !== "text" &&
      record.kind !== "escaped" &&
      record.kind !== "unknown"
    ) {
      return null;
    }

    return {
      kind: record.kind,
      summary: record.summary,
      fields,
      sampleRows
    };
  }

  export function createWebtoolsPasswordResultTable(
    rows: WebtoolsPasswordResultRow[]
  ): HTMLDivElement {
    const outputRow = document.createElement("div");
    outputRow.className = "password-output-row";

    const outputLabel = document.createElement("div");
    outputLabel.className = "settings-row-label";
    outputLabel.textContent = "生成结果";

    const tableWrap = document.createElement("div");
    tableWrap.className = "webtools-password-table-wrap";

    if (rows.length === 0) {
      const empty = document.createElement("div");
      empty.className = "password-result-empty";
      empty.textContent = "点击“生成密码”后，结果会显示在这里";
      tableWrap.appendChild(empty);
      outputRow.append(outputLabel, tableWrap);
      return outputRow;
    }

    const table = document.createElement("table");
    table.className = "webtools-password-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    ["#", "密码", "强度", ""].forEach((title) => {
      const th = document.createElement("th");
      th.textContent = title;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);

    const tbody = document.createElement("tbody");
    rows.forEach((row, index) => {
      const tr = document.createElement("tr");

      const indexCell = document.createElement("td");
      indexCell.textContent = String(index + 1);

      const passwordCell = document.createElement("td");
      passwordCell.className = "webtools-password-cell-value";
      passwordCell.textContent = row.password;
      passwordCell.title = row.password;

      const strengthCell = document.createElement("td");
      const strengthBadge = document.createElement("span");
      strengthBadge.className = "webtools-password-strength";
      if (row.strength === "弱") {
        strengthBadge.classList.add("webtools-password-strength-weak");
      } else if (row.strength === "中") {
        strengthBadge.classList.add("webtools-password-strength-medium");
      } else if (row.strength === "强") {
        strengthBadge.classList.add("webtools-password-strength-strong");
      } else {
        strengthBadge.classList.add("webtools-password-strength-very-strong");
      }
      strengthBadge.textContent = row.strength;
      strengthCell.appendChild(strengthBadge);

      const actionCell = document.createElement("td");
      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "settings-btn settings-btn-secondary webtools-password-copy-btn";
      copyButton.textContent = "复制";
      copyButton.addEventListener("click", () => {
        void (async () => {
          const copied = await copyTextToClipboard(row.password);
          if (copied) {
            setStatus(`已复制第 ${index + 1} 条密码`);
            return;
          }
          setStatus("复制失败，请手动复制");
        })();
      });
      actionCell.appendChild(copyButton);

      tr.append(indexCell, passwordCell, strengthCell, actionCell);
      tbody.appendChild(tr);
    });

    table.append(thead, tbody);
    tableWrap.appendChild(table);
    outputRow.append(outputLabel, tableWrap);
    return outputRow;
  }

  export function buildWebtoolsJsonTarget(action: "convert" | "validate" = "convert"): string {
    const params = new URLSearchParams();
    params.set("action", action);
    params.set("input", webtoolsJsonState.input);
    params.set("sourceFormat", webtoolsJsonState.sourceFormat);
    params.set("targetFormat", webtoolsJsonState.targetFormat);
    params.set("compressed", webtoolsJsonState.compressed ? "1" : "0");
    return `command:plugin:${WEBTOOLS_JSON_PLUGIN_ID}?${params.toString()}`;
  }

  export function buildWebtoolsJsonInfoState(): {
    text: string;
    state: "ok" | "error" | "idle";
  } {
    if (webtoolsJsonState.valid === true) {
      return {
        text: `校验通过${webtoolsJsonState.info ? ` · ${webtoolsJsonState.info}` : ""}`,
        state: "ok"
      };
    }
    if (webtoolsJsonState.valid === false) {
      return {
        text: `处理失败${webtoolsJsonState.info ? ` · ${webtoolsJsonState.info}` : ""}`,
        state: "error"
      };
    }
    return {
      text: webtoolsJsonState.info || "请选择格式并输入，结果会自动转换",
      state: "idle"
    };
  }

  export function refreshWebtoolsJsonResultInForm(form: HTMLFormElement): void {
    const outputNode = form.elements.namedItem("webtoolsJsonOutput");
    if (outputNode instanceof HTMLTextAreaElement) {
      outputNode.value = webtoolsJsonState.output;
    }

    const inputMetaNode = form.querySelector<HTMLElement>(".webtools-json-input-meta");
    if (inputMetaNode) {
      inputMetaNode.textContent = webtoolsJsonState.sourceFormat.toUpperCase();
    }

    const outputMetaNode = form.querySelector<HTMLElement>(".webtools-json-output-meta");
    if (outputMetaNode) {
      outputMetaNode.textContent = webtoolsJsonState.targetFormat.toUpperCase();
    }

    const errorNode = form.querySelector<HTMLDivElement>(".webtools-json-error");
    if (errorNode) {
      const hasError = webtoolsJsonState.valid === false && Boolean(webtoolsJsonState.info);
      const positionText =
        hasError && typeof webtoolsJsonState.errorPosition === "number"
          ? `（位置 ${webtoolsJsonState.errorPosition}）`
          : "";
      errorNode.textContent = hasError ? `${webtoolsJsonState.info}${positionText}` : "";
      errorNode.hidden = !hasError;
    }

    const infoNode = form.querySelector(".webtools-json-info");
    if (infoNode instanceof HTMLDivElement) {
      const infoState = buildWebtoolsJsonInfoState();
      infoNode.textContent = infoState.text;
      infoNode.dataset.state = infoState.state;
    }

    form.dispatchEvent(new CustomEvent("webtools-json-sync"));
  }

  export function scheduleWebtoolsJsonAutoConvert(
    form: HTMLFormElement,
    immediate = false
  ): void {
    if (webtoolsJsonAutoTimer !== null) {
      window.clearTimeout(webtoolsJsonAutoTimer);
    }

    webtoolsJsonAutoTimer = window.setTimeout(() => {
      webtoolsJsonAutoTimer = null;
      if (!form.isConnected) {
        return;
      }
      void executeWebtoolsJsonConvert(form, { render: false });
    }, immediate ? 0 : 220);
  }

  export function buildWebtoolsJsonSchemaTarget(action: "validate" = "validate"): string {
    const params = new URLSearchParams();
    params.set("action", action);
    params.set("schema", webtoolsJsonSchemaText);
    params.set("payload", webtoolsJsonSchemaPayload);
    return `command:plugin:${WEBTOOLS_JSON_SCHEMA_PLUGIN_ID}?${params.toString()}`;
  }

  export function refreshWebtoolsJsonSchemaResultInForm(form: HTMLFormElement): void {
    const infoNode = form.querySelector<HTMLDivElement>(".webtools-json-schema-info");
    if (infoNode) {
      infoNode.dataset.state =
        webtoolsJsonSchemaValid === true
          ? "ok"
          : webtoolsJsonSchemaValid === false
            ? "error"
            : "idle";
      infoNode.textContent =
        webtoolsJsonSchemaInfo ||
        (webtoolsJsonSchemaValid === true
          ? "校验通过"
          : "输入 Schema 与 Payload，结果会自动校验");
    }

    const errorsNode = form.querySelector<HTMLUListElement>(".webtools-json-schema-errors");
    if (errorsNode) {
      errorsNode.replaceChildren();
      for (const error of webtoolsJsonSchemaErrors) {
        const item = document.createElement("li");
        item.className = "webtools-json-schema-error-item";
        const pathNode = document.createElement("code");
        pathNode.className = "webtools-json-schema-error-path";
        pathNode.textContent = error.path || "/";
        const messageNode = document.createElement("span");
        messageNode.className = "webtools-json-schema-error-message";
        messageNode.textContent = error.message;
        item.append(pathNode, messageNode);
        errorsNode.appendChild(item);
      }
      errorsNode.hidden = webtoolsJsonSchemaErrors.length === 0;
    }
  }

  export function scheduleWebtoolsJsonSchemaAutoValidate(
    form: HTMLFormElement,
    immediate = false
  ): void {
    if (webtoolsJsonSchemaAutoTimer !== null) {
      window.clearTimeout(webtoolsJsonSchemaAutoTimer);
    }

    webtoolsJsonSchemaAutoTimer = window.setTimeout(() => {
      webtoolsJsonSchemaAutoTimer = null;
      if (!form.isConnected) {
        return;
      }
      void executeWebtoolsJsonSchemaValidate(form, { render: false });
    }, immediate ? 0 : 220);
  }

  export async function executeWebtoolsJsonSchemaValidate(
    form: HTMLFormElement,
    options: { render?: boolean } = {}
  ): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("桥接层未加载，无法执行 JSON Schema 校验");
      return;
    }

    const shouldRender = options.render ?? true;
    const schemaNode = form.elements.namedItem("webtoolsJsonSchemaText");
    const payloadNode = form.elements.namedItem("webtoolsJsonSchemaPayload");
    webtoolsJsonSchemaText =
      schemaNode instanceof HTMLTextAreaElement ? schemaNode.value : webtoolsJsonSchemaText;
    webtoolsJsonSchemaPayload =
      payloadNode instanceof HTMLTextAreaElement ? payloadNode.value : webtoolsJsonSchemaPayload;

    const requestToken = ++webtoolsJsonSchemaRequestToken;
    const result = await launcher.execute({
      id: `plugin:${WEBTOOLS_JSON_SCHEMA_PLUGIN_ID}:validate`,
      type: "command",
      title: "JSON Schema 校验",
      subtitle: "",
      target: buildWebtoolsJsonSchemaTarget(),
      keywords: ["plugin", "json-schema"]
    });

    if (requestToken !== webtoolsJsonSchemaRequestToken) {
      return;
    }

    const data = toRecord(result.data);
    webtoolsJsonSchemaValid =
      typeof data?.valid === "boolean" ? data.valid : result.ok ? true : false;
    webtoolsJsonSchemaInfo =
      typeof result.message === "string"
        ? result.message
        : typeof data?.schemaError === "string"
          ? data.schemaError
          : typeof data?.payloadError === "string"
            ? data.payloadError
            : "";
    webtoolsJsonSchemaErrors = Array.isArray(data?.errors)
      ? data.errors
          .map((entry) => toRecord(entry))
          .filter((entry): entry is Record<string, unknown> => Boolean(entry))
          .map((entry) => ({
            path: typeof entry.path === "string" ? entry.path : "/",
            message: typeof entry.message === "string" ? entry.message : "校验失败"
          }))
      : [];

    refreshWebtoolsJsonSchemaResultInForm(form);
    setStatus(webtoolsJsonSchemaInfo || (webtoolsJsonSchemaValid ? "校验通过" : "校验失败"));
    if (shouldRender) {
      renderList();
    }
  }

  export function buildWebtoolsDataMaskTarget(
    action: "mask" | "generate" = webtoolsDataMaskMode
  ): string {
    const params = new URLSearchParams();
    params.set("action", action);
    params.set("input", webtoolsDataMaskInput);
    params.set("maskPhone", webtoolsDataMaskPhone ? "1" : "0");
    params.set("maskEmail", webtoolsDataMaskEmail ? "1" : "0");
    params.set("maskIdCard", webtoolsDataMaskIdCard ? "1" : "0");
    params.set("fakeKind", webtoolsDataMaskFakeKind);
    params.set("fakeCount", String(webtoolsDataMaskFakeCount));
    return `command:plugin:${WEBTOOLS_DATA_MASK_PLUGIN_ID}?${params.toString()}`;
  }

  export function refreshWebtoolsDataMaskResultInForm(form: HTMLFormElement): void {
    const outputNode = form.elements.namedItem("webtoolsDataMaskOutput");
    if (outputNode instanceof HTMLTextAreaElement) {
      outputNode.value = webtoolsDataMaskOutput;
    }

    const infoNode = form.querySelector<HTMLDivElement>(".webtools-data-mask-info");
    if (infoNode) {
      infoNode.textContent = webtoolsDataMaskInfo || "选择脱敏规则或假数据类型后执行";
      infoNode.dataset.state = webtoolsDataMaskOutput.trim() ? "ok" : "idle";
    }
  }

  export async function executeWebtoolsDataMaskAction(
    form: HTMLFormElement,
    action: "mask" | "generate",
    options: { render?: boolean } = {}
  ): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("桥接层未加载，无法执行文本脱敏");
      return;
    }

    const shouldRender = options.render ?? true;
    const inputNode = form.elements.namedItem("webtoolsDataMaskInput");
    webtoolsDataMaskInput =
      inputNode instanceof HTMLTextAreaElement ? inputNode.value : webtoolsDataMaskInput;
    webtoolsDataMaskMode = action;

    const phoneNode = form.elements.namedItem("webtoolsDataMaskPhone");
    const emailNode = form.elements.namedItem("webtoolsDataMaskEmail");
    const idNode = form.elements.namedItem("webtoolsDataMaskIdCard");
    if (phoneNode instanceof HTMLInputElement) {
      webtoolsDataMaskPhone = phoneNode.checked;
    }
    if (emailNode instanceof HTMLInputElement) {
      webtoolsDataMaskEmail = emailNode.checked;
    }
    if (idNode instanceof HTMLInputElement) {
      webtoolsDataMaskIdCard = idNode.checked;
    }

    const kindNode = form.elements.namedItem("webtoolsDataMaskFakeKind");
    if (kindNode instanceof HTMLSelectElement) {
      webtoolsDataMaskFakeKind = kindNode.value as WebtoolsDataMaskFakeKind;
    }
    const countNode = form.elements.namedItem("webtoolsDataMaskFakeCount");
    if (countNode instanceof HTMLInputElement) {
      webtoolsDataMaskFakeCount = Math.max(1, Math.min(50, Number(countNode.value) || 5));
    }

    const result = await launcher.execute({
      id: `plugin:${WEBTOOLS_DATA_MASK_PLUGIN_ID}:${action}`,
      type: "command",
      title: "文本脱敏 / 假数据",
      subtitle: "",
      target: buildWebtoolsDataMaskTarget(action),
      keywords: ["plugin", "data-mask"]
    });

    const data = toRecord(result.data);
    webtoolsDataMaskOutput = typeof data?.output === "string" ? data.output : "";
    webtoolsDataMaskInfo = typeof result.message === "string" ? result.message : "";
    refreshWebtoolsDataMaskResultInForm(form);
    setStatus(webtoolsDataMaskInfo || (result.ok ? "处理完成" : "处理失败"));
    if (shouldRender) {
      renderList();
    }
  }

  export async function executeWebtoolsJsonConvert(
    form: HTMLFormElement,
    options: { render?: boolean; action?: "convert" | "validate" } = {}
  ): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("桥接层未加载，无法执行 JSON 工具");
      return;
    }
    const shouldRender = options.render ?? true;
    const action = options.action ?? "convert";

    const inputNode = form.elements.namedItem("webtoolsJsonInput");
    const sourceNode = form.elements.namedItem("webtoolsJsonSource");
    const targetNode = form.elements.namedItem("webtoolsJsonTarget");
    const compressedNode = form.elements.namedItem("webtoolsJsonCompressed");

    webtoolsJsonState.input =
      inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
    webtoolsJsonState.sourceFormat =
      sourceNode instanceof HTMLSelectElement &&
      (sourceNode.value === "json" ||
        sourceNode.value === "csv" ||
        sourceNode.value === "text" ||
        sourceNode.value === "escaped")
        ? sourceNode.value
        : "text";
    webtoolsJsonState.targetFormat =
      targetNode instanceof HTMLSelectElement &&
      (targetNode.value === "json" ||
        targetNode.value === "csv" ||
        targetNode.value === "text" ||
        targetNode.value === "escaped")
        ? targetNode.value
        : "json";
    webtoolsJsonState.compressed =
      compressedNode instanceof HTMLInputElement ? compressedNode.checked : false;
    const requestToken = ++webtoolsJsonRequestToken;

    const item: LaunchItem = {
      id: `plugin:${WEBTOOLS_JSON_PLUGIN_ID}:convert`,
      type: "command",
      title: "JSON 工具",
      subtitle: "面板执行",
      target: buildWebtoolsJsonTarget(action),
      keywords: ["plugin", "json", "csv", "format", "convert", "实验室"]
    };

    const result = await launcher.execute(item);
    if (requestToken !== webtoolsJsonRequestToken) {
      return;
    }
    const data = toRecord(result.data);

    if (action !== "validate") {
      webtoolsJsonState.output =
        data && typeof data.output === "string" ? data.output : "";
    }
    webtoolsJsonState.info =
      data && typeof data.info === "string" ? data.info : "";
    webtoolsJsonState.valid =
      data && typeof data.valid === "boolean" ? data.valid : null;
    webtoolsJsonState.preview = parseWebtoolsJsonPreviewSummary(data?.preview);
    webtoolsJsonState.errorPosition =
      data && typeof data.errorPosition === "number" ? data.errorPosition : null;
    const availableFields = new Set(
      (webtoolsJsonState.preview?.fields ?? []).map((field) => field.key)
    );
    webtoolsJsonState.selectedFields = webtoolsJsonState.selectedFields.filter((field) =>
      availableFields.has(field)
    );

    setStatus(result.message ?? (result.ok ? "转换完成" : "转换失败"));
    if (shouldRender) {
      renderList();
      return;
    }
    refreshWebtoolsJsonResultInForm(form);
  }

  export function escapeWebtoolsRegexHtml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  export function sanitizeWebtoolsRegexFlags(flags: string): string {
    const normalized = flags
      .split("")
      .filter((flag, index, list) => list.indexOf(flag) === index)
      .filter((flag) => WEBTOOLS_REGEX_SAFE_FLAGS.includes(flag))
      .join("");

    return normalized || "g";
  }

  export function refreshWebtoolsRegexState(): void {
    webtoolsRegexFlags = sanitizeWebtoolsRegexFlags(webtoolsRegexFlags);
    webtoolsRegexRows = [];
    webtoolsRegexInfo = "";
    webtoolsRegexError = "";
    webtoolsRegexHighlightedHtml = escapeWebtoolsRegexHtml(webtoolsRegexInput);
    webtoolsRegexOutput = "";

    if (!webtoolsRegexInput) {
      webtoolsRegexInfo = "请输入测试文本";
      return;
    }

    if (!webtoolsRegexPattern.trim()) {
      webtoolsRegexInfo = "请输入正则表达式";
      return;
    }

    try {
      const directRegex = new RegExp(webtoolsRegexPattern, webtoolsRegexFlags);
      const searchFlags = webtoolsRegexFlags.includes("g")
        ? webtoolsRegexFlags
        : sanitizeWebtoolsRegexFlags(`${webtoolsRegexFlags}g`);
      const searchRegex = new RegExp(webtoolsRegexPattern, searchFlags);
      const rows: WebtoolsRegexMatchRow[] = [];
      const parts: string[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null = searchRegex.exec(webtoolsRegexInput);

      while (match) {
        if (match.index > lastIndex) {
          parts.push(escapeWebtoolsRegexHtml(webtoolsRegexInput.slice(lastIndex, match.index)));
        }
        parts.push(
          `<span class="webtools-regex-highlight">${escapeWebtoolsRegexHtml(match[0] ?? "")}</span>`
        );
        rows.push({
          index: match.index,
          match: match[0] ?? "",
          groups: match.slice(1).map((item) => item ?? "")
        });
        lastIndex = searchRegex.lastIndex;

        if ((match[0] ?? "") === "") {
          searchRegex.lastIndex += 1;
          lastIndex = searchRegex.lastIndex;
        }

        match = searchRegex.exec(webtoolsRegexInput);
      }

      if (lastIndex < webtoolsRegexInput.length) {
        parts.push(escapeWebtoolsRegexHtml(webtoolsRegexInput.slice(lastIndex)));
      }

      webtoolsRegexRows = rows;
      webtoolsRegexHighlightedHtml = parts.join("") || escapeWebtoolsRegexHtml(webtoolsRegexInput);
      webtoolsRegexInfo = rows.length > 0 ? `匹配数: ${rows.length}` : "未匹配到结果";

      if (webtoolsRegexReplacement) {
        webtoolsRegexOutput = webtoolsRegexInput.replace(directRegex, webtoolsRegexReplacement);
      }
    } catch (error) {
      webtoolsRegexRows = [];
      webtoolsRegexHighlightedHtml = escapeWebtoolsRegexHtml(webtoolsRegexInput);
      webtoolsRegexError =
        error instanceof Error && error.message ? error.message : "正则表达式无效";
      webtoolsRegexInfo = "表达式存在错误";
    }
  }

  export function refreshWebtoolsRegexPreviewInForm(form: HTMLFormElement): void {
    const flagsNode = form.elements.namedItem("webtoolsRegexFlags");
    if (flagsNode instanceof HTMLInputElement) {
      flagsNode.value = webtoolsRegexFlags;
    }

    const errorNode = form.querySelector<HTMLDivElement>(".webtools-regex-error");
    if (errorNode) {
      errorNode.textContent = webtoolsRegexError;
      errorNode.hidden = !webtoolsRegexError;
    }

    const infoNode = form.querySelector<HTMLDivElement>(".webtools-regex-info");
    if (infoNode) {
      infoNode.textContent = webtoolsRegexInfo || "等待输入";
      infoNode.dataset.state = webtoolsRegexError
        ? "error"
        : webtoolsRegexRows.length > 0
          ? "ok"
          : "idle";
    }

    const previewNode = form.querySelector<HTMLDivElement>(".webtools-regex-highlight-box");
    if (previewNode) {
      previewNode.innerHTML = webtoolsRegexHighlightedHtml || "&nbsp;";
    }

    const rowsNode = form.querySelector<HTMLDivElement>(".webtools-regex-match-list");
    if (rowsNode) {
      rowsNode.replaceChildren();
      if (webtoolsRegexRows.length === 0) {
        const empty = document.createElement("div");
        empty.className = "webtools-regex-match-empty";
        empty.textContent = webtoolsRegexError ? "表达式错误" : "暂无匹配明细";
        rowsNode.appendChild(empty);
      } else {
        webtoolsRegexRows.forEach((row, index) => {
          const item = document.createElement("div");
          item.className = "webtools-regex-match-item";
          const title = document.createElement("div");
          title.className = "webtools-regex-match-title";
          title.textContent = `#${index + 1} @ ${row.index}`;
          const value = document.createElement("div");
          value.className = "webtools-regex-match-value";
          value.textContent = row.match;
          item.append(title, value);

          if (row.groups.length > 0) {
            const groups = document.createElement("div");
            groups.className = "webtools-regex-match-groups";
            groups.textContent = row.groups.join(" | ");
            item.appendChild(groups);
          }

          rowsNode.appendChild(item);
        });
      }
    }
  }

  export function normalizeWebtoolsCryptoAlgorithm(value: string): string {
    const normalized = value.trim();
    return [
      "MD5",
      "SHA1",
      "SHA256",
      "SHA512",
      "AES",
      "DES",
      "RSA",
      "Ed25519",
      "Base64",
      "URL"
    ].includes(normalized)
      ? normalized
      : "MD5";
  }

  export function webtoolsCryptoSupportsDecrypt(algorithm: string): boolean {
    return ["AES", "DES", "Base64", "URL", "RSA"].includes(algorithm);
  }

  export function isWebtoolsCryptoSymmetricAlgorithm(algorithm: string): boolean {
    return algorithm === "AES" || algorithm === "DES";
  }

  export function isWebtoolsCryptoAsymmetricAlgorithm(algorithm: string): boolean {
    return algorithm === "RSA" || algorithm === "Ed25519";
  }

  export function refreshWebtoolsCryptoResultInForm(form: HTMLFormElement): void {
    const outputNode = form.elements.namedItem("webtoolsCryptoOutput");
    if (outputNode instanceof HTMLTextAreaElement) {
      outputNode.value = webtoolsCryptoOutput;
    }
    const infoNode = form.querySelector(".webtools-crypto-info");
    if (infoNode instanceof HTMLDivElement) {
      infoNode.textContent = webtoolsCryptoInfo;
      infoNode.style.display = webtoolsCryptoInfo ? "" : "none";
    }
    const copyButton = form.querySelector(".webtools-crypto-copy-btn");
    if (copyButton instanceof HTMLButtonElement) {
      copyButton.disabled = webtoolsCryptoOutput.trim().length === 0;
    }
  }

  export function buildWebtoolsCryptoTarget(action: "process" | "generateKeys"): string {
    const params = new URLSearchParams();
    params.set("action", action);
    params.set("algorithm", webtoolsCryptoAlgorithm);
    params.set("mode", webtoolsCryptoMode);
    params.set("input", webtoolsCryptoInput);
    params.set("secretKey", webtoolsCryptoSecret);
    params.set("iv", webtoolsCryptoIv);
    params.set("publicKey", webtoolsCryptoPublicKey);
    params.set("privateKey", webtoolsCryptoPrivateKey);
    params.set("rsaBits", String(webtoolsCryptoRsaBits));
    return `command:plugin:${WEBTOOLS_CRYPTO_PLUGIN_ID}?${params.toString()}`;
  }

  export function scheduleWebtoolsCryptoAutoProcess(
    form: HTMLFormElement,
    immediate = false
  ): void {
    if (webtoolsCryptoAutoTimer !== null) {
      window.clearTimeout(webtoolsCryptoAutoTimer);
    }

    webtoolsCryptoAutoTimer = window.setTimeout(() => {
      webtoolsCryptoAutoTimer = null;
      if (!form.isConnected) {
        return;
      }

      const inputNode = form.elements.namedItem("webtoolsCryptoInput");
      if (
        inputNode instanceof HTMLTextAreaElement &&
        inputNode.value.trim().length === 0
      ) {
        webtoolsCryptoInput = "";
        webtoolsCryptoOutput = "";
        webtoolsCryptoInfo = "";
        refreshWebtoolsCryptoResultInForm(form);
        setStatus("就绪");
        return;
      }

      void executeWebtoolsCryptoProcess(form, { render: false });
    }, immediate ? 0 : 260);
  }

  export async function executeWebtoolsCryptoProcess(
    form: HTMLFormElement,
    options: { render?: boolean } = {}
  ): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("桥接层未加载，无法执行加密工具");
      return;
    }
    const shouldRender = options.render ?? true;

    const algorithmNode = form.elements.namedItem("webtoolsCryptoAlgorithm");
    const modeNode = form.elements.namedItem("webtoolsCryptoMode");
    const inputNode = form.elements.namedItem("webtoolsCryptoInput");
    const secretNode = form.elements.namedItem("webtoolsCryptoSecret");
    const ivNode = form.elements.namedItem("webtoolsCryptoIv");
    const publicNode = form.elements.namedItem("webtoolsCryptoPublicKey");
    const privateNode = form.elements.namedItem("webtoolsCryptoPrivateKey");
    const rsaBitsNode = form.elements.namedItem("webtoolsCryptoRsaBits");

    webtoolsCryptoAlgorithm =
      algorithmNode instanceof HTMLSelectElement || algorithmNode instanceof HTMLInputElement
        ? normalizeWebtoolsCryptoAlgorithm(algorithmNode.value)
        : "MD5";
    webtoolsCryptoMode =
      modeNode instanceof HTMLInputElement && modeNode.value === "decrypt"
        ? "decrypt"
        : "encrypt";
    if (!webtoolsCryptoSupportsDecrypt(webtoolsCryptoAlgorithm)) {
      webtoolsCryptoMode = "encrypt";
    }
    webtoolsCryptoInput = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
    webtoolsCryptoSecret = secretNode instanceof HTMLInputElement ? secretNode.value : "";
    webtoolsCryptoIv = ivNode instanceof HTMLInputElement ? ivNode.value : "";
    webtoolsCryptoPublicKey =
      publicNode instanceof HTMLTextAreaElement ? publicNode.value : "";
    webtoolsCryptoPrivateKey =
      privateNode instanceof HTMLTextAreaElement ? privateNode.value : "";
    webtoolsCryptoRsaBits =
      rsaBitsNode instanceof HTMLSelectElement
        ? Number(rsaBitsNode.value) || 2048
        : 2048;
    const requestToken = ++webtoolsCryptoRequestToken;

    const item: LaunchItem = {
      id: `plugin:${WEBTOOLS_CRYPTO_PLUGIN_ID}:process`,
      type: "command",
      title: "加密工具",
      subtitle: "面板执行",
      target: buildWebtoolsCryptoTarget("process"),
      keywords: ["plugin", "crypto", "hash", "aes", "rsa", "加密"]
    };

    const result = await launcher.execute(item);
    if (requestToken !== webtoolsCryptoRequestToken) {
      return;
    }
    const data = toRecord(result.data);

    webtoolsCryptoOutput =
      data && typeof data.output === "string" ? data.output : "";
    webtoolsCryptoInfo =
      data && typeof data.info === "string" ? data.info : "";

    setStatus(result.message ?? (result.ok ? "处理完成" : "处理失败"));
    if (shouldRender) {
      renderList();
      return;
    }
    refreshWebtoolsCryptoResultInForm(form);
  }

  export async function executeWebtoolsCryptoGenerateKeys(
    form: HTMLFormElement,
    options: { autoEncryptAfterRsaKeys?: boolean } = {}
  ): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("桥接层未加载，无法生成密钥");
      return;
    }

    const algorithmNode = form.elements.namedItem("webtoolsCryptoAlgorithm");
    const rsaBitsNode = form.elements.namedItem("webtoolsCryptoRsaBits");
    webtoolsCryptoAlgorithm =
      algorithmNode instanceof HTMLSelectElement || algorithmNode instanceof HTMLInputElement
        ? normalizeWebtoolsCryptoAlgorithm(algorithmNode.value)
        : "MD5";
    webtoolsCryptoRsaBits =
      rsaBitsNode instanceof HTMLSelectElement
        ? Number(rsaBitsNode.value) || 2048
        : 2048;

    if (!isWebtoolsCryptoAsymmetricAlgorithm(webtoolsCryptoAlgorithm)) {
      setStatus("当前算法不支持生成密钥");
      return;
    }

    const item: LaunchItem = {
      id: `plugin:${WEBTOOLS_CRYPTO_PLUGIN_ID}:generateKeys`,
      type: "command",
      title: "加密工具",
      subtitle: "生成密钥",
      target: buildWebtoolsCryptoTarget("generateKeys"),
      keywords: ["plugin", "crypto", "rsa", "ed25519", "keys", "加密"]
    };

    const result = await launcher.execute(item);
    const data = toRecord(result.data);
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
    webtoolsCryptoInfo =
      data && typeof data.info === "string" ? data.info : webtoolsCryptoInfo;

    const publicNode = form.elements.namedItem("webtoolsCryptoPublicKey");
    if (publicNode instanceof HTMLTextAreaElement) {
      publicNode.value = webtoolsCryptoPublicKey;
    }
    const privateNode = form.elements.namedItem("webtoolsCryptoPrivateKey");
    if (privateNode instanceof HTMLTextAreaElement) {
      privateNode.value = webtoolsCryptoPrivateKey;
    }
    refreshWebtoolsCryptoResultInForm(form);
    setStatus(result.message ?? (result.ok ? "密钥生成完成" : "密钥生成失败"));

    if (!result.ok || !options.autoEncryptAfterRsaKeys || webtoolsCryptoAlgorithm !== "RSA") {
      return;
    }

    const inputNode = form.elements.namedItem("webtoolsCryptoInput");
    if (!(inputNode instanceof HTMLTextAreaElement) || inputNode.value.trim().length === 0) {
      return;
    }

    const modeNode = form.elements.namedItem("webtoolsCryptoMode");
    if (modeNode instanceof HTMLInputElement) {
      modeNode.value = "encrypt";
    }
    webtoolsCryptoMode = "encrypt";

    await executeWebtoolsCryptoProcess(form, { render: false });
  }

}
