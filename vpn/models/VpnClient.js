/**
 * VPN Client Model
 * WireGuard peer configuration for each user device
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const VpnClient = sequelize.define('VpnClient', {
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
  subscriptionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'subscription_id'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  privateKey: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'private_key'
  },
  publicKey: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'public_key'
  },
  ipAddress: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true,
    field: 'ip_address'
  },
  status: {
    type: DataTypes.ENUM('enabled', 'paused', 'disabled'),
    defaultValue: 'enabled'
  },
  lastHandshake: {
    type: DataTypes.DATE,
    field: 'last_handshake'
  },
  bytesReceived: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    field: 'bytes_received'
  },
  bytesSent: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    field: 'bytes_sent'
  }
}, {
  tableName: 'vpn_clients',
  timestamps: true
});

module.exports = VpnClient;
