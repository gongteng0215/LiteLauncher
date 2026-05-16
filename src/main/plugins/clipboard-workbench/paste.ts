export type ClipboardWorkbenchSequentialPasteMode =
  | "sequential"
  | "restore-only";

export interface ClipboardWorkbenchPasteRuntime {
  sendPasteShortcut(
    script: string
  ): Promise<{ ok: boolean; mode: ClipboardWorkbenchSequentialPasteMode }>;
}

function toSafeDelayMs(value: number): number {
  if (!Number.isFinite(value)) {
    return 180;
  }
  return Math.max(0, Math.round(value));
}

export function buildWindowsSequentialPasteScript(delayMs: number): string {
  return [
    "$ErrorActionPreference='Stop'",
    "Add-Type -AssemblyName System.Windows.Forms",
    "[System.Windows.Forms.SendKeys]::SendWait('^v')",
    `Start-Sleep -Milliseconds ${toSafeDelayMs(delayMs)}`
  ].join("; ");
}

export async function performClipboardWorkbenchSequentialPaste(
  itemCount: number,
  delayMs: number,
  runtime: ClipboardWorkbenchPasteRuntime
): Promise<{ ok: boolean; mode: ClipboardWorkbenchSequentialPasteMode }> {
  if (process.platform !== "win32") {
    return { ok: false, mode: "restore-only" };
  }

  const safeCount = Math.max(0, Math.floor(itemCount));
  for (let index = 0; index < safeCount; index += 1) {
    const result = await runtime.sendPasteShortcut(
      buildWindowsSequentialPasteScript(delayMs)
    );
    if (!result.ok) {
      return { ok: false, mode: "restore-only" };
    }
  }

  return { ok: true, mode: "sequential" };
}
