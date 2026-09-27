import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import {
  createQuestionValidation,
  getQuestionsValidation,
  getSingleQuestionsValidation,
  searchQuestionsSemanticValidation,
  generateQuestionDraftCoachValidation,
  assessAnswerAgainstQuestionValidation,
  getSimilarQuestionsValidation,
} from '../validations/question.validation.js';
import {
  createQuestionController,
  getQuestionController,
  getSingleQuestionController,
  searchQuestionsSemanticController,
  getSimilarQuestionsController,
  generateQuestionDraftCoachController,
  assessAnswerAgainstQuestionController,
} from '../controller/question.controller.js';

const router = express.Router();

// Specific routes before param routes
router.post(
  '/',
  authenticateUser,
  createQuestionValidation,
  createQuestionController,
);

router.get(
  '/',
  authenticateUser,
  getQuestionsValidation,
  getQuestionController,
);

router.get(
  '/search',
  authenticateUser,
  searchQuestionsSemanticValidation,
  searchQuestionsSemanticController,
);

router.post(
  '/draft-coach',
  authenticateUser,
  generateQuestionDraftCoachValidation,
  generateQuestionDraftCoachController,
);

// Dynamic routes by questionHash
router.get(
  '/:questionHash/similar',
  authenticateUser,
  getSimilarQuestionsValidation,
  getSimilarQuestionsController,
);

router.post(
  '/:questionHash/answer-fit',
  authenticateUser,
  assessAnswerAgainstQuestionValidation,
  assessAnswerAgainstQuestionController,
);

router.get(
  '/:questionHash',
  authenticateUser,
  getSingleQuestionsValidation,
  getSingleQuestionController,
);

export default router;