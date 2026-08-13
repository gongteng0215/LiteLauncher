function parseSearchQuery(rawQuery: string): ParsedSearchQuery {
  const trimmed = rawQuery.trim();
  const lower = trimmed.toLowerCase();

  for (const rule of SEARCH_SCOPE_PREFIX_RULES) {
    for (const prefix of rule.prefixes) {
      if (!lower.startsWith(prefix.toLowerCase())) {
        continue;
      }

      return {
        rawQuery,
        query: trimmed.slice(prefix.length).trim(),
        scope: rule.scope,
        scopeLabel: rule.label,
        explicitScope: true
      };
    }
  }

  return {
    rawQuery,
    query: trimmed,
    scope: "all",
    scopeLabel: "全部",
    explicitScope: false
  };
}

function getLoadingMessage(nextMode: PanelMode, query: string): string {
  if (nextMode === "search") {
    const parsed = parseSearchQuery(query);
    if (!query.trim()) {
      return "正在加载首页...";
    }
    if (parsed.explicitScope) {
      return `正在检索${parsed.scopeLabel}...`;
    }
    return "正在检索...";
  }

  if (nextMode === "clip") {
    return "正在加载剪贴板...";
  }

  return "正在加载...";
}

function formatErrorDetail(input: unknown): string | undefined {
  if (input === null || input === undefined) {
    return undefined;
  }

  if (input instanceof Error) {
    return `${input.message}${input.stack ? `\n${input.stack}` : ""}`;
  }

  const text = String(input);
  return text.trim() ? text : undefined;
}

function formatErrorLogDate(value: number): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "无效时间";
  }
  return date.toLocaleString();
}

function parseErrorLogContext(
  context: string | undefined
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!context) {
    return result;
  }

  for (const part of context.split(/\s+/)) {
    const [key, ...rest] = part.split("=");
    const value = rest.join("=").trim();
    if (!key || !value) {
      continue;
    }
    result[key.trim()] = value;
  }

  return result;
}

function formatPinErrorReasonText(reason: string | undefined): string {
  switch ((reason ?? "").trim()) {
    case "empty-item-id":
      return "\u65e0\u6548\u9879\u76ee";
    case "missing-catalog-item":
      return "\u5f53\u524d\u7ed3\u679c\u5df2\u8fc7\u671f\uff0c\u8bf7\u91cd\u65b0\u641c\u7d22";
    case "invalid-pin-path":
      return "\u8def\u5f84\u65e0\u6548\u6216\u4e0d\u5b58\u5728";
    case "persist-failed":
      return "\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5";
    default:
      return "\u672a\u77e5\u539f\u56e0";
  }
}

function isLauncherTopmostDiagnosticEntry(entry: AppErrorLogEntry): boolean {
  return [
    "Launcher topmost recovery diagnostic",
    "Launcher lost always-on-top state",
    "Launcher blurred shortly after showing"
  ].includes(entry.message);
}

function isPinDiagnosticEntry(entry: AppErrorLogEntry): boolean {
  return ["Pin request rejected", "Pin request failed"].includes(entry.message);
}

function formatLauncherTriggerText(trigger: string | undefined): string {
  switch ((trigger ?? "").trim()) {
    case "global-shortcut":
      return "全局快捷键";
    case "tray-click":
      return "托盘单击";
    case "tray-menu":
      return "托盘菜单";
    case "tray-double-click":
      return "托盘双击";
    case "startup-e2e":
      return "E2E 启动";
    case "second-instance":
      return "重复启动拉起";
    case "second-instance-dev-reload":
      return "开发态重载后拉起";
    case "manual":
    default:
      return "手动显示";
  }
}

function formatLauncherPhaseText(phase: string | undefined): string {
  switch ((phase ?? "").trim()) {
    case "always-on-top-changed":
      return "置顶状态掉线";
    case "window-blur-after-show":
      return "显示后快速失焦";
    case "show-immediate-state":
      return "显示后立即状态异常";
    case "show-recovery-state":
      return "恢复重试后仍异常";
    case "show-recovery-skipped":
      return "恢复重试未执行";
    default:
      return "置顶诊断";
  }
}

function formatLauncherTopmostDiagnosticSummary(entry: AppErrorLogEntry): string {
  const contextMap = parseErrorLogContext(entry.context);
  const trigger = formatLauncherTriggerText(contextMap.trigger);
  const phase = formatLauncherPhaseText(contextMap.phase);
  const state = [
    contextMap.visible ? `可见 ${contextMap.visible === "1" ? "是" : "否"}` : "",
    contextMap.alwaysOnTop
      ? `置顶 ${contextMap.alwaysOnTop === "1" ? "是" : "否"}`
      : "",
    contextMap.focused ? `聚焦 ${contextMap.focused === "1" ? "是" : "否"}` : ""
  ]
    .filter(Boolean)
    .join(" / ");
  const ageText =
    contextMap.showAgeMs && contextMap.showAgeMs !== "-1"
      ? `显示后 ${contextMap.showAgeMs}ms`
      : "";
  const note = entry.detail?.trim() ? entry.detail.trim() : undefined;

  return [
    `[${formatErrorLogDate(entry.createdAt)}] ${phase}`,
    `触发来源: ${trigger}`,
    ageText,
    state ? `窗口状态: ${state}` : "",
    note ? `详情: ${note}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function formatPinDiagnosticSummary(entry: AppErrorLogEntry): string {
  const contextMap = parseErrorLogContext(entry.context);
  const itemId =
    contextMap.itemId === "(empty)"
      ? "（空）"
      : contextMap.itemId || "未知项目";
  const action = contextMap.pinned === "0" ? "取消置顶" : "置顶";

  if (entry.message === "Pin request rejected") {
    const reasonCode = entry.detail?.match(/reason=([a-z-]+)/i)?.[1];
    return [
      `[${formatErrorLogDate(entry.createdAt)}] ${action}请求已拒绝`,
      `项目: ${itemId}`,
      `原因: ${formatPinErrorReasonText(reasonCode)}`
    ].join("\n");
  }

  return [
    `[${formatErrorLogDate(entry.createdAt)}] ${action}保存失败`,
    `项目: ${itemId}`,
    "原因: 保存失败，请重试",
    entry.detail ? `详情: ${entry.detail}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function getLauncherTopmostDiagnosticEntries(
  entries: AppErrorLogEntry[]
): AppErrorLogEntry[] {
  return entries.filter((entry) => isLauncherTopmostDiagnosticEntry(entry)).slice(0, 5);
}

function getPinDiagnosticEntries(entries: AppErrorLogEntry[]): AppErrorLogEntry[] {
  return entries.filter((entry) => isPinDiagnosticEntry(entry)).slice(0, 5);
}

function formatErrorLogEntry(entry: AppErrorLogEntry): string {
  const contextMap = parseErrorLogContext(entry.context);
  const itemId =
    contextMap.itemId === "(empty)"
      ? "\uff08\u7a7a\uff09"
      : contextMap.itemId;
  const action =
    contextMap.pinned === "0"
      ? "\u53d6\u6d88\u7f6e\u9876"
      : "\u7f6e\u9876";

  if (entry.message === "Pin request rejected") {
    const reasonCode = entry.detail?.match(/reason=([a-z-]+)/i)?.[1];
    return [
      `[${formatErrorLogDate(entry.createdAt)}] [${entry.level}] [${entry.scope}] ${action}\u8bf7\u6c42\u5df2\u62d2\u7edd`,
      itemId ? `\u9879\u76ee: ${itemId}` : "",
      `\u539f\u56e0: ${formatPinErrorReasonText(reasonCode)}`
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (entry.message === "Pin request failed") {
    return [
      `[${formatErrorLogDate(entry.createdAt)}] [${entry.level}] [${entry.scope}] ${action}\u4fdd\u5b58\u5931\u8d25`,
      itemId ? `\u9879\u76ee: ${itemId}` : "",
      "\u539f\u56e0: \u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5",
      entry.detail ? `\u8be6\u60c5: ${entry.detail}` : ""
    ]
      .filter(Boolean)
      .join("\n");
  }

  const head = `[${formatErrorLogDate(entry.createdAt)}] [${
    entry.level
  }] [${entry.scope}] ${entry.message}`;
  const context = entry.context ? `上下文: ${entry.context}` : "";
  const detail = entry.detail ? `详情: ${entry.detail}` : "";
  return [head, context, detail].filter(Boolean).join("\n");
}

function formatErrorLogs(entries: AppErrorLogEntry[]): string {
  if (entries.length === 0) {
    return "暂无错误日志";
  }

  return entries.map((entry) => formatErrorLogEntry(entry)).join("\n\n");
}

function formatAppUpdaterStatusSummary(status: AppUpdaterStatus): string {
  if (status.phase === "error") {
    return status.message ?? "检查更新失败";
  }

  if (!status.supported) {
    return status.message ?? "当前环境暂不支持自动更新";
  }

  switch (status.phase) {
    case "checking":
      return "正在检查更新";
    case "available":
      return status.updateVersion
        ? `发现新版本 v${status.updateVersion}，正在准备下载`
        : "发现新版本，正在准备下载";
    case "downloading":
      return typeof status.progressPercent === "number"
        ? `正在下载更新 ${Math.round(status.progressPercent)}%`
        : "正在下载更新";
    case "downloaded":
      return status.updateVersion
        ? `新版本 v${status.updateVersion} 已下载完成`
        : "新版本已下载完成";
    case "not-available":
      return "当前已是最新版本";
    case "idle":
    case "unsupported":
    default:
      return status.message ?? "可手动检查更新";
  }
}

function formatAppUpdaterPhaseText(status: AppUpdaterStatus): string {
  if (status.phase === "error") {
    return "检查失败";
  }

  if (!status.supported) {
    return "当前环境不支持";
  }

  switch (status.phase) {
    case "checking":
      return "正在检查";
    case "available":
      return status.updateVersion ? `发现 v${status.updateVersion}` : "发现新版本";
    case "downloading":
      return typeof status.progressPercent === "number"
        ? `下载中 ${Math.round(status.progressPercent)}%`
        : "下载中";
    case "downloaded":
      return status.updateVersion ? `已下载 v${status.updateVersion}` : "安装包已就绪";
    case "not-available":
      return "已是最新版本";
    case "idle":
      return "等待检查";
    case "unsupported":
    default:
      return "手动更新";
  }
}

function formatAppUpdaterDiagnosticDetails(
  status: AppUpdaterStatus
): Array<{ label: string; value: string }> {
  const supportValue = !status.supported
    ? "自动更新未启用，当前环境暂不支持"
    : status.autoUpdateEnabled
      ? "自动更新已启用"
      : "自动更新未启用，请前往 GitHub Releases 手动安装";
  const diagnosticValue = status.message?.trim()
    ? status.message.trim()
    : status.phase === "not-available"
      ? "GitHub Releases 未发现比当前版本更新的安装包"
      : status.phase === "downloaded"
        ? "安装包已下载完成，可立即安装并重启"
        : "可在此页手动检查最新版本";

  return [
    {
      label: "当前版本",
      value: status.currentVersion ? `v${status.currentVersion}` : "未知版本"
    },
    {
      label: "目标版本",
      value: status.updateVersion ? `v${status.updateVersion}` : "尚未检测到"
    },
    {
      label: "自动更新",
      value: supportValue
    },
    {
      label: "最近阶段",
      value: formatAppUpdaterPhaseText(status)
    },
    {
      label: "诊断信息",
      value: diagnosticValue
    }
  ];
}

function formatAppUpdaterDiagnosticsForClipboard(status: AppUpdaterStatus): string {
  return [
    "LiteLauncher 自动更新诊断",
    ...formatAppUpdaterDiagnosticDetails(status).map(
      (detail) => `${detail.label}: ${detail.value}`
    )
  ].join("\n");
}

function formatAppUpdaterActionHint(status: AppUpdaterStatus): string {
  if (status.phase === "error") {
    return status.message ?? "可稍后再次检查";
  }

  if (!status.supported) {
    return status.message ?? "当前环境暂不支持自动更新";
  }

  if (status.phase === "downloaded" && status.downloaded) {
    return "更新包已就绪，可立即安装并重启";
  }

  if (status.phase === "downloading") {
    return "后台下载完成后可直接安装";
  }

  if (status.phase === "not-available") {
    return "GitHub Releases 未发现更新";
  }

  return "Windows NSIS 安装版与 macOS 打包版支持自动更新，不支持时请前往 GitHub Releases 手动下载";
}

async function checkForAppUpdatesFromSettings(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.checkForAppUpdates) {
    setStatus("桥接层未加载，无法检查更新");
    return;
  }

  setStatus("正在检查更新...");
  try {
    appUpdaterStatus = await launcher.checkForAppUpdates();
    setStatus(`自动更新：${formatAppUpdaterStatusSummary(appUpdaterStatus)}`);
  } catch {
    try {
      appUpdaterStatus = await launcher.getAppUpdaterStatus();
    } catch {
      appUpdaterStatus = {
        ...appUpdaterStatus,
        phase: "error",
        downloaded: false,
        progressPercent: undefined,
        message: "检查更新失败"
      };
    }
    setStatus("检查更新失败");
  }

  refreshOpenSettingsOverlay();
}

async function installAppUpdateNowFromSettings(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher?.installAppUpdateNow) {
    setStatus("桥接层未加载，无法安装更新");
    return;
  }

  try {
    const ok = await launcher.installAppUpdateNow();
    if (!ok) {
      setStatus("更新尚未下载完成，暂不能安装");
      return;
    }

    setStatus("正在安装更新并重启...");
  } catch {
    setStatus("安装更新失败");
  }
}

function formatPinnedToggleStatus(
  title: string,
  result: PinToggleResult
): string {
  if (result.ok) {
    return result.pinned ? `已置顶：${title}` : `已取消置顶：${title}`;
  }

  const prefix = result.pinned ? "置顶" : "取消置顶";
  switch (result.reason) {
    case "empty-item-id":
      return `${prefix}失败：无效项目`;
    case "missing-catalog-item":
      return `${prefix}失败：当前结果已过期，请重新搜索`;
    case "invalid-pin-path":
      return `${prefix}失败：路径无效或不存在`;
    case "persist-failed":
      return `${prefix}失败：保存失败，请重试`;
    default:
      return `${prefix}失败`;
  }
}

async function reportErrorLog(input: AppErrorLogInput): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher || !launcher.reportErrorLog) {
    return;
  }

  const message = String(input.message ?? "").trim();
  if (!message) {
    return;
  }

  const payload: AppErrorLogInput = {
    scope: input.scope,
    level: input.level === "warn" ? "warn" : "error",
    message,
    context: input.context ? String(input.context) : undefined,
    detail: input.detail ? String(input.detail) : undefined
  };

  try {
    await launcher.reportErrorLog(payload);
  } catch {
    // Ignore logging failures to avoid recursive errors.
  }
}

async function refreshErrorLogs(limit = 40): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher || !launcher.getErrorLogs) {
    errorLogEntries = [];
    return;
  }

  try {
    errorLogEntries = await launcher.getErrorLogs(limit);
  } catch {
    errorLogEntries = [];
  }
}

async function clearErrorLogsFromSettings(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher || !launcher.clearErrorLogs) {
    setStatus("桥接层未加载，无法清空错误日志");
    return;
  }

  try {
    const cleared = await launcher.clearErrorLogs();
    errorLogEntries = [];
    setStatus(`已清空错误日志（${cleared} 条）`);
    refreshOpenSettingsOverlay();
  } catch {
    setStatus("清空错误日志失败");
  }
}

function clampSettingsValue(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  const rounded = Math.round(value);
  if (rounded < SETTINGS_LIMIT_MIN) {
    return SETTINGS_LIMIT_MIN;
  }

  if (rounded > SETTINGS_LIMIT_MAX) {
    return SETTINGS_LIMIT_MAX;
  }

  return rounded;
}

function normalizeSettingsInput(
  inputConfig: Partial<SearchDisplayConfig>,
  base: SearchDisplayConfig = searchDisplayConfig
): SearchDisplayConfig {
  return {
    recentLimit: clampSettingsValue(inputConfig.recentLimit ?? base.recentLimit, base.recentLimit),
    pinnedLimit: clampSettingsValue(
      inputConfig.pinnedLimit ?? base.pinnedLimit,
      base.pinnedLimit
    ),
    pluginLimit: clampSettingsValue(inputConfig.pluginLimit ?? base.pluginLimit, base.pluginLimit),
    searchLimit: clampSettingsValue(inputConfig.searchLimit ?? base.searchLimit, base.searchLimit)
  };
}

function parseCustomScanDirsText(value: string): string[] {
  const tokens = value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
  const result: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const key = token.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(token);
    if (result.length >= CATALOG_SCAN_CUSTOM_DIRS_MAX) {
      break;
    }
  }
  return result;
}

function parseExcludeScanDirsText(value: string): string[] {
  const tokens = value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
  const result: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const key = token.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(token);
    if (result.length >= CATALOG_SCAN_EXCLUDE_DIRS_MAX) {
      break;
    }
  }
  return result;
}

function parseResultIncludeDirsText(value: string): string[] {
  const tokens = value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
  const result: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const key = token.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(token);
    if (result.length >= CATALOG_RESULT_INCLUDE_DIRS_MAX) {
      break;
    }
  }
  return result;
}

function parseResultExcludeDirsText(value: string): string[] {
  const tokens = value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
  const result: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const key = token.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(token);
    if (result.length >= CATALOG_RESULT_EXCLUDE_DIRS_MAX) {
      break;
    }
  }
  return result;
}

function parseVisiblePluginIdsText(value: string): string[] {
  const tokens = value
    .split(/\r?\n|;/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const result: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    if (seen.has(token)) {
      continue;
    }

    seen.add(token);
    result.push(token);
    if (result.length >= VISIBLE_PLUGIN_IDS_MAX) {
      break;
    }
  }
  return result;
}

function pluginIdFromCatalogItem(item: LaunchItem): string {
  const id = item.id.trim().toLowerCase();
  return id.startsWith("plugin:") ? id.slice("plugin:".length) : id;
}

function createSettingsPluginPickerIcon(item: LaunchItem): HTMLDivElement {
  const icon = document.createElement("div");
  icon.className = "result-icon";

  const fallback = () => {
    icon.replaceChildren();
    icon.classList.add("fallback");
    icon.textContent = item.title.trim().slice(0, 1) || "?";
  };

  const iconPath = item.iconPath?.trim() ?? "";
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

function readVisiblePluginIdsFromSettingsForm(form: HTMLFormElement): string[] {
  const picker = form.querySelector<HTMLElement>("[data-settings-plugin-picker]");
  if (!picker) {
    const legacyNode = form.elements.namedItem("visiblePluginIds");
    if (legacyNode instanceof HTMLTextAreaElement) {
      return parseVisiblePluginIdsText(legacyNode.value);
    }
    return visiblePluginIds;
  }

  const selected = new Set<string>(requiredVisiblePluginIdSet);
  const pinned: string[] = [];
  picker
    .querySelectorAll<HTMLElement>(".settings-plugin-tile.is-selected")
    .forEach((tile) => {
      const pluginId = tile.dataset.pluginId?.trim().toLowerCase();
      if (!pluginId) {
        return;
      }
      selected.add(pluginId);
      if (tile.classList.contains("is-pinned") && !pinned.includes(pluginId)) {
        pinned.push(pluginId);
      }
    });

  const ordered: string[] = [];
  const seen = new Set<string>();
  for (const pluginId of pinned) {
    if (!selected.has(pluginId) || seen.has(pluginId)) {
      continue;
    }
    seen.add(pluginId);
    ordered.push(pluginId);
    if (ordered.length >= VISIBLE_PLUGIN_IDS_MAX) {
      return ordered;
    }
  }

  for (const item of allPluginCatalogItems) {
    const pluginId = pluginIdFromCatalogItem(item);
    if (!selected.has(pluginId) || seen.has(pluginId)) {
      continue;
    }
    seen.add(pluginId);
    ordered.push(pluginId);
    if (ordered.length >= VISIBLE_PLUGIN_IDS_MAX) {
      break;
    }
  }

  for (const pluginId of selected) {
    if (seen.has(pluginId)) {
      continue;
    }
    seen.add(pluginId);
    ordered.push(pluginId);
    if (ordered.length >= VISIBLE_PLUGIN_IDS_MAX) {
      break;
    }
  }

  return ordered;
}

function getPluginSettingsCategory(pluginId: string): string {
  if (
    pluginId === "dictionary" ||
    pluginId === "webtools-translate" ||
    pluginId === "litesnap"
  ) {
    return "词典与翻译";
  }
  if (
    pluginId === "clipboard-workbench" ||
    pluginId === "hardware-inspector" ||
    pluginId === "cashflow-game" ||
    pluginId === "codeagent-switch"
  ) {
    return "工作台";
  }
  if (pluginId.startsWith("webtools-")) {
    return "开发工具";
  }
  return "其他";
}

function createVisiblePluginPicker(
  selectedPluginIds: string[]
): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.className = "settings-plugin-picker";
  wrap.dataset.settingsPluginPicker = "true";

  const summary = document.createElement("div");
  summary.className = "settings-plugin-picker-summary";
  const selectedSet = new Set(
    selectedPluginIds.map((id) => id.trim().toLowerCase())
  );
  for (const pluginId of requiredVisiblePluginIdSet) {
    selectedSet.add(pluginId);
  }
  const pinnedSet = new Set(
    selectedPluginIds
      .slice(0, 8)
      .map((id) => id.trim().toLowerCase())
      .filter((id) => selectedSet.has(id))
  );

  const toolbar = document.createElement("div");
  toolbar.className = "settings-plugin-picker-toolbar";
  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.className = "settings-value settings-plugin-picker-search";
  searchInput.placeholder = "搜索插件名称…";
  searchInput.autocomplete = "off";

  const restoreDefaultsButton = document.createElement("button");
  restoreDefaultsButton.type = "button";
  restoreDefaultsButton.className = "settings-btn settings-btn-secondary";
  restoreDefaultsButton.textContent = "恢复默认可见";
  restoreDefaultsButton.title = "恢复为当前版本默认可见插件集";
  toolbar.append(searchInput, restoreDefaultsButton);

  const defaultVisibleSet = new Set(
    DEFAULT_VISIBLE_PLUGIN_IDS.map((id) => id.trim().toLowerCase())
  );
  const initialVisibleSet = new Set(selectedSet);
  const newlySuggestedIds = [...defaultVisibleSet].filter(
    (id) => !initialVisibleSet.has(id)
  );

  const updateSummary = (): void => {
    const count = wrap.querySelectorAll(".settings-plugin-tile.is-selected").length;
    const pinnedCount = wrap.querySelectorAll(
      ".settings-plugin-tile.is-selected.is-pinned"
    ).length;
    const unselectedDefaults = wrap.querySelectorAll(
      ".settings-plugin-tile.is-default:not(.is-selected)"
    ).length;
    const parts = [
      `已选择 ${count} 个插件（置顶 ${pinnedCount}）`,
      "可搜索、按分类浏览，点击右上角★置顶常用插件"
    ];
    if (newlySuggestedIds.length > 0 || unselectedDefaults > 0) {
      parts.push(
        `有 ${Math.max(newlySuggestedIds.length, unselectedDefaults)} 个默认推荐插件未启用，可点「恢复默认可见」`
      );
    }
    summary.textContent = `${parts.join("；")}。`;
  };

  const groupsHost = document.createElement("div");
  groupsHost.className = "settings-plugin-groups";

  const sortedItems = [...allPluginCatalogItems].sort((left, right) =>
    left.title.localeCompare(right.title, "zh-CN")
  );
  const categoryOrder = ["词典与翻译", "工作台", "开发工具", "其他"];
  const itemsByCategory = new Map<string, LaunchItem[]>();
  for (const item of sortedItems) {
    const category = getPluginSettingsCategory(pluginIdFromCatalogItem(item));
    const list = itemsByCategory.get(category) ?? [];
    list.push(item);
    itemsByCategory.set(category, list);
  }

  const allTiles: HTMLLIElement[] = [];

  for (const category of categoryOrder) {
    const items = itemsByCategory.get(category) ?? [];
    if (items.length === 0) {
      continue;
    }

    const section = document.createElement("section");
    section.className = "settings-plugin-group";
    section.dataset.pluginCategory = category;

    const heading = document.createElement("h4");
    heading.className = "settings-plugin-group-title";
    heading.textContent = category;
    section.appendChild(heading);

    const grid = document.createElement("ul");
    grid.className = "settings-plugin-grid section-grid";

    for (const item of items) {
      const pluginId = pluginIdFromCatalogItem(item);
      const required = requiredVisiblePluginIdSet.has(pluginId);
      const selected = required || selectedSet.has(pluginId);
      const pinned = selected && pinnedSet.has(pluginId);
      const isDefault = defaultVisibleSet.has(pluginId);
      const isNewSuggestion =
        isDefault && newlySuggestedIds.includes(pluginId);

      const tile = document.createElement("li");
      tile.className = "settings-plugin-tile result-item result-tile";
      tile.dataset.pluginId = pluginId;
      tile.dataset.pluginTitle = item.title;
      if (selected) {
        tile.classList.add("is-selected");
      }
      if (isDefault) {
        tile.classList.add("is-default");
      }
      if (required) {
        tile.classList.add("is-required");
        tile.title = `${item.title}（必选插件，无法隐藏）`;
      } else {
        tile.title = selected
          ? `点击隐藏：${item.title}`
          : `点击显示：${item.title}`;
      }
      if (pinned) {
        tile.classList.add("is-pinned");
      }

      const icon = createSettingsPluginPickerIcon(item);
      const title = document.createElement("div");
      title.className = "tile-title";
      title.textContent = item.title;

      const pinButton = document.createElement("button");
      pinButton.type = "button";
      pinButton.className = "settings-plugin-pin-btn";
      pinButton.textContent = pinned ? "★" : "☆";
      pinButton.title = pinned ? "取消置顶" : "置顶到搜索结果靠前";
      pinButton.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!tile.classList.contains("is-selected")) {
          setStatus("请先选择该插件再置顶。");
          return;
        }
        tile.classList.toggle("is-pinned");
        pinButton.textContent = tile.classList.contains("is-pinned") ? "★" : "☆";
        pinButton.title = tile.classList.contains("is-pinned")
          ? "取消置顶"
          : "置顶到搜索结果靠前";
        updateSummary();
      });

      tile.append(icon, title, pinButton);
      if (required) {
        const badge = document.createElement("span");
        badge.className = "settings-plugin-required-badge";
        badge.textContent = "必选";
        tile.appendChild(badge);
      } else if (isNewSuggestion) {
        const badge = document.createElement("span");
        badge.className = "settings-plugin-new-badge";
        badge.textContent = "新增";
        tile.appendChild(badge);
      }

      tile.addEventListener("click", () => {
        if (required) {
          setStatus(`${item.title} 为必选插件，无法隐藏。`);
          return;
        }
        tile.classList.toggle("is-selected");
        const nowSelected = tile.classList.contains("is-selected");
        tile.title = nowSelected
          ? `点击隐藏：${item.title}`
          : `点击显示：${item.title}`;
        if (!nowSelected) {
          tile.classList.remove("is-pinned");
          pinButton.textContent = "☆";
          pinButton.title = "置顶到搜索结果靠前";
        }
        updateSummary();
      });

      grid.appendChild(tile);
      allTiles.push(tile);
    }

    section.appendChild(grid);
    groupsHost.appendChild(section);
    window.requestAnimationFrame(() => {
      applyAdaptiveSectionGridColumns(grid);
    });
  }

  const applySearchFilter = (): void => {
    const query = searchInput.value.trim().toLowerCase();
    for (const tile of allTiles) {
      const pluginId = tile.dataset.pluginId ?? "";
      const title = (tile.dataset.pluginTitle ?? "").toLowerCase();
      const match =
        !query || title.includes(query) || pluginId.includes(query);
      tile.hidden = !match;
    }
    groupsHost.querySelectorAll<HTMLElement>(".settings-plugin-group").forEach((section) => {
      const visibleTiles = section.querySelectorAll(
        ".settings-plugin-tile:not([hidden])"
      ).length;
      section.hidden = visibleTiles === 0;
    });
  };
  searchInput.addEventListener("input", applySearchFilter);

  restoreDefaultsButton.addEventListener("click", () => {
    for (const tile of allTiles) {
      const pluginId = tile.dataset.pluginId ?? "";
      const shouldSelect =
        requiredVisiblePluginIdSet.has(pluginId) || defaultVisibleSet.has(pluginId);
      tile.classList.toggle("is-selected", shouldSelect);
      tile.classList.remove("is-pinned");
      const pinButton = tile.querySelector<HTMLButtonElement>(
        ".settings-plugin-pin-btn"
      );
      if (pinButton) {
        pinButton.textContent = "☆";
        pinButton.title = "置顶到搜索结果靠前";
      }
      if (!requiredVisiblePluginIdSet.has(pluginId)) {
        tile.title = shouldSelect
          ? `点击隐藏：${tile.dataset.pluginTitle ?? pluginId}`
          : `点击显示：${tile.dataset.pluginTitle ?? pluginId}`;
      }
    }
    const preferredPins = ["dictionary", "webtools-translate", "clipboard-workbench"];
    for (const pluginId of preferredPins) {
      const tile = allTiles.find((item) => item.dataset.pluginId === pluginId);
      if (!tile || !tile.classList.contains("is-selected")) {
        continue;
      }
      tile.classList.add("is-pinned");
      const pinButton = tile.querySelector<HTMLButtonElement>(
        ".settings-plugin-pin-btn"
      );
      if (pinButton) {
        pinButton.textContent = "★";
        pinButton.title = "取消置顶";
      }
    }
    updateSummary();
    setStatus("已恢复默认可见插件，保存设置后生效。");
  });

  wrap.append(summary, toolbar, groupsHost);
  updateSummary();
  return wrap;
}

function normalizeCatalogScanConfigInput(
  inputConfig: Partial<CatalogScanConfig>,
  base: CatalogScanConfig = catalogScanConfig
): CatalogScanConfig {
  return {
    scanProgramFiles:
      typeof inputConfig.scanProgramFiles === "boolean"
        ? inputConfig.scanProgramFiles
        : base.scanProgramFiles,
    customScanDirs: Array.isArray(inputConfig.customScanDirs)
      ? parseCustomScanDirsText(inputConfig.customScanDirs.join("\n"))
      : base.customScanDirs.slice(0, CATALOG_SCAN_CUSTOM_DIRS_MAX),
    excludeScanDirs: Array.isArray(inputConfig.excludeScanDirs)
      ? parseExcludeScanDirsText(inputConfig.excludeScanDirs.join("\n"))
      : base.excludeScanDirs.slice(0, CATALOG_SCAN_EXCLUDE_DIRS_MAX),
    resultIncludeDirs: Array.isArray(inputConfig.resultIncludeDirs)
      ? parseResultIncludeDirsText(inputConfig.resultIncludeDirs.join("\n"))
      : base.resultIncludeDirs.slice(0, CATALOG_RESULT_INCLUDE_DIRS_MAX),
    resultExcludeDirs: Array.isArray(inputConfig.resultExcludeDirs)
      ? parseResultExcludeDirsText(inputConfig.resultExcludeDirs.join("\n"))
      : base.resultExcludeDirs.slice(0, CATALOG_RESULT_EXCLUDE_DIRS_MAX)
  };
}

async function saveSettingsFromForm(form: HTMLFormElement): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u4fdd\u5b58\u8bbe\u7f6e");
    return;
  }

  const readNumber = (name: string): number => {
    const inputNode = form.elements.namedItem(name);
    if (!(inputNode instanceof HTMLInputElement)) {
      return NaN;
    }
    return Number(inputNode.value);
  };

  const inputConfig: Partial<SearchDisplayConfig> = {
    recentLimit: readNumber("recentLimit"),
    pinnedLimit: readNumber("pinnedLimit"),
    pluginLimit: readNumber("pluginLimit"),
    searchLimit: readNumber("searchLimit")
  };
  const scanProgramFilesNode = form.elements.namedItem("scanProgramFiles");
  const customScanDirsNode = form.elements.namedItem("customScanDirs");
  const excludeScanDirsNode = form.elements.namedItem("excludeScanDirs");
  const resultIncludeDirsNode = form.elements.namedItem("resultIncludeDirs");
  const resultExcludeDirsNode = form.elements.namedItem("resultExcludeDirs");
  const catalogInputConfig: Partial<CatalogScanConfig> = {
    scanProgramFiles:
      scanProgramFilesNode instanceof HTMLInputElement
        ? scanProgramFilesNode.checked
        : catalogScanConfig.scanProgramFiles,
    customScanDirs:
      customScanDirsNode instanceof HTMLTextAreaElement
        ? parseCustomScanDirsText(customScanDirsNode.value)
        : catalogScanConfig.customScanDirs,
    excludeScanDirs:
      excludeScanDirsNode instanceof HTMLTextAreaElement
        ? parseExcludeScanDirsText(excludeScanDirsNode.value)
        : catalogScanConfig.excludeScanDirs,
    resultIncludeDirs:
      resultIncludeDirsNode instanceof HTMLTextAreaElement
        ? parseResultIncludeDirsText(resultIncludeDirsNode.value)
        : catalogScanConfig.resultIncludeDirs,
    resultExcludeDirs:
      resultExcludeDirsNode instanceof HTMLTextAreaElement
        ? parseResultExcludeDirsText(resultExcludeDirsNode.value)
        : catalogScanConfig.resultExcludeDirs
  };
  const nextVisiblePluginIds = readVisiblePluginIdsFromSettingsForm(form);

  const launchAtLoginNode = form.elements.namedItem("launchAtLogin");
  const nextLaunchAtLoginEnabled =
    launchAtLoginNode instanceof HTMLInputElement
      ? launchAtLoginNode.checked
      : launchAtLoginStatus.enabled;

  const previousVisiblePluginIds = visiblePluginIds;
  let visiblePluginsChanged = false;

  const themeApi = getUiThemeApi();
  const presetNode = form.elements.namedItem("uiThemePresetId");
  const accentNode = form.elements.namedItem("uiThemeAccent");
  const nextThemeInput: Partial<UiThemeConfig> = {
    ...uiThemeConfig
  };
  if (presetNode instanceof HTMLInputElement && presetNode.value) {
    nextThemeInput.presetId = presetNode.value as UiThemePresetId;
  }
  if (accentNode instanceof HTMLInputElement && accentNode.value) {
    if (nextThemeInput.presetId === "custom" && themeApi) {
      Object.assign(nextThemeInput, themeApi.fromAccent(accentNode.value, uiThemeConfig));
    } else if (nextThemeInput.presetId === "custom") {
      nextThemeInput.accent = accentNode.value;
    }
  }

  try {
    const normalized = normalizeSettingsInput(inputConfig);
    const normalizedCatalog = normalizeCatalogScanConfigInput(catalogInputConfig);
    const [
      nextSearchDisplayConfig,
      nextCatalogScanConfig,
      nextAppliedVisiblePluginIds,
      nextLaunchAtLoginStatus,
      nextUiThemeConfig
    ] = await Promise.all([
      launcher.setSearchDisplayConfig(normalized),
      launcher.setCatalogScanConfig(normalizedCatalog),
      launcher.setVisiblePluginIds(nextVisiblePluginIds),
      launcher.setLaunchAtLoginEnabled(nextLaunchAtLoginEnabled),
      launcher.setUiThemeConfig(nextThemeInput)
    ]);
    searchDisplayConfig = nextSearchDisplayConfig;
    catalogScanConfig = nextCatalogScanConfig;
    visiblePluginIds = nextAppliedVisiblePluginIds;
    launchAtLoginStatus = nextLaunchAtLoginStatus;
    applyUiThemeConfig(nextUiThemeConfig);
    visiblePluginsChanged =
      previousVisiblePluginIds.length !== visiblePluginIds.length ||
      previousVisiblePluginIds.some((id, index) => id !== visiblePluginIds[index]);
    if (visiblePluginsChanged) {
      markHomeSectionsDirty();
    }
    setStatus(
      `\u8bbe\u7f6e\u5df2\u4fdd\u5b58（可见插件 ${visiblePluginIds.length} 个；索引源改动需重建索引后生效）`
    );
  } catch {
    setStatus("\u4fdd\u5b58\u8bbe\u7f6e\u5931\u8d25");
  }

  // Only the visible-plugin list affects other panels (home sections,
  // plugin catalog). Other fields are just clamped/deduped versions of what
  // the user already sees in the form, so skip the full settings-panel
  // rebuild when nothing structural changed.
  if (visiblePluginsChanged) {
    renderList();
  }
}

async function rebuildCatalogFromSettings(): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u91cd\u5efa\u7d22\u5f15");
    return;
  }

  setStatus("\u6b63\u5728\u91cd\u5efa\u7d22\u5f15...");
  try {
    const result = await launcher.rebuildCatalog();
    const durationText = `${Math.max(0, Math.round(result.durationMs))}ms`;
    setStatus(`${result.message}（${durationText}）`);
    markHomeSectionsDirty();
    await refreshEntries(currentQuery);
  } catch {
    setStatus("\u91cd\u5efa\u7d22\u5f15\u5931\u8d25");
  }
}

function renderSettingsPanel(
  target: HTMLElement = list,
  options?: { listItemWrap?: boolean }
): void {
  const wrapInListItem = options?.listItemWrap ?? target === list;
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel settings-panel-structured cc-settings-shell";

  const header = document.createElement("header");
  header.className = "cc-settings-header";

  const headerCopy = document.createElement("div");
  const eyebrow = document.createElement("div");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "LiteLauncher";
  const title = document.createElement("h2");
  title.textContent = "设置中心";
  headerCopy.append(eyebrow, title);

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "cc-settings-close icon-only";
  closeButton.setAttribute("aria-label", "关闭设置");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", () => {
    dismissSettingsOverlay();
  });
  header.append(headerCopy, closeButton);

  const form = document.createElement("form");
  form.className = "settings-form settings-form-grouped";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveSettingsFromForm(form);
  });

  const settingsBody = document.createElement("div");
  settingsBody.className = "settings-body";

  const settingsNav = document.createElement("nav");
  settingsNav.setAttribute("aria-label", "设置分组");

  const settingsContent = document.createElement("div");
  settingsContent.className = "settings-content";

  const settingsTabs: Array<{ id: SettingsTabId; label: string }> = [
    { id: "appearance", label: "外观主题" },
    { id: "display", label: "搜索展示" },
    { id: "scan", label: "索引扫描" },
    { id: "pinned", label: "自定义置顶" },
    { id: "plugins", label: "插件可见性" },
    { id: "updates", label: "系统与更新" },
    { id: "errors", label: "错误日志" }
  ];

  const initialTab: SettingsTabId = settingsFocusHint ?? activeSettingsTab;

  const navButtons = new Map<SettingsTabId, HTMLButtonElement>();
  const groupSections = new Map<SettingsTabId, HTMLElement>();

  const showSettingsTab = (tabId: SettingsTabId): void => {
    activeSettingsTab = tabId;
    for (const [id, section] of groupSections) {
      section.hidden = id !== tabId;
    }
    for (const [id, button] of navButtons) {
      button.classList.toggle("is-active", id === tabId);
    }
  };

  for (const tab of settingsTabs) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = tab.label;
    button.dataset.settingsTab = tab.id;
    button.addEventListener("click", () => {
      showSettingsTab(tab.id);
    });
    navButtons.set(tab.id, button);
    settingsNav.appendChild(button);
  }

  settingsBody.append(settingsNav, settingsContent);

  const createGroup = (
    groupTitle: string,
    groupDescription: string
  ): {
    section: HTMLElement;
    body: HTMLDivElement;
  } => {
    const section = document.createElement("section");
    section.className = "settings-group";

    const head = document.createElement("div");
    head.className = "settings-group-head";

    const titleNode = document.createElement("h4");
    titleNode.className = "settings-group-title";
    titleNode.textContent = groupTitle;

    const descriptionNode = document.createElement("p");
    descriptionNode.className = "settings-group-description";
    descriptionNode.textContent = groupDescription;

    const body = document.createElement("div");
    body.className = "settings-group-body";

    head.append(titleNode, descriptionNode);
    section.append(head, body);
    return { section, body };
  };

  const createRow = (
    rowLabel: string,
    rowHint: string,
    options?: { textarea?: boolean }
  ): {
    row: HTMLDivElement;
    control: HTMLDivElement;
    hint: HTMLSpanElement;
  } => {
    const row = document.createElement("div");
    row.className = options?.textarea
      ? "settings-row settings-row-textarea"
      : "settings-row";

    const labelNode = document.createElement("span");
    labelNode.className = "settings-row-label";
    labelNode.textContent = rowLabel;

    const control = document.createElement("div");
    control.className = "settings-control";

    const hintNode = document.createElement("span");
    hintNode.className = "settings-row-hint";
    hintNode.textContent = rowHint;

    row.append(labelNode, control, hintNode);
    return { row, control, hint: hintNode };
  };

  type FieldItem = {
    key: keyof SearchDisplayConfig;
    label: string;
    hint: string;
  };

  const fields: FieldItem[] = [
    {
      key: "searchLimit",
      label: "\u641c\u7d22\u7ed3\u679c",
      hint: "\u8f93\u5165\u540e\u5206\u533a"
    }
  ];

  const themeApi = getUiThemeApi();
  const appearanceGroup = createGroup(
    "外观主题",
    "切换预设或自定义主色；改动会立即预览，点保存后持久生效。"
  );
  appearanceGroup.section.dataset.settingsGroup = "appearance";
  groupSections.set("appearance", appearanceGroup.section);

  const presetRow = createRow("主题预设", "一键切换整套配色");
  const presetGrid = document.createElement("div");
  presetGrid.className = "settings-theme-presets";

  const presetHidden = document.createElement("input");
  presetHidden.type = "hidden";
  presetHidden.name = "uiThemePresetId";
  presetHidden.value = uiThemeConfig.presetId;

  const accentRow = createRow("自定义主色", "选色后自动生成强调色");
  const accentControl = document.createElement("div");
  accentControl.className = "settings-theme-accent";

  const accentInput = document.createElement("input");
  accentInput.className = "settings-theme-accent-input";
  accentInput.type = "color";
  accentInput.name = "uiThemeAccent";
  accentInput.value = uiThemeConfig.accent;

  const accentHex = document.createElement("span");
  accentHex.className = "settings-theme-accent-hex";
  accentHex.textContent = uiThemeConfig.accent;

  const syncThemeControls = (theme: UiThemeConfig): void => {
    presetHidden.value = theme.presetId;
    accentInput.value = theme.accent;
    accentHex.textContent = theme.accent;
    presetGrid
      .querySelectorAll<HTMLButtonElement>("[data-theme-preset]")
      .forEach((button) => {
        button.classList.toggle(
          "is-active",
          button.dataset.themePreset === theme.presetId
        );
      });
  };

  const presets = themeApi?.PRESETS ?? [
    {
      id: "violet" as const,
      label: "暗紫",
      theme: {
        accent: "#9d63ff",
        accentStrong: "#6f3bc2",
        accentSoft: "#c4a0ff",
        bg: "#070612",
        surface: "#0d0b1d",
        text: "#f1edff"
      }
    }
  ];

  for (const preset of presets) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "settings-theme-preset";
    button.dataset.themePreset = preset.id;
    button.title = preset.label;
    button.setAttribute("aria-label", preset.label);

    const swatch = document.createElement("span");
    swatch.className = "settings-theme-preset-swatch";
    swatch.style.setProperty("--theme-swatch", preset.theme.accent);
    swatch.style.setProperty("--theme-swatch-bg", preset.theme.surface);

    const label = document.createElement("span");
    label.className = "settings-theme-preset-label";
    label.textContent = preset.label;

    button.append(swatch, label);
    button.addEventListener("click", () => {
      const next = themeApi
        ? themeApi.fromPreset(preset.id)
        : { presetId: preset.id, ...preset.theme };
      applyUiThemeConfig(next);
      syncThemeControls(uiThemeConfig);
      void persistUiThemeConfig(uiThemeConfig).then((saved) => {
        if (saved) {
          setStatus(`已切换主题：${preset.label}`);
        } else {
          setStatus("主题已预览，保存设置后持久生效");
        }
      });
    });
    presetGrid.appendChild(button);
  }

  const customButton = document.createElement("button");
  customButton.type = "button";
  customButton.className = "settings-theme-preset";
  customButton.dataset.themePreset = "custom";
  customButton.title = "自定义";
  customButton.setAttribute("aria-label", "自定义");
  const customSwatch = document.createElement("span");
  customSwatch.className = "settings-theme-preset-swatch is-custom";
  customSwatch.style.setProperty("--theme-swatch", uiThemeConfig.accent);
  customSwatch.style.setProperty("--theme-swatch-bg", uiThemeConfig.surface);
  const customLabel = document.createElement("span");
  customLabel.className = "settings-theme-preset-label";
  customLabel.textContent = "自定义";
  customButton.append(customSwatch, customLabel);
  customButton.addEventListener("click", () => {
    accentInput.click();
  });
  presetGrid.appendChild(customButton);

  accentInput.addEventListener("input", () => {
    const next = themeApi
      ? themeApi.fromAccent(accentInput.value, uiThemeConfig)
      : {
          ...uiThemeConfig,
          presetId: "custom" as const,
          accent: accentInput.value
        };
    applyUiThemeConfig(next);
    customSwatch.style.setProperty("--theme-swatch", uiThemeConfig.accent);
    syncThemeControls(uiThemeConfig);
  });
  accentInput.addEventListener("change", () => {
    void persistUiThemeConfig(uiThemeConfig).then((saved) => {
      setStatus(saved ? "自定义主色已保存" : "主色已预览，保存设置后持久生效");
    });
  });

  presetRow.control.append(presetHidden, presetGrid);
  accentControl.append(accentInput, accentHex);
  accentRow.control.appendChild(accentControl);
  appearanceGroup.body.append(presetRow.row, accentRow.row);
  settingsContent.appendChild(appearanceGroup.section);
  syncThemeControls(uiThemeConfig);

  const displayGroup = createGroup(
    "搜索展示",
    "控制输入关键词后的搜索结果数量；首页分区已按实际内容和宽度自适应。"
  );
  displayGroup.section.dataset.settingsGroup = "display";
  groupSections.set("display", displayGroup.section);
  for (const field of fields) {
    const { row, control, hint } = createRow(
      field.label,
      `${field.hint} 范围 ${SETTINGS_LIMIT_MIN}-${SETTINGS_LIMIT_MAX}`
    );

    const inputNode = document.createElement("input");
    inputNode.className = "settings-number";
    inputNode.type = "number";
    inputNode.name = field.key;
    inputNode.min = String(SETTINGS_LIMIT_MIN);
    inputNode.max = String(SETTINGS_LIMIT_MAX);
    inputNode.step = "1";
    inputNode.value = String(searchDisplayConfig[field.key]);

    control.appendChild(inputNode);
    hint.dataset.compact = "true";
    displayGroup.body.appendChild(row);
  }
  settingsContent.appendChild(displayGroup.section);

  const scanGroup = createGroup(
    "索引扫描",
    "配置扫描目录与结果过滤规则。开始菜单安装/卸载一般会自动更新；改扫描源后也可立即重建。"
  );
  scanGroup.section.dataset.settingsGroup = "scan";
  groupSections.set("scan", scanGroup.section);
  const {
    row: scanProgramRow,
    control: scanProgramControl,
    hint: scanProgramHint
  } = createRow(
    "\u626b\u63cf Program Files",
    "Windows 下扫描 Program Files / Program Files (x86) / LocalAppData\\\\Programs"
  );

  const scanProgramWrap = document.createElement("div");
  scanProgramWrap.className = "password-checkbox-wrap";

  const scanProgramInput = document.createElement("input");
  scanProgramInput.type = "checkbox";
  scanProgramInput.name = "scanProgramFiles";
  scanProgramInput.className = "password-checkbox";
  scanProgramInput.checked = catalogScanConfig.scanProgramFiles;

  const scanProgramText = document.createElement("span");
  scanProgramText.className = "settings-row-hint";
  scanProgramText.textContent = catalogScanConfig.scanProgramFiles
    ? "\u5df2\u5f00\u542f"
    : "\u672a\u5f00\u542f";
  scanProgramInput.addEventListener("change", () => {
    scanProgramText.textContent = scanProgramInput.checked
      ? "\u5df2\u5f00\u542f"
      : "\u672a\u5f00\u542f";
  });
  scanProgramWrap.append(scanProgramInput, scanProgramText);
  scanProgramControl.appendChild(scanProgramWrap);
  scanProgramHint.dataset.compact = "true";
  scanGroup.body.appendChild(scanProgramRow);

  const {
    row: customDirsRow,
    control: customDirsControl
  } = createRow(
    "\u81ea\u5b9a\u4e49\u626b\u63cf\u76ee\u5f55",
    `可填 ${CATALOG_SCAN_CUSTOM_DIRS_MAX} 个，一行一个目录`,
    { textarea: true }
  );

  const customDirsInput = document.createElement("textarea");
  customDirsInput.name = "customScanDirs";
  customDirsInput.className = "settings-value settings-textarea";
  customDirsInput.placeholder =
    "一行一个目录，例如：\nC:\\\\Tools\nD:\\\\Apps\n按填写顺序优先扫描";
  customDirsInput.value = catalogScanConfig.customScanDirs.join("\n");
  customDirsControl.appendChild(customDirsInput);
  scanGroup.body.appendChild(customDirsRow);

  const {
    row: excludeDirsRow,
    control: excludeDirsControl
  } = createRow(
    "排除扫描目录",
    `可填 ${CATALOG_SCAN_EXCLUDE_DIRS_MAX} 个，命中目录及其子目录会跳过`,
    { textarea: true }
  );

  const excludeDirsInput = document.createElement("textarea");
  excludeDirsInput.name = "excludeScanDirs";
  excludeDirsInput.className = "settings-value settings-textarea";
  excludeDirsInput.placeholder =
    "一行一个目录，例如：\nC:\\\\Program Files\\\\WindowsApps\nD:\\\\Games";
  excludeDirsInput.value = catalogScanConfig.excludeScanDirs.join("\n");
  excludeDirsControl.appendChild(excludeDirsInput);
  scanGroup.body.appendChild(excludeDirsRow);

  const {
    row: resultIncludeRow,
    control: resultIncludeControl
  } = createRow(
    "结果白名单目录",
    `可填 ${CATALOG_RESULT_INCLUDE_DIRS_MAX} 个；填写后仅显示命中目录内的应用/文件/文件夹`,
    { textarea: true }
  );

  const resultIncludeInput = document.createElement("textarea");
  resultIncludeInput.name = "resultIncludeDirs";
  resultIncludeInput.className = "settings-value settings-textarea";
  resultIncludeInput.placeholder = "一行一个目录，可留空表示不过滤";
  resultIncludeInput.value = catalogScanConfig.resultIncludeDirs.join("\n");
  resultIncludeControl.appendChild(resultIncludeInput);
  scanGroup.body.appendChild(resultIncludeRow);

  const {
    row: resultExcludeRow,
    control: resultExcludeControl
  } = createRow(
    "结果黑名单目录",
    `可填 ${CATALOG_RESULT_EXCLUDE_DIRS_MAX} 个；命中目录会从搜索结果中剔除`,
    { textarea: true }
  );

  const resultExcludeInput = document.createElement("textarea");
  resultExcludeInput.name = "resultExcludeDirs";
  resultExcludeInput.className = "settings-value settings-textarea";
  resultExcludeInput.placeholder = "一行一个目录，建议用来屏蔽噪声目录";
  resultExcludeInput.value = catalogScanConfig.resultExcludeDirs.join("\n");
  resultExcludeControl.appendChild(resultExcludeInput);
  scanGroup.body.appendChild(resultExcludeRow);

  const scanActions = document.createElement("div");
  scanActions.className = "settings-group-actions";

  const rebuildButton = document.createElement("button");
  rebuildButton.type = "button";
  rebuildButton.className = "settings-btn settings-btn-secondary";
  rebuildButton.textContent = "\u91cd\u5efa\u7d22\u5f15";
  rebuildButton.addEventListener("click", () => {
    void rebuildCatalogFromSettings();
  });
  scanActions.appendChild(rebuildButton);
  scanGroup.section.appendChild(scanActions);
  settingsContent.appendChild(scanGroup.section);

  const pinnedGroup = createGroup(
    "自定义置顶",
    "手动选择文件或文件夹加入首页置顶区，适合不在扫描目录内的程序与工具。"
  );
  pinnedGroup.section.dataset.settingsGroup = "pinned";
  groupSections.set("pinned", pinnedGroup.section);
  const pinnedActions = document.createElement("div");
  pinnedActions.className = "settings-inline-actions";

  const addPinnedFileButton = document.createElement("button");
  addPinnedFileButton.type = "button";
  addPinnedFileButton.className = "settings-btn settings-btn-secondary";
  addPinnedFileButton.textContent = "添加文件";
  addPinnedFileButton.addEventListener("click", () => {
    void addCustomPinnedFromPicker("file").then(() => {
      createCustomPinnedSettingsList(customPinnedList);
    });
  });

  const addPinnedFolderButton = document.createElement("button");
  addPinnedFolderButton.type = "button";
  addPinnedFolderButton.className = "settings-btn settings-btn-secondary";
  addPinnedFolderButton.textContent = "添加文件夹";
  addPinnedFolderButton.addEventListener("click", () => {
    void addCustomPinnedFromPicker("folder").then(() => {
      createCustomPinnedSettingsList(customPinnedList);
    });
  });

  pinnedActions.append(addPinnedFileButton, addPinnedFolderButton);
  pinnedGroup.body.appendChild(pinnedActions);

  const customPinnedList = document.createElement("div");
  customPinnedList.className = "custom-pinned-settings-list";
  pinnedGroup.body.appendChild(customPinnedList);
  createCustomPinnedSettingsList(customPinnedList);
  settingsContent.appendChild(pinnedGroup.section);

  const pluginGroup = createGroup(
    "插件可见性",
    "可搜索、按分类浏览；点击图标选择显示，★ 置顶常用插件。"
  );
  pluginGroup.section.dataset.settingsGroup = "plugins";
  groupSections.set("plugins", pluginGroup.section);
  const pickerRow = document.createElement("div");
  pickerRow.className = "settings-row settings-row-plugin-picker";
  const pickerControl = document.createElement("div");
  pickerControl.className = "settings-control settings-control-wide";
  pickerControl.appendChild(createVisiblePluginPicker(visiblePluginIds));
  pickerRow.appendChild(pickerControl);
  pluginGroup.body.appendChild(pickerRow);
  settingsContent.appendChild(pluginGroup.section);

  const systemGroup = createGroup(
    "系统",
    "管理应用的启动行为、自动更新与当前版本信息。"
  );
  systemGroup.section.dataset.settingsGroup = "updates";
  groupSections.set("updates", systemGroup.section);
  systemGroup.section.classList.add("settings-system-group");
  const {
    row: launchAtLoginRow,
    control: launchAtLoginControl
  } = createRow(
    "\u5f00\u673a\u542f\u52a8",
    launchAtLoginStatus.supported
      ? "Windows 登录后自动启动 LiteLauncher"
      : launchAtLoginStatus.reason ?? "当前环境暂不支持"
  );

  const launchAtLoginWrap = document.createElement("div");
  launchAtLoginWrap.className = "password-checkbox-wrap";

  const launchAtLoginInput = document.createElement("input");
  launchAtLoginInput.type = "checkbox";
  launchAtLoginInput.name = "launchAtLogin";
  launchAtLoginInput.className = "password-checkbox";
  launchAtLoginInput.checked = launchAtLoginStatus.enabled;
  launchAtLoginInput.disabled = !launchAtLoginStatus.supported;

  const launchAtLoginText = document.createElement("span");
  launchAtLoginText.className = "settings-row-hint";
  launchAtLoginText.textContent = launchAtLoginStatus.enabled
    ? "\u5df2\u542f\u7528"
    : "\u672a\u542f\u7528";
  launchAtLoginInput.addEventListener("change", () => {
    launchAtLoginText.textContent = launchAtLoginInput.checked
      ? "\u5df2\u542f\u7528"
      : "\u672a\u542f\u7528";
  });
  launchAtLoginWrap.append(launchAtLoginInput, launchAtLoginText);
  launchAtLoginControl.appendChild(launchAtLoginWrap);
  systemGroup.body.appendChild(launchAtLoginRow);

  const { row: versionRow, control: versionControl, hint: versionHint } = createRow(
    "应用版本",
    "当前运行中的桌面端版本"
  );
  const versionValue = document.createElement("div");
  versionValue.className = "settings-static-value settings-system-value-chip";
  versionValue.textContent = /^\d/.test(appVersion) ? `v${appVersion}` : appVersion;
  versionControl.appendChild(versionValue);
  versionHint.dataset.compact = "true";
  systemGroup.body.appendChild(versionRow);

  const {
    row: updaterRow,
    control: updaterControl,
    hint: updaterHint
  } = createRow(
    "自动更新",
    formatAppUpdaterActionHint(appUpdaterStatus)
  );
  updaterRow.classList.add("settings-system-update-row");
  const updaterCard = document.createElement("div");
  updaterCard.className = "settings-system-update-card";

  const updaterValue = document.createElement("div");
  updaterValue.className = "settings-static-value settings-system-value-chip";
  updaterValue.textContent = formatAppUpdaterStatusSummary(appUpdaterStatus);

  const updaterMeta = document.createElement("div");
  updaterMeta.className = "settings-system-update-meta";
  const updaterVersionText = [
    appUpdaterStatus.currentVersion
      ? `当前版本 v${appUpdaterStatus.currentVersion}`
      : "",
    appUpdaterStatus.updateVersion
      ? `目标版本 v${appUpdaterStatus.updateVersion}`
      : ""
  ]
    .filter(Boolean)
    .join(" -> ");
  updaterMeta.textContent =
    updaterVersionText || "支持 Windows NSIS 安装版与 macOS 打包版自动更新";

  const updaterDetails = document.createElement("div");
  updaterDetails.className = "settings-system-update-details";
  for (const detail of formatAppUpdaterDiagnosticDetails(appUpdaterStatus)) {
    const detailRow = document.createElement("div");
    detailRow.className = "settings-system-update-detail-row";

    const detailLabel = document.createElement("span");
    detailLabel.className = "settings-system-update-detail-label";
    detailLabel.textContent = detail.label;

    const detailValue = document.createElement("span");
    detailValue.className = "settings-system-update-detail-value";
    detailValue.textContent = detail.value;

    detailRow.append(detailLabel, detailValue);
    updaterDetails.appendChild(detailRow);
  }

  const updaterNotes = document.createElement("div");
  updaterNotes.className = "settings-system-update-notes";
  renderAppUpdaterReleaseNotes(updaterNotes, appUpdaterStatus.releaseNotes);

  const updaterActions = document.createElement("div");
  updaterActions.className = "settings-inline-actions settings-system-update-actions";

  const checkUpdatesButton = document.createElement("button");
  checkUpdatesButton.type = "button";
  checkUpdatesButton.className =
    "settings-btn settings-btn-secondary settings-system-action-btn";
  checkUpdatesButton.textContent = "检查更新";
  checkUpdatesButton.disabled =
    appUpdaterStatus.phase === "checking" ||
    appUpdaterStatus.phase === "downloading";
  checkUpdatesButton.addEventListener("click", () => {
    void checkForAppUpdatesFromSettings();
  });

  const copyUpdaterDiagnosticsButton = document.createElement("button");
  copyUpdaterDiagnosticsButton.type = "button";
  copyUpdaterDiagnosticsButton.className =
    "settings-btn settings-btn-secondary settings-system-action-btn";
  copyUpdaterDiagnosticsButton.textContent = "复制更新诊断";
  copyUpdaterDiagnosticsButton.addEventListener("click", () => {
    void copyTextToClipboard(formatAppUpdaterDiagnosticsForClipboard(appUpdaterStatus)).then(
      (copied) => {
        setStatus(copied ? "更新诊断已复制" : "复制更新诊断失败");
      }
    );
  });

  updaterActions.append(checkUpdatesButton, copyUpdaterDiagnosticsButton);

  if (appUpdaterStatus.downloaded && appUpdaterStatus.phase === "downloaded") {
    const installNowButton = document.createElement("button");
    installNowButton.type = "button";
    installNowButton.className =
      "settings-btn settings-btn-primary settings-system-action-btn";
    installNowButton.textContent = "立即安装并重启";
    installNowButton.addEventListener("click", () => {
      void installAppUpdateNowFromSettings();
    });
    updaterActions.appendChild(installNowButton);
  }

  updaterCard.append(
    updaterValue,
    updaterMeta,
    updaterDetails,
    updaterNotes,
    updaterActions
  );
  updaterControl.appendChild(updaterCard);
  updaterHint.dataset.compact = "true";
  systemGroup.body.appendChild(updaterRow);
  settingsContent.appendChild(systemGroup.section);

  const logGroup = createGroup(
    "错误日志",
    "显示最近 40 条运行异常记录，便于定位使用中的问题。"
  );
  logGroup.section.dataset.settingsGroup = "errors";
  groupSections.set("errors", logGroup.section);

  const errorLogContainer = document.createElement("div");
  errorLogContainer.className = "settings-error-log";

  const topmostDiagnosticEntries = getLauncherTopmostDiagnosticEntries(errorLogEntries);
  const pinDiagnosticEntries = getPinDiagnosticEntries(errorLogEntries);
  if (topmostDiagnosticEntries.length > 0 || pinDiagnosticEntries.length > 0) {
    const highlightList = document.createElement("div");
    highlightList.className = "settings-diagnostic-summary-list";

    for (const entry of topmostDiagnosticEntries) {
      const highlightCard = document.createElement("div");
      highlightCard.className = "settings-error-log-highlight-card settings-diagnostic-summary-card";

      const highlightTitle = document.createElement("div");
      highlightTitle.className = "settings-error-log-highlight-title";
      highlightTitle.textContent = formatLauncherPhaseText(
        parseErrorLogContext(entry.context).phase
      );

      const highlightMeta = document.createElement("div");
      highlightMeta.className = "settings-error-log-highlight-meta";
      highlightMeta.textContent = `${formatErrorLogDate(entry.createdAt)} · ${
        entry.level === "warn" ? "警告" : "错误"
      }`;

      const highlightBody = document.createElement("pre");
      highlightBody.className = "settings-error-log-highlight-body";
      highlightBody.textContent = formatLauncherTopmostDiagnosticSummary(entry);

      highlightCard.append(highlightTitle, highlightMeta, highlightBody);
      highlightList.appendChild(highlightCard);
    }

    for (const entry of pinDiagnosticEntries) {
      const highlightCard = document.createElement("div");
      highlightCard.className =
        "settings-error-log-highlight-card settings-diagnostic-summary-card";

      const highlightTitle = document.createElement("div");
      highlightTitle.className = "settings-error-log-highlight-title";
      highlightTitle.textContent = entry.message === "Pin request failed" ? "置顶保存失败" : "置顶请求被拒绝";

      const highlightMeta = document.createElement("div");
      highlightMeta.className = "settings-error-log-highlight-meta";
      highlightMeta.textContent = `${formatErrorLogDate(entry.createdAt)} · ${
        entry.level === "warn" ? "警告" : "错误"
      }`;

      const highlightBody = document.createElement("pre");
      highlightBody.className = "settings-error-log-highlight-body";
      highlightBody.textContent = formatPinDiagnosticSummary(entry);

      highlightCard.append(highlightTitle, highlightMeta, highlightBody);
      highlightList.appendChild(highlightCard);
    }

    errorLogContainer.appendChild(highlightList);
  }

  const errorLogActions = document.createElement("div");
  errorLogActions.className = "settings-inline-actions";

  const refreshErrorLogButton = document.createElement("button");
  refreshErrorLogButton.type = "button";
  refreshErrorLogButton.className = "settings-btn settings-btn-secondary";
  refreshErrorLogButton.textContent = "刷新日志";
  refreshErrorLogButton.addEventListener("click", () => {
    void refreshErrorLogs(40).then(() => {
      setStatus(`错误日志已刷新（${errorLogEntries.length} 条）`);
      refreshOpenSettingsOverlay();
    });
  });

  const clearErrorLogButton = document.createElement("button");
  clearErrorLogButton.type = "button";
  clearErrorLogButton.className = "settings-btn settings-btn-secondary";
  clearErrorLogButton.textContent = "清空日志";
  clearErrorLogButton.addEventListener("click", () => {
    void clearErrorLogsFromSettings();
  });

  const copyErrorLogButton = document.createElement("button");
  copyErrorLogButton.type = "button";
  copyErrorLogButton.className = "settings-btn settings-btn-secondary";
  copyErrorLogButton.textContent = "复制日志";
  copyErrorLogButton.addEventListener("click", () => {
    void copyTextToClipboard(formatErrorLogs(errorLogEntries)).then((copied) => {
      setStatus(copied ? "错误日志已复制" : "复制错误日志失败");
    });
  });

  errorLogActions.append(refreshErrorLogButton, copyErrorLogButton, clearErrorLogButton);

  const errorLogOutput = document.createElement("textarea");
  errorLogOutput.className = "settings-value settings-textarea settings-log-output";
  errorLogOutput.rows = 9;
  errorLogOutput.readOnly = true;
  errorLogOutput.spellcheck = false;
  errorLogOutput.value = formatErrorLogs(errorLogEntries);

  const errorLogHint = document.createElement("span");
  errorLogHint.className = "settings-row-hint";
  errorLogHint.textContent = "显示最近 40 条，按时间倒序";

  errorLogContainer.append(errorLogActions, errorLogOutput, errorLogHint);
  logGroup.body.appendChild(errorLogContainer);
  settingsContent.appendChild(logGroup.section);

  const footer = document.createElement("div");
  footer.className = "settings-panel-footer";

  const footerMeta = document.createElement("div");
  footerMeta.className = "settings-footer-meta";
  footerMeta.textContent =
    "保存后立即生效；扫描源或扫描排除目录变更后建议重建索引。";

  const actions = document.createElement("div");
  actions.className = "settings-actions settings-panel-actions";

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "settings-btn settings-btn-secondary";
  resetButton.textContent = "\u6062\u590d\u9ed8\u8ba4\u5e76\u4fdd\u5b58";
  resetButton.addEventListener("click", () => {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u6062\u590d\u9ed8\u8ba4\u8bbe\u7f6e");
      return;
    }

    searchDisplayConfig = {
      recentLimit: 20,
      pinnedLimit: 20,
      pluginLimit: 20,
      searchLimit: 50
    };
    catalogScanConfig = {
      scanProgramFiles: false,
      customScanDirs: [],
      excludeScanDirs: [],
      resultIncludeDirs: [],
      resultExcludeDirs: []
    };
    visiblePluginIds = [...DEFAULT_VISIBLE_PLUGIN_IDS];
    const defaultTheme = getUiThemeApi()?.DEFAULT ?? {
      presetId: "violet" as const,
      accent: "#9d63ff",
      accentStrong: "#6f3bc2",
      accentSoft: "#c4a0ff",
      bg: "#070612",
      surface: "#0d0b1d",
      text: "#f1edff"
    };
    applyUiThemeConfig(defaultTheme);
    void Promise.all([
      launcher.setSearchDisplayConfig(searchDisplayConfig),
      launcher.setCatalogScanConfig(catalogScanConfig),
      launcher.setVisiblePluginIds(visiblePluginIds),
      launcher.setUiThemeConfig(defaultTheme)
    ])
      .then(
        ([
          savedSearchConfig,
          savedCatalogScanConfig,
          savedVisiblePluginIds,
          savedUiThemeConfig
        ]) => {
        searchDisplayConfig = savedSearchConfig;
        catalogScanConfig = savedCatalogScanConfig;
        visiblePluginIds = savedVisiblePluginIds;
        applyUiThemeConfig(savedUiThemeConfig);
        setStatus(
          `\u5df2\u6062\u590d\u9ed8\u8ba4\u8bbe\u7f6e（可见插件 ${visiblePluginIds.length} 个）`
        );
        renderList();
        }
      )
      .catch(() => {
        setStatus("\u6062\u590d\u9ed8\u8ba4\u8bbe\u7f6e\u5931\u8d25");
      });
  });

  const saveButton = document.createElement("button");
  saveButton.type = "submit";
  saveButton.className = "settings-btn settings-btn-primary";
  saveButton.textContent = "\u4fdd\u5b58";

  actions.append(resetButton, saveButton);
  footer.append(footerMeta, actions);
  form.append(settingsBody, footer);

  panel.append(header, form);
  if (wrapInListItem) {
    panelItem.appendChild(panel);
    target.appendChild(panelItem);
  } else {
    target.appendChild(panel);
  }

  showSettingsTab(initialTab);
  settingsFocusHint = undefined;
}

function dismissSettingsOverlay(): void {
  commandCenterUi.closeSettingsOverlay();
  settingsFocusHint = undefined;
  activeSettingsTab = "appearance";
  syncAutoHideSuspension();
}

function refreshOpenSettingsOverlay(): void {
  if (!commandCenterUi.isSettingsOverlayOpen()) {
    return;
  }
  commandCenterUi.openSettingsOverlay((container) => {
    renderSettingsPanel(container, { listItemWrap: false });
  });
}

async function loadSettingsPanelData(): Promise<boolean> {
  const launcher = getLauncherApi();
  if (!launcher) {
    return false;
  }

  try {
    const [
      nextSearchConfig,
      nextUiThemeConfig,
      nextCatalogScanConfig,
      nextVisiblePluginIds,
      nextAllPluginItems,
      nextRequiredVisiblePluginIds,
      nextLaunchAtLoginStatus,
      nextAppUpdaterStatus,
      nextAppVersion,
      nextErrorLogs
    ] = await Promise.all([
      launcher.getSearchDisplayConfig(),
      launcher.getUiThemeConfig().catch(() => uiThemeConfig),
      launcher.getCatalogScanConfig(),
      launcher.getVisiblePluginIds(),
      launcher.getAllPluginItems(),
      launcher.getRequiredVisiblePluginIds(),
      launcher.getLaunchAtLoginStatus(),
      launcher.getAppUpdaterStatus().catch(() => appUpdaterStatus),
      launcher.getAppVersion().catch(() => ""),
      launcher.getErrorLogs(40).catch(() => [])
    ]);

    searchDisplayConfig = nextSearchConfig;
    applyUiThemeConfig(nextUiThemeConfig);
    catalogScanConfig = nextCatalogScanConfig;
    visiblePluginIds = Array.isArray(nextVisiblePluginIds)
      ? parseVisiblePluginIdsText(nextVisiblePluginIds.join("\n"))
      : [];
    allPluginCatalogItems = Array.isArray(nextAllPluginItems)
      ? nextAllPluginItems
      : [];
    requiredVisiblePluginIdSet = new Set(
      Array.isArray(nextRequiredVisiblePluginIds)
        ? nextRequiredVisiblePluginIds.map((id) => id.trim().toLowerCase())
        : []
    );
    launchAtLoginStatus = nextLaunchAtLoginStatus;
    appUpdaterStatus = nextAppUpdaterStatus;
    errorLogEntries = Array.isArray(nextErrorLogs) ? nextErrorLogs : [];
    appVersion =
      typeof nextAppVersion === "string" && nextAppVersion.trim()
        ? nextAppVersion.trim()
        : "未知版本";
    return true;
  } catch {
    return false;
  }
}

async function openSettingsPanel(): Promise<void> {
  if (commandCenterUi.isSettingsOverlayOpen()) {
    return;
  }
  setAutoHideSuspended(true);
  const loaded = await loadSettingsPanelData();
  if (!loaded) {
    setStatus(
      "桥接层未加载，请先彻底退出 LiteLauncher 后再执行 pnpm start"
    );
    syncAutoHideSuspension();
    return;
  }
  commandCenterUi.openSettingsOverlay((container) => {
    renderSettingsPanel(container, { listItemWrap: false });
  });
}
