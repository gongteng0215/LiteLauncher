import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { computeInitialItems, computeSearchItems } from "../shared/search-engine";
import { LaunchItem, SearchRequestOptions, SearchScope } from "../shared/types";
import { UsageStore } from "./usage-store";

const DYNAMIC_COMMAND_CACHE = new Map<string, LaunchItem | null>();

function isSimpleCommandQuery(query: string): boolean {
  return /^[a-z0-9][a-z0-9._-]{1,63}$/i.test(query);
}

function getWindowsWhereExecutable(): string {
  const windowsDir = process.env.WINDIR ?? "C:\\Windows";
  return path.join(windowsDir, "System32", "where.exe");
}

function getWindowsPowerShellExecutable(): string {
  const windowsDir = process.env.WINDIR ?? "C:\\Windows";
  return path.join(
    windowsDir,
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe"
  );
}

function resolveWindowsCommandPathViaPowerShell(commandName: string): string | null {
  try {
    const result = spawnSync(
      getWindowsPowerShellExecutable(),
      [
        "-NoProfile",
        "-Command",
        `(Get-Command '${commandName.replace(/'/g, "''")}' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source)`
      ],
      {
        encoding: "utf8",
        windowsHide: true,
        timeout: 3000
      }
    );
    if (result.error || result.status !== 0) {
      return null;
    }

    const resolved = String(result.stdout ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);
    return resolved ?? null;
  } catch {
    return null;
  }
}

function resolveCommandPath(query: string): string | null {
  const normalized = query.trim();
  if (!normalized) {
    return null;
  }

  if (process.platform === "win32") {
    try {
      const result = spawnSync(getWindowsWhereExecutable(), [normalized], {
        encoding: "utf8",
        windowsHide: true,
        timeout: 2000
      });
      if (!result.error && result.status === 0) {
        const candidates = String(result.stdout ?? "")
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
        const preferred =
          candidates.find((candidate) => candidate.toLowerCase().endsWith(".exe")) ??
          candidates[0];
        if (preferred) {
          return preferred;
        }
      }
    } catch {
      // Fallback to PowerShell below.
    }

    return resolveWindowsCommandPathViaPowerShell(normalized);
  }

  try {
    const result = spawnSync("which", [normalized], {
      encoding: "utf8",
      timeout: 1200
    });
    if (result.error || result.status !== 0) {
      return null;
    }

    const resolved = String(result.stdout ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);
    return resolved ?? null;
  } catch {
    return null;
  }
}

function formatResolvedCommandTitle(query: string, resolvedPath: string): string {
  const fallback =
    path.basename(resolvedPath, path.extname(resolvedPath)) ||
    path.basename(query, path.extname(query)) ||
    query.trim();
  if (!fallback) {
    return query.trim();
  }
  if (/^[a-z0-9._-]+$/i.test(fallback)) {
    return fallback.charAt(0).toUpperCase() + fallback.slice(1);
  }
  return fallback;
}

type WindowsAppsMetadata = {
  appId: string;
  title: string;
  iconPath?: string;
};

function resolveWindowsAppsMetadata(resolvedPath: string): WindowsAppsMetadata | null {
  if (process.platform !== "win32" || !resolvedPath.toLowerCase().includes("\\windowsapps\\")) {
    return null;
  }

  let packageRoot = path.dirname(resolvedPath);
  while (packageRoot && packageRoot !== path.dirname(packageRoot)) {
    const manifestPath = path.join(packageRoot, "AppxManifest.xml");
    if (fs.existsSync(manifestPath)) {
      try {
        const xml = fs.readFileSync(manifestPath, "utf8");
        const identityName = xml.match(/<Identity[^>]*Name="([^"]+)"/i)?.[1]?.trim();
        const displayName =
          xml.match(/<Properties>\s*<DisplayName>([^<]+)<\/DisplayName>/i)?.[1]?.trim() ??
          xml.match(/DisplayName="([^"]+)"/i)?.[1]?.trim();
        const appEntryId = xml.match(/<Application[^>]*Id="([^"]+)"/i)?.[1]?.trim();
        const logoRelative =
          xml.match(/Square44x44Logo="([^"]+)"/i)?.[1]?.trim() ??
          xml.match(/<Logo>([^<]+)<\/Logo>/i)?.[1]?.trim();
        const packageFolderName = path.basename(packageRoot);
        const publisherId = packageFolderName.split("__")[1]?.trim();
        if (!identityName || !appEntryId || !publisherId) {
          return null;
        }

        const logoPath = logoRelative
          ? path.join(packageRoot, logoRelative.replace(/[\\/]/g, path.sep))
          : undefined;

        return {
          appId: `${identityName}_${publisherId}!${appEntryId}`,
          title: displayName || formatResolvedCommandTitle(identityName, resolvedPath),
          iconPath: logoPath && fs.existsSync(logoPath) ? logoPath : undefined
        };
      } catch {
        return null;
      }
    }
    packageRoot = path.dirname(packageRoot);
  }

  return null;
}

export function getDynamicSearchItems(
  query: string,
  scope: SearchScope = "all"
): LaunchItem[] {
  if (scope !== "all" && scope !== "command") {
    return [];
  }

  const normalized = query.trim();
  if (!isSimpleCommandQuery(normalized)) {
    return [];
  }

  const cacheKey = normalized.toLowerCase();
  if (!DYNAMIC_COMMAND_CACHE.has(cacheKey)) {
    const resolvedPath = resolveCommandPath(normalized);
    if (!resolvedPath) {
      DYNAMIC_COMMAND_CACHE.set(cacheKey, null);
    } else {
      const windowsApps = resolveWindowsAppsMetadata(resolvedPath);
      if (windowsApps) {
        DYNAMIC_COMMAND_CACHE.set(cacheKey, {
          id: `command:apps-folder:${cacheKey}`,
          type: "application",
          title: windowsApps.title,
          subtitle: resolvedPath,
          target: `command:apps-folder:${encodeURIComponent(windowsApps.appId)}`,
          iconPath: windowsApps.iconPath,
          keywords: [
            cacheKey,
            windowsApps.title.toLowerCase(),
            path.basename(resolvedPath).toLowerCase(),
            "command",
            "path",
            "alias",
            "windowsapps"
          ]
        });
      } else {
        const title = formatResolvedCommandTitle(normalized, resolvedPath);
        DYNAMIC_COMMAND_CACHE.set(cacheKey, {
          id: `app:path-alias:${cacheKey}`,
          type: "application",
          title,
          subtitle: resolvedPath,
          target: resolvedPath,
          keywords: [
            cacheKey,
            title.toLowerCase(),
            path.basename(resolvedPath).toLowerCase(),
            "command",
            "path",
            "alias"
          ]
        });
      }
    }
  }

  const item = DYNAMIC_COMMAND_CACHE.get(cacheKey);
  return item ? [item] : [];
}

export function getInitialItems(
  catalog: LaunchItem[],
  usageStore: UsageStore,
  limit = 10
): LaunchItem[] {
  return computeInitialItems(catalog, usageStore.toObject(), limit);
}

export function searchItems(
  query: string,
  catalog: LaunchItem[],
  usageStore: UsageStore,
  limit = 20,
  options?: SearchRequestOptions
): LaunchItem[] {
  return computeSearchItems(query, catalog, usageStore.toObject(), limit, options);
}



