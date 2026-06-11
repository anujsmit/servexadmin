// app/_lib/auth.ts

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
  backupCodes?: string[];
}

// Admin login with password
export const adminLoginWithPassword = async (
  phone: string, 
  password?: string, 
  twoFactorToken?: string,
  backupCode?: string
): Promise<AdminLoginResponse> => {
  const body: any = { phone };
  if (password) body.password = password;
  if (twoFactorToken) body.twoFactorToken = twoFactorToken;
  if (backupCode) body.backupCode = backupCode;
  
  const response = await fetch(`${API_BASE}/admin/auth/login-with-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMessage = 'Login failed';
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch (e) {
      // If response is not JSON, get text
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      errorMessage = `Server error: ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  if (data.user) {
    localStorage.setItem('admin_user', JSON.stringify(data.user));
  }
  
  if (process.env.NODE_ENV !== 'production' && data.token) {
    localStorage.setItem('admin_token', data.token);
  }
  
  return data;
};

// Check if admin has 2FA enabled - FIXED with better error handling
export const checkAdminTwoFactorStatus = async (phone: string): Promise<{ twoFactorEnabled: boolean }> => {
  try {
    console.log('Checking 2FA status for:', phone);
    console.log('API URL:', `${API_BASE}/admin/auth/check-two-factor-status`);
    
    const response = await fetch(`${API_BASE}/admin/auth/check-two-factor-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
      credentials: 'include',
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      console.error('2FA check failed with status:', response.status);
      return { twoFactorEnabled: false };
    }

    const data = await response.json();
    console.log('2FA status response:', data);
    return { twoFactorEnabled: data.twoFactorEnabled || false };
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return { twoFactorEnabled: false };
  }
};

// Get current admin user
export const getCurrentAdmin = async (): Promise<any> => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE}/admin/me`, {
      credentials: 'include',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
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

// Admin logout
export const adminLogout = async (): Promise<void> => {
  try {
    await fetch(`${API_BASE}/admin/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
  }
};

// Clear session (alias for adminLogout)
export const clearSession = adminLogout;