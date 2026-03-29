import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { _electron as electron, ElectronApplication, Page } from "playwright";

const PROJECT_ROOT = path.resolve(__dirname, "../..");

export interface E2ESession {
  electronApp: ElectronApplication;
  page: Page;
  close: () => Promise<void>;
}

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

export async function waitForRendererBootstrap(page: Page): Promise<void> {
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

export async function waitForMode(page: Page, mode: string): Promise<void> {
  await page.waitForFunction(
    (expectedMode) => document.body.dataset.mode === expectedMode,
    mode,
    { timeout: 10000 }
  );
}

export async function waitForActivePlugin(
  page: Page,
  pluginId: string
): Promise<void> {
  await page.waitForFunction(
    (expectedPluginId) => document.body.dataset.activePluginId === expectedPluginId,
    pluginId,
    { timeout: 10000 }
  );
}

export async function launchE2ESession(): Promise<E2ESession> {
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "litelauncher-e2e-"));
  const electronApp = await electron.launch({
    cwd: PROJECT_ROOT,
    args: ["."],
    env: buildElectronEnv(userDataDir)
  });

  const page = await electronApp.firstWindow();
  await page.bringToFront();
  await waitForRendererBootstrap(page);
  await waitForMode(page, "search");

  return {
    electronApp,
    page,
    close: async () => {
      await electronApp.close();
      await removeDirectoryWithRetry(userDataDir);
    }
  };
}

export async function openPluginFromSearch(
  page: Page,
  query: string,
  title: string,
  pluginId: string
): Promise<void> {
  const searchInput = page.locator("#search-input");
  await searchInput.click();
  await searchInput.fill(query);

  const result = page
    .locator(".result-item.result-tile")
    .filter({ hasText: title })
    .first();
  await result.waitFor({ state: "visible", timeout: 10000 });
  await result.click();

  await waitForMode(page, "plugin");
  await waitForActivePlugin(page, pluginId);
}

export async function returnToSearch(page: Page): Promise<void> {
  await page.keyboard.press("Escape");
  await waitForMode(page, "search");
}
