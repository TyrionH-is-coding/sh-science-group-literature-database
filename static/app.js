const state = {
    papers: [],
    filteredPapers: [],
    selectedPmid: null,
    userName: localStorage.getItem("litdb.userName") || "",
    lang: localStorage.getItem("litdb.lang") || "en",
    project: sessionStorage.getItem("litdb.project") || "",
};

const i18n = {
    en: {
        loginEyebrow: "Team workspace",
        loginTitle: "Welcome back",
        loginCopy: "Enter your name to access the research workspace.",
        loginNameLabel: "User name",
        loginButton: "Enter workspace",
        projectEyebrow: "Project hub",
        projectTitle: "Choose a dataset",
        apsKicker: "Active dataset",
        apsTitle: "APS Review",
        apsDescription: "Systematic review corpus with PaperQA search, paper inspection, and PDF upload queue.",
        enterProject: "Enter project",
        appEyebrow: "APS Review Workspace",
        appTitle: "SH Science Group Literature Database",
        checkingPaperQA: "Checking PaperQA",
        corpus: "Corpus",
        papersMetric: "papers",
        filters: "Filters",
        search: "Search",
        searchPlaceholder: "PMID, title, journal, module",
        priority: "Priority",
        allPriorities: "All priorities",
        priorityHigh: "High priority",
        priorityMedium: "Medium priority",
        priorityLow: "Low priority",
        module: "Module",
        allModules: "All modules",
        uploadPdf: "Upload PDF",
        uploadButton: "Upload",
        pmidPlaceholder: "PMID",
        tabPapers: "Papers",
        tabAsk: "Ask PaperQA",
        tabUploads: "Uploads",
        literatureTable: "Literature Table",
        reviewReadyPapers: "Review-ready papers",
        loading: "Loading",
        paper: "Paper",
        journal: "Journal",
        source: "Source",
        askAcrossCorpus: "Ask across the corpus",
        queryPlaceholder: "Ask a focused APS question.",
        askButton: "Ask",
        criteria: "Criteria",
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
        shown: "shown",
        paperQANotReady: "PaperQA indexing",
        paperQAReady: "PaperQA ready",
        paperQAUnavailable: "PaperQA unavailable",
        searchingCorpus: "Searching the corpus and preparing an answer...",
        noAnswer: "No answer returned.",
        sources: "Sources",
        openOriginal: "Open original",
        noUploads: "No uploaded PDFs yet.",
        uploadMissing: "Select a PDF and PMID.",
        uploadingPdf: "Uploading PDF...",
        uploadSaved: "Upload saved.",
        unknownJournal: "Unknown journal",
        unknownDate: "Unknown date",
        noAbstract: "No abstract was found in the prepared Markdown.",
        missing: "missing",
        backWorkspace: "Back to workspace",
        skipToContent: "Skip to content",
    },
    zh: {
        loginEyebrow: "团队工作台",
        loginTitle: "欢迎回来",
        loginCopy: "输入你的名字即可进入研究工作台。",
        loginNameLabel: "用户名",
        loginButton: "进入工作台",
        projectEyebrow: "项目入口",
        projectTitle: "选择数据集",
        apsKicker: "当前数据集",
        apsTitle: "APS Review",
        apsDescription: "系统综述语料库，支持 PaperQA 检索、文献查看和 PDF 上传队列。",
        enterProject: "进入项目",
        appEyebrow: "APS 综述工作台",
        appTitle: "SH Science Group 文献数据库",
        checkingPaperQA: "正在检查 PaperQA",
        corpus: "文献库",
        papersMetric: "篇文献",
        filters: "筛选",
        search: "搜索",
        searchPlaceholder: "PMID、标题、期刊、模块",
        priority: "优先级",
        allPriorities: "全部优先级",
        priorityHigh: "高优先度",
        priorityMedium: "中优先度",
        priorityLow: "低优先度",
        module: "模块",
        allModules: "全部模块",
        uploadPdf: "上传 PDF",
        uploadButton: "上传",
        pmidPlaceholder: "PMID",
        tabPapers: "文献",
        tabAsk: "问 PaperQA",
        tabUploads: "上传记录",
        literatureTable: "文献表",
        reviewReadyPapers: "已整理文献",
        loading: "加载中",
        paper: "文献",
        journal: "期刊",
        source: "来源",
        askAcrossCorpus: "基于文献库提问",
        queryPlaceholder: "输入一个具体的 APS 问题。",
        askButton: "提问",
        criteria: "诊断标准",
        complement: "补体",
        answerEmpty: "这里会显示回答和引用来源片段。",
        manualPdfs: "人工 PDF",
        uploadQueue: "上传队列",
        refresh: "刷新",
        selectedPaper: "选中文献",
        selectPaperEmpty: "选择一篇文献查看 metadata 和摘要。",
        signedInAs: "当前上传用户",
        switchUser: "切换用户",
        noPapers: "没有文献符合当前筛选条件。",
        shown: "条结果",
        paperQANotReady: "PaperQA 正在索引",
        paperQAReady: "PaperQA 已就绪",
        paperQAUnavailable: "PaperQA 不可用",
        searchingCorpus: "正在检索文献库并生成回答...",
        noAnswer: "没有返回回答。",
        sources: "引用来源",
        openOriginal: "打开原文",
        noUploads: "暂无上传 PDF。",
        uploadMissing: "请选择 PDF 并填写 PMID。",
        uploadingPdf: "正在上传 PDF...",
        uploadSaved: "上传已保存。",
        unknownJournal: "未知期刊",
        unknownDate: "未知日期",
        noAbstract: "整理后的 Markdown 中没有找到摘要。",
        missing: "缺失",
        backWorkspace: "返回工作台",
        skipToContent: "跳到主要内容",
    },
};

const els = {
    loginScreen: document.getElementById("login-screen"),
    skipLink: document.getElementById("skip-link"),
    projectScreen: document.getElementById("project-screen"),
    appShell: document.getElementById("app-shell"),
    loginForm: document.getElementById("login-form"),
    loginName: document.getElementById("login-name"),
    userChip: document.getElementById("user-chip"),
    projectUserChip: document.getElementById("project-user-chip"),
    openApsProject: document.getElementById("open-aps-project"),
    signedUpload: document.getElementById("signed-upload"),
    engineStatus: document.getElementById("engine-status"),
    statusStrip: document.getElementById("status-strip"),
    metricPapers: document.getElementById("metric-papers"),
    prioritySummary: document.getElementById("priority-summary"),
    searchInput: document.getElementById("search-input"),
    priorityFilter: document.getElementById("priority-filter"),
    moduleFilter: document.getElementById("module-filter"),
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
};

document.addEventListener("DOMContentLoaded", () => {
    bindLogin();
    bindLanguage();
    bindTabs();
    bindFilters();
    bindQuery();
    bindUpload();
    applyLanguage();
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
    document.querySelectorAll(".lang-button").forEach((button) => {
        button.classList.toggle("active", button.dataset.lang === state.lang);
    });
}

function refreshUserState() {
    const hasUser = Boolean(state.userName);
    const inProject = hasUser && state.project === "aps-review";
    els.loginScreen.classList.toggle("hidden", hasUser);
    els.projectScreen.classList.toggle("hidden", !hasUser || inProject);
    els.appShell.classList.toggle("hidden", !inProject);
    els.loginName.value = state.userName;
    els.userChip.textContent = state.userName ? `${state.userName} · ${t("switchUser")}` : t("loginButton");
    els.projectUserChip.textContent = state.userName ? `${state.userName} · ${t("switchUser")}` : t("loginButton");
    els.signedUpload.textContent = state.userName ? `${t("signedInAs")}: ${state.userName}` : "";
    els.skipLink.href = inProject ? "#main-workspace" : "#project-main";
}

function bindTabs() {
    document.querySelectorAll(".tab-button").forEach((button) => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".tab-button").forEach((item) => item.classList.remove("active"));
            document.querySelectorAll(".view").forEach((item) => item.classList.remove("active"));
            button.classList.add("active");
            document.getElementById(`view-${button.dataset.view}`).classList.add("active");
        });
    });
}

function bindFilters() {
    [els.searchInput, els.priorityFilter, els.moduleFilter].forEach((input) => {
        input.addEventListener("input", applyFilters);
        input.addEventListener("change", applyFilters);
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
        const error = health.engine && health.engine.error;
        const dot = els.statusStrip.querySelector(".status-dot");
        dot.className = `status-dot ${ready ? "status-ready" : error ? "status-error" : "status-waiting"}`;
        els.engineStatus.textContent = ready
            ? `${t("paperQAReady")} · ${health.engine.docs_count} docs`
            : error
              ? `${t("paperQAUnavailable")} · ${formatError(error)}`
              : t("paperQANotReady");
        els.metricPapers.textContent = health.corpus ? health.corpus.papers_count : "--";
        renderPrioritySummary(health.corpus ? health.corpus.priority_counts : {});
    } catch (error) {
        els.engineStatus.textContent = "Health check failed";
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
        els.papersBody.innerHTML = `<tr><td colspan="4" class="error-text">Could not load papers: ${escapeHtml(error.message)}</td></tr>`;
    }
}

function populateModuleFilter(moduleCounts) {
    const modules = Object.keys(moduleCounts || {}).filter((item) => item !== "missing").sort();
    els.moduleFilter.innerHTML = `<option value="">${escapeHtml(t("allModules"))}</option>` + modules
        .map((moduleName) => `<option value="${escapeHtml(moduleName)}">${escapeHtml(moduleName)} (${moduleCounts[moduleName]})</option>`)
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
            <td>${escapeHtml(compactModules(paper.aps_modules))}</td>
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
            <div><dt>${escapeHtml(t("module"))}</dt><dd>${escapeHtml(paper.aps_modules || t("missing"))}</dd></div>
            <div><dt>Study Type</dt><dd>${escapeHtml(paper.study_types || t("missing"))}</dd></div>
            <div><dt>DOI</dt><dd>${escapeHtml(paper.doi || t("missing"))}</dd></div>
        </dl>
        <a class="source-link" href="/papers/${encodeURIComponent(paper.pmid)}" target="_blank" rel="noopener">${escapeHtml(t("openOriginal"))}</a>
        <p class="abstract">${escapeHtml(paper.abstract || t("noAbstract"))}</p>
    `;
}

async function askPaperQA(question) {
    els.answerPanel.innerHTML = `<p class="empty-note">${escapeHtml(t("searchingCorpus"))}</p>`;
    try {
        const result = await fetchJson("/api/paperqa/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, k: 10, max_sources: 5 }),
        });

        els.answerPanel.innerHTML = `
            <h3>${escapeHtml(result.question)}</h3>
            <div class="answer-text">${escapeHtml(result.answer || t("noAnswer"))}</div>
            ${renderSources(result.contexts || [])}
        `;
    } catch (error) {
        els.answerPanel.innerHTML = `<p class="error-text">${escapeHtml(formatError(error.message))}</p>`;
    }
}

function renderSources(contexts) {
    if (!contexts.length) return "";
    return `
        <div class="sources">
            <p class="panel-label">${escapeHtml(t("sources"))}</p>
            ${contexts.map((source) => `
                <div class="source-item">
                    <strong>${escapeHtml(source.name || source.citation || "Source")}</strong>
                    ${source.url ? `<a class="source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(t("openOriginal"))}</a>` : ""}
                    <p>${escapeHtml(source.text || "")}</p>
                </div>
            `).join("")}
        </div>
    `;
}

async function uploadPdf() {
    const file = els.uploadFile.files[0];
    const pmid = els.uploadPmid.value.trim();
    const uploaderName = state.userName.trim();
    if (!file || !pmid) {
        setUploadMessage(t("uploadMissing"), true);
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
        els.uploadsList.innerHTML = uploads.map((upload) => `
            <div class="upload-item">
                <div>
                    <p class="upload-name">${escapeHtml(upload.original_filename || upload.filename)}</p>
                    <p class="upload-meta">PMID ${escapeHtml(upload.pmid)} · ${escapeHtml(upload.uploader_name)} · ${formatDate(upload.uploaded_at)}</p>
                </div>
                <span class="pill">${escapeHtml(upload.status || "uploaded")}</span>
            </div>
        `).join("");
    } catch (error) {
        els.uploadsList.innerHTML = `<p class="error-text">${escapeHtml(error.message)}</p>`;
    }
}

function renderPrioritySummary(counts) {
    const entries = Object.entries(counts || {});
    els.prioritySummary.innerHTML = entries.length
        ? entries.map(([key, value]) => `<span class="pill">${escapeHtml(localizePriority(key))} ${value}</span>`).join("")
        : '<span class="pill">No corpus data</span>';
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
    return String(value).split(/[;|,]/).map((item) => item.trim()).filter(Boolean).join(", ");
}

function formatDate(value) {
    if (!value) return t("unknownDate");
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function localizePriority(value) {
    const key = String(value || "").toLowerCase();
    if (key === "high") return t("priorityHigh");
    if (key === "medium") return t("priorityMedium");
    if (key === "low") return t("priorityLow");
    if (key === "missing") return t("missing");
    return value;
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
