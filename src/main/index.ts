import path from "node:path";
import { app, BrowserWindow, globalShortcut } from "electron";

import { IPC_CHANNELS } from "../shared/channels";
import { DebugKeyEvent, LaunchItem } from "../shared/types";
import { buildCatalog } from "./catalog";
import { ClipService } from "./clip-service";
import { LiteDatabase } from "./database";
import { registerIpcHandlers } from "./ipc";
import { getInitialItems, searchItems } from "./search";
import { SearchWorkerClient } from "./search-worker";
import { destroyAppTray, setupAppTray } from "./tray";
import { UsageStore } from "./usage-store";
import {
  createLauncherWindow,
  showLauncherWindow,
  toggleLauncherWindow
} from "./window";

const DEFAULT_SHORTCUT = "Alt+Space";
const FALLBACK_SHORTCUTS = ["Ctrl+Space", "Alt+Shift+Space", "Ctrl+Alt+Space"];
const DEBUG_KEYS_ENABLED = process.env.LITELAUNCHER_DEBUG_KEYS === "1";

let database: LiteDatabase | null = null;
let usageStore: UsageStore | null = null;
let catalog: LaunchItem[] = [];
let catalogInitialized = false;
let shortcutRegistered = false;
let activeShortcut: string | null = null;
let searchWorker: SearchWorkerClient | null = null;
let clipService: ClipService | null = null;
let appQuitting = false;

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

async function bootstrap(): Promise<void> {
  await ensureDataLayer();

  const activeUsageStore = usageStore;
  const activeClipService = clipService;
  if (!activeUsageStore) {
    throw new Error("Usage store was not initialized");
  }
  if (!activeClipService) {
    throw new Error("Clip service was not initialized");
  }

  const launcherWindow = createLauncherWindow();
  launcherWindow.on("close", (event) => {
    if (appQuitting) {
      return;
    }
    event.preventDefault();
    launcherWindow.hide();
  });
  launcherWindow.on("blur", () => {
    if (appQuitting || launcherWindow.isDestroyed() || !launcherWindow.isVisible()) {
      return;
    }
    launcherWindow.hide();
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
            return await searchWorker.getInitialItems(catalog, usage, limit);
          } catch (error) {
            console.warn("Search worker initial fallback", error);
          }
        }

        return getInitialItems(catalog, activeUsageStore, limit);
      },
      getRecommendedItems: async (limit) => {
        const recentItems = getInitialItems(catalog, activeUsageStore, 20);
        const recentIds = new Set(recentItems.map((item) => item.id));

        const ranked = getInitialItems(
          catalog,
          activeUsageStore,
          Math.max(limit * 6, 120)
        );
        const picked: LaunchItem[] = [];
        const pickedIds = new Set<string>();

        for (const item of ranked) {
          if (item.type === "command" || recentIds.has(item.id)) {
            continue;
          }
          picked.push(item);
          pickedIds.add(item.id);
          if (picked.length >= limit) {
            return picked;
          }
        }

        const fallbackCandidates = catalog
          .filter(
            (item) =>
              item.type !== "command" &&
              !recentIds.has(item.id) &&
              !pickedIds.has(item.id)
          )
          .sort((a, b) => a.title.localeCompare(b.title));

        for (const item of fallbackCandidates) {
          picked.push(item);
          if (picked.length >= limit) {
            break;
          }
        }

        return picked;
      },
      getPluginItems: async (limit) => {
        return catalog.filter((item) => item.type === "command").slice(0, limit);
      },
      searchItems: async (query, limit) => {
        const usage = activeUsageStore.toObject();
        if (searchWorker) {
          try {
            return await searchWorker.searchItems(query, catalog, usage, limit);
          } catch (error) {
            console.warn("Search worker query fallback", error);
          }
        }

        return searchItems(query, catalog, activeUsageStore, limit);
      }
    },
    clipProvider: {
      getClipItems: (query, limit) => activeClipService.getClipItems(query, limit),
      copyClipItem: (itemId) => activeClipService.copyClipItem(itemId),
      deleteClipItem: (itemId) => activeClipService.deleteClipItem(itemId),
      clearClipItems: () => activeClipService.clearClipItems()
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
  usageStore = null;
  catalog = [];
  catalogInitialized = false;
  shortcutRegistered = false;
  activeShortcut = null;
});
