/**
 * Ayiti VPN (Pwotek) - Main Server
 * vpn.ayiti.com
 *
 * WireGuard VPN Management Platform
 * Users can earn credits through the ecosystem and spend them on VPN subscriptions
 * Part of the Ayiti Ecosystem
 */

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { setupAuth } = require('../shared/middleware/auth');
const sequelize = require('../shared/config/database');

// Import models to ensure they're registered
const { VpnPlan, VpnSubscription, VpnClient, VpnUsageLog } = require('./models');
const AdminUser = require('../shared/models/AdminUser');

// Import routes
const subscriptionRoutes = require('./routes/subscriptions');
const clientRoutes = require('./routes/clients');
const adminRoutes = require('./routes/admin');
const adminAuthRoutes = require('./routes/adminAuth');
const wireguardRoutes = require('./routes/wireguard');

const app = express();

// Trust proxy for secure cookies behind Nginx
app.set('trust proxy', 1);

// ==================== MIDDLEWARE ====================

// CORS - Allow ecosystem subdomains
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3008',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://ayiti.com',
    'https://vpn.ayiti.com',
    'https://academy.ayiti.com',
    'https://solar.ayiti.com'
  ],
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'ayiti-vpn-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    sameSite: 'lax'
  }
}));

// Authentication (Google OAuth)
setupAuth(app, passport);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ==================== API ROUTES ====================

app.use('/api/plans', subscriptionRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin-auth', adminAuthRoutes);
app.use('/api/wg', wireguardRoutes);

// ==================== AUTH ROUTES ====================

// Google OAuth login
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google OAuth callback
app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/?error=auth_failed'
  }),
  (req, res) => {
    res.redirect('/customer/dashboard.html');
  }
);

// Logout
app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

// Get current user
app.get('/api/user', (req, res) => {
  if (req.user) {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        credits: req.user.credits,
        role: req.user.role
      }
    });
  } else {
    res.json({ success: false, user: null });
  }
});

// ==================== LOCALIZATION ====================

// Get translations
app.get('/api/locales/:lang', (req, res) => {
  const lang = req.params.lang;
  const validLangs = ['en', 'ht'];

  if (!validLangs.includes(lang)) {
    return res.status(400).json({ success: false, error: 'Invalid language' });
  }

  try {
    const translations = require(`./locales/${lang}.json`);
    res.json({ success: true, translations });
  } catch (error) {
    res.status(404).json({ success: false, error: 'Translations not found' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'Ayiti VPN (Pwotek)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ==================== PAGE ROUTES ====================

// Admin dashboard
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

// Customer pages
app.get('/customer/*', (req, res) => {
  const page = req.path.split('/').pop() || 'dashboard.html';
  res.sendFile(path.join(__dirname, 'public', 'customer', page));
});

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// ==================== START SERVER ====================

const PORT = process.env.VPN_PORT || 3008;

// Sync database and start server
sequelize.sync({ alter: process.env.NODE_ENV === 'development' })
  .then(() => {
    console.log('Database synced successfully');
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════╗
║       Ayiti VPN (Pwotek) - Server Started         ║
╠═══════════════════════════════════════════════════╣
║  Port: ${PORT}                                       ║
║  URL: http://localhost:${PORT}                       ║
║  Env: ${(process.env.NODE_ENV || 'development').padEnd(11)}                       ║
╠═══════════════════════════════════════════════════╣
║  Pwotek VPN: Secure, Private, WireGuard-powered   ║
║  Bilingual: English / Kreyòl Ayisyen              ║
╚═══════════════════════════════════════════════════╝
      `);
    });
  })
  .catch(err => {
    console.error('Database sync failed:', err);
    process.exit(1);
  });

module.exports = app;
