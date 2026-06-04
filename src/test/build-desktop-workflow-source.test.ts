import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workflowPath = path.join(
  process.cwd(),
  ".github",
  "workflows",
  "build-desktop.yml"
);

function readWorkflow(): string {
  return fs.readFileSync(workflowPath, "utf8");
}

test("desktop build workflow uses explicit stable runner labels", () => {
  const workflow = readWorkflow();

  assert.match(
    workflow,
    /runs-on:\s*windows-2025-vs2026/,
    "windows build should target the explicit VS 2026 image instead of relying on the redirecting windows-2025 label"
  );
  assert.doesNotMatch(
    workflow,
    /runs-on:\s*windows-latest/,
    "desktop build workflow should avoid the floating windows-latest alias"
  );
  assert.doesNotMatch(
    workflow,
    /runs-on:\s*windows-2025\s*(?:\r?\n|$)/,
    "desktop build workflow should not stay on the redirecting windows-2025 label"
  );
  assert.match(
    workflow,
    /runs-on:\s*ubuntu-24\.04/,
    "release publish job should use an explicit Ubuntu runner label"
  );
  assert.match(
    workflow,
    /FORCE_JAVASCRIPT_ACTIONS_TO_NODE24:\s*"true"/,
    "workflow should opt into the Node 24 action runtime ahead of the platform default switch"
  );
});

test("desktop build workflow pins actions to the Node 24-ready major versions", () => {
  const workflow = readWorkflow();

  assert.match(workflow, /uses:\s*actions\/checkout@v6/);
  assert.match(workflow, /uses:\s*actions\/setup-node@v6/);
  assert.match(workflow, /uses:\s*actions\/upload-artifact@v7/);
  assert.match(workflow, /uses:\s*actions\/download-artifact@v8/);
  assert.match(workflow, /uses:\s*pnpm\/action-setup@v6/);

  assert.doesNotMatch(workflow, /uses:\s*actions\/checkout@v4/);
  assert.doesNotMatch(workflow, /uses:\s*actions\/setup-node@v4/);
  assert.doesNotMatch(workflow, /uses:\s*actions\/upload-artifact@v4/);
  assert.doesNotMatch(workflow, /uses:\s*actions\/download-artifact@v4/);
  assert.doesNotMatch(workflow, /uses:\s*pnpm\/action-setup@v4/);
});

test("desktop build workflow avoids setup-node's built-in pnpm cache path", () => {
  const workflow = readWorkflow();

  assert.doesNotMatch(
    workflow,
    /cache:\s*pnpm/,
    "workflow should not rely on setup-node's built-in pnpm cache path for release packaging"
  );
  assert.match(
    workflow,
    /package-manager-cache:\s*false/,
    "workflow should explicitly disable setup-node's package-manager cache for these pnpm jobs"
  );
});

test("desktop build workflow gates mac publish-ready artifacts on signing inputs", () => {
  const workflow = readWorkflow();

  assert.match(
    workflow,
    /if:\s*\$\{\{\s*github\.event_name == 'push'\s*&&\s*startsWith\(github\.ref,\s*'refs\/tags\/v'\)\s*\}\}/,
    "tag-triggered mac release packaging should validate Apple signing inputs before continuing"
  );
  assert.match(
    workflow,
    /CSC_LINK:\s*\$\{\{\s*secrets\.APPLE_CERTIFICATE_P12_BASE64\s*\}\}/,
    "workflow should wire the Apple certificate secret into electron-builder"
  );
  assert.match(
    workflow,
    /CSC_KEY_PASSWORD:\s*\$\{\{\s*secrets\.APPLE_CERTIFICATE_PASSWORD\s*\}\}/,
    "workflow should wire the Apple certificate password into electron-builder"
  );
  assert.match(
    workflow,
    /APPLE_TEAM_ID:\s*\$\{\{\s*secrets\.APPLE_TEAM_ID\s*\}\}/,
    "workflow should expose the Apple team id for mac signing/notarization preparation"
  );
  assert.match(
    workflow,
    /if:\s*\$\{\{\s*github\.event_name == 'workflow_dispatch'\s*\|\|\s*\(\s*secrets\.APPLE_CERTIFICATE_P12_BASE64\s*!=\s*''\s*&&\s*secrets\.APPLE_CERTIFICATE_PASSWORD\s*!=\s*''\s*&&\s*secrets\.APPLE_TEAM_ID\s*!=\s*''\s*\)\s*\}\}/,
    "manual workflow runs should still be allowed to build mac artifacts without release-signing secrets"
  );
});
