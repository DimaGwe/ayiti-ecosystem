/**
 * CollectionPoint Model
 * Recycling collection points/drop-off locations
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const CollectionPoint = sequelize.define('CollectionPoint', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  accepts: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: ['plastic', 'paper', 'metal']
  },
  hours: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'collection_points',
  timestamps: true
});

module.exports = CollectionPoint;
