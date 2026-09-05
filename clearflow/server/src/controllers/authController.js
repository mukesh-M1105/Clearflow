const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'clearflow_super_secure_jwt_secret_2026_fintech_production_key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn }
  );
}

async function register(req, res, next) {
  try {
    const { name, email, password, role = 'MERCHANT', businessName, businessType } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    const normalizedRole = role.toUpperCase();
    if (!['ADMIN', 'REVENUE_MANAGER', 'MERCHANT'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be ADMIN, REVENUE_MANAGER, or MERCHANT.'
      });
    }

    // Check existing email
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    await db.query(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, name, email.toLowerCase(), password_hash, normalizedRole]
    );

    let merchantId = null;
    let createdBusinessName = null;

    // If registered as MERCHANT, automatically create an associated merchant business record
    if (normalizedRole === 'MERCHANT') {
      merchantId = `mer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      createdBusinessName = businessName || `${name}'s Business`;
      const createdBusinessType = businessType || 'E-commerce & Retail';

      await db.query(
        `INSERT INTO merchants (id, user_id, business_name, business_type)
         VALUES ($1, $2, $3, $4)`,
        [merchantId, userId, createdBusinessName, createdBusinessType]
      );
    }

    const user = {
      id: userId,
      name,
      email: email.toLowerCase(),
      role: normalizedRole,
      merchant_id: merchantId,
      business_name: createdBusinessName
    };

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        user,
        token
      }
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.role, m.id as merchant_id, m.business_name
       FROM users u
       LEFT JOIN merchants m ON m.user_id = u.id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    const user = result.rows[0];
    const isMatch = bcrypt.compareSync(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      merchant_id: user.merchant_id,
      business_name: user.business_name
    };

    const token = generateToken(safeUser);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        user: safeUser,
        token
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe
};
