import { PinToggleFailureReason } from "../shared/types";

export type PinRequestValidationReason = Exclude<
  PinToggleFailureReason,
  "persist-failed"
>;

export type PinRequestValidationResult =
  | {
      ok: true;
      normalizedId: string;
    }
  | {
      ok: false;
      normalizedId: string;
      reason: PinRequestValidationReason;
    };

export function validatePinnedItemRequest(
  itemId: string,
  catalogIds: ReadonlySet<string>
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
