import assert from "node:assert/strict";
import test from "node:test";

import {
  captureE2EFailureArtifacts,
  launchE2ESession,
  openPluginFromSearch,
  returnToSearch
} from "./e2e-test-utils";

type StackMetrics = {
  count: number;
  lefts: number[];
  tops: number[];
};

async function assertFormFitsViewport(
  page: Awaited<ReturnType<typeof launchE2ESession>>["page"],
  selector: string
): Promise<void> {
  const form = page.locator(selector);
  await assert.doesNotReject(() =>
    form.waitFor({ state: "visible", timeout: 10000 })
  );
  const fits = await form.evaluate(
    (node) => node.getBoundingClientRect().right <= window.innerWidth + 1
  );
  assert.equal(fits, true, `${selector} overflows viewport`);
}

async function assertPageHasNoHorizontalOverflow(
  page: Awaited<ReturnType<typeof launchE2ESession>>["page"],
  label: string
): Promise<void> {
  const hasHorizontalOverflow = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>(".shell");
    return Boolean(shell && shell.scrollWidth > shell.clientWidth + 1);
  });
  assert.equal(
    hasHorizontalOverflow,
    false,
    `${label} creates page-level horizontal overflow`
  );
}

async function collectStackMetrics(
  page: Awaited<ReturnType<typeof launchE2ESession>>["page"],
  containerSelector: string,
  itemSelector: string
): Promise<StackMetrics> {
  return page.evaluate(
    ({ containerSelector: containerQuery, itemSelector: itemQuery }) => {
      const container = document.querySelector<HTMLElement>(containerQuery);
      if (!container) {
        throw new Error(`missing container: ${containerQuery}`);
      }

      const nodes = Array.from(
        container.querySelectorAll<HTMLElement>(itemQuery)
      ).filter((node) => {
        const rect = node.getBoundingClientRect();
        const style = window.getComputedStyle(node);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          !node.hidden
        );
      });

      const rects = nodes.slice(0, 4).map((node) => node.getBoundingClientRect());
      const containerRect = container.getBoundingClientRect();

      return {
        count: nodes.length,
        lefts: rects.map((rect) => Math.round(rect.left - containerRect.left)),
        tops: rects.map((rect) => Math.round(rect.top - containerRect.top))
      };
    },
    { containerSelector, itemSelector }
  );
}

function assertSingleColumnStack(label: string, metrics: StackMetrics): void {
  assert.ok(metrics.count >= 2, `${label} should render at least two visible items`);
  const [firstLeft, ...restLefts] = metrics.lefts;
  assert.ok(
    restLefts.every((left) => Math.abs(left - firstLeft) <= 3),
    `${label} should align into one column: ${metrics.lefts.join(",")}`
  );
  const [firstTop, secondTop] = metrics.tops;
  assert.ok(
    secondTop > firstTop + 6,
    `${label} second item should sit below the first: ${metrics.tops.join(",")}`
  );
}

async function assertStackedPair(
  page: Awaited<ReturnType<typeof launchE2ESession>>["page"],
  containerSelector: string,
  firstSelector: string,
  secondSelector: string,
  label: string
): Promise<void> {
  const pair = await page.evaluate(
    ({
      containerSelector: containerQuery,
      firstSelector: firstQuery,
      secondSelector: secondQuery
    }) => {
      const container = document.querySelector<HTMLElement>(containerQuery);
      const first = document.querySelector<HTMLElement>(firstQuery);
      const second = document.querySelector<HTMLElement>(secondQuery);
      if (!container || !first || !second) {
        throw new Error(`missing stacked pair: ${containerQuery}`);
      }

      const containerRect = container.getBoundingClientRect();
      const firstRect = first.getBoundingClientRect();
      const secondRect = second.getBoundingClientRect();

      return {
        firstLeft: Math.round(firstRect.left - containerRect.left),
        secondLeft: Math.round(secondRect.left - containerRect.left),
        firstTop: Math.round(firstRect.top - containerRect.top),
        secondTop: Math.round(secondRect.top - containerRect.top)
      };
    },
    { containerSelector, firstSelector, secondSelector }
  );

  assert.ok(
    Math.abs(pair.firstLeft - pair.secondLeft) <= 6,
    `${label} should align vertically: ${pair.firstLeft},${pair.secondLeft}`
  );
  assert.ok(
    pair.secondTop > pair.firstTop + 8,
    `${label} should stack vertically: ${pair.firstTop},${pair.secondTop}`
  );
}

test(
  "electron smoke: selected plugin panels keep compact stacked geometry at narrow width",
  { timeout: 180000 },
  async () => {
    const testName =
      "electron smoke: selected plugin panels keep compact stacked geometry at narrow width";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;

    try {
      session = await launchE2ESession();
      const { page } = session;

      await page.setViewportSize({ width: 620, height: 720 });

      await openPluginFromSearch(page, "plugin:crypto", "加密工具", "webtools-crypto");
      await assertFormFitsViewport(page, "form.webtools-crypto-form");
      await assertPageHasNoHorizontalOverflow(page, "crypto panel");
      assertSingleColumnStack(
        "crypto editors",
        await collectStackMetrics(page, ".webtools-crypto-editors", ".webtools-crypto-pane")
      );
      await returnToSearch(page);

      await openPluginFromSearch(page, "plugin:password", "密码工具", "webtools-password");
      await assertFormFitsViewport(page, "form.webtools-password-form");
      await page.waitForFunction(() => {
        return (
          document.querySelectorAll(".webtools-password-workbench > *").length >= 2 &&
          document.querySelectorAll(".webtools-password-control-grid > *").length >= 2
        );
      }, undefined, { timeout: 10000 });
      await assertPageHasNoHorizontalOverflow(page, "password panel");
      assertSingleColumnStack(
        "password workbench",
        await collectStackMetrics(
          page,
          ".webtools-password-workbench",
          ".webtools-password-workbench > *"
        )
      );
      assertSingleColumnStack(
        "password control grid",
        await collectStackMetrics(
          page,
          ".webtools-password-control-grid",
          ".webtools-password-control-grid > *"
        )
      );
      await returnToSearch(page);

      await openPluginFromSearch(page, "plugin:jwt", "JWT 调试器", "webtools-jwt");
      await assertFormFitsViewport(page, "form.webtools-jwt-form");
      await assertPageHasNoHorizontalOverflow(page, "jwt panel");
      assertSingleColumnStack(
        "jwt panes",
        await collectStackMetrics(page, ".webtools-jwt-layout", ".webtools-jwt-pane")
      );
      await returnToSearch(page);

      await openPluginFromSearch(page, "plugin:json", "JSON 工具", "webtools-json");
      await assertFormFitsViewport(page, "form.webtools-json-form");
      await page.waitForFunction(() => {
        return (
          document.querySelectorAll(".webtools-json-control-panel > *").length >= 4 &&
          document.querySelectorAll(".webtools-json-shell > *").length >= 2
        );
      }, undefined, { timeout: 10000 });
      await assertPageHasNoHorizontalOverflow(page, "json panel");
      assertSingleColumnStack(
        "json control panel",
        await collectStackMetrics(
          page,
          ".webtools-json-control-panel",
          ".webtools-json-control-panel > *"
        )
      );
      assertSingleColumnStack(
        "json editors",
        await collectStackMetrics(page, ".webtools-json-shell", ".webtools-json-shell > *")
      );
      await returnToSearch(page);

      await openPluginFromSearch(page, "plugin:cron", "Cron 生成器", "webtools-cron");
      await assertFormFitsViewport(page, "form.webtools-cron-form");
      await page.waitForFunction(() => {
        return (
          document.querySelectorAll(".webtools-cron-workspace > *").length >= 2 &&
          document.querySelector(".webtools-cron-guide-section")
        );
      }, undefined, { timeout: 10000 });
      await assertPageHasNoHorizontalOverflow(page, "cron panel");
      assertSingleColumnStack(
        "cron workspace",
        await collectStackMetrics(
          page,
          ".webtools-cron-workspace",
          ".webtools-cron-workspace > *"
        )
      );
      await assertStackedPair(
        page,
        "form.webtools-cron-form",
        ".webtools-cron-workspace",
        ".webtools-cron-guide-section",
        "cron guide rail"
      );
      await returnToSearch(page);

      await openPluginFromSearch(page, "plugin:ua", "UA 解析", "webtools-ua");
      await assertFormFitsViewport(page, "form.webtools-ua-form");
      await page.waitForFunction(() => {
        return document.querySelectorAll(".webtools-ua-card").length >= 3;
      }, undefined, { timeout: 10000 });
      await assertPageHasNoHorizontalOverflow(page, "ua panel");
      assertSingleColumnStack(
        "ua cards",
        await collectStackMetrics(page, ".webtools-ua-grid", ".webtools-ua-card")
      );
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:codeagent",
        "CodeAgent Switch",
        "codeagent-switch"
      );
      await assertFormFitsViewport(page, "form.codeagent-switch-form");
      await page.waitForFunction(() => {
        return (
          document.querySelectorAll(".codeagent-switch-shell > *").length >= 3 &&
          document.querySelector(".codeagent-switch-detail-panel")
        );
      }, undefined, { timeout: 10000 });
      await assertPageHasNoHorizontalOverflow(page, "codeagent switch panel");
      assertSingleColumnStack(
        "codeagent switch shell",
        await collectStackMetrics(
          page,
          ".codeagent-switch-shell",
          ".codeagent-switch-shell > *"
        )
      );
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:prompt",
        "图片提示词",
        "webtools-image-prompt"
      );
      await assertFormFitsViewport(page, "form.webtools-image-prompt-form");
      await page.waitForFunction(() => {
        return (
          document.querySelectorAll(".webtools-image-prompt-field").length >= 4 &&
          document.querySelectorAll(".webtools-image-prompt-text-controls > *").length >= 2
        );
      }, undefined, { timeout: 10000 });
      await assertPageHasNoHorizontalOverflow(page, "image prompt panel");
      await assertStackedPair(
        page,
        ".webtools-image-prompt-header",
        ".webtools-image-prompt-header > :first-child",
        ".webtools-image-prompt-product",
        "image prompt header"
      );
      assertSingleColumnStack(
        "image prompt option fields",
        await collectStackMetrics(
          page,
          ".webtools-image-prompt-grid",
          ".webtools-image-prompt-field"
        )
      );
      assertSingleColumnStack(
        "image prompt text controls",
        await collectStackMetrics(
          page,
          ".webtools-image-prompt-text-controls",
          ".webtools-image-prompt-text-controls > *"
        )
      );
      await returnToSearch(page);
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
