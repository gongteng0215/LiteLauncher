import assert from "node:assert/strict";
import test from "node:test";

import {
  launchE2ESession,
  openPluginFromSearch,
  returnToSearch,
  waitForMode
} from "./e2e-test-utils";

test(
  "electron smoke: launch window, open settings, search and open JSON plugin",
  { timeout: 120000 },
  async () => {
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    try {
      session = await launchE2ESession();
      const { page } = session;

      const searchInput = page.locator("#search-input");
      const settingsButton = page.locator("#settings-shortcut-btn");
      const statusText = page.locator("#status-text");

      await assert.doesNotReject(() => searchInput.waitFor({ state: "visible", timeout: 10000 }));
      await settingsButton.click();
      await waitForMode(page, "settings");
      await page.locator(".settings-title", { hasText: "LiteLauncher 设置" }).waitFor({
        state: "visible",
        timeout: 10000
      });

      await returnToSearch(page);
      await openPluginFromSearch(page, "plugin:json", "JSON 工具", "webtools-json");
      await page
        .locator(".settings-title", { hasText: "JSON & CSV 实验室" })
        .waitFor({ state: "visible", timeout: 10000 });

      await assert.doesNotReject(() =>
        statusText.waitFor({ state: "visible", timeout: 5000 })
      );
      const finalStatus = await statusText.textContent();
      assert.match(finalStatus ?? "", /已打开插件|转换|JSON/);
    } finally {
      if (session) {
        await session.close();
      }
    }
  }
);
