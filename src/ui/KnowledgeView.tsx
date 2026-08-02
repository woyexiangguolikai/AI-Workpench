import { Brain, CheckCircle2, XCircle } from 'lucide-react';
import type { KnowledgeCandidate } from '../types';

interface KnowledgeViewProps {
  items: KnowledgeCandidate[];
  onDecision: (id: string, status: '已采纳' | '已忽略') => void;
}

export function KnowledgeView({ items, onDecision }: KnowledgeViewProps) {
  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <h2>候选知识</h2>
          <span className="pill">来源与置信度可见</span>
        </div>
        <div className="knowledge-list">
          {items.length === 0 ? (
            <div className="empty-state">
              <Brain size={22} />
              <span>选择一个包含文档的目录，知识候选项将基于文件名自动生成。</span>
            </div>
          ) : (
            items.map((item) => (
              <article className="knowledge-card" key={item.id}>
                <div className="knowledge-main">
                  <strong>{item.title}</strong>
                  <span>{item.category} · {item.source}</span>
                  <div className="confidence-track">
                    <div style={{ width: `${Math.round(item.confidence * 100)}%` }} />
                  </div>
                  <small>置信度 {Math.round(item.confidence * 100)}%</small>
                </div>
                <div className="knowledge-actions">
                  {item.status === '待审核' ? (
                    <>
                      <button
                        className="accept-button"
                        type="button"
                        onClick={() => onDecision(item.id, '已采纳')}
                      >
                        <CheckCircle2 size={16} />
                        采纳
                      </button>
                      <button
                        className="reject-button"
                        type="button"
                        onClick={() => onDecision(item.id, '已忽略')}
                      >
                        <XCircle size={16} />
                        忽略
                      </button>
                    </>
                  ) : (
                    <span className="status-ok">{item.status}</span>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
