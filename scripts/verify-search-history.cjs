const assert = require("node:assert/strict");
const fs = require("node:fs");
const { launchE2ESession } = require("../dist/test/e2e-test-utils.js");
(async () => {
  const session = await launchE2ESession();
  try {
    const page = session.page;
    const input = page.locator("#search-input");
    await input.fill("notepad");
    await page.waitForTimeout(2600);
    await input.fill("calculator");
    await page.waitForTimeout(2600);
    await input.fill("notepad");
    await page.waitForTimeout(2600);
    console.log(await page.evaluate(() => ({ mode: document.body.dataset.mode, value: document.querySelector("#search-input").value, history: document.querySelector("#search-history-list").textContent })));
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("litelauncher.search-history.v1"))), ["notepad", "calculator"]);
    await page.reload();
    await page.locator("#search-history summary").click();
    await page.getByRole("button", { name: "calculator", exact: true }).click();
    assert.equal(await input.inputValue(), "calculator");
    await page.getByRole("button", { name: "删除搜索记录：notepad", exact: true }).click();
    assert.equal(await page.locator(".search-history-item").count(), 1);
    await input.fill("");
    fs.mkdirSync("artifacts/search-history", { recursive: true });
    await page.screenshot({ path: "artifacts/search-history/history.png" });
    await page.getByRole("button", { name: "清空历史", exact: true }).click();
    await page.reload();
    assert.equal(await page.locator(".search-history-item").count(), 0);
    console.log("Search history: recording, deduplication, persistence, replay, deletion and clearing passed");
  } finally { await session.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
