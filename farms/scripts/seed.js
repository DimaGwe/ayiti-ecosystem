/**
 * Ayiti Farms - Database Seed Script
 * Seeds categories and sample farm listings
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const sequelize = require('../../shared/config/database');
const { Listing, Category } = require('../models');
const User = require('../../shared/models/User');

// Categories with Haitian Creole names
const categories = [
  { name: 'vegetables', nameHt: 'Legim', icon: '&#127813;', active: true },
  { name: 'fruits', nameHt: 'Fwi', icon: '&#127822;', active: true },
  { name: 'grains', nameHt: 'Grenn', icon: '&#127806;', active: true },
  { name: 'livestock', nameHt: 'Bet', icon: '&#128004;', active: true },
  { name: 'dairy', nameHt: 'Let', icon: '&#129371;', active: true },
  { name: 'eggs', nameHt: 'Ze', icon: '&#129370;', active: true },
  { name: 'herbs', nameHt: 'Fey', icon: '&#127807;', active: true },
  { name: 'other', nameHt: 'Lot', icon: '&#128230;', active: true }
];

// Sample sellers (will be created if they don't exist)
const sampleSellers = [
  {
    email: 'farmer.jean@example.com',
    name: 'Jean Baptiste',
    location: 'Petionville',
    credits: 500
  },
  {
    email: 'marie.farm@example.com',
    name: 'Marie Joseph',
    location: 'Delmas',
    credits: 750
  },
  {
    email: 'pierre.agriculture@example.com',
    name: 'Pierre Louis',
    location: 'Carrefour',
    credits: 300
  }
];

// Sample farm listings
const sampleListings = [
  {
    sellerEmail: 'farmer.jean@example.com',
    title: 'Fresh Organic Tomatoes',
    description: 'Locally grown organic tomatoes, picked fresh daily. Perfect for salads and cooking. No pesticides used.',
    category: 'vegetables',
    price: 25.00,
    unit: 'per kg',
    quantityAvailable: 50,
    location: 'Petionville Market',
    city: 'Petionville',
    organic: true,
    available: true
  },
  {
    sellerEmail: 'farmer.jean@example.com',
    title: 'Sweet Mangoes (Julie)',
    description: 'Delicious Julie mangoes from our family orchard. Sweet and juicy, perfect for eating fresh or making juice.',
    category: 'fruits',
    price: 40.00,
    unit: 'per dozen',
    quantityAvailable: 30,
    location: 'Petionville',
    city: 'Petionville',
    organic: false,
    available: true
  },
  {
    sellerEmail: 'marie.farm@example.com',
    title: 'Farm Fresh Eggs',
    description: 'Free-range chicken eggs from our farm in Delmas. Hens are fed natural grain diet. Collected fresh every morning.',
    category: 'eggs',
    price: 35.00,
    unit: 'per dozen',
    quantityAvailable: 100,
    location: 'Delmas 33',
    city: 'Delmas',
    organic: true,
    available: true
  },
  {
    sellerEmail: 'marie.farm@example.com',
    title: 'Fresh Goat Milk',
    description: 'Pure goat milk from healthy, pasture-raised goats. Rich in nutrients and great for cheese making.',
    category: 'dairy',
    price: 50.00,
    unit: 'per liter',
    quantityAvailable: 20,
    location: 'Delmas Farm',
    city: 'Delmas',
    organic: true,
    available: true
  },
  {
    sellerEmail: 'pierre.agriculture@example.com',
    title: 'Black Beans (Pwa Nwa)',
    description: 'Premium quality black beans, perfect for traditional Haitian dishes. Dried and ready for cooking.',
    category: 'grains',
    price: 60.00,
    unit: 'per kg',
    quantityAvailable: 200,
    location: 'Carrefour Market',
    city: 'Carrefour',
    organic: false,
    available: true
  },
  {
    sellerEmail: 'pierre.agriculture@example.com',
    title: 'Fresh Basil Bundle',
    description: 'Aromatic fresh basil, hand-picked from our herb garden. Perfect for cooking and garnishing.',
    category: 'herbs',
    price: 15.00,
    unit: 'per bundle',
    quantityAvailable: 40,
    location: 'Carrefour',
    city: 'Carrefour',
    organic: true,
    available: true
  },
  {
    sellerEmail: 'farmer.jean@example.com',
    title: 'Young Goat (Kabrit)',
    description: 'Healthy young goat raised on natural pasture. Perfect for special occasions and traditional dishes.',
    category: 'livestock',
    price: 2500.00,
    unit: 'per unit',
    quantityAvailable: 5,
    location: 'Petionville Farm',
    city: 'Petionville',
    organic: false,
    available: true
  },
  {
    sellerEmail: 'marie.farm@example.com',
    title: 'Organic Spinach',
    description: 'Fresh organic spinach leaves, washed and ready to use. Great for salads, smoothies, or cooking.',
    category: 'vegetables',
    price: 20.00,
    unit: 'per bundle',
    quantityAvailable: 60,
    location: 'Delmas Market',
    city: 'Delmas',
    organic: true,
    available: true
  }
];

async function seed() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully');

    console.log('Syncing models...');
    await Category.sync({ alter: true });
    await User.sync({ alter: true });
    await Listing.sync({ alter: true });

    // Seed categories
    console.log('\nSeeding categories...');
    for (const cat of categories) {
      const existing = await Category.findOne({ where: { name: cat.name } });
      if (existing) {
        console.log(`  Updating: ${cat.name}`);
        await existing.update(cat);
      } else {
        console.log(`  Creating: ${cat.name}`);
        await Category.create(cat);
      }
    }

    // Create sample sellers
    console.log('\nCreating sample sellers...');
    const sellerMap = {};
    for (const seller of sampleSellers) {
      let user = await User.findOne({ where: { email: seller.email } });
      if (!user) {
        console.log(`  Creating seller: ${seller.name}`);
        user = await User.create({
          email: seller.email,
          name: seller.name,
          location: seller.location,
          credits: seller.credits,
          role: 'student' // Default role
        });
      } else {
        console.log(`  Seller exists: ${seller.name}`);
      }
      sellerMap[seller.email] = user.id;
    }

    // Seed listings
    console.log('\nSeeding farm listings...');
    for (const listing of sampleListings) {
      const sellerId = sellerMap[listing.sellerEmail];
      if (!sellerId) {
        console.log(`  Skipping: ${listing.title} (no seller found)`);
        continue;
      }

      const existing = await Listing.findOne({
        where: {
          sellerId,
          title: listing.title
        }
      });

      const listingData = {
        sellerId,
        title: listing.title,
        description: listing.description,
        category: listing.category,
        price: listing.price,
        unit: listing.unit,
        quantityAvailable: listing.quantityAvailable,
        location: listing.location,
        city: listing.city,
        organic: listing.organic,
        available: listing.available
      };

      if (existing) {
        console.log(`  Updating: ${listing.title}`);
        await existing.update(listingData);
      } else {
        console.log(`  Creating: ${listing.title}`);
        await Listing.create(listingData);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Seeding complete!');
    console.log('='.repeat(50));

    // Display summary
    const categoryCount = await Category.count();
    const listingCount = await Listing.count();
    const sellerCount = Object.keys(sellerMap).length;

    console.log(`\nSummary:`);
    console.log(`  Categories: ${categoryCount}`);
    console.log(`  Sellers: ${sellerCount}`);
    console.log(`  Listings: ${listingCount}`);

    console.log('\nCategories:');
    const allCategories = await Category.findAll();
    allCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.nameHt})`);
    });

    console.log('\nListings:');
    const allListings = await Listing.findAll({
      include: [{ model: User, as: 'seller', attributes: ['name'] }]
    });
    allListings.forEach(listing => {
      console.log(`  - ${listing.title} (${listing.category}) - ${listing.price} credits ${listing.unit}`);
      console.log(`    Seller: ${listing.seller?.name || 'Unknown'} | ${listing.city}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
