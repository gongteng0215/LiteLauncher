import path from "node:path";
import { app, BrowserWindow, globalShortcut } from "electron";

import { IPC_CHANNELS } from "../shared/channels";
import {
  DebugKeyEvent,
  LaunchItem,
  LaunchAtLoginStatus,
  SearchDisplayConfig
} from "../shared/types";
import {
  DEFAULT_SEARCH_DISPLAY_CONFIG,
  normalizeSearchDisplayConfig
} from "../shared/settings";
import { buildCatalog } from "./catalog";
import { ClipService } from "./clip-service";
import { LiteDatabase } from "./database";
import { registerIpcHandlers } from "./ipc";
import {
  CashflowDatabasePersistence,
  setCashflowGamePersistence
} from "./plugins/cashflow-game";
import { getPluginQueryItems, isPluginCatalogItem } from "./plugins";
import { getInitialItems, searchItems } from "./search";
import { SearchWorkerClient } from "./search-worker";
import { destroyAppTray, setupAppTray } from "./tray";
import { UsageStore } from "./usage-store";
import {
  applyLauncherWindowSizePreset,
  createLauncherWindow,
  showLauncherWindow,
  toggleLauncherWindow
} from "./window";

const DEFAULT_SHORTCUT = "Alt+Space";
const FALLBACK_SHORTCUTS = ["Ctrl+Space", "Alt+Shift+Space", "Ctrl+Alt+Space"];
const DEBUG_KEYS_ENABLED = process.env.LITELAUNCHER_DEBUG_KEYS === "1";
const APP_USER_MODEL_ID = "LiteLauncher";
const SEARCH_DISPLAY_CONFIG_KEY = "searchDisplayConfig";
const PINNED_ITEMS_KEY = "pinnedItemIds";
const PINNED_ITEMS_MAX = 200;

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
let pinnedItemIds: string[] = [];

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

function setupRendererDiagnostics(window: BrowserWindow): void {
  window.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (!isMainFrame) {
        return;
      }

      console.error(
        `[renderer] did-fail-load code=${errorCode} url=${validatedURL} description=${errorDescription}`
      );
    }
  );

  window.webContents.on("render-process-gone", (_event, details) => {
    console.error(
      `[renderer] render-process-gone reason=${details.reason} exitCode=${details.exitCode}`
    );
  });

  window.webContents.on("preload-error", (_event, preloadPath, error) => {
    console.error(`[renderer] preload-error path=${preloadPath}`, error);
  });

  if (!DEBUG_KEYS_ENABLED) {
    return;
  }

  window.webContents.on("console-message", (details) => {
    const { level, message, lineNumber, sourceId } = details;
    console.info(
      `[renderer:console:${level}] ${sourceId}:${lineNumber} ${message}`
    );
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
    catalog = buildCatalog();
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

    picked.push({ ...item, pinned: true });
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
    if (appQuitting || launcherWindow.isDestroyed() || !launcherWindow.isVisible()) {
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
  setupRendererDiagnostics(launcherWindow);
  await setupAppTray(launcherWindow);

  registerIpcHandlers(launcherWindow, {
    usageStore: activeUsageStore,
    searchProvider: {
      getInitialItems: async (limit) => {
        const usage = activeUsageStore.toObject();
        if (searchWorker) {
          try {
            const items = await searchWorker.getInitialItems(catalog, usage, limit);
            return withPinnedState(items);
          } catch (error) {
            console.warn("Search worker initial fallback", error);
          }
        }

        return withPinnedState(getInitialItems(catalog, activeUsageStore, limit));
      },
      getPinnedItems: async (limit) => {
        return getPinnedItemsFromCatalog(limit);
      },
      getPluginItems: async (limit) => {
        return withPinnedState(
          catalog.filter((item) => item.type === "command" && isPluginCatalogItem(item)).slice(0, limit)
        );
      },
      searchItems: async (query, limit) => {
        const pluginItems = getPluginQueryItems(query);
        const usage = activeUsageStore.toObject();
        let baseItems: LaunchItem[] | null = null;
        if (searchWorker) {
          try {
            baseItems = await searchWorker.searchItems(
              query,
              catalog,
              usage,
              limit
            );
          } catch (error) {
            console.warn("Search worker query fallback", error);
          }
        }

        if (!baseItems) {
          baseItems = searchItems(query, catalog, activeUsageStore, limit);
        }

        const mergedItems = mergeSearchItems(pluginItems, baseItems, limit);
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
      getLaunchAtLoginStatus: () => getLaunchAtLoginStatus(),
      setLaunchAtLoginEnabled: (enabled) =>
        setLaunchAtLoginEnabled(enabled)
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

const singleInstanceLock = app.requestSingleInstanceLock();
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

app.on("second-instance", () => {
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
  shortcutRegistered = false;
  activeShortcut = null;
});
