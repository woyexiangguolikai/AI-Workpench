import { AlertTriangle, CheckCircle2, Gauge, ListTodo, Sparkles } from 'lucide-react';
import { tasks } from '../data';
import type { WorkCard } from '../types';
import { MetricCard } from './MetricCard';

interface TodayViewProps {
  workCards: WorkCard[];
  onToast: (message: string) => void;
}

export function TodayView({ workCards, onToast }: TodayViewProps) {
  const urgentCount = tasks.filter((task) => task.status === '待开始').length + workCards.length;
  const dueItems = [
    { title: '北城医科大学：确认支付分账口径', date: '今天 16:00', risk: '高' },
    { title: '华东国企园区：一卡通模块影响评审', date: '明天 10:30', risk: '高' },
    { title: '同济医院：营养餐台账测试用例', date: '08-05', risk: '中' },
  ];

  return (
    <div className="view-stack">
      <div className="metric-grid">
        <MetricCard icon={ListTodo} label="今日待办" value={String(urgentCount)} tone="blue" />
        <MetricCard icon={AlertTriangle} label="风险 DDL" value="2" tone="amber" />
        <MetricCard icon={CheckCircle2} label="待审核" value="3" tone="green" />
        <MetricCard icon={Gauge} label="本周节省估算" value="38%" tone="teal" />
      </div>

      <div className="two-column">
        <section className="panel">
          <div className="panel-header">
            <h2>今天最该做的事</h2>
            <span className="pill">自动生成</span>
          </div>
          <div className="list-stack">
            {dueItems.map((item) => (
              <button
                key={item.title}
                className="due-row"
                type="button"
                onClick={() => onToast('已打开任务详情，等待你确认 DDL')}
              >
                <span className={`risk-dot ${item.risk === '高' ? 'high' : 'mid'}`} />
                <span>{item.title}</span>
                <time>{item.date}</time>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>等待你决策</h2>
            <span className="pill">确认制</span>
          </div>
          <div className="decision-list">
            {workCards.length > 0 ? (
              workCards.slice(0, 3).map((card) => (
                <div className="decision-card" key={card.id}>
                  <strong>{card.title}</strong>
                  <span>{card.project} · {card.dueDate}</span>
                  <button type="button" onClick={() => onToast('需求工作卡已加入正式计划')}>
                    确认排期
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Sparkles size={22} />
                <span>把一句话需求放进收件箱，AI 会先生成建议。</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
