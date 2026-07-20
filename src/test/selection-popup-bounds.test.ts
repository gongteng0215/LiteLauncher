import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { isPointInBounds } from "../shared/selection-translate";

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("isPointInBounds detects inclusive start and exclusive end", () => {
  const bounds = { x: 10, y: 20, width: 100, height: 50 };
  assert.equal(isPointInBounds({ x: 10, y: 20 }, bounds), true);
  assert.equal(isPointInBounds({ x: 50, y: 40 }, bounds), true);
  assert.equal(isPointInBounds({ x: 109, y: 69 }, bounds), true);
  assert.equal(isPointInBounds({ x: 110, y: 20 }, bounds), false);
  assert.equal(isPointInBounds({ x: 10, y: 70 }, bounds), false);
  assert.equal(isPointInBounds({ x: 9, y: 20 }, bounds), false);
});

test("selection popup multi-display and passthrough helpers are wired", () => {
  const popupSource = readSource("src/main/selection-translate/popup-window.ts");
  assert.match(popupSource, /export function getVirtualDesktopBounds/);
  assert.match(popupSource, /display-metrics-changed/);
  assert.match(popupSource, /display-added/);
  assert.match(popupSource, /display-removed/);
  assert.match(popupSource, /passthroughWindows/);
  assert.match(popupSource, /elevatePassthroughWindows/);
  assert.match(popupSource, /isPointInBounds/);
});
