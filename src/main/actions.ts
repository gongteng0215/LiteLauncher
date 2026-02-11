import { app, BrowserWindow, clipboard, shell } from "electron";

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

function evaluateCalcExpression(expression: string): ExecuteResult {
  if (!expression || !SAFE_CALC_EXPRESSION.test(expression)) {
    return { ok: false, message: "Invalid expression" };
  }

  let result: unknown;
  try {
    // The regex above limits expression characters to arithmetic symbols.
    result = Function(`"use strict"; return (${expression});`)();
  } catch {
    return { ok: false, message: "Failed to evaluate expression" };
  }

  if (typeof result !== "number" || !Number.isFinite(result)) {
    return { ok: false, message: "Invalid result" };
  }

  clipboard.writeText(String(result));
  return { ok: true, message: `Copied result: ${result}` };
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

  return { ok: false, message: `Unknown command: ${command}` };
}

export async function executeItem(
  item: LaunchItem,
  window: BrowserWindow
): Promise<ExecuteResult> {
  if (item.type === "application" || item.type === "file" || item.type === "folder") {
    return openWithSystem(item.target);
  }

  if (item.type === "web") {
    await shell.openExternal(item.target);
    return { ok: true };
  }

  if (item.type === "command") {
    return handleCommand(item.target, window, item);
  }

  return { ok: false, message: `Unsupported item type: ${item.type}` };
}
