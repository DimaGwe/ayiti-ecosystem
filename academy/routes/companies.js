/**
 * Company Routes
 * The 5 Ayiti companies
 */

const express = require('express');
const router = express.Router();
const { Company, JobPosting, Course, User } = require('../models');
const { Op } = require('sequelize');

// GET /api/companies - List all companies
router.get('/', async (req, res) => {
  try {
    const companies = await Company.findAll({
      where: { isActive: true },
      include: [{
        model: Course,
        as: 'linkedCourse',
        attributes: ['id', 'name', 'enrolledCount', 'certifiedCount']
      }],
      order: [['name', 'ASC']]
    });

    // Add active job counts
    const companiesWithJobs = await Promise.all(companies.map(async (company) => {
      const activeJobs = await JobPosting.count({
        where: {
          companyId: company.id,
          status: 'active'
        }
      });

      return {
        ...company.toJSON(),
        activeJobsCount: activeJobs
      };
    }));

    res.json({
      success: true,
      companies: companiesWithJobs
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/companies/:id - Get company details with jobs
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [
        {
          model: Course,
          as: 'linkedCourse'
        },
        {
          model: JobPosting,
          as: 'jobPostings',
          where: { status: 'active' },
          required: false,
          include: [{
            model: Course,
            as: 'requiredCourse',
            attributes: ['id', 'name']
          }]
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'avatar']
        }
      ]
    });

    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    res.json({
      success: true,
      company
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/companies/:id/jobs - Get company's job postings
router.get('/:id/jobs', async (req, res) => {
  try {
    const { status } = req.query;

    const where = { companyId: req.params.id };
    if (status) {
      where.status = status;
    } else {
      where.status = 'active';  // Default to active jobs
    }

    const jobs = await JobPosting.findAll({
      where,
      include: [{
        model: Course,
        as: 'requiredCourse',
        attributes: ['id', 'name']
      }],
      order: [['postedAt', 'DESC']]
    });

    res.json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error('Error fetching company jobs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/companies/:id/stats - Get company statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);

    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    // Get job stats
    const totalJobs = await JobPosting.count({
      where: { companyId: company.id }
    });

    const activeJobs = await JobPosting.count({
      where: {
        companyId: company.id,
        status: 'active'
      }
    });

    const filledJobs = await JobPosting.count({
      where: {
        companyId: company.id,
        status: 'filled'
      }
    });

    // Get application stats
    const { JobApplication } = require('../models');
    const totalApplications = await JobApplication.count({
      include: [{
        model: JobPosting,
        as: 'jobPosting',
        where: { companyId: company.id }
      }]
    });

    res.json({
      success: true,
      stats: {
        employeesCount: company.employeesCount,
        graduatesHired: company.graduatesHired,
        openPositions: company.openPositions,
        totalJobs,
        activeJobs,
        filledJobs,
        totalApplications
      }
    });
  } catch (error) {
    console.error('Error fetching company stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
