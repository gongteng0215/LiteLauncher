const { spawn } = require("child_process");
const path = require("path");

const electronBinary = require("electron");
const projectRoot = path.resolve(__dirname, "..");

function buildElectronEnv(baseEnv = process.env) {
  const env = {};
  for (const [key, value] of Object.entries(baseEnv)) {
    if (typeof value === "string" && key !== "ELECTRON_RUN_AS_NODE") {
      env[key] = value;
    }
  }

  env.ELECTRON_DISABLE_CRASH_REPORTER = "1";
  return env;
}

function buildSpawnOptions(baseEnv = process.env) {
  if (process.platform === "win32") {
    return {
      cwd: projectRoot,
      env: buildElectronEnv(baseEnv),
      detached: true,
      stdio: "ignore",
      windowsHide: true
    };
  }

  return {
    cwd: projectRoot,
    env: buildElectronEnv(baseEnv),
    stdio: "inherit",
    windowsHide: true
  };
}

function launchElectron(spawnImpl = spawn, baseEnv = process.env) {
  const child = spawnImpl(electronBinary, [".", "--replace-instance"], buildSpawnOptions(baseEnv));
  if (process.platform === "win32" && typeof child.unref === "function") {
    child.unref();
  }
  return child;
}

if (require.main === module) {
  launchElectron();
  if (process.platform === "win32") {
    console.info("[start] LiteLauncher 已启动到后台，可用 Alt+Space 或托盘图标唤起。");
  }
}

module.exports = {
  buildElectronEnv,
  launchElectron
};
