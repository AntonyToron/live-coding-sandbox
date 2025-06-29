import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

export interface Pad {
  id: string;
  title: string;
  language: string;
  code: string;
  is_public: boolean;
  share_token?: string;
  user_id: string;
  user?: User;
  last_executed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authAPI = {
  register: (username: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { username, email, password }),
  
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  
  me: () => api.get<{ user: User }>('/auth/me'),
  
  logout: () => api.post('/auth/logout'),
};

export const padAPI = {
  list: () => api.get<{ pads: Pad[] }>('/pads'),
  
  create: (data: { title: string; language?: string; code?: string; is_public?: boolean }) =>
    api.post<{ pad: Pad }>('/pads', data),
  
  get: (id: string) => api.get<{ pad: Pad }>(`/pads/${id}`),
  
  update: (id: string, data: Partial<Pad>) =>
    api.put<{ pad: Pad }>(`/pads/${id}`, data),
  
  delete: (id: string) => api.delete(`/pads/${id}`),
  
  share: (id: string) => api.post<{ share_token: string }>(`/pads/${id}/share`),
  
  getShared: (token: string) => api.get<{ pad: Pad }>(`/pads/share/${token}`),
};