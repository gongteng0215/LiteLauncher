(() => {
  const registry = window.__LL_PANEL_MODULES__;
  const constants = window.__LL_PLUGIN_CONSTANTS__;
  if (!registry || !constants) {
    throw new Error("structured panel module dependencies not initialized");
  }

  const bindings: Record<
    string,
    {
      render(host: RendererPanelHost): void;
      open(host: RendererPanelHost, panel: ActivePluginPanelState): void;
      form: string;
    }
  > = {
    [constants.WEBTOOLS_JSON_PLUGIN_ID]: {
      render: (host) => host.getLegacyImpls().renderWebtoolsJsonPanel(),
      open: (host, panel) => host.getLegacyImpls().applyWebtoolsJsonPanelPayload(panel),
      form: "form.webtools-json-form"
    },
    [constants.WEBTOOLS_JSON_SCHEMA_PLUGIN_ID]: {
      render: (host) => host.getLegacyImpls().renderWebtoolsJsonSchemaPanel(),
      open: (host, panel) => host.getLegacyImpls().applyWebtoolsJsonSchemaPanelPayload(panel),
      form: "form.webtools-json-schema-form"
    },
    [constants.WEBTOOLS_DATA_MASK_PLUGIN_ID]: {
      render: (host) => host.getLegacyImpls().renderWebtoolsDataMaskPanel(),
      open: (host, panel) => host.getLegacyImpls().applyWebtoolsDataMaskPanelPayload(panel),
      form: "form.webtools-data-mask-form"
    },
    [constants.WEBTOOLS_URL_PLUGIN_ID]: {
      render: (host) => host.getLegacyImpls().renderWebtoolsUrlPanel(),
      open: (host, panel) => host.getLegacyImpls().applyWebtoolsUrlPanelPayload(panel),
      form: "form.webtools-url-form"
    },
    [constants.WEBTOOLS_DIFF_PLUGIN_ID]: {
      render: (host) => host.getLegacyImpls().renderWebtoolsDiffPanel(),
      open: (host, panel) => host.getLegacyImpls().applyWebtoolsDiffPanelPayload(panel),
      form: "form.webtools-diff-form"
    },
    [constants.WEBTOOLS_TIMESTAMP_PLUGIN_ID]: {
      render: (host) => host.getLegacyImpls().renderWebtoolsTimestampPanel(),
      open: (host, panel) => host.getLegacyImpls().applyWebtoolsTimestampPanelPayload(panel),
      form: "form.webtools-timestamp-form"
    }
  };

  registry.register({
    id: "structured-data-tools",
    pluginIds: Object.keys(bindings),
    render(host, panel): void {
      bindings[panel.pluginId]?.render(host);
    },
    onOpen(host, panel): void {
      bindings[panel.pluginId]?.open(host, panel);
    },
    onEnter(host, panel): void {
      const form = host.list.querySelector(bindings[panel.pluginId]?.form ?? "");
      if (form instanceof HTMLFormElement) form.requestSubmit();
    }
  });
})();
