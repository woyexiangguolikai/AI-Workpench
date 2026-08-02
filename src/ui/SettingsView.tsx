import { Cloud, FolderOpen } from 'lucide-react';

interface SettingsViewProps {
  selectedFolder: string;
  onSelectFolder: () => void;
}

export function SettingsView({ selectedFolder, onSelectFolder }: SettingsViewProps) {
  return (
    <div className="view-stack settings-grid">
      <section className="panel">
        <div className="panel-header">
          <h2>数据与模型</h2>
        </div>
        <div className="setting-row">
          <span>DeepSeek API</span>
          <strong>已配置</strong>
          <small>Key 保存在 Windows 凭据管理器，不写入 Vault。</small>
        </div>
        <div className="setting-row">
          <span>Obsidian Vault</span>
          <strong>D:\AI-Workpench-Vault</strong>
          <small>工作台与 Obsidian 双向实时同步。</small>
        </div>
        <div className="setting-row">
          <span>资料目录</span>
          <strong>{selectedFolder}</strong>
          <small>只读取你明确指定的目录，不静默扫描全盘。</small>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>云端数据提示</h2>
        </div>
        <div className="cloud-notice">
          <Cloud size={22} />
          <p>处理资料时数据将发送至 DeepSeek 云端。调用记录只保留时间、模型、文件范围和任务类型。</p>
          <button className="secondary-button" type="button" onClick={onSelectFolder}>
            <FolderOpen size={16} />
            重新选择目录
          </button>
        </div>
      </section>
    </div>
  );
}
