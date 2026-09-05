const db = require('../database/db');
const recoveryService = require('../services/recoveryService');

async function getRecoveryAttempts(req, res, next) {
  try {
    const {
      search = '',
      status,
      strategy,
      page = 1,
      limit = 15
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const conditions = [];
    const params = [];

    // Merchant scope
    if (req.merchantScopeId) {
      params.push(req.merchantScopeId);
      conditions.push(`ra.merchant_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`ra.status = $${params.length}`);
    }

    if (strategy) {
      params.push(strategy);
      conditions.push(`ra.strategy = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      const sIdx = params.length;
      conditions.push(`(ra.id ILIKE $${sIdx} OR ra.payment_id ILIKE $${sIdx} OR m.business_name ILIKE $${sIdx})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count
    const countSql = `
      SELECT COUNT(*) as total
      FROM recovery_attempts ra
      JOIN merchants m ON m.id = ra.merchant_id
      JOIN payments p ON p.id = ra.payment_id
      ${whereClause}
    `;
    const countRes = await db.query(countSql, params);
    const total = parseInt(countRes.rows[0].total || '0', 10);

    // List
    params.push(parseInt(limit, 10));
    const limitParam = `$${params.length}`;
    params.push(offset);
    const offsetParam = `$${params.length}`;

    const listSql = `
      SELECT 
        ra.id,
        ra.payment_id,
        ra.merchant_id,
        m.business_name as merchant_name,
        p.amount as original_amount,
        p.currency,
        p.failure_reason,
        ra.attempt_number,
        ra.strategy,
        ra.status,
        ra.result,
        ra.recovered_amount,
        ra.attempted_at,
        ra.created_at
      FROM recovery_attempts ra
      JOIN merchants m ON m.id = ra.merchant_id
      JOIN payments p ON p.id = ra.payment_id
      ${whereClause}
      ORDER BY ra.created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `;

    const listRes = await db.query(listSql, params);

    res.status(200).json({
      success: true,
      data: {
        attempts: listRes.rows.map(r => ({
          ...r,
          original_amount: parseFloat(r.original_amount),
          recovered_amount: parseFloat(r.recovered_amount)
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

async function getRecoveryCase(req, res, next) {
  try {
    const { id } = req.params; // paymentId
    const recoveryCase = await recoveryService.getRecoveryCase(id);

    if (!recoveryCase) {
      return res.status(404).json({
        success: false,
        message: `Recovery case for payment '${id}' not found.`
      });
    }

    // Check merchant scope
    if (req.user.role === 'MERCHANT' && recoveryCase.payment.merchant_id !== req.user.merchant_id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Access restricted to assigned merchant profile.'
      });
    }

    res.status(200).json({
      success: true,
      data: recoveryCase
    });
  } catch (err) {
    next(err);
  }
}

async function analyzePayment(req, res, next) {
  try {
    const { paymentId } = req.params;

    // Check merchant authorization
    if (req.user.role === 'MERCHANT') {
      const pCheck = await db.query('SELECT merchant_id FROM payments WHERE id = $1', [paymentId]);
      if (pCheck.rows.length === 0 || pCheck.rows[0].merchant_id !== req.user.merchant_id) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to this payment.' });
      }
    }

    const analysisResult = await recoveryService.analyzePayment(paymentId);

    res.status(200).json({
      success: true,
      message: 'Payment recovery analysis completed successfully.',
      data: analysisResult
    });
  } catch (err) {
    next(err);
  }
}

async function startRecovery(req, res, next) {
  try {
    const { paymentId } = req.params;

    // Check merchant authorization
    if (req.user.role === 'MERCHANT') {
      const pCheck = await db.query('SELECT merchant_id FROM payments WHERE id = $1', [paymentId]);
      if (pCheck.rows.length === 0 || pCheck.rows[0].merchant_id !== req.user.merchant_id) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to this payment.' });
      }
    }

    const result = await recoveryService.startRecovery(paymentId, req.body);

    res.status(200).json({
      success: true,
      message: `Simulated recovery attempt completed with status: ${result.status}`,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRecoveryAttempts,
  getRecoveryCase,
  analyzePayment,
  startRecovery
};
