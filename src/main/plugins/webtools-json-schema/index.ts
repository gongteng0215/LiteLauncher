import Ajv, { type ErrorObject } from "ajv";

import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type JsonSchemaAction = "open" | "validate";

interface JsonSchemaCommand {
  action: JsonSchemaAction;
  schema: string;
  payload: string;
}

export interface JsonSchemaValidationError {
  path: string;
  message: string;
}

const PLUGIN_ID = "webtools-json-schema";
const ACTION_OPEN: JsonSchemaAction = "open";
const QUERY_ALIASES = [
  "wt-json-schema",
  "json-schema",
  "schema",
  "json schema",
  "JSON Schema",
  "schema校验",
  "schema校验器"
];

const DEFAULT_SCHEMA = JSON.stringify(
  {
    type: "object",
    required: ["name", "age"],
    properties: {
      name: { type: "string", minLength: 1 },
      age: { type: "integer", minimum: 0 }
    },
    additionalProperties: false
  },
  null,
  2
);

const DEFAULT_PAYLOAD = JSON.stringify({ name: "Alice", age: 28 }, null, 2);

const ajv = new Ajv({ allErrors: true, strict: false });

function buildTarget(command: JsonSchemaCommand): string {
  const params = new URLSearchParams();
  params.set("action", command.action);
  params.set("schema", command.schema);
  params.set("payload", command.payload);
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseCommand(optionsText: string | undefined): JsonSchemaCommand {
  if (!optionsText) {
    return {
      action: ACTION_OPEN,
      schema: DEFAULT_SCHEMA,
      payload: DEFAULT_PAYLOAD
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();

  return {
    action: actionRaw === "validate" ? "validate" : ACTION_OPEN,
    schema: params.get("schema") ?? DEFAULT_SCHEMA,
    payload: params.get("payload") ?? DEFAULT_PAYLOAD
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

function createCatalogItem(command: JsonSchemaCommand): LaunchItem {
  return {
    id: `plugin:${PLUGIN_ID}`,
    type: "command",
    title: "JSON Schema 校验",
    subtitle: "Schema + Payload 结构校验，展示错误路径",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget({ ...command, action: ACTION_OPEN }),
    keywords: [
      "plugin",
      "webtools",
      "json",
      "schema",
      "validate",
      "校验",
      "结构"
    ]
  };
}

function formatAjvError(error: ErrorObject): JsonSchemaValidationError {
  const path = error.instancePath || error.schemaPath || "/";
  const message = error.message ?? "校验失败";
  return { path, message };
}

export function validateJsonSchemaPayload(
  schemaText: string,
  payloadText: string
): {
  valid: boolean;
  errors: JsonSchemaValidationError[];
  schemaError?: string;
  payloadError?: string;
} {
  let schema: unknown;
  let payload: unknown;

  try {
    schema = JSON.parse(schemaText);
  } catch (error) {
    return {
      valid: false,
      errors: [],
      schemaError: error instanceof Error ? error.message : "Schema JSON 无效"
    };
  }

  try {
    payload = JSON.parse(payloadText);
  } catch (error) {
    return {
      valid: false,
      errors: [],
      payloadError: error instanceof Error ? error.message : "Payload JSON 无效"
    };
  }

  try {
    const validate = ajv.compile(schema as object);
    const valid = validate(payload);
    if (valid) {
      return { valid: true, errors: [] };
    }

    return {
      valid: false,
      errors: (validate.errors ?? []).map(formatAjvError)
    };
  } catch (error) {
    return {
      valid: false,
      errors: [],
      schemaError: error instanceof Error ? error.message : "Schema 编译失败"
    };
  }
}

function executeValidate(command: JsonSchemaCommand): ExecuteResult {
  const outcome = validateJsonSchemaPayload(command.schema, command.payload);

  if (outcome.schemaError) {
    return {
      ok: false,
      keepOpen: true,
      message: `Schema 无效：${outcome.schemaError}`,
      data: {
        valid: false,
        schemaError: outcome.schemaError,
        errors: outcome.errors
      }
    };
  }

  if (outcome.payloadError) {
    return {
      ok: false,
      keepOpen: true,
      message: `Payload 无效：${outcome.payloadError}`,
      data: {
        valid: false,
        payloadError: outcome.payloadError,
        errors: outcome.errors
      }
    };
  }

  if (outcome.valid) {
    return {
      ok: true,
      keepOpen: true,
      message: "校验通过",
      data: {
        valid: true,
        errors: outcome.errors
      }
    };
  }

  const first = outcome.errors[0];
  const hint = first ? `${first.path} ${first.message}` : "存在校验错误";
  return {
    ok: false,
    keepOpen: true,
    message: `校验失败：${hint}`,
    data: {
      valid: false,
      errors: outcome.errors
    }
  };
}

export const webtoolsJsonSchemaPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "JSON Schema 校验",
  createCatalogItems() {
    return [createCatalogItem(parseCommand(undefined))];
  },
  getQueryItems(query: string) {
    if (!matchesAlias(query)) {
      return [];
    }
    return [createCatalogItem(parseCommand(undefined))];
  },
  async execute(optionsText, context) {
    const command = parseCommand(optionsText);

    if (command.action === ACTION_OPEN) {
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: PLUGIN_ID,
        title: "JSON Schema 校验",
        subtitle: "左侧 Schema，右侧 Payload，自动展示错误路径",
        data: {
          schema: command.schema,
          payload: command.payload
        }
      });
      return {
        ok: true,
        keepOpen: true,
        message: "已打开 JSON Schema 校验"
      };
    }

    return executeValidate(command);
  }
};
