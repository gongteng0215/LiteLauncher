import {
  CRON_DEFAULT_TEMPLATES,
  CRON_TEMPLATE_MAX,
  CRON_USER_TEMPLATE_KEY_PREFIX,
  CronTemplateItem
} from "../../../shared/webtools-cron";
import { LiteDatabase } from "../../database";

const WEBTOOLS_CRON_TEMPLATES_KEY = "webtoolsCronTemplates";
const SUMMARY_MAX_LENGTH = 40;

let storeInstance: WebtoolsCronTemplateStore | null = null;

function cloneDefaultTemplates(): CronTemplateItem[] {
  return CRON_DEFAULT_TEMPLATES.map((item) => ({ ...item }));
}

function normalizeTemplateItem(value: unknown): CronTemplateItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const key = typeof record.key === "string" ? record.key.trim() : "";
  const summary = typeof record.summary === "string" ? record.summary.trim() : "";
  const expression =
    typeof record.expression === "string" ? record.expression.trim() : "";

  if (!key || !summary || !expression) {
    return null;
  }

  return {
    key,
    summary: summary.slice(0, SUMMARY_MAX_LENGTH),
    expression
  };
}

function normalizeTemplates(value: unknown): CronTemplateItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const items: CronTemplateItem[] = [];
  for (const entry of value) {
    const normalized = normalizeTemplateItem(entry);
    if (!normalized || seen.has(normalized.key)) {
      continue;
    }
    seen.add(normalized.key);
    items.push(normalized);
    if (items.length >= CRON_TEMPLATE_MAX) {
      break;
    }
  }

  return items;
}

export class WebtoolsCronTemplateStore {
  private cachedTemplates: CronTemplateItem[] | null = null;

  public constructor(private readonly db: LiteDatabase) {}

  public async getTemplates(): Promise<CronTemplateItem[]> {
    if (this.cachedTemplates) {
      return this.cachedTemplates.map((item) => ({ ...item }));
    }

    const raw = await this.db.getSetting(WEBTOOLS_CRON_TEMPLATES_KEY);
    if (!raw) {
      const seeded = cloneDefaultTemplates();
      await this.persistTemplates(seeded);
      return seeded.map((item) => ({ ...item }));
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      const normalized = normalizeTemplates(parsed);
      if (normalized.length === 0) {
        const seeded = cloneDefaultTemplates();
        await this.persistTemplates(seeded);
        return seeded.map((item) => ({ ...item }));
      }

      if (JSON.stringify(normalized) !== raw) {
        await this.persistTemplates(normalized);
      } else {
        this.cachedTemplates = normalized;
      }
      return normalized.map((item) => ({ ...item }));
    } catch {
      const seeded = cloneDefaultTemplates();
      await this.persistTemplates(seeded);
      return seeded.map((item) => ({ ...item }));
    }
  }

  public async saveTemplate(input: {
    summary: string;
    expression: string;
  }): Promise<CronTemplateItem[]> {
    const summary = input.summary.trim().slice(0, SUMMARY_MAX_LENGTH);
    const expression = input.expression.trim();
    if (!summary) {
      throw new Error("模板名称不能为空");
    }
    if (!expression) {
      throw new Error("Cron 表达式不能为空");
    }

    const templates = await this.getTemplates();
    const duplicate = templates.find(
      (item) => item.summary === summary && item.expression === expression
    );
    if (duplicate) {
      return templates.map((item) => ({ ...item }));
    }

    if (templates.length >= CRON_TEMPLATE_MAX) {
      throw new Error(`最多保存 ${CRON_TEMPLATE_MAX} 个模板`);
    }

    const next: CronTemplateItem[] = [
      ...templates,
      {
        key: `${CRON_USER_TEMPLATE_KEY_PREFIX}${Date.now()}`,
        summary,
        expression
      }
    ];
    await this.persistTemplates(next);
    return next.map((item) => ({ ...item }));
  }

  public async updateTemplate(input: {
    key: string;
    summary: string;
    expression: string;
  }): Promise<CronTemplateItem[]> {
    const key = input.key.trim();
    const summary = input.summary.trim().slice(0, SUMMARY_MAX_LENGTH);
    const expression = input.expression.trim();
    if (!key) {
      throw new Error("模板标识无效");
    }
    if (!summary) {
      throw new Error("模板名称不能为空");
    }
    if (!expression) {
      throw new Error("Cron 表达式不能为空");
    }

    const templates = await this.getTemplates();
    const index = templates.findIndex((item) => item.key === key);
    if (index < 0) {
      throw new Error("模板不存在");
    }

    const next = templates.map((item, itemIndex) =>
      itemIndex === index ? { key, summary, expression } : { ...item }
    );
    await this.persistTemplates(next);
    return next.map((item) => ({ ...item }));
  }

  public async deleteTemplate(key: string): Promise<CronTemplateItem[]> {
    const normalizedKey = key.trim();
    if (!normalizedKey) {
      throw new Error("模板标识无效");
    }

    const templates = await this.getTemplates();
    const next = templates.filter((item) => item.key !== normalizedKey);
    if (next.length === templates.length) {
      throw new Error("模板不存在");
    }

    await this.persistTemplates(next);
    return next.map((item) => ({ ...item }));
  }

  public async resetTemplates(): Promise<CronTemplateItem[]> {
    const next = cloneDefaultTemplates();
    await this.persistTemplates(next);
    return next.map((item) => ({ ...item }));
  }

  private async persistTemplates(templates: CronTemplateItem[]): Promise<void> {
    const normalized = normalizeTemplates(templates);
    await this.db.setSetting(WEBTOOLS_CRON_TEMPLATES_KEY, JSON.stringify(normalized));
    this.cachedTemplates = normalized;
  }
}

export function initWebtoolsCronStore(db: LiteDatabase): void {
  storeInstance = new WebtoolsCronTemplateStore(db);
}

export function getWebtoolsCronStore(): WebtoolsCronTemplateStore {
  if (!storeInstance) {
    throw new Error("Webtools Cron store was not initialized");
  }
  return storeInstance;
}

export function isWebtoolsCronStoreReady(): boolean {
  return storeInstance !== null;
}

export const __webtoolsCronStoreTestUtils = {
  normalizeTemplates,
  WEBTOOLS_CRON_TEMPLATES_KEY
};
