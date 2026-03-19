import { app, BrowserWindow, clipboard, shell } from "electron";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { IPC_CHANNELS } from "../shared/channels";
import { ExecuteResult, LaunchItem } from "../shared/types";
import { executePluginCommand } from "./plugins";

const SAFE_CALC_EXPRESSION = /^[\d+\-*/().%\s]+$/;

function getWindowsPowerShellExecutable(): string {
  const windowsDir = process.env.WINDIR ?? "C:\\Windows";
  return path.join(
    windowsDir,
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe"
  );
}

function resolveWindowsCommandPath(commandName: string): string | null {
  const normalized = commandName.trim();
  if (!normalized) {
    return null;
  }

  const command =
    `(Get-Command '${normalized.replace(/'/g, "''")}' -ErrorAction SilentlyContinue | ` +
    "Select-Object -ExpandProperty Source)";

  try {
    const result = spawnSync(
      getWindowsPowerShellExecutable(),
      ["-NoProfile", "-Command", command],
      {
        encoding: "utf8",
        windowsHide: true,
        timeout: 3000
      }
    );
    if (result.error || result.status !== 0) {
      return null;
    }

    return (
      String(result.stdout ?? "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean) ?? null
    );
  } catch {
    return null;
  }
}

async function openWithSystem(target: string): Promise<ExecuteResult> {
  const openError = await shell.openPath(target);
  if (openError) {
    return { ok: false, message: openError };
  }

  return { ok: true };
}

async function openSystemCalculator(): Promise<ExecuteResult> {
  if (process.platform !== "win32") {
    return { ok: false, message: "绯荤粺璁＄畻鍣ㄤ粎鏀寔 Windows" };
  }

  const windowsDir = process.env.WINDIR ?? "C:\\Windows";
  const candidates = [
    path.join(windowsDir, "System32", "calc.exe"),
    path.join(windowsDir, "SysWOW64", "calc.exe")
  ];

  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) {
        continue;
      }
    } catch {
      continue;
    }

    const result = await openWithSystem(candidate);
    if (result.ok) {
      return result;
    }
  }

  try {
    await shell.openExternal("ms-calculator:");
    return { ok: true };
  } catch (error) {
    const reason =
      error instanceof Error && error.message ? error.message : "鏈煡閿欒";
    return {
      ok: false,
      message: `鎵撳紑绯荤粺璁＄畻鍣ㄥけ璐ワ細${reason}`
    };
  }
}

async function runPathAlias(alias: string): Promise<ExecuteResult> {
  const normalized = alias.trim();
  if (!normalized) {
    return { ok: false, message: "命令为空，无法启动" };
  }

  const executable =
    path.isAbsolute(normalized) || process.platform !== "win32"
      ? normalized
      : resolveWindowsCommandPath(normalized) ?? normalized;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: ExecuteResult): void => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(result);
    };

    try {
      const child = spawn(executable, [], {
        detached: true,
        stdio: "ignore",
        windowsHide: true
      });

      child.once("error", (error) => {
        const reason =
          error instanceof Error && error.message ? error.message : "未知错误";
        finish({ ok: false, message: `启动命令失败：${reason}` });
      });

      child.once("spawn", () => {
        child.unref();
        finish({
          ok: true,
          keepOpen: true,
          message: `已启动命令：${normalized}`
        });
      });
    } catch (error) {
      const reason =
        error instanceof Error && error.message ? error.message : "未知错误";
      finish({ ok: false, message: `启动命令失败：${reason}` });
    }
  });
}

async function openAppsFolderApp(appId: string): Promise<ExecuteResult> {
  const normalized = appId.trim();
  if (!normalized) {
    return { ok: false, message: "应用标识为空，无法启动" };
  }

  if (process.platform !== "win32") {
    return { ok: false, message: "AppsFolder 启动仅支持 Windows" };
  }

  const shellTarget = `shell:AppsFolder\\${normalized}`;
  const escapedShellTarget = escapeForPowerShellSingleQuote(shellTarget);
  const escapedAppId = escapeForPowerShellSingleQuote(normalized);
  const command =
    `$ErrorActionPreference = 'Stop';` +
    `try {` +
    `  Start-Process -FilePath '${escapedShellTarget}' -ErrorAction Stop | Out-Null;` +
    `  exit 0;` +
    `} catch {` +
    `  try {` +
    `    $apps = (New-Object -ComObject Shell.Application).Namespace('shell:AppsFolder');` +
    `    $item = $apps.ParseName('${escapedAppId}');` +
    `    if (-not $item) { throw 'AppsFolder item not found'; }` +
    `    $item.InvokeVerb('open');` +
    `    exit 0;` +
    `  } catch {` +
    `    Write-Error $_.Exception.Message;` +
    `    exit 1;` +
    `  }` +
    `}`;

  try {
    const result = spawnSync(
      getWindowsPowerShellExecutable(),
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        command
      ],
      {
        encoding: "utf8",
        windowsHide: true,
        timeout: 5000
      }
    );

    if (result.error) {
      const reason =
        result.error instanceof Error && result.error.message
          ? result.error.message
          : "未知错误";
      return { ok: false, message: `启动应用失败：${reason}` };
    }

    if (result.status !== 0) {
      const reason = String(result.stderr ?? result.stdout ?? "").trim() || "未知错误";
      return { ok: false, message: `启动应用失败：${reason}` };
    }

    return {
      ok: true,
      keepOpen: false,
      message: `已启动应用：${normalized}`
    };
  } catch (error) {
    const reason =
      error instanceof Error && error.message ? error.message : "未知错误";
    return { ok: false, message: `启动应用失败：${reason}` };
  }
}
function escapeForPowerShellSingleQuote(value: string): string {
  return value.replace(/'/g, "''");
}

async function runAsAdmin(target: string): Promise<ExecuteResult> {
  const normalized = target.trim();
  if (!normalized) {
    return { ok: false, message: "绠＄悊鍛樿繍琛屽け璐ワ細鐩爣涓虹┖" };
  }

  if (process.platform !== "win32") {
    return { ok: false, message: "绠＄悊鍛樿繍琛屼粎鏀寔 Windows" };
  }

  const safeTarget = escapeForPowerShellSingleQuote(normalized);
  const successMarker = "__LL_RUNAS_OK__";
  const cancelMarker = "__LL_RUNAS_CANCEL__";
  const command =
    `$ErrorActionPreference = 'Stop';` +
    `try {` +
    `  $process = Start-Process -FilePath '${safeTarget}' -Verb RunAs -PassThru -ErrorAction Stop;` +
    `  Write-Output '${successMarker}:' + $process.Id;` +
    `  exit 0;` +
    `} catch {` +
    `  $message = $_.Exception.Message;` +
    `  if ($message -match 'canceled by the user' -or $message -match '????????' -or $message -match '???') {` +
    `    Write-Output '${cancelMarker}';` +
    `    exit 2;` +
    `  }` +
    `  Write-Error $message;` +
    `  exit 1;` +
    `}`;

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    const title = path.basename(normalized) || normalized;

    const finish = (result: ExecuteResult): void => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(result);
    };

    try {
      const child = spawn(
        "powershell.exe",
        [
          "-NoProfile",
          "-NonInteractive",
          "-ExecutionPolicy",
          "Bypass",
          "-Command",
          command
        ],
        {
          windowsHide: true,
          stdio: ["ignore", "pipe", "pipe"]
        }
      );

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString("utf8");
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString("utf8");
      });

      child.once("error", (error) => {
        const reason =
          error instanceof Error && error.message ? error.message : "鏈煡閿欒";
        finish({
          ok: false,
          keepOpen: true,
          message: `绠＄悊鍛樿繍琛屽け璐ワ細${reason}`
        });
      });

      child.once("close", (code) => {
        const combined = `${stdout}\n${stderr}`.trim();
        if (combined.includes(cancelMarker) || code === 2) {
          finish({
            ok: false,
            keepOpen: true,
            message: `已取消管理员授权：${title}`
          });
          return;
        }

        if (combined.includes(successMarker) && code === 0) {
          finish({
            ok: true,
            keepOpen: true,
            message: `已弹出管理员授权：${title}`
          });
          return;
        }

        const reason = combined || "鏈兘鍚姩鎻愭潈杩涚▼";
        finish({
          ok: false,
          keepOpen: true,
          message: `绠＄悊鍛樿繍琛屽け璐ワ細${reason}`
        });
      });
    } catch (error) {
      const reason =
        error instanceof Error && error.message ? error.message : "鏈煡閿欒";
      finish({
        ok: false,
        keepOpen: true,
        message: `绠＄悊鍛樿繍琛屽け璐ワ細${reason}`
      });
    }
  });
}

function revealInFolder(target: string): ExecuteResult {
  const normalized = target.trim();
  if (!normalized) {
    return { ok: false, message: "鎵撳紑鎵€鍦ㄤ綅缃け璐ワ細鐩爣涓虹┖" };
  }

  if (!fs.existsSync(normalized)) {
    return { ok: false, message: "打开所在位置失败：路径不存在" };
  }

  try {
    shell.showItemInFolder(normalized);
    const title = path.basename(normalized) || normalized;
    return { ok: true, keepOpen: true, message: `宸叉墦寮€鎵€鍦ㄤ綅缃細${title}` };
  } catch (error) {
    const reason =
      error instanceof Error && error.message ? error.message : "鏈煡閿欒";
    return { ok: false, message: `鎵撳紑鎵€鍦ㄤ綅缃け璐ワ細${reason}` };
  }
}

function evaluateCalcExpression(expression: string): ExecuteResult {
  if (!expression || !SAFE_CALC_EXPRESSION.test(expression)) {
    return { ok: false, message: "琛ㄨ揪寮忎笉鍚堟硶" };
  }

  let result: unknown;
  try {
    // The regex above limits expression characters to arithmetic symbols.
    result = Function(`"use strict"; return (${expression});`)();
  } catch {
    return { ok: false, message: "表达式计算失败" };
  }

  if (typeof result !== "number" || !Number.isFinite(result)) {
    return { ok: false, message: "璁＄畻缁撴灉鏃犳晥" };
  }

  clipboard.writeText(String(result));
  return { ok: true, message: `宸插鍒剁粨鏋滐細${result}` };
}

function parseCommandTarget(target: string): { command: string; arg?: string } {
  const [prefix, command, ...rest] = target.split(":");
  if (prefix !== "command") {
    return { command: target };
  }

  return {
    command,
    arg: rest.length ? rest.join(":") : undefined
  };
}

async function handleCommand(
  target: string,
  window: BrowserWindow,
  item: LaunchItem
): Promise<ExecuteResult> {
  const { command, arg } = parseCommandTarget(target);

  if (command === "calc") {
    return evaluateCalcExpression(arg ?? "");
  }

  if (command === "calculator") {
    return openSystemCalculator();
  }

  if (command === "clip") {
    window.webContents.send(IPC_CHANNELS.openPanel, "clip");
    return { ok: true, keepOpen: true };
  }

  if (command === "settings") {
    window.webContents.send(IPC_CHANNELS.openPanel, "settings");
    return { ok: true, keepOpen: true };
  }

  if (command === "exit") {
    app.quit();
    return { ok: true };
  }

  if (command === "plugin") {
    return executePluginCommand(arg, window, item);
  }

  if (command === "runas") {
    const rawTarget = arg ?? "";
    let decodedTarget = rawTarget;
    try {
      decodedTarget = decodeURIComponent(rawTarget);
    } catch {
      decodedTarget = rawTarget;
    }
    return runAsAdmin(decodedTarget);
  }

  if (command === "reveal") {
    const rawTarget = arg ?? "";
    let decodedTarget = rawTarget;
    try {
      decodedTarget = decodeURIComponent(rawTarget);
    } catch {
      decodedTarget = rawTarget;
    }
    return revealInFolder(decodedTarget);
  }

  if (command === "path-alias") {
    const rawTarget = arg ?? "";
    let decodedTarget = rawTarget;
    try {
      decodedTarget = decodeURIComponent(rawTarget);
    } catch {
      decodedTarget = rawTarget;
    }
    return runPathAlias(decodedTarget);
  }

  if (command === "apps-folder") {
    const rawTarget = arg ?? "";
    let decodedTarget = rawTarget;
    try {
      decodedTarget = decodeURIComponent(rawTarget);
    } catch {
      decodedTarget = rawTarget;
    }
    return openAppsFolderApp(decodedTarget);
  }

  return { ok: false, message: `未知命令：${command}` };
}

export async function executeItem(
  item: LaunchItem,
  window: BrowserWindow
): Promise<ExecuteResult> {
  if (item.target.trim().toLowerCase().startsWith("command:")) {
    return handleCommand(item.target, window, item);
  }

  if (
    item.type === "application" ||
    item.type === "file" ||
    item.type === "folder"
  ) {
    return openWithSystem(item.target);
  }

  if (item.type === "web") {
    await shell.openExternal(item.target);
    return { ok: true };
  }

  if (item.type === "command") {
    return handleCommand(item.target, window, item);
  }

  return { ok: false, message: `不支持的项目类型：${item.type}` };
}




