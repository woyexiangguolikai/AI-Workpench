const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

/* ── SQL.js 数据库（纯 WASM，无原生依赖，与 Electron ABI 无关）───
 *
 * 架构说明：本文件（main.cjs）是 Electron 主进程的 CJS 运行时实现。
 * src/lib/sqlite.ts、obsidian-vault.ts、file-parser.ts 提供 TypeScript 类型契约
 * 和纯函数单元测试。main.cjs 中的等效实现经手动对齐，确保行为一致。
 * 类型化 IPC 服务接口替代了原始 SQL，渲染进程通过 preload.cjs 的类型化
 * API 访问数据，杜绝 SQL 注入风险。
 */
let SQL = null;
let db = null;

/** 允许的操作目录集合（路径校验白名单） */
const allowedDirs = new Set();

/** 允许访问的目录列表（传给渲染进程的副本） */
let allowedDirList = [];

async function initDatabase() {
  if (db) return db;
  try {
    // sql.js 异步初始化（加载 WASM）
    const initSqlJs = require('sql.js');
    SQL = await initSqlJs();

    // 尝试从文件加载已有数据库，否则创建新库
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    db.run('PRAGMA journal_mode = WAL');
    db.run('PRAGMA foreign_keys = ON');
    initializeTables(db);
    return db;
  } catch (err) {
    console.error('Failed to initialize database:', err.message);
    // 即使 DB 失败，也创建内存库让应用能启动
    if (SQL && !db) {
      db = new SQL.Database();
      initializeTables(db);
    }
    return db;
  }
}

function saveDatabase() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to save database:', err.message);
  }
}

function initializeTables(database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT DEFAULT '活跃',
      source TEXT DEFAULT '', owner TEXT DEFAULT '', summary TEXT DEFAULT '',
      ddl TEXT DEFAULT '', folder TEXT DEFAULT '', risk TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS requirements (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, title TEXT NOT NULL,
      type TEXT DEFAULT '', owner TEXT DEFAULT '', priority TEXT DEFAULT '中',
      plan_start TEXT DEFAULT '', plan_end TEXT DEFAULT '', status TEXT DEFAULT '待开始',
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY, requirement_id TEXT NOT NULL, title TEXT NOT NULL,
      assignee TEXT DEFAULT '', plan_start TEXT DEFAULT '', plan_end TEXT DEFAULT '',
      status TEXT DEFAULT '待开始',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (requirement_id) REFERENCES requirements(id)
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS inbox_items (
      id TEXT PRIMARY KEY, source TEXT DEFAULT '', text TEXT NOT NULL,
      received_at TEXT DEFAULT '', category TEXT DEFAULT '',
      confidence REAL DEFAULT 0, status TEXT DEFAULT '待处理',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS knowledge_items (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT DEFAULT '',
      confidence REAL DEFAULT 0, source TEXT DEFAULT '',
      status TEXT DEFAULT '待审核',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

/** 转义 YAML 值中的特殊字符，防止注入 */
function escapeYamlValue(val) {
  const s = String(val);
  // 需要引号的情况：包含 :、#、换行、前导空格、或以特殊字符开头
  if (/[:#\n\r]/.test(s) || /^\s/.test(s) || /^[!&*?|>{}\[\]%@`]/.test(s)) {
    return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';
  }
  return s;
}

/** 自动保存定时器 */
let autoSaveInterval = null;
function startAutoSave() {
  if (autoSaveInterval) return;
  autoSaveInterval = setInterval(() => {
    saveDatabase();
  }, 30000); // 每 30 秒自动保存
}
function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
}

/* ── Window ── */
const DB_PATH = path.join(app.getPath('userData'), 'ai-workpench.sqlite');

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#f4f5f7',
    title: 'AI-Workpench',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

/* ── IPC: Dialog ── */
ipcMain.handle('dialog:selectDirectory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title: '选择工作目录',
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('app:getAppInfo', () => ({
  name: 'AI-Workpench',
  version: app.getVersion(),
  dbPath: DB_PATH,
  allowedDirs: allowedDirList,
}));

/* ── IPC: 路径校验 ── */
function isPathAllowed(targetPath) {
  // ⚠️ 生产环境前务必移除空白名单允许任意路径的策略
  // 可通过 workspace:addAllowedDir 在启动时注册允许目录
  if (allowedDirs.size === 0) return true;
  const normalized = path.resolve(targetPath);
  for (const dir of allowedDirs) {
    const normalizedDir = path.resolve(dir);
    if (normalized.startsWith(normalizedDir + path.sep) || normalized === normalizedDir) {
      return true;
    }
  }
  return false;
}

ipcMain.handle('workspace:addAllowedDir', async (_event, dirPath) => {
  if (!dirPath || !fs.existsSync(dirPath)) {
    throw new Error('目录不存在: ' + dirPath);
  }
  const resolved = path.resolve(dirPath);
  allowedDirs.add(resolved);
  allowedDirList = Array.from(allowedDirs);
  return { allowedDirs: allowedDirList };
});

ipcMain.handle('workspace:getAllowedDirs', async () => {
  return allowedDirList;
});

/* ── IPC: 类型化数据服务（替代原始 SQL IPC）─── */

// Projects
ipcMain.handle('projects:list', async () => {
  if (!db) throw new Error('数据库未初始化');
  const stmt = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC');
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
});

ipcMain.handle('projects:get', async (_event, id) => {
  if (!db) throw new Error('数据库未初始化');
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  stmt.bind([id]);
  const result = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return result;
});

ipcMain.handle('projects:create', async (_event, project) => {
  if (!db) throw new Error('数据库未初始化');
  const id = project.id || `P-${Date.now()}`;
  db.run(
    `INSERT INTO projects (id, name, status, source, owner, summary, ddl, folder, risk)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, project.name, project.status || '活跃', project.source || '',
     project.owner || '', project.summary || '', project.ddl || '',
     project.folder || '', project.risk || ''],
  );
  saveDatabase();
  return { id };
});

ipcMain.handle('projects:update', async (_event, id, updates) => {
  if (!db) throw new Error('数据库未初始化');
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(updates)) {
    if (['name','status','source','owner','summary','ddl','folder','risk'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  if (fields.length === 0) throw new Error('无可更新的白名单字段');
  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.run(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
  return { updated: true };
});

// Requirements
ipcMain.handle('requirements:listByProject', async (_event, projectId) => {
  if (!db) throw new Error('数据库未初始化');
  const stmt = db.prepare('SELECT * FROM requirements WHERE project_id = ? ORDER BY priority DESC');
  stmt.bind([projectId]);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
});

ipcMain.handle('requirements:create', async (_event, req) => {
  if (!db) throw new Error('数据库未初始化');
  const id = req.id || `R-${Date.now()}`;
  db.run(
    `INSERT INTO requirements (id, project_id, title, type, owner, priority, plan_start, plan_end, status, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, req.projectId, req.title, req.type || '', req.owner || '',
     req.priority || '中', req.planStart || '', req.planEnd || '',
     req.status || '待开始', req.description || ''],
  );
  saveDatabase();
  return { id };
});

// Tasks
ipcMain.handle('tasks:listByRequirement', async (_event, requirementId) => {
  if (!db) throw new Error('数据库未初始化');
  const stmt = db.prepare('SELECT * FROM tasks WHERE requirement_id = ? ORDER BY plan_start');
  stmt.bind([requirementId]);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
});

ipcMain.handle('tasks:create', async (_event, task) => {
  if (!db) throw new Error('数据库未初始化');
  const id = task.id || `T-${Date.now()}`;
  db.run(
    `INSERT INTO tasks (id, requirement_id, title, assignee, plan_start, plan_end, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, task.requirementId, task.title, task.assignee || '',
     task.planStart || '', task.planEnd || '', task.status || '待开始'],
  );
  saveDatabase();
  return { id };
});

// Inbox
ipcMain.handle('inbox:list', async () => {
  if (!db) throw new Error('数据库未初始化');
  const stmt = db.prepare('SELECT * FROM inbox_items ORDER BY created_at DESC');
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
});

ipcMain.handle('inbox:create', async (_event, item) => {
  if (!db) throw new Error('数据库未初始化');
  const id = item.id || `I-${Date.now()}`;
  db.run(
    `INSERT INTO inbox_items (id, source, text, received_at, category, confidence, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, item.source || '', item.text, item.receivedAt || '',
     item.category || '', item.confidence || 0, item.status || '待处理'],
  );
  saveDatabase();
  return { id };
});

// Knowledge
ipcMain.handle('knowledge:list', async () => {
  if (!db) throw new Error('数据库未初始化');
  const stmt = db.prepare('SELECT * FROM knowledge_items ORDER BY updated_at DESC');
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
});

ipcMain.handle('knowledge:create', async (_event, item) => {
  if (!db) throw new Error('数据库未初始化');
  const id = item.id || `K-${Date.now()}`;
  db.run(
    `INSERT INTO knowledge_items (id, title, category, confidence, source, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, item.title, item.category || '', item.confidence || 0,
     item.source || '', item.status || '待审核'],
  );
  saveDatabase();
  return { id };
});

ipcMain.handle('knowledge:updateStatus', async (_event, id, status) => {
  if (!db) throw new Error('数据库未初始化');
  if (!['待审核', '已采纳', '已忽略'].includes(status)) {
    throw new Error('无效的状态值: ' + status);
  }
  db.run("UPDATE knowledge_items SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, id]);
  saveDatabase();
  return { updated: true };
});

/* ── IPC: Obsidian Vault（含路径校验）─── */
ipcMain.handle('vault:listNotes', async (_event, vaultPath) => {
  if (!vaultPath || typeof vaultPath !== 'string') {
    throw new Error('Vault 路径无效');
  }
  if (!isPathAllowed(vaultPath)) {
    throw new Error('路径不在允许的目录范围内: ' + vaultPath);
  }
  if (!fs.existsSync(vaultPath)) {
    throw new Error('Vault 路径不存在');
  }
  const entries = fs.readdirSync(vaultPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => {
      const fullPath = path.join(vaultPath, entry.name);
      const stat = fs.statSync(fullPath);
      return {
        name: entry.name,
        path: fullPath,
        modifiedAt: stat.mtime.toISOString(),
        title: entry.name.replace(/\.md$/, ''),
      };
    });
});

ipcMain.handle('vault:readNote', async (_event, filePath) => {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('文件路径无效');
  }
  if (!isPathAllowed(filePath)) {
    throw new Error('路径不在允许的目录范围内: ' + filePath);
  }
  if (!fs.existsSync(filePath)) {
    throw new Error('文件不存在: ' + filePath);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const frontmatter = {};
  let content = raw;
  const trimmed = raw.trimStart();
  if (trimmed.startsWith('---')) {
    const afterFirst = trimmed.slice(3);
    const endIndex = afterFirst.indexOf('\n---');
    if (endIndex !== -1) {
      const fmRaw = afterFirst.slice(0, endIndex);
      content = afterFirst.slice(endIndex + 4).trimStart();
      // 简易 YAML 解析（支持键值对和多行列表）
      let currentKey = null;
      let currentArray = [];
      for (const line of fmRaw.split('\n')) {
        const t = line.trim();
        if (!t) continue;
        // 列表项（以 - 开头）
        if (t.startsWith('- ') && currentKey !== null) {
          let item = t.slice(2).trim();
          item = item.replace(/^["']|["']$/g, '');
          currentArray.push(item);
          continue;
        }
        // 保存之前收集的数组/空键
        if (currentKey !== null) {
          if (currentArray.length > 0) {
            frontmatter[currentKey] = currentArray;
          }
          // 空值键也清除，避免静默丢弃后续键值对
          currentKey = null;
          currentArray = [];
        }
        // 键值对
        if (!t.includes(':')) continue;
        const ci = t.indexOf(':');
        const key = t.slice(0, ci).trim();
        const val = t.slice(ci + 1).trim();
        if (val === '') {
          currentKey = key;
          currentArray = [];
          continue;
        }
        if (val === 'true') frontmatter[key] = true;
        else if (val === 'false') frontmatter[key] = false;
        else if (/^-?\d+(\.\d+)?$/.test(val)) frontmatter[key] = Number(val);
        else frontmatter[key] = val.replace(/^["']|["']$/g, '');
      }
      // 保存最后一个数组
      if (currentKey !== null && currentArray.length > 0) {
        frontmatter[currentKey] = currentArray;
      }
    }
  }
  return { frontmatter, content, path: filePath };
});

ipcMain.handle('vault:writeNote', async (_event, filePath, content, frontmatter = {}) => {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('文件路径无效');
  }
  if (!isPathAllowed(filePath)) {
    throw new Error('路径不在允许的目录范围内: ' + filePath);
  }
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  let fmBlock = '';
  const keys = Object.keys(frontmatter);
  if (keys.length > 0) {
    fmBlock = '---\n';
    for (const key of keys) {
      const val = frontmatter[key];
      if (Array.isArray(val)) {
        fmBlock += `${key}:\n`;
        for (const item of val) {
          fmBlock += `  - ${escapeYamlValue(String(item))}\n`;
        }
      } else {
        // 转义包含特殊字符的值（YAML 安全）
        const safeVal = escapeYamlValue(val);
        fmBlock += `${key}: ${safeVal}\n`;
      }
    }
    fmBlock += '---\n\n';
  }
  fs.writeFileSync(filePath, fmBlock + content, 'utf-8');
  return { path: filePath, written: true };
});

/* ── IPC: File Parser（含路径校验）─── */
ipcMain.handle('file:getInfo', async (_event, filePath) => {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('文件路径无效');
  }
  if (!isPathAllowed(filePath)) {
    throw new Error('路径不在允许的目录范围内: ' + filePath);
  }
  if (!fs.existsSync(filePath)) {
    throw new Error('文件不存在: ' + filePath);
  }
  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  const typeMap = {
    docx: 'word', doc: 'word',
    xlsx: 'excel', xls: 'excel', csv: 'excel',
    pdf: 'pdf',
    png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', bmp: 'image', webp: 'image',
    txt: 'text', md: 'text', markdown: 'text',
  };
  return {
    path: filePath,
    type: typeMap[ext] || 'unknown',
    name: path.basename(filePath),
    size: stat.size,
    extension: ext,
  };
});

ipcMain.handle('file:parse', async (_event, filePath) => {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('文件路径无效');
  }
  if (!isPathAllowed(filePath)) {
    throw new Error('路径不在允许的目录范围内: ' + filePath);
  }
  if (!fs.existsSync(filePath)) {
    throw new Error('文件不存在: ' + filePath);
  }
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.docx') {
    const mammoth = require('mammoth');
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value, type: 'word' };
  }

  if (ext === '.xlsx' || ext === '.xls') {
    const XLSX = require('xlsx');
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const texts = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      texts.push(`# ${sheetName}\n${XLSX.utils.sheet_to_csv(sheet, { FS: '\t' })}`);
    }
    return { text: texts.join('\n\n'), type: 'excel' };
  }

  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const result = await pdfParse(buffer);
    return { text: result.text, type: 'pdf', pages: result.numpages };
  }

  throw new Error('不支持的文件类型: ' + ext);
});

/* ── App lifecycle ── */
app.whenReady().then(async () => {
  try {
    await initDatabase();
    startAutoSave();
    console.log('[main] Database initialized at', DB_PATH);
  } catch (err) {
    console.error('[main] Database init failed, continuing without DB:', err.message);
  }
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  stopAutoSave();
  saveDatabase();
  if (db) {
    try { db.close(); } catch (_) { /* ignore */ }
    db = null;
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopAutoSave();
  saveDatabase();
});
