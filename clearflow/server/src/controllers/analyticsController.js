const analyticsService = require('../services/analyticsService');
const db = require('../database/db');

async function getRecoveryAnalytics(req, res, next) {
  try {
    const { period = '90d' } = req.query;
    const merchantId = req.merchantScopeId;

    const summary = await analyticsService.getDashboardSummary(period, merchantId);
    const failureBreakdown = await analyticsService.getFailureReasonsBreakdown(period, merchantId);
    const recoveryTrend = await analyticsService.getRecoveryTrend(period, merchantId);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          failedRevenue: summary.failedRevenue,
          recoverableRevenue: summary.recoverableRevenue,
          recoveredRevenue: summary.recoveredRevenue,
          unrecoveredRevenue: Math.max(0, summary.recoverableRevenue - summary.recoveredRevenue),
          recoveryRate: summary.recoveryRate
        },
        failureBreakdown,
        recoveryTrend
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getMerchantAnalytics(req, res, next) {
  try {
    const sql = `
      SELECT 
        m.id,
        m.business_name,
        m.business_type,
        COUNT(p.id) as total_payments,
        COALESCE(SUM(p.amount), 0) as gross_volume,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'FAILED'), 0) as failed_revenue,
        COALESCE(SUM(p.amount) FILTER (WHERE p.recovery_status = 'RECOVERED'), 0) as recovered_revenue,
        CASE 
          WHEN COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'FAILED' AND p.recovery_status != 'UNRECOVERABLE'), 0) > 0 
          THEN ROUND(
            (COALESCE(SUM(p.amount) FILTER (WHERE p.recovery_status = 'RECOVERED'), 0) / 
             COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'FAILED' AND p.recovery_status != 'UNRECOVERABLE'), 1)) * 100, 
            1
          )
          ELSE 0 
        END as recovery_rate
      FROM merchants m
      LEFT JOIN payments p ON p.merchant_id = m.id
      GROUP BY m.id, m.business_name, m.business_type
      ORDER BY recovered_revenue DESC
    `;

    const result = await db.query(sql);

    res.status(200).json({
      success: true,
      data: result.rows.map(r => ({
        ...r,
        total_payments: parseInt(r.total_payments, 10),
        gross_volume: parseFloat(r.gross_volume),
        failed_revenue: parseFloat(r.failed_revenue),
        recovered_revenue: parseFloat(r.recovered_revenue),
        recovery_rate: parseFloat(r.recovery_rate)
      }))
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRecoveryAnalytics,
  getMerchantAnalytics
};
