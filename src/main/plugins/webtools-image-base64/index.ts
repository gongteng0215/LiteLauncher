import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type ImageBase64Action = "open" | "normalize";

interface ImageBase64Command {
  action: ImageBase64Action;
  input: string;
}

const PLUGIN_ID = "webtools-image-base64";
const ACTION_OPEN: ImageBase64Action = "open";
const QUERY_ALIASES = ["wt-image", "wt-base64", "base64", "图片", "图像"];

function buildTarget(action: ImageBase64Action, input = ""): string {
  const params = new URLSearchParams();
  params.set("action", action);
  if (input) {
    params.set("input", input);
  }
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseCommand(optionsText: string | undefined): ImageBase64Command {
  if (!optionsText) {
    return { action: ACTION_OPEN, input: "" };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();
  return {
    action: actionRaw === "normalize" ? "normalize" : ACTION_OPEN,
    input: params.get("input") ?? ""
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
    title: "图片 Base64",
    subtitle: "DataURL 与 Base64 文本互转/预览",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(ACTION_OPEN),
    keywords: ["plugin", "webtools", "image", "base64", "图片", "编码"]
  };
}

function extractBase64Parts(input: string): {
  mime: string;
  rawBase64: string;
  dataUrl: string;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("请输入 Base64 或 DataURL");
  }

  const dataUrlMatch = trimmed.match(/^data:(image\/[\w.+-]+);base64,([\s\S]+)$/i);
  if (dataUrlMatch) {
    const mime = dataUrlMatch[1] ?? "image/png";
    const rawBase64 = (dataUrlMatch[2] ?? "").replace(/\s+/g, "");
    return {
      mime,
      rawBase64,
      dataUrl: `data:${mime};base64,${rawBase64}`
    };
  }

  const normalized = trimmed.replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/=_-]+$/.test(normalized)) {
    throw new Error("输入不是有效的 Base64 文本");
  }

  return {
    mime: "image/png",
    rawBase64: normalized,
    dataUrl: `data:image/png;base64,${normalized}`
  };
}

function estimateSize(rawBase64: string): number {
  const padding = rawBase64.endsWith("==") ? 2 : rawBase64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((rawBase64.length * 3) / 4) - padding);
}

function executeNormalize(command: ImageBase64Command): ExecuteResult {
  try {
    const parsed = extractBase64Parts(command.input);
    const bytes = estimateSize(parsed.rawBase64);

    return {
      ok: true,
      keepOpen: true,
      message: "转换完成",
      data: {
        input: command.input,
        mime: parsed.mime,
        rawBase64: parsed.rawBase64,
        dataUrl: parsed.dataUrl,
        bytes,
        sizeText:
          bytes < 1024
            ? `${bytes} B`
            : bytes < 1024 * 1024
            ? `${(bytes / 1024).toFixed(2)} KB`
            : `${(bytes / (1024 * 1024)).toFixed(2)} MB`
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "转换失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: {
        input: command.input
      }
    };
  }
}

export const webtoolsImageBase64Plugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "图片 Base64",
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
        title: "图片 Base64",
        subtitle: "DataURL 与 Base64 文本互转/预览",
        data: {
          input: command.input
        }
      });
      return {
        ok: true,
        keepOpen: true,
        message: "已打开图片 Base64 工具"
      };
    }

    return executeNormalize(command);
  }
};
