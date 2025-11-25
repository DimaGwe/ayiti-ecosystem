/**
 * Community Routes - Teacher-led learning communities
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../shared/middleware/auth');
const { User, Course, Community, CommunityMember, AICommunityTeacher } = require('../models');
const { Op } = require('sequelize');

// ==================== PUBLIC ROUTES ====================

// Get all public communities
router.get('/', async (req, res) => {
  try {
    const { courseId, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = { isActive: true, isPublic: true };
    if (courseId) where.courseId = courseId;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: communities } = await Community.findAndCountAll({
      where,
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'avatar'] },
        { model: Course, as: 'linkedCourse', attributes: ['id', 'name'] },
        { model: AICommunityTeacher, as: 'aiTeacher', attributes: ['id', 'name', 'avatar', 'expertise', 'welcomeMessage'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['memberCount', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      communities,
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

// Get community by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const community = await Community.findOne({
      where: { slug: req.params.slug, isActive: true },
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'avatar', 'bio'] },
        { model: Course, as: 'linkedCourse', attributes: ['id', 'name', 'thumbnail'] },
        { model: AICommunityTeacher, as: 'aiTeacher', attributes: ['id', 'name', 'avatar', 'expertise', 'welcomeMessage', 'title'] }
      ]
    });

    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    // Check if requester is a member (if authenticated)
    let membership = null;
    if (req.user) {
      membership = await CommunityMember.findOne({
        where: { communityId: community.id, userId: req.user.id }
      });
    }

    res.json({
      success: true,
      community,
      membership: membership ? {
        role: membership.role,
        status: membership.status,
        joinedAt: membership.createdAt
      } : null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get community by ID
router.get('/:id', async (req, res) => {
  try {
    const community = await Community.findByPk(req.params.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'avatar', 'bio'] },
        { model: Course, as: 'linkedCourse', attributes: ['id', 'name', 'thumbnail'] },
        { model: AICommunityTeacher, as: 'aiTeacher', attributes: ['id', 'name', 'avatar', 'expertise', 'welcomeMessage', 'title'] }
      ]
    });

    if (!community || !community.isActive) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    res.json({ success: true, community });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AUTHENTICATED ROUTES ====================

// Get user's communities
router.get('/my/memberships', isAuthenticated, async (req, res) => {
  try {
    const memberships = await CommunityMember.findAll({
      where: { userId: req.user.id, status: 'active' },
      include: [{
        model: Community,
        as: 'community',
        include: [
          { model: User, as: 'owner', attributes: ['id', 'name', 'avatar'] }
        ]
      }],
      order: [['lastActiveAt', 'DESC']]
    });

    res.json({
      success: true,
      memberships: memberships.map(m => ({
        ...m.community.toJSON(),
        membership: {
          role: m.role,
          status: m.status,
          joinedAt: m.createdAt,
          lastActiveAt: m.lastActiveAt
        }
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get communities owned by user
router.get('/my/owned', isAuthenticated, async (req, res) => {
  try {
    const communities = await Community.findAll({
      where: { ownerId: req.user.id },
      include: [
        { model: Course, as: 'linkedCourse', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, communities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create community (instructors/admins only)
router.post('/', isAuthenticated, async (req, res) => {
  try {
    // Check if user is instructor or admin
    if (!['instructor', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Only instructors can create communities'
      });
    }

    const {
      name,
      description,
      thumbnail,
      coverImage,
      courseId,
      type = 'learning',
      isPublic = true,
      requiresApproval = false,
      isInviteOnly = false
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Community name is required' });
    }

    // Create community
    const community = await Community.create({
      name,
      description,
      thumbnail,
      coverImage,
      ownerId: req.user.id,
      courseId: courseId || null,
      type,
      isPublic,
      requiresApproval,
      isInviteOnly
    });

    // Add owner as member with 'owner' role
    await CommunityMember.create({
      communityId: community.id,
      userId: req.user.id,
      role: 'owner',
      status: 'active',
      joinMethod: 'auto'
    });

    // Update member count
    community.memberCount = 1;
    await community.save();

    res.json({ success: true, community });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update community (owner only)
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const community = await Community.findByPk(req.params.id);

    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    // Check ownership
    if (community.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const allowedFields = [
      'name', 'description', 'thumbnail', 'coverImage', 'courseId',
      'type', 'isPublic', 'requiresApproval', 'isInviteOnly', 'settings'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        community[field] = req.body[field];
      }
    });

    await community.save();

    res.json({ success: true, community });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Join community
router.post('/:id/join', isAuthenticated, async (req, res) => {
  try {
    const community = await Community.findByPk(req.params.id);

    if (!community || !community.isActive) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    // Check if already a member
    const existing = await CommunityMember.findOne({
      where: { communityId: community.id, userId: req.user.id }
    });

    if (existing) {
      if (existing.status === 'active') {
        return res.status(400).json({ success: false, error: 'Already a member' });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({ success: false, error: 'Join request pending' });
      }
      // Re-activate if left
      existing.status = community.requiresApproval ? 'pending' : 'active';
      existing.joinMethod = 'direct';
      await existing.save();

      if (existing.status === 'active') {
        community.memberCount += 1;
        await community.save();
      }

      return res.json({
        success: true,
        status: existing.status,
        message: existing.status === 'pending' ? 'Join request submitted' : 'Joined successfully'
      });
    }

    // Check if invite-only
    if (community.isInviteOnly) {
      return res.status(403).json({
        success: false,
        error: 'This community is invite-only'
      });
    }

    // Create membership
    const membership = await CommunityMember.create({
      communityId: community.id,
      userId: req.user.id,
      role: 'member',
      status: community.requiresApproval ? 'pending' : 'active',
      joinMethod: 'direct'
    });

    // Update member count if active
    if (membership.status === 'active') {
      community.memberCount += 1;
      await community.save();
    }

    res.json({
      success: true,
      status: membership.status,
      message: membership.status === 'pending' ? 'Join request submitted' : 'Joined successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Join via invite code
router.post('/join/:inviteCode', isAuthenticated, async (req, res) => {
  try {
    const community = await Community.findOne({
      where: { inviteCode: req.params.inviteCode, isActive: true }
    });

    if (!community) {
      return res.status(404).json({ success: false, error: 'Invalid invite code' });
    }

    // Check if already a member
    const existing = await CommunityMember.findOne({
      where: { communityId: community.id, userId: req.user.id }
    });

    if (existing && existing.status === 'active') {
      return res.status(400).json({ success: false, error: 'Already a member' });
    }

    if (existing) {
      existing.status = 'active';
      existing.joinMethod = 'invite';
      await existing.save();
    } else {
      await CommunityMember.create({
        communityId: community.id,
        userId: req.user.id,
        role: 'member',
        status: 'active',
        joinMethod: 'invite'
      });
    }

    community.memberCount += 1;
    await community.save();

    res.json({
      success: true,
      community: {
        id: community.id,
        name: community.name,
        slug: community.slug
      },
      message: 'Joined successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Leave community
router.post('/:id/leave', isAuthenticated, async (req, res) => {
  try {
    const membership = await CommunityMember.findOne({
      where: { communityId: req.params.id, userId: req.user.id }
    });

    if (!membership) {
      return res.status(404).json({ success: false, error: 'Not a member' });
    }

    if (membership.role === 'owner') {
      return res.status(400).json({
        success: false,
        error: 'Owner cannot leave. Transfer ownership first.'
      });
    }

    const wasActive = membership.status === 'active';
    membership.status = 'left';
    await membership.save();

    // Update member count
    if (wasActive) {
      await Community.decrement('memberCount', {
        where: { id: req.params.id }
      });
    }

    res.json({ success: true, message: 'Left community' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get community members (for community admins/owners)
router.get('/:id/members', isAuthenticated, async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Check if user is owner/admin of community
    const membership = await CommunityMember.findOne({
      where: { communityId: req.params.id, userId: req.user.id }
    });

    if (!membership || !['owner', 'admin', 'moderator'].includes(membership.role)) {
      // Only show active members for regular members
      if (status !== 'active') {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }
    }

    const where = { communityId: req.params.id };
    if (status) where.status = status;

    const { count, rows: members } = await CommunityMember.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'avatar', 'role']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['role', 'ASC'], ['createdAt', 'ASC']]
    });

    res.json({
      success: true,
      members,
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

// Approve/reject join request (owner/admin only)
router.put('/:id/members/:userId', isAuthenticated, async (req, res) => {
  try {
    const { action, role } = req.body; // action: 'approve', 'reject', 'promote', 'demote', 'remove'

    // Check if user is owner/admin
    const adminMembership = await CommunityMember.findOne({
      where: { communityId: req.params.id, userId: req.user.id }
    });

    if (!adminMembership || !['owner', 'admin'].includes(adminMembership.role)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const membership = await CommunityMember.findOne({
      where: { communityId: req.params.id, userId: req.params.userId }
    });

    if (!membership) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    // Prevent modifying owner
    if (membership.role === 'owner') {
      return res.status(400).json({ success: false, error: 'Cannot modify owner' });
    }

    const community = await Community.findByPk(req.params.id);

    switch (action) {
      case 'approve':
        if (membership.status !== 'pending') {
          return res.status(400).json({ success: false, error: 'No pending request' });
        }
        membership.status = 'active';
        community.memberCount += 1;
        await community.save();
        break;

      case 'reject':
        if (membership.status !== 'pending') {
          return res.status(400).json({ success: false, error: 'No pending request' });
        }
        await membership.destroy();
        return res.json({ success: true, message: 'Request rejected' });

      case 'promote':
        if (!role || !['moderator', 'admin'].includes(role)) {
          return res.status(400).json({ success: false, error: 'Invalid role' });
        }
        // Only owner can promote to admin
        if (role === 'admin' && adminMembership.role !== 'owner') {
          return res.status(403).json({ success: false, error: 'Only owner can promote to admin' });
        }
        membership.role = role;
        break;

      case 'demote':
        membership.role = 'member';
        break;

      case 'remove':
        const wasActive = membership.status === 'active';
        await membership.destroy();
        if (wasActive) {
          community.memberCount -= 1;
          await community.save();
        }
        return res.json({ success: true, message: 'Member removed' });

      default:
        return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    await membership.save();
    res.json({ success: true, membership });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Regenerate invite code (owner only)
router.post('/:id/regenerate-invite', isAuthenticated, async (req, res) => {
  try {
    const community = await Community.findByPk(req.params.id);

    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    if (community.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Generate new invite code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    community.inviteCode = code;
    await community.save();

    res.json({ success: true, inviteCode: code });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
