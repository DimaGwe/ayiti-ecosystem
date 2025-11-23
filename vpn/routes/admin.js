/**
 * Admin Routes
 * Server management and analytics for admins
 */

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { VpnClient, VpnSubscription, VpnPlan, VpnUsageLog, User } = require('../models');
const { isAuthenticated, isAdmin } = require('../../shared/middleware/auth');
const { getStatus, formatBytes } = require('../utils/wireguard');

// All admin routes require authentication and admin role
router.use(isAuthenticated);
router.use(isAdmin);

/**
 * GET /api/admin/stats
 * Get server statistics overview
 */
router.get('/stats', async (req, res) => {
  try {
    // Total counts
    const totalClients = await VpnClient.count();
    const activeClients = await VpnClient.count({ where: { status: 'enabled' } });
    const totalSubscriptions = await VpnSubscription.count({ where: { status: 'active' } });

    // Subscriptions by plan
    const subscriptionsByPlan = await VpnSubscription.findAll({
      where: { status: 'active' },
      include: [{ model: VpnPlan, as: 'plan' }],
      attributes: ['planId'],
      group: ['planId']
    });

    // Total bandwidth (sum from all clients)
    const bandwidthStats = await VpnClient.findOne({
      attributes: [
        [VpnClient.sequelize.fn('SUM', VpnClient.sequelize.col('bytes_received')), 'totalReceived'],
        [VpnClient.sequelize.fn('SUM', VpnClient.sequelize.col('bytes_sent')), 'totalSent']
      ],
      raw: true
    });

    // Recent activity (clients with recent handshake)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentlyActive = await VpnClient.count({
      where: {
        lastHandshake: { [Op.gte]: oneDayAgo }
      }
    });

    // WireGuard server status
    const wgStatus = getStatus();

    res.json({
      success: true,
      stats: {
        clients: {
          total: totalClients,
          active: activeClients,
          recentlyActive
        },
        subscriptions: {
          total: totalSubscriptions,
          byPlan: subscriptionsByPlan
        },
        bandwidth: {
          totalReceived: parseInt(bandwidthStats?.totalReceived) || 0,
          totalSent: parseInt(bandwidthStats?.totalSent) || 0,
          totalReceivedFormatted: formatBytes(parseInt(bandwidthStats?.totalReceived) || 0),
          totalSentFormatted: formatBytes(parseInt(bandwidthStats?.totalSent) || 0)
        },
        wireguard: wgStatus
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/admin/clients
 * List all VPN clients with user info
 */
router.get('/clients', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }

    const clients = await VpnClient.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        {
          model: VpnSubscription,
          as: 'subscription',
          include: [{ model: VpnPlan, as: 'plan' }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      clients: clients.rows.map(client => ({
        id: client.id,
        name: client.name,
        status: client.status,
        ipAddress: client.ipAddress,
        bytesReceived: client.bytesReceived,
        bytesSent: client.bytesSent,
        bytesReceivedFormatted: formatBytes(client.bytesReceived),
        bytesSentFormatted: formatBytes(client.bytesSent),
        lastHandshake: client.lastHandshake,
        createdAt: client.createdAt,
        user: client.user,
        plan: client.subscription?.plan?.name
      })),
      pagination: {
        total: clients.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(clients.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch clients' });
  }
});

/**
 * PUT /api/admin/clients/:id
 * Modify any client (admin override)
 */
router.put('/clients/:id', async (req, res) => {
  try {
    const { status, name } = req.body;

    const client = await VpnClient.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    if (status && ['enabled', 'paused', 'disabled'].includes(status)) {
      client.status = status;
    }
    if (name) {
      client.name = name;
    }

    await client.save();

    res.json({
      success: true,
      message: 'Client updated',
      client: {
        id: client.id,
        name: client.name,
        status: client.status
      }
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ success: false, error: 'Failed to update client' });
  }
});

/**
 * GET /api/admin/subscriptions
 * List all subscriptions
 */
router.get('/subscriptions', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }

    const subscriptions = await VpnSubscription.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: VpnPlan, as: 'plan' }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      subscriptions: subscriptions.rows.map(sub => ({
        id: sub.id,
        user: sub.user,
        plan: sub.plan?.name,
        status: sub.status,
        creditsPaid: sub.creditsPaid,
        startedAt: sub.startedAt,
        expiresAt: sub.expiresAt,
        autoRenew: sub.autoRenew
      })),
      pagination: {
        total: subscriptions.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(subscriptions.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch subscriptions' });
  }
});

/**
 * GET /api/admin/usage
 * Usage analytics
 */
router.get('/usage', async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get usage logs in period
    const logs = await VpnUsageLog.findAll({
      where: {
        sessionStart: { [Op.gte]: startDate }
      },
      include: [{
        model: VpnClient,
        as: 'client',
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
      }],
      order: [['sessionStart', 'DESC']]
    });

    // Aggregate stats
    const totalBytesReceived = logs.reduce((sum, log) => sum + (parseInt(log.bytesReceived) || 0), 0);
    const totalBytesSent = logs.reduce((sum, log) => sum + (parseInt(log.bytesSent) || 0), 0);
    const totalSessions = logs.length;

    // Top users by bandwidth
    const userBandwidth = {};
    logs.forEach(log => {
      const userId = log.client?.user?.id;
      if (userId) {
        if (!userBandwidth[userId]) {
          userBandwidth[userId] = {
            user: log.client.user,
            bytesReceived: 0,
            bytesSent: 0,
            sessions: 0
          };
        }
        userBandwidth[userId].bytesReceived += parseInt(log.bytesReceived) || 0;
        userBandwidth[userId].bytesSent += parseInt(log.bytesSent) || 0;
        userBandwidth[userId].sessions++;
      }
    });

    const topUsers = Object.values(userBandwidth)
      .sort((a, b) => (b.bytesReceived + b.bytesSent) - (a.bytesReceived + a.bytesSent))
      .slice(0, 10)
      .map(u => ({
        ...u,
        bytesReceivedFormatted: formatBytes(u.bytesReceived),
        bytesSentFormatted: formatBytes(u.bytesSent)
      }));

    res.json({
      success: true,
      period,
      stats: {
        totalBytesReceived,
        totalBytesSent,
        totalBytesReceivedFormatted: formatBytes(totalBytesReceived),
        totalBytesSentFormatted: formatBytes(totalBytesSent),
        totalSessions
      },
      topUsers
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch usage' });
  }
});

/**
 * GET /api/admin/plans
 * List all plans (including inactive)
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = await VpnPlan.findAll({
      order: [['creditsMonthly', 'ASC']]
    });

    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

/**
 * PUT /api/admin/plans/:id
 * Update a plan
 */
router.put('/plans/:id', async (req, res) => {
  try {
    const { name, nameHt, creditsMonthly, deviceLimit, dataLimitGb, features, active } = req.body;

    const plan = await VpnPlan.findByPk(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    if (name !== undefined) plan.name = name;
    if (nameHt !== undefined) plan.nameHt = nameHt;
    if (creditsMonthly !== undefined) plan.creditsMonthly = creditsMonthly;
    if (deviceLimit !== undefined) plan.deviceLimit = deviceLimit;
    if (dataLimitGb !== undefined) plan.dataLimitGb = dataLimitGb;
    if (features !== undefined) plan.features = features;
    if (active !== undefined) plan.active = active;

    await plan.save();

    res.json({
      success: true,
      message: 'Plan updated',
      plan
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ success: false, error: 'Failed to update plan' });
  }
});

module.exports = router;
