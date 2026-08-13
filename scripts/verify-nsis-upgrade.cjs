const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const { launchE2ESession } = require("../dist/test/e2e-test-utils.js");

const projectRoot = path.resolve(__dirname, "..");
const baselineInstaller = path.resolve(
  process.argv[2] ||
    path.join(projectRoot, "artifacts", "release-baseline", "v1.1.12", "LiteLauncher-Setup-1.1.12.exe")
);
const candidateInstaller = path.resolve(
  process.argv[3] || path.join(projectRoot, "release", "LiteLauncher-Setup-1.1.14.exe")
);
const baselineVersion = process.argv[4] || "1.1.12";
const candidateVersion = process.argv[5] || "1.1.14";
const disposableRoot = fs.mkdtempSync(path.join(os.tmpdir(), "litelauncher-nsis-upgrade-"));
const installDir = path.join(disposableRoot, "app");
const userDataDir = path.join(disposableRoot, "user-data");
const executablePath = path.join(installDir, "LiteLauncher.exe");
const reportDir = path.join(projectRoot, "artifacts", "nsis-upgrade");
const reportPath = path.join(reportDir, `v${baselineVersion}-to-v${candidateVersion}.json`);

function runInstaller(installerPath) {
  assert.ok(fs.existsSync(installerPath), `missing installer: ${installerPath}`);
  fs.mkdirSync(installDir, { recursive: true });
  const result = spawnSync(installerPath, ["/S", `/D=${installDir}`], {
    cwd: projectRoot,
    encoding: "utf8",
    timeout: 240_000,
    windowsHide: true
  });
  if (result.error) throw result.error;
  assert.equal(
    result.status,
    0,
    `installer failed (${result.status}): ${result.stdout || ""}\n${result.stderr || ""}`
  );
  assert.ok(fs.existsSync(executablePath), `installed executable is missing: ${executablePath}`);
}

async function launchInstalled() {
  return launchE2ESession({
    executablePath,
    workingDirectory: installDir,
    userDataDir,
    cleanupUserDataDir: false
  });
}

async function seedBaseline() {
  const session = await launchInstalled();
  try {
    return await session.page.evaluate(async () => {
      const version = await window.launcher.getAppVersion();
      const settings = await window.launcher.setLiteSnapSettings({
        annotationColor: "#22c55e",
        annotationLineWidth: 37,
        annotationTextSize: 28,
        annotationTool: "arrow",
        annotationFillShapes: true,
        historyEnabled: true,
        historyMaxItems: 20
      });
      await window.launcher.liteSnapRecordRecentColor("#22c55e");
      await window.launcher.setUiThemeConfig(
        window.__LL_UI_THEME__?.fromAccent("#22c55e", window.__LL_UI_THEME__.DEFAULT) ?? {
          presetId: "custom",
          accent: "#22c55e"
        }
      );

      const started = await window.launcher.liteSnapStartCapture();
      if (!started) throw new Error("baseline LiteSnap capture did not start");
      let sourceReady = false;
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const source = await window.launcher.liteSnapEnsureSourceImage();
        if (source) {
          sourceReady = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (!sourceReady) throw new Error("baseline LiteSnap source image did not become ready");
      const state = await window.launcher.liteSnapGetOverlayState();
      if (!state) throw new Error("baseline LiteSnap overlay state is unavailable");
      const commit = await window.launcher.liteSnapCommitCapture({
        action: "copy",
        selection: {
          x: 8,
          y: 8,
          width: Math.max(state.selectionMinSize, Math.min(160, state.viewportWidth - 16)),
          height: Math.max(state.selectionMinSize, Math.min(100, state.viewportHeight - 16))
        }
      });
      if (!commit.ok) throw new Error(commit.message);
      const history = await window.launcher.liteSnapListHistory();
      return {
        version,
        settings: settings.settings,
        historyCount: history.length,
        historyId: history[0]?.id || null
      };
    });
  } finally {
    await session.close();
  }
}

async function verifyCandidate(expectedHistoryId) {
  const session = await launchInstalled();
  try {
    return await session.page.evaluate(async (historyId) => {
      const [version, settings, history, updater, theme] = await Promise.all([
        window.launcher.getAppVersion(),
        window.launcher.getLiteSnapSettings(),
        window.launcher.liteSnapListHistory(),
        window.launcher.getAppUpdaterStatus(),
        window.launcher.getUiThemeConfig()
      ]);
      return {
        version,
        settings: {
          annotationColor: settings.annotationColor,
          annotationLineWidth: settings.annotationLineWidth,
          annotationTextSize: settings.annotationTextSize,
          annotationTool: settings.annotationTool,
          annotationFillShapes: settings.annotationFillShapes,
          recentColors: settings.recentColors
        },
        historyCount: history.length,
        historyRetained: Boolean(historyId && history.some((item) => item.id === historyId)),
        updater: {
          supported: updater.supported,
          currentVersion: updater.currentVersion,
          phase: updater.phase
        },
        theme: {
          presetId: theme.presetId,
          accent: theme.accent
        }
      };
    }, expectedHistoryId);
  } finally {
    await session.close();
  }
}

function cleanupDisposableInstall() {
  const normalizedTemp = path.resolve(os.tmpdir()) + path.sep;
  const normalizedRoot = path.resolve(disposableRoot);
  assert.ok(
    normalizedRoot.startsWith(normalizedTemp) &&
      path.basename(normalizedRoot).startsWith("litelauncher-nsis-upgrade-"),
    `refusing to clean unexpected directory: ${normalizedRoot}`
  );
  const uninstallerPath = path.join(installDir, "Uninstall LiteLauncher.exe");
  if (fs.existsSync(uninstallerPath)) {
    spawnSync(uninstallerPath, ["/S"], {
      cwd: installDir,
      encoding: "utf8",
      timeout: 120_000,
      windowsHide: true
    });
  }
  fs.rmSync(normalizedRoot, { recursive: true, force: true });
}

async function main() {
  let baseline = null;
  let candidate = null;
  try {
    runInstaller(baselineInstaller);
    baseline = await seedBaseline();
    assert.equal(baseline.version, baselineVersion);
    assert.ok(baseline.historyCount >= 1, "baseline screenshot history was not created");

    runInstaller(candidateInstaller);
    candidate = await verifyCandidate(baseline.historyId);
    assert.equal(candidate.version, candidateVersion);
    assert.equal(candidate.settings.annotationColor, "#22c55e");
    assert.equal(candidate.settings.annotationLineWidth, 37);
    assert.equal(candidate.settings.annotationTextSize, 28);
    assert.equal(candidate.settings.annotationTool, "arrow");
    assert.equal(candidate.settings.annotationFillShapes, true);
    assert.ok(candidate.settings.recentColors.includes("#22c55e"));
    assert.equal(candidate.historyRetained, true);
    assert.ok(candidate.historyCount >= baseline.historyCount);
    assert.equal(candidate.updater.currentVersion, candidateVersion);
    assert.equal(candidate.theme.accent, "#22c55e");

    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          passed: true,
          baselineVersion,
          candidateVersion,
          baseline,
          candidate,
          verifiedAt: new Date().toISOString()
        },
        null,
        2
      ),
      "utf8"
    );
    console.info(`[nsis-upgrade] passed v${baselineVersion} -> v${candidateVersion}`);
    console.info(`[nsis-upgrade] report: ${reportPath}`);
  } finally {
    cleanupDisposableInstall();
  }
}

main().catch((error) => {
  console.error("[nsis-upgrade] failed", error);
  process.exitCode = 1;
});
