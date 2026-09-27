import { useState, useEffect, useRef } from 'react';
import { Flag, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { reportService, REPORT_REASONS } from '../../services/report/report.service.js';
import styles from './ReportModal.module.css';

/**
 * ReportModal — Flag button that opens a modal to report content.
 *
 * @param {{ targetType: 'question'|'answer', targetId: number }} props
 */
export default function ReportModal({ targetType, targetId }) {
  const [open, setOpen]           = useState(false);
  const [reason, setReason]       = useState('');
  const [description, setDesc]    = useState('');
  const [status, setStatus]       = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg]   = useState('');
  const dialogRef                 = useRef(null);

  // Trap focus & close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = e => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    dialogRef.current?.querySelector('select')?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!reason) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      await reportService.submit({ targetType, targetId, reason, description });
      setStatus('success');
      setTimeout(() => {
        setOpen(false);
        setStatus('idle');
        setReason('');
        setDesc('');
      }, 2000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err?.response?.data?.msg || 'Failed to submit report. Please try again.',
      );
    }
  };

  return (
    <>
      {/* Flag trigger button */}
      <button
        type='button'
        className={styles.flagBtn}
        onClick={() => setOpen(true)}
        aria-label={`Report this ${targetType}`}
        title={`Report this ${targetType}`}
      >
        <Flag size={14} />
        <span>Report</span>
      </button>

      {/* Backdrop + modal */}
      {open && (
        <div
          className={styles.backdrop}
          onClick={e => e.target === e.currentTarget && setOpen(false)}
          role='dialog'
          aria-modal='true'
          aria-labelledby='report-modal-title'
        >
          <div className={styles.modal} ref={dialogRef}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <AlertTriangle size={18} className={styles.warningIcon} />
                <h3 id='report-modal-title' className={styles.modalTitle}>
                  Report {targetType === 'question' ? 'Question' : 'Answer'}
                </h3>
              </div>
              <button
                type='button'
                className={styles.closeBtn}
                onClick={() => setOpen(false)}
                aria-label='Close report dialog'
              >
                <X size={18} />
              </button>
            </div>

            {status === 'success' ? (
              <div className={styles.successState}>
                <CheckCircle size={40} className={styles.successIcon} />
                <p className={styles.successMsg}>Report submitted. Thank you!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                <label className={styles.label} htmlFor='report-reason'>
                  Reason <span className={styles.required}>*</span>
                </label>
                <select
                  id='report-reason'
                  className={styles.select}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                >
                  <option value=''>Select a reason…</option>
                  {REPORT_REASONS.map(r => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>

                <label className={styles.label} htmlFor='report-desc'>
                  Additional details (optional)
                </label>
                <textarea
                  id='report-desc'
                  className={styles.textarea}
                  value={description}
                  onChange={e => setDesc(e.target.value)}
                  placeholder='Describe the issue…'
                  rows={3}
                  maxLength={500}
                />

                {status === 'error' && (
                  <p className={styles.errorMsg}>{errorMsg}</p>
                )}

                <div className={styles.actions}>
                  <button
                    type='button'
                    className={styles.cancelBtn}
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    className={styles.submitBtn}
                    disabled={!reason || status === 'loading'}
                  >
                    {status === 'loading' ? 'Submitting…' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
