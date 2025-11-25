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
const passport = require('passport');
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
const messagesRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const communitiesRoutes = require('./routes/communities');
const postsRoutes = require('./routes/posts');
const aiTeachersRoutes = require('./routes/aiTeachers');

const app = express();

// Trust proxy for secure cookies behind Nginx
app.set('trust proxy', 1);

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
    'https://market.ayiti.com',
    'https://poukwapa.org',
    'https://academy.poukwapa.org',
    'https://trivia.poukwapa.org',
    'https://vpn.poukwapa.org'
  ],
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  name: 'academy.sid',  // Unique session name to avoid conflicts with other apps
  secret: process.env.SESSION_SECRET || 'ayiti-academy-secret-key-change-in-production',
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

// Authentication (Google OAuth) - use academy-specific callback
const academyCallbackURL = process.env.NODE_ENV === 'production'
  ? 'https://academy.poukwapa.org/auth/google/callback'
  : 'http://localhost:3002/auth/google/callback';
setupAuth(app, passport, { callbackURL: academyCallbackURL });

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
app.use('/api/messages', messagesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/communities', communitiesRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/ai-teachers', aiTeachersRoutes);

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
    console.log('=== OAuth Callback Success ===');
    console.log('User:', req.user ? req.user.email : 'null');
    console.log('Session ID:', req.sessionID);
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

// ==================== DEV LOGIN (Development Only) ====================
if (process.env.NODE_ENV !== 'production') {
  const User = require('../shared/models/User');

  // Dev login page
  app.get('/dev-login', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dev Login - Academy</title>
        <style>
          body { font-family: system-ui; max-width: 500px; margin: 50px auto; padding: 20px; }
          h1 { color: #1a73e8; }
          .form-group { margin: 15px 0; }
          label { display: block; margin-bottom: 5px; font-weight: bold; }
          input, select { width: 100%; padding: 10px; font-size: 16px; border: 1px solid #ddd; border-radius: 8px; }
          button { background: #1a73e8; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin-top: 10px; }
          button:hover { background: #1557b0; }
          .warning { background: #fff3cd; padding: 10px; border-radius: 8px; margin-bottom: 20px; }
          .users { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; }
          .user-btn { display: block; width: 100%; padding: 10px; margin: 5px 0; background: white; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; text-align: left; }
          .user-btn:hover { background: #e3f2fd; }
          .role { font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Dev Login</h1>
        <div class="warning">This is for development testing only!</div>

        <form action="/dev-login" method="POST">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" name="email" placeholder="Enter user email" required>
          </div>
          <button type="submit">Login</button>
        </form>

        <div class="users">
          <strong>Quick Login:</strong>
          <form action="/dev-login" method="POST">
            <input type="hidden" name="email" value="poukwapas@gmail.com">
            <button type="submit" class="user-btn">
              Dimitri Napoleon <span class="role">(admin)</span>
            </button>
          </form>
          <form action="/dev-login" method="POST">
            <input type="hidden" name="email" value="sikerodia@gmail.com">
            <button type="submit" class="user-btn">
              Dimitri Napoleon <span class="role">(student)</span>
            </button>
          </form>
          <form action="/dev-login" method="POST">
            <input type="hidden" name="email" value="farmer.jean@example.com">
            <button type="submit" class="user-btn">
              Jean Baptiste <span class="role">(student)</span>
            </button>
          </form>
        </div>

        <p style="margin-top: 20px;"><a href="/">← Back to Home</a></p>
      </body>
      </html>
    `);
  });

  // Dev login handler
  app.post('/dev-login', async (req, res) => {
    const { email } = req.body;

    try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.send(`
          <h1>User Not Found</h1>
          <p>No user with email: ${email}</p>
          <a href="/dev-login">Try Again</a>
        `);
      }

      // Log in the user
      req.login(user, (err) => {
        if (err) {
          console.error('Dev login error:', err);
          return res.send('Login failed');
        }
        console.log(`Dev login: ${user.email} (${user.role})`);
        res.redirect('/#dashboard');
      });
    } catch (error) {
      console.error('Dev login error:', error);
      res.status(500).send('Login failed');
    }
  });

  console.log('Dev login enabled at /dev-login');
}

// Get current user
app.get('/api/user', (req, res) => {
  console.log('=== /api/user called ===');
  console.log('Session ID:', req.sessionID);
  console.log('Session passport:', req.session?.passport);
  console.log('isAuthenticated:', req.isAuthenticated ? req.isAuthenticated() : 'N/A');
  console.log('User:', req.user ? req.user.email : 'null');

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

// ==================== TEACHER INVITE ACCEPTANCE ====================

// Store for teacher invites (shared with admin routes - in production use Redis/DB)
const teacherInvites = new Map();
app.locals.teacherInvites = teacherInvites;

// Accept teacher invite (requires authentication)
app.get('/teacher/accept-invite/:token', isAuthenticated, async (req, res) => {
  const { token } = req.params;
  const { User } = require('./models');

  // Check if invite exists and is valid
  const invite = teacherInvites.get(token);

  if (!invite) {
    return res.redirect('/?error=invalid_invite');
  }

  // Check expiration
  if (new Date() > new Date(invite.expiresAt)) {
    teacherInvites.delete(token);
    return res.redirect('/?error=invite_expired');
  }

  try {
    // Promote user to instructor
    const user = await User.findByPk(req.user.id);
    if (user) {
      user.role = 'instructor';
      await user.save();

      // Remove used invite
      teacherInvites.delete(token);

      console.log(`User ${user.email} promoted to instructor via invite`);
      res.redirect('/dashboard?message=welcome_instructor');
    } else {
      res.redirect('/?error=user_not_found');
    }
  } catch (error) {
    console.error('Accept invite error:', error);
    res.redirect('/?error=invite_failed');
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
