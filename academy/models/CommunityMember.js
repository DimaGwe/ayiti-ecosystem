/**
 * CommunityMember Model
 * Tracks membership in teacher-led communities
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const CommunityMember = sequelize.define('CommunityMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  communityId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // Role within the community
  role: {
    type: DataTypes.ENUM('member', 'moderator', 'admin', 'owner'),
    defaultValue: 'member'
  },
  // Membership status
  status: {
    type: DataTypes.ENUM('active', 'pending', 'suspended', 'left'),
    defaultValue: 'active'
  },
  // How they joined
  joinMethod: {
    type: DataTypes.ENUM('direct', 'invite', 'request', 'auto'),
    defaultValue: 'direct'
  },
  // Who invited them (if applicable)
  invitedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // Engagement tracking
  lastActiveAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  postsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  commentsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Points earned in this community
  communityPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Notifications
  notificationsEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'community_members',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['communityId', 'userId']
    }
  ]
});

module.exports = CommunityMember;
