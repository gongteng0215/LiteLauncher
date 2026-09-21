import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import type { AppUpdaterProvider } from "../main/app-updater";

function setup(packaged = true, platform = "win32", portable = false) {
  const updater = Object.assign(new EventEmitter(), {
    checkForUpdates: async (): Promise<any> => null,
    quitAndInstall: () => {}
  });
  const logs: any[] = [];
  const exports: any = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../main/app-updater.js"), "utf8"), {
    exports, Error, console, setTimeout, setInterval,
    process: { platform, execPath: "LiteLauncher.exe", env: portable ? { PORTABLE_EXECUTABLE_DIR: "portable" } : {} },
    require: (name: string) => {
      if (name === "electron") return { app: { isPackaged: packaged, getVersion: () => "1.1.22" }, dialog: { showMessageBox: async () => ({ response: 1 }) } };
      if (name === "electron-updater") return { autoUpdater: updater };
      throw new Error(`unexpected module: ${name}`);
    }
  });
  const provider = exports.createAppUpdater({ reportError: (entry: any) => logs.push(entry) }) as AppUpdaterProvider;
  return { provider, updater, logs };
}

test("unsupported environments never check or install updates", async () => {
  for (const args of [[false, "win32", false], [true, "linux", false], [true, "win32", true]] as const) {
    const { provider, updater } = setup(args[0], args[1], args[2]);
    updater.checkForUpdates = async () => { throw new Error("must not check"); };
    assert.equal((await provider.checkForUpdates()).phase, "unsupported");
    assert.equal(await provider.installUpdateNow(), false);
  }
});

test("synchronous check failure releases the in-flight guard and retry clears stale metadata", async () => {
  const { provider, updater, logs } = setup();
  updater.checkForUpdates = () => {
    updater.emit("checking-for-update");
    throw new Error("offline token=private-value");
  };
  const failed = await provider.checkForUpdates();
  assert.equal(failed.failureStage, "check");
  assert.doesNotMatch(failed.message!, /private-value/);
  assert.equal(logs.length, 1);
  updater.checkForUpdates = async () => {
    updater.emit("checking-for-update");
    updater.emit("update-not-available");
  };
  const retried = await provider.checkForUpdates();
  assert.equal(retried.phase, "not-available");
  assert.equal(retried.failureStage, undefined);
  assert.equal(retried.updateVersion, undefined);
});

test("download rejection is terminal even without an error event and can be retried", async () => {
  const { provider, updater, logs } = setup();
  let rejectDownload!: (error: Error) => void;
  let calls = 0;
  const downloadPromise = new Promise((_, reject) => { rejectDownload = reject; });
  updater.checkForUpdates = async () => {
    calls++;
    updater.emit("checking-for-update");
    updater.emit("update-available", { version: "1.1.23" });
    updater.emit("download-progress", { percent: 42 });
    return { isUpdateAvailable: true, downloadPromise };
  };
  const first = provider.checkForUpdates();
  const second = provider.checkForUpdates();
  await Promise.resolve();
  assert.equal(provider.getStatus().phase, "downloading");
  rejectDownload(new Error("connection reset"));
  const [failed] = await Promise.all([first, second]);
  assert.equal(calls, 1);
  assert.equal(failed.phase, "error");
  assert.equal(failed.failureStage, "download");
  assert.equal(failed.progressPercent, undefined);
  assert.equal(logs.length, 1);
  updater.checkForUpdates = async () => {
    updater.emit("checking-for-update");
    updater.emit("update-downloaded", { version: "1.1.23" });
  };
  assert.equal((await provider.checkForUpdates()).phase, "downloaded");
  updater.checkForUpdates = async () => { throw new Error("must preserve ready installer"); };
  assert.equal((await provider.checkForUpdates()).phase, "downloaded");
  assert.equal(await provider.installUpdateNow(), true);
});

test("download error event plus rejection records one failure", async () => {
  const { provider, updater, logs } = setup();
  updater.checkForUpdates = async () => {
    updater.emit("checking-for-update");
    updater.emit("update-available", { version: "1.1.23" });
    const error = new Error("download failed");
    updater.emit("error", error);
    throw error;
  };
  assert.equal((await provider.checkForUpdates()).failureStage, "download");
  assert.equal(logs.length, 1);
});

test("settings retry shows a pending state, then reports the actual download failure", async () => {
  const sandbox: any = {
    appUpdaterStatus: { supported: true, phase: "error", failureStage: "download" },
    commandCenterUi: { isSettingsOverlayOpen: () => false },
    setStatus: () => {},
    getLauncherApi: () => ({ checkForAppUpdates: async () => ({
      supported: true, phase: "error", failureStage: "download", message: "下载更新失败：offline"
    }) })
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../renderer/renderer-settings-controller.js"), "utf8"), sandbox);
  const retry = sandbox.checkForAppUpdatesFromSettings();
  assert.equal(sandbox.appUpdaterStatus.phase, "checking");
  await retry;
  assert.equal(sandbox.formatAppUpdaterPhaseText(sandbox.appUpdaterStatus), "下载失败");
  assert.match(sandbox.formatAppUpdaterActionHint(sandbox.appUpdaterStatus), /点击重试/);
  assert.match(sandbox.formatAppUpdaterDiagnosticsForClipboard(sandbox.appUpdaterStatus), /下载失败/);
});
