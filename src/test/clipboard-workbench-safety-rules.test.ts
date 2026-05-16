import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultClipboardWorkbenchSettings,
  shouldIgnoreClipboardWorkbenchText
} from "../shared/clipboard-workbench";

test("ignores short numeric verification codes by default", () => {
  const settings = createDefaultClipboardWorkbenchSettings();

  assert.equal(shouldIgnoreClipboardWorkbenchText("123456", settings), true);
  assert.equal(
    shouldIgnoreClipboardWorkbenchText("release-2026-05", settings),
    false
  );
});

test("can disable short code exclusion", () => {
  const settings = {
    ...createDefaultClipboardWorkbenchSettings(),
    ignoreShortCodes: false
  };

  assert.equal(shouldIgnoreClipboardWorkbenchText("123456", settings), false);
});
