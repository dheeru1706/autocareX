'use strict';

require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const logger = require('./utils/logger');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/users.routes');
const vehicleRoutes = require('./modules/vehicles/vehicles.routes');
const bookingRoutes = require('./modules/bookings/bookings.routes');
const paymentRoutes = require('./modules/payments/payments.routes');
const subscriptionRoutes = require('./modules/subscriptions/subscriptions.routes');
const marketplaceRoutes = require('./modules/marketplace/marketplace.routes');
const franchiseRoutes = require('./modules/franchise/franchise.routes');
const insuranceRoutes = require('./modules/insurance/insurance.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const notificationRoutes = require('./modules/notifications/notifications.routes');
const couponRoutes = require('./modules/coupons/coupons.routes');

const app = express();

// =============================================
// SECURITY MIDDLEWARE
// =============================================

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:8080'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Total-Count', 'X-Request-ID'],
  })
);

// =============================================
// GENERAL MIDDLEWARE
// =============================================

app.use(compression());

// Body parsing — Note: webhook route uses raw body, so we handle that per-route
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next(); // handled in payments.routes with manual body capture
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request ID
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || require('uuid').v4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// HTTP request logging
app.use(
  morgan(
    ':method :url :status :res[content-length] - :response-time ms [:remote-addr]',
    {
      stream: { write: (message) => logger.http(message.trim()) },
      skip: (req) => req.url === '/health',
    }
  )
);

// Trust proxy (for accurate IP behind load balancer)
app.set('trust proxy', 1);

// =============================================
// HEALTH CHECK
// =============================================

app.get('/health', async (req, res) => {
  const { testConnection } = require('./config/database');
  const { client: redisClient } = require('./config/redis');

  const dbOk = await testConnection().catch(() => false);
  const redisOk = redisClient.isReady;

  const status = dbOk && redisOk ? 200 : 503;

  res.status(status).json({
    status: status === 200 ? 'healthy' : 'degraded',
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      database: dbOk ? 'ok' : 'error',
      redis: redisOk ? 'ok' : 'error',
    },
  });
});

app.get('/api/v1', (req, res) => {
  res.json({
    name: 'AutoCareX API',
    version: 'v1',
    environment: process.env.NODE_ENV || 'development',
  });
});

// =============================================
// API ROUTES
// =============================================

const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/vehicles`, vehicleRoutes);
app.use(`${API_PREFIX}/bookings`, bookingRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/subscriptions`, subscriptionRoutes);
app.use(`${API_PREFIX}/marketplace`, marketplaceRoutes);
app.use(`${API_PREFIX}/franchise`, franchiseRoutes);
app.use(`${API_PREFIX}/insurance`, insuranceRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/coupons`, couponRoutes);

// Additional modules
const chatRoutes = require('./modules/chat/chat.routes');
const walletRoutes = require('./modules/wallet/wallet.routes');
const servicesRoutes = require('./modules/services/services.routes');
const fleetRoutes = require('./modules/fleet/fleet.routes');

app.use(`${API_PREFIX}/chat`, chatRoutes);
app.use(`${API_PREFIX}/wallet`, walletRoutes);
app.use(`${API_PREFIX}/services`, servicesRoutes);
app.use(`${API_PREFIX}/fleet`, fleetRoutes);

// Service catalog (public)
app.get(`${API_PREFIX}/services/categories`, apiLimiter, async (req, res) => {
  const { query } = require('./config/database');
  const { success, error } = require('./utils/response');
  try {
    const result = await query(
      'SELECT * FROM service_categories WHERE is_active = true ORDER BY sort_order ASC'
    );
    return success(res, result.rows);
  } catch {
    return error(res, 'Failed to fetch categories');
  }
});

app.get(`${API_PREFIX}/services/packages`, apiLimiter, async (req, res) => {
  const { query } = require('./config/database');
  const { success, error } = require('./utils/response');
  try {
    const { category_id, vehicle_type } = req.query;
    const conditions = ['sp.is_active = true'];
    const params = [];
    let idx = 1;

    if (category_id) { conditions.push(`sp.category_id = $${idx++}`); params.push(category_id); }
    if (vehicle_type) { conditions.push(`$${idx++} = ANY(sp.vehicle_types) OR sp.vehicle_types = '{}'`); params.push(vehicle_type); }

    const result = await query(
      `SELECT sp.*, sc.name AS category_name, sc.icon_url AS category_icon
       FROM service_packages sp
       JOIN service_categories sc ON sc.id = sp.category_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY sp.is_popular DESC, sp.base_price ASC`,
      params
    );
    return success(res, result.rows);
  } catch {
    return error(res, 'Failed to fetch packages');
  }
});

// =============================================
// ERROR HANDLERS (must be last)
// =============================================

app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
