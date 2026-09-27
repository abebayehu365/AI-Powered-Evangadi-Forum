import { useState, useEffect, useCallback } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { followService } from '../../services/follow/follow.service.js';
import styles from './FollowButton.module.css';

/**
 * FollowButton — animated follow/unfollow toggle with follower count badge.
 *
 * @param {{ userId: number, initialIsFollowing?: boolean, initialFollowerCount?: number }} props
 */
export default function FollowButton({ userId, initialIsFollowing = false, initialFollowerCount = 0 }) {
  const [isFollowing, setIsFollowing]   = useState(initialIsFollowing);
  const [followerCount, setCount]       = useState(initialFollowerCount);
  const [loading, setLoading]           = useState(false);
  const [hovered, setHovered]           = useState(false);

  // Sync with prop changes (e.g., when profile data loads)
  useEffect(() => {
    setIsFollowing(initialIsFollowing);
    setCount(initialFollowerCount);
  }, [initialIsFollowing, initialFollowerCount]);

  const handleToggle = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await followService.toggle(userId);
      setIsFollowing(result.following);
      setCount(result.followerCount);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [loading, userId]);

  const label = isFollowing
    ? (hovered ? 'Unfollow' : 'Following')
    : 'Follow';

  return (
    <button
      type='button'
      className={`${styles.btn} ${isFollowing ? styles.following : styles.notFollowing} ${hovered && isFollowing ? styles.unfollow : ''}`}
      onClick={handleToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={loading}
      aria-label={`${label} user`}
      aria-pressed={isFollowing}
    >
      {loading ? (
        <Loader2 size={15} className={styles.spinner} />
      ) : isFollowing ? (
        hovered ? <UserPlus size={15} /> : <UserCheck size={15} />
      ) : (
        <UserPlus size={15} />
      )}
      <span>{label}</span>
      <span className={styles.count}>{followerCount.toLocaleString()}</span>
    </button>
  );
}
