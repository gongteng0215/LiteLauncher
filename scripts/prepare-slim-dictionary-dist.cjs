/**
 * Replace dist/assets/ecdict.db with the slim (no-FTS) source copy used in
 * smaller installers. Pair with scripts/build-dictionary-pack.cjs so the full
 * FTS pack is still uploaded as a Release asset.
 */
const fs = require("fs");
const path = require("path");

const sourceDb = path.join(process.cwd(), "src", "assets", "ecdict.db");
const distDb = path.join(process.cwd(), "dist", "assets", "ecdict.db");

if (!fs.existsSync(sourceDb)) {
  throw new Error(`missing source dictionary: ${sourceDb}`);
}

fs.mkdirSync(path.dirname(distDb), { recursive: true });
fs.copyFileSync(sourceDb, distDb);
const sizeMb = (fs.statSync(distDb).size / (1024 * 1024)).toFixed(1);
console.info(`[prepare-slim-dictionary-dist] restored slim ${distDb} (${sizeMb} MB)`);
