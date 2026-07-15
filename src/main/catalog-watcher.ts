import fs from "node:fs";

import { type CatalogScanConfig } from "../shared/types";
import { getCatalogWatchDirectories } from "./catalog";

const CATALOG_WATCH_DEBOUNCE_MS = 2500;
const CATALOG_STALE_SHOW_REFRESH_MS = 3 * 60 * 1000;

/**
 * Watches Start Menu (and optional executable scan roots) so installs/uninstalls
 * refresh the launcher catalog without requiring a manual rebuild.
 */
export class CatalogChangeWatcher {
  private readonly watchers: fs.FSWatcher[] = [];
  private debounceTimer: NodeJS.Timeout | null = null;
  private rebuildInFlight = false;
  private rebuildQueued = false;
  private lastRebuildAt = 0;
  private disposed = false;

  public constructor(
    private readonly getConfig: () => CatalogScanConfig,
    private readonly rebuild: () => Promise<unknown>
  ) {}

  public start(): void {
    if (this.disposed || process.platform !== "win32") {
      return;
    }

    this.stopWatchers();
    for (const dir of getCatalogWatchDirectories(this.getConfig())) {
      try {
        const watcher = fs.watch(dir, { recursive: true }, () => {
          this.scheduleRebuild("watch");
        });
        watcher.on("error", () => {
          // Directory may disappear after uninstall of a root folder; ignore.
        });
        this.watchers.push(watcher);
      } catch (error) {
        console.warn(`[catalog] failed to watch ${dir}`, error);
      }
    }
  }

  public restart(): void {
    if (this.disposed) {
      return;
    }
    this.start();
  }

  public scheduleRebuild(_reason = "manual"): void {
    if (this.disposed) {
      return;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.runRebuild();
    }, CATALOG_WATCH_DEBOUNCE_MS);
    this.debounceTimer.unref?.();
  }

  public maybeRefreshIfStale(): void {
    if (this.disposed) {
      return;
    }
    if (this.lastRebuildAt <= 0) {
      return;
    }
    if (Date.now() - this.lastRebuildAt < CATALOG_STALE_SHOW_REFRESH_MS) {
      return;
    }
    this.scheduleRebuild("stale-show");
  }

  public markRebuilt(): void {
    this.lastRebuildAt = Date.now();
  }

  public dispose(): void {
    this.disposed = true;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.stopWatchers();
  }

  private stopWatchers(): void {
    while (this.watchers.length > 0) {
      const watcher = this.watchers.pop();
      try {
        watcher?.close();
      } catch {
        // Ignore close failures.
      }
    }
  }

  private async runRebuild(): Promise<void> {
    if (this.disposed) {
      return;
    }
    if (this.rebuildInFlight) {
      this.rebuildQueued = true;
      return;
    }

    this.rebuildInFlight = true;
    try {
      await this.rebuild();
      this.markRebuilt();
    } catch (error) {
      console.error("[catalog] watched rebuild failed", error);
    } finally {
      this.rebuildInFlight = false;
      if (this.rebuildQueued && !this.disposed) {
        this.rebuildQueued = false;
        this.scheduleRebuild("queued");
      }
    }
  }
}
