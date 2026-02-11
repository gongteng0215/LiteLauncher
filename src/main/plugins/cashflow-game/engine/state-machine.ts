import {
  CASHFLOW_AI_PROFILES,
  CASHFLOW_BIG_DEALS,
  CASHFLOW_EVENTS,
  CASHFLOW_JOBS,
  CASHFLOW_OPPORTUNITIES,
  CASHFLOW_RULES,
  CashflowAiProfile,
  CashflowBigDealTemplate,
  CashflowEventTemplate,
  CashflowJobPreset,
  CashflowOpportunityTemplate
} from "../config";
import {
  CashflowAiPlayer,
  CashflowPhase,
  CashflowOutcome,
  CashflowReportOutcome,
  CashflowReports,
  CashflowState
} from "./types";

const CURRENCY_FORMATTER = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0
});

const BANKRUPTCY_CASH_THRESHOLD = -20000;
const RAT_RACE_PHASE: CashflowPhase = "rat-race";
const FREEDOM_PHASE: CashflowPhase = "freedom-phase";
const FREEDOM_EVENT_RATE_BONUS = 0.2;
const FREEDOM_EVENT_DELTA_MULTIPLIER = 1.35;
const FREEDOM_OPPORTUNITY_COST_MULTIPLIER = 1.45;
const FREEDOM_OPPORTUNITY_CASHFLOW_MULTIPLIER = 1.6;
const FREEDOM_OPPORTUNITY_WEIGHTS: CashflowJobPreset["opportunityWeights"] = {
  small: 0.1,
  medium: 0.35,
  big: 0.55
};

const BIG_DEAL_BY_KEY = new Map<string, CashflowBigDealTemplate>(
  CASHFLOW_BIG_DEALS.map((item) => [item.key, item] as const)
);
const AI_PROFILE_BY_KEY = new Map<string, CashflowAiProfile>(
  CASHFLOW_AI_PROFILES.map((item) => [item.key, item] as const)
);
const AI_LOG_LIMIT = 8;
const AI_NAME_FALLBACK = "AI 玩家";

function randomIndex(max: number): number {
  if (max <= 0) {
    return 0;
  }
  return Math.floor(Math.random() * max);
}

function formatMoney(value: number): string {
  return CURRENCY_FORMATTER.format(value);
}

function formatSignedMoney(value: number): string {
  if (value > 0) {
    return `+${formatMoney(value)}`;
  }
  if (value < 0) {
    return `-${formatMoney(Math.abs(value))}`;
  }
  return formatMoney(0);
}

function cloneState(state: CashflowState): CashflowState {
  return {
    ...state,
    aiEnabled: Boolean(state.aiEnabled),
    aiPlayers: (state.aiPlayers ?? []).map((player) => ({
      ...player,
      currentOpportunity: player.currentOpportunity
        ? { ...player.currentOpportunity }
        : null,
      assets: player.assets.map((asset) => ({ ...asset })),
      logs: [...player.logs]
    })),
    currentOpportunity: state.currentOpportunity
      ? { ...state.currentOpportunity }
      : null,
    assets: state.assets.map((asset) => ({ ...asset })),
    logs: [...state.logs]
  };
}

function weightedPickTier(
  weights: CashflowJobPreset["opportunityWeights"]
): "small" | "medium" | "big" {
  const normalized = {
    small: Math.max(0, weights.small),
    medium: Math.max(0, weights.medium),
    big: Math.max(0, weights.big)
  };
  const total = normalized.small + normalized.medium + normalized.big;
  if (total <= 0) {
    return "small";
  }

  let cursor = Math.random() * total;
  if ((cursor -= normalized.small) < 0) {
    return "small";
  }
  if ((cursor -= normalized.medium) < 0) {
    return "medium";
  }
  return "big";
}

function weightedPickEvent(events: CashflowEventTemplate[]): CashflowEventTemplate {
  if (events.length === 0) {
    throw new Error("Cashflow events are empty");
  }

  const normalized = events.map((event) => ({
    event,
    weight: Math.max(event.weight, 0)
  }));

  const total = normalized.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) {
    return events[randomIndex(events.length)] ?? events[0];
  }

  let cursor = Math.random() * total;
  for (const item of normalized) {
    cursor -= item.weight;
    if (cursor <= 0) {
      return item.event;
    }
  }

  return normalized[normalized.length - 1]?.event ?? events[0];
}

function eventCategoryLabel(category: CashflowEventTemplate["category"]): string {
  if (category === "income") {
    return "收入事件";
  }
  if (category === "expense") {
    return "支出事件";
  }
  if (category === "investment") {
    return "投资事件";
  }
  return "消费事件";
}

export class CashflowStateMachine {
  private state: CashflowState | null = null;

  private opportunitySeed = 0;

  private getJobByKey(key: string): CashflowJobPreset | null {
    const normalized = key.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    return (
      CASHFLOW_JOBS.find((item) => item.key.toLowerCase() === normalized) ?? null
    );
  }

  private getJobByState(state: CashflowState): CashflowJobPreset {
    const byKey = this.getJobByKey(state.jobKey);
    if (byKey) {
      return byKey;
    }

    return CASHFLOW_JOBS.find((item) => item.role === state.role) ?? CASHFLOW_JOBS[0];
  }

  private pickJob(preferredJobKey?: string): CashflowJobPreset {
    const preferred = preferredJobKey
      ? this.getJobByKey(preferredJobKey)
      : null;
    if (preferred) {
      return preferred;
    }

    return CASHFLOW_JOBS[randomIndex(CASHFLOW_JOBS.length)] ?? CASHFLOW_JOBS[0];
  }

  private buildOpportunity(
    template: CashflowOpportunityTemplate,
    dealClass: "normal" | "big-deal" = "normal"
  ) {
    this.opportunitySeed += 1;
    return {
      ...template,
      dealClass,
      id: `${template.key}-${Date.now()}-${this.opportunitySeed}`
    };
  }

  private getPhaseLabel(phase: CashflowPhase): string {
    return phase === FREEDOM_PHASE ? "自由阶段" : "老鼠赛跑";
  }

  private getOpportunityWeights(
    job: CashflowJobPreset,
    phase: CashflowPhase
  ): CashflowJobPreset["opportunityWeights"] {
    if (phase === FREEDOM_PHASE) {
      return FREEDOM_OPPORTUNITY_WEIGHTS;
    }
    return job.opportunityWeights;
  }

  private scaleOpportunityForFreedom(
    template: CashflowOpportunityTemplate
  ): CashflowOpportunityTemplate {
    return {
      ...template,
      cost: Math.max(
        1,
        Math.round(template.cost * FREEDOM_OPPORTUNITY_COST_MULTIPLIER)
      ),
      cashflow: Math.max(
        1,
        Math.round(template.cashflow * FREEDOM_OPPORTUNITY_CASHFLOW_MULTIPLIER)
      )
    };
  }

  private getBigDealSpawnRate(phase: CashflowPhase): number {
    return phase === FREEDOM_PHASE
      ? CASHFLOW_RULES.bigDealSpawnRateFreedom
      : CASHFLOW_RULES.bigDealSpawnRateRatRace;
  }

  private pickBigDealOpportunity() {
    const template =
      CASHFLOW_BIG_DEALS[randomIndex(CASHFLOW_BIG_DEALS.length)] ??
      CASHFLOW_BIG_DEALS[0];
    return this.buildOpportunity(template, "big-deal");
  }

  private applyBigDealSettlement(
    state: CashflowState,
    opportunityKey: string
  ): string | null {
    const template = BIG_DEAL_BY_KEY.get(opportunityKey);
    if (!template) {
      return null;
    }

    const roll = Math.random();
    const upsideThreshold = template.settlement.upsideRate;
    const downsideThreshold = upsideThreshold + template.settlement.downsideRate;

    if (roll < upsideThreshold) {
      if (template.settlement.upsideCashDelta !== 0) {
        state.cash += template.settlement.upsideCashDelta;
      }
      if (template.settlement.upsidePassiveIncomeDelta !== 0) {
        state.passiveIncome = Math.max(
          0,
          state.passiveIncome + template.settlement.upsidePassiveIncomeDelta
        );
      }
      const message = `Big Deal 利好：现金 ${formatSignedMoney(
        template.settlement.upsideCashDelta
      )}，被动收入 ${formatSignedMoney(
        template.settlement.upsidePassiveIncomeDelta
      )}/月`;
      this.appendLog(state, message);
      return message;
    }

    if (roll < downsideThreshold) {
      if (template.settlement.downsideCashDelta !== 0) {
        state.cash += template.settlement.downsideCashDelta;
      }
      if (template.settlement.downsideExpensesDelta !== 0) {
        state.expenses = Math.max(
          1000,
          state.expenses + template.settlement.downsideExpensesDelta
        );
      }
      const appliedDebtDelta = this.applyDebtDelta(
        state,
        template.settlement.downsideDebtDelta
      );
      const details: string[] = [];
      if (template.settlement.downsideCashDelta !== 0) {
        details.push(`现金 ${formatSignedMoney(template.settlement.downsideCashDelta)}`);
      }
      if (appliedDebtDelta !== 0) {
        details.push(`债务 ${formatSignedMoney(appliedDebtDelta)}`);
      }
      if (template.settlement.downsideExpensesDelta !== 0) {
        details.push(
          `生活支出 ${formatSignedMoney(template.settlement.downsideExpensesDelta)}/月`
        );
      }
      const message = `Big Deal 风险触发：${details.join(" · ")}`;
      this.appendLog(state, message);
      return message;
    }

    const neutralMessage = "Big Deal 平稳推进：本回合无额外波动";
    this.appendLog(state, neutralMessage);
    return neutralMessage;
  }

  private pickOpportunity(job: CashflowJobPreset, phase: CashflowPhase) {
    if (Math.random() < this.getBigDealSpawnRate(phase)) {
      return this.pickBigDealOpportunity();
    }

    const tier = weightedPickTier(this.getOpportunityWeights(job, phase));
    const tierCandidates = CASHFLOW_OPPORTUNITIES.filter(
      (item) => item.tier === tier
    );

    const pool = tierCandidates.length > 0 ? tierCandidates : CASHFLOW_OPPORTUNITIES;
    const rawTemplate = pool[randomIndex(pool.length)] ?? pool[0];
    const template =
      phase === FREEDOM_PHASE
        ? this.scaleOpportunityForFreedom(rawTemplate)
        : rawTemplate;
    return this.buildOpportunity(template, "normal");
  }

  private normalizePhase(
    phase: unknown,
    fallbackState: Pick<CashflowState, "passiveIncome" | "expenses">
  ): CashflowPhase {
    if (phase === FREEDOM_PHASE || phase === RAT_RACE_PHASE) {
      return phase as CashflowPhase;
    }
    return fallbackState.passiveIncome >= fallbackState.expenses
      ? FREEDOM_PHASE
      : RAT_RACE_PHASE;
  }

  private evaluatePhase(state: CashflowState, emitLog = false): boolean {
    if (state.phase === FREEDOM_PHASE) {
      return false;
    }

    if (state.passiveIncome < state.expenses) {
      return false;
    }

    state.phase = FREEDOM_PHASE;
    if (emitLog) {
      this.appendLog(
        state,
        "阶段跃迁：被动收入已覆盖基本支出，进入自由阶段（机会更大，风险更高）"
      );
    }
    return true;
  }

  private syncOpportunitySeed(state: CashflowState): void {
    const rawId = state.currentOpportunity?.id ?? "";
    const match = rawId.match(/-(\d+)$/);
    if (!match) {
      this.opportunitySeed = 0;
      return;
    }

    const parsed = Number(match[1]);
    this.opportunitySeed = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  private appendLog(state: CashflowState, text: string): void {
    state.logs.unshift(`[T${state.turn}] ${text}`);
    if (state.logs.length > CASHFLOW_RULES.logLimit) {
      state.logs.length = CASHFLOW_RULES.logLimit;
    }
  }

  private getSalaryAfterTax(state: CashflowState): number {
    const afterTax = Math.round(state.salary * (1 - state.taxRate));
    return Math.max(afterTax, 0);
  }

  private getTotalExpenses(state: CashflowState): number {
    return state.expenses + state.debtPayment;
  }

  private getMonthlyNet(state: CashflowState): number {
    return (
      this.getSalaryAfterTax(state) +
      state.passiveIncome -
      this.getTotalExpenses(state)
    );
  }

  private getEventRate(state: CashflowState): number {
    if (state.phase !== FREEDOM_PHASE) {
      return CASHFLOW_RULES.eventRate;
    }
    return Math.min(0.95, CASHFLOW_RULES.eventRate + FREEDOM_EVENT_RATE_BONUS);
  }

  private scaleEventDelta(state: CashflowState, value: number): number {
    if (value === 0 || state.phase !== FREEDOM_PHASE) {
      return value;
    }
    return Math.round(value * FREEDOM_EVENT_DELTA_MULTIPLIER);
  }

  private evaluateWin(state: CashflowState): void {
    if (state.lost) {
      state.won = false;
      return;
    }
    state.won = state.passiveIncome >= this.getTotalExpenses(state);
  }

  private evaluateLoss(state: CashflowState): void {
    if (state.won) {
      state.lost = false;
      state.lossReason = null;
      return;
    }

    const monthlyNet = this.getMonthlyNet(state);
    if (state.cash <= BANKRUPTCY_CASH_THRESHOLD) {
      state.lost = true;
      state.lossReason = `触发破产：现金跌破 ${formatMoney(BANKRUPTCY_CASH_THRESHOLD)}`;
      state.currentOpportunity = null;
      return;
    }

    if (state.cash <= 0 && monthlyNet < 0) {
      state.lost = true;
      state.lossReason =
        "现金流断裂：现金耗尽且每月净现金流为负，无法继续周转";
      state.currentOpportunity = null;
      return;
    }

    state.lost = false;
    state.lossReason = null;
  }

  private trimAiLogs(player: CashflowAiPlayer): void {
    if (player.logs.length > AI_LOG_LIMIT) {
      player.logs.length = AI_LOG_LIMIT;
    }
  }

  private pickAiJob(profile: CashflowAiProfile): CashflowJobPreset {
    const preferred = profile.preferredJobKeys
      .map((key) => this.getJobByKey(key))
      .filter((job): job is CashflowJobPreset => Boolean(job));
    if (preferred.length > 0) {
      return preferred[randomIndex(preferred.length)] ?? preferred[0];
    }
    return this.pickJob();
  }

  private getAiProfile(profileKey?: string): CashflowAiProfile {
    if (profileKey) {
      const matched = AI_PROFILE_BY_KEY.get(profileKey);
      if (matched) {
        return matched;
      }
    }
    return (
      CASHFLOW_AI_PROFILES[0] ?? {
        key: "default-ai",
        name: AI_NAME_FALLBACK,
        description: "默认 AI 配置",
        preferredJobKeys: [],
        riskTolerance: 0.4,
        loanTolerance: 0.3,
        minCashReserveMonths: 2,
        roiWeight: 1
      }
    );
  }

  private estimateLoanPaymentIncrease(loanNeeded: number): number {
    if (loanNeeded <= 0) {
      return 0;
    }
    return Math.max(120, Math.round(loanNeeded * 0.015));
  }

  private createAiPlayer(profile: CashflowAiProfile, index: number): CashflowAiPlayer {
    const job = this.pickAiJob(profile);
    const player: CashflowAiPlayer = {
      id: `${profile.key}-${Date.now()}-${index}`,
      profileKey: profile.key,
      name: profile.name || `${AI_NAME_FALLBACK}${index}`,
      profileDescription: profile.description,
      jobKey: job.key,
      turn: 1,
      phase: RAT_RACE_PHASE,
      role: job.role,
      taxRate: job.taxRate,
      debt: job.initialDebt,
      debtPayment: job.debtPayment,
      salary: job.salary,
      expenses: job.expenses,
      passiveIncome: 0,
      cash: job.initialCash,
      currentOpportunity: this.pickOpportunity(job, RAT_RACE_PHASE),
      assets: [],
      logs: [],
      won: false,
      lost: false,
      lossReason: null,
      lastDecision: null
    };
    this.appendLog(
      player as unknown as CashflowState,
      `开局职业：${player.role}（${this.getPhaseLabel(player.phase)}）`
    );
    this.evaluateLoss(player as unknown as CashflowState);
    this.evaluateWin(player as unknown as CashflowState);
    this.trimAiLogs(player);
    return player;
  }

  private normalizeHydratedAiPlayer(
    raw: Partial<CashflowAiPlayer>,
    index: number
  ): CashflowAiPlayer | null {
    if (!raw || typeof raw !== "object") {
      return null;
    }

    const profile = this.getAiProfile(
      typeof raw.profileKey === "string" ? raw.profileKey : undefined
    );
    const fallbackJob =
      this.getJobByKey(typeof raw.jobKey === "string" ? raw.jobKey : "") ??
      this.pickAiJob(profile);

    const assets = Array.isArray(raw.assets)
      ? raw.assets
          .filter((asset): asset is CashflowAiPlayer["assets"][number] => {
            return (
              Boolean(asset) &&
              typeof asset.key === "string" &&
              typeof asset.title === "string" &&
              typeof asset.totalCost === "number" &&
              typeof asset.totalCashflow === "number" &&
              typeof asset.count === "number"
            );
          })
          .map((asset) => ({ ...asset }))
      : [];

    const currentOpportunity =
      raw.currentOpportunity &&
      typeof raw.currentOpportunity.id === "string" &&
      typeof raw.currentOpportunity.key === "string" &&
      typeof raw.currentOpportunity.title === "string" &&
      typeof raw.currentOpportunity.description === "string" &&
      typeof raw.currentOpportunity.cost === "number" &&
      typeof raw.currentOpportunity.cashflow === "number"
        ? {
            ...raw.currentOpportunity
          }
        : null;

    const normalized: CashflowAiPlayer = {
      id:
        typeof raw.id === "string" && raw.id.trim()
          ? raw.id
          : `${profile.key}-hydrated-${index + 1}`,
      profileKey: profile.key,
      name:
        typeof raw.name === "string" && raw.name.trim()
          ? raw.name
          : profile.name || `${AI_NAME_FALLBACK}${index + 1}`,
      profileDescription:
        typeof raw.profileDescription === "string" && raw.profileDescription.trim()
          ? raw.profileDescription
          : profile.description,
      jobKey:
        typeof raw.jobKey === "string" && raw.jobKey.trim()
          ? raw.jobKey
          : fallbackJob.key,
      turn:
        typeof raw.turn === "number" && Number.isFinite(raw.turn) && raw.turn > 0
          ? Math.round(raw.turn)
          : 1,
      phase: this.normalizePhase(raw.phase, {
        passiveIncome:
          typeof raw.passiveIncome === "number" ? raw.passiveIncome : 0,
        expenses: typeof raw.expenses === "number" ? raw.expenses : fallbackJob.expenses
      }),
      role:
        typeof raw.role === "string" && raw.role.trim()
          ? raw.role
          : fallbackJob.role,
      taxRate:
        typeof raw.taxRate === "number" && Number.isFinite(raw.taxRate) && raw.taxRate >= 0
          ? raw.taxRate
          : fallbackJob.taxRate,
      debt:
        typeof raw.debt === "number" && Number.isFinite(raw.debt)
          ? raw.debt
          : fallbackJob.initialDebt,
      debtPayment:
        typeof raw.debtPayment === "number" &&
        Number.isFinite(raw.debtPayment) &&
        raw.debtPayment >= 0
          ? raw.debtPayment
          : fallbackJob.debtPayment,
      salary:
        typeof raw.salary === "number" && Number.isFinite(raw.salary)
          ? raw.salary
          : fallbackJob.salary,
      expenses:
        typeof raw.expenses === "number" && Number.isFinite(raw.expenses)
          ? raw.expenses
          : fallbackJob.expenses,
      passiveIncome:
        typeof raw.passiveIncome === "number" && Number.isFinite(raw.passiveIncome)
          ? raw.passiveIncome
          : 0,
      cash:
        typeof raw.cash === "number" && Number.isFinite(raw.cash)
          ? raw.cash
          : fallbackJob.initialCash,
      currentOpportunity,
      assets,
      logs: Array.isArray(raw.logs)
        ? raw.logs.filter((entry): entry is string => typeof entry === "string")
        : [],
      won: Boolean(raw.won),
      lost: Boolean(raw.lost),
      lossReason:
        typeof raw.lossReason === "string" && raw.lossReason.trim()
          ? raw.lossReason
          : null,
      lastDecision:
        typeof raw.lastDecision === "string" && raw.lastDecision.trim()
          ? raw.lastDecision
          : null
    };

    this.evaluatePhase(normalized as unknown as CashflowState, false);
    this.evaluateLoss(normalized as unknown as CashflowState);
    this.evaluateWin(normalized as unknown as CashflowState);
    this.trimAiLogs(normalized);
    return normalized;
  }

  private ensureAiPlayers(state: CashflowState): void {
    if (!state.aiEnabled) {
      state.aiPlayers = [];
      return;
    }

    if (state.aiPlayers.length > 0) {
      return;
    }

    const profile = this.getAiProfile();
    const player = this.createAiPlayer(profile, 1);
    state.aiPlayers = [player];
    this.appendLog(state, `AI 玩家加入：${player.name}（${player.role}）`);
  }

  private applyOpportunityToPortfolio(
    actor: Pick<CashflowState, "passiveIncome" | "assets">,
    opportunity: NonNullable<CashflowState["currentOpportunity"]>
  ): void {
    actor.passiveIncome += opportunity.cashflow;

    const existing = actor.assets.find((item) => item.key === opportunity.key);
    if (existing) {
      existing.count += 1;
      existing.totalCost += opportunity.cost;
      existing.totalCashflow += opportunity.cashflow;
      return;
    }

    actor.assets.push({
      key: opportunity.key,
      title: opportunity.title,
      totalCost: opportunity.cost,
      totalCashflow: opportunity.cashflow,
      count: 1
    });
  }

  private scoreAiSkip(
    player: CashflowAiPlayer,
    profile: CashflowAiProfile
  ): number {
    const actor = player as unknown as CashflowState;
    const totalExpenses = Math.max(this.getTotalExpenses(actor), 1);
    const reserveCash = totalExpenses * profile.minCashReserveMonths;
    const monthlyNet = this.getMonthlyNet(actor);
    const reserveGap = Math.max(0, reserveCash - player.cash);

    let score = 22;
    score += (reserveGap / totalExpenses) * 15;
    if (monthlyNet < 0) {
      score -= 12;
    }
    if (player.currentOpportunity?.dealClass === "big-deal") {
      score += (1 - profile.riskTolerance) * 14;
    }
    return score;
  }

  private scoreAiBuy(
    player: CashflowAiPlayer,
    profile: CashflowAiProfile,
    withLoan: boolean
  ): number {
    const opportunity = player.currentOpportunity;
    if (!opportunity) {
      return Number.NEGATIVE_INFINITY;
    }

    const actor = player as unknown as CashflowState;
    const totalExpenses = Math.max(this.getTotalExpenses(actor), 1);
    const reserveCash = totalExpenses * profile.minCashReserveMonths;
    const monthlyNet = this.getMonthlyNet(actor);
    const loanNeeded = Math.max(0, opportunity.cost - player.cash);
    const loanPaymentAdd = withLoan
      ? this.estimateLoanPaymentIncrease(loanNeeded)
      : 0;
    const cashAfter = withLoan ? 0 : player.cash - opportunity.cost;
    const projectedNet = monthlyNet + opportunity.cashflow - loanPaymentAdd;
    const roi = opportunity.cashflow / Math.max(opportunity.cost, 1);
    const assetBookValue = player.assets.reduce(
      (sum, item) => sum + item.totalCost,
      0
    );
    const debtRatio = player.debt / Math.max(assetBookValue + player.cash, 1);
    const reserveGap = Math.max(0, reserveCash - cashAfter);

    let score = 0;
    score += roi * 130 * profile.roiWeight;
    score += Math.max(-0.4, Math.min(0.55, projectedNet / totalExpenses)) * 70;
    score += player.passiveIncome < totalExpenses ? 12 : 0;
    score += player.phase === FREEDOM_PHASE ? 9 : 0;
    score -= (reserveGap / totalExpenses) * 18;
    score -= debtRatio * 20 * (1 - profile.loanTolerance * 0.6);
    if (opportunity.dealClass === "big-deal") {
      score += (profile.riskTolerance - 0.5) * 34;
    }
    if (withLoan) {
      score -= 16 * (1 - profile.loanTolerance);
      score -= (loanPaymentAdd / totalExpenses) * 20;
    } else {
      score += 6;
    }
    return score;
  }

  private decideAiAction(
    player: CashflowAiPlayer,
    profile: CashflowAiProfile
  ): "buy" | "buy-loan" | "skip" {
    const opportunity = player.currentOpportunity;
    if (!opportunity) {
      return "skip";
    }

    const actor = player as unknown as CashflowState;
    const totalExpenses = Math.max(this.getTotalExpenses(actor), 1);
    const loanNeeded = Math.max(0, opportunity.cost - player.cash);
    const projectedLoanPayment = this.estimateLoanPaymentIncrease(loanNeeded);
    const projectedNetWithLoan =
      this.getMonthlyNet(actor) + opportunity.cashflow - projectedLoanPayment;

    let bestAction: "buy" | "buy-loan" | "skip" = "skip";
    let bestScore = this.scoreAiSkip(player, profile);

    if (player.cash >= opportunity.cost) {
      const buyScore = this.scoreAiBuy(player, profile, false);
      if (buyScore > bestScore) {
        bestAction = "buy";
        bestScore = buyScore;
      }
    }

    if (loanNeeded > 0 && profile.loanTolerance >= 0.2) {
      const debtPaymentLimit =
        totalExpenses * (0.45 + profile.loanTolerance * 0.55);
      if (
        projectedLoanPayment <= debtPaymentLimit &&
        projectedNetWithLoan >= -totalExpenses * 0.35
      ) {
        const loanScore = this.scoreAiBuy(player, profile, true);
        if (loanScore > bestScore) {
          bestAction = "buy-loan";
        }
      }
    }

    return bestAction;
  }

  private applyAiDecision(
    player: CashflowAiPlayer,
    profile: CashflowAiProfile,
    action: "buy" | "buy-loan" | "skip"
  ): string {
    const opportunity = player.currentOpportunity;
    if (!opportunity) {
      player.lastDecision = "跳过（无可选机会）";
      return `${player.name}跳过（无机会）`;
    }

    const actor = player as unknown as CashflowState;

    if (action === "buy") {
      if (player.cash < opportunity.cost) {
        player.lastDecision = "跳过（现金不足）";
        return `${player.name}跳过（现金不足）`;
      }

      player.cash -= opportunity.cost;
      this.applyOpportunityToPortfolio(player, opportunity);
      this.appendLog(
        actor,
        `${player.name} 现金买入 ${opportunity.title}（${formatMoney(opportunity.cost)}）`
      );
      const settlement = this.applyBigDealSettlement(actor, opportunity.key);
      player.currentOpportunity = null;
      const transitioned = this.evaluatePhase(actor, true);
      this.ensureOpportunity(actor);
      this.evaluateLoss(actor);
      this.evaluateWin(actor);
      this.trimAiLogs(player);

      const baseSummary = `现金买入 ${opportunity.title}`;
      const transitionText = transitioned ? "，进入自由阶段" : "";
      const settlementText = settlement ? `，${settlement}` : "";
      if (player.won) {
        player.lastDecision = `${baseSummary}${settlementText}，达成财务自由`;
        return `${player.name}${baseSummary}${settlementText}，达成财务自由`;
      }
      if (player.lost) {
        player.lastDecision = `${baseSummary}${settlementText}，回合失败`;
        return `${player.name}${baseSummary}${settlementText}，回合失败`;
      }
      player.lastDecision = `${baseSummary}${transitionText}`;
      return `${player.name}${baseSummary}${transitionText}${settlementText}`;
    }

    if (action === "buy-loan") {
      const loanNeeded = Math.max(0, opportunity.cost - player.cash);
      if (loanNeeded <= 0) {
        return this.applyAiDecision(player, profile, "buy");
      }

      const paymentIncrease = this.estimateLoanPaymentIncrease(loanNeeded);
      const cashUsed = player.cash;
      player.cash = 0;
      player.debt += loanNeeded;
      player.debtPayment += paymentIncrease;
      this.applyOpportunityToPortfolio(player, opportunity);
      this.appendLog(
        actor,
        `${player.name} 贷款买入 ${opportunity.title}（自有 ${formatMoney(
          cashUsed
        )} + 贷款 ${formatMoney(loanNeeded)}）`
      );
      const settlement = this.applyBigDealSettlement(actor, opportunity.key);
      player.currentOpportunity = null;
      const transitioned = this.evaluatePhase(actor, true);
      this.ensureOpportunity(actor);
      this.evaluateLoss(actor);
      this.evaluateWin(actor);
      this.trimAiLogs(player);

      const baseSummary = `贷款买入 ${opportunity.title}`;
      const transitionText = transitioned ? "，进入自由阶段" : "";
      const settlementText = settlement ? `，${settlement}` : "";
      if (player.won) {
        player.lastDecision = `${baseSummary}${settlementText}，达成财务自由`;
        return `${player.name}${baseSummary}${settlementText}，达成财务自由`;
      }
      if (player.lost) {
        player.lastDecision = `${baseSummary}${settlementText}，回合失败`;
        return `${player.name}${baseSummary}${settlementText}，回合失败`;
      }
      player.lastDecision = `${baseSummary}${transitionText}`;
      return `${player.name}${baseSummary}${transitionText}${settlementText}`;
    }

    this.appendLog(actor, `${player.name} 跳过机会：${opportunity.title}`);
    player.currentOpportunity = null;
    this.ensureOpportunity(actor);
    this.evaluateLoss(actor);
    this.evaluateWin(actor);
    this.trimAiLogs(player);
    player.lastDecision = `跳过 ${opportunity.title}`;
    return `${player.name}跳过 ${opportunity.title}`;
  }

  private advanceAiPlayer(player: CashflowAiPlayer, sharedTurn: number): string {
    const actor = player as unknown as CashflowState;
    if (player.won) {
      return `${player.name}已达成财务自由`;
    }
    if (player.lost) {
      return `${player.name}已失败`;
    }

    player.turn = sharedTurn;
    const salaryAfterTax = this.getSalaryAfterTax(actor);
    const monthlyNet = this.getMonthlyNet(actor);
    player.cash += monthlyNet;

    if (player.debt > 0 && player.debtPayment > 0) {
      const principalReduction = Math.max(
        0,
        Math.round(player.debtPayment * 0.35)
      );
      player.debt = Math.max(0, player.debt - principalReduction);
      if (player.debt === 0) {
        player.debtPayment = 0;
        this.appendLog(actor, `${player.name} 债务已清偿`);
      }
    }

    this.appendLog(
      actor,
      `${player.name} 回合结算：税后工资 ${formatMoney(
        salaryAfterTax
      )}，月净现金流 ${formatMoney(monthlyNet)}，结余 ${formatMoney(player.cash)}`
    );

    const eventResult = this.applyRandomEvent(actor);
    const transitioned = this.evaluatePhase(actor, true);
    if (transitioned) {
      player.currentOpportunity = null;
    }
    this.ensureOpportunity(actor);
    this.evaluateLoss(actor);
    this.evaluateWin(actor);

    if (player.lost) {
      this.appendLog(actor, player.lossReason ?? "本局失败");
      this.trimAiLogs(player);
      player.lastDecision = "回合结算后失败";
      return `${player.name}：${player.lossReason ?? "失败"}`;
    }
    if (player.won) {
      this.appendLog(actor, `${player.name} 已达成财务自由`);
      this.trimAiLogs(player);
      player.lastDecision = "回合结算后达成财务自由";
      return `${player.name}：达成财务自由`;
    }

    const profile = this.getAiProfile(player.profileKey);
    const action = this.decideAiAction(player, profile);
    const decisionSummary = this.applyAiDecision(player, profile, action);

    const eventText = eventResult
      ? `（${eventCategoryLabel(eventResult.category)} ${eventResult.title}）`
      : "";
    this.trimAiLogs(player);
    return `${decisionSummary}${eventText}`;
  }

  private advanceAiPlayers(state: CashflowState): string[] {
    if (!state.aiEnabled) {
      return [];
    }

    this.ensureAiPlayers(state);
    const summaries: string[] = [];
    for (const player of state.aiPlayers) {
      summaries.push(this.advanceAiPlayer(player, state.turn));
    }
    return summaries;
  }

  private createInitialState(preferredJobKey?: string): CashflowState {
    const job = this.pickJob(preferredJobKey);
    const state: CashflowState = {
      jobKey: job.key,
      turn: 1,
      phase: RAT_RACE_PHASE,
      aiEnabled: false,
      aiPlayers: [],
      role: job.role,
      taxRate: job.taxRate,
      debt: job.initialDebt,
      debtPayment: job.debtPayment,
      salary: job.salary,
      expenses: job.expenses,
      passiveIncome: 0,
      cash: job.initialCash,
      currentOpportunity: this.pickOpportunity(job, RAT_RACE_PHASE),
      assets: [],
      logs: [],
      won: false,
      lost: false,
      lossReason: null
    };
    this.appendLog(
      state,
      `开局职业：${state.role}（${this.getPhaseLabel(state.phase)}），税后工资 ${formatMoney(
        this.getSalaryAfterTax(state)
      )}/月，总支出 ${formatMoney(this.getTotalExpenses(state))}/月`
    );
    this.evaluateLoss(state);
    this.evaluateWin(state);
    return state;
  }

  private ensureState(): CashflowState {
    if (!this.state) {
      this.state = this.createInitialState();
    }
    return this.state;
  }

  private ensureOpportunity(state: CashflowState): void {
    if (!state.currentOpportunity && !state.won && !state.lost) {
      const job = this.getJobByState(state);
      state.currentOpportunity = this.pickOpportunity(job, state.phase);
      this.appendLog(
        state,
        `新机会（${this.getPhaseLabel(state.phase)}）：${state.currentOpportunity.title} (${formatMoney(
          state.currentOpportunity.cost
        )} -> ${formatMoney(state.currentOpportunity.cashflow)}/月)`
      );
    }
  }

  private applyDebtDelta(state: CashflowState, debtDelta: number): number {
    if (debtDelta === 0) {
      return 0;
    }

    if (debtDelta > 0) {
      state.debt += debtDelta;
      const paymentAdd = Math.max(80, Math.round(debtDelta * 0.012));
      state.debtPayment += paymentAdd;
      return debtDelta;
    }

    const reduction = Math.min(state.debt, Math.abs(debtDelta));
    state.debt = Math.max(0, state.debt - reduction);
    const paymentReduce = Math.max(0, Math.round(reduction * 0.012));
    state.debtPayment = Math.max(0, state.debtPayment - paymentReduce);
    if (state.debt === 0) {
      state.debtPayment = 0;
    }
    return -reduction;
  }

  private applyRandomEvent(
    state: CashflowState
  ):
    | {
        title: string;
        category: CashflowEventTemplate["category"];
        cashDelta: number;
        expensesDelta: number;
        passiveIncomeDelta: number;
        debtDelta: number;
      }
    | null {
    if (Math.random() > this.getEventRate(state)) {
      return null;
    }

    const event = weightedPickEvent(CASHFLOW_EVENTS);
    const cashDelta = this.scaleEventDelta(state, event.cashDelta);
    const expensesDelta = this.scaleEventDelta(state, event.expensesDelta);
    const passiveIncomeDelta = this.scaleEventDelta(
      state,
      event.passiveIncomeDelta ?? 0
    );
    const debtDelta = this.scaleEventDelta(state, event.debtDelta ?? 0);

    if (cashDelta !== 0) {
      state.cash += cashDelta;
    }
    if (expensesDelta !== 0) {
      state.expenses = Math.max(1000, state.expenses + expensesDelta);
    }

    if (passiveIncomeDelta !== 0) {
      state.passiveIncome = Math.max(0, state.passiveIncome + passiveIncomeDelta);
    }

    const appliedDebtDelta = this.applyDebtDelta(state, debtDelta);

    const details: string[] = [];
    if (cashDelta !== 0) {
      details.push(`现金 ${formatSignedMoney(cashDelta)}`);
    }
    if (expensesDelta !== 0) {
      details.push(`生活支出 ${formatSignedMoney(expensesDelta)}/月`);
    }
    if (passiveIncomeDelta !== 0) {
      details.push(`被动收入 ${formatSignedMoney(passiveIncomeDelta)}/月`);
    }
    if (appliedDebtDelta !== 0) {
      details.push(`债务 ${formatSignedMoney(appliedDebtDelta)}`);
    }

    this.appendLog(
      state,
      `${eventCategoryLabel(event.category)}：${event.title}${
        details.length ? ` (${details.join(" · ")})` : ""
      }`
    );

    return {
      title: event.title,
      category: event.category,
      cashDelta,
      expensesDelta,
      passiveIncomeDelta,
      debtDelta: appliedDebtDelta
    };
  }

  private createReports(state: CashflowState): CashflowReports {
    const monthlyNet = this.getMonthlyNet(state);
    const assetBookValue = state.assets.reduce(
      (sum, asset) => sum + asset.totalCost,
      0
    );
    const debtBookValue = Math.max(0, state.debt);
    const expensesBase = Math.max(this.getTotalExpenses(state), 1);
    const passiveIncomeRatio = state.passiveIncome / expensesBase;
    const debtRatio = debtBookValue / Math.max(assetBookValue + state.cash, 1);
    const cashReserveMonths = state.cash / expensesBase;

    return {
      income: [
        { name: "税后工资", amount: this.getSalaryAfterTax(state) },
        { name: "被动收入", amount: state.passiveIncome }
      ],
      expenses: [
        { name: "生活支出", amount: state.expenses },
        { name: "债务还款", amount: state.debtPayment },
        { name: "总支出", amount: this.getTotalExpenses(state) }
      ],
      balanceSheet: {
        cash: state.cash,
        assetsTotal: assetBookValue,
        debtsTotal: debtBookValue,
        netWorth: state.cash + assetBookValue - debtBookValue
      },
      metrics: {
        monthlyNet,
        passiveIncomeRatio,
        debtRatio,
        cashReserveMonths
      }
    };
  }

  private outcome(state: CashflowState, message: string): CashflowOutcome {
    return {
      state: cloneState(state),
      message
    };
  }

  private finalizeAfterOpportunityAction(
    state: CashflowState,
    successMessage: string
  ): CashflowOutcome {
    state.currentOpportunity = null;
    const transitioned = this.evaluatePhase(state, true);
    this.ensureOpportunity(state);

    this.evaluateLoss(state);
    this.evaluateWin(state);

    if (state.lost) {
      this.appendLog(state, state.lossReason ?? "本局失败");
      return this.outcome(state, state.lossReason ?? "本局失败");
    }

    if (state.won) {
      this.appendLog(state, "财务自由达成！被动收入已覆盖总支出");
      return this.outcome(
        state,
        `恭喜通关！被动收入 ${formatMoney(state.passiveIncome)} >= 总支出 ${formatMoney(
          this.getTotalExpenses(state)
        )}`
      );
    }

    if (transitioned) {
      return this.outcome(state, `${successMessage} · 已进入自由阶段`);
    }

    return this.outcome(state, successMessage);
  }

  getJobPresets(): CashflowJobPreset[] {
    return CASHFLOW_JOBS.map((item) => ({
      ...item,
      opportunityWeights: { ...item.opportunityWeights }
    }));
  }

  hydrate(state: CashflowState): void {
    const fallbackJob =
      this.getJobByKey((state as Partial<CashflowState>).jobKey ?? "") ??
      CASHFLOW_JOBS[0];

    const rawAiPlayers = Array.isArray((state as Partial<CashflowState>).aiPlayers)
      ? ((state as Partial<CashflowState>).aiPlayers as Array<Partial<CashflowAiPlayer>>)
      : [];

    const cloned: CashflowState = {
      ...cloneState(state),
      jobKey: state.jobKey || fallbackJob.key,
      phase: this.normalizePhase((state as Partial<CashflowState>).phase, state),
      aiEnabled: Boolean((state as Partial<CashflowState>).aiEnabled),
      aiPlayers: rawAiPlayers
        .map((item, index) => this.normalizeHydratedAiPlayer(item, index))
        .filter((item): item is CashflowAiPlayer => Boolean(item)),
      taxRate:
        Number.isFinite(state.taxRate) && state.taxRate >= 0
          ? state.taxRate
          : fallbackJob.taxRate,
      debt: Number.isFinite(state.debt) ? state.debt : fallbackJob.initialDebt,
      debtPayment:
        Number.isFinite(state.debtPayment) && state.debtPayment >= 0
          ? state.debtPayment
          : fallbackJob.debtPayment,
      lost: Boolean((state as Partial<CashflowState>).lost),
      lossReason: (state as Partial<CashflowState>).lossReason ?? null
    };

    this.evaluatePhase(cloned, false);
    this.evaluateLoss(cloned);
    this.evaluateWin(cloned);
    if (cloned.aiEnabled) {
      this.ensureAiPlayers(cloned);
    } else {
      cloned.aiPlayers = [];
    }
    this.syncOpportunitySeed(cloned);
    this.state = cloned;
  }

  open(reset = false, preferredJobKey?: string): CashflowOutcome {
    if (reset) {
      return this.reset(preferredJobKey);
    }

    const state = this.ensureState();
    if (state.aiEnabled) {
      this.ensureAiPlayers(state);
    }
    if (state.lost) {
      return this.outcome(
        state,
        `${state.lossReason ?? "本局已失败"}，请点击“新开一局”继续`
      );
    }
    return this.outcome(
      state,
      `已打开现金流游戏（${this.getPhaseLabel(state.phase)} · 第 ${state.turn} 回合）`
    );
  }

  enableAiMode(reset = false, preferredJobKey?: string): CashflowOutcome {
    if (reset) {
      this.state = this.createInitialState(preferredJobKey);
    }

    const state = this.ensureState();
    state.aiEnabled = true;
    this.ensureAiPlayers(state);

    if (state.lost) {
      return this.outcome(
        state,
        `${state.lossReason ?? "本局已失败"}，请点击“新开一局”继续`
      );
    }

    const aiNames = state.aiPlayers.map((player) => player.name).join("、");
    return this.outcome(
      state,
      `AI 对战已开启：${aiNames || AI_NAME_FALLBACK}（第 ${state.turn} 回合）`
    );
  }

  getState(): CashflowOutcome {
    const state = this.ensureState();
    if (state.aiEnabled) {
      this.ensureAiPlayers(state);
    }
    if (state.won) {
      return this.outcome(
        state,
        `已达成财务自由！${formatMoney(state.passiveIncome)} >= ${formatMoney(
          this.getTotalExpenses(state)
        )}`
      );
    }

    if (state.lost) {
      return this.outcome(state, state.lossReason ?? "本局已失败，请重新开局");
    }

    return this.outcome(
      state,
      `${this.getPhaseLabel(state.phase)} · 现金 ${formatMoney(state.cash)} · 被动收入 ${formatMoney(
        state.passiveIncome
      )}/月 · 债务 ${formatMoney(state.debt)}${
        state.aiEnabled ? ` · AI ${state.aiPlayers.length} 名` : ""
      }`
    );
  }

  getReports(): CashflowReportOutcome {
    const state = this.ensureState();
    return {
      ...this.getState(),
      reports: this.createReports(state)
    };
  }

  reset(preferredJobKey?: string): CashflowOutcome {
    this.state = this.createInitialState(preferredJobKey);
    return this.outcome(
      this.state,
      `新开一局：${this.state.role}，初始现金 ${formatMoney(this.state.cash)}，负债 ${formatMoney(this.state.debt)}`
    );
  }

  nextTurn(): CashflowOutcome {
    const state = this.ensureState();
    if (state.won) {
      return this.outcome(state, "已达成财务自由，可以点击“新开一局”再玩一局");
    }

    if (state.lost) {
      return this.outcome(state, state.lossReason ?? "本局已失败，请重新开局");
    }

    state.turn += 1;
    const salaryAfterTax = this.getSalaryAfterTax(state);
    const monthlyNet = this.getMonthlyNet(state);
    state.cash += monthlyNet;

    if (state.debt > 0 && state.debtPayment > 0) {
      const principalReduction = Math.max(
        0,
        Math.round(state.debtPayment * 0.35)
      );
      state.debt = Math.max(0, state.debt - principalReduction);
      if (state.debt === 0) {
        state.debtPayment = 0;
        this.appendLog(state, "债务已清偿，后续不再承担每月债务还款");
      }
    }

    this.appendLog(
      state,
      `回合结算：税后工资 ${formatMoney(salaryAfterTax)}，月净现金流 ${formatMoney(
        monthlyNet
      )}，结余 ${formatMoney(state.cash)}`
    );

    const eventResult = this.applyRandomEvent(state);
    const transitioned = this.evaluatePhase(state, true);
    if (transitioned) {
      state.currentOpportunity = null;
    }
    this.ensureOpportunity(state);

    this.evaluateLoss(state);
    this.evaluateWin(state);

    if (state.lost) {
      this.appendLog(state, state.lossReason ?? "本局失败");
      return this.outcome(state, state.lossReason ?? "本局失败");
    }

    if (state.won) {
      this.appendLog(state, "财务自由达成！被动收入已覆盖总支出");
      return this.outcome(
        state,
        `恭喜通关！被动收入 ${formatMoney(state.passiveIncome)} >= 总支出 ${formatMoney(
          this.getTotalExpenses(state)
        )}`
      );
    }

    const aiSummaries = this.advanceAiPlayers(state);
    if (aiSummaries.length > 0) {
      this.appendLog(state, `AI 回合：${aiSummaries.join("；")}`);
    }

    const eventText = eventResult
      ? ` · ${eventCategoryLabel(eventResult.category)} ${eventResult.title}`
      : "";
    const transitionText = transitioned ? " · 已进入自由阶段" : "";
    const aiText = aiSummaries.length > 0 ? ` · AI：${aiSummaries.join("；")}` : "";
    return this.outcome(
      state,
      `结算：税后工资 ${formatMoney(salaryAfterTax)} + 被动收入 ${formatMoney(
        state.passiveIncome
      )} - 总支出 ${formatMoney(
        this.getTotalExpenses(state)
      )} = ${formatSignedMoney(monthlyNet)}${eventText}${transitionText}${aiText} · 现金 ${formatMoney(
        state.cash
      )}`
    );
  }

  buyCurrentOpportunity(): CashflowOutcome {
    const state = this.ensureState();
    if (state.won) {
      return this.outcome(state, "已达成财务自由，无需继续买入资产");
    }

    if (state.lost) {
      return this.outcome(state, state.lossReason ?? "本局已失败，请重新开局");
    }

    const opportunity = state.currentOpportunity;
    if (!opportunity) {
      return this.outcome(state, "当前没有可购买的机会");
    }

    if (state.cash < opportunity.cost) {
      return this.outcome(
        state,
        `现金不足，需要 ${formatMoney(opportunity.cost)}，当前 ${formatMoney(
          state.cash
        )}。可尝试“贷款买入”`
      );
    }

    state.cash -= opportunity.cost;
    this.applyOpportunityToPortfolio(state, opportunity);

    this.appendLog(
      state,
      `买入 ${opportunity.title}：${formatMoney(
        opportunity.cost
      )}，被动收入 +${formatMoney(opportunity.cashflow)}/月`
    );

    const settlementMessage = this.applyBigDealSettlement(state, opportunity.key);
    const resultMessage = settlementMessage
      ? `购买成功：被动收入 ${formatMoney(state.passiveIncome)}/月 · ${settlementMessage}`
      : `购买成功：被动收入 ${formatMoney(state.passiveIncome)}/月`;

    return this.finalizeAfterOpportunityAction(
      state,
      resultMessage
    );
  }

  buyCurrentOpportunityWithLoan(): CashflowOutcome {
    const state = this.ensureState();
    if (state.won) {
      return this.outcome(state, "已达成财务自由，无需继续买入资产");
    }

    if (state.lost) {
      return this.outcome(state, state.lossReason ?? "本局已失败，请重新开局");
    }

    const opportunity = state.currentOpportunity;
    if (!opportunity) {
      return this.outcome(state, "当前没有可购买的机会");
    }

    if (state.cash >= opportunity.cost) {
      return this.buyCurrentOpportunity();
    }

    const loanNeeded = opportunity.cost - state.cash;
    const paymentIncrease = Math.max(120, Math.round(loanNeeded * 0.015));

    const cashUsed = state.cash;
    state.cash = 0;
    state.debt += loanNeeded;
    state.debtPayment += paymentIncrease;
    this.applyOpportunityToPortfolio(state, opportunity);

    this.appendLog(
      state,
      `贷款买入 ${opportunity.title}：自有资金 ${formatMoney(
        cashUsed
      )} + 贷款 ${formatMoney(loanNeeded)}，债务还款 +${formatMoney(
        paymentIncrease
      )}/月，被动收入 +${formatMoney(opportunity.cashflow)}/月`
    );

    const settlementMessage = this.applyBigDealSettlement(state, opportunity.key);
    const resultMessage = settlementMessage
      ? `贷款买入成功：新增贷款 ${formatMoney(loanNeeded)}，债务还款 +${formatMoney(
          paymentIncrease
        )}/月 · ${settlementMessage}`
      : `贷款买入成功：新增贷款 ${formatMoney(loanNeeded)}，债务还款 +${formatMoney(
          paymentIncrease
        )}/月`;

    return this.finalizeAfterOpportunityAction(
      state,
      resultMessage
    );
  }

  skipCurrentOpportunity(): CashflowOutcome {
    const state = this.ensureState();
    if (state.won) {
      return this.outcome(state, "已达成财务自由，无需继续操作机会卡");
    }

    if (state.lost) {
      return this.outcome(state, state.lossReason ?? "本局已失败，请重新开局");
    }

    if (!state.currentOpportunity) {
      return this.outcome(state, "当前没有机会可跳过");
    }

    this.appendLog(state, `跳过机会：${state.currentOpportunity.title}`);
    state.currentOpportunity = null;
    this.ensureOpportunity(state);
    return this.outcome(state, "已跳过当前机会");
  }
}
