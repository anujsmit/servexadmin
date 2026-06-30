// app/admin/_lib/auth.ts

// ✅ FIX: Remove /api from the base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
// NOT: 'http://localhost:5000/api'

export interface AdminLoginResponse {
  success: boolean;
  requiresTwoFactor?: boolean;
  user?: {
    id: string;
    fullName: string;
    phoneNumber: string;
    role: string;
    twoFaEnabled: boolean;
    staffRole: string;
    permissions: string[];
  };
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  backupCodes?: string[];
}

export async function adminLoginWithPassword(phone: string, password: string, twoFactorToken?: string, backupCode?: string) {
  // ✅ Add /api prefix in the URL path
  const response = await fetch(`${API_BASE}/api/admin/auth/login-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password, twoFactorToken, backupCode }),
    credentials: 'include',
  });
  
  const data = await response.json();
  console.log('Login response:', { status: response.status, data });
  
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  
  // ✅ Store token in localStorage
  const token = data.accessToken || data.token;
  if (token) {
    localStorage.setItem('admin_token', token);
    console.log('✅ Token stored in localStorage');
  }
  
  if (data.refreshToken) {
    localStorage.setItem('admin_refresh_token', data.refreshToken);
  }
  
  if (data.user) {
    localStorage.setItem('admin_user', JSON.stringify(data.user));
  }
  
  return data;
}

export const checkAdminTwoFactorStatus = async (phone: string): Promise<{ twoFactorEnabled: boolean }> => {
  try {
    console.log('Checking 2FA status for:', phone);
    
    const response = await fetch(`${API_BASE}/api/admin/auth/check-two-factor-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('2FA check failed with status:', response.status);
      return { twoFactorEnabled: false };
    }

    const data = await response.json();
    return { twoFactorEnabled: data.twoFactorEnabled || false };
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return { twoFactorEnabled: false };
  }
};

export const getCurrentAdmin = async (): Promise<any> => {
  try {
    const token = localStorage.getItem('admin_token');
    console.log('🔍 Getting current admin, token exists:', !!token);
    
    if (!token) {
      console.log('❌ No token found, user not authenticated');
      return null;
    }
    
    // ✅ Add /api prefix in the URL path
    const url = `${API_BASE}/api/admin/me`;
    console.log('📤 Fetching admin from:', url);
    console.log('📤 Token:', token.substring(0, 20) + '...');
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log(`📥 Response status: ${response.status}`);
    console.log(`📥 Response ok: ${response.ok}`);
    
    if (response.status === 401) {
      console.log('🔑 Token expired, clearing session');
      await adminLogout();
      return null;
    }

    if (!response.ok) {
      console.error('❌ Failed to fetch admin:', response.status);
      const text = await response.text();
      console.error('❌ Response body:', text);
      return null;
    }

    const data = await response.json();
    console.log('✅ Admin data received:', data);
    return data;
  } catch (error) {
    console.error('❌ Error getting current admin:', error);
    return null;
  }
};

export const adminLogout = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('admin_token');
    if (token) {
      await fetch(`${API_BASE}/api/admin/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    console.log('Cleared admin session');
  }
};

export const clearSession = adminLogout;

export const checkSession = async (): Promise<{
  authenticated: boolean;
  user?: any;
}> => {
  try {
    const token = localStorage.getItem('admin_token');
    
    if (!token) {
      console.log('No admin token found, session not authenticated');
      return { authenticated: false };
    }

    const response = await fetch(`${API_BASE}/api/admin/me`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('Invalid or expired token, clearing session');
        await clearSession();
      }
      return { authenticated: false };
    }

    const userData = await response.json();
    console.log('Session check successful for user:', userData.fullName);
    
    return {
      authenticated: true,
      user: userData,
    };
  } catch (error) {
    console.error('Error checking session:', error);
    return { authenticated: false };
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
};

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('admin_token');
};