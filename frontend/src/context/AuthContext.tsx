import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { apiClient, ApiResponse } from '@/lib/apiClient';
import { ROLE_DASHBOARD_ROUTE } from '@/lib/roles';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string | null;
  phoneNumber: string;
  location: string | null;
  role: string;
}

interface LoginResult {
  user: AuthUser;
  redirectTo: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loginWithPassword: (identifier: string, password: string) => Promise<LoginResult>;
  loginWithOtp: (identifier: string, otpCode: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface TokenPairResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  redirectTo: string;
}

function persistSession(data: TokenPairResponse) {
  localStorage.setItem('dsl_access_token', data.accessToken);
  localStorage.setItem('dsl_refresh_token', data.refreshToken);
  localStorage.setItem('dsl_user', JSON.stringify(data.user));
}

function loadStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('dsl_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser());

  const loginWithPassword = useCallback(async (identifier: string, password: string) => {
    const response = await apiClient.post<ApiResponse<TokenPairResponse>>('/auth/login', {
      identifier,
      password,
    });
    const data = response.data.data!;
    persistSession(data);
    setUser(data.user);
    return { user: data.user, redirectTo: data.redirectTo ?? ROLE_DASHBOARD_ROUTE[data.user.role] ?? '/' };
  }, []);

  const loginWithOtp = useCallback(async (identifier: string, otpCode: string) => {
    const response = await apiClient.post<ApiResponse<TokenPairResponse>>('/auth/otp/verify', {
      identifier,
      otpCode,
    });
    const data = response.data.data!;
    persistSession(data);
    setUser(data.user);
    return { user: data.user, redirectTo: data.redirectTo ?? ROLE_DASHBOARD_ROUTE[data.user.role] ?? '/' };
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('dsl_refresh_token');
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refreshToken });
      } catch {
        // On efface la session locale même si l'appel serveur échoue.
      }
    }
    localStorage.removeItem('dsl_access_token');
    localStorage.removeItem('dsl_refresh_token');
    localStorage.removeItem('dsl_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, loginWithPassword, loginWithOtp, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé à l\'intérieur de AuthProvider.');
  return ctx;
}
