# LiteLauncher

LiteLauncher 是一个基于 `Electron + TypeScript + SQLite` 的轻量桌面启动器，核心目标是“快速唤起 + 搜索 + 执行”，并内置 Cashflow 财商训练插件。

## 当前能力

- 全局快捷键唤起（默认 `Alt+Space`，冲突自动回退）
- 统一搜索与执行：应用、文件夹、文件、网页、命令
- macOS 应用搜索增强：目录扫描 + Spotlight（`mdfind`）应用索引兜底
- macOS 应用图标显示：支持从 `.app` 的 `.icns` 提取真实图标
- 首页分区：最近访问、置顶、插件
- 最近访问按实际使用记录生成（按最近使用时间排序）
- 结果右键置顶/取消置顶（持久化）
- 剪贴板历史（搜索、复制、删除、清空）
- 主窗口尺寸按当前显示器分辨率动态调整（含 `compact` / `cashflow` 预设）
- 设置页：
  - 搜索显示数量配置（最近/置顶/插件/搜索结果）
  - 开机启动开关（Windows/macOS）
- 插件：
  - 密码生成器（可视化面板）
  - Cashflow Lite（现金流游戏、AI 对战、统计入口）
- 跨平台打包脚本：Windows（NSIS/Portable/zip）+ macOS（dmg/zip）
- GitHub Actions 自动发布：`v*` tag 构建并上传 GitHub Release 资产

## 环境要求

- Windows 11（主目标平台）
- macOS（开发与体验已支持：应用搜索、图标、开机启动、Spotlight 应用索引兜底）
- Node.js 22 LTS（建议）
- pnpm 10+

## 开发与运行

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

## 常用输入命令

在主搜索框输入：

- `calc 1+2*3`：计算并复制结果
- `g ChatGPT`：Google 搜索
- `clip`：打开剪贴板历史
- `settings`：打开设置页面
- `pwd`：打开密码生成器
- `cashflow` / `cash` / `cf` / `现金流`：打开现金流游戏
- `cash stat`：查看现金流统计
- `cash ai`：开启 AI 对战
- `cash review`：复盘入口（占位）
- `exit`：退出程序

## Cashflow 插件说明

当前 Cashflow 已支持：

- 职业开局与回合推进
- 机会买入（现金买入 / 贷款买入）与跳过
- 资产累计、现金流与关键指标
- 财务报表（收入、支出、资产负债）
- Big Deal 机会
- AI 玩家并行推进
- 胜利 / 失败判定
- SQLite 存档恢复（失败存档自动重开）

交互：

- `Enter`：推进一回合
- `Esc`：返回主搜索页
- 从 Cashflow 返回后，窗口会自动回到主页面紧凑尺寸

## 打包（本地）

先确保本机有 C++ 编译环境（给 `sqlite3` 使用）：

- 推荐安装 Visual Studio 2022 Build Tools
- 组件勾选 `Desktop development with C++`

通用目录打包（不生成安装器）：

```powershell
pnpm.cmd run pack
```

Windows 安装版（NSIS + zip）：

```powershell
pnpm.cmd run dist:win
```

Windows 便携版：

```powershell
pnpm.cmd run dist:win:portable
```

macOS（本地需要在 macOS 环境执行）：

```bash
pnpm run dist:mac
pnpm run dist:mac:arm64
pnpm run dist:mac:x64
```

产物目录：`release/`

常见产物：

- Windows：`LiteLauncher Setup x.y.z.exe`、`LiteLauncher x.y.z.exe`、`*.zip`
- macOS：`*.dmg`、`*.zip`
- 自动更新元数据：`latest.yml`（Windows）、`latest-mac.yml`（macOS）
- 增量更新映射：`*.blockmap`

## GitHub Release（手动 + 自动）

### 自动发布（推荐）

已接入 GitHub Actions 工作流：`/.github/workflows/build-desktop.yml`

- `workflow_dispatch`：手动触发，仅上传到 Actions Artifacts
- `push tags: v*`：触发 Windows/macOS 构建，并在完成后自动上传到对应 GitHub Release

说明：

- Intel macOS 构建使用 `macos-12` runner（`MACOSX_DEPLOYMENT_TARGET=12.0`），GitHub 队列可能较慢
- 工作流会自动创建 Release（若不存在）并上传产物
- 两个 macOS job 都会生成 `latest-mac.yml`，因文件名冲突，当前自动上传阶段跳过该文件（保留 `dmg/zip/blockmap`）

### 手动发布（备用）

示例（Windows 产物）：

```powershell
gh release create v1.0.4 release/*.exe release/*.zip release/latest.yml release/*.blockmap -t "LiteLauncher v1.0.4" -n "Windows build"
```

说明：

- `latest.yml`：Windows 自动更新读取的版本与下载信息
- `latest-mac.yml`：macOS 自动更新元数据（arm64/x64 默认同名，手动上传时建议区分或仅保留目标架构）
- `*.blockmap`：用于增量更新，减少下载体积

## 常见问题

### 1. Electron failed to install correctly

```powershell
Remove-Item -Recurse -Force node_modules
pnpm install
```

如果仍失败，检查是否禁用了依赖脚本（Electron 的 postinstall 需要执行）。

### 2. 打包时报 `electron` 只能在 `devDependencies`

请确保 `package.json` 中：

- `dependencies` 不包含 `electron`
- `devDependencies` 包含 `electron`

### 3. `Ctrl+C` 退出时 VSCode 一起关闭

这是同一控制台会话的信号联动，不是 LiteLauncher 主动关闭 VSCode。建议在 VSCode 集成终端中单独运行 `pnpm start`。

### 4. 改了主进程代码后重新 `pnpm start` 看起来没变化

LiteLauncher 是托盘常驻 + 单实例应用。再次执行 `pnpm start` 在开发态通常只会命中已有进程并刷新渲染层，不会重启主进程。

涉及主进程逻辑的修改（如应用索引、图标提取、窗口尺寸策略）请先彻底退出：

- 在 LiteLauncher 输入 `exit`
- 或从托盘菜单退出

然后再执行 `pnpm start`。

## 项目结构

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

## 文档索引

- `PRD_LiteLauncher.md`
- `TASKS_LiteLauncher.md`
- `docs/cashflow-game/cashflow-prd.md`
- `docs/cashflow-game/cashflow-tasks.md`
- `docs/cashflow-game/cashflow-mvp-regression.md`

## License

ISC
