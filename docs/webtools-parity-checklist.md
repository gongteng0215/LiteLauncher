# WebTools 功能齐平清单

更新时间：2026-05-28
基准项目：`E:\AI\webTools`  
当前项目：`E:\AI\LiteLauncher`

## 1. 说明

这份清单不再以“是否已经接入 LiteLauncher”作为完成标准，而是以“是否已经达到原 `webTools` 的核心功能、主流程交互和关键反馈”作为标准。

状态定义：

- `完整复刻`：核心功能、主流程交互和主要反馈已基本对齐原版
- `部分复刻`：主流程可用，但布局、实时反馈、辅助交互或边界行为仍有差距
- `待复核`：这一轮补过一版，但还需要继续和原版逐项对照

## 2. 总体结论

1. 原 `webTools` 20 / 20 个插件都已经接入 LiteLauncher。
2. 当前 LiteLauncher 内已开放 23 个 `webtools-*` 插件：原 20 个工具 + `webtools-file-hash` + `webtools-port-helper` + `webtools-image-prompt`。
3. 搜索首页与重点插件面板的小屏 / 高 DPI 首轮基线已落地，round 2 方案文档已补齐，且已把原 `panel-baseline-round2` 分支中已提交的样式 / 测试增量回填到主线。
4. 原 `panel-baseline-round2` 中可独立抽离的 `Clipboard Workbench` 中文本地化批次、`Hardware Inspector` 的 helper / state 下沉批次，以及 `Image Prompt` 的基础状态 / 示例模板批次，已手工回填到主线并做定向回归；其余未提交现场已归档到 `.codex-recovery/worktree-archives/panel-baseline-round2-20260528-142402/`，并已按“恢复 worktree -> 核对 branch / patch -> 在 `main` 补记 merge 关系 -> 再删除”的顺序完成收尾。
5. 主线本轮已把插件面板的 transient cleanup、`Password / JSON / Timestamp` 剩余共享 helper、`Hardware Inspector` 的运行时状态与执行 helper、`Image Prompt` 的共享引导常量 / 默认示例状态 / 生日示例模板，以及 `Colors / QRCode / UA / API / Unit / Strings / URL` 的成熟 round2 面板结构收口到 `plugin-panel-impls`，并继续补齐 `ImageBase64 / Config / SQL / QRCode / Markdown / UA / API / Cron / Unit / FileHash / PortHelper / HttpMock / Image Prompt` 的源码回归护栏；这说明主线边界整理与测试收敛已经继续推进，后续直接在主线上收尾即可。
6. 本轮再确认 `renderer.ts` 已主要退回壳层职责，插件与 standalone 面板实现以 `plugin-panel-impls.ts` 为准；最近一次完成的 `plugin-panel-impls-regression` 串行验证为 53/53 通过，并已补上 `openPanel` 路由与 panel-mode keydown 分发不再内联回大函数的源码护栏。
7. 额外清理了两处 worktree 残留：`.worktrees/renderer-plugin-state-extraction` 作为孤儿目录已删除；`panel-baseline-round2` 则已在恢复核对并补记 merge 后，从 Git / 磁盘两侧移除，当前 worktree 状态已重新对齐。
8. 当前不能简单说“全部做完”，更准确的说法是：
   - 迁移接入：完成
   - 对外开放：完成
   - 功能齐平：持续推进中
   - 新增 WebTools 文案 / E2E：持续推进中

## 3. 当前盘点

| 工具 | 当前状态 | 说明 |
|---|---|---|
| 密码工具 | 部分复刻 | 核心生成功能、结果列表、复制反馈与紧凑布局可用，小屏断点已有回归，仍需继续对齐原版布局细节 |
| Cron 生成器 | 待复核 | 表达式解析、未来执行时间、自动解析与小屏基础断点可用，独立 panel layout smoke 已补齐，仍需补说明区细节和 round 2 紧凑化 |
| JSON 工具 | 待复核 | 默认示例、自动转换、错误提示与小屏布局回归已补齐，并新增独立 panel layout smoke，仍需继续核对原版布局和边界反馈 |
| 加密工具 | 待复核 | 哈希 / 对称 / 非对称 / 编码主流程可用，MD5 主流程 Playwright smoke 与窄窗口 geometry smoke 已补齐，仍需继续收敛布局和交互细节 |
| JWT 工具 | 待复核 | JWS / JWE 主流程可用，已补三段式结构、状态块与窄窗口 geometry smoke，示例解析 smoke 已接入，仍需继续核对细节 |
| 时间戳工具 | 待复核 | 双区块互转、秒 / 毫秒、当前时间、自动转换已补齐，仍需继续核对细节 |
| 正则工具 | 待复核 | 默认示例、模板按钮、实时高亮和双栏结构已补齐，并补了窄窗口源码断言与 geometry smoke，仍需继续收尾 |
| 字符串工具 | 部分复刻 | 大小写转换与 UUID 批量生成已切回分区结构、中文主动作和结果列表，仍需继续对齐原版功能组织与细节反馈 |
| 颜色工具 | 部分复刻 | 色板、取色器、HEX / RGB / HSL 与色阶现已回到实验室布局，仍需继续核对视觉层级 |
| 文本对比 | 部分复刻 | 双栏对比、差异统计和高亮可用，忽略规则和展示细节仍需继续打磨 |
| HTTP Mock Server | 待复核 | 已支持面板配置、启动/停止/状态与请求命中统计，启动 -> 命中 -> 停止链路已有 E2E，后续补生命周期健壮性与更多回归断言 |
| 图片 Base64 | 部分复刻 | 上传、拖拽、预览、下载、复制可用，round2 头部工具条与预览/编辑双栏结构已回填，仍需继续补边界输入体验 |
| 图片提示词 | 待复核 | ChatGPT Images 2.0 提示词生成可用，支持 26 类风格预设、12 个智能场景模板、联动模块点选、生日照片 / 周岁模板、25 套场景化文字设计卡片、年龄 / 祝福语 / 姓名 / 小标签结构化字段与复制反馈；生成词会写入文字层级、颜色、效果、布局、安全区和生日文字结构，并按场景自动推荐文字位置与字形；共享生成器、面板源码、主插件解析、窄窗口源码断言与独立 panel layout smoke 已接入，当前仍待补面板级 UI 自动化覆盖 |
| 配置转换 | 部分复刻 | YAML / JSON / Properties 自动互转可用，窄窗口源码断言与 geometry smoke 已补齐，仍需继续对齐原版布局 |
| SQL 格式化 | 部分复刻 | 双栏自动格式化、方言和缩进配置可用，仍需继续补交互细节 |
| 单位换算 | 待复核 | 容量换算和 px / rem 双页签可用，结果卡与逐项复制已回填，科学计数法显示已修，仍需继续核对布局 |
| 文件哈希 | 待复核 | 已接入 MD5 / SHA1 / SHA256 / SHA512 文件哈希和期望值对比，默认可见 UI smoke 与真实文件校验已补齐，mojibake 扫描暂无明显命中；仍需继续补边界案例 |
| 端口助手 | 待复核 | 已接入 TCP / UDP 占用查询、PID 定位与释放端口，默认可见 UI smoke 与主流程查询已补齐，mojibake 扫描暂无明显命中；仍需继续补边界案例 |
| URL 解析 | 待复核 | 字段拆解、Query 参数可视化编辑和回写可用，字段标签中文本地化已回填，仍需继续核对提示层级 |
| 二维码生成 | 部分复刻 | 实时生成、颜色、文字 / 图片 Logo、PNG 下载可用，两栏配置与 Logo 区已回填，仍需继续收布局 |
| Markdown 预览 | 部分复刻 | 实时预览、HTML 输出和复制可用，窄窗口源码断言与 geometry smoke 已补齐，仍需继续对齐原版排版 |
| UA 解析 | 部分复刻 | 浏览器 / 系统 / 设备 / 引擎 / CPU 架构可用，头部动作区与编辑壳已回填，窄窗口源码断言与 geometry smoke 已补齐，仍需继续补字段层级和说明 |
| API 调试 | 待复核 | 参数 / 请求头 / 请求体、Body 类型、响应标签页可用，请求行 / 预览行 / 响应头壳已回填，仍需继续收尾 |

## 4. 当前最值得继续补的顺序

1. `API 调试`
2. `二维码生成`
3. `配置转换`
4. `SQL 格式化`
5. `图片提示词`
6. `文件哈希`
7. `端口助手`
8. `颜色工具`

## 5. 备注

- 后续每补完一项，都要回填这份清单，不再用“已开放”替代“已齐平”。
- 如果某个插件只有“能打开、能执行”，默认仍按 `部分复刻` 或 `待复核` 处理，不提前宣称完成。
- round 2 小屏 / 高 DPI 的已提交样式与测试增量，以及 `Clipboard Workbench` 的低风险本地化小批次、`Hardware Inspector` 的低风险 helper/state 下沉批次，已经回填到主线；`panel-baseline-round2` 的剩余未提交 WIP 已整体归档，并已在 `main` 上补记 merge 关系后完成 worktree 清理，不再作为活跃 worktree 继续维护。
- 主线当前 `plugin-panel-impls-regression` 已继续扩展到 53 个源码回归用例，并继续作为判断“哪些迁移已经稳定落主干、哪些还只是 worktree 内 WIP”的主要源码护栏之一；其中 `ImageBase64` 的 round2 头部/布局/文件读取 helper，以及 `renderer.ts` 的 `openPanel` / panel-mode keydown 壳层边界也已补进源码断言。
- 旧 `panel-baseline-round2` worktree 已移除；其最终状态保存在 `.codex-recovery/worktree-archives/panel-baseline-round2-20260528-142402/`，如需复盘未提交现场，可直接查看 `working-tree.patch`，如需追踪主线收尾关系，可查看 `main` 上的 `merge: reconcile codex/panel-baseline-round2 into main`。
- 孤儿目录 `.worktrees/renderer-plugin-state-extraction` 已删除；当前 `.worktrees` 目录与 `git worktree list` 一致，不再有额外残留目录造成误判。
- 凡依赖 `dist` 的定向验证，统一采用串行顺序：先 `pnpm run build`，再逐个执行 `node dist/test/...`，避免旧产物导致误判。
