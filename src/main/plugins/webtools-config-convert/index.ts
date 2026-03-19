import dotProperties from "dot-properties";
import yaml from "js-yaml";

import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type ConfigAction = "open" | "convert";
type ConfigFormat = "json" | "yaml" | "properties";
type ConfigValue =
  | string
  | number
  | boolean
  | null
  | ConfigObject
  | ConfigValue[];

interface ConfigObject {
  [key: string]: ConfigValue;
}

interface ConfigCommand {
  action: ConfigAction;
  source: ConfigFormat;
  target: ConfigFormat;
  input: string;
}

const PLUGIN_ID = "webtools-config-convert";
const DEFAULT_INPUT = `server:
  port: 8080
  servlet:
    context-path: /api
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/db`;
const QUERY_ALIASES = [
  "wt-config",
  "config-tool",
  "配置转换",
  "yaml",
  "properties",
  "json配置"
];

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
      action: "open",
      source: "yaml",
      target: "properties",
      input: DEFAULT_INPUT
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? "open").trim().toLowerCase();

  return {
    action: actionRaw === "convert" ? "convert" : "open",
    source: parseFormat(params.get("source"), "yaml"),
    target: parseFormat(params.get("target"), "properties"),
    input: params.get("input") ?? DEFAULT_INPUT
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
    target: buildTarget(parseCommand(undefined)),
    keywords: [
      "plugin",
      "webtools",
      "config",
      "yaml",
      "json",
      "properties",
      "配置转换"
    ]
  };
}

function setDeepValue(target: ConfigObject, path: string[], value: ConfigValue): void {
  let cursor: ConfigObject = target;
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
    cursor = cursor[key] as ConfigObject;
  }
}

function parseScalar(raw: string): ConfigValue {
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

  const numeric = Number(value);
  if (Number.isFinite(numeric) && /^-?\d+(\.\d+)?$/.test(value)) {
    return numeric;
  }

  return value;
}

function parseProperties(input: string): ConfigObject {
  const parsed = dotProperties.parse(input) as Record<string, string>;
  const result: ConfigObject = {};
  Object.entries(parsed).forEach(([key, value]) => {
    const path = key
      .split(".")
      .map((item) => item.trim())
      .filter(Boolean);
    if (path.length === 0) {
      return;
    }
    setDeepValue(result, path, parseScalar(value));
  });
  return result;
}

function parseInputByFormat(format: ConfigFormat, input: string): ConfigValue {
  if (format === "json") {
    return JSON.parse(input) as ConfigValue;
  }

  if (format === "yaml") {
    return yaml.load(input) as ConfigValue;
  }

  return parseProperties(input);
}

function flattenProperties(
  value: ConfigValue,
  prefix = "",
  output: Record<string, string> = {}
): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    if (prefix) {
      output[prefix] = value == null ? "" : String(value);
    }
    return output;
  }

  for (const [key, next] of Object.entries(value)) {
    const prop = prefix ? `${prefix}.${key}` : key;
    if (next && typeof next === "object" && !Array.isArray(next)) {
      flattenProperties(next as ConfigObject, prop, output);
    } else {
      output[prop] = next == null ? "" : String(next);
    }
  }
  return output;
}

function stringifyByFormat(format: ConfigFormat, value: ConfigValue): string {
  if (format === "json") {
    return JSON.stringify(value, null, 2);
  }

  if (format === "yaml") {
    return yaml.dump(value, {
      noRefs: true,
      lineWidth: -1
    });
  }

  return dotProperties.stringify(flattenProperties(value)).trim();
}

function executeConvert(command: ConfigCommand): ExecuteResult {
  if (!command.input.trim()) {
    return {
      ok: true,
      keepOpen: true,
      message: "请输入待转换内容",
      data: {
        source: command.source,
        target: command.target,
        output: "",
        info: "等待输入待转换内容",
        error: ""
      }
    };
  }

  try {
    const parsed = parseInputByFormat(command.source, command.input);
    const output = stringifyByFormat(command.target, parsed);

    return {
      ok: true,
      keepOpen: true,
      message: "配置转换完成",
      data: {
        source: command.source,
        target: command.target,
        output,
        info: `${command.source.toUpperCase()} -> ${command.target.toUpperCase()}`,
        error: ""
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "配置转换失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: {
        output: "",
        source: command.source,
        target: command.target,
        info: "转换失败",
        error: reason
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

    if (command.action === "open") {
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: PLUGIN_ID,
        title: "配置转换",
        subtitle: "YAML / JSON / Properties 双向转换",
        data: {
          source: command.source,
          target: command.target,
          input: command.input || DEFAULT_INPUT,
          info: "输入内容后自动转换",
          error: ""
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
