function focusInput(selectAll = false): void {
  input.focus();
  if (selectAll) {
    input.select();
  }
}

function setStatus(message: string): void {
  statusText.textContent = message;
}

function setHint(message: string): void {
  hintText.textContent = message;
}

function clearResultsLoadingTimer(): void {
  if (resultsLoadingTimer !== null) {
    window.clearTimeout(resultsLoadingTimer);
    resultsLoadingTimer = null;
  }
}

function setResultsLoading(active: boolean, message = "正在加载..."): void {
  if (!active) {
    clearResultsLoadingTimer();
  }
  isResultsLoading = active;
  results.toggleAttribute("data-loading", active);
  resultsLoading.hidden = !active;
  resultsLoadingText.textContent = message;

  if (mode === "search") {
    const hasQuery = Boolean(currentQuery.trim());
    if (active && hasQuery) {
      commandCenterUi.setCommandSearchStatus(message);
    } else if (!active && !hasQuery) {
      commandCenterUi.setCommandSearchStatus(null);
    }
  }
}

function scheduleResultsLoading(message: string, delayMs = 120): void {
  clearResultsLoadingTimer();
  resultsLoadingTimer = window.setTimeout(() => {
    setResultsLoading(true, message);
    resultsLoadingTimer = null;
  }, delayMs);
}

function clearSearchInputDebounceTimer(): void {
  if (searchInputDebounceTimer !== null) {
    window.clearTimeout(searchInputDebounceTimer);
    searchInputDebounceTimer = null;
  }
}

function markHomeSectionsDirty(): void {
  homeSectionsDirty = true;
  cachedHomeEntries = null;
  cachedHomeSections = null;
  cachedHomeStatus = "";
}

function cacheHomeSectionsSnapshot(statusText: string): void {
  cachedHomeEntries = entries.slice();
  cachedHomeSections = searchSections.map((section) => ({
    ...section,
    indexes: section.indexes.slice()
  }));
  cachedHomeStatus = statusText;
  homeSectionsDirty = false;
}

function tryRestoreCachedHomeSections(): boolean {
  if (
    homeSectionsDirty ||
    !cachedHomeEntries ||
    !cachedHomeSections ||
    mode !== "search"
  ) {
    return false;
  }

  const recentGrid = commandCenterUi.getSectionGrid("recent");
  const hasHomeDom = Boolean(recentGrid && recentGrid.children.length > 0);
  entries = cachedHomeEntries;
  searchSections = cachedHomeSections;
  selectedIndex = 0;
  pagedSearchQueryKey = "";
  searchResultPage = 0;
  cachedSearchLaunchItems = [];
  commandCenterUi.updateCommandCenterQueryState(false);
  const resultsHost = commandCenterUi.getCommandResultsHost();
  if (resultsHost) {
    resultsHost.replaceChildren();
    resultsHost.hidden = true;
  }
  commandCenterUi.setCommandSearchStatus(null);

  if (hasHomeDom) {
    renderPinnedSectionActions();
    setStatus(cachedHomeStatus || "可以开始搜索");
    return true;
  }

  renderList();
  setStatus(cachedHomeStatus || "可以开始搜索");
  return true;
}

/**
 * Synchronously restore Command Center home chrome, then optionally refresh
 * home data. Used on window hide / Esc so reopen never flashes the last search.
 */
function resetLauncherToHomeState(options?: { refreshHome?: boolean }): void {
  const hadNonHomeSurface =
    mode !== "search" ||
    Boolean(input.value.trim()) ||
    Boolean(currentQuery.trim()) ||
    commandCenterUi.isSettingsOverlayOpen() ||
    Boolean(document.querySelector(".launcher-shell.is-searching"));

  clearSearchInputDebounceTimer();
  clearResultsLoadingTimer();
  latestSearchToken += 1;
  setResultsLoading(false);
  closeSearchContextMenu();

  if (pinnedManageMode) {
    setPinnedManageMode(false);
  }
  if (commandCenterUi.isSettingsOverlayOpen()) {
    dismissSettingsOverlay();
  }

  input.value = "";
  currentQuery = "";
  pagedSearchQueryKey = "";
  searchResultPage = 0;
  pluginResultPage = 0;
  selectedIndex = 0;
  cachedSearchLaunchItems = [];

  if (mode !== "search") {
    setMode("search");
  } else {
    input.readOnly = false;
    input.placeholder = "输入命令、搜索应用或插件…";
    commandCenterUi.syncHomeChromeVisibility("search");
  }

  // Drop plugin / panel DOM so the frozen hide frame is home, not the last tool.
  if (listElement) {
    listElement.replaceChildren();
  }
  if (resultsElement) {
    resultsElement.hidden = true;
  }

  commandCenterUi.updateCommandCenterQueryState(false);
  const resultsHost = commandCenterUi.getCommandResultsHost();
  if (resultsHost) {
    resultsHost.replaceChildren();
    resultsHost.hidden = true;
  }
  commandCenterUi.setCommandSearchStatus(null);
  syncWindowSizePreset("search", true);

  // Always try a sync home restore so hide freezes on initialized home tiles.
  const restored = tryRestoreCachedHomeSections();

  if (options?.refreshHome === false) {
    return;
  }

  if (!hadNonHomeSurface || restored) {
    return;
  }

  void refreshEntries("");
}

/** Called from main via executeJavaScript / prepareHide IPC before hide/show. */
function prepareLauncherHide(): void {
  resetLauncherToHomeState({ refreshHome: false });
}

function ackPrepareHideAfterPaint(requestId: number): void {
  const launcher = getLauncherApi();
  // Prefer setTimeout over rAF: rAF may never run while the BrowserWindow is
  // hidden, which would block the main-process prepare/show handshake.
  window.setTimeout(() => {
    launcher?.ackPrepareHide?.(requestId);
  }, 0);
}

(
  window as Window & {
    __LL_PREPARE_HIDE__?: () => void;
  }
).__LL_PREPARE_HIDE__ = prepareLauncherHide;

function hasPendingSearchInputDebounce(): boolean {
  return searchInputDebounceTimer !== null;
}

function flushSearchInputDebounce(): void {
  if (!hasPendingSearchInputDebounce()) {
    return;
  }

  clearSearchInputDebounceTimer();
  void refreshEntries(currentQuery);
}

function scheduleSearchRefreshFromInput(
  nextQuery: string,
  options?: { fromKeyboard?: boolean }
): void {
  closeSearchContextMenu();
  currentQuery = nextQuery;

  const trimmed = nextQuery.trim();
  if (mode === "search") {
    if (trimmed && pinnedManageMode) {
      setPinnedManageMode(false);
    }
    commandCenterUi.updateCommandCenterQueryState(Boolean(trimmed));
    if (trimmed) {
      commandCenterUi.setCommandSearchStatus("输入中，准备检索...");
    } else {
      commandCenterUi.setCommandSearchStatus(null);
    }
  }

  const shouldDebounce = shouldDebounceSearchRefresh(
    nextQuery,
    mode === "search",
    Boolean(options?.fromKeyboard)
  );
  if (!shouldDebounce) {
    clearSearchInputDebounceTimer();
    void refreshEntries(currentQuery);
    return;
  }

  clearSearchInputDebounceTimer();
  if (!isResultsLoading) {
    setResultsLoading(true, "输入中，准备检索...");
  } else if (mode === "search" && trimmed) {
    commandCenterUi.setCommandSearchStatus("输入中，准备检索...");
  }
  setStatus("输入中，准备检索...");
  searchInputDebounceTimer = window.setTimeout(() => {
    searchInputDebounceTimer = null;
    void refreshEntries(currentQuery);
  }, SEARCH_INPUT_DEBOUNCE_MS);
}

function applyModeClass(nextMode: PanelMode): void {
  document.body.classList.toggle("mode-cashflow", nextMode === "cashflow");
  document.body.classList.toggle("mode-plugin", nextMode === "plugin");
  document.body.dataset.mode = nextMode;
  if (nextMode !== "plugin") {
    delete document.body.dataset.activePluginId;
  }
}

function requestWindowSizePreset(
  preset: "compact" | "cashflow",
  retriesLeft = 1
): void {
  const launcher = getLauncherApi();
  if (!launcher?.setWindowSizePreset) {
    return;
  }

  pendingWindowSizePreset = preset;
  void launcher
    .setWindowSizePreset(preset)
    .then((applied) => {
      if (applied) {
        if (pendingWindowSizePreset === preset) {
          currentWindowSizePreset = preset;
        } else {
          requestWindowSizePreset(pendingWindowSizePreset, 1);
        }
        return;
      }

      if (retriesLeft > 0 && pendingWindowSizePreset === preset) {
        setTimeout(() => requestWindowSizePreset(preset, retriesLeft - 1), 70);
      }
    })
    .catch(() => {
      if (retriesLeft > 0 && pendingWindowSizePreset === preset) {
        setTimeout(() => requestWindowSizePreset(preset, retriesLeft - 1), 70);
      }
    });
}

function syncWindowSizePreset(nextMode: PanelMode, force = false): void {
  const useExpandedPreset =
    nextMode === "cashflow" || nextMode === "plugin" || nextMode === "settings";
  const preset: "compact" | "cashflow" = useExpandedPreset ? "cashflow" : "compact";
  if (
    !force &&
    preset === currentWindowSizePreset &&
    preset === pendingWindowSizePreset
  ) {
    return;
  }

  requestWindowSizePreset(preset, force ? 2 : 1);
}

function setMode(nextMode: PanelMode): void {
  clearSearchInputDebounceTimer();
  if (nextMode !== "plugin") {
    panelImplsSafe.cleanupPluginPanelTransientState(null);
    releasePluginNativeInteractionLock();
  }
  mode = nextMode;
  syncAutoHideSuspension(nextMode);
  syncWindowSizePreset(nextMode);
  applyModeClass(nextMode);
  commandCenterUi.syncHomeChromeVisibility(nextMode);
  if (nextMode !== "search" && nextMode !== "clip") {
    setResultsLoading(false);
  }
  input.value = "";
  currentQuery = "";
  // A Command Center result may have left its backdrop above the home shell.
  // Clear it before making a panel interactive so it cannot intercept panel clicks.
  commandCenterUi.setCommandSearchStatus(null);
  input.readOnly =
    mode === "settings" ||
    mode === "password" ||
    mode === "cashflow" ||
    mode === "plugin";

  if (mode === "search") {
    input.placeholder = "输入命令、搜索应用或插件…";
    setHint(
      "输入停顿约 0.3 秒后检索 - Enter 执行 - Esc 清空/隐藏 - 方向键移动 - 支持 app:/cmd:/web:/plugin:"
    );
  } else if (mode === "clip") {
    input.placeholder = "\u641c\u7d22\u526a\u8d34\u677f\u5386\u53f2";
    setHint("Enter \u590d\u5236 - Delete \u5220\u9664 - Ctrl+Shift+Delete \u6e05\u7a7a - Esc \u8fd4\u56de");
  } else if (mode === "password") {
    input.placeholder = "\u5bc6\u7801\u751f\u6210\u5668\u9762\u677f";
    setHint("Enter \u751f\u6210\u5e76\u590d\u5236 - Esc \u8fd4\u56de");
  } else if (mode === "cashflow") {
    input.placeholder = "\u73b0\u91d1\u6d41\u6e38\u620f\u9762\u677f";
    setHint("Enter \u4e0b\u4e00\u56de\u5408 - Esc \u8fd4\u56de - \u70b9\u51fb\u6309\u94ae\u64cd\u4f5c");
  } else if (mode === "plugin") {
    input.placeholder = "\u63d2\u4ef6\u9762\u677f";
    setHint(
      "Esc \u8fd4\u56de - Enter \u6267\u884c\u9ed8\u8ba4\u64cd\u4f5c - \u591a\u884c\u6587\u672c\u6846\u5185 Ctrl+Enter \u6267\u884c"
    );
  } else {
    input.placeholder = "\u8bbe\u7f6e\u9762\u677f";
    setHint("Esc \u8fd4\u56de");
  }
}

function backToSearch(): void {
  clearSearchInputDebounceTimer();
  if (commandCenterUi.isSettingsOverlayOpen()) {
    dismissSettingsOverlay();
    return;
  }
  if (mode !== "search") {
    resetLauncherToHomeState();
    return;
  }

  if (UI_TUNING_KEEP_OPEN) {
    setStatus("调 UI 中：主页保持打开（Esc / 失焦不关闭）");
    return;
  }

  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u9690\u85cf\u7a97\u53e3");
    return;
  }
  // Paint + initialize home first so the frozen hide frame is never search/plugin.
  // Full home data refresh still runs via clearInput after hide.
  resetLauncherToHomeState({ refreshHome: false });
  void launcher.hide();
}

function handleLauncherOpenPanel(panelPayload: unknown): void {
  const genericPluginOpen = panelImplsSafe.handleGenericPluginPanelPayload(panelPayload);
  if (genericPluginOpen) {
    pushDebugLog(`renderer openPanel=plugin:${genericPluginOpen}`);
    return;
  }

  const standalonePanelOpen = panelImplsSafe.handleStandalonePanelPayload(panelPayload);
  if (standalonePanelOpen) {
    pushDebugLog(`renderer openPanel=${standalonePanelOpen}`);
    return;
  }

  const panel = typeof panelPayload === "string" ? panelPayload.trim() : "";
  if (panel === "clip") {
    setMode("clip");
    pushDebugLog("renderer openPanel=clip");
    void refreshEntries("");
    return;
  }

  if (panel === "settings") {
    pushDebugLog("renderer openPanel=settings");
    openSettingsPanel();
    return;
  }
}

function handlePanelModeKeydown(
  event: KeyboardEvent,
  options: {
    isEnter: boolean;
    isEscape: boolean;
    isMultilineEditorTarget: boolean;
  }
): boolean {
  const { isEnter, isEscape, isMultilineEditorTarget } = options;

  if (mode === "password") {
    if (isEscape) {
      event.preventDefault();
      pushDebugLog("renderer action: password -> backToSearch");
      backToSearch();
      return true;
    }

    if (isEnter) {
      event.preventDefault();
      const form = list.querySelector("form.password-form");
      if (form instanceof HTMLFormElement) {
        pushDebugLog("renderer action: password generate");
        panelImplsSafe.handlePasswordPanelEnter();
      }
      return true;
    }

    return true;
  }

  if (mode === "cashflow") {
    if (isEscape) {
      event.preventDefault();
      pushDebugLog("renderer action: cashflow -> backToSearch");
      backToSearch();
      return true;
    }

    if (isEnter) {
      event.preventDefault();
      pushDebugLog("renderer action: cashflow nextTurn");
      panelImplsSafe.handleCashflowPanelEnter();
      return true;
    }

    return true;
  }

  if (mode === "plugin") {
    if (isEscape) {
      event.preventDefault();
      if (panelImplsSafe.handleActivePluginPanelEscape()) {
        return true;
      }
      pushDebugLog("renderer action: plugin -> backToSearch");
      backToSearch();
      return true;
    }

    if (isEnter) {
      if (isMultilineEditorTarget && !event.ctrlKey && !event.metaKey) {
        return true;
      }
      event.preventDefault();
      panelImplsSafe.handleActivePluginPanelEnter();
      return true;
    }

    return true;
  }

  return false;
}

function handleKeydown(event: KeyboardEvent): void {
  if (handledEvents.has(event)) {
    return;
  }
  handledEvents.add(event);

  const target = event.target as HTMLElement | null;
  const targetName = target?.tagName?.toLowerCase() ?? "unknown";
  const key = event.key;
  const code = event.code;
  const isArrowLeft = key === "ArrowLeft" || key === "Left";
  const isArrowRight = key === "ArrowRight" || key === "Right";
  const isArrowDown = key === "ArrowDown" || key === "Down";
  const isArrowUp = key === "ArrowUp" || key === "Up";
  const isPageDown = key === "PageDown";
  const isPageUp = key === "PageUp";
  const isEnter =
    key === "Enter" ||
    key === "Return" ||
    code === "Enter" ||
    code === "NumpadEnter";
  const isEscape = key === "Escape" || key === "Esc";
  const isDelete = key === "Delete" || key === "Del";
  const isMultilineEditorTarget =
    target instanceof HTMLTextAreaElement || target?.isContentEditable === true;

  if (target === input) {
    pendingSearchInputFromKeyboard = isKeyboardDrivenSearchInputKey(event);
  }

  pushDebugLog(
    `renderer keydown ${formatMods(
      event.ctrlKey,
      event.altKey,
      event.shiftKey,
      event.metaKey
    )}${key} code=${code || "-"} target=${targetName}`
  );

  if (isEscape && activeSearchContextMenu) {
    event.preventDefault();
    closeSearchContextMenu();
    return;
  }

  if (mode === "settings" && !isEscape) {
    return;
  }

  if (commandCenterUi.isSettingsOverlayOpen() && !isEscape) {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest(".cc-settings-overlay-dialog")) {
      return;
    }
  }

  const handledPanelMode = handlePanelModeKeydown(event, {
    isEnter,
    isEscape,
    isMultilineEditorTarget
  });
  if (handledPanelMode) {
    return;
  }

  if (mode === "search" && currentQuery.trim()) {
    if (isPageDown) {
      event.preventDefault();
      pushDebugLog("renderer action: search page +1");
      changeSearchResultPage(1);
      return;
    }
    if (isPageUp) {
      event.preventDefault();
      pushDebugLog("renderer action: search page -1");
      changeSearchResultPage(-1);
      return;
    }
  }

  if (isArrowLeft) {
    event.preventDefault();
    pushDebugLog("renderer action: moveSelection(-1)");
    moveSelection(-1);
    return;
  }

  if (isArrowRight) {
    event.preventDefault();
    pushDebugLog("renderer action: moveSelection(+1)");
    moveSelection(1);
    return;
  }

  if (isArrowDown) {
    event.preventDefault();
    const step = mode === "search" ? getVisibleGridColumnCount() : 1;
    pushDebugLog(`renderer action: moveSelection(+${step})`);
    moveSelection(step);
    return;
  }

  if (isArrowUp) {
    event.preventDefault();
    const step = mode === "search" ? getVisibleGridColumnCount() : 1;
    pushDebugLog(`renderer action: moveSelection(-${step})`);
    moveSelection(-step);
    return;
  }

  if (isEnter) {
    event.preventDefault();
    if (mode === "search" && hasPendingSearchInputDebounce()) {
      pushDebugLog("renderer action: flush search debounce");
      flushSearchInputDebounce();
      return;
    }
    if (!entries[selectedIndex]) {
      setStatus("\u5f53\u524d\u6ca1\u6709\u53ef\u6267\u884c\u9879");
      pushDebugLog("renderer action: executeSelected skipped (no entry)");
      return;
    }
    pushDebugLog("renderer action: executeSelected()");
    void executeSelected();
    return;
  }

  if (mode === "clip" && isDelete && event.ctrlKey && event.shiftKey) {
    event.preventDefault();
    pushDebugLog("renderer action: clearAllClipItems()");
    void clearAllClipItems();
    return;
  }

  if (mode === "clip" && isDelete) {
    event.preventDefault();
    pushDebugLog("renderer action: deleteSelectedClipItem()");
    void deleteSelectedClipItem();
    return;
  }

  if (isEscape) {
    event.preventDefault();
    pushDebugLog("renderer action: escape pressed");
    if (pinnedManageMode) {
      setPinnedManageMode(false);
      return;
    }
    if (commandCenterUi.isSettingsOverlayOpen()) {
      dismissSettingsOverlay();
      return;
    }
    if (mode === "settings") {
      pushDebugLog("renderer action: settings -> backToSearch");
      backToSearch();
      return;
    }
    if (input.value.trim()) {
      clearSearchInputDebounceTimer();
      input.value = "";
      currentQuery = "";
      pushDebugLog("renderer action: clear query");
      // Sync chrome immediately; do not wait for home refresh.
      commandCenterUi.updateCommandCenterQueryState(false);
      commandCenterUi.setCommandSearchStatus(null);
      latestSearchToken += 1;
      setResultsLoading(false);
      if (!tryRestoreCachedHomeSections()) {
        void refreshEntries("");
      }
      return;
    }
    pushDebugLog("renderer action: backToSearch/hide");
    backToSearch();
  }
}

function registerEvents(): void {
  settingsShortcutButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    pushDebugLog("renderer action: toolbar settings");
    openSettingsPanel();
  });

  input.addEventListener("input", () => {
    scheduleSearchRefreshFromInput(input.value, {
      fromKeyboard: pendingSearchInputFromKeyboard
    });
    pendingSearchInputFromKeyboard = false;
  });

  input.addEventListener("keydown", handleKeydown, true);

  window.addEventListener(
    "keydown",
    (event) => {
      if (event.target === input) {
        return;
      }
      handleKeydown(event);
    },
    true
  );

  document.addEventListener("keydown", handleKeydown, true);
  document.addEventListener("mousedown", () => {
    closeSearchContextMenu();
  });
  list.addEventListener("scroll", () => {
    closeSearchContextMenu();
  });
  window.addEventListener("blur", () => {
    closeSearchContextMenu();
  });
  window.addEventListener("resize", () => {
    scheduleAdaptiveSectionGridRefresh();
  });

  const launcher = getLauncherApi();
  if (launcher?.onFocusInput) {
    launcher.onFocusInput(() => {
      if (document.activeElement === input) {
        return;
      }
      focusInput(true);
      pushDebugLog("renderer onFocusInput received");
    });
  }

  if (launcher?.onClearInput) {
    launcher.onClearInput(() => {
      pushDebugLog("renderer clearInput received");
      // Always restore home on hide (search / plugin / settings), sync first
      // so the next show never paints the previous query chrome.
      resetLauncherToHomeState();
    });
  }

  if (launcher?.onPrepareHide) {
    launcher.onPrepareHide((requestId) => {
      pushDebugLog("renderer prepareHide received");
      prepareLauncherHide();
      ackPrepareHideAfterPaint(requestId);
    });
  }

  if (launcher?.onOpenPanel) {
    launcher.onOpenPanel(handleLauncherOpenPanel);
  }

  window.addEventListener("focus", () => {
    pushDebugLog("renderer window focus");
    syncWindowSizePreset(mode, false);
    if (pluginNativeInteractionLocked) {
      schedulePluginNativeInteractionRelease();
    }
    focusInput(false);
  });

  if (launcher?.onDebugKey) {
    launcher.onDebugKey((event) => {
      debugMode = true;
      setStatus("\u8c03\u8bd5\u6a21\u5f0f\u5df2\u542f\u7528\uff0c\u53f3\u4e0b\u89d2\u663e\u793a\u6309\u952e\u65e5\u5fd7");
      pushDebugLog(formatDebugEvent(event));
    });
  }
}

function bootstrap(): void {
  markRendererBootstrapped();
  initDebugPanel();
  const launcher = getLauncherApi();
  debugMode = launcher?.isDebugKeysEnabled?.() ?? false;
  if (debugMode) {
    pushDebugLog("renderer debug enabled (from preload)");
  }

  window.addEventListener("error", (event) => {
    debugMode = true;
    pushDebugLog(`renderer error: ${event.message}`);
    setStatus(`\u6e32\u67d3\u5c42\u9519\u8bef\uff1a${event.message}`);
    void reportErrorLog({
      scope: "renderer",
      level: "error",
      message: event.message || "渲染层错误",
      context: `${event.filename}:${event.lineno}:${event.colno}`,
      detail: formatErrorDetail(event.error)
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    debugMode = true;
    const detail = formatErrorDetail(event.reason);
    pushDebugLog(`renderer unhandledrejection: ${detail ?? "unknown"}`);
    setStatus("\u6e32\u67d3\u5c42 Promise \u5f02\u5e38");
    void reportErrorLog({
      scope: "renderer",
      level: "error",
      message: "渲染层未处理 Promise 异常",
      detail
    });
  });

  setMode("search");
  commandCenterUi.initCommandCenterUi({
    onSidebarAction: (action) => {
      void handleSidebarAction(action);
    },
    onTogglePinnedManage: () => {
      togglePinnedManageMode();
    }
  });
  if (commandCenterIcons) {
    const headingMap: Record<string, string> = {
      ".cc-heading-icon--clock": "clock",
      ".cc-heading-icon--flash": "flash",
      ".cc-heading-icon--arrow": "arrow",
      ".cc-heading-icon--settings": "settings",
      ".cc-heading-icon--pin": "pin",
      ".cc-heading-icon--plugin": "plugin"
    };
    for (const [selector, iconName] of Object.entries(headingMap)) {
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        element.innerHTML = commandCenterIcons.icons[iconName] ?? "";
      });
    }
  }
  registerEvents();
  syncAutoHideSuspension();
  setStatus(
    UI_TUNING_KEEP_OPEN
      ? "调 UI 中：主页保持打开（Esc / 失焦不关闭）"
      : "\u53ef\u4ee5\u5f00\u59cb\u641c\u7d22"
  );
  focusInput(false);
  if (launcher?.getUiThemeConfig) {
    void launcher
      .getUiThemeConfig()
      .then((theme) => {
        applyUiThemeConfig(theme);
      })
      .catch(() => {
        applyUiThemeConfig(uiThemeConfig);
      });
  } else {
    applyUiThemeConfig(uiThemeConfig);
  }
  void refreshEntries("");
}
