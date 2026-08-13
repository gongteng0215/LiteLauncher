function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeLaunchType(type: LaunchItem["type"]): string {
  if (type === "application") {
    return "App";
  }
  if (type === "folder") {
    return "Folder";
  }
  if (type === "file") {
    return "File";
  }
  if (type === "web") {
    return "Web";
  }
  return "Command";
}

function fallbackIconLabel(entry: ResultEntry): string {
  if (entry.kind === "clip") {
    return "CL";
  }

  if (entry.item.type === "application") {
    return "AP";
  }
  if (entry.item.type === "folder") {
    return "FD";
  }
  if (entry.item.type === "file") {
    return "FL";
  }
  if (entry.item.type === "web") {
    return "WB";
  }
  return "CM";
}

function createResultIcon(entry: ResultEntry): HTMLDivElement {
  const icon = document.createElement("div");
  icon.className = "result-icon";

  const fallback = () => {
    icon.replaceChildren();
    icon.classList.add("fallback");
    icon.textContent = fallbackIconLabel(entry);
  };

  if (entry.kind !== "launch" || !entry.item.iconPath) {
    fallback();
    return icon;
  }

  const iconPath = entry.item.iconPath.trim();
  if (!iconPath.startsWith("data:image/")) {
    fallback();
    return icon;
  }

  const image = document.createElement("img");
  image.className = "result-icon-image";
  image.addEventListener("error", fallback, { once: true });
  image.src = iconPath;
  image.alt = "";
  icon.appendChild(image);
  return icon;
}

async function ensurePluginCatalogLoaded(): Promise<void> {
  if (allPluginCatalogItems.length > 0) {
    return;
  }

  const launcher = getLauncherApi();
  if (!launcher) {
    return;
  }

  try {
    const items = await launcher.getAllPluginItems();
    allPluginCatalogItems = Array.isArray(items) ? items : [];
  } catch {
    allPluginCatalogItems = [];
  }
}

function resolvePluginLaunchItem(pluginId: string, actionName?: string): LaunchItem | null {
  const normalized = pluginId.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const catalogMatches = allPluginCatalogItems.filter(
    (item) => pluginIdFromCatalogItem(item) === normalized
  );
  const defaultItem =
    catalogMatches.find((item) => {
      const target = item.target.trim().toLowerCase();
      return (
        target === `command:plugin:${normalized}` ||
        target.startsWith(`command:plugin:${normalized}?`)
      );
    }) ??
    catalogMatches[0] ??
    null;

  if (actionName) {
    const encodedAction = encodeURIComponent(actionName);
    const actionItem =
      catalogMatches.find((item) =>
        item.target.toLowerCase().includes(`action=${encodedAction.toLowerCase()}`)
      ) ??
      catalogMatches.find((item) =>
        item.target.toLowerCase().includes(`action=${actionName.toLowerCase()}`)
      );
    if (actionItem) {
      return actionItem;
    }

    return {
      id: `plugin:${normalized}:${actionName}`,
      type: "command",
      title: defaultItem?.title ?? normalized,
      subtitle: actionName,
      target: `command:plugin:${normalized}?action=${encodeURIComponent(actionName)}`,
      keywords: ["plugin", normalized, actionName]
    };
  }

  if (defaultItem) {
    return defaultItem;
  }

  return {
    id: `plugin:${normalized}`,
    type: "command",
    title: normalized,
    subtitle: "打开插件",
    target: `command:plugin:${normalized}`,
    keywords: ["plugin", normalized]
  };
}

async function handleSidebarAction(action: {
  type: "plugin" | "settings" | "target";
  pluginId?: string;
  action?: string;
  focus?: "plugins" | "errors" | "updates" | "pinned";
  target?: string;
  title?: string;
}): Promise<void> {
  if (action.type === "settings") {
    settingsFocusHint = action.focus;
    openSettingsPanel();
    return;
  }

  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行");
    return;
  }

  if (action.type === "target") {
    const target = action.target?.trim() ?? "";
    if (!target) {
      return;
    }
    const commandItem: LaunchItem = {
      id: `sidebar:${target}`,
      type: "command",
      title: action.title ?? target,
      subtitle: target,
      target,
      keywords: ["sidebar"]
    };
    const result = await launcher.execute(commandItem);
    if (result.ok) {
      commandCenterUi.showToast(`已打开：${commandItem.title}`);
    } else {
      setStatus(result.message ?? "执行失败");
    }
    return;
  }

  const pluginId = action.pluginId?.trim() ?? "";
  if (!pluginId) {
    return;
  }

  await ensurePluginCatalogLoaded();
  const item = resolvePluginLaunchItem(pluginId, action.action);
  if (!item) {
    commandCenterUi.showToast(`未找到插件：${pluginId}`);
    return;
  }

  const result = await launcher.execute(item);
  if (!result.ok) {
    setStatus(result.message ?? "执行失败");
    return;
  }
  commandCenterUi.showToast(`已打开：${item.title}`);
}

function wrapResultIcon(entry: ResultEntry, _pluginId?: string): HTMLElement {
  const badge = document.createElement("span");
  badge.className = "icon-badge";
  const icon = createResultIcon(entry);
  icon.classList.remove("result-icon");
  badge.appendChild(icon);
  return badge;
}

function clearList(): void {
  if (mode === "search") {
    if (!currentQuery.trim()) {
      commandCenterUi.clearHomeSections();
    } else {
      commandCenterUi.getCommandResultsHost()?.replaceChildren();
    }
    return;
  }

  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }
  list.classList.remove("search-sections");
}

function clipTitle(content: string): string {
  const firstLine = content.split(/\r?\n/, 1)[0] ?? "";
  if (firstLine.length <= 72) {
    return firstLine;
  }
  return `${firstLine.slice(0, 72)}...`;
}

function clipSubtitle(createdAt: number): string {
  const date = new Date(createdAt);
  return `\u590d\u5236\u65f6\u95f4\uff1a${date.toLocaleString()}`;
}

function resetSearchSections(): void {
  entries = [];
  searchSections = [];
}

function getSearchResultSection(): SearchSection | null {
  for (const section of searchSections) {
    if (section.id === "search") {
      return section;
    }
  }
  return null;
}

function isStandaloneToolbarCommand(item: LaunchItem): boolean {
  return item.target.trim().toLowerCase() === "command:settings";
}

function isPanelOpeningLaunchItem(item: LaunchItem): boolean {
  const target = item.target.trim().toLowerCase();
  return item.id.startsWith("plugin:") || target.startsWith("command:plugin:");
}

function getAdaptiveSectionDisplayLimit(items: LaunchItem[]): number {
  return items.length;
}

/** Home "最近访问" stays at most 2 rows so the panels below are not crushed. */
const RECENT_HOME_MAX_ROWS = 2;

const RECENT_GRID_MIN_TILE_WIDTH = 58;

const RECENT_GRID_COLUMN_GAP = 7;

function getRecentHomeDisplayLimit(itemCount: number): number {
  if (itemCount <= 0) {
    return 0;
  }

  const grid = commandCenterUi.getSectionGrid("recent");
  const width =
    grid?.clientWidth ||
    grid?.getBoundingClientRect().width ||
    Math.max(320, Math.floor(window.innerWidth * 0.72));
  const columns = Math.max(
    1,
    Math.floor(
      (width + RECENT_GRID_COLUMN_GAP) /
        (RECENT_GRID_MIN_TILE_WIDTH + RECENT_GRID_COLUMN_GAP)
    )
  );
  return Math.min(itemCount, columns * RECENT_HOME_MAX_ROWS);
}

function addSearchSection(
  id: SectionId,
  title: string,
  items: LaunchItem[],
  displayLimit: number,
  emptyText: string,
  options?: {
    totalCount?: number;
    page?: number;
    pageCount?: number;
  }
): void {
  const indexes: number[] = [];
  const filteredItems =
    id === "search" ? items : items.filter((item) => !isStandaloneToolbarCommand(item));
  const limited = filteredItems.slice(0, displayLimit);

  for (const item of limited) {
    indexes.push(entries.length);
    entries.push({ kind: "launch", item });
  }

  const totalCount = Math.max(
    0,
    Math.round(options?.totalCount ?? filteredItems.length)
  );
  const pageCountRaw =
    options?.pageCount ?? Math.ceil(Math.max(1, totalCount) / Math.max(1, displayLimit));
  const pageCount = Math.max(1, Math.round(pageCountRaw));
  const page = Math.min(
    Math.max(0, Math.round(options?.page ?? 0)),
    pageCount - 1
  );

  searchSections.push({
    id,
    title,
    displayLimit,
    indexes,
    emptyText,
    totalCount,
    page,
    pageCount
  });
}

function mergeUniqueLaunchItems(primary: LaunchItem[], fallback: LaunchItem[]): LaunchItem[] {
  if (fallback.length === 0) {
    return primary;
  }

  const result = [...primary];
  const indexesByKey = new Map<string, number>();
  const getMergeKey = (item: LaunchItem): string => {
    const normalizedTarget = item.target.trim().toLowerCase();
    if (normalizedTarget) {
      return `target:${normalizedTarget}`;
    }
    return `id:${item.id.toLowerCase()}`;
  };
  const getScore = (item: LaunchItem): number => {
    let score = 0;
    if (item.type === "application") {
      score += 20;
    }
    if (item.iconPath?.startsWith("data:image/")) {
      score += 50;
    } else if (item.iconPath?.trim()) {
      score += 25;
    }
    if (item.subtitle?.trim()) {
      score += 10;
    }
    if (
      item.id.startsWith("command:apps-folder:") ||
      item.id.startsWith("app:startapp:")
    ) {
      score += 10;
    }
    return score;
  };

  for (let index = 0; index < result.length; index += 1) {
    indexesByKey.set(getMergeKey(result[index]), index);
  }

  for (const item of fallback) {
    const key = getMergeKey(item);
    const existingIndex = indexesByKey.get(key);
    if (existingIndex !== undefined) {
      const existing = result[existingIndex];
      if (getScore(item) > getScore(existing)) {
        result[existingIndex] = item;
      }
      continue;
    }
    indexesByKey.set(key, result.length);
    result.push(item);
  }
  return result;
}

function updatePinnedState(itemId: string, pinned: boolean): void {
  for (const entry of entries) {
    if (entry.kind !== "launch") {
      continue;
    }

    if (entry.item.id === itemId) {
      entry.item.pinned = pinned;
    }
  }
}

function findLaunchEntryIndexInCurrentEntries(itemId: string): number {
  const normalizedId = String(itemId ?? "").trim();
  if (!normalizedId) {
    return -1;
  }

  return entries.findIndex(
    (entry) => entry.kind === "launch" && entry.item.id === normalizedId
  );
}

function isLaunchEntryPinned(index: number, item: LaunchItem): boolean {
  if (item.pinned) {
    return true;
  }

  // Defensive: items listed under the pinned section are pinned even if a stale
  // icon-cache payload lost the `pinned` flag.
  const pinnedSection = searchSections.find((section) => section.id === "pinned");
  return Boolean(pinnedSection?.indexes.includes(index));
}

function getPathBaseName(filePath: string): string {
  const normalized = filePath.replace(/[\\/]+$/, "");
  const parts = normalized.split(/[\\/]/);
  return parts[parts.length - 1] || filePath;
}

async function addCustomPinnedFromPicker(kind: "file" | "folder"): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法添加置顶");
    return;
  }

  beginPluginNativeInteraction(20000);
  try {
    const selected =
      kind === "file" ? await launcher.pickFilePath() : await launcher.pickDirectoryPath();
    if (!selected) {
      return;
    }

    // Invalidate home cache first — otherwise refreshEntries("") restores the
    // pre-add pinned tiles and looks like the pin never landed.
    markHomeSectionsDirty();
    const result = await launcher.addCustomPinnedPath(selected);
    const title = getPathBaseName(selected);
    if (!result.ok) {
      setStatus(formatPinnedToggleStatus(title, result));
      commandCenterUi.showToast(formatPinnedToggleStatus(title, result));
      return;
    }

    markHomeSectionsDirty();
    setStatus(`已添加置顶：${title}`);
    commandCenterUi.showToast(`已添加置顶：${title}`);
    await refreshEntries(currentQuery);
  } finally {
    schedulePluginNativeInteractionRelease(260);
  }
}

async function removeCustomPinnedItem(item: LaunchItem): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法取消置顶");
    return;
  }

  const result = await launcher.setItemPinned(item.id, false, item);
  if (!result.ok) {
    setStatus(formatPinnedToggleStatus(item.title, result));
    return;
  }

  setStatus(`已取消置顶：${item.title}`);
  markHomeSectionsDirty();
  await refreshEntries(currentQuery);
}

function syncPinnedManageButton(): void {
  const pinnedSection = document.getElementById("cc-pinned");
  pinnedSection?.classList.toggle("is-managing", pinnedManageMode);
  const manageButton = document.getElementById("cc-manage-pinned");
  if (!manageButton) {
    return;
  }
  manageButton.classList.toggle("is-active", pinnedManageMode);
  manageButton.title = pinnedManageMode ? "完成管理" : "管理置顶";
  manageButton.setAttribute("aria-label", manageButton.title);
  manageButton.setAttribute("aria-pressed", pinnedManageMode ? "true" : "false");
}

function setPinnedManageMode(next: boolean): void {
  if (pinnedManageMode === next) {
    syncPinnedManageButton();
    renderPinnedSectionActions();
    return;
  }
  pinnedManageMode = next;
  if (!pinnedManageMode) {
    pinnedManageSelectedIds.clear();
  }
  syncPinnedManageButton();
  renderPinnedSectionActions();
  if (mode === "search" && !currentQuery.trim()) {
    renderList();
  }
}

function togglePinnedManageMode(): void {
  if (currentQuery.trim()) {
    commandCenterUi.showToast("请先清空搜索再管理置顶");
    return;
  }
  setPinnedManageMode(!pinnedManageMode);
}

function getPinnedSectionEntries(): Array<{ index: number; item: LaunchItem }> {
  const section = searchSections.find((item) => item.id === "pinned");
  if (!section) {
    return [];
  }
  const result: Array<{ index: number; item: LaunchItem }> = [];
  for (const index of section.indexes) {
    const entry = entries[index];
    if (entry?.kind === "launch") {
      result.push({ index, item: entry.item });
    }
  }
  return result;
}

function togglePinnedManageSelection(itemId: string): void {
  if (pinnedManageSelectedIds.has(itemId)) {
    pinnedManageSelectedIds.delete(itemId);
  } else {
    pinnedManageSelectedIds.add(itemId);
  }
  renderPinnedSectionActions();
  document
    .querySelectorAll<HTMLElement>("#cc-pinned-list .pinned-chip[data-item-id]")
    .forEach((tile) => {
      const id = tile.dataset.itemId ?? "";
      tile.classList.toggle("is-manage-selected", pinnedManageSelectedIds.has(id));
    });
}

function selectAllPinnedForManage(): void {
  for (const entry of getPinnedSectionEntries()) {
    pinnedManageSelectedIds.add(entry.item.id);
  }
  renderPinnedSectionActions();
  document
    .querySelectorAll<HTMLElement>("#cc-pinned-list .pinned-chip[data-item-id]")
    .forEach((tile) => {
      tile.classList.add("is-manage-selected");
    });
}

function clearPinnedManageSelection(): void {
  pinnedManageSelectedIds.clear();
  renderPinnedSectionActions();
  document
    .querySelectorAll<HTMLElement>("#cc-pinned-list .pinned-chip.is-manage-selected")
    .forEach((tile) => tile.classList.remove("is-manage-selected"));
}

async function unpinSelectedPinnedItems(): Promise<void> {
  if (pinnedManageSelectedIds.size === 0) {
    commandCenterUi.showToast("请先选择要取消置顶的项");
    return;
  }

  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法取消置顶");
    return;
  }

  const selected = getPinnedSectionEntries().filter((entry) =>
    pinnedManageSelectedIds.has(entry.item.id)
  );
  let successCount = 0;
  for (const entry of selected) {
    const result = await launcher.setItemPinned(entry.item.id, false, entry.item);
    if (result.ok) {
      successCount += 1;
    }
  }

  pinnedManageSelectedIds.clear();
  setPinnedManageMode(false);
  setStatus(`已取消置顶 ${successCount} 项`);
  commandCenterUi.showToast(`已取消置顶 ${successCount} 项`);
  markHomeSectionsDirty();
  await refreshEntries("");
}

function createPinnedIconActionButton(
  iconName: string,
  label: string,
  onClick: () => void,
  options?: { danger?: boolean; active?: boolean }
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "icon-action-btn";
  if (options?.danger) {
    button.classList.add("icon-action-btn--danger");
  }
  if (options?.active) {
    button.classList.add("is-active");
  }
  button.title = label;
  button.setAttribute("aria-label", label);
  if (commandCenterIcons) {
    button.appendChild(commandCenterIcons.createIconElement(iconName, true));
  } else {
    button.textContent = label;
  }
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });
  return button;
}

function createCustomPinnedSettingsList(container: HTMLElement): void {
  container.replaceChildren();

  const launcher = getLauncherApi();
  if (!launcher) {
    const hint = document.createElement("p");
    hint.className = "settings-row-hint";
    hint.textContent = "桥接层未加载，无法读取自定义置顶。";
    container.appendChild(hint);
    return;
  }

  void launcher.getPinnedItems().then((items) => {
    const customItems = items.filter((item) => item.id.startsWith("pin:custom:"));
    container.replaceChildren();

    if (customItems.length === 0) {
      const hint = document.createElement("p");
      hint.className = "settings-row-hint";
      hint.textContent = "暂无自定义置顶。可添加不在扫描目录内的程序、文件或文件夹。";
      container.appendChild(hint);
      return;
    }

    const list = document.createElement("div");
    list.className = "custom-pinned-list";

    for (const item of customItems) {
      const row = document.createElement("div");
      row.className = "custom-pinned-item";

      const meta = document.createElement("div");
      meta.className = "custom-pinned-meta";

      const title = document.createElement("div");
      title.className = "custom-pinned-title";
      title.textContent = item.title;

      const subtitle = document.createElement("div");
      subtitle.className = "custom-pinned-subtitle";
      subtitle.textContent = item.subtitle;

      meta.append(title, subtitle);

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "settings-btn settings-btn-secondary";
      removeButton.textContent = "移除";
      removeButton.addEventListener("click", () => {
        void removeCustomPinnedItem(item).then(() => {
          createCustomPinnedSettingsList(container);
        });
      });

      row.append(meta, removeButton);
      list.appendChild(row);
    }

    container.appendChild(list);
  });
}

async function togglePinned(index: number, expectedItemId?: string): Promise<void> {
  if (mode !== "search") {
    return;
  }

  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u7f6e\u9876");
    return;
  }

  const selected = entries[index];
  if (!selected || selected.kind !== "launch") {
    if (expectedItemId) {
      const relocatedIndex = findLaunchEntryIndexInCurrentEntries(expectedItemId);
      if (relocatedIndex >= 0 && relocatedIndex !== index) {
        await togglePinned(relocatedIndex, expectedItemId);
        return;
      }
    }
    setStatus("置顶失败：当前结果已过期，请重新搜索");
    return;
  }

  const item = selected.item;
  if (expectedItemId && item.id !== expectedItemId) {
    const relocatedIndex = findLaunchEntryIndexInCurrentEntries(expectedItemId);
    if (relocatedIndex >= 0 && relocatedIndex !== index) {
      await togglePinned(relocatedIndex, expectedItemId);
      return;
    }
    setStatus("置顶失败：当前结果已过期，请重新搜索");
    return;
  }
  const nextPinned = !isLaunchEntryPinned(index, item);
  const pinResult = await launcher.setItemPinned(item.id, nextPinned, item);
  if (!pinResult.ok) {
    setStatus(formatPinnedToggleStatus(item.title, pinResult));
    return;
  }

  updatePinnedState(item.id, pinResult.pinned);
  setStatus(formatPinnedToggleStatus(item.title, pinResult));
  markHomeSectionsDirty();
  await refreshEntries(currentQuery);
}

function isAdminRunnableItem(item: LaunchItem): boolean {
  return item.type === "application" || item.type === "file";
}

function isRevealableItem(item: LaunchItem): boolean {
  return (
    item.type === "application" ||
    item.type === "file" ||
    item.type === "folder"
  );
}

function closeSearchContextMenu(): void {
  if (!activeSearchContextMenu) {
    return;
  }

  activeSearchContextMenu.remove();
  activeSearchContextMenu = null;
}

async function runAsAdmin(index: number): Promise<void> {
  if (mode !== "search") {
    return;
  }

  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法管理员运行");
    return;
  }

  const selected = entries[index];
  if (!selected || selected.kind !== "launch") {
    return;
  }

  const item = selected.item;
  if (!isAdminRunnableItem(item)) {
    setStatus(`不支持管理员运行：${item.title}`);
    return;
  }

  const commandItem: LaunchItem = {
    id: `command:runas:${item.id}`,
    type: "command",
    title: item.title,
    subtitle: `管理员运行：${item.subtitle}`,
    target: `command:runas:${encodeURIComponent(item.target)}`,
    keywords: ["runas", "admin"]
  };

  const result = await launcher.execute(commandItem);
  if (!result.ok) {
    setStatus(result.message ?? `管理员运行失败：${item.title}`);
    return;
  }

  setStatus(result.message ?? `已请求管理员运行：${item.title}`);
}

async function revealItemLocation(index: number): Promise<void> {
  if (mode !== "search") {
    return;
  }

  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法打开所在位置");
    return;
  }

  const selected = entries[index];
  if (!selected || selected.kind !== "launch") {
    return;
  }

  const item = selected.item;
  if (!isRevealableItem(item)) {
    setStatus(`不支持打开所在位置：${item.title}`);
    return;
  }

  const commandItem: LaunchItem = {
    id: `command:reveal:${item.id}`,
    type: "command",
    title: item.title,
    subtitle: `打开所在位置：${item.subtitle}`,
    target: `command:reveal:${encodeURIComponent(item.target)}`,
    keywords: ["reveal", "location", "folder"]
  };

  const result = await launcher.execute(commandItem);
  if (!result.ok) {
    setStatus(result.message ?? `打开所在位置失败：${item.title}`);
    return;
  }

  setStatus(result.message ?? `已打开所在位置：${item.title}`);
}

function openSearchContextMenu(
  event: MouseEvent,
  index: number,
  entry: ResultEntry
): void {
  if (entry.kind !== "launch") {
    return;
  }

  closeSearchContextMenu();

  const menu = document.createElement("div");
  menu.className = "search-context-menu";
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  menu.addEventListener("mousedown", (menuEvent) => {
    menuEvent.stopPropagation();
  });
  menu.addEventListener("click", (menuEvent) => {
    menuEvent.stopPropagation();
  });

  const pinButton = document.createElement("button");
  pinButton.type = "button";
  pinButton.className = "search-context-menu-item";
  pinButton.textContent = isLaunchEntryPinned(index, entry.item) ? "取消置顶" : "置顶";
  pinButton.addEventListener("click", () => {
    closeSearchContextMenu();
    void togglePinned(index, entry.item.id);
  });
  menu.appendChild(pinButton);

  if (isRevealableItem(entry.item)) {
    const revealButton = document.createElement("button");
    revealButton.type = "button";
    revealButton.className = "search-context-menu-item";
    revealButton.textContent = "打开所在位置";
    revealButton.addEventListener("click", () => {
      closeSearchContextMenu();
      void revealItemLocation(index);
    });
    menu.appendChild(revealButton);
  }

  if (isAdminRunnableItem(entry.item)) {
    const adminButton = document.createElement("button");
    adminButton.type = "button";
    adminButton.className = "search-context-menu-item";
    adminButton.textContent = "管理员运行";
    adminButton.addEventListener("click", () => {
      closeSearchContextMenu();
      void runAsAdmin(index);
    });
    menu.appendChild(adminButton);
  }

  document.body.appendChild(menu);
  activeSearchContextMenu = menu;

  const bounds = menu.getBoundingClientRect();
  let left = bounds.left;
  let top = bounds.top;
  if (bounds.right > window.innerWidth - 8) {
    left = Math.max(8, window.innerWidth - bounds.width - 8);
  }
  if (bounds.bottom > window.innerHeight - 8) {
    top = Math.max(8, window.innerHeight - bounds.height - 8);
  }
  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(top)}px`;
}

function bindResultInteractions(
  element: HTMLElement,
  index: number,
  entry: ResultEntry
): void {
  element.addEventListener("mouseenter", () => {
    if (pinnedManageMode) {
      return;
    }
    const previousIndex = selectedIndex;
    selectedIndex = index;
    if (canUpdateSelectionHighlightInPlace()) {
      updateSelectionHighlight(previousIndex, selectedIndex);
    }
  });

  element.addEventListener("click", (event) => {
    event.stopPropagation();
    if (
      pinnedManageMode &&
      entry.kind === "launch" &&
      element.classList.contains("pinned-chip")
    ) {
      event.preventDefault();
      togglePinnedManageSelection(entry.item.id);
      return;
    }
    const previousIndex = selectedIndex;
    selectedIndex = index;
    if (canUpdateSelectionHighlightInPlace()) {
      updateSelectionHighlight(previousIndex, selectedIndex);
    }
    void executeSelected(index);
  });

  element.addEventListener("contextmenu", (event) => {
    if (mode !== "search" || entry.kind !== "launch") {
      return;
    }
    if (pinnedManageMode) {
      event.preventDefault();
      event.stopPropagation();
      togglePinnedManageSelection(entry.item.id);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const previousIndex = selectedIndex;
    selectedIndex = index;
    // Avoid full renderList() here: it closes the menu and can race with
    // opening a fresh one while selection chips/highlight update in place.
    if (canUpdateSelectionHighlightInPlace()) {
      updateSelectionHighlight(previousIndex, selectedIndex);
    } else {
      renderList();
    }
    openSearchContextMenu(event, index, entry);
  });
}

function changeSearchResultPage(delta: number): void {
  if (mode !== "search") {
    return;
  }

  if (!currentQuery.trim()) {
    return;
  }

  const section = getSearchResultSection();
  if (!section || section.pageCount <= 1) {
    return;
  }

  const nextPage = Math.min(
    Math.max(0, searchResultPage + delta),
    section.pageCount - 1
  );
  if (nextPage === searchResultPage) {
    return;
  }

  searchResultPage = nextPage;
  if (cachedSearchLaunchItems.length > 0 && pagedSearchQueryKey) {
    applyCachedSearchPage();
    return;
  }
  void refreshEntries(currentQuery);
}

function applyCachedSearchPage(): void {
  const parsedQuery = parseSearchQuery(currentQuery);
  const pageSize = Math.max(1, searchDisplayConfig.searchLimit);
  const totalSearchCount = cachedSearchLaunchItems.length;
  const searchPageCount = Math.max(
    1,
    Math.ceil(Math.max(1, totalSearchCount) / pageSize)
  );
  if (searchResultPage >= searchPageCount) {
    searchResultPage = searchPageCount - 1;
  }
  const searchStart = searchResultPage * pageSize;
  const pagedSearchItems = cachedSearchLaunchItems.slice(
    searchStart,
    searchStart + pageSize
  );

  resetSearchSections();
  addSearchSection(
    "search",
    parsedQuery.explicitScope ? `${parsedQuery.scopeLabel}结果` : "搜索结果",
    pagedSearchItems,
    pageSize,
    parsedQuery.explicitScope
      ? `没有匹配的${parsedQuery.scopeLabel}结果`
      : "没有匹配结果",
    {
      totalCount: totalSearchCount,
      page: searchResultPage,
      pageCount: searchPageCount
    }
  );
  selectedIndex = entries.length ? 0 : 0;
  renderList();
  const shownStart = totalSearchCount === 0 ? 0 : searchStart + 1;
  const shownEnd =
    totalSearchCount === 0 ? 0 : searchStart + pagedSearchItems.length;
  const fetchLimit = Math.min(
    SEARCH_PAGE_FETCH_MAX,
    Math.max(pageSize, pageSize * SEARCH_PAGE_FETCH_MULTIPLIER)
  );
  const totalSearchText =
    totalSearchCount >= fetchLimit ? `${totalSearchCount}+` : `${totalSearchCount}`;
  if (parsedQuery.explicitScope) {
    setStatus(
      `${parsedQuery.scopeLabel}搜索 ${shownStart}-${shownEnd}/${totalSearchText}`
    );
  } else {
    setStatus(`搜索 ${shownStart}-${shownEnd}/${totalSearchText}`);
  }
}

function changePluginResultPage(delta: number): void {
  if (mode !== "search") {
    return;
  }

  const section = searchSections.find((item) => item.id === "plugin");
  if (!section || section.pageCount <= 1) {
    return;
  }

  const nextPage = Math.min(
    Math.max(0, pluginResultPage + delta),
    section.pageCount - 1
  );
  if (nextPage === pluginResultPage) {
    return;
  }

  pluginResultPage = nextPage;
  void refreshEntries(currentQuery);
}

function createSearchTile(
  entry: ResultEntry,
  index: number,
  sectionId: SectionId
): HTMLLIElement {
  const tile = document.createElement("li");
  tile.className = "result-item result-tile";
  if (sectionId === "recent") {
    tile.classList.add("recent-tile");
  } else if (sectionId === "pinned") {
    tile.classList.add("pinned-chip");
  } else if (sectionId === "plugin") {
    tile.classList.add("plugin-chip");
  }
  if (index === selectedIndex) {
    tile.classList.add("active");
  }
  if (entry.kind === "launch" && entry.item.pinned) {
    tile.classList.add("is-pinned");
  }
  tile.dataset.index = String(index);

  const pluginId =
    entry.kind === "launch" ? pluginIdFromCatalogItem(entry.item) : undefined;
  const icon = wrapResultIcon(entry, pluginId);
  const title = document.createElement("span");
  title.className = "tile-title";
  title.textContent =
    entry.kind === "launch" ? entry.item.title : clipTitle(entry.item.content);

  tile.title = title.textContent;
  if (entry.kind === "launch") {
    tile.dataset.itemId = entry.item.id;
  }
  tile.append(icon, title);

  if (sectionId === "pinned" && pinnedManageMode && entry.kind === "launch") {
    tile.classList.add("is-manageable");
    if (pinnedManageSelectedIds.has(entry.item.id)) {
      tile.classList.add("is-manage-selected");
    }
    const mark = document.createElement("span");
    mark.className = "pinned-manage-check";
    mark.setAttribute("aria-hidden", "true");
    if (commandCenterIcons) {
      mark.appendChild(commandCenterIcons.createIconElement("check", true));
    }
    tile.appendChild(mark);
  }

  if (entry.kind === "launch" && entry.item.pinned && sectionId !== "pinned") {
    const pinBadge = document.createElement("span");
    pinBadge.className = "tile-pin";
    pinBadge.title = "置顶";
    pinBadge.setAttribute("aria-label", "置顶");
    tile.appendChild(pinBadge);
  }

  bindResultInteractions(tile, index, entry);
  return tile;
}

function getAdaptiveSectionGridColumns(itemCount: number, availableWidth: number): number {
  if (itemCount <= 0 || availableWidth <= 0) {
    return 1;
  }

  const maxColumns = Math.max(
    1,
    Math.floor(
      (availableWidth + SECTION_GRID_GAP) / (SECTION_GRID_TILE_WIDTH + SECTION_GRID_GAP)
    )
  );

  return maxColumns;
}

function applyAdaptiveSectionGridColumns(grid: HTMLUListElement): void {
  const itemCount = grid.children.length;
  const width = grid.clientWidth || grid.getBoundingClientRect().width;
  const columns = getAdaptiveSectionGridColumns(itemCount, width);
  grid.style.setProperty("--section-grid-columns", String(columns));
}

function refreshAdaptiveSectionGrids(): void {
  document
    .querySelectorAll<HTMLUListElement>(".result-list .section-grid")
    .forEach((grid) => applyAdaptiveSectionGridColumns(grid));
}

function scheduleAdaptiveSectionGridRefresh(): void {
  if (sectionGridResizeFrame !== null) {
    window.cancelAnimationFrame(sectionGridResizeFrame);
  }

  sectionGridResizeFrame = window.requestAnimationFrame(() => {
    sectionGridResizeFrame = null;
    refreshAdaptiveSectionGrids();
  });
}

function renderPinnedSectionActions(): void {
  const host = commandCenterUi.getPinnedActionsHost();
  if (!host) {
    return;
  }
  if (currentQuery.trim().length > 0) {
    // Keep home chrome intact behind the search overlay.
    return;
  }

  host.replaceChildren();

  if (pinnedManageMode) {
    const selectedCount = pinnedManageSelectedIds.size;
    const countLabel = document.createElement("span");
    countLabel.className = "pinned-manage-count";
    countLabel.textContent = `已选 ${selectedCount}`;
    host.append(
      countLabel,
      createPinnedIconActionButton("check", "全选", () => selectAllPinnedForManage()),
      createPinnedIconActionButton("close", "清空选择", () => clearPinnedManageSelection()),
      createPinnedIconActionButton(
        "trash",
        selectedCount > 0 ? `取消置顶(${selectedCount})` : "取消置顶",
        () => {
          void unpinSelectedPinnedItems();
        },
        { danger: true }
      ),
      createPinnedIconActionButton("close", "完成", () => setPinnedManageMode(false), {
        active: true
      })
    );
    return;
  }

  host.append(
    createPinnedIconActionButton("file", "添加文件", () => {
      void addCustomPinnedFromPicker("file");
    }),
    createPinnedIconActionButton("folder", "添加文件夹", () => {
      void addCustomPinnedFromPicker("folder");
    })
  );
}

function renderSectionPager(section: SearchSection): void {
  const host =
    section.id === "plugin"
      ? commandCenterUi.getPluginPagerHost()
      : commandCenterUi.getCommandResultsHost();
  if (!host || section.pageCount <= 1) {
    if (section.id === "plugin") {
      commandCenterUi.getPluginPagerHost()?.replaceChildren();
    }
    return;
  }

  const pagerHost = commandCenterUi.getPluginPagerHost();
  if (!pagerHost) {
    return;
  }

  pagerHost.replaceChildren();
  const pager = document.createElement("div");
  pager.className = "section-pager";

  const prevButton = document.createElement("button");
  prevButton.type = "button";
  prevButton.className = "section-page-btn";
  prevButton.textContent = "上一页";
  prevButton.disabled = section.page <= 0;
  prevButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (section.id === "search") {
      changeSearchResultPage(-1);
      return;
    }
    changePluginResultPage(-1);
  });

  const pageInfo = document.createElement("span");
  pageInfo.className = "section-page-info";
  pageInfo.textContent = `${section.page + 1}/${section.pageCount}`;

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "section-page-btn";
  nextButton.textContent = "下一页";
  nextButton.disabled = section.page >= section.pageCount - 1;
  nextButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (section.id === "search") {
      changeSearchResultPage(1);
      return;
    }
    changePluginResultPage(1);
  });

  pager.append(prevButton, pageInfo, nextButton);
  pagerHost.appendChild(pager);
}

function renderCommandResults(section: SearchSection): void {
  const host = commandCenterUi.getCommandResultsHost();
  if (!host) {
    return;
  }

  host.replaceChildren();
  host.hidden = false;

  const summary = document.createElement("div");
  summary.className = "result-summary";
  summary.innerHTML = `<span>搜索结果</span><span>${section.totalCount}</span>`;
  host.appendChild(summary);

  if (section.indexes.length === 0) {
    const empty = document.createElement("div");
    empty.className = "no-results";
    empty.textContent = "没有找到匹配项，试试 app:、cmd:、web: 或 plugin:";
    host.appendChild(empty);
    return;
  }

  for (const index of section.indexes) {
    const entry = entries[index];
    if (!entry) {
      continue;
    }

    const row = document.createElement("button");
    row.type = "button";
    row.className = "command-result";
    if (index === selectedIndex) {
      row.classList.add("active");
    }
    row.dataset.index = String(index);

    const pluginId =
      entry.kind === "launch" ? pluginIdFromCatalogItem(entry.item) : undefined;
    row.appendChild(wrapResultIcon(entry, pluginId));

    const title = document.createElement("span");
    title.className = "command-result__title";
    title.textContent =
      entry.kind === "launch" ? entry.item.title : clipTitle(entry.item.content);

    const kind = document.createElement("span");
    kind.className = "command-result__kind";
    kind.textContent =
      entry.kind === "launch" ? normalizeLaunchType(entry.item.type) : "Clip";

    row.append(title, kind);
    if (commandCenterIcons) {
      const openIcon = commandCenterIcons.createIconElement("open", true);
      row.appendChild(openIcon);
    }

    bindResultInteractions(row, index, entry);
    host.appendChild(row);
  }
}

function renderSearchSections(): void {
  const hasQuery = currentQuery.trim().length > 0;
  commandCenterUi.updateCommandCenterQueryState(hasQuery);
  renderPinnedSectionActions();

  for (const section of searchSections) {
    if (section.id === "search") {
      if (hasQuery) {
        renderCommandResults(section);
      }
      continue;
    }

    if (hasQuery) {
      // Preserve recent / pinned / plugins behind the blurred overlay.
      continue;
    }

    const grid = commandCenterUi.getSectionGrid(section.id);
    if (!grid) {
      continue;
    }

    grid.replaceChildren();
    const total = section.totalCount > 0 ? section.totalCount : section.displayLimit;
    commandCenterUi.updateSectionCount(section.id, section.indexes.length, total);

    if (section.indexes.length === 0) {
      continue;
    }

    for (const index of section.indexes) {
      const entry = entries[index];
      if (!entry) {
        continue;
      }
      grid.appendChild(createSearchTile(entry, index, section.id));
    }

    if (section.id === "plugin") {
      renderSectionPager(section);
      commandCenterUi.appendPluginAddChip(() => {
        settingsFocusHint = "plugins";
        openSettingsPanel();
      });
    }
  }

  refreshAdaptiveSectionGrids();
}

function getVisibleGridColumnCount(selected = selectedIndex): number {
  if (mode !== "search") {
    return 1;
  }

  const tile = document.querySelector<HTMLElement>(
    `.result-item.result-tile[data-index="${selected}"], .command-result[data-index="${selected}"]`
  );
  if (!tile) {
    return 1;
  }

  const grid = tile.closest(".section-grid, .recent-grid, .pinned-grid, .plugin-grid");
  if (!(grid instanceof HTMLElement)) {
    return 1;
  }

  const tiles = Array.from(
    grid.querySelectorAll<HTMLElement>(".result-item.result-tile")
  );
  if (tiles.length === 0) {
    return 1;
  }

  const firstRowTop = tiles[0]?.offsetTop ?? 0;
  let columns = 0;
  for (const item of tiles) {
    if (item.offsetTop !== firstRowTop) {
      break;
    }
    columns += 1;
  }

  return Math.max(1, columns);
}

function renderDetailList(): void {
  entries.forEach((entry, index) => {
    const row = document.createElement("li");
    row.className = "result-item";
    if (index === selectedIndex) {
      row.classList.add("active");
    }
    row.dataset.index = String(index);

    const main = document.createElement("div");
    main.className = "result-main";

    const content = document.createElement("div");
    content.className = "result-content";

    const header = document.createElement("div");
    header.className = "result-header";

    const title = document.createElement("span");
    title.className = "result-title";

    const type = document.createElement("span");
    type.className = "result-type";

    const subtitle = document.createElement("div");
    subtitle.className = "result-subtitle";

    if (entry.kind === "launch") {
      title.textContent = entry.item.title;
      type.textContent = normalizeLaunchType(entry.item.type);
      subtitle.textContent = entry.item.subtitle;
    } else {
      title.textContent = clipTitle(entry.item.content);
      type.textContent = "Clip";
      subtitle.textContent = clipSubtitle(entry.item.createdAt);
    }

    header.append(title, type);
    content.append(header, subtitle);
    main.append(createResultIcon(entry), content);
    row.append(main);

    bindResultInteractions(row, index, entry);
    list.appendChild(row);
  });
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) {
    return false;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Continue with legacy fallback.
  }

  try {
    const holder = document.createElement("textarea");
    holder.value = text;
    holder.setAttribute("readonly", "true");
    holder.style.position = "fixed";
    holder.style.opacity = "0";
    holder.style.pointerEvents = "none";
    holder.style.left = "-9999px";
    holder.style.top = "-9999px";
    document.body.appendChild(holder);
    holder.focus();
    holder.select();
    const copied = document.execCommand("copy");
    holder.remove();
    return copied;
  } catch {
    return false;
  }
}

function renderList(): void {
  closeSearchContextMenu();
  clearList();

  if (mode === "settings") {
    renderSettingsPanel();
    return;
  }

  if (mode === "password") {
    panelImplsSafe.renderPasswordPanel();
    return;
  }

  if (mode === "cashflow") {
    panelImplsSafe.renderCashflowPanel();
    return;
  }

  if (mode === "plugin") {
    panelImplsSafe.renderActivePluginPanel();
    return;
  }

  if (entries.length === 0 && mode !== "search") {
    const empty = document.createElement("li");
    empty.className = "empty-item";
    empty.textContent = mode === "clip" ? "\u672a\u627e\u5230\u526a\u8d34\u677f\u5185\u5bb9" : "\u6ca1\u6709\u5339\u914d\u7ed3\u679c";
    list.appendChild(empty);
    return;
  }

  if (mode === "search") {
    renderSearchSections();
    return;
  }

  renderDetailList();
}

function canUpdateSelectionHighlightInPlace(): boolean {
  if (entries.length === 0) {
    return false;
  }

  if (
    mode === "settings" ||
    mode === "password" ||
    mode === "cashflow" ||
    mode === "plugin"
  ) {
    return false;
  }

  if (isResultsLoading) {
    return false;
  }

  return (
    document.querySelector('.result-item[data-index="0"]') !== null ||
    document.querySelector('.command-result[data-index="0"]') !== null
  );
}

function updateSelectionHighlight(previousIndex: number, nextIndex: number): void {
  if (previousIndex === nextIndex) {
    return;
  }

  const previousItem = document.querySelector<HTMLElement>(
    `.result-item[data-index="${previousIndex}"], .command-result[data-index="${previousIndex}"]`
  );
  const nextItem = document.querySelector<HTMLElement>(
    `.result-item[data-index="${nextIndex}"], .command-result[data-index="${nextIndex}"]`
  );

  previousItem?.classList.remove("active");
  nextItem?.classList.add("active");
  nextItem?.scrollIntoView({ block: "nearest" });
}

function moveSelection(delta: number): void {
  if (entries.length === 0) {
    return;
  }

  const previousIndex = selectedIndex;
  selectedIndex = (selectedIndex + delta + entries.length) % entries.length;

  if (canUpdateSelectionHighlightInPlace()) {
    updateSelectionHighlight(previousIndex, selectedIndex);
    return;
  }

  renderList();
}

async function refreshEntries(query: string): Promise<void> {
  const token = ++latestSearchToken;
  const shouldShowLoading =
    mode === "clip" || (mode === "search" && Boolean(query.trim()));
  if (shouldShowLoading) {
    const loadingMessage = getLoadingMessage(mode, query);
    scheduleResultsLoading(loadingMessage);
    setStatus(loadingMessage);
  } else {
    setResultsLoading(false);
  }

  try {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus(
        "\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u8bf7\u5148\u5f7b\u5e95\u9000\u51fa LiteLauncher \u540e\u518d\u6267\u884c pnpm start"
      );
      return;
    }

    if (mode === "settings") {
      const loaded = await loadSettingsPanelData();
      if (!loaded) {
        setStatus(
          "\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u8bf7\u5148\u5f7b\u5e95\u9000\u51fa LiteLauncher \u540e\u518d\u6267\u884c pnpm start"
        );
        return;
      }
      if (token !== latestSearchToken) {
        return;
      }
      resetSearchSections();
      selectedIndex = 0;
      renderList();
      setStatus("\u8bbe\u7f6e\u5df2\u52a0\u8f7d");
      return;
    }

    if (mode === "password") {
      if (token !== latestSearchToken) {
        return;
      }
      resetSearchSections();
      selectedIndex = 0;
      renderList();
      setStatus("\u8bf7\u914d\u7f6e\u5bc6\u7801\u53c2\u6570\u540e\u751f\u6210");
      return;
    }

    if (mode === "cashflow") {
      const ok = await panelImplsSafe.refreshCashflowPanel();
      if (token !== latestSearchToken) {
        return;
      }
      resetSearchSections();
      selectedIndex = 0;
      renderList();
      if (!ok) {
        setStatus("\u73b0\u91d1\u6d41\u6e38\u620f\u52a0\u8f7d\u5931\u8d25");
      }
      return;
    }

    if (mode === "plugin") {
      if (token !== latestSearchToken) {
        return;
      }
      resetSearchSections();
      selectedIndex = 0;
      renderList();
      const activePluginTitle = panelImplsSafe.getActivePluginPanelTitle();
      setStatus(activePluginTitle ? `已打开插件面板：${activePluginTitle}` : "已打开插件面板");
      return;
    }

    if (mode === "search") {
      const parsedQuery = parseSearchQuery(query);
      const trimmed = query.trim();

      if (trimmed) {
        const pageSize = Math.max(1, searchDisplayConfig.searchLimit);
        const fetchLimit = Math.min(
          SEARCH_PAGE_FETCH_MAX,
          Math.max(pageSize, pageSize * SEARCH_PAGE_FETCH_MULTIPLIER)
        );
        const queryKey = `${parsedQuery.scope}:${parsedQuery.query.toLowerCase()}`;
        if (queryKey !== pagedSearchQueryKey) {
          pagedSearchQueryKey = queryKey;
          searchResultPage = 0;
          cachedSearchLaunchItems = [];
        }

        let launchItems = cachedSearchLaunchItems;
        if (launchItems.length === 0) {
          // search() already includes dynamic PATH / alias / WindowsApps hits.
          launchItems = await launcher.search(parsedQuery.query, {
            limit: fetchLimit,
            scope: parsedQuery.scope
          });
          if (token !== latestSearchToken) {
            return;
          }
          cachedSearchLaunchItems = launchItems;
        }

        const totalSearchCount = launchItems.length;
        const searchPageCount = Math.max(
          1,
          Math.ceil(Math.max(1, totalSearchCount) / pageSize)
        );
        if (searchResultPage >= searchPageCount) {
          searchResultPage = searchPageCount - 1;
        }

        const searchStart = searchResultPage * pageSize;
        const pagedSearchItems = launchItems.slice(searchStart, searchStart + pageSize);

        resetSearchSections();
        addSearchSection(
          "search",
          parsedQuery.explicitScope ? `${parsedQuery.scopeLabel}结果` : "\u641c\u7d22\u7ed3\u679c",
          pagedSearchItems,
          pageSize,
          parsedQuery.explicitScope
            ? `没有匹配的${parsedQuery.scopeLabel}结果`
            : "\u6ca1\u6709\u5339\u914d\u7ed3\u679c",
          {
            totalCount: totalSearchCount,
            page: searchResultPage,
            pageCount: searchPageCount
          }
        );
        selectedIndex = entries.length ? 0 : 0;
        renderList();
        const shownStart = totalSearchCount === 0 ? 0 : searchStart + 1;
        const shownEnd = totalSearchCount === 0 ? 0 : searchStart + pagedSearchItems.length;
        const totalSearchText =
          totalSearchCount >= fetchLimit ? `${totalSearchCount}+` : `${totalSearchCount}`;
        if (parsedQuery.explicitScope) {
          setStatus(
            `${parsedQuery.scopeLabel}搜索 ${shownStart}-${shownEnd}/${totalSearchText}`
          );
        } else {
          setStatus(`\u641c\u7d22 ${shownStart}-${shownEnd}/${totalSearchText}`);
        }
        return;
      }

      pagedSearchQueryKey = "";
      searchResultPage = 0;
      cachedSearchLaunchItems = [];

      if (tryRestoreCachedHomeSections()) {
        return;
      }

      const homeSections = await launcher.getHomeSections();
      void ensurePluginCatalogLoaded();
      if (token !== latestSearchToken) {
        return;
      }

      const recentItems = homeSections.recent;
      const pinnedItems = homeSections.pinned;
      const pluginItems = homeSections.plugin;

      const recentDisplayLimit = getRecentHomeDisplayLimit(recentItems.length);
      const pinnedDisplayLimit = getAdaptiveSectionDisplayLimit(pinnedItems);
      const pluginPageSize = getAdaptiveSectionDisplayLimit(pluginItems);
      const pluginPageCount = 1;
      pluginResultPage = 0;

      resetSearchSections();
      addSearchSection(
        "recent",
        "\u6700\u8fd1\u8bbf\u95ee",
        recentItems,
        recentDisplayLimit,
        "\u6682\u65e0\u6700\u8fd1\u8bbf\u95ee"
      );
      addSearchSection(
        "pinned",
        "\u7f6e\u9876",
        pinnedItems,
        pinnedDisplayLimit,
        "\u6682\u65e0\u7f6e\u9876\u9879\uff08\u53ef\u70b9\u300c\u6dfb\u52a0\u6587\u4ef6/\u6587\u4ef6\u5939\u300d\u6216\u5728\u641c\u7d22\u7ed3\u679c\u53f3\u952e\u7f6e\u9876\uff09"
      );
      addSearchSection(
        "plugin",
        "\u63d2\u4ef6",
        pluginItems,
        pluginPageSize,
        "\u6682\u65e0\u63d2\u4ef6",
        {
          totalCount: pluginItems.length,
          page: pluginResultPage,
          pageCount: pluginPageCount
        }
      );
      selectedIndex = entries.length ? 0 : 0;
      renderList();
      const homeStatus = `\u6700\u8fd1 ${recentItems.length} \u00b7 \u7f6e\u9876 ${pinnedItems.length} \u00b7 \u63d2\u4ef6 ${pluginItems.length}`;
      setStatus(homeStatus);
      cacheHomeSectionsSnapshot(homeStatus);
      return;
    }

    const clipItems = await launcher.getClipItems(query);
    if (token !== latestSearchToken) {
      return;
    }

    entries = clipItems.map((item) => ({ kind: "clip", item }));
    searchSections = [];
    selectedIndex = entries.length ? 0 : 0;
    renderList();
    setStatus(`\u526a\u8d34\u677f\u6761\u76ee\uff1a${entries.length}`);
  } catch {
    setStatus("\u52a0\u8f7d\u6570\u636e\u5931\u8d25");
  } finally {
    if (token === latestSearchToken) {
      setResultsLoading(false);
    }
  }
}

async function executeSelected(index = selectedIndex): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u6267\u884c");
    return;
  }

  if (index < 0 || index >= entries.length) {
    return;
  }

  selectedIndex = index;
  const selected = entries[index];
  if (!selected) {
    return;
  }

  if (selected.kind === "launch") {
    const modeBeforeExecute = mode;
    const queryBeforeExecute = currentQuery;
    const result = await launcher.execute(selected.item);
    if (!result.ok) {
      setStatus(result.message ?? "\u6267\u884c\u5931\u8d25");
      return;
    }

    setStatus(result.message ?? "执行完成");
    if (selected.kind === "launch") {
      commandCenterUi.showToast(`已打开：${selected.item.title}`);
    }
    markHomeSectionsDirty();
    if (!result.keepOpen) {
      return;
    }
    if (isPanelOpeningLaunchItem(selected.item)) {
      return;
    }
    if (mode !== modeBeforeExecute || currentQuery !== queryBeforeExecute) {
      return;
    }
    await refreshEntries(currentQuery);
    return;
  }

  const copied = await launcher.copyClipItem(selected.item.id);
  if (!copied) {
    setStatus("\u590d\u5236\u526a\u8d34\u677f\u6761\u76ee\u5931\u8d25");
    return;
  }

  setStatus("\u5df2\u590d\u5236\u526a\u8d34\u677f\u6761\u76ee");
}

async function deleteSelectedClipItem(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u5220\u9664");
    return;
  }

  const selected = entries[selectedIndex];
  if (!selected || selected.kind !== "clip") {
    return;
  }

  const deleted = await launcher.deleteClipItem(selected.item.id);
  if (!deleted) {
    setStatus("\u5220\u9664\u526a\u8d34\u677f\u6761\u76ee\u5931\u8d25");
    return;
  }

  setStatus("\u5df2\u5220\u9664\u526a\u8d34\u677f\u6761\u76ee");
  await refreshEntries(currentQuery);
}

async function clearAllClipItems(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u6e05\u7a7a");
    return;
  }

  const removed = await launcher.clearClipItems();
  setStatus(`\u5df2\u6e05\u7a7a ${removed} \u6761\u526a\u8d34\u677f\u8bb0\u5f55`);
  await refreshEntries(currentQuery);
}
