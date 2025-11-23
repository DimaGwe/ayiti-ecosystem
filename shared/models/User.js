/**
 * Shared User Model
 * Used across all Ayiti Ecosystem apps
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  googleId: {
    type: DataTypes.STRING,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING
  },
  // Credit system (shared across Solar, Academy, Market)
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // User roles
  role: {
    type: DataTypes.ENUM('student', 'instructor', 'employer', 'admin'),
    defaultValue: 'student'
  },
  // Academy-specific
  pipelineStage: {
    type: DataTypes.INTEGER,
    defaultValue: 0  // 0 = not enrolled, 1-9 = pipeline stages
  },
  // Solana wallet for payments
  solanaWallet: {
    type: DataTypes.STRING
  },
  // Profile
  bio: {
    type: DataTypes.TEXT
  },
  phone: {
    type: DataTypes.STRING
  },
  location: {
    type: DataTypes.STRING
  },
  // Status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLoginAt: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;
