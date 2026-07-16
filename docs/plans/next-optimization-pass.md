<!--
  Source of truth for LiteLauncher planning docs.
  Migrated from Cursor plan: next_optimization_pass_e91b7fba.plan.md
  Local Cursor copy may still exist under ~/.cursor/plans/ — prefer this repo path.
-->
---
name: Next Optimization Pass
overview: 继续优化 LiteLauncher 主程序和首页交互性能，优先做低风险且用户可感知的启动、图标和列表渲染优化，避免继续在收益不明确的区域硬抠。
todos:
  - id: startup-data-layer
    content: 优化启动数据层：减少重复 catalog 写库，优先加载已有数据库索引，后台刷新文件系统索引
    status: completed
  - id: icon-concurrency
    content: 给 IPC 图标解析 attachIcons 增加并发上限，降低首次打开首页的峰值负载
    status: completed
  - id: selection-highlight
    content: 将首页键盘选择从整列表重绘改为局部 active 状态更新
    status: completed
  - id: verify-targeted
    content: 运行类型检查、构建和相关回归测试，确认性能改动不影响功能
    status: completed
isProject: false
---

# 下一轮优化计划

## 优先做

- 启动链路去重与延迟：重点看 `src/main/index.ts` 的 `ensureDataLayer()` 和 `bootstrap()`。当前仍有启动期目录扫描、`saveItems()`/`getItems()` 和后续 `persistCatalogSnapshot()` 重复写库的空间。目标是先从数据库加载已有索引让主窗口更快可用，再后台刷新索引。
- 首页图标解析限流：重点看 `src/main/ipc.ts` 的 `attachIcons()` / `attachIcon()`。当前多个首页 IPC 可能并发触发大量 `app.getFileIcon()`。目标是给图标解析加并发上限，降低首次打开主界面的 CPU/IO 峰值。
- 首页键盘选择轻量更新：重点看 `src/renderer/renderer.ts` 的 `moveSelection()`。当前方向键移动可能触发整列表 `renderList()`，目标是只切换前后两个 item 的选中态。

## 视情况做

- 搜索 worker 状态常驻：看 `src/main/search-worker.ts` 和 `src/main/search-worker-thread.ts`，避免每次搜索都把完整 catalog/usage clone 给 worker。收益中等，但改动比前三项更大。
- 剪贴板工作台面板局部刷新：看 `src/renderer/plugin-panel-impls.ts`，尤其是剪贴板列表选择/详情切换。目标是只刷新详情和 active 状态，不重建整个面板。
- 数据库 WAL/写入优化：看 `src/main/database.ts` 和剪贴板工作台 store，提升多连接读写时的稳定性。需确认 `node:sqlite` 当前行为后再做。

## 暂不建议做

- 继续大改 LiteSnap overlay：主要热点已经优化过，再往下收益很边际。
- 重写搜索算法或迁移 UI 框架：风险大，和当前卡顿点不匹配。
- 关闭剪贴板自动采集：会改变用户体验，不作为性能优化默认方案。

## 验证方式

- 每批改动后跑：`pnpm run typecheck`、`pnpm run build`。
- 主程序路径跑：`node dist/test/launcher-main-flow-regression.test.js`、`node dist/test/plugin-panel-impls-regression.test.js`。
- 涉及 LiteSnap/剪贴板时补跑对应测试：`node dist/test/litesnap-plugin-source.test.js`、`node dist/test/clipboard-workbench-service.test.js`。
- 最后准备发版前跑 `pnpm run test:regression`。