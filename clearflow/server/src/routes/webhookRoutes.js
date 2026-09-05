const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { authenticate } = require('../middleware/auth');

// Allow authorized users (or gateway signatures) to simulate incoming failure webhooks
router.post('/simulate', authenticate, webhookController.simulateIncomingWebhook);
router.post('/incoming', webhookController.simulateIncomingWebhook);

module.exports = router;
