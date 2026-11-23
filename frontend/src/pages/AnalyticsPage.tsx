import React, { useEffect, useState } from 'react';
import { reportsApi } from '../services/api';
import { Analytics } from '../types';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts';
import { FileText, CheckCircle, Clock, TrendingUp, Loader } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.getAnalytics()
      .then(setAnalytics)
      .catch(() => {/* ignore */})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-center full-height">
        <Loader size={28} className="spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="page-container empty-state">
        <span className="empty-icon">📊</span>
        <p>No analytics data available yet.</p>
      </div>
    );
  }

  const categoryData = Object.entries(analytics.by_category).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value,
  }));

  const statusData = Object.entries(analytics.by_status).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value,
  }));

  const priorityData = Object.entries(analytics.by_priority).map(([name, value]) => ({
    name,
    value,
  }));

  const trendData = analytics.recent_trend.map((d) => ({
    date: d.date,
    Reports: d.count,
  }));

  return (
    <div className="page-container">
      <h2 className="page-title">📊 Analytics</h2>
      <p className="page-subtitle">Platform-wide environmental reporting insights</p>

      {/* Stat cards */}
      <div className="stat-cards-row">
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-icon" style={{ color: '#10b981' }}><FileText size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{analytics.total_reports}</div>
            <div className="stat-label">Total Reports</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-icon" style={{ color: '#10b981' }}><CheckCircle size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{analytics.by_status['resolved'] || 0}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-icon" style={{ color: '#f59e0b' }}><Clock size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{analytics.by_status['pending'] || 0}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="stat-icon" style={{ color: '#3b82f6' }}><TrendingUp size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{Math.round(analytics.resolution_rate)}%</div>
            <div className="stat-label">Resolution Rate</div>
          </div>
        </div>
      </div>

      {/* Charts grid */}
      <div className="charts-grid">
        {/* Category Pie */}
        <div className="chart-card">
          <h3 className="chart-title">Reports by Category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status Bar */}
        <div className="chart-card">
          <h3 className="chart-title">Reports by Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Line */}
        <div className="chart-card chart-wide">
          <h3 className="chart-title">Reports Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Reports" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Donut */}
        <div className="chart-card">
          <h3 className="chart-title">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={priorityData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                label
              >
                {priorityData.map((entry) => {
                  const colors: Record<string, string> = {
                    low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
                  };
                  return <Cell key={entry.name} fill={colors[entry.name] || '#6b7280'} />;
                })}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
