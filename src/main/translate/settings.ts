import {
  createDefaultTranslateSettings,
  type TranslateSettings
} from "../../shared/translate";
import { LiteDatabase } from "../database";

const TRANSLATE_TOOL_SETTINGS_KEY = "translateToolSettings";
const LITESNAP_SETTINGS_KEY = "litesnapSettings";

type LegacyLiteSnapSettings = {
  translateBaiduAppId?: string;
  translateBaiduSecret?: string;
  translateBaiduEngine?: string;
  translateBaiduApiKey?: string;
};

function normalizeTranslateSettings(
  value: Partial<TranslateSettings> | null | undefined,
  base: TranslateSettings = createDefaultTranslateSettings()
): TranslateSettings {
  return {
    baiduAppId:
      typeof value?.baiduAppId === "string"
        ? value.baiduAppId.trim()
        : base.baiduAppId,
    baiduSecret:
      typeof value?.baiduSecret === "string"
        ? value.baiduSecret.trim()
        : base.baiduSecret,
    baiduEngine:
      value?.baiduEngine === "llm" || value?.baiduEngine === "standard"
        ? value.baiduEngine
        : base.baiduEngine,
    baiduApiKey:
      typeof value?.baiduApiKey === "string"
        ? value.baiduApiKey.trim()
        : base.baiduApiKey
  };
}

function migrateFromLegacyLiteSnapSettings(
  legacy: LegacyLiteSnapSettings
): Partial<TranslateSettings> | null {
  const appId =
    typeof legacy.translateBaiduAppId === "string"
      ? legacy.translateBaiduAppId.trim()
      : "";
  const secret =
    typeof legacy.translateBaiduSecret === "string"
      ? legacy.translateBaiduSecret.trim()
      : "";
  const apiKey =
    typeof legacy.translateBaiduApiKey === "string"
      ? legacy.translateBaiduApiKey.trim()
      : "";
  const engine =
    legacy.translateBaiduEngine === "llm" || legacy.translateBaiduEngine === "standard"
      ? legacy.translateBaiduEngine
      : undefined;

  if (!appId && !secret && !apiKey && !engine) {
    return null;
  }

  return {
    baiduAppId: appId,
    baiduSecret: secret,
    baiduApiKey: apiKey,
    baiduEngine: engine
  };
}

export class TranslateSettingsStore {
  private cachedSettings: TranslateSettings | null = null;

  public constructor(private readonly db: LiteDatabase) {}

  public async getSettings(): Promise<TranslateSettings> {
    if (this.cachedSettings) {
      return { ...this.cachedSettings };
    }

    const fallback = createDefaultTranslateSettings();
    const raw = await this.db.getSetting(TRANSLATE_TOOL_SETTINGS_KEY);
    if (!raw) {
      const migrated = await this.readLegacyMigrationSeed();
      const initial = normalizeTranslateSettings(migrated ?? {}, fallback);
      await this.db.setSetting(TRANSLATE_TOOL_SETTINGS_KEY, JSON.stringify(initial));
      this.cachedSettings = initial;
      return { ...initial };
    }

    try {
      const parsed = JSON.parse(raw) as Partial<TranslateSettings>;
      const normalized = normalizeTranslateSettings(parsed, fallback);
      if (JSON.stringify(normalized) !== raw) {
        await this.db.setSetting(
          TRANSLATE_TOOL_SETTINGS_KEY,
          JSON.stringify(normalized)
        );
      }
      this.cachedSettings = normalized;
      return { ...normalized };
    } catch {
      await this.db.setSetting(
        TRANSLATE_TOOL_SETTINGS_KEY,
        JSON.stringify(fallback)
      );
      this.cachedSettings = fallback;
      return { ...fallback };
    }
  }

  public async updateSettings(
    patch: Partial<TranslateSettings>
  ): Promise<TranslateSettings> {
    const current = await this.getSettings();
    const next = normalizeTranslateSettings(patch, current);
    await this.db.setSetting(TRANSLATE_TOOL_SETTINGS_KEY, JSON.stringify(next));
    this.cachedSettings = next;
    return { ...next };
  }

  private async readLegacyMigrationSeed(): Promise<Partial<TranslateSettings> | null> {
    const raw = await this.db.getSetting(LITESNAP_SETTINGS_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as LegacyLiteSnapSettings;
      return migrateFromLegacyLiteSnapSettings(parsed);
    } catch {
      return null;
    }
  }
}
