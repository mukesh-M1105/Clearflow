# ClearFlow — Hackathon Presentation Pitch & Demo Guide

This guide is designed to help you deliver a winning 3-to-5 minute hackathon presentation, pitch, and technical demo for **ClearFlow**.

---

## 1. The 30-Second Elevator Pitch

> *"Every year, digital merchants lose up to 20% of their gross revenue to declined, abandoned, or failed payment transactions. Today, businesses either write this revenue off or blast blunt, repeated retries that trigger card network fines and customer frustration.*
>
> *We built **ClearFlow**—an AI-powered payment revenue recovery platform. ClearFlow analyzes payment failure codes, calculates a recovery probability score from 0 to 100%, prescribes the exact recovery window, and automatically simulates the retry. We turn failed checkouts into recovered cash flow at zero customer acquisition cost."*

---

## 2. 5-Slide Presentation Deck Outline

### Slide 1: The Problem (The Hidden Leak in Digital Payments)
- 15% to 25% of digital checkouts fail across UPI, credit cards, and net banking.
- In India, this represents thousands of crores in lost merchant revenue.
- Most failures are **transient** (temporary balance dips, bank security cooling periods, switch timeouts), but existing gateways treat them as final.

### Slide 2: The Solution (ClearFlow Intelligent Recovery Pipeline)
- **Root Cause Analysis**: Translates obscure gateway error codes into plain English.
- **Probabilistic Scoring Engine**: Evaluates customer lifetime trust, transaction sizing, and retry fatigue.
- **Smart Timing Matrix**: Retries at the mathematically optimal settlement window (e.g., 24h for salary/limit refresh).
- **Safe Simulated Gateway**: Executes retries and updates revenue ledgers in real time.

### Slide 3: System Architecture & Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts for financial data visualization.
- **Backend**: Node.js, Express.js REST APIs, JWT authentication, role-based authorization, and strict multi-tenant merchant data isolation.
- **Database**: PostgreSQL relational ledger with check constraints, foreign keys, and indexes.

### Slide 4: Live Demonstration (The ₹85,000 Recovery Flow)
- *Demonstrate the live product workflow using the steps in Section 3.*

### Slide 5: Business Impact & ROI
- **$0 Customer Acquisition Cost (CAC)**: Recaptures buyers who have already completed the checkout intent.
- **Improved Merchant Retention**: Enhances consumer checkout completion rates.
- **Card Brand Compliance**: Avoids acquirer penalties from blind retry flooding.

---

## 3. Step-by-Step Live Demo Script (2 Minutes)

| Timing | Screen | Speaking Script |
|---|---|---|
| **0:00 - 0:25** | **Login & Dashboard** (`http://localhost:5000/login`) | *"I'm logging in as our Revenue Manager. On the dashboard, every KPI you see—Total Volume, Failed Revenue, and our 44% Recovery Rate—is computed dynamically via SQL queries on our PostgreSQL database."* |
| **0:25 - 0:50** | **Opportunities Section** | *"Notice this high-priority opportunity: A ₹85,000 transaction for Nova Electronics that failed due to 'INSUFFICIENT_FUNDS'. Our AI engine evaluated the buyer's 4 prior successful purchases and scored this with an 82% recovery probability."* |
| **0:50 - 1:20** | **Payment Details & Simulation** (`/payments/pay_demo_nova_85k`) | *"Opening the case, our engine recommends 'RETRY_AFTER_24_HOURS' to allow for account limit replenishment. I'll click 'Start Recovery Simulation' now. The simulated rail executes, payment capture succeeds, and the status updates to RECOVERED."* |
| **1:20 - 1:45** | **Dashboard Telemetry Update** | *"Returning to our dashboard, our Recovered Revenue has immediately increased by ₹85,000, directly improving our net recovery efficiency in real time."* |
| **1:45 - 2:00** | **AI Assistant** (`/ai-assistant`) | *"Finally, our AI Recovery Co-pilot answers ad-hoc business inquiries using live database telemetry. When asked 'Why was this payment recoverable?', it cites customer settlement trust and transient decline classifications."* |

---

## 4. Judges' Likely Technical Questions & Answers

### Q1: *"How does your recovery probability engine work?"*
**Answer**:
> *"Our algorithm (`server/src/services/recoveryEngine.js`) uses a multi-factor weighted scoring model. It starts with a baseline, awards +20 points for recoverable decline types, evaluates customer historical trust (+20 for verified payers), penalizes retry fatigue (-20 if previous retries failed), assesses transaction ticket size, and applies time degradation. Scores are normalized from 0 to 100 across 5 confidence tiers."*

### Q2: *"How do you handle merchant data security?"*
**Answer**:
> *"We enforce multi-tenant isolation directly on the backend (`server/src/middleware/merchantScope.js`). When a user with the MERCHANT role queries the API, their assigned merchant_id is cryptographically extracted from their JWT token and enforced on all SQL queries. If a merchant attempts to access another merchant's record, the server immediately denies the request with HTTP 403 Forbidden."*

### Q3: *"Can this connect to real payment gateways like Razorpay or Stripe?"*
**Answer**:
> *"Yes. Our simulation runner uses an adapter architecture. In production, the simulation layer can be swapped with webhooks and API calls to Stripe or Razorpay smart retries, while retaining our proprietary scoring engine and audit event timeline."*

### Q4: *"What database are you using?"*
**Answer**:
> *"We use PostgreSQL with a relational schema featuring 8 normalized tables, check constraints, foreign key cascades, and B-tree indexes for fast analytical aggregations."*
