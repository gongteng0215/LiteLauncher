# WebTools 功能插件化迁移规划（LiteLauncher）

更新时间：2026-03-04  
状态：规划中

## 当前进展（2026-03-04）

1. 已在 `src/main/plugins/` 下创建 19 个 WebTools 插件独立目录（与 `cashflow-game`、`password-generator` 同级）。
2. 已完成主进程统一插件工厂 `src/main/plugins/webtools-shared/index.ts`，并注册到插件索引。
3. 已打通 `openPanel -> panel=plugin` 通用渲染面板链路，并支持按 `pluginId` 分发渲染与 `Enter` 行为。
4. 已完成首个真实可视化插件：`webtools-password`（长度/数量/符号配置，生成并复制）。

## 1. 背景

当前 `webtools` 是独立前端工程，直接整包嵌入 LiteLauncher 会带来以下问题：

1. UI 与交互风格不一致（与现有搜索页/插件面板割裂）。
2. 技术栈不一致（额外构建链路、运行时依赖和调试复杂度上升）。
3. 与现有插件机制兼容性差（`openPanel`、IPC、统一状态管理无法复用）。

结论：不走“整包复制 + 外挂窗口”路线，改为“按 LiteLauncher 插件规范逐个迁移 19 个工具”。

## 2. 目标与边界

### 2.1 目标

1. 19 个工具全部以 LiteLauncher 原生插件风格实现。
2. 每个工具独立模块，可单独开发、测试、开关与迭代。
3. 复用现有插件执行链路：`command:plugin:*` + `openPanel`。
4. 保持现有 UI 视觉与交互一致（输入框、网格、状态栏、键盘行为）。

### 2.2 非目标

1. 不直接嵌入 `webtools` 的 Vue 页面与路由系统。
2. 不在 LiteLauncher 内引入第二套前端框架运行时。
3. 本阶段不做插件市场，只做内置插件模块化。

## 3. 统一风格约束（必须满足）

1. 目录规范：每个插件一个目录，禁止把 19 个工具写进同一个巨型文件。
2. 主进程规范：每个插件暴露 `LauncherPlugin`，支持 `createCatalogItems/getQueryItems/execute`。
3. 渲染层规范：走现有面板机制，新增插件面板注册，不再新增独立 BrowserWindow。
4. 数据规范：需要持久化的配置放 SQLite `settings`，临时态只留在内存。
5. 交互规范：`Enter` 执行主动作，`Esc` 返回搜索页，状态栏给出明确反馈。
6. 文案规范：中文优先，命令关键词支持中英混合搜索。

## 4. 目标目录结构

```text
src/main/plugins/
  webtools-password/
  webtools-cron/
  webtools-json/
  ...
src/renderer/plugins/
  webtools-password/
  webtools-cron/
  webtools-json/
  ...
src/shared/plugins/
  webtools-password.ts
  webtools-cron.ts
  webtools-json.ts
  ...
```

## 5. 19 个工具迁移清单

1. 密码生成器（password）
2. Cron 生成器（cron）
3. JSON/CSV（json）
4. 加密助手（crypto）
5. JWT 调试（jwt）
6. 时间戳转换（timestamp）
7. 正则测试（regex）
8. 字符串工具（strings）
9. 颜色工具（colors）
10. 文本 Diff（diff）
11. 图片/Base64（image-base64）
12. 配置转换（config-convert）
13. SQL 格式化（sql-format）
14. 单位换算（unit-convert）
15. URL 解析（url-parse）
16. 二维码生成（qrcode）
17. Markdown 预览（markdown）
18. UA 解析（ua）
19. API Client（api-client）

## 6. 分阶段任务（建议顺序）

### 阶段 A：插件底座改造（先做）

1. WTM-001：渲染层插件面板注册器（替代 `renderer.ts` 内硬编码分支）。
2. WTM-002：插件 UI 公共组件（表单区、结果区、状态提示、复制按钮）。
3. WTM-003：插件配置存取接口（读写 `settings`，支持默认值合并）。
4. WTM-004：插件动作协议统一（主动作/次动作/键盘映射）。

### 阶段 B：高频与低风险工具（先拿结果）

1. WTM-101：密码生成器
2. WTM-102：时间戳转换
3. WTM-103：正则测试
4. WTM-104：字符串工具
5. WTM-105：URL 解析
6. WTM-106：二维码生成

### 阶段 C：中复杂度工具

1. WTM-201：JSON/CSV
2. WTM-202：文本 Diff
3. WTM-203：单位换算
4. WTM-204：配置转换
5. WTM-205：SQL 格式化
6. WTM-206：颜色工具
7. WTM-207：图片/Base64

### 阶段 D：高复杂度工具

1. WTM-301：加密助手
2. WTM-302：JWT 调试
3. WTM-303：API Client（含请求历史与错误处理）
4. WTM-304：Markdown 预览（安全渲染）
5. WTM-305：UA 解析
6. WTM-306：Cron 生成器

### 阶段 E：收尾与质量

1. WTM-401：19 工具统一交互走查（键盘、焦点、Esc 返回）。
2. WTM-402：搜索关键词补齐（中文/拼音/英文别名）。
3. WTM-403：性能与体积基线（面板首开、切换耗时、包体变化）。
4. WTM-404：文档与 README 更新（用法、命令、截图）。

## 7. 验收标准

1. 不依赖外部 `webtools` 工程即可构建和运行 LiteLauncher。
2. 每个工具都能通过命令搜索命中并打开对应面板。
3. 所有工具满足 `Enter/Esc` 基本行为，不破坏现有搜索体验。
4. 不新增不必要的全局依赖，不引入第二套主 UI 框架。
5. 新增代码通过 `pnpm run build`，关键工具有最小测试覆盖。
