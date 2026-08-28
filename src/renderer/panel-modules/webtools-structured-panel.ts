namespace RendererPanelRuntime {

  export function applyWebtoolsJsonPanelPayload(panel: ActivePluginPanelState): void {
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
        compressed,
        preview: null,
        errorPosition: null,
        selectedFields: []
      };
    }

  export function renderWebtoolsJsonPanel(): void {
      type JsonFormat = "json" | "csv" | "text" | "escaped";

      const formatOptions: Array<{ value: JsonFormat; label: string }> = [
        { value: "json", label: "JSON" },
        { value: "csv", label: "CSV" },
        { value: "text", label: "纯文本" },
        { value: "escaped", label: "Escaped" }
      ];
      const routePresets: Array<{
        label: string;
        source: JsonFormat;
        target: JsonFormat;
        compressed?: boolean;
      }> = [
        { label: "JSON -> CSV", source: "json", target: "csv" },
        { label: "CSV -> JSON", source: "csv", target: "json" },
        { label: "格式化 JSON", source: "json", target: "json", compressed: false },
        { label: "压缩 JSON", source: "json", target: "json", compressed: true },
        { label: "JSON -> Escaped", source: "json", target: "escaped" },
        { label: "Escaped -> JSON", source: "escaped", target: "json" },
        { label: "Text -> JSON", source: "text", target: "json" },
        { label: "Text -> Escaped", source: "text", target: "escaped" }
      ];
      const sampleInputs: Array<{
        label: string;
        note: string;
        source: JsonFormat;
        target: JsonFormat;
        input: string;
        compressed?: boolean;
      }> = [
        {
          label: "订单 JSON",
          note: "数组转表格",
          source: "json",
          target: "csv",
          input:
            "[\n" +
            "  {\"orderId\":\"T1001\",\"buyer\":\"Alice\",\"amount\":128.5,\"paid\":true},\n" +
            "  {\"orderId\":\"T1002\",\"buyer\":\"Bob\",\"amount\":89,\"paid\":false}\n" +
            "]"
        },
        {
          label: "CSV 表格",
          note: "表格转对象",
          source: "csv",
          target: "json",
          input: "name,role,active\nAlice,Admin,true\nBob,Editor,false"
        },
        {
          label: "接口返回",
          note: "格式化查看",
          source: "json",
          target: "json",
          input:
            "{\"code\":0,\"data\":{\"items\":[{\"id\":1,\"title\":\"发布提醒\"},{\"id\":2,\"title\":\"订单同步\"}],\"page\":1},\"traceId\":\"demo-2026\"}"
        },
        {
          label: "Escaped",
          note: "反转义 JSON",
          source: "escaped",
          target: "json",
          input: JSON.stringify(
            JSON.stringify({
              title: "发布提醒",
              done: false,
              tags: ["json", "escaped"]
            })
          )
        },
        {
          label: "多行文本",
          note: "转字符串",
          source: "text",
          target: "escaped",
          input: "第一行文本\n第二行包含 \"引号\" 和路径 C:\\\\temp"
        }
      ];
      const formatLabel = (value: string): string =>
        formatOptions.find((option) => option.value === value)?.label ?? value.toUpperCase();
      const summarizeText = (value: string): string => {
        if (!value) {
          return "0 字符 · 0 行";
        }
        return `${value.length} 字符 · ${value.split(/\r\n|\r|\n/).length} 行`;
      };
      const describePayload = (value: string, format: string): string => {
        const trimmed = value.trim();
        if (!trimmed) {
          return "等待输入";
        }
        if (format === "csv") {
          const lines = trimmed.split(/\r\n|\r|\n/).filter(Boolean);
          const columns = lines[0]?.split(",").length ?? 0;
          return `${lines.length} 行 · ${columns} 列`;
        }
        if (format === "json") {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              return `数组 · ${parsed.length} 项`;
            }
            if (parsed && typeof parsed === "object") {
              return `对象 · ${Object.keys(parsed as Record<string, unknown>).length} 键`;
            }
            return typeof parsed;
          } catch {
            return "等待校验";
          }
        }
        if (format === "escaped") {
          return "JSON 字符串";
        }
        return "纯文本";
      };
      const markButton = (button: HTMLButtonElement, text: string, resetText: string): void => {
        button.textContent = text;
        window.setTimeout(() => {
          if (button.isConnected) {
            button.textContent = resetText;
          }
        }, 1200);
      };

      const panelItem = document.createElement("li");
      panelItem.className = "settings-panel-item";

      const panel = document.createElement("section");
      panel.className = "settings-panel";

      const form = document.createElement("form");
      form.className = "settings-form webtools-json-form webtools-tool-panel webtools-json-lab";
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        void executeWebtoolsJsonConvert(form, { render: false });
      });

      const header = document.createElement("div");
      header.className = "webtools-tool-header webtools-json-header";
      const titleGroup = document.createElement("div");
      titleGroup.className = "webtools-tool-title-group";
      const title = document.createElement("h3");
      title.className = "webtools-tool-title";
      title.textContent = activePluginPanel?.title || "JSON & CSV 实验室";
      const description = document.createElement("p");
      description.className = "webtools-tool-subtitle";
      description.textContent =
        activePluginPanel?.subtitle || "输入内容后直接转换；路线、样例和清洗操作集中在紧凑选择框中。";
      titleGroup.append(title, description);

      const headerActions = document.createElement("div");
      headerActions.className = "webtools-json-toolbar";
      const convertButton = document.createElement("button");
      convertButton.type = "submit";
      convertButton.className = "settings-btn settings-btn-primary webtools-json-convert-btn";
      convertButton.textContent = "转换";
      const validateButton = document.createElement("button");
      validateButton.type = "button";
      validateButton.className =
        "settings-btn settings-btn-secondary webtools-json-validate-btn";
      validateButton.textContent = "校验";
      validateButton.addEventListener("click", () => {
        void executeWebtoolsJsonConvert(form, { render: false, action: "validate" });
      });
      const clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "settings-btn settings-btn-secondary webtools-json-clear-btn";
      clearButton.textContent = "清空";
      clearButton.addEventListener("click", () => {
        webtoolsJsonState.input = "";
        webtoolsJsonState.output = "";
        webtoolsJsonState.info = "";
        webtoolsJsonState.valid = null;
        webtoolsJsonState.preview = null;
        webtoolsJsonState.errorPosition = null;
        webtoolsJsonState.selectedFields = [];
        inputArea.value = "";
        outputArea.value = "";
        refreshWebtoolsJsonResultInForm(form);
        setStatus("已清空输入与输出");
      });
      headerActions.append(convertButton, validateButton, clearButton);
      header.append(titleGroup, headerActions);

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
      formatOptions.forEach(({ value, label }) => {
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
      swapButton.textContent = "交换";

      const targetGroup = document.createElement("label");
      targetGroup.className = "webtools-json-converter-group";
      const targetLabel = document.createElement("span");
      targetLabel.className = "webtools-json-converter-label";
      targetLabel.textContent = "目标格式";
      const targetSelect = document.createElement("select");
      targetSelect.className = "settings-number webtools-json-select";
      targetSelect.name = "webtoolsJsonTarget";
      formatOptions.forEach(({ value, label }) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        option.selected = webtoolsJsonState.targetFormat === value;
        targetSelect.appendChild(option);
      });
      targetGroup.append(targetLabel, targetSelect);

      const controlPanel = document.createElement("section");
      controlPanel.className = "webtools-json-control-panel";

      const routePresetWrap = document.createElement("div");
      routePresetWrap.className = "webtools-json-route-presets";
      const routePresetLabel = document.createElement("span");
      routePresetLabel.className = "webtools-json-mini-label";
      routePresetLabel.textContent = "常用路线";
      const routePresetSelect = document.createElement("select");
      routePresetSelect.className = "settings-number webtools-json-compact-select";
      routePresetSelect.name = "webtoolsJsonRoutePreset";
      routePresetSelect.setAttribute("aria-label", "选择常用转换路线");
      const routePlaceholder = document.createElement("option");
      routePlaceholder.value = "";
      routePlaceholder.textContent = "选择转换路线";
      routePresetSelect.appendChild(routePlaceholder);
      routePresets.forEach((preset, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = preset.label.replaceAll("->", "→");
        routePresetSelect.appendChild(option);
      });
      routePresetSelect.addEventListener("change", () => {
        if (routePresetSelect.value === "") {
          return;
        }
        const preset = routePresets[Number(routePresetSelect.value)];
        if (!preset) {
          return;
        }
        sourceSelect.value = preset.source;
        targetSelect.value = preset.target;
        compressedInput.checked = preset.compressed ?? false;
        updateJsonFormHead();
        scheduleWebtoolsJsonAutoConvert(form, true);
      });
      routePresetWrap.append(routePresetLabel, routePresetSelect);

      const sampleWrap = document.createElement("div");
      sampleWrap.className = "webtools-json-sample-strip";
      const sampleLabel = document.createElement("span");
      sampleLabel.className = "webtools-json-mini-label";
      sampleLabel.textContent = "快速样例";
      const sampleControl = document.createElement("div");
      sampleControl.className = "webtools-json-compact-action";
      const sampleSelect = document.createElement("select");
      sampleSelect.className = "settings-number webtools-json-compact-select";
      sampleSelect.name = "webtoolsJsonSample";
      sampleSelect.setAttribute("aria-label", "选择快速样例");
      const samplePlaceholder = document.createElement("option");
      samplePlaceholder.value = "";
      samplePlaceholder.textContent = "选择样例";
      sampleSelect.appendChild(samplePlaceholder);
      sampleInputs.forEach((sample, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = `${sample.label} · ${sample.note}`;
        sampleSelect.appendChild(option);
      });
      const loadSampleButton = document.createElement("button");
      loadSampleButton.type = "button";
      loadSampleButton.className =
        "settings-btn settings-btn-secondary webtools-json-compact-btn webtools-json-load-sample-btn";
      loadSampleButton.textContent = "载入";
      loadSampleButton.disabled = true;
      sampleSelect.addEventListener("change", () => {
        loadSampleButton.disabled = sampleSelect.value === "";
      });
      loadSampleButton.addEventListener("click", () => {
        if (sampleSelect.value === "") {
          return;
        }
        const sample = sampleInputs[Number(sampleSelect.value)];
        if (!sample) {
          return;
        }
        inputArea.value = sample.input;
        outputArea.value = "";
        webtoolsJsonState.output = "";
        webtoolsJsonState.selectedFields = [];
        sourceSelect.value = sample.source;
        targetSelect.value = sample.target;
        compressedInput.checked = sample.compressed ?? false;
        updateJsonFormHead();
        updateJsonStats();
        scheduleWebtoolsJsonAutoConvert(form, true);
        setStatus(`已载入${sample.label}样例`);
      });
      sampleControl.append(sampleSelect, loadSampleButton);
      sampleWrap.append(sampleLabel, sampleControl);

      const stats = document.createElement("div");
      stats.className = "webtools-json-stats";
      const routeStat = document.createElement("span");
      routeStat.className = "webtools-json-stat webtools-json-route-stat";
      const inputStat = document.createElement("span");
      inputStat.className = "webtools-json-stat webtools-json-input-stat";
      const outputStat = document.createElement("span");
      outputStat.className = "webtools-json-stat webtools-json-output-stat";
      const payloadStat = document.createElement("span");
      payloadStat.className = "webtools-json-stat webtools-json-payload-stat";
      stats.append(routeStat, inputStat, outputStat, payloadStat);

      const cleanActionsCard = document.createElement("section");
      cleanActionsCard.className = "webtools-json-clean-actions";
      const cleanHead = document.createElement("div");
      cleanHead.className = "webtools-json-card-head";
      const cleanTitle = document.createElement("span");
      cleanTitle.className = "webtools-json-card-title";
      cleanTitle.textContent = "一键清洗";
      const cleanMeta = document.createElement("span");
      cleanMeta.className = "webtools-json-card-meta";
      cleanMeta.textContent = "作用于输入区";
      cleanHead.append(cleanTitle, cleanMeta);
      const cleanControl = document.createElement("div");
      cleanControl.className = "webtools-json-compact-action";
      const cleanSelect = document.createElement("select");
      cleanSelect.className = "settings-number webtools-json-compact-select";
      cleanSelect.name = "webtoolsJsonCleanAction";
      cleanSelect.setAttribute("aria-label", "选择清洗操作");
      const cleanPlaceholder = document.createElement("option");
      cleanPlaceholder.value = "";
      cleanPlaceholder.textContent = "选择清洗操作";
      cleanSelect.appendChild(cleanPlaceholder);
      const cleanApplyButton = document.createElement("button");
      cleanApplyButton.type = "button";
      cleanApplyButton.className =
        "settings-btn settings-btn-secondary webtools-json-compact-btn webtools-json-clean-btn";
      cleanApplyButton.textContent = "执行";
      cleanApplyButton.disabled = true;
      cleanControl.append(cleanSelect, cleanApplyButton);
      cleanActionsCard.append(cleanHead, cleanControl);

      const fieldsCard = document.createElement("section");
      fieldsCard.className = "webtools-json-fields-card";
      const fieldsHead = document.createElement("div");
      fieldsHead.className = "webtools-json-card-head";
      const fieldsTitle = document.createElement("span");
      fieldsTitle.className = "webtools-json-card-title";
      fieldsTitle.textContent = "字段提取";
      const fieldsMeta = document.createElement("span");
      fieldsMeta.className = "webtools-json-card-meta";
      fieldsHead.append(fieldsTitle, fieldsMeta);
      const fieldControl = document.createElement("div");
      fieldControl.className = "webtools-json-compact-action";
      const fieldPicker = document.createElement("details");
      fieldPicker.className = "webtools-json-field-picker";
      const fieldPickerSummary = document.createElement("summary");
      fieldPickerSummary.className = "webtools-json-field-picker-summary";
      fieldPickerSummary.textContent = "等待识别字段";
      fieldPickerSummary.addEventListener("click", (event) => {
        if (fieldPicker.dataset.disabled === "true") {
          event.preventDefault();
        }
      });
      fieldPicker.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !fieldPicker.open) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        fieldPicker.open = false;
        fieldPickerSummary.focus();
      });
      const fieldPickerMenu = document.createElement("div");
      fieldPickerMenu.className = "webtools-json-field-picker-menu";
      fieldPicker.append(fieldPickerSummary, fieldPickerMenu);
      const applyFieldsButton = document.createElement("button");
      applyFieldsButton.type = "button";
      applyFieldsButton.className =
        "settings-btn settings-btn-secondary webtools-json-compact-btn webtools-json-apply-fields-btn";
      applyFieldsButton.textContent = "应用";
      applyFieldsButton.disabled = true;
      applyFieldsButton.addEventListener("click", () => {
        applySelectedFields();
        fieldPicker.open = false;
      });
      fieldControl.append(fieldPicker, applyFieldsButton);
      fieldsCard.append(fieldsHead, fieldControl);
      form.addEventListener("pointerdown", (event) => {
        if (
          fieldPicker.open &&
          event.target instanceof Node &&
          !fieldPicker.contains(event.target)
        ) {
          fieldPicker.open = false;
        }
      });

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

      const inputActions = document.createElement("div");
      inputActions.className = "webtools-json-pane-controls";
      const copyInputButton = document.createElement("button");
      copyInputButton.type = "button";
      copyInputButton.className =
        "settings-btn settings-btn-secondary webtools-json-copy-input-btn";
      copyInputButton.textContent = "复制输入";
      copyInputButton.addEventListener("click", () => {
        void (async () => {
          if (!inputArea.value) {
            setStatus("当前没有可复制的输入内容");
            return;
          }
          const copied = await copyTextToClipboard(inputArea.value);
          if (copied) {
            markButton(copyInputButton, "已复制", "复制输入");
          }
          setStatus(copied ? "已复制输入内容" : "复制失败");
        })();
      });
      inputActions.append(copyInputButton);

      const outputArea = document.createElement("textarea");
      outputArea.className = "settings-value webtools-textarea webtools-json-textarea";
      outputArea.name = "webtoolsJsonOutput";
      outputArea.readOnly = true;
      outputArea.placeholder = "转换后结果";
      outputArea.value = webtoolsJsonState.output;

      const outputMeta = document.createElement("div");
      outputMeta.className = "webtools-json-pane-controls";
      outputMeta.append(compressedWrap);

      const useOutputButton = document.createElement("button");
      useOutputButton.type = "button";
      useOutputButton.className =
        "settings-btn settings-btn-secondary webtools-json-use-output-btn";
      useOutputButton.textContent = "回填";
      useOutputButton.addEventListener("click", () => {
        if (!outputArea.value.trim()) {
          setStatus("当前没有可回填的输出内容");
          return;
        }
        inputArea.value = outputArea.value;
        sourceSelect.value = targetSelect.value;
        webtoolsJsonState.output = "";
        webtoolsJsonState.selectedFields = [];
        outputArea.value = "";
        updateJsonFormHead();
        updateJsonStats();
        scheduleWebtoolsJsonAutoConvert(form, true);
        setStatus("已将输出回填为输入");
      });

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className =
        "settings-btn settings-btn-secondary webtools-json-copy-btn";
      copyButton.textContent = "复制输出";
      copyButton.addEventListener("click", () => {
        void (async () => {
          if (!outputArea.value) {
            setStatus("当前没有可复制的输出内容");
            return;
          }
          const copied = await copyTextToClipboard(outputArea.value);
          if (copied) {
            markButton(copyButton, "已复制", "复制输出");
          }
          setStatus(copied ? "已复制输出内容" : "复制失败");
        })();
      });
      outputMeta.append(useOutputButton, copyButton);

      const sortJsonKeys = (value: unknown): unknown => {
        if (Array.isArray(value)) {
          return value.map((item) => sortJsonKeys(item));
        }
        if (value && typeof value === "object") {
          return Object.keys(value as Record<string, unknown>)
            .sort((left, right) => left.localeCompare(right))
            .reduce<Record<string, unknown>>((result, key) => {
              result[key] = sortJsonKeys((value as Record<string, unknown>)[key]);
              return result;
            }, {});
        }
        return value;
      };

      const pruneJsonValue = (value: unknown): unknown => {
        if (Array.isArray(value)) {
          const items = value
            .map((item) => pruneJsonValue(item))
            .filter(
              (item) =>
                item !== null &&
                item !== "" &&
                !(Array.isArray(item) && item.length === 0) &&
                !(item && typeof item === "object" && Object.keys(item as Record<string, unknown>).length === 0)
            );
          return items;
        }
        if (value && typeof value === "object") {
          const nextEntries = Object.entries(value as Record<string, unknown>)
            .map(([key, item]) => [key, pruneJsonValue(item)] as const)
            .filter(
              ([, item]) =>
                item !== null &&
                item !== "" &&
                !(Array.isArray(item) && item.length === 0) &&
                !(item && typeof item === "object" && Object.keys(item as Record<string, unknown>).length === 0)
            );
          return Object.fromEntries(nextEntries);
        }
        return value;
      };

      const updateJsonInputValue = (nextInput: string, statusText: string): void => {
        inputArea.value = nextInput;
        webtoolsJsonState.input = nextInput;
        webtoolsJsonState.output = "";
        webtoolsJsonState.valid = null;
        webtoolsJsonState.info = "";
        webtoolsJsonState.errorPosition = null;
        updateJsonStats();
        scheduleWebtoolsJsonAutoConvert(form, true);
        setStatus(statusText);
      };

      const applyJsonCleanAction = (
        label: string,
        transform: (source: string) => string
      ): void => {
        try {
          updateJsonInputValue(transform(inputArea.value), `已执行${label}`);
        } catch (error) {
          const message = error instanceof Error && error.message ? error.message : `${label}失败`;
          setStatus(message);
        }
      };

      const applySelectedFields = (): void => {
        const selected = webtoolsJsonState.selectedFields;
        if (selected.length === 0) {
          setStatus("请先选择至少一个字段");
          return;
        }
        try {
          if (sourceSelect.value === "csv") {
            const lines = inputArea.value.split(/\r?\n/).filter((line) => line.length > 0);
            if (lines.length === 0) {
              setStatus("当前没有可提取的 CSV 内容");
              return;
            }
            const headers = lines[0].split(",");
            const indexes = selected
              .map((key) => headers.indexOf(key))
              .filter((index) => index >= 0);
            const nextLines = lines.map((line, index) => {
              const cells = line.split(",");
              if (index === 0) {
                return indexes.map((cellIndex) => cells[cellIndex] ?? "").join(",");
              }
              return indexes.map((cellIndex) => cells[cellIndex] ?? "").join(",");
            });
            updateJsonInputValue(nextLines.join("\n"), `已提取 ${selected.length} 个字段`);
            return;
          }

          const parsed = JSON.parse(inputArea.value);
          const pickObject = (row: Record<string, unknown>) =>
            selected.reduce<Record<string, unknown>>((result, key) => {
              if (key in row) {
                result[key] = row[key];
              }
              return result;
            }, {});

          const nextValue = Array.isArray(parsed)
            ? parsed.map((item) =>
                item && typeof item === "object" && !Array.isArray(item)
                  ? pickObject(item as Record<string, unknown>)
                  : item
              )
            : parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? pickObject(parsed as Record<string, unknown>)
            : parsed;
          const nextInput = JSON.stringify(nextValue, null, 2);
          updateJsonInputValue(nextInput, `已提取 ${selected.length} 个字段`);
        } catch (error) {
          const message = error instanceof Error && error.message ? error.message : "字段提取失败";
          setStatus(message);
        }
      };

      const renderFieldSelector = (): void => {
        fieldPickerMenu.replaceChildren();
        const fields = webtoolsJsonState.preview?.fields ?? [];
        fieldsMeta.textContent = fields.length > 0 ? `${fields.length} 个字段` : "不可用";
        const selectedFields = webtoolsJsonState.selectedFields.filter((key) =>
          fields.some((field) => field.key === key)
        );
        webtoolsJsonState.selectedFields = selectedFields;
        applyFieldsButton.disabled = selectedFields.length === 0;
        if (fields.length === 0) {
          fieldPicker.dataset.disabled = "true";
          fieldPicker.open = false;
          fieldPickerSummary.textContent = "等待识别字段";
          fieldPickerSummary.setAttribute("aria-disabled", "true");
          return;
        }

        fieldPicker.dataset.disabled = "false";
        fieldPickerSummary.removeAttribute("aria-disabled");
        fieldPickerSummary.textContent =
          selectedFields.length > 0
            ? `已选 ${selectedFields.length}/${fields.length}`
            : `选择字段（${fields.length}）`;

        const pickerActions = document.createElement("div");
        pickerActions.className = "webtools-json-field-picker-actions";

        const selectAllButton = document.createElement("button");
        selectAllButton.type = "button";
        selectAllButton.className = "settings-btn settings-btn-secondary webtools-json-mini-btn";
        selectAllButton.textContent = "全选";
        selectAllButton.addEventListener("click", () => {
          webtoolsJsonState.selectedFields = fields.map((field) => field.key);
          renderFieldSelector();
          fieldPicker.open = true;
        });

        const clearSelectButton = document.createElement("button");
        clearSelectButton.type = "button";
        clearSelectButton.className = "settings-btn settings-btn-secondary webtools-json-mini-btn";
        clearSelectButton.textContent = "清空";
        clearSelectButton.addEventListener("click", () => {
          webtoolsJsonState.selectedFields = [];
          renderFieldSelector();
          fieldPicker.open = true;
        });

        pickerActions.append(selectAllButton, clearSelectButton);
        fieldPickerMenu.appendChild(pickerActions);

        fields.forEach((field) => {
          const option = document.createElement("label");
          option.className = "webtools-json-field-picker-option";
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = selectedFields.includes(field.key);
          const optionText = document.createElement("span");
          optionText.textContent =
            typeof field.count === "number" ? `${field.key} (${field.count})` : field.key;
          checkbox.addEventListener("change", () => {
            if (!checkbox.checked) {
              webtoolsJsonState.selectedFields = webtoolsJsonState.selectedFields.filter(
                (key) => key !== field.key
              );
            } else if (!webtoolsJsonState.selectedFields.includes(field.key)) {
              webtoolsJsonState.selectedFields = [...webtoolsJsonState.selectedFields, field.key];
            }
            renderFieldSelector();
            fieldPicker.open = true;
          });
          option.append(checkbox, optionText);
          fieldPickerMenu.appendChild(option);
        });
      };

      const cleanActions = [
        {
          label: "格式化 JSON",
          action: () =>
            applyJsonCleanAction("格式化 JSON", (source) =>
              JSON.stringify(JSON.parse(source), null, 2)
            )
        },
        {
          label: "压缩 JSON",
          action: () =>
            applyJsonCleanAction("压缩 JSON", (source) => JSON.stringify(JSON.parse(source)))
        },
        {
          label: "字段排序",
          action: () =>
            applyJsonCleanAction("字段排序", (source) =>
              JSON.stringify(sortJsonKeys(JSON.parse(source)), null, 2)
            )
        },
        {
          label: "移除空值",
          action: () =>
            applyJsonCleanAction("移除空值", (source) =>
              JSON.stringify(pruneJsonValue(JSON.parse(source)), null, 2)
            )
        }
      ];
      cleanActions.forEach((item, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = item.label;
        cleanSelect.appendChild(option);
      });
      cleanSelect.addEventListener("change", () => {
        cleanApplyButton.disabled = cleanSelect.value === "";
      });
      cleanApplyButton.addEventListener("click", () => {
        if (cleanSelect.value === "") {
          return;
        }
        const item = cleanActions[Number(cleanSelect.value)];
        item?.action();
      });

      let jsonStatsDebounceHandle: number | null = null;

      const updateJsonStats = (): void => {
        routeStat.textContent = `${formatLabel(sourceSelect.value)} -> ${formatLabel(targetSelect.value)}`;
        inputStat.textContent = `输入 ${summarizeText(inputArea.value)}`;
        outputStat.textContent = `输出 ${summarizeText(outputArea.value)}`;
        payloadStat.textContent = describePayload(inputArea.value, sourceSelect.value);
        payloadStat.dataset.state = webtoolsJsonState.valid === false ? "error" : "idle";
        renderFieldSelector();
      };

      // `describePayload` runs JSON.parse and the field selector rebuilds DOM
      // nodes; debounce the per-keystroke call so large payloads don't re-parse
      // on every single character.
      const scheduleUpdateJsonStats = (): void => {
        if (jsonStatsDebounceHandle !== null) {
          window.clearTimeout(jsonStatsDebounceHandle);
        }
        jsonStatsDebounceHandle = window.setTimeout(() => {
          jsonStatsDebounceHandle = null;
          updateJsonStats();
        }, 220);
      };

      const updateJsonFormHead = (): void => {
        compressedWrap.style.display = targetSelect.value === "json" ? "" : "none";
        inputMeta.textContent = sourceSelect.value.toUpperCase();
        outputMetaText.textContent = targetSelect.value.toUpperCase();
        const activeRouteIndex = routePresets.findIndex(
          (preset) =>
            sourceSelect.value === preset.source &&
            targetSelect.value === preset.target &&
            (preset.compressed === undefined ||
              compressedInput.checked === Boolean(preset.compressed))
        );
        routePresetSelect.value = activeRouteIndex >= 0 ? String(activeRouteIndex) : "";
        updateJsonStats();
      };

      swapButton.addEventListener("click", () => {
        const source = sourceSelect.value;
        sourceSelect.value = (targetSelect.value || "json") as string;
        targetSelect.value = source as string;

        if (webtoolsJsonState.output.trim()) {
          inputArea.value = webtoolsJsonState.output;
          webtoolsJsonState.output = "";
          webtoolsJsonState.selectedFields = [];
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
        updateJsonFormHead();
        scheduleWebtoolsJsonAutoConvert(form, true);
      });
      inputArea.addEventListener("input", () => {
        webtoolsJsonState.selectedFields = [];
        scheduleUpdateJsonStats();
        scheduleWebtoolsJsonAutoConvert(form);
      });

      converterBar.append(sourceGroup, swapButton, targetGroup);
      controlPanel.append(
        converterBar,
        routePresetWrap,
        sampleWrap,
        cleanActionsCard,
        fieldsCard,
        stats
      );

      const editors = document.createElement("div");
      editors.className = "webtools-json-shell webtools-json-editors";

      const inputPane = document.createElement("section");
      inputPane.className = "webtools-json-pane";
      const inputHead = document.createElement("div");
      inputHead.className = "webtools-json-pane-head";
      const inputTitle = document.createElement("span");
      inputTitle.className = "webtools-json-pane-title";
      inputTitle.textContent = "输入内容";
      const inputMeta = document.createElement("span");
      inputMeta.className = "webtools-json-pane-meta webtools-json-input-meta";
      inputMeta.textContent = webtoolsJsonState.sourceFormat.toUpperCase();
      const inputTitleWrap = document.createElement("div");
      inputTitleWrap.className = "webtools-json-pane-title-wrap";
      inputTitleWrap.append(inputTitle, inputMeta);
      inputHead.append(inputTitleWrap, inputActions);
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
      outputTitle.textContent = "输出结果";
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

      form.addEventListener("webtools-json-sync", () => {
        updateJsonFormHead();
        updateJsonStats();
      });
      updateJsonFormHead();

      form.append(header, controlPanel, editors, info);
      panel.append(form);
      panelItem.appendChild(panel);
      list.appendChild(panelItem);

      scheduleWebtoolsJsonAutoConvert(form, true);
    }

  export function applyWebtoolsUrlPanelPayload(panel: ActivePluginPanelState): void {
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
    }

  export function renderWebtoolsUrlPanel(): void {
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
        createWebtoolsUrlPartField("协议", "protocol"),
        createWebtoolsUrlPartField("主机", "host"),
        createWebtoolsUrlPartField("端口", "port"),
        createWebtoolsUrlPartField("路径", "pathname", true),
        createWebtoolsUrlPartField("查询串", "search", true),
        createWebtoolsUrlPartField("锚点", "hash", true)
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
    }

  export function applyWebtoolsTimestampPanelPayload(panel: ActivePluginPanelState): void {
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
    }

  export function renderWebtoolsTimestampPanel(): void {
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
        const previousUnit = webtoolsTimestampUnit;
        const nextUnit = normalizeWebtoolsTimestampUnit(unitSelect.value);
        // Re-express the existing unix value in the newly selected unit so the left
        // field visibly tracks the unit (s <-> ms multiplies/divides by 1000).
        const convertedUnix = convertWebtoolsTimestampUnixValue(
          webtoolsTimestampUnixInput,
          previousUnit,
          nextUnit
        );
        if (convertedUnix !== null) {
          webtoolsTimestampUnixInput = convertedUnix;
          unixInput.value = convertedUnix;
        }
        webtoolsTimestampUnit = nextUnit;
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
    }

  export function applyWebtoolsDiffPanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    webtoolsDiffLeft =
      data && typeof data.left === "string"
        ? data.left
        : "Hello World\nThis is a test of the diff utility.\nSome lines stay the same.";
    webtoolsDiffRight =
      data && typeof data.right === "string"
        ? data.right
        : "Hello Everyone\nThis is a test of the diff engine.\nSome lines stay the same.\nAdded a new line here!";
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
  }

  export function renderWebtoolsDiffPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-diff-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-diff-form";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsDiffCompare(form, { render: false });
    });

    const header = document.createElement("div");
    header.className = "webtools-diff-header";
    const headerText = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "文本对比";
    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle || "实时比较两段文本并输出高亮差异视图。";
    headerText.append(title, description);
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "settings-btn settings-btn-secondary";
    clearButton.textContent = "清空";
    clearButton.addEventListener("click", () => {
      webtoolsDiffLeft = "";
      webtoolsDiffRight = "";
      webtoolsDiffPrettyHtml = "";
      webtoolsDiffSummary = null;
      const leftNode = form.elements.namedItem("webtoolsDiffLeft");
      const rightNode = form.elements.namedItem("webtoolsDiffRight");
      if (leftNode instanceof HTMLTextAreaElement) {
        leftNode.value = "";
      }
      if (rightNode instanceof HTMLTextAreaElement) {
        rightNode.value = "";
      }
      refreshWebtoolsDiffResultInForm(form);
      setStatus("已清空文本对比内容");
    });
    header.append(headerText, clearButton);

    const editors = document.createElement("div");
    editors.className = "webtools-diff-editors";

    const leftWrap = document.createElement("label");
    leftWrap.className = "webtools-diff-editor";
    const leftLabel = document.createElement("span");
    leftLabel.className = "settings-row-label";
    leftLabel.textContent = "原文本 (A)";
    const leftArea = document.createElement("textarea");
    leftArea.className = "settings-value webtools-textarea";
    leftArea.name = "webtoolsDiffLeft";
    leftArea.value = webtoolsDiffLeft;
    leftArea.placeholder = "输入左侧文本";
    leftWrap.append(leftLabel, leftArea);

    const rightWrap = document.createElement("label");
    rightWrap.className = "webtools-diff-editor";
    const rightLabel = document.createElement("span");
    rightLabel.className = "settings-row-label";
    rightLabel.textContent = "新文本 (B)";
    const rightArea = document.createElement("textarea");
    rightArea.className = "settings-value webtools-textarea";
    rightArea.name = "webtoolsDiffRight";
    rightArea.value = webtoolsDiffRight;
    rightArea.placeholder = "输入右侧文本";
    rightWrap.append(rightLabel, rightArea);

    editors.append(leftWrap, rightWrap);

    const optionsRow = document.createElement("div");
    optionsRow.className = "webtools-password-flags webtools-diff-options";

    const ignoreCaseWrap = document.createElement("label");
    ignoreCaseWrap.className = "webtools-password-flag";
    const ignoreCaseInput = document.createElement("input");
    ignoreCaseInput.type = "checkbox";
    ignoreCaseInput.name = "webtoolsDiffIgnoreCase";
    ignoreCaseInput.className = "password-checkbox";
    ignoreCaseInput.checked = webtoolsDiffIgnoreCase;
    const ignoreCaseText = document.createElement("span");
    ignoreCaseText.textContent = "忽略大小写";
    ignoreCaseWrap.append(ignoreCaseInput, ignoreCaseText);

    const ignoreWhitespaceWrap = document.createElement("label");
    ignoreWhitespaceWrap.className = "webtools-password-flag";
    const ignoreWhitespaceInput = document.createElement("input");
    ignoreWhitespaceInput.type = "checkbox";
    ignoreWhitespaceInput.name = "webtoolsDiffIgnoreWhitespace";
    ignoreWhitespaceInput.className = "password-checkbox";
    ignoreWhitespaceInput.checked = webtoolsDiffIgnoreWhitespace;
    const ignoreWhitespaceText = document.createElement("span");
    ignoreWhitespaceText.textContent = "忽略空白";
    ignoreWhitespaceWrap.append(ignoreWhitespaceInput, ignoreWhitespaceText);

    optionsRow.append(ignoreCaseWrap, ignoreWhitespaceWrap);

    const summary = document.createElement("div");
    summary.className = "webtools-diff-summary";

    const resultPane = document.createElement("section");
    resultPane.className = "webtools-diff-result";
    const resultLabel = document.createElement("div");
    resultLabel.className = "webtools-diff-result-label";
    resultLabel.textContent = "差异视图";
    const viewer = document.createElement("div");
    viewer.className = "webtools-diff-viewer";
    resultPane.append(resultLabel, viewer);

    [leftArea, rightArea].forEach((node) => {
      node.addEventListener("input", () => {
        scheduleWebtoolsDiffAutoCompare(form);
      });
    });
    [ignoreCaseInput, ignoreWhitespaceInput].forEach((node) => {
      node.addEventListener("change", () => {
        scheduleWebtoolsDiffAutoCompare(form, true);
      });
    });

    form.append(header, editors, optionsRow, summary, resultPane);
    panel.append(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsDiffResultInForm(form);
    scheduleWebtoolsDiffAutoCompare(form, true);
  }

  export function applyWebtoolsJsonSchemaPanelPayload(panel: ActivePluginPanelState): void {
      const data = toRecord(panel.data);
      webtoolsJsonSchemaText =
        data && typeof data.schema === "string" ? data.schema : webtoolsJsonSchemaText;
      webtoolsJsonSchemaPayload =
        data && typeof data.payload === "string" ? data.payload : webtoolsJsonSchemaPayload;
      webtoolsJsonSchemaValid = null;
      webtoolsJsonSchemaInfo = "";
      webtoolsJsonSchemaErrors = [];
    }

  export function renderWebtoolsJsonSchemaPanel(): void {
      const panelItem = document.createElement("li");
      panelItem.className = "settings-panel-item";

      const panel = document.createElement("section");
      panel.className = "settings-panel webtools-json-schema-panel";

      const form = document.createElement("form");
      form.className = "settings-form webtools-json-schema-form";
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        void executeWebtoolsJsonSchemaValidate(form, { render: false });
      });

      const header = document.createElement("div");
      header.className = "webtools-json-schema-header";
      const title = document.createElement("h3");
      title.className = "settings-title";
      title.textContent = activePluginPanel?.title || "JSON Schema 校验";
      const description = document.createElement("p");
      description.className = "settings-description";
      description.textContent =
        activePluginPanel?.subtitle || "左侧 Schema，右侧 Payload，自动展示错误路径。";
      header.append(title, description);

      const editors = document.createElement("div");
      editors.className = "webtools-json-schema-editors";

      const schemaWrap = document.createElement("label");
      schemaWrap.className = "webtools-json-schema-editor";
      const schemaLabel = document.createElement("span");
      schemaLabel.className = "settings-row-label";
      schemaLabel.textContent = "Schema";
      const schemaArea = document.createElement("textarea");
      schemaArea.className = "settings-value webtools-textarea";
      schemaArea.name = "webtoolsJsonSchemaText";
      schemaArea.value = webtoolsJsonSchemaText;
      schemaArea.placeholder = "输入 JSON Schema";
      schemaWrap.append(schemaLabel, schemaArea);

      const payloadWrap = document.createElement("label");
      payloadWrap.className = "webtools-json-schema-editor";
      const payloadLabel = document.createElement("span");
      payloadLabel.className = "settings-row-label";
      payloadLabel.textContent = "Payload";
      const payloadArea = document.createElement("textarea");
      payloadArea.className = "settings-value webtools-textarea";
      payloadArea.name = "webtoolsJsonSchemaPayload";
      payloadArea.value = webtoolsJsonSchemaPayload;
      payloadArea.placeholder = "输入待校验 JSON";
      payloadWrap.append(payloadLabel, payloadArea);

      editors.append(schemaWrap, payloadWrap);

      const info = document.createElement("div");
      info.className = "webtools-json-schema-info";
      info.dataset.state = "idle";

      const errors = document.createElement("ul");
      errors.className = "webtools-json-schema-errors";
      errors.hidden = true;

      const actions = document.createElement("div");
      actions.className = "settings-actions";
      const validateButton = document.createElement("button");
      validateButton.type = "submit";
      validateButton.className = "settings-btn settings-btn-primary";
      validateButton.textContent = "立即校验";
      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "settings-btn settings-btn-secondary";
      copyButton.textContent = "复制结果";
      copyButton.addEventListener("click", () => {
        const lines =
          webtoolsJsonSchemaValid === true
            ? ["校验通过"]
            : webtoolsJsonSchemaErrors.map((error) => `${error.path} ${error.message}`);
        void copyTextToClipboard(lines.join("\n")).then((copied) => {
          setStatus(copied ? "已复制校验结果" : "复制失败");
        });
      });
      actions.append(validateButton, copyButton);

      [schemaArea, payloadArea].forEach((node) => {
        node.addEventListener("input", () => {
          scheduleWebtoolsJsonSchemaAutoValidate(form);
        });
      });

      form.append(header, editors, info, errors, actions);
      panel.append(form);
      panelItem.appendChild(panel);
      list.appendChild(panelItem);

      refreshWebtoolsJsonSchemaResultInForm(form);
      scheduleWebtoolsJsonSchemaAutoValidate(form, true);
    }

  export function applyWebtoolsDataMaskPanelPayload(panel: ActivePluginPanelState): void {
      const data = toRecord(panel.data);
      webtoolsDataMaskInput =
        data && typeof data.input === "string" ? data.input : webtoolsDataMaskInput;
      webtoolsDataMaskPhone =
        data && typeof data.maskPhone === "boolean" ? data.maskPhone : webtoolsDataMaskPhone;
      webtoolsDataMaskEmail =
        data && typeof data.maskEmail === "boolean" ? data.maskEmail : webtoolsDataMaskEmail;
      webtoolsDataMaskIdCard =
        data && typeof data.maskIdCard === "boolean" ? data.maskIdCard : webtoolsDataMaskIdCard;
      webtoolsDataMaskFakeKind =
        data &&
        (data.fakeKind === "name" ||
          data.fakeKind === "email" ||
          data.fakeKind === "phone" ||
          data.fakeKind === "uuid" ||
          data.fakeKind === "company")
          ? data.fakeKind
          : webtoolsDataMaskFakeKind;
      webtoolsDataMaskFakeCount =
        data && typeof data.fakeCount === "number"
          ? Math.max(1, Math.min(50, Math.round(data.fakeCount)))
          : webtoolsDataMaskFakeCount;
      webtoolsDataMaskOutput = "";
      webtoolsDataMaskInfo = "";
    }

  export function renderWebtoolsDataMaskPanel(): void {
      const panelItem = document.createElement("li");
      panelItem.className = "settings-panel-item";

      const panel = document.createElement("section");
      panel.className = "settings-panel webtools-data-mask-panel";

      const form = document.createElement("form");
      form.className = "settings-form webtools-data-mask-form";
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        void executeWebtoolsDataMaskAction(form, webtoolsDataMaskMode, { render: false });
      });

      const title = document.createElement("h3");
      title.className = "settings-title";
      title.textContent = activePluginPanel?.title || "文本脱敏 / 假数据";
      const description = document.createElement("p");
      description.className = "settings-description";
      description.textContent =
        activePluginPanel?.subtitle || "日志分享前脱敏，或一键生成测试数据。";

      const inputWrap = document.createElement("label");
      inputWrap.className = "settings-row webtools-row-full";
      const inputLabel = document.createElement("span");
      inputLabel.className = "settings-row-label";
      inputLabel.textContent = "输入文本";
      const inputArea = document.createElement("textarea");
      inputArea.className = "settings-value webtools-textarea";
      inputArea.name = "webtoolsDataMaskInput";
      inputArea.value = webtoolsDataMaskInput;
      inputWrap.append(inputLabel, inputArea);

      const optionsRow = document.createElement("div");
      optionsRow.className = "webtools-password-flags webtools-data-mask-options";
      [
        ["webtoolsDataMaskPhone", "脱敏手机号", webtoolsDataMaskPhone],
        ["webtoolsDataMaskEmail", "脱敏邮箱", webtoolsDataMaskEmail],
        ["webtoolsDataMaskIdCard", "脱敏身份证", webtoolsDataMaskIdCard]
      ].forEach(([name, label, checked]) => {
        const wrap = document.createElement("label");
        wrap.className = "webtools-password-flag";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = String(name);
        input.className = "password-checkbox";
        input.checked = Boolean(checked);
        const text = document.createElement("span");
        text.textContent = String(label);
        wrap.append(input, text);
        optionsRow.appendChild(wrap);
      });

      const fakeRow = document.createElement("div");
      fakeRow.className = "webtools-data-mask-fake-row";
      const kindWrap = document.createElement("label");
      kindWrap.className = "settings-row";
      const kindLabel = document.createElement("span");
      kindLabel.className = "settings-row-label";
      kindLabel.textContent = "假数据类型";
      const kindSelect = document.createElement("select");
      kindSelect.className = "settings-value";
      kindSelect.name = "webtoolsDataMaskFakeKind";
      [
        ["uuid", "UUID"],
        ["name", "姓名"],
        ["email", "邮箱"],
        ["phone", "手机号"],
        ["company", "公司名"]
      ].forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        option.selected = webtoolsDataMaskFakeKind === value;
        kindSelect.appendChild(option);
      });
      kindWrap.append(kindLabel, kindSelect);

      const countWrap = document.createElement("label");
      countWrap.className = "settings-row";
      const countLabel = document.createElement("span");
      countLabel.className = "settings-row-label";
      countLabel.textContent = "生成条数";
      const countInput = document.createElement("input");
      countInput.className = "settings-value";
      countInput.type = "number";
      countInput.min = "1";
      countInput.max = "50";
      countInput.name = "webtoolsDataMaskFakeCount";
      countInput.value = String(webtoolsDataMaskFakeCount);
      countWrap.append(countLabel, countInput);
      fakeRow.append(kindWrap, countWrap);

      const outputWrap = document.createElement("label");
      outputWrap.className = "settings-row webtools-row-full";
      const outputLabel = document.createElement("span");
      outputLabel.className = "settings-row-label";
      outputLabel.textContent = "输出";
      const outputArea = document.createElement("textarea");
      outputArea.className = "settings-value webtools-textarea";
      outputArea.name = "webtoolsDataMaskOutput";
      outputArea.readOnly = true;
      outputArea.value = webtoolsDataMaskOutput;
      outputWrap.append(outputLabel, outputArea);

      const info = document.createElement("div");
      info.className = "webtools-data-mask-info";
      info.dataset.state = "idle";

      const actions = document.createElement("div");
      actions.className = "settings-actions";
      const maskButton = document.createElement("button");
      maskButton.type = "button";
      maskButton.className = "settings-btn settings-btn-primary";
      maskButton.textContent = "执行脱敏";
      maskButton.addEventListener("click", () => {
        webtoolsDataMaskMode = "mask";
        void executeWebtoolsDataMaskAction(form, "mask", { render: false });
      });
      const generateButton = document.createElement("button");
      generateButton.type = "button";
      generateButton.className = "settings-btn settings-btn-secondary";
      generateButton.textContent = "生成假数据";
      generateButton.addEventListener("click", () => {
        webtoolsDataMaskMode = "generate";
        void executeWebtoolsDataMaskAction(form, "generate", { render: false });
      });
      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "settings-btn settings-btn-secondary";
      copyButton.textContent = "复制输出";
      copyButton.addEventListener("click", () => {
        void copyTextToClipboard(outputArea.value).then((copied) => {
          setStatus(copied ? "已复制输出" : "复制失败");
        });
      });
      actions.append(maskButton, generateButton, copyButton);

      form.append(title, description, inputWrap, optionsRow, fakeRow, outputWrap, info, actions);
      panel.append(form);
      panelItem.appendChild(panel);
      list.appendChild(panelItem);

      refreshWebtoolsDataMaskResultInForm(form);
    }

}
