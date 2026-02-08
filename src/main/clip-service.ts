import { createHash } from "node:crypto";
import { clipboard } from "electron";

import { ClipItem } from "../shared/types";
import { LiteDatabase } from "./database";

const DEFAULT_MAX_ITEMS = 50;
const DEFAULT_POLL_INTERVAL_MS = 700;

function hashContent(content: string): string {
  return createHash("sha1").update(content).digest("hex");
}

export class ClipService {
  private readonly db: LiteDatabase;

  private readonly maxItems: number;

  private readonly pollIntervalMs: number;

  private timer: NodeJS.Timeout | null = null;

  private lastCapturedHash = "";

  private collecting = false;

  public constructor(
    db: LiteDatabase,
    maxItems = DEFAULT_MAX_ITEMS,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS
  ) {
    this.db = db;
    this.maxItems = maxItems;
    this.pollIntervalMs = pollIntervalMs;
  }

  public start(): void {
    if (this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      void this.collectFromClipboard();
    }, this.pollIntervalMs);
  }

  public stop(): void {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = null;
  }

  public async getClipItems(query: string, limit = 50): Promise<ClipItem[]> {
    return this.db.getClipItems(query, limit);
  }

  public async copyClipItem(itemId: string): Promise<boolean> {
    const item = await this.db.getClipItemById(itemId);
    if (!item) {
      return false;
    }

    clipboard.writeText(item.content);
    return true;
  }

  public async deleteClipItem(itemId: string): Promise<boolean> {
    return this.db.deleteClipItem(itemId);
  }

  public async clearClipItems(): Promise<number> {
    return this.db.clearClipItems();
  }

  private async collectFromClipboard(): Promise<void> {
    if (this.collecting) {
      return;
    }

    this.collecting = true;
    try {
      const content = clipboard.readText();
      if (!content.trim()) {
        return;
      }

      const hash = hashContent(content);
      if (hash === this.lastCapturedHash) {
        return;
      }

      await this.db.saveClipItem(content, hash, this.maxItems);
      this.lastCapturedHash = hash;
    } catch (error) {
      console.error("Failed to collect clipboard content", error);
    } finally {
      this.collecting = false;
    }
  }
}
