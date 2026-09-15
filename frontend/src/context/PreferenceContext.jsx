import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const PreferenceContext = createContext(null);

const DEFAULTS = { theme: 'system', density: 'comfortable', notifications: { riskChanges: true, interventions: true, followUps: true } };

function applyThemeToDocument(theme) {
  const root = document.documentElement;
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && systemDark);
  root.classList.toggle('dark', isDark);
}

function applyDensityToDocument(density) {
  document.documentElement.classList.toggle('density-compact', density === 'compact');
}

export function PreferenceProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState(() => {
    const raw = localStorage.getItem('smartedu_preferences');
    return raw ? JSON.parse(raw) : DEFAULTS;
  });
  const [loaded, setLoaded] = useState(false);

  // Apply immediately (even before the server round-trip) so there's no flash.
  useEffect(() => {
    applyThemeToDocument(preferences.theme);
    applyDensityToDocument(preferences.density);
  }, [preferences.theme, preferences.density]);

  // React to OS-level theme changes when the user has chosen "system".
  useEffect(() => {
    if (preferences.theme !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemeToDocument('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preferences.theme]);

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await api.get('/preferences');
      const prefs = res.data.data.preferences;
      setPreferences(prefs);
      localStorage.setItem('smartedu_preferences', JSON.stringify(prefs));
    } catch (err) {
      // Fall back silently to local/default preferences if the API call fails.
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchPreferences();
    else setLoaded(true);
  }, [isAuthenticated, fetchPreferences]);

  const updatePreferences = useCallback(async (patch) => {
    const next = { ...preferences, ...patch };
    setPreferences(next);
    localStorage.setItem('smartedu_preferences', JSON.stringify(next));
    try {
      const res = await api.put('/preferences', patch);
      const prefs = res.data.data.preferences;
      setPreferences(prefs);
      localStorage.setItem('smartedu_preferences', JSON.stringify(prefs));
    } catch (err) {
      // Keep the optimistic local update even if the server write fails.
    }
  }, [preferences]);

  const resetPreferences = useCallback(async () => {
    setPreferences(DEFAULTS);
    localStorage.setItem('smartedu_preferences', JSON.stringify(DEFAULTS));
    try {
      const res = await api.post('/preferences/reset');
      const prefs = res.data.data.preferences;
      setPreferences(prefs);
      localStorage.setItem('smartedu_preferences', JSON.stringify(prefs));
    } catch (err) {
      // Local reset already applied.
    }
  }, []);

  return (
    <PreferenceContext.Provider value={{ preferences, loaded, updatePreferences, resetPreferences }}>
      {children}
    </PreferenceContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferenceContext);
  if (!ctx) throw new Error('usePreferences must be used within a PreferenceProvider');
  return ctx;
}
