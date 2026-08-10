export type LiteSnapStitchFrame = {
  width: number;
  height: number;
  data: Uint8Array;
};

export type LiteSnapStitchMatch = {
  overlap: number;
  appendedHeight: number;
  score: number;
  confident: boolean;
};

const MAX_SAMPLE_ROWS = 96;
const MIN_OVERLAP_RATIO = 0.18;
const MAX_OVERLAP_RATIO = 0.88;
const EDGE_IGNORE_RATIO = 0.12;
const CONFIDENT_SCORE = 18;

function rowScore(frame: LiteSnapStitchFrame, row: number, sample: number): number {
  const x = Math.min(frame.width - 1, Math.max(0, sample));
  const offset = (row * frame.width + x) * 4;
  return Math.round(
    frame.data[offset] * 0.2126 +
      frame.data[offset + 1] * 0.7152 +
      frame.data[offset + 2] * 0.0722
  );
}

function compareOverlap(
  previous: LiteSnapStitchFrame,
  next: LiteSnapStitchFrame,
  overlap: number
): number {
  const width = Math.min(previous.width, next.width);
  const sampleColumns = Math.min(12, Math.max(3, Math.floor(width / 80)));
  const sampleRows = Math.min(MAX_SAMPLE_ROWS, overlap);
  const previousEdgeIgnore = Math.round(previous.height * EDGE_IGNORE_RATIO);
  const nextEdgeIgnore = Math.round(next.height * EDGE_IGNORE_RATIO);
  let total = 0;
  let count = 0;

  for (let rowIndex = 0; rowIndex < sampleRows; rowIndex += 1) {
    const sourceRow = previous.height - overlap + Math.floor((rowIndex * overlap) / sampleRows);
    const targetRow = Math.floor((rowIndex * overlap) / sampleRows);
    // The top of a frame commonly contains sticky navigation, while the
    // bottom can contain a fixed status/footer bar. Do not let those stable
    // screen decorations determine the overlap confidence.
    if (
      sourceRow < previousEdgeIgnore ||
      sourceRow >= previous.height - previousEdgeIgnore ||
      targetRow < nextEdgeIgnore ||
      targetRow >= next.height - nextEdgeIgnore
    ) {
      continue;
    }
    for (let columnIndex = 0; columnIndex < sampleColumns; columnIndex += 1) {
      const sample = Math.floor(((columnIndex + 0.5) * width) / sampleColumns);
      total += Math.abs(rowScore(previous, sourceRow, sample) - rowScore(next, targetRow, sample));
      count += 1;
    }
  }

  return count > 0 ? total / count : Number.POSITIVE_INFINITY;
}

/**
 * Finds a vertical overlap without depending on Electron. The outer 12% of a
 * capture is excluded from matching to reduce fixed browser/app chrome noise.
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

  if (previous.width === next.width && previous.height === next.height) {
    const identicalScore = compareOverlap(previous, next, previous.height);
    if (identicalScore <= 1) {
      return {
        overlap: next.height,
        appendedHeight: 0,
        score: identicalScore,
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

  for (let overlap = lowerBound; overlap <= upperBound; overlap += Math.max(1, Math.floor(comparableHeight / 72))) {
    if (overlap <= ignored || next.height - overlap <= 2) {
      continue;
    }
    const score = compareOverlap(previous, next, overlap);
    if (score < bestScore || (score === bestScore && overlap > bestOverlap)) {
      bestScore = score;
      bestOverlap = overlap;
    }
  }

  const appendedHeight = Math.max(0, next.height - bestOverlap);
  return {
    overlap: bestOverlap,
    appendedHeight,
    score: bestScore,
    confident: bestOverlap > 0 && appendedHeight > 2 && bestScore <= CONFIDENT_SCORE
  };
}
