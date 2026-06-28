import path from "node:path";
import { Worker } from "node:worker_threads";

import { LaunchItem, SearchRequestOptions, UsageRecord } from "../shared/types";

type UsageMap = Record<string, UsageRecord>;

type SearchRequest =
  | {
      id: string;
      type: "syncState";
      catalog: LaunchItem[];
      usage: UsageMap;
    }
  | {
      id: string;
      type: "initial";
      limit: number;
    }
  | {
      id: string;
      type: "search";
      query: string;
      limit: number;
      options?: SearchRequestOptions;
    };

type SearchResponse =
  | { id: string; ok: true; items?: LaunchItem[] }
  | { id: string; ok: false; error: string };

type PendingRequest = {
  resolve: (items: LaunchItem[]) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  expectsItems: boolean;
};

const REQUEST_TIMEOUT_MS = 2000;

export class SearchWorkerClient {
  private readonly worker: Worker;

  private readonly pending = new Map<string, PendingRequest>();

  private counter = 0;

  private stateSynced = false;

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
        if (pending.expectsItems) {
          pending.resolve(response.items ?? []);
          return;
        }

        pending.resolve([]);
        return;
      }

      pending.reject(new Error(response.error));
    });

    this.worker.on("error", (error) => {
      const workerError =
        error instanceof Error ? error : new Error(String(error));
      this.stateSynced = false;
      for (const pending of this.pending.values()) {
        clearTimeout(pending.timeout);
        pending.reject(workerError);
      }
      this.pending.clear();
    });
  }

  public async syncState(
    catalog: LaunchItem[],
    usage: UsageMap
  ): Promise<void> {
    await this.request(
      {
        id: this.nextId(),
        type: "syncState",
        catalog,
        usage
      },
      false
    );
    this.stateSynced = true;
  }

  public async getInitialItems(limit: number): Promise<LaunchItem[]> {
    this.ensureStateSynced();
    return this.request(
      {
        id: this.nextId(),
        type: "initial",
        limit
      },
      true
    );
  }

  public async searchItems(
    query: string,
    limit: number,
    options?: SearchRequestOptions
  ): Promise<LaunchItem[]> {
    this.ensureStateSynced();
    return this.request(
      {
        id: this.nextId(),
        type: "search",
        query,
        limit,
        options
      },
      true
    );
  }

  public async terminate(): Promise<void> {
    this.stateSynced = false;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("Search worker terminated"));
    }
    this.pending.clear();
    await this.worker.terminate();
  }

  private ensureStateSynced(): void {
    if (!this.stateSynced) {
      throw new Error("Search worker state is not synced");
    }
  }

  private request(
    payload: SearchRequest,
    expectsItems: boolean
  ): Promise<LaunchItem[]> {
    return new Promise<LaunchItem[]>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(payload.id);
        if (payload.type === "syncState") {
          this.stateSynced = false;
        }
        reject(new Error("Search worker timed out"));
      }, REQUEST_TIMEOUT_MS);

      this.pending.set(payload.id, {
        resolve,
        reject,
        timeout,
        expectsItems
      });
      this.worker.postMessage(payload);
    });
  }

  private nextId(): string {
    this.counter += 1;
    return `search-${Date.now()}-${this.counter}`;
  }
}
