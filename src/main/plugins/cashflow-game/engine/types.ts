export interface CashflowOpportunity {
  id: string;
  key: string;
  tier?: "small" | "medium" | "big";
  dealClass?: "normal" | "big-deal";
  title: string;
  description: string;
  cost: number;
  cashflow: number;
}

export interface CashflowAsset {
  key: string;
  title: string;
  totalCost: number;
  totalCashflow: number;
  count: number;
}

export type CashflowPhase = "rat-race" | "freedom-phase";

export interface CashflowActorState {
  jobKey: string;
  turn: number;
  phase: CashflowPhase;
  role: string;
  taxRate: number;
  debt: number;
  debtPayment: number;
  salary: number;
  expenses: number;
  passiveIncome: number;
  cash: number;
  currentOpportunity: CashflowOpportunity | null;
  assets: CashflowAsset[];
  logs: string[];
  won: boolean;
  lost: boolean;
  lossReason: string | null;
}

export interface CashflowAiPlayer extends CashflowActorState {
  id: string;
  profileKey: string;
  name: string;
  profileDescription: string;
  lastDecision: string | null;
}

export interface CashflowState extends CashflowActorState {
  aiEnabled: boolean;
  aiPlayers: CashflowAiPlayer[];
}

export interface CashflowOutcome {
  state: CashflowState;
  message: string;
}

export interface CashflowIncomeReportItem {
  name: string;
  amount: number;
}

export interface CashflowExpenseReportItem {
  name: string;
  amount: number;
}

export interface CashflowBalanceSheetReport {
  cash: number;
  assetsTotal: number;
  debtsTotal: number;
  netWorth: number;
}

export interface CashflowMetricsReport {
  monthlyNet: number;
  passiveIncomeRatio: number;
  debtRatio: number;
  cashReserveMonths: number;
}

export interface CashflowReports {
  income: CashflowIncomeReportItem[];
  expenses: CashflowExpenseReportItem[];
  balanceSheet: CashflowBalanceSheetReport;
  metrics: CashflowMetricsReport;
}

export interface CashflowReportOutcome extends CashflowOutcome {
  reports: CashflowReports;
}
