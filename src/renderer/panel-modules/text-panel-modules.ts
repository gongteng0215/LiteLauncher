(() => {
  const registry = window.__LL_PANEL_MODULES__;
  const constants = window.__LL_PLUGIN_CONSTANTS__;
  if (!registry || !constants) throw new Error("text panel module dependencies not initialized");

  const bindings: Record<string, {
    render(host: RendererPanelHost): void;
    open(host: RendererPanelHost, panel: ActivePluginPanelState): void;
    form: string;
  }> = {
    [constants.WEBTOOLS_STRINGS_PLUGIN_ID]: {
      render: (host) => host.getLegacyImpls().renderWebtoolsStringsPanel(),
      open: (host, panel) => host.getLegacyImpls().applyWebtoolsStringsPanelPayload(panel),
      form: "form.webtools-strings-form"
    },
    [constants.WEBTOOLS_COLORS_PLUGIN_ID]: {
      render: (host) => host.getLegacyImpls().renderWebtoolsColorsPanel(),
      open: (host, panel) => host.getLegacyImpls().applyWebtoolsColorsPanelPayload(panel),
      form: "form.webtools-colors-form"
    },
    [constants.WEBTOOLS_CRON_PLUGIN_ID]: {
      render: (host) => host.getLegacyImpls().renderWebtoolsCronPanel(),
      open: (host, panel) => host.getLegacyImpls().applyWebtoolsCronPanelPayload(panel),
      form: "form.webtools-cron-form"
    }
  };

  registry.register({
    id: "text-tools",
    pluginIds: Object.keys(bindings),
    render: (host, panel) => bindings[panel.pluginId]?.render(host),
    onOpen: (host, panel) => bindings[panel.pluginId]?.open(host, panel),
    onEnter(host, panel): void {
      const form = host.list.querySelector(bindings[panel.pluginId]?.form ?? "");
      if (form instanceof HTMLFormElement) form.requestSubmit();
    }
  });
})();
