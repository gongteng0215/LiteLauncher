import fs from "node:fs";
import path from "node:path";
import { ItemType, LaunchItem } from "../shared/types";

export const CUSTOM_PIN_ID_PREFIX = "pin:custom:";

const APPLICATION_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".msi",
  ".com",
  ".lnk",
  ".app"
]);

export function isCustomPinId(itemId: string): boolean {
  return String(itemId ?? "").trim().startsWith(CUSTOM_PIN_ID_PREFIX);
}

export function normalizeCustomPinPath(filePath: string): string {
  const trimmed = String(filePath ?? "").trim();
  if (!trimmed) {
    return "";
  }

  try {
    return fs.realpathSync.native(trimmed);
  } catch {
    return path.resolve(trimmed);
  }
}

export function buildCustomPinId(filePath: string): string {
  const normalized = normalizeCustomPinPath(filePath);
  return normalized ? `${CUSTOM_PIN_ID_PREFIX}${normalized}` : "";
}

export function parseCustomPinPath(itemId: string): string | null {
  const normalizedId = String(itemId ?? "").trim();
  if (!isCustomPinId(normalizedId)) {
    return null;
  }

  const filePath = normalizedId.slice(CUSTOM_PIN_ID_PREFIX.length).trim();
  return filePath || null;
}

function resolveItemType(filePath: string, isDirectory: boolean): ItemType {
  if (isDirectory) {
    return "folder";
  }

  const extension = path.extname(filePath).toLowerCase();
  if (APPLICATION_EXTENSIONS.has(extension)) {
    return "application";
  }

  return "file";
}

export function buildLaunchItemFromPath(filePath: string): LaunchItem | null {
  const normalized = normalizeCustomPinPath(filePath);
  if (!normalized || !fs.existsSync(normalized)) {
    return null;
  }

  let stat: fs.Stats;
  try {
    stat = fs.statSync(normalized);
  } catch {
    return null;
  }

  if (!stat.isFile() && !stat.isDirectory()) {
    return null;
  }

  const title = path.basename(normalized) || normalized;
  const type = resolveItemType(normalized, stat.isDirectory());
  const id = buildCustomPinId(normalized);

  return {
    id,
    type,
    title,
    subtitle: normalized,
    target: normalized,
    keywords: [title.toLowerCase(), path.basename(normalized).toLowerCase(), "custom", "pin"]
  };
}

export function findCatalogItemByTarget(
  catalog: readonly LaunchItem[],
  filePath: string
): LaunchItem | undefined {
  const normalized = normalizeCustomPinPath(filePath).toLowerCase();
  if (!normalized) {
    return undefined;
  }

  return catalog.find(
    (item) => item.target.trim().toLowerCase() === normalized
  );
}

export function resolvePinItemForPath(
  filePath: string,
  catalog: readonly LaunchItem[]
): LaunchItem | null {
  const customItem = buildLaunchItemFromPath(filePath);
  if (!customItem) {
    return null;
  }

  return findCatalogItemByTarget(catalog, customItem.target) ?? customItem;
}

export function parsePinnedCustomItems(raw: unknown): Map<string, LaunchItem> {
  const result = new Map<string, LaunchItem>();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return result;
  }

  for (const [rawId, rawItem] of Object.entries(raw)) {
    if (!isCustomPinId(rawId) || !rawItem || typeof rawItem !== "object") {
      continue;
    }

    const item = rawItem as LaunchItem;
    const id = String(item.id ?? rawId).trim();
    const target = String(item.target ?? parseCustomPinPath(id) ?? "").trim();
    if (!id || !target || !isCustomPinId(id)) {
      continue;
    }

    const refreshed = buildLaunchItemFromPath(target);
    if (!refreshed) {
      continue;
    }

    result.set(id, {
      ...refreshed,
      title: String(item.title ?? refreshed.title).trim() || refreshed.title
    });
  }

  return result;
}

export function serializePinnedCustomItems(
  items: ReadonlyMap<string, LaunchItem>
): Record<string, LaunchItem> {
  const result: Record<string, LaunchItem> = {};
  for (const [id, item] of items.entries()) {
    if (!isCustomPinId(id)) {
      continue;
    }
    result[id] = item;
  }
  return result;
}
