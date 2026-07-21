/**
 * Shared ECDICT CSV import helpers for build-ecdict-db / build-ecdict-seed /
 * build-dictionary-pack scripts.
 */
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const DEFAULT_CSV = path.join("scripts", "vendor", "ecdict.csv");

const SINGLE_WORD_RE = /^[a-z][a-z'-]*$/;
const PHRASE_RE = /^[a-z][a-z' -]*$/;
const SEED_TAG_RE = /(zk|gk|cet4|cet6)/;

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current);
  return cells;
}

function isCommonEnoughForDefinition(tag, collins, oxford, frq) {
  const tagText = String(tag || "").toLowerCase();
  if (/(zk|gk|cet4|cet6|ky|toefl|ielts|gre|oxford)/.test(tagText)) {
    return true;
  }
  if (Number(collins) > 0 || Number(oxford) > 0) {
    return true;
  }
  return Number(frq) > 0 && Number(frq) <= 30000;
}

function hasSeedExamTag(tag) {
  return SEED_TAG_RE.test(String(tag || "").toLowerCase());
}

function loadRowsFromCsv(csvPath, options = {}) {
  const { seedOnly = false } = options;
  const text = fs.readFileSync(csvPath, "utf8");
  const lines = text.split(/\r?\n/);
  const rows = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line || (i === 0 && line.toLowerCase().startsWith("word,"))) {
      continue;
    }
    const cells = parseCsvLine(line);
    if (cells.length < 10) {
      continue;
    }
    const [
      word,
      phonetic,
      definition,
      translation,
      pos,
      collins,
      oxford,
      tag,
      bnc,
      frq,
      exchange
    ] = cells;
    if (seedOnly && !hasSeedExamTag(tag)) {
      continue;
    }
    const normalized = String(word || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    const isSingle = SINGLE_WORD_RE.test(normalized);
    const isPhrase = !isSingle && normalized.includes(" ") && PHRASE_RE.test(normalized);
    if (!isSingle && !isPhrase) {
      continue;
    }
    const translationText = String(translation || "").trim();
    if (!translationText) {
      continue;
    }
    const definitionText = isCommonEnoughForDefinition(tag, collins, oxford, frq)
      ? String(definition || "").trim()
      : "";
    rows.push([
      normalized,
      String(phonetic || "").trim(),
      definitionText,
      translationText,
      String(pos || "").trim(),
      Number(collins) || 0,
      Number(oxford) || 0,
      String(tag || "").trim(),
      String(exchange || "").trim()
    ]);
  }
  return rows;
}

function writeDatabase(outPath, rows) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  if (fs.existsSync(outPath)) {
    fs.unlinkSync(outPath);
  }

  const db = new DatabaseSync(outPath);
  db.exec(`
    PRAGMA journal_mode = OFF;
    CREATE TABLE entries (
      word TEXT PRIMARY KEY,
      phonetic TEXT,
      definition TEXT,
      translation TEXT,
      pos TEXT,
      collins INTEGER,
      oxford INTEGER,
      tag TEXT,
      exchange TEXT
    );
    CREATE INDEX idx_entries_word ON entries(word);
  `);

  const insert = db.prepare(`
    INSERT OR REPLACE INTO entries
      (word, phonetic, definition, translation, pos, collins, oxford, tag, exchange)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec("BEGIN");
  for (const row of rows) {
    insert.run(...row);
  }
  db.exec("COMMIT");
  db.close();
}

function resolveDefaultCsvPath() {
  return fs.existsSync(DEFAULT_CSV) ? path.resolve(DEFAULT_CSV) : null;
}

module.exports = {
  DEFAULT_CSV,
  SEED_TAG_RE,
  loadRowsFromCsv,
  writeDatabase,
  resolveDefaultCsvPath,
  hasSeedExamTag
};
