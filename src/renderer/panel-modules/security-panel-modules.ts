(() => {
  const registry = window.__LL_PANEL_MODULES__;
  const constants = window.__LL_PLUGIN_CONSTANTS__;
  if (!registry || !constants) throw new Error("security panel module dependencies not initialized");

  const bindings: Record<string, {
    render(host: RendererPanelHost): void;
    open(host: RendererPanelHost, panel: ActivePluginPanelState): void;
    form: string;
  }> = {
    [constants.WEBTOOLS_REGEX_PLUGIN_ID]: {
      render: (host) => host.getLegacyImpls().renderWebtoolsRegexPanel(),
      open: (host, panel) => host.getLegacyImpls().applyWebtoolsRegexPanelPayload(panel),
      form: "form.webtools-regex-form"
    },
    [constants.WEBTOOLS_CRYPTO_PLUGIN_ID]: {
      render: (host) => host.getLegacyImpls().renderWebtoolsCryptoPanel(),
      open: (host, panel) => host.getLegacyImpls().applyWebtoolsCryptoPanelPayload(panel),
      form: "form.webtools-crypto-form"
    },
    [constants.WEBTOOLS_JWT_PLUGIN_ID]: {
      render: (host) => host.getLegacyImpls().renderWebtoolsJwtPanel(),
      open: (host, panel) => host.getLegacyImpls().applyWebtoolsJwtPanelPayload(panel),
      form: "form.webtools-jwt-form"
    },
    [constants.WEBTOOLS_PASSWORD_PLUGIN_ID]: {
      render: (host) => host.getLegacyImpls().renderWebtoolsPasswordPanel(),
      open: (host, panel) => host.getLegacyImpls().applyWebtoolsPasswordPanelPayload(panel),
      form: "form.webtools-password-form"
    }
  };

  registry.register({
    id: "security-tools",
    pluginIds: Object.keys(bindings),
    render: (host, panel) => bindings[panel.pluginId]?.render(host),
    onOpen: (host, panel) => bindings[panel.pluginId]?.open(host, panel),
    onEnter(host, panel): void {
      const form = host.list.querySelector(bindings[panel.pluginId]?.form ?? "");
      if (form instanceof HTMLFormElement) form.requestSubmit();
    }
  });
})();
