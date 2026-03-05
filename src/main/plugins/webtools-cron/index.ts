import { randomInt } from "node:crypto";

import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type CronAction = "open" | "parse" | "random";

interface CronCommand {
  action: CronAction;
  expression: string;
}

interface CronParseResult {
  expression: string;
  readable: string;
  nextRun: string;
  upcoming: string[];
}

const PLUGIN_ID = "webtools-cron";
const ACTION_OPEN: CronAction = "open";
const QUERY_ALIASES = ["wt-cron", "cron-tool", "cron", "定时", "表达式"];
const DEFAULT_EXPRESSION = "5 4 * * *";
const MAX_SEARCH_MINUTES = 366 * 24 * 60;

function buildTarget(action: CronAction, expression = ""): string {
  const params = new URLSearchParams();
  params.set("action", action);
  if (expression.trim()) {
    params.set("expression", expression);
  }
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseCommand(optionsText: string | undefined): CronCommand {
  if (!optionsText) {
    return { action: ACTION_OPEN, expression: DEFAULT_EXPRESSION };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();
  const action: CronAction =
    actionRaw === "parse" || actionRaw === "random" ? actionRaw : ACTION_OPEN;

  return {
    action,
    expression: (params.get("expression") ?? DEFAULT_EXPRESSION).trim()
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
    title: "Cron 生成器",
    subtitle: "定时表达式解析与执行时间预测",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(ACTION_OPEN, DEFAULT_EXPRESSION),
    keywords: ["plugin", "webtools", "cron", "定时", "表达式", "schedule"]
  };
}

function formatDate(date: Date): string {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function parseField(field: string, min: number, max: number): number[] {
  const result = new Set<number>();
  const parts = field.split(",").map((item) => item.trim()).filter(Boolean);

  for (const part of parts) {
    if (part === "*") {
      for (let i = min; i <= max; i += 1) {
        result.add(i);
      }
      continue;
    }

    if (part.includes("/")) {
      const [baseRaw, stepRaw] = part.split("/");
      const step = Number(stepRaw);
      if (!Number.isInteger(step) || step <= 0) {
        throw new Error(`无效步长: ${part}`);
      }

      if (baseRaw === "*") {
        for (let i = min; i <= max; i += step) {
          result.add(i);
        }
      } else if (baseRaw.includes("-")) {
        const [startRaw, endRaw] = baseRaw.split("-");
        const start = Number(startRaw);
        const end = Number(endRaw);
        if (
          !Number.isInteger(start) ||
          !Number.isInteger(end) ||
          start < min ||
          end > max ||
          start > end
        ) {
          throw new Error(`无效范围: ${part}`);
        }
        for (let i = start; i <= end; i += step) {
          result.add(i);
        }
      } else {
        const start = Number(baseRaw);
        if (!Number.isInteger(start) || start < min || start > max) {
          throw new Error(`无效值: ${part}`);
        }
        for (let i = start; i <= max; i += step) {
          result.add(i);
        }
      }
      continue;
    }

    if (part.includes("-")) {
      const [startRaw, endRaw] = part.split("-");
      const start = Number(startRaw);
      const end = Number(endRaw);
      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < min ||
        end > max ||
        start > end
      ) {
        throw new Error(`无效范围: ${part}`);
      }
      for (let i = start; i <= end; i += 1) {
        result.add(i);
      }
      continue;
    }

    const value = Number(part);
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new Error(`无效值: ${part}`);
    }
    result.add(value);
  }

  if (result.size === 0) {
    throw new Error(`字段为空: ${field}`);
  }

  return Array.from(result).sort((a, b) => a - b);
}

function buildReadable(parts: string[]): string {
  const [minute, hour, day, month, week] = parts;

  const isNumberToken = (value: string): boolean => /^\d+$/.test(value);
  const weekName = (value: string): string => {
    const names = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    if (!isNumberToken(value)) {
      return value;
    }
    const index = Number(value);
    return names[index] ?? value;
  };
  const pad2 = (value: string): string => value.padStart(2, "0");

  if (minute === "*" && hour === "*" && day === "*" && month === "*" && week === "*") {
    return "每分钟执行";
  }

  if (minute.startsWith("*/") && hour === "*" && day === "*" && month === "*" && week === "*") {
    return `每 ${minute.slice(2)} 分钟执行`;
  }

  if (isNumberToken(minute) && hour === "*" && day === "*" && month === "*" && week === "*") {
    return `每小时第 ${minute} 分钟执行`;
  }

  if (
    isNumberToken(minute) &&
    isNumberToken(hour) &&
    day === "*" &&
    month === "*" &&
    week === "*"
  ) {
    return `在 ${pad2(hour)}:${pad2(minute)} 执行`;
  }

  if (
    isNumberToken(minute) &&
    isNumberToken(hour) &&
    day === "*" &&
    month === "*" &&
    isNumberToken(week)
  ) {
    return `${weekName(week)} ${pad2(hour)}:${pad2(minute)} 执行`;
  }

  if (
    isNumberToken(minute) &&
    isNumberToken(hour) &&
    isNumberToken(day) &&
    month === "*" &&
    week === "*"
  ) {
    return `每月 ${day} 日 ${pad2(hour)}:${pad2(minute)} 执行`;
  }

  if (
    isNumberToken(minute) &&
    isNumberToken(hour) &&
    isNumberToken(day) &&
    isNumberToken(month)
  ) {
    return `每年 ${month} 月 ${day} 日 ${pad2(hour)}:${pad2(minute)} 执行`;
  }

  const formatToken = (value: string): string => {
    if (value === "*") {
      return "任意";
    }
    if (value.includes("/")) {
      return `每 ${value.split("/")[1]} 个`;
    }
    if (value.includes(",")) {
      return `列表(${value})`;
    }
    if (value.includes("-")) {
      return `范围(${value})`;
    }
    return value;
  };

  return `分钟:${formatToken(minute)} 小时:${formatToken(hour)} 日:${formatToken(day)} 月:${formatToken(month)} 周:${formatToken(week)}`;
}

function nextRuns(expression: string, count: number): string[] {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error("Cron 表达式必须是 5 段（分 时 日 月 周）");
  }

  const minuteSet = new Set(parseField(parts[0] ?? "", 0, 59));
  const hourSet = new Set(parseField(parts[1] ?? "", 0, 23));
  const daySet = new Set(parseField(parts[2] ?? "", 1, 31));
  const monthSet = new Set(parseField(parts[3] ?? "", 1, 12));
  const weekSet = new Set(parseField(parts[4] ?? "", 0, 6));

  const upcoming: string[] = [];
  const cursor = new Date();
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  for (let i = 0; i < MAX_SEARCH_MINUTES && upcoming.length < count; i += 1) {
    const month = cursor.getMonth() + 1;
    const day = cursor.getDate();
    const week = cursor.getDay();
    const hour = cursor.getHours();
    const minute = cursor.getMinutes();

    if (
      monthSet.has(month) &&
      daySet.has(day) &&
      weekSet.has(week) &&
      hourSet.has(hour) &&
      minuteSet.has(minute)
    ) {
      upcoming.push(formatDate(cursor));
    }

    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  if (upcoming.length === 0) {
    throw new Error("在搜索范围内没有找到下一次执行时间");
  }

  return upcoming;
}

function parseCronExpression(expression: string): CronParseResult {
  const normalized = expression.trim() || DEFAULT_EXPRESSION;
  const parts = normalized.split(/\s+/);
  if (parts.length !== 5) {
    throw new Error("Cron 表达式必须是 5 段（分 时 日 月 周）");
  }

  const upcoming = nextRuns(normalized, 7);

  return {
    expression: normalized,
    readable: buildReadable(parts),
    nextRun: upcoming[0] ?? "",
    upcoming
  };
}

function randomField(min: number, max: number): string {
  const mode = randomInt(0, 4);
  if (mode === 0) {
    return "*";
  }
  if (mode === 1) {
    return String(randomInt(min, max + 1));
  }
  if (mode === 2) {
    const start = randomInt(min, Math.max(min + 1, max));
    const end = randomInt(start, max + 1);
    return `${start}-${end}`;
  }
  const step = randomInt(1, Math.max(2, Math.floor((max - min + 1) / 2)));
  return `*/${step}`;
}

function randomExpression(): string {
  return [
    randomField(0, 59),
    randomField(0, 23),
    randomField(1, 31),
    randomField(1, 12),
    randomField(0, 6)
  ].join(" ");
}

function executeCommand(command: CronCommand): ExecuteResult {
  try {
    if (command.action === "random") {
      const expression = randomExpression();
      const parsed = parseCronExpression(expression);
      return {
        ok: true,
        keepOpen: true,
        message: "已生成随机 Cron",
        data: {
          action: command.action,
          ...parsed
        }
      };
    }

    const parsed = parseCronExpression(command.expression);
    return {
      ok: true,
      keepOpen: true,
      message: "Cron 解析完成",
      data: {
        action: command.action,
        ...parsed
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Cron 解析失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: {
        action: command.action,
        expression: command.expression
      }
    };
  }
}

export const webtoolsCronPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "Cron 生成器",
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
        title: "Cron 生成器",
        subtitle: "定时表达式解析与执行时间预测",
        data: {
          expression: command.expression || DEFAULT_EXPRESSION
        }
      });
      return {
        ok: true,
        keepOpen: true,
        message: "已打开 Cron 生成器"
      };
    }

    return executeCommand(command);
  }
};
