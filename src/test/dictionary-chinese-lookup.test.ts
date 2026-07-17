import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";

import {
  isChineseWordOrPhrase,
  isDictionaryLookupText,
  pickBestChineseDictionaryMatch,
  rankChineseDictionaryMatches,
  scoreChineseDictionaryMatch
} from "../shared/dictionary";
import { DictionaryStore } from "../main/dictionary/store";

function createTempDictionaryDb(): string {
  const dbPath = path.join(
    os.tmpdir(),
    `litelauncher-dict-${Date.now()}-${Math.random().toString(16).slice(2)}.db`
  );
  const db = new DatabaseSync(dbPath);
  db.exec(`
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
  `);
  db.prepare(
    `INSERT INTO entries (word, phonetic, definition, translation, pos, collins, oxford, tag, exchange)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    "apple",
    "ˈæpl",
    "a round fruit",
    "n. 苹果",
    "n",
    4,
    1,
    "zk gk",
    ""
  );
  db.prepare(
    `INSERT INTO entries (word, phonetic, definition, translation, pos, collins, oxford, tag, exchange)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    "context",
    "ˈkɒntekst",
    "circumstances",
    "n. 上下文；语境",
    "n",
    3,
    0,
    "cet4",
    ""
  );
  db.close();
  return dbPath;
}

test("isChineseWordOrPhrase accepts common Chinese lookup text", () => {
  assert.equal(isChineseWordOrPhrase("苹果"), true);
  assert.equal(isChineseWordOrPhrase("上下文"), true);
  assert.equal(isChineseWordOrPhrase("apple"), false);
  assert.equal(isDictionaryLookupText("苹果"), true);
  assert.equal(isDictionaryLookupText("apple"), true);
});

test("scoreChineseDictionaryMatch prefers the main gloss", () => {
  const apple = {
    word: "apple",
    phonetic: "",
    translation: "n. 苹果",
    definition: "",
    pos: "n",
    tags: "",
    collins: 4,
    oxford: 1,
    exchange: ""
  };
  const pineapple = {
    word: "pineapple",
    phonetic: "",
    translation: "n. 菠萝；凤梨",
    definition: "",
    pos: "n",
    tags: "",
    collins: 2,
    oxford: 0,
    exchange: ""
  };
  assert.ok(scoreChineseDictionaryMatch("苹果", apple) > scoreChineseDictionaryMatch("苹果", pineapple));
  assert.equal(pickBestChineseDictionaryMatch("苹果", [pineapple, apple])?.word, "apple");
});

test("DictionaryStore supports Chinese reverse lookup from translation", () => {
  const dbPath = createTempDictionaryDb();
  try {
    const store = new DictionaryStore(dbPath);
    const apple = store.lookup("苹果");
    assert.equal(apple?.word, "apple");
    const context = store.lookup("上下文");
    assert.equal(context?.word, "context");
    const candidates = store.lookupCandidates("苹果", 8);
    assert.ok(candidates.length >= 1);
    assert.equal(candidates[0]?.word, "apple");
    store.close();
  } finally {
    fs.unlinkSync(dbPath);
  }
});

test("rankChineseDictionaryMatches returns multiple senses", () => {
  const entries = [
    {
      word: "apple",
      phonetic: "",
      translation: "n. 苹果",
      definition: "",
      pos: "n",
      tags: "",
      collins: 4,
      oxford: 1,
      exchange: ""
    },
    {
      word: "malus",
      phonetic: "",
      translation: "n. 苹果属；苹果",
      definition: "",
      pos: "n",
      tags: "",
      collins: 1,
      oxford: 0,
      exchange: ""
    }
  ];
  const ranked = rankChineseDictionaryMatches("苹果", entries, 8);
  assert.equal(ranked.length, 2);
  assert.equal(ranked[0]?.word, "apple");
});
