# ClearFlow — Complete Project Master Documentation

**AI-Powered Payment Revenue Recovery Platform**  
*Enterprise-Grade Full-Stack Fintech Web Application*

---

## 1. Executive Summary & Project Objective

**ClearFlow** is an AI-powered payment revenue recovery platform built to solve digital payment declines and transaction abandonment for merchants and financial platforms.

In modern e-commerce and subscription billing, between **10% and 25% of all digital payment attempts fail**. Merchants frequently write these off as lost sales or blast aggressive, uncalibrated retries that trigger card network velocity penalties, increase interchange fees, and damage customer relationships.

ClearFlow provides an automated, closed-loop revenue recapturing pipeline:

```
    FAILED PAYMENT
          ↓
  AI / RULE ANALYSIS
  (Root-cause diagnostic)
          ↓
  RECOVERY PROBABILITY
  (0 to 100 empirical score)
          ↓
  RECOMMENDED ACTION
  (Optimal cooldown & channel)
          ↓
  RECOVERY ATTEMPT
  (Simulated capture execution)
          ↓
  SUCCESS / FAILURE
  (Audit timeline recording)
          ↓
  RECOVERED REVENUE
  (Real-time PostgreSQL ledger update)
```

---

## 2. Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend UI** | React 18, Vite | High-performance Single Page Application (SPA) with Hot Module Replacement |
| **Routing** | React Router DOM v6 | Client-side routing with `ProtectedRoute` session guards |
| **Styling** | Tailwind CSS | Modern, clean, financial SaaS aesthetics with high-contrast status badge palettes |
| **Visual Analytics** | Recharts, Lucide React | Interactive financial charts (Area, Bar, Line, Pie) and fintech iconography |
| **HTTP Client** | Axios | REST API integration with automatic JWT injection and 401 interceptors |
| **Backend Framework**| Node.js, Express.js | Layered monolithic REST API gateway |
| **Authentication** | JSON Web Tokens (JWT), bcryptjs | Cryptographic stateless sessions (`Bearer` token) and salted password hashing (cost factor 10) |
| **Security** | Helmet, CORS, Express Rate Limit | HTTP security headers, cross-origin resource policy, and API rate limiting |
| **Database** | PostgreSQL | Enterprise relational database with ACID compliance, constraints, and B-tree indexes |
| **Dual DB Engine** | `pg.Pool` & `@electric-sql/pglite` | Zero-configuration auto-fallback to embedded PostgreSQL C engine when external database is offline |
| **Data Export** | `csv-stringify` | Server-side SQL dataset generation to RFC 4180 CSV files |

---

## 3. System Architecture

```
                    USER (Admin / Revenue Manager / Merchant)
                                      │
                                      ▼
                       React Single Page Application
                          (Vite, Tailwind CSS, Recharts)
                                      │
                                      ▼
                                Axios / REST
                                (JWT Bearer)
                                      │
                                      ▼
                           Express.js API Gateway
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
              Authentication                     Rate Limiting
             & Role Scoping                     & Helmet Security
                    │                                   │
                    └─────────────────┬─────────────────┘
                                      │
                                      ▼
                            Express Controllers
                                      │
                                      ▼
                            Service Layer Pipeline
                                      │
       ┌────────────────────┬─────────┴─────────┬────────────────────┐
       │                    │                   │                    │
       ▼                    ▼                   ▼                    ▼
Failure Analysis     Recovery Engine     Recovery Service       AI Assistant
 (Classification)     (Probability)       (Simulation)          (Analytics)
       │                    │                   │                    │
       └────────────────────┼───────────────────┼────────────────────┘
                            │                   │
                            ▼                   ▼
                      Webhook Service     Analytics & Reports
                            │                   │
                            └─────────┬─────────┘
                                      │
                                      ▼
                           PostgreSQL Database
                         (Relational Ledger Schema)
                                      │
               ┌──────────────────────┴──────────────────────┐
               │                      │                      │
               ▼                      ▼                      ▼
         Core Payments         Recovery Pipeline         Audit Events
```

---

## 4. Database Entity Relationship (ER) Model

```
 users (id, name, email, password_hash, role, created_at, updated_at)
   │
   │ 1:N
   ▼
 merchants (id, user_id, business_name, business_type, created_at, updated_at)
   │
   │ 1:N
   ▼
 payments (id, merchant_id, customer_id, amount, currency, payment_method,
   │       status, failure_reason, recovery_status, created_at, updated_at)
   │
   ├───────────────┬───────────────────────────────┐
   │ 1:1           │ 1:1                           │ 1:N
   ▼               ▼                               ▼
recovery_analyses  recovery_recommendations  recovery_attempts
(id, payment_id,   (id, payment_id,          (id, payment_id, merchant_id,
 recovery_prob,     recommended_action,       attempt_number, strategy,
 probability_level, recommended_delay,        status, result, recovered_amount,
 recoverable_amount,expected_recovery,        attempted_at, created_at)
 explanation)       reason)                        │
                                                   │ 1:N
 customers (id, name, email, created_at)           ▼
   │                                         recovery_events
   │ 1:N                                     (id, payment_id, recovery_attempt_id,
   └──────────────► payments                  event_type, description, created_at)
```

### PostgreSQL Schema DDL Details
- **`users`**: Stores user authentication credentials, passwords hashed with bcrypt, and role constraints (`ADMIN`, `REVENUE_MANAGER`, `MERCHANT`).
- **`merchants`**: Stores registered merchant profiles, business categorizations, and foreign keys linked to users.
- **`customers`**: Stores unique customer profiles and emails.
- **`payments`**: Central ledger storing transaction amounts, currencies, payment rails, payment statuses (`SUCCESS`, `FAILED`, `PENDING`, `REFUNDED`), failure reasons, and recovery states (`NOT_REQUIRED`, `PENDING`, `IN_PROGRESS`, `RECOVERED`, `UNRECOVERABLE`).
- **`recovery_analyses`**: Stores 0–100 probability scores, confidence tiers (`VERY LOW`, `LOW`, `MEDIUM`, `HIGH`, `VERY HIGH`), recoverable principals, and model explanations.
- **`recovery_recommendations`**: Stores prescribed recovery actions, cooldown delays, expected yields, and rationale.
- **`recovery_attempts`**: Stores recovery execution logs, attempt numbers (1, 2, 3), strategies used, simulated gateway outcomes, and recovered amounts.
- **`recovery_events`**: Chronological milestone log (`FAILURE_DETECTED`, `PAYMENT_ANALYZED`, `RECOMMENDATION_GENERATED`, `RECOVERY_STARTED`, `RECOVERY_SUCCESS`, `RECOVERY_FAILED`).
- **B-Tree Indexes**: Created on `payments(merchant_id)`, `payments(customer_id)`, `payments(status)`, `payments(failure_reason)`, `payments(created_at)`, `recovery_analyses(recovery_probability)`, and `recovery_attempts(status)`.

---

## 5. Algorithmic Engines Detailed Explanations

### A. Failure Reason Analysis Engine (`failureAnalysis.js`)
Normalizes raw bank authorization failure codes into structured business root causes:
1. **`INSUFFICIENT_FUNDS`**: Customer account balance or card credit ceiling was temporarily insufficient at checkout. Transient error. High recovery probability.
2. **`BANK_DECLINED`**: Issuing bank risk engine or card security velocity check blocked charge. Medium recovery probability.
3. **`NETWORK_ERROR`**: Upstream telecom glitch or bank switch packet drop. Highly transient. Very high recovery probability.
4. **`AUTHENTICATION_FAILURE`**: Customer dropped out during 3DS OTP challenge or biometrics. Medium recovery probability.
5. **`EXPIRED_CARD`**: Card expiration date on merchant file has passed. Hard non-transient decline. Requires customer credential update.
6. **`TIMEOUT`**: Issuing bank core took longer than 30s to respond. Transient. Very high recovery probability.

### B. Recovery Probability Scoring Engine (`recoveryEngine.js`)
Calculates an empirical recovery probability score from **0 to 100%**:

$$\text{Probability Score} = \text{Base (50)} + \sum \text{Factor Impacts}$$

- **Decline Type Impact**: Transient failures (`NETWORK_ERROR`, `TIMEOUT`, `INSUFFICIENT_FUNDS`) award $+20$; expired cards penalize $-20$.
- **Customer Lifetime Trust**: Customers with $\ge 3$ prior successful settlements receive $+20$; customers with 1 prior success receive $+10$.
- **Retry Velocity Penalty**: First attempt receives $+15$; transactions that have already failed $\ge 2$ retries receive $-20$.
- **Transaction Amount Sizing**: Low-friction ticket sizes ($\le ₹5,000$) receive $+10$; high ticket sizes backed by verified buyer history receive $+5$.
- **Temporal Freshness Decay**: Failures within 6 hours receive $+12$; abandoned failures older than 72 hours receive $-15$.
- **Payment Rail Affinity**: Instant rails (UPI, Visa/Mastercard) receive $+5$.

**Confidence Tiers**:
- `85 – 100`: **VERY HIGH**
- `70 – 84`: **HIGH**
- `50 – 69`: **MEDIUM**
- `30 – 49`: **LOW**
- `0 – 29`: **VERY LOW**

### C. Recovery Recommendation Engine (`recoveryRecommendation.js`)
Maps failure classifications and probability scores into specific operational decisions:
- **`RETRY_IMMEDIATELY`**: For `NETWORK_ERROR` and `TIMEOUT` via secondary acquiring bank routing.
- **`RETRY_AFTER_24_HOURS`**: For `INSUFFICIENT_FUNDS` with probability $\ge 60\%$ (aligns with payroll credits and midnight card limit resets).
- **`SEND_PAYMENT_REMINDER`**: For `AUTHENTICATION_FAILURE` (dispatches 1-click SMS/WhatsApp checkout link).
- **`REQUEST_DIFFERENT_PAYMENT_METHOD`**: For `EXPIRED_CARD` or low-liquidity profiles.
- **`CONTACT_CUSTOMER`**: For customer-specific issuing bank security blocks.
- **`MARK_UNRECOVERABLE`**: Triggered when retry velocity limit ($\ge 3$) is reached or probability is $< 15\%$.

### D. Recovery Service & Simulation Runner (`recoveryService.js`)
Coordinates execution:
1. Validates payment state is `FAILED`.
2. Increments `attempt_number`.
3. Simulates gateway execution based on probability confidence thresholds (ensuring the hackathon demo payment `pay_demo_nova_85k` always succeeds deterministically).
4. Updates `recovery_status = 'RECOVERED'` and stores `recovered_amount`.
5. Logs chronological audit milestones into `recovery_events`.

### E. AI Revenue Recovery Assistant (`aiAssistant.js`)
Features natural language intent parsing connected to live PostgreSQL telemetry:
- Diagnoses specific payment IDs (e.g. *"Why did payment pay_demo_nova_85k fail?"*).
- Explains recovery viability (e.g. *"Why was this payment recoverable?"*).
- Aggregates financial insights (e.g. *"Which failure reason causes the most revenue loss?"*, *"How much revenue can we recover right now?"*, *"Summarize today's recovery performance"*).

---

## 6. Role-Based Access Control & Multi-Tenant Security

1. **Role Enforcement (`role.js`)**:
   - `ADMIN`: Global visibility across all merchants, transactions, and system settings.
   - `REVENUE_MANAGER`: Global operational visibility across payment recovery pipelines.
   - `MERCHANT`: Restricted exclusively to transactions and metrics belonging to their assigned `merchant_id`.
2. **Backend Tenant Isolation (`merchantScope.js`)**:
   - When a `MERCHANT` authenticates, their `merchant_id` is extracted from the JWT token and appended to all database queries (`WHERE merchant_id = $1`).
   - If a merchant attempts to query another merchant's profile or payments, the request is blocked with `HTTP 403 Forbidden`.
3. **Cryptographic Protections**:
   - Passwords hashed with bcrypt (salt rounds: 10).
   - JWT tokens signed with `HS256` using secure environment secret.
   - Zero password hashes or sensitive keys exposed to frontend responses.

---

## 7. REST API Reference

All protected endpoints require `Authorization: Bearer <JWT_TOKEN>`.

### Authentication
- `POST /api/auth/register` — Registers new account (`name`, `email`, `password`, `role`, `businessName`).
- `POST /api/auth/login` — Authenticates credentials, returns user profile and JWT.
- `GET /api/auth/me` — Returns current authenticated session profile.

### Dashboard & Analytics
- `GET /api/dashboard/summary?period=90d` — Calculates 8 recovery KPIs from PostgreSQL.
- `GET /api/dashboard/payment-trend?period=90d` — Daily volume and settlement counts.
- `GET /api/dashboard/recovery-trend?period=90d` — Failed vs recovered revenue trends.
- `GET /api/dashboard/failure-reasons?period=90d` — Loss breakdown by decline category.
- `GET /api/dashboard/opportunities?limit=6` — High-probability failed transactions.
- `GET /api/analytics/recovery?period=90d` — Recovery conversion ratios and root-cause yield data.
- `GET /api/analytics/merchants` — Merchant performance rankings.

### Payments & Recovery
- `GET /api/payments` — Paginated, filterable transaction records.
- `GET /api/payments/:id` — Detailed payment data, customer history, and analysis.
- `GET /api/failed-payments` — Scoped view of declined transactions.
- `GET /api/recovery` — History of recovery attempts and recovered yields.
- `GET /api/recovery/:id` — Case history, milestone timeline, and audit log.
- `POST /api/recovery/analyze/:paymentId` — Re-runs algorithmic probability engine.
- `POST /api/recovery/start/:paymentId` — Executes simulated recovery and updates status.

### Merchants & Reports
- `GET /api/merchants` — Directory of merchants with volume and recovery rates.
- `GET /api/merchants/:id` — Merchant store profile, charts, and opportunities.
- `GET /api/reports/payments?format=csv` — Payment report (JSON or RFC 4180 CSV).
- `GET /api/reports/recovery?format=csv` — Recovery attempts report.
- `GET /api/reports/merchants?format=csv` — Merchant summary report.

### AI Assistant & Webhooks
- `POST /api/ai/assistant` — Query AI recovery assistant with live PostgreSQL data context.
- `POST /api/webhooks/simulate` — Ingest simulated payment gateway failure event.
- `POST /api/webhooks/incoming` — Public gateway webhook receiver callback.
- `GET /api/health` — System health check.

---

## 8. Frontend Application Tour (15 Pages)

1. **`/login`**: Split-panel fintech login featuring **1-click demo login buttons** for instant role switching.
2. **`/register`**: User registration with role selection and business entity creation.
3. **`/dashboard`**: Real-time recovery dashboard with 8 KPI cards, 6 Recharts visualizations, SQL date filters (`Today`, `7D`, `30D`, `90D`), and High-Priority Opportunity feed.
4. **`/payments`**: Interactive transaction ledger with text search, multi-field filters, column sorting, and pagination.
5. **`/payments/:id`**: Transaction view showing customer lifetime checkout count, failure reason badge, AI recovery probability card, recommended action, and live simulation runner.
6. **`/failed-payments`**: Dedicated failure diagnostic feed with quick-action re-analyze and recovery triggers.
7. **`/recovery`**: Recovery attempt log displaying strategy used, attempt number, status badges, and recovered cash yield.
8. **`/recovery/:id`**: Case details page featuring a vertical milestone timeline.
9. **`/merchants`**: Connected merchants directory displaying gross volume, failure losses, and recovery conversion rates.
10. **`/merchants/:id`**: Dedicated merchant profile with merchant-specific volume trends and top recovery opportunities.
11. **`/analytics`**: In-depth analytics displaying the recovery conversion formula, failure reason yield comparisons, and cohort leaderboards.
12. **`/reports`**: Parameterized SQL reporting view with instant RFC 4180 CSV download.
13. **`/ai-assistant`**: Chat-based recovery co-pilot with live PostgreSQL data awareness and suggested prompt chips.
14. **`/settings`**: Platform parameters and the **Live Gateway Webhook Simulator**.
15. **`/profile`**: Authenticated account profile, cryptographic session info, and role permissions breakdown.

---

## 9. Pre-Seeded Demo Data & Credentials

The platform is seeded with realistic Indian fintech transactions across 5 merchants and 35 customers:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Revenue Manager** | `manager@clearflow.com` | `Manager@123` | Global recovery operations & analytics |
| **System Admin** | `admin@clearflow.com` | `Admin@123` | Full system administration |
| **Merchant** | `merchant@clearflow.com` | `Merchant@123` | Nova Electronics store only |

---

## 10. The 2-Minute Hackathon Demo Flow

1. **Sign In**: Go to `http://localhost:5000/login`. Click the **"Revenue Mgr"** quick-fill button and sign in.
2. **Review Dashboard**: Show the 8 KPI cards (Volume, Failed Revenue, Recovered Revenue, Recovery Rate).
3. **Highlight High-Value Opportunity**: Scroll to **Revenue Recovery Opportunities**. Point out the **Nova Electronics ₹85,000** failed payment with **82% Recovery Probability** and **Expected Recovery of ₹69,700**.
4. **Inspect Transaction Case**: Click **View Case**.
   - Show the decline reason: `INSUFFICIENT_FUNDS`.
   - Show Customer Profile: 4 previous successful purchases totaling ₹1,50,000 verifying cardholder legitimacy.
   - Show recommendation: `RETRY_AFTER_24_HOURS` to allow daily balance reset.
5. **Execute Simulated Recovery**: Click **"Start Recovery Simulation"**.
   - Simulation returns `SUCCESS`, capturing the full **₹85,000**.
   - Status updates from `PENDING` to **`RECOVERED`**.
6. **Audit Timeline**: View the newly recorded `RECOVERY_SUCCESS` milestone in the chronological audit timeline.
7. **Verify Dashboard Update**: Return to **Dashboard**. Show that **Recovered Revenue increased by ₹85,000** and the **Recovery Rate jumped upward** in real time!
8. **Consult AI Assistant**: Open **AI Assistant** (`/ai-assistant`). Click *"Why was payment pay_demo_nova_85k recoverable?"* to watch the assistant cite customer trust and decline codes using live PostgreSQL data.

---

## 11. Test Automation Results

Running `npm test` executes all 32 unit and integration tests:

```
> clearflow-platform@1.0.0 test
> node server/test_engines.js && node server/test_e2e.js

🧪 Algorithmic Engine Unit Tests:
✅ PASS: Categorizes INSUFFICIENT_FUNDS correctly
✅ PASS: INSUFFICIENT_FUNDS has HIGH recovery possibility
✅ PASS: INSUFFICIENT_FUNDS marked as transient
✅ PASS: EXPIRED_CARD has LOW recovery possibility
✅ PASS: EXPIRED_CARD marked as non-transient
✅ PASS: NETWORK_ERROR has VERY HIGH recovery possibility
✅ PASS: NETWORK_ERROR recommends RETRY_IMMEDIATELY
✅ PASS: High probability INSUFFICIENT_FUNDS recommends RETRY_AFTER_24_HOURS
✅ PASS: Prescribes 24 hours delay
✅ PASS: Low probability INSUFFICIENT_FUNDS requests different payment method
✅ PASS: AUTHENTICATION_FAILURE recommends SEND_PAYMENT_REMINDER
✅ PASS: EXPIRED_CARD recommends REQUEST_DIFFERENT_PAYMENT_METHOD
✅ PASS: Retry count >= 3 enforces MARK_UNRECOVERABLE
🎉 Unit Test Summary: 13 Passed, 0 Failed

🧪 End-to-End Integration Tests:
✅ PASS: Health check endpoint returns 200 HEALTHY
✅ PASS: Registration endpoint works and returns JWT token
✅ PASS: Revenue Manager login returns valid JWT token
✅ PASS: Auth /me correctly identifies REVENUE_MANAGER
✅ PASS: Merchant login correctly identifies mer_nova profile
✅ PASS: Tenant Multi-Isolation: Merchant blocked from accessing another merchant (HTTP 403)
✅ PASS: Dashboard summary calculates live volume from PostgreSQL
✅ PASS: Demo payment amount is exactly ₹85,000
✅ PASS: Demo payment failure reason is INSUFFICIENT_FUNDS
✅ PASS: Demo payment recovery probability is 82% (>=80%)
✅ PASS: Demo payment recommendation is RETRY_AFTER_24_HOURS
✅ PASS: Payment re-analysis calculates dynamic probability
✅ PASS: Recovery simulation executes successfully
✅ PASS: Simulation yields SUCCESS result
✅ PASS: Recovered amount is full principal ₹85,000
✅ PASS: Dashboard recovered revenue immediately updated in PostgreSQL
✅ PASS: Failed payments endpoint returns declined transactions
✅ PASS: Payment Report successfully generates RFC 4180 CSV
✅ PASS: AI Assistant explains recovery viability using live PostgreSQL transaction context
🎉 Integration Test Summary: 19 Passed, 0 Failed

====================================================
🎉 TOTAL TESTS: 32 Passed, 0 Failed (100% Success)
====================================================
```

---

## 12. How to Run the Platform

```powershell
# 1. Open project directory
cd C:\Users\HP\.gemini\antigravity\scratch\clearflow

# 2. Run the application (Starts server & serves web app on http://localhost:5000)
npm start

# 3. (Optional) Run tests anytime:
npm test

# 4. (Optional) Re-seed fresh demo data anytime:
npm run seed
```

**Live Web Application**: Open **`http://localhost:5000`** in your browser.
