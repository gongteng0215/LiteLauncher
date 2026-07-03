import fs from "node:fs";
import path from "node:path";

export function resolveLiteSnapNativeAddonCandidates(): string[] {
  const candidates: string[] = [
    path.join(__dirname, "../../native/litesnap-capture.node")
  ];

  const resourcesPath = process.resourcesPath;
  if (typeof resourcesPath === "string" && resourcesPath.length > 0) {
    candidates.push(
      path.join(
        resourcesPath,
        "app.asar.unpacked",
        "dist",
        "native",
        "litesnap-capture.node"
      ),
      path.join(resourcesPath, "app", "dist", "native", "litesnap-capture.node"),
      path.join(resourcesPath, "dist", "native", "litesnap-capture.node")
    );
  }

  return [...new Set(candidates)];
}

export function resolveLiteSnapNativeAddonPath(): string {
  for (const candidate of resolveLiteSnapNativeAddonCandidates()) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return resolveLiteSnapNativeAddonCandidates()[0]!;
}
