import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  calculateSelectionPopupBounds,
  isPointInBounds
} from "../shared/selection-translate";

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

test("selection popup placement prefers lower-right and flips at display edges", () => {
  const workArea = { x: -1600, y: 20, width: 1600, height: 900 };
  const size = { width: 420, height: 480 };

  assert.deepEqual(
    calculateSelectionPopupBounds({ x: -1500, y: 100 }, size, workArea),
    { x: -1484, y: 116, width: 420, height: 480 }
  );
  assert.deepEqual(
    calculateSelectionPopupBounds({ x: -20, y: 880 }, size, workArea),
    { x: -456, y: 384, width: 420, height: 480 }
  );
  assert.deepEqual(
    calculateSelectionPopupBounds(
      { x: 2, y: 2 },
      { width: 500, height: 500 },
      { x: 0, y: 0, width: 300, height: 200 }
    ),
    { x: 0, y: 0, width: 300, height: 200 }
  );
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
  assert.match(popupSource, /POPUP_WIDTH = 420/);
  assert.match(popupSource, /POPUP_HEIGHT_WITH_CANDIDATES = 480/);
  assert.match(popupSource, /calculateSelectionPopupBounds/);
  assert.match(popupSource, /popupRequestSequence/);
  assert.match(popupSource, /isCurrentPopupRequest/);
});
