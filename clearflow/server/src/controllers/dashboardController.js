const analyticsService = require('../services/analyticsService');

async function getSummary(req, res, next) {
  try {
    const { period = '90d' } = req.query;
    const merchantId = req.merchantScopeId;
    const summary = await analyticsService.getDashboardSummary(period, merchantId);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (err) {
    next(err);
  }
}

async function getPaymentTrend(req, res, next) {
  try {
    const { period = '90d' } = req.query;
    const merchantId = req.merchantScopeId;
    const trend = await analyticsService.getPaymentVolumeTrend(period, merchantId);

    res.status(200).json({
      success: true,
      data: trend
    });
  } catch (err) {
    next(err);
  }
}

async function getRecoveryTrend(req, res, next) {
  try {
    const { period = '90d' } = req.query;
    const merchantId = req.merchantScopeId;
    const trend = await analyticsService.getRecoveryTrend(period, merchantId);

    res.status(200).json({
      success: true,
      data: trend
    });
  } catch (err) {
    next(err);
  }
}

async function getFailureReasons(req, res, next) {
  try {
    const { period = '90d' } = req.query;
    const merchantId = req.merchantScopeId;
    const breakdown = await analyticsService.getFailureReasonsBreakdown(period, merchantId);

    res.status(200).json({
      success: true,
      data: breakdown
    });
  } catch (err) {
    next(err);
  }
}

async function getOpportunities(req, res, next) {
  try {
    const { limit = 6 } = req.query;
    const merchantId = req.merchantScopeId;
    const opportunities = await analyticsService.getTopOpportunities(parseInt(limit, 10), merchantId);

    res.status(200).json({
      success: true,
      data: opportunities
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSummary,
  getPaymentTrend,
  getRecoveryTrend,
  getFailureReasons,
  getOpportunities
};
