import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { inspectLiteSnapNativeExports, LITESNAP_REQUIRED_NATIVE_EXPORTS } from "../shared/litesnap-native-health";

test("native diagnostics identify missing exports without invoking native code", () => {
  const addon = Object.fromEntries(LITESNAP_REQUIRED_NATIVE_EXPORTS.map((key) => [key, () => { throw new Error("must not execute"); }]));
  assert.deepEqual(inspectLiteSnapNativeExports(addon), []);
  delete addon.scrollWindowAtPoint;
  assert.deepEqual(inspectLiteSnapNativeExports(addon), ["scrollWindowAtPoint"]);
  assert.equal(inspectLiteSnapNativeExports(null).length, 5);
});

test("loader diagnostics distinguish missing, incompatible, failed and loaded modules", () => {
  const candidate = "litesnap-capture-1234567890abcdef.node";
  for (const scenario of ["missing", "incompatible", "failed", "loaded"]) {
    const exports: any = {};
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../main/litesnap/capture-provider.js"), "utf8"), {
      exports, console: { info() {}, warn() {} }, Error,
      process: { platform: "win32", arch: "x64", versions: { napi: "10" } },
      require: (name: string) => {
        if (name === "electron") return {};
        if (name === "./native-capture-worker") return { NativeCaptureWorker: class {} };
        if (name === "./native-addon-path") return {
          isLiteSnapNativeAddonPresent: () => scenario !== "missing",
          resolveLiteSnapNativeAddonCandidates: () => [candidate],
          resolveLiteSnapNativeAddonPath: () => candidate,
          formatLiteSnapNativeAddonProbePaths: () => candidate
        };
        if (name === "node:fs") return { existsSync: () => true };
        if (name.endsWith("shared/litesnap-native-health")) return { inspectLiteSnapNativeExports };
        if (name === candidate) {
          if (scenario === "failed") throw new Error("invalid binary");
          const addon = Object.fromEntries(LITESNAP_REQUIRED_NATIVE_EXPORTS.map((key) => [key, () => true]));
          if (scenario === "incompatible") delete addon.scrollWindowAtPoint;
          return addon;
        }
        return require(name);
      }
    });
    exports.createLiteSnapCaptureProvider();
    const health = exports.getLiteSnapNativeHealth();
    assert.equal(health.loaded, scenario === "loaded");
    if (scenario === "missing") assert.match(health.message, /未找到/);
    if (scenario === "incompatible") assert.ok(health.missingExports.includes("scrollWindowAtPoint"));
    if (scenario === "failed") assert.match(health.loadErrors.join(""), /invalid binary/);
    if (scenario === "loaded") {
      assert.equal(health.moduleFile, candidate);
      assert.equal(health.missingExports.length, 0);
      health.loadErrors.push("mutated");
      assert.equal(exports.getLiteSnapNativeHealth().loadErrors.length, 0);
    }
  }
});
