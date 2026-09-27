import { useState, useEffect } from 'react';
import { ShieldCheck, Mail, KeyRound, Loader2, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_ADDON_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3778';

export default function SetupAdmin() {
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // On load, quietly probe if setup is still available (410 = already done)
  useEffect(() => {
    axios.post(`${API}/api/auth/setup-admin`, {})
      .catch(err => {
        if (err?.response?.status === 410) {
          setAlreadyDone(true);
        }
      })
      .finally(() => setChecking(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await axios.post(`${API}/api/auth/setup-admin`, {
        email: email.trim().toLowerCase(),
        secret: secret.trim(),
      });
      if (res.data.success) {
        setSuccess(res.data.message);
        setAlreadyDone(true);
      }
    } catch (err) {
      if (err?.response?.status === 410) {
        setAlreadyDone(true);
      } else {
        setError(err?.response?.data?.message || 'Setup failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.8rem 0.85rem 0.8rem 2.6rem',
    background: 'rgba(30,41,59,0.8)',
    border: '1px solid rgba(99,102,241,0.25)',
    borderRadius: '10px',
    color: '#f1f5f9',
    fontSize: '0.92rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      padding: '2rem',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
          }}>
            <ShieldCheck size={30} color="#fff" />
          </div>
          <h1 style={{ color: '#f8fafc', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.4rem' }}>
            Platform Setup
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
            First-time administrator initialization
          </p>
        </div>

        {/* Loading probe */}
        {checking && (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#64748b' }}>
            <Loader2 size={28} style={{ animation: 'spin 0.8s linear infinite', marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Checking setup status…</p>
          </div>
        )}

        {/* Already setup */}
        {!checking && alreadyDone && !success && (
          <div style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '14px',
            padding: '1.5rem',
            textAlign: 'center',
          }}>
            <Lock size={40} color="#818cf8" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
            <p style={{ color: '#a5b4fc', fontWeight: 700, margin: '0 0 0.4rem', fontSize: '1rem' }}>
              Setup Complete
            </p>
            <p style={{ color: '#64748b', fontSize: '0.83rem', margin: 0 }}>
              This platform already has an administrator. This setup page is no longer active.
            </p>
          </div>
        )}

        {/* Success state */}
        {!checking && success && (
          <div style={{
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.35)',
            borderRadius: '14px',
            padding: '1.5rem',
            textAlign: 'center',
          }}>
            <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
            <p style={{ color: '#6ee7b7', fontWeight: 700, margin: '0 0 0.6rem', fontSize: '0.95rem' }}>
              {success}
            </p>
            <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>
              👉 Log out and log back in to access the <strong style={{ color: '#a5b4fc' }}>Admin Dashboard</strong>.
            </p>
          </div>
        )}

        {/* Setup form */}
        {!checking && !alreadyDone && !success && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Your Account Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#475569" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  id="setup-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.25)'}
                />
              </div>
            </div>

            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Authorization Key
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={15} color="#475569" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  id="setup-secret"
                  type="password"
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                  placeholder="Enter authorization key"
                  required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.25)'}
                />
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.28)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                display: 'flex', gap: '0.6rem', alignItems: 'center',
              }}>
                <AlertTriangle size={15} color="#f87171" style={{ flexShrink: 0 }} />
                <span style={{ color: '#fca5a5', fontSize: '0.83rem' }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? 'rgba(99,102,241,0.45)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', border: 'none', borderRadius: '10px',
                padding: '0.9rem', fontWeight: 700, fontSize: '0.92rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,0.35)',
                transition: 'all 0.18s',
              }}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Authorizing…</>
                : <><ShieldCheck size={16} /> Initialize Admin Account</>
              }
            </button>

            <p style={{ color: '#334155', fontSize: '0.73rem', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
              This page is only accessible once. After an admin is created, it automatically disables.
            </p>
          </form>
        )}
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
