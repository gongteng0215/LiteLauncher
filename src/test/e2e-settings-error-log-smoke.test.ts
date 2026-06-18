import assert from "node:assert/strict";
import test from "node:test";

import {
  captureE2EFailureArtifacts,
  launchE2ESession,
  waitForMode,
  waitForStatusText
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

test(
  "electron smoke: settings surfaces updater diagnostics, pin failure summaries, and copy-log feedback",
  { timeout: 120000 },
  async () => {
    const testName =
      "electron smoke: settings surfaces updater diagnostics, pin failure summaries, and copy-log feedback";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;

    try {
      session = await launchE2ESession();
      const { page } = session;

      const seedResult = await page.evaluate(async () => {
        await window.launcher.clearErrorLogs();

        await window.launcher.reportErrorLog({
          scope: "main",
          level: "warn",
          message: "Pin request rejected",
          context: "itemId=stale-entry pinned=1",
          detail: "reason=missing-catalog-item"
        });

        return window.launcher.getErrorLogs(10);
      });

      assert.ok(seedResult.length >= 1, "should seed at least one pin diagnostic entry");

      await page.locator("#settings-shortcut-btn").click();
      await waitForMode(page, "settings");

      const updaterDetails = page.locator(".settings-system-update-detail-row");
      await updaterDetails.first().waitFor({ state: "visible", timeout: 10000 });
      const updaterDetailText = await page.locator(".settings-system-update-details").textContent();
      assert.match(updaterDetailText ?? "", /当前版本/);
      assert.match(updaterDetailText ?? "", /自动更新/);
      assert.match(updaterDetailText ?? "", /最近阶段/);

      const copyButton = page.getByRole("button", { name: "复制日志" });
      await copyButton.click();
      await waitForStatusText(page, "错误日志已复制");

      const pinSummaryCard = page.locator(".settings-diagnostic-summary-card").filter({
        hasText: "置顶请求被拒绝"
      });
      await pinSummaryCard.first().waitFor({ state: "visible", timeout: 10000 });

      const pinSummaryText = await pinSummaryCard.first().textContent();
      assert.match(pinSummaryText ?? "", /当前结果已过期/);

      const rawLogValue = await page.locator(".settings-log-output").inputValue();
      assert.match(rawLogValue, /置顶请求已拒绝/);
      assert.match(rawLogValue, /当前结果已过期/);
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

test(
  "electron smoke: settings handles unsupported and failed updater states",
  { timeout: 120000 },
  async () => {
    const testName =
      "electron smoke: settings handles unsupported and failed updater states";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;

    try {
      session = await launchE2ESession();
      const { page } = session;

      await page.evaluate(async () => {
        await window.launcher.setE2EAppUpdaterCheckFailure("E2E 检查更新失败");
      });

      await page.locator("#settings-shortcut-btn").click();
      await waitForMode(page, "settings");

      const updaterDetailText = await page.locator(".settings-system-update-details").textContent();
      assert.match(updaterDetailText ?? "", /自动更新未启用/);
      assert.match(updaterDetailText ?? "", /暂不支持自动更新/);

      const updaterSummaryText = await page.locator(".settings-system-update-card").textContent();
      assert.match(updaterSummaryText ?? "", /打包后再验证/);

      await page.getByRole("button", { name: "检查更新" }).click();
      await waitForStatusText(page, "检查更新失败");
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
