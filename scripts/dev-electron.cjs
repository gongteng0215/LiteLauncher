const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const distRoot = path.join(projectRoot, "dist");
const electronPackageDir = path.dirname(require.resolve("electron/package.json"));
const electronBinary =
  process.platform === "win32"
    ? path.join(electronPackageDir, "dist", "electron.exe")
    : process.platform === "darwin"
      ? path.join(
          electronPackageDir,
          "dist",
          "Electron.app",
          "Contents",
          "MacOS",
          "Electron"
        )
      : path.join(electronPackageDir, "dist", "electron");

let electronProcess = null;
let shuttingDown = false;
let pendingRestart = false;
let bundleReadyLogged = false;
let restartTimer = null;
let readinessInterval = null;
let distWatcher = null;

function isBundleReady() {
  return [
    path.join(distRoot, "main", "index.js"),
    path.join(distRoot, "preload", "index.js"),
    path.join(distRoot, "renderer", "index.html"),
    path.join(distRoot, "renderer", "styles.css"),
    path.join(distRoot, "renderer", "renderer.js")
  ].every((targetPath) => fs.existsSync(targetPath));
}

function log(message) {
  console.info(`[dev-electron] ${message}`);
}

function terminateProcessTree(child) {
  if (!child || child.killed) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const done = () => resolve();
    child.once("exit", done);

    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore"
      });
      killer.once("exit", () => {
        setTimeout(resolve, 120);
      });
      killer.once("error", () => {
        resolve();
      });
      return;
    }

    try {
      child.kill("SIGTERM");
    } catch {
      resolve();
    }
  });
}

function startElectron() {
  if (shuttingDown || electronProcess || !isBundleReady()) {
    return;
  }

  const electronEnv = {
    ...process.env,
    NODE_ENV: "development",
    LITELAUNCHER_DEV: "1",
    ELECTRON_DISABLE_CRASH_REPORTER: "1"
  };
  delete electronEnv.ELECTRON_RUN_AS_NODE;

  log("starting Electron");
  electronProcess = spawn(electronBinary, [".", "--replace-instance"], {
    cwd: projectRoot,
    stdio: "inherit",
    env: electronEnv
  });

  electronProcess.once("exit", (code, signal) => {
    const wasRestarting = pendingRestart;
    electronProcess = null;
    if (shuttingDown) {
      return;
    }

    if (wasRestarting) {
      pendingRestart = false;
      startElectron();
      return;
    }

    log(`Electron exited code=${code ?? "null"} signal=${signal ?? "null"}`);
  });

  electronProcess.once("error", (error) => {
    log(`failed to start Electron: ${error.message}`);
    electronProcess = null;
  });
}

async function restartElectron(reason) {
  if (shuttingDown || !isBundleReady()) {
    return;
  }

  if (!electronProcess) {
    log(`bundle changed (${reason}), starting Electron`);
    startElectron();
    return;
  }

  log(`bundle changed (${reason}), restarting Electron`);
  pendingRestart = true;
  await terminateProcessTree(electronProcess);
}

function scheduleRestart(reason) {
  if (restartTimer !== null) {
    clearTimeout(restartTimer);
  }
  restartTimer = setTimeout(() => {
    restartTimer = null;
    void restartElectron(reason);
  }, 120);
}

function shouldRestartForFile(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  return (
    normalized.startsWith("main/") ||
    normalized.startsWith("preload/") ||
    normalized.startsWith("shared/")
  );
}

function startWatchingDist() {
  if (!fs.existsSync(distRoot)) {
    fs.mkdirSync(distRoot, { recursive: true });
  }

  distWatcher = fs.watch(distRoot, { recursive: true }, (_eventType, filename) => {
    const relativePath = filename ? String(filename) : "";
    if (!relativePath || !shouldRestartForFile(relativePath)) {
      return;
    }
    scheduleRestart(relativePath.replace(/\\/g, "/"));
  });
}

function startReadinessLoop() {
  readinessInterval = setInterval(() => {
    if (!bundleReadyLogged && isBundleReady()) {
      bundleReadyLogged = true;
      log("bundle ready");
    }
    startElectron();
  }, 250);
}

async function shutdown() {
  shuttingDown = true;
  if (restartTimer !== null) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }
  if (readinessInterval !== null) {
    clearInterval(readinessInterval);
    readinessInterval = null;
  }
  if (distWatcher) {
    distWatcher.close();
    distWatcher = null;
  }
  if (electronProcess) {
    await terminateProcessTree(electronProcess);
    electronProcess = null;
  }
}

process.on("SIGINT", () => {
  void shutdown().finally(() => process.exit(0));
});

process.on("SIGTERM", () => {
  void shutdown().finally(() => process.exit(0));
});

startWatchingDist();
startReadinessLoop();
