const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const releaseDir = path.join(projectRoot, "release");

try {
  fs.rmSync(releaseDir, { recursive: true, force: true });
} catch (error) {
  console.error("[clean-release] failed to remove release directory", error);
  process.exit(1);
}

