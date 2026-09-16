import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

for (const missing of [true, false]) {
  test(`dev runner exits without retrying when Electron ${missing ? "is missing" : "fails to spawn"}`, async () => {
    const scriptPath = path.resolve("scripts/dev-electron.cjs");
    const scriptRequire = createRequire(scriptPath);
    const source = fs.readFileSync(scriptPath, "utf8")
      .replace(/void acquireRunnerLock\(\)[\s\S]*$/, "globalThis.start = startElectron;");
    let spawns = 0;
    const exits: number[] = [];
    const messages: string[] = [];
    const sandbox = {
      __dirname: path.dirname(scriptPath),
      require: Object.assign((name: string) => {
        if (name === "fs") return { existsSync: (file: string) => !(missing && file.endsWith("electron.exe")) };
        if (name === "child_process") return { spawn: () => {
          spawns++;
          const child = new EventEmitter();
          queueMicrotask(() => child.emit("error", new Error("spawn ENOENT")));
          return child;
        } };
        return scriptRequire(name);
      }, { resolve: scriptRequire.resolve }),
      process: { platform: "win32", env: {}, on() {}, exit: (code: number) => exits.push(code) },
      console: { info: (message: string) => messages.push(message) },
      setTimeout, clearTimeout, setInterval, clearInterval,
      start: () => {}
    };
    vm.runInNewContext(source, sandbox);
    sandbox.start();
    await new Promise<void>((resolve) => setImmediate(resolve));
    sandbox.start();
    assert.deepEqual(exits, [1]);
    assert.equal(spawns, missing ? 0 : 1);
    assert.ok(messages.some((message) => message.includes(missing ? "install.js" : "failed to start Electron")));
  });
}
