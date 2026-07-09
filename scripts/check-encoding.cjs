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
// Known mojibake fragments (UTF-8 Chinese misread as Latin-1), stored as escapes.
const MOJIBAKE_SEQUENCES = [
  "\u7035\u55DC\u721C", // 密码
  "\u59FF\u6C34\u5E36", // 桥接
  "\u7487\u71D5\u20AC", // 请选
  "\u95C0\u57CF\u5BB3", // 长度
  "\u9588\u71B5\u68FA", // image-prompt groups
  "\u6D5E\u5C6C\u7D93", // 从当前
  "\u7035\u55DC\u721C\u5DE5\u5177", // 密码工具
  "\u9588\u71B5\u61D0\u984F" // 人像角色 (mojibake variant)
];

const decoder = new TextDecoder("utf-8", { fatal: true });

function findMojibake(content) {
  for (const sequence of MOJIBAKE_SEQUENCES) {
    if (content.includes(sequence)) {
      return sequence;
    }
  }
  return null;
}

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

function checkUtf8(filePath, relativePath) {
  const buffer = fs.readFileSync(filePath);

  try {
    const content = decoder.decode(buffer);
    if (content.includes("\uFFFD")) {
      return {
        ok: false,
        reason: "contains replacement character U+FFFD"
      };
    }

    const mojibake = findMojibake(content);
    if (mojibake) {
      return {
        ok: false,
        reason: `suspected mojibake sequence (${mojibake.length} chars)`
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
    const relativePath = path.relative(process.cwd(), filePath);
    const result = checkUtf8(filePath, relativePath);
    if (!result.ok) {
      failures.push({
        file: relativePath,
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
