import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type UrlAction = "open" | "parse" | "encode" | "decode";

interface UrlCommand {
  action: UrlAction;
  input: string;
}

const PLUGIN_ID = "webtools-url-parse";
const ACTION_OPEN: UrlAction = "open";
const QUERY_ALIASES = ["wt-url", "url-tool", "url", "url解析", "链接解析"];

function buildTarget(action: UrlAction, input = ""): string {
  const params = new URLSearchParams();
  params.set("action", action);
  if (input) {
    params.set("input", input);
  }
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseCommand(optionsText: string | undefined): UrlCommand {
  if (!optionsText) {
    return { action: ACTION_OPEN, input: "" };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim();
  const input = params.get("input") ?? "";

  if (actionRaw === "parse" || actionRaw === "encode" || actionRaw === "decode") {
    return { action: actionRaw, input };
  }

  return { action: ACTION_OPEN, input };
}

function matchesAlias(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  for (const alias of QUERY_ALIASES) {
    const value = alias.trim().toLowerCase();
    if (!value) {
      continue;
    }
    if (normalized === value || normalized.startsWith(`${value} `)) {
      return true;
    }
  }

  return false;
}

function createCatalogItem(): LaunchItem {
  return {
    id: `plugin:${PLUGIN_ID}`,
    type: "command",
    title: "URL 解析",
    subtitle: "URL 拆解 / 编码 / 解码",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(ACTION_OPEN),
    keywords: [
      "plugin",
      "webtools",
      "url",
      "query",
      "参数",
      "解析",
      "encode",
      "decode"
    ]
  };
}

function safeParseUrl(input: string): URL {
  try {
    return new URL(input);
  } catch {
    return new URL(`https://${input}`);
  }
}

function executeUrlAction(command: UrlCommand): ExecuteResult {
  const input = command.input.trim();
  if (command.action !== ACTION_OPEN && !input) {
    return {
      ok: false,
      keepOpen: true,
      message: "请输入 URL 或文本"
    };
  }

  try {
    if (command.action === "encode") {
      const output = encodeURIComponent(command.input);
      return {
        ok: true,
        keepOpen: true,
        message: "编码完成",
        data: {
          action: command.action,
          output,
          info: `长度: ${output.length}`
        }
      };
    }

    if (command.action === "decode") {
      const output = decodeURIComponent(command.input);
      return {
        ok: true,
        keepOpen: true,
        message: "解码完成",
        data: {
          action: command.action,
          output,
          info: `长度: ${output.length}`
        }
      };
    }

    if (command.action === "parse") {
      const parsed = safeParseUrl(command.input);
      const queryRows = Array.from(parsed.searchParams.entries()).map(
        ([key, value]) => ({ key, value })
      );
      const output = [
        `href: ${parsed.href}`,
        `protocol: ${parsed.protocol}`,
        `origin: ${parsed.origin}`,
        `host: ${parsed.host}`,
        `hostname: ${parsed.hostname}`,
        `port: ${parsed.port || "(默认)"}`,
        `pathname: ${parsed.pathname}`,
        `search: ${parsed.search || "(空)"}`,
        `hash: ${parsed.hash || "(空)"}`
      ].join("\n");

      return {
        ok: true,
        keepOpen: true,
        message: "解析完成",
        data: {
          action: command.action,
          output,
          queryRows,
          info: `参数数量: ${queryRows.length}`
        }
      };
    }
  } catch (error) {
    const reason =
      error instanceof Error && error.message ? error.message : "处理失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason
    };
  }

  return {
    ok: false,
    keepOpen: true,
    message: `不支持的动作: ${command.action}`
  };
}

export const webtoolsUrlParsePlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "URL 解析",
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
    const command = parseCommand(optionsText);
    if (command.action === ACTION_OPEN) {
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: PLUGIN_ID,
        title: "URL 解析",
        subtitle: "URL 拆解 / 编码 / 解码",
        data: {
          input: command.input
        }
      });
      return {
        ok: true,
        keepOpen: true,
        message: "已打开 URL 解析"
      };
    }

    return executeUrlAction(command);
  }
};
