const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { merchantScope } = require('../middleware/merchantScope');

router.use(authenticate);
router.use(merchantScope);

router.get('/payments', reportController.getPaymentsReport);
router.get('/recovery', reportController.getRecoveryReport);
router.get('/merchants', reportController.getMerchantsReport);

module.exports = router;
