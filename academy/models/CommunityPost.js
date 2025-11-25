/**
 * CommunityPost Model
 * Posts/discussions within teacher-led communities
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const CommunityPost = sequelize.define('CommunityPost', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  communityId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: true  // Null for AI-generated posts
  },
  // AI Teacher author (if AI-generated)
  aiTeacherId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isAIGenerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Post type
  type: {
    type: DataTypes.ENUM('discussion', 'question', 'announcement', 'resource', 'poll'),
    defaultValue: 'discussion'
  },
  // Content
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  // Optional media/attachments (JSON array of URLs)
  attachments: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Post status
  status: {
    type: DataTypes.ENUM('published', 'draft', 'pinned', 'hidden', 'deleted'),
    defaultValue: 'published'
  },
  // For pinned posts - order
  pinOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Engagement stats
  likesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  commentsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  viewsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Allow comments
  allowComments: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // For questions - mark as answered
  isAnswered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // For polls
  pollOptions: {
    type: DataTypes.JSON,
    defaultValue: null
  },
  pollEndsAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'community_posts',
  timestamps: true,
  indexes: [
    { fields: ['communityId'] },
    { fields: ['authorId'] },
    { fields: ['status'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = CommunityPost;
