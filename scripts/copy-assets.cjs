const fs = require("fs");
const path = require("path");

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

function main() {
  const filesToCopy = [
    ["src/renderer/index.html", "dist/renderer/index.html"],
    ["src/renderer/styles.css", "dist/renderer/styles.css"]
  ];

  for (const [src, dest] of filesToCopy) {
    copyFile(src, dest);
  }

  copyDirIfExists("src/assets", "dist/assets");
}

main();
