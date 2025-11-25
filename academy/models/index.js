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
const Message = require('./Message');
const Community = require('./Community');
const CommunityMember = require('./CommunityMember');
const Setting = require('./Setting');
const CommunityPost = require('./CommunityPost');
const PostComment = require('./PostComment');
const PostLike = require('./PostLike');
const AICommunityTeacher = require('./AICommunityTeacher');

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

// Message -> User (sender)
User.hasMany(Message, {
  foreignKey: 'fromUserId',
  as: 'sentMessages'
});
Message.belongsTo(User, {
  foreignKey: 'fromUserId',
  as: 'sender'
});

// Message -> User (recipient)
User.hasMany(Message, {
  foreignKey: 'toUserId',
  as: 'receivedMessages'
});
Message.belongsTo(User, {
  foreignKey: 'toUserId',
  as: 'recipient'
});

// ==================== COMMUNITY ASSOCIATIONS ====================

// Community -> Owner (User/Instructor)
Community.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner'
});
User.hasMany(Community, {
  foreignKey: 'ownerId',
  as: 'ownedCommunities'
});

// Community -> Course (optional link to official course)
Community.belongsTo(Course, {
  foreignKey: 'courseId',
  as: 'linkedCourse'
});
Course.hasMany(Community, {
  foreignKey: 'courseId',
  as: 'communities'
});

// Community -> CommunityMembers (one-to-many)
Community.hasMany(CommunityMember, {
  foreignKey: 'communityId',
  as: 'memberships'
});
CommunityMember.belongsTo(Community, {
  foreignKey: 'communityId',
  as: 'community'
});

// User -> CommunityMembers (one-to-many)
User.hasMany(CommunityMember, {
  foreignKey: 'userId',
  as: 'communityMemberships'
});
CommunityMember.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Inviter relationship
User.hasMany(CommunityMember, {
  foreignKey: 'invitedBy',
  as: 'invitedMembers'
});
CommunityMember.belongsTo(User, {
  foreignKey: 'invitedBy',
  as: 'inviter'
});

// ==================== COMMUNITY POSTS ASSOCIATIONS ====================

// Community -> CommunityPosts
Community.hasMany(CommunityPost, {
  foreignKey: 'communityId',
  as: 'posts'
});
CommunityPost.belongsTo(Community, {
  foreignKey: 'communityId',
  as: 'community'
});

// User -> CommunityPosts (author)
User.hasMany(CommunityPost, {
  foreignKey: 'authorId',
  as: 'communityPosts'
});
CommunityPost.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author'
});

// CommunityPost -> Comments
CommunityPost.hasMany(PostComment, {
  foreignKey: 'postId',
  as: 'comments'
});
PostComment.belongsTo(CommunityPost, {
  foreignKey: 'postId',
  as: 'post'
});

// User -> Comments (author)
User.hasMany(PostComment, {
  foreignKey: 'authorId',
  as: 'postComments'
});
PostComment.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author'
});

// Comment -> Replies (self-referencing)
PostComment.hasMany(PostComment, {
  foreignKey: 'parentId',
  as: 'replies'
});
PostComment.belongsTo(PostComment, {
  foreignKey: 'parentId',
  as: 'parent'
});

// Likes
User.hasMany(PostLike, {
  foreignKey: 'userId',
  as: 'likes'
});
PostLike.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

CommunityPost.hasMany(PostLike, {
  foreignKey: 'postId',
  as: 'likes'
});
PostLike.belongsTo(CommunityPost, {
  foreignKey: 'postId',
  as: 'post'
});

PostComment.hasMany(PostLike, {
  foreignKey: 'commentId',
  as: 'likes'
});
PostLike.belongsTo(PostComment, {
  foreignKey: 'commentId',
  as: 'comment'
});

// ==================== AI COMMUNITY TEACHER ASSOCIATIONS ====================

// AICommunityTeacher -> Community (one-to-one, AI owns the community)
AICommunityTeacher.hasOne(Community, {
  foreignKey: 'aiTeacherId',
  as: 'community'
});
Community.belongsTo(AICommunityTeacher, {
  foreignKey: 'aiTeacherId',
  as: 'aiTeacher'
});

// AICommunityTeacher -> Course (optional, linked course)
AICommunityTeacher.belongsTo(Course, {
  foreignKey: 'courseId',
  as: 'course'
});
Course.hasOne(AICommunityTeacher, {
  foreignKey: 'courseId',
  as: 'aiTeacher'
});

// AICommunityTeacher -> CommunityPosts (AI-generated posts)
AICommunityTeacher.hasMany(CommunityPost, {
  foreignKey: 'aiTeacherId',
  as: 'posts',
  constraints: false
});
CommunityPost.belongsTo(AICommunityTeacher, {
  foreignKey: 'aiTeacherId',
  as: 'aiTeacher',
  constraints: false
});

// AICommunityTeacher -> PostComments (AI-generated comments)
AICommunityTeacher.hasMany(PostComment, {
  foreignKey: 'aiTeacherId',
  as: 'comments',
  constraints: false
});
PostComment.belongsTo(AICommunityTeacher, {
  foreignKey: 'aiTeacherId',
  as: 'aiTeacher',
  constraints: false
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
  JobApplication,
  Message,
  Community,
  CommunityMember,
  Setting,
  CommunityPost,
  PostComment,
  PostLike,
  AICommunityTeacher
};
