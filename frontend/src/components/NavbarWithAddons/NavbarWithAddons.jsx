import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Search, LogOut, Sparkles, User, Bell, UserPlus, Check } from 'lucide-react';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import TelebirrModal from '../TelebirrModal/TelebirrModal';
import { followService } from '../../services/follow/follow.service';
import { formatDate } from '../../lib/utils';
import styles from './NavbarWithAddons.module.css';

/**
 * NavbarWithAddons:
 * Extends the original Navbar with:
 * - ThemeToggle for switching Dark/Light mode
 * - Clickable User Profile link
 * - Follow Notifications dropdown
 */
export default function NavbarWithAddons({ title, subtitle, user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = e => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch follower notifications
  useEffect(() => {
    if (!user?.id) return;
    followService.getFollowers(user.id, { limit: 6 })
      .then(data => {
        const list = data || [];
        setNotifications(list);
        // check last seen notification time from localStorage
        const lastSeen = localStorage.getItem(`last_notif_seen_${user.id}`);
        if (!lastSeen) {
          setUnreadCount(list.length);
        } else {
          const unread = list.filter(item => new Date(item.followedAt) > new Date(lastSeen));
          setUnreadCount(unread.length);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  const handleOpenNotifications = () => {
    setShowNotifications(prev => !prev);
    if (!showNotifications && user?.id) {
      localStorage.setItem(`last_notif_seen_${user.id}`, new Date().toISOString());
      setUnreadCount(0);
    }
  };

  const [searchTerm, setSearchTerm] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('q') || params.get('semantic') || '';
  });

  useEffect(() => {
    if (location.pathname === '/dashboard') {
      const params = new URLSearchParams(location.search);
      setSearchTerm(params.get('q') || params.get('semantic') || '');
    } else {
      setSearchTerm('');
    }
  }, [location.search, location.pathname]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim() !== '') {
        navigate(`/dashboard?q=${encodeURIComponent(searchTerm)}`);
      } else if (
        location.pathname === '/dashboard' &&
        !new URLSearchParams(location.search).get('semantic')
      ) {
        navigate('/dashboard');
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, navigate, location.pathname]);

  const handleSemanticSearch = e => {
    e.preventDefault();
    if (searchTerm.trim().length >= 3) {
      navigate(`/dashboard?semantic=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleSearchSubmit = e => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/dashboard?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.navbar__titleBlock}>
        <h2 className={styles.navbar__pageTitle}>{title}</h2>
        {subtitle ? (
          <p className={styles.navbar__pageSubtitle}>{subtitle}</p>
        ) : null}
      </div>

      <form className={styles.navbar__search} onSubmit={handleSearchSubmit}>
        <div className={styles['navbar__search-icon']}>
          <Search size={16} />
        </div>
        <input
          id='search'
          type='text'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder='Search questions by keyword…'
          className={styles['navbar__search-input']}
          aria-label='Search questions by keyword'
        />
        {searchTerm.length >= 3 && (
          <button
            type='button'
            onClick={handleSemanticSearch}
            className={styles['navbar__semantic-button']}
            title='Use AI Semantic Search'
          >
            <Sparkles size={14} />
            <span className={styles['navbar__semantic-text']}>AI Search</span>
          </button>
        )}
      </form>

      <div className={styles.navbar__actions}>
        {/* Dark/Light Mode Switcher */}
        <div className={styles.themeToggleWrapper} title='Toggle Dark/Light Mode'>
          <ThemeToggle size='sm' />
        </div>

        {/* Premium Upgrade / Badge */}
        {user && (
          user.is_premium ? (
            <span
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.3rem 0.65rem',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
              }}
            >
              <Sparkles size={13} />
              PREMIUM
            </span>
          ) : (
            <button
              type='button'
              onClick={() => setShowUpgrade(true)}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: 'white',
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '0.35rem 0.75rem',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
              }}
              title='Upgrade to Premium with Telebirr for 5 Birr'
            >
              <Sparkles size={13} color='#facc15' />
              Upgrade (5 Birr)
            </button>
          )
        )}

        {/* Follow Notifications Bell */}
        {user && (
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              type='button'
              onClick={handleOpenNotifications}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.4rem',
                borderRadius: '50%',
                transition: 'all 0.2s',
              }}
              title='Follow Notifications'
              aria-label='Follow Notifications'
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div
                style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: '320px',
                  background: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e2e8f0',
                  zIndex: 9999,
                  overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease-out',
                }}
              >
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                    <Bell size={15} color='#0284c7' />
                    <span>Follow Activity</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {notifications.length} follower{notifications.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                      <UserPlus size={28} color='#cbd5e1' style={{ margin: '0 auto 0.5rem' }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>No follow activity yet</p>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        When people follow you, alerts will appear here.
                      </span>
                    </div>
                  ) : (
                    notifications.map(item => (
                      <Link
                        key={item.id}
                        to={`/profile/${item.id}`}
                        onClick={() => setShowNotifications(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid #f1f5f9',
                          textDecoration: 'none',
                          color: 'inherit',
                          transition: 'background 0.2s',
                        }}
                      >
                        <img
                          src={
                            item.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              `${item.firstName || 'U'} ${item.lastName || ''}`,
                            )}&background=f97316&color=fff`
                          }
                          alt={item.firstName}
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b' }}>
                            <strong>{item.firstName} {item.lastName}</strong> started following you
                          </p>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {item.followedAt ? formatDate(item.followedAt) : ''}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>

                <div
                  style={{
                    padding: '0.65rem',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderTop: '1px solid #f1f5f9',
                  }}
                >
                  <Link
                    to='/profile?tab=followers'
                    onClick={() => setShowNotifications(false)}
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#0284c7',
                      textDecoration: 'none',
                    }}
                  >
                    View All Followers &amp; Following →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User profile link */}
        {user ? (
          <Link
            to='/profile'
            className={styles.navbar__user}
            title='View your profile'
          >
            <span className={styles['navbar__user-name']}>
              {user.firstName} {user.lastName}
            </span>
            <div className={styles['navbar__user-avatar']}>
              <img
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    `${user.firstName || 'User'} ${user.lastName || ''}`,
                  )}&background=f97316&color=fff`
                }
                alt='avatar'
                referrerPolicy='no-referrer'
              />
            </div>
          </Link>
        ) : (
          <div className={styles.navbar__user}>
            <span className={styles['navbar__user-name']}>Guest</span>
          </div>
        )}

        {user && (
          <button
            type='button'
            className={styles.navbar__logout}
            onClick={onLogout}
            aria-label='Logout'
            title='Logout'
          >
            <LogOut size={20} />
          </button>
        )}
      </div>

      <TelebirrModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </header>
  );
}
