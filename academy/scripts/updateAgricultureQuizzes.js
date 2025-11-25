/**
 * Update Agriculture Course Modules with Real Quiz Content
 * Run: node scripts/updateAgricultureQuizzes.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { Module } = require('../models');

const agricultureQuizzes = {
  'Soil Preparation': {
    content: `# Soil Preparation for Farming in Haiti

## Understanding Your Soil
Before planting, it's essential to understand your soil type. Haiti has various soil types including clay, sandy, and loamy soils. Each type requires different management approaches.

## Key Concepts:
- **pH Testing**: Most crops thrive in soil with pH 6.0-7.0
- **Composting**: Adding organic matter improves soil structure
- **Crop Rotation**: Prevents soil depletion and disease buildup
- **Cover Crops**: Protect soil from erosion during off-season

## Land Clearing
Remove weeds and debris before preparing beds. In Haiti's mountainous terrain, terracing helps prevent erosion.`,
    quizQuestions: [
      {
        id: 1,
        question: "What is the ideal pH range for most crops?",
        options: ["4.0-5.0", "6.0-7.0", "8.0-9.0", "10.0-11.0"],
        correctIndex: 1,
        points: 25
      },
      {
        id: 2,
        question: "What does composting add to soil?",
        options: ["Chemicals", "Organic matter", "Salt", "Plastic"],
        correctIndex: 1,
        points: 25
      },
      {
        id: 3,
        question: "Why is crop rotation important?",
        options: ["Makes farming faster", "Prevents soil depletion and disease", "Increases water usage", "Reduces harvest"],
        correctIndex: 1,
        points: 25
      },
      {
        id: 4,
        question: "What helps prevent erosion on mountainous terrain?",
        options: ["More water", "Terracing", "Removing all plants", "Adding salt"],
        correctIndex: 1,
        points: 25
      }
    ]
  },
  'Crop Selection': {
    content: `# Selecting Crops for Haiti's Climate

## Climate Considerations
Haiti has a tropical climate with distinct wet and dry seasons. Choose crops suited to your region's rainfall patterns.

## Popular Crops in Haiti:
- **Grains**: Rice, corn, sorghum
- **Root crops**: Cassava (manyòk), sweet potato (patat)
- **Legumes**: Beans (pwa), pigeon peas
- **Fruits**: Mango, avocado, plantain, banana
- **Cash crops**: Coffee, cacao

## Planting Calendar
- **Wet season (May-October)**: Plant rice, corn, beans
- **Dry season (November-April)**: Focus on irrigation-friendly crops`,
    quizQuestions: [
      {
        id: 1,
        question: "What type of climate does Haiti have?",
        options: ["Arctic", "Desert", "Tropical", "Mediterranean"],
        correctIndex: 2,
        points: 25
      },
      {
        id: 2,
        question: "What is 'manyòk' in English?",
        options: ["Mango", "Cassava", "Coffee", "Rice"],
        correctIndex: 1,
        points: 25
      },
      {
        id: 3,
        question: "When is Haiti's wet season?",
        options: ["January-April", "May-October", "Year-round", "Never"],
        correctIndex: 1,
        points: 25
      },
      {
        id: 4,
        question: "Which is a popular cash crop in Haiti?",
        options: ["Wheat", "Oats", "Coffee", "Apples"],
        correctIndex: 2,
        points: 25
      }
    ]
  },
  'Irrigation Systems': {
    content: `# Irrigation Methods for Haitian Farmers

## Water Management
Efficient water use is critical, especially during dry seasons.

## Common Irrigation Methods:
- **Drip irrigation**: Most water-efficient, delivers water directly to roots
- **Furrow irrigation**: Traditional method using channels
- **Rain harvesting**: Collecting rainwater in tanks/cisterns
- **Well irrigation**: Using groundwater

## Water Conservation Tips:
- Mulching reduces evaporation
- Water early morning or late evening
- Group plants by water needs
- Monitor soil moisture before watering`,
    quizQuestions: [
      {
        id: 1,
        question: "Which irrigation method is most water-efficient?",
        options: ["Flooding", "Drip irrigation", "Sprinkler", "Hose"],
        correctIndex: 1,
        points: 25
      },
      {
        id: 2,
        question: "What does mulching help reduce?",
        options: ["Growth", "Evaporation", "Photosynthesis", "Harvest"],
        correctIndex: 1,
        points: 25
      },
      {
        id: 3,
        question: "When is the best time to water plants?",
        options: ["Noon", "Early morning or late evening", "Midnight", "Anytime"],
        correctIndex: 1,
        points: 25
      },
      {
        id: 4,
        question: "What is rain harvesting?",
        options: ["Growing rain", "Collecting rainwater", "Selling rain", "Avoiding rain"],
        correctIndex: 1,
        points: 25
      }
    ]
  },
  'Pest Control': {
    content: `# Natural Pest Management

## Integrated Pest Management (IPM)
Use a combination of methods to control pests sustainably.

## Natural Pest Control Methods:
- **Companion planting**: Marigolds repel insects, basil protects tomatoes
- **Beneficial insects**: Ladybugs eat aphids, bees pollinate
- **Natural sprays**: Neem oil, garlic spray, soap solution
- **Physical barriers**: Nets, row covers

## Common Pests in Haiti:
- Aphids, whiteflies, caterpillars
- Rats and birds
- Fungal diseases from humidity

## Prevention is Key:
Healthy plants resist pests better. Ensure good nutrition and spacing.`,
    quizQuestions: [
      {
        id: 1,
        question: "What does IPM stand for?",
        options: ["International Pest Money", "Integrated Pest Management", "Internal Plant Medicine", "Island Pest Method"],
        correctIndex: 1,
        points: 25
      },
      {
        id: 2,
        question: "Which flower helps repel insects?",
        options: ["Rose", "Marigold", "Lily", "Tulip"],
        correctIndex: 1,
        points: 25
      },
      {
        id: 3,
        question: "What do ladybugs eat?",
        options: ["Leaves", "Aphids", "Flowers", "Roots"],
        correctIndex: 1,
        points: 25
      },
      {
        id: 4,
        question: "Which is a natural pest spray ingredient?",
        options: ["Bleach", "Neem oil", "Motor oil", "Paint"],
        correctIndex: 1,
        points: 25
      }
    ]
  },
  'Harvest & Storage': {
    content: `# Harvesting and Storing Your Crops

## Harvest Timing
Harvest at the right time for best quality and storage life.

## Signs of Readiness:
- **Beans**: Pods dry and rattle
- **Corn**: Silk turns brown, kernels milky
- **Tomatoes**: Full color, slight softness
- **Root crops**: Tops die back

## Storage Methods:
- **Dry storage**: Beans, corn, rice - keep dry and cool
- **Cold storage**: Fruits and vegetables - shade, ventilation
- **Processing**: Drying, smoking, pickling

## Post-Harvest Tips:
- Handle carefully to avoid bruising
- Sort and remove damaged items
- Store in clean, dry containers
- Check stored crops regularly`,
    quizQuestions: [
      {
        id: 1,
        question: "How do you know beans are ready to harvest?",
        options: ["Green and soft", "Pods dry and rattle", "Leaves fall off", "Flowers bloom"],
        correctIndex: 1,
        points: 25
      },
      {
        id: 2,
        question: "What kind of storage do beans need?",
        options: ["Wet storage", "Dry storage", "Frozen storage", "No storage"],
        correctIndex: 1,
        points: 25
      },
      {
        id: 3,
        question: "Why should you handle harvested crops carefully?",
        options: ["They might run away", "To avoid bruising", "They are dangerous", "To make them grow more"],
        correctIndex: 1,
        points: 25
      },
      {
        id: 4,
        question: "What is NOT a preservation method?",
        options: ["Drying", "Smoking", "Watering", "Pickling"],
        correctIndex: 2,
        points: 25
      }
    ]
  }
};

async function updateQuizzes() {
  console.log('\n========================================');
  console.log('  Updating Agriculture Quizzes');
  console.log('========================================\n');

  try {
    for (const [moduleName, data] of Object.entries(agricultureQuizzes)) {
      const module = await Module.findOne({
        where: {
          courseId: 'agriculture',
          name: moduleName
        }
      });

      if (module) {
        module.content = data.content;
        module.quizQuestions = data.quizQuestions;
        await module.save();
        console.log(`  Updated: ${moduleName}`);
      } else {
        console.log(`  Not found: ${moduleName}`);
      }
    }

    console.log('\n  Done! Agriculture quizzes updated.\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateQuizzes();
