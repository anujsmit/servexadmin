// app/_lib/api.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper to get auth token
const getAuthToken = (): string | null => {
  // Try to get from localStorage first
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) return token;
  }
  return null;
};

export const api = {
  get: async <T>(url: string, requiresAuth: boolean = true): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (requiresAuth) {
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn('No auth token found for API request:', url);
      }
    }
    
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });

    if (response.status === 401) {
      // Token expired or invalid, redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/login';
      }
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  },
  
  post: async <T>(url: string, data?: any, requiresAuth: boolean = true): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (requiresAuth) {
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/login';
      }
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  },
  
  patch: async <T>(url: string, data?: any, requiresAuth: boolean = true): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (requiresAuth) {
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/login';
      }
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  },
  
  del: async <T>(url: string, requiresAuth: boolean = true): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (requiresAuth) {
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      credentials: 'include',
      headers,
    });

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/login';
      }
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  },
};