import type { LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: 'blue' | 'amber' | 'green' | 'teal';
}

export function MetricCard({ icon: Icon, label, value, tone }: MetricCardProps) {
  return (
    <div className={`metric-card ${tone}`}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
