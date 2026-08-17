import assert from "node:assert/strict";
import * as http from "node:http";
import { AddressInfo } from "node:net";
import test from "node:test";

import {
  captureE2EFailureArtifacts,
  launchE2ESession,
  openPluginFromSearch
} from "./e2e-test-utils";

async function listenOnRandomPort(): Promise<{
  server: http.Server;
  port: number;
}> {
  const server = http.createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  return { server, port: (server.address() as AddressInfo).port };
}

async function closeServer(server: http.Server): Promise<void> {
  if (!server.listening) {
    return;
  }
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
    server.closeAllConnections?.();
  });
}

test(
  "electron smoke: HTTP Mock recovers from a port conflict and releases its listener on exit",
  { timeout: 120000 },
  async () => {
    const testName =
      "electron smoke: HTTP Mock recovers from a port conflict and releases its listener on exit";
    const occupied = await listenOnRandomPort();
    const port = occupied.port;
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    let sessionClosed = false;

    try {
      session = await launchE2ESession();
      const { page } = session;
      await page.setViewportSize({ width: 960, height: 720 });
      await openPluginFromSearch(
        page,
        "plugin:http mock",
        "HTTP Mock Server",
        "webtools-http-mock"
      );

      const form = page.locator("form.webtools-http-mock-form");
      await form.locator('input[name="webtoolsHttpMockPort"]').fill(String(port));
      await form.locator('input[name="webtoolsHttpMockPath"]').fill("/lifecycle-e2e");
      await form.locator('[data-webtools-http-mock-start="1"]').click();
      await form.locator(".webtools-http-mock-info", { hasText: "已被占用" }).waitFor({
        state: "visible",
        timeout: 10000
      });
      await form.locator(".webtools-http-mock-runtime", { hasText: "当前未启动" }).waitFor({
        state: "visible",
        timeout: 10000
      });

      await closeServer(occupied.server);
      await form.locator('[data-webtools-http-mock-start="1"]').click();
      await form.locator(".webtools-http-mock-runtime", { hasText: "运行中" }).waitFor({
        state: "visible",
        timeout: 10000
      });

      await form.locator('[data-webtools-http-mock-start="1"]').click();
      await form.locator(".webtools-http-mock-info", { hasText: "已在运行" }).waitFor({
        state: "visible",
        timeout: 10000
      });

      const response = await page.request.get(
        `http://127.0.0.1:${port}/lifecycle-e2e`
      );
      assert.equal(response.ok(), true);

      await session.close();
      sessionClosed = true;

      const replacement = http.createServer();
      try {
        await new Promise<void>((resolve, reject) => {
          replacement.once("error", reject);
          replacement.listen(port, "127.0.0.1", () => {
            replacement.off("error", reject);
            resolve();
          });
        });
        assert.equal(replacement.listening, true);
      } finally {
        await closeServer(replacement);
      }
    } catch (error) {
      if (session && !sessionClosed) {
        const artifactDir = await captureE2EFailureArtifacts(
          session.page,
          testName,
          error,
          session.electronApp
        );
        console.error(`[e2e] failure artifacts: ${artifactDir}`);
      }
      throw error;
    } finally {
      await closeServer(occupied.server);
      if (session && !sessionClosed) {
        await session.close();
      }
    }
  }
);
