import assert from "node:assert/strict";
import test from "node:test";

import { selectClipboardWorkbenchEvictionIds } from "../shared/clipboard-workbench";

test("evicts oldest non-pinned items before pinned rows", () => {
  const ids = selectClipboardWorkbenchEvictionIds(
    [
      { id: "old-free", pinned: 0, favorite: 0, byteSize: 30, createdAt: 1 },
      { id: "old-fav", pinned: 0, favorite: 1, byteSize: 30, createdAt: 2 },
      { id: "new-pin", pinned: 1, favorite: 0, byteSize: 30, createdAt: 3 }
    ],
    { maxItems: 2, maxBytes: 60 }
  );

  assert.deepEqual(ids, ["old-free"]);
});

test("evicts by total bytes when count limit alone would keep too much", () => {
  const ids = selectClipboardWorkbenchEvictionIds(
    [
      { id: "old-big", pinned: 0, favorite: 0, byteSize: 80, createdAt: 1 },
      { id: "mid-small", pinned: 0, favorite: 0, byteSize: 20, createdAt: 2 },
      { id: "new-small", pinned: 0, favorite: 0, byteSize: 20, createdAt: 3 }
    ],
    { maxItems: 3, maxBytes: 40 }
  );

  assert.deepEqual(ids, ["old-big"]);
});
