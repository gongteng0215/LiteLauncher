namespace RendererPanelRuntime {

  export function applyWebtoolsImageBase64PanelPayload(panel: ActivePluginPanelState): void {
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
    }

  export function renderWebtoolsImageBase64Panel(): void {
      const panelItem = document.createElement("li");
      panelItem.className = "settings-panel-item";

      const panel = document.createElement("section");
      panel.className = "settings-panel webtools-image-base64-panel";

      const form = document.createElement("form");
      form.className = "settings-form webtools-image-base64-form";
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        void executeWebtoolsImageBase64Normalize(input.value, { render: false, form });
      });

      const header = document.createElement("div");
      header.className = "webtools-image-base64-header";

      const headerText = document.createElement("div");
      const title = document.createElement("h3");
      title.className = "settings-title webtools-image-base64-title";
      title.textContent = activePluginPanel?.title || "图片 Base64";
      const description = document.createElement("p");
      description.className = "settings-description webtools-image-base64-description";
      description.textContent =
        activePluginPanel?.subtitle || "拖入图片或粘贴 Base64 / DataURL，实时转换、预览与导出。";
      headerText.append(title, description);

      const toolbar = document.createElement("div");
      toolbar.className = "webtools-image-base64-toolbar";

      const previewHost = document.createElement("div");
      previewHost.className = "webtools-image-base64-preview-host";

      const meta = document.createElement("div");
      meta.className = "webtools-image-base64-meta";

      const dropzone = document.createElement("div");
      dropzone.className = "webtools-image-base64-dropzone";

      const dropzoneTitle = document.createElement("div");
      dropzoneTitle.className = "webtools-image-base64-dropzone-title";
      dropzoneTitle.textContent = "拖拽图片到这里";

      const dropzoneHint = document.createElement("div");
      dropzoneHint.className = "webtools-image-base64-dropzone-hint";
      dropzoneHint.textContent = "支持 PNG、JPG、WebP、GIF、SVG，也可以直接粘贴 DataURL。";

      const uploadButton = document.createElement("label");
      uploadButton.className = "settings-btn settings-btn-secondary webtools-image-base64-upload";
      uploadButton.textContent = "选择图片";

      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.className = "webtools-image-base64-file-input";
      uploadButton.appendChild(fileInput);
      dropzone.append(dropzoneTitle, dropzoneHint, uploadButton);

      const input = document.createElement("textarea");
      input.className = "settings-value webtools-textarea webtools-image-base64-textarea";
      input.name = "webtoolsImageBase64Input";
      input.value = webtoolsImageBase64Input;
      input.placeholder = "粘贴 Base64 或 DataURL，或从左侧拖入图片。";

      const output = document.createElement("textarea");
      output.className = "settings-value webtools-textarea webtools-image-base64-textarea";
      output.readOnly = true;
      output.value = webtoolsImageBase64DataUrl;
      output.setAttribute("data-webtools-image-base64-output", "1");
      output.placeholder = "转换后会在这里输出完整 DataURL。";

      const info = document.createElement("div");
      info.className = "webtools-tool-info";

      const copyRaw = document.createElement("button");
      copyRaw.type = "button";
      copyRaw.className = "settings-btn settings-btn-secondary";
      copyRaw.textContent = "复制 Base64";
      copyRaw.setAttribute("data-webtools-image-copy-raw", "1");

      const copyDataUrl = document.createElement("button");
      copyDataUrl.type = "button";
      copyDataUrl.className = "settings-btn settings-btn-secondary";
      copyDataUrl.textContent = "复制 DataURL";
      copyDataUrl.setAttribute("data-webtools-image-copy-dataurl", "1");

      const download = document.createElement("button");
      download.type = "button";
      download.className = "settings-btn settings-btn-primary";
      download.textContent = "下载图片";
      download.setAttribute("data-webtools-image-download", "1");

      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "settings-btn settings-btn-secondary";
      clear.textContent = "清空";
      clear.setAttribute("data-webtools-image-clear", "1");

      toolbar.append(copyRaw, copyDataUrl, download, clear);
      header.append(headerText, toolbar);

      const layout = document.createElement("div");
      layout.className = "webtools-image-base64-layout";

      const previewPane = document.createElement("section");
      previewPane.className = "webtools-image-base64-preview";
      previewPane.append(previewHost, meta, dropzone);

      const editorPane = document.createElement("section");
      editorPane.className = "webtools-image-base64-editor";

      const inputWrap = document.createElement("label");
      inputWrap.className = "webtools-colors-section";
      const inputLabel = document.createElement("span");
      inputLabel.className = "webtools-image-base64-input-label";
      inputLabel.textContent = "输入内容";
      inputWrap.append(inputLabel, input);

      const outputWrap = document.createElement("label");
      outputWrap.className = "webtools-colors-section";
      const outputLabel = document.createElement("span");
      outputLabel.className = "webtools-image-base64-input-label";
      outputLabel.textContent = "标准化输出";
      outputWrap.append(outputLabel, output);

      editorPane.append(inputWrap, info, outputWrap);
      layout.append(previewPane, editorPane);

      const loadImageFile = async (file: File): Promise<void> => {
        if (!file.type.startsWith("image/")) {
          setStatus("请选择图片文件");
          return;
        }
        try {
          const dataUrl = await readWebtoolsImageBase64FileAsDataUrl(file);
          webtoolsImageBase64Dragging = false;
          webtoolsImageBase64FileName = file.name;
          webtoolsImageBase64Input = dataUrl;
          input.value = dataUrl;
          refreshWebtoolsImageBase64PanelInForm(form);
          await executeWebtoolsImageBase64Normalize(dataUrl, { render: false, form });
        } catch (error) {
          webtoolsImageBase64Dragging = false;
          webtoolsImageBase64DataUrl = "";
          webtoolsImageBase64Raw = "";
          webtoolsImageBase64Mime = "";
          webtoolsImageBase64SizeText = "";
          webtoolsImageBase64Info = "";
          webtoolsImageBase64Error =
            error instanceof Error && error.message.trim() ? error.message : "读取图片失败";
          refreshWebtoolsImageBase64PanelInForm(form);
          setStatus(webtoolsImageBase64Error);
        }
      };

      copyRaw.addEventListener("click", async () => {
        if (!webtoolsImageBase64Raw.trim()) {
          setStatus("没有可复制的 Base64");
          return;
        }
        await navigator.clipboard.writeText(webtoolsImageBase64Raw);
        setStatus("已复制 Base64");
      });

      copyDataUrl.addEventListener("click", async () => {
        if (!webtoolsImageBase64DataUrl.trim()) {
          setStatus("没有可复制的 DataURL");
          return;
        }
        await navigator.clipboard.writeText(webtoolsImageBase64DataUrl);
        setStatus("已复制 DataURL");
      });

      download.addEventListener("click", () => {
        beginPluginNativeInteraction(1500);
        if (!webtoolsImageBase64DataUrl.startsWith("data:image/")) {
          schedulePluginNativeInteractionRelease();
          setStatus("当前没有可下载的图片");
          return;
        }
        const link = document.createElement("a");
        link.href = webtoolsImageBase64DataUrl;
        link.download = getWebtoolsImageBase64DownloadName();
        link.click();
        schedulePluginNativeInteractionRelease();
        setStatus("已开始下载图片");
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
        fileInput.value = "";
        refreshWebtoolsImageBase64PanelInForm(form);
        setStatus("已清空");
      });

      input.addEventListener("input", () => {
        webtoolsImageBase64Input = input.value;
        webtoolsImageBase64FileName = "";
        scheduleWebtoolsImageBase64AutoNormalize(form);
      });

      fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (!file) {
          return;
        }
        void loadImageFile(file);
        fileInput.value = "";
      });

      dropzone.addEventListener("dragenter", (event) => {
        event.preventDefault();
        webtoolsImageBase64Dragging = true;
        refreshWebtoolsImageBase64PanelInForm(form);
      });
      dropzone.addEventListener("dragover", (event) => {
        event.preventDefault();
        if (!webtoolsImageBase64Dragging) {
          webtoolsImageBase64Dragging = true;
          refreshWebtoolsImageBase64PanelInForm(form);
        }
      });
      dropzone.addEventListener("dragleave", (event) => {
        event.preventDefault();
        webtoolsImageBase64Dragging = false;
        refreshWebtoolsImageBase64PanelInForm(form);
      });
      dropzone.addEventListener("drop", (event) => {
        event.preventDefault();
        webtoolsImageBase64Dragging = false;
        refreshWebtoolsImageBase64PanelInForm(form);
        const file = event.dataTransfer?.files?.[0];
        if (!file) {
          setStatus("未检测到图片文件");
          return;
        }
        void loadImageFile(file);
      });

      form.append(header, layout);
      panel.appendChild(form);
      panelItem.appendChild(panel);
      list.appendChild(panelItem);

      refreshWebtoolsImageBase64PanelInForm(form);
      if (webtoolsImageBase64Input.trim()) {
        scheduleWebtoolsImageBase64AutoNormalize(form, true);
      }
    }

  export function applyWebtoolsImagePromptPanelPayload(panel: ActivePluginPanelState): void {
      const data = panel.data;
      webtoolsImagePromptState = normalizeWebtoolsImagePromptState(data);
      webtoolsImagePromptOutput = data && typeof data.output === "string" ? data.output : "";
      webtoolsImagePromptInfo = "";
    }

  export function renderWebtoolsImagePromptPanel(): void {
      const panelItem = document.createElement("li");
      panelItem.className = "settings-panel-item";

      const panel = document.createElement("section");
      panel.className = "settings-panel webtools-image-prompt-panel";

      const form = document.createElement("form");
      form.className = "settings-form webtools-image-prompt-form";
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        void executeWebtoolsImagePromptBuild(form, { render: false });
      });

      const header = document.createElement("div");
      header.className = "webtools-image-prompt-header";
      const titleGroup = document.createElement("div");
      const title = document.createElement("h3");
      title.className = "webtools-image-prompt-title";
      title.textContent = activePluginPanel?.title || "图片提示词";
      const description = document.createElement("p");
      description.className = "webtools-image-prompt-description";
      description.textContent =
        activePluginPanel?.subtitle || "点选模块生成 ChatGPT Images 2.0 商业提示词";
      titleGroup.append(title, description);

      const productWrap = document.createElement("label");
      productWrap.className = "webtools-image-prompt-product";
      const productLabel = document.createElement("span");
      productLabel.textContent = "产品";
      const productSelect = document.createElement("select");
      productSelect.name = "webtoolsImagePromptProduct";
      productSelect.className = "settings-number webtools-tool-select";
      WEBTOOLS_IMAGE_PROMPT_PRODUCTS.forEach((product) => {
        const option = document.createElement("option");
        option.value = product.id;
        option.textContent = product.label;
        option.selected = webtoolsImagePromptState.productId === product.id;
        productSelect.appendChild(option);
      });
      productSelect.addEventListener("change", () => {
        webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
      });
      productWrap.append(productLabel, productSelect);
      header.append(titleGroup, productWrap);

      const updateSelectionFromState = (state: WebtoolsImagePromptState): void => {
        webtoolsImagePromptState = filterWebtoolsImagePromptStateForStyle(state);
        syncWebtoolsImagePromptForm(form, webtoolsImagePromptState);
      };

      const smartTemplateSection = document.createElement("section");
      smartTemplateSection.className =
        "webtools-image-prompt-preset-section webtools-image-prompt-smart-section";
      const smartTemplateTitle = document.createElement("div");
      smartTemplateTitle.className = "webtools-image-prompt-preset-title";
      smartTemplateTitle.textContent = "智能模板";
      const smartTemplateOptions = document.createElement("div");
      smartTemplateOptions.className = "webtools-image-prompt-template-grid";
      WEBTOOLS_IMAGE_PROMPT_SMART_TEMPLATES.forEach((template) => {
        const templateButton = document.createElement("button");
        templateButton.type = "button";
        templateButton.className = "webtools-image-prompt-template";
        templateButton.dataset.webtoolsImagePromptSmartTemplate = "1";
        templateButton.dataset.selected = String(webtoolsImagePromptSmartTemplateId === template.id);
        templateButton.value = template.id;
        templateButton.title = template.description;
        templateButton.textContent = template.label;
        templateButton.addEventListener("click", () => {
          webtoolsImagePromptRequestToken += 1;
          webtoolsImagePromptSmartTemplateId = template.id;
          syncWebtoolsImagePromptSmartTemplateSelection(smartTemplateOptions);
          const next = createWebtoolsImagePromptSmartTemplateState(template.id);
          next.productId = normalizeWebtoolsImagePromptProductId(productSelect.value);
          const nextPreset = getWebtoolsImagePromptStylePreset(next.stylePresetId);
          webtoolsImagePromptStyleGroup = nextPreset.group;
          webtoolsImagePromptOutput = "";
          updateSelectionFromState(next);
          renderList();
          setStatus(`已套用${template.label}`);
          void executeWebtoolsImagePromptBuild(form, { render: true, state: next });
        });
        smartTemplateOptions.appendChild(templateButton);
      });
      smartTemplateSection.append(smartTemplateTitle, smartTemplateOptions);

      const presetSection = document.createElement("section");
      presetSection.className = "webtools-image-prompt-preset-section";
      const presetTitle = document.createElement("div");
      presetTitle.className = "webtools-image-prompt-preset-title";
      presetTitle.textContent = "风格";
      const styleGroups = Array.from(
        new Set(WEBTOOLS_IMAGE_PROMPT_STYLE_PRESETS_FROM_SHARED.map((preset) => preset.group))
      );
      const activePreset = getWebtoolsImagePromptStylePreset(webtoolsImagePromptState.stylePresetId);
      if (
        !webtoolsImagePromptStyleGroup ||
        !styleGroups.some((group) => group === webtoolsImagePromptStyleGroup)
      ) {
        webtoolsImagePromptStyleGroup = activePreset.group;
      }
      const presetGroupField = document.createElement("label");
      presetGroupField.className = "webtools-image-prompt-preset-group-field";
      const presetGroupLabel = document.createElement("span");
      presetGroupLabel.textContent = "风格分类";
      const presetGroupSelect = document.createElement("select");
      presetGroupSelect.className = "settings-value webtools-image-prompt-preset-group-select";
      presetGroupSelect.name = "webtoolsImagePromptStyleGroup";
      styleGroups.forEach((group) => {
        const option = document.createElement("option");
        option.value = group;
        option.textContent = group;
        option.selected = webtoolsImagePromptStyleGroup === group;
        presetGroupSelect.appendChild(option);
      });
      presetGroupSelect.addEventListener("change", () => {
        webtoolsImagePromptStyleGroup = presetGroupSelect.value as WebtoolsImagePromptStylePresetGroup;
        renderList();
      });
      presetGroupField.append(presetGroupLabel, presetGroupSelect);
      const presetOptions = document.createElement("div");
      presetOptions.className = "webtools-image-prompt-preset-options";
      WEBTOOLS_IMAGE_PROMPT_STYLE_PRESETS_FROM_SHARED.filter(
        (preset) => preset.group === webtoolsImagePromptStyleGroup
      ).forEach((preset) => {
        const presetChip = document.createElement("label");
        presetChip.className = "webtools-image-prompt-preset-chip";
        presetChip.dataset.selected = String(webtoolsImagePromptState.stylePresetId === preset.id);
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "webtoolsImagePromptStylePreset";
        input.value = preset.id;
        input.checked = webtoolsImagePromptState.stylePresetId === preset.id;
        input.addEventListener("change", () => {
          if (!input.checked) {
            return;
          }
          webtoolsImagePromptRequestToken += 1;
          const next = createDefaultWebtoolsImagePromptState(preset.id);
          next.productId = normalizeWebtoolsImagePromptProductId(productSelect.value);
          webtoolsImagePromptState = next;
          webtoolsImagePromptStyleGroup = preset.group;
          webtoolsImagePromptSmartTemplateId = "";
          webtoolsImagePromptOutput = "";
          webtoolsImagePromptInfo = "";
          renderList();
          setStatus(`已切换到${preset.label}`);
        });
        const label = document.createElement("strong");
        label.textContent = preset.label;
        const description = document.createElement("span");
        description.textContent = preset.description;
        presetChip.append(input, label, description);
        presetOptions.appendChild(presetChip);
      });
      presetSection.append(presetTitle, presetGroupField, presetOptions);

      const grid = document.createElement("div");
      grid.className = "webtools-image-prompt-grid";
      const createChip = (
        name: string,
        value: string,
        selected: boolean,
        onChange?: () => void
      ): HTMLLabelElement => {
        const chip = document.createElement("label");
        chip.className = "webtools-image-prompt-chip";
        chip.dataset.selected = String(selected);
        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = name;
        input.value = value;
        input.checked = selected;
        input.addEventListener("change", () => {
          chip.dataset.selected = String(input.checked);
          webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
          onChange?.();
        });
        const text = document.createElement("span");
        text.textContent = value;
        chip.append(input, text);
        return chip;
      };

      getWebtoolsImagePromptOptionGroupsForStyle(webtoolsImagePromptState.stylePresetId).forEach((group) => {
        const row = document.createElement("section");
        row.className = "webtools-image-prompt-field";
        row.dataset.group = group.key;
        const fieldHead = document.createElement("span");
        fieldHead.className = "webtools-image-prompt-field-head";
        const fieldLabel = document.createElement("strong");
        fieldLabel.textContent = group.label;
        const hint = document.createElement("span");
        hint.textContent = group.description;
        fieldHead.append(fieldLabel, hint);

        const options = document.createElement("div");
        options.className = "webtools-image-prompt-options";
        const selected = new Set(
          getWebtoolsImagePromptSelectedOptions(webtoolsImagePromptState, group.key)
        );
        const categories = group.categories ?? [{ label: "", options: group.options }];
        categories.forEach((category) => {
          const categoryBlock = document.createElement("div");
          categoryBlock.className = "webtools-image-prompt-category";
          if (category.label) {
            const categoryTitle = document.createElement("div");
            categoryTitle.className = "webtools-image-prompt-category-title";
            categoryTitle.textContent = category.label;
            categoryBlock.appendChild(categoryTitle);
          }
          const categoryOptions = document.createElement("div");
          categoryOptions.className = "webtools-image-prompt-options";
          const isExpanded = webtoolsImagePromptExpandedGroups.has(group.key);
          const visibleOptions = isExpanded
            ? category.options
            : compactWebtoolsImagePromptOptions([
                ...category.options.slice(0, WEBTOOLS_IMAGE_PROMPT_VISIBLE_OPTION_LIMIT),
                ...category.options.filter((option) => selected.has(option))
              ]);
          visibleOptions.forEach((option) => {
            categoryOptions.appendChild(
              createChip(
                `webtoolsImagePromptSelection-${group.key}`,
                option,
                selected.has(option)
              )
            );
          });
          categoryBlock.appendChild(categoryOptions);
          options.appendChild(categoryBlock);
        });
        row.append(fieldHead, options);

        if (group.options.length > WEBTOOLS_IMAGE_PROMPT_VISIBLE_OPTION_LIMIT) {
          const moreButton = document.createElement("button");
          moreButton.type = "button";
          moreButton.className = "webtools-image-prompt-more";
          moreButton.textContent = webtoolsImagePromptExpandedGroups.has(group.key)
            ? "收起"
            : `更多 ${group.options.length - WEBTOOLS_IMAGE_PROMPT_VISIBLE_OPTION_LIMIT} 项`;
          moreButton.addEventListener("click", () => {
            if (webtoolsImagePromptExpandedGroups.has(group.key)) {
              webtoolsImagePromptExpandedGroups.delete(group.key);
            } else {
              webtoolsImagePromptExpandedGroups.add(group.key);
            }
            renderList();
          });
          row.appendChild(moreButton);
        }

        if (group.allowCustom && group.key !== "constraints") {
          const customInput = document.createElement("input");
          customInput.type = "text";
          customInput.className =
            "settings-value webtools-tool-input webtools-image-prompt-custom";
          customInput.name = `webtoolsImagePromptCustom-${group.key}`;
          customInput.value = webtoolsImagePromptState.custom[group.key];
          customInput.placeholder = "自定义补充";
          customInput.addEventListener("input", () => {
            webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
          });
          row.appendChild(customInput);
        }
        grid.appendChild(row);
      });

      const textBlock = document.createElement("section");
      textBlock.className = "webtools-image-prompt-field webtools-image-prompt-text-block";
      const textHead = document.createElement("span");
      textHead.className = "webtools-image-prompt-field-head";
      const textLabel = document.createElement("strong");
      textLabel.textContent = "文字";
      const textHint = document.createElement("span");
      textHint.textContent = "EXACT 文案、位置、字形、场景化文字设计和出现次数";
      textHead.append(textLabel, textHint);

      const textControls = document.createElement("div");
      textControls.className = "webtools-image-prompt-text-controls";
      const exactInput = document.createElement("input");
      exactInput.type = "text";
      exactInput.name = "webtoolsImagePromptTextExact";
      exactInput.className = "settings-value webtools-tool-input";
      exactInput.placeholder = "例如：降噪黑科技";
      exactInput.value = webtoolsImagePromptState.text.exact;
      exactInput.addEventListener("input", () => {
        webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
      });

      const positionSelect = document.createElement("select");
      positionSelect.name = "webtoolsImagePromptTextPosition";
      positionSelect.className = "settings-number webtools-tool-select";
      WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.positions.forEach((position) => {
        const option = document.createElement("option");
        option.value = position;
        option.textContent = position;
        option.selected = webtoolsImagePromptState.text.position === position;
        positionSelect.appendChild(option);
      });
      positionSelect.addEventListener("change", () => {
        webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
      });

      const styleSelect = document.createElement("select");
      styleSelect.name = "webtoolsImagePromptTextStyle";
      styleSelect.className = "settings-number webtools-tool-select";
      WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.styles.forEach((style) => {
        const option = document.createElement("option");
        option.value = style;
        option.textContent = style;
        option.selected = webtoolsImagePromptState.text.style === style;
        styleSelect.appendChild(option);
      });
      styleSelect.addEventListener("change", () => {
        webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
      });

      const designSelect = document.createElement("select");
      designSelect.name = "webtoolsImagePromptTextDesign";
      designSelect.className = "settings-number webtools-tool-select";
      WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.designs.forEach((design) => {
        const option = document.createElement("option");
        option.value = design.id;
        option.textContent = design.label;
        option.selected = webtoolsImagePromptState.text.designId === design.id;
        designSelect.appendChild(option);
      });
      designSelect.addEventListener("change", () => {
        webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
        renderList();
      });

      const subtitleInput = document.createElement("input");
      subtitleInput.type = "text";
      subtitleInput.name = "webtoolsImagePromptTextSubtitle";
      subtitleInput.className = "settings-value webtools-tool-input";
      subtitleInput.placeholder = "副标题，可留空";
      subtitleInput.value = webtoolsImagePromptState.text.subtitle;
      subtitleInput.addEventListener("input", () => {
        webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
      });

      textControls.append(exactInput, positionSelect, styleSelect, designSelect, subtitleInput);

      const selectedTextDesign = findWebtoolsImagePromptTextDesign(
        webtoolsImagePromptState.text.designId
      );
      const designCard = document.createElement("div");
      designCard.className = "webtools-image-prompt-text-design-card";
      const designCardTitle = document.createElement("strong");
      designCardTitle.textContent = selectedTextDesign.label;
      const designSummary = document.createElement("span");
      designSummary.textContent = selectedTextDesign.summary;
      const designDetails = document.createElement("div");
      designDetails.className = "webtools-image-prompt-text-design-details";
      [
        ["字形", selectedTextDesign.typography],
        ["颜色", selectedTextDesign.color],
        ["效果", selectedTextDesign.effect],
        ["布局", selectedTextDesign.layout],
        ["安全区", selectedTextDesign.safeArea]
      ].forEach(([labelText, valueText]) => {
        const item = document.createElement("span");
        item.textContent = `${labelText}：${valueText}`;
        designDetails.appendChild(item);
      });
      const keywordRow = document.createElement("div");
      keywordRow.className = "webtools-image-prompt-text-design-keywords";
      selectedTextDesign.keywords.forEach((keyword) => {
        const keywordChip = document.createElement("span");
        keywordChip.textContent = keyword;
        keywordRow.appendChild(keywordChip);
      });
      designCard.append(designCardTitle, designSummary, designDetails, keywordRow);

      const textFlags = document.createElement("div");
      textFlags.className = "webtools-image-prompt-options";
      const selectedFlags = new Set(webtoolsImagePromptState.text.flags);
      WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.flags.forEach((flag) => {
        textFlags.appendChild(
          createChip("webtoolsImagePromptTextFlag", flag, selectedFlags.has(flag))
        );
      });
      textBlock.append(textHead, textControls, designCard, textFlags);
      if (webtoolsImagePromptState.stylePresetId === "birthday-party") {
        const photoControls = document.createElement("div");
        photoControls.className = "webtools-image-prompt-photo-controls";

        const createBirthdayInput = (
          name: string,
          labelText: string,
          placeholder: string,
          value: string
        ): HTMLLabelElement => {
          const wrap = document.createElement("label");
          wrap.className = "webtools-image-prompt-photo-input";
          const label = document.createElement("span");
          label.textContent = labelText;
          const input = document.createElement("input");
          input.type = "text";
          input.name = name;
          input.className = "settings-value webtools-tool-input";
          input.placeholder = placeholder;
          input.value = value;
          input.addEventListener("input", () => {
            webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
          });
          wrap.append(label, input);
          return wrap;
        };

        const photoWrap = document.createElement("label");
        photoWrap.className = "webtools-image-prompt-photo-input";
        const photoLabel = document.createElement("span");
        photoLabel.textContent = "照片 / 人物";
        const photoInput = document.createElement("input");
        photoInput.type = "text";
        photoInput.name = "webtoolsImagePromptPhotoDescription";
        photoInput.className = "settings-value webtools-tool-input";
        photoInput.placeholder = "例如：3岁小女孩，穿白色连衣裙，笑着看镜头";
        photoInput.value = webtoolsImagePromptState.photoDescription;
        photoInput.addEventListener("input", () => {
          webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
        });
        photoWrap.append(photoLabel, photoInput);

        const birthdayFields = document.createElement("div");
        birthdayFields.className = "webtools-image-prompt-birthday-fields";
        birthdayFields.append(
          createBirthdayInput(
            "webtoolsImagePromptTextAge",
            "年龄",
            "例如：3周岁",
            webtoolsImagePromptState.text.age
          ),
          createBirthdayInput(
            "webtoolsImagePromptTextTitle",
            "祝福语",
            "例如：生日快乐",
            webtoolsImagePromptState.text.title
          ),
          createBirthdayInput(
            "webtoolsImagePromptTextName",
            "姓名",
            "可留空",
            webtoolsImagePromptState.text.name
          ),
          createBirthdayInput(
            "webtoolsImagePromptTextLabel",
            "小标签",
            "例如：HAPPY BIRTHDAY",
            webtoolsImagePromptState.text.label
          )
        );

        const birthdayExamples = document.createElement("div");
        birthdayExamples.className = "webtools-image-prompt-birthday-examples";
        WEBTOOLS_IMAGE_PROMPT_BIRTHDAY_EXAMPLES.forEach((example) => {
          const exampleChip = document.createElement("button");
          exampleChip.type = "button";
          exampleChip.className = "webtools-image-prompt-template";
          exampleChip.textContent = example.label;
          exampleChip.addEventListener("click", () => {
            webtoolsImagePromptSmartTemplateId = "";
            updateSelectionFromState(cloneWebtoolsImagePromptState(example.state));
            void executeWebtoolsImagePromptBuild(form, { render: false });
          });
          birthdayExamples.appendChild(exampleChip);
        });

        photoControls.append(photoWrap, birthdayFields, birthdayExamples);
        textBlock.appendChild(photoControls);
      }
      grid.appendChild(textBlock);

      const outputBlock = document.createElement("div");
      outputBlock.className = "webtools-image-prompt-output-block";
      const outputHead = document.createElement("div");
      outputHead.className = "webtools-image-prompt-output-head";
      const outputTitle = document.createElement("span");
      outputTitle.textContent = "生成提示词";
      const info = document.createElement("span");
      info.className = "webtools-image-prompt-info";
      outputHead.append(outputTitle, info);
      const output = document.createElement("textarea");
      output.className = "settings-value webtools-textarea webtools-image-prompt-output";
      output.name = "webtoolsImagePromptOutput";
      output.readOnly = true;
      output.value = webtoolsImagePromptOutput;
      outputBlock.append(outputHead, output);

      const actions = document.createElement("div");
      actions.className = "settings-actions webtools-image-prompt-actions";

      const buildButton = document.createElement("button");
      buildButton.type = "submit";
      buildButton.className = "settings-btn settings-btn-primary";
      buildButton.textContent = "生成提示词";

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "settings-btn settings-btn-secondary";
      copyButton.dataset.webtoolsImagePromptCopy = "1";
      copyButton.textContent = "复制";
      copyButton.addEventListener("click", async () => {
        if (!webtoolsImagePromptOutput.trim()) {
          setStatus("当前没有可复制的提示词");
          return;
        }
        const copied = await copyTextToClipboard(webtoolsImagePromptOutput);
        if (!copied) {
          webtoolsImagePromptInfo = "复制失败";
          refreshWebtoolsImagePromptPanelInForm(form);
          setStatus("复制失败");
          return;
        }

        webtoolsImagePromptInfo = "已复制到剪贴板";
        refreshWebtoolsImagePromptPanelInForm(form);
        copyButton.textContent = "已复制";
        copyButton.dataset.state = "ok";
        const feedbackToken = String(Date.now());
        copyButton.dataset.feedbackToken = feedbackToken;
        window.setTimeout(() => {
          if (copyButton.dataset.feedbackToken !== feedbackToken) {
            return;
          }
          copyButton.textContent = "复制";
          delete copyButton.dataset.state;
          delete copyButton.dataset.feedbackToken;
          copyButton.disabled = !webtoolsImagePromptOutput.trim();
        }, 1200);
        setStatus("已复制图片提示词");
      });

      const exampleButton = document.createElement("button");
      exampleButton.type = "button";
      exampleButton.className = "settings-btn settings-btn-secondary";
      exampleButton.textContent = "耳机示例";
      exampleButton.addEventListener("click", () => {
        webtoolsImagePromptSmartTemplateId = "";
        updateSelectionFromState(cloneWebtoolsImagePromptState(WEBTOOLS_IMAGE_PROMPT_EXAMPLE));
        void executeWebtoolsImagePromptBuild(form, { render: false });
      });

      const clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "settings-btn settings-btn-secondary";
      clearButton.textContent = "清空";
      clearButton.addEventListener("click", () => {
        webtoolsImagePromptRequestToken += 1;
        webtoolsImagePromptSmartTemplateId = "";
        updateSelectionFromState(createClearedWebtoolsImagePromptState());
        webtoolsImagePromptOutput = "";
        webtoolsImagePromptInfo = "";
        refreshWebtoolsImagePromptPanelInForm(form);
        setStatus("已清空图片提示词");
      });

      actions.append(buildButton, copyButton, exampleButton, clearButton);
      form.append(header, smartTemplateSection, presetSection, grid, outputBlock, actions);
      panel.appendChild(form);
      panelItem.appendChild(panel);
      list.appendChild(panelItem);
      refreshWebtoolsImagePromptPanelInForm(form);
    }

  export function applyWebtoolsMarkdownPanelPayload(panel: ActivePluginPanelState): void {
      const data = panel.data;
      if (data && typeof data.input === "string") {
        webtoolsMarkdownInput = data.input;
      }
      webtoolsMarkdownHtml = "";
      webtoolsMarkdownInfo = "";
    }

  export function renderWebtoolsMarkdownPanel(): void {
      const panelItem = document.createElement("li");
      panelItem.className = "settings-panel-item";

      const panel = document.createElement("section");
      panel.className = "settings-panel webtools-markdown-panel";

      const form = document.createElement("form");
      form.className = "settings-form webtools-markdown-form";
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        void executeWebtoolsMarkdownRender(form);
      });

      const header = document.createElement("div");
      header.className = "webtools-markdown-header";
      const titleGroup = document.createElement("div");
      const title = document.createElement("h3");
      title.className = "webtools-markdown-title";
      title.textContent = activePluginPanel?.title || "Markdown 预览";
      const description = document.createElement("p");
      description.className = "webtools-markdown-description";
      description.textContent =
        activePluginPanel?.subtitle || "Markdown 转 HTML 实时预览";
      titleGroup.append(title, description);

      const toolbar = document.createElement("div");
      toolbar.className = "webtools-markdown-toolbar";
      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "settings-btn settings-btn-secondary";
      copyButton.dataset.webtoolsMarkdownCopy = "1";
      copyButton.textContent = "复制 HTML";
      copyButton.addEventListener("click", async () => {
        const copied = await copyTextToClipboard(webtoolsMarkdownHtml);
        setStatus(copied ? "已复制 HTML" : "复制 HTML 失败");
      });
      const clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "settings-btn settings-btn-secondary";
      clearButton.textContent = "清空";
      clearButton.addEventListener("click", () => {
        if (webtoolsMarkdownAutoTimer !== null) {
          window.clearTimeout(webtoolsMarkdownAutoTimer);
          webtoolsMarkdownAutoTimer = null;
        }
        webtoolsMarkdownRequestToken += 1;
        webtoolsMarkdownInput = "";
        webtoolsMarkdownHtml = "";
        webtoolsMarkdownInfo = "等待输入 Markdown";
        const node = form.elements.namedItem("webtoolsMarkdownInput");
        if (node instanceof HTMLTextAreaElement) {
          node.value = "";
          node.focus();
        }
        refreshWebtoolsMarkdownPanelInForm(form);
        setStatus("已清空 Markdown 内容");
      });
      toolbar.append(copyButton, clearButton);
      header.append(titleGroup, toolbar);

      const layout = document.createElement("div");
      layout.className = "webtools-markdown-layout";

      const editorPane = document.createElement("div");
      editorPane.className = "webtools-markdown-pane";
      const editorHead = document.createElement("div");
      editorHead.className = "webtools-markdown-pane-head";
      editorHead.textContent = "Markdown 输入";
      const inputArea = document.createElement("textarea");
      inputArea.className = "settings-value webtools-textarea webtools-markdown-editor";
      inputArea.name = "webtoolsMarkdownInput";
      inputArea.value = webtoolsMarkdownInput;
      inputArea.placeholder = "输入 Markdown";
      inputArea.spellcheck = false;
      inputArea.addEventListener("input", () => {
        webtoolsMarkdownInput = inputArea.value;
        scheduleWebtoolsMarkdownAutoRender(form);
      });
      editorPane.append(editorHead, inputArea);

      const previewPane = document.createElement("div");
      previewPane.className = "webtools-markdown-pane";
      const previewHead = document.createElement("div");
      previewHead.className = "webtools-markdown-pane-head";
      previewHead.textContent = "实时预览";
      const previewBody = document.createElement("div");
      previewBody.className = "webtools-markdown-preview-body";
      previewBody.dataset.webtoolsMarkdownPreview = "1";
      previewPane.append(previewHead, previewBody);

      layout.append(editorPane, previewPane);

      const htmlBlock = document.createElement("div");
      htmlBlock.className = "webtools-markdown-html-block";
      const htmlHead = document.createElement("div");
      htmlHead.className = "webtools-markdown-html-head";
      htmlHead.textContent = "HTML 输出";
      const htmlArea = document.createElement("textarea");
      htmlArea.className = "settings-value webtools-textarea webtools-markdown-html";
      htmlArea.name = "webtoolsMarkdownHtml";
      htmlArea.readOnly = true;
      htmlArea.placeholder = "渲染后 HTML";
      const info = document.createElement("div");
      info.className = "webtools-markdown-info";
      htmlBlock.append(htmlHead, htmlArea, info);

      form.append(header, layout, htmlBlock);
      panel.append(form);
      panelItem.appendChild(panel);
      list.appendChild(panelItem);

      refreshWebtoolsMarkdownPanelInForm(form);
      scheduleWebtoolsMarkdownAutoRender(form, true);
    }

  export function applyWebtoolsQrcodePanelPayload(panel: ActivePluginPanelState): void {
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
    }

  export function renderWebtoolsQrcodePanel(): void {
      const panelItem = document.createElement("li");
      panelItem.className = "settings-panel-item";

      const panel = document.createElement("section");
      panel.className = "settings-panel webtools-qrcode-panel";

      const form = document.createElement("form");
      form.className = "settings-form webtools-qrcode-form";

      const header = document.createElement("div");
      header.className = "webtools-qrcode-header";
      const headerText = document.createElement("div");
      const title = document.createElement("h3");
      title.className = "webtools-qrcode-title";
      title.textContent = activePluginPanel?.title || "二维码生成";
      const description = document.createElement("p");
      description.className = "webtools-qrcode-description";
      description.textContent =
        activePluginPanel?.subtitle || "输入文本后自动生成二维码，可配置容错级别、配色与 Logo。";
      headerText.append(title, description);

      const info = document.createElement("div");
      info.className = "webtools-qrcode-info";
      header.append(headerText, info);

      const layout = document.createElement("div");
      layout.className = "webtools-qrcode-layout";

      const setup = document.createElement("section");
      setup.className = "webtools-qrcode-setup";

      const text = document.createElement("textarea");
      text.className = "settings-value webtools-textarea webtools-qrcode-textarea";
      text.name = "webtoolsQrText";
      text.value = webtoolsQrText;
      text.spellcheck = false;
      const textField = document.createElement("label");
      textField.className = "webtools-qrcode-field";
      const textLabel = document.createElement("span");
      textLabel.className = "webtools-qrcode-field-label";
      textLabel.textContent = "二维码内容";
      textField.append(textLabel, text);

      const size = document.createElement("input");
      size.type = "number";
      size.className = "settings-value webtools-tool-input";
      size.name = "webtoolsQrSize";
      size.value = String(webtoolsQrSize);

      const level = document.createElement("select");
      level.className = "settings-value webtools-tool-select";
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
      dark.className = "webtools-qrcode-color-picker";
      dark.name = "webtoolsQrDarkColor";
      dark.value = webtoolsQrDarkColor;

      const darkValue = document.createElement("span");
      darkValue.className = "webtools-qrcode-color-value";
      darkValue.setAttribute("data-webtools-qrcode-dark-value", "1");

      const light = document.createElement("input");
      light.type = "color";
      light.className = "webtools-qrcode-color-picker";
      light.name = "webtoolsQrLightColor";
      light.value = webtoolsQrLightColor;

      const lightValue = document.createElement("span");
      lightValue.className = "webtools-qrcode-color-value";
      lightValue.setAttribute("data-webtools-qrcode-light-value", "1");

      const configGrid = document.createElement("div");
      configGrid.className = "webtools-qrcode-config-grid";

      const sizeField = document.createElement("label");
      sizeField.className = "webtools-qrcode-field";
      const sizeLabel = document.createElement("span");
      sizeLabel.className = "webtools-qrcode-field-label";
      sizeLabel.textContent = "输出尺寸";
      sizeField.append(sizeLabel, size);

      const levelField = document.createElement("label");
      levelField.className = "webtools-qrcode-field";
      const levelLabel = document.createElement("span");
      levelLabel.className = "webtools-qrcode-field-label";
      levelLabel.textContent = "容错级别";
      levelField.append(levelLabel, level);

      const darkField = document.createElement("div");
      darkField.className = "webtools-qrcode-field";
      const darkLabel = document.createElement("span");
      darkLabel.className = "webtools-qrcode-field-label";
      darkLabel.textContent = "深色";
      const darkControl = document.createElement("div");
      darkControl.className = "webtools-qrcode-color-control";
      darkControl.append(dark, darkValue);
      darkField.append(darkLabel, darkControl);

      const lightField = document.createElement("div");
      lightField.className = "webtools-qrcode-field";
      const lightLabel = document.createElement("span");
      lightLabel.className = "webtools-qrcode-field-label";
      lightLabel.textContent = "浅色";
      const lightControl = document.createElement("div");
      lightControl.className = "webtools-qrcode-color-control";
      lightControl.append(light, lightValue);
      lightField.append(lightLabel, lightControl);

      configGrid.append(sizeField, levelField, darkField, lightField);

      const logoMeta = document.createElement("span");
      logoMeta.className = "webtools-qrcode-logo-meta";
      logoMeta.setAttribute("data-webtools-qrcode-logo-meta", "1");

      const logoMode = document.createElement("select");
      logoMode.className = "settings-value webtools-tool-select";
      logoMode.name = "webtoolsQrLogoMode";
      [
        ["none", "无 Logo"],
        ["text", "文字 Logo"],
        ["image", "图片 Logo"]
      ].forEach(([value, label]) => {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        opt.selected = webtoolsQrLogoMode === value;
        logoMode.appendChild(opt);
      });

      const logoSection = document.createElement("section");
      logoSection.className = "webtools-qrcode-logo-section";
      const logoHead = document.createElement("div");
      logoHead.className = "webtools-qrcode-logo-head";
      const logoTitle = document.createElement("span");
      logoTitle.className = "webtools-qrcode-field-label";
      logoTitle.textContent = "Logo 设置";

      const logoTextField = document.createElement("div");
      logoTextField.className = "webtools-qrcode-field";
      logoTextField.setAttribute("data-webtools-qrcode-logo-text-field", "1");
      const logoTextLabel = document.createElement("span");
      logoTextLabel.className = "webtools-qrcode-field-label";
      logoTextLabel.textContent = "文字 Logo";
      const logoText = document.createElement("input");
      logoText.className = "settings-value webtools-tool-input";
      logoText.name = "webtoolsQrLogoText";
      logoText.value = webtoolsQrLogoText;
      logoTextField.append(logoTextLabel, logoText);

      const logoImageField = document.createElement("div");
      logoImageField.className = "webtools-qrcode-logo-image-field";
      logoImageField.setAttribute("data-webtools-qrcode-logo-image-field", "1");
      const logoImageLabel = document.createElement("span");
      logoImageLabel.className = "webtools-qrcode-field-label";
      logoImageLabel.textContent = "图片 Logo";
      const logoImageRow = document.createElement("div");
      logoImageRow.className = "webtools-qrcode-logo-image-row";
      const logoUpload = document.createElement("button");
      logoUpload.type = "button";
      logoUpload.className = "settings-btn settings-btn-secondary";
      logoUpload.textContent = "选择图片";
      const logoFileInput = document.createElement("input");
      logoFileInput.type = "file";
      logoFileInput.accept = "image/*";
      logoFileInput.hidden = true;
      const logoImageName = document.createElement("span");
      logoImageName.className = "webtools-qrcode-logo-image-name";
      logoImageName.setAttribute("data-webtools-qrcode-logo-image-name", "1");
      logoImageRow.append(logoUpload, logoImageName, logoFileInput);
      logoImageField.append(logoImageLabel, logoImageRow);

      const clearLogo = document.createElement("button");
      clearLogo.type = "button";
      clearLogo.className = "settings-btn settings-btn-secondary webtools-qrcode-clear-logo-btn";
      clearLogo.setAttribute("data-webtools-qrcode-clear-logo", "1");
      clearLogo.textContent = "清除 Logo";
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

      logoHead.append(logoTitle, logoMeta, clearLogo);

      const logoBody = document.createElement("div");
      logoBody.className = "webtools-qrcode-logo-body";
      const logoModeField = document.createElement("label");
      logoModeField.className = "webtools-qrcode-field";
      const logoModeLabel = document.createElement("span");
      logoModeLabel.className = "webtools-qrcode-field-label";
      logoModeLabel.textContent = "Logo 类型";
      logoModeField.append(logoModeLabel, logoMode);
      logoBody.append(logoModeField, logoTextField, logoImageField);
      logoSection.append(logoHead, logoBody);

      const actions = document.createElement("div");
      actions.className = "webtools-qrcode-actions";

      const generate = document.createElement("button");
      generate.type = "submit";
      generate.className = "settings-btn settings-btn-primary";
      generate.textContent = "生成二维码";

      const download = document.createElement("button");
      download.type = "button";
      download.className = "settings-btn settings-btn-secondary webtools-qrcode-download-btn";
      download.setAttribute("data-webtools-qrcode-download", "1");
      download.textContent = "下载 PNG";
      download.addEventListener("click", async () => {
        beginPluginNativeInteraction(1500);
        try {
          await downloadWebtoolsQrcodePng();
          setStatus("已下载二维码");
        } catch (error) {
          const reason = error instanceof Error ? error.message : "下载失败";
          setStatus(reason);
        } finally {
          schedulePluginNativeInteractionRelease();
        }
      });
      actions.append(generate, download);

      const preview = document.createElement("section");
      preview.className = "webtools-qrcode-preview";
      const previewHost = document.createElement("div");
      previewHost.className = "webtools-qrcode-preview-host";
      previewHost.setAttribute("data-webtools-qrcode-preview", "1");
      preview.appendChild(previewHost);

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
        webtoolsQrLogoText = logoText.value.trim().slice(0, 40);
        refreshWebtoolsQrcodePanelInForm(form);
        scheduleWebtoolsQrcodeAutoGenerate(form);
      });

      logoUpload.addEventListener("click", () => {
        beginPluginNativeInteraction(1500);
        logoFileInput.click();
        schedulePluginNativeInteractionRelease();
      });

      logoFileInput.addEventListener("change", () => {
        const file = logoFileInput.files?.[0];
        logoFileInput.value = "";
        if (!file) {
          return;
        }
        void (async () => {
          try {
            const normalized = await normalizeWebtoolsQrcodeLogoImage(file);
            webtoolsQrLogoMode = "image";
            logoMode.value = "image";
            webtoolsQrLogoImageDataUrl = normalized.dataUrl;
            webtoolsQrLogoImageName = normalized.name;
            refreshWebtoolsQrcodePanelInForm(form);
            scheduleWebtoolsQrcodeAutoGenerate(form, true);
          } catch (error) {
            setStatus(error instanceof Error ? error.message : "Logo 图片处理失败");
          }
        })();
      });

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        void executeWebtoolsQrcodeGenerateInForm(form);
      });

      setup.append(textField, configGrid, logoSection, actions);
      layout.append(setup, preview);
      form.append(header, layout);
      panel.appendChild(form);
      panelItem.appendChild(panel);
      list.appendChild(panelItem);

      refreshWebtoolsQrcodePanelInForm(form);
      scheduleWebtoolsQrcodeAutoGenerate(form, true);
    }

  export function applyWebtoolsUaPanelPayload(panel: ActivePluginPanelState): void {
      const data = panel.data;
      if (data && typeof data.ua === "string") {
        webtoolsUaInput = data.ua;
      } else {
        webtoolsUaInput = navigator.userAgent;
      }
      webtoolsUaResult = {};
      webtoolsUaInfo = "";
      webtoolsUaError = "";
    }

  export function renderWebtoolsUaPanel(): void {
      const panelItem = document.createElement("li");
      panelItem.className = "settings-panel-item";

      const panel = document.createElement("section");
      panel.className = "settings-panel webtools-ua-panel";

      const form = document.createElement("form");
      form.className = "settings-form webtools-ua-form";

      const header = document.createElement("div");
      header.className = "webtools-ua-header";
      const headerText = document.createElement("div");
      headerText.className = "webtools-ua-header-text";
      const title = document.createElement("h3");
      title.className = "webtools-ua-title";
      title.textContent = activePluginPanel?.title || "UA 解析";
      const subtitle = document.createElement("p");
      subtitle.className = "webtools-ua-subtitle";
      subtitle.textContent =
        activePluginPanel?.subtitle || "自动识别浏览器、系统、设备与渲染引擎信息。";
      headerText.append(title, subtitle);

      const actions = document.createElement("div");
      actions.className = "webtools-ua-actions";

      const input = document.createElement("textarea");
      input.className = "settings-value webtools-textarea webtools-ua-input";
      input.name = "webtoolsUaInput";
      input.value = webtoolsUaInput || navigator.userAgent;
      input.spellcheck = false;

      const info = document.createElement("div");
      info.className = "webtools-ua-info";

      const grid = document.createElement("div");
      grid.className = "webtools-ua-grid";

      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "settings-btn settings-btn-primary";
      copy.textContent = "复制 UA";
      copy.setAttribute("data-webtools-ua-copy", "1");

      const current = document.createElement("button");
      current.type = "button";
      current.className = "settings-btn settings-btn-secondary";
      current.textContent = "当前 UA";

      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "settings-btn settings-btn-secondary";
      clear.textContent = "清空";

      actions.append(current, clear, copy);
      header.append(headerText, actions);

      const editor = document.createElement("div");
      editor.className = "webtools-ua-editor";
      const inputSection = document.createElement("section");
      inputSection.className = "webtools-ua-input-section";
      const inputHead = document.createElement("div");
      inputHead.className = "webtools-ua-input-head";
      const inputLabel = document.createElement("div");
      inputLabel.className = "webtools-ua-input-label";
      inputLabel.textContent = "User-Agent 字符串";
      const inputMeta = document.createElement("div");
      inputMeta.className = "webtools-ua-input-meta";
      inputMeta.textContent = "支持粘贴浏览器、App 或抓包里的完整 UA。";
      inputHead.append(inputLabel, inputMeta);
      inputSection.append(inputHead, input);
      editor.append(inputSection, info, grid);

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
        setStatus("已清空 UA");
      });

      copy.addEventListener("click", async () => {
        const value = input.value.trim();
        if (!value) {
          setStatus("没有可复制的 UA");
          return;
        }
        await navigator.clipboard.writeText(value);
        setStatus("已复制 UA");
      });

      input.addEventListener("input", () => {
        webtoolsUaInput = input.value;
        scheduleWebtoolsUaAutoParse(form);
      });

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        void executeWebtoolsUaParse(input.value);
      });

      form.append(header, editor);
      panel.appendChild(form);
      panelItem.appendChild(panel);
      list.appendChild(panelItem);

      refreshWebtoolsUaResultInForm(form);
      scheduleWebtoolsUaAutoParse(form, true);
    }

}
