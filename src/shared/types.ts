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
