export type UiThemePresetId =
  | "violet"
  | "azure"
  | "emerald"
  | "amber"
  | "rose"
  | "custom";

export interface UiThemeConfig {
  presetId: UiThemePresetId;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  bg: string;
  surface: string;
  text: string;
}

export const UI_THEME_CONFIG_KEY = "uiThemeConfig";

export const DEFAULT_UI_THEME_CONFIG: UiThemeConfig = {
  presetId: "violet",
  accent: "#9d63ff",
  accentStrong: "#6f3bc2",
  accentSoft: "#c4a0ff",
  bg: "#070612",
  surface: "#0d0b1d",
  text: "#f1edff"
};

export const UI_THEME_PRESETS: Array<{
  id: Exclude<UiThemePresetId, "custom">;
  label: string;
  theme: Omit<UiThemeConfig, "presetId">;
}> = [
  {
    id: "violet",
    label: "暗紫",
    theme: {
      accent: "#9d63ff",
      accentStrong: "#6f3bc2",
      accentSoft: "#c4a0ff",
      bg: "#070612",
      surface: "#0d0b1d",
      text: "#f1edff"
    }
  },
  {
    id: "azure",
    label: "青蓝",
    theme: {
      accent: "#38bdf8",
      accentStrong: "#0284c7",
      accentSoft: "#7dd3fc",
      bg: "#061018",
      surface: "#0b1a24",
      text: "#eaf7ff"
    }
  },
  {
    id: "emerald",
    label: "翠绿",
    theme: {
      accent: "#34d399",
      accentStrong: "#059669",
      accentSoft: "#6ee7b7",
      bg: "#06140f",
      surface: "#0b1f18",
      text: "#eafff5"
    }
  },
  {
    id: "amber",
    label: "琥珀",
    theme: {
      accent: "#f59e0b",
      accentStrong: "#b45309",
      accentSoft: "#fbbf24",
      bg: "#140e06",
      surface: "#1f160b",
      text: "#fff7e8"
    }
  },
  {
    id: "rose",
    label: "玫红",
    theme: {
      accent: "#f472b6",
      accentStrong: "#db2777",
      accentSoft: "#f9a8d4",
      bg: "#14060e",
      surface: "#1f0b16",
      text: "#ffeaf4"
    }
  }
];

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function normalizeHexColor(input: unknown, fallback: string): string {
  if (typeof input !== "string") {
    return fallback;
  }
  const raw = input.trim();
  const short = /^#([0-9a-fA-F]{3})$/.exec(raw);
  if (short) {
    const [r, g, b] = short[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  const full = /^#([0-9a-fA-F]{6})$/.exec(raw);
  if (full) {
    return `#${full[1].toLowerCase()}`;
  }
  return fallback;
}

export function hexToRgbChannels(hex: string): string {
  const normalized = normalizeHexColor(hex, "#000000").slice(1);
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function mixChannel(channel: number, target: number, amount: number): number {
  return clampByte(channel + (target - channel) * amount);
}

export function mixHex(hex: string, targetHex: string, amount: number): string {
  const from = normalizeHexColor(hex, "#000000").slice(1);
  const to = normalizeHexColor(targetHex, "#ffffff").slice(1);
  const fr = Number.parseInt(from.slice(0, 2), 16);
  const fg = Number.parseInt(from.slice(2, 4), 16);
  const fb = Number.parseInt(from.slice(4, 6), 16);
  const tr = Number.parseInt(to.slice(0, 2), 16);
  const tg = Number.parseInt(to.slice(2, 4), 16);
  const tb = Number.parseInt(to.slice(4, 6), 16);
  const r = mixChannel(fr, tr, amount);
  const g = mixChannel(fg, tg, amount);
  const b = mixChannel(fb, tb, amount);
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function deriveThemeFromAccent(
  accentInput: string,
  base: UiThemeConfig = DEFAULT_UI_THEME_CONFIG
): UiThemeConfig {
  const accent = normalizeHexColor(accentInput, base.accent);
  return {
    presetId: "custom",
    accent,
    accentStrong: mixHex(accent, "#000000", 0.28),
    accentSoft: mixHex(accent, "#ffffff", 0.32),
    bg: mixHex(accent, "#000000", 0.92),
    surface: mixHex(accent, "#000000", 0.86),
    text: mixHex(accent, "#ffffff", 0.9)
  };
}

export function themeFromPreset(
  presetId: Exclude<UiThemePresetId, "custom">
): UiThemeConfig {
  const preset =
    UI_THEME_PRESETS.find((item) => item.id === presetId) ?? UI_THEME_PRESETS[0];
  return {
    presetId: preset.id,
    ...preset.theme
  };
}

export function normalizeUiThemeConfig(
  input: Partial<UiThemeConfig> | null | undefined,
  base: UiThemeConfig = DEFAULT_UI_THEME_CONFIG
): UiThemeConfig {
  const source = input ?? {};
  const presetRaw = source.presetId;
  const presetId: UiThemePresetId =
    presetRaw === "violet" ||
    presetRaw === "azure" ||
    presetRaw === "emerald" ||
    presetRaw === "amber" ||
    presetRaw === "rose" ||
    presetRaw === "custom"
      ? presetRaw
      : base.presetId;

  if (presetId !== "custom") {
    return themeFromPreset(presetId);
  }

  return {
    presetId: "custom",
    accent: normalizeHexColor(source.accent, base.accent),
    accentStrong: normalizeHexColor(source.accentStrong, base.accentStrong),
    accentSoft: normalizeHexColor(source.accentSoft, base.accentSoft),
    bg: normalizeHexColor(source.bg, base.bg),
    surface: normalizeHexColor(source.surface, base.surface),
    text: normalizeHexColor(source.text, base.text)
  };
}
