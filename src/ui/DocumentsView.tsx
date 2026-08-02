import { FileText } from 'lucide-react';
import type { DocumentDraft } from '../types';

interface DocumentsViewProps {
  documents: DocumentDraft[];
  onToast: (message: string) => void;
}

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
        {documents.length === 0 ? (
          <div className="empty-state">
            <FileText size={22} />
            <span>选择一个包含文件的目录，Word/Excel/PDF 等文档将自动出现在这里。</span>
          </div>
        ) : (
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
        )}
      </section>
    </div>
  );
}
