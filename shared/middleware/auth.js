/**
 * Shared Authentication Middleware
 * Google OAuth shared across subdomains
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const setupAuth = (app) => {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ where: { googleId: profile.id } });

      if (!user) {
        // Create new user
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          avatar: profile.photos[0]?.value,
          credits: 100  // Starting bonus credits
        });
        console.log(`New user created: ${user.email}`);
      } else {
        // Update last login
        user.lastLoginAt = new Date();
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      console.error('Auth error:', error);
      return done(error, null);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findByPk(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());
};

// Middleware: Check if authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Middleware: Check if instructor
const isInstructor = (req, res, next) => {
  if (req.user?.role === 'instructor' || req.user?.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Instructor access required' });
};

// Middleware: Check if employer
const isEmployer = (req, res, next) => {
  if (req.user?.role === 'employer' || req.user?.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Employer access required' });
};

// Middleware: Check if admin
const isAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Admin access required' });
};

module.exports = {
  setupAuth,
  isAuthenticated,
  isInstructor,
  isEmployer,
  isAdmin
};
