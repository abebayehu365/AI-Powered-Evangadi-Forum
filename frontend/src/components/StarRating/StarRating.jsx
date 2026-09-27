import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { starRatingService } from '../../services/rating/starRating.service';
import styles from './StarRating.module.css';

/**
 * Interactive 5-Star Rating Component for Questions and Answers.
 */
export default function StarRating({
  itemType = 'question',
  itemId,
  initialAverage = 0,
  initialTotal = 0,
  initialUserScore = null,
}) {
  const [average, setAverage] = useState(initialAverage);
  const [total, setTotal] = useState(initialTotal);
  const [userScore, setUserScore] = useState(initialUserScore);
  const [hoverScore, setHoverScore] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!itemId) return;
    starRatingService
      .get(itemType, itemId)
      .then(data => {
        if (data) {
          setAverage(data.average || 0);
          setTotal(data.total || 0);
          setUserScore(data.userScore || null);
        }
      })
      .catch(() => {});
  }, [itemType, itemId]);

  const handleRate = async score => {
    if (loading || !itemId) return;

    // Toggle off if same score clicked again
    const newScore = userScore === score ? 0 : score;

    setLoading(true);
    try {
      const result = await starRatingService.rate(itemType, itemId, newScore);
      if (result) {
        setAverage(result.average);
        setTotal(result.total);
        setUserScore(result.userScore);
      }
    } catch (err) {
      console.error('Failed to submit star rating:', err);
    } finally {
      setLoading(false);
    }
  };

  const displayStars = hoverScore || userScore || Math.round(average);

  return (
    <div
      className={styles.wrap}
      role='group'
      aria-label={`Star rating for ${itemType}: ${average} out of 5 stars`}
    >
      <div
        className={styles.starsRow}
        onMouseLeave={() => setHoverScore(0)}
      >
        {[1, 2, 3, 4, 5].map(starNum => {
          const isFilled = starNum <= displayStars;
          const isHovered = hoverScore > 0 && starNum <= hoverScore;

          return (
            <button
              key={starNum}
              type='button'
              disabled={loading}
              onClick={() => handleRate(starNum)}
              onMouseEnter={() => setHoverScore(starNum)}
              className={`${styles.starBtn} ${
                isHovered
                  ? styles.starHovered
                  : isFilled
                  ? styles.starFilled
                  : ''
              }`}
              title={`Rate ${starNum} star${starNum > 1 ? 's' : ''}`}
              aria-label={`Rate ${starNum} out of 5 stars`}
            >
              <Star size={16} />
            </button>
          );
        })}
      </div>

      <div className={styles.metaText}>
        <span>{average > 0 ? average.toFixed(1) : '0.0'}</span>
        <span className={styles.reviewCount}>
          ({total} {total === 1 ? 'rating' : 'ratings'})
        </span>
        {userScore && (
          <span className={styles.userBadge} title='Your rating'>
            • You: {userScore}★
          </span>
        )}
      </div>
    </div>
  );
}
