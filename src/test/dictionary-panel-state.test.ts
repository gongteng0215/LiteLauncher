import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultDictionaryPanelState,
  isDictionaryWordFavorited
} from "../shared/dictionary";
import { DictionaryPanelStateStore } from "../main/dictionary/panel-state";

class MemorySettingsDb {
  private readonly settings = new Map<string, string>();

  public async getSetting(key: string): Promise<string | null> {
    return this.settings.get(key) ?? null;
  }

  public async setSetting(key: string, value: string): Promise<void> {
    this.settings.set(key, value);
  }
}

test("DictionaryPanelStateStore records history and toggles favorites", async () => {
  const db = new MemorySettingsDb();
  const store = new DictionaryPanelStateStore(db as never);
  const entry = {
    word: "apple",
    phonetic: "ˈæpl",
    translation: "n. 苹果",
    definition: "a fruit",
    pos: "n",
    tags: "zk gk",
    collins: 1,
    oxford: 1,
    exchange: ""
  };

  const initial = await store.getState();
  assert.deepEqual(initial, createDefaultDictionaryPanelState());

  const afterLookup = await store.recordLookup({ query: "apple", entry });
  assert.equal(afterLookup.history.length, 1);
  assert.equal(afterLookup.history[0]?.word, "apple");
  assert.match(afterLookup.history[0]?.translationPreview ?? "", /苹果/);

  const afterSecondLookup = await store.recordLookup({
    query: "context-path",
    entry: {
      ...entry,
      word: "context-path",
      translation: "n. 上下文路径"
    }
  });
  assert.equal(afterSecondLookup.history.length, 2);
  assert.equal(afterSecondLookup.history[0]?.word, "context-path");

  const afterRepeat = await store.recordLookup({ query: "apple", entry });
  assert.equal(afterRepeat.history.length, 2);
  assert.equal(afterRepeat.history[0]?.word, "apple");

  const favorited = await store.toggleFavorite({ word: "apple", entry });
  assert.equal(favorited.favorites.length, 1);
  assert.equal(
    isDictionaryWordFavorited(favorited, "Apple"),
    true
  );

  const unfavorited = await store.toggleFavorite({ word: "apple" });
  assert.equal(unfavorited.favorites.length, 0);

  const cleared = await store.clearHistory();
  assert.equal(cleared.history.length, 0);

  await store.recordLookup({ query: "apple", entry });
  const refavorited = await store.toggleFavorite({ word: "apple", entry });
  assert.equal(refavorited.favorites.length, 1);

  const removed = await store.removeFavorite("apple");
  assert.equal(removed.favorites.length, 0);
  assert.equal(removed.history[0]?.word, "apple");

  const notedFavorite = await store.toggleFavorite({ word: "apple", entry });
  assert.equal(notedFavorite.favorites.length, 1);
  const withNote = await store.updateFavoriteNote("apple", "工作常用");
  assert.equal(withNote.favorites[0]?.note, "工作常用");
  const clearedNote = await store.updateFavoriteNote("apple", "  ");
  assert.equal(clearedNote.favorites[0]?.note, "");
});
