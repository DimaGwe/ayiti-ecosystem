/**
 * VPN Plan Model
 * Defines subscription plans for VPN service
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const VpnPlan = sequelize.define('VpnPlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  nameHt: {
    type: DataTypes.STRING(50),
    field: 'name_ht'
  },
  creditsMonthly: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'credits_monthly'
  },
  deviceLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'device_limit'
  },
  dataLimitGb: {
    type: DataTypes.INTEGER,
    allowNull: true,  // NULL = unlimited
    field: 'data_limit_gb'
  },
  features: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'vpn_plans',
  timestamps: true
});

module.exports = VpnPlan;
