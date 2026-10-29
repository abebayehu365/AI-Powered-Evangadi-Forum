/**
 * Formats a date into a relative time string (e.g., "5 mins ago", "2 hrs ago", "3 weeks ago")
 * @param {Date|string|number} dateInput - The date to format
 * @returns {string} Relative time string
 */
export function timeAgo(dateInput) {
  if (!dateInput) return '';

  const date = new Date(dateInput);

  // Check for invalid dates
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Handle future dates or extremely recent dates
  if (seconds < 0) return 'just now';
  if (seconds < 60) return `${seconds} sec${seconds !== 1 ? 's' : ''} ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours !== 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;

  const years = Math.floor(days / 365);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

/**
 * Formats a date as an abbreviated month, two-digit day, and four-digit year.
 * @param {Date|string|number} dateInput
 * @returns {string}
 */
export function formatDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

/**
 * Computes initials for display in avatar pills (e.g., "Abebe Kebede" -> "AK").
 * @param {string} [firstName]
 * @param {string} [lastName]
 * @returns {string}
 */
export function getInitials(firstName, lastName) {
  const f = (firstName || '').trim().charAt(0).toUpperCase();
  const l = (lastName || '').trim().charAt(0).toUpperCase();
  if (f && l) return `${f}${l}`;
  if (f) return f;
  return 'U';
}

/**
 * Returns a consistent harmonious pastel background color for avatar rings.
 * @param {string} [seed]
 * @returns {{ bg: string, color: string }}
 */
export function getAvatarColor(seed = '') {
  const palettes = [
    { bg: '#ccfbf1', color: '#0f766e' }, // teal
    { bg: '#dbeafe', color: '#1d4ed8' }, // blue
    { bg: '#fef3c7', color: '#b45309' }, // amber
    { bg: '#ede9fe', color: '#6d28d9' }, // purple
    { bg: '#ffedd5', color: '#c2410c' }, // orange
    { bg: '#dcfce7', color: '#15803d' }, // green
    { bg: '#fae8ff', color: '#a21caf' }, // fuchsia
    { bg: '#e0e7ff', color: '#4338ca' }, // indigo
  ];

  let hash = 0;
  const str = String(seed || 'user');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
}

/**
 * Whether a question was created by the signed-in user (IDs compared as strings).
 * @param {{ author?: { id?: string | number }, userId?: string | number } | null | undefined} question
 * @param {{ id?: string | number } | null | undefined} user
 * @returns {boolean}
 */
export function isAuthoredByUser(question, user) {
  if (!question || !user) return false;
  const authorId = question.author?.id ?? question.userId;
  const userId = user.id;
  if (authorId == null || userId == null) return false;
  return String(authorId) === String(userId);
}
