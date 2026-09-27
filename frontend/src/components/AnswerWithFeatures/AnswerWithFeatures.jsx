import LikeButtons from '../LikeButtons/LikeButtons';
import StarRating from '../StarRating/StarRating';
import { ItemQrCodeButton } from '../ItemQrModal/ItemQrModal';
import ReportModal from '../ReportModal/ReportModal';
import styles from './AnswerWithFeatures.module.css';

/**
 * AnswerWithFeatures — wraps any answer card children with
 * Like/Unlike, Star Rating, QR Code, and Report toolbar below.
 *
 * Usage inside QuestionDetail or anywhere you render answers:
 *
 *   <AnswerWithFeatures
 *     answerId={answer.id}
 *     questionHash={questionHash}
 *   >
 *     {/* existing answer card JSX *\/}
 *   </AnswerWithFeatures>
 *
 * @param {{ answerId: number, questionHash?: string, children: React.ReactNode }} props
 */
export default function AnswerWithFeatures({ answerId, questionHash, children }) {
  const answerUrl = questionHash
    ? `${window.location.origin}/questions/${questionHash}#answer-${answerId}`
    : `${window.location.href}#answer-${answerId}`;

  return (
    <div className={styles.wrapper} id={`answer-${answerId}`}>
      {children}
      <div className={styles.toolbar}>
        <LikeButtons
          itemType='answer'
          itemId={answerId}
        />
        <StarRating
          itemType='answer'
          itemId={answerId}
        />
        <ItemQrCodeButton
          itemType='answer'
          itemId={answerId}
          url={answerUrl}
          title={`Answer #${answerId}`}
        />
        <ReportModal targetType='answer' targetId={answerId} />
      </div>
    </div>
  );
}
