/**
 * Recovery Recommendation Engine
 * Analyzes failure categorization and probabilistic score to recommend
 * the highest ROI recovery strategy, delay timing, and communication channel.
 */
function recommendAction(failureReason, probability, retryCount = 0) {
  const reason = (failureReason || 'UNKNOWN').toUpperCase();

  // Rule 1: High exhaustion threshold
  if (retryCount >= 3 || probability < 15) {
    return {
      action: 'MARK_UNRECOVERABLE',
      delay: 'None',
      expectedOutcome: 'Close recovery case to preserve merchant reputation and avoid card network velocity penalties.',
      channel: 'Internal Flag',
      reason: 'Transaction has exhausted viable automated recovery attempts without positive cardholder response.'
    };
  }

  // Rule 2: Network / Timeout Failures
  if (reason === 'NETWORK_ERROR' || reason === 'TIMEOUT') {
    return {
      action: 'RETRY_IMMEDIATELY',
      delay: 'Immediate (0-5 min)',
      expectedOutcome: 'Expected >90% capture rate using secondary acquiring bank routing pipe.',
      channel: 'Automated Gateway Fallback Rail',
      reason: 'Transient network glitch or bank switch timeout resolved. Safe to execute automated instant re-attempt.'
    };
  }

  // Rule 3: Insufficient Funds
  if (reason === 'INSUFFICIENT_FUNDS') {
    if (probability >= 60) {
      return {
        action: 'RETRY_AFTER_24_HOURS',
        delay: '24 hours',
        expectedOutcome: 'High success probability during morning batch clearing or next calendar day banking cycle.',
        channel: 'Scheduled Smart Reattempt',
        reason: 'Allows customer time to replenish funds, transfer liquidity, or have daily credit card limit reset.'
      };
    } else {
      return {
        action: 'REQUEST_DIFFERENT_PAYMENT_METHOD',
        delay: 'Immediate',
        expectedOutcome: 'Direct payment redirect link sent to customer for alternative UPI or card selection.',
        channel: 'WhatsApp / Email Link',
        reason: 'Low customer liquidity profile; prompted alternative payment instrument offers superior conversion.'
      };
    }
  }

  // Rule 4: Authentication Failures (3DS / OTP)
  if (reason === 'AUTHENTICATION_FAILURE') {
    return {
      action: 'SEND_PAYMENT_REMINDER',
      delay: '15-30 minutes',
      expectedOutcome: 'Re-engages customer who dropped off during SMS OTP or 3DS verification step.',
      channel: 'SMS & WhatsApp Interactive Message',
      reason: 'Payment intent remains valid. Customer likely experienced temporary mobile network or OTP delay.'
    };
  }

  // Rule 5: Expired Card
  if (reason === 'EXPIRED_CARD') {
    return {
      action: 'REQUEST_DIFFERENT_PAYMENT_METHOD',
      delay: 'Immediate',
      expectedOutcome: 'Customer updates expired credentials with new expiry date or backup credit card.',
      channel: 'Secured Payment Link',
      reason: 'Card expiration is a hard decline that cannot be resolved through automated retries.'
    };
  }

  // Rule 6: Bank Declined (Risk / Policy)
  if (reason === 'BANK_DECLINED') {
    if (probability >= 50) {
      return {
        action: 'RETRY_AFTER_1_HOUR',
        delay: '1 hour',
        expectedOutcome: 'Bank security heuristic cooldown allows normal processing.',
        channel: 'Scheduled Batch Retry',
        reason: 'Temporary velocity check by issuing bank. A 60-minute buffer clears false-positive fraud filters.'
      };
    } else {
      return {
        action: 'CONTACT_CUSTOMER',
        delay: '1-2 hours',
        expectedOutcome: 'Customer calls bank or approves in-app notification before authorizing payment.',
        channel: 'Customer Support Escalation',
        reason: 'Issuing bank blocked charge due to strict customer-specific card control settings.'
      };
    }
  }

  // Default fallback
  return {
    action: 'RETRY_AFTER_1_HOUR',
    delay: '1 hour',
    expectedOutcome: 'Allows transient processor issues to settle before re-evaluating transaction.',
    channel: 'Automated Recovery Queue',
    reason: 'Generic decline requires observational cooldown window.'
  };
}

module.exports = {
  recommendAction
};
