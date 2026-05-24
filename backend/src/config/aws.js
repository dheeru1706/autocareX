'use strict';

const AWS = require('aws-sdk');
const logger = require('../utils/logger');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1',
});

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  signatureVersion: 'v4',
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;
const CDN_URL = process.env.AWS_CDN_URL;

/**
 * Upload a buffer/stream to S3
 */
async function uploadToS3(key, buffer, mimeType, isPublic = true) {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ACL: isPublic ? 'public-read' : 'private',
    CacheControl: 'max-age=31536000',
  };

  try {
    const result = await s3.upload(params).promise();
    const url = CDN_URL ? `${CDN_URL}/${key}` : result.Location;
    logger.debug('File uploaded to S3', { key, url });
    return { key, url, etag: result.ETag };
  } catch (err) {
    logger.error('S3 upload failed', { key, error: err.message });
    throw err;
  }
}

/**
 * Delete a file from S3
 */
async function deleteFromS3(key) {
  const params = { Bucket: BUCKET_NAME, Key: key };
  try {
    await s3.deleteObject(params).promise();
    logger.debug('File deleted from S3', { key });
  } catch (err) {
    logger.error('S3 delete failed', { key, error: err.message });
    throw err;
  }
}

/**
 * Generate a pre-signed URL for private assets
 */
function getSignedUrl(key, expiresInSeconds = 3600) {
  return s3.getSignedUrl('getObject', {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: expiresInSeconds,
  });
}

/**
 * Generate CDN or S3 public URL
 */
function getPublicUrl(key) {
  if (!key) return null;
  if (CDN_URL) return `${CDN_URL}/${key}`;
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
}

module.exports = { s3, uploadToS3, deleteFromS3, getSignedUrl, getPublicUrl, BUCKET_NAME };
