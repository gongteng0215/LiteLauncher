(() => {
  const registry = window.__LL_PANEL_MODULES__;
  const constants = window.__LL_PLUGIN_CONSTANTS__;
  if (!registry || !constants) throw new Error("dictionary panel module dependencies not initialized");

  registry.register({
    id: "dictionary-translation",
    pluginIds: [constants.DICTIONARY_PLUGIN_ID, constants.WEBTOOLS_TRANSLATE_PLUGIN_ID],
    render(host, panel): void {
      if (panel.pluginId === constants.DICTIONARY_PLUGIN_ID) host.getLegacyImpls().renderDictionaryPanel();
      else host.getLegacyImpls().renderWebtoolsTranslatePanel();
    },
    onOpen(host, panel): void {
      if (panel.pluginId === constants.DICTIONARY_PLUGIN_ID) {
        host.getLegacyImpls().applyDictionaryPanelPayload(panel);
        void Promise.all([
          RendererPanelRuntime.hydrateDictionaryPanelState(),
          RendererPanelRuntime.hydrateDictionaryPackStatus()
        ]).then(async () => {
          if (host.getActivePanel()?.pluginId === constants.DICTIONARY_PLUGIN_ID) {
            host.renderList();
          }
          await RendererPanelRuntime.maybeAutoRunDictionaryPanelLookup();
        });
      } else {
        host.getLegacyImpls().applyWebtoolsTranslatePanelPayload(panel);
        void RendererPanelRuntime.hydrateTranslateToolPanelFromSettings();
      }
    },
    onEnter(host, panel): void {
      const selector = panel.pluginId === constants.DICTIONARY_PLUGIN_ID
        ? "form.dictionary-form"
        : "form.webtools-translate-form";
      const form = host.list.querySelector(selector);
      if (form instanceof HTMLFormElement) form.requestSubmit();
    }
  });
})();
