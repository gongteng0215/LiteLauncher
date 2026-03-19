import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type ApiAction = "open" | "request";
type BodyType = "json" | "text" | "formdata";

interface ApiRow {
  key: string;
  value: string;
  enabled: boolean;
}

interface ApiCommand {
  action: ApiAction;
  method: string;
  url: string;
  params: ApiRow[];
  headers: ApiRow[];
  bodyType: BodyType;
  bodyContent: string;
  formRows: ApiRow[];
}

const PLUGIN_ID = "webtools-api-client";
const ACTION_OPEN: ApiAction = "open";
const QUERY_ALIASES = ["wt-api", "api-tool", "api", "http", "请求调试"];
const DEFAULT_URL = "https://jsonplaceholder.typicode.com/posts/1";

function buildTarget(command: ApiCommand): string {
  const params = new URLSearchParams();
  params.set("action", command.action);
  params.set("method", command.method);
  params.set("url", command.url);
  params.set("params", JSON.stringify(command.params));
  params.set("headers", JSON.stringify(command.headers));
  params.set("bodyType", command.bodyType);
  params.set("bodyContent", command.bodyContent);
  params.set("formRows", JSON.stringify(command.formRows));
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeRows(value: unknown): ApiRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const rows: ApiRow[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") {
      continue;
    }

    const record = row as Record<string, unknown>;
    rows.push({
      key: typeof record.key === "string" ? record.key : "",
      value: typeof record.value === "string" ? record.value : "",
      enabled: typeof record.enabled === "boolean" ? record.enabled : true
    });
  }
  return rows;
}

function parseBodyType(raw: string | null): BodyType {
  const value = (raw ?? "json").trim().toLowerCase();
  if (value === "text" || value === "formdata") {
    return value;
  }
  return "json";
}

function parseCommand(optionsText: string | undefined): ApiCommand {
  if (!optionsText) {
    return {
      action: ACTION_OPEN,
      method: "GET",
      url: DEFAULT_URL,
      params: [{ key: "", value: "", enabled: true }],
      headers: [
        { key: "Content-Type", value: "application/json", enabled: true },
        { key: "", value: "", enabled: true }
      ],
      bodyType: "json",
      bodyContent: '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}',
      formRows: [{ key: "", value: "", enabled: true }]
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();

  return {
    action: actionRaw === "request" ? "request" : ACTION_OPEN,
    method: (params.get("method") ?? "GET").trim().toUpperCase(),
    url: (params.get("url") ?? DEFAULT_URL).trim(),
    params: normalizeRows(safeJsonParse<unknown>(params.get("params"), [])),
    headers: normalizeRows(safeJsonParse<unknown>(params.get("headers"), [])),
    bodyType: parseBodyType(params.get("bodyType")),
    bodyContent: params.get("bodyContent") ?? "",
    formRows: normalizeRows(safeJsonParse<unknown>(params.get("formRows"), []))
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
    title: "API 调试",
    subtitle: "HTTP 请求构建与响应查看",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(parseCommand(undefined)),
    keywords: ["plugin", "webtools", "api", "http", "request", "调试"]
  };
}

function filterEnabledRows(rows: ApiRow[]): ApiRow[] {
  return rows.filter((row) => row.enabled && row.key.trim());
}

function ensureUrl(raw: string): URL {
  try {
    return new URL(raw);
  } catch {
    return new URL(`https://${raw}`);
  }
}

function formatBodyText(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function executeRequest(command: ApiCommand): Promise<ExecuteResult> {
  let timeout: NodeJS.Timeout | null = null;
  try {
    if (!command.url.trim()) {
      throw new Error("请输入请求 URL");
    }

    const requestUrl = ensureUrl(command.url.trim());
    for (const row of filterEnabledRows(command.params)) {
      requestUrl.searchParams.set(row.key, row.value);
    }
    const method = command.method.toUpperCase();
    const headers = new Headers();
    for (const row of filterEnabledRows(command.headers)) {
      if (row.key.toLowerCase() === "content-type") {
        continue;
      }
      headers.set(row.key, row.value);
    }

    const init: RequestInit = {
      method,
      headers
    };

    if (!["GET", "HEAD"].includes(method)) {
      if (command.bodyType === "json" && command.bodyContent.trim()) {
        headers.set("Content-Type", "application/json");
        init.body = command.bodyContent;
      } else if (command.bodyType === "text" && command.bodyContent.trim()) {
        headers.set("Content-Type", "text/plain");
        init.body = command.bodyContent;
      } else if (command.bodyType === "formdata") {
        const form = new FormData();
        for (const row of filterEnabledRows(command.formRows)) {
          form.append(row.key, row.value);
        }
        init.body = form;
      }
    }

    const controller = new AbortController();
    init.signal = controller.signal;
    timeout = setTimeout(() => controller.abort(), 30_000);

    const start = Date.now();
    const response = await fetch(requestUrl.toString(), init);
    const duration = Date.now() - start;
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }

    const text = await response.text();
    const size = Buffer.byteLength(text, "utf8");
    const formattedBody = formatBodyText(text);
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      ok: response.ok,
      keepOpen: true,
      message: `请求完成: ${response.status} ${response.statusText}`,
      data: {
        status: response.status,
        statusText: response.statusText,
        timeMs: duration,
        size,
        sizeText: formatSize(size),
        headers: responseHeaders,
        body: formattedBody,
        fullUrl: requestUrl.toString()
      }
    };
  } catch (error) {
    if (timeout) {
      clearTimeout(timeout);
    }
    const reason = error instanceof Error ? error.message : "请求失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: {
        status: 0,
        statusText: "",
        timeMs: 0,
        size: 0,
        sizeText: "0 B",
        headers: {},
        body: "",
        fullUrl: command.url
      }
    };
  }
}

export const webtoolsApiClientPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "API 调试",
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
        title: "API 调试",
        subtitle: "HTTP 请求构建与响应查看",
        data: {
          method: command.method,
          url: command.url,
          params: command.params,
          headers: command.headers,
          bodyType: command.bodyType,
          bodyContent: command.bodyContent,
          formRows: command.formRows
        }
      });

      return {
        ok: true,
        keepOpen: true,
        message: "已打开 API 调试"
      };
    }

    return executeRequest(command);
  }
};
