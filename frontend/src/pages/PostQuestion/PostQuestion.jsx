import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Bold,
  Italic,
  Code,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';
import { questionService } from '../../services/question/question.service';
import styles from './PostQuestion.module.css';

export default function PostQuestion() {
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Validation errors
  const [touched, setTouched] = useState({ title: false, content: false });
  const [generalError, setGeneralError] = useState(null);

  // AI Draft Coach state
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachTips, setCoachTips] = useState(null);
  const [coachError, setCoachError] = useState(null);

  // Form submission state
  const [submitting, setSubmitting] = useState(false);

  // Validation rules
  const isTitleValid = title.trim().length >= 5 && title.trim().length <= 255;
  const isContentValid = content.trim().length >= 10;
  const titleError =
    touched.title && !isTitleValid
      ? 'Question title must be at least 5 characters'
      : null;
  const contentError =
    touched.content && !isContentValid
      ? 'Question content must be at least 10 characters'
      : null;

  // Markdown formatting tool helper
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
    setContent(nextContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected.length || (prefix === '```\n' ? 12 : 4)),
      );
    }, 0);
  };

  // Run AI Draft Coach
  const handleGetCoachFeedback = async () => {
    setCoachError(null);
    if (title.trim().length < 5 || content.trim().length < 10) {
      setTouched({ title: true, content: true });
      setCoachError(
        'Please enter a title (min 5 chars) and draft description (min 10 chars) so the AI Coach can review it.',
      );
      return;
    }

    setCoachLoading(true);
    try {
      const res = await questionService.generateQuestionDraftCoach({
        title: title.trim(),
        content: content.trim(),
      });
      setCoachTips(res.tips);
    } catch (err) {
      console.error('AI coach error:', err);
      setCoachError(
        err.message || 'AI coach is temporarily unavailable. You can still post your question.',
      );
    } finally {
      setCoachLoading(false);
    }
  };

  // Submit question
  const handleSubmit = async e => {
    e.preventDefault();
    setTouched({ title: true, content: true });
    setGeneralError(null);

    if (!isTitleValid || !isContentValid) {
      return;
    }

    setSubmitting(true);
    try {
      const created = await questionService.createQuestion({
        title: title.trim(),
        content: content.trim(),
      });

      const hash = created?.questionHash || created?.id;
      if (hash) {
        navigate(`/questions/${hash}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Failed to post question:', err);
      setGeneralError(
        err.message || 'Failed to publish your question. Please check your connection and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Guidance Card */}
      <section className={styles.guidanceCard} aria-labelledby='ask-cohort-heading'>
        <div className={styles.guidanceHeader}>
          <span className={styles.guidanceEyebrow}>ASK THE COHORT</span>
          <h1 id='ask-cohort-heading' className={styles.guidanceTitle}>
            Publish to the forum
          </h1>
          <p className={styles.guidanceLead}>
            Public threads help the whole cohort. Write as if a classmate will debug
            your issue tomorrow. They only know what you put on the page.
          </p>
        </div>

        {/* Checklist Callout */}
        <div className={styles.calloutBox}>
          <h2 className={styles.calloutTitle}>
            Write questions people can answer in one pass
          </h2>
          <p className={styles.calloutText}>
            Mentors volunteer their time. Give them runnable context, expected vs
            actual behavior, and a tight scope so they can reproduce the issue without
            guessing your setup.
          </p>

          <div className={styles.checklistGroup}>
            <h3 className={styles.checklistHeading}>Checklist before you post</h3>
            <ul className={styles.checklist}>
              <li>
                <strong>Title as a headline</strong> that states the symptom and tech stack (e.g., “React 19: state resets after navigation”).
              </li>
              <li>
                <strong>Repro steps</strong> numbered, with environment (OS, browser, Node version) when it matters.
              </li>
              <li>
                <strong>Minimal code</strong> in fenced markdown blocks; trim unrelated lines so readers scan faster.
              </li>
              <li>
                <strong>Exact errors</strong> copied verbatim, including stack trace snippets when debugging backend routes.
              </li>
            </ul>
          </div>

          <div className={styles.rulesGroup}>
            <h3 className={styles.checklistHeading}>Validation rules (enforced by the form)</h3>
            <ul className={styles.checklist}>
              <li>
                <strong>Title length:</strong> Must be between 5 and 255 characters.
              </li>
              <li>
                <strong>Body length:</strong> Must contain a minimum of 10 characters detailing your problem.
              </li>
              <li>
                <strong>Single topic:</strong> Split unrelated bugs into separate threads so search and embeddings stay precise.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Question Form Card */}
      <section className={styles.formCard}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {generalError && (
            <div className={styles.errorAlert} role='alert'>
              <AlertCircle size={18} />
              <span>{generalError}</span>
            </div>
          )}

          {/* Title Field */}
          <div className={styles.fieldGroup}>
            <label htmlFor='question-title' className={styles.label}>
              Title
            </label>
            <p className={styles.fieldHelper}>
              Be specific and imagine you're asking a question to another person.
            </p>
            <input
              id='question-title'
              type='text'
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, title: true }))}
              placeholder='e.g. How do I handle state management using Context API in React?'
              className={`${styles.input} ${titleError ? styles['input--error'] : ''}`}
              maxLength={255}
            />
            {titleError && <p className={styles.errorText}>{titleError}</p>}
          </div>

          {/* Content Field with Markdown Toolbar */}
          <div className={styles.fieldGroup}>
            <label htmlFor='question-content' className={styles.label}>
              What are the details of your problem?
            </label>
            <p className={styles.fieldHelper}>
              Introduce the problem and expand on what you put in the title. Minimum 10 characters.
            </p>

            <div className={`${styles.editorWrap} ${contentError ? styles['editorWrap--error'] : ''}`}>
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
                  {content.length} characters
                </span>
              </div>

              <textarea
                id='question-content'
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, content: true }))}
                rows={12}
                placeholder='Include all the information someone would need to answer your question... You can use Markdown to format your code!'
                className={styles.textarea}
              />
            </div>
            {contentError && <p className={styles.errorText}>{contentError}</p>}
          </div>

          {/* AI Coach Trigger */}
          <div className={styles.aiCoachRow}>
            <button
              type='button'
              onClick={handleGetCoachFeedback}
              disabled={coachLoading || submitting}
              className={styles.coachBtn}
            >
              {coachLoading ? (
                <>
                  <Loader2 size={16} className={styles.spinner} />
                  Analyzing draft...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  AI suggestions
                </>
              )}
            </button>
            <span className={styles.coachCaption}>
              Suggestions only. You still choose what to post.
            </span>
          </div>

          {/* AI Coach Feedback Panel */}
          {coachError && (
            <div className={styles.coachErrorBanner}>
              <AlertCircle size={16} />
              <span>{coachError}</span>
              <button
                type='button'
                onClick={() => setCoachError(null)}
                className={styles.dismissBtn}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {coachTips && coachTips.length > 0 && (
            <div className={styles.coachFeedbackBox}>
              <div className={styles.coachFeedbackHeader}>
                <div className={styles.coachFeedbackTitleWrap}>
                  <Sparkles size={16} className={styles.coachSparkle} />
                  <strong className={styles.coachFeedbackTitle}>
                    AI Draft Coach suggestions:
                  </strong>
                </div>
                <button
                  type='button'
                  onClick={() => setCoachTips(null)}
                  className={styles.dismissBtn}
                  aria-label='Dismiss suggestions'
                >
                  <X size={16} />
                </button>
              </div>

              <ul className={styles.coachTipsList}>
                {coachTips.map((tip, idx) => (
                  <li key={idx} className={styles.coachTipItem}>
                    <CheckCircle2 size={15} className={styles.tipCheckIcon} />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Form Action Buttons */}
          <div className={styles.actionRow}>
            <button
              type='button'
              className={styles.cancelBtn}
              onClick={() => navigate('/dashboard')}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type='submit'
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className={styles.spinner} />
                  Posting...
                </>
              ) : (
                <>
                  Post Question
                  <Send size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
