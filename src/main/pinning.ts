import { LaunchItem, PinToggleFailureReason } from "../shared/types";

export type PinRequestValidationReason = Exclude<
  PinToggleFailureReason,
  "persist-failed"
>;

export type PinRequestValidationResult =
  | {
      ok: true;
      normalizedId: string;
      hydratedItem?: LaunchItem;
    }
  | {
      ok: false;
      normalizedId: string;
      reason: PinRequestValidationReason;
    };

export function normalizePinnedItemIds(
  input: unknown,
  isResolvable?: (itemId: string) => boolean,
  maxItems = 200
): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const result: string[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (typeof raw !== "string") {
      continue;
    }

    const id = raw.trim();
    if (!id || seen.has(id)) {
      continue;
    }

    if (isResolvable && !isResolvable(id)) {
      continue;
    }

    seen.add(id);
    result.push(id);
    if (result.length >= maxItems) {
      break;
    }
  }

  return result;
}

export function validatePinnedItemRequest(
  itemId: string,
  catalogIds: ReadonlySet<string>,
  hydratedItem?: LaunchItem | null
): PinRequestValidationResult {
  const normalizedId = String(itemId ?? "").trim();
  if (!normalizedId) {
    return {
      ok: false,
      normalizedId: "",
      reason: "empty-item-id"
    };
  }

  if (!catalogIds.has(normalizedId)) {
    if (hydratedItem && hydratedItem.id.trim() === normalizedId) {
      return {
        ok: true,
        normalizedId,
        hydratedItem
      };
    }

    return {
      ok: false,
      normalizedId,
      reason: "missing-catalog-item"
    };
  }

  return {
    ok: true,
    normalizedId
  };
}
