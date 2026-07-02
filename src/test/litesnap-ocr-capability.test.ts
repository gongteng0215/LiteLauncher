import assert from "node:assert/strict";
import test from "node:test";

import {
  LITESNAP_OCR_CAPABILITY_DEFAULTS,
  formatLiteSnapOcrProbeSummary
} from "../shared/litesnap-ocr-help";

test("OCR capability defaults match Windows Language.OCR package names", () => {
  assert.equal(
    LITESNAP_OCR_CAPABILITY_DEFAULTS["zh-CN"],
    "Language.OCR~~~zh-CN~0.0.1.0"
  );
  assert.equal(
    LITESNAP_OCR_CAPABILITY_DEFAULTS["en-US"],
    "Language.OCR~~~en-US~0.0.1.0"
  );
});

test("formatLiteSnapOcrProbeSummary includes capability install state", () => {
  const summary = formatLiteSnapOcrProbeSummary({
    ok: false,
    message: "未检测到 OCR。",
    moduleLoaded: true,
    nativeAddonExists: true,
    availableLanguages: [],
    chineseReady: false,
    englishReady: false,
    capabilities: [
      {
        languageTag: "zh-CN",
        capabilityName: LITESNAP_OCR_CAPABILITY_DEFAULTS["zh-CN"],
        state: "NotPresent",
        installed: false
      },
      {
        languageTag: "en-US",
        capabilityName: LITESNAP_OCR_CAPABILITY_DEFAULTS["en-US"],
        state: "Installed",
        installed: true
      }
    ]
  });
  assert.match(summary, /系统 OCR 组件：zh-CN=未安装；en-US=已安装/);
});
