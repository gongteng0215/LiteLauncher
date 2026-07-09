import { IPC_CHANNELS } from "../../../shared/channels";
import {
  createDefaultTranslateSettings,
  TRANSLATE_TOOL_PLUGIN_ID
} from "../../../shared/translate";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

const PLUGIN_ID = TRANSLATE_TOOL_PLUGIN_ID;
const ACTION_OPEN = "open";
const TITLE = "文本翻译";
const SUBTITLE = "粘贴文字在线翻译为中文（百度翻译）";
const QUERY_ALIASES = [
  "wt-translate",
  "translate",
  "fanyi",
  "翻译",
  "文本翻译",
  "百度翻译"
];

function buildTarget(action: string = ACTION_OPEN): string {
  const params = new URLSearchParams();
  params.set("action", action);
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function createCatalogItem(): LaunchItem {
  return {
    id: `plugin:${PLUGIN_ID}`,
    type: "command",
    title: TITLE,
    subtitle: SUBTITLE,
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(),
    keywords: ["plugin", "webtools", "translate", "fanyi", "翻译", "百度翻译"]
  };
}

function matchesAlias(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return QUERY_ALIASES.some((alias) => {
    const value = alias.trim().toLowerCase();
    return value ? normalized === value || normalized.startsWith(`${value} `) : false;
  });
}

export const webtoolsTranslatePlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: TITLE,
  createCatalogItems() {
    return [createCatalogItem()];
  },
  getQueryItems(query) {
    if (!matchesAlias(query)) {
      return [];
    }
    return [createCatalogItem()];
  },
  execute(optionsText, context): ExecuteResult {
    const params = new URLSearchParams(optionsText ?? "");
    const action = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();
    if (action !== ACTION_OPEN) {
      return {
        ok: false,
        keepOpen: true,
        message: `不支持的动作: ${action}`
      };
    }

    context.window.webContents.send(IPC_CHANNELS.openPanel, {
      panel: "plugin",
      pluginId: PLUGIN_ID,
      title: TITLE,
      subtitle: SUBTITLE,
      data: {
        settings: createDefaultTranslateSettings(),
        statusMessage: "粘贴或输入要翻译的文字，英译中为默认方向。"
      }
    });

    return {
      ok: true,
      keepOpen: true,
      message: "已打开文本翻译"
    };
  }
};
