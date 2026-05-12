# LiteLauncher 工作记录

更新时间：2026-05-12

## 最近完成

- 准备发布 `v1.0.15` 热修版，应用版本已同步到 `package.json`；修复老用户升级后图片提示词插件被旧可见插件白名单隐藏的问题。
- 新增默认可见插件 `hardware-inspector`：支持主板、CPU、内存、显卡、硬盘等硬件信息采集，提供变化对比、复制摘要 / JSON、Markdown / HTML 报告导出。
- 新增默认可见插件 `webtools-file-hash`：支持 MD5 / SHA1 / SHA256 / SHA512 文件哈希计算与期望哈希对比。
- 新增默认可见插件 `webtools-port-helper`：支持 TCP / UDP 端口占用查询、PID 定位与释放端口。
- 新增默认可见插件 `webtools-image-prompt`：支持 ChatGPT Images 2.0 产品模板、26 类风格预设切换、12 个智能场景模板、联动模块点选、生日照片 / 周岁模板、文字设计卡片、结构化生日文字、生成与复制图片提示词。
- 默认可见插件从 21 个扩展到 25 个，插件列表分页链路继续沿用完整可见集合 + 渲染层分页。
- 插件 Enter 行为配置已补齐到 Hardware / File Hash / Port Helper 等新增插件，默认打开命令由 `test:plugins-visible` 覆盖。
- 完成文档全量口径同步并准备发布 `v1.0.12`，统一默认可见插件为 21 个（含 `webtools-http-mock`）。
- 调整 `HTTP Mock Server` 目录展示策略：默认插件目录仅保留单入口，动作项通过别名查询返回，避免插件分区重复占位。
- 发布 `v1.0.11`，同步 GitHub Release 与英文发布日志。
- 扩展 `test:e2e:smoke`，使用 Playwright 跑通“启动窗口 -> 设置页 -> 搜索并打开 JSON 插件”，并补齐 `API 调试`、`二维码生成`、`配置转换`、`Markdown 预览`、`图片 Base64`、`文本对比` 的插件 UI 冒烟。
- 新增 `test:regression:full`，把现有回归脚本与 UI smoke 串成完整发布前检查链路。
- 增加开发模式 `pnpm dev`：自动编译、主进程自动重启、渲染层自动刷新。
- 启动链路支持 `--replace-instance`，避免旧 Electron 主进程残留导致代码不生效。
- 搜索链路补齐 Windows 命令 / StartApps / WindowsApps 支持，典型场景：`codex`。
- `Codex` 搜索结果改为真实应用项，补齐真实图标、去重与 AppsFolder 启动链路。
- 新增 `test:windows-alias`，覆盖 `codex` 的 catalog / dynamic search / AppsFolder 启动回归。
- 新增 `test:main-flow`，覆盖“搜索命中设置 / 插件 -> 执行打开面板”的主流程回归。
- 前移 `API 调试`、`配置转换`、`SQL 格式化`、`二维码生成` 的小屏关键断点，缓解中等宽度挤压问题。
- 插件原生交互期间暂停自动隐藏，覆盖图片选择、二维码下载、图片下载等动作。
- 多行输入统一为：`Enter` 换行、`Ctrl+Enter` 执行、`Esc` 返回。
- 文档体系重新对齐到当前实现状态。
- 渲染层拆分第一刀落地：插件 ID 与默认可见插件常量从 `renderer.ts` 外置到前置脚本，降低主文件耦合并保持运行链路不变。
- 渲染层拆分第二刀落地：SQL / 配置转换 / 颜色 / 正则 / JWT / 密码等插件面板静态数据从 `renderer.ts` 外置到前置脚本，并保持现有 E2E 冒烟链路稳定通过。
- 渲染层拆分第三刀落地：搜索范围前缀规则外置到前置静态数据脚本，减少主文件静态配置体积。
- 渲染层拆分第四刀落地：插件处理器从硬编码对象改为配置驱动注册（前置 handler 配置脚本 + 主渲染统一 Enter 动作分发），减少重复代码并降低后续接入成本。
- 渲染层实现层拆分完成本轮三步：Diff / Markdown / ImageBase64 / Config / SQL 面板的 apply/render 实现迁出主文件，主渲染改为轻量包装调用，构建与 UI smoke 持续全绿。
- 渲染层实现层拆分第二批完成：Strings / Colors / Qrcode / UA / API 面板的 apply/render 也迁出主文件，主渲染侧统一为包装调用；`pnpm build` 与 `pnpm test:e2e:smoke` 通过。
- 渲染层实现层拆分第三批完成：Password / Cron 面板的 apply/render 迁出 `renderer.ts` 并改为包装调用，类型声明同步到 `global.d.ts`。
- Playwright UI smoke 第四批完成：新增 `密码工具`、`颜色工具`、`SQL 格式化`、`Cron 生成器` 核心交互覆盖，并加入小屏宽度下表单不溢出断言；`pnpm test:e2e:smoke` 通过。
- 渲染层实现层拆分第四批完成：JSON / Timestamp 面板的 apply/render 迁出 `renderer.ts` 并改为包装调用，类型声明同步到 `global.d.ts`。
- Playwright UI smoke 第五批完成：新增 `JSON 工具`、`URL 解析`、`时间戳工具` 核心交互覆盖，并加入同口径小屏断言；`pnpm test:e2e:smoke` 持续通过。
- 渲染层实现层拆分第五批完成：URL 面板的 apply/render 迁出 `renderer.ts` 并改为包装调用，类型声明同步到 `global.d.ts`。
- Playwright UI smoke 第六批完成：新增 `单位换算` 核心交互覆盖，并加入同口径小屏断言；`pnpm test:e2e:smoke` 持续通过。
- 新增插件规划文档 `docs/plugin-ideas-roadmap.md`，沉淀已讨论候选、补充新增候选与落地顺序。
- `HTTP Mock Server` 进入实现阶段：新增主进程插件 `webtools-http-mock`，支持 `start/stop/status` 命令并可启动本地临时接口；当前作为灰度能力注册（默认不可见），待补面板与 E2E。
- `HTTP Mock Server` 第二阶段完成：补齐插件面板编辑（方法/端口/路径/状态码/响应体）、接入 Enter 启动动作，并新增 E2E 覆盖启动 -> 命中 -> 停止全链路；`pnpm test:e2e:smoke` 通过。
- 插件分区可扩展能力上线：补齐插件分区分页（支持超过 20 条持续浏览），并修复主进程 IPC 对插件列表的 `pluginLimit` 截断，改为返回完整可见插件集合由渲染层分页展示。
- 搜索首页布局完成紧凑化：`最近访问`、`置顶`、`插件` 统一使用固定小图标卡片，列数按实际宽度自适应，标题限制两行，置顶标记改为不遮挡内容的小圆点，并新增 Electron 布局 smoke 覆盖。
- 新增默认插件 UI smoke 已补齐：`hardware-inspector`、`webtools-file-hash`、`webtools-port-helper` 纳入 `test:e2e:smoke`，覆盖小窗口不横向溢出、文件哈希真实文件校验、端口查询主流程。
- File Hash / Port Helper 面板实现迁入 `plugin-panel-impls.ts`，主渲染侧改为 `panelImplsSafe` 调用，并新增源码回归防止新增默认插件面板回流到 `renderer.ts`。
- Crypto / JWT delegate 已移除，Diff / Config / SQL handler 已切到 `panelImplsSafe`，五个面板的 apply/render 实现统一落在 `plugin-panel-impls.ts`，源码回归覆盖禁止回流。
- Password / JSON / URL / Timestamp / Cron / Strings / Colors / QRCode / UA / API / HTTP Mock 等轻量 apply/render wrapper 已删除，handler 直接调用 `panelImplsSafe`，源码回归防止 wrapper 回潮。
- Markdown 面板 apply/render 已改为 `panelImplsSafe` 直连，`renderer.ts` 只保留渲染执行 helper；同时为打开插件命令增加 keepOpen 刷新保护，避免面板打开后被搜索列表二次刷新覆盖。
- 图片提示词核心生成器已抽到 `shared/image-prompt-builder` 并接入源码回归；面板实现直接落在 `plugin-panel-impls.ts`，当前按 26 类风格预设切换并联动过滤主体、构图、灯光、材质、环境等模块选项，内置淘宝主图、品牌主视觉、小红书封面、短视频封面、生日照片、宝宝周岁照、美食杂志、App/SaaS、电影海报、旅行宣传、医疗健康、金融商务 12 个智能模板；生日风格支持照片人物说明、周岁模板、年龄 / 祝福语 / 姓名 / 小标签结构化字段；12 个智能模板和 26 类风格预设已绑定 25 套场景化文字设计，面板用文字设计卡片展示字形、颜色、效果、布局、安全区和关键词，提示词会输出文字层级、颜色、效果、布局、安全区和生日文字结构，把文字作为版式元素融入画面而不是后贴字幕；智能模板切换时会重建面板并同步 EXACT 文案、位置、字形、文字设计和结构化文字控件。
- 图片提示词新增场景级文字推荐：创建不同风格默认状态时会自动推荐更合适的文字位置和字形，例如电影海报默认底部片名、SaaS 默认顶部左侧现代黑体、旅行海报默认顶部品牌字标、人像默认底部细字重；同时补了轻量源码 UI 回归，锁住文字设计下拉使用稳定 id、设计卡片展示字形/颜色/布局/安全区，以及生日快捷模板同步结构化年龄。
- Playwright UI smoke 新增 `加密工具` 与 `JWT 调试器` 主流程覆盖，分别验证 MD5 自动输出与示例 JWT 解析。
- 针对 Hardware / File Hash / Port Helper 及相关渲染面板做了 mojibake 扫描，当前未发现明显乱码命中。

## 当前版本基线

- 应用版本：`v1.0.15`
- 默认可见插件数量：25
- 已开放 WebTools 插件数量：23（原 `webTools` 20 个 + 文件哈希 + 端口助手 + 图片提示词）
- 非 WebTools 默认插件：`cashflow-game`、`hardware-inspector`
- 开发模式：`pnpm dev`
- 完整回归入口：`pnpm run test:regression:full`
- 搜索首页布局回归：已接入 `pnpm run test:e2e:smoke`
- 新增默认插件与 Crypto / JWT UI smoke：已接入 `pnpm run test:e2e:smoke`
- Windows 应用别名（如 `codex`）已支持搜索与启动

## 当前主要风险

1. 插件面板高 DPI 布局还没有逐项完全回归。
2. 渲染层执行 helper 与共享状态仍然集中在 `src/renderer/renderer.ts`。
3. 部分 WebTools 插件虽然可用，但还没有完全达到原版交互齐平。
4. 仍有历史 UI 文案和编码问题需要持续清理，非本次新增插件范围仍需巡检。
5. Cashflow `cash review` 复盘能力还未真正落地。

## 下一步建议

1. 继续拆分 `src/renderer/renderer.ts` 中剩余执行 helper 与共享状态逻辑。
2. 做插件面板高 DPI 专项回归，补更细的截图/布局断言。
3. 继续做非新增插件范围的 UI 文案与历史编码巡检。
4. 推进 Cashflow `cash review` 复盘模块。
5. 自动更新验证、签名 / 公证统一放到自用阶段低优先级收尾。
