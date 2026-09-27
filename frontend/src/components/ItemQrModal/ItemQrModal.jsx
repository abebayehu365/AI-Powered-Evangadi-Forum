import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, QrCode, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import TelebirrModal from '../TelebirrModal/TelebirrModal';
import styles from './ItemQrModal.module.css';

/**
 * QR Code Modal for Questions and Answers.
 * Exclusive to Premium members (or prompts upgrade).
 */
export function ItemQrModal({ isOpen, onClose, title, url, itemType = 'question' }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current && url) {
      QRCode.toCanvas(
        canvasRef.current,
        url,
        {
          width: 240,
          margin: 1.5,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        error => {
          if (error) console.error('Error generating QR code:', error);
        },
      );
    }
  }, [isOpen, url]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `forumstudy-${itemType}-qr.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <button type='button' className={styles.closeBtn} onClick={onClose}>
            <X size={16} />
          </button>
          <h3 className={styles.title}>
            {itemType === 'question' ? 'Question QR Code' : 'Answer QR Code'}
          </h3>
          <p className={styles.subtitle}>
            Scan with any mobile camera to view instantly
          </p>
        </div>

        <div className={styles.body}>
          <div className={styles.qrCanvasWrap}>
            <canvas ref={canvasRef} className={styles.canvas} />
          </div>

          <div className={styles.actions}>
            <button
              type='button'
              className={`${styles.actionBtn} ${styles.actionBtnOutline}`}
              onClick={handleCopyLink}
            >
              {copied ? <Check size={16} color='#16a34a' /> : <Copy size={16} />}
              {copied ? 'Copied Link' : 'Copy Link'}
            </button>

            <button
              type='button'
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              onClick={handleDownload}
            >
              <Download size={16} />
              Download PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * QR Code Trigger Button
 * Shows QR if premium, or opens Telebirr upgrade prompt if free.
 */
export function ItemQrCodeButton({ itemType = 'question', itemId, url, title }) {
  const { isPremium } = useAuth();
  const [showQr, setShowQr] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const fullUrl =
    url ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#${itemType}-${itemId}`
      : '');

  const handleClick = () => {
    if (isPremium) {
      setShowQr(true);
    } else {
      setShowUpgrade(true);
    }
  };

  return (
    <>
      <button
        type='button'
        className={styles.qrTriggerBtn}
        onClick={handleClick}
        title={isPremium ? 'View QR Code' : 'Upgrade to Premium for QR Codes'}
      >
        <QrCode size={15} />
        <span>QR Code</span>
        {!isPremium && <span className={styles.premiumBadge}>PRO</span>}
      </button>

      <ItemQrModal
        isOpen={showQr}
        onClose={() => setShowQr(false)}
        title={title}
        url={fullUrl}
        itemType={itemType}
      />

      <TelebirrModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </>
  );
}
