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
  os: string;
  osVersion: string;
  device: string;
  engine: string;
  cpu: string;
}

const PLUGIN_ID = "webtools-ua";
const ACTION_OPEN: UaAction = "open";
const QUERY_ALIASES = ["wt-ua", "ua-tool", "ua", "user-agent", "浏览器"];

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
    return { action: ACTION_OPEN, ua: "" };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();

  return {
    action: actionRaw === "parse" ? "parse" : ACTION_OPEN,
    ua: params.get("ua") ?? ""
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
    target: buildTarget(ACTION_OPEN),
    keywords: ["plugin", "webtools", "ua", "user-agent", "浏览器", "系统"]
  };
}

function matchFirst(text: string, patterns: Array<{ regex: RegExp; name: string }>): { name: string; version: string } {
  for (const pattern of patterns) {
    const matched = text.match(pattern.regex);
    if (matched) {
      return {
        name: pattern.name,
        version: matched[1] ?? "-"
      };
    }
  }

  return {
    name: "Unknown",
    version: "-"
  };
}

function parseUa(ua: string): UaParseResult {
  const browser = matchFirst(ua, [
    { regex: /Edg\/([\d.]+)/, name: "Edge" },
    { regex: /Chrome\/([\d.]+)/, name: "Chrome" },
    { regex: /Firefox\/([\d.]+)/, name: "Firefox" },
    { regex: /Version\/([\d.]+).*Safari/, name: "Safari" },
    { regex: /OPR\/([\d.]+)/, name: "Opera" },
    { regex: /MSIE\s([\d.]+)/, name: "Internet Explorer" }
  ]);

  const os = matchFirst(ua, [
    { regex: /Windows NT ([\d.]+)/, name: "Windows" },
    { regex: /Android ([\d.]+)/, name: "Android" },
    { regex: /iPhone OS ([\d_]+)/, name: "iOS" },
    { regex: /iPad; CPU OS ([\d_]+)/, name: "iPadOS" },
    { regex: /Mac OS X ([\d_]+)/, name: "macOS" },
    { regex: /Linux ([\w.-]+)/, name: "Linux" }
  ]);

  const engine = matchFirst(ua, [
    { regex: /AppleWebKit\/([\d.]+)/, name: "WebKit" },
    { regex: /Gecko\/([\d.]+)/, name: "Gecko" },
    { regex: /Trident\/([\d.]+)/, name: "Trident" }
  ]);

  let device = "Desktop";
  if (/Mobile|iPhone|Android/i.test(ua)) {
    device = "Mobile";
  } else if (/iPad|Tablet/i.test(ua)) {
    device = "Tablet";
  }

  const cpu = /arm|aarch64/i.test(ua)
    ? "ARM"
    : /x86_64|Win64|x64|amd64/i.test(ua)
    ? "x64"
    : /i686|i386|x86/i.test(ua)
    ? "x86"
    : "Unknown";

  return {
    browser: browser.name,
    browserVersion: browser.version,
    os: os.name,
    osVersion: os.version.replace(/_/g, "."),
    device,
    engine: `${engine.name} ${engine.version}`.trim(),
    cpu
  };
}

function executeParse(command: UaCommand): ExecuteResult {
  try {
    if (!command.ua.trim()) {
      throw new Error("请输入 UA 字符串");
    }

    const result = parseUa(command.ua);

    return {
      ok: true,
      keepOpen: true,
      message: "UA 解析完成",
      data: {
        ua: command.ua,
        ...result
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "解析失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: {
        ua: command.ua
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

    if (command.action === ACTION_OPEN) {
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: PLUGIN_ID,
        title: "UA 解析",
        subtitle: "解析浏览器、系统、设备信息",
        data: {
          ua: command.ua
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
