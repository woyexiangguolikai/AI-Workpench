/**
 * 文件解析模块测试
 *
 * 测试文件类型检测和 FileInfo 构建（纯函数，不依赖 Node.js）。
 */

import { describe, expect, it } from 'vitest';
import { detectFileType, getFileInfo } from '../src/lib/file-parser';

describe('detectFileType', () => {
  it('detects Word documents', () => {
    expect(detectFileType('test.docx')).toBe('word');
    expect(detectFileType('test.doc')).toBe('word');
  });

  it('detects Excel spreadsheets', () => {
    expect(detectFileType('data.xlsx')).toBe('excel');
    expect(detectFileType('data.xls')).toBe('excel');
    expect(detectFileType('data.csv')).toBe('excel');
  });

  it('detects PDF files', () => {
    expect(detectFileType('report.pdf')).toBe('pdf');
  });

  it('detects image files', () => {
    expect(detectFileType('photo.png')).toBe('image');
    expect(detectFileType('photo.jpg')).toBe('image');
    expect(detectFileType('photo.jpeg')).toBe('image');
    expect(detectFileType('photo.gif')).toBe('image');
    expect(detectFileType('photo.bmp')).toBe('image');
    expect(detectFileType('photo.webp')).toBe('image');
  });

  it('detects text and markdown files', () => {
    expect(detectFileType('readme.txt')).toBe('text');
    expect(detectFileType('readme.md')).toBe('text');
    expect(detectFileType('readme.markdown')).toBe('text');
  });

  it('returns unknown for unsupported extensions', () => {
    expect(detectFileType('file.xyz')).toBe('unknown');
    expect(detectFileType('file')).toBe('unknown');
    expect(detectFileType('Makefile')).toBe('unknown');
  });

  it('is case-insensitive', () => {
    expect(detectFileType('TEST.PDF')).toBe('pdf');
    expect(detectFileType('TEST.DOCX')).toBe('word');
    expect(detectFileType('TEST.XLSX')).toBe('excel');
  });
});

describe('getFileInfo', () => {
  it('extracts file info from path', () => {
    const info = getFileInfo('/path/to/report.pdf', 1024);

    expect(info.path).toBe('/path/to/report.pdf');
    expect(info.type).toBe('pdf');
    expect(info.name).toBe('report.pdf');
    expect(info.size).toBe(1024);
    expect(info.extension).toBe('pdf');
  });

  it('handles Windows paths', () => {
    const info = getFileInfo('D:\\客户资料\\方案.docx');

    expect(info.name).toBe('方案.docx');
    expect(info.type).toBe('word');
    expect(info.extension).toBe('docx');
  });

  it('handles files without extension', () => {
    const info = getFileInfo('/usr/bin/executable');

    expect(info.name).toBe('executable');
    expect(info.type).toBe('unknown');
    expect(info.extension).toBe('');
  });

  it('defaults size to 0', () => {
    const info = getFileInfo('/path/to/file.txt');

    expect(info.size).toBe(0);
  });
});
