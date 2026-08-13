(() => {
  const registry = window.__LL_PANEL_MODULES__;
  const pluginId = window.__LL_PLUGIN_CONSTANTS__?.CODEAGENT_SWITCH_PLUGIN_ID;
  if (!registry || !pluginId) {
    throw new Error("CodeAgent panel module dependencies not initialized");
  }

  registry.register({
    id: "codeagent-switch",
    pluginIds: [pluginId],
    render(host): void {
      host.getLegacyImpls().renderCodeAgentSwitchPanel();
    },
    onOpen(host, panel): void {
      host.getLegacyImpls().applyCodeAgentSwitchPanelPayload(panel);
    },
    onEnter(host): void {
      const form = host.list.querySelector("form.codeagent-switch-form");
      if (form instanceof HTMLFormElement) {
        form.requestSubmit();
      }
    }
  });
})();
