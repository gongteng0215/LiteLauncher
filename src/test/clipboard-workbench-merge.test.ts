import assert from "node:assert/strict";
import test from "node:test";

import {
  mergeClipboardWorkbenchFilePaths,
  mergeClipboardWorkbenchTextItems
} from "../shared/clipboard-workbench";

test("merges text items with blank lines", () => {
  const merged = mergeClipboardWorkbenchTextItems(
    ["alpha", "beta", "gamma"],
    "blank-line"
  );

  assert.equal(merged, "alpha\n\nbeta\n\ngamma");
});

test("merges file paths into one-per-line text", () => {
  const merged = mergeClipboardWorkbenchFilePaths(
    ["C:\\A.txt", "D:\\B.png"],
    "newline"
  );

  assert.equal(merged, "C:\\A.txt\nD:\\B.png");
});
