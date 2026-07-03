const fs = require("fs");
const path = require("path");
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
const distAddonPath = path.join(distNativeDir, "litesnap-capture.node");
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

function copyBuiltAddon() {
  fs.mkdirSync(distNativeDir, { recursive: true });
  try {
    fs.copyFileSync(builtAddonPath, distAddonPath);
  } catch (error) {
    if (error && error.code === "EBUSY") {
      const message =
        "dist/native/litesnap-capture.node is locked by a running LiteLauncher/Electron instance. Stop pnpm dev or close Electron before rebuilding the native addon.";
      if (
        fs.existsSync(distAddonPath) &&
        fs.statSync(distAddonPath).size > 0
      ) {
        log(
          `${message} Keeping the existing ${path.relative(projectRoot, distAddonPath)}.`
        );
        return;
      }
      if (requireNativeBuild) {
        fail(message);
      }
      finishOptionalSkip(`${message} Keeping the existing native addon.`);
    }
    throw error;
  }
  log(`published ${path.relative(projectRoot, distAddonPath)}`);
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
    "  /DWIN32 /D_WINDOWS /D_CRT_SECURE_NO_WARNINGS /DBUILDING_NODE_EXTENSION /DNODE_GYP_MODULE_NAME=litesnap_capture ^",
    `  /I"${vendorIncludeDir}" ^`,
    `  /I"${cppWinrtIncludeDir}" ^`,
    `  /Fo"${addonObjPath}" ^`,
    `  "${addonSourcePath}"`,
    "cl /nologo /c /EHsc /std:c++17 /GR- /W3 ^",
    "  /DWIN32 /D_WINDOWS /D_CRT_SECURE_NO_WARNINGS /DHOST_BINARY=\\\"node.exe\\\" ^",
    `  /Fo"${hookObjPath}" ^`,
    `  "${hookSourcePath}"`,
    "link /nologo /DLL ^",
    `  /OUT:"${builtAddonPath}" ^`,
    `  "${addonObjPath}" ^`,
    `  "${hookObjPath}" ^`,
    "  delayimp.lib /DELAYLOAD:node.exe /ignore:4199 ^",
    `  user32.lib gdi32.lib dwmapi.lib WindowsApp.lib "${vendorNodeLibPath}"`,
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
  if (requireNativeBuild) {
    fail(
      `Visual Studio or Windows SDK environment is incomplete. vcvars64=${vcVars64Path ?? "missing"} sdk=${windowsSdkVersion ?? "missing"}`
    );
  }
  finishOptionalSkip("VS/Windows SDK environment is incomplete; skipping optional native build");
}

log(`using vcvars64 at ${vcVars64Path}`);
log(`using Windows SDK ${windowsSdkVersion}`);
log("building LiteSnap native capture addon with cl.exe");
const result = buildWithCl(vcVars64Path, windowsSdkVersion);

if (result.status !== 0) {
  if (requireNativeBuild) {
    process.exit(result.status ?? 1);
  }
  finishOptionalSkip("native build failed; Electron fallback will remain active");
}

if (!fs.existsSync(builtAddonPath)) {
  if (requireNativeBuild) {
    fail("native build finished without producing build/Release/litesnap_capture.node");
  }
  finishOptionalSkip("native build completed without an addon output; keeping Electron fallback");
}

copyBuiltAddon();
