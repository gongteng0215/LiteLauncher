import assert from "node:assert/strict";
import test from "node:test";

import {
  captureE2EFailureArtifacts,
  launchE2ESession,
  openPluginFromSearch,
  returnToSearch,
  waitForSettingsPanel
} from "./e2e-test-utils";

type LayoutAudit = {
  horizontalOverflow: boolean;
  clippedControls: string[];
};

async function auditVisibleLayout(
  page: Awaited<ReturnType<typeof launchE2ESession>>["page"]
): Promise<LayoutAudit> {
  return page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>(".shell");
    const clippedControls = Array.from(
      document.querySelectorAll<HTMLElement>(
        "button, input, select, textarea, label, legend, .settings-section-title, .webtools-tool-title"
      )
    )
      .filter((node) => {
        const rect = node.getBoundingClientRect();
        const style = window.getComputedStyle(node);
        if (
          rect.width <= 0 ||
          rect.height <= 0 ||
          style.display === "none" ||
          style.visibility === "hidden"
        ) {
          return false;
        }
        return (
          node.scrollWidth > node.clientWidth + 2 &&
          style.whiteSpace === "nowrap" &&
          style.overflowX !== "visible"
        );
      })
      .slice(0, 10)
      .map((node) =>
        `${node.tagName.toLowerCase()}:${node.textContent?.trim().slice(0, 30) || node.getAttribute("aria-label") || node.getAttribute("name") || "unnamed"}`
      );

    return {
      horizontalOverflow: Boolean(shell && shell.scrollWidth > shell.clientWidth + 1),
      clippedControls
    };
  });
}

for (const deviceScaleFactor of [1.25, 1.5]) {
  test(
    `electron smoke: core layouts remain usable at ${deviceScaleFactor * 100}% DPI`,
    { timeout: 120000 },
    async () => {
      const testName = `electron smoke: core layouts remain usable at ${deviceScaleFactor * 100}% DPI`;
      let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
      try {
        session = await launchE2ESession({ deviceScaleFactor });
        const { page } = session;
        await page.setViewportSize({ width: 960, height: 720 });

        const ratio = await page.evaluate(() => window.devicePixelRatio);
        assert.ok(
          Math.abs(ratio - deviceScaleFactor) < 0.08,
          `expected devicePixelRatio ${deviceScaleFactor}, received ${ratio}`
        );

        let audit = await auditVisibleLayout(page);
        assert.equal(audit.horizontalOverflow, false, "search shell overflows horizontally");
        assert.deepEqual(audit.clippedControls, [], "search shell clips visible controls");

        await page.locator("#settings-shortcut-btn").click();
        await waitForSettingsPanel(page);
        audit = await auditVisibleLayout(page);
        assert.equal(audit.horizontalOverflow, false, "settings shell overflows horizontally");
        assert.deepEqual(audit.clippedControls, [], "settings shell clips visible controls");
        await page.keyboard.press("Escape");

        await openPluginFromSearch(
          page,
          "plugin:http mock",
          "HTTP Mock Server",
          "webtools-http-mock"
        );
        audit = await auditVisibleLayout(page);
        assert.equal(audit.horizontalOverflow, false, "HTTP Mock panel overflows horizontally");
        assert.deepEqual(audit.clippedControls, [], "HTTP Mock panel clips visible controls");
        await returnToSearch(page);

        await openPluginFromSearch(page, "plugin:litesnap", "截图贴图", "litesnap");
        audit = await auditVisibleLayout(page);
        assert.equal(audit.horizontalOverflow, false, "LiteSnap panel overflows horizontally");
        assert.deepEqual(audit.clippedControls, [], "LiteSnap panel clips visible controls");
      } catch (error) {
        if (session) {
          const artifactDir = await captureE2EFailureArtifacts(
            session.page,
            testName,
            error,
            session.electronApp
          );
          console.error(`[e2e] failure artifacts: ${artifactDir}`);
        }
        throw error;
      } finally {
        await session?.close();
      }
    }
  );
}
