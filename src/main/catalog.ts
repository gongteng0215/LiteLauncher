import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { LaunchItem } from "../shared/types";
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

function toKeywords(value: string): string[] {
  const baseTokens = value
    .toLowerCase()
    .split(/[\s._\-\\/]+/)
    .filter(Boolean);

  const initials = toPinyinInitialTokens(value);
  const acronyms = toAcronymTokens(baseTokens);
  const merged = new Set<string>([...baseTokens, ...initials, ...acronyms]);
  return Array.from(merged);
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
    return {
      id: `app:${shortcutPath}`,
      type: "application",
      title,
      subtitle: shortcutPath,
      target: shortcutPath,
      keywords: toKeywords(title)
    };
  });

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
    items.push({
      id: `app:${bundlePath}`,
      type: "application",
      title,
      subtitle: bundlePath,
      target: bundlePath,
      keywords: toKeywords(title)
    });
  }

  return items;
}

function createApplicationItems(): LaunchItem[] {
  if (process.platform === "win32") {
    return createAppItemsFromStartMenu();
  }

  if (process.platform === "darwin") {
    return createAppItemsFromMacApplications();
  }

  return [];
}

export function buildCatalog(): LaunchItem[] {
  return [
    ...createBuiltinItems(),
    ...getPluginCatalogItems(),
    ...createApplicationItems()
  ];
}
