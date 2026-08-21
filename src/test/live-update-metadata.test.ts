import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

type ReleaseAsset = { name: string; size: number };
type UpdateContractInput = {
  baselineTag: string;
  targetTag: string;
  release: {
    tag_name: string;
    draft: boolean;
    prerelease: boolean;
    html_url: string;
    body: string;
    assets: ReleaseAsset[];
  };
  metadata: Record<string, unknown>;
};
type UpdateContractResult = {
  baselineTag: string;
  targetTag: string;
  installerName: string;
  installerSize: number;
  releaseNotesAvailable: boolean;
};

const verifier = require(
  path.join(process.cwd(), "scripts", "verify-live-update-metadata.cjs")
) as {
  previousPatchTag(tag: string): string;
  validateLiveUpdateContract(input: UpdateContractInput): UpdateContractResult;
};

function createFixture(): UpdateContractInput {
  return {
    baselineTag: "v1.1.15",
    targetTag: "v1.1.16",
    release: {
      tag_name: "v1.1.16",
      draft: false,
      prerelease: false,
      html_url: "https://github.com/example/LiteLauncher/releases/tag/v1.1.16",
      body: "Release notes",
      assets: [
        { name: "latest.yml", size: 350 },
        { name: "LiteLauncher-Setup-1.1.16.exe", size: 1024 },
        { name: "LiteLauncher-Setup-1.1.16.exe.blockmap", size: 128 }
      ]
    },
    metadata: {
      version: "1.1.16",
      path: "LiteLauncher-Setup-1.1.16.exe",
      files: [
        {
          url: "LiteLauncher-Setup-1.1.16.exe",
          sha512: "fixture-sha512",
          size: 1024
        }
      ]
    }
  };
}

test("live update verifier accepts a published newer release with matching metadata", () => {
  const result = verifier.validateLiveUpdateContract(createFixture());
  assert.equal(result.baselineTag, "v1.1.15");
  assert.equal(result.targetTag, "v1.1.16");
  assert.equal(result.installerName, "LiteLauncher-Setup-1.1.16.exe");
  assert.equal(result.installerSize, 1024);
  assert.equal(result.releaseNotesAvailable, true);
  assert.equal(verifier.previousPatchTag("v1.1.16"), "v1.1.15");
});

test("live update verifier rejects stale, draft, incomplete, or mismatched releases", () => {
  assert.throws(
    () => verifier.validateLiveUpdateContract({ ...createFixture(), targetTag: "v1.1.15" }),
    /must be newer/
  );
  assert.throws(
    () =>
      verifier.validateLiveUpdateContract({
        ...createFixture(),
        release: { ...createFixture().release, draft: true }
      }),
    /published stable release/
  );
  assert.throws(
    () =>
      verifier.validateLiveUpdateContract({
        ...createFixture(),
        release: {
          ...createFixture().release,
          assets: createFixture().release.assets.filter((asset) => !asset.name.endsWith(".blockmap"))
        }
      }),
    /missing required updater asset/
  );
  assert.throws(
    () =>
      verifier.validateLiveUpdateContract({
        ...createFixture(),
        metadata: { ...createFixture().metadata, version: "1.1.17" }
      }),
    /latest\.yml version/
  );
});
