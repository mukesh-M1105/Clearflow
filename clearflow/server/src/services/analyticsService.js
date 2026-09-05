const db = require('../database/db');

/**
 * Analytics Service
 * Executes performant SQL aggregation queries to calculate KPIs, trends,
 * failure distributions, and recovery rate performance across customizable date intervals.
 */

function getDateIntervalClause(period) {
  switch (period) {
    case 'today':
      return "created_at >= CURRENT_DATE";
    case '7d':
      return "created_at >= (CURRENT_TIMESTAMP - INTERVAL '7 days')";
    case '30d':
      return "created_at >= (CURRENT_TIMESTAMP - INTERVAL '30 days')";
    case '90d':
    default:
      return "created_at >= (CURRENT_TIMESTAMP - INTERVAL '90 days')";
  }
}

async function getDashboardSummary(period = '90d', merchantId = null) {
  const dateClause = getDateIntervalClause(period);
  const params = [];
  let merchantClause = '';

  if (merchantId) {
    params.push(merchantId);
    merchantClause = `AND merchant_id = $${params.length}`;
  }

  const sql = `
    SELECT
      COALESCE(SUM(amount), 0) AS total_volume,
      COUNT(*) AS total_payments,
      COALESCE(COUNT(*) FILTER (WHERE status = 'SUCCESS'), 0) AS success_count,
      COALESCE(SUM(amount) FILTER (WHERE status = 'SUCCESS'), 0) AS success_volume,
      COALESCE(COUNT(*) FILTER (WHERE status = 'FAILED'), 0) AS failed_count,
      COALESCE(SUM(amount) FILTER (WHERE status = 'FAILED'), 0) AS failed_revenue,
      COALESCE(SUM(amount) FILTER (WHERE status = 'FAILED' AND recovery_status != 'UNRECOVERABLE'), 0) AS recoverable_revenue,
      COALESCE(SUM(amount) FILTER (WHERE recovery_status = 'RECOVERED'), 0) AS recovered_revenue
    FROM payments
    WHERE ${dateClause} ${merchantClause}
  `;

  const result = await db.query(sql, params);
  const row = result.rows[0];

  const totalVolume = parseFloat(row.total_volume || '0');
  const totalPayments = parseInt(row.total_payments || '0', 10);
  const successCount = parseInt(row.success_count || '0', 10);
  const successVolume = parseFloat(row.success_volume || '0');
  const failedCount = parseInt(row.failed_count || '0', 10);
  const failedRevenue = parseFloat(row.failed_revenue || '0');
  const recoverableRevenue = parseFloat(row.recoverable_revenue || '0');
  const recoveredRevenue = parseFloat(row.recovered_revenue || '0');

  const recoveryRate = recoverableRevenue > 0
    ? Number(((recoveredRevenue / recoverableRevenue) * 100).toFixed(1))
    : 0;

  return {
    totalVolume,
    totalPayments,
    successCount,
    successVolume,
    failedCount,
    failedRevenue,
    recoverableRevenue,
    recoveredRevenue,
    recoveryRate
  };
}

async function getPaymentVolumeTrend(period = '90d', merchantId = null) {
  const dateClause = getDateIntervalClause(period);
  const params = [];
  let merchantClause = '';

  if (merchantId) {
    params.push(merchantId);
    merchantClause = `AND merchant_id = $${params.length}`;
  }

  const sql = `
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM-DD') as date_label,
      COALESCE(SUM(amount), 0) as total_volume,
      COALESCE(SUM(amount) FILTER (WHERE status = 'SUCCESS'), 0) as success_volume,
      COALESCE(SUM(amount) FILTER (WHERE status = 'FAILED'), 0) as failed_volume,
      COUNT(*) as total_count,
      COALESCE(COUNT(*) FILTER (WHERE status = 'SUCCESS'), 0) as success_count,
      COALESCE(COUNT(*) FILTER (WHERE status = 'FAILED'), 0) as failed_count
    FROM payments
    WHERE ${dateClause} ${merchantClause}
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
    ORDER BY date_label ASC
  `;

  const result = await db.query(sql, params);
  return result.rows.map(r => ({
    date: r.date_label,
    totalVolume: parseFloat(r.total_volume),
    successVolume: parseFloat(r.success_volume),
    failedVolume: parseFloat(r.failed_volume),
    totalCount: parseInt(r.total_count, 10),
    successCount: parseInt(r.success_count, 10),
    failedCount: parseInt(r.failed_count, 10)
  }));
}

async function getRecoveryTrend(period = '90d', merchantId = null) {
  const dateClause = getDateIntervalClause(period);
  const params = [];
  let merchantClause = '';

  if (merchantId) {
    params.push(merchantId);
    merchantClause = `AND merchant_id = $${params.length}`;
  }

  const sql = `
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM-DD') as date_label,
      COALESCE(SUM(amount) FILTER (WHERE status = 'FAILED'), 0) as failed_revenue,
      COALESCE(SUM(amount) FILTER (WHERE recovery_status = 'RECOVERED'), 0) as recovered_revenue,
      COALESCE(SUM(amount) FILTER (WHERE status = 'FAILED' AND recovery_status != 'UNRECOVERABLE'), 0) as recoverable_revenue
    FROM payments
    WHERE ${dateClause} ${merchantClause}
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
    ORDER BY date_label ASC
  `;

  const result = await db.query(sql, params);
  return result.rows.map(r => {
    const recoverable = parseFloat(r.recoverable_revenue);
    const recovered = parseFloat(r.recovered_revenue);
    const rate = recoverable > 0 ? Number(((recovered / recoverable) * 100).toFixed(1)) : 0;
    return {
      date: r.date_label,
      failedRevenue: parseFloat(r.failed_revenue),
      recoveredRevenue: recovered,
      recoverableRevenue: recoverable,
      recoveryRate: rate
    };
  });
}

async function getFailureReasonsBreakdown(period = '90d', merchantId = null) {
  const dateClause = getDateIntervalClause(period);
  const params = [];
  let merchantClause = '';

  if (merchantId) {
    params.push(merchantId);
    merchantClause = `AND merchant_id = $${params.length}`;
  }

  const sql = `
    SELECT 
      COALESCE(failure_reason, 'UNKNOWN') as reason,
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) as total_lost,
      COALESCE(SUM(amount) FILTER (WHERE recovery_status = 'RECOVERED'), 0) as total_recovered,
      COALESCE(SUM(amount) FILTER (WHERE recovery_status != 'UNRECOVERABLE'), 0) as total_recoverable
    FROM payments
    WHERE status = 'FAILED' AND ${dateClause} ${merchantClause}
    GROUP BY failure_reason
    ORDER BY count DESC
  `;

  const result = await db.query(sql, params);
  return result.rows.map(r => {
    const recoverable = parseFloat(r.total_recoverable);
    const recovered = parseFloat(r.total_recovered);
    const rate = recoverable > 0 ? Number(((recovered / recoverable) * 100).toFixed(1)) : 0;
    return {
      reason: r.reason,
      count: parseInt(r.count, 10),
      totalLost: parseFloat(r.total_lost),
      totalRecoverable: recoverable,
      totalRecovered: recovered,
      recoveryRate: rate
    };
  });
}

async function getTopOpportunities(limit = 6, merchantId = null) {
  const params = [limit];
  let merchantClause = '';

  if (merchantId) {
    params.push(merchantId);
    merchantClause = `AND p.merchant_id = $2`;
  }

  const sql = `
    SELECT 
      p.id,
      p.amount,
      p.currency,
      p.failure_reason,
      p.recovery_status,
      p.created_at,
      m.business_name as merchant_name,
      c.name as customer_name,
      COALESCE(ra.recovery_probability, 70) as recovery_probability,
      COALESCE(ra.probability_level, 'HIGH') as probability_level,
      COALESCE(rr.recommended_action, 'RETRY_AFTER_24_HOURS') as recommended_action,
      COALESCE(rr.expected_recovery, ROUND(p.amount * 0.75, 2)) as expected_recovery
    FROM payments p
    JOIN merchants m ON m.id = p.merchant_id
    JOIN customers c ON c.id = p.customer_id
    LEFT JOIN recovery_analyses ra ON ra.payment_id = p.id
    LEFT JOIN recovery_recommendations rr ON rr.payment_id = p.id
    WHERE p.status = 'FAILED' 
      AND p.recovery_status IN ('PENDING', 'IN_PROGRESS')
      ${merchantClause}
    ORDER BY expected_recovery DESC
    LIMIT $1
  `;

  const result = await db.query(sql, params);
  return result.rows.map(r => ({
    id: r.id,
    amount: parseFloat(r.amount),
    currency: r.currency,
    failureReason: r.failure_reason,
    recoveryStatus: r.recovery_status,
    createdAt: r.created_at,
    merchantName: r.merchant_name,
    customerName: r.customer_name,
    probability: parseInt(r.recovery_probability, 10),
    level: r.probability_level,
    recommendedAction: r.recommended_action,
    expectedRecovery: parseFloat(r.expected_recovery)
  }));
}

module.exports = {
  getDashboardSummary,
  getPaymentVolumeTrend,
  getRecoveryTrend,
  getFailureReasonsBreakdown,
  getTopOpportunities
};
