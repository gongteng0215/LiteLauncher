(() => {
  const registry = window.__LL_PANEL_MODULES__;
  const pluginId = window.__LL_PLUGIN_CONSTANTS__?.LITESNAP_PLUGIN_ID;
  if (!registry || !pluginId) {
    throw new Error("LiteSnap panel module dependencies not initialized");
  }

  registry.register({
    id: "litesnap",
    pluginIds: [pluginId],
    render(host): void {
      host.getLegacyImpls().renderLiteSnapPanel();
    },
    onOpen(host, panel): void {
      host.getLegacyImpls().applyLiteSnapPanelPayload(panel);
      void RendererPanelRuntime.hydrateLiteSnapPanelFromSettings();
    },
    onEnter(host): void {
      const form = host.list.querySelector("form.litesnap-form");
      if (form instanceof HTMLFormElement) {
        form.requestSubmit();
      }
    }
  });
})();
