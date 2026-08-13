namespace RendererPanelRuntime {

  export function applyWebtoolsStringsPanelPayload(panel: ActivePluginPanelState): void {
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
    }

  export function renderWebtoolsStringsPanel(): void {
      const panelItem = document.createElement("li");
      panelItem.className = "settings-panel-item";

      const panel = document.createElement("section");
      panel.className = "settings-panel webtools-strings-panel";

      const form = document.createElement("form");
      form.className = "settings-form webtools-strings-form";
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        void executeWebtoolsStringsAction("convert", form);
      });

      const header = document.createElement("div");
      header.className = "webtools-strings-header";

      const title = document.createElement("h3");
      title.className = "webtools-strings-title";
      title.textContent = activePluginPanel?.title || "字符串工具";

      const subtitle = document.createElement("p");
      subtitle.className = "webtools-strings-subtitle";
      subtitle.textContent =
        activePluginPanel?.subtitle || "大小写转换与 UUID 批量生成，适合整理变量名、接口字段和测试数据。";

      header.append(title, subtitle);

      const caseSection = document.createElement("section");
      caseSection.className = "webtools-strings-section";
      const caseSectionTitle = document.createElement("h4");
      caseSectionTitle.className = "webtools-strings-section-title";
      caseSectionTitle.textContent = "大小写转换";
      const caseSectionDescription = document.createElement("p");
      caseSectionDescription.className = "webtools-strings-section-description";
      caseSectionDescription.textContent = "先输入原始文本，再选择目标命名风格。";

      const caseBox = document.createElement("div");
      caseBox.className = "webtools-strings-case-box";

      const input = document.createElement("textarea");
      input.className = "settings-value webtools-textarea webtools-strings-textarea";
      input.name = "webtoolsStringsInput";
      input.value = webtoolsStringsInput;
      input.placeholder = "例如：hello_world_variable";
      input.spellcheck = false;

      const inputField = document.createElement("label");
      inputField.className = "webtools-strings-field";
      const inputLabel = document.createElement("span");
      inputLabel.className = "settings-row-label";
      inputLabel.textContent = "原始文本";
      inputField.append(inputLabel, input);

      const caseType = document.createElement("select");
      caseType.className = "webtools-strings-case-select";
      caseType.name = "webtoolsStringsCaseType";
      const caseOptions = [
        { value: "camel", label: "camelCase" },
        { value: "snake", label: "snake_case" },
        { value: "pascal", label: "PascalCase" },
        { value: "kebab", label: "kebab-case" },
        { value: "upper", label: "UPPER CASE" },
        { value: "lower", label: "lower case" }
      ] as const;
      caseOptions.forEach(({ value, label }) => {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        opt.selected = webtoolsStringsCaseType === value;
        caseType.appendChild(opt);
      });

      const caseButtonGrid = document.createElement("div");
      caseButtonGrid.className = "webtools-strings-button-grid";
      const caseButtons: Array<{ value: string; button: HTMLButtonElement }> = [];
      const syncCaseButtons = (): void => {
        caseButtons.forEach(({ value, button }) => {
          const active = caseType.value === value;
          button.className = `settings-btn ${active ? "settings-btn-primary" : "settings-btn-secondary"} webtools-strings-case-btn`;
          button.dataset.active = String(active);
          button.setAttribute("aria-pressed", String(active));
        });
      };
      caseOptions.forEach(({ value, label }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.addEventListener("click", () => {
          caseType.value = value;
          webtoolsStringsCaseType = value;
          syncCaseButtons();
        });
        caseButtons.push({ value, button });
        caseButtonGrid.appendChild(button);
      });
      syncCaseButtons();

      const convertActions = document.createElement("div");
      convertActions.className = "settings-actions";

      const count = document.createElement("input");
      count.type = "number";
      count.name = "webtoolsStringsCount";
      count.value = String(webtoolsStringsUuidCount);
      count.min = "1";
      count.max = "100";
      count.className = "settings-value webtools-tool-input webtools-strings-uuid-input";

      const convert = document.createElement("button");
      convert.type = "button";
      convert.className = "settings-btn settings-btn-primary";
      convert.textContent = "转换";
      convert.addEventListener("click", () => {
        void executeWebtoolsStringsAction("convert", form);
      });

      const copyConverted = document.createElement("button");
      copyConverted.type = "button";
      copyConverted.className = "settings-btn settings-btn-secondary";
      copyConverted.textContent = "复制结果";
      copyConverted.disabled = !webtoolsStringsOutput.trim();
      copyConverted.addEventListener("click", () => {
        void (async () => {
          const copied = await copyTextToClipboard(webtoolsStringsOutput);
          setStatus(copied ? "已复制转换结果" : "复制失败");
        })();
      });

      convertActions.append(convert, copyConverted);

      const outputField = document.createElement("label");
      outputField.className = "webtools-strings-field";
      const outputLabel = document.createElement("span");
      outputLabel.className = "settings-row-label";
      outputLabel.textContent = "转换结果";
      const output = document.createElement("textarea");
      output.className = "settings-value webtools-textarea webtools-strings-textarea";
      output.readOnly = true;
      output.value = webtoolsStringsOutput;
      output.placeholder = "点击“转换”后会在这里显示结果。";
      output.spellcheck = false;
      outputField.append(outputLabel, output);

      caseBox.append(inputField, caseType, caseButtonGrid, convertActions, outputField);
      caseSection.append(caseSectionTitle, caseSectionDescription, caseBox);

      const divider = document.createElement("div");
      divider.className = "webtools-strings-divider";

      const uuidSection = document.createElement("section");
      uuidSection.className = "webtools-strings-section";
      const uuidSectionTitle = document.createElement("h4");
      uuidSectionTitle.className = "webtools-strings-section-title";
      uuidSectionTitle.textContent = "UUID 批量生成";
      const uuidSectionDescription = document.createElement("p");
      uuidSectionDescription.className = "webtools-strings-section-description";
      uuidSectionDescription.textContent = "快速生成测试数据、主键样例或临时标识。";

      const uuidBox = document.createElement("div");
      uuidBox.className = "webtools-strings-uuid-box";

      const uuidControl = document.createElement("div");
      uuidControl.className = "webtools-strings-uuid-control";

      const countLabel = document.createElement("label");
      countLabel.className = "webtools-strings-uuid-label";
      countLabel.textContent = "生成数量";
      countLabel.appendChild(count);

      const uuid = document.createElement("button");
      uuid.type = "button";
      uuid.className = "settings-btn settings-btn-secondary";
      uuid.textContent = "生成 UUID";
      uuid.addEventListener("click", () => {
        void executeWebtoolsStringsAction("uuid", form);
      });

      const copyAllUuid = document.createElement("button");
      copyAllUuid.type = "button";
      copyAllUuid.className = "settings-btn settings-btn-secondary";
      copyAllUuid.textContent = "复制全部";
      copyAllUuid.disabled = webtoolsStringsUuidItems.length === 0;
      copyAllUuid.addEventListener("click", () => {
        void (async () => {
          const copied = await copyTextToClipboard(webtoolsStringsUuidItems.join("\n"));
          setStatus(copied ? "已复制全部 UUID" : "复制失败");
        })();
      });

      uuidControl.append(countLabel, uuid, copyAllUuid);

      const uuidResults = document.createElement("div");
      uuidResults.className = "webtools-strings-uuid-results";
      if (webtoolsStringsUuidItems.length === 0) {
        const empty = document.createElement("div");
        empty.className = "webtools-strings-uuid-empty";
        empty.textContent = "点击“生成 UUID”后，这里会列出批量结果。";
        uuidResults.appendChild(empty);
      } else {
        webtoolsStringsUuidItems.forEach((item, index) => {
          const row = document.createElement("div");
          row.className = "webtools-strings-uuid-item";
          const code = document.createElement("code");
          code.className = "webtools-strings-uuid-code";
          code.textContent = item;
          const copyButton = document.createElement("button");
          copyButton.type = "button";
          copyButton.className = "settings-btn settings-btn-secondary";
          copyButton.textContent = `复制 #${index + 1}`;
          copyButton.addEventListener("click", () => {
            void (async () => {
              const copied = await copyTextToClipboard(item);
              setStatus(copied ? `已复制 UUID #${index + 1}` : "复制失败");
            })();
          });
          row.append(code, copyButton);
          uuidResults.appendChild(row);
        });
      }

      uuidBox.append(uuidControl, uuidResults);
      uuidSection.append(uuidSectionTitle, uuidSectionDescription, uuidBox);

      form.append(header, caseSection, divider, uuidSection);
      panel.appendChild(form);
      panelItem.appendChild(panel);
      list.appendChild(panelItem);
    }

  export function applyWebtoolsColorsPanelPayload(panel: ActivePluginPanelState): void {
      const data = panel.data;
      if (data && typeof data.color === "string") {
        webtoolsColorsInput = data.color;
      }
      webtoolsColorsHex = webtoolsColorsInput || "#6c5ce7";
      webtoolsColorsRgb = "";
      webtoolsColorsHsl = "";
      webtoolsColorsShades = [];
    }

  export function renderWebtoolsColorsPanel(): void {
      const panelItem = document.createElement("li");
      panelItem.className = "settings-panel-item";

      const panel = document.createElement("section");
      panel.className = "settings-panel webtools-colors-panel";

      const form = document.createElement("form");
      form.className = "settings-form webtools-colors-form webtools-colors-lab";

      const presetColors = [
        "#6c5ce7",
        "#00b894",
        "#0984e3",
        "#fdcb6e",
        "#e17055",
        "#d63031",
        "#2d3436",
        "#f8fafc",
        "#1abc9c",
        "#8e44ad",
        "#ff7675",
        "#00cec9"
      ];

      const header = document.createElement("div");
      header.className = "webtools-colors-header";
      const headerText = document.createElement("div");
      const title = document.createElement("h3");
      title.className = "webtools-colors-title";
      title.textContent = activePluginPanel?.title || "颜色工具";
      const description = document.createElement("p");
      description.className = "webtools-colors-description";
      description.textContent =
        activePluginPanel?.subtitle || "HEX / RGB / HSL 转换与常用色板快速取色";
      headerText.append(title, description);
      header.appendChild(headerText);

      const layout = document.createElement("div");
      layout.className = "webtools-colors-layout";

      const leftColumn = document.createElement("div");
      leftColumn.className = "webtools-colors-column";

      const preview = document.createElement("div");
      preview.className = "webtools-colors-preview";
      preview.setAttribute("data-webtools-colors-preview", "1");
      const previewText = document.createElement("span");
      previewText.className = "webtools-colors-preview-text";
      previewText.setAttribute("data-webtools-colors-preview-text", "1");
      preview.appendChild(previewText);

      const paletteSection = document.createElement("div");
      paletteSection.className = "webtools-colors-section";
      const paletteTitle = document.createElement("div");
      paletteTitle.className = "webtools-colors-section-title";
      paletteTitle.textContent = "常用色板";
      const palette = document.createElement("div");
      palette.className = "webtools-colors-palette";
      presetColors.forEach((color) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "webtools-colors-palette-item";
        button.title = color;
        button.style.background = color;
        button.dataset.webtoolsColorsPreset = color;
        button.addEventListener("click", () => {
          input.value = color;
          void executeWebtoolsColorsConvert(color, { render: false, form });
        });
        palette.appendChild(button);
      });
      paletteSection.append(paletteTitle, palette);

      const pickerSection = document.createElement("div");
      pickerSection.className = "webtools-colors-section";
      const pickerTitle = document.createElement("div");
      pickerTitle.className = "webtools-colors-section-title";
      pickerTitle.textContent = "手动取色";

      const picker = document.createElement("input");
      picker.type = "color";
      picker.className = "webtools-colors-picker-native";
      picker.name = "webtoolsColorsPicker";

      const pickerWrap = document.createElement("label");
      pickerWrap.className = "webtools-colors-picker";
      const pickerText = document.createElement("span");
      pickerText.className = "webtools-colors-picker-text";
      pickerText.textContent = "拖动色板或直接输入颜色值";
      pickerWrap.append(picker, pickerText);

      const input = document.createElement("input");
      input.name = "webtoolsColorsInput";
      input.className = "settings-value";
      input.placeholder = "#6c5ce7";

      const inputField = document.createElement("label");
      inputField.className = "webtools-colors-field";
      const inputLabel = document.createElement("span");
      inputLabel.className = "webtools-colors-field-label";
      inputLabel.textContent = "颜色值";
      const inputHint = document.createElement("span");
      inputHint.className = "webtools-colors-field-hint";
      inputHint.textContent = "支持 Hex，实时转换到 RGB / HSL。";
      inputField.append(inputLabel, input, inputHint);
      pickerSection.append(pickerTitle, pickerWrap, inputField);

      leftColumn.append(preview, paletteSection, pickerSection);

      const rightColumn = document.createElement("div");
      rightColumn.className = "webtools-colors-column webtools-colors-details";

      const outputsSection = document.createElement("div");
      outputsSection.className = "webtools-colors-section";
      const outputsTitle = document.createElement("div");
      outputsTitle.className = "webtools-colors-section-title";
      outputsTitle.textContent = "格式输出";
      const outputsList = document.createElement("div");
      outputsList.className = "webtools-colors-output-list";

      const createOutputRow = (
        labelText: string,
        key: "hex" | "rgb" | "hsl"
      ): HTMLDivElement => {
        const output = document.createElement("div");
        output.className = "webtools-colors-output";

        const label = document.createElement("div");
        label.className = "webtools-colors-output-label";
        label.textContent = labelText;

        const row = document.createElement("div");
        row.className = "webtools-colors-output-row";

        const value = document.createElement("div");
        value.className = "webtools-colors-output-value";
        value.setAttribute("data-webtools-colors-output", key);

        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "settings-btn settings-btn-secondary";
        copyButton.textContent = "复制";
        copyButton.addEventListener("click", () => {
          const content = value.textContent?.trim() ?? "";
          if (!content || content === "-") {
            setStatus(`当前没有可复制的 ${labelText}`);
            return;
          }
          void (async () => {
            const copied = await copyTextToClipboard(content);
            setStatus(copied ? `已复制 ${labelText}` : "复制失败");
          })();
        });

        row.append(value, copyButton);
        output.append(label, row);
        return output;
      };
      outputsList.append(
        createOutputRow("HEX", "hex"),
        createOutputRow("RGB", "rgb"),
        createOutputRow("HSL", "hsl")
      );
      outputsSection.append(outputsTitle, outputsList);

      const shadesSection = document.createElement("div");
      shadesSection.className = "webtools-colors-section";
      const shadesTitle = document.createElement("div");
      shadesTitle.className = "webtools-colors-section-title";
      shadesTitle.textContent = "明暗阶";

      const shades = document.createElement("div");
      shades.className = "webtools-colors-shades";
      shades.setAttribute("data-webtools-colors-shades", "1");
      shadesSection.append(shadesTitle, shades);

      rightColumn.append(outputsSection, shadesSection);

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

      layout.append(leftColumn, rightColumn);
      form.append(header, layout);
      panel.appendChild(form);
      panelItem.appendChild(panel);
      list.appendChild(panelItem);

      refreshWebtoolsColorsPanelInForm(form);
      scheduleWebtoolsColorsAutoConvert(form, input.value || webtoolsColorsHex, true);
    }

  export function applyWebtoolsCronPanelPayload(panel: ActivePluginPanelState): void {
      const data = toRecord(panel.data);
      hydrateWebtoolsCronTemplates(data);
      resetWebtoolsCronState(
        data && typeof data.expression === "string" ? data.expression : webtoolsCronExpression
      );
      hydrateWebtoolsCronState(data);
    }

  export function renderWebtoolsCronPanel(): void {
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

}
