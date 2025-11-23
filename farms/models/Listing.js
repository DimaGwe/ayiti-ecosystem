/**
 * Listing Model
 * Farm products and produce listings
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const Listing = sequelize.define('FarmListing', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sellerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'seller_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [3, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('vegetables', 'fruits', 'grains', 'livestock', 'dairy', 'eggs', 'herbs', 'other'),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  unit: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'per unit'  // 'per kg', 'per dozen', 'per unit', etc.
  },
  quantityAvailable: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'quantity_available'
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  imageUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'image_url'
  },
  organic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'farm_listings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Listing;
