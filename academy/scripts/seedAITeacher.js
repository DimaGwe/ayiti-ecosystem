/**
 * Seed AI Teacher - Prof. Lespri
 * Creates the first AI Community Teacher for AI/Tech course
 *
 * Run: node scripts/seedAITeacher.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { sequelize, Course, AICommunityTeacher, Community } = require('../models');

// AI Course Data
const AI_COURSE = {
  id: 'ai-technology',
  name: 'AI & Technology',
  description: 'Learn artificial intelligence, programming fundamentals, and tech skills. Build the future with code.',
  theoryCompletionRequired: 100,
  practicalHoursRequired: 50,
  physicalTestRequired: false,
  companyLink: 'ayiti-tech',
  jobCategories: ['AI Assistant Trainer', 'Data Analyst', 'Tech Support', 'Junior Developer'],
  modules: ['Introduction to AI', 'Programming Basics', 'Data & Databases', 'Web Fundamentals', 'AI Tools & Applications']
};

// AI Teacher Data
const AI_TEACHER = {
  name: 'Prof. Lespri',
  slug: 'prof-lespri',
  avatar: '/img/ai-teacher-lespri.png',
  title: 'AI Instructor',
  expertise: 'Artificial Intelligence, Programming, and Technology',
  personality: {
    style: 'helpful',
    tone: 'encouraging',
    language: 'multilingual'
  },
  systemPrompt: `You are Prof. Lespri, an AI Teacher at Haiti Skills Academy specializing in AI and Technology.

YOUR IDENTITY:
- Name: Prof. Lespri (Professor Spirit in Haitian Creole)
- Role: AI Instructor and Community Teacher
- Expertise: Artificial Intelligence, Programming, Data Analysis, Web Development

YOUR TEACHING APPROACH:
- Explain complex tech concepts in simple, accessible language
- Use analogies and real-world examples relevant to Haiti
- Build understanding step-by-step, starting from fundamentals
- Encourage experimentation and hands-on learning
- Celebrate progress and maintain a supportive environment

YOUR CURRICULUM FOCUS:
1. Introduction to AI - What AI is, how it works, its applications
2. Programming Basics - Logic, algorithms, Python fundamentals
3. Data & Databases - Understanding data, SQL basics, data analysis
4. Web Fundamentals - HTML, CSS, how the internet works
5. AI Tools & Applications - Using AI assistants, prompt engineering, automation

GUIDELINES:
- Respond in the same language the student uses (Creole, French, or English)
- If asked about topics outside your expertise, acknowledge limitations
- Connect lessons to opportunities in Haiti's growing tech sector
- Encourage students to ask questions and experiment
- Provide code examples when teaching programming concepts
- Always be patient and supportive

EXAMPLE TEACHING STYLE:
"Great question! Let me explain AI like this: imagine you're teaching a child to recognize fruits. You show them many apples, bananas, mangoes... After seeing enough examples, they learn to identify fruits they've never seen before. AI works similarly - it learns patterns from data and uses those patterns to make predictions or decisions."`,
  welcomeMessage: `Bonjou! Mwen se Prof. Lespri, enstriktè AI ou nan Haiti Skills Academy.

Welcome to the AI & Technology community! I'm here to help you learn about:
- Artificial Intelligence and how it works
- Programming fundamentals
- Data and databases
- Web development basics
- How to use AI tools effectively

Ask me anything about technology! Whether you're completely new to tech or want to deepen your knowledge, I'm here to guide you step by step.

Kisa ou ta renmen aprann jodi a? (What would you like to learn today?)`,
  curriculum: {
    modules: [
      {
        title: 'Introduction to AI',
        description: 'Understanding what AI is, its history, and how it impacts our world',
        topics: ['What is AI?', 'Types of AI', 'Machine Learning basics', 'AI in daily life']
      },
      {
        title: 'Programming Basics',
        description: 'Learn to think like a programmer and write your first code',
        topics: ['Logic and algorithms', 'Variables and data types', 'Loops and conditions', 'Functions']
      },
      {
        title: 'Data & Databases',
        description: 'Understanding how data is stored, organized, and analyzed',
        topics: ['What is data?', 'Spreadsheets and tables', 'SQL basics', 'Data visualization']
      },
      {
        title: 'Web Fundamentals',
        description: 'How websites work and how to build basic web pages',
        topics: ['How the internet works', 'HTML structure', 'CSS styling', 'Basic JavaScript']
      },
      {
        title: 'AI Tools & Applications',
        description: 'Using AI tools effectively in work and daily life',
        topics: ['AI assistants', 'Prompt engineering', 'Automation tools', 'AI ethics']
      }
    ],
    keyTopics: [
      'Artificial Intelligence fundamentals',
      'Python programming basics',
      'Data literacy and analysis',
      'Web development introduction',
      'Using AI tools responsibly',
      'Technology careers in Haiti'
    ],
    resources: [
      'Python official documentation',
      'W3Schools for web development',
      'Khan Academy programming courses',
      'ChatGPT/Claude for practice'
    ],
    assessmentTopics: [
      'Explain what AI is and give 3 examples',
      'Write a simple program that uses variables and loops',
      'Create a basic database query',
      'Build a simple web page with HTML and CSS',
      'Use an AI assistant to solve a real problem'
    ]
  },
  modelSettings: {
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 1500
  }
};

async function seedAITeacher() {
  console.log('\n========================================');
  console.log('  Seeding AI Teacher - Prof. Lespri');
  console.log('========================================\n');

  try {
    await sequelize.authenticate();
    console.log('Database connected\n');

    // Sync only the AI Teacher model
    await AICommunityTeacher.sync({ alter: true });
    console.log('AI Teacher table synced');

    // Add AI columns to communities table using raw SQL if they don't exist
    try {
      await sequelize.query(`
        ALTER TABLE communities
        ADD COLUMN IF NOT EXISTS aiTeacherId INTEGER,
        ADD COLUMN IF NOT EXISTS isAIOwned TINYINT(1) DEFAULT 0
      `);
      console.log('Community AI columns added');
    } catch (alterErr) {
      // Columns might already exist, which is fine
      if (!alterErr.message.includes('Duplicate column')) {
        console.log('Community columns already exist or error:', alterErr.message);
      }
    }

    // Make ownerId nullable for AI-owned communities
    try {
      await sequelize.query(`
        ALTER TABLE communities
        MODIFY COLUMN ownerId INTEGER NULL
      `);
      console.log('Modified ownerId to allow NULL');
    } catch (modifyErr) {
      console.log('ownerId modification:', modifyErr.message);
    }
    console.log('Database ready\n');

    // ==================== CREATE AI COURSE ====================
    console.log('Creating AI & Technology course...');

    let course = await Course.findByPk(AI_COURSE.id);
    if (!course) {
      course = await Course.create({
        id: AI_COURSE.id,
        name: AI_COURSE.name,
        description: AI_COURSE.description,
        theoryCompletionRequired: AI_COURSE.theoryCompletionRequired,
        practicalHoursRequired: AI_COURSE.practicalHoursRequired,
        physicalTestRequired: AI_COURSE.physicalTestRequired,
        companyLink: AI_COURSE.companyLink,
        jobCategories: AI_COURSE.jobCategories
      });
      console.log(`  Created course: ${course.name}`);
    } else {
      console.log(`  Course exists: ${course.name}`);
    }

    // ==================== CREATE AI TEACHER ====================
    console.log('\nCreating AI Teacher...');

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

      // ==================== CREATE COMMUNITY ====================
      console.log('\nCreating AI Teacher community...');

      const community = await Community.create({
        name: `${teacher.name}'s AI Classroom`,
        slug: `${teacher.slug}-classroom`,
        description: `Learn ${teacher.expertise} with ${teacher.name}, your AI instructor! Ask questions, participate in discussions, and master technology skills.`,
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

      // Link teacher to community
      await teacher.update({ communityId: community.id });
      console.log(`  Linked teacher to community`);

    } else {
      console.log(`  AI Teacher exists: ${teacher.name}`);

      // Check if teacher has a community, create one if not
      if (!teacher.communityId) {
        console.log('\nCreating missing community for existing teacher...');

        let existingCommunity = await Community.findOne({ where: { slug: `${teacher.slug}-classroom` } });

        if (!existingCommunity) {
          existingCommunity = await Community.create({
            name: `${teacher.name}'s AI Classroom`,
            slug: `${teacher.slug}-classroom`,
            description: `Learn ${teacher.expertise} with ${teacher.name}, your AI instructor! Ask questions, participate in discussions, and master technology skills.`,
            ownerId: null,
            aiTeacherId: teacher.id,
            isAIOwned: true,
            type: 'learning',
            isPublic: true,
            courseId: teacher.courseId || course.id,
            settings: {
              allowMemberPosts: true,
              allowMemberComments: true,
              welcomeMessage: teacher.welcomeMessage
            }
          });
          console.log(`  Created community: ${existingCommunity.name}`);
        }

        // Link teacher to community
        await teacher.update({ communityId: existingCommunity.id });
        console.log(`  Linked teacher to community`);
      }
    }

    // ==================== SUMMARY ====================
    const teacherCount = await AICommunityTeacher.count();
    const aiCommunities = await Community.count({ where: { isAIOwned: true } });

    console.log('\n========================================');
    console.log('  AI Teacher Seeding Complete!');
    console.log('========================================');
    console.log(`  AI Teachers: ${teacherCount}`);
    console.log(`  AI Communities: ${aiCommunities}`);
    console.log(`  Course: ${AI_COURSE.name}`);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\nSeeding failed:', error);
    process.exit(1);
  }
}

seedAITeacher();
