import { IPC_CHANNELS } from "../../../shared/channels";
import { DICTIONARY_PLUGIN_ID } from "../../../shared/dictionary";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

const PLUGIN_ID = DICTIONARY_PLUGIN_ID;
const ACTION_OPEN = "open";
const TITLE = "离线词典";
const SUBTITLE = "ECDICT 英汉词典，支持单词与词组离线查询";
const QUERY_ALIASES = [
  "dictionary",
  "dict",
  "ecdict",
  "词典",
  "字典",
  "离线词典",
  "英汉词典"
];

function buildTarget(action: string = ACTION_OPEN, word?: string): string {
  const params = new URLSearchParams();
  params.set("action", action);
  if (word?.trim()) {
    params.set("word", word.trim());
  }
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
    keywords: ["plugin", "dictionary", "dict", "ecdict", "词典", "字典", "离线"]
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

export const dictionaryPlugin: LauncherPlugin = {
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

    const word = (params.get("word") ?? "").trim();
    context.window.webContents.send(IPC_CHANNELS.openPanel, {
      panel: "plugin",
      pluginId: PLUGIN_ID,
      title: TITLE,
      subtitle: SUBTITLE,
      data: {
        query: word,
        statusMessage: word
          ? `正在查询「${word}」`
          : "输入英文单词或词组后查询，支持连字符词组。"
      }
    });

    return {
      ok: true,
      keepOpen: true,
      message: word ? `已打开离线词典：${word}` : "已打开离线词典"
    };
  }
};
