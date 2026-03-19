import { TextDecoder, TextEncoder } from "node:util";

import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type JwtAction = "open" | "parse" | "sign" | "verify";
type JwtMode = "jws" | "jwe";
type JwtAlgorithm = "HS256" | "RS256";
type JwtJweAlg = "dir" | "A256KW";
type JwtJweEnc = "A256GCM" | "A128GCM";

interface JwtCommand {
  action: JwtAction;
  mode: JwtMode;
  algorithm: JwtAlgorithm;
  jweAlg: JwtJweAlg;
  jweEnc: JwtJweEnc;
  token: string;
  header: string;
  payload: string;
  secret: string;
}

type JoseModule = typeof import("jose");

const PLUGIN_ID = "webtools-jwt";
const ACTION_OPEN: JwtAction = "open";
const QUERY_ALIASES = ["wt-jwt", "jwt-tool", "jwt", "token", "鉴权"];
const DEFAULT_SECRET = "your-256-bit-secret";
const DEFAULT_MODE: JwtMode = "jws";
const DEFAULT_ALGORITHM: JwtAlgorithm = "HS256";
const DEFAULT_JWE_ALG: JwtJweAlg = "dir";
const DEFAULT_JWE_ENC: JwtJweEnc = "A256GCM";

let joseModulePromise: Promise<JoseModule> | null = null;

function getJose(): Promise<JoseModule> {
  if (!joseModulePromise) {
    joseModulePromise = import("jose");
  }
  return joseModulePromise;
}

function normalizeMode(value: string | null): JwtMode {
  return value === "jwe" ? "jwe" : "jws";
}

function normalizeAlgorithm(value: string | null): JwtAlgorithm {
  return value === "RS256" ? "RS256" : "HS256";
}

function normalizeJweAlg(value: string | null): JwtJweAlg {
  return value === "A256KW" ? "A256KW" : "dir";
}

function normalizeJweEnc(value: string | null): JwtJweEnc {
  return value === "A128GCM" ? "A128GCM" : "A256GCM";
}

function buildTarget(command: JwtCommand): string {
  const params = new URLSearchParams();
  params.set("action", command.action);
  params.set("mode", command.mode);
  params.set("algorithm", command.algorithm);
  params.set("jweAlg", command.jweAlg);
  params.set("jweEnc", command.jweEnc);
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
      mode: DEFAULT_MODE,
      algorithm: DEFAULT_ALGORITHM,
      jweAlg: DEFAULT_JWE_ALG,
      jweEnc: DEFAULT_JWE_ENC,
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
    mode: normalizeMode(params.get("mode")),
    algorithm: normalizeAlgorithm(params.get("algorithm")),
    jweAlg: normalizeJweAlg(params.get("jweAlg")),
    jweEnc: normalizeJweEnc(params.get("jweEnc")),
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
    title: "JWT 调试器",
    subtitle: "JWS/JWE 解析与生成（HS256/RS256）",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget({
      action: ACTION_OPEN,
      mode: DEFAULT_MODE,
      algorithm: DEFAULT_ALGORITHM,
      jweAlg: DEFAULT_JWE_ALG,
      jweEnc: DEFAULT_JWE_ENC,
      token: "",
      header: "",
      payload: "",
      secret: DEFAULT_SECRET
    }),
    keywords: ["plugin", "webtools", "jwt", "jws", "jwe", "token", "鉴权", "hs256", "rs256"]
  };
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad ? `${normalized}${"=".repeat(4 - pad)}` : normalized;
  return Buffer.from(padded, "base64").toString("utf8");
}

function base64UrlEncode(value: Uint8Array): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function safePrettyJson(input: string): string {
  return JSON.stringify(JSON.parse(input), null, 2);
}

function pickStringValue(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  return typeof value === "string" ? value : null;
}

function normalizeSecretText(secret: string, length: number): string {
  return secret.padEnd(length, "0").slice(0, length);
}

function deriveJweDirKey(secret: string, enc: JwtJweEnc): Uint8Array {
  const required = enc === "A128GCM" ? 16 : 32;
  return new TextEncoder().encode(normalizeSecretText(secret, required));
}

async function deriveJweKwKey(secret: string): Promise<CryptoKey | Uint8Array> {
  const jose = await getJose();
  return jose.importJWK(
    {
      kty: "oct",
      alg: "A256KW",
      k: base64UrlEncode(new TextEncoder().encode(normalizeSecretText(secret, 32)))
    },
    "A256KW"
  );
}

function parseJsonObject(value: string, fallback: Record<string, unknown>): Record<string, unknown> {
  if (!value.trim()) {
    return { ...fallback };
  }
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSON 必须是对象格式");
  }
  return parsed as Record<string, unknown>;
}

function withData(
  command: JwtCommand,
  data: Partial<{
    token: string;
    header: string;
    payload: string;
    secret: string;
    mode: JwtMode;
    algorithm: JwtAlgorithm;
    jweAlg: JwtJweAlg;
    jweEnc: JwtJweEnc;
    verified: boolean | null;
    info: string;
  }>
): Record<string, unknown> {
  return {
    token: command.token,
    header: command.header,
    payload: command.payload,
    secret: command.secret,
    mode: command.mode,
    algorithm: command.algorithm,
    jweAlg: command.jweAlg,
    jweEnc: command.jweEnc,
    verified: null,
    info: "",
    ...data
  };
}

async function parseJwsToken(command: JwtCommand): Promise<ExecuteResult> {
  const parts = command.token.trim().split(".");
  if (parts.length !== 3) {
    throw new Error("JWS 必须是 3 段格式");
  }

  const headerText = safePrettyJson(base64UrlDecode(parts[0] ?? ""));
  const payloadText = safePrettyJson(base64UrlDecode(parts[1] ?? ""));
  const headerObject = JSON.parse(headerText) as Record<string, unknown>;
  const algorithm = normalizeAlgorithm(pickStringValue(headerObject, "alg"));
  const jose = await getJose();

  let verified: boolean | null = null;
  let info = "已解析 Header/Payload";
  if (command.secret.trim()) {
    try {
      if (algorithm === "HS256") {
        const secretBytes = new TextEncoder().encode(command.secret);
        await jose.jwtVerify(command.token, secretBytes, { algorithms: ["HS256"] });
      } else {
        const publicKey = await jose.importSPKI(command.secret, "RS256");
        await jose.jwtVerify(command.token, publicKey, { algorithms: ["RS256"] });
      }
      verified = true;
      info = `${algorithm} 验签通过`;
    } catch {
      verified = false;
      info = `${algorithm} 验签失败`;
    }
  }

  return {
    ok: true,
    keepOpen: true,
    message: "JWS 解析完成",
    data: withData(command, {
      token: command.token,
      header: headerText,
      payload: payloadText,
      mode: "jws",
      algorithm,
      verified,
      info
    })
  };
}

async function parseJweToken(command: JwtCommand): Promise<ExecuteResult> {
  const parts = command.token.trim().split(".");
  if (parts.length !== 5) {
    throw new Error("JWE 必须是 5 段格式");
  }

  const headerText = safePrettyJson(base64UrlDecode(parts[0] ?? ""));
  const headerObject = JSON.parse(headerText) as Record<string, unknown>;
  const jweAlg = normalizeJweAlg(pickStringValue(headerObject, "alg"));
  const jweEnc = normalizeJweEnc(pickStringValue(headerObject, "enc"));

  if (!command.secret.trim()) {
    return {
      ok: true,
      keepOpen: true,
      message: "已识别为 JWE",
      data: withData(command, {
        token: command.token,
        header: headerText,
        payload: "",
        mode: "jwe",
        jweAlg,
        jweEnc,
        verified: null,
        info: `已识别为 JWE（${jweAlg}/${jweEnc}），输入密钥后可解密`
      })
    };
  }

  const jose = await getJose();
  const key =
    jweAlg === "A256KW"
      ? await deriveJweKwKey(command.secret)
      : deriveJweDirKey(command.secret, jweEnc);
  const { plaintext } = await jose.compactDecrypt(command.token, key);
  const payloadText = safePrettyJson(new TextDecoder().decode(plaintext));

  return {
    ok: true,
    keepOpen: true,
    message: "JWE 解密完成",
    data: withData(command, {
      token: command.token,
      header: headerText,
      payload: payloadText,
      mode: "jwe",
      jweAlg,
      jweEnc,
      verified: true,
      info: `JWE 解密成功（${jweAlg}/${jweEnc}）`
    })
  };
}

async function executeParse(command: JwtCommand): Promise<ExecuteResult> {
  if (!command.token.trim()) {
    return {
      ok: true,
      keepOpen: true,
      message: "输入为空",
      data: withData(command, {
        token: "",
        header: command.header,
        payload: command.payload,
        verified: null,
        info: ""
      })
    };
  }

  const parts = command.token.trim().split(".");
  if (parts.length === 5 || command.mode === "jwe") {
    return parseJweToken(command);
  }
  return parseJwsToken(command);
}

async function executeSign(command: JwtCommand): Promise<ExecuteResult> {
  if (!command.secret.trim()) {
    throw new Error("签名/加密需要密钥");
  }

  const headerObject = parseJsonObject(command.header, { typ: "JWT" });
  const payloadObject = parseJsonObject(command.payload, {});
  const jose = await getJose();

  if (command.mode === "jwe") {
    const mergedHeader: Record<string, unknown> = {
      ...headerObject,
      typ: pickStringValue(headerObject, "typ") ?? "JWT",
      alg: command.jweAlg,
      enc: command.jweEnc
    };
    const key =
      command.jweAlg === "A256KW"
        ? await deriveJweKwKey(command.secret)
        : deriveJweDirKey(command.secret, command.jweEnc);
    const token = await new jose.EncryptJWT(payloadObject)
      .setProtectedHeader(mergedHeader as any)
      .encrypt(key);

    return {
      ok: true,
      keepOpen: true,
      message: "JWE 生成完成",
      data: withData(command, {
        token,
        header: JSON.stringify(mergedHeader, null, 2),
        payload: JSON.stringify(payloadObject, null, 2),
        mode: "jwe",
        verified: true,
        info: `JWE 生成成功（${command.jweAlg}/${command.jweEnc}）`
      })
    };
  }

  const mergedHeader: Record<string, unknown> = {
    ...headerObject,
    typ: pickStringValue(headerObject, "typ") ?? "JWT",
    alg: command.algorithm
  };

  const signingInput = new jose.SignJWT(payloadObject).setProtectedHeader(
    mergedHeader as any
  );

  const token =
    command.algorithm === "HS256"
      ? await signingInput.sign(new TextEncoder().encode(command.secret))
      : await signingInput.sign(await jose.importPKCS8(command.secret, "RS256"));

  return {
    ok: true,
    keepOpen: true,
    message: "JWS 签名完成",
    data: withData(command, {
      token,
      header: JSON.stringify(mergedHeader, null, 2),
      payload: JSON.stringify(payloadObject, null, 2),
      mode: "jws",
      verified: true,
      info: `${command.algorithm} 签名成功`
    })
  };
}

async function executeVerify(command: JwtCommand): Promise<ExecuteResult> {
  if (!command.secret.trim()) {
    throw new Error("校验/解密需要密钥");
  }
  if (!command.token.trim()) {
    throw new Error("请输入 Token");
  }

  const jose = await getJose();
  const parts = command.token.trim().split(".");

  if (parts.length === 5 || command.mode === "jwe") {
    const parsed = await parseJweToken(command);
    const data = (parsed.data ?? {}) as Record<string, unknown>;
    return {
      ...parsed,
      ok: true,
      message: "JWE 校验通过",
      data: { ...data, verified: true }
    };
  }

  if (parts.length !== 3) {
    throw new Error("JWS 必须是 3 段格式");
  }

  const headerText = safePrettyJson(base64UrlDecode(parts[0] ?? ""));
  const payloadText = safePrettyJson(base64UrlDecode(parts[1] ?? ""));
  const headerObject = JSON.parse(headerText) as Record<string, unknown>;
  const algorithm = normalizeAlgorithm(pickStringValue(headerObject, "alg") ?? command.algorithm);

  try {
    if (algorithm === "HS256") {
      await jose.jwtVerify(command.token, new TextEncoder().encode(command.secret), {
        algorithms: ["HS256"]
      });
    } else {
      const publicKey = await jose.importSPKI(command.secret, "RS256");
      await jose.jwtVerify(command.token, publicKey, { algorithms: ["RS256"] });
    }

    return {
      ok: true,
      keepOpen: true,
      message: "JWS 验签通过",
      data: withData(command, {
        token: command.token,
        header: headerText,
        payload: payloadText,
        mode: "jws",
        algorithm,
        verified: true,
        info: `${algorithm} 验签通过`
      })
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "验签失败";
    return {
      ok: false,
      keepOpen: true,
      message: "JWS 验签失败",
      data: withData(command, {
        token: command.token,
        header: headerText,
        payload: payloadText,
        mode: "jws",
        algorithm,
        verified: false,
        info: reason
      })
    };
  }
}

async function executeCommand(command: JwtCommand): Promise<ExecuteResult> {
  try {
    if (command.action === "parse") {
      return await executeParse(command);
    }
    if (command.action === "sign") {
      return await executeSign(command);
    }
    return await executeVerify(command);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "JWT 执行失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: withData(command, {
        verified: false,
        info: reason
      })
    };
  }
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
  async execute(optionsText, context): Promise<ExecuteResult> {
    const command = parseCommand(optionsText);

    if (command.action === ACTION_OPEN) {
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: PLUGIN_ID,
        title: "JWT 调试器",
        subtitle: "支持 JWS/JWE 解析与生成（HS256/RS256）",
        data: {
          token: command.token,
          header: command.header,
          payload: command.payload,
          secret: command.secret || DEFAULT_SECRET,
          mode: command.mode,
          algorithm: command.algorithm,
          jweAlg: command.jweAlg,
          jweEnc: command.jweEnc
        }
      });
      return {
        ok: true,
        keepOpen: true,
        message: "已打开 JWT 调试器"
      };
    }

    return executeCommand(command);
  }
};
