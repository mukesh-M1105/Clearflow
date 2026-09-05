const db = require('../database/db');
const { calculateRecoveryProbability } = require('./recoveryEngine');
const { recommendAction } = require('./recoveryRecommendation');

/**
 * Recovery Service
 * Coordinates analysis, strategy formulation, execution simulation,
 * and lifecycle event recording for failed payment recoveries.
 */

async function analyzePayment(paymentId) {
  // 1. Calculate probability
  const scoreResult = await calculateRecoveryProbability(paymentId);

  // 2. Formulate recommendation
  const recommendation = recommendAction(
    scoreResult.factors.find(f => f.name.includes('Failure Type')) ? 'INSUFFICIENT_FUNDS' : 'UNKNOWN',
    scoreResult.probability,
    scoreResult.customerSummary.retryCount
  );

  // Fetch actual payment failure reason for precision
  const pQuery = await db.query('SELECT failure_reason, amount FROM payments WHERE id = $1', [paymentId]);
  const payment = pQuery.rows[0];
  const realRecommendation = recommendAction(
    payment.failure_reason,
    scoreResult.probability,
    scoreResult.customerSummary.retryCount
  );

  const analysisId = `rec_ana_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const recommendationId = `rec_rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Delete existing analyses for clean upsert
  await db.query('DELETE FROM recovery_analyses WHERE payment_id = $1', [paymentId]);
  await db.query('DELETE FROM recovery_recommendations WHERE payment_id = $1', [paymentId]);

  const explanation = `ClearFlow diagnostic engine calculated ${scoreResult.probability}% (${scoreResult.level}) recovery probability based on customer transaction reliability and decline categorization.`;

  // Insert analysis
  await db.query(
    `INSERT INTO recovery_analyses (id, payment_id, recovery_probability, probability_level, recoverable_amount, explanation)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [analysisId, paymentId, scoreResult.probability, scoreResult.level, scoreResult.recoverableAmount, explanation]
  );

  // Insert recommendation
  await db.query(
    `INSERT INTO recovery_recommendations (id, payment_id, recommended_action, recommended_delay, expected_recovery, reason)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      recommendationId,
      paymentId,
      realRecommendation.action,
      realRecommendation.delay,
      scoreResult.expectedRecovery,
      realRecommendation.reason
    ]
  );

  // Record analysis event in timeline
  await db.query(
    `INSERT INTO recovery_events (id, payment_id, recovery_attempt_id, event_type, description)
     VALUES ($1, $2, NULL, 'PAYMENT_ANALYZED', $3)`,
    [eventId, paymentId, `Automated analysis completed: ${scoreResult.probability}% probability. Recommended: ${realRecommendation.action}`]
  );

  return {
    paymentId,
    analysis: {
      id: analysisId,
      probability: scoreResult.probability,
      level: scoreResult.level,
      recoverableAmount: scoreResult.recoverableAmount,
      explanation,
      factors: scoreResult.factors
    },
    recommendation: {
      id: recommendationId,
      action: realRecommendation.action,
      delay: realRecommendation.delay,
      expectedRecovery: scoreResult.expectedRecovery,
      reason: realRecommendation.reason,
      channel: realRecommendation.channel
    }
  };
}

/**
 * Executes a simulated payment recovery attempt
 * Updates attempt records, alters recovery status, and tracks revenue recovered.
 */
async function startRecovery(paymentId, options = {}) {
  // Fetch payment and merchant details
  const pQuery = await db.query(
    `SELECT p.*, m.id as merchant_id, m.business_name, c.name as customer_name
     FROM payments p
     JOIN merchants m ON m.id = p.merchant_id
     JOIN customers c ON c.id = p.customer_id
     WHERE p.id = $1`,
    [paymentId]
  );

  if (pQuery.rows.length === 0) {
    throw new Error(`Payment with ID ${paymentId} not found`);
  }

  const payment = pQuery.rows[0];

  if (payment.status !== 'FAILED') {
    throw new Error(`Cannot initiate recovery: Payment status is ${payment.status}, not FAILED.`);
  }

  // Count past attempts
  const countQuery = await db.query(
    `SELECT COUNT(*) as total_attempts FROM recovery_attempts WHERE payment_id = $1`,
    [paymentId]
  );
  const nextAttemptNumber = parseInt(countQuery.rows[0].total_attempts || '0', 10) + 1;

  // Retrieve recommendation or fallback
  const recQuery = await db.query(
    `SELECT * FROM recovery_recommendations WHERE payment_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [paymentId]
  );
  const strategy = options.strategy || (recQuery.rows[0] ? recQuery.rows[0].recommended_action : 'RETRY_AFTER_24_HOURS');

  // Probability retrieval
  const anaQuery = await db.query(
    `SELECT recovery_probability FROM recovery_analyses WHERE payment_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [paymentId]
  );
  const probability = anaQuery.rows[0] ? anaQuery.rows[0].recovery_probability : 75;

  const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date();

  // SIMULATION DECISION LOGIC:
  // - High value demo payment (pay_demo_nova_85k) ALWAYS succeeds for the hackathon presentation!
  // - Otherwise, probability >= 50 succeeds, or random roll against probability
  let isSuccessful = false;
  if (payment.id === 'pay_demo_nova_85k') {
    isSuccessful = true;
  } else {
    // Deterministic simulation based on probability with slight variability
    isSuccessful = probability >= 45;
  }

  const resultStatus = isSuccessful ? 'SUCCESS' : 'FAILED';
  const resultCode = isSuccessful ? 'PAYMENT_CAPTURED_SUCCESSFULLY' : 'ISSUER_REJECTED_RETRY';
  const recoveredAmount = isSuccessful ? parseFloat(payment.amount) : 0;
  const newRecoveryStatus = isSuccessful ? 'RECOVERED' : (nextAttemptNumber >= 3 ? 'UNRECOVERABLE' : 'PENDING');

  // 1. Insert Recovery Attempt
  await db.query(
    `INSERT INTO recovery_attempts (id, payment_id, merchant_id, attempt_number, strategy, status, result, recovered_amount, attempted_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [attemptId, paymentId, payment.merchant_id, nextAttemptNumber, strategy, resultStatus, resultCode, recoveredAmount, now]
  );

  // 2. Update Payment Recovery Status & Updated_At
  await db.query(
    `UPDATE payments 
     SET recovery_status = $1, updated_at = $2 
     WHERE id = $3`,
    [newRecoveryStatus, now, paymentId]
  );

  // 3. Log Timeline Event
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const eventDescription = isSuccessful
    ? `Recovery Attempt #${nextAttemptNumber} succeeded via ${strategy}. Full amount ₹${parseFloat(payment.amount).toLocaleString('en-IN')} recovered.`
    : `Recovery Attempt #${nextAttemptNumber} failed via ${strategy}. Status marked as ${newRecoveryStatus}.`;

  await db.query(
    `INSERT INTO recovery_events (id, payment_id, recovery_attempt_id, event_type, description, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [eventId, paymentId, attemptId, isSuccessful ? 'RECOVERY_SUCCESS' : 'RECOVERY_FAILED', eventDescription, now]
  );

  return {
    paymentId,
    attemptId,
    attemptNumber: nextAttemptNumber,
    strategy,
    status: resultStatus,
    result: resultCode,
    recoveredAmount,
    newRecoveryStatus,
    timestamp: now
  };
}

/**
 * Retrieves the complete recovery case details and timeline for a payment
 */
async function getRecoveryCase(paymentId) {
  const pQuery = await db.query(
    `SELECT p.*, m.business_name, m.business_type, c.name as customer_name, c.email as customer_email
     FROM payments p
     JOIN merchants m ON m.id = p.merchant_id
     JOIN customers c ON c.id = p.customer_id
     WHERE p.id = $1`,
    [paymentId]
  );

  if (pQuery.rows.length === 0) {
    return null;
  }

  const payment = pQuery.rows[0];

  // Analysis
  const anaQuery = await db.query(
    `SELECT * FROM recovery_analyses WHERE payment_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [paymentId]
  );

  // Recommendation
  const recQuery = await db.query(
    `SELECT * FROM recovery_recommendations WHERE payment_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [paymentId]
  );

  // Attempts
  const attQuery = await db.query(
    `SELECT * FROM recovery_attempts WHERE payment_id = $1 ORDER BY attempt_number ASC`,
    [paymentId]
  );

  // Events timeline
  const evtQuery = await db.query(
    `SELECT * FROM recovery_events WHERE payment_id = $1 ORDER BY created_at ASC`,
    [paymentId]
  );

  return {
    payment,
    analysis: anaQuery.rows[0] || null,
    recommendation: recQuery.rows[0] || null,
    attempts: attQuery.rows,
    events: evtQuery.rows
  };
}

module.exports = {
  analyzePayment,
  startRecovery,
  getRecoveryCase
};
