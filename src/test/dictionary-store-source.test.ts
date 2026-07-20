import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  formatDictionaryMultilineText,
  isAtomicEnglishWord,
  isEnglishWordOrPhrase,
  normalizeDictionaryLookupWord,
  splitHyphenCompoundParts,
  stemDictionaryLookupCandidates
} from "../shared/dictionary";

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

test("isEnglishWordOrPhrase accepts words and phrases, rejects other text", () => {
  assert.equal(isEnglishWordOrPhrase("cup"), true);
  assert.equal(isEnglishWordOrPhrase("give up"), true);
  assert.equal(isEnglishWordOrPhrase("look forward to"), true);
  assert.equal(isEnglishWordOrPhrase("你好"), false);
  assert.equal(isEnglishWordOrPhrase("hello!"), false);
  assert.equal(isEnglishWordOrPhrase("a ".repeat(40)), false);
});

test("isAtomicEnglishWord excludes hyphen compounds", () => {
  assert.equal(isAtomicEnglishWord("cup"), true);
  assert.equal(isAtomicEnglishWord("don't"), true);
  assert.equal(isAtomicEnglishWord("context-path"), false);
  assert.equal(isAtomicEnglishWord("give up"), false);
});

test("normalizeDictionaryLookupWord collapses whitespace and lowercases", () => {
  assert.equal(normalizeDictionaryLookupWord("  Give   Up "), "give up");
  assert.equal(normalizeDictionaryLookupWord("New York"), "new york");
});

test("stemDictionaryLookupCandidates expands hyphen variants", () => {
  assert.deepEqual(stemDictionaryLookupCandidates("give up"), ["give up"]);
  assert.ok(stemDictionaryLookupCandidates("stories").includes("story"));
  const hyphen = stemDictionaryLookupCandidates("user-agent");
  assert.deepEqual(hyphen, ["user-agent", "user agent", "useragent"]);
  assert.deepEqual(splitHyphenCompoundParts("context-path"), ["context", "path"]);
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
  assert.match(sharedSource, /isChineseWordOrPhrase/);
  assert.match(sharedSource, /pickBestChineseDictionaryMatch/);
  assert.match(storeSource, /lookupCandidates/);
  assert.match(storeSource, /lookupChineseCandidates/);
  assert.match(storeSource, /entries_translation_fts/);
  assert.match(channelsSource, /lookupDictionaryCandidates:/);
  assert.match(storeSource, /class DictionaryStore/);
  assert.match(storeSource, /readOnly:\s*true/);
  assert.match(storeSource, /formatDictionaryMultilineText/);
  assert.match(storeSource, /lookupHyphenCompound/);
  assert.match(storeSource, /app\.asar\.unpacked/);
  assert.match(storeSource, /isInsideAsarArchive/);
  assert.match(storeSource, /opened ecdict\.db from/);
  assert.match(channelsSource, /lookupDictionaryWord:/);
  assert.match(channelsSource, /getDictionaryPanelState:/);
  assert.match(channelsSource, /recordDictionaryLookup:/);
  assert.match(channelsSource, /toggleDictionaryFavorite:/);
  assert.match(channelsSource, /updateDictionaryFavoriteNote:/);
  assert.match(ipcSource, /DictionaryProvider/);
  assert.match(ipcSource, /IPC_CHANNELS\.lookupDictionaryWord/);
  assert.match(ipcSource, /IPC_CHANNELS\.getDictionaryPanelState/);
  assert.match(ipcSource, /IPC_CHANNELS\.updateDictionaryFavoriteNote/);
  assert.match(preloadSource, /lookupDictionaryWord\(/);
  assert.match(preloadSource, /getDictionaryPanelState\(/);
  assert.match(preloadSource, /updateDictionaryFavoriteNote\(/);
  assert.match(mainSource, /dictionaryStore/);
  assert.match(mainSource, /dictionaryPanelStateStore/);
  assert.match(mainSource, /dictionaryProvider/);
  assert.match(mainSource, /isDictionaryLookupText/);
});

test("ecdict.db asset and build script exist", () => {
  const buildScript = readSource("scripts/build-ecdict-db.cjs");
  assert.match(buildScript, /CREATE TABLE entries/);
  assert.match(buildScript, /src[/\\]assets[/\\]ecdict\.db|OUT_DB/);
  assert.doesNotMatch(
    buildScript,
    /entries_translation_fts/,
    "committed ecdict.db build should stay under GitHub 100MB without FTS"
  );
  const patchScript = readSource("scripts/patch-ecdict-fts.cjs");
  assert.match(patchScript, /entries_translation_fts/);
  assert.match(patchScript, /dist[/\\]assets[/\\]ecdict\.db|DEFAULT_DB/);
  const copyAssets = readSource("scripts/copy-assets.cjs");
  assert.match(copyAssets, /patchDistEcdictFts|patch-ecdict-fts/);
  assert.match(copyAssets, /LITELAUNCHER_SHIP_SLIM_DICTIONARY/);
  const packBuild = readSource("scripts/build-dictionary-pack.cjs");
  assert.match(packBuild, /ecdict-fts\.db/);
  assert.match(packBuild, /patchEcdictFts/);
  const slimPrepare = readSource("scripts/prepare-slim-dictionary-dist.cjs");
  assert.match(slimPrepare, /"src",\s*"assets",\s*"ecdict\.db"/);
  assert.ok(
    fs.existsSync(path.join(process.cwd(), "src/assets/ecdict.db")),
    "src/assets/ecdict.db should be generated"
  );
});

test("dictionary pack manager prefers userData FTS pack", () => {
  const packSource = readSource("src/main/dictionary/pack.ts");
  const storeSource = readSource("src/main/dictionary/store.ts");
  assert.match(packSource, /resolveUserDictionaryPackPath/);
  assert.match(packSource, /clearDictionaryFtsProbeCache/);
  assert.match(packSource, /ecdict-fts\.db/);
  assert.match(storeSource, /resolveUserDictionaryPackPath/);
  assert.match(storeSource, /reopen\(\)/);
});
