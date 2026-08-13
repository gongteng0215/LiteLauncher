import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { readRendererSourceBundle } from "./renderer-source-bundle";

const rendererPath = path.join(process.cwd(), "src", "renderer", "renderer.ts");

test("renderer error log formatter translates pin failures into readable Chinese summaries", () => {
  const source = readRendererSourceBundle();

  assert.match(
    source,
    /function formatPinErrorReasonText\(reason: string \| undefined\): string/,
    "pin failure reason helper should exist in renderer.ts"
  );
  assert.match(source, /Pin request rejected/);
  assert.match(source, /Pin request failed/);
  assert.match(source, /\\u5f53\\u524d\\u7ed3\\u679c\\u5df2\\u8fc7\\u671f\\uff0c\\u8bf7\\u91cd\\u65b0\\u641c\\u7d22/);
  assert.match(source, /\\u4fdd\\u5b58\\u5931\\u8d25\\uff0c\\u8bf7\\u91cd\\u8bd5/);
});

test("renderer settings surface launcher topmost diagnostics as dedicated summaries", () => {
  const source = readRendererSourceBundle();

  assert.match(
    source,
    /function isLauncherTopmostDiagnosticEntry\(entry: AppErrorLogEntry\): boolean/,
    "renderer should detect topmost-related launcher diagnostics"
  );
  assert.match(
    source,
    /function formatLauncherTopmostDiagnosticSummary\(entry: AppErrorLogEntry\): string/,
    "renderer should format launcher topmost diagnostics into readable summaries"
  );
  assert.match(
    source,
    /settings-diagnostic-summary-list/,
    "settings panel should render a dedicated compact summary list for topmost diagnostics"
  );
  assert.match(source, /Launcher lost always-on-top state/);
  assert.match(source, /Launcher blurred shortly after showing/);
  assert.match(source, /Launcher topmost recovery diagnostic/);
});

test("renderer settings surface pin failures as dedicated diagnostics and support copying raw logs", () => {
  const source = readRendererSourceBundle();

  assert.match(
    source,
    /function isPinDiagnosticEntry\(entry: AppErrorLogEntry\): boolean/,
    "renderer should recognize pin failure log entries as dedicated diagnostics"
  );
  assert.match(
    source,
    /function formatPinDiagnosticSummary\(entry: AppErrorLogEntry\): string/,
    "renderer should format pin failure diagnostics into readable summaries"
  );
  assert.match(
    source,
    /copyTextToClipboard\(formatErrorLogs\(errorLogEntries\)\)/,
    "settings panel should allow copying the raw error log output directly"
  );
  assert.match(
    source,
    /日志已复制/,
    "copying settings diagnostics should acknowledge success in Chinese"
  );
});

test("renderer refreshes the open settings overlay after diagnostics change", () => {
  const source = readRendererSourceBundle();

  assert.match(
    source,
    /function refreshOpenSettingsOverlay\(\): void \{[\s\S]*isSettingsOverlayOpen\(\)[\s\S]*openSettingsOverlay\([\s\S]*renderSettingsPanel/,
    "settings diagnostics should redraw the Command Center settings overlay in place"
  );
  assert.match(
    source,
    /async function checkForAppUpdatesFromSettings\(\): Promise<void> \{[\s\S]*refreshOpenSettingsOverlay\(\);/,
    "a completed update check should refresh the visible update card"
  );
  assert.match(
    source,
    /refreshErrorLogButton\.addEventListener\([\s\S]*refreshOpenSettingsOverlay\(\);/,
    "refreshing error logs should update the visible error-log tab"
  );
  assert.match(
    source,
    /copyTextToClipboard\(formatAppUpdaterDiagnosticsForClipboard\(appUpdaterStatus\)\)/,
    "the update card should provide a copyable diagnostic payload"
  );
});

test("renderer suspends blur auto-hide while plugin, settings, and cashflow panels are active", () => {
  const source = readRendererSourceBundle();

  assert.match(
    source,
    /function shouldSuspendAutoHideForMode\(nextMode: PanelMode\): boolean/,
    "renderer should define an explicit mode-based blur-hide policy"
  );
  assert.match(
    source,
    /nextMode === "cashflow" \|\| nextMode === "plugin" \|\| nextMode === "settings"/,
    "renderer should keep cashflow, plugin, and settings panels visible on blur"
  );
  assert.match(
    source,
    /function syncAutoHideSuspension\(nextMode: PanelMode = mode\): void/,
    "renderer should centralize blur auto-hide synchronization in one helper"
  );
  assert.match(
    source,
    /(?:UI_TUNING_KEEP_OPEN \|\|\s*)?shouldSuspendAutoHideForMode\(nextMode\) \|\|\s*pluginNativeInteractionLocked/,
    "shared blur-hide synchronization should preserve native interaction locks"
  );
  assert.match(
    source,
    /syncAutoHideSuspension\(nextMode\);/,
    "mode transitions should toggle blur auto-hide suspension from one shared helper"
  );
});
