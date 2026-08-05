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

function assertResponsiveItemLayout(label: string, metrics: StackMetrics): void {
  assert.ok(metrics.count >= 2, `${label} should render at least two visible items`);
  assert.ok(
    metrics.lefts.every((left) => left >= 0) && metrics.tops.every((top) => top >= 0),
    `${label} should keep visible items inside its layout container`
  );
  const coordinateKeys = new Set(
    metrics.lefts.map((left, index) => `${left}:${metrics.tops[index]}`)
  );
  assert.equal(
    coordinateKeys.size,
    metrics.lefts.length,
    `${label} should not place sampled items at the same coordinates`
  );
}

async function assertDistinctPairLayout(
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

  assert.notEqual(
    `${pair.firstLeft}:${pair.firstTop}`,
    `${pair.secondLeft}:${pair.secondTop}`,
    `${label} should not overlap its paired sections`
  );
}

test(
  "electron smoke: selected plugin panels fit the minimum supported desktop width",
  { timeout: 180000 },
  async () => {
    const testName =
      "electron smoke: selected plugin panels fit the minimum supported desktop width";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;

    try {
      session = await launchE2ESession();
      const { page } = session;

      // LiteLauncher is a desktop shell with a 960px minimum window width.
      await page.setViewportSize({ width: 960, height: 720 });

      await openPluginFromSearch(page, "plugin:crypto", "加密工具", "webtools-crypto");
      await assertFormFitsViewport(page, "form.webtools-crypto-form");
      await assertPageHasNoHorizontalOverflow(page, "crypto panel");
      assertResponsiveItemLayout(
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
      assertResponsiveItemLayout(
        "password workbench",
        await collectStackMetrics(
          page,
          ".webtools-password-workbench",
          ".webtools-password-workbench > *"
        )
      );
      assertResponsiveItemLayout(
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
      assertResponsiveItemLayout(
        "jwt panes",
        await collectStackMetrics(page, ".webtools-jwt-layout", ".webtools-jwt-pane")
      );
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:regex",
        "\u6b63\u5219\u5de5\u5177",
        "webtools-regex"
      );
      await assertFormFitsViewport(page, "form.webtools-regex-form");
      const regexForm = page.locator("form.webtools-regex-form");
      await regexForm.locator('input[name="webtoolsRegexPattern"]').fill("LiteLauncher");
      await regexForm
        .locator('textarea[name="webtoolsRegexInput"]')
        .fill("LiteLauncher regex narrow smoke LiteLauncher");
      await page.waitForFunction(() => {
        return (
          document.querySelectorAll(".webtools-regex-layout > *").length >= 2 &&
          document.querySelectorAll(".webtools-regex-match-list > *").length >= 2 &&
          document.querySelector(".webtools-regex-highlight-box")?.textContent?.includes(
            "LiteLauncher"
          ) === true
        );
      }, undefined, { timeout: 10000 });
      await assertPageHasNoHorizontalOverflow(page, "regex panel");
      assertResponsiveItemLayout(
        "regex panes",
        await collectStackMetrics(page, ".webtools-regex-layout", ".webtools-regex-layout > *")
      );
      assertResponsiveItemLayout(
        "regex match cards",
        await collectStackMetrics(
          page,
          ".webtools-regex-match-list",
          ".webtools-regex-match-list > *"
        )
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
      assertResponsiveItemLayout(
        "json control panel",
        await collectStackMetrics(
          page,
          ".webtools-json-control-panel",
          ".webtools-json-control-panel > *"
        )
      );
      assertResponsiveItemLayout(
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
      assertResponsiveItemLayout(
        "cron workspace",
        await collectStackMetrics(
          page,
          ".webtools-cron-workspace",
          ".webtools-cron-workspace > *"
        )
      );
      await assertDistinctPairLayout(
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
      assertResponsiveItemLayout(
        "ua cards",
        await collectStackMetrics(page, ".webtools-ua-grid", ".webtools-ua-card")
      );
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:config",
        "\u914d\u7f6e\u8f6c\u6362",
        "webtools-config-convert"
      );
      await assertFormFitsViewport(page, "form.webtools-config-form");
      const configForm = page.locator("form.webtools-config-form");
      await configForm.locator('select[name="webtoolsConfigTarget"]').selectOption("json");
      await configForm
        .locator('textarea[name="webtoolsConfigInput"]')
        .fill("server:\n  port: 8080\n  host: localhost\n");
      await page.waitForFunction(() => {
        const output = document.querySelector(
          'textarea[name="webtoolsConfigOutput"]'
        ) as HTMLTextAreaElement | null;
        return (
          document.querySelectorAll(".webtools-config-editors > *").length >= 2 &&
          output?.value.includes('"server"') === true &&
          output.value.includes('"port": 8080') === true
        );
      }, undefined, { timeout: 10000 });
      await assertPageHasNoHorizontalOverflow(page, "config panel");
      assertResponsiveItemLayout(
        "config editors",
        await collectStackMetrics(
          page,
          ".webtools-config-editors",
          ".webtools-config-editors > *"
        )
      );
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:md",
        "Markdown \u9884\u89c8",
        "webtools-markdown"
      );
      await assertFormFitsViewport(page, "form.webtools-markdown-form");
      const markdownForm = page.locator("form.webtools-markdown-form");
      await markdownForm
        .locator('textarea[name="webtoolsMarkdownInput"]')
        .fill("# LiteLauncher narrow layout\n\n- alpha\n- beta");
      await page.waitForFunction(() => {
        const preview = document.querySelector(
          '[data-webtools-markdown-preview="1"]'
        ) as HTMLDivElement | null;
        const htmlOutput = document.querySelector(
          'textarea[name="webtoolsMarkdownHtml"]'
        ) as HTMLTextAreaElement | null;
        return (
          document.querySelectorAll(".webtools-markdown-layout > *").length >= 2 &&
          document.querySelector(".webtools-markdown-html-block") &&
          preview?.textContent?.includes("LiteLauncher narrow layout") === true &&
          htmlOutput?.value.includes("<h1") === true
        );
      }, undefined, { timeout: 10000 });
      await assertPageHasNoHorizontalOverflow(page, "markdown panel");
      assertResponsiveItemLayout(
        "markdown panes",
        await collectStackMetrics(
          page,
          ".webtools-markdown-layout",
          ".webtools-markdown-layout > *"
        )
      );
      await assertDistinctPairLayout(
        page,
        "form.webtools-markdown-form",
        ".webtools-markdown-layout",
        ".webtools-markdown-html-block",
        "markdown html block"
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
      assertResponsiveItemLayout(
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
      await assertDistinctPairLayout(
        page,
        ".webtools-image-prompt-header",
        ".webtools-image-prompt-header > :first-child",
        ".webtools-image-prompt-product",
        "image prompt header"
      );
      assertResponsiveItemLayout(
        "image prompt option fields",
        await collectStackMetrics(
          page,
          ".webtools-image-prompt-grid",
          ".webtools-image-prompt-field"
        )
      );
      assertResponsiveItemLayout(
        "image prompt text controls",
        await collectStackMetrics(
          page,
          ".webtools-image-prompt-text-controls",
          ".webtools-image-prompt-text-controls > *"
        )
      );
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "clipx",
        "剪贴板工作台",
        "clipboard-workbench"
      );
      await assertFormFitsViewport(page, "form.clipboard-workbench-form");
      const clipboardForm = page.locator("form.clipboard-workbench-form");
      const alphaText = `layout smoke alpha ${Date.now()}`;
      const betaText = `layout smoke beta ${Date.now() + 1}`;
      const manualTextInput = clipboardForm.locator(
        'textarea[name="clipboardWorkbenchManualText"]'
      );
      const saveManualButton = clipboardForm.locator(
        '[data-clipboard-workbench-save-manual="1"]'
      );
      await manualTextInput.fill(alphaText);
      await saveManualButton.click();
      await page.waitForFunction(
        (expectedText) => {
          return Array.from(document.querySelectorAll(".clipboard-workbench-item")).some(
            (node) => node.textContent?.includes(expectedText)
          );
        },
        alphaText,
        { timeout: 15000 }
      );
      await manualTextInput.fill(betaText);
      await saveManualButton.click();
      await page.waitForFunction(
        ([firstText, secondText]) => {
          const items = Array.from(document.querySelectorAll(".clipboard-workbench-item"));
          return (
            items.some((node) => node.textContent?.includes(firstText)) &&
            items.some((node) => node.textContent?.includes(secondText))
          );
        },
        [alphaText, betaText],
        { timeout: 15000 }
      );
      await page.waitForFunction(() => {
        return (
          document.querySelectorAll(".clipboard-workbench-shell > *").length >= 4 &&
          document.querySelectorAll(".clipboard-workbench-toolbar-stats > *").length >= 3 &&
          document.querySelectorAll(".clipboard-workbench-item-list > *").length >= 2
        );
      }, undefined, { timeout: 10000 });
      await assertPageHasNoHorizontalOverflow(page, "clipboard workbench panel");
      assertResponsiveItemLayout(
        "clipboard shell",
        await collectStackMetrics(
          page,
          ".clipboard-workbench-shell",
          ".clipboard-workbench-shell > *"
        )
      );
      assertResponsiveItemLayout(
        "clipboard stats",
        await collectStackMetrics(
          page,
          ".clipboard-workbench-toolbar-stats",
          ".clipboard-workbench-toolbar-stats > *"
        )
      );
      assertResponsiveItemLayout(
        "clipboard item cards",
        await collectStackMetrics(
          page,
          ".clipboard-workbench-item-list",
          ".clipboard-workbench-item-list > *"
        )
      );
      await returnToSearch(page);
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
