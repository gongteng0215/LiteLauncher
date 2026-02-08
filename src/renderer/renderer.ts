type PanelMode = "search" | "clip" | "settings";
type ItemType = "application" | "folder" | "file" | "web" | "command";
type SectionId = "recent" | "recommended" | "plugin" | "search";

interface LaunchItem {
  id: string;
  type: ItemType;
  title: string;
  subtitle: string;
  target: string;
  keywords: string[];
  iconPath?: string;
}

interface ClipItem {
  id: string;
  content: string;
  hash: string;
  createdAt: number;
}

interface ExecuteResult {
  ok: boolean;
  message?: string;
  keepOpen?: boolean;
}

interface DebugKeyEvent {
  source: "main" | "renderer";
  phase: string;
  key: string;
  code?: string;
  alt?: boolean;
  control?: boolean;
  shift?: boolean;
  meta?: boolean;
  repeat?: boolean;
  ts: number;
  note?: string;
}

interface LauncherApi {
  isDebugKeysEnabled(): boolean;
  getInitialItems(): Promise<LaunchItem[]>;
  getRecommendedItems(): Promise<LaunchItem[]>;
  getPluginItems(): Promise<LaunchItem[]>;
  search(query: string): Promise<LaunchItem[]>;
  execute(item: LaunchItem): Promise<ExecuteResult>;
  hide(): Promise<boolean>;
  getClipItems(query: string): Promise<ClipItem[]>;
  copyClipItem(itemId: string): Promise<boolean>;
  deleteClipItem(itemId: string): Promise<boolean>;
  clearClipItems(): Promise<number>;
  onFocusInput(handler: () => void): () => void;
  onOpenPanel(handler: (panel: string) => void): () => void;
  onDebugKey(handler: (event: DebugKeyEvent) => void): () => void;
}

type ResultEntry =
  | { kind: "launch"; item: LaunchItem }
  | { kind: "clip"; item: ClipItem };

interface SearchSection {
  id: SectionId;
  title: string;
  indexes: number[];
  emptyText: string;
}

const inputElement = document.getElementById(
  "search-input"
) as HTMLInputElement | null;
const listElement = document.getElementById(
  "result-list"
) as HTMLUListElement | null;
const statusElement = document.getElementById(
  "status-text"
) as HTMLDivElement | null;
const hintElement = document.getElementById("hint-text") as HTMLDivElement | null;

if (!inputElement || !listElement || !statusElement || !hintElement) {
  throw new Error("渲染层初始化失败：缺少必要 DOM 节点");
}

const input = inputElement;
const list = listElement;
const statusText = statusElement;
const hintText = hintElement;

let entries: ResultEntry[] = [];
let searchSections: SearchSection[] = [];
let selectedIndex = 0;
let currentQuery = "";
let latestSearchToken = 0;
let mode: PanelMode = "search";
let debugMode = false;
const handledEvents = new WeakSet<KeyboardEvent>();

const DEBUG_LOG_LIMIT = 22;
const GRID_COLUMNS = 10;
const MAX_SECTION_ITEMS = 20;
const debugLogs: string[] = [];
const debugPanel = document.createElement("div");

function getLauncherApi(): LauncherApi | null {
  return ((window as Window & { launcher?: LauncherApi }).launcher ??
    null) as LauncherApi | null;
}

function markRendererBootstrapped(): void {
  (
    window as Window & {
      __LL_RENDERER_BOOTSTRAPPED__?: boolean;
    }
  ).__LL_RENDERER_BOOTSTRAPPED__ = true;
}

function initDebugPanel(): void {
  debugPanel.id = "debug-key-panel";
  debugPanel.style.position = "fixed";
  debugPanel.style.right = "8px";
  debugPanel.style.bottom = "8px";
  debugPanel.style.width = "360px";
  debugPanel.style.maxHeight = "42vh";
  debugPanel.style.overflow = "auto";
  debugPanel.style.padding = "8px";
  debugPanel.style.border = "1px solid rgba(255,255,255,0.25)";
  debugPanel.style.background = "rgba(6, 10, 16, 0.9)";
  debugPanel.style.color = "#b7f8ff";
  debugPanel.style.fontSize = "11px";
  debugPanel.style.fontFamily = "Consolas, 'Courier New', monospace";
  debugPanel.style.whiteSpace = "pre-wrap";
  debugPanel.style.lineHeight = "1.4";
  debugPanel.style.zIndex = "9999";
  debugPanel.style.display = "none";
  document.body.appendChild(debugPanel);
}

function pushDebugLog(line: string): void {
  if (!debugMode) {
    return;
  }

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const text = `[${hh}:${mm}:${ss}] ${line}`;

  debugLogs.push(text);
  if (debugLogs.length > DEBUG_LOG_LIMIT) {
    debugLogs.shift();
  }

  debugPanel.textContent = debugLogs.join("\n");
  debugPanel.style.display = "block";
  debugPanel.scrollTop = debugPanel.scrollHeight;
}

function formatMods(
  control?: boolean,
  alt?: boolean,
  shift?: boolean,
  meta?: boolean
): string {
  const mods = [
    control ? "Ctrl" : "",
    alt ? "Alt" : "",
    shift ? "Shift" : "",
    meta ? "Meta" : ""
  ].filter(Boolean);
  return mods.length ? `${mods.join("+")}+` : "";
}

function formatDebugEvent(event: DebugKeyEvent): string {
  return `${event.source} ${event.phase} ${formatMods(
    event.control,
    event.alt,
    event.shift,
    event.meta
  )}${event.key}${event.code ? ` (${event.code})` : ""}${
    event.note ? ` [${event.note}]` : ""
  }`;
}

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

function setMode(nextMode: PanelMode): void {
  mode = nextMode;
  input.value = "";
  currentQuery = "";

  if (mode === "search") {
    input.placeholder = "搜索应用（图标网格）";
    setHint("Enter 执行 - Esc 清空/隐藏 - 方向键移动");
  } else if (mode === "clip") {
    input.placeholder = "搜索剪贴板历史";
    setHint("Enter 复制 - Delete 删除 - Ctrl+Shift+Delete 清空 - Esc 返回");
  } else {
    input.placeholder = "设置面板尚未实现";
    setHint("Esc 返回");
  }
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

function clearList(): void {
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
  return `保存于 ${date.toLocaleString()}`;
}

function resetSearchSections(): void {
  entries = [];
  searchSections = [];
}

function addSearchSection(
  id: SectionId,
  title: string,
  items: LaunchItem[],
  emptyText: string
): void {
  const indexes: number[] = [];
  const limited = items.slice(0, MAX_SECTION_ITEMS);

  for (const item of limited) {
    indexes.push(entries.length);
    entries.push({ kind: "launch", item });
  }

  searchSections.push({ id, title, indexes, emptyText });
}

function bindResultInteractions(element: HTMLElement, index: number): void {
  element.addEventListener("mouseenter", () => {
    selectedIndex = index;
  });

  element.addEventListener("click", (event) => {
    event.stopPropagation();
    selectedIndex = index;
    renderList();
    void executeSelected(index);
  });
}

function createSearchTile(entry: ResultEntry, index: number): HTMLLIElement {
  const tile = document.createElement("li");
  tile.className = "result-item result-tile";
  if (index === selectedIndex) {
    tile.classList.add("active");
  }
  tile.dataset.index = String(index);

  const icon = createResultIcon(entry);
  const title = document.createElement("div");
  title.className = "tile-title";
  title.textContent =
    entry.kind === "launch" ? entry.item.title : clipTitle(entry.item.content);

  tile.title = title.textContent;
  tile.append(icon, title);
  bindResultInteractions(tile, index);
  return tile;
}

function renderSearchSections(): void {
  list.classList.add("search-sections");

  for (const section of searchSections) {
    const block = document.createElement("li");
    block.className = "section-block";

    const heading = document.createElement("div");
    heading.className = "section-title";
    heading.textContent = `${section.title} (${section.indexes.length}/${MAX_SECTION_ITEMS})`;

    block.appendChild(heading);

    if (section.indexes.length === 0) {
      const empty = document.createElement("div");
      empty.className = "section-empty";
      empty.textContent = section.emptyText;
      block.appendChild(empty);
      list.appendChild(block);
      continue;
    }

    const grid = document.createElement("ul");
    grid.className = "section-grid";

    for (const index of section.indexes) {
      const entry = entries[index];
      if (!entry) {
        continue;
      }
      grid.appendChild(createSearchTile(entry, index));
    }

    block.appendChild(grid);
    list.appendChild(block);
  }
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

    bindResultInteractions(row, index);
    list.appendChild(row);
  });
}

function renderList(): void {
  clearList();

  if (entries.length === 0 && mode !== "search") {
    const empty = document.createElement("li");
    empty.className = "empty-item";
    empty.textContent = mode === "clip" ? "未找到剪贴板内容" : "没有匹配结果";
    list.appendChild(empty);
    return;
  }

  if (mode === "search") {
    renderSearchSections();
    return;
  }

  renderDetailList();
}

function moveSelection(delta: number): void {
  if (entries.length === 0) {
    return;
  }

  selectedIndex = (selectedIndex + delta + entries.length) % entries.length;
  renderList();
}

async function refreshEntries(query: string): Promise<void> {
  const token = ++latestSearchToken;

  try {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("桥接层未加载。请先彻底退出后重新执行 pnpm start");
      return;
    }

    if (mode === "settings") {
      resetSearchSections();
      selectedIndex = 0;
      renderList();
      setStatus("设置页尚未实现");
      return;
    }

    if (mode === "search") {
      const trimmed = query.trim();

      if (trimmed) {
        const launchItems = await launcher.search(query);
        if (token !== latestSearchToken) {
          return;
        }

        resetSearchSections();
        addSearchSection("search", "搜索结果", launchItems, "没有匹配结果");
        selectedIndex = entries.length ? 0 : 0;
        renderList();
        setStatus(`搜索结果：${entries.length}`);
        return;
      }

      const [recentItems, recommendedItems, pluginItems] = await Promise.all([
        launcher.getInitialItems(),
        launcher.getRecommendedItems(),
        launcher.getPluginItems()
      ]);
      if (token !== latestSearchToken) {
        return;
      }

      resetSearchSections();
      addSearchSection("recent", "最近访问", recentItems, "暂无最近访问");
      addSearchSection("recommended", "推荐", recommendedItems, "暂无推荐项");
      addSearchSection("plugin", "插件", pluginItems, "暂无插件");
      selectedIndex = entries.length ? 0 : 0;
      renderList();
      setStatus(
        `最近 ${Math.min(recentItems.length, MAX_SECTION_ITEMS)} · 推荐 ${Math.min(
          recommendedItems.length,
          MAX_SECTION_ITEMS
        )} · 插件 ${Math.min(pluginItems.length, MAX_SECTION_ITEMS)}`
      );
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
    setStatus(`剪贴板条目：${entries.length}`);
  } catch {
    setStatus("加载数据失败");
  }
}

async function executeSelected(index = selectedIndex): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法执行");
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
    const result = await launcher.execute(selected.item);
    if (!result.ok) {
      setStatus(result.message ?? "执行失败");
      return;
    }

    setStatus(result.message ?? "执行完成");
    if (!result.keepOpen) {
      return;
    }
    await refreshEntries(currentQuery);
    return;
  }

  const copied = await launcher.copyClipItem(selected.item.id);
  if (!copied) {
    setStatus("复制剪贴板条目失败");
    return;
  }

  setStatus("已复制剪贴板条目");
}

async function deleteSelectedClipItem(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法删除");
    return;
  }

  const selected = entries[selectedIndex];
  if (!selected || selected.kind !== "clip") {
    return;
  }

  const deleted = await launcher.deleteClipItem(selected.item.id);
  if (!deleted) {
    setStatus("删除剪贴板条目失败");
    return;
  }

  setStatus("已删除剪贴板条目");
  await refreshEntries(currentQuery);
}

async function clearAllClipItems(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法清空");
    return;
  }

  const removed = await launcher.clearClipItems();
  setStatus(`已清空 ${removed} 条剪贴板记录`);
  await refreshEntries(currentQuery);
}

function backToSearch(): void {
  if (mode !== "search") {
    setMode("search");
    void refreshEntries("");
    return;
  }

  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法隐藏窗口");
    return;
  }
  void launcher.hide();
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
  const isEnter =
    key === "Enter" ||
    key === "Return" ||
    code === "Enter" ||
    code === "NumpadEnter";
  const isEscape = key === "Escape" || key === "Esc";
  const isDelete = key === "Delete" || key === "Del";

  pushDebugLog(
    `renderer keydown ${formatMods(
      event.ctrlKey,
      event.altKey,
      event.shiftKey,
      event.metaKey
    )}${key} code=${code || "-"} target=${targetName}`
  );

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
    const step = mode === "search" ? GRID_COLUMNS : 1;
    pushDebugLog(`renderer action: moveSelection(+${step})`);
    moveSelection(step);
    return;
  }

  if (isArrowUp) {
    event.preventDefault();
    const step = mode === "search" ? GRID_COLUMNS : 1;
    pushDebugLog(`renderer action: moveSelection(-${step})`);
    moveSelection(-step);
    return;
  }

  if (isEnter) {
    event.preventDefault();
    if (!entries[selectedIndex]) {
      setStatus("当前没有可执行项");
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
    if (input.value.trim()) {
      input.value = "";
      currentQuery = "";
      pushDebugLog("renderer action: clear query");
      void refreshEntries("");
      return;
    }
    pushDebugLog("renderer action: backToSearch/hide");
    backToSearch();
  }
}

function registerEvents(): void {
  input.addEventListener("input", () => {
    currentQuery = input.value;
    void refreshEntries(currentQuery);
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

  const launcher = getLauncherApi();
  if (launcher?.onFocusInput) {
    launcher.onFocusInput(() => {
      focusInput(true);
      pushDebugLog("renderer onFocusInput received");
      setTimeout(() => focusInput(true), 30);
    });
  }

  if (launcher?.onOpenPanel) {
    launcher.onOpenPanel((panel) => {
      if (panel === "clip") {
        setMode("clip");
        pushDebugLog("renderer openPanel=clip");
        void refreshEntries("");
        return;
      }

      if (panel === "settings") {
        setMode("settings");
        pushDebugLog("renderer openPanel=settings");
        void refreshEntries("");
      }
    });
  }

  window.addEventListener("focus", () => {
    pushDebugLog("renderer window focus");
    focusInput(false);
  });

  if (launcher?.onDebugKey) {
    launcher.onDebugKey((event) => {
      debugMode = true;
      setStatus("调试模式已启用，右下角显示按键日志");
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
    setStatus(`渲染层错误：${event.message}`);
  });

  setMode("search");
  registerEvents();
  setStatus("可以开始搜索");
  focusInput(false);
  void refreshEntries("");
}

bootstrap();
