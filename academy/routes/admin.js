/**
 * Admin Routes - Course, User, Teacher, and Certification Management
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../../shared/middleware/auth');
const { User, Course, Module, Enrollment, Certification, Company, JobPosting, Setting } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// All admin routes require authentication and admin role
router.use(isAuthenticated);
router.use(isAdmin);

// ==================== DASHBOARD STATS ====================

router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalCertifications,
      totalCompanies,
      recentUsers,
      enrollmentsByStatus
    ] = await Promise.all([
      User.count(),
      Course.count(),
      Enrollment.count(),
      Certification.count(),
      Company.count(),
      User.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'name', 'email', 'role', 'createdAt', 'avatar']
      }),
      Enrollment.findAll({
        attributes: ['status', [require('sequelize').fn('COUNT', '*'), 'count']],
        group: ['status'],
        raw: true
      })
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        totalCertifications,
        totalCompanies,
        recentUsers,
        enrollmentsByStatus
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== USER MANAGEMENT ====================

router.get('/users', async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['googleId'] }
    });

    res.json({
      success: true,
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['googleId'] },
      include: [
        { model: Enrollment, include: [Course] },
        { model: Certification }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { role, credits, isActive } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (role) user.role = role;
    if (credits !== undefined) user.credits = credits;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== COURSE MANAGEMENT ====================

router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [{ model: Module, attributes: ['id', 'name', 'order'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/courses', async (req, res) => {
  try {
    const {
      name,
      description,
      thumbnail,
      theoryCompletionRequired = 100,
      practicalHoursRequired = 40,
      physicalTestRequired = true,
      jobCategories = []
    } = req.body;

    const course = await Course.create({
      name,
      description,
      thumbnail,
      theoryCompletionRequired,
      practicalHoursRequired,
      physicalTestRequired,
      jobCategories
    });

    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const allowedFields = [
      'name', 'description', 'thumbnail', 'theoryCompletionRequired',
      'practicalHoursRequired', 'physicalTestRequired', 'jobCategories',
      'isActive', 'isFeatured'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    });

    await course.save();

    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    // Soft delete by marking inactive
    course.isActive = false;
    await course.save();

    res.json({ success: true, message: 'Course deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== MODULE MANAGEMENT ====================

router.get('/courses/:courseId/modules', async (req, res) => {
  try {
    const modules = await Module.findAll({
      where: { courseId: req.params.courseId },
      order: [['order', 'ASC']]
    });

    res.json({ success: true, modules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/courses/:courseId/modules', async (req, res) => {
  try {
    const { name, description, order, videoUrl, content, resources, quizQuestions, passingScore, estimatedMinutes } = req.body;

    const module = await Module.create({
      courseId: req.params.courseId,
      name,
      description,
      order: order || 0,
      videoUrl,
      content,
      resources,
      quizQuestions,
      passingScore: passingScore || 70,
      estimatedMinutes: estimatedMinutes || 30
    });

    res.json({ success: true, module });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/modules/:id', async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id);

    if (!module) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    const allowedFields = [
      'name', 'description', 'order', 'videoUrl', 'content',
      'resources', 'quizQuestions', 'passingScore', 'estimatedMinutes', 'isPublished'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        module[field] = req.body[field];
      }
    });

    await module.save();

    res.json({ success: true, module });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/modules/:id', async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id);

    if (!module) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    await module.destroy();

    res.json({ success: true, message: 'Module deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== TEACHER INVITES ====================

// Uses shared teacherInvites Map from app.locals (set in app.js)
// In production, use a database table

router.post('/teachers/invite', async (req, res) => {
  try {
    const { email, name, message } = req.body;
    const teacherInvites = req.app.locals.teacherInvites;

    // Generate unique invite token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    teacherInvites.set(token, {
      email,
      name,
      message,
      invitedBy: req.user.id,
      createdAt: new Date(),
      expiresAt
    });

    // In production, send email with invite link
    const inviteLink = `${req.protocol}://${req.get('host')}/teacher/accept-invite/${token}`;

    res.json({
      success: true,
      message: 'Invite created',
      inviteLink,
      token,
      expiresAt
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/teachers/invites', async (req, res) => {
  try {
    const teacherInvites = req.app.locals.teacherInvites;
    const invites = [];
    teacherInvites.forEach((value, key) => {
      invites.push({ token: key, ...value });
    });

    res.json({ success: true, invites });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/teachers/invites/:token', async (req, res) => {
  try {
    const teacherInvites = req.app.locals.teacherInvites;
    if (teacherInvites.has(req.params.token)) {
      teacherInvites.delete(req.params.token);
      res.json({ success: true, message: 'Invite revoked' });
    } else {
      res.status(404).json({ success: false, error: 'Invite not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get teacher applications (users who requested to become teachers)
router.get('/teachers/applications', async (req, res) => {
  try {
    // For now, return users with 'student' role who have high engagement
    // In production, you'd have a separate applications table
    const potentialTeachers = await User.findAll({
      where: { role: 'student' },
      include: [{
        model: Certification,
        required: true
      }],
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    res.json({ success: true, applications: potentialTeachers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Promote user to instructor
router.post('/teachers/promote/:userId', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.role = 'instructor';
    await user.save();

    res.json({ success: true, user, message: `${user.name} is now an instructor` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CERTIFICATION MANAGEMENT ====================

router.get('/certifications', async (req, res) => {
  try {
    const { status, courseId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (courseId) where.courseId = courseId;
    if (status === 'pending') where.isValid = null;
    if (status === 'valid') where.isValid = true;
    if (status === 'revoked') where.isValid = false;

    const { count, rows: certifications } = await Certification.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'avatar'] },
        { model: Course, attributes: ['id', 'name'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      certifications,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/certifications/:id', async (req, res) => {
  try {
    const cert = await Certification.findByPk(req.params.id);

    if (!cert) {
      return res.status(404).json({ success: false, error: 'Certification not found' });
    }

    const { isValid, revokedReason, physicalTestScore, overallGrade } = req.body;

    if (isValid !== undefined) cert.isValid = isValid;
    if (revokedReason) {
      cert.revokedReason = revokedReason;
      cert.revokedAt = new Date();
    }
    if (physicalTestScore !== undefined) cert.physicalTestScore = physicalTestScore;
    if (overallGrade) cert.overallGrade = overallGrade;

    await cert.save();

    res.json({ success: true, certification: cert });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== COMPANY MANAGEMENT ====================

router.get('/companies', async (req, res) => {
  try {
    const companies = await Company.findAll({
      include: [{ model: JobPosting, attributes: ['id', 'title', 'status'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, companies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/companies/:id/verify', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);

    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    company.isVerified = true;
    company.verifiedAt = new Date();
    await company.save();

    res.json({ success: true, company, message: 'Company verified' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AI TUTOR SETTINGS ====================

// Get AI Tutor settings
router.get('/ai-tutor/settings', async (req, res) => {
  try {
    const settings = await Setting.getAITutorSettings();
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Get AI settings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update AI Tutor settings
router.put('/ai-tutor/settings', async (req, res) => {
  try {
    const updates = req.body;
    const settings = await Setting.updateAITutorSettings(updates, req.user.id);
    res.json({ success: true, settings, message: 'AI Tutor settings updated' });
  } catch (error) {
    console.error('Update AI settings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get course-specific AI instructions
router.get('/ai-tutor/course-instructions', async (req, res) => {
  try {
    const settings = await Setting.getAITutorSettings();
    res.json({
      success: true,
      courseInstructions: settings.courseInstructions || {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update course-specific AI instructions
router.put('/ai-tutor/course-instructions/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { instructions } = req.body;

    const settings = await Setting.getAITutorSettings();
    const courseInstructions = settings.courseInstructions || {};
    courseInstructions[courseId] = instructions;

    await Setting.updateAITutorSettings({ courseInstructions }, req.user.id);

    res.json({
      success: true,
      message: `Instructions updated for ${courseId}`,
      courseInstructions
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test AI Tutor (send test message)
router.post('/ai-tutor/test', async (req, res) => {
  try {
    const { message, courseContext } = req.body;
    const { getAIResponse } = require('../services/aiTutor');

    const result = await getAIResponse(
      message || 'Hello, this is a test message.',
      [],
      {
        courseContext,
        studentName: 'Test Admin',
        enrolledCourses: []
      }
    );

    res.json({ success: true, result });
  } catch (error) {
    console.error('AI test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get AI usage stats
router.get('/ai-tutor/stats', async (req, res) => {
  try {
    const { Message } = require('../models');
    const { fn, col, literal } = require('sequelize');

    // Count total AI conversations
    const totalConversations = await Message.count({
      where: { isFromAI: true },
      distinct: true,
      col: 'conversationId'
    });

    // Count total AI messages
    const totalMessages = await Message.count({
      where: { isFromAI: true }
    });

    // Get messages by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const messagesByDay = await Message.findAll({
      where: {
        isFromAI: true,
        createdAt: { [Op.gte]: sevenDaysAgo }
      },
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('COUNT', '*'), 'count']
      ],
      group: [literal('DATE(createdAt)')],
      order: [[literal('DATE(createdAt)'), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      stats: {
        totalConversations,
        totalMessages,
        messagesByDay
      }
    });
  } catch (error) {
    console.error('AI stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
