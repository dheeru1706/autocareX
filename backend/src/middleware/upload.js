'use strict';

const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { s3, BUCKET_NAME } = require('../config/aws');
const { error } = require('../utils/response');
const logger = require('../utils/logger');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = ['application/pdf', ...ALLOWED_IMAGE_TYPES];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOC_SIZE = 20 * 1024 * 1024; // 20MB

function sanitizeFilename(originalname) {
  return path.basename(originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
}

function createS3Storage(folderPath) {
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

function memoryStorage() {
  return multer.memoryStorage();
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
  storage: createS3Storage('vehicles'),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_SIZE, files: 5 },
});

const uploadAvatar = multer({
  storage: createS3Storage('avatars'),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
});

const uploadKycDocuments = multer({
  storage: createS3Storage('kyc'),
  fileFilter: documentFilter,
  limits: { fileSize: MAX_DOC_SIZE, files: 10 },
});

const uploadMarketplaceImages = multer({
  storage: createS3Storage('marketplace'),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_SIZE, files: 15 },
});

const uploadInsuranceDoc = multer({
  storage: createS3Storage('insurance'),
  fileFilter: documentFilter,
  limits: { fileSize: MAX_DOC_SIZE, files: 2 },
});

const uploadServiceImages = multer({
  storage: createS3Storage('services'),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_SIZE, files: 5 },
});

// In-memory upload for processing before S3
const memoryUpload = multer({
  storage: memoryStorage(),
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
};
