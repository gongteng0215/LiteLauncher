export type ClipboardWorkbenchItemKind = "text" | "image" | "files";
export type ClipboardWorkbenchItemSource = "auto" | "manual" | "screenshot";
export type ClipboardWorkbenchListScope =
  | "all"
  | "recent"
  | "favorites"
  | "pinned"
  | "text"
  | "image"
  | "files"
  | "screenshots";
export type ClipboardWorkbenchPasteMode = "sequential" | "merge-once";
export type ClipboardWorkbenchMergeMode =
  | "direct"
  | "newline"
  | "blank-line"
  | "custom";

export const CLIPBOARD_WORKBENCH_SETTINGS_KEY =
  "plugin.clipboard-workbench.settings";

export interface ClipboardWorkbenchSettings {
  version: 1;
  autoCollect: boolean;
  sensitiveMode: boolean;
  maxItems: number;
  maxBytes: number;
  ignoreShortCodes: boolean;
  shortCodeLengthMax: number;
  ignoredAppHints: string[];
  batchPasteDelayMs: number;
}

export interface ClipboardWorkbenchRetentionItem {
  id: string;
  pinned: number;
  favorite: number;
  byteSize: number;
  createdAt: number;
}

export function createDefaultClipboardWorkbenchSettings(): ClipboardWorkbenchSettings {
  return {
    version: 1,
    autoCollect: true,
    sensitiveMode: false,
    maxItems: 50,
    maxBytes: 512 * 1024 * 1024,
    ignoreShortCodes: true,
    shortCodeLengthMax: 8,
    ignoredAppHints: [],
    batchPasteDelayMs: 180
  };
}

export function normalizeClipboardWorkbenchText(input: string): string {
  return input.replace(/\r\n/g, "\n").trim();
}

export function shouldIgnoreClipboardWorkbenchText(
  input: string,
  settings: ClipboardWorkbenchSettings
): boolean {
  const normalized = normalizeClipboardWorkbenchText(input);
  if (!normalized) {
    return true;
  }

  if (!settings.ignoreShortCodes) {
    return false;
  }

  return /^\d+$/.test(normalized) && normalized.length <= settings.shortCodeLengthMax;
}

export function decodeClipboardWorkbenchFileNameW(buffer: Buffer): string[] {
  return buffer
    .toString("utf16le")
    .split("\0")
    .map((part) => part.trim())
    .filter(Boolean);
}

function getClipboardWorkbenchSeparator(
  mode: ClipboardWorkbenchMergeMode,
  customSeparator: string
): string {
  switch (mode) {
    case "direct":
      return "";
    case "newline":
      return "\n";
    case "blank-line":
      return "\n\n";
    case "custom":
      return customSeparator;
  }
}

export function mergeClipboardWorkbenchTextItems(
  values: string[],
  mode: ClipboardWorkbenchMergeMode,
  customSeparator = ""
): string {
  return values
    .map(normalizeClipboardWorkbenchText)
    .filter(Boolean)
    .join(getClipboardWorkbenchSeparator(mode, customSeparator));
}

export function mergeClipboardWorkbenchFilePaths(
  filePaths: string[],
  mode: ClipboardWorkbenchMergeMode,
  customSeparator = ""
): string {
  return filePaths
    .map((value) => value.trim())
    .filter(Boolean)
    .join(getClipboardWorkbenchSeparator(mode, customSeparator));
}

function shouldKeepClipboardWorkbenchItem(
  nextCount: number,
  nextBytes: number,
  limits: { maxItems: number; maxBytes: number }
): boolean {
  return nextCount <= limits.maxItems && nextBytes <= limits.maxBytes;
}

export function selectClipboardWorkbenchEvictionIds(
  items: ClipboardWorkbenchRetentionItem[],
  limits: { maxItems: number; maxBytes: number }
): string[] {
  const evictionOrder = [...items].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned - right.pinned;
    }
    if (left.favorite !== right.favorite) {
      return left.favorite - right.favorite;
    }
    return left.createdAt - right.createdAt;
  });

  let keptCount = items.length;
  let keptBytes = items.reduce((sum, item) => sum + item.byteSize, 0);
  const evictedIds: string[] = [];

  for (const item of evictionOrder) {
    if (shouldKeepClipboardWorkbenchItem(keptCount, keptBytes, limits)) {
      break;
    }
    keptCount -= 1;
    keptBytes -= item.byteSize;
    evictedIds.push(item.id);
  }

  return evictedIds;
}
