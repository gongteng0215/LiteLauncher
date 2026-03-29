window.__LL_PANEL_IMPLS__ = {
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
    panel.className = "settings-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-password-form webtools-password-lab";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void generateFromWebtoolsPasswordPanel(form, { render: false });
    });

    const hero = document.createElement("h3");
    hero.className = "webtools-password-hero";
    hero.textContent = "随机密码";

    const createOptionRow = (labelText: string): {
      row: HTMLDivElement;
      main: HTMLDivElement;
    } => {
      const row = document.createElement("div");
      row.className = "webtools-password-option";

      const label = document.createElement("div");
      label.className = "webtools-password-option-label";
      label.textContent = labelText;

      const main = document.createElement("div");
      main.className = "webtools-password-option-main";

      row.append(label, main);
      return { row, main };
    };

    const charsRowNodes = createOptionRow("字符选项");
    const charsWrap = document.createElement("div");
    charsWrap.className = "webtools-password-flags";

    const lowerWrap = document.createElement("label");
    lowerWrap.className = "webtools-password-flag";
    const lowerInput = document.createElement("input");
    lowerInput.type = "checkbox";
    lowerInput.name = "webtoolsLowercase";
    lowerInput.className = "password-checkbox";
    lowerInput.checked = webtoolsPasswordOptions.includeLowercase;
    const lowerText = document.createElement("span");
    lowerText.textContent = "小写字母 (a-z)";
    lowerWrap.append(lowerInput, lowerText);

    const upperWrap = document.createElement("label");
    upperWrap.className = "webtools-password-flag";
    const upperInput = document.createElement("input");
    upperInput.type = "checkbox";
    upperInput.name = "webtoolsUppercase";
    upperInput.className = "password-checkbox";
    upperInput.checked = webtoolsPasswordOptions.includeUppercase;
    const upperText = document.createElement("span");
    upperText.textContent = "大写字母 (A-Z)";
    upperWrap.append(upperInput, upperText);

    const digitsWrap = document.createElement("label");
    digitsWrap.className = "webtools-password-flag";
    const digitsInput = document.createElement("input");
    digitsInput.type = "checkbox";
    digitsInput.name = "webtoolsDigits";
    digitsInput.className = "password-checkbox";
    digitsInput.checked = webtoolsPasswordOptions.includeDigits;
    const digitsText = document.createElement("span");
    digitsText.textContent = "数字 (0-9)";
    digitsWrap.append(digitsInput, digitsText);

    charsWrap.append(lowerWrap, upperWrap, digitsWrap);
    charsRowNodes.main.append(charsWrap);

    const symbolsRowNodes = createOptionRow("特殊字符");
    const symbolsWrap = document.createElement("div");
    symbolsWrap.className = "webtools-password-symbols";

    const includeSymbolsWrap = document.createElement("label");
    includeSymbolsWrap.className = "webtools-password-flag";
    const includeSymbolsInput = document.createElement("input");
    includeSymbolsInput.type = "checkbox";
    includeSymbolsInput.name = "webtoolsSymbols";
    includeSymbolsInput.className = "password-checkbox";
    includeSymbolsInput.checked = webtoolsPasswordOptions.includeSymbols;
    const includeSymbolsText = document.createElement("span");
    includeSymbolsText.textContent = "特殊字符";
    includeSymbolsWrap.append(includeSymbolsInput, includeSymbolsText);

    const symbolsInput = document.createElement("input");
    symbolsInput.className = "settings-value webtools-password-symbol-input";
    symbolsInput.type = "text";
    symbolsInput.name = "webtoolsSymbolChars";
    symbolsInput.value = webtoolsPasswordOptions.symbolChars;
    symbolsInput.placeholder = "!@#$%^&*";

    const excludeSimilarWrap = document.createElement("label");
    excludeSimilarWrap.className = "webtools-password-flag";
    const excludeSimilarInput = document.createElement("input");
    excludeSimilarInput.type = "checkbox";
    excludeSimilarInput.name = "webtoolsExcludeSimilar";
    excludeSimilarInput.className = "password-checkbox";
    excludeSimilarInput.checked = webtoolsPasswordOptions.excludeSimilar;
    const excludeSimilarText = document.createElement("span");
    excludeSimilarText.textContent = "排除相似字符";
    excludeSimilarWrap.append(excludeSimilarInput, excludeSimilarText);

    symbolsWrap.append(includeSymbolsWrap, symbolsInput, excludeSimilarWrap);
    symbolsRowNodes.main.append(symbolsWrap);

    const lengthRowNodes = createOptionRow("密码长度");
    const lengthInput = document.createElement("select");
    lengthInput.className = "settings-number webtools-password-length-select";
    lengthInput.name = "webtoolsLength";
    [
      { value: 8, label: "8 位密码 (低强度)" },
      { value: 12, label: "12 位密码 (中强度)" },
      { value: 16, label: "16 位密码 (高强度)" },
      { value: 20, label: "20 位密码 (高强度)" },
      { value: 32, label: "32 位密码 (极高强度)" },
      { value: 64, label: "64 位密码 (极高强度)" }
    ].forEach((entry) => {
      const option = document.createElement("option");
      option.value = String(entry.value);
      option.textContent = entry.label;
      option.selected = entry.value === webtoolsPasswordOptions.length;
      lengthInput.appendChild(option);
    });
    if (lengthInput.selectedIndex === -1) {
      const fallback = document.createElement("option");
      fallback.value = String(webtoolsPasswordOptions.length);
      fallback.textContent = `${webtoolsPasswordOptions.length} 位密码 (自定义)`;
      fallback.selected = true;
      lengthInput.appendChild(fallback);
    }
    const lengthHint = document.createElement("span");
    lengthHint.className = "webtools-password-safe-hint";
    lengthHint.textContent = "密码长度很安全";
    lengthRowNodes.main.append(lengthInput, lengthHint);

    const countRowNodes = createOptionRow("生成数量");
    const countInput = document.createElement("select");
    countInput.className = "settings-number webtools-password-count-select";
    countInput.name = "webtoolsCount";
    [1, 5, 10, 20, 50].forEach((count) => {
      const option = document.createElement("option");
      option.value = String(count);
      option.textContent = String(count);
      option.selected = count === webtoolsPasswordOptions.count;
      countInput.appendChild(option);
    });
    if (countInput.selectedIndex === -1) {
      const fallback = document.createElement("option");
      fallback.value = String(webtoolsPasswordOptions.count);
      fallback.textContent = String(webtoolsPasswordOptions.count);
      fallback.selected = true;
      countInput.appendChild(fallback);
    }
    countRowNodes.main.append(countInput);

    const outputHost = document.createElement("div");
    outputHost.className = "webtools-password-result-host";
    outputHost.appendChild(createWebtoolsPasswordResultTable(webtoolsPasswordRows));

    const generateWrap = document.createElement("div");
    generateWrap.className = "webtools-password-generate-wrap";

    const generateButton = document.createElement("button");
    generateButton.type = "submit";
    generateButton.className = "settings-btn settings-btn-primary webtools-password-generate-btn";
    generateButton.textContent = "生成密码";
    generateWrap.appendChild(generateButton);

    const actions = document.createElement("div");
    actions.className = "settings-actions webtools-password-tools-actions";

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "settings-btn settings-btn-secondary";
    clearButton.textContent = "清空结果";
    clearButton.addEventListener("click", () => {
      webtoolsPasswordRows = [];
      refreshWebtoolsPasswordResultInForm(form);
      setStatus("已清空密码结果");
    });

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "settings-btn settings-btn-secondary";
    backButton.textContent = "返回搜索";
    backButton.addEventListener("click", () => {
      backToSearch();
    });

    actions.append(clearButton, backButton);

    form.append(
      hero,
      charsRowNodes.row,
      symbolsRowNodes.row,
      lengthRowNodes.row,
      countRowNodes.row,
      generateWrap,
      outputHost,
      actions
    );
    panel.append(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);
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
      compressed
    };
  },

  renderWebtoolsJsonPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel";

    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "JSON & CSV 实验室";

    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle || "支持 JSON/CSV/纯文本/Escaped 双向转换。";

    const form = document.createElement("form");
    form.className = "settings-form webtools-json-form webtools-json-lab";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsJsonConvert(form, { render: false });
    });

    const topActions = document.createElement("div");
    topActions.className = "webtools-json-toolbar";
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "settings-btn settings-btn-secondary";
    clearButton.textContent = "清空";
    clearButton.addEventListener("click", () => {
      webtoolsJsonState.input = "";
      webtoolsJsonState.output = "";
      webtoolsJsonState.info = "";
      webtoolsJsonState.valid = null;
      inputArea.value = "";
      outputArea.value = "";
      refreshWebtoolsJsonResultInForm(form);
      setStatus("已清空输入与输出");
    });
    topActions.append(clearButton);

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
    [
      ["text", "纯文本"],
      ["json", "JSON"],
      ["csv", "CSV"],
      ["escaped", "Escaped"]
    ].forEach(([value, label]) => {
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
    swapButton.textContent = "⇅";

    const targetGroup = document.createElement("label");
    targetGroup.className = "webtools-json-converter-group";
    const targetLabel = document.createElement("span");
    targetLabel.className = "webtools-json-converter-label";
    targetLabel.textContent = "目标格式";
    const targetSelect = document.createElement("select");
    targetSelect.className = "settings-number webtools-json-select";
    targetSelect.name = "webtoolsJsonTarget";
    [
      ["json", "JSON"],
      ["csv", "CSV"],
      ["text", "纯文本"],
      ["escaped", "Escaped"]
    ].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = webtoolsJsonState.targetFormat === value;
      targetSelect.appendChild(option);
    });
    targetGroup.append(targetLabel, targetSelect);

    const formatHint = document.createElement("div");
    formatHint.className = "webtools-json-route";

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

    const outputMeta = document.createElement("div");
    outputMeta.className = "webtools-json-pane-controls";
    outputMeta.append(compressedWrap);

    const outputArea = document.createElement("textarea");
    outputArea.className = "settings-value webtools-textarea webtools-json-textarea";
    outputArea.name = "webtoolsJsonOutput";
    outputArea.readOnly = true;
    outputArea.placeholder = "转换后结果";
    outputArea.value = webtoolsJsonState.output;

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className =
      "settings-btn settings-btn-secondary webtools-json-copy-btn";
    copyButton.textContent = "复制";
    copyButton.addEventListener("click", () => {
      void (async () => {
        const copied = await copyTextToClipboard(outputArea.value);
        setStatus(copied ? "已复制输出内容" : "复制失败");
      })();
    });
    outputMeta.append(copyButton);

    const updateJsonFormHead = (): void => {
      const source = sourceSelect.value.toUpperCase();
      const target = targetSelect.value.toUpperCase();
      formatHint.textContent = `${source} -> ${target}`;
      compressedWrap.style.display = targetSelect.value === "json" ? "" : "none";
    };

    swapButton.addEventListener("click", () => {
      const source = sourceSelect.value;
      sourceSelect.value = (targetSelect.value || "json") as string;
      targetSelect.value = source as string;

      if (webtoolsJsonState.output.trim()) {
        inputArea.value = webtoolsJsonState.output;
        webtoolsJsonState.output = "";
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
      scheduleWebtoolsJsonAutoConvert(form, true);
    });
    inputArea.addEventListener("input", () => {
      scheduleWebtoolsJsonAutoConvert(form);
    });
    updateJsonFormHead();

    converterBar.append(sourceGroup, swapButton, targetGroup);

    const editors = document.createElement("div");
    editors.className = "webtools-json-editors";

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
    inputHead.append(inputTitle, inputMeta);
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

    form.append(topActions, converterBar, formatHint, editors, info);
    panel.append(title, description, form);
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

  applyWebtoolsDiffPanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    webtoolsDiffLeft =
      data && typeof data.left === "string"
        ? data.left
        : "Hello World\nThis is a test of the diff utility.";
    webtoolsDiffRight =
      data && typeof data.right === "string"
        ? data.right
        : "Hello Everyone\nThis is a test of the diff utility.";
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

    const left = document.createElement("textarea");
    left.className = "settings-value webtools-textarea";
    left.name = "webtoolsDiffLeft";
    left.value = webtoolsDiffLeft;

    const right = document.createElement("textarea");
    right.className = "settings-value webtools-textarea";
    right.name = "webtoolsDiffRight";
    right.value = webtoolsDiffRight;

    const flags = document.createElement("div");
    flags.className = "webtools-password-flags webtools-diff-options";

    const ignoreCase = document.createElement("input");
    ignoreCase.type = "checkbox";
    ignoreCase.className = "password-checkbox";
    ignoreCase.name = "webtoolsDiffIgnoreCase";
    ignoreCase.checked = webtoolsDiffIgnoreCase;

    const ignoreWs = document.createElement("input");
    ignoreWs.type = "checkbox";
    ignoreWs.className = "password-checkbox";
    ignoreWs.name = "webtoolsDiffIgnoreWhitespace";
    ignoreWs.checked = webtoolsDiffIgnoreWhitespace;

    flags.append(ignoreCase, ignoreWs);

    const summary = document.createElement("div");
    summary.className = "webtools-diff-summary";

    const viewer = document.createElement("div");
    viewer.className = "webtools-diff-viewer";

    const onEdit = () => {
      scheduleWebtoolsDiffAutoCompare(form);
    };
    left.addEventListener("input", onEdit);
    right.addEventListener("input", onEdit);
    ignoreCase.addEventListener("change", () => {
      scheduleWebtoolsDiffAutoCompare(form, true);
    });
    ignoreWs.addEventListener("change", () => {
      scheduleWebtoolsDiffAutoCompare(form, true);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsDiffCompare(form, { render: false });
    });

    form.append(left, right, flags, summary, viewer);
    panel.appendChild(form);
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
      webtoolsConfigInfo = "Input to auto convert";
    }
  },

  renderWebtoolsConfigPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-config-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-config-form";

    const title = document.createElement("h3");
    title.className = "webtools-config-title";
    title.textContent = activePluginPanel?.title || "Config Convert";

    const sourceSelect = document.createElement("select");
    sourceSelect.className = "settings-number webtools-config-select";
    sourceSelect.name = "webtoolsConfigSource";
    WEBTOOLS_CONFIG_FORMAT_OPTIONS.forEach(({ value, label }) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      opt.selected = webtoolsConfigSource === value;
      sourceSelect.appendChild(opt);
    });

    const targetSelect = document.createElement("select");
    targetSelect.className = "settings-number webtools-config-select";
    targetSelect.name = "webtoolsConfigTarget";
    ["properties", "yaml", "json"].forEach((value) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = value.toUpperCase();
      opt.selected = webtoolsConfigTarget === value;
      targetSelect.appendChild(opt);
    });

    const inputLabel = document.createElement("div");
    inputLabel.setAttribute("data-webtools-config-input-label", "1");

    const input = document.createElement("textarea");
    input.className = "settings-value webtools-textarea webtools-config-textarea";
    input.name = "webtoolsConfigInput";
    input.value = webtoolsConfigInput;

    const error = document.createElement("div");
    error.className = "webtools-config-error";
    error.hidden = true;

    const outputLabel = document.createElement("div");
    outputLabel.setAttribute("data-webtools-config-output-label", "1");

    const output = document.createElement("textarea");
    output.className = "settings-value webtools-textarea webtools-config-textarea";
    output.name = "webtoolsConfigOutput";
    output.readOnly = true;

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "settings-btn settings-btn-primary webtools-config-copy";
    copy.textContent = "Copy";
    copy.setAttribute("data-webtools-config-copy", "1");
    copy.addEventListener("click", async () => {
      if (!webtoolsConfigOutput.trim()) {
        setStatus("No output");
        return;
      }
      const ok = await copyTextToClipboard(webtoolsConfigOutput);
      setStatus(ok ? "Copied" : "Copy failed");
    });

    const info = document.createElement("div");
    info.className = "webtools-config-info";

    sourceSelect.addEventListener("change", () => {
      scheduleWebtoolsConfigAutoConvert(form, true);
    });
    targetSelect.addEventListener("change", () => {
      scheduleWebtoolsConfigAutoConvert(form, true);
    });
    input.addEventListener("input", () => {
      scheduleWebtoolsConfigAutoConvert(form);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsConfigConvert(form, { render: false });
    });

    form.append(title, sourceSelect, targetSelect, inputLabel, input, error, outputLabel, copy, output, info);
    panel.appendChild(form);
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
  },

  renderWebtoolsSqlPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-sql-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-sql-form";

    const input = document.createElement("textarea");
    input.className = "settings-value webtools-textarea webtools-sql-input";
    input.name = "webtoolsSqlInput";
    input.value = webtoolsSqlInput;

    const output = document.createElement("textarea");
    output.className = "settings-value webtools-textarea webtools-sql-output";
    output.name = "webtoolsSqlOutput";
    output.readOnly = true;

    const dialect = document.createElement("select");
    dialect.className = "settings-value webtools-sql-config-select";
    dialect.name = "webtoolsSqlDialect";
    WEBTOOLS_SQL_DIALECT_OPTIONS.forEach(({ value, label }) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      opt.selected = webtoolsSqlDialect === value;
      dialect.appendChild(opt);
    });

    const indent = document.createElement("select");
    indent.className = "settings-value webtools-sql-config-select";
    indent.name = "webtoolsSqlIndent";
    WEBTOOLS_SQL_INDENT_OPTIONS.forEach(({ value, label }) => {
      const opt = document.createElement("option");
      opt.value = String(value);
      opt.textContent = label;
      opt.selected = webtoolsSqlIndent === value;
      indent.appendChild(opt);
    });

    const uppercase = document.createElement("input");
    uppercase.type = "checkbox";
    uppercase.className = "password-checkbox";
    uppercase.name = "webtoolsSqlUppercase";
    uppercase.checked = webtoolsSqlUppercase;

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "settings-btn settings-btn-primary webtools-sql-inline-action";
    copy.setAttribute("data-webtools-sql-copy", "1");
    copy.textContent = "Copy";
    copy.addEventListener("click", async () => {
      if (!webtoolsSqlOutput.trim()) {
        setStatus("No output");
        return;
      }
      await navigator.clipboard.writeText(webtoolsSqlOutput);
      setStatus("Copied");
    });

    const error = document.createElement("div");
    error.className = "webtools-sql-error";
    error.hidden = true;

    const info = document.createElement("div");
    info.className = "webtools-tool-info webtools-sql-info";

    input.addEventListener("input", () => {
      scheduleWebtoolsSqlAutoFormat(form);
    });
    [dialect, indent, uppercase].forEach((node) => {
      node.addEventListener("change", () => {
        scheduleWebtoolsSqlAutoFormat(form, true);
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsSqlFormat(form);
    });

    form.append(dialect, indent, uppercase, input, error, copy, output, info);
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsSqlResultInForm(form);
    scheduleWebtoolsSqlAutoFormat(form, true);
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

    const input = document.createElement("textarea");
    input.className = "settings-value webtools-textarea webtools-markdown-editor";
    input.name = "webtoolsMarkdownInput";
    input.value = webtoolsMarkdownInput;

    const preview = document.createElement("div");
    preview.className = "webtools-markdown-preview-body";
    preview.setAttribute("data-webtools-markdown-preview", "1");

    const html = document.createElement("textarea");
    html.className = "settings-value webtools-textarea webtools-markdown-html";
    html.name = "webtoolsMarkdownHtml";
    html.readOnly = true;

    const info = document.createElement("div");
    info.className = "webtools-markdown-info";

    input.addEventListener("input", () => {
      webtoolsMarkdownInput = input.value;
      scheduleWebtoolsMarkdownAutoRender(form);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsMarkdownRender(form);
    });

    form.append(input, preview, html, info);
    panel.appendChild(form);
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

  applyWebtoolsCronPanelPayload(panel: ActivePluginPanelState): void {
    if (panel.data && typeof panel.data.expression === "string") {
      webtoolsCronExpression = panel.data.expression;
    }
    webtoolsCronReadable = "";
    webtoolsCronNextRun = "";
    webtoolsCronUpcoming = [];
  },

  renderWebtoolsCronPanel(): void {
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
