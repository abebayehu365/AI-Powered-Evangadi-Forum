import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  MessageSquare,
  FileText,
  User,
  ShieldAlert,
  Sparkles,
  Crown,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import TelebirrModal from '../TelebirrModal/TelebirrModal';
import styles from './SidebarWithAddons.module.css';

export default function SidebarWithAddons() {
  const navigate = useNavigate();
  const { user, logout, isPremium, isAdmin } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
    { icon: MessageSquare, label: 'Your Topics', path: '/my-questions' },
    { icon: FileText, label: 'Knowledge Base', path: '/rag-documents' },
    { icon: Crown, label: 'Plans & Pricing', path: '/plans' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  if (isAdmin) {
    navItems.push({
      icon: ShieldAlert,
      label: 'Admin Panel',
      path: '/admin',
    });
  }

  return (
    <>
      <aside className={styles.sidebar}>
        <div className={styles.sidebar__header}>
          <div
            className={styles.sidebar__branding}
            onClick={() => navigate('/')}
            title='Go to Home'
            role='button'
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/');
              }
            }}
          >
            <div className={styles.sidebar__logo} aria-hidden>
              <MessageSquare className={styles['sidebar__logo-icon']} size={20} />
            </div>
            <div className={styles.sidebar__brandCopy}>
              <p className={styles.sidebar__title}>Evangadi Forum</p>
              <p className={styles.sidebar__tagline}>
                Learn together. Ask with context.
              </p>
            </div>
          </div>
        </div>

        <nav className={styles.sidebar__nav} aria-label='Main navigation'>
          <p className={styles.sidebar__navLabel}>Navigate</p>
          {navItems.map(item => (
            <div key={item.path} className={styles['sidebar__nav-item-wrapper']}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `${styles.sidebar__link} ${
                    isActive
                      ? styles['sidebar__link--active']
                      : styles['sidebar__link--inactive']
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      size={18}
                      className={`${styles.sidebar__icon} ${
                        isActive
                          ? styles['sidebar__icon--active']
                          : styles['sidebar__icon--inactive']
                      }`}
                      style={item.path === '/admin' ? { color: '#ef4444' } : {}}
                    />
                    <span>{item.label}</span>
                    {item.path === '/admin' && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          background: '#fee2e2',
                          color: '#dc2626',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '9999px',
                        }}
                      >
                        ADMIN
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </div>
          ))}

          {/* Premium Status Banner in Sidebar */}
          <div className={styles.sidebar__premiumWrap}>
            {isPremium ? (
              <div className={styles.sidebar__premiumBanner}>
                <Sparkles size={16} color='#f59e0b' />
                <div>
                  <strong style={{ fontSize: '0.8rem', color: '#d97706', display: 'block' }}>
                    Premium Member
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Unlimited docs &amp; QR codes
                  </span>
                </div>
              </div>
            ) : (
              <button
                type='button'
                onClick={() => setShowUpgradeModal(true)}
                className={styles.sidebar__upgradeBtn}
              >
                <Sparkles size={15} color='#facc15' />
                <span>Upgrade (5 Birr)</span>
              </button>
            )}
          </div>
        </nav>

        <div className={styles.sidebar__footer}>
          <button
            type='button'
            onClick={() => navigate('/questions/ask')}
            className={styles.sidebar__button}
          >
            New Question
          </button>

          <div className={styles.themeToggleRow}>
            <span className={styles.themeToggleLabel}>Appearance</span>
            <ThemeToggle size='sm' showLabel />
          </div>

          <div className={styles.sidebar__user}>
            <div
              className={styles.sidebar__profile}
              onClick={() => navigate('/profile')}
              role='button'
              tabIndex={0}
              title='View your profile'
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/profile');
                }
              }}
            >
              <div className={styles.sidebar__avatar}>
                <img
                  src={
                    user?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      `${user?.firstName || 'User'} ${user?.lastName || ''}`,
                    )}&background=f97316&color=fff`
                  }
                  alt={`${user?.firstName} ${user?.lastName}`}
                  className={styles['sidebar__avatar-image']}
                  referrerPolicy='no-referrer'
                />
              </div>
              <div className={styles.sidebar__info}>
                <p className={styles.sidebar__name}>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className={styles.sidebar__role}>
                  {isPremium ? '✨ Premium Learner' : 'Learner'} • Profile
                </p>
              </div>
            </div>

            <button
              type='button'
              onClick={logout}
              className={styles.sidebar__logout}
              title='Logout'
              aria-label='Logout'
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <TelebirrModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}
