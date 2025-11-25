/**
 * Admin Authentication Routes
 * Login, logout, and session management for admins
 */

const express = require('express');
const router = express.Router();
const AdminUser = require('../../shared/models/AdminUser');
const { isAdminAuthenticated } = require('../../shared/middleware/adminAuth');

/**
 * POST /api/admin-auth/login
 * Admin login with username/password
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Find admin by credentials
    const admin = await AdminUser.findByCredentials(username, password);

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Update last login
    admin.lastLoginAt = new Date();
    admin.lastLoginIp = req.ip || req.connection.remoteAddress;
    await admin.save();

    // Store in session
    req.session.adminUser = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions
    };

    res.json({
      success: true,
      message: 'Login successful',
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

/**
 * POST /api/admin-auth/logout
 * Admin logout
 */
router.post('/logout', (req, res) => {
  req.session.adminUser = null;
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/admin-auth/me
 * Get current admin user
 */
router.get('/me', isAdminAuthenticated, (req, res) => {
  res.json({
    success: true,
    admin: req.adminUser
  });
});

/**
 * GET /api/admin-auth/check
 * Check if admin is logged in (no redirect)
 */
router.get('/check', (req, res) => {
  if (req.session && req.session.adminUser) {
    res.json({
      success: true,
      authenticated: true,
      admin: req.session.adminUser
    });
  } else {
    res.json({
      success: true,
      authenticated: false
    });
  }
});

module.exports = router;
