import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { DEFAULT_CATALOG_SCAN_CONFIG } from "../shared/settings";
import { CatalogScanConfig, LaunchItem } from "../shared/types";
import { getPluginCatalogItems } from "./plugins";

const START_MENU_RELATIVE_PATH = path.join(
  "Microsoft",
  "Windows",
  "Start Menu",
  "Programs"
);
const MAC_APPLICATION_DIRS = [
  "/Applications",
  "/Applications/Utilities",
  "/System/Applications",
  "/System/Applications/Utilities"
] as const;
const MAC_CASKROOM_DIRS = [
  "/opt/homebrew/Caskroom",
  "/usr/local/Caskroom"
] as const;

const PINYIN_BOUNDARIES = [
  "\u963f",
  "\u82ad",
  "\u64e6",
  "\u642d",
  "\u86fe",
  "\u53d1",
  "\u5676",
  "\u54c8",
  "\u51fb",
  "\u5580",
  "\u5783",
  "\u5988",
  "\u62ff",
  "\u54e6",
  "\u556a",
  "\u671f",
  "\u7136",
  "\u6492",
  "\u584c",
  "\u6316",
  "\u6614",
  "\u538b",
  "\u531d"
] as const;

const PINYIN_INITIALS = "abcdefghijklmnopqrstuvwxyz"
  .split("")
  .filter((letter) => !"iuv".includes(letter));

const APP_TITLE_ALIAS_RULES: ReadonlyArray<{
  pattern: RegExp;
  aliases: readonly string[];
}> = [
  {
    pattern: /钉钉|dingtalk/i,
    aliases: ["ding", "dingtalk", "dd"]
  },
  {
    pattern: /微信|wechat/i,
    aliases: ["weixin", "wechat", "wx"]
  },
  {
    pattern: /百度网盘|baidu\s*netdisk|baidunetdisk/i,
    aliases: ["baidu", "wangpan", "netdisk", "bdwp"]
  }
] as const;

const CJK_PINYIN_SYLLABLE_MAP: Readonly<Record<string, string>> = {
  阿: "a",
  百: "bai",
  度: "du",
  钉: "ding",
  微: "wei",
  信: "xin",
  网: "wang",
  盘: "pan",
  输: "shu",
  入: "ru",
  法: "fa",
  设: "she",
  置: "zhi",
  管: "guan",
  理: "li",
  器: "qi",
  办: "ban",
  公: "gong",
  文: "wen",
  件: "jian",
  浏: "liu",
  览: "lan",
  视: "shi",
  频: "pin",
  音: "yin",
  图: "tu",
  片: "pian",
  安: "an",
  全: "quan",
  中: "zhong",
  心: "xin",
  云: "yun",
  腾: "teng",
  讯: "xun",
  飞: "fei",
  书: "shu",
  剪: "jian",
  映: "ying",
  搜: "sou",
  狗: "gou",
  拼: "pin",
  隐: "yin",
  藏: "cang",
  启: "qi",
  动: "dong",
  终: "zhong",
  端: "duan",
  命: "ming",
  令: "ling",
  提: "ti",
  示: "shi",
  控: "kong",
  制: "zhi",
  台: "tai"
} as const;

const WINDOWS_PROGRAM_DIR_ENV_KEYS = [
  "ProgramFiles",
  "ProgramFiles(x86)",
  "ProgramW6432"
] as const;
const WINDOWS_EXECUTABLE_MAX_DEPTH = 4;
const WINDOWS_EXECUTABLE_MAX_FILES = 12000;
const WINDOWS_SKIP_DIRS = new Set<string>([
  "windowsapps",
  "$windows.~ws",
  "$recycle.bin",
  "recycler",
  "recovery"
]);
const WINDOWS_SKIP_EXE_NAME_PATTERNS: readonly RegExp[] = [
  /^unins\d*$/i,
  /^uninstall/i,
  /^vc_redist/i
];

function getStartMenuDirs(): string[] {
  const dirs: string[] = [];
  const appData = process.env.APPDATA;
  const programData = process.env.PROGRAMDATA;

  if (appData) {
    dirs.push(path.join(appData, START_MENU_RELATIVE_PATH));
  }

  if (programData) {
    dirs.push(path.join(programData, START_MENU_RELATIVE_PATH));
  }

  return dirs;
}

function walkShortcutFiles(dirPath: string, result: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      walkShortcutFiles(fullPath, result);
      continue;
    }

    if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".lnk") {
      result.push(fullPath);
    }
  }
}

function getMacApplicationDirs(): string[] {
  const dirs = new Set<string>(MAC_APPLICATION_DIRS);
  const homeDir = process.env.HOME;
  if (homeDir) {
    dirs.add(path.join(homeDir, "Applications"));
  }
  for (const caskroomDir of MAC_CASKROOM_DIRS) {
    dirs.add(caskroomDir);
  }
  return Array.from(dirs);
}

function getMacSpotlightApplicationPaths(): string[] {
  if (process.platform !== "darwin") {
    return [];
  }

  const query = "kMDItemContentTypeTree == 'com.apple.application-bundle'";
  let stdout = "";
  try {
    const result = spawnSync("/usr/bin/mdfind", [query], {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      timeout: 4000
    });
    if (result.error || result.status !== 0) {
      return [];
    }
    stdout = typeof result.stdout === "string" ? result.stdout : "";
  } catch {
    return [];
  }

  if (!stdout.trim()) {
    return [];
  }

  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((candidate) => candidate.toLowerCase().endsWith(".app"))
    .filter((candidate) => !candidate.includes("/Contents/"))
    .filter((candidate) => {
      try {
        return fs.existsSync(candidate);
      } catch {
        return false;
      }
    });
}

function walkMacApplicationBundles(dirPath: string, result: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const isDirectory = entry.isDirectory();
    const isSymlink = entry.isSymbolicLink();
    if (!isDirectory && !isSymlink) {
      continue;
    }

    if (entry.name.startsWith(".")) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);
    if (path.extname(entry.name).toLowerCase() === ".app") {
      result.push(fullPath);
      continue;
    }

    if (isSymlink) {
      continue;
    }

    walkMacApplicationBundles(fullPath, result);
  }
}

function normalizeRealPathCandidate(pathValue: string): string {
  try {
    return fs.realpathSync.native(pathValue).toLowerCase();
  } catch {
    return pathValue.toLowerCase();
  }
}

function normalizeDirPathForCompare(pathValue: string): string {
  const resolved = path.resolve(pathValue);
  const normalized = normalizeRealPathCandidate(resolved);
  return normalized.replace(/[\\/]+$/, "");
}

function getExcludedScanDirs(options: CatalogScanConfig): string[] {
  return Array.isArray(options.excludeScanDirs)
    ? options.excludeScanDirs
        .map((candidate) => candidate.trim())
        .filter(Boolean)
        .map((candidate) => normalizeDirPathForCompare(candidate))
    : [];
}

function isPathExcluded(pathValue: string, excludedDirs: string[]): boolean {
  if (excludedDirs.length === 0) {
    return false;
  }

  const normalized = normalizeDirPathForCompare(pathValue);
  return excludedDirs.some((excludedDir) => {
    if (normalized === excludedDir) {
      return true;
    }

    return normalized.startsWith(`${excludedDir}${path.sep.toLowerCase()}`);
  });
}

function isCjkChar(char: string): boolean {
  return /[\u3400-\u9fff]/.test(char);
}

function cjkToInitial(char: string): string {
  if (!isCjkChar(char)) {
    return "";
  }

  for (let i = PINYIN_BOUNDARIES.length - 1; i >= 0; i -= 1) {
    if (char.localeCompare(PINYIN_BOUNDARIES[i] ?? "", "zh-CN") >= 0) {
      return PINYIN_INITIALS[i] ?? "";
    }
  }

  return "";
}

function toPinyinInitialTokens(value: string): string[] {
  const parts: string[] = [];
  let current = "";

  for (const char of value) {
    const lower = char.toLowerCase();
    if (/[a-z0-9]/.test(lower)) {
      current += lower;
      continue;
    }

    const initial = cjkToInitial(char);
    if (initial) {
      current += initial;
      continue;
    }

    if (current) {
      parts.push(current);
      current = "";
    }
  }

  if (current) {
    parts.push(current);
  }

  const tokens = new Set<string>();
  for (const part of parts) {
    if (!part) {
      continue;
    }

    tokens.add(part);
    if (part.length > 1) {
      tokens.add(part[0] ?? "");
    }
  }

  return Array.from(tokens).filter(Boolean);
}

function toAcronymTokens(baseTokens: string[]): string[] {
  const words = baseTokens.filter((token) => /^[a-z0-9]+$/.test(token));
  if (words.length < 2) {
    return [];
  }

  let acronym = "";
  for (const word of words) {
    acronym += word[0] ?? "";
  }

  if (acronym.length < 2) {
    return [];
  }

  const tokens = new Set<string>();
  for (let length = 2; length <= acronym.length; length += 1) {
    tokens.add(acronym.slice(0, length));
  }

  return Array.from(tokens);
}

function getMappedPinyinSyllables(value: string): string[] {
  const syllables: string[] = [];
  for (const char of value) {
    const mapped = CJK_PINYIN_SYLLABLE_MAP[char];
    if (mapped) {
      syllables.push(mapped);
    }
  }
  return syllables;
}

function toPinyinSyllableTokens(value: string): string[] {
  const syllables = getMappedPinyinSyllables(value);
  if (syllables.length === 0) {
    return [];
  }

  const tokens = new Set<string>();
  const joined = syllables.join("");
  if (joined) {
    tokens.add(joined);
  }

  let cumulative = "";
  for (const syllable of syllables) {
    cumulative += syllable;
    if (cumulative) {
      tokens.add(cumulative);
    }
  }

  const initials = syllables
    .map((syllable) => syllable[0] ?? "")
    .join("");
  if (initials.length >= 2) {
    tokens.add(initials);
    for (let i = 2; i <= initials.length; i += 1) {
      tokens.add(initials.slice(0, i));
    }
  }

  for (const syllable of syllables) {
    if (syllable) {
      tokens.add(syllable);
    }
  }

  return Array.from(tokens);
}

function toKeywords(value: string): string[] {
  const baseTokens = value
    .toLowerCase()
    .split(/[\s._\-\\/]+/)
    .filter(Boolean);

  const initials = toPinyinInitialTokens(value);
  const acronyms = toAcronymTokens(baseTokens);
  const pinyinTokens = toPinyinSyllableTokens(value);
  const merged = new Set<string>([
    ...baseTokens,
    ...initials,
    ...acronyms,
    ...pinyinTokens
  ]);
  return Array.from(merged);
}

function getAliasKeywords(title: string): string[] {
  const aliases = new Set<string>();
  for (const rule of APP_TITLE_ALIAS_RULES) {
    if (!rule.pattern.test(title)) {
      continue;
    }

    for (const alias of rule.aliases) {
      aliases.add(alias);
    }
  }
  return Array.from(aliases);
}

function commandItem(
  id: string,
  title: string,
  subtitle: string,
  target: string
): LaunchItem {
  return {
    id,
    type: "command",
    title,
    subtitle,
    target,
    keywords: toKeywords(`${title} ${subtitle}`)
  };
}

function createBuiltinItems(): LaunchItem[] {
  return [
    commandItem(
      "command:clip",
      "clip",
      "\u6253\u5f00\u526a\u8d34\u677f\u5386\u53f2",
      "command:clip"
    ),
    commandItem(
      "command:settings",
      "settings",
      "\u6253\u5f00\u8bbe\u7f6e\u9875\u9762",
      "command:settings"
    ),
    commandItem(
      "command:reindex",
      "reindex",
      "\u91cd\u5efa\u641c\u7d22\u7d22\u5f15",
      "command:reindex"
    ),
    commandItem(
      "command:exit",
      "exit",
      "\u9000\u51fa LiteLauncher",
      "command:exit"
    )
  ];
}

function createAppItemsFromStartMenu(): LaunchItem[] {
  const files: string[] = [];
  for (const startMenuDir of getStartMenuDirs()) {
    walkShortcutFiles(startMenuDir, files);
  }

  const appItems: LaunchItem[] = files.map((shortcutPath) => {
    const title = path.basename(shortcutPath, path.extname(shortcutPath));
    const aliasKeywords = getAliasKeywords(title);
    return {
      id: `app:${shortcutPath}`,
      type: "application",
      title,
      subtitle: shortcutPath,
      target: shortcutPath,
      keywords: toKeywords(`${title} ${shortcutPath} ${aliasKeywords.join(" ")}`)
    };
  });

  return appItems;
}

function getWindowsExecutableRoots(options: CatalogScanConfig): string[] {
  const roots = new Set<string>();
  const excludedDirs = getExcludedScanDirs(options);
  if (options.scanProgramFiles) {
    for (const key of WINDOWS_PROGRAM_DIR_ENV_KEYS) {
      const value = process.env[key];
      if (!value) {
        continue;
      }
      roots.add(value);
    }

    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      roots.add(path.join(localAppData, "Programs"));
    }
  }

  for (const customDir of options.customScanDirs) {
    roots.add(customDir);
  }

  return Array.from(roots).filter((candidate) => {
    try {
      return (
        fs.existsSync(candidate) &&
        fs.statSync(candidate).isDirectory() &&
        !isPathExcluded(candidate, excludedDirs)
      );
    } catch {
      return false;
    }
  });
}

function shouldSkipExecutableName(fileName: string): boolean {
  const baseName = path.basename(fileName, ".exe");
  return WINDOWS_SKIP_EXE_NAME_PATTERNS.some((pattern) => pattern.test(baseName));
}

function walkExecutableFiles(rootDir: string, excludedDirs: string[]): string[] {
  const result: string[] = [];
  const stack: Array<{ dir: string; depth: number }> = [{ dir: rootDir, depth: 0 }];
  const seenDirs = new Set<string>();

  while (stack.length > 0 && result.length < WINDOWS_EXECUTABLE_MAX_FILES) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    if (isPathExcluded(current.dir, excludedDirs)) {
      continue;
    }

    const normalized = current.dir.toLowerCase();
    if (seenDirs.has(normalized)) {
      continue;
    }
    seenDirs.add(normalized);

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current.dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current.dir, entry.name);

      if (entry.isDirectory()) {
        if (current.depth >= WINDOWS_EXECUTABLE_MAX_DEPTH) {
          continue;
        }

        const dirName = entry.name.toLowerCase();
        if (WINDOWS_SKIP_DIRS.has(dirName)) {
          continue;
        }

        if (isPathExcluded(fullPath, excludedDirs)) {
          continue;
        }

        stack.push({ dir: fullPath, depth: current.depth + 1 });
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (path.extname(entry.name).toLowerCase() !== ".exe") {
        continue;
      }

      if (shouldSkipExecutableName(entry.name)) {
        continue;
      }

      if (isPathExcluded(fullPath, excludedDirs)) {
        continue;
      }

      result.push(fullPath);
      if (result.length >= WINDOWS_EXECUTABLE_MAX_FILES) {
        break;
      }
    }
  }

  return result;
}

function createAppItemsFromExecutableRoots(
  options: CatalogScanConfig
): LaunchItem[] {
  if (process.platform !== "win32") {
    return [];
  }

  const roots = getWindowsExecutableRoots(options);
  const excludedDirs = getExcludedScanDirs(options);
  if (roots.length === 0) {
    return [];
  }

  const appItems: LaunchItem[] = [];
  const seenTargets = new Set<string>();
  for (const root of roots) {
    const executableFiles = walkExecutableFiles(root, excludedDirs);
    for (const executablePath of executableFiles) {
      const key = executablePath.toLowerCase();
      if (seenTargets.has(key)) {
        continue;
      }
      seenTargets.add(key);

      const title = path.basename(executablePath, ".exe");
      const aliasKeywords = getAliasKeywords(title);
      appItems.push({
        id: `app:${executablePath}`,
        type: "application",
        title,
        subtitle: executablePath,
        target: executablePath,
        keywords: toKeywords(
          `${title} ${executablePath} ${aliasKeywords.join(" ")}`
        )
      });
    }
  }

  return appItems;
}

function createAppItemsFromMacApplications(): LaunchItem[] {
  const bundles: string[] = getMacSpotlightApplicationPaths();
  for (const appDir of getMacApplicationDirs()) {
    walkMacApplicationBundles(appDir, bundles);
  }

  const deduped = new Set<string>();
  const items: LaunchItem[] = [];
  for (const bundlePath of bundles) {
    const normalizedPath = normalizeRealPathCandidate(bundlePath);
    if (deduped.has(normalizedPath)) {
      continue;
    }
    deduped.add(normalizedPath);

    const title = path.basename(bundlePath, ".app");
    const aliasKeywords = getAliasKeywords(title);
    items.push({
      id: `app:${bundlePath}`,
      type: "application",
      title,
      subtitle: bundlePath,
      target: bundlePath,
      keywords: toKeywords(`${title} ${bundlePath} ${aliasKeywords.join(" ")}`)
    });
  }

  return items;
}

function createApplicationItems(options: CatalogScanConfig): LaunchItem[] {
  if (process.platform === "win32") {
    const fromStartMenu = createAppItemsFromStartMenu();
    const fromExecutableRoots = createAppItemsFromExecutableRoots(options);
    const merged = [...fromStartMenu, ...fromExecutableRoots];
    const deduped: LaunchItem[] = [];
    const seen = new Set<string>();
    for (const item of merged) {
      const key = item.target.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      deduped.push(item);
    }
    return deduped;
  }

  if (process.platform === "darwin") {
    return createAppItemsFromMacApplications();
  }

  return [];
}

export function buildCatalog(): LaunchItem[] {
  const options = DEFAULT_CATALOG_SCAN_CONFIG;
  return buildCatalogWithOptions(options);
}

export function buildCatalogWithOptions(optionsInput: CatalogScanConfig): LaunchItem[] {
  const options: CatalogScanConfig = {
    scanProgramFiles: Boolean(optionsInput.scanProgramFiles),
    customScanDirs: Array.isArray(optionsInput.customScanDirs)
      ? optionsInput.customScanDirs
      : [],
    excludeScanDirs: Array.isArray(optionsInput.excludeScanDirs)
      ? optionsInput.excludeScanDirs
      : [],
    resultIncludeDirs: Array.isArray(optionsInput.resultIncludeDirs)
      ? optionsInput.resultIncludeDirs
      : [],
    resultExcludeDirs: Array.isArray(optionsInput.resultExcludeDirs)
      ? optionsInput.resultExcludeDirs
      : []
  };
  return [
    ...createBuiltinItems(),
    ...getPluginCatalogItems(),
    ...createApplicationItems(options)
  ];
}
