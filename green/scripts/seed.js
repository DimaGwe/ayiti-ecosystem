/**
 * Ayiti Green - Database Seed Script
 * Seeds collection points in Port-au-Prince area
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const sequelize = require('../../shared/config/database');
const { CollectionPoint } = require('../models');

// Collection points in Port-au-Prince area
const collectionPoints = [
  {
    name: 'Centre de Recyclage Delmas',
    address: 'Delmas 33, Rue Metellus',
    city: 'Delmas',
    latitude: 18.5450,
    longitude: -72.3050,
    accepts: ['plastic', 'paper', 'metal', 'glass'],
    hours: 'Mon-Fri: 8AM-5PM, Sat: 8AM-12PM',
    phone: '+509 2940-0001',
    active: true
  },
  {
    name: 'Ayiti Vert - Petionville',
    address: 'Rue Geffrard, Petionville',
    city: 'Petionville',
    latitude: 18.5125,
    longitude: -72.2855,
    accepts: ['plastic', 'paper', 'metal', 'glass', 'electronics'],
    hours: 'Mon-Sat: 7AM-6PM',
    phone: '+509 2940-0002',
    active: true
  },
  {
    name: 'EcoPoint Port-au-Prince',
    address: 'Boulevard Jean-Jacques Dessalines',
    city: 'Port-au-Prince',
    latitude: 18.5392,
    longitude: -72.3361,
    accepts: ['plastic', 'metal', 'electronics'],
    hours: 'Mon-Fri: 9AM-4PM',
    phone: '+509 2940-0003',
    active: true
  },
  {
    name: 'Recyclage Carrefour',
    address: 'Route Nationale 2, Carrefour',
    city: 'Carrefour',
    latitude: 18.5350,
    longitude: -72.4000,
    accepts: ['plastic', 'paper', 'metal', 'organic'],
    hours: 'Mon-Sat: 8AM-5PM',
    phone: '+509 2940-0004',
    active: true
  },
  {
    name: 'Green Haiti Center',
    address: 'Turgeau, Avenue John Brown',
    city: 'Port-au-Prince',
    latitude: 18.5280,
    longitude: -72.3250,
    accepts: ['plastic', 'paper', 'metal', 'glass', 'organic', 'electronics'],
    hours: 'Mon-Sun: 6AM-8PM',
    phone: '+509 2940-0005',
    active: true
  }
];

async function seed() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully');

    console.log('Syncing CollectionPoint model...');
    await CollectionPoint.sync({ alter: true });

    console.log('Seeding collection points...');

    for (const point of collectionPoints) {
      // Check if already exists
      const existing = await CollectionPoint.findOne({
        where: { name: point.name }
      });

      if (existing) {
        console.log(`  Updating: ${point.name}`);
        await existing.update(point);
      } else {
        console.log(`  Creating: ${point.name}`);
        await CollectionPoint.create(point);
      }
    }

    console.log('\nSeeding complete!');
    console.log(`Total collection points: ${collectionPoints.length}`);

    // Display summary
    const allPoints = await CollectionPoint.findAll();
    console.log('\nCollection Points:');
    allPoints.forEach((point, i) => {
      console.log(`  ${i + 1}. ${point.name} (${point.city})`);
      console.log(`     Accepts: ${point.accepts.join(', ')}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
