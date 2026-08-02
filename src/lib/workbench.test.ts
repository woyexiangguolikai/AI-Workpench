import { createWorkCard, reconcileDailyTotals, scheduleTasks } from './workbench';
import type { Task } from '../types';

describe('createWorkCard', () => {
  it('creates a structured work card from a one-line requirement', () => {
    const card = createWorkCard('月底前确认医院营养餐台账并按科室导出', '同济医院营养餐项目');

    expect(card.project).toBe('同济医院营养餐项目');
    expect(card.priority).toBe('高');
    expect(card.dueDate).toBe('待确认');
    expect(card.todos.length).toBeGreaterThan(0);
  });

  it('marks missing deadline explicitly', () => {
    const card = createWorkCard('客户提出需要增加扫码支付');
    expect(card.dueDate).toBe('需补充 DDL');
  });
});

describe('scheduleTasks', () => {
  it('returns gantt items with dates and progress', () => {
    const tasks: Task[] = [
      {
        id: 'T1',
        requirementId: 'R1',
        title: '确认需求',
        assignee: '产品经理',
        planStart: '2026-08-03',
        planEnd: '2026-08-04',
        status: '执行中',
        dependsOn: [],
      },
      {
        id: 'T2',
        requirementId: 'R1',
        title: '生成文档',
        assignee: 'AI 工作台',
        planStart: '2026-08-05',
        planEnd: '2026-08-06',
        status: '待开始',
        dependsOn: ['T1'],
      },
    ];

    const result = scheduleTasks(tasks);
    expect(result).toHaveLength(2);
    expect(result[0].progress).toBe(45);
    expect(result[1].start >= result[0].end).toBe(true);
  });
});

describe('reconcileDailyTotals', () => {
  it('flags only rows with amount differences', () => {
    const result = reconcileDailyTotals(
      [
        { date: '2026-07-01', amount: 100 },
        { date: '2026-07-02', amount: 120 },
      ],
      [
        { date: '2026-07-01', amount: 100 },
        { date: '2026-07-02', amount: 118 },
      ],
    );

    expect(result[0].status).toBe('一致');
    expect(result[1].status).toBe('差异');
    expect(result[1].difference).toBe(-2);
  });
});
