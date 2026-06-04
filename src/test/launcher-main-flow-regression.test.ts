import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { DEFAULT_CATALOG_SCAN_CONFIG } from "../shared/settings";
import { IPC_CHANNELS } from "../shared/channels";
import { LaunchItem } from "../shared/types";
import { executeItem } from "../main/actions";
import { buildCatalogWithOptions } from "../main/catalog";
import { validatePinnedItemRequest } from "../main/pinning";
import {
  getVisiblePluginIds,
  setVisiblePluginIds
} from "../main/plugins";
import { searchItems } from "../main/search";
import { UsageStore } from "../main/usage-store";

type SentMessage = {
  channel: string;
  payload: unknown;
};

function createMockWindow(): {
  window: { webContents: { send: (channel: string, payload: unknown) => void } };
  sent: SentMessage[];
} {
  const sent: SentMessage[] = [];
  return {
    window: {
      webContents: {
        send(channel: string, payload: unknown): void {
          sent.push({ channel, payload });
        }
      }
    },
    sent
  };
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

function buildCatalogForRegression(): LaunchItem[] {
  let catalog: LaunchItem[] = [];
  withTemporaryEnv(
    {
      APPDATA: "Z:\\LiteLauncherTest\\NoAppData",
      PROGRAMDATA: "Z:\\LiteLauncherTest\\NoProgramData",
      LOCALAPPDATA: "Z:\\LiteLauncherTest\\NoLocalAppData"
    },
    () => {
      catalog = buildCatalogWithOptions({
        ...DEFAULT_CATALOG_SCAN_CONFIG,
        scanProgramFiles: false,
        customScanDirs: [],
        excludeScanDirs: [],
        resultIncludeDirs: [],
        resultExcludeDirs: []
      });
    }
  );
  return catalog;
}

function findTarget(items: LaunchItem[], prefix: string): LaunchItem | undefined {
  const normalized = prefix.trim().toLowerCase();
  return items.find((item) => item.target.trim().toLowerCase().startsWith(normalized));
}

test("release config keeps auto-update metadata on non-draft GitHub releases", () => {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const workflowPath = path.join(
    process.cwd(),
    ".github",
    "workflows",
    "build-desktop.yml"
  );

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    dependencies?: Record<string, string>;
    build?: {
      publish?: Array<Record<string, unknown>>;
    };
  };
  const workflowSource = fs.readFileSync(workflowPath, "utf8");
  const publishConfig = Array.isArray(packageJson.build?.publish)
    ? packageJson.build?.publish[0]
    : null;

  assert.equal(
    typeof packageJson.dependencies?.["electron-updater"],
    "string",
    "desktop package should include electron-updater"
  );
  assert.equal(
    publishConfig?.provider,
    "github",
    "desktop release metadata should keep GitHub as the update provider"
  );
  assert.notEqual(
    publishConfig?.releaseType,
    "draft",
    "draft GitHub releases are invisible to electron-updater"
  );
  assert.match(
    workflowSource,
    /gh release edit "\$\{GITHUB_REF_NAME\}".*--draft=false.*--latest/,
    "release workflow should publish draft releases before uploading updater metadata"
  );
});

test("desktop packaging clears stale release outputs and verifies updater metadata", () => {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const workflowPath = path.join(
    process.cwd(),
    ".github",
    "workflows",
    "build-desktop.yml"
  );

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>;
  };
  const workflowSource = fs.readFileSync(workflowPath, "utf8");
  const scripts = packageJson.scripts ?? {};

  for (const scriptName of [
    "pack",
    "dist:mac",
    "dist:mac:arm64",
    "dist:mac:x64",
    "dist:win",
    "dist:win:portable",
    "release:mac",
    "release:win"
  ]) {
    assert.match(
      scripts[scriptName] ?? "",
      /node scripts\/clean-release\.cjs/,
      `${scriptName} should remove stale release artifacts before running electron-builder`
    );
  }

  for (const [scriptName, platform] of [
    ["dist:mac", "mac"],
    ["dist:mac:arm64", "mac"],
    ["dist:mac:x64", "mac"],
    ["dist:win", "win"],
    ["release:mac", "mac"],
    ["release:win", "win"]
  ] as const) {
    assert.match(
      scripts[scriptName] ?? "",
      new RegExp(`node scripts/verify-release-output\\.cjs ${platform}`),
      `${scriptName} should verify ${platform} updater metadata before treating the build as releasable`
    );
  }

  assert.match(
    workflowSource,
    /node scripts\/clean-release\.cjs/,
    "desktop workflow should clear the release output directory before packaging"
  );
  assert.match(
    workflowSource,
    /node scripts\/verify-release-output\.cjs win/,
    "windows workflow should verify latest.yml against the current package version"
  );
  assert.match(
    workflowSource,
    /node scripts\/verify-release-output\.cjs mac/,
    "macOS workflow should verify latest-mac.yml against the current package version"
  );
});

test("windows installer artifact naming stays aligned with updater metadata", () => {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const verifyScriptPath = path.join(
    process.cwd(),
    "scripts",
    "verify-release-output.cjs"
  );

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    build?: {
      nsis?: {
        artifactName?: string;
      };
    };
  };
  const verifyScriptSource = fs.readFileSync(verifyScriptPath, "utf8");

  assert.equal(
    packageJson.build?.nsis?.artifactName,
    "LiteLauncher-Setup-${version}.${ext}",
    "NSIS artifactName should match the safe GitHub updater asset naming so local builds and latest.yml stay aligned"
  );
  assert.match(
    verifyScriptSource,
    /const localArtifactPath = path\.join\(releaseDir, metadataPathValue\);/,
    "release verification should resolve the local artifact path from updater metadata"
  );
  assert.match(
    verifyScriptSource,
    /fs\.existsSync\(localArtifactPath\)/,
    "release verification should fail when updater metadata points at a missing local artifact"
  );
});

test("validatePinnedItemRequest rejects empty ids and ids missing from the catalog", () => {
  assert.deepEqual(
    validatePinnedItemRequest("   ", new Set(["app:startapp:codex"])),
    {
      ok: false,
      normalizedId: "",
      reason: "empty-item-id"
    }
  );

  assert.deepEqual(
    validatePinnedItemRequest("app:startapp:missing", new Set(["app:startapp:codex"])),
    {
      ok: false,
      normalizedId: "app:startapp:missing",
      reason: "missing-catalog-item"
    }
  );
});

test("validatePinnedItemRequest accepts ids present in the catalog", () => {
  assert.deepEqual(
    validatePinnedItemRequest("  app:startapp:codex  ", new Set(["app:startapp:codex"])),
    {
      ok: true,
      normalizedId: "app:startapp:codex"
    }
  );
});

test("validatePinnedItemRequest accepts dynamically resolved Windows Store app ids", () => {
  const dynamicCodexItem: LaunchItem = {
    id: "app:startapp:codex",
    type: "application",
    title: "Codex",
    subtitle:
      "C:\\Program Files\\WindowsApps\\OpenAI.Codex_26.527.7698.0_x64__2p2nqsd0c76g0\\app\\resources\\codex.exe",
    target: `command:apps-folder:${encodeURIComponent("OpenAI.Codex_2p2nqsd0c76g0!App")}`,
    keywords: ["codex", "windowsapps"]
  };

  assert.deepEqual(
    validatePinnedItemRequest(
      "  app:startapp:codex  ",
      new Set(["app:C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Google Chrome.lnk"]),
      dynamicCodexItem
    ),
    {
      ok: true,
      normalizedId: "app:startapp:codex",
      hydratedItem: dynamicCodexItem
    }
  );
});

test("validatePinnedItemRequest accepts hydrated path-alias items when the live result is newer than the catalog", () => {
  const dynamicAliasItem: LaunchItem = {
    id: "app:path-alias:codex",
    type: "application",
    title: "Codex",
    subtitle:
      "C:\\Program Files\\WindowsApps\\OpenAI.Codex_26.601.2237.0_x64__2p2nqsd0c76g0\\app\\resources\\codex.exe",
    target:
      "C:\\Program Files\\WindowsApps\\OpenAI.Codex_26.601.2237.0_x64__2p2nqsd0c76g0\\app\\resources\\codex.exe",
    keywords: ["codex", "path", "alias", "windowsapps"]
  };

  assert.deepEqual(
    validatePinnedItemRequest(
      "app:path-alias:codex",
      new Set(["app:startapp:codex"]),
      dynamicAliasItem
    ),
    {
      ok: true,
      normalizedId: "app:path-alias:codex",
      hydratedItem: dynamicAliasItem
    }
  );
});

test("validatePinnedItemRequest keeps path-alias hydration scoped to the live result instead of requiring catalog persistence", () => {
  const liveAliasItem: LaunchItem = {
    id: "app:path-alias:codex",
    type: "application",
    title: "Codex",
    subtitle:
      "C:\\Program Files\\WindowsApps\\OpenAI.Codex_26.601.2237.0_x64__2p2nqsd0c76g0\\app\\resources\\codex.exe",
    target:
      "C:\\Program Files\\WindowsApps\\OpenAI.Codex_26.601.2237.0_x64__2p2nqsd0c76g0\\app\\resources\\codex.exe",
    keywords: ["codex", "path", "alias", "windowsapps"]
  };

  const validated = validatePinnedItemRequest(
    "app:path-alias:codex",
    new Set(["app:startapp:codex"]),
    liveAliasItem
  );

  assert.equal(validated.ok, true);
  if (validated.ok) {
    assert.equal(validated.normalizedId, "app:path-alias:codex");
    assert.equal(validated.hydratedItem?.id, "app:path-alias:codex");
  }
});

test(
  "main launcher flow keeps settings and visible plugin search/execution stable",
  { concurrency: false },
  async () => {
    const originalVisible = getVisiblePluginIds();
    try {
      setVisiblePluginIds(["webtools-json"]);

      const catalog = buildCatalogForRegression();
      const usage = new UsageStore();

      const settingsResults = searchItems("settings", catalog, usage, 10, {
        scope: "all"
      });
      const settingsItem = findTarget(settingsResults, "command:settings");
      assert.ok(settingsItem, "settings command should be searchable");

      const pluginResults = searchItems("json", catalog, usage, 10, {
        scope: "plugin"
      });
      assert.ok(pluginResults.length >= 1, "json plugin should be searchable in plugin scope");
      const jsonPluginItem = findTarget(pluginResults, "command:plugin:webtools-json");
      assert.ok(jsonPluginItem, "json plugin target should exist");

      const hiddenPluginResults = searchItems("cron", catalog, usage, 10, {
        scope: "plugin"
      });
      assert.equal(
        hiddenPluginResults.some((item) =>
          item.target.trim().toLowerCase().startsWith("command:plugin:webtools-cron")
        ),
        false,
        "hidden plugins should not appear in search results"
      );

      const settingsWindow = createMockWindow();
      const settingsExecuteResult = await executeItem(
        settingsItem as LaunchItem,
        settingsWindow.window as never
      );
      assert.equal(settingsExecuteResult.ok, true);
      assert.equal(settingsExecuteResult.keepOpen, true);
      assert.deepEqual(settingsWindow.sent[0], {
        channel: IPC_CHANNELS.openPanel,
        payload: "settings"
      });

      const pluginWindow = createMockWindow();
      const pluginExecuteResult = await executeItem(
        jsonPluginItem as LaunchItem,
        pluginWindow.window as never
      );
      assert.equal(pluginExecuteResult.ok, true);
      assert.equal(pluginExecuteResult.keepOpen, true);
      assert.equal(pluginWindow.sent[0]?.channel, IPC_CHANNELS.openPanel);
      assert.equal(
        (pluginWindow.sent[0]?.payload as { panel?: string } | undefined)?.panel,
        "plugin"
      );
      assert.equal(
        (pluginWindow.sent[0]?.payload as { pluginId?: string } | undefined)?.pluginId,
        "webtools-json"
      );
    } finally {
      setVisiblePluginIds(originalVisible);
    }
  }
);
