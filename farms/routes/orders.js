/**
 * Orders Routes
 * Handle farm product orders
 */

const express = require('express');
const router = express.Router();
const { Order, Listing } = require('../models');
const User = require('../../shared/models/User');
const { spendCredits, addCredits } = require('../../shared/utils/credits');

/**
 * POST /api/orders
 * Place a new order
 */
router.post('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Please login to place an order'
      });
    }

    const { listingId, quantity, deliveryMethod, deliveryAddress, notes } = req.body;

    // Validate required fields
    if (!listingId || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Listing ID and quantity are required'
      });
    }

    // Get the listing
    const listing = await Listing.findByPk(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    if (!listing.available) {
      return res.status(400).json({
        success: false,
        error: 'This listing is no longer available'
      });
    }

    // Can't order your own listing
    if (listing.sellerId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot order your own listing'
      });
    }

    // Check quantity available
    if (listing.quantityAvailable && parseFloat(quantity) > listing.quantityAvailable) {
      return res.status(400).json({
        success: false,
        error: `Only ${listing.quantityAvailable} ${listing.unit} available`
      });
    }

    // Calculate total price
    const qty = parseFloat(quantity);
    const totalPrice = qty * parseFloat(listing.price);

    // Check if buyer has enough credits
    if (req.user.credits < totalPrice) {
      return res.status(400).json({
        success: false,
        error: `Insufficient credits. Need ${totalPrice}, have ${req.user.credits}`
      });
    }

    // Deduct credits from buyer
    await spendCredits(
      req.user.id,
      totalPrice,
      `Order for ${listing.title}`,
      { listingId: listing.id }
    );

    // Create the order
    const order = await Order.create({
      listingId: listing.id,
      buyerId: req.user.id,
      sellerId: listing.sellerId,
      quantity: qty,
      totalPrice,
      status: 'pending',
      deliveryMethod: deliveryMethod || 'pickup',
      deliveryAddress,
      notes
    });

    // Update quantity available
    if (listing.quantityAvailable) {
      listing.quantityAvailable = parseFloat(listing.quantityAvailable) - qty;
      if (listing.quantityAvailable <= 0) {
        listing.available = false;
      }
      await listing.save();
    }

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        quantity: parseFloat(order.quantity),
        totalPrice: parseFloat(order.totalPrice),
        status: order.status,
        deliveryMethod: order.deliveryMethod,
        createdAt: order.created_at
      },
      newBalance: req.user.credits - totalPrice
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

/**
 * GET /api/orders/buyer
 * Get orders placed by the current user
 */
router.get('/buyer', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Please login to view orders'
      });
    }

    const { limit = 20, offset = 0, status } = req.query;

    const where = { buyerId: req.user.id };
    if (status) {
      where.status = status;
    }

    const orders = await Order.findAndCountAll({
      where,
      include: [
        {
          model: Listing,
          as: 'listing',
          attributes: ['id', 'title', 'price', 'unit', 'imageUrl', 'category']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'name', 'avatar', 'phone', 'location']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      orders: orders.rows.map(order => ({
        id: order.id,
        quantity: parseFloat(order.quantity),
        totalPrice: parseFloat(order.totalPrice),
        status: order.status,
        deliveryMethod: order.deliveryMethod,
        deliveryAddress: order.deliveryAddress,
        notes: order.notes,
        listing: order.listing ? {
          id: order.listing.id,
          title: order.listing.title,
          price: parseFloat(order.listing.price),
          unit: order.listing.unit,
          imageUrl: order.listing.imageUrl,
          category: order.listing.category
        } : null,
        seller: order.seller ? {
          id: order.seller.id,
          name: order.seller.name,
          avatar: order.seller.avatar,
          phone: order.seller.phone,
          location: order.seller.location
        } : null,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      })),
      total: orders.count
    });
  } catch (error) {
    console.error('Error fetching buyer orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

/**
 * GET /api/orders/seller
 * Get orders received by the current user (as seller)
 */
router.get('/seller', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Please login to view orders'
      });
    }

    const { limit = 20, offset = 0, status } = req.query;

    const where = { sellerId: req.user.id };
    if (status) {
      where.status = status;
    }

    const orders = await Order.findAndCountAll({
      where,
      include: [
        {
          model: Listing,
          as: 'listing',
          attributes: ['id', 'title', 'price', 'unit', 'imageUrl', 'category']
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'name', 'avatar', 'phone', 'location']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      orders: orders.rows.map(order => ({
        id: order.id,
        quantity: parseFloat(order.quantity),
        totalPrice: parseFloat(order.totalPrice),
        status: order.status,
        deliveryMethod: order.deliveryMethod,
        deliveryAddress: order.deliveryAddress,
        notes: order.notes,
        listing: order.listing ? {
          id: order.listing.id,
          title: order.listing.title,
          price: parseFloat(order.listing.price),
          unit: order.listing.unit,
          imageUrl: order.listing.imageUrl,
          category: order.listing.category
        } : null,
        buyer: order.buyer ? {
          id: order.buyer.id,
          name: order.buyer.name,
          avatar: order.buyer.avatar,
          phone: order.buyer.phone,
          location: order.buyer.location
        } : null,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      })),
      total: orders.count
    });
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

/**
 * PUT /api/orders/:id/status
 * Update order status (seller only)
 */
router.put('/:id/status', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Please login to update order'
      });
    }

    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'ready', 'delivered', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Listing, as: 'listing' }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Only seller can update status (or buyer can cancel)
    const isSeller = order.sellerId === req.user.id;
    const isBuyer = order.buyerId === req.user.id;

    if (!isSeller && !isBuyer) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this order'
      });
    }

    // Buyer can only cancel pending orders
    if (isBuyer && !isSeller) {
      if (status !== 'cancelled' || order.status !== 'pending') {
        return res.status(403).json({
          success: false,
          error: 'Buyers can only cancel pending orders'
        });
      }
    }

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    // Handle status changes
    if (status === 'delivered' && previousStatus !== 'delivered') {
      // Transfer credits to seller when order is delivered
      await addCredits(
        order.sellerId,
        parseFloat(order.totalPrice),
        `Sale of ${order.listing?.title || 'farm product'}`,
        { orderId: order.id }
      );
    }

    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      // Refund credits to buyer when order is cancelled
      await addCredits(
        order.buyerId,
        parseFloat(order.totalPrice),
        `Refund for cancelled order`,
        { orderId: order.id }
      );

      // Restore quantity if applicable
      if (order.listing && order.listing.quantityAvailable !== null) {
        order.listing.quantityAvailable = parseFloat(order.listing.quantityAvailable) + parseFloat(order.quantity);
        order.listing.available = true;
        await order.listing.save();
      }
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        previousStatus,
        updatedAt: order.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
});

/**
 * GET /api/orders/:id
 * Get single order details
 */
router.get('/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Please login to view order'
      });
    }

    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: Listing,
          as: 'listing',
          attributes: ['id', 'title', 'price', 'unit', 'imageUrl', 'category', 'location', 'city']
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'name', 'avatar', 'phone', 'location']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'name', 'avatar', 'phone', 'location']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if user is buyer or seller
    if (order.buyerId !== req.user.id && order.sellerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        quantity: parseFloat(order.quantity),
        totalPrice: parseFloat(order.totalPrice),
        status: order.status,
        deliveryMethod: order.deliveryMethod,
        deliveryAddress: order.deliveryAddress,
        notes: order.notes,
        listing: order.listing,
        buyer: order.buyer,
        seller: order.seller,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

module.exports = router;
