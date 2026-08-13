namespace RendererPanelRuntime {

  export const pluginPanelHandlers: Readonly<Record<string, PluginPanelHandler>> = {
    [HARDWARE_INSPECTOR_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderHardwareInspectorPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyHardwareInspectorPanelPayload(panel);
      },
      "form.hardware-inspector-form"
    ),
    [CLIPBOARD_WORKBENCH_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderClipboardWorkbenchPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyClipboardWorkbenchPanelPayload(panel);
      },
      "form.clipboard-workbench-form"
    ),
    [LITESNAP_PLUGIN_ID]: {
      render: () => {
        getRegisteredPanelImpls().renderLiteSnapPanel();
      },
      onOpen: (panel) => {
        getRegisteredPanelImpls().applyLiteSnapPanelPayload(panel);
        void hydrateLiteSnapPanelFromSettings();
      },
      onEnter: runWithPluginForm("form.litesnap-form", (form) => {
        form.requestSubmit();
      })
    },
    [WEBTOOLS_PASSWORD_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsPasswordPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsPasswordPanelPayload(panel);
      },
      "form.webtools-password-form"
    ),
    [WEBTOOLS_JSON_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsJsonPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsJsonPanelPayload(panel);
      },
      "form.webtools-json-form"
    ),
    [WEBTOOLS_JSON_SCHEMA_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsJsonSchemaPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsJsonSchemaPanelPayload(panel);
      },
      "form.webtools-json-schema-form"
    ),
    [WEBTOOLS_DATA_MASK_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsDataMaskPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsDataMaskPanelPayload(panel);
      },
      "form.webtools-data-mask-form"
    ),
    [WEBTOOLS_URL_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsUrlPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsUrlPanelPayload(panel);
      },
      "form.webtools-url-form"
    ),
    [WEBTOOLS_DIFF_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsDiffPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsDiffPanelPayload(panel);
      },
      "form.webtools-diff-form"
    ),
    [WEBTOOLS_TIMESTAMP_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsTimestampPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsTimestampPanelPayload(panel);
      },
      "form.webtools-timestamp-form"
    ),
    [WEBTOOLS_TRANSLATE_PLUGIN_ID]: {
      render: () => {
        getRegisteredPanelImpls().renderWebtoolsTranslatePanel();
      },
      onOpen: (panel) => {
        getRegisteredPanelImpls().applyWebtoolsTranslatePanelPayload(panel);
        void hydrateTranslateToolPanelFromSettings();
      },
      onEnter: runWithPluginForm("form.webtools-translate-form", (form) => {
        form.requestSubmit();
      })
    },
    [DICTIONARY_PLUGIN_ID]: {
      render: () => {
        getRegisteredPanelImpls().renderDictionaryPanel();
      },
      onOpen: (panel) => {
        getRegisteredPanelImpls().applyDictionaryPanelPayload(panel);
        void Promise.all([
          hydrateDictionaryPanelState(),
          hydrateDictionaryPackStatus()
        ]).then(async () => {
          if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
            renderList();
          }
          await maybeAutoRunDictionaryPanelLookup();
        });
      },
      onEnter: runWithPluginForm("form.dictionary-form", (form) => {
        form.requestSubmit();
      })
    },
    [WEBTOOLS_REGEX_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsRegexPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsRegexPanelPayload(panel);
      },
      "form.webtools-regex-form"
    ),
    [WEBTOOLS_CRON_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsCronPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsCronPanelPayload(panel);
      },
      "form.webtools-cron-form"
    ),
    [WEBTOOLS_CRYPTO_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsCryptoPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsCryptoPanelPayload(panel);
      },
      "form.webtools-crypto-form"
    ),
    [WEBTOOLS_JWT_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsJwtPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsJwtPanelPayload(panel);
      },
      "form.webtools-jwt-form"
    ),
    [WEBTOOLS_STRINGS_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsStringsPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsStringsPanelPayload(panel);
      },
      "form.webtools-strings-form"
    ),
    [WEBTOOLS_COLORS_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsColorsPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsColorsPanelPayload(panel);
      },
      "form.webtools-colors-form"
    ),
    [WEBTOOLS_IMAGE_BASE64_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsImageBase64Panel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsImageBase64PanelPayload(panel);
      },
      "form.webtools-image-base64-form"
    ),
    [WEBTOOLS_IMAGE_PROMPT_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsImagePromptPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsImagePromptPanelPayload(panel);
      },
      "form.webtools-image-prompt-form"
    ),
    [WEBTOOLS_CONFIG_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsConfigPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsConfigPanelPayload(panel);
      },
      "form.webtools-config-form"
    ),
    [WEBTOOLS_SQL_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsSqlPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsSqlPanelPayload(panel);
      },
      "form.webtools-sql-form"
    ),
    [WEBTOOLS_UNIT_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsUnitPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsUnitPanelPayload(panel);
      },
      "form.webtools-unit-form"
    ),
    [WEBTOOLS_FILE_HASH_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsFileHashPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsFileHashPanelPayload(panel);
      },
      "form.webtools-file-hash-form"
    ),
    [WEBTOOLS_PORT_HELPER_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsPortHelperPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsPortHelperPanelPayload(panel);
      },
      "form.webtools-port-helper-form"
    ),
    [WEBTOOLS_QRCODE_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsQrcodePanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsQrcodePanelPayload(panel);
      },
      "form.webtools-qrcode-form"
    ),
    [WEBTOOLS_MARKDOWN_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsMarkdownPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsMarkdownPanelPayload(panel);
      },
      "form.webtools-markdown-form"
    ),
    [WEBTOOLS_UA_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsUaPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsUaPanelPayload(panel);
      },
      "form.webtools-ua-form"
    ),
    [WEBTOOLS_API_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsApiPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsApiPanelPayload(panel);
      },
      "form.webtools-api-form"
    ),
    [WEBTOOLS_HTTP_MOCK_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderWebtoolsHttpMockPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyWebtoolsHttpMockPanelPayload(panel);
      },
      "form.webtools-http-mock-form"
    ),
    [CODEAGENT_SWITCH_PLUGIN_ID]: createSubmitPluginPanelHandler(
      () => {
        getRegisteredPanelImpls().renderCodeAgentSwitchPanel();
      },
      (panel) => {
        getRegisteredPanelImpls().applyCodeAgentSwitchPanelPayload(panel);
      },
      "form.codeagent-switch-form"
    )
  };

  export function getPluginPanelHandler(pluginId: string): PluginPanelHandler | null {
    const registry = window.__LL_PANEL_MODULES__;
    const module = registry?.get(pluginId);
    if (module && registry) {
      const activeRegistry = registry;
      return {
        render: () => {
          const panel = activePluginPanel;
          if (panel) {
            activeRegistry.render(pluginId, panel);
          }
        },
        onOpen: (panel) => {
          activeRegistry.onOpen(pluginId, panel);
        },
        onEnter: () => {
          const panel = activePluginPanel;
          if (panel) {
            activeRegistry.onEnter(pluginId, panel);
          }
        }
      };
    }
    return pluginPanelHandlers[pluginId] ?? null;
  }

  export function openGenericPluginPanel(payload: GenericPluginPanelPayload): void {
    activePluginPanel = {
      pluginId: payload.pluginId,
      title: (payload.title ?? "").trim() || payload.pluginId,
      subtitle: (payload.subtitle ?? "").trim() || "\u63d2\u4ef6\u9762\u677f",
      message: (payload.message ?? "").trim() || undefined,
      data: payload.data
    };

    const handler = getPluginPanelHandler(activePluginPanel.pluginId);
    handler?.onOpen?.(activePluginPanel);

    setMode("plugin");
    // Render immediately so OCR/translate panels are not dropped when a stale
    // refreshEntries() call loses the latestSearchToken race.
    renderList();
    void refreshEntries("");
  }

}
