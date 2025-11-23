/**
 * RecyclingLog Model
 * Tracks user recycling activities
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const RecyclingLog = sequelize.define('RecyclingLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  wasteType: {
    type: DataTypes.ENUM('plastic', 'paper', 'metal', 'glass', 'organic', 'electronics'),
    allowNull: false,
    field: 'waste_type'
  },
  weightKg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'weight_kg',
    validate: {
      min: 0.01
    }
  },
  creditsEarned: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'credits_earned'
  },
  collectionPointId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'collection_point_id'
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'recycling_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = RecyclingLog;
