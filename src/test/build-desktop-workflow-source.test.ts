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

test("desktop build workflow keeps tag-triggered mac builds releasable even without Apple signing secrets", () => {
  const workflow = readWorkflow();

  assert.match(
    workflow,
    /if:\s*\$\{\{\s*github\.event_name == 'push'\s*&&\s*startsWith\(github\.ref,\s*'refs\/tags\/v'\)\s*\}\}/,
    "tag-triggered mac release packaging should still scope the signing export step to release tags"
  );
  assert.match(
    workflow,
    /if \[ -n "\$\{\{\s*secrets\.APPLE_CERTIFICATE_P12_BASE64\s*\}\}" \] && \[ -n "\$\{\{\s*secrets\.APPLE_CERTIFICATE_PASSWORD\s*\}\}" \] && \[ -n "\$\{\{\s*secrets\.APPLE_TEAM_ID\s*\}\}" \]; then/,
    "workflow should only export Apple signing inputs when all required secrets are available"
  );
  assert.match(
    workflow,
    /echo "CSC_LINK=\$\{\{\s*secrets\.APPLE_CERTIFICATE_P12_BASE64\s*\}\}"/,
    "workflow should still export the Apple certificate secret into GITHUB_ENV when signing is configured"
  );
  assert.match(
    workflow,
    /echo "CSC_KEY_PASSWORD=\$\{\{\s*secrets\.APPLE_CERTIFICATE_PASSWORD\s*\}\}"/,
    "workflow should still export the Apple certificate password into GITHUB_ENV when signing is configured"
  );
  assert.match(
    workflow,
    /echo "APPLE_TEAM_ID=\$\{\{\s*secrets\.APPLE_TEAM_ID\s*\}\}"/,
    "workflow should still export the Apple team id into GITHUB_ENV when signing is configured"
  );
  assert.match(
    workflow,
    /::warning::Apple signing secrets are missing; continuing with unsigned macOS release artifacts\./,
    "workflow should warn and keep building unsigned macOS assets when Apple signing secrets are absent"
  );
  assert.doesNotMatch(
    workflow,
    /if:\s*\$\{\{[^}]*secrets\./,
    "workflow should not reference secrets directly inside if expressions because GitHub rejects that configuration before jobs start"
  );
  assert.doesNotMatch(
    workflow,
    /Missing required Apple signing secrets for tag release packaging\./,
    "workflow should not hard-fail tagged mac builds just because optional Apple signing secrets are missing"
  );
  assert.doesNotMatch(
    workflow,
    /Expected secrets: APPLE_CERTIFICATE_P12_BASE64, APPLE_CERTIFICATE_PASSWORD, APPLE_TEAM_ID/,
    "workflow should avoid turning missing Apple signing secrets into a release-blocking preflight error"
  );
  assert.doesNotMatch(
    workflow,
    /build-macos:\s*[\s\S]*?^ {4}env:\s*(?:\r?\n^ {6}.*)*\r?\n^ {6}CSC_LINK:/m,
    "workflow_dispatch mac builds should not inherit an empty CSC_LINK at the job level because electron-builder treats that as a broken signing input"
  );
});

test("desktop build workflow requires LiteSnap native addon on Windows", () => {
  const workflow = readWorkflow();

  assert.match(
    workflow,
    /LITELAUNCHER_REQUIRE_NATIVE_CAPTURE:\s*"1"/,
    "windows build should require the LiteSnap native addon"
  );
});

test("build-native script discovers Visual Studio 2026 toolchains", () => {
  const buildNativeSource = fs.readFileSync(
    path.join(process.cwd(), "scripts", "build-native.cjs"),
    "utf8"
  );

  assert.match(buildNativeSource, /"2026"/);
  assert.match(buildNativeSource, /"18"/);
});
