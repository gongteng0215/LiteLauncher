import { app, BrowserWindow, dialog, ipcMain, nativeImage, shell } from "electron";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { IPC_CHANNELS } from "../shared/channels";
import {
  LiteSnapCloseAllPinnedWindowsResult,
  LiteSnapCommitCaptureInput,
  LiteSnapCommitCaptureResult,
  LiteSnapHistoryItem,
  LiteSnapOverlaySelection,
  LiteSnapOverlayState,
  LiteSnapPinnedWindowsToggleResult,
  LiteSnapRecognizeTextInput,
  LiteSnapRecognizeTextResult,
  LiteSnapSettings,
  LiteSnapSettingsUpdateResult,
  LiteSnapTogglePinClickThroughResult,
  LiteSnapTranslateSelectionInput,
  LiteSnapTranslateSelectionResult
} from "../shared/litesnap";
import {
  TranslateResult,
  TranslateSettings,
  TranslateTextInput
} from "../shared/translate";
import type { DictionaryEntry, DictionaryPanelState } from "../shared/dictionary";
import type { SelectionTranslateSettings } from "../shared/selection-translate";
import {
  AppErrorLogEntry,
  AppErrorLogInput,
  AppUpdaterStatus,
  CatalogRebuildResult,
  CatalogScanConfig,
  ClipItem,
  ExecuteResult,
  LaunchItem,
  HomeSections,
  LaunchAtLoginStatus,
  PinToggleResult,
  SearchRequestOptions,
  SearchDisplayConfig
} from "../shared/types";
import {
  normalizeSearchDisplayConfig,
  SEARCH_DISPLAY_LIMIT_MAX
} from "../shared/settings";
import { executeItem } from "./actions";
import { getDynamicSearchItems } from "./search";
import { UsageStore } from "./usage-store";
import { setWindowAutoHideSuspended } from "./window-auto-hide";
import { applyLauncherWindowSizePreset } from "./window";

type SearchProvider = {
  getInitialItems: (limit: number) => Promise<LaunchItem[]>;
  getPinnedItems: (limit: number) => Promise<LaunchItem[]>;
  getPluginItems: () => Promise<LaunchItem[]>;
  searchItems: (
    query: string,
    limit: number,
    options?: SearchRequestOptions
  ) => Promise<LaunchItem[]>;
};

type ClipProvider = {
  getClipItems: (query: string, limit: number) => Promise<ClipItem[]>;
  copyClipItem: (itemId: string) => Promise<boolean>;
  deleteClipItem: (itemId: string) => Promise<boolean>;
  clearClipItems: () => Promise<number>;
};

type SettingsProvider = {
  getSearchDisplayConfig: () => SearchDisplayConfig;
  setSearchDisplayConfig: (
    config: Partial<SearchDisplayConfig>
  ) => Promise<SearchDisplayConfig>;
  getCatalogScanConfig: () => CatalogScanConfig;
  setCatalogScanConfig: (
    config: Partial<CatalogScanConfig>
  ) => Promise<CatalogScanConfig>;
  getVisiblePluginIds: () => string[];
  setVisiblePluginIds: (pluginIds: string[]) => Promise<string[]>;
  getAllPluginItems: () => LaunchItem[];
  getRequiredVisiblePluginIds: () => string[];
  getLaunchAtLoginStatus: () => LaunchAtLoginStatus;
  setLaunchAtLoginEnabled: (
    enabled: boolean
  ) => Promise<LaunchAtLoginStatus>;
};

type LiteSnapProvider = {
  getSettings: () => Promise<LiteSnapSettings>;
  updateSettings: (
    patch: Partial<LiteSnapSettings>
  ) => Promise<LiteSnapSettingsUpdateResult>;
  startCapture: () => Promise<boolean>;
  startColorCapture: () => Promise<boolean>;
  pinClipboardImage: () => Promise<boolean>;
  togglePinnedWindowsVisibility: () => LiteSnapPinnedWindowsToggleResult;
  closeAllPinnedWindows: () => LiteSnapCloseAllPinnedWindowsResult;
  toggleNearestPinClickThrough: () => LiteSnapTogglePinClickThroughResult;
  getOverlayState: () => Promise<LiteSnapOverlayState | null>;
  getWindowRectAtPoint: (
    x: number,
    y: number
  ) => Promise<LiteSnapOverlaySelection | null>;
  commitCapture: (
    input: LiteSnapCommitCaptureInput
  ) => Promise<LiteSnapCommitCaptureResult>;
  recognizeText: (
    input: LiteSnapRecognizeTextInput
  ) => Promise<LiteSnapRecognizeTextResult>;
  translateSelection: (
    input: LiteSnapTranslateSelectionInput
  ) => Promise<LiteSnapTranslateSelectionResult>;
  recordRecentColor: (color: string) => Promise<string[]>;
  listHistory: () => Promise<LiteSnapHistoryItem[]>;
  deleteHistoryItem: (id: string) => Promise<boolean>;
  clearHistory: () => Promise<number>;
  historyCopy: (id: string) => Promise<boolean>;
  historyPin: (id: string) => Promise<boolean>;
  probeOcr: () => Promise<import("../shared/litesnap-ocr-help").LiteSnapOcrProbeResult>;
  getOcrCapabilities: () => Promise<
    import("../shared/litesnap-ocr-help").LiteSnapOcrCapabilitiesResult
  >;
  installOcrCapabilities: (
    languages?: import("../shared/litesnap-ocr-help").LiteSnapOcrCapabilityLanguage[]
  ) => Promise<
    import("../shared/litesnap-ocr-help").LiteSnapOcrCapabilityInstallResult
  >;
  getOcrProbeCache: () => Promise<
    import("../shared/litesnap-ocr-help").LiteSnapOcrProbeCache | null
  >;
  setOcrProbeCache: (
    cache: import("../shared/litesnap-ocr-help").LiteSnapOcrProbeCache
  ) => Promise<boolean>;
  cancelCapture: () => Promise<boolean>;
  setDisplayFollowLocked: (locked: boolean) => void;
  ensureSourceImage: () => Promise<string | null>;
};

type TranslateToolProvider = {
  getSettings: () => Promise<TranslateSettings>;
  updateSettings: (patch: Partial<TranslateSettings>) => Promise<TranslateSettings>;
  translateText: (input: TranslateTextInput) => Promise<TranslateResult>;
};

type DictionaryProvider = {
  lookup: (word: string) => Promise<DictionaryEntry | undefined>;
  lookupCandidates: (
    word: string,
    limit?: number
  ) => Promise<DictionaryEntry[]>;
  getPanelState: () => Promise<DictionaryPanelState>;
  recordLookup: (input: {
    query: string;
    entry?: DictionaryEntry | null;
  }) => Promise<DictionaryPanelState>;
  toggleFavorite: (input: {
    word: string;
    entry?: DictionaryEntry | null;
  }) => Promise<DictionaryPanelState>;
  removeHistoryItem: (word: string) => Promise<DictionaryPanelState>;
  clearHistory: () => Promise<DictionaryPanelState>;
  removeFavorite: (word: string) => Promise<DictionaryPanelState>;
  updateFavoriteNote: (
    word: string,
    note: string
  ) => Promise<DictionaryPanelState>;
  setTtsEnabled: (enabled: boolean) => Promise<DictionaryPanelState>;
  buildFavoritesCsv: () => Promise<string>;
};

type DictionaryPackProvider = {
  getStatus: () => Promise<{
    hasFts: boolean;
    usingUserPack: boolean;
    packPath: string | null;
    downloadAvailable: boolean;
  }>;
  downloadPack: () => Promise<{
    ok: boolean;
    message: string;
    packPath?: string;
  }>;
};

type SelectionTranslateProvider = {
  getSettings: () => Promise<SelectionTranslateSettings>;
  updateSettings: (
    patch: Partial<SelectionTranslateSettings>
  ) => Promise<SelectionTranslateSettings>;
};

type CatalogProvider = {
  rebuildCatalog: () => Promise<CatalogRebuildResult>;
};

type UpdaterProvider = {
  getStatus: () => AppUpdaterStatus;
  checkForUpdates: () => Promise<AppUpdaterStatus>;
  installUpdateNow: () => Promise<boolean>;
  setE2ECheckFailure?: (message: string | null) => boolean;
};

type ErrorLogProvider = {
  recordError: (input: AppErrorLogInput) => Promise<void>;
  getErrorLogs: (limit: number) => Promise<AppErrorLogEntry[]>;
  clearErrorLogs: () => Promise<number>;
};

type PinProvider = {
  setItemPinned: (
    itemId: string,
    pinned: boolean,
    item?: LaunchItem
  ) => Promise<PinToggleResult>;
};

type IpcOptions = {
  searchProvider: SearchProvider;
  clipProvider: ClipProvider;
  settingsProvider: SettingsProvider;
  liteSnapProvider: LiteSnapProvider;
  translateToolProvider: TranslateToolProvider;
  dictionaryProvider: DictionaryProvider;
  dictionaryPackProvider: DictionaryPackProvider;
  selectionTranslateProvider: SelectionTranslateProvider;
  catalogProvider: CatalogProvider;
  updaterProvider: UpdaterProvider;
  errorLogProvider: ErrorLogProvider;
  pinProvider: PinProvider;
  usageStore: UsageStore;
  onItemUsed?: (itemId: string) => Promise<void>;
};

const HANDLED_CHANNELS = [
  IPC_CHANNELS.getInitialItems,
  IPC_CHANNELS.getPinnedItems,
  IPC_CHANNELS.getPluginItems,
  IPC_CHANNELS.getHomeSections,
  IPC_CHANNELS.getAppVersion,
  IPC_CHANNELS.getSearchDisplayConfig,
  IPC_CHANNELS.setSearchDisplayConfig,
  IPC_CHANNELS.getCatalogScanConfig,
  IPC_CHANNELS.setCatalogScanConfig,
  IPC_CHANNELS.getVisiblePluginIds,
  IPC_CHANNELS.setVisiblePluginIds,
  IPC_CHANNELS.getAllPluginItems,
  IPC_CHANNELS.getRequiredVisiblePluginIds,
  IPC_CHANNELS.getLiteSnapSettings,
  IPC_CHANNELS.setLiteSnapSettings,
  IPC_CHANNELS.liteSnapStartCapture,
  IPC_CHANNELS.liteSnapStartColorCapture,
  IPC_CHANNELS.liteSnapPinClipboard,
  IPC_CHANNELS.liteSnapTogglePinnedWindows,
  IPC_CHANNELS.liteSnapCloseAllPinnedWindows,
  IPC_CHANNELS.liteSnapToggleNearestPinClickThrough,
  IPC_CHANNELS.liteSnapGetOverlayState,
  IPC_CHANNELS.liteSnapCommitCapture,
  IPC_CHANNELS.liteSnapRecognizeText,
  IPC_CHANNELS.liteSnapTranslateSelection,
  IPC_CHANNELS.liteSnapRecordRecentColor,
  IPC_CHANNELS.liteSnapListHistory,
  IPC_CHANNELS.liteSnapDeleteHistoryItem,
  IPC_CHANNELS.liteSnapClearHistory,
  IPC_CHANNELS.liteSnapHistoryCopy,
  IPC_CHANNELS.liteSnapHistoryPin,
  IPC_CHANNELS.getTranslateToolSettings,
  IPC_CHANNELS.setTranslateToolSettings,
  IPC_CHANNELS.translateToolTranslateText,
  IPC_CHANNELS.liteSnapProbeOcr,
  IPC_CHANNELS.liteSnapGetOcrCapabilities,
  IPC_CHANNELS.liteSnapInstallOcrCapabilities,
  IPC_CHANNELS.liteSnapGetOcrProbeCache,
  IPC_CHANNELS.liteSnapSetOcrProbeCache,
  IPC_CHANNELS.liteSnapCancelCapture,
  IPC_CHANNELS.liteSnapSetDisplayFollowLocked,
  IPC_CHANNELS.liteSnapEnsureSourceImage,
  IPC_CHANNELS.rebuildCatalog,
  IPC_CHANNELS.reportErrorLog,
  IPC_CHANNELS.getErrorLogs,
  IPC_CHANNELS.clearErrorLogs,
  IPC_CHANNELS.getLaunchAtLoginStatus,
  IPC_CHANNELS.setLaunchAtLoginEnabled,
  IPC_CHANNELS.getAppUpdaterStatus,
  IPC_CHANNELS.setE2EAppUpdaterCheckFailure,
  IPC_CHANNELS.checkForAppUpdates,
  IPC_CHANNELS.installAppUpdateNow,
  IPC_CHANNELS.setItemPinned,
  IPC_CHANNELS.search,
  IPC_CHANNELS.resolveCommandQuery,
  IPC_CHANNELS.execute,
  IPC_CHANNELS.setWindowSizePreset,
  IPC_CHANNELS.setAutoHideSuspended,
  IPC_CHANNELS.pickFilePath,
  IPC_CHANNELS.pickDirectoryPath,
  IPC_CHANNELS.hide,
  IPC_CHANNELS.relaunchApp,
  IPC_CHANNELS.getClipItems,
  IPC_CHANNELS.copyClipItem,
  IPC_CHANNELS.deleteClipItem,
  IPC_CHANNELS.clearClipItems
] as const;

const ICON_ELIGIBLE_TYPES = new Set<LaunchItem["type"]>([
  "application",
  "file",
  "folder"
]);

const iconDataCache = new Map<string, string>();
const attachedIconCache = new Map<string, LaunchItem>();
const ICON_DATA_CACHE_MAX = 512;
const ATTACHED_ICON_CACHE_MAX = 1024;
type ShortcutInfo = {
  target?: string;
  icon?: string;
  launchTarget?: string;
};
const shortcutInfoCache = new Map<string, ShortcutInfo | null>();
const windowsAssociatedIconCache = new Map<string, string | null>();
const windowsAssociatedIconPending = new Map<string, Promise<string | null>>();
const ICON_DEBUG_ENABLED = process.env.LITELAUNCHER_DEBUG_ICONS === "1";
const ALLOW_SHORTCUT_FILE_ICON_FALLBACK = true;

type IconCandidate = {
  source: string;
  reason: string;
};

function debugIcon(message: string): void {
  if (!ICON_DEBUG_ENABLED) {
    return;
  }

  console.info(`[debug:icon] ${message}`);
}

function escapeForLog(value: string): string {
  return value.replace(/[^\x20-\x7e]/g, (char) => {
    const code = char.codePointAt(0);
    if (code === undefined) {
      return "?";
    }

    if (code <= 0xffff) {
      return `\\u${code.toString(16).padStart(4, "0")}`;
    }

    return `\\u{${code.toString(16)}}`;
  });
}

function getEnvironmentVariable(name: string): string | undefined {
  const direct = process.env[name];
  if (direct) {
    return direct;
  }

  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(process.env)) {
    if (key.toLowerCase() === lowerName && value) {
      return value;
    }
  }

  return undefined;
}

function expandEnvironmentVariables(value: string): string {
  return value.replace(/%([^%]+)%/g, (_, variableName: string) => {
    return getEnvironmentVariable(variableName) ?? `%${variableName}%`;
  });
}

function normalizePathCandidate(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  let candidate = trimmed;
  const quotedDouble = candidate.match(/^"([^"]+)"/);
  if (quotedDouble?.[1]) {
    candidate = quotedDouble[1].trim();
  }

  const quotedSingle = candidate.match(/^'([^']+)'/);
  if (!quotedDouble?.[1] && quotedSingle?.[1]) {
    candidate = quotedSingle[1].trim();
  }

  if (candidate.startsWith("\"") && candidate.endsWith("\"")) {
    candidate = candidate.slice(1, -1).trim();
  }

  if (candidate.startsWith("'") && candidate.endsWith("'")) {
    candidate = candidate.slice(1, -1).trim();
  }
  if (!candidate) {
    return null;
  }

  const expanded = expandEnvironmentVariables(candidate);
  return expanded.trim() || null;
}

function normalizeIconLocation(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith(",")) {
    return null;
  }

  const iconWithIndex = trimmed.match(/^(.*?),\s*-?\d+\s*$/);
  const withoutIndex = (iconWithIndex ? iconWithIndex[1] : trimmed).trim();
  return normalizePathCandidate(withoutIndex);
}

function splitCommandLineArgs(raw: string): string[] {
  const text = raw.trim();
  if (!text) {
    return [];
  }

  const tokens: string[] = [];
  const pattern = /"([^"]*)"|'([^']*)'|([^\s]+)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const token = match[1] ?? match[2] ?? match[3] ?? "";
    if (token) {
      tokens.push(token);
    }
  }

  return tokens;
}

function resolveShortcutArgPath(
  token: string,
  workingDirectory: string | undefined
): string | null {
  const normalized = normalizePathCandidate(token);
  if (!normalized) {
    return null;
  }

  if (path.isAbsolute(normalized)) {
    return fs.existsSync(normalized) ? normalized : null;
  }

  if (!workingDirectory) {
    return null;
  }

  const combined = path.resolve(workingDirectory, normalized);
  return fs.existsSync(combined) ? combined : null;
}

function resolveSquirrelProcessStartTarget(
  shortcutTarget: string | undefined,
  processStartValue: string,
  workingDirectory: string | undefined
): string | undefined {
  if (!shortcutTarget) {
    return undefined;
  }

  const targetBase = path.basename(shortcutTarget).toLowerCase();
  if (targetBase !== "update.exe") {
    return undefined;
  }

  const direct = resolveShortcutArgPath(processStartValue, workingDirectory);
  if (direct) {
    return direct;
  }

  const installRoot = path.dirname(shortcutTarget);
  const directInRoot = path.resolve(installRoot, processStartValue);
  if (fs.existsSync(directInRoot)) {
    return directInRoot;
  }

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(installRoot, { withFileTypes: true });
  } catch {
    return undefined;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    if (!entry.name.toLowerCase().startsWith("app-")) {
      continue;
    }

    const candidate = path.resolve(installRoot, entry.name, processStartValue);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function resolveShortcutLaunchTarget(
  shortcutTarget: string | undefined,
  shortcutArgs: string | undefined,
  workingDirectory: string | undefined
): string | undefined {
  if (!shortcutArgs) {
    return undefined;
  }

  const tokens = splitCommandLineArgs(shortcutArgs);
  if (tokens.length === 0) {
    return undefined;
  }

  for (let i = 0; i < tokens.length - 1; i += 1) {
    const key = tokens[i]?.trim().toLowerCase();
    if (
      key !== "--processstart" &&
      key !== "-processstart" &&
      key !== "/processstart"
    ) {
      continue;
    }

    const processStartValue = tokens[i + 1]?.trim();
    if (!processStartValue) {
      continue;
    }

    const squirrelResolved = resolveSquirrelProcessStartTarget(
      shortcutTarget,
      processStartValue,
      workingDirectory
    );
    if (squirrelResolved) {
      return squirrelResolved;
    }

    const direct = resolveShortcutArgPath(processStartValue, workingDirectory);
    if (direct) {
      return direct;
    }
  }

  for (const token of tokens) {
    const resolved = resolveShortcutArgPath(token, workingDirectory);
    if (!resolved) {
      continue;
    }
    if (!/\.(exe|com|bat|cmd|lnk)$/i.test(resolved)) {
      continue;
    }
    return resolved;
  }

  return undefined;
}

function readShortcutInfo(shortcutPath: string): ShortcutInfo | null {
  try {
    const shortcut = shell.readShortcutLink(shortcutPath);
    const target = normalizePathCandidate(shortcut.target ?? null) ?? undefined;
    const shortcutMeta = shortcut as unknown as {
      cwd?: string;
      workingDirectory?: string;
    };
    const workingDirectoryRaw =
      shortcutMeta.workingDirectory ?? shortcutMeta.cwd ?? null;
    const workingDirectory =
      normalizePathCandidate(workingDirectoryRaw) ?? undefined;
    const shortcutArgs =
      typeof shortcut.args === "string" ? shortcut.args.trim() : "";
    let icon: string | undefined;

    const rawIcon = normalizePathCandidate(shortcut.icon ?? null);
    if (rawIcon) {
      const iconIndex =
        typeof shortcut.iconIndex === "number" ? shortcut.iconIndex : undefined;
      icon = iconIndex !== undefined ? `${rawIcon},${iconIndex}` : rawIcon;
    }

    const launchTarget = resolveShortcutLaunchTarget(
      target,
      shortcutArgs || undefined,
      workingDirectory
    );

    return { target, icon, launchTarget };
  } catch {
    return null;
  }
}

async function resolveShortcutInfo(
  shortcutPath: string
): Promise<ShortcutInfo | null> {
  const cacheKey = shortcutPath.toLowerCase();
  if (shortcutInfoCache.has(cacheKey)) {
    return shortcutInfoCache.get(cacheKey) ?? null;
  }

  const info = readShortcutInfo(shortcutPath);
  shortcutInfoCache.set(cacheKey, info);
  return info;
}

function stripInvalidIconPath(item: LaunchItem): LaunchItem {
  if (!item.iconPath) {
    return item;
  }

  if (item.iconPath.startsWith("data:image/")) {
    return item;
  }

  const normalizedIconPath = normalizePathCandidate(item.iconPath);
  if (normalizedIconPath) {
    return { ...item, iconPath: normalizedIconPath };
  }

  const { iconPath: _iconPath, ...rest } = item;
  return rest;
}

function isShortcutPath(pathValue: string): boolean {
  return pathValue.toLowerCase().endsWith(".lnk");
}

function pushIconCandidate(
  candidates: IconCandidate[],
  seen: Set<string>,
  source: string | null,
  reason: string
): void {
  if (!source) {
    return;
  }

  const normalized = source.trim();
  if (!normalized) {
    return;
  }

  const key = normalized.toLowerCase();
  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  candidates.push({ source: normalized, reason });
}

async function buildIconCandidates(item: LaunchItem): Promise<IconCandidate[]> {
  const candidates: IconCandidate[] = [];
  const seen = new Set<string>();

  pushIconCandidate(
    candidates,
    seen,
    normalizePathCandidate(item.iconPath ?? null),
    "item-icon-path"
  );
  pushIconCandidate(
    candidates,
    seen,
    normalizeIconLocation(item.iconPath ?? null),
    "item-icon-location"
  );

  const normalizedTarget = normalizePathCandidate(item.target);
  const isCommandTarget = item.target.trim().toLowerCase().startsWith("command:");
  const isShortcut = normalizedTarget ? isShortcutPath(normalizedTarget) : false;
  const realTarget =
    normalizedTarget && !isCommandTarget
      ? safeRealPathCandidate(normalizedTarget)
      : null;

  if (realTarget && realTarget.toLowerCase() !== normalizedTarget?.toLowerCase()) {
    pushIconCandidate(candidates, seen, realTarget, "item-target-realpath");
  }

  if (normalizedTarget && isMacAppBundlePath(normalizedTarget)) {
    for (const iconPath of getMacBundleIconCandidates(normalizedTarget)) {
      pushIconCandidate(candidates, seen, iconPath, "mac-app-bundle-icon");
    }
  }

  if (
    realTarget &&
    realTarget.toLowerCase() !== normalizedTarget?.toLowerCase() &&
    isMacAppBundlePath(realTarget)
  ) {
    for (const iconPath of getMacBundleIconCandidates(realTarget)) {
      pushIconCandidate(candidates, seen, iconPath, "mac-app-bundle-icon-realpath");
    }
  }

  if (item.type === "application" && normalizedTarget && isShortcut) {
    const info = await resolveShortcutInfo(item.target);
    pushIconCandidate(
      candidates,
      seen,
      normalizePathCandidate(info?.launchTarget),
      "shortcut-launch-target"
    );
    const launchRealTarget = info?.launchTarget
      ? safeRealPathCandidate(info.launchTarget)
      : null;
    if (launchRealTarget) {
      pushIconCandidate(
        candidates,
        seen,
        launchRealTarget,
        "shortcut-launch-target-realpath"
      );
    }
    pushIconCandidate(
      candidates,
      seen,
      normalizeIconLocation(info?.icon),
      "shortcut-icon"
    );
    pushIconCandidate(
      candidates,
      seen,
      normalizePathCandidate(info?.target),
      "shortcut-target"
    );
    if (ALLOW_SHORTCUT_FILE_ICON_FALLBACK) {
      pushIconCandidate(candidates, seen, normalizedTarget, "shortcut-file");
    }
    return candidates;
  }

  if (!isCommandTarget) {
    pushIconCandidate(candidates, seen, normalizedTarget, "item-target");
  }
  return candidates;
}

function getIconCacheKey(iconSource: string): string {
  return iconSource.toLowerCase();
}

function readLruMapValue<T>(map: Map<string, T>, key: string): T | undefined {
  const value = map.get(key);
  if (value === undefined) {
    return undefined;
  }

  map.delete(key);
  map.set(key, value);
  return value;
}

function writeLruMapValue<T>(
  map: Map<string, T>,
  key: string,
  value: T,
  maxSize: number
): void {
  if (map.has(key)) {
    map.delete(key);
  }

  map.set(key, value);
  while (map.size > maxSize) {
    const oldestKey = map.keys().next().value;
    if (oldestKey === undefined) {
      break;
    }
    map.delete(oldestKey);
  }
}

function buildAttachIconCacheKey(item: LaunchItem): string {
  const iconPath = item.iconPath?.trim() ?? "";
  if (iconPath.startsWith("data:image/")) {
    return `data:${item.id}`;
  }

  return `${item.id}\u0000${item.type}\u0000${item.target}\u0000${iconPath}`;
}

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
]);

function isIcnsPath(iconSource: string): boolean {
  return iconSource.toLowerCase().endsWith(".icns");
}

function safeRealPathCandidate(pathValue: string): string | null {
  try {
    return fs.realpathSync.native(pathValue);
  } catch {
    return null;
  }
}

function isMacAppBundlePath(pathValue: string): boolean {
  return process.platform === "darwin" && pathValue.toLowerCase().endsWith(".app");
}

function scoreMacBundleIconFilename(filename: string, bundleName: string): number {
  const lowerFilename = filename.toLowerCase();
  const normalizedBundleName = bundleName.toLowerCase();
  let score = 0;

  if (lowerFilename === `${normalizedBundleName}.icns`) {
    score += 100;
  }
  if (lowerFilename.includes("appicon")) {
    score += 80;
  }
  if (lowerFilename.includes(normalizedBundleName)) {
    score += 50;
  }
  if (lowerFilename.includes("icon")) {
    score += 20;
  }

  return score;
}

function getMacBundleIconCandidates(bundlePath: string): string[] {
  if (!isMacAppBundlePath(bundlePath)) {
    return [];
  }

  const resourcesDir = path.join(bundlePath, "Contents", "Resources");
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(resourcesDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const bundleName = path.basename(bundlePath, ".app");
  return entries
    .filter((entry) => {
      if (!entry.isFile() && !entry.isSymbolicLink()) {
        return false;
      }
      return entry.name.toLowerCase().endsWith(".icns");
    })
    .sort((left, right) => {
      const diff =
        scoreMacBundleIconFilename(right.name, bundleName) -
        scoreMacBundleIconFilename(left.name, bundleName);
      if (diff !== 0) {
        return diff;
      }
      return left.name.localeCompare(right.name);
    })
    .map((entry) => path.join(resourcesDir, entry.name));
}

function looksLikeStaticImagePath(iconSource: string): boolean {
  const normalized = iconSource.toLowerCase();
  return (
    normalized.endsWith(".ico") ||
    normalized.endsWith(".icns") ||
    normalized.endsWith(".png") ||
    normalized.endsWith(".jpg") ||
    normalized.endsWith(".jpeg") ||
    normalized.endsWith(".bmp") ||
    normalized.endsWith(".webp")
  );
}

function isWindowsAssociatedIconCandidate(iconSource: string): boolean {
  if (process.platform !== "win32") {
    return false;
  }

  const lower = iconSource.toLowerCase();
  return (
    lower.endsWith(".exe") ||
    lower.endsWith(".lnk") ||
    lower.endsWith(".com") ||
    lower.endsWith(".bat") ||
    lower.endsWith(".cmd")
  );
}

function escapeForPowerShellSingleQuote(value: string): string {
  return value.replace(/'/g, "''");
}

const WINDOWS_ASSOCIATED_ICON_TIMEOUT_MS = 5000;

async function tryReadWindowsAssociatedIconAsDataUrl(
  iconSource: string
): Promise<string | null> {
  if (!isWindowsAssociatedIconCandidate(iconSource)) {
    return null;
  }

  const cacheKey = `assoc:${iconSource.toLowerCase()}`;
  if (windowsAssociatedIconCache.has(cacheKey)) {
    return windowsAssociatedIconCache.get(cacheKey) ?? null;
  }

  const pending = windowsAssociatedIconPending.get(cacheKey);
  if (pending) {
    return pending;
  }

  const escaped = escapeForPowerShellSingleQuote(iconSource);
  const script = [
    "$ErrorActionPreference='Stop'",
    "Add-Type -AssemblyName System.Drawing",
    `$path='${escaped}'`,
    "if(-not (Test-Path -LiteralPath $path)){ return }",
    "$icon=$null;$bmp=$null;$ms=$null",
    "try{",
    "  $icon=[System.Drawing.Icon]::ExtractAssociatedIcon($path)",
    "  if($null -eq $icon){ return }",
    "  $bmp=$icon.ToBitmap()",
    "  $ms=New-Object System.IO.MemoryStream",
    "  $bmp.Save($ms,[System.Drawing.Imaging.ImageFormat]::Png)",
    "  [System.Convert]::ToBase64String($ms.ToArray())",
    "} finally {",
    "  if($ms){ $ms.Dispose() }",
    "  if($bmp){ $bmp.Dispose() }",
    "  if($icon){ $icon.Dispose() }",
    "}"
  ].join("; ");

  const promise = new Promise<string | null>((resolve) => {
    const child = spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        script
      ],
      {
        windowsHide: true
      }
    );

    let stdout = "";
    let resolved = false;

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });

    const timeoutHandle = setTimeout(() => {
      if (resolved) {
        return;
      }
      resolved = true;
      // Do not cache a permanent failure here: a timeout may just mean the
      // system was briefly under load, so allow a later attempt to retry.
      child.kill();
      resolve(null);
    }, WINDOWS_ASSOCIATED_ICON_TIMEOUT_MS);

    const finish = (value: string | null) => {
      if (resolved) {
        return;
      }
      resolved = true;
      clearTimeout(timeoutHandle);
      windowsAssociatedIconCache.set(cacheKey, value);
      resolve(value);
    };

    child.once("error", () => {
      clearTimeout(timeoutHandle);
      finish(null);
    });

    child.once("close", (code) => {
      clearTimeout(timeoutHandle);
      if (code !== 0) {
        finish(null);
        return;
      }

      const base64 = stdout.trim();
      if (!base64) {
        finish(null);
        return;
      }

      finish(`data:image/png;base64,${base64}`);
    });
  }).finally(() => {
    windowsAssociatedIconPending.delete(cacheKey);
  });

  windowsAssociatedIconPending.set(cacheKey, promise);
  return promise;
}

function tryReadIcnsAsDataUrl(iconSource: string): string | null {
  if (!isIcnsPath(iconSource)) {
    return null;
  }

  let fileBuffer: Buffer;
  try {
    fileBuffer = fs.readFileSync(iconSource);
  } catch {
    return null;
  }

  if (fileBuffer.length < 8 || fileBuffer.toString("ascii", 0, 4) !== "icns") {
    return null;
  }

  let bestDataUrl: string | null = null;
  let bestArea = 0;
  let offset = 8;
  while (offset + 8 <= fileBuffer.length) {
    const chunkLength = fileBuffer.readUInt32BE(offset + 4);
    if (chunkLength < 8) {
      break;
    }

    const nextOffset = offset + chunkLength;
    if (nextOffset > fileBuffer.length) {
      break;
    }

    const payload = fileBuffer.subarray(offset + 8, nextOffset);
    if (payload.length >= PNG_SIGNATURE.length) {
      const header = payload.subarray(0, PNG_SIGNATURE.length);
      if (header.equals(PNG_SIGNATURE)) {
        try {
          const image = nativeImage.createFromBuffer(payload);
          if (!image.isEmpty()) {
            const { width, height } = image.getSize();
            const area = Math.max(1, width) * Math.max(1, height);
            const data = image.toDataURL();
            if (data.startsWith("data:image/") && area >= bestArea) {
              bestArea = area;
              bestDataUrl = data;
            }
          }
        } catch {
          // Ignore malformed chunks and continue scanning the icns container.
        }
      }
    }

    offset = nextOffset;
  }

  return bestDataUrl;
}

function tryReadImageFileAsDataUrl(iconSource: string): string | null {
  if (!looksLikeStaticImagePath(iconSource)) {
    return null;
  }

  const icnsData = tryReadIcnsAsDataUrl(iconSource);
  if (icnsData) {
    return icnsData;
  }

  const ext = path.extname(iconSource).toLowerCase();
  const staticMimeType =
    ext === ".png"
      ? "image/png"
      : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".gif"
            ? "image/gif"
            : ext === ".bmp"
              ? "image/bmp"
              : ext === ".ico"
                ? "image/x-icon"
                : ext === ".svg"
                  ? "image/svg+xml"
                  : null;

  if (staticMimeType) {
    try {
      const fileBuffer = fs.readFileSync(iconSource);
      if (fileBuffer.length > 0) {
        if (staticMimeType === "image/svg+xml") {
          const svgText = fileBuffer.toString("utf8").trim();
          if (svgText) {
            return `data:${staticMimeType};charset=utf-8,${encodeURIComponent(svgText)}`;
          }
        } else {
          return `data:${staticMimeType};base64,${fileBuffer.toString("base64")}`;
        }
      }
    } catch {
      // Fall through to Electron image decoding below.
    }
  }

  try {
    const image = nativeImage.createFromPath(iconSource);
    if (image.isEmpty()) {
      return null;
    }

    const data = image.toDataURL();
    if (!data.startsWith("data:image/")) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

async function resolveIconData(item: LaunchItem): Promise<string | null> {
  const candidates = await buildIconCandidates(item);
  if (candidates.length === 0) {
    const targetText = escapeForLog(item.target ?? "");
    const isShortcut = item.target.toLowerCase().endsWith(".lnk");
    debugIcon(
      `fallback no-candidate title=${escapeForLog(item.title)} target=${targetText} shortcut=${isShortcut ? "yes" : "no"}`
    );
    return null;
  }

  for (const candidate of candidates) {
    const iconSource = candidate.source;
    const cacheKey = getIconCacheKey(iconSource);
    const cached = readLruMapValue(iconDataCache, cacheKey);
    if (cached) {
      debugIcon(
        `cache-hit reason=${candidate.reason} title=${escapeForLog(item.title)} source=${escapeForLog(iconSource)}`
      );
      return cached;
    }

    const staticImageData = tryReadImageFileAsDataUrl(iconSource);
    if (staticImageData) {
      writeLruMapValue(iconDataCache, cacheKey, staticImageData, ICON_DATA_CACHE_MAX);
      debugIcon(
        `resolved reason=${candidate.reason}:image-file title=${escapeForLog(item.title)} source=${escapeForLog(iconSource)}`
      );
      return staticImageData;
    }

    if (candidate.reason.startsWith("shortcut-")) {
      const associatedData =
        await tryReadWindowsAssociatedIconAsDataUrl(iconSource);
      if (associatedData) {
        writeLruMapValue(iconDataCache, cacheKey, associatedData, ICON_DATA_CACHE_MAX);
        debugIcon(
          `resolved reason=${candidate.reason}:win-associated title=${escapeForLog(item.title)} source=${escapeForLog(iconSource)}`
        );
        return associatedData;
      }
    }

    try {
      let icon = await app.getFileIcon(iconSource, { size: "large" });
      if (icon.isEmpty()) {
        icon = await app.getFileIcon(iconSource, { size: "normal" });
      }
      if (icon.isEmpty()) {
        const imageData = tryReadImageFileAsDataUrl(iconSource);
        if (imageData) {
          writeLruMapValue(iconDataCache, cacheKey, imageData, ICON_DATA_CACHE_MAX);
          debugIcon(
            `resolved reason=${candidate.reason}:image-file title=${escapeForLog(item.title)} source=${escapeForLog(iconSource)}`
          );
          return imageData;
        }
        debugIcon(
          `candidate-empty reason=${candidate.reason} title=${escapeForLog(item.title)} source=${escapeForLog(iconSource)}`
        );
        continue;
      }

      const iconData = icon.toDataURL();
      if (!iconData.startsWith("data:image/")) {
        debugIcon(
          `candidate-non-image reason=${candidate.reason} title=${escapeForLog(item.title)} source=${escapeForLog(iconSource)}`
        );
        continue;
      }

      writeLruMapValue(iconDataCache, cacheKey, iconData, ICON_DATA_CACHE_MAX);
      debugIcon(
        `resolved reason=${candidate.reason} title=${escapeForLog(item.title)} source=${escapeForLog(iconSource)}`
      );
      return iconData;
    } catch {
      const imageData = tryReadImageFileAsDataUrl(iconSource);
      if (imageData) {
        writeLruMapValue(iconDataCache, cacheKey, imageData, ICON_DATA_CACHE_MAX);
        debugIcon(
          `resolved reason=${candidate.reason}:image-file title=${escapeForLog(item.title)} source=${escapeForLog(iconSource)}`
        );
        return imageData;
      }
      debugIcon(
        `candidate-error reason=${candidate.reason} title=${escapeForLog(item.title)} source=${escapeForLog(iconSource)}`
      );
      continue;
    }
  }

  debugIcon(`fallback title=${escapeForLog(item.title)} (no icon candidates worked)`);
  return null;
}

async function attachIcon(item: LaunchItem): Promise<LaunchItem> {
  const cacheKey = buildAttachIconCacheKey(item);
  const cachedItem = readLruMapValue(attachedIconCache, cacheKey);
  if (cachedItem) {
    // Only reuse the resolved icon. Returning the whole cached LaunchItem would
    // overwrite live fields such as `pinned` after pin/unpin toggles.
    return {
      ...item,
      iconPath: cachedItem.iconPath ?? item.iconPath
    };
  }

  const sanitizedItem = stripInvalidIconPath(item);
  const hasPathIcon =
    typeof sanitizedItem.iconPath === "string" &&
    !sanitizedItem.iconPath.startsWith("data:image/");

  if (sanitizedItem.iconPath && sanitizedItem.iconPath.startsWith("data:image/")) {
    writeLruMapValue(attachedIconCache, cacheKey, sanitizedItem, ATTACHED_ICON_CACHE_MAX);
    return sanitizedItem;
  }

  if (!ICON_ELIGIBLE_TYPES.has(sanitizedItem.type) && !hasPathIcon) {
    writeLruMapValue(attachedIconCache, cacheKey, sanitizedItem, ATTACHED_ICON_CACHE_MAX);
    return sanitizedItem;
  }

  if (!sanitizedItem.target && !hasPathIcon) {
    writeLruMapValue(attachedIconCache, cacheKey, sanitizedItem, ATTACHED_ICON_CACHE_MAX);
    return sanitizedItem;
  }

  const iconData = await resolveIconData(sanitizedItem);
  if (!iconData) {
    const stripped = stripInvalidIconPath(sanitizedItem);
    writeLruMapValue(attachedIconCache, cacheKey, stripped, ATTACHED_ICON_CACHE_MAX);
    return stripped;
  }

  const resolvedItem = { ...sanitizedItem, iconPath: iconData };
  writeLruMapValue(attachedIconCache, cacheKey, resolvedItem, ATTACHED_ICON_CACHE_MAX);
  return resolvedItem;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));

  async function worker(): Promise<void> {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) {
        return;
      }
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

const ICON_RESOLVE_CONCURRENCY = 6;

async function attachIcons(items: LaunchItem[]): Promise<LaunchItem[]> {
  return mapWithConcurrency(items, ICON_RESOLVE_CONCURRENCY, (item) =>
    attachIcon(item)
  );
}

export function registerIpcHandlers(
  window: BrowserWindow,
  options: IpcOptions
): void {
  const persistErrorLog = async (input: AppErrorLogInput): Promise<void> => {
    try {
      await options.errorLogProvider.recordError(input);
    } catch (error) {
      console.error("[error-log] failed to persist error", error);
    }
  };

  for (const channel of HANDLED_CHANNELS) {
    ipcMain.removeHandler(channel);
  }

  ipcMain.handle(IPC_CHANNELS.getInitialItems, async () => {
    const items = await options.searchProvider.getInitialItems(
      SEARCH_DISPLAY_LIMIT_MAX
    );
    return attachIcons(items);
  });

  ipcMain.handle(IPC_CHANNELS.getPinnedItems, async () => {
    const items = await options.searchProvider.getPinnedItems(
      SEARCH_DISPLAY_LIMIT_MAX
    );
    return attachIcons(items);
  });

  ipcMain.handle(IPC_CHANNELS.getPluginItems, async () => {
    const items = await options.searchProvider.getPluginItems();
    return attachIcons(items);
  });

  ipcMain.handle(IPC_CHANNELS.getHomeSections, async () => {
    const [recent, pinned, plugin] = await Promise.all([
      options.searchProvider.getInitialItems(SEARCH_DISPLAY_LIMIT_MAX),
      options.searchProvider.getPinnedItems(SEARCH_DISPLAY_LIMIT_MAX),
      options.searchProvider.getPluginItems()
    ]);

    const mergedById = new Map<string, LaunchItem>();
    for (const item of [...recent, ...pinned, ...plugin]) {
      mergedById.set(item.id, item);
    }

    const withIcons = await attachIcons([...mergedById.values()]);
    const iconById = new Map(withIcons.map((item) => [item.id, item]));

    const attachSectionIcons = (items: LaunchItem[]): LaunchItem[] =>
      items.map((item) => {
        const withIcon = iconById.get(item.id);
        if (!withIcon) {
          return item;
        }
        // Keep the section item's live fields (especially pinned) and only
        // borrow the resolved icon path from the deduplicated attach pass.
        return {
          ...item,
          iconPath: withIcon.iconPath ?? item.iconPath
        };
      });

    const sections: HomeSections = {
      recent: attachSectionIcons(recent),
      pinned: attachSectionIcons(pinned),
      plugin: attachSectionIcons(plugin)
    };
    return sections;
  });

  ipcMain.handle(IPC_CHANNELS.getAppVersion, () => {
    return app.getVersion();
  });

  ipcMain.handle(IPC_CHANNELS.getSearchDisplayConfig, () => {
    return options.settingsProvider.getSearchDisplayConfig();
  });

  ipcMain.handle(IPC_CHANNELS.getCatalogScanConfig, () => {
    return options.settingsProvider.getCatalogScanConfig();
  });

  ipcMain.handle(IPC_CHANNELS.getVisiblePluginIds, () => {
    return options.settingsProvider.getVisiblePluginIds();
  });

  ipcMain.handle(IPC_CHANNELS.getAllPluginItems, () => {
    return options.settingsProvider.getAllPluginItems();
  });

  ipcMain.handle(IPC_CHANNELS.getRequiredVisiblePluginIds, () => {
    return options.settingsProvider.getRequiredVisiblePluginIds();
  });

  ipcMain.handle(IPC_CHANNELS.getLiteSnapSettings, () => {
    return options.liteSnapProvider.getSettings();
  });

  ipcMain.handle(IPC_CHANNELS.getLaunchAtLoginStatus, () => {
    return options.settingsProvider.getLaunchAtLoginStatus();
  });

  ipcMain.handle(IPC_CHANNELS.getAppUpdaterStatus, () => {
    return options.updaterProvider.getStatus();
  });

  ipcMain.handle(
    IPC_CHANNELS.setE2EAppUpdaterCheckFailure,
    async (_, messageInput: unknown) => {
      if (process.env.LITELAUNCHER_E2E !== "1") {
        return false;
      }

      if (!options.updaterProvider.setE2ECheckFailure) {
        return false;
      }

      const message =
        typeof messageInput === "string" ? messageInput : messageInput == null ? null : String(messageInput);
      return options.updaterProvider.setE2ECheckFailure(message);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.setSearchDisplayConfig,
    async (_, configInput: Partial<SearchDisplayConfig> | null) => {
      const normalized = normalizeSearchDisplayConfig(configInput);
      return options.settingsProvider.setSearchDisplayConfig(normalized);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.setCatalogScanConfig,
    async (_, configInput: Partial<CatalogScanConfig> | null) => {
      const input = configInput ?? {};
      return options.settingsProvider.setCatalogScanConfig(input);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.setVisiblePluginIds,
    async (_, pluginIdsInput: unknown) => {
      const ids = Array.isArray(pluginIdsInput)
        ? pluginIdsInput
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];
      return options.settingsProvider.setVisiblePluginIds(ids);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.setLiteSnapSettings,
    async (_, patchInput: Partial<LiteSnapSettings> | null) => {
      const patch =
        patchInput && typeof patchInput === "object" ? patchInput : {};
      return options.liteSnapProvider.updateSettings(patch);
    }
  );

  ipcMain.handle(IPC_CHANNELS.liteSnapStartCapture, async () => {
    return options.liteSnapProvider.startCapture();
  });

  ipcMain.handle(IPC_CHANNELS.liteSnapStartColorCapture, async () => {
    return options.liteSnapProvider.startColorCapture();
  });

  ipcMain.handle(IPC_CHANNELS.liteSnapPinClipboard, async () => {
    return options.liteSnapProvider.pinClipboardImage();
  });

  ipcMain.handle(IPC_CHANNELS.liteSnapTogglePinnedWindows, () => {
    return options.liteSnapProvider.togglePinnedWindowsVisibility();
  });

  ipcMain.handle(IPC_CHANNELS.liteSnapCloseAllPinnedWindows, () => {
    return options.liteSnapProvider.closeAllPinnedWindows();
  });

  ipcMain.handle(IPC_CHANNELS.liteSnapToggleNearestPinClickThrough, () => {
    return options.liteSnapProvider.toggleNearestPinClickThrough();
  });

  ipcMain.handle(IPC_CHANNELS.liteSnapGetOverlayState, async () => {
    return options.liteSnapProvider.getOverlayState();
  });

  ipcMain.handle(
    IPC_CHANNELS.liteSnapGetWindowRectAtPoint,
    async (_, xInput: unknown, yInput: unknown) => {
      const x = typeof xInput === "number" && Number.isFinite(xInput) ? xInput : 0;
      const y = typeof yInput === "number" && Number.isFinite(yInput) ? yInput : 0;
      return options.liteSnapProvider.getWindowRectAtPoint(x, y);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.liteSnapCommitCapture,
    async (_, input: LiteSnapCommitCaptureInput | null) => {
      const normalizedInput: LiteSnapCommitCaptureInput =
        input && typeof input === "object"
          ? input
          : {
              action: "copy",
              selection: {
                x: 0,
                y: 0,
                width: 0,
                height: 0
              }
            };
      return options.liteSnapProvider.commitCapture(normalizedInput);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.liteSnapRecognizeText,
    async (_, input: LiteSnapRecognizeTextInput | null) => {
      const normalizedInput: LiteSnapRecognizeTextInput =
        input && typeof input === "object" && input.selection
          ? input
          : { selection: { x: 0, y: 0, width: 0, height: 0 } };
      return options.liteSnapProvider.recognizeText(normalizedInput);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.liteSnapTranslateSelection,
    async (_, input: LiteSnapTranslateSelectionInput | null) => {
      const normalizedInput: LiteSnapTranslateSelectionInput =
        input && typeof input === "object" && input.selection
          ? input
          : { selection: { x: 0, y: 0, width: 0, height: 0 } };
      return options.liteSnapProvider.translateSelection(normalizedInput);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.liteSnapRecordRecentColor,
    async (_, colorInput: unknown) => {
      const color = typeof colorInput === "string" ? colorInput : "";
      return options.liteSnapProvider.recordRecentColor(color);
    }
  );

  ipcMain.handle(IPC_CHANNELS.liteSnapListHistory, async () => {
    return options.liteSnapProvider.listHistory();
  });

  ipcMain.handle(
    IPC_CHANNELS.liteSnapDeleteHistoryItem,
    async (_, idInput: unknown) => {
      const id = typeof idInput === "string" ? idInput : "";
      return options.liteSnapProvider.deleteHistoryItem(id);
    }
  );

  ipcMain.handle(IPC_CHANNELS.liteSnapClearHistory, async () => {
    return options.liteSnapProvider.clearHistory();
  });

  ipcMain.handle(IPC_CHANNELS.liteSnapHistoryCopy, async (_, idInput: unknown) => {
    const id = typeof idInput === "string" ? idInput : "";
    return options.liteSnapProvider.historyCopy(id);
  });

  ipcMain.handle(IPC_CHANNELS.liteSnapHistoryPin, async (_, idInput: unknown) => {
    const id = typeof idInput === "string" ? idInput : "";
    return options.liteSnapProvider.historyPin(id);
  });

  ipcMain.handle(IPC_CHANNELS.getTranslateToolSettings, () => {
    return options.translateToolProvider.getSettings();
  });

  ipcMain.handle(
    IPC_CHANNELS.setTranslateToolSettings,
    async (_, patchInput: Partial<TranslateSettings> | null) => {
      const patch =
        patchInput && typeof patchInput === "object" ? patchInput : {};
      return options.translateToolProvider.updateSettings(patch);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.translateToolTranslateText,
    async (_, input: TranslateTextInput | null) => {
      const normalizedInput: TranslateTextInput =
        input && typeof input === "object"
          ? {
              text: typeof input.text === "string" ? input.text : "",
              appId: typeof input.appId === "string" ? input.appId : undefined,
              secret: typeof input.secret === "string" ? input.secret : undefined,
              apiKey: typeof input.apiKey === "string" ? input.apiKey : undefined,
              engine:
                input.engine === "llm" || input.engine === "standard"
                  ? input.engine
                  : undefined
            }
          : { text: "" };
      return options.translateToolProvider.translateText(normalizedInput);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.lookupDictionaryWord,
    async (_, wordInput: unknown) => {
      const word = typeof wordInput === "string" ? wordInput : "";
      return options.dictionaryProvider.lookup(word);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.lookupDictionaryCandidates,
    async (_, wordInput: unknown, limitInput: unknown) => {
      const word = typeof wordInput === "string" ? wordInput : "";
      const limit =
        typeof limitInput === "number" && Number.isFinite(limitInput)
          ? limitInput
          : 8;
      return options.dictionaryProvider.lookupCandidates(word, limit);
    }
  );

  ipcMain.handle(IPC_CHANNELS.getDictionaryPanelState, () => {
    return options.dictionaryProvider.getPanelState();
  });

  ipcMain.handle(
    IPC_CHANNELS.recordDictionaryLookup,
    async (_, input: unknown) => {
      const record =
        input && typeof input === "object"
          ? (input as { query?: unknown; entry?: unknown })
          : {};
      const query = typeof record.query === "string" ? record.query : "";
      const entry =
        record.entry && typeof record.entry === "object"
          ? (record.entry as DictionaryEntry)
          : null;
      return options.dictionaryProvider.recordLookup({ query, entry });
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.toggleDictionaryFavorite,
    async (_, input: unknown) => {
      const record =
        input && typeof input === "object"
          ? (input as { word?: unknown; entry?: unknown })
          : {};
      const word = typeof record.word === "string" ? record.word : "";
      const entry =
        record.entry && typeof record.entry === "object"
          ? (record.entry as DictionaryEntry)
          : null;
      return options.dictionaryProvider.toggleFavorite({ word, entry });
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.removeDictionaryHistoryItem,
    async (_, wordInput: unknown) => {
      const word = typeof wordInput === "string" ? wordInput : "";
      return options.dictionaryProvider.removeHistoryItem(word);
    }
  );

  ipcMain.handle(IPC_CHANNELS.clearDictionaryHistory, () => {
    return options.dictionaryProvider.clearHistory();
  });

  ipcMain.handle(
    IPC_CHANNELS.removeDictionaryFavorite,
    async (_, wordInput: unknown) => {
      const word = typeof wordInput === "string" ? wordInput : "";
      return options.dictionaryProvider.removeFavorite(word);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.updateDictionaryFavoriteNote,
    async (_, input: unknown) => {
      const record =
        input && typeof input === "object"
          ? (input as { word?: unknown; note?: unknown })
          : {};
      const word = typeof record.word === "string" ? record.word : "";
      const note = typeof record.note === "string" ? record.note : "";
      return options.dictionaryProvider.updateFavoriteNote(word, note);
    }
  );

  ipcMain.handle(IPC_CHANNELS.exportDictionaryFavoritesCsv, async () => {
    const csv = await options.dictionaryProvider.buildFavoritesCsv();
    setWindowAutoHideSuspended(window, true);
    try {
      const result = await dialog.showSaveDialog(window, {
        title: "导出词典收藏",
        defaultPath: "litelauncher-dictionary-favorites.csv",
        filters: [{ name: "CSV", extensions: ["csv"] }]
      });
      if (result.canceled || !result.filePath) {
        return { ok: false, message: "已取消导出。" };
      }
      const fs = await import("node:fs/promises");
      await fs.writeFile(result.filePath, `\uFEFF${csv}`, "utf8");
      return {
        ok: true,
        message: `已导出到 ${result.filePath}`,
        path: result.filePath
      };
    } finally {
      setWindowAutoHideSuspended(window, false);
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.setDictionaryTtsEnabled,
    async (_, enabledInput: unknown) => {
      return options.dictionaryProvider.setTtsEnabled(Boolean(enabledInput));
    }
  );

  ipcMain.handle(IPC_CHANNELS.getDictionaryPackStatus, () => {
    return options.dictionaryPackProvider.getStatus();
  });

  ipcMain.handle(IPC_CHANNELS.downloadDictionaryPack, () => {
    return options.dictionaryPackProvider.downloadPack();
  });

  ipcMain.handle(IPC_CHANNELS.getSelectionTranslateSettings, () => {
    return options.selectionTranslateProvider.getSettings();
  });

  ipcMain.handle(
    IPC_CHANNELS.setSelectionTranslateSettings,
    async (_, patchInput: Partial<SelectionTranslateSettings> | null) => {
      const patch =
        patchInput && typeof patchInput === "object" ? patchInput : {};
      return options.selectionTranslateProvider.updateSettings(patch);
    }
  );

  ipcMain.handle(IPC_CHANNELS.liteSnapProbeOcr, async () => {
    return options.liteSnapProvider.probeOcr();
  });

  ipcMain.handle(IPC_CHANNELS.liteSnapGetOcrCapabilities, async () => {
    return options.liteSnapProvider.getOcrCapabilities();
  });

  ipcMain.handle(
    IPC_CHANNELS.liteSnapInstallOcrCapabilities,
    async (_, languagesInput: unknown) => {
      const languages = Array.isArray(languagesInput)
        ? languagesInput.filter(
            (entry): entry is "zh-CN" | "en-US" =>
              entry === "zh-CN" || entry === "en-US"
          )
        : undefined;
      return options.liteSnapProvider.installOcrCapabilities(languages);
    }
  );

  ipcMain.handle(IPC_CHANNELS.liteSnapGetOcrProbeCache, async () => {
    return options.liteSnapProvider.getOcrProbeCache();
  });

  ipcMain.handle(IPC_CHANNELS.liteSnapSetOcrProbeCache, async (_, cacheInput) => {
    if (!cacheInput || typeof cacheInput !== "object") {
      return false;
    }
    return options.liteSnapProvider.setOcrProbeCache(
      cacheInput as import("../shared/litesnap-ocr-help").LiteSnapOcrProbeCache
    );
  });

  ipcMain.handle(IPC_CHANNELS.liteSnapCancelCapture, async () => {
    return options.liteSnapProvider.cancelCapture();
  });

  ipcMain.handle(IPC_CHANNELS.liteSnapSetDisplayFollowLocked, (_event, lockedInput: unknown) => {
    options.liteSnapProvider.setDisplayFollowLocked(Boolean(lockedInput));
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.liteSnapEnsureSourceImage, async () => {
    return options.liteSnapProvider.ensureSourceImage();
  });

  ipcMain.handle(IPC_CHANNELS.rebuildCatalog, async () => {
    const result = await options.catalogProvider.rebuildCatalog();
    if (!result.ok) {
      await persistErrorLog({
        scope: "ipc",
        level: "error",
        message: "重建索引失败",
        detail: result.message,
        context: "channel=rebuildCatalog"
      });
    }
    return result;
  });

  ipcMain.handle(
    IPC_CHANNELS.reportErrorLog,
    async (_, input: Partial<AppErrorLogInput> | null | undefined) => {
      const payload = input ?? {};
      const message = String(payload.message ?? "").trim();
      if (!message) {
        return false;
      }

      await persistErrorLog({
        scope:
          payload.scope === "renderer" ||
          payload.scope === "main" ||
          payload.scope === "ipc" ||
          payload.scope === "execute" ||
          payload.scope === "system"
            ? payload.scope
            : "renderer",
        level: payload.level === "warn" ? "warn" : "error",
        message,
        context:
          typeof payload.context === "string" ? payload.context : undefined,
        detail: typeof payload.detail === "string" ? payload.detail : undefined
      });
      return true;
    }
  );

  ipcMain.handle(IPC_CHANNELS.getErrorLogs, async (_, limitInput: unknown) => {
    const parsedLimit = Number(limitInput);
    const limit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(500, Math.round(parsedLimit)))
      : 100;
    return options.errorLogProvider.getErrorLogs(limit);
  });

  ipcMain.handle(IPC_CHANNELS.clearErrorLogs, async () => {
    return options.errorLogProvider.clearErrorLogs();
  });

  ipcMain.handle(
    IPC_CHANNELS.setLaunchAtLoginEnabled,
    async (_, enabledInput: unknown) => {
      return options.settingsProvider.setLaunchAtLoginEnabled(
        Boolean(enabledInput)
      );
    }
  );

  ipcMain.handle(IPC_CHANNELS.checkForAppUpdates, async () => {
    return options.updaterProvider.checkForUpdates();
  });

  ipcMain.handle(IPC_CHANNELS.installAppUpdateNow, async () => {
    return options.updaterProvider.installUpdateNow();
  });

  ipcMain.handle(
    IPC_CHANNELS.setItemPinned,
    async (_, itemIdInput: string, pinnedInput: boolean, itemInput?: LaunchItem) => {
      const itemId = String(itemIdInput ?? "").trim();
      const pinned = Boolean(pinnedInput);
      const item =
        itemInput &&
        typeof itemInput === "object" &&
        String((itemInput as LaunchItem).id ?? "").trim() === itemId
          ? (itemInput as LaunchItem)
          : undefined;
      return options.pinProvider.setItemPinned(itemId, pinned, item);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.search,
    async (
      _,
      query: string,
      optionsInput: SearchRequestOptions | number | null | undefined
    ) => {
      try {
        const config = options.settingsProvider.getSearchDisplayConfig();
        const requestOptions =
          typeof optionsInput === "number"
            ? { limit: optionsInput }
            : optionsInput ?? {};
        const parsedLimit = Number(requestOptions.limit);
        const limit = Number.isFinite(parsedLimit)
          ? Math.max(1, Math.min(500, Math.round(parsedLimit)))
          : config.searchLimit;
        const scope =
          requestOptions.scope === "application" ||
          requestOptions.scope === "folder" ||
          requestOptions.scope === "file" ||
          requestOptions.scope === "web" ||
          requestOptions.scope === "command" ||
          requestOptions.scope === "plugin"
            ? requestOptions.scope
            : "all";
        const items = await options.searchProvider.searchItems(
          query ?? "",
          limit,
          { limit, scope }
        );
        return attachIcons(items);
      } catch (error) {
        const detail =
          error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error);
        await persistErrorLog({
          scope: "ipc",
          level: "error",
          message: "搜索请求失败",
          detail,
          context: `query=${String(query ?? "").slice(0, 120)}`
        });
        return [];
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.resolveCommandQuery, async (_, query: string) => {
    try {
      const items = await getDynamicSearchItems(query ?? "", "all");
      return attachIcons(items);
    } catch (error) {
      const detail =
        error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error);
      await persistErrorLog({
        scope: "ipc",
        level: "error",
        message: "命令解析失败",
        detail,
        context: `query=${String(query ?? "").slice(0, 120)}`
      });
      return [];
    }
  });

  ipcMain.handle(IPC_CHANNELS.execute, async (_, itemInput: LaunchItem) => {
    try {
      const selected = itemInput;
      if (!selected) {
        await persistErrorLog({
          scope: "execute",
          level: "warn",
          message: "执行失败：未选中条目",
          context: "itemInput is empty"
        });
        return { ok: false, message: "No selected item" } satisfies ExecuteResult;
      }

      if (
        selected.type === "command" &&
        selected.target.trim().toLowerCase() === "command:reindex"
      ) {
        const rebuildResult = await options.catalogProvider.rebuildCatalog();
        if (!rebuildResult.ok) {
          await persistErrorLog({
            scope: "execute",
            level: "error",
            message: "执行重建索引失败",
            detail: rebuildResult.message,
            context: `itemId=${selected.id}`
          });
        }
        return {
          ok: rebuildResult.ok,
          keepOpen: true,
          message: rebuildResult.message,
          data: {
            totalItems: rebuildResult.totalItems,
            applicationItems: rebuildResult.applicationItems,
            durationMs: rebuildResult.durationMs
          }
        } satisfies ExecuteResult;
      }

      const result = await executeItem(selected, window);
      if (result.ok) {
        options.usageStore.markUsed(selected.id);
        if (options.onItemUsed) {
          await options.onItemUsed(selected.id);
        }
        if (!result.keepOpen) {
          window.hide();
        }
      } else {
        await persistErrorLog({
          scope: "execute",
          level: "error",
          message: result.message || "执行失败",
          context: `itemId=${selected.id}; target=${selected.target}`
        });
      }
      return result;
    } catch (error) {
      const detail =
        error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error);
      await persistErrorLog({
        scope: "execute",
        level: "error",
        message: "执行过程异常",
        detail
      });
      return {
        ok: false,
        keepOpen: true,
        message: "执行异常，已写入错误日志"
      } satisfies ExecuteResult;
    }
  });

  ipcMain.handle(IPC_CHANNELS.setWindowSizePreset, (_, presetInput: unknown) => {
    const preset =
      typeof presetInput === "string" ? presetInput.trim().toLowerCase() : "";
    if (preset !== "compact" && preset !== "cashflow") {
      return false;
    }

    applyLauncherWindowSizePreset(window, preset);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.setAutoHideSuspended, (_, suspendedInput: unknown) => {
    return setWindowAutoHideSuspended(window, suspendedInput === true);
  });

  ipcMain.handle(IPC_CHANNELS.pickFilePath, async () => {
    if (window.isDestroyed()) {
      return null;
    }

    setWindowAutoHideSuspended(window, true);
    try {
      const result = await dialog.showOpenDialog(window, {
        title: "选择文件",
        properties: ["openFile", "dontAddToRecent"]
      });
      if (result.canceled || !Array.isArray(result.filePaths) || result.filePaths.length === 0) {
        return null;
      }
      const selected = result.filePaths[0];
      return typeof selected === "string" && selected.trim() ? selected : null;
    } finally {
      setWindowAutoHideSuspended(window, false);
    }
  });

  ipcMain.handle(IPC_CHANNELS.pickDirectoryPath, async () => {
    if (window.isDestroyed()) {
      return null;
    }

    setWindowAutoHideSuspended(window, true);
    try {
      const result = await dialog.showOpenDialog(window, {
        title: "选择文件夹",
        properties: ["openDirectory", "createDirectory", "dontAddToRecent"]
      });
      if (result.canceled || !Array.isArray(result.filePaths) || result.filePaths.length === 0) {
        return null;
      }
      const selected = result.filePaths[0];
      return typeof selected === "string" && selected.trim() ? selected : null;
    } finally {
      setWindowAutoHideSuspended(window, false);
    }
  });

  ipcMain.handle(IPC_CHANNELS.hide, () => {
    applyLauncherWindowSizePreset(window, "compact");
    window.hide();
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.relaunchApp, () => {
    const relaunchArgs = process.argv
      .slice(1)
      .filter((arg) => arg !== "--replace-instance");
    app.relaunch({ args: relaunchArgs });
    app.quit();
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.getClipItems, async (_, query: string) => {
    return options.clipProvider.getClipItems(query ?? "", 50);
  });

  ipcMain.handle(IPC_CHANNELS.copyClipItem, async (_, itemId: string) => {
    return options.clipProvider.copyClipItem(itemId);
  });

  ipcMain.handle(IPC_CHANNELS.deleteClipItem, async (_, itemId: string) => {
    return options.clipProvider.deleteClipItem(itemId);
  });

  ipcMain.handle(IPC_CHANNELS.clearClipItems, async () => {
    return options.clipProvider.clearClipItems();
  });
}
