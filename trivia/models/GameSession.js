/**
 * GameSession Model
 * Tracks individual game sessions for users
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const GameSession = sequelize.define('GameSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  questionsAnswered: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'questions_answered'
  },
  correctAnswers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'correct_answers'
  },
  currentQuestionIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'current_question_index'
  },
  questionIds: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'question_ids',
    get() {
      const value = this.getDataValue('questionIds');
      return value ? JSON.parse(value) : [];
    },
    set(val) {
      this.setDataValue('questionIds', JSON.stringify(val));
    }
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'started_at'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  },
  creditsEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'credits_earned'
  }
}, {
  tableName: 'game_sessions',
  timestamps: false
});

// Constants
GameSession.QUESTIONS_PER_GAME = 10;
GameSession.TIME_PER_QUESTION = 15; // seconds

module.exports = GameSession;
