(function initUiThemeApi(): void {
  type UiThemePresetId =
    | "violet"
    | "azure"
    | "emerald"
    | "amber"
    | "rose"
    | "custom";

  type UiThemeConfig = {
    presetId: UiThemePresetId;
    accent: string;
    accentStrong: string;
    accentSoft: string;
    bg: string;
    surface: string;
    text: string;
  };

  type UiThemeApi = {
    DEFAULT: UiThemeConfig;
    PRESETS: Array<{
      id: Exclude<UiThemePresetId, "custom">;
      label: string;
      theme: Omit<UiThemeConfig, "presetId">;
    }>;
    normalize(input: Partial<UiThemeConfig> | null | undefined): UiThemeConfig;
    fromPreset(id: Exclude<UiThemePresetId, "custom">): UiThemeConfig;
    fromAccent(accent: string, base?: UiThemeConfig): UiThemeConfig;
    apply(theme: UiThemeConfig): void;
  };

  const DEFAULT: UiThemeConfig = {
    presetId: "violet",
    accent: "#9d63ff",
    accentStrong: "#6f3bc2",
    accentSoft: "#c4a0ff",
    bg: "#070612",
    surface: "#0d0b1d",
    text: "#f1edff"
  };

  const PRESETS: UiThemeApi["PRESETS"] = [
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

  function normalizeHexColor(input: unknown, fallback: string): string {
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

  function hexToRgbChannels(hex: string): string {
    const normalized = normalizeHexColor(hex, "#000000").slice(1);
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }

  function mixHex(hex: string, targetHex: string, amount: number): string {
    const from = normalizeHexColor(hex, "#000000").slice(1);
    const to = normalizeHexColor(targetHex, "#ffffff").slice(1);
    const fr = Number.parseInt(from.slice(0, 2), 16);
    const fg = Number.parseInt(from.slice(2, 4), 16);
    const fb = Number.parseInt(from.slice(4, 6), 16);
    const tr = Number.parseInt(to.slice(0, 2), 16);
    const tg = Number.parseInt(to.slice(2, 4), 16);
    const tb = Number.parseInt(to.slice(4, 6), 16);
    const r = clampByte(fr + (tr - fr) * amount);
    const g = clampByte(fg + (tg - fg) * amount);
    const b = clampByte(fb + (tb - fb) * amount);
    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  function fromPreset(id: Exclude<UiThemePresetId, "custom">): UiThemeConfig {
    const preset = PRESETS.find((item) => item.id === id) ?? PRESETS[0];
    return { presetId: preset.id, ...preset.theme };
  }

  function fromAccent(accentInput: string, base: UiThemeConfig = DEFAULT): UiThemeConfig {
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

  function normalize(input: Partial<UiThemeConfig> | null | undefined): UiThemeConfig {
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
        : DEFAULT.presetId;
    if (presetId !== "custom") {
      return fromPreset(presetId);
    }
    return {
      presetId: "custom",
      accent: normalizeHexColor(source.accent, DEFAULT.accent),
      accentStrong: normalizeHexColor(source.accentStrong, DEFAULT.accentStrong),
      accentSoft: normalizeHexColor(source.accentSoft, DEFAULT.accentSoft),
      bg: normalizeHexColor(source.bg, DEFAULT.bg),
      surface: normalizeHexColor(source.surface, DEFAULT.surface),
      text: normalizeHexColor(source.text, DEFAULT.text)
    };
  }

  function apply(theme: UiThemeConfig): void {
    const next = normalize(theme);
    const root = document.documentElement;
    root.style.setProperty("--ll-accent", next.accent);
    root.style.setProperty("--ll-accent-rgb", hexToRgbChannels(next.accent));
    root.style.setProperty("--ll-accent-hover", next.accentSoft);
    root.style.setProperty("--ll-accent-hover-rgb", hexToRgbChannels(next.accentSoft));
    root.style.setProperty("--ll-accent-soft", next.accentSoft);
    root.style.setProperty("--ll-accent-soft-rgb", hexToRgbChannels(next.accentSoft));
    root.style.setProperty("--ll-accent-strong", next.accentStrong);
    root.style.setProperty(
      "--ll-accent-strong-rgb",
      hexToRgbChannels(next.accentStrong)
    );
    const deep = mixHex(next.accentStrong, "#000000", 0.18);
    const ink = mixHex(next.accentStrong, "#000000", 0.42);
    root.style.setProperty("--ll-accent-deep", deep);
    root.style.setProperty("--ll-accent-deep-rgb", hexToRgbChannels(deep));
    root.style.setProperty("--ll-accent-ink", ink);
    root.style.setProperty("--ll-accent-ink-rgb", hexToRgbChannels(ink));
    root.style.setProperty("--ll-bg", next.bg);
    root.style.setProperty("--ll-bg-rgb", hexToRgbChannels(next.bg));
    root.style.setProperty("--ll-surface", next.surface);
    root.style.setProperty("--ll-surface-rgb", hexToRgbChannels(next.surface));
    const raised = mixHex(next.surface, "#ffffff", 0.04);
    const input = mixHex(next.surface, "#ffffff", 0.06);
    root.style.setProperty("--ll-surface-raised", raised);
    root.style.setProperty("--ll-surface-raised-rgb", hexToRgbChannels(raised));
    root.style.setProperty("--ll-surface-input", input);
    root.style.setProperty("--ll-surface-input-rgb", hexToRgbChannels(input));
    root.style.setProperty("--ll-text", next.text);
    root.style.setProperty("--ll-text-muted", mixHex(next.text, next.bg, 0.42));
    root.style.setProperty(
      "--ll-text-accent",
      mixHex(next.accentSoft, "#ffffff", 0.18)
    );
    root.style.setProperty(
      "--ll-line",
      `rgba(${hexToRgbChannels(next.accentSoft)}, 0.18)`
    );
    root.style.setProperty(
      "--ll-line-strong",
      `rgba(${hexToRgbChannels(next.accent)}, 0.34)`
    );
  }

  window.__LL_UI_THEME__ = {
    DEFAULT,
    PRESETS,
    normalize,
    fromPreset,
    fromAccent,
    apply
  };
})();
