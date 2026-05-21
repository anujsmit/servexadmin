const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const DEV_TOKEN_KEY = 'admin_dev_token';
const IS_PROD = process.env.NODE_ENV === 'production';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const devToken = !IS_PROD && typeof window !== 'undefined'
    ? localStorage.getItem(DEV_TOKEN_KEY)
    : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (devToken) {
    headers.Authorization = `Bearer ${devToken}`;
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
