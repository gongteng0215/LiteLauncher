import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type SqlAction = "open" | "format";

interface SqlCommand {
  action: SqlAction;
  input: string;
  dialect: string;
  uppercase: boolean;
  indent: number;
}

const PLUGIN_ID = "webtools-sql-format";
const ACTION_OPEN: SqlAction = "open";
const QUERY_ALIASES = ["wt-sql", "sql-tool", "sql", "格式化", "数据库"];
const KEYWORDS = [
  "select",
  "from",
  "where",
  "group by",
  "having",
  "order by",
  "limit",
  "offset",
  "join",
  "left join",
  "right join",
  "inner join",
  "outer join",
  "on",
  "and",
  "or",
  "union",
  "insert into",
  "values",
  "update",
  "set",
  "delete"
];

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
  const input = Number(value ?? "2");
  if (!Number.isFinite(input)) {
    return 2;
  }
  const rounded = Math.round(input);
  if (rounded < 1) {
    return 1;
  }
  if (rounded > 8) {
    return 8;
  }
  return rounded;
}

function parseCommand(optionsText: string | undefined): SqlCommand {
  if (!optionsText) {
    return {
      action: ACTION_OPEN,
      input:
        "SELECT a,b,c FROM table_test JOIN other_table ON table_test.id = other_table.id WHERE a > 10 AND b LIKE '%test%' ORDER BY c DESC LIMIT 10",
      dialect: "sql",
      uppercase: true,
      indent: 2
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();

  return {
    action: actionRaw === "format" ? "format" : ACTION_OPEN,
    input: params.get("input") ?? "",
    dialect: (params.get("dialect") ?? "sql").trim() || "sql",
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

function createCatalogItem(): LaunchItem {
  return {
    id: `plugin:${PLUGIN_ID}`,
    type: "command",
    title: "SQL 格式化",
    subtitle: "SQL 语句格式整理与关键字规范",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(parseCommand(undefined)),
    keywords: ["plugin", "webtools", "sql", "format", "格式化", "query"]
  };
}

function normalizeWhitespace(sql: string): string {
  return sql
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .trim();
}

function applyKeywordCase(input: string, uppercase: boolean): string {
  let output = input;

  for (const keyword of KEYWORDS.sort((a, b) => b.length - a.length)) {
    const pattern = new RegExp(`\\b${keyword.replace(/\s+/g, "\\s+")}\\b`, "gi");
    output = output.replace(pattern, uppercase ? keyword.toUpperCase() : keyword.toLowerCase());
  }

  return output;
}

function insertLineBreaks(input: string): string {
  const breakKeywords = [
    "SELECT",
    "FROM",
    "WHERE",
    "GROUP BY",
    "HAVING",
    "ORDER BY",
    "LIMIT",
    "OFFSET",
    "JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN",
    "OUTER JOIN",
    "UNION",
    "INSERT INTO",
    "VALUES",
    "UPDATE",
    "SET",
    "DELETE"
  ];

  let output = input;
  for (const keyword of breakKeywords.sort((a, b) => b.length - a.length)) {
    const escaped = keyword.replace(/\s+/g, "\\s+");
    output = output.replace(new RegExp(`\\s+${escaped}\\b`, "g"), `\n${keyword}`);
    output = output.replace(new RegExp(`\\s+${escaped.toLowerCase()}\\b`, "g"), `\n${keyword.toLowerCase()}`);
  }

  output = output.replace(/,\s*/g, ",\n  ");
  output = output.replace(/\s+AND\s+/g, "\n  AND ");
  output = output.replace(/\s+OR\s+/g, "\n  OR ");
  output = output.replace(/\n{2,}/g, "\n");
  return output.trim();
}

function indentSql(input: string, indent: number): string {
  const indentText = " ".repeat(indent);
  return input
    .split("\n")
    .map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return "";
      }

      if (index === 0) {
        return trimmed;
      }

      if (/^(SELECT|FROM|WHERE|GROUP BY|HAVING|ORDER BY|LIMIT|OFFSET|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|UNION|INSERT INTO|VALUES|UPDATE|SET|DELETE)\b/i.test(trimmed)) {
        return trimmed;
      }

      return `${indentText}${trimmed}`;
    })
    .join("\n");
}

function formatSql(input: string, uppercase: boolean, indent: number): string {
  const normalized = normalizeWhitespace(input);
  const cased = applyKeywordCase(normalized, uppercase);
  const withBreaks = insertLineBreaks(cased);
  return indentSql(withBreaks, indent);
}

function executeFormat(command: SqlCommand): ExecuteResult {
  try {
    if (!command.input.trim()) {
      return {
        ok: true,
        keepOpen: true,
        message: "输入为空",
        data: {
          output: "",
          info: "请输入 SQL"
        }
      };
    }

    const output = formatSql(command.input, command.uppercase, command.indent);

    return {
      ok: true,
      keepOpen: true,
      message: "SQL 格式化完成",
      data: {
        output,
        info: `${command.dialect.toUpperCase()} | 缩进 ${command.indent}`,
        dialect: command.dialect,
        uppercase: command.uppercase,
        indent: command.indent
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "格式化失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: {
        output: ""
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

    if (command.action === ACTION_OPEN) {
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: PLUGIN_ID,
        title: "SQL 格式化",
        subtitle: "SQL 语句格式整理与关键字规范",
        data: {
          input: command.input,
          dialect: command.dialect,
          uppercase: command.uppercase,
          indent: command.indent
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
