import { BrowserWindow } from "electron";

import { ExecuteResult, LaunchItem } from "../../shared/types";
import { cashflowGamePlugin } from "./cashflow-game";
import { LauncherPlugin } from "./types";
import { webtoolsApiClientPlugin } from "./webtools-api-client";
import { webtoolsColorsPlugin } from "./webtools-colors";
import { webtoolsConfigConvertPlugin } from "./webtools-config-convert";
import { webtoolsCronPlugin } from "./webtools-cron";
import { webtoolsCryptoPlugin } from "./webtools-crypto";
import { webtoolsDiffPlugin } from "./webtools-diff";
import { webtoolsHttpMockPlugin } from "./webtools-http-mock";
import { webtoolsImageBase64Plugin } from "./webtools-image-base64";
import { webtoolsJsonPlugin } from "./webtools-json";
import { webtoolsJwtPlugin } from "./webtools-jwt";
import { webtoolsMarkdownPlugin } from "./webtools-markdown";
import { webtoolsPasswordPlugin } from "./webtools-password";
import { webtoolsQrcodePlugin } from "./webtools-qrcode";
import { webtoolsRegexPlugin } from "./webtools-regex";
import { webtoolsSqlFormatPlugin } from "./webtools-sql-format";
import { webtoolsStringsPlugin } from "./webtools-strings";
import { webtoolsTimestampPlugin } from "./webtools-timestamp";
import { webtoolsUaPlugin } from "./webtools-ua";
import { webtoolsUnitConvertPlugin } from "./webtools-unit-convert";
import { webtoolsUrlParsePlugin } from "./webtools-url-parse";

const ALL_PLUGINS: LauncherPlugin[] = [
  cashflowGamePlugin,
  webtoolsPasswordPlugin,
  webtoolsCronPlugin,
  webtoolsJsonPlugin,
  webtoolsCryptoPlugin,
  webtoolsJwtPlugin,
  webtoolsTimestampPlugin,
  webtoolsRegexPlugin,
  webtoolsStringsPlugin,
  webtoolsColorsPlugin,
  webtoolsDiffPlugin,
  webtoolsHttpMockPlugin,
  webtoolsImageBase64Plugin,
  webtoolsConfigConvertPlugin,
  webtoolsSqlFormatPlugin,
  webtoolsUnitConvertPlugin,
  webtoolsUrlParsePlugin,
  webtoolsQrcodePlugin,
  webtoolsMarkdownPlugin,
  webtoolsUaPlugin,
  webtoolsApiClientPlugin
];

const DEFAULT_VISIBLE_PLUGIN_IDS = [
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

const PLUGIN_ID_PREFIX = "plugin:";

const pluginsById = new Map<string, LauncherPlugin>(
  ALL_PLUGINS.map((plugin) => [plugin.id, plugin])
);
let visiblePluginIdSet = new Set<string>(DEFAULT_VISIBLE_PLUGIN_IDS);

export function getAllPluginIds(): string[] {
  return ALL_PLUGINS.map((plugin) => plugin.id);
}

export function getDefaultVisiblePluginIds(): string[] {
  return [...DEFAULT_VISIBLE_PLUGIN_IDS];
}

export function getVisiblePluginIds(): string[] {
  return getVisiblePlugins().map((plugin) => plugin.id);
}

function getVisiblePlugins(): LauncherPlugin[] {
  return ALL_PLUGINS.filter((plugin) => visiblePluginIdSet.has(plugin.id));
}

function normalizeVisiblePluginIds(pluginIds: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const raw of pluginIds) {
    const pluginId = normalizePluginId(raw);
    if (!pluginId || seen.has(pluginId) || !pluginsById.has(pluginId)) {
      continue;
    }

    seen.add(pluginId);
    result.push(pluginId);
  }

  return result;
}

export function setVisiblePluginIds(pluginIds: string[]): string[] {
  const normalized = normalizeVisiblePluginIds(pluginIds);
  visiblePluginIdSet = new Set<string>(normalized);
  return normalized;
}

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
  return dedupeItems(
    getVisiblePlugins().flatMap((plugin) => plugin.createCatalogItems())
  );
}

export function getPluginQueryItems(query: string): LaunchItem[] {
  const normalized = query.trim();
  if (!normalized) {
    return [];
  }

  return dedupeItems(
    getVisiblePlugins().flatMap((plugin) => plugin.getQueryItems?.(normalized) ?? [])
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
