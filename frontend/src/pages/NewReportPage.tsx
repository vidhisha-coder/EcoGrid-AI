import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { reportsApi } from '../services/api';
import { Report } from '../types';
import AIAnalysisCard from '../components/AIAnalysisCard';
import { MapPin, Upload, X, Loader, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const NewReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'waste',
    address: '',
    latitude: '',
    longitude: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [created, setCreated] = useState<Report | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported in this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
        toast.success('Location detected!');
      },
      () => {
        toast.error('Could not get location.');
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.latitude || !form.longitude) {
      toast.error('Please provide a location.');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('address', form.address);
      fd.append('latitude', form.latitude);
      fd.append('longitude', form.longitude);
      if (file) fd.append('image', file);

      const result = await reportsApi.createReport(fd);
      setCreated(result);
      toast.success('Report submitted successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <div className="page-container">
        <div className="success-state">
          <div className="success-icon">✅</div>
          <h2>Report Submitted!</h2>
          <p>Your report has been submitted and is being analyzed by our AI.</p>
          {created.ai_analysis && <AIAnalysisCard analysis={created.ai_analysis} />}
          <div className="success-actions">
            <button className="btn btn-primary" onClick={() => navigate(`/reports/${created.id}`)}>
              View Report
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setCreated(null);
                setForm({ title: '', description: '', category: 'waste', address: '', latitude: '', longitude: '' });
                setFile(null);
                setPreview(null);
              }}
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2 className="page-title">📝 Submit New Report</h2>
      <p className="page-subtitle">Help us keep our environment clean by reporting issues.</p>

      <form onSubmit={handleSubmit} className="report-form">
        <div className="form-section">
          <h3 className="form-section-title">Report Details</h3>

          <div className="form-group">
            <label>Title *</label>
            <input
              name="title"
              className="form-input"
              placeholder="Brief description of the issue"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select name="category" className="form-input" value={form.category} onChange={handleChange}>
              <option value="waste">🗑️ Waste / Garbage</option>
              <option value="water_pollution">💧 Water Pollution</option>
              <option value="air_pollution">🌫️ Air Pollution</option>
              <option value="deforestation">🌳 Deforestation</option>
              <option value="noise">🔊 Noise Pollution</option>
              <option value="other">⚠️ Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              className="form-input textarea"
              placeholder="Describe the environmental issue in detail…"
              value={form.description}
              onChange={handleChange}
              rows={4}
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Location</h3>

          <div className="location-row">
            <div className="form-group flex-1">
              <label>Latitude</label>
              <input
                name="latitude"
                className="form-input"
                placeholder="e.g. 28.6139"
                value={form.latitude}
                onChange={handleChange}
              />
            </div>
            <div className="form-group flex-1">
              <label>Longitude</label>
              <input
                name="longitude"
                className="form-input"
                placeholder="e.g. 77.2090"
                value={form.longitude}
                onChange={handleChange}
              />
            </div>
            <button
              type="button"
              className="btn btn-secondary gps-btn"
              onClick={handleGPS}
              disabled={locating}
            >
              {locating ? <Loader size={16} className="spin" /> : <MapPin size={16} />}
              {locating ? 'Detecting…' : 'GPS'}
            </button>
          </div>

          <div className="form-group">
            <label>Address</label>
            <input
              name="address"
              className="form-input"
              placeholder="Street address or landmark"
              value={form.address}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Photo Evidence</h3>
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'drag-active' : ''}`}
          >
            <input {...getInputProps()} />
            {preview ? (
              <div className="dropzone-preview">
                <img src={preview} alt="preview" className="preview-img" />
                <button
                  type="button"
                  className="remove-preview"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreview(null);
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="dropzone-placeholder">
                <Upload size={32} className="upload-icon" />
                <p>{isDragActive ? 'Drop it here!' : 'Drag & drop an image, or click to select'}</p>
                <span>PNG, JPG, WEBP up to 10 MB</span>
              </div>
            )}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? (
            <>
              <Loader size={16} className="spin" />
              Analyzing with AI…
            </>
          ) : (
            <>
              <Send size={16} />
              Submit Report
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default NewReportPage;
