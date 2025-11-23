/**
 * JobPosting Model
 * Job listings from Ayiti companies
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const JobPosting = sequelize.define('JobPosting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyId: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  responsibilities: {
    type: DataTypes.JSON,
    defaultValue: []  // Array of responsibility strings
  },
  // Requirements
  requiredCourseId: {
    type: DataTypes.STRING(50)  // Must have certification in this course
  },
  experienceLevel: {
    type: DataTypes.ENUM('entry', 'mid', 'senior'),
    defaultValue: 'entry'
  },
  additionalRequirements: {
    type: DataTypes.JSON,
    defaultValue: []  // ["Valid driver's license", "Own transportation"]
  },
  preferredSkills: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Compensation (based on haiti_companies.json salary ranges)
  salaryMin: {
    type: DataTypes.INTEGER  // Monthly in USD
  },
  salaryMax: {
    type: DataTypes.INTEGER
  },
  salaryCurrency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD'
  },
  salaryType: {
    type: DataTypes.ENUM('monthly', 'hourly', 'project', 'commission'),
    defaultValue: 'monthly'
  },
  includesCatchShare: {
    type: DataTypes.BOOLEAN,
    defaultValue: false  // For fishing jobs
  },
  benefits: {
    type: DataTypes.JSON,
    defaultValue: []  // ["Health insurance", "Training stipend"]
  },
  // Position details
  positionsAvailable: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  positionsFilled: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  location: {
    type: DataTypes.STRING(200)
  },
  isRemote: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  workSchedule: {
    type: DataTypes.STRING(100)  // "Full-time", "Part-time", "Flexible"
  },
  // Status
  status: {
    type: DataTypes.ENUM('draft', 'active', 'paused', 'filled', 'closed', 'expired'),
    defaultValue: 'active'
  },
  postedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expiresAt: {
    type: DataTypes.DATE
  },
  // Stats
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  applicationCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'job_postings',
  timestamps: true,
  indexes: [
    { fields: ['companyId'] },
    { fields: ['requiredCourseId'] },
    { fields: ['status'] },
    { fields: ['experienceLevel'] }
  ]
});

module.exports = JobPosting;
