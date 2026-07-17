import {
  createDefaultSelectionTranslateSettings,
  type SelectionTranslateSettings
} from "../../shared/selection-translate";
import { LiteDatabase } from "../database";

const SELECTION_TRANSLATE_SETTINGS_KEY = "selectionTranslateSettings";

function normalizeSelectionTranslateSettings(
  value: Partial<SelectionTranslateSettings> | null | undefined,
  base: SelectionTranslateSettings = createDefaultSelectionTranslateSettings()
): SelectionTranslateSettings {
  return {
    enabled: typeof value?.enabled === "boolean" ? value.enabled : base.enabled,
    hotkey: (() => {
      const raw =
        typeof value?.hotkey === "string" && value.hotkey.trim()
          ? value.hotkey.trim()
          : base.hotkey;
      // F2 is Windows Explorer rename; migrate the old default to F4.
      return raw === "F2" ? "F4" : raw;
    })(),
    restoreClipboard:
      typeof value?.restoreClipboard === "boolean"
        ? value.restoreClipboard
        : base.restoreClipboard,
    dismissOnOutsideClick:
      typeof value?.dismissOnOutsideClick === "boolean"
        ? value.dismissOnOutsideClick
        : base.dismissOnOutsideClick
  };
}

export class SelectionTranslateSettingsStore {
  private cachedSettings: SelectionTranslateSettings | null = null;

  public constructor(private readonly db: LiteDatabase) {}

  public async getSettings(): Promise<SelectionTranslateSettings> {
    if (this.cachedSettings) {
      return { ...this.cachedSettings };
    }

    const fallback = createDefaultSelectionTranslateSettings();
    const raw = await this.db.getSetting(SELECTION_TRANSLATE_SETTINGS_KEY);
    if (!raw) {
      await this.db.setSetting(
        SELECTION_TRANSLATE_SETTINGS_KEY,
        JSON.stringify(fallback)
      );
      this.cachedSettings = fallback;
      return { ...fallback };
    }

    try {
      const parsed = JSON.parse(raw) as Partial<SelectionTranslateSettings>;
      const normalized = normalizeSelectionTranslateSettings(parsed, fallback);
      if (JSON.stringify(normalized) !== raw) {
        await this.db.setSetting(
          SELECTION_TRANSLATE_SETTINGS_KEY,
          JSON.stringify(normalized)
        );
      }
      this.cachedSettings = normalized;
      return { ...normalized };
    } catch {
      await this.db.setSetting(
        SELECTION_TRANSLATE_SETTINGS_KEY,
        JSON.stringify(fallback)
      );
      this.cachedSettings = fallback;
      return { ...fallback };
    }
  }

  public async updateSettings(
    patch: Partial<SelectionTranslateSettings>
  ): Promise<SelectionTranslateSettings> {
    const current = await this.getSettings();
    const next = normalizeSelectionTranslateSettings(patch, current);
    await this.db.setSetting(
      SELECTION_TRANSLATE_SETTINGS_KEY,
      JSON.stringify(next)
    );
    this.cachedSettings = next;
    return { ...next };
  }
}
