import assert from "node:assert/strict";
import test from "node:test";

import { matchLiteSnapVerticalFrames, type LiteSnapStitchFrame } from "../shared/litesnap-stitch";

const WIDTH = 32;
const HEIGHT = 100;

function makeFrame(contentOffset: number, variant = 0): LiteSnapStitchFrame {
  const data = new Uint8Array(WIDTH * HEIGHT * 4);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const pixel = (y * WIDTH + x) * 4;
      const fixedTop = y < 12;
      const fixedBottom = y >= HEIGHT - 12;
      const value = fixedTop
        ? 245
        : fixedBottom
          ? 12
          : ((contentOffset + y - 12) * 37 + x * 17 + variant * 83) % 251;
      data[pixel] = value;
      data[pixel + 1] = (value * 3) % 255;
      data[pixel + 2] = (value * 7) % 255;
      data[pixel + 3] = 255;
    }
  }
  return { width: WIDTH, height: HEIGHT, data };
}

test("LiteSnap stitcher finds content overlap while ignoring fixed frame edges", () => {
  const previous = makeFrame(0);
  const next = makeFrame(70);
  const match = matchLiteSnapVerticalFrames(previous, next);

  assert.equal(match.confident, true);
  assert.ok(match.overlap >= 28 && match.overlap <= 32, `unexpected overlap ${match.overlap}`);
  assert.equal(match.appendedHeight, HEIGHT - match.overlap);
});

test("LiteSnap stitcher treats an identical tail frame as no new content", () => {
  const frame = makeFrame(0);
  const match = matchLiteSnapVerticalFrames(frame, frame);

  assert.equal(match.confident, true);
  assert.equal(match.appendedHeight, 0);
  assert.equal(match.overlap, HEIGHT);
});

test("LiteSnap stitcher pauses instead of guessing when overlap confidence is low", () => {
  const previous = makeFrame(0);
  const next = makeFrame(70);
  for (let y = 12; y < HEIGHT - 12; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const pixel = (y * WIDTH + x) * 4;
      next.data[pixel] = 255;
      next.data[pixel + 1] = 255;
      next.data[pixel + 2] = 255;
    }
  }
  const match = matchLiteSnapVerticalFrames(previous, next);

  assert.equal(match.confident, false);
});

test("LiteSnap stitcher rejects invalid frame data", () => {
  const match = matchLiteSnapVerticalFrames(
    { width: 10, height: 10, data: new Uint8Array(3) },
    makeFrame(0)
  );

  assert.equal(match.confident, false);
});
