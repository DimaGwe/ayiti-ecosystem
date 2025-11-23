/**
 * Leaderboard Model
 * Tracks cumulative stats for each user
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const Leaderboard = sequelize.define('Leaderboard', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  totalScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_score'
  },
  gamesPlayed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'games_played'
  },
  bestScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'best_score'
  },
  totalCorrect: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_correct'
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_questions'
  }
}, {
  tableName: 'leaderboard',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at'
});

module.exports = Leaderboard;
