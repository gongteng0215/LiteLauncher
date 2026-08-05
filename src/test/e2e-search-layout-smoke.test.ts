import assert from "node:assert/strict";
import test from "node:test";

import { captureE2EFailureArtifacts, launchE2ESession } from "./e2e-test-utils";

async function waitForCommandCenterHome(
  page: Awaited<ReturnType<typeof launchE2ESession>>["page"]
): Promise<void> {
  const searchInput = page.locator("#search-input");
  await searchInput.fill("plugin:");
  await page.waitForTimeout(180);
  await searchInput.fill("");
  await page
    .locator("#cc-plugins-list .result-item.result-tile")
    .first()
    .waitFor({ state: "visible", timeout: 20000 });
}

test(
  "electron smoke: Command Center home keeps plugin tiles compact without horizontal overflow",
  { timeout: 120000 },
  async () => {
    const testName =
      "electron smoke: Command Center home keeps plugin tiles compact without horizontal overflow";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;

    try {
      session = await launchE2ESession();
      const { page } = session;
      await page.setViewportSize({ width: 1280, height: 640 });

      await waitForCommandCenterHome(page);
      const pluginLayout = await page.evaluate(() => {
        const grid = document.querySelector<HTMLElement>("#cc-plugins-list");
        if (!grid) {
          throw new Error("missing Command Center plugin grid");
        }
        const tileWidths = Array.from(
          grid.querySelectorAll<HTMLElement>(".result-item.result-tile")
        )
          .slice(0, 8)
          .map((tile) => Math.round(tile.getBoundingClientRect().width));
        return {
          tileWidths,
          scrollWidth: grid.scrollWidth,
          clientWidth: grid.clientWidth
        };
      });
      assert.ok(pluginLayout.tileWidths.length > 0, "plugin grid should contain tiles");
      assert.ok(
        pluginLayout.tileWidths.every((width) => width > 0),
        `plugin tile widths should be positive: ${pluginLayout.tileWidths.join(",")}`
      );
      assert.ok(
        pluginLayout.scrollWidth <= pluginLayout.clientWidth + 1,
        "plugin grid should not create horizontal overflow"
      );

      await page.setViewportSize({ width: 900, height: 640 });
      await waitForCommandCenterHome(page);

      const hasHorizontalOverflow = await page.evaluate(() => {
        const shell = document.querySelector<HTMLElement>(".shell");
        return Boolean(shell && shell.scrollWidth > shell.clientWidth + 1);
      });
      assert.equal(
        hasHorizontalOverflow,
        false,
        "search home should not create page-level horizontal overflow"
      );

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
