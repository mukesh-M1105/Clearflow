const express = require('express');
const router = express.Router();
const recoveryController = require('../controllers/recoveryController');
const { authenticate } = require('../middleware/auth');
const { merchantScope } = require('../middleware/merchantScope');
const { authorize } = require('../middleware/role');

router.use(authenticate);
router.use(merchantScope);

router.get('/', recoveryController.getRecoveryAttempts);
router.get('/:id', recoveryController.getRecoveryCase);

// Recovery analysis and execution endpoints
// Admins, Revenue Managers, and Merchants can analyze payments and trigger recovery simulations
router.post('/analyze/:paymentId', recoveryController.analyzePayment);
router.post('/start/:paymentId', recoveryController.startRecovery);

module.exports = router;
