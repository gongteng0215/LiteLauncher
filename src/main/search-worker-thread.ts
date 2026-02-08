import { parentPort } from "node:worker_threads";

import { computeInitialItems, computeSearchItems } from "../shared/search-engine";
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

if (!parentPort) {
  throw new Error("search worker requires parent port");
}

parentPort.on("message", (request: SearchRequest) => {
  try {
    const items =
      request.type === "initial"
        ? computeInitialItems(request.catalog, request.usage, request.limit)
        : computeSearchItems(
            request.query,
            request.catalog,
            request.usage,
            request.limit
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
