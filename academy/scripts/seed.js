/**
 * Database Seed Script
 * Populates courses and companies from ecosystem JSON files
 *
 * Run: npm run seed
 * Or: node scripts/seed.js
 */

const path = require('path');
const fs = require('fs');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { sequelize, Course, Module, Company, User } = require('../models');

// Paths to ecosystem data files (in diora's memory)
const DIORA_PATH = path.join(__dirname, '../../diora/memory/context/ecosystems');
const LOCAL_PATH = path.join(__dirname, '../data');

// Try to load from diora first, then local
function loadJSON(filename) {
  const dioraPath = path.join(DIORA_PATH, filename);
  const localPath = path.join(LOCAL_PATH, filename);

  if (fs.existsSync(dioraPath)) {
    console.log(`  Loading from diora: ${filename}`);
    return JSON.parse(fs.readFileSync(dioraPath, 'utf8'));
  } else if (fs.existsSync(localPath)) {
    console.log(`  Loading from local: ${filename}`);
    return JSON.parse(fs.readFileSync(localPath, 'utf8'));
  } else {
    console.log(`  File not found: ${filename}, using embedded data`);
    return null;
  }
}

// Embedded fallback data (from haiti_skills_academy.json)
const DEFAULT_COURSES = [
  {
    id: 'agriculture',
    name: 'Agriculture',
    description: 'Sustainable farming, crop management, soil health. Learn to grow food and build a career in farming.',
    theoryCompletionRequired: 100,
    practicalHoursRequired: 40,
    physicalTestRequired: true,
    companyLink: 'ayiti-farms',
    jobCategories: ['Farm Worker', 'Agricultural Technician', 'Farm Manager', 'Crop Consultant'],
    modules: ['Soil Preparation', 'Crop Selection', 'Irrigation Systems', 'Pest Control', 'Harvest & Storage']
  },
  {
    id: 'mechanic',
    name: 'Mechanic',
    description: 'Vehicle repair, engine maintenance, diagnostics. Keep Haiti moving with automotive skills.',
    theoryCompletionRequired: 100,
    practicalHoursRequired: 60,
    physicalTestRequired: true,
    companyLink: 'ayiti-motors',
    jobCategories: ['Auto Mechanic', 'Motorcycle Technician', 'Heavy Equipment Operator', 'Shop Manager'],
    modules: ['Engine Basics', 'Electrical Systems', 'Brake Systems', 'Transmission', 'Diagnostics']
  },
  {
    id: 'fishing',
    name: 'Fishing',
    description: 'Sustainable fishing, boat operation, fish preservation. Master the waters around Haiti.',
    theoryCompletionRequired: 100,
    practicalHoursRequired: 50,
    physicalTestRequired: true,
    companyLink: 'ayiti-catch',
    jobCategories: ['Commercial Fisher', 'Fishing Guide', 'Fish Market Seller', 'Boat Captain'],
    modules: ['Fishing Techniques', 'Safety at Sea', 'Navigation', 'Fish Preservation', 'Sustainable Practices']
  },
  {
    id: 'boat-building',
    name: 'Boat Building',
    description: 'Traditional and modern boat construction. Craft vessels that connect communities.',
    theoryCompletionRequired: 100,
    practicalHoursRequired: 80,
    physicalTestRequired: true,
    companyLink: 'ayiti-boats',
    jobCategories: ['Boat Builder', 'Marine Carpenter', 'Shipyard Worker', 'Restoration Specialist'],
    modules: ['Wood Selection', 'Hull Design', 'Joinery Techniques', 'Waterproofing', 'Rigging & Finishing']
  },
  {
    id: 'recycling',
    name: 'Recycling',
    description: 'Waste management, upcycling, environmental business. Turn waste into wealth.',
    theoryCompletionRequired: 100,
    practicalHoursRequired: 30,
    physicalTestRequired: true,
    companyLink: 'ayiti-green',
    jobCategories: ['Recycling Coordinator', 'Waste Management Tech', 'Upcycling Artisan', 'Environmental Educator'],
    modules: ['Material Sorting', 'Processing Techniques', 'Upcycling Projects', 'Business Models', 'Community Programs']
  }
];

// Embedded fallback companies (from haiti_companies.json)
const DEFAULT_COMPANIES = [
  {
    id: 'ayiti-farms',
    name: 'Ayiti Farms Co-op',
    tagline: 'Growing Haiti\'s Future',
    type: 'cooperative',
    courseLink: 'agriculture',
    services: ['Organic vegetable production', 'Farm consulting & soil analysis', 'Crop management services', 'Agricultural equipment rental', 'Harvest-to-market logistics']
  },
  {
    id: 'ayiti-motors',
    name: 'Ayiti Motors',
    tagline: 'Keeping Haiti Moving',
    type: 'service_business',
    courseLink: 'mechanic',
    services: ['Vehicle repair & maintenance', 'Motorcycle/tap-tap servicing', 'Engine diagnostics', 'Tire & brake services', 'Mobile repair (roadside)', 'Fleet maintenance contracts']
  },
  {
    id: 'ayiti-catch',
    name: 'Ayiti Catch Seafood',
    tagline: 'Fresh from Haiti\'s Waters',
    type: 'production_company',
    courseLink: 'fishing',
    services: ['Commercial fishing operations', 'Fish processing & preservation', 'Wholesale distribution', 'Fishing tours & guides', 'Sustainable fishing consulting']
  },
  {
    id: 'ayiti-boats',
    name: 'Ayiti Boats & Marine',
    tagline: 'Crafting Haiti\'s Fleet',
    type: 'manufacturing',
    courseLink: 'boat-building',
    services: ['Traditional boat construction', 'Fiberglass boat building', 'Boat repair & restoration', 'Custom marine carpentry', 'Boat maintenance contracts']
  },
  {
    id: 'ayiti-green',
    name: 'Ayiti Green Recycling',
    tagline: 'Turning Waste into Wealth',
    type: 'environmental_services',
    courseLink: 'recycling',
    services: ['Waste collection & sorting', 'Plastic recycling & processing', 'Composting services', 'Upcycled product creation', 'Corporate waste management', 'Community cleanup programs']
  }
];

async function seed() {
  console.log('\n========================================');
  console.log('  Haiti Skills Academy - Database Seed');
  console.log('========================================\n');

  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected\n');

    // Sync models (force: true will drop tables!)
    const forceSync = process.argv.includes('--force');
    if (forceSync) {
      console.log('WARNING: Force sync enabled - dropping all tables!\n');
    }
    await sequelize.sync({ force: forceSync });
    console.log('Database synced\n');

    // Try to load ecosystem data
    const academyData = loadJSON('haiti_skills_academy.json');
    const companiesData = loadJSON('haiti_companies.json');

    // ==================== SEED COURSES ====================
    console.log('Seeding courses...');

    const coursesToSeed = academyData?.courses || DEFAULT_COURSES;

    for (const courseData of coursesToSeed) {
      // Check if course exists
      let course = await Course.findByPk(courseData.id);

      if (!course) {
        course = await Course.create({
          id: courseData.id,
          name: courseData.name,
          description: courseData.description,
          theoryCompletionRequired: courseData.certification_requirements?.theory_completion || courseData.theoryCompletionRequired || 100,
          practicalHoursRequired: courseData.certification_requirements?.practical_hours || courseData.practicalHoursRequired || 40,
          physicalTestRequired: courseData.certification_requirements?.physical_test !== false,
          companyLink: courseData.companyLink || `ayiti-${courseData.id}`,
          jobCategories: courseData.job_categories || courseData.jobCategories || []
        });
        console.log(`  Created course: ${course.name}`);
      } else {
        console.log(`  Course exists: ${course.name}`);
      }

      // Create modules for course
      const modules = courseData.modules || [];
      for (let i = 0; i < modules.length; i++) {
        const moduleName = typeof modules[i] === 'string' ? modules[i] : modules[i].name;

        const existingModule = await Module.findOne({
          where: { courseId: course.id, name: moduleName }
        });

        if (!existingModule) {
          await Module.create({
            courseId: course.id,
            name: moduleName,
            description: `Learn about ${moduleName.toLowerCase()} in ${course.name}`,
            order: i + 1,
            estimatedMinutes: 45,
            quizQuestions: [
              {
                id: 1,
                question: `What is a key concept in ${moduleName}?`,
                options: ['Concept A', 'Concept B', 'Concept C', 'Concept D'],
                correctIndex: 0,
                points: 25
              }
            ]
          });
        }
      }
      console.log(`    Added ${modules.length} modules`);
    }

    // ==================== SEED COMPANIES ====================
    console.log('\nSeeding companies...');

    const companiesToSeed = companiesData?.companies || DEFAULT_COMPANIES;

    for (const companyData of companiesToSeed) {
      let company = await Company.findByPk(companyData.id);

      if (!company) {
        company = await Company.create({
          id: companyData.id,
          name: companyData.name,
          tagline: companyData.tagline,
          type: companyData.type,
          courseLink: companyData.course_link || companyData.courseLink,
          services: companyData.services || [],
          ecosystemIntegration: companyData.ecosystem_integration || {},
          isHiring: true,
          isActive: true
        });
        console.log(`  Created company: ${company.name}`);
      } else {
        console.log(`  Company exists: ${company.name}`);
      }
    }

    // ==================== SUMMARY ====================
    const courseCount = await Course.count();
    const moduleCount = await Module.count();
    const companyCount = await Company.count();

    console.log('\n========================================');
    console.log('  Seeding Complete!');
    console.log('========================================');
    console.log(`  Courses: ${courseCount}`);
    console.log(`  Modules: ${moduleCount}`);
    console.log(`  Companies: ${companyCount}`);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\nSeeding failed:', error);
    process.exit(1);
  }
}

// Run seed
seed();
