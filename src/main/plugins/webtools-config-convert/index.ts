import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type ConfigAction = "open" | "convert";
type ConfigFormat = "json" | "yaml" | "properties";

interface ConfigCommand {
  action: ConfigAction;
  source: ConfigFormat;
  target: ConfigFormat;
  input: string;
}

const PLUGIN_ID = "webtools-config-convert";
const ACTION_OPEN: ConfigAction = "open";
const QUERY_ALIASES = ["wt-config", "config-tool", "配置转换", "yaml", "properties"];
const DEFAULT_INPUT = `server:\n  port: 8080\n  host: localhost`;

function buildTarget(command: ConfigCommand): string {
  const params = new URLSearchParams();
  params.set("action", command.action);
  params.set("source", command.source);
  params.set("target", command.target);
  params.set("input", command.input);
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseFormat(value: string | null, fallback: ConfigFormat): ConfigFormat {
  const normalized = (value ?? fallback).trim().toLowerCase();
  if (normalized === "json" || normalized === "yaml" || normalized === "properties") {
    return normalized;
  }
  return fallback;
}

function parseCommand(optionsText: string | undefined): ConfigCommand {
  if (!optionsText) {
    return {
      action: ACTION_OPEN,
      source: "yaml",
      target: "properties",
      input: DEFAULT_INPUT
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();

  return {
    action: actionRaw === "convert" ? "convert" : ACTION_OPEN,
    source: parseFormat(params.get("source"), "yaml"),
    target: parseFormat(params.get("target"), "properties"),
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
    title: "配置转换",
    subtitle: "YAML / JSON / Properties 双向转换",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget({
      action: ACTION_OPEN,
      source: "yaml",
      target: "properties",
      input: DEFAULT_INPUT
    }),
    keywords: ["plugin", "webtools", "config", "yaml", "json", "properties", "转换"]
  };
}

function setDeepValue(target: Record<string, unknown>, path: string[], value: unknown): void {
  let cursor: Record<string, unknown> = target;
  for (let i = 0; i < path.length; i += 1) {
    const key = path[i] ?? "";
    if (!key) {
      continue;
    }

    if (i === path.length - 1) {
      cursor[key] = value;
      continue;
    }

    const next = cursor[key];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
}

function parseScalar(raw: string): unknown {
  const value = raw.trim();
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (value === "null") {
    return null;
  }
  if (value === "") {
    return "";
  }

  const num = Number(value);
  if (Number.isFinite(num)) {
    return num;
  }

  return value;
}

function parseProperties(input: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = input.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("!")) {
      continue;
    }

    const sepIndex = Math.max(trimmed.indexOf("="), trimmed.indexOf(":"));
    if (sepIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, sepIndex).trim();
    const value = trimmed.slice(sepIndex + 1).trim();
    if (!key) {
      continue;
    }

    const path = key.split(".").map((item) => item.trim()).filter(Boolean);
    setDeepValue(result, path, parseScalar(value));
  }

  return result;
}

function parseYaml(input: string): Record<string, unknown> {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.replace(/\t/g, "    "));

  const root: Record<string, unknown> = {};
  const stack: Array<{ indent: number; value: Record<string, unknown> }> = [
    { indent: -1, value: root }
  ];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const indent = rawLine.match(/^\s*/)?.[0].length ?? 0;
    const sep = trimmed.indexOf(":");
    if (sep === -1) {
      continue;
    }

    const key = trimmed.slice(0, sep).trim();
    const rawValue = trimmed.slice(sep + 1).trim();

    while (stack.length > 1 && indent <= (stack[stack.length - 1]?.indent ?? -1)) {
      stack.pop();
    }

    const parent = stack[stack.length - 1]?.value ?? root;

    if (!rawValue) {
      const next: Record<string, unknown> = {};
      parent[key] = next;
      stack.push({ indent, value: next });
    } else {
      parent[key] = parseScalar(rawValue);
    }
  }

  return root;
}

function parseInputByFormat(format: ConfigFormat, input: string): Record<string, unknown> {
  if (format === "json") {
    const parsed = JSON.parse(input);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("JSON 顶层必须是对象");
    }
    return parsed as Record<string, unknown>;
  }

  if (format === "yaml") {
    return parseYaml(input);
  }

  return parseProperties(input);
}

function toYaml(value: unknown, indent = 0): string {
  if (value === null || typeof value !== "object") {
    return `${value}`;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => `${" ".repeat(indent)}- ${toYaml(item, indent + 2).trimStart()}`)
      .join("\n");
  }

  const obj = value as Record<string, unknown>;
  return Object.entries(obj)
    .map(([key, next]) => {
      if (next && typeof next === "object") {
        const body = toYaml(next, indent + 2);
        return `${" ".repeat(indent)}${key}:\n${body}`;
      }
      return `${" ".repeat(indent)}${key}: ${next}`;
    })
    .join("\n");
}

function flattenProperties(
  value: Record<string, unknown>,
  prefix = "",
  output: Record<string, unknown> = {}
): Record<string, unknown> {
  for (const [key, next] of Object.entries(value)) {
    const prop = prefix ? `${prefix}.${key}` : key;
    if (next && typeof next === "object" && !Array.isArray(next)) {
      flattenProperties(next as Record<string, unknown>, prop, output);
    } else {
      output[prop] = next;
    }
  }
  return output;
}

function stringifyByFormat(format: ConfigFormat, value: Record<string, unknown>): string {
  if (format === "json") {
    return JSON.stringify(value, null, 2);
  }

  if (format === "yaml") {
    return toYaml(value);
  }

  const flat = flattenProperties(value);
  return Object.entries(flat)
    .map(([key, next]) => `${key}=${next ?? ""}`)
    .join("\n");
}

function executeConvert(command: ConfigCommand): ExecuteResult {
  try {
    if (!command.input.trim()) {
      return {
        ok: true,
        keepOpen: true,
        message: "输入为空",
        data: {
          output: "",
          source: command.source,
          target: command.target,
          info: "请输入待转换内容"
        }
      };
    }

    const parsed = parseInputByFormat(command.source, command.input);
    const output = stringifyByFormat(command.target, parsed);

    return {
      ok: true,
      keepOpen: true,
      message: "转换完成",
      data: {
        source: command.source,
        target: command.target,
        output,
        info: `${command.source.toUpperCase()} -> ${command.target.toUpperCase()}`
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "转换失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: {
        output: "",
        source: command.source,
        target: command.target
      }
    };
  }
}

export const webtoolsConfigConvertPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "配置转换",
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
        title: "配置转换",
        subtitle: "YAML / JSON / Properties 双向转换",
        data: {
          source: command.source,
          target: command.target,
          input: command.input || DEFAULT_INPUT
        }
      });
      return {
        ok: true,
        keepOpen: true,
        message: "已打开配置转换"
      };
    }

    return executeConvert(command);
  }
};
