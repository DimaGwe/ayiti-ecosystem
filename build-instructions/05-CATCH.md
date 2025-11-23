# Ayiti Catch - Build Instructions

**Phase 1: Fishing & Seafood Marketplace**

## Overview
A marketplace connecting fishermen with buyers. Fresh catch of the day, seafood products, and fishing supplies. Support local fishing communities.

## Tech Stack
- **Backend:** Node.js + Express
- **Frontend:** HTML/CSS/JavaScript (Vanilla)
- **Database:** MySQL (via shared config)
- **Port:** 3006

## Folder Structure
```
catch/
├── server.js
├── package.json
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── routes/
│   ├── catches.js
│   ├── fishermen.js
│   └── orders.js
└── models/
    ├── Catch.js
    └── Fisherman.js
```

## Database Tables

### catches
```sql
CREATE TABLE catches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fisherman_id INT NOT NULL,
    species VARCHAR(100) NOT NULL,
    category ENUM('fish', 'shellfish', 'crustacean', 'other') NOT NULL,
    weight_kg DECIMAL(10,2) NOT NULL,
    price_per_kg DECIMAL(10,2) NOT NULL,
    catch_date DATE NOT NULL,
    location VARCHAR(100),  -- fishing area
    port VARCHAR(100),  -- landing port
    fresh BOOLEAN DEFAULT TRUE,
    available_kg DECIMAL(10,2),
    description TEXT,
    image_url VARCHAR(255),
    sold_out BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (fisherman_id) REFERENCES users(id)
);
```

### fishermen_profiles
```sql
CREATE TABLE fishermen_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    boat_name VARCHAR(100),
    port VARCHAR(100),
    years_experience INT,
    specialties VARCHAR(255),  -- types of fish they catch
    verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0,
    total_sales INT DEFAULT 0,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### catch_orders
```sql
CREATE TABLE catch_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    catch_id INT NOT NULL,
    buyer_id INT NOT NULL,
    fisherman_id INT NOT NULL,
    quantity_kg DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'ready_pickup', 'completed', 'cancelled') DEFAULT 'pending',
    pickup_location VARCHAR(200),
    pickup_time DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (catch_id) REFERENCES catches(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (fisherman_id) REFERENCES users(id)
);
```

### fish_species
```sql
CREATE TABLE fish_species (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    name_ht VARCHAR(100),  -- Haitian Creole name
    name_fr VARCHAR(100),  -- French name
    category ENUM('fish', 'shellfish', 'crustacean', 'other') NOT NULL,
    common BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(255)
);
```

## API Endpoints

### Catches
- `GET /api/catches` - Today's catches (with filters)
- `GET /api/catches/:id` - Catch details
- `POST /api/catches` - Post new catch (fishermen)
- `PUT /api/catches/:id` - Update catch
- `DELETE /api/catches/:id` - Remove catch
- `GET /api/catches/today` - Today's fresh catches
- `GET /api/catches/species/:species` - By species

### Fishermen
- `GET /api/fishermen` - All fishermen profiles
- `GET /api/fishermen/:id` - Fisherman profile
- `POST /api/fishermen/register` - Register as fisherman
- `PUT /api/fishermen/:id` - Update profile
- `GET /api/fishermen/:id/catches` - Fisherman's catches

### Orders
- `POST /api/orders` - Place order
- `GET /api/orders/buyer` - Buyer's orders
- `GET /api/orders/fisherman` - Fisherman's orders
- `PUT /api/orders/:id/status` - Update order status

### Species
- `GET /api/species` - All fish species

## Features (Phase 1)
1. Browse today's fresh catches
2. Filter by species, port, price
3. View fisherman profiles and ratings
4. Order fish (partial kg allowed)
5. Pickup coordination
6. Common Haitian fish species
7. Freshness indicator (catch date)
8. Mobile-first responsive design

## Shared Integration
```javascript
const db = require('../shared/config/database');
const User = require('../shared/models/User');
const { deductCredits, addCredits } = require('../shared/utils/credits');
```

## UI Design
- Theme: Ocean blues and teals (#0EA5E9, #06B6D4, #0284C7)
- Wave/ocean imagery
- Fresh catch cards with date
- Fisherman profile badges
- Species icons

## Seed Data
- 10 common Haitian fish species (with Creole names)
- 5 sample catches
- 3 fisherman profiles
- Sample ports: Port-au-Prince, Cap-Haïtien, Jacmel, Les Cayes

## Common Species to Include
- Pwason wouj (Red snapper)
- Requin (Shark)
- Vivano (Lane snapper)
- Lanbi (Conch)
- Krab (Crab)
- Omad (Lobster)
- Tilapia
- Maquereau (Mackerel)

## Build Order
1. Create folder structure
2. Set up Express server
3. Create database models
4. Build catches routes
5. Build fishermen routes
6. Build orders routes
7. Add species reference data
8. Create frontend UI
9. Seed sample data
