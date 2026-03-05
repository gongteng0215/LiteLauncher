import {
  createCipheriv,
  createDecipheriv,
  createHash,
  generateKeyPairSync,
  privateDecrypt,
  publicEncrypt
} from "node:crypto";

import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type CryptoAction = "open" | "process" | "generateKeys";
type CryptoMode = "encrypt" | "decrypt";

type CryptoAlgorithm =
  | "MD5"
  | "SHA1"
  | "SHA256"
  | "SHA512"
  | "AES"
  | "DES"
  | "Base64"
  | "URL"
  | "RSA"
  | "Ed25519";

interface CryptoCommand {
  action: CryptoAction;
  algorithm: CryptoAlgorithm;
  mode: CryptoMode;
  input: string;
  secretKey: string;
  iv: string;
  publicKey: string;
  privateKey: string;
  rsaBits: number;
}

const PLUGIN_ID = "webtools-crypto";
const ACTION_OPEN: CryptoAction = "open";
const ACTION_GENERATE_KEYS: CryptoAction = "generateKeys";
const QUERY_ALIASES = ["wt-crypto", "crypto-tool", "crypto", "加密", "哈希"];

const RSA_BITS_PRESETS = [1024, 2048, 4096] as const;
const DEFAULT_RSA_BITS = 2048;

function supportsDecrypt(algorithm: CryptoAlgorithm): boolean {
  return ["AES", "DES", "Base64", "URL", "RSA"].includes(algorithm);
}

function clampRsaBits(rawValue: string | null): number {
  const parsed = Number(rawValue ?? DEFAULT_RSA_BITS);
  if (parsed === 1024 || parsed === 2048 || parsed === 4096) {
    return parsed;
  }
  return DEFAULT_RSA_BITS;
}

function buildTarget(command: CryptoCommand): string {
  const params = new URLSearchParams();
  params.set("action", command.action);
  params.set("algorithm", command.algorithm);
  params.set("mode", command.mode);
  params.set("input", command.input);
  params.set("rsaBits", String(command.rsaBits));
  if (command.secretKey) {
    params.set("secretKey", command.secretKey);
  }
  if (command.iv) {
    params.set("iv", command.iv);
  }
  if (command.publicKey) {
    params.set("publicKey", command.publicKey);
  }
  if (command.privateKey) {
    params.set("privateKey", command.privateKey);
  }
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseCommand(optionsText: string | undefined): CryptoCommand {
  if (!optionsText) {
    return {
      action: ACTION_OPEN,
      algorithm: "MD5",
      mode: "encrypt",
      input: "",
      secretKey: "",
      iv: "",
      publicKey: "",
      privateKey: "",
      rsaBits: DEFAULT_RSA_BITS
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();
  const algorithmRaw = (params.get("algorithm") ?? "MD5").trim();
  const modeRaw = (params.get("mode") ?? "encrypt").trim().toLowerCase();

  const algorithm: CryptoAlgorithm =
    algorithmRaw === "SHA1" ||
    algorithmRaw === "SHA256" ||
    algorithmRaw === "SHA512" ||
    algorithmRaw === "AES" ||
    algorithmRaw === "DES" ||
    algorithmRaw === "Base64" ||
    algorithmRaw === "URL" ||
    algorithmRaw === "RSA" ||
    algorithmRaw === "Ed25519"
      ? algorithmRaw
      : "MD5";

  const action: CryptoAction =
    actionRaw === "process"
      ? "process"
      : actionRaw === "generatekeys" || actionRaw === "generate-keys"
        ? ACTION_GENERATE_KEYS
        : ACTION_OPEN;

  const nextMode: CryptoMode =
    modeRaw === "decrypt" && supportsDecrypt(algorithm) ? "decrypt" : "encrypt";

  return {
    action,
    algorithm,
    mode: nextMode,
    input: params.get("input") ?? "",
    secretKey: params.get("secretKey") ?? "",
    iv: params.get("iv") ?? "",
    publicKey: params.get("publicKey") ?? "",
    privateKey: params.get("privateKey") ?? "",
    rsaBits: clampRsaBits(params.get("rsaBits"))
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
    title: "加密工具",
    subtitle: "哈希 / 对称加密 / RSA / Ed25519 / 编解码",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget({
      action: ACTION_OPEN,
      algorithm: "MD5",
      mode: "encrypt",
      input: "",
      secretKey: "",
      iv: "",
      publicKey: "",
      privateKey: "",
      rsaBits: DEFAULT_RSA_BITS
    }),
    keywords: [
      "plugin",
      "webtools",
      "crypto",
      "hash",
      "rsa",
      "ed25519",
      "aes",
      "des",
      "base64",
      "url",
      "加密"
    ]
  };
}

function toUtf8BufferFixed(value: string, bytes: number): Buffer {
  const source = Buffer.from(value, "utf8");
  if (source.length === bytes) {
    return source;
  }

  if (source.length > bytes) {
    return source.subarray(0, bytes);
  }

  const result = Buffer.alloc(bytes);
  source.copy(result);
  return result;
}

function encryptAes(input: string, secret: string, ivText: string): string {
  if (!secret) {
    throw new Error("AES 需要密钥");
  }

  const key = createHash("sha256").update(secret, "utf8").digest();
  const iv = toUtf8BufferFixed(ivText || "0000000000000000", 16);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  return `${cipher.update(input, "utf8", "base64")}${cipher.final("base64")}`;
}

function decryptAes(input: string, secret: string, ivText: string): string {
  if (!secret) {
    throw new Error("AES 需要密钥");
  }

  const key = createHash("sha256").update(secret, "utf8").digest();
  const iv = toUtf8BufferFixed(ivText || "0000000000000000", 16);
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  return `${decipher.update(input, "base64", "utf8")}${decipher.final("utf8")}`;
}

function encryptDes(input: string, secret: string, ivText: string): string {
  if (!secret) {
    throw new Error("DES 需要密钥");
  }

  const key = toUtf8BufferFixed(secret, 24);
  const iv = toUtf8BufferFixed(ivText || "12345678", 8);
  const cipher = createCipheriv("des-ede3-cbc", key, iv);
  return `${cipher.update(input, "utf8", "base64")}${cipher.final("base64")}`;
}

function decryptDes(input: string, secret: string, ivText: string): string {
  if (!secret) {
    throw new Error("DES 需要密钥");
  }

  const key = toUtf8BufferFixed(secret, 24);
  const iv = toUtf8BufferFixed(ivText || "12345678", 8);
  const decipher = createDecipheriv("des-ede3-cbc", key, iv);
  return `${decipher.update(input, "base64", "utf8")}${decipher.final("utf8")}`;
}

function processCrypto(command: CryptoCommand): ExecuteResult {
  if (!command.input) {
    return {
      ok: true,
      keepOpen: true,
      message: "输入为空",
      data: {
        output: "",
        algorithm: command.algorithm,
        mode: command.mode,
        info: ""
      }
    };
  }

  try {
    let output = "";
    let info = `${command.algorithm} ${command.mode === "encrypt" ? "加密" : "解密"}`;

    if (command.algorithm === "MD5") {
      output = createHash("md5").update(command.input, "utf8").digest("hex");
      info = "MD5 摘要";
    } else if (command.algorithm === "SHA1") {
      output = createHash("sha1").update(command.input, "utf8").digest("hex");
      info = "SHA1 摘要";
    } else if (command.algorithm === "SHA256") {
      output = createHash("sha256").update(command.input, "utf8").digest("hex");
      info = "SHA256 摘要";
    } else if (command.algorithm === "SHA512") {
      output = createHash("sha512").update(command.input, "utf8").digest("hex");
      info = "SHA512 摘要";
    } else if (command.algorithm === "Base64") {
      output =
        command.mode === "encrypt"
          ? Buffer.from(command.input, "utf8").toString("base64")
          : Buffer.from(command.input, "base64").toString("utf8");
    } else if (command.algorithm === "URL") {
      output =
        command.mode === "encrypt"
          ? encodeURIComponent(command.input)
          : decodeURIComponent(command.input);
    } else if (command.algorithm === "AES") {
      output =
        command.mode === "encrypt"
          ? encryptAes(command.input, command.secretKey, command.iv)
          : decryptAes(command.input, command.secretKey, command.iv);
    } else if (command.algorithm === "DES") {
      output =
        command.mode === "encrypt"
          ? encryptDes(command.input, command.secretKey, command.iv)
          : decryptDes(command.input, command.secretKey, command.iv);
    } else if (command.algorithm === "RSA") {
      if (command.mode === "encrypt") {
        if (!command.publicKey.trim()) {
          throw new Error("RSA 加密需要公钥");
        }
        output = publicEncrypt(command.publicKey, Buffer.from(command.input, "utf8")).toString(
          "base64"
        );
      } else {
        if (!command.privateKey.trim()) {
          throw new Error("RSA 解密需要私钥");
        }
        output = privateDecrypt(
          command.privateKey,
          Buffer.from(command.input, "base64")
        ).toString("utf8");
      }
    } else if (command.algorithm === "Ed25519") {
      output =
        command.mode === "decrypt"
          ? "Ed25519 不支持解密模式。"
          : "Ed25519 用于签名，不支持直接加密。";
      info = "Ed25519 仅用于签名场景";
    }

    return {
      ok: true,
      keepOpen: true,
      message: "处理完成",
      data: {
        output,
        algorithm: command.algorithm,
        mode: command.mode,
        info
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "处理失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: {
        output: "",
        algorithm: command.algorithm,
        mode: command.mode,
        info: reason
      }
    };
  }
}

function generateKeys(command: CryptoCommand): ExecuteResult {
  try {
    if (command.algorithm === "RSA") {
      const pair = generateKeyPairSync("rsa", {
        modulusLength: command.rsaBits,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" }
      });

      return {
        ok: true,
        keepOpen: true,
        message: "RSA 密钥生成完成",
        data: {
          algorithm: command.algorithm,
          rsaBits: command.rsaBits,
          publicKey: pair.publicKey,
          privateKey: pair.privateKey,
          info: `RSA ${command.rsaBits} 位密钥已生成`
        }
      };
    }

    if (command.algorithm === "Ed25519") {
      const pair = generateKeyPairSync("ed25519", {
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" }
      });

      return {
        ok: true,
        keepOpen: true,
        message: "Ed25519 密钥生成完成",
        data: {
          algorithm: command.algorithm,
          rsaBits: command.rsaBits,
          publicKey: pair.publicKey,
          privateKey: pair.privateKey,
          info: "Ed25519 密钥已生成"
        }
      };
    }

    return {
      ok: false,
      keepOpen: true,
      message: "当前算法不支持生成密钥",
      data: {
        algorithm: command.algorithm,
        rsaBits: command.rsaBits
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "生成密钥失败";
    return {
      ok: false,
      keepOpen: true,
      message: reason,
      data: {
        algorithm: command.algorithm,
        rsaBits: command.rsaBits
      }
    };
  }
}

export const webtoolsCryptoPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "加密工具",
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
        title: "加密工具",
        subtitle: "哈希 / 对称加密 / RSA / Ed25519 / 编解码",
        data: {
          algorithm: command.algorithm,
          mode: command.mode,
          input: command.input,
          secretKey: command.secretKey,
          iv: command.iv,
          publicKey: command.publicKey,
          privateKey: command.privateKey,
          rsaBits: command.rsaBits,
          rsaBitsPresets: RSA_BITS_PRESETS
        }
      });
      return {
        ok: true,
        keepOpen: true,
        message: "已打开加密工具"
      };
    }

    if (command.action === ACTION_GENERATE_KEYS) {
      return generateKeys(command);
    }

    return processCrypto(command);
  }
};
