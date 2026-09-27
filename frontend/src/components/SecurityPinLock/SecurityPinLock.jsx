import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Delete, Loader2, Fingerprint } from 'lucide-react';
import { authService } from '../../services/auth/auth.service';
import { useAuth } from '../../contexts/AuthContext';
import styles from './SecurityPinLock.module.css';

// Phone-style keypad letters (like iPhone PIN screen)
const KEYPAD_LETTERS = {
  '1': '',
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
  '0': '+',
};

export default function SecurityPinLock() {
  const { user, isPinLocked, unlockPin, logout } = useAuth();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shake, setShake] = useState(false);

  const triggerError = useCallback((msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setPin('');
    }, 500);
  }, []);

  const handleKeyPress = useCallback(
    digit => {
      if (loading || pin.length >= 6) return;
      setError(null);
      setPin(prev => prev + digit);
    },
    [loading, pin],
  );

  const handleDelete = useCallback(() => {
    if (loading) return;
    setError(null);
    setPin(prev => prev.slice(0, -1));
  }, [loading]);

  const handleClear = useCallback(() => {
    if (loading) return;
    setError(null);
    setPin('');
  }, [loading]);

  // Hardware keyboard support
  useEffect(() => {
    if (!isPinLocked) return;
    const handleKeyDown = e => {
      if (/^[0-9]$/.test(e.key)) handleKeyPress(e.key);
      else if (e.key === 'Backspace') handleDelete();
      else if (e.key === 'Escape') handleClear();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPinLocked, handleKeyPress, handleDelete, handleClear]);

  // Auto-verify when PIN reaches 4 or 6 digits
  useEffect(() => {
    if (!isPinLocked || loading || pin.length < 4) return;

    const verify = async () => {
      setLoading(true);
      try {
        const res = await authService.verifyPin(pin);
        if (res?.verified) {
          unlockPin();
        }
      } catch (err) {
        if (pin.length === 6) {
          triggerError(err.message || 'Incorrect PIN. Try again.');
        }
        // If 4 digits wrong — maybe user is still entering a 6-digit PIN, just wait
      } finally {
        setLoading(false);
      }
    };

    if (pin.length === 6) {
      verify();
    } else if (pin.length === 4) {
      // Try softly — don't shake yet
      authService.verifyPin(pin)
        .then(res => { if (res?.verified) unlockPin(); })
        .catch(() => {/* user may still be typing */});
    }
  }, [pin, loading, isPinLocked, unlockPin, triggerError]);

  if (!isPinLocked) return null;

  const name = user?.firstName ? `${user.firstName}'s` : 'your';

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="PIN Lock Screen">
      <div className={`${styles.lockCard} ${shake ? styles.shake : ''}`}>

        {/* Icon */}
        <div className={styles.iconWrap}>
          <ShieldCheck size={34} />
        </div>

        {/* Title */}
        <h2 className={styles.title}>Security Plus</h2>
        <p className={styles.subtitle}>
          Enter your PIN to access {name} account
        </p>

        {/* PIN Dots — supports 4 to 6 digits */}
        <div className={styles.dotsRow} aria-label="PIN entry dots">
          {[0, 1, 2, 3, 4, 5].map(idx => (
            <div
              key={idx}
              className={`${styles.dot} ${idx < pin.length ? styles.dotFilled : ''}`}
            />
          ))}
        </div>

        {/* Error or loading */}
        {error && <p className={styles.errorText}>{error}</p>}
        {!error && loading && (
          <p className={styles.errorText} style={{ color: '#38bdf8' }}>
            <Loader2 size={14} className={styles.spinner} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            Verifying…
          </p>
        )}
        {!error && !loading && <p className={styles.errorText} />}

        {/* Numeric keypad — phone style */}
        <div className={styles.keypad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              disabled={loading}
              onClick={() => handleKeyPress(num)}
              className={styles.keyBtn}
              aria-label={`Digit ${num}`}
            >
              {num}
              {KEYPAD_LETTERS[num] && (
                <span className={styles.keyBtnSub}>{KEYPAD_LETTERS[num]}</span>
              )}
            </button>
          ))}

          {/* Row: Clear | 0 | Backspace */}
          <button
            type="button"
            disabled={loading || pin.length === 0}
            onClick={handleClear}
            className={`${styles.keyBtn} ${styles.keyBtnAction}`}
            aria-label="Clear PIN"
          >
            Clear
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleKeyPress('0')}
            className={styles.keyBtn}
            aria-label="Digit 0"
          >
            0
            <span className={styles.keyBtnSub}>{KEYPAD_LETTERS['0']}</span>
          </button>

          <button
            type="button"
            disabled={loading || pin.length === 0}
            onClick={handleDelete}
            className={`${styles.keyBtn} ${styles.keyBtnAction}`}
            aria-label="Delete last digit"
          >
            <Delete size={22} />
          </button>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span style={{ color: '#334155', fontSize: '0.78rem' }}>
            🔒 Premium Security Lock
          </span>
          <button type="button" className={styles.logoutBtn} onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
