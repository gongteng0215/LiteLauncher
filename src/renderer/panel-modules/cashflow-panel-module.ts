(() => {
  const registry = window.__LL_PANEL_MODULES__;
  const pluginId = window.__LL_PLUGIN_CONSTANTS__?.CASHFLOW_PLUGIN_ID;
  if (!registry || !pluginId) {
    throw new Error("cashflow panel module dependencies not initialized");
  }

  registry.register({
    id: "cashflow",
    pluginIds: [pluginId],
    render(host): void {
      host.getLegacyImpls().renderCashflowPanel();
    },
    onEnter(host): void {
      host.getLegacyImpls().handleCashflowPanelEnter();
    }
  });
})();
