import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { _electron as electron, ElectronApplication, Page } from "playwright";

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const E2E_ARTIFACTS_ROOT = path.join(PROJECT_ROOT, "artifacts", "e2e");

export interface E2ESession {
  electronApp: ElectronApplication;
  page: Page;
  close: () => Promise<void>;
}

function sanitizeArtifactName(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
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

export async function captureE2EFailureArtifacts(
  page: Page,
  testName: string,
  error?: unknown
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const artifactDir = path.join(
    E2E_ARTIFACTS_ROOT,
    `${timestamp}-${sanitizeArtifactName(testName)}`
  );
  await fs.mkdir(artifactDir, { recursive: true });

  const screenshotPath = path.join(artifactDir, "failure.png");
  const htmlPath = path.join(artifactDir, "page.html");
  const metadataPath = path.join(artifactDir, "metadata.json");

  await page.screenshot({ path: screenshotPath, fullPage: true });
  await fs.writeFile(htmlPath, await page.content(), "utf8");

  const metadata = await page.evaluate(() => ({
    url: window.location.href,
    title: document.title,
    mode: document.body.dataset.mode ?? null,
    activePluginId: document.body.dataset.activePluginId ?? null,
    statusText:
      document.querySelector<HTMLElement>("#status-text")?.textContent?.trim() ?? null
  }));

  await fs.writeFile(
    metadataPath,
    JSON.stringify(
      {
        testName,
        error:
          error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack ?? null }
            : String(error),
        ...metadata
      },
      null,
      2
    ),
    "utf8"
  );

  return artifactDir;
}
