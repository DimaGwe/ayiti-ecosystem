/**
 * Course Routes
 * GET /api/courses - List all courses
 * GET /api/courses/:id - Get single course with modules
 * POST /api/courses/:id/enroll - Enroll in course
 */

const express = require('express');
const router = express.Router();
const { Course, Module, Enrollment, Company, User } = require('../models');
const { isAuthenticated } = require('../../shared/middleware/auth');
const { addCredits, CREDIT_VALUES } = require('../../shared/utils/credits');

// GET /api/courses - List all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.findAll({
      where: { isActive: true },
      include: [
        {
          model: Module,
          as: 'modules',
          attributes: ['id', 'name', 'order', 'estimatedMinutes'],
          where: { isPublished: true },
          required: false
        },
        {
          model: Company,
          as: 'hiringCompany',
          attributes: ['id', 'name', 'tagline', 'openPositions']
        }
      ],
      order: [
        ['name', 'ASC'],
        [{ model: Module, as: 'modules' }, 'order', 'ASC']
      ]
    });

    // Add computed fields
    const coursesWithStats = courses.map(c => ({
      ...c.toJSON(),
      moduleCount: c.modules?.length || 0,
      totalMinutes: c.modules?.reduce((sum, m) => sum + (m.estimatedMinutes || 0), 0) || 0
    }));

    res.json({
      success: true,
      courses: coursesWithStats
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/courses/:id - Get single course with full details
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: Module,
          as: 'modules',
          where: { isPublished: true },
          required: false,
          order: [['order', 'ASC']]
        },
        {
          model: Company,
          as: 'hiringCompany',
          attributes: ['id', 'name', 'tagline', 'description', 'services', 'openPositions', 'isHiring']
        }
      ]
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    // Get enrollment count
    const enrolledCount = await Enrollment.count({
      where: { courseId: course.id }
    });

    res.json({
      success: true,
      course: {
        ...course.toJSON(),
        enrolledCount,
        moduleCount: course.modules?.length || 0,
        totalMinutes: course.modules?.reduce((sum, m) => sum + (m.estimatedMinutes || 0), 0) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/courses/:id/modules - Get course modules
router.get('/:id/modules', async (req, res) => {
  try {
    const modules = await Module.findAll({
      where: {
        courseId: req.params.id,
        isPublished: true
      },
      order: [['order', 'ASC']]
    });

    res.json({
      success: true,
      modules
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/courses/:id/enroll - Enroll in course
router.post('/:id/enroll', isAuthenticated, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    if (!course.isActive) {
      return res.status(400).json({ success: false, error: 'This course is not currently available' });
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({
      where: {
        userId: req.user.id,
        courseId: req.params.id
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Already enrolled in this course',
        enrollment: existing
      });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      userId: req.user.id,
      courseId: req.params.id,
      status: 'enrolled',
      pipelineStage: 1,  // Stage 1: Enrollment
      startedAt: new Date()
    });

    // Update course stats
    course.enrolledCount = (course.enrolledCount || 0) + 1;
    await course.save();

    // Update user pipeline stage
    const user = await User.findByPk(req.user.id);
    if (user.pipelineStage < 1) {
      user.pipelineStage = 1;
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: `Successfully enrolled in ${course.name}!`,
      enrollment
    });
  } catch (error) {
    console.error('Error enrolling:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
