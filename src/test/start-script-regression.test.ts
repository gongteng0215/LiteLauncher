import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const packageJsonPath = path.join(process.cwd(), "package.json");
const startElectronScriptPath = path.join(process.cwd(), "scripts", "start-electron.cjs");

type SpawnOptions = {
  cwd?: string;
  env?: Record<string, string>;
  detached?: boolean;
  stdio?: string;
  windowsHide?: boolean;
};

type SpawnCall = {
  command: string;
  args: string[];
  options?: SpawnOptions;
};

test("start script delegates Electron launch to helper script", () => {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>;
  };
  const startScript = packageJson.scripts?.start ?? "";

  assert.match(startScript, /node scripts\/start-electron\.cjs/);
  assert.doesNotMatch(
    startScript,
    /set ELECTRON_DISABLE_CRASH_REPORTER=1&& set ELECTRON_RUN_AS_NODE=&& electron \. --replace-instance/i
  );
});

test("start-electron helper sanitizes env and detaches Electron on Windows", () => {
  const startElectronModule = require(startElectronScriptPath) as {
    buildElectronEnv?: (baseEnv: NodeJS.ProcessEnv) => Record<string, string>;
    launchElectron?: (
      spawnImpl: (
        command: string,
        args: string[],
        options?: SpawnOptions
      ) => { unref?: () => void },
      baseEnv: NodeJS.ProcessEnv
    ) => void;
  };

  assert.equal(typeof startElectronModule.buildElectronEnv, "function");
  assert.equal(typeof startElectronModule.launchElectron, "function");

  const nextEnv = startElectronModule.buildElectronEnv?.({
    PATH: "C:\\Windows\\System32",
    ELECTRON_RUN_AS_NODE: "1",
    LITELAUNCHER_DEBUG_KEYS: "1"
  });
  assert.equal(nextEnv?.ELECTRON_RUN_AS_NODE, undefined);
  assert.equal(nextEnv?.ELECTRON_DISABLE_CRASH_REPORTER, "1");
  assert.equal(nextEnv?.LITELAUNCHER_DEBUG_KEYS, "1");

  const calls: SpawnCall[] = [];
  let unrefCalled = false;
  startElectronModule.launchElectron?.(
    (command, args, options) => {
      calls.push({ command, args, options });
      return {
        unref: () => {
          unrefCalled = true;
        }
      };
    },
    {
      PATH: "C:\\Windows\\System32",
      ELECTRON_RUN_AS_NODE: "1",
      LITELAUNCHER_DEBUG_KEYS: "1"
    }
  );

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0]?.args, [".", "--replace-instance"]);
  assert.equal(calls[0]?.options?.cwd, process.cwd());
  assert.equal(calls[0]?.options?.env?.ELECTRON_RUN_AS_NODE, undefined);
  assert.equal(calls[0]?.options?.env?.ELECTRON_DISABLE_CRASH_REPORTER, "1");
  assert.equal(calls[0]?.options?.env?.LITELAUNCHER_DEBUG_KEYS, "1");

  if (process.platform === "win32") {
    assert.equal(calls[0]?.options?.detached, true);
    assert.equal(calls[0]?.options?.stdio, "ignore");
    assert.equal(calls[0]?.options?.windowsHide, true);
    assert.equal(unrefCalled, true);
  }
});
