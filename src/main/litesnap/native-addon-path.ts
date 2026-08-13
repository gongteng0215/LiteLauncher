import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

const LEGACY_NATIVE_ADDON_FILES = [
  "litesnap-capture-v3.node",
  "litesnap-capture-v2.node",
  "litesnap-capture.node"
];
const NATIVE_ADDON_MANIFEST = "litesnap-capture-manifest.json";
const HASHED_ADDON_PATTERN = /^litesnap-capture-[a-f0-9]{16}\.node$/;

export type LiteSnapNativeAddonManifest = {
  schemaVersion: 1;
  fileName: string;
  sha256: string;
  fingerprint: string;
  napiVersion: number;
  arch: string;
  requiredExports: string[];
  builtAt: string;
};

function pushCandidate(candidates: string[], value: string | null | undefined): void {
  if (!value) {
    return;
  }

  const normalized = path.normalize(value);
  if (!candidates.includes(normalized)) {
    candidates.push(normalized);
  }
}

function resolveResourcesRoot(): string | null {
  const resourcesPath = process.resourcesPath;
  if (typeof resourcesPath === "string" && resourcesPath.length > 0) {
    return path.normalize(resourcesPath);
  }

  const execPath = process.execPath;
  if (execPath) {
    return path.normalize(path.join(path.dirname(execPath), "resources"));
  }

  return null;
}

function isPackagedApp(): boolean {
  try {
    return Boolean(app?.isPackaged);
  } catch {
    return false;
  }
}

function sha256File(filePath: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

export function resolveLiteSnapNativeAddonFromManifest(
  directory: string,
  runtimeNapiVersion = Number(process.versions.napi ?? 0),
  runtimeArch = process.arch
): string | null {
  const manifestPath = path.join(directory, NATIVE_ADDON_MANIFEST);
  try {
    const manifest = JSON.parse(
      fs.readFileSync(manifestPath, "utf8")
    ) as Partial<LiteSnapNativeAddonManifest>;
    if (
      manifest.schemaVersion !== 1 ||
      typeof manifest.fileName !== "string" ||
      !HASHED_ADDON_PATTERN.test(manifest.fileName) ||
      path.basename(manifest.fileName) !== manifest.fileName ||
      typeof manifest.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(manifest.sha256) ||
      typeof manifest.napiVersion !== "number" ||
      manifest.napiVersion > runtimeNapiVersion ||
      typeof manifest.arch !== "string" ||
      manifest.arch !== runtimeArch
    ) {
      return null;
    }
    const addonPath = path.join(directory, manifest.fileName);
    if (!fs.existsSync(addonPath) || fs.statSync(addonPath).size <= 0) {
      return null;
    }
    return sha256File(addonPath) === manifest.sha256 ? addonPath : null;
  } catch {
    return null;
  }
}

function pushDirectoryCandidates(candidates: string[], directory: string): void {
  pushCandidate(candidates, resolveLiteSnapNativeAddonFromManifest(directory));
  for (const addonFile of LEGACY_NATIVE_ADDON_FILES) {
    pushCandidate(candidates, path.join(directory, addonFile));
  }
}

function resolvePackagedNativeDirectories(resourcesRoot: string): string[] {
  return [
    path.join(resourcesRoot, "app.asar.unpacked", "dist", "native"),
    path.join(resourcesRoot, "app", "dist", "native"),
    path.join(resourcesRoot, "dist", "native")
  ];
}

export function resolveLiteSnapNativeAddonCandidates(): string[] {
  const candidates: string[] = [];
  const moduleRelativeDirectory = path.join(__dirname, "../../native");
  const resourcesRoot = resolveResourcesRoot();
  const packagedDirectories = resourcesRoot
    ? resolvePackagedNativeDirectories(resourcesRoot)
    : [];

  if (isPackagedApp()) {
    for (const directory of packagedDirectories) {
      pushDirectoryCandidates(candidates, directory);
    }
    pushDirectoryCandidates(candidates, moduleRelativeDirectory);
  } else {
    pushDirectoryCandidates(candidates, moduleRelativeDirectory);
    for (const directory of packagedDirectories) {
      pushDirectoryCandidates(candidates, directory);
    }
  }

  return candidates;
}

export function resolveLiteSnapNativeAddonPath(): string {
  const candidates = resolveLiteSnapNativeAddonCandidates();
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0] ?? path.join(__dirname, "../../native", "litesnap-capture.node");
}

export function isLiteSnapNativeAddonPresent(): boolean {
  return resolveLiteSnapNativeAddonCandidates().some((candidate) =>
    fs.existsSync(candidate)
  );
}

export function formatLiteSnapNativeAddonProbePaths(): string {
  return resolveLiteSnapNativeAddonCandidates().join("\n");
}
