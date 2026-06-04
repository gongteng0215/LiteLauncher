import assert from "node:assert/strict";
import test from "node:test";

import {
  captureE2EFailureArtifacts,
  launchE2ESession,
  waitForMode
} from "./e2e-test-utils";

test(
  "electron smoke: settings surfaces launcher topmost diagnostics as compact highlights",
  { timeout: 120000 },
  async () => {
    const testName =
      "electron smoke: settings surfaces launcher topmost diagnostics as compact highlights";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;

    try {
      session = await launchE2ESession();
      const { page } = session;

      const seedResult = await page.evaluate(async () => {
        await window.launcher.clearErrorLogs();

        await window.launcher.reportErrorLog({
          scope: "main",
          level: "warn",
          message: "Launcher lost always-on-top state",
          context:
            "phase=always-on-top-changed trigger=global-shortcut showAgeMs=84 visible=1 focused=0 alwaysOnTop=0 bounds=580,220,1040,680",
          detail: "Electron emitted always-on-top-changed=false"
        });

        return window.launcher.getErrorLogs(10);
      });

      assert.ok(seedResult.length >= 1, "should seed at least one error log entry");

      await page.locator("#settings-shortcut-btn").click();
      await waitForMode(page, "settings");

      const highlightCard = page.locator(".settings-error-log-highlight-card").first();
      await highlightCard.waitFor({ state: "visible", timeout: 10000 });

      const highlightText = await highlightCard.textContent();
      assert.match(highlightText ?? "", /置顶状态掉线/);
      assert.match(highlightText ?? "", /全局快捷键/);
      assert.match(highlightText ?? "", /置顶 否/);

      const rawLogValue = await page.locator(".settings-log-output").inputValue();
      assert.match(rawLogValue, /Launcher lost always-on-top state/);
    } catch (error) {
      if (session) {
        const artifactDir = await captureE2EFailureArtifacts(
          session.page,
          testName,
          error,
          session.electronApp
        );
        console.error(`[e2e] failure artifacts saved to ${artifactDir}`);
      }
      throw error;
    } finally {
      if (session) {
        await session.close();
      }
    }
  }
);
