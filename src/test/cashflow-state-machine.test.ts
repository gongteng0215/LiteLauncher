import assert from "node:assert/strict";
import test from "node:test";

import {
  CASHFLOW_BIG_DEALS,
  CASHFLOW_OPPORTUNITIES
} from "../main/plugins/cashflow-game/config";
import { CashflowStateMachine } from "../main/plugins/cashflow-game/engine/state-machine";
import { CashflowState } from "../main/plugins/cashflow-game/engine/types";

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

function monthlyNetByState(state: CashflowState): number {
  const salaryAfterTax = Math.max(0, Math.round(state.salary * (1 - state.taxRate)));
  return salaryAfterTax + state.passiveIncome - (state.expenses + state.debtPayment);
}

test("reset supports preferred role and role attributes", () => {
  const machine = new CashflowStateMachine();
  const outcome = machine.reset("doctor");

  assert.equal(outcome.state.jobKey, "doctor");
  assert.equal(outcome.state.taxRate, 0.3);
  assert.equal(outcome.state.debt, 180000);
  assert.equal(outcome.state.debtPayment, 3200);
  assert.equal(outcome.state.lost, false);
  assert.equal(outcome.state.phase, "rat-race");
});

test("next turn uses tax-adjusted salary and total expenses when no event occurs", async () => {
  const machine = new CashflowStateMachine();
  const reset = machine.reset("cleaner");
  const before = reset.state;
  const expectedMonthlyNet = monthlyNetByState(before);
  const expectedDebt = Math.max(0, before.debt - Math.round(before.debtPayment * 0.35));

  const outcome = await withMockRandom([0.99], () => machine.nextTurn());
  const after = outcome.state;

  assert.equal(after.cash, before.cash + expectedMonthlyNet);
  assert.equal(after.debt, expectedDebt);
  assert.equal(after.debtPayment, before.debtPayment);
});

test("event system applies weighted event fields to cash, debt and debt payment", async () => {
  const machine = new CashflowStateMachine();
  const reset = machine.reset("cleaner");
  const before = reset.state;
  const monthlyNet = monthlyNetByState(before);

  const outcome = await withMockRandom([0.2, 0.99], () => machine.nextTurn());
  const after = outcome.state;

  assert.equal(after.cash, before.cash + monthlyNet + 1000);
  assert.equal(after.debt, 5430);
  assert.equal(after.debtPayment, 280);
  assert.ok(after.logs.length > 0);
});

test("loan buy is available when cash is insufficient and updates liabilities", async () => {
  const machine = new CashflowStateMachine();
  const base = machine.reset("cleaner").state;
  const state: CashflowState = {
    ...base,
    cash: 8500,
    currentOpportunity: {
      id: "parking_space-manual-1",
      key: "parking_space",
      tier: "medium",
      dealClass: "normal",
      title: "停车位出租",
      description: "一次性购入后出租，现金流温和",
      cost: 12000,
      cashflow: 980
    },
    won: false,
    lost: false,
    lossReason: null
  };
  machine.hydrate(state);

  assert.equal(state.currentOpportunity?.key, "parking_space");
  assert.equal(state.currentOpportunity?.cost, 12000);
  assert.equal(state.cash, 8500);

  const insufficient = machine.buyCurrentOpportunity();
  assert.equal(insufficient.state.cash, state.cash);

  const loanBuy = machine.buyCurrentOpportunityWithLoan();
  const after = loanBuy.state;

  assert.equal(after.cash, 0);
  assert.equal(after.passiveIncome, 980);
  assert.equal(after.debt, 6500);
  assert.equal(after.debtPayment, 320);
  assert.equal(after.assets.length, 1);
  assert.equal(after.assets[0]?.key, "parking_space");
  assert.equal(after.assets[0]?.count, 1);
});

test("cashflow break failure is detected after hydrate", () => {
  const machine = new CashflowStateMachine();
  const base = machine.reset("cleaner").state;

  const doomed: CashflowState = {
    ...base,
    cash: 0,
    passiveIncome: 0,
    expenses: 7000,
    debtPayment: 800,
    won: false,
    lost: false,
    lossReason: null,
    currentOpportunity: null
  };

  machine.hydrate(doomed);
  const outcome = machine.getState();

  assert.equal(outcome.state.lost, true);
  assert.match(outcome.message, /现金流断裂|失败/);
});

test("phase transitions to freedom when passive income covers basic expenses", () => {
  const machine = new CashflowStateMachine();
  const base = machine.reset("doctor").state;

  const transitionReady: CashflowState = {
    ...base,
    phase: "rat-race",
    passiveIncome: base.expenses + 500,
    debtPayment: base.debtPayment + 800,
    won: false,
    lost: false,
    lossReason: null
  };

  machine.hydrate(transitionReady);
  const outcome = machine.getState();

  assert.equal(outcome.state.phase, "freedom-phase");
  assert.equal(outcome.state.won, false);
});

test("freedom phase opportunities are scaled up", async () => {
  const machine = new CashflowStateMachine();
  const base = machine.reset("cleaner").state;

  const freedomState: CashflowState = {
    ...base,
    phase: "freedom-phase",
    currentOpportunity: null,
    won: false,
    lost: false,
    lossReason: null
  };

  machine.hydrate(freedomState);

  const outcome = await withMockRandom([0.99, 0.9, 0], () => machine.nextTurn());
  const opportunity = outcome.state.currentOpportunity;
  assert.ok(opportunity, "freedom phase should generate a new opportunity");

  const template = CASHFLOW_OPPORTUNITIES.find(
    (item) => item.key === opportunity?.key
  );
  assert.ok(template, "template should exist for generated opportunity");
  assert.ok(
    (opportunity?.cost ?? 0) > (template?.cost ?? 0),
    "freedom phase should increase opportunity cost"
  );
  assert.ok(
    (opportunity?.cashflow ?? 0) > (template?.cashflow ?? 0),
    "freedom phase should increase opportunity cashflow"
  );
});

test("big deal uses dedicated pool when spawn probability is hit", async () => {
  const machine = new CashflowStateMachine();
  const outcome = await withMockRandom([0.01, 0], () => machine.reset("cleaner"));
  const opportunity = outcome.state.currentOpportunity;

  assert.ok(opportunity, "should generate current opportunity");
  assert.equal(opportunity?.dealClass, "big-deal");
  assert.equal(opportunity?.key, CASHFLOW_BIG_DEALS[0]?.key);
});

test("buying big deal can trigger downside settlement", async () => {
  const machine = new CashflowStateMachine();
  const base = machine.reset("doctor").state;
  const template = CASHFLOW_BIG_DEALS[0];
  assert.ok(template, "big deal template should exist");

  const scenario: CashflowState = {
    ...base,
    phase: "rat-race",
    cash: 200000,
    currentOpportunity: {
      id: `${template.key}-manual-1`,
      key: template.key,
      tier: template.tier,
      dealClass: "big-deal",
      title: template.title,
      description: template.description,
      cost: template.cost,
      cashflow: template.cashflow
    },
    won: false,
    lost: false,
    lossReason: null
  };
  machine.hydrate(scenario);

  const outcome = await withMockRandom([0.5, 0.99, 0.99], () =>
    machine.buyCurrentOpportunity()
  );
  const after = outcome.state;

  assert.equal(
    after.cash,
    scenario.cash - template.cost + template.settlement.downsideCashDelta
  );
  assert.equal(after.passiveIncome, scenario.passiveIncome + template.cashflow);
  assert.equal(
    after.expenses,
    scenario.expenses + template.settlement.downsideExpensesDelta
  );
  assert.equal(after.debt, scenario.debt + template.settlement.downsideDebtDelta);
  assert.equal(
    after.debtPayment,
    scenario.debtPayment +
      Math.max(80, Math.round(template.settlement.downsideDebtDelta * 0.012))
  );
  assert.ok(after.logs.some((line) => line.includes("Big Deal")));
});

test("enable ai mode creates at least one ai player", () => {
  const machine = new CashflowStateMachine();
  machine.reset("programmer");

  const outcome = machine.enableAiMode();

  assert.equal(outcome.state.aiEnabled, true);
  assert.ok(outcome.state.aiPlayers.length >= 1);
  assert.equal(outcome.state.aiPlayers[0]?.turn, outcome.state.turn);
});

test("next turn advances ai player and records ai decision", async () => {
  const machine = new CashflowStateMachine();
  const baseState = machine.reset("cleaner").state;
  const aiOpened = machine.enableAiMode().state;
  const seedAi = aiOpened.aiPlayers[0];
  assert.ok(seedAi, "ai player should exist after enabling ai mode");

  const scenario: CashflowState = {
    ...baseState,
    aiEnabled: true,
    aiPlayers: [
      {
        ...seedAi,
        cash: 50000,
        passiveIncome: 0,
        debt: 5000,
        debtPayment: 300,
        currentOpportunity: {
          id: "snack_shop-ai-manual-1",
          key: "snack_shop",
          tier: "small",
          dealClass: "normal",
          title: "社区零食店股份",
          description: "一笔小额投资，每月稳定分红",
          cost: 6000,
          cashflow: 520
        },
        assets: [],
        logs: [],
        won: false,
        lost: false,
        lossReason: null,
        lastDecision: null
      }
    ],
    won: false,
    lost: false,
    lossReason: null
  };
  machine.hydrate(scenario);

  const outcome = await withMockRandom([0.99, 0.99, 0.99], () =>
    machine.nextTurn()
  );
  const aiAfter = outcome.state.aiPlayers[0];
  assert.ok(aiAfter, "ai player should still exist");
  assert.equal(aiAfter?.turn, outcome.state.turn);
  assert.ok((aiAfter?.assets.length ?? 0) >= 1);
  assert.match(aiAfter?.lastDecision ?? "", /买入|跳过/);
  assert.match(outcome.message, /AI：/);
});
