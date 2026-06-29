import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type TimestampAction = "open" | "toDate" | "toTimestamp";
type TimestampUnit = "s" | "ms";

interface TimestampCommand {
  action: TimestampAction;
  input: string;
  unit: TimestampUnit;
}

const PLUGIN_ID = "webtools-timestamp";
const ACTION_OPEN: TimestampAction = "open";
const QUERY_ALIASES = ["wt-time", "wt-ts", "timestamp", "时间戳", "日期转换"];

function buildTarget(
  action: TimestampAction,
  input = "",
  unit: TimestampUnit = "s"
): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("unit", unit);
  if (input) {
    params.set("input", input);
  }
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseCommand(optionsText: string | undefined): TimestampCommand {
  if (!optionsText) {
    return { action: ACTION_OPEN, input: "", unit: "s" };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim();
  const input = params.get("input") ?? "";
  const unitRaw = (params.get("unit") ?? "s").trim().toLowerCase();
  const unit: TimestampUnit = unitRaw === "ms" ? "ms" : "s";
  if (actionRaw === "toDate" || actionRaw === "toTimestamp") {
    return { action: actionRaw, input, unit };
  }
  return { action: ACTION_OPEN, input, unit };
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
    target: buildTarget(ACTION_OPEN, "", "s"),
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

function formatDateTime(date: Date): string {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  const base = `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  const ms = date.getMilliseconds();
  return ms > 0 ? `${base}.${String(ms).padStart(3, "0")}` : base;
}

function parseDateInput(input: string): Date | null {
  const normalized = input.trim();
  if (!normalized) {
    return null;
  }

  const fixed = normalized.replace("T", " ");
  const match = fixed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,3}))?)?)?$/
  );
  if (match) {
    const year = Number(match[1] ?? "");
    const month = Number(match[2] ?? "");
    const day = Number(match[3] ?? "");
    const hour = Number(match[4] ?? "0");
    const minute = Number(match[5] ?? "0");
    const second = Number(match[6] ?? "0");
    const millisecond = Number((match[7] ?? "").padEnd(3, "0") || "0");
    const date = new Date(year, month - 1, day, hour, minute, second, millisecond);
    if (
      date.getFullYear() === year &&
      date.getMonth() + 1 === month &&
      date.getDate() === day &&
      date.getHours() === hour &&
      date.getMinutes() === minute &&
      date.getSeconds() === second &&
      date.getMilliseconds() === millisecond
    ) {
      return date;
    }
    return null;
  }

  const fallback = new Date(normalized);
  if (Number.isNaN(fallback.getTime())) {
    return null;
  }
  return fallback;
}

function detectTimestampUnit(normalized: string, fallback: TimestampUnit): TimestampUnit {
  const digits = normalized.replace(/^[+-]/, "").split(".")[0]?.length ?? 0;
  if (digits >= 13) {
    return "ms";
  }
  if (digits >= 1 && digits <= 11) {
    return "s";
  }
  return fallback;
}

function toDateOutput(input: string, unit: TimestampUnit): ExecuteResult {
  const normalized = input.trim();
  if (!normalized) {
    return { ok: false, keepOpen: true, message: "请输入时间戳" };
  }

  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) {
    return { ok: false, keepOpen: true, message: "时间戳必须是数字" };
  }

  // A 10-digit value is seconds, a 13-digit value is milliseconds. Auto-detect by
  // digit count so a seconds timestamp is not misread as milliseconds (and vice versa).
  const effectiveUnit = detectTimestampUnit(normalized, unit);
  const millis = effectiveUnit === "s" ? Math.round(numeric * 1000) : Math.round(numeric);
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, keepOpen: true, message: "无效时间戳" };
  }

  const local = formatDateTime(date);
  const seconds = Math.floor(millis / 1000);
  const iso = date.toISOString().replace("T", " ").replace("Z", " UTC");
  const detectionNote =
    effectiveUnit === unit ? "" : `（已按${effectiveUnit === "s" ? "秒" : "毫秒"}识别）`;
  return {
    ok: true,
    keepOpen: true,
    message: "转换完成",
    data: {
      action: "toDate",
      output: local,
      date: local,
      iso,
      seconds,
      milliseconds: millis,
      unit: effectiveUnit,
      info: `Unix 时间戳：${seconds}（秒） / ${millis}（毫秒）${detectionNote}`
    }
  };
}

function toTimestampOutput(input: string, unit: TimestampUnit): ExecuteResult {
  const normalized = input.trim();
  if (!normalized) {
    return { ok: false, keepOpen: true, message: "请输入日期时间" };
  }

  const date = parseDateInput(normalized);
  if (!date || Number.isNaN(date.getTime())) {
    return { ok: false, keepOpen: true, message: "无法解析日期时间" };
  }

  const millis = date.getTime();
  const seconds = Math.floor(millis / 1000);
  const output = unit === "s" ? String(seconds) : String(millis);
  return {
    ok: true,
    keepOpen: true,
    message: "转换完成",
    data: {
      action: "toTimestamp",
      output,
      timestamp: output,
      date: formatDateTime(date),
      seconds,
      milliseconds: millis,
      unit,
      info: `秒：${seconds} / 毫秒：${millis}`
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
        data: { input: command.input, unit: command.unit }
      });
      return { ok: true, keepOpen: true, message: "已打开时间戳工具" };
    }

    if (command.action === "toDate") {
      return toDateOutput(command.input, command.unit);
    }

    return toTimestampOutput(command.input, command.unit);
  }
};
