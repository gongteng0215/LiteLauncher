import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { _electron as electron, ElectronApplication, Page } from "playwright";

const PROJECT_ROOT = path.resolve(__dirname, "../..");

function buildElectronEnv(userDataDir: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string" && key !== "ELECTRON_RUN_AS_NODE") {
      env[key] = value;
    }
  }

  env.ELECTRON_DISABLE_CRASH_REPORTER = "1";
  env.LITELAUNCHER_E2E = "1";
  env.LITELAUNCHER_E2E_USER_DATA_DIR = userDataDir;
  return env;
}

async function removeDirectoryWithRetry(targetPath: string): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await fs.rm(targetPath, { recursive: true, force: true });
      return;
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !("code" in error) ||
        error.code !== "EBUSY" ||
        attempt === 4
      ) {
        console.warn(
          `[e2e] failed to clean temporary userData dir: ${targetPath}`,
          error
        );
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
    }
  }
}

async function waitForRendererBootstrap(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      Boolean(
        (
          window as typeof window & {
            __LL_RENDERER_BOOTSTRAPPED__?: boolean;
          }
        ).__LL_RENDERER_BOOTSTRAPPED__
      ),
    undefined,
    { timeout: 15000 }
  );
}

async function waitForMode(page: Page, mode: string): Promise<void> {
  await page.waitForFunction(
    (expectedMode) => document.body.dataset.mode === expectedMode,
    mode,
    { timeout: 10000 }
  );
}

async function waitForActivePlugin(page: Page, pluginId: string): Promise<void> {
  await page.waitForFunction(
    (expectedPluginId) => document.body.dataset.activePluginId === expectedPluginId,
    pluginId,
    { timeout: 10000 }
  );
}

test(
  "electron smoke: launch window, open settings, search and open JSON plugin",
  { timeout: 120000 },
  async () => {
    const userDataDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "litelauncher-e2e-")
    );

    let electronApp: ElectronApplication | null = null;
    try {
      electronApp = await electron.launch({
        cwd: PROJECT_ROOT,
        args: ["."],
        env: buildElectronEnv(userDataDir)
      });

      const page = await electronApp.firstWindow();
      await page.bringToFront();
      await waitForRendererBootstrap(page);
      await waitForMode(page, "search");

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

      await page.keyboard.press("Escape");
      await waitForMode(page, "search");

      await searchInput.click();
      await searchInput.fill("plugin:json");
      const jsonResult = page
        .locator(".result-item.result-tile")
        .filter({ hasText: "JSON 工具" })
        .first();
      await jsonResult.waitFor({ state: "visible", timeout: 10000 });
      await jsonResult.click();

      await waitForMode(page, "plugin");
      await waitForActivePlugin(page, "webtools-json");
      await page
        .locator(".settings-title", { hasText: "JSON & CSV 实验室" })
        .waitFor({ state: "visible", timeout: 10000 });

      await assert.doesNotReject(() =>
        statusText.waitFor({ state: "visible", timeout: 5000 })
      );
      const finalStatus = await statusText.textContent();
      assert.match(finalStatus ?? "", /已打开插件|转换|JSON/);
    } finally {
      if (electronApp) {
        await electronApp.close();
      }
      await removeDirectoryWithRetry(userDataDir);
    }
  }
);
