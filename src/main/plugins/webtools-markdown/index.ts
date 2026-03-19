import { marked } from "marked";

import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type MarkdownAction = "open" | "render";

interface MarkdownCommand {
  action: MarkdownAction;
  input: string;
}

const PLUGIN_ID = "webtools-markdown";
const ACTION_OPEN: MarkdownAction = "open";
const QUERY_ALIASES = ["wt-md", "wt-markdown", "markdown", "md", "预览"];
const DEFAULT_MD =
  "# Markdown 预览\n\n" +
  "在这里输入 Markdown 内容。\n\n" +
  "## 功能\n\n" +
  "- 实时预览\n" +
  "- HTML 导出\n" +
  "- 代码块与表格支持\n\n" +
  "```ts\n" +
  "console.log('LiteLauncher');\n" +
  "```\n";

marked.setOptions({
  gfm: true,
  breaks: true
});

function buildTarget(action: MarkdownAction, input = ""): string {
  const params = new URLSearchParams();
  params.set("action", action);
  if (input) {
    params.set("input", input);
  }
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseCommand(optionsText: string | undefined): MarkdownCommand {
  if (!optionsText) {
    return { action: ACTION_OPEN, input: DEFAULT_MD };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();

  return {
    action: actionRaw === "render" ? "render" : ACTION_OPEN,
    input: params.get("input") ?? DEFAULT_MD
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

function createCatalogItem(): LaunchItem {
  return {
    id: `plugin:${PLUGIN_ID}`,
    type: "command",
    title: "Markdown 预览",
    subtitle: "Markdown 转 HTML 实时预览",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(ACTION_OPEN, DEFAULT_MD),
    keywords: ["plugin", "webtools", "markdown", "md", "预览", "html"]
  };
}

function executeRender(command: MarkdownCommand): ExecuteResult {
  try {
    const markdown = command.input;
    if (!markdown.trim()) {
      return {
        ok: true,
        keepOpen: true,
        message: "等待输入 Markdown",
        data: {
          markdown,
          html: "",
          info: "等待输入 Markdown"
        }
      };
    }

    const html = marked.parse(markdown) as string;

    return {
      ok: true,
      keepOpen: true,
      message: "Markdown 渲染完成",
      data: {
        markdown,
        html,
        info: `Markdown ${markdown.length} 字符 · HTML ${html.length} 字符`
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Markdown 渲染失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: {
        markdown: command.input,
        html: "",
        info: reason
      }
    };
  }
}

export const webtoolsMarkdownPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "Markdown 预览",
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
        title: "Markdown 预览",
        subtitle: "Markdown 转 HTML 实时预览",
        data: {
          input: command.input || DEFAULT_MD
        }
      });
      return {
        ok: true,
        keepOpen: true,
        message: "已打开 Markdown 预览"
      };
    }

    return executeRender(command);
  }
};
