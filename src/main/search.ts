import { computeInitialItems, computeSearchItems } from "../shared/search-engine";
import { LaunchItem, SearchRequestOptions } from "../shared/types";
import { UsageStore } from "./usage-store";

export function getInitialItems(
  catalog: LaunchItem[],
  usageStore: UsageStore,
  limit = 10
): LaunchItem[] {
  return computeInitialItems(catalog, usageStore.toObject(), limit);
}

export function searchItems(
  query: string,
  catalog: LaunchItem[],
  usageStore: UsageStore,
  limit = 20,
  options?: SearchRequestOptions
): LaunchItem[] {
  return computeSearchItems(query, catalog, usageStore.toObject(), limit, options);
}
