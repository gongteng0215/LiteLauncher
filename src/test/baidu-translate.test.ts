import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import {
  BAIDU_LLM_TRANSLATE_ENDPOINT,
  BAIDU_MAX_QUERY_BYTES,
  BAIDU_TRANSLATE_ENDPOINT,
  buildBaiduTranslateSignSource,
  chunkTextForBaidu,
  extractBaiduTranslatedText,
  formatBaiduTranslateError,
  readBaiduTranslateError,
  splitTextByUtf8ByteLimit
} from "../shared/baidu-translate";

test("buildBaiduTranslateSignSource concatenates appid, query, salt and secret", () => {
  assert.equal(
    buildBaiduTranslateSignSource("app", "hello", "123", "secret"),
    "apphello123secret"
  );
});

test("Baidu sign is md5 of appid+q+salt+secret", () => {
  const sign = crypto
    .createHash("md5")
    .update(
      buildBaiduTranslateSignSource("demoApp", "hello", "12345", "demoSecret"),
      "utf8"
    )
    .digest("hex");
  assert.equal(sign.length, 32);
  assert.equal(
    sign,
    crypto.createHash("md5").update("demoApphello12345demoSecret", "utf8").digest("hex")
  );
});

test("chunkTextForBaidu keeps short text in one chunk", () => {
  assert.deepEqual(chunkTextForBaidu("Hello world"), ["Hello world"]);
});

test("chunkTextForBaidu splits long multiline text", () => {
  const line = "A".repeat(200);
  const text = `${line}\n${line}\n${line}`;
  const chunks = chunkTextForBaidu(text, 220);
  assert.ok(chunks.length >= 2);
  for (const chunk of chunks) {
    assert.ok(new TextEncoder().encode(chunk).length <= 220);
  }
});

test("chunkTextForBaidu stays below Baidu documented limit", () => {
  const text = "word ".repeat(2000).trim();
  for (const chunk of chunkTextForBaidu(text)) {
    assert.ok(new TextEncoder().encode(chunk).length < BAIDU_MAX_QUERY_BYTES);
  }
});

test("splitTextByUtf8ByteLimit respects UTF-8 byte boundaries", () => {
  const parts = splitTextByUtf8ByteLimit("你好世界Hello", 8);
  assert.ok(parts.length >= 2);
  for (const part of parts) {
    assert.ok(new TextEncoder().encode(part).length <= 8);
  }
});

test("formatBaiduTranslateError maps known error codes", () => {
  assert.match(formatBaiduTranslateError("54001"), /签名错误/);
  assert.match(formatBaiduTranslateError("52003"), /AppID 或密钥无效/);
});

test("Baidu translate endpoints cover standard and LLM APIs", () => {
  assert.equal(
    BAIDU_TRANSLATE_ENDPOINT,
    "https://fanyi-api.baidu.com/api/trans/vip/translate"
  );
  assert.equal(
    BAIDU_LLM_TRANSLATE_ENDPOINT,
    "https://fanyi-api.baidu.com/ait/api/aiTextTranslate"
  );
});

test("extractBaiduTranslatedText joins trans_result entries", () => {
  assert.equal(
    extractBaiduTranslatedText({
      trans_result: [{ src: "hello", dst: "你好" }]
    }),
    "你好"
  );
});

test("readBaiduTranslateError returns null for success payloads", () => {
  assert.equal(readBaiduTranslateError({ error_code: "0" }), null);
  assert.match(readBaiduTranslateError({ error_code: "54001" }) ?? "", /签名错误/);
});
