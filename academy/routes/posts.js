/**
 * Community Posts Routes
 * Posts and discussions within communities
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../shared/middleware/auth');
const {
  Community,
  CommunityMember,
  CommunityPost,
  PostComment,
  PostLike,
  User
} = require('../models');
const { Op } = require('sequelize');

// ==================== HELPER: Check membership ====================

async function getMembership(communityId, userId) {
  if (!userId) return null;
  return await CommunityMember.findOne({
    where: { communityId, userId, status: 'active' }
  });
}

async function canPost(communityId, userId) {
  const membership = await getMembership(communityId, userId);
  if (!membership) return false;

  const community = await Community.findByPk(communityId);
  // Check if members can post or if user is owner/admin
  if (community.settings?.allowMemberPosts ||
      ['owner', 'admin', 'moderator'].includes(membership.role)) {
    return true;
  }
  return false;
}

// ==================== GET POSTS ====================

// Get posts for a community
router.get('/community/:communityId', async (req, res) => {
  try {
    const { communityId } = req.params;
    const { type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user?.id;

    // Check if community exists
    const community = await Community.findByPk(communityId);
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    // Check if user can view (public or member)
    let canView = community.isPublic;
    if (!canView && userId) {
      const membership = await getMembership(communityId, userId);
      canView = !!membership;
    }

    if (!canView) {
      return res.status(403).json({ success: false, error: 'Join this community to view posts' });
    }

    // Build query
    const where = {
      communityId,
      status: { [Op.in]: ['published', 'pinned'] }
    };
    if (type) where.type = type;

    const { count, rows: posts } = await CommunityPost.findAndCountAll({
      where,
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] }
      ],
      order: [
        ['status', 'ASC'],  // Pinned first
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Check if user has liked each post
    if (userId && posts.length > 0) {
      const postIds = posts.map(p => p.id);
      const userLikes = await PostLike.findAll({
        where: { userId, postId: { [Op.in]: postIds } }
      });
      const likedPostIds = new Set(userLikes.map(l => l.postId));

      posts.forEach(post => {
        post.dataValues.isLiked = likedPostIds.has(post.id);
      });
    }

    res.json({
      success: true,
      posts,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single post with comments
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    const post = await CommunityPost.findByPk(postId, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
        { model: Community, as: 'community', attributes: ['id', 'name', 'slug', 'isPublic'] },
        {
          model: PostComment,
          as: 'comments',
          where: { status: 'published', parentId: null },
          required: false,
          include: [
            { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
            {
              model: PostComment,
              as: 'replies',
              where: { status: 'published' },
              required: false,
              include: [
                { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] }
              ]
            }
          ],
          order: [['createdAt', 'ASC']]
        }
      ]
    });

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Check if user can view
    let canView = post.community.isPublic;
    if (!canView && userId) {
      const membership = await getMembership(post.communityId, userId);
      canView = !!membership;
    }

    if (!canView) {
      return res.status(403).json({ success: false, error: 'Join this community to view posts' });
    }

    // Increment view count
    await post.increment('viewsCount');

    // Check if user has liked
    if (userId) {
      const like = await PostLike.findOne({ where: { userId, postId } });
      post.dataValues.isLiked = !!like;
    }

    res.json({ success: true, post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CREATE POST ====================

router.post('/community/:communityId', isAuthenticated, async (req, res) => {
  try {
    const { communityId } = req.params;
    const { title, content, type = 'discussion', attachments = [], pollOptions, pollEndsAt } = req.body;
    const userId = req.user.id;

    // Check if user can post
    if (!await canPost(communityId, userId)) {
      return res.status(403).json({ success: false, error: 'You cannot post in this community' });
    }

    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }

    const post = await CommunityPost.create({
      communityId,
      authorId: userId,
      type,
      title,
      content,
      attachments,
      pollOptions: type === 'poll' ? pollOptions : null,
      pollEndsAt: type === 'poll' ? pollEndsAt : null
    });

    // Update community post count
    await Community.increment('postCount', { where: { id: communityId } });

    // Update member's post count
    await CommunityMember.increment('postsCount', {
      where: { communityId, userId }
    });

    // Load with author
    const fullPost = await CommunityPost.findByPk(post.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] }
      ]
    });

    res.json({ success: true, post: fullPost });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== UPDATE POST ====================

router.put('/:postId', isAuthenticated, async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content, status, allowComments, isAnswered } = req.body;
    const userId = req.user.id;

    const post = await CommunityPost.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Check if user is author or moderator
    const membership = await getMembership(post.communityId, userId);
    const isOwner = post.authorId === userId;
    const isMod = membership && ['owner', 'admin', 'moderator'].includes(membership.role);

    if (!isOwner && !isMod) {
      return res.status(403).json({ success: false, error: 'Cannot edit this post' });
    }

    // Authors can edit content, mods can also change status
    if (title && isOwner) post.title = title;
    if (content && isOwner) post.content = content;
    if (allowComments !== undefined) post.allowComments = allowComments;
    if (isAnswered !== undefined && isOwner) post.isAnswered = isAnswered;
    if (status && isMod) post.status = status;

    await post.save();

    res.json({ success: true, post });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== DELETE POST ====================

router.delete('/:postId', isAuthenticated, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await CommunityPost.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Check if user is author or moderator
    const membership = await getMembership(post.communityId, userId);
    const isOwner = post.authorId === userId;
    const isMod = membership && ['owner', 'admin', 'moderator'].includes(membership.role);

    if (!isOwner && !isMod) {
      return res.status(403).json({ success: false, error: 'Cannot delete this post' });
    }

    // Soft delete
    post.status = 'deleted';
    await post.save();

    // Update community post count
    await Community.decrement('postCount', { where: { id: post.communityId } });

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== COMMENTS ====================

// Add comment to post
router.post('/:postId/comments', isAuthenticated, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user.id;

    const post = await CommunityPost.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    if (!post.allowComments) {
      return res.status(403).json({ success: false, error: 'Comments are disabled on this post' });
    }

    // Check membership
    const membership = await getMembership(post.communityId, userId);
    if (!membership) {
      return res.status(403).json({ success: false, error: 'Join the community to comment' });
    }

    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const comment = await PostComment.create({
      postId,
      authorId: userId,
      parentId: parentId || null,
      content
    });

    // Update post comment count
    await post.increment('commentsCount');

    // Update member's comment count
    await CommunityMember.increment('commentsCount', {
      where: { communityId: post.communityId, userId }
    });

    // Load with author
    const fullComment = await PostComment.findByPk(comment.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] }
      ]
    });

    res.json({ success: true, comment: fullComment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete comment
router.delete('/comments/:commentId', isAuthenticated, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await PostComment.findByPk(commentId, {
      include: [{ model: CommunityPost, as: 'post' }]
    });

    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    // Check if user is author or moderator
    const membership = await getMembership(comment.post.communityId, userId);
    const isOwner = comment.authorId === userId;
    const isMod = membership && ['owner', 'admin', 'moderator'].includes(membership.role);

    if (!isOwner && !isMod) {
      return res.status(403).json({ success: false, error: 'Cannot delete this comment' });
    }

    comment.status = 'deleted';
    await comment.save();

    // Update post comment count
    await comment.post.decrement('commentsCount');

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark comment as accepted answer
router.post('/comments/:commentId/accept', isAuthenticated, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await PostComment.findByPk(commentId, {
      include: [{ model: CommunityPost, as: 'post' }]
    });

    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    // Only post author can accept answers
    if (comment.post.authorId !== userId) {
      return res.status(403).json({ success: false, error: 'Only the question author can accept answers' });
    }

    // Unmark previous accepted answer
    await PostComment.update(
      { isAcceptedAnswer: false },
      { where: { postId: comment.postId } }
    );

    // Mark this as accepted
    comment.isAcceptedAnswer = true;
    await comment.save();

    // Mark post as answered
    comment.post.isAnswered = true;
    await comment.post.save();

    res.json({ success: true, comment });
  } catch (error) {
    console.error('Accept answer error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== LIKES ====================

// Like/unlike post
router.post('/:postId/like', isAuthenticated, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await CommunityPost.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Check membership
    const membership = await getMembership(post.communityId, userId);
    if (!membership) {
      return res.status(403).json({ success: false, error: 'Join the community to like posts' });
    }

    // Check if already liked
    const existingLike = await PostLike.findOne({ where: { userId, postId } });

    if (existingLike) {
      // Unlike
      await existingLike.destroy();
      await post.decrement('likesCount');
      res.json({ success: true, liked: false, likesCount: post.likesCount - 1 });
    } else {
      // Like
      await PostLike.create({ userId, postId });
      await post.increment('likesCount');
      res.json({ success: true, liked: true, likesCount: post.likesCount + 1 });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Like/unlike comment
router.post('/comments/:commentId/like', isAuthenticated, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await PostComment.findByPk(commentId, {
      include: [{ model: CommunityPost, as: 'post' }]
    });

    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    // Check membership
    const membership = await getMembership(comment.post.communityId, userId);
    if (!membership) {
      return res.status(403).json({ success: false, error: 'Join the community to like comments' });
    }

    // Check if already liked
    const existingLike = await PostLike.findOne({ where: { userId, commentId } });

    if (existingLike) {
      await existingLike.destroy();
      await comment.decrement('likesCount');
      res.json({ success: true, liked: false, likesCount: comment.likesCount - 1 });
    } else {
      await PostLike.create({ userId, commentId });
      await comment.increment('likesCount');
      res.json({ success: true, liked: true, likesCount: comment.likesCount + 1 });
    }
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
