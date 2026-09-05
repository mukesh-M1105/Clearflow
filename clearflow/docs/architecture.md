# System Architecture — ClearFlow

ClearFlow is a full-stack, AI-powered payment revenue recovery platform engineered to analyze, predict, and recapture abandoned or failed digital transactions across merchant portfolios.

---

## 1. System Architecture Diagram

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
                                      |
               +----------------------+----------------------+
               |                      |                      |
               v                      v                      v
         Core Payments         Recovery Pipeline         Audit Events
```

---

## 2. Component Descriptions

### React Frontend
- **Framework**: React 18, bundled with Vite for ultra-fast HMR and minimal bundle footprint.
- **Styling**: Tailwind CSS, utilizing a clean, high-contrast fintech aesthetic with status-driven badge palettes.
- **Visual Analytics**: Recharts library delivering interactive Area, Bar, Line, and Pie visualizations for settlement trends, failure distributions, and recovery rates.
- **State & Auth**: `AuthContext` managing persistent JWT tokens in `localStorage` with automatic 401 session expiration handling.

### Express API Gateway & Security Layer
- **Helmet**: Secures HTTP response headers against clickjacking, MIME sniffing, and cross-site scripting.
- **CORS**: Enforces secure cross-origin resource access.
- **Rate Limiting**: Protects authentication and analytical endpoints from abuse or credential stuffing.
- **JWT Middleware (`auth.js`)**: Verifies signature, expiration, and extracts authenticated user attributes.
- **Multi-Tenant Isolation (`merchantScope.js`)**: Enforces strict boundaries. A user with the `MERCHANT` role can only access payment and analytics records matching their associated `merchant_id`. Cross-tenant queries are blocked with `HTTP 403 Forbidden`.

### Core Recovery Engines
1. **Failure Analysis Engine (`failureAnalysis.js`)**:
   Categorizes declines into normalized root causes (`INSUFFICIENT_FUNDS`, `BANK_DECLINED`, `NETWORK_ERROR`, `AUTHENTICATION_FAILURE`, `EXPIRED_CARD`, `TIMEOUT`). Maps technical gateway error codes to plain-English explanations and initial recovery postures.

2. **Recovery Probability Engine (`recoveryEngine.js`)**:
   Computes an empirical 0–100 probability score based on multi-factor analysis:
   - Failure Classification: Transient switch errors (+20) vs permanent expired instruments (-20)
   - Customer Trust: Prior successful settlement history (+20 for >=3 successes)
   - Retry Velocity: Clean slate (+15) vs retry fatigue (-20 for multiple failures)
   - Transaction Size: Standard ticket size (+10) vs large unverified exposure (-10)
   - Temporal Degradation: Fresh checkout window (+12) vs stale abandonment (-15)
   - Instrument Affinity: UPI and Instant Card rails (+5)

3. **Recovery Recommendation Engine (`recoveryRecommendation.js`)**:
   Evaluates failure codes and probability scores to assign the optimal next action (`RETRY_IMMEDIATELY`, `RETRY_AFTER_1_HOUR`, `RETRY_AFTER_24_HOURS`, `REQUEST_DIFFERENT_PAYMENT_METHOD`, `SEND_PAYMENT_REMINDER`, `CONTACT_CUSTOMER`, `MARK_UNRECOVERABLE`).

4. **Simulation & Execution Service (`recoveryService.js`)**:
   Orchestrates simulated payment re-attempts, tracks attempt numbers, records lifecycle milestones in the `recovery_events` table, and updates PostgreSQL revenue metrics in real time.

5. **AI Revenue Recovery Assistant (`aiAssistant.js`)**:
   Processes natural language user questions regarding payment failure reasons, platform recovery yields, and individual case diagnoses using live PostgreSQL data and deterministic fallback reasoning.

---

## 3. Payment Failure & Recovery Lifecycle Flow

```
Customer Checkout Attempt
        ↓
Payment Processing by Issuer/Gateway
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

## 4. Database Entity Relationship (ER) Model

```
+------------------+          1:N          +------------------+
|      users       |---------------------->|    merchants     |
+------------------+                       +------------------+
| id (PK)          |                       | id (PK)          |
| name             |                       | user_id (FK)     |
| email (UNIQUE)   |                       | business_name    |
| password_hash    |                       | business_type    |
| role             |                       | created_at       |
+------------------+                       +------------------+
                                                    |
                                                    | 1:N
                                                    v
+------------------+          1:N          +------------------+
|    customers     |---------------------->|     payments     |
+------------------+                       +------------------+
| id (PK)          |                       | id (PK)          |
| name             |                       | merchant_id (FK) |
| email (UNIQUE)   |                       | customer_id (FK) |
| created_at       |                       | amount           |
+------------------+                       | currency         |
                                           | payment_method   |
                                           | status           |
                                           | failure_reason   |
                                           | recovery_status  |
                                           | created_at       |
                                           +------------------+
                                                    |
         +--------------------+---------------------+--------------------+
         | 1:1                | 1:1                                      | 1:N
         v                    v                                          v
+--------------------+ +---------------------------+     +--------------------+
| recovery_analyses  | | recovery_recommendations  |     | recovery_attempts  |
+--------------------+ +---------------------------+     +--------------------+
| id (PK)            | | id (PK)                   |     | id (PK)            |
| payment_id (FK)    | | payment_id (FK)           |     | payment_id (FK)    |
| recovery_prob      | | recommended_action        |     | merchant_id (FK)   |
| probability_level  | | recommended_delay         |     | attempt_number     |
| recoverable_amount | | expected_recovery         |     | strategy           |
| explanation        | | reason                    |     | status             |
| created_at         | | created_at                |     | result             |
+--------------------+ +---------------------------+     | recovered_amount   |
                                                         | attempted_at       |
                                                         +--------------------+
                                                                    |
                                                                    | 1:N
                                                                    v
                                                         +--------------------+
                                                         |  recovery_events   |
                                                         +--------------------+
                                                         | id (PK)            |
                                                         | payment_id (FK)    |
                                                         | attempt_id (FK)    |
                                                         | event_type         |
                                                         | description        |
                                                         | created_at         |
                                                         +--------------------+
```
