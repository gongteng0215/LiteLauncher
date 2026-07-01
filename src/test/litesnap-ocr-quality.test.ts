import assert from "node:assert/strict";
import test from "node:test";

import {
  looksLikeMisrecognizedEnglish,
  scoreLiteSnapOcrText
} from "../shared/litesnap-ocr-quality";
import { decodeHtmlEntities } from "../shared/litesnap-html";

test("looksLikeMisrecognizedEnglish detects CJK-heavy OCR garbage", () => {
  assert.equal(looksLikeMisrecognizedEnglish("伱好世畀测试"), true);
  assert.equal(looksLikeMisrecognizedEnglish("Hello world from LiteLauncher"), false);
});

test("scoreLiteSnapOcrText prefers readable Latin output", () => {
  const garbled = scoreLiteSnapOcrText("伱好世畀");
  const readable = scoreLiteSnapOcrText("Hello world");
  assert.ok(readable > garbled);
});

test("decodeHtmlEntities decodes MyMemory entities", () => {
  assert.equal(decodeHtmlEntities("&#20320;&#22909;"), "你好");
});
