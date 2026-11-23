import React from 'react';
import { AIAnalysis } from '../types';
import { Brain, Tag, Lightbulb, TrendingUp } from 'lucide-react';

interface AIAnalysisCardProps {
  analysis: AIAnalysis;
}

const priorityColors: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({ analysis }) => {
  const confidencePct = Math.round(analysis.confidence * 100);
  const color = priorityColors[analysis.priority] || '#10b981';

  return (
    <div className="ai-card">
      <div className="ai-card-header">
        <Brain size={20} className="ai-icon" />
        <h3 className="ai-card-title">AI Analysis</h3>
      </div>

      <div className="ai-meta-row">
        <div className="ai-meta-item">
          <span className="ai-label">Category</span>
          <span className="ai-value">{analysis.category.replace(/_/g, ' ')}</span>
        </div>
        <div className="ai-meta-item">
          <span className="ai-label">Priority</span>
          <span className="ai-priority-badge" style={{ background: color }}>
            {analysis.priority.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="ai-confidence">
        <div className="confidence-label-row">
          <span className="ai-label">
            <TrendingUp size={13} /> Confidence
          </span>
          <span className="confidence-pct">{confidencePct}%</span>
        </div>
        <div className="confidence-bar-bg">
          <div
            className="confidence-bar-fill"
            style={{ width: `${confidencePct}%`, background: color }}
          />
        </div>
      </div>

      <p className="ai-description">{analysis.description}</p>

      {analysis.tags && analysis.tags.length > 0 && (
        <div className="ai-tags-section">
          <span className="ai-label">
            <Tag size={13} /> Tags
          </span>
          <div className="ai-tags">
            {analysis.tags.map((tag) => (
              <span key={tag} className="ai-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="ai-recs-section">
          <span className="ai-label">
            <Lightbulb size={13} /> Recommendations
          </span>
          <ul className="ai-recs">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="ai-rec-item">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisCard;
