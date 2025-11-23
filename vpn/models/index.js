/**
 * VPN Models Index
 * Export all models with associations
 */

const VpnPlan = require('./VpnPlan');
const VpnSubscription = require('./VpnSubscription');
const VpnClient = require('./VpnClient');
const VpnUsageLog = require('./VpnUsageLog');
const User = require('../../shared/models/User');

// ==================== ASSOCIATIONS ====================

// User -> VpnSubscription (One to Many)
User.hasMany(VpnSubscription, { foreignKey: 'userId', as: 'vpnSubscriptions' });
VpnSubscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// VpnPlan -> VpnSubscription (One to Many)
VpnPlan.hasMany(VpnSubscription, { foreignKey: 'planId', as: 'subscriptions' });
VpnSubscription.belongsTo(VpnPlan, { foreignKey: 'planId', as: 'plan' });

// User -> VpnClient (One to Many)
User.hasMany(VpnClient, { foreignKey: 'userId', as: 'vpnClients' });
VpnClient.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// VpnSubscription -> VpnClient (One to Many)
VpnSubscription.hasMany(VpnClient, { foreignKey: 'subscriptionId', as: 'clients' });
VpnClient.belongsTo(VpnSubscription, { foreignKey: 'subscriptionId', as: 'subscription' });

// VpnClient -> VpnUsageLog (One to Many)
VpnClient.hasMany(VpnUsageLog, { foreignKey: 'clientId', as: 'usageLogs' });
VpnUsageLog.belongsTo(VpnClient, { foreignKey: 'clientId', as: 'client' });

module.exports = {
  VpnPlan,
  VpnSubscription,
  VpnClient,
  VpnUsageLog,
  User
};
