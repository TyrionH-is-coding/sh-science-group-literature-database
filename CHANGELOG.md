# 更新日志

本文件记录每次 push 前后对项目做过的主要改动，便于课题组回溯功能变化、服务器更新和数据导入情况。

记录原则：

- 每次 push 前，在最顶部新增一条日期记录。
- 只写用户能理解的功能变化、数据变化和需要注意的配置变化。
- 不逐条复制所有 commit，只保留关键 commit id 方便回查。

## 2026-05-08

### 上传与入库

- 上传记录新增勾选框，支持选择当前页、清空选择和批量删除，批量删除会同步清理对应 PDF 文件。
- 上传 PDF 自动提交 Knowhere 解析时，webhook 地址改为优先读取 `PAPERQA_BASE_URL` / `PUBLIC_BASE_URL` / `APP_BASE_URL`，便于服务器公网回调。
- Knowhere webhook 完成解析并写入 Markdown corpus 后，改为增量整合入 PaperQA：已加载时只 `aadd` 新增 Markdown；冷启动未完成时先放入 pending 队列，避免每上传一篇就重扫全库。
- 配置了 `KNOWHERE_WEBHOOK_SECRET` 时，webhook 请求必须携带签名，避免未签名回调被接受。
- 上传入口从仅支持 PDF 扩展为支持 PDF、Markdown 摘要和纯文本笔记；Markdown 上传会直接写入 PaperQA corpus 并触发增量索引。
- 写作页面新增 Markdown 文章大纲工作台：可导入大纲、按章节生成 PaperQA 检索问题、把检索证据加入自选库或直接分配到段落计划。
- 写作工作流改为逐步确认：大纲、检索、证据、蓝图、草稿、审阅按步骤推进，用户必须确认 evidence 和写作蓝图后才生成草稿。
- 生成文章和历史生成记录支持在网页内直接编辑并保存，方便把 AI 输出继续修改成可用工作稿。
- 文献详情页新增个人备注；文献库搜索拆分为文献信息搜索和备注搜索，并支持只显示有备注的文献。
- 自建文献库新增“编辑信息”功能，拥有者可以在项目入口修改文献库名称和简介。
- 写作大纲左侧结构树新增编辑能力，可修改章节标题、标题层级、章节提示，并增删章节。
- 写作检索新增模块勾选，可把 PaperQA 检索限制在指定模块文献中。
- 文献库筛选新增自定义标签，文献详情页可编辑单篇文献标签，并支持按这些标签筛选。
- Ask PaperQA 和组文章检索新增证据优先级范围：仅高优先度、高+中优先度、高+中+低优先度；未归类 clinical case 会在后台自动保留。

### 调整

- 文章/段落生成功能接入 `nature-polishing` 的核心写作规则：按 claim-evidence-boundary、review synthesis、citation-key 保护和 overclaim control 生成更专业的综述草稿。
- 生文 prompt 拆分为通用综述写作规则和可选文献库上下文规则；APS module boundary 只在 APS Review 工作区启用，避免限制未来其他文献库。
- Markdown 原文阅读渲染增加常见 inline LaTeX 清洗：例如 `$\beta 2$ -glycoprotein` 会显示为 `β2-glycoprotein`，`$\beta 2\mathrm{GPI}$` 会显示为 `β2GPI`。
- PaperQA 引用高亮的句子切分改为规则切分，不再按分号切断，并避开 `et al.`、`Fig.`、小数点等常见误切位置。
- 写作页“导入大纲”按钮改为稳定居中的按钮布局，避免中文按钮文本错位。

### 新增

- 接入 Knowhere API：上传 PDF 后，在配置 `KNOWHERE_API_KEY` 的情况下可自动提交解析任务。
- 新增 Knowhere webhook 接口 `/api/knowhere-webhook`，用于接收解析完成回调并写入 PaperQA Markdown corpus。
- 新增 Knowhere 批处理与导入修复脚本：
  - `scripts/knowhere_bridge.py`
  - `scripts/batch_knowhere_parse.py`
  - `scripts/import_fix.py`
- 新增服务器端文献导入包 `server_markdown_upload_ready/`，包含 Markdown 文献、Knowhere 解析子集和 manifest 清单。
- 新增 15 人协作下载任务表 `docs/team/team_assignment_15_colleagues.xlsx`。
- 新增 PDF 重命名辅助脚本 `scripts/rename_pdfs.py`。

### 数据

- `paperqa_import/high_medium_ready/` 新增大量 APS 综述相关 Markdown 文献。
- `server_markdown_upload_ready/markdown_docs/` 包含 225 篇可导入 Markdown。
- `server_markdown_upload_ready/knowhere_markdown_only/` 包含 49 篇 Knowhere 解析结果。

### 注意事项

- 当前 Knowhere webhook URL 在 `app.py` 中默认使用本机地址拼接。正式服务器部署时建议改为可公网访问的 base URL，例如通过环境变量配置。
- 如果启用 `KNOWHERE_WEBHOOK_SECRET`，建议后续把 webhook 签名校验改得更严格：缺少签名时也拒绝请求。

相关 commit：

- `e64cfa8` feat: integrate Knowhere API for automated PDF parsing
- `d7bafbc` chore: add Knowhere bridge and batch parsing scripts
- `dc90128` feat: add 87 new colleague-uploaded papers + Knowhere-parsed papers to corpus
- `f7df63e` chore: add server manifests, rename script, and team assignment

## 2026-05-06

### 新增

- 新增工作区选择页，支持 APS Review 与自建工作区。
- 自建工作区区分“小型文献库”和“多人合作文献库”。
- 小型文献库允许直接上传 PDF，不强制要求 PMID。
- 多人合作文献库保留更严格的 PMID 对应思路，适合 APS Review 这类大型协作库。
- 新增 citation-key based manuscript drafting workflow：生成草稿时使用稳定 citation key，而不是固定编号引用。
- 新增 `/api/citations.csv`，用于导出引用键与 PMID/DOI/title 的映射。

### 调整

- 文章生成提示词要求 LLM 使用 `[@citekey]` 格式，避免生成 `[1]`、`[2]` 这类后期编辑后容易失效的编号引用。
- 删除文献库增加确认流程，但不再要求输入库名。
- 项目入口和删除按钮视觉上做得更醒目。

相关 commit：

- `f33f541` Add workspace libraries and citation-key drafting

## 2026-05-04

### 新增

- 新增 Evidence Library / 自选库：用户可从 PaperQA 引用句子或原文阅读页中保存证据句。
- 新增根据证据句生成文章段落和整篇草稿的工作流。
- 新增生成记录管理：可查看历史生成结果、删除无用记录、置顶有用记录。
- 新增文章阅读页手动选句功能，支持将原文句子加入自选库。
- 新增分页：文献库默认按 50 篇一页浏览。
- 新增上传记录排序、只看我的记录、20 条一页分页。
- 新增 PDF 链接入口：有对应 PDF 的文献可直接打开 PDF。
- 新增返回工作区选择页入口，方便未来扩展更多文献库。

### 调整

- 重做主界面视觉风格，形成更轻量的科研工作台布局。
- 优化顶部导航、分页、文献卡片、工作区入口和文献阅读页布局。
- PaperQA 回答中的 line 信息改为更适合阅读的引用链接形式。
- 登录方式保持轻量：输入用户名即可记录上传者和生成记录归属。

相关 commit：

- `45e88ce` Improve literature UI and evidence drafting
- `85d549d` Add evidence library article composer
- `ca34c01` Add user draft history and article evidence tools
- `34ba54d` Add draft history management and dashboard polish

## 2026-05-03

### 新增

- 初版 FastAPI 文献库工作台。
- 新增 PaperQA 问答入口。
- 新增 PDF 上传队列和上传记录管理。
- 新增上传记录删除、状态切换、按 PMID 分组查看。

### 调整

- 修复 `TemplateResponse` 调用兼容问题。
- 修复 `.env.example` 中不应出现真实 key 的问题。
- 增加搜索防抖和上传登录保护。
- 增强 PaperQA 延迟加载和 API key fallback。

相关 commit：

- `9947ee2` Redesign literature workspace frontend
- `59f2a5a` Fix ups: TemplateResponse signature, .env.example key leak, search debounce, upload login guard
- `9b2f843` feat: upload management UI with delete, status toggle, PMID grouping
- `d79c3fc` fix: PaperQA lazy loading + robust API key fallback
- `c694977` fix: PaperQA lazy init with background thread + iptables port 80->8081
