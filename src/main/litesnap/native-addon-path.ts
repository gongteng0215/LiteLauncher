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

  try {
    const appPath = app.getAppPath();
    if (appPath.toLowerCase().endsWith(".asar")) {
      return path.normalize(path.dirname(appPath));
    }
  } catch {
    // app may not be ready yet
  }

  const execPath = process.execPath;
  if (execPath) {
    return path.normalize(path.join(path.dirname(execPath), "resources"));
  }

  return null;
}

export function resolveLiteSnapNativeAddonCandidates(): string[] {
  const candidates: string[] = [];
  const resourcesRoot = resolveResourcesRoot();

  if (resourcesRoot) {
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

  try {
    const appPath = app.getAppPath();
    pushCandidate(
      candidates,
      path.join(appPath, "dist", "native", NATIVE_ADDON_FILE)
    );
    if (appPath.toLowerCase().endsWith(".asar")) {
      pushCandidate(
        candidates,
        path.join(
          path.dirname(appPath),
          "app.asar.unpacked",
          "dist",
          "native",
          NATIVE_ADDON_FILE
        )
      );
    }
  } catch {
    // ignore when Electron app is unavailable
  }

  pushCandidate(
    candidates,
    path.join(__dirname, "../../native", NATIVE_ADDON_FILE)
  );

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
