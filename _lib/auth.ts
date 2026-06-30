// app/admin/_lib/auth.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
  refreshToken?: string;
  backupCodes?: string[];
}

// ✅ FIXED: Store token properly and return it
export async function adminLoginWithPassword(phone: string, password: string, twoFactorToken?: string, backupCode?: string) {
  const response = await fetch(`${API_BASE}/admin/auth/login-with-password`, {
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
  if (data.accessToken) {
    localStorage.setItem('admin_token', data.accessToken);
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

// ✅ FIXED: Check if admin has 2FA enabled
export const checkAdminTwoFactorStatus = async (phone: string): Promise<{ twoFactorEnabled: boolean }> => {
  try {
    console.log('Checking 2FA status for:', phone);
    
    const response = await fetch(`${API_BASE}/admin/auth/check-two-factor-status`, {
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

// ✅ FIXED: Get current admin user with token
export const getCurrentAdmin = async (): Promise<any> => {
  try {
    const token = localStorage.getItem('admin_token');
    console.log('Getting current admin, token exists:', !!token);
    
    if (!token) {
      console.log('No token found, user not authenticated');
      return null;
    }
    
    const response = await fetch(`${API_BASE}/admin/me`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('Token expired, clearing session');
        await adminLogout();
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting current admin:', error);
    return null;
  }
};

// ✅ FIXED: Admin logout with token
export const adminLogout = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('admin_token');
    if (token) {
      await fetch(`${API_BASE}/admin/auth/logout`, {
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
    // Always clear local storage
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    console.log('Cleared admin session');
  }
};

// Clear session (alias for adminLogout)
export const clearSession = adminLogout;

// ✅ FIXED: Check session validity
export const checkSession = async (): Promise<{
  authenticated: boolean;
  user?: any;
}> => {
  try {
    const token = localStorage.getItem('admin_token');
    
    // If no token, session is not authenticated
    if (!token) {
      console.log('No admin token found, session not authenticated');
      return { authenticated: false };
    }

    // Verify token with the server
    const response = await fetch(`${API_BASE}/admin/me`, {
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

// ✅ FIXED: Get auth token
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
};

// ✅ FIXED: Check if authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('admin_token');
};