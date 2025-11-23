/**
 * Category Model
 * Farm product categories
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const Category = sequelize.define('FarmCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  nameHt: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'name_ht'  // Haitian Creole name
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'farm_categories',
  timestamps: false
});

module.exports = Category;
