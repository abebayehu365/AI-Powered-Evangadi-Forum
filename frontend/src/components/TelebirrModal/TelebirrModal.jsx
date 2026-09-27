import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  QrCode,
  Lock,
  Files,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  Zap,
  ExternalLink,
  CreditCard,
} from 'lucide-react';
import { paymentService } from '../../services/payment/payment.service';
import { useAuth } from '../../contexts/AuthContext';
import styles from './TelebirrModal.module.css';

const TELEBIRR_MERCHANT_NUMBER = '0941427950';

export default function TelebirrModal({ isOpen, onClose }) {
  const { refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('api'); // 'api' or 'manual'
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionCode, setTransactionCode] = useState('');
  const [apiPhone, setApiPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [apiConfig, setApiConfig] = useState(null);
  const [sandboxSession, setSandboxSession] = useState(null);

  useEffect(() => {
    if (isOpen) {
      paymentService.getTelebirrApiConfigStatus()
        .then(status => setApiConfig(status))
        .catch(() => setApiConfig({ configured: false, mode: 'manual_and_sandbox' }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(TELEBIRR_MERCHANT_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Option 1: Official Telebirr API Checkout
  const handleApiCheckout = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await paymentService.checkoutWithTelebirrApi(apiPhone);
      if (response.toPayUrl) {
        // Redirect to Telebirr Payment Gateway
        window.location.href = response.toPayUrl;
        return;
      }

      if (response.mode === 'sandbox') {
        setSandboxSession(response);
      } else {
        setSuccessData(response);
      }
    } catch (err) {
      console.error('Telebirr API checkout error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to initiate Telebirr API checkout. Try the direct transfer method below.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle sandbox instant verification
  const handleCompleteSandbox = async () => {
    if (!sandboxSession) return;
    setLoading(true);
    setError(null);
    try {
      const response = await paymentService.completeSandboxPayment(sandboxSession.outTradeNo);
      setSuccessData({
        ...response,
        transaction: {
          transactionId: sandboxSession.outTradeNo,
          amount: 5.0,
          currency: 'ETB',
          provider: 'Telebirr Online Gateway (Simulated / Verified)',
          status: 'completed',
          date: new Date().toISOString(),
        },
      });
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to complete sandbox payment');
    } finally {
      setLoading(false);
    }
  };

  // Option 2: Direct Transfer Manual Verification
  const handlePay = async e => {
    e.preventDefault();
    setError(null);

    const cleanPhone = senderPhone.trim();
    if (!cleanPhone || cleanPhone.length < 9) {
      setError('Please enter your 10-digit Telebirr phone number (e.g. 0912345678).');
      return;
    }

    const cleanCode = transactionCode.trim();
    if (!cleanCode || cleanCode.length < 4) {
      setError(
        'Please enter the Telebirr Transaction Number / SMS code from your 5 Birr transfer to 0941427950.',
      );
      return;
    }

    setLoading(true);
    try {
      const response = await paymentService.payWithTelebirr(cleanPhone, cleanCode);
      setSuccessData(response);
      await refreshUser();
    } catch (err) {
      console.error('Telebirr payment error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to submit payment. Please verify your details and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccessData(null);
    setSandboxSession(null);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <button
            type='button'
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label='Close modal'
          >
            <X size={18} />
          </button>

          <div className={styles.brandRow}>
            <span className={styles.telebirrBadge}>telebirr</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.8rem',
                opacity: 0.95,
              }}
            >
              <ShieldCheck size={16} /> Secured Payment
            </span>
          </div>

          <h2 className={styles.title}>Unlock Premium (5 Birr)</h2>
          <p className={styles.subtitle}>
            Pay 5 Birr via Telebirr API Gateway or transfer to 0941427950.
          </p>
        </div>

        {/* Tab Navigation */}
        {!successData && (
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '0.35rem',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <button
              type='button'
              onClick={() => {
                setActiveTab('api');
                setError(null);
              }}
              style={{
                flex: 1,
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'api' ? '#ffffff' : 'transparent',
                fontWeight: activeTab === 'api' ? 700 : 500,
                color: activeTab === 'api' ? '#0284c7' : '#64748b',
                boxShadow: activeTab === 'api' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
            >
              <Zap size={15} />
              Telebirr API Gateway
            </button>
            <button
              type='button'
              onClick={() => {
                setActiveTab('manual');
                setError(null);
              }}
              style={{
                flex: 1,
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'manual' ? '#ffffff' : 'transparent',
                fontWeight: activeTab === 'manual' ? 700 : 500,
                color: activeTab === 'manual' ? '#0284c7' : '#64748b',
                boxShadow: activeTab === 'manual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
            >
              <CreditCard size={15} />
              Direct Transfer (0941427950)
            </button>
          </div>
        )}

        {/* Success View */}
        {successData ? (
          <div className={styles.successBox}>
            <div
              className={styles.successIcon}
              style={{
                background: successData.transaction?.status === 'completed' ? '#dcfce7' : '#fef3c7',
                color: successData.transaction?.status === 'completed' ? '#16a34a' : '#d97706',
              }}
            >
              <ShieldCheck size={36} />
            </div>

            <h3 className={styles.successTitle}>
              {successData.transaction?.status === 'completed'
                ? 'Premium Activated Successfully!'
                : 'Transfer Submitted for Verification!'}
            </h3>
            <p className={styles.successText}>
              {successData.message ||
                'Your payment has been processed and your account status is updated.'}
            </p>

            <div className={styles.receiptCard}>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Provider</span>
                <span className={styles.receiptValue}>
                  {successData.transaction?.provider || 'Telebirr (Ethio Telecom)'}
                </span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Amount</span>
                <span className={styles.receiptValue}>5.00 ETB (Birr)</span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Transaction ID</span>
                <span
                  className={styles.receiptValue}
                  style={{ color: '#0284c7', fontWeight: 800 }}
                >
                  {successData.transaction?.transactionId || 'SUCCESS'}
                </span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Status</span>
                <span
                  className={styles.receiptValue}
                  style={{
                    color:
                      successData.transaction?.status === 'completed' ? '#16a34a' : '#d97706',
                    fontWeight: 700,
                  }}
                >
                  {successData.transaction?.status === 'completed'
                    ? '✓ Active (Lifetime Premium)'
                    : '⏳ Pending Admin Verification'}
                </span>
              </div>
            </div>

            <button
              type='button'
              className={styles.payBtn}
              onClick={handleClose}
              style={{ width: '100%' }}
            >
              Done / Return to Forum
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          /* Payment Form View */
          <div className={styles.content}>
            {error && (
              <div className={styles.errorBanner} role='alert' style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: TELEBIRR API GATEWAY */}
            {activeTab === 'api' && (
              <div>
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1.5px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#15803d' }}>
                      ⚡ Instant Telebirr API Gateway
                    </span>
                    <span
                      style={{
                        background: '#dcfce7',
                        color: '#16a34a',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '6px',
                      }}
                    >
                      {apiConfig?.configured ? 'Live API Connected' : 'Ready (Dev Sandbox)'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#166534' }}>
                    {apiConfig?.configured
                      ? 'Pay directly through the official Ethio Telecom Telebirr Web Portal with automatic verification.'
                      : 'Built with the official telebirrjs integration. You can test instant completion or paste live API keys in backend/.env.'}
                  </p>
                </div>

                {!sandboxSession ? (
                  <form onSubmit={handleApiCheckout} className={styles.form}>
                    <div className={styles.inputGroup}>
                      <label htmlFor='api-phone' className={styles.label}>
                        Telebirr Phone Number (Optional)
                      </label>
                      <div className={styles.phoneInputWrap}>
                        <div className={styles.countryPrefix}>
                          <span>🇪🇹</span>
                          <span>+251</span>
                        </div>
                        <input
                          id='api-phone'
                          type='tel'
                          value={apiPhone}
                          onChange={e => setApiPhone(e.target.value)}
                          placeholder='0912345678'
                          className={styles.phoneInput}
                        />
                      </div>
                    </div>

                    <button
                      type='submit'
                      disabled={loading}
                      className={styles.payBtn}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      }}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={18} className='animate-spin' />
                          Connecting to Telebirr...
                        </>
                      ) : (
                        <>
                          <Zap size={18} />
                          Pay 5 Birr via Telebirr API
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Sandbox simulation card */
                  <div
                    style={{
                      background: '#eff6ff',
                      border: '1.5px solid #bfdbfe',
                      borderRadius: '12px',
                      padding: '1rem',
                      textAlign: 'center',
                    }}
                  >
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af', fontSize: '0.95rem' }}>
                      🧪 Telebirr API Test Session Created
                    </h4>
                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: '#3b82f6' }}>
                      Order ID: <strong>{sandboxSession.outTradeNo}</strong>
                      <br />
                      Amount: <strong>5.00 ETB</strong>
                    </p>
                    <p
                      style={{
                        fontSize: '0.74rem',
                        color: '#64748b',
                        marginBottom: '1rem',
                        lineHeight: 1.4,
                      }}
                    >
                      Live Telebirr credentials (App ID, App Key) are pending in{' '}
                      <code>backend/.env</code>. Click below to simulate an approved payment right
                      now to test all Premium features!
                    </p>
                    <button
                      type='button'
                      onClick={handleCompleteSandbox}
                      disabled={loading}
                      style={{
                        width: '100%',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className='animate-spin' /> Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} /> Simulate Approved Payment (Instant Premium)
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MANUAL DIRECT TRANSFER (0941427950) */}
            {activeTab === 'manual' && (
              <div>
                {/* Step 1: Pay to Number Box */}
                <div
                  style={{
                    background: '#f0f9ff',
                    border: '1.5px solid #bae6fd',
                    borderRadius: '14px',
                    padding: '1rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        color: '#0369a1',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Step 1: Send 5 Birr to this Number
                    </span>
                    <span
                      style={{
                        background: '#e0f2fe',
                        color: '#0284c7',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                      }}
                    >
                      Amount: 5 ETB
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      background: 'white',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #93c5fd',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          color: '#0f172a',
                        }}
                      >
                        {TELEBIRR_MERCHANT_NUMBER}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Receiver: <strong>ForumStudy (Telebirr)</strong>
                      </div>
                    </div>

                    <button
                      type='button'
                      onClick={handleCopyNumber}
                      style={{
                        background: copied ? '#10b981' : '#0284c7',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.78rem', color: '#0369a1' }}>
                    Open your <strong>Telebirr App</strong> (or dial *127#) and transfer 5 Birr to{' '}
                    <strong>{TELEBIRR_MERCHANT_NUMBER}</strong>.
                  </p>
                </div>

                {/* Step 2: Confirm Form */}
                <form onSubmit={handlePay} className={styles.form}>
                  <div className={styles.inputGroup}>
                    <label htmlFor='telebirr-phone' className={styles.label}>
                      Step 2: Enter Your Telebirr Phone Number
                    </label>
                    <div className={styles.phoneInputWrap}>
                      <div className={styles.countryPrefix}>
                        <span>🇪🇹</span>
                        <span>+251</span>
                      </div>
                      <input
                        id='telebirr-phone'
                        type='tel'
                        value={senderPhone}
                        onChange={e => setSenderPhone(e.target.value)}
                        placeholder='0912345678'
                        required
                        className={styles.phoneInput}
                      />
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      The phone number you transferred 5 Birr from
                    </span>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor='telebirr-code' className={styles.label}>
                      Telebirr Transaction Number / SMS Code
                    </label>
                    <input
                      id='telebirr-code'
                      type='text'
                      value={transactionCode}
                      onChange={e => setTransactionCode(e.target.value.toUpperCase())}
                      placeholder='e.g. FT2409... or TB...'
                      required
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    />
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      Check your Telebirr SMS after sending 5 Birr to{' '}
                      <strong>0941427950</strong> and enter the receipt code.
                    </span>
                  </div>

                  <button type='submit' disabled={loading} className={styles.payBtn}>
                    {loading ? (
                      <>
                        <Loader2 size={18} className='animate-spin' />
                        Submitting Payment Details...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        Submit for Verification (5 Birr)
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Benefits footer */}
            <div
              style={{
                marginTop: '1.25rem',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '0.85rem',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#64748b',
                  marginBottom: '0.4rem',
                  textTransform: 'uppercase',
                }}
              >
                Included with Premium:
              </span>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.35rem',
                  fontSize: '0.78rem',
                  color: '#334155',
                }}
              >
                <div>✨ Unlimited RAG PDFs</div>
                <div>🔒 Security PIN Entry</div>
                <div>📱 Q&amp;A QR Codes</div>
                <div>⭐ Golden Crown Badge</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
