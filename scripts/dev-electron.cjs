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
let initialStartAttempted = false;
let restartTimer = null;
let readinessInterval = null;
let distWatcher = null;
let restartInFlight = null;
let restartRequested = false;
let queuedRestartReason = "";
const terminationTasks = new WeakMap();

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

  const existing = terminationTasks.get(child);
  if (existing) {
    return existing;
  }

  const task = new Promise((resolve) => {
    const done = () => resolve();
    child.once("exit", done);

    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore"
      });
      killer.once("exit", () => {
        setTimeout(resolve, 450);
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
  terminationTasks.set(child, task);
  void task.finally(() => terminationTasks.delete(child));
  return task;
}

function startElectron() {
  if (shuttingDown || electronProcess || !isBundleReady()) {
    return;
  }
  initialStartAttempted = true;

  const electronEnv = {
    ...process.env,
    NODE_ENV: "development",
    LITELAUNCHER_DEV: "1",
    ELECTRON_DISABLE_CRASH_REPORTER: "1"
  };
  delete electronEnv.ELECTRON_RUN_AS_NODE;

  log("starting Electron");
  // Dev restarts are managed by killing the old process tree and spawning a
  // fresh instance. --replace-instance would make the running copy relaunch
  // itself while dev-electron also spawns another copy, causing a restart loop
  // and transient SQLite "database is locked / not open" bootstrap failures.
  electronProcess = spawn(electronBinary, ["."], {
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
    // A spawn failure is different from Electron exiting normally. Allow the
    // readiness loop to retry once the executable/files become available.
    initialStartAttempted = false;
  });
}

async function restartElectron(reason) {
  if (shuttingDown || !isBundleReady()) {
    return;
  }

  if (restartInFlight) {
    restartRequested = true;
    queuedRestartReason = reason;
    return restartInFlight;
  }

  restartInFlight = (async () => {
    let currentReason = reason;
    do {
      restartRequested = false;
      if (shuttingDown || !isBundleReady()) {
        return;
      }
      if (!electronProcess) {
        log(`bundle changed (${currentReason}), starting Electron`);
        startElectron();
      } else {
        log(`bundle changed (${currentReason}), restarting Electron`);
        pendingRestart = true;
        await terminateProcessTree(electronProcess);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      currentReason = queuedRestartReason || currentReason;
      queuedRestartReason = "";
    } while (restartRequested);
  })().finally(() => {
    restartInFlight = null;
  });
  return restartInFlight;
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
  if (
    normalized.endsWith(".map") ||
    normalized.endsWith(".d.ts") ||
    normalized.endsWith(".tsbuildinfo")
  ) {
    return false;
  }

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
    if (!initialStartAttempted) {
      startElectron();
    }
  }, 250);
}

async function shutdown() {
  shuttingDown = true;
  restartRequested = false;
  queuedRestartReason = "";
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
