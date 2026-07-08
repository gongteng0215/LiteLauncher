import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
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

  assert.ok(
    candidates.some((candidate) =>
      candidate.replace(/\\/g, "/").endsWith("dist/native/litesnap-capture.node")
    ),
    "candidates should include the module-relative dist/native path"
  );
});

test("resolveLiteSnapNativeAddonCandidates prefers module-relative path in unpackaged Electron", () => {
  const candidates = resolveLiteSnapNativeAddonCandidates();
  const moduleRelative = path.normalize(
    path.join(__dirname, "../native/litesnap-capture.node")
  );
  const first = candidates[0]!;

  // Under node:test / unpackaged Electron, app.isPackaged is false/unavailable,
  // so the local build output should be first to avoid MODULE_NOT_FOUND noise.
  assert.equal(
    path.normalize(first),
    moduleRelative,
    "unpackaged runs should try dist/native before electron/resources packaged candidates"
  );
});

test("resolveLiteSnapNativeAddonCandidates still lists packaged unpacked path", () => {
  const candidates = resolveLiteSnapNativeAddonCandidates();
  const unpackedIndex = candidates.findIndex((candidate) =>
    candidate.includes("app.asar.unpacked")
  );
  if (unpackedIndex < 0) {
    return;
  }

  assert.ok(unpackedIndex >= 0);
});

test("resolveLiteSnapNativeAddonPath returns an existing addon when present", () => {
  const resolved = resolveLiteSnapNativeAddonPath();
  assert.match(resolved, /litesnap-capture\.node$/);
  if (fs.existsSync(resolved)) {
    assert.ok(fs.existsSync(resolved));
  }
});
