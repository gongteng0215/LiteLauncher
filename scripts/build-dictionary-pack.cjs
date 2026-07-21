/**
 * Build a standalone full FTS dictionary pack for GitHub Release upload
 * (`ecdict-fts.db` + `ecdict-fts.db.sha256`) from the complete ECDICT CSV.
 *
 * Usage:
 *   node scripts/build-dictionary-pack.cjs [outPath]
 */
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { loadRowsFromCsv, writeDatabase, resolveDefaultCsvPath } = require("./ecdict-build-lib.cjs");
const { patchEcdictFts } = require("./patch-ecdict-fts.cjs");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeSha256File(dbPath) {
  const hash = crypto.createHash("sha256").update(fs.readFileSync(dbPath)).digest("hex");
  const shaPath = `${dbPath}.sha256`;
  fs.writeFileSync(shaPath, `${hash}\n`, "utf8");
  return shaPath;
}

function main() {
  const csvPath = resolveDefaultCsvPath();
  if (!csvPath) {
    throw new Error("missing ECDICT CSV at scripts/vendor/ecdict.csv");
  }

  const outPath = path.resolve(
    process.argv[2] || path.join(process.cwd(), "release", "ecdict-fts.db")
  );
  ensureDir(path.dirname(outPath));

  const tempDb = path.join(
    os.tmpdir(),
    `litelauncher-ecdict-full-${Date.now()}.db`
  );
  try {
    const rows = loadRowsFromCsv(csvPath);
    writeDatabase(tempDb, rows);
    fs.copyFileSync(tempDb, outPath);
    patchEcdictFts(outPath);
    const shaPath = writeSha256File(outPath);
    const sizeMb = (fs.statSync(outPath).size / (1024 * 1024)).toFixed(1);
    console.info(
      `[build-dictionary-pack] wrote ${outPath} (${rows.length} entries, ${sizeMb} MB)`
    );
    console.info(`[build-dictionary-pack] wrote ${shaPath}`);
  } finally {
    try {
      fs.unlinkSync(tempDb);
    } catch {
      // ignore cleanup errors
    }
  }
}

main();
