// Run after Windows packaging; uses a temporary E2E profile, never an installed copy.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { launchE2ESession, waitForSettingsPanel } = require("../dist/test/e2e-test-utils.js");

async function main() {
  const root = path.resolve(__dirname, "..");
  const expectedVersion = require("../package.json").version;
  const output = path.join(root, "artifacts", `v${expectedVersion}-packaged-health`);
  fs.mkdirSync(output, { recursive: true });
  const session = await launchE2ESession({
    executablePath: path.join(root, "release", "win-unpacked", "LiteLauncher.exe"),
    workingDirectory: path.join(root, "release", "win-unpacked")
  });
  try {
    const health = await session.page.evaluate(() => window.launcher.getLiteSnapNativeHealth());
    const updater = await session.page.evaluate(() => window.launcher.getAppUpdaterStatus());
    assert.equal(health.loaded, true);
    assert.equal(health.missingExports.length, 0);
    assert.match(health.moduleFile, /^litesnap-capture-[a-f0-9]{16}\.node$/);
    assert.equal(updater.currentVersion, expectedVersion);
    assert.equal(updater.supported, true);
    await session.page.evaluate(() => window.launcher.setE2EAppUpdaterCheckFailure("测试网络失败 token=private-test-value"));
    await session.page.locator("#settings-shortcut-btn").click();
    await waitForSettingsPanel(session.page);
    await session.page.locator('button[data-settings-tab="updates"]').click();
    await session.page.getByRole("button", { name: "检查更新", exact: true }).click();
    await session.page.getByRole("button", { name: "重试更新", exact: true }).waitFor();
    await session.page.getByRole("button", { name: "重试更新", exact: true }).click();
    await session.page.getByRole("button", { name: "重试更新", exact: true }).waitFor();
    await session.page.getByRole("button", { name: "复制更新诊断", exact: true }).click();
    await session.page.waitForFunction(() => document.querySelector("#status-text")?.textContent?.includes("更新诊断已复制"));
    const copied = await session.electronApp.evaluate(({ clipboard }) => clipboard.readText());
    assert.match(copied, /\[redacted\]/);
    assert.doesNotMatch(copied, /private-test-value/);
    await session.page.screenshot({ path: path.join(output, "update-retry.png") });
    fs.writeFileSync(path.join(output, "result.json"), JSON.stringify({ expectedVersion, health, updater, retryAndCopy: "passed" }, null, 2));
    console.info(`[packaged-health] v${expectedVersion}: native module, updater eligibility, retry and sanitized copy passed`);
  } finally {
    await session.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
