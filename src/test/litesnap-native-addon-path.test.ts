import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveLiteSnapNativeAddonCandidates,
  resolveLiteSnapNativeAddonPath
} from "../main/litesnap/native-addon-path";

test("resolveLiteSnapNativeAddonCandidates includes module-relative and packaged paths", () => {
  const candidates = resolveLiteSnapNativeAddonCandidates();
  assert.ok(candidates.length >= 1);
  assert.match(candidates[0]!, /litesnap-capture\.node$/);

  const resourcesPath = process.resourcesPath;
  if (typeof resourcesPath === "string" && resourcesPath.length > 0) {
    assert.ok(
      candidates.some((candidate) => candidate.includes("app.asar.unpacked"))
    );
  }
});

test("resolveLiteSnapNativeAddonPath returns an existing addon when present", () => {
  const resolved = resolveLiteSnapNativeAddonPath();
  assert.match(resolved, /litesnap-capture\.node$/);
});
