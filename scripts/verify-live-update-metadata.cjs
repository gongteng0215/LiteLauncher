const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const yaml = require("js-yaml");

const projectRoot = path.resolve(__dirname, "..");

function parseVersionTag(tag) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(tag || "").trim());
  if (!match) {
    throw new Error(`invalid stable version tag: ${tag}`);
  }
  return {
    tag: `v${match[1]}.${match[2]}.${match[3]}`,
    version: `${match[1]}.${match[2]}.${match[3]}`,
    parts: match.slice(1).map(Number)
  };
}

function compareVersions(left, right) {
  for (let index = 0; index < 3; index += 1) {
    const difference = left.parts[index] - right.parts[index];
    if (difference !== 0) return difference;
  }
  return 0;
}

function previousPatchTag(versionTag) {
  const parsed = parseVersionTag(versionTag);
  if (parsed.parts[2] <= 0) {
    throw new Error(`cannot infer a previous patch tag from ${parsed.tag}`);
  }
  return `v${parsed.parts[0]}.${parsed.parts[1]}.${parsed.parts[2] - 1}`;
}

function validateLiveUpdateContract(input) {
  const baseline = parseVersionTag(input.baselineTag);
  const target = parseVersionTag(input.targetTag);
  if (compareVersions(baseline, target) >= 0) {
    throw new Error(`target ${target.tag} must be newer than baseline ${baseline.tag}`);
  }

  const release = input.release;
  if (!release || release.tag_name !== target.tag) {
    throw new Error(`GitHub Latest must be ${target.tag}, received ${release?.tag_name || "none"}`);
  }
  if (release.draft === true || release.prerelease === true) {
    throw new Error(`${target.tag} must be a published stable release`);
  }

  const assets = Array.isArray(release.assets) ? release.assets : [];
  const assetByName = new Map(assets.map((asset) => [asset.name, asset]));
  const installerName = `LiteLauncher-Setup-${target.version}.exe`;
  const requiredNames = [
    "latest.yml",
    installerName,
    `${installerName}.blockmap`
  ];
  for (const name of requiredNames) {
    if (!assetByName.has(name)) {
      throw new Error(`${target.tag} is missing required updater asset ${name}`);
    }
  }

  const metadata = input.metadata;
  if (!metadata || String(metadata.version) !== target.version) {
    throw new Error(`latest.yml version must be ${target.version}`);
  }
  if (metadata.path !== installerName) {
    throw new Error(`latest.yml path must be ${installerName}`);
  }
  const metadataFiles = Array.isArray(metadata.files) ? metadata.files : [];
  const installerMetadata = metadataFiles.find((file) => file?.url === installerName);
  if (!installerMetadata || typeof installerMetadata.sha512 !== "string") {
    throw new Error(`latest.yml must include a sha512 entry for ${installerName}`);
  }

  const installerAsset = assetByName.get(installerName);
  const metadataSize = Number(installerMetadata.size ?? metadata.size);
  if (!Number.isFinite(metadataSize) || metadataSize <= 0) {
    throw new Error("latest.yml installer size must be a positive number");
  }
  if (Number(installerAsset.size) !== metadataSize) {
    throw new Error(
      `installer size mismatch: latest.yml=${metadataSize}, GitHub=${installerAsset.size}`
    );
  }

  return {
    baselineTag: baseline.tag,
    targetTag: target.tag,
    installerName,
    installerSize: metadataSize,
    releaseUrl: release.html_url || null,
    releaseNotesAvailable: typeof release.body === "string" && release.body.trim().length > 0
  };
}

function resolveGitHubToken() {
  const environmentToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (environmentToken) return environmentToken.trim();
  const result = spawnSync("gh", ["auth", "token"], {
    encoding: "utf8",
    windowsHide: true,
    stdio: ["ignore", "pipe", "ignore"]
  });
  return result.status === 0 ? result.stdout.trim() : "";
}

function githubHeaders(token, accept) {
  return {
    Accept: accept,
    "User-Agent": "LiteLauncher-update-metadata-verifier",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function fetchJson(url, token) {
  const response = await fetch(url, {
    headers: githubHeaders(token, "application/vnd.github+json")
  });
  if (!response.ok) {
    throw new Error(`GitHub request failed (${response.status}): ${url}`);
  }
  return response.json();
}

async function fetchText(url, token) {
  const response = await fetch(url, {
    headers: githubHeaders(token, "application/octet-stream"),
    redirect: "follow"
  });
  if (!response.ok) {
    throw new Error(`asset request failed (${response.status}): ${url}`);
  }
  return response.text();
}

function resolveRepository(packageJson) {
  const repositoryUrl = String(packageJson.repository?.url || "");
  const match = /github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?$/i.exec(repositoryUrl);
  if (!match) {
    throw new Error("package.json repository must point to a GitHub repository");
  }
  return `${match[1]}/${match[2]}`;
}

async function main() {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")
  );
  const repository = resolveRepository(packageJson);
  const token = resolveGitHubToken();
  const targetTag = process.argv[3] || `v${packageJson.version}`;
  const baselineTag = process.argv[2] || previousPatchTag(targetTag);
  const release = await fetchJson(
    `https://api.github.com/repos/${repository}/releases/latest`,
    token
  );
  const metadataAsset = (release.assets || []).find((asset) => asset.name === "latest.yml");
  if (!metadataAsset?.browser_download_url) {
    throw new Error(`${release.tag_name || targetTag} is missing downloadable latest.yml`);
  }
  const metadata = yaml.load(await fetchText(metadataAsset.browser_download_url, token));
  const result = validateLiveUpdateContract({ baselineTag, targetTag, release, metadata });
  console.info(`[update-metadata] OK: ${result.baselineTag} -> ${result.targetTag}`);
  console.info(
    `[update-metadata] ${result.installerName} (${result.installerSize} bytes), release notes=${result.releaseNotesAvailable ? "yes" : "no"}`
  );
  if (result.releaseUrl) console.info(`[update-metadata] ${result.releaseUrl}`);
  console.info("[update-metadata] read-only verification complete; no installer was downloaded or run");
}

module.exports = {
  compareVersions,
  parseVersionTag,
  previousPatchTag,
  validateLiveUpdateContract
};

if (require.main === module) {
  main().catch((error) => {
    console.error(`[update-metadata] failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
