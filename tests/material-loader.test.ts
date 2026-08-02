/**
 * material-loader 模块测试
 *
 * 测试纯函数映射：files → documents/projects/inbox/knowledge
 */

import { describe, expect, it } from 'vitest';
import {
  groupFilesBySubdir,
  mapFilesToDocuments,
  mapFilesToInboxItems,
  mapFilesToKnowledgeCandidates,
  mapFilesToProjects,
  type FileEntry,
} from '../src/lib/material-loader';

const sampleFiles: FileEntry[] = [
  { name: '方案.docx', path: '/test/方案.docx', extension: 'docx', size: 1024, modifiedAt: '2026-08-01T10:00:00Z' },
  { name: '数据.xlsx', path: '/test/数据.xlsx', extension: 'xlsx', size: 2048, modifiedAt: '2026-08-02T10:00:00Z' },
  { name: '笔记.md', path: '/test/笔记.md', extension: 'md', size: 512, modifiedAt: '2026-08-03T10:00:00Z' },
  { name: 'photo.jpg', path: '/test/photo.jpg', extension: 'jpg', size: 4096, modifiedAt: '2026-08-04T10:00:00Z' },
  { name: 'readme.txt', path: '/test/readme.txt', extension: 'txt', size: 256, modifiedAt: '2026-08-05T10:00:00Z' },
];

const subdirFiles: FileEntry[] = [
  { name: 'root.md', path: '/test/root.md', extension: 'md', size: 100, modifiedAt: '2026-08-01T10:00:00Z' },
  { name: '方案.docx', path: '/test/projectA/方案.docx', extension: 'docx', size: 1024, modifiedAt: '2026-08-02T10:00:00Z' },
  { name: '数据.xlsx', path: '/test/projectA/数据.xlsx', extension: 'xlsx', size: 2048, modifiedAt: '2026-08-03T10:00:00Z' },
  { name: '说明.pdf', path: '/test/projectB/说明.pdf', extension: 'pdf', size: 512, modifiedAt: '2026-08-04T10:00:00Z' },
];

describe('groupFilesBySubdir', () => {
  it('returns rootFiles only for flat directory', () => {
    const result = groupFilesBySubdir(sampleFiles);
    expect(result.rootFiles.length).toBe(5);
    expect(result.subdirs).toHaveLength(0);
  });

  it('groups files by subdirectory', () => {
    const result = groupFilesBySubdir(subdirFiles);
    expect(result.rootFiles.length).toBe(1);  // root.md
    expect(result.subdirs).toHaveLength(2);
    expect(result.subdirs[0]!.name).toBe('projectA');
    expect(result.subdirs[1]!.name).toBe('projectB');
  });

  it('returns empty for no files', () => {
    const result = groupFilesBySubdir([]);
    expect(result.rootFiles).toHaveLength(0);
    expect(result.subdirs).toHaveLength(0);
  });
});

describe('mapFilesToDocuments', () => {
  it('maps recognized document types only', () => {
    const docs = mapFilesToDocuments(sampleFiles);
    // docx, xlsx, md, txt → 4 documents; jpg excluded
    expect(docs).toHaveLength(4);
    expect(docs[0]!.name).toBe('readme.txt'); // sorted by updatedAt desc
    expect(docs[0]!.type).toBe('Word');
  });

  it('returns empty for no files', () => {
    expect(mapFilesToDocuments([])).toHaveLength(0);
  });

  it('includes project name', () => {
    const docs = mapFilesToDocuments([sampleFiles[0]!], '测试项目');
    expect(docs[0]!.project).toBe('测试项目');
  });
});

describe('mapFilesToProjects', () => {
  it('creates one project per subdirectory', () => {
    const projects = mapFilesToProjects(subdirFiles, '/test');
    expect(projects).toHaveLength(2);
    expect(projects[0]!.name).toBe('projectA');
    expect(projects[1]!.name).toBe('projectB');
  });

  it('creates one project for flat directory', () => {
    const projects = mapFilesToProjects(sampleFiles, '/test');
    expect(projects).toHaveLength(1);
    expect(projects[0]!.name).toBe('test');
  });

  it('returns empty for no files', () => {
    expect(mapFilesToProjects([], '/test')).toHaveLength(0);
  });
});

describe('mapFilesToInboxItems', () => {
  it('creates one inbox item per file', () => {
    const items = mapFilesToInboxItems(sampleFiles);
    expect(items).toHaveLength(5);
    expect(items[0]!.source).toBe('本地文件');
    expect(items[0]!.status).toBe('待处理');
  });

  it('categories by extension', () => {
    const items = mapFilesToInboxItems([sampleFiles[0]!]); // docx
    expect(items[0]!.category).toBe('文档');
  });

  it('returns empty for no files', () => {
    expect(mapFilesToInboxItems([])).toHaveLength(0);
  });
});

describe('mapFilesToKnowledgeCandidates', () => {
  it('creates candidates for document files only', () => {
    const candidates = mapFilesToKnowledgeCandidates(sampleFiles);
    // jpg excluded, only docx/xlsx/md/txt
    expect(candidates.length).toBeGreaterThanOrEqual(3);
    expect(candidates[0]!.status).toBe('待审核');
  });

  it('returns empty for no files', () => {
    expect(mapFilesToKnowledgeCandidates([])).toHaveLength(0);
  });
});
