/**
 * Module Model
 * Course modules/chapters with lessons and quizzes
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const Module = sequelize.define('Module', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  courseId: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Content
  videoUrl: {
    type: DataTypes.STRING(500)
  },
  content: {
    type: DataTypes.TEXT('long')  // Markdown content
  },
  // Resources
  resources: {
    type: DataTypes.JSON,
    defaultValue: []
    /* Format:
    [
      { type: 'pdf', name: 'Handout', url: '...' },
      { type: 'video', name: 'Demo', url: '...' }
    ]
    */
  },
  // Quiz questions
  quizQuestions: {
    type: DataTypes.JSON,
    defaultValue: []
    /* Format:
    [
      {
        id: 1,
        question: "What is the best soil pH for tomatoes?",
        options: ["5.5-6.5", "7.0-8.0", "4.0-5.0", "8.0-9.0"],
        correctIndex: 0,
        points: 25,
        explanation: "Tomatoes thrive in slightly acidic soil."
      }
    ]
    */
  },
  passingScore: {
    type: DataTypes.INTEGER,
    defaultValue: 70  // percentage
  },
  // Timing
  estimatedMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  // Status
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'modules',
  timestamps: true
});

module.exports = Module;
