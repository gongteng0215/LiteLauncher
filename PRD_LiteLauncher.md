# LiteLauncher 产品需求文档（PRD）

更新时间：2026-03-29
适用版本：LiteLauncher `v1.0.12`

## 1. 产品目标

- 产品名称：LiteLauncher
- 平台：Windows 11（主）、macOS（开发与打包模板支持）
- 技术栈：Electron + TypeScript + SQLite
- 定位：轻量、快速、可扩展的桌面启动器
- 核心目标：稳定形成“唤起 -> 输入 -> 搜索 -> 执行”的闭环

## 2. 目标用户与场景

### 2.1 目标用户

- 办公用户：高频打开应用、文档、网页
- 开发用户：快速切换工具、命令和插件
- 效率用户：希望把常用动作收束到统一入口

### 2.2 典型场景

1. `Alt+Space` 唤起后输入应用名直接启动。
2. `g 关键词` 立即网页搜索。
3. `calc 表达式` 快速计算并复制结果。
4. `clip` 搜索并复用剪贴板内容。
5. `cash` 打开 Cashflow Lite 继续当前对局。
6. `wt-jwt` 打开 JWT 调试器进行解析或签名。
7. `wt-time` 打开时间戳工具进行 Unix / 日期互转。
8. `wt-qr` 打开二维码生成面板。
9. `wt-md` 打开 Markdown 预览工具。
10. 输入 `codex` 命中并启动 Windows 应用别名。

## 3. 当前能力范围

### 3.1 已实现能力

#### 3.1.1 唤起与窗口

- 全局快捷键默认 `Alt+Space`
- 冲突自动回退：`Ctrl+Space`、`Alt+Shift+Space`、`Ctrl+Alt+Space`
- 单实例窗口显示 / 隐藏切换
- 托盘菜单：显示主窗口、退出
- 开发态支持 `--replace-instance`，避免旧主进程残留

#### 3.1.2 搜索与执行

- 统一搜索应用、文件、文件夹、网页、命令、插件
- 搜索分区：
  - 空输入：最近访问 / 置顶 / 插件
  - 非空输入：搜索结果 / 置顶 / 插件
- 搜索加载态、输入防抖、结果分页
- 图标网格展示与方向键导航
- 结果卡片右键动作：置顶 / 取消置顶、管理员运行、打开所在位置
- 搜索范围前缀：`app:` / `cmd:` / `web:` / `plugin:`
- 中文搜索增强：首字母、拼音片段、别名映射
- Windows 命令与应用别名支持：
  - PATH 命令别名
  - StartApps / WindowsApps 激活
  - 典型条目：`codex`
- 同目标搜索结果去重，优先保留图标和信息更完整的条目

#### 3.1.3 索引与设置

- 设置页分组：搜索显示 / 索引扫描 / 系统 / 错误日志
- 可配置最近、置顶、插件、搜索结果的显示数量
- 可配置索引扫描源：Program Files / 自定义目录
- 可配置扫描排除目录
- 可配置结果白名单 / 黑名单目录
- 设置页可直接重建索引
- 支持开机启动开关（Windows / macOS）
- 错误日志可查看与清空

#### 3.1.4 插件体系

- 插件统一走 `command:plugin:*` 协议
- 当前默认可见插件 21 个
- 20 个 WebTools 插件已全部接入并开放
- 插件原生动作期间支持暂停自动隐藏
- 多行输入统一为：
  - `Enter` 换行
  - `Ctrl+Enter` 执行
  - `Esc` 返回

#### 3.1.5 质量与开发

- `pnpm dev` 支持增量编译、主进程重启、渲染层刷新
- 已有自动回归：
  - 搜索与设置回归
  - 主流程回归
  - Windows 应用别名回归
  - 路径规则回归
  - 插件可见性回归
  - 第一版 Playwright UI smoke

### 3.2 当前默认可见插件

1. `cashflow-game`
2. `webtools-password`
3. `webtools-cron`
4. `webtools-json`
5. `webtools-crypto`
6. `webtools-jwt`
7. `webtools-timestamp`
8. `webtools-strings`
9. `webtools-colors`
10. `webtools-diff`
11. `webtools-http-mock`
12. `webtools-image-base64`
13. `webtools-config-convert`
14. `webtools-sql-format`
15. `webtools-unit-convert`
16. `webtools-regex`
17. `webtools-url-parse`
18. `webtools-qrcode`
19. `webtools-markdown`
20. `webtools-ua`
21. `webtools-api-client`

## 4. 非功能要求

### 4.1 性能

- 唤起：目标 <= 150ms
- 前 20 条搜索刷新：目标 <= 50ms
- 执行动作反馈：目标 <= 300ms（依赖系统项除外）

### 4.2 稳定性

- 快捷键、置顶、历史、设置可持久化
- 插件异常不应拖垮主搜索
- 搜索模式与插件模式切换时窗口尺寸稳定
- 运行异常应写入统一错误日志
- 原生文件选择、下载等动作期间窗口不应因为失焦直接隐藏

### 4.3 安全

- Renderer 禁用 Node 能力
- 系统能力仅由 Main 进程执行
- Preload 只暴露最小 API

## 5. 当前风险与问题

1. 部分插件仍处于“可用但未完全齐平原版”的状态。
2. `src/renderer/renderer.ts` 体量仍大，插件渲染逻辑集中。
3. 小窗口与高 DPI 下仍需逐项回归插件面板。
4. UI 文案与历史编码问题需要继续巡检。

## 6. 下一阶段目标

### 6.1 第一优先级

1. 扩展 Playwright UI E2E，覆盖更多插件主流程。
2. 继续拆分插件面板注册与渲染逻辑。
3. 完成插件小屏与高 DPI 专项回归。

### 6.2 第二优先级

1. 落地 Cashflow `cash review` 复盘模块。
2. 继续收敛 WebTools 功能齐平与交互一致性。
3. 继续完善文案与编码清理。

## 7. 版本路线

1. `v1.1`：E2E 扩展、插件面板拆分、小屏稳定性提升。
2. `v1.2`：Cashflow 复盘 + AI 多性格策略。
3. `v2.x`：插件生态、自动更新闭环、签名与公证完善。