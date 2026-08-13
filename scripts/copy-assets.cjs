const fs = require("fs");
const path = require("path");

const WATCH_MODE = process.argv.includes("--watch");
const WATCHED_RENDERER_FILES = new Set([
  "index.html",
  "styles.css",
  "styles-theme.css",
  "styles-foundation.css",
  "styles-app-shell.css",
  "styles-settings-unified.css",
  "styles-common-panels.css",
  "styles-feature-panels.css",
  "styles-command-center.css",
  "styles-plugin-theme-remaps.css",
  "litesnap-overlay.html",
  "litesnap-overlay.css",
  "litesnap-long-capture.html",
  "litesnap-long-capture-guide.html",
  "selection-popup.html",
  "selection-popup.css",
  "selection-backdrop.html"
]);
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

function patchDistEcdictFts() {
  if (process.env.LITELAUNCHER_SHIP_SLIM_DICTIONARY === "1") {
    console.info(
      "[copy-assets] skipping FTS patch (LITELAUNCHER_SHIP_SLIM_DICTIONARY=1)"
    );
    return;
  }
  const patchPath = path.join(__dirname, "patch-ecdict-fts.cjs");
  if (!fs.existsSync(patchPath)) {
    return;
  }
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const { patchEcdictFts } = require(patchPath);
  if (typeof patchEcdictFts === "function") {
    patchEcdictFts(path.join("dist", "assets", "ecdict.db"));
  }
}

function copyAllAssets() {
  require("./generate-plugin-theme-remaps.cjs");

  const filesToCopy = [
    ["src/renderer/index.html", "dist/renderer/index.html"],
    ["src/renderer/styles.css", "dist/renderer/styles.css"],
    ["src/renderer/styles-theme.css", "dist/renderer/styles-theme.css"],
    ["src/renderer/styles-foundation.css", "dist/renderer/styles-foundation.css"],
    ["src/renderer/styles-app-shell.css", "dist/renderer/styles-app-shell.css"],
    ["src/renderer/styles-settings-unified.css", "dist/renderer/styles-settings-unified.css"],
    ["src/renderer/styles-common-panels.css", "dist/renderer/styles-common-panels.css"],
    ["src/renderer/styles-feature-panels.css", "dist/renderer/styles-feature-panels.css"],
    ["src/renderer/styles-command-center.css", "dist/renderer/styles-command-center.css"],
    ["src/renderer/styles-plugin-theme-remaps.css", "dist/renderer/styles-plugin-theme-remaps.css"],
    ["src/renderer/litesnap-overlay.html", "dist/renderer/litesnap-overlay.html"],
    ["src/renderer/litesnap-overlay.css", "dist/renderer/litesnap-overlay.css"],
    ["src/renderer/litesnap-long-capture.html", "dist/renderer/litesnap-long-capture.html"],
    ["src/renderer/litesnap-long-capture-guide.html", "dist/renderer/litesnap-long-capture-guide.html"],
    ["src/renderer/selection-popup.html", "dist/renderer/selection-popup.html"],
    ["src/renderer/selection-popup.css", "dist/renderer/selection-popup.css"],
    ["src/renderer/selection-backdrop.html", "dist/renderer/selection-backdrop.html"]
  ];

  for (const [src, dest] of filesToCopy) {
    copyFile(src, dest);
  }

  copyDirIfExists("src/assets", "dist/assets");
  patchDistEcdictFts();
  writeImagePromptDataScript();
}

function writeImagePromptDataScript() {
  const builderPath = path.join(process.cwd(), "dist/shared/image-prompt-builder.js");
  if (!fs.existsSync(builderPath)) {
    return;
  }

  delete require.cache[require.resolve(builderPath)];
  const builder = require(builderPath);
  if (
    typeof builder.getImagePromptProductTemplates !== "function" ||
    typeof builder.getImagePromptOptionGroups !== "function" ||
    typeof builder.getImagePromptStylePresets !== "function" ||
    typeof builder.getImagePromptSmartTemplates !== "function" ||
    typeof builder.getImagePromptTextOptions !== "function"
  ) {
    return;
  }
  const productId = "chatgpt-images-2";
  const data = {
    products: builder.getImagePromptProductTemplates(),
    optionGroups: builder.getImagePromptOptionGroups(productId),
    stylePresets: builder.getImagePromptStylePresets(productId),
    smartTemplates: builder.getImagePromptSmartTemplates(productId),
    textOptions: builder.getImagePromptTextOptions()
  };
  const output = `window.__LL_IMAGE_PROMPT_DATA__ = ${JSON.stringify(data, null, 2)};\n`;
  copyFileFromText(output, path.join("dist/renderer/image-prompt-data.js"));
}

function copyFileFromText(content, dest) {
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, content, "utf8");
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
  const imagePromptDataTimer = setInterval(() => {
    const targetPath = path.join("dist/renderer/image-prompt-data.js");
    if (fs.existsSync(targetPath)) {
      clearInterval(imagePromptDataTimer);
      return;
    }
    writeImagePromptDataScript();
  }, 250);

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
      if (relativePath.replace(/\\/g, "/").endsWith("ecdict.db")) {
        patchDistEcdictFts();
      }
      scheduleWatchLog(`asset updated: ${filename || "."}`);
    });
  }

  watchPath("dist/shared", {}, (_eventType, filename) => {
    if (filename !== "image-prompt-builder.js") {
      return;
    }
    writeImagePromptDataScript();
    scheduleWatchLog("renderer updated: image-prompt-data.js");
  });

  const cleanup = () => {
    clearInterval(imagePromptDataTimer);
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
