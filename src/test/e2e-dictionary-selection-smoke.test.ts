import assert from "node:assert/strict";
import test from "node:test";

import { calculateSelectionPopupBounds } from "../shared/selection-translate";
import {
  captureE2EFailureArtifacts,
  launchE2ESession,
  openPluginFromSearch,
  returnToSearch
} from "./e2e-test-utils";

test(
  "electron smoke: dictionary panel english and chinese lookup",
  { timeout: 180000 },
  async () => {
    const testName = "electron smoke: dictionary panel english and chinese lookup";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    try {
      session = await launchE2ESession();
      const { page } = session;

      await openPluginFromSearch(page, "词典", "离线词典", "dictionary");
      const form = page.locator("form.dictionary-form");
      await form.waitFor({ state: "visible", timeout: 10000 });

      const queryInput = form.locator("#dictionary-query");
      await queryInput.fill("apple");
      await form.evaluate((node) => (node as HTMLFormElement).requestSubmit());
      await page.waitForFunction(() => {
        const card = document.querySelector("#dictionary-result-card") as HTMLElement | null;
        const word = card?.querySelector(".translate-dictionary-card__word");
        return Boolean(
          card &&
            !card.hidden &&
            word &&
            /apple/i.test(word.textContent ?? "")
        );
      });

      await queryInput.fill("苹果");
      await form.evaluate((node) => (node as HTMLFormElement).requestSubmit());
      await page.waitForFunction(() => {
        const card = document.querySelector("#dictionary-result-card") as HTMLElement | null;
        const word = card?.querySelector(".translate-dictionary-card__word");
        const status =
          document.querySelector<HTMLElement>("#status-text")?.textContent ?? "";
        return Boolean(
          (card && !card.hidden && word && (word.textContent ?? "").trim()) ||
            /离线词典|未收录|释义/.test(status)
        );
      });

      const hasResult = await page.evaluate(() => {
        const card = document.querySelector("#dictionary-result-card") as HTMLElement | null;
        return Boolean(card && !card.hidden);
      });
      assert.equal(hasResult, true, "Chinese reverse lookup should show a dictionary card");

      await returnToSearch(page);
    } catch (error) {
      if (session) {
        await captureE2EFailureArtifacts(session.page, testName, error, session.electronApp);
      }
      throw error;
    } finally {
      await session?.close();
    }
  }
);

test(
  "electron smoke: selection popup anchors to the trigger point and closes on outside focus",
  { timeout: 180000 },
  async () => {
    const testName =
      "electron smoke: selection popup shows dictionary payload and closes";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    try {
      session = await launchE2ESession();
      const { electronApp } = session;

      const popupLaunch = await electronApp.evaluate(async ({ BrowserWindow, screen }) => {
        const moduleApi = process.getBuiltinModule("module") as typeof import("node:module");
        const appRequire = moduleApi.createRequire(`${process.cwd()}\\package.json`);
        const path = appRequire("node:path") as typeof import("node:path");
        const { showSelectionPopup, closeSelectionPopup } = appRequire(
          path.join(process.cwd(), "dist/main/selection-translate/popup-window.js")
        ) as typeof import("../main/selection-translate/popup-window");
        closeSelectionPopup();
        const { workArea } = screen.getPrimaryDisplay();
        const anchorPoint = { x: workArea.x + 48, y: workArea.y + 48 };
        await showSelectionPopup(
          {
            mode: "dictionary",
            sourceText: "apple",
            entry: {
              word: "apple",
              phonetic: "ˈæpl",
              translation: "n. 苹果",
              definition: "a fruit",
              pos: "n",
              tags: "",
              collins: 1,
              oxford: 1,
              exchange: ""
            }
          },
          { dismissOnOutsideClick: true, anchorPoint }
        );
        const popup = BrowserWindow.getAllWindows().find((window) =>
          window.webContents.getURL().includes("selection-popup.html")
        );
        if (!popup) {
          throw new Error("selection popup should exist after showSelectionPopup resolves");
        }
        return { anchorPoint, bounds: popup.getBounds() };
      });
      assert.equal(
        popupLaunch.bounds.x,
        popupLaunch.anchorPoint.x + 16,
        "popup should use the cursor location captured when the selection hotkey was pressed"
      );
      assert.equal(
        popupLaunch.bounds.y,
        popupLaunch.anchorPoint.y + 16,
        "popup should use the cursor location captured when the selection hotkey was pressed"
      );

      const startedAt = Date.now();
      let popupPage = null as Awaited<
        ReturnType<typeof electronApp.windows>
      >[number] | null;
      while (Date.now() - startedAt < 15000) {
        popupPage =
          electronApp
            .windows()
            .find((item) => item.url().includes("selection-popup.html")) ?? null;
        if (popupPage) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      assert.ok(popupPage, "selection popup window should open");
      await popupPage.waitForLoadState("domcontentloaded");
      await popupPage.waitForFunction(() => {
        const root = document.querySelector(".selection-popup");
        return Boolean(root && /apple/i.test(root.textContent ?? ""));
      });

      const focusedBackdrop = await electronApp.evaluate(({ BrowserWindow }) => {
        const backdrop = BrowserWindow.getAllWindows().find((window) =>
          window.webContents.getURL().includes("selection-backdrop.html")
        );
        if (!backdrop) {
          return false;
        }
        backdrop.focus();
        return true;
      });
      assert.equal(focusedBackdrop, true, "dismiss backdrop window should exist");

      const closedAt = Date.now();
      while (Date.now() - closedAt < 10000) {
        const stillOpen = electronApp
          .windows()
          .some((item) => item.url().includes("selection-popup.html"));
        if (!stillOpen) {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      assert.fail("selection popup window should close after the outside backdrop gains focus");
    } catch (error) {
      if (session) {
        await captureE2EFailureArtifacts(session.page, testName, error, session.electronApp);
      }
      throw error;
    } finally {
      await session?.close();
    }
  }
);

test(
  "electron smoke: selection popup flips at display edges and ignores a stale open request",
  { timeout: 180000 },
  async () => {
    const testName =
      "electron smoke: selection popup flips at display edges and ignores a stale open request";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    try {
      session = await launchE2ESession();
      const { electronApp } = session;

      const popupLaunch = await electronApp.evaluate(async ({ BrowserWindow, screen }) => {
        const moduleApi = process.getBuiltinModule("module") as typeof import("node:module");
        const appRequire = moduleApi.createRequire(`${process.cwd()}\\package.json`);
        const path = appRequire("node:path") as typeof import("node:path");
        const { showSelectionPopup, closeSelectionPopup } = appRequire(
          path.join(process.cwd(), "dist/main/selection-translate/popup-window.js")
        ) as typeof import("../main/selection-translate/popup-window");
        closeSelectionPopup();
        const { workArea } = screen.getPrimaryDisplay();
        const anchorPoint = {
          x: workArea.x + workArea.width - 8,
          y: workArea.y + workArea.height - 8
        };
        await Promise.all([
          showSelectionPopup(
            {
              mode: "dictionary",
              sourceText: "first",
              entry: {
                word: "first",
                phonetic: "fɜːst",
                translation: "第一",
                definition: "before all others",
                pos: "adj",
                tags: "",
                collins: 1,
                oxford: 1,
                exchange: ""
              }
            },
            {
              dismissOnOutsideClick: false,
              anchorPoint: { x: workArea.x + 48, y: workArea.y + 48 }
            }
          ),
          showSelectionPopup(
            {
              mode: "dictionary",
              sourceText: "second",
              entry: {
                word: "second",
                phonetic: "ˈsekənd",
                translation: "第二",
                definition: "after another entry",
                pos: "adj",
                tags: "",
                collins: 1,
                oxford: 1,
                exchange: ""
              },
              candidates: [
                {
                  word: "second",
                  phonetic: "ˈsekənd",
                  translation: "第二",
                  definition: "after another entry",
                  pos: "adj",
                  tags: "",
                  collins: 1,
                  oxford: 1,
                  exchange: ""
                },
                {
                  word: "secondary",
                  phonetic: "ˈsekəndri",
                  translation: "次要的",
                  definition: "less important",
                  pos: "adj",
                  tags: "",
                  collins: 1,
                  oxford: 1,
                  exchange: ""
                }
              ]
            },
            { dismissOnOutsideClick: false, anchorPoint }
          )
        ]);
        const popup = BrowserWindow.getAllWindows().find((window) =>
          window.webContents.getURL().includes("selection-popup.html")
        );
        if (!popup) {
          throw new Error("selection popup should exist after concurrent opens");
        }
        return { anchorPoint, workArea, bounds: popup.getBounds() };
      });

      assert.deepEqual(
        popupLaunch.bounds,
        calculateSelectionPopupBounds(
          popupLaunch.anchorPoint,
          { width: 420, height: 480 },
          popupLaunch.workArea
        ),
        "edge placement should flip before clamping the popup to the display"
      );

      const popupPage = electronApp
        .windows()
        .find((item) => item.url().includes("selection-popup.html"));
      assert.ok(popupPage, "selection popup window should remain open");
      await popupPage.waitForLoadState("domcontentloaded");
      await popupPage.waitForFunction(() => /second/i.test(document.body.textContent ?? ""));
      assert.doesNotMatch(
        await popupPage.locator("body").innerText(),
        /first/i,
        "the stale popup request must not replace the newest payload"
      );

      await electronApp.evaluate(() => {
        const moduleApi = process.getBuiltinModule("module") as typeof import("node:module");
        const appRequire = moduleApi.createRequire(`${process.cwd()}\\package.json`);
        const path = appRequire("node:path") as typeof import("node:path");
        const { closeSelectionPopup } = appRequire(
          path.join(process.cwd(), "dist/main/selection-translate/popup-window.js")
        ) as typeof import("../main/selection-translate/popup-window");
        closeSelectionPopup();
      });
    } catch (error) {
      if (session) {
        await captureE2EFailureArtifacts(session.page, testName, error, session.electronApp);
      }
      throw error;
    } finally {
      await session?.close();
    }
  }
);
