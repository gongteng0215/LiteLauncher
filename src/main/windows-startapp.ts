export function buildWindowsStartAppItemId(commandName: string): string {
  return `app:startapp:${String(commandName ?? "").trim().toLowerCase()}`;
}
