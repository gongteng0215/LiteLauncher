import path from "node:path";
import { app, BrowserWindow, globalShortcut } from "electron";

import { LaunchItem } from "../shared/types";
import { buildCatalog } from "./catalog";
import { ClipService } from "./clip-service";
import { LiteDatabase } from "./database";
import { registerIpcHandlers } from "./ipc";
import { getInitialItems, searchItems } from "./search";
import { SearchWorkerClient } from "./search-worker";
import { UsageStore } from "./usage-store";
import { createLauncherWindow, toggleLauncherWindow } from "./window";

const DEFAULT_SHORTCUT = "Alt+Space";

let database: LiteDatabase | null = null;
let usageStore: UsageStore | null = null;
let catalog: LaunchItem[] = [];
let catalogInitialized = false;
let shortcutRegistered = false;
let searchWorker: SearchWorkerClient | null = null;
let clipService: ClipService | null = null;

function registerGlobalShortcut(toggle: () => void): void {
  if (shortcutRegistered) {
    return;
  }

  const success = globalShortcut.register(DEFAULT_SHORTCUT, toggle);
  if (!success) {
    // The app stays usable even if shortcut registration fails.
    // Typical reason is key conflict with another app.
    console.warn(`Failed to register shortcut: ${DEFAULT_SHORTCUT}`);
    return;
  }

  shortcutRegistered = true;
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

  if (!usageStore) {
    throw new Error("Usage store was not initialized");
  }
  if (!clipService) {
    throw new Error("Clip service was not initialized");
  }

  const launcherWindow = createLauncherWindow();

  registerIpcHandlers(launcherWindow, {
    usageStore,
    searchProvider: {
      getInitialItems: async (limit) => {
        const usage = usageStore.toObject();
        if (searchWorker) {
          try {
            return await searchWorker.getInitialItems(catalog, usage, limit);
          } catch (error) {
            console.warn("Search worker initial fallback", error);
          }
        }

        return getInitialItems(catalog, usageStore, limit);
      },
      searchItems: async (query, limit) => {
        const usage = usageStore.toObject();
        if (searchWorker) {
          try {
            return await searchWorker.searchItems(query, catalog, usage, limit);
          } catch (error) {
            console.warn("Search worker query fallback", error);
          }
        }

        return searchItems(query, catalog, usageStore, limit);
      }
    },
    clipProvider: {
      getClipItems: (query, limit) => clipService.getClipItems(query, limit),
      copyClipItem: (itemId) => clipService.copyClipItem(itemId),
      deleteClipItem: (itemId) => clipService.deleteClipItem(itemId),
      clearClipItems: () => clipService.clearClipItems()
    },
    onItemUsed: async (itemId) => {
      await database?.recordUsage(itemId);
    }
  });

  clipService.start();
  registerGlobalShortcut(() => toggleLauncherWindow(launcherWindow));
}

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
  app.quit();
}

app.whenReady().then(bootstrap).catch((error) => {
  console.error("Failed to bootstrap app", error);
  app.quit();
});

app.on("second-instance", () => {
  const windows = BrowserWindow.getAllWindows();
  const first = windows[0];
  if (first) {
    toggleLauncherWindow(first);
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void bootstrap();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
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
});
