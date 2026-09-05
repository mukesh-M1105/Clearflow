const db = require('../database/db');
const { stringify } = require('csv-stringify/sync');

/**
 * Report Service
 * Compiles structured reporting datasets from SQL queries and generates CSV exports.
 */

async function getPaymentsReport(filters = {}) {
  const { startDate, endDate, merchantId, status, failureReason } = filters;
  const conditions = [];
  const params = [];

  if (startDate) {
    params.push(startDate);
    conditions.push(`p.created_at >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    conditions.push(`p.created_at <= $${params.length}`);
  }
  if (merchantId) {
    params.push(merchantId);
    conditions.push(`p.merchant_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`p.status = $${params.length}`);
  }
  if (failureReason) {
    params.push(failureReason);
    conditions.push(`p.failure_reason = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      p.id as "Payment ID",
      m.business_name as "Merchant",
      c.name as "Customer Name",
      c.email as "Customer Email",
      p.amount as "Amount",
      p.currency as "Currency",
      p.payment_method as "Payment Method",
      p.status as "Payment Status",
      COALESCE(p.failure_reason, 'N/A') as "Failure Reason",
      p.recovery_status as "Recovery Status",
      TO_CHAR(p.created_at, 'YYYY-MM-DD HH24:MI:SS') as "Created At"
    FROM payments p
    JOIN merchants m ON m.id = p.merchant_id
    JOIN customers c ON c.id = p.customer_id
    ${whereClause}
    ORDER BY p.created_at DESC
  `;

  const result = await db.query(sql, params);
  return result.rows;
}

async function getRecoveryAttemptsReport(filters = {}) {
  const { startDate, endDate, merchantId, status } = filters;
  const conditions = [];
  const params = [];

  if (startDate) {
    params.push(startDate);
    conditions.push(`ra.created_at >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    conditions.push(`ra.created_at <= $${params.length}`);
  }
  if (merchantId) {
    params.push(merchantId);
    conditions.push(`ra.merchant_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`ra.status = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      ra.id as "Recovery ID",
      ra.payment_id as "Payment ID",
      m.business_name as "Merchant",
      p.amount as "Original Amount",
      ra.strategy as "Recovery Strategy",
      ra.attempt_number as "Attempt Number",
      ra.status as "Status",
      COALESCE(ra.result, 'N/A') as "Result Code",
      ra.recovered_amount as "Recovered Amount",
      TO_CHAR(ra.created_at, 'YYYY-MM-DD HH24:MI:SS') as "Attempted At"
    FROM recovery_attempts ra
    JOIN payments p ON p.id = ra.payment_id
    JOIN merchants m ON m.id = ra.merchant_id
    ${whereClause}
    ORDER BY ra.created_at DESC
  `;

  const result = await db.query(sql, params);
  return result.rows;
}

async function getMerchantsReport(filters = {}) {
  const { merchantId } = filters;
  const params = [];
  let whereClause = '';

  if (merchantId) {
    params.push(merchantId);
    whereClause = `WHERE m.id = $1`;
  }

  const sql = `
    SELECT 
      m.id as "Merchant ID",
      m.business_name as "Business Name",
      m.business_type as "Industry Category",
      COUNT(p.id) as "Total Transactions",
      COALESCE(SUM(p.amount), 0) as "Gross Volume",
      COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'FAILED'), 0) as "Failed Revenue",
      COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'FAILED' AND p.recovery_status != 'UNRECOVERABLE'), 0) as "Recoverable Revenue",
      COALESCE(SUM(p.amount) FILTER (WHERE p.recovery_status = 'RECOVERED'), 0) as "Recovered Revenue",
      CASE 
        WHEN COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'FAILED' AND p.recovery_status != 'UNRECOVERABLE'), 0) > 0 
        THEN ROUND(
          (COALESCE(SUM(p.amount) FILTER (WHERE p.recovery_status = 'RECOVERED'), 0) / 
           COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'FAILED' AND p.recovery_status != 'UNRECOVERABLE'), 1)) * 100, 
          1
        )
        ELSE 0 
      END as "Recovery Rate %"
    FROM merchants m
    LEFT JOIN payments p ON p.merchant_id = m.id
    ${whereClause}
    GROUP BY m.id, m.business_name, m.business_type
    ORDER BY "Gross Volume" DESC
  `;

  const result = await db.query(sql, params);
  return result.rows;
}

function exportToCsv(data) {
  if (!data || data.length === 0) {
    return '';
  }
  return stringify(data, { header: true });
}

module.exports = {
  getPaymentsReport,
  getRecoveryAttemptsReport,
  getMerchantsReport,
  exportToCsv
};
