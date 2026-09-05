const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');
const { merchantScope } = require('../middleware/merchantScope');

router.use(authenticate);
router.use(merchantScope);

router.post('/assistant', aiController.askAssistant);

module.exports = router;
