const state = {
    papers: [],
    filteredPapers: [],
    selectedPmid: null,
    moduleCounts: {},
    paperPage: 1,
    pageSize: 50,
    uploads: [],
    filteredUploads: [],
    uploadPage: 1,
    uploadPageSize: 20,
    myUploadsOnly: localStorage.getItem("litdb.myUploadsOnly") === "1",
    userName: localStorage.getItem("litdb.userName") || "",
    userToken: localStorage.getItem("litdb.userToken") || "",
    userId: localStorage.getItem("litdb.userId") || "",
    lang: localStorage.getItem("litdb.lang") || "en",
    project: sessionStorage.getItem("litdb.project") || "",
    customWorkspaces: [],
    workspaceDocuments: [],
    activeWorkspace: null,
    evidenceByKey: {},
    evidenceLibrary: loadEvidenceLibrary(),
    draftHistory: [],
};

const i18n = {
    en: {
        loginEyebrow: "Team workspace",
        loginTitle: "Welcome back",
        loginCopy: "Enter your name to access the research workspace.",
        loginNameLabel: "User name",
        loginButton: "Enter workspace",
        language: "Language",
        projectEyebrow: "Project hub",
        projectTitle: "Choose a dataset",
        apsKicker: "Active dataset",
        apsTitle: "APS Review",
        apsDescription: "Systematic review corpus with PaperQA search, paper inspection, and PDF upload queue.",
        enterProject: "Enter project",
        newWorkspaceKicker: "Custom workspace",
        newWorkspaceTitle: "Add workspace",
        newWorkspaceDescription: "Create a small PDF library, then ask PaperQA and draft from selected evidence.",
        newWorkspacePlaceholder: "Workspace name",
        personalWorkspace: "Small literature library",
        personalWorkspaceHint: "No PMID required, fewer than 100 PDFs, suitable for 2-5 collaborators.",
        teamWorkspace: "Team library",
        teamWorkspaceHint: "PMID required for each PDF.",
        createWorkspace: "Create workspace",
        workspaceCreated: "Workspace created.",
        workspaceCreateFailed: "Could not create workspace.",
        deleteWorkspace: "Delete library",
        deleteWorkspaceConfirm: "Delete this library and its uploaded PDFs?",
        deleteWorkspaceBlocked: "Team libraries can only be deleted by administrators.",
        workspaceDeleted: "Library deleted.",
        workspaceTypePersonal: "Small library",
        workspaceTypeTeam: "Team",
        customWorkspace: "Custom workspace",
        pdfLibrary: "PDF Library",
        pdfFiles: "PDF files",
        noWorkspacePdfs: "No PDFs uploaded in this workspace yet.",
        workspaceUploadHint: "PMID is optional in small literature libraries.",
        workspaceQueryPlaceholder: "Ask a question about the uploaded PDFs.",
        backToProjects: "Projects",
        appEyebrow: "APS Review Workspace",
        appTitle: "SH Science Group",
        checkingPaperQA: "Checking PaperQA",
        paperqaLLM: "PaperQA LLM",
        draftLLM: "Draft LLM",
        docsUnit: "docs",
        corpus: "Corpus",
        papersMetric: "papers",
        filters: "Filters",
        search: "Search",
        searchLiterature: "Search literature",
        searchPlaceholder: "Search PMID, title, journal, module",
        page: "Page",
        previousPage: "Previous",
        nextPage: "Next",
        pageOf: "of",
        priority: "Priority",
        allPriorities: "All priorities",
        priorityHigh: "High priority",
        priorityMedium: "Medium priority",
        priorityLow: "Low priority",
        module: "Module",
        allModules: "All modules",
        evidenceLibrary: "Evidence Library",
        evidenceLibraryHint: "Checked PaperQA sentences and article-page selections are saved here.",
        noEvidenceSaved: "No selected sentences yet.",
        draftHistory: "Draft history",
        draftHistoryHint: "LLM outputs are saved under your account.",
        noDraftHistory: "No saved drafts yet.",
        draftHistoryTitle: "Generated draft history",
        draftHistoryPageHint: "Review saved LLM outputs, pin useful records, and delete drafts you no longer need.",
        draftHistorySummary: "records saved",
        pinRecord: "Pin",
        unpinRecord: "Unpin",
        pinnedRecord: "Pinned",
        deleteRecord: "Delete",
        deleteDraftConfirm: "Delete this generated record?",
        draftRecordDeleted: "Record deleted.",
        draftRecordUpdated: "Record updated.",
        paragraphDraft: "Paragraph",
        articleDraft: "Article",
        evidenceCountShort: "evidence",
        paragraphCountShort: "paragraphs",
        loginFailed: "Could not sign in.",
        previewEvidenceLibrary: "Load sample sentences",
        loadingPreviewEvidence: "Loading sample sentences...",
        previewEvidenceLoaded: "Sample sentences added.",
        previewEvidenceFailed: "Could not load sample sentences.",
        clearLibrary: "Clear",
        composeArticle: "Compose",
        removeEvidence: "Remove",
        addToEvidenceLibrary: "Add to library",
        inEvidenceLibrary: "In library",
        organizeDraft: "Compose paragraph",
        draftComposerHint: "Describe what this paragraph should argue, then choose the evidence for the model.",
        paragraphBrief: "Paragraph goal",
        paragraphBriefPlaceholder: "For example: summarize why immunothrombosis matters in APS infection risk.",
        evidenceForParagraph: "Evidence for this paragraph",
        selectedForParagraph: "selected for paragraph",
        chooseEvidenceForDraft: "Choose evidence from the library first.",
        articleComposer: "Article Composer",
        articleComposerTitle: "Build a multi-paragraph draft",
        articleComposerHint: "Arrange selected evidence into paragraph plans, then generate the draft in one pass.",
        addParagraph: "Add paragraph",
        removeParagraph: "Remove",
        paragraphLabel: "Paragraph",
        paragraphLength: "Approx. length",
        paragraphLengthPlaceholder: "e.g. 180 words",
        generateArticle: "Generate article",
        generatedArticle: "Generated article",
        generatingArticle: "Generating the article from paragraph plans...",
        citationKeysUsed: "Citation keys",
        articleNeedEvidence: "Assign evidence to at least one paragraph.",
        articleNeedParagraph: "Add at least one paragraph plan.",
        paragraphEvidence: "Evidence assigned to this paragraph",
        uploadPdf: "Upload PDF",
        uploadButton: "Upload",
        pmidPlaceholder: "PMID",
        tabPapers: "Papers",
        tabAsk: "Ask PaperQA",
        tabUploads: "Uploads",
        tabGuide: "Guide",
        guideEyebrow: "How to use",
        guideTitle: "Usage guide",
        guideIntro: "This page documents the current workflow. Add new notes here whenever the site gains a feature.",
        guideStartTitle: "1. Sign in and enter APS Review",
        guideStartText: "Enter your user name on the login screen, then choose APS Review. The name is used for uploads and saved LLM draft history.",
        guideLibraryTitle: "2. Browse the literature library",
        guideLibraryText: "Use search, priority, module filters, and pagination to narrow the paper table. Each page shows 50 papers by default.",
        guidePaperTitle: "3. Open and select from a paper",
        guidePaperText: "Open a paper from the detail panel. In the rendered article page, click a sentence or highlight text manually to add it to the Evidence Library.",
        guidePaperRemoveText: "The small left-side Evidence Library panel on the article page shows selected sentences and lets you remove them immediately.",
        guidePaperQATitle: "4. Ask PaperQA",
        guidePaperQAText: "Ask a focused APS question. When PaperQA is configured on the server, cited sentences can be checked and added to the Evidence Library.",
        guideComposerTitle: "5. Compose an article draft",
        guideComposerText: "Click Compose from the Evidence Library, arrange selected sentences into paragraph plans, set approximate length, then generate a multi-paragraph draft.",
        guideRecordsTitle: "6. Check draft history",
        guideRecordsText: "Generated paragraphs and article drafts are saved under the current user account after successful LLM generation.",
        guideUploadTitle: "7. Upload PDFs",
        guideUploadText: "Use the upload panel for manual PDFs. A PMID is required, and the current user name is recorded with the upload.",
        guideUpdatesTitle: "Update notes",
        guideUpdateLatest: "May 2026: added simple accounts, saved draft history, article-page sentence selection, Evidence Library management, article composer routing, 50-paper pagination, draggable article Evidence Library shortcut, upload-record filtering with 20-record pagination, progress indicators for long-running AI/upload tasks, and direct PDF links for papers with uploaded PDFs.",
        guideUpdateNext: "Future changes should be added here with a short date and user-facing summary.",
        literatureTable: "Literature Table",
        reviewReadyPapers: "Literature Library",
        loading: "Loading",
        paper: "Paper",
        journal: "Journal",
        askAcrossCorpus: "Ask across the corpus",
        queryPlaceholder: "Ask a focused APS question.",
        askButton: "Ask",
        criteria: "Criteria",
        doacs: "DOACs",
        complement: "Complement",
        answerEmpty: "Answers and cited source snippets will appear here.",
        manualPdfs: "Manual PDFs",
        uploadQueue: "Upload queue",
        myUploadsOnly: "Only mine",
        uploadRecordsUnit: "records",
        refresh: "Refresh",
        selectedPaper: "Selected Paper",
        selectPaperEmpty: "Select a paper to inspect metadata and abstract.",
        signedInAs: "Uploading as",
        switchUser: "Switch user",
        noPapers: "No papers match the current filters.",
        couldNotLoadPapers: "Could not load papers",
        shown: "shown",
        paperQANotReady: "PaperQA indexing",
        paperQAReady: "PaperQA ready",
        paperQAUnavailable: "PaperQA unavailable",
        healthCheckFailed: "Health check failed",
        searchingCorpus: "Searching the corpus and preparing an answer...",
        noAnswer: "No answer returned.",
        sources: "Cited evidence",
        evidenceHint: "Checked sentences can be used to generate a manuscript-ready paragraph.",
        openPaper: "Open original",
        openPdf: "Open PDF",
        pdfAvailable: "PDF available",
        pdfMissing: "No PDF uploaded",
        openHighlighted: "Open highlighted paper",
        generateFromEvidence: "Generate paragraph",
        generatedParagraph: "Generated paragraph",
        selectedEvidence: "selected evidence",
        reviewMode: "Review",
        grantMode: "Grant background",
        clinicalMode: "Clinical summary",
        slideMode: "Slide bullets",
        disabledSoon: "Coming later",
        selectEvidenceFirst: "Select evidence sentences first.",
        generatingDraft: "Generating a paragraph from selected evidence...",
        noUploads: "No uploaded PDFs yet.",
        uploadStatusUploaded: "Uploaded",
        uploadStatusIndexed: "Indexed",
        toggleStatus: "Toggle status",
        deleteUpload: "Delete",
        deleteUploadConfirm: "Delete upload",
        deleteFailed: "Delete failed",
        updateFailed: "Update failed",
        noCorpusData: "No corpus data",
        uploadMissing: "Select a PDF and PMID.",
        uploadNeedLogin: "Log in before uploading.",
        uploadingPdf: "Uploading PDF...",
        uploadSaved: "Upload saved.",
        unknownJournal: "Unknown journal",
        unknownDate: "Unknown date",
        noAbstract: "No abstract was found in the prepared Markdown.",
        studyType: "Study Type",
        missing: "missing",
        backWorkspace: "Back to workspace",
        skipToContent: "Skip to content",
    },
    zh: {
        loginEyebrow: "团队工作区",
        loginTitle: "欢迎回来",
        loginCopy: "输入用户名即可进入科研工作区。",
        loginNameLabel: "用户名",
        loginButton: "进入工作区",
        language: "语言",
        projectEyebrow: "项目入口",
        projectTitle: "选择数据集",
        apsKicker: "当前数据集",
        apsTitle: "APS Review",
        apsDescription: "系统综述语料库，支持 PaperQA 检索、文献查看和 PDF 上传队列。",
        enterProject: "进入项目",
        newWorkspaceKicker: "自建工作区",
        newWorkspaceTitle: "新增工作区",
        newWorkspaceDescription: "创建一个小型 PDF 文献库，用 PaperQA 提问，并从证据句子生成写作草稿。",
        newWorkspacePlaceholder: "工作区名称",
        personalWorkspace: "小型文献库",
        personalWorkspaceHint: "不要求 PMID，少于 100 篇 PDF，适合 2-5 人协作使用。",
        teamWorkspace: "多人合作文献库",
        teamWorkspaceHint: "每篇 PDF 必须填写 PMID。",
        createWorkspace: "创建工作区",
        workspaceCreated: "工作区已创建。",
        workspaceCreateFailed: "无法创建工作区。",
        deleteWorkspace: "删除文献库",
        deleteWorkspaceConfirm: "确定删除这个文献库和其中已上传的 PDF 吗？",
        deleteWorkspaceBlocked: "多人合作文献库仅管理员可删除。",
        workspaceDeleted: "文献库已删除。",
        workspaceTypePersonal: "小型库",
        workspaceTypeTeam: "团队",
        customWorkspace: "自建工作区",
        pdfLibrary: "PDF 文献库",
        pdfFiles: "PDF 文件",
        noWorkspacePdfs: "这个工作区还没有上传 PDF。",
        workspaceUploadHint: "小型文献库不需要填写 PMID。",
        workspaceQueryPlaceholder: "针对已上传 PDF 提问。",
        backToProjects: "项目选择",
        appEyebrow: "APS 综述工作区",
        appTitle: "SH Science Group",
        checkingPaperQA: "正在检查 PaperQA",
        paperqaLLM: "PaperQA 模型",
        draftLLM: "生文模型",
        docsUnit: "篇索引文档",
        corpus: "文献库",
        papersMetric: "篇文献",
        filters: "筛选",
        search: "搜索",
        searchLiterature: "搜索文献",
        searchPlaceholder: "搜索 PMID、标题、期刊、模块",
        page: "页",
        previousPage: "上一页",
        nextPage: "下一页",
        pageOf: "共",
        priority: "优先度",
        allPriorities: "全部优先度",
        priorityHigh: "高优先度",
        priorityMedium: "中优先度",
        priorityLow: "低优先度",
        module: "模块",
        allModules: "全部模块",
        evidenceLibrary: "自选库",
        evidenceLibraryHint: "勾选 PaperQA 句子，或在原文页点击句子后会保存到这里。",
        noEvidenceSaved: "还没有选择句子。",
        draftHistory: "生成记录",
        draftHistoryHint: "LLM 生成结果会保存在当前账号下。",
        noDraftHistory: "还没有保存的生成记录。",
        draftHistoryTitle: "生成记录",
        draftHistoryPageHint: "查看当前账号保存的 LLM 生成结果。可以置顶有用记录，也可以删除不需要的记录。",
        draftHistorySummary: "条记录",
        pinRecord: "置顶",
        unpinRecord: "取消置顶",
        pinnedRecord: "已置顶",
        deleteRecord: "删除",
        deleteDraftConfirm: "确定删除这条生成记录吗？",
        draftRecordDeleted: "记录已删除。",
        draftRecordUpdated: "记录已更新。",
        paragraphDraft: "段落",
        articleDraft: "文章",
        evidenceCountShort: "条证据",
        paragraphCountShort: "段",
        loginFailed: "无法登录。",
        previewEvidenceLibrary: "导入示例句子",
        loadingPreviewEvidence: "正在导入示例句子...",
        previewEvidenceLoaded: "示例句子已加入。",
        previewEvidenceFailed: "无法导入示例句子。",
        clearLibrary: "清空",
        composeArticle: "组文章",
        removeEvidence: "移除",
        addToEvidenceLibrary: "加入自选库",
        inEvidenceLibrary: "已加入自选库",
        organizeDraft: "组文章段落",
        draftComposerHint: "先描述这一段要写什么，再选择交给 AI 的证据。",
        paragraphBrief: "段落要求",
        paragraphBriefPlaceholder: "例如：总结免疫血栓如何影响 APS 感染风险。",
        evidenceForParagraph: "本段证据",
        selectedForParagraph: "条证据用于本段",
        chooseEvidenceForDraft: "请先从自选库选择证据。",
        articleComposer: "组文章",
        articleComposerTitle: "生成多段文章草稿",
        articleComposerHint: "把自选库证据分配到不同段落，再一次性交给 AI 生成，让段落之间有承接关系。",
        addParagraph: "添加段落",
        removeParagraph: "删除",
        paragraphLabel: "段落",
        paragraphLength: "大约字数",
        paragraphLengthPlaceholder: "例如：180 字",
        generateArticle: "生成文章",
        generatedArticle: "生成文章",
        generatingArticle: "正在根据段落计划生成文章...",
        citationKeysUsed: "引用键",
        articleNeedEvidence: "请至少给一个段落分配证据。",
        articleNeedParagraph: "请至少添加一个段落计划。",
        paragraphEvidence: "本段使用的证据",
        uploadPdf: "上传 PDF",
        uploadButton: "上传",
        pmidPlaceholder: "PMID",
        tabPapers: "文献",
        tabAsk: "问 PaperQA",
        tabUploads: "上传记录",
        tabGuide: "使用说明",
        guideEyebrow: "使用说明",
        guideTitle: "网站使用说明",
        guideIntro: "这里记录当前网站的使用流程。之后每次增加新功能，就把说明和更新记录补在这里。",
        guideStartTitle: "1. 登录并进入 APS Review",
        guideStartText: "在登录页输入用户名，然后进入 APS Review。用户名会用于上传记录和 LLM 生成记录保存。",
        guideLibraryTitle: "2. 浏览文献库",
        guideLibraryText: "可以用搜索、优先度、模块筛选和分页来缩小文献表范围。文献表默认每页显示 50 篇。",
        guidePaperTitle: "3. 打开原文并选择句子",
        guidePaperText: "在右侧详情里打开原文。进入渲染后的文章页后，可以点击整句，或手动划选一段文字加入自选库。",
        guidePaperRemoveText: "文章页左侧的小自选库面板会显示已选句子，也可以直接移除不需要的句子。",
        guidePaperQATitle: "4. 向 PaperQA 提问",
        guidePaperQAText: "输入具体的 APS 问题。服务器配置好 PaperQA 后，结果中的引用句子可以勾选并加入自选库。",
        guideComposerTitle: "5. 生成文章草稿",
        guideComposerText: "点击自选库里的“组文章”，把句子分配到不同段落，设置每段大约字数，再一次性生成多段文章草稿。",
        guideRecordsTitle: "6. 查看生成记录",
        guideRecordsText: "LLM 成功生成的段落和文章草稿，会保存到当前用户账号下，可以在左侧生成记录中查看。",
        guideUploadTitle: "7. 上传 PDF",
        guideUploadText: "上传面板用于人工补充 PDF。需要填写 PMID，系统会记录当前上传用户。",
        guideUpdatesTitle: "更新记录",
        guideUpdateLatest: "2026 年 5 月：加入轻量账号、生成记录、原文页选句、自选库管理、组文章跳转、50 篇文献分页、原文页可拖动自选库入口、上传记录按 20 条分页和只看我的记录，为 AI 生成和上传等耗时任务加入进度提示，并为已有上传 PDF 的文献加入直接打开 PDF 的入口。",
        guideUpdateNext: "以后每次新增功能，都在这里按日期补一条面向用户的说明。",
        literatureTable: "文献表",
        reviewReadyPapers: "文献库",
        loading: "加载中",
        paper: "文献",
        journal: "期刊",
        askAcrossCorpus: "基于文献库提问",
        queryPlaceholder: "输入一个具体的 APS 问题。",
        askButton: "提问",
        criteria: "诊断标准",
        doacs: "DOACs",
        complement: "补体",
        answerEmpty: "这里会显示回答和可勾选的引用句子。",
        manualPdfs: "人工 PDF",
        uploadQueue: "上传队列",
        myUploadsOnly: "只看我的记录",
        uploadRecordsUnit: "条记录",
        refresh: "刷新",
        selectedPaper: "选中文献",
        selectPaperEmpty: "选择一篇文献查看元数据和摘要。",
        signedInAs: "当前上传用户",
        switchUser: "切换用户",
        noPapers: "没有文献符合当前筛选条件。",
        couldNotLoadPapers: "无法加载文献",
        shown: "条结果",
        paperQANotReady: "PaperQA 正在索引",
        paperQAReady: "PaperQA 已就绪",
        paperQAUnavailable: "PaperQA 不可用",
        healthCheckFailed: "健康检查失败",
        searchingCorpus: "正在检索文献库并生成回答...",
        noAnswer: "没有返回回答。",
        sources: "引用证据",
        evidenceHint: "勾选句子后，可生成能直接放入文章草稿的段落。",
        openPaper: "打开原文",
        openPdf: "打开 PDF",
        pdfAvailable: "已有 PDF",
        pdfMissing: "暂无 PDF",
        openHighlighted: "打开高亮原文",
        generateFromEvidence: "生成段落",
        generatedParagraph: "生成段落",
        selectedEvidence: "条已选证据",
        reviewMode: "综述",
        grantMode: "基金背景",
        clinicalMode: "临床总结",
        slideMode: "汇报要点",
        disabledSoon: "后续开放",
        selectEvidenceFirst: "请先勾选证据句子。",
        generatingDraft: "正在根据所选证据生成段落...",
        noUploads: "暂无上传 PDF。",
        uploadStatusUploaded: "已上传",
        uploadStatusIndexed: "已索引",
        toggleStatus: "切换状态",
        deleteUpload: "删除",
        deleteUploadConfirm: "删除上传记录",
        deleteFailed: "删除失败",
        updateFailed: "更新失败",
        noCorpusData: "暂无文献库数据",
        uploadMissing: "请选择 PDF 并填写 PMID。",
        uploadNeedLogin: "请先登录后再上传。",
        uploadingPdf: "正在上传 PDF...",
        uploadSaved: "上传已保存。",
        unknownJournal: "未知期刊",
        unknownDate: "未知日期",
        noAbstract: "整理后的 Markdown 中没有找到摘要。",
        studyType: "研究类型",
        missing: "缺失",
        backWorkspace: "返回工作区",
        skipToContent: "跳到主要内容",
    },
};

const MODULE_LABELS_ZH = {
    module_1_clinical_introduction: "临床概述",
    module_2_autoantigens: "自身抗原",
    module_3_immunothrombosis: "免疫血栓",
    module_4_microvascular: "微血管病变",
    module_5_therapeutics: "治疗策略",
    module_6_future_directions: "未来方向",
    module_1_criteria_and_classification: "分类与诊断标准",
    module_2_clinical_management: "临床管理",
    module_4_obstetric_aps: "产科 APS",
    module_5_catastrophic_aps: "灾难性 APS",
    module_6_pediatric_aps: "儿童 APS",
    module_7_non_criteria_manifestations: "非标准临床表现",
    module_8_methods_and_biomarkers: "方法与生物标志物",
};

const MODULE_ALIAS_ZH = {
    "clinical introduction": "临床概述",
    "clinical overview": "临床概述",
    "clinical introduction and overview": "临床概述",
    autoantigens: "自身抗原",
    autoantigen: "自身抗原",
    immunothrombosis: "免疫血栓",
    microvascular: "微血管病变",
    "microvascular disease": "微血管病变",
    therapeutics: "治疗策略",
    therapeutic: "治疗策略",
    "future directions": "未来方向",
};

const els = {
    loginScreen: document.getElementById("login-screen"),
    skipLink: document.getElementById("skip-link"),
    projectScreen: document.getElementById("project-screen"),
    appShell: document.getElementById("app-shell"),
    mainWorkspace: document.getElementById("main-workspace"),
    articleComposePage: document.getElementById("article-compose-page"),
    draftHistoryPage: document.getElementById("draft-history-page"),
    loginForm: document.getElementById("login-form"),
    loginName: document.getElementById("login-name"),
    userChip: document.getElementById("user-chip"),
    projectUserChip: document.getElementById("project-user-chip"),
    draftHistoryChip: document.getElementById("draft-history-chip"),
    backToProjects: document.getElementById("back-to-projects"),
    openApsProject: document.getElementById("open-aps-project"),
    createWorkspaceForm: document.getElementById("create-workspace-form"),
    startCreateWorkspace: document.getElementById("start-create-workspace"),
    workspaceCreateSetup: document.getElementById("workspace-create-setup"),
    newWorkspaceName: document.getElementById("new-workspace-name"),
    workspaceMessage: document.getElementById("workspace-message"),
    customWorkspaces: document.getElementById("custom-workspaces"),
    signedUpload: document.getElementById("signed-upload"),
    engineStatus: document.getElementById("engine-status"),
    statusStrip: document.getElementById("status-strip"),
    paperqaLlm: document.getElementById("paperqa-llm"),
    draftLlm: document.getElementById("draft-llm"),
    metricPapers: document.getElementById("metric-papers"),
    prioritySummary: document.getElementById("priority-summary"),
    searchInput: document.getElementById("search-input"),
    paperPagination: document.getElementById("paper-pagination"),
    prevPage: document.getElementById("prev-page"),
    nextPage: document.getElementById("next-page"),
    pageSelect: document.getElementById("page-select"),
    pageTotal: document.getElementById("page-total"),
    priorityFilter: document.getElementById("priority-filter"),
    moduleFilter: document.getElementById("module-filter"),
    libraryCount: document.getElementById("library-count"),
    libraryList: document.getElementById("library-list"),
    clearLibrary: document.getElementById("clear-library"),
    composeButton: document.getElementById("compose-button"),
    draftHistoryCount: document.getElementById("draft-history-count"),
    draftHistorySummary: document.getElementById("draft-history-summary"),
    draftHistoryList: document.getElementById("draft-history-list"),
    papersBody: document.getElementById("papers-body"),
    paperCount: document.getElementById("paper-count"),
    paperDetail: document.getElementById("paper-detail"),
    queryForm: document.getElementById("query-form"),
    queryInput: document.getElementById("query-input"),
    answerPanel: document.getElementById("answer-panel"),
    uploadForm: document.getElementById("upload-form"),
    uploadFile: document.getElementById("upload-file"),
    uploadPmid: document.getElementById("upload-pmid"),
    uploadMessage: document.getElementById("upload-message"),
    uploadsList: document.getElementById("uploads-list"),
    refreshUploads: document.getElementById("refresh-uploads"),
    myUploadsOnly: document.getElementById("my-uploads-only"),
    uploadPagination: document.getElementById("upload-pagination"),
    prevUploadPage: document.getElementById("prev-upload-page"),
    nextUploadPage: document.getElementById("next-upload-page"),
    uploadPageStatus: document.getElementById("upload-page-status"),
    backToWorkspace: document.getElementById("back-to-workspace"),
    backFromHistory: document.getElementById("back-from-history"),
    addParagraph: document.getElementById("add-paragraph"),
    generateArticle: document.getElementById("generate-article"),
    articleParagraphs: document.getElementById("article-paragraphs"),
    articleOutput: document.getElementById("article-output"),
};

document.addEventListener("DOMContentLoaded", () => {
    bindLogin();
    bindLanguage();
    bindTabs();
    bindFilters();
    bindPagination();
    bindQuery();
    bindEvidenceLibrary();
    bindArticleComposer();
    bindDraftHistoryPage();
    bindUpload();
    applyLanguage();
    renderEvidenceLibrary();
    renderDraftHistory();
    applyInitialRoute();
    refreshUserState();
    ensureUserSession();
    openRequestedComposer();
    loadHealth();
    loadPapers();
    loadUploads();
    loadWorkspaces();
    window.setInterval(loadHealth, 15000);
    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener("focus", handleFocusRefresh);
});

function t(key) {
    return (i18n[state.lang] && i18n[state.lang][key]) || i18n.en[key] || key;
}

function isCustomWorkspace() {
    return state.project.startsWith("workspace:");
}

function activeWorkspaceId() {
    return isCustomWorkspace() ? state.project.slice("workspace:".length) : "";
}

function workspaceTypeLabel(workspace) {
    return (workspace?.library_type || "personal") === "team" ? t("workspaceTypeTeam") : t("workspaceTypePersonal");
}

function activeWorkspaceRequiresPmid() {
    return Boolean(state.activeWorkspace && state.activeWorkspace.requires_pmid);
}

function canDeleteWorkspace(workspace) {
    if (!workspace || workspace.library_type === "team") return false;
    if (workspace.owner_user_id && state.userId) return workspace.owner_user_id === state.userId;
    return Boolean(workspace.owner_name && state.userName && workspace.owner_name.toLowerCase() === state.userName.toLowerCase());
}

function bindLogin() {
    els.loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const value = els.loginName.value.trim();
        if (!value) return;
        try {
            const result = await fetchJson("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: value }),
            });
            applyUser(result.user || { name: value });
            refreshUserState();
            loadDraftHistory();
            openRequestedComposer();
        } catch (error) {
            window.alert(`${t("loginFailed")} ${formatError(error.message)}`);
        }
    });

    [els.userChip, els.projectUserChip].forEach((button) => button.addEventListener("click", switchUser));
    els.backToProjects.addEventListener("click", returnToProjectHub);

    els.openApsProject.addEventListener("click", () => {
        state.project = "aps-review";
        sessionStorage.setItem("litdb.project", state.project);
        refreshUserState();
        loadPapers();
        loadUploads();
    });
    els.startCreateWorkspace.addEventListener("click", showWorkspaceCreateSetup);
    els.createWorkspaceForm.addEventListener("submit", createWorkspace);
}

function showWorkspaceCreateSetup() {
    els.startCreateWorkspace.classList.add("hidden");
    els.workspaceCreateSetup.classList.remove("hidden");
    window.requestAnimationFrame(() => {
        const checked = document.querySelector("input[name='workspace-type']:checked");
        checked?.focus();
    });
}

function returnToProjectHub() {
    state.project = "";
    state.activeWorkspace = null;
    state.workspaceDocuments = [];
    sessionStorage.removeItem("litdb.project");
    sessionStorage.removeItem("litdb.openArticleComposer");
    window.history.replaceState(null, "", window.location.pathname);
    refreshUserState();
    loadWorkspaces();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadWorkspaces() {
    if (!els.customWorkspaces) return;
    try {
        const data = await fetchJson("/api/workspaces");
        state.customWorkspaces = Array.isArray(data.workspaces) ? data.workspaces : [];
        if (isCustomWorkspace()) {
            state.activeWorkspace = state.customWorkspaces.find((item) => item.id === activeWorkspaceId()) || state.activeWorkspace;
            refreshUserState();
            loadWorkspacePdfs();
        }
        renderCustomWorkspaces();
    } catch {
        state.customWorkspaces = [];
        renderCustomWorkspaces();
    }
}

function renderCustomWorkspaces() {
    if (!els.customWorkspaces) return;
    els.customWorkspaces.innerHTML = state.customWorkspaces.map((workspace) => `
        <article class="project-card custom-project-card">
            <button class="workspace-card-open" type="button" data-workspace-id="${escapeHtml(workspace.id)}">
                <span class="project-kicker">${escapeHtml(workspaceTypeLabel(workspace))} · ${escapeHtml(t("customWorkspace"))}</span>
                <strong>${escapeHtml(workspace.name)}</strong>
                <span>${escapeHtml(workspace.document_count || 0)} ${escapeHtml(t("pdfFiles"))}${workspace.requires_pmid ? ` · PMID` : ""}</span>
            </button>
            <div class="workspace-card-actions">
                <button class="workspace-enter-button" type="button" data-workspace-id="${escapeHtml(workspace.id)}">${escapeHtml(t("enterProject"))}</button>
                <button class="text-button workspace-delete-button ${canDeleteWorkspace(workspace) ? "" : "hidden"}" type="button" data-delete-workspace-id="${escapeHtml(workspace.id)}">${escapeHtml(t("deleteWorkspace"))}</button>
                <span class="workspace-delete-note ${workspace.library_type === "team" ? "" : "hidden"}">${escapeHtml(t("deleteWorkspaceBlocked"))}</span>
            </div>
        </article>
    `).join("");
    els.customWorkspaces.querySelectorAll("[data-workspace-id]").forEach((button) => {
        button.addEventListener("click", () => openCustomWorkspace(button.dataset.workspaceId));
    });
    els.customWorkspaces.querySelectorAll("[data-delete-workspace-id]").forEach((button) => {
        button.addEventListener("click", () => deleteWorkspace(button.dataset.deleteWorkspaceId));
    });
}

async function deleteWorkspace(workspaceId) {
    const workspace = state.customWorkspaces.find((item) => item.id === workspaceId);
    if (!workspace) return;
    if (!window.confirm(`${t("deleteWorkspaceConfirm")}\n${workspace.name}`)) return;
    try {
        await fetchJson(`/api/workspaces/${encodeURIComponent(workspaceId)}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_token: state.userToken,
                user_name: state.userName,
            }),
        });
        if (activeWorkspaceId() === workspaceId) returnToProjectHub();
        await loadWorkspaces();
    } catch (error) {
        window.alert(formatError(error.message));
    }
}

async function createWorkspace(event) {
    event.preventDefault();
    const name = els.newWorkspaceName.value.trim();
    if (!name) return;
    const libraryType = document.querySelector("input[name='workspace-type']:checked")?.value || "personal";
    els.workspaceMessage.textContent = "";
    try {
        const result = await fetchJson("/api/workspaces", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                library_type: libraryType,
                user_name: state.userName,
                user_token: state.userToken,
            }),
        });
        els.newWorkspaceName.value = "";
        els.workspaceCreateSetup.classList.add("hidden");
        els.startCreateWorkspace.classList.remove("hidden");
        els.workspaceMessage.textContent = t("workspaceCreated");
        els.workspaceMessage.className = "form-message success-text";
        await loadWorkspaces();
        openCustomWorkspace(result.workspace.id);
    } catch (error) {
        els.workspaceMessage.textContent = `${t("workspaceCreateFailed")} ${formatError(error.message)}`;
        els.workspaceMessage.className = "form-message error-text";
    }
}

function openCustomWorkspace(workspaceId) {
    const workspace = state.customWorkspaces.find((item) => item.id === workspaceId) || { id: workspaceId, name: t("customWorkspace") };
    state.project = `workspace:${workspaceId}`;
    state.activeWorkspace = workspace;
    state.evidenceLibrary = [];
    saveEvidenceLibrary();
    sessionStorage.setItem("litdb.project", state.project);
    refreshUserState();
    loadWorkspacePdfs();
    loadUploads();
    activateView("papers");
}

function switchUser() {
    state.userName = "";
    state.userToken = "";
    state.userId = "";
    state.project = "";
    state.draftHistory = [];
    localStorage.removeItem("litdb.userName");
    localStorage.removeItem("litdb.userToken");
    localStorage.removeItem("litdb.userId");
    sessionStorage.removeItem("litdb.project");
    renderDraftHistory();
    refreshUserState();
    els.loginName.focus();
}

function applyUser(user) {
    state.userName = (user.name || "").trim();
    state.userToken = user.token || "";
    state.userId = user.id || "";
    localStorage.setItem("litdb.userName", state.userName);
    if (state.userToken) localStorage.setItem("litdb.userToken", state.userToken);
    if (state.userId) localStorage.setItem("litdb.userId", state.userId);
}

function routeWantsArticleComposer() {
    const params = new URLSearchParams(window.location.search);
    return params.get("compose") === "article"
        || window.location.hash === "#article-compose-page"
        || sessionStorage.getItem("litdb.openArticleComposer") === "1";
}

function applyInitialRoute() {
    if (routeWantsArticleComposer()) {
        state.project = "aps-review";
        sessionStorage.setItem("litdb.project", state.project);
    }
}

function openRequestedComposer() {
    if (!routeWantsArticleComposer() || !state.userName) return;
    state.evidenceLibrary = loadEvidenceLibrary();
    state.project = "aps-review";
    sessionStorage.setItem("litdb.project", state.project);
    refreshUserState();
    sessionStorage.removeItem("litdb.openArticleComposer");
    window.history.replaceState(null, "", window.location.pathname);
    window.setTimeout(() => openArticleComposer(true), 0);
}

async function ensureUserSession() {
    if (!state.userName || state.userToken) return;
    try {
        const result = await fetchJson("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: state.userName }),
        });
        applyUser(result.user || { name: state.userName });
        loadDraftHistory();
    } catch {
        // The workspace can still be browsed; draft history will resume after the next login.
    }
}

function bindLanguage() {
    document.querySelectorAll(".lang-button").forEach((button) => {
        button.addEventListener("click", () => {
            state.lang = button.dataset.lang;
            localStorage.setItem("litdb.lang", state.lang);
            applyLanguage();
            refreshUserState();
            applyFilters();
            loadHealth();
            loadUploads();
        });
    });
}

function applyLanguage() {
    document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-i18n]").forEach((node) => {
        node.textContent = t(node.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
        node.placeholder = t(node.dataset.i18nPlaceholder);
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
        node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((node) => {
        node.setAttribute("title", t(node.dataset.i18nTitle));
    });
    document.querySelectorAll(".lang-button").forEach((button) => {
        button.classList.toggle("active", button.dataset.lang === state.lang);
    });
    renderEvidenceLibrary();
    renderDraftHistory();
    if (state.uploads.length) renderUploads();
    populateModuleFilter(state.moduleCounts);
}

function refreshUserState() {
    const hasUser = Boolean(state.userName);
    const inProject = hasUser && Boolean(state.project);
    const custom = isCustomWorkspace();
    els.loginScreen.classList.toggle("hidden", hasUser);
    els.projectScreen.classList.toggle("hidden", !hasUser || inProject);
    els.appShell.classList.toggle("hidden", !inProject);
    if (!inProject) {
        els.articleComposePage.classList.add("hidden");
        els.draftHistoryPage.classList.add("hidden");
        els.mainWorkspace.classList.remove("hidden");
    }
    els.loginName.value = state.userName;
    els.userChip.textContent = state.userName ? `${state.userName} · ${t("switchUser")}` : t("loginButton");
    els.projectUserChip.textContent = state.userName ? `${state.userName} · ${t("switchUser")}` : t("loginButton");
    document.querySelector("[data-i18n='appEyebrow']").textContent = custom ? t("customWorkspace") : t("appEyebrow");
    document.querySelector("[data-i18n='appTitle']").textContent = custom ? (state.activeWorkspace?.name || t("customWorkspace")) : t("appTitle");
    document.querySelector("[data-i18n='reviewReadyPapers']").textContent = custom ? t("pdfLibrary") : t("reviewReadyPapers");
    document.querySelector("[data-i18n='askAcrossCorpus']").textContent = custom ? t("workspaceQueryPlaceholder") : t("askAcrossCorpus");
    document.querySelector("[data-i18n='uploadQueue']").textContent = custom ? t("pdfFiles") : t("uploadQueue");
    document.querySelector("[data-i18n='corpus']").textContent = custom ? t("pdfLibrary") : t("corpus");
    document.querySelector("[data-i18n='papersMetric']").textContent = custom ? t("pdfFiles") : t("papersMetric");
    document.querySelector("[data-i18n='tabPapers']").textContent = custom ? t("pdfFiles") : t("tabPapers");
    els.uploadPmid.classList.toggle("hidden", custom && !activeWorkspaceRequiresPmid());
    els.priorityFilter.closest(".panel").classList.toggle("hidden", custom);
    els.paperPagination.classList.toggle("hidden", custom);
    els.queryInput.placeholder = custom ? t("workspaceQueryPlaceholder") : t("queryPlaceholder");
    els.draftHistoryChip.disabled = !state.userToken;
    els.signedUpload.textContent = custom
        ? (activeWorkspaceRequiresPmid() ? t("teamWorkspaceHint") : t("workspaceUploadHint"))
        : (state.userName ? `${t("signedInAs")}: ${state.userName}` : "");
    els.skipLink.href = inProject ? "#main-workspace" : "#project-main";
    if (state.uploads.length) renderUploads();
    if (inProject) loadDraftHistory();
}

function bindTabs() {
    document.querySelectorAll(".tab-button").forEach((button) => {
        button.addEventListener("click", () => {
            activateView(button.dataset.view);
        });
    });
}

function activateView(view) {
    document.querySelectorAll(".tab-button").forEach((item) => {
        item.classList.toggle("active", item.dataset.view === view);
    });
    document.querySelectorAll(".view").forEach((item) => item.classList.remove("active"));
    const target = document.getElementById(`view-${view}`);
    if (target) target.classList.add("active");
}

function bindFilters() {
    let searchTimeout;
    [els.searchInput, els.priorityFilter, els.moduleFilter].forEach((input) => {
        const eventType = input === els.searchInput ? "input" : "change";
        input.addEventListener(eventType, () => {
            state.paperPage = 1;
            if (input === els.searchInput) {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(applyFilters, 300);
            } else {
                applyFilters();
            }
        });
    });
}

function bindPagination() {
    els.prevPage.addEventListener("click", () => {
        if (state.paperPage <= 1) return;
        state.paperPage -= 1;
        renderPapers();
    });
    els.nextPage.addEventListener("click", () => {
        const totalPages = pageCount();
        if (state.paperPage >= totalPages) return;
        state.paperPage += 1;
        renderPapers();
    });
    els.pageSelect.addEventListener("change", () => {
        state.paperPage = Number(els.pageSelect.value || 1);
        renderPapers();
    });
}

function bindQuery() {
    els.queryForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const question = els.queryInput.value.trim();
        if (!question) return;
        await askPaperQA(question);
    });

    document.querySelectorAll("[data-question]").forEach((button) => {
        button.addEventListener("click", () => {
            els.queryInput.value = button.dataset.question;
            askPaperQA(button.dataset.question);
        });
    });
}

function bindEvidenceLibrary() {
    els.clearLibrary.addEventListener("click", () => {
        state.evidenceLibrary = [];
        saveEvidenceLibrary();
        syncEvidenceCards();
        renderEvidenceLibrary();
    });
    els.composeButton.addEventListener("click", openArticleComposer);
}

function handleStorageUpdate(event) {
    if (event.key === "litdb.evidenceLibrary") {
        state.evidenceLibrary = loadEvidenceLibrary();
        syncEvidenceCards();
        renderEvidenceLibrary();
    }
}

function handleFocusRefresh() {
    const latestLibrary = loadEvidenceLibrary();
    if (JSON.stringify(latestLibrary) !== JSON.stringify(state.evidenceLibrary)) {
        state.evidenceLibrary = latestLibrary;
        syncEvidenceCards();
        renderEvidenceLibrary();
    }
}

function bindArticleComposer() {
    els.backToWorkspace.addEventListener("click", closeArticleComposer);
    els.addParagraph.addEventListener("click", () => addArticleParagraph());
    els.generateArticle.addEventListener("click", generateArticleDraft);
}

function bindDraftHistoryPage() {
    els.draftHistoryChip.addEventListener("click", openDraftHistoryPage);
    els.backFromHistory.addEventListener("click", closeDraftHistoryPage);
}

function bindUpload() {
    els.uploadForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        await uploadPdf();
    });
    els.refreshUploads.addEventListener("click", loadUploads);
    els.myUploadsOnly.checked = state.myUploadsOnly;
    els.myUploadsOnly.addEventListener("change", () => {
        state.myUploadsOnly = els.myUploadsOnly.checked;
        localStorage.setItem("litdb.myUploadsOnly", state.myUploadsOnly ? "1" : "0");
        state.uploadPage = 1;
        renderUploads();
    });
    els.prevUploadPage.addEventListener("click", () => {
        if (state.uploadPage <= 1) return;
        state.uploadPage -= 1;
        renderUploads();
    });
    els.nextUploadPage.addEventListener("click", () => {
        const totalPages = Math.max(1, Math.ceil(state.filteredUploads.length / state.uploadPageSize));
        if (state.uploadPage >= totalPages) return;
        state.uploadPage += 1;
        renderUploads();
    });
}

async function loadHealth() {
    try {
        const health = await fetchJson("/api/health");
        const ready = Boolean(health.engine && health.engine.ready);
        const loading = Boolean(health.engine && health.engine.loading);
        const error = health.engine && health.engine.error;
        const dot = els.statusStrip.querySelector(".status-dot");
        dot.className = `status-dot ${loading ? "status-waiting" : ready ? "status-ready" : error ? "status-error" : "status-waiting"}`;
        els.engineStatus.textContent = loading
            ? t("paperQANotReady")
            : ready
              ? `${t("paperQAReady")} · ${health.engine.docs_count} ${t("docsUnit")}`
              : error
                ? t("paperQAUnavailable")
                : t("paperQANotReady");
        els.metricPapers.textContent = health.corpus ? health.corpus.papers_count : "--";
        renderPrioritySummary(health.corpus ? health.corpus.priority_counts : {});
        renderLlmInfo(health.llm);
    } catch (error) {
        els.engineStatus.textContent = t("healthCheckFailed");
        els.statusStrip.querySelector(".status-dot").className = "status-dot status-error";
    }
}

async function loadPapers() {
    if (isCustomWorkspace()) {
        await loadWorkspacePdfs();
        return;
    }
    try {
        const data = await fetchJson("/api/papers");
        state.papers = data.papers || [];
        state.moduleCounts = data.summary ? data.summary.module_counts : {};
        populateModuleFilter(state.moduleCounts);
        applyFilters();
    } catch (error) {
        els.papersBody.innerHTML = `<tr><td colspan="3" class="error-text">${escapeHtml(t("couldNotLoadPapers"))}: ${escapeHtml(error.message)}</td></tr>`;
    }
}

async function loadWorkspacePdfs() {
    const workspaceId = activeWorkspaceId();
    if (!workspaceId) return;
    try {
        const data = await fetchJson(`/api/workspaces/${encodeURIComponent(workspaceId)}/pdfs`);
        state.activeWorkspace = data.workspace || state.activeWorkspace;
        state.workspaceDocuments = Array.isArray(data.documents) ? data.documents : [];
        els.metricPapers.textContent = state.workspaceDocuments.length;
        els.prioritySummary.innerHTML = `<span class="pill">${escapeHtml(state.workspaceDocuments.length)} ${escapeHtml(t("pdfFiles"))}</span>`;
        renderWorkspacePdfs();
        renderUploads();
    } catch (error) {
        els.papersBody.innerHTML = `<tr><td colspan="3" class="error-text">${escapeHtml(error.message)}</td></tr>`;
    }
}

function renderWorkspacePdfs() {
    const docs = state.workspaceDocuments;
    els.paperCount.textContent = `${docs.length} ${t("pdfFiles")}`;
    if (!docs.length) {
        els.papersBody.innerHTML = `<tr><td colspan="3" class="empty-note">${escapeHtml(t("noWorkspacePdfs"))}</td></tr>`;
        els.paperDetail.innerHTML = `<p class="empty-note">${escapeHtml(t("noWorkspacePdfs"))}</p>`;
        return;
    }
    els.papersBody.innerHTML = docs.map((doc) => `
        <tr class="paper-row" data-doc-id="${escapeHtml(doc.id)}">
            <td>
                <strong>${escapeHtml(doc.original_filename || doc.filename)}</strong>
                <span class="paper-meta">${escapeHtml(formatDate(doc.uploaded_at))} · ${escapeHtml(formatSize(doc.file_size))}</span>
            </td>
            <td><span class="pdf-status available">PDF</span></td>
            <td>${escapeHtml(doc.uploaded_by || state.userName || t("missing"))}</td>
        </tr>
    `).join("");
    els.papersBody.querySelectorAll("[data-doc-id]").forEach((row) => {
        row.addEventListener("click", () => selectWorkspacePdf(row.dataset.docId));
    });
    selectWorkspacePdf(docs[0].id);
}

function selectWorkspacePdf(documentId) {
    const doc = state.workspaceDocuments.find((item) => item.id === documentId);
    if (!doc) return;
    els.paperDetail.innerHTML = `
        <h3>${escapeHtml(doc.original_filename || doc.filename)}</h3>
        <p class="paper-meta">${escapeHtml(t("customWorkspace"))} · ${escapeHtml(formatDate(doc.uploaded_at))}</p>
        <dl class="detail-grid">
            <div><dt>PDF</dt><dd><span class="pdf-status available">${escapeHtml(t("pdfAvailable"))}</span></dd></div>
            <div><dt>${escapeHtml(t("signedInAs"))}</dt><dd>${escapeHtml(doc.uploaded_by || t("missing"))}</dd></div>
            <div><dt>${escapeHtml(t("uploadRecordsUnit"))}</dt><dd>${escapeHtml(formatSize(doc.file_size))}</dd></div>
        </dl>
        <div class="detail-actions">
            <a class="source-link pdf-link" href="${escapeHtml(doc.pdf_url)}" target="_blank" rel="noopener">${escapeHtml(t("openPdf"))}</a>
        </div>
    `;
}

function populateModuleFilter(moduleCounts) {
    const modules = Object.keys(moduleCounts || {}).filter((item) => item !== "missing").sort();
    const selected = els.moduleFilter.value;
    els.moduleFilter.innerHTML = `<option value="">${escapeHtml(t("allModules"))}</option>` + modules
        .map((moduleName) => `<option value="${escapeHtml(moduleName)}">${escapeHtml(formatModuleLabel(moduleName))} (${moduleCounts[moduleName]})</option>`)
        .join("");
    if (selected && modules.includes(selected)) {
        els.moduleFilter.value = selected;
    }
}

function applyFilters() {
    if (isCustomWorkspace()) {
        renderWorkspacePdfs();
        return;
    }
    const query = els.searchInput.value.trim().toLowerCase();
    const priority = els.priorityFilter.value;
    const moduleName = els.moduleFilter.value;

    state.filteredPapers = state.papers.filter((paper) => {
        const haystack = [
            paper.pmid,
            paper.title,
            paper.authors,
            paper.journal,
            paper.year,
            paper.aps_modules,
            paper.study_types,
            compactModules(paper.aps_modules),
        ].join(" ").toLowerCase();

        return (!query || haystack.includes(query))
            && (!priority || String(paper.priority).toLowerCase() === priority)
            && (!moduleName || String(paper.aps_modules).includes(moduleName));
    });

    state.paperPage = Math.min(state.paperPage, pageCount());
    renderPapers();
}

function pageCount() {
    return Math.max(1, Math.ceil(state.filteredPapers.length / state.pageSize));
}

function updatePagination(totalPages) {
    if (!els.paperPagination) return;
    els.paperPagination.classList.toggle("hidden", !state.filteredPapers.length);
    els.prevPage.disabled = state.paperPage <= 1 || !state.filteredPapers.length;
    els.nextPage.disabled = state.paperPage >= totalPages || !state.filteredPapers.length;
    const options = Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        return `<option value="${page}" ${page === state.paperPage ? "selected" : ""}>${page}</option>`;
    }).join("");
    els.pageSelect.innerHTML = options;
    els.pageSelect.value = String(state.paperPage);
    els.pageTotal.textContent = `${t("pageOf")} ${totalPages}`;
}

function renderPapers() {
    const totalPages = pageCount();
    state.paperPage = Math.min(Math.max(state.paperPage, 1), totalPages);
    updatePagination(totalPages);
    const start = (state.paperPage - 1) * state.pageSize;
    const end = Math.min(start + state.pageSize, state.filteredPapers.length);
    const pagePapers = state.filteredPapers.slice(start, end);
    els.paperCount.textContent = state.filteredPapers.length
        ? `${start + 1}-${end} / ${state.filteredPapers.length} ${t("shown")}`
        : `0 ${t("shown")}`;
    if (!state.filteredPapers.length) {
        els.papersBody.innerHTML = `<tr><td colspan="3" class="empty-note">${escapeHtml(t("noPapers"))}</td></tr>`;
        return;
    }

    els.papersBody.innerHTML = pagePapers.map((paper) => `
        <tr class="paper-row ${paper.pmid === state.selectedPmid ? "selected" : ""}" data-pmid="${escapeHtml(paper.pmid)}">
            <td>
                <span class="paper-title-line">
                    <span class="paper-title">${escapeHtml(paper.title)}</span>
                    ${paper.pdf_upload ? `<span class="pdf-badge">PDF</span>` : ""}
                </span>
                <span class="paper-meta">PMID ${escapeHtml(paper.pmid)} · ${escapeHtml(paper.year || "n.d.")} · ${escapeHtml(paper.journal || t("unknownJournal"))}</span>
            </td>
            <td><span class="priority ${escapeHtml(String(paper.priority).toLowerCase())}">${escapeHtml(localizePriority(paper.priority || t("missing")))}</span></td>
            <td><span class="module-label">${escapeHtml(compactModules(paper.aps_modules))}</span></td>
        </tr>
    `).join("");

    document.querySelectorAll(".paper-row").forEach((row) => {
        row.addEventListener("click", () => selectPaper(row.dataset.pmid));
    });
}

async function selectPaper(pmid) {
    state.selectedPmid = pmid;
    renderPapers();
    const paper = state.papers.find((item) => item.pmid === pmid);
    if (!paper) return;
    const pdfUpload = paper.pdf_upload;

    els.paperDetail.innerHTML = `
        <h3>${escapeHtml(paper.title)}</h3>
        <p class="paper-meta">PMID ${escapeHtml(paper.pmid)} · ${escapeHtml(paper.year || "n.d.")}</p>
        <dl class="detail-grid">
            <div><dt>${escapeHtml(t("journal"))}</dt><dd>${escapeHtml(paper.journal || t("unknownJournal"))}</dd></div>
            <div><dt>${escapeHtml(t("priority"))}</dt><dd>${escapeHtml(localizePriority(paper.priority || t("missing")))}</dd></div>
            <div><dt>${escapeHtml(t("module"))}</dt><dd>${escapeHtml(compactModules(paper.aps_modules))}</dd></div>
            <div><dt>${escapeHtml(t("studyType"))}</dt><dd>${escapeHtml(paper.study_types || t("missing"))}</dd></div>
            <div><dt>DOI</dt><dd>${escapeHtml(paper.doi || t("missing"))}</dd></div>
            <div><dt>PDF</dt><dd><span class="pdf-status ${pdfUpload ? "available" : ""}">${escapeHtml(pdfUpload ? t("pdfAvailable") : t("pdfMissing"))}</span></dd></div>
        </dl>
        <div class="detail-actions">
            <a class="source-link" href="/papers/${encodeURIComponent(paper.pmid)}" target="_blank" rel="noopener">${escapeHtml(t("openPaper"))}</a>
            ${pdfUpload ? `<a class="source-link pdf-link" href="${escapeHtml(pdfUpload.url)}" target="_blank" rel="noopener">${escapeHtml(t("openPdf"))}</a>` : ""}
        </div>
        <p class="abstract">${escapeHtml(paper.abstract || t("noAbstract"))}</p>
    `;
}

async function askPaperQA(question) {
    state.evidenceByKey = {};
    els.answerPanel.innerHTML = renderProgressNotice(t("searchingCorpus"));
    try {
        const endpoint = isCustomWorkspace()
            ? `/api/workspaces/${encodeURIComponent(activeWorkspaceId())}/paperqa/query`
            : "/api/paperqa/query";
        const result = await fetchJson(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, k: 10, max_sources: 5 }),
        });

        renderLlmInfo({ paperqa: result.llm, draft: result.draft_llm });
        els.answerPanel.innerHTML = `
            <div class="answer-header">
                <h3>${escapeHtml(result.question)}</h3>
                ${result.llm ? `<span class="llm-badge">${escapeHtml(formatLlm(result.llm))}</span>` : ""}
            </div>
            <div class="answer-text">${renderAnswerSegments(result.answer_segments, result.answer || t("noAnswer"))}</div>
            ${renderSources(result.contexts || [])}
        `;
        bindEvidenceControls();
    } catch (error) {
        els.answerPanel.innerHTML = `<p class="error-text">${escapeHtml(formatError(error.message))}</p>`;
    }
}

function renderAnswerSegments(segments, fallback) {
    if (!Array.isArray(segments) || !segments.length) {
        return escapeHtml(fallback || "");
    }
    return segments.map((segment) => {
        if (segment.type === "citations") {
            const citations = Array.isArray(segment.citations) ? segment.citations : [];
            if (!citations.length) return "";
            return `<span class="answer-citations">${citations.map((citation) => {
                const pmid = citation.pmid || "";
                const href = citation.url || (pmid ? `/papers/${encodeURIComponent(pmid)}` : "#");
                return `<a class="answer-citation-link" href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(citation.label || `PMID ${pmid}`)}</a>`;
            }).join("")}</span>`;
        }
        return escapeHtml(segment.text || "");
    }).join("");
}

function renderSources(contexts) {
    if (!contexts.length) return "";
    const evidenceCount = contexts.reduce((total, source) => total + ((source.evidence || []).length), 0);
    return `
        <div class="sources">
            <div class="sources-header">
                <div>
                    <p class="panel-label">${escapeHtml(t("sources"))}</p>
                    <p class="evidence-hint">${escapeHtml(t("evidenceHint"))}</p>
                </div>
                <span class="evidence-count">${evidenceCount}</span>
            </div>
            ${contexts.map((source, index) => renderSource(source, index)).join("")}
        </div>
    `;
}

function renderSource(source, index) {
    const evidence = source.evidence || [];
    const title = source.citation || source.name || `Source ${index + 1}`;
    if (!evidence.length) {
        return `
            <div class="source-item">
                <strong>${escapeHtml(title)}</strong>
                ${source.url ? `<a class="source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(t("openPaper"))}</a>` : ""}
                <p>${escapeHtml(source.text || "")}</p>
            </div>
        `;
    }

    return `
        <div class="source-item evidence-source">
            <strong>${escapeHtml(title)}</strong>
            ${evidence.map((sentence) => renderEvidenceSentence(source, sentence)).join("")}
        </div>
    `;
}

function renderEvidenceSentence(source, sentence) {
    const sourceId = sentence.pmid || source.pmid || sentence.doc_id || source.doc_id || source.name || "source";
    const key = `${sourceId}:${sentence.id}`;
    state.evidenceByKey[key] = {
        ...sentence,
        pmid: sentence.pmid || source.pmid || "",
        doc_id: sentence.doc_id || source.doc_id || "",
        citekey: sentence.citekey || source.citekey || "",
        source_name: sentence.source_name || source.citation || source.name || "",
        citation: source.citation || source.name || "",
    };
    const saved = evidenceLibraryHas(key);
    const metaLabel = sentence.citekey || source.citekey
        ? `@${sentence.citekey || source.citekey}`
        : sentence.pmid || source.pmid
        ? `PMID ${sentence.pmid || source.pmid}`
        : (sentence.source_name || source.citation || source.name || t("pdfFiles"));
    return `
        <label class="evidence-card is-highlighted ${saved ? "saved" : ""}">
            <input class="evidence-check" type="checkbox" data-key="${escapeHtml(key)}" ${saved ? "checked" : ""}>
            <span class="evidence-content">
                <span class="evidence-meta">${escapeHtml(metaLabel)} · ${escapeHtml(sentence.section || "")}</span>
                <span class="evidence-text">${escapeHtml(sentence.text || "")}</span>
                <span class="evidence-action-row">
                    <span class="evidence-state">${escapeHtml(saved ? t("inEvidenceLibrary") : t("addToEvidenceLibrary"))}</span>
                    <a class="source-link evidence-link" href="${escapeHtml(sentence.url || source.url || "")}" target="_blank" rel="noopener">${escapeHtml(t("openPaper"))}</a>
                </span>
            </span>
        </label>
    `;
}

function renderDraftBuilder(evidenceCount) {
    if (!evidenceCount) return "";
    return `
        <section class="draft-builder">
            <div class="draft-mode-row">
                <label class="mode-option active">
                    <input type="radio" name="draft-mode" value="review" checked>
                    <span>${escapeHtml(t("reviewMode"))}</span>
                </label>
                ${["grantMode", "clinicalMode", "slideMode"].map((key) => `
                    <label class="mode-option disabled" title="${escapeHtml(t("disabledSoon"))}">
                        <input type="radio" name="draft-mode" disabled>
                        <span>${escapeHtml(t(key))}</span>
                    </label>
                `).join("")}
            </div>
            <div class="draft-actions">
                <span id="selected-evidence-count"></span>
                <button class="primary-button" id="generate-draft" type="button">${escapeHtml(t("generateFromEvidence"))}</button>
            </div>
            <div class="draft-output hidden" id="draft-output"></div>
        </section>
    `;
}

function bindEvidenceControls() {
    document.querySelectorAll(".evidence-check").forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                addEvidenceToLibrary(checkbox.dataset.key);
            } else {
                removeEvidenceFromLibrary(checkbox.dataset.key);
            }
            syncEvidenceCards();
            renderEvidenceLibrary();
        });
    });
    document.querySelectorAll(".evidence-link").forEach((link) => {
        link.addEventListener("click", (event) => event.stopPropagation());
    });
    syncEvidenceCards();
}

function addEvidenceToLibrary(key) {
    const evidence = state.evidenceByKey[key];
    if (!evidence || evidenceLibraryHas(key)) return;
    state.evidenceLibrary.push({ key, ...evidence });
    saveEvidenceLibrary();
}

function removeEvidenceFromLibrary(key) {
    state.evidenceLibrary = state.evidenceLibrary.filter((item) => item.key !== key);
    saveEvidenceLibrary();
}

function evidenceLibraryHas(key) {
    return state.evidenceLibrary.some((item) => item.key === key);
}

function loadEvidenceLibrary() {
    try {
        const items = JSON.parse(localStorage.getItem("litdb.evidenceLibrary") || "[]");
        return Array.isArray(items) ? items : [];
    } catch {
        return [];
    }
}

function saveEvidenceLibrary() {
    localStorage.setItem("litdb.evidenceLibrary", JSON.stringify(state.evidenceLibrary.slice(0, 60)));
}

function renderEvidenceLibrary() {
    if (!els.libraryList) return;
    els.libraryCount.textContent = String(state.evidenceLibrary.length);
    els.composeButton.disabled = !state.evidenceLibrary.length;
    els.clearLibrary.disabled = !state.evidenceLibrary.length;
    if (!state.evidenceLibrary.length) {
        els.libraryList.innerHTML = `
            <div class="library-empty">
                <p class="empty-note compact-note">${escapeHtml(t("noEvidenceSaved"))}</p>
                <button class="secondary-button small-button library-preview-button" id="preview-library" type="button">${escapeHtml(t("previewEvidenceLibrary"))}</button>
            </div>
        `;
        document.getElementById("preview-library")?.addEventListener("click", seedEvidenceLibraryFromPaper);
        return;
    }
    els.libraryList.innerHTML = state.evidenceLibrary.map((item) => `
        <div class="library-item">
            <p>${escapeHtml(item.text || "")}</p>
            <div class="library-meta">
                <span>${escapeHtml(item.citekey ? `@${item.citekey}` : item.pmid ? `PMID ${item.pmid}` : (item.source_name || item.citation || item.doc_id || t("pdfFiles")))}</span>
                <button class="text-button remove-library-item" type="button" data-key="${escapeHtml(item.key)}">${escapeHtml(t("removeEvidence"))}</button>
            </div>
        </div>
    `).join("");
    document.querySelectorAll(".remove-library-item").forEach((button) => {
        button.addEventListener("click", () => {
            removeEvidenceFromLibrary(button.dataset.key);
            syncEvidenceCards();
            renderEvidenceLibrary();
        });
    });
}

async function loadDraftHistory() {
    if (!state.userToken) {
        state.draftHistory = [];
        renderDraftHistory();
        return;
    }
    try {
        const data = await fetchJson(`/api/drafts?user_token=${encodeURIComponent(state.userToken)}`);
        state.draftHistory = Array.isArray(data.drafts) ? data.drafts : [];
    } catch {
        state.draftHistory = [];
    }
    renderDraftHistory();
}

function renderDraftHistory() {
    if (els.draftHistoryCount) {
        els.draftHistoryCount.textContent = String(state.draftHistory.length);
    }
    if (els.draftHistorySummary) {
        els.draftHistorySummary.textContent = `${state.draftHistory.length} ${t("draftHistorySummary")}`;
    }
    if (!els.draftHistoryList) return;
    if (!state.draftHistory.length) {
        els.draftHistoryList.innerHTML = `<p class="empty-note compact-note">${escapeHtml(t("noDraftHistory"))}</p>`;
        return;
    }
    els.draftHistoryList.innerHTML = state.draftHistory.map((item) => {
        const typeLabel = item.type === "article" ? t("articleDraft") : t("paragraphDraft");
        const paragraphCount = Number(item.paragraph_count || 0);
        const evidenceCount = Number(item.evidence_count || 0);
        const draftText = String(item.draft || "").trim();
        const meta = [
            formatDate(item.created_at),
            paragraphCount > 1 ? `${paragraphCount} ${t("paragraphCountShort")}` : "",
            `${evidenceCount} ${t("evidenceCountShort")}`,
        ].filter(Boolean).join(" · ");
        const pinned = Boolean(item.pinned);
        return `
            <article class="draft-history-item ${pinned ? "pinned" : ""}">
                <div class="draft-history-head">
                    <div>
                        <strong>${escapeHtml(typeLabel)}</strong>
                        <span>${escapeHtml(meta)}</span>
                    </div>
                    <div class="draft-history-actions">
                        ${pinned ? `<span class="pinned-badge">${escapeHtml(t("pinnedRecord"))}</span>` : ""}
                        <button class="secondary-button small-button pin-draft" type="button" data-id="${escapeHtml(item.id)}" data-pinned="${pinned ? "true" : "false"}">${escapeHtml(pinned ? t("unpinRecord") : t("pinRecord"))}</button>
                        <button class="text-button danger-text-button delete-draft" type="button" data-id="${escapeHtml(item.id)}">${escapeHtml(t("deleteRecord"))}</button>
                    </div>
                </div>
                <p>${escapeHtml(draftText)}</p>
            </article>
        `;
    }).join("");
    document.querySelectorAll(".pin-draft").forEach((button) => {
        button.addEventListener("click", () => updateDraftPin(button.dataset.id, button.dataset.pinned !== "true"));
    });
    document.querySelectorAll(".delete-draft").forEach((button) => {
        button.addEventListener("click", () => deleteDraftRecord(button.dataset.id));
    });
}

async function updateDraftPin(recordId, pinned) {
    if (!recordId || !state.userToken) return;
    try {
        await fetchJson(`/api/drafts/${encodeURIComponent(recordId)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_token: state.userToken, pinned }),
        });
        await loadDraftHistory();
    } catch (error) {
        window.alert(`${t("updateFailed")}: ${formatError(error.message)}`);
    }
}

async function deleteDraftRecord(recordId) {
    if (!recordId || !state.userToken) return;
    if (!window.confirm(t("deleteDraftConfirm"))) return;
    try {
        await fetchJson(`/api/drafts/${encodeURIComponent(recordId)}?user_token=${encodeURIComponent(state.userToken)}`, {
            method: "DELETE",
        });
        await loadDraftHistory();
    } catch (error) {
        window.alert(`${t("deleteFailed")}: ${formatError(error.message)}`);
    }
}

async function seedEvidenceLibraryFromPaper() {
    const button = document.getElementById("preview-library");
    if (button) {
        button.disabled = true;
        button.textContent = t("loadingPreviewEvidence");
    }
    const fallbackPaper = state.papers.find((paper) => paper.pmid) || {};
    const pmid = state.selectedPmid || fallbackPaper.pmid || "41420536";
    try {
        const data = await fetchJson(`/api/papers/${encodeURIComponent(pmid)}/evidence`);
        const sample = (data.sentences || [])
            .filter((item) => (item.text || "").length > 80)
            .slice(0, 4);
        for (const sentence of sample) {
            const key = `${sentence.pmid || data.pmid}:${sentence.id}`;
            if (evidenceLibraryHas(key)) continue;
            state.evidenceLibrary.push({
                key,
                ...sentence,
                pmid: sentence.pmid || data.pmid,
                citation: data.title || "",
                url: `/papers/${encodeURIComponent(sentence.pmid || data.pmid)}?highlight=${encodeURIComponent(sentence.id)}#${encodeURIComponent(sentence.id)}`,
            });
        }
        saveEvidenceLibrary();
        syncEvidenceCards();
        renderEvidenceLibrary();
    } catch (error) {
        if (button) {
            button.disabled = false;
            button.textContent = t("previewEvidenceLibrary");
        }
        els.libraryList.insertAdjacentHTML("beforeend", `<p class="error-text">${escapeHtml(t("previewEvidenceFailed"))}</p>`);
    }
}

function syncEvidenceCards() {
    document.querySelectorAll(".evidence-check").forEach((checkbox) => {
        const saved = evidenceLibraryHas(checkbox.dataset.key);
        checkbox.checked = saved;
        const card = checkbox.closest(".evidence-card");
        if (card) card.classList.toggle("saved", saved);
        const stateNode = card ? card.querySelector(".evidence-state") : null;
        if (stateNode) stateNode.textContent = saved ? t("inEvidenceLibrary") : t("addToEvidenceLibrary");
    });
}

function openArticleComposer(force = false) {
    state.evidenceLibrary = loadEvidenceLibrary();
    if (!force && !state.evidenceLibrary.length) return;
    els.mainWorkspace.classList.add("hidden");
    els.draftHistoryPage.classList.add("hidden");
    els.articleComposePage.classList.remove("hidden");
    els.skipLink.href = "#article-compose-page";
    els.articleOutput.classList.add("hidden");
    els.articleOutput.innerHTML = "";
    if (!els.articleParagraphs.children.length) {
        addArticleParagraph();
        addArticleParagraph();
    } else {
        refreshArticleParagraphEvidence();
    }
    els.articleComposePage.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeArticleComposer() {
    els.articleComposePage.classList.add("hidden");
    els.mainWorkspace.classList.remove("hidden");
    els.skipLink.href = "#main-workspace";
}

function openDraftHistoryPage() {
    if (!state.userToken) return;
    els.mainWorkspace.classList.add("hidden");
    els.articleComposePage.classList.add("hidden");
    els.draftHistoryPage.classList.remove("hidden");
    els.skipLink.href = "#draft-history-page";
    loadDraftHistory();
    els.draftHistoryPage.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeDraftHistoryPage() {
    els.draftHistoryPage.classList.add("hidden");
    els.mainWorkspace.classList.remove("hidden");
    els.skipLink.href = "#main-workspace";
}

function addArticleParagraph() {
    const paragraphIndex = els.articleParagraphs.children.length + 1;
    const evidenceItems = renderArticleEvidenceChoices(paragraphIndex);
    els.articleParagraphs.insertAdjacentHTML("beforeend", `
        <section class="article-paragraph-card" data-paragraph-id="${Date.now()}-${paragraphIndex}">
            <div class="article-paragraph-head">
                <h3>${escapeHtml(t("paragraphLabel"))} ${paragraphIndex}</h3>
                <button class="text-button remove-paragraph" type="button">${escapeHtml(t("removeParagraph"))}</button>
            </div>
            <label class="field-label">${escapeHtml(t("paragraphBrief"))}</label>
            <textarea class="query-input compact-query paragraph-goal" placeholder="${escapeHtml(t("paragraphBriefPlaceholder"))}"></textarea>
            <label class="field-label">${escapeHtml(t("paragraphLength"))}</label>
            <input class="text-input paragraph-length" type="text" inputmode="numeric" placeholder="${escapeHtml(t("paragraphLengthPlaceholder"))}">
            <div class="compose-evidence-head">
                <span>${escapeHtml(t("paragraphEvidence"))}</span>
                <span class="paragraph-evidence-count"></span>
            </div>
            <div class="compose-evidence-list paragraph-evidence-list">${evidenceItems}</div>
        </section>
    `);
    bindArticleParagraphCard(els.articleParagraphs.lastElementChild);
    updateArticleParagraphLabels();
}

function renderArticleEvidenceChoices(paragraphIndex) {
    const splitAt = Math.ceil(state.evidenceLibrary.length / 2);
    return state.evidenceLibrary.map((item, itemIndex) => {
        const checked = paragraphIndex === 1
            ? itemIndex < splitAt
            : paragraphIndex === 2
              ? itemIndex >= splitAt
              : false;
        return `
            <label class="compose-evidence-item">
                <input class="article-evidence-check" type="checkbox" data-key="${escapeHtml(item.key)}" ${checked ? "checked" : ""}>
                <span>
                    <strong>${escapeHtml(item.citekey ? `@${item.citekey}` : item.pmid ? `PMID ${item.pmid}` : (item.source_name || item.citation || item.doc_id || t("pdfFiles")))}</strong>
                    <small>${escapeHtml(item.section || "")}</small>
                    <em>${escapeHtml(item.text || "")}</em>
                </span>
            </label>
        `;
    }).join("");
}

function bindArticleParagraphCard(card) {
    card.querySelector(".remove-paragraph").addEventListener("click", () => {
        card.remove();
        updateArticleParagraphLabels();
    });
    card.querySelectorAll(".article-evidence-check").forEach((checkbox) => {
        checkbox.addEventListener("change", () => updateArticleParagraphCount(card));
    });
    updateArticleParagraphCount(card);
}

function updateArticleParagraphLabels() {
    Array.from(els.articleParagraphs.children).forEach((card, index) => {
        card.querySelector("h3").textContent = `${t("paragraphLabel")} ${index + 1}`;
        updateArticleParagraphCount(card);
    });
}

function updateArticleParagraphCount(card) {
    const count = card.querySelectorAll(".article-evidence-check:checked").length;
    const node = card.querySelector(".paragraph-evidence-count");
    if (node) node.textContent = `${count} ${t("selectedForParagraph")}`;
}

function refreshArticleParagraphEvidence() {
    els.articleParagraphs.innerHTML = "";
    addArticleParagraph();
    addArticleParagraph();
}

function collectArticleParagraphs() {
    return Array.from(els.articleParagraphs.children).map((card) => {
        const instruction = (card.querySelector(".paragraph-goal")?.value || "").trim();
        const length = (card.querySelector(".paragraph-length")?.value || "").trim();
        const evidences = Array.from(card.querySelectorAll(".article-evidence-check:checked"))
            .map((checkbox) => state.evidenceLibrary.find((item) => item.key === checkbox.dataset.key))
            .filter(Boolean);
        return { instruction, length, evidences };
    }).filter((paragraph) => paragraph.instruction || paragraph.length || paragraph.evidences.length);
}

async function generateArticleDraft() {
    const paragraphs = collectArticleParagraphs();
    if (!paragraphs.length) {
        showArticleOutput(`<p class="error-text">${escapeHtml(t("articleNeedParagraph"))}</p>`);
        return;
    }
    if (!paragraphs.some((paragraph) => paragraph.evidences.length)) {
        showArticleOutput(`<p class="error-text">${escapeHtml(t("articleNeedEvidence"))}</p>`);
        return;
    }
    showArticleOutput(renderProgressNotice(t("generatingArticle")));
    try {
        const result = await fetchJson("/api/draft/article", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                mode: "review",
                lang: state.lang,
                paragraphs,
                user_token: state.userToken,
                user_name: state.userName,
            }),
        });
        renderLlmInfo({ draft: result.llm });
        loadDraftHistory();
        showArticleOutput(`
            <div class="answer-header">
                <h3>${escapeHtml(t("generatedArticle"))}</h3>
                <span class="llm-badge">${escapeHtml(formatLlm(result.llm))}</span>
            </div>
            <div class="answer-text">${escapeHtml(result.draft || "")}</div>
            ${renderCitationKeySummary(result.citation_keys)}
        `);
    } catch (error) {
        showArticleOutput(`<p class="error-text">${escapeHtml(formatError(error.message))}</p>`);
    }
}

function renderCitationKeySummary(keys) {
    if (!Array.isArray(keys) || !keys.length) return "";
    return `
        <div class="citation-key-summary">
            <strong>${escapeHtml(t("citationKeysUsed"))}</strong>
            <span>${keys.map((key) => `[@${escapeHtml(key)}]`).join(" ")}</span>
        </div>
    `;
}

function showArticleOutput(html) {
    els.articleOutput.classList.remove("hidden");
    els.articleOutput.innerHTML = html;
    els.articleOutput.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function openDraftComposer() {
    activateView("ask");
    els.answerPanel.innerHTML = renderDraftComposer();
    bindDraftComposer();
    els.answerPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderDraftComposer() {
    const evidenceOptions = state.evidenceLibrary.map((item) => `
        <label class="compose-evidence-item">
            <input class="compose-evidence-check" type="checkbox" data-key="${escapeHtml(item.key)}" checked>
            <span>
                <strong>${escapeHtml(item.citekey ? `@${item.citekey}` : item.pmid ? `PMID ${item.pmid}` : (item.source_name || item.citation || item.doc_id || t("pdfFiles")))}</strong>
                <small>${escapeHtml(item.section || "")}</small>
                <em>${escapeHtml(item.text || "")}</em>
            </span>
        </label>
    `).join("");
    return `
        <section class="compose-panel">
            <div class="answer-header">
                <div>
                    <p class="panel-label">${escapeHtml(t("organizeDraft"))}</p>
                    <h3>${escapeHtml(t("reviewMode"))}</h3>
                </div>
            </div>
            <p class="evidence-hint">${escapeHtml(t("draftComposerHint"))}</p>
            <label class="field-label" for="paragraph-brief">${escapeHtml(t("paragraphBrief"))}</label>
            <textarea id="paragraph-brief" class="query-input compact-query" placeholder="${escapeHtml(t("paragraphBriefPlaceholder"))}"></textarea>
            <div class="draft-mode-row">
                <label class="mode-option active">
                    <input type="radio" name="draft-mode" value="review" checked>
                    <span>${escapeHtml(t("reviewMode"))}</span>
                </label>
                ${["grantMode", "clinicalMode", "slideMode"].map((key) => `
                    <label class="mode-option disabled" title="${escapeHtml(t("disabledSoon"))}">
                        <input type="radio" name="draft-mode" disabled>
                        <span>${escapeHtml(t(key))}</span>
                    </label>
                `).join("")}
            </div>
            <div class="compose-evidence-head">
                <span>${escapeHtml(t("evidenceForParagraph"))}</span>
                <span id="compose-evidence-count"></span>
            </div>
            <div class="compose-evidence-list">${evidenceOptions || `<p class="empty-note">${escapeHtml(t("chooseEvidenceForDraft"))}</p>`}</div>
            <div class="draft-actions">
                <span></span>
                <button class="primary-button" id="generate-draft" type="button">${escapeHtml(t("generateFromEvidence"))}</button>
            </div>
            <div class="draft-output hidden" id="draft-output"></div>
        </section>
    `;
}

function bindDraftComposer() {
    document.querySelectorAll(".compose-evidence-check").forEach((checkbox) => {
        checkbox.addEventListener("change", updateComposerEvidenceCount);
    });
    const button = document.getElementById("generate-draft");
    if (button) button.addEventListener("click", generateDraftParagraph);
    updateComposerEvidenceCount();
}

function selectedComposerEvidence() {
    return Array.from(document.querySelectorAll(".compose-evidence-check:checked"))
        .map((checkbox) => state.evidenceLibrary.find((item) => item.key === checkbox.dataset.key))
        .filter(Boolean);
}

function updateComposerEvidenceCount() {
    const node = document.getElementById("compose-evidence-count");
    if (node) {
        node.textContent = `${selectedComposerEvidence().length} ${t("selectedForParagraph")}`;
    }
}

async function generateDraftParagraph() {
    const evidences = selectedComposerEvidence();
    const output = document.getElementById("draft-output");
    const instruction = (document.getElementById("paragraph-brief")?.value || "").trim();
    if (!evidences.length) {
        output.classList.remove("hidden");
        output.innerHTML = `<p class="error-text">${escapeHtml(t("chooseEvidenceForDraft"))}</p>`;
        return;
    }
    output.classList.remove("hidden");
    output.innerHTML = renderProgressNotice(t("generatingDraft"));
    try {
        const result = await fetchJson("/api/draft/paragraph", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                mode: "review",
                lang: state.lang,
                instruction,
                evidences,
                user_token: state.userToken,
                user_name: state.userName,
            }),
        });
        renderLlmInfo({ draft: result.llm });
        loadDraftHistory();
        output.innerHTML = `
            <div class="answer-header">
                <h3>${escapeHtml(t("generatedParagraph"))}</h3>
                <span class="llm-badge">${escapeHtml(formatLlm(result.llm))}</span>
            </div>
            <div class="answer-text">${escapeHtml(result.draft || "")}</div>
            ${renderCitationKeySummary(result.citation_keys)}
        `;
    } catch (error) {
        output.innerHTML = `<p class="error-text">${escapeHtml(formatError(error.message))}</p>`;
    }
}

async function uploadPdf() {
    const file = els.uploadFile.files[0];
    const pmid = els.uploadPmid.value.trim();
    const uploaderName = state.userName.trim();
    if (isCustomWorkspace()) {
        await uploadWorkspacePdf(file, uploaderName);
        return;
    }
    if (!file || !pmid) {
        setUploadMessage(t("uploadMissing"), true);
        return;
    }
    if (!uploaderName) {
        setUploadMessage(t("uploadNeedLogin"), true);
        return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("pmid", pmid);
    formData.append("uploader_name", uploaderName);

    setUploadProgress(t("uploadingPdf"));
    try {
        await fetchJson("/api/upload", { method: "POST", body: formData });
        els.uploadForm.reset();
        setUploadMessage(t("uploadSaved"), false, true);
        loadUploads();
    } catch (error) {
        setUploadMessage(formatError(error.message), true);
    }
}

async function uploadWorkspacePdf(file, uploaderName) {
    if (!file) {
        setUploadMessage(t("uploadMissing"), true);
        return;
    }
    const workspaceId = activeWorkspaceId();
    if (!workspaceId) return;
    const requiresPmid = activeWorkspaceRequiresPmid();
    const pmid = els.uploadPmid.value.trim();
    if (requiresPmid && !pmid) {
        setUploadMessage(t("uploadMissing"), true);
        return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploader_name", uploaderName || state.userName);
    if (requiresPmid) formData.append("pmid", pmid);
    setUploadProgress(t("uploadingPdf"));
    try {
        await fetchJson(`/api/workspaces/${encodeURIComponent(workspaceId)}/pdfs`, { method: "POST", body: formData });
        els.uploadForm.reset();
        setUploadMessage(t("uploadSaved"), false, true);
        await loadWorkspacePdfs();
        await loadWorkspaces();
    } catch (error) {
        setUploadMessage(formatError(error.message), true);
    }
}

async function loadUploadsLegacy() {
    try {
        const data = await fetchJson("/api/uploads");
        const uploads = data.uploads || [];
        if (!uploads.length) {
            els.uploadsList.innerHTML = `<p class="empty-note">${escapeHtml(t("noUploads"))}</p>`;
            return;
        }

        const groups = {};
        for (const upload of uploads) {
            const key = upload.pmid || "unknown";
            if (!groups[key]) groups[key] = [];
            groups[key].push(upload);
        }

        els.uploadsList.innerHTML = Object.entries(groups).map(([pmid, items]) => `
            <div class="upload-group">
                <p class="upload-group-pmid">PMID ${escapeHtml(pmid)}</p>
                ${items.map((upload) => `
                    <div class="upload-item">
                        <div class="upload-info">
                            <p class="upload-name">${escapeHtml(upload.original_filename || upload.filename)}</p>
                            <p class="upload-meta">${escapeHtml(upload.uploader_name)} · ${formatDate(upload.uploaded_at)} · ${formatSize(upload.file_size)}</p>
                        </div>
                        <div class="upload-actions">
                            <span class="status-pill status-${escapeHtml(String(upload.status || "uploaded").toLowerCase().replace(/\s+/g, "-"))}">${escapeHtml(localizeUploadStatus(upload.status || "uploaded"))}</span>
                            <button class="icon-button status-toggle" data-id="${escapeHtml(String(upload.id))}" data-status="${escapeHtml(String(upload.status || "uploaded"))}" title="${escapeHtml(t("toggleStatus"))}">↻</button>
                            <button class="icon-button delete-btn" data-id="${escapeHtml(String(upload.id))}" title="${escapeHtml(t("deleteUpload"))}">×</button>
                        </div>
                    </div>
                `).join("")}
            </div>
        `).join("");

        document.querySelectorAll(".delete-btn").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = Number(btn.dataset.id);
                if (!confirm(`${t("deleteUploadConfirm")} #${id}?`)) return;
                try {
                    await fetchJson(`/api/uploads/${id}`, { method: "DELETE" });
                    loadUploads();
                } catch (err) {
                    alert(`${t("deleteFailed")}: ${err.message}`);
                }
            });
        });

        document.querySelectorAll(".status-toggle").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = Number(btn.dataset.id);
                const statusMap = { uploaded: "indexed", indexed: "uploaded" };
                const newStatus = statusMap[btn.dataset.status] || "uploaded";
                try {
                    await fetchJson(`/api/uploads/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: newStatus }),
                    });
                    loadUploads();
                } catch (err) {
                    alert(`${t("updateFailed")}: ${err.message}`);
                }
            });
        });
    } catch (error) {
        els.uploadsList.innerHTML = `<p class="error-text">${escapeHtml(error.message)}</p>`;
    }
}

async function loadUploads() {
    if (isCustomWorkspace()) {
        await loadWorkspacePdfs();
        return;
    }
    try {
        const data = await fetchJson("/api/uploads");
        state.uploads = (data.uploads || []).slice().sort((a, b) => {
            const byTime = String(b.uploaded_at || "").localeCompare(String(a.uploaded_at || ""));
            return byTime || Number(b.id || 0) - Number(a.id || 0);
        });
        renderUploads();
    } catch (error) {
        els.uploadsList.innerHTML = `<p class="error-text">${escapeHtml(error.message)}</p>`;
        els.uploadPagination.classList.add("hidden");
    }
}

function applyUploadFilters() {
    const currentUser = state.userName.trim().toLowerCase();
    state.filteredUploads = state.uploads.filter((upload) => {
        if (!state.myUploadsOnly) return true;
        return String(upload.uploader_name || "").trim().toLowerCase() === currentUser;
    });
    const totalPages = Math.max(1, Math.ceil(state.filteredUploads.length / state.uploadPageSize));
    state.uploadPage = Math.min(Math.max(1, state.uploadPage), totalPages);
}

function renderUploads() {
    if (isCustomWorkspace()) {
        renderWorkspaceUploads();
        return;
    }
    applyUploadFilters();
    if (!state.filteredUploads.length) {
        els.uploadsList.innerHTML = `<p class="empty-note">${escapeHtml(t("noUploads"))}</p>`;
        updateUploadPagination();
        return;
    }

    const start = (state.uploadPage - 1) * state.uploadPageSize;
    const pageUploads = state.filteredUploads.slice(start, start + state.uploadPageSize);
    els.uploadsList.innerHTML = `
        <div class="upload-record-list">
            ${pageUploads.map((upload) => `
                <div class="upload-item">
                    <div class="upload-info">
                        <p class="upload-name">${escapeHtml(upload.original_filename || upload.filename)}</p>
                        <p class="upload-meta">PMID ${escapeHtml(upload.pmid || t("missing"))} · ${escapeHtml(upload.uploader_name || t("missing"))} · ${formatDate(upload.uploaded_at)} · ${formatSize(upload.file_size)}</p>
                    </div>
                    <div class="upload-actions">
                        <span class="status-pill status-${escapeHtml(String(upload.status || "uploaded").toLowerCase().replace(/\s+/g, "-"))}">${escapeHtml(localizeUploadStatus(upload.status || "uploaded"))}</span>
                        ${upload.pdf_url ? `<a class="icon-button pdf-open-btn" href="${escapeHtml(upload.pdf_url)}" target="_blank" rel="noopener" title="${escapeHtml(t("openPdf"))}" aria-label="${escapeHtml(t("openPdf"))}">PDF</a>` : ""}
                        <button class="icon-button status-toggle" data-id="${escapeHtml(String(upload.id))}" data-status="${escapeHtml(String(upload.status || "uploaded"))}" title="${escapeHtml(t("toggleStatus"))}" aria-label="${escapeHtml(t("toggleStatus"))}">&#8596;</button>
                        <button class="icon-button delete-btn" data-id="${escapeHtml(String(upload.id))}" title="${escapeHtml(t("deleteUpload"))}" aria-label="${escapeHtml(t("deleteUpload"))}">&times;</button>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
    updateUploadPagination();
    bindUploadRecordActions();
}

function renderWorkspaceUploads() {
    const docs = state.workspaceDocuments || [];
    els.uploadPagination.classList.add("hidden");
    if (!docs.length) {
        els.uploadsList.innerHTML = `<p class="empty-note">${escapeHtml(t("noWorkspacePdfs"))}</p>`;
        return;
    }
    els.uploadsList.innerHTML = `
        <div class="upload-record-list">
            ${docs.map((doc) => `
                <div class="upload-item">
                    <div class="upload-info">
                        <p class="upload-name">${escapeHtml(doc.original_filename || doc.filename)}</p>
                        <p class="upload-meta">${escapeHtml(doc.uploaded_by || state.userName || t("missing"))} · ${formatDate(doc.uploaded_at)} · ${formatSize(doc.file_size)}</p>
                    </div>
                    <div class="upload-actions">
                        <span class="status-pill status-uploaded">${escapeHtml(localizeUploadStatus(doc.status || "uploaded"))}</span>
                        <a class="icon-button pdf-open-btn" href="${escapeHtml(doc.pdf_url)}" target="_blank" rel="noopener" title="${escapeHtml(t("openPdf"))}" aria-label="${escapeHtml(t("openPdf"))}">PDF</a>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

function updateUploadPagination() {
    const total = state.filteredUploads.length;
    const totalPages = Math.max(1, Math.ceil(total / state.uploadPageSize));
    const start = total ? (state.uploadPage - 1) * state.uploadPageSize + 1 : 0;
    const end = Math.min(total, state.uploadPage * state.uploadPageSize);
    els.uploadPagination.classList.toggle("hidden", total <= state.uploadPageSize);
    els.prevUploadPage.disabled = state.uploadPage <= 1;
    els.nextUploadPage.disabled = state.uploadPage >= totalPages;
    els.uploadPageStatus.textContent = `${state.uploadPage} / ${totalPages} · ${start}-${end} / ${total} ${t("uploadRecordsUnit")}`;
}

function bindUploadRecordActions() {
    els.uploadsList.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = Number(btn.dataset.id);
            if (!confirm(`${t("deleteUploadConfirm")} #${id}?`)) return;
            try {
                await fetchJson(`/api/uploads/${id}`, { method: "DELETE" });
                loadUploads();
            } catch (err) {
                alert(`${t("deleteFailed")}: ${err.message}`);
            }
        });
    });

    els.uploadsList.querySelectorAll(".status-toggle").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = Number(btn.dataset.id);
            const statusMap = { uploaded: "indexed", indexed: "uploaded" };
            const newStatus = statusMap[btn.dataset.status] || "uploaded";
            try {
                await fetchJson(`/api/uploads/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus }),
                });
                loadUploads();
            } catch (err) {
                alert(`${t("updateFailed")}: ${err.message}`);
            }
        });
    });
}

function renderPrioritySummary(counts) {
    const entries = Object.entries(counts || {});
    els.prioritySummary.innerHTML = entries.length
        ? entries.map(([key, value]) => `<span class="pill">${escapeHtml(localizePriority(key))} ${value}</span>`).join("")
        : `<span class="pill">${escapeHtml(t("noCorpusData"))}</span>`;
}

function renderLlmInfo(llm) {
    if (!llm) return;
    if (llm.paperqa && els.paperqaLlm) {
        els.paperqaLlm.textContent = `${t("paperqaLLM")}: ${formatLlm(llm.paperqa)}`;
    }
    if (llm.draft && els.draftLlm) {
        els.draftLlm.textContent = `${t("draftLLM")}: ${formatLlm(llm.draft)}`;
    }
}

async function fetchJson(url, options) {
    const response = await fetch(url, options);
    let data = null;
    try {
        data = await response.json();
    } catch {
        data = {};
    }
    if (!response.ok) {
        const detail = data.detail || data.error || response.statusText;
        throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
    return data;
}

function setUploadMessage(message, isError, isSuccess) {
    els.uploadMessage.textContent = message;
    els.uploadMessage.className = `form-message ${isError ? "error-text" : isSuccess ? "success-text" : ""}`;
}

function setUploadProgress(message) {
    els.uploadMessage.innerHTML = renderProgressNotice(message, true);
    els.uploadMessage.className = "form-message progress-message";
}

function renderProgressNotice(message, isCompact = false) {
    const safeMessage = escapeHtml(message);
    return `
        <div class="progress-notice ${isCompact ? "compact-progress" : ""}" role="status" aria-live="polite">
            <div class="progress-copy">
                <span class="progress-dot" aria-hidden="true"></span>
                <span>${safeMessage}</span>
            </div>
            <div class="pseudo-progress" role="progressbar" aria-label="${safeMessage}">
                <span></span>
            </div>
        </div>
    `;
}

function compactModules(value) {
    if (!value) return t("missing");
    return String(value).split(/[;|,]/).map((item) => formatModuleLabel(item.trim())).filter(Boolean).join(", ");
}

function formatModuleLabel(value) {
    if (!value) return t("missing");
    const raw = String(value).trim();
    if (state.lang === "zh" && MODULE_LABELS_ZH[raw]) return MODULE_LABELS_ZH[raw];
    const normalized = raw
        .replace(/^module[_-]?\d+[_-]?/i, "")
        .replace(/[_-]+/g, " ")
        .trim()
        .toLowerCase();
    if (state.lang === "zh" && MODULE_ALIAS_ZH[normalized]) return MODULE_ALIAS_ZH[normalized];
    return raw
        .replace(/^module[_-]?\d+[_-]?/i, "")
        .split(/[_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatDate(value) {
    if (!value) return t("unknownDate");
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function localizePriority(value) {
    const key = String(value || "").toLowerCase();
    if (key === "high") return t("priorityHigh");
    if (key === "medium") return t("priorityMedium");
    if (key === "low") return t("priorityLow");
    if (key === "missing") return t("missing");
    return value;
}

function localizeUploadStatus(value) {
    const key = String(value || "").toLowerCase();
    if (key === "uploaded") return t("uploadStatusUploaded");
    if (key === "indexed") return t("uploadStatusIndexed");
    return value;
}

function formatLlm(config) {
    if (!config) return "--";
    const provider = config.provider || "LLM";
    const model = config.model || "--";
    return `${provider} ${model}`;
}

function formatError(message) {
    if (!message) return "Request failed";
    return String(message).replaceAll("\\n", " ");
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
}
