import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportsApi } from '../services/api';
import { Report, Analytics } from '../types';
import ReportCard from '../components/ReportCard';
import StatusBadge from '../components/StatusBadge';
import {
  FileText, CheckCircle, Clock, AlertTriangle, PlusCircle,
  Loader, TrendingUp, Users, Map,
} from 'lucide-react';
import { format } from 'date-fns';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string }> = ({
  label, value, icon, color,
}) => (
  <div className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
    <div className="stat-icon" style={{ color }}>{icon}</div>
    <div className="stat-info">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (user?.role === 'citizen') {
          const data = await reportsApi.getReports({ limit: 5, reporter_id: user.id });
          setMyReports(Array.isArray(data?.reports) ? data.reports : []);
        } else if (user?.role === 'volunteer') {
          const data = await reportsApi.getReports({ limit: 10, assigned_to: user.id });
setAllReports(Array.isArray(data?.reports) ? data.reports : []);
        } else if (user?.role === 'authority') {
          const [rep, anal] = await Promise.all([
            reportsApi.getReports({ limit: 10 }),
            reportsApi.getAnalytics(),
          ]);
setAllReports(Array.isArray(rep?.reports) ? rep.reports : []);
          setAnalytics(anal);
        }
      } catch {/* ignore */} finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="loading-center full-height">
        <Loader size={28} className="spin" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="dashboard-welcome">
        <h2 className="page-title">
          👋 Welcome back, <span className="highlight">{user?.username}</span>!
        </h2>
        <p className="page-subtitle">
          Role: <strong>{user?.role}</strong>
        </p>
      </div>

      {/* CITIZEN DASHBOARD */}
      {user?.role === 'citizen' && (
        <>
          <div className="quick-actions">
            <Link to="/reports/new" className="btn btn-primary quick-action-btn">
              <PlusCircle size={18} /> Submit New Report
            </Link>
            <Link to="/map" className="btn btn-secondary quick-action-btn">
              <Map size={18} /> View Map
            </Link>
            <Link to="/reports" className="btn btn-secondary quick-action-btn">
              <FileText size={18} /> All Reports
            </Link>
          </div>

          <h3 className="section-title">My Recent Reports</h3>
          {myReports.length === 0 ? (
            <div className="empty-state small">
              <span className="empty-icon">🌿</span>
              <p>You haven't submitted any reports yet.</p>
              <Link to="/reports/new" className="btn btn-primary">
                Submit Your First Report
              </Link>
            </div>
          ) : (
            <div className="reports-grid">
              {myReports.map((r) => <ReportCard key={r.id} report={r} />)}
            </div>
          )}
        </>
      )}

      {/* VOLUNTEER DASHBOARD */}
      {user?.role === 'volunteer' && (
        <>
          <div className="stat-cards-row">
            <StatCard
              label="Assigned Tasks"
              value={allReports.filter((r) => r.status === 'assigned').length}
              icon={<Clock size={22} />}
              color="#3b82f6"
            />
            <StatCard
              label="In Progress"
              value={allReports.filter((r) => r.status === 'in_progress').length}
              icon={<TrendingUp size={22} />}
              color="#f97316"
            />
            <StatCard
              label="Resolved"
              value={allReports.filter((r) => r.status === 'resolved').length}
              icon={<CheckCircle size={22} />}
              color="#10b981"
            />
          </div>

          <h3 className="section-title">Assigned Tasks</h3>
          {allReports.length === 0 ? (
            <div className="empty-state small">
              <span className="empty-icon">✅</span>
              <p>No tasks assigned to you yet.</p>
            </div>
          ) : (
            <div className="reports-grid">
              {allReports.map((r) => <ReportCard key={r.id} report={r} />)}
            </div>
          )}
        </>
      )}

      {/* AUTHORITY DASHBOARD */}
      {user?.role === 'authority' && analytics && (
        <>
          <div className="stat-cards-row">
            <StatCard
              label="Total Reports"
              value={analytics.total_reports}
              icon={<FileText size={22} />}
              color="#10b981"
            />
            <StatCard
              label="Pending"
              value={analytics.by_status['pending'] || 0}
              icon={<Clock size={22} />}
              color="#f59e0b"
            />
            <StatCard
              label="Resolved"
              value={analytics.by_status['resolved'] || 0}
              icon={<CheckCircle size={22} />}
              color="#10b981"
            />
            <StatCard
              label="Critical"
              value={analytics.by_priority['critical'] || 0}
              icon={<AlertTriangle size={22} />}
              color="#ef4444"
            />
          </div>

          <div className="resolution-banner">
            <TrendingUp size={20} />
            <span>Resolution Rate: <strong>{Math.round(analytics.resolution_rate)}%</strong></span>
          </div>

          <div className="dashboard-actions-row">
            <Link to="/reports/new" className="btn btn-primary">
              <PlusCircle size={16} /> New Report
            </Link>
            <Link to="/analytics" className="btn btn-secondary">
              <TrendingUp size={16} /> Analytics
            </Link>
            <Link to="/admin/users" className="btn btn-secondary">
              <Users size={16} /> Manage Users
            </Link>
            <Link to="/map" className="btn btn-secondary">
              <Map size={16} /> Map View
            </Link>
          </div>

          <h3 className="section-title">Recent Reports</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {allReports.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link to={`/reports/${r.id}`} className="table-link">
                        #{r.id}
                      </Link>
                    </td>
                    <td>{r.title}</td>
                    <td><StatusBadge type="category" value={r.category} /></td>
                    <td><StatusBadge type="priority" value={r.priority} /></td>
                    <td><StatusBadge type="status" value={r.status} /></td>
                    <td>{format(new Date(r.created_at), 'MMM d, yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
