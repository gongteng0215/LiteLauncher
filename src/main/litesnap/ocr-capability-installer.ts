import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  LITESNAP_OCR_CAPABILITY_DEFAULTS,
  type LiteSnapOcrCapabilitiesResult,
  type LiteSnapOcrCapabilityInfo,
  type LiteSnapOcrCapabilityInstallResult,
  type LiteSnapOcrCapabilityLanguage
} from "../../shared/litesnap-ocr-help";

type RawWindowsCapability = {
  Name?: string;
  State?: string;
};

const SUPPORTED_LANGUAGES: LiteSnapOcrCapabilityLanguage[] = ["zh-CN", "en-US"];
const CANCEL_MARKER = "__LL_OCR_INSTALL_CANCEL__";
const SUCCESS_MARKER = "__LL_OCR_INSTALL_OK__";
const LIST_CAPABILITY_TIMEOUT_MS = 20_000;
const LIST_CAPABILITY_CACHE_TTL_MS = 60_000;

let listCapabilitiesInFlight: Promise<LiteSnapOcrCapabilitiesResult> | null =
  null;
let listCapabilitiesCache:
  | { fetchedAt: number; result: LiteSnapOcrCapabilitiesResult }
  | null = null;

function escapeForPowerShellSingleQuote(value: string): string {
  return value.replace(/'/g, "''");
}

function runPowerShellFile(
  scriptPath: string,
  options: { timeoutMs?: number } = {}
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    const child = spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath
      ],
      {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"]
      }
    );

    const timeoutMs = options.timeoutMs ?? 120_000;
    const timer = setTimeout(() => {
      child.kill();
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.once("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });
    child.once("error", () => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code: 1 });
    });
  });
}

function writeTempPowerShellScript(
  prefix: string,
  lines: string[]
): string {
  const filePath = path.join(
    os.tmpdir(),
    `litelauncher-${prefix}-${process.pid}-${Date.now()}.ps1`
  );
  fs.writeFileSync(filePath, `${lines.join("\r\n")}\r\n`, { encoding: "utf8" });
  return filePath;
}

function deleteTempFile(filePath: string): void {
  try {
    fs.unlinkSync(filePath);
  } catch {
    // ignore cleanup errors
  }
}

function parseCapabilityRows(stdout: string): RawWindowsCapability[] {
  const trimmed = stdout.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed) as
      | RawWindowsCapability
      | RawWindowsCapability[];
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function resolveLanguageTag(
  capabilityName: string
): LiteSnapOcrCapabilityLanguage | null {
  const match = capabilityName.match(/Language\.OCR~~~([^~]+)~/i);
  if (!match?.[1]) {
    return null;
  }

  const tag = match[1];
  if (tag.toLowerCase().startsWith("zh")) {
    return "zh-CN";
  }
  if (tag.toLowerCase().startsWith("en")) {
    return "en-US";
  }
  return null;
}

function isInstalledState(state: string): boolean {
  return state.trim().toLowerCase() === "installed";
}

function buildCapabilityInfo(
  languageTag: LiteSnapOcrCapabilityLanguage,
  capabilityName: string,
  state: string
): LiteSnapOcrCapabilityInfo {
  return {
    languageTag,
    capabilityName,
    state,
    installed: isInstalledState(state)
  };
}

function mergeCapabilityInfos(
  rows: RawWindowsCapability[]
): LiteSnapOcrCapabilityInfo[] {
  const byLanguage = new Map<LiteSnapOcrCapabilityLanguage, LiteSnapOcrCapabilityInfo>();

  for (const row of rows) {
    const name = typeof row.Name === "string" ? row.Name.trim() : "";
    const state = typeof row.State === "string" ? row.State.trim() : "Unknown";
    if (!name) {
      continue;
    }

    const languageTag = resolveLanguageTag(name);
    if (!languageTag) {
      continue;
    }

    const next = buildCapabilityInfo(languageTag, name, state);
    const current = byLanguage.get(languageTag);
    if (!current || (next.installed && !current.installed)) {
      byLanguage.set(languageTag, next);
    }
  }

  for (const languageTag of SUPPORTED_LANGUAGES) {
    if (byLanguage.has(languageTag)) {
      continue;
    }
    byLanguage.set(
      languageTag,
      buildCapabilityInfo(
        languageTag,
        LITESNAP_OCR_CAPABILITY_DEFAULTS[languageTag],
        "NotPresent"
      )
    );
  }

  return SUPPORTED_LANGUAGES.map((tag) => byLanguage.get(tag)!);
}

export function invalidateLiteSnapOcrCapabilityCache(): void {
  listCapabilitiesCache = null;
}

async function listLiteSnapOcrCapabilitiesInternal(): Promise<LiteSnapOcrCapabilitiesResult> {
  if (process.platform !== "win32") {
    return {
      ok: false,
      message: "OCR 语言包安装仅支持 Windows。",
      capabilities: []
    };
  }

  const listScriptPath = writeTempPowerShellScript("ocr-list", [
    "$ErrorActionPreference = 'SilentlyContinue'",
    "$items = @(Get-WindowsCapability -Online | Where-Object { $_.Name -like 'Language.OCR*' })",
    "if ($items.Count -eq 0) {",
    "  $items = @(Get-WindowsCapability | Where-Object { $_.Name -like 'Language.OCR*' })",
    "}",
    "if ($items.Count -eq 0) { Write-Output '[]'; exit 0 }",
    "$items | Select-Object Name, State | ConvertTo-Json -Compress"
  ]);

  try {
    const result = await runPowerShellFile(listScriptPath, {
      timeoutMs: LIST_CAPABILITY_TIMEOUT_MS
    });
    if (result.code !== 0 && !result.stdout.trim()) {
      return {
        ok: false,
        message:
          result.stderr.trim() ||
          "无法读取 Windows OCR 组件状态（需要 Windows 10/11 且支持 Get-WindowsCapability）。",
        capabilities: mergeCapabilityInfos([])
      };
    }

    const capabilities = mergeCapabilityInfos(parseCapabilityRows(result.stdout));
    return {
      ok: true,
      message: "已读取系统 OCR 组件状态。",
      capabilities
    };
  } finally {
    deleteTempFile(listScriptPath);
  }
}

export async function listLiteSnapOcrCapabilities(options?: {
  force?: boolean;
}): Promise<LiteSnapOcrCapabilitiesResult> {
  if (process.platform !== "win32") {
    return {
      ok: false,
      message: "OCR 语言包安装仅支持 Windows。",
      capabilities: []
    };
  }

  const now = Date.now();
  if (
    !options?.force &&
    listCapabilitiesCache &&
    now - listCapabilitiesCache.fetchedAt < LIST_CAPABILITY_CACHE_TTL_MS
  ) {
    return listCapabilitiesCache.result;
  }

  if (listCapabilitiesInFlight) {
    return listCapabilitiesInFlight;
  }

  listCapabilitiesInFlight = listLiteSnapOcrCapabilitiesInternal()
    .then((result) => {
      if (result.ok) {
        listCapabilitiesCache = { fetchedAt: Date.now(), result };
      }
      return result;
    })
    .finally(() => {
      listCapabilitiesInFlight = null;
    });

  return listCapabilitiesInFlight;
}

function buildInstallScriptLines(capabilityNames: string[]): string[] {
  const lines = ["$ErrorActionPreference = 'Stop'"];
  for (const name of capabilityNames) {
    lines.push(
      `Add-WindowsCapability -Online -Name '${escapeForPowerShellSingleQuote(name)}'`
    );
  }
  lines.push(`Write-Output '${SUCCESS_MARKER}'`);
  return lines;
}

async function runElevatedPowerShellFile(
  targetScriptPath: string
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  const safeTarget = escapeForPowerShellSingleQuote(targetScriptPath);
  const launcherScriptPath = writeTempPowerShellScript("ocr-elevate", [
    "$ErrorActionPreference = 'Stop'",
    "try {",
    `  $target = '${safeTarget}'`,
    "  $argumentList = @(",
    "    '-NoProfile',",
    "    '-NonInteractive',",
    "    '-ExecutionPolicy', 'Bypass',",
    "    '-File',",
    "    $target",
    "  )",
    "  $process = Start-Process -FilePath 'powershell.exe' -Verb RunAs -Wait -PassThru -ArgumentList $argumentList",
    "  if ($null -eq $process) { exit 1 }",
    "  exit $process.ExitCode",
    "} catch {",
    '  if ($_.Exception.Message -match "canceled") {',
    `    Write-Output '${CANCEL_MARKER}'`,
    "    exit 2",
    "  }",
    "  Write-Error $_.Exception.Message",
    "  exit 1",
    "}"
  ]);

  try {
    return await runPowerShellFile(launcherScriptPath, { timeoutMs: 1_800_000 });
  } finally {
    deleteTempFile(launcherScriptPath);
  }
}

function resolveCapabilityNamesToInstall(
  languages: LiteSnapOcrCapabilityLanguage[],
  capabilities: LiteSnapOcrCapabilityInfo[]
): string[] {
  const selected = languages.length > 0 ? languages : SUPPORTED_LANGUAGES;
  const names: string[] = [];

  for (const languageTag of selected) {
    const info =
      capabilities.find((cap) => cap.languageTag === languageTag) ??
      buildCapabilityInfo(
        languageTag,
        LITESNAP_OCR_CAPABILITY_DEFAULTS[languageTag],
        "NotPresent"
      );
    if (!info.installed) {
      names.push(info.capabilityName);
    }
  }

  return names;
}

export async function installLiteSnapOcrCapabilities(
  languages: LiteSnapOcrCapabilityLanguage[] = SUPPORTED_LANGUAGES
): Promise<LiteSnapOcrCapabilityInstallResult> {
  if (process.platform !== "win32") {
    return {
      ok: false,
      message: "OCR 语言包安装仅支持 Windows。",
      capabilities: []
    };
  }

  const listed = await listLiteSnapOcrCapabilities();
  const capabilityNames = resolveCapabilityNamesToInstall(
    languages,
    listed.capabilities
  );

  if (capabilityNames.length === 0) {
    return {
      ok: true,
      message: "中文/英文 OCR 组件已安装，无需重复安装。请重启 LiteLauncher 后检测。",
      capabilities: listed.capabilities
    };
  }

  invalidateLiteSnapOcrCapabilityCache();

  const installScriptPath = writeTempPowerShellScript(
    "ocr-install",
    buildInstallScriptLines(capabilityNames)
  );

  try {
    const result = await runElevatedPowerShellFile(installScriptPath);
    const combined = `${result.stdout}\n${result.stderr}`.trim();
    invalidateLiteSnapOcrCapabilityCache();
    const refreshed = await listLiteSnapOcrCapabilities({ force: true });

    if (combined.includes(CANCEL_MARKER) || result.code === 2) {
      return {
        ok: false,
        cancelled: true,
        message: "已取消管理员授权，未安装 OCR 语言包。",
        capabilities: refreshed.capabilities
      };
    }

    if (result.code !== 0 || !combined.includes(SUCCESS_MARKER)) {
      return {
        ok: false,
        message:
          combined ||
          "OCR 语言包安装失败。请确认已授予管理员权限，且系统支持 Add-WindowsCapability。",
        capabilities: refreshed.capabilities
      };
    }

    const allInstalled =
      resolveCapabilityNamesToInstall(languages, refreshed.capabilities).length ===
      0;

    return {
      ok: allInstalled,
      message: allInstalled
        ? "OCR 语言包安装完成。请重启 LiteLauncher，再点「检测 OCR」。"
        : "安装命令已执行，但部分 OCR 组件仍未就绪。请重启电脑后再检测。",
      capabilities: refreshed.capabilities
    };
  } finally {
    deleteTempFile(installScriptPath);
  }
}
