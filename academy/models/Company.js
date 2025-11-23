/**
 * Company Model
 * The 5 Ayiti companies that hire graduates
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true  // e.g., 'ayiti-farms'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  tagline: {
    type: DataTypes.STRING(200)
  },
  description: {
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.STRING(50)  // 'cooperative', 'service_business', 'manufacturing', etc.
  },
  logo: {
    type: DataTypes.STRING(255)
  },
  coverImage: {
    type: DataTypes.STRING(255)
  },
  // Which course feeds into this company
  courseLink: {
    type: DataTypes.STRING(50)  // e.g., 'agriculture'
  },
  // Services offered (from haiti_companies.json)
  services: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Revenue streams
  revenueStreams: {
    type: DataTypes.JSON,
    defaultValue: []
    /* Format from haiti_companies.json:
    [
      { name: "Direct Sales", description: "...", margin: "40-60%" }
    ]
    */
  },
  // Contact info
  email: {
    type: DataTypes.STRING(100)
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  website: {
    type: DataTypes.STRING(255)
  },
  location: {
    type: DataTypes.STRING(200)
  },
  coordinates: {
    type: DataTypes.JSON  // { lat: 18.5, lng: -72.3 }
  },
  // Ecosystem integration (from haiti_companies.json)
  ecosystemIntegration: {
    type: DataTypes.JSON,
    defaultValue: {}
    /* Format:
    {
      buys_from: ["Recycling (compost)"],
      sells_to: ["Local markets"],
      hires_from: ["Agriculture course graduates"],
      partners_with: ["Ayiti Motors"]
    }
    */
  },
  // Stats
  employeesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  graduatesHired: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  openPositions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Owner (can be a user ID)
  ownerId: {
    type: DataTypes.INTEGER
  },
  // Status
  isHiring: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verifiedAt: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'companies',
  timestamps: true
});

module.exports = Company;
