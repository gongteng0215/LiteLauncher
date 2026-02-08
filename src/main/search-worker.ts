import path from "node:path";
import { Worker } from "node:worker_threads";

import { LaunchItem, UsageRecord } from "../shared/types";

type UsageMap = Record<string, UsageRecord>;

type SearchRequest =
  | {
      id: string;
      type: "initial";
      catalog: LaunchItem[];
      usage: UsageMap;
      limit: number;
    }
  | {
      id: string;
      type: "search";
      query: string;
      catalog: LaunchItem[];
      usage: UsageMap;
      limit: number;
    };

type SearchResponse =
  | { id: string; ok: true; items: LaunchItem[] }
  | { id: string; ok: false; error: string };

type PendingRequest = {
  resolve: (items: LaunchItem[]) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
};

const REQUEST_TIMEOUT_MS = 2000;

export class SearchWorkerClient {
  private readonly worker: Worker;

  private readonly pending = new Map<string, PendingRequest>();

  private counter = 0;

  public constructor() {
    const workerPath = path.join(__dirname, "search-worker-thread.js");
    this.worker = new Worker(workerPath);

    this.worker.on("message", (response: SearchResponse) => {
      const pending = this.pending.get(response.id);
      if (!pending) {
        return;
      }

      clearTimeout(pending.timeout);
      this.pending.delete(response.id);

      if (response.ok) {
        pending.resolve(response.items);
        return;
      }

      pending.reject(new Error(response.error));
    });

    this.worker.on("error", (error) => {
      const workerError =
        error instanceof Error ? error : new Error(String(error));
      for (const pending of this.pending.values()) {
        clearTimeout(pending.timeout);
        pending.reject(workerError);
      }
      this.pending.clear();
    });
  }

  public getInitialItems(
    catalog: LaunchItem[],
    usage: UsageMap,
    limit: number
  ): Promise<LaunchItem[]> {
    return this.request({
      id: this.nextId(),
      type: "initial",
      catalog,
      usage,
      limit
    });
  }

  public searchItems(
    query: string,
    catalog: LaunchItem[],
    usage: UsageMap,
    limit: number
  ): Promise<LaunchItem[]> {
    return this.request({
      id: this.nextId(),
      type: "search",
      query,
      catalog,
      usage,
      limit
    });
  }

  public async terminate(): Promise<void> {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("Search worker terminated"));
    }
    this.pending.clear();
    await this.worker.terminate();
  }

  private request(payload: SearchRequest): Promise<LaunchItem[]> {
    return new Promise<LaunchItem[]>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(payload.id);
        reject(new Error("Search worker timed out"));
      }, REQUEST_TIMEOUT_MS);

      this.pending.set(payload.id, { resolve, reject, timeout });
      this.worker.postMessage(payload);
    });
  }

  private nextId(): string {
    this.counter += 1;
    return `search-${Date.now()}-${this.counter}`;
  }
}
