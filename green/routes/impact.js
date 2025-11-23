/**
 * Impact Routes
 * Handle environmental impact tracking and statistics
 */

const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');
const { RecyclingLog, UserImpact } = require('../models');
const User = require('../../shared/models/User');

/**
 * GET /api/impact/user/:id
 * Get a user's environmental impact
 */
router.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get user impact record
    const impact = await UserImpact.findOne({
      where: { userId: id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }]
    });

    if (!impact) {
      // Return empty impact for users who haven't recycled yet
      return res.json({
        success: true,
        impact: {
          userId: parseInt(id),
          totalKg: 0,
          plasticKg: 0,
          paperKg: 0,
          metalKg: 0,
          glassKg: 0,
          organicKg: 0,
          electronicsKg: 0,
          co2SavedKg: 0,
          treesSaved: 0,
          recyclingCount: 0
        }
      });
    }

    // Get recycling count
    const recyclingCount = await RecyclingLog.count({
      where: { userId: id }
    });

    res.json({
      success: true,
      impact: {
        userId: impact.userId,
        user: impact.user ? {
          id: impact.user.id,
          name: impact.user.name,
          avatar: impact.user.avatar
        } : null,
        totalKg: parseFloat(impact.totalKg),
        plasticKg: parseFloat(impact.plasticKg),
        paperKg: parseFloat(impact.paperKg),
        metalKg: parseFloat(impact.metalKg),
        glassKg: parseFloat(impact.glassKg),
        organicKg: parseFloat(impact.organicKg),
        electronicsKg: parseFloat(impact.electronicsKg),
        co2SavedKg: parseFloat(impact.co2SavedKg),
        treesSaved: parseFloat(impact.treesSaved),
        recyclingCount
      }
    });
  } catch (error) {
    console.error('Error fetching user impact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user impact'
    });
  }
});

/**
 * GET /api/impact/me
 * Get current user's environmental impact
 */
router.get('/me', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Please login to view your impact'
    });
  }

  // Redirect to user/:id route
  req.params.id = req.user.id;
  return router.handle(req, res);
});

/**
 * GET /api/impact/community
 * Get total community environmental impact
 */
router.get('/community', async (req, res) => {
  try {
    // Aggregate all user impacts
    const totals = await UserImpact.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('total_kg')), 'totalKg'],
        [Sequelize.fn('SUM', Sequelize.col('plastic_kg')), 'plasticKg'],
        [Sequelize.fn('SUM', Sequelize.col('paper_kg')), 'paperKg'],
        [Sequelize.fn('SUM', Sequelize.col('metal_kg')), 'metalKg'],
        [Sequelize.fn('SUM', Sequelize.col('glass_kg')), 'glassKg'],
        [Sequelize.fn('SUM', Sequelize.col('organic_kg')), 'organicKg'],
        [Sequelize.fn('SUM', Sequelize.col('electronics_kg')), 'electronicsKg'],
        [Sequelize.fn('SUM', Sequelize.col('co2_saved_kg')), 'co2SavedKg'],
        [Sequelize.fn('SUM', Sequelize.col('trees_saved')), 'treesSaved']
      ],
      raw: true
    });

    // Get total recycling logs and unique recyclers
    const stats = await RecyclingLog.findOne({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalLogs'],
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('user_id'))), 'uniqueRecyclers']
      ],
      raw: true
    });

    res.json({
      success: true,
      community: {
        totalKg: parseFloat(totals?.totalKg || 0),
        plasticKg: parseFloat(totals?.plasticKg || 0),
        paperKg: parseFloat(totals?.paperKg || 0),
        metalKg: parseFloat(totals?.metalKg || 0),
        glassKg: parseFloat(totals?.glassKg || 0),
        organicKg: parseFloat(totals?.organicKg || 0),
        electronicsKg: parseFloat(totals?.electronicsKg || 0),
        co2SavedKg: parseFloat(totals?.co2SavedKg || 0),
        treesSaved: parseFloat(totals?.treesSaved || 0),
        totalRecyclingLogs: parseInt(stats?.totalLogs || 0),
        uniqueRecyclers: parseInt(stats?.uniqueRecyclers || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching community impact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch community impact'
    });
  }
});

/**
 * GET /api/impact/leaderboard
 * Get top recyclers leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const leaders = await UserImpact.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }],
      order: [['total_kg', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      leaderboard: leaders.map((impact, index) => ({
        rank: index + 1,
        user: impact.user ? {
          id: impact.user.id,
          name: impact.user.name,
          avatar: impact.user.avatar
        } : null,
        totalKg: parseFloat(impact.totalKg),
        co2SavedKg: parseFloat(impact.co2SavedKg),
        treesSaved: parseFloat(impact.treesSaved)
      }))
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

module.exports = router;
