const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');
const { merchantScope } = require('../middleware/merchantScope');

router.use(authenticate);
router.use(merchantScope);

router.get('/recovery', analyticsController.getRecoveryAnalytics);
router.get('/merchants', analyticsController.getMerchantAnalytics);

module.exports = router;
