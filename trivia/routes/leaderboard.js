/**
 * Leaderboard Routes
 * API endpoints for leaderboard data
 */

const express = require('express');
const router = express.Router();
const { Leaderboard, User } = require('../models');

/**
 * GET /api/leaderboard
 * Get top 10 players
 */
router.get('/', async (req, res) => {
  try {
    const leaderboard = await Leaderboard.findAll({
      order: [['totalScore', 'DESC']],
      limit: 10,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }]
    });

    const rankings = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      name: entry.user?.name || 'Anonymous',
      avatar: entry.user?.avatar || null,
      totalScore: entry.totalScore,
      gamesPlayed: entry.gamesPlayed,
      bestScore: entry.bestScore,
      accuracy: entry.totalQuestions > 0
        ? Math.round((entry.totalCorrect / entry.totalQuestions) * 100)
        : 0
    }));

    res.json({
      success: true,
      leaderboard: rankings
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard'
    });
  }
});

/**
 * GET /api/leaderboard/user/:id
 * Get specific user's stats
 */
router.get('/user/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const entry = await Leaderboard.findOne({
      where: { userId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }]
    });

    if (!entry) {
      return res.json({
        success: true,
        stats: {
          userId,
          gamesPlayed: 0,
          totalScore: 0,
          bestScore: 0,
          accuracy: 0,
          rank: null
        }
      });
    }

    // Calculate rank
    const rank = await Leaderboard.count({
      where: {
        totalScore: { [require('sequelize').Op.gt]: entry.totalScore }
      }
    }) + 1;

    res.json({
      success: true,
      stats: {
        userId: entry.userId,
        name: entry.user?.name || 'Anonymous',
        avatar: entry.user?.avatar || null,
        totalScore: entry.totalScore,
        gamesPlayed: entry.gamesPlayed,
        bestScore: entry.bestScore,
        totalCorrect: entry.totalCorrect,
        totalQuestions: entry.totalQuestions,
        accuracy: entry.totalQuestions > 0
          ? Math.round((entry.totalCorrect / entry.totalQuestions) * 100)
          : 0,
        rank
      }
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user stats'
    });
  }
});

/**
 * GET /api/leaderboard/weekly
 * Get weekly top players (based on games this week)
 */
router.get('/weekly', async (req, res) => {
  try {
    // For now, return the same as regular leaderboard
    // Could be enhanced with GameSession date filtering
    const leaderboard = await Leaderboard.findAll({
      order: [['totalScore', 'DESC']],
      limit: 10,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }]
    });

    const rankings = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      name: entry.user?.name || 'Anonymous',
      avatar: entry.user?.avatar || null,
      totalScore: entry.totalScore,
      gamesPlayed: entry.gamesPlayed
    }));

    res.json({
      success: true,
      leaderboard: rankings,
      period: 'weekly'
    });
  } catch (error) {
    console.error('Error getting weekly leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get weekly leaderboard'
    });
  }
});

module.exports = router;
