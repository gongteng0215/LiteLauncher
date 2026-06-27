import {
  createDefaultLiteSnapSettings,
  LiteSnapAnnotationTool,
  LiteSnapSettings
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

function normalizeLiteSnapSettings(
  value: Partial<LiteSnapSettings> | null | undefined,
  base: LiteSnapSettings = createDefaultLiteSnapSettings()
): LiteSnapSettings {
  return {
    screenshotShortcut:
      typeof value?.screenshotShortcut === "string" &&
      value.screenshotShortcut.trim()
        ? value.screenshotShortcut.trim()
        : base.screenshotShortcut,
    pinShortcut:
      typeof value?.pinShortcut === "string" && value.pinShortcut.trim()
        ? value.pinShortcut.trim()
        : base.pinShortcut,
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
      24
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
        : base.annotationFillShapes
  };
}

export class LiteSnapSettingsStore {
  private cachedSettings: LiteSnapSettings | null = null;

  public constructor(private readonly db: LiteDatabase) {}

  public async getSettings(): Promise<LiteSnapSettings> {
    if (this.cachedSettings) {
      return { ...this.cachedSettings };
    }

    const fallback = createDefaultLiteSnapSettings();
    const raw = await this.db.getSetting(LITESNAP_SETTINGS_KEY);
    if (!raw) {
      await this.db.setSetting(LITESNAP_SETTINGS_KEY, JSON.stringify(fallback));
      this.cachedSettings = fallback;
      return { ...fallback };
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
      return { ...normalized };
    } catch {
      await this.db.setSetting(LITESNAP_SETTINGS_KEY, JSON.stringify(fallback));
      this.cachedSettings = fallback;
      return { ...fallback };
    }
  }

  public async updateSettings(
    patch: Partial<LiteSnapSettings>
  ): Promise<LiteSnapSettings> {
    const current = await this.getSettings();
    const next = normalizeLiteSnapSettings(patch, current);
    await this.db.setSetting(LITESNAP_SETTINGS_KEY, JSON.stringify(next));
    this.cachedSettings = next;
    return { ...next };
  }
}
