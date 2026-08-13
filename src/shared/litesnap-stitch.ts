export type LiteSnapStitchFrame = {
  width: number;
  height: number;
  data: Uint8Array;
};

export type LiteSnapPreparedStitchFrame = LiteSnapStitchFrame & {
  sampleColumns: number;
  rowLuminance: Uint8Array;
  rowMinimum: Uint8Array;
  rowMaximum: Uint8Array;
};

export type LiteSnapStitchMatch = {
  overlap: number;
  appendedHeight: number;
  score: number;
  confident: boolean;
};

export type LiteSnapStitchDirection = "down" | "up";

export type LiteSnapDirectionalStitchMatch = LiteSnapStitchMatch & {
  direction: LiteSnapStitchDirection;
};

export type LiteSnapStitchRange = {
  currentTop: number;
  capturedTop: number;
  capturedBottom: number;
};

export type LiteSnapStitchRangeAdvance = {
  nextTop: number;
  nextBottom: number;
  prependHeight: number;
  appendHeight: number;
};

type OverlapScore = {
  score: number;
  detailRows: number;
};

const MAX_SAMPLE_ROWS = 128;
const MIN_SAMPLE_COLUMNS = 12;
const MAX_SAMPLE_COLUMNS = 48;
const MIN_DETAIL_RANGE = 18;
const MIN_DETAIL_ROWS = 4;
const MIN_OVERLAP_RATIO = 0.18;
// Manual mouse-wheel gestures often move WPS/Office documents by only a few
// text lines. Keep overlaps up to 99.5% so even a four-pixel movement can still
// be stitched; the score and best-vs-second-best margin continue to reject
// ambiguous stationary/repeating content.
const MAX_OVERLAP_RATIO = 0.995;
const EDGE_IGNORE_RATIO = 0.12;
// Native Windows captures of the same text rows can differ by several gray
// levels because ClearType/subpixel composition is evaluated between frames.
// Real WPS/Office regression frames score around 14 while still resolving to a
// distinct seam, so allow that variance and continue relying on the runner-up
// margin below to reject ambiguous/repeating content.
const CONFIDENT_SCORE = 18;
const MIN_SCORE_MARGIN = 1.5;
const MIN_DISTINCT_SEAM_DISTANCE = 4;
const QUIET_SEAM_SCORE = 24;
const COARSE_OVERLAP_STEP = 4;
// Row subsampling makes the coarse score intentionally approximate. Keep a
// broad shortlist so a one-pixel/non-stride seam is never discarded before
// the exact pass, while still evaluating far fewer rows than a full scan.
const COARSE_CANDIDATE_COUNT = 64;
const COARSE_SIGNATURE_ROWS = 12;

function pixelLuminance(frame: LiteSnapStitchFrame, row: number, column: number): number {
  const x = Math.min(frame.width - 1, Math.max(0, column));
  const offset = (row * frame.width + x) * 4;
  return Math.round(
    frame.data[offset] * 0.2126 +
      frame.data[offset + 1] * 0.7152 +
      frame.data[offset + 2] * 0.0722
  );
}

function pixelColorDifference(
  left: LiteSnapStitchFrame,
  leftRow: number,
  right: LiteSnapStitchFrame,
  rightRow: number,
  column: number
): number {
  const leftOffset = (leftRow * left.width + column) * 4;
  const rightOffset = (rightRow * right.width + column) * 4;
  return (
    Math.abs((left.data[leftOffset] ?? 0) - (right.data[rightOffset] ?? 0)) +
    Math.abs((left.data[leftOffset + 1] ?? 0) - (right.data[rightOffset + 1] ?? 0)) +
    Math.abs((left.data[leftOffset + 2] ?? 0) - (right.data[rightOffset + 2] ?? 0))
  ) / 3;
}

export function prepareLiteSnapStitchFrame(
  frame: LiteSnapStitchFrame
): LiteSnapPreparedStitchFrame {
  const sampleColumns = Math.min(
    MAX_SAMPLE_COLUMNS,
    Math.max(MIN_SAMPLE_COLUMNS, Math.floor(Math.max(1, frame.width) / 32))
  );
  const rowLuminance = new Uint8Array(Math.max(0, frame.height) * sampleColumns);
  const rowMinimum = new Uint8Array(Math.max(0, frame.height));
  const rowMaximum = new Uint8Array(Math.max(0, frame.height));
  for (let row = 0; row < frame.height; row += 1) {
    let minimum = 255;
    let maximum = 0;
    for (let columnIndex = 0; columnIndex < sampleColumns; columnIndex += 1) {
      const column = Math.floor(((columnIndex + 0.5) * frame.width) / sampleColumns);
      const luminance = pixelLuminance(frame, row, column);
      rowLuminance[row * sampleColumns + columnIndex] = luminance;
      minimum = Math.min(minimum, luminance);
      maximum = Math.max(maximum, luminance);
    }
    rowMinimum[row] = minimum;
    rowMaximum[row] = maximum;
  }
  return {
    ...frame,
    sampleColumns,
    rowLuminance,
    rowMinimum,
    rowMaximum
  };
}

function asPreparedFrame(frame: LiteSnapStitchFrame): LiteSnapPreparedStitchFrame {
  const candidate = frame as Partial<LiteSnapPreparedStitchFrame>;
  if (
    typeof candidate.sampleColumns === "number" &&
    candidate.rowLuminance instanceof Uint8Array &&
    candidate.rowMinimum instanceof Uint8Array &&
    candidate.rowMaximum instanceof Uint8Array
  ) {
    return candidate as LiteSnapPreparedStitchFrame;
  }
  return prepareLiteSnapStitchFrame(frame);
}

/**
 * Compare only rows that contain enough visual detail. Uniform dark editor
 * backgrounds and sticky app chrome can otherwise create many equally-good
 * overlaps and lead to a visibly misplaced seam.
 */
function compareOverlap(
  previous: LiteSnapStitchFrame,
  next: LiteSnapStitchFrame,
  overlap: number
): OverlapScore {
  const width = Math.min(previous.width, next.width);
  const preparedPrevious = asPreparedFrame(previous);
  const preparedNext = asPreparedFrame(next);
  const sampleColumns = Math.min(
    preparedPrevious.sampleColumns,
    preparedNext.sampleColumns,
    Math.min(MAX_SAMPLE_COLUMNS, Math.max(MIN_SAMPLE_COLUMNS, Math.floor(width / 32)))
  );
  const sampleRows = Math.min(MAX_SAMPLE_ROWS, overlap);
  const previousEdgeIgnore = Math.round(previous.height * EDGE_IGNORE_RATIO);
  const nextEdgeIgnore = Math.round(next.height * EDGE_IGNORE_RATIO);
  let total = 0;
  let detailRows = 0;

  for (let rowIndex = 0; rowIndex < sampleRows; rowIndex += 1) {
    const sourceRow = previous.height - overlap + Math.floor((rowIndex * overlap) / sampleRows);
    const targetRow = Math.floor((rowIndex * overlap) / sampleRows);
    // The top and bottom often contain sticky navigation or status bars. Do
    // not allow unchanged window chrome to determine a stitch location.
    if (
      sourceRow < previousEdgeIgnore ||
      sourceRow >= previous.height - previousEdgeIgnore ||
      targetRow < nextEdgeIgnore ||
      targetRow >= next.height - nextEdgeIgnore
    ) {
      continue;
    }

    const sourceMin = preparedPrevious.rowMinimum[sourceRow] ?? 255;
    const sourceMax = preparedPrevious.rowMaximum[sourceRow] ?? 0;
    const targetMin = preparedNext.rowMinimum[targetRow] ?? 255;
    const targetMax = preparedNext.rowMaximum[targetRow] ?? 0;
    let rowDifference = 0;
    for (let columnIndex = 0; columnIndex < sampleColumns; columnIndex += 1) {
      const column = Math.floor(((columnIndex + 0.5) * width) / sampleColumns);
      rowDifference += pixelColorDifference(
        preparedPrevious,
        sourceRow,
        preparedNext,
        targetRow,
        column
      );
    }

    if (
      sourceMax - sourceMin < MIN_DETAIL_RANGE ||
      targetMax - targetMin < MIN_DETAIL_RANGE
    ) {
      continue;
    }
    total += rowDifference / sampleColumns;
    detailRows += 1;
  }

  return {
    score: detailRows > 0 ? total / detailRows : Number.POSITIVE_INFINITY,
    detailRows
  };
}

/**
 * Cheap row-signature comparison used only to shortlist seam neighborhoods.
 * It checks every possible overlap with twelve prepared rows, so a correct
 * non-stride seam cannot disappear merely because it falls between two
 * coarse grid points. The more expensive 128-row comparison still makes the
 * final confidence decision.
 */
function compareOverlapSignature(
  previous: LiteSnapPreparedStitchFrame,
  next: LiteSnapPreparedStitchFrame,
  overlap: number
): OverlapScore {
  const edge = Math.round(Math.min(previous.height, next.height) * EDGE_IGNORE_RATIO);
  const firstTargetRow = Math.max(edge, overlap - previous.height + edge);
  const lastTargetRow = Math.min(
    overlap - edge - 1,
    next.height - edge - 1
  );
  if (lastTargetRow < firstTargetRow) {
    return { score: Number.POSITIVE_INFINITY, detailRows: 0 };
  }
  const rowCount = Math.min(
    COARSE_SIGNATURE_ROWS,
    lastTargetRow - firstTargetRow + 1
  );
  const sampleColumns = Math.min(previous.sampleColumns, next.sampleColumns);
  let total = 0;
  let detailRows = 0;
  for (let index = 0; index < rowCount; index += 1) {
    const targetRow = firstTargetRow + Math.floor(
      ((index + 0.5) * (lastTargetRow - firstTargetRow + 1)) / rowCount
    );
    const sourceRow = previous.height - overlap + targetRow;
    const sourceRange = (previous.rowMaximum[sourceRow] ?? 0) -
      (previous.rowMinimum[sourceRow] ?? 255);
    const targetRange = (next.rowMaximum[targetRow] ?? 0) -
      (next.rowMinimum[targetRow] ?? 255);
    if (sourceRange < MIN_DETAIL_RANGE || targetRange < MIN_DETAIL_RANGE) {
      continue;
    }
    let rowDifference = 0;
    for (let column = 0; column < sampleColumns; column += 1) {
      const pixelColumn = Math.floor(
        ((column + 0.5) * Math.min(previous.width, next.width)) / sampleColumns
      );
      rowDifference += pixelColorDifference(
        previous,
        sourceRow,
        next,
        targetRow,
        pixelColumn
      );
    }
    total += rowDifference / sampleColumns;
    detailRows += 1;
  }
  return {
    score: detailRows > 0 ? total / detailRows : Number.POSITIVE_INFINITY,
    detailRows
  };
}

/**
 * Finds a vertical overlap without depending on Electron. The outer 12% of a
 * capture is excluded from matching to reduce fixed browser/app chrome noise.
 * It rejects low-detail or ambiguous matches instead of guessing a seam.
 */
export function matchLiteSnapVerticalFrames(
  previous: LiteSnapStitchFrame,
  next: LiteSnapStitchFrame
): LiteSnapStitchMatch {
  if (
    previous.width <= 0 ||
    previous.height <= 0 ||
    next.width <= 0 ||
    next.height <= 0 ||
    previous.data.length < previous.width * previous.height * 4 ||
    next.data.length < next.width * next.height * 4
  ) {
    return { overlap: 0, appendedHeight: 0, score: Number.POSITIVE_INFINITY, confident: false };
  }
  const preparedPrevious = asPreparedFrame(previous);
  const preparedNext = asPreparedFrame(next);

  if (previous.width === next.width && previous.height === next.height) {
    const identical = compareOverlap(preparedPrevious, preparedNext, previous.height);
    if (identical.detailRows >= MIN_DETAIL_ROWS && identical.score <= 1) {
      return {
        overlap: next.height,
        appendedHeight: 0,
        score: identical.score,
        confident: true
      };
    }
  }

  const comparableHeight = Math.min(previous.height, next.height);
  const lowerBound = Math.max(1, Math.round(comparableHeight * MIN_OVERLAP_RATIO));
  const upperBound = Math.max(lowerBound, Math.round(comparableHeight * MAX_OVERLAP_RATIO));
  const ignored = Math.round(comparableHeight * EDGE_IGNORE_RATIO);
  let bestOverlap = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  let secondBestScore = Number.POSITIVE_INFINITY;
  const exactScores: Array<{ overlap: number; score: number }> = [];
  const coarse: Array<{ overlap: number; score: number }> = [];
  for (
    let blockStart = lowerBound;
    blockStart <= upperBound;
    blockStart += COARSE_OVERLAP_STEP
  ) {
    for (
      let overlap = blockStart;
      overlap <= Math.min(upperBound, blockStart + COARSE_OVERLAP_STEP - 1);
      overlap += 1
    ) {
      if (overlap <= ignored || next.height - overlap <= 2) {
        continue;
      }
      const result = compareOverlapSignature(preparedPrevious, preparedNext, overlap);
      if (result.detailRows < MIN_DETAIL_ROWS || !Number.isFinite(result.score)) {
        continue;
      }
      coarse.push({ overlap, score: result.score });
    }
  }
  const exactCandidates = new Set<number>();
  for (const candidate of coarse
    .sort((left, right) => left.score - right.score)
    .slice(0, COARSE_CANDIDATE_COUNT)) {
    for (
      let overlap = Math.max(lowerBound, candidate.overlap - COARSE_OVERLAP_STEP);
      overlap <= Math.min(upperBound, candidate.overlap + COARSE_OVERLAP_STEP);
      overlap += 1
    ) {
      exactCandidates.add(overlap);
    }
  }
  for (const overlap of exactCandidates) {
    if (overlap <= ignored || next.height - overlap <= 2) {
      continue;
    }
    const result = compareOverlap(preparedPrevious, preparedNext, overlap);
    if (result.detailRows < MIN_DETAIL_ROWS || !Number.isFinite(result.score)) {
      continue;
    }
    exactScores.push({ overlap, score: result.score });
  }
  exactScores.sort((left, right) =>
    left.score - right.score || right.overlap - left.overlap
  );
  const best = exactScores[0];
  if (best) {
    bestOverlap = best.overlap;
    bestScore = best.score;
    secondBestScore = exactScores.find(
      (candidate) =>
        Math.abs(candidate.overlap - bestOverlap) >= MIN_DISTINCT_SEAM_DISTANCE
    )?.score ?? Number.POSITIVE_INFINITY;
  }

  const appendedHeight = Math.max(0, next.height - bestOverlap);
  const sufficientlyDistinct =
    !Number.isFinite(secondBestScore) || secondBestScore - bestScore >= MIN_SCORE_MARGIN;
  return {
    overlap: bestOverlap,
    appendedHeight,
    score: bestScore,
    confident:
      bestOverlap > 0 &&
      appendedHeight > 2 &&
      bestScore <= CONFIDENT_SCORE &&
      sufficientlyDistinct
  };
}

/**
 * Matches a newly observed viewport in either vertical direction. Scrolling
 * down appends the new frame's tail; scrolling up prepends the new frame's
 * head. Once a session has selected a direction, callers can lock it to avoid
 * treating a brief reverse scroll as new content.
 */
export function matchLiteSnapVerticalFramesBidirectional(
  current: LiteSnapStitchFrame,
  next: LiteSnapStitchFrame,
  lockedDirection: LiteSnapStitchDirection | null = null
): LiteSnapDirectionalStitchMatch {
  if (lockedDirection === "down") {
    return { ...matchLiteSnapVerticalFrames(current, next), direction: "down" };
  }
  if (lockedDirection === "up") {
    return { ...matchLiteSnapVerticalFrames(next, current), direction: "up" };
  }

  const down = { ...matchLiteSnapVerticalFrames(current, next), direction: "down" as const };
  const up = { ...matchLiteSnapVerticalFrames(next, current), direction: "up" as const };
  if (down.confident && down.appendedHeight <= 2) {
    return down;
  }
  if (down.confident && !up.confident) {
    return down;
  }
  if (up.confident && !down.confident) {
    return up;
  }
  if (!down.confident && !up.confident) {
    return down.score <= up.score ? down : up;
  }

  const preferred = down.score <= up.score ? down : up;
  const alternate = preferred === down ? up : down;
  if (alternate.score - preferred.score < MIN_SCORE_MARGIN) {
    return { ...preferred, confident: false };
  }
  return preferred;
}

/**
 * Advances the current viewport through an already captured vertical range.
 * Returning through existing content produces no new pixels; crossing either
 * boundary reports only the unique rows that should be prepended/appended.
 */
export function advanceLiteSnapStitchRange(
  range: LiteSnapStitchRange,
  direction: LiteSnapStitchDirection,
  movement: number,
  frameHeight: number
): LiteSnapStitchRangeAdvance {
  const safeMovement = Math.max(0, Math.round(movement));
  const safeFrameHeight = Math.max(1, Math.round(frameHeight));
  const nextTop = range.currentTop + (direction === "down" ? safeMovement : -safeMovement);
  const nextBottom = nextTop + safeFrameHeight;
  return {
    nextTop,
    nextBottom,
    prependHeight: Math.max(
      0,
      Math.min(safeFrameHeight, Math.round(range.capturedTop - nextTop))
    ),
    appendHeight: Math.max(
      0,
      Math.min(safeFrameHeight, Math.round(nextBottom - range.capturedBottom))
    )
  };
}

function seamRowScore(frame: LiteSnapStitchFrame, row: number): number {
  const sampleColumns = Math.min(
    64,
    Math.max(MIN_SAMPLE_COLUMNS, Math.floor(frame.width / 24))
  );
  const previousRow = Math.max(0, row - 1);
  const nextRow = Math.min(frame.height - 1, row + 1);
  let minimum = 255;
  let maximum = 0;
  let neighborDifference = 0;
  for (let index = 0; index < sampleColumns; index += 1) {
    const column = Math.floor(((index + 0.5) * frame.width) / sampleColumns);
    const value = pixelLuminance(frame, row, column);
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
    neighborDifference +=
      (Math.abs(value - pixelLuminance(frame, previousRow, column)) +
        Math.abs(value - pixelLuminance(frame, nextRow, column))) /
      2;
  }
  return maximum - minimum + neighborDifference / sampleColumns;
}

/**
 * Moves a stitch boundary by at most maxShift rows toward a visually quiet
 * line. Downward appends may move upward into existing overlap; upward
 * prepends may move downward. If no genuinely quiet row exists, the exact
 * matched boundary is retained.
 */
export function findLiteSnapQuietSeamRow(
  frame: LiteSnapStitchFrame,
  boundary: number,
  direction: LiteSnapStitchDirection,
  maxShift = 48
): number {
  if (
    frame.width <= 0 ||
    frame.height <= 1 ||
    frame.data.length < frame.width * frame.height * 4
  ) {
    return Math.max(0, Math.round(boundary));
  }
  const exact = Math.max(1, Math.min(frame.height - 1, Math.round(boundary)));
  const shift = Math.max(0, Math.round(maxShift));
  const start = direction === "down" ? exact : Math.min(frame.height - 1, exact + shift);
  const end = direction === "down" ? Math.max(1, exact - shift) : exact;
  const step = direction === "down" ? -1 : 1;
  let bestRow = exact;
  let bestScore = seamRowScore(frame, exact);
  for (let row = exact; direction === "down" ? row >= end : row <= start; row += step) {
    const score = seamRowScore(frame, row);
    if (score < bestScore) {
      bestScore = score;
      bestRow = row;
    }
  }
  return bestScore <= QUIET_SEAM_SCORE ? bestRow : exact;
}
