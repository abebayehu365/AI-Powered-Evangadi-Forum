import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { BadRequestError } from '../../../utils/errors/index.js';

const uploadDir = process.env.RAG_UPLOAD_DIR || 'uploads/rag';
const maxUploadMb = parseInt(process.env.RAG_MAX_UPLOAD_MB || '10', 10);
const maxBytes = maxUploadMb * 1024 * 1024;

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userFolder = path.join(uploadDir, String(req.user?.id || 'misc'));
    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder, { recursive: true });
    }
    cb(null, userFolder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedOriginal}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only PDF files are supported for RAG uploads'), false);
  }
};

export const ragUpload = multer({
  storage,
  limits: { fileSize: maxBytes },
  fileFilter,
});

export const createDocumentMulterErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new BadRequestError(`File size exceeds the limit of ${maxUploadMb}MB`));
    }
    return next(new BadRequestError(`Upload error: ${err.message}`));
  }
  if (err) {
    return next(err);
  }
  next();
};
