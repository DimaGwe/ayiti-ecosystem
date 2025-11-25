/**
 * PostLike Model
 * Likes on posts and comments
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const PostLike = sequelize.define('PostLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // Either postId or commentId (not both)
  postId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  commentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'post_likes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'postId'],
      where: { postId: { [require('sequelize').Op.ne]: null } }
    },
    {
      unique: true,
      fields: ['userId', 'commentId'],
      where: { commentId: { [require('sequelize').Op.ne]: null } }
    }
  ]
});

module.exports = PostLike;
