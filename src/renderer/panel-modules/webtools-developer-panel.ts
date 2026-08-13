namespace RendererPanelRuntime {

  export function applyWebtoolsFileHashPanelPayload(panel: ActivePluginPanelState): void {
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
    }

  export function renderWebtoolsFileHashPanel(): void {
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
    }

  export function applyWebtoolsPortHelperPanelPayload(panel: ActivePluginPanelState): void {
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
    }

  export function renderWebtoolsPortHelperPanel(): void {
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
    }

  export function applyWebtoolsConfigPanelPayload(panel: ActivePluginPanelState): void {
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
  }

  export function renderWebtoolsConfigPanel(): void {
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
  }

  export function applyWebtoolsSqlPanelPayload(panel: ActivePluginPanelState): void {
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
  }

  export function renderWebtoolsSqlPanel(): void {
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
  }

  export function applyWebtoolsUnitPanelPayload(panel: ActivePluginPanelState): void {
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
    }

  export function renderWebtoolsUnitPanel(): void {
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

      const createUnitResultCard = (
        labelText: string,
        key: string,
        emptyText = "-"
      ): HTMLDivElement => {
        const card = document.createElement("div");
        card.className = "webtools-unit-card";
        const label = document.createElement("div");
        label.className = "webtools-unit-card-label";
        label.textContent = labelText;
        const value = document.createElement("div");
        value.className = "webtools-unit-card-value";
        value.dataset.webtoolsUnitCard = key;
        value.textContent = emptyText;
        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "settings-btn settings-btn-secondary webtools-unit-copy-btn";
        copyButton.textContent = "复制";
        copyButton.addEventListener("click", () => {
          const content = value.textContent?.trim() ?? "";
          if (!content || content === emptyText) {
            setStatus("当前没有可复制的 " + labelText);
            return;
          }
          void (async () => {
            const copied = await copyTextToClipboard(content);
            setStatus(copied ? "已复制 " + labelText : "复制失败");
          })();
        });
        card.append(label, value, copyButton);
        return card;
      };

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

        const summaryGrid = document.createElement("div");
        summaryGrid.className = "webtools-unit-grid";
        summaryGrid.append(
          createUnitResultCard("当前 B", "B"),
          createUnitResultCard("当前 KB", "KB"),
          createUnitResultCard("当前 MB", "MB"),
          createUnitResultCard("当前 GB", "GB"),
          createUnitResultCard("当前 TB", "TB")
        );

        const info = document.createElement("div");
        info.className = "webtools-tool-info webtools-unit-info";
        form.append(stack, summaryGrid, info);
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

      const summaryGrid = document.createElement("div");
      summaryGrid.className = "webtools-unit-screen-grid";
      summaryGrid.append(
        createUnitResultCard("当前 px", "pixel"),
        createUnitResultCard("当前 rem", "rem"),
        createUnitResultCard("根字号", "basePx")
      );

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
      form.append(screenBox, summaryGrid, info);
      panel.append(form);
      panelItem.appendChild(panel);
      list.appendChild(panelItem);
      refreshWebtoolsUnitPanelInForm(form);
    }

  export function applyWebtoolsApiPanelPayload(panel: ActivePluginPanelState): void {
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
    }

  export function renderWebtoolsApiPanel(): void {
      const panelItem = document.createElement("li");
      panelItem.className = "settings-panel-item";

      const panel = document.createElement("section");
      panel.className = "settings-panel webtools-api-panel";

      const form = document.createElement("form");
      form.className = "settings-form webtools-api-form webtools-tool-panel";

      const title = document.createElement("h3");
      title.className = "webtools-tool-title";
      title.textContent = activePluginPanel?.title || "API 调试";

      const requestRow = document.createElement("div");
      requestRow.className = "webtools-api-request";

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

      const send = document.createElement("button");
      send.type = "submit";
      send.className = "settings-btn settings-btn-primary webtools-api-send-btn";
      send.textContent = "发送";

      requestRow.append(method, url, send);

      const previewRow = document.createElement("div");
      previewRow.className = "webtools-api-preview-row";
      const previewLabel = document.createElement("div");
      previewLabel.className = "webtools-api-preview-label";
      previewLabel.textContent = "请求预览";
      const preview = document.createElement("div");
      preview.className = "webtools-api-preview webtools-tool-code";
      previewRow.append(previewLabel, preview);

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
        const option = document.createElement("label");
        option.className = "webtools-api-body-type";
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
        option.append(radio, text);
        bodyTypes.appendChild(option);
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

      const responseSection = document.createElement("section");
      responseSection.className = "webtools-api-response-section";
      const responseHead = document.createElement("div");
      responseHead.className = "webtools-api-response-head";
      const metrics = document.createElement("div");
      metrics.className = "webtools-api-metrics";
      const status = document.createElement("div");
      status.className = "webtools-api-status";
      const time = document.createElement("span");
      time.className = "webtools-api-time";
      const size = document.createElement("span");
      size.className = "webtools-api-size";
      const err = document.createElement("div");
      err.className = "webtools-api-error";
      metrics.append(status, time, size);
      responseHead.append(metrics, err);
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
      responseSection.append(responseHead, responseUrl, responseTabs, responsePanels);

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

      form.append(title, requestRow, previewRow, requestTabs, requestPanels, responseSection);
      panel.appendChild(form);
      panelItem.appendChild(panel);
      list.appendChild(panelItem);

      refreshWebtoolsApiResponseInForm(form);
    }

  export function applyWebtoolsHttpMockPanelPayload(panel: ActivePluginPanelState): void {
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
    }

  export function renderWebtoolsHttpMockPanel(): void {
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
    }

}
