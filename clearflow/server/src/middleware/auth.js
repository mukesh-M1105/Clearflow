const jwt = require('jsonwebtoken');
const db = require('../database/db');

/**
 * Authentication Middleware
 * Validates the JWT Bearer token from the Authorization header,
 * extracts the user and associated merchant ID, and attaches to req.user.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'clearflow_super_secure_jwt_secret_2026_fintech_production_key';

    const decoded = jwt.verify(token, secret);

    // Verify user still exists in database and fetch associated merchant if MERCHANT role
    const userResult = await db.query(
      `SELECT u.id, u.name, u.email, u.role, m.id as merchant_id, m.business_name
       FROM users u
       LEFT JOIN merchants m ON m.user_id = u.id
       WHERE u.id = $1`,
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User account not found.'
      });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.'
    });
  }
}

module.exports = { authenticate };
