import { createHmac, timingSafeEqual } from "node:crypto";

import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type JwtAction = "open" | "parse" | "sign" | "verify";

interface JwtCommand {
  action: JwtAction;
  token: string;
  header: string;
  payload: string;
  secret: string;
}

const PLUGIN_ID = "webtools-jwt";
const ACTION_OPEN: JwtAction = "open";
const QUERY_ALIASES = ["wt-jwt", "jwt-tool", "jwt", "token", "鉴权"];
const DEFAULT_SECRET = "your-256-bit-secret";

function buildTarget(command: JwtCommand): string {
  const params = new URLSearchParams();
  params.set("action", command.action);
  params.set("token", command.token);
  params.set("header", command.header);
  params.set("payload", command.payload);
  params.set("secret", command.secret);
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseCommand(optionsText: string | undefined): JwtCommand {
  if (!optionsText) {
    return {
      action: ACTION_OPEN,
      token: "",
      header: "",
      payload: "",
      secret: DEFAULT_SECRET
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();
  const action: JwtAction =
    actionRaw === "parse" || actionRaw === "sign" || actionRaw === "verify"
      ? actionRaw
      : ACTION_OPEN;

  return {
    action,
    token: params.get("token") ?? "",
    header: params.get("header") ?? "",
    payload: params.get("payload") ?? "",
    secret: params.get("secret") ?? DEFAULT_SECRET
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
    title: "JWT 工具",
    subtitle: "Token 解析、签名与校验（HS256）",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget({
      action: ACTION_OPEN,
      token: "",
      header: "",
      payload: "",
      secret: DEFAULT_SECRET
    }),
    keywords: ["plugin", "webtools", "jwt", "token", "鉴权", "hs256"]
  };
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad ? `${normalized}${"=".repeat(4 - pad)}` : normalized;
  return Buffer.from(padded, "base64").toString("utf8");
}

function signHs256(data: string, secret: string): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(data);
  return hmac
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function parseToken(token: string): { header: string; payload: string; signature: string } {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    throw new Error("JWT 必须是 3 段格式");
  }

  const headerPart = parts[0] ?? "";
  const payloadPart = parts[1] ?? "";
  const signaturePart = parts[2] ?? "";

  const header = base64UrlDecode(headerPart);
  const payload = base64UrlDecode(payloadPart);

  return {
    header,
    payload,
    signature: signaturePart
  };
}

function safePrettyJson(input: string): string {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed, null, 2);
}

function executeParse(command: JwtCommand): ExecuteResult {
  try {
    if (!command.token.trim()) {
      throw new Error("请输入 JWT Token");
    }

    const parts = command.token.trim().split(".");
    if (parts.length === 5) {
      return {
        ok: true,
        keepOpen: true,
        message: "已识别为 JWE（当前仅支持显示头部）",
        data: {
          token: command.token,
          header: safePrettyJson(base64UrlDecode(parts[0] ?? "")),
          payload: "",
          verified: false,
          info: "JWE 解密暂不支持，请先使用 JWS/HS256"
        }
      };
    }

    const parsed = parseToken(command.token);

    return {
      ok: true,
      keepOpen: true,
      message: "JWT 解析完成",
      data: {
        token: command.token,
        header: safePrettyJson(parsed.header),
        payload: safePrettyJson(parsed.payload),
        verified: null,
        info: "已解析 Header/Payload"
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "解析失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: {
        token: command.token,
        header: command.header,
        payload: command.payload,
        verified: false
      }
    };
  }
}

function executeSign(command: JwtCommand): ExecuteResult {
  try {
    if (!command.secret.trim()) {
      throw new Error("签名需要 Secret");
    }

    const headerObject = command.header.trim()
      ? JSON.parse(command.header)
      : { alg: "HS256", typ: "JWT" };
    const payloadObject = command.payload.trim() ? JSON.parse(command.payload) : {};

    if ((headerObject.alg ?? "HS256") !== "HS256") {
      throw new Error("当前只支持 HS256 算法");
    }

    headerObject.alg = "HS256";
    headerObject.typ = headerObject.typ ?? "JWT";

    const headerJson = JSON.stringify(headerObject);
    const payloadJson = JSON.stringify(payloadObject);

    const headerPart = base64UrlEncode(headerJson);
    const payloadPart = base64UrlEncode(payloadJson);
    const signingInput = `${headerPart}.${payloadPart}`;
    const signature = signHs256(signingInput, command.secret);
    const token = `${signingInput}.${signature}`;

    return {
      ok: true,
      keepOpen: true,
      message: "JWT 签名完成",
      data: {
        token,
        header: JSON.stringify(headerObject, null, 2),
        payload: JSON.stringify(payloadObject, null, 2),
        verified: true,
        info: "HS256 签名成功"
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "签名失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: {
        token: command.token,
        header: command.header,
        payload: command.payload,
        verified: false
      }
    };
  }
}

function executeVerify(command: JwtCommand): ExecuteResult {
  try {
    if (!command.secret.trim()) {
      throw new Error("校验需要 Secret");
    }
    if (!command.token.trim()) {
      throw new Error("请输入 JWT Token");
    }

    const parts = command.token.trim().split(".");
    if (parts.length !== 3) {
      throw new Error("仅支持 JWS 三段 Token 校验");
    }

    const signingInput = `${parts[0] ?? ""}.${parts[1] ?? ""}`;
    const expected = signHs256(signingInput, command.secret);
    const actual = parts[2] ?? "";

    const expectedBuffer = Buffer.from(expected, "utf8");
    const actualBuffer = Buffer.from(actual, "utf8");
    const verified =
      expectedBuffer.length === actualBuffer.length &&
      timingSafeEqual(expectedBuffer, actualBuffer);

    const parsed = parseToken(command.token);

    return {
      ok: verified,
      keepOpen: true,
      message: verified ? "JWT 签名校验通过" : "JWT 签名校验失败",
      data: {
        token: command.token,
        header: safePrettyJson(parsed.header),
        payload: safePrettyJson(parsed.payload),
        verified,
        info: verified ? "HS256 验签通过" : "签名与 Secret 不匹配"
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "校验失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: {
        token: command.token,
        header: command.header,
        payload: command.payload,
        verified: false
      }
    };
  }
}

function executeCommand(command: JwtCommand): ExecuteResult {
  if (command.action === "parse") {
    return executeParse(command);
  }

  if (command.action === "sign") {
    return executeSign(command);
  }

  return executeVerify(command);
}

export const webtoolsJwtPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "JWT 工具",
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
        title: "JWT 工具",
        subtitle: "Token 解析、签名与校验（HS256）",
        data: {
          token: command.token,
          header: command.header,
          payload: command.payload,
          secret: command.secret || DEFAULT_SECRET
        }
      });
      return {
        ok: true,
        keepOpen: true,
        message: "已打开 JWT 工具"
      };
    }

    return executeCommand(command);
  }
};
