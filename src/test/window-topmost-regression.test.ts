import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const windowSourcePath = path.join(process.cwd(), "src", "main", "window.ts");

function readWindowSource(): string {
  return fs.readFileSync(windowSourcePath, "utf8");
}

test("launcher window show flow re-applies always-on-top after showing", () => {
  const source = readWindowSource();

  assert.match(
    source,
    /window\.setAlwaysOnTop\(true(?:,\s*"screen-saver")?\);/,
    "show flow should re-assert always-on-top after the window becomes visible"
  );
  assert.match(
    source,
    /function scheduleTopmostRecovery\([\s\S]*window\.setAlwaysOnTop\(true(?:,\s*"screen-saver")?\);/m,
    "show flow should include a delayed topmost recovery pass for focus-stealing cases"
  );
});

test("launcher window show flow emits a topmost recovery focus pulse", () => {
  const source = readWindowSource();

  assert.match(
    source,
    /window\.moveTop\(\);/,
    "show flow should still try to bring the launcher above other windows immediately"
  );
  assert.match(
    source,
    /window\.focus\(\);/,
    "show flow should keep requesting focus for the launcher window"
  );
});
