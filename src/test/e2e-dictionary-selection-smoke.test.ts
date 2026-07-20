import assert from "node:assert/strict";
import test from "node:test";

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
  "electron smoke: selection popup shows dictionary payload and closes",
  { timeout: 180000 },
  async () => {
    const testName =
      "electron smoke: selection popup shows dictionary payload and closes";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    try {
      session = await launchE2ESession();
      const { electronApp } = session;

      await electronApp.evaluate(async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const path = require("node:path") as typeof import("node:path");
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { showSelectionPopup, closeSelectionPopup } = require(
          path.join(process.cwd(), "dist/main/selection-translate/popup-window.js")
        ) as typeof import("../main/selection-translate/popup-window");
        closeSelectionPopup();
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
          { dismissOnOutsideClick: true }
        );
        return true;
      });

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

      await electronApp.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const path = require("node:path") as typeof import("node:path");
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { closeSelectionPopup } = require(
          path.join(process.cwd(), "dist/main/selection-translate/popup-window.js")
        ) as typeof import("../main/selection-translate/popup-window");
        closeSelectionPopup();
        return true;
      });

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
      assert.fail("selection popup window should close");
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
