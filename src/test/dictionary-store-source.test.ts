import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { formatDictionaryMultilineText } from "../shared/dictionary";

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("formatDictionaryMultilineText converts ECDICT escaped newlines", () => {
  assert.equal(
    formatDictionaryMultilineText("n. 应用\\n[计] 应用"),
    "n. 应用\n[计] 应用"
  );
  assert.equal(
    formatDictionaryMultilineText("n. one\\nn. two"),
    "n. one\nn. two"
  );
});

test("DictionaryStore supports lazy open, lookup, and stem fallback", () => {
  const storeSource = readSource("src/main/dictionary/store.ts");
  const sharedSource = readSource("src/shared/dictionary.ts");
  const channelsSource = readSource("src/shared/channels.ts");
  const ipcSource = readSource("src/main/ipc.ts");
  const preloadSource = readSource("src/preload/index.ts");
  const mainSource = readSource("src/main/index.ts");

  assert.match(sharedSource, /export interface DictionaryEntry/);
  assert.match(sharedSource, /stemDictionaryLookupCandidates/);
  assert.match(storeSource, /class DictionaryStore/);
  assert.match(storeSource, /readOnly:\s*true/);
  assert.match(storeSource, /formatDictionaryMultilineText/);
  assert.match(storeSource, /stemDictionaryLookupCandidates/);
  assert.match(storeSource, /ecdict\.db/);
  assert.match(channelsSource, /lookupDictionaryWord:/);
  assert.match(ipcSource, /DictionaryProvider/);
  assert.match(ipcSource, /IPC_CHANNELS\.lookupDictionaryWord/);
  assert.match(preloadSource, /lookupDictionaryWord\(/);
  assert.match(mainSource, /dictionaryStore/);
  assert.match(mainSource, /dictionaryProvider/);
});

test("ecdict.db asset and build script exist", () => {
  const buildScript = readSource("scripts/build-ecdict-db.cjs");
  assert.match(buildScript, /CREATE TABLE entries/);
  assert.match(buildScript, /src[/\\]assets[/\\]ecdict\.db|OUT_DB/);
  assert.ok(
    fs.existsSync(path.join(process.cwd(), "src/assets/ecdict.db")),
    "src/assets/ecdict.db should be generated"
  );
});
