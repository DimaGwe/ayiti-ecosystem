/**
 * Question Model
 * Stores trivia questions with category and difficulty
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['Haiti History', 'Haiti Geography', 'Haiti Culture', 'General Knowledge']]
    }
  },
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'question_text'
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    defaultValue: 'medium'
  }
}, {
  tableName: 'questions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Score points based on difficulty
Question.getPoints = (difficulty) => {
  const points = {
    easy: 10,
    medium: 20,
    hard: 30
  };
  return points[difficulty] || 20;
};

module.exports = Question;
