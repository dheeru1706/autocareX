'use strict';

const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { error } = require('../utils/response');
const logger = require('../utils/logger');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = ['application/pdf', ...ALLOWED_IMAGE_TYPES];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOC_SIZE = 20 * 1024 * 1024; // 20MB

const S3_CONFIGURED =
  !!process.env.AWS_ACCESS_KEY_ID &&
  !!process.env.AWS_SECRET_ACCESS_KEY &&
  !!process.env.AWS_S3_BUCKET;

if (!S3_CONFIGURED) {
  logger.warn('AWS S3 not configured — file uploads will use in-memory storage (files not persisted)');
}

function sanitizeFilename(originalname) {
  return path.basename(originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Returns an S3 storage engine when AWS env vars are present,
 * otherwise falls back to in-memory storage (useful for local dev
 * or when S3 is not yet wired up in production).
 */
function createStorage(folderPath) {
  if (!S3_CONFIGURED) {
    return multer.memoryStorage();
  }

  // Lazy-require aws config and multer-s3 so the module loads cleanly
  // even when AWS credentials are absent.
  const multerS3 = require('multer-s3');
  const { s3, BUCKET_NAME } = require('../config/aws');

  return multerS3({
    s3,
    bucket: BUCKET_NAME,
    acl: 'public-read',
    cacheControl: 'max-age=31536000',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = path.extname(sanitizeFilename(file.originalname)).toLowerCase();
      const filename = `${folderPath}/${uuidv4()}${ext}`;
      cb(null, filename);
    },
    metadata: (req, file, cb) => {
      cb(null, {
        uploadedBy: req.user?.id || 'anonymous',
        originalName: sanitizeFilename(file.originalname),
      });
    },
  });
}

function imageFilter(req, file, cb) {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only JPEG, PNG, and WebP images are allowed'));
  }
}

function documentFilter(req, file, cb) {
  if (ALLOWED_DOC_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only PDF and image files are allowed'));
  }
}

// Multer error handler middleware
function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return error(res, 'File too large', 413);
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return error(res, 'Too many files', 400);
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return error(res, err.message || 'Unexpected file type', 400);
    }
    return error(res, err.message, 400);
  }
  next(err);
}

// --- Configured upload instances ---

const uploadVehicleImages = multer({
  storage: createStorage('vehicles'),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_SIZE, files: 5 },
});

const uploadAvatar = multer({
  storage: createStorage('avatars'),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
});

const uploadKycDocuments = multer({
  storage: createStorage('kyc'),
  fileFilter: documentFilter,
  limits: { fileSize: MAX_DOC_SIZE, files: 10 },
});

const uploadMarketplaceImages = multer({
  storage: createStorage('marketplace'),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_SIZE, files: 15 },
});

const uploadInsuranceDoc = multer({
  storage: createStorage('insurance'),
  fileFilter: documentFilter,
  limits: { fileSize: MAX_DOC_SIZE, files: 2 },
});

const uploadServiceImages = multer({
  storage: createStorage('services'),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_SIZE, files: 5 },
});

// In-memory upload for processing before S3
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
});

module.exports = {
  uploadVehicleImages,
  uploadAvatar,
  uploadKycDocuments,
  uploadMarketplaceImages,
  uploadInsuranceDoc,
  uploadServiceImages,
  memoryUpload,
  handleMulterError,
  S3_CONFIGURED,
};
