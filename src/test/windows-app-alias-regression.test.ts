import assert from "node:assert/strict";
import * as childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { DEFAULT_CATALOG_SCAN_CONFIG } from "../shared/settings";
import { LaunchItem } from "../shared/types";

const CODEX_EXE =
  "C:\\Program Files\\WindowsApps\\OpenAI.Codex_26.313.5234.0_x64__2p2nqsd0c76g0\\app\\resources\\codex.exe";
const CODEX_PACKAGE_ROOT =
  "C:\\Program Files\\WindowsApps\\OpenAI.Codex_26.313.5234.0_x64__2p2nqsd0c76g0";
const CODEX_APP_ID = "OpenAI.Codex_2p2nqsd0c76g0!App";
const CODEX_ICON = `${CODEX_PACKAGE_ROOT}\\assets\\Square44x44Logo.png`;
const ELECTRON_MODULE_PATH = require.resolve("electron");
const nativeChildProcess = require("node:child_process") as typeof childProcess & {
  spawnSync: typeof childProcess.spawnSync;
};

const APPX_MANIFEST = `<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10">
  <Identity Name="OpenAI.Codex" Publisher="CN=OpenAI" Version="26.313.5234.0" />
  <Properties>
    <DisplayName>Codex</DisplayName>
    <Logo>assets\\StoreLogo.png</Logo>
  </Properties>
  <Applications>
    <Application Id="App" Executable="app\\resources\\codex.exe" EntryPoint="OpenAI.Codex.App">
      <VisualElements DisplayName="Codex" Square44x44Logo="assets\\Square44x44Logo.png" />
    </Application>
  </Applications>
</Package>`;

function skipOnNonWindows(t: test.TestContext): void {
  if (process.platform !== "win32") {
    t.skip("Windows app alias regression only runs on Windows");
  }
}

function makeSpawnResult(
  status: number,
  stdout = "",
  stderr = ""
): childProcess.SpawnSyncReturns<string> {
  return {
    pid: 1234,
    output: [null, stdout, stderr],
    stdout,
    stderr,
    status,
    signal: null
  } as childProcess.SpawnSyncReturns<string>;
}

function withTemporaryEnv(
  overrides: Partial<Record<"APPDATA" | "PROGRAMDATA" | "LOCALAPPDATA", string>>,
  fn: () => void
): void {
  const previous: Record<string, string | undefined> = {
    APPDATA: process.env.APPDATA,
    PROGRAMDATA: process.env.PROGRAMDATA,
    LOCALAPPDATA: process.env.LOCALAPPDATA
  };

  try {
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function loadFreshModule<T>(modulePath: string): T {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved) as T;
}

function installElectronStub(): void {
  delete require.cache[ELECTRON_MODULE_PATH];
  require.cache[ELECTRON_MODULE_PATH] = {
    id: ELECTRON_MODULE_PATH,
    filename: ELECTRON_MODULE_PATH,
    loaded: true,
    exports: {
      app: {
        quit() {
          return undefined;
        }
      },
      BrowserWindow: class BrowserWindowStub {},
      clipboard: {
        writeText() {
          return undefined;
        }
      },
      shell: {
        openPath: async () => "",
        openExternal: async () => undefined,
        showItemInFolder() {
          return undefined;
        }
      }
    }
  } as NodeModule;
}

test("buildCatalogWithOptions includes a single Codex WindowsApps application item", (t) => {
  skipOnNonWindows(t);

  const originalSpawnSync = childProcess.spawnSync;
  const originalExistsSync = fs.existsSync;
  const originalReadFileSync = fs.readFileSync;

  t.after(() => {
    nativeChildProcess.spawnSync = originalSpawnSync;
    fs.existsSync = originalExistsSync;
    fs.readFileSync = originalReadFileSync;
  });

  nativeChildProcess.spawnSync = ((command, args) => {
    const executable = String(command);
    const argList = Array.isArray(args) ? args.map((entry) => String(entry)) : [];
    const script = argList.join(" ");

    if (executable.toLowerCase().endsWith("\\where.exe") && argList[0] === "codex") {
      return makeSpawnResult(0, `${CODEX_EXE}\r\n`);
    }

    if (script.includes("Get-StartApps")) {
      return makeSpawnResult(
        0,
        JSON.stringify({
          name: "Codex",
          appId: CODEX_APP_ID,
          installLocation: CODEX_PACKAGE_ROOT
        })
      );
    }

    return makeSpawnResult(1, "", "unexpected spawnSync");
  }) as typeof childProcess.spawnSync;

  withTemporaryEnv(
    {
      APPDATA: "Z:\\LiteLauncherTest\\NoAppData",
      PROGRAMDATA: "Z:\\LiteLauncherTest\\NoProgramData",
      LOCALAPPDATA: "Z:\\LiteLauncherTest\\NoLocalAppData"
    },
    () => {
      const { buildCatalogWithOptions } = loadFreshModule<typeof import("../main/catalog")>(
        "../main/catalog"
      );

      fs.existsSync = ((candidate: fs.PathLike) => {
        const fullPath = String(candidate).replace(/\//g, "\\");
        if (
          fullPath === `${CODEX_PACKAGE_ROOT}\\AppxManifest.xml` ||
          fullPath === CODEX_ICON
        ) {
          return true;
        }
        return false;
      }) as typeof fs.existsSync;

      fs.readFileSync = ((candidate: fs.PathLike, options?: unknown) => {
        const fullPath = String(candidate).replace(/\//g, "\\");
        if (
          fullPath === `${CODEX_PACKAGE_ROOT}\\AppxManifest.xml` &&
          options === "utf8"
        ) {
          return APPX_MANIFEST;
        }
        return originalReadFileSync(candidate, options as never);
      }) as typeof fs.readFileSync;

      const catalog = buildCatalogWithOptions({
        ...DEFAULT_CATALOG_SCAN_CONFIG,
        scanProgramFiles: false,
        customScanDirs: [],
        excludeScanDirs: [],
        resultIncludeDirs: [],
        resultExcludeDirs: []
      });

      const codexItems = catalog.filter(
        (item) =>
          item.target === `command:apps-folder:${encodeURIComponent(CODEX_APP_ID)}` ||
          item.subtitle === CODEX_EXE
      );

      assert.equal(codexItems.length, 1);
      assert.equal(codexItems[0]?.id, "command:apps-folder:codex");
      assert.equal(codexItems[0]?.type, "application");
      assert.equal(codexItems[0]?.title, "Codex");
      assert.equal(codexItems[0]?.target, `command:apps-folder:${encodeURIComponent(CODEX_APP_ID)}`);
      assert.equal(codexItems[0]?.iconPath, CODEX_ICON);
    }
  );
});

test("getDynamicSearchItems returns a WindowsApps Codex application result", (t) => {
  skipOnNonWindows(t);

  const originalSpawnSync = childProcess.spawnSync;
  const originalExistsSync = fs.existsSync;
  const originalReadFileSync = fs.readFileSync;

  t.after(() => {
    nativeChildProcess.spawnSync = originalSpawnSync;
    fs.existsSync = originalExistsSync;
    fs.readFileSync = originalReadFileSync;
  });

  nativeChildProcess.spawnSync = ((command, args) => {
    const executable = String(command);
    const argList = Array.isArray(args) ? args.map((entry) => String(entry)) : [];
    if (executable.toLowerCase().endsWith("\\where.exe") && argList[0] === "codex") {
      return makeSpawnResult(0, `${CODEX_EXE}\r\n`);
    }
    return makeSpawnResult(1, "", "unexpected spawnSync");
  }) as typeof childProcess.spawnSync;

  const { getDynamicSearchItems } = loadFreshModule<typeof import("../main/search")>(
    "../main/search"
  );

  fs.existsSync = ((candidate: fs.PathLike) => {
    const fullPath = String(candidate).replace(/\//g, "\\");
    return fullPath === `${CODEX_PACKAGE_ROOT}\\AppxManifest.xml` || fullPath === CODEX_ICON;
  }) as typeof fs.existsSync;

  fs.readFileSync = ((candidate: fs.PathLike, options?: unknown) => {
    const fullPath = String(candidate).replace(/\//g, "\\");
    if (fullPath === `${CODEX_PACKAGE_ROOT}\\AppxManifest.xml` && options === "utf8") {
      return APPX_MANIFEST;
    }
    return originalReadFileSync(candidate, options as never);
  }) as typeof fs.readFileSync;

  const results = getDynamicSearchItems("codex", "all");

  assert.equal(results.length, 1);
  assert.equal(results[0]?.id, "command:apps-folder:codex");
  assert.equal(results[0]?.type, "application");
  assert.equal(results[0]?.title, "Codex");
  assert.equal(results[0]?.subtitle, CODEX_EXE);
  assert.equal(results[0]?.target, `command:apps-folder:${encodeURIComponent(CODEX_APP_ID)}`);
  assert.equal(results[0]?.iconPath, CODEX_ICON);
});

test("executeItem launches AppsFolder targets through PowerShell Start-Process", async (t) => {
  skipOnNonWindows(t);

  installElectronStub();

  const originalSpawnSync = childProcess.spawnSync;

  t.after(() => {
    nativeChildProcess.spawnSync = originalSpawnSync;
    delete require.cache[ELECTRON_MODULE_PATH];
  });

  const observedCalls: Array<{ command: string; args: string[] }> = [];
  nativeChildProcess.spawnSync = ((command, args) => {
    const executable = String(command);
    const argList = Array.isArray(args) ? args.map((entry) => String(entry)) : [];
    observedCalls.push({ command: executable, args: argList });

    if (
      executable.toLowerCase().endsWith("\\powershell.exe") &&
      argList.includes("-ExecutionPolicy") &&
      argList.includes("Bypass") &&
      argList.join(" ").includes(`shell:AppsFolder\\${CODEX_APP_ID}`)
    ) {
      return makeSpawnResult(0, "", "");
    }

    return makeSpawnResult(1, "", "unexpected spawnSync");
  }) as typeof childProcess.spawnSync;

  const { executeItem } = loadFreshModule<typeof import("../main/actions")>(
    "../main/actions"
  );

  const result = await executeItem(
    {
      id: "command:apps-folder:codex",
      type: "application",
      title: "Codex",
      subtitle: CODEX_EXE,
      target: `command:apps-folder:${encodeURIComponent(CODEX_APP_ID)}`,
      keywords: ["codex"]
    } as LaunchItem,
    {
      webContents: {
        send() {
          return undefined;
        }
      }
    } as never
  );

  assert.equal(result.ok, true);
  assert.equal(result.keepOpen, false);
  assert.match(result.message ?? "", /已启动应用/);

  assert.ok(
    observedCalls.some(
      (call) =>
        call.command.toLowerCase().endsWith("\\powershell.exe") &&
        call.args.includes("-NoProfile") &&
        call.args.includes("-NonInteractive") &&
        call.args.includes("-ExecutionPolicy") &&
        call.args.includes("Bypass") &&
        call.args.join(" ").includes(`shell:AppsFolder\\${CODEX_APP_ID}`)
    )
  );
});
