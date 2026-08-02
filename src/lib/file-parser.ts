/**
 * 文件解析基础模块
 *
 * 提供 Office（Word/Excel）和 PDF 文件的文本提取能力。
 * 此模块仅在 Electron 主进程中使用（需要 Node.js 文件系统访问）。
 *
 * 注意：不解析任何用户文件内容到云端，解析结果仅存储在本地数据库。
 */

/** 支持的文件类型 */
export type FileType = 'word' | 'excel' | 'pdf' | 'image' | 'text' | 'unknown';

/** 文件信息 */
export interface FileInfo {
  /** 文件路径 */
  path: string;
  /** 文件类型 */
  type: FileType;
  /** 文件名 */
  name: string;
  /** 文件大小（字节） */
  size: number;
  /** 扩展名 */
  extension: string;
}

/** 解析后的文档内容 */
export interface ParsedDocument {
  /** 文件信息 */
  file: FileInfo;
  /** 提取的纯文本内容 */
  text: string;
  /** 解析时间戳 */
  parsedAt: string;
}

/**
 * 根据文件扩展名检测文件类型。
 *
 * @param filePath - 文件路径
 * @returns 检测到的文件类型
 */
export function detectFileType(filePath: string): FileType {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';

  switch (ext) {
    case 'docx':
    case 'doc':
      return 'word';
    case 'xlsx':
    case 'xls':
    case 'csv':
      return 'excel';
    case 'pdf':
      return 'pdf';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'bmp':
    case 'webp':
      return 'image';
    case 'txt':
    case 'md':
    case 'markdown':
      return 'text';
    default:
      return 'unknown';
  }
}

/**
 * 从文件路径获取文件信息。
 *
 * @param filePath - 文件路径
 * @param size - 文件大小（可选，如果不提供则不设置）
 */
export function getFileInfo(filePath: string, size = 0): FileInfo {
  const parts = filePath.replace(/\\/g, '/').split('/');
  const name = parts[parts.length - 1] ?? filePath;
  const extension = name.includes('.') ? (name.split('.').pop() ?? '') : '';

  return {
    path: filePath,
    type: detectFileType(filePath),
    name,
    size,
    extension,
  };
}

/**
 * 解析 Word (.docx) 文件为纯文本。
 *
 * 使用 mammoth 库提取文本内容。
 * 仅在 Electron 主进程调用（需要 fs 访问）。
 *
 * @param filePath - .docx 文件路径
 * @returns 解析后的文档内容
 */
export async function parseWordDocx(filePath: string): Promise<ParsedDocument> {
  // 动态 require 以避免 Vite 打包问题
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth: typeof import('mammoth') = require('mammoth');
  const fs: typeof import('fs') = require('fs');

  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });

  return {
    file: getFileInfo(filePath, buffer.length),
    text: result.value,
    parsedAt: new Date().toISOString(),
  };
}

/**
 * 解析 Excel (.xlsx/.xls) 文件为结构化文本。
 *
 * 使用 xlsx (SheetJS) 库提取所有工作表内容。
 * 仅在 Electron 主进程调用（需要 fs 访问）。
 *
 * @param filePath - Excel 文件路径
 * @returns 解析后的文档内容（以制表符分隔的表格文本）
 */
export async function parseExcelXlsx(filePath: string): Promise<ParsedDocument> {
  // 动态 require 以避免 Vite 打包问题
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX: typeof import('xlsx') = require('xlsx');
  const fs: typeof import('fs') = require('fs');

  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const texts: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const csv = XLSX.utils.sheet_to_csv(sheet, { FS: '\t' });
    texts.push(`# ${sheetName}\n${csv}`);
  }

  return {
    file: getFileInfo(filePath, buffer.length),
    text: texts.join('\n\n'),
    parsedAt: new Date().toISOString(),
  };
}

/**
 * 解析 PDF 文件为纯文本。
 *
 * 使用 pdf-parse 库提取文本内容。
 * 仅在 Electron 主进程调用（需要 fs 访问）。
 *
 * @param filePath - PDF 文件路径
 * @returns 解析后的文档内容
 */
export async function parsePdf(filePath: string): Promise<ParsedDocument> {
  // 动态 require 以避免 Vite 打包问题
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse: (buffer: Buffer) => Promise<{ text: string; numpages: number }> =
    require('pdf-parse');
  const fs: typeof import('fs') = require('fs');

  const buffer = fs.readFileSync(filePath);
  const result = await pdfParse(buffer);

  return {
    file: getFileInfo(filePath, buffer.length),
    text: result.text,
    parsedAt: new Date().toISOString(),
  };
}

/**
 * 根据文件类型自动选择合适的解析器。
 *
 * @param filePath - 文件路径
 * @returns 解析后的文档内容
 * @throws 当文件类型不支持时抛出错误
 */
export async function parseFile(filePath: string): Promise<ParsedDocument> {
  const type = detectFileType(filePath);

  switch (type) {
    case 'word':
      return parseWordDocx(filePath);
    case 'excel':
      return parseExcelXlsx(filePath);
    case 'pdf':
      return parsePdf(filePath);
    default:
      throw new Error(`不支持的文件类型: ${type} (${filePath})`);
  }
}
