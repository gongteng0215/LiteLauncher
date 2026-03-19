import UAParser from "ua-parser-js";

import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type UaAction = "open" | "parse";

interface UaCommand {
  action: UaAction;
  ua: string;
}

interface UaParseResult {
  browser: string;
  browserVersion: string;
  browserMajor: string;
  os: string;
  osVersion: string;
  device: string;
  deviceVendor: string;
  deviceModel: string;
  deviceType: string;
  engine: string;
  engineVersion: string;
  cpu: string;
}

const PLUGIN_ID = "webtools-ua";
const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";
const QUERY_ALIASES = [
  "wt-ua",
  "ua-tool",
  "ua",
  "user-agent",
  "浏览器",
  "系统",
  "设备解析"
];

function formatCpuArchitecture(value: string | undefined): string {
  const normalized = (value ?? "").trim().toLowerCase();
  switch (normalized) {
    case "amd64":
    case "x86_64":
      return "x64";
    case "ia32":
    case "i386":
    case "x86":
      return "x86";
    case "arm64":
    case "aarch64":
      return "ARM64";
    case "armhf":
      return "ARMHF";
    case "arm":
      return "ARM";
    default:
      return value && value.trim() ? value : "Unknown";
  }
}

function buildTarget(action: UaAction, ua = ""): string {
  const params = new URLSearchParams();
  params.set("action", action);
  if (ua) {
    params.set("ua", ua);
  }
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseCommand(optionsText: string | undefined): UaCommand {
  if (!optionsText) {
    return { action: "open", ua: DEFAULT_UA };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? "open").trim().toLowerCase();

  return {
    action: actionRaw === "parse" ? "parse" : "open",
    ua: params.get("ua") ?? DEFAULT_UA
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
    title: "UA 解析",
    subtitle: "解析浏览器、系统、设备信息",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget("open"),
    keywords: ["plugin", "webtools", "ua", "user-agent", "浏览器", "系统", "设备"]
  };
}

function parseUa(ua: string): UaParseResult {
  const parser = new UAParser.UAParser(ua);
  const result = parser.getResult();

  const browser = result.browser.name ?? "Unknown";
  const browserVersion = result.browser.version ?? "-";
  const browserMajor = result.browser.major ?? "-";
  const os = result.os.name ?? "Unknown";
  const osVersion = result.os.version ?? "-";
  const deviceVendor = result.device.vendor ?? "-";
  const deviceModel = result.device.model ?? "-";
  const deviceType = result.device.type ?? "desktop";
  const engine = result.engine.name ?? "Unknown";
  const engineVersion = result.engine.version ?? "-";
  const cpu = formatCpuArchitecture(result.cpu.architecture);
  const device =
    deviceVendor !== "-" || deviceModel !== "-"
      ? `${deviceVendor} ${deviceModel}`.trim()
      : deviceType;

  return {
    browser,
    browserVersion,
    browserMajor,
    os,
    osVersion,
    device,
    deviceVendor,
    deviceModel,
    deviceType,
    engine,
    engineVersion,
    cpu
  };
}

function executeParse(command: UaCommand): ExecuteResult {
  if (!command.ua.trim()) {
    return {
      ok: true,
      keepOpen: true,
      message: "请输入 UA 字符串",
      data: {
        ua: "",
        error: "",
        info: "等待输入 UA"
      }
    };
  }

  try {
    const result = parseUa(command.ua);

    return {
      ok: true,
      keepOpen: true,
      message: "UA 解析完成",
      data: {
        ua: command.ua,
        info: "已解析当前 UA",
        error: "",
        ...result
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "UA 解析失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: {
        ua: command.ua,
        info: "解析失败",
        error: reason
      }
    };
  }
}

export const webtoolsUaPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "UA 解析",
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

    if (command.action === "open") {
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: PLUGIN_ID,
        title: "UA 解析",
        subtitle: "解析浏览器、系统、设备信息",
        data: {
          ua: command.ua || DEFAULT_UA
        }
      });
      return {
        ok: true,
        keepOpen: true,
        message: "已打开 UA 解析"
      };
    }

    return executeParse(command);
  }
};
