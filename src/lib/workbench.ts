import type { GanttItem, Task, WorkCard } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createWorkCard(input: string, project = '待归属项目'): WorkCard {
  const normalized = input.trim();
  const hasDeadlineHint = /(本周|下周|月底|周[一二三四五六日]|20\d{2}[-/]\d{1,2}[-/]\d{1,2})/.test(
    normalized,
  );
  const hasRiskHint = /(风险|余额|对账|兼容|升级|验收|支付)/.test(normalized);

  return {
    id: `WC-${Date.now()}`,
    title: normalized.length > 24 ? `${normalized.slice(0, 24)}...` : normalized,
    summary: normalized,
    project,
    owner: '产品经理',
    priority: hasDeadlineHint ? '高' : '中',
    dueDate: hasDeadlineHint ? '待确认' : '需补充 DDL',
    todos: ['确认需求归属项目', '补齐验收口径', '安排计划开始/结束时间'],
    risks: hasRiskHint ? ['涉及支付、分账或升级兼容，需要专项确认'] : ['暂无高风险提示'],
    questions: ['客户是否已明确交付时间？', '是否涉及标准版升级回归？'],
  };
}

export function scheduleTasks(tasks: Task[], anchor = new Date('2026-08-03')): GanttItem[] {
  const colors = ['#2563eb', '#0f766e', '#b45309', '#7c3aed'];
  const startMap = new Map<string, Date>();

  return tasks.map((task, index) => {
    const base = startMap.get(task.id) ?? toDate(task.planStart || formatDate(anchor));
    const start = base.getTime() >= anchor.getTime() ? base : anchor;
    const rawEnd = toDate(task.planEnd || formatDate(new Date(start.getTime() + 2 * DAY_MS)));
    const end = rawEnd.getTime() > start.getTime() ? rawEnd : new Date(start.getTime() + 2 * DAY_MS);

    task.dependsOn.forEach((dependencyId) => {
      const dependentStart = startMap.get(dependencyId);
      if (dependentStart && end.getTime() <= dependentStart.getTime()) {
        startMap.set(task.id, new Date(dependentStart.getTime() + DAY_MS));
      }
    });

    const finalStart = startMap.get(task.id) ?? start;
    const finalEnd = new Date(finalStart.getTime() + Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS)) * DAY_MS);

    return {
      taskId: task.id,
      title: task.title,
      start: formatDate(finalStart),
      end: formatDate(finalEnd),
      progress: task.status === '已完成' ? 100 : task.status === '执行中' ? 45 : 0,
      color: colors[index % colors.length],
    };
  });
}

export interface AmountRow {
  date: string;
  amount: number;
}

export interface ReconciliationResult {
  date: string;
  systemAmount: number;
  providerAmount: number;
  difference: number;
  status: '一致' | '差异';
}

export function reconcileDailyTotals(
  systemRows: AmountRow[],
  providerRows: AmountRow[],
): ReconciliationResult[] {
  const systemMap = new Map(systemRows.map((row) => [row.date, row.amount]));
  const providerMap = new Map(providerRows.map((row) => [row.date, row.amount]));
  const dates = Array.from(new Set([...systemMap.keys(), ...providerMap.keys()])).sort();

  return dates.map((date) => {
    const systemAmount = systemMap.get(date) ?? 0;
    const providerAmount = providerMap.get(date) ?? 0;
    const difference = Number((providerAmount - systemAmount).toFixed(2));
    return {
      date,
      systemAmount,
      providerAmount,
      difference,
      status: Math.abs(difference) < 0.01 ? '一致' : '差异',
    };
  });
}
