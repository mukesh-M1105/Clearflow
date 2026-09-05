const express = require('express');
const router = express.Router();
const merchantController = require('../controllers/merchantController');
const { authenticate } = require('../middleware/auth');
const { merchantScope } = require('../middleware/merchantScope');

router.use(authenticate);
router.use(merchantScope);

router.get('/', merchantController.getMerchants);
router.get('/:id', merchantController.getMerchantById);
router.get('/:id/recovery', merchantController.getMerchantRecovery);

module.exports = router;
