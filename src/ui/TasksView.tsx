import { ListTodo } from 'lucide-react';
import type { Requirement, Task } from '../types';
import { scheduleTasks } from '../lib/workbench';
import { useMemo } from 'react';

interface TasksViewProps {
  tasks: Task[];
  requirements?: Requirement[];
}

export function TasksView({ tasks, requirements = [] }: TasksViewProps) {
  const ganttItems = useMemo(() => scheduleTasks(tasks), [tasks]);
  const hasData = requirements.length > 0 || tasks.length > 0;

  if (!hasData) {
    return (
      <div className="view-stack">
        <section className="panel">
          <div className="panel-header">
            <h2>需求与排期</h2>
          </div>
          <div className="empty-state">
            <ListTodo size={22} />
            <span>选择一个包含文件的目录，需求与任务将基于材料内容生成。</span>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <h2>需求与排期</h2>
          <button className="primary-button" type="button">
            新建需求
          </button>
        </div>
        {requirements.length > 0 && (
          <div className="requirement-table">
            <table>
              <thead>
                <tr>
                  <th>需求</th>
                  <th>类型</th>
                  <th>优先级</th>
                  <th>负责人</th>
                  <th>计划</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((requirement) => (
                  <tr key={requirement.id}>
                    <td><strong>{requirement.title}</strong></td>
                    <td>{requirement.type}</td>
                    <td><span className="priority">{requirement.priority}</span></td>
                    <td>{requirement.owner}</td>
                    <td>{requirement.planStart} → {requirement.planEnd}</td>
                    <td><span className="status-ok">{requirement.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {tasks.length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <h2>甘特图</h2>
            <span className="pill">自动排期建议</span>
          </div>
          <div className="gantt-list">
            {ganttItems.map((item) => (
              <div className="gantt-row" key={item.taskId}>
                <span className="gantt-label">{item.title}</span>
                <div className="gantt-track">
                  <div
                    className="gantt-bar"
                    style={{ backgroundColor: item.color, width: `${Math.max(18, item.progress || 22)}%` }}
                  >
                    <span>{item.start} → {item.end}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
