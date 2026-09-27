import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  MessageSquare,
  Sparkles,
  Send,
  Bold,
  Italic,
  Code,
  Link as LinkIcon,
  Check,
  AlertCircle,
  Loader2,
  Flag,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { questionService } from '../../services/question/question.service';
import { answerService } from '../../services/answer/answer.service';
import {
  timeAgo,
  formatDate,
  getInitials,
  getAvatarColor,
  isAuthoredByUser,
} from '../../lib/utils';
import RagAnswerBody from '../../components/RagAnswerBody/RagAnswerBody';
import AnswerWithFeatures from '../../components/AnswerWithFeatures/AnswerWithFeatures';
import ReportModal from '../../components/ReportModal/ReportModal';
import LikeButtons from '../../components/LikeButtons/LikeButtons';
import StarRating from '../../components/StarRating/StarRating';
import { ItemQrCodeButton } from '../../components/ItemQrModal/ItemQrModal';
import styles from './QuestionDetail.module.css';

export default function QuestionDetailWithAddons() {
  const { questionHash, id } = useParams();
  const activeHash = questionHash || id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const textareaRef = useRef(null);

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [relatedQuestions, setRelatedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Answer Form state
  const [answerContent, setAnswerContent] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [copiedShare, setCopiedShare] = useState(false);

  // AI Answer Fit state
  const [fitChecking, setFitChecking] = useState(false);
  const [fitResult, setFitResult] = useState(null);
  const [fitError, setFitError] = useState(null);

  const fetchQuestionDetails = useCallback(async () => {
    if (!activeHash) return;
    setLoading(true);
    setError(null);
    try {
      const data = await questionService.getSingleQuestion(activeHash);
      setQuestion(data.question);
      setAnswers(data.answers || []);

      // Fetch related questions in parallel
      if (data.question) {
        questionService
          .findSimilarQuestions(activeHash, data.question.title)
          .then(related => {
            const filtered = related.filter(
              r => (r.questionHash || r.id) !== activeHash,
            );
            setRelatedQuestions(filtered.slice(0, 5));
          })
          .catch(() => setRelatedQuestions([]));
      }
    } catch (err) {
      console.error('Failed to load question detail:', err);
      setError(err.message || 'Unable to load question details.');
    } finally {
      setLoading(false);
    }
  }, [activeHash]);

  useEffect(() => {
    fetchQuestionDetails();
    setAnswerContent('');
    setFitResult(null);
    setFitError(null);
    setSubmitError(null);
  }, [fetchQuestionDetails]);

  // Handle Share link copy
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      setCopiedShare(false);
    }
  };

  // Markdown insertion helper
  const insertMarkdown = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let replacement = '';
    if (prefix === '```\n') {
      replacement = `\`\`\`\n${selected || '// code here'}\n\`\`\``;
    } else if (prefix === '[') {
      replacement = `[${selected || 'link text'}](https://)`;
    } else {
      replacement = `${prefix}${selected || 'text'}${suffix}`;
    }

    const nextContent =
      text.substring(0, start) + replacement + text.substring(end);
    setAnswerContent(nextContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected.length || (prefix === '```\n' ? 12 : 4)),
      );
    }, 0);
  };

  // Check Answer Fit with AI
  const handleCheckFit = async () => {
    setFitError(null);
    if (answerContent.trim().length < 20) {
      setFitError('You need at least 20 characters before evaluating answer fit.');
      return;
    }

    setFitChecking(true);
    try {
      const result = await questionService.assessAnswerFit(
        activeHash,
        answerContent.trim(),
      );
      setFitResult(result);
    } catch (err) {
      console.error('Fit assessment error:', err);
      setFitError(
        err.message || 'AI fit check is temporarily unavailable. You can still post your answer.',
      );
    } finally {
      setFitChecking(false);
    }
  };

  // Submit Answer
  const handleSubmitAnswer = async e => {
    e.preventDefault();
    setSubmitError(null);

    if (answerContent.trim().length < 20) {
      setSubmitError('Answer must be at least 20 characters long.');
      return;
    }

    setSubmittingAnswer(true);
    try {
      const questionId = question?.id || activeHash;
      const createdAnswer = await answerService.postAnswer({
        questionId,
        content: answerContent.trim(),
      });

      if (createdAnswer) {
        setAnswers(prev => [...prev, createdAnswer]);
      } else {
        await fetchQuestionDetails();
      }

      setAnswerContent('');
      setFitResult(null);
    } catch (err) {
      console.error('Failed to post answer:', err);
      setSubmitError(
        err.message || 'Failed to submit answer. Please check your connection and try again.',
      );
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const isOwner = isAuthoredByUser(question, user);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.backLinkWrap}>
          <button
            type='button'
            className={styles.backBtn}
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={16} />
            Back to feed
          </button>
        </div>
        <div className={styles.centeredState}>
          <Loader2 size={36} className={styles.spinner} />
          <p className={styles.stateTitle}>Loading discussion...</p>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className={styles.container}>
        <div className={styles.backLinkWrap}>
          <button
            type='button'
            className={styles.backBtn}
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={16} />
            Back to feed
          </button>
        </div>
        <div className={styles.centeredState}>
          <AlertCircle size={40} className={styles.errorIcon} />
          <h2 className={styles.stateTitle}>Question not found</h2>
          <p className={styles.stateText}>
            {error || 'This question might have been removed or does not exist.'}
          </p>
          <button
            type='button'
            className={styles.primaryBtn}
            onClick={() => navigate('/dashboard')}
          >
            Browse all questions
          </button>
        </div>
      </div>
    );
  }

  const authorId = question.author?.id || question.user_id || question.userId;
  const authorFirst = question.author?.firstName || question.firstName || 'Anonymous';
  const authorLast = question.author?.lastName || question.lastName || '';
  const authorInitials = getInitials(authorFirst, authorLast);
  const authorTheme = getAvatarColor(authorFirst + authorLast + (authorId || ''));
  const postedDate = question.createdAt
    ? `Posted ${formatDate(question.createdAt)}`
    : 'Recently posted';

  return (
    <div className={styles.container}>
      {/* Back to feed Navigation */}
      <div className={styles.backLinkWrap}>
        <button
          type='button'
          className={styles.backBtn}
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={16} />
          Back to feed
        </button>
      </div>

      <div className={styles.layoutColumns}>
        {/* Main Left Column */}
        <div className={styles.mainColumn}>
          {/* Main Question Card */}
          <article className={styles.questionCard} aria-labelledby='question-title'>
            <div className={styles.authorRow}>
              {authorId ? (
                <Link
                  to={`/profile/${authorId}`}
                  className={styles.avatar}
                  style={{ backgroundColor: authorTheme.bg, color: authorTheme.color, textDecoration: 'none' }}
                  aria-hidden
                  title={`View ${authorFirst}'s profile`}
                >
                  {authorInitials}
                </Link>
              ) : (
                <div
                  className={styles.avatar}
                  style={{ backgroundColor: authorTheme.bg, color: authorTheme.color }}
                  aria-hidden
                >
                  {authorInitials}
                </div>
              )}

              <div className={styles.authorInfo}>
                {authorId ? (
                  <Link
                    to={`/profile/${authorId}`}
                    className={styles.authorName}
                    style={{ textDecoration: 'none' }}
                    title={`View ${authorFirst}'s profile`}
                  >
                    {authorFirst} {authorLast}
                  </Link>
                ) : (
                  <strong className={styles.authorName}>
                    {authorFirst} {authorLast}
                  </strong>
                )}
                <span className={styles.postedDate}>{postedDate}</span>
              </div>
            </div>

            <h1 id='question-title' className={styles.questionTitle}>
              {question.title}
            </h1>

            <div className={styles.questionContent}>
              <RagAnswerBody>{question.content}</RagAnswerBody>
            </div>

            <div className={styles.questionActions}>
              <button
                type='button'
                className={styles.shareBtn}
                onClick={handleShare}
                title='Share link to this question'
              >
                {copiedShare ? (
                  <>
                    <Check size={15} className={styles.shareSuccessIcon} />
                    <span>Copied link</span>
                  </>
                ) : (
                  <>
                    <Share2 size={15} />
                    <span>Share</span>
                  </>
                )}
              </button>

              <span className={styles.answerCountBadge}>
                <MessageSquare size={15} />
                <span>
                  {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
                </span>
              </span>

              {/* Report question option */}
              <ReportModal
                targetType='question'
                targetId={question.id || question.question_id || 1}
              />

              {/* QR Code for question (Premium feature) */}
              <ItemQrCodeButton
                itemType='question'
                itemId={question.id || question.question_id}
                url={window.location.href}
                title={question.title}
              />
            </div>

            {/* Like/Unlike & Star Rating for the question */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0', borderTop: '1px solid var(--border-color, #e2e8f0)', marginTop: '0.5rem' }}>
              <LikeButtons
                itemType='question'
                itemId={question.id || question.question_id}
              />
              <StarRating
                itemType='question'
                itemId={question.id || question.question_id}
              />
            </div>
          </article>

          {/* Community Answers Section */}
          <section className={styles.answersSection} aria-label='Community Answers'>
            <h2 className={styles.answersHeading}>
              Community Answers ({answers.length})
            </h2>

            {/* Empty Answers State */}
            {answers.length === 0 ? (
              <div className={styles.noAnswersBox}>
                <MessageSquare size={32} className={styles.noAnswersIcon} />
                <h3 className={styles.noAnswersTitle}>No answers yet</h3>
                <p className={styles.noAnswersText}>
                  Be the first learner to help solve this problem and gain
                  reputation points.
                </p>
              </div>
            ) : (
              <div className={styles.answersList}>
                {answers.map((answer, index) => {
                  const ansAuthorId = answer.author?.id || answer.userId || answer.user_id;
                  const ansFirst =
                    answer.author?.firstName || answer.firstName || 'Community';
                  const ansLast = answer.author?.lastName || answer.lastName || 'Member';
                  const ansInitials = getInitials(ansFirst, ansLast);
                  const ansTheme = getAvatarColor(ansFirst + ansLast + (ansAuthorId || index));
                  const ansDate = answer.createdAt
                    ? formatDate(answer.createdAt)
                    : timeAgo(answer.createdAt);

                  const answerId = answer.id || answer.answer_id || answer.answerId || (index + 1);

                  return (
                    <AnswerWithFeatures key={answerId} answerId={answerId} questionHash={activeHash}>
                      <article className={styles.answerCard}>
                        <div className={styles.answerHeader}>
                          {ansAuthorId ? (
                            <Link
                              to={`/profile/${ansAuthorId}`}
                              className={styles.avatarSm}
                              style={{
                                backgroundColor: ansTheme.bg,
                                color: ansTheme.color,
                                textDecoration: 'none',
                              }}
                              aria-hidden
                              title={`View ${ansFirst}'s profile`}
                            >
                              {ansInitials}
                            </Link>
                          ) : (
                            <div
                              className={styles.avatarSm}
                              style={{
                                backgroundColor: ansTheme.bg,
                                color: ansTheme.color,
                              }}
                              aria-hidden
                            >
                              {ansInitials}
                            </div>
                          )}

                          <div className={styles.authorInfo}>
                            {ansAuthorId ? (
                              <Link
                                to={`/profile/${ansAuthorId}`}
                                className={styles.authorName}
                                style={{ textDecoration: 'none' }}
                                title={`View ${ansFirst}'s profile`}
                              >
                                {ansFirst} {ansLast}
                              </Link>
                            ) : (
                              <strong className={styles.authorName}>
                                {ansFirst} {ansLast}
                              </strong>
                            )}
                            <span className={styles.postedDate}>{ansDate}</span>
                          </div>
                        </div>

                        <div className={styles.answerBody}>
                          <RagAnswerBody>{answer.content}</RagAnswerBody>
                        </div>
                      </article>
                    </AnswerWithFeatures>
                  );
                })}
              </div>
            )}

            {/* Answer Form or Author Notice */}
            {isOwner ? (
              <div className={styles.ownerNoticeBox}>
                <AlertCircle size={18} className={styles.noticeIcon} />
                <div>
                  <strong className={styles.noticeTitle}>
                    You cannot answer your own question
                  </strong>
                  <p className={styles.noticeText}>
                    To clarify your question or add new details, you can ask a follow-up or
                    participate in the thread replies.
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.contributeCard}>
                <h3 className={styles.contributeTitle}>Contribute an answer</h3>

                <form onSubmit={handleSubmitAnswer} className={styles.answerForm}>
                  {submitError && (
                    <div className={styles.errorBanner} role='alert'>
                      <AlertCircle size={16} />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className={styles.editorWrap}>
                    <div className={styles.toolbar}>
                      <div className={styles.toolbarButtons}>
                        <button
                          type='button'
                          className={styles.toolBtn}
                          onClick={() => insertMarkdown('**', '**')}
                          title='Bold'
                        >
                          <Bold size={15} />
                        </button>
                        <button
                          type='button'
                          className={styles.toolBtn}
                          onClick={() => insertMarkdown('*', '*')}
                          title='Italic'
                        >
                          <Italic size={15} />
                        </button>
                        <button
                          type='button'
                          className={styles.toolBtn}
                          onClick={() => insertMarkdown('```\n', '\n```')}
                          title='Code block'
                        >
                          <Code size={15} />
                        </button>
                        <button
                          type='button'
                          className={styles.toolBtn}
                          onClick={() => insertMarkdown('[', '](url)')}
                          title='Insert link'
                        >
                          <LinkIcon size={15} />
                        </button>
                      </div>

                      <span className={styles.charCount}>
                        {answerContent.length} characters
                      </span>
                    </div>

                    <textarea
                      ref={textareaRef}
                      value={answerContent}
                      onChange={e => setAnswerContent(e.target.value)}
                      rows={8}
                      placeholder='Type your answer here... You can use Markdown to format your code!'
                      className={styles.answerTextarea}
                    />
                  </div>

                  {/* AI Answer Fit Row */}
                  <div className={styles.aiFitRow}>
                    <button
                      type='button'
                      onClick={handleCheckFit}
                      disabled={fitChecking || submittingAnswer}
                      className={styles.checkFitBtn}
                    >
                      {fitChecking ? (
                        <>
                          <Loader2 size={15} className={styles.spinner} />
                          Checking fit...
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} />
                          Check draft fit
                        </>
                      )}
                    </button>
                    <span className={styles.fitCaption}>
                      Relevance only. Not grading correctness. You need at least 20 characters.
                    </span>
                  </div>

                  {fitError && (
                    <div className={styles.fitErrorText}>
                      <AlertCircle size={14} />
                      <span>{fitError}</span>
                    </div>
                  )}

                  {/* AI Fit Feedback Panel */}
                  {fitResult && (
                    <div
                      className={`${styles.fitResultBox} ${
                        fitResult.level === 'strong'
                          ? styles['fitResultBox--strong']
                          : fitResult.level === 'weak'
                          ? styles['fitResultBox--weak']
                          : styles['fitResultBox--partial']
                      }`}
                    >
                      <div className={styles.fitResultHeader}>
                        <Sparkles size={16} />
                        <span className={styles.fitBadge}>
                          {fitResult.level === 'strong'
                            ? 'Strong match'
                            : fitResult.level === 'weak'
                            ? 'Weak match'
                            : 'Partial match'}
                        </span>
                      </div>
                      <p className={styles.fitNote}>{fitResult.note}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className={styles.submitRow}>
                    <button
                      type='submit'
                      disabled={submittingAnswer || answerContent.trim().length < 20}
                      className={styles.submitAnswerBtn}
                    >
                      {submittingAnswer ? (
                        <>
                          <Loader2 size={16} className={styles.spinner} />
                          Posting...
                        </>
                      ) : (
                        'Post Your Answer'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Related Questions Sidebar */}
        <aside className={styles.sideColumn} aria-label='Related Questions'>
          <div className={styles.relatedBox}>
            <h3 className={styles.relatedTitle}>Related Questions</h3>

            {relatedQuestions.length === 0 ? (
              <p className={styles.noRelatedText}>
                No related questions found.
              </p>
            ) : (
              <div className={styles.relatedList}>
                {relatedQuestions.map(rel => {
                  const relHash = rel.questionHash || rel.id;
                  const relFirst = rel.author?.firstName || rel.firstName || 'User';
                  const relLast = rel.author?.lastName || rel.lastName || '';
                  const relDate = rel.createdAt
                    ? formatDate(rel.createdAt)
                    : '';

                  return (
                    <div key={relHash} className={styles.relatedCard}>
                      <Link
                        to={`/questions/${relHash}`}
                        className={styles.relatedCardTitle}
                      >
                        {rel.title}
                      </Link>
                      <div className={styles.relatedMeta}>
                        <span>{`${relFirst} ${relLast}`.trim()}</span>
                        {relDate && <span>{relDate}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
