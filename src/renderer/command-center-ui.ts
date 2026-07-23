type CcAction = {
  type: "plugin" | "settings" | "target";
  pluginId?: string;
  action?: string;
  focus?: "plugins" | "errors" | "updates" | "pinned";
  target?: string;
  title?: string;
};

type CcQuickEntry = {
  label: string;
  icon: string;
  action: CcAction;
  danger?: boolean;
};

let recentExpanded = true;
let settingsOverlayOpen = false;
let toastTimer: number | null = null;
let hooks: {
  onSidebarAction: (action: CcAction) => void;
  onTogglePinnedManage?: () => void;
} | null = null;

const launcherShell = document.getElementById("launcher-shell");
const searchBackdrop = document.getElementById("search-backdrop");
const recentSection = document.getElementById("cc-recent");
const recentToggle = document.getElementById("cc-recent-toggle");
const recentCount = document.getElementById("cc-recent-count");
const recentList = document.getElementById("cc-recent-list") as HTMLUListElement | null;
const pinnedCount = document.getElementById("cc-pinned-count");
const pinnedList = document.getElementById("cc-pinned-list") as HTMLUListElement | null;
const pluginCount = document.getElementById("cc-plugin-count");
const pluginList = document.getElementById("cc-plugins-list") as HTMLUListElement | null;
const pluginPagerHost = document.getElementById("cc-plugin-pager");
const pinnedPagerHost = document.getElementById("cc-pinned-actions");
const quickGrid = document.getElementById("cc-quick-grid");
const systemGrid = document.getElementById("cc-system-grid");
const footerActions = document.getElementById("cc-footer");
const commandZone = document.getElementById("cc-command");
const commandSurface = document.getElementById("command-surface");
const commandHelp = document.getElementById("command-help");
const commandResults = document.getElementById("command-results");
const commandSuggestions = document.getElementById("command-suggestions");
const panelSection = document.querySelector(".panel-section") as HTMLElement | null;
const settingsOverlayRoot = document.getElementById("settings-overlay-root");
const toastRoot = document.getElementById("toast-root");
const moreToolsButton = document.getElementById("cc-more-tools");
const managePinnedButton = document.getElementById("cc-manage-pinned");
const commandSearchIcon = document.querySelector(".command-search-icon") as HTMLElement | null;

function getConfig() {
  return window.__LL_COMMAND_CENTER_CONFIG__;
}

function getIcons() {
  return window.__LL_COMMAND_CENTER_ICONS__;
}

function renderToolGrid(
  container: HTMLElement | null,
  entries: ReadonlyArray<CcQuickEntry>,
  className: string
): void {
  if (!container) {
    return;
  }
  const icons = getIcons();
  container.replaceChildren();
  for (const entry of entries) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className + (entry.danger ? " tool-button--danger" : "");
    if (icons) {
      button.appendChild(icons.createIconElement(entry.icon));
    }
    const label = document.createElement("span");
    label.textContent = entry.label;
    button.append(label);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      hooks?.onSidebarAction(entry.action);
    });
    container.appendChild(button);
  }
}

function renderSuggestions(): void {
  if (!commandSuggestions) {
    return;
  }
  const config = getConfig();
  commandSuggestions.replaceChildren();
  const label = document.createElement("span");
  label.className = "suggestion-label";
  label.textContent = "搜索示例";
  commandSuggestions.appendChild(label);
  for (const suggestion of config?.suggestions ?? []) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = suggestion;
    button.addEventListener("click", () => {
      const input = document.getElementById("search-input") as HTMLInputElement | null;
      if (!input) {
        return;
      }
      const normalized = suggestion.replace(/^(打开|查|翻译|查询|哈希)\s*/, "");
      input.value = normalized;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    });
    commandSuggestions.appendChild(button);
  }
}

function renderFooter(): void {
  if (!footerActions) {
    return;
  }
  const config = getConfig();
  const icons = getIcons();
  footerActions.replaceChildren();
  for (const entry of config?.footerEntries ?? []) {
    const button = document.createElement("button");
    button.type = "button";
    if (icons) {
      button.appendChild(icons.createIconElement(entry.icon, true));
    }
    const label = document.createElement("span");
    label.textContent = entry.label;
    button.append(label);
    button.addEventListener("click", () =>
      hooks?.onSidebarAction(entry.action as CcAction)
    );
    footerActions.appendChild(button);
  }
}

function setRecentExpanded(next: boolean): void {
  recentExpanded = next;
  launcherShell?.classList.toggle("recent-collapsed", !next);
  recentSection?.classList.toggle("is-collapsed", !next);
  if (recentToggle) {
    recentToggle.textContent = next ? "收起" : "展开";
  }
}

function initCommandCenterUi(nextHooks: {
  onSidebarAction: (action: CcAction) => void;
  onTogglePinnedManage?: () => void;
}): void {
  hooks = nextHooks;
  const config = getConfig();
  const icons = getIcons();
  if (commandSearchIcon && icons) {
    commandSearchIcon.innerHTML = icons.icons.search ?? "";
  }
  if (managePinnedButton && icons) {
    managePinnedButton.replaceChildren();
    managePinnedButton.appendChild(icons.createIconElement("manage", true));
  }
  if (commandHelp) {
    commandHelp.replaceChildren(
      ...["↑↓ 选择", "Enter 执行", "Alt+Space 全局呼出", "Esc 关闭"].map((text) => {
        const span = document.createElement("span");
        span.textContent = text;
        return span;
      })
    );
  }
  renderToolGrid(quickGrid, config?.quickEntries ?? [], "tool-button");
  renderToolGrid(systemGrid, config?.systemEntries ?? [], "tool-button");
  renderSuggestions();
  renderFooter();
  recentToggle?.addEventListener("click", () => setRecentExpanded(!recentExpanded));
  moreToolsButton?.addEventListener("click", () => scrollToPlugins());
  managePinnedButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (hooks?.onTogglePinnedManage) {
      hooks.onTogglePinnedManage();
      return;
    }
    hooks?.onSidebarAction({ type: "settings", focus: "pinned" });
  });
  searchBackdrop?.addEventListener("mousedown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const input = document.getElementById("search-input") as HTMLInputElement | null;
    if (!input) {
      return;
    }
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  });
}

function syncHomeChromeVisibility(
  mode: "search" | "clip" | "settings" | "password" | "cashflow" | "plugin"
): void {
  const isSearchHome = mode === "search";
  document.querySelectorAll<HTMLElement>(".home-section").forEach((element) => {
    element.hidden = !isSearchHome;
  });
  if (panelSection) {
    panelSection.hidden = isSearchHome;
  }
  if (isSearchHome) {
    updateCommandCenterQueryState(
      Boolean(
        (document.getElementById("search-input") as HTMLInputElement | null)?.value.trim()
      )
    );
  }
}

function clearHomeSections(): void {
  recentList?.replaceChildren();
  pinnedList?.replaceChildren();
  pluginList?.replaceChildren();
  if (commandResults) {
    commandResults.replaceChildren();
    commandResults.hidden = true;
  }
  if (pluginPagerHost) {
    pluginPagerHost.replaceChildren();
  }
}

function updateCommandCenterQueryState(hasQuery: boolean): void {
  launcherShell?.classList.toggle("is-searching", hasQuery);
  commandZone?.classList.toggle("has-query", hasQuery);
  commandSurface?.classList.toggle("has-query", hasQuery);
  if (searchBackdrop) {
    searchBackdrop.hidden = !hasQuery;
  }
  if (commandHelp) {
    commandHelp.hidden = hasQuery;
  }
  if (commandSuggestions) {
    commandSuggestions.hidden = hasQuery;
  }
  if (commandResults) {
    commandResults.hidden = !hasQuery;
  }
}

function setCommandSearchStatus(message: string | null): void {
  if (!commandResults) {
    return;
  }

  const hasQuery = Boolean(
    (document.getElementById("search-input") as HTMLInputElement | null)?.value.trim()
  );
  updateCommandCenterQueryState(hasQuery);

  if (!hasQuery || !message) {
    if (!hasQuery && commandResults.childElementCount === 0 && commandResults.hidden) {
      return;
    }
    if (!hasQuery) {
      commandResults.replaceChildren();
      commandResults.hidden = true;
    }
    return;
  }

  commandResults.hidden = false;
  const existingText = commandResults.querySelector<HTMLElement>(
    ".command-results-status__text"
  );
  if (existingText && commandResults.querySelector(".command-results-status")) {
    existingText.textContent = message;
    return;
  }

  commandResults.replaceChildren();

  const status = document.createElement("div");
  status.className = "command-results-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const spinner = document.createElement("span");
  spinner.className = "command-results-status__spinner";
  spinner.setAttribute("aria-hidden", "true");

  const text = document.createElement("span");
  text.className = "command-results-status__text";
  text.textContent = message;

  status.append(spinner, text);
  commandResults.appendChild(status);
}

function showToast(message: string): void {
  if (!toastRoot) {
    return;
  }
  toastRoot.textContent = message;
  toastRoot.hidden = false;
  if (toastTimer !== null) {
    window.clearTimeout(toastTimer);
  }
  toastTimer = window.setTimeout(() => {
    toastRoot.hidden = true;
    toastTimer = null;
  }, 2200);
}

function getSectionGrid(sectionId: "recent" | "pinned" | "plugin"): HTMLUListElement | null {
  if (sectionId === "recent") {
    return recentList;
  }
  if (sectionId === "pinned") {
    return pinnedList;
  }
  return pluginList;
}

function updateSectionCount(
  sectionId: "recent" | "pinned" | "plugin",
  visible: number,
  total: number
): void {
  const text = `${visible}/${total}`;
  if (sectionId === "recent" && recentCount) {
    recentCount.textContent = text;
  }
  if (sectionId === "pinned" && pinnedCount) {
    pinnedCount.textContent = text;
  }
  if (sectionId === "plugin" && pluginCount) {
    pluginCount.textContent = String(total);
  }
}

function appendPluginAddChip(onClick: () => void): void {
  if (!pluginList) {
    return;
  }
  const button = document.createElement("li");
  button.className = "result-item plugin-chip plugin-chip--add";
  button.textContent = "添加插件";
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });
  pluginList.appendChild(button);
}

function scrollToPlugins(): void {
  document.getElementById("cc-plugins")?.scrollIntoView({ block: "nearest" });
  showToast("已在下方展示全部插件");
}

function openSettingsOverlay(render: (container: HTMLElement) => void): void {
  if (!settingsOverlayRoot) {
    render(document.body);
    return;
  }
  settingsOverlayOpen = true;
  settingsOverlayRoot.hidden = false;
  settingsOverlayRoot.replaceChildren();
  const overlay = document.createElement("div");
  overlay.className = "overlay cc-settings-overlay";
  overlay.addEventListener("mousedown", (event) => {
    if (event.target === overlay) {
      closeSettingsOverlay();
    }
  });
  const dialog = document.createElement("div");
  dialog.className = "cc-settings-overlay-dialog";
  overlay.appendChild(dialog);
  settingsOverlayRoot.appendChild(overlay);
  render(dialog);
}

function closeSettingsOverlay(): void {
  settingsOverlayOpen = false;
  if (settingsOverlayRoot) {
    settingsOverlayRoot.hidden = true;
    settingsOverlayRoot.replaceChildren();
  }
}

function isSettingsOverlayOpen(): boolean {
  return settingsOverlayOpen;
}

function getPinnedActionsHost(): HTMLElement | null {
  return pinnedPagerHost;
}

function getPluginPagerHost(): HTMLElement | null {
  return pluginPagerHost;
}

function getCommandResultsHost(): HTMLElement | null {
  return commandResults;
}

window.__LL_COMMAND_CENTER_UI__ = {
  initCommandCenterUi,
  syncHomeChromeVisibility,
  clearHomeSections,
  updateCommandCenterQueryState,
  setCommandSearchStatus,
  showToast,
  getSectionGrid,
  updateSectionCount,
  appendPluginAddChip,
  scrollToPlugins,
  openSettingsOverlay,
  closeSettingsOverlay,
  isSettingsOverlayOpen,
  getPinnedActionsHost,
  getPluginPagerHost,
  getCommandResultsHost
};
