import assert from "node:assert/strict";
import test from "node:test";

import {
  captureE2EFailureArtifacts,
  launchE2ESession
} from "./e2e-test-utils";

type E2ESession = Awaited<ReturnType<typeof launchE2ESession>>;

type MainWindowState = {
  isVisible: boolean;
  isFocused: boolean;
  isAlwaysOnTop: boolean;
};

async function readMainWindowState(session: E2ESession): Promise<MainWindowState | null> {
  return session.electronApp.evaluate(({ BrowserWindow }) => {
    const launcherWindow = BrowserWindow.getAllWindows()[0];
    if (!launcherWindow || launcherWindow.isDestroyed()) {
      return null;
    }

    return {
      isVisible: launcherWindow.isVisible(),
      isFocused: launcherWindow.isFocused(),
      isAlwaysOnTop: launcherWindow.isAlwaysOnTop()
    };
  });
}

async function waitForMainWindowState(
  session: E2ESession,
  predicate: (state: MainWindowState | null) => boolean,
  timeoutMs = 10000
): Promise<MainWindowState | null> {
  const startedAt = Date.now();
  let lastState: MainWindowState | null = null;

  while (Date.now() - startedAt < timeoutMs) {
    lastState = await readMainWindowState(session);
    if (predicate(lastState)) {
      return lastState;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  throw new Error(
    `Timed out waiting for launcher window state: ${JSON.stringify(lastState)}`
  );
}

test(
  "electron smoke: launcher window stays topmost after hide and show recovery",
  { timeout: 120000 },
  async () => {
    const testName =
      "electron smoke: launcher window stays topmost after hide and show recovery";
    let session: E2ESession | null = null;

    try {
      session = await launchE2ESession();
      const { page } = session;

      const initialState = await waitForMainWindowState(
        session,
        (state) => Boolean(state?.isVisible && state.isAlwaysOnTop)
      );
      assert.equal(
        initialState?.isVisible,
        true,
        "launcher should be visible immediately after E2E bootstrap"
      );
      assert.equal(
        initialState?.isAlwaysOnTop,
        true,
        "launcher should start in always-on-top mode"
      );

      const hideResult = await page.evaluate(async () => {
        return window.launcher.hide();
      });
      assert.equal(hideResult, true, "renderer hide action should succeed");

      await waitForMainWindowState(
        session,
        (state) => Boolean(state && !state.isVisible)
      );

      const showResult = await session.electronApp.evaluate(({ BrowserWindow }) => {
        const launcherWindow = BrowserWindow.getAllWindows()[0];
        if (!launcherWindow || launcherWindow.isDestroyed()) {
          return false;
        }

        launcherWindow.show();
        launcherWindow.setAlwaysOnTop(true);
        launcherWindow.moveTop();
        launcherWindow.focus();
        launcherWindow.webContents.focus();
        return true;
      });
      assert.equal(showResult, true, "main process should be able to re-show the launcher");

      await page.locator("#search-input").waitFor({ state: "visible", timeout: 10000 });
      const recoveredState = await waitForMainWindowState(
        session,
        (state) => Boolean(state?.isVisible && state.isAlwaysOnTop)
      );
      assert.equal(
        recoveredState?.isVisible,
        true,
        "launcher should become visible again after recovery show"
      );
      assert.equal(
        recoveredState?.isAlwaysOnTop,
        true,
        "launcher should keep always-on-top after recovery show"
      );
    } catch (error) {
      if (session) {
        const artifactDir = await captureE2EFailureArtifacts(
          session.page,
          testName,
          error
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
