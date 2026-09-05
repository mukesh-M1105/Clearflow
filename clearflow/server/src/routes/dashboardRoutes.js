const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const { merchantScope } = require('../middleware/merchantScope');

router.use(authenticate);
router.use(merchantScope);

router.get('/summary', dashboardController.getSummary);
router.get('/payment-trend', dashboardController.getPaymentTrend);
router.get('/recovery-trend', dashboardController.getRecoveryTrend);
router.get('/failure-reasons', dashboardController.getFailureReasons);
router.get('/opportunities', dashboardController.getOpportunities);

module.exports = router;
