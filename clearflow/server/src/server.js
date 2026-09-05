require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { initDatabase } = require('./database/db');
const { errorHandler } = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const recoveryRoutes = require('./routes/recoveryRoutes');
const merchantRoutes = require('./routes/merchantRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const aiRoutes = require('./routes/aiRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

// Controllers needed for alias mounts
const paymentController = require('./controllers/paymentController');
const { authenticate } = require('./middleware/auth');
const { merchantScope } = require('./middleware/merchantScope');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middleware
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiting (Prevent abuse on auth & AI endpoints)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api/', apiLimiter);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'HEALTHY',
    service: 'ClearFlow Backend Engine',
    timestamp: new Date().toISOString()
  });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);

const path = require('path');
const fs = require('fs');

// Dedicated alias for /api/failed-payments
app.get('/api/failed-payments', authenticate, merchantScope, paymentController.getFailedPayments);

app.use('/api/recovery', recoveryRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/webhooks', webhookRoutes);

// Serve compiled frontend in production/preview mode
const distPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 Route Handler for unmatched API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' not found.`
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server
async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 ClearFlow API Server running on port ${PORT}`);
      console.log(`🌐 Base URL: http://localhost:${PORT}/api`);
      console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('❌ Failed to start ClearFlow server:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}

module.exports = app;
