import DiffMatchPatch from "diff-match-patch";

import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type DiffAction = "open" | "compare";

interface DiffCommand {
  action: DiffAction;
  left: string;
  right: string;
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
}

const PLUGIN_ID = "webtools-diff";
const ACTION_OPEN: DiffAction = "open";
const QUERY_ALIASES = ["wt-diff", "diff-tool", "diff", "文本对比", "差异比较"];
const DEFAULT_LEFT =
  "Hello World\nThis is a test of the diff utility.\nSome lines stay the same.";
const DEFAULT_RIGHT =
  "Hello Everyone\nThis is a test of the diff engine.\nSome lines stay the same.\nAdded a new line here!";
const dmp = new DiffMatchPatch();

function buildTarget(command: DiffCommand): string {
  const params = new URLSearchParams();
  params.set("action", command.action);
  if (command.left) {
    params.set("left", command.left);
  }
  if (command.right) {
    params.set("right", command.right);
  }
  params.set("ignoreCase", command.ignoreCase ? "1" : "0");
  params.set("ignoreWhitespace", command.ignoreWhitespace ? "1" : "0");
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseBoolean(value: string | null, fallback = false): boolean {
  if (value === "1" || value === "true") {
    return true;
  }
  if (value === "0" || value === "false") {
    return false;
  }
  return fallback;
}

function parseCommand(optionsText: string | undefined): DiffCommand {
  if (!optionsText) {
    return {
      action: ACTION_OPEN,
      left: DEFAULT_LEFT,
      right: DEFAULT_RIGHT,
      ignoreCase: false,
      ignoreWhitespace: false
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim();

  return {
    action: actionRaw === "compare" ? "compare" : ACTION_OPEN,
    left: params.get("left") ?? DEFAULT_LEFT,
    right: params.get("right") ?? DEFAULT_RIGHT,
    ignoreCase: parseBoolean(params.get("ignoreCase"), false),
    ignoreWhitespace: parseBoolean(params.get("ignoreWhitespace"), false)
  };
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
  const command: DiffCommand = {
    action: ACTION_OPEN,
    left: DEFAULT_LEFT,
    right: DEFAULT_RIGHT,
    ignoreCase: false,
    ignoreWhitespace: false
  };

  return {
    id: `plugin:${PLUGIN_ID}`,
    type: "command",
    title: "文本对比",
    subtitle: "可视化查看两段文本的差异",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(command),
    keywords: ["plugin", "webtools", "diff", "compare", "文本", "对比", "差异"]
  };
}

function normalizeLine(
  value: string,
  options: Pick<DiffCommand, "ignoreCase" | "ignoreWhitespace">
): string {
  let output = value;
  if (options.ignoreWhitespace) {
    output = output.replace(/\s+/g, "");
  }
  if (options.ignoreCase) {
    output = output.toLowerCase();
  }
  return output;
}

function buildComparableText(
  value: string,
  options: Pick<DiffCommand, "ignoreCase" | "ignoreWhitespace">
): string {
  return value
    .split(/\r?\n/)
    .map((line) => normalizeLine(line, options))
    .join("\n");
}

function executeCompare(command: DiffCommand): ExecuteResult {
  try {
    const left = command.left ?? "";
    const right = command.right ?? "";

    const leftComparable = buildComparableText(left, command);
    const rightComparable = buildComparableText(right, command);
    const diffs = dmp.diff_main(leftComparable, rightComparable);
    dmp.diff_cleanupSemantic(diffs);

    let equalCount = 0;
    let insertCount = 0;
    let deleteCount = 0;
    let changedCount = 0;
    const rawIdentical = left === right;
    const identical = leftComparable === rightComparable;
    const leftLines = left === "" ? 0 : left.split(/\r?\n/).length;
    const rightLines = right === "" ? 0 : right.split(/\r?\n/).length;

    for (const [operation, text] of diffs) {
      if (!text) {
        continue;
      }
      if (operation === DiffMatchPatch.DIFF_EQUAL) {
        equalCount += 1;
        continue;
      }
      if (operation === DiffMatchPatch.DIFF_INSERT) {
        insertCount += 1;
        changedCount += 1;
        continue;
      }
      if (operation === DiffMatchPatch.DIFF_DELETE) {
        deleteCount += 1;
        changedCount += 1;
      }
    }

    const prettyHtml = identical
      ? dmp.diff_prettyHtml([[DiffMatchPatch.DIFF_EQUAL, left]])
      : dmp.diff_prettyHtml(diffs);

    return {
      ok: true,
      keepOpen: true,
      message:
        identical && !rawIdentical && (command.ignoreCase || command.ignoreWhitespace)
          ? "按当前忽略规则，两侧文本一致"
          : identical
            ? "两侧文本一致"
            : "文本对比完成",
      data: {
        action: "compare",
        prettyHtml,
        left,
        right,
        summary: {
          same: equalCount,
          added: insertCount,
          removed: deleteCount,
          changed: changedCount,
          total: Math.max(leftComparable.length, rightComparable.length),
          shown: equalCount + insertCount + deleteCount,
          levenshtein: dmp.diff_levenshtein(diffs),
          identical,
          rawIdentical,
          leftLength: left.length,
          rightLength: right.length,
          leftLines,
          rightLines
        }
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "文本对比失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: {
        action: "compare",
        prettyHtml: "",
        left: command.left,
        right: command.right
      }
    };
  }
}

export const webtoolsDiffPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "文本对比",
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
        title: "文本对比",
        subtitle: "可视化查看两段文本的差异",
        data: {
          left: command.left,
          right: command.right,
          ignoreCase: command.ignoreCase,
          ignoreWhitespace: command.ignoreWhitespace
        }
      });
      return {
        ok: true,
        keepOpen: true,
        message: "已打开文本对比"
      };
    }

    return executeCompare(command);
  }
};
