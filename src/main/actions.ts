import { app, BrowserWindow, clipboard, shell } from "electron";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { IPC_CHANNELS } from "../shared/channels";
import { ExecuteResult, LaunchItem } from "../shared/types";
import { executePluginCommand } from "./plugins";

const SAFE_CALC_EXPRESSION = /^[\d+\-*/().%\s]+$/;

async function openWithSystem(target: string): Promise<ExecuteResult> {
  const openError = await shell.openPath(target);
  if (openError) {
    return { ok: false, message: openError };
  }

  return { ok: true };
}

async function openSystemCalculator(): Promise<ExecuteResult> {
  if (process.platform !== "win32") {
    return { ok: false, message: "系统计算器仅支持 Windows" };
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
      error instanceof Error && error.message ? error.message : "未知错误";
    return {
      ok: false,
      message: `打开系统计算器失败：${reason}`
    };
  }
}

function escapeForPowerShellSingleQuote(value: string): string {
  return value.replace(/'/g, "''");
}

async function runAsAdmin(target: string): Promise<ExecuteResult> {
  const normalized = target.trim();
  if (!normalized) {
    return { ok: false, message: "管理员运行失败：目标为空" };
  }

  if (process.platform !== "win32") {
    return { ok: false, message: "管理员运行仅支持 Windows" };
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
    `  if ($message -match 'canceled by the user' -or $message -match '操作已被用户取消' -or $message -match '已取消') {` +
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
          error instanceof Error && error.message ? error.message : "未知错误";
        finish({
          ok: false,
          keepOpen: true,
          message: `管理员运行失败：${reason}`
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

        const reason = combined || "未能启动提权进程";
        finish({
          ok: false,
          keepOpen: true,
          message: `管理员运行失败：${reason}`
        });
      });
    } catch (error) {
      const reason =
        error instanceof Error && error.message ? error.message : "未知错误";
      finish({
        ok: false,
        keepOpen: true,
        message: `管理员运行失败：${reason}`
      });
    }
  });
}

function revealInFolder(target: string): ExecuteResult {
  const normalized = target.trim();
  if (!normalized) {
    return { ok: false, message: "打开所在位置失败：目标为空" };
  }

  if (!fs.existsSync(normalized)) {
    return { ok: false, message: "打开所在位置失败：路径不存在" };
  }

  try {
    shell.showItemInFolder(normalized);
    const title = path.basename(normalized) || normalized;
    return { ok: true, keepOpen: true, message: `已打开所在位置：${title}` };
  } catch (error) {
    const reason =
      error instanceof Error && error.message ? error.message : "未知错误";
    return { ok: false, message: `打开所在位置失败：${reason}` };
  }
}

function evaluateCalcExpression(expression: string): ExecuteResult {
  if (!expression || !SAFE_CALC_EXPRESSION.test(expression)) {
    return { ok: false, message: "表达式不合法" };
  }

  let result: unknown;
  try {
    // The regex above limits expression characters to arithmetic symbols.
    result = Function(`"use strict"; return (${expression});`)();
  } catch {
    return { ok: false, message: "表达式计算失败" };
  }

  if (typeof result !== "number" || !Number.isFinite(result)) {
    return { ok: false, message: "计算结果无效" };
  }

  clipboard.writeText(String(result));
  return { ok: true, message: `已复制结果：${result}` };
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

  return { ok: false, message: `未知命令：${command}` };
}

export async function executeItem(
  item: LaunchItem,
  window: BrowserWindow
): Promise<ExecuteResult> {
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
