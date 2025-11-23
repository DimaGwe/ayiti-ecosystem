/**
 * Pipeline Routes
 * Track the 9-stage job pipeline
 */

const express = require('express');
const router = express.Router();
const { Enrollment, JobApplication, User, Course, Certification } = require('../models');
const { isAuthenticated } = require('../../shared/middleware/auth');

// Pipeline stages from haiti_skills_academy.json
const PIPELINE_STAGES = [
  {
    stage: 1,
    name: 'enrollment',
    displayName: 'Enrollment',
    description: 'Student enrolled in course',
    requirements: ['Create account', 'Select course'],
    output: 'Enrolled Student'
  },
  {
    stage: 2,
    name: 'learning',
    displayName: 'Learning',
    description: 'Complete all course modules',
    requirements: ['Watch lessons', 'Complete exercises', 'Pass quizzes'],
    output: 'Course Completed'
  },
  {
    stage: 3,
    name: 'practical_training',
    displayName: 'Practical Training',
    description: 'Hands-on experience hours',
    requirements: ['Log practical hours', 'Mentor sign-off', 'Project completion'],
    output: 'Practical Hours Verified'
  },
  {
    stage: 4,
    name: 'physical_test',
    displayName: 'Physical Test',
    description: 'In-person skill demonstration',
    requirements: ['Schedule test date', 'Demonstrate skills', 'Evaluator approval'],
    output: 'Skills Verified'
  },
  {
    stage: 5,
    name: 'certification',
    displayName: 'Certification',
    description: 'Official certificate issued',
    requirements: ['All stages complete', 'Certificate issued'],
    output: 'Certified Graduate'
  },
  {
    stage: 6,
    name: 'job_matching',
    displayName: 'Job Matching',
    description: 'Match with available positions',
    requirements: ['Upload resume', 'Set preferences', 'Apply to jobs'],
    output: 'Matched Candidates'
  },
  {
    stage: 7,
    name: 'interview_prep',
    displayName: 'Interview Prep',
    description: 'Prepare for employer interviews',
    requirements: ['Mock interview', 'Document preparation', 'Soft skills review'],
    output: 'Interview Ready'
  },
  {
    stage: 8,
    name: 'placement',
    displayName: 'Placement',
    description: 'Hired by employer',
    requirements: ['Pass interview', 'Accept offer', 'Start date confirmed'],
    output: 'Employed Graduate'
  },
  {
    stage: 9,
    name: 'followup',
    displayName: 'Follow-up',
    description: 'Track success and gather feedback',
    requirements: ['30-day check-in', '90-day review'],
    output: 'Success Metrics'
  }
];

// GET /api/pipeline - Get user's pipeline status
router.get('/', isAuthenticated, async (req, res) => {
  try {
    // Get all enrollments
    const enrollments = await Enrollment.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Course,
        as: 'course',
        attributes: ['id', 'name']
      }]
    });

    // Get all certifications
    const certifications = await Certification.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Course,
        as: 'course',
        attributes: ['id', 'name']
      }]
    });

    // Get all job applications
    const applications = await JobApplication.findAll({
      where: { userId: req.user.id }
    });

    // Determine current stage from user record
    const user = await User.findByPk(req.user.id);
    let currentStage = user.pipelineStage || 0;

    // Build stage details
    const stageDetails = PIPELINE_STAGES.map(stage => {
      const isComplete = stage.stage < currentStage;
      const isCurrent = stage.stage === currentStage;
      const isLocked = stage.stage > currentStage;

      // Get related data for each stage
      let data = null;
      if (stage.stage <= 5) {
        // Course-related stages
        data = enrollments.filter(e => e.pipelineStage >= stage.stage);
      } else {
        // Job-related stages
        data = applications;
      }

      return {
        ...stage,
        status: isComplete ? 'complete' : (isCurrent ? 'current' : 'locked'),
        isComplete,
        isCurrent,
        isLocked,
        relatedCount: data?.length || 0
      };
    });

    // Calculate overall progress
    const progressPercent = Math.round((currentStage / 9) * 100);

    res.json({
      success: true,
      currentStage,
      progressPercent,
      stages: stageDetails,
      summary: {
        enrollments: enrollments.length,
        certifications: certifications.length,
        applications: applications.length,
        hired: applications.filter(a => a.status === 'hired').length
      }
    });
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/pipeline/stages - Get all pipeline stages info
router.get('/stages', (req, res) => {
  res.json({
    success: true,
    stages: PIPELINE_STAGES
  });
});

// GET /api/pipeline/stats - Admin stats (global pipeline distribution)
router.get('/stats', async (req, res) => {
  try {
    // Count users at each pipeline stage
    const stats = await Promise.all(
      PIPELINE_STAGES.map(async (stage) => {
        const count = await User.count({
          where: { pipelineStage: stage.stage }
        });
        return {
          ...stage,
          count
        };
      })
    );

    // Get totals
    const totalUsers = await User.count();
    const certifiedUsers = await Certification.count({
      distinct: true,
      col: 'userId'
    });
    const hiredUsers = await JobApplication.count({
      distinct: true,
      col: 'userId',
      where: { status: 'hired' }
    });

    res.json({
      success: true,
      stats,
      totals: {
        totalUsers,
        certifiedUsers,
        hiredUsers,
        employmentRate: totalUsers > 0 ? Math.round((hiredUsers / totalUsers) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching pipeline stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/pipeline/metrics - Success metrics (from haiti_skills_academy.json)
router.get('/metrics', async (req, res) => {
  try {
    // Get certifications from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentCertifications = await Certification.findAll({
      where: {
        issuedAt: { [require('sequelize').Op.gte]: ninetyDaysAgo }
      }
    });

    // Get hired within 90 days of certification
    const hiredApplications = await JobApplication.findAll({
      where: { status: 'hired' },
      include: [{
        model: Certification,
        as: 'certification'
      }]
    });

    // Calculate employment rate within 90 days
    let hiredWithin90Days = 0;
    hiredApplications.forEach(app => {
      if (app.certification && app.startDate) {
        const certDate = new Date(app.certification.issuedAt);
        const hireDate = new Date(app.startDate);
        const daysDiff = Math.floor((hireDate - certDate) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 90) hiredWithin90Days++;
      }
    });

    // Get 90-day retention
    const retainedAt90Days = await JobApplication.count({
      where: {
        status: 'hired',
        stillEmployedAt90Days: true
      }
    });

    const totalHired = await JobApplication.count({
      where: { status: 'hired' }
    });

    res.json({
      success: true,
      metrics: {
        goals: {
          employmentRate: '70% within 90 days of certification',
          retentionRate: '80% still employed at 6 months'
        },
        current: {
          recentCertifications: recentCertifications.length,
          hiredWithin90Days,
          employmentRate: recentCertifications.length > 0
            ? Math.round((hiredWithin90Days / recentCertifications.length) * 100)
            : 0,
          retainedAt90Days,
          retentionRate: totalHired > 0
            ? Math.round((retainedAt90Days / totalHired) * 100)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
