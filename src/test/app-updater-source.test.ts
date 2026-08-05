import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const appUpdaterPath = path.join(process.cwd(), "src", "main", "app-updater.ts");

function readAppUpdaterSource(): string {
  return fs.readFileSync(appUpdaterPath, "utf8");
}

test("app updater schedules a startup check and periodic background rechecks", () => {
  const source = readAppUpdaterSource();

  assert.match(
    source,
    /const AUTO_UPDATE_CHECK_DELAY_MS = 12_000;/,
    "app updater should keep the short startup delay before the first automatic check"
  );
  assert.match(
    source,
    /const AUTO_UPDATE_RECHECK_INTERVAL_MS = 2 \* 60 \* 60 \* 1000;/,
    "app updater should define a periodic background recheck interval for long-running sessions"
  );
  assert.match(
    source,
    /setTimeout\(\(\) => \{\s*void provider\.checkForUpdates\(\);\s*\}, AUTO_UPDATE_CHECK_DELAY_MS\);/,
    "app updater should still trigger an automatic check shortly after startup"
  );
  assert.match(
    source,
    /setInterval\(\(\) => \{\s*void provider\.checkForUpdates\(\);\s*\}, AUTO_UPDATE_RECHECK_INTERVAL_MS\);/,
    "app updater should keep checking for updates on a repeating timer after startup"
  );
});

test("app updater prompts to install after an update is downloaded", () => {
  const source = readAppUpdaterSource();

  assert.match(
    source,
    /import \{ app, BrowserWindow, dialog \} from "electron";/,
    "app updater should be able to show a native install prompt from the main process"
  );
  assert.match(
    source,
    /autoUpdater\.on\("update-downloaded"[\s\S]*void promptForDownloadedUpdate\(event\.version\);/,
    "downloaded updates should trigger an install reminder instead of only updating settings state"
  );
  assert.match(
    source,
    /const promptOptions = \{[\s\S]*buttons: \["立即安装并重启", "稍后"\]/,
    "install reminder should offer immediate restart/install and a defer option"
  );
  assert.match(
    source,
    /dialog\.showMessageBox\(ownerWindow, promptOptions\)[\s\S]*dialog\.showMessageBox\(promptOptions\)/,
    "install reminder should support both window-owned and app-level prompts"
  );
  assert.match(
    source,
    /if \(result\.response === 0\) \{\s*await provider\.installUpdateNow\(\);/,
    "choosing the primary prompt action should reuse the existing install path"
  );
  assert.match(
    source,
    /promptedDownloadedVersion === version/,
    "the same downloaded version should not repeatedly show duplicate prompts"
  );
});

test("app updater reports sanitized terminal failures through the main-process logger", () => {
  const source = readAppUpdaterSource();

  assert.match(
    source,
    /reportError\?: \(input: AppErrorLogInput\) => void;/,
    "updater options should accept the existing structured error-log callback"
  );
  assert.match(
    source,
    /function redactUpdaterErrorDetail[\s\S]*\[redacted\]/,
    "updater failures should redact common credential values before logging"
  );
  assert.match(
    source,
    /const reportUpdaterFailure[\s\S]*stage=\$\{stage\}[\s\S]*message: "自动更新失败"/,
    "updater failures should record stage and version context"
  );
  assert.match(
    source,
    /lastReportedErrorCycle === updateCheckCycle/,
    "the same check cycle should not write duplicate terminal error logs"
  );
  assert.match(
    source,
    /reportUpdaterFailure\(detail, "check"\)/,
    "manual and injected update checks should report their terminal errors"
  );
  assert.match(
    source,
    /reportUpdaterFailure\(detail \|\| "检查更新失败", "updater-event"\)/,
    "updater event failures should also be logged"
  );
});
