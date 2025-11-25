/**
 * AICommunityTeacher Model
 * AI agents that own and teach in communities
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const AICommunityTeacher = sequelize.define('AICommunityTeacher', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: '/img/ai-teacher.png'
  },
  title: {
    type: DataTypes.STRING,
    defaultValue: 'AI Teacher'
  },
  // The subject/expertise area
  expertise: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Personality and teaching style
  personality: {
    type: DataTypes.JSON,
    defaultValue: {
      style: 'helpful',           // helpful, strict, friendly, socratic
      tone: 'encouraging',        // encouraging, professional, casual
      language: 'multilingual'    // en, fr, ht, multilingual
    }
  },
  // System prompt that defines the AI's behavior
  systemPrompt: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  // Welcome message when students join
  welcomeMessage: {
    type: DataTypes.TEXT
  },
  // Course content the AI references (admin-managed)
  curriculum: {
    type: DataTypes.JSON,
    defaultValue: {
      modules: [],          // Learning modules
      keyTopics: [],        // Main topics to cover
      resources: [],        // Reference materials
      assessmentTopics: []  // What students should be tested on
    }
  },
  // AI model settings
  modelSettings: {
    type: DataTypes.JSON,
    defaultValue: {
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 1500
    }
  },
  // Community this AI owns (set after community creation)
  communityId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // Course linked to this AI teacher
  courseId: {
    type: DataTypes.STRING(50),  // Matches Course.id type
    allowNull: true
  },
  // Stats
  totalResponses: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalPosts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'ai_community_teachers',
  timestamps: true
});

module.exports = AICommunityTeacher;
