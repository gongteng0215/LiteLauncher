namespace RendererPanelRuntime {

  export const CLIPBOARD_WORKBENCH_SCOPE_OPTIONS = [
    { key: "all", label: "全部" },
    { key: "recent", label: "最近" },
    { key: "favorites", label: "收藏" },
    { key: "pinned", label: "置顶" },
    { key: "text", label: "文本" },
    { key: "image", label: "图片" },
    { key: "files", label: "文件" },
    { key: "screenshots", label: "截图" }
  ] as const;

  export let clipboardWorkbenchPanelData: ClipboardWorkbenchPanelData =
    createDefaultClipboardWorkbenchPanelData();

  export let clipboardWorkbenchActiveItemId = "";

  export let clipboardWorkbenchSelectedItemIds = new Set<string>();

  export let clipboardWorkbenchManualTextDraft = "";

  export let clipboardWorkbenchSearchDraft = "";

  export function createDefaultClipboardWorkbenchPanelData(): ClipboardWorkbenchPanelData {
    return {
      items: [],
      groups: [],
      settings: {
        autoCollect: true,
        sensitiveMode: false,
        maxItems: 50,
        maxBytes: 512 * 1024 * 1024
      },
      stats: {
        totalItems: 0,
        totalBytes: 0
      },
      query: {
        search: "",
        scope: "all",
        groupId: ""
      }
    };
  }

  export function toClipboardWorkbenchStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  export function toClipboardWorkbenchPanelItem(
    value: unknown
  ): ClipboardWorkbenchPanelItemView | null {
    const record = toRecord(value);
    if (!record) {
      return null;
    }

    const id = typeof record.id === "string" ? record.id.trim() : "";
    const summary = typeof record.summary === "string" ? record.summary.trim() : "";
    if (!id || !summary) {
      return null;
    }

    const kind =
      record.kind === "image" || record.kind === "files" ? record.kind : "text";
    const source =
      record.source === "manual" || record.source === "screenshot"
        ? record.source
        : "auto";
    const createdAt =
      typeof record.createdAt === "number" && Number.isFinite(record.createdAt)
        ? record.createdAt
        : 0;
    const updatedAt =
      typeof record.updatedAt === "number" && Number.isFinite(record.updatedAt)
        ? record.updatedAt
        : createdAt;

    return {
      id,
      kind,
      source,
      title:
        typeof record.title === "string" && record.title.trim()
          ? record.title.trim()
          : summary,
      summary,
      note:
        typeof record.note === "string" && record.note.trim()
          ? record.note.trim()
          : "",
      tags: toClipboardWorkbenchStringArray(record.tags),
      favorite: record.favorite === true,
      pinned: record.pinned === true,
      sensitive: record.sensitive === true,
      createdAt,
      updatedAt,
      previewText:
        typeof record.previewText === "string" && record.previewText.trim()
          ? record.previewText
          : undefined,
      filePaths: toClipboardWorkbenchStringArray(record.filePaths),
      assetPath:
        typeof record.assetPath === "string" && record.assetPath.trim()
          ? record.assetPath.trim()
          : undefined,
      assetUrl:
        typeof record.assetUrl === "string" && record.assetUrl.trim()
          ? record.assetUrl.trim()
          : undefined
    };
  }

  export function normalizeClipboardWorkbenchPanelData(
    value: unknown
  ): ClipboardWorkbenchPanelData {
    const base = createDefaultClipboardWorkbenchPanelData();
    const record = toRecord(value);
    if (!record) {
      return base;
    }

    const items = Array.isArray(record.items)
      ? record.items
          .map((item) => toClipboardWorkbenchPanelItem(item))
          .filter((item): item is ClipboardWorkbenchPanelItemView => item !== null)
      : [];

    const groups = Array.isArray(record.groups)
      ? record.groups
          .map((group) => {
            const next = toRecord(group);
            if (!next) {
              return null;
            }

            const id = typeof next.id === "string" ? next.id.trim() : "";
            const name = typeof next.name === "string" ? next.name.trim() : "";
            const count =
              typeof next.count === "number" && Number.isFinite(next.count)
                ? Math.max(0, Math.round(next.count))
                : 0;
            if (!id || !name) {
              return null;
            }

            return { id, name, count };
          })
          .filter(
            (group): group is { id: string; name: string; count: number } =>
              group !== null
          )
      : [];

    const settings = toRecord(record.settings);
    const stats = toRecord(record.stats);
    const query = toRecord(record.query);

    return {
      items,
      groups,
      settings: {
        autoCollect:
          typeof settings?.autoCollect === "boolean"
            ? settings.autoCollect
            : base.settings.autoCollect,
        sensitiveMode:
          typeof settings?.sensitiveMode === "boolean"
            ? settings.sensitiveMode
            : base.settings.sensitiveMode,
        maxItems:
          typeof settings?.maxItems === "number" && Number.isFinite(settings.maxItems)
            ? Math.max(1, Math.round(settings.maxItems))
            : base.settings.maxItems,
        maxBytes:
          typeof settings?.maxBytes === "number" && Number.isFinite(settings.maxBytes)
            ? Math.max(0, Math.round(settings.maxBytes))
            : base.settings.maxBytes
      },
      stats: {
        totalItems:
          typeof stats?.totalItems === "number" && Number.isFinite(stats.totalItems)
            ? Math.max(0, Math.round(stats.totalItems))
            : items.length,
        totalBytes:
          typeof stats?.totalBytes === "number" && Number.isFinite(stats.totalBytes)
            ? Math.max(0, Math.round(stats.totalBytes))
            : 0
      },
      query: {
        search:
          typeof query?.search === "string" ? query.search : base.query.search,
        scope:
          typeof query?.scope === "string" && query.scope.trim()
            ? query.scope.trim()
            : base.query.scope,
        groupId:
          typeof query?.groupId === "string" ? query.groupId : base.query.groupId
      }
    };
  }

  export function ensureClipboardWorkbenchSelection(): void {
    const visibleIds = new Set(
      clipboardWorkbenchPanelData.items.map((item) => item.id)
    );
    clipboardWorkbenchSelectedItemIds = new Set(
      [...clipboardWorkbenchSelectedItemIds].filter((itemId) => visibleIds.has(itemId))
    );

    const firstId = clipboardWorkbenchPanelData.items[0]?.id ?? "";
    if (!firstId) {
      clipboardWorkbenchActiveItemId = "";
      clipboardWorkbenchSelectedItemIds.clear();
      return;
    }

    const exists = clipboardWorkbenchPanelData.items.some(
      (item) => item.id === clipboardWorkbenchActiveItemId
    );
    if (!exists) {
      clipboardWorkbenchActiveItemId = firstId;
    }
  }

  export function getClipboardWorkbenchActiveItem(): ClipboardWorkbenchPanelItemView | null {
    ensureClipboardWorkbenchSelection();
    return (
      clipboardWorkbenchPanelData.items.find(
        (item) => item.id === clipboardWorkbenchActiveItemId
      ) ?? null
    );
  }

  export function getClipboardWorkbenchSelectedItems(): ClipboardWorkbenchPanelItemView[] {
    ensureClipboardWorkbenchSelection();
    return clipboardWorkbenchPanelData.items.filter((item) =>
      clipboardWorkbenchSelectedItemIds.has(item.id)
    );
  }

  export function isClipboardWorkbenchItemSelected(itemId: string): boolean {
    return clipboardWorkbenchSelectedItemIds.has(itemId);
  }

  export function toggleClipboardWorkbenchItemSelection(itemId: string): void {
    if (!itemId) {
      return;
    }

    if (clipboardWorkbenchSelectedItemIds.has(itemId)) {
      clipboardWorkbenchSelectedItemIds.delete(itemId);
    } else {
      clipboardWorkbenchSelectedItemIds.add(itemId);
    }
    clipboardWorkbenchActiveItemId = itemId;
    syncClipboardWorkbenchSelectionUi();
  }

  export function clearClipboardWorkbenchSelection(): void {
    if (clipboardWorkbenchSelectedItemIds.size === 0) {
      return;
    }
    clipboardWorkbenchSelectedItemIds.clear();
    syncClipboardWorkbenchSelectionUi();
  }

  export function buildClipboardWorkbenchQueryParams(
    overrides: Partial<ClipboardWorkbenchPanelData["query"]> = {}
  ): Record<string, string> {
    const nextSearch =
      overrides.search ??
      clipboardWorkbenchSearchDraft ??
      clipboardWorkbenchPanelData.query.search;
    const nextScope = overrides.scope ?? clipboardWorkbenchPanelData.query.scope;
    const nextGroupId = overrides.groupId ?? clipboardWorkbenchPanelData.query.groupId;

    const params: Record<string, string> = {};
    if (typeof nextSearch === "string" && nextSearch.trim()) {
      params.search = nextSearch;
    }
    if (
      typeof nextScope === "string" &&
      nextScope.trim() &&
      nextScope.trim().toLowerCase() !== "all"
    ) {
      params.scope = nextScope.trim();
    }
    if (typeof nextGroupId === "string" && nextGroupId.trim()) {
      params.groupId = nextGroupId.trim();
    }
    return params;
  }

  export function createClipboardWorkbenchBadge(
    text: string,
    tone: "neutral" | "accent" | "warning" | "success" = "neutral"
  ): HTMLSpanElement {
    const badge = document.createElement("span");
    badge.className = "clipboard-workbench-badge";
    badge.dataset.tone = tone;
    badge.textContent = text;
    return badge;
  }

  export function formatClipboardWorkbenchBytes(value: number): string {
    if (!Number.isFinite(value) || value <= 0) {
      return "0 B";
    }

    const units = ["B", "KB", "MB", "GB"];
    let next = value;
    let index = 0;
    while (next >= 1024 && index < units.length - 1) {
      next /= 1024;
      index += 1;
    }
    const digits = next >= 100 ? 0 : next >= 10 ? 1 : 2;
    return `${next.toFixed(digits)} ${units[index]}`;
  }

  export function formatClipboardWorkbenchTime(value: number): string {
    if (!Number.isFinite(value) || value <= 0) {
      return "未知时间";
    }
    return new Date(value).toLocaleString();
  }

  export function getClipboardWorkbenchKindLabel(kind: ClipboardWorkbenchPanelKind): string {
    switch (kind) {
      case "image":
        return "图片";
      case "files":
        return "文件";
      default:
        return "文本";
    }
  }

  export function getClipboardWorkbenchSourceLabel(
    source: ClipboardWorkbenchPanelSource
  ): string {
    switch (source) {
      case "manual":
        return "手动保存";
      case "screenshot":
        return "截图采集";
      default:
        return "自动采集";
    }
  }

  export function getClipboardWorkbenchItemPreview(
    item: ClipboardWorkbenchPanelItemView
  ): string {
    if (item.kind === "files") {
      const count = item.filePaths?.length ?? 0;
      return count > 0 ? `${count} 个文件路径` : item.summary;
    }
    if (item.kind === "image") {
      return item.assetUrl ? "可预览图片" : item.summary;
    }
    return item.previewText ?? item.summary;
  }

  export function getClipboardWorkbenchForm(): HTMLFormElement | null {
    return list.querySelector<HTMLFormElement>("form.clipboard-workbench-form");
  }

  export function clipboardWorkbenchItemIdsSignature(
    items: ClipboardWorkbenchPanelItemView[]
  ): string {
    return items.map((item) => item.id).join("\u0000");
  }

  export function shouldFullyRerenderClipboardWorkbenchPanel(
    previousItems: ClipboardWorkbenchPanelItemView[]
  ): boolean {
    return (
      clipboardWorkbenchItemIdsSignature(previousItems) !==
      clipboardWorkbenchItemIdsSignature(clipboardWorkbenchPanelData.items)
    );
  }

  export function refreshClipboardWorkbenchListMeta(): void {
    const meta = getClipboardWorkbenchForm()?.querySelector<HTMLElement>(
      ".clipboard-workbench-list-meta"
    );
    if (!meta) {
      return;
    }

    const selectedCount = getClipboardWorkbenchSelectedItems().length;
    meta.textContent =
      selectedCount > 0
        ? `${clipboardWorkbenchPanelData.items.length} 条可见 · ${selectedCount} 条已选`
        : `${clipboardWorkbenchPanelData.items.length} 条可见`;
  }

  export function updateClipboardWorkbenchItemMarkedStates(): void {
    const form = getClipboardWorkbenchForm();
    if (!form) {
      return;
    }

    form.querySelectorAll<HTMLElement>(".clipboard-workbench-item").forEach((card) => {
      const itemId = card.dataset.clipboardWorkbenchItemId ?? "";
      card.dataset.marked = String(isClipboardWorkbenchItemSelected(itemId));
    });
  }

  export function clearClipboardWorkbenchDetailNode(detail: HTMLElement): void {
    while (detail.firstChild) {
      detail.removeChild(detail.firstChild);
    }
  }

  export function appendClipboardWorkbenchDetailContent(
    detail: HTMLElement,
    activeItem: ClipboardWorkbenchPanelItemView | null
  ): void {
    const detailTitle = document.createElement("div");
    detailTitle.className = "clipboard-workbench-section-title";
    detailTitle.textContent = "详情";
    detail.appendChild(detailTitle);

    if (!activeItem) {
      const empty = document.createElement("div");
      empty.className = "clipboard-workbench-empty";
      empty.textContent = "选择一条记录查看详情。";
      detail.appendChild(empty);
      return;
    }

    const hero = document.createElement("div");
    hero.className = "clipboard-workbench-detail-hero";
    const heroTitle = document.createElement("div");
    heroTitle.className = "clipboard-workbench-detail-title";
    heroTitle.textContent = activeItem.title || activeItem.summary;
    const heroMeta = document.createElement("div");
    heroMeta.className = "clipboard-workbench-detail-meta";
    heroMeta.append(
      createClipboardWorkbenchBadge(getClipboardWorkbenchKindLabel(activeItem.kind), "accent"),
      createClipboardWorkbenchBadge(getClipboardWorkbenchSourceLabel(activeItem.source)),
      createClipboardWorkbenchBadge(clipboardWorkbenchPanelData.query.scope || "all")
    );
    hero.append(heroTitle, heroMeta);
    detail.appendChild(hero);

    const preview = document.createElement("div");
    preview.className = "clipboard-workbench-preview";
    if (activeItem.kind === "text") {
      const pre = document.createElement("pre");
      pre.className = "clipboard-workbench-preview-text";
      pre.textContent = activeItem.previewText ?? activeItem.summary;
      preview.appendChild(pre);
    } else if (activeItem.kind === "files") {
      const listNode = document.createElement("ul");
      listNode.className = "clipboard-workbench-file-list";
      (activeItem.filePaths ?? []).forEach((filePath) => {
        const row = document.createElement("li");
        row.className = "clipboard-workbench-file-row";
        row.textContent = filePath;
        listNode.appendChild(row);
      });
      preview.appendChild(listNode);
    } else if (activeItem.assetUrl) {
      const image = document.createElement("img");
      image.className = "clipboard-workbench-preview-image";
      image.src = activeItem.assetUrl;
      image.alt = activeItem.summary;
      preview.appendChild(image);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "clipboard-workbench-image-placeholder";
      placeholder.textContent = "当前没有可预览图片。";
      preview.appendChild(placeholder);
    }
    detail.appendChild(preview);

    const metaGrid = document.createElement("div");
    metaGrid.className = "clipboard-workbench-detail-grid";
    [
      { label: "摘要", value: activeItem.summary },
      { label: "更新时间", value: formatClipboardWorkbenchTime(activeItem.updatedAt) },
      { label: "创建时间", value: formatClipboardWorkbenchTime(activeItem.createdAt) },
      {
        label: "标签",
        value: activeItem.tags.length > 0 ? activeItem.tags.join(", ") : "无"
      }
    ].forEach((entry) => {
      const row = document.createElement("div");
      row.className = "clipboard-workbench-detail-row";
      const label = document.createElement("div");
      label.className = "clipboard-workbench-detail-label";
      label.textContent = entry.label;
      const value = document.createElement("div");
      value.className = "clipboard-workbench-detail-value";
      value.textContent = entry.value;
      row.append(label, value);
      metaGrid.appendChild(row);
    });
    detail.appendChild(metaGrid);

    const note = document.createElement("div");
    note.className = "clipboard-workbench-note";
    note.textContent = activeItem.note || "暂未为这条记录保存备注。";
    detail.appendChild(note);

    const detailActions = document.createElement("div");
    detailActions.className = "clipboard-workbench-detail-actions";

    const restoreButton = document.createElement("button");
    restoreButton.type = "button";
    restoreButton.className = "settings-btn settings-btn-primary";
    restoreButton.textContent = "恢复到剪贴板";
    restoreButton.addEventListener("click", () => {
      void executeClipboardWorkbenchAction("restore-item", {
        itemId: activeItem.id
      });
    });

    const batchButton = document.createElement("button");
    batchButton.type = "button";
    batchButton.className = "settings-btn settings-btn-secondary";
    batchButton.textContent = isClipboardWorkbenchItemSelected(activeItem.id)
      ? "移出批量"
      : "加入批量";
    batchButton.addEventListener("click", () => {
      toggleClipboardWorkbenchItemSelection(activeItem.id);
    });

    detailActions.append(restoreButton, batchButton);
    detail.appendChild(detailActions);
  }

  export function createClipboardWorkbenchBulkBar(
    selectedItems: ClipboardWorkbenchPanelItemView[]
  ): HTMLDivElement {
    const selectedItemIds = selectedItems.map((item) => item.id);
    const canMergeSelectedItems =
      selectedItems.length > 0 &&
      (selectedItems.every((item) => item.kind === "text") ||
        selectedItems.every((item) => item.kind === "files"));

    const bulkBar = document.createElement("div");
    bulkBar.className = "clipboard-workbench-bulk-bar";

    const bulkMeta = document.createElement("div");
    bulkMeta.className = "clipboard-workbench-bulk-meta";
    bulkMeta.textContent = `${selectedItems.length} 条已选`;

    const bulkActions = document.createElement("div");
    bulkActions.className = "clipboard-workbench-bulk-actions";

    const sequentialButton = document.createElement("button");
    sequentialButton.type = "button";
    sequentialButton.className = "settings-btn settings-btn-primary";
    sequentialButton.dataset.clipboardWorkbenchBulkAction = "sequential";
    sequentialButton.textContent = "顺序粘贴";
    sequentialButton.addEventListener("click", () => {
      void executeClipboardWorkbenchAction("paste-batch", {
        itemIds: selectedItemIds,
        pasteMode: "sequential"
      });
    });

    const mergeButton = document.createElement("button");
    mergeButton.type = "button";
    mergeButton.className = "settings-btn settings-btn-secondary";
    mergeButton.dataset.clipboardWorkbenchBulkAction = "merge-once";
    mergeButton.textContent = "合并一次";
    mergeButton.disabled = !canMergeSelectedItems;
    mergeButton.addEventListener("click", () => {
      void executeClipboardWorkbenchAction("paste-batch", {
        itemIds: selectedItemIds,
        pasteMode: "merge-once",
        mergeSeparatorMode: "newline"
      });
    });

    const clearSelectionButton = document.createElement("button");
    clearSelectionButton.type = "button";
    clearSelectionButton.className = "settings-btn settings-btn-secondary";
    clearSelectionButton.textContent = "清空选择";
    clearSelectionButton.addEventListener("click", () => {
      clearClipboardWorkbenchSelection();
    });

    bulkActions.append(sequentialButton, mergeButton, clearSelectionButton);
    bulkBar.append(bulkMeta, bulkActions);

    if (!canMergeSelectedItems) {
      const bulkNote = document.createElement("div");
      bulkNote.className = "clipboard-workbench-note";
      bulkNote.textContent = "合并粘贴目前仅支持纯文本或纯文件路径记录。";
      bulkBar.appendChild(bulkNote);
    }

    return bulkBar;
  }

  export function refreshClipboardWorkbenchDetail(): void {
    const detail = getClipboardWorkbenchForm()?.querySelector<HTMLElement>(
      ".clipboard-workbench-detail"
    );
    if (!detail) {
      renderList();
      return;
    }

    clearClipboardWorkbenchDetailNode(detail);
    appendClipboardWorkbenchDetailContent(detail, getClipboardWorkbenchActiveItem());
  }

  export function refreshClipboardWorkbenchBulkBar(): void {
    const listSection = getClipboardWorkbenchForm()?.querySelector<HTMLElement>(
      ".clipboard-workbench-list"
    );
    if (!listSection) {
      return;
    }

    listSection.querySelector(".clipboard-workbench-bulk-bar")?.remove();
    const selectedItems = getClipboardWorkbenchSelectedItems();
    if (selectedItems.length > 0) {
      listSection.appendChild(createClipboardWorkbenchBulkBar(selectedItems));
    }
  }

  export function updateClipboardWorkbenchActiveItem(previousId: string, nextId: string): void {
    const form = getClipboardWorkbenchForm();
    if (!form) {
      renderList();
      return;
    }

    if (previousId) {
      const previousCard = form.querySelector<HTMLElement>(
        `.clipboard-workbench-item[data-clipboard-workbench-item-id="${CSS.escape(previousId)}"]`
      );
      const previousButton = previousCard?.querySelector<HTMLElement>(
        ".clipboard-workbench-item-main"
      );
      previousCard?.setAttribute("data-active", "false");
      previousButton?.setAttribute("data-selected", "false");
    }

    if (nextId) {
      const nextCard = form.querySelector<HTMLElement>(
        `.clipboard-workbench-item[data-clipboard-workbench-item-id="${CSS.escape(nextId)}"]`
      );
      const nextButton = nextCard?.querySelector<HTMLElement>(
        ".clipboard-workbench-item-main"
      );
      nextCard?.setAttribute("data-active", "true");
      nextButton?.setAttribute("data-selected", "true");
      nextButton?.scrollIntoView({ block: "nearest" });
    }

    refreshClipboardWorkbenchDetail();
    refreshClipboardWorkbenchListMeta();
  }

  export function syncClipboardWorkbenchSelectionUi(): void {
    if (!getClipboardWorkbenchForm()) {
      renderList();
      return;
    }

    updateClipboardWorkbenchItemMarkedStates();
    refreshClipboardWorkbenchListMeta();
    refreshClipboardWorkbenchDetail();
    refreshClipboardWorkbenchBulkBar();
  }

  export function refreshClipboardWorkbenchPanelAfterPayload(
    previousItems: ClipboardWorkbenchPanelItemView[],
    action: string
  ): void {
    if (shouldFullyRerenderClipboardWorkbenchPanel(previousItems)) {
      renderList();
      return;
    }

    if (action === "restore-item") {
      syncClipboardWorkbenchSelectionUi();
      return;
    }

    renderList();
  }

  export async function executeClipboardWorkbenchAction(
    action: string,
    actionParams: Record<string, string | string[]> = {}
  ): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("启动器桥接暂不可用。");
      return;
    }

    const params = new URLSearchParams();
    params.set("action", action);
    Object.entries(actionParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value
          .map((entry) => entry.trim())
          .filter(Boolean)
          .forEach((entry) => {
            params.append(key, entry);
          });
        return;
      }

      const nextValue = value.trim();
      if (nextValue) {
        params.set(key, nextValue);
      }
    });
    const result = await launcher.execute({
      id: `plugin:${CLIPBOARD_WORKBENCH_PLUGIN_ID}:${action}`,
      type: "command",
      title: "剪贴板工作台",
      subtitle: "面板操作",
      target: `command:plugin:${CLIPBOARD_WORKBENCH_PLUGIN_ID}?${params.toString()}`,
      keywords: ["plugin", "clipboard", "workbench"]
    });

    if (!result.ok) {
      setStatus(result.message ?? "剪贴板工作台操作失败。");
      return;
    }

    if (activePluginPanel) {
      const previousItems = clipboardWorkbenchPanelData.items;
      activePluginPanel.data = result.data ?? activePluginPanel.data;
      window.__LL_PANEL_IMPLS__?.applyClipboardWorkbenchPanelPayload(activePluginPanel);
      if (action === "save-manual-text") {
        const manualText = actionParams.manualText;
        if (typeof manualText === "string" && manualText.trim()) {
          clipboardWorkbenchManualTextDraft = "";
        }
      }
      refreshClipboardWorkbenchPanelAfterPayload(previousItems, action);
    }

    setStatus(result.message ?? "剪贴板工作台已更新。");
  }

  export function syncWebtoolsImagePromptSmartTemplateSelection(container: HTMLElement): void {
    container
      .querySelectorAll<HTMLButtonElement>("[data-webtools-image-prompt-smart-template]")
      .forEach((button) => {
        button.dataset.selected = String(button.value === webtoolsImagePromptSmartTemplateId);
      });
  }

  export let hardwareInspectorSnapshot: HardwareInspectorSnapshot | null = null;

  export let hardwareInspectorLastSnapshot: HardwareInspectorSnapshot | null = null;

  export let hardwareInspectorDiffState: HardwareInspectorDiffState | null = null;

  export let hardwareInspectorInfo = "";

  export let hardwareInspectorError = "";

  export let hardwareInspectorLoading = false;

  export let hardwareInspectorExporting = false;

  export let hardwareInspectorRequestToken = 0;

  export let hardwareInspectorExpandedDiskKeys = new Set<string>();

  export let hardwareInspectorPreviewImageUrl = "";

  export let hardwareInspectorPreviewLoading = false;

  export let hardwareInspectorPreviewError = "";

  export let hardwareInspectorPreviewRequestToken = 0;

  export function applyClipboardWorkbenchPanelPayload(panel: ActivePluginPanelState): void {
      clipboardWorkbenchPanelData = normalizeClipboardWorkbenchPanelData(panel.data);
      clipboardWorkbenchSearchDraft = clipboardWorkbenchPanelData.query.search;
      ensureClipboardWorkbenchSelection();
    }

  export function renderClipboardWorkbenchPanel(): void {
      ensureClipboardWorkbenchSelection();
      const selectedItems = getClipboardWorkbenchSelectedItems();
      const activeItem = getClipboardWorkbenchActiveItem();

      const panelItem = document.createElement("li");
      panelItem.className = "settings-panel-item";

      const panel = document.createElement("section");
      panel.className = "settings-panel clipboard-workbench-panel";

      const form = document.createElement("form");
      form.className = "settings-form clipboard-workbench-form";
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        void executeClipboardWorkbenchAction(
          "refresh",
          buildClipboardWorkbenchQueryParams()
        );
      });

      const shell = document.createElement("div");
      shell.className = "clipboard-workbench-shell";

      const toolbar = document.createElement("div");
      toolbar.className = "clipboard-workbench-toolbar";

      const toolbarHead = document.createElement("div");
      toolbarHead.className = "clipboard-workbench-toolbar-head";
      const title = document.createElement("h3");
      title.className = "settings-title";
      title.textContent = activePluginPanel?.title || "剪贴板工作台";
      const description = document.createElement("p");
      description.className = "settings-description";
      description.textContent =
        activePluginPanel?.subtitle ||
        "搜索并查看文本、图片与文件列表的剪贴板记录。";
      toolbarHead.append(title, description);

      const toolbarMeta = document.createElement("div");
      toolbarMeta.className = "clipboard-workbench-toolbar-meta";
      toolbarMeta.append(
        createClipboardWorkbenchBadge(
          clipboardWorkbenchPanelData.settings.autoCollect
            ? "自动采集开启"
            : "自动采集暂停",
          clipboardWorkbenchPanelData.settings.autoCollect ? "success" : "warning"
        ),
        createClipboardWorkbenchBadge(
          clipboardWorkbenchPanelData.settings.sensitiveMode
            ? "敏感模式开启"
            : "敏感模式关闭",
          clipboardWorkbenchPanelData.settings.sensitiveMode ? "warning" : "neutral"
        ),
        createClipboardWorkbenchBadge(
          `上限 ${clipboardWorkbenchPanelData.settings.maxItems}`,
          "accent"
        )
      );

      const toolbarStats = document.createElement("div");
      toolbarStats.className = "clipboard-workbench-toolbar-stats";
      [
        {
          label: "条目",
          value: String(clipboardWorkbenchPanelData.stats.totalItems)
        },
        {
          label: "容量",
          value: formatClipboardWorkbenchBytes(
            clipboardWorkbenchPanelData.stats.totalBytes
          )
        },
        {
          label: "搜索",
          value: clipboardWorkbenchPanelData.query.search.trim() || "无"
        }
      ].forEach((entry) => {
        const card = document.createElement("div");
        card.className = "clipboard-workbench-stat";
        const statLabel = document.createElement("div");
        statLabel.className = "clipboard-workbench-stat-label";
        statLabel.textContent = entry.label;
        const statValue = document.createElement("div");
        statValue.className = "clipboard-workbench-stat-value";
        statValue.textContent = entry.value;
        card.append(statLabel, statValue);
        toolbarStats.appendChild(card);
      });

      const toolbarControls = document.createElement("div");
      toolbarControls.className = "clipboard-workbench-toolbar-controls";

      const searchRow = document.createElement("div");
      searchRow.className = "clipboard-workbench-search-row";
      const searchInput = document.createElement("input");
      searchInput.className = "settings-value clipboard-workbench-search-input";
      searchInput.name = "clipboardWorkbenchSearch";
      searchInput.type = "text";
      searchInput.placeholder = "搜索摘要、备注、标签和文件路径";
      searchInput.value = clipboardWorkbenchSearchDraft;
      searchInput.addEventListener("input", () => {
        clipboardWorkbenchSearchDraft = searchInput.value;
      });
      const searchButton = document.createElement("button");
      searchButton.type = "submit";
      searchButton.className = "settings-btn settings-btn-primary";
      searchButton.textContent = "搜索";
      const clearSearchButton = document.createElement("button");
      clearSearchButton.type = "button";
      clearSearchButton.className = "settings-btn settings-btn-secondary";
      clearSearchButton.textContent = "清空";
      clearSearchButton.addEventListener("click", () => {
        clipboardWorkbenchSearchDraft = "";
        void executeClipboardWorkbenchAction(
          "refresh",
          buildClipboardWorkbenchQueryParams({ search: "", groupId: "" })
        );
      });
      searchRow.append(searchInput, searchButton, clearSearchButton);

      const toolbarActions = document.createElement("div");
      toolbarActions.className = "clipboard-workbench-toolbar-actions";

      const refreshButton = document.createElement("button");
      refreshButton.type = "button";
      refreshButton.className = "settings-btn settings-btn-secondary";
      refreshButton.textContent = "刷新";
      refreshButton.addEventListener("click", () => {
        void executeClipboardWorkbenchAction(
          "refresh",
          buildClipboardWorkbenchQueryParams()
        );
      });

      const saveCurrentButton = document.createElement("button");
      saveCurrentButton.type = "button";
      saveCurrentButton.className = "settings-btn settings-btn-secondary";
      saveCurrentButton.textContent = "保存当前剪贴板";
      saveCurrentButton.addEventListener("click", () => {
        void executeClipboardWorkbenchAction("save-current");
      });

      const toggleCollectButton = document.createElement("button");
      toggleCollectButton.type = "button";
      toggleCollectButton.className = "settings-btn settings-btn-secondary";
      toggleCollectButton.textContent = clipboardWorkbenchPanelData.settings.autoCollect
        ? "暂停采集"
        : "恢复采集";
      toggleCollectButton.addEventListener("click", () => {
        void executeClipboardWorkbenchAction("toggle-collect");
      });

      const toggleSensitiveButton = document.createElement("button");
      toggleSensitiveButton.type = "button";
      toggleSensitiveButton.className = "settings-btn settings-btn-secondary";
      toggleSensitiveButton.textContent = clipboardWorkbenchPanelData.settings.sensitiveMode
        ? "关闭敏感模式"
        : "开启敏感模式";
      toggleSensitiveButton.addEventListener("click", () => {
        void executeClipboardWorkbenchAction("toggle-sensitive");
      });

      toolbarActions.append(
        refreshButton,
        saveCurrentButton,
        toggleCollectButton,
        toggleSensitiveButton
      );

      const composer = document.createElement("div");
      composer.className = "clipboard-workbench-composer";
      const composerTitle = document.createElement("div");
      composerTitle.className = "clipboard-workbench-section-title";
      composerTitle.textContent = "手动文本草稿";

      const manualTextInput = document.createElement("textarea");
      manualTextInput.className = "settings-textarea clipboard-workbench-manual-text";
      manualTextInput.name = "clipboardWorkbenchManualText";
      manualTextInput.placeholder = "输入或粘贴文本后保存到工作台。";
      manualTextInput.value = clipboardWorkbenchManualTextDraft;

      const composerRow = document.createElement("div");
      composerRow.className = "clipboard-workbench-composer-row";
      const saveManualButton = document.createElement("button");
      saveManualButton.type = "button";
      saveManualButton.className = "settings-btn settings-btn-primary";
      saveManualButton.dataset.clipboardWorkbenchSaveManual = "1";
      saveManualButton.textContent = "保存草稿";
      saveManualButton.disabled = clipboardWorkbenchManualTextDraft.trim().length === 0;

      manualTextInput.addEventListener("input", () => {
        clipboardWorkbenchManualTextDraft = manualTextInput.value;
        saveManualButton.disabled = clipboardWorkbenchManualTextDraft.trim().length === 0;
      });
      saveManualButton.addEventListener("click", () => {
        void executeClipboardWorkbenchAction("save-manual-text", {
          manualText: clipboardWorkbenchManualTextDraft
        });
      });
      composerRow.append(manualTextInput, saveManualButton);
      composer.append(composerTitle, composerRow);

      toolbarControls.append(searchRow, toolbarActions, composer);
      toolbar.append(toolbarHead, toolbarMeta, toolbarStats, toolbarControls);

      const rail = document.createElement("aside");
      rail.className = "clipboard-workbench-rail";
      const railTitle = document.createElement("div");
      railTitle.className = "clipboard-workbench-section-title";
      railTitle.textContent = "视图";
      rail.appendChild(railTitle);

      const scopeList = document.createElement("div");
      scopeList.className = "clipboard-workbench-scope-list";
      CLIPBOARD_WORKBENCH_SCOPE_OPTIONS.forEach((scope) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "clipboard-workbench-scope-btn";
        button.dataset.selected = String(
          clipboardWorkbenchPanelData.query.scope === scope.key
        );
        button.textContent = scope.label;
        button.addEventListener("click", () => {
          const nextScope =
            clipboardWorkbenchPanelData.query.scope === scope.key ? "all" : scope.key;
          void executeClipboardWorkbenchAction(
            "refresh",
            buildClipboardWorkbenchQueryParams({ scope: nextScope, groupId: "" })
          );
        });
        scopeList.appendChild(button);
      });
      rail.appendChild(scopeList);

      const groupTitle = document.createElement("div");
      groupTitle.className = "clipboard-workbench-section-title";
      groupTitle.textContent = "分组";
      rail.appendChild(groupTitle);

      const groupList = document.createElement("div");
      groupList.className = "clipboard-workbench-group-list";
      if (clipboardWorkbenchPanelData.groups.length === 0) {
        const empty = document.createElement("div");
        empty.className = "clipboard-workbench-empty";
        empty.textContent = "暂无分组。";
        groupList.appendChild(empty);
      } else {
        clipboardWorkbenchPanelData.groups.forEach((group) => {
          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = "clipboard-workbench-group-chip";
          chip.dataset.selected = String(
            clipboardWorkbenchPanelData.query.groupId === group.id
          );
          chip.textContent = `${group.name} (${group.count})`;
          chip.addEventListener("click", () => {
            const nextGroupId =
              clipboardWorkbenchPanelData.query.groupId === group.id ? "" : group.id;
            void executeClipboardWorkbenchAction(
              "refresh",
              buildClipboardWorkbenchQueryParams({ groupId: nextGroupId })
            );
          });
          groupList.appendChild(chip);
        });
      }
      rail.appendChild(groupList);

      const listSection = document.createElement("section");
      listSection.className = "clipboard-workbench-list";
      const listHeader = document.createElement("div");
      listHeader.className = "clipboard-workbench-list-head";
      const listTitle = document.createElement("div");
      listTitle.className = "clipboard-workbench-section-title";
      listTitle.textContent = "记录";
      const listMeta = document.createElement("div");
      listMeta.className = "clipboard-workbench-list-meta";
      listMeta.textContent =
        selectedItems.length > 0
          ? `${clipboardWorkbenchPanelData.items.length} 条可见 · ${selectedItems.length} 条已选`
          : `${clipboardWorkbenchPanelData.items.length} 条可见`;
      listHeader.append(listTitle, listMeta);
      listSection.appendChild(listHeader);

      const itemList = document.createElement("div");
      itemList.className = "clipboard-workbench-item-list";
      if (clipboardWorkbenchPanelData.items.length === 0) {
        const empty = document.createElement("div");
        empty.className = "clipboard-workbench-empty";
        empty.textContent = "暂时还没有剪贴板记录。";
        itemList.appendChild(empty);
      } else {
        clipboardWorkbenchPanelData.items.forEach((item) => {
          const selected = isClipboardWorkbenchItemSelected(item.id);

          const card = document.createElement("article");
          card.className = "clipboard-workbench-item";
          card.dataset.active = String(item.id === clipboardWorkbenchActiveItemId);
          card.dataset.marked = String(selected);
          card.dataset.clipboardWorkbenchItemId = item.id;

          const button = document.createElement("button");
          button.type = "button";
          button.className = "clipboard-workbench-item-main";
          button.dataset.selected = String(item.id === clipboardWorkbenchActiveItemId);
          button.addEventListener("click", () => {
            const previousActiveId = clipboardWorkbenchActiveItemId;
            clipboardWorkbenchActiveItemId = item.id;
            updateClipboardWorkbenchActiveItem(previousActiveId, item.id);
          });

          if (item.kind === "image" && item.assetUrl) {
            const thumb = document.createElement("img");
            thumb.className = "clipboard-workbench-item-thumb";
            thumb.src = item.assetUrl;
            thumb.alt = item.summary;
            thumb.loading = "lazy";
            card.appendChild(thumb);
          }

          const itemTitle = document.createElement("div");
          itemTitle.className = "clipboard-workbench-item-title";
          itemTitle.textContent = item.title || item.summary;
          itemTitle.title = item.title || item.summary;

          const itemFoot = document.createElement("div");
          itemFoot.className = "clipboard-workbench-item-foot";
          itemFoot.textContent = formatClipboardWorkbenchTime(item.updatedAt);

          button.append(itemTitle, itemFoot);

          const copyButton = document.createElement("button");
          copyButton.type = "button";
          copyButton.className = "clipboard-workbench-item-copy";
          copyButton.dataset.clipboardWorkbenchItemCopy = item.id;
          copyButton.textContent = "复制";
          copyButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            clipboardWorkbenchActiveItemId = item.id;
            void executeClipboardWorkbenchAction("restore-item", {
              itemId: item.id
            });
          });

          card.append(button, copyButton);
          itemList.appendChild(card);
        });
      }
      listSection.appendChild(itemList);

      if (selectedItems.length > 0) {
        listSection.appendChild(createClipboardWorkbenchBulkBar(selectedItems));
      }

      const detail = document.createElement("aside");
      detail.className = "clipboard-workbench-detail";
      appendClipboardWorkbenchDetailContent(detail, activeItem);

      shell.append(toolbar, rail, listSection, detail);
      form.appendChild(shell);
      panel.appendChild(form);
      panelItem.appendChild(panel);
      list.appendChild(panelItem);
    }

}
