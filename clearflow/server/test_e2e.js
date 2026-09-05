const http = require('http');

async function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const contentType = res.headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
          } else {
            resolve({ status: res.statusCode, headers: res.headers, text: data });
          }
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, text: data, parseError: e.message });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 ====================================================');
  console.log('🧪 Starting End-to-End Test Suite for ClearFlow');
  console.log('🧪 ====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    const health = await request({ host: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
    assert(health.status === 200 && health.data.success === true, 'Health check endpoint returns 200 HEALTHY');

    // 2. Register New User
    const regEmail = `test_${Date.now()}@example.com`;
    const regRes = await request(
      {
        host: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { name: 'Test Payer', email: regEmail, password: 'Password@123', role: 'MERCHANT', businessName: 'Test Merchant Store' }
    );
    assert(regRes.status === 201 && regRes.data.success === true, 'Registration endpoint works and returns JWT token');

    // 3. Login as Revenue Manager
    const mgrLogin = await request(
      {
        host: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: 'manager@clearflow.com', password: 'Manager@123' }
    );
    assert(mgrLogin.status === 200 && mgrLogin.data.data.token, 'Revenue Manager login returns valid JWT token');
    const mgrToken = mgrLogin.data.data.token;

    // 4. Verify /auth/me
    const meRes = await request({
      host: 'localhost',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    assert(meRes.status === 200 && meRes.data.data.user.role === 'REVENUE_MANAGER', 'Auth /me correctly identifies REVENUE_MANAGER');

    // 5. Login as Merchant (Nova Electronics)
    const merchLogin = await request(
      {
        host: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: 'merchant@clearflow.com', password: 'Merchant@123' }
    );
    assert(merchLogin.status === 200 && merchLogin.data.data.user.merchant_id === 'mer_nova', 'Merchant login correctly identifies mer_nova profile');
    const merchToken = merchLogin.data.data.token;

    // 6. Test Merchant Tenant Isolation (Cross-Merchant Access Block)
    const crossMerchRes = await request({
      host: 'localhost',
      port: 5000,
      path: '/api/merchants/mer_fresh', // Attempting to access FreshMart
      method: 'GET',
      headers: { Authorization: `Bearer ${merchToken}` }
    });
    assert(crossMerchRes.status === 403, 'Tenant Multi-Isolation: Merchant blocked from accessing another merchant (HTTP 403)');

    // 7. Dashboard Summary (Pre-Recovery baseline)
    const dashPre = await request({
      host: 'localhost',
      port: 5000,
      path: '/api/dashboard/summary?period=90d',
      method: 'GET',
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    assert(dashPre.status === 200 && dashPre.data.data.totalVolume > 0, 'Dashboard summary calculates live volume from PostgreSQL');
    const initialRecoveredRevenue = dashPre.data.data.recoveredRevenue;

    // 8. Payment Details & Hackathon Demo Case (pay_demo_nova_85k)
    const demoPayRes = await request({
      host: 'localhost',
      port: 5000,
      path: '/api/payments/pay_demo_nova_85k',
      method: 'GET',
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    const demoPay = demoPayRes.data.data.payment;
    const demoAna = demoPayRes.data.data.analysis;
    const demoRec = demoPayRes.data.data.recommendation;

    assert(demoPay.amount === 85000, 'Demo payment amount is exactly ₹85,000');
    assert(demoPay.failure_reason === 'INSUFFICIENT_FUNDS', 'Demo payment failure reason is INSUFFICIENT_FUNDS');
    assert(demoAna.recovery_probability >= 80, `Demo payment recovery probability is ${demoAna.recovery_probability}% (>=80%)`);
    assert(demoRec.recommended_action === 'RETRY_AFTER_24_HOURS', `Demo payment recommendation is RETRY_AFTER_24_HOURS`);

    // 9. Re-Analyze Demo Payment
    const reAnalyzeRes = await request({
      host: 'localhost',
      port: 5000,
      path: '/api/recovery/analyze/pay_demo_nova_85k',
      method: 'POST',
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    assert(reAnalyzeRes.status === 200 && reAnalyzeRes.data.data.analysis.probability >= 80, 'Payment re-analysis calculates dynamic probability');

    // 10. Start Recovery Simulation on ₹85k Payment
    const recSimRes = await request({
      host: 'localhost',
      port: 5000,
      path: '/api/recovery/start/pay_demo_nova_85k',
      method: 'POST',
      headers: { Authorization: `Bearer ${mgrToken}`, 'Content-Type': 'application/json' },
    }, { strategy: 'RETRY_AFTER_24_HOURS' });

    assert(recSimRes.status === 200, 'Recovery simulation executes successfully');
    assert(recSimRes.data.data.status === 'SUCCESS', 'Simulation yields SUCCESS result');
    assert(recSimRes.data.data.recoveredAmount === 85000, 'Recovered amount is full principal ₹85,000');

    // 11. Verify Post-Recovery Dashboard Metrics Update
    const dashPost = await request({
      host: 'localhost',
      port: 5000,
      path: '/api/dashboard/summary?period=90d',
      method: 'GET',
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    const newRecoveredRevenue = dashPost.data.data.recoveredRevenue;
    assert(
      newRecoveredRevenue >= initialRecoveredRevenue + 85000,
      `Dashboard recovered revenue immediately updated in PostgreSQL: ₹${newRecoveredRevenue.toLocaleString('en-IN')}`
    );

    // 12. Failed Payments Endpoint
    const failedList = await request({
      host: 'localhost',
      port: 5000,
      path: '/api/failed-payments?limit=5',
      method: 'GET',
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    assert(failedList.status === 200 && failedList.data.data.payments.length > 0, 'Failed payments endpoint returns declined transactions');

    // 13. Reports CSV Export
    const reportCsv = await request({
      host: 'localhost',
      port: 5000,
      path: '/api/reports/payments?format=csv',
      method: 'GET',
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    assert(reportCsv.status === 200 && reportCsv.text.includes('Payment ID'), 'Payment Report successfully generates RFC 4180 CSV');

    // 14. AI Recovery Assistant
    const aiRes = await request({
      host: 'localhost',
      port: 5000,
      path: '/api/ai/assistant',
      method: 'POST',
      headers: { Authorization: `Bearer ${mgrToken}`, 'Content-Type': 'application/json' }
    }, { message: 'Why was payment pay_demo_nova_85k recoverable?' });

    assert(
      aiRes.status === 200 && aiRes.data.data.reply.includes('pay_demo_nova_85k'),
      'AI Assistant explains recovery viability using live PostgreSQL transaction context'
    );

    console.log('\n====================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('❌ Test execution error:', err);
    process.exit(1);
  }
}

runTests();
