import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  User, MessageSquare, BookOpen, Users, UserPlus,
  Calendar, ChevronRight, Edit3, CheckCircle, X, Loader2,
  Camera, Upload, Link2, AtSign, Sparkles, ShieldCheck
} from 'lucide-react';
import { profileService } from '../../services/profile/profile.service.js';
import { followService } from '../../services/follow/follow.service.js';
import FollowButton from '../../components/FollowButton/FollowButton';
import SecurityPlusSettings from '../../components/SecurityPlusSettings/SecurityPlusSettings';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Profile.module.css';

const AVATAR_PRESETS = [
  { label: '🧑‍💻 Coder', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Coder&backgroundColor=b6e3f4' },
  { label: '🚀 Astro', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Astro&backgroundColor=c0aede' },
  { label: '🐱 Pixel', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Pixel&backgroundColor=ffd5dc' },
  { label: '🎓 Scholar', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=d1d4f9' },
  { label: '⚡ Spark', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe&backgroundColor=ffdfbf' },
  { label: '🌟 Pro', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Alex&backgroundColor=c0aede' },
];

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const activeUserId = userId || currentUser?.id;

  const [profile, setProfile]             = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [editing, setEditing]             = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName]   = useState('');
  const [editUsername, setEditUsername]   = useState('');
  const [editBio, setEditBio]             = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving]               = useState(false);
  const [saved, setSaved]                 = useState(false);
  
  // Tab state: 'questions' | 'answers' | 'followers' | 'following' | 'security'
  const initialTab = new URLSearchParams(location.search).get('tab') || 'questions';
  const [activeTab, setTab]               = useState(initialTab);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [followListLoading, setFollowListLoading] = useState(false);

  const fileInputRef = useRef(null);
  const isOwn = !userId || currentUser?.id === Number(userId);

  useEffect(() => {
    if (!activeUserId) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    profileService.get(activeUserId)
      .then(data => {
        if (!cancelled) {
          setProfile(data);
          setEditBio(data.bio || '');
          setEditUsername(data.username || '');
          setEditFirstName(data.firstName || '');
          setEditLastName(data.lastName || '');
          setEditAvatarUrl(data.avatarUrl || '');
        }
      })
      .catch(err => {
        if (!cancelled)
          setError(err?.response?.data?.msg || 'Failed to load profile.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [activeUserId]);

  // Fetch followers and following when respective tab is active (Must be BEFORE any early returns)
  useEffect(() => {
    if (!activeUserId) return;
    if (activeTab === 'followers') {
      setFollowListLoading(true);
      followService.getFollowers(activeUserId)
        .then(data => setFollowersList(data || []))
        .catch(err => console.error('Failed to load followers:', err))
        .finally(() => setFollowListLoading(false));
    } else if (activeTab === 'following') {
      setFollowListLoading(true);
      followService.getFollowing(activeUserId)
        .then(data => setFollowingList(data || []))
        .catch(err => console.error('Failed to load following:', err))
        .finally(() => setFollowListLoading(false));
    }
  }, [activeUserId, activeTab]);

  const openEdit = () => {
    if (!profile) return;
    setEditFirstName(profile.firstName || '');
    setEditLastName(profile.lastName || '');
    setEditUsername(profile.username || '');
    setEditBio(profile.bio || '');
    setEditAvatarUrl(profile.avatarUrl || '');
    setAvatarPreview(profile.avatarUrl || '');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setAvatarPreview(profile?.avatarUrl || '');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditAvatarUrl(reader.result);
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url) => {
    setEditAvatarUrl(url);
    setAvatarPreview(url);
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const updated = await profileService.update({
        username: editUsername,
        firstName: editFirstName,
        lastName: editLastName,
        bio: editBio,
        avatarUrl: editAvatarUrl || undefined,
      });

      setProfile(updated);
      setSaved(true);
      setEditing(false);

      // Sync user to localStorage so Navbar displays updated name & avatar
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const userObj = JSON.parse(stored);
          const newUserObj = {
            ...userObj,
            firstName: updated.firstName,
            lastName: updated.lastName,
            username: updated.username,
            avatar: updated.avatarUrl || userObj.avatar,
          };
          localStorage.setItem('user', JSON.stringify(newUserObj));
          window.dispatchEvent(new Event('storage'));
        } catch {}
      }

      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(err?.response?.data?.msg || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const currentDisplayAvatar =
    (editing && avatarPreview) ||
    profile?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${profile?.firstName || 'U'} ${profile?.lastName || ''}`,
    )}&background=f97316&color=fff&size=128`;

  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '';

  if (loading) {
    return (
      <div className={styles.centered}>
        <Loader2 size={36} className={styles.spinner} />
        <p className={styles.centeredText}>Loading profile…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.centered}>
        <p className={styles.errorText}>{error || 'Profile not found'}</p>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Top controls */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <ThemeToggle showLabel />
      </div>

      {/* Hero card */}
      <div className={styles.heroCard}>
        <div className={styles.heroBanner} aria-hidden />

        <div className={styles.heroBody}>
          {/* Avatar with optional quick-camera button */}
          <div className={styles.avatarWrapper}>
            <img
              src={currentDisplayAvatar}
              alt={`${profile.firstName} ${profile.lastName}`}
              className={styles.avatar}
              referrerPolicy='no-referrer'
            />
            {isOwn && (
              <button
                type='button'
                className={styles.avatarBadgeBtn}
                onClick={editing ? () => fileInputRef.current?.click() : openEdit}
                title='Change profile photo'
                aria-label='Change profile photo'
              >
                <Camera size={14} />
              </button>
            )}
            {saved && (
              <div className={styles.savedBadge}>
                <CheckCircle size={14} /> Saved
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div className={styles.heroInfo}>
            <div className={styles.nameLine}>
              <div>
                <h1 className={styles.name}>
                  {profile.firstName} {profile.lastName}
                </h1>
                {profile.username && (
                  <p className={styles.usernameTag}>
                    <AtSign size={13} />
                    {profile.username}
                  </p>
                )}
              </div>

              {isOwn && (
                <button
                  type='button'
                  className={styles.editBtn}
                  onClick={editing ? cancelEdit : openEdit}
                  aria-label='Edit profile'
                >
                  {editing ? <X size={16} /> : <Edit3 size={16} />}
                  <span>{editing ? 'Close' : 'Edit Profile'}</span>
                </button>
              )}
            </div>

            <div className={styles.joinDate}>
              <Calendar size={13} />
              <span>Joined {joinDate}</span>
            </div>

            {/* View-mode Bio */}
            {!editing && (
              <p className={styles.bio}>
                {profile.bio || (isOwn ? 'Add a bio to tell others about yourself.' : 'No bio yet.')}
              </p>
            )}
          </div>

          {/* Follow button (only for other users) */}
          {!isOwn && currentUser && (
            <div className={styles.followArea}>
              <FollowButton
                userId={profile.id}
                initialIsFollowing={profile.isFollowing}
                initialFollowerCount={profile.stats?.followers || 0}
              />
            </div>
          )}
        </div>

        {/* ── Integrated Fast Edit Drawer ──────────────────────────────── */}
        {editing && isOwn && (
          <form className={styles.editDrawer} onSubmit={handleSaveProfile}>
            <div className={styles.editDrawerHeader}>
              <div className={styles.editDrawerTitle}>
                <Edit3 size={18} className={styles.editIcon} />
                <span>Edit Profile</span>
              </div>
              <span className={styles.editDrawerSubtitle}>
                Update your username, profile image, and bio.
              </span>
            </div>

            {/* Avatar Selector Options */}
            <div className={styles.editSection}>
              <label className={styles.editLabel}>Profile Image</label>

              <div className={styles.avatarTools}>
                {/* Upload from device */}
                <input
                  type='file'
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept='image/*'
                  style={{ display: 'none' }}
                />
                <button
                  type='button'
                  className={styles.uploadBtn}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} />
                  <span>Upload from Computer</span>
                </button>

                {/* Direct URL input */}
                <div className={styles.urlInputWrap}>
                  <Link2 size={14} className={styles.urlInputIcon} />
                  <input
                    type='url'
                    className={styles.urlInput}
                    placeholder='Or paste image URL (https://…)'
                    value={editAvatarUrl}
                    onChange={(e) => {
                      setEditAvatarUrl(e.target.value);
                      setAvatarPreview(e.target.value);
                    }}
                  />
                </div>
              </div>

              {/* Instant Preset Avatars */}
              <div className={styles.presetGroup}>
                <span className={styles.presetHeading}>
                  <Sparkles size={12} /> Instant Avatars:
                </span>
                <div className={styles.presetChips}>
                  {AVATAR_PRESETS.map((p) => (
                    <button
                      key={p.url}
                      type='button'
                      className={`${styles.presetChip} ${editAvatarUrl === p.url ? styles.presetChipActive : ''}`}
                      onClick={() => handleSelectPreset(p.url)}
                    >
                      <img src={p.url} alt={p.label} className={styles.presetImg} />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Username & Names Grid */}
            <div className={styles.editGrid}>
              {/* Username */}
              <div className={styles.fieldGroup}>
                <label className={styles.editLabel} htmlFor='profile-username'>
                  Username
                </label>
                <div className={styles.inputWithPrefix}>
                  <span className={styles.inputPrefix}>@</span>
                  <input
                    id='profile-username'
                    type='text'
                    className={styles.textInput}
                    placeholder='your_username'
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    maxLength={30}
                  />
                </div>
                <span className={styles.fieldHint}>Letters, numbers, and underscores only.</span>
              </div>

              {/* First Name */}
              <div className={styles.fieldGroup}>
                <label className={styles.editLabel} htmlFor='profile-first-name'>
                  First Name
                </label>
                <input
                  id='profile-first-name'
                  type='text'
                  className={styles.textInput}
                  placeholder='First name'
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  maxLength={50}
                  required
                />
              </div>

              {/* Last Name */}
              <div className={styles.fieldGroup}>
                <label className={styles.editLabel} htmlFor='profile-last-name'>
                  Last Name
                </label>
                <input
                  id='profile-last-name'
                  type='text'
                  className={styles.textInput}
                  placeholder='Last name'
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  maxLength={50}
                  required
                />
              </div>
            </div>

            {/* Bio textarea */}
            <div className={styles.fieldGroup}>
              <label className={styles.editLabel} htmlFor='profile-bio'>
                Bio
              </label>
              <textarea
                id='profile-bio'
                className={styles.bioTextarea}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder='Tell other learners what you are studying or working on…'
                rows={3}
                maxLength={280}
              />
              <span className={styles.charCount}>{editBio.length}/280</span>
            </div>

            {/* Action buttons */}
            <div className={styles.editActions}>
              <button
                type='button'
                className={styles.cancelBtn}
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type='submit'
                className={styles.saveBtn}
                disabled={saving}
              >
                {saving ? <Loader2 size={16} className={styles.spinner} /> : null}
                <span>{saving ? 'Saving Changes…' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Stats row with interactive tab clicking */}
      <div className={styles.statsRow}>
        {[
          { tab: 'questions', icon: MessageSquare, label: 'Questions',  value: profile.stats?.questions || 0 },
          { tab: 'answers',   icon: BookOpen,      label: 'Answers',    value: profile.stats?.answers || 0 },
          { tab: 'followers', icon: Users,         label: 'Followers',  value: profile.stats?.followers || 0 },
          { tab: 'following', icon: UserPlus,      label: 'Following',  value: profile.stats?.following || 0 },
        ].map(s => (
          <div
            key={s.label}
            className={`${styles.statCard} ${activeTab === s.tab ? styles.statCardActive : ''}`}
            onClick={() => setTab(s.tab)}
            style={{ cursor: 'pointer' }}
            title={`View ${s.label}`}
          >
            <div className={styles.statIcon}><s.icon size={20} /></div>
            <span className={styles.statValue}>{s.value.toLocaleString()}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Activity tabs */}
      <div className={styles.activitySection}>
        <div className={styles.tabs} role='tablist'>
          <button
            role='tab'
            aria-selected={activeTab === 'questions'}
            className={`${styles.tab} ${activeTab === 'questions' ? styles.tabActive : ''}`}
            onClick={() => setTab('questions')}
          >
            <MessageSquare size={15} /> Questions ({profile.stats?.questions || 0})
          </button>
          <button
            role='tab'
            aria-selected={activeTab === 'answers'}
            className={`${styles.tab} ${activeTab === 'answers' ? styles.tabActive : ''}`}
            onClick={() => setTab('answers')}
          >
            <BookOpen size={15} /> Answers ({profile.stats?.answers || 0})
          </button>
          <button
            role='tab'
            aria-selected={activeTab === 'followers'}
            className={`${styles.tab} ${activeTab === 'followers' ? styles.tabActive : ''}`}
            onClick={() => setTab('followers')}
          >
            <Users size={15} /> Followers ({profile.stats?.followers || 0})
          </button>
          <button
            role='tab'
            aria-selected={activeTab === 'following'}
            className={`${styles.tab} ${activeTab === 'following' ? styles.tabActive : ''}`}
            onClick={() => setTab('following')}
          >
            <UserPlus size={15} /> Following ({profile.stats?.following || 0})
          </button>
          {isOwn && (
            <button
              role='tab'
              aria-selected={activeTab === 'security'}
              className={`${styles.tab} ${activeTab === 'security' ? styles.tabActive : ''}`}
              onClick={() => setTab('security')}
            >
              <ShieldCheck size={15} /> Security PIN
            </button>
          )}
        </div>

        {/* TAB 1: Questions list */}
        {activeTab === 'questions' && (
          <div className={styles.activityList}>
            {!profile.recentQuestions || profile.recentQuestions.length === 0 ? (
              <p className={styles.emptyText}>No questions posted yet.</p>
            ) : (
              profile.recentQuestions.map(q => (
                <Link
                  key={q.hash}
                  to={`/questions/${q.hash}`}
                  className={styles.activityItem}
                >
                  <div className={styles.activityContent}>
                    <p className={styles.activityTitle}>{q.title}</p>
                    <span className={styles.activityDate}>
                      {new Date(q.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <ChevronRight size={16} className={styles.activityArrow} />
                </Link>
              ))
            )}
          </div>
        )}

        {/* TAB 2: Answers list */}
        {activeTab === 'answers' && (
          <div className={styles.activityList}>
            {!profile.recentAnswers || profile.recentAnswers.length === 0 ? (
              <p className={styles.emptyText}>No answers given yet.</p>
            ) : (
              profile.recentAnswers.map(a => (
                <Link
                  key={a.answerId}
                  to={`/questions/${a.questionHash}`}
                  className={styles.activityItem}
                >
                  <div className={styles.activityContent}>
                    <p className={styles.activityTitle}>{a.questionTitle}</p>
                    <span className={styles.activityDate}>
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <ChevronRight size={16} className={styles.activityArrow} />
                </Link>
              ))
            )}
          </div>
        )}

        {/* TAB 3: Followers list */}
        {activeTab === 'followers' && (
          <div className={styles.activityList}>
            {followListLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <Loader2 size={28} className='animate-spin' color='#0284c7' style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ margin: 0, color: '#64748b' }}>Loading followers…</p>
              </div>
            ) : followersList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                <Users size={36} color='#94a3b8' style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No followers yet.</p>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  When other learners follow {isOwn ? 'you' : `${profile.firstName}`}, they will appear here.
                </span>
              </div>
            ) : (
              followersList.map(follower => (
                <div
                  key={follower.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1.25rem',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={
                        follower.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          `${follower.firstName || 'U'} ${follower.lastName || ''}`,
                        )}&background=f97316&color=fff`
                      }
                      alt={follower.firstName}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <Link
                        to={`/profile/${follower.id}`}
                        style={{ fontWeight: 700, fontSize: '0.92rem', color: 'inherit', textDecoration: 'none' }}
                      >
                        {follower.firstName} {follower.lastName}
                      </Link>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                        Followed {follower.followedAt ? new Date(follower.followedAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>

                  {currentUser?.id !== follower.id && (
                    <FollowButton userId={follower.id} />
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: Following list */}
        {activeTab === 'following' && (
          <div className={styles.activityList}>
            {followListLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <Loader2 size={28} className='animate-spin' color='#0284c7' style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ margin: 0, color: '#64748b' }}>Loading following…</p>
              </div>
            ) : followingList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                <UserPlus size={36} color='#94a3b8' style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>Not following anyone yet.</p>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Explore questions and follow authors whose insights you like!
                </span>
              </div>
            ) : (
              followingList.map(person => (
                <div
                  key={person.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1.25rem',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={
                        person.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          `${person.firstName || 'U'} ${person.lastName || ''}`,
                        )}&background=0284c7&color=fff`
                      }
                      alt={person.firstName}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <Link
                        to={`/profile/${person.id}`}
                        style={{ fontWeight: 700, fontSize: '0.92rem', color: 'inherit', textDecoration: 'none' }}
                      >
                        {person.firstName} {person.lastName}
                      </Link>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                        Following since {person.followedAt ? new Date(person.followedAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>

                  {currentUser?.id !== person.id && (
                    <FollowButton userId={person.id} initialIsFollowing={true} />
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 5: Security PIN Settings */}
        {activeTab === 'security' && isOwn && (
          <div style={{ padding: '1.5rem' }}>
            <SecurityPlusSettings />
          </div>
        )}
      </div>
    </div>
  );
}
