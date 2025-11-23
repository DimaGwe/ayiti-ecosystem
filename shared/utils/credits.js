/**
 * Credit System Utilities
 * Shared point economy across Ayiti Ecosystem
 *
 * Based on haiti_skills_academy.json point_economy
 */

const User = require('../models/User');

// Credit values from ecosystem design
const CREDIT_VALUES = {
  // ===== EARNING =====
  // Academy - Learning
  COMPLETE_LESSON: 10,
  PASS_QUIZ: 25,
  COMPLETE_MODULE: 100,
  HELP_PEER: 15,
  CREATE_CONTENT: 50,

  // Academy - Certification
  PASS_CERTIFICATION: 500,
  GET_HIRED: 1000,
  REFER_STUDENT: 200,

  // Solar Project
  SOLAR_GENERATION: 1,    // per kWh generated
  DAILY_LOGIN: 5,
  COMPLETE_PROFILE: 50,

  // Engagement
  WRITE_REVIEW: 20,
  SHARE_ACHIEVEMENT: 10,

  // ===== SPENDING =====
  UNLOCK_ADVANCED_COURSE: 300,
  MENTOR_SESSION: 100,
  PRIORITY_JOB_MATCHING: 200,
  CERTIFICATE_PRINT: 50,
  MARKETPLACE_DISCOUNT: 100  // 10% off
};

/**
 * Add credits to user account
 * @param {number} userId - User ID
 * @param {number} amount - Credits to add
 * @param {string} reason - Reason for credits
 * @param {object} metadata - Additional info
 * @returns {number} New credit balance
 */
const addCredits = async (userId, amount, reason, metadata = {}) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const previousBalance = user.credits;
  user.credits += amount;
  await user.save();

  // Log transaction (could be stored in CreditTransaction table)
  console.log(`[Credits] +${amount} to user ${userId} | ${reason} | Balance: ${previousBalance} -> ${user.credits}`);

  return user.credits;
};

/**
 * Spend credits from user account
 * @param {number} userId - User ID
 * @param {number} amount - Credits to spend
 * @param {string} reason - Reason for spending
 * @param {object} metadata - Additional info
 * @returns {number} New credit balance
 */
const spendCredits = async (userId, amount, reason, metadata = {}) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }
  if (user.credits < amount) {
    throw new Error(`Insufficient credits. Have: ${user.credits}, Need: ${amount}`);
  }

  const previousBalance = user.credits;
  user.credits -= amount;
  await user.save();

  console.log(`[Credits] -${amount} from user ${userId} | ${reason} | Balance: ${previousBalance} -> ${user.credits}`);

  return user.credits;
};

/**
 * Get user's credit balance
 * @param {number} userId - User ID
 * @returns {number} Credit balance
 */
const getCredits = async (userId) => {
  const user = await User.findByPk(userId);
  return user?.credits || 0;
};

/**
 * Check if user can afford a purchase
 * @param {number} userId - User ID
 * @param {number} amount - Amount to check
 * @returns {boolean} Can afford
 */
const canAfford = async (userId, amount) => {
  const balance = await getCredits(userId);
  return balance >= amount;
};

/**
 * Transfer credits between users
 * @param {number} fromUserId - Sender user ID
 * @param {number} toUserId - Receiver user ID
 * @param {number} amount - Amount to transfer
 * @param {string} reason - Reason for transfer
 */
const transferCredits = async (fromUserId, toUserId, amount, reason) => {
  await spendCredits(fromUserId, amount, `Transfer to user ${toUserId}: ${reason}`);
  await addCredits(toUserId, amount, `Transfer from user ${fromUserId}: ${reason}`);
};

module.exports = {
  CREDIT_VALUES,
  addCredits,
  spendCredits,
  getCredits,
  canAfford,
  transferCredits
};
