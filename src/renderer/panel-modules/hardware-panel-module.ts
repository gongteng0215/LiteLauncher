(() => {
  const registry = window.__LL_PANEL_MODULES__;
  const pluginId = window.__LL_PLUGIN_CONSTANTS__?.HARDWARE_INSPECTOR_PLUGIN_ID;
  if (!registry || !pluginId) {
    throw new Error("hardware panel module dependencies not initialized");
  }

  registry.register({
    id: "hardware-inspector",
    pluginIds: [pluginId],
    render(host): void {
      host.getLegacyImpls().renderHardwareInspectorPanel();
    },
    onOpen(host, panel): void {
      host.getLegacyImpls().applyHardwareInspectorPanelPayload(panel);
    },
    onEnter(host): void {
      const form = host.list.querySelector("form.hardware-inspector-form");
      if (form instanceof HTMLFormElement) {
        form.requestSubmit();
      }
    },
    onEscape(host): boolean {
      return host.getLegacyImpls().handleHardwareInspectorEscape();
    }
  });
})();
