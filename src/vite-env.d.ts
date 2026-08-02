import type { DirectorySummary } from './types';

/// <reference types="vite/client" />

interface DesktopBridge {
  // Dialog
  selectDirectory: () => Promise<string | null>;
  getAppInfo: () => Promise<{ name: string; version: string; dbPath: string; allowedDirs: string[] }>;

  // Workspace
  addAllowedDir: (dirPath: string) => Promise<{ allowedDirs: string[] }>;
  getAllowedDirs: () => Promise<string[]>;

  // Directory summary
  directory: {
    scan: (dirPath: string) => Promise<DirectorySummary>;
  };

  // Projects (类型化服务接口)
  projects: {
    list: () => Promise<ProjectRecord[]>;
    get: (id: string) => Promise<ProjectRecord | null>;
    create: (project: Omit<ProjectRecord, 'created_at' | 'updated_at'>) => Promise<{ id: string }>;
    update: (id: string, updates: Partial<Pick<ProjectRecord, 'name' | 'status' | 'source' | 'owner' | 'summary' | 'ddl' | 'folder' | 'risk'>>) => Promise<{ updated: boolean }>;
  };

  // Requirements
  requirements: {
    listByProject: (projectId: string) => Promise<RequirementRecord[]>;
    create: (req: Omit<RequirementRecord, 'created_at' | 'updated_at'>) => Promise<{ id: string }>;
  };

  // Tasks
  tasks: {
    listByRequirement: (requirementId: string) => Promise<TaskRecord[]>;
    create: (task: Omit<TaskRecord, 'created_at' | 'updated_at'>) => Promise<{ id: string }>;
  };

  // Inbox
  inbox: {
    list: () => Promise<InboxRecord[]>;
    create: (item: Omit<InboxRecord, 'created_at'>) => Promise<{ id: string }>;
  };

  // Knowledge
  knowledge: {
    list: () => Promise<KnowledgeRecord[]>;
    create: (item: Omit<KnowledgeRecord, 'created_at' | 'updated_at'>) => Promise<{ id: string }>;
    updateStatus: (id: string, status: '待审核' | '已采纳' | '已忽略') => Promise<{ updated: boolean }>;
  };

  // Vault (含路径校验)
  vault: {
    listNotes: (vaultPath: string) => Promise<NoteSummary[]>;
    readNote: (filePath: string) => Promise<NoteContent>;
    writeNote: (filePath: string, content: string, frontmatter?: Record<string, unknown>) => Promise<{ path: string; written: boolean }>;
  };

  // File Parser (含路径校验)
  file: {
    getInfo: (filePath: string) => Promise<FileInfo>;
    parse: (filePath: string) => Promise<ParsedResult>;
  };
}

/** 数据库记录类型 */
interface ProjectRecord {
  id: string; name: string; status: string; source: string;
  owner: string; summary: string; ddl: string; folder: string; risk: string;
  created_at: string; updated_at: string;
}

interface RequirementRecord {
  id: string; project_id: string; title: string; type: string;
  owner: string; priority: string; plan_start: string; plan_end: string;
  status: string; description: string;
  created_at: string; updated_at: string;
}

interface TaskRecord {
  id: string; requirement_id: string; title: string;
  assignee: string; plan_start: string; plan_end: string; status: string;
  created_at: string; updated_at: string;
}

interface InboxRecord {
  id: string; source: string; text: string; received_at: string;
  category: string; confidence: number; status: string;
  created_at: string;
}

interface KnowledgeRecord {
  id: string; title: string; category: string; confidence: number;
  source: string; status: string;
  created_at: string; updated_at: string;
}

interface NoteSummary {
  name: string; path: string; modifiedAt: string; title: string;
}

interface NoteContent {
  frontmatter: Record<string, unknown>;
  content: string;
  path: string;
}

interface FileInfo {
  path: string;
  type: 'word' | 'excel' | 'pdf' | 'image' | 'text' | 'unknown';
  name: string; size: number; extension: string;
}

interface ParsedResult {
  text: string;
  type: string;
  pages?: number;
}

declare global {
  interface Window {
    desktop?: DesktopBridge;
  }
}

export {};
