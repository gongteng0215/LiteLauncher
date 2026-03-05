import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type TimestampAction = "open" | "toDate" | "toTimestamp";

interface TimestampCommand {
  action: TimestampAction;
  input: string;
}

const PLUGIN_ID = "webtools-timestamp";
const ACTION_OPEN: TimestampAction = "open";
const QUERY_ALIASES = ["wt-time", "wt-ts", "timestamp", "时间戳", "日期转换"];

function buildTarget(action: TimestampAction, input = ""): string {
  const params = new URLSearchParams();
  params.set("action", action);
  if (input) {
    params.set("input", input);
  }
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseCommand(optionsText: string | undefined): TimestampCommand {
  if (!optionsText) {
    return { action: ACTION_OPEN, input: "" };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim();
  const input = params.get("input") ?? "";
  if (actionRaw === "toDate" || actionRaw === "toTimestamp") {
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
    title: "时间戳工具",
    subtitle: "时间戳与日期互转",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(ACTION_OPEN),
    keywords: [
      "plugin",
      "webtools",
      "timestamp",
      "time",
      "date",
      "时间戳",
      "日期",
      "转换"
    ]
  };
}

function toDateOutput(input: string): ExecuteResult {
  const normalized = input.trim();
  if (!normalized) {
    return { ok: false, keepOpen: true, message: "请输入时间戳" };
  }

  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) {
    return { ok: false, keepOpen: true, message: "时间戳必须是数字" };
  }

  const millis = normalized.length <= 10 ? Math.round(numeric * 1000) : Math.round(numeric);
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, keepOpen: true, message: "无效时间戳" };
  }

  const iso = date.toISOString();
  const local = date.toLocaleString("zh-CN", { hour12: false });
  return {
    ok: true,
    keepOpen: true,
    message: "转换完成",
    data: {
      action: "toDate",
      output: `${local}\n${iso}`,
      info: `毫秒时间戳: ${millis}`
    }
  };
}

function toTimestampOutput(input: string): ExecuteResult {
  const normalized = input.trim();
  if (!normalized) {
    return { ok: false, keepOpen: true, message: "请输入日期时间" };
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, keepOpen: true, message: "无法解析日期时间" };
  }

  const millis = date.getTime();
  const seconds = Math.floor(millis / 1000);
  return {
    ok: true,
    keepOpen: true,
    message: "转换完成",
    data: {
      action: "toTimestamp",
      output: `${seconds}\n${millis}`,
      info: "第一行秒级，第二行毫秒级"
    }
  };
}

export const webtoolsTimestampPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "时间戳工具",
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
        title: "时间戳工具",
        subtitle: "时间戳与日期互转",
        data: { input: command.input }
      });
      return { ok: true, keepOpen: true, message: "已打开时间戳工具" };
    }

    if (command.action === "toDate") {
      return toDateOutput(command.input);
    }

    return toTimestampOutput(command.input);
  }
};
