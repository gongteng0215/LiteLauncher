import assert from "node:assert/strict";
import test from "node:test";

import {
  decodeClipboardWorkbenchFileNameW,
  normalizeClipboardWorkbenchText
} from "../shared/clipboard-workbench";

test("normalizes CRLF text and trims blank outer lines", () => {
  assert.equal(
    normalizeClipboardWorkbenchText("\r\n  alpha\r\nbeta  \r\n"),
    "alpha\nbeta"
  );
});

test("decodes FileNameW buffers into a path list", () => {
  const buffer = Buffer.from("C:\\A.txt\0D:\\B.png\0\0", "utf16le");

  assert.deepEqual(decodeClipboardWorkbenchFileNameW(buffer), [
    "C:\\A.txt",
    "D:\\B.png"
  ]);
});
