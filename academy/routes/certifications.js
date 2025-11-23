/**
 * Certification Routes
 * Issue and verify certificates
 */

const express = require('express');
const router = express.Router();
const { Certification, Enrollment, Course, User } = require('../models');
const { isAuthenticated, isInstructor } = require('../../shared/middleware/auth');
const { addCredits, CREDIT_VALUES } = require('../../shared/utils/credits');

// GET /api/certifications - Get user's certifications
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const certifications = await Certification.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Course,
        as: 'course',
        attributes: ['id', 'name', 'description', 'thumbnail']
      }],
      order: [['issuedAt', 'DESC']]
    });

    res.json({
      success: true,
      certifications
    });
  } catch (error) {
    console.error('Error fetching certifications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/certifications/verify/:certificateNumber - Public verification
router.get('/verify/:certificateNumber', async (req, res) => {
  try {
    const cert = await Certification.findOne({
      where: { certificateNumber: req.params.certificateNumber },
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar']
        }
      ]
    });

    if (!cert) {
      return res.status(404).json({
        success: false,
        valid: false,
        error: 'Certificate not found'
      });
    }

    // Check if expired
    const isExpired = cert.expiresAt && new Date(cert.expiresAt) < new Date();

    res.json({
      success: true,
      valid: cert.isValid && !isExpired,
      certificate: {
        certificateNumber: cert.certificateNumber,
        courseName: cert.course?.name,
        holderName: cert.user?.name,
        issuedAt: cert.issuedAt,
        expiresAt: cert.expiresAt,
        overallGrade: cert.overallGrade,
        theoryScore: cert.theoryScore,
        practicalHours: cert.practicalHours,
        evaluatorName: cert.evaluatorName,
        testLocation: cert.testLocation,
        verificationHash: cert.verificationHash,
        isExpired,
        isRevoked: !cert.isValid
      }
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/certifications/:id - Get certification details
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const cert = await Certification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [
        { model: Course, as: 'course' },
        { model: Enrollment, as: 'enrollment' }
      ]
    });

    if (!cert) {
      return res.status(404).json({ success: false, error: 'Certification not found' });
    }

    res.json({
      success: true,
      certification: cert
    });
  } catch (error) {
    console.error('Error fetching certification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/certifications/issue - Issue certification (instructor only)
router.post('/issue', isAuthenticated, isInstructor, async (req, res) => {
  try {
    const {
      enrollmentId,
      physicalTestScore,
      evaluatorName,
      evaluatorTitle,
      testLocation,
      notes
    } = req.body;

    // Find the enrollment
    const enrollment = await Enrollment.findByPk(enrollmentId, {
      include: [
        { model: Course, as: 'course' },
        { model: User, as: 'user' }
      ]
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' });
    }

    // Check if already certified
    const existingCert = await Certification.findOne({
      where: { enrollmentId }
    });

    if (existingCert) {
      return res.status(400).json({ success: false, error: 'Student already certified for this course' });
    }

    // Verify requirements
    const course = enrollment.course;

    // Check theory score
    if (enrollment.overallTheoryScore < (course.theoryCompletionRequired || 70)) {
      return res.status(400).json({
        success: false,
        error: `Theory score ${enrollment.overallTheoryScore}% below required ${course.theoryCompletionRequired}%`
      });
    }

    // Check practical hours
    if (enrollment.practicalHoursLogged < (course.practicalHoursRequired || 40)) {
      return res.status(400).json({
        success: false,
        error: `Practical hours ${enrollment.practicalHoursLogged} below required ${course.practicalHoursRequired}`
      });
    }

    // Check physical test score
    if (physicalTestScore < 70) {
      return res.status(400).json({
        success: false,
        error: 'Physical test score must be at least 70%'
      });
    }

    // Calculate grade
    const avgScore = (enrollment.overallTheoryScore + physicalTestScore) / 2;
    let overallGrade = 'Pass';
    if (avgScore >= 90) overallGrade = 'A';
    else if (avgScore >= 80) overallGrade = 'B';
    else if (avgScore >= 70) overallGrade = 'C';
    else if (avgScore >= 60) overallGrade = 'D';

    // Create certification
    const certification = await Certification.create({
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      enrollmentId: enrollment.id,
      theoryScore: enrollment.overallTheoryScore,
      practicalHours: enrollment.practicalHoursLogged,
      physicalTestScore,
      overallGrade,
      evaluatorName: evaluatorName || req.user.name,
      evaluatorTitle,
      testLocation
    });

    // Update enrollment
    enrollment.status = 'certified';
    enrollment.certifiedAt = new Date();
    enrollment.pipelineStage = 5;  // Stage 5: Certification
    enrollment.physicalTestPassed = true;
    enrollment.physicalTestScore = physicalTestScore;
    enrollment.physicalTestNotes = notes;
    enrollment.physicalTestEvaluator = evaluatorName || req.user.name;
    await enrollment.save();

    // Update course stats
    course.certifiedCount = (course.certifiedCount || 0) + 1;
    await course.save();

    // Update user pipeline stage
    const user = await User.findByPk(enrollment.userId);
    user.pipelineStage = Math.max(user.pipelineStage, 5);
    await user.save();

    // Award credits
    await addCredits(enrollment.userId, CREDIT_VALUES.PASS_CERTIFICATION, `Certified in ${course.name}`);

    res.status(201).json({
      success: true,
      message: `Certification issued! Certificate #${certification.certificateNumber}`,
      certification
    });
  } catch (error) {
    console.error('Error issuing certification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/certifications/:id/revoke - Revoke certification (admin)
router.post('/:id/revoke', isAuthenticated, isInstructor, async (req, res) => {
  try {
    const { reason } = req.body;

    const cert = await Certification.findByPk(req.params.id);
    if (!cert) {
      return res.status(404).json({ success: false, error: 'Certification not found' });
    }

    cert.isValid = false;
    cert.revokedAt = new Date();
    cert.revokedReason = reason;
    await cert.save();

    res.json({
      success: true,
      message: 'Certification revoked',
      certification: cert
    });
  } catch (error) {
    console.error('Error revoking certification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
