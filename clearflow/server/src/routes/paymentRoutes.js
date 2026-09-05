const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { merchantScope } = require('../middleware/merchantScope');

router.use(authenticate);
router.use(merchantScope);

router.get('/', paymentController.getPayments);
router.get('/:id', paymentController.getPaymentById);

module.exports = router;
