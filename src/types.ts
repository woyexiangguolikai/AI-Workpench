export type ViewId =
  | 'today'
  | 'inbox'
  | 'projects'
  | 'tasks'
  | 'documents'
  | 'knowledge'
  | 'reconciliation'
  | 'settings';

export type Priority = '紧急' | '高' | '中' | '低';

export type Status = '待开始' | '执行中' | '待审核' | '已完成';

export interface Project {
  id: string;
  name: string;
  status: string;
  source: string;
  owner: string;
  summary: string;
  ddl: string;
  folder: string;
  documents: string[];
  openTasks: number;
  risk: string;
}

export interface Requirement {
  id: string;
  projectId: string;
  title: string;
  type: string;
  owner: string;
  priority: Priority;
  planStart: string;
  planEnd: string;
  status: Status;
  description: string;
}

export interface Task {
  id: string;
  requirementId: string;
  title: string;
  assignee: string;
  planStart: string;
  planEnd: string;
  status: Status;
  dependsOn: string[];
}

export interface InboxItem {
  id: string;
  source: string;
  text: string;
  receivedAt: string;
  category: string;
  confidence: number;
  status: '待处理' | '已识别' | '已归档';
}

export interface WorkCard {
  id: string;
  title: string;
  summary: string;
  project: string;
  owner: string;
  priority: Priority;
  dueDate: string;
  todos: string[];
  risks: string[];
  questions: string[];
}

export interface KnowledgeCandidate {
  id: string;
  title: string;
  category: string;
  confidence: number;
  source: string;
  status: '待审核' | '已采纳' | '已忽略';
}

export interface DocumentDraft {
  id: string;
  project: string;
  type: 'Word' | 'Excel' | 'PPT';
  name: string;
  status: '待生成' | '已生成' | '已确认';
  path: string;
  updatedAt: string;
}

export interface ReconciliationRow {
  date: string;
  systemAmount: number;
  providerAmount: number;
  difference: number;
  status: '一致' | '差异';
}

export interface DirectorySummary {
  folder: string;
  fileCount: number;
  notes: number;
  documents: number;
  spreadsheets: number;
  pdfs: number;
  images: number;
  other: number;
  sampleFiles: string[];
}

export interface GanttItem {
  taskId: string;
  title: string;
  start: string;
  end: string;
  progress: number;
  color: string;
}
