/**
 * JobApplication Model
 * Applications from certified graduates to job postings
 * Tracks pipeline stages 6-9
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const JobApplication = sequelize.define('JobApplication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  jobPostingId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  certificationId: {
    type: DataTypes.UUID  // Link to their certification
  },
  // Application details
  coverLetter: {
    type: DataTypes.TEXT
  },
  resumeUrl: {
    type: DataTypes.STRING(255)
  },
  portfolioUrl: {
    type: DataTypes.STRING(255)
  },
  // Priority application (spent credits)
  isPriority: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Status tracking (Pipeline stages 6-9)
  status: {
    type: DataTypes.ENUM(
      // Stage 6: Job Matching
      'applied',
      'matched',
      'reviewed',
      // Stage 7: Interview Prep
      'interview_prep',
      'interview_scheduled',
      'interviewed',
      // Stage 8: Placement
      'offer_pending',
      'offer_accepted',
      'offer_declined',
      'hired',
      // Other
      'rejected',
      'withdrawn'
    ),
    defaultValue: 'applied'
  },
  statusHistory: {
    type: DataTypes.JSON,
    defaultValue: []
    /* Format:
    [
      { status: 'applied', at: '2025-01-15', by: 'system' },
      { status: 'matched', at: '2025-01-16', by: 'employer' }
    ]
    */
  },
  // Interview details
  interviewScheduledAt: {
    type: DataTypes.DATE
  },
  interviewLocation: {
    type: DataTypes.STRING(200)
  },
  interviewNotes: {
    type: DataTypes.TEXT
  },
  interviewScore: {
    type: DataTypes.INTEGER  // 1-100
  },
  // Hiring details
  startDate: {
    type: DataTypes.DATE
  },
  agreedSalary: {
    type: DataTypes.INTEGER
  },
  // Stage 9: Follow-up tracking
  thirtyDayCheckIn: {
    type: DataTypes.DATE
  },
  thirtyDayNotes: {
    type: DataTypes.TEXT
  },
  ninetyDayReview: {
    type: DataTypes.DATE
  },
  ninetyDayNotes: {
    type: DataTypes.TEXT
  },
  stillEmployedAt90Days: {
    type: DataTypes.BOOLEAN
  },
  // Ratings
  employerRating: {
    type: DataTypes.INTEGER  // 1-5
  },
  employerFeedback: {
    type: DataTypes.TEXT
  },
  employeeRating: {
    type: DataTypes.INTEGER  // 1-5
  },
  employeeFeedback: {
    type: DataTypes.TEXT
  },
  // Success story
  isSuccessStory: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  successStoryContent: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'job_applications',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'jobPostingId']
    },
    { fields: ['status'] },
    { fields: ['isPriority'] }
  ]
});

// Add status to history before updating
JobApplication.beforeUpdate(async (application) => {
  if (application.changed('status')) {
    const history = application.statusHistory || [];
    history.push({
      status: application.status,
      at: new Date().toISOString(),
      by: 'system'
    });
    application.statusHistory = history;
  }
});

module.exports = JobApplication;
