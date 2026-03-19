const { spawn } = require("child_process");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const nodeCommand = process.execPath;

const children = [];
let shuttingDown = false;

function log(message) {
  console.info(`[dev] ${message}`);
}

function spawnChild(command, args, label, options = {}) {
  const child = spawn(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    shell: options.shell ?? false,
    env: {
      ...process.env,
      FORCE_COLOR: "1"
    }
  });

  child.once("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }
    log(`${label} exited code=${code ?? "null"} signal=${signal ?? "null"}`);
    void shutdown(code ?? 1);
  });

  child.once("error", (error) => {
    if (shuttingDown) {
      return;
    }
    log(`${label} failed: ${error.message}`);
    void shutdown(1);
  });

  children.push(child);
  return child;
}

function terminateChild(child) {
  return new Promise((resolve) => {
    if (!child || child.killed) {
      resolve();
      return;
    }

    child.once("exit", () => resolve());

    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore"
      });
      killer.once("exit", () => resolve());
      killer.once("error", () => resolve());
      return;
    }

    try {
      child.kill("SIGTERM");
    } catch {
      resolve();
    }
  });
}

async function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  const activeChildren = children.splice(0, children.length);
  await Promise.all(activeChildren.map((child) => terminateChild(child)));
  process.exit(exitCode);
}

process.on("SIGINT", () => {
  void shutdown(0);
});

process.on("SIGTERM", () => {
  void shutdown(0);
});

log("starting TypeScript watch, asset watch and Electron dev runner");
spawnChild("pnpm", ["exec", "tsc", "--watch", "--preserveWatchOutput"], "tsc", {
  shell: process.platform === "win32"
});
spawnChild(nodeCommand, [path.join("scripts", "copy-assets.cjs"), "--watch"], "copy-assets");
spawnChild(nodeCommand, [path.join("scripts", "dev-electron.cjs")], "electron");
