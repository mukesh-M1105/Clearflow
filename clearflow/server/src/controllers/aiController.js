const aiAssistant = require('../services/aiAssistant');

async function askAssistant(req, res, next) {
  try {
    const { message, context = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A message string is required.'
      });
    }

    const merchantId = req.merchantScopeId;
    const response = await aiAssistant.processAssistantQuery(message, context, merchantId);

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  askAssistant
};
