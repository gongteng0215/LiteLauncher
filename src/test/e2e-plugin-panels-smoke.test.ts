import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  captureE2EFailureArtifacts,
  launchE2ESession,
  openPluginFromSearch,
  returnToSearch,
  waitForActivePlugin,
  waitForMode
} from "./e2e-test-utils";

test(
  "electron smoke: open core webtools plugins and verify core UI flows",
  { timeout: 240000 },
  async () => {
    const testName = "electron smoke: open core webtools plugins and verify core UI flows";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    try {
      session = await launchE2ESession();
      const { page } = session;

      await page.setViewportSize({ width: 900, height: 720 });

      const assertFormFitsViewport = async (selector: string): Promise<void> => {
        const form = page.locator(selector);
        await assert.doesNotReject(() =>
          form.waitFor({ state: "visible", timeout: 10000 })
        );
        const fits = await form.evaluate(
          (node) => node.getBoundingClientRect().right <= window.innerWidth + 1
        );
        assert.equal(fits, true, `${selector} overflows viewport`);
      };

      const assertPanelFitsNarrowViewport = async (selector: string): Promise<void> => {
        await page.setViewportSize({ width: 620, height: 720 });
        await assertFormFitsViewport(selector);
        const hasHorizontalOverflow = await page.evaluate(() => {
          const shell = document.querySelector<HTMLElement>(".shell");
          return Boolean(shell && shell.scrollWidth > shell.clientWidth + 1);
        });
        assert.equal(hasHorizontalOverflow, false, `${selector} creates horizontal overflow`);
      };

      await openPluginFromSearch(
        page,
        "plugin:password",
        "密码工具",
        "webtools-password"
      );
      const passwordForm = page.locator("form.webtools-password-form");
      await assertFormFitsViewport("form.webtools-password-form");
      await passwordForm.locator(".webtools-password-generate-btn").click();
      await page.waitForFunction(() => {
        const rows = document.querySelectorAll(".webtools-password-table tbody tr");
        const status = document.querySelector("#status-text") as HTMLDivElement | null;
        return rows.length > 0 || Boolean(status && status.textContent?.includes("已生成"));
      });
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:colors",
        "颜色工具",
        "webtools-colors"
      );
      const colorsForm = page.locator("form.webtools-colors-form");
      await assertFormFitsViewport("form.webtools-colors-form");
      await colorsForm.locator('input[name="webtoolsColorsInput"]').fill("#00ff88");
      await page.waitForFunction(() => {
        const node = document.querySelector(
          '[data-webtools-colors-output="hex"]'
        ) as HTMLDivElement | null;
        return Boolean(node && node.textContent && node.textContent !== "-");
      });
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:sql",
        "SQL 格式化",
        "webtools-sql-format"
      );
      const sqlForm = page.locator("form.webtools-sql-form");
      await assertFormFitsViewport("form.webtools-sql-form");
      await sqlForm
        .locator('textarea[name="webtoolsSqlInput"]')
        .fill("select id,name from users where status='active' order by id desc");
      await page.waitForFunction(() => {
        const node = document.querySelector(
          'textarea[name="webtoolsSqlOutput"]'
        ) as HTMLTextAreaElement | null;
        return Boolean(node && /SELECT/i.test(node.value));
      });
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:cron",
        "Cron 生成器",
        "webtools-cron"
      );
      const cronForm = page.locator("form.webtools-cron-form");
      await assertFormFitsViewport("form.webtools-cron-form");
      await cronForm
        .locator('input[name="webtoolsCronExpression"]')
        .fill("*/15 9-18 * * 1-5");
      await cronForm.locator('input[name="webtoolsCronExpression"]').press("Enter");
      await page.waitForFunction(() => {
        const node = document.querySelector(".webtools-cron-readable") as HTMLDivElement | null;
        return Boolean(node && node.textContent && node.textContent !== "-");
      });
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:json",
        "JSON 工具",
        "webtools-json"
      );
      const jsonForm = page.locator("form.webtools-json-form");
      await assertFormFitsViewport("form.webtools-json-form");
      await jsonForm.locator('select[name="webtoolsJsonSource"]').selectOption("json");
      await jsonForm.locator('select[name="webtoolsJsonTarget"]').selectOption("json");
      await jsonForm
        .locator('textarea[name="webtoolsJsonInput"]')
        .fill('{"name":"LiteLauncher","ok":true}');
      await jsonForm.evaluate((form) => {
        (form as HTMLFormElement).requestSubmit();
      });
      await page.waitForFunction(() => {
        const node = document.querySelector(
          'textarea[name="webtoolsJsonOutput"]'
        ) as HTMLTextAreaElement | null;
        return Boolean(node && node.value.trim().length > 0);
      });
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:crypto",
        "加密工具",
        "webtools-crypto"
      );
      const cryptoForm = page.locator("form.webtools-crypto-form");
      await assertFormFitsViewport("form.webtools-crypto-form");
      const expectedCryptoHash = crypto
        .createHash("md5")
        .update("LiteLauncher")
        .digest("hex");
      await cryptoForm
        .locator('textarea[name="webtoolsCryptoInput"]')
        .fill("LiteLauncher");
      await page.waitForFunction(
        (expectedHash) => {
          const node = document.querySelector(
            'textarea[name="webtoolsCryptoOutput"]'
          ) as HTMLTextAreaElement | null;
          return node?.value.trim() === expectedHash;
        },
        expectedCryptoHash,
        { timeout: 15000 }
      );
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:jwt",
        "JWT 调试器",
        "webtools-jwt"
      );
      const jwtForm = page.locator("form.webtools-jwt-form");
      await assertFormFitsViewport("form.webtools-jwt-form");
      await page.waitForFunction(() => {
        const payload = document.querySelector(
          'textarea[name="webtoolsJwtPayload"]'
        ) as HTMLTextAreaElement | null;
        const status = document.querySelector(".webtools-jwt-status") as HTMLDivElement | null;
        return Boolean(
          payload?.value.includes("John Doe") &&
            status?.dataset.state &&
            status.dataset.state !== "idle"
        );
      });
      await jwtForm.locator('textarea[name="webtoolsJwtHeader"]').waitFor({
        state: "visible",
        timeout: 10000
      });
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:url",
        "URL 解析",
        "webtools-url-parse"
      );
      const urlForm = page.locator("form.webtools-url-form");
      await assertFormFitsViewport("form.webtools-url-form");
      await urlForm
        .locator('textarea[name="webtoolsUrlInput"]')
        .fill("https://example.com:8080/path?name=test&id=1#hash");
      await page.waitForFunction(() => {
        const node = document.querySelector(
          '[data-webtools-url-part="host"]'
        ) as HTMLInputElement | null;
        return Boolean(node && node.value.includes("example.com"));
      });
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:timestamp",
        "时间戳工具",
        "webtools-timestamp"
      );
      const timestampForm = page.locator("form.webtools-timestamp-form");
      await assertFormFitsViewport("form.webtools-timestamp-form");
      await timestampForm
        .locator('input[name="webtoolsTimestampUnixInput"]')
        .fill("1700000000");
      await timestampForm.locator("button", { hasText: "转换为日期" }).click();
      await page.waitForFunction(() => {
        const node = document.querySelector(
          'input[name="webtoolsTimestampDateOutput"]'
        ) as HTMLInputElement | null;
        return Boolean(node && node.value.trim().length > 0);
      });
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:unit",
        "单位换算",
        "webtools-unit-convert"
      );
      const unitForm = page.locator("form.webtools-unit-form");
      await assertFormFitsViewport("form.webtools-unit-form");
      await unitForm.locator('input[data-unit-storage="MB"]').fill("2");
      await page.waitForFunction(() => {
        const node = document.querySelector(
          'input[data-unit-storage="KB"]'
        ) as HTMLInputElement | null;
        return Boolean(node && Number(node.value) > 2000);
      });
      await returnToSearch(page);

      const hashFixtureDir = await fs.mkdtemp(
        path.join(os.tmpdir(), "litelauncher-file-hash-e2e-")
      );
      const hashFixturePath = path.join(hashFixtureDir, "sample.txt");
      const hashFixtureText = "LiteLauncher file hash e2e\n";
      await fs.writeFile(hashFixturePath, hashFixtureText, "utf8");
      const expectedHash = crypto
        .createHash("sha256")
        .update(hashFixtureText)
        .digest("hex");

      try {
        await openPluginFromSearch(
          page,
          "plugin:hash",
          "文件哈希",
          "webtools-file-hash"
        );
        const hashForm = page.locator("form.webtools-file-hash-form");
        await assertPanelFitsNarrowViewport("form.webtools-file-hash-form");
        await hashForm.locator('input[name="webtoolsFileHashPath"]').fill(hashFixturePath);
        await hashForm.locator('input[name="webtoolsFileHashExpected"]').fill(expectedHash);
        await hashForm.locator("button", { hasText: "计算哈希" }).click();
        await page.waitForFunction(
          (hash) => {
            const output = document.querySelector(
              'textarea[name="webtoolsFileHashOutput"]'
            ) as HTMLTextAreaElement | null;
            const verify = document.querySelector(
              ".webtools-file-hash-verify"
            ) as HTMLDivElement | null;
            return (
              output?.value.trim() === hash &&
              verify?.textContent?.includes("匹配") === true
            );
          },
          expectedHash,
          { timeout: 15000 }
        );
        await returnToSearch(page);
      } finally {
        await fs.rm(hashFixtureDir, { recursive: true, force: true });
      }

      await openPluginFromSearch(
        page,
        "plugin:port",
        "端口助手",
        "webtools-port-helper"
      );
      const portForm = page.locator("form.webtools-port-helper-form");
      await assertPanelFitsNarrowViewport("form.webtools-port-helper-form");
      await portForm.locator('input[name="webtoolsPortHelperPort"]').fill("9");
      await portForm.locator('[data-webtools-port-query="1"]').click();
      await portForm
        .locator(".webtools-port-helper-info")
        .waitFor({ state: "visible", timeout: 15000 });
      await page.waitForFunction(() => {
        const info = document.querySelector(
          ".webtools-port-helper-info"
        ) as HTMLDivElement | null;
        const results = document.querySelector(".webtools-port-helper-results");
        return Boolean(info?.textContent?.trim() && results);
      });
      await returnToSearch(page);

      const mockPort = 17831;
      const mockPath = "/e2e-http-mock";
      const mockBody = '{"ok":true,"source":"e2e"}';

      const executeHttpMockAction = async (
        action: "open" | "start" | "stop" | "status"
      ): Promise<void> => {
        await page.evaluate(async ({ action, port, path, body }) => {
          const params = new URLSearchParams();
          params.set("action", action);
          params.set("port", String(port));
          params.set("path", path);
          params.set("method", "GET");
          params.set("statusCode", "200");
          params.set("contentType", "application/json; charset=utf-8");
          params.set("body", body);

          await window.launcher.execute({
            id: `plugin:webtools-http-mock:${action}`,
            type: "command",
            title: "HTTP Mock Server",
            subtitle: "e2e",
            target: `command:plugin:webtools-http-mock?${params.toString()}`,
            keywords: ["plugin", "http", "mock"]
          });
        }, { action, port: mockPort, path: mockPath, body: mockBody });
      };

      await executeHttpMockAction("open");
      await waitForMode(page, "plugin");
      await waitForActivePlugin(page, "webtools-http-mock");
      const mockForm = page.locator("form.webtools-http-mock-form");
      await assertFormFitsViewport("form.webtools-http-mock-form");
      await mockForm.locator('input[name="webtoolsHttpMockPort"]').fill(String(mockPort));
      await mockForm.locator('input[name="webtoolsHttpMockPath"]').fill(mockPath);
      await mockForm.locator('textarea[name="webtoolsHttpMockBody"]').fill(mockBody);
      await mockForm.locator('[data-webtools-http-mock-start="1"]').click();

      await page.waitForFunction(() => {
        const node = document.querySelector(".webtools-http-mock-runtime") as HTMLDivElement | null;
        return Boolean(node && node.textContent && node.textContent.includes("运行中"));
      });

      await assert.doesNotReject(async () => {
        const response = await page.request.get(`http://127.0.0.1:${mockPort}${mockPath}`);
        assert.equal(response.ok(), true);
        const text = await response.text();
        assert.equal(text.includes('"ok":true'), true);
      });

      await mockForm.locator('[data-webtools-http-mock-status="1"]').click();
      await page.waitForFunction(() => {
        const node = document.querySelector(".webtools-http-mock-count") as HTMLDivElement | null;
        if (!node || !node.textContent) {
          return false;
        }
        const match = node.textContent.match(/(\d+)/);
        return Boolean(match && Number(match[1]) >= 1);
      });

      await mockForm.locator('[data-webtools-http-mock-stop="1"]').click();
      await executeHttpMockAction("stop");
      await executeHttpMockAction("status");
      await assert.doesNotReject(() =>
        page
          .locator(".webtools-http-mock-runtime", { hasText: "当前未启动" })
          .waitFor({ state: "visible", timeout: 10000 })
      );
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:api",
        "API 调试",
        "webtools-api-client"
      );
      const apiForm = page.locator("form.webtools-api-form");
      await apiForm.waitFor({ state: "visible", timeout: 10000 });
      await page
        .locator(".webtools-tool-title", { hasText: "API 调试" })
        .waitFor({ state: "visible", timeout: 10000 });
      const apiUrlInput = apiForm.locator("input.webtools-api-url");
      await apiUrlInput.fill("https://example.com/api?from=e2e");
      await page.waitForFunction(() => {
        const node = document.querySelector(".webtools-api-preview") as HTMLDivElement | null;
        return Boolean(node && node.textContent?.includes("from=e2e"));
      });
      await apiForm.locator('[data-api-request-tab="headers"]').click();
      await apiForm
        .locator('[data-api-request-panel="headers"]')
        .waitFor({ state: "visible", timeout: 10000 });
      await apiForm.locator('[data-api-request-tab="body"]').click();
      await apiForm
        .locator('[data-api-request-panel="body"]')
        .waitFor({ state: "visible", timeout: 10000 });
      await apiForm
        .locator(".webtools-api-body-types", { hasText: "FormData" })
        .waitFor({ state: "visible", timeout: 10000 });
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:qr",
        "二维码生成",
        "webtools-qrcode"
      );
      const qrForm = page.locator("form.webtools-qrcode-form");
      await qrForm.waitFor({ state: "visible", timeout: 10000 });
      await page
        .locator(".webtools-qrcode-title", { hasText: "二维码生成" })
        .waitFor({ state: "visible", timeout: 10000 });
      await qrForm.locator('textarea[name="webtoolsQrText"]').fill("LiteLauncher QR E2E");
      const logoModeSelect = qrForm.locator('select[name="webtoolsQrLogoMode"]');
      await logoModeSelect.selectOption("text");
      await qrForm
        .locator('[data-webtools-qrcode-logo-text-field]')
        .waitFor({ state: "visible", timeout: 10000 });
      await qrForm.locator('input[name="webtoolsQrLogoText"]').fill("测试");
      await qrForm
        .locator(".webtools-qrcode-logo-meta", { hasText: "文字 Logo" })
        .waitFor({ state: "visible", timeout: 10000 });
      await qrForm
        .locator(".webtools-qrcode-preview-image")
        .waitFor({ state: "visible", timeout: 10000 });
      const qrDownloadButton = qrForm.locator('[data-webtools-qrcode-download]');
      await assert.doesNotReject(() =>
        qrDownloadButton.waitFor({ state: "visible", timeout: 10000 })
      );
      assert.equal(await qrDownloadButton.isDisabled(), false);
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:config",
        "配置转换",
        "webtools-config-convert"
      );
      const configForm = page.locator("form.webtools-config-form");
      await configForm.waitFor({ state: "visible", timeout: 10000 });
      await page
        .locator(".webtools-config-title", { hasText: "配置转换" })
        .waitFor({ state: "visible", timeout: 10000 });
      await configForm.locator('select[name="webtoolsConfigTarget"]').selectOption("json");
      await configForm
        .locator('textarea[name="webtoolsConfigInput"]')
        .fill("server:\n  port: 8080\n  host: localhost\n");
      await page.waitForFunction(() => {
        const node = document.querySelector(
          'textarea[name="webtoolsConfigOutput"]'
        ) as HTMLTextAreaElement | null;
        if (!node) {
          return false;
        }
        return node.value.includes('"server"') && node.value.includes('"port": 8080');
      });
      const configStatus = page.locator("#status-text");
      await assert.doesNotReject(() =>
        configStatus.waitFor({ state: "visible", timeout: 5000 })
      );
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:md",
        "Markdown 预览",
        "webtools-markdown"
      );
      const markdownForm = page.locator("form.webtools-markdown-form");
      await markdownForm.waitFor({ state: "visible", timeout: 10000 });
      const markdownInput = markdownForm.locator('textarea[name="webtoolsMarkdownInput"]');
      await markdownInput.fill("# LiteLauncher E2E\n\n- smoke\n- markdown");
      await page.waitForFunction(() => {
        const preview = document.querySelector(
          '[data-webtools-markdown-preview="1"]'
        ) as HTMLDivElement | null;
        const htmlOutput = document.querySelector(
          'textarea[name="webtoolsMarkdownHtml"]'
        ) as HTMLTextAreaElement | null;
        if (!preview || !htmlOutput) {
          return false;
        }
        return (
          preview.textContent?.includes("LiteLauncher E2E") === true &&
          htmlOutput.value.includes("<h1")
        );
      });
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:image",
        "图片 Base64",
        "webtools-image-base64"
      );
      const imageBase64Form = page.locator("form.webtools-image-base64-form");
      await imageBase64Form.waitFor({ state: "visible", timeout: 10000 });
      const imageInput = imageBase64Form.locator(
        'textarea[name="webtoolsImageBase64Input"]'
      );
      await imageInput.fill(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2NgYGD4DwABBAEAX+XDSQAAAABJRU5ErkJggg=="
      );
      await imageBase64Form
        .locator(".webtools-image-base64-preview-image")
        .waitFor({ state: "visible", timeout: 10000 });
      const imageDownloadButton = imageBase64Form.locator('[data-webtools-image-download]');
      await assert.doesNotReject(() =>
        imageDownloadButton.waitFor({ state: "visible", timeout: 10000 })
      );
      assert.equal(await imageDownloadButton.isDisabled(), false);
      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:diff",
        "文本对比",
        "webtools-diff"
      );
      const diffForm = page.locator("form.webtools-diff-form");
      await diffForm.waitFor({ state: "visible", timeout: 10000 });
      await diffForm
        .locator('textarea[name="webtoolsDiffLeft"]')
        .fill("alpha\nbeta\nline-3");
      await diffForm
        .locator('textarea[name="webtoolsDiffRight"]')
        .fill("alpha\ngamma\nline-3");
      await diffForm.evaluate((form) => {
        (form as HTMLFormElement).requestSubmit();
      });
      await diffForm
        .locator('.webtools-diff-summary-status[data-state="changed"]')
        .waitFor({ state: "visible", timeout: 10000 });
      await page.waitForFunction(() => {
        const viewer = document.querySelector(".webtools-diff-viewer");
        const text = viewer?.textContent ?? "";
        return text.includes("alpha") && text.includes("gamma");
      });

      await returnToSearch(page);

      await openPluginFromSearch(
        page,
        "plugin:hardware",
        "硬件检测",
        "hardware-inspector"
      );
      const hardwareForm = page.locator("form.hardware-inspector-form");
      await assertPanelFitsNarrowViewport("form.hardware-inspector-form");
      await hardwareForm
        .locator(".hardware-inspector-status")
        .waitFor({ state: "visible", timeout: 10000 });
      await hardwareForm
        .locator(".hardware-inspector-actions .settings-btn", { hasText: /刷新|刷新中/ })
        .waitFor({ state: "visible", timeout: 10000 });
    } catch (error) {
      if (session) {
        const artifactDir = await captureE2EFailureArtifacts(session.page, testName, error);
        console.error(`[e2e] failure artifacts saved to ${artifactDir}`);
      }
      throw error;
    } finally {
      if (session) {
        await session.close();
      }
    }
  }
);

test(
  "electron smoke: clipboard workbench saves manual text and shows bulk actions",
  { timeout: 240000 },
  async () => {
    const testName =
      "electron smoke: clipboard workbench saves manual text and shows bulk actions";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    try {
      session = await launchE2ESession();
      const { page } = session;

      await page.setViewportSize({ width: 900, height: 720 });

      const alphaText = `clipboard workbench alpha ${Date.now()}`;
      const betaText = `clipboard workbench beta ${Date.now() + 1}`;

      await openPluginFromSearch(
        page,
        "clipx",
        "Clipboard Workbench",
        "clipboard-workbench"
      );

      const form = page.locator("form.clipboard-workbench-form");
      await form.waitFor({ state: "visible", timeout: 10000 });

      const manualTextInput = form.locator(
        'textarea[name="clipboardWorkbenchManualText"]'
      );
      const saveManualButton = form.locator(
        '[data-clipboard-workbench-save-manual="1"]'
      );

      await manualTextInput.fill(alphaText);
      await saveManualButton.click();
      await page.waitForFunction(
        (expectedText) => {
          const items = Array.from(
            document.querySelectorAll(".clipboard-workbench-item")
          );
          const status = document.querySelector("#status-text");
          return (
            items.some((node) => node.textContent?.includes(expectedText)) &&
            status?.textContent?.includes("Saved manual text") === true
          );
        },
        alphaText,
        { timeout: 15000 }
      );

      await manualTextInput.fill(betaText);
      await saveManualButton.click();
      await page.waitForFunction(
        ([firstText, secondText]) => {
          const items = Array.from(
            document.querySelectorAll(".clipboard-workbench-item")
          );
          return (
            items.some((node) => node.textContent?.includes(firstText)) &&
            items.some((node) => node.textContent?.includes(secondText))
          );
        },
        [alphaText, betaText],
        { timeout: 15000 }
      );

      const alphaCard = form
        .locator(".clipboard-workbench-item")
        .filter({ hasText: alphaText })
        .first();
      const betaCard = form
        .locator(".clipboard-workbench-item")
        .filter({ hasText: betaText })
        .first();

      await alphaCard
        .locator('[data-clipboard-workbench-item-toggle]')
        .click();
      await betaCard
        .locator('[data-clipboard-workbench-item-toggle]')
        .click();

      const bulkBar = form.locator(".clipboard-workbench-bulk-bar");
      await bulkBar.waitFor({ state: "visible", timeout: 10000 });
      await page.waitForFunction(() => {
        const bulk = document.querySelector(".clipboard-workbench-bulk-bar");
        return bulk?.textContent?.includes("2 selected") === true;
      });

      await bulkBar
        .locator('[data-clipboard-workbench-bulk-action="merge-once"]')
        .click();
      await page.waitForFunction(() => {
        const status = document.querySelector("#status-text");
        return (
          status?.textContent?.includes(
            "Merged text restored to the clipboard."
          ) === true
        );
      });

      await bulkBar
        .locator('[data-clipboard-workbench-bulk-action="sequential"]')
        .click();
      await page.waitForFunction(() => {
        const status = document.querySelector("#status-text");
        const text = status?.textContent ?? "";
        return (
          text.includes("Pasted 2 items sequentially.") ||
          text.includes("Restored to the clipboard. Use Ctrl+V manually.")
        );
      });
    } catch (error) {
      if (session) {
        const artifactDir = await captureE2EFailureArtifacts(session.page, testName, error);
        console.error(`[e2e] failure artifacts saved to ${artifactDir}`);
      }
      throw error;
    } finally {
      if (session) {
        await session.close();
      }
    }
  }
);
