import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import multer from 'multer';
import { BadRequestError } from '../../../utils/errors/index.js';

const uploadDirectory = path.resolve(process.cwd(), 'uploads/profile');
const imageTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

fs.mkdirSync(uploadDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (req, file, callback) => {
      const extension = imageTypes.get(file.mimetype);
      callback(null, req.user.id + '-' + randomUUID() + extension);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!imageTypes.has(file.mimetype)) {
      callback(new BadRequestError('Profile pictures must be JPG, PNG, or WebP images.'));
      return;
    }
    callback(null, true);
  },
});

export const profilePictureUpload = (req, res, next) => {
  upload.single('profilePicture')(req, res, error => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return next(new BadRequestError('Profile picture must be 2 MB or smaller.'));
    }
    if (error instanceof multer.MulterError) {
      return next(new BadRequestError('Could not upload profile picture.'));
    }
    if (error) return next(error);
    next();
  });
};
