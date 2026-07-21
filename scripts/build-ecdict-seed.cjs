/**
 * Build src/assets/ecdict.db as a seed-only dictionary (~7k exam-tagged entries).
 *
 * Usage:
 *   node scripts/build-ecdict-seed.cjs
 *   node scripts/build-ecdict-seed.cjs --csv path/to/ecdict.csv
 */
const fs = require("fs");
const path = require("path");

const {
  loadRowsFromCsv,
  writeDatabase,
  resolveDefaultCsvPath
} = require("./ecdict-build-lib.cjs");

const OUT_DB = path.join("src", "assets", "ecdict.db");

function parseArgs(argv) {
  const csvIndex = argv.indexOf("--csv");
  return {
    csvPath:
      csvIndex >= 0 && argv[csvIndex + 1]
        ? path.resolve(argv[csvIndex + 1])
        : resolveDefaultCsvPath()
  };
}

function main() {
  const { csvPath } = parseArgs(process.argv.slice(2));
  if (!csvPath || !fs.existsSync(csvPath)) {
    console.error(`[build-ecdict-seed] CSV not found: ${csvPath || "(missing)"}`);
    process.exit(1);
  }

  const rows = loadRowsFromCsv(csvPath, { seedOnly: true });
  writeDatabase(OUT_DB, rows);
  const sizeKb = Math.round(fs.statSync(OUT_DB).size / 1024);
  console.log(
    `[build-ecdict-seed] wrote ${OUT_DB} (${rows.length} entries, ${sizeKb} KB) from ${csvPath}`
  );
}

main();
