export type ItemType = "application" | "folder" | "file" | "web" | "command";

export interface LaunchItem {
  id: string;
  type: ItemType;
  title: string;
  subtitle: string;
  target: string;
  keywords: string[];
  iconPath?: string;
}

export interface UsageRecord {
  count: number;
  lastUsedAt: number;
}

export interface ExecuteResult {
  ok: boolean;
  message?: string;
  keepOpen?: boolean;
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
