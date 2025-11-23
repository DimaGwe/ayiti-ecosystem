/**
 * Course Model
 * 5 courses: Agriculture, Mechanic, Fishing, Boat Building, Recycling
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true  // e.g., 'agriculture', 'mechanic'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  thumbnail: {
    type: DataTypes.STRING(255)
  },
  // Certification requirements (from haiti_skills_academy.json)
  theoryCompletionRequired: {
    type: DataTypes.INTEGER,
    defaultValue: 100  // percentage
  },
  practicalHoursRequired: {
    type: DataTypes.INTEGER,
    defaultValue: 40
  },
  physicalTestRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Link to which company hires from this course
  companyLink: {
    type: DataTypes.STRING(50)  // e.g., 'ayiti-farms'
  },
  // Job categories this course prepares for
  jobCategories: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Course stats
  enrolledCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  completedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  certifiedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'courses',
  timestamps: true
});

module.exports = Course;
