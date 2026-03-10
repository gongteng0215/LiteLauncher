import { LaunchItem } from "../shared/types";

const PATH_FILTER_ITEM_TYPES = new Set<LaunchItem["type"]>([
  "application",
  "folder",
  "file"
]);

export interface PathRuleFilterInput {
  includeDirs?: string[];
  excludeDirs?: string[];
}

export function normalizePathRule(
  pathValue: string,
  platform: NodeJS.Platform = process.platform
): string {
  let normalized = pathValue.trim().replace(/[\\/]+$/, "");
  if (!normalized) {
    return "";
  }

  if (platform === "win32") {
    normalized = normalized.replace(/\//g, "\\").toLowerCase();
  } else {
    normalized = normalized.replace(/\\/g, "/");
  }

  return normalized;
}

export function isPathRuleMatch(
  targetPath: string,
  pathRule: string,
  platform: NodeJS.Platform = process.platform
): boolean {
  if (targetPath === pathRule) {
    return true;
  }

  if (platform === "win32") {
    return targetPath.startsWith(`${pathRule}\\`);
  }

  return targetPath.startsWith(`${pathRule}/`);
}

export function filterItemsByPathRules(
  items: LaunchItem[],
  rules: PathRuleFilterInput,
  platform: NodeJS.Platform = process.platform
): LaunchItem[] {
  const includeRules = (rules.includeDirs ?? [])
    .map((value) => normalizePathRule(value, platform))
    .filter(Boolean);
  const excludeRules = (rules.excludeDirs ?? [])
    .map((value) => normalizePathRule(value, platform))
    .filter(Boolean);

  if (includeRules.length === 0 && excludeRules.length === 0) {
    return items;
  }

  return items.filter((item) => {
    if (!PATH_FILTER_ITEM_TYPES.has(item.type)) {
      return true;
    }

    const target = normalizePathRule(item.target, platform);
    if (!target) {
      return true;
    }

    if (includeRules.length > 0) {
      const included = includeRules.some((rule) =>
        isPathRuleMatch(target, rule, platform)
      );
      if (!included) {
        return false;
      }
    }

    if (excludeRules.length > 0) {
      const excluded = excludeRules.some((rule) =>
        isPathRuleMatch(target, rule, platform)
      );
      if (excluded) {
        return false;
      }
    }

    return true;
  });
}
