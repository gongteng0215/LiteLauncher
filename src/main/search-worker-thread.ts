import { parentPort } from "node:worker_threads";

import { computeInitialItems, computeSearchItems } from "../shared/search-engine";
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

let catalog: LaunchItem[] = [];
let usage: UsageMap = {};

if (!parentPort) {
  throw new Error("search worker requires parent port");
}

parentPort.on("message", (request: SearchRequest) => {
  try {
    if (request.type === "syncState") {
      catalog = request.catalog;
      usage = request.usage;
      const response: SearchResponse = { id: request.id, ok: true };
      parentPort?.postMessage(response);
      return;
    }

    const items =
      request.type === "initial"
        ? computeInitialItems(catalog, usage, request.limit)
        : computeSearchItems(
            request.query,
            catalog,
            usage,
            request.limit,
            request.options
          );

    const response: SearchResponse = { id: request.id, ok: true, items };
    parentPort?.postMessage(response);
  } catch (error) {
    const response: SearchResponse = {
      id: request.id,
      ok: false,
      error: error instanceof Error ? error.message : "Search worker failed"
    };
    parentPort?.postMessage(response);
  }
});
