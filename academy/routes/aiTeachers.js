/**
 * AI Community Teachers Routes
 * API endpoints for AI teacher management and interactions
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin, isInstructor } = require('../../shared/middleware/auth');
const {
  AICommunityTeacher,
  Community,
  CommunityMember,
  CommunityPost,
  PostComment,
  Course,
  User
} = require('../models');
const aiTeacherService = require('../services/aiCommunityTeacher');

// ==================== PUBLIC ROUTES ====================

// Get all AI teachers
router.get('/', async (req, res) => {
  try {
    const teachers = await AICommunityTeacher.findAll({
      where: { isActive: true },
      include: [
        { model: Community, as: 'community', attributes: ['id', 'name', 'slug', 'memberCount'] },
        { model: Course, as: 'course', attributes: ['id', 'name'] }
      ],
      attributes: { exclude: ['systemPrompt'] } // Don't expose system prompt publicly
    });

    res.json({ success: true, teachers });
  } catch (error) {
    console.error('Get AI teachers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single AI teacher
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const where = isNaN(idOrSlug) ? { slug: idOrSlug } : { id: idOrSlug };

    const teacher = await AICommunityTeacher.findOne({
      where,
      include: [
        { model: Community, as: 'community' },
        { model: Course, as: 'course', attributes: ['id', 'name', 'description'] }
      ],
      attributes: { exclude: ['systemPrompt'] }
    });

    if (!teacher) {
      return res.status(404).json({ success: false, error: 'AI Teacher not found' });
    }

    res.json({ success: true, teacher });
  } catch (error) {
    console.error('Get AI teacher error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== STUDENT INTERACTION ROUTES ====================

// Ask AI Teacher a question (in their community)
router.post('/:teacherId/ask', isAuthenticated, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { question, postId } = req.body;
    const userId = req.user.id;

    if (!question) {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    const teacher = await aiTeacherService.getAITeacher(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'AI Teacher not found' });
    }

    // Check if user is member of the teacher's community
    if (teacher.communityId) {
      const membership = await CommunityMember.findOne({
        where: { communityId: teacher.communityId, userId, status: 'active' }
      });
      if (!membership) {
        return res.status(403).json({ success: false, error: 'Join the community to ask questions' });
      }
    }

    // Get post context if provided
    let postContext = null;
    if (postId) {
      const post = await CommunityPost.findByPk(postId);
      if (post) {
        postContext = { title: post.title, content: post.content };
      }
    }

    // Get student info
    const student = await User.findByPk(userId, { attributes: ['name'] });

    // Get AI response
    const response = await aiTeacherService.getTeacherResponse(teacherId, question, {
      studentName: student?.name,
      postContext
    });

    res.json(response);
  } catch (error) {
    console.error('Ask AI teacher error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Teacher auto-reply to a comment (triggered when student comments)
router.post('/auto-reply/:postId', isAuthenticated, async (req, res) => {
  try {
    const { postId } = req.params;
    const { commentContent } = req.body;

    const post = await CommunityPost.findByPk(postId, {
      include: [{ model: Community, as: 'community' }]
    });

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Check if this is an AI community
    if (!post.community.isAIOwned) {
      return res.status(400).json({ success: false, error: 'Not an AI community' });
    }

    const teacher = await aiTeacherService.getTeacherForCommunity(post.communityId);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'AI Teacher not found' });
    }

    // Generate AI response
    const response = await aiTeacherService.getTeacherResponse(teacher.id, commentContent, {
      studentName: req.user.name,
      postContext: { title: post.title, content: post.content }
    });

    if (response.success) {
      // Create AI comment as reply
      const aiComment = await PostComment.create({
        postId: post.id,
        authorId: null, // No human author
        content: response.content,
        isAIGenerated: true,
        aiTeacherId: teacher.id
      });

      // Update post comment count
      await post.increment('commentsCount');

      res.json({
        success: true,
        comment: {
          ...aiComment.toJSON(),
          author: {
            name: teacher.name,
            avatar: teacher.avatar,
            isAI: true
          }
        }
      });
    } else {
      res.json(response);
    }
  } catch (error) {
    console.error('Auto-reply error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

// Create new AI Teacher (Admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    const {
      name,
      slug,
      expertise,
      personality,
      systemPrompt,
      welcomeMessage,
      curriculum,
      modelSettings,
      courseId
    } = req.body;

    if (!name || !expertise || !systemPrompt) {
      return res.status(400).json({
        success: false,
        error: 'Name, expertise, and system prompt are required'
      });
    }

    // Generate slug if not provided
    const teacherSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    // Create the AI Teacher
    const teacher = await AICommunityTeacher.create({
      name,
      slug: teacherSlug,
      expertise,
      personality: personality || { style: 'helpful', tone: 'encouraging', language: 'multilingual' },
      systemPrompt,
      welcomeMessage,
      curriculum: curriculum || { modules: [], keyTopics: [], resources: [] },
      modelSettings: modelSettings || { model: 'deepseek-chat', temperature: 0.7, maxTokens: 1500 },
      courseId
    });

    // Create community for this AI Teacher
    const community = await Community.create({
      name: `${name}'s Classroom`,
      slug: `${teacherSlug}-classroom`,
      description: `Learn ${expertise} with ${name}, your AI instructor. Ask questions, participate in discussions, and master new skills!`,
      ownerId: null, // No human owner
      aiTeacherId: teacher.id,
      isAIOwned: true,
      type: 'learning',
      isPublic: true,
      courseId,
      settings: {
        allowMemberPosts: true,
        allowMemberComments: true,
        welcomeMessage: welcomeMessage || `Welcome! I'm ${name}, your AI instructor for ${expertise}. Feel free to ask questions!`
      }
    });

    // Update teacher with community ID
    await teacher.update({ communityId: community.id });

    res.json({
      success: true,
      teacher: await AICommunityTeacher.findByPk(teacher.id, {
        include: [{ model: Community, as: 'community' }]
      })
    });
  } catch (error) {
    console.error('Create AI teacher error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update AI Teacher
router.put('/:teacherId', isAdmin, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const updates = req.body;

    const teacher = await AICommunityTeacher.findByPk(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'AI Teacher not found' });
    }

    // Update allowed fields
    const allowedFields = [
      'name', 'expertise', 'personality', 'systemPrompt', 'welcomeMessage',
      'curriculum', 'modelSettings', 'avatar', 'title', 'isActive'
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        teacher[field] = updates[field];
      }
    }

    await teacher.save();

    res.json({ success: true, teacher });
  } catch (error) {
    console.error('Update AI teacher error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update AI Teacher's curriculum
router.put('/:teacherId/curriculum', isAdmin, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { modules, keyTopics, resources, assessmentTopics } = req.body;

    const teacher = await AICommunityTeacher.findByPk(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'AI Teacher not found' });
    }

    const curriculum = { ...teacher.curriculum };
    if (modules) curriculum.modules = modules;
    if (keyTopics) curriculum.keyTopics = keyTopics;
    if (resources) curriculum.resources = resources;
    if (assessmentTopics) curriculum.assessmentTopics = assessmentTopics;

    await teacher.update({ curriculum });

    res.json({ success: true, curriculum });
  } catch (error) {
    console.error('Update curriculum error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate lesson post (Admin triggers AI to create educational content)
router.post('/:teacherId/generate-lesson', isAdmin, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { topic, moduleIndex, lessonType } = req.body;

    const result = await aiTeacherService.generateLessonPost(teacherId, {
      topic,
      moduleIndex,
      lessonType // lesson, exercise, quiz
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Optionally auto-publish the lesson as a post
    if (req.body.autoPublish) {
      const teacher = await AICommunityTeacher.findByPk(teacherId);
      if (teacher?.communityId) {
        const post = await CommunityPost.create({
          communityId: teacher.communityId,
          authorId: null,
          title: result.lesson.title,
          content: result.lesson.content,
          type: result.lesson.type,
          isAIGenerated: true,
          aiTeacherId: teacherId,
          status: 'published'
        });

        await Community.increment('postCount', { where: { id: teacher.communityId } });

        result.post = post;
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Generate lesson error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get AI Teacher stats
router.get('/:teacherId/stats', isAdmin, async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await AICommunityTeacher.findByPk(teacherId, {
      include: [{ model: Community, as: 'community' }]
    });

    if (!teacher) {
      return res.status(404).json({ success: false, error: 'AI Teacher not found' });
    }

    // Get post count for this teacher's community
    const postCount = teacher.communityId
      ? await CommunityPost.count({ where: { communityId: teacher.communityId } })
      : 0;

    // Get AI-generated posts
    const aiPostCount = await CommunityPost.count({
      where: { aiTeacherId: teacherId, isAIGenerated: true }
    });

    res.json({
      success: true,
      stats: {
        totalResponses: teacher.totalResponses,
        totalPosts: teacher.totalPosts,
        communityMembers: teacher.community?.memberCount || 0,
        communityPosts: postCount,
        aiGeneratedPosts: aiPostCount
      }
    });
  } catch (error) {
    console.error('Get AI teacher stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete AI Teacher (Admin only)
router.delete('/:teacherId', isAdmin, async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await AICommunityTeacher.findByPk(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'AI Teacher not found' });
    }

    // Soft delete - just deactivate
    await teacher.update({ isActive: false });

    res.json({ success: true, message: 'AI Teacher deactivated' });
  } catch (error) {
    console.error('Delete AI teacher error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
