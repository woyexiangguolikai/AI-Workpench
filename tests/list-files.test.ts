/**
 * 主进程 listFiles 目录遍历测试
 *
 * 使用临时文件系统模拟真实目录结构，测试递归遍历、
 * 隐藏文件忽略、扩展名提取、stat 信息收集。
 *
 * 注意：此测试使用 Node.js fs 模块（vitest node 环境），
 * 模拟的是 electron/main.cjs 中 listFiles 的行为模式。
 */

import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

/**
 * listFiles 的纯逻辑提取版（与 main.cjs 等效）。
 * 递归遍历目录，返回文件条目列表。
 */
async function listFiles(dirPath: string): Promise<
  Array<{ name: string; path: string; extension: string; size: number; modifiedAt: string }>
> {
  if (!fs.existsSync(dirPath)) {
    throw new Error('目录不存在: ' + dirPath);
  }

  const files: Array<{ name: string; path: string; extension: string; size: number; modifiedAt: string }> = [];
  const maxFiles = 5000;

  async function walk(current: string) {
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (files.length >= maxFiles) return;
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.git') {
        continue;
      }

      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;

      let stat: fs.Stats;
      try {
        stat = await fs.promises.stat(fullPath);
      } catch {
        continue;
      }

      files.push({
        name: entry.name,
        path: fullPath,
        extension: path.extname(entry.name).toLowerCase().replace('.', ''),
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      });
    }
  }

  await walk(dirPath);
  return files;
}

describe('listFiles (main process)', () => {
  let tmpDir: string;

  // 在每个测试前创建临时目录结构
  function setupTmpDir() {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiwp-test-'));
    // 创建文件
    fs.writeFileSync(path.join(tmpDir, '方案.docx'), 'docx content');
    fs.writeFileSync(path.join(tmpDir, '数据.xlsx'), 'xlsx content');
    fs.writeFileSync(path.join(tmpDir, '笔记.md'), '# note');
    // 创建子目录
    const subDir = path.join(tmpDir, 'projectA');
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(subDir, '说明.pdf'), 'pdf content');
    fs.writeFileSync(path.join(subDir, '图片.png'), 'img');
    // 创建隐藏文件
    fs.writeFileSync(path.join(tmpDir, '.gitkeep'), 'hidden');
    // 创建 node_modules 目录（应被忽略）
    const nmDir = path.join(tmpDir, 'node_modules');
    fs.mkdirSync(nmDir);
    fs.writeFileSync(path.join(nmDir, 'package.json'), '{}');
    return tmpDir;
  }

  function cleanupTmpDir() {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  it('lists all files in a flat directory', async () => {
    setupTmpDir();
    try {
      const files = await listFiles(tmpDir);
      // 忽略隐藏文件和 node_modules
      const visibleNames = files.map((f) => f.name);
      expect(visibleNames).toContain('方案.docx');
      expect(visibleNames).toContain('数据.xlsx');
      expect(visibleNames).toContain('笔记.md');
      expect(visibleNames).not.toContain('.gitkeep');
      expect(visibleNames).not.toContain('package.json');
    } finally {
      cleanupTmpDir();
    }
  });

  it('lists files in subdirectories', async () => {
    setupTmpDir();
    try {
      const files = await listFiles(tmpDir);
      const subFiles = files.filter((f) => f.name === '说明.pdf' || f.name === '图片.png');
      expect(subFiles).toHaveLength(2);
    } finally {
      cleanupTmpDir();
    }
  });

  it('ignores hidden files and node_modules', async () => {
    setupTmpDir();
    try {
      const files = await listFiles(tmpDir);
      // 至少应该有可见文件
      expect(files.length).toBeGreaterThanOrEqual(5);
      // 没有隐藏文件
      for (const f of files) {
        expect(f.name).not.toMatch(/^\./);
        expect(f.path).not.toContain('node_modules');
      }
    } finally {
      cleanupTmpDir();
    }
  });

  it('extracts extension correctly', async () => {
    setupTmpDir();
    try {
      const files = await listFiles(tmpDir);
      const docxFile = files.find((f) => f.name === '方案.docx');
      expect(docxFile).toBeDefined();
      expect(docxFile!.extension).toBe('docx');

      const mdFile = files.find((f) => f.name === '笔记.md');
      expect(mdFile).toBeDefined();
      expect(mdFile!.extension).toBe('md');
    } finally {
      cleanupTmpDir();
    }
  });

  it('returns size greater than 0 for non-empty files', async () => {
    setupTmpDir();
    try {
      const files = await listFiles(tmpDir);
      for (const f of files) {
        expect(f.size).toBeGreaterThan(0);
      }
    } finally {
      cleanupTmpDir();
    }
  });

  it('returns modifiedAt as ISO string', async () => {
    setupTmpDir();
    try {
      const files = await listFiles(tmpDir);
      const f = files[0]!;
      expect(f.modifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    } finally {
      cleanupTmpDir();
    }
  });

  it('returns empty array for empty directory', async () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiwp-empty-'));
    try {
      const files = await listFiles(emptyDir);
      expect(files).toHaveLength(0);
    } finally {
      fs.rmdirSync(emptyDir);
    }
  });

  it('throws for non-existent directory', async () => {
    await expect(listFiles('/nonexistent/path/xyz')).rejects.toThrow('目录不存在');
  });
});
