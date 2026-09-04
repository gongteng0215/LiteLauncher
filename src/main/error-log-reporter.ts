import type { AppErrorLogInput } from "../shared/types";

let reporter: ((input: AppErrorLogInput) => void) | null = null;

export function configureMainErrorLogReporter(
  nextReporter: ((input: AppErrorLogInput) => void) | null
): void {
  reporter = nextReporter;
}

export function reportMainErrorLog(input: AppErrorLogInput): void {
  reporter?.(input);
}
