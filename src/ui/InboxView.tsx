import { ClipboardList, Inbox, Sparkles } from 'lucide-react';
import type { InboxItem, WorkCard } from '../types';

interface InboxViewProps {
  inboxText: string;
  setInboxText: (value: string) => void;
  onRecognize: () => void;
  workCards: WorkCard[];
  inboxItems: InboxItem[];
}

export function InboxView({
  inboxText,
  setInboxText,
  onRecognize,
  workCards,
  inboxItems,
}: InboxViewProps) {
  return (
    <div className="view-stack">
      <section className="composer panel">
        <label htmlFor="inbox-input">粘贴微信、飞书或一句话需求</label>
        <textarea
          id="inbox-input"
          value={inboxText}
          onChange={(event) => setInboxText(event.target.value)}
          placeholder="例如：北城医院食堂需要增加营养餐台账，按科室汇总，月底上线。"
          rows={4}
        />
        <div className="composer-actions">
          <span>支持拖入 Word / Excel / PPT / PDF / 图片</span>
          <button className="primary-button" type="button" onClick={onRecognize}>
            <Sparkles size={16} />
            AI 识别并生成工作卡
          </button>
        </div>
      </section>

      <div className="two-column inbox-columns">
        <section className="panel">
          <div className="panel-header">
            <h2>收件箱</h2>
            <span className="pill">{inboxItems.length}</span>
          </div>
          <div className="list-stack">
            {inboxItems.length === 0 ? (
              <div className="empty-state">
                <Inbox size={22} />
                <span>选择一个包含文件的目录，本地材料将自动显示在这里。</span>
              </div>
            ) : (
              inboxItems.map((item) => (
                <div className="inbox-item" key={item.id}>
                  <div className="inbox-item-top">
                    <span className="source-badge">{item.source}</span>
                    <time>{item.receivedAt}</time>
                  </div>
                  <p>{item.text}</p>
                  <div className="inbox-meta">
                    <span>{item.category}</span>
                    <span>置信度 {Math.round(item.confidence * 100)}%</span>
                    <span className="status-ok">{item.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>需求工作卡</h2>
            <span className="pill">{workCards.length}</span>
          </div>
          <div className="list-stack">
            {workCards.length === 0 && (
              <div className="empty-state">
                <ClipboardList size={22} />
                <span>识别后会出现结构化的需求工作卡。</span>
              </div>
            )}
            {workCards.map((card) => (
              <article className="work-card" key={card.id}>
                <div>
                  <strong>{card.title}</strong>
                  <span>{card.project} · {card.owner}</span>
                </div>
                <div className="tag-row">
                  <span>{card.priority}</span>
                  <span>{card.dueDate}</span>
                </div>
                <p>{card.summary}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
