const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/auth');
const fleetController = require('./fleet.controller');

router.use(verifyToken);
router.use(requireRole(['fleet_manager', 'admin']));

router.get('/account', fleetController.getAccount);
router.post('/account', fleetController.createAccount);
router.get('/vehicles', fleetController.getVehicles);
router.post('/vehicles', fleetController.addVehicle);
router.delete('/vehicles/:id', fleetController.removeVehicle);
router.get('/bookings', fleetController.getBookings);
router.post('/bookings/bulk', fleetController.createBulkBooking);
router.get('/invoices', fleetController.getInvoices);
router.get('/dashboard', fleetController.getDashboard);

module.exports = router;
