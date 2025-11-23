/**
 * Enrollment Model
 * Tracks student progress through courses and 9-stage pipeline
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const Enrollment = sequelize.define('Enrollment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  courseId: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  // Status tracking
  status: {
    type: DataTypes.ENUM(
      'enrolled',      // Just signed up
      'in_progress',   // Started learning
      'completed',     // Finished theory
      'practical',     // Doing practical hours
      'testing',       // Scheduled for physical test
      'certified',     // Passed everything
      'dropped'        // Left the course
    ),
    defaultValue: 'enrolled'
  },
  // 9-Stage Pipeline Position (from haiti_skills_academy.json)
  pipelineStage: {
    type: DataTypes.INTEGER,
    defaultValue: 1
    /*
    1 = Enrollment
    2 = Learning
    3 = Practical Training
    4 = Physical Test
    5 = Certification
    6 = Job Matching
    7 = Interview Prep
    8 = Placement
    9 = Follow-up
    */
  },
  // Progress data
  modulesCompleted: {
    type: DataTypes.JSON,
    defaultValue: []  // Array of module IDs
  },
  quizScores: {
    type: DataTypes.JSON,
    defaultValue: {}  // { moduleId: { score: 85, attempts: 2, passedAt: date } }
  },
  overallTheoryScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Practical training
  practicalHoursLogged: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  practicalLog: {
    type: DataTypes.JSON,
    defaultValue: []
    /* Format:
    [
      { date: '2025-01-15', hours: 4, activity: 'Soil preparation', mentor: 'Jean Pierre', verified: true }
    ]
    */
  },
  mentorId: {
    type: DataTypes.INTEGER  // Assigned mentor user ID
  },
  // Physical test
  physicalTestScheduled: {
    type: DataTypes.DATE
  },
  physicalTestLocation: {
    type: DataTypes.STRING(200)
  },
  physicalTestPassed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  physicalTestScore: {
    type: DataTypes.INTEGER
  },
  physicalTestNotes: {
    type: DataTypes.TEXT
  },
  physicalTestEvaluator: {
    type: DataTypes.STRING(100)
  },
  // Completion timestamps
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  theoryCompletedAt: {
    type: DataTypes.DATE
  },
  practicalCompletedAt: {
    type: DataTypes.DATE
  },
  certifiedAt: {
    type: DataTypes.DATE
  },
  // Credits earned for this course
  creditsEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'enrollments',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'courseId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['pipelineStage']
    }
  ]
});

module.exports = Enrollment;
