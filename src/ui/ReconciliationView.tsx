import { AlertTriangle, Upload } from 'lucide-react';
import type { ReconciliationRow } from '../types';

interface ReconciliationViewProps {
  rows: ReconciliationRow[];
  onImport: () => void;
}

export function ReconciliationView({ rows, onImport }: ReconciliationViewProps) {
  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <h2>月度对账</h2>
          <button className="primary-button" type="button" onClick={onImport}>
            <Upload size={16} />
            导入本月 Excel
          </button>
        </div>
        <div className="notice-bar">
          <AlertTriangle size={16} />
          <span>随行付按日期总额导入；系统后台按学校收入/平台收入/商户收入配置账户口径。</span>
        </div>
        <div className="reconciliation-table">
          <table>
            <thead>
              <tr>
                <th>日期</th>
                <th>系统金额</th>
                <th>随行付金额</th>
                <th>差异</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.date}>
                  <td>{row.date}</td>
                  <td>¥{row.systemAmount.toFixed(2)}</td>
                  <td>¥{row.providerAmount.toFixed(2)}</td>
                  <td className={row.difference === 0 ? '' : 'negative'}>¥{row.difference.toFixed(2)}</td>
                  <td><span className={row.status === '一致' ? 'status-ok' : 'risk-text'}>{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
