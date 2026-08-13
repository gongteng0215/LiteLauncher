import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import test from "node:test";

import {
  advanceLiteSnapStitchRange,
  findLiteSnapQuietSeamRow,
  matchLiteSnapVerticalFrames,
  matchLiteSnapVerticalFramesBidirectional,
  prepareLiteSnapStitchFrame,
  type LiteSnapStitchFrame
} from "../shared/litesnap-stitch";

const WIDTH = 32;
const HEIGHT = 100;

function makeFrame(contentOffset: number, variant = 0, height = HEIGHT): LiteSnapStitchFrame {
  const data = new Uint8Array(WIDTH * height * 4);
  const edge = Math.round(height * 0.12);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const pixel = (y * WIDTH + x) * 4;
      const fixedTop = y < edge;
      const fixedBottom = y >= height - edge;
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
  return { width: WIDTH, height, data };
}

function makeRepeatingFrame(contentOffset: number): LiteSnapStitchFrame {
  const data = new Uint8Array(WIDTH * HEIGHT * 4);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const pixel = (y * WIDTH + x) * 4;
      const fixedEdge = y < 12 || y >= HEIGHT - 12;
      const value = fixedEdge ? 16 : (((contentOffset + y) % 8) * 28) + ((x % 3) * 4);
      data[pixel] = value;
      data[pixel + 1] = (value * 3) % 255;
      data[pixel + 2] = (value * 7) % 255;
      data[pixel + 3] = 255;
    }
  }
  return { width: WIDTH, height: HEIGHT, data };
}

function makeChromaticRepeatedLayoutFrame(
  contentOffset: number,
  height = 324
): LiteSnapStitchFrame {
  const width = 64;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const documentRow = contentOffset + y;
    const repeatedRow = documentRow % 90;
    const hueIndex = Math.floor(documentRow / 90) % 5;
    for (let x = 0; x < width; x += 1) {
      const pixel = (y * width + x) * 4;
      const neutral = 80 + ((repeatedRow * 7 + x * 13) % 101);
      // These two palettes round to the same luminance with the matcher
      // weights, while their RGB values remain visibly different. This
      // models repeated document rows whose colored section bands are the
      // only reliable way to distinguish adjacent seams.
      data[pixel] = neutral + hueIndex * 6;
      data[pixel + 1] = neutral;
      data[pixel + 2] = neutral - hueIndex * 18;
      data[pixel + 3] = 255;
    }
  }
  return { width, height, data };
}

function makeTextSeamFrame(boundary: number): LiteSnapStitchFrame {
  const width = 96;
  const height = 80;
  const data = new Uint8Array(width * height * 4);
  data.fill(255);
  for (let y = boundary - 1; y <= boundary + 1; y += 1) {
    for (let x = 8; x < width - 8; x += 4) {
      const pixel = (y * width + x) * 4;
      data[pixel] = 0;
      data[pixel + 1] = 0;
      data[pixel + 2] = 0;
    }
  }
  return { width, height, data };
}

test("LiteSnap stitcher finds content overlap while ignoring fixed frame edges", () => {
  const previous = makeFrame(0);
  const next = makeFrame(70);
  const match = matchLiteSnapVerticalFrames(previous, next);

  assert.equal(match.confident, true, JSON.stringify(match));
  assert.ok(match.overlap >= 28 && match.overlap <= 32, `unexpected overlap ${match.overlap}`);
  assert.equal(match.appendedHeight, HEIGHT - match.overlap);
});

test("LiteSnap stitcher finds an exact seam for a normal non-stride manual scroll", () => {
  const height = 324;
  const scrollOffset = 101;
  const match = matchLiteSnapVerticalFrames(
    makeFrame(0, 0, height),
    makeFrame(scrollOffset, 0, height)
  );

  assert.equal(match.confident, true, JSON.stringify(match));
  assert.equal(match.overlap, height - scrollOffset);
  assert.equal(match.appendedHeight, scrollOffset);
});

test("LiteSnap stitcher accepts a small WPS-style mouse-wheel movement", () => {
  const height = 200;
  const scrollOffset = 4;
  const match = matchLiteSnapVerticalFrames(
    makeFrame(0, 0, height),
    makeFrame(scrollOffset, 0, height)
  );

  assert.equal(match.confident, true, JSON.stringify(match));
  assert.equal(match.overlap, height - scrollOffset);
  assert.equal(match.appendedHeight, scrollOffset);
});

test("LiteSnap stitcher detects upward manual scrolling and prepends new content", () => {
  const height = 200;
  const scrollOffset = 57;
  const match = matchLiteSnapVerticalFramesBidirectional(
    makeFrame(scrollOffset, 0, height),
    makeFrame(0, 0, height)
  );

  assert.equal(match.confident, true);
  assert.equal(match.direction, "up");
  assert.equal(match.overlap, height - scrollOffset);
  assert.equal(match.appendedHeight, scrollOffset);
});

test("LiteSnap stitcher does not switch direction after a session is locked", () => {
  const height = 200;
  const match = matchLiteSnapVerticalFramesBidirectional(
    makeFrame(57, 0, height),
    makeFrame(0, 0, height),
    "down"
  );

  assert.equal(match.direction, "down");
  assert.equal(match.confident, false);
});

test("LiteSnap stitch range revisits existing rows and then extends the opposite edge", () => {
  const height = 200;
  const firstUp = advanceLiteSnapStitchRange(
    { currentTop: 0, capturedTop: 0, capturedBottom: height },
    "up",
    57,
    height
  );
  assert.deepEqual(firstUp, {
    nextTop: -57,
    nextBottom: 143,
    prependHeight: 57,
    appendHeight: 0
  });

  const revisit = advanceLiteSnapStitchRange(
    { currentTop: firstUp.nextTop, capturedTop: -57, capturedBottom: height },
    "down",
    57,
    height
  );
  assert.deepEqual(revisit, {
    nextTop: 0,
    nextBottom: height,
    prependHeight: 0,
    appendHeight: 0
  });

  const extendBottom = advanceLiteSnapStitchRange(
    { currentTop: revisit.nextTop, capturedTop: -57, capturedBottom: height },
    "down",
    57,
    height
  );
  assert.deepEqual(extendBottom, {
    nextTop: 57,
    nextBottom: 257,
    prependHeight: 0,
    appendHeight: 57
  });
});

test("LiteSnap stitcher moves seams away from text rows in both directions", () => {
  const boundary = 40;
  const frame = makeTextSeamFrame(boundary);
  const downwardSeam = findLiteSnapQuietSeamRow(frame, boundary, "down", 12);
  const upwardSeam = findLiteSnapQuietSeamRow(frame, boundary, "up", 12);

  assert.ok(downwardSeam < boundary - 1, `unexpected downward seam ${downwardSeam}`);
  assert.ok(upwardSeam > boundary + 1, `unexpected upward seam ${upwardSeam}`);
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

test("LiteSnap stitcher rejects visually repetitive content with ambiguous overlaps", () => {
  const match = matchLiteSnapVerticalFrames(makeRepeatingFrame(0), makeRepeatingFrame(70));

  assert.equal(match.confident, false);
});

test("LiteSnap stitcher uses color to disambiguate repeated grayscale layouts", () => {
  const scrollOffset = 40;
  const match = matchLiteSnapVerticalFrames(
    makeChromaticRepeatedLayoutFrame(0),
    makeChromaticRepeatedLayoutFrame(scrollOffset)
  );

  assert.equal(match.confident, true, JSON.stringify(match));
  assert.equal(match.overlap, 324 - scrollOffset);
  assert.equal(match.appendedHeight, scrollOffset);
});

test("LiteSnap stitcher treats adjacent pixel candidates as one seam neighborhood", () => {
  const height = 324;
  const previous = makeFrame(0, 0, height);
  const next = makeFrame(101, 0, height);
  // Model small compositor/ClearType variance without changing the actual
  // vertical displacement.
  for (let y = 40; y < height - 40; y += 17) {
    for (let x = 1; x < WIDTH; x += 11) {
      const pixel = (y * WIDTH + x) * 4;
      next.data[pixel] = Math.min(255, next.data[pixel] + 5);
      next.data[pixel + 1] = Math.max(0, next.data[pixel + 1] - 4);
    }
  }
  const match = matchLiteSnapVerticalFrames(previous, next);

  assert.equal(match.confident, true, JSON.stringify(match));
  assert.ok(Math.abs(match.overlap - (height - 101)) <= 1);
});

test("LiteSnap stitcher rejects invalid frame data", () => {
  const match = matchLiteSnapVerticalFrames(
    { width: 10, height: 10, data: new Uint8Array(3) },
    makeFrame(0)
  );

  assert.equal(match.confident, false);
});

test("LiteSnap prepared frames reuse one bitmap and one set of row features", () => {
  const previous = prepareLiteSnapStitchFrame(makeFrame(0, 0, 324));
  const next = prepareLiteSnapStitchFrame(makeFrame(101, 0, 324));
  const first = matchLiteSnapVerticalFrames(previous, next);
  const second = matchLiteSnapVerticalFrames(previous, next);

  assert.equal(first.confident, true);
  assert.equal(first.overlap, 223);
  assert.deepEqual(second, first);
  assert.equal(previous.rowLuminance.byteLength, previous.height * previous.sampleColumns);
  assert.equal(next.rowMinimum.byteLength, next.height);
});

function makeSparseBenchmarkFrame(
  width: number,
  height: number,
  contentOffset: number
): LiteSnapStitchFrame {
  const data = new Uint8Array(width * height * 4);
  const sampleColumns = Math.min(48, Math.max(12, Math.floor(width / 32)));
  for (let row = 0; row < height; row += 1) {
    for (let columnIndex = 0; columnIndex < sampleColumns; columnIndex += 1) {
      const column = Math.floor(((columnIndex + 0.5) * width) / sampleColumns);
      const pixel = (row * width + column) * 4;
      const globalRow = contentOffset + row;
      let hash = (globalRow + Math.imul(columnIndex + 17, 374_761_393)) >>> 0;
      hash = Math.imul(hash ^ (hash >>> 16), 1_597_334_677) >>> 0;
      hash = Math.imul(hash ^ (hash >>> 15), 2_246_822_519) >>> 0;
      hash ^= hash >>> 16;
      const value = hash & 0xff;
      data[pixel] = value;
      data[pixel + 1] = (value * 3) % 255;
      data[pixel + 2] = (value * 7) % 255;
      data[pixel + 3] = 255;
    }
  }
  return { width, height, data };
}

for (const [width, height] of [
  [1920, 1080],
  [2560, 1440],
  [3840, 2160]
] as const) {
  test(`LiteSnap prepared matcher benchmark ${width}x${height}`, () => {
    const scrollRows = Math.round(height * 0.37) + 1;
    const startedAt = performance.now();
    const previous = prepareLiteSnapStitchFrame(
      makeSparseBenchmarkFrame(width, height, 0)
    );
    const next = prepareLiteSnapStitchFrame(
      makeSparseBenchmarkFrame(width, height, scrollRows)
    );
    const match = matchLiteSnapVerticalFrames(previous, next);
    const elapsedMs = performance.now() - startedAt;

    assert.equal(match.confident, true);
    assert.equal(match.appendedHeight, scrollRows);
    assert.ok(elapsedMs < 5_000, `${width}x${height} matcher took ${elapsedMs.toFixed(1)} ms`);
  });
}
