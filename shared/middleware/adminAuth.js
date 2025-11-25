/**
 * Admin Authentication Middleware
 * Handles admin session verification and permission checks
 */

const AdminUser = require('../models/AdminUser');

/**
 * Check if admin is authenticated via session
 */
const isAdminAuthenticated = (req, res, next) => {
  if (req.session && req.session.adminUser) {
    // Attach admin user to request
    req.adminUser = req.session.adminUser;
    return next();
  }

  // Check if API request or page request
  if (req.xhr || req.path.startsWith('/api/')) {
    return res.status(401).json({ success: false, error: 'Admin authentication required' });
  }

  // Redirect to admin login
  res.redirect('/admin/login.html');
};

/**
 * Check if admin has specific permission
 */
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.adminUser) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Super admin has all permissions
    if (req.adminUser.role === 'super_admin') {
      return next();
    }

    // Check specific permission
    if (req.adminUser.permissions && req.adminUser.permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({ success: false, error: 'Permission denied' });
  };
};

/**
 * Check if admin is super_admin
 */
const isSuperAdmin = (req, res, next) => {
  if (!req.adminUser) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  if (req.adminUser.role !== 'super_admin') {
    return res.status(403).json({ success: false, error: 'Super admin access required' });
  }

  next();
};

module.exports = {
  isAdminAuthenticated,
  hasPermission,
  isSuperAdmin
};
