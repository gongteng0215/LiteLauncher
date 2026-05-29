import { PinToggleResult } from "../shared/types";

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
