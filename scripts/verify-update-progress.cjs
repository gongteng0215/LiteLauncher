const assert = require("node:assert/strict");
const fs = require("node:fs");
const { launchE2ESession, waitForSettingsPanel } = require("../dist/test/e2e-test-utils.js");

(async () => {
  const session = await launchE2ESession();
  const setPhase = async (phase, percent) => session.electronApp.evaluate(({ ipcMain }, input) => {
    ipcMain.removeHandler("launcher:get-app-updater-status");
    ipcMain.handle("launcher:get-app-updater-status", () => ({
      supported: true, autoUpdateEnabled: true, currentVersion: "1.1.22", updateVersion: "1.1.23",
      phase: input.phase, progressPercent: input.percent, downloaded: input.phase === "downloaded",
      releaseNotes: "测试更新说明。".repeat(100)
    }));
  }, { phase, percent });
  try {
    await setPhase("checking");
    await session.page.locator("#settings-shortcut-btn").click();
    await waitForSettingsPanel(session.page);
    await session.page.locator('button[data-settings-tab="updates"]').click();
    await session.page.locator("progress.settings-update-progress").waitFor({ state: "visible" });
    assert.equal(await session.page.locator("progress").getAttribute("value"), null);
    for (const percent of [12, 67]) {
      await setPhase("downloading", percent);
      await session.page.waitForFunction(value => document.querySelector("progress.settings-update-progress")?.value === value, percent);
    }
    fs.mkdirSync("artifacts/update-progress", { recursive: true });
    await session.page.screenshot({ path: "artifacts/update-progress/downloading.png" });
    await setPhase("downloaded", 100);
    const install = session.page.getByRole("button", { name: "立即安装并重启", exact: true });
    await install.waitFor({ state: "visible" });
    const action = await install.boundingBox();
    const notes = await session.page.locator(".settings-system-update-notes").boundingBox();
    assert.ok(action.y < notes.y, "install action must precede long release notes");
    const hintWidth = await session.page.locator(".settings-system-update-card .settings-row-hint").evaluate(node => node.getBoundingClientRect().width);
    assert.ok(hintWidth > 250, "hint must not collapse into a vertical strip");
    await session.page.screenshot({ path: "artifacts/update-progress/downloaded.png" });
    console.log("Live progress 12% → 67% → downloaded, visible install action, and hint layout passed");
  } finally { await session.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
