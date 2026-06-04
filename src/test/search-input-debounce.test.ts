import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  isKeyboardDrivenSearchInputKey,
  shouldDebounceSearchRefresh
} from "../shared/search-input";

const rendererPath = path.join(process.cwd(), "src", "renderer", "renderer.ts");

test("keyboard-driven search input keeps empty queries debounced in search mode", () => {
  assert.equal(shouldDebounceSearchRefresh("", true, true), true);
  assert.equal(shouldDebounceSearchRefresh("   ", true, true), true);
  assert.equal(shouldDebounceSearchRefresh("", true, false), false);
  assert.equal(shouldDebounceSearchRefresh("codex", true, false), true);
  assert.equal(shouldDebounceSearchRefresh("codex", false, true), false);
});

test("keyboard-driven search input detection includes delete/backspace and excludes arrows", () => {
  assert.equal(isKeyboardDrivenSearchInputKey({ key: "Backspace" }), true);
  assert.equal(isKeyboardDrivenSearchInputKey({ key: "Delete" }), true);
  assert.equal(isKeyboardDrivenSearchInputKey({ key: "Del" }), true);
  assert.equal(isKeyboardDrivenSearchInputKey({ key: "a" }), true);
  assert.equal(
    isKeyboardDrivenSearchInputKey({ key: "v", ctrlKey: true }),
    true
  );
  assert.equal(
    isKeyboardDrivenSearchInputKey({ key: "ArrowDown" }),
    false
  );
  assert.equal(
    isKeyboardDrivenSearchInputKey({ key: "c", ctrlKey: true }),
    false
  );
});

test("renderer wires keyboard-aware debounce scheduling for search input", () => {
  const source = fs.readFileSync(rendererPath, "utf8");

  assert.doesNotMatch(
    source,
    /require\("\.\.\/shared\/search-input"\)/,
    "renderer bootstrap must stay browser-safe and avoid runtime require"
  );
  assert.match(source, /let pendingSearchInputFromKeyboard = false;/);
  assert.match(
    source,
    /scheduleSearchRefreshFromInput\(input\.value,\s*\{\s*fromKeyboard:\s*pendingSearchInputFromKeyboard\s*\}\)/
  );
});
