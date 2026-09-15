import React, { createContext, useContext, useState, useCallback } from 'react';
import api, { apiErrorMessage } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('smartedu_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [profile, setProfile] = useState(() => {
    const raw = localStorage.getItem('smartedu_profile');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user: u, profile: p } = res.data.data;
      localStorage.setItem('smartedu_token', token);
      localStorage.setItem('smartedu_user', JSON.stringify(u));
      localStorage.setItem('smartedu_profile', JSON.stringify(p || null));
      setUser(u);
      setProfile(p || null);
      return u;
    } catch (err) {
      const msg = apiErrorMessage(err, 'Login failed.');
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const registerStudent = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', payload);
      const { token, user: u, profile: p } = res.data.data;
      localStorage.setItem('smartedu_token', token);
      localStorage.setItem('smartedu_user', JSON.stringify(u));
      localStorage.setItem('smartedu_profile', JSON.stringify(p || null));
      setUser(u);
      setProfile(p || null);
      return u;
    } catch (err) {
      const msg = apiErrorMessage(err, 'Registration failed.');
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('smartedu_token');
    localStorage.removeItem('smartedu_user');
    localStorage.removeItem('smartedu_profile');
    setUser(null);
    setProfile(null);
  }, []);

  /** Marks the guided tour complete (Skip/Finish). Never call this to hide the "Replay" entry point — that stays available regardless. */
  const completeOnboarding = useCallback(async () => {
    try {
      const res = await api.put('/auth/onboarding-complete');
      const u = res.data.data.user;
      localStorage.setItem('smartedu_user', JSON.stringify(u));
      setUser(u);
    } catch (err) {
      // Non-critical — if this fails the tour will simply reappear next login.
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const { user: u, profile: p } = res.data.data;
      localStorage.setItem('smartedu_user', JSON.stringify(u));
      localStorage.setItem('smartedu_profile', JSON.stringify(p || null));
      setUser(u);
      setProfile(p || null);
      return { user: u, profile: p };
    } catch (err) {
      return null;
    }
  }, []);

  const value = { user, profile, loading, error, login, registerStudent, logout, completeOnboarding, refreshProfile, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
