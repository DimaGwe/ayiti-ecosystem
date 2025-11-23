/**
 * Green Models Index
 * Export all models and set up associations
 */

const RecyclingLog = require('./RecyclingLog');
const CollectionPoint = require('./CollectionPoint');
const UserImpact = require('./UserImpact');
const User = require('../../shared/models/User');

// Set up associations
RecyclingLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(RecyclingLog, { foreignKey: 'userId', as: 'recyclingLogs' });

RecyclingLog.belongsTo(CollectionPoint, { foreignKey: 'collectionPointId', as: 'collectionPoint' });
CollectionPoint.hasMany(RecyclingLog, { foreignKey: 'collectionPointId', as: 'recyclingLogs' });

UserImpact.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(UserImpact, { foreignKey: 'userId', as: 'impact' });

module.exports = {
  RecyclingLog,
  CollectionPoint,
  UserImpact
};
