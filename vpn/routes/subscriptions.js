/**
 * Subscription Routes
 * Handle VPN plan subscriptions with credit system
 */

const express = require('express');
const router = express.Router();
const { VpnPlan, VpnSubscription, VpnClient } = require('../models');
const { isAuthenticated } = require('../../shared/middleware/auth');
const { spendCredits, getCredits, canAfford } = require('../../shared/utils/credits');

/**
 * GET /api/plans
 * List all active VPN plans
 */
router.get('/', async (req, res) => {
  try {
    const plans = await VpnPlan.findAll({
      where: { active: true },
      order: [['creditsMonthly', 'ASC']]
    });

    res.json({
      success: true,
      plans: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        nameHt: plan.nameHt,
        creditsMonthly: plan.creditsMonthly,
        deviceLimit: plan.deviceLimit,
        dataLimitGb: plan.dataLimitGb,
        features: plan.features,
        isUnlimited: plan.dataLimitGb === null
      }))
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

/**
 * POST /api/subscription/subscribe
 * Subscribe to a VPN plan (deduct credits)
 */
router.post('/subscribe', isAuthenticated, async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;

    // Get the plan
    const plan = await VpnPlan.findByPk(planId);
    if (!plan || !plan.active) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    // Check for existing active subscription
    const existingSubscription = await VpnSubscription.findOne({
      where: {
        userId,
        status: 'active'
      }
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active subscription. Please cancel it first.'
      });
    }

    // Check if user can afford (skip for free plan)
    if (plan.creditsMonthly > 0) {
      const affordable = await canAfford(userId, plan.creditsMonthly);
      if (!affordable) {
        const balance = await getCredits(userId);
        return res.status(400).json({
          success: false,
          error: `Insufficient credits. You have ${balance}, need ${plan.creditsMonthly}`
        });
      }

      // Deduct credits
      await spendCredits(userId, plan.creditsMonthly, `VPN subscription: ${plan.name}`);
    }

    // Calculate expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create subscription
    const subscription = await VpnSubscription.create({
      userId,
      planId: plan.id,
      status: 'active',
      creditsPaid: plan.creditsMonthly,
      startedAt: new Date(),
      expiresAt,
      autoRenew: true
    });

    res.json({
      success: true,
      message: 'Subscription created successfully',
      subscription: {
        id: subscription.id,
        plan: plan.name,
        status: subscription.status,
        expiresAt: subscription.expiresAt,
        deviceLimit: plan.deviceLimit
      }
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ success: false, error: 'Failed to create subscription' });
  }
});

/**
 * GET /api/subscription/current
 * Get user's current subscription
 */
router.get('/current', isAuthenticated, async (req, res) => {
  try {
    const subscription = await VpnSubscription.findOne({
      where: {
        userId: req.user.id,
        status: 'active'
      },
      include: [{
        model: VpnPlan,
        as: 'plan'
      }]
    });

    if (!subscription) {
      return res.json({
        success: true,
        subscription: null,
        message: 'No active subscription'
      });
    }

    // Get client count
    const clientCount = await VpnClient.count({
      where: { subscriptionId: subscription.id }
    });

    // Calculate days remaining
    const now = new Date();
    const daysRemaining = Math.ceil((subscription.expiresAt - now) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          nameHt: subscription.plan.nameHt,
          deviceLimit: subscription.plan.deviceLimit,
          dataLimitGb: subscription.plan.dataLimitGb,
          features: subscription.plan.features
        },
        status: subscription.status,
        startedAt: subscription.startedAt,
        expiresAt: subscription.expiresAt,
        daysRemaining,
        autoRenew: subscription.autoRenew,
        clientCount,
        canAddDevice: clientCount < subscription.plan.deviceLimit
      }
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch subscription' });
  }
});

/**
 * POST /api/subscription/renew
 * Renew subscription (deduct credits for another month)
 */
router.post('/renew', isAuthenticated, async (req, res) => {
  try {
    const subscription = await VpnSubscription.findOne({
      where: {
        userId: req.user.id,
        status: 'active'
      },
      include: [{ model: VpnPlan, as: 'plan' }]
    });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'No active subscription found' });
    }

    const plan = subscription.plan;

    // Check affordability
    if (plan.creditsMonthly > 0) {
      const affordable = await canAfford(req.user.id, plan.creditsMonthly);
      if (!affordable) {
        const balance = await getCredits(req.user.id);
        return res.status(400).json({
          success: false,
          error: `Insufficient credits. You have ${balance}, need ${plan.creditsMonthly}`
        });
      }

      await spendCredits(req.user.id, plan.creditsMonthly, `VPN renewal: ${plan.name}`);
    }

    // Extend expiration by 30 days
    const newExpiration = new Date(subscription.expiresAt);
    newExpiration.setDate(newExpiration.getDate() + 30);

    subscription.expiresAt = newExpiration;
    subscription.creditsPaid += plan.creditsMonthly;
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription renewed successfully',
      expiresAt: subscription.expiresAt
    });
  } catch (error) {
    console.error('Error renewing subscription:', error);
    res.status(500).json({ success: false, error: 'Failed to renew subscription' });
  }
});

/**
 * POST /api/subscription/cancel
 * Cancel auto-renewal (subscription stays active until expiration)
 */
router.post('/cancel', isAuthenticated, async (req, res) => {
  try {
    const subscription = await VpnSubscription.findOne({
      where: {
        userId: req.user.id,
        status: 'active'
      }
    });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'No active subscription found' });
    }

    subscription.autoRenew = false;
    await subscription.save();

    res.json({
      success: true,
      message: 'Auto-renewal cancelled. Your subscription will remain active until ' + subscription.expiresAt.toLocaleDateString()
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel subscription' });
  }
});

module.exports = router;
