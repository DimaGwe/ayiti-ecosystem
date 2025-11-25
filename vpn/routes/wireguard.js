/**
 * WireGuard Routes
 * Internal API for WireGuard operations
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../shared/middleware/auth');
const { isAdminAuthenticated } = require('../../shared/middleware/adminAuth');
const {
  generateKeyPair,
  getStatus,
  addPeer,
  removePeer,
  isWireGuardAvailable
} = require('../utils/wireguard');

/**
 * POST /api/wg/generate-keys
 * Generate a new WireGuard keypair
 */
router.post('/generate-keys', isAuthenticated, async (req, res) => {
  try {
    const keys = generateKeyPair();
    res.json({
      success: true,
      keys: {
        publicKey: keys.publicKey
        // Note: privateKey not returned for security in most cases
        // It's stored in the database and included in config downloads
      }
    });
  } catch (error) {
    console.error('Error generating keys:', error);
    res.status(500).json({ success: false, error: 'Failed to generate keys' });
  }
});

/**
 * GET /api/wg/status
 * Get WireGuard interface status (admin only)
 */
router.get('/status', isAdminAuthenticated, async (req, res) => {
  try {
    const status = getStatus();
    res.json({
      success: true,
      available: isWireGuardAvailable(),
      status
    });
  } catch (error) {
    console.error('Error getting WG status:', error);
    res.status(500).json({ success: false, error: 'Failed to get status' });
  }
});

/**
 * POST /api/wg/add-peer (admin only)
 * Manually add a peer to WireGuard
 */
router.post('/add-peer', isAdminAuthenticated, async (req, res) => {
  try {
    const { publicKey, ipAddress } = req.body;

    if (!publicKey || !ipAddress) {
      return res.status(400).json({
        success: false,
        error: 'publicKey and ipAddress are required'
      });
    }

    const result = addPeer(publicKey, ipAddress);
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error adding peer:', error);
    res.status(500).json({ success: false, error: 'Failed to add peer' });
  }
});

/**
 * POST /api/wg/remove-peer (admin only)
 * Manually remove a peer from WireGuard
 */
router.post('/remove-peer', isAdminAuthenticated, async (req, res) => {
  try {
    const { publicKey } = req.body;

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'publicKey is required'
      });
    }

    const result = removePeer(publicKey);
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error removing peer:', error);
    res.status(500).json({ success: false, error: 'Failed to remove peer' });
  }
});

/**
 * GET /api/wg/info
 * Get public server info for client configuration
 */
router.get('/info', async (req, res) => {
  res.json({
    success: true,
    server: {
      endpoint: process.env.WG_SERVER_ENDPOINT || 'vpn.ayiti.com',
      port: process.env.WG_SERVER_PORT || 51820,
      dns: ['1.1.1.1', '8.8.8.8']
    }
  });
});

module.exports = router;
