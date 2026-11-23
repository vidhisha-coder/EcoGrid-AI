import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { reportsApi } from '../services/api';
import { Report } from '../types';
import { Filter, Loader } from 'lucide-react';

const priorityColor: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

const MapPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    priority: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      const data = await reportsApi.getReports({ ...params, limit: 200 });
      setReports(Array.isArray(data?.reports) ? data.reports : []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="map-page">
      <div className="map-toolbar">
        <h2 className="page-title">📍 Report Map</h2>
        <button
          className="btn btn-secondary"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="filter-bar">
          <select
            className="form-input filter-select"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
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
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <button
            className="btn btn-ghost"
            onClick={() => setFilters({ category: '', status: '', priority: '' })}
          >
            Clear
          </button>
        </div>
      )}

      {loading && (
        <div className="map-loading">
          <Loader size={24} className="spin" />
          <span>Loading reports…</span>
        </div>
      )}

      <div className="map-container-wrap">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: '70vh', width: '100%', borderRadius: '12px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {reports.filter((r): r is Report & { latitude: number; longitude: number } => r.latitude != null && r.longitude != null).map((r) => (
            <CircleMarker
              key={r.id}
              center={[r.latitude, r.longitude]}
              radius={r.priority === 'critical' ? 14 : r.priority === 'high' ? 11 : 8}
              fillColor={priorityColor[r.priority] || '#6b7280'}
              color="#fff"
              weight={2}
              fillOpacity={0.85}
            >
              <Popup>
                <div className="map-popup">
                  <strong>{r.title}</strong>
                  <div>
                    <span>Category: </span>
                    {r.category.replace(/_/g, ' ')}
                  </div>
                  <div>
                    <span>Status: </span>
                    {r.status}
                  </div>
                  <div>
                    <span>Priority: </span>
                    {r.priority}
                  </div>
                  <Link to={`/reports/${r.id}`} className="popup-link">
                    View Details →
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="map-legend">
          <strong>Priority</strong>
          {Object.entries(priorityColor).map(([p, c]) => (
            <div key={p} className="legend-item">
              <span className="legend-dot" style={{ background: c }} />
              <span>{p.charAt(0).toUpperCase() + p.slice(1)}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="map-count">
        Showing <strong>{reports.length}</strong> reports
      </p>
    </div>
  );
};

export default MapPage;
