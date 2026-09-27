import path from 'path';
import fs from 'fs';
import { StatusCodes } from 'http-status-codes';
import {
  createDocumentFromUploadService,
  listDocumentsForUserService,
  getDocumentMetaService,
  deleteDocumentService,
  searchInDocumentService,
  queryDocumentService,
  assertOwnedDocument,
} from '../service/rag.service.js';
import { NotFoundError } from '../../../utils/errors/index.js';

export const uploadDocumentController = async (req, res, next) => {
  try {
    const doc = await createDocumentFromUploadService({
      file: req.file,
      userId: req.user.id,
    });

    res.status(StatusCodes.ACCEPTED).json({
      success: true,
      message: 'Document uploaded. Processing in background.',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

export const listDocumentsController = async (req, res, next) => {
  try {
    const docs = await listDocumentsForUserService(req.user.id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Documents fetched successfully.',
      data: docs,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentMetaController = async (req, res, next) => {
  try {
    const doc = await getDocumentMetaService({
      documentId: req.params.documentId,
      userId: req.user.id,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document fetched successfully.',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentFileController = async (req, res, next) => {
  try {
    const doc = await assertOwnedDocument({
      documentId: req.params.documentId,
      userId: req.user.id,
    });

    const fullPath = path.isAbsolute(doc.storage_path)
      ? doc.storage_path
      : path.resolve(process.cwd(), doc.storage_path);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundError('PDF file not found on disk');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.title)}"`);
    res.sendFile(fullPath);
  } catch (error) {
    next(error);
  }
};

export const deleteDocumentController = async (req, res, next) => {
  try {
    const result = await deleteDocumentService({
      documentId: req.params.documentId,
      userId: req.user.id,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document deleted successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const searchDocumentController = async (req, res, next) => {
  try {
    const query = req.query.query || req.query.q;
    const k = req.query.k ? Number(req.query.k) : 5;

    const result = await searchInDocumentService({
      documentId: req.params.documentId,
      userId: req.user.id,
      query,
      k,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Ranked chunk excerpts',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const queryDocumentController = async (req, res, next) => {
  try {
    const query = req.body.query || req.body.question;

    const result = await queryDocumentService({
      documentId: req.params.documentId,
      userId: req.user.id,
      query,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Answer and citations',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
