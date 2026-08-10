import type {
  LiteSnapDiagnosticEntry,
  LiteSnapDiagnosticOperation,
  LiteSnapDiagnosticStatus
} from "../../shared/litesnap";
import { LiteDatabase } from "../database";

export const LITESNAP_DIAGNOSTIC_MAX_ITEMS = 20;

function sanitizeDiagnosticMessage(value: string): string {
  return String(value ?? "")
    .replace(/[A-Za-z]:\\[^\s]+/g, "[path]")
    .replace(/file:\/\/\/[^\s]+/gi, "[path]")
    .replace(/data:image\/[a-z0-9+.-]+;base64,[^\s]+/gi, "[image]")
    .slice(0, 1200)
    .trim();
}

function sanitizeDiagnosticMetrics(
  metrics: Record<string, number | string | boolean> | undefined
): Record<string, number | string | boolean> {
  const safe: Record<string, number | string | boolean> = {};
  for (const [key, value] of Object.entries(metrics ?? {})) {
    // These payload types can carry user content. Keep the operation metrics
    // useful without retaining a file, bitmap, OCR result or clipboard value.
    if (/^(?:filePath|imageData|ocrText|clipboardContent)$/i.test(key)) {
      continue;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      safe[key] = value;
    } else if (typeof value === "string") {
      safe[key] = sanitizeDiagnosticMessage(value);
    }
  }
  return safe;
}

export class LiteSnapDiagnosticStore {
  public constructor(private readonly db: LiteDatabase) {}

  public async record(input: {
    operation: LiteSnapDiagnosticOperation;
    status: LiteSnapDiagnosticStatus;
    startedAt: number;
    message: string;
    metrics?: Record<string, number | string | boolean>;
  }): Promise<LiteSnapDiagnosticEntry> {
    const createdAt = Date.now();
    const entry: LiteSnapDiagnosticEntry = {
      id: `lsd-${createdAt}-${Math.random().toString(36).slice(2, 10)}`,
      operation: input.operation,
      status: input.status,
      createdAt,
      durationMs: Math.max(0, createdAt - input.startedAt),
      metrics: sanitizeDiagnosticMetrics(input.metrics),
      message: sanitizeDiagnosticMessage(input.message)
    };
    await this.db.insertLiteSnapDiagnostic(entry);
    await this.db.trimLiteSnapDiagnostics(LITESNAP_DIAGNOSTIC_MAX_ITEMS);
    return entry;
  }

  public list(): Promise<LiteSnapDiagnosticEntry[]> {
    return this.db.listLiteSnapDiagnostics(LITESNAP_DIAGNOSTIC_MAX_ITEMS);
  }

  public clear(): Promise<number> {
    return this.db.clearLiteSnapDiagnostics();
  }
}
