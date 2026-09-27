import React, { useState, useEffect, useCallback } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { likeService } from '../../services/like/like.service';
import styles from './LikeButtons.module.css';

/**
 * Universal Like & Unlike (Upvote/Downvote) Component.
 * Supports both Questions and Answers!
 */
export default function LikeButtons({
  itemType = 'answer',
  itemId,
  initialLikes = 0,
  initialUnlikes = 0,
  initialUserVote = null,
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [unlikes, setUnlikes] = useState(initialUnlikes);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [loading, setLoading] = useState(false);
  const [pop, setPop] = useState(null); // 'like' | 'unlike'

  // Fetch current stats on mount if itemId provided
  useEffect(() => {
    if (!itemId) return;
    likeService
      .get(itemType, itemId)
      .then(data => {
        if (data) {
          setLikes(data.likes || 0);
          setUnlikes(data.unlikes || 0);
          setUserVote(data.userVote);
        }
      })
      .catch(() => {
        // Fallback silently if unauthenticated or network hiccup
      });
  }, [itemType, itemId]);

  const handleVote = useCallback(
    async voteValue => {
      if (loading || !itemId) return;

      // Toggle off if already voted same
      const nextVote = userVote === voteValue ? 0 : voteValue;

      // Optimistic state
      const prevLikes = likes;
      const prevUnlikes = unlikes;
      const prevUserVote = userVote;

      let newLikes = likes;
      let newUnlikes = unlikes;

      if (userVote === 1) newLikes--;
      if (userVote === -1) newUnlikes--;

      if (nextVote === 1) newLikes++;
      if (nextVote === -1) newUnlikes++;

      setLikes(Math.max(0, newLikes));
      setUnlikes(Math.max(0, newUnlikes));
      setUserVote(nextVote);
      setPop(nextVote === 1 ? 'like' : nextVote === -1 ? 'unlike' : null);
      setLoading(true);

      try {
        const result = await likeService.vote(itemType, itemId, nextVote);
        if (result) {
          setLikes(result.likes);
          setUnlikes(result.unlikes);
          setUserVote(result.userVote);
        }
      } catch (err) {
        console.error('Failed to register vote:', err);
        // Revert on failure
        setLikes(prevLikes);
        setUnlikes(prevUnlikes);
        setUserVote(prevUserVote);
      } finally {
        setLoading(false);
        setTimeout(() => setPop(null), 300);
      }
    },
    [itemType, itemId, loading, userVote, likes, unlikes],
  );

  const netScore = likes - unlikes;

  return (
    <div className={styles.wrap} role='group' aria-label={`Like or unlike ${itemType}`}>
      {/* Like (Thumbs Up) */}
      <button
        type='button'
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`${styles.btn} ${userVote === 1 ? styles.btnUpActive : ''} ${
          pop === 'like' ? styles.pop : ''
        }`}
        aria-label={`Like (${likes})`}
        aria-pressed={userVote === 1}
        title='Like'
      >
        <ThumbsUp size={15} />
        <span>{likes}</span>
      </button>

      {/* Score Pill */}
      <span
        className={`${styles.score} ${
          netScore > 0 ? styles.scorePos : netScore < 0 ? styles.scoreNeg : ''
        }`}
      >
        {netScore > 0 ? `+${netScore}` : netScore}
      </span>

      <span className={styles.divider} aria-hidden='true' />

      {/* Unlike (Thumbs Down) */}
      <button
        type='button'
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`${styles.btn} ${userVote === -1 ? styles.btnDownActive : ''} ${
          pop === 'unlike' ? styles.pop : ''
        }`}
        aria-label={`Unlike (${unlikes})`}
        aria-pressed={userVote === -1}
        title='Unlike'
      >
        <ThumbsDown size={15} />
        <span>{unlikes}</span>
      </button>
    </div>
  );
}
