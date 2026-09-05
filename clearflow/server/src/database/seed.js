const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  console.log('🚀 Starting ClearFlow database schema migration and seeding...');

  // 1. Run Schema DDL
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await db.executeScript(schemaSql);
  console.log('✅ Schema tables, constraints, and indexes applied successfully.');

  // 2. Prepare Users
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('Admin@123', salt);
  const managerHash = bcrypt.hashSync('Manager@123', salt);
  const merchantHash = bcrypt.hashSync('Merchant@123', salt);

  const users = [
    { id: 'usr_admin_1', name: 'System Administrator', email: 'admin@clearflow.com', password_hash: adminHash, role: 'ADMIN' },
    { id: 'usr_mgr_1', name: 'Priya Menon (Head of Revenue)', email: 'manager@clearflow.com', password_hash: managerHash, role: 'REVENUE_MANAGER' },
    { id: 'usr_mgr_2', name: 'Neha Gupta (Recovery Operations)', email: 'neha.ops@clearflow.com', password_hash: managerHash, role: 'REVENUE_MANAGER' },
    { id: 'usr_mer_1', name: 'Nova Electronics Admin', email: 'merchant@clearflow.com', password_hash: merchantHash, role: 'MERCHANT' },
    { id: 'usr_mer_2', name: 'FreshMart Operations', email: 'freshmart@clearflow.com', password_hash: merchantHash, role: 'MERCHANT' },
    { id: 'usr_mer_3', name: 'TechWorld Merchant', email: 'techworld@clearflow.com', password_hash: merchantHash, role: 'MERCHANT' }
  ];

  for (const u of users) {
    await db.query(
      `INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)`,
      [u.id, u.name, u.email, u.password_hash, u.role]
    );
  }
  console.log(`✅ Seeded ${users.length} authenticated users.`);

  // 3. Merchants
  const merchants = [
    { id: 'mer_nova', user_id: 'usr_mer_1', business_name: 'Nova Electronics', business_type: 'Consumer Electronics & Appliances' },
    { id: 'mer_fresh', user_id: 'usr_mer_2', business_name: 'FreshMart', business_type: 'Online Grocery & Daily Essentials' },
    { id: 'mer_tech', user_id: 'usr_mer_3', business_name: 'TechWorld', business_type: 'B2B IT & Cloud Hardware' },
    { id: 'mer_urban', user_id: null, business_name: 'Urban Fashion', business_type: 'Apparel & Lifestyle Retail' },
    { id: 'mer_quick', user_id: null, business_name: 'Quick Services', business_type: 'On-Demand Home & Vehicle Services' }
  ];

  for (const m of merchants) {
    await db.query(
      `INSERT INTO merchants (id, user_id, business_name, business_type) VALUES ($1, $2, $3, $4)`,
      [m.id, m.user_id, m.business_name, m.business_type]
    );
  }
  console.log(`✅ Seeded ${merchants.length} merchant profiles.`);

  // 4. Customers (35 realistic customers)
  const customers = [
    { id: 'cust_demo_vikram', name: 'Vikramaditya Singhania', email: 'vikram.singhania@enterprise.in' },
    { id: 'cust_2', name: 'Priya Sundaram', email: 'priya.sundaram@gmail.com' },
    { id: 'cust_3', name: 'Rahul Verma', email: 'rahul.verma@techmail.com' },
    { id: 'cust_4', name: 'Ananya Deshmukh', email: 'ananya.d@outlook.com' },
    { id: 'cust_5', name: 'Rohan Mehta', email: 'rohan.mehta@fintech.co' },
    { id: 'cust_6', name: 'Sneha Patel', email: 'sneha.patel@yahoo.com' },
    { id: 'cust_7', name: 'Amitabh Sen', email: 'amitabh.sen@corporate.in' },
    { id: 'cust_8', name: 'Kavita Reddy', email: 'kavita.reddy@gmail.com' },
    { id: 'cust_9', name: 'Devendra Joshi', email: 'dev.joshi@infra.com' },
    { id: 'cust_10', name: 'Sunita Rao', email: 'sunita.rao@consulting.com' },
    { id: 'cust_11', name: 'Rajesh Nair', email: 'rajesh.nair@cochinlogistics.in' },
    { id: 'cust_12', name: 'Pooja Bhatia', email: 'pooja.bhatia@delhidesign.com' },
    { id: 'cust_13', name: 'Siddharth Roy', email: 'sid.roy@kolkataventures.in' },
    { id: 'cust_14', name: 'Divya Iyer', email: 'divya.iyer@chennaitech.com' },
    { id: 'cust_15', name: 'Arjun Kapoor', email: 'arjun.kapoor@mumbaifilms.in' },
    { id: 'cust_16', name: 'Meera Chawla', email: 'meera.chawla@punjabfoods.com' },
    { id: 'cust_17', name: 'Karthik Raman', email: 'karthik.raman@bangaloreai.io' },
    { id: 'cust_18', name: 'Tanvi Saxena', email: 'tanvi.saxena@gurgaonlaw.com' },
    { id: 'cust_19', name: 'Nikhil Kulkarni', email: 'nikhil.k@punesoftware.com' },
    { id: 'cust_20', name: 'Shreya Mukherjee', email: 'shreya.m@kolkatamedia.in' },
    { id: 'cust_21', name: 'Deepak Agrawal', email: 'deepak.agrawal@indoretextiles.in' },
    { id: 'cust_22', name: 'Ayesha Khan', email: 'ayesha.khan@hyderabadbiotech.com' },
    { id: 'cust_23', name: 'Manish Tiwari', email: 'manish.tiwari@lucknowstores.in' },
    { id: 'cust_24', name: 'Geeta Menon', email: 'geeta.menon@keralaspices.com' },
    { id: 'cust_25', name: 'Harsh Vardhan', email: 'harsh.v@jaipurjewels.in' },
    { id: 'cust_26', name: 'Ritu Agarwal', email: 'ritu.agarwal@suratdiamonds.com' },
    { id: 'cust_27', name: 'Sanjay Hegde', email: 'sanjay.hegde@mangaloreports.in' },
    { id: 'cust_28', name: 'Bhavna Chauhan', email: 'bhavna.chauhan@ahmedabadedutech.com' },
    { id: 'cust_29', name: 'Gaurav Pandey', email: 'gaurav.pandey@noidasolutions.com' },
    { id: 'cust_30', name: 'Alka Goswami', email: 'alka.goswami@assamtea.in' },
    { id: 'cust_31', name: 'Varun Chopra', email: 'varun.chopra@chandigarhsports.in' },
    { id: 'cust_32', name: 'Monika Das', email: 'monika.das@bhubaneswarmarketing.com' },
    { id: 'cust_33', name: 'Abhishek Mishra', email: 'abhishek.mishra@patnaretail.in' },
    { id: 'cust_34', name: 'Trisha Bannerjee', email: 'trisha.b@siliguriauto.com' },
    { id: 'cust_35', name: 'Kishore Kumar', email: 'kishore.k@vizagshipping.in' }
  ];

  for (const c of customers) {
    await db.query(
      `INSERT INTO customers (id, name, email) VALUES ($1, $2, $3)`,
      [c.id, c.name, c.email]
    );
  }
  console.log(`✅ Seeded ${customers.length} customer records.`);

  // 5. Seed Payments & Demo Scenario
  // Amounts
  const amounts = [499, 1250, 2499, 5999, 12500, 25000, 50000];
  const paymentMethods = ['UPI', 'Credit Card (Visa)', 'Credit Card (Mastercard)', 'Net Banking (HDFC)', 'Net Banking (ICICI)', 'Debit Card (SBI)'];
  const failureReasons = [
    'INSUFFICIENT_FUNDS',
    'BANK_DECLINED',
    'NETWORK_ERROR',
    'AUTHENTICATION_FAILURE',
    'EXPIRED_CARD',
    'TIMEOUT'
  ];

  const merchantIds = merchants.map(m => m.id);
  const now = new Date();

  // First: Insert Vikramaditya Singhania's 4 past successful high-value transactions at Nova Electronics
  const pastSuccesses = [
    { id: 'pay_vikram_success_1', amount: 50000, daysAgo: 45 },
    { id: 'pay_vikram_success_2', amount: 25000, daysAgo: 30 },
    { id: 'pay_vikram_success_3', amount: 50000, daysAgo: 15 },
    { id: 'pay_vikram_success_4', amount: 25000, daysAgo: 5 }
  ];

  for (const ps of pastSuccesses) {
    const pDate = new Date(now.getTime() - ps.daysAgo * 86400000);
    await db.query(
      `INSERT INTO payments (id, merchant_id, customer_id, amount, currency, payment_method, status, failure_reason, recovery_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'INR', 'Credit Card (Visa)', 'SUCCESS', NULL, 'NOT_REQUIRED', $5, $5)`,
      [ps.id, 'mer_nova', 'cust_demo_vikram', ps.amount, pDate]
    );
  }

  // KEY DEMO SCENARIO: ₹85,000 Failed payment at Nova Electronics with 82% recovery probability
  const demoPaymentId = 'pay_demo_nova_85k';
  const demoDate = new Date(now.getTime() - 2 * 3600000); // 2 hours ago

  await db.query(
    `INSERT INTO payments (id, merchant_id, customer_id, amount, currency, payment_method, status, failure_reason, recovery_status, created_at, updated_at)
     VALUES ($1, 'mer_nova', 'cust_demo_vikram', 85000.00, 'INR', 'Credit Card (Visa)', 'FAILED', 'INSUFFICIENT_FUNDS', 'PENDING', $2, $2)`,
    [demoPaymentId, demoDate]
  );

  // Recovery Analysis for demo payment
  await db.query(
    `INSERT INTO recovery_analyses (id, payment_id, recovery_probability, probability_level, recoverable_amount, explanation, created_at)
     VALUES ($1, $2, 82, 'HIGH', 85000.00, $3, $4)`,
    [
      'rec_ana_demo_85k',
      demoPaymentId,
      "Customer has high lifetime payment success rate (100% on 4 prior high-value transactions totaling ₹1,50,000). Temporary liquidity shortfall or daily card limit reached. 82% likelihood of successful settlement on scheduled retry.",
      demoDate
    ]
  );

  // Recovery Recommendation for demo payment
  await db.query(
    `INSERT INTO recovery_recommendations (id, payment_id, recommended_action, recommended_delay, expected_recovery, reason, created_at)
     VALUES ($1, $2, 'RETRY_AFTER_24_HOURS', '24 hours', 69700.00, $3, $4)`,
    [
      'rec_rec_demo_85k',
      demoPaymentId,
      "Account liquidity cycles and card limits reset within 24 hours. Historical settlement data shows 84% conversion on morning debit reattempts.",
      demoDate
    ]
  );

  // Initial event for demo payment
  await db.query(
    `INSERT INTO recovery_events (id, payment_id, recovery_attempt_id, event_type, description, created_at)
     VALUES ($1, $2, NULL, 'FAILURE_DETECTED', 'Transaction declined by issuer due to insufficient available limit/balance.', $3)`,
    ['evt_demo_1', demoPaymentId, demoDate]
  );
  await db.query(
    `INSERT INTO recovery_events (id, payment_id, recovery_attempt_id, event_type, description, created_at)
     VALUES ($1, $2, NULL, 'AI_ANALYSIS_COMPLETED', 'ClearFlow scoring engine calculated 82% recovery probability (HIGH). Recommendation: RETRY_AFTER_24_HOURS.', $3)`,
    ['evt_demo_2', demoPaymentId, new Date(demoDate.getTime() + 60000)]
  );

  // Generate 160 more payments across 90 days to satisfy requirements
  let paymentCounter = 1;
  let attemptCounter = 1;
  let eventCounter = 3;

  for (let i = 1; i <= 160; i++) {
    paymentCounter++;
    const pId = `pay_${String(paymentCounter).padStart(4, '0')}`;
    const mId = merchantIds[i % merchantIds.length];
    const cId = customers[i % customers.length].id;
    const amount = amounts[i % amounts.length];
    const method = paymentMethods[i % paymentMethods.length];

    // Spread dates across 90 days
    const daysAgo = (i % 88) + (i % 3) * 0.2;
    const pDate = new Date(now.getTime() - daysAgo * 86400000);

    // Distribution: 65% SUCCESS, 25% FAILED, 5% PENDING, 5% REFUNDED
    let status = 'SUCCESS';
    let failureReason = null;
    let recoveryStatus = 'NOT_REQUIRED';

    const mod = i % 20;
    if (mod < 13) {
      status = 'SUCCESS';
      recoveryStatus = 'NOT_REQUIRED';
    } else if (mod < 18) {
      status = 'FAILED';
      failureReason = failureReasons[i % failureReasons.length];

      // Failed payments recovery status distribution:
      // Some are RECOVERED, some IN_PROGRESS, some PENDING, some UNRECOVERABLE
      const failMod = i % 4;
      if (failMod === 0) recoveryStatus = 'RECOVERED';
      else if (failMod === 1) recoveryStatus = 'IN_PROGRESS';
      else if (failMod === 2) recoveryStatus = 'PENDING';
      else recoveryStatus = 'UNRECOVERABLE';
    } else if (mod === 18) {
      status = 'PENDING';
      recoveryStatus = 'NOT_REQUIRED';
    } else {
      status = 'REFUNDED';
      recoveryStatus = 'NOT_REQUIRED';
    }

    await db.query(
      `INSERT INTO payments (id, merchant_id, customer_id, amount, currency, payment_method, status, failure_reason, recovery_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'INR', $5, $6, $7, $8, $9, $9)`,
      [pId, mId, cId, amount, method, status, failureReason, recoveryStatus, pDate]
    );

    // If FAILED, create recovery analyses, recommendations, attempts, events
    if (status === 'FAILED') {
      let probability = 75;
      let level = 'HIGH';
      let action = 'RETRY_AFTER_24_HOURS';
      let delay = '24 hours';
      let explanation = 'Routine payment error with standard recovery pattern.';

      if (failureReason === 'NETWORK_ERROR' || failureReason === 'TIMEOUT') {
        probability = 91;
        level = 'VERY HIGH';
        action = 'RETRY_IMMEDIATELY';
        delay = 'Immediate';
        explanation = 'Transient gateway or network timeout. High confidence in instant retry recovery.';
      } else if (failureReason === 'INSUFFICIENT_FUNDS') {
        probability = 78;
        level = 'HIGH';
        action = 'RETRY_AFTER_24_HOURS';
        delay = '24 hours';
        explanation = 'Issuer balance shortfall; typical salary/settlement cycle resolves within 24 hours.';
      } else if (failureReason === 'AUTHENTICATION_FAILURE') {
        probability = 62;
        level = 'MEDIUM';
        action = 'SEND_PAYMENT_REMINDER';
        delay = '1 hour';
        explanation = 'Customer missed OTP or biometric challenge. Prompting via WhatsApp/SMS reminder recommended.';
      } else if (failureReason === 'BANK_DECLINED') {
        probability = 48;
        level = 'LOW';
        action = 'RETRY_AFTER_1_HOUR';
        delay = '1 hour';
        explanation = 'Issuing bank security rule trigger. Single follow-up retry recommended before escalation.';
      } else if (failureReason === 'EXPIRED_CARD') {
        probability = 25;
        level = 'VERY LOW';
        action = 'REQUEST_DIFFERENT_PAYMENT_METHOD';
        delay = 'Instant link';
        explanation = 'Card expired on merchant file. Automatic mandate update link dispatched.';
      }

      const expectedRec = Number(((amount * probability) / 100).toFixed(2));

      await db.query(
        `INSERT INTO recovery_analyses (id, payment_id, recovery_probability, probability_level, recoverable_amount, explanation, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [`rec_ana_${pId}`, pId, probability, level, amount, explanation, pDate]
      );

      await db.query(
        `INSERT INTO recovery_recommendations (id, payment_id, recommended_action, recommended_delay, expected_recovery, reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [`rec_rec_${pId}`, pId, action, delay, expectedRec, `Calculated using ${level} recovery engine confidence matrix.`, pDate]
      );

      // Create attempts for RECOVERED and IN_PROGRESS
      if (recoveryStatus === 'RECOVERED') {
        attemptCounter++;
        const attId = `att_${String(attemptCounter).padStart(4, '0')}`;
        const attDate = new Date(pDate.getTime() + 1800000); // 30 mins after failure
        await db.query(
          `INSERT INTO recovery_attempts (id, payment_id, merchant_id, attempt_number, strategy, status, result, recovered_amount, attempted_at, created_at)
           VALUES ($1, $2, $3, 1, $4, 'SUCCESS', 'PAYMENT_CAPTURED', $5, $6, $6)`,
          [attId, pId, mId, action, amount, attDate]
        );

        eventCounter++;
        await db.query(
          `INSERT INTO recovery_events (id, payment_id, recovery_attempt_id, event_type, description, created_at)
           VALUES ($1, $2, $3, 'RECOVERY_SUCCESS', 'Automated retry captured payment successfully.', $4)`,
          [`evt_${eventCounter}`, pId, attId, attDate]
        );
      } else if (recoveryStatus === 'IN_PROGRESS') {
        attemptCounter++;
        const attId = `att_${String(attemptCounter).padStart(4, '0')}`;
        const attDate = new Date(pDate.getTime() + 600000);
        await db.query(
          `INSERT INTO recovery_attempts (id, payment_id, merchant_id, attempt_number, strategy, status, result, recovered_amount, attempted_at, created_at)
           VALUES ($1, $2, $3, 1, $4, 'IN_PROGRESS', 'WAITING_ISSUER_CALLBACK', 0, $5, $5)`,
          [attId, pId, mId, action, attDate]
        );
      } else if (recoveryStatus === 'UNRECOVERABLE') {
        attemptCounter++;
        const attId = `att_${String(attemptCounter).padStart(4, '0')}`;
        const attDate = new Date(pDate.getTime() + 3600000);
        await db.query(
          `INSERT INTO recovery_attempts (id, payment_id, merchant_id, attempt_number, strategy, status, result, recovered_amount, attempted_at, created_at)
           VALUES ($1, $2, $3, 1, $4, 'FAILED', 'PERMANENT_DECLINE', 0, $5, $5)`,
          [attId, pId, mId, action, attDate]
        );
      }
    }
  }

  console.log(`✅ Seeded ${paymentCounter} total payments, including demo scenario ₹85k failed transaction.`);
  console.log('🎉 Seeding completed successfully!');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
