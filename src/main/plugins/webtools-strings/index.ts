import { randomUUID } from "node:crypto";

import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type StringsAction = "open" | "convert" | "uuid";
type CaseType = "camel" | "snake" | "pascal" | "kebab" | "upper" | "lower";

interface StringsCommand {
  action: StringsAction;
  input: string;
  caseType: CaseType;
  count: number;
}

const PLUGIN_ID = "webtools-strings";
const ACTION_OPEN: StringsAction = "open";
const QUERY_ALIASES = ["wt-strings", "string-tool", "字符串", "uuid", "大小写"];
const UUID_COUNT_MIN = 1;
const UUID_COUNT_MAX = 100;

function buildTarget(command: StringsCommand): string {
  const params = new URLSearchParams();
  params.set("action", command.action);
  params.set("input", command.input);
  params.set("caseType", command.caseType);
  params.set("count", String(command.count));
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseCaseType(value: string | null): CaseType {
  const normalized = (value ?? "camel").trim().toLowerCase();
  if (
    normalized === "camel" ||
    normalized === "snake" ||
    normalized === "pascal" ||
    normalized === "kebab" ||
    normalized === "upper" ||
    normalized === "lower"
  ) {
    return normalized;
  }
  return "camel";
}

function clampCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 5;
  }

  const rounded = Math.round(value);
  if (rounded < UUID_COUNT_MIN) {
    return UUID_COUNT_MIN;
  }
  if (rounded > UUID_COUNT_MAX) {
    return UUID_COUNT_MAX;
  }
  return rounded;
}

function parseCommand(optionsText: string | undefined): StringsCommand {
  if (!optionsText) {
    return {
      action: ACTION_OPEN,
      input: "hello_world_variable",
      caseType: "camel",
      count: 5
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();
  const action: StringsAction =
    actionRaw === "convert" || actionRaw === "uuid" ? actionRaw : ACTION_OPEN;

  return {
    action,
    input: params.get("input") ?? "",
    caseType: parseCaseType(params.get("caseType")),
    count: clampCount(Number(params.get("count") ?? "5"))
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
    title: "字符串工具",
    subtitle: "大小写转换与 UUID 批量生成",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget({
      action: ACTION_OPEN,
      input: "hello_world_variable",
      caseType: "camel",
      count: 5
    }),
    keywords: ["plugin", "webtools", "string", "uuid", "字符串", "转换"]
  };
}

function splitWords(text: string): string[] {
  return text
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/[_\-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((item) => item.toLowerCase());
}

function convertCase(text: string, caseType: CaseType): string {
  if (!text.trim()) {
    return "";
  }

  const words = splitWords(text);
  if (words.length === 0) {
    return "";
  }

  if (caseType === "camel") {
    return words
      .map((word, index) =>
        index === 0 ? word : `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`
      )
      .join("");
  }

  if (caseType === "pascal") {
    return words
      .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`)
      .join("");
  }

  if (caseType === "snake") {
    return words.join("_");
  }

  if (caseType === "kebab") {
    return words.join("-");
  }

  if (caseType === "upper") {
    return text.toUpperCase();
  }

  return text.toLowerCase();
}

function executeConvert(command: StringsCommand): ExecuteResult {
  const output = convertCase(command.input, command.caseType);
  return {
    ok: true,
    keepOpen: true,
    message: "转换完成",
    data: {
      action: "convert",
      input: command.input,
      caseType: command.caseType,
      output
    }
  };
}

function executeUuid(command: StringsCommand): ExecuteResult {
  const count = clampCount(command.count);
  const items: string[] = [];
  for (let i = 0; i < count; i += 1) {
    items.push(randomUUID());
  }

  return {
    ok: true,
    keepOpen: true,
    message: `已生成 ${items.length} 个 UUID`,
    data: {
      action: "uuid",
      count,
      items,
      output: items.join("\n")
    }
  };
}

export const webtoolsStringsPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "字符串工具",
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
        title: "字符串工具",
        subtitle: "大小写转换与 UUID 批量生成",
        data: {
          input: command.input,
          caseType: command.caseType,
          count: command.count
        }
      });

      return {
        ok: true,
        keepOpen: true,
        message: "已打开字符串工具"
      };
    }

    if (command.action === "uuid") {
      return executeUuid(command);
    }

    return executeConvert(command);
  }
};
