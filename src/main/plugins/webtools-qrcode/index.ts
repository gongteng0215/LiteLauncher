import QRCode from "qrcode";

import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type QrAction = "open" | "generate";
type QrLevel = "L" | "M" | "Q" | "H";
type QrLogoMode = "none" | "text" | "image";

interface QrCommand {
  action: QrAction;
  text: string;
  size: number;
  level: QrLevel;
  darkColor: string;
  lightColor: string;
  logoMode: QrLogoMode;
  logoText: string;
  logoImageDataUrl: string;
}

const PLUGIN_ID = "webtools-qrcode";
const ACTION_OPEN: QrAction = "open";
const QUERY_ALIASES = ["wt-qr", "wt-qrcode", "qrcode", "qr", "二维码", "二维码生成"];
const DEFAULT_TEXT = "LiteLauncher 本地二维码示例";
const DEFAULT_SIZE = 300;
const DEFAULT_LEVEL: QrLevel = "M";
const DEFAULT_DARK_COLOR = "#102136";
const DEFAULT_LIGHT_COLOR = "#ffffff";
const DEFAULT_LOGO_MODE: QrLogoMode = "none";
const MAX_LOGO_TEXT_LENGTH = 6;

function buildTarget(command: QrCommand): string {
  const params = new URLSearchParams();
  params.set("action", command.action);
  params.set("text", command.text);
  params.set("size", String(command.size));
  params.set("level", command.level);
  params.set("darkColor", command.darkColor);
  params.set("lightColor", command.lightColor);
  params.set("logoMode", command.logoMode);
  params.set("logoText", command.logoText);
  params.set("logoImageDataUrl", command.logoImageDataUrl);
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function clampSize(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SIZE;
  }

  const rounded = Math.round(value);
  if (rounded < 100) {
    return 100;
  }
  if (rounded > 1000) {
    return 1000;
  }
  return rounded;
}

function parseLevel(value: string | null): QrLevel {
  const normalized = (value ?? DEFAULT_LEVEL).trim().toUpperCase();
  if (normalized === "L" || normalized === "M" || normalized === "Q" || normalized === "H") {
    return normalized;
  }
  return DEFAULT_LEVEL;
}

function normalizeColor(value: string | null | undefined, fallback: string): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return fallback;
  }

  const matched = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!matched) {
    return fallback;
  }

  const hex = matched[1].toLowerCase();
  if (hex.length === 3) {
    return `#${hex
      .split("")
      .map((char) => `${char}${char}`)
      .join("")}`;
  }

  return `#${hex}`;
}

function parseLogoMode(value: string | null): QrLogoMode {
  const normalized = (value ?? DEFAULT_LOGO_MODE).trim().toLowerCase();
  if (normalized === "text" || normalized === "image") {
    return normalized;
  }
  return "none";
}

function normalizeLogoText(value: string | null | undefined): string {
  return (value ?? "").trim().slice(0, MAX_LOGO_TEXT_LENGTH);
}

function normalizeLogoImageDataUrl(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return "";
  }
  if (!/^data:image\/[\w.+-]+;base64,[a-z0-9+/=\s]+$/i.test(trimmed)) {
    return "";
  }
  return trimmed.replace(/\s+/g, "");
}

function parseCommand(optionsText: string | undefined): QrCommand {
  if (!optionsText) {
    return {
      action: ACTION_OPEN,
      text: DEFAULT_TEXT,
      size: DEFAULT_SIZE,
      level: DEFAULT_LEVEL,
      darkColor: DEFAULT_DARK_COLOR,
      lightColor: DEFAULT_LIGHT_COLOR,
      logoMode: DEFAULT_LOGO_MODE,
      logoText: "",
      logoImageDataUrl: ""
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();

  return {
    action: actionRaw === "generate" ? "generate" : ACTION_OPEN,
    text: params.get("text") ?? DEFAULT_TEXT,
    size: clampSize(Number(params.get("size") ?? String(DEFAULT_SIZE))),
    level: parseLevel(params.get("level")),
    darkColor: normalizeColor(params.get("darkColor"), DEFAULT_DARK_COLOR),
    lightColor: normalizeColor(params.get("lightColor"), DEFAULT_LIGHT_COLOR),
    logoMode: parseLogoMode(params.get("logoMode")),
    logoText: normalizeLogoText(params.get("logoText")),
    logoImageDataUrl: normalizeLogoImageDataUrl(params.get("logoImageDataUrl"))
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
    title: "二维码生成",
    subtitle: "支持颜色和 Logo 的本地二维码工具",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(parseCommand(undefined)),
    keywords: ["plugin", "webtools", "qrcode", "qr", "二维码", "生成", "logo"]
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeXmlAttribute(value: string): string {
  return escapeXml(value).replace(/\n/g, "&#10;");
}

function ensureSvgSize(svg: string, size: number): string {
  let next = svg;
  if (/\bwidth="[^"]+"/i.test(next)) {
    next = next.replace(/\bwidth="[^"]+"/i, `width="${size}"`);
  } else {
    next = next.replace(/<svg\b/i, `<svg width="${size}"`);
  }

  if (/\bheight="[^"]+"/i.test(next)) {
    next = next.replace(/\bheight="[^"]+"/i, `height="${size}"`);
  } else {
    next = next.replace(/<svg\b/i, `<svg height="${size}"`);
  }

  return next;
}

function buildTextLogoOverlay(command: QrCommand, size: number): string {
  if (command.logoMode !== "text" || !command.logoText) {
    return "";
  }

  const boxSize = Math.round(size * 0.26);
  const boxX = Math.round((size - boxSize) / 2);
  const boxY = boxX;
  const radius = Math.max(12, Math.round(boxSize * 0.22));
  const fontSize = Math.max(20, Math.round(boxSize * (command.logoText.length > 2 ? 0.32 : 0.42)));
  const fontFamily =
    "Microsoft YaHei, PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, Segoe UI, Arial, sans-serif";

  return [
    `<g class="qr-logo qr-logo-text">`,
    `<rect x="${boxX}" y="${boxY}" width="${boxSize}" height="${boxSize}" rx="${radius}" fill="${command.lightColor}" fill-opacity="0.96" stroke="${command.darkColor}" stroke-opacity="0.18" stroke-width="2" />`,
    `<text x="${Math.round(size / 2)}" y="${Math.round(size / 2)}" fill="${command.darkColor}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="700" text-anchor="middle" dominant-baseline="central" dy="0.04em">${escapeXml(command.logoText)}</text>`,
    `</g>`
  ].join("");
}

function buildImageLogoOverlay(command: QrCommand, size: number): string {
  if (command.logoMode !== "image" || !command.logoImageDataUrl) {
    return "";
  }

  const boxSize = Math.round(size * 0.28);
  const boxX = Math.round((size - boxSize) / 2);
  const boxY = boxX;
  const radius = Math.max(14, Math.round(boxSize * 0.2));
  const imagePadding = Math.max(8, Math.round(boxSize * 0.1));
  const imageSize = boxSize - imagePadding * 2;

  return [
    `<g class="qr-logo qr-logo-image">`,
    `<rect x="${boxX}" y="${boxY}" width="${boxSize}" height="${boxSize}" rx="${radius}" fill="${command.lightColor}" fill-opacity="0.96" stroke="${command.darkColor}" stroke-opacity="0.18" stroke-width="2" />`,
    `<image href="${escapeXmlAttribute(command.logoImageDataUrl)}" x="${boxX + imagePadding}" y="${boxY + imagePadding}" width="${imageSize}" height="${imageSize}" preserveAspectRatio="xMidYMid meet" />`,
    `</g>`
  ].join("");
}

function buildLogoOverlay(command: QrCommand, size: number): string {
  if (command.logoMode === "text") {
    return buildTextLogoOverlay(command, size);
  }
  if (command.logoMode === "image") {
    return buildImageLogoOverlay(command, size);
  }
  return "";
}

async function buildQrSvg(command: QrCommand): Promise<string> {
  const svg = await QRCode.toString(command.text, {
    type: "svg",
    width: command.size,
    margin: 2,
    errorCorrectionLevel: command.level,
    color: {
      dark: command.darkColor,
      light: command.lightColor
    }
  });

  const withSize = ensureSvgSize(svg, command.size);
  const overlay = buildLogoOverlay(command, command.size);
  if (!overlay) {
    return withSize;
  }

  return withSize.replace(/<\/svg>\s*$/i, `${overlay}</svg>`);
}

function buildLogoSummary(command: QrCommand): string {
  if (command.logoMode === "text" && command.logoText) {
    return `Logo 文字 ${command.logoText}`;
  }
  if (command.logoMode === "image" && command.logoImageDataUrl) {
    return "Logo 图片";
  }
  return "无 Logo";
}

async function executeGenerate(command: QrCommand): Promise<ExecuteResult> {
  try {
    const text = command.text.trim();
    if (!text) {
      throw new Error("请输入文本或链接");
    }

    const size = clampSize(command.size);
    const level = parseLevel(command.level);
    const darkColor = normalizeColor(command.darkColor, DEFAULT_DARK_COLOR);
    const lightColor = normalizeColor(command.lightColor, DEFAULT_LIGHT_COLOR);
    const logoMode = parseLogoMode(command.logoMode);
    const logoText = normalizeLogoText(command.logoText);
    const logoImageDataUrl = normalizeLogoImageDataUrl(command.logoImageDataUrl);

    const normalizedCommand: QrCommand = {
      ...command,
      text,
      size,
      level,
      darkColor,
      lightColor,
      logoMode,
      logoText,
      logoImageDataUrl
    };

    const qrSvg = await buildQrSvg(normalizedCommand);
    const qrUrl = `data:image/svg+xml;base64,${Buffer.from(qrSvg, "utf8").toString("base64")}`;

    return {
      ok: true,
      keepOpen: true,
      message: "二维码已生成",
      data: {
        qrUrl,
        text,
        size,
        level,
        darkColor,
        lightColor,
        logoMode,
        logoText,
        logoImageDataUrl,
        info: `尺寸 ${size}px · 纠错级别 ${level} · 前景 ${darkColor} · 背景 ${lightColor} · ${buildLogoSummary(normalizedCommand)}`
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "二维码生成失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: {
        qrUrl: "",
        text: command.text,
        size: clampSize(command.size),
        level: parseLevel(command.level),
        darkColor: normalizeColor(command.darkColor, DEFAULT_DARK_COLOR),
        lightColor: normalizeColor(command.lightColor, DEFAULT_LIGHT_COLOR),
        logoMode: parseLogoMode(command.logoMode),
        logoText: normalizeLogoText(command.logoText),
        logoImageDataUrl: normalizeLogoImageDataUrl(command.logoImageDataUrl)
      }
    };
  }
}

export const webtoolsQrcodePlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "二维码生成",
  createCatalogItems() {
    return [createCatalogItem()];
  },
  getQueryItems(query) {
    if (!matchesAlias(query)) {
      return [];
    }
    return [createCatalogItem()];
  },
  async execute(optionsText, context): Promise<ExecuteResult> {
    const command = parseCommand(optionsText);

    if (command.action === ACTION_OPEN) {
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: PLUGIN_ID,
        title: "二维码生成",
        subtitle: "支持颜色和 Logo 的本地二维码工具",
        data: {
          text: command.text || DEFAULT_TEXT,
          size: command.size,
          level: command.level,
          darkColor: command.darkColor,
          lightColor: command.lightColor,
          logoMode: command.logoMode,
          logoText: command.logoText,
          logoImageDataUrl: command.logoImageDataUrl
        }
      });

      return {
        ok: true,
        keepOpen: true,
        message: "已打开二维码生成"
      };
    }

    return executeGenerate(command);
  }
};
