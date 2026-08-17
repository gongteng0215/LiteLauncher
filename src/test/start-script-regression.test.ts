import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const packageJsonPath = path.join(process.cwd(), "package.json");
const startElectronScriptPath = path.join(process.cwd(), "scripts", "start-electron.cjs");
const devElectronScriptPath = path.join(process.cwd(), "scripts", "dev-electron.cjs");
const verifyNsisUpgradeScriptPath = path.join(
  process.cwd(),
  "scripts",
  "verify-nsis-upgrade.cjs"
);

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

test("dev-electron only restarts for main-process bundle changes", () => {
  const source = fs.readFileSync(devElectronScriptPath, "utf8");

  assert.match(
    source,
    /normalized\.startsWith\("main\/"\)/,
    "main bundle updates should still restart the dev Electron instance"
  );
  assert.match(
    source,
    /normalized\.startsWith\("preload\/"\)/,
    "preload bundle updates should still restart the dev Electron instance"
  );
  assert.match(
    source,
    /normalized\.startsWith\("shared\/"\)/,
    "shared bundle updates should still restart the dev Electron instance"
  );
  assert.doesNotMatch(
    source,
    /normalized\.startsWith\("renderer\/"\)/,
    "renderer bundle updates should rely on in-app auto reload instead of restarting Electron"
  );
  assert.match(
    source,
    /normalized\.endsWith\("\.map"\)|normalized\.endsWith\('\.map'\)/,
    "source map updates should be ignored so watch mode does not thrash Electron restarts"
  );
  assert.doesNotMatch(
    source,
    /spawn\(electronBinary,\s*\["\.",\s*"--replace-instance"\]/,
    "dev-electron should not use --replace-instance; dev runner owns restarts"
  );
  assert.match(
    source,
    /spawn\(electronBinary,\s*\["\."\]/,
    "dev-electron should start Electron without replace-instance args"
  );
  assert.match(
    source,
    /if \(!initialStartAttempted\) \{\s*startElectron\(\);\s*\}/,
    "a normal Electron exit must not be relaunched forever by the readiness loop"
  );
  assert.match(source, /const terminationTasks = new WeakMap\(\)/);
  assert.match(source, /if \(restartInFlight\)/);
  assert.match(source, /restartRequested = true/);
  assert.match(source, /DEV_ELECTRON_LOCK_PORT/);
  assert.match(source, /requestExistingRunnerReplacement/);
  assert.match(source, /replacement requested by a new dev runner/);
  assert.match(
    source,
    /runnerLockServer\.close/,
    "the Electron runner lock should close during a clean shutdown"
  );
});

test("dev runner refuses a duplicate project watcher", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "scripts", "dev.cjs"), "utf8");
  assert.match(source, /DEV_LOCK_PORT/);
  assert.match(source, /EADDRINUSE/);
  assert.match(source, /another LiteLauncher dev runner is already active/);
});

test("NSIS upgrade verification refuses an ordinary local Windows session", () => {
  const env = { ...process.env };
  delete env.LITELAUNCHER_NSIS_UPGRADE_ISOLATED;
  const result = spawnSync(process.execPath, [verifyNsisUpgradeScriptPath], {
    cwd: process.cwd(),
    env,
    encoding: "utf8",
    windowsHide: true
  });

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /refusing to run NSIS upgrade verification on an ordinary Windows session/
  );
});
