/**
 * Certification Model
 * Official certificates issued to graduates
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const Certification = sequelize.define('Certification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  courseId: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  enrollmentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // Certificate details
  certificateNumber: {
    type: DataTypes.STRING(50),
    unique: true
    // Format: HSA-AGRICULTURE-2025-00001
  },
  // Scores achieved
  theoryScore: {
    type: DataTypes.INTEGER
  },
  practicalHours: {
    type: DataTypes.FLOAT
  },
  physicalTestScore: {
    type: DataTypes.INTEGER
  },
  overallGrade: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D', 'Pass'),
    defaultValue: 'Pass'
  },
  // Evaluator info
  evaluatorName: {
    type: DataTypes.STRING(100)
  },
  evaluatorTitle: {
    type: DataTypes.STRING(100)
  },
  testLocation: {
    type: DataTypes.STRING(200)
  },
  // Dates
  issuedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expiresAt: {
    type: DataTypes.DATE  // null = never expires
  },
  // Verification
  isValid: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  revokedAt: {
    type: DataTypes.DATE
  },
  revokedReason: {
    type: DataTypes.TEXT
  },
  // Digital signature/hash for verification
  verificationHash: {
    type: DataTypes.STRING(64)
  }
}, {
  tableName: 'certifications',
  timestamps: true
});

// Generate certificate number before create
Certification.beforeCreate(async (cert) => {
  const year = new Date().getFullYear();
  const count = await Certification.count({
    where: { courseId: cert.courseId }
  });
  const courseCode = cert.courseId.toUpperCase().replace('-', '');
  cert.certificateNumber = `HSA-${courseCode}-${year}-${String(count + 1).padStart(5, '0')}`;

  // Generate verification hash
  const crypto = require('crypto');
  cert.verificationHash = crypto
    .createHash('sha256')
    .update(`${cert.certificateNumber}-${cert.userId}-${cert.courseId}-${Date.now()}`)
    .digest('hex')
    .substring(0, 16);
});

module.exports = Certification;
