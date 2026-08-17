import assert from "node:assert/strict";
import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import * as net from "node:net";
import path from "node:path";
import test from "node:test";

const runnerPath = path.join(process.cwd(), "scripts", "dev-electron.cjs");

async function reserveRandomPort(): Promise<number> {
  const server = net.createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return port;
}

function spawnLockOnlyRunner(port: number): {
  child: ChildProcessWithoutNullStreams;
  output: () => string;
} {
  let captured = "";
  const child = spawn(process.execPath, [runnerPath], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      LITELAUNCHER_DEV_RUNNER_LOCK_ONLY: "1",
      LITELAUNCHER_DEV_ELECTRON_LOCK_PORT: String(port)
    },
    stdio: "pipe",
    windowsHide: true
  });
  child.stdout.on("data", (chunk) => {
    captured += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    captured += chunk.toString();
  });
  return { child, output: () => captured };
}

async function waitForOutput(
  runner: ReturnType<typeof spawnLockOnlyRunner>,
  pattern: RegExp,
  timeoutMs = 8000
): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (pattern.test(runner.output())) {
      return;
    }
    if (runner.child.exitCode !== null) {
      throw new Error(
        `runner exited before ${String(pattern)}; exitCode=${String(runner.child.exitCode)}; signal=${String(runner.child.signalCode)}; output=${runner.output()}`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`timed out waiting for ${String(pattern)}; output=${runner.output()}`);
}

async function waitForExit(
  child: ChildProcessWithoutNullStreams,
  timeoutMs = 8000
): Promise<void> {
  if (child.exitCode !== null) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("runner did not exit in time")),
      timeoutMs
    );
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

test(
  "Electron dev runner cleanly replaces an earlier lock owner",
  { timeout: 20000 },
  async () => {
    const port = await reserveRandomPort();
    const first = spawnLockOnlyRunner(port);
    let second: ReturnType<typeof spawnLockOnlyRunner> | null = null;
    try {
      await waitForOutput(first, /runner lock test mode active/);
      second = spawnLockOnlyRunner(port);
      await waitForOutput(second, /requesting a clean replacement/);
      try {
        await waitForOutput(second, /runner lock acquired/);
      } catch (error) {
        throw new Error(
          `${String(error)}; firstPid=${String(first.child.pid)}; secondPid=${String(second.child.pid)}; firstOutput=${first.output()}`
        );
      }
      await waitForExit(first.child);

      assert.match(first.output(), /replacement requested by a new dev runner/);
      assert.equal(first.child.exitCode, 0);
      assert.equal(second.child.exitCode, null);
    } finally {
      if (first.child.exitCode === null) {
        first.child.kill();
        await waitForExit(first.child).catch(() => undefined);
      }
      if (second && second.child.exitCode === null) {
        second.child.kill();
        await waitForExit(second.child).catch(() => undefined);
      }
    }
  }
);
