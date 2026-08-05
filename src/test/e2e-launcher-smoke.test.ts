import assert from "node:assert/strict";
import test from "node:test";

import {
  captureE2EFailureArtifacts,
  launchE2ESession,
  openPluginFromSearch,
  returnToSearch,
  waitForMode,
  waitForSettingsPanel
} from "./e2e-test-utils";

type E2ESession = Awaited<ReturnType<typeof launchE2ESession>>;

async function blurLauncherWindow(
  session: E2ESession
): Promise<void> {
  const didBlur = await session.electronApp.evaluate(async ({ BrowserWindow }) => {
    const launcherWindow = BrowserWindow.getAllWindows()[0];
    if (!launcherWindow || launcherWindow.isDestroyed()) {
      return false;
    }

    const helperWindow = new BrowserWindow({
      show: false,
      width: 240,
      height: 120,
      frame: false,
      focusable: true,
      alwaysOnTop: true
    });

    helperWindow.once("closed", () => {
      if (!launcherWindow.isDestroyed()) {
        launcherWindow.webContents.send("e2e-helper-window-closed", null);
      }
    });

    helperWindow.loadURL("data:text/html,<html><body>blur-helper</body></html>");
    await new Promise<void>((resolve) => {
      helperWindow.webContents.once("did-finish-load", () => resolve());
    });

    helperWindow.show();
    helperWindow.focus();
    helperWindow.moveTop();

    const startedAt = Date.now();
    while (Date.now() - startedAt < 2000) {
      if (launcherWindow.isDestroyed()) {
        helperWindow.close();
        return false;
      }
      if (!launcherWindow.isFocused()) {
        helperWindow.close();
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    helperWindow.close();
    return false;
  });

  assert.equal(didBlur, true, "helper window should force the launcher into a real blurred state");
}

async function openCashflowFromSearch(
  page: E2ESession["page"]
): Promise<void> {
  const searchInput = page.locator("#search-input");
  await searchInput.click();
  await searchInput.fill("cashflow");

  const result = page
    .locator(".command-result")
    .filter({ hasText: "富爸爸现金流" })
    .first();
  await result.waitFor({ state: "visible", timeout: 10000 });
  await result.click();

  await waitForMode(page, "cashflow");
  await page.locator(".cashflow-panel").waitFor({ state: "visible", timeout: 10000 });
}

async function waitForLauncherVisibility(
  session: E2ESession,
  expectedVisible: boolean,
  timeoutMs = 10000
): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const isVisible = await session.electronApp.evaluate(({ BrowserWindow }) => {
      const launcherWindow = BrowserWindow.getAllWindows()[0];
      if (!launcherWindow || launcherWindow.isDestroyed()) {
        return false;
      }
      return launcherWindow.isVisible();
    });

    if (isVisible === expectedVisible) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  throw new Error(`Timed out waiting for launcher visibility=${String(expectedVisible)}`);
}

test(
  "electron smoke: launch window, open settings, search and open JSON plugin",
  { timeout: 120000 },
  async () => {
    const testName = "electron smoke: launch window, open settings, search and open JSON plugin";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    try {
      session = await launchE2ESession();
      const { page } = session;

      const searchInput = page.locator("#search-input");
      const settingsButton = page.locator("#settings-shortcut-btn");
      const statusText = page.locator("#status-text");

      await assert.doesNotReject(() => searchInput.waitFor({ state: "visible", timeout: 10000 }));
      await settingsButton.click();
      await waitForSettingsPanel(page);
      await page.locator(".cc-settings-header h2", { hasText: "设置中心" }).waitFor({
        state: "visible",
        timeout: 10000
      });

      await returnToSearch(page);
      await openPluginFromSearch(page, "plugin:json", "JSON 工具", "webtools-json");
      await page
        .locator(".webtools-tool-title, .settings-title")
        .filter({ hasText: "JSON & CSV 实验室" })
        .waitFor({ state: "visible", timeout: 10000 });

      await assert.doesNotReject(() =>
        statusText.waitFor({ state: "attached", timeout: 5000 })
      );
      const finalStatus = await statusText.textContent();
      assert.match(finalStatus ?? "", /已打开插件|转换|JSON/);
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
  "electron smoke: plugin panel stays visible after launcher blur and closes with Esc",
  { timeout: 120000 },
  async () => {
    const testName =
      "electron smoke: plugin panel stays visible after launcher blur and closes with Esc";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    try {
      session = await launchE2ESession({ enableRealBlurHandling: true });
      const { page, electronApp } = session;

      await openPluginFromSearch(page, "plugin:json", "JSON 工具", "webtools-json");
      await page
        .locator(".webtools-tool-title, .settings-title")
        .filter({ hasText: "JSON & CSV 实验室" })
        .waitFor({ state: "visible", timeout: 10000 });

      await blurLauncherWindow(session);
      await page.waitForTimeout(600);

      const stillPluginMode = await page.evaluate(
        () => document.body.dataset.mode === "plugin"
      );
      assert.equal(
        stillPluginMode,
        true,
        "plugin panel should remain visible after the launcher window loses focus"
      );

      await page.keyboard.press("Escape");
      await waitForMode(page, "search");
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
  "electron smoke: search mode hides launcher after blur with real blur handling",
  { timeout: 120000 },
  async () => {
    const testName =
      "electron smoke: search mode hides launcher after blur with real blur handling";
    let session: E2ESession | null = null;
    try {
      session = await launchE2ESession({ enableRealBlurHandling: true });
      const { page } = session;

      await page.locator("#search-input").waitFor({ state: "visible", timeout: 10000 });
      await waitForMode(page, "search");

      await blurLauncherWindow(session);
      await waitForLauncherVisibility(session, false);
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
  "electron smoke: settings panel stays visible after launcher blur and closes with Esc",
  { timeout: 120000 },
  async () => {
    const testName =
      "electron smoke: settings panel stays visible after launcher blur and closes with Esc";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    try {
      session = await launchE2ESession({ enableRealBlurHandling: true });
      const { page } = session;

      await page.locator("#settings-shortcut-btn").click();
      await waitForSettingsPanel(page);
      await page.locator(".cc-settings-header h2", { hasText: "设置中心" }).waitFor({
        state: "visible",
        timeout: 10000
      });

      await blurLauncherWindow(session);
      await page.waitForTimeout(600);

      const settingsOverlayStillOpen = await page.evaluate(
        () => Boolean(document.querySelector(".cc-settings-overlay-dialog"))
      );
      assert.equal(
        settingsOverlayStillOpen,
        true,
        "settings overlay should remain visible after the launcher window loses focus"
      );

      await page.keyboard.press("Escape");
      await page.locator(".cc-settings-overlay-dialog").waitFor({
        state: "hidden",
        timeout: 10000
      });
      await waitForMode(page, "search");
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
  "electron smoke: cashflow panel stays visible after launcher blur and closes with Esc",
  { timeout: 120000 },
  async () => {
    const testName =
      "electron smoke: cashflow panel stays visible after launcher blur and closes with Esc";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    try {
      session = await launchE2ESession({ enableRealBlurHandling: true });
      const { page } = session;

      await openCashflowFromSearch(page);
      await blurLauncherWindow(session);
      await page.waitForTimeout(600);

      const stillCashflowMode = await page.evaluate(
        () => document.body.dataset.mode === "cashflow"
      );
      assert.equal(
        stillCashflowMode,
        true,
        "cashflow panel should remain visible after the launcher window loses focus"
      );

      await page.keyboard.press("Escape");
      await waitForMode(page, "search");
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
