/**
 * Job Routes
 * Job postings and applications
 */

const express = require('express');
const router = express.Router();
const { JobPosting, JobApplication, Company, Course, Certification, User } = require('../models');
const { isAuthenticated, isEmployer } = require('../../shared/middleware/auth');
const { addCredits, spendCredits, CREDIT_VALUES } = require('../../shared/utils/credits');

// GET /api/jobs - List active job postings
router.get('/', async (req, res) => {
  try {
    const { courseId, companyId, level, search } = req.query;

    const where = { status: 'active' };
    if (courseId) where.requiredCourseId = courseId;
    if (companyId) where.companyId = companyId;
    if (level) where.experienceLevel = level;

    const jobs = await JobPosting.findAll({
      where,
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'logo', 'tagline', 'location']
        },
        {
          model: Course,
          as: 'requiredCourse',
          attributes: ['id', 'name']
        }
      ],
      order: [['postedAt', 'DESC']]
    });

    // Filter by search if provided
    let filteredJobs = jobs;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredJobs = jobs.filter(j =>
        j.title.toLowerCase().includes(searchLower) ||
        j.description?.toLowerCase().includes(searchLower) ||
        j.company?.name.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      jobs: filteredJobs,
      total: filteredJobs.length
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/jobs/:id - Get job details
router.get('/:id', async (req, res) => {
  try {
    const job = await JobPosting.findByPk(req.params.id, {
      include: [
        {
          model: Company,
          as: 'company'
        },
        {
          model: Course,
          as: 'requiredCourse'
        }
      ]
    });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    // Increment view count
    job.viewCount = (job.viewCount || 0) + 1;
    await job.save();

    res.json({
      success: true,
      job
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/jobs/:id/apply - Apply for job
router.post('/:id/apply', isAuthenticated, async (req, res) => {
  try {
    const { coverLetter, resumeUrl, portfolioUrl, usePriority } = req.body;

    const job = await JobPosting.findByPk(req.params.id, {
      include: [{ model: Company, as: 'company' }]
    });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    if (job.status !== 'active') {
      return res.status(400).json({ success: false, error: 'This job is no longer accepting applications' });
    }

    // Check if user has required certification
    let certification = null;
    if (job.requiredCourseId) {
      certification = await Certification.findOne({
        where: {
          userId: req.user.id,
          courseId: job.requiredCourseId,
          isValid: true
        }
      });

      if (!certification) {
        return res.status(400).json({
          success: false,
          error: `You must be certified in ${job.requiredCourse?.name || job.requiredCourseId} to apply`
        });
      }
    }

    // Check if already applied
    const existing = await JobApplication.findOne({
      where: {
        userId: req.user.id,
        jobPostingId: job.id
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'You have already applied to this job',
        application: existing
      });
    }

    // Handle priority application
    let isPriority = false;
    if (usePriority) {
      try {
        await spendCredits(req.user.id, CREDIT_VALUES.PRIORITY_JOB_MATCHING, 'Priority job application');
        isPriority = true;
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: `Insufficient credits for priority application. Need ${CREDIT_VALUES.PRIORITY_JOB_MATCHING} credits.`
        });
      }
    }

    // Create application
    const application = await JobApplication.create({
      userId: req.user.id,
      jobPostingId: job.id,
      certificationId: certification?.id,
      coverLetter,
      resumeUrl,
      portfolioUrl,
      isPriority,
      status: isPriority ? 'matched' : 'applied',
      statusHistory: [{
        status: isPriority ? 'matched' : 'applied',
        at: new Date().toISOString(),
        by: 'system'
      }]
    });

    // Update job stats
    job.applicationCount = (job.applicationCount || 0) + 1;
    await job.save();

    // Update user pipeline stage
    const user = await User.findByPk(req.user.id);
    if (user.pipelineStage < 6) {
      user.pipelineStage = 6;  // Stage 6: Job Matching
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: isPriority
        ? 'Priority application submitted! You\'ll be reviewed first.'
        : 'Application submitted successfully!',
      application
    });
  } catch (error) {
    console.error('Error applying to job:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/jobs/applications/mine - Get user's applications
router.get('/applications/mine', isAuthenticated, async (req, res) => {
  try {
    const applications = await JobApplication.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: JobPosting,
          as: 'jobPosting',
          include: [{
            model: Company,
            as: 'company',
            attributes: ['id', 'name', 'logo']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/jobs - Create job posting (employer only)
router.post('/', isAuthenticated, isEmployer, async (req, res) => {
  try {
    const job = await JobPosting.create({
      ...req.body,
      postedAt: new Date()
    });

    // Update company stats
    const company = await Company.findByPk(job.companyId);
    if (company) {
      company.openPositions = (company.openPositions || 0) + job.positionsAvailable;
      await company.save();
    }

    res.status(201).json({
      success: true,
      message: 'Job posted successfully!',
      job
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/jobs/applications/:id/status - Update application status (employer)
router.put('/applications/:id/status', isAuthenticated, isEmployer, async (req, res) => {
  try {
    const { status, interviewScheduledAt, interviewLocation, startDate, agreedSalary, notes } = req.body;

    const application = await JobApplication.findByPk(req.params.id, {
      include: [{ model: User, as: 'applicant' }]
    });

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    // Update fields
    application.status = status;
    if (interviewScheduledAt) application.interviewScheduledAt = interviewScheduledAt;
    if (interviewLocation) application.interviewLocation = interviewLocation;
    if (startDate) application.startDate = startDate;
    if (agreedSalary) application.agreedSalary = agreedSalary;
    if (notes) application.interviewNotes = notes;

    await application.save();

    // Update user pipeline stage based on status
    const user = application.applicant;
    if (['interview_prep', 'interview_scheduled'].includes(status)) {
      user.pipelineStage = Math.max(user.pipelineStage, 7);  // Stage 7: Interview Prep
    } else if (status === 'hired') {
      user.pipelineStage = Math.max(user.pipelineStage, 8);  // Stage 8: Placement
      await addCredits(user.id, CREDIT_VALUES.GET_HIRED, 'Got hired!');
    }
    await user.save();

    res.json({
      success: true,
      message: `Application status updated to ${status}`,
      application
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
