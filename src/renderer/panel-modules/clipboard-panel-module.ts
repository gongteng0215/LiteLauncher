(() => {
  const registry = window.__LL_PANEL_MODULES__;
  const pluginId = window.__LL_PLUGIN_CONSTANTS__?.CLIPBOARD_WORKBENCH_PLUGIN_ID;
  if (!registry || !pluginId) {
    throw new Error("clipboard panel module dependencies not initialized");
  }

  registry.register({
    id: "clipboard-workbench",
    pluginIds: [pluginId],
    render(host): void {
      host.getLegacyImpls().renderClipboardWorkbenchPanel();
    },
    onOpen(host, panel): void {
      host.getLegacyImpls().applyClipboardWorkbenchPanelPayload(panel);
    },
    onEnter(host): void {
      const form = host.list.querySelector("form.clipboard-workbench-form");
      if (form instanceof HTMLFormElement) {
        form.requestSubmit();
      }
    }
  });
})();
