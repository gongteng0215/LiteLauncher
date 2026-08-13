import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  resolveLiteSnapNativeAddonCandidates,
  resolveLiteSnapNativeAddonFromManifest,
  resolveLiteSnapNativeAddonPath
} from "../main/litesnap/native-addon-path";

function createManifestFixture(overrides: Record<string, unknown> = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "litesnap-native-manifest-"));
  const data = Buffer.from("native-addon-fixture");
  const sha256 = crypto.createHash("sha256").update(data).digest("hex");
  const fileName = `litesnap-capture-${sha256.slice(0, 16)}.node`;
  fs.writeFileSync(path.join(directory, fileName), data);
  fs.writeFileSync(
    path.join(directory, "litesnap-capture-manifest.json"),
    JSON.stringify({
      schemaVersion: 1,
      fileName,
      sha256,
      fingerprint: "fixture",
      napiVersion: Math.max(1, Number(process.versions.napi ?? 1)),
      arch: process.arch,
      requiredExports: ["captureDisplayRect"],
      builtAt: new Date(0).toISOString(),
      ...overrides
    })
  );
  return { directory, fileName };
}

test("native addon candidates include local and packaged compatibility paths", () => {
  const candidates = resolveLiteSnapNativeAddonCandidates();
  assert.ok(candidates.length >= 3);
  assert.ok(
    candidates.some((candidate) =>
      /dist[\\/]native[\\/]litesnap-capture(?:-v[23])?\.node$/.test(candidate)
    )
  );
  if (typeof process.resourcesPath === "string" && process.resourcesPath.length > 0) {
    assert.ok(candidates.some((candidate) => candidate.includes("app.asar.unpacked")));
  }
});

test("manifest resolver accepts a matching hash, N-API version and architecture", () => {
  const fixture = createManifestFixture();
  assert.equal(
    resolveLiteSnapNativeAddonFromManifest(fixture.directory),
    path.join(fixture.directory, fixture.fileName)
  );
});

test("manifest resolver rejects hash, ABI, architecture and traversal mismatches", () => {
  for (const overrides of [
    { sha256: "0".repeat(64) },
    { napiVersion: Number(process.versions.napi ?? 1) + 1 },
    { arch: process.arch === "x64" ? "arm64" : "x64" },
    { fileName: "../litesnap-capture-0000000000000000.node" }
  ]) {
    const fixture = createManifestFixture(overrides);
    assert.equal(resolveLiteSnapNativeAddonFromManifest(fixture.directory), null);
  }
});

test("native addon path returns an existing active or legacy addon when available", () => {
  const resolved = resolveLiteSnapNativeAddonPath();
  assert.match(resolved, /litesnap-capture(?:-[a-f0-9]{16}|-v[23])?\.node$/);
  if (fs.existsSync(resolved)) {
    assert.ok(fs.statSync(resolved).size > 0);
  }
});
