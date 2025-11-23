/**
 * Categories Routes
 * Handle farm product categories
 */

const express = require('express');
const router = express.Router();
const { Category, Listing } = require('../models');
const { Sequelize } = require('sequelize');

// Default categories with icons
const DEFAULT_CATEGORIES = [
  { name: 'vegetables', nameHt: 'Legim', icon: '🥬' },
  { name: 'fruits', nameHt: 'Fwi', icon: '🍎' },
  { name: 'grains', nameHt: 'Grenn', icon: '🌾' },
  { name: 'livestock', nameHt: 'Bèt', icon: '🐄' },
  { name: 'dairy', nameHt: 'Lèt', icon: '🥛' },
  { name: 'eggs', nameHt: 'Ze', icon: '🥚' },
  { name: 'herbs', nameHt: 'Fèy', icon: '🌿' },
  { name: 'other', nameHt: 'Lòt', icon: '📦' }
];

/**
 * GET /api/categories
 * Get all active categories with listing counts
 */
router.get('/', async (req, res) => {
  try {
    // Try to get from database first
    let categories = await Category.findAll({
      where: { active: true },
      order: [['name', 'ASC']]
    });

    // If no categories in DB, use defaults
    if (categories.length === 0) {
      categories = DEFAULT_CATEGORIES.map((cat, index) => ({
        id: index + 1,
        ...cat,
        active: true
      }));
    } else {
      categories = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        nameHt: cat.nameHt,
        icon: cat.icon,
        active: cat.active
      }));
    }

    // Get listing counts per category
    const listingCounts = await Listing.findAll({
      attributes: [
        'category',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: { available: true },
      group: ['category'],
      raw: true
    });

    // Create a map of category -> count
    const countMap = {};
    listingCounts.forEach(item => {
      countMap[item.category] = parseInt(item.count);
    });

    // Add counts to categories
    const categoriesWithCounts = categories.map(cat => ({
      ...cat,
      listingCount: countMap[cat.name] || 0
    }));

    res.json({
      success: true,
      categories: categoriesWithCounts
    });
  } catch (error) {
    console.error('Error fetching categories:', error);

    // Fallback to default categories on error
    res.json({
      success: true,
      categories: DEFAULT_CATEGORIES.map((cat, index) => ({
        id: index + 1,
        ...cat,
        active: true,
        listingCount: 0
      }))
    });
  }
});

/**
 * GET /api/categories/:name
 * Get single category details
 */
router.get('/:name', async (req, res) => {
  try {
    const category = await Category.findOne({
      where: { name: req.params.name }
    });

    if (!category) {
      // Check if it's a valid default category
      const defaultCat = DEFAULT_CATEGORIES.find(c => c.name === req.params.name);
      if (defaultCat) {
        return res.json({
          success: true,
          category: {
            ...defaultCat,
            active: true
          }
        });
      }

      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        nameHt: category.nameHt,
        icon: category.icon,
        active: category.active
      }
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category'
    });
  }
});

module.exports = router;
