// app/_lib/api.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) return token;
    
    // Check cookies as fallback
    const cookieMatch = document.cookie.match(/admin_token=([^;]+)/);
    if (cookieMatch) return cookieMatch[1];
  }
  return null;
};

/**
 * Universal safe parser that ensures structural variations from backend 
 * controllers (standalone arrays, data objects, or named wrappers) 
 * are standardized before reaching components.
 */
const parseResponseData = (res: any) => {
  if (!res) return res;
  
  // If the backend wraps payload inside an envelope object with a 'data' key or similar structure
  if (res.data !== undefined) return res.data;
  
  // Return the raw structure if it's already an array or a standardized format
  return res;
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
      // Token expired or invalid, clear credentials and redirect to login
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
    
    const json = await response.json();
    return parseResponseData(json);
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
    
    const json = await response.json();
    return parseResponseData(json);
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
    
    const json = await response.json();
    return parseResponseData(json);
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
    
    const json = await response.json();
    return parseResponseData(json);
  },
};