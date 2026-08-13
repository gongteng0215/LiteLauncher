const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function log(step) {
  process.stdout.write(`[probe] ${step}\n`);
}

const nativeDirArgIndex = process.argv.indexOf("--native-dir");
const nativeDir = nativeDirArgIndex >= 0
  ? path.resolve(process.argv[nativeDirArgIndex + 1])
  : path.join(__dirname, "..", "dist", "native");
const manifestPath = path.join(nativeDir, "litesnap-capture-manifest.json");
let addonPath = path.join(nativeDir, "litesnap-capture.node");
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const candidate = path.join(nativeDir, path.basename(String(manifest.fileName ?? "")));
  const sha256 = fs.existsSync(candidate)
    ? crypto.createHash("sha256").update(fs.readFileSync(candidate)).digest("hex")
    : "";
  if (sha256 !== manifest.sha256) {
    log("manifest hash mismatch");
    process.exit(1);
  }
  addonPath = candidate;
}

log(`electron node ${process.versions.node} modules=${process.modulesVersion ?? process.versions.modules}`);
log(`addon exists=${fs.existsSync(addonPath)} path=${addonPath}`);

let addon;
try {
  log("before require");
  addon = require(addonPath);
  log(`after require keys=${Object.keys(addon).join(",")}`);
} catch (error) {
  log(`require error: ${error && error.stack ? error.stack : error}`);
  process.exit(1);
}

const requiredExports = [
  "captureDisplayRect",
  "supportsLayeredWindowExclusion",
  "getWindowRectAtPoint",
  "scrollWindowAtPoint",
  "recognizeText"
];
const missingExports = requiredExports.filter((name) => typeof addon[name] !== "function");
if (missingExports.length > 0) {
  log(`missing required exports=${missingExports.join(",")}`);
  process.exit(1);
}
if (addon.supportsLayeredWindowExclusion() !== true) {
  log("layered-window exclusion is unavailable");
  process.exit(1);
}

try {
  log("before capture");
  const result = addon.captureDisplayRect({
    x: 0,
    y: 0,
    captureWidth: 100,
    captureHeight: 100,
    outputWidth: 100,
    outputHeight: 100,
    includeLayeredWindows: false
  });
  log(
    `after capture ok=${Boolean(result)} size=${
      result ? `${result.width}x${result.height} bytes=${result.data?.length}` : "null"
    }`
  );
  if (result && result.data) {
    let alphaZero = 0;
    let nonBlack = 0;
    for (let i = 0; i < result.data.length; i += 4) {
      if (result.data[i + 3] === 0) alphaZero += 1;
      if (result.data[i] || result.data[i + 1] || result.data[i + 2]) nonBlack += 1;
    }
    log(`pixels alphaZero=${alphaZero} nonBlack=${nonBlack}`);
  }
} catch (error) {
  log(`capture error: ${error && error.stack ? error.stack : error}`);
  process.exit(1);
}

log("done");
process.exit(0);
