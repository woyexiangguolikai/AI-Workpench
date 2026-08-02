import { FolderKanban } from 'lucide-react';
import type { Project } from '../types';

interface ProjectsViewProps {
  projects?: Project[];
}

export function ProjectsView({ projects = [] }: ProjectsViewProps) {
  const hasData = projects.length > 0;

  if (!hasData) {
    return (
      <div className="view-stack">
        <section className="panel">
          <div className="panel-header">
            <h2>客户/项目档案</h2>
          </div>
          <div className="empty-state">
            <FolderKanban size={22} />
            <span>选择一个包含文件的目录，项目卡片将基于子目录自动生成。</span>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <h2>客户/项目档案</h2>
          <button className="secondary-button" type="button">
            新建档案
          </button>
        </div>
        <div className="project-table">
          <table>
            <thead>
              <tr>
                <th>名称</th>
                <th>状态</th>
                <th>来源/商务</th>
                <th>关键 DDL</th>
                <th>待办</th>
                <th>风险</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <strong>{project.name}</strong>
                    <small>{project.folder}</small>
                  </td>
                  <td><span className="pill">{project.status}</span></td>
                  <td>{project.source}</td>
                  <td>{project.ddl}</td>
                  <td>{project.openTasks}</td>
                  <td><span className="risk-text">{project.risk}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="two-column">
        {projects.slice(0, 2).map((project) => (
          <div className="panel project-card" key={project.id}>
            <div className="panel-header">
              <h2>{project.name}</h2>
              <span className="pill">{project.status}</span>
            </div>
            <p>{project.summary}</p>
            <div className="mini-metrics">
              <span><strong>{project.openTasks}</strong> 项待办</span>
              <span><strong>{project.documents.length}</strong> 类交付物</span>
              <span><strong>{project.ddl}</strong> 关键节点</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
