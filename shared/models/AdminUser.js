/**
 * AdminUser Model
 * Separate authentication for ecosystem administrators
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const AdminUser = sequelize.define('AdminUser', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      isAlphanumeric: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'admin', 'moderator'),
    defaultValue: 'admin'
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: ['vpn', 'trivia', 'academy', 'users']
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    field: 'last_login_at'
  },
  lastLoginIp: {
    type: DataTypes.STRING(45),
    field: 'last_login_ip'
  }
}, {
  tableName: 'admin_users',
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to verify password
AdminUser.prototype.verifyPassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Instance method to check permission
AdminUser.prototype.hasPermission = function(permission) {
  if (this.role === 'super_admin') return true;
  return this.permissions && this.permissions.includes(permission);
};

// Class method to find by credentials
AdminUser.findByCredentials = async function(username, password) {
  const user = await this.findOne({
    where: {
      username,
      isActive: true
    }
  });

  if (!user) {
    return null;
  }

  const isValid = await user.verifyPassword(password);
  if (!isValid) {
    return null;
  }

  return user;
};

module.exports = AdminUser;
