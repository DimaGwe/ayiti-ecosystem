/**
 * Listings Routes
 * Handle farm listings CRUD operations
 */

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Listing, Order } = require('../models');
const User = require('../../shared/models/User');

/**
 * GET /api/listings
 * Get all active listings with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const {
      category,
      city,
      organic,
      minPrice,
      maxPrice,
      search,
      limit = 20,
      offset = 0
    } = req.query;

    // Build where clause
    const where = { available: true };

    if (category) {
      where.category = category;
    }

    if (city) {
      where.city = { [Op.like]: `%${city}%` };
    }

    if (organic === 'true') {
      where.organic = true;
    }

    if (minPrice) {
      where.price = { ...where.price, [Op.gte]: parseFloat(minPrice) };
    }

    if (maxPrice) {
      where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) };
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const listings = await Listing.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'seller',
        attributes: ['id', 'name', 'avatar', 'location']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      listings: listings.rows.map(listing => ({
        id: listing.id,
        title: listing.title,
        description: listing.description,
        category: listing.category,
        price: parseFloat(listing.price),
        unit: listing.unit,
        quantityAvailable: listing.quantityAvailable ? parseFloat(listing.quantityAvailable) : null,
        location: listing.location,
        city: listing.city,
        imageUrl: listing.imageUrl,
        organic: listing.organic,
        seller: listing.seller ? {
          id: listing.seller.id,
          name: listing.seller.name,
          avatar: listing.seller.avatar,
          location: listing.seller.location
        } : null,
        createdAt: listing.created_at
      })),
      total: listings.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch listings'
    });
  }
});

/**
 * GET /api/listings/:id
 * Get single listing details
 */
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'seller',
        attributes: ['id', 'name', 'avatar', 'location', 'phone']
      }]
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    res.json({
      success: true,
      listing: {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        category: listing.category,
        price: parseFloat(listing.price),
        unit: listing.unit,
        quantityAvailable: listing.quantityAvailable ? parseFloat(listing.quantityAvailable) : null,
        location: listing.location,
        city: listing.city,
        imageUrl: listing.imageUrl,
        organic: listing.organic,
        available: listing.available,
        seller: listing.seller ? {
          id: listing.seller.id,
          name: listing.seller.name,
          avatar: listing.seller.avatar,
          location: listing.seller.location,
          phone: listing.seller.phone
        } : null,
        createdAt: listing.created_at,
        updatedAt: listing.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch listing'
    });
  }
});

/**
 * GET /api/listings/seller/:id
 * Get listings by seller
 */
router.get('/seller/:id', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const listings = await Listing.findAndCountAll({
      where: { sellerId: req.params.id },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      listings: listings.rows.map(listing => ({
        id: listing.id,
        title: listing.title,
        category: listing.category,
        price: parseFloat(listing.price),
        unit: listing.unit,
        quantityAvailable: listing.quantityAvailable ? parseFloat(listing.quantityAvailable) : null,
        imageUrl: listing.imageUrl,
        organic: listing.organic,
        available: listing.available,
        createdAt: listing.created_at
      })),
      total: listings.count
    });
  } catch (error) {
    console.error('Error fetching seller listings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch seller listings'
    });
  }
});

/**
 * GET /api/listings/category/:category
 * Get listings by category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const listings = await Listing.findAndCountAll({
      where: {
        category: req.params.category,
        available: true
      },
      include: [{
        model: User,
        as: 'seller',
        attributes: ['id', 'name', 'avatar', 'location']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      listings: listings.rows.map(listing => ({
        id: listing.id,
        title: listing.title,
        description: listing.description,
        category: listing.category,
        price: parseFloat(listing.price),
        unit: listing.unit,
        quantityAvailable: listing.quantityAvailable ? parseFloat(listing.quantityAvailable) : null,
        location: listing.location,
        city: listing.city,
        imageUrl: listing.imageUrl,
        organic: listing.organic,
        seller: listing.seller ? {
          id: listing.seller.id,
          name: listing.seller.name,
          avatar: listing.seller.avatar
        } : null,
        createdAt: listing.created_at
      })),
      total: listings.count
    });
  } catch (error) {
    console.error('Error fetching category listings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch listings'
    });
  }
});

/**
 * POST /api/listings
 * Create a new listing (authenticated sellers)
 */
router.post('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Please login to create a listing'
      });
    }

    const {
      title,
      description,
      category,
      price,
      unit,
      quantityAvailable,
      location,
      city,
      imageUrl,
      organic
    } = req.body;

    // Validate required fields
    if (!title || !category || !price || !unit) {
      return res.status(400).json({
        success: false,
        error: 'Title, category, price, and unit are required'
      });
    }

    const listing = await Listing.create({
      sellerId: req.user.id,
      title,
      description,
      category,
      price: parseFloat(price),
      unit,
      quantityAvailable: quantityAvailable ? parseFloat(quantityAvailable) : null,
      location: location || req.user.location,
      city,
      imageUrl,
      organic: organic === true || organic === 'true'
    });

    res.status(201).json({
      success: true,
      listing: {
        id: listing.id,
        title: listing.title,
        category: listing.category,
        price: parseFloat(listing.price),
        unit: listing.unit,
        createdAt: listing.created_at
      }
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create listing'
    });
  }
});

/**
 * PUT /api/listings/:id
 * Update a listing (owner only)
 */
router.put('/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Please login to update listing'
      });
    }

    const listing = await Listing.findByPk(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    // Check ownership
    if (listing.sellerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own listings'
      });
    }

    const {
      title,
      description,
      category,
      price,
      unit,
      quantityAvailable,
      location,
      city,
      imageUrl,
      organic,
      available
    } = req.body;

    // Update only provided fields
    if (title) listing.title = title;
    if (description !== undefined) listing.description = description;
    if (category) listing.category = category;
    if (price) listing.price = parseFloat(price);
    if (unit) listing.unit = unit;
    if (quantityAvailable !== undefined) listing.quantityAvailable = quantityAvailable ? parseFloat(quantityAvailable) : null;
    if (location !== undefined) listing.location = location;
    if (city !== undefined) listing.city = city;
    if (imageUrl !== undefined) listing.imageUrl = imageUrl;
    if (organic !== undefined) listing.organic = organic === true || organic === 'true';
    if (available !== undefined) listing.available = available === true || available === 'true';

    await listing.save();

    res.json({
      success: true,
      listing: {
        id: listing.id,
        title: listing.title,
        category: listing.category,
        price: parseFloat(listing.price),
        available: listing.available,
        updatedAt: listing.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update listing'
    });
  }
});

/**
 * DELETE /api/listings/:id
 * Delete a listing (owner only)
 */
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Please login to delete listing'
      });
    }

    const listing = await Listing.findByPk(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    // Check ownership
    if (listing.sellerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own listings'
      });
    }

    // Soft delete - mark as unavailable
    listing.available = false;
    await listing.save();

    res.json({
      success: true,
      message: 'Listing removed successfully'
    });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete listing'
    });
  }
});

module.exports = router;
