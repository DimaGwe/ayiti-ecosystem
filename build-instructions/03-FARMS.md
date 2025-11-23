# Ayiti Farms - Build Instructions

**Phase 1: Agriculture Marketplace**

## Overview
A marketplace connecting local farmers with buyers. List produce, livestock, and farm products. Support local agriculture and food security.

## Tech Stack
- **Backend:** Node.js + Express
- **Frontend:** HTML/CSS/JavaScript (Vanilla)
- **Database:** MySQL (via shared config)
- **Port:** 3004

## Folder Structure
```
farms/
├── server.js
├── package.json
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── routes/
│   ├── listings.js
│   ├── categories.js
│   └── orders.js
└── models/
    ├── Listing.js
    └── Order.js
```

## Database Tables

### farm_listings
```sql
CREATE TABLE farm_listings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    seller_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category ENUM('vegetables', 'fruits', 'grains', 'livestock', 'dairy', 'eggs', 'herbs', 'other') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,  -- 'per kg', 'per dozen', 'per unit'
    quantity_available DECIMAL(10,2),
    location VARCHAR(100),
    city VARCHAR(50),
    image_url VARCHAR(255),
    organic BOOLEAN DEFAULT FALSE,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id)
);
```

### farm_orders
```sql
CREATE TABLE farm_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    listing_id INT NOT NULL,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
    delivery_method ENUM('pickup', 'delivery') DEFAULT 'pickup',
    delivery_address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES farm_listings(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES users(id)
);
```

### farm_categories
```sql
CREATE TABLE farm_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    name_ht VARCHAR(50),  -- Haitian Creole
    icon VARCHAR(50),
    active BOOLEAN DEFAULT TRUE
);
```

## API Endpoints

### Listings
- `GET /api/listings` - All active listings (with filters)
- `GET /api/listings/:id` - Single listing details
- `POST /api/listings` - Create new listing (seller)
- `PUT /api/listings/:id` - Update listing (owner only)
- `DELETE /api/listings/:id` - Remove listing (owner only)
- `GET /api/listings/seller/:id` - Listings by seller
- `GET /api/listings/category/:category` - Listings by category

### Categories
- `GET /api/categories` - All categories

### Orders
- `POST /api/orders` - Place order
- `GET /api/orders/buyer` - Buyer's orders
- `GET /api/orders/seller` - Seller's orders
- `PUT /api/orders/:id/status` - Update order status

## Features (Phase 1)
1. Browse listings by category
2. Search by product name or location
3. Create listings (for verified sellers)
4. View listing details with seller info
5. Place orders (deducts credits)
6. Order status tracking
7. Filter: organic, location, price range
8. Mobile-responsive card layout

## Shared Integration
```javascript
const db = require('../shared/config/database');
const User = require('../shared/models/User');
const { deductCredits, addCredits } = require('../shared/utils/credits');
```

## UI Design
- Theme: Earth tones, greens and browns (#22C55E, #84CC16, #78716C)
- Farm/nature imagery
- Grid layout for listings
- Category icons (vegetables, fruits, livestock)
- Simple order flow

## Seed Data
- 8 sample farm listings
- All categories populated
- 2-3 sample sellers

## Build Order
1. Create folder structure
2. Set up Express server
3. Create database models
4. Build listings routes (CRUD)
5. Build categories route
6. Build orders routes
7. Create frontend UI
8. Add filtering and search
9. Seed sample data
