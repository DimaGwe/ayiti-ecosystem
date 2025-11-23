/**
 * UserImpact Model
 * Tracks user's cumulative environmental impact
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const UserImpact = sequelize.define('UserImpact', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  totalKg: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'total_kg'
  },
  plasticKg: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'plastic_kg'
  },
  paperKg: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'paper_kg'
  },
  metalKg: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'metal_kg'
  },
  glassKg: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'glass_kg'
  },
  organicKg: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'organic_kg'
  },
  electronicsKg: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'electronics_kg'
  },
  co2SavedKg: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'co2_saved_kg'
  },
  treesSaved: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'trees_saved'
  }
}, {
  tableName: 'user_impact',
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: false
});

module.exports = UserImpact;
