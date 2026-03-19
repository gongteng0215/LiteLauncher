import { format as formatSqlText } from "sql-formatter";

import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type SqlAction = "open" | "format";
type SqlDialect = "sql" | "mysql" | "postgresql" | "sqlite" | "tsql";

interface SqlCommand {
  action: SqlAction;
  input: string;
  dialect: SqlDialect;
  uppercase: boolean;
  indent: number;
}

const PLUGIN_ID = "webtools-sql-format";
const DEFAULT_INPUT =
  "SELECT a,b,c FROM table_test JOIN other_table ON table_test.id = other_table.id WHERE a > 10 AND b LIKE '%test%' ORDER BY c DESC LIMIT 10";
const DEFAULT_DIALECT: SqlDialect = "sql";
const DEFAULT_INDENT = 2;
const QUERY_ALIASES = [
  "wt-sql",
  "sql-tool",
  "sql",
  "sql格式化",
  "sql整理",
  "数据库sql"
];

const DIALECT_LABELS: Record<SqlDialect, string> = {
  sql: "SQL",
  mysql: "MySQL",
  postgresql: "PostgreSQL",
  sqlite: "SQLite",
  tsql: "T-SQL"
};

function buildTarget(command: SqlCommand): string {
  const params = new URLSearchParams();
  params.set("action", command.action);
  params.set("input", command.input);
  params.set("dialect", command.dialect);
  params.set("uppercase", command.uppercase ? "1" : "0");
  params.set("indent", String(command.indent));
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseBoolean(value: string | null, fallback: boolean): boolean {
  if (value === "1" || value === "true") {
    return true;
  }
  if (value === "0" || value === "false") {
    return false;
  }
  return fallback;
}

function parseIndent(value: string | null): number {
  const parsed = Number(value ?? String(DEFAULT_INDENT));
  if (!Number.isFinite(parsed)) {
    return DEFAULT_INDENT;
  }
  const rounded = Math.max(1, Math.min(8, Math.round(parsed)));
  return rounded;
}

function normalizeDialect(value: string | null | undefined): SqlDialect {
  const normalized = (value ?? DEFAULT_DIALECT).trim().toLowerCase();
  switch (normalized) {
    case "mysql":
    case "postgresql":
    case "sqlite":
    case "tsql":
      return normalized;
    case "sql":
    default:
      return DEFAULT_DIALECT;
  }
}

function parseCommand(optionsText: string | undefined): SqlCommand {
  if (!optionsText) {
    return {
      action: "open",
      input: DEFAULT_INPUT,
      dialect: DEFAULT_DIALECT,
      uppercase: true,
      indent: DEFAULT_INDENT
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? "open").trim().toLowerCase();

  return {
    action: actionRaw === "format" ? "format" : "open",
    input: params.get("input") ?? DEFAULT_INPUT,
    dialect: normalizeDialect(params.get("dialect")),
    uppercase: parseBoolean(params.get("uppercase"), true),
    indent: parseIndent(params.get("indent"))
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

function buildInfo(command: SqlCommand): string {
  const dialectLabel = DIALECT_LABELS[command.dialect];
  const indentLabel = `${command.indent} 空格缩进`;
  const keywordLabel = command.uppercase ? "关键字大写" : "保持原始大小写";
  return `${dialectLabel} | ${indentLabel} | ${keywordLabel}`;
}

function createCatalogItem(): LaunchItem {
  const defaultCommand = parseCommand(undefined);
  return {
    id: `plugin:${PLUGIN_ID}`,
    type: "command",
    title: "SQL 格式化",
    subtitle: "整理 SQL 语句排版与关键字样式",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(defaultCommand),
    keywords: [
      "plugin",
      "webtools",
      "sql",
      "format",
      "sql格式化",
      "sql整理",
      "数据库"
    ]
  };
}

function executeFormat(command: SqlCommand): ExecuteResult {
  if (!command.input.trim()) {
    return {
      ok: true,
      keepOpen: true,
      message: "请输入 SQL",
      data: {
        output: "",
        info: "等待输入 SQL",
        error: "",
        dialect: command.dialect,
        uppercase: command.uppercase,
        indent: command.indent
      }
    };
  }

  try {
    const output = formatSqlText(command.input, {
      language: command.dialect,
      tabWidth: command.indent,
      useTabs: false,
      keywordCase: command.uppercase ? "upper" : "preserve"
    });

    return {
      ok: true,
      keepOpen: true,
      message: "SQL 格式化完成",
      data: {
        output,
        info: buildInfo(command),
        error: "",
        dialect: command.dialect,
        uppercase: command.uppercase,
        indent: command.indent
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "SQL 格式化失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: {
        output: "",
        info: "格式化失败",
        error: reason,
        dialect: command.dialect,
        uppercase: command.uppercase,
        indent: command.indent
      }
    };
  }
}

export const webtoolsSqlFormatPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "SQL 格式化",
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
        title: "SQL 格式化",
        subtitle: "整理 SQL 语句排版与关键字样式",
        data: {
          input: command.input || DEFAULT_INPUT,
          dialect: command.dialect,
          uppercase: command.uppercase,
          indent: command.indent,
          info: "输入 SQL 后自动格式化",
          error: ""
        }
      });

      return {
        ok: true,
        keepOpen: true,
        message: "已打开 SQL 格式化"
      };
    }

    return executeFormat(command);
  }
};
