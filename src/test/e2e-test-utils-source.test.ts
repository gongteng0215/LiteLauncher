import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const e2eUtilsPath = path.join(process.cwd(), "src", "test", "e2e-test-utils.ts");

function readE2EUtilsSource(): string {
  return fs.readFileSync(e2eUtilsPath, "utf8");
}

test("e2e test utils can launch an external packaged LiteLauncher executable", () => {
  const source = readE2EUtilsSource();

  assert.match(
    source,
    /executablePath\?: string;/,
    "launch options should allow passing a packaged Electron executable path"
  );
  assert.match(
    source,
    /workingDirectory\?: string;/,
    "launch options should allow overriding the working directory for packaged app runs"
  );
  assert.match(
    source,
    /const executablePath = options\.executablePath\?.*?;/s,
    "launch helper should derive the executable path from launch options"
  );
  assert.match(
    source,
    /const launchCwd = options\.workingDirectory \?\? PROJECT_ROOT;/,
    "launch helper should allow packaged app runs to use their own working directory"
  );
  assert.match(
    source,
    /electron\.launch\(\{\s*cwd: launchCwd,\s*executablePath,\s*args:/s,
    "electron launch should pass the packaged executable path through to Playwright"
  );
});

test("e2e test utils can opt into real blur handling for window-hide policy verification", () => {
  const source = readE2EUtilsSource();

  assert.match(
    source,
    /enableRealBlurHandling\?: boolean;/,
    "launch options should allow opting into real blur handling for focused window policy tests"
  );
  assert.match(
    source,
    /if \(options\.enableRealBlurHandling\) \{\s*env\.LITELAUNCHER_E2E_REAL_BLUR = "1";\s*\}/s,
    "launch helper should expose a dedicated env flag for real blur handling"
  );
});

test("e2e test utils can open plugins from both classic and Command Center search results", () => {
  const source = readE2EUtilsSource();

  assert.match(
    source,
    /locator\("\.result-item\.result-tile, \.command-result"\)/,
    "plugin-opening helper should support the Command Center search result markup"
  );
});
