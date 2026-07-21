/**
 * Ensure dist/assets/ecdict.db matches the committed seed dictionary before
 * packaging installers. Dev builds may patch FTS onto dist for local testing;
 * release packaging should ship the small seed DB only.
 */
const fs = require("fs");
const path = require("path");

const sourceDb = path.join(process.cwd(), "src", "assets", "ecdict.db");
const distDb = path.join(process.cwd(), "dist", "assets", "ecdict.db");
const MAX_SEED_DB_BYTES = 5 * 1024 * 1024;

if (!fs.existsSync(sourceDb)) {
  throw new Error(`missing source dictionary: ${sourceDb}`);
}

const sourceSize = fs.statSync(sourceDb).size;
if (sourceSize > MAX_SEED_DB_BYTES) {
  throw new Error(
    `source dictionary too large for seed packaging (${(sourceSize / (1024 * 1024)).toFixed(1)} MB); run node scripts/build-ecdict-seed.cjs`
  );
}

fs.mkdirSync(path.dirname(distDb), { recursive: true });
fs.copyFileSync(sourceDb, distDb);
const sizeMb = (fs.statSync(distDb).size / (1024 * 1024)).toFixed(2);
console.info(`[prepare-slim-dictionary-dist] restored seed ${distDb} (${sizeMb} MB)`);
