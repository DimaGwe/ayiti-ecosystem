/**
 * Farms Models Index
 * Export all models and set up associations
 */

const Listing = require('./Listing');
const Order = require('./Order');
const Category = require('./Category');
const User = require('../../shared/models/User');

// Set up associations
// Listing belongs to seller (User)
Listing.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
User.hasMany(Listing, { foreignKey: 'sellerId', as: 'farmListings' });

// Order associations
Order.belongsTo(Listing, { foreignKey: 'listingId', as: 'listing' });
Listing.hasMany(Order, { foreignKey: 'listingId', as: 'orders' });

Order.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });
User.hasMany(Order, { foreignKey: 'buyerId', as: 'farmOrdersAsBuyer' });

Order.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
User.hasMany(Order, { foreignKey: 'sellerId', as: 'farmOrdersAsSeller' });

module.exports = {
  Listing,
  Order,
  Category
};
