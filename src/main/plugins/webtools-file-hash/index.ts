import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type HashAction = "open" | "hash";
type HashAlgorithm = "md5" | "sha1" | "sha256" | "sha512";

interface FileHashCommand {
  action: HashAction;
  filePath: string;
  algorithm: HashAlgorithm;
  expectedHash: string;
}

const PLUGIN_ID = "webtools-file-hash";
const ACTION_OPEN: HashAction = "open";
const DEFAULT_ALGORITHM: HashAlgorithm = "sha256";
const QUERY_ALIASES = [
  "wt-hash",
  "file-hash",
  "hash",
  "文件哈希",
  "哈希校验",
  "hash-check"
];

function normalizeHashAlgorithm(value: string | null): HashAlgorithm {
  const normalized = (value ?? DEFAULT_ALGORITHM).trim().toLowerCase();
  if (
    normalized === "md5" ||
    normalized === "sha1" ||
    normalized === "sha256" ||
    normalized === "sha512"
  ) {
    return normalized;
  }
  return DEFAULT_ALGORITHM;
}

function normalizeInputFilePath(value: string | null): string {
  const raw = (value ?? "").trim();
  if (!raw) {
    return "";
  }

  const quoteWrapped =
    (raw.startsWith("\"") && raw.endsWith("\"")) ||
    (raw.startsWith("'") && raw.endsWith("'"));
  if (quoteWrapped && raw.length > 1) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}

function normalizeExpectedHash(value: string): string {
  return value.trim().toLowerCase().replaceAll(/\s+/g, "");
}

function parseCommand(optionsText: string | undefined): FileHashCommand {
  if (!optionsText) {
    return {
      action: ACTION_OPEN,
      filePath: "",
      algorithm: DEFAULT_ALGORITHM,
      expectedHash: ""
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();
  const action: HashAction = actionRaw === "hash" ? "hash" : ACTION_OPEN;

  return {
    action,
    filePath: normalizeInputFilePath(params.get("filePath")),
    algorithm: normalizeHashAlgorithm(params.get("algorithm")),
    expectedHash: params.get("expectedHash") ?? ""
  };
}

function buildTarget(command: FileHashCommand): string {
  const params = new URLSearchParams();
  params.set("action", command.action);
  params.set("filePath", command.filePath);
  params.set("algorithm", command.algorithm);
  params.set("expectedHash", command.expectedHash);
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

function createCatalogItem(command: FileHashCommand): LaunchItem {
  return {
    id: `plugin:${PLUGIN_ID}`,
    type: "command",
    title: "文件哈希",
    subtitle: "MD5 / SHA1 / SHA256 / SHA512 校验",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget({ ...command, action: ACTION_OPEN }),
    keywords: [
      "plugin",
      "webtools",
      "hash",
      "checksum",
      "md5",
      "sha256",
      "文件哈希",
      "校验"
    ]
  };
}

function parseQueryPreset(query: string): FileHashCommand | null {
  const tokens = query
    .trim()
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (tokens.length === 0) {
    return null;
  }

  const first = tokens[0]?.toLowerCase() ?? "";
  if (!QUERY_ALIASES.includes(first)) {
    return null;
  }

  let algorithm = DEFAULT_ALGORITHM;
  for (const token of tokens.slice(1)) {
    const normalized = token.toLowerCase();
    if (
      normalized === "md5" ||
      normalized === "sha1" ||
      normalized === "sha256" ||
      normalized === "sha512"
    ) {
      algorithm = normalized;
      break;
    }
  }

  return {
    action: ACTION_OPEN,
    filePath: "",
    algorithm,
    expectedHash: ""
  };
}

async function calculateFileHash(
  filePath: string,
  algorithm: HashAlgorithm
): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash(algorithm);
    const stream = fs.createReadStream(filePath);

    stream.on("error", reject);
    stream.on("data", (chunk: Buffer) => {
      hash.update(chunk);
    });
    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });
  });
}

function formatFileSize(size: number): string {
  if (!Number.isFinite(size) || size < 0) {
    return "未知";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = size;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[index]}`;
}

async function executeHash(command: FileHashCommand): Promise<ExecuteResult> {
  const filePath = normalizeInputFilePath(command.filePath);
  if (!filePath) {
    return {
      ok: false,
      keepOpen: true,
      message: "请输入文件路径"
    };
  }

  const resolved = path.resolve(filePath);
  let stats: fs.Stats;
  try {
    stats = await fs.promises.stat(resolved);
  } catch {
    return {
      ok: false,
      keepOpen: true,
      message: `文件不存在: ${resolved}`,
      data: {
        filePath: resolved,
        algorithm: command.algorithm
      }
    };
  }

  if (!stats.isFile()) {
    return {
      ok: false,
      keepOpen: true,
      message: "目标不是文件，请输入文件路径",
      data: {
        filePath: resolved,
        algorithm: command.algorithm
      }
    };
  }

  try {
    const hash = await calculateFileHash(resolved, command.algorithm);
    const expectedHash = normalizeExpectedHash(command.expectedHash);
    const matched = expectedHash ? expectedHash === hash : null;

    const message =
      matched === true
        ? "哈希校验通过"
        : matched === false
          ? "哈希不匹配，请确认文件与算法"
          : "哈希计算完成";

    return {
      ok: matched !== false,
      keepOpen: true,
      message,
      data: {
        filePath: resolved,
        algorithm: command.algorithm,
        hash,
        expectedHash: command.expectedHash.trim(),
        matched,
        size: stats.size,
        mtimeMs: stats.mtimeMs,
        info: `文件大小 ${formatFileSize(stats.size)}`
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "哈希计算失败";
    return {
      ok: false,
      keepOpen: true,
      message: `哈希计算失败: ${reason}`,
      data: {
        filePath: resolved,
        algorithm: command.algorithm
      }
    };
  }
}

export const webtoolsFileHashPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "文件哈希",
  createCatalogItems() {
    return [
      createCatalogItem({
        action: ACTION_OPEN,
        filePath: "",
        algorithm: DEFAULT_ALGORITHM,
        expectedHash: ""
      })
    ];
  },
  getQueryItems(query) {
    if (!matchesAlias(query)) {
      return [];
    }

    const preset = parseQueryPreset(query) ?? {
      action: ACTION_OPEN,
      filePath: "",
      algorithm: DEFAULT_ALGORITHM,
      expectedHash: ""
    };

    return [
      createCatalogItem(preset),
      {
        id: `plugin:${PLUGIN_ID}:${preset.algorithm}`,
        type: "command",
        title: `文件哈希 (${preset.algorithm.toUpperCase()})`,
        subtitle: "输入文件路径后计算哈希并可对比期望值",
        iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
        target: buildTarget(preset),
        keywords: ["plugin", "hash", "checksum", preset.algorithm, "文件哈希"]
      }
    ];
  },
  async execute(optionsText, context): Promise<ExecuteResult> {
    const command = parseCommand(optionsText);

    if (command.action === ACTION_OPEN) {
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: PLUGIN_ID,
        title: "文件哈希",
        subtitle: "MD5 / SHA1 / SHA256 / SHA512 校验",
        data: {
          filePath: command.filePath,
          algorithm: command.algorithm,
          expectedHash: command.expectedHash
        }
      });

      return {
        ok: true,
        keepOpen: true,
        message: "已打开文件哈希"
      };
    }

    return executeHash(command);
  }
};
