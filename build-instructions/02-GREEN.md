# Ayiti Green - Build Instructions

**Phase 1: Recycling Rewards Platform**

## Overview
A recycling rewards app where users earn credits by recycling waste. Track environmental impact and find collection points.

## Tech Stack
- **Backend:** Node.js + Express
- **Frontend:** HTML/CSS/JavaScript (Vanilla)
- **Database:** MySQL (via shared config)
- **Port:** 3003

## Folder Structure
```
green/
├── server.js
├── package.json
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── routes/
│   ├── recycling.js
│   ├── locations.js
│   └── impact.js
└── models/
    ├── RecyclingLog.js
    └── CollectionPoint.js
```

## Database Tables

### recycling_logs
```sql
CREATE TABLE recycling_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    waste_type ENUM('plastic', 'paper', 'metal', 'glass', 'organic', 'electronics') NOT NULL,
    weight_kg DECIMAL(10,2) NOT NULL,
    credits_earned INT NOT NULL,
    collection_point_id INT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### collection_points
```sql
CREATE TABLE collection_points (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(50),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    accepts JSON,  -- ["plastic", "paper", "metal"]
    hours VARCHAR(100),
    phone VARCHAR(20),
    active BOOLEAN DEFAULT TRUE
);
```

### user_impact
```sql
CREATE TABLE user_impact (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    total_kg DECIMAL(10,2) DEFAULT 0,
    plastic_kg DECIMAL(10,2) DEFAULT 0,
    paper_kg DECIMAL(10,2) DEFAULT 0,
    metal_kg DECIMAL(10,2) DEFAULT 0,
    co2_saved_kg DECIMAL(10,2) DEFAULT 0,
    trees_saved DECIMAL(10,2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## API Endpoints

### Recycling
- `POST /api/recycling/log` - Log recycling activity
- `GET /api/recycling/history` - User's recycling history
- `GET /api/recycling/rates` - Credits per kg by type

### Locations
- `GET /api/locations` - All collection points
- `GET /api/locations/nearby?lat=&lng=` - Nearby points
- `GET /api/locations/:id` - Point details

### Impact
- `GET /api/impact/user/:id` - User's environmental impact
- `GET /api/impact/community` - Total community impact

## Features (Phase 1)
1. Log recycling by type and weight
2. Credits: Plastic=5/kg, Paper=3/kg, Metal=8/kg, Glass=4/kg
3. View collection points on map (static for now)
4. Track personal environmental impact
5. Community impact dashboard
6. CO2 calculation (1kg plastic = 2.5kg CO2 saved)
7. Mobile-responsive UI

## Shared Integration
```javascript
const db = require('../shared/config/database');
const User = require('../shared/models/User');
const { addCredits } = require('../shared/utils/credits');
```

## UI Design
- Theme: Green gradients (#10B981, #059669)
- Earth/nature imagery
- Impact visualizations (trees, CO2)
- Simple logging form
- Collection point cards

## Seed Data
- 5 collection points in Port-au-Prince area
- Sample recycling rates

## Build Order
1. Create folder structure
2. Set up Express server
3. Create database models
4. Build recycling routes
5. Build locations routes
6. Create frontend UI
7. Add impact calculations
8. Seed collection points
