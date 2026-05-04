const state = {
    papers: [],
    filteredPapers: [],
    selectedPmid: null,
    userName: localStorage.getItem("litdb.userName") || "",
    lang: localStorage.getItem("litdb.lang") || "en",
    project: sessionStorage.getItem("litdb.project") || "",
    evidenceByKey: {},
    evidenceLibrary: loadEvidenceLibrary(),
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
        appEyebrow: "APS Review Workspace",
        appTitle: "Literature Library",
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
        priority: "Priority",
        allPriorities: "All priorities",
        priorityHigh: "High priority",
        priorityMedium: "Medium priority",
        priorityLow: "Low priority",
        module: "Module",
        allModules: "All modules",
        evidenceLibrary: "Evidence Library",
        evidenceLibraryHint: "Checked PaperQA sentences are saved here.",
        noEvidenceSaved: "No selected sentences yet.",
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
        articleNeedEvidence: "Assign evidence to at least one paragraph.",
        articleNeedParagraph: "Add at least one paragraph plan.",
        paragraphEvidence: "Evidence assigned to this paragraph",
        uploadPdf: "Upload PDF",
        uploadButton: "Upload",
        pmidPlaceholder: "PMID",
        tabPapers: "Papers",
        tabAsk: "Ask PaperQA",
        tabUploads: "Uploads",
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
        appEyebrow: "APS 综述工作区",
        appTitle: "文献库",
        checkingPaperQA: "正在检查 PaperQA",
        paperqaLLM: "PaperQA 模型",
        draftLLM: "生成模型",
        docsUnit: "篇索引文档",
        corpus: "文献库",
        papersMetric: "篇文献",
        filters: "筛选",
        search: "搜索",
        searchLiterature: "搜索文献",
        searchPlaceholder: "搜索 PMID、标题、期刊、模块",
        priority: "优先度",
        allPriorities: "全部优先度",
        priorityHigh: "高优先度",
        priorityMedium: "中优先度",
        priorityLow: "低优先度",
        module: "模块",
        allModules: "全部模块",
        evidenceLibrary: "自选库",
        evidenceLibraryHint: "勾选 PaperQA 句子后会保存到这里。",
        noEvidenceSaved: "还没有选择句子。",
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
        articleNeedEvidence: "请至少给一个段落分配证据。",
        articleNeedParagraph: "请至少添加一个段落计划。",
        paragraphEvidence: "本段使用的证据",
        uploadPdf: "上传 PDF",
        uploadButton: "上传",
        pmidPlaceholder: "PMID",
        tabPapers: "文献",
        tabAsk: "问 PaperQA",
        tabUploads: "上传记录",
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
    module_1_criteria_and_classification: "分类与诊断标准",
    module_2_clinical_management: "临床管理",
    module_3_immunothrombosis: "免疫血栓",
    module_4_obstetric_aps: "产科 APS",
    module_5_catastrophic_aps: "灾难性 APS",
    module_6_pediatric_aps: "儿童 APS",
    module_7_non_criteria_manifestations: "非标准临床表现",
    module_8_methods_and_biomarkers: "方法与生物标志物",
};

const els = {
    loginScreen: document.getElementById("login-screen"),
    skipLink: document.getElementById("skip-link"),
    projectScreen: document.getElementById("project-screen"),
    appShell: document.getElementById("app-shell"),
    mainWorkspace: document.getElementById("main-workspace"),
    articleComposePage: document.getElementById("article-compose-page"),
    loginForm: document.getElementById("login-form"),
    loginName: document.getElementById("login-name"),
    userChip: document.getElementById("user-chip"),
    projectUserChip: document.getElementById("project-user-chip"),
    openApsProject: document.getElementById("open-aps-project"),
    signedUpload: document.getElementById("signed-upload"),
    engineStatus: document.getElementById("engine-status"),
    statusStrip: document.getElementById("status-strip"),
    paperqaLlm: document.getElementById("paperqa-llm"),
    draftLlm: document.getElementById("draft-llm"),
    metricPapers: document.getElementById("metric-papers"),
    prioritySummary: document.getElementById("priority-summary"),
    searchInput: document.getElementById("search-input"),
    priorityFilter: document.getElementById("priority-filter"),
    moduleFilter: document.getElementById("module-filter"),
    libraryCount: document.getElementById("library-count"),
    libraryList: document.getElementById("library-list"),
    clearLibrary: document.getElementById("clear-library"),
    composeButton: document.getElementById("compose-button"),
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
    backToWorkspace: document.getElementById("back-to-workspace"),
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
    bindQuery();
    bindEvidenceLibrary();
    bindArticleComposer();
    bindUpload();
    applyLanguage();
    renderEvidenceLibrary();
    refreshUserState();
    loadHealth();
    loadPapers();
    loadUploads();
    window.setInterval(loadHealth, 15000);
});

function t(key) {
    return (i18n[state.lang] && i18n[state.lang][key]) || i18n.en[key] || key;
}

function bindLogin() {
    els.loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const value = els.loginName.value.trim();
        if (!value) return;
        state.userName = value;
        localStorage.setItem("litdb.userName", value);
        refreshUserState();
    });

    [els.userChip, els.projectUserChip].forEach((button) => button.addEventListener("click", switchUser));

    els.openApsProject.addEventListener("click", () => {
        state.project = "aps-review";
        sessionStorage.setItem("litdb.project", state.project);
        refreshUserState();
    });
}

function switchUser() {
    state.userName = "";
    state.project = "";
    localStorage.removeItem("litdb.userName");
    sessionStorage.removeItem("litdb.project");
    refreshUserState();
    els.loginName.focus();
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
}

function refreshUserState() {
    const hasUser = Boolean(state.userName);
    const inProject = hasUser && state.project === "aps-review";
    els.loginScreen.classList.toggle("hidden", hasUser);
    els.projectScreen.classList.toggle("hidden", !hasUser || inProject);
    els.appShell.classList.toggle("hidden", !inProject);
    if (!inProject) {
        els.articleComposePage.classList.add("hidden");
        els.mainWorkspace.classList.remove("hidden");
    }
    els.loginName.value = state.userName;
    els.userChip.textContent = state.userName ? `${state.userName} · ${t("switchUser")}` : t("loginButton");
    els.projectUserChip.textContent = state.userName ? `${state.userName} · ${t("switchUser")}` : t("loginButton");
    els.signedUpload.textContent = state.userName ? `${t("signedInAs")}: ${state.userName}` : "";
    els.skipLink.href = inProject ? "#main-workspace" : "#project-main";
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
            if (input === els.searchInput) {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(applyFilters, 300);
            } else {
                applyFilters();
            }
        });
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

function bindArticleComposer() {
    els.backToWorkspace.addEventListener("click", closeArticleComposer);
    els.addParagraph.addEventListener("click", () => addArticleParagraph());
    els.generateArticle.addEventListener("click", generateArticleDraft);
}

function bindUpload() {
    els.uploadForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        await uploadPdf();
    });
    els.refreshUploads.addEventListener("click", loadUploads);
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
    try {
        const data = await fetchJson("/api/papers");
        state.papers = data.papers || [];
        populateModuleFilter(data.summary ? data.summary.module_counts : {});
        applyFilters();
    } catch (error) {
        els.papersBody.innerHTML = `<tr><td colspan="3" class="error-text">${escapeHtml(t("couldNotLoadPapers"))}: ${escapeHtml(error.message)}</td></tr>`;
    }
}

function populateModuleFilter(moduleCounts) {
    const modules = Object.keys(moduleCounts || {}).filter((item) => item !== "missing").sort();
    els.moduleFilter.innerHTML = `<option value="">${escapeHtml(t("allModules"))}</option>` + modules
        .map((moduleName) => `<option value="${escapeHtml(moduleName)}">${escapeHtml(formatModuleLabel(moduleName))} (${moduleCounts[moduleName]})</option>`)
        .join("");
}

function applyFilters() {
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

    renderPapers();
}

function renderPapers() {
    els.paperCount.textContent = `${state.filteredPapers.length} ${t("shown")}`;
    if (!state.filteredPapers.length) {
        els.papersBody.innerHTML = `<tr><td colspan="3" class="empty-note">${escapeHtml(t("noPapers"))}</td></tr>`;
        return;
    }

    els.papersBody.innerHTML = state.filteredPapers.map((paper) => `
        <tr class="paper-row ${paper.pmid === state.selectedPmid ? "selected" : ""}" data-pmid="${escapeHtml(paper.pmid)}">
            <td>
                <span class="paper-title">${escapeHtml(paper.title)}</span>
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

    els.paperDetail.innerHTML = `
        <h3>${escapeHtml(paper.title)}</h3>
        <p class="paper-meta">PMID ${escapeHtml(paper.pmid)} · ${escapeHtml(paper.year || "n.d.")}</p>
        <dl class="detail-grid">
            <div><dt>${escapeHtml(t("journal"))}</dt><dd>${escapeHtml(paper.journal || t("unknownJournal"))}</dd></div>
            <div><dt>${escapeHtml(t("priority"))}</dt><dd>${escapeHtml(localizePriority(paper.priority || t("missing")))}</dd></div>
            <div><dt>${escapeHtml(t("module"))}</dt><dd>${escapeHtml(compactModules(paper.aps_modules))}</dd></div>
            <div><dt>${escapeHtml(t("studyType"))}</dt><dd>${escapeHtml(paper.study_types || t("missing"))}</dd></div>
            <div><dt>DOI</dt><dd>${escapeHtml(paper.doi || t("missing"))}</dd></div>
        </dl>
        <a class="source-link" href="/papers/${encodeURIComponent(paper.pmid)}" target="_blank" rel="noopener">${escapeHtml(t("openPaper"))}</a>
        <p class="abstract">${escapeHtml(paper.abstract || t("noAbstract"))}</p>
    `;
}

async function askPaperQA(question) {
    state.evidenceByKey = {};
    els.answerPanel.innerHTML = `<p class="empty-note">${escapeHtml(t("searchingCorpus"))}</p>`;
    try {
        const result = await fetchJson("/api/paperqa/query", {
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
            <div class="answer-text">${escapeHtml(result.answer || t("noAnswer"))}</div>
            ${renderSources(result.contexts || [])}
        `;
        bindEvidenceControls();
    } catch (error) {
        els.answerPanel.innerHTML = `<p class="error-text">${escapeHtml(formatError(error.message))}</p>`;
    }
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
    const key = `${sentence.pmid || source.pmid}:${sentence.id}`;
    state.evidenceByKey[key] = { ...sentence, pmid: sentence.pmid || source.pmid, citation: source.citation || source.name || "" };
    const saved = evidenceLibraryHas(key);
    return `
        <label class="evidence-card is-highlighted ${saved ? "saved" : ""}">
            <input class="evidence-check" type="checkbox" data-key="${escapeHtml(key)}" ${saved ? "checked" : ""}>
            <span class="evidence-content">
                <span class="evidence-meta">PMID ${escapeHtml(sentence.pmid || source.pmid || "")} · ${escapeHtml(sentence.section || "")}</span>
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
                <span>PMID ${escapeHtml(item.pmid || "")}</span>
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

function openArticleComposer() {
    if (!state.evidenceLibrary.length) return;
    els.mainWorkspace.classList.add("hidden");
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
                    <strong>PMID ${escapeHtml(item.pmid || "")}</strong>
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
    showArticleOutput(`<p class="empty-note">${escapeHtml(t("generatingArticle"))}</p>`);
    try {
        const result = await fetchJson("/api/draft/article", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "review", lang: state.lang, paragraphs }),
        });
        renderLlmInfo({ draft: result.llm });
        showArticleOutput(`
            <div class="answer-header">
                <h3>${escapeHtml(t("generatedArticle"))}</h3>
                <span class="llm-badge">${escapeHtml(formatLlm(result.llm))}</span>
            </div>
            <div class="answer-text">${escapeHtml(result.draft || "")}</div>
        `);
    } catch (error) {
        showArticleOutput(`<p class="error-text">${escapeHtml(formatError(error.message))}</p>`);
    }
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
                <strong>PMID ${escapeHtml(item.pmid || "")}</strong>
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
    output.innerHTML = `<p class="empty-note">${escapeHtml(t("generatingDraft"))}</p>`;
    try {
        const result = await fetchJson("/api/draft/paragraph", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "review", lang: state.lang, instruction, evidences }),
        });
        renderLlmInfo({ draft: result.llm });
        output.innerHTML = `
            <div class="answer-header">
                <h3>${escapeHtml(t("generatedParagraph"))}</h3>
                <span class="llm-badge">${escapeHtml(formatLlm(result.llm))}</span>
            </div>
            <div class="answer-text">${escapeHtml(result.draft || "")}</div>
        `;
    } catch (error) {
        output.innerHTML = `<p class="error-text">${escapeHtml(formatError(error.message))}</p>`;
    }
}

async function uploadPdf() {
    const file = els.uploadFile.files[0];
    const pmid = els.uploadPmid.value.trim();
    const uploaderName = state.userName.trim();
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

    setUploadMessage(t("uploadingPdf"), false);
    try {
        await fetchJson("/api/upload", { method: "POST", body: formData });
        els.uploadForm.reset();
        setUploadMessage(t("uploadSaved"), false, true);
        loadUploads();
    } catch (error) {
        setUploadMessage(formatError(error.message), true);
    }
}

async function loadUploads() {
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

function compactModules(value) {
    if (!value) return t("missing");
    return String(value).split(/[;|,]/).map((item) => formatModuleLabel(item.trim())).filter(Boolean).join(", ");
}

function formatModuleLabel(value) {
    if (!value) return t("missing");
    const raw = String(value).trim();
    if (state.lang === "zh" && MODULE_LABELS_ZH[raw]) return MODULE_LABELS_ZH[raw];
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
