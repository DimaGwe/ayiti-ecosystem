/**
 * Ayiti Trivia - Main Server
 * trivia.ayiti.com
 *
 * Play-to-earn trivia game where users answer questions to earn credits
 * Part of the Haiti Skills ecosystem
 */

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { setupAuth } = require('../shared/middleware/auth');
const sequelize = require('../shared/config/database');

// Import models to ensure they're registered
const { Question, Answer, GameSession, Leaderboard } = require('./models');

// Import routes
const gameRoutes = require('./routes/game');
const leaderboardRoutes = require('./routes/leaderboard');

const app = express();

// ==================== MIDDLEWARE ====================

// CORS - Allow ecosystem subdomains
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'https://ayiti.com',
    'https://trivia.ayiti.com',
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
  secret: process.env.SESSION_SECRET || 'ayiti-trivia-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    domain: process.env.NODE_ENV === 'production' ? '.ayiti.com' : undefined
  }
}));

// Authentication (Google OAuth)
setupAuth(app);

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

app.use('/api/game', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// ==================== AUTH ROUTES ====================

const passport = require('passport');

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
    res.redirect('/');
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
        credits: req.user.credits
      }
    });
  } else {
    res.json({ success: false, user: null });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'Ayiti Trivia',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ==================== SPA FALLBACK ====================

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

const PORT = process.env.TRIVIA_PORT || 3002;

// Sync database and start server
sequelize.sync({ alter: process.env.NODE_ENV === 'development' })
  .then(() => {
    console.log('Database synced successfully');
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════╗
║           Ayiti Trivia - Server Started           ║
╠═══════════════════════════════════════════════════╣
║  Port: ${PORT}                                       ║
║  URL: http://localhost:${PORT}                       ║
║  Env: ${(process.env.NODE_ENV || 'development').padEnd(11)}                       ║
╠═══════════════════════════════════════════════════╣
║  Categories: Haiti History, Geography, Culture,  ║
║              General Knowledge                    ║
║  Play to Earn: Answer questions, earn credits!   ║
╚═══════════════════════════════════════════════════╝
      `);
    });
  })
  .catch(err => {
    console.error('Database sync failed:', err);
    process.exit(1);
  });

module.exports = app;
