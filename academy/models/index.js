/**
 * Academy Models Index
 * Sets up all model associations
 */

const sequelize = require('../../shared/config/database');
const User = require('../../shared/models/User');
const Course = require('./Course');
const Module = require('./Module');
const Enrollment = require('./Enrollment');
const Certification = require('./Certification');
const Company = require('./Company');
const JobPosting = require('./JobPosting');
const JobApplication = require('./JobApplication');

// ==================== ASSOCIATIONS ====================

// Course -> Modules (one-to-many)
Course.hasMany(Module, {
  foreignKey: 'courseId',
  as: 'modules'
});
Module.belongsTo(Course, {
  foreignKey: 'courseId',
  as: 'course'
});

// User -> Enrollments (one-to-many)
User.hasMany(Enrollment, {
  foreignKey: 'userId',
  as: 'enrollments'
});
Enrollment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Course -> Enrollments (one-to-many)
Course.hasMany(Enrollment, {
  foreignKey: 'courseId',
  as: 'enrollments'
});
Enrollment.belongsTo(Course, {
  foreignKey: 'courseId',
  as: 'course'
});

// User -> Certifications (one-to-many)
User.hasMany(Certification, {
  foreignKey: 'userId',
  as: 'certifications'
});
Certification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Course -> Certifications (one-to-many)
Course.hasMany(Certification, {
  foreignKey: 'courseId',
  as: 'certifications'
});
Certification.belongsTo(Course, {
  foreignKey: 'courseId',
  as: 'course'
});

// Enrollment -> Certification (one-to-one)
Enrollment.hasOne(Certification, {
  foreignKey: 'enrollmentId',
  as: 'certification'
});
Certification.belongsTo(Enrollment, {
  foreignKey: 'enrollmentId',
  as: 'enrollment'
});

// Company -> Course (each company hires from a course)
Company.belongsTo(Course, {
  foreignKey: 'courseLink',
  targetKey: 'id',
  as: 'linkedCourse'
});
Course.hasOne(Company, {
  foreignKey: 'courseLink',
  sourceKey: 'id',
  as: 'hiringCompany'
});

// Company -> JobPostings (one-to-many)
Company.hasMany(JobPosting, {
  foreignKey: 'companyId',
  as: 'jobPostings'
});
JobPosting.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company'
});

// Course -> JobPostings (required certification)
Course.hasMany(JobPosting, {
  foreignKey: 'requiredCourseId',
  as: 'jobPostings'
});
JobPosting.belongsTo(Course, {
  foreignKey: 'requiredCourseId',
  as: 'requiredCourse'
});

// User -> JobApplications (one-to-many)
User.hasMany(JobApplication, {
  foreignKey: 'userId',
  as: 'jobApplications'
});
JobApplication.belongsTo(User, {
  foreignKey: 'userId',
  as: 'applicant'
});

// JobPosting -> JobApplications (one-to-many)
JobPosting.hasMany(JobApplication, {
  foreignKey: 'jobPostingId',
  as: 'applications'
});
JobApplication.belongsTo(JobPosting, {
  foreignKey: 'jobPostingId',
  as: 'jobPosting'
});

// Certification -> JobApplications (one-to-many)
Certification.hasMany(JobApplication, {
  foreignKey: 'certificationId',
  as: 'jobApplications'
});
JobApplication.belongsTo(Certification, {
  foreignKey: 'certificationId',
  as: 'certification'
});

// User as Mentor -> Enrollments
User.hasMany(Enrollment, {
  foreignKey: 'mentorId',
  as: 'mentees'
});
Enrollment.belongsTo(User, {
  foreignKey: 'mentorId',
  as: 'mentor'
});

// Company -> Owner (User)
Company.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner'
});
User.hasMany(Company, {
  foreignKey: 'ownerId',
  as: 'ownedCompanies'
});

// ==================== EXPORTS ====================

module.exports = {
  sequelize,
  User,
  Course,
  Module,
  Enrollment,
  Certification,
  Company,
  JobPosting,
  JobApplication
};
