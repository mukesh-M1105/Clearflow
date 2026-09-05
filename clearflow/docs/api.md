# ClearFlow REST API Documentation

Base URL: `http://localhost:5000/api`

All protected endpoints require the HTTP Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

Standard Response Format:
```json
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "Error description"
}
```

---

## 1. Authentication APIs

### Register Account
- **Endpoint**: `POST /auth/register`
- **Auth**: Public
- **Request Body**:
```json
{
  "name": "Sarah Jenkins",
  "email": "sarah@company.com",
  "password": "Password@123",
  "role": "MERCHANT", // 'ADMIN' | 'REVENUE_MANAGER' | 'MERCHANT'
  "businessName": "Sarah Electronics", // Required if role = 'MERCHANT'
  "businessType": "Retail"
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_12345",
      "name": "Sarah Jenkins",
      "email": "sarah@company.com",
      "role": "MERCHANT",
      "merchant_id": "mer_67890"
    },
    "token": "eyJhbGciOi..."
  }
}
```

### Login Account
- **Endpoint**: `POST /auth/login`
- **Auth**: Public
- **Request Body**:
```json
{
  "email": "manager@clearflow.com",
  "password": "Manager@123"
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_mgr_1",
      "name": "Aarav Sharma",
      "email": "manager@clearflow.com",
      "role": "REVENUE_MANAGER"
    },
    "token": "eyJhbGciOi..."
  }
}
```

### Get Current Profile
- **Endpoint**: `GET /auth/me`
- **Auth**: Bearer Token (Any Role)
- **Response**: `200 OK`

---

## 2. Dashboard APIs

### Get KPI Summary
- **Endpoint**: `GET /dashboard/summary?period=90d`
- **Auth**: Bearer Token
- **Query Params**: `period` ('today' | '7d' | '30d' | '90d'), `merchantId` (optional for Admin/Manager)
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "totalVolume": 2482682.00,
    "totalPayments": 165,
    "successCount": 108,
    "successVolume": 1615706.00,
    "failedCount": 41,
    "failedRevenue": 730980.00,
    "recoverableRevenue": 612450.00,
    "recoveredRevenue": 270246.00,
    "recoveryRate": 44.1
  }
}
```

### Get Payment Volume Trend
- **Endpoint**: `GET /dashboard/payment-trend?period=90d`
- **Response**: `200 OK` - Array of `{ date, totalVolume, successVolume, failedVolume, totalCount, successCount, failedCount }`

### Get Recovery Trend
- **Endpoint**: `GET /dashboard/recovery-trend?period=90d`
- **Response**: `200 OK` - Array of `{ date, failedRevenue, recoveredRevenue, recoverableRevenue, recoveryRate }`

### Get Failure Reasons Breakdown
- **Endpoint**: `GET /dashboard/failure-reasons?period=90d`
- **Response**: `200 OK` - Array of `{ reason, count, totalLost, totalRecoverable, totalRecovered, recoveryRate }`

### Get Top Opportunities
- **Endpoint**: `GET /dashboard/opportunities?limit=6`
- **Response**: `200 OK` - High-probability failed payments ordered by expected recovery yield.

---

## 3. Payments APIs

### List All Payments
- **Endpoint**: `GET /payments`
- **Query Params**: `search`, `status`, `failureReason`, `recoveryStatus`, `page`, `limit`, `sortBy`, `sortOrder`
- **Response**: `200 OK` with pagination metadata.

### Get Payment Details by ID
- **Endpoint**: `GET /payments/:id`
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "pay_demo_nova_85k",
      "amount": 85000,
      "status": "FAILED",
      "failure_reason": "INSUFFICIENT_FUNDS",
      "recovery_status": "PENDING"
    },
    "analysis": {
      "recovery_probability": 82,
      "probability_level": "HIGH",
      "explanation": "..."
    },
    "recommendation": {
      "recommended_action": "RETRY_AFTER_24_HOURS",
      "recommended_delay": "24 hours",
      "expected_recovery": 69700.00
    },
    "attempts": [],
    "events": [],
    "customerHistory": { ... }
  }
}
```

### List Failed Payments
- **Endpoint**: `GET /failed-payments`
- **Auth**: Bearer Token
- **Query Params**: Same as `/payments`, with status filtered to `FAILED`.

---

## 4. Recovery APIs

### List Recovery Attempts
- **Endpoint**: `GET /recovery`
- **Query Params**: `search`, `status`, `strategy`, `page`, `limit`
- **Response**: `200 OK` with attempt history and recovered amounts.

### Get Recovery Case by Payment ID
- **Endpoint**: `GET /recovery/:paymentId`
- **Response**: `200 OK` - Complete case timeline and evaluation factors.

### Trigger Payment Analysis
- **Endpoint**: `POST /recovery/analyze/:paymentId`
- **Response**: `200 OK` - Returns freshly calculated probability score and recommended strategy.

### Execute Recovery Simulation
- **Endpoint**: `POST /recovery/start/:paymentId`
- **Request Body**: `{ "strategy": "RETRY_AFTER_24_HOURS" }`
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Simulated recovery attempt completed with status: SUCCESS",
  "data": {
    "paymentId": "pay_demo_nova_85k",
    "attemptId": "att_172538...",
    "attemptNumber": 1,
    "strategy": "RETRY_AFTER_24_HOURS",
    "status": "SUCCESS",
    "result": "PAYMENT_CAPTURED_SUCCESSFULLY",
    "recoveredAmount": 85000,
    "newRecoveryStatus": "RECOVERED"
  }
}
```

---

## 5. Merchant APIs

### List Merchants
- **Endpoint**: `GET /merchants?search=`
- **Response**: `200 OK` - Business directory with gross volume and recovery rates.

### Get Merchant Profile & Metrics
- **Endpoint**: `GET /merchants/:id`
- **Response**: `200 OK` - Includes merchant summary, trends, and opportunities.

---

## 6. Analytics APIs

### Recovery Aggregate Analytics
- **Endpoint**: `GET /analytics/recovery?period=90d`
- **Response**: `200 OK`

### Merchant Performance Benchmarks
- **Endpoint**: `GET /analytics/merchants`
- **Response**: `200 OK` - Ranked by recovered revenue.

---

## 7. Reporting & CSV Export APIs

### Generate Payments Report
- **Endpoint**: `GET /reports/payments?format=csv` (or `format=json`)
- **Query Params**: `startDate`, `endDate`, `status`, `failureReason`
- **Response**: RFC 4180 CSV attachment or JSON dataset.

### Generate Recovery Attempts Report
- **Endpoint**: `GET /reports/recovery?format=csv`

### Generate Merchant Summary Report
- **Endpoint**: `GET /reports/merchants?format=csv`

---

## 8. AI Recovery Assistant API

### Query Assistant
- **Endpoint**: `POST /ai/assistant`
- **Request Body**:
```json
{
  "message": "Why was payment pay_demo_nova_85k recoverable?",
  "context": { "paymentId": "pay_demo_nova_85k" }
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "reply": "### Recovery Viability Analysis for Payment `pay_demo_nova_85k`...",
    "metadata": { "probability": 82, "recommendedAction": "RETRY_AFTER_24_HOURS" },
    "suggestedQuestions": [ ... ]
  }
}
```
