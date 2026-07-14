import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { findLaunchEntryIndexByItemId } from "../renderer/pinning";

test("findLaunchEntryIndexByItemId relocates a launch result after list refresh", () => {
  const entries = [
    {
      kind: "launch" as const,
      item: {
        id: "app:other",
        type: "application" as const,
        title: "Other",
        subtitle: "other.exe",
        target: "C:\\Other\\other.exe",
        keywords: ["other"]
      }
    },
    {
      kind: "launch" as const,
      item: {
        id: "app:startapp:codex",
        type: "application" as const,
        title: "Codex",
        subtitle: "codex.exe",
        target: "command:apps-folder:OpenAI.Codex_2p2nqsd0c76g0!App",
        keywords: ["codex"]
      }
    }
  ];

  assert.equal(findLaunchEntryIndexByItemId(entries, "app:startapp:codex"), 1);
  assert.equal(findLaunchEntryIndexByItemId(entries, "missing"), -1);
});

test("renderer pin toggle treats pinned-section membership as pinned", () => {
  const rendererSource = fs.readFileSync(
    path.join(process.cwd(), "src", "renderer", "renderer.ts"),
    "utf8"
  );

  assert.match(
    rendererSource,
    /function isLaunchEntryPinned\(index: number, item: LaunchItem\): boolean/,
    "renderer should detect pinned state from section membership, not only item.pinned"
  );
  assert.match(
    rendererSource,
    /pinButton\.textContent = isLaunchEntryPinned\(index, entry\.item\) \? "取消置顶" : "置顶"/,
    "context menu label should use section-aware pinned detection"
  );
  assert.match(
    rendererSource,
    /const nextPinned = !isLaunchEntryPinned\(index, item\);/,
    "pin toggle should unpin items shown in the pinned section even if pinned flag was lost"
  );
});
