import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { LauncherPlugin } from "../types";

export interface WebToolPluginMeta {
  id: string;
  title: string;
  subtitle: string;
  aliases: string[];
  keywords: string[];
}

const ACTION_OPEN = "open";
const DEFAULT_ICON_COLOR = "#6c5ce7";

const ICON_COLOR_BY_PLUGIN_ID: Record<string, string> = {
  "webtools-password": "#6c5ce7",
  "webtools-cron": "#00b894",
  "webtools-json": "#3498db",
  "webtools-crypto": "#00cec9",
  "webtools-jwt": "#a29bfe",
  "webtools-timestamp": "#ff9f43",
  "webtools-regex": "#ef5777",
  "webtools-strings": "#3c40c6",
  "webtools-colors": "#485460",
  "webtools-diff": "#ff9f43",
  "webtools-image-base64": "#0fbcf9",
  "webtools-config-convert": "#05c46b",
  "webtools-sql-format": "#ffc048",
  "webtools-unit-convert": "#ef5777",
  "webtools-url-parse": "#3c40c6",
  "webtools-qrcode": "#485460",
  "webtools-markdown": "#333333",
  "webtools-ua": "#ff7675",
  "webtools-api-client": "#6c5ce7",
  "webtools-file-hash": "#1e90ff",
  "webtools-port-helper": "#10b981"
};

const ICON_DATA_URL_CACHE = new Map<string, string>();

function buildTarget(pluginId: string): string {
  const params = new URLSearchParams();
  params.set("action", ACTION_OPEN);
  return `command:plugin:${pluginId}?${params.toString()}`;
}

function getIconSymbolSvg(pluginId: string): string {
  switch (pluginId) {
    case "webtools-password":
      return '<circle cx="8" cy="12" r="3" fill="none" stroke="#fff" stroke-width="2"/><path d="M11 12h8m-2 0v-2m-2 2v2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>';
    case "webtools-cron":
      return '<circle cx="12" cy="12" r="7" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 8v4l3 2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    case "webtools-json":
      return '<path d="M8 7H7a2 2 0 0 0-2 2v1a2 2 0 0 1-1 2 2 2 0 0 1 1 2v1a2 2 0 0 0 2 2h1M16 7h1a2 2 0 0 1 2 2v1a2 2 0 0 0 1 2 2 2 0 0 0-1 2v1a2 2 0 0 1-2 2h-1" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>';
    case "webtools-crypto":
      return '<rect x="6" y="10" width="12" height="9" rx="2" fill="none" stroke="#fff" stroke-width="2"/><path d="M9 10V8a3 3 0 0 1 6 0v2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>';
    case "webtools-jwt":
      return '<path d="M12 4l6 2v5c0 4-2.5 6.5-6 8-3.5-1.5-6-4-6-8V6z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M9.5 12.5l1.8 1.8 3.2-3.2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    case "webtools-timestamp":
      return '<rect x="4" y="6" width="16" height="14" rx="2" fill="none" stroke="#fff" stroke-width="2"/><path d="M8 4v4M16 4v4M4 10h16" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>';
    case "webtools-regex":
      return '<circle cx="9" cy="9" r="4" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 12l6 6M9 7v4M7 9h4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>';
    case "webtools-strings":
      return '<path d="M5 7h14M8 7v10M16 7v10M5 17h14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>';
    case "webtools-colors":
      return '<path d="M12 4a8 8 0 1 0 0 16h1.5a2.5 2.5 0 0 0 0-5H12a3 3 0 1 1 0-6h3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>';
    case "webtools-diff":
      return '<path d="M6 7h12M6 12h8M6 17h12M16 10l2 2-2 2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    case "webtools-image-base64":
      return '<rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="9" cy="10" r="1.5" fill="#fff"/><path d="M6 16l4-4 3 3 2-2 3 3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    case "webtools-config-convert":
      return '<path d="M7 7h10M7 12h10M7 17h10M10 5v4M14 10v4M8 15v4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>';
    case "webtools-sql-format":
      return '<ellipse cx="12" cy="7" rx="6" ry="2.5" fill="none" stroke="#fff" stroke-width="2"/><path d="M6 7v8c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V7M6 11c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" fill="none" stroke="#fff" stroke-width="2"/>';
    case "webtools-unit-convert":
      return '<path d="M5 7h14v10H5zM8 7v3M11 7v2M14 7v3M17 7v2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>';
    case "webtools-url-parse":
      return '<path d="M10 8L7 11a3 3 0 0 0 4 4l3-3M14 16l3-3a3 3 0 0 0-4-4l-3 3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>';
    case "webtools-qrcode":
      return '<rect x="5" y="5" width="5" height="5" fill="none" stroke="#fff" stroke-width="2"/><rect x="14" y="5" width="5" height="5" fill="none" stroke="#fff" stroke-width="2"/><rect x="5" y="14" width="5" height="5" fill="none" stroke="#fff" stroke-width="2"/><rect x="15" y="15" width="4" height="4" fill="#fff"/>';
    case "webtools-markdown":
      return '<path d="M5 7h14v10H5zM8 15V9l2 3 2-3v6M14 9l3 3-3 3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    case "webtools-ua":
      return '<rect x="4" y="6" width="12" height="8" rx="1.5" fill="none" stroke="#fff" stroke-width="2"/><path d="M8 18h4M10 14v4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/><rect x="17" y="9" width="3" height="6" rx="1" fill="none" stroke="#fff" stroke-width="2"/>';
    case "webtools-api-client":
      return '<path d="M7 8l-3 4 3 4M17 8l3 4-3 4M10 18l4-12" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    case "webtools-file-hash":
      return '<path d="M5 9V6a2 2 0 0 1 2-2h10v14a2 2 0 0 1-2 2H9l-4-4V9z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M9 20v-4H5M8 8h6M8 12h4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>';
    case "webtools-port-helper":
      return '<path d="M7 7h10M7 12h10M7 17h4M15 17h2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="18.5" cy="17" r="2.5" fill="none" stroke="#fff" stroke-width="2"/>';
    default:
      return '<path d="M22 12h-4l-3 9L9 3l-3 9H2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  }
}

function toIconSvgDataUrl(pluginId: string, color: string): string {
  const normalizedColor = color.trim() || DEFAULT_ICON_COLOR;
  const cacheKey = `${pluginId}:${normalizedColor}`;
  const cached = ICON_DATA_URL_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }

  const symbol = getIconSymbolSvg(pluginId);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="${normalizedColor}"/>${symbol}</svg>`;
  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  ICON_DATA_URL_CACHE.set(cacheKey, dataUrl);
  return dataUrl;
}

export function getWebtoolsIconDataUrl(pluginId: string): string {
  return toIconSvgDataUrl(
    pluginId,
    ICON_COLOR_BY_PLUGIN_ID[pluginId] ?? DEFAULT_ICON_COLOR
  );
}

function parseAction(optionsText: string | undefined): string {
  if (!optionsText) {
    return ACTION_OPEN;
  }

  const params = new URLSearchParams(optionsText);
  return (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();
}

function matchesAlias(query: string, aliases: readonly string[]): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  for (const alias of aliases) {
    const nextAlias = alias.trim().toLowerCase();
    if (!nextAlias) {
      continue;
    }

    if (normalized === nextAlias || normalized.startsWith(`${nextAlias} `)) {
      return true;
    }
  }

  return false;
}

function createCatalogItem(meta: WebToolPluginMeta): LaunchItem {
  return {
    id: `plugin:${meta.id}`,
    type: "command",
    title: meta.title,
    subtitle: meta.subtitle,
    iconPath: getWebtoolsIconDataUrl(meta.id),
    target: buildTarget(meta.id),
    keywords: ["plugin", "webtools", ...meta.keywords]
  };
}

export function createWebToolPlugin(meta: WebToolPluginMeta): LauncherPlugin {
  return {
    id: meta.id,
    name: meta.title,
    createCatalogItems() {
      return [createCatalogItem(meta)];
    },
    getQueryItems(query) {
      if (!matchesAlias(query, meta.aliases)) {
        return [];
      }
      return [createCatalogItem(meta)];
    },
    execute(optionsText, context): ExecuteResult {
      const action = parseAction(optionsText);
      if (action !== ACTION_OPEN) {
        return {
          ok: false,
          keepOpen: true,
          message: `不支持的动作: ${action}`
        };
      }

      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: meta.id,
        title: meta.title,
        subtitle: meta.subtitle,
        message:
          "该插件正在按 LiteLauncher 规范实现完整功能，当前为统一面板入口。"
      });

      return {
        ok: true,
        keepOpen: true,
        message: `已打开${meta.title}`
      };
    }
  };
}
