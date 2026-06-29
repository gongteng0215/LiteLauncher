import { IPC_CHANNELS } from "../../../shared/channels";
import {
  createDefaultLiteSnapSettings,
  LITESNAP_PLUGIN_ID,
  LiteSnapPanelAction,
  LiteSnapPanelPayload
} from "../../../shared/litesnap";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { LauncherPlugin } from "../types";

const TITLE = "截图贴图";
const SUBTITLE = "快速截图、基础标注、复制、保存与贴图";
const QUERY_ALIASES = [
  "litesnap",
  "snap",
  "screenshot",
  "pin",
  "截图",
  "贴图"
];

function getIconDataUrl(): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
    '<defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">' +
    '<stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#2563eb"/></linearGradient></defs>' +
    '<rect width="24" height="24" rx="6" fill="url(#g)"/>' +
    '<rect x="5" y="6" width="14" height="10" rx="2" fill="#eff6ff" opacity="0.95"/>' +
    '<path d="M8 17h8" stroke="#dbeafe" stroke-width="1.6" stroke-linecap="round"/>' +
    '<path d="M9 9l6 4M15 9l-6 4" stroke="#1d4ed8" stroke-width="1.4" stroke-linecap="round"/>' +
    "</svg>";
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

function buildTarget(action: LiteSnapPanelAction = "open"): string {
  const params = new URLSearchParams();
  params.set("action", action);
  return `command:plugin:${LITESNAP_PLUGIN_ID}?${params.toString()}`;
}

function createCatalogItem(
  action: LiteSnapPanelAction = "open",
  title = TITLE,
  subtitle = SUBTITLE
): LaunchItem {
  return {
    id: `plugin:${LITESNAP_PLUGIN_ID}:${action}`,
    type: "command",
    title,
    subtitle,
    iconPath: getIconDataUrl(),
    target: buildTarget(action),
    keywords: [
      "plugin",
      "litesnap",
      "snap",
      "pin",
      "screenshot",
      "截图",
      "贴图"
    ]
  };
}

function matchesAlias(query: string): string {
  return query.trim().toLowerCase();
}

function getQueryAction(query: string): LiteSnapPanelAction | null {
  const normalized = matchesAlias(query);
  if (!normalized) {
    return null;
  }
  if (normalized === "pin" || normalized === "贴图") {
    return "pin-from-clipboard";
  }
  if (normalized === "snap settings") {
    return "open-settings";
  }
  if (QUERY_ALIASES.includes(normalized)) {
    return normalized === "snap" || normalized === "screenshot" || normalized === "截图"
      ? "start-capture"
      : "open";
  }
  return null;
}

function parseAction(optionsText: string | undefined): LiteSnapPanelAction {
  if (!optionsText) {
    return "open";
  }

  const params = new URLSearchParams(optionsText);
  const action = (params.get("action") ?? "open").trim().toLowerCase();
  switch (action) {
    case "start-capture":
    case "pin-from-clipboard":
    case "open-settings":
      return action;
    default:
      return "open";
  }
}

function createPanelPayload(action: LiteSnapPanelAction): LiteSnapPanelPayload {
  const settings = createDefaultLiteSnapSettings();
  const statusMessage =
    "按 F1 进入截图，主窗口会保持可见，便于截取启动器界面。";

  switch (action) {
    case "start-capture":
      return {
        settings,
        statusMessage,
        preferredView: "main"
      };
    case "pin-from-clipboard":
      return {
        settings,
        statusMessage: "按 F3 可将剪贴板图片贴到屏幕上。",
        preferredView: "main"
      };
    case "open-settings":
      return {
        settings,
        statusMessage: "可在此调整快捷键、保存目录与标注预设。",
        preferredView: "settings"
      };
    case "open":
    default:
      return {
        settings,
        statusMessage,
        preferredView: "main"
      };
  }
}

export const liteSnapPlugin: LauncherPlugin = {
  id: LITESNAP_PLUGIN_ID,
  name: TITLE,
  createCatalogItems() {
    return [createCatalogItem()];
  },
  getQueryItems(query) {
    const action = getQueryAction(query);
    if (!action) {
      return [];
    }

    if (action === "pin-from-clipboard") {
      return [
        createCatalogItem(action, "贴图到屏幕", "将当前剪贴板图片贴到屏幕上")
      ];
    }

    if (action === "open-settings") {
      return [
        createCatalogItem(action, "截图贴图设置", "打开 LiteSnap 设置")
      ];
    }

    if (action === "start-capture") {
      return [
        createCatalogItem(action, "开始截图", "启动 LiteSnap 截图流程")
      ];
    }

    return [createCatalogItem()];
  },
  execute(optionsText, context): ExecuteResult {
    const action = parseAction(optionsText);
    const payload = createPanelPayload(action);
    context.window.webContents.send(IPC_CHANNELS.openPanel, {
      panel: "plugin",
      pluginId: LITESNAP_PLUGIN_ID,
      title: TITLE,
      subtitle: SUBTITLE,
      data: payload
    });

    return {
      ok: true,
      keepOpen: true,
      message: payload.statusMessage ?? "已打开 LiteSnap"
    };
  }
};
