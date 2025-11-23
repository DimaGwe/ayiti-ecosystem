/**
 * Seed Script for Ayiti Trivia
 * Populates the database with sample questions
 *
 * Run: npm run seed (or node scripts/seed.js)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { Question, Answer, sequelize } = require('../models');

// Sample questions data
const questionsData = [
  // ==================== Haiti History (5 questions) ====================
  {
    category: 'Haiti History',
    questionText: 'In what year did Haiti gain independence from France?',
    difficulty: 'easy',
    answers: [
      { text: '1804', isCorrect: true },
      { text: '1776', isCorrect: false },
      { text: '1865', isCorrect: false },
      { text: '1791', isCorrect: false }
    ]
  },
  {
    category: 'Haiti History',
    questionText: 'Who was the leader of the Haitian Revolution and is considered the founding father of Haiti?',
    difficulty: 'medium',
    answers: [
      { text: 'Toussaint Louverture', isCorrect: true },
      { text: 'Jean-Jacques Dessalines', isCorrect: false },
      { text: 'Henri Christophe', isCorrect: false },
      { text: 'Alexandre Pétion', isCorrect: false }
    ]
  },
  {
    category: 'Haiti History',
    questionText: 'What was the original indigenous name of the island of Hispaniola?',
    difficulty: 'hard',
    answers: [
      { text: 'Ayiti (Quisqueya)', isCorrect: true },
      { text: 'Borinquen', isCorrect: false },
      { text: 'Cuba', isCorrect: false },
      { text: 'Xaymaca', isCorrect: false }
    ]
  },
  {
    category: 'Haiti History',
    questionText: 'Haiti was the first independent nation in which region?',
    difficulty: 'medium',
    answers: [
      { text: 'Latin America and the Caribbean', isCorrect: true },
      { text: 'North America', isCorrect: false },
      { text: 'Central America', isCorrect: false },
      { text: 'South America', isCorrect: false }
    ]
  },
  {
    category: 'Haiti History',
    questionText: 'Who declared Haiti\'s independence on January 1, 1804?',
    difficulty: 'medium',
    answers: [
      { text: 'Jean-Jacques Dessalines', isCorrect: true },
      { text: 'Toussaint Louverture', isCorrect: false },
      { text: 'Henri Christophe', isCorrect: false },
      { text: 'François-Dominique Toussaint', isCorrect: false }
    ]
  },

  // ==================== Haiti Geography (5 questions) ====================
  {
    category: 'Haiti Geography',
    questionText: 'What is the capital city of Haiti?',
    difficulty: 'easy',
    answers: [
      { text: 'Port-au-Prince', isCorrect: true },
      { text: 'Cap-Haïtien', isCorrect: false },
      { text: 'Gonaïves', isCorrect: false },
      { text: 'Les Cayes', isCorrect: false }
    ]
  },
  {
    category: 'Haiti Geography',
    questionText: 'Which country shares the island of Hispaniola with Haiti?',
    difficulty: 'easy',
    answers: [
      { text: 'Dominican Republic', isCorrect: true },
      { text: 'Cuba', isCorrect: false },
      { text: 'Jamaica', isCorrect: false },
      { text: 'Puerto Rico', isCorrect: false }
    ]
  },
  {
    category: 'Haiti Geography',
    questionText: 'What is the highest mountain peak in Haiti?',
    difficulty: 'hard',
    answers: [
      { text: 'Pic la Selle', isCorrect: true },
      { text: 'Morne La Visite', isCorrect: false },
      { text: 'Morne du Cibao', isCorrect: false },
      { text: 'Pic Macaya', isCorrect: false }
    ]
  },
  {
    category: 'Haiti Geography',
    questionText: 'How many departments (administrative divisions) does Haiti have?',
    difficulty: 'medium',
    answers: [
      { text: '10', isCorrect: true },
      { text: '8', isCorrect: false },
      { text: '12', isCorrect: false },
      { text: '15', isCorrect: false }
    ]
  },
  {
    category: 'Haiti Geography',
    questionText: 'Which body of water borders Haiti to the north?',
    difficulty: 'medium',
    answers: [
      { text: 'Atlantic Ocean', isCorrect: true },
      { text: 'Caribbean Sea', isCorrect: false },
      { text: 'Gulf of Mexico', isCorrect: false },
      { text: 'Pacific Ocean', isCorrect: false }
    ]
  },

  // ==================== Haiti Culture (5 questions) ====================
  {
    category: 'Haiti Culture',
    questionText: 'What are the two official languages of Haiti?',
    difficulty: 'easy',
    answers: [
      { text: 'French and Haitian Creole', isCorrect: true },
      { text: 'French and Spanish', isCorrect: false },
      { text: 'English and French', isCorrect: false },
      { text: 'Haitian Creole and Spanish', isCorrect: false }
    ]
  },
  {
    category: 'Haiti Culture',
    questionText: 'What is the name of the traditional Haitian religion that blends African and Catholic elements?',
    difficulty: 'medium',
    answers: [
      { text: 'Vodou', isCorrect: true },
      { text: 'Santeria', isCorrect: false },
      { text: 'Candomblé', isCorrect: false },
      { text: 'Obeah', isCorrect: false }
    ]
  },
  {
    category: 'Haiti Culture',
    questionText: 'What is the traditional Haitian dish made with rice and beans called?',
    difficulty: 'easy',
    answers: [
      { text: 'Diri ak Pwa', isCorrect: true },
      { text: 'Griot', isCorrect: false },
      { text: 'Tasso', isCorrect: false },
      { text: 'Lambi', isCorrect: false }
    ]
  },
  {
    category: 'Haiti Culture',
    questionText: 'Which style of music originated in Haiti and is popular during Carnival?',
    difficulty: 'medium',
    answers: [
      { text: 'Kompa (Compas)', isCorrect: true },
      { text: 'Reggae', isCorrect: false },
      { text: 'Salsa', isCorrect: false },
      { text: 'Merengue', isCorrect: false }
    ]
  },
  {
    category: 'Haiti Culture',
    questionText: 'What is the name of the colorful public transportation buses in Haiti?',
    difficulty: 'hard',
    answers: [
      { text: 'Tap-tap', isCorrect: true },
      { text: 'Guagua', isCorrect: false },
      { text: 'Matatu', isCorrect: false },
      { text: 'Jeepney', isCorrect: false }
    ]
  },

  // ==================== General Knowledge (5 questions) ====================
  {
    category: 'General Knowledge',
    questionText: 'What is the currency of Haiti?',
    difficulty: 'easy',
    answers: [
      { text: 'Haitian Gourde', isCorrect: true },
      { text: 'Haitian Peso', isCorrect: false },
      { text: 'Haitian Dollar', isCorrect: false },
      { text: 'Haitian Franc', isCorrect: false }
    ]
  },
  {
    category: 'General Knowledge',
    questionText: 'What colors are on the Haitian flag?',
    difficulty: 'easy',
    answers: [
      { text: 'Blue and Red', isCorrect: true },
      { text: 'Red, White, and Blue', isCorrect: false },
      { text: 'Green and Yellow', isCorrect: false },
      { text: 'Black, Red, and Green', isCorrect: false }
    ]
  },
  {
    category: 'General Knowledge',
    questionText: 'Which famous Haitian author wrote "The Dew Breaker"?',
    difficulty: 'hard',
    answers: [
      { text: 'Edwidge Danticat', isCorrect: true },
      { text: 'Jacques Roumain', isCorrect: false },
      { text: 'Marie Vieux-Chauvet', isCorrect: false },
      { text: 'Dany Laferrière', isCorrect: false }
    ]
  },
  {
    category: 'General Knowledge',
    questionText: 'What devastating natural disaster struck Haiti on January 12, 2010?',
    difficulty: 'medium',
    answers: [
      { text: 'Earthquake', isCorrect: true },
      { text: 'Hurricane', isCorrect: false },
      { text: 'Tsunami', isCorrect: false },
      { text: 'Volcanic Eruption', isCorrect: false }
    ]
  },
  {
    category: 'General Knowledge',
    questionText: 'What is the national motto of Haiti?',
    difficulty: 'hard',
    answers: [
      { text: 'L\'Union Fait La Force (Unity Makes Strength)', isCorrect: true },
      { text: 'Liberté, Égalité, Fraternité', isCorrect: false },
      { text: 'Dieu, Patrie, Liberté', isCorrect: false },
      { text: 'En Avant', isCorrect: false }
    ]
  }
];

async function seed() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully');

    console.log('Syncing database schema...');
    await sequelize.sync({ alter: true });

    console.log('Checking for existing questions...');
    const existingCount = await Question.count();

    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing questions.`);
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question('Do you want to clear existing questions and re-seed? (y/N): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y') {
        console.log('Seeding cancelled.');
        process.exit(0);
      }

      console.log('Clearing existing data...');
      await Answer.destroy({ where: {} });
      await Question.destroy({ where: {} });
    }

    console.log('Seeding questions...');
    let questionsCreated = 0;
    let answersCreated = 0;

    for (const questionData of questionsData) {
      const question = await Question.create({
        category: questionData.category,
        questionText: questionData.questionText,
        difficulty: questionData.difficulty
      });

      questionsCreated++;

      for (const answerData of questionData.answers) {
        await Answer.create({
          questionId: question.id,
          answerText: answerData.text,
          isCorrect: answerData.isCorrect
        });
        answersCreated++;
      }

      console.log(`  Created: ${questionData.category} - ${questionData.questionText.substring(0, 50)}...`);
    }

    console.log('\n========================================');
    console.log('Seeding complete!');
    console.log(`  Questions created: ${questionsCreated}`);
    console.log(`  Answers created: ${answersCreated}`);
    console.log('========================================\n');

    // Summary by category
    const categories = [...new Set(questionsData.map(q => q.category))];
    for (const category of categories) {
      const count = questionsData.filter(q => q.category === category).length;
      console.log(`  ${category}: ${count} questions`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seed
seed();
