namespace RendererPanelRuntime {

  export function cashflowPhaseLabel(phase: CashflowPhase): string {
    return phase === "freedom-phase"
      ? "\u8d22\u5bcc\u81ea\u7531\u9636\u6bb5"
      : "\u8001\u9f20\u8d5b\u8dd1\u9636\u6bb5";
  }

  export function parseCashflowOpportunity(value: unknown): CashflowOpportunity | null {
    const record = toRecord(value);
    if (!record) {
      return null;
    }

    if (
      typeof record.id !== "string" ||
      typeof record.key !== "string" ||
      typeof record.title !== "string" ||
      typeof record.description !== "string" ||
      typeof record.cost !== "number" ||
      typeof record.cashflow !== "number"
    ) {
      return null;
    }

    const tier =
      record.tier === "small" || record.tier === "medium" || record.tier === "big"
        ? record.tier
        : undefined;
    const dealClass =
      record.dealClass === "big-deal" || record.dealClass === "normal"
        ? record.dealClass
        : undefined;

    return {
      id: record.id,
      key: record.key,
      tier,
      dealClass,
      title: record.title,
      description: record.description,
      cost: record.cost,
      cashflow: record.cashflow
    };
  }

  export function parseCashflowAsset(value: unknown): CashflowAsset | null {
    const record = toRecord(value);
    if (!record) {
      return null;
    }

    if (
      typeof record.key !== "string" ||
      typeof record.title !== "string" ||
      typeof record.totalCost !== "number" ||
      typeof record.totalCashflow !== "number" ||
      typeof record.count !== "number"
    ) {
      return null;
    }

    return {
      key: record.key,
      title: record.title,
      totalCost: record.totalCost,
      totalCashflow: record.totalCashflow,
      count: record.count
    };
  }

  export function parseCashflowAiPlayer(value: unknown): CashflowAiPlayer | null {
    const record = toRecord(value);
    if (!record) {
      return null;
    }

    if (
      typeof record.id !== "string" ||
      typeof record.profileKey !== "string" ||
      typeof record.name !== "string" ||
      typeof record.profileDescription !== "string" ||
      typeof record.turn !== "number" ||
      typeof record.role !== "string" ||
      typeof record.salary !== "number" ||
      typeof record.expenses !== "number" ||
      typeof record.passiveIncome !== "number" ||
      typeof record.cash !== "number" ||
      typeof record.won !== "boolean"
    ) {
      return null;
    }

    const jobKey = typeof record.jobKey === "string" ? record.jobKey : "";
    const phase: CashflowPhase =
      record.phase === "freedom-phase" ? "freedom-phase" : "rat-race";
    const taxRate =
      typeof record.taxRate === "number" && Number.isFinite(record.taxRate)
        ? record.taxRate
        : 0;
    const debt =
      typeof record.debt === "number" && Number.isFinite(record.debt)
        ? record.debt
        : 0;
    const debtPayment =
      typeof record.debtPayment === "number" && Number.isFinite(record.debtPayment)
        ? record.debtPayment
        : 0;
    const lost = typeof record.lost === "boolean" ? record.lost : false;
    const lossReason =
      typeof record.lossReason === "string" && record.lossReason.trim()
        ? record.lossReason
        : null;
    const lastDecision =
      typeof record.lastDecision === "string" && record.lastDecision.trim()
        ? record.lastDecision
        : null;

    const currentOpportunity =
      record.currentOpportunity === null
        ? null
        : parseCashflowOpportunity(record.currentOpportunity);
    if (record.currentOpportunity !== null && !currentOpportunity) {
      return null;
    }

    if (!Array.isArray(record.assets) || !Array.isArray(record.logs)) {
      return null;
    }

    const assets: CashflowAsset[] = [];
    for (const item of record.assets) {
      const parsed = parseCashflowAsset(item);
      if (!parsed) {
        return null;
      }
      assets.push(parsed);
    }

    const logs = record.logs.filter(
      (item): item is string => typeof item === "string"
    );

    return {
      id: record.id,
      profileKey: record.profileKey,
      name: record.name,
      profileDescription: record.profileDescription,
      jobKey,
      turn: record.turn,
      phase,
      role: record.role,
      taxRate,
      debt,
      debtPayment,
      salary: record.salary,
      expenses: record.expenses,
      passiveIncome: record.passiveIncome,
      cash: record.cash,
      currentOpportunity,
      assets,
      logs,
      won: record.won,
      lost,
      lossReason,
      lastDecision
    };
  }

  export function parseCashflowState(value: unknown): CashflowState | null {
    const record = toRecord(value);
    if (!record) {
      return null;
    }

    if (
      typeof record.turn !== "number" ||
      typeof record.role !== "string" ||
      typeof record.salary !== "number" ||
      typeof record.expenses !== "number" ||
      typeof record.passiveIncome !== "number" ||
      typeof record.cash !== "number" ||
      typeof record.won !== "boolean"
    ) {
      return null;
    }

    const jobKey = typeof record.jobKey === "string" ? record.jobKey : "";
    const phase: CashflowPhase =
      record.phase === "freedom-phase" ? "freedom-phase" : "rat-race";
    const taxRate =
      typeof record.taxRate === "number" && Number.isFinite(record.taxRate)
        ? record.taxRate
        : 0;
    const debt =
      typeof record.debt === "number" && Number.isFinite(record.debt)
        ? record.debt
        : 0;
    const debtPayment =
      typeof record.debtPayment === "number" && Number.isFinite(record.debtPayment)
        ? record.debtPayment
        : 0;
    const lost = typeof record.lost === "boolean" ? record.lost : false;
    const lossReason =
      typeof record.lossReason === "string" && record.lossReason.trim()
        ? record.lossReason
        : null;

    const currentOpportunity =
      record.currentOpportunity === null
        ? null
        : parseCashflowOpportunity(record.currentOpportunity);
    if (record.currentOpportunity !== null && !currentOpportunity) {
      return null;
    }

    if (!Array.isArray(record.assets) || !Array.isArray(record.logs)) {
      return null;
    }

    const assets: CashflowAsset[] = [];
    for (const item of record.assets) {
      const parsed = parseCashflowAsset(item);
      if (!parsed) {
        return null;
      }
      assets.push(parsed);
    }

    const logs = record.logs.filter(
      (item): item is string => typeof item === "string"
    );
    const aiEnabled = typeof record.aiEnabled === "boolean" ? record.aiEnabled : false;
    const aiPlayersRaw = Array.isArray(record.aiPlayers) ? record.aiPlayers : [];
    const aiPlayers: CashflowAiPlayer[] = [];
    for (const item of aiPlayersRaw) {
      const parsed = parseCashflowAiPlayer(item);
      if (!parsed) {
        return null;
      }
      aiPlayers.push(parsed);
    }

    return {
      jobKey,
      turn: record.turn,
      phase,
      aiEnabled,
      aiPlayers,
      role: record.role,
      taxRate,
      debt,
      debtPayment,
      salary: record.salary,
      expenses: record.expenses,
      passiveIncome: record.passiveIncome,
      cash: record.cash,
      currentOpportunity,
      assets,
      logs,
      won: record.won,
      lost,
      lossReason
    };
  }

  export function parseCashflowAmountItem(
    value: unknown
  ): CashflowIncomeReportItem | CashflowExpenseReportItem | null {
    const record = toRecord(value);
    if (!record) {
      return null;
    }

    if (typeof record.name !== "string" || typeof record.amount !== "number") {
      return null;
    }

    return {
      name: record.name,
      amount: record.amount
    };
  }

  export function parseCashflowBalanceSheetReport(
    value: unknown
  ): CashflowBalanceSheetReport | null {
    const record = toRecord(value);
    if (!record) {
      return null;
    }

    if (
      typeof record.cash !== "number" ||
      typeof record.assetsTotal !== "number" ||
      typeof record.debtsTotal !== "number" ||
      typeof record.netWorth !== "number"
    ) {
      return null;
    }

    return {
      cash: record.cash,
      assetsTotal: record.assetsTotal,
      debtsTotal: record.debtsTotal,
      netWorth: record.netWorth
    };
  }

  export function parseCashflowMetricsReport(value: unknown): CashflowMetricsReport | null {
    const record = toRecord(value);
    if (!record) {
      return null;
    }

    if (
      typeof record.monthlyNet !== "number" ||
      typeof record.passiveIncomeRatio !== "number" ||
      typeof record.debtRatio !== "number" ||
      typeof record.cashReserveMonths !== "number"
    ) {
      return null;
    }

    return {
      monthlyNet: record.monthlyNet,
      passiveIncomeRatio: record.passiveIncomeRatio,
      debtRatio: record.debtRatio,
      cashReserveMonths: record.cashReserveMonths
    };
  }

  export function parseCashflowReports(value: unknown): CashflowReports | null {
    const record = toRecord(value);
    if (!record) {
      return null;
    }

    if (!Array.isArray(record.income) || !Array.isArray(record.expenses)) {
      return null;
    }

    const income: CashflowIncomeReportItem[] = [];
    for (const item of record.income) {
      const parsed = parseCashflowAmountItem(item);
      if (!parsed) {
        return null;
      }
      income.push(parsed);
    }

    const expenses: CashflowExpenseReportItem[] = [];
    for (const item of record.expenses) {
      const parsed = parseCashflowAmountItem(item);
      if (!parsed) {
        return null;
      }
      expenses.push(parsed);
    }

    const balanceSheet = parseCashflowBalanceSheetReport(record.balanceSheet);
    const metrics = parseCashflowMetricsReport(record.metrics);
    if (!balanceSheet || !metrics) {
      return null;
    }

    return {
      income,
      expenses,
      balanceSheet,
      metrics
    };
  }

  export function parseCashflowJobOption(value: unknown): CashflowJobOption | null {
    const record = toRecord(value);
    if (!record) {
      return null;
    }

    if (
      typeof record.key !== "string" ||
      typeof record.role !== "string" ||
      typeof record.salary !== "number" ||
      typeof record.expenses !== "number" ||
      typeof record.taxRate !== "number" ||
      typeof record.initialDebt !== "number" ||
      typeof record.debtPayment !== "number"
    ) {
      return null;
    }

    return {
      key: record.key,
      role: record.role,
      salary: record.salary,
      expenses: record.expenses,
      taxRate: record.taxRate,
      initialDebt: record.initialDebt,
      debtPayment: record.debtPayment
    };
  }

  export function extractCashflowState(result: ExecuteResult): CashflowState | null {
    const data = toRecord(result.data);
    if (!data) {
      return null;
    }
    return parseCashflowState(data.cashflowState);
  }

  export function extractCashflowReports(result: ExecuteResult): CashflowReports | null {
    const data = toRecord(result.data);
    if (!data) {
      return null;
    }
    return parseCashflowReports(data.cashflowReports);
  }

  export function extractCashflowJobs(result: ExecuteResult): CashflowJobOption[] | null {
    const data = toRecord(result.data);
    if (!data) {
      return null;
    }

    if (!Array.isArray(data.cashflowJobs)) {
      return null;
    }

    const jobs: CashflowJobOption[] = [];
    for (const item of data.cashflowJobs) {
      const parsed = parseCashflowJobOption(item);
      if (!parsed) {
        return null;
      }
      jobs.push(parsed);
    }
    return jobs;
  }

  export function buildCashflowTarget(
    action: CashflowAction,
    options?: { roleKey?: string }
  ): string {
    const params = new URLSearchParams();
    params.set("action", action);
    if (options?.roleKey) {
      params.set("role", options.roleKey);
    }
    return `command:plugin:${CASHFLOW_PLUGIN_ID}?${params.toString()}`;
  }

  export function createCashflowActionItem(
    action: CashflowAction,
    options?: { roleKey?: string }
  ): LaunchItem {
    return {
      id: `plugin:${CASHFLOW_PLUGIN_ID}:${action}`,
      type: "command",
      title: "\u5bcc\u7238\u7238\u73b0\u91d1\u6d41",
      subtitle: `\u6e38\u620f\u52a8\u4f5c\uff1a${action}`,
      target: buildCashflowTarget(action, options),
      keywords: ["plugin", "cashflow", "cash", "cf", "\u73b0\u91d1\u6d41"]
    };
  }

  export function buildCashflowReviewScore(state: CashflowState, reports: CashflowReports | null): number {
    const totalExpenses = state.expenses + state.debtPayment;
    const freedomRatio =
      totalExpenses > 0 ? Math.min(1, state.passiveIncome / totalExpenses) : state.passiveIncome > 0 ? 1 : 0;
    const assetScore = Math.min(1, state.assets.length / 6);
    const turnPenalty = Math.max(0, 1 - state.turn / 80);
    let outcomeBonus = 0;
    if (state.won) {
      outcomeBonus = 0.25;
    } else if (state.lost) {
      outcomeBonus = -0.15;
    }
    const debtPenalty =
      reports && reports.balanceSheet.debtsTotal > 0
        ? Math.min(0.2, reports.metrics.debtRatio * 0.2)
        : 0;
    const raw =
      freedomRatio * 55 + assetScore * 20 + turnPenalty * 10 + outcomeBonus * 100 - debtPenalty * 100;
    return Math.max(0, Math.min(100, Math.round(raw)));
  }

  export function buildCashflowReviewAdvice(state: CashflowState, score: number): string {
    if (state.won) {
      return "本局已达成财务自由，可复盘哪些资产组合最有效，并尝试更高难度职业或 AI 对战。";
    }
    if (state.lost) {
      return state.lossReason
        ? `失败主因：${state.lossReason}。下一局优先控制负债、保留现金储备，并避免连续大额贷款投资。`
        : "本局已失败，下一局优先控制负债并提高被动收入覆盖总支出的比例。";
    }
    if (score >= 75) {
      return "节奏良好，继续优先选择能显著提升被动收入的机会，并留意现金储备是否足够应对突发支出。";
    }
    if (score >= 45) {
      return "已有积累但尚未脱离老鼠赛跑，建议减少无效跳过，聚焦现金流为正且回本周期短的机会。";
    }
    return "开局阶段建议先稳定现金流，避免过早加杠杆；每回合都记录机会成本，再决定是否买入。";
  }

  export function renderCashflowReviewPanelView(state: CashflowState, reports: CashflowReports | null): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel cashflow-panel cashflow-panel-review";

    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = "现金流复盘";

    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent = "按时间线回顾本局关键决策，并查看结算总结。";

    const score = buildCashflowReviewScore(state, reports);
    const summaryCard = document.createElement("section");
    summaryCard.className = "cashflow-review-summary";
    const summaryTitle = document.createElement("h4");
    summaryTitle.className = "cashflow-block-title";
    summaryTitle.textContent = "结算总结";
    const scoreNode = document.createElement("div");
    scoreNode.className = "cashflow-review-score";
    scoreNode.textContent = `综合评分 ${score} / 100`;
    const adviceNode = document.createElement("p");
    adviceNode.className = "cashflow-review-advice";
    adviceNode.textContent = buildCashflowReviewAdvice(state, score);
    const metaNode = document.createElement("div");
    metaNode.className = "cashflow-review-meta";
    metaNode.textContent =
      `${state.role} · 第 ${state.turn} 回合 · ${cashflowPhaseLabel(state.phase)} · ` +
      `被动收入 ${formatMoney(state.passiveIncome)}/月 · 现金 ${formatMoney(state.cash)}`;
    summaryCard.append(summaryTitle, scoreNode, adviceNode, metaNode);

    const timelineBlock = document.createElement("section");
    timelineBlock.className = "cashflow-block cashflow-block-review-timeline";
    const timelineTitle = document.createElement("h4");
    timelineTitle.className = "cashflow-block-title";
    timelineTitle.textContent = "决策时间线";
    timelineBlock.appendChild(timelineTitle);

    const timelineList = document.createElement("ol");
    timelineList.className = "cashflow-review-timeline";
    const timelineEntries = [...state.logs].reverse();
    for (const entry of timelineEntries) {
      const item = document.createElement("li");
      item.className = "cashflow-review-timeline-item";
      item.textContent = entry;
      timelineList.appendChild(item);
    }
    if (timelineEntries.length === 0) {
      const empty = document.createElement("div");
      empty.className = "cashflow-empty";
      empty.textContent = "暂无决策记录，先进行几回合游戏后再复盘。";
      timelineBlock.appendChild(empty);
    } else {
      timelineBlock.appendChild(timelineList);
    }

    if (state.aiEnabled && state.aiPlayers.length > 0) {
      const aiBlock = document.createElement("section");
      aiBlock.className = "cashflow-block";
      const aiTitle = document.createElement("h4");
      aiTitle.className = "cashflow-block-title";
      aiTitle.textContent = "AI 对手摘要";
      aiBlock.appendChild(aiTitle);
      const aiList = document.createElement("ul");
      aiList.className = "cashflow-review-ai-list";
      for (const aiPlayer of state.aiPlayers) {
        const item = document.createElement("li");
        item.textContent =
          `${aiPlayer.name} · 现金 ${formatMoney(aiPlayer.cash)} · 被动收入 ${formatMoney(aiPlayer.passiveIncome)}/月 · ` +
          `最近决策：${aiPlayer.lastDecision ?? "暂无"}`;
        aiList.appendChild(item);
      }
      aiBlock.appendChild(aiList);
      panel.append(title, description, summaryCard, timelineBlock, aiBlock);
    } else {
      panel.append(title, description, summaryCard, timelineBlock);
    }

    const actions = document.createElement("div");
    actions.className = "settings-actions cashflow-actions";
    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "settings-btn settings-btn-primary";
    backButton.textContent = "返回游戏面板";
    backButton.addEventListener("click", () => {
      cashflowReviewMode = false;
      renderList();
    });
    const refreshButton = document.createElement("button");
    refreshButton.type = "button";
    refreshButton.className = "settings-btn settings-btn-secondary";
    refreshButton.textContent = "刷新复盘";
    refreshButton.addEventListener("click", () => {
      void refreshStandaloneCashflowPanel().then((ok) => {
        if (ok) {
          renderList();
        }
      });
    });
    actions.append(backButton, refreshButton);
    panel.appendChild(actions);

    panelItem.appendChild(panel);
    list.appendChild(panelItem);
  }

  export function cashflowStatusSummary(state: CashflowState): string {
    const totalExpenses = state.expenses + state.debtPayment;
    if (state.lost) {
      return state.lossReason ?? "\u672c\u5c40\u5df2\u5931\u8d25\uff0c\u8bf7\u65b0\u5f00\u4e00\u5c40";
    }
    if (state.won) {
      return `\u5df2\u8fbe\u6210\u8d22\u52a1\u81ea\u7531\uff08${cashflowPhaseLabel(state.phase)}\uff09\uff01${formatMoney(
        state.passiveIncome
      )} >= ${formatMoney(totalExpenses)}`;
    }
    return `${cashflowPhaseLabel(state.phase)} \u00b7 \u73b0\u91d1 ${formatMoney(state.cash)} \u00b7 \u88ab\u52a8\u6536\u5165 ${formatMoney(
      state.passiveIncome
    )}/\u6708 \u00b7 \u503a\u52a1 ${formatMoney(state.debt)}`;
  }

  export async function executeCashflowAction(
    action: CashflowAction,
    options?: { roleKey?: string }
  ): Promise<ExecuteResult | null> {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("\u6865\u63a5\u5c42\u672a\u52a0\u8f7d\uff0c\u65e0\u6cd5\u6267\u884c\u73b0\u91d1\u6d41\u64cd\u4f5c");
      return null;
    }

    const item = createCashflowActionItem(action, options);
    const result = await launcher.execute(item);
    if (!result.ok) {
      setStatus(result.message ?? "\u73b0\u91d1\u6d41\u64cd\u4f5c\u5931\u8d25");
      return null;
    }

    const nextState = extractCashflowState(result);
    if (nextState) {
      cashflowState = nextState;
    }
    const nextReports = extractCashflowReports(result);
    cashflowReports = nextReports;
    const nextJobs = extractCashflowJobs(result);
    if (nextJobs) {
      cashflowJobs = nextJobs;
    }

    if (result.message) {
      setStatus(result.message);
    } else if (cashflowState) {
      setStatus(cashflowStatusSummary(cashflowState));
    }

    return result;
  }

  export async function nextCashflowTurn(): Promise<void> {
    const result = await executeCashflowAction("next-turn");
    if (!result) {
      return;
    }
    renderList();
  }

  export async function buyCashflowOpportunity(): Promise<void> {
    const result = await executeCashflowAction("buy");
    if (!result) {
      return;
    }
    renderList();
  }

  export async function buyCashflowOpportunityWithLoan(): Promise<void> {
    const result = await executeCashflowAction("buy-loan");
    if (!result) {
      return;
    }
    renderList();
  }

  export async function skipCashflowOpportunity(): Promise<void> {
    const result = await executeCashflowAction("skip");
    if (!result) {
      return;
    }
    renderList();
  }

  export async function resetCashflowGame(roleKey?: string): Promise<void> {
    const result = await executeCashflowAction("reset", { roleKey });
    if (!result) {
      return;
    }
    renderList();
  }

  export function createCashflowStat(
    label: string,
    value: string,
    emphasize = false
  ): HTMLDivElement {
    const node = document.createElement("div");
    node.className = "cashflow-stat";
    if (emphasize) {
      node.classList.add("cashflow-stat-emphasis");
    }

    const labelNode = document.createElement("div");
    labelNode.className = "cashflow-stat-label";
    labelNode.textContent = label;

    const valueNode = document.createElement("div");
    valueNode.className = "cashflow-stat-value";
    valueNode.textContent = value;

    node.append(labelNode, valueNode);
    return node;
  }

  export function createCashflowReportList(
    title: string,
    items: Array<{ name: string; amount: number }>
  ): HTMLDivElement {
    const block = document.createElement("div");
    block.className = "cashflow-report-item";

    const head = document.createElement("div");
    head.className = "cashflow-report-item-title";
    head.textContent = title;
    block.appendChild(head);

    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "cashflow-empty";
      empty.textContent = "\u6682\u65e0\u6761\u76ee";
      block.appendChild(empty);
      return block;
    }

    const listNode = document.createElement("ul");
    listNode.className = "cashflow-report-list";
    for (const item of items) {
      const row = document.createElement("li");
      row.className = "cashflow-report-row";

      const name = document.createElement("span");
      name.className = "cashflow-report-name";
      name.textContent = item.name;

      const amount = document.createElement("span");
      amount.className = "cashflow-report-amount";
      amount.textContent = formatMoney(item.amount);

      row.append(name, amount);
      listNode.appendChild(row);
    }
    block.appendChild(listNode);
    return block;
  }

  export function createCashflowMetricRow(label: string, value: string): HTMLDivElement {
    const row = document.createElement("div");
    row.className = "cashflow-metric-row";

    const name = document.createElement("span");
    name.className = "cashflow-metric-label";
    name.textContent = label;

    const val = document.createElement("span");
    val.className = "cashflow-metric-value";
    val.textContent = value;

    row.append(name, val);
    return row;
  }

  export function createCashflowBadge(
    text: string,
    tone: "info" | "success" | "warning" | "danger" = "info"
  ): HTMLSpanElement {
    const badge = document.createElement("span");
    badge.className = `cashflow-badge cashflow-badge-${tone}`;
    badge.textContent = text;
    return badge;
  }

  export function renderStandaloneCashflowPanelView(): void {
    const state = cashflowState;
    const reports = cashflowReports;
    if (state && cashflowReviewMode) {
      renderCashflowReviewPanelView(state, reports);
      return;
    }

    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel cashflow-panel";

    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = "\u5bcc\u7238\u7238\u73b0\u91d1\u6d41\uff08\u63d2\u4ef6\u6e38\u620f\uff09";

    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      "\u76ee\u6807\uff1a\u628a\u88ab\u52a8\u6536\u5165\u63d0\u9ad8\u5230\u4e0d\u4f4e\u4e8e\u603b\u652f\u51fa\uff0c\u8fbe\u6210\u8d22\u52a1\u81ea\u7531\u3002";

    if (!state) {
      const loading = document.createElement("div");
      loading.className = "cashflow-empty";
      loading.textContent = "\u6b63\u5728\u52a0\u8f7d\u6e38\u620f\u6570\u636e...";
      panel.append(title, description, loading);
      panelItem.appendChild(panel);
      list.appendChild(panelItem);
      return;
    }

    const salaryAfterTax = Math.max(0, Math.round(state.salary * (1 - state.taxRate)));
    const totalExpenses = state.expenses + state.debtPayment;
    const monthlyNet = salaryAfterTax + state.passiveIncome - totalExpenses;
    const freedomTarget = Math.max(1, totalExpenses);
    const freedomProgress = Math.max(0, Math.min(1, state.passiveIncome / freedomTarget));
    const freedomGap = Math.max(0, totalExpenses - state.passiveIncome);

    const hud = document.createElement("section");
    hud.className = "cashflow-hud";

    const hudTop = document.createElement("div");
    hudTop.className = "cashflow-hud-top";
    const hudTitle = document.createElement("div");
    hudTitle.className = "cashflow-hud-title";
    hudTitle.textContent = "\u8d22\u52a1\u81ea\u7531\u6311\u6218";

    const hudBadges = document.createElement("div");
    hudBadges.className = "cashflow-hud-badges";
    hudBadges.append(
      createCashflowBadge(cashflowPhaseLabel(state.phase), "info"),
      createCashflowBadge(`M${state.turn}`, "warning"),
      createCashflowBadge(
        state.won
          ? "\u5df2\u901a\u5173"
          : state.lost
            ? "\u672c\u5c40\u5931\u8d25"
            : "\u6e38\u620f\u4e2d",
        state.won ? "success" : state.lost ? "danger" : "info"
      )
    );
    hudTop.append(hudTitle, hudBadges);

    const progressLabel = document.createElement("div");
    progressLabel.className = "cashflow-progress-label";
    progressLabel.textContent = `\u8d22\u52a1\u81ea\u7531\u8fdb\u5ea6 ${Math.round(
      freedomProgress * 100
    )}%`;

    const progressTrack = document.createElement("div");
    progressTrack.className = "cashflow-progress-track";
    const progressFill = document.createElement("div");
    progressFill.className = "cashflow-progress-fill";
    progressFill.style.width = `${Math.round(freedomProgress * 100)}%`;
    progressTrack.appendChild(progressFill);

    const progressHint = document.createElement("div");
    progressHint.className = "cashflow-progress-hint";
    progressHint.textContent = state.won
      ? `\u5df2\u8fbe\u6210\uff1a${formatMoney(state.passiveIncome)} \u2265 ${formatMoney(
          totalExpenses
        )}`
      : state.lost
        ? "\u5f53\u524d\u5bf9\u5c40\u5df2\u7ed3\u675f\uff0c\u53ef\u76f4\u63a5\u65b0\u5f00\u4e00\u5c40"
        : `\u8ddd\u79bb\u901a\u5173\u8fd8\u5dee ${formatMoney(freedomGap)}/\u6708 \u88ab\u52a8\u6536\u5165`;

    hud.append(hudTop, progressLabel, progressTrack, progressHint);

    const statGrid = document.createElement("div");
    statGrid.className = "cashflow-stats";
    statGrid.append(
      createCashflowStat("\u73b0\u91d1", formatMoney(state.cash), true),
      createCashflowStat(
        "\u88ab\u52a8\u6536\u5165",
        `${formatMoney(state.passiveIncome)}/\u6708`,
        true
      ),
      createCashflowStat(
        "\u6708\u51c0\u73b0\u91d1\u6d41",
        `${monthlyNet >= 0 ? "+" : ""}${formatMoney(monthlyNet)}/\u6708`,
        monthlyNet >= 0
      ),
      createCashflowStat("\u5269\u4f59\u503a\u52a1", formatMoney(state.debt)),
      createCashflowStat(
        "\u7a0e\u540e\u5de5\u8d44",
        `${formatMoney(salaryAfterTax)}/\u6708`
      ),
      createCashflowStat("\u603b\u652f\u51fa", `${formatMoney(totalExpenses)}/\u6708`),
      createCashflowStat("\u804c\u4e1a", state.role),
      createCashflowStat(
        "\u72b6\u6001",
        state.won
          ? "\u5df2\u8fbe\u6210\u8d22\u52a1\u81ea\u7531"
          : state.lost
            ? "\u672c\u5c40\u5931\u8d25"
            : "\u7a33\u6b65\u7d2f\u79ef\u4e2d",
        state.won || state.lost
      )
    );

    const roleBlock = document.createElement("section");
    roleBlock.className = "cashflow-block";
    roleBlock.classList.add("cashflow-block-role");
    const roleTitle = document.createElement("h4");
    roleTitle.className = "cashflow-block-title";
    roleTitle.textContent = "\u5f00\u5c40\u804c\u4e1a";
    roleBlock.appendChild(roleTitle);

    if (cashflowJobs.length === 0) {
      const emptyJobs = document.createElement("div");
      emptyJobs.className = "cashflow-empty";
      emptyJobs.textContent = "\u804c\u4e1a\u5217\u8868\u52a0\u8f7d\u4e2d...";
      roleBlock.appendChild(emptyJobs);
    } else {
      const roleForm = document.createElement("div");
      roleForm.className = "cashflow-role-picker";

      const roleSelect = document.createElement("select");
      roleSelect.className = "cashflow-role-select";
      for (const job of cashflowJobs) {
        const option = document.createElement("option");
        option.value = job.key;
        option.textContent =
          `${job.role} \u00b7 \u7a0e\u7387 ${formatPercent(job.taxRate)} \u00b7 \u503a\u52a1 ${formatMoney(job.initialDebt)}`;
        if (job.key === state.jobKey) {
          option.selected = true;
        }
        roleSelect.appendChild(option);
      }

      const roleResetButton = document.createElement("button");
      roleResetButton.type = "button";
      roleResetButton.className = "settings-btn settings-btn-secondary";
      roleResetButton.textContent = "\u4ee5\u8be5\u804c\u4e1a\u65b0\u5f00";
      roleResetButton.addEventListener("click", () => {
        void resetCashflowGame(roleSelect.value);
      });

      roleForm.append(roleSelect, roleResetButton);
      roleBlock.appendChild(roleForm);
    }

    if (state.lost) {
      const lostNote = document.createElement("div");
      lostNote.className = "cashflow-failed-note";
      lostNote.textContent = state.lossReason ?? "\u672c\u5c40\u5931\u8d25\uff0c\u8bf7\u65b0\u5f00\u4e00\u5c40\u3002";
      roleBlock.appendChild(lostNote);
    }

    const aiBlock = document.createElement("section");
    aiBlock.className = "cashflow-block";
    aiBlock.classList.add("cashflow-block-ai");
    const aiTitle = document.createElement("h4");
    aiTitle.className = "cashflow-block-title";
    aiTitle.textContent = "AI \u5bf9\u624b";
    aiBlock.appendChild(aiTitle);

    if (!state.aiEnabled || state.aiPlayers.length === 0) {
      const emptyAi = document.createElement("div");
      emptyAi.className = "cashflow-empty";
      emptyAi.textContent =
        "\u5f53\u524d\u4e3a\u5355\u4eba\u6a21\u5f0f\uff0c\u53ef\u5728\u4e0b\u65b9\u6309\u94ae\u5f00\u542f AI \u5bf9\u6218\u3002";
      aiBlock.appendChild(emptyAi);
    } else {
      const aiList = document.createElement("div");
      aiList.className = "cashflow-ai-list";
      for (const aiPlayer of state.aiPlayers) {
        const card = document.createElement("article");
        card.className = "cashflow-ai-card";

        const head = document.createElement("div");
        head.className = "cashflow-ai-head";
        const nameNode = document.createElement("div");
        nameNode.className = "cashflow-ai-name";
        nameNode.textContent = `${aiPlayer.name}\uff08${aiPlayer.role}\uff09`;
        const phaseNode = document.createElement("div");
        phaseNode.className = "cashflow-ai-phase";
        phaseNode.textContent = cashflowPhaseLabel(aiPlayer.phase);
        head.append(nameNode, phaseNode);

        const totalExpensesAi = aiPlayer.expenses + aiPlayer.debtPayment;
        const salaryAfterTaxAi = Math.max(
          0,
          Math.round(aiPlayer.salary * (1 - aiPlayer.taxRate))
        );
        const monthlyNetAi =
          salaryAfterTaxAi + aiPlayer.passiveIncome - totalExpensesAi;
        const assetsCount = aiPlayer.assets.reduce((sum, asset) => sum + asset.count, 0);

        const stats = document.createElement("div");
        stats.className = "cashflow-ai-stats";
        stats.textContent =
          `\u73b0\u91d1 ${formatMoney(aiPlayer.cash)} \u00b7 ` +
          `\u88ab\u52a8\u6536\u5165 ${formatMoney(aiPlayer.passiveIncome)}/\u6708 \u00b7 ` +
          `\u503a\u52a1 ${formatMoney(aiPlayer.debt)} \u00b7 ` +
          `\u6708\u51c0\u73b0\u91d1\u6d41 ${monthlyNetAi >= 0 ? "+" : ""}${formatMoney(monthlyNetAi)}/\u6708 \u00b7 ` +
          `\u8d44\u4ea7 ${assetsCount} \u9879`;

        const decision = document.createElement("div");
        decision.className = "cashflow-ai-decision";
        if (aiPlayer.won) {
          decision.textContent = "\u72b6\u6001\uff1a\u5df2\u8fbe\u6210\u8d22\u52a1\u81ea\u7531";
        } else if (aiPlayer.lost) {
          decision.textContent = `\u72b6\u6001\uff1a\u5931\u8d25\uff08${aiPlayer.lossReason ?? "\u672a\u77e5\u539f\u56e0"}\uff09`;
        } else {
          decision.textContent = `\u6700\u8fd1\u51b3\u7b56\uff1a${aiPlayer.lastDecision ?? "\u6682\u65e0"}`;
        }

        card.append(head, stats, decision);
        aiList.appendChild(card);
      }
      aiBlock.appendChild(aiList);
    }

    const opportunityBlock = document.createElement("section");
    opportunityBlock.className = "cashflow-block";
    opportunityBlock.classList.add("cashflow-block-opportunity");
    const opportunityTitle = document.createElement("h4");
    opportunityTitle.className = "cashflow-block-title";
    opportunityTitle.textContent = "\u5f53\u524d\u673a\u4f1a";
    opportunityBlock.appendChild(opportunityTitle);
    if (state.currentOpportunity) {
      const opportunityCard = document.createElement("article");
      opportunityCard.className = "cashflow-opportunity-card";

      const nameNode = document.createElement("div");
      nameNode.className = "cashflow-opportunity-title";
      nameNode.textContent =
        state.currentOpportunity.dealClass === "big-deal"
          ? `[Big Deal] ${state.currentOpportunity.title}`
          : state.currentOpportunity.title;

      const descNode = document.createElement("div");
      descNode.className = "cashflow-opportunity-desc";
      descNode.textContent = state.currentOpportunity.description;

      const tags = document.createElement("div");
      tags.className = "cashflow-opportunity-tags";
      const tierText =
        state.currentOpportunity.tier === "big"
          ? "\u9ad8\u7ea7\u673a\u4f1a"
          : state.currentOpportunity.tier === "medium"
            ? "\u4e2d\u7b49\u673a\u4f1a"
            : "\u57fa\u7840\u673a\u4f1a";
      tags.append(
        createCashflowBadge(tierText, "info"),
        createCashflowBadge(
          `\u6295\u5165 ${formatMoney(state.currentOpportunity.cost)}`,
          "warning"
        ),
        createCashflowBadge(
          `+\u73b0\u91d1\u6d41 ${formatMoney(state.currentOpportunity.cashflow)}/\u6708`,
          "success"
        )
      );

      if (state.currentOpportunity.cashflow > 0) {
        const paybackMonths =
          state.currentOpportunity.cost / state.currentOpportunity.cashflow;
        tags.append(
          createCashflowBadge(`\u56de\u672c ${paybackMonths.toFixed(1)} \u6708`, "info")
        );
      }

      const quickActions = document.createElement("div");
      quickActions.className = "cashflow-opportunity-actions";

      const buyButton = document.createElement("button");
      buyButton.type = "button";
      buyButton.className = "settings-btn settings-btn-primary";
      buyButton.textContent = "\u73b0\u91d1\u4e70\u5165";
      buyButton.disabled = state.won || state.lost;
      buyButton.addEventListener("click", () => {
        void buyCashflowOpportunity();
      });

      const buyWithLoanButton = document.createElement("button");
      buyWithLoanButton.type = "button";
      buyWithLoanButton.className = "settings-btn settings-btn-secondary";
      buyWithLoanButton.textContent = "\u8d37\u6b3e\u4e70\u5165";
      buyWithLoanButton.disabled =
        state.won || state.lost || state.cash >= state.currentOpportunity.cost;
      buyWithLoanButton.addEventListener("click", () => {
        void buyCashflowOpportunityWithLoan();
      });

      const skipButton = document.createElement("button");
      skipButton.type = "button";
      skipButton.className = "settings-btn settings-btn-secondary";
      skipButton.textContent = "\u8df3\u8fc7\u673a\u4f1a";
      skipButton.disabled = state.won || state.lost;
      skipButton.addEventListener("click", () => {
        void skipCashflowOpportunity();
      });
      quickActions.append(buyButton, buyWithLoanButton, skipButton);

      opportunityCard.append(nameNode, descNode, tags, quickActions);
      opportunityBlock.appendChild(opportunityCard);

      if (state.currentOpportunity.dealClass === "big-deal") {
        const riskNode = document.createElement("div");
        riskNode.className = "cashflow-opportunity-big-deal";
        riskNode.textContent =
          "Big Deal\uff1a\u4f4e\u6982\u7387\u51fa\u73b0\uff0c\u9ad8\u5f71\u54cd\u9ad8\u98ce\u9669\uff0c\u4e70\u5165\u524d\u8bf7\u5148\u9884\u7b97\u73b0\u91d1\u7f13\u51b2\u3002";
        opportunityBlock.appendChild(riskNode);
      }

      if (state.cash < state.currentOpportunity.cost) {
        const shortfallNode = document.createElement("div");
        shortfallNode.className = "cashflow-opportunity-shortfall";
        shortfallNode.textContent = `\u8d44\u91d1\u7f3a\u53e3 ${formatMoney(
          state.currentOpportunity.cost - state.cash
        )}\uff0c\u53ef\u9009\u62e9\u8d37\u6b3e\u4e70\u5165`;
        opportunityBlock.appendChild(shortfallNode);
      }
    } else {
      const emptyNode = document.createElement("div");
      emptyNode.className = "cashflow-empty";
      emptyNode.textContent = state.lost
        ? "\u672c\u5c40\u5df2\u5931\u8d25\uff0c\u8bf7\u5148\u65b0\u5f00\u4e00\u5c40\u3002"
        : "\u6682\u65e0\u673a\u4f1a\uff0c\u53ef\u4ee5\u5148\u70b9\u201c\u63a8\u8fdb\u4e00\u56de\u5408\u201d\u5237\u65b0\u5e02\u573a\u3002";
      opportunityBlock.appendChild(emptyNode);
    }

    const assetsBlock = document.createElement("section");
    assetsBlock.className = "cashflow-block";
    assetsBlock.classList.add("cashflow-block-assets");
    const assetsTitle = document.createElement("h4");
    assetsTitle.className = "cashflow-block-title";
    assetsTitle.textContent = "\u8d44\u4ea7\u7ec4\u5408";
    assetsBlock.appendChild(assetsTitle);
    if (state.assets.length === 0) {
      const emptyNode = document.createElement("div");
      emptyNode.className = "cashflow-empty";
      emptyNode.textContent =
        "\u8fd8\u6ca1\u6709\u8d44\u4ea7\uff0c\u5148\u4ece\u201c\u5f53\u524d\u673a\u4f1a\u201d\u5f00\u59cb\u8d2d\u4e70\u3002";
      assetsBlock.appendChild(emptyNode);
    } else {
      const totalAssetCashflow = state.assets.reduce(
        (sum, asset) => sum + asset.totalCashflow,
        0
      );
      const summary = document.createElement("div");
      summary.className = "cashflow-opportunity-meta";
      summary.textContent = `\u5df2\u6301\u6709 ${state.assets.length} \u7c7b\u8d44\u4ea7 \u00b7 \u8d21\u732e\u73b0\u91d1\u6d41 +${formatMoney(
        totalAssetCashflow
      )}/\u6708`;
      assetsBlock.appendChild(summary);

      const assetList = document.createElement("ul");
      assetList.className = "cashflow-assets-list";
      for (const asset of state.assets) {
        const item = document.createElement("li");
        item.className = "cashflow-assets-item";

        const nameNode = document.createElement("span");
        nameNode.className = "cashflow-assets-name";
        nameNode.textContent = `${asset.title} x${asset.count}`;

        const costNode = document.createElement("span");
        costNode.className = "cashflow-assets-cost";
        costNode.textContent = `\u6210\u672c ${formatMoney(asset.totalCost)}`;

        const cashflowNode = document.createElement("span");
        cashflowNode.className = "cashflow-assets-cashflow";
        cashflowNode.textContent = `+\u73b0\u91d1\u6d41 ${formatMoney(asset.totalCashflow)}/\u6708`;

        item.append(nameNode, costNode, cashflowNode);
        assetList.appendChild(item);
      }
      assetsBlock.appendChild(assetList);
    }

    const reportsBlock = document.createElement("section");
    reportsBlock.className = "cashflow-block";
    reportsBlock.classList.add("cashflow-block-reports");
    const reportsTitle = document.createElement("h4");
    reportsTitle.className = "cashflow-block-title";
    reportsTitle.textContent = "\u8d22\u52a1\u62a5\u8868";
    reportsBlock.appendChild(reportsTitle);
    if (!reports) {
      const empty = document.createElement("div");
      empty.className = "cashflow-empty";
      empty.textContent = "\u62a5\u8868\u52a0\u8f7d\u4e2d...";
      reportsBlock.appendChild(empty);
    } else {
      const reportGrid = document.createElement("div");
      reportGrid.className = "cashflow-report-grid";
      reportGrid.append(
        createCashflowReportList("\u6536\u5165", reports.income),
        createCashflowReportList("\u652f\u51fa", reports.expenses)
      );

      const balance = document.createElement("div");
      balance.className = "cashflow-report-item";
      const balanceTitle = document.createElement("div");
      balanceTitle.className = "cashflow-report-item-title";
      balanceTitle.textContent = "\u8d44\u4ea7\u8d1f\u503a";
      balance.append(
        balanceTitle,
        createCashflowMetricRow("\u73b0\u91d1", formatMoney(reports.balanceSheet.cash)),
        createCashflowMetricRow("\u8d44\u4ea7", formatMoney(reports.balanceSheet.assetsTotal)),
        createCashflowMetricRow("\u8d1f\u503a", formatMoney(reports.balanceSheet.debtsTotal)),
        createCashflowMetricRow("\u51c0\u8d44\u4ea7", formatMoney(reports.balanceSheet.netWorth))
      );

      const metrics = document.createElement("div");
      metrics.className = "cashflow-report-item";
      const metricsTitle = document.createElement("div");
      metricsTitle.className = "cashflow-report-item-title";
      metricsTitle.textContent = "\u5173\u952e\u6307\u6807";
      metrics.append(
        metricsTitle,
        createCashflowMetricRow(
          "\u6708\u51c0\u73b0\u91d1\u6d41",
          `${reports.metrics.monthlyNet >= 0 ? "+" : ""}${formatMoney(
            reports.metrics.monthlyNet
          )}/\u6708`
        ),
        createCashflowMetricRow(
          "\u88ab\u52a8\u6536\u5165\u8986\u76d6\u7387",
          formatPercent(reports.metrics.passiveIncomeRatio)
        ),
        createCashflowMetricRow("\u8d1f\u503a\u7387", formatPercent(reports.metrics.debtRatio)),
        createCashflowMetricRow(
          "\u73b0\u91d1\u50a8\u5907\u6708\u6570",
          `${reports.metrics.cashReserveMonths.toFixed(1)} \u4e2a\u6708`
        )
      );
      reportGrid.append(balance, metrics);
      reportsBlock.appendChild(reportGrid);
    }

    const logsBlock = document.createElement("section");
    logsBlock.className = "cashflow-block";
    logsBlock.classList.add("cashflow-block-logs");
    const logsTitle = document.createElement("h4");
    logsTitle.className = "cashflow-block-title";
    logsTitle.textContent = "\u56de\u5408\u8bb0\u5f55";
    logsBlock.appendChild(logsTitle);
    const logList = document.createElement("ul");
    logList.className = "cashflow-log-list";
    for (const [index, entry] of state.logs.entries()) {
      const item = document.createElement("li");
      item.className = "cashflow-log-item";
      const logIndex = document.createElement("span");
      logIndex.className = "cashflow-log-index";
      logIndex.textContent = `#${state.logs.length - index}`;
      const logText = document.createElement("span");
      logText.className = "cashflow-log-text";
      logText.textContent = entry;
      item.append(logIndex, logText);
      logList.appendChild(item);
    }
    if (state.logs.length === 0) {
      const emptyLog = document.createElement("li");
      emptyLog.className = "cashflow-empty";
      emptyLog.textContent = "\u6682\u65e0\u56de\u5408\u8bb0\u5f55";
      logList.appendChild(emptyLog);
    }
    logsBlock.appendChild(logList);

    const board = document.createElement("div");
    board.className = "cashflow-board";
    const mainColumn = document.createElement("div");
    mainColumn.className = "cashflow-column cashflow-column-main";
    mainColumn.append(opportunityBlock, roleBlock, assetsBlock);

    const sideColumn = document.createElement("div");
    sideColumn.className = "cashflow-column cashflow-column-side";
    sideColumn.append(aiBlock, reportsBlock);

    board.append(mainColumn, sideColumn, logsBlock);

    const actions = document.createElement("div");
    actions.className = "settings-actions cashflow-actions";

    const nextTurnButton = document.createElement("button");
    nextTurnButton.type = "button";
    nextTurnButton.className = "settings-btn settings-btn-primary cashflow-action-main";
    nextTurnButton.textContent = "\u63a8\u8fdb\u4e00\u56de\u5408";
    nextTurnButton.addEventListener("click", () => {
      void nextCashflowTurn();
    });

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "settings-btn settings-btn-secondary";
    resetButton.textContent = "\u65b0\u5f00\u4e00\u5c40";
    resetButton.addEventListener("click", () => {
      void resetCashflowGame();
    });

    const aiButton = document.createElement("button");
    aiButton.type = "button";
    aiButton.className = "settings-btn settings-btn-secondary";
    aiButton.textContent = state.aiEnabled ? "AI \u5df2\u5f00\u542f" : "\u5f00\u542f AI \u5bf9\u6218";
    aiButton.disabled = state.aiEnabled;
    aiButton.addEventListener("click", () => {
      void executeCashflowAction("ai").then((result) => {
        if (result) {
          renderList();
        }
      });
    });

    nextTurnButton.disabled = state.won || state.lost;
    actions.append(nextTurnButton, aiButton, resetButton);

    panel.append(title, description, hud, statGrid, board, actions);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);
  }

  export async function refreshStandaloneCashflowPanel(): Promise<boolean> {
    const result = await executeCashflowAction("state");
    return Boolean(result || cashflowState);
  }

  export async function openStandaloneCashflowPanel(
    reset = false,
    options?: { reviewMode?: boolean }
  ): Promise<void> {
    cashflowReviewMode = options?.reviewMode === true;
    setMode("cashflow");
    if (reset) {
      await executeCashflowAction("reset");
    } else {
      await executeCashflowAction("state");
      if (cashflowState?.lost) {
        const roleKey = cashflowState.jobKey.trim() || undefined;
        const roleName = cashflowState.role;
        const restarted = await executeCashflowAction("reset", { roleKey });
        if (restarted) {
          setStatus(
            `\u68c0\u6d4b\u5230\u4e0a\u5c40\u5df2\u7ed3\u675f\uff0c\u5df2\u81ea\u52a8\u65b0\u5f00\u4e00\u5c40${roleKey ? `\uff08${roleName}\uff09` : ""}`
          );
        }
      }
    }
    renderList();
  }

  export type CodeAgentSwitchDiagnosticView = {
    id: string;
    level: "error" | "warning" | "info";
    message: string;
    suggestion: string;
  };

  export type CodeAgentSwitchProviderView = {
    id: string;
    name?: string;
    baseUrl?: string;
    wireApi?: string;
    envKey?: string;
    envKeyInstructions?: string;
    requiresOpenAiAuth?: boolean;
    requestMaxRetries?: number;
    streamMaxRetries?: number;
    streamIdleTimeoutMs?: number;
    supportsWebsockets?: boolean;
    httpHeaders?: Record<string, string>;
    envHttpHeaders?: Record<string, string>;
    queryParams?: Record<string, string>;
  };

  export type CodeAgentSwitchProfileView = {
    id: string;
    name?: string;
    providerId?: string;
    model?: string;
    reviewModel?: string;
    modelReasoningEffort?: string;
    planModeReasoningEffort?: string;
    modelReasoningSummary?: string;
    modelVerbosity?: string;
    serviceTier?: string;
    webSearch?: string;
    modelAutoCompactTokenLimit?: number;
  };

  export type CodeAgentSwitchBackupView = {
    id: string;
    fileName?: string;
    path?: string;
    sizeBytes?: number;
    createdAtMs?: number;
  };

  export type CodeAgentSwitchToolView = {
    id: string;
    label: string;
    status: "ready" | "planned";
    description: string;
  };

  export type CodeAgentSwitchProfileMatchView = {
    profileId: string;
    level: "exact" | "partial" | "none";
    matchedFields?: string[];
    mismatchedFields?: string[];
  };

  export let codeAgentSwitchData: {
    tool?: string;
    tools?: CodeAgentSwitchToolView[];
    exists?: boolean;
    configPath?: string;
    configSource?: string;
    rootSource?: string;
    config?: {
      profile?: string;
      modelProvider?: string;
      model?: string;
      reviewModel?: string;
      openaiBaseUrl?: string;
      modelReasoningEffort?: string;
      planModeReasoningEffort?: string;
      modelReasoningSummary?: string;
      modelVerbosity?: string;
      modelSupportsReasoningSummaries?: boolean;
      serviceTier?: string;
      webSearch?: string;
      modelContextWindow?: number;
      modelAutoCompactTokenLimit?: number;
      approvalPolicy?: string;
      approvalsReviewer?: string;
      allowLoginShell?: boolean;
      sandboxMode?: string;
      defaultPermissions?: string;
      disableResponseStorage?: boolean;
      networkAccess?: string;
      personality?: string;
      projectDocMaxBytes?: number;
      toolOutputTokenLimit?: number;
      windowsWslSetupAcknowledged?: boolean;
      history?: {
        persistence?: string;
        maxBytes?: number;
      };
      windows?: {
        sandbox?: string;
        sandboxPrivateDesktop?: boolean;
      };
      providers?: CodeAgentSwitchProviderView[];
      profiles?: CodeAgentSwitchProfileView[];
    };
    active?: {
      activeProviderId?: string;
      activeProvider?: CodeAgentSwitchProviderView;
      activeProfileId?: string;
      activeProfile?: CodeAgentSwitchProfileView;
      activeSource?: {
        kind?: "root" | "embedded" | "standalone" | "snapshot";
        profileId?: string;
        label?: string;
        detail?: string;
        legacy?: boolean;
      };
      activeProfileMatch?: "exact" | "partial" | "none";
      matchedFields?: string[];
      profileMatches?: CodeAgentSwitchProfileMatchView[];
    };
    diagnostics?: CodeAgentSwitchDiagnosticView[];
    envCommands?: Record<string, string>;
    backups?: CodeAgentSwitchBackupView[];
    preview: {
      profileId?: string;
      providerId?: string;
      changedFields?: string[];
      diffLines?: string[];
    };
    rootChangedFields?: string[];
    applied?: boolean;
    restored?: boolean;
    savedProvider?: boolean;
    deletedProvider?: boolean;
    setProviderKey?: boolean;
    keyAppliedEnvKey?: string;
    savedProfile?: boolean;
    savedRuntime?: boolean;
    deletedProfile?: boolean;
    backupPath?: string;
    restoredBackupPath?: string;
    error?: string;
  } = { preview: {} };

  export function renderCashflowPanel(): void {
      renderStandaloneCashflowPanelView();
    }

  export async function refreshCashflowPanel(): Promise<boolean> {
      return refreshStandaloneCashflowPanel();
    }

  export function handleCashflowPanelEnter(): void {
      void nextCashflowTurn();
    }

}
