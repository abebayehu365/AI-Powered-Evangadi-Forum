import React, { useState, useEffect, useRef } from 'react';
import { Star } from 'lucide-react';
import { starRatingService } from '../../services/rating/starRating.service';
import styles from './StarRating.module.css';

/**
 * Interactive 5-Star Rating Component for Questions and Answers.
 */
export default function StarRating({
  itemType = 'question',
  itemId,
  isAuthor = false,
  initialAverage = 0,
  initialTotal = 0,
  initialUserScore = null,
}) {
  const [average, setAverage] = useState(initialAverage);
  const [total, setTotal] = useState(initialTotal);
  const [userScore, setUserScore] = useState(initialUserScore);
  const [hoverScore, setHoverScore] = useState(0);
  const [saving, setSaving] = useState(null);
  const [ratingError, setRatingError] = useState(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    if (!itemId) return;

    starRatingService
      .get(itemType, itemId)
      .then(data => {
        if (data && requestIdRef.current === requestId) {
          setAverage(data.average || 0);
          setTotal(data.total || 0);
          setUserScore(data.userScore || null);
          setRatingError(null);
        }
      })
      .catch(error => {
        if (requestIdRef.current === requestId) {
          console.error('Failed to load star rating:', error);
          setRatingError({
            itemId,
            message: 'Unable to load ratings right now.',
          });
        }
      });

    return () => {
      if (requestIdRef.current === requestId) {
        requestIdRef.current += 1;
      }
    };
  }, [itemType, itemId]);

  const handleRate = async score => {
    if (isAuthor || saving?.itemId === itemId || !itemId) return;

    const requestId = ++requestIdRef.current;
    // Toggle off if same score clicked again
    const newScore = userScore === score ? 0 : score;
    const previousAverage = average;
    const previousTotal = total;
    const previousUserScore = userScore;
    const nextTotal =
      total + (userScore ? (newScore ? 0 : -1) : newScore ? 1 : 0);
    const nextAverage = nextTotal
      ? (average * total - (userScore || 0) + newScore) / nextTotal
      : 0;

    setSaving({ itemId, requestId });
    setRatingError(null);
    setAverage(nextAverage);
    setTotal(nextTotal);
    setUserScore(newScore || null);
    try {
      const result = await starRatingService.rate(itemType, itemId, newScore);
      if (requestIdRef.current !== requestId) return;
      if (result) {
        setAverage(result.average);
        setTotal(result.total);
        setUserScore(result.userScore);
      }
    } catch (err) {
      console.error('Failed to submit star rating:', err);
      if (requestIdRef.current !== requestId) return;
      setAverage(previousAverage);
      setTotal(previousTotal);
      setUserScore(previousUserScore);
      setRatingError({
        itemId,
        message: 'Could not save your rating. Please try again.',
      });
    } finally {
      setSaving(current => (current?.requestId === requestId ? null : current));
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
              disabled={isAuthor || saving?.itemId === itemId}
              onClick={isAuthor ? undefined : () => handleRate(starNum)}
              onMouseEnter={isAuthor ? undefined : () => setHoverScore(starNum)}
              className={`${styles.starBtn} ${
                isHovered
                  ? styles.starHovered
                  : isFilled
                  ? styles.starFilled
                  : ''
              }`}
              title={
                isAuthor
                  ? 'You cannot rate your own content'
                  : `Rate ${starNum} star${starNum > 1 ? 's' : ''}`
              }
              aria-label={
                isAuthor
                  ? `${starNum} out of 5 stars; you cannot rate your own ${itemType}`
                  : `Rate ${starNum} out of 5 stars`
              }
              aria-pressed={userScore === starNum}
            >
              <Star
                size={16}
                fill={isFilled || isHovered ? 'currentColor' : 'none'}
              />
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
      {ratingError?.itemId === itemId && (
        <span className={styles.errorText} role='status' aria-live='polite'>
          {ratingError.message}
        </span>
      )}
    </div>
  );
}
