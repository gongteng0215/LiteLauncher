/**
 * Add FTS5 reverse-lookup index to an existing ecdict.db without re-importing CSV.
 *
 * Usage:
 *   node scripts/patch-ecdict-fts.cjs
 *   node scripts/patch-ecdict-fts.cjs --db path/to/ecdict.db
 *
 * Default target is dist/assets/ecdict.db (packaged/runtime copy).
 * The committed src/assets/ecdict.db stays without FTS (~88MB) for GitHub limits.
 */
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const DEFAULT_DB = path.join("dist", "assets", "ecdict.db");

function parseArgs(argv) {
  let dbPath = DEFAULT_DB;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--db" && argv[index + 1]) {
      dbPath = argv[index + 1];
      index += 1;
    }
  }
  return { dbPath };
}

function patchEcdictFts(dbPath) {
  if (!fs.existsSync(dbPath)) {
    console.warn(`[patch-ecdict-fts] database not found: ${dbPath}`);
    return false;
  }

  const db = new DatabaseSync(dbPath);
  try {
    const existing = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'entries_translation_fts' LIMIT 1`
      )
      .get();
    if (existing) {
      console.info(`[patch-ecdict-fts] FTS already present in ${dbPath}`);
      return true;
    }

    const startedAt = Date.now();
    db.exec(`
      CREATE VIRTUAL TABLE entries_translation_fts USING fts5(
        word UNINDEXED,
        translation,
        tokenize = 'unicode61'
      );
    `);
    db.exec(`
      INSERT INTO entries_translation_fts(word, translation)
      SELECT word, translation FROM entries;
    `);

    const sizeKb = Math.round(fs.statSync(dbPath).size / 1024);
    const elapsedSec = Math.round((Date.now() - startedAt) / 1000);
    console.info(
      `[patch-ecdict-fts] indexed ${dbPath} (${sizeKb} KB, ${elapsedSec}s)`
    );
    return true;
  } finally {
    db.close();
  }
}

function main() {
  const { dbPath } = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(dbPath)) {
    console.error(`[patch-ecdict-fts] database not found: ${dbPath}`);
    process.exit(1);
  }
  patchEcdictFts(dbPath);
}

if (require.main === module) {
  main();
}

module.exports = { patchEcdictFts };
