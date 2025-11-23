/**
 * Seed Script for VPN Plans
 * Creates the initial VPN subscription plans
 *
 * Run with: npm run seed
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const sequelize = require('../../shared/config/database');
const { VpnPlan } = require('../models');

const plans = [
  {
    name: 'Free',
    nameHt: 'Gratis',
    creditsMonthly: 0,
    deviceLimit: 1,
    dataLimitGb: 1,
    features: ['Basic protection', 'Standard speed'],
    active: true
  },
  {
    name: 'Basic',
    nameHt: 'Debaz',
    creditsMonthly: 30,
    deviceLimit: 3,
    dataLimitGb: 10,
    features: ['Enhanced protection', 'Fast speed', 'Kill switch'],
    active: true
  },
  {
    name: 'Premium',
    nameHt: 'Premyòm',
    creditsMonthly: 50,
    deviceLimit: 5,
    dataLimitGb: null, // Unlimited
    features: ['Full protection', 'Faster speed', 'Kill switch', 'Priority support'],
    active: true
  },
  {
    name: 'Pro',
    nameHt: 'Pwofesyonèl',
    creditsMonthly: 100,
    deviceLimit: 10,
    dataLimitGb: null, // Unlimited
    features: ['Maximum protection', 'Fastest speed', 'Kill switch', 'Priority support', 'Dedicated IP'],
    active: true
  }
];

async function seed() {
  console.log('🌱 Seeding VPN plans...\n');

  try {
    // Sync database
    await sequelize.sync();
    console.log('✓ Database synced\n');

    // Create or update plans
    for (const planData of plans) {
      const [plan, created] = await VpnPlan.findOrCreate({
        where: { name: planData.name },
        defaults: planData
      });

      if (created) {
        console.log(`✓ Created plan: ${plan.name} (${plan.creditsMonthly} credits/mo)`);
      } else {
        // Update existing plan
        await plan.update(planData);
        console.log(`✓ Updated plan: ${plan.name} (${plan.creditsMonthly} credits/mo)`);
      }
    }

    console.log('\n✅ Seeding complete!');
    console.log('\nPlans created:');
    console.log('┌─────────────┬─────────────┬─────────┬──────────┐');
    console.log('│ Plan        │ Credits/Mo  │ Devices │ Data     │');
    console.log('├─────────────┼─────────────┼─────────┼──────────┤');

    for (const plan of plans) {
      const dataStr = plan.dataLimitGb ? `${plan.dataLimitGb} GB` : 'Unlimited';
      console.log(`│ ${plan.name.padEnd(11)} │ ${String(plan.creditsMonthly).padEnd(11)} │ ${String(plan.deviceLimit).padEnd(7)} │ ${dataStr.padEnd(8)} │`);
    }

    console.log('└─────────────┴─────────────┴─────────┴──────────┘');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  seed();
}

module.exports = seed;
