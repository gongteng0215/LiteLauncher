import { app, BrowserWindow, ipcMain, nativeImage, shell } from "electron";

import { IPC_CHANNELS } from "../shared/channels";
import {
  ClipItem,
  ExecuteResult,
  LaunchItem,
  LaunchAtLoginStatus,
  SearchDisplayConfig
} from "../shared/types";
import { normalizeSearchDisplayConfig } from "../shared/settings";
import { executeItem } from "./actions";
import { UsageStore } from "./usage-store";
import { applyLauncherWindowSizePreset } from "./window";

type SearchProvider = {
  getInitialItems: (limit: number) => Promise<LaunchItem[]>;
  getPinnedItems: (limit: number) => Promise<LaunchItem[]>;
  getPluginItems: (limit: number) => Promise<LaunchItem[]>;
  searchItems: (query: string, limit: number) => Promise<LaunchItem[]>;
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
  getLaunchAtLoginStatus: () => LaunchAtLoginStatus;
  setLaunchAtLoginEnabled: (
    enabled: boolean
  ) => Promise<LaunchAtLoginStatus>;
};

type PinProvider = {
  setItemPinned: (itemId: string, pinned: boolean) => Promise<boolean>;
};

type IpcOptions = {
  searchProvider: SearchProvider;
  clipProvider: ClipProvider;
  settingsProvider: SettingsProvider;
  pinProvider: PinProvider;
  usageStore: UsageStore;
  onItemUsed?: (itemId: string) => Promise<void>;
};

const HANDLED_CHANNELS = [
  IPC_CHANNELS.getInitialItems,
  IPC_CHANNELS.getPinnedItems,
  IPC_CHANNELS.getPluginItems,
  IPC_CHANNELS.getSearchDisplayConfig,
  IPC_CHANNELS.setSearchDisplayConfig,
  IPC_CHANNELS.getLaunchAtLoginStatus,
  IPC_CHANNELS.setLaunchAtLoginEnabled,
  IPC_CHANNELS.setItemPinned,
  IPC_CHANNELS.search,
  IPC_CHANNELS.execute,
  IPC_CHANNELS.setWindowSizePreset,
  IPC_CHANNELS.hide,
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
const shortcutInfoCache = new Map<string, { target?: string; icon?: string } | null>();
const ICON_DEBUG_ENABLED = process.env.LITELAUNCHER_DEBUG_ICONS === "1";
const ALLOW_SHORTCUT_FILE_ICON_FALLBACK = false;

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

function readShortcutInfo(shortcutPath: string): { target?: string; icon?: string } | null {
  try {
    const shortcut = shell.readShortcutLink(shortcutPath);
    const target = normalizePathCandidate(shortcut.target ?? null) ?? undefined;
    let icon: string | undefined;

    const rawIcon = normalizePathCandidate(shortcut.icon ?? null);
    if (rawIcon) {
      const iconIndex =
        typeof shortcut.iconIndex === "number" ? shortcut.iconIndex : undefined;
      icon = iconIndex !== undefined ? `${rawIcon},${iconIndex}` : rawIcon;
    }

    return { target, icon };
  } catch {
    return null;
  }
}

async function resolveShortcutInfo(
  shortcutPath: string
): Promise<{ target?: string; icon?: string } | null> {
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

  if (item.type === "application" && normalizedTarget && isShortcut) {
    const info = await resolveShortcutInfo(item.target);
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

function looksLikeStaticImagePath(iconSource: string): boolean {
  const normalized = iconSource.toLowerCase();
  return (
    normalized.endsWith(".ico") ||
    normalized.endsWith(".png") ||
    normalized.endsWith(".jpg") ||
    normalized.endsWith(".jpeg") ||
    normalized.endsWith(".bmp") ||
    normalized.endsWith(".webp")
  );
}

function tryReadImageFileAsDataUrl(iconSource: string): string | null {
  if (!looksLikeStaticImagePath(iconSource)) {
    return null;
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
    const cached = iconDataCache.get(cacheKey);
    if (cached) {
      debugIcon(
        `cache-hit reason=${candidate.reason} title=${escapeForLog(item.title)} source=${escapeForLog(iconSource)}`
      );
      return cached;
    }

    const staticImageData = tryReadImageFileAsDataUrl(iconSource);
    if (staticImageData) {
      iconDataCache.set(cacheKey, staticImageData);
      debugIcon(
        `resolved reason=${candidate.reason}:image-file title=${escapeForLog(item.title)} source=${escapeForLog(iconSource)}`
      );
      return staticImageData;
    }

    try {
      const icon = await app.getFileIcon(iconSource, { size: "normal" });
      if (icon.isEmpty()) {
        const imageData = tryReadImageFileAsDataUrl(iconSource);
        if (imageData) {
          iconDataCache.set(cacheKey, imageData);
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

      iconDataCache.set(cacheKey, iconData);
      debugIcon(
        `resolved reason=${candidate.reason} title=${escapeForLog(item.title)} source=${escapeForLog(iconSource)}`
      );
      return iconData;
    } catch {
      const imageData = tryReadImageFileAsDataUrl(iconSource);
      if (imageData) {
        iconDataCache.set(cacheKey, imageData);
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
  const sanitizedItem = stripInvalidIconPath(item);
  const hasPathIcon =
    typeof sanitizedItem.iconPath === "string" &&
    !sanitizedItem.iconPath.startsWith("data:image/");

  if (sanitizedItem.iconPath && sanitizedItem.iconPath.startsWith("data:image/")) {
    return sanitizedItem;
  }

  if (!ICON_ELIGIBLE_TYPES.has(sanitizedItem.type) && !hasPathIcon) {
    return sanitizedItem;
  }

  if (!sanitizedItem.target && !hasPathIcon) {
    return sanitizedItem;
  }

  const iconData = await resolveIconData(sanitizedItem);
  if (!iconData) {
    return stripInvalidIconPath(sanitizedItem);
  }

  return { ...sanitizedItem, iconPath: iconData };
}

async function attachIcons(items: LaunchItem[]): Promise<LaunchItem[]> {
  return Promise.all(items.map((item) => attachIcon(item)));
}

export function registerIpcHandlers(
  window: BrowserWindow,
  options: IpcOptions
): void {
  for (const channel of HANDLED_CHANNELS) {
    ipcMain.removeHandler(channel);
  }

  ipcMain.handle(IPC_CHANNELS.getInitialItems, async () => {
    const config = options.settingsProvider.getSearchDisplayConfig();
    const items = await options.searchProvider.getInitialItems(config.recentLimit);
    return attachIcons(items);
  });

  ipcMain.handle(IPC_CHANNELS.getPinnedItems, async () => {
    const config = options.settingsProvider.getSearchDisplayConfig();
    const items = await options.searchProvider.getPinnedItems(config.pinnedLimit);
    return attachIcons(items);
  });

  ipcMain.handle(IPC_CHANNELS.getPluginItems, async () => {
    const config = options.settingsProvider.getSearchDisplayConfig();
    const items = await options.searchProvider.getPluginItems(config.pluginLimit);
    return attachIcons(items);
  });

  ipcMain.handle(IPC_CHANNELS.getSearchDisplayConfig, () => {
    return options.settingsProvider.getSearchDisplayConfig();
  });

  ipcMain.handle(IPC_CHANNELS.getLaunchAtLoginStatus, () => {
    return options.settingsProvider.getLaunchAtLoginStatus();
  });

  ipcMain.handle(
    IPC_CHANNELS.setSearchDisplayConfig,
    async (_, configInput: Partial<SearchDisplayConfig> | null) => {
      const normalized = normalizeSearchDisplayConfig(configInput);
      return options.settingsProvider.setSearchDisplayConfig(normalized);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.setLaunchAtLoginEnabled,
    async (_, enabledInput: unknown) => {
      return options.settingsProvider.setLaunchAtLoginEnabled(
        Boolean(enabledInput)
      );
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.setItemPinned,
    async (_, itemIdInput: string, pinnedInput: boolean) => {
      const itemId = String(itemIdInput ?? "").trim();
      const pinned = Boolean(pinnedInput);
      return options.pinProvider.setItemPinned(itemId, pinned);
    }
  );

  ipcMain.handle(IPC_CHANNELS.search, async (_, query: string) => {
    const config = options.settingsProvider.getSearchDisplayConfig();
    const items = await options.searchProvider.searchItems(
      query ?? "",
      config.searchLimit
    );
    return attachIcons(items);
  });

  ipcMain.handle(IPC_CHANNELS.execute, async (_, itemInput: LaunchItem) => {
    const selected = itemInput;
    if (!selected) {
      return { ok: false, message: "No selected item" } satisfies ExecuteResult;
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
    }

    return result;
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

  ipcMain.handle(IPC_CHANNELS.hide, () => {
    applyLauncherWindowSizePreset(window, "compact");
    window.hide();
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
