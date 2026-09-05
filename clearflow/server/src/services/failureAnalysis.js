/**
 * Failure Analysis Service
 * Categorizes and diagnoses payment failures into structured root causes,
 * plain-English explanations, recovery viability, and suggested actions.
 */

const FAILURE_METADATA = {
  INSUFFICIENT_FUNDS: {
    name: 'Insufficient Funds',
    explanation: "The payment was declined because the customer's available account balance or card credit limit was insufficient at the moment of charge.",
    recoveryPossibility: 'HIGH',
    suggestedAction: 'Retry after 24 hours to align with account replenishment or daily card limit reset.',
    baseProbability: 65,
    isTransient: true
  },
  BANK_DECLINED: {
    name: 'Bank Declined',
    explanation: 'The issuing bank declined the authorization request due to internal fraud heuristics, unusual location velocity, or temporary card freeze.',
    recoveryPossibility: 'MEDIUM',
    suggestedAction: 'Retry after 1 hour or prompt customer to approve notification from banking app.',
    baseProbability: 45,
    isTransient: false
  },
  NETWORK_ERROR: {
    name: 'Network Error',
    explanation: 'A transient telecommunications or payment switch glitch disrupted packet delivery between the gateway and the bank core.',
    recoveryPossibility: 'VERY HIGH',
    suggestedAction: 'Retry immediately using automated fallback rail.',
    baseProbability: 80,
    isTransient: true
  },
  AUTHENTICATION_FAILURE: {
    name: 'Authentication Failure',
    explanation: '3D Secure authentication was not completed. The customer did not submit the SMS OTP or closed the bank verification portal.',
    recoveryPossibility: 'MEDIUM',
    suggestedAction: 'Send a payment recovery reminder link via SMS or WhatsApp.',
    baseProbability: 55,
    isTransient: true
  },
  EXPIRED_CARD: {
    name: 'Expired Card',
    explanation: 'The card expiration date provided has elapsed, preventing transaction authorization.',
    recoveryPossibility: 'LOW',
    suggestedAction: 'Request a different payment method or dispatch a new mandate link.',
    baseProbability: 25,
    isTransient: false
  },
  TIMEOUT: {
    name: 'Gateway Timeout',
    explanation: 'The issuing bank switch took longer than 30 seconds to provide an authorization response, triggering an upstream timeout.',
    recoveryPossibility: 'VERY HIGH',
    suggestedAction: 'Retry immediately or within 15 minutes with exponential backoff.',
    baseProbability: 85,
    isTransient: true
  },
  UNKNOWN: {
    name: 'Unknown Failure',
    explanation: 'The transaction was rejected with a generic unclassified decline response from the acquiring processor.',
    recoveryPossibility: 'MEDIUM',
    suggestedAction: 'Perform telemetry check and schedule follow-up retry in 1 hour.',
    baseProbability: 40,
    isTransient: false
  }
};

/**
 * Analyzes a given payment failure reason
 * @param {string} reason - Failure reason code
 * @returns {object} Structured failure diagnosis
 */
function analyzeFailure(reason) {
  const normalizedReason = (reason || 'UNKNOWN').toUpperCase();
  const meta = FAILURE_METADATA[normalizedReason] || FAILURE_METADATA.UNKNOWN;

  return {
    reason: normalizedReason,
    displayName: meta.name,
    explanation: meta.explanation,
    recoveryPossibility: meta.recoveryPossibility,
    suggestedAction: meta.suggestedAction,
    baseProbability: meta.baseProbability,
    isTransient: meta.isTransient
  };
}

module.exports = {
  FAILURE_METADATA,
  analyzeFailure
};
