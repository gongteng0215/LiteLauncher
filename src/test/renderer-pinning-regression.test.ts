import assert from "node:assert/strict";
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
