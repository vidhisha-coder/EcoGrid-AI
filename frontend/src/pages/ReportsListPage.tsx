import React, { useEffect, useState, useCallback } from 'react';
import { reportsApi } from '../services/api';
import { Report } from '../types';
import ReportCard from '../components/ReportCard';
import { Search, Filter, ChevronLeft, ChevronRight, Loader } from 'lucide-react';

const PAGE_SIZE = 10;

const ReportsListPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', sort: 'created_at_desc' });
  const [showFilters, setShowFilters] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: PAGE_SIZE,
      };
      if (search) params.search = search;
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;
      if (filters.sort) params.sort = filters.sort;

      const data = await reportsApi.getReports(params);
      setReports(Array.isArray(data?.reports) ? data.reports : []);
      setTotal(Number(data?.total) || 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReports();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">📋 Reports</h2>
        <button className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)}>
          <Filter size={16} /> Filters
        </button>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="search-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search reports…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </form>

      {showFilters && (
        <div className="filter-bar">
          <select
            className="form-input filter-select"
            value={filters.category}
            onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}
          >
            <option value="">All Categories</option>
            <option value="waste">Waste</option>
            <option value="water_pollution">Water Pollution</option>
            <option value="air_pollution">Air Pollution</option>
            <option value="deforestation">Deforestation</option>
            <option value="noise">Noise</option>
            <option value="other">Other</option>
          </select>

          <select
            className="form-input filter-select"
            value={filters.status}
            onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            className="form-input filter-select"
            value={filters.priority}
            onChange={(e) => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <select
            className="form-input filter-select"
            value={filters.sort}
            onChange={(e) => { setFilters({ ...filters, sort: e.target.value }); setPage(1); }}
          >
            <option value="created_at_desc">Newest First</option>
            <option value="created_at_asc">Oldest First</option>
            <option value="priority_desc">Highest Priority</option>
          </select>

          <button
            className="btn btn-ghost"
            onClick={() => { setFilters({ status: '', category: '', priority: '', sort: 'created_at_desc' }); setPage(1); }}
          >
            Clear
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-center">
          <Loader size={28} className="spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🌿</span>
          <p>No reports found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-ghost icon-btn"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages} &nbsp;·&nbsp; {total} reports
          </span>
          <button
            className="btn btn-ghost icon-btn"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportsListPage;
