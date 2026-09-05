const { analyzeFailure } = require('./src/services/failureAnalysis');
const { recommendAction } = require('./src/services/recoveryRecommendation');

console.log('🧪 ====================================================');
console.log('🧪 Running Algorithmic Engine Unit Tests');
console.log('🧪 ====================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failed++;
  }
}

// 1. Test Failure Analysis
const fundsAnalysis = analyzeFailure('INSUFFICIENT_FUNDS');
assert(fundsAnalysis.displayName === 'Insufficient Funds', 'Failure Analysis: Categorizes INSUFFICIENT_FUNDS correctly');
assert(fundsAnalysis.recoveryPossibility === 'HIGH', 'Failure Analysis: INSUFFICIENT_FUNDS has HIGH recovery possibility');
assert(fundsAnalysis.isTransient === true, 'Failure Analysis: INSUFFICIENT_FUNDS marked as transient');

const expiredAnalysis = analyzeFailure('EXPIRED_CARD');
assert(expiredAnalysis.recoveryPossibility === 'LOW', 'Failure Analysis: EXPIRED_CARD has LOW recovery possibility');
assert(expiredAnalysis.isTransient === false, 'Failure Analysis: EXPIRED_CARD marked as non-transient');

const networkAnalysis = analyzeFailure('NETWORK_ERROR');
assert(networkAnalysis.recoveryPossibility === 'VERY HIGH', 'Failure Analysis: NETWORK_ERROR has VERY HIGH recovery possibility');

// 2. Test Recovery Recommendation Engine
const netRec = recommendAction('NETWORK_ERROR', 90, 0);
assert(netRec.action === 'RETRY_IMMEDIATELY', 'Recommendation: NETWORK_ERROR recommends RETRY_IMMEDIATELY');

const fundsRecHigh = recommendAction('INSUFFICIENT_FUNDS', 82, 0);
assert(fundsRecHigh.action === 'RETRY_AFTER_24_HOURS', 'Recommendation: High probability INSUFFICIENT_FUNDS recommends RETRY_AFTER_24_HOURS');
assert(fundsRecHigh.delay === '24 hours', 'Recommendation: Prescribes 24 hours delay');

const fundsRecLow = recommendAction('INSUFFICIENT_FUNDS', 40, 0);
assert(fundsRecLow.action === 'REQUEST_DIFFERENT_PAYMENT_METHOD', 'Recommendation: Low probability INSUFFICIENT_FUNDS requests different payment method');

const authRec = recommendAction('AUTHENTICATION_FAILURE', 60, 0);
assert(authRec.action === 'SEND_PAYMENT_REMINDER', 'Recommendation: AUTHENTICATION_FAILURE recommends SEND_PAYMENT_REMINDER');

const expiredRec = recommendAction('EXPIRED_CARD', 25, 0);
assert(expiredRec.action === 'REQUEST_DIFFERENT_PAYMENT_METHOD', 'Recommendation: EXPIRED_CARD recommends REQUEST_DIFFERENT_PAYMENT_METHOD');

const exhaustedRec = recommendAction('INSUFFICIENT_FUNDS', 80, 3);
assert(exhaustedRec.action === 'MARK_UNRECOVERABLE', 'Recommendation: Retry count >= 3 enforces MARK_UNRECOVERABLE');

console.log('\n====================================================');
console.log(`🎉 Unit Test Summary: ${passed} Passed, ${failed} Failed`);
console.log('====================================================');

process.exit(failed > 0 ? 1 : 0);
