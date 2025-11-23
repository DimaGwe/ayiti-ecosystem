/**
 * Models Index
 * Sets up associations and exports all models
 */

const sequelize = require('../../shared/config/database');
const Question = require('./Question');
const Answer = require('./Answer');
const GameSession = require('./GameSession');
const Leaderboard = require('./Leaderboard');
const User = require('../../shared/models/User');

// ==================== ASSOCIATIONS ====================

// Question has many Answers
Question.hasMany(Answer, {
  foreignKey: 'questionId',
  as: 'answers',
  onDelete: 'CASCADE'
});

Answer.belongsTo(Question, {
  foreignKey: 'questionId',
  as: 'question'
});

// User has many GameSessions
User.hasMany(GameSession, {
  foreignKey: 'userId',
  as: 'gameSessions'
});

GameSession.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User has one Leaderboard entry
User.hasOne(Leaderboard, {
  foreignKey: 'userId',
  as: 'leaderboardEntry'
});

Leaderboard.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  sequelize,
  Question,
  Answer,
  GameSession,
  Leaderboard,
  User
};
