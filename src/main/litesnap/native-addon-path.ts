import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

const NATIVE_ADDON_FILE = "litesnap-capture.node";

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

function pushPackagedCandidates(candidates: string[], resourcesRoot: string): void {
  pushCandidate(
    candidates,
    path.join(
      resourcesRoot,
      "app.asar.unpacked",
      "dist",
      "native",
      NATIVE_ADDON_FILE
    )
  );
  pushCandidate(
    candidates,
    path.join(resourcesRoot, "app", "dist", "native", NATIVE_ADDON_FILE)
  );
  pushCandidate(
    candidates,
    path.join(resourcesRoot, "dist", "native", NATIVE_ADDON_FILE)
  );
}

export function resolveLiteSnapNativeAddonCandidates(): string[] {
  const candidates: string[] = [];
  const moduleRelative = path.join(__dirname, "../../native", NATIVE_ADDON_FILE);
  const resourcesRoot = resolveResourcesRoot();
  const packaged = isPackagedApp();

  // In packaged builds, prefer app.asar.unpacked / resources paths because
  // __dirname may sit inside the asar. In local Electron (pnpm start/dev),
  // process.resourcesPath still points at electron/dist/resources and those
  // packaged candidates do not exist — prefer the module-relative build
  // output first to avoid noisy MODULE_NOT_FOUND warnings.
  if (packaged && resourcesRoot) {
    pushPackagedCandidates(candidates, resourcesRoot);
    pushCandidate(candidates, moduleRelative);
  } else {
    pushCandidate(candidates, moduleRelative);
    if (resourcesRoot) {
      pushPackagedCandidates(candidates, resourcesRoot);
    }
  }

  return candidates;
}

export function resolveLiteSnapNativeAddonPath(): string {
  for (const candidate of resolveLiteSnapNativeAddonCandidates()) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return resolveLiteSnapNativeAddonCandidates()[0]!;
}

export function isLiteSnapNativeAddonPresent(): boolean {
  return resolveLiteSnapNativeAddonCandidates().some((candidate) =>
    fs.existsSync(candidate)
  );
}

export function formatLiteSnapNativeAddonProbePaths(): string {
  return resolveLiteSnapNativeAddonCandidates().join("\n");
}
