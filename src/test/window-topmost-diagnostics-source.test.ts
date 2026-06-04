import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const windowSourcePath = path.join(process.cwd(), "src", "main", "window.ts");
const indexSourcePath = path.join(process.cwd(), "src", "main", "index.ts");
const traySourcePath = path.join(process.cwd(), "src", "main", "tray.ts");

function readSource(sourcePath: string): string {
  return fs.readFileSync(sourcePath, "utf8");
}

test("launcher show flow exposes a diagnostic callback for topmost recovery", () => {
  const source = readSource(windowSourcePath);

  assert.match(
    source,
    /reportDiagnostic\??:\s*\(event:\s*LauncherWindowDiagnosticEvent\)\s*=>\s*void/,
    "show flow should accept a diagnostic reporter so the main process can persist suspicious states"
  );
  assert.match(
    source,
    /reportDiagnostic\(\{\s*trigger,/m,
    "show flow should emit structured diagnostics that include the trigger source"
  );
});

test("main process records topmost-loss diagnostics with trigger context", () => {
  const source = readSource(indexSourcePath);

  assert.match(
    source,
    /always-on-top-changed/,
    "main process should observe always-on-top transitions so we can diagnose unexpected drops"
  );
  assert.match(
    source,
    /lastLauncherShowMeta/,
    "main process should track the most recent launcher show trigger for diagnostics"
  );
  assert.match(
    source,
    /trigger=/,
    "topmost diagnostics should include the show trigger in their persisted context"
  );
});

test("tray integration preserves trigger labels for launcher visibility diagnostics", () => {
  const source = readSource(traySourcePath);

  assert.match(
    source,
    /showLauncherWindow\?:\s*\(\)\s*=>\s*void/,
    "tray setup should allow the main process to inject diagnostic-aware show handlers"
  );
  assert.match(
    source,
    /toggleLauncherWindow\?:\s*\(\)\s*=>\s*void/,
    "tray setup should allow the main process to inject diagnostic-aware toggle handlers"
  );
});
