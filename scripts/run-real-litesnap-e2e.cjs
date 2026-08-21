const path = require("node:path");
const { spawnSync } = require("node:child_process");

if (process.platform !== "win32") {
  console.error("[litesnap-real-e2e] the real native long-capture fixture only supports Windows");
  process.exit(1);
}

const testPath = path.join(
  process.cwd(),
  "dist",
  "test",
  "e2e-litesnap-overlay.test.js"
);
const result = spawnSync(
  process.execPath,
  [
    "--test",
    "--test-name-pattern=electron native: LiteSnap captures a real controllable Windows scroll target",
    testPath
  ],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      LITELAUNCHER_E2E_REAL_LONG_CAPTURE: "1"
    },
    stdio: "inherit",
    windowsHide: false
  }
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
