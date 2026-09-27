import { param, query, body } from 'express-validator';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';

export const documentIdParamValidation = [
  param('documentId')
    .notEmpty()
    .withMessage('Document ID is required')
    .isInt({ min: 1 })
    .withMessage('Invalid Document ID')
    .toInt(),
  validationErrorHandler,
];

export const searchDocumentValidation = [
  param('documentId')
    .notEmpty()
    .withMessage('Document ID is required')
    .isInt({ min: 1 })
    .withMessage('Invalid Document ID')
    .toInt(),
  query('query')
    .custom((val, { req }) => {
      const q = val || req.query.q;
      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        throw new Error('Search query must be at least 2 characters long');
      }
      return true;
    }),
  query('k')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('k must be between 1 and 50')
    .toInt(),
  validationErrorHandler,
];

export const queryDocumentValidation = [
  param('documentId')
    .notEmpty()
    .withMessage('Document ID is required')
    .isInt({ min: 1 })
    .withMessage('Invalid Document ID')
    .toInt(),
  body()
    .custom(val => {
      const q = val?.query || val?.question;
      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        throw new Error('Query text must be at least 2 characters long');
      }
      return true;
    }),
  validationErrorHandler,
];
