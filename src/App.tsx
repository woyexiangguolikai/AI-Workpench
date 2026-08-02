import { useState } from 'react';
import {
  AlertTriangle,
  Brain,
  Cloud,
  FileText,
  FolderKanban,
  FolderOpen,
  Inbox,
  ListTodo,
  Scale,
  Settings,
  Sparkles,
  Sun,
  XCircle,
} from 'lucide-react';
import {
  documentDrafts as demoDocs,
  inboxItems as demoInbox,
  knowledgeCandidates as demoKnowledge,
  projects as demoProjects,
  reconciliationRows,
  requirements as demoRequirements,
  tasks as demoTasks,
} from './data';
import { createWorkCard, reconcileDailyTotals } from './lib/workbench';
import {
  mapFilesToDocuments,
  mapFilesToInboxItems,
  mapFilesToKnowledgeCandidates,
  mapFilesToProjects,
  type FileEntry,
} from './lib/material-loader';
import type {
  DirectorySummary,
  DocumentDraft,
  InboxItem,
  KnowledgeCandidate,
  Project,
  ViewId,
  WorkCard,
} from './types';
import { TodayView } from './ui/TodayView';
import { InboxView } from './ui/InboxView';
import { ProjectsView } from './ui/ProjectsView';
import { TasksView } from './ui/TasksView';
import { DocumentsView } from './ui/DocumentsView';
import { KnowledgeView } from './ui/KnowledgeView';
import { ReconciliationView } from './ui/ReconciliationView';
import { SettingsView } from './ui/SettingsView';

const navItems: Array<{ id: ViewId; label: string; icon: typeof Sun }> = [
  { id: 'today', label: '今日工作', icon: Sun },
  { id: 'inbox', label: '统一收件箱', icon: Inbox },
  { id: 'projects', label: '客户/项目', icon: FolderKanban },
  { id: 'tasks', label: '需求与任务', icon: ListTodo },
  { id: 'documents', label: '文档', icon: FileText },
  { id: 'knowledge', label: '知识库审核', icon: Brain },
  { id: 'reconciliation', label: '对账', icon: Scale },
  { id: 'settings', label: '设置', icon: Settings },
];

function App() {
  const [view, setView] = useState<ViewId>('today');
  const [inboxText, setInboxText] = useState('');
  const [workCards, setWorkCards] = useState<WorkCard[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeCandidate[]>(demoKnowledge);
  const [reconRows, setReconRows] = useState(reconciliationRows);
  const [selectedFolder, setSelectedFolder] = useState(
    () => localStorage.getItem('aiwp:selectedFolder') || 'D:\\客户资料\\北城医科大学',
  );
  const [folderSummary, setFolderSummary] = useState<DirectorySummary | null>(null);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  // 真实材料数据（Electron 模式加载，浏览器模式为 null）
  const [realDocs, setRealDocs] = useState<DocumentDraft[] | null>(null);
  const [realProjects, setRealProjects] = useState<Project[] | null>(null);
  const [realInbox, setRealInbox] = useState<InboxItem[] | null>(null);
  const [_realKnowledge, setRealKnowledge] = useState<KnowledgeCandidate[] | null>(null);

  // 使用真实数据或回退到演示数据
  const documents: DocumentDraft[] = realDocs ?? demoDocs;
  const projects: Project[] = realProjects ?? demoProjects;
  const inboxItems: InboxItem[] = realInbox ?? demoInbox;

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  /** 加载目录中的真实文件并映射为工作台数据 */
  const loadRealFiles = async (folder: string) => {
    if (!window.desktop) return;
    try {
      const files = await window.desktop.directory.listFiles(folder) as FileEntry[];
      const docs = mapFilesToDocuments(files, folder.replace(/\\/g, '/').split('/').pop() || folder);
      const prjs = mapFilesToProjects(files, folder);
      const inbox = mapFilesToInboxItems(files);
      const kn = mapFilesToKnowledgeCandidates(files);

      setRealDocs(docs);
      setRealProjects(prjs);
      setRealInbox(inbox);
      setRealKnowledge(kn);
      setKnowledge(kn);
    } catch (err) {
      // 加载失败时显示空状态，不回退到演示数据
      setRealDocs([]);
      setRealProjects([]);
      setRealInbox([]);
      setRealKnowledge([]);
      setKnowledge([]);
      throw err; // 重新抛出给上层 catch 显示错误
    }
  };

  const handleRecognizeInbox = () => {
    if (!inboxText.trim()) {
      showToast('请先粘贴一句话需求');
      return;
    }
    const firstProject = projects.length > 0 ? projects[0]!.name : '待归属项目';
    const card = createWorkCard(inboxText, firstProject);
    setWorkCards((current) => [card, ...current]);
    setInboxText('');
    showToast('已生成需求工作卡，待你确认');
  };

  const handleSelectFolder = async () => {
    const applyFolder = (folder: string) => {
      localStorage.setItem('aiwp:selectedFolder', folder);
      setSelectedFolder(folder);
    };

    if (window.desktop) {
      setFolderError(null);
      const folder = await window.desktop.selectDirectory();
      if (!folder) return;
      applyFolder(folder);
      try {
        await window.desktop.addAllowedDir(folder);
        const summary = await window.desktop.directory.scan(folder);
        setFolderSummary(summary);
        setFolderError(null);
        // 加载真实文件并映射为工作台数据
        await loadRealFiles(folder);
        showToast(`已选择 ${folder}，发现 ${summary.fileCount} 个文件`);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '未知错误';
        setFolderSummary(null);
        setRealDocs([]);
        setRealProjects([]);
        setRealInbox([]);
        setRealKnowledge([]);
        setFolderError(`扫描失败：${message}`);
        showToast('目录已选择，但扫描失败（详见顶部提示）');
      }
      return;
    }

    // 浏览器预览模式：使用演示数据
    const demoFolder = 'D:\\客户资料\\演示目录';
    applyFolder(demoFolder);
    setFolderError(null);
    setFolderSummary({
      folder: demoFolder,
      fileCount: 28,
      notes: 9,
      documents: 6,
      spreadsheets: 5,
      pdfs: 4,
      images: 2,
      other: 2,
      sampleFiles: ['项目台账.xlsx', '需求说明书.docx', '投标文件.pdf', '会议纪要.md'],
    });
    setRealDocs(null);
    setRealProjects(null);
    setRealInbox(null);
    setRealKnowledge(null);
    setKnowledge(demoKnowledge);
    showToast('浏览器预览模式：已使用演示目录');
  };

  const handleKnowledgeDecision = (id: string, status: '已采纳' | '已忽略') => {
    setKnowledge((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    );
    showToast(status === '已采纳' ? '知识已晋升到正式知识库' : '候选知识已忽略');
  };

  const handleImportReconciliation = () => {
    const result = reconcileDailyTotals(
      [
        { date: '2026-07-01', amount: 12800.5 },
        { date: '2026-07-02', amount: 14320.0 },
      ],
      [
        { date: '2026-07-01', amount: 12800.5 },
        { date: '2026-07-02', amount: 14290.0 },
      ],
    );
    setReconRows(result);
    showToast('已导入本月对账 Excel 示例');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={18} />
          </div>
          <div>
            <strong>AI-Workpench</strong>
            <span>本地智能工作台</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="主导航">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${view === item.id ? 'active' : ''}`}
                onClick={() => setView(item.id)}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-status">
          <Cloud size={15} />
          <span>DeepSeek 已配置</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <h1>{navItems.find((item) => item.id === view)?.label}</h1>
            <p>2026-08-02 星期日 · 当前资料目录</p>
            <span className="folder-path">{selectedFolder}</span>
            {folderError && (
              <div className="folder-error" role="alert">
                <AlertTriangle size={14} />
                <span>{folderError}</span>
                <button
                  type="button"
                  className="error-dismiss"
                  onClick={() => setFolderError(null)}
                  aria-label="关闭错误提示"
                >
                  <XCircle size={14} />
                </button>
              </div>
            )}
            {!folderError && folderSummary && (
              <div className="folder-summary">
                已扫描 {folderSummary.fileCount} 个文件：Markdown {folderSummary.notes} · Word{' '}
                {folderSummary.documents} · Excel {folderSummary.spreadsheets} · PDF{' '}
                {folderSummary.pdfs}
              </div>
            )}
          </div>
          <button className="primary-button" type="button" onClick={handleSelectFolder}>
            <FolderOpen size={16} />
            选择目录
          </button>
        </header>

        <section className="content-area">
          {view === 'today' && (
            <TodayView
              workCards={workCards}
              projects={projects}
              tasks={realDocs !== null ? [] : demoTasks}
              onToast={showToast}
            />
          )}
          {view === 'inbox' && (
            <InboxView
              inboxText={inboxText}
              setInboxText={setInboxText}
              onRecognize={handleRecognizeInbox}
              workCards={workCards}
              inboxItems={inboxItems}
            />
          )}
          {view === 'projects' && <ProjectsView projects={projects} />}
          {view === 'tasks' && <TasksView tasks={realDocs !== null ? [] : demoTasks} requirements={realDocs !== null ? [] : demoRequirements} />}
          {view === 'documents' && (
            <DocumentsView
              documents={documents}
              onToast={showToast}
            />
          )}
          {view === 'knowledge' && (
            <KnowledgeView items={knowledge} onDecision={handleKnowledgeDecision} />
          )}
          {view === 'reconciliation' && (
            <ReconciliationView rows={reconRows} onImport={handleImportReconciliation} />
          )}
          {view === 'settings' && (
            <SettingsView
              selectedFolder={selectedFolder}
              folderSummary={folderSummary}
              onSelectFolder={handleSelectFolder}
            />
          )}
        </section>
      </main>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
