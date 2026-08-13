import type { BrowserWindow, Display, NativeImage } from "electron";
import type {
  LiteSnapDiagnosticOperation,
  LiteSnapOverlayMode,
  LiteSnapOverlaySelection,
  LiteSnapSettings
} from "../../shared/litesnap";

export type LiteSnapCaptureSession = {
  captureId: string;
  mode: LiteSnapOverlayMode;
  overlayWindow: BrowserWindow;
  display: Display;
  settings: LiteSnapSettings;
  previewImage: NativeImage | null;
  previewImageDataUrl: string | null;
  sourceImage: NativeImage | null;
  sourceImageDataUrl: string | null;
  displayFollowLocked: boolean;
  editorMode: boolean;
  historyEdit: boolean;
  longCaptureExportWidth: number | null;
  longCaptureSelection: LiteSnapOverlaySelection | null;
  diagnosticOperation: LiteSnapDiagnosticOperation;
  diagnosticFinalized: boolean;
  startedAt: number;
};

export type LiteSnapCaptureSessionWithImage = LiteSnapCaptureSession & {
  sourceImage: NativeImage;
};
