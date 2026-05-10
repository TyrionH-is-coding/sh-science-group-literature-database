const AUTH_VERSION = "password-v1";
const storedAuthVersion = localStorage.getItem("litdb.authVersion");

const state = {
    papers: [],
    filteredPapers: [],
    selectedPmid: null,
    moduleCounts: {},
    customTags: [],
    paperPage: 1,
    pageSize: 50,
    notesOnly: localStorage.getItem("litdb.notesOnly") === "1",
    uploads: [],
    filteredUploads: [],
    uploadPage: 1,
    uploadPageSize: 20,
    myUploadsOnly: localStorage.getItem("litdb.myUploadsOnly") === "1",
    selectedUploadIds: new Set(),
    userName: storedAuthVersion === AUTH_VERSION ? (localStorage.getItem("litdb.userName") || "") : "",
    userToken: storedAuthVersion === AUTH_VERSION ? (localStorage.getItem("litdb.userToken") || "") : "",
    userId: storedAuthVersion === AUTH_VERSION ? (localStorage.getItem("litdb.userId") || "") : "",
    mustChangePassword: false,
    lang: localStorage.getItem("litdb.lang") || "en",
    project: sessionStorage.getItem("litdb.project") || "",
    customWorkspaces: [],
    workspaceDocuments: [],
    activeWorkspace: null,
    writingStep: Number(sessionStorage.getItem("litdb.writingStep") || 1),
    manuscriptOutline: loadManuscriptOutline(),
    activeOutlineId: "",
    outlineRetrieval: {},
    writingBlueprint: localStorage.getItem("litdb.writingBlueprint") || "",
    evidenceByKey: {},
    evidenceLibrary: loadEvidenceLibrary(),
    draftHistory: [],
};

const i18n = {
    en: {
        loginEyebrow: "Team workspace",
        loginTitle: "Welcome back",
        loginCopy: "Choose your account and enter your password.",
        loginNameLabel: "User name",
        chooseUser: "Choose user",
        passwordLabel: "Password",
        currentPasswordLabel: "Current password",
        newPasswordLabel: "New password",
        confirmPasswordLabel: "Confirm password",
        firstLoginPasswordHint: "First login: set your personal password before entering the workspace.",
        savePasswordButton: "Save password",
        cancelPasswordChange: "Back to login",
        passwordChanged: "Password saved. Entering workspace.",
        passwordMismatch: "The two new passwords do not match.",
        passwordTooShort: "New password must be at least 6 characters.",
        passwordChangeFailed: "Could not update password.",
        loginButton: "Enter workspace",
        language: "Language",
        projectEyebrow: "Project hub",
        projectTitle: "Choose a workspace",
        apsKicker: "Current workspace",
        apsTitle: "APS Review",
        apsDescription: "Systematic review corpus with PaperQA search, paper inspection, and file upload queue.",
        enterProject: "Enter project",
        newWorkspaceKicker: "Custom workspace",
        newWorkspaceTitle: "Add workspace",
        newWorkspaceDescription: "Create a small file library, then ask PaperQA and draft from selected evidence.",
        newWorkspacePlaceholder: "Workspace name",
        personalWorkspace: "Small literature library",
        personalWorkspaceHint: "No PMID required, fewer than 100 files, suitable for 2-5 collaborators.",
        teamWorkspace: "Team library",
        teamWorkspaceHint: "PMID required for each uploaded file.",
        createWorkspace: "Create workspace",
        workspaceCreated: "Workspace created.",
        workspaceCreateFailed: "Could not create workspace.",
        editWorkspace: "Edit info",
        saveWorkspaceInfo: "Save info",
        cancelWorkspaceEdit: "Cancel",
        workspaceDescriptionPlaceholder: "Library description",
        workspaceUpdated: "Library info updated.",
        workspaceUpdateFailed: "Could not update library.",
        deleteWorkspace: "Delete library",
        deleteWorkspaceConfirm: "Delete this library and its uploaded files?",
        deleteWorkspaceBlocked: "Team libraries can only be deleted by administrators.",
        workspaceDeleted: "Library deleted.",
        workspaceTypePersonal: "Small library",
        workspaceTypeTeam: "Team",
        customWorkspace: "Custom workspace",
        pdfLibrary: "File Library",
        pdfFiles: "source files",
        noWorkspacePdfs: "No PDF or Markdown files uploaded in this workspace yet.",
        workspaceUploadHint: "PMID is optional in small literature libraries.",
        workspaceQueryPlaceholder: "Ask a question about the uploaded PDF or Markdown files.",
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
        searchNotes: "Search notes",
        noteSearchPlaceholder: "Search your notes",
        notesOnly: "Only noted",
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
        createTag: "Add tag",
        newTagPlaceholder: "New filter tag",
        tagCreated: "Tag added.",
        tagCreateFailed: "Could not add tag.",
        paperTags: "Paper tags",
        paperTagsPlaceholder: "Separate tags with comma or semicolon",
        savePaperTags: "Save tags",
        paperTagsSaved: "Tags saved.",
        paperTagsFailed: "Could not save tags.",
        searchWithinModules: "Search within modules",
        allCorpusModules: "All corpus modules",
        moduleScopedSearchHint: "Checked modules restrict PaperQA retrieval to those papers.",
        evidencePriorityScope: "Evidence priority",
        scopeHighCases: "High priority only",
        scopeHighMediumCases: "High + medium priority",
        scopeAllPriorityCases: "High + medium + low priority",
        priorityScopedSearchHint: "Unclassified clinical cases are kept automatically.",
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
        draftComposerHint: "Describe what this paragraph should argue, then choose the evidence for a Nature-style synthesis draft.",
        paragraphBrief: "Paragraph goal",
        paragraphBriefPlaceholder: "For example: summarize why immunothrombosis matters in APS infection risk.",
        evidenceForParagraph: "Evidence for this paragraph",
        selectedForParagraph: "selected for paragraph",
        chooseEvidenceForDraft: "Choose evidence from the library first.",
        articleComposer: "Article Composer",
        articleComposerTitle: "Build a multi-paragraph draft",
        articleComposerHint: "Arrange selected evidence into paragraph plans, then generate a Nature-style review draft in one pass.",
        stepOutline: "Outline",
        stepRetrieve: "Retrieve",
        stepEvidence: "Evidence",
        stepBlueprint: "Blueprint",
        stepDraft: "Draft",
        stepPolish: "Review",
        previousStep: "Previous step",
        confirmNextStep: "Confirm next",
        generateDraftStep: "Generate draft",
        writingStageOutline: "Step 1: import and confirm the manuscript outline before retrieval.",
        writingStageRetrieve: "Step 2: review each section query and retrieve candidate evidence.",
        writingStageEvidence: "Step 3: choose the evidence that should enter writing. Only checked evidence is confirmed.",
        writingStageBlueprint: "Step 4: edit the global blueprint before paragraph drafting.",
        writingStageDraft: "Step 5: check paragraph plans, word counts, and assigned evidence before generating.",
        writingStagePolish: "Step 6: review the generated draft. Later this step can run full-text polishing and export.",
        outlineRequired: "Import an outline before continuing.",
        evidenceRequired: "Confirm at least one evidence sentence before continuing.",
        blueprintPanel: "Writing blueprint",
        blueprintTitle: "Confirm the manuscript logic",
        blueprintHint: "Edit the global storyline before paragraph generation. This is the control layer that keeps sections coherent.",
        generateBlueprint: "Regenerate blueprint",
        blueprintEmpty: "No confirmed evidence yet. Confirm evidence first.",
        blueprintConfirmed: "Blueprint confirmed. Paragraph plans were prepared.",
        importOutline: "Import outline",
        clearOutline: "Clear outline",
        outlinePanel: "Manuscript outline",
        outlinePanelTitle: "Structure tree",
        outlineEmpty: "Import a Markdown outline to plan section-level retrieval.",
        outlineDetailEmpty: "Select a section to build a retrieval query and assign evidence.",
        outlineImported: "Outline imported.",
        outlineCleared: "Outline cleared.",
        outlineImportFailed: "Could not read outline.",
        outlineTreeHint: "Markdown headings are shown as a section tree. Choose one section to retrieve evidence.",
        outlineAddSection: "Add section",
        outlineAddSubsection: "Add subsection",
        outlineSaveSection: "Save section",
        outlineDeleteSection: "Delete section",
        outlineDeleteConfirm: "Delete this section and its subsections?",
        outlineSectionTitle: "Section title",
        outlineSectionLevel: "Heading level",
        outlineSectionNotesEditor: "Section prompt notes",
        outlineSectionTitlePlaceholder: "e.g. Clinical features",
        outlineSectionNotesPlaceholder: "Add the retrieval or writing hints under this section.",
        newOutlineSection: "New section",
        newOutlineSubsection: "New subsection",
        sectionSaved: "Section updated.",
        sectionAdded: "Section added.",
        sectionDeleted: "Section deleted.",
        headingLevel1: "Level 1 title",
        headingLevel2: "Level 2 title",
        headingLevel3: "Level 3 title",
        headingLevel4: "Level 4 title",
        headingLevel5: "Level 5 title",
        headingLevel6: "Level 6 title",
        selectedSection: "Selected section",
        retrievalWorkspace: "Retrieval workspace",
        noOutlineNotes: "No notes under this heading.",
        evidenceFound: "found",
        evidenceSelected: "selected",
        outlineSectionNotes: "Existing notes",
        outlineRetrievalQuery: "Retrieval question",
        outlineQueryPlaceholder: "The section title will be converted into a PaperQA retrieval question.",
        retrieveSectionEvidence: "Retrieve evidence",
        addSectionParagraph: "Add empty paragraph plan",
        addSectionParagraphHint: "Creates a paragraph slot from this section without assigning evidence yet.",
        addSectionEvidenceParagraph: "Add paragraph with selected evidence",
        noSectionEvidence: "No retrieved evidence yet.",
        sectionEvidence: "Retrieved evidence",
        addEvidenceToLibrary: "Add to Evidence Library",
        addedEvidenceToLibrary: "Added to Evidence Library.",
        addParagraph: "Add paragraph",
        removeParagraph: "Remove",
        paragraphLabel: "Paragraph",
        paragraphLength: "Approx. length",
        paragraphLengthPlaceholder: "e.g. 180 words",
        generateArticle: "Generate article",
        generatedArticle: "Generated article",
        editableDraftHint: "Edit the generated text directly here. Citation keys are kept as plain text for later rendering.",
        saveDraftEdit: "Save edit",
        draftEditSaved: "Edit saved.",
        draftEditEmpty: "Draft text cannot be empty.",
        generatingArticle: "Generating the article from paragraph plans...",
        citationKeysUsed: "Citation keys",
        articleNeedEvidence: "Assign evidence to at least one paragraph.",
        articleNeedParagraph: "Add at least one paragraph plan.",
        paragraphEvidence: "Evidence assigned to this paragraph",
        uploadPdf: "Upload file",
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
        guideStartText: "Choose your team account on the login screen, then enter your password and choose APS Review. The account is used for uploads and saved LLM draft history.",
        guideLibraryTitle: "2. Browse the literature library",
        guideLibraryText: "Use search, priority, module filters, and pagination to narrow the paper table. Each page shows 50 papers by default.",
        guidePaperTitle: "3. Open and select from a paper",
        guidePaperText: "Open a paper from the detail panel. In the rendered article page, click a sentence or highlight text manually to add it to the Evidence Library.",
        guidePaperRemoveText: "The small left-side Evidence Library panel on the article page shows selected sentences and lets you remove them immediately.",
        guidePaperQATitle: "4. Ask PaperQA",
        guidePaperQAText: "Ask a focused APS question. When PaperQA is configured on the server, cited sentences can be checked and added to the Evidence Library.",
        guideComposerTitle: "5. Compose an article draft",
        guideComposerText: "Click Compose from the Evidence Library, arrange selected sentences into paragraph plans, set approximate length, then generate a citation-key based Nature-style synthesis draft.",
        guideRecordsTitle: "6. Check draft history",
        guideRecordsText: "Generated paragraphs and article drafts are saved under the current user account after successful LLM generation.",
        guideUploadTitle: "7. Upload files",
        guideUploadText: "Use the upload panel for manual PDFs, Markdown abstracts, or plain-text notes. A PMID is required in the APS corpus, and the current user name is recorded with the upload.",
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
        manualPdfs: "Manual files",
        uploadQueue: "Upload queue",
        myUploadsOnly: "Only mine",
        selectVisibleUploads: "Select page",
        clearUploadSelection: "Clear",
        deleteSelectedUploads: "Delete selected",
        selectedUploads: "selected",
        batchDeleteConfirm: "Delete selected upload records and files?",
        batchDeleteSuccess: "Selected upload records deleted.",
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
        openPdf: "Open file",
        pdfAvailable: "PDF available",
        pdfMissing: "No PDF uploaded",
        paperNotes: "Notes",
        paperNotePlaceholder: "Add your notes for this paper. Saved notes are included in literature search.",
        savePaperNote: "Save note",
        noteSaved: "Note saved.",
        noteSaveFailed: "Could not save note.",
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
        noUploads: "No uploaded files yet.",
        uploadStatusUploaded: "Uploaded",
        uploadStatusIndexed: "Indexed",
        toggleStatus: "Toggle status",
        deleteUpload: "Delete",
        deleteUploadConfirm: "Delete upload",
        deleteFailed: "Delete failed",
        updateFailed: "Update failed",
        noCorpusData: "No corpus data",
        uploadMissing: "Select a PDF/Markdown file and PMID.",
        uploadNeedLogin: "Log in before uploading.",
        uploadingPdf: "Uploading file...",
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
        loginCopy: "选择账号并输入密码进入科研工作区。",
        loginNameLabel: "用户名",
        chooseUser: "选择用户",
        passwordLabel: "密码",
        currentPasswordLabel: "当前密码",
        newPasswordLabel: "新密码",
        confirmPasswordLabel: "确认新密码",
        firstLoginPasswordHint: "首次登录需要先设置个人密码，然后才能进入工作区。",
        savePasswordButton: "保存密码",
        cancelPasswordChange: "返回登录",
        passwordChanged: "密码已保存，正在进入工作区。",
        passwordMismatch: "两次输入的新密码不一致。",
        passwordTooShort: "新密码至少需要 6 位。",
        passwordChangeFailed: "无法更新密码。",
        loginButton: "进入工作区",
        language: "语言",
        projectEyebrow: "项目入口",
        projectTitle: "选择工作区",
        apsKicker: "当前工作区",
        apsTitle: "APS Review",
        apsDescription: "系统综述语料库，支持 PaperQA 检索、文献查看和文件上传队列。",
        enterProject: "进入项目",
        newWorkspaceKicker: "自建工作区",
        newWorkspaceTitle: "新增工作区",
        newWorkspaceDescription: "创建一个小型文件文献库，用 PaperQA 提问，并从证据句子生成写作草稿。",
        newWorkspacePlaceholder: "工作区名称",
        personalWorkspace: "小型文献库",
        personalWorkspaceHint: "不要求 PMID，少于 100 个文件，适合 2-5 人协作使用。",
        teamWorkspace: "多人合作文献库",
        teamWorkspaceHint: "每个上传文件必须填写 PMID。",
        createWorkspace: "创建工作区",
        workspaceCreated: "工作区已创建。",
        workspaceCreateFailed: "无法创建工作区。",
        editWorkspace: "编辑信息",
        saveWorkspaceInfo: "保存信息",
        cancelWorkspaceEdit: "取消",
        workspaceDescriptionPlaceholder: "文献库简介",
        workspaceUpdated: "文献库信息已更新。",
        workspaceUpdateFailed: "无法更新文献库。",
        deleteWorkspace: "删除文献库",
        deleteWorkspaceConfirm: "确定删除这个文献库和其中已上传的文件吗？",
        deleteWorkspaceBlocked: "多人合作文献库仅管理员可删除。",
        workspaceDeleted: "文献库已删除。",
        workspaceTypePersonal: "小型库",
        workspaceTypeTeam: "团队",
        customWorkspace: "自建工作区",
        pdfLibrary: "文件文献库",
        pdfFiles: "来源文件",
        noWorkspacePdfs: "这个工作区还没有上传 PDF 或 Markdown 文件。",
        workspaceUploadHint: "小型文献库不需要填写 PMID。",
        workspaceQueryPlaceholder: "针对已上传 PDF 或 Markdown 文件提问。",
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
        searchNotes: "搜索备注",
        noteSearchPlaceholder: "搜索你的备注",
        notesOnly: "只看有备注",
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
        createTag: "新增标签",
        newTagPlaceholder: "新筛选标签",
        tagCreated: "标签已新增。",
        tagCreateFailed: "无法新增标签。",
        paperTags: "文献标签",
        paperTagsPlaceholder: "多个标签用逗号或分号分隔",
        savePaperTags: "保存标签",
        paperTagsSaved: "标签已保存。",
        paperTagsFailed: "无法保存标签。",
        searchWithinModules: "限定检索模块",
        allCorpusModules: "全部文献模块",
        moduleScopedSearchHint: "勾选模块后，PaperQA 只在对应模块文献中检索。",
        evidencePriorityScope: "证据优先级",
        scopeHighCases: "仅高优先度",
        scopeHighMediumCases: "高 + 中优先度",
        scopeAllPriorityCases: "高 + 中 + 低优先度",
        priorityScopedSearchHint: "未归类临床 Case 会自动保留。",
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
        draftComposerHint: "先描述这一段要写什么，再选择证据，让 AI 按接近 Nature 综述写作的方式综合生成。",
        paragraphBrief: "段落要求",
        paragraphBriefPlaceholder: "例如：总结免疫血栓如何影响 APS 感染风险。",
        evidenceForParagraph: "本段证据",
        selectedForParagraph: "条证据用于本段",
        chooseEvidenceForDraft: "请先从自选库选择证据。",
        articleComposer: "组文章",
        articleComposerTitle: "生成多段文章草稿",
        articleComposerHint: "把自选库证据分配到不同段落，再一次性交给 AI 按接近 Nature 综述写作的方式生成，让段落之间有承接关系。",
        stepOutline: "大纲",
        stepRetrieve: "检索",
        stepEvidence: "证据",
        stepBlueprint: "蓝图",
        stepDraft: "草稿",
        stepPolish: "审阅",
        previousStep: "上一步",
        confirmNextStep: "确认下一步",
        generateDraftStep: "生成草稿",
        writingStageOutline: "第 1 步：导入并确认文章大纲，然后再进入检索。",
        writingStageRetrieve: "第 2 步：逐节检查检索问题，并检索候选证据。",
        writingStageEvidence: "第 3 步：勾选真正要进入写作的证据。只有勾选后的证据会被确认。",
        writingStageBlueprint: "第 4 步：编辑全文写作蓝图，确认整体主线和章节承接。",
        writingStageDraft: "第 5 步：检查段落计划、字数和证据分配，然后生成草稿。",
        writingStagePolish: "第 6 步：审阅生成结果。后续这里可以接全文润色和导出。",
        outlineRequired: "请先导入文章大纲。",
        evidenceRequired: "请至少确认一条证据后再继续。",
        blueprintPanel: "写作蓝图",
        blueprintTitle: "确认文章逻辑",
        blueprintHint: "先修改全文主线，再生成段落。这里负责保证各节之间统一和连贯。",
        generateBlueprint: "重新生成蓝图",
        blueprintEmpty: "还没有确认的证据。请先确认证据。",
        blueprintConfirmed: "蓝图已确认，段落计划已生成。",
        importOutline: "导入大纲",
        clearOutline: "清空大纲",
        outlinePanel: "文章大纲",
        outlinePanelTitle: "结构树",
        outlineEmpty: "导入 Markdown 大纲后，可以按章节组织检索。",
        outlineDetailEmpty: "选择一个章节，生成检索问题并分配证据。",
        outlineImported: "大纲已导入。",
        outlineCleared: "大纲已清空。",
        outlineImportFailed: "无法读取大纲。",
        outlineTreeHint: "Markdown 标题会显示成章节树。点击某一节后，在右侧检索和分配证据。",
        outlineAddSection: "新增章节",
        outlineAddSubsection: "新增子章节",
        outlineSaveSection: "保存章节",
        outlineDeleteSection: "删除章节",
        outlineDeleteConfirm: "确定删除这个章节及其下级章节吗？",
        outlineSectionTitle: "章节标题",
        outlineSectionLevel: "标题层级",
        outlineSectionNotesEditor: "章节提示",
        outlineSectionTitlePlaceholder: "例如：Clinical features",
        outlineSectionNotesPlaceholder: "写下这一节检索或写作时需要注意的提示。",
        newOutlineSection: "新增章节",
        newOutlineSubsection: "新增子章节",
        sectionSaved: "章节已更新。",
        sectionAdded: "章节已添加。",
        sectionDeleted: "章节已删除。",
        headingLevel1: "一级标题",
        headingLevel2: "二级标题",
        headingLevel3: "三级标题",
        headingLevel4: "四级标题",
        headingLevel5: "五级标题",
        headingLevel6: "六级标题",
        selectedSection: "当前章节",
        retrievalWorkspace: "检索工作区",
        noOutlineNotes: "这个标题下暂无提示文字。",
        evidenceFound: "已找到",
        evidenceSelected: "已选择",
        outlineSectionNotes: "已有提示",
        outlineRetrievalQuery: "检索问题",
        outlineQueryPlaceholder: "系统会根据章节标题生成 PaperQA 检索问题。",
        retrieveSectionEvidence: "检索证据",
        addSectionParagraph: "加入空段落计划",
        addSectionParagraphHint: "只把这个章节加入段落计划，暂时不绑定证据。",
        addSectionEvidenceParagraph: "用所选证据加入段落",
        noSectionEvidence: "还没有检索到证据。",
        sectionEvidence: "检索到的证据",
        addEvidenceToLibrary: "加入自选库",
        addedEvidenceToLibrary: "已加入自选库。",
        addParagraph: "添加段落",
        removeParagraph: "删除",
        paragraphLabel: "段落",
        paragraphLength: "大约字数",
        paragraphLengthPlaceholder: "例如：180 字",
        generateArticle: "生成文章",
        generatedArticle: "生成文章",
        editableDraftHint: "可以直接在这里修改生成文本。引用键会以纯文本保留，方便后续统一渲染。",
        saveDraftEdit: "保存修改",
        draftEditSaved: "修改已保存。",
        draftEditEmpty: "草稿不能为空。",
        generatingArticle: "正在根据段落计划生成文章...",
        citationKeysUsed: "引用键",
        articleNeedEvidence: "请至少给一个段落分配证据。",
        articleNeedParagraph: "请至少添加一个段落计划。",
        paragraphEvidence: "本段使用的证据",
        uploadPdf: "上传文件",
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
        guideStartText: "在登录页选择课题组账号并输入密码，然后进入 APS Review。账号会用于上传记录和 LLM 生成记录保存。",
        guideLibraryTitle: "2. 浏览文献库",
        guideLibraryText: "可以用搜索、优先度、模块筛选和分页来缩小文献表范围。文献表默认每页显示 50 篇。",
        guidePaperTitle: "3. 打开原文并选择句子",
        guidePaperText: "在右侧详情里打开原文。进入渲染后的文章页后，可以点击整句，或手动划选一段文字加入自选库。",
        guidePaperRemoveText: "文章页左侧的小自选库面板会显示已选句子，也可以直接移除不需要的句子。",
        guidePaperQATitle: "4. 向 PaperQA 提问",
        guidePaperQAText: "输入具体的 APS 问题。服务器配置好 PaperQA 后，结果中的引用句子可以勾选并加入自选库。",
        guideComposerTitle: "5. 生成文章草稿",
        guideComposerText: "点击自选库里的“组文章”，把句子分配到不同段落，设置每段大约字数，再一次性生成带 citation key 的 Nature 风格综述草稿。",
        guideRecordsTitle: "6. 查看生成记录",
        guideRecordsText: "LLM 成功生成的段落和文章草稿，会保存到当前用户账号下，可以在左侧生成记录中查看。",
        guideUploadTitle: "7. 上传文件",
        guideUploadText: "上传面板用于人工补充 PDF、Markdown 摘要或纯文本笔记。APS 文献库需要填写 PMID，系统会记录当前上传用户。",
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
        manualPdfs: "人工文件",
        uploadQueue: "上传队列",
        myUploadsOnly: "只看我的记录",
        selectVisibleUploads: "选择本页",
        clearUploadSelection: "清空选择",
        deleteSelectedUploads: "删除所选",
        selectedUploads: "条已选",
        batchDeleteConfirm: "删除选中的上传记录和文件？",
        batchDeleteSuccess: "已删除选中的上传记录。",
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
        openPdf: "打开文件",
        pdfAvailable: "已有 PDF",
        pdfMissing: "暂无 PDF",
        paperNotes: "备注",
        paperNotePlaceholder: "给这篇文献添加备注。保存后可以通过搜索备注内容找到它。",
        savePaperNote: "保存备注",
        noteSaved: "备注已保存。",
        noteSaveFailed: "备注保存失败。",
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
        noUploads: "暂无上传文件。",
        uploadStatusUploaded: "已上传",
        uploadStatusIndexed: "已索引",
        toggleStatus: "切换状态",
        deleteUpload: "删除",
        deleteUploadConfirm: "删除上传记录",
        deleteFailed: "删除失败",
        updateFailed: "更新失败",
        noCorpusData: "暂无文献库数据",
        uploadMissing: "请选择 PDF/Markdown 文件并填写 PMID。",
        uploadNeedLogin: "请先登录后再上传。",
        uploadingPdf: "正在上传文件...",
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
    loginFields: document.getElementById("login-fields"),
    loginName: document.getElementById("login-name"),
    loginPassword: document.getElementById("login-password"),
    loginMessage: document.getElementById("login-message"),
    passwordChangeFields: document.getElementById("password-change-fields"),
    currentPassword: document.getElementById("current-password"),
    newPassword: document.getElementById("new-password"),
    confirmPassword: document.getElementById("confirm-password"),
    changePasswordButton: document.getElementById("change-password-button"),
    cancelPasswordChange: document.getElementById("cancel-password-change"),
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
    noteSearchInput: document.getElementById("note-search-input"),
    notesOnlyFilter: document.getElementById("notes-only-filter"),
    prevPage: document.getElementById("prev-page"),
    nextPage: document.getElementById("next-page"),
    pageSelect: document.getElementById("page-select"),
    pageTotal: document.getElementById("page-total"),
    priorityFilter: document.getElementById("priority-filter"),
    moduleFilter: document.getElementById("module-filter"),
    newTagInput: document.getElementById("new-tag-input"),
    createTagButton: document.getElementById("create-tag-button"),
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
    queryPriorityScope: document.getElementById("query-priority-scope"),
    answerPanel: document.getElementById("answer-panel"),
    uploadForm: document.getElementById("upload-form"),
    uploadFile: document.getElementById("upload-file"),
    uploadPmid: document.getElementById("upload-pmid"),
    uploadMessage: document.getElementById("upload-message"),
    uploadsList: document.getElementById("uploads-list"),
    refreshUploads: document.getElementById("refresh-uploads"),
    myUploadsOnly: document.getElementById("my-uploads-only"),
    uploadSelectionCount: document.getElementById("upload-selection-count"),
    selectVisibleUploads: document.getElementById("select-visible-uploads"),
    clearUploadSelection: document.getElementById("clear-upload-selection"),
    deleteSelectedUploads: document.getElementById("delete-selected-uploads"),
    uploadPagination: document.getElementById("upload-pagination"),
    prevUploadPage: document.getElementById("prev-upload-page"),
    nextUploadPage: document.getElementById("next-upload-page"),
    uploadPageStatus: document.getElementById("upload-page-status"),
    backToWorkspace: document.getElementById("back-to-workspace"),
    backFromHistory: document.getElementById("back-from-history"),
    outlineFile: document.getElementById("outline-file"),
    clearOutline: document.getElementById("clear-outline"),
    addOutlineSection: document.getElementById("outline-add-section"),
    outlineCount: document.getElementById("outline-count"),
    outlineList: document.getElementById("outline-list"),
    outlineSideEditor: document.getElementById("outline-side-editor"),
    outlineDetail: document.getElementById("outline-detail"),
    writingStepper: document.getElementById("writing-stepper"),
    writingStageNote: document.getElementById("writing-stage-note"),
    writingPrevStep: document.getElementById("writing-prev-step"),
    writingNextStep: document.getElementById("writing-next-step"),
    blueprintPanel: document.getElementById("blueprint-panel"),
    blueprintText: document.getElementById("blueprint-text"),
    generateBlueprint: document.getElementById("generate-blueprint"),
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

function draftLibraryContext() {
    return isCustomWorkspace() ? "general_review" : "aps_review";
}

function canDeleteWorkspace(workspace) {
    if (!workspace || workspace.library_type === "team") return false;
    if (workspace.owner_user_id && state.userId) return workspace.owner_user_id === state.userId;
    return Boolean(workspace.owner_name && state.userName && workspace.owner_name.toLowerCase() === state.userName.toLowerCase());
}

function canEditWorkspace(workspace) {
    if (!workspace) return false;
    if (workspace.owner_user_id && state.userId) return workspace.owner_user_id === state.userId;
    return Boolean(workspace.owner_name && state.userName && workspace.owner_name.toLowerCase() === state.userName.toLowerCase());
}

function bindLogin() {
    els.loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (state.mustChangePassword) {
            changePassword();
            return;
        }
        const value = els.loginName.value.trim();
        const password = els.loginPassword.value;
        if (!value) return;
        if (!password) return;
        setLoginMessage("");
        try {
            const result = await fetchJson("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: value, password }),
            });
            const user = result.user || { name: value };
            applyUser(user, { persist: !user.must_change_password });
            if (user.must_change_password) {
                showPasswordChange(true);
                els.currentPassword.value = password;
                els.newPassword.focus();
                return;
            }
            afterSuccessfulLogin();
        } catch (error) {
            setLoginMessage(`${t("loginFailed")} ${formatError(error.message)}`, true);
        }
    });

    els.changePasswordButton?.addEventListener("click", changePassword);
    els.cancelPasswordChange?.addEventListener("click", () => {
        switchUser();
        showPasswordChange(false);
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

function setLoginMessage(message, isError = false) {
    if (!els.loginMessage) return;
    els.loginMessage.textContent = message || "";
    els.loginMessage.className = `form-message ${isError ? "error-text" : message ? "success-text" : ""}`;
}

function showPasswordChange(open) {
    state.mustChangePassword = Boolean(open);
    els.loginFields?.classList.toggle("hidden", Boolean(open));
    els.passwordChangeFields?.classList.toggle("hidden", !open);
}

async function changePassword() {
    const currentPassword = els.currentPassword?.value || "";
    const newPassword = els.newPassword?.value || "";
    const confirmPassword = els.confirmPassword?.value || "";
    if (newPassword.length < 6) {
        setLoginMessage(t("passwordTooShort"), true);
        return;
    }
    if (newPassword !== confirmPassword) {
        setLoginMessage(t("passwordMismatch"), true);
        return;
    }
    try {
        const result = await fetchJson("/api/auth/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_token: state.userToken,
                current_password: currentPassword,
                new_password: newPassword,
            }),
        });
        applyUser(result.user || {}, { persist: true });
        setLoginMessage(t("passwordChanged"));
        showPasswordChange(false);
        clearPasswordFields();
        afterSuccessfulLogin();
    } catch (error) {
        setLoginMessage(`${t("passwordChangeFailed")} ${formatError(error.message)}`, true);
    }
}

function clearPasswordFields() {
    if (els.loginPassword) els.loginPassword.value = "";
    if (els.currentPassword) els.currentPassword.value = "";
    if (els.newPassword) els.newPassword.value = "";
    if (els.confirmPassword) els.confirmPassword.value = "";
}

function afterSuccessfulLogin() {
    refreshUserState();
    loadDraftHistory();
    openRequestedComposer();
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
                ${workspace.description ? `<span class="workspace-card-description">${escapeHtml(workspace.description)}</span>` : ""}
                <span>${escapeHtml(workspace.document_count || 0)} ${escapeHtml(t("pdfFiles"))}${workspace.requires_pmid ? ` · PMID` : ""}</span>
            </button>
            <form class="workspace-edit-form hidden" data-edit-form="${escapeHtml(workspace.id)}">
                <input class="text-input workspace-edit-name" type="text" value="${escapeHtml(workspace.name)}" placeholder="${escapeHtml(t("newWorkspacePlaceholder"))}">
                <textarea class="query-input workspace-edit-description" placeholder="${escapeHtml(t("workspaceDescriptionPlaceholder"))}">${escapeHtml(workspace.description || "")}</textarea>
                <div class="workspace-edit-actions">
                    <button class="primary-button small-button" type="submit">${escapeHtml(t("saveWorkspaceInfo"))}</button>
                    <button class="secondary-button small-button cancel-workspace-edit" type="button" data-cancel-edit-workspace-id="${escapeHtml(workspace.id)}">${escapeHtml(t("cancelWorkspaceEdit"))}</button>
                </div>
            </form>
            <div class="workspace-card-actions">
                <button class="workspace-enter-button" type="button" data-workspace-id="${escapeHtml(workspace.id)}">${escapeHtml(t("enterProject"))}</button>
                <button class="workspace-edit-button ${canEditWorkspace(workspace) ? "" : "hidden"}" type="button" data-edit-workspace-id="${escapeHtml(workspace.id)}">${escapeHtml(t("editWorkspace"))}</button>
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
    els.customWorkspaces.querySelectorAll("[data-edit-workspace-id]").forEach((button) => {
        button.addEventListener("click", () => toggleWorkspaceEdit(button.dataset.editWorkspaceId, true));
    });
    els.customWorkspaces.querySelectorAll("[data-cancel-edit-workspace-id]").forEach((button) => {
        button.addEventListener("click", () => toggleWorkspaceEdit(button.dataset.cancelEditWorkspaceId, false));
    });
    els.customWorkspaces.querySelectorAll(".workspace-edit-form").forEach((form) => {
        form.addEventListener("submit", updateWorkspaceInfo);
    });
}

function toggleWorkspaceEdit(workspaceId, open) {
    const form = Array.from(els.customWorkspaces.querySelectorAll(".workspace-edit-form"))
        .find((item) => item.dataset.editForm === workspaceId);
    if (!form) return;
    form.classList.toggle("hidden", !open);
    if (open) form.querySelector(".workspace-edit-name")?.focus();
}

async function updateWorkspaceInfo(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const workspaceId = form.dataset.editForm;
    if (!workspaceId) return;
    const name = form.querySelector(".workspace-edit-name")?.value.trim() || "";
    const description = form.querySelector(".workspace-edit-description")?.value.trim() || "";
    if (!name) return;
    try {
        const result = await fetchJson(`/api/workspaces/${encodeURIComponent(workspaceId)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                description,
                user_token: state.userToken,
                user_name: state.userName,
            }),
        });
        state.customWorkspaces = state.customWorkspaces.map((item) => item.id === workspaceId ? result.workspace : item);
        if (activeWorkspaceId() === workspaceId) {
            state.activeWorkspace = result.workspace;
        }
        renderCustomWorkspaces();
        refreshUserState();
        els.workspaceMessage.textContent = t("workspaceUpdated");
        els.workspaceMessage.className = "form-message success-text";
    } catch (error) {
        window.alert(`${t("workspaceUpdateFailed")} ${formatError(error.message)}`);
    }
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
    state.mustChangePassword = false;
    state.project = "";
    state.draftHistory = [];
    localStorage.removeItem("litdb.userName");
    localStorage.removeItem("litdb.userToken");
    localStorage.removeItem("litdb.userId");
    localStorage.removeItem("litdb.authVersion");
    sessionStorage.removeItem("litdb.project");
    clearPasswordFields();
    setLoginMessage("");
    showPasswordChange(false);
    renderDraftHistory();
    refreshUserState();
    els.loginName.focus();
}

function applyUser(user, options = {}) {
    const persist = options.persist !== false;
    state.userName = (user.name || "").trim();
    state.userToken = user.token || "";
    state.userId = user.id || "";
    state.mustChangePassword = Boolean(user.must_change_password);
    if (persist && !state.mustChangePassword) {
        localStorage.setItem("litdb.userName", state.userName);
        if (state.userToken) localStorage.setItem("litdb.userToken", state.userToken);
        if (state.userId) localStorage.setItem("litdb.userId", state.userId);
        localStorage.setItem("litdb.authVersion", AUTH_VERSION);
    } else {
        localStorage.removeItem("litdb.userName");
        localStorage.removeItem("litdb.userToken");
        localStorage.removeItem("litdb.userId");
        localStorage.removeItem("litdb.authVersion");
    }
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
    switchUser();
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
    renderManuscriptOutline();
    renderWritingFlow();
    if (state.uploads.length) renderUploads();
    populateModuleFilter(state.moduleCounts);
}

function refreshUserState() {
    const hasUser = Boolean(state.userName) && !state.mustChangePassword;
    const inProject = hasUser && Boolean(state.project);
    const custom = isCustomWorkspace();
    els.loginScreen.classList.toggle("hidden", hasUser);
    els.loginFields?.classList.toggle("hidden", state.mustChangePassword);
    els.passwordChangeFields?.classList.toggle("hidden", !state.mustChangePassword);
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
    els.queryPriorityScope?.closest(".query-scope-field")?.classList.toggle("hidden", custom);
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
    if (els.notesOnlyFilter) {
        els.notesOnlyFilter.checked = state.notesOnly;
    }
    [els.searchInput, els.noteSearchInput, els.notesOnlyFilter, els.priorityFilter, els.moduleFilter].filter(Boolean).forEach((input) => {
        const eventType = input === els.searchInput || input === els.noteSearchInput ? "input" : "change";
        input.addEventListener(eventType, () => {
            state.paperPage = 1;
            if (input === els.notesOnlyFilter) {
                state.notesOnly = input.checked;
                localStorage.setItem("litdb.notesOnly", state.notesOnly ? "1" : "0");
            }
            if (input === els.searchInput || input === els.noteSearchInput) {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(applyFilters, 300);
            } else {
                applyFilters();
            }
        });
    });
    els.createTagButton?.addEventListener("click", createCustomTag);
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
    els.composeButton.addEventListener("click", () => openArticleComposer(true));
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
    els.outlineFile.addEventListener("change", importOutlineFile);
    els.clearOutline.addEventListener("click", clearManuscriptOutline);
    els.addOutlineSection?.addEventListener("click", () => addOutlineSection("after"));
    els.writingPrevStep.addEventListener("click", previousWritingStep);
    els.writingNextStep.addEventListener("click", confirmWritingStep);
    els.generateBlueprint.addEventListener("click", () => {
        state.writingBlueprint = buildWritingBlueprint();
        saveWritingBlueprint();
        renderWritingFlow();
    });
    els.writingStepper.querySelectorAll(".writing-step").forEach((button) => {
        button.addEventListener("click", () => {
            const requestedStep = Number(button.dataset.step || 1);
            if (requestedStep > state.writingStep) return;
            state.writingStep = requestedStep;
            saveWritingStep();
            renderWritingFlow();
        });
    });
    els.addParagraph.addEventListener("click", () => addArticleParagraph());
    els.generateArticle.addEventListener("click", async () => {
        const ok = await generateArticleDraft();
        if (ok) {
            state.writingStep = 6;
            saveWritingStep();
            renderWritingFlow();
        }
    });
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
    els.selectVisibleUploads.addEventListener("click", selectVisibleUploads);
    els.clearUploadSelection.addEventListener("click", () => {
        state.selectedUploadIds.clear();
        renderUploads();
    });
    els.deleteSelectedUploads.addEventListener("click", deleteSelectedUploads);
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
        const noteQuery = state.userToken ? `?user_token=${encodeURIComponent(state.userToken)}` : "";
        const data = await fetchJson(`/api/papers${noteQuery}`);
        state.papers = data.papers || [];
        state.moduleCounts = data.summary ? data.summary.module_counts : {};
        state.customTags = data.summary ? (data.summary.custom_tags || []) : [];
        populateModuleFilter(state.moduleCounts);
        applyFilters();
    } catch (error) {
        els.papersBody.innerHTML = `<tr><td colspan="3" class="error-text">${escapeHtml(t("couldNotLoadPapers"))}: ${escapeHtml(error.message)}</td></tr>`;
    }
}

async function createCustomTag() {
    const tag = els.newTagInput?.value.trim() || "";
    if (!tag) return;
    try {
        const result = await fetchJson("/api/tags", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tag,
                user_token: state.userToken,
                user_name: state.userName,
            }),
        });
        state.customTags = result.tags || [...state.customTags, tag];
        if (els.newTagInput) els.newTagInput.value = "";
        if (!state.moduleCounts[tag]) state.moduleCounts[tag] = 0;
        populateModuleFilter(state.moduleCounts);
    } catch (error) {
        window.alert(`${t("tagCreateFailed")} ${formatError(error.message)}`);
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
            <td><span class="pdf-status available">${escapeHtml(fileTypeLabel(doc))}</span></td>
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
    const fileUrl = doc.file_url || doc.pdf_url || "";
    els.paperDetail.innerHTML = `
        <h3>${escapeHtml(doc.original_filename || doc.filename)}</h3>
        <p class="paper-meta">${escapeHtml(t("customWorkspace"))} · ${escapeHtml(formatDate(doc.uploaded_at))}</p>
        <dl class="detail-grid">
            <div><dt>${escapeHtml(t("uploadPdf"))}</dt><dd><span class="pdf-status available">${escapeHtml(fileTypeLabel(doc))}</span></dd></div>
            <div><dt>${escapeHtml(t("signedInAs"))}</dt><dd>${escapeHtml(doc.uploaded_by || t("missing"))}</dd></div>
            <div><dt>${escapeHtml(t("uploadRecordsUnit"))}</dt><dd>${escapeHtml(formatSize(doc.file_size))}</dd></div>
        </dl>
        <div class="detail-actions">
            ${fileUrl ? `<a class="source-link pdf-link" href="${escapeHtml(fileUrl)}" target="_blank" rel="noopener">${escapeHtml(t("openPdf"))}</a>` : ""}
        </div>
    `;
}

function fileTypeLabel(item) {
    const filename = String(item?.original_filename || item?.filename || "").toLowerCase();
    const fileType = String(item?.file_type || "").toLowerCase();
    if (fileType === "markdown" || filename.endsWith(".md") || filename.endsWith(".markdown")) return "MD";
    if (fileType === "text" || filename.endsWith(".txt")) return "TXT";
    return "PDF";
}

function populateModuleFilter(moduleCounts) {
    const modules = [...new Set([
        ...Object.keys(moduleCounts || {}).filter((item) => item !== "missing"),
        ...(state.customTags || []),
    ])].sort((a, b) => a.localeCompare(b));
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
    const noteQuery = (els.noteSearchInput?.value || "").trim().toLowerCase();
    const notesOnly = Boolean(els.notesOnlyFilter?.checked || state.notesOnly);
    const priority = els.priorityFilter.value;
    const moduleName = els.moduleFilter.value;

    state.filteredPapers = state.papers.filter((paper) => {
        const metadataHaystack = [
            paper.pmid,
            paper.title,
            paper.authors,
            paper.journal,
            paper.year,
            paper.aps_modules,
            paper.custom_tags,
            paper.filter_tags,
            paper.study_types,
            compactModules(paper.filter_tags || paper.aps_modules),
        ].join(" ").toLowerCase();
        const noteHaystack = String(paper.user_note || "").toLowerCase();

        return (!query || metadataHaystack.includes(query))
            && (!noteQuery || noteHaystack.includes(noteQuery))
            && (!notesOnly || noteHaystack.length > 0)
            && (!priority || String(paper.priority).toLowerCase() === priority)
            && (!moduleName || splitTags(paper.filter_tags || paper.aps_modules).some((tag) => tag === moduleName));
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
                    ${paper.user_note ? `<span class="pdf-badge note-badge">${escapeHtml(t("paperNotes"))}</span>` : ""}
                </span>
                <span class="paper-meta">PMID ${escapeHtml(paper.pmid)} · ${escapeHtml(paper.year || "n.d.")} · ${escapeHtml(paper.journal || t("unknownJournal"))}</span>
            </td>
            <td><span class="priority ${escapeHtml(String(paper.priority).toLowerCase())}">${escapeHtml(localizePriority(paper.priority || t("missing")))}</span></td>
            <td><span class="module-label">${escapeHtml(compactModules(paper.filter_tags || paper.aps_modules))}</span></td>
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
    const userNote = paper.user_note || "";

    els.paperDetail.innerHTML = `
        <h3>${escapeHtml(paper.title)}</h3>
        <p class="paper-meta">PMID ${escapeHtml(paper.pmid)} · ${escapeHtml(paper.year || "n.d.")}</p>
        <dl class="detail-grid">
            <div><dt>${escapeHtml(t("journal"))}</dt><dd>${escapeHtml(paper.journal || t("unknownJournal"))}</dd></div>
            <div><dt>${escapeHtml(t("priority"))}</dt><dd>${escapeHtml(localizePriority(paper.priority || t("missing")))}</dd></div>
            <div><dt>${escapeHtml(t("module"))}</dt><dd>${escapeHtml(compactModules(paper.filter_tags || paper.aps_modules))}</dd></div>
            <div><dt>${escapeHtml(t("studyType"))}</dt><dd>${escapeHtml(paper.study_types || t("missing"))}</dd></div>
            <div><dt>DOI</dt><dd>${escapeHtml(paper.doi || t("missing"))}</dd></div>
            <div><dt>PDF</dt><dd><span class="pdf-status ${pdfUpload ? "available" : ""}">${escapeHtml(pdfUpload ? t("pdfAvailable") : t("pdfMissing"))}</span></dd></div>
        </dl>
        <div class="detail-actions">
            <a class="source-link" href="/papers/${encodeURIComponent(paper.pmid)}" target="_blank" rel="noopener">${escapeHtml(t("openPaper"))}</a>
            ${pdfUpload ? `<a class="source-link pdf-link" href="${escapeHtml(pdfUpload.url)}" target="_blank" rel="noopener">${escapeHtml(t("openPdf"))}</a>` : ""}
        </div>
        <section class="paper-note-card">
            <div class="paper-note-head">
                <label class="panel-label" for="paper-note-input">${escapeHtml(t("paperNotes"))}</label>
                <span class="paper-note-status" id="paper-note-status"></span>
            </div>
            <textarea id="paper-note-input" class="paper-note-input" placeholder="${escapeHtml(t("paperNotePlaceholder"))}">${escapeHtml(userNote)}</textarea>
            <button class="secondary-button small-button" id="save-paper-note" type="button">${escapeHtml(t("savePaperNote"))}</button>
        </section>
        <section class="paper-note-card paper-tags-card">
            <div class="paper-note-head">
                <label class="panel-label" for="paper-tags-input">${escapeHtml(t("paperTags"))}</label>
                <span class="paper-note-status" id="paper-tags-status"></span>
            </div>
            <input id="paper-tags-input" class="text-input" type="text" placeholder="${escapeHtml(t("paperTagsPlaceholder"))}" value="${escapeHtml(paper.custom_tags || "")}">
            <button class="secondary-button small-button" id="save-paper-tags" type="button">${escapeHtml(t("savePaperTags"))}</button>
        </section>
        <p class="abstract">${escapeHtml(paper.abstract || t("noAbstract"))}</p>
    `;
    document.getElementById("save-paper-note")?.addEventListener("click", () => savePaperNote(paper.pmid));
    document.getElementById("save-paper-tags")?.addEventListener("click", () => savePaperTags(paper.pmid));
}

async function savePaperNote(pmid) {
    const input = document.getElementById("paper-note-input");
    const status = document.getElementById("paper-note-status");
    const note = input?.value || "";
    if (status) status.textContent = "";
    try {
        const result = await fetchJson(`/api/papers/${encodeURIComponent(pmid)}/note`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_token: state.userToken,
                user_name: state.userName,
                note,
            }),
        });
        const paper = state.papers.find((item) => item.pmid === pmid);
        if (paper) {
            paper.user_note = result.note?.note || "";
            paper.note_updated_at = result.note?.updated_at || "";
        }
        if (status) status.textContent = t("noteSaved");
        applyFilters();
    } catch (error) {
        if (status) status.textContent = `${t("noteSaveFailed")} ${formatError(error.message)}`;
    }
}

async function savePaperTags(pmid) {
    const input = document.getElementById("paper-tags-input");
    const status = document.getElementById("paper-tags-status");
    const tags = input?.value || "";
    if (status) status.textContent = "";
    try {
        const result = await fetchJson(`/api/papers/${encodeURIComponent(pmid)}/tags`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_token: state.userToken,
                user_name: state.userName,
                tags,
            }),
        });
        const paper = state.papers.find((item) => item.pmid === pmid);
        if (paper) {
            paper.custom_tags = result.tags?.tags || "";
            paper.filter_tags = joinTagValues([paper.aps_modules, paper.custom_tags]);
            paper.tag_updated_at = result.tags?.updated_at || "";
        }
        for (const tag of splitTags(tags)) {
            if (!state.customTags.some((item) => item.toLowerCase() === tag.toLowerCase())) state.customTags.push(tag);
        }
        state.moduleCounts = buildModuleCountsFromPapers();
        populateModuleFilter(state.moduleCounts);
        if (status) status.textContent = t("paperTagsSaved");
        applyFilters();
    } catch (error) {
        if (status) status.textContent = `${t("paperTagsFailed")} ${formatError(error.message)}`;
    }
}

function buildModuleCountsFromPapers() {
    const counts = {};
    for (const paper of state.papers) {
        for (const tag of splitTags(paper.filter_tags || paper.aps_modules)) {
            counts[tag] = (counts[tag] || 0) + 1;
        }
    }
    return counts;
}

async function askPaperQA(question) {
    state.evidenceByKey = {};
    els.answerPanel.innerHTML = renderProgressNotice(t("searchingCorpus"));
    try {
        const endpoint = isCustomWorkspace()
            ? `/api/workspaces/${encodeURIComponent(activeWorkspaceId())}/paperqa/query`
            : "/api/paperqa/query";
        const priorityScope = isCustomWorkspace() ? "" : (els.queryPriorityScope?.value || "all_priorities_with_cases");
        const result = await fetchJson(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, k: 10, max_sources: 5, priority_scope: priorityScope }),
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

function loadManuscriptOutline() {
    try {
        const outline = JSON.parse(localStorage.getItem("litdb.manuscriptOutline") || "[]");
        return Array.isArray(outline) ? outline : [];
    } catch {
        return [];
    }
}

function saveManuscriptOutline() {
    localStorage.setItem("litdb.manuscriptOutline", JSON.stringify(state.manuscriptOutline.slice(0, 120)));
}

function clampHeadingLevel(level) {
    return Math.min(6, Math.max(1, Number(level) || 1));
}

function headingLevelLabel(level) {
    return t(`headingLevel${clampHeadingLevel(level)}`);
}

function normalizeManuscriptOutlineLevels() {
    if (!state.manuscriptOutline.length) return;
    const levels = state.manuscriptOutline.map((section) => clampHeadingLevel(section.level));
    const baseLevel = Math.min(...levels);
    let changed = false;
    state.manuscriptOutline = state.manuscriptOutline.map((section, index) => {
        const normalizedLevel = clampHeadingLevel(clampHeadingLevel(section.level) - baseLevel + 1);
        const normalized = {
            ...section,
            id: section.id || uniqueOutlineId(section.title || `${t("newOutlineSection")} ${index + 1}`),
            level: normalizedLevel,
            title: String(section.title || `${t("newOutlineSection")} ${index + 1}`).trim(),
            notes: String(section.notes || ""),
        };
        changed = changed
            || normalized.level !== section.level
            || normalized.id !== section.id
            || normalized.title !== section.title
            || normalized.notes !== section.notes;
        return normalized;
    });
    if (changed) saveManuscriptOutline();
}

function uniqueOutlineId(title) {
    const base = `outline-${slugifyForId(title || t("newOutlineSection"))}`;
    let candidate = base;
    let index = 2;
    const existing = new Set(state.manuscriptOutline.map((section) => section.id));
    while (existing.has(candidate)) {
        candidate = `${base}-${index}`;
        index += 1;
    }
    return candidate;
}

function outlineLevelOptions(selectedLevel) {
    return [1, 2, 3, 4, 5, 6].map((level) => `
        <option value="${level}" ${clampHeadingLevel(selectedLevel) === level ? "selected" : ""}>${escapeHtml(headingLevelLabel(level))}</option>
    `).join("");
}

function saveWritingStep() {
    state.writingStep = Math.min(6, Math.max(1, Number(state.writingStep || 1)));
    sessionStorage.setItem("litdb.writingStep", String(state.writingStep));
}

function saveWritingBlueprint() {
    localStorage.setItem("litdb.writingBlueprint", state.writingBlueprint || "");
}

function showWritingMessage(message, isError = true) {
    showArticleOutput(`<p class="${isError ? "error-text" : "success-text"}">${escapeHtml(message)}</p>`);
}

function parseMarkdownOutline(text) {
    const withoutFrontmatter = String(text || "").replace(/^---[\s\S]*?---\s*/, "");
    let lines = withoutFrontmatter.split(/\r?\n/);
    const outlineStart = lines.findIndex((line) => /^##\s+Article Outline\s*$/i.test(line.trim()));
    if (outlineStart >= 0) {
        const nextMajor = lines.findIndex((line, index) => index > outlineStart && /^##\s+/.test(line.trim()));
        lines = lines.slice(outlineStart + 1, nextMajor > outlineStart ? nextMajor : undefined);
    }
    const sections = [];
    let current = null;
    for (const line of lines) {
        const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
        if (match) {
            if (current) sections.push(current);
            current = {
                id: `outline-${sections.length + 1}-${Date.now()}`,
                level: match[1].length,
                title: match[2].replace(/\s+#+$/, "").trim(),
                notes: [],
            };
        } else if (current && line.trim()) {
            current.notes.push(line.trim());
        }
    }
    if (current) sections.push(current);
    return sections
        .filter((section) => section.title && !/^article outline$/i.test(section.title))
        .map((section, index) => ({
            ...section,
            id: `outline-${index + 1}-${slugifyForId(section.title)}`,
            notes: section.notes.join("\n").slice(0, 1200),
        }));
}

function slugifyForId(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "section";
}

async function importOutlineFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
        const text = await file.text();
        const outline = parseMarkdownOutline(text);
        if (!outline.length) throw new Error("No headings found");
        state.manuscriptOutline = outline;
        state.activeOutlineId = outline[0].id;
        state.outlineRetrieval = {};
        state.writingStep = 1;
        saveManuscriptOutline();
        saveWritingStep();
        renderManuscriptOutline();
        renderWritingFlow();
        showArticleOutput(`<p class="success-text">${escapeHtml(t("outlineImported"))}</p>`);
    } catch (error) {
        showArticleOutput(`<p class="error-text">${escapeHtml(t("outlineImportFailed"))}: ${escapeHtml(formatError(error.message))}</p>`);
    } finally {
        event.target.value = "";
    }
}

function clearManuscriptOutline() {
    state.manuscriptOutline = [];
    state.activeOutlineId = "";
    state.outlineRetrieval = {};
    state.writingBlueprint = "";
    state.writingStep = 1;
    saveManuscriptOutline();
    saveWritingBlueprint();
    saveWritingStep();
    renderManuscriptOutline();
    renderWritingFlow();
    showArticleOutput(`<p class="success-text">${escapeHtml(t("outlineCleared"))}</p>`);
}

function activeOutlineSection() {
    return state.manuscriptOutline.find((section) => section.id === state.activeOutlineId) || state.manuscriptOutline[0] || null;
}

function defaultOutlineQuery(section) {
    if (!section) return "";
    const notes = section.notes ? ` Context from the outline: ${section.notes.slice(0, 260)}` : "";
    return `For a biomedical review section titled "${section.title}", what evidence from the literature should be cited?${notes}`;
}

function activeOutlineIndex() {
    return state.manuscriptOutline.findIndex((section) => section.id === state.activeOutlineId);
}

function outlineSubtreeEndIndex(startIndex) {
    if (startIndex < 0) return state.manuscriptOutline.length;
    const level = clampHeadingLevel(state.manuscriptOutline[startIndex]?.level);
    let end = startIndex + 1;
    while (end < state.manuscriptOutline.length && clampHeadingLevel(state.manuscriptOutline[end].level) > level) {
        end += 1;
    }
    return end;
}

function addOutlineSection(mode = "after") {
    normalizeManuscriptOutlineLevels();
    const activeIndex = activeOutlineIndex();
    const activeSection = activeIndex >= 0 ? state.manuscriptOutline[activeIndex] : null;
    const asChild = mode === "child" && activeSection;
    const level = asChild ? clampHeadingLevel(activeSection.level + 1) : clampHeadingLevel(activeSection?.level || 1);
    const title = asChild ? t("newOutlineSubsection") : t("newOutlineSection");
    const section = {
        id: uniqueOutlineId(`${title}-${Date.now()}`),
        level,
        title,
        notes: "",
    };
    const insertIndex = activeIndex >= 0
        ? asChild
            ? activeIndex + 1
            : outlineSubtreeEndIndex(activeIndex)
        : state.manuscriptOutline.length;
    state.manuscriptOutline.splice(insertIndex, 0, section);
    state.activeOutlineId = section.id;
    saveManuscriptOutline();
    renderManuscriptOutline();
    showWritingMessage(t("sectionAdded"), false);
}

function saveActiveOutlineSection() {
    const section = activeOutlineSection();
    if (!section) return;
    const title = (document.getElementById("outline-title-editor")?.value || section.title).trim();
    section.title = title || t("newOutlineSection");
    section.level = clampHeadingLevel(document.getElementById("outline-level-editor")?.value || section.level);
    section.notes = (document.getElementById("outline-notes-editor")?.value || "").trim().slice(0, 1200);
    saveManuscriptOutline();
    renderManuscriptOutline();
    showWritingMessage(t("sectionSaved"), false);
}

function deleteActiveOutlineSection() {
    const start = activeOutlineIndex();
    if (start < 0) return;
    if (!window.confirm(t("outlineDeleteConfirm"))) return;
    const end = outlineSubtreeEndIndex(start);
    const removed = state.manuscriptOutline.splice(start, end - start);
    for (const section of removed) {
        delete state.outlineRetrieval[section.id];
    }
    state.activeOutlineId = state.manuscriptOutline[Math.min(start, state.manuscriptOutline.length - 1)]?.id || "";
    saveManuscriptOutline();
    renderManuscriptOutline();
    showWritingMessage(t("sectionDeleted"), false);
}

function renderManuscriptOutline() {
    if (!els.outlineList || !els.outlineDetail) return;
    normalizeManuscriptOutlineLevels();
    if (els.outlineCount) els.outlineCount.textContent = String(state.manuscriptOutline.length);
    if (!state.manuscriptOutline.length) {
        els.outlineList.innerHTML = `<p class="empty-note">${escapeHtml(t("outlineEmpty"))}</p>`;
        if (els.outlineSideEditor) els.outlineSideEditor.innerHTML = "";
        els.outlineDetail.innerHTML = `<p class="empty-note">${escapeHtml(t("outlineDetailEmpty"))}</p>`;
        return;
    }
    if (!state.activeOutlineId || !state.manuscriptOutline.some((section) => section.id === state.activeOutlineId)) {
        state.activeOutlineId = state.manuscriptOutline[0].id;
    }
    els.outlineList.innerHTML = state.manuscriptOutline.map((section) => `
        ${renderOutlineTreeNode(section)}
    `).join("");
    els.outlineList.querySelectorAll(".outline-section-button").forEach((button) => {
        button.addEventListener("click", () => {
            state.activeOutlineId = button.dataset.id || "";
            renderManuscriptOutline();
        });
    });
    renderOutlineSideEditor();
    renderOutlineDetail();
}

function renderOutlineSideEditor() {
    if (!els.outlineSideEditor) return;
    const section = activeOutlineSection();
    if (!section) {
        els.outlineSideEditor.innerHTML = "";
        return;
    }
    els.outlineSideEditor.innerHTML = `
        <div class="outline-editor-card">
            <p class="panel-label">${escapeHtml(t("selectedSection"))}</p>
            <label class="field-label">
                ${escapeHtml(t("outlineSectionTitle"))}
                <input id="outline-title-editor" class="text-input" type="text" placeholder="${escapeHtml(t("outlineSectionTitlePlaceholder"))}" value="${escapeHtml(section.title)}">
            </label>
            <label class="field-label">
                ${escapeHtml(t("outlineSectionLevel"))}
                <select id="outline-level-editor" class="text-input">${outlineLevelOptions(section.level)}</select>
            </label>
            <label class="field-label">
                ${escapeHtml(t("outlineSectionNotesEditor"))}
                <textarea id="outline-notes-editor" class="query-input outline-notes-editor" placeholder="${escapeHtml(t("outlineSectionNotesPlaceholder"))}">${escapeHtml(section.notes || "")}</textarea>
            </label>
            <div class="outline-edit-actions">
                <button class="primary-button small-button" id="outline-save-section" type="button">${escapeHtml(t("outlineSaveSection"))}</button>
                <button class="secondary-button small-button" id="outline-add-subsection" type="button">${escapeHtml(t("outlineAddSubsection"))}</button>
                <button class="text-button danger-text-button" id="outline-delete-section" type="button">${escapeHtml(t("outlineDeleteSection"))}</button>
            </div>
        </div>
    `;
    document.getElementById("outline-save-section")?.addEventListener("click", saveActiveOutlineSection);
    document.getElementById("outline-add-subsection")?.addEventListener("click", () => addOutlineSection("child"));
    document.getElementById("outline-delete-section")?.addEventListener("click", deleteActiveOutlineSection);
}

function renderOutlineTreeNode(section) {
    const retrieval = state.outlineRetrieval[section.id] || {};
    const contexts = Array.isArray(retrieval.contexts) ? retrieval.contexts : [];
    const selectedKeys = Array.isArray(retrieval.selectedKeys)
        ? retrieval.selectedKeys.filter((key) => contexts.some((item) => item.key === key))
        : contexts.map((item) => item.key);
    const hasEvidence = contexts.length > 0;
    return `
        <button class="outline-section-button ${section.id === state.activeOutlineId ? "active" : ""} ${hasEvidence ? "has-evidence" : ""}" type="button" data-id="${escapeHtml(section.id)}" style="--outline-level:${Math.max(0, clampHeadingLevel(section.level) - 1)}">
            <span class="outline-tree-main">
                <span class="outline-branch" aria-hidden="true"></span>
                <span class="outline-node-dot" aria-hidden="true"></span>
                <span class="outline-node-title">${escapeHtml(section.title)}</span>
            </span>
            <span class="outline-node-meta">
                <small>${escapeHtml(headingLevelLabel(section.level))}</small>
                ${hasEvidence ? `<em>${escapeHtml(String(selectedKeys.length))}/${escapeHtml(String(contexts.length))}</em>` : ""}
            </span>
        </button>
    `;
}

const WRITING_STAGE_NOTES = {
    1: "writingStageOutline",
    2: "writingStageRetrieve",
    3: "writingStageEvidence",
    4: "writingStageBlueprint",
    5: "writingStageDraft",
    6: "writingStagePolish",
};

function renderWritingFlow() {
    if (!els.writingStepper) return;
    saveWritingStep();
    els.writingStepper.querySelectorAll(".writing-step").forEach((button) => {
        const step = Number(button.dataset.step || 1);
        button.classList.toggle("active", step === state.writingStep);
        button.classList.toggle("complete", step < state.writingStep);
        button.disabled = step > state.writingStep;
    });
    if (els.writingStageNote) {
        els.writingStageNote.textContent = t(WRITING_STAGE_NOTES[state.writingStep] || "writingStageOutline");
    }
    els.writingPrevStep.disabled = state.writingStep <= 1;
    els.writingNextStep.classList.toggle("hidden", state.writingStep >= 6);
    els.writingNextStep.textContent = state.writingStep === 5 ? t("generateDraftStep") : t("confirmNextStep");
    const showWorkbench = state.writingStep <= 3;
    const showBlueprint = state.writingStep === 4;
    const showParagraphs = state.writingStep === 5;
    const showOutput = state.writingStep === 6;
    document.getElementById("manuscript-workbench")?.classList.toggle("hidden", !showWorkbench);
    els.blueprintPanel.classList.toggle("hidden", !showBlueprint);
    els.articleParagraphs.classList.toggle("hidden", !showParagraphs);
    els.generateArticle.classList.toggle("hidden", !showParagraphs);
    els.addParagraph.classList.toggle("hidden", !showParagraphs);
    els.articleOutput.classList.toggle("hidden", !showOutput && !els.articleOutput.innerHTML.trim());
    if (showBlueprint) {
        if (!state.writingBlueprint) {
            state.writingBlueprint = buildWritingBlueprint();
            saveWritingBlueprint();
        }
        els.blueprintText.value = state.writingBlueprint;
    }
}

function previousWritingStep() {
    if (state.writingStep <= 1) return;
    state.writingStep -= 1;
    saveWritingStep();
    renderWritingFlow();
}

async function confirmWritingStep() {
    if (state.writingStep === 1 && !state.manuscriptOutline.length) {
        showWritingMessage(t("outlineRequired"));
        return;
    }
    if (state.writingStep === 3) {
        const confirmed = confirmOutlineEvidenceSelections();
        if (!confirmed) {
            showWritingMessage(t("evidenceRequired"));
            return;
        }
    }
    if (state.writingStep === 4) {
        state.writingBlueprint = els.blueprintText.value.trim();
        saveWritingBlueprint();
        buildParagraphPlansFromConfirmedEvidence();
        showWritingMessage(t("blueprintConfirmed"), false);
    }
    if (state.writingStep === 5) {
        const ok = await generateArticleDraft();
        if (ok) {
            state.writingStep = 6;
            saveWritingStep();
            renderWritingFlow();
        }
        return;
    }
    state.writingStep = Math.min(6, state.writingStep + 1);
    saveWritingStep();
    renderWritingFlow();
}

function renderOutlineDetail() {
    const section = activeOutlineSection();
    if (!section) return;
    const retrieval = state.outlineRetrieval[section.id] || {};
    const query = retrieval.query || defaultOutlineQuery(section);
    const contexts = Array.isArray(retrieval.contexts) ? retrieval.contexts : [];
    const selectedKeys = Array.isArray(retrieval.selectedKeys)
        ? retrieval.selectedKeys.filter((key) => contexts.some((item) => item.key === key))
        : contexts.map((item) => item.key);
    els.outlineDetail.innerHTML = `
        <div class="section-focus-card">
            <div>
                <p class="panel-label">${escapeHtml(t("selectedSection"))}</p>
                <h3>${escapeHtml(section.title)}</h3>
                <div class="section-focus-meta">
                    <span>${escapeHtml(headingLevelLabel(section.level))}</span>
                    <span>${escapeHtml(String(contexts.length))} ${escapeHtml(t("evidenceFound"))}</span>
                    <span>${escapeHtml(String(selectedKeys.length))} ${escapeHtml(t("evidenceSelected"))}</span>
                </div>
            </div>
            <div class="outline-paragraph-shortcut">
                <button class="secondary-button small-button" id="outline-add-paragraph" type="button">${escapeHtml(t("addSectionParagraph"))}</button>
                <small>${escapeHtml(t("addSectionParagraphHint"))}</small>
            </div>
        </div>
        <div class="retrieval-workspace-card">
            <div class="retrieval-card-head">
                <div>
                    <p class="panel-label">${escapeHtml(t("retrievalWorkspace"))}</p>
                    <h4>${escapeHtml(t("outlineRetrievalQuery"))}</h4>
                </div>
            </div>
            ${renderOutlinePriorityScope(section)}
            ${renderOutlineModuleFilters(section)}
            <textarea id="outline-query" class="query-input compact-query" placeholder="${escapeHtml(t("outlineQueryPlaceholder"))}">${escapeHtml(query)}</textarea>
            <div class="outline-actions">
                <button class="primary-button small-button" id="outline-retrieve" type="button">${escapeHtml(t("retrieveSectionEvidence"))}</button>
                <button class="secondary-button small-button" id="outline-add-evidence-paragraph" type="button" ${contexts.length ? "" : "disabled"}>${escapeHtml(t("addSectionEvidenceParagraph"))}</button>
            </div>
        </div>
        <div class="outline-evidence-panel">
            <div class="compose-evidence-head">
                <span>${escapeHtml(t("sectionEvidence"))}</span>
                <span>${contexts.length}</span>
            </div>
            <div class="compose-evidence-list outline-evidence-list">
                ${contexts.length ? contexts.map((context, index) => renderOutlineEvidenceChoice(context, index)).join("") : `<p class="empty-note">${escapeHtml(t("noSectionEvidence"))}</p>`}
            </div>
        </div>
    `;
    document.getElementById("outline-add-paragraph")?.addEventListener("click", () => {
        addArticleParagraph({ instruction: section.title, length: "" });
    });
    document.getElementById("outline-retrieve")?.addEventListener("click", () => retrieveOutlineEvidence(section));
    document.getElementById("outline-add-evidence-paragraph")?.addEventListener("click", () => {
        const selectedKeys = selectedOutlineEvidenceKeys(section.id);
        const contexts = (state.outlineRetrieval[section.id] || {}).contexts || [];
        contexts
            .filter((item) => selectedKeys.includes(item.key))
            .forEach((item) => {
                if (!evidenceLibraryHas(item.key)) state.evidenceLibrary.push(item);
            });
        saveEvidenceLibrary();
        renderEvidenceLibrary();
        addArticleParagraph({ instruction: section.title, evidenceKeys: selectedKeys });
    });
    els.outlineDetail.querySelectorAll(".outline-add-library").forEach((button) => {
        button.addEventListener("click", () => addOutlineEvidenceToLibrary(section.id, Number(button.dataset.index)));
    });
    els.outlineDetail.querySelectorAll(".outline-evidence-check").forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
            const current = state.outlineRetrieval[section.id] || {};
            current.selectedKeys = selectedOutlineEvidenceKeys(section.id, true);
            state.outlineRetrieval[section.id] = current;
        });
    });
}

function renderOutlinePriorityScope(section) {
    if (isCustomWorkspace()) return "";
    const selected = (state.outlineRetrieval[section.id] || {}).priorityScope || "all_priorities_with_cases";
    return `
        <label class="field-label outline-priority-scope">
            ${escapeHtml(t("evidencePriorityScope"))}
            <select id="outline-priority-scope" class="text-input">
                <option value="high_with_cases" ${selected === "high_with_cases" ? "selected" : ""}>${escapeHtml(t("scopeHighCases"))}</option>
                <option value="high_medium_with_cases" ${selected === "high_medium_with_cases" ? "selected" : ""}>${escapeHtml(t("scopeHighMediumCases"))}</option>
                <option value="all_priorities_with_cases" ${selected === "all_priorities_with_cases" ? "selected" : ""}>${escapeHtml(t("scopeAllPriorityCases"))}</option>
            </select>
            <small>${escapeHtml(t("priorityScopedSearchHint"))}</small>
        </label>
    `;
}

function renderOutlineModuleFilters(section) {
    if (isCustomWorkspace()) return "";
    const modules = Object.keys(state.moduleCounts || {}).filter((item) => item !== "missing").sort((a, b) => a.localeCompare(b));
    if (!modules.length) return "";
    const selected = (state.outlineRetrieval[section.id] || {}).moduleFilters || [];
    return `
        <div class="outline-module-filter">
            <div>
                <strong>${escapeHtml(t("searchWithinModules"))}</strong>
                <small>${escapeHtml(t("moduleScopedSearchHint"))}</small>
            </div>
            <div class="module-check-list">
                ${modules.map((moduleName) => `
                    <label class="module-check">
                        <input class="outline-module-check" type="checkbox" value="${escapeHtml(moduleName)}" ${selected.includes(moduleName) ? "checked" : ""}>
                        <span>${escapeHtml(formatModuleLabel(moduleName))}</span>
                    </label>
                `).join("")}
            </div>
        </div>
    `;
}

function selectedOutlineModules() {
    return Array.from(els.outlineDetail.querySelectorAll(".outline-module-check:checked"))
        .map((input) => input.value)
        .filter(Boolean);
}

function selectedOutlinePriorityScope() {
    return document.getElementById("outline-priority-scope")?.value || "all_priorities_with_cases";
}

function renderOutlineEvidenceChoice(context, index) {
    const key = context.key || outlineEvidenceKey(context, index);
    const section = activeOutlineSection();
    const selectedKeys = section ? (state.outlineRetrieval[section.id] || {}).selectedKeys : null;
    const checked = !Array.isArray(selectedKeys) || selectedKeys.includes(key);
    return `
        <label class="compose-evidence-item outline-evidence-item">
            <input class="outline-evidence-check" type="checkbox" data-key="${escapeHtml(key)}" ${checked ? "checked" : ""}>
            <span>
                <strong>${escapeHtml(context.citekey ? `@${context.citekey}` : context.pmid ? `PMID ${context.pmid}` : (context.name || t("pdfFiles")))}</strong>
                <small>${escapeHtml(context.citation || context.name || "")}</small>
                <em>${escapeHtml(context.text || "")}</em>
            </span>
            <button class="text-button outline-add-library" type="button" data-index="${escapeHtml(String(index))}">${escapeHtml(t("addEvidenceToLibrary"))}</button>
        </label>
    `;
}

function outlineEvidenceKey(context, index) {
    const source = context.pmid || context.name || context.citation || "source";
    return `outline:${source}:${index}:${String(context.text || "").slice(0, 32)}`;
}

function normalizeOutlineContext(context, index) {
    const key = outlineEvidenceKey(context, index);
    return {
        key,
        id: context.id || key,
        pmid: context.pmid || "",
        citekey: context.citekey || (context.pmid ? `pmid:${context.pmid}` : ""),
        section: context.section || "",
        text: stripDisplayLineReferencesClient(context.text || ""),
        citation: context.citation || context.name || "",
        url: context.url || (context.pmid ? `/papers/${encodeURIComponent(context.pmid)}` : ""),
        source_name: context.name || "",
    };
}

function stripDisplayLineReferencesClient(text) {
    return String(text || "")
        .replace(/\s*\(?pmid[_:\s-]*\d+\s+lines?\s+\d+(?:\s*[-–]\s*\d+)?\)?/gi, "")
        .replace(/\s*\(?lines?\s+\d+(?:\s*[-–]\s*\d+)?\)?/gi, "")
        .trim();
}

async function retrieveOutlineEvidence(section) {
    const queryNode = document.getElementById("outline-query");
    const question = (queryNode?.value || defaultOutlineQuery(section)).trim();
    if (!question) return;
    const moduleFilters = selectedOutlineModules();
    const priorityScope = isCustomWorkspace() ? "" : selectedOutlinePriorityScope();
    state.outlineRetrieval[section.id] = { query: question, contexts: [], moduleFilters, priorityScope };
    els.outlineDetail.querySelector(".outline-evidence-list").innerHTML = renderProgressNotice(t("searchingCorpus"));
    try {
        const endpoint = isCustomWorkspace()
            ? `/api/workspaces/${encodeURIComponent(activeWorkspaceId())}/paperqa/query`
            : "/api/query";
        const result = await fetchJson(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, k: 10, max_sources: 8, module_filters: moduleFilters, priority_scope: priorityScope }),
        });
        const contexts = (result.contexts || []).map(normalizeOutlineContext);
        state.outlineRetrieval[section.id] = { query: question, contexts, selectedKeys: contexts.map((item) => item.key), moduleFilters, priorityScope };
        renderLlmInfo({ paperqa: result.llm, draft: result.draft_llm });
        renderOutlineDetail();
    } catch (error) {
        state.outlineRetrieval[section.id] = { query: question, contexts: [], moduleFilters, priorityScope };
        els.outlineDetail.querySelector(".outline-evidence-list").innerHTML = `<p class="error-text">${escapeHtml(formatError(error.message))}</p>`;
    }
}

function selectedOutlineEvidenceKeys(sectionId, forceDom = false) {
    const contexts = (state.outlineRetrieval[sectionId] || {}).contexts || [];
    const stored = (state.outlineRetrieval[sectionId] || {}).selectedKeys;
    if (!forceDom && state.activeOutlineId !== sectionId && Array.isArray(stored)) {
        return stored.filter((key) => contexts.some((context) => context.key === key));
    }
    return Array.from(els.outlineDetail.querySelectorAll(".outline-evidence-check:checked"))
        .map((checkbox) => checkbox.dataset.key)
        .filter(Boolean)
        .filter((key) => contexts.some((context) => context.key === key));
}

function addOutlineEvidenceToLibrary(sectionId, index) {
    const contexts = (state.outlineRetrieval[sectionId] || {}).contexts || [];
    const item = contexts[index];
    if (!item) return;
    if (!evidenceLibraryHas(item.key)) {
        state.evidenceLibrary.push(item);
        saveEvidenceLibrary();
        renderEvidenceLibrary();
    }
    showArticleOutput(`<p class="success-text">${escapeHtml(t("addedEvidenceToLibrary"))}</p>`);
}

function confirmedOutlineEvidenceMap() {
    return state.manuscriptOutline.map((section) => {
        const retrieval = state.outlineRetrieval[section.id] || {};
        const contexts = Array.isArray(retrieval.contexts) ? retrieval.contexts : [];
        const selectedKeys = selectedOutlineEvidenceKeys(section.id);
        return {
            section,
            query: retrieval.query || defaultOutlineQuery(section),
            evidences: contexts.filter((item) => selectedKeys.includes(item.key)),
        };
    }).filter((item) => item.evidences.length);
}

function confirmOutlineEvidenceSelections() {
    const confirmed = confirmedOutlineEvidenceMap();
    if (!confirmed.length) return false;
    for (const group of confirmed) {
        for (const item of group.evidences) {
            if (!evidenceLibraryHas(item.key)) {
                state.evidenceLibrary.push({ ...item, section: group.section.title });
            }
        }
    }
    saveEvidenceLibrary();
    renderEvidenceLibrary();
    return true;
}

function buildWritingBlueprint() {
    const confirmed = confirmedOutlineEvidenceMap();
    if (!confirmed.length) return t("blueprintEmpty");
    const lines = [
        "# Manuscript blueprint",
        "",
        "## Global storyline",
        "- Define the central claim that connects the confirmed sections.",
        "- Keep mechanistic claims tied to cited evidence and avoid unsupported clinical conclusions.",
        "- Use citation keys in the final prose and preserve the section order unless the logic requires a clearer transition.",
        "",
        "## Section plan",
    ];
    for (const group of confirmed) {
        const citeKeys = group.evidences
            .map((item) => item.citekey || (item.pmid ? `pmid:${item.pmid}` : ""))
            .filter(Boolean);
        lines.push("");
        lines.push(`### ${group.section.title}`);
        lines.push(`- Function: explain how this section advances the review argument.`);
        lines.push(`- Evidence count: ${group.evidences.length}`);
        if (citeKeys.length) lines.push(`- Citation keys: ${[...new Set(citeKeys)].map((key) => `[@${key}]`).join(" ")}`);
        lines.push(`- Transition: state how this section connects to the previous and next section.`);
    }
    return lines.join("\n");
}

function buildParagraphPlansFromConfirmedEvidence() {
    const confirmed = confirmedOutlineEvidenceMap();
    if (!confirmed.length) return false;
    els.articleParagraphs.innerHTML = "";
    for (const group of confirmed) {
        const evidenceKeys = group.evidences.map((item) => item.key);
        addArticleParagraph({
            instruction: `${group.section.title}\n\nBlueprint guidance:\n${state.writingBlueprint || buildWritingBlueprint()}`,
            evidenceKeys,
        });
    }
    return true;
}

function renderEvidenceLibrary() {
    if (!els.libraryList) return;
    els.libraryCount.textContent = String(state.evidenceLibrary.length);
    els.composeButton.disabled = false;
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
                <div class="editable-draft compact-editable-draft">
                    <textarea class="draft-editor history-draft-editor" data-id="${escapeHtml(item.id)}">${escapeHtml(draftText)}</textarea>
                    <div class="draft-editor-actions">
                        <span class="draft-editor-status"></span>
                        <button class="secondary-button small-button save-history-draft" type="button" data-id="${escapeHtml(item.id)}">${escapeHtml(t("saveDraftEdit"))}</button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
    document.querySelectorAll(".pin-draft").forEach((button) => {
        button.addEventListener("click", () => updateDraftPin(button.dataset.id, button.dataset.pinned !== "true"));
    });
    document.querySelectorAll(".delete-draft").forEach((button) => {
        button.addEventListener("click", () => deleteDraftRecord(button.dataset.id));
    });
    document.querySelectorAll(".save-history-draft").forEach((button) => {
        button.addEventListener("click", () => {
            const draftBox = button.closest(".editable-draft");
            const editor = draftBox?.querySelector(".history-draft-editor");
            saveDraftText(button.dataset.id, editor?.value || "", draftBox?.querySelector(".draft-editor-status"));
        });
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

async function saveDraftText(recordId, draftText, statusNode) {
    if (!recordId || !state.userToken) return false;
    const draft = String(draftText || "").trim();
    if (!draft) {
        if (statusNode) statusNode.textContent = t("draftEditEmpty");
        return false;
    }
    try {
        const result = await fetchJson(`/api/drafts/${encodeURIComponent(recordId)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_token: state.userToken, draft }),
        });
        if (statusNode) statusNode.textContent = t("draftEditSaved");
        state.draftHistory = state.draftHistory.map((item) => item.id === recordId ? result.draft : item);
        return true;
    } catch (error) {
        if (statusNode) statusNode.textContent = formatError(error.message);
        return false;
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
    renderManuscriptOutline();
    renderWritingFlow();
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

function addArticleParagraph(options = {}) {
    const paragraphIndex = els.articleParagraphs.children.length + 1;
    const evidenceItems = renderArticleEvidenceChoices(paragraphIndex, options.evidenceKeys || []);
    els.articleParagraphs.insertAdjacentHTML("beforeend", `
        <section class="article-paragraph-card" data-paragraph-id="${Date.now()}-${paragraphIndex}">
            <div class="article-paragraph-head">
                <h3>${escapeHtml(t("paragraphLabel"))} ${paragraphIndex}</h3>
                <button class="text-button remove-paragraph" type="button">${escapeHtml(t("removeParagraph"))}</button>
            </div>
            <label class="field-label">${escapeHtml(t("paragraphBrief"))}</label>
            <textarea class="query-input compact-query paragraph-goal" placeholder="${escapeHtml(t("paragraphBriefPlaceholder"))}">${escapeHtml(options.instruction || "")}</textarea>
            <label class="field-label">${escapeHtml(t("paragraphLength"))}</label>
            <input class="text-input paragraph-length" type="text" inputmode="numeric" placeholder="${escapeHtml(t("paragraphLengthPlaceholder"))}" value="${escapeHtml(options.length || "")}">
            <div class="compose-evidence-head">
                <span>${escapeHtml(t("paragraphEvidence"))}</span>
                <span class="paragraph-evidence-count"></span>
            </div>
            <div class="compose-evidence-list paragraph-evidence-list">${evidenceItems}</div>
        </section>
    `);
    bindArticleParagraphCard(els.articleParagraphs.lastElementChild);
    updateArticleParagraphLabels();
    els.articleParagraphs.lastElementChild.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderArticleEvidenceChoices(paragraphIndex, preferredKeys = []) {
    const splitAt = Math.ceil(state.evidenceLibrary.length / 2);
    return state.evidenceLibrary.map((item, itemIndex) => {
        const checked = preferredKeys.length
            ? preferredKeys.includes(item.key)
            : paragraphIndex === 1
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
        return false;
    }
    if (!paragraphs.some((paragraph) => paragraph.evidences.length)) {
        showArticleOutput(`<p class="error-text">${escapeHtml(t("articleNeedEvidence"))}</p>`);
        return false;
    }
    showArticleOutput(renderProgressNotice(t("generatingArticle")));
    try {
        const result = await fetchJson("/api/draft/article", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                mode: "review",
                lang: state.lang,
                library_context: draftLibraryContext(),
                blueprint: state.writingBlueprint || els.blueprintText?.value || "",
                paragraphs,
                user_token: state.userToken,
                user_name: state.userName,
            }),
        });
        renderLlmInfo({ draft: result.llm });
        loadDraftHistory();
        showArticleOutput(renderEditableDraft({
            title: t("generatedArticle"),
            llm: result.llm,
            draft: result.draft || "",
            citationKeys: result.citation_keys || [],
            recordId: result.record?.id || "",
        }));
        return true;
    } catch (error) {
        showArticleOutput(`<p class="error-text">${escapeHtml(formatError(error.message))}</p>`);
        return false;
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

function renderEditableDraft({ title, llm, draft, citationKeys = [], recordId = "" }) {
    return `
        <div class="answer-header">
            <h3>${escapeHtml(title)}</h3>
            ${llm ? `<span class="llm-badge">${escapeHtml(formatLlm(llm))}</span>` : ""}
        </div>
        <div class="editable-draft">
            <p class="editable-draft-hint">${escapeHtml(t("editableDraftHint"))}</p>
            <textarea class="draft-editor article-draft-editor" id="article-draft-editor" data-id="${escapeHtml(recordId)}">${escapeHtml(draft || "")}</textarea>
            <div class="draft-editor-actions">
                <span class="draft-editor-status" id="article-draft-save-status"></span>
                ${recordId ? `<button class="secondary-button small-button" id="save-article-draft" type="button">${escapeHtml(t("saveDraftEdit"))}</button>` : ""}
            </div>
        </div>
        ${renderCitationKeySummary(citationKeys)}
    `;
}

function bindEditableDraftOutput(root = document) {
    const saveButton = root.querySelector("#save-article-draft");
    if (!saveButton) return;
    saveButton.addEventListener("click", () => {
        const editor = root.querySelector("#article-draft-editor");
        const status = root.querySelector("#article-draft-save-status");
        saveDraftText(editor?.dataset.id || "", editor?.value || "", status);
    });
}

function showArticleOutput(html) {
    els.articleOutput.classList.remove("hidden");
    els.articleOutput.innerHTML = html;
    bindEditableDraftOutput(els.articleOutput);
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
                library_context: draftLibraryContext(),
                instruction,
                evidences,
                user_token: state.userToken,
                user_name: state.userName,
            }),
        });
        renderLlmInfo({ draft: result.llm });
        loadDraftHistory();
        output.innerHTML = renderEditableDraft({
            title: t("generatedParagraph"),
            llm: result.llm,
            draft: result.draft || "",
            citationKeys: result.citation_keys || [],
            recordId: result.record?.id || "",
        });
        bindEditableDraftOutput(output);
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
        state.selectedUploadIds.clear();
        await loadWorkspacePdfs();
        return;
    }
    try {
        const data = await fetchJson("/api/uploads");
        state.uploads = (data.uploads || []).slice().sort((a, b) => {
            const byTime = String(b.uploaded_at || "").localeCompare(String(a.uploaded_at || ""));
            return byTime || Number(b.id || 0) - Number(a.id || 0);
        });
        pruneUploadSelection();
        renderUploads();
    } catch (error) {
        els.uploadsList.innerHTML = `<p class="error-text">${escapeHtml(error.message)}</p>`;
        els.uploadPagination.classList.add("hidden");
        updateUploadSelectionToolbar([]);
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

function visibleUploadsOnPage() {
    const start = (state.uploadPage - 1) * state.uploadPageSize;
    return state.filteredUploads.slice(start, start + state.uploadPageSize);
}

function pruneUploadSelection() {
    const existing = new Set(state.uploads.map((upload) => Number(upload.id)));
    state.selectedUploadIds.forEach((id) => {
        if (!existing.has(Number(id))) state.selectedUploadIds.delete(id);
    });
}

function updateUploadSelectionToolbar(pageUploads = visibleUploadsOnPage()) {
    const selectedCount = state.selectedUploadIds.size;
    const inWorkspace = isCustomWorkspace();
    if (els.uploadSelectionCount) {
        els.uploadSelectionCount.textContent = `${selectedCount} ${t("selectedUploads")}`;
        els.uploadSelectionCount.classList.toggle("has-selection", selectedCount > 0);
    }
    if (els.selectVisibleUploads) {
        els.selectVisibleUploads.disabled = inWorkspace || !pageUploads.length;
    }
    if (els.clearUploadSelection) {
        els.clearUploadSelection.disabled = inWorkspace || selectedCount === 0;
    }
    if (els.deleteSelectedUploads) {
        els.deleteSelectedUploads.disabled = inWorkspace || selectedCount === 0;
    }
}

function selectVisibleUploads() {
    visibleUploadsOnPage().forEach((upload) => {
        state.selectedUploadIds.add(Number(upload.id));
    });
    renderUploads();
}

async function deleteSelectedUploads() {
    const ids = Array.from(state.selectedUploadIds).filter(Number.isFinite);
    if (!ids.length) return;
    if (!confirm(t("batchDeleteConfirm"))) return;
    try {
        await fetchJson("/api/uploads/batch-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
        });
        state.selectedUploadIds.clear();
        setUploadMessage(t("batchDeleteSuccess"), false, true);
        await loadUploads();
    } catch (err) {
        alert(`${t("deleteFailed")}: ${err.message}`);
    }
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
        updateUploadSelectionToolbar([]);
        return;
    }

    const pageUploads = visibleUploadsOnPage();
    els.uploadsList.innerHTML = `
        <div class="upload-record-list">
            ${pageUploads.map((upload) => `
                <div class="upload-item">
                    <label class="upload-row-check" title="${escapeHtml(t("selectVisibleUploads"))}">
                        <input class="upload-check" type="checkbox" data-id="${escapeHtml(String(upload.id))}" ${state.selectedUploadIds.has(Number(upload.id)) ? "checked" : ""}>
                    </label>
                    <div class="upload-info">
                        <p class="upload-name">${escapeHtml(upload.original_filename || upload.filename)}</p>
                        <p class="upload-meta">PMID ${escapeHtml(upload.pmid || t("missing"))} · ${escapeHtml(upload.uploader_name || t("missing"))} · ${formatDate(upload.uploaded_at)} · ${formatSize(upload.file_size)}</p>
                    </div>
                    <div class="upload-actions">
                        <span class="status-pill status-${escapeHtml(String(upload.status || "uploaded").toLowerCase().replace(/\s+/g, "-"))}">${escapeHtml(localizeUploadStatus(upload.status || "uploaded"))}</span>
                        ${upload.file_url ? `<a class="icon-button pdf-open-btn" href="${escapeHtml(upload.file_url)}" target="_blank" rel="noopener" title="${escapeHtml(t("openPdf"))}" aria-label="${escapeHtml(t("openPdf"))}">${escapeHtml(fileTypeLabel(upload))}</a>` : ""}
                        <button class="icon-button status-toggle" data-id="${escapeHtml(String(upload.id))}" data-status="${escapeHtml(String(upload.status || "uploaded"))}" title="${escapeHtml(t("toggleStatus"))}" aria-label="${escapeHtml(t("toggleStatus"))}">&#8596;</button>
                        <button class="icon-button delete-btn" data-id="${escapeHtml(String(upload.id))}" title="${escapeHtml(t("deleteUpload"))}" aria-label="${escapeHtml(t("deleteUpload"))}">&times;</button>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
    updateUploadPagination();
    updateUploadSelectionToolbar(pageUploads);
    bindUploadRecordActions();
}

function renderWorkspaceUploads() {
    const docs = state.workspaceDocuments || [];
    updateUploadSelectionToolbar([]);
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
                        ${doc.file_url || doc.pdf_url ? `<a class="icon-button pdf-open-btn" href="${escapeHtml(doc.file_url || doc.pdf_url)}" target="_blank" rel="noopener" title="${escapeHtml(t("openPdf"))}" aria-label="${escapeHtml(t("openPdf"))}">${escapeHtml(fileTypeLabel(doc))}</a>` : ""}
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
    els.uploadsList.querySelectorAll(".upload-check").forEach((input) => {
        input.addEventListener("change", () => {
            const id = Number(input.dataset.id);
            if (!Number.isFinite(id)) return;
            if (input.checked) {
                state.selectedUploadIds.add(id);
            } else {
                state.selectedUploadIds.delete(id);
            }
            updateUploadSelectionToolbar();
        });
    });

    els.uploadsList.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = Number(btn.dataset.id);
            if (!confirm(`${t("deleteUploadConfirm")} #${id}?`)) return;
            try {
                await fetchJson(`/api/uploads/${id}`, { method: "DELETE" });
                state.selectedUploadIds.delete(id);
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
    return splitTags(value).map((item) => formatModuleLabel(item)).filter(Boolean).join(", ");
}

function splitTags(value) {
    return String(value || "").split(/[;|,]/).map((item) => item.trim()).filter(Boolean);
}

function joinTagValues(values) {
    const seen = new Set();
    const tags = [];
    for (const value of values) {
        for (const tag of splitTags(value)) {
            const key = tag.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                tags.push(tag);
            }
        }
    }
    return tags.join("; ");
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
