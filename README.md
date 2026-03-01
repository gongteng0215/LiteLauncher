# LiteLauncher

LiteLauncher is a lightweight desktop launcher built with `Electron + TypeScript + SQLite`.
It focuses on one fast flow: **invoke -> search -> run**, and includes plugin support (Password Generator and Cashflow Lite game).
Last updated: 2026-03-01

---

## English

### Overview

LiteLauncher provides a unified search and execution interface for apps, files, folders, web actions, and built-in commands.
It is optimized for quick keyboard use while still supporting mouse interaction and context menu actions.

### Features

- Global shortcut invoke (default `Alt+Space`, auto fallback on conflict)
- Unified search and run for apps, folders, files, web, and commands
- Sectioned homepage: `Recent`, `Pinned`, `Plugins`
- Right-click context menu on results:
  - Pin / unpin
  - Run as administrator (Windows)
  - Open containing folder
- Pinned and plugin sections remain visible during search
- Better Chinese search behavior:
  - Initial matching (e.g. `b` -> `百度`)
  - Pinyin fragment matching (e.g. `bai` -> `百度`)
  - Reduced noisy fallback for random long input
- Clipboard history panel (search, copy, delete, clear)
- Settings panel:
  - Display limits for recent/pinned/plugins/search results
  - Launch at login (Windows/macOS)
- Dynamic window size presets (`compact` / `cashflow`)
- Plugin architecture with isolated modules per plugin
- Built-in plugins:
  - Password Generator (visual panel, length/symbol/count options)
  - Cashflow Lite (round-based finance game with AI opponents and persistence)
- App icon and tray icon support
- Better Windows shortcut icon resolving (real target first, system associated icon fallback)
- Cross-platform packaging scripts:
  - Windows: NSIS / Portable / zip
  - macOS: dmg / zip

### Requirements

- Windows 11 (primary target)
- macOS (supported for development and usage)
- Node.js 22 LTS (recommended)
- pnpm 10+

### Quick Start

Install dependencies:

```bash
pnpm install
```

Build:

```bash
pnpm run build
```

Run:

```bash
pnpm start
```

Type check:

```bash
pnpm run typecheck
```

Cashflow tests:

```bash
pnpm run test:cashflow
```

### Built-in Input Commands

Type in the main search box:

- `calc 1+2*3`: calculate and copy result
- `g ChatGPT`: Google search
- `clip`: open clipboard panel
- `settings`: open settings panel
- `pwd`: open password generator panel
- `cashflow` / `cash` / `cf` / `现金流`: open Cashflow Lite
- `cash stat`: show cashflow stats
- `cash ai`: enable AI mode
- `cash review`: review entry (placeholder)
- `exit`: quit app

### Cashflow Lite Plugin

Current support includes:

- Role selection and turn progression
- Opportunity purchase (cash or loan) and skip
- Asset accumulation and passive income growth
- Financial reports (income, expense, balance sheet, metrics)
- Big Deal opportunities
- AI players simulation
- Win / loss conditions
- SQLite persistence and restore

### Packaging

Prerequisite for `sqlite3` on Windows: C++ build tools.

- Recommended: Visual Studio 2022 Build Tools
- Install workload: `Desktop development with C++`

Generic package directory:

```powershell
pnpm.cmd run pack
```

Windows installer + zip:

```powershell
pnpm.cmd run dist:win
```

Windows portable:

```powershell
pnpm.cmd run dist:win:portable
```

macOS packages (run on macOS):

```bash
pnpm run dist:mac
pnpm run dist:mac:arm64
pnpm run dist:mac:x64
```

Output directory: `release/`

### Troubleshooting

1. Electron install issue:

```powershell
Remove-Item -Recurse -Force node_modules
pnpm install
```

2. App seems unchanged after restarting `pnpm start`:

- LiteLauncher is tray-resident and single-instance.
- For main-process changes, fully exit first (`exit` command or tray menu), then start again.

### Project Structure

```text
src/
  main/       # Main process (window, IPC, database, plugins)
  preload/    # Bridge layer
  renderer/   # UI layer
  shared/     # Shared types and channels
scripts/
  copy-assets.cjs
docs/
  cashflow-game/
```

### Documents

- `PRD_LiteLauncher.md`
- `TASKS_LiteLauncher.md`
- `docs/cashflow-game/cashflow-prd.md`
- `docs/cashflow-game/cashflow-tasks.md`
- `docs/cashflow-game/cashflow-mvp-regression.md`

---

## 中文

### 项目简介

LiteLauncher 是一个基于 `Electron + TypeScript + SQLite` 的轻量桌面启动器，目标是把高频操作压缩成一条链路：**唤起 -> 搜索 -> 执行**。
当前已支持插件化扩展，内置密码生成器与富爸爸现金流游戏插件。

### 核心功能

- 全局快捷键唤起（默认 `Alt+Space`，冲突自动回退）
- 统一搜索执行：应用、文件夹、文件、网页、命令
- 首页分区：`最近访问`、`置顶`、`插件`
- 结果右键菜单：
  - 置顶 / 取消置顶
  - 管理员运行（Windows）
  - 打开所在位置
- 搜索状态下保留 `置顶` 和 `插件` 分区
- 中文搜索增强：
  - 首字母匹配（如 `b` 匹配 `百度`）
  - 拼音片段匹配（如 `bai` 匹配 `百度`）
  - 降低长串乱输入导致的误匹配
- 剪贴板历史（搜索、复制、删除、清空）
- 设置页面：
  - 最近/置顶/插件/搜索结果显示数量
  - 开机启动（Windows/macOS）
- 窗口尺寸预设（`compact` / `cashflow`）与动态适配
- 插件模块化（每个插件独立目录）
- 已实现插件：
  - 密码生成器（可视化面板，长度/特殊符号/生成数量）
  - Cashflow Lite（现金流游戏、AI 对战、存档与统计）
- 应用图标与托盘图标支持
- Windows 快捷方式图标解析增强（优先真实目标图标，失败时回退系统关联图标）
- 跨平台打包脚本（Windows + macOS）

### 环境要求

- Windows 11（主目标平台）
- macOS（已支持开发与基础体验）
- Node.js 22 LTS（建议）
- pnpm 10+

### 开发与运行

安装依赖：

```bash
pnpm install
```

构建：

```bash
pnpm run build
```

启动：

```bash
pnpm start
```

类型检查：

```bash
pnpm run typecheck
```

Cashflow 测试：

```bash
pnpm run test:cashflow
```

### 常用输入命令

在主搜索框输入：

- `calc 1+2*3`：计算并复制结果
- `g ChatGPT`：Google 搜索
- `clip`：打开剪贴板面板
- `settings`：打开设置页
- `pwd`：打开密码生成器
- `cashflow` / `cash` / `cf` / `现金流`：打开现金流游戏
- `cash stat`：查看现金流统计
- `cash ai`：开启 AI 对战
- `cash review`：复盘入口（占位）
- `exit`：退出程序

### Cashflow 插件说明

当前支持：

- 职业开局与回合推进
- 机会买入（现金/贷款）与跳过
- 资产累计与被动收入增长
- 财务报表（收入、支出、资产负债、指标）
- Big Deal 机会
- AI 玩家推进
- 胜负判定
- SQLite 存档与恢复

### 本地打包

Windows 下 `sqlite3` 需要 C++ 构建环境：

- 推荐安装 Visual Studio 2022 Build Tools
- 勾选 `Desktop development with C++`

目录打包（不生成安装器）：

```powershell
pnpm.cmd run pack
```

Windows 安装版 + zip：

```powershell
pnpm.cmd run dist:win
```

Windows 便携版：

```powershell
pnpm.cmd run dist:win:portable
```

macOS（需在 macOS 本机执行）：

```bash
pnpm run dist:mac
pnpm run dist:mac:arm64
pnpm run dist:mac:x64
```

产物目录：`release/`

### 常见问题

1. Electron 安装失败：

```powershell
Remove-Item -Recurse -Force node_modules
pnpm install
```

2. 改了主进程代码后 `pnpm start` 看起来没变化：

- LiteLauncher 是托盘常驻 + 单实例应用。
- 涉及主进程修改时，请先完全退出（`exit` 或托盘菜单退出）再重新启动。

### 项目结构

```text
src/
  main/       # 主进程（窗口、IPC、数据库、插件）
  preload/    # 桥接层
  renderer/   # 渲染层 UI
  shared/     # 共享类型与通道
scripts/
  copy-assets.cjs
docs/
  cashflow-game/
```

### 文档索引

- `PRD_LiteLauncher.md`
- `TASKS_LiteLauncher.md`
- `docs/cashflow-game/cashflow-prd.md`
- `docs/cashflow-game/cashflow-tasks.md`
- `docs/cashflow-game/cashflow-mvp-regression.md`

## License

ISC
