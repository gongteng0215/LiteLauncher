import * as http from "node:http";
import { IncomingMessage, ServerResponse } from "node:http";

import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type HttpMockAction = "open" | "start" | "stop" | "status";
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
type HttpMockPhase = "stopped" | "starting" | "running" | "stopping" | "error";

interface HttpMockCommand {
  action: HttpMockAction;
  port: number;
  path: string;
  method: HttpMethod;
  statusCode: number;
  contentType: string;
  body: string;
}

interface HttpMockRuntimeState {
  running: boolean;
  phase: HttpMockPhase;
  url: string;
  port: number;
  method: HttpMethod;
  path: string;
  statusCode: number;
  contentType: string;
  body: string;
  requestCount: number;
  lastError: string;
}

const PLUGIN_ID = "webtools-http-mock";
const ACTION_OPEN: HttpMockAction = "open";
const DEFAULT_PORT = 17777;
const DEFAULT_PATH = "/mock";
const DEFAULT_METHOD: HttpMethod = "GET";
const DEFAULT_STATUS_CODE = 200;
const DEFAULT_CONTENT_TYPE = "application/json; charset=utf-8";
const DEFAULT_BODY = JSON.stringify(
  {
    ok: true,
    source: "LiteLauncher HTTP Mock",
    timestamp: "{{now}}"
  },
  null,
  2
);
const QUERY_ALIASES = ["wt-mock", "http-mock", "mock", "mock server", "接口模拟"];

let mockServer: http.Server | null = null;
let requestCount = 0;
let runtimePhase: HttpMockPhase = "stopped";
let lastRuntimeError = "";
let lifecycleQueue: Promise<void> = Promise.resolve();
let lifecycleEpoch = 0;
let currentConfig: HttpMockCommand = {
  action: "start",
  port: DEFAULT_PORT,
  path: DEFAULT_PATH,
  method: DEFAULT_METHOD,
  statusCode: DEFAULT_STATUS_CODE,
  contentType: DEFAULT_CONTENT_TYPE,
  body: DEFAULT_BODY
};

function normalizePath(pathValue: string): string {
  const trimmed = pathValue.trim();
  if (!trimmed) {
    return DEFAULT_PATH;
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function parseHttpMethod(value: string | null): HttpMethod {
  const normalized = (value ?? DEFAULT_METHOD).trim().toUpperCase();
  if (
    normalized === "GET" ||
    normalized === "POST" ||
    normalized === "PUT" ||
    normalized === "PATCH" ||
    normalized === "DELETE" ||
    normalized === "OPTIONS"
  ) {
    return normalized;
  }
  return DEFAULT_METHOD;
}

function normalizePort(value: string | null): number {
  const parsed = Number(value ?? DEFAULT_PORT);
  if (!Number.isInteger(parsed)) {
    return DEFAULT_PORT;
  }
  return Math.min(65535, Math.max(1024, parsed));
}

function normalizeStatusCode(value: string | null): number {
  const parsed = Number(value ?? DEFAULT_STATUS_CODE);
  if (!Number.isInteger(parsed)) {
    return DEFAULT_STATUS_CODE;
  }
  return Math.min(599, Math.max(100, parsed));
}

function parseCommand(optionsText: string | undefined): HttpMockCommand {
  if (!optionsText) {
    return {
      action: ACTION_OPEN,
      port: currentConfig.port,
      path: currentConfig.path,
      method: currentConfig.method,
      statusCode: currentConfig.statusCode,
      contentType: currentConfig.contentType,
      body: currentConfig.body
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();
  const action: HttpMockAction =
    actionRaw === "start" || actionRaw === "stop" || actionRaw === "status"
      ? actionRaw
      : ACTION_OPEN;

  return {
    action,
    port: normalizePort(params.get("port")),
    path: normalizePath(params.get("path") ?? currentConfig.path),
    method: parseHttpMethod(params.get("method")),
    statusCode: normalizeStatusCode(params.get("statusCode")),
    contentType: (params.get("contentType") ?? currentConfig.contentType).trim() ||
      DEFAULT_CONTENT_TYPE,
    body: params.get("body") ?? currentConfig.body
  };
}

function runtimeState(): HttpMockRuntimeState {
  const running = mockServer?.listening === true && runtimePhase === "running";
  const url = `http://127.0.0.1:${currentConfig.port}${currentConfig.path}`;
  return {
    running,
    phase: runtimePhase,
    url,
    port: currentConfig.port,
    method: currentConfig.method,
    path: currentConfig.path,
    statusCode: currentConfig.statusCode,
    contentType: currentConfig.contentType,
    body: currentConfig.body,
    requestCount,
    lastError: lastRuntimeError
  };
}

function sameRuntimeConfig(command: HttpMockCommand): boolean {
  return (
    command.port === currentConfig.port &&
    command.path === currentConfig.path &&
    command.method === currentConfig.method &&
    command.statusCode === currentConfig.statusCode &&
    command.contentType === currentConfig.contentType &&
    command.body === currentConfig.body
  );
}

function formatListenError(error: unknown, port: number): string {
  const errorCode =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  if (errorCode === "EADDRINUSE") {
    return `端口 ${port} 已被占用，请更换端口后重试`;
  }
  if (errorCode === "EACCES") {
    return `没有权限监听端口 ${port}，请更换 1024–65535 范围内的端口`;
  }
  const detail = error instanceof Error ? error.message.trim() : "未知错误";
  return `无法监听端口 ${port}：${detail || "未知错误"}`;
}

function enqueueLifecycle<T>(operation: () => Promise<T>): Promise<T> {
  const result = lifecycleQueue.then(operation, operation);
  lifecycleQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

function buildTarget(command: HttpMockCommand): string {
  const params = new URLSearchParams();
  params.set("action", command.action);
  params.set("port", String(command.port));
  params.set("path", command.path);
  params.set("method", command.method);
  params.set("statusCode", String(command.statusCode));
  params.set("contentType", command.contentType);
  params.set("body", command.body);
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

function createCatalogItem(): LaunchItem {
  const openCommand: HttpMockCommand = { ...currentConfig, action: ACTION_OPEN };
  return {
    id: `plugin:${PLUGIN_ID}`,
    type: "command",
    title: "HTTP Mock Server",
    subtitle: "本地临时接口模拟，仅监听 127.0.0.1",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(openCommand),
    keywords: ["plugin", "webtools", "http", "mock", "api", "接口", "模拟"]
  };
}

function replaceDynamicBodyTokens(body: string): string {
  return body.replaceAll("{{now}}", new Date().toISOString());
}

function handleRequest(req: IncomingMessage, res: ServerResponse): void {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.end();
    return;
  }

  const reqMethod = (req.method ?? "GET").toUpperCase();
  const reqPath = (() => {
    try {
      const parsed = new URL(req.url ?? "/", `http://127.0.0.1:${currentConfig.port}`);
      return parsed.pathname;
    } catch {
      return "/";
    }
  })();

  const matchedMethod = reqMethod === currentConfig.method;
  const matchedPath = reqPath === currentConfig.path;

  res.setHeader("Access-Control-Allow-Origin", "*");
  if (!matchedMethod || !matchedPath) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify(
        {
          ok: false,
          message: "Mock route not matched",
          expected: {
            method: currentConfig.method,
            path: currentConfig.path
          },
          received: {
            method: reqMethod,
            path: reqPath
          }
        },
        null,
        2
      )
    );
    return;
  }

  requestCount += 1;
  res.statusCode = currentConfig.statusCode;
  res.setHeader("Content-Type", currentConfig.contentType);
  res.end(replaceDynamicBodyTokens(currentConfig.body));
}

async function stopServerNow(): Promise<boolean> {
  const server = mockServer;
  if (!server) {
    runtimePhase = "stopped";
    lastRuntimeError = "";
    return false;
  }

  runtimePhase = "stopping";
  mockServer = null;
  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      resolve();
    };
    const timeout = setTimeout(() => {
      server.closeAllConnections?.();
      finish();
    }, 1200);
    timeout.unref();

    try {
      server.close(() => {
        clearTimeout(timeout);
        finish();
      });
      server.closeIdleConnections?.();
    } catch {
      clearTimeout(timeout);
      finish();
    }
  });
  runtimePhase = "stopped";
  lastRuntimeError = "";
  return true;
}

async function startServerNow(
  command: HttpMockCommand,
  expectedEpoch: number
): Promise<{ reused: boolean }> {
  if (
    mockServer?.listening === true &&
    runtimePhase === "running" &&
    sameRuntimeConfig(command)
  ) {
    return { reused: true };
  }

  await stopServerNow();
  if (expectedEpoch !== lifecycleEpoch) {
    throw new Error("HTTP Mock 启动操作已取消");
  }

  requestCount = 0;
  currentConfig = { ...command, action: "start" };
  runtimePhase = "starting";
  lastRuntimeError = "";

  const candidate = http.createServer(handleRequest);
  try {
    await new Promise<void>((resolve, reject) => {
      const handleListenError = (error: Error) => {
        candidate.off("listening", handleListening);
        reject(error);
      };
      const handleListening = () => {
        candidate.off("error", handleListenError);
        resolve();
      };
      candidate.once("error", handleListenError);
      candidate.once("listening", handleListening);
      candidate.listen(currentConfig.port, "127.0.0.1");
    });
  } catch (error) {
    mockServer = null;
    runtimePhase = "error";
    lastRuntimeError = formatListenError(error, currentConfig.port);
    try {
      candidate.close();
    } catch {
      // A failed listen has no active handle to close.
    }
    throw new Error(lastRuntimeError);
  }

  if (expectedEpoch !== lifecycleEpoch) {
    try {
      candidate.close();
      candidate.closeAllConnections?.();
    } catch {
      // The session is already being torn down.
    }
    runtimePhase = "stopped";
    throw new Error("HTTP Mock 启动操作已取消");
  }

  mockServer = candidate;
  runtimePhase = "running";
  candidate.on("close", () => {
    if (mockServer === candidate) {
      mockServer = null;
      runtimePhase = "stopped";
    }
  });
  return { reused: false };
}

function stopServer(): Promise<boolean> {
  return enqueueLifecycle(stopServerNow);
}

function startServer(command: HttpMockCommand): Promise<{ reused: boolean }> {
  const expectedEpoch = lifecycleEpoch;
  return enqueueLifecycle(() => startServerNow(command, expectedEpoch));
}

export function disposeWebtoolsHttpMockServer(): Promise<void> {
  lifecycleEpoch += 1;
  const server = mockServer;
  mockServer = null;
  runtimePhase = "stopped";
  lastRuntimeError = "";
  requestCount = 0;
  if (!server) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      resolve();
    };
    const timeout = setTimeout(finish, 500);
    timeout.unref();
    try {
      server.close(() => {
        clearTimeout(timeout);
        finish();
      });
      server.closeIdleConnections?.();
      server.closeAllConnections?.();
    } catch {
      clearTimeout(timeout);
      finish();
    }
  });
}

function createActionItems(base: HttpMockCommand): LaunchItem[] {
  const running = mockServer !== null;
  const startCommand: HttpMockCommand = { ...base, action: "start" };
  const stopCommand: HttpMockCommand = { ...base, action: "stop" };
  const statusCommand: HttpMockCommand = { ...base, action: "status" };

  return [
    {
      id: `plugin:${PLUGIN_ID}:start`,
      type: "command",
      title: running ? "重启 HTTP Mock" : "启动 HTTP Mock",
      subtitle: `监听 ${base.method} http://127.0.0.1:${base.port}${base.path}`,
      iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
      target: buildTarget(startCommand),
      keywords: ["mock", "start", "启动", "接口"]
    },
    {
      id: `plugin:${PLUGIN_ID}:status`,
      type: "command",
      title: "查看 HTTP Mock 状态",
      subtitle: running ? "当前运行中" : "当前未启动",
      iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
      target: buildTarget(statusCommand),
      keywords: ["mock", "status", "状态"]
    },
    {
      id: `plugin:${PLUGIN_ID}:stop`,
      type: "command",
      title: "停止 HTTP Mock",
      subtitle: running ? "关闭本地模拟服务" : "服务已停止",
      iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
      target: buildTarget(stopCommand),
      keywords: ["mock", "stop", "停止"]
    }
  ];
}

export const webtoolsHttpMockPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "HTTP Mock Server",
  dispose() {
    return disposeWebtoolsHttpMockServer();
  },
  createCatalogItems() {
    return [createCatalogItem()];
  },
  getQueryItems(query) {
    if (!matchesAlias(query)) {
      return [];
    }

    const base = parseCommand(undefined);
    return [createCatalogItem(), ...createActionItems({ ...base, action: "status" })];
  },
  async execute(optionsText, context): Promise<ExecuteResult> {
    const command = parseCommand(optionsText);

    if (command.action === ACTION_OPEN) {
      const state = runtimeState();
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: PLUGIN_ID,
        title: "HTTP Mock Server",
        subtitle: "配置本地临时接口；仅监听当前电脑的 127.0.0.1",
        data: {
          ...state
        }
      });

      return {
        ok: true,
        keepOpen: true,
        message: state.running
          ? `Mock 运行中：${state.method} ${state.url}`
          : "已打开 HTTP Mock，可在面板配置并启动",
        data: { ...state }
      };
    }

    if (command.action === "status") {
      const state = runtimeState();
      return {
        ok: true,
        keepOpen: true,
        message: state.running
          ? `Mock 运行中：${state.method} ${state.url}（请求 ${state.requestCount} 次）`
          : "Mock 当前未启动",
        data: { ...state }
      };
    }

    if (command.action === "stop") {
      const stopped = await stopServer();
      const state = runtimeState();
      return {
        ok: true,
        keepOpen: true,
        message: stopped ? "Mock 已停止" : "Mock 当前未启动",
        data: { ...state }
      };
    }

    try {
      const { reused } = await startServer(command);
      const state = runtimeState();
      return {
        ok: true,
        keepOpen: true,
        message: reused
          ? `Mock 已在运行：${state.method} ${state.url}`
          : `Mock 已启动：${state.method} ${state.url}`,
        data: { ...state }
      };
    } catch (error) {
      const reason =
        lastRuntimeError || (error instanceof Error ? error.message : "启动失败");
      return {
        ok: false,
        keepOpen: true,
        message: `Mock 启动失败：${reason}`,
        data: { ...runtimeState() }
      };
    }
  }
};
