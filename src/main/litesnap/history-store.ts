import { promises as fs } from "node:fs";
import path from "node:path";

import { app, type NativeImage } from "electron";

import {
  LITESNAP_HISTORY_MAX_ITEMS_DEFAULT,
  type LiteSnapHistoryItem,
  type LiteSnapHistorySource
} from "../../shared/litesnap";
import { LiteDatabase } from "../database";

const THUMB_MAX_EDGE = 240;

export class LiteSnapHistoryStore {
  public constructor(private readonly db: LiteDatabase) {}

  public getHistoryDirectory(): string {
    return path.join(app.getPath("userData"), "litesnap", "history");
  }

  public async add(
    image: NativeImage,
    source: LiteSnapHistorySource,
    maxItems: number = LITESNAP_HISTORY_MAX_ITEMS_DEFAULT
  ): Promise<LiteSnapHistoryItem | null> {
    if (!image || image.isEmpty()) {
      return null;
    }

    const size = image.getSize();
    if (size.width <= 0 || size.height <= 0) {
      return null;
    }

    const createdAt = Date.now();
    const id = `lsh-${createdAt}-${Math.random().toString(36).slice(2, 10)}`;
    const directory = this.getHistoryDirectory();
    await fs.mkdir(directory, { recursive: true });

    const filePath = path.join(directory, `${id}.png`);
    const thumbPath = path.join(directory, `${id}_thumb.jpg`);
    await fs.writeFile(filePath, image.toPNG());

    let thumbWritten: string | null = null;
    try {
      const thumb = this.createThumbnail(image);
      if (thumb && !thumb.isEmpty()) {
        await fs.writeFile(thumbPath, thumb.toJPEG(78));
        thumbWritten = thumbPath;
      }
    } catch {
      thumbWritten = null;
    }

    await this.db.insertLiteSnapHistoryItem({
      id,
      filePath,
      thumbPath: thumbWritten,
      width: size.width,
      height: size.height,
      source,
      createdAt
    });

    const overflow = await this.db.trimLiteSnapHistoryItems(
      Math.max(1, Math.round(maxItems))
    );
    await this.deleteFiles(
      overflow.flatMap((item) => [item.filePath, item.thumbPath].filter(Boolean) as string[])
    );

    return {
      id,
      filePath,
      thumbPath: thumbWritten,
      width: size.width,
      height: size.height,
      source,
      createdAt
    };
  }

  public async list(limit = LITESNAP_HISTORY_MAX_ITEMS_DEFAULT): Promise<LiteSnapHistoryItem[]> {
    const rows = await this.db.listLiteSnapHistoryItems(Math.max(1, Math.round(limit)));
    return rows.map((row) => ({
      id: row.id,
      filePath: row.filePath,
      thumbPath: row.thumbPath,
      width: row.width,
      height: row.height,
      source: row.source as LiteSnapHistorySource,
      createdAt: row.createdAt
    }));
  }

  public async get(id: string): Promise<LiteSnapHistoryItem | null> {
    const row = await this.db.getLiteSnapHistoryItem(id);
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      filePath: row.filePath,
      thumbPath: row.thumbPath,
      width: row.width,
      height: row.height,
      source: row.source as LiteSnapHistorySource,
      createdAt: row.createdAt
    };
  }

  public async remove(id: string): Promise<boolean> {
    const item = await this.get(id);
    if (!item) {
      return false;
    }
    const deleted = await this.db.deleteLiteSnapHistoryItem(id);
    if (deleted) {
      await this.deleteFiles(
        [item.filePath, item.thumbPath].filter(Boolean) as string[]
      );
    }
    return deleted;
  }

  public async clear(): Promise<number> {
    const rows = await this.db.clearLiteSnapHistoryItems();
    await this.deleteFiles(
      rows.flatMap((item) => [item.filePath, item.thumbPath].filter(Boolean) as string[])
    );
    return rows.length;
  }

  private createThumbnail(image: NativeImage): NativeImage | null {
    const size = image.getSize();
    const scale = Math.min(1, THUMB_MAX_EDGE / Math.max(size.width, size.height));
    if (scale >= 1) {
      return image;
    }
    return image.resize({
      width: Math.max(1, Math.round(size.width * scale)),
      height: Math.max(1, Math.round(size.height * scale)),
      quality: "good"
    });
  }

  private async deleteFiles(paths: string[]): Promise<void> {
    await Promise.all(
      paths.map((filePath) => fs.rm(filePath, { force: true }).catch(() => undefined))
    );
  }
}
