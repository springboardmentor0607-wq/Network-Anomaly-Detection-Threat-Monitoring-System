import { createContext, useContext, useEffect, useState, useMemo } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'netshield_theme';

/**
 * ThemeProvider
 * Manages dark/light theme preference.
 * - Persists to localStorage under key "netshield_theme"
 * - Applies theme via `data-theme` attribute on <html>
 * - Defaults to "dark" (preserving existing design)
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  // Apply theme to document root whenever it changes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const value = useMemo(() => ({ theme, toggleTheme, isDark: theme === 'dark' }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
