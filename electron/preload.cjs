const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  // Dialog
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  getAppInfo: () => ipcRenderer.invoke('app:getAppInfo'),

  // Workspace / Path validation
  addAllowedDir: (dirPath) => ipcRenderer.invoke('workspace:addAllowedDir', dirPath),
  getAllowedDirs: () => ipcRenderer.invoke('workspace:getAllowedDirs'),

  // Directory summary
  directory: {
    scan: (dirPath) => ipcRenderer.invoke('directory:scan', dirPath),
    listFiles: (dirPath) => ipcRenderer.invoke('directory:listFiles', dirPath),
  },

  // Projects (类型化服务接口，替代原始 SQL)
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    get: (id) => ipcRenderer.invoke('projects:get', id),
    create: (project) => ipcRenderer.invoke('projects:create', project),
    update: (id, updates) => ipcRenderer.invoke('projects:update', id, updates),
  },

  // Requirements
  requirements: {
    listByProject: (projectId) => ipcRenderer.invoke('requirements:listByProject', projectId),
    create: (req) => ipcRenderer.invoke('requirements:create', req),
  },

  // Tasks
  tasks: {
    listByRequirement: (requirementId) => ipcRenderer.invoke('tasks:listByRequirement', requirementId),
    create: (task) => ipcRenderer.invoke('tasks:create', task),
  },

  // Inbox
  inbox: {
    list: () => ipcRenderer.invoke('inbox:list'),
    create: (item) => ipcRenderer.invoke('inbox:create', item),
  },

  // Knowledge
  knowledge: {
    list: () => ipcRenderer.invoke('knowledge:list'),
    create: (item) => ipcRenderer.invoke('knowledge:create', item),
    updateStatus: (id, status) => ipcRenderer.invoke('knowledge:updateStatus', id, status),
  },

  // Obsidian Vault (含路径校验)
  vault: {
    listNotes: (vaultPath) => ipcRenderer.invoke('vault:listNotes', vaultPath),
    readNote: (filePath) => ipcRenderer.invoke('vault:readNote', filePath),
    writeNote: (filePath, content, frontmatter) =>
      ipcRenderer.invoke('vault:writeNote', filePath, content, frontmatter),
  },

  // File Parser (含路径校验)
  file: {
    getInfo: (filePath) => ipcRenderer.invoke('file:getInfo', filePath),
    parse: (filePath) => ipcRenderer.invoke('file:parse', filePath),
  },
});
