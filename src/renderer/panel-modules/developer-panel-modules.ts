(() => {
  const registry = window.__LL_PANEL_MODULES__;
  const constants = window.__LL_PLUGIN_CONSTANTS__;
  if (!registry || !constants) throw new Error("developer panel module dependencies not initialized");

  const bindings: Record<string, {
    render(host: RendererPanelHost): void;
    open(host: RendererPanelHost, panel: ActivePluginPanelState): void;
    form: string;
  }> = {
    [constants.WEBTOOLS_CONFIG_PLUGIN_ID]: { render: (h) => h.getLegacyImpls().renderWebtoolsConfigPanel(), open: (h, p) => h.getLegacyImpls().applyWebtoolsConfigPanelPayload(p), form: "form.webtools-config-form" },
    [constants.WEBTOOLS_SQL_PLUGIN_ID]: { render: (h) => h.getLegacyImpls().renderWebtoolsSqlPanel(), open: (h, p) => h.getLegacyImpls().applyWebtoolsSqlPanelPayload(p), form: "form.webtools-sql-form" },
    [constants.WEBTOOLS_UNIT_PLUGIN_ID]: { render: (h) => h.getLegacyImpls().renderWebtoolsUnitPanel(), open: (h, p) => h.getLegacyImpls().applyWebtoolsUnitPanelPayload(p), form: "form.webtools-unit-form" },
    [constants.WEBTOOLS_FILE_HASH_PLUGIN_ID]: { render: (h) => h.getLegacyImpls().renderWebtoolsFileHashPanel(), open: (h, p) => h.getLegacyImpls().applyWebtoolsFileHashPanelPayload(p), form: "form.webtools-file-hash-form" },
    [constants.WEBTOOLS_PORT_HELPER_PLUGIN_ID]: { render: (h) => h.getLegacyImpls().renderWebtoolsPortHelperPanel(), open: (h, p) => h.getLegacyImpls().applyWebtoolsPortHelperPanelPayload(p), form: "form.webtools-port-helper-form" },
    [constants.WEBTOOLS_API_PLUGIN_ID]: { render: (h) => h.getLegacyImpls().renderWebtoolsApiPanel(), open: (h, p) => h.getLegacyImpls().applyWebtoolsApiPanelPayload(p), form: "form.webtools-api-form" },
    [constants.WEBTOOLS_HTTP_MOCK_PLUGIN_ID]: { render: (h) => h.getLegacyImpls().renderWebtoolsHttpMockPanel(), open: (h, p) => h.getLegacyImpls().applyWebtoolsHttpMockPanelPayload(p), form: "form.webtools-http-mock-form" }
  };

  registry.register({
    id: "developer-tools",
    pluginIds: Object.keys(bindings),
    render: (host, panel) => bindings[panel.pluginId]?.render(host),
    onOpen: (host, panel) => bindings[panel.pluginId]?.open(host, panel),
    onEnter(host, panel): void {
      const form = host.list.querySelector(bindings[panel.pluginId]?.form ?? "");
      if (form instanceof HTMLFormElement) form.requestSubmit();
    }
  });
})();
