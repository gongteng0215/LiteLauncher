import { randomInt } from "node:crypto";
import { clipboard } from "electron";

import { IPC_CHANNELS } from "../../../shared/channels";
import {
  ExecuteResult,
  LaunchItem,
  PasswordGeneratorOptions
} from "../../../shared/types";
import { LauncherPlugin } from "../types";

const PLUGIN_ID = "password-generator";
const ACTION_OPEN = "open";
const ACTION_GENERATE = "generate";

type PasswordAction = typeof ACTION_OPEN | typeof ACTION_GENERATE;

type PasswordCommand = {
  action: PasswordAction;
  options: PasswordGeneratorOptions;
};

const DEFAULT_OPTIONS: PasswordGeneratorOptions = {
  length: 16,
  includeSymbols: true,
  count: 1
};

const LENGTH_MAX = 64;
const COUNT_MIN = 1;
const COUNT_MAX = 20;

const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGIT_CHARS = "0123456789";
const SYMBOL_CHARS = "!@#$%^&*()-_=+[]{}:;,.?/|~";

const COMMAND_ALIASES = new Set([
  "pwd",
  "pw",
  "pass",
  "password",
  "mima",
  "\u5bc6\u7801"
]);

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

function normalizeOptions(input: PasswordGeneratorOptions): PasswordGeneratorOptions {
  const includeSymbols = Boolean(input.includeSymbols);
  const requiredGroups = includeSymbols ? 4 : 3;
  const length = clampInteger(input.length, requiredGroups, LENGTH_MAX);
  const count = clampInteger(input.count, COUNT_MIN, COUNT_MAX);

  return {
    length,
    includeSymbols,
    count
  };
}

function parseBooleanToken(token: string): boolean | null {
  const normalized = token.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (
    normalized === "1" ||
    normalized === "y" ||
    normalized === "yes" ||
    normalized === "true" ||
    normalized === "on" ||
    normalized === "symbol" ||
    normalized === "symbols" ||
    normalized === "special" ||
    normalized === "\u7279\u6b8a" ||
    normalized === "\u7b26\u53f7"
  ) {
    return true;
  }

  if (
    normalized === "0" ||
    normalized === "n" ||
    normalized === "no" ||
    normalized === "false" ||
    normalized === "off" ||
    normalized === "nosymbol" ||
    normalized === "nosymbols" ||
    normalized === "nospecial" ||
    normalized === "\u65e0\u7b26\u53f7" ||
    normalized === "\u4e0d\u542b\u7b26\u53f7" ||
    normalized === "\u7eaf\u5b57\u6bcd\u6570\u5b57"
  ) {
    return false;
  }

  return null;
}

function parseNumber(token: string): number | null {
  if (!/^\d+$/.test(token)) {
    return null;
  }

  return Number(token);
}

function parseKeyValueToken(
  token: string,
  options: PasswordGeneratorOptions
): boolean {
  const eqIndex = token.indexOf("=");
  if (eqIndex <= 0 || eqIndex >= token.length - 1) {
    return false;
  }

  const key = token.slice(0, eqIndex).trim().toLowerCase();
  const value = token.slice(eqIndex + 1).trim();
  if (!key || !value) {
    return false;
  }

  if (
    key === "len" ||
    key === "length" ||
    key === "l" ||
    key === "\u957f\u5ea6"
  ) {
    const parsed = parseNumber(value);
    if (parsed === null) {
      return false;
    }
    options.length = parsed;
    return true;
  }

  if (
    key === "count" ||
    key === "c" ||
    key === "n" ||
    key === "\u6570\u91cf"
  ) {
    const parsed = parseNumber(value);
    if (parsed === null) {
      return false;
    }
    options.count = parsed;
    return true;
  }

  if (
    key === "symbol" ||
    key === "symbols" ||
    key === "special" ||
    key === "s" ||
    key === "\u7b26\u53f7"
  ) {
    const parsed = parseBooleanToken(value);
    if (parsed === null) {
      return false;
    }
    options.includeSymbols = parsed;
    return true;
  }

  return false;
}

function parseQueryOptions(query: string): PasswordGeneratorOptions | null {
  const tokens = query
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length === 0) {
    return null;
  }

  const commandToken = (tokens[0] ?? "").toLowerCase();
  if (!COMMAND_ALIASES.has(commandToken)) {
    return null;
  }

  const options: PasswordGeneratorOptions = { ...DEFAULT_OPTIONS };
  const positionalNumbers: number[] = [];

  for (const token of tokens.slice(1)) {
    if (parseKeyValueToken(token, options)) {
      continue;
    }

    const boolValue = parseBooleanToken(token);
    if (boolValue !== null) {
      options.includeSymbols = boolValue;
      continue;
    }

    const numberValue = parseNumber(token);
    if (numberValue !== null) {
      positionalNumbers.push(numberValue);
      continue;
    }
  }

  if (positionalNumbers[0] !== undefined) {
    options.length = positionalNumbers[0];
  }

  if (positionalNumbers[1] !== undefined) {
    options.count = positionalNumbers[1];
  }

  return normalizeOptions(options);
}

function parseOptionsFromParams(
  params: URLSearchParams
): PasswordGeneratorOptions {
  const options: PasswordGeneratorOptions = { ...DEFAULT_OPTIONS };

  const lengthRaw = params.get("length");
  if (lengthRaw) {
    const parsed = Number(lengthRaw);
    if (Number.isFinite(parsed)) {
      options.length = parsed;
    }
  }

  const countRaw = params.get("count");
  if (countRaw) {
    const parsed = Number(countRaw);
    if (Number.isFinite(parsed)) {
      options.count = parsed;
    }
  }

  const symbolsRaw = params.get("symbols");
  if (symbolsRaw) {
    const parsed = parseBooleanToken(symbolsRaw);
    if (parsed !== null) {
      options.includeSymbols = parsed;
    }
  }

  return normalizeOptions(options);
}

function parseAction(params: URLSearchParams): PasswordAction {
  const action = (params.get("action") ?? "").trim().toLowerCase();
  if (action === ACTION_GENERATE) {
    return ACTION_GENERATE;
  }
  return ACTION_OPEN;
}

function parseCommand(optionsText: string | undefined): PasswordCommand {
  if (!optionsText) {
    return {
      action: ACTION_OPEN,
      options: { ...DEFAULT_OPTIONS }
    };
  }

  const params = new URLSearchParams(optionsText);
  return {
    action: parseAction(params),
    options: parseOptionsFromParams(params)
  };
}

function buildTarget(
  action: PasswordAction,
  options: PasswordGeneratorOptions
): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("length", String(options.length));
  params.set("count", String(options.count));
  params.set("symbols", options.includeSymbols ? "1" : "0");
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function pickRandom(text: string): string {
  const index = randomInt(0, text.length);
  return text[index] ?? text[0] ?? "";
}

function shuffle(chars: string[]): void {
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i + 1);
    const current = chars[i] ?? "";
    chars[i] = chars[j] ?? "";
    chars[j] = current;
  }
}

function generateOnePassword(options: PasswordGeneratorOptions): string {
  const groups = [LOWERCASE_CHARS, UPPERCASE_CHARS, DIGIT_CHARS];
  if (options.includeSymbols) {
    groups.push(SYMBOL_CHARS);
  }

  const allChars = groups.join("");
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

function generatePasswords(options: PasswordGeneratorOptions): string[] {
  const result: string[] = [];
  for (let i = 0; i < options.count; i += 1) {
    result.push(generateOnePassword(options));
  }
  return result;
}

function createCatalogItems(): LaunchItem[] {
  return [
    {
      id: `plugin:${PLUGIN_ID}`,
      type: "command",
      title: "\u5bc6\u7801\u751f\u6210\u5668",
      subtitle:
        "\u6253\u5f00\u53ef\u89c6\u5316\u9762\u677f\uff0c\u914d\u7f6e\u957f\u5ea6\u3001\u6570\u91cf\u3001\u7279\u6b8a\u7b26\u53f7\u540e\u751f\u6210",
      target: buildTarget(ACTION_OPEN, DEFAULT_OPTIONS),
      keywords: [
        "plugin",
        "\u63d2\u4ef6",
        "password",
        "generator",
        "pwd",
        "pass",
        "pw",
        "\u5bc6\u7801",
        "\u53e3\u4ee4",
        "\u968f\u673a\u5bc6\u7801",
        "mima"
      ]
    }
  ];
}

function createQueryItems(query: string): LaunchItem[] {
  const options = parseQueryOptions(query);
  if (!options) {
    return [];
  }

  const symbolsText = options.includeSymbols ? "\u5f00" : "\u5173";
  const id =
    `plugin:${PLUGIN_ID}:open:length${options.length}:count${options.count}:symbols${options.includeSymbols ? 1 : 0}`;

  return [
    {
      id,
      type: "command",
      title: `\u6253\u5f00\u5bc6\u7801\u751f\u6210\u5668 (${options.count} \u4e2a)` ,
      subtitle:
        `\u9884\u8bbe\uff1a\u957f\u5ea6 ${options.length} \u00b7 \u7279\u6b8a\u7b26\u53f7 ${symbolsText}`,
      target: buildTarget(ACTION_OPEN, options),
      keywords: [
        "plugin",
        "\u5bc6\u7801",
        "\u968f\u673a\u5bc6\u7801",
        "pwd",
        "password",
        String(options.length),
        String(options.count)
      ]
    }
  ];
}

async function execute(
  optionsText: string | undefined,
  context: Parameters<LauncherPlugin["execute"]>[1]
): Promise<ExecuteResult> {
  const command = parseCommand(optionsText);

  if (command.action === ACTION_OPEN) {
    context.window.webContents.send(IPC_CHANNELS.openPanel, {
      panel: "password",
      draft: command.options
    });
    return {
      ok: true,
      keepOpen: true,
      message: "\u5df2\u6253\u5f00\u5bc6\u7801\u751f\u6210\u5668"
    };
  }

  const passwords = generatePasswords(command.options);
  clipboard.writeText(passwords.join("\n"));

  const symbolsText = command.options.includeSymbols
    ? "\u542b\u7279\u6b8a\u7b26\u53f7"
    : "\u4e0d\u542b\u7279\u6b8a\u7b26\u53f7";

  return {
    ok: true,
    keepOpen: true,
    message: `\u5df2\u751f\u6210 ${command.options.count} \u4e2a\u5bc6\u7801\uff08\u957f\u5ea6 ${command.options.length}\uff0c${symbolsText}\uff09\u5e76\u590d\u5236\u5230\u526a\u8d34\u677f`,
    data: {
      passwords,
      options: command.options,
      sourceItemId: context.selectedItem.id
    }
  };
}

export const passwordGeneratorPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "\u5bc6\u7801\u751f\u6210\u5668",
  createCatalogItems,
  getQueryItems: createQueryItems,
  execute
};
