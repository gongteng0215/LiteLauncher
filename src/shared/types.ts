export type ItemType = "application" | "folder" | "file" | "web" | "command";

export interface LaunchItem {
  id: string;
  type: ItemType;
  title: string;
  subtitle: string;
  target: string;
  keywords: string[];
  iconPath?: string;
  pinned?: boolean;
}

export interface UsageRecord {
  count: number;
  lastUsedAt: number;
}

export interface ExecuteResult {
  ok: boolean;
  message?: string;
  keepOpen?: boolean;
  data?: Record<string, unknown>;
}

export interface PasswordGeneratorOptions {
  length: number;
  includeSymbols: boolean;
  count: number;
}

export interface ClipItem {
  id: string;
  content: string;
  hash: string;
  createdAt: number;
}

export interface DebugKeyEvent {
  source: "main" | "renderer";
  phase: string;
  key: string;
  code?: string;
  alt?: boolean;
  control?: boolean;
  shift?: boolean;
  meta?: boolean;
  repeat?: boolean;
  ts: number;
  note?: string;
}

export interface SearchDisplayConfig {
  recentLimit: number;
  pinnedLimit: number;
  pluginLimit: number;
  searchLimit: number;
}

export type SearchScope =
  | "all"
  | "application"
  | "folder"
  | "file"
  | "web"
  | "command"
  | "plugin";

export interface SearchRequestOptions {
  limit?: number;
  scope?: SearchScope;
}

export interface CatalogScanConfig {
  scanProgramFiles: boolean;
  customScanDirs: string[];
  excludeScanDirs: string[];
  resultIncludeDirs: string[];
  resultExcludeDirs: string[];
}

export interface CatalogRebuildResult {
  ok: boolean;
  message: string;
  totalItems: number;
  applicationItems: number;
  durationMs: number;
}

export interface LaunchAtLoginStatus {
  enabled: boolean;
  supported: boolean;
  reason?: string;
}

export type AppErrorLogScope =
  | "main"
  | "renderer"
  | "ipc"
  | "execute"
  | "system";

export type AppErrorLogLevel = "error" | "warn";

export interface AppErrorLogInput {
  scope: AppErrorLogScope;
  message: string;
  level?: AppErrorLogLevel;
  context?: string;
  detail?: string;
}

export interface AppErrorLogEntry {
  id: number;
  scope: AppErrorLogScope;
  level: AppErrorLogLevel;
  message: string;
  context?: string;
  detail?: string;
  createdAt: number;
}
