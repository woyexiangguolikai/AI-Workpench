/**
 * 材料加载器 — 将真实文件映射为工作台数据
 *
 * 纯函数模块，不依赖 Electron / Node.js API。
 * 浏览器安全：使用 DJB2 哈希生成稳定 ID，不依赖 Node Buffer。
 * 输入：目录中的文件列表（FileEntry[]）
 * 输出：工作台各模块所需的数据类型
 */

import type { DocumentDraft, InboxItem, KnowledgeCandidate, Project } from '../types';

/** 文件条目（来自 Electron main.cjs directory:listFiles） */
export interface FileEntry {
  name: string;
  path: string;
  extension: string;
  size: number;
  modifiedAt: string;
}

/** 子目录信息 */
export interface SubdirInfo {
  name: string;
  path: string;
  files: FileEntry[];
}

/**
 * 基于输入字符串生成稳定的短哈希 ID（DJB2 算法）。
 * 纯 JS 实现，无需 Node Buffer 或 crypto 模块。
 */
function stableId(prefix: string, input: string, len: number): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `${prefix}-${hex.slice(0, len)}`;
}

/** 将文件按所属子目录分组 */
export function groupFilesBySubdir(files: FileEntry[]): {
  rootFiles: FileEntry[];
  subdirs: SubdirInfo[];
} {
  if (files.length === 0) return { rootFiles: [], subdirs: [] };

  // 找到公共前缀（根目录路径）
  const parts = files[0]!.path.replace(/\\/g, '/').split('/');
  parts.pop(); // 去掉文件名
  const rootDir = parts.join('/');

  const rootFiles: FileEntry[] = [];
  const subdirMap = new Map<string, FileEntry[]>();

  for (const file of files) {
    const rel = file.path.replace(/\\/g, '/');
    // 取根目录之后的路径
    const afterRoot = rel.startsWith(rootDir + '/')
      ? rel.slice(rootDir.length + 1)
      : rel;

    const slashIdx = afterRoot.indexOf('/');
    if (slashIdx === -1) {
      // 直接在根目录下
      rootFiles.push({ ...file, path: rel });
    } else {
      const subdirName = afterRoot.slice(0, slashIdx);
      const existing = subdirMap.get(subdirName) || [];
      existing.push({ ...file, path: rel });
      subdirMap.set(subdirName, existing);
    }
  }

  const subdirs: SubdirInfo[] = [];
  for (const [name, dirFiles] of subdirMap) {
    subdirs.push({
      name,
      path: rootDir + '/' + name,
      files: dirFiles,
    });
  }

  return { rootFiles, subdirs };
}

/**
 * 将文件列表映射为文档草稿列表。
 * 只包含可识别的文档类型（Word/Excel/PPT/PDF/Markdown）。
 */
export function mapFilesToDocuments(
  files: FileEntry[],
  projectName = '当前目录',
): DocumentDraft[] {
  if (files.length === 0) return [];

  const extTypeMap: Record<string, DocumentDraft['type']> = {
    '.docx': 'Word',
    '.doc': 'Word',
    '.xlsx': 'Excel',
    '.xls': 'Excel',
    '.csv': 'Excel',
    '.pptx': 'PPT',
    '.ppt': 'PPT',
    '.pdf': 'Word',
    '.md': 'Word',
    '.markdown': 'Word',
    '.txt': 'Word',
  };

  const docs: DocumentDraft[] = [];

  for (const file of files) {
    const ext = '.' + file.extension.toLowerCase();
    const docType = extTypeMap[ext];
    if (!docType) continue;

    docs.push({
      id: stableId('DOC', file.path, 8),
      project: projectName,
      type: docType,
      name: file.name,
      status: '已生成',
      path: file.path,
      updatedAt: file.modifiedAt.slice(0, 10),
    });
  }

  // 按更新时间倒序
  docs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return docs;
}

/**
 * 将文件列表映射为项目列表。
 * 优先按子目录生成项目（每个子目录一个项目），无子目录则根目录作为一个项目。
 */
export function mapFilesToProjects(
  files: FileEntry[],
  rootDir: string,
): Project[] {
  if (files.length === 0) return [];

  const { rootFiles, subdirs } = groupFilesBySubdir(files);

  const projects: Project[] = [];

  // 有子目录时，每个子目录作为一个项目
  if (subdirs.length > 0) {
    for (const sub of subdirs) {
      const docNames = sub.files
        .filter((f) => {
          const e = f.extension.toLowerCase();
          return ['docx', 'doc', 'xlsx', 'xls', 'csv', 'pptx', 'ppt', 'pdf', 'md', 'markdown', 'txt'].includes(e);
        })
        .map((f) => f.name);

      projects.push({
        id: stableId('PRJ', sub.path, 8),
        name: sub.name,
        status: '活跃',
        source: '本地目录',
        owner: '待分配',
        summary: `${sub.name} 目录，包含 ${sub.files.length} 个文件`,
        ddl: '待确认',
        folder: sub.path,
        documents: docNames.slice(0, 6),
        openTasks: 0,
        risk: '待评估',
      });
    }
  } else if (rootFiles.length > 0) {
    // 无子目录，根目录作为一个项目
    const docNames = rootFiles
      .filter((f) => {
        const e = f.extension.toLowerCase();
        return ['docx', 'doc', 'xlsx', 'xls', 'csv', 'pptx', 'ppt', 'pdf', 'md', 'markdown', 'txt'].includes(e);
      })
      .map((f) => f.name);

    const dirName = rootDir.replace(/\\/g, '/').split('/').pop() || '当前目录';

    projects.push({
      id: stableId('PRJ', rootDir, 8),
      name: dirName,
      status: '活跃',
      source: '本地目录',
      owner: '待分配',
      summary: `${dirName} 目录，包含 ${rootFiles.length} 个文件`,
      ddl: '待确认',
      folder: rootDir,
      documents: docNames.slice(0, 6),
      openTasks: 0,
      risk: '待评估',
    });
  }

  return projects;
}

/**
 * 将文件列表映射为收件箱条目。
 * 每个文件生成一条"本地材料"条目。
 */
export function mapFilesToInboxItems(
  files: FileEntry[],
): InboxItem[] {
  if (files.length === 0) return [];

  const items: InboxItem[] = [];
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  for (const file of files.slice(0, 50)) {
    const ext = file.extension.toLowerCase();
    const categoryMap: Record<string, string> = {
      docx: '文档', doc: '文档',
      xlsx: '表格', xls: '表格', csv: '表格',
      pptx: '演示', ppt: '演示',
      pdf: 'PDF',
      md: '笔记', markdown: '笔记', txt: '文本',
      png: '图片', jpg: '图片', jpeg: '图片', gif: '图片', webp: '图片',
    };

    items.push({
      id: stableId('INB', file.path, 8),
      source: '本地文件',
      text: `[${(ext || '文件').toUpperCase()}] ${file.name}`,
      receivedAt: now,
      category: categoryMap[ext] || '其他',
      confidence: 0.5,
      status: '待处理',
    });
  }

  return items;
}

/**
 * 将文件列表映射为知识候选项。
 * 基于文件名和扩展名生成简单的候选知识条目。
 */
export function mapFilesToKnowledgeCandidates(
  files: FileEntry[],
): KnowledgeCandidate[] {
  if (files.length === 0) return [];

  const candidates: KnowledgeCandidate[] = [];
  const interestingExts = ['docx', 'doc', 'xlsx', 'xls', 'pdf', 'md', 'markdown', 'txt'];

  for (const file of files.slice(0, 30)) {
    if (!interestingExts.includes(file.extension.toLowerCase())) continue;

    const baseName = file.name.replace(/\.[^.]+$/, '');

    candidates.push({
      id: stableId('KN', file.path, 8),
      title: `文件「${baseName}」可能包含可提取的知识`,
      category: '文件分析',
      confidence: 0.3,
      source: file.name,
      status: '待审核',
    });
  }

  return candidates;
}
