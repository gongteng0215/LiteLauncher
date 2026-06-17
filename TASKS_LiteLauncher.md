# LiteLauncher 开发任务清单

更新时间：2026-06-17
来源：`PRD_LiteLauncher.md`

状态：`待办` / `进行中` / `阻塞` / `完成`  
优先级：`P0`（必须）/ `P1`（重要）/ `P2`（增强）

## 1. 核心能力

| 完成 | 编号 | 任务 | 优先级 | 状态 | 备注 |
|---|---|---|---|---|---|
| [x] | LL-001 | Electron + TypeScript + SQLite 工程骨架 | P0 | 完成 | 可构建可运行 |
| [x] | LL-002 | 主进程 / 预加载 / 渲染层 IPC 分层 | P0 | 完成 | 最小权限桥接 |
| [x] | LL-003 | 全局快捷键唤起与回退 | P0 | 完成 | 默认 `Alt+Space` |
| [x] | LL-004 | 主窗口行为（无边框、置顶、托盘常驻） | P0 | 完成 | 显示/隐藏稳定 |
| [x] | LL-005 | 搜索结果网格与键盘导航 | P0 | 完成 | Enter/Esc/方向键 |
| [x] | LL-006 | Windows 开始菜单索引 | P0 | 完成 | 应用扫描可用 |
| [x] | LL-007 | 排序评分（匹配/使用/最近） | P0 | 完成 | `0.7/0.2/0.1` |
| [x] | LL-008 | 动态命令（`g` / `calc`） | P0 | 完成 | 查询时生成候选 |
| [x] | LL-009 | 执行动作分发（应用/文件/命令） | P0 | 完成 | 主进程统一执行 |
| [x] | LL-010 | 置顶能力与持久化 | P0 | 完成 | 支持右键置顶；动态 Windows Store / StartApps / PATH alias 应用（如 `Codex`）可置顶、保存并重新解析 |
| [x] | LL-011 | 剪贴板历史（采集 / 检索 / 复制 / 清空） | P0 | 完成 | SQLite 持久化 |
| [x] | LL-012 | 设置页显示数量配置 | P0 | 完成 | 5~50 范围 |
| [x] | LL-013 | 设置页开机启动开关 | P0 | 完成 | Win / macOS |
| [x] | LL-014 | 索引扫描源配置（Program Files / 自定义目录） | P0 | 完成 | 设置页可配置 |
| [x] | LL-015 | 索引重建入口 | P0 | 完成 | 设置页按钮 + `command:reindex` |
| [x] | LL-016 | 搜索结果分页与加载反馈 | P0 | 完成 | 支持翻页与检索态反馈 |
| [x] | LL-017 | 中文拼音与别名搜索增强 | P0 | 完成 | `b/bai -> 百度` |
| [x] | LL-018 | 搜索态保留置顶与插件分区 | P1 | 完成 | 同屏展示 |
| [x] | LL-019 | 搜索结果右键动作菜单 | P0 | 完成 | 置顶 / 管理员 / 所在位置 |
| [x] | LL-020 | Windows 快捷方式图标解析增强 | P1 | 完成 | 目标程序图标优先 |
| [x] | LL-021 | 统一错误日志记录与查看 | P0 | 完成 | Main / Renderer / IPC / 执行链路；设置页更新说明支持受限富文本显示，避免 release notes HTML 标签直出 |
| [x] | LL-022 | 设置页分组化重构 | P1 | 完成 | 搜索 / 索引 / 系统 / 错误日志 |
| [x] | LL-023 | 管理员运行结果回传 | P1 | 完成 | 区分授权弹出 / 取消 / 失败 |
| [x] | LL-024 | 搜索范围前缀过滤 | P1 | 完成 | `app:` / `cmd:` / `web:` / `plugin:` |
| [x] | LL-025 | 索引扫描排除目录 | P1 | 完成 | 设置页黑名单目录 |
| [x] | LL-026 | 结果级目录白名单 / 黑名单 | P1 | 完成 | 搜索 / 最近 / 置顶统一生效 |
| [x] | LL-027 | 开发模式 `pnpm dev` | P0 | 完成 | 自动编译、主进程重启、渲染层刷新 |
| [x] | LL-028 | 单实例替换启动链路 | P0 | 完成 | `--replace-instance` 避免旧主进程残留 |
| [x] | LL-029 | Windows 命令 / StartApps / WindowsApps 命中 | P0 | 完成 | 典型场景：`codex` |
| [x] | LL-030 | 同目标结果去重与图标优先策略 | P1 | 完成 | 同一 target 合并，优先保留完整项 |
| [x] | LL-031 | 插件原生交互防隐藏 | P1 | 完成 | 文件选择 / 下载期间暂停自动隐藏 |

## 2. 插件任务

### 2.1 已开放默认可见插件（当前 26 个）

| 完成 | 编号 | 任务 | 优先级 | 状态 | 备注 |
|---|---|---|---|---|---|
| [x] | LL-202 | Cashflow Lite 基础玩法闭环 | P0 | 完成 | 开局 / 回合 / 胜负 |
| [x] | LL-203 | Cashflow 报表与指标 | P0 | 完成 | 收入 / 支出 / 资产负债 |
| [x] | LL-204 | Cashflow 持久化恢复 | P0 | 完成 | 重启恢复 |
| [x] | LL-205 | Cashflow AI 入口 | P1 | 完成 | `cash ai` |
| [x] | LL-206 | Cashflow 统计入口 | P1 | 完成 | `cash stat` |
| [x] | LL-209 | 硬件检测插件 | P1 | 完成 | `hardware-inspector` 默认可见，支持刷新、变化对比、Markdown / HTML 报告导出 |
| [x] | LL-211 | WebTools 密码工具 | P0 | 完成 | 可视化配置与批量生成 |
| [x] | LL-212 | WebTools Cron 工具 | P0 | 完成 | 解析 + 下次执行时间 |
| [x] | LL-213 | WebTools JSON 工具 | P0 | 完成 | JSON / CSV / Text / Escaped 转换 |
| [x] | LL-214 | WebTools 加密工具 | P0 | 完成 | Hash / AES / DES / RSA / Base64 / URL |
| [x] | LL-215 | WebTools JWT 工具 | P0 | 完成 | JWS / JWE（`dir`） |
| [x] | LL-217 | WebTools 时间戳工具 | P0 | 完成 | 秒 / 毫秒与日期互转 |
| [x] | LL-218 | WebTools 时间戳交互增强 | P1 | 完成 | 双区块、实时时钟、自动转换 |
| [x] | LL-219 | WebTools 正则工具开放 | P1 | 完成 | 默认示例、自动匹配、默认可见 |
| [x] | LL-220 | WebTools URL 解析工具开放 | P1 | 完成 | 默认示例、自动解析、默认可见 |
| [x] | LL-221 | WebTools 二维码工具开放 | P1 | 完成 | 颜色 / Logo / PNG 下载、默认可见 |
| [x] | LL-222 | WebTools Markdown 工具开放 | P1 | 完成 | 实时预览、HTML 输出、默认可见 |
| [x] | LL-223 | WebTools 颜色工具开放 | P1 | 完成 | 色板 / 取色器 / 色阶、默认可见 |
| [x] | LL-224 | WebTools 图片 Base64 工具开放 | P1 | 完成 | 拖拽上传、预览下载、默认可见 |
| [x] | LL-225 | WebTools 字符串工具开放 | P1 | 完成 | 大小写转换、UUID 批量生成、默认可见 |
| [x] | LL-226 | WebTools 文本对比工具开放 | P1 | 完成 | 双栏差异视图、自动对比、默认可见 |
| [x] | LL-227 | WebTools 配置转换工具开放 | P1 | 完成 | YAML / JSON / Properties 自动转换、默认可见 |
| [x] | LL-228 | WebTools SQL 格式化工具开放 | P1 | 完成 | 双栏自动格式化、方言 / 缩进配置、默认可见 |
| [x] | LL-229 | WebTools 单位换算工具开放 | P1 | 完成 | 容量换算与 px/rem 标签页、默认可见 |
| [x] | LL-230 | WebTools UA 解析工具开放 | P1 | 完成 | 自动解析浏览器 / 系统 / 设备信息、默认可见 |
| [x] | LL-231 | WebTools API 调试工具开放 | P1 | 完成 | 结构化请求编辑器、响应体 / 响应头查看、默认可见 |
| [x] | LL-233 | WebTools 文件哈希工具开放 | P1 | 完成 | `webtools-file-hash` 默认可见，支持 MD5 / SHA1 / SHA256 / SHA512 与期望哈希对比 |
| [x] | LL-234 | WebTools 端口助手开放 | P1 | 完成 | `webtools-port-helper` 默认可见，支持 TCP / UDP 占用查询、PID 定位与释放端口 |
| [x] | LL-235 | WebTools 图片提示词工具开放 | P1 | 完成 | `webtools-image-prompt` 默认可见，支持 ChatGPT Images 2.0 的 26 类风格预设切换、联动模块点选、生日照片 / 周岁模板、提示词生成与复制反馈 |

### 2.2 进行中插件工程

| 完成 | 编号 | 任务 | 优先级 | 状态 | 备注 |
|---|---|---|---|---|---|
| [ ] | LL-207 | Cashflow 复盘功能实装 | P1 | 待办 | `cash review` 仍是占位 |
| [ ] | LL-208 | Cashflow AI 多性格策略 | P1 | 待办 | 当前为基础策略 |
| [ ] | LL-210 | 插件面板注册器收敛 | P0 | 进行中 | 已完成多批实现外提并引入配置驱动 Enter 分发；多数组件 apply/render 均走 `plugin-panel-impls`，已移除 Password / JSON / URL / Timestamp / Cron / Strings / Colors / QR / UA / API / HTTP Mock 等轻量 wrapper，Markdown 也已改为 `panelImplsSafe` 直连；打开插件后的 keepOpen 二次刷新已加保护，后续继续瘦身执行 helper 与共享状态 |
| [ ] | LL-232 | WebTools HTTP Mock Server（MVP） | P0 | 进行中 | 已补面板编辑、Enter 启动动作与 E2E（启动 -> 命中 -> 停止）；已转默认可见，默认目录仅保留单入口，后续补生命周期健壮性与更多断言 |
| [x] | LL-216 | 插件可见性配置化 | P1 | 完成 | 设置页可编辑插件白名单，保存后热更新生效 |

## 3. UI / 交互任务

| 完成 | 编号 | 任务 | 优先级 | 状态 | 备注 |
|---|---|---|---|---|---|
| [x] | LL-301 | Cashflow 大尺寸预设 | P0 | 完成 | 与主搜索分离 |
| [x] | LL-302 | Cashflow 返回尺寸回退 | P0 | 完成 | `Esc` / 隐藏回退 |
| [x] | LL-303 | Cashflow 布局紧凑化 | P1 | 完成 | 减少空白 |
| [x] | LL-304 | Cashflow 滚动样式统一 | P1 | 完成 | 深色风格一致 |
| [x] | LL-306 | 主搜索窗口动态尺寸 | P1 | 完成 | 按显示器限幅 |
| [ ] | LL-305 | 全量 UI 文案一致性巡检 | P1 | 进行中 | 文档编码检查通过；Hardware / File Hash / Port Helper 范围 mojibake 扫描未命中；更新说明 HTML 直出已修复，仍需继续巡检其它历史面板 |
| [ ] | LL-307 | 插件面板小屏自适应 | P0 | 进行中 | 已补多批小屏 smoke 断言；Hardware / File Hash / Port Helper 已加入窄窗 E2E，Crypto / JWT 已补主流程 smoke，后续继续补高 DPI 回归 |
| [x] | LL-308 | 多行输入 Enter 行为统一 | P1 | 完成 | 多行输入换行，`Ctrl+Enter` 执行 |
| [x] | LL-309 | 搜索首页分区紧凑自适应 | P1 | 完成 | 最近 / 置顶 / 插件统一固定小卡片，按实际宽度自适应列数，标题最多两行 |

## 4. 打包与发布

| 完成 | 编号 | 任务 | 优先级 | 状态 | 备注 |
|---|---|---|---|---|---|
| [x] | LL-401 | `electron-builder` Windows 打包脚本 | P0 | 完成 | NSIS + Portable |
| [x] | LL-402 | 打包配置收敛 | P0 | 完成 | `package.json` 统一 |
| [x] | LL-403 | README 打包说明 | P0 | 完成 | pnpm 命令 |
| [x] | LL-405 | GitHub Actions 自动打包 | P2 | 完成 | `v*` tag 触发 |
| [x] | LL-406 | Windows `.ico` 图标接入 | P1 | 完成 | 主窗口 + 托盘 + 安装包 |
| [ ] | LL-404 | 自动更新端到端验证 | P2 | 进行中 | 已补自动检查调度与 release notes 渲染回归；`v1.0.25` 发版后需用线上 `v1.0.24` 客户端实测检查、下载、安装链路 |
| [ ] | LL-407 | macOS 签名与公证 | P2 | 待办 | 自用阶段降级，证书待接入 |
| [ ] | LL-411 | macOS `.icns` 图标接入 | P2 | 待办 | 自用阶段降级，仍需补齐 |

## 5. 质量任务

| 完成 | 编号 | 任务 | 优先级 | 状态 | 备注 |
|---|---|---|---|---|---|
| [x] | LL-501 | Cashflow 状态机测试 | P2 | 完成 | 自用阶段降级，已接入 |
| [x] | LL-502 | Cashflow 持久化测试 | P2 | 完成 | 自用阶段降级，已接入 |
| [x] | LL-503 | Cashflow 插件合约测试 | P2 | 完成 | 自用阶段降级，已接入 |
| [x] | LL-504 | Cashflow 性能基线测试 | P2 | 完成 | 自用阶段降级，已接入 |
| [ ] | LL-505 | E2E 自动化（搜索 + 插件 + 设置） | P2 | 进行中 | 自用阶段降级；已覆盖搜索首页布局、Windows Codex 搜索/置顶/跨重启恢复、Hardware / File Hash / Port Helper、Crypto / JWT、HTTP Mock 启动/命中/停止及多项 WebTools 小屏断言 |
| [x] | LL-506 | WebTools 可见插件回归脚本 | P2 | 完成 | 自用阶段降级，`test:plugins-visible` 已覆盖当前默认可见插件 |
| [x] | LL-507 | Windows 应用别名回归 | P2 | 完成 | 自用阶段降级，已补 `test:windows-alias`，覆盖 catalog / dynamic search / AppsFolder 启动 |

## 6. 下一步建议

1. 先发布 `v1.0.25` 补丁版：覆盖更新说明富文本显示和动态应用置顶失败两个真实问题。
2. 推进 `LL-404`：发布后用线上 `v1.0.24` 客户端实测检查到 `v1.0.25`，确认自动更新链路。
3. 推进 `LL-305`：继续巡检非新增插件范围的 UI 文案与编码问题。
4. 推进 `LL-307`：补插件面板高 DPI 回归和更细截图断言。
5. 推进 `LL-210`：继续拆分 `src/renderer/renderer.ts` 里的剩余执行 helper 与共享状态逻辑。
