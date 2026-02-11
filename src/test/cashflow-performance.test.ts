import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import test from "node:test";

import { LaunchItem } from "../shared/types";
import { executePluginCommand } from "../main/plugins";
import { setCashflowGamePersistence } from "../main/plugins/cashflow-game";
import { CashflowStateMachine } from "../main/plugins/cashflow-game/engine/state-machine";

type Metrics = {
  average: number;
  p95: number;
  max: number;
};

type SentMessage = {
  channel: string;
  payload: unknown;
};

const OPEN_PANEL_THRESHOLD_MS = 150;
const NEXT_TURN_THRESHOLD_MS = 30;

async function withMockRandom<T>(
  value: number,
  runner: () => T | Promise<T>
): Promise<T> {
  const originalRandom = Math.random;
  Math.random = () => value;
  try {
    return await runner();
  } finally {
    Math.random = originalRandom;
  }
}

function createSelectedItem(): LaunchItem {
  return {
    id: "plugin:cashflow-game:perf",
    type: "command",
    title: "现金流性能测试",
    subtitle: "性能基准",
    target: "command:plugin:cashflow-game",
    keywords: ["cashflow", "performance"]
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

function percentile(values: number[], ratio: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * ratio) - 1)
  );
  return sorted[index] ?? sorted[sorted.length - 1] ?? 0;
}

async function benchmarkAsync(
  iterations: number,
  runner: () => Promise<void>
): Promise<Metrics> {
  const samples: number[] = [];
  for (let i = 0; i < iterations; i += 1) {
    const start = performance.now();
    await runner();
    const elapsed = performance.now() - start;
    samples.push(elapsed);
  }

  const total = samples.reduce((sum, value) => sum + value, 0);
  return {
    average: total / Math.max(1, samples.length),
    p95: percentile(samples, 0.95),
    max: Math.max(...samples)
  };
}

function benchmarkSync(iterations: number, runner: () => void): Metrics {
  const samples: number[] = [];
  for (let i = 0; i < iterations; i += 1) {
    const start = performance.now();
    runner();
    const elapsed = performance.now() - start;
    samples.push(elapsed);
  }

  const total = samples.reduce((sum, value) => sum + value, 0);
  return {
    average: total / Math.max(1, samples.length),
    p95: percentile(samples, 0.95),
    max: Math.max(...samples)
  };
}

test("cashflow panel open latency stays under threshold", async () => {
  setCashflowGamePersistence(null);
  const selectedItem = createSelectedItem();
  const { window } = createMockWindow();

  await withMockRandom(0.5, async () => {
    await executePluginCommand(
      "cashflow-game?action=open&reset=1&role=cleaner",
      window as never,
      selectedItem
    );

    const metrics = await benchmarkAsync(120, async () => {
      await executePluginCommand(
        "cashflow-game?action=open",
        window as never,
        selectedItem
      );
    });

    console.info(
      `[cashflow:perf] open-panel avg=${metrics.average.toFixed(2)}ms p95=${metrics.p95.toFixed(
        2
      )}ms max=${metrics.max.toFixed(2)}ms`
    );

    assert.ok(
      metrics.p95 < OPEN_PANEL_THRESHOLD_MS,
      `打开面板 p95=${metrics.p95.toFixed(2)}ms，超过阈值 ${OPEN_PANEL_THRESHOLD_MS}ms`
    );
  });
});

test("cashflow single turn compute latency stays under threshold", async () => {
  const machine = new CashflowStateMachine();

  await withMockRandom(0.99, async () => {
    machine.reset("cleaner");

    const metrics = benchmarkSync(1000, () => {
      const state = machine.getState().state;
      if (state.won || state.lost) {
        machine.reset("cleaner");
      }
      machine.nextTurn();
    });

    console.info(
      `[cashflow:perf] next-turn avg=${metrics.average.toFixed(2)}ms p95=${metrics.p95.toFixed(
        2
      )}ms max=${metrics.max.toFixed(2)}ms`
    );

    assert.ok(
      metrics.p95 < NEXT_TURN_THRESHOLD_MS,
      `单回合计算 p95=${metrics.p95.toFixed(2)}ms，超过阈值 ${NEXT_TURN_THRESHOLD_MS}ms`
    );
  });
});
