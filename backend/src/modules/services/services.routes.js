const express = require('express');
const router = express.Router();
const servicesController = require('./services.controller');

router.get('/categories', servicesController.getCategories);
router.get('/packages', servicesController.getPackages);
router.get('/packages/:id', servicesController.getPackage);
router.get('/slots', servicesController.getAvailableSlots);

module.exports = router;
