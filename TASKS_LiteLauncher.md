# LiteLauncher 开发任务清单（MVP）

> 来源：`PRD_LiteLauncher.md`  
> 目标平台：Windows 11（MVP）

状态定义：`Todo` / `In Progress` / `Blocked` / `Done`  
负责人示例：`@alice`，未分配统一填 `@待分配`

## Milestone 1：启动器骨架（P0）

| Done | ID | 任务 | Owner | Priority | Status | 验收标准 |
|---|---|---|---|---|---|---|
| [x] | T01 | 初始化 Electron + TypeScript + SQLite 工程骨架 | @待分配 | P0 | Done | 本地可启动、可打包、目录结构稳定 |
| [x] | T02 | 设计 `main/preload/renderer/worker` 分层与 IPC 协议 | @待分配 | P0 | Done | 系统能力仅经 `main` 暴露，IPC 可用 |
| [x] | T03 | 实现唤起窗口（无边框、居中、可置顶） | @待分配 | P0 | Done | 窗口样式与行为符合 PRD |
| [x] | T04 | 全局快捷键 `Alt+Space` 注册与切换显示/隐藏 | @待分配 | P0 | Done | 全屏应用下仍可唤起 |
| [x] | T05 | 输入框与键盘交互（Enter/Esc/↑↓） | @待分配 | P0 | Done | Esc 清空再隐藏、Enter 执行动作 |
| [x] | T06 | 候选列表 UI（图标/标题/副标题/类型） | @待分配 | P0 | Done | 无输入显示 Top10，输入后显示 Top20 |

## Milestone 2：搜索与应用索引（P0）

| Done | ID | 任务 | Owner | Priority | Status | 验收标准 |
|---|---|---|---|---|---|---|
| [x] | T07 | 建表与迁移：`settings/items/usage/clip_items` | @待分配 | P0 | Done | 初始化后自动建表，迁移可重复执行 |
| [x] | T08 | Windows 应用索引器（Start Menu 两目录） | @待分配 | P0 | Done | 能扫描出应用并写入 `items` |
| [x] | T09 | 统一搜索模型（Application/Folder/File/Web/Command） | @待分配 | P0 | Done | 五类结果统一检索、统一渲染 |
| [x] | T10 | 匹配策略：前缀/子串/fuzzy | @待分配 | P0 | Done | 查询结果与 PRD 规则一致 |
| [x] | T11 | 排序评分（match/usage/recency） | @待分配 | P0 | Done | 排序符合 `0.7/0.2/0.1` 权重 |
| [ ] | T12 | 搜索放入 Worker 线程 | @待分配 | P0 | Todo | UI 无阻塞，输入流畅 |
| [x] | T13 | 动作分发器（App/File/Folder/Web 打开） | @待分配 | P0 | Done | 四类目标均可按系统默认方式打开 |
| [x] | T14 | 使用记录回写（`usage`） | @待分配 | P0 | Done | 执行后 `count/lastUsedAt` 正确更新 |

## Milestone 3：文件索引与设置页（P0）

| Done | ID | 任务 | Owner | Priority | Status | 验收标准 |
|---|---|---|---|---|---|---|
| [ ] | T15 | 文件/文件夹索引器（仅扫描用户配置目录） | @待分配 | P0 | Todo | 不做全盘索引，结果可检索 |
| [ ] | T16 | 默认索引类型与默认排除规则 | @待分配 | P0 | Todo | `.md/.txt/.pdf/.docx/.xlsx` 与排除目录规则生效 |
| [ ] | T17 | 索引重建能力（设置页按钮触发） | @待分配 | P0 | Todo | 手动重建成功且可观察状态 |
| [ ] | T18 | 设置页：基础设置（快捷键、开机自启） | @待分配 | P0 | Todo | 快捷键冲突检测有效 |
| [ ] | T19 | 设置页：索引设置（目录管理、排除规则） | @待分配 | P0 | Todo | 增删改后可立即影响索引 |
| [ ] | T20 | 设置页：行为设置（执行后隐藏、置顶、候选数量） | @待分配 | P0 | Todo | 配置可持久化并生效 |

## Milestone 4：内置命令与剪贴板（P0）

| Done | ID | 任务 | Owner | Priority | Status | 验收标准 |
|---|---|---|---|---|---|---|
| [x] | T21 | 内置命令解析与路由（`calc/clip/settings/exit`） | @待分配 | P0 | Done | 四个命令均可触发对应行为 |
| [x] | T22 | `calc <expr>` 计算并复制结果 | @待分配 | P0 | Done | 常见表达式正确，复制成功 |
| [ ] | T23 | 系统剪贴板监听（仅文本） | @待分配 | P0 | Todo | 可持续采集文本，不采集非文本 |
| [ ] | T24 | 剪贴板历史存储（最近 N 条，默认 50） | @待分配 | P0 | Todo | 超限自动淘汰，去重可用 |
| [ ] | T25 | `clip` 视图与操作（搜索/回车复制/删单条/清空） | @待分配 | P0 | Todo | 四类操作均稳定可用 |

## Milestone 5：非功能与发布（P0/P1）

| Done | ID | 任务 | Owner | Priority | Status | 验收标准 |
|---|---|---|---|---|---|---|
| [x] | T26 | 安全加固（renderer 禁 Node、最小 preload API） | @待分配 | P0 | Done | 安全策略符合 PRD |
| [ ] | T27 | 性能达标优化与埋点 | @待分配 | P0 | Todo | 唤起 ≤150ms；Top20 刷新 ≤50ms；动作 ≤300ms |
| [ ] | T28 | 稳定性保障（崩溃不丢配置、索引可恢复） | @待分配 | P0 | Todo | 异常后配置仍在，可重建索引 |
| [ ] | T29 | 自动化测试（匹配/排序/命令/索引/动作） | @待分配 | P1 | Todo | 核心链路具备可重复回归测试 |
| [ ] | T30 | Windows 11 打包发布与安装验证 | @待分配 | P1 | Todo | 可安装、可运行、可自启配置 |

## 非 MVP（Backlog）

| Done | ID | 任务 | Owner | Priority | Status | 说明 |
|---|---|---|---|---|---|---|
| [ ] | B01 | 插件系统（JS） | @待分配 | P2 | Todo | PRD 未来扩展项 |
| [ ] | B02 | OCR / 截图 / 翻译 | @待分配 | P2 | Todo | PRD 未来扩展项 |
| [ ] | B03 | AI Tool Calling | @待分配 | P2 | Todo | PRD 未来扩展项 |
| [ ] | B04 | 本地知识库 / RAG | @待分配 | P2 | Todo | PRD 未来扩展项 |
