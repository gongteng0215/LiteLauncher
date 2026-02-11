const fs = require("node:fs");
const path = require("node:path");

const TEXT_EXTENSIONS = new Set([
  ".md",
  ".ts",
  ".tsx",
  ".js",
  ".cjs",
  ".json",
  ".css",
  ".html"
]);

const ROOTS = ["docs", "scripts", "src"];
const decoder = new TextDecoder("utf-8", { fatal: true });

function shouldSkipDirectory(name) {
  return name === "dist" || name === "node_modules" || name === ".git";
}

function walkFiles(baseDir, result) {
  if (!fs.existsSync(baseDir)) {
    return;
  }

  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(baseDir, entry.name);
    if (entry.isDirectory()) {
      if (shouldSkipDirectory(entry.name)) {
        continue;
      }
      walkFiles(fullPath, result);
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (TEXT_EXTENSIONS.has(extension)) {
      result.push(fullPath);
    }
  }
}

function checkUtf8(filePath) {
  const buffer = fs.readFileSync(filePath);

  try {
    const content = decoder.decode(buffer);
    if (content.includes("\uFFFD")) {
      return {
        ok: false,
        reason: "contains replacement character U+FFFD"
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error)
    };
  }
}

function main() {
  const files = [];
  for (const root of ROOTS) {
    walkFiles(path.resolve(process.cwd(), root), files);
  }

  files.sort((a, b) => a.localeCompare(b));

  const failures = [];
  for (const filePath of files) {
    const result = checkUtf8(filePath);
    if (!result.ok) {
      failures.push({
        file: path.relative(process.cwd(), filePath),
        reason: result.reason
      });
    }
  }

  if (failures.length > 0) {
    console.error("[encoding] UTF-8 check failed:");
    for (const item of failures) {
      console.error(`- ${item.file}: ${item.reason}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`[encoding] OK: scanned ${files.length} text files (UTF-8)`);
}

main();
