/**
 * Order Model
 * Farm product orders
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const Order = sequelize.define('FarmOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  listingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'listing_id',
    references: {
      model: 'farm_listings',
      key: 'id'
    }
  },
  buyerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'buyer_id',
    references: {
      model: 'users',
      key: 'id'
    }
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
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_price'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'ready', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  deliveryMethod: {
    type: DataTypes.ENUM('pickup', 'delivery'),
    defaultValue: 'pickup',
    field: 'delivery_method'
  },
  deliveryAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'delivery_address'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'farm_orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Order;
