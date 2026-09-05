const db = require('../database/db');

async function getPayments(req, res, next) {
  try {
    const {
      search = '',
      status,
      failureReason,
      recoveryStatus,
      startDate,
      endDate,
      page = 1,
      limit = 15,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const conditions = [];
    const params = [];

    // Enforce merchant scope
    if (req.merchantScopeId) {
      params.push(req.merchantScopeId);
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

    if (recoveryStatus) {
      params.push(recoveryStatus);
      conditions.push(`p.recovery_status = $${params.length}`);
    }

    if (startDate) {
      params.push(startDate);
      conditions.push(`p.created_at >= $${params.length}`);
    }

    if (endDate) {
      params.push(endDate);
      conditions.push(`p.created_at <= $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      const sIdx = params.length;
      conditions.push(`(p.id ILIKE $${sIdx} OR c.name ILIKE $${sIdx} OR c.email ILIKE $${sIdx} OR m.business_name ILIKE $${sIdx})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Allowed sort columns to prevent SQL injection
    const allowedSortCols = ['created_at', 'amount', 'status', 'recovery_status'];
    const safeSortCol = allowedSortCols.includes(sortBy) ? `p.${sortBy}` : 'p.created_at';
    const safeSortDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Total count query
    const countSql = `
      SELECT COUNT(*) as total
      FROM payments p
      JOIN merchants m ON m.id = p.merchant_id
      JOIN customers c ON c.id = p.customer_id
      ${whereClause}
    `;
    const countResult = await db.query(countSql, params);
    const total = parseInt(countResult.rows[0].total || '0', 10);

    // Data query with pagination
    params.push(parseInt(limit, 10));
    const limitParam = `$${params.length}`;
    params.push(offset);
    const offsetParam = `$${params.length}`;

    const dataSql = `
      SELECT 
        p.id,
        p.merchant_id,
        m.business_name as merchant_name,
        p.customer_id,
        c.name as customer_name,
        c.email as customer_email,
        p.amount,
        p.currency,
        p.payment_method,
        p.status,
        p.failure_reason,
        p.recovery_status,
        p.created_at,
        p.updated_at,
        ra.recovery_probability,
        ra.probability_level,
        rr.recommended_action,
        rr.expected_recovery
      FROM payments p
      JOIN merchants m ON m.id = p.merchant_id
      JOIN customers c ON c.id = p.customer_id
      LEFT JOIN recovery_analyses ra ON ra.payment_id = p.id
      LEFT JOIN recovery_recommendations rr ON rr.payment_id = p.id
      ${whereClause}
      ORDER BY ${safeSortCol} ${safeSortDir}
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `;

    const dataResult = await db.query(dataSql, params);

    res.status(200).json({
      success: true,
      data: {
        payments: dataResult.rows.map(r => ({
          ...r,
          amount: parseFloat(r.amount),
          expected_recovery: r.expected_recovery ? parseFloat(r.expected_recovery) : null
        })),
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / parseInt(limit, 10))
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getPaymentById(req, res, next) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        p.*,
        m.business_name,
        m.business_type,
        c.name as customer_name,
        c.email as customer_email
      FROM payments p
      JOIN merchants m ON m.id = p.merchant_id
      JOIN customers c ON c.id = p.customer_id
      WHERE p.id = $1
    `;
    const result = await db.query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Payment '${id}' not found.`
      });
    }

    const payment = result.rows[0];

    // Check merchant scope
    if (req.user.role === 'MERCHANT' && payment.merchant_id !== req.user.merchant_id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You cannot access payment details belonging to another merchant.'
      });
    }

    // Fetch recovery analysis
    const analysisRes = await db.query(
      `SELECT * FROM recovery_analyses WHERE payment_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [id]
    );

    // Fetch recovery recommendation
    const recRes = await db.query(
      `SELECT * FROM recovery_recommendations WHERE payment_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [id]
    );

    // Fetch previous retry attempts
    const attemptsRes = await db.query(
      `SELECT * FROM recovery_attempts WHERE payment_id = $1 ORDER BY attempt_number ASC`,
      [id]
    );

    // Fetch recovery event timeline
    const eventsRes = await db.query(
      `SELECT * FROM recovery_events WHERE payment_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    // Fetch customer's payment history summary
    const custHistoryRes = await db.query(
      `SELECT 
         COUNT(*) as total_payments,
         COUNT(*) FILTER (WHERE status = 'SUCCESS') as successful_payments,
         COALESCE(SUM(amount) FILTER (WHERE status = 'SUCCESS'), 0) as lifetime_spend
       FROM payments
       WHERE customer_id = $1`,
      [payment.customer_id]
    );

    res.status(200).json({
      success: true,
      data: {
        payment: {
          ...payment,
          amount: parseFloat(payment.amount)
        },
        analysis: analysisRes.rows[0] ? {
          ...analysisRes.rows[0],
          recoverable_amount: parseFloat(analysisRes.rows[0].recoverable_amount)
        } : null,
        recommendation: recRes.rows[0] ? {
          ...recRes.rows[0],
          expected_recovery: parseFloat(recRes.rows[0].expected_recovery)
        } : null,
        attempts: attemptsRes.rows.map(a => ({
          ...a,
          recovered_amount: parseFloat(a.recovered_amount)
        })),
        events: eventsRes.rows,
        customerHistory: {
          total: parseInt(custHistoryRes.rows[0].total_payments, 10),
          successful: parseInt(custHistoryRes.rows[0].successful_payments, 10),
          lifetimeSpend: parseFloat(custHistoryRes.rows[0].lifetime_spend)
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getFailedPayments(req, res, next) {
  // Delegate with forced status = 'FAILED'
  req.query.status = 'FAILED';
  return getPayments(req, res, next);
}

module.exports = {
  getPayments,
  getPaymentById,
  getFailedPayments
};
