import path from "node:path";
import fs from "node:fs";
import { app, BrowserWindow, clipboard, globalShortcut, nativeImage, screen, shell, type Event, type Input } from "electron";

import { IPC_CHANNELS } from "../shared/channels";
import {
  createDefaultLiteSnapSettings,
  LITESNAP_PLUGIN_ID,
  type LiteSnapOcrIssue,
  type LiteSnapRecognizeTextInput,
  type LiteSnapSettings,
  type LiteSnapShortcutRegistrationResult,
  type LiteSnapTranslateSelectionInput
} from "../shared/litesnap";
import {
  type TranslateResult,
  type TranslateTextInput
} from "../shared/translate";
import {
  AppErrorLogInput,
  CatalogRebuildResult,
  CatalogScanConfig,
  DebugKeyEvent,
  LaunchItem,
  LaunchAtLoginStatus,
  PinToggleResult,
  SearchScope,
  SearchDisplayConfig
} from "../shared/types";
import {
  DEFAULT_CATALOG_SCAN_CONFIG,
  DEFAULT_SEARCH_DISPLAY_CONFIG,
  normalizeCatalogScanConfig,
  normalizeSearchDisplayConfig
} from "../shared/settings";
import {
  DEFAULT_UI_THEME_CONFIG,
  normalizeUiThemeConfig,
  UI_THEME_CONFIG_KEY,
  type UiThemeConfig
} from "../shared/ui-theme";
import { createAppUpdater } from "./app-updater";
import { buildCatalogWithOptions } from "./catalog";
import { CatalogChangeWatcher } from "./catalog-watcher";
import { ClipService } from "./clip-service";
import { LiteDatabase } from "./database";
import { registerIpcHandlers } from "./ipc";
import { LiteSnapCaptureSessionManager } from "./litesnap/capture-session-manager";
import { LiteSnapHistoryStore } from "./litesnap/history-store";
import { LiteSnapImageStore } from "./litesnap/image-store";
import { translateWithBaidu } from "./translate/baidu-translator";
import { TranslateSettingsStore } from "./translate/settings";
import { DictionaryStore } from "./dictionary/store";
import { DictionaryPanelStateStore } from "./dictionary/panel-state";
import { DictionaryPackManager, migrateBundledDictionaryIfNeeded, DICTIONARY_BUNDLED_MIGRATED_KEY } from "./dictionary/pack";
import { captureSelectedText } from "./selection-translate/capture";
import { showSelectionPopup } from "./selection-translate/popup-window";
import { SelectionTranslateSettingsStore } from "./selection-translate/settings";
import { isDictionaryLookupText, isEnglishWordOrPhrase, isChineseWordOrPhrase } from "../shared/dictionary";
import {
  type SelectionTranslateSettings
} from "../shared/selection-translate";
import { LiteSnapPinWindowManager } from "./litesnap/pin-window-manager";
import { LiteSnapSettingsStore } from "./litesnap/settings";
import {
  getLiteSnapOcrProbeCache,
  setLiteSnapOcrProbeCache
} from "./litesnap/ocr-probe-cache";
import { initWebtoolsCronStore } from "./plugins/webtools-cron/store";
import { filterItemsByPathRules } from "./path-rule-filter";
import { normalizePinnedItemIds, validatePinnedItemRequest } from "./pinning";
import {
  isCustomPinId,
  parsePinnedCustomItems,
  resolvePinItemForPath,
  serializePinnedCustomItems
} from "./custom-pins";
import {
  ClipboardWorkbenchService,
  setClipboardWorkbenchService
} from "./plugins/clipboard-workbench";
import {
  CashflowDatabasePersistence,
  setCashflowGamePersistence
} from "./plugins/cashflow-game";
import {
  getDefaultVisiblePluginIds,
  getAllPluginCatalogItems,
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
  hideLauncherWindow,
  LauncherWindowDiagnosticEvent,
  LauncherWindowShowTrigger,
  showLauncherWindowAsync,
  toggleLauncherWindow
} from "./window";
import { isWindowAutoHideSuspended, setWindowAutoHideSuspended } from "./window-auto-hide";

// Avoid Windows DWM show/hide animation replaying a stale window bitmap.
app.commandLine.appendSwitch("wm-window-animations-disabled");

const DEFAULT_SHORTCUT = "Alt+Space";
const FALLBACK_SHORTCUTS = ["Ctrl+Space", "Alt+Shift+Space", "Ctrl+Alt+Space"];
const DEBUG_KEYS_ENABLED = process.env.LITELAUNCHER_DEBUG_KEYS === "1";
const DEV_MODE = !app.isPackaged && process.env.LITELAUNCHER_DEV === "1";
const E2E_MODE = process.env.LITELAUNCHER_E2E === "1";
const E2E_REAL_BLUR_MODE = process.env.LITELAUNCHER_E2E_REAL_BLUR === "1";
const E2E_USER_DATA_DIR = (process.env.LITELAUNCHER_E2E_USER_DATA_DIR ?? "").trim();
const REPLACE_INSTANCE_FLAG = "--replace-instance";
const LITESNAP_OVERLAY_PREWARM_DELAY_MS = 4000;
const LITESNAP_CAPTURE_PREWARM_DELAY_MS = 12000;
const APP_USER_MODEL_ID = "LiteLauncher";
const SEARCH_DISPLAY_CONFIG_KEY = "searchDisplayConfig";
const CATALOG_SCAN_CONFIG_KEY = "catalogScanConfig";
const VISIBLE_PLUGIN_IDS_KEY = "visiblePluginIds";
const UI_THEME_SETTING_KEY = UI_THEME_CONFIG_KEY;
const REQUIRED_VISIBLE_PLUGIN_IDS = [
  "hardware-inspector",
  "clipboard-workbench",
  "litesnap",
  "webtools-file-hash",
  "webtools-port-helper",
  "webtools-image-prompt",
  "codeagent-switch"
] as const;
const LAST_CURRENT_DEFAULT_VISIBLE_PLUGIN_IDS = [
  "cashflow-game",
  "hardware-inspector",
  "clipboard-workbench",
  "litesnap",
  "webtools-password",
  "webtools-cron",
  "webtools-json",
  "webtools-crypto",
  "webtools-jwt",
  "webtools-timestamp",
  "webtools-translate",
  "dictionary",
  "webtools-strings",
  "webtools-colors",
  "webtools-diff",
  "webtools-http-mock",
  "webtools-image-base64",
  "webtools-image-prompt",
  "webtools-config-convert",
  "webtools-sql-format",
  "webtools-unit-convert",
  "webtools-file-hash",
  "webtools-port-helper",
  "webtools-regex",
  "webtools-url-parse",
  "webtools-qrcode",
  "webtools-markdown",
  "webtools-ua",
  "webtools-api-client",
  "codeagent-switch"
] as const;
const CURRENT_DEFAULT_VISIBLE_PLUGIN_IDS = [
  "cashflow-game",
  "hardware-inspector",
  "clipboard-workbench",
  "litesnap",
  "webtools-password",
  "webtools-cron",
  "webtools-json",
  "webtools-json-schema",
  "webtools-data-mask",
  "webtools-crypto",
  "webtools-jwt",
  "webtools-timestamp",
  "webtools-translate",
  "dictionary",
  "webtools-strings",
  "webtools-colors",
  "webtools-diff",
  "webtools-http-mock",
  "webtools-image-base64",
  "webtools-image-prompt",
  "webtools-config-convert",
  "webtools-sql-format",
  "webtools-unit-convert",
  "webtools-file-hash",
  "webtools-port-helper",
  "webtools-regex",
  "webtools-url-parse",
  "webtools-qrcode",
  "webtools-markdown",
  "webtools-ua",
  "webtools-api-client",
  "codeagent-switch"
] as const;
const PRE_CLIPBOARD_WORKBENCH_DEFAULT_VISIBLE_PLUGIN_IDS = [
  "cashflow-game",
  "hardware-inspector",
  "webtools-password",
  "webtools-cron",
  "webtools-json",
  "webtools-crypto",
  "webtools-jwt",
  "webtools-timestamp",
  "webtools-strings",
  "webtools-colors",
  "webtools-diff",
  "webtools-http-mock",
  "webtools-image-base64",
  "webtools-image-prompt",
  "webtools-config-convert",
  "webtools-sql-format",
  "webtools-unit-convert",
  "webtools-file-hash",
  "webtools-port-helper",
  "webtools-regex",
  "webtools-url-parse",
  "webtools-qrcode",
  "webtools-markdown",
  "webtools-ua",
  "webtools-api-client",
  "codeagent-switch"
] as const;
const PRE_WEBTOOLS_TRANSLATE_DEFAULT_VISIBLE_PLUGIN_IDS = [
  "cashflow-game",
  "hardware-inspector",
  "clipboard-workbench",
  "litesnap",
  "webtools-password",
  "webtools-cron",
  "webtools-json",
  "webtools-crypto",
  "webtools-jwt",
  "webtools-timestamp",
  "webtools-strings",
  "webtools-colors",
  "webtools-diff",
  "webtools-http-mock",
  "webtools-image-base64",
  "webtools-image-prompt",
  "webtools-config-convert",
  "webtools-sql-format",
  "webtools-unit-convert",
  "webtools-file-hash",
  "webtools-port-helper",
  "webtools-regex",
  "webtools-url-parse",
  "webtools-qrcode",
  "webtools-markdown",
  "webtools-ua",
  "webtools-api-client",
  "codeagent-switch"
] as const;
const PRE_HARDWARE_INSPECTOR_DEFAULT_VISIBLE_PLUGIN_IDS = [
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
  "webtools-http-mock",
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
  "hardware-inspector",
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
const PINNED_CUSTOM_ITEMS_KEY = "pinnedCustomItems";
const PINNED_ITEMS_MAX = 200;
const VISIBLE_PLUGIN_IDS_MAX = 50;

if (E2E_USER_DATA_DIR) {
  app.setPath("userData", E2E_USER_DATA_DIR);
}

let database: LiteDatabase | null = null;
let usageStore: UsageStore | null = null;
let catalog: LaunchItem[] = [];
let catalogInitialized = false;
let catalogBackgroundRefreshScheduled = false;
let catalogChangeWatcher: CatalogChangeWatcher | null = null;
let shortcutRegistered = false;
let activeShortcut: string | null = null;
let searchWorker: SearchWorkerClient | null = null;
let searchWorkerStateRevision = 0;
let searchWorkerSyncedRevision = -1;
let clipService: ClipService | null = null;
let clipboardWorkbenchService: ClipboardWorkbenchService | null = null;
let appQuitting = false;
let searchDisplayConfig: SearchDisplayConfig = {
  ...DEFAULT_SEARCH_DISPLAY_CONFIG
};
let uiThemeConfig: UiThemeConfig = {
  ...DEFAULT_UI_THEME_CONFIG
};
let catalogScanConfig: CatalogScanConfig = {
  ...DEFAULT_CATALOG_SCAN_CONFIG
};
let visiblePluginIds: string[] = getDefaultVisiblePluginIds();
let pinnedItemIds: string[] = [];
let pinnedCustomItems = new Map<string, LaunchItem>();
let processErrorHooksRegistered = false;
let devRendererWatcher: fs.FSWatcher | null = null;
let devAssetsWatcher: fs.FSWatcher | null = null;
let devReloadTimer: NodeJS.Timeout | null = null;
const liteSnapShortcutState: {
  screenshot: string | null;
  pin: string | null;
  color: string | null;
  togglePinClickThrough: string | null;
} = {
  screenshot: null,
  pin: null,
  color: null,
  togglePinClickThrough: null
};
let selectionTranslateShortcut: string | null = null;
let selectionTranslateRunning = false;
let liteSnapCaptureShortcutTriggeredAt = 0;
let liteSnapLocalShortcutHandler: ((event: Event, input: Input) => void) | null = null;
let lastLauncherShowMeta: {
  trigger: LauncherWindowShowTrigger;
  at: number;
} = {
  trigger: "manual",
  at: 0
};

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

function formatLauncherWindowState(window: BrowserWindow): string {
  if (window.isDestroyed()) {
    return "destroyed=1";
  }

  const [width, height] = window.getSize();
  const [x, y] = window.getPosition();
  return [
    `visible=${window.isVisible() ? "1" : "0"}`,
    `focused=${window.isFocused() ? "1" : "0"}`,
    `alwaysOnTop=${window.isAlwaysOnTop() ? "1" : "0"}`,
    `bounds=${x},${y},${width},${height}`
  ].join(" ");
}

function recordLauncherWindowDiagnostic(
  window: BrowserWindow,
  input: {
    trigger?: LauncherWindowShowTrigger;
    phase: string;
    message: string;
    level?: "warn" | "error";
    note?: string;
  }
): void {
  const trigger = input.trigger ?? lastLauncherShowMeta.trigger;
  const showAgeMs =
    lastLauncherShowMeta.at > 0 ? Date.now() - lastLauncherShowMeta.at : -1;
  queueErrorLog({
    scope: "main",
    level: input.level ?? "warn",
    message: input.message,
    context: [
      `phase=${input.phase}`,
      `trigger=${trigger}`,
      `showAgeMs=${showAgeMs}`,
      formatLauncherWindowState(window)
    ].join(" "),
    detail: input.note
  });
}

function showLauncherWindowWithTrigger(
  window: BrowserWindow,
  trigger: LauncherWindowShowTrigger
): void {
  lastLauncherShowMeta = {
    trigger,
    at: Date.now()
  };
  catalogChangeWatcher?.maybeRefreshIfStale();
  void showLauncherWindowAsync(window, {
    trigger,
    reportDiagnostic: (event: LauncherWindowDiagnosticEvent) => {
      recordLauncherWindowDiagnostic(window, {
        trigger: event.trigger,
        phase: event.phase,
        message: "Launcher topmost recovery diagnostic",
        note: [
          event.note ?? "",
          `visible=${event.isVisible ? "1" : "0"}`,
          `focused=${event.isFocused ? "1" : "0"}`,
          `alwaysOnTop=${event.isAlwaysOnTop ? "1" : "0"}`,
          event.retryDelayMs !== undefined ? `retryDelayMs=${event.retryDelayMs}` : ""
        ]
          .filter(Boolean)
          .join(" ")
      });
    }
  });
}

function toggleLauncherWindowWithTrigger(
  window: BrowserWindow,
  trigger: LauncherWindowShowTrigger
): void {
  if (window.isVisible()) {
    toggleLauncherWindow(window, { trigger });
    return;
  }

  applyLauncherWindowSizePreset(window, "compact");
  showLauncherWindowWithTrigger(window, trigger);
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

function setupLauncherWindowDiagnostics(window: BrowserWindow): void {
  window.on("always-on-top-changed", (_event, isAlwaysOnTop) => {
    if (isAlwaysOnTop || appQuitting || window.isDestroyed()) {
      return;
    }
    recordLauncherWindowDiagnostic(window, {
      phase: "always-on-top-changed",
      message: "Launcher lost always-on-top state",
      note: "Electron emitted always-on-top-changed=false"
    });
  });

  window.on("blur", () => {
    if (appQuitting || window.isDestroyed() || !window.isVisible()) {
      return;
    }

    const elapsedMs = lastLauncherShowMeta.at > 0 ? Date.now() - lastLauncherShowMeta.at : -1;
    if (elapsedMs >= 0 && elapsedMs <= 800) {
      recordLauncherWindowDiagnostic(window, {
        phase: "window-blur-after-show",
        message: "Launcher blurred shortly after showing",
        note: `blurAfterMs=${elapsedMs}`
      });
    }
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

function markSearchWorkerStateDirty(): void {
  searchWorkerStateRevision += 1;
}

async function ensureSearchWorkerState(): Promise<void> {
  if (!searchWorker || !usageStore) {
    return;
  }

  if (searchWorkerSyncedRevision === searchWorkerStateRevision) {
    return;
  }

  const filteredCatalog = filterItemsByResultPathRules(catalog);
  await searchWorker.syncState(filteredCatalog, usageStore.toObject());
  searchWorkerSyncedRevision = searchWorkerStateRevision;
}

async function ensureDataLayer(): Promise<void> {
  if (!database) {
    const dbPath = path.join(app.getPath("userData"), "litelauncher.db");
    database = new LiteDatabase(dbPath);
    await database.init();
    initWebtoolsCronStore(database);
  }

  if (!catalogInitialized) {
    catalogScanConfig = await loadCatalogScanConfig(database);
    const cachedItems = await database.getItems();
    if (cachedItems.length > 0) {
      catalog = cachedItems;
    } else {
      catalog = buildCatalogWithOptions(catalogScanConfig);
      await database.saveItems(catalog);
      catalog = await database.getItems();
    }
    catalogInitialized = true;
  }

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

  if (!clipboardWorkbenchService) {
    const dbPath = path.join(app.getPath("userData"), "litelauncher.db");
    clipboardWorkbenchService = new ClipboardWorkbenchService({
      dbPath,
      assetsDir: path.join(
        app.getPath("userData"),
        "clipboard-workbench",
        "assets"
      ),
      onAutoTextCollected: async (text) => {
        await clipService?.saveTextContent(text);
      }
    });
    await clipboardWorkbenchService.init();
    setClipboardWorkbenchService(clipboardWorkbenchService);
  }
}

function registerLiteSnapGlobalShortcut(
  shortcut: string,
  action: () => boolean | Promise<boolean>,
  window: BrowserWindow,
  actionLabel: string
): boolean {
  const normalizedShortcut = shortcut.trim();
  if (!normalizedShortcut) {
    return false;
  }

  try {
    const success = globalShortcut.register(normalizedShortcut, () => {
      emitDebugKey(window, {
        source: "main",
        phase: "global-shortcut",
        key: normalizedShortcut,
        ts: Date.now(),
        note: `LiteSnap ${actionLabel} shortcut callback fired`
      });

      void Promise.resolve(action())
        .then((ok) => {
          if (!ok) {
            console.warn(
              `LiteSnap ${actionLabel} shortcut triggered but action returned false`
            );
          }
        })
        .catch((error) => {
          console.warn(`LiteSnap ${actionLabel} shortcut failed`, error);
        });
    });

    if (!success) {
      console.warn(
        `Failed to register LiteSnap ${actionLabel} shortcut: ${normalizedShortcut}`
      );
      return false;
    }

    console.info(
      `LiteSnap ${actionLabel} shortcut registered: ${normalizedShortcut}`
    );
    return true;
  } catch (error) {
    console.warn(
      `LiteSnap ${actionLabel} shortcut registration failed: ${normalizedShortcut}`,
      error
    );
    return false;
  }
}

function unregisterLiteSnapGlobalShortcut(kind: keyof typeof liteSnapShortcutState): void {
  const shortcut = liteSnapShortcutState[kind];
  if (!shortcut) {
    return;
  }

  try {
    globalShortcut.unregister(shortcut);
  } catch (error) {
    console.warn(`Failed to unregister LiteSnap ${kind} shortcut: ${shortcut}`, error);
  }
  liteSnapShortcutState[kind] = null;
}

function unregisterSelectionTranslateShortcut(): void {
  if (!selectionTranslateShortcut) {
    return;
  }
  try {
    globalShortcut.unregister(selectionTranslateShortcut);
  } catch (error) {
    console.warn(
      `Failed to unregister selection-translate shortcut: ${selectionTranslateShortcut}`,
      error
    );
  }
  selectionTranslateShortcut = null;
}

function registerSelectionTranslateShortcut(
  settings: SelectionTranslateSettings,
  window: BrowserWindow,
  runSelectionTranslate: () => Promise<boolean>
): boolean {
  unregisterSelectionTranslateShortcut();
  if (!settings.enabled) {
    return true;
  }

  const normalizedShortcut = settings.hotkey.trim();
  if (!normalizedShortcut) {
    return false;
  }

  try {
    const success = globalShortcut.register(normalizedShortcut, () => {
      emitDebugKey(window, {
        source: "main",
        phase: "global-shortcut",
        key: normalizedShortcut,
        ts: Date.now(),
        note: "selection-translate shortcut callback fired"
      });
      void Promise.resolve(runSelectionTranslate())
        .then((ok) => {
          if (!ok) {
            console.warn("selection-translate shortcut action returned false");
          }
        })
        .catch((error) => {
          console.warn("selection-translate shortcut failed", error);
        });
    });
    if (!success) {
      console.warn(
        `Failed to register selection-translate shortcut: ${normalizedShortcut}`
      );
      return false;
    }
    selectionTranslateShortcut = normalizedShortcut;
    console.info(
      `selection-translate shortcut registered: ${normalizedShortcut}`
    );
    return true;
  } catch (error) {
    console.warn(
      `selection-translate shortcut registration failed: ${normalizedShortcut}`,
      error
    );
    return false;
  }
}

function matchAcceleratorInput(input: Input, accelerator: string): boolean {
  const normalized = accelerator.trim();
  if (!normalized || input.type !== "keyDown") {
    return false;
  }

  const tokens = normalized
    .split("+")
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length === 0) {
    return false;
  }

  const keyToken = tokens[tokens.length - 1] ?? "";
  const modifiers = new Set(tokens.slice(0, -1).map((token) => token.toLowerCase()));
  const needsCtrl = modifiers.has("ctrl") || modifiers.has("control");
  const needsAlt = modifiers.has("alt");
  const needsShift = modifiers.has("shift");
  const needsMeta =
    modifiers.has("super") || modifiers.has("meta") || modifiers.has("cmd");

  if (Boolean(input.control) !== needsCtrl) {
    return false;
  }
  if (Boolean(input.alt) !== needsAlt) {
    return false;
  }
  if (Boolean(input.shift) !== needsShift) {
    return false;
  }
  if (Boolean(input.meta) !== needsMeta) {
    return false;
  }

  const inputKey = input.key.trim().toUpperCase();
  const expectedKey = keyToken.toUpperCase();
  if (inputKey === expectedKey) {
    return true;
  }

  if (expectedKey.startsWith("NUM")) {
    return inputKey === expectedKey.slice(3) || inputKey === expectedKey;
  }

  return false;
}

function unregisterLiteSnapLocalShortcut(window: BrowserWindow): void {
  if (!liteSnapLocalShortcutHandler || window.isDestroyed()) {
    liteSnapLocalShortcutHandler = null;
    return;
  }

  window.webContents.removeListener("before-input-event", liteSnapLocalShortcutHandler);
  liteSnapLocalShortcutHandler = null;
}

function registerLiteSnapLocalShortcut(
  window: BrowserWindow,
  startCapture: () => Promise<boolean>,
  pinClipboardImage: () => Promise<boolean>,
  startColorCapture: () => Promise<boolean>,
  togglePinClickThrough: () => boolean
): void {
  unregisterLiteSnapLocalShortcut(window);

  liteSnapLocalShortcutHandler = (event, input) => {
    if (input.isAutoRepeat) {
      return;
    }

    const screenshotShortcut = liteSnapShortcutState.screenshot;
    if (screenshotShortcut && matchAcceleratorInput(input, screenshotShortcut)) {
      event.preventDefault();
      void startCapture().catch((error) => {
        console.warn("LiteSnap capture local shortcut failed", error);
      });
      return;
    }

    const pinShortcut = liteSnapShortcutState.pin;
    if (pinShortcut && matchAcceleratorInput(input, pinShortcut)) {
      event.preventDefault();
      void pinClipboardImage().catch((error) => {
        console.warn("LiteSnap pin local shortcut failed", error);
      });
      return;
    }

    const colorShortcut = liteSnapShortcutState.color;
    if (colorShortcut && matchAcceleratorInput(input, colorShortcut)) {
      event.preventDefault();
      void startColorCapture().catch((error) => {
        console.warn("LiteSnap color local shortcut failed", error);
      });
      return;
    }

    const togglePinClickThroughShortcut = liteSnapShortcutState.togglePinClickThrough;
    if (
      togglePinClickThroughShortcut &&
      matchAcceleratorInput(input, togglePinClickThroughShortcut)
    ) {
      event.preventDefault();
      try {
        togglePinClickThrough();
      } catch (error) {
        console.warn("LiteSnap pin click-through local shortcut failed", error);
      }
    }
  };

  window.webContents.on("before-input-event", liteSnapLocalShortcutHandler);
}

function registerLiteSnapShortcutSet(
  settings: LiteSnapSettings,
  window: BrowserWindow,
  startCapture: () => Promise<boolean>,
  pinClipboardImage: () => Promise<boolean>,
  startColorCapture: () => Promise<boolean>,
  togglePinClickThrough: () => boolean
): LiteSnapShortcutRegistrationResult {
  const screenshotShortcut = settings.screenshotShortcut.trim();
  const pinShortcut = settings.pinShortcut.trim();
  const colorShortcut = settings.colorShortcut.trim();
  const togglePinClickThroughShortcut = settings.togglePinClickThroughShortcut.trim();

  if (
    screenshotShortcut === liteSnapShortcutState.screenshot &&
    pinShortcut === liteSnapShortcutState.pin &&
    colorShortcut === liteSnapShortcutState.color &&
    togglePinClickThroughShortcut === liteSnapShortcutState.togglePinClickThrough
  ) {
    return {
      screenshot: Boolean(screenshotShortcut),
      pin: Boolean(pinShortcut),
      color: !colorShortcut || Boolean(liteSnapShortcutState.color),
      togglePinClickThrough:
        !togglePinClickThroughShortcut ||
        Boolean(liteSnapShortcutState.togglePinClickThrough),
      message: "LiteSnap 快捷键已立即生效。"
    };
  }

  unregisterLiteSnapGlobalShortcut("screenshot");
  unregisterLiteSnapGlobalShortcut("pin");
  unregisterLiteSnapGlobalShortcut("color");
  unregisterLiteSnapGlobalShortcut("togglePinClickThrough");
  const screenshot = registerLiteSnapGlobalShortcut(
    screenshotShortcut,
    () => startCapture(),
    window,
    "capture"
  );
  if (screenshot) {
    liteSnapShortcutState.screenshot = screenshotShortcut;
  }

  const pin = registerLiteSnapGlobalShortcut(
    pinShortcut,
    () => pinClipboardImage(),
    window,
    "pin"
  );
  if (pin) {
    liteSnapShortcutState.pin = pinShortcut;
  }

  const colorRegistered = registerLiteSnapGlobalShortcut(
    colorShortcut,
    () => startColorCapture(),
    window,
    "color"
  );
  if (colorRegistered) {
    liteSnapShortcutState.color = colorShortcut;
  }
  // Empty color shortcut means intentionally disabled.
  const color = !colorShortcut || colorRegistered;

  const togglePinClickThroughRegistered = registerLiteSnapGlobalShortcut(
    togglePinClickThroughShortcut,
    () => togglePinClickThrough(),
    window,
    "toggle-pin-click-through"
  );
  if (togglePinClickThroughRegistered) {
    liteSnapShortcutState.togglePinClickThrough = togglePinClickThroughShortcut;
  }
  // Empty click-through shortcut means intentionally disabled.
  const togglePinClickThroughOk =
    !togglePinClickThroughShortcut || togglePinClickThroughRegistered;

  registerLiteSnapLocalShortcut(
    window,
    startCapture,
    pinClipboardImage,
    startColorCapture,
    togglePinClickThrough
  );

  const failed = [
    screenshot ? null : `截图快捷键 ${screenshotShortcut || "(空)"}`,
    pin ? null : `贴图快捷键 ${pinShortcut || "(空)"}`,
    color ? null : `取色快捷键 ${colorShortcut}`,
    togglePinClickThroughOk
      ? null
      : `贴图穿透快捷键 ${togglePinClickThroughShortcut}`
  ].filter((item): item is string => Boolean(item));

  return {
    screenshot,
    pin,
    color,
    togglePinClickThrough: togglePinClickThroughOk,
    message:
      failed.length === 0
        ? "LiteSnap 快捷键已立即生效。"
        : `${failed.join("、")} 注册失败，可能已被系统或其他应用占用。`
  };
}

async function updateLiteSnapSettingsWithShortcutRegistration(
  store: LiteSnapSettingsStore,
  patch: Partial<LiteSnapSettings>,
  window: BrowserWindow,
  startCapture: () => Promise<boolean>,
  pinClipboardImage: () => Promise<boolean>,
  startColorCapture: () => Promise<boolean>,
  togglePinClickThrough: () => boolean
): Promise<LiteSnapSettings & { shortcutRegistration?: LiteSnapShortcutRegistrationResult }> {
  const previous = await store.getSettings();
  const shortcutsChanged =
    (Object.prototype.hasOwnProperty.call(patch, "screenshotShortcut") &&
      String(patch.screenshotShortcut ?? "").trim() !==
        previous.screenshotShortcut.trim()) ||
    (Object.prototype.hasOwnProperty.call(patch, "pinShortcut") &&
      String(patch.pinShortcut ?? "").trim() !== previous.pinShortcut.trim()) ||
    (Object.prototype.hasOwnProperty.call(patch, "colorShortcut") &&
      String(patch.colorShortcut ?? "").trim() !== previous.colorShortcut.trim()) ||
    (Object.prototype.hasOwnProperty.call(patch, "togglePinClickThroughShortcut") &&
      String(patch.togglePinClickThroughShortcut ?? "").trim() !==
        previous.togglePinClickThroughShortcut.trim());

  const next = await store.updateSettings(patch);
  if (!shortcutsChanged) {
    return next;
  }

  const requestedRegistration = registerLiteSnapShortcutSet(
    next,
    window,
    startCapture,
    pinClipboardImage,
    startColorCapture,
    togglePinClickThrough
  );

  if (
    requestedRegistration.screenshot &&
    requestedRegistration.pin &&
    requestedRegistration.color &&
    requestedRegistration.togglePinClickThrough
  ) {
    return { ...next, shortcutRegistration: requestedRegistration };
  }

  const effective = {
    ...next,
    screenshotShortcut: requestedRegistration.screenshot
      ? next.screenshotShortcut
      : previous.screenshotShortcut,
    pinShortcut: requestedRegistration.pin
      ? next.pinShortcut
      : previous.pinShortcut,
    colorShortcut: requestedRegistration.color
      ? next.colorShortcut
      : previous.colorShortcut,
    togglePinClickThroughShortcut: requestedRegistration.togglePinClickThrough
      ? next.togglePinClickThroughShortcut
      : previous.togglePinClickThroughShortcut
  };
  const saved = await store.updateSettings(effective);
  const fallbackRegistration = registerLiteSnapShortcutSet(
    saved,
    window,
    startCapture,
    pinClipboardImage,
    startColorCapture,
    togglePinClickThrough
  );
  const failed = [
    requestedRegistration.screenshot
      ? null
      : `截图快捷键 ${next.screenshotShortcut}`,
    requestedRegistration.pin ? null : `贴图快捷键 ${next.pinShortcut}`,
    requestedRegistration.color ? null : `取色快捷键 ${next.colorShortcut}`,
    requestedRegistration.togglePinClickThrough
      ? null
      : `贴图穿透快捷键 ${next.togglePinClickThroughShortcut}`
  ].filter((item): item is string => Boolean(item));

  return {
    ...saved,
    shortcutRegistration: {
      screenshot: requestedRegistration.screenshot && fallbackRegistration.screenshot,
      pin: requestedRegistration.pin && fallbackRegistration.pin,
      color: requestedRegistration.color && fallbackRegistration.color,
      togglePinClickThrough:
        requestedRegistration.togglePinClickThrough &&
        fallbackRegistration.togglePinClickThrough,
      message: `${failed.join("、")} 注册失败，已保留旧快捷键。可能已被系统或其他应用占用。`
    }
  };
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

async function loadUiThemeConfig(db: LiteDatabase): Promise<UiThemeConfig> {
  const raw = await db.getSetting(UI_THEME_SETTING_KEY);
  if (!raw) {
    return { ...DEFAULT_UI_THEME_CONFIG };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<UiThemeConfig>;
    return normalizeUiThemeConfig(parsed);
  } catch {
    return { ...DEFAULT_UI_THEME_CONFIG };
  }
}

async function saveUiThemeConfig(
  db: LiteDatabase,
  config: Partial<UiThemeConfig>
): Promise<UiThemeConfig> {
  const next = normalizeUiThemeConfig(config, uiThemeConfig);
  await db.setSetting(UI_THEME_SETTING_KEY, JSON.stringify(next));
  uiThemeConfig = next;
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
  markSearchWorkerStateDirty();
  catalogChangeWatcher?.restart();
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

async function loadPinnedCustomItemsMap(db: LiteDatabase): Promise<Map<string, LaunchItem>> {
  const raw = await db.getSetting(PINNED_CUSTOM_ITEMS_KEY);
  if (!raw) {
    return new Map();
  }

  try {
    return parsePinnedCustomItems(JSON.parse(raw));
  } catch {
    return new Map();
  }
}

async function persistPinnedCustomItems(db: LiteDatabase): Promise<void> {
  await db.setSetting(
    PINNED_CUSTOM_ITEMS_KEY,
    JSON.stringify(serializePinnedCustomItems(pinnedCustomItems))
  );
}

function isResolvablePinnedItemId(
  itemId: string,
  catalogIds: ReadonlySet<string>,
  dynamicIds: ReadonlySet<string>
): boolean {
  return (
    catalogIds.has(itemId) ||
    dynamicIds.has(itemId) ||
    pinnedCustomItems.has(itemId)
  );
}

async function loadPinnedItemIds(
  db: LiteDatabase,
  catalogIds: Set<string>
): Promise<string[]> {
  const raw = await db.getSetting(PINNED_ITEMS_KEY);
  if (!raw) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const candidateIds = Array.isArray(parsed)
    ? parsed.filter((value): value is string => typeof value === "string")
    : [];
  const resolvableDynamicIds = await computeResolvableDynamicPinIds(candidateIds, catalogIds);

  return normalizePinnedItemIds(
    parsed,
    (itemId) => isResolvablePinnedItemId(itemId, catalogIds, resolvableDynamicIds),
    PINNED_ITEMS_MAX
  );
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
  const resolvableDynamicIds = await computeResolvableDynamicPinIds(
    pinnedItemIds,
    catalogIdSet
  );
  const normalizedPinned = normalizePinnedItemIds(
    pinnedItemIds,
    (itemId) => isResolvablePinnedItemId(itemId, catalogIdSet, resolvableDynamicIds),
    PINNED_ITEMS_MAX
  );
  const pinnedChanged = !areStringArraysEqual(normalizedPinned, pinnedItemIds);
  if (pinnedChanged) {
    pinnedItemIds = normalizedPinned;
    await persistPinnedItemIds(db);
  }

  markSearchWorkerStateDirty();
}

function replaceCatalogPluginItems(items: LaunchItem[]): LaunchItem[] {
  const nonPluginItems = items.filter(
    (item) => !(item.type === "command" && isPluginCatalogItem(item))
  );
  return [...nonPluginItems, ...getPluginCatalogItems()];
}

function isLikelyBrokenVisiblePluginList(pluginIds: string[]): boolean {
  if (pluginIds.length === 0) {
    return true;
  }

  if (pluginIds.length > REQUIRED_VISIBLE_PLUGIN_IDS.length) {
    return false;
  }

  const requiredSet = new Set<string>(REQUIRED_VISIBLE_PLUGIN_IDS);
  return pluginIds.every((id) => requiredSet.has(id));
}

function ensureRequiredVisiblePluginIds(pluginIds: string[]): string[] {
  const next = [...pluginIds];
  for (const pluginId of REQUIRED_VISIBLE_PLUGIN_IDS) {
    if (next.includes(pluginId)) {
      continue;
    }
    if (next.length >= VISIBLE_PLUGIN_IDS_MAX) {
      break;
    }
    next.push(pluginId);
  }

  return setVisiblePluginIds(next);
}

async function loadVisiblePluginIds(db: LiteDatabase): Promise<string[]> {
  const fallback = ensureRequiredVisiblePluginIds(
    setVisiblePluginIds(getDefaultVisiblePluginIds())
  );
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
    const shouldUpgradeLastCurrentDefault = areStringArraysSetEqual(
      applied,
      [...LAST_CURRENT_DEFAULT_VISIBLE_PLUGIN_IDS]
    );
    const shouldUpgradePreWebtoolsTranslateDefault = areStringArraysSetEqual(
      applied,
      [...PRE_WEBTOOLS_TRANSLATE_DEFAULT_VISIBLE_PLUGIN_IDS]
    );
    const shouldUpgradePreHardwareDefault = areStringArraysSetEqual(
      applied,
      [...PRE_HARDWARE_INSPECTOR_DEFAULT_VISIBLE_PLUGIN_IDS]
    );
    const shouldUpgradePreClipboardWorkbenchDefault = areStringArraysSetEqual(
      applied,
      [...PRE_CLIPBOARD_WORKBENCH_DEFAULT_VISIBLE_PLUGIN_IDS]
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
      shouldUpgradeLastCurrentDefault ||
      shouldUpgradePreWebtoolsTranslateDefault ||
      shouldUpgradePreHardwareDefault ||
      shouldUpgradePreClipboardWorkbenchDefault ||
      shouldUpgradeLegacyDefault ||
      shouldUpgradePreviousDefault ||
      shouldUpgradeOlderDefault
        ? fallback
        : applied;
    const candidate = isLikelyBrokenVisiblePluginList(next) ? fallback : next;
    const ensured = ensureRequiredVisiblePluginIds(candidate);
    if (
      shouldFallback ||
      shouldUpgradeCurrentDefault ||
      shouldUpgradeLastCurrentDefault ||
      shouldUpgradePreWebtoolsTranslateDefault ||
      shouldUpgradePreHardwareDefault ||
      shouldUpgradePreClipboardWorkbenchDefault ||
      shouldUpgradeLegacyDefault ||
      shouldUpgradePreviousDefault ||
      shouldUpgradeOlderDefault ||
      !areStringArraysEqual(ensured, requested)
    ) {
      await db.setSetting(VISIBLE_PLUGIN_IDS_KEY, JSON.stringify(ensured));
    }
    return ensured;
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
  const ensured = ensureRequiredVisiblePluginIds(applied);
  visiblePluginIds = ensured;
  await db.setSetting(VISIBLE_PLUGIN_IDS_KEY, JSON.stringify(ensured));

  const nextCatalog = replaceCatalogPluginItems(catalog);
  await persistCatalogSnapshot(db, nextCatalog);
  return ensured;
}

function scheduleCatalogBackgroundRefresh(db: LiteDatabase): void {
  if (catalogBackgroundRefreshScheduled || E2E_MODE) {
    return;
  }

  catalogBackgroundRefreshScheduled = true;
  // Defer filesystem catalog scan so the first Alt+Space / renderer load is not
  // competing with a synchronous Start Menu walk on the Electron main thread.
  const timer = setTimeout(() => {
    void rebuildCatalogIndex(db)
      .then(() => {
        catalogChangeWatcher?.markRebuilt();
      })
      .catch((error) => {
        console.error("[catalog] background refresh failed", error);
      });
  }, 8000);
  timer.unref?.();
}

function startCatalogChangeWatcher(db: LiteDatabase): void {
  if (E2E_MODE || process.platform !== "win32") {
    return;
  }

  catalogChangeWatcher?.dispose();
  catalogChangeWatcher = new CatalogChangeWatcher(
    () => catalogScanConfig,
    () => rebuildCatalogIndex(db)
  );
  catalogChangeWatcher.start();
}

async function rebuildCatalogIndex(
  db: LiteDatabase
): Promise<CatalogRebuildResult> {
  const startedAt = Date.now();
  try {
    const nextCatalog = buildCatalogWithOptions(catalogScanConfig);
    await persistCatalogSnapshot(db, nextCatalog);
    catalogChangeWatcher?.markRebuilt();

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

async function getPinnedItemsFromCatalog(limit: number): Promise<LaunchItem[]> {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const picked: LaunchItem[] = [];

  for (const itemId of pinnedItemIds) {
    const item =
      byId.get(itemId) ??
      pinnedCustomItems.get(itemId) ??
      (await findDynamicPinCandidate(itemId));
    if (!item) {
      continue;
    }

    // Explicit custom pins must always surface; do not apply catalog result
    // include/exclude path filters that are meant for scanned items only.
    if (isCustomPinId(item.id) || pinnedCustomItems.has(item.id)) {
      picked.push({ ...item, pinned: true });
    } else {
      const filtered = filterItemsByResultPathRules([item]);
      if (filtered.length === 0) {
        continue;
      }
      picked.push({ ...filtered[0], pinned: true });
    }
    if (picked.length >= limit) {
      break;
    }
  }

  return picked;
}

/**
 * Pre-resolves which of the given pinned item ids can be matched to a
 * dynamically-resolved command item (e.g. a path alias), without blocking on
 * `spawnSync`. Used to build a synchronous "is resolvable" predicate for
 * `normalizePinnedItemIds`.
 */
async function computeResolvableDynamicPinIds(
  itemIds: Iterable<string>,
  catalogIdSet: Set<string>
): Promise<Set<string>> {
  const resolvable = new Set<string>();
  for (const rawId of itemIds) {
    const normalizedId = String(rawId ?? "").trim();
    if (!normalizedId || catalogIdSet.has(normalizedId) || resolvable.has(normalizedId)) {
      continue;
    }
    if (await findDynamicPinCandidate(normalizedId)) {
      resolvable.add(normalizedId);
    }
  }
  return resolvable;
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

function findCatalogPinCandidate(item: LaunchItem): LaunchItem | undefined {
  const normalizedId = item.id.trim().toLowerCase();
  if (normalizedId) {
    const byId = catalog.find((entry) => entry.id.trim().toLowerCase() === normalizedId);
    if (byId) {
      return byId;
    }
  }

  const normalizedTarget = item.target.trim().toLowerCase();
  if (normalizedTarget) {
    const byTarget = catalog.find(
      (entry) => entry.target.trim().toLowerCase() === normalizedTarget
    );
    if (byTarget) {
      return byTarget;
    }

    const bySubtitle = catalog.find(
      (entry) => entry.subtitle.trim().toLowerCase() === normalizedTarget
    );
    if (bySubtitle) {
      return bySubtitle;
    }
  }

  return undefined;
}

async function findDynamicPinCandidate(itemId: string): Promise<LaunchItem | undefined> {
  const normalizedRequestedId = String(itemId ?? "").trim();
  if (!normalizedRequestedId) {
    return undefined;
  }

  const normalizedQuery = normalizedRequestedId
    .replace(/^app:startapp:/i, "")
    .replace(/^app:path-alias:/i, "");
  if (!normalizedQuery) {
    return undefined;
  }

  const liveResults = await getDynamicSearchItems(normalizedQuery, "all");
  return liveResults.find((entry) => entry.id === normalizedRequestedId);
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
  pinned: boolean,
  item?: LaunchItem
): Promise<PinToggleResult> {
  const catalogIdSet = new Set(catalog.map((item) => item.id));
  const normalizedRequestedId = String(itemId ?? "").trim();
  const hydratedRequestedItem =
    item &&
    typeof item === "object" &&
    String(item.id ?? "").trim() === normalizedRequestedId
      ? item
      : undefined;
  const stableRequestedItem = hydratedRequestedItem
    ? findCatalogPinCandidate(hydratedRequestedItem)
    : undefined;
  const hydratedDynamicItem =
    hydratedRequestedItem ??
    stableRequestedItem ??
    pinnedCustomItems.get(normalizedRequestedId) ??
    (normalizedRequestedId && !catalogIdSet.has(normalizedRequestedId)
      ? await findDynamicPinCandidate(normalizedRequestedId)
      : undefined);
  const validation = validatePinnedItemRequest(
    itemId,
    catalogIdSet,
    hydratedDynamicItem
  );
  if (!validation.ok) {
    queueErrorLog({
      scope: "main",
      level: "warn",
      message: "Pin request rejected",
      context: `itemId=${validation.normalizedId || "(empty)"} pinned=${pinned ? "1" : "0"}`,
      detail: `reason=${validation.reason}`
    });
    return {
      ok: false,
      pinned,
      reason: validation.reason
    };
  }

  const persistedCatalogCandidate = validation.hydratedItem
    ? findCatalogPinCandidate(validation.hydratedItem)
    : undefined;
  const normalizedId =
    stableRequestedItem?.id ??
    persistedCatalogCandidate?.id ??
    validation.normalizedId;
  const customHydratedItem =
    validation.hydratedItem && isCustomPinId(validation.hydratedItem.id)
      ? validation.hydratedItem
      : undefined;
  try {
    const exists = pinnedItemIds.includes(normalizedId);
    if (pinned) {
      if (customHydratedItem) {
        pinnedCustomItems.set(customHydratedItem.id, customHydratedItem);
      }
      if (!exists) {
        pinnedItemIds = [normalizedId, ...pinnedItemIds].slice(0, PINNED_ITEMS_MAX);
      }
    } else if (exists) {
      pinnedItemIds = pinnedItemIds.filter((id) => id !== normalizedId);
      if (isCustomPinId(normalizedId)) {
        pinnedCustomItems.delete(normalizedId);
      }
    }

    const resolvableDynamicIds = await computeResolvableDynamicPinIds(
      pinnedItemIds,
      catalogIdSet
    );
    pinnedItemIds = normalizePinnedItemIds(
      pinnedItemIds,
      (itemId) => isResolvablePinnedItemId(itemId, catalogIdSet, resolvableDynamicIds),
      PINNED_ITEMS_MAX
    );
    const persisted = pinnedItemIds.includes(normalizedId);
    if (pinned && !persisted) {
      if (customHydratedItem) {
        await persistPinnedCustomItems(db);
      }
      await persistPinnedItemIds(db);
      return {
        ok: false,
        pinned,
        reason: "missing-catalog-item"
      };
    }

    if (customHydratedItem) {
      await persistPinnedCustomItems(db);
    }
    await persistPinnedItemIds(db);
    return {
      ok: true,
      pinned: persisted
    };
  } catch (error) {
    queueErrorLog({
      scope: "main",
      level: "error",
      message: "Pin request failed",
      context: `itemId=${normalizedId} pinned=${pinned ? "1" : "0"}`,
      detail: formatErrorDetail(error)
    });
    return {
      ok: false,
      pinned,
      reason: "persist-failed"
    };
  }
}

async function addCustomPinnedPath(
  db: LiteDatabase,
  rawPath: string
): Promise<PinToggleResult> {
  const resolved = resolvePinItemForPath(rawPath, catalog);
  if (!resolved) {
    return {
      ok: false,
      pinned: false,
      reason: "invalid-pin-path"
    };
  }

  return setItemPinned(db, resolved.id, true, resolved);
}

async function bootstrap(): Promise<void> {
  await ensureDataLayer();
  registerProcessErrorHooks();
  setupDevRendererAutoReload();

  const activeUsageStore = usageStore;
  const activeClipService = clipService;
  const activeClipboardWorkbenchService = clipboardWorkbenchService;
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
  if (!activeClipboardWorkbenchService) {
    throw new Error("Clipboard Workbench service was not initialized");
  }

  const liteSnapSettingsStore = new LiteSnapSettingsStore(activeDatabase);
  const translateSettingsStore = new TranslateSettingsStore(activeDatabase);
  const selectionTranslateSettingsStore = new SelectionTranslateSettingsStore(
    activeDatabase
  );
  const dictionaryStore = new DictionaryStore();
  const dictionaryPanelStateStore = new DictionaryPanelStateStore(activeDatabase);
  const dictionaryPackManager = new DictionaryPackManager();
  const dictionaryMigration = await migrateBundledDictionaryIfNeeded(
    dictionaryStore.listDbCandidates(),
    {
      readBundledMigrated: async () => {
        const raw = await activeDatabase.getSetting(DICTIONARY_BUNDLED_MIGRATED_KEY);
        return raw === "1" || raw === "true";
      },
      markBundledMigrated: async () => {
        await activeDatabase.setSetting(DICTIONARY_BUNDLED_MIGRATED_KEY, "1");
      }
    }
  );
  if (dictionaryMigration.migrated) {
    dictionaryStore.reopen();
    console.info("[dictionary]", dictionaryMigration.message ?? "bundled dictionary migrated");
  }
  const liteSnapImageStore = new LiteSnapImageStore();
  const liteSnapHistoryStore = new LiteSnapHistoryStore(activeDatabase);
  const liteSnapPinWindowManager = new LiteSnapPinWindowManager();
  liteSnapPinWindowManager.setSaveImageProvider(async (image) => {
    const settings = await liteSnapSettingsStore.getSettings();
    const savedPath = await liteSnapImageStore.saveImage(image, settings);
    try {
      shell.showItemInFolder(savedPath);
    } catch {
      // Revealing in Explorer is best-effort; the file is already saved.
    }
    return savedPath;
  });
  const liteSnapCaptureSessionManager = new LiteSnapCaptureSessionManager(
    liteSnapSettingsStore,
    liteSnapImageStore,
    liteSnapPinWindowManager,
    liteSnapHistoryStore
  );
  searchDisplayConfig = await loadSearchDisplayConfig(activeDatabase);
  uiThemeConfig = await loadUiThemeConfig(activeDatabase);
  catalogScanConfig = await loadCatalogScanConfig(activeDatabase);
  visiblePluginIds = await loadVisiblePluginIds(activeDatabase);
  catalog = replaceCatalogPluginItems(catalog);
  markSearchWorkerStateDirty();
  scheduleCatalogBackgroundRefresh(activeDatabase);
  startCatalogChangeWatcher(activeDatabase);
  setCashflowGamePersistence(new CashflowDatabasePersistence(activeDatabase));
  const liteSnapSettings = await liteSnapSettingsStore.getSettings();
  const catalogIdSet = new Set(catalog.map((item) => item.id));
  pinnedCustomItems = await loadPinnedCustomItemsMap(activeDatabase);
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
    void hideLauncherWindow(launcherWindow);
  });
  launcherWindow.on("blur", () => {
    if (
      (E2E_MODE && !E2E_REAL_BLUR_MODE) ||
      appQuitting ||
      launcherWindow.isDestroyed() ||
      !launcherWindow.isVisible() ||
      isWindowAutoHideSuspended(launcherWindow)
    ) {
      return;
    }
    void hideLauncherWindow(launcherWindow);
  });
  launcherWindow.on("hide", () => {
    if (
      appQuitting ||
      launcherWindow.isDestroyed() ||
      launcherWindow.webContents.isDestroyed()
    ) {
      return;
    }
    // Safety net: ensure home data is fully refreshed while hidden.
    launcherWindow.webContents.send(IPC_CHANNELS.clearInput);
  });
  launcherWindow.on("focus", () => {
    liteSnapCaptureSessionManager.pauseIdleFrameCache();
  });
  launcherWindow.on("blur", () => {
    if (launcherWindow.isDestroyed()) {
      return;
    }
    liteSnapCaptureSessionManager.resumeIdleFrameCache();
  });

  setupDebugKeyTracing(launcherWindow);
  setupLauncherWindowDiagnostics(launcherWindow);
  setupRendererDiagnostics(launcherWindow, (input) => {
    queueErrorLog(input);
  });
  if (!E2E_MODE) {
    await setupAppTray(launcherWindow, {
      showLauncherWindow: () =>
        showLauncherWindowWithTrigger(launcherWindow, "tray-menu"),
      showLauncherWindowFromDoubleClick: () =>
        showLauncherWindowWithTrigger(launcherWindow, "tray-double-click"),
      toggleLauncherWindow: () =>
        toggleLauncherWindowWithTrigger(launcherWindow, "tray-click")
    });
  }

  const appUpdater = createAppUpdater({
    getWindow: () =>
      launcherWindow.isDestroyed() ? null : launcherWindow
  });
  const startLiteSnapCapture = async (): Promise<boolean> => {
    const now = Date.now();
    if (now - liteSnapCaptureShortcutTriggeredAt < 500) {
      return true;
    }
    liteSnapCaptureShortcutTriggeredAt = now;

    const started = await liteSnapCaptureSessionManager.startCapture();
    return started;
  };
  const startLiteSnapColorCapture = async (): Promise<boolean> => {
    const now = Date.now();
    if (now - liteSnapCaptureShortcutTriggeredAt < 500) {
      return true;
    }
    liteSnapCaptureShortcutTriggeredAt = now;

    const started = await liteSnapCaptureSessionManager.startColorCapture();
    return started;
  };
  const pinLiteSnapClipboardImage = async (): Promise<boolean> => {
    const pinned = await liteSnapPinWindowManager.pinClipboardImage();
    if (!pinned) {
      return false;
    }

    try {
      const image = clipboard.readImage();
      if (!image.isEmpty()) {
        const settings = await liteSnapSettingsStore.getSettings();
        if (settings.historyEnabled) {
          await liteSnapHistoryStore.add(image, "clipboard-pin", settings.historyMaxItems);
        }
      }
    } catch (error) {
      console.warn("[litesnap] clipboard-pin history record failed", error);
    }

    return true;
  };
  const toggleLiteSnapNearestPinClickThrough = (): boolean => {
    liteSnapPinWindowManager.toggleNearestPinClickThrough();
    return true;
  };
  const sendLiteSnapPluginPanel = async (payload: {
    trigger: "litesnap-ocr" | "litesnap-translate";
    subtitle: string;
    statusMessage: string;
    preferredView: "ocr" | "translate";
    ocrText?: string;
    ocrIssue?: LiteSnapOcrIssue;
    translateSourceText?: string;
    translateText?: string;
  }) => {
    if (launcherWindow.isDestroyed()) {
      return;
    }

    if (!launcherWindow.isVisible()) {
      applyLauncherWindowSizePreset(launcherWindow, "compact");
    }
    showLauncherWindowWithTrigger(launcherWindow, payload.trigger);
    if (launcherWindow.webContents.isDestroyed()) {
      return;
    }

    const settings = await liteSnapSettingsStore.getSettings();
    if (launcherWindow.isDestroyed() || launcherWindow.webContents.isDestroyed()) {
      return;
    }
    launcherWindow.webContents.send(IPC_CHANNELS.openPanel, {
      panel: "plugin",
      pluginId: LITESNAP_PLUGIN_ID,
      title: "截图贴图",
      subtitle: payload.subtitle,
      data: {
        settings: settings ?? createDefaultLiteSnapSettings(),
        statusMessage: payload.statusMessage,
        preferredView: payload.preferredView,
        ocrText: payload.ocrText ?? "",
        ocrIssue: payload.ocrIssue,
        translateSourceText: payload.translateSourceText ?? "",
        translateText: payload.translateText ?? ""
      }
    });
    launcherWindow.webContents.send(IPC_CHANNELS.focusInput);
  };

  const recognizeLiteSnapTextAndShowPanel = async (
    input: LiteSnapRecognizeTextInput
  ) => {
    const result = await liteSnapCaptureSessionManager.recognizeSelection(input);

    await sendLiteSnapPluginPanel({
      trigger: "litesnap-ocr",
      subtitle: "文字识别结果",
      statusMessage: result.ok
        ? "已识别文字，可编辑后复制。"
        : result.message,
      preferredView: "ocr",
      ocrText: result.ok ? result.text : "",
      ocrIssue: result.ok ? undefined : result.ocrIssue
    });

    return result;
  };

  const translateTextForTool = async (
    input: TranslateTextInput
  ): Promise<TranslateResult> => {
    const source = input.text.replace(/\r\n/g, "\n").trim();
    if (!source) {
      return {
        ok: false,
        sourceText: "",
        translatedText: "",
        message: "没有可翻译的文字。"
      };
    }

    const settings = await translateSettingsStore.getSettings();
    const translated = await translateWithBaidu({
      text: source,
      appId: input.appId?.trim() || settings.baiduAppId,
      secret: input.secret?.trim() || settings.baiduSecret,
      apiKey: input.apiKey?.trim() || settings.baiduApiKey,
      engine: input.engine ?? settings.baiduEngine
    });

    if (!translated.ok) {
      return {
        ok: false,
        sourceText: source,
        translatedText: "",
        message: translated.message
      };
    }

    return {
      ok: true,
      sourceText: source,
      translatedText: translated.text,
      message: "已翻译为中文。"
    };
  };

  const runSelectionTranslate = async (): Promise<boolean> => {
    if (selectionTranslateRunning) {
      return false;
    }
    selectionTranslateRunning = true;
    let popupAnchorPoint: { x: number; y: number } | undefined;
    try {
      const settings = await selectionTranslateSettingsStore.getSettings();
      if (!settings.enabled) {
        return false;
      }

      // Capture this before SendKeys/translation work begins. Those async steps
      // can take long enough for the user to move the pointer elsewhere.
      popupAnchorPoint = screen.getCursorScreenPoint();
      const popupOptions = {
        anchorPoint: popupAnchorPoint,
        dismissOnOutsideClick: settings.dismissOnOutsideClick,
        passthroughWindows: launcherWindow.isDestroyed() ? [] : [launcherWindow],
        onOpen: () => {
          if (!launcherWindow.isDestroyed()) {
            setWindowAutoHideSuspended(launcherWindow, true);
          }
        },
        onClose: () => {
          if (!launcherWindow.isDestroyed()) {
            setWindowAutoHideSuspended(launcherWindow, false);
          }
        }
      };

      const captured = await captureSelectedText({
        restoreClipboard: settings.restoreClipboard
      });
      if (!captured.ok || !captured.text.trim()) {
        await showSelectionPopup(
          {
            mode: "empty",
            message:
              captured.reason === "unsupported"
                ? "当前系统暂不支持划词翻译。"
                : "未检测到选中文字，请先选中再按快捷键。"
          },
          popupOptions
        );
        return true;
      }

      const sourceText = captured.text.replace(/\r\n/g, "\n").trim();
      if (isDictionaryLookupText(sourceText)) {
        const candidates = dictionaryStore.lookupCandidates(sourceText, 8);
        const entry = candidates[0];
        if (entry) {
          await showSelectionPopup(
            {
              mode: "dictionary",
              sourceText,
              entry,
              candidates: candidates.length > 1 ? candidates : undefined
            },
            popupOptions
          );
          return true;
        }
      }

      // Offline miss (or unsupported text): fall back to Baidu translate.
      const translated = await translateTextForTool({ text: sourceText });
      if (!translated.ok) {
        const dictionaryReady = dictionaryStore.isReady();
        const packStatus = dictionaryPackManager.getStatus(dictionaryStore.listDbCandidates());
        const offlineHint = !dictionaryReady
          ? "（离线词典未加载，请确认安装包完整）"
          : isDictionaryLookupText(sourceText)
            ? packStatus.tier === "seed"
              ? "（离线词典未收录该词，当前为种子词库，可在词典面板下载完整词库）"
              : "（离线词典未收录该词）"
            : "";
        await showSelectionPopup(
          {
            mode: "error",
            message: `${translated.message || "翻译失败，请检查百度翻译设置。"}${offlineHint}`
          },
          popupOptions
        );
        return true;
      }

      await showSelectionPopup(
        {
          mode: "translate",
          sourceText: translated.sourceText,
          translatedText: translated.translatedText
        },
        popupOptions
      );
      return true;
    } catch (error) {
      console.warn("[selection-translate] failed", error);
      const settings = await selectionTranslateSettingsStore.getSettings();
      await showSelectionPopup(
        {
          mode: "error",
          message: "划词翻译失败，请重试。"
        },
        {
          anchorPoint: popupAnchorPoint,
          dismissOnOutsideClick: settings.dismissOnOutsideClick
        }
      );
      return false;
    } finally {
      selectionTranslateRunning = false;
    }
  };

  const updateSelectionTranslateSettingsWithShortcut = async (
    patch: Partial<SelectionTranslateSettings>
  ): Promise<SelectionTranslateSettings> => {
    const previous = await selectionTranslateSettingsStore.getSettings();
    const next = await selectionTranslateSettingsStore.updateSettings(patch);
    const shortcutChanged =
      previous.enabled !== next.enabled ||
      previous.hotkey.trim() !== next.hotkey.trim();
    if (!shortcutChanged || E2E_MODE) {
      return next;
    }

    const registered = registerSelectionTranslateShortcut(
      next,
      launcherWindow,
      runSelectionTranslate
    );
    if (registered) {
      return next;
    }

    const rolledBack = await selectionTranslateSettingsStore.updateSettings({
      enabled: previous.enabled,
      hotkey: previous.hotkey
    });
    registerSelectionTranslateShortcut(
      rolledBack,
      launcherWindow,
      runSelectionTranslate
    );
    return rolledBack;
  };

  const translateLiteSnapSelectionAndShowPanel = async (
    input: LiteSnapTranslateSelectionInput
  ) => {
    const sendTranslatePanel = async (payload: {
      statusMessage: string;
      translateSourceText: string;
      translateText: string;
      ocrIssue?: LiteSnapOcrIssue;
    }) => {
      await sendLiteSnapPluginPanel({
        trigger: "litesnap-translate",
        subtitle: "截图翻译结果",
        statusMessage: payload.statusMessage,
        preferredView: "translate",
        ocrIssue: payload.ocrIssue,
        translateSourceText: payload.translateSourceText,
        translateText: payload.translateText
      });
    };

    try {
      const recognized =
        await liteSnapCaptureSessionManager.recognizeSelectionForTranslate(input);
      await liteSnapCaptureSessionManager.cancelCapture();

      if (!recognized.ok) {
        await sendTranslatePanel({
          statusMessage: recognized.message,
          translateSourceText: "",
          translateText: "",
          ocrIssue: recognized.ocrIssue
        });
        return {
          ok: false,
          sourceText: "",
          translatedText: "",
          message: recognized.message
        };
      }

      await sendTranslatePanel({
        statusMessage: "正在在线翻译，请稍候…",
        translateSourceText: recognized.text,
        translateText: ""
      });

      const settings = await translateSettingsStore.getSettings();
      const translated = await translateWithBaidu({
        text: recognized.text,
        appId: settings.baiduAppId,
        secret: settings.baiduSecret,
        apiKey: settings.baiduApiKey,
        engine: settings.baiduEngine
      });

      if (!translated.ok) {
        await sendTranslatePanel({
          statusMessage: translated.message,
          translateSourceText: recognized.text,
          translateText: ""
        });
        return {
          ok: false,
          sourceText: recognized.text,
          translatedText: "",
          message: translated.message
        };
      }

      await sendTranslatePanel({
        statusMessage: "已翻译为中文，可编辑后复制。",
        translateSourceText: recognized.text,
        translateText: translated.text
      });

      return {
        ok: true,
        sourceText: recognized.text,
        translatedText: translated.text,
        message: "已翻译为中文。"
      };
    } catch (error) {
      console.warn("[litesnap] translate flow failed", error);
      await liteSnapCaptureSessionManager.cancelCapture().catch(() => false);
      const message = "截图翻译失败，请检查网络后重试。";
      await sendTranslatePanel({
        statusMessage: message,
        translateSourceText: "",
        translateText: ""
      });
      return {
        ok: false,
        sourceText: "",
        translatedText: "",
        message
      };
    }
  };

  registerIpcHandlers(launcherWindow, {
    usageStore: activeUsageStore,
    searchProvider: {
      getInitialItems: async (limit) => {
        const filteredCatalog = filterItemsByResultPathRules(catalog);
        const usage = activeUsageStore.toObject();
        if (searchWorker) {
          try {
            await ensureSearchWorkerState();
            const items = await searchWorker.getInitialItems(limit);
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
        let baseItems: LaunchItem[] | null = null;
        if (searchWorker) {
          try {
            await ensureSearchWorkerState();
            baseItems = await searchWorker.searchItems(query, limit, options);
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

        const dynamicItems = (await getDynamicSearchItems(query, scope)).filter((item) => {
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
      getUiThemeConfig: () => ({ ...uiThemeConfig }),
      setUiThemeConfig: (config) => saveUiThemeConfig(activeDatabase, config),
      getCatalogScanConfig: () => ({ ...catalogScanConfig }),
      setCatalogScanConfig: (config) =>
        saveCatalogScanConfig(activeDatabase, config),
      getVisiblePluginIds: () => [...visiblePluginIds],
      setVisiblePluginIds: (pluginIds) =>
        saveVisiblePluginIds(activeDatabase, pluginIds),
      getAllPluginItems: () => getAllPluginCatalogItems(),
      getRequiredVisiblePluginIds: () => [...REQUIRED_VISIBLE_PLUGIN_IDS],
      getLaunchAtLoginStatus: () => getLaunchAtLoginStatus(),
      setLaunchAtLoginEnabled: (enabled) =>
        setLaunchAtLoginEnabled(enabled)
        },
        liteSnapProvider: {
          getSettings: () => liteSnapSettingsStore.getSettings(),
          updateSettings: (patch) =>
            updateLiteSnapSettingsWithShortcutRegistration(
              liteSnapSettingsStore,
              patch,
              launcherWindow,
              startLiteSnapCapture,
              pinLiteSnapClipboardImage,
              startLiteSnapColorCapture,
              toggleLiteSnapNearestPinClickThrough
            ),
          startCapture: () => startLiteSnapCapture(),
          startColorCapture: () => startLiteSnapColorCapture(),
          pinClipboardImage: () => pinLiteSnapClipboardImage(),
          togglePinnedWindowsVisibility: () =>
            liteSnapPinWindowManager.togglePinnedWindowsVisibility(),
          closeAllPinnedWindows: () => liteSnapPinWindowManager.closeAllPinnedWindows(),
          toggleNearestPinClickThrough: () =>
            liteSnapPinWindowManager.toggleNearestPinClickThrough(),
          getOverlayState: () => liteSnapCaptureSessionManager.getOverlayState(),
          getWindowRectAtPoint: (x, y) =>
            liteSnapCaptureSessionManager.getWindowRectAtPoint(x, y),
          commitCapture: (input) => liteSnapCaptureSessionManager.commitCapture(input),
          recognizeText: (input: LiteSnapRecognizeTextInput) =>
            recognizeLiteSnapTextAndShowPanel(input),
          translateSelection: (input: LiteSnapTranslateSelectionInput) =>
            translateLiteSnapSelectionAndShowPanel(input),
          recordRecentColor: (color) =>
            liteSnapCaptureSessionManager.recordRecentColor(color),
          listHistory: async () => {
            const settings = await liteSnapSettingsStore.getSettings();
            return liteSnapHistoryStore.list(settings.historyMaxItems);
          },
          deleteHistoryItem: (id) => liteSnapHistoryStore.remove(id),
          clearHistory: () => liteSnapHistoryStore.clear(),
          historyCopy: async (id) => {
            const item = await liteSnapHistoryStore.get(id);
            if (!item) {
              return false;
            }
            const image = nativeImage.createFromPath(item.filePath);
            if (image.isEmpty()) {
              return false;
            }
            clipboard.writeImage(image);
            return true;
          },
          historyPin: async (id) => {
            const item = await liteSnapHistoryStore.get(id);
            if (!item) {
              return false;
            }
            const image = nativeImage.createFromPath(item.filePath);
            if (image.isEmpty()) {
              return false;
            }
            return liteSnapPinWindowManager.pinImage(image);
          },
          probeOcr: () => liteSnapCaptureSessionManager.probeOcrStatusAsync(),
          getOcrCapabilities: () =>
            liteSnapCaptureSessionManager.listOcrCapabilities(),
          installOcrCapabilities: (languages) =>
            liteSnapCaptureSessionManager.installOcrCapabilities(languages),
          getOcrProbeCache: () => getLiteSnapOcrProbeCache(activeDatabase),
          setOcrProbeCache: async (cache) => {
            await setLiteSnapOcrProbeCache(activeDatabase, cache);
            return true;
          },
          cancelCapture: () => liteSnapCaptureSessionManager.cancelCapture(),
          setDisplayFollowLocked: (locked) =>
            liteSnapCaptureSessionManager.setDisplayFollowLocked(locked),
          ensureSourceImage: async () =>
            liteSnapCaptureSessionManager.ensureSourceImageDataUrl()
        },
        translateToolProvider: {
          getSettings: () => translateSettingsStore.getSettings(),
          updateSettings: (patch) => translateSettingsStore.updateSettings(patch),
          translateText: (input) => translateTextForTool(input)
        },
        dictionaryProvider: {
          lookup: async (word) => dictionaryStore.lookup(word),
          lookupCandidates: async (word, limit) =>
            dictionaryStore.lookupCandidates(word, limit),
          getPanelState: () => dictionaryPanelStateStore.getState(),
          recordLookup: (input) => dictionaryPanelStateStore.recordLookup(input),
          toggleFavorite: (input) => dictionaryPanelStateStore.toggleFavorite(input),
          removeHistoryItem: (word) =>
            dictionaryPanelStateStore.removeHistoryItem(word),
          clearHistory: () => dictionaryPanelStateStore.clearHistory(),
          removeFavorite: (word) => dictionaryPanelStateStore.removeFavorite(word),
          updateFavoriteNote: (word, note) =>
            dictionaryPanelStateStore.updateFavoriteNote(word, note),
          setTtsEnabled: (enabled) => dictionaryPanelStateStore.setTtsEnabled(enabled),
          buildFavoritesCsv: () => dictionaryPanelStateStore.buildFavoritesCsv()
        },
        dictionaryPackProvider: {
          getStatus: async () =>
            dictionaryPackManager.getStatus(dictionaryStore.listDbCandidates()),
          downloadPack: async (onProgress) => {
            const result = await dictionaryPackManager.downloadPack(onProgress);
            if (result.ok) {
              dictionaryStore.reopen();
            }
            return result;
          }
        },
        selectionTranslateProvider: {
          getSettings: () => selectionTranslateSettingsStore.getSettings(),
          updateSettings: (patch) =>
            updateSelectionTranslateSettingsWithShortcut(patch)
        },
    catalogProvider: {
      rebuildCatalog: () => rebuildCatalogIndex(activeDatabase)
    },
    updaterProvider: appUpdater,
    errorLogProvider: {
      recordError: (input) => activeDatabase.recordErrorLog(input),
      getErrorLogs: (limit) => activeDatabase.getErrorLogs(limit),
      clearErrorLogs: () => activeDatabase.clearErrorLogs()
    },
    pinProvider: {
      setItemPinned: (itemId, pinned, item) =>
        setItemPinned(activeDatabase, itemId, pinned, item),
      addCustomPinnedPath: (rawPath) => addCustomPinnedPath(activeDatabase, rawPath)
    },
    onItemUsed: async (itemId) => {
      await database?.recordUsage(itemId);
      markSearchWorkerStateDirty();
    }
  });

  activeClipboardWorkbenchService.start();
  appUpdater.scheduleStartupCheck();
  if (!E2E_MODE) {
    registerGlobalShortcut(
      () => toggleLauncherWindowWithTrigger(launcherWindow, "global-shortcut"),
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
    registerLiteSnapShortcutSet(
      liteSnapSettings,
      launcherWindow,
      startLiteSnapCapture,
      pinLiteSnapClipboardImage,
      startLiteSnapColorCapture,
      toggleLiteSnapNearestPinClickThrough
    );
    void selectionTranslateSettingsStore.getSettings().then((settings) => {
      registerSelectionTranslateShortcut(
        settings,
        launcherWindow,
        runSelectionTranslate
      );
    });
  }

  if (E2E_MODE) {
    if (launcherWindow.webContents.isLoadingMainFrame()) {
      launcherWindow.webContents.once("did-finish-load", () => {
        if (!launcherWindow.isDestroyed()) {
          showLauncherWindowWithTrigger(launcherWindow, "startup-e2e");
        }
      });
    } else {
      showLauncherWindowWithTrigger(launcherWindow, "startup-e2e");
    }
  }

  if (!E2E_MODE) {
    // Give the launcher window time to finish showing before spending any
    // CPU/GPU on the LiteSnap overlay, so this never competes with startup.
    // Warming it here (instead of at first F1 press) avoids the overlay's
    // first-load HTML/JS parse cost landing on the user's first screenshot.
    const overlayPrewarmTimer = setTimeout(() => {
      if (launcherWindow.isDestroyed()) {
        return;
      }
      liteSnapCaptureSessionManager.prewarmOverlay().catch((error) => {
        console.warn("[litesnap] delayed overlay prewarm failed", error);
      });
    }, LITESNAP_OVERLAY_PREWARM_DELAY_MS);
    overlayPrewarmTimer.unref();

    // Warm the screenshot frame cache later so startup and first launcher open
    // are not competing with a full-screen native capture.
    const capturePrewarmTimer = setTimeout(() => {
      if (launcherWindow.isDestroyed()) {
        return;
      }
      liteSnapCaptureSessionManager.prewarmCaptureCache();
    }, LITESNAP_CAPTURE_PREWARM_DELAY_MS);
    capturePrewarmTimer.unref();
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
    if (process.env.LITELAUNCHER_DEV === "1") {
      // dev-electron owns process restarts; exiting here avoids a relaunch ping-pong
      // with the dev runner that also spawns Electron after each exit.
      console.info(
        "[startup] replace-instance ignored in dev mode, quitting for dev runner restart"
      );
      app.quit();
      return;
    }

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
    if (!app.isPackaged) {
      const shouldShow = !first.isVisible();
      first.webContents.reloadIgnoringCache();
      if (shouldShow) {
        first.webContents.once("did-finish-load", () => {
          if (!first.isDestroyed()) {
            showLauncherWindowWithTrigger(first, "second-instance-dev-reload");
          }
        });
      }
      return;
    }

    toggleLauncherWindowWithTrigger(first, "second-instance");
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
  if (clipboardWorkbenchService) {
    clipboardWorkbenchService.stop();
    void clipboardWorkbenchService.close();
    clipboardWorkbenchService = null;
  }
  setClipboardWorkbenchService(null);
  catalogChangeWatcher?.dispose();
  catalogChangeWatcher = null;
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
  searchWorkerStateRevision = 0;
  searchWorkerSyncedRevision = -1;
  catalog = [];
  catalogInitialized = false;
  catalogBackgroundRefreshScheduled = false;
  catalogScanConfig = { ...DEFAULT_CATALOG_SCAN_CONFIG };
  visiblePluginIds = getDefaultVisiblePluginIds();
  setVisiblePluginIds(visiblePluginIds);
  shortcutRegistered = false;
  activeShortcut = null;
});
