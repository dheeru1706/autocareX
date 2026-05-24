const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/auth');
const walletController = require('./wallet.controller');

router.use(verifyToken);

router.get('/balance', walletController.getBalance);
router.get('/transactions', walletController.getTransactions);
router.post('/topup', walletController.initiateTopup);
router.post('/topup/verify', walletController.verifyTopup);

module.exports = router;
