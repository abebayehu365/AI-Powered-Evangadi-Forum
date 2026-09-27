import { body } from 'express-validator';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';

export const createAnswerValidation = [
  body('questionId')
    .notEmpty()
    .withMessage('Question is required')
    .isInt({ min: 1 })
    .withMessage('Invalid Question Id')
    .toInt(),

  body('content')
    .notEmpty()
    .withMessage('Answer is required')
    .isString()
    .withMessage('Answer must be a string')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Answer content must be at least 20 characters long'),

  validationErrorHandler,
];
