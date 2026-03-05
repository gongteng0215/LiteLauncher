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

type DiffRowType = "same" | "added" | "removed" | "changed";

interface DiffRow {
  index: number;
  type: DiffRowType;
  left: string;
  right: string;
}

const PLUGIN_ID = "webtools-diff";
const ACTION_OPEN: DiffAction = "open";
const ROW_LIMIT = 400;
const QUERY_ALIASES = ["wt-diff", "diff-tool", "diff", "文本对比", "差异比较"];

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
      left: "",
      right: "",
      ignoreCase: false,
      ignoreWhitespace: false
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim();

  return {
    action: actionRaw === "compare" ? "compare" : ACTION_OPEN,
    left: params.get("left") ?? "",
    right: params.get("right") ?? "",
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
    left: "",
    right: "",
    ignoreCase: false,
    ignoreWhitespace: false
  };

  return {
    id: `plugin:${PLUGIN_ID}`,
    type: "command",
    title: "文本对比",
    subtitle: "逐行差异比较",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(command),
    keywords: [
      "plugin",
      "webtools",
      "diff",
      "compare",
      "文本",
      "对比",
      "差异"
    ]
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

function executeCompare(command: DiffCommand): ExecuteResult {
  const leftLines = command.left.split(/\r?\n/);
  const rightLines = command.right.split(/\r?\n/);
  const maxLines = Math.max(leftLines.length, rightLines.length);

  const rows: DiffRow[] = [];
  let same = 0;
  let added = 0;
  let removed = 0;
  let changed = 0;

  for (let index = 0; index < maxLines; index += 1) {
    const left = leftLines[index] ?? "";
    const right = rightLines[index] ?? "";

    if (index >= ROW_LIMIT) {
      break;
    }

    let type: DiffRowType = "same";
    if (index >= leftLines.length) {
      type = "added";
      added += 1;
    } else if (index >= rightLines.length) {
      type = "removed";
      removed += 1;
    } else if (
      normalizeLine(left, command) === normalizeLine(right, command)
    ) {
      type = "same";
      same += 1;
    } else {
      type = "changed";
      changed += 1;
    }

    rows.push({
      index: index + 1,
      type,
      left,
      right
    });
  }

  const truncated = maxLines > ROW_LIMIT;
  return {
    ok: true,
    keepOpen: true,
    message: "对比完成",
    data: {
      action: "compare",
      rows,
      summary: {
        same,
        added,
        removed,
        changed,
        total: maxLines,
        shown: rows.length
      },
      truncated
    }
  };
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
        subtitle: "逐行差异比较",
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
