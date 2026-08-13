namespace RendererPanelRuntime {

  export function getRegisteredPanelImpls(): NonNullable<Window["__LL_PANEL_IMPLS__"]> {
    const impls = window.__LL_PANEL_IMPLS__;
    if (!impls) {
      throw new Error("renderer plugin panel impls not initialized");
    }
    return impls;
  }

  export function parseGenericPluginPanelPayload(
    payload: unknown
  ): GenericPluginPanelPayload | null {
    if (!payload || typeof payload !== "object") {
      return null;
    }

    const record = payload as Record<string, unknown>;
    if (record.panel !== "plugin") {
      return null;
    }

    if (typeof record.pluginId !== "string") {
      return null;
    }

    const pluginId = record.pluginId.trim();
    if (!pluginId) {
      return null;
    }

    return {
      panel: "plugin",
      pluginId,
      title: typeof record.title === "string" ? record.title : undefined,
      subtitle: typeof record.subtitle === "string" ? record.subtitle : undefined,
      message: typeof record.message === "string" ? record.message : undefined,
      data:
        record.data && typeof record.data === "object"
          ? (record.data as Record<string, unknown>)
          : undefined
    };
  }

  export function renderPluginPanelFallback(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel";

    const plugin = activePluginPanel;
    const titleText = plugin?.title || "\u63d2\u4ef6\u9762\u677f";
    const subtitleText =
      plugin?.subtitle ||
      "\u8be5\u63d2\u4ef6\u5df2\u63a5\u5165\uff0c\u53ef\u89c6\u5316\u9875\u9762\u6b63\u5728\u5b9e\u88c5";

    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = titleText;

    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent = subtitleText;

    const info = document.createElement("div");
    info.className = "settings-value settings-wrap";
    info.textContent = plugin
      ? `\u63d2\u4ef6 ID\uff1a${plugin.pluginId}`
      : "\u672a\u9009\u4e2d\u63d2\u4ef6";

    const hint = document.createElement("p");
    hint.className = "settings-description";
    hint.textContent = plugin?.message
      ? plugin.message
      : "\u5f53\u524d\u4e3a\u7edf\u4e00\u63d2\u4ef6\u9762\u677f\u9aa8\u67b6\uff0c\u4e0b\u4e00\u6b65\u5c06\u9010\u4e2a\u8865\u9f50\u529f\u80fd\u754c\u9762\u3002";

    const actions = document.createElement("div");
    actions.className = "settings-actions";

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "settings-btn settings-btn-primary";
    backButton.textContent = "\u8fd4\u56de\u641c\u7d22";
    backButton.addEventListener("click", () => {
      backToSearch();
    });

    actions.append(backButton);
    panel.append(title, description, info, hint, actions);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);
  }

  export function runWithPluginForm(
    selector: string,
    action: (form: HTMLFormElement) => void
  ): () => void {
    return () => {
      const form = list.querySelector(selector);
      if (form instanceof HTMLFormElement) {
        action(form);
      }
    };
  }

  export function createSubmitPluginPanelHandler(
    render: () => void,
    onOpen: (panel: ActivePluginPanelState) => void,
    formSelector: string
  ): PluginPanelHandler {
    return {
      render,
      onOpen,
      onEnter: runWithPluginForm(formSelector, (form) => {
        form.requestSubmit();
      })
    };
  }

  export function handleStandalonePanelPayload(panelPayload: unknown): string | null {
      const passwordPayload = parsePasswordPanelPayload(panelPayload);
      if (passwordPayload) {
        openStandalonePasswordPanel(passwordPayload.draft);
        return "password";
      }

      const cashflowPayload = parseCashflowPanelPayload(panelPayload);
      if (cashflowPayload) {
        void openStandaloneCashflowPanel(Boolean(cashflowPayload.reset), {
          reviewMode: cashflowPayload.review === true
        });
        return "cashflow";
      }

      const panel =
        typeof panelPayload === "string" ? panelPayload.trim() : "";
      if (panel === "password") {
        openStandalonePasswordPanel();
        return "password";
      }
      if (panel === "cashflow") {
        void openStandaloneCashflowPanel();
        return "cashflow";
      }
      return null;
    }

  export function handleGenericPluginPanelPayload(panelPayload: unknown): string | null {
      const genericPluginPayload = parseGenericPluginPanelPayload(panelPayload);
      if (!genericPluginPayload) {
        return null;
      }

      openGenericPluginPanel(genericPluginPayload);
      return genericPluginPayload.pluginId;
    }

  export function renderActivePluginPanel(): void {
      const plugin = activePluginPanel;
      window.__LL_PANEL_MODULES__?.cleanup(plugin?.pluginId ?? null);
      getRegisteredPanelImpls().cleanupPluginPanelTransientState(
        plugin?.pluginId ?? null
      );
      if (!plugin) {
        delete document.body.dataset.activePluginId;
        renderPluginPanelFallback();
        return;
      }

      document.body.dataset.activePluginId = plugin.pluginId;

      const handler = getPluginPanelHandler(plugin.pluginId);
      if (!handler) {
        renderPluginPanelFallback();
        return;
      }

      handler.render();
    }

  export function handleActivePluginPanelEnter(): void {
      const plugin = activePluginPanel;
      if (!plugin) {
        setStatus("\u672a\u9009\u4e2d\u63d2\u4ef6");
        return;
      }

      const handler = getPluginPanelHandler(plugin.pluginId);
      if (!handler?.onEnter) {
        setStatus(
          "\u5f53\u524d\u63d2\u4ef6\u9762\u677f\u4e0d\u652f\u6301 Enter\uff0c\u8bf7\u4f7f\u7528 Esc \u8fd4\u56de"
        );
        return;
      }

      handler.onEnter();
    }

  export function handleActivePluginPanelEscape(): boolean {
      const plugin = activePluginPanel;
      if (plugin && window.__LL_PANEL_MODULES__?.onEscape(plugin.pluginId, plugin)) {
        return true;
      }
      if (activePluginPanel?.pluginId === WEBTOOLS_TRANSLATE_PLUGIN_ID) {
        if (translateToolPanelView === "settings") {
          returnToTranslateToolMainView();
          return true;
        }
        return false;
      }

      if (activePluginPanel?.pluginId !== LITESNAP_PLUGIN_ID) {
        return false;
      }

      if (
        liteSnapPanelView === "settings" ||
        liteSnapPanelView === "ocr" ||
        liteSnapPanelView === "translate" ||
        liteSnapPanelView === "history" ||
        liteSnapPanelView === "diagnostics"
      ) {
        returnToLiteSnapMainView();
        return true;
      }

      return false;
    }

  export function getActivePluginPanelTitle(): string | null {
      return activePluginPanel?.title ?? null;
    }

  export function cleanupPluginPanelTransientState(activePluginId: string | null): void {
      if (activePluginId !== LITESNAP_PLUGIN_ID) {
        liteSnapPanelView = "main";
        liteSnapHistoryItems = [];
        liteSnapDiagnostics = [];
      }
      if (activePluginId !== WEBTOOLS_TRANSLATE_PLUGIN_ID) {
        translateToolPanelView = "main";
        translateToolSourceText = "";
        translateToolResultText = "";
      }
      if (activePluginId !== DICTIONARY_PLUGIN_ID) {
        dictionaryQueryText = "";
        dictionaryPanelEntry = null;
        dictionaryPanelCandidates = [];
      }
      if (activePluginId !== WEBTOOLS_JSON_PLUGIN_ID && webtoolsJsonAutoTimer !== null) {
        window.clearTimeout(webtoolsJsonAutoTimer);
        webtoolsJsonAutoTimer = null;
      }
      if (activePluginId !== WEBTOOLS_JSON_SCHEMA_PLUGIN_ID && webtoolsJsonSchemaAutoTimer !== null) {
        window.clearTimeout(webtoolsJsonSchemaAutoTimer);
        webtoolsJsonSchemaAutoTimer = null;
      }
      if (activePluginId !== WEBTOOLS_DIFF_PLUGIN_ID && webtoolsDiffAutoTimer !== null) {
        window.clearTimeout(webtoolsDiffAutoTimer);
        webtoolsDiffAutoTimer = null;
      }
      if (activePluginId !== WEBTOOLS_TIMESTAMP_PLUGIN_ID) {
        clearWebtoolsTimestampAutoTimer();
        clearWebtoolsTimestampClockTimer();
      }
      if (activePluginId !== WEBTOOLS_CRON_PLUGIN_ID && webtoolsCronAutoTimer !== null) {
        window.clearTimeout(webtoolsCronAutoTimer);
        webtoolsCronAutoTimer = null;
      }
      if (activePluginId !== WEBTOOLS_CRYPTO_PLUGIN_ID) {
        if (webtoolsCryptoAutoTimer !== null) {
          window.clearTimeout(webtoolsCryptoAutoTimer);
          webtoolsCryptoAutoTimer = null;
        }
        if (removeActiveCryptoAlgorithmMenuListener) {
          removeActiveCryptoAlgorithmMenuListener();
          removeActiveCryptoAlgorithmMenuListener = null;
        }
      }
      if (activePluginId !== WEBTOOLS_JWT_PLUGIN_ID) {
        if (webtoolsJwtAutoTimer !== null) {
          window.clearTimeout(webtoolsJwtAutoTimer);
          webtoolsJwtAutoTimer = null;
        }
        if (webtoolsJwtSignTimer !== null) {
          window.clearTimeout(webtoolsJwtSignTimer);
          webtoolsJwtSignTimer = null;
        }
      }
      if (activePluginId !== WEBTOOLS_COLORS_PLUGIN_ID && webtoolsColorsAutoTimer !== null) {
        window.clearTimeout(webtoolsColorsAutoTimer);
        webtoolsColorsAutoTimer = null;
      }
      if (
        activePluginId !== WEBTOOLS_IMAGE_BASE64_PLUGIN_ID &&
        webtoolsImageBase64AutoTimer !== null
      ) {
        window.clearTimeout(webtoolsImageBase64AutoTimer);
        webtoolsImageBase64AutoTimer = null;
      }
      if (activePluginId !== WEBTOOLS_IMAGE_PROMPT_PLUGIN_ID) {
        webtoolsImagePromptRequestToken += 1;
      }
      if (activePluginId !== WEBTOOLS_CONFIG_PLUGIN_ID && webtoolsConfigAutoTimer !== null) {
        window.clearTimeout(webtoolsConfigAutoTimer);
        webtoolsConfigAutoTimer = null;
      }
      if (activePluginId !== WEBTOOLS_SQL_PLUGIN_ID && webtoolsSqlAutoTimer !== null) {
        window.clearTimeout(webtoolsSqlAutoTimer);
        webtoolsSqlAutoTimer = null;
      }
      if (activePluginId !== WEBTOOLS_QRCODE_PLUGIN_ID && webtoolsQrAutoTimer !== null) {
        window.clearTimeout(webtoolsQrAutoTimer);
        webtoolsQrAutoTimer = null;
      }
      if (
        activePluginId !== WEBTOOLS_MARKDOWN_PLUGIN_ID &&
        webtoolsMarkdownAutoTimer !== null
      ) {
        window.clearTimeout(webtoolsMarkdownAutoTimer);
        webtoolsMarkdownAutoTimer = null;
      }
      if (activePluginId !== WEBTOOLS_UA_PLUGIN_ID && webtoolsUaAutoTimer !== null) {
        window.clearTimeout(webtoolsUaAutoTimer);
        webtoolsUaAutoTimer = null;
      }
      if (
        activePluginId !== HARDWARE_INSPECTOR_PLUGIN_ID &&
        hardwareInspectorExpandedDiskKeys.size > 0
      ) {
        hardwareInspectorExpandedDiskKeys.clear();
      }
      if (activePluginId !== HARDWARE_INSPECTOR_PLUGIN_ID) {
        hardwareInspectorPreviewImageUrl = "";
        hardwareInspectorPreviewLoading = false;
        hardwareInspectorPreviewError = "";
        hardwareInspectorPreviewRequestToken += 1;
      }
    }

}
