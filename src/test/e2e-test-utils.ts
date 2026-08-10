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

type MainWindowSnapshot = {
  isVisible: boolean;
  isFocused: boolean;
  isAlwaysOnTop: boolean;
  bounds: { x: number; y: number; width: number; height: number };
} | null;

export interface LaunchE2ESessionOptions {
  userDataDir?: string;
  cleanupUserDataDir?: boolean;
  executablePath?: string;
  workingDirectory?: string;
  enableRealBlurHandling?: boolean;
  extraEnv?: Record<string, string>;
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

export async function waitForSettingsPanel(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      document.body.dataset.mode === "settings" ||
      Boolean(document.querySelector(".cc-settings-overlay-dialog")),
    undefined,
    { timeout: 10000 }
  );
}

export async function waitForStatusText(
  page: Page,
  expectedText: string
): Promise<void> {
  await page.waitForFunction(
    (text) =>
      (document.querySelector<HTMLElement>("#status-text")?.textContent ?? "").includes(
        text
      ),
    expectedText,
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

async function waitForLauncherPage(
  electronApp: ElectronApplication
): Promise<Page> {
  const firstPage = await electronApp.firstWindow();
  const startedAt = Date.now();

  while (Date.now() - startedAt < 15000) {
    const pages = electronApp.windows();
    const launcherPage =
      pages.find((page) => page.url().includes("/renderer/index.html")) ?? null;
    if (launcherPage) {
      return launcherPage;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  return firstPage;
}

export async function launchE2ESession(
  options: LaunchE2ESessionOptions = {}
): Promise<E2ESession> {
  const userDataDir =
    options.userDataDir ??
    (await fs.mkdtemp(path.join(os.tmpdir(), "litelauncher-e2e-")));
  const cleanupUserDataDir = options.cleanupUserDataDir !== false;
  const executablePath = options.executablePath?.trim() || undefined;
  const launchCwd = options.workingDirectory ?? PROJECT_ROOT;
  const launchArgs = executablePath ? [] : ["."];
  const env = buildElectronEnv(userDataDir);
  Object.assign(env, options.extraEnv ?? {});
  if (options.enableRealBlurHandling) {
    env.LITELAUNCHER_E2E_REAL_BLUR = "1";
  }
  const electronApp = await electron.launch({
    cwd: launchCwd,
    executablePath,
    args: launchArgs,
    env
  });

  const page = await waitForLauncherPage(electronApp);
  await page.bringToFront();
  await waitForRendererBootstrap(page);
  await waitForMode(page, "search");

  return {
    electronApp,
    page,
    close: async () => {
      await electronApp.close();
      if (cleanupUserDataDir) {
        await removeDirectoryWithRetry(userDataDir);
      }
    }
  };
}

export async function openPluginFromSearch(
  page: Page,
  query: string,
  title: string,
  pluginId: string
): Promise<void> {
  const previousStatusText = await page.evaluate(
    () => document.querySelector<HTMLElement>("#status-text")?.textContent?.trim() ?? ""
  );
  const searchInput = page.locator("#search-input");
  await searchInput.click();
  await searchInput.fill(query);

  const commandResultsHost = page.locator("#command-results");
  const commandResult = page.locator(".command-result").filter({ hasText: title }).first();
  const resultTile = page
    .locator(".result-item.result-tile")
    .filter({ hasText: title })
    .first();
  const result = (await commandResultsHost.count()) > 0 ? commandResult : resultTile;
  try {
    await result.waitFor({ state: "visible", timeout: 6000 });
  } catch (error) {
    if (result !== commandResult) {
      throw error;
    }

    // Some plugins have Chinese display names but no matching English alias.
    // Fall back to the exact title so Command Center returns an interactive result.
    await searchInput.fill(title);
    await commandResult.waitFor({ state: "visible", timeout: 10000 });
  }
  await result.click();

  await waitForMode(page, "plugin");
  await waitForActivePlugin(page, pluginId);
  await page.waitForFunction(
    (previousText) => {
      const statusText =
        document.querySelector<HTMLElement>("#status-text")?.textContent?.trim() ?? "";
      return statusText.length > 0 && statusText !== previousText;
    },
    previousStatusText,
    { timeout: 10000 }
  );
  await page.waitForFunction(
    (expectedPluginId) =>
      new Promise<boolean>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve(
              document.body.dataset.mode === "plugin" &&
                document.body.dataset.activePluginId === expectedPluginId
            );
          });
        });
      }),
    pluginId,
    { timeout: 10000 }
  );
}

export async function returnToSearch(page: Page): Promise<void> {
  await page.keyboard.press("Escape");
  await waitForMode(page, "search");
}

export async function captureE2EFailureArtifacts(
  page: Page,
  testName: string,
  error?: unknown,
  electronApp?: ElectronApplication
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

  const artifactErrors: string[] = [];

  try {
    await page.screenshot({ path: screenshotPath, fullPage: true, timeout: 5000 });
  } catch (captureError) {
    artifactErrors.push(`screenshot: ${String(captureError)}`);
  }

  try {
    await fs.writeFile(htmlPath, await page.content(), "utf8");
  } catch (captureError) {
    artifactErrors.push(`page-content: ${String(captureError)}`);
  }

  let metadata: {
    url: string | null;
    title: string | null;
    mode: string | null;
    activePluginId: string | null;
    statusText: string | null;
  } = {
    url: null,
    title: null,
    mode: null,
    activePluginId: null,
    statusText: null
  };

  try {
    metadata = await page.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      mode: document.body.dataset.mode ?? null,
      activePluginId: document.body.dataset.activePluginId ?? null,
      statusText:
        document.querySelector<HTMLElement>("#status-text")?.textContent?.trim() ?? null
    }));
  } catch (captureError) {
    artifactErrors.push(`page-metadata: ${String(captureError)}`);
  }

  let mainWindowState: MainWindowSnapshot = null;
  if (electronApp) {
    try {
      mainWindowState = await electronApp.evaluate(({ BrowserWindow }) => {
        const launcherWindow = BrowserWindow.getAllWindows()[0];
        if (!launcherWindow || launcherWindow.isDestroyed()) {
          return null;
        }

        const bounds = launcherWindow.getBounds();
        return {
          isVisible: launcherWindow.isVisible(),
          isFocused: launcherWindow.isFocused(),
          isAlwaysOnTop: launcherWindow.isAlwaysOnTop(),
          bounds: {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height
          }
        };
      });
    } catch (captureError) {
      artifactErrors.push(`main-window-state: ${String(captureError)}`);
    }
  }

  await fs.writeFile(
    metadataPath,
    JSON.stringify(
      {
        testName,
        error:
          error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack ?? null }
            : String(error),
        ...metadata,
        mainWindowState,
        artifactErrors
      },
      null,
      2
    ),
    "utf8"
  );

  return artifactDir;
}
