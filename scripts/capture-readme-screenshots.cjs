/**
 * Capture README screenshots via Playwright Electron launch.
 * Usage: node scripts/capture-readme-screenshots.cjs
 * Requires: pnpm run build (dist/test/e2e-test-utils.js present)
 */
const fs = require("fs");
const path = require("path");

const {
  launchE2ESession,
  returnToSearch,
  waitForMode
} = require("../dist/test/e2e-test-utils.js");

const OUT_DIR = path.join(__dirname, "..", "docs", "screenshots");

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHome(page) {
  await waitForMode(page, "search");
  await page.waitForFunction(
    () =>
      document.querySelector("#cc-command") !== null &&
      document.querySelector(".launcher-shell") !== null,
    undefined,
    { timeout: 15000 }
  );
  await sleep(600);
}

async function openSettings(page) {
  await page.locator("#settings-shortcut-btn").click();
  await page.waitForSelector(".cc-settings-overlay-dialog", {
    state: "visible",
    timeout: 15000
  });
  await sleep(400);
}

async function closeSettings(page) {
  const closeBtn = page.locator(".cc-settings-close");
  if (await closeBtn.count()) {
    await closeBtn.click();
  } else {
    await page.keyboard.press("Escape");
  }
  await page.waitForSelector(".cc-settings-overlay-dialog", {
    state: "detached",
    timeout: 10000
  });
}

async function shot(page, name) {
  const filePath = path.join(OUT_DIR, name);
  await page.screenshot({ path: filePath, type: "png" });
  console.log(`[capture] wrote ${filePath}`);
}

async function openPluginByExecute(page, item) {
  const result = await page.evaluate(async (seedItem) => {
    return window.launcher.execute(seedItem);
  }, item);
  if (!result || result.ok !== true) {
    throw new Error(`failed to open plugin ${item.id}: ${JSON.stringify(result)}`);
  }
  await waitForMode(page, "plugin");
  await page.waitForFunction(
    (pluginId) => document.body.dataset.activePluginId === pluginId,
    item.id.replace(/^plugin:/, ""),
    { timeout: 10000 }
  );
  await sleep(500);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const session = await launchE2ESession();
  const { page } = session;

  try {
    await waitForHome(page);
    await shot(page, "01-home.png");

    const searchInput = page.locator("#search-input");
    await searchInput.click();
    await searchInput.fill("json");
    await page.waitForFunction(
      () => {
        const results = document.querySelector("#command-results");
        if (!results || results.hasAttribute("hidden")) {
          return false;
        }
        return results.querySelectorAll(".result-item, .command-result").length > 0;
      },
      undefined,
      { timeout: 20000 }
    );
    await sleep(400);
    await shot(page, "02-search.png");
    await searchInput.fill("");
    await waitForMode(page, "search");
    await sleep(300);

    await openSettings(page);
    await shot(page, "03-settings-theme.png");

    const pluginsTab = page
      .locator(".cc-settings-overlay-dialog nav button")
      .filter({ hasText: "插件可见性" });
    if (await pluginsTab.count()) {
      await pluginsTab.click();
      await sleep(400);
      await shot(page, "04-settings-plugins.png");
    }

    await closeSettings(page);

    await openPluginByExecute(page, {
      id: "plugin:webtools-password",
      type: "command",
      title: "密码工具",
      subtitle: "密码生成器",
      target: "command:plugin:webtools-password?action=open",
      keywords: ["plugin", "password"]
    });
    const generateBtn = page.locator("button").filter({ hasText: "生成密码" }).first();
    if (await generateBtn.count()) {
      await generateBtn.click();
      await sleep(500);
    }
    await shot(page, "05-plugin-password.png");
    await returnToSearch(page);

    await openPluginByExecute(page, {
      id: "plugin:clipboard-workbench",
      type: "command",
      title: "剪贴板工作台",
      subtitle: "剪贴板历史",
      target: "command:plugin:clipboard-workbench?action=open",
      keywords: ["plugin", "clipboard"]
    });
    await shot(page, "06-plugin-clipboard.png");
    await returnToSearch(page);

    console.log("[capture] done");
  } finally {
    await session.close();
  }
}

main().catch((error) => {
  console.error("[capture] failed", error);
  process.exit(1);
});
