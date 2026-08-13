namespace RendererPanelRuntime {

  export function applyWebtoolsRegexPanelPayload(panel: ActivePluginPanelState): void {
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
    }

  export function renderWebtoolsRegexPanel(): void {
      const panelItem = document.createElement("li");
      panelItem.className = "settings-panel-item";

      const panel = document.createElement("section");
      panel.className = "settings-panel webtools-regex-panel";

      const form = document.createElement("form");
      form.className = "settings-form webtools-regex-form webtools-tool-panel";
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const patternNode = form.elements.namedItem("webtoolsRegexPattern");
        const flagsNode = form.elements.namedItem("webtoolsRegexFlags");
        const inputNode = form.elements.namedItem("webtoolsRegexInput");
        webtoolsRegexPattern = patternNode instanceof HTMLInputElement ? patternNode.value : "";
        webtoolsRegexFlags = flagsNode instanceof HTMLInputElement ? flagsNode.value : "g";
        webtoolsRegexInput = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
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
    }

  export function applyWebtoolsCryptoPanelPayload(panel: ActivePluginPanelState): void {
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
  }

  export function renderWebtoolsCryptoPanel(): void {
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

    const closeAlgorithmMenu = (): void => {
      algorithmPicker.dataset.open = "false";
      algorithmTrigger.setAttribute("aria-expanded", "false");
      if (removeActiveCryptoAlgorithmMenuListener) {
        removeActiveCryptoAlgorithmMenuListener();
        removeActiveCryptoAlgorithmMenuListener = null;
      }
    };

    const openAlgorithmMenu = (): void => {
      if (algorithmPicker.dataset.open === "true") {
        return;
      }
      // Closing any listener left over from a stale render before attaching
      // a new one keeps at most one document-level listener alive at a time.
      if (removeActiveCryptoAlgorithmMenuListener) {
        removeActiveCryptoAlgorithmMenuListener();
        removeActiveCryptoAlgorithmMenuListener = null;
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
      removeActiveCryptoAlgorithmMenuListener = () => {
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
  }

  export function applyWebtoolsJwtPanelPayload(panel: ActivePluginPanelState): void {
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
  }

  export function renderWebtoolsJwtPanel(): void {
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
  }

}
