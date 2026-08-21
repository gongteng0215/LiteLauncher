import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { LiteDatabase } from "../main/database";
import { CashflowStateMachine } from "../main/plugins/cashflow-game/engine/state-machine";
import { CashflowState } from "../main/plugins/cashflow-game/engine/types";
import { CashflowDatabasePersistence } from "../main/plugins/cashflow-game/persistence";

async function withMockRandom<T>(
  values: number[],
  runner: () => T | Promise<T>
): Promise<T> {
  const originalRandom = Math.random;
  let index = 0;

  Math.random = () => {
    const fallback = values.length > 0 ? values[values.length - 1] : 0.5;
    const value = values[index] ?? fallback;
    index += 1;
    return value;
  };

  try {
    return await runner();
  } finally {
    Math.random = originalRandom;
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
}

function hashState(state: CashflowState): string {
  return createHash("sha256").update(stableStringify(state)).digest("hex");
}

async function withTempPersistence(
  runner: (persistence: CashflowDatabasePersistence) => Promise<void>
): Promise<void> {
  const tempDir = path.join(os.tmpdir(), `litelauncher-cashflow-${randomUUID()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  const dbPath = path.join(tempDir, "cashflow-test.db");
  const db = new LiteDatabase(dbPath);
  await db.init();

  try {
    const persistence = new CashflowDatabasePersistence(db);
    await runner(persistence);
  } finally {
    await db.close().catch(() => undefined);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

test("cashflow persistence keeps snapshot hash stable after save/load", async () => {
  await withTempPersistence(async (persistence) => {
    const machine = new CashflowStateMachine();
    await withMockRandom([0.2, 0.9, 0.4, 0.8], async () => {
      machine.reset("doctor");
      machine.nextTurn();
      machine.buyCurrentOpportunityWithLoan();
      machine.nextTurn();
    });

    const expected = machine.getState().state;
    await persistence.saveState({
      state: expected,
      action: "test-save",
      message: "测试存档",
      archivePreviousActiveGame: true
    });

    const loaded = await persistence.loadState();
    assert.ok(loaded, "读取存档后应返回状态");
    assert.equal(hashState(loaded), hashState(expected));
    assert.deepEqual(loaded, expected);
  });
});

test("archiving previous active game loads the latest snapshot", async () => {
  await withTempPersistence(async (persistence) => {
    const machine = new CashflowStateMachine();

    await withMockRandom([0.1], async () => {
      machine.reset("cleaner");
    });
    const first = machine.getState().state;
    await persistence.saveState({
      state: first,
      action: "test-first",
      message: "第一局",
      archivePreviousActiveGame: true
    });

    await withMockRandom([0.7], async () => {
      machine.reset("doctor");
    });
    const second = machine.getState().state;
    await persistence.saveState({
      state: second,
      action: "test-second",
      message: "第二局",
      archivePreviousActiveGame: true
    });

    const loaded = await persistence.loadState();
    assert.ok(loaded, "应读取到最新 active 存档");
    assert.deepEqual(loaded, second);

    const stats = await persistence.getStats();
    assert.equal(stats.totalGames, 2);
    assert.equal(stats.latestRole, second.role);
    assert.equal(stats.latestTurn, second.turn);
    assert.deepEqual(stats.commonLossReasons, []);

    const reviewHistory = await persistence.getReviewHistory();
    assert.equal(reviewHistory.length, 2);
    assert.equal(reviewHistory[0]?.state.role, second.role);
    assert.equal(reviewHistory[0]?.status, "active");
    assert.equal(reviewHistory[1]?.state.role, first.role);
    assert.equal(reviewHistory[1]?.status, "archived");
    assert.equal(reviewHistory[0]?.decisions.length, 1);
    assert.equal(reviewHistory[0]?.decisions[0]?.message, "第二局");
    assert.equal(reviewHistory[0]?.checkpoints.length, 1);
    assert.equal(reviewHistory[0]?.checkpoints[0]?.cash, second.cash);
  });
});

test("stats summary includes top loss reasons", async () => {
  await withTempPersistence(async (persistence) => {
    const machine = new CashflowStateMachine();
    const base = machine.reset("cleaner").state;

    const lossReasonA = "现金流断裂：现金耗尽且每月净现金流为负，无法继续周转";
    const lossReasonB = "触发破产：现金跌破 ¥-20,000";

    const states: CashflowState[] = [
      {
        ...base,
        turn: 6,
        won: false,
        lost: true,
        lossReason: lossReasonA,
        cash: 0,
        passiveIncome: 0,
        expenses: 7000,
        debtPayment: 900,
        currentOpportunity: null
      },
      {
        ...base,
        turn: 7,
        won: false,
        lost: true,
        lossReason: lossReasonA,
        cash: -100,
        passiveIncome: 0,
        expenses: 7200,
        debtPayment: 950,
        currentOpportunity: null
      },
      {
        ...base,
        turn: 9,
        won: false,
        lost: true,
        lossReason: lossReasonB,
        cash: -22000,
        passiveIncome: 300,
        expenses: 7600,
        debtPayment: 1200,
        currentOpportunity: null
      }
    ];

    for (const [index, state] of states.entries()) {
      await persistence.saveState({
        state,
        action: `test-loss-${index + 1}`,
        message: "save loss snapshot",
        archivePreviousActiveGame: true
      });
    }

    const stats = await persistence.getStats();
    assert.equal(stats.totalGames, 3);
    assert.equal(stats.commonLossReasons.length, 2);
    assert.deepEqual(stats.commonLossReasons[0], { reason: lossReasonA, count: 2 });
    assert.deepEqual(stats.commonLossReasons[1], { reason: lossReasonB, count: 1 });
  });
});

test("old single-AI snapshots stay deduplicated across persistence round trips", async () => {
  await withTempPersistence(async (persistence) => {
    const machine = new CashflowStateMachine();
    const aiState = machine.enableAiMode(false, "programmer").state;
    const legacyState: CashflowState = {
      ...aiState,
      aiPlayers: [aiState.aiPlayers[0]!, { ...aiState.aiPlayers[0]!, id: "legacy-copy" }]
    };
    await persistence.saveState({
      state: legacyState,
      action: "legacy-save",
      message: "旧单 AI 存档",
      archivePreviousActiveGame: true
    });

    for (let round = 0; round < 3; round += 1) {
      const loaded = await persistence.loadState();
      assert.ok(loaded);
      machine.hydrate(loaded);
      const migrated = machine.getState().state;
      assert.equal(migrated.aiPlayers.length, 3);
      assert.equal(new Set(migrated.aiPlayers.map((player) => player.profileKey)).size, 3);
      await persistence.saveState({
        state: migrated,
        action: `migration-round-${round + 1}`,
        message: "AI 性格兼容迁移",
        archivePreviousActiveGame: false
      });
    }

    const finalState = await persistence.loadState();
    assert.ok(finalState);
    assert.equal(finalState.aiPlayers.length, 3);
    assert.equal(new Set(finalState.aiPlayers.map((player) => player.profileKey)).size, 3);
    const reviewHistory = await persistence.getReviewHistory();
    assert.equal(reviewHistory.length, 1, "migration saves must update the active game in place");
  });
});

test("review history returns only the newest twelve games without losing lifetime stats", async () => {
  await withTempPersistence(async (persistence) => {
    const machine = new CashflowStateMachine();
    const base = machine.reset("cleaner").state;

    for (let index = 1; index <= 14; index += 1) {
      const state: CashflowState = {
        ...base,
        turn: index,
        cash: base.cash + index * 100,
        logs: [`第 ${index} 局`]
      };
      await persistence.saveState({
        state,
        action: `game-${index}`,
        message: `第 ${index} 局`,
        archivePreviousActiveGame: true
      });
    }

    const history = await persistence.getReviewHistory();
    assert.equal(history.length, 12);
    assert.equal(history[0]?.currentTurn, 14);
    assert.equal(history[0]?.status, "active");
    assert.equal(history[11]?.currentTurn, 3);
    assert.ok(history.slice(1).every((game) => game.status === "archived"));
    assert.equal(new Set(history.map((game) => game.id)).size, 12);

    const stats = await persistence.getStats();
    assert.equal(stats.totalGames, 14, "review limit must not delete lifetime game statistics");
  });
});
