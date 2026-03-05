import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type RegexAction = "open" | "test" | "replace";

interface RegexCommand {
  action: RegexAction;
  pattern: string;
  flags: string;
  input: string;
  replacement: string;
}

interface RegexMatchRow {
  index: number;
  match: string;
  groups: string[];
}

const PLUGIN_ID = "webtools-regex";
const ACTION_OPEN: RegexAction = "open";
const QUERY_ALIASES = ["wt-regex", "regex-tool", "regex", "正则", "正则测试"];
const SAFE_FLAGS = "gimsuyd";

function buildTarget(command: RegexCommand): string {
  const params = new URLSearchParams();
  params.set("action", command.action);
  params.set("pattern", command.pattern);
  params.set("flags", command.flags);
  params.set("input", command.input);
  if (command.action === "replace") {
    params.set("replacement", command.replacement);
  }
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseCommand(optionsText: string | undefined): RegexCommand {
  if (!optionsText) {
    return {
      action: ACTION_OPEN,
      pattern: "",
      flags: "g",
      input: "",
      replacement: ""
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim();
  const action = actionRaw === "test" || actionRaw === "replace" ? actionRaw : ACTION_OPEN;
  return {
    action,
    pattern: params.get("pattern") ?? "",
    flags: params.get("flags") ?? "g",
    input: params.get("input") ?? "",
    replacement: params.get("replacement") ?? ""
  };
}

function sanitizeFlags(flags: string): string {
  const normalized = flags
    .split("")
    .filter((flag, index, list) => list.indexOf(flag) === index)
    .filter((flag) => SAFE_FLAGS.includes(flag))
    .join("");

  return normalized || "g";
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
  const openCommand: RegexCommand = {
    action: ACTION_OPEN,
    pattern: "",
    flags: "g",
    input: "",
    replacement: ""
  };

  return {
    id: `plugin:${PLUGIN_ID}`,
    type: "command",
    title: "正则工具",
    subtitle: "匹配测试 / 文本替换",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(openCommand),
    keywords: [
      "plugin",
      "webtools",
      "regex",
      "regexp",
      "正则",
      "匹配",
      "替换"
    ]
  };
}

function executeRegexTest(command: RegexCommand): ExecuteResult {
  if (!command.pattern.trim()) {
    return { ok: false, keepOpen: true, message: "请输入正则表达式" };
  }

  const flags = sanitizeFlags(command.flags);
  try {
    const regex = new RegExp(command.pattern, flags);
    const rows: RegexMatchRow[] = [];
    const input = command.input ?? "";

    if (regex.global || regex.sticky) {
      let current: RegExpExecArray | null = regex.exec(input);
      while (current) {
        rows.push({
          index: current.index,
          match: current[0] ?? "",
          groups: current.slice(1).map((item) => item ?? "")
        });

        if ((current[0] ?? "") === "") {
          regex.lastIndex += 1;
        }

        current = regex.exec(input);
      }
    } else {
      const current = regex.exec(input);
      if (current) {
        rows.push({
          index: current.index,
          match: current[0] ?? "",
          groups: current.slice(1).map((item) => item ?? "")
        });
      }
    }

    return {
      ok: true,
      keepOpen: true,
      message: "匹配完成",
      data: {
        action: "test",
        flags,
        rows,
        info: `匹配数: ${rows.length}`
      }
    };
  } catch (error) {
    const reason =
      error instanceof Error && error.message ? error.message : "正则执行失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason
    };
  }
}

function executeRegexReplace(command: RegexCommand): ExecuteResult {
  if (!command.pattern.trim()) {
    return { ok: false, keepOpen: true, message: "请输入正则表达式" };
  }

  const flags = sanitizeFlags(command.flags);
  try {
    const regex = new RegExp(command.pattern, flags);
    const output = (command.input ?? "").replace(regex, command.replacement ?? "");
    return {
      ok: true,
      keepOpen: true,
      message: "替换完成",
      data: {
        action: "replace",
        output,
        flags,
        info: "已输出替换结果"
      }
    };
  } catch (error) {
    const reason =
      error instanceof Error && error.message ? error.message : "正则替换失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason
    };
  }
}

export const webtoolsRegexPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "正则工具",
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
        title: "正则工具",
        subtitle: "匹配测试 / 文本替换",
        data: {
          pattern: command.pattern,
          flags: command.flags,
          input: command.input,
          replacement: command.replacement
        }
      });
      return { ok: true, keepOpen: true, message: "已打开正则工具" };
    }

    if (command.action === "replace") {
      return executeRegexReplace(command);
    }

    return executeRegexTest(command);
  }
};
