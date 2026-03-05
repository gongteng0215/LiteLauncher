import { randomInt } from "node:crypto";
import { clipboard } from "electron";

import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type PasswordStrength = "弱" | "中" | "强" | "很强";

interface WebtoolsPasswordOptions {
  length: number;
  count: number;
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeDigits: boolean;
  includeSymbols: boolean;
  symbolChars: string;
  excludeSimilar: boolean;
}

interface PasswordRow {
  password: string;
  strength: PasswordStrength;
}

const PLUGIN_ID = "webtools-password";
const ACTION_OPEN = "open";
const ACTION_GENERATE = "generate";
const LENGTH_MIN = 4;
const LENGTH_MAX = 64;
const COUNT_MIN = 1;
const COUNT_MAX = 50;
const DEFAULT_SYMBOL_CHARS = "!@#$%^&*";
const SIMILAR_CHARS = "iIl1LoO0`'\"|:;,.";

const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGIT_CHARS = "0123456789";
const FALLBACK_SYMBOL_CHARS = "!@#$%^&*()-_=+[]{}?/\\";

const DEFAULT_OPTIONS: WebtoolsPasswordOptions = {
  length: 16,
  count: 10,
  includeLowercase: true,
  includeUppercase: true,
  includeDigits: true,
  includeSymbols: true,
  symbolChars: DEFAULT_SYMBOL_CHARS,
  excludeSimilar: false
};

const QUERY_ALIASES = [
  "wt-pass",
  "wtpass",
  "wt-password",
  "password-tool",
  "密码工具",
  "随机密码",
  "密码"
];

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  const rounded = Math.round(value);
  if (rounded < min) {
    return min;
  }
  if (rounded > max) {
    return max;
  }
  return rounded;
}

function parseBooleanToken(raw: string): boolean | null {
  const value = raw.trim().toLowerCase();
  if (!value) {
    return null;
  }

  if (
    ["1", "true", "yes", "on", "symbol", "symbols", "lower", "upper", "digit"].includes(
      value
    )
  ) {
    return true;
  }
  if (
    [
      "0",
      "false",
      "no",
      "off",
      "nosymbol",
      "nosymbols",
      "nolower",
      "noupper",
      "nodigit"
    ].includes(value)
  ) {
    return false;
  }

  return null;
}

function normalizeSymbolChars(raw: string, excludeSimilar: boolean): string {
  const input = (raw || DEFAULT_SYMBOL_CHARS).trim();
  const source = input || DEFAULT_SYMBOL_CHARS;
  const filtered = source
    .split("")
    .filter((char, index, list) => list.indexOf(char) === index)
    .filter((char) => (excludeSimilar ? !SIMILAR_CHARS.includes(char) : true))
    .join("");

  if (filtered) {
    return filtered;
  }

  return excludeSimilar
    ? FALLBACK_SYMBOL_CHARS.split("")
        .filter((char) => !SIMILAR_CHARS.includes(char))
        .join("")
    : FALLBACK_SYMBOL_CHARS;
}

function normalizeOptions(
  input: Partial<WebtoolsPasswordOptions>
): WebtoolsPasswordOptions {
  let includeLowercase =
    typeof input.includeLowercase === "boolean"
      ? input.includeLowercase
      : DEFAULT_OPTIONS.includeLowercase;
  let includeUppercase =
    typeof input.includeUppercase === "boolean"
      ? input.includeUppercase
      : DEFAULT_OPTIONS.includeUppercase;
  let includeDigits =
    typeof input.includeDigits === "boolean"
      ? input.includeDigits
      : DEFAULT_OPTIONS.includeDigits;
  const includeSymbols =
    typeof input.includeSymbols === "boolean"
      ? input.includeSymbols
      : DEFAULT_OPTIONS.includeSymbols;
  const excludeSimilar =
    typeof input.excludeSimilar === "boolean"
      ? input.excludeSimilar
      : DEFAULT_OPTIONS.excludeSimilar;

  if (!includeLowercase && !includeUppercase && !includeDigits && !includeSymbols) {
    includeLowercase = true;
    includeUppercase = true;
    includeDigits = true;
  }

  const selectedGroupCount =
    Number(includeLowercase) +
    Number(includeUppercase) +
    Number(includeDigits) +
    Number(includeSymbols);
  const minLength = Math.max(LENGTH_MIN, selectedGroupCount);
  const length = clampInteger(
    Number(input.length ?? DEFAULT_OPTIONS.length),
    minLength,
    LENGTH_MAX
  );

  const count = clampInteger(
    Number(input.count ?? DEFAULT_OPTIONS.count),
    COUNT_MIN,
    COUNT_MAX
  );

  const symbolChars = normalizeSymbolChars(
    typeof input.symbolChars === "string"
      ? input.symbolChars
      : DEFAULT_OPTIONS.symbolChars,
    excludeSimilar
  );

  return {
    length,
    count,
    includeLowercase,
    includeUppercase,
    includeDigits,
    includeSymbols,
    symbolChars,
    excludeSimilar
  };
}

function parseOptionsFromParams(params: URLSearchParams): WebtoolsPasswordOptions {
  return normalizeOptions({
    length: Number(params.get("length") ?? DEFAULT_OPTIONS.length),
    count: Number(params.get("count") ?? DEFAULT_OPTIONS.count),
    includeLowercase: parseBooleanToken(params.get("lower") ?? "") ?? undefined,
    includeUppercase: parseBooleanToken(params.get("upper") ?? "") ?? undefined,
    includeDigits: parseBooleanToken(params.get("digits") ?? "") ?? undefined,
    includeSymbols: parseBooleanToken(params.get("symbols") ?? "") ?? undefined,
    symbolChars: params.get("symbolChars") ?? undefined,
    excludeSimilar:
      parseBooleanToken(params.get("excludeSimilar") ?? "") ?? undefined
  });
}

function parseCommand(optionsText: string | undefined): {
  action: "open" | "generate";
  options: WebtoolsPasswordOptions;
  copyResult: boolean;
} {
  if (!optionsText) {
    return {
      action: ACTION_OPEN,
      options: { ...DEFAULT_OPTIONS },
      copyResult: true
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();
  const action = actionRaw === ACTION_GENERATE ? ACTION_GENERATE : ACTION_OPEN;
  const copyToken = parseBooleanToken(params.get("copy") ?? "");

  return {
    action,
    options: parseOptionsFromParams(params),
    copyResult: copyToken === null ? true : copyToken
  };
}

function buildTarget(
  action: "open" | "generate",
  options: WebtoolsPasswordOptions
): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("length", String(options.length));
  params.set("count", String(options.count));
  params.set("lower", options.includeLowercase ? "1" : "0");
  params.set("upper", options.includeUppercase ? "1" : "0");
  params.set("digits", options.includeDigits ? "1" : "0");
  params.set("symbols", options.includeSymbols ? "1" : "0");
  params.set("symbolChars", options.symbolChars);
  params.set("excludeSimilar", options.excludeSimilar ? "1" : "0");
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseQueryOptions(query: string): WebtoolsPasswordOptions | null {
  const tokens = query
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length === 0) {
    return null;
  }

  const first = (tokens[0] ?? "").toLowerCase();
  if (!QUERY_ALIASES.includes(first)) {
    return null;
  }

  const draft: Partial<WebtoolsPasswordOptions> = {};
  const numbers: number[] = [];

  for (const token of tokens.slice(1)) {
    const normalized = token.toLowerCase();
    if (normalized.startsWith("len=") || normalized.startsWith("length=")) {
      const value = Number(normalized.split("=", 2)[1] ?? "");
      if (Number.isFinite(value)) {
        draft.length = value;
      }
      continue;
    }

    if (normalized.startsWith("count=") || normalized.startsWith("n=")) {
      const value = Number(normalized.split("=", 2)[1] ?? "");
      if (Number.isFinite(value)) {
        draft.count = value;
      }
      continue;
    }

    if (normalized === "nosymbol" || normalized === "nosymbols") {
      draft.includeSymbols = false;
      continue;
    }

    if (normalized === "exclude-similar" || normalized === "nosimilar") {
      draft.excludeSimilar = true;
      continue;
    }

    const value = Number(normalized);
    if (Number.isFinite(value)) {
      numbers.push(value);
    }
  }

  if (numbers[0] !== undefined) {
    draft.length = numbers[0];
  }
  if (numbers[1] !== undefined) {
    draft.count = numbers[1];
  }

  return normalizeOptions({ ...DEFAULT_OPTIONS, ...draft });
}

function filterSimilarChars(value: string, enabled: boolean): string {
  if (!enabled) {
    return value;
  }
  return value
    .split("")
    .filter((char) => !SIMILAR_CHARS.includes(char))
    .join("");
}

function pickRandom(value: string): string {
  const index = randomInt(0, value.length);
  return value[index] ?? value[0] ?? "";
}

function shuffle(values: string[]): void {
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i + 1);
    const temp = values[i] ?? "";
    values[i] = values[j] ?? "";
    values[j] = temp;
  }
}

function createCharGroups(options: WebtoolsPasswordOptions): string[] {
  const groups: string[] = [];
  if (options.includeLowercase) {
    groups.push(filterSimilarChars(LOWERCASE_CHARS, options.excludeSimilar));
  }
  if (options.includeUppercase) {
    groups.push(filterSimilarChars(UPPERCASE_CHARS, options.excludeSimilar));
  }
  if (options.includeDigits) {
    groups.push(filterSimilarChars(DIGIT_CHARS, options.excludeSimilar));
  }
  if (options.includeSymbols) {
    groups.push(filterSimilarChars(options.symbolChars, options.excludeSimilar));
  }

  return groups.filter(Boolean);
}

function generateOnePassword(options: WebtoolsPasswordOptions): string {
  const groups = createCharGroups(options);
  if (groups.length === 0) {
    return "";
  }

  const allChars = groups.join("");
  if (!allChars) {
    return "";
  }

  const result: string[] = [];
  for (const group of groups) {
    result.push(pickRandom(group));
  }

  while (result.length < options.length) {
    result.push(pickRandom(allChars));
  }

  shuffle(result);
  return result.join("");
}

function calcUniqueRatio(password: string): number {
  if (!password) {
    return 0;
  }
  return new Set(password.split("")).size / password.length;
}

function evaluateStrength(password: string): PasswordStrength {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (password.length >= 20) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z\d]/.test(password)) score += 1;
  if (calcUniqueRatio(password) >= 0.7) score += 1;
  if (!/(.)\1\1/.test(password)) score += 1;

  if (score <= 3) return "弱";
  if (score <= 6) return "中";
  if (score <= 8) return "强";
  return "很强";
}

function generatePasswordRows(options: WebtoolsPasswordOptions): PasswordRow[] {
  const rows: PasswordRow[] = [];
  for (let i = 0; i < options.count; i += 1) {
    const password = generateOnePassword(options);
    if (!password) {
      continue;
    }
    rows.push({
      password,
      strength: evaluateStrength(password)
    });
  }
  return rows;
}

function createCatalogItems(): LaunchItem[] {
  const iconPath = getWebtoolsIconDataUrl(PLUGIN_ID);
  return [
    {
      id: `plugin:${PLUGIN_ID}`,
      type: "command",
      title: "密码工具",
      subtitle: "随机密码生成（完整选项）",
      iconPath,
      target: buildTarget(ACTION_OPEN, DEFAULT_OPTIONS),
      keywords: [
        "plugin",
        "webtools",
        "password",
        "pwd",
        "密码",
        "随机密码",
        ...QUERY_ALIASES
      ]
    }
  ];
}

function createQueryItems(query: string): LaunchItem[] {
  const options = parseQueryOptions(query);
  if (!options) {
    return [];
  }

  const symbolText = options.includeSymbols ? "含符号" : "无符号";
  const iconPath = getWebtoolsIconDataUrl(PLUGIN_ID);
  return [
    {
      id: `plugin:${PLUGIN_ID}:open:${options.length}:${options.count}:${options.includeSymbols ? 1 : 0}:${options.excludeSimilar ? 1 : 0}`,
      type: "command",
      title: `密码工具 (${options.count}个)`,
      subtitle: `预设：长度 ${options.length} · ${symbolText}`,
      iconPath,
      target: buildTarget(ACTION_OPEN, options),
      keywords: ["plugin", "webtools", "password", "pwd", "密码"]
    }
  ];
}

export const webtoolsPasswordPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "密码工具",
  createCatalogItems,
  getQueryItems: createQueryItems,
  execute(optionsText, context): ExecuteResult {
    const command = parseCommand(optionsText);

    if (command.action === ACTION_OPEN) {
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: PLUGIN_ID,
        title: "密码工具",
        subtitle: "随机密码生成（完整选项）",
        data: {
          options: command.options
        }
      });
      return {
        ok: true,
        keepOpen: true,
        message: "已打开密码工具"
      };
    }

    const rows = generatePasswordRows(command.options);
    const passwords = rows.map((item) => item.password);
    if (command.copyResult && passwords.length > 0) {
      clipboard.writeText(passwords.join("\n"));
    }

    return {
      ok: true,
      keepOpen: true,
      message: `已生成 ${passwords.length} 个密码并复制到剪贴板`,
      data: {
        options: command.options,
        passwords,
        rows
      }
    };
  }
};
