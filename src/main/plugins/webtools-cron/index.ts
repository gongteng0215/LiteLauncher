import { randomInt } from "node:crypto";

import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type CronAction = "open" | "parse" | "random";
type CronStatus = "success" | "warning" | "error";
type CronFieldName = "minute" | "hour" | "day" | "month" | "weekday";

interface CronCommand {
  action: CronAction;
  expression: string;
}

interface CronFieldMeta {
  key: CronFieldName;
  label: string;
  value: string;
  hint: string;
  hasError: boolean;
}

interface CronParseResult {
  expression: string;
  readable: string;
  nextRun: string;
  upcoming: string[];
  status: CronStatus;
  errorMessage: string;
  errorField: CronFieldName | "";
  warnings: string[];
  templateKey: string;
  templateSummary: string;
  fieldMeta: CronFieldMeta[];
}

interface CronFieldConfig {
  key: CronFieldName;
  label: string;
  rangeLabel: string;
  min: number;
  max: number;
}

interface CronTemplate {
  key: string;
  expression: string;
  summary: string;
}

class CronFieldParseError extends Error {
  field: CronFieldName;

  constructor(field: CronFieldName, message: string) {
    super(message);
    this.field = field;
  }
}

const PLUGIN_ID = "webtools-cron";
const ACTION_OPEN: CronAction = "open";
const QUERY_ALIASES = ["wt-cron", "cron-tool", "cron", "定时", "表达式"];
const DEFAULT_EXPRESSION = "5 4 * * *";
const MAX_SEARCH_MINUTES = 366 * 24 * 60;
const FIELD_COUNT_ERROR = "Cron 表达式必须是 5 段（分 时 日 月 周）";
const GENERIC_PARSE_ERROR = "Cron 解析失败";
const CRON_FIELDS: readonly CronFieldConfig[] = [
  { key: "minute", label: "分", rangeLabel: "0-59", min: 0, max: 59 },
  { key: "hour", label: "时", rangeLabel: "0-23", min: 0, max: 23 },
  { key: "day", label: "日", rangeLabel: "1-31", min: 1, max: 31 },
  { key: "month", label: "月", rangeLabel: "1-12", min: 1, max: 12 },
  { key: "weekday", label: "周", rangeLabel: "0-6", min: 0, max: 6 }
];
const CRON_TEMPLATES: readonly CronTemplate[] = [
  { key: "weekday-9am", expression: "0 9 * * 1-5", summary: "工作日 09:00 执行" },
  { key: "daily-noon", expression: "0 12 * * *", summary: "每天 12:00 执行" },
  { key: "daily-midnight", expression: "0 0 * * *", summary: "每天 00:00 执行" },
  { key: "hourly-top", expression: "0 * * * *", summary: "每小时整点执行" },
  { key: "every-minute", expression: "* * * * *", summary: "每分钟执行" }
];

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

function splitExpression(expression: string): string[] {
  const normalized = expression.trim() || DEFAULT_EXPRESSION;
  const parts = normalized.split(/\s+/);
  if (parts.length !== CRON_FIELDS.length) {
    throw new Error(FIELD_COUNT_ERROR);
  }
  return parts;
}

function buildFieldMeta(parts: string[], errorField: CronFieldName | ""): CronFieldMeta[] {
  return CRON_FIELDS.map((field, index) => ({
    key: field.key,
    label: field.label,
    value: parts[index] ?? "",
    hint: `${field.label} (${field.rangeLabel})`,
    hasError: field.key === errorField
  }));
}

function buildErrorResult(
  expression: string,
  errorMessage: string,
  errorField: CronFieldName | ""
): CronParseResult {
  const normalized = expression.trim() || DEFAULT_EXPRESSION;
  const rawParts = normalized.split(/\s+/);
  const parts = rawParts.slice(0, CRON_FIELDS.length);
  while (parts.length < CRON_FIELDS.length) {
    parts.push("");
  }

  return {
    expression: normalized,
    readable: "",
    nextRun: "",
    upcoming: [],
    status: "error",
    errorMessage,
    errorField,
    warnings: [],
    templateKey: "",
    templateSummary: "",
    fieldMeta: buildFieldMeta(parts, errorField)
  };
}

function parseField(field: string, config: CronFieldConfig): number[] {
  const result = new Set<number>();
  const parts = field.split(",").map((item) => item.trim()).filter(Boolean);
  const { min, max } = config;

  const fail = (reason: string): never => {
    throw new CronFieldParseError(config.key, `${config.label}字段${reason}`);
  };

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
        fail(`无效步长: ${part}`);
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
          fail(`无效范围: ${part}`);
        }
        for (let i = start; i <= end; i += step) {
          result.add(i);
        }
      } else {
        const start = Number(baseRaw);
        if (!Number.isInteger(start) || start < min || start > max) {
          fail(`无效值: ${part}`);
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
        fail(`无效范围: ${part}`);
      }
      for (let i = start; i <= end; i += 1) {
        result.add(i);
      }
      continue;
    }

    const value = Number(part);
    if (!Number.isInteger(value) || value < min || value > max) {
      fail(`无效值: ${part}`);
    }
    result.add(value);
  }

  if (result.size === 0) {
    fail("为空");
  }

  return Array.from(result).sort((a, b) => a - b);
}

function buildReadable(parts: string[]): string {
  const [minute, hour, day, month, week] = parts;

  const isNumberToken = (value: string): boolean => /^\d+$/.test(value);
  const isWeekdayWorkdays = (value: string): boolean => value === "1-5" || value === "1,2,3,4,5";
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
    isWeekdayWorkdays(week)
  ) {
    return `工作日 ${pad2(hour)}:${pad2(minute)} 执行`;
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

function matchTemplate(expression: string): CronTemplate | null {
  return CRON_TEMPLATES.find((template) => template.expression === expression) ?? null;
}

function buildWarnings(expression: string): string[] {
  if (expression === "* * * * *") {
    return ["该表达式会每分钟执行一次，频率较高，请确认是否符合预期。"];
  }
  return [];
}

function nextRuns(parts: string[], count: number): string[] {
  const minuteSet = new Set(parseField(parts[0] ?? "", CRON_FIELDS[0]));
  const hourSet = new Set(parseField(parts[1] ?? "", CRON_FIELDS[1]));
  const daySet = new Set(parseField(parts[2] ?? "", CRON_FIELDS[2]));
  const monthSet = new Set(parseField(parts[3] ?? "", CRON_FIELDS[3]));
  const weekSet = new Set(parseField(parts[4] ?? "", CRON_FIELDS[4]));

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
  const parts = splitExpression(normalized);
  CRON_FIELDS.forEach((field, index) => {
    parseField(parts[index] ?? "", field);
  });

  const upcoming = nextRuns(parts, 7);
  const template = matchTemplate(normalized);
  const warnings = buildWarnings(normalized);

  return {
    expression: normalized,
    readable: buildReadable(parts),
    nextRun: upcoming[0] ?? "",
    upcoming,
    status: warnings.length > 0 ? "warning" : "success",
    errorMessage: "",
    errorField: "",
    warnings,
    templateKey: template?.key ?? "",
    templateSummary: template?.summary ?? "",
    fieldMeta: buildFieldMeta(parts, "")
  };
}

function tryParseCronExpression(expression: string): CronParseResult {
  try {
    return parseCronExpression(expression);
  } catch (error) {
    if (error instanceof CronFieldParseError) {
      return buildErrorResult(expression, error.message, error.field);
    }
    if (error instanceof Error) {
      return buildErrorResult(expression, error.message, "");
    }
    return buildErrorResult(expression, GENERIC_PARSE_ERROR, "");
  }
}

function applyTemplate(
  key: string
): Pick<CronParseResult, "expression" | "templateKey" | "templateSummary"> {
  const template = CRON_TEMPLATES.find((item) => item.key === key);

  return {
    expression: template?.expression ?? DEFAULT_EXPRESSION,
    templateKey: template?.key ?? key,
    templateSummary: template?.summary ?? ""
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
  if (command.action === "random") {
    const expression = randomExpression();
    const parsed = tryParseCronExpression(expression);
    return {
      ok: parsed.status !== "error",
      keepOpen: true,
      message: "已生成随机 Cron",
      data: {
        action: command.action,
        ...parsed
      }
    };
  }

  const parsed = tryParseCronExpression(command.expression);
  return {
    ok: parsed.status !== "error",
    keepOpen: true,
    message: parsed.status === "error" ? parsed.errorMessage : "Cron 解析完成",
    data: {
      action: command.action,
      ...parsed
    }
  };
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

export const __cronTestUtils = {
  parseCronExpression,
  tryParseCronExpression,
  applyTemplate
};
