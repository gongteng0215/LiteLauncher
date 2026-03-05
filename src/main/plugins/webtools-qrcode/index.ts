import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type QrAction = "open" | "generate";
type QrLevel = "L" | "M" | "Q" | "H";

interface QrCommand {
  action: QrAction;
  text: string;
  size: number;
  level: QrLevel;
}

const PLUGIN_ID = "webtools-qrcode";
const ACTION_OPEN: QrAction = "open";
const QUERY_ALIASES = ["wt-qr", "wt-qrcode", "qrcode", "二维码", "qr"];

function buildTarget(command: QrCommand): string {
  const params = new URLSearchParams();
  params.set("action", command.action);
  params.set("text", command.text);
  params.set("size", String(command.size));
  params.set("level", command.level);
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function clampSize(value: number): number {
  if (!Number.isFinite(value)) {
    return 300;
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
  const normalized = (value ?? "M").trim().toUpperCase();
  if (normalized === "L" || normalized === "M" || normalized === "Q" || normalized === "H") {
    return normalized;
  }
  return "M";
}

function parseCommand(optionsText: string | undefined): QrCommand {
  if (!optionsText) {
    return {
      action: ACTION_OPEN,
      text: "https://github.com",
      size: 300,
      level: "M"
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();

  return {
    action: actionRaw === "generate" ? "generate" : ACTION_OPEN,
    text: params.get("text") ?? "",
    size: clampSize(Number(params.get("size") ?? "300")),
    level: parseLevel(params.get("level"))
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
    subtitle: "文本/链接转二维码图片",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(parseCommand(undefined)),
    keywords: ["plugin", "webtools", "qrcode", "qr", "二维码", "生成"]
  };
}

function buildQrUrl(text: string, size: number, level: QrLevel): string {
  const params = new URLSearchParams();
  params.set("text", text);
  params.set("size", `${size}x${size}`);
  params.set("ecLevel", level);
  params.set("format", "png");
  return `https://quickchart.io/qr?${params.toString()}`;
}

function executeGenerate(command: QrCommand): ExecuteResult {
  try {
    if (!command.text.trim()) {
      throw new Error("请输入文本或链接");
    }

    const qrUrl = buildQrUrl(command.text.trim(), clampSize(command.size), command.level);

    return {
      ok: true,
      keepOpen: true,
      message: "二维码生成完成",
      data: {
        qrUrl,
        text: command.text,
        size: clampSize(command.size),
        level: command.level
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "生成失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason
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
  execute(optionsText, context): ExecuteResult {
    const command = parseCommand(optionsText);

    if (command.action === ACTION_OPEN) {
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: PLUGIN_ID,
        title: "二维码生成",
        subtitle: "文本/链接转二维码图片",
        data: {
          text: command.text,
          size: command.size,
          level: command.level
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
