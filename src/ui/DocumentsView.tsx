import { Code2, ExternalLink } from 'lucide-react';
import type { DocumentDraft } from '../types';

interface DocumentsViewProps {
  documents: DocumentDraft[];
  onToast: (message: string) => void;
}

const htmlPrototypes = [
  { id: 'HP001', name: '北城医大·食堂订餐首页原型', project: '北城医科大学食堂平台', url: '#prototype-preview', updatedAt: '2026-08-01' },
  { id: 'HP002', name: '华东园区·收银升级交互原型', project: '华东国企园区收银升级', url: '#prototype-preview', updatedAt: '2026-07-30' },
];

export function DocumentsView({ documents, onToast }: DocumentsViewProps) {
  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <h2>交付文档</h2>
          <button className="primary-button" type="button" onClick={() => onToast('AI 已生成可编辑初稿，请确认后另存')}>
            批量生成初稿
          </button>
        </div>
        <div className="document-grid">
          {documents.map((doc) => (
            <div className="document-card" key={doc.id}>
              <div className="doc-type">{doc.type}</div>
              <strong>{doc.name}</strong>
              <span>{doc.project}</span>
              <span className="path-line">{doc.path}</span>
              <div className="document-actions">
                <span className="status-ok">{doc.status}</span>
                <button type="button" onClick={() => onToast(`已打开 ${doc.name}`)}>
                  用 WPS 打开
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>
            <Code2 size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            HTML 原型预览
          </h2>
          <span className="pill">交互式原型</span>
        </div>
        <p className="proto-desc">
          以下为已生成的可交互 HTML 原型，点击可在浏览器中预览完整交互流程，无需额外工具。
        </p>
        <div className="prototype-grid">
          {htmlPrototypes.map((proto) => (
            <div className="prototype-card" key={proto.id}>
              <div className="proto-icon">
                <Code2 size={20} />
              </div>
              <div className="proto-info">
                <strong>{proto.name}</strong>
                <span>{proto.project} · 更新于 {proto.updatedAt}</span>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={() => onToast(`正在浏览器中打开原型：${proto.name}`)}
              >
                <ExternalLink size={14} />
                预览
              </button>
            </div>
          ))}
        </div>
        <div className="proto-upload">
          <button
            className="secondary-button"
            type="button"
            onClick={() => onToast('请选择 HTML 原型文件夹，AI 将自动识别并建立预览索引')}
          >
            <Code2 size={14} />
            导入 HTML 原型
          </button>
        </div>
      </section>
    </div>
  );
}
