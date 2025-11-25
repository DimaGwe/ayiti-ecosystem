/**
 * Create Admin User Script
 * Usage: node scripts/create-admin.js <username> <email> <password> [name] [role]
 *
 * Example:
 *   node scripts/create-admin.js admin admin@ayiti.com SecurePass123 "Super Admin" super_admin
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const sequelize = require('../../shared/config/database');
const AdminUser = require('../../shared/models/AdminUser');

async function createAdmin() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log(`
Usage: node scripts/create-admin.js <username> <email> <password> [name] [role]

Arguments:
  username  - Admin username (alphanumeric, 3-50 chars)
  email     - Admin email address
  password  - Admin password (min 8 chars recommended)
  name      - Display name (optional, defaults to username)
  role      - Role: super_admin, admin, or moderator (optional, defaults to admin)

Example:
  node scripts/create-admin.js admin admin@example.com MySecurePass123 "Admin User" super_admin
    `);
    process.exit(1);
  }

  const [username, email, password, name, role] = args;

  // Validate
  if (password.length < 6) {
    console.error('Error: Password must be at least 6 characters');
    process.exit(1);
  }

  const validRoles = ['super_admin', 'admin', 'moderator'];
  if (role && !validRoles.includes(role)) {
    console.error(`Error: Invalid role. Must be one of: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  try {
    // Sync database
    await sequelize.sync();

    // Check if username exists
    const existing = await AdminUser.findOne({ where: { username } });
    if (existing) {
      console.error(`Error: Username "${username}" already exists`);
      process.exit(1);
    }

    // Check if email exists
    const existingEmail = await AdminUser.findOne({ where: { email } });
    if (existingEmail) {
      console.error(`Error: Email "${email}" already exists`);
      process.exit(1);
    }

    // Create admin user
    const admin = await AdminUser.create({
      username,
      email,
      password, // Will be hashed by model hook
      name: name || username,
      role: role || 'admin',
      permissions: ['vpn', 'trivia', 'academy', 'users'],
      isActive: true
    });

    console.log(`
Admin user created successfully!

  ID:       ${admin.id}
  Username: ${admin.username}
  Email:    ${admin.email}
  Name:     ${admin.name}
  Role:     ${admin.role}

Login at: /admin/login.html
    `);

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
