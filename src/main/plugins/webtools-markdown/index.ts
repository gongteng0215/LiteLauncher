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
const DEFAULT_MD = "# Markdown 预览\n\n在这里输入 Markdown 内容。";

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
    input: params.get("input") ?? ""
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
    subtitle: "Markdown 转 HTML 预览",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(ACTION_OPEN, DEFAULT_MD),
    keywords: ["plugin", "webtools", "markdown", "md", "预览", "html"]
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineMarkdown(input: string): string {
  return input
    .replace(/`([^`]+)`/g, (_all, code) => `<code>${escapeHtml(code)}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function markdownToHtml(input: string): string {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const output: string[] = [];
  let inCodeBlock = false;
  let inList = false;

  const closeList = (): void => {
    if (inList) {
      output.push("</ul>");
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim().startsWith("```")) {
      closeList();
      if (inCodeBlock) {
        output.push("</code></pre>");
      } else {
        output.push("<pre><code>");
      }
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      output.push(escapeHtml(line));
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = heading[1]?.length ?? 1;
      const text = inlineMarkdown(escapeHtml(heading[2] ?? ""));
      output.push(`<h${level}>${text}</h${level}>`);
      continue;
    }

    const list = line.match(/^[-*+]\s+(.*)$/);
    if (list) {
      if (!inList) {
        output.push("<ul>");
        inList = true;
      }
      const text = inlineMarkdown(escapeHtml(list[1] ?? ""));
      output.push(`<li>${text}</li>`);
      continue;
    }

    if (!line.trim()) {
      closeList();
      output.push("<br />");
      continue;
    }

    closeList();
    output.push(`<p>${inlineMarkdown(escapeHtml(line.trim()))}</p>`);
  }

  closeList();

  if (inCodeBlock) {
    output.push("</code></pre>");
  }

  return output.join("\n");
}

function executeRender(command: MarkdownCommand): ExecuteResult {
  try {
    const markdown = command.input || "";
    const html = markdownToHtml(markdown);

    return {
      ok: true,
      keepOpen: true,
      message: "Markdown 渲染完成",
      data: {
        markdown,
        html,
        info: `长度: ${markdown.length}`
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "渲染失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: {
        markdown: command.input,
        html: ""
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
        subtitle: "Markdown 转 HTML 预览",
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
