import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import test from "node:test";

test("port helper only ends the selected PID after explicit confirmation", async () => {
  for (const response of [0, 1]) {
    const exports: any = {};
    const commands: Array<{ name: string; args: string[] }> = [];
    let prompted = false;
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../main/plugins/webtools-port-helper/index.js"), "utf8"), {
      exports, URLSearchParams, process: { platform: "win32" },
      require: (name: string) => {
        if (name === "node:child_process") return { execFile() {} };
        if (name === "node:util") return { promisify: () => async (file: string, args: string[]) => {
          if (file === "taskkill") assert.equal(prompted, true);
          commands.push({ name: file, args });
          return { stdout: "" };
        } };
        if (name === "electron") return { dialog: { showMessageBox: async (_owner: unknown, options: any) => {
          prompted = true;
          assert.equal(options.defaultId, 0);
          assert.equal(options.cancelId, 0);
          assert.match(options.message, /PID 12345/);
          return { response };
        } } };
        if (name.endsWith("/channels")) return { IPC_CHANNELS: {} };
        if (name === "../webtools-shared") return {};
        throw new Error(`unexpected import ${name}`);
      }
    });
    const result = await exports.webtoolsPortHelperPlugin.execute("action=kill&pid=12345", { window: {} });
    assert.equal(result.ok, true);
    assert.equal(commands.filter((command) => command.name === "taskkill").length, response);
    if (response === 0) assert.match(result.message, /已取消/);
    if (response === 1) assert.equal(commands.find((command) => command.name === "taskkill")?.args.join(" "), "/PID 12345 /F");
  }
});
