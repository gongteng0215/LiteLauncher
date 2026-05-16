import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type JsonAction =
  | "open"
  | "convert"
  | "format"
  | "minify"
  | "validate"
  | "jsonToCsv"
  | "csvToJson";

type JsonFormat = "json" | "csv" | "text" | "escaped";

interface JsonCommand {
  action: JsonAction;
  input: string;
  sourceFormat: JsonFormat;
  targetFormat: JsonFormat;
  compressed: boolean;
}

interface JsonPreviewField {
  key: string;
  count?: number;
}

interface JsonPreviewSummary {
  kind: "json-object" | "json-array" | "csv" | "text" | "escaped" | "unknown";
  summary: string;
  fields?: JsonPreviewField[];
  sampleRows?: Record<string, unknown>[];
}

const PLUGIN_ID = "webtools-json";
const ACTION_OPEN: JsonAction = "open";
const DEFAULT_EXAMPLE =
  '{"project":"WebTools","version":1.0,"features":["JSON","CSV","Cron"],"active":true}';
const QUERY_ALIASES = ["wt-json", "json-tool", "json", "json工具", "json格式化"];

function parseBoolean(value: string | null, fallback = false): boolean {
  if (value === "1" || value === "true") {
    return true;
  }
  if (value === "0" || value === "false") {
    return false;
  }
  return fallback;
}

function parseFormat(value: string | null, fallback: JsonFormat): JsonFormat {
  const normalized = (value ?? fallback).trim().toLowerCase();
  if (
    normalized === "json" ||
    normalized === "csv" ||
    normalized === "text" ||
    normalized === "escaped"
  ) {
    return normalized;
  }
  return fallback;
}

function buildTarget(command: JsonCommand): string {
  const params = new URLSearchParams();
  params.set("action", command.action);
  params.set("input", command.input);
  params.set("sourceFormat", command.sourceFormat);
  params.set("targetFormat", command.targetFormat);
  params.set("compressed", command.compressed ? "1" : "0");
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseCommand(optionsText: string | undefined): JsonCommand {
  if (!optionsText) {
    return {
      action: ACTION_OPEN,
      input: DEFAULT_EXAMPLE,
      sourceFormat: "text",
      targetFormat: "json",
      compressed: false
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim();
  const compressed = parseBoolean(
    params.get("compressed") ?? params.get("minify"),
    false
  );

  const base: JsonCommand = {
    action: ACTION_OPEN,
    input: params.get("input") ?? "",
    sourceFormat: parseFormat(
      params.get("sourceFormat") ?? params.get("source"),
      "text"
    ),
    targetFormat: parseFormat(
      params.get("targetFormat") ?? params.get("target"),
      "json"
    ),
    compressed
  };

  if (
    actionRaw === "convert" ||
    actionRaw === "format" ||
    actionRaw === "minify" ||
    actionRaw === "validate" ||
    actionRaw === "jsonToCsv" ||
    actionRaw === "csvToJson"
  ) {
    base.action = actionRaw;
  }

  if (!base.input.trim()) {
    base.input = DEFAULT_EXAMPLE;
  }

  return base;
}

function matchesAlias(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  for (const alias of QUERY_ALIASES) {
    const nextAlias = alias.trim().toLowerCase();
    if (!nextAlias) {
      continue;
    }

    if (normalized === nextAlias || normalized.startsWith(`${nextAlias} `)) {
      return true;
    }
  }

  return false;
}

function createCatalogItem(): LaunchItem {
  return {
    id: `plugin:${PLUGIN_ID}`,
    type: "command",
    title: "JSON 工具",
    subtitle: "JSON & CSV 实验室",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget({
      action: ACTION_OPEN,
      input: DEFAULT_EXAMPLE,
      sourceFormat: "text",
      targetFormat: "json",
      compressed: false
    }),
    keywords: [
      "plugin",
      "webtools",
      "json",
      "csv",
      "格式化",
      "压缩",
      "校验",
      "转换"
    ]
  };
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i] ?? "";
    const nextChar = line[i + 1] ?? "";

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const headers = splitCsvLine(lines[0] ?? "");
  const rows: Record<string, string>[] = [];

  for (const line of lines.slice(1)) {
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    rows.push(row);
  }

  return rows;
}

function escapeCsvCell(value: unknown): string {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function stringifyCsv(rows: Record<string, unknown>[]): string {
  const headers: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!headers.includes(key)) {
        headers.push(key);
      }
    }
  }

  if (headers.length === 0) {
    return "";
  }

  const lines: string[] = [];
  lines.push(headers.map((header) => escapeCsvCell(header)).join(","));
  for (const row of rows) {
    lines.push(
      headers
        .map((header) => escapeCsvCell((row as Record<string, unknown>)[header]))
        .join(",")
    );
  }

  return lines.join("\n");
}

function normalizeJsonOutput(value: unknown, compressed: boolean): string {
  return compressed ? JSON.stringify(value) : JSON.stringify(value, null, 2);
}

function toRowsFromJson(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [];
    }

    if (value.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
      return value as Record<string, unknown>[];
    }

    return value.map((item) => ({ value: item }));
  }

  if (value && typeof value === "object") {
    return [value as Record<string, unknown>];
  }

  return [{ value }];
}

function countKeys(rows: Record<string, unknown>[]): JsonPreviewField[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }
      return left[0].localeCompare(right[0]);
    })
    .map(([key, count]) => ({ key, count }));
}

function buildPreviewSummary(
  input: string,
  sourceFormat: JsonFormat
): JsonPreviewSummary {
  const trimmed = input.trim();
  if (!trimmed) {
    return { kind: "unknown", summary: "等待输入" };
  }

  try {
    if (sourceFormat === "csv") {
      const rows = parseCsv(input);
      const fields = countKeys(rows);
      return {
        kind: "csv",
        summary: `${rows.length} 行 · ${fields.length} 列`,
        fields,
        sampleRows: rows.slice(0, 2)
      };
    }

    if (sourceFormat === "escaped") {
      const unescaped = JSON.parse(input);
      if (typeof unescaped === "string") {
        return {
          kind: "escaped",
          summary: `${unescaped.length} 字符的 JSON 字符串`
        };
      }

      const rows = toRowsFromJson(unescaped);
      const fields = countKeys(rows);
      return {
        kind: Array.isArray(unescaped) ? "json-array" : "json-object",
        summary: Array.isArray(unescaped)
          ? `${unescaped.length} 项 · ${fields.length} 个字段`
          : `${Object.keys(unescaped as Record<string, unknown>).length} 个键`,
        fields,
        sampleRows: rows.slice(0, 2)
      };
    }

    if (sourceFormat === "json" || sourceFormat === "text") {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        const rows = toRowsFromJson(parsed);
        const fields = countKeys(rows);
        return {
          kind: "json-array",
          summary: `${parsed.length} 项 · ${fields.length} 个字段`,
          fields,
          sampleRows: rows.slice(0, 2)
        };
      }

      if (parsed && typeof parsed === "object") {
        const rows = toRowsFromJson(parsed);
        const fields = countKeys(rows);
        return {
          kind: "json-object",
          summary: `${Object.keys(parsed as Record<string, unknown>).length} 个键`,
          fields,
          sampleRows: rows.slice(0, 1)
        };
      }

      return {
        kind: "json-object",
        summary: `值类型 ${typeof parsed}`
      };
    }
  } catch {
    if (sourceFormat === "text") {
      return {
        kind: "text",
        summary: `${trimmed.length} 字符 · ${trimmed.split(/\r?\n/).length} 行`
      };
    }
  }

  return {
    kind: "text",
    summary: `${trimmed.length} 字符 · ${trimmed.split(/\r?\n/).length} 行`
  };
}

function extractErrorPosition(message: string): number | null {
  const match = message.match(/position\s+(\d+)/i);
  if (!match) {
    return null;
  }
  const position = Number.parseInt(match[1] ?? "", 10);
  return Number.isFinite(position) ? position : null;
}

function executeValidate(input: string): ExecuteResult {
  const preview = buildPreviewSummary(input, "json");
  try {
    const parsed = JSON.parse(input);
    const type = Array.isArray(parsed) ? "array" : typeof parsed;
    const size = Array.isArray(parsed)
      ? parsed.length
      : parsed && typeof parsed === "object"
      ? Object.keys(parsed as Record<string, unknown>).length
      : 0;

    return {
      ok: true,
      keepOpen: true,
      message: "JSON 校验通过",
      data: {
        output: "",
        info: `类型: ${type}，元素/字段数: ${size}`,
        valid: true,
        preview,
        errorPosition: null
      }
    };
  } catch (error) {
    const message =
      error instanceof Error && error.message ? error.message : "JSON 语法错误";

    return {
      ok: false,
      keepOpen: true,
      message: `JSON 校验失败: ${message}`,
      data: {
        output: "",
        info: message,
        valid: false,
        preview,
        errorPosition: extractErrorPosition(message)
      }
    };
  }
}

function executeConvert(command: JsonCommand): ExecuteResult {
  const preview = buildPreviewSummary(command.input, command.sourceFormat);
  try {
    if (!command.input.trim()) {
      return {
        ok: true,
        keepOpen: true,
        message: "输入为空",
        data: {
          output: "",
          info: "请输入要转换的内容",
          valid: null,
          preview,
          errorPosition: null
        }
      };
    }

    const source = command.sourceFormat;
    const target = command.targetFormat;
    const input = command.input;
    const compressed = command.compressed;

    let output = "";

    if (source === "json") {
      if (target === "json") {
        output = normalizeJsonOutput(JSON.parse(input), compressed);
      } else if (target === "csv") {
        output = stringifyCsv(toRowsFromJson(JSON.parse(input)));
      } else if (target === "escaped") {
        JSON.parse(input);
        output = JSON.stringify(input);
      } else {
        output = input;
      }
    } else if (source === "csv") {
      if (target === "json") {
        output = normalizeJsonOutput(parseCsv(input), compressed);
      } else if (target === "csv") {
        output = stringifyCsv(parseCsv(input));
      } else {
        output = input;
      }
    } else if (source === "text") {
      if (target === "escaped") {
        output = JSON.stringify(input);
      } else if (target === "json") {
        output = normalizeJsonOutput(JSON.parse(input), compressed);
      } else {
        output = input;
      }
    } else {
      const unescaped = JSON.parse(input);
      const plainText =
        typeof unescaped === "string"
          ? unescaped
          : normalizeJsonOutput(unescaped, compressed);

      if (target === "json") {
        output = normalizeJsonOutput(JSON.parse(plainText), compressed);
      } else if (target === "escaped") {
        output = JSON.stringify(plainText);
      } else {
        output = plainText;
      }
    }

    return {
      ok: true,
      keepOpen: true,
      message: "转换完成",
      data: {
        output,
        info: `${source.toUpperCase()} -> ${target.toUpperCase()}`,
        valid: null,
        preview,
        errorPosition: null
      }
    };
  } catch (error) {
    const reason =
      error instanceof Error && error.message ? error.message : "转换失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: {
        output: "",
        info: reason,
        valid: false,
        preview,
        errorPosition: extractErrorPosition(reason)
      }
    };
  }
}

function executeAction(command: JsonCommand): ExecuteResult {
  if (command.action === "validate") {
    return executeValidate(command.input);
  }

  if (command.action === "format") {
    return executeConvert({
      ...command,
      action: "convert",
      sourceFormat: "json",
      targetFormat: "json",
      compressed: false
    });
  }

  if (command.action === "minify") {
    return executeConvert({
      ...command,
      action: "convert",
      sourceFormat: "json",
      targetFormat: "json",
      compressed: true
    });
  }

  if (command.action === "jsonToCsv") {
    return executeConvert({
      ...command,
      action: "convert",
      sourceFormat: "json",
      targetFormat: "csv"
    });
  }

  if (command.action === "csvToJson") {
    return executeConvert({
      ...command,
      action: "convert",
      sourceFormat: "csv",
      targetFormat: "json"
    });
  }

  return executeConvert(command);
}

export const webtoolsJsonPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "JSON 工具",
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
        title: "JSON & CSV 实验室",
        subtitle: "源格式 / 目标格式自由转换",
        data: {
          input: command.input || DEFAULT_EXAMPLE,
          sourceFormat: command.sourceFormat,
          targetFormat: command.targetFormat,
          compressed: command.compressed
        }
      });
      return {
        ok: true,
        keepOpen: true,
        message: "已打开 JSON 工具"
      };
    }

    return executeAction(command);
  }
};
