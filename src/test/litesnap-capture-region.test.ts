import assert from "node:assert/strict";
import test from "node:test";
import type { Display, Rectangle } from "electron";

import { resolveLiteSnapPhysicalCaptureRegion } from "../main/litesnap/capture-provider";

function makeDisplay(bounds: Rectangle, scaleFactor: number): Display {
  return {
    id: 9,
    bounds,
    workArea: bounds,
    scaleFactor,
    rotation: 0,
    touchSupport: "unknown",
    monochrome: false,
    colorDepth: 24,
    colorSpace: "srgb",
    depthPerComponent: 8,
    detected: true,
    displayFrequency: 60,
    internal: false,
    label: "test",
    maximumCursorSize: { width: 64, height: 64 },
    nativeOrigin: { x: bounds.x, y: bounds.y },
    size: { width: bounds.width, height: bounds.height },
    workAreaSize: { width: bounds.width, height: bounds.height },
    accelerometerSupport: "unknown"
  } as Display;
}

for (const scaleFactor of [1, 1.25, 1.5, 2]) {
  test(`LiteSnap maps a ${scaleFactor * 100}% DPI selection to physical pixels`, () => {
    const display = makeDisplay({ x: 100, y: 50, width: 1600, height: 900 }, scaleFactor);
    const region = resolveLiteSnapPhysicalCaptureRegion(
      display,
      { x: 17, y: 23, width: 401, height: 299 },
      (rect) => ({
        x: Math.round(rect.x * scaleFactor),
        y: Math.round(rect.y * scaleFactor),
        width: Math.round(rect.width * scaleFactor),
        height: Math.round(rect.height * scaleFactor)
      })
    );

    assert.deepEqual(region, {
      x: Math.round(117 * scaleFactor),
      y: Math.round(73 * scaleFactor),
      width: Math.round(401 * scaleFactor),
      height: Math.round(299 * scaleFactor)
    });
  });
}

test("LiteSnap uses the system DIP transform for a negative-coordinate secondary display", () => {
  const display = makeDisplay({ x: -1536, y: -120, width: 1536, height: 960 }, 1.25);
  const transformedRects: Rectangle[] = [];
  const region = resolveLiteSnapPhysicalCaptureRegion(
    display,
    { x: 36, y: 48, width: 420, height: 360 },
    (rect) => {
      transformedRects.push(rect);
      return { x: -1875, y: -90, width: 525, height: 450 };
    }
  );

  assert.deepEqual(transformedRects, [
    { x: -1500, y: -72, width: 420, height: 360 }
  ]);
  assert.deepEqual(region, { x: -1875, y: -90, width: 525, height: 450 });
});

test("LiteSnap rounds transformed region dimensions to valid whole pixels", () => {
  const display = makeDisplay({ x: 0, y: 0, width: 1920, height: 1080 }, 1.5);
  const region = resolveLiteSnapPhysicalCaptureRegion(
    display,
    { x: 10.4, y: 20.6, width: 0.2, height: 0.2 },
    () => ({ x: 15.4, y: 30.6, width: 0.4, height: 0.4 })
  );

  assert.deepEqual(region, { x: 15, y: 31, width: 1, height: 1 });
});
