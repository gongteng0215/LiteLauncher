const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const nativeRoot = path.join(projectRoot, "native", "litesnap-capture");
const addonSourcePath = path.join(nativeRoot, "src", "addon.cc");
const vendorIncludeDir = path.join(nativeRoot, "vendor", "node");
const vendorNodeLibPath = path.join(nativeRoot, "vendor", "win-x64", "node.lib");
const builtAddonPath = path.join(
  nativeRoot,
  "build",
  "Release",
  "litesnap_capture.node"
);
const distNativeDir = path.join(projectRoot, "dist", "native");
const activeManifestPath = path.join(distNativeDir, "litesnap-capture-manifest.json");
const HASHED_ADDON_PATTERN = /^litesnap-capture-([a-f0-9]{16})\.node$/;
const MANIFEST_SCHEMA_VERSION = 1;
const REQUIRED_EXPORTS = [
  "captureDisplayRect",
  "supportsLayeredWindowExclusion",
  "getWindowRectAtPoint",
  "scrollWindowAtPoint",
  "recognizeText"
];
const prebuiltAddonPath = path.join(
  nativeRoot,
  "prebuilt",
  "win-x64-electron-40.node"
);
const requireNativeBuild =
  process.argv.includes("--require") ||
  process.env.LITELAUNCHER_REQUIRE_NATIVE_CAPTURE === "1";
const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
const programFiles = process.env.ProgramFiles || "C:\\Program Files";
const windowsKitsRoot = path.join(programFilesX86, "Windows Kits", "10");

function resolveVcVars64PathViaVswhere(requireVcTools) {
  const vswherePath = path.join(
    programFilesX86,
    "Microsoft Visual Studio",
    "Installer",
    "vswhere.exe"
  );
  if (!fs.existsSync(vswherePath)) {
    return null;
  }

  const args = ["-latest", "-products", "*", "-property", "installationPath"];
  if (requireVcTools) {
    args.splice(
      3,
      0,
      "-requires",
      "Microsoft.VisualStudio.Component.VC.Tools.x86.x64"
    );
  }

  const result = spawnSync(vswherePath, args, {
    encoding: "utf8",
    windowsHide: true
  });
  if (result.status !== 0) {
    return null;
  }

  const installPath = String(result.stdout ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (!installPath) {
    return null;
  }

  const vcvarsPath = path.join(
    installPath,
    "VC",
    "Auxiliary",
    "Build",
    "vcvars64.bat"
  );
  return fs.existsSync(vcvarsPath) ? vcvarsPath : null;
}

function resolveVcVars64Path() {
  const viaVswhere =
    resolveVcVars64PathViaVswhere(true) ??
    resolveVcVars64PathViaVswhere(false);
  if (viaVswhere) {
    return viaVswhere;
  }

  const editions = ["BuildTools", "Community", "Professional", "Enterprise"];
  const years = ["2026", "2025", "2022", "2019", "18"];
  const roots = [programFilesX86, programFiles];
  const candidates = [];

  for (const root of roots) {
    for (const year of years) {
      for (const edition of editions) {
        candidates.push(
          path.join(
            root,
            "Microsoft Visual Studio",
            year,
            edition,
            "VC",
            "Auxiliary",
            "Build",
            "vcvars64.bat"
          )
        );
      }
    }
  }

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function log(message) {
  console.info(`[build-native] ${message}`);
}

function fail(message) {
  console.error(`[build-native] ${message}`);
  process.exit(1);
}

function finishOptionalSkip(message) {
  log(message);
  process.exit(0);
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function readActiveManifest() {
  try {
    const parsed = JSON.parse(fs.readFileSync(activeManifestPath, "utf8"));
    if (
      parsed?.schemaVersion !== MANIFEST_SCHEMA_VERSION ||
      typeof parsed.fileName !== "string" ||
      !HASHED_ADDON_PATTERN.test(parsed.fileName) ||
      typeof parsed.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(parsed.sha256) ||
      typeof parsed.fingerprint !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isManifestAddonValid(manifest, expectedFingerprint) {
  if (!manifest || manifest.fingerprint !== expectedFingerprint) {
    return false;
  }
  const addonPath = path.join(distNativeDir, manifest.fileName);
  if (!fs.existsSync(addonPath) || fs.statSync(addonPath).size <= 0) {
    return false;
  }
  return sha256File(addonPath) === manifest.sha256;
}

function computeBuildFingerprint(vcVars64PathValue, windowsSdkVersion) {
  const hash = crypto.createHash("sha256");
  const inputs = [
    addonSourcePath,
    path.join(nativeRoot, "src", "win_delay_load_hook.cc"),
    path.join(vendorIncludeDir, "node_api.h"),
    path.join(vendorIncludeDir, "js_native_api.h")
  ];
  for (const inputPath of inputs) {
    hash.update(path.relative(projectRoot, inputPath));
    hash.update(fs.readFileSync(inputPath));
  }
  const nodeLibStat = fs.statSync(vendorNodeLibPath);
  hash.update(JSON.stringify({
    arch: process.arch,
    napi: Number(process.versions.napi ?? 0),
    vcVars64Path: path.normalize(vcVars64PathValue),
    windowsSdkVersion,
    nodeLibSize: nodeLibStat.size,
    nodeLibMtimeMs: Math.round(nodeLibStat.mtimeMs),
    compiler: "cl:/EHsc:/std:c++17:/GR-:/W3",
    linker: "delayimp:user32:gdi32:dwmapi:WindowsApp"
  }));
  return hash.digest("hex");
}

function writeActiveManifest(manifest) {
  fs.mkdirSync(distNativeDir, { recursive: true });
  const temporaryPath = `${activeManifestPath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  fs.renameSync(temporaryPath, activeManifestPath);
}

function cleanupHashedAddons(activeFileName) {
  const candidates = fs
    .readdirSync(distNativeDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && HASHED_ADDON_PATTERN.test(entry.name))
    .map((entry) => ({
      name: entry.name,
      path: path.join(distNativeDir, entry.name),
      mtimeMs: fs.statSync(path.join(distNativeDir, entry.name)).mtimeMs
    }))
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
  const keep = new Set([activeFileName]);
  const fallback = candidates.find((candidate) => candidate.name !== activeFileName);
  if (fallback) {
    keep.add(fallback.name);
  }
  for (const candidate of candidates) {
    if (keep.has(candidate.name)) {
      continue;
    }
    try {
      fs.unlinkSync(candidate.path);
      log(`removed stale ${path.relative(projectRoot, candidate.path)}`);
    } catch (error) {
      log(`could not remove stale ${path.relative(projectRoot, candidate.path)}: ${error.code ?? error}`);
    }
  }
}

function publishAddon(sourcePath, fingerprint, reason) {
  fs.mkdirSync(distNativeDir, { recursive: true });
  const sha256 = sha256File(sourcePath);
  const fileName = `litesnap-capture-${sha256.slice(0, 16)}.node`;
  const destinationPath = path.join(distNativeDir, fileName);
  if (!fs.existsSync(destinationPath) || sha256File(destinationPath) !== sha256) {
    fs.copyFileSync(sourcePath, destinationPath);
  }
  writeActiveManifest({
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    fileName,
    sha256,
    fingerprint,
    napiVersion: Number(process.versions.napi ?? 0),
    arch: process.arch,
    requiredExports: REQUIRED_EXPORTS,
    builtAt: new Date().toISOString()
  });
  log(`${reason} published ${path.relative(projectRoot, destinationPath)}`);
  cleanupHashedAddons(fileName);
}

function publishPrebuiltAddon(reason) {
  if (!fs.existsSync(prebuiltAddonPath)) {
    return false;
  }
  publishAddon(
    prebuiltAddonPath,
    `prebuilt:${sha256File(prebuiltAddonPath)}`,
    `${reason} Using checked-in prebuilt addon.`
  );
  return true;
}

function getLatestWindowsSdkVersion() {
  const libRoot = path.join(windowsKitsRoot, "Lib");
  if (!fs.existsSync(libRoot)) {
    return null;
  }

  const versions = fs
    .readdirSync(libRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => /^\d+\.\d+\.\d+\.\d+$/.test(name))
    .sort((left, right) =>
      left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" })
    );

  return versions.at(-1) ?? null;
}

function buildWithCl(vcVars64PathValue, windowsSdkVersion) {
  const releaseDir = path.join(nativeRoot, "build", "Release");
  const hookSourcePath = path.join(nativeRoot, "src", "win_delay_load_hook.cc");
  const addonObjPath = path.join(releaseDir, "addon.obj");
  const hookObjPath = path.join(releaseDir, "win_delay_load_hook.obj");
  const buildBatchPath = path.join(nativeRoot, ".build-native.cmd");
  // C++/WinRT projection headers (winrt/Windows.Media.Ocr.h etc.) live in the
  // Windows SDK cppwinrt include directory. It is not always on the default
  // INCLUDE that vcvars64.bat exports, so add it explicitly.
  const cppWinrtIncludeDir = path.join(
    windowsKitsRoot,
    "Include",
    windowsSdkVersion.replace(/\\$/, ""),
    "cppwinrt"
  );
  const buildBatchContents = [
    `@call "${vcVars64PathValue}"`,
    `if not exist "${releaseDir}" mkdir "${releaseDir}"`,
    "cl /nologo /c /EHsc /std:c++17 /GR- /W3 ^",
    "  /DWIN32 /D_WINDOWS /D_CRT_SECURE_NO_WARNINGS /D_SILENCE_EXPERIMENTAL_COROUTINE_DEPRECATION_WARNINGS /DBUILDING_NODE_EXTENSION /DNODE_GYP_MODULE_NAME=litesnap_capture ^",
    `  /I"${vendorIncludeDir}" ^`,
    `  /I"${cppWinrtIncludeDir}" ^`,
    `  /Fo"${addonObjPath}" ^`,
    `  "${addonSourcePath}"`,
    "if errorlevel 1 exit /b %errorlevel%",
    "cl /nologo /c /EHsc /std:c++17 /GR- /W3 ^",
    "  /DWIN32 /D_WINDOWS /D_CRT_SECURE_NO_WARNINGS /DHOST_BINARY=\\\"node.exe\\\" ^",
    `  /Fo"${hookObjPath}" ^`,
    `  "${hookSourcePath}"`,
    "if errorlevel 1 exit /b %errorlevel%",
    "link /nologo /DLL ^",
    `  /OUT:"${builtAddonPath}" ^`,
    `  "${addonObjPath}" ^`,
    `  "${hookObjPath}" ^`,
    "  delayimp.lib /DELAYLOAD:node.exe /ignore:4199 ^",
    `  user32.lib gdi32.lib dwmapi.lib WindowsApp.lib "${vendorNodeLibPath}"`,
    "if errorlevel 1 exit /b %errorlevel%",
    ""
  ].join("\r\n");

  try {
    fs.writeFileSync(buildBatchPath, buildBatchContents, "utf8");
    return spawnSync("cmd.exe", ["/d", "/c", buildBatchPath], {
      cwd: nativeRoot,
      stdio: "inherit",
      env: {
        ...process.env,
        WindowsSDKDir: `${windowsKitsRoot}\\`,
        WindowsSdkDir: `${windowsKitsRoot}\\`,
        WindowsSDKVersion: `${windowsSdkVersion}\\`,
        WindowsSdkVersion: `${windowsSdkVersion}\\`,
        UniversalCRTSdkDir: `${windowsKitsRoot}\\`,
        UCRTVersion: `${windowsSdkVersion}\\`
      },
      windowsHide: true
    });
  } finally {
    if (fs.existsSync(buildBatchPath)) {
      fs.unlinkSync(buildBatchPath);
    }
  }
}

if (process.platform !== "win32") {
  finishOptionalSkip("skipping native LiteSnap build on non-Windows platform");
}

if (!fs.existsSync(nativeRoot) || !fs.existsSync(addonSourcePath)) {
  if (requireNativeBuild) {
    fail("native/litesnap-capture source is missing");
  }
  finishOptionalSkip("native/litesnap-capture source is missing; skipping optional build");
}

if (!fs.existsSync(path.join(vendorIncludeDir, "node_api.h"))) {
  if (requireNativeBuild) {
    fail("native/litesnap-capture vendor N-API headers are missing");
  }
  finishOptionalSkip("native/litesnap-capture vendor headers are missing; skipping optional native build");
}

if (!fs.existsSync(vendorNodeLibPath)) {
  if (requireNativeBuild) {
    fail("native/litesnap-capture vendor node.lib is missing");
  }
  finishOptionalSkip("native/litesnap-capture vendor node.lib is missing; skipping optional native build");
}

const vcVars64Path = resolveVcVars64Path();
const windowsSdkVersion = getLatestWindowsSdkVersion();
if (!vcVars64Path || !windowsSdkVersion) {
  if (publishPrebuiltAddon("VS/Windows SDK environment is incomplete.")) {
    process.exit(0);
  }
  if (requireNativeBuild) {
    fail(
      `Visual Studio or Windows SDK environment is incomplete. vcvars64=${vcVars64Path ?? "missing"} sdk=${windowsSdkVersion ?? "missing"}`
    );
  }
  finishOptionalSkip("VS/Windows SDK environment is incomplete; skipping optional native build");
}

const buildFingerprint = computeBuildFingerprint(vcVars64Path, windowsSdkVersion);
const currentManifest = readActiveManifest();
if (isManifestAddonValid(currentManifest, buildFingerprint)) {
  log(`native inputs unchanged; using ${currentManifest.fileName}`);
  cleanupHashedAddons(currentManifest.fileName);
  process.exit(0);
}

log(`using vcvars64 at ${vcVars64Path}`);
log(`using Windows SDK ${windowsSdkVersion}`);
log("building LiteSnap native capture addon with cl.exe");
const result = buildWithCl(vcVars64Path, windowsSdkVersion);

if (result.status !== 0) {
  fail(
    `native build failed with exit code ${result.status ?? 1}; refusing to publish a stale native addon`
  );
}

if (!fs.existsSync(builtAddonPath)) {
  if (publishPrebuiltAddon("Native compile produced no output.")) {
    process.exit(0);
  }
  if (requireNativeBuild) {
    fail("native build finished without producing build/Release/litesnap_capture.node");
  }
  finishOptionalSkip("native build completed without an addon output; keeping Electron fallback");
}

publishAddon(builtAddonPath, buildFingerprint, "Native build succeeded;");
