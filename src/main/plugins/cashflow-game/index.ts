import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { CashflowStateMachine } from "./engine";
import {
  CashflowGamePersistence,
  PersistCashflowStateInput
} from "./persistence";
import { LauncherPlugin } from "../types";
import fs from "node:fs";
import path from "node:path";

const PLUGIN_ID = "cashflow-game";

const ACTION_OPEN = "open";
const ACTION_STATE = "state";
const ACTION_REPORTS = "reports";
const ACTION_NEXT_TURN = "next-turn";
const ACTION_BUY = "buy";
const ACTION_BUY_LOAN = "buy-loan";
const ACTION_SKIP = "skip";
const ACTION_RESET = "reset";
const ACTION_STAT = "stat";
const ACTION_REVIEW = "review";
const ACTION_AI = "ai";

const ICON_FILENAMES = [
  "cashflow-game.png",
  "cashflow-lite.png",
  "cashflow.png",
  "cashflow-game.webp",
  "cashflow-lite.webp",
  "cashflow.webp",
  "cashflow-game.jpg",
  "cashflow-lite.jpg",
  "cashflow.jpg"
] as const;

type CashflowAction =
  | typeof ACTION_OPEN
  | typeof ACTION_STATE
  | typeof ACTION_REPORTS
  | typeof ACTION_NEXT_TURN
  | typeof ACTION_BUY
  | typeof ACTION_BUY_LOAN
  | typeof ACTION_SKIP
  | typeof ACTION_RESET
  | typeof ACTION_STAT
  | typeof ACTION_REVIEW
  | typeof ACTION_AI;

interface CashflowCommand {
  action: CashflowAction;
  reset: boolean;
  roleKey?: string;
}

type CashflowParseResult =
  | {
      ok: true;
      command: CashflowCommand;
    }
  | {
      ok: false;
      message: string;
    };

interface CashflowQueryOptions {
  action: CashflowAction;
  reset: boolean;
  roleKey?: string;
}

const stateMachine = new CashflowStateMachine();

const JOB_BY_KEY = new Map(
  stateMachine
    .getJobPresets()
    .map((item) => [item.key.toLowerCase(), item] as const)
);

const VALID_ACTIONS = new Set<CashflowAction>([
  ACTION_OPEN,
  ACTION_STATE,
  ACTION_REPORTS,
  ACTION_NEXT_TURN,
  ACTION_BUY,
  ACTION_BUY_LOAN,
  ACTION_SKIP,
  ACTION_RESET,
  ACTION_STAT,
  ACTION_REVIEW,
  ACTION_AI
]);

const COMMAND_ALIASES = new Set([
  "cashflow",
  "cash",
  "cf",
  "xianjinliu",
  "\u73b0\u91d1\u6d41",
  "\u5bcc\u7238\u7238",
  "\u5bcc\u7238\u7238\u73b0\u91d1\u6d41"
]);

const RESET_ALIASES = new Set([
  "new",
  "reset",
  "restart",
  "again",
  "\u91cd\u5f00",
  "\u65b0\u5c40",
  "\u91cd\u65b0\u5f00\u59cb"
]);

const STAT_ALIASES = new Set(["stat", "stats", "\u7edf\u8ba1"]);
const REVIEW_ALIASES = new Set(["review", "replay", "\u590d\u76d8"]);
const AI_ALIASES = new Set(["ai", "bot", "\u5bf9\u6218"]);

const PERSIST_ACTIONS = new Set<CashflowAction>([
  ACTION_OPEN,
  ACTION_NEXT_TURN,
  ACTION_BUY,
  ACTION_BUY_LOAN,
  ACTION_SKIP,
  ACTION_RESET,
  ACTION_AI
]);

let persistence: CashflowGamePersistence | null = null;
let hydrated = false;
let hydratePromise: Promise<void> | null = null;

function resolveCashflowIconPath(): string | undefined {
  const assetsDir = path.resolve(__dirname, "../../../assets");
  for (const filename of ICON_FILENAMES) {
    const candidate = path.join(assetsDir, filename);
    if (!fs.existsSync(candidate)) {
      continue;
    }
    return candidate;
  }
  return undefined;
}

const CASHFLOW_ICON_PATH = resolveCashflowIconPath();

function parseBooleanToken(token: string): boolean | null {
  const normalized = token.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on"
  ) {
    return true;
  }

  if (
    normalized === "0" ||
    normalized === "false" ||
    normalized === "no" ||
    normalized === "off"
  ) {
    return false;
  }

  return null;
}

function parseAction(params: URLSearchParams):
  | { ok: true; action: CashflowAction }
  | { ok: false; message: string } {
  const rawAction = params.get("action");
  if (rawAction === null) {
    return { ok: true, action: ACTION_OPEN };
  }

  const action = rawAction.trim().toLowerCase();
  if (!action) {
    return { ok: true, action: ACTION_OPEN };
  }

  if (VALID_ACTIONS.has(action as CashflowAction)) {
    return { ok: true, action: action as CashflowAction };
  }

  return {
    ok: false,
    message: `无效 action 参数: ${rawAction}`
  };
}

function normalizeRoleKey(raw?: string | null): string | undefined {
  if (!raw) {
    return undefined;
  }

  const key = raw.trim().toLowerCase();
  if (!key) {
    return undefined;
  }

  return JOB_BY_KEY.has(key) ? key : undefined;
}

function parseCommand(optionsText: string | undefined): CashflowParseResult {
  if (!optionsText) {
    return {
      ok: true,
      command: { action: ACTION_OPEN, reset: false }
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionResult = parseAction(params);
  if (!actionResult.ok) {
    return actionResult;
  }

  const resetRaw = params.get("reset");
  let reset = false;
  if (resetRaw !== null) {
    const parsed = parseBooleanToken(resetRaw.trim());
    if (parsed === null) {
      return {
        ok: false,
        message: `无效 reset 参数: ${resetRaw}`
      };
    }
    reset = parsed;
  }

  const roleRaw = params.get("role");
  const jobRaw = params.get("job");
  const roleInput = roleRaw ?? jobRaw;
  let roleKey: string | undefined;
  if (roleInput !== null) {
    const normalizedRole = normalizeRoleKey(roleInput);
    if (!normalizedRole) {
      const options = Array.from(JOB_BY_KEY.keys()).join(", ");
      return {
        ok: false,
        message: `无效 role 参数: ${roleInput}，可选值: ${options}`
      };
    }
    roleKey = normalizedRole;
  }

  return {
    ok: true,
    command: {
      action: actionResult.action,
      reset,
      roleKey
    }
  };
}

function buildTarget(
  action: CashflowAction,
  options: { reset?: boolean; roleKey?: string } = {}
): string {
  const params = new URLSearchParams();
  params.set("action", action);
  if (options.reset) {
    params.set("reset", "1");
  }
  if (options.roleKey) {
    params.set("role", options.roleKey);
  }
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseQueryOptions(query: string): CashflowQueryOptions | null {
  const tokens = query
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length === 0) {
    return null;
  }

  const firstToken = (tokens[0] ?? "").toLowerCase();
  if (!COMMAND_ALIASES.has(firstToken)) {
    return null;
  }

  let action: CashflowAction = ACTION_OPEN;
  let reset = false;
  let roleKey: string | undefined;

  for (const token of tokens.slice(1)) {
    const normalized = token.toLowerCase();

    if (RESET_ALIASES.has(normalized)) {
      action = ACTION_OPEN;
      reset = true;
      continue;
    }

    if (STAT_ALIASES.has(normalized)) {
      action = ACTION_STAT;
      reset = false;
      roleKey = undefined;
      continue;
    }

    if (REVIEW_ALIASES.has(normalized)) {
      action = ACTION_REVIEW;
      reset = false;
      roleKey = undefined;
      continue;
    }

    if (AI_ALIASES.has(normalized)) {
      action = ACTION_AI;
      reset = false;
      roleKey = undefined;
      continue;
    }

    if (normalized.startsWith("role=") || normalized.startsWith("job=")) {
      const value = normalized.split("=", 2)[1] ?? "";
      roleKey = normalizeRoleKey(value);
      continue;
    }

    const asKey = normalizeRoleKey(normalized);
    if (asKey) {
      roleKey = asKey;
      continue;
    }
  }

  return { action, reset, roleKey };
}

function getJobOptions() {
  return stateMachine.getJobPresets().map((job) => ({
    key: job.key,
    role: job.role,
    salary: job.salary,
    expenses: job.expenses,
    taxRate: job.taxRate,
    initialDebt: job.initialDebt,
    debtPayment: job.debtPayment
  }));
}

function createCatalogItems(): LaunchItem[] {
  return [
    {
      id: `plugin:${PLUGIN_ID}`,
      type: "command",
      title: "\u5bcc\u7238\u7238\u73b0\u91d1\u6d41",
      subtitle:
        "\u73b0\u91d1\u6d41\u6a21\u62df\u6e38\u620f\uff1a\u63d0\u5347\u88ab\u52a8\u6536\u5165\uff0c\u76f4\u5230\u8d22\u52a1\u81ea\u7531",
      target: buildTarget(ACTION_OPEN),
      iconPath: CASHFLOW_ICON_PATH,
      keywords: [
        "plugin",
        "\u63d2\u4ef6",
        "cashflow",
        "cash",
        "cf",
        "xianjinliu",
        "\u73b0\u91d1\u6d41",
        "\u5bcc\u7238\u7238",
        "\u8d22\u5546\u6e38\u620f"
      ]
    }
  ];
}

function createQueryItems(query: string): LaunchItem[] {
  const parsed = parseQueryOptions(query);
  if (!parsed) {
    return [];
  }

  if (parsed.action === ACTION_STAT) {
    return [
      {
        id: `plugin:${PLUGIN_ID}:stat`,
        type: "command",
        title: "\u73b0\u91d1\u6d41\u7edf\u8ba1",
        subtitle: "\u67e5\u770b\u7d2f\u8ba1\u5bf9\u5c40\u3001\u80dc\u7387\u3001\u5e73\u5747\u56de\u5408",
        target: buildTarget(ACTION_STAT),
        iconPath: CASHFLOW_ICON_PATH,
        keywords: [
          "plugin",
          "cashflow",
          "cash",
          "stat",
          "stats",
          "\u7edf\u8ba1"
        ]
      }
    ];
  }

  if (parsed.action === ACTION_REVIEW) {
    return [
      {
        id: `plugin:${PLUGIN_ID}:review`,
        type: "command",
        title: "\u73b0\u91d1\u6d41\u590d\u76d8\uff08\u5f00\u53d1\u4e2d\uff09",
        subtitle: "\u540e\u7eed\u5c06\u652f\u6301\u51b3\u7b56\u65f6\u95f4\u7ebf\u4e0e\u53cd\u4e8b\u5b9e\u590d\u76d8",
        target: buildTarget(ACTION_REVIEW),
        iconPath: CASHFLOW_ICON_PATH,
        keywords: ["plugin", "cashflow", "cash", "review", "\u590d\u76d8"]
      }
    ];
  }

  if (parsed.action === ACTION_AI) {
    return [
      {
        id: `plugin:${PLUGIN_ID}:ai`,
        type: "command",
        title: "\u73b0\u91d1\u6d41 AI \u5bf9\u5c40",
        subtitle: "\u5f00\u542f AI \u73a9\u5bb6\u5e76\u884c\u63a8\u8fdb\uff0c\u5bf9\u6bd4\u8d44\u4ea7\u4e0e\u51b3\u7b56\u53d8\u5316",
        target: buildTarget(ACTION_AI),
        iconPath: CASHFLOW_ICON_PATH,
        keywords: ["plugin", "cashflow", "cash", "ai", "bot", "\u5bf9\u6218"]
      }
    ];
  }

  const selectedRole = parsed.roleKey
    ? JOB_BY_KEY.get(parsed.roleKey)?.role
    : undefined;

  return [
    {
      id: `plugin:${PLUGIN_ID}:${parsed.reset ? "reset" : "open"}${
        parsed.roleKey ? `:${parsed.roleKey}` : ""
      }`,
      type: "command",
      title: parsed.reset
        ? "\u91cd\u5f00\u73b0\u91d1\u6d41\u6e38\u620f"
        : "\u6253\u5f00\u73b0\u91d1\u6d41\u6e38\u620f",
      subtitle: parsed.reset
        ? `\u6e05\u7a7a\u5f53\u524d\u8fdb\u5ea6\uff0c\u4ece\u65b0\u5f00\u5c40${selectedRole ? `\uff08${selectedRole}\uff09` : ""}`
        : `\u8fdb\u5165\u53ef\u89c6\u5316\u9762\u677f\uff0c\u7ee7\u7eed\u5f53\u524d\u8fdb\u5ea6${selectedRole ? `\uff08\u9884\u9009\u804c\u4e1a\uff1a${selectedRole}\uff09` : ""}`,
      target: buildTarget(ACTION_OPEN, {
        reset: parsed.reset,
        roleKey: parsed.roleKey
      }),
      iconPath: CASHFLOW_ICON_PATH,
      keywords: [
        "plugin",
        "cashflow",
        "cash",
        "cf",
        "\u73b0\u91d1\u6d41",
        parsed.reset ? "reset" : "open"
      ]
    }
  ];
}

function shouldArchivePreviousGame(command: CashflowCommand): boolean {
  return (
    command.action === ACTION_RESET ||
    (command.action === ACTION_OPEN && command.reset)
  );
}

function toPersistInput(
  command: CashflowCommand,
  outcome: { message: string; state: PersistCashflowStateInput["state"] }
): PersistCashflowStateInput {
  return {
    state: outcome.state,
    action: command.action,
    message: outcome.message,
    archivePreviousActiveGame: shouldArchivePreviousGame(command)
  };
}

async function ensureHydrated(): Promise<void> {
  if (hydrated) {
    return;
  }

  if (!persistence) {
    hydrated = true;
    return;
  }

  if (hydratePromise) {
    await hydratePromise;
    return;
  }

  hydratePromise = (async () => {
    const loaded = await persistence?.loadState();
    if (loaded) {
      stateMachine.hydrate(loaded);
    }
    hydrated = true;
  })();

  try {
    await hydratePromise;
  } finally {
    hydratePromise = null;
  }
}

function defaultStatMessage(): string {
  return "\u6682\u65e0\u5bf9\u5c40\u7edf\u8ba1\u6570\u636e";
}

function createResponseData(
  state: PersistCashflowStateInput["state"],
  reports: ReturnType<CashflowStateMachine["getReports"]>["reports"],
  sourceItemId: string,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  return {
    cashflowState: state,
    cashflowReports: reports,
    cashflowJobs: getJobOptions(),
    sourceItemId,
    ...(extra ?? {})
  };
}

export function setCashflowGamePersistence(
  nextPersistence: CashflowGamePersistence | null
): void {
  persistence = nextPersistence;
  hydrated = false;
  hydratePromise = null;
}

async function execute(
  optionsText: string | undefined,
  context: Parameters<LauncherPlugin["execute"]>[1]
): Promise<ExecuteResult> {
  await ensureHydrated();

  const parsed = parseCommand(optionsText);
  if (!parsed.ok) {
    return {
      ok: false,
      keepOpen: true,
      message: parsed.message
    };
  }
  const command = parsed.command;

  if (command.action === ACTION_STAT) {
    const baseOutcome = stateMachine.getState();
    const reportOutcome = stateMachine.getReports();
    const stats = await persistence?.getStats();

    if (!stats || stats.totalGames <= 0) {
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "cashflow",
        reset: false
      });
      return {
        ok: true,
        keepOpen: true,
        message: defaultStatMessage(),
        data: createResponseData(
          baseOutcome.state,
          reportOutcome.reports,
          context.selectedItem.id,
          {
            cashflowStatsSummary: stats ?? null
          }
        )
      };
    }

    const winRate = stats.wins / Math.max(1, stats.totalGames);
    const reasonTop = stats.commonLossReasons[0];
    const reasonSummary = reasonTop
      ? ` \u00b7 \u5e38\u89c1\u5931\u8d25 ${reasonTop.reason} (${reasonTop.count} \u6b21)`
      : "";
    const message =
      `\u7d2f\u8ba1 ${stats.totalGames} \u5c40 \u00b7 ` +
      `\u80dc\u7387 ${(winRate * 100).toFixed(1)}% \u00b7 ` +
      `\u5e73\u5747\u56de\u5408 ${stats.averageTurns.toFixed(1)}` +
      reasonSummary;

    context.window.webContents.send(IPC_CHANNELS.openPanel, {
      panel: "cashflow",
      reset: false
    });

    return {
      ok: true,
      keepOpen: true,
      message,
      data: createResponseData(
        baseOutcome.state,
        reportOutcome.reports,
        context.selectedItem.id,
        {
          cashflowStatsSummary: stats
        }
      )
    };
  }

  if (command.action === ACTION_REVIEW) {
    const baseOutcome = stateMachine.getState();
    const reportOutcome = stateMachine.getReports();
    context.window.webContents.send(IPC_CHANNELS.openPanel, {
      panel: "cashflow",
      reset: false
    });

    return {
      ok: true,
      keepOpen: true,
      message:
        "\u590d\u76d8\u6a21\u5f0f\u5f00\u53d1\u4e2d\uff0c\u540e\u7eed\u4f1a\u63d0\u4f9b\u51b3\u7b56\u65f6\u95f4\u7ebf",
      data: createResponseData(
        baseOutcome.state,
        reportOutcome.reports,
        context.selectedItem.id
      )
    };
  }

  const outcome =
    command.action === ACTION_OPEN
      ? stateMachine.open(command.reset, command.roleKey)
      : command.action === ACTION_STATE
      ? stateMachine.getState()
      : command.action === ACTION_REPORTS
      ? stateMachine.getReports()
      : command.action === ACTION_NEXT_TURN
      ? stateMachine.nextTurn()
      : command.action === ACTION_AI
      ? stateMachine.enableAiMode(command.reset, command.roleKey)
      : command.action === ACTION_BUY
      ? stateMachine.buyCurrentOpportunity()
      : command.action === ACTION_BUY_LOAN
      ? stateMachine.buyCurrentOpportunityWithLoan()
      : command.action === ACTION_SKIP
      ? stateMachine.skipCurrentOpportunity()
      : stateMachine.reset(command.roleKey);

  const reportOutcome = stateMachine.getReports();

  if (PERSIST_ACTIONS.has(command.action)) {
    const payload = toPersistInput(command, outcome);
    try {
      await persistence?.saveState(payload);
    } catch (error) {
      console.warn("[cashflow] save state failed", error);
    }
  }

  if (command.action === ACTION_OPEN || command.action === ACTION_AI) {
    context.window.webContents.send(IPC_CHANNELS.openPanel, {
      panel: "cashflow",
      reset: command.reset,
      role: command.roleKey ?? null
    });
  }

  return {
    ok: true,
    keepOpen: true,
    message: outcome.message,
    data: createResponseData(
      outcome.state,
      reportOutcome.reports,
      context.selectedItem.id
    )
  };
}

export const cashflowGamePlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "\u5bcc\u7238\u7238\u73b0\u91d1\u6d41",
  createCatalogItems,
  getQueryItems: createQueryItems,
  execute
};

export type { CashflowGamePersistence } from "./persistence";
export { CashflowDatabasePersistence } from "./persistence";
