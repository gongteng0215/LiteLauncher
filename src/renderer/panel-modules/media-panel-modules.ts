(() => {
  const registry = window.__LL_PANEL_MODULES__;
  const constants = window.__LL_PLUGIN_CONSTANTS__;
  if (!registry || !constants) throw new Error("media panel module dependencies not initialized");

  const bindings: Record<string, {
    render(host: RendererPanelHost): void;
    open(host: RendererPanelHost, panel: ActivePluginPanelState): void;
    form: string;
  }> = {
    [constants.WEBTOOLS_IMAGE_BASE64_PLUGIN_ID]: {
      render: (host) => host.getLegacyImpls().renderWebtoolsImageBase64Panel(),
      open: (host, panel) => host.getLegacyImpls().applyWebtoolsImageBase64PanelPayload(panel),
      form: "form.webtools-image-base64-form"
    },
    [constants.WEBTOOLS_IMAGE_PROMPT_PLUGIN_ID]: {
      render: (host) => host.getLegacyImpls().renderWebtoolsImagePromptPanel(),
      open: (host, panel) => host.getLegacyImpls().applyWebtoolsImagePromptPanelPayload(panel),
      form: "form.webtools-image-prompt-form"
    },
    [constants.WEBTOOLS_QRCODE_PLUGIN_ID]: {
      render: (host) => host.getLegacyImpls().renderWebtoolsQrcodePanel(),
      open: (host, panel) => host.getLegacyImpls().applyWebtoolsQrcodePanelPayload(panel),
      form: "form.webtools-qrcode-form"
    },
    [constants.WEBTOOLS_MARKDOWN_PLUGIN_ID]: {
      render: (host) => host.getLegacyImpls().renderWebtoolsMarkdownPanel(),
      open: (host, panel) => host.getLegacyImpls().applyWebtoolsMarkdownPanelPayload(panel),
      form: "form.webtools-markdown-form"
    },
    [constants.WEBTOOLS_UA_PLUGIN_ID]: {
      render: (host) => host.getLegacyImpls().renderWebtoolsUaPanel(),
      open: (host, panel) => host.getLegacyImpls().applyWebtoolsUaPanelPayload(panel),
      form: "form.webtools-ua-form"
    }
  };

  registry.register({
    id: "media-tools",
    pluginIds: Object.keys(bindings),
    render: (host, panel) => bindings[panel.pluginId]?.render(host),
    onOpen: (host, panel) => bindings[panel.pluginId]?.open(host, panel),
    onEnter(host, panel): void {
      const form = host.list.querySelector(bindings[panel.pluginId]?.form ?? "");
      if (form instanceof HTMLFormElement) form.requestSubmit();
    }
  });
})();
