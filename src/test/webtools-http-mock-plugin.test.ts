import assert from "node:assert/strict";
import * as http from "node:http";
import { AddressInfo } from "node:net";
import test from "node:test";

import type { BrowserWindow } from "electron";

import {
  disposeWebtoolsHttpMockServer,
  webtoolsHttpMockPlugin
} from "../main/plugins/webtools-http-mock";
import type { ExecuteResult, LaunchItem } from "../shared/types";

const selectedItem: LaunchItem = {
  id: "plugin:webtools-http-mock:test",
  type: "command",
  title: "HTTP Mock Server",
  subtitle: "test",
  target: "command:plugin:webtools-http-mock",
  keywords: ["test"]
};

function buildOptions(
  action: "start" | "stop" | "status",
  port: number,
  path = "/lifecycle"
): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("port", String(port));
  params.set("path", path);
  params.set("method", "GET");
  params.set("statusCode", "200");
  params.set("contentType", "application/json; charset=utf-8");
  params.set("body", '{"ok":true,"source":"lifecycle-test"}');
  return params.toString();
}

async function execute(
  action: "start" | "stop" | "status",
  port: number,
  path = "/lifecycle"
): Promise<ExecuteResult> {
  return Promise.resolve(
    webtoolsHttpMockPlugin.execute(buildOptions(action, port, path), {
      window: {} as BrowserWindow,
      selectedItem
    })
  );
}

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
  return {
    server,
    port: (server.address() as AddressInfo).port
  };
}

async function closeServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
    server.closeAllConnections?.();
  });
}

async function requestText(port: number, path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = http.get(`http://127.0.0.1:${port}${path}`, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      response.once("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
    request.once("error", reject);
  });
}

test("HTTP Mock repeated start is idempotent and keeps request metrics", async () => {
  await disposeWebtoolsHttpMockServer();
  const probe = await listenOnRandomPort();
  const port = probe.port;
  await closeServer(probe.server);

  try {
    const started = await execute("start", port);
    assert.equal(started.ok, true);
    assert.equal(started.data?.running, true);
    assert.equal(started.data?.phase, "running");

    const body = await requestText(port, "/lifecycle");
    assert.match(body, /"source":"lifecycle-test"/);

    const repeated = await execute("start", port);
    assert.equal(repeated.ok, true);
    assert.match(repeated.message ?? "", /已在运行/);
    assert.equal(repeated.data?.requestCount, 1);

    const stopped = await execute("stop", port);
    assert.equal(stopped.ok, true);
    assert.equal(stopped.data?.running, false);
    assert.equal(stopped.data?.phase, "stopped");
  } finally {
    await disposeWebtoolsHttpMockServer();
  }
});

test("HTTP Mock reports a port conflict without leaving a false running state", async () => {
  await disposeWebtoolsHttpMockServer();
  const occupied = await listenOnRandomPort();

  try {
    const failed = await execute("start", occupied.port, "/conflict");
    assert.equal(failed.ok, false);
    assert.equal(failed.data?.running, false);
    assert.equal(failed.data?.phase, "error");
    assert.match(failed.message ?? "", /端口 .* 已被占用/);
    assert.match(String(failed.data?.lastError ?? ""), /请更换端口后重试/);
  } finally {
    await closeServer(occupied.server);
    await disposeWebtoolsHttpMockServer();
  }
});

test("HTTP Mock disposal closes the listener so the port can be reused", async () => {
  await disposeWebtoolsHttpMockServer();
  const probe = await listenOnRandomPort();
  const port = probe.port;
  await closeServer(probe.server);

  const started = await execute("start", port, "/dispose");
  assert.equal(started.ok, true);
  await disposeWebtoolsHttpMockServer();

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
});
