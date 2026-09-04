namespace RendererPanelRuntime {
  window.__LL_PANEL_IMPLS__ = {
    handleStandalonePanelPayload,
    handleGenericPluginPanelPayload,
    renderPasswordPanel,
    handlePasswordPanelEnter,
    renderCashflowPanel,
    refreshCashflowPanel,
    handleCashflowPanelEnter,
    renderActivePluginPanel,
    handleActivePluginPanelEnter,
    handleActivePluginPanelEscape,
    getActivePluginPanelTitle,
    cleanupPluginPanelTransientState,
    applyHardwareInspectorPanelPayload,
    renderHardwareInspectorPanel,
    handleHardwareInspectorEscape,
    applyClipboardWorkbenchPanelPayload,
    renderClipboardWorkbenchPanel,
    applyLiteSnapPanelPayload,
    renderLiteSnapPanel,
    applyWebtoolsFileHashPanelPayload,
    renderWebtoolsFileHashPanel,
    applyWebtoolsPortHelperPanelPayload,
    renderWebtoolsPortHelperPanel,
    applyWebtoolsPasswordPanelPayload,
    renderWebtoolsPasswordPanel,
    applyWebtoolsJsonPanelPayload,
    renderWebtoolsJsonPanel,
    applyWebtoolsUrlPanelPayload,
    renderWebtoolsUrlPanel,
    applyWebtoolsTimestampPanelPayload,
    renderWebtoolsTimestampPanel,
    applyWebtoolsRegexPanelPayload,
    renderWebtoolsRegexPanel,
    applyWebtoolsCryptoPanelPayload,
    renderWebtoolsCryptoPanel,
    applyWebtoolsJwtPanelPayload,
    renderWebtoolsJwtPanel,
    applyWebtoolsDiffPanelPayload,
    renderWebtoolsDiffPanel,
    applyWebtoolsImageBase64PanelPayload,
    renderWebtoolsImageBase64Panel,
    applyWebtoolsImagePromptPanelPayload,
    renderWebtoolsImagePromptPanel,
    applyWebtoolsConfigPanelPayload,
    renderWebtoolsConfigPanel,
    applyWebtoolsSqlPanelPayload,
    renderWebtoolsSqlPanel,
    applyWebtoolsUnitPanelPayload,
    renderWebtoolsUnitPanel,
    applyWebtoolsMarkdownPanelPayload,
    renderWebtoolsMarkdownPanel,
    applyWebtoolsStringsPanelPayload,
    renderWebtoolsStringsPanel,
    applyWebtoolsColorsPanelPayload,
    renderWebtoolsColorsPanel,
    applyWebtoolsQrcodePanelPayload,
    renderWebtoolsQrcodePanel,
    applyWebtoolsUaPanelPayload,
    renderWebtoolsUaPanel,
    applyWebtoolsApiPanelPayload,
    renderWebtoolsApiPanel,
    applyWebtoolsHttpMockPanelPayload,
    renderWebtoolsHttpMockPanel,
    applyDictionaryPanelPayload,
    renderDictionaryPanel,
    applyWebtoolsTranslatePanelPayload,
    renderWebtoolsTranslatePanel,
    applyCodeAgentSwitchPanelPayload,
    renderCodeAgentSwitchPanel,
    applyWebtoolsCronPanelPayload,
    renderWebtoolsCronPanel,
    applyWebtoolsJsonSchemaPanelPayload,
    renderWebtoolsJsonSchemaPanel,
    applyWebtoolsDataMaskPanelPayload,
    renderWebtoolsDataMaskPanel
  };

  const panelModuleRegistry = window.__LL_PANEL_MODULES__;
  if (!panelModuleRegistry) {
    throw new Error("renderer panel module registry not initialized");
  }
  panelModuleRegistry.configureHost({
    list,
    isDevelopment: window.launcher?.isDebugKeysEnabled?.() === true,
    getActivePanel: () => activePluginPanel,
    setStatus,
    renderList,
    refreshEntries,
    backToSearch,
    copyText: copyTextToClipboard,
    getLegacyImpls: getRegisteredPanelImpls,
    showRecovery(pluginId, message): void {
      const panelItem = document.createElement("li");
      panelItem.className = "settings-panel-item";
      const panel = document.createElement("section");
      panel.className = "settings-panel panel-module-recovery";
      const title = document.createElement("h3");
      title.className = "settings-title";
      title.textContent = "面板暂时无法打开";
      const description = document.createElement("p");
      description.className = "settings-description";
      description.textContent = message;
      const actions = document.createElement("div");
      actions.className = "settings-actions";
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "settings-btn settings-btn-primary";
      retry.textContent = "重试";
      retry.addEventListener("click", () => {
        const current = activePluginPanel;
        if (current?.pluginId === pluginId) {
          window.__LL_PANEL_MODULES__?.render(pluginId, current);
        } else {
          renderList();
        }
      });
      const back = document.createElement("button");
      back.type = "button";
      back.className = "settings-btn settings-btn-secondary";
      back.textContent = "返回搜索";
      back.addEventListener("click", backToSearch);
      actions.append(retry, back);
      panel.append(title, description, actions);
      panelItem.appendChild(panel);
      list.replaceChildren(panelItem);
    },
    reportError(pluginId, message, detail): void {
      void window.launcher.reportErrorLog({
        scope: "renderer",
        level: "error",
        message: String(message).slice(0, 240),
        context: `panel-module:${String(pluginId).slice(0, 100)}`,
        detail: detail ? String(detail).slice(0, 800) : undefined
      });
    }
  });
}
