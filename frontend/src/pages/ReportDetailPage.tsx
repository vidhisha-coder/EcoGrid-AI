import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportsApi, commentsApi, usersApi } from '../services/api';
import { Report, Comment, User } from '../types';
import AIAnalysisCard from '../components/AIAnalysisCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, User as UserIcon, MessageSquare, Loader, Send, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const BASE_URL = process.env.REACT_APP_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [rep, cmts] = await Promise.all([
          reportsApi.getReport(Number(id)),
          commentsApi.getComments(Number(id)),
        ]);
        setReport(rep);
        setComments(cmts);
        if (user?.role === 'authority') {
          const vols = await usersApi.getVolunteers();
          setVolunteers(vols);
        }
      } catch {
        toast.error('Failed to load report.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, user]);

  const handleStatusChange = async (status: string) => {
    if (!report) return;
    setUpdatingStatus(true);
    try {
      const updated = await reportsApi.updateReport(report.id, { status: status as Report['status'] });
      setReport(updated);
      toast.success('Status updated!');
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssign = async (volunteerId: string) => {
    if (!report) return;
    try {
      const updated = await reportsApi.updateReport(report.id, {
        assigned_to: Number(volunteerId) || null,
      });
      setReport(updated);
      toast.success('Volunteer assigned!');
    } catch {
      toast.error('Failed to assign volunteer.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const newComment = await commentsApi.addComment(Number(id), commentText.trim());
      setComments([...comments, newComment]);
      setCommentText('');
      toast.success('Comment added!');
    } catch {
      toast.error('Failed to add comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-center full-height">
        <Loader size={32} className="spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="page-container empty-state">
        <span className="empty-icon">🌿</span>
        <p>Report not found.</p>
        <button className="btn btn-primary" onClick={() => navigate('/reports')}>
          Back to Reports
        </button>
      </div>
    );
  }

  const canEditStatus = user?.role === 'authority' || user?.role === 'volunteer';

  return (
    <div className="page-container">
      <button className="btn btn-ghost back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="detail-header">
        <div>
          <h2 className="page-title">{report.title}</h2>
          <div className="detail-badges">
            <StatusBadge type="category" value={report.category} />
            <StatusBadge type="priority" value={report.priority} />
            <StatusBadge type="status" value={report.status} />
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Main content */}
        <div className="detail-main">
          {report.image_path && (
            <div className="detail-image-wrap">
              <img
                src={`${BASE_URL}/${report.image_path}`}
                alt="Report"
                className="detail-image"
              />
            </div>
          )}

          <div className="detail-card">
            <h3 className="detail-card-title">Description</h3>
            <p className="detail-description">{report.description}</p>

            <div className="detail-meta-grid">
              <div className="meta-row">
                <MapPin size={15} />
                <span>{report.address || `${report.latitude}, ${report.longitude}`}</span>
              </div>
              <div className="meta-row">
                <UserIcon size={15} />
                <span>Reported by <strong>{report.reporter_username || report.reporter?.username || 'Unknown reporter'}</strong></span>
              </div>
              <div className="meta-row">
                <Calendar size={15} />
                <span>{format(new Date(report.created_at), 'PPP p')}</span>
              </div>
              {report.assigned_volunteer_name && (
                <div className="meta-row">
                  <UserIcon size={15} />
                  <span>Assigned to <strong>{report.assigned_volunteer_name}</strong></span>
                </div>
              )}
            </div>

            {report.is_duplicate && (
              <div className="duplicate-alert">
                ⚠️ This report may be a duplicate of{' '}
                <a href={`/reports/${report.duplicate_of}`}>Report #{report.duplicate_of}</a>
              </div>
            )}
          </div>

          {/* AI Analysis */}
          {report.ai_analysis && <AIAnalysisCard analysis={report.ai_analysis} />}

          {/* Comments */}
          <div className="detail-card">
            <h3 className="detail-card-title">
              <MessageSquare size={18} /> Comments ({comments.length})
            </h3>

            <div className="comments-list">
              {comments.length === 0 && (
                <p className="no-comments">No comments yet. Be the first to comment.</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="comment">
                  <div className="comment-header">
                    <span className="comment-author">{c.username}</span>
                    <span className="comment-date">
                      {format(new Date(c.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="comment-content">{c.content}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                className="form-input textarea"
                placeholder="Add a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingComment || !commentText.trim()}
              >
                {submittingComment ? <Loader size={14} className="spin" /> : <Send size={14} />}
                Post Comment
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar actions */}
        <div className="detail-sidebar">
          {canEditStatus && (
            <div className="action-card">
              <h4 className="action-card-title">Update Status</h4>
              <select
                className="form-input"
                value={report.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
              >
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
              {updatingStatus && <Loader size={14} className="spin" />}
            </div>
          )}

          {user?.role === 'authority' && (
            <div className="action-card">
              <h4 className="action-card-title">Assign Volunteer</h4>
              <select
                className="form-input"
                value={report.assigned_to?.toString() || ''}
                onChange={(e) => handleAssign(e.target.value)}
              >
                <option value="">Unassigned</option>
                {volunteers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="action-card info-card">
            <h4 className="action-card-title">Report Info</h4>
            <div className="info-row"><span>ID</span><span>#{report.id}</span></div>
            <div className="info-row"><span>Category</span><span>{report.category.replace(/_/g, ' ')}</span></div>
            <div className="info-row"><span>Priority</span><span>{report.priority}</span></div>
            <div className="info-row">
              <span>Updated</span>
              <span>{format(new Date(report.updated_at), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailPage;
