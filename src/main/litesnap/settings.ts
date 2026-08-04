import {
  createDefaultLiteSnapSettings,
  LiteSnapAnnotationTool,
  LiteSnapSettings,
  normalizeLiteSnapRecentColors,
  LITESNAP_HISTORY_MAX_ITEMS_MAX,
  LITESNAP_HISTORY_MAX_ITEMS_MIN
} from "../../shared/litesnap";
import { LiteDatabase } from "../database";

const LITESNAP_SETTINGS_KEY = "litesnapSettings";
const LITESNAP_ANNOTATION_TOOLS = new Set<LiteSnapAnnotationTool>([
  "select",
  "rect",
  "ellipse",
  "line",
  "arrow",
  "pen",
  "text",
  "number",
  "mosaic",
  "blur",
  "highlight"
]);

function clampNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function normalizeShortcut(
  value: unknown,
  fallback: string,
  options?: { allowEmpty?: boolean }
): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return options?.allowEmpty ? "" : fallback;
  }
  return trimmed;
}

export function normalizeLiteSnapSettings(
  value: Partial<LiteSnapSettings> | null | undefined,
  base: LiteSnapSettings = createDefaultLiteSnapSettings()
): LiteSnapSettings {
  return {
    screenshotShortcut: normalizeShortcut(
      value?.screenshotShortcut,
      base.screenshotShortcut
    ),
    pinShortcut: normalizeShortcut(value?.pinShortcut, base.pinShortcut),
    // Color picker is button-only; never register a global hotkey.
    colorShortcut: "",
    togglePinClickThroughShortcut: normalizeShortcut(
      value?.togglePinClickThroughShortcut,
      base.togglePinClickThroughShortcut,
      { allowEmpty: true }
    ),
    saveDirectory:
      typeof value?.saveDirectory === "string" ? value.saveDirectory.trim() : base.saveDirectory,
    saveFormat: value?.saveFormat === "jpg" ? "jpg" : base.saveFormat,
    postCaptureBehavior:
      value?.postCaptureBehavior === "copy" ||
      value?.postCaptureBehavior === "save" ||
      value?.postCaptureBehavior === "pin" ||
      value?.postCaptureBehavior === "toolbar"
        ? value.postCaptureBehavior
        : base.postCaptureBehavior,
    annotationColor:
      typeof value?.annotationColor === "string" && value.annotationColor.trim()
        ? value.annotationColor.trim()
        : base.annotationColor,
    annotationLineWidth: clampNumber(
      value?.annotationLineWidth,
      base.annotationLineWidth,
      1,
      60
    ),
    annotationTextSize: clampNumber(
      value?.annotationTextSize,
      base.annotationTextSize,
      8,
      72
    ),
    annotationTool:
      typeof value?.annotationTool === "string" &&
      LITESNAP_ANNOTATION_TOOLS.has(value.annotationTool)
        ? value.annotationTool
        : base.annotationTool,
    annotationFillShapes:
      typeof value?.annotationFillShapes === "boolean"
        ? value.annotationFillShapes
        : base.annotationFillShapes,
    recentColors: normalizeLiteSnapRecentColors(
      value?.recentColors,
      base.recentColors
    ),
    historyEnabled:
      typeof value?.historyEnabled === "boolean"
        ? value.historyEnabled
        : base.historyEnabled,
    historyMaxItems: clampNumber(
      value?.historyMaxItems,
      base.historyMaxItems,
      LITESNAP_HISTORY_MAX_ITEMS_MIN,
      LITESNAP_HISTORY_MAX_ITEMS_MAX
    )
  };
}

export class LiteSnapSettingsStore {
  private cachedSettings: LiteSnapSettings | null = null;

  public constructor(private readonly db: LiteDatabase) {}

  public async getSettings(): Promise<LiteSnapSettings> {
    if (this.cachedSettings) {
      return { ...this.cachedSettings, recentColors: [...this.cachedSettings.recentColors] };
    }

    const fallback = createDefaultLiteSnapSettings();
    const raw = await this.db.getSetting(LITESNAP_SETTINGS_KEY);
    if (!raw) {
      await this.db.setSetting(LITESNAP_SETTINGS_KEY, JSON.stringify(fallback));
      this.cachedSettings = fallback;
      return { ...fallback, recentColors: [...fallback.recentColors] };
    }

    try {
      const parsed = JSON.parse(raw) as Partial<LiteSnapSettings>;
      const normalized = normalizeLiteSnapSettings(parsed, fallback);
      if (JSON.stringify(normalized) !== raw) {
        await this.db.setSetting(
          LITESNAP_SETTINGS_KEY,
          JSON.stringify(normalized)
        );
      }
      this.cachedSettings = normalized;
      return { ...normalized, recentColors: [...normalized.recentColors] };
    } catch {
      await this.db.setSetting(LITESNAP_SETTINGS_KEY, JSON.stringify(fallback));
      this.cachedSettings = fallback;
      return { ...fallback, recentColors: [...fallback.recentColors] };
    }
  }

  public async updateSettings(
    patch: Partial<LiteSnapSettings>
  ): Promise<LiteSnapSettings> {
    const current = await this.getSettings();
    const next = normalizeLiteSnapSettings(patch, current);
    await this.db.setSetting(LITESNAP_SETTINGS_KEY, JSON.stringify(next));
    this.cachedSettings = next;
    return { ...next, recentColors: [...next.recentColors] };
  }
}
