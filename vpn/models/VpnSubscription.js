/**
 * VPN Subscription Model
 * Tracks user subscriptions to VPN plans
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const VpnSubscription = sequelize.define('VpnSubscription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  planId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'plan_id'
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'cancelled'),
    defaultValue: 'active'
  },
  creditsPaid: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'credits_paid'
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'started_at'
  },
  expiresAt: {
    type: DataTypes.DATE,
    field: 'expires_at'
  },
  autoRenew: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'auto_renew'
  }
}, {
  tableName: 'vpn_subscriptions',
  timestamps: true
});

module.exports = VpnSubscription;
