'use client';

import { useState, useEffect, useCallback } from 'react';
import { checkSession, clearSession } from '../_lib/auth';
import { useRouter } from 'next/navigation';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): AuthState & { logout: () => void } {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
  });
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const isAuthenticated = await checkSession().catch(() => false);
      setState({
        isLoading: false,
        isAuthenticated,
      });
    };

    run();
  }, []);

  const logout = useCallback(() => {
    void clearSession().finally(() => {
      router.push('/login');
    });
  }, [router]);

  return { ...state, logout };
}
