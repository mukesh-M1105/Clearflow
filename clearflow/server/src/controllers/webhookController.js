const db = require('../database/db');
const recoveryService = require('../services/recoveryService');

/**
 * Webhook Controller
 * Handles external payment gateway webhooks (e.g., Razorpay, Stripe, PayU)
 * and interactive simulation of incoming declined transaction events.
 */
async function simulateIncomingWebhook(req, res, next) {
  try {
    const {
      merchantId = 'mer_nova',
      customerId = 'cust_demo_vikram',
      amount = 45000.00,
      currency = 'INR',
      paymentMethod = 'Credit Card (Visa)',
      failureReason = 'NETWORK_ERROR'
    } = req.body;

    const paymentId = `pay_wh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    // 1. Insert declined transaction into payments
    await db.query(
      `INSERT INTO payments (id, merchant_id, customer_id, amount, currency, payment_method, status, failure_reason, recovery_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'FAILED', $7, 'PENDING', $8, $8)`,
      [paymentId, merchantId, customerId, parseFloat(amount), currency, paymentMethod, failureReason, now]
    );

    // 2. Log initial failure event
    const eventId = `evt_wh_${Date.now()}`;
    await db.query(
      `INSERT INTO recovery_events (id, payment_id, recovery_attempt_id, event_type, description, created_at)
       VALUES ($1, $2, NULL, 'FAILURE_DETECTED', $3, $4)`,
      [eventId, paymentId, `External gateway webhook received: Transaction declined with code '${failureReason}'.`, now]
    );

    // 3. Trigger automated AI diagnostic analysis
    const analysisResult = await recoveryService.analyzePayment(paymentId);

    res.status(201).json({
      success: true,
      message: 'Gateway webhook ingested and AI recovery analysis executed successfully.',
      data: {
        paymentId,
        amount: parseFloat(amount),
        failureReason,
        analysis: analysisResult.analysis,
        recommendation: analysisResult.recommendation
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  simulateIncomingWebhook
};
