const db = require('../database/db');
const { analyzeFailure } = require('./failureAnalysis');

/**
 * Recovery Probability Engine
 * Computes an empirical 0-100 probability score for recovering a failed payment.
 * Evaluates multiple factors: failure classification, customer lifetime payment history,
 * transaction sizing, retry fatigue, and time decay.
 */
async function calculateRecoveryProbability(paymentId) {
  // 1. Fetch payment details, customer history, and retry attempts
  const paymentQuery = await db.query(
    `SELECT p.*, c.email as customer_email, c.name as customer_name
     FROM payments p
     JOIN customers c ON c.id = p.customer_id
     WHERE p.id = $1`,
    [paymentId]
  );

  if (paymentQuery.rows.length === 0) {
    throw new Error(`Payment with ID ${paymentId} not found.`);
  }

  const payment = paymentQuery.rows[0];
  const failureInfo = analyzeFailure(payment.failure_reason);

  // 2. Fetch customer's prior payment history (successful vs failed)
  const historyQuery = await db.query(
    `SELECT 
       COUNT(*) FILTER (WHERE status = 'SUCCESS') as success_count,
       COUNT(*) FILTER (WHERE status = 'FAILED' AND id != $1) as fail_count,
       COALESCE(SUM(amount) FILTER (WHERE status = 'SUCCESS'), 0) as total_lifetime_spent,
       MAX(created_at) as last_payment_date
     FROM payments 
     WHERE customer_id = $2`,
    [paymentId, payment.customer_id]
  );

  const history = historyQuery.rows[0];
  const successCount = parseInt(history.success_count || '0', 10);
  const failCount = parseInt(history.fail_count || '0', 10);

  // 3. Fetch previous recovery attempts for this specific payment
  const attemptsQuery = await db.query(
    `SELECT COUNT(*) as retry_count
     FROM recovery_attempts
     WHERE payment_id = $1`,
    [paymentId]
  );
  const retryCount = parseInt(attemptsQuery.rows[0].retry_count || '0', 10);

  // 4. Calculate Base Score & Factors
  let score = 50; // Starting baseline
  const factors = [];

  // Factor A: Known Failure Reason
  if (failureInfo.isTransient) {
    const impact = 20;
    score += impact;
    factors.push({
      name: 'Transient / Recoverable Failure Type',
      impact: `+${impact}`,
      explanation: `${failureInfo.displayName} is typically temporary. The underlying bank or customer state can be re-queried.`
    });
  } else if (payment.failure_reason === 'EXPIRED_CARD') {
    const impact = -20;
    score += impact;
    factors.push({
      name: 'Expired Instrument',
      impact: `${impact}`,
      explanation: 'Expired cards cannot be auto-charged without user updating credentials.'
    });
  } else {
    const impact = -5;
    score += impact;
    factors.push({
      name: 'Non-Transient Decline',
      impact: `${impact}`,
      explanation: 'Issuer decline requires cooling period or customer intervention.'
    });
  }

  // Factor B: Customer Historical Reliability
  if (successCount >= 3) {
    const impact = 20;
    score += impact;
    factors.push({
      name: 'Established Customer Trust',
      impact: `+${impact}`,
      explanation: `Customer has successfully completed ${successCount} previous transactions (Lifetime Volume: ₹${Number(history.total_lifetime_spent).toLocaleString('en-IN')}).`
    });
  } else if (successCount >= 1) {
    const impact = 10;
    score += impact;
    factors.push({
      name: 'Verified Prior Payer',
      impact: `+${impact}`,
      explanation: 'Customer has at least one prior verified settlement on record.'
    });
  } else {
    const impact = -5;
    score += impact;
    factors.push({
      name: 'First-Time / New Customer',
      impact: `${impact}`,
      explanation: 'No established payment profile found on merchant records.'
    });
  }

  // Factor C: Retry Fatigue / Previous Attempts
  if (retryCount === 0) {
    const impact = 15;
    score += impact;
    factors.push({
      name: 'First Recovery Attempt',
      impact: `+${impact}`,
      explanation: 'Card network velocity limits have not been triggered. Clean slate for primary retry.'
    });
  } else if (retryCount === 1) {
    const impact = 0;
    factors.push({
      name: 'Single Prior Retry',
      impact: `0`,
      explanation: 'One previous attempt logged. Modest recovery headroom remains.'
    });
  } else if (retryCount >= 2) {
    const impact = -20;
    score += impact;
    factors.push({
      name: 'Retry Fatigue Detected',
      impact: `${impact}`,
      explanation: `${retryCount} prior recovery attempts have already failed for this transaction.`
    });
  }

  // Factor D: Customer Failure Ratio
  if (failCount > 3 && failCount > successCount) {
    const impact = -15;
    score += impact;
    factors.push({
      name: 'Elevated Historic Failure Ratio',
      impact: `${impact}`,
      explanation: `Customer history shows high decline frequency (${failCount} historical failures).`
    });
  }

  // Factor E: Transaction Amount Sizing
  const amt = parseFloat(payment.amount);
  if (amt <= 5000) {
    const impact = 10;
    score += impact;
    factors.push({
      name: 'Low Friction Ticket Size',
      impact: `+${impact}`,
      explanation: `Amount (₹${amt.toLocaleString('en-IN')}) is within frictionless debit and UPI automatic retry limits.`
    });
  } else if (amt > 50000) {
    // High amount
    if (successCount >= 2) {
      const impact = 5;
      score += impact;
      factors.push({
        name: 'High-Value Verified Buyer',
        impact: `+${impact}`,
        explanation: `Ticket size of ₹${amt.toLocaleString('en-IN')} backed by verified high-ticket purchasing history.`
      });
    } else {
      const impact = -10;
      score += impact;
      factors.push({
        name: 'High-Value Exposure',
        impact: `${impact}`,
        explanation: 'Higher transaction ticket sizes trigger stricter bank fraud throttling.'
      });
    }
  }

  // Factor F: Time Elapsed Since Failure
  const failureTime = new Date(payment.created_at).getTime();
  const hoursSinceFailure = (Date.now() - failureTime) / (1000 * 60 * 60);

  if (hoursSinceFailure <= 6) {
    const impact = 12;
    score += impact;
    factors.push({
      name: 'Fresh Failure Window',
      impact: `+${impact}`,
      explanation: `Failed only ${Math.round(hoursSinceFailure)} hours ago; customer intent and shopping session are fresh.`
    });
  } else if (hoursSinceFailure > 72) {
    const impact = -15;
    score += impact;
    factors.push({
      name: 'Delayed Engagement Decay',
      impact: `${impact}`,
      explanation: `Transaction failed ${Math.round(hoursSinceFailure / 24)} days ago. User intent and cart conversion drop sharply.`
    });
  }

  // Factor G: Payment Method Affinity
  if (payment.payment_method.includes('UPI') || payment.payment_method.includes('Credit Card')) {
    const impact = 5;
    score += impact;
    factors.push({
      name: 'Instant Rail Instrument',
      impact: `+${impact}`,
      explanation: `${payment.payment_method} supports instantaneous re-presentment and push authorization.`
    });
  }

  // Bound score between 0 and 100
  const normalizedProbability = Math.max(0, Math.min(100, Math.round(score)));

  // Determine Level
  let level = 'MEDIUM';
  if (normalizedProbability < 30) level = 'VERY LOW';
  else if (normalizedProbability < 50) level = 'LOW';
  else if (normalizedProbability < 70) level = 'MEDIUM';
  else if (normalizedProbability < 85) level = 'HIGH';
  else level = 'VERY HIGH';

  const recoverableAmount = parseFloat(payment.amount);
  const expectedRecovery = Number(((recoverableAmount * normalizedProbability) / 100).toFixed(2));

  return {
    paymentId,
    probability: normalizedProbability,
    level,
    recoverableAmount,
    expectedRecovery,
    factors,
    customerSummary: {
      name: payment.customer_name,
      email: payment.customer_email,
      lifetimeSuccesses: successCount,
      lifetimeFailures: failCount,
      retryCount
    }
  };
}

module.exports = {
  calculateRecoveryProbability
};
