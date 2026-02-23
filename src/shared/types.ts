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

export interface LaunchAtLoginStatus {
  enabled: boolean;
  supported: boolean;
  reason?: string;
}
