import { PinToggleResult } from "../shared/types";

type LaunchEntry = {
  kind: "launch";
  item: {
    id: string;
  };
};

export function formatPinnedToggleStatus(
  title: string,
  result: PinToggleResult
): string {
  if (result.ok) {
    return result.pinned ? `已置顶：${title}` : `已取消置顶：${title}`;
  }

  const prefix = result.pinned ? "置顶" : "取消置顶";
  switch (result.reason) {
    case "empty-item-id":
      return `${prefix}失败：无效项目`;
    case "missing-catalog-item":
      return `${prefix}失败：当前结果已过期，请重新搜索`;
    case "persist-failed":
      return `${prefix}失败：保存失败，请重试`;
    default:
      return `${prefix}失败`;
  }
}

export function findLaunchEntryIndexByItemId(
  entries: ReadonlyArray<LaunchEntry | { kind: string }>,
  itemId: string
): number {
  const normalizedId = String(itemId ?? "").trim();
  if (!normalizedId) {
    return -1;
  }

  return entries.findIndex(
    (entry) =>
      entry.kind === "launch" &&
      "item" in entry &&
      entry.item?.id === normalizedId
  );
}
