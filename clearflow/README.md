# ClearFlow — AI-Powered Payment Revenue Recovery Platform

ClearFlow is a complete fintech web application engineered to solve one of the costliest problems in global commerce: **unsuccessful, abandoned, and failed digital payment transactions**.

By pairing real-time payment failure diagnostics with probabilistic AI scoring, smart re-attempt timing rules, and automated execution simulation, ClearFlow empowers merchants to systematically recapture lost revenue without manual intervention or aggressive retries that trigger card network penalties.

---

## Table of Contents
1. [Problem Statement](#problem-statement)
2. [Proposed Solution](#proposed-solution)
3. [Why Revenue Recovery Matters](#why-revenue-recovery-matters)
4. [Key Features](#key-features)
5. [Target Users & Roles](#target-users--roles)
6. [Technology Stack](#technology-stack)
7. [System Architecture](#system-architecture)
8. [Payment Failure & Recovery Workflow](#payment-failure--recovery-workflow)
9. [Recovery Probability Algorithm](#recovery-probability-algorithm)
10. [Recovery Recommendation Engine](#recovery-recommendation-engine)
11. [Database Architecture & Schema](#database-architecture--schema)
12. [Demo Credentials](#demo-credentials)
13. [Installation & How to Run](#installation--how-to-run)
14. [Hackathon Demo Flow (Step-by-Step)](#hackathon-demo-flow-step-by-step)
15. [Security & Multi-Tenant Isolation](#security--multi-tenant-isolation)
16. [Future Roadmap](#future-roadmap)

---

## Problem Statement

Across modern payment gateways (UPI, Cards, Net Banking), **up to 10% to 25% of all digital checkout attempts fail**. In India alone, billions of rupees in gross merchandise value (GMV) are abandoned due to:
- Temporary customer liquidity shortfalls (`INSUFFICIENT_FUNDS`)
- False-positive fraud flags and security velocity checks (`BANK_DECLINED`)
- Transient gateway timeouts and switch hiccups (`NETWORK_ERROR`, `TIMEOUT`)
- Customer authentication drops during 3D Secure or SMS OTP (`AUTHENTICATION_FAILURE`)
- Outdated saved cards on merchant files (`EXPIRED_CARD`)

Traditional merchant processors treat failed transactions as dead ends or blindly blast repeated retries within seconds—which triggers card brand velocity penalties, burns merchant interchange fees, and alienates customers.

---

## Proposed Solution

ClearFlow sits directly on top of transaction telemetry to convert declines into recovered revenue:
1. **Root-Cause Diagnostic**: Decodes cryptic ISO 8583 decline codes into normalized business categories.
2. **Probability Engine (0–100%)**: Calculates the statistical likelihood of successful settlement using historical customer trust, decline volatility, and ticket size.
3. **Smart Timing & Channel Prescriptions**: Recommends the exact cooldown delay (e.g. 24 hours for salary/limit resets, immediate for switch hiccups).
4. **Automated Recovery Simulation**: Executes simulated recovery retries safely without real cardholder fees.
5. **Real-time Ledger Updates**: Updates PostgreSQL metrics immediately to reflect recaptured cash flow.

---

## Why Revenue Recovery Matters

- **Zero Acquisition Cost**: Converting a failed transaction recaptures revenue from a customer who has *already decided to buy*. No incremental ad spend required.
- **Improved Customer Retention**: Smooth recovery re-attempts prevent cart abandonment and build consumer loyalty.
- **Interchange & Fee Protection**: Strategic cooling periods prevent acquirer fines for rapid retry abuse.

---

## Key Features

1. **Fintech Revenue Dashboard**:
   - 8 dynamic KPI cards: Gross Volume, Successful Volume, Failed Revenue, Recoverable Revenue, Recovered Revenue, Recovery Rate (%), Active Pipeline, and Gross Checkouts.
   - 6 Interactive Recharts: Volume trend, Settled vs Failed counts, Recovery velocity, Root cause pie distribution, Conversion rates, and Performance comparisons.
   - Date range filters (`Today`, `7 Days`, `30 Days`, `90 Days`) computed via PostgreSQL SQL queries.
2. **High-Priority Opportunity Feed**:
   - Surfaces high-value declined transactions with >=70% recovery probability sorted by expected yield.
3. **Automated Recovery Simulation Engine**:
   - Single-click retry execution simulating real payment gateway capture with full transaction audit logs.
4. **Audit Trail & Event Timeline**:
   - Complete chronological timeline (`FAILURE_DETECTED` -> `PAYMENT_ANALYZED` -> `RECOMMENDATION_GENERATED` -> `RECOVERY_SUCCESS`).
5. **AI Revenue Recovery Assistant**:
   - Chat intelligence with live PostgreSQL data awareness. Answers questions like *"Why was payment pay_demo_nova_85k recoverable?"* and *"Which failure reason causes the most revenue loss?"*
6. **Merchant Directory & Benchmarks**:
   - Cohort analysis comparing recovery conversion across merchant industries.
7. **Compliance Reporting & CSV Export**:
   - Generates SQL-backed audit datasets with instant RFC 4180 CSV download.

---

## Target Users & Roles

ClearFlow enforces strict role-based access control (RBAC):

| Role | Access Scope | Primary Actions |
|---|---|---|
| **ADMIN** | Global Platform | Full visibility across all merchants, users, payments, and system telemetry. |
| **REVENUE_MANAGER** | Global Recovery Ops | Analyzes declined payments, monitors recovery conversion, triggers recovery simulations, and manages pipelines. |
| **MERCHANT** | Scoped to Assigned Store | Strictly isolated to their own payments, recovery attempts, and recoverable revenue. Cross-tenant access is blocked with HTTP 403. |

---

## Technology Stack

- **Frontend**: React 18, Vite, React Router 6, Axios, Tailwind CSS, Recharts, Lucide React
- **Backend**: Node.js, Express.js, REST APIs, Helmet, CORS, Express Rate Limit
- **Authentication**: Cryptographic JWT (`Bearer`), bcryptjs password hashing (cost factor 10)
- **Database**: PostgreSQL (Relational schema with Foreign Keys, Check Constraints, and Indexes)
  - *Dual-Engine Support*: Connects seamlessly to external PostgreSQL servers via `pg.Pool`, or boots self-contained embedded PostgreSQL (`@electric-sql/pglite`) for zero-setup local execution.

---

## System Architecture

```
                    USER (Admin / Revenue Manager / Merchant)
                                      |
                                      v
                       React Single Page Application
                          (Vite, Tailwind CSS, Recharts)
                                      |
                                      v
                                Axios / REST
                                (JWT Bearer)
                                      |
                                      v
                           Express.js API Gateway
                                      |
                    +-----------------+-----------------+
                    |                                   |
              Authentication                     Rate Limiting
             & Role Scoping                     & Helmet Security
                    |                                   |
                    +-----------------+-----------------+
                                      |
                                      v
                            Express Controllers
                                      |
                                      v
                            Service Layer Pipeline
                                      |
       +--------------------+---------+---------+--------------------+
       |                    |                   |                    |
       v                    v                   v                    v
Failure Analysis     Recovery Engine     Recovery Service       AI Assistant
 (Classification)     (Probability)       (Simulation)          (Analytics)
       |                    |                   |                    |
       +--------------------+---------+---------+--------------------+
                                      |
                                      v
                           PostgreSQL Database
                         (Relational Ledger Schema)
```

---

## Payment Failure & Recovery Workflow

```
Customer Checkout Attempt
        ↓
Payment Processing by Gateway
        ↓
Successful?
   /          \
 YES           NO
 |             |
Settle         Failure Analysis Engine
Payment            ↓
              Recovery Probability Scoring (0 - 100)
                    ↓
              Prescribed Recovery Recommendation
                    ↓
              Recovery Attempt (Simulation Runner)
                    ↓
              SUCCESS or FAILED?
               /              \
         SUCCESS              FAILED
            |                    |
   Mark 'RECOVERED'      Attempt < 3?
   Update Revenue Metrics   /         \
                         YES          NO
                          |            |
                     Scheduled    Mark 'UNRECOVERABLE'
                     Next Retry
```

---

## Recovery Probability Algorithm

The Recovery Engine (`server/src/services/recoveryEngine.js`) calculates a normalized score from **0 to 100**:

$$\text{Score} = \text{Base} + \Delta_{\text{FailureType}} + \Delta_{\text{Trust}} + \Delta_{\text{Retries}} + \Delta_{\text{Amount}} + \Delta_{\text{Age}} + \Delta_{\text{Rail}}$$

- **Transient Decline (`NETWORK_ERROR`, `TIMEOUT`, `INSUFFICIENT_FUNDS`)**: $+20$ points
- **Established Customer Trust**: $+20$ points for $\ge 3$ verified previous settlements
- **Retry Velocity**: $+15$ points for first attempt; $-20$ points if $\ge 2$ retries already failed
- **Ticket Sizing**: $+10$ points for normal amounts; $+5$ for verified high-value buyers
- **Temporal Freshness**: $+12$ points within 6 hours of failure; $-15$ points if $>72$ hours
- **Instrument Rail**: $+5$ points for instant rails (UPI, Visa/Mastercard)

### Confidence Tiers:
- `85 – 100`: **VERY HIGH**
- `70 – 84`: **HIGH**
- `50 – 69`: **MEDIUM**
- `30 – 49`: **LOW**
- `0 – 29`: **VERY LOW**

---

## Recovery Recommendation Engine

Based on root-cause classification and probability, the decision matrix outputs:
- **`RETRY_IMMEDIATELY`**: For `NETWORK_ERROR` and `TIMEOUT` via backup acquiring rails.
- **`RETRY_AFTER_24_HOURS`**: For `INSUFFICIENT_FUNDS` (allowing salary credit or card limit refresh).
- **`SEND_PAYMENT_REMINDER`**: For `AUTHENTICATION_FAILURE` (SMS/WhatsApp direct checkout link).
- **`REQUEST_DIFFERENT_PAYMENT_METHOD`**: For `EXPIRED_CARD` or persistent card declines.
- **`CONTACT_CUSTOMER`**: For strict issuing bank security blocks.
- **`MARK_UNRECOVERABLE`**: When retry limits ($\ge 3$) are reached.

---

## Database Architecture & Schema

All transactions, profiles, and audit milestones are recorded in **PostgreSQL**:

```sql
users (id, name, email, password_hash, role, created_at, updated_at)
merchants (id, user_id, business_name, business_type, created_at, updated_at)
customers (id, name, email, created_at)
payments (id, merchant_id, customer_id, amount, currency, payment_method, status, failure_reason, recovery_status, created_at, updated_at)
recovery_analyses (id, payment_id, recovery_probability, probability_level, recoverable_amount, explanation, created_at)
recovery_recommendations (id, payment_id, recommended_action, recommended_delay, expected_recovery, reason, created_at)
recovery_attempts (id, payment_id, merchant_id, attempt_number, strategy, status, result, recovered_amount, attempted_at, created_at)
recovery_events (id, payment_id, recovery_attempt_id, event_type, description, created_at)
```

Indexed for production query performance on `payments.merchant_id`, `payments.customer_id`, `payments.status`, `payments.created_at`, `recovery_analyses.recovery_probability`, and `recovery_attempts.status`.

---

## Demo Credentials

The platform comes pre-seeded with realistic Indian fintech accounts and transactions:

| Role | Email | Password | Scope |
|---|---|---|---|
| **Revenue Manager** | `manager@clearflow.com` | `Manager@123` | Global Recovery Operations |
| **System Admin** | `admin@clearflow.com` | `Admin@123` | Full Administrative Visibility |
| **Merchant** | `merchant@clearflow.com` | `Merchant@123` | Nova Electronics Only |

*(Quick-login buttons are also available on the Login screen for 1-click credential filling)*.

---

## Installation & How to Run

### Prerequisites
- Node.js v18+ and npm installed.

### 1. Clone & Enter Directory
```bash
cd C:\Users\HP\.gemini\antigravity\scratch\clearflow
```

### 2. Install Dependencies (Already performed during setup)
```bash
# Server dependencies
npm install --prefix server

# Client dependencies
npm install --prefix client
```

### 3. Seed Database
```bash
npm run seed
```
*Applies SQL schema, tables, constraints, indexes, 6 users, 5 merchants, 35 customers, and 165+ payments.*

### 4. Start the Application
```bash
npm start
```
*Runs the unified platform on **`http://localhost:5000`** (serving both the React SPA and REST API gateway).*

*(For active frontend development with Hot Module Replacement, you can run `npm run client` on port 3000).*

---

## Hackathon Demo Flow (Step-by-Step)

Follow this 2-minute flow for an impressive hackathon live demonstration:

1. **Login**: Go to `http://localhost:5000/login`. Click the **"Revenue Mgr"** quick login button and click **Sign In**.
2. **Dashboard Review**: Inspect the 8 live KPI cards. Note the current **Recovered Revenue** and **Recovery Rate**.
3. **Spot High-Value Opportunity**:
   - Scroll down to the **Revenue Recovery Opportunities** section.
   - Observe the **Nova Electronics ₹85,000** failed payment with **82% Recovery Probability** and **Expected Recovery of ₹69,700**.
4. **Inspect Payment Details**:
   - Click **View Case** on the ₹85,000 card.
   - Show the decline code: `INSUFFICIENT_FUNDS`.
   - Show the Customer History: 4 prior successful high-value transactions proving cardholder legitimacy.
   - Show the recommendation: `RETRY_AFTER_24_HOURS`.
5. **Execute Simulated Recovery**:
   - Click the **"Start Recovery Simulation"** button.
   - The simulation executes, outputs `SUCCESS`, and records the full **₹85,000** captured principal.
   - The status badge transitions from `PENDING` to **`RECOVERED`**.
6. **Audit Timeline**:
   - Observe the new chronological milestone recorded under **Recovery Audit Timeline**.
7. **Verify Immediate Dashboard Update**:
   - Click **Dashboard** in the sidebar.
   - Show that **Recovered Revenue has increased by ₹85,000** and the **Recovery Rate has jumped upward**!
8. **Consult AI Assistant**:
   - Click **AI Assistant** in the sidebar.
   - Click the prompt idea: *"Why was payment pay_demo_nova_85k recoverable?"*
   - Watch the assistant break down the live customer history, transient decline code, and recovery viability in real time.

---

## Security & Multi-Tenant Isolation

- **Zero Secret Exposure**: Passwords hashed with bcrypt; JWT signatures validated per request; environment secrets never returned to clients.
- **Tenant Data Isolation**: When logged in as a merchant, all SQL queries enforce `WHERE merchant_id = $merchant_id`. If a merchant attempts to access another store's ID (e.g. `/api/merchants/mer_fresh`), the server denies access with `HTTP 403 Forbidden`.
- **Injection Defense**: 100% of SQL operations utilize parameterized queries (`$1, $2, ...`).

---

## Future Roadmap

- Real Payment Gateway Webhooks (Razorpay, Stripe, PayU)
- Autonomous Smart Retry Scheduler with Redis BullMQ
- Machine Learning Logistic Regression model trained on payment issuer authorization response codes
- WhatsApp OTP Re-engagement Bot for 3DS drop-offs
