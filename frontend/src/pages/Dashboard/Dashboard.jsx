import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PenSquare,
  MessageSquare,
  BookOpen,
  Sparkles,
  Search,
  X,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { questionService } from '../../services/question/question.service';
import QuestionCard from '../../components/QuestionCard/QuestionCard';
import { isAuthoredByUser } from '../../lib/utils';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const keywordQuery = searchParams.get('q') || '';
  const semanticQuery = searchParams.get('semantic') || '';
  const isSearchActive = Boolean(keywordQuery || semanticQuery);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (semanticQuery.trim()) {
        const res = await questionService.searchQuestionsSemantic(semanticQuery.trim());
        setQuestions(res.questions);
      } else if (keywordQuery.trim()) {
        const res = await questionService.getQuestions({ search: keywordQuery.trim() });
        setQuestions(res.questions);
      } else {
        const res = await questionService.getQuestions();
        setQuestions(res.questions);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
      setError('Failed to load questions.');
    } finally {
      setLoading(false);
    }
  }, [keywordQuery, semanticQuery]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const clearSearch = () => {
    setSearchParams({});
  };

  // Metrics computation for stats row
  const stats = useMemo(() => {
    const totalQuestions = questions.length;
    let totalReplies = 0;
    let unanswered = 0;
    let authoredByMe = 0;

    questions.forEach(q => {
      const count = q.answerCount ?? q.answers?.length ?? 0;
      totalReplies += count;
      if (count === 0) unanswered += 1;
      if (isAuthoredByUser(q, user)) authoredByMe += 1;
    });

    return {
      totalQuestions,
      totalReplies,
      unanswered,
      authoredByMe,
    };
  }, [questions, user]);

  const firstName = user?.firstName?.trim();
  const greeting = firstName ? `Good to see you, ${firstName}.` : 'Welcome to the forum.';

  return (
    <div className={styles.dashboard}>
      {/* Top Welcome / Hero Card */}
      <section className={styles.heroCard} aria-labelledby='hero-greeting'>
        <div className={styles.heroHeader}>
          <span className={styles.heroEyebrow}>FORUM HOME</span>
          <h1 id='hero-greeting' className={styles.heroTitle}>
            {greeting}
          </h1>
          <p className={styles.heroSubtitle}>
            Start a topic, revisit your own threads, or skim the live feed. Search above
            works from any page once you are back on Home.
          </p>
        </div>

        {/* Quick Action Tiles */}
        <div className={styles.quickTiles}>
          <button
            type='button'
            className={styles.quickTile}
            onClick={() => navigate('/questions/ask')}
          >
            <div className={styles.quickTileIconWrap}>
              <PenSquare size={20} className={styles.quickTileIcon} />
            </div>
            <div className={styles.quickTileContent}>
              <strong className={styles.quickTileTitle}>New question</strong>
              <span className={styles.quickTileDesc}>
                Share context, errors, and what you already tried
              </span>
            </div>
          </button>

          <button
            type='button'
            className={styles.quickTile}
            onClick={() => navigate('/my-questions')}
          >
            <div className={styles.quickTileIconWrap}>
              <MessageSquare size={20} className={styles.quickTileIcon} />
            </div>
            <div className={styles.quickTileContent}>
              <strong className={styles.quickTileTitle}>Your topics</strong>
              <span className={styles.quickTileDesc}>
                Filtered list of threads you authored
              </span>
            </div>
          </button>

          <button
            type='button'
            className={styles.quickTile}
            onClick={() => navigate('/rag-documents')}
          >
            <div className={styles.quickTileIconWrap}>
              <BookOpen size={20} className={styles.quickTileIcon} />
            </div>
            <div className={styles.quickTileContent}>
              <strong className={styles.quickTileTitle}>Knowledge base</strong>
              <span className={styles.quickTileDesc}>
                Course library, uploads, and retrieval-backed context for threads
              </span>
            </div>
          </button>
        </div>

        {/* Stats Row */}
        <div className={styles.statsSection}>
          <p className={styles.statsLabel}>
            Figures below describe the newest threads in this feed (up to 100 from the API).
          </p>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statName}>Questions</span>
              <span className={styles.statValue}>{stats.totalQuestions}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statName}>Replies</span>
              <span className={styles.statValue}>{stats.totalReplies}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statName}>Unanswered</span>
              <span className={styles.statValue}>{stats.unanswered}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statName}>Yours</span>
              <span className={styles.statValue}>{stats.authoredByMe}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Discussion Feed Section */}
      <section className={styles.feedSection} aria-label='Discussion Feed'>
        <div className={styles.feedHeader}>
          <div>
            <h2 className={styles.feedTitle}>Discussion feed</h2>
            <p className={styles.feedSubtitle}>
              Your threads use a slim left accent in this list.
            </p>
          </div>

          <div className={styles.feedActions}>
            {isSearchActive ? (
              <div className={styles.searchPill}>
                {semanticQuery ? (
                  <>
                    <Sparkles size={14} className={styles.semanticIcon} />
                    <span>AI Semantic: "{semanticQuery}"</span>
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    <span>Keyword: "{keywordQuery}"</span>
                  </>
                )}
                <button
                  type='button'
                  onClick={clearSearch}
                  className={styles.clearSearchBtn}
                  aria-label='Clear search filter'
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <span className={styles.newestBadge}>NEWEST THREADS</span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={styles.loadingContainer}>
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className={styles.skeletonCard}>
                <div className={styles.skeletonAvatar} />
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonTitle} />
                  <div className={styles.skeletonText} />
                  <div className={styles.skeletonFooter} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className={styles.errorBanner} role='alert'>
            <div className={styles.errorContent}>
              <p className={styles.errorMessage}>{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && questions.length === 0 && (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIconWrap}>
              <MessageSquare size={32} />
            </div>
            <h3 className={styles.emptyTitle}>
              {isSearchActive ? 'No matching questions found' : 'No questions yet'}
            </h3>
            <p className={styles.emptyText}>
              {isSearchActive
                ? `We couldn't find any threads matching "${keywordQuery || semanticQuery}". Try adjusting your terms or browse the complete feed.`
                : 'Be the first in your cohort to ask a question! Clear questions with context help everyone learn.'}
            </p>
            <div className={styles.emptyActions}>
              {isSearchActive ? (
                <button
                  type='button'
                  onClick={clearSearch}
                  className={styles.emptySecondaryBtn}
                >
                  Show all questions
                </button>
              ) : (
                <button
                  type='button'
                  onClick={() => navigate('/questions/ask')}
                  className={styles.emptyPrimaryBtn}
                >
                  Ask a Question
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Question List */}
        {!loading && !error && questions.length > 0 && (
          <div className={styles.questionList}>
            {questions.map(q => (
              <QuestionCard
                key={q.questionHash || q.id}
                question={q}
                currentUser={user}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
