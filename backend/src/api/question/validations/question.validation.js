import { body, param, query } from 'express-validator';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';

const HASH_REGEX = /^[a-f0-9]{16}$/;

export const createQuestionValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Question title is required')
    .isLength({ min: 5, max: 255 })
    .withMessage('Title must be between 5 and 255 characters long'),
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isString()
    .withMessage('Content must be a string')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  validationErrorHandler,
];

export const getQuestionsValidation = [
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string')
    .trim(),
  query('mine')
    .optional()
    .isBoolean()
    .withMessage('Mine must be a boolean')
    .toBoolean(),
  validationErrorHandler,
];

export const getSingleQuestionsValidation = [
  param('questionHash')
    .isString()
    .withMessage('Question hash must be a string')
    .matches(HASH_REGEX)
    .withMessage('Invalid question hash format'),
  validationErrorHandler,
];

export const searchQuestionsSemanticValidation = [
  query('query')
    .notEmpty()
    .withMessage('Query is required')
    .isString()
    .withMessage('Query must be a string')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Query must be at least 5 characters long'),
  query('k')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('k must be between 1 and 20')
    .toInt(),
  query('threshold')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Threshold must be between 0 and 1')
    .toFloat(),
  validationErrorHandler,
];

export const assessAnswerAgainstQuestionValidation = [
  param('questionHash')
    .isString()
    .withMessage('Question hash must be a string')
    .matches(HASH_REGEX)
    .withMessage('Invalid question hash format'),
  body('answerText')
    .notEmpty()
    .withMessage('Answer text is required')
    .isString()
    .withMessage('Answer text must be a string')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Answer text must be at least 20 characters long'),
  validationErrorHandler,
];

export const generateQuestionDraftCoachValidation = [
  body('title')
    .optional()
    .isString()
    .withMessage('Question title must be a string')
    .trim(),
  body('content')
    .notEmpty()
    .withMessage('Question content is required')
    .isString()
    .withMessage('Question content must be a string')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Question content must be at least 10 characters long'),
  validationErrorHandler,
];

export const getSimilarQuestionsValidation = [
  param('questionHash')
    .isString()
    .withMessage('Question hash must be a string')
    .matches(HASH_REGEX)
    .withMessage('Invalid question hash format'),
  query('k')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('k must be between 1 and 20')
    .toInt(),
  query('threshold')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Threshold must be between 0 and 1')
    .toFloat(),
  validationErrorHandler,
];
