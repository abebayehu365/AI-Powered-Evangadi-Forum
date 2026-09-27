import React, { useState } from 'react';
import { ShieldCheck, Lock, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth/auth.service';
import TelebirrModal from '../TelebirrModal/TelebirrModal';
import styles from './SecurityPlusSettings.module.css';

/**
 * Security Plus PIN Management Settings Component.
 */
export default function SecurityPlusSettings() {
  const { user, isPremium, refreshUser } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showChangeForm, setShowChangeForm] = useState(false);

  const isPinEnabled = Boolean(user?.security_pin_enabled);

  const handleToggle = async e => {
    const nextState = e.target.checked;
    setError(null);
    setMessage(null);

    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    try {
      await authService.togglePin(nextState);
      await refreshUser();
      setMessage(nextState ? 'Security Plus PIN protection enabled.' : 'PIN protection turned off.');
    } catch (err) {
      if (err.message?.includes('set a PIN')) {
        setShowChangeForm(true);
      }
      setError(err.message || 'Failed to update PIN status');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePin = async e => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!pin || pin.length < 4 || pin.length > 6) {
      setError('PIN must be between 4 and 6 digits.');
      return;
    }

    if (pin !== confirmPin) {
      setError('PIN and confirmation PIN do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.setPin(pin, true);
      await refreshUser();
      setMessage('Security PIN updated successfully! Protection is now active.');
      setPin('');
      setConfirmPin('');
      setShowChangeForm(false);
    } catch (err) {
      setError(err.message || 'Failed to save security PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <ShieldCheck size={22} className={styles.icon} />
          <h3 className={styles.title}>Security Plus (PIN Lock)</h3>
        </div>
        <span className={`${styles.badge} ${isPremium ? styles.badgePremium : ''}`}>
          {isPremium ? 'Premium Active' : 'Free Tier'}
        </span>
      </div>

      <p className={styles.desc}>
        Protect your ForumStudy session with a personal 4-6 digit security PIN code.
        Whenever you visit the site, you will be prompted for your PIN before access is granted.
      </p>

      {!isPremium ? (
        <div className={styles.upgradePrompt}>
          <div>
            <strong style={{ display: 'block', marginBottom: '0.2rem' }}>
              Premium Exclusive Feature
            </strong>
            <p className={styles.upgradeText}>
              Security Plus PIN lock, unlimited documents, and QR codes are included with Premium (5 Birr).
            </p>
          </div>
          <button
            type='button'
            className={styles.upgradeBtn}
            onClick={() => setShowUpgradeModal(true)}
          >
            <Sparkles size={16} />
            Upgrade (5 Birr)
          </button>
        </div>
      ) : (
        <>
          <div className={styles.settingsRow}>
            <div>
              <strong>Enable PIN Lock on Return</strong>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Prompt for PIN code when returning to ForumStudy
              </p>
            </div>
            <label className={styles.switch}>
              <input
                type='checkbox'
                checked={isPinEnabled}
                onChange={handleToggle}
                disabled={loading}
              />
              <span className={styles.slider} />
            </label>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <button
              type='button'
              className={styles.upgradeBtn}
              style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' }}
              onClick={() => setShowChangeForm(prev => !prev)}
            >
              <Lock size={15} />
              {showChangeForm ? 'Cancel' : isPinEnabled ? 'Change Security PIN' : 'Set Security PIN'}
            </button>
          </div>

          {showChangeForm && (
            <form onSubmit={handleSavePin} className={styles.pinForm}>
              <strong>{isPinEnabled ? 'Change Your PIN' : 'Create 4-6 Digit Security PIN'}</strong>
              <div className={styles.pinInputRow}>
                <input
                  type='password'
                  maxLength={6}
                  placeholder='Enter PIN'
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  className={styles.pinInput}
                  required
                />
                <input
                  type='password'
                  maxLength={6}
                  placeholder='Confirm PIN'
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className={styles.pinInput}
                  required
                />
                <button
                  type='submit'
                  disabled={loading || pin.length < 4}
                  className={styles.saveBtn}
                >
                  {loading ? <Loader2 size={16} className='animate-spin' /> : 'Save PIN'}
                </button>
              </div>
            </form>
          )}

          {message && <p className={styles.msgSuccess}>✓ {message}</p>}
          {error && <p className={styles.msgError}>⚠ {error}</p>}
        </>
      )}

      <TelebirrModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}
