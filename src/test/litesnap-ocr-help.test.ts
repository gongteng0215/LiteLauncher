import assert from "node:assert/strict";
import test from "node:test";

import {
  getLiteSnapOcrHelp,
  inferLiteSnapOcrIssue,
  isLiteSnapOcrIssue,
  formatLiteSnapOcrProbeSummary,
  formatLiteSnapOcrInstallButtonLabel,
  inferOcrCapabilitiesFromEngineProbe,
  resolveMissingOcrCapabilityLanguages,
  shouldShowLiteSnapOcrInstallButton,
  WINDOWS_10_OCR_SETUP_STEPS
} from "../shared/litesnap-ocr-help";

test("inferLiteSnapOcrIssue detects module and language pack failures", () => {
  assert.equal(
    inferLiteSnapOcrIssue("当前未加载 Windows OCR 模块。请完全退出 LiteLauncher 后重新启动"),
    "module_missing"
  );
  assert.equal(
    inferLiteSnapOcrIssue("未识别到文字。请检查是否已安装 Windows OCR 语言包"),
    "language_pack"
  );
  assert.equal(inferLiteSnapOcrIssue("已识别文字。"), null);
});

test("resolveMissingOcrCapabilityLanguages returns only uninstalled tags", () => {
  assert.deepEqual(
    resolveMissingOcrCapabilityLanguages([
      {
        languageTag: "zh-CN",
        capabilityName: "Language.OCR~~~zh-CN~0.0.1.0",
        state: "Installed",
        installed: true
      },
      {
        languageTag: "en-US",
        capabilityName: "Language.OCR~~~en-US~0.0.1.0",
        state: "NotPresent",
        installed: false
      }
    ]),
    ["en-US"]
  );
});

test("inferOcrCapabilitiesFromEngineProbe marks ready engines as installed", () => {
  const capabilities = inferOcrCapabilitiesFromEngineProbe({
    chineseReady: true,
    englishReady: false
  });
  assert.equal(capabilities[0]?.installed, true);
  assert.equal(capabilities[1]?.installed, false);
});

test("shouldShowLiteSnapOcrInstallButton hides when probe engines are ready", () => {
  assert.equal(
    shouldShowLiteSnapOcrInstallButton(
      [
        {
          languageTag: "zh-CN",
          capabilityName: "Language.OCR~~~zh-CN~0.0.1.0",
          state: "NotPresent",
          installed: false
        },
        {
          languageTag: "en-US",
          capabilityName: "Language.OCR~~~en-US~0.0.1.0",
          state: "NotPresent",
          installed: false
        }
      ],
      {
        ok: true,
        moduleLoaded: true,
        chineseReady: true,
        englishReady: true
      }
    ),
    false
  );
});

test("shouldShowLiteSnapOcrInstallButton hides when all capabilities are installed", () => {
  assert.equal(
    shouldShowLiteSnapOcrInstallButton([
      {
        languageTag: "zh-CN",
        capabilityName: "Language.OCR~~~zh-CN~0.0.1.0",
        state: "Installed",
        installed: true
      },
      {
        languageTag: "en-US",
        capabilityName: "Language.OCR~~~en-US~0.0.1.0",
        state: "Installed",
        installed: true
      }
    ]),
    false
  );
});

test("formatLiteSnapOcrInstallButtonLabel adapts to missing languages", () => {
  assert.equal(formatLiteSnapOcrInstallButtonLabel(["zh-CN", "en-US"]), "一键安装 OCR（中+英）");
  assert.equal(formatLiteSnapOcrInstallButtonLabel(["zh-CN"]), "安装 OCR（中文）");
  assert.equal(formatLiteSnapOcrInstallButtonLabel(["en-US"]), "安装 OCR（英文）");
});

test("getLiteSnapOcrHelp exposes install and relaunch guidance", () => {
  const help = getLiteSnapOcrHelp("language_pack");
  assert.equal(help.showRelaunchButton, true);
  assert.deepEqual(help.steps, [...WINDOWS_10_OCR_SETUP_STEPS]);
});

test("isLiteSnapOcrIssue validates known issue codes", () => {
  assert.equal(isLiteSnapOcrIssue("module_missing"), true);
  assert.equal(isLiteSnapOcrIssue("language_pack"), true);
  assert.equal(isLiteSnapOcrIssue("other"), false);
});

test("formatLiteSnapOcrProbeSummary includes module and engine status", () => {
  const summary = formatLiteSnapOcrProbeSummary({
    ok: false,
    message: "OCR 模块未加载。",
    ocrIssue: "module_missing",
    moduleLoaded: false,
    nativeAddonExists: true,
    availableLanguages: [],
    chineseReady: false,
    englishReady: false
  });
  assert.match(summary, /OCR 模块：未加载/);
  assert.match(summary, /native 文件：存在/);
});
