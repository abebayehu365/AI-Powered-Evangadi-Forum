import { createContext, useContext, useState, useEffect } from 'react';
import '../styles/darkMode.css';

const ThemeContext = createContext(undefined);

/**
 * ThemeProvider — wraps the app to supply dark/light mode.
 *
 * Theme is persisted in localStorage and applied via
 * `document.documentElement.dataset.theme` so CSS variables in darkMode.css
 * automatically cascade to every component.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('fs-theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('fs-theme', theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context.
 * @throws {Error} If used outside ThemeProvider
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
