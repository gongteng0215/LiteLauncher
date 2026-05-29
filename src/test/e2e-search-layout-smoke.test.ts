import assert from "node:assert/strict";
import test from "node:test";

import { LaunchItem } from "../shared/types";
import {
  captureE2EFailureArtifacts,
  launchE2ESession,
  returnToSearch,
  waitForMode
} from "./e2e-test-utils";

const SECTION_IDS = ["recent", "pinned", "plugin"] as const;

const SEED_PLUGIN_ITEMS: LaunchItem[] = [
  {
    id: "plugin:webtools-json",
    type: "command",
    title: "JSON 工具",
    subtitle: "JSON & CSV 实验室",
    target: "command:plugin:webtools-json?action=open",
    keywords: ["plugin", "json"]
  },
  {
    id: "plugin:webtools-password",
    type: "command",
    title: "密码工具",
    subtitle: "密码生成器",
    target: "command:plugin:webtools-password?action=open",
    keywords: ["plugin", "password"]
  },
  {
    id: "plugin:webtools-cron",
    type: "command",
    title: "Cron 生成器",
    subtitle: "Cron 表达式",
    target: "command:plugin:webtools-cron?action=open",
    keywords: ["plugin", "cron"]
  }
];

type SectionLayout = {
  tileCount: number;
  tileWidths: number[];
  firstRowOffsets: number[];
};

async function executeSeedItem(page: Awaited<ReturnType<typeof launchE2ESession>>["page"], item: LaunchItem): Promise<void> {
  const result = await page.evaluate(async (seedItem) => {
    return window.launcher.execute(seedItem);
  }, item);

  assert.equal(result.ok, true, `failed to execute seed item ${item.id}`);
  await waitForMode(page, "plugin");
  await returnToSearch(page);
}

async function refreshSearchHome(page: Awaited<ReturnType<typeof launchE2ESession>>["page"]): Promise<void> {
  const searchInput = page.locator("#search-input");
  await searchInput.fill("plugin:");
  await searchInput.fill("");
  await waitForMode(page, "search");
}

async function waitForSearchSections(page: Awaited<ReturnType<typeof launchE2ESession>>["page"]): Promise<void> {
  await page.waitForFunction(
    (sectionIds) =>
      sectionIds.every(
        (sectionId) =>
          document.querySelectorAll(
            `.section-grid[data-section-id="${sectionId}"] .result-item.result-tile`
          ).length > 0
      ),
    [...SECTION_IDS],
    { timeout: 10000 }
  );
}

async function collectSectionLayouts(
  page: Awaited<ReturnType<typeof launchE2ESession>>["page"]
): Promise<Record<(typeof SECTION_IDS)[number], SectionLayout>> {
  return page.evaluate((sectionIds) => {
    const result: Record<string, SectionLayout> = {};

    for (const sectionId of sectionIds) {
      const grid = document.querySelector<HTMLElement>(
        `.section-grid[data-section-id="${sectionId}"]`
      );
      if (!grid) {
        throw new Error(`missing section grid: ${sectionId}`);
      }

      const tiles = Array.from(
        grid.querySelectorAll<HTMLElement>(".result-item.result-tile")
      );
      const tileRects = tiles.map((tile) => tile.getBoundingClientRect());
      const gridRect = grid.getBoundingClientRect();
      const firstRowTop = tileRects[0]?.top ?? 0;
      const firstRowRects = tileRects.filter(
        (rect) => Math.abs(rect.top - firstRowTop) < 2
      );

      result[sectionId] = {
        tileCount: tiles.length,
        tileWidths: tileRects.slice(0, 6).map((rect) => Math.round(rect.width)),
        firstRowOffsets: firstRowRects
          .slice(0, 6)
          .map((rect) => Math.round(rect.left - gridRect.left))
      };
    }

    return result as Record<(typeof SECTION_IDS)[number], SectionLayout>;
  }, [...SECTION_IDS]);
}

test(
  "electron smoke: search home sections share the same compact tile grid",
  { timeout: 120000 },
  async () => {
    const testName =
      "electron smoke: search home sections share the same compact tile grid";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;

    try {
      session = await launchE2ESession();
      const { page } = session;
      await page.setViewportSize({ width: 1280, height: 640 });

      for (const item of SEED_PLUGIN_ITEMS) {
        await executeSeedItem(page, item);
      }

      const pinResults = await page.evaluate(async (itemIds) => {
        const results = [];
        for (const itemId of itemIds) {
          results.push(await window.launcher.setItemPinned(itemId, true));
        }
        return results;
      }, SEED_PLUGIN_ITEMS.map((item) => item.id));

      for (const result of pinResults) {
        assert.equal(result.ok, true, "pinning should succeed in the live Electron shell");
        assert.equal(result.pinned, true, "live pin result should report pinned=true");
      }

      await refreshSearchHome(page);
      await waitForSearchSections(page);

      const layout = await collectSectionLayouts(page);
      for (const sectionId of SECTION_IDS) {
        assert.ok(layout[sectionId].tileCount > 0, `${sectionId} has no tiles`);
        assert.ok(
          layout[sectionId].tileWidths.every((width) => width === 64),
          `${sectionId} tile widths changed: ${layout[sectionId].tileWidths.join(",")}`
        );
      }

      const recentOffsets = layout.recent.firstRowOffsets;
      for (const sectionId of ["pinned", "plugin"] as const) {
        const compareCount = Math.min(
          recentOffsets.length,
          layout[sectionId].firstRowOffsets.length
        );
        assert.deepEqual(
          layout[sectionId].firstRowOffsets.slice(0, compareCount),
          recentOffsets.slice(0, compareCount),
          `${sectionId} grid columns do not align with recent`
        );
      }

      await page.setViewportSize({ width: 900, height: 640 });
      await refreshSearchHome(page);
      await waitForSearchSections(page);

      const hasHorizontalOverflow = await page.evaluate(() => {
        const shell = document.querySelector<HTMLElement>(".shell");
        return Boolean(shell && shell.scrollWidth > shell.clientWidth + 1);
      });
      assert.equal(
        hasHorizontalOverflow,
        false,
        "search home should not create page-level horizontal overflow"
      );

      const sectionFitsViewport = await page.evaluate(() => {
        return Array.from(document.querySelectorAll<HTMLElement>(".section-block")).every(
          (node) => node.getBoundingClientRect().right <= window.innerWidth + 1
        );
      });
      assert.equal(
        sectionFitsViewport,
        true,
        "search sections should stay within the viewport"
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
