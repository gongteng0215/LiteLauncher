import { CatalogScanConfig, SearchDisplayConfig } from "./types";

export const SEARCH_DISPLAY_LIMIT_MIN = 5;
export const SEARCH_DISPLAY_LIMIT_MAX = 100;

export const DEFAULT_SEARCH_DISPLAY_CONFIG: SearchDisplayConfig = {
  recentLimit: 20,
  pinnedLimit: 20,
  pluginLimit: 20,
  searchLimit: 50
};

export const CATALOG_CUSTOM_DIR_MAX = 50;

export const DEFAULT_CATALOG_SCAN_CONFIG: CatalogScanConfig = {
  scanProgramFiles: false,
  customScanDirs: [],
  excludeScanDirs: [],
  resultIncludeDirs: [],
  resultExcludeDirs: []
};

function toSafeInteger(
  value: unknown,
  fallback: number,
  min = SEARCH_DISPLAY_LIMIT_MIN,
  max = SEARCH_DISPLAY_LIMIT_MAX
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const rounded = Math.round(parsed);
  if (rounded < min) {
    return min;
  }

  if (rounded > max) {
    return max;
  }

  return rounded;
}

export function normalizeSearchDisplayConfig(
  input:
    | (Partial<SearchDisplayConfig> & { recommendedLimit?: unknown })
    | null
    | undefined,
  base: SearchDisplayConfig = DEFAULT_SEARCH_DISPLAY_CONFIG
): SearchDisplayConfig {
  const source = input ?? {};
  return {
    recentLimit: toSafeInteger(source.recentLimit, base.recentLimit),
    pinnedLimit: toSafeInteger(
      source.pinnedLimit ?? source.recommendedLimit,
      base.pinnedLimit
    ),
    pluginLimit: toSafeInteger(source.pluginLimit, base.pluginLimit),
    searchLimit: toSafeInteger(source.searchLimit, base.searchLimit)
  };
}

function normalizeStringList(
  input: unknown,
  maxLength = CATALOG_CUSTOM_DIR_MAX
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

    const value = raw.trim();
    if (!value) {
      continue;
    }

    const key = value.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(value);
    if (result.length >= maxLength) {
      break;
    }
  }

  return result;
}

export function normalizeCatalogScanConfig(
  input: Partial<CatalogScanConfig> | null | undefined,
  base: CatalogScanConfig = DEFAULT_CATALOG_SCAN_CONFIG
): CatalogScanConfig {
  const source = input ?? {};
  return {
    scanProgramFiles:
      typeof source.scanProgramFiles === "boolean"
        ? source.scanProgramFiles
        : base.scanProgramFiles,
    customScanDirs: normalizeStringList(
      source.customScanDirs ?? base.customScanDirs
    ),
    excludeScanDirs: normalizeStringList(
      source.excludeScanDirs ?? base.excludeScanDirs
    ),
    resultIncludeDirs: normalizeStringList(
      source.resultIncludeDirs ?? base.resultIncludeDirs
    ),
    resultExcludeDirs: normalizeStringList(
      source.resultExcludeDirs ?? base.resultExcludeDirs
    )
  };
}
