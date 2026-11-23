import axios from 'axios';
import { Report, Analytics, Comment, User } from '../types';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (username: string, email: string, password: string, role: string) => {
    const response = await api.post('/auth/register', { username, email, password, role });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data as User;
  },
};

// Reports
export const reportsApi = {
  getReports: async (params?: Record<string, string | number>) => {
    const response = await api.get('/reports', { params });
    return response.data as { reports: Report[]; total: number; page: number; pages: number };
  },
  getReport: async (id: number) => {
    const response = await api.get(`/reports/${id}`);
    return response.data as Report;
  },
  createReport: async (data: FormData) => {
    const response = await api.post('/reports', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data as Report;
  },
  updateReport: async (id: number, data: Partial<Report>) => {
    const response = await api.put(`/reports/${id}`, data);
    return response.data as Report;
  },
  deleteReport: async (id: number) => {
    await api.delete(`/reports/${id}`);
  },
  getHotspots: async () => {
    const response = await api.get('/reports/map/hotspots');
    return response.data;
  },
  getAnalytics: async () => {
    const response = await api.get('/reports/analytics/summary');
    return response.data as Analytics;
  },
};

// Comments
export const commentsApi = {
  getComments: async (reportId: number) => {
    const response = await api.get(`/reports/${reportId}/comments`);
    return response.data as Comment[];
  },
  addComment: async (reportId: number, content: string) => {
    const response = await api.post(`/reports/${reportId}/comments`, { content });
    return response.data as Comment;
  },
};

// Users
export const usersApi = {
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data as User[];
  },
  updateUserRole: async (userId: number, role: string) => {
    const response = await api.put(`/users/${userId}/role`, null, { params: { role } });
    return response.data as User;
  },
  getVolunteers: async () => {
    const response = await api.get('/users/volunteers');
    return response.data as User[];
  },
};

export default api;
