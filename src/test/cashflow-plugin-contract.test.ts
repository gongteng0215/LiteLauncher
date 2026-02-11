import assert from "node:assert/strict";
import test from "node:test";

import { IPC_CHANNELS } from "../shared/channels";
import { LaunchItem } from "../shared/types";
import { setCashflowGamePersistence } from "../main/plugins/cashflow-game";
import { executePluginCommand } from "../main/plugins";
import type { CashflowGamePersistence } from "../main/plugins/cashflow-game";

type SentMessage = {
  channel: string;
  payload: unknown;
};

function createSelectedItem(): LaunchItem {
  return {
    id: "plugin:cashflow-game:test",
    type: "command",
    title: "现金流测试",
    subtitle: "插件合约测试",
    target: "command:plugin:cashflow-game",
    keywords: ["cashflow", "test"]
  };
}

function createMockWindow(): {
  window: { webContents: { send: (channel: string, payload: unknown) => void } };
  sent: SentMessage[];
} {
  const sent: SentMessage[] = [];
  return {
    window: {
      webContents: {
        send(channel: string, payload: unknown): void {
          sent.push({ channel, payload });
        }
      }
    },
    sent
  };
}

test("plugin command returns stable error when plugin id is missing", async () => {
  const { window } = createMockWindow();
  const result = await executePluginCommand(
    undefined,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, false);
  assert.match(result.message ?? "", /插件标识/);
});

test("plugin command returns stable error when plugin does not exist", async () => {
  const { window } = createMockWindow();
  const result = await executePluginCommand(
    "unknown-plugin",
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, false);
  assert.match(result.message ?? "", /插件不存在/);
});

test("cashflow plugin validates action/reset/role parameters", async () => {
  setCashflowGamePersistence(null);
  const selectedItem = createSelectedItem();

  {
    const { window, sent } = createMockWindow();
    const result = await executePluginCommand(
      "cashflow-game?action=invalid-action",
      window as never,
      selectedItem
    );
    assert.equal(result.ok, false);
    assert.match(result.message ?? "", /action/);
    assert.equal(sent.length, 0);
  }

  {
    const { window, sent } = createMockWindow();
    const result = await executePluginCommand(
      "cashflow-game?action=open&reset=maybe",
      window as never,
      selectedItem
    );
    assert.equal(result.ok, false);
    assert.match(result.message ?? "", /reset/);
    assert.equal(sent.length, 0);
  }

  {
    const { window, sent } = createMockWindow();
    const result = await executePluginCommand(
      "cashflow-game?action=reset&role=not-a-role",
      window as never,
      selectedItem
    );
    assert.equal(result.ok, false);
    assert.match(result.message ?? "", /role/);
    assert.equal(sent.length, 0);
  }
});

test("cashflow plugin returns structured data for valid open command", async () => {
  setCashflowGamePersistence(null);
  const selectedItem = createSelectedItem();
  const { window, sent } = createMockWindow();
  const result = await executePluginCommand(
    "cashflow-game?action=open&reset=1&role=doctor",
    window as never,
    selectedItem
  );

  assert.equal(result.ok, true);
  assert.equal(result.keepOpen, true);
  const data = (result.data ?? {}) as Record<string, unknown>;
  assert.ok(data.cashflowState);
  assert.ok(data.cashflowReports);
  assert.ok(data.cashflowJobs);
  assert.equal(sent.length, 1);
  assert.equal(sent[0]?.channel, IPC_CHANNELS.openPanel);
});

test("cashflow stat includes common loss reason summary", async () => {
  const mockPersistence: CashflowGamePersistence = {
    async loadState() {
      return null;
    },
    async saveState() {
      return undefined;
    },
    async getStats() {
      return {
        totalGames: 8,
        wins: 3,
        averageTurns: 12.5,
        latestRole: "医生",
        latestTurn: 9,
        latestCash: 8000,
        commonLossReasons: [
          {
            reason: "现金流断裂：现金耗尽且每月净现金流为负，无法继续周转",
            count: 4
          }
        ]
      };
    }
  };

  setCashflowGamePersistence(mockPersistence);
  try {
    const selectedItem = createSelectedItem();
    const { window, sent } = createMockWindow();
    const result = await executePluginCommand(
      "cashflow-game?action=stat",
      window as never,
      selectedItem
    );

    assert.equal(result.ok, true);
    assert.equal(result.keepOpen, true);
    assert.match(result.message ?? "", /常见失败/);
    assert.equal(sent.length, 1);
    assert.equal(sent[0]?.channel, IPC_CHANNELS.openPanel);

    const data = (result.data ?? {}) as Record<string, unknown>;
    const summary = data.cashflowStatsSummary as
      | { commonLossReasons?: Array<{ reason: string; count: number }> }
      | undefined;
    assert.ok(summary);
    assert.equal(summary?.commonLossReasons?.[0]?.count, 4);
  } finally {
    setCashflowGamePersistence(null);
  }
});

test("cashflow ai action enables ai mode and returns ai players", async () => {
  setCashflowGamePersistence(null);
  const selectedItem = createSelectedItem();
  const { window, sent } = createMockWindow();
  const result = await executePluginCommand(
    "cashflow-game?action=ai",
    window as never,
    selectedItem
  );

  assert.equal(result.ok, true);
  assert.equal(result.keepOpen, true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0]?.channel, IPC_CHANNELS.openPanel);

  const data = (result.data ?? {}) as Record<string, unknown>;
  const state = data.cashflowState as
    | { aiEnabled?: boolean; aiPlayers?: unknown[] }
    | undefined;
  assert.equal(state?.aiEnabled, true);
  assert.ok(Array.isArray(state?.aiPlayers));
  assert.ok((state?.aiPlayers?.length ?? 0) >= 1);
});
