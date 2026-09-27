import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import {
  ragUpload,
  createDocumentMulterErrorHandler,
} from '../config/rag.upload.config.js';
import {
  documentIdParamValidation,
  searchDocumentValidation,
  queryDocumentValidation,
} from '../validations/rag.validation.js';
import {
  uploadDocumentController,
  listDocumentsController,
  getDocumentMetaController,
  getDocumentFileController,
  deleteDocumentController,
  searchDocumentController,
  queryDocumentController,
} from '../controller/rag.controller.js';

const router = express.Router();

// List documents
router.get('/', authenticateUser, listDocumentsController);

// Upload document
router.post(
  '/',
  authenticateUser,
  ragUpload.single('file'),
  createDocumentMulterErrorHandler,
  uploadDocumentController,
);

// Subroutes under documentId
router.get(
  '/:documentId/search',
  authenticateUser,
  searchDocumentValidation,
  searchDocumentController,
);

router.post(
  '/:documentId/query',
  authenticateUser,
  queryDocumentValidation,
  queryDocumentController,
);

router.get(
  '/:documentId/file',
  authenticateUser,
  documentIdParamValidation,
  getDocumentFileController,
);

router.get(
  '/:documentId',
  authenticateUser,
  documentIdParamValidation,
  getDocumentMetaController,
);

router.delete(
  '/:documentId',
  authenticateUser,
  documentIdParamValidation,
  deleteDocumentController,
);

export default router;
