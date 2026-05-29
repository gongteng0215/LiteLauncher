import assert from "node:assert/strict";
import test from "node:test";

import { formatPinnedToggleStatus } from "../renderer/pinning";

test("formatPinnedToggleStatus describes successful pin and unpin changes", () => {
  assert.equal(
    formatPinnedToggleStatus("Codex", { ok: true, pinned: true }),
    "已置顶：Codex"
  );
  assert.equal(
    formatPinnedToggleStatus("Codex", { ok: true, pinned: false }),
    "已取消置顶：Codex"
  );
});

test("formatPinnedToggleStatus explains why pinning was rejected", () => {
  assert.equal(
    formatPinnedToggleStatus("Codex", {
      ok: false,
      pinned: true,
      reason: "missing-catalog-item"
    }),
    "置顶失败：当前结果已过期，请重新搜索"
  );
  assert.equal(
    formatPinnedToggleStatus("Codex", {
      ok: false,
      pinned: true,
      reason: "empty-item-id"
    }),
    "置顶失败：无效项目"
  );
  assert.equal(
    formatPinnedToggleStatus("Codex", {
      ok: false,
      pinned: true,
      reason: "persist-failed"
    }),
    "置顶失败：保存失败，请重试"
  );
});
