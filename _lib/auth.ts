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
export async function adminLoginWithPassword(phone: string, password: string, twoFactorToken?: string, backupCode?: string) {
  const response = await fetch(`${API_BASE}/admin/auth/login-with-password`, {  // Changed to match backend route
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password, twoFactorToken, backupCode }),
    credentials: 'include', // Important for cookies
  });
  
  const data = await response.json();
  console.log('Login response:', { status: response.status, data }); // Debug log
  
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  
  return data;
}


// Check if admin has 2FA enabled
export const checkAdminTwoFactorStatus = async (phone: string): Promise<{ twoFactorEnabled: boolean }> => {
  try {
    console.log('Checking 2FA status for:', phone);
    
    const response = await fetch(`${API_BASE}/admin/auth/check-two-factor-status`, {  // This one is correct
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

// Get current admin user
export const getCurrentAdmin = async (): Promise<any> => {
  try {
    const token = localStorage.getItem('admin_token');
    console.log('Getting current admin, token exists:', !!token);
    
    const response = await fetch(`${API_BASE}/admin/me`, {
      credentials: 'include',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('Token expired, logging out');
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
    const token = localStorage.getItem('admin_token');
    await fetch(`${API_BASE}/admin/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    console.log('Cleared admin session');
  }
};

// Clear session (alias for adminLogout)
export const clearSession = adminLogout;