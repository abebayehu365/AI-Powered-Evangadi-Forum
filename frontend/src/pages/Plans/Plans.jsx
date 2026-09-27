import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, X, Sparkles, Zap, BookOpen, ShieldCheck, QrCode,
  FileText, Star, Users, Rocket, Crown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import TelebirrModal from '../../components/TelebirrModal/TelebirrModal';
import styles from './Plans.module.css';

const FREE_FEATURES = [
  { icon: BookOpen,   text: 'Ask & answer questions', included: true },
  { icon: Users,      text: 'Follow other learners',  included: true },
  { icon: Star,       text: 'Like & rate content',    included: true },
  { icon: FileText,   text: 'RAG knowledge base',     included: true, note: 'Up to 3 documents' },
  { icon: QrCode,     text: 'QR codes on Q&A',        included: false },
  { icon: ShieldCheck,text: 'Security PIN lock',       included: false },
  { icon: FileText,   text: 'Unlimited RAG documents', included: false },
  { icon: Zap,        text: 'Priority AI answers',     included: false },
];

const PREMIUM_FEATURES = [
  { icon: BookOpen,   text: 'Ask & answer questions', included: true },
  { icon: Users,      text: 'Follow other learners',  included: true },
  { icon: Star,       text: 'Like & rate content',    included: true },
  { icon: FileText,   text: 'RAG knowledge base',     included: true, note: 'Unlimited documents' },
  { icon: QrCode,     text: 'QR codes on every Q&A',  included: true, note: 'Share instantly' },
  { icon: ShieldCheck,text: 'Security Plus PIN lock',  included: true, note: 'Protect your account' },
  { icon: Zap,        text: 'Priority AI answers',     included: true },
  { icon: Crown,      text: 'Premium badge',           included: true, note: 'Stand out in the community' },
];

export default function Plans() {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const [showPayment, setShowPayment] = useState(false);

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroBadge}>
          <Sparkles size={14} />
          Simple Pricing
        </div>
        <h1 className={styles.heroTitle}>
          Unlock the full ForumStudy<br />experience
        </h1>
        <p className={styles.heroSubtitle}>
          Everything you need to learn better, protected, and at scale.
        </p>
      </div>

      {/* Plans grid */}
      <div className={styles.grid}>

        {/* ── FREE PLAN ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.planLabel}>Free</span>
            <div className={styles.priceRow}>
              <span className={styles.priceAmount}>0</span>
              <span className={styles.priceCurrency}>Birr</span>
            </div>
            <p className={styles.planDesc}>
              The essentials to get started with collaborative learning.
            </p>
          </div>

          <ul className={styles.featureList}>
            {FREE_FEATURES.map((f, i) => (
              <li key={i} className={`${styles.featureItem} ${!f.included ? styles.featureItemDim : ''}`}>
                <span className={`${styles.featureIcon} ${f.included ? styles.featureIconCheck : styles.featureIconX}`}>
                  {f.included ? <Check size={14} /> : <X size={14} />}
                </span>
                <span className={styles.featureText}>
                  {f.text}
                  {f.note && <span className={styles.featureNote}> — {f.note}</span>}
                </span>
              </li>
            ))}
          </ul>

          <div className={styles.cardFooter}>
            {user ? (
              <button className={styles.btnSecondary} onClick={() => navigate('/dashboard')}>
                Continue Free
              </button>
            ) : (
              <button className={styles.btnSecondary} onClick={() => navigate('/auth')}>
                Get Started Free
              </button>
            )}
          </div>
        </div>

        {/* ── PREMIUM PLAN ── */}
        <div className={`${styles.card} ${styles.cardPremium}`}>
          <div className={styles.premiumRibbon}>
            <Crown size={12} /> Most Popular
          </div>

          <div className={styles.cardHeader}>
            <span className={styles.planLabel}>
              <Sparkles size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Premium
            </span>
            <div className={styles.priceRow}>
              <span className={styles.priceAmount}>5</span>
              <span className={styles.priceCurrency}>Birr</span>
              <span className={styles.priceFreq}>/ lifetime</span>
            </div>
            <p className={styles.planDesc}>
              One-time payment. All premium features unlocked forever.
            </p>
          </div>

          <ul className={styles.featureList}>
            {PREMIUM_FEATURES.map((f, i) => (
              <li key={i} className={styles.featureItem}>
                <span className={`${styles.featureIcon} ${styles.featureIconCheckPremium}`}>
                  <Check size={14} />
                </span>
                <span className={styles.featureText}>
                  {f.text}
                  {f.note && <span className={styles.featureNote}> — {f.note}</span>}
                </span>
              </li>
            ))}
          </ul>

          <div className={styles.cardFooter}>
            {isPremium ? (
              <div className={styles.alreadyPremium}>
                <ShieldCheck size={18} />
                You are Premium ✓
              </div>
            ) : (
              <button
                className={styles.btnPrimary}
                onClick={() => user ? setShowPayment(true) : navigate('/auth')}
              >
                <Rocket size={16} />
                {user ? 'Upgrade for 5 Birr' : 'Sign up & Upgrade'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* How payment works */}
      <div className={styles.howSection}>
        <h2 className={styles.howTitle}>How Premium Works</h2>
        <div className={styles.stepsRow}>
          {[
            { step: '1', title: 'Choose Telebirr Method', desc: 'Pay directly via online Telebirr Gateway or transfer 5 Birr to 0941427950' },
            { step: '2', title: 'Instant / Receipt Code', desc: 'Online checkout activates automatically; manual transfers use your SMS receipt code' },
            { step: '3', title: 'Secure Verification', desc: 'Instant automatic activation for API payments or quick admin approval' },
            { step: '4', title: 'Enjoy Premium!', desc: 'Unlimited RAG PDFs, PIN security, Q&A QR codes & golden badge' },
          ].map(s => (
            <div key={s.step} className={styles.step}>
              <div className={styles.stepNum}>{s.step}</div>
              <strong className={styles.stepTitle}>{s.title}</strong>
              <p className={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className={styles.faqSection}>
        <h2 className={styles.howTitle}>Common Questions</h2>
        <div className={styles.faqGrid}>
          {[
            {
              q: 'Is this a one-time payment?',
              a: 'Yes! Pay 5 Birr once and Premium is yours forever. No subscriptions, no renewals.'
            },
            {
              q: 'How fast is approval?',
              a: 'Usually within a few hours. Our admin manually verifies each Telebirr transaction.'
            },
            {
              q: 'What is the Security PIN?',
              a: 'A 4–6 digit PIN that locks your account when you leave. Only you can unlock it — even on shared devices.'
            },
            {
              q: 'What are QR codes for?',
              a: 'Every question and answer gets its own QR code so you can share directly to classmates or print for study groups.'
            },
          ].map((faq, i) => (
            <div key={i} className={styles.faqItem}>
              <strong className={styles.faqQ}>{faq.q}</strong>
              <p className={styles.faqA}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      <TelebirrModal isOpen={showPayment} onClose={() => setShowPayment(false)} />
    </div>
  );
}
