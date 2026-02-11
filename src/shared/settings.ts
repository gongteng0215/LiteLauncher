import { SearchDisplayConfig } from "./types";

export const SEARCH_DISPLAY_LIMIT_MIN = 5;
export const SEARCH_DISPLAY_LIMIT_MAX = 50;

export const DEFAULT_SEARCH_DISPLAY_CONFIG: SearchDisplayConfig = {
  recentLimit: 20,
  pinnedLimit: 20,
  pluginLimit: 20,
  searchLimit: 20
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
