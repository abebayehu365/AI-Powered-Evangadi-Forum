import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './ThemeToggle.module.css';

/**
 * ThemeToggle — sun/moon icon button that switches dark/light mode.
 * Reads from and writes to ThemeContext.
 *
 * @param {{ size?: 'sm'|'md'|'lg', showLabel?: boolean }} props
 */
export default function ThemeToggle({ size = 'md', showLabel = false }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type='button'
      className={`${styles.toggle} ${styles[`toggle_${size}`]} ${isDark ? styles.dark : styles.light}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className={styles.track}>
        <div className={styles.thumb}>
          {isDark ? (
            <Moon size={size === 'sm' ? 11 : 13} className={styles.icon} />
          ) : (
            <Sun size={size === 'sm' ? 11 : 13} className={styles.icon} />
          )}
        </div>
      </div>
      {showLabel && (
        <span className={styles.label}>{isDark ? 'Dark' : 'Light'}</span>
      )}
    </button>
  );
}
