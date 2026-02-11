import { BrowserWindow } from "electron";

import { ExecuteResult, LaunchItem } from "../../shared/types";
import { cashflowGamePlugin } from "./cashflow-game";
import { passwordGeneratorPlugin } from "./password-generator";
import { LauncherPlugin } from "./types";

const PLUGINS: LauncherPlugin[] = [passwordGeneratorPlugin, cashflowGamePlugin];

const PLUGIN_ID_PREFIX = "plugin:";

const pluginsById = new Map<string, LauncherPlugin>(
  PLUGINS.map((plugin) => [plugin.id, plugin])
);

function normalizePluginId(value: string): string {
  return value.trim().toLowerCase();
}

function dedupeItems(items: LaunchItem[]): LaunchItem[] {
  const result: LaunchItem[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const id = item.id.trim();
    if (!id || seen.has(id)) {
      continue;
    }

    seen.add(id);
    result.push(item);
  }

  return result;
}

function parsePluginArg(
  pluginArg: string | undefined
): { pluginId: string; optionsText: string | undefined } | null {
  if (!pluginArg) {
    return null;
  }

  const trimmed = pluginArg.trim();
  if (!trimmed) {
    return null;
  }

  const questionMarkIndex = trimmed.indexOf("?");
  if (questionMarkIndex === -1) {
    return { pluginId: normalizePluginId(trimmed), optionsText: undefined };
  }

  const rawPluginId = trimmed.slice(0, questionMarkIndex);
  const optionsText = trimmed.slice(questionMarkIndex + 1);
  return {
    pluginId: normalizePluginId(rawPluginId),
    optionsText: optionsText || undefined
  };
}

export function getPluginCatalogItems(): LaunchItem[] {
  return dedupeItems(PLUGINS.flatMap((plugin) => plugin.createCatalogItems()));
}

export function getPluginQueryItems(query: string): LaunchItem[] {
  const normalized = query.trim();
  if (!normalized) {
    return [];
  }

  return dedupeItems(
    PLUGINS.flatMap((plugin) => plugin.getQueryItems?.(normalized) ?? [])
  );
}

export function isPluginCatalogItem(item: LaunchItem): boolean {
  return item.id.startsWith(PLUGIN_ID_PREFIX);
}

export async function executePluginCommand(
  pluginArg: string | undefined,
  window: BrowserWindow,
  selectedItem: LaunchItem
): Promise<ExecuteResult> {
  const parsed = parsePluginArg(pluginArg);
  if (!parsed) {
    return { ok: false, message: "\u7f3a\u5c11\u63d2\u4ef6\u6807\u8bc6" };
  }

  const plugin = pluginsById.get(parsed.pluginId);
  if (!plugin) {
    return {
      ok: false,
      message: `\u63d2\u4ef6\u4e0d\u5b58\u5728: ${parsed.pluginId}`
    };
  }

  return plugin.execute(parsed.optionsText, { window, selectedItem });
}
