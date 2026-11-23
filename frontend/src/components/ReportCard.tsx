import React from 'react';
import { Report } from '../types';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, User, MessageSquare } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { format } from 'date-fns';

interface ReportCardProps {
  report: Report;
}

const categoryIcons: Record<string, string> = {
  waste: '🗑️',
  water_pollution: '💧',
  air_pollution: '🌫️',
  deforestation: '🌳',
  noise: '🔊',
  other: '⚠️',
};

const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  return (
    <Link to={`/reports/${report.id}`} className="report-card">
      <div className="report-card-header">
        <span className="category-icon">{categoryIcons[report.category] || '⚠️'}</span>
        <div className="report-card-badges">
          <StatusBadge type="priority" value={report.priority} />
          <StatusBadge type="status" value={report.status} />
        </div>
      </div>
      <h3 className="report-card-title">{report.title}</h3>
      <p className="report-card-description">{report.description}</p>
      <div className="report-card-meta">
        <span className="meta-item">
          <MapPin size={12} />
          {report.address || (report.latitude != null && report.longitude != null ? `${report.latitude.toFixed(3)}, ${report.longitude.toFixed(3)}` : 'Location not provided')}
        </span>
        <span className="meta-item">
          <User size={12} />
          {report.reporter_username || report.reporter?.username || 'Unknown reporter'}
        </span>
        <span className="meta-item">
          <Calendar size={12} />
          {format(new Date(report.created_at), 'MMM d, yyyy')}
        </span>
        <span className="meta-item">
          <MessageSquare size={12} />
          {report.comments_count}
        </span>
      </div>
      {report.is_duplicate && (
        <div className="duplicate-badge">⚠️ Possible duplicate</div>
      )}
    </Link>
  );
};

export default ReportCard;
