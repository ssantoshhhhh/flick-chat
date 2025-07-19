import { useState } from 'react';
import { api } from '../lib/api';

export function useAuth() {
  const [user, setUser] = useState<any>(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Register (send OTP)
  const register = async (email: string, username: string, display_name: string) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post('/auth/register', { email, username, display_name });
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };

  // Step 2: Verify OTP and set password
  const verifyRegister = async (userId: number, otp: string, password: string) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post('/auth/verify-register', { userId, otp, password });
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };

  // Step 1: Login (send OTP)
  const login = async (usernameOrEmail: string) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post('/auth/login', { usernameOrEmail });
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };

  // Step 2: Verify OTP (and 2FA if required)
  const verifyLogin = async (userId: number, otp: string, twofa_token?: string) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post('/auth/verify-login', { userId, otp, twofa_token });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
      }
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // 2FA setup/verify/disable
  const setup2FA = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.post('/user/2fa/setup');
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };
  const verify2FA = async (token: string) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post('/user/2fa/verify', { token });
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };
  const disable2FA = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.post('/user/2fa/disable');
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };

  return {
    user, loading, error,
    register, verifyRegister,
    login, verifyLogin, logout,
    setup2FA, verify2FA, disable2FA,
    setUser
  };
} 