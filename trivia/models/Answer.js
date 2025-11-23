/**
 * Answer Model
 * Stores answers for each question (multiple choice)
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const Answer = sequelize.define('Answer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'question_id',
    references: {
      model: 'questions',
      key: 'id'
    }
  },
  answerText: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'answer_text'
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_correct'
  }
}, {
  tableName: 'answers',
  timestamps: false
});

module.exports = Answer;
