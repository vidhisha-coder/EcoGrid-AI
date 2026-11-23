export interface User {
  id: number;
  email: string;
  username: string;
  role: 'citizen' | 'volunteer' | 'authority';
  is_active: boolean;
  created_at: string;
}

export interface Report {
  id: number;
  title: string;
  description: string;
  category: 'waste' | 'water_pollution' | 'air_pollution' | 'deforestation' | 'noise' | 'other';
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  image_path: string | null;
  ai_analysis: AIAnalysis | null;
  reporter_id: number;
  reporter_username?: string;
  reporter?: { id: number; username: string; email: string; role: string } | null;
  assigned_to: number | null;
  assigned_volunteer_name: string | null;
  is_duplicate: boolean;
  duplicate_of: number | null;
  created_at: string;
  updated_at: string;
  comments_count: number;
}

export interface AIAnalysis {
  category: string;
  priority: string;
  description: string;
  confidence: number;
  tags: string[];
  recommendations: string[];
}

export interface Comment {
  id: number;
  content: string;
  report_id: number;
  user_id: number;
  username: string;
  created_at: string;
}

export interface Analytics {
  total_reports: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
  resolution_rate: number;
  recent_trend: Array<{ date: string; count: number }>;
}
