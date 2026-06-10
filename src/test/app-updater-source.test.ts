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
