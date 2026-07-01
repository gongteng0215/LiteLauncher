import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { collapseLiteSnapOcrBlankLines, normalizeLiteSnapOcrText } from "../shared/litesnap";

test("normalizeLiteSnapOcrText removes spaces between CJK characters", () => {
  assert.equal(
    normalizeLiteSnapOcrText("修 复 ： dev 模 式 不 再 传"),
    "修复：dev 模式不再传"
  );
  assert.equal(
    normalizeLiteSnapOcrText("中 文 识 别 测 试 12345"),
    "中文识别测试 12345"
  );
  assert.equal(
    normalizeLiteSnapOcrText("文\u3000字\u3000识\u3000别"),
    "文字识别"
  );
});

test("normalizeLiteSnapOcrText preserves line breaks and Latin spacing", () => {
  assert.equal(
    normalizeLiteSnapOcrText("第 一 行\n第 二 行"),
    "第一行\n第二行"
  );
  assert.equal(normalizeLiteSnapOcrText("hello world"), "hello world");
});

test("normalizeLiteSnapOcrText preserves a single blank line between paragraphs", () => {
  assert.equal(
    normalizeLiteSnapOcrText(" 第 一 行 \n\n 第 二 行 "),
    " 第一行 \n\n 第二行 "
  );
  assert.equal(
    normalizeLiteSnapOcrText("第一段\n\n\n第二段"),
    "第一段\n\n第二段"
  );
});

test("collapseLiteSnapOcrBlankLines keeps only one blank-line break", () => {
  assert.equal(
    collapseLiteSnapOcrBlankLines(
      "模型行\n\n正文一\n\n正文二\n\nAssistant 时间"
    ),
    "模型行\n\n正文一\n正文二\nAssistant 时间"
  );
});

test("renderer litesnap-text-utils stays aligned with shared normalize", () => {
  const sharedSource = fs.readFileSync(
    path.join(process.cwd(), "src", "shared", "litesnap.ts"),
    "utf8"
  );
  const rendererSource = fs.readFileSync(
    path.join(process.cwd(), "src", "renderer", "litesnap-text-utils.ts"),
    "utf8"
  );
  const marker =
    "[ \\\\t\\\\f\\\\v\\\\u00a0\\\\u1680\\\\u2000-\\\\u200b\\\\u202f\\\\u205f\\\\u3000\\\\ufeff]+";
  assert.match(sharedSource, new RegExp(marker));
  assert.match(rendererSource, new RegExp(marker));
});
