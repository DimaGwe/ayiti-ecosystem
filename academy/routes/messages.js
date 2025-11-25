/**
 * Messages Routes
 * Handles inbox messages and AI Tutor interactions
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Message, User, Enrollment, Course } = require('../models');
const { getAIResponse } = require('../services/aiTutor');
const { isAuthenticated } = require('../../shared/middleware/auth');

// All routes require authentication
router.use(isAuthenticated);

/**
 * GET /api/messages
 * Get all conversations for the current user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get unique conversations
    const messages = await Message.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { fromUserId: userId },
          { toUserId: userId }
        ]
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] },
        { model: User, as: 'recipient', attributes: ['id', 'name', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Group by conversationId and get latest message per conversation
    const conversations = {};
    for (const msg of messages) {
      if (!conversations[msg.conversationId]) {
        conversations[msg.conversationId] = {
          conversationId: msg.conversationId,
          lastMessage: msg,
          isAIConversation: msg.isFromAI || msg.toUserId === null,
          unreadCount: 0
        };
      }
      if (!msg.read && msg.toUserId === userId) {
        conversations[msg.conversationId].unreadCount++;
      }
    }

    res.json({
      success: true,
      conversations: Object.values(conversations)
    });

  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/messages/conversation/:conversationId
 * Get all messages in a conversation
 */
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const messages = await Message.findAll({
      where: { conversationId },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Verify user has access to this conversation
    const hasAccess = messages.some(m =>
      m.fromUserId === userId || m.toUserId === userId
    );

    if (!hasAccess && messages.length > 0) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Mark messages as read
    await Message.update(
      { read: true },
      { where: { conversationId, toUserId: userId, read: false } }
    );

    res.json({
      success: true,
      messages
    });

  } catch (err) {
    console.error('Error fetching conversation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/messages/ai-tutor
 * Send a message to AI Tutor and get response
 */
router.post('/ai-tutor', async (req, res) => {
  try {
    const { content, courseContext, conversationId } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message content is required' });
    }

    // Use existing conversation or create new one
    const convId = conversationId || `ai-${userId}-${uuidv4().slice(0, 8)}`;

    // Get student's enrolled courses for context
    const enrollments = await Enrollment.findAll({
      where: { userId },
      include: [{ model: Course, as: 'course', attributes: ['id', 'name'] }]
    });
    const enrolledCourses = enrollments.map(e => e.course?.name).filter(Boolean);

    // Get conversation history
    const history = await Message.findAll({
      where: { conversationId: convId },
      order: [['createdAt', 'ASC']],
      limit: 20
    });

    // Save user's message
    const userMessage = await Message.create({
      fromUserId: userId,
      toUserId: null,  // null = AI Tutor
      content: content.trim(),
      isFromAI: false,
      courseContext,
      conversationId: convId,
      read: true
    });

    // Get AI response
    const aiResult = await getAIResponse(
      content.trim(),
      history,
      {
        courseContext,
        studentName: req.user.name,
        enrolledCourses
      }
    );

    // Save AI response
    const aiMessage = await Message.create({
      fromUserId: null,  // null = AI Tutor
      toUserId: userId,
      content: aiResult.content,
      isFromAI: true,
      courseContext,
      conversationId: convId,
      read: false,
      metadata: aiResult.metadata || null
    });

    res.json({
      success: true,
      conversationId: convId,
      userMessage,
      aiMessage,
      metadata: aiResult.metadata
    });

  } catch (err) {
    console.error('Error in AI Tutor:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/messages
 * Send a message to another user (for future use)
 */
router.post('/', async (req, res) => {
  try {
    const { toUserId, content, conversationId } = req.body;
    const fromUserId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message content is required' });
    }

    if (!toUserId) {
      return res.status(400).json({ success: false, error: 'Recipient is required' });
    }

    // Generate or use existing conversation ID
    const convId = conversationId || `dm-${Math.min(fromUserId, toUserId)}-${Math.max(fromUserId, toUserId)}`;

    const message = await Message.create({
      fromUserId,
      toUserId,
      content: content.trim(),
      isFromAI: false,
      conversationId: convId,
      read: false
    });

    res.json({
      success: true,
      message
    });

  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/messages/unread-count
 * Get count of unread messages
 */
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Message.count({
      where: {
        toUserId: req.user.id,
        read: false
      }
    });

    res.json({ success: true, count });

  } catch (err) {
    console.error('Error getting unread count:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/messages/conversation/:conversationId
 * Delete a conversation
 */
router.delete('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const message = await Message.findOne({
      where: {
        conversationId,
        [require('sequelize').Op.or]: [
          { fromUserId: userId },
          { toUserId: userId }
        ]
      }
    });

    if (!message) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    await Message.destroy({ where: { conversationId } });

    res.json({ success: true, message: 'Conversation deleted' });

  } catch (err) {
    console.error('Error deleting conversation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
