<!--
  Source of truth for LiteLauncher planning docs.
  Migrated from Cursor plan: performance_followup_eade540e.plan.md
  Local Cursor copy may still exist under ~/.cursor/plans/ — prefer this repo path.
-->
---
name: Performance Followup
overview: 继续做三项中等风险的整体性能优化，重点减少搜索输入时的数据克隆、剪贴板工作台交互时的 DOM 重建，并谨慎改善 SQLite 写入稳定性。
todos:
  - id: persistent-search-worker
    content: 将搜索 worker 改为常驻 catalog / usage 状态，搜索请求只传轻量参数
    status: completed
  - id: clipboard-workbench-partial-refresh
    content: 优化剪贴板工作台列表选择和详情切换，避免不必要的整面板重建
    status: completed
  - id: sqlite-write-pragmas
    content: 评估并应用 SQLite WAL / busy timeout 等低风险写入稳定性优化
    status: completed
  - id: verify-performance-followup
    content: 运行类型检查、构建和相关回归测试
    status: completed
isProject: false
---

# 性能优化后续计划

## 优先级

1. 搜索 worker 状态常驻
- 修改 [src/main/search-worker.ts](src/main/search-worker.ts) 和 [src/main/search-worker-thread.ts](src/main/search-worker-thread.ts)。
- 将 worker 请求从“每次携带完整 `catalog` / `usage`”改为“先同步状态，再发送轻量搜索请求”。
- 在 catalog 初始化、后台刷新、重建索引、使用次数变化后同步最新状态给 worker。
- 保留超时和错误回退逻辑，避免 worker 状态异常影响搜索可用性。

2. 剪贴板工作台局部刷新
- 重点检查 [src/renderer/plugin-panel-impls.ts](src/renderer/plugin-panel-impls.ts) 中剪贴板工作台的列表、选中项、详情区域渲染。
- 将记录选择 / 详情切换从整面板重建改为只更新 active 行和右侧详情。
- 保持新增记录、删除记录、搜索 / 过滤等结构性变化仍走完整刷新，降低改动风险。

3. 数据库 WAL / 写入优化
- 检查 [src/main/database.ts](src/main/database.ts) 与剪贴板工作台 store 的 SQLite 使用方式。
- 在确认 `node:sqlite` 支持行为后，考虑启用合适的 PRAGMA，例如 WAL、busy timeout、同步级别等。
- 避免激进改动事务模型，优先提升多连接读写稳定性和降低短时锁等待。

## 验证方式

- 先跑 `pnpm run typecheck`。
- 再跑 `pnpm run build`。
- 跑主程序与面板相关回归：`node dist/test/launcher-main-flow-regression.test.js`、`node dist/test/plugin-panel-impls-regression.test.js`。
- 涉及剪贴板服务或 store 时补跑：`node dist/test/clipboard-workbench-service.test.js`、相关 clipboard workbench 测试。
- 如果数据库 PRAGMA 改动较明显，再补充针对数据库初始化 / store 行为的回归断言。