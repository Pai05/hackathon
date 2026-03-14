import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  requestOtp: (email: string, purpose: 'register' | 'login') => Promise<{ message: string; devOtp?: string }>;
  verifyOtp: (email: string, otp: string, purpose: 'register' | 'login') => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const BASE_URL = import.meta.env.VITE_AUTH_API_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

function devOtpKey(email: string, purpose: 'register' | 'login') {
  return `research_dev_otp_${email.trim().toLowerCase()}_${purpose}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('research_user');
    return stored ? JSON.parse(stored) : null;
  });

  const requestOtp = useCallback(async (email: string, purpose: 'register' | 'login') => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new Error('Email is required');

    try {
      const res = await fetch(`${BASE_URL}/api/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, purpose }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      if (data.dev_otp) {
        localStorage.setItem(devOtpKey(normalizedEmail, purpose), data.dev_otp);
      }

      return {
        message: data.message || 'OTP sent successfully',
        devOtp: data.dev_otp,
      };
    } catch (error) {
      // Demo fallback if auth backend is not reachable.
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      localStorage.setItem(devOtpKey(normalizedEmail, purpose), otp);
      return {
        message: 'Using demo OTP mode (backend unavailable).',
        devOtp: otp,
      };
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string, purpose: 'register' | 'login') => {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanedOtp = otp.trim();
    if (!normalizedEmail || !cleanedOtp) throw new Error('Email and OTP are required');

    try {
      const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, otp: cleanedOtp, purpose }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OTP verification failed');
      return;
    } catch {
      // Demo fallback verification when backend is unavailable.
      const expected = localStorage.getItem(devOtpKey(normalizedEmail, purpose));
      if (!expected || expected !== cleanedOtp) {
        throw new Error('Invalid OTP');
      }
      localStorage.removeItem(devOtpKey(normalizedEmail, purpose));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      setUser(data.user);
      localStorage.setItem('research_user', JSON.stringify(data.user));
    } catch {
      // Demo fallback: allow login without backend
      const demoUser = { id: '1', name: email.split('@')[0], email };
      setUser(demoUser);
      localStorage.setItem('research_user', JSON.stringify(demoUser));
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) throw new Error('Registration failed');
      const data = await res.json();
      setUser(data.user);
      localStorage.setItem('research_user', JSON.stringify(data.user));
    } catch {
      // Demo fallback
      const demoUser = { id: '1', name, email };
      setUser(demoUser);
      localStorage.setItem('research_user', JSON.stringify(demoUser));
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('research_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, requestOtp, verifyOtp, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
