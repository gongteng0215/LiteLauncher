import path from "node:path";
import fs from "node:fs";
import { app, BrowserWindow, globalShortcut } from "electron";

import { IPC_CHANNELS } from "../shared/channels";
import {
  AppErrorLogInput,
  CatalogRebuildResult,
  CatalogScanConfig,
  DebugKeyEvent,
  LaunchItem,
  LaunchAtLoginStatus,
  SearchScope,
  SearchDisplayConfig
} from "../shared/types";
import {
  DEFAULT_CATALOG_SCAN_CONFIG,
  DEFAULT_SEARCH_DISPLAY_CONFIG,
  normalizeCatalogScanConfig,
  normalizeSearchDisplayConfig
} from "../shared/settings";
import { buildCatalogWithOptions } from "./catalog";
import { ClipService } from "./clip-service";
import { LiteDatabase } from "./database";
import { registerIpcHandlers } from "./ipc";
import { filterItemsByPathRules } from "./path-rule-filter";
import {
  CashflowDatabasePersistence,
  setCashflowGamePersistence
} from "./plugins/cashflow-game";
import {
  getDefaultVisiblePluginIds,
  getPluginCatalogItems,
  getPluginQueryItems,
  isPluginCatalogItem,
  setVisiblePluginIds
} from "./plugins";
import { getDynamicSearchItems, getInitialItems, searchItems } from "./search";
import { SearchWorkerClient } from "./search-worker";
import { destroyAppTray, setupAppTray } from "./tray";
import { UsageStore } from "./usage-store";
import {
  applyLauncherWindowSizePreset,
  createLauncherWindow,
  showLauncherWindow,
  toggleLauncherWindow
} from "./window";
import { isWindowAutoHideSuspended } from "./window-auto-hide";

const DEFAULT_SHORTCUT = "Alt+Space";
const FALLBACK_SHORTCUTS = ["Ctrl+Space", "Alt+Shift+Space", "Ctrl+Alt+Space"];
const DEBUG_KEYS_ENABLED = process.env.LITELAUNCHER_DEBUG_KEYS === "1";
const DEV_MODE = !app.isPackaged && process.env.LITELAUNCHER_DEV === "1";
const E2E_MODE = process.env.LITELAUNCHER_E2E === "1";
const E2E_USER_DATA_DIR = (process.env.LITELAUNCHER_E2E_USER_DATA_DIR ?? "").trim();
const REPLACE_INSTANCE_FLAG = "--replace-instance";
const APP_USER_MODEL_ID = "LiteLauncher";
const SEARCH_DISPLAY_CONFIG_KEY = "searchDisplayConfig";
const CATALOG_SCAN_CONFIG_KEY = "catalogScanConfig";
const VISIBLE_PLUGIN_IDS_KEY = "visiblePluginIds";
const CURRENT_DEFAULT_VISIBLE_PLUGIN_IDS = [
  "cashflow-game",
  "webtools-password",
  "webtools-cron",
  "webtools-json",
  "webtools-crypto",
  "webtools-jwt",
  "webtools-timestamp",
  "webtools-strings",
  "webtools-colors",
  "webtools-diff",
  "webtools-image-base64",
  "webtools-config-convert",
  "webtools-sql-format",
  "webtools-unit-convert",
  "webtools-regex",
  "webtools-url-parse",
  "webtools-qrcode",
  "webtools-markdown",
  "webtools-ua",
  "webtools-api-client"
] as const;
const LEGACY_DEFAULT_VISIBLE_PLUGIN_IDS = [
  "cashflow-game",
  "webtools-password",
  "webtools-cron",
  "webtools-json",
  "webtools-crypto",
  "webtools-jwt",
  "webtools-timestamp"
] as const;
const PREVIOUS_DEFAULT_VISIBLE_PLUGIN_IDS = [
  "cashflow-game",
  "webtools-password",
  "webtools-cron",
  "webtools-json",
  "webtools-crypto",
  "webtools-jwt",
  "webtools-timestamp",
  "webtools-regex",
  "webtools-url-parse",
  "webtools-qrcode",
  "webtools-markdown"
] as const;
const OLDER_DEFAULT_VISIBLE_PLUGIN_IDS = [
  "cashflow-game",
  "webtools-password",
  "webtools-cron",
  "webtools-json",
  "webtools-crypto",
  "webtools-jwt",
  "webtools-timestamp",
  "webtools-regex",
  "webtools-url-parse"
] as const;
const PINNED_ITEMS_KEY = "pinnedItemIds";
const PINNED_ITEMS_MAX = 200;
const VISIBLE_PLUGIN_IDS_MAX = 50;

if (E2E_USER_DATA_DIR) {
  app.setPath("userData", E2E_USER_DATA_DIR);
}

let database: LiteDatabase | null = null;
let usageStore: UsageStore | null = null;
let catalog: LaunchItem[] = [];
let catalogInitialized = false;
let shortcutRegistered = false;
let activeShortcut: string | null = null;
let searchWorker: SearchWorkerClient | null = null;
let clipService: ClipService | null = null;
let appQuitting = false;
let searchDisplayConfig: SearchDisplayConfig = {
  ...DEFAULT_SEARCH_DISPLAY_CONFIG
};
let catalogScanConfig: CatalogScanConfig = {
  ...DEFAULT_CATALOG_SCAN_CONFIG
};
let visiblePluginIds: string[] = getDefaultVisiblePluginIds();
let pinnedItemIds: string[] = [];
let processErrorHooksRegistered = false;
let devRendererWatcher: fs.FSWatcher | null = null;
let devAssetsWatcher: fs.FSWatcher | null = null;
let devReloadTimer: NodeJS.Timeout | null = null;

function formatErrorDetail(error: unknown): string {
  if (error instanceof Error) {
    return `${error.message}${error.stack ? `\n${error.stack}` : ""}`;
  }
  return String(error);
}

function queueErrorLog(input: AppErrorLogInput): void {
  const activeDatabase = database;
  if (!activeDatabase) {
    return;
  }

  void activeDatabase.recordErrorLog(input).catch((error) => {
    console.error("[error-log] failed to persist", error);
  });
}

function registerProcessErrorHooks(): void {
  if (processErrorHooksRegistered) {
    return;
  }

  processErrorHooksRegistered = true;
  process.on("uncaughtException", (error) => {
    queueErrorLog({
      scope: "system",
      level: "error",
      message: "主进程未捕获异常",
      detail: formatErrorDetail(error)
    });
  });
  process.on("unhandledRejection", (reason) => {
    queueErrorLog({
      scope: "system",
      level: "error",
      message: "主进程未处理 Promise 拒绝",
      detail: formatErrorDetail(reason)
    });
  });
}

function scheduleDevRendererReload(reason: string): void {
  if (!DEV_MODE) {
    return;
  }

  if (devReloadTimer !== null) {
    clearTimeout(devReloadTimer);
  }

  devReloadTimer = setTimeout(() => {
    devReloadTimer = null;
    const windows = BrowserWindow.getAllWindows().filter(
      (window) => !window.isDestroyed() && !window.webContents.isDestroyed()
    );
    if (windows.length === 0) {
      return;
    }

    console.info(`[dev] renderer changed: ${reason}, reloading ${windows.length} window(s)`);
    for (const window of windows) {
      window.webContents.reloadIgnoringCache();
    }
  }, 80);
}

function closeDevRendererWatchers(): void {
  if (devReloadTimer !== null) {
    clearTimeout(devReloadTimer);
    devReloadTimer = null;
  }
  if (devRendererWatcher) {
    devRendererWatcher.close();
    devRendererWatcher = null;
  }
  if (devAssetsWatcher) {
    devAssetsWatcher.close();
    devAssetsWatcher = null;
  }
}

function setupDevRendererAutoReload(): void {
  if (!DEV_MODE || devRendererWatcher || devAssetsWatcher) {
    return;
  }

  const rendererDir = path.join(__dirname, "../renderer");
  const assetsDir = path.join(__dirname, "../assets");

  const onChange =
    (scope: string) =>
    (_eventType: string, filename: string | null): void => {
      const name = typeof filename === "string" ? filename : "";
      if (!name) {
        return;
      }
      scheduleDevRendererReload(`${scope}/${name.replace(/\\/g, "/")}`);
    };

  try {
    if (fs.existsSync(rendererDir)) {
      devRendererWatcher = fs.watch(
        rendererDir,
        { recursive: true, encoding: "utf8" },
        onChange("renderer")
      );
    }
    if (fs.existsSync(assetsDir)) {
      devAssetsWatcher = fs.watch(
        assetsDir,
        { recursive: true, encoding: "utf8" },
        onChange("assets")
      );
    }
    console.info("[dev] renderer auto reload enabled");
  } catch (error) {
    console.warn("[dev] failed to watch renderer output", error);
    closeDevRendererWatchers();
  }
}

function resolveLoginItemPathAndArgs(): { path: string; args: string[] } {
  if (app.isPackaged) {
    return {
      path: process.execPath,
      args: []
    };
  }

  return {
    path: process.execPath,
    args: [app.getAppPath()]
  };
}

function getLaunchAtLoginStatus(): LaunchAtLoginStatus {
  if (process.platform !== "win32" && process.platform !== "darwin") {
    return {
      enabled: false,
      supported: false,
      reason: "当前平台不支持开机启动"
    };
  }

  try {
    const { path, args } = resolveLoginItemPathAndArgs();
    const settings = app.getLoginItemSettings({ path, args });
    const enabled =
      typeof settings.executableWillLaunchAtLogin === "boolean"
        ? settings.executableWillLaunchAtLogin
        : Boolean(settings.openAtLogin);

    return {
      enabled,
      supported: true
    };
  } catch (error) {
    return {
      enabled: false,
      supported: false,
      reason: error instanceof Error ? error.message : "读取开机启动状态失败"
    };
  }
}

async function setLaunchAtLoginEnabled(
  enabled: boolean
): Promise<LaunchAtLoginStatus> {
  if (process.platform !== "win32" && process.platform !== "darwin") {
    return {
      enabled: false,
      supported: false,
      reason: "当前平台不支持开机启动"
    };
  }

  try {
    const { path, args } = resolveLoginItemPathAndArgs();
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: false,
      path,
      args
    });
    return getLaunchAtLoginStatus();
  } catch (error) {
    return {
      enabled: false,
      supported: false,
      reason: error instanceof Error ? error.message : "设置开机启动失败"
    };
  }
}

function buildShortcutCandidates(): string[] {
  const envShortcut = (process.env.LITELAUNCHER_SHORTCUT ?? "").trim();
  const rawCandidates = [envShortcut, DEFAULT_SHORTCUT, ...FALLBACK_SHORTCUTS];
  const unique = new Set<string>();

  for (const item of rawCandidates) {
    if (!item) {
      continue;
    }
    unique.add(item);
  }

  return Array.from(unique);
}

function emitDebugKey(window: BrowserWindow, event: DebugKeyEvent): void {
  if (!DEBUG_KEYS_ENABLED || window.isDestroyed()) {
    return;
  }

  window.webContents.send(IPC_CHANNELS.debugKey, event);

  const mods = [
    event.control ? "Ctrl" : "",
    event.alt ? "Alt" : "",
    event.shift ? "Shift" : "",
    event.meta ? "Meta" : ""
  ]
    .filter(Boolean)
    .join("+");
  const keyLabel = event.key || "(none)";
  const note = event.note ? ` note=${event.note}` : "";
  const code = event.code ? ` code=${event.code}` : "";
  console.info(
    `[debug:key][${event.source}] phase=${event.phase} key=${mods ? `${mods}+` : ""}${keyLabel}${code}${note}`
  );
}

function setupDebugKeyTracing(window: BrowserWindow): void {
  if (!DEBUG_KEYS_ENABLED) {
    return;
  }

  window.webContents.on("did-finish-load", () => {
    emitDebugKey(window, {
      source: "main",
      phase: "debug-enabled",
      key: "init",
      ts: Date.now(),
      note: "LITELAUNCHER_DEBUG_KEYS=1"
    });
  });

  window.on("focus", () => {
    emitDebugKey(window, {
      source: "main",
      phase: "window-focus",
      key: "focus",
      ts: Date.now()
    });
  });

  window.on("blur", () => {
    emitDebugKey(window, {
      source: "main",
      phase: "window-blur",
      key: "blur",
      ts: Date.now()
    });
  });

  window.webContents.on("focus", () => {
    emitDebugKey(window, {
      source: "main",
      phase: "webcontents-focus",
      key: "focus",
      ts: Date.now()
    });
  });

  window.webContents.on("blur", () => {
    emitDebugKey(window, {
      source: "main",
      phase: "webcontents-blur",
      key: "blur",
      ts: Date.now()
    });
  });

  window.webContents.on("before-input-event", (_event, input) => {
    emitDebugKey(window, {
      source: "main",
      phase: input.type,
      key: input.key,
      code: input.code,
      alt: input.alt,
      control: input.control,
      shift: input.shift,
      meta: input.meta,
      repeat: input.isAutoRepeat,
      ts: Date.now()
    });
  });
}

function setupRendererDiagnostics(
  window: BrowserWindow,
  onError?: (input: AppErrorLogInput) => void
): void {
  window.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (!isMainFrame) {
        return;
      }

      console.error(
        `[renderer] did-fail-load code=${errorCode} url=${validatedURL} description=${errorDescription}`
      );
      onError?.({
        scope: "main",
        level: "error",
        message: "渲染进程加载失败",
        context: `code=${errorCode}; url=${validatedURL}`,
        detail: errorDescription
      });
    }
  );

  window.webContents.on("render-process-gone", (_event, details) => {
    console.error(
      `[renderer] render-process-gone reason=${details.reason} exitCode=${details.exitCode}`
    );
    onError?.({
      scope: "main",
      level: "error",
      message: "渲染进程退出",
      context: `reason=${details.reason}; exitCode=${details.exitCode}`
    });
  });

  window.webContents.on("preload-error", (_event, preloadPath, error) => {
    console.error(`[renderer] preload-error path=${preloadPath}`, error);
    onError?.({
      scope: "main",
      level: "error",
      message: "预加载脚本异常",
      context: preloadPath,
      detail: formatErrorDetail(error)
    });
  });

  if (!DEBUG_KEYS_ENABLED) {
    return;
  }

  window.webContents.on("console-message", (details) => {
    const { level, message, lineNumber, sourceId } = details;
    console.info(
      `[renderer:console:${level}] ${sourceId}:${lineNumber} ${message}`
    );
    const levelNumber = Number(level);
    if (Number.isFinite(levelNumber) && levelNumber >= 2) {
      onError?.({
        scope: "renderer",
        level: "error",
        message: "渲染层控制台报错",
        context: `${sourceId}:${lineNumber}`,
        detail: message
      });
    }
  });
}

function registerGlobalShortcut(
  toggle: () => void,
  onTrigger?: (shortcut: string) => void
): void {
  if (shortcutRegistered) {
    return;
  }

  for (const shortcut of buildShortcutCandidates()) {
    const success = globalShortcut.register(shortcut, () => {
      onTrigger?.(shortcut);
      toggle();
    });
    if (!success) {
      console.warn(`Failed to register shortcut: ${shortcut}`);
      continue;
    }

    shortcutRegistered = true;
    activeShortcut = shortcut;

    if (shortcut === DEFAULT_SHORTCUT) {
      console.info(`Global shortcut registered: ${shortcut}`);
    } else {
      console.warn(
        `Shortcut ${DEFAULT_SHORTCUT} unavailable. Using fallback: ${shortcut}`
      );
    }
    return;
  }

  console.error(
    "No global shortcut could be registered. Set LITELAUNCHER_SHORTCUT to an unused key combination."
  );
}

async function ensureDataLayer(): Promise<void> {
  if (!database) {
    const dbPath = path.join(app.getPath("userData"), "litelauncher.db");
    database = new LiteDatabase(dbPath);
    await database.init();
  }

  if (!catalogInitialized) {
    catalogScanConfig = await loadCatalogScanConfig(database);
    catalog = buildCatalogWithOptions(catalogScanConfig);
    catalogInitialized = true;
  }

  await database.saveItems(catalog);
  catalog = await database.getItems();

  if (!usageStore) {
    const usageMap = await database.getUsageMap();
    usageStore = new UsageStore(usageMap);
  }

  if (!searchWorker) {
    searchWorker = new SearchWorkerClient();
  }

  if (!clipService) {
    clipService = new ClipService(database);
  }
}

async function loadSearchDisplayConfig(
  db: LiteDatabase
): Promise<SearchDisplayConfig> {
  const raw = await db.getSetting(SEARCH_DISPLAY_CONFIG_KEY);
  if (!raw) {
    return { ...DEFAULT_SEARCH_DISPLAY_CONFIG };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SearchDisplayConfig>;
    return normalizeSearchDisplayConfig(parsed);
  } catch {
    return { ...DEFAULT_SEARCH_DISPLAY_CONFIG };
  }
}

async function saveSearchDisplayConfig(
  db: LiteDatabase,
  config: Partial<SearchDisplayConfig>
): Promise<SearchDisplayConfig> {
  const next = normalizeSearchDisplayConfig(config, searchDisplayConfig);
  await db.setSetting(SEARCH_DISPLAY_CONFIG_KEY, JSON.stringify(next));
  searchDisplayConfig = next;
  return next;
}

async function loadCatalogScanConfig(
  db: LiteDatabase
): Promise<CatalogScanConfig> {
  const raw = await db.getSetting(CATALOG_SCAN_CONFIG_KEY);
  if (!raw) {
    return { ...DEFAULT_CATALOG_SCAN_CONFIG };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CatalogScanConfig>;
    return normalizeCatalogScanConfig(parsed);
  } catch {
    return { ...DEFAULT_CATALOG_SCAN_CONFIG };
  }
}

async function saveCatalogScanConfig(
  db: LiteDatabase,
  config: Partial<CatalogScanConfig>
): Promise<CatalogScanConfig> {
  const next = normalizeCatalogScanConfig(config, catalogScanConfig);
  await db.setSetting(CATALOG_SCAN_CONFIG_KEY, JSON.stringify(next));
  catalogScanConfig = next;
  return next;
}

function normalizeVisiblePluginIdsInput(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const result: string[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (typeof raw !== "string") {
      continue;
    }

    const value = raw.trim().toLowerCase();
    if (!value || seen.has(value)) {
      continue;
    }

    seen.add(value);
    result.push(value);
    if (result.length >= VISIBLE_PLUGIN_IDS_MAX) {
      break;
    }
  }

  return result;
}

function areStringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function areStringArraysSetEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  if (rightSet.size !== right.length) {
    return false;
  }

  for (const value of left) {
    if (!rightSet.has(value)) {
      return false;
    }
  }

  return true;
}

function normalizePinnedItemIds(
  input: unknown,
  catalogIds?: Set<string>
): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const result: string[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (typeof raw !== "string") {
      continue;
    }

    const id = raw.trim();
    if (!id || seen.has(id)) {
      continue;
    }

    if (catalogIds && !catalogIds.has(id)) {
      continue;
    }

    seen.add(id);
    result.push(id);
    if (result.length >= PINNED_ITEMS_MAX) {
      break;
    }
  }

  return result;
}

async function loadPinnedItemIds(
  db: LiteDatabase,
  catalogIds: Set<string>
): Promise<string[]> {
  const raw = await db.getSetting(PINNED_ITEMS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return normalizePinnedItemIds(JSON.parse(raw), catalogIds);
  } catch {
    return [];
  }
}

async function persistPinnedItemIds(db: LiteDatabase): Promise<void> {
  await db.setSetting(PINNED_ITEMS_KEY, JSON.stringify(pinnedItemIds));
}

async function persistCatalogSnapshot(
  db: LiteDatabase,
  nextCatalog: LaunchItem[]
): Promise<void> {
  await db.saveItems(nextCatalog);
  catalog = await db.getItems();
  catalogInitialized = true;

  const catalogIdSet = new Set(catalog.map((item) => item.id));
  const normalizedPinned = normalizePinnedItemIds(pinnedItemIds, catalogIdSet);
  const pinnedChanged = !areStringArraysEqual(normalizedPinned, pinnedItemIds);
  if (pinnedChanged) {
    pinnedItemIds = normalizedPinned;
    await persistPinnedItemIds(db);
  }
}

function replaceCatalogPluginItems(items: LaunchItem[]): LaunchItem[] {
  const nonPluginItems = items.filter(
    (item) => !(item.type === "command" && isPluginCatalogItem(item))
  );
  return [...nonPluginItems, ...getPluginCatalogItems()];
}

async function loadVisiblePluginIds(db: LiteDatabase): Promise<string[]> {
  const fallback = setVisiblePluginIds(getDefaultVisiblePluginIds());
  const raw = await db.getSetting(VISIBLE_PLUGIN_IDS_KEY);
  if (!raw) {
    await db.setSetting(VISIBLE_PLUGIN_IDS_KEY, JSON.stringify(fallback));
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    const requested = normalizeVisiblePluginIdsInput(parsed);
    const applied = setVisiblePluginIds(requested);
    const shouldFallback = requested.length > 0 && applied.length === 0;
    const shouldUpgradeCurrentDefault = areStringArraysSetEqual(
      applied,
      [...CURRENT_DEFAULT_VISIBLE_PLUGIN_IDS]
    );
    const shouldUpgradeLegacyDefault = areStringArraysSetEqual(
      applied,
      [...LEGACY_DEFAULT_VISIBLE_PLUGIN_IDS]
    );
    const shouldUpgradePreviousDefault = areStringArraysSetEqual(
      applied,
      [...PREVIOUS_DEFAULT_VISIBLE_PLUGIN_IDS]
    );
    const shouldUpgradeOlderDefault = areStringArraysSetEqual(
      applied,
      [...OLDER_DEFAULT_VISIBLE_PLUGIN_IDS]
    );
    const next =
      shouldFallback ||
      shouldUpgradeCurrentDefault ||
      shouldUpgradeLegacyDefault ||
      shouldUpgradePreviousDefault ||
      shouldUpgradeOlderDefault
        ? fallback
        : applied;
    if (
      shouldFallback ||
      shouldUpgradeCurrentDefault ||
      shouldUpgradeLegacyDefault ||
      shouldUpgradePreviousDefault ||
      shouldUpgradeOlderDefault ||
      !areStringArraysEqual(next, requested)
    ) {
      await db.setSetting(VISIBLE_PLUGIN_IDS_KEY, JSON.stringify(next));
    }
    return next;
  } catch {
    await db.setSetting(VISIBLE_PLUGIN_IDS_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

async function saveVisiblePluginIds(
  db: LiteDatabase,
  pluginIds: unknown
): Promise<string[]> {
  const requested = normalizeVisiblePluginIdsInput(pluginIds);
  const applied = setVisiblePluginIds(requested);
  visiblePluginIds = applied;
  await db.setSetting(VISIBLE_PLUGIN_IDS_KEY, JSON.stringify(applied));

  const nextCatalog = replaceCatalogPluginItems(catalog);
  await persistCatalogSnapshot(db, nextCatalog);
  return applied;
}

async function rebuildCatalogIndex(
  db: LiteDatabase
): Promise<CatalogRebuildResult> {
  const startedAt = Date.now();
  try {
    const nextCatalog = buildCatalogWithOptions(catalogScanConfig);
    await persistCatalogSnapshot(db, nextCatalog);

    return {
      ok: true,
      message: `索引重建完成：共 ${catalog.length} 项，应用 ${catalog.filter((item) => item.type === "application").length} 项`,
      totalItems: catalog.length,
      applicationItems: catalog.filter((item) => item.type === "application")
        .length,
      durationMs: Date.now() - startedAt
    };
  } catch (error) {
    const reason =
      error instanceof Error && error.message ? error.message : "未知错误";
    return {
      ok: false,
      message: `索引重建失败：${reason}`,
      totalItems: catalog.length,
      applicationItems: catalog.filter((item) => item.type === "application")
        .length,
      durationMs: Date.now() - startedAt
    };
  }
}

function withPinnedState(items: LaunchItem[]): LaunchItem[] {
  const pinnedSet = new Set(pinnedItemIds);
  return items.map((item) => ({ ...item, pinned: pinnedSet.has(item.id) }));
}

function getPinnedItemsFromCatalog(limit: number): LaunchItem[] {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const picked: LaunchItem[] = [];

  for (const itemId of pinnedItemIds) {
    const item = byId.get(itemId);
    if (!item) {
      continue;
    }

    const filtered = filterItemsByResultPathRules([item]);
    if (filtered.length === 0) {
      continue;
    }

    picked.push({ ...filtered[0], pinned: true });
    if (picked.length >= limit) {
      break;
    }
  }

  return picked;
}

function mergeSearchItems(
  preferred: LaunchItem[],
  fallback: LaunchItem[],
  limit: number
): LaunchItem[] {
  if (limit <= 0) {
    return [];
  }

  const result: LaunchItem[] = [];
  const seen = new Set<string>();

  const push = (items: LaunchItem[]): void => {
    for (const item of items) {
      const id = item.id.trim();
      if (!id || seen.has(id)) {
        continue;
      }

      seen.add(id);
      result.push(item);
      if (result.length >= limit) {
        return;
      }
    }
  };

  push(preferred);
  if (result.length < limit) {
    push(fallback);
  }

  return result.slice(0, limit);
}

function matchesSearchScope(item: LaunchItem, scope: SearchScope): boolean {
  if (scope === "all") {
    return true;
  }

  if (scope === "plugin") {
    return (
      item.type === "command" &&
      item.target.trim().toLowerCase().startsWith("command:plugin:")
    );
  }

  if (
    scope === "command" &&
    item.type === "command" &&
    item.target.trim().toLowerCase().startsWith("command:plugin:")
  ) {
    return false;
  }

  return item.type === scope;
}

function filterItemsByResultPathRules(items: LaunchItem[]): LaunchItem[] {
  return filterItemsByPathRules(items, {
    includeDirs: catalogScanConfig.resultIncludeDirs ?? [],
    excludeDirs: catalogScanConfig.resultExcludeDirs ?? []
  });
}

async function setItemPinned(
  db: LiteDatabase,
  itemId: string,
  pinned: boolean
): Promise<boolean> {
  const normalizedId = itemId.trim();
  if (!normalizedId) {
    return false;
  }

  const catalogIdSet = new Set(catalog.map((item) => item.id));
  if (!catalogIdSet.has(normalizedId)) {
    return false;
  }

  const exists = pinnedItemIds.includes(normalizedId);
  if (pinned) {
    if (!exists) {
      pinnedItemIds = [normalizedId, ...pinnedItemIds].slice(0, PINNED_ITEMS_MAX);
    }
  } else if (exists) {
    pinnedItemIds = pinnedItemIds.filter((id) => id !== normalizedId);
  }

  pinnedItemIds = normalizePinnedItemIds(pinnedItemIds, catalogIdSet);
  await persistPinnedItemIds(db);
  return pinnedItemIds.includes(normalizedId);
}

async function bootstrap(): Promise<void> {
  await ensureDataLayer();
  registerProcessErrorHooks();
  setupDevRendererAutoReload();

  const activeUsageStore = usageStore;
  const activeClipService = clipService;
  const activeDatabase = database;
  if (!activeUsageStore) {
    throw new Error("Usage store was not initialized");
  }
  if (!activeClipService) {
    throw new Error("Clip service was not initialized");
  }
  if (!activeDatabase) {
    throw new Error("Database was not initialized");
  }

  searchDisplayConfig = await loadSearchDisplayConfig(activeDatabase);
  catalogScanConfig = await loadCatalogScanConfig(activeDatabase);
  visiblePluginIds = await loadVisiblePluginIds(activeDatabase);
  await persistCatalogSnapshot(
    activeDatabase,
    replaceCatalogPluginItems(catalog)
  );
  setCashflowGamePersistence(new CashflowDatabasePersistence(activeDatabase));
  const catalogIdSet = new Set(catalog.map((item) => item.id));
  pinnedItemIds = await loadPinnedItemIds(activeDatabase, catalogIdSet);
  if (pinnedItemIds.length > 0) {
    await persistPinnedItemIds(activeDatabase);
  }

  const launcherWindow = createLauncherWindow();
  launcherWindow.on("close", (event) => {
    if (appQuitting) {
      return;
    }
    event.preventDefault();
    applyLauncherWindowSizePreset(launcherWindow, "compact");
    launcherWindow.hide();
  });
  launcherWindow.on("blur", () => {
    if (
      E2E_MODE ||
      appQuitting ||
      launcherWindow.isDestroyed() ||
      !launcherWindow.isVisible() ||
      isWindowAutoHideSuspended(launcherWindow)
    ) {
      return;
    }
    applyLauncherWindowSizePreset(launcherWindow, "compact");
    launcherWindow.hide();
  });
  launcherWindow.on("hide", () => {
    if (
      appQuitting ||
      launcherWindow.isDestroyed() ||
      launcherWindow.webContents.isDestroyed()
    ) {
      return;
    }
    launcherWindow.webContents.send(IPC_CHANNELS.clearInput);
  });

  setupDebugKeyTracing(launcherWindow);
  setupRendererDiagnostics(launcherWindow, (input) => {
    queueErrorLog(input);
  });
  if (!E2E_MODE) {
    await setupAppTray(launcherWindow);
  }

  registerIpcHandlers(launcherWindow, {
    usageStore: activeUsageStore,
    searchProvider: {
      getInitialItems: async (limit) => {
        const filteredCatalog = filterItemsByResultPathRules(catalog);
        const usage = activeUsageStore.toObject();
        if (searchWorker) {
          try {
            const items = await searchWorker.getInitialItems(
              filteredCatalog,
              usage,
              limit
            );
            return withPinnedState(items);
          } catch (error) {
            console.warn("Search worker initial fallback", error);
          }
        }

        return withPinnedState(
          getInitialItems(filteredCatalog, activeUsageStore, limit)
        );
      },
      getPinnedItems: async (limit) => {
        return getPinnedItemsFromCatalog(limit);
      },
      getPluginItems: async () => {
        return withPinnedState(
          catalog.filter((item) => item.type === "command" && isPluginCatalogItem(item))
        );
      },
      searchItems: async (query, limit, options) => {
        const scope = options?.scope ?? "all";
        const filteredCatalog = filterItemsByResultPathRules(catalog);
        const pluginItems =
          scope === "all" || scope === "plugin"
            ? getPluginQueryItems(query).filter((item) =>
                matchesSearchScope(item, scope)
              )
            : [];
        const usage = activeUsageStore.toObject();
        let baseItems: LaunchItem[] | null = null;
        if (searchWorker) {
          try {
            baseItems = await searchWorker.searchItems(
              query,
              filteredCatalog,
              usage,
              limit,
              options
            );
          } catch (error) {
            console.warn("Search worker query fallback", error);
          }
        }

        if (!baseItems) {
          baseItems = searchItems(
            query,
            filteredCatalog,
            activeUsageStore,
            limit,
            options
          );
        }

        const dynamicItems = getDynamicSearchItems(query, scope).filter((item) => {
          return !baseItems?.some(
            (existing) =>
              existing.id === item.id ||
              existing.target.trim().toLowerCase() === item.target.trim().toLowerCase()
          );
        });
        const rankedBaseItems =
          dynamicItems.length > 0
            ? mergeSearchItems(dynamicItems, baseItems, limit)
            : baseItems.slice(0, limit);

        const mergedItems =
          pluginItems.length > 0
            ? mergeSearchItems(pluginItems, rankedBaseItems, limit)
            : rankedBaseItems.slice(0, limit);
        return withPinnedState(mergedItems);
      }
    },
    clipProvider: {
      getClipItems: (query, limit) => activeClipService.getClipItems(query, limit),
      copyClipItem: (itemId) => activeClipService.copyClipItem(itemId),
      deleteClipItem: (itemId) => activeClipService.deleteClipItem(itemId),
      clearClipItems: () => activeClipService.clearClipItems()
    },
    settingsProvider: {
      getSearchDisplayConfig: () => ({ ...searchDisplayConfig }),
      setSearchDisplayConfig: (config) =>
        saveSearchDisplayConfig(activeDatabase, config),
      getCatalogScanConfig: () => ({ ...catalogScanConfig }),
      setCatalogScanConfig: (config) =>
        saveCatalogScanConfig(activeDatabase, config),
      getVisiblePluginIds: () => [...visiblePluginIds],
      setVisiblePluginIds: (pluginIds) =>
        saveVisiblePluginIds(activeDatabase, pluginIds),
      getLaunchAtLoginStatus: () => getLaunchAtLoginStatus(),
      setLaunchAtLoginEnabled: (enabled) =>
        setLaunchAtLoginEnabled(enabled)
    },
    catalogProvider: {
      rebuildCatalog: () => rebuildCatalogIndex(activeDatabase)
    },
    errorLogProvider: {
      recordError: (input) => activeDatabase.recordErrorLog(input),
      getErrorLogs: (limit) => activeDatabase.getErrorLogs(limit),
      clearErrorLogs: () => activeDatabase.clearErrorLogs()
    },
    pinProvider: {
      setItemPinned: (itemId, pinned) =>
        setItemPinned(activeDatabase, itemId, pinned)
    },
    onItemUsed: async (itemId) => {
      await database?.recordUsage(itemId);
    }
  });

  activeClipService.start();
  if (!E2E_MODE) {
    registerGlobalShortcut(
      () => toggleLauncherWindow(launcherWindow),
      (shortcut) => {
        emitDebugKey(launcherWindow, {
          source: "main",
          phase: "global-shortcut",
          key: shortcut,
          ts: Date.now(),
          note: "shortcut callback fired"
        });
      }
    );
  }

  if (E2E_MODE) {
    if (launcherWindow.webContents.isLoadingMainFrame()) {
      launcherWindow.webContents.once("did-finish-load", () => {
        if (!launcherWindow.isDestroyed()) {
          showLauncherWindow(launcherWindow);
        }
      });
    } else {
      showLauncherWindow(launcherWindow);
    }
  }
}

const singleInstanceLock = E2E_MODE ? true : app.requestSingleInstanceLock();
if (!singleInstanceLock) {
  app.quit();
}

if (process.platform === "win32") {
  app.setAppUserModelId(APP_USER_MODEL_ID);
}

app.whenReady().then(bootstrap).catch((error) => {
  console.error("Failed to bootstrap app", error);
  app.quit();
});

app.on("before-quit", () => {
  appQuitting = true;
});

app.on("second-instance", (_event, argv) => {
  const replaceRequested = argv.some((value) => value === REPLACE_INSTANCE_FLAG);
  if (replaceRequested) {
    const relaunchArgs = process.argv
      .slice(1)
      .filter((value) => value !== REPLACE_INSTANCE_FLAG);
    console.info("[startup] replace-instance requested, relaunching running process");
    app.relaunch({ args: relaunchArgs });
    app.quit();
    return;
  }

  const windows = BrowserWindow.getAllWindows();
  const first = windows[0];
  if (first) {
    void setupAppTray(first).catch((error) => {
      console.warn("Failed to refresh tray icon on second-instance", error);
    });

    if (!app.isPackaged) {
      const shouldShow = !first.isVisible();
      first.webContents.reloadIgnoringCache();
      if (shouldShow) {
        first.webContents.once("did-finish-load", () => {
          if (!first.isDestroyed()) {
            showLauncherWindow(first);
          }
        });
      }
      return;
    }

    toggleLauncherWindow(first);
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void bootstrap();
  }
});

app.on("will-quit", () => {
  appQuitting = true;
  closeDevRendererWatchers();
  globalShortcut.unregisterAll();
  destroyAppTray();
  if (clipService) {
    clipService.stop();
    clipService = null;
  }
  if (searchWorker) {
    void searchWorker.terminate();
    searchWorker = null;
  }
  if (database) {
    void database.close();
    database = null;
  }
  setCashflowGamePersistence(null);
  usageStore = null;
  catalog = [];
  catalogInitialized = false;
  catalogScanConfig = { ...DEFAULT_CATALOG_SCAN_CONFIG };
  visiblePluginIds = getDefaultVisiblePluginIds();
  setVisiblePluginIds(visiblePluginIds);
  shortcutRegistered = false;
  activeShortcut = null;
});
