import { ReactNode, ComponentType, ErrorInfo } from 'react';

// Authentication types
export interface User {
  id: number;
  username: string;
  email: string;
  roles?: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthContextType {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  authorizedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  setProfileSummary: (profile: any) => void;
}

// API types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: ApiError;
}

// Member types
export interface Member {
  id: number;
  name: string;
  role: string;
  bio?: string;
  image?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  projects?: Project[];
}

export interface Project {
  id: number;
  name: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  image?: string;
  featured: boolean;
  memberId: number;
}

// Settings types
export interface SettingsState {
  theme: 'light' | 'dark' | 'auto';
  animations: boolean;
  soundEffects: boolean;
  particleEffects: boolean;
  autoSave: boolean;
}

export interface SettingsContextType {
  settings: SettingsState;
  updateSettings: (newSettings: Partial<SettingsState>) => void;
  resetSettings: () => void;
}

// Component prop types
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface BackgroundProps {
  particleCount?: number;
  animationSpeed?: number;
  showStars?: boolean;
}

// Update types for LatestUpdates component
export interface Update {
  id: string;
  title: string;
  description: string;
  date: string;
  category: 'Frontend' | 'Backend' | 'UX' | 'DevOps' | 'Testing';
  author?: string;
}

// Performance monitoring types
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  cacheHitRate: number;
}

// PWA types
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

// Utility types
export type Theme = 'light' | 'dark' | 'auto';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type SortDirection = 'asc' | 'desc';

// Form types
export interface FormField {
  name: string;
  value: string;
  error?: string;
  touched: boolean;
}

export interface FormState {
  fields: Record<string, FormField>;
  isValid: boolean;
  isSubmitting: boolean;
}

// SEO types
export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  author?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
}