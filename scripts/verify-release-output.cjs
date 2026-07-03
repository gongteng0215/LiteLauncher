const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const VALID_PLATFORMS = new Set(["win", "mac", "mac-release"]);

function fail(message) {
  console.error(`[verify-release-output] ${message}`);
  process.exit(1);
}

const platform = String(process.argv[2] ?? "").trim().toLowerCase();
if (!VALID_PLATFORMS.has(platform)) {
  fail("usage: node scripts/verify-release-output.cjs <win|mac|mac-release>");
}

const projectRoot = path.resolve(__dirname, "..");
const packageJsonPath = path.join(projectRoot, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const expectedVersion = String(packageJson.version ?? "").trim();
if (!expectedVersion) {
  fail("package.json version is empty");
}

const releaseDir = path.join(projectRoot, "release");
const metadataFileName = platform === "win" ? "latest.yml" : "latest-mac.yml";
const metadataPath = path.join(releaseDir, metadataFileName);
if (!fs.existsSync(metadataPath)) {
  fail(`missing ${metadataFileName} in release output`);
}

const metadata = yaml.load(fs.readFileSync(metadataPath, "utf8"));
if (!metadata || typeof metadata !== "object") {
  fail(`${metadataFileName} is not valid YAML metadata`);
}

const record = metadata;
const actualVersion = String(record.version ?? "").trim();
if (actualVersion !== expectedVersion) {
  fail(
    `${metadataFileName} version ${actualVersion || "<empty>"} does not match package.json version ${expectedVersion}`
  );
}

const expectedMetadataPathPatterns = getExpectedMetadataPathPatterns(platform, expectedVersion);
const expectedFilePatterns = getExpectedFilePatterns(platform, expectedVersion);

const metadataPathValue = String(record.path ?? "").trim();
if (!matchesAnyPattern(metadataPathValue, expectedMetadataPathPatterns)) {
  fail(
    `${metadataFileName} path ${metadataPathValue || "<empty>"} does not match expected ${platform} artifact for version ${expectedVersion}`
  );
}

const localArtifactPath = path.join(releaseDir, metadataPathValue);
if (!fs.existsSync(localArtifactPath)) {
  fail(
    `${metadataFileName} points to missing local artifact ${metadataPathValue || "<empty>"}`
  );
}

const files = Array.isArray(record.files) ? record.files : [];
if (files.length === 0) {
  fail(`${metadataFileName} must include at least one file entry`);
}

if (platform === "mac-release") {
  const arm64Zip = new RegExp(
    `^LiteLauncher-${escapeRegExp(expectedVersion)}-arm64-mac\\.zip$`,
    "i"
  );
  const x64Zip = new RegExp(
    `^LiteLauncher-${escapeRegExp(expectedVersion)}-mac\\.zip$`,
    "i"
  );
  if (!files.some((entry) => arm64Zip.test(String(entry?.url ?? "").trim()))) {
    fail(`${metadataFileName} must include an arm64 mac zip artifact for release publishing`);
  }
  if (!files.some((entry) => x64Zip.test(String(entry?.url ?? "").trim()))) {
    fail(`${metadataFileName} must include an x64 mac zip artifact for release publishing`);
  }
}

for (const entry of files) {
  if (!entry || typeof entry !== "object") {
    fail(`${metadataFileName} contains an invalid files entry`);
  }

  const url = String(entry.url ?? "").trim();
  if (!matchesAnyPattern(url, expectedFilePatterns)) {
    fail(
      `${metadataFileName} file url ${url || "<empty>"} does not match expected ${platform} artifact for version ${expectedVersion}`
    );
  }

  const localFilePath = path.join(releaseDir, url);
  if (!fs.existsSync(localFilePath)) {
    fail(
      `${metadataFileName} file url ${url || "<empty>"} points to a missing local artifact`
    );
  }
}

if (platform === "win") {
  const nativeAddonPath = path.join(
    releaseDir,
    "win-unpacked",
    "resources",
    "app.asar.unpacked",
    "dist",
    "native",
    "litesnap-capture.node"
  );
  if (!fs.existsSync(nativeAddonPath)) {
    fail(
      `missing packaged native addon at ${path.relative(projectRoot, nativeAddonPath)}`
    );
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesAnyPattern(value, patterns) {
  return patterns.some((pattern) => pattern.test(value));
}

function getExpectedMetadataPathPatterns(platformName, version) {
  if (platformName === "win") {
    return [new RegExp(`^LiteLauncher-Setup-${escapeRegExp(version)}\\.exe$`, "i")];
  }

  if (platformName === "mac-release") {
    return [
      new RegExp(`^LiteLauncher-${escapeRegExp(version)}-mac\\.zip$`, "i"),
      new RegExp(`^LiteLauncher-${escapeRegExp(version)}-arm64-mac\\.zip$`, "i")
    ];
  }

  return [new RegExp(`^LiteLauncher-${escapeRegExp(version)}(?:-(?:arm64-)?mac)?\\.zip$`, "i")];
}

function getExpectedFilePatterns(platformName, version) {
  if (platformName === "win") {
    return getExpectedMetadataPathPatterns(platformName, version);
  }

  const basePatterns = getExpectedMetadataPathPatterns(platformName, version);
  return [
    ...basePatterns,
    new RegExp(`^LiteLauncher-${escapeRegExp(version)}(?:-arm64)?\\.dmg$`, "i")
  ];
}
