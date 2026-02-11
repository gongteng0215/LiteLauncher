import {
  CashflowAiProfile,
  CashflowBigDealTemplate,
  CashflowEventTemplate,
  CashflowJobPreset,
  CashflowOpportunityTemplate,
  CashflowRuleConfig
} from "./types";

export const CASHFLOW_RULES: CashflowRuleConfig = {
  logLimit: 16,
  eventRate: 0.45,
  bigDealSpawnRateRatRace: 0.06,
  bigDealSpawnRateFreedom: 0.18
};

export const CASHFLOW_JOBS: CashflowJobPreset[] = [
  {
    key: "programmer",
    role: "\u7a0b\u5e8f\u5458",
    salary: 12000,
    expenses: 6800,
    initialCash: 16000,
    taxRate: 0.18,
    initialDebt: 18000,
    debtPayment: 900,
    opportunityWeights: {
      small: 0.5,
      medium: 0.35,
      big: 0.15
    }
  },
  {
    key: "product-manager",
    role: "\u4ea7\u54c1\u7ecf\u7406",
    salary: 14000,
    expenses: 8300,
    initialCash: 18000,
    taxRate: 0.2,
    initialDebt: 26000,
    debtPayment: 1200,
    opportunityWeights: {
      small: 0.35,
      medium: 0.45,
      big: 0.2
    }
  },
  {
    key: "designer",
    role: "\u8bbe\u8ba1\u5e08",
    salary: 10500,
    expenses: 6200,
    initialCash: 15000,
    taxRate: 0.14,
    initialDebt: 12000,
    debtPayment: 700,
    opportunityWeights: {
      small: 0.55,
      medium: 0.35,
      big: 0.1
    }
  },
  {
    key: "operator",
    role: "\u8fd0\u8425\u4e13\u5458",
    salary: 9800,
    expenses: 5600,
    initialCash: 14000,
    taxRate: 0.12,
    initialDebt: 8000,
    debtPayment: 500,
    opportunityWeights: {
      small: 0.62,
      medium: 0.28,
      big: 0.1
    }
  },
  {
    key: "doctor",
    role: "\u533b\u751f",
    salary: 28000,
    expenses: 14500,
    initialCash: 26000,
    taxRate: 0.3,
    initialDebt: 180000,
    debtPayment: 3200,
    opportunityWeights: {
      small: 0.25,
      medium: 0.45,
      big: 0.3
    }
  },
  {
    key: "cleaner",
    role: "\u6e05\u6d01\u5de5",
    salary: 6800,
    expenses: 4200,
    initialCash: 8500,
    taxRate: 0.06,
    initialDebt: 3000,
    debtPayment: 200,
    opportunityWeights: {
      small: 0.72,
      medium: 0.22,
      big: 0.06
    }
  }
];


export const CASHFLOW_AI_PROFILES: CashflowAiProfile[] = [
  {
    key: "steady-financier",
    name: "AI 阿稳",
    description: "稳健型：重视现金安全垫，偏好中小机会，谨慎使用贷款。",
    preferredJobKeys: ["programmer", "operator", "designer"],
    riskTolerance: 0.42,
    loanTolerance: 0.36,
    minCashReserveMonths: 2.2,
    roiWeight: 1.15
  }
];
export const CASHFLOW_OPPORTUNITIES: CashflowOpportunityTemplate[] = [
  {
    key: "snack_shop",
    tier: "small",
    title: "\u793e\u533a\u96f6\u98df\u5e97\u80a1\u4efd",
    description:
      "\u4e00\u7b14\u5c0f\u989d\u6295\u8d44\uff0c\u6bcf\u6708\u7a33\u5b9a\u5206\u7ea2",
    cost: 6000,
    cashflow: 520
  },
  {
    key: "mini_course",
    tier: "small",
    title: "\u5fae\u8bfe\u7a0b\u8054\u8425",
    description:
      "\u548c\u8bb2\u5e08\u5408\u4f5c\u5356\u8bfe\u7a0b\uff0c\u6536\u5165\u6ce2\u52a8\u4e2d\u7b49",
    cost: 9000,
    cashflow: 840
  },
  {
    key: "ebook_bundle",
    tier: "small",
    title: "\u7535\u5b50\u4e66\u5957\u88c5\u7248\u6743",
    description:
      "\u7248\u6743\u4e70\u65ad\u540e\u901a\u8fc7\u5e73\u53f0\u5206\u9500\uff0c\u73b0\u91d1\u6d41\u4f4e\u4f46\u7a33\u5b9a",
    cost: 3600,
    cashflow: 280
  },
  {
    key: "parking_space",
    tier: "medium",
    title: "\u505c\u8f66\u4f4d\u51fa\u79df",
    description:
      "\u4e00\u6b21\u6027\u8d2d\u5165\u540e\u51fa\u79df\uff0c\u73b0\u91d1\u6d41\u6e29\u548c",
    cost: 12000,
    cashflow: 980
  },
  {
    key: "saas_tool",
    tier: "medium",
    title: "SaaS \u5de5\u5177\u8ba2\u9605\u6743\u76ca",
    description:
      "\u8d2d\u4e70\u5c0f\u578b\u8f6f\u4ef6\u8ba2\u9605\u6743\u76ca\uff0c\u540e\u7eed\u5206\u6210",
    cost: 15000,
    cashflow: 1350
  },
  {
    key: "vending_machine",
    tier: "medium",
    title: "\u81ea\u52a9\u552e\u5356\u673a",
    description:
      "\u6446\u653e\u5728\u5199\u5b57\u697c\uff0c\u6bcf\u6708\u8fd0\u8425\u5206\u6210",
    cost: 20000,
    cashflow: 1800
  },
  {
    key: "warehouse_sublease",
    tier: "big",
    title: "\u5c0f\u578b\u4ed3\u50a8\u8f6c\u79df",
    description:
      "\u7b7e\u7ea6\u4ed3\u50a8\u4f4d\u7f6e\u8f6c\u79df\uff0c\u73b0\u91d1\u6d41\u66f4\u9ad8",
    cost: 28000,
    cashflow: 2650
  },
  {
    key: "car_wash_chain",
    tier: "big",
    title: "\u793e\u533a\u6d17\u8f66\u8fde\u9501\u6295\u8d44",
    description:
      "\u4e00\u6b21\u6027\u6295\u8d44\u5e97\u9762\u6269\u5f20\uff0c\u56de\u62a5\u9ad8\u4f46\u5360\u7528\u73b0\u91d1",
    cost: 42000,
    cashflow: 4300
  },
  {
    key: "suburb_apartment",
    tier: "big",
    title: "\u90ca\u533a\u516c\u5bd3\u6536\u79df\u7ec4\u5408",
    description:
      "\u8d2d\u5165\u90ca\u533a\u5c0f\u578b\u516c\u5bd3\uff0c\u9700\u8981\u66f4\u9ad8\u9996\u4ed8",
    cost: 68000,
    cashflow: 6900
  }
];

export const CASHFLOW_BIG_DEALS: CashflowBigDealTemplate[] = [
  {
    key: "district_food_court",
    tier: "big",
    title: "Big Deal: \u5546\u5708\u7f8e\u98df\u5e7f\u573a\u8054\u8425",
    description: "\u9ad8\u6295\u5165\u9ad8\u56de\u62a5\uff0c\u53d7\u5ba2\u6d41\u6ce2\u52a8\u5f71\u54cd\u660e\u663e",
    cost: 88000,
    cashflow: 7600,
    settlement: {
      upsideRate: 0.32,
      upsideCashDelta: 18000,
      upsidePassiveIncomeDelta: 1600,
      downsideRate: 0.38,
      downsideCashDelta: -15000,
      downsideDebtDelta: 20000,
      downsideExpensesDelta: 900
    }
  },
  {
    key: "community_gym_chain",
    tier: "big",
    title: "Big Deal: \u793e\u533a\u5065\u8eab\u623f\u8fde\u9501\u4efd\u989d",
    description: "\u6269\u5f20\u901f\u5ea6\u5feb\uff0c\u7ba1\u7406\u4e0e\u8425\u9500\u6210\u672c\u540c\u6837\u66f4\u9ad8",
    cost: 98000,
    cashflow: 8200,
    settlement: {
      upsideRate: 0.28,
      upsideCashDelta: 22000,
      upsidePassiveIncomeDelta: 2100,
      downsideRate: 0.42,
      downsideCashDelta: -18000,
      downsideDebtDelta: 26000,
      downsideExpensesDelta: 1200
    }
  },
  {
    key: "suburb_logistics_hub",
    tier: "big",
    title: "Big Deal: \u90ca\u533a\u7269\u6d41\u4e2d\u8f6c\u4ed3",
    description: "\u73b0\u91d1\u6d41\u53ef\u89c2\uff0c\u4f46\u8bbe\u5907\u548c\u7a7a\u7f6e\u98ce\u9669\u66f4\u5927",
    cost: 126000,
    cashflow: 10800,
    settlement: {
      upsideRate: 0.26,
      upsideCashDelta: 30000,
      upsidePassiveIncomeDelta: 2600,
      downsideRate: 0.44,
      downsideCashDelta: -24000,
      downsideDebtDelta: 36000,
      downsideExpensesDelta: 1500
    }
  }
];

export const CASHFLOW_EVENTS: CashflowEventTemplate[] = [
  {
    key: "bonus",
    category: "income",
    title: "\u4e1a\u7ee9\u5956\u91d1\u53d1\u653e",
    weight: 1.2,
    cashDelta: 2600,
    expensesDelta: 0
  },
  {
    key: "freelance",
    category: "income",
    title: "\u63a5\u5230\u4e34\u65f6\u5916\u5305",
    weight: 1.4,
    cashDelta: 1800,
    expensesDelta: 0
  },
  {
    key: "medical-cost",
    category: "expense",
    title: "\u5bb6\u5ead\u533b\u7597\u652f\u51fa",
    weight: 1.3,
    cashDelta: -1800,
    expensesDelta: 0
  },
  {
    key: "rent-up",
    category: "expense",
    title: "\u623f\u79df\u4e0a\u8c03",
    weight: 1.1,
    cashDelta: 0,
    expensesDelta: 320
  },
  {
    key: "small-dividend",
    category: "investment",
    title: "\u6295\u8d44\u7ec4\u5408\u8ffd\u52a0\u5206\u7ea2",
    weight: 0.9,
    cashDelta: 0,
    expensesDelta: 0,
    passiveIncomeDelta: 180
  },
  {
    key: "credit-refinance",
    category: "investment",
    title: "\u503a\u52a1\u91cd\u7ec4\u6210\u529f",
    weight: 0.6,
    cashDelta: 0,
    expensesDelta: 0,
    debtDelta: -3000
  },
  {
    key: "impulse-shopping",
    category: "consumption",
    title: "\u51b2\u52a8\u6d88\u8d39",
    weight: 1.0,
    cashDelta: -900,
    expensesDelta: 180
  },
  {
    key: "car-maintenance",
    category: "consumption",
    title: "\u8f66\u8f86\u7ef4\u4fee",
    weight: 0.9,
    cashDelta: -1200,
    expensesDelta: 0
  },
  {
    key: "course-upgrade",
    category: "investment",
    title: "\u4f18\u5316\u8d44\u4ea7\u8fd0\u8425\u8bfe",
    weight: 0.7,
    cashDelta: -700,
    expensesDelta: 0,
    passiveIncomeDelta: 120
  },
  {
    key: "credit-overdraft",
    category: "expense",
    title: "\u4fe1\u7528\u989d\u5ea6\u5468\u8f6c",
    weight: 0.5,
    cashDelta: 1000,
    expensesDelta: 0,
    debtDelta: 2500
  }
];

