/**
 * VPN Usage Log Model
 * Tracks VPN session usage for analytics and billing
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const VpnUsageLog = sequelize.define('VpnUsageLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'client_id'
  },
  sessionStart: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'session_start'
  },
  sessionEnd: {
    type: DataTypes.DATE,
    field: 'session_end'
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
  tableName: 'vpn_usage_logs',
  timestamps: true
});

module.exports = VpnUsageLog;
