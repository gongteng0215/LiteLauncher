export interface CronTemplateItem {
  key: string;
  summary: string;
  expression: string;
}

export const CRON_DEFAULT_TEMPLATES: readonly CronTemplateItem[] = [
  { key: "weekday-9am", summary: "工作日 09:00 执行", expression: "0 9 * * 1-5" },
  { key: "daily-noon", summary: "每天 12:00 执行", expression: "0 12 * * *" },
  { key: "daily-midnight", summary: "每天 00:00 执行", expression: "0 0 * * *" },
  { key: "hourly-top", summary: "每小时整点执行", expression: "0 * * * *" },
  { key: "every-minute", summary: "每分钟执行", expression: "* * * * *" }
];

export const CRON_TEMPLATE_MAX = 30;
export const CRON_USER_TEMPLATE_KEY_PREFIX = "user-";
