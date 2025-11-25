/**
 * PostComment Model
 * Comments on community posts
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const PostComment = sequelize.define('PostComment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: true  // Null for AI-generated comments
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
  // For nested comments (replies)
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  // Status
  status: {
    type: DataTypes.ENUM('published', 'hidden', 'deleted'),
    defaultValue: 'published'
  },
  // Engagement
  likesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // For questions - mark as accepted answer
  isAcceptedAnswer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'post_comments',
  timestamps: true,
  indexes: [
    { fields: ['postId'] },
    { fields: ['authorId'] },
    { fields: ['parentId'] }
  ]
});

module.exports = PostComment;
