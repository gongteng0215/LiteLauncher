export const LITESNAP_REQUIRED_NATIVE_EXPORTS = [
  "captureDisplayRect", "supportsLayeredWindowExclusion", "getWindowRectAtPoint",
  "scrollWindowAtPoint", "recognizeText"
] as const;

export interface LiteSnapNativeHealth {
  platform: string;
  arch: string;
  runtimeNapi: string;
  loaded: boolean;
  moduleFile: string | null;
  missingExports: string[];
  loadErrors: string[];
  message: string;
}

export function inspectLiteSnapNativeExports(addon: unknown): string[] {
  const record = addon as Record<string, unknown> | null;
  return LITESNAP_REQUIRED_NATIVE_EXPORTS.filter((key) => typeof record?.[key] !== "function");
}
