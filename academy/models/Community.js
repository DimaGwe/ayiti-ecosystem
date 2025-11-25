/**
 * Community Model
 * Teacher-led learning communities (Skool-style)
 * Teachers create communities, students join to learn
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const Community = sequelize.define('Community', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  },
  thumbnail: {
    type: DataTypes.STRING(255)
  },
  coverImage: {
    type: DataTypes.STRING(255)
  },
  // Owner (teacher/instructor) - can be null if AI-owned
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // AI Teacher owner (if community is AI-taught)
  aiTeacherId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // Flag to indicate AI-owned community
  isAIOwned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Related official course (optional - for supplemental communities)
  courseId: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  // Community type
  type: {
    type: DataTypes.ENUM('learning', 'discussion', 'project', 'mentorship'),
    defaultValue: 'learning'
  },
  // Access settings
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true  // Anyone can see, but may need approval to join
  },
  requiresApproval: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Invite-only communities
  isInviteOnly: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  inviteCode: {
    type: DataTypes.STRING(20),
    unique: true
  },
  // Stats
  memberCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  postCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Settings (JSON for flexibility)
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      allowMemberPosts: true,
      allowMemberComments: true,
      notifyOnNewMembers: true,
      welcomeMessage: null
    }
  }
}, {
  tableName: 'communities',
  timestamps: true,
  hooks: {
    beforeCreate: (community) => {
      // Generate invite code if not set
      if (!community.inviteCode) {
        community.inviteCode = generateInviteCode();
      }
      // Generate slug from name if not set
      if (!community.slug) {
        community.slug = slugify(community.name);
      }
    }
  }
});

// Helper functions
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .substring(0, 100);
}

module.exports = Community;
