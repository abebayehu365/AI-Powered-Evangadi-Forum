import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { questionService } from '../../services/question/question.service';
import QuestionCard from '../../components/QuestionCard/QuestionCard';
import styles from './MyQuestions.module.css';

export default function MyQuestions() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await questionService.getQuestions({ mine: true });
      setQuestions(res.questions);
    } catch (err) {
      console.error('Failed to fetch my questions:', err);
      setError('Failed to fetch questions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyQuestions();
  }, [fetchMyQuestions]);

  return (
    <div className={styles.container}>
      {/* Top Header Card */}
      <section className={styles.headerCard} aria-labelledby='my-topics-heading'>
        <div className={styles.headerContent}>
          <span className={styles.headerEyebrow}>YOUR WORKSPACE</span>
          <h1 id='my-topics-heading' className={styles.headerTitle}>
            Your topics
          </h1>
          <p className={styles.headerDesc}>
            Only questions you created. Open one to read answers or add follow-ups.
            Rows use the same left accent as your threads on Home.
          </p>
        </div>

        <button
          type='button'
          className={styles.newQuestionBtn}
          onClick={() => navigate('/questions/ask')}
        >
          <Plus size={18} />
          New question
        </button>
      </section>

      {/* Loading Skeleton */}
      {loading && (
        <div className={styles.loadingContainer}>
          {[1, 2, 3].map(idx => (
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
          <h2 className={styles.emptyTitle}>
            You haven't posted any questions yet
          </h2>
          <p className={styles.emptyText}>
            When you ask a question, it will appear here so you can track answers and
            updates in one place.
          </p>
          <button
            type='button'
            onClick={() => navigate('/questions/ask')}
            className={styles.emptyCtaBtn}
          >
            Ask your first question
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Questions List */}
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
    </div>
  );
}
