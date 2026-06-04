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
