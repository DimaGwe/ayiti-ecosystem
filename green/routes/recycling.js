/**
 * Recycling Routes
 * Handle recycling activity logging and history
 */

const express = require('express');
const router = express.Router();
const { RecyclingLog, CollectionPoint, UserImpact } = require('../models');
const { addCredits } = require('../../shared/utils/credits');

// Credit rates per kg by waste type
const CREDIT_RATES = {
  plastic: 5,
  paper: 3,
  metal: 8,
  glass: 4,
  organic: 2,
  electronics: 10
};

// CO2 saved per kg by waste type (approximate values)
const CO2_RATES = {
  plastic: 2.5,    // 1kg plastic = 2.5kg CO2 saved
  paper: 1.0,      // 1kg paper = 1.0kg CO2 saved
  metal: 4.0,      // 1kg metal = 4.0kg CO2 saved
  glass: 0.3,      // 1kg glass = 0.3kg CO2 saved
  organic: 0.5,    // 1kg organic = 0.5kg CO2 saved
  electronics: 5.0 // 1kg electronics = 5.0kg CO2 saved
};

// Trees saved per kg (paper only)
const TREES_PER_KG_PAPER = 0.017; // ~60kg paper = 1 tree

/**
 * POST /api/recycling/log
 * Log a recycling activity
 */
router.post('/log', async (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Please login to log recycling'
      });
    }

    const { wasteType, weightKg, collectionPointId } = req.body;

    // Validate input
    if (!wasteType || !weightKg) {
      return res.status(400).json({
        success: false,
        error: 'Waste type and weight are required'
      });
    }

    if (!CREDIT_RATES[wasteType]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid waste type'
      });
    }

    const weight = parseFloat(weightKg);
    if (isNaN(weight) || weight <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Weight must be a positive number'
      });
    }

    // Calculate credits earned
    const creditsEarned = Math.floor(weight * CREDIT_RATES[wasteType]);

    // Create recycling log
    const log = await RecyclingLog.create({
      userId: req.user.id,
      wasteType,
      weightKg: weight,
      creditsEarned,
      collectionPointId: collectionPointId || null
    });

    // Add credits to user
    const newBalance = await addCredits(
      req.user.id,
      creditsEarned,
      `Recycling ${weight}kg of ${wasteType}`,
      { logId: log.id }
    );

    // Update user impact stats
    await updateUserImpact(req.user.id, wasteType, weight);

    res.json({
      success: true,
      log: {
        id: log.id,
        wasteType: log.wasteType,
        weightKg: log.weightKg,
        creditsEarned: log.creditsEarned,
        createdAt: log.created_at
      },
      creditsEarned,
      newBalance,
      impact: {
        co2Saved: (weight * CO2_RATES[wasteType]).toFixed(2),
        treesSaved: wasteType === 'paper' ? (weight * TREES_PER_KG_PAPER).toFixed(3) : 0
      }
    });
  } catch (error) {
    console.error('Error logging recycling:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log recycling activity'
    });
  }
});

/**
 * GET /api/recycling/history
 * Get user's recycling history
 */
router.get('/history', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Please login to view history'
      });
    }

    const { limit = 20, offset = 0 } = req.query;

    const logs = await RecyclingLog.findAndCountAll({
      where: { userId: req.user.id },
      include: [{
        model: CollectionPoint,
        as: 'collectionPoint',
        attributes: ['id', 'name', 'city']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      history: logs.rows.map(log => ({
        id: log.id,
        wasteType: log.wasteType,
        weightKg: parseFloat(log.weightKg),
        creditsEarned: log.creditsEarned,
        verified: log.verified,
        collectionPoint: log.collectionPoint ? {
          id: log.collectionPoint.id,
          name: log.collectionPoint.name,
          city: log.collectionPoint.city
        } : null,
        createdAt: log.created_at
      })),
      total: logs.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recycling history'
    });
  }
});

/**
 * GET /api/recycling/rates
 * Get credit rates per kg by waste type
 */
router.get('/rates', (req, res) => {
  res.json({
    success: true,
    rates: CREDIT_RATES,
    co2Rates: CO2_RATES,
    treeRate: TREES_PER_KG_PAPER
  });
});

/**
 * Helper: Update user's environmental impact stats
 */
async function updateUserImpact(userId, wasteType, weightKg) {
  try {
    // Find or create user impact record
    let [impact, created] = await UserImpact.findOrCreate({
      where: { userId },
      defaults: { userId }
    });

    // Update totals
    const weight = parseFloat(weightKg);
    impact.totalKg = parseFloat(impact.totalKg) + weight;

    // Update specific waste type
    const typeField = `${wasteType}Kg`;
    if (impact[typeField] !== undefined) {
      impact[typeField] = parseFloat(impact[typeField]) + weight;
    }

    // Calculate CO2 saved
    const co2Saved = weight * CO2_RATES[wasteType];
    impact.co2SavedKg = parseFloat(impact.co2SavedKg) + co2Saved;

    // Calculate trees saved (paper only)
    if (wasteType === 'paper') {
      impact.treesSaved = parseFloat(impact.treesSaved) + (weight * TREES_PER_KG_PAPER);
    }

    await impact.save();
    return impact;
  } catch (error) {
    console.error('Error updating user impact:', error);
    throw error;
  }
}

module.exports = router;
