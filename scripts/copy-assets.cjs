const fs = require("fs");
const path = require("path");

const WATCH_MODE = process.argv.includes("--watch");
const WATCHED_RENDERER_FILES = new Set(["index.html", "styles.css"]);
const activeWatchers = [];
let watchLogTimer = null;
const pendingWatchLogs = new Set();

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDirIfExists(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    return;
  }

  ensureDir(destDir);
  fs.cpSync(srcDir, destDir, { recursive: true, force: true });
}

function removePathIfExists(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return;
  }
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function copyRendererFile(relativePath) {
  if (!WATCHED_RENDERER_FILES.has(relativePath)) {
    return;
  }
  copyFile(path.join("src/renderer", relativePath), path.join("dist/renderer", relativePath));
}

function copyAssetPath(relativePath) {
  if (!relativePath) {
    copyDirIfExists("src/assets", "dist/assets");
    return;
  }

  const normalized = relativePath.replace(/[\\/]+/g, path.sep);
  const sourcePath = path.join("src/assets", normalized);
  const destinationPath = path.join("dist/assets", normalized);

  if (!fs.existsSync(sourcePath)) {
    removePathIfExists(destinationPath);
    return;
  }

  const stats = fs.statSync(sourcePath);
  if (stats.isDirectory()) {
    copyDirIfExists(sourcePath, destinationPath);
    return;
  }

  copyFile(sourcePath, destinationPath);
}

function copyAllAssets() {
  const filesToCopy = [
    ["src/renderer/index.html", "dist/renderer/index.html"],
    ["src/renderer/styles.css", "dist/renderer/styles.css"]
  ];

  for (const [src, dest] of filesToCopy) {
    copyFile(src, dest);
  }

  copyDirIfExists("src/assets", "dist/assets");
}

function scheduleWatchLog(message) {
  pendingWatchLogs.add(message);
  if (watchLogTimer !== null) {
    return;
  }

  watchLogTimer = setTimeout(() => {
    watchLogTimer = null;
    for (const entry of pendingWatchLogs) {
      console.info(`[copy-assets] ${entry}`);
    }
    pendingWatchLogs.clear();
  }, 60);
}

function watchPath(targetPath, options, onChange) {
  if (!fs.existsSync(targetPath)) {
    return;
  }

  const watcher = fs.watch(targetPath, options, (eventType, filename) => {
    try {
      onChange(eventType, filename ? String(filename) : "");
    } catch (error) {
      console.warn("[copy-assets] watch handler failed", error);
    }
  });
  activeWatchers.push(watcher);
}

function startWatchMode() {
  console.info("[copy-assets] watch mode started");

  watchPath("src/renderer", {}, (_eventType, filename) => {
    const relativePath = filename.replace(/\\/g, "/");
    if (!WATCHED_RENDERER_FILES.has(relativePath)) {
      return;
    }
    copyRendererFile(relativePath);
    scheduleWatchLog(`renderer updated: ${relativePath}`);
  });

  if (fs.existsSync("src/assets")) {
    watchPath("src/assets", { recursive: true }, (_eventType, filename) => {
      const relativePath = filename.replace(/\\/g, path.sep);
      copyAssetPath(relativePath);
      scheduleWatchLog(`asset updated: ${filename || "."}`);
    });
  }

  const cleanup = () => {
    while (activeWatchers.length > 0) {
      const watcher = activeWatchers.pop();
      watcher?.close();
    }
  };

  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });
}

function main() {
  copyAllAssets();

  if (!WATCH_MODE) {
    return;
  }

  startWatchMode();
}

main();
