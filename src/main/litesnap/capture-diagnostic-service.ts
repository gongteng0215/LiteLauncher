import type { AppErrorLogInput } from "../../shared/types";
import type { LiteSnapDiagnosticOperation } from "../../shared/litesnap";
import type { LiteSnapLongCaptureSessionState } from "./long-capture-coordinator";
import { LiteSnapDiagnosticStore } from "./diagnostic-store";

export class LiteSnapCaptureDiagnosticService {
  public constructor(
    private readonly store: LiteSnapDiagnosticStore | null,
    private readonly reportError?: (input: AppErrorLogInput) => void
  ) {}

  public async record(
    operation: LiteSnapDiagnosticOperation,
    status: "success" | "cancelled" | "failed",
    startedAt: number,
    message: string,
    metrics?: Record<string, number | string | boolean>
  ): Promise<void> {
    try {
      await this.store?.record({ operation, status, startedAt, message, metrics });
    } catch (error) {
      console.warn("[litesnap] diagnostic record failed", error);
    }
  }

  public reportLongCaptureFailure(
    session: LiteSnapLongCaptureSessionState,
    reason: string
  ): void {
    if (session.failureReported) return;
    session.failureReported = true;
    this.reportError?.({
      scope: "main",
      level: "error",
      message: "LiteSnap long capture failed",
      context: "litesnap-long-capture",
      detail: `reason=${reason}; frames=${session.frames.length}; height=${session.stitchedHeight}`
    });
  }
}
