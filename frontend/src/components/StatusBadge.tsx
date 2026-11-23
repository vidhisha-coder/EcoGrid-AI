import React from 'react';

type BadgeType = 'status' | 'priority' | 'category';

interface StatusBadgeProps {
  type: BadgeType;
  value: string;
}

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  assigned: '#3b82f6',
  in_progress: '#8b5cf6',
  resolved: '#10b981',
  rejected: '#ef4444',
};

const priorityColors: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

const categoryColors: Record<string, string> = {
  waste: '#6b7280',
  water_pollution: '#3b82f6',
  air_pollution: '#a3a3a3',
  deforestation: '#10b981',
  noise: '#f59e0b',
  other: '#8b5cf6',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  let color = '#6b7280';
  if (type === 'status') color = statusColors[value] || '#6b7280';
  if (type === 'priority') color = priorityColors[value] || '#6b7280';
  if (type === 'category') color = categoryColors[value] || '#6b7280';

  const label = value.replace(/_/g, ' ').toUpperCase();

  return (
    <span
      className="status-badge"
      style={{
        background: color + '22',
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
