import assert from "node:assert/strict";
import test from "node:test";

import {
  captureE2EFailureArtifacts,
  launchE2ESession,
  waitForActivePlugin,
  waitForMode
} from "./e2e-test-utils";

test(
  "electron smoke: Hardware Inspector overview, details, refresh and preview modal",
  { timeout: 90_000 },
  async () => {
    const testName = "electron smoke: Hardware Inspector overview, details, refresh and preview modal";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    try {
      session = await launchE2ESession();
      const { page } = session;
      await page.setViewportSize({ width: 960, height: 720 });
      const result = await page.evaluate(async () =>
        window.launcher.execute({
          id: "plugin:hardware-inspector",
          type: "command",
          title: "硬件检测",
          subtitle: "Hardware Inspector E2E",
          target: "command:plugin:hardware-inspector?action=open",
          keywords: ["hardware"]
        })
      );
      assert.equal(result.ok, true);
      await waitForMode(page, "plugin");
      await waitForActivePlugin(page, "hardware-inspector");
      await page.waitForFunction(() => {
        const status = document.querySelector(".hardware-inspector-status");
        return (
          status?.getAttribute("data-state") !== "loading" &&
          document.querySelectorAll(".hardware-inspector-overview-card").length === 6
        );
      }, undefined, { timeout: 30_000 });

      const layout = await page.evaluate(() => {
        const overview = document.querySelector<HTMLElement>(".hardware-inspector-overview");
        const shell = document.querySelector<HTMLElement>(".shell");
        return {
          columns: overview ? getComputedStyle(overview).gridTemplateColumns.split(" ").length : 0,
          overflow: shell ? shell.scrollWidth - shell.clientWidth : 0,
          cpuExpanded:
            document
              .querySelector('[data-section-id="cpu"] .hardware-inspector-section-toggle')
              ?.getAttribute("aria-expanded") === "true",
          memoryExpanded:
            document
              .querySelector('[data-section-id="memory"] .hardware-inspector-section-toggle')
              ?.getAttribute("aria-expanded") === "true",
          gpuExpanded:
            document
              .querySelector('[data-section-id="gpu"] .hardware-inspector-section-toggle')
              ?.getAttribute("aria-expanded") === "true",
          boardExpanded:
            document
              .querySelector('[data-section-id="board"] .hardware-inspector-section-toggle')
              ?.getAttribute("aria-expanded") === "true"
        };
      });
      assert.equal(layout.columns, 3);
      assert.ok(layout.overflow <= 1);
      assert.equal(layout.cpuExpanded, true);
      assert.equal(layout.memoryExpanded, true);
      assert.equal(layout.gpuExpanded, true);
      assert.equal(layout.boardExpanded, false);

      const memoryToggle = page.locator(".hardware-inspector-memory-toggle").first();
      if ((await memoryToggle.count()) > 0) {
        await memoryToggle.click();
        await page.locator(".hardware-inspector-memory-slot").first().waitFor({
          state: "visible",
          timeout: 10_000
        });
      }

      await page.locator(".hardware-inspector-more > summary").click();
      await page.locator('[data-hardware-inspector-open-preview="true"]').click();
      await page.locator(".hardware-inspector-modal-backdrop").waitFor({
        state: "visible",
        timeout: 10_000
      });
      await page.keyboard.press("Escape");
      await page.locator(".hardware-inspector-modal-backdrop").waitFor({
        state: "detached",
        timeout: 10_000
      });

      await page.locator(".hardware-inspector-actions .settings-btn", { hasText: "刷新" }).click();
      assert.equal(await page.locator(".hardware-inspector-overview-card").count(), 6);
      await page.waitForFunction(() => {
        const status = document.querySelector(".hardware-inspector-status");
        return status?.getAttribute("data-state") !== "loading";
      }, undefined, { timeout: 30_000 });
    } catch (error) {
      if (session) {
        await captureE2EFailureArtifacts(session.page, testName).catch(() => undefined);
      }
      throw error;
    } finally {
      await session?.close();
    }
  }
);
