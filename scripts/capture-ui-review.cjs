/*
 * Generate non-committed UI review screenshots and a compact HTML index.
 * Run after a build, or use `pnpm run review:ui`.
 */
const fs = require("fs");
const path = require("path");

const {
  launchE2ESession,
  returnToSearch,
  waitForMode
} = require("../dist/test/e2e-test-utils.js");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const REVIEW_LABEL = process.env.LITELAUNCHER_UI_REVIEW_LABEL || "v1.1.18-candidate";
const OUTPUT_ROOT = path.join(PROJECT_ROOT, "artifacts", "ui-review", REVIEW_LABEL);
const VIEWPORTS = [
  { label: "1440x900", width: 1440, height: 900 },
  { label: "960x720", width: 960, height: 720 }
];
const PANELS = [
  { id: "litesnap", title: "LiteSnap" },
  { id: "codeagent-switch", title: "CodeAgent Switch" },
  { id: "cashflow-game", title: "Cashflow" },
  { id: "hardware-inspector", title: "Hardware Inspector" },
  { id: "clipboard-workbench", title: "Clipboard Workbench" }
];

function slug(value) {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

async function settle(page) {
  await page.waitForTimeout(180);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function openSettings(page) {
  await page.locator("#settings-shortcut-btn").click();
  await page.locator(".cc-settings-overlay-dialog").waitFor({ state: "visible", timeout: 10_000 });
  await settle(page);
}

async function closeSettings(page) {
  const closeButton = page.locator(".cc-settings-close").first();
  if (await closeButton.count()) {
    await closeButton.click();
  } else {
    await page.keyboard.press("Escape");
  }
  await page.locator(".cc-settings-overlay-dialog").waitFor({ state: "detached", timeout: 10_000 });
}

async function openPanel(page, panel) {
  const result = await page.evaluate(async ({ id, title }) => {
    return window.launcher.execute({
      id: `plugin:${id}`,
      type: "command",
      title,
      subtitle: title,
      target: `command:plugin:${id}?action=open`,
      keywords: ["plugin", id]
    });
  }, panel);
  if (!result || result.ok !== true) {
    throw new Error(`failed to open ${panel.id}: ${JSON.stringify(result)}`);
  }
  await waitForMode(page, panel.id === "cashflow-game" ? "cashflow" : "plugin");
  if (panel.id !== "cashflow-game") {
    await page.waitForFunction(
      (pluginId) => document.body.dataset.activePluginId === pluginId,
      panel.id,
      { timeout: 10_000 }
    );
  }
  await settle(page);
}

async function executeCashflowAction(page, action) {
  const result = await page.evaluate(async (cashflowAction) => {
    return window.launcher.execute({
      id: `plugin:cashflow-game:${cashflowAction}`,
      type: "command",
      title: "Cashflow",
      subtitle: "Cashflow UI review",
      target: `command:plugin:cashflow-game?action=${cashflowAction}`,
      keywords: ["plugin", "cashflow", cashflowAction]
    });
  }, action);
  if (!result || result.ok !== true) {
    throw new Error(`failed to execute cashflow action ${action}: ${JSON.stringify(result)}`);
  }
  await waitForMode(page, "cashflow");
  await settle(page);
}

async function captureCashflowStates(page, viewport, records) {
  const panel = PANELS.find((candidate) => candidate.id === "cashflow-game");
  if (!panel) throw new Error("cashflow panel is missing from UI review configuration");

  await openPanel(page, panel);
  await capture(page, viewport, "cashflow-game", records);

  await executeCashflowAction(page, "ai");
  const aiCards = page.locator(".cashflow-ai-card");
  await aiCards.first().waitFor({ state: "visible", timeout: 10_000 });
  if ((await aiCards.count()) !== 3) {
    throw new Error(`expected 3 Cashflow AI cards, got ${await aiCards.count()}`);
  }
  await aiCards.first().scrollIntoViewIfNeeded();
  await settle(page);
  await capture(page, viewport, "cashflow-ai", records);

  await executeCashflowAction(page, "next-turn");
  await executeCashflowAction(page, "reset");
  await executeCashflowAction(page, "next-turn");
  await executeCashflowAction(page, "review");

  const reviewPanel = page.locator(".cashflow-panel-review");
  await reviewPanel.waitFor({ state: "visible", timeout: 10_000 });
  const picker = reviewPanel.locator(".cashflow-review-picker-select");
  const optionCount = await picker.locator("option").count();
  let selectedAiReview = (await reviewPanel.locator(".cashflow-review-ai-list li").count()) === 3;
  for (let index = 1; index < optionCount && !selectedAiReview; index += 1) {
    await picker.selectOption({ index });
    await settle(page);
    selectedAiReview = (await reviewPanel.locator(".cashflow-review-ai-list li").count()) === 3;
  }
  if (!selectedAiReview) {
    throw new Error("Cashflow review history does not include the 3-AI game created by UI review");
  }
  await capture(page, viewport, "cashflow-review", records);
  await returnToSearch(page);
}

async function auditPage(page, label) {
  await page.keyboard.press("Tab");
  const result = await page.evaluate(() => {
    const visible = (node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return !node.hidden && style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const rootOverflow = Math.max(
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
      document.body.scrollWidth - document.body.clientWidth,
      (document.querySelector(".shell")?.scrollWidth || 0) - (document.querySelector(".shell")?.clientWidth || 0)
    );
    const clippedControls = Array.from(document.querySelectorAll("button, label, legend, .tile-title"))
      .filter(visible)
      .filter((node) => {
        const style = getComputedStyle(node);
        return (
          (style.overflowX === "hidden" && node.scrollWidth > node.clientWidth + 1) ||
          (style.overflowY === "hidden" && node.scrollHeight > node.clientHeight + 1)
        );
      })
      .slice(0, 10)
      .map((node) => (node.textContent || node.getAttribute("aria-label") || node.tagName).trim().slice(0, 80));
    const focusable = document.activeElement;
    let focusIndicator = true;
    if (focusable instanceof HTMLElement && focusable !== document.body && visible(focusable)) {
      const style = getComputedStyle(focusable);
      focusIndicator = style.outlineStyle !== "none" || style.boxShadow !== "none";
    }
    const rootStyle = getComputedStyle(document.documentElement);
    const pageText = document.body.innerText || "";
    const suspiciousTextFragments = ["\uFFFD", "Ã", "Â", "â€", "锛", "銆", "鈥", "闁"]
      .filter((fragment) => pageText.includes(fragment));
    return {
      mode: document.body.dataset.mode || "unknown",
      activePluginId: document.body.dataset.activePluginId || null,
      rootOverflow,
      clippedControls,
      suspiciousTextFragments,
      focusIndicator,
      theme: {
        accent: rootStyle.getPropertyValue("--ll-accent").trim(),
        controlHeight: rootStyle.getPropertyValue("--ll-control-height").trim(),
        radiusCard: rootStyle.getPropertyValue("--ll-radius-card").trim()
      }
    };
  });
  const failures = [];
  if (result.rootOverflow > 1) failures.push(`页面横向溢出 ${result.rootOverflow}px`);
  if (result.clippedControls.length > 0) failures.push(`控件文字裁切: ${result.clippedControls.join(" / ")}`);
  if (result.suspiciousTextFragments.length > 0) {
    failures.push(`疑似乱码: ${result.suspiciousTextFragments.join(" / ")}`);
  }
  if (!result.focusIndicator) failures.push("首个可聚焦控件没有焦点样式");
  if (!result.theme.accent || result.theme.controlHeight !== "36px" || result.theme.radiusCard !== "12px") {
    failures.push(`主题变量未生效: ${JSON.stringify(result.theme)}`);
  }
  if (failures.length > 0) {
    throw new Error(`${label}: ${failures.join("；")}`);
  }
  return result;
}

async function capture(page, viewport, name, records) {
  await settle(page);
  const audit = await auditPage(page, `${viewport.label}/${name}`);
  const fileName = `${viewport.label}-${slug(name)}.png`;
  await page.screenshot({ path: path.join(OUTPUT_ROOT, fileName), type: "png" });
  records.push({ viewport: viewport.label, name, fileName, audit });
}

function writeIndex(records) {
  const cards = records.map((record) => `
    <article>
      <h2>${record.viewport} · ${record.name}</h2>
      <img src="./${record.fileName}" alt="${record.viewport} ${record.name}" loading="lazy" />
      <pre>${JSON.stringify(record.audit, null, 2)}</pre>
    </article>`).join("\n");
  const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>LiteLauncher UI Review ${REVIEW_LABEL}</title>
<style>body{font-family:system-ui;margin:24px;background:#0b0916;color:#f3efff}main{display:grid;gap:24px}article{padding:16px;border:1px solid #403660;border-radius:12px;background:#151126}img{display:block;max-width:100%;height:auto;border-radius:8px}pre{white-space:pre-wrap;color:#c8bddf}</style>
</head><body><h1>LiteLauncher UI Review · ${REVIEW_LABEL}</h1><main>${cards}</main></body></html>`;
  fs.writeFileSync(path.join(OUTPUT_ROOT, "index.html"), html, "utf8");
  fs.writeFileSync(path.join(OUTPUT_ROOT, "index.json"), JSON.stringify(records, null, 2), "utf8");
}

async function main() {
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
  const records = [];
  const session = await launchE2ESession();
  const { page } = session;
  try {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await waitForMode(page, "search");
      await capture(page, viewport, "home", records);

      await openSettings(page);
      await capture(page, viewport, "settings", records);
      await closeSettings(page);

      for (const panel of PANELS.filter((candidate) => candidate.id !== "cashflow-game")) {
        await openPanel(page, panel);
        await capture(page, viewport, panel.id, records);
        await returnToSearch(page);
      }
      await captureCashflowStates(page, viewport, records);
    }

    await page.evaluate(() => {
      const api = window.__LL_UI_THEME__;
      if (api) api.apply(api.fromAccent("#22c55e", api.DEFAULT));
    });
    await page.setViewportSize({ width: 960, height: 720 });
    await capture(page, VIEWPORTS[1], "home-nondefault-accent", records);
    writeIndex(records);
    console.info(`[ui-review] wrote ${records.length} screenshots to ${OUTPUT_ROOT}`);
  } finally {
    await session.close();
  }
}

main().catch((error) => {
  console.error("[ui-review] failed", error);
  process.exitCode = 1;
});
