/**
 * VPN Client Routes
 * Manage VPN clients/devices for users
 */

const express = require('express');
const router = express.Router();
const { VpnClient, VpnSubscription, VpnPlan, VpnUsageLog } = require('../models');
const { isAuthenticated } = require('../../shared/middleware/auth');
const {
  generateKeyPair,
  allocateIpAddress,
  generateConfig,
  addPeer,
  removePeer,
  getPeerStats,
  formatBytes
} = require('../utils/wireguard');

/**
 * GET /api/clients
 * Get user's VPN clients/devices
 */
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const clients = await VpnClient.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    // Get stats for each client
    const clientsWithStats = clients.map(client => {
      const stats = getPeerStats(client.publicKey);
      return {
        id: client.id,
        name: client.name,
        status: client.status,
        ipAddress: client.ipAddress,
        createdAt: client.createdAt,
        lastHandshake: stats.lastHandshake || client.lastHandshake,
        bytesReceived: stats.bytesReceived || client.bytesReceived,
        bytesSent: stats.bytesSent || client.bytesSent,
        bytesReceivedFormatted: formatBytes(stats.bytesReceived || client.bytesReceived),
        bytesSentFormatted: formatBytes(stats.bytesSent || client.bytesSent)
      };
    });

    res.json({
      success: true,
      clients: clientsWithStats
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch clients' });
  }
});

/**
 * POST /api/clients
 * Create a new VPN client (generate keys)
 */
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Device name is required' });
    }

    // Check for active subscription
    const subscription = await VpnSubscription.findOne({
      where: {
        userId: req.user.id,
        status: 'active'
      },
      include: [{ model: VpnPlan, as: 'plan' }]
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        error: 'You need an active subscription to add devices'
      });
    }

    // Check device limit
    const clientCount = await VpnClient.count({
      where: { subscriptionId: subscription.id }
    });

    if (clientCount >= subscription.plan.deviceLimit) {
      return res.status(400).json({
        success: false,
        error: `Device limit reached (${subscription.plan.deviceLimit}). Upgrade your plan for more devices.`
      });
    }

    // Generate WireGuard keypair
    const { privateKey, publicKey } = generateKeyPair();

    // Allocate IP address
    const ipAddress = await allocateIpAddress(VpnClient);

    // Create client record
    const client = await VpnClient.create({
      userId: req.user.id,
      subscriptionId: subscription.id,
      name: name.trim(),
      privateKey,
      publicKey,
      ipAddress,
      status: 'enabled'
    });

    // Add peer to WireGuard server
    try {
      addPeer(publicKey, ipAddress);
    } catch (wgError) {
      console.error('WireGuard peer add failed:', wgError);
      // Continue - config generation still works
    }

    res.json({
      success: true,
      message: 'Device added successfully',
      client: {
        id: client.id,
        name: client.name,
        status: client.status,
        ipAddress: client.ipAddress,
        createdAt: client.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ success: false, error: 'Failed to create client' });
  }
});

/**
 * GET /api/clients/:id/config
 * Download WireGuard configuration file
 */
router.get('/:id/config', isAuthenticated, async (req, res) => {
  try {
    const client = await VpnClient.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    if (client.status === 'disabled') {
      return res.status(403).json({
        success: false,
        error: 'This device is disabled. Enable it to download configuration.'
      });
    }

    // Generate config
    const config = generateConfig(client);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${client.name.replace(/[^a-zA-Z0-9]/g, '_')}_wg.conf"`);
    res.send(config);
  } catch (error) {
    console.error('Error generating config:', error);
    res.status(500).json({ success: false, error: 'Failed to generate configuration' });
  }
});

/**
 * GET /api/clients/:id/qrcode
 * Get config as QR code data (for mobile apps)
 */
router.get('/:id/qrcode', isAuthenticated, async (req, res) => {
  try {
    const client = await VpnClient.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const config = generateConfig(client);

    // Return config as text that can be converted to QR
    res.json({
      success: true,
      config,
      name: client.name
    });
  } catch (error) {
    console.error('Error generating QR data:', error);
    res.status(500).json({ success: false, error: 'Failed to generate QR data' });
  }
});

/**
 * PUT /api/clients/:id/status
 * Enable/pause/disable a client
 */
router.put('/:id/status', isAuthenticated, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['enabled', 'paused', 'disabled'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const client = await VpnClient.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const oldStatus = client.status;
    client.status = status;
    await client.save();

    // Update WireGuard peer if status changed to/from disabled
    if (oldStatus !== 'disabled' && status === 'disabled') {
      try {
        removePeer(client.publicKey);
      } catch (wgError) {
        console.error('WireGuard peer remove failed:', wgError);
      }
    } else if (oldStatus === 'disabled' && status !== 'disabled') {
      try {
        addPeer(client.publicKey, client.ipAddress);
      } catch (wgError) {
        console.error('WireGuard peer add failed:', wgError);
      }
    }

    res.json({
      success: true,
      message: `Device ${status}`,
      client: {
        id: client.id,
        name: client.name,
        status: client.status
      }
    });
  } catch (error) {
    console.error('Error updating client status:', error);
    res.status(500).json({ success: false, error: 'Failed to update client status' });
  }
});

/**
 * DELETE /api/clients/:id
 * Remove a client/device
 */
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const client = await VpnClient.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    // Remove from WireGuard
    try {
      removePeer(client.publicKey);
    } catch (wgError) {
      console.error('WireGuard peer remove failed:', wgError);
    }

    // Delete usage logs
    await VpnUsageLog.destroy({
      where: { clientId: client.id }
    });

    // Delete client
    await client.destroy();

    res.json({
      success: true,
      message: 'Device removed successfully'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ success: false, error: 'Failed to delete client' });
  }
});

/**
 * GET /api/clients/:id/usage
 * Get usage statistics for a client
 */
router.get('/:id/usage', isAuthenticated, async (req, res) => {
  try {
    const client = await VpnClient.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    // Get recent usage logs
    const logs = await VpnUsageLog.findAll({
      where: { clientId: client.id },
      order: [['sessionStart', 'DESC']],
      limit: 30
    });

    // Get current stats from WireGuard
    const stats = getPeerStats(client.publicKey);

    res.json({
      success: true,
      client: {
        id: client.id,
        name: client.name
      },
      currentStats: {
        bytesReceived: stats.bytesReceived || client.bytesReceived,
        bytesSent: stats.bytesSent || client.bytesSent,
        bytesReceivedFormatted: formatBytes(stats.bytesReceived || client.bytesReceived),
        bytesSentFormatted: formatBytes(stats.bytesSent || client.bytesSent),
        lastHandshake: stats.lastHandshake || client.lastHandshake
      },
      recentSessions: logs.map(log => ({
        sessionStart: log.sessionStart,
        sessionEnd: log.sessionEnd,
        bytesReceived: log.bytesReceived,
        bytesSent: log.bytesSent,
        duration: log.sessionEnd ?
          Math.round((new Date(log.sessionEnd) - new Date(log.sessionStart)) / 60000) :
          null
      }))
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch usage' });
  }
});

module.exports = router;
