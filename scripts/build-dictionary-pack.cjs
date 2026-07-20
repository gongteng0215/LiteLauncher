/**
 * Build a standalone FTS dictionary pack for GitHub Release upload
 * (`ecdict-fts.db`) without mutating the slim installer copy permanently.
 *
 * Usage:
 *   node scripts/build-dictionary-pack.cjs [outPath]
 */
const fs = require("fs");
const path = require("path");

const { patchEcdictFts } = require("./patch-ecdict-fts.cjs");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function main() {
  const sourceDb = path.join(process.cwd(), "src", "assets", "ecdict.db");
  if (!fs.existsSync(sourceDb)) {
    throw new Error(`missing source dictionary: ${sourceDb}`);
  }

  const outPath = path.resolve(
    process.argv[2] || path.join(process.cwd(), "release", "ecdict-fts.db")
  );
  ensureDir(path.dirname(outPath));
  fs.copyFileSync(sourceDb, outPath);
  patchEcdictFts(outPath);
  const sizeMb = (fs.statSync(outPath).size / (1024 * 1024)).toFixed(1);
  console.info(`[build-dictionary-pack] wrote ${outPath} (${sizeMb} MB)`);
}

main();
