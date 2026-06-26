import fs from "node:fs";
import path from "node:path";

import { app, type NativeImage } from "electron";

import { type LiteSnapSettings } from "../../shared/litesnap";

export class LiteSnapImageStore {
  public getBaseDirectory(): string {
    return path.join(app.getPath("userData"), "litesnap");
  }

  public getDefaultSaveDirectory(): string {
    try {
      return path.join(app.getPath("pictures"), "LiteSnap");
    } catch {
      return path.join(this.getBaseDirectory(), "screenshots");
    }
  }

  public resolveSaveDirectory(settings: LiteSnapSettings): string {
    const configured = settings.saveDirectory.trim();
    return configured || this.getDefaultSaveDirectory();
  }

  public async saveImage(
    image: NativeImage,
    settings: LiteSnapSettings
  ): Promise<string> {
    const directory = this.resolveSaveDirectory(settings);
    await fs.promises.mkdir(directory, { recursive: true });

    const ext = settings.saveFormat === "jpg" ? "jpg" : "png";
    const targetPath = await this.getNextAvailablePath(directory, ext);
    const bytes =
      ext === "jpg" ? image.toJPEG(92) : image.toPNG();

    await fs.promises.writeFile(targetPath, bytes);
    return targetPath;
  }

  private async getNextAvailablePath(
    directory: string,
    extension: "png" | "jpg"
  ): Promise<string> {
    const stamp = this.formatTimestamp(new Date());
    const baseName = `LiteSnap_${stamp}`;
    let attempt = 0;

    while (true) {
      const suffix = attempt === 0 ? "" : `_${attempt + 1}`;
      const candidate = path.join(directory, `${baseName}${suffix}.${extension}`);
      try {
        await fs.promises.access(candidate);
        attempt += 1;
      } catch {
        return candidate;
      }
    }
  }

  private formatTimestamp(date: Date): string {
    const parts = [
      date.getFullYear().toString().padStart(4, "0"),
      (date.getMonth() + 1).toString().padStart(2, "0"),
      date.getDate().toString().padStart(2, "0")
    ];
    const time = [
      date.getHours().toString().padStart(2, "0"),
      date.getMinutes().toString().padStart(2, "0"),
      date.getSeconds().toString().padStart(2, "0")
    ];
    return `${parts.join("")}_${time.join("")}`;
  }
}
