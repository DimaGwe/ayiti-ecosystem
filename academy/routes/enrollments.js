/**
 * Enrollment Routes
 * Track student progress through courses
 */

const express = require('express');
const router = express.Router();
const { Enrollment, Course, Module, User } = require('../models');
const { isAuthenticated } = require('../../shared/middleware/auth');
const { addCredits, CREDIT_VALUES } = require('../../shared/utils/credits');

// GET /api/enrollments - Get user's enrollments
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const enrollments = await Enrollment.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Course,
          as: 'course',
          include: [{
            model: Module,
            as: 'modules',
            attributes: ['id', 'name', 'order']
          }]
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    // Calculate progress for each enrollment
    const enrollmentsWithProgress = enrollments.map(e => {
      const totalModules = e.course?.modules?.length || 0;
      const completedModules = e.modulesCompleted?.length || 0;
      const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

      return {
        ...e.toJSON(),
        progress,
        totalModules,
        completedModules
      };
    });

    res.json({
      success: true,
      enrollments: enrollmentsWithProgress
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/enrollments/:id - Get enrollment details
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [
        {
          model: Course,
          as: 'course',
          include: [{
            model: Module,
            as: 'modules',
            order: [['order', 'ASC']]
          }]
        },
        {
          model: User,
          as: 'mentor',
          attributes: ['id', 'name', 'avatar']
        }
      ]
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' });
    }

    res.json({
      success: true,
      enrollment
    });
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/enrollments/:id/complete-module - Complete a module
router.post('/:id/complete-module', isAuthenticated, async (req, res) => {
  try {
    const { moduleId, quizScore, quizAnswers } = req.body;

    const enrollment = await Enrollment.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [{
        model: Course,
        as: 'course',
        include: [{ model: Module, as: 'modules' }]
      }]
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' });
    }

    // Verify module belongs to this course
    const module = enrollment.course.modules.find(m => m.id === moduleId);
    if (!module) {
      return res.status(400).json({ success: false, error: 'Module not found in this course' });
    }

    // Update modules completed
    const modulesCompleted = [...(enrollment.modulesCompleted || [])];
    if (!modulesCompleted.includes(moduleId)) {
      modulesCompleted.push(moduleId);
    }

    // Update quiz scores
    const quizScores = { ...(enrollment.quizScores || {}) };
    if (quizScore !== undefined) {
      quizScores[moduleId] = {
        score: quizScore,
        attempts: (quizScores[moduleId]?.attempts || 0) + 1,
        passedAt: quizScore >= (module.passingScore || 70) ? new Date().toISOString() : null,
        answers: quizAnswers
      };
    }

    // Calculate overall theory score
    const scoreValues = Object.values(quizScores).map(s => s.score);
    const overallTheoryScore = scoreValues.length > 0
      ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
      : 0;

    // Update enrollment
    enrollment.modulesCompleted = modulesCompleted;
    enrollment.quizScores = quizScores;
    enrollment.overallTheoryScore = overallTheoryScore;
    enrollment.status = 'in_progress';
    enrollment.pipelineStage = Math.max(enrollment.pipelineStage, 2);  // Stage 2: Learning

    let creditsAwarded = 0;

    // Award credits for lesson completion
    creditsAwarded += CREDIT_VALUES.COMPLETE_LESSON;
    await addCredits(req.user.id, CREDIT_VALUES.COMPLETE_LESSON, `Completed module: ${module.name}`);

    // Award credits for passing quiz
    if (quizScore && quizScore >= (module.passingScore || 70)) {
      creditsAwarded += CREDIT_VALUES.PASS_QUIZ;
      await addCredits(req.user.id, CREDIT_VALUES.PASS_QUIZ, `Passed quiz: ${module.name}`);
    }

    // Check if all modules completed
    const totalModules = enrollment.course.modules.length;
    if (modulesCompleted.length >= totalModules) {
      enrollment.status = 'completed';
      enrollment.theoryCompletedAt = new Date();
      enrollment.pipelineStage = Math.max(enrollment.pipelineStage, 3);  // Stage 3: Practical Training

      creditsAwarded += CREDIT_VALUES.COMPLETE_MODULE;
      await addCredits(req.user.id, CREDIT_VALUES.COMPLETE_MODULE, `Completed all modules in ${enrollment.course.name}`);
    }

    enrollment.creditsEarned = (enrollment.creditsEarned || 0) + creditsAwarded;
    await enrollment.save();

    res.json({
      success: true,
      message: `Module completed! +${creditsAwarded} credits`,
      enrollment,
      creditsAwarded
    });
  } catch (error) {
    console.error('Error completing module:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/enrollments/:id/log-hours - Log practical hours
router.post('/:id/log-hours', isAuthenticated, async (req, res) => {
  try {
    const { hours, activity, date, notes } = req.body;

    if (!hours || hours <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid hours' });
    }

    const enrollment = await Enrollment.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [{ model: Course, as: 'course' }]
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' });
    }

    // Add to practical log
    const practicalLog = [...(enrollment.practicalLog || [])];
    practicalLog.push({
      date: date || new Date().toISOString().split('T')[0],
      hours,
      activity: activity || 'Practical training',
      notes,
      verified: false,  // Needs mentor verification
      loggedAt: new Date().toISOString()
    });

    enrollment.practicalLog = practicalLog;
    enrollment.practicalHoursLogged = (enrollment.practicalHoursLogged || 0) + hours;
    enrollment.pipelineStage = Math.max(enrollment.pipelineStage, 3);  // Stage 3: Practical Training

    // Check if practical hours requirement met
    const requiredHours = enrollment.course.practicalHoursRequired || 40;
    if (enrollment.practicalHoursLogged >= requiredHours && enrollment.status === 'completed') {
      enrollment.status = 'practical';
      enrollment.practicalCompletedAt = new Date();
    }

    await enrollment.save();

    res.json({
      success: true,
      message: `Logged ${hours} hours. Total: ${enrollment.practicalHoursLogged}/${requiredHours}`,
      enrollment
    });
  } catch (error) {
    console.error('Error logging hours:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/enrollments/:id/schedule-test - Schedule physical test
router.post('/:id/schedule-test', isAuthenticated, async (req, res) => {
  try {
    const { testDate, location } = req.body;

    const enrollment = await Enrollment.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [{ model: Course, as: 'course' }]
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' });
    }

    // Check if ready for physical test
    const requiredHours = enrollment.course.practicalHoursRequired || 40;
    if (enrollment.practicalHoursLogged < requiredHours) {
      return res.status(400).json({
        success: false,
        error: `Need ${requiredHours - enrollment.practicalHoursLogged} more practical hours before scheduling test`
      });
    }

    enrollment.physicalTestScheduled = new Date(testDate);
    enrollment.physicalTestLocation = location;
    enrollment.status = 'testing';
    enrollment.pipelineStage = 4;  // Stage 4: Physical Test

    await enrollment.save();

    res.json({
      success: true,
      message: 'Physical test scheduled!',
      enrollment
    });
  } catch (error) {
    console.error('Error scheduling test:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
