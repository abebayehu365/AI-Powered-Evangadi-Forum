import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { timeAgo, getInitials, getAvatarColor, isAuthoredByUser } from '../../lib/utils';
import styles from './QuestionCard.module.css';

/**
 * Strips markdown markup to create a clean preview snippet.
 */
function cleanSnippet(text, maxLength = 160) {
  if (!text) return '';
  const cleaned = text
    .replace(/#+\s/g, '')
    .replace(/```[\s\S]*?```/g, ' [code] ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) + '...' : cleaned;
}

export default function QuestionCard({ question, currentUser }) {
  if (!question) return null;

  const isOwner = isAuthoredByUser(question, currentUser);
  const hash = question.questionHash || question.id;
  const authorFirst = question.author?.firstName || question.firstName || 'Anonymous';
  const authorLast = question.author?.lastName || question.lastName || '';
  const initials = getInitials(authorFirst, authorLast);
  const avatarTheme = getAvatarColor(authorFirst + authorLast + (question.author?.id || ''));
  const answerCount = question.answerCount ?? question.answers?.length ?? 0;
  const relativeDate = timeAgo(question.createdAt);
  const byLabel = isOwner ? 'You' : `${authorFirst} ${authorLast}`.trim();

  return (
    <article
      className={`${styles.card} ${isOwner ? styles['card--yours'] : ''}`}
      aria-label={question.title}
    >
      <div
        className={styles.avatar}
        style={{ backgroundColor: avatarTheme.bg, color: avatarTheme.color }}
        aria-hidden
      >
        {initials}
      </div>

      <div className={styles.body}>
        <div className={styles.headerRow}>
          <h3 className={styles.title}>
            <Link to={`/questions/${hash}`} className={styles.titleLink}>
              {question.title}
            </Link>
          </h3>
          {isOwner && <span className={styles.yoursBadge}>YOURS</span>}
        </div>

        <p className={styles.excerpt}>
          {cleanSnippet(question.content)}
        </p>

        <div className={styles.footer}>
          <span className={styles.replyCount}>
            <MessageSquare size={14} className={styles.replyIcon} aria-hidden />
            {answerCount} {answerCount === 1 ? 'reply' : 'replies'}
          </span>
          <span className={styles.metaDot}>•</span>
          <span className={styles.authorMeta}>
            {relativeDate ? `${relativeDate} by ` : 'By '}
            <strong className={styles.authorName}>{byLabel}</strong>
          </span>
        </div>
      </div>
    </article>
  );
}
