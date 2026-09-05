const db = require('../database/db');
const analyticsService = require('../services/analyticsService');

async function getMerchants(req, res, next) {
  try {
    const { search = '' } = req.query;
    const params = [];
    let searchClause = '';

    if (search) {
      params.push(`%${search}%`);
      searchClause = `WHERE (m.business_name ILIKE $1 OR m.business_type ILIKE $1)`;
    }

    // If user is merchant, enforce their own merchant
    if (req.user.role === 'MERCHANT') {
      params.push(req.user.merchant_id);
      searchClause = searchClause ? `${searchClause} AND m.id = $${params.length}` : `WHERE m.id = $${params.length}`;
    }

    const sql = `
      SELECT 
        m.id,
        m.business_name,
        m.business_type,
        m.created_at,
        COUNT(p.id) as total_payments,
        COALESCE(SUM(p.amount), 0) as total_volume,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'FAILED'), 0) as failed_revenue,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'FAILED' AND p.recovery_status != 'UNRECOVERABLE'), 0) as recoverable_revenue,
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
      ${searchClause}
      GROUP BY m.id, m.business_name, m.business_type, m.created_at
      ORDER BY total_volume DESC
    `;

    const result = await db.query(sql, params);

    res.status(200).json({
      success: true,
      data: result.rows.map(r => ({
        ...r,
        total_payments: parseInt(r.total_payments, 10),
        total_volume: parseFloat(r.total_volume),
        failed_revenue: parseFloat(r.failed_revenue),
        recoverable_revenue: parseFloat(r.recoverable_revenue),
        recovered_revenue: parseFloat(r.recovered_revenue),
        recovery_rate: parseFloat(r.recovery_rate)
      }))
    });
  } catch (err) {
    next(err);
  }
}

async function getMerchantById(req, res, next) {
  try {
    const { id } = req.params;

    if (req.user.role === 'MERCHANT' && req.user.merchant_id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Cannot view details of another merchant profile.'
      });
    }

    const mQuery = await db.query(
      `SELECT m.*, u.email as owner_email, u.name as owner_name
       FROM merchants m
       LEFT JOIN users u ON u.id = m.user_id
       WHERE m.id = $1`,
      [id]
    );

    if (mQuery.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Merchant '${id}' not found.` });
    }

    const merchant = mQuery.rows[0];

    // Summary metrics
    const summary = await analyticsService.getDashboardSummary('90d', id);

    // Trends
    const paymentTrend = await analyticsService.getPaymentVolumeTrend('90d', id);
    const recoveryTrend = await analyticsService.getRecoveryTrend('90d', id);
    const failureBreakdown = await analyticsService.getFailureReasonsBreakdown('90d', id);
    const opportunities = await analyticsService.getTopOpportunities(5, id);

    res.status(200).json({
      success: true,
      data: {
        merchant,
        summary,
        trends: {
          payments: paymentTrend,
          recovery: recoveryTrend
        },
        failureBreakdown,
        opportunities
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getMerchantRecovery(req, res, next) {
  try {
    const { id } = req.params;

    if (req.user.role === 'MERCHANT' && req.user.merchant_id !== id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access.' });
    }

    const opportunities = await analyticsService.getTopOpportunities(10, id);
    const failureBreakdown = await analyticsService.getFailureReasonsBreakdown('90d', id);

    res.status(200).json({
      success: true,
      data: {
        opportunities,
        failureBreakdown
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMerchants,
  getMerchantById,
  getMerchantRecovery
};
