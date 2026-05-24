'use strict';

const router = require('express').Router();
const {
  getVehicles, getVehicle, addVehicle, updateVehicle, deleteVehicle, removeVehicleImage,
} = require('./vehicles.controller');
const { verifyToken } = require('../../middleware/auth');
const { uploadVehicleImages, handleMulterError } = require('../../middleware/upload');
const { apiLimiter, uploadLimiter } = require('../../middleware/rateLimiter');

router.use(verifyToken);
router.use(apiLimiter);

router.get('/', getVehicles);
router.get('/:id', getVehicle);
router.post('/', uploadLimiter, uploadVehicleImages.array('images', 5), handleMulterError, addVehicle);
router.patch('/:id', uploadLimiter, uploadVehicleImages.array('images', 5), handleMulterError, updateVehicle);
router.delete('/:id', deleteVehicle);
router.delete('/:id/images/:imageUrl', removeVehicleImage);

module.exports = router;
