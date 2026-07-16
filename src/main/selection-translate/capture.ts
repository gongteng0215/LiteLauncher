import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { clipboard } from "electron";

const execFileAsync = promisify(execFile);

export function buildWindowsCopySelectionScript(): string {
  return [
    "$ErrorActionPreference='Stop'",
    "Add-Type -AssemblyName System.Windows.Forms",
    "[System.Windows.Forms.SendKeys]::SendWait('^c')"
  ].join("; ");
}

async function sendCopyShortcut(): Promise<boolean> {
  if (process.platform !== "win32") {
    return false;
  }

  try {
    await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        buildWindowsCopySelectionScript()
      ],
      {
        windowsHide: true,
        timeout: 2000
      }
    );
    return true;
  } catch (error) {
    console.warn("[selection-translate] SendKeys ^c failed", error);
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export interface CaptureSelectedTextOptions {
  restoreClipboard?: boolean;
  pollIntervalMs?: number;
  timeoutMs?: number;
}

export interface CaptureSelectedTextResult {
  ok: boolean;
  text: string;
  reason?: "unsupported" | "sendkeys-failed" | "unchanged" | "empty";
}

export async function captureSelectedText(
  options: CaptureSelectedTextOptions = {}
): Promise<CaptureSelectedTextResult> {
  if (process.platform !== "win32") {
    return { ok: false, text: "", reason: "unsupported" };
  }

  const restoreClipboard = options.restoreClipboard !== false;
  const pollIntervalMs = Math.max(10, options.pollIntervalMs ?? 30);
  const timeoutMs = Math.max(pollIntervalMs, options.timeoutMs ?? 400);
  const baseline = clipboard.readText();

  const sent = await sendCopyShortcut();
  if (!sent) {
    return { ok: false, text: "", reason: "sendkeys-failed" };
  }

  const deadline = Date.now() + timeoutMs;
  let captured = "";
  while (Date.now() <= deadline) {
    await sleep(pollIntervalMs);
    const current = clipboard.readText();
    if (current !== baseline && current.trim()) {
      captured = current;
      break;
    }
  }

  if (restoreClipboard) {
    // Give the foreground app a brief moment before restoring, so paste
    // consumers (if any) are less likely to race with our restore.
    await sleep(40);
    try {
      clipboard.writeText(baseline);
    } catch (error) {
      console.warn("[selection-translate] clipboard restore failed", error);
    }
  }

  if (!captured) {
    return {
      ok: false,
      text: "",
      reason: baseline === clipboard.readText() ? "unchanged" : "empty"
    };
  }

  return { ok: true, text: captured };
}
