import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type PortAction = "open" | "query" | "kill";
type PortProtocol = "all" | "tcp" | "udp";

interface PortHelperCommand {
  action: PortAction;
  port: number | null;
  protocol: PortProtocol;
  pid: number | null;
}

interface PortConnection {
  protocol: "TCP" | "UDP";
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  state: string;
  pid: number;
  processName: string;
}

interface NetstatRow {
  protocol: "TCP" | "UDP";
  local: string;
  remote: string;
  state: string;
  pid: number;
}

const PLUGIN_ID = "webtools-port-helper";
const ACTION_OPEN: PortAction = "open";
const DEFAULT_PORT: number | null = null;
const DEFAULT_PROTOCOL: PortProtocol = "all";
const QUERY_ALIASES = [
  "wt-port",
  "port-tool",
  "port",
  "端口",
  "端口占用",
  "查端口"
];
const execFileAsync = promisify(execFile);

function normalizePort(value: string | null): number | null {
  const text = (value ?? "").trim();
  if (!text) {
    return null;
  }
  const parsed = Number(text);
  if (!Number.isInteger(parsed)) {
    return null;
  }
  if (parsed < 1 || parsed > 65535) {
    return null;
  }
  return parsed;
}

function normalizePid(value: string | null): number | null {
  const text = (value ?? "").trim();
  if (!text) {
    return null;
  }
  const parsed = Number(text);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function normalizeProtocol(value: string | null): PortProtocol {
  const normalized = (value ?? DEFAULT_PROTOCOL).trim().toLowerCase();
  if (normalized === "tcp" || normalized === "udp" || normalized === "all") {
    return normalized;
  }
  return DEFAULT_PROTOCOL;
}

function parseCommand(optionsText: string | undefined): PortHelperCommand {
  if (!optionsText) {
    return {
      action: ACTION_OPEN,
      port: DEFAULT_PORT,
      protocol: DEFAULT_PROTOCOL,
      pid: null
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();
  const action: PortAction =
    actionRaw === "query" || actionRaw === "kill" ? actionRaw : ACTION_OPEN;

  return {
    action,
    port: normalizePort(params.get("port")),
    protocol: normalizeProtocol(params.get("protocol")),
    pid: normalizePid(params.get("pid"))
  };
}

function buildTarget(command: PortHelperCommand): string {
  const params = new URLSearchParams();
  params.set("action", command.action);
  if (command.port !== null) {
    params.set("port", String(command.port));
  }
  params.set("protocol", command.protocol);
  if (command.pid !== null) {
    params.set("pid", String(command.pid));
  }
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
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

function parseQueryPreset(query: string): PortHelperCommand | null {
  const tokens = query
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length === 0) {
    return null;
  }

  const first = tokens[0]?.toLowerCase() ?? "";
  if (!QUERY_ALIASES.includes(first)) {
    return null;
  }

let port: number | null = DEFAULT_PORT;
  let protocol: PortProtocol = DEFAULT_PROTOCOL;

  for (const token of tokens.slice(1)) {
    const normalized = token.toLowerCase();
    if (normalized === "tcp" || normalized === "udp" || normalized === "all") {
      protocol = normalized;
      continue;
    }

    const parsedPort = normalizePort(normalized);
    if (parsedPort !== null) {
      port = parsedPort;
    }
  }

  return {
    action: ACTION_OPEN,
    port,
    protocol,
    pid: null
  };
}

function createCatalogItem(command: PortHelperCommand): LaunchItem {
  return {
    id: `plugin:${PLUGIN_ID}`,
    type: "command",
    title: "端口助手",
    subtitle: "查看端口占用、定位进程并释放端口",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget({ ...command, action: ACTION_OPEN }),
    keywords: [
      "plugin",
      "webtools",
      "port",
      "netstat",
      "pid",
      "端口",
      "占用",
      "进程"
    ]
  };
}

function extractPortFromEndpoint(endpoint: string): number | null {
  const text = endpoint.trim();
  if (!text) {
    return null;
  }

  if (text.startsWith("[")) {
    const match = text.match(/\]:([0-9]+)$/);
    if (!match) {
      return null;
    }
    const parsed = Number(match[1]);
    return Number.isInteger(parsed) ? parsed : null;
  }

  const lastColon = text.lastIndexOf(":");
  if (lastColon < 0 || lastColon >= text.length - 1) {
    return null;
  }

  const parsed = Number(text.slice(lastColon + 1));
  return Number.isInteger(parsed) ? parsed : null;
}

function parseNetstatLine(line: string): NetstatRow | null {
  const text = line.trim();
  if (!text || /^proto\s+/i.test(text)) {
    return null;
  }

  const columns = text.split(/\s+/);
  if (columns.length < 4) {
    return null;
  }

  const protocol = columns[0]?.toUpperCase();
  if (protocol !== "TCP" && protocol !== "UDP") {
    return null;
  }

  if (protocol === "TCP") {
    if (columns.length < 5) {
      return null;
    }
    const pid = Number(columns[4]);
    if (!Number.isInteger(pid) || pid <= 0) {
      return null;
    }
    return {
      protocol,
      local: columns[1] ?? "",
      remote: columns[2] ?? "",
      state: columns[3] ?? "",
      pid
    };
  }

  const pid = Number(columns[3]);
  if (!Number.isInteger(pid) || pid <= 0) {
    return null;
  }
  return {
    protocol,
    local: columns[1] ?? "",
    remote: columns[2] ?? "",
    state: "LISTENING",
    pid
  };
}

async function runCommand(file: string, args: string[]): Promise<string> {
  const result = await execFileAsync(file, args, {
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 8
  });
  return String(result.stdout);
}

function parseTasklistProcessName(raw: string): string {
  const line = raw
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item && !item.toLowerCase().startsWith("info:"));
  if (!line) {
    return "";
  }
  const match = line.match(/^"([^"]+)"/);
  return (match?.[1] ?? "").trim();
}

async function getProcessNameByPid(pid: number): Promise<string> {
  try {
    const stdout = await runCommand("tasklist", [
      "/FI",
      `PID eq ${pid}`,
      "/FO",
      "CSV",
      "/NH"
    ]);
    return parseTasklistProcessName(stdout);
  } catch {
    return "";
  }
}

async function queryConnections(
  command: PortHelperCommand
): Promise<PortConnection[]> {
  const protocolCommands: Array<"TCP" | "UDP"> =
    command.protocol === "all"
      ? ["TCP", "UDP"]
      : [command.protocol.toUpperCase() as "TCP" | "UDP"];

  const rows: NetstatRow[] = [];
  for (const protocol of protocolCommands) {
    const stdout = await runCommand("netstat", ["-ano", "-p", protocol]);
    stdout.split(/\r?\n/).forEach((line) => {
      const parsed = parseNetstatLine(line);
      if (parsed) {
        rows.push(parsed);
      }
    });
  }

  const filteredRows = rows.filter((row) => {
    const localPort = extractPortFromEndpoint(row.local);
    if (!localPort) {
      return false;
    }
    if (command.pid !== null && row.pid !== command.pid) {
      return false;
    }
    if (command.port !== null && localPort !== command.port) {
      return false;
    }
    return true;
  });

  const pidSet = new Set<number>(filteredRows.map((row) => row.pid));
  const processNameMap = new Map<number, string>();
  for (const pid of pidSet) {
    processNameMap.set(pid, await getProcessNameByPid(pid));
  }

  const connections = filteredRows
    .map((row) => {
      const localPort = extractPortFromEndpoint(row.local);
      if (!localPort) {
        return null;
      }

      return {
        protocol: row.protocol,
        localAddress: row.local,
        localPort,
        remoteAddress: row.remote,
        state: row.state || (row.protocol === "UDP" ? "LISTENING" : ""),
        pid: row.pid,
        processName: processNameMap.get(row.pid) ?? ""
      } satisfies PortConnection;
    })
    .filter((item): item is PortConnection => item !== null)
    .sort((a, b) => {
      if (a.localPort !== b.localPort) {
        return a.localPort - b.localPort;
      }
      if (a.pid !== b.pid) {
        return a.pid - b.pid;
      }
      return a.protocol.localeCompare(b.protocol);
    });

  return connections;
}

function normalizeExecError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const value = (
      (error as { stderr?: string; stdout?: string }).stderr ??
      (error as { stdout?: string }).stdout ??
      error.message
    ).trim();
    if (value) {
      return value;
    }
  }
  return fallback;
}

async function executeQuery(command: PortHelperCommand): Promise<ExecuteResult> {
  try {
    const records = await queryConnections(command);
    const hasPort = command.port !== null;
    const hasPid = command.pid !== null;
    let message = `共检测到 ${records.length} 条端口占用记录`;
    if (hasPort && hasPid) {
      message =
        records.length > 0
          ? `端口 ${command.port} / PID ${command.pid} 检测到 ${records.length} 条占用记录`
          : `端口 ${command.port} / PID ${command.pid} 当前未检测到占用`;
    } else if (hasPort) {
      message =
        records.length > 0
          ? `端口 ${command.port} 检测到 ${records.length} 条占用记录`
          : `端口 ${command.port} 当前未被占用`;
    } else if (hasPid) {
      message =
        records.length > 0
          ? `PID ${command.pid} 检测到 ${records.length} 条端口占用记录`
          : `PID ${command.pid} 当前无端口占用`;
    }

    let infoText = `查询全部完成，${records.length} 条记录`;
    if (hasPort && hasPid) {
      infoText = `按端口 ${command.port} + PID ${command.pid} 查询完成，${records.length} 条记录`;
    } else if (hasPort) {
      infoText = `按端口 ${command.port} 查询完成，${records.length} 条记录`;
    } else if (hasPid) {
      infoText = `按 PID ${command.pid} 查询完成，${records.length} 条记录`;
    }

    if (hasPid && records.length === 0) {
      const processName = await getProcessNameByPid(command.pid!);
      if (processName) {
        message = `PID ${command.pid}（${processName}）存在，但当前没有 TCP/UDP 端口占用`;
        infoText = `PID ${command.pid} 进程存在，当前无网络连接记录`;
      } else {
        message = `PID ${command.pid} 未查询到活动网络占用`;
        infoText = `PID ${command.pid} 可能已退出，或当前无权限读取`;
      }
    }
    return {
      ok: true,
      keepOpen: true,
      message,
      data: {
        port: command.port,
        pid: command.pid,
        protocol: command.protocol,
        records,
        info: infoText
      }
    };
  } catch (error) {
    return {
      ok: false,
      keepOpen: true,
      message: `端口查询失败: ${normalizeExecError(error, "未知错误")}`,
      data: {
        port: command.port,
        pid: command.pid,
        protocol: command.protocol,
        records: []
      }
    };
  }
}

async function executeKill(command: PortHelperCommand): Promise<ExecuteResult> {
  if (command.port === null && command.pid === null) {
    return {
      ok: false,
      keepOpen: true,
      message: "请至少输入端口或 PID",
      data: {
        port: null,
        protocol: command.protocol,
        records: []
      }
    };
  }

  let targetPid = command.pid;
  let records: PortConnection[] = [];
  try {
    records = await queryConnections(command);
  } catch {
    records = [];
  }

  if (targetPid === null) {
    const pidSet = [...new Set(records.map((item) => item.pid))];
    if (pidSet.length === 0) {
      return {
        ok: false,
        keepOpen: true,
        message: `端口 ${command.port ?? "未知"} 未查询到可结束的进程`,
        data: {
          port: command.port,
          protocol: command.protocol,
          records
        }
      };
    }
    if (pidSet.length > 1) {
      return {
        ok: false,
        keepOpen: true,
        message: `端口 ${command.port ?? "未知"} 存在多个 PID，请手动指定要结束的 PID`,
        data: {
          port: command.port,
          protocol: command.protocol,
          records
        }
      };
    }
    targetPid = pidSet[0] ?? null;
  }

  if (targetPid === null) {
    return {
      ok: false,
      keepOpen: true,
      message: "未找到可结束的 PID",
      data: {
        port: command.port,
        protocol: command.protocol,
        records
      }
    };
  }

  try {
    await runCommand("taskkill", ["/PID", String(targetPid), "/F"]);
  } catch (error) {
    return {
      ok: false,
      keepOpen: true,
      message: `结束进程失败: ${normalizeExecError(error, "请确认权限")}`,
      data: {
        port: command.port,
        protocol: command.protocol,
        pid: targetPid,
        records
      }
    };
  }

  const refreshCommand: PortHelperCommand = {
    ...command,
    action: "query",
    pid: null
  };
  let refreshed: PortConnection[] = [];
  if (command.port !== null) {
    try {
      refreshed = await queryConnections(refreshCommand);
    } catch {
      refreshed = [];
    }
  }

  return {
    ok: true,
    keepOpen: true,
    message: `已结束 PID ${targetPid}`,
    data: {
      port: command.port,
      protocol: command.protocol,
      pid: targetPid,
      records: refreshed,
      info: `已结束 PID ${targetPid}`
    }
  };
}

export const webtoolsPortHelperPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "端口助手",
  createCatalogItems() {
    return [
      createCatalogItem({
        action: ACTION_OPEN,
        port: DEFAULT_PORT,
        protocol: DEFAULT_PROTOCOL,
        pid: null
      })
    ];
  },
  getQueryItems(query) {
    if (!matchesAlias(query)) {
      return [];
    }
    const preset = parseQueryPreset(query) ?? {
      action: ACTION_OPEN,
      port: DEFAULT_PORT,
      protocol: DEFAULT_PROTOCOL,
      pid: null
    };
    return [
      createCatalogItem(preset),
      {
        id: `plugin:${PLUGIN_ID}:query:${preset.port ?? "none"}:${preset.protocol}`,
        type: "command",
        title: "端口助手（查询）",
        subtitle:
          preset.port !== null
            ? `预设端口 ${preset.port} · ${preset.protocol.toUpperCase()}`
            : "输入端口或 PID 后查询占用",
        iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
        target: buildTarget({ ...preset, action: "open" }),
        keywords: ["plugin", "port", "pid", "端口", "占用"]
      }
    ];
  },
  async execute(optionsText, context): Promise<ExecuteResult> {
    const command = parseCommand(optionsText);

    if (command.action === ACTION_OPEN) {
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: PLUGIN_ID,
        title: "端口助手",
        subtitle: "查看端口占用、定位进程并释放端口",
        data: {
          port: command.port,
          protocol: command.protocol,
          pid: command.pid
        }
      });
      return {
        ok: true,
        keepOpen: true,
        message: "已打开端口助手"
      };
    }

    if (command.action === "kill") {
      return executeKill(command);
    }

    return executeQuery(command);
  }
};
