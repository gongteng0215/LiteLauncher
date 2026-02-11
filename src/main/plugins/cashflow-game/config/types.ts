export interface CashflowJobPreset {
  key: string;
  role: string;
  salary: number;
  expenses: number;
  initialCash: number;
  taxRate: number;
  initialDebt: number;
  debtPayment: number;
  opportunityWeights: {
    small: number;
    medium: number;
    big: number;
  };
}

export interface CashflowOpportunityTemplate {
  key: string;
  tier: "small" | "medium" | "big";
  title: string;
  description: string;
  cost: number;
  cashflow: number;
}

export interface CashflowBigDealSettlement {
  upsideRate: number;
  upsideCashDelta: number;
  upsidePassiveIncomeDelta: number;
  downsideRate: number;
  downsideCashDelta: number;
  downsideDebtDelta: number;
  downsideExpensesDelta: number;
}

export interface CashflowBigDealTemplate extends CashflowOpportunityTemplate {
  settlement: CashflowBigDealSettlement;
}

export type CashflowEventCategory =
  | "income"
  | "expense"
  | "investment"
  | "consumption";

export interface CashflowEventTemplate {
  key: string;
  category: CashflowEventCategory;
  title: string;
  weight: number;
  cashDelta: number;
  expensesDelta: number;
  passiveIncomeDelta?: number;
  debtDelta?: number;
}

export interface CashflowRuleConfig {
  logLimit: number;
  eventRate: number;
  bigDealSpawnRateRatRace: number;
  bigDealSpawnRateFreedom: number;
}

export interface CashflowAiProfile {
  key: string;
  name: string;
  description: string;
  preferredJobKeys: string[];
  riskTolerance: number;
  loanTolerance: number;
  minCashReserveMonths: number;
  roiWeight: number;
}
