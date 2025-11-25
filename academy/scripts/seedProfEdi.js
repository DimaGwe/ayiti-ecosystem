/**
 * Seed AI Teacher - Prof. Edi
 * Creates the Agriculture & Farming AI Teacher
 *
 * Run: node scripts/seedProfEdi.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { sequelize, Course, AICommunityTeacher, Community } = require('../models');

// AI Teacher Data
const AI_TEACHER = {
  name: 'Prof. Edi',
  slug: 'prof-edi',
  avatar: '/img/ai-teacher-edi.png',
  title: 'Agriculture Instructor',
  expertise: 'Agriculture, Farming, and Sustainable Food Production',
  personality: {
    style: 'practical',
    tone: 'warm',
    language: 'multilingual'
  },
  systemPrompt: `You are Prof. Edi, an AI Teacher at Haiti Skills Academy specializing in Agriculture and Farming.

YOUR IDENTITY:
- Name: Prof. Edi (from "Edikasyon" - Education in Haitian Creole)
- Role: Agriculture Instructor and Community Teacher
- Expertise: Sustainable Agriculture, Crop Management, Livestock, Soil Science, Farm Business

YOUR TEACHING APPROACH:
- Share practical, hands-on farming knowledge
- Use examples relevant to Haiti's climate and conditions
- Emphasize sustainable and organic farming practices
- Connect traditional Haitian farming wisdom with modern techniques
- Encourage questions and sharing of experiences

YOUR CURRICULUM FOCUS:
1. Soil & Land Preparation - Understanding soil types, composting, land management
2. Crop Production - Planting, irrigation, pest management, harvesting
3. Livestock & Poultry - Animal care, feeding, health management
4. Sustainable Practices - Organic farming, water conservation, crop rotation
5. Farm Business - Marketing produce, record keeping, cooperative farming

GUIDELINES:
- Respond in the same language the student uses (Creole, French, or English)
- Give practical advice that can be applied immediately
- Consider Haiti's tropical climate and local conditions
- Mention local crops: mango, avocado, plantain, cassava, rice, beans, coffee
- Encourage environmentally friendly practices
- Be patient and supportive with beginners

EXAMPLE TEACHING STYLE:
"Bon kesyon! Let me explain composting like this: Think of it as cooking for your soil. Just like making a good soup, you need the right ingredients - green materials (vegetable scraps, grass) for nitrogen, brown materials (dry leaves, cardboard) for carbon, water, and air. Mix them together, turn regularly, and in a few months you'll have rich, dark compost that your plants will love!"`,
  welcomeMessage: `Bonjou zanmi! Mwen se Prof. Edi, enstriktè agrikilti ou nan Haiti Skills Academy.

Welcome to the Agriculture & Farming community! I'm here to help you learn about:
- Soil preparation and land management
- Growing crops in Haiti's climate
- Raising healthy livestock and poultry
- Sustainable and organic farming practices
- Building a successful farm business

Whether you're starting your first garden or managing a large farm, I'm here to share knowledge and learn together. Farming is the backbone of Haiti - let's grow together!

Kisa ou ta renmen plante jodi a? (What would you like to plant today?)`,
  curriculum: {
    modules: [
      {
        title: 'Soil & Land Preparation',
        description: 'Understanding your land and preparing it for successful farming',
        topics: ['Soil types in Haiti', 'Composting basics', 'Land clearing and preparation', 'Natural fertilizers']
      },
      {
        title: 'Crop Production',
        description: 'Growing healthy crops from seed to harvest',
        topics: ['Seed selection', 'Planting techniques', 'Irrigation methods', 'Pest and disease management', 'Harvesting and storage']
      },
      {
        title: 'Livestock & Poultry',
        description: 'Raising animals for food and income',
        topics: ['Chicken and poultry care', 'Goat and pig raising', 'Animal nutrition', 'Health and disease prevention']
      },
      {
        title: 'Sustainable Practices',
        description: 'Farming methods that protect the environment',
        topics: ['Organic farming', 'Water conservation', 'Crop rotation', 'Agroforestry', 'Climate-smart agriculture']
      },
      {
        title: 'Farm Business',
        description: 'Making your farm profitable and sustainable',
        topics: ['Market research', 'Pricing produce', 'Record keeping', 'Cooperative farming', 'Value-added products']
      }
    ],
    keyTopics: [
      'Haitian soil and climate conditions',
      'Traditional and modern farming techniques',
      'Organic and sustainable practices',
      'Local crop varieties (mango, coffee, rice, beans)',
      'Small-scale livestock management',
      'Farm business and marketing'
    ],
    resources: [
      'FAO agricultural guidelines',
      'Haiti Ministry of Agriculture resources',
      'Organic farming manuals',
      'Local agricultural extension services'
    ],
    assessmentTopics: [
      'Create a composting plan for your farm',
      'Design a crop rotation schedule',
      'Identify common pests and natural remedies',
      'Develop a simple farm budget',
      'Plan a small vegetable garden'
    ]
  },
  modelSettings: {
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 1500
  }
};

async function seedProfEdi() {
  console.log('\n========================================');
  console.log('  Seeding AI Teacher - Prof. Edi');
  console.log('========================================\n');

  try {
    await sequelize.authenticate();
    console.log('Database connected\n');

    // Get the agriculture course
    let course = await Course.findByPk('agriculture');
    if (!course) {
      console.log('Agriculture course not found, creating...');
      course = await Course.create({
        id: 'agriculture',
        name: 'Agriculture & Farming',
        description: 'Learn sustainable farming, crop management, and agricultural business skills.',
        theoryCompletionRequired: 100,
        practicalHoursRequired: 80,
        physicalTestRequired: true,
        companyLink: 'ayiti-farms',
        jobCategories: ['Farm Manager', 'Agricultural Technician', 'Crop Specialist', 'Livestock Manager']
      });
      console.log('  Created course: Agriculture & Farming');
    }

    // Create or find AI Teacher
    let teacher = await AICommunityTeacher.findOne({ where: { slug: AI_TEACHER.slug } });

    if (!teacher) {
      teacher = await AICommunityTeacher.create({
        name: AI_TEACHER.name,
        slug: AI_TEACHER.slug,
        avatar: AI_TEACHER.avatar,
        title: AI_TEACHER.title,
        expertise: AI_TEACHER.expertise,
        personality: AI_TEACHER.personality,
        systemPrompt: AI_TEACHER.systemPrompt,
        welcomeMessage: AI_TEACHER.welcomeMessage,
        curriculum: AI_TEACHER.curriculum,
        modelSettings: AI_TEACHER.modelSettings,
        courseId: course.id,
        isActive: true
      });
      console.log(`  Created AI Teacher: ${teacher.name}`);
    } else {
      console.log(`  AI Teacher exists: ${teacher.name}`);
    }

    // Create community if teacher doesn't have one
    if (!teacher.communityId) {
      console.log('\nCreating community...');

      let community = await Community.findOne({ where: { slug: `${teacher.slug}-classroom` } });

      if (!community) {
        community = await Community.create({
          name: `${teacher.name}'s Farm School`,
          slug: `${teacher.slug}-farm-school`,
          description: `Learn ${teacher.expertise} with ${teacher.name}, your AI agriculture instructor! Ask questions about farming, share your harvest, and grow your skills.`,
          ownerId: null,
          aiTeacherId: teacher.id,
          isAIOwned: true,
          type: 'learning',
          isPublic: true,
          courseId: course.id,
          settings: {
            allowMemberPosts: true,
            allowMemberComments: true,
            welcomeMessage: teacher.welcomeMessage
          }
        });
        console.log(`  Created community: ${community.name}`);
      }

      await teacher.update({ communityId: community.id });
      console.log(`  Linked teacher to community`);
    }

    // Summary
    const teacherCount = await AICommunityTeacher.count();
    const aiCommunities = await Community.count({ where: { isAIOwned: true } });

    console.log('\n========================================');
    console.log('  Prof. Edi Seeding Complete!');
    console.log('========================================');
    console.log(`  Total AI Teachers: ${teacherCount}`);
    console.log(`  Total AI Communities: ${aiCommunities}`);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\nSeeding failed:', error);
    process.exit(1);
  }
}

seedProfEdi();
