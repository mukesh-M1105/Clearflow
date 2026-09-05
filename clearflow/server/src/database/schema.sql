-- ClearFlow Database Schema (PostgreSQL)

DROP TABLE IF EXISTS recovery_events CASCADE;
DROP TABLE IF EXISTS recovery_attempts CASCADE;
DROP TABLE IF EXISTS recovery_recommendations CASCADE;
DROP TABLE IF EXISTS recovery_analyses CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS merchants CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('ADMIN', 'REVENUE_MANAGER', 'MERCHANT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Merchants Table
CREATE TABLE merchants (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Customers Table
CREATE TABLE customers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Payments Table
CREATE TABLE payments (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) DEFAULT 'INR',
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING', 'REFUNDED')),
    failure_reason VARCHAR(64) CHECK (
        failure_reason IN (
            'INSUFFICIENT_FUNDS',
            'BANK_DECLINED',
            'NETWORK_ERROR',
            'AUTHENTICATION_FAILURE',
            'EXPIRED_CARD',
            'TIMEOUT',
            'UNKNOWN'
        ) OR failure_reason IS NULL
    ),
    recovery_status VARCHAR(32) DEFAULT 'NOT_REQUIRED' CHECK (
        recovery_status IN (
            'NOT_REQUIRED',
            'PENDING',
            'IN_PROGRESS',
            'RECOVERED',
            'UNRECOVERABLE'
        )
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Recovery Analyses Table
CREATE TABLE recovery_analyses (
    id VARCHAR(64) PRIMARY KEY,
    payment_id VARCHAR(64) NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    recovery_probability INT NOT NULL CHECK (recovery_probability BETWEEN 0 AND 100),
    probability_level VARCHAR(32) NOT NULL CHECK (probability_level IN ('VERY LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY HIGH')),
    recoverable_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    explanation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Recovery Recommendations Table
CREATE TABLE recovery_recommendations (
    id VARCHAR(64) PRIMARY KEY,
    payment_id VARCHAR(64) NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    recommended_action VARCHAR(64) NOT NULL,
    recommended_delay VARCHAR(64) NOT NULL,
    expected_recovery NUMERIC(14, 2) NOT NULL DEFAULT 0,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Recovery Attempts Table
CREATE TABLE recovery_attempts (
    id VARCHAR(64) PRIMARY KEY,
    payment_id VARCHAR(64) NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL DEFAULT 1,
    strategy VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'CANCELLED')),
    result VARCHAR(64),
    recovered_amount NUMERIC(14, 2) DEFAULT 0,
    attempted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Recovery Events Table
CREATE TABLE recovery_events (
    id VARCHAR(64) PRIMARY KEY,
    payment_id VARCHAR(64) NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    recovery_attempt_id VARCHAR(64) REFERENCES recovery_attempts(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for optimal performance
CREATE INDEX idx_payments_merchant_id ON payments(merchant_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_failure_reason ON payments(failure_reason);
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE INDEX idx_recovery_analyses_payment_id ON recovery_analyses(payment_id);
CREATE INDEX idx_recovery_analyses_probability ON recovery_analyses(recovery_probability);

CREATE INDEX idx_recovery_attempts_payment_id ON recovery_attempts(payment_id);
CREATE INDEX idx_recovery_attempts_status ON recovery_attempts(status);
