import { useState, useCallback } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { ratingService } from '../../services/rating/rating.service.js';
import styles from './RatingButtons.module.css';

/**
 * RatingButtons — upvote/downvote component for an answer.
 *
 * @param {{ answerId: number, initialScore?: number, initialUserVote?: number|null, initialUpvotes?: number, initialDownvotes?: number }} props
 */
export default function RatingButtons({
  answerId,
  initialScore = 0,
  initialUserVote = null,
  initialUpvotes = 0,
  initialDownvotes = 0,
}) {
  const [score, setScore]         = useState(initialScore);
  const [upvotes, setUpvotes]     = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote]   = useState(initialUserVote);
  const [loading, setLoading]     = useState(false);
  const [burst, setBurst]         = useState(null); // 'up' | 'down' for animation

  const handleRate = useCallback(
    async value => {
      if (loading) return;
      // Toggle off if same value
      const newValue = userVote === value ? 0 : value;
      setLoading(true);
      try {
        const result = await ratingService.rate(answerId, newValue);
        setScore(result.score);
        setUpvotes(result.upvotes);
        setDownvotes(result.downvotes);
        setUserVote(result.userVote);
        if (newValue !== 0) setBurst(newValue === 1 ? 'up' : 'down');
        setTimeout(() => setBurst(null), 600);
      } catch {
        /* silent — user might not be logged in */
      } finally {
        setLoading(false);
      }
    },
    [answerId, loading, userVote],
  );

  return (
    <div className={styles.rating} role='group' aria-label='Rate this answer'>
      {/* Upvote */}
      <button
        type='button'
        onClick={() => handleRate(1)}
        className={`${styles.btn} ${userVote === 1 ? styles.btn_up_active : ''} ${burst === 'up' ? styles.burst : ''}`}
        aria-label={`Upvote (${upvotes})`}
        aria-pressed={userVote === 1}
        disabled={loading}
      >
        <ThumbsUp size={15} />
        <span className={styles.count}>{upvotes}</span>
      </button>

      {/* Score pill */}
      <span
        className={`${styles.score} ${score > 0 ? styles.score_pos : score < 0 ? styles.score_neg : ''}`}
        aria-label={`Net score ${score}`}
      >
        {score > 0 ? `+${score}` : score}
      </span>

      {/* Downvote */}
      <button
        type='button'
        onClick={() => handleRate(-1)}
        className={`${styles.btn} ${userVote === -1 ? styles.btn_down_active : ''} ${burst === 'down' ? styles.burst : ''}`}
        aria-label={`Downvote (${downvotes})`}
        aria-pressed={userVote === -1}
        disabled={loading}
      >
        <ThumbsDown size={15} />
        <span className={styles.count}>{downvotes}</span>
      </button>
    </div>
  );
}
