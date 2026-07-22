/**
 * Build a standalone full FTS dictionary pack for GitHub Release upload
 * (`ecdict-fts.db` + `ecdict-fts.db.sha256`) from the complete ECDICT CSV.
 *
 * When the vendor CSV is unavailable (typical in CI; scripts/vendor is
 * gitignored), fall back to downloading the previous release pack.
 *
 * Usage:
 *   node scripts/build-dictionary-pack.cjs [outPath]
 *
 * Env:
 *   LITELAUNCHER_ECDICT_FTS_FALLBACK_TAG  previous release tag (default: v1.0.53)
 *   GH_TOKEN / GITHUB_TOKEN                 required for fallback download
 */
const crypto = require("crypto");
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { loadRowsFromCsv, writeDatabase, resolveDefaultCsvPath } = require("./ecdict-build-lib.cjs");
const { patchEcdictFts } = require("./patch-ecdict-fts.cjs");

const DEFAULT_FALLBACK_TAG = "v1.0.53";

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeSha256File(dbPath) {
  const hash = crypto.createHash("sha256").update(fs.readFileSync(dbPath)).digest("hex");
  const shaPath = `${dbPath}.sha256`;
  fs.writeFileSync(shaPath, `${hash}\n`, "utf8");
  return shaPath;
}

function resolveRepoSlug() {
  const fromEnv = String(process.env.GITHUB_REPOSITORY || "").trim();
  if (fromEnv.includes("/")) {
    return fromEnv;
  }
  return "gongteng0215/LiteLauncher";
}

function downloadFallbackPack(outPath) {
  const tag =
    String(process.env.LITELAUNCHER_ECDICT_FTS_FALLBACK_TAG || DEFAULT_FALLBACK_TAG).trim() ||
    DEFAULT_FALLBACK_TAG;
  const token = String(process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "").trim();
  if (!token) {
    throw new Error(
      "missing ECDICT CSV at scripts/vendor/ecdict.csv and no GH_TOKEN/GITHUB_TOKEN for fallback download"
    );
  }

  ensureDir(path.dirname(outPath));
  const repo = resolveRepoSlug();
  const args = [
    "release",
    "download",
    tag,
    "--repo",
    repo,
    "--pattern",
    "ecdict-fts.db",
    "--pattern",
    "ecdict-fts.db.sha256",
    "--dir",
    path.dirname(outPath),
    "--clobber"
  ];

  console.info(
    `[build-dictionary-pack] CSV missing; downloading ${tag} pack from ${repo}`
  );
  const result = spawnSync("gh", args, {
    stdio: "inherit",
    env: {
      ...process.env,
      GH_TOKEN: token,
      GITHUB_TOKEN: token
    },
    shell: process.platform === "win32"
  });
  if (result.status !== 0) {
    throw new Error(
      `failed to download fallback dictionary pack from ${tag} (exit ${result.status ?? "null"})`
    );
  }

  const downloadedDb = path.join(path.dirname(outPath), "ecdict-fts.db");
  if (!fs.existsSync(downloadedDb)) {
    throw new Error(`fallback download succeeded but ${downloadedDb} is missing`);
  }
  if (path.resolve(downloadedDb) !== path.resolve(outPath)) {
    fs.copyFileSync(downloadedDb, outPath);
  }

  const shaPath = `${outPath}.sha256`;
  if (!fs.existsSync(shaPath)) {
    writeSha256File(outPath);
  }

  const sizeMb = (fs.statSync(outPath).size / (1024 * 1024)).toFixed(1);
  console.info(
    `[build-dictionary-pack] reused ${outPath} from ${tag} (${sizeMb} MB)`
  );
}

function buildFromCsv(csvPath, outPath) {
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

function main() {
  const outPath = path.resolve(
    process.argv[2] || path.join(process.cwd(), "release", "ecdict-fts.db")
  );
  const csvPath = resolveDefaultCsvPath();
  if (csvPath) {
    buildFromCsv(csvPath, outPath);
    return;
  }

  downloadFallbackPack(outPath);
}

main();
