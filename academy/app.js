/**
 * Haiti Skills Academy - Main Application
 * academy.ayiti.com
 *
 * A Skool-style educational platform for Haiti
 * - 5 Courses: Agriculture, Mechanic, Fishing, Boat Building, Recycling
 * - 9-Stage Job Pipeline
 * - Point/Credit Economy
 * - Job Matching with Ayiti Companies
 */

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { setupAuth, isAuthenticated } = require('../shared/middleware/auth');
const { sequelize } = require('./models');

// Import routes
const coursesRoutes = require('./routes/courses');
const enrollmentsRoutes = require('./routes/enrollments');
const certificationsRoutes = require('./routes/certifications');
const jobsRoutes = require('./routes/jobs');
const companiesRoutes = require('./routes/companies');
const pipelineRoutes = require('./routes/pipeline');

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
    'https://solar.ayiti.com',
    'https://academy.ayiti.com',
    'https://market.ayiti.com'
  ],
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'ayiti-academy-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    domain: process.env.NODE_ENV === 'production' ? '.ayiti.com' : undefined  // Shared across subdomains
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

app.use('/api/courses', coursesRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/certifications', certificationsRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/pipeline', pipelineRoutes);

// ==================== AUTH ROUTES ====================

const passport = require('passport');

// Google OAuth login
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google OAuth callback
app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login?error=auth_failed'
  }),
  (req, res) => {
    // Successful authentication
    res.redirect('/dashboard');
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
        role: req.user.role,
        pipelineStage: req.user.pipelineStage
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
    service: 'Haiti Skills Academy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ==================== SPA FALLBACK ====================

// Serve index.html for all non-API routes (SPA)
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

const PORT = process.env.ACADEMY_PORT || 3002;

// Sync database and start server
sequelize.sync({ alter: process.env.NODE_ENV === 'development' })
  .then(() => {
    console.log('Database synced successfully');
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════╗
║     Haiti Skills Academy - Server Started         ║
╠═══════════════════════════════════════════════════╣
║  Port: ${PORT}                                       ║
║  URL: http://localhost:${PORT}                       ║
║  Env: ${process.env.NODE_ENV || 'development'}                            ║
╠═══════════════════════════════════════════════════╣
║  Courses: Agriculture, Mechanic, Fishing,         ║
║           Boat Building, Recycling                ║
║  Pipeline: 9 stages from Enrollment to Follow-up  ║
╚═══════════════════════════════════════════════════╝
      `);
    });
  })
  .catch(err => {
    console.error('Database sync failed:', err);
    process.exit(1);
  });

module.exports = app;
