import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type ColorsAction = "open" | "convert";

interface ColorsCommand {
  action: ColorsAction;
  color: string;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const PLUGIN_ID = "webtools-colors";
const ACTION_OPEN: ColorsAction = "open";
const DEFAULT_COLOR = "#6c5ce7";
const QUERY_ALIASES = ["wt-colors", "color-tool", "颜色", "hex", "rgb"];

function buildTarget(action: ColorsAction, color: string): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("color", color);
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseCommand(optionsText: string | undefined): ColorsCommand {
  if (!optionsText) {
    return { action: ACTION_OPEN, color: DEFAULT_COLOR };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();

  return {
    action: actionRaw === "convert" ? "convert" : ACTION_OPEN,
    color: (params.get("color") ?? DEFAULT_COLOR).trim()
  };
}

function matchesAlias(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return QUERY_ALIASES.some((alias) => {
    const value = alias.trim().toLowerCase();
    return value ? normalized === value || normalized.startsWith(`${value} `) : false;
  });
}

function createCatalogItem(): LaunchItem {
  return {
    id: `plugin:${PLUGIN_ID}`,
    type: "command",
    title: "颜色工具",
    subtitle: "HEX / RGB / HSL 转换与色阶预览",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(ACTION_OPEN, DEFAULT_COLOR),
    keywords: ["plugin", "webtools", "color", "hex", "rgb", "hsl", "颜色"]
  };
}

function clampColor(value: number): number {
  const rounded = Math.round(value);
  if (rounded < 0) {
    return 0;
  }
  if (rounded > 255) {
    return 255;
  }
  return rounded;
}

function rgbToHex(rgb: RgbColor): string {
  const r = clampColor(rgb.r).toString(16).padStart(2, "0");
  const g = clampColor(rgb.g).toString(16).padStart(2, "0");
  const b = clampColor(rgb.b).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

function parseHexColor(input: string): RgbColor | null {
  const normalized = input.trim().toLowerCase();
  const match = normalized.match(/^#?([\da-f]{3}|[\da-f]{6})$/i);
  if (!match) {
    return null;
  }

  let raw = match[1] ?? "";
  if (raw.length === 3) {
    raw = raw
      .split("")
      .map((char) => `${char}${char}`)
      .join("");
  }

  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16)
  };
}

function parseRgbColor(input: string): RgbColor | null {
  const match = input
    .trim()
    .match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
  if (!match) {
    return null;
  }

  return {
    r: clampColor(Number(match[1] ?? "0")),
    g: clampColor(Number(match[2] ?? "0")),
    b: clampColor(Number(match[3] ?? "0"))
  };
}

function parseHslColor(input: string): RgbColor | null {
  const match = input
    .trim()
    .match(/^hsl\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*\)$/i);

  if (!match) {
    return null;
  }

  let h = Number(match[1] ?? "0");
  const s = Number(match[2] ?? "0") / 100;
  const l = Number(match[3] ?? "0") / 100;

  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return {
    r: clampColor((r + m) * 255),
    g: clampColor((g + m) * 255),
    b: clampColor((b + m) * 255)
  };
}

function rgbToHsl(rgb: RgbColor): { h: number; s: number; l: number } {
  const r = clampColor(rgb.r) / 255;
  const g = clampColor(rgb.g) / 255;
  const b = clampColor(rgb.b) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
  }

  h = Math.round((h * 60 + 360) % 360);
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function parseColorInput(input: string): RgbColor {
  return (
    parseHexColor(input) ??
    parseRgbColor(input) ??
    parseHslColor(input) ?? {
      ...parseHexColor(DEFAULT_COLOR)!
    }
  );
}

function buildShades(rgb: RgbColor): string[] {
  const shades: string[] = [];
  for (let i = 1; i <= 10; i += 1) {
    const factor = i / 10;
    const r = clampColor(rgb.r * factor + 255 * (1 - factor));
    const g = clampColor(rgb.g * factor + 255 * (1 - factor));
    const b = clampColor(rgb.b * factor + 255 * (1 - factor));
    shades.push(rgbToHex({ r, g, b }));
  }
  return shades;
}

function executeConvert(command: ColorsCommand): ExecuteResult {
  try {
    const rgb = parseColorInput(command.color);
    const hex = rgbToHex(rgb);
    const hsl = rgbToHsl(rgb);

    return {
      ok: true,
      keepOpen: true,
      message: "颜色转换完成",
      data: {
        input: command.color,
        hex,
        rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
        hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
        shades: buildShades(rgb)
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "颜色转换失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason
    };
  }
}

export const webtoolsColorsPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "颜色工具",
  createCatalogItems() {
    return [createCatalogItem()];
  },
  getQueryItems(query) {
    if (!matchesAlias(query)) {
      return [];
    }
    return [createCatalogItem()];
  },
  execute(optionsText, context): ExecuteResult {
    const command = parseCommand(optionsText);

    if (command.action === ACTION_OPEN) {
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: PLUGIN_ID,
        title: "颜色工具",
        subtitle: "HEX / RGB / HSL 转换与色阶预览",
        data: {
          color: command.color || DEFAULT_COLOR
        }
      });
      return {
        ok: true,
        keepOpen: true,
        message: "已打开颜色工具"
      };
    }

    return executeConvert(command);
  }
};
