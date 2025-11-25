/**
 * Message Model
 * Handles inbox messages between users and AI Tutor
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fromUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,  // null when from AI Tutor
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  toUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,  // null when to AI Tutor
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isFromAI: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  courseContext: {
    type: DataTypes.STRING,
    allowNull: true,  // Which course the question relates to
    comment: 'Course ID for context (agriculture, mechanic, etc.)'
  },
  conversationId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Groups messages in a conversation thread'
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data like tokens used, model, etc.'
  }
}, {
  tableName: 'messages',
  timestamps: true
});

// AI Tutor constant - used to identify AI messages
Message.AI_TUTOR_ID = 'AI_TUTOR';

module.exports = Message;
