/**
 * Setting Model
 * Stores system-wide settings including AI Tutor configuration
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  value: {
    type: DataTypes.JSON,
    allowNull: true
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: 'general'
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'settings',
  timestamps: true
});

// Default AI Tutor settings
Setting.AI_TUTOR_DEFAULTS = {
  enabled: true,
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: `You are an AI Tutor for Haiti Skills Academy, an educational platform teaching practical skills to students in Haiti.

Your role:
- Help students understand course material
- Answer questions about Agriculture, Mechanic, Fishing, Boat Building, and Recycling courses
- Provide encouragement and support
- Explain concepts in simple, clear language
- When relevant, connect lessons to real-world applications in Haiti

Guidelines:
- Be patient and supportive
- Use examples relevant to Haiti when possible
- If you don't know something, say so honestly
- Keep responses focused and helpful
- Respond in the same language the student uses (Creole, French, or English)`,
  welcomeMessage: "Hello! I'm your AI Tutor. How can I help you today with your studies?",
  personality: 'helpful',
  responseStyle: 'conversational',
  languages: ['en', 'fr', 'ht'],
  courseInstructions: {}
};

// Helper method to get a setting with default
Setting.getValue = async function(key, defaultValue = null) {
  const setting = await this.findOne({ where: { key } });
  return setting ? setting.value : defaultValue;
};

// Helper method to set a setting
Setting.setValue = async function(key, value, options = {}) {
  const [setting, created] = await this.upsert({
    key,
    value,
    description: options.description,
    category: options.category || 'general',
    updatedBy: options.updatedBy
  });
  return setting;
};

// Get all AI Tutor settings
Setting.getAITutorSettings = async function() {
  const settings = await this.getValue('ai_tutor', this.AI_TUTOR_DEFAULTS);
  return { ...this.AI_TUTOR_DEFAULTS, ...settings };
};

// Update AI Tutor settings
Setting.updateAITutorSettings = async function(updates, userId) {
  const current = await this.getAITutorSettings();
  const newSettings = { ...current, ...updates };
  await this.setValue('ai_tutor', newSettings, {
    category: 'ai_tutor',
    description: 'AI Tutor configuration',
    updatedBy: userId
  });
  return newSettings;
};

module.exports = Setting;
