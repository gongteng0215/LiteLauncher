import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { launchE2ESession } from "./e2e-test-utils";

test("native outside click closes an unfocused popup without backdrop or blur events on every display", { skip: process.platform !== "win32", timeout: 90000 }, async () => {
  const session = await launchE2ESession();
  try {
    const displays = await session.electronApp.evaluate(({ screen }) => screen.getAllDisplays().map(display => display.id));
    for (const displayId of displays) {
      const points = await session.electronApp.evaluate(async ({ BrowserWindow, screen }, id) => {
        const moduleApi = process.getBuiltinModule("module") as typeof import("node:module");
        const appRequire = moduleApi.createRequire(`${process.cwd()}\\package.json`);
        const api = appRequire(`${process.cwd()}/dist/main/selection-translate/popup-window.js`) as typeof import("../main/selection-translate/popup-window");
        const display = screen.getAllDisplays().find(display => display.id === id)!;
        const { x, y } = display.workArea;
        const fixture = new BrowserWindow({ x: x + 24, y: y + 24, width: 700, height: 500, frame: false, alwaysOnTop: true });
        await fixture.loadURL("data:text/html,<body>Popup click test fixture</body>");
        fixture.show();
        await api.showSelectionPopup({ mode: "translate", sourceText: "test", translatedText: "测试" }, { anchorPoint: { x: x + 96, y: y + 96 } });
        await new Promise(resolve => setTimeout(resolve, 100));
        const popup = BrowserWindow.getAllWindows().find(window => window.webContents.getURL().includes("selection-popup.html"))!;
        if (!popup) throw new Error("missing popup");
        if (BrowserWindow.getAllWindows().some(window => window.webContents.getURL().includes("selection-backdrop.html"))) throw new Error("native watcher must replace backdrop");
        popup.removeAllListeners("blur");
        fixture.focus(); // Reproduce the popup already unfocused before the click.
        const bounds = popup.getBounds();
        return {
          inside: screen.dipToScreenPoint({ x: bounds.x + 100, y: bounds.y + 80 }),
          outside: screen.dipToScreenPoint({ x: x + 48, y: y + 48 }),
          fixtureId: fixture.id,
          scale: display.scaleFactor
        };
      }, displayId);
      const click = (point: { x: number; y: number }) => promisify(execFile)("powershell.exe", ["-NoProfile", "-File", path.join(process.cwd(), "scripts/test-native-pointer-click.ps1"), "-ClickX", String(point.x), "-ClickY", String(point.y)], { windowsHide: true, timeout: 15000 });
      await click(points.inside);
      assert.equal(await session.electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().some(window => window.webContents.getURL().includes("selection-popup.html"))), true, "inside click must keep popup open");
      await click(points.outside);
      await session.page.waitForTimeout(150);
      assert.equal(await session.electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().some(window => window.webContents.getURL().includes("selection-popup.html"))), false, `outside native click must close on display scale ${points.scale}`);
      await session.electronApp.evaluate(({ BrowserWindow }, id) => BrowserWindow.fromId(id)?.destroy(), points.fixtureId);
    }
  } finally { await session.close(); }
});
