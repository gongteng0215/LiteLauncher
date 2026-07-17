/**
 * electron-builder afterPack hook.
 *
 * Windows packaging keeps signAndEditExecutable=false to avoid winCodeSign
 * symlink privilege failures on developer machines. That also skips embedding
 * the app icon into LiteLauncher.exe, so Explorer shows the default Electron
 * atom. This hook applies src/assets/icon.ico via standalone rcedit.
 */
const fs = require("fs");
const path = require("path");
const https = require("https");
const { spawnSync } = require("child_process");

const RCEDIT_URL =
  "https://github.com/electron/rcedit/releases/download/v2.0.0/rcedit-x64.exe";
const RCEDIT_PATH = path.join(__dirname, "vendor", "rcedit-x64.exe");
const ICON_PATH = path.join(__dirname, "..", "src", "assets", "icon.ico");

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const file = fs.createWriteStream(dest);
    const request = (currentUrl) => {
      https
        .get(currentUrl, (response) => {
          if (
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            response.resume();
            request(response.headers.location);
            return;
          }
          if (response.statusCode !== 200) {
            reject(new Error(`download failed: HTTP ${response.statusCode}`));
            response.resume();
            return;
          }
          response.pipe(file);
          file.on("finish", () => {
            file.close(() => resolve());
          });
        })
        .on("error", (error) => {
          fs.unlink(dest, () => reject(error));
        });
    };
    request(url);
  });
}

async function ensureRcedit() {
  if (fs.existsSync(RCEDIT_PATH) && fs.statSync(RCEDIT_PATH).size > 100000) {
    return RCEDIT_PATH;
  }
  console.info("[after-pack-win-icon] downloading rcedit-x64.exe …");
  await downloadFile(RCEDIT_URL, RCEDIT_PATH);
  return RCEDIT_PATH;
}

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "win32") {
    return;
  }

  const exeName = `${context.packager.appInfo.productFilename}.exe`;
  const exePath = path.join(context.appOutDir, exeName);
  if (!fs.existsSync(exePath)) {
    console.warn(`[after-pack-win-icon] exe not found: ${exePath}`);
    return;
  }
  if (!fs.existsSync(ICON_PATH)) {
    console.warn(`[after-pack-win-icon] icon not found: ${ICON_PATH}`);
    return;
  }

  const rcedit = await ensureRcedit();
  const result = spawnSync(rcedit, [exePath, "--set-icon", ICON_PATH], {
    encoding: "utf8"
  });
  if (result.status !== 0) {
    console.warn(
      "[after-pack-win-icon] rcedit failed",
      result.stderr || result.stdout || result.error
    );
    return;
  }
  console.info(`[after-pack-win-icon] applied icon to ${exePath}`);
};
