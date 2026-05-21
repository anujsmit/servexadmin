const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const DEV_TOKEN_KEY = 'admin_dev_token';
const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Request an OTP for admin login. The backend checks the phone number
 * belongs to an admin account BEFORE sending — returns 403 otherwise.
 */
export async function sendOtp(phone: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to send OTP' }));
    throw new Error(err.message);
  }
}

export async function verifyOtp(
  phone: string,
  otp: string
): Promise<{ user: { role: string; fullName: string }; token?: string }> {
  const res = await fetch(`${API_BASE}/api/admin/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ phone, otp }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Invalid OTP' }));
    throw new Error(err.message);
  }
  const data = await res.json();
  if (!IS_PROD && data?.token && typeof window !== 'undefined') {
    localStorage.setItem(DEV_TOKEN_KEY, data.token);
  }
  return data;
}

export async function clearSession(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEV_TOKEN_KEY);
  }

  await fetch(`${API_BASE}/api/admin/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function checkSession(): Promise<boolean> {
  const devToken = !IS_PROD && typeof window !== 'undefined'
    ? localStorage.getItem(DEV_TOKEN_KEY)
    : null;

  const res = await fetch(`${API_BASE}/api/admin/stats`, {
    method: 'GET',
    headers: devToken ? { Authorization: `Bearer ${devToken}` } : undefined,
    credentials: 'include',
    cache: 'no-store',
  });

  return res.ok;
}
