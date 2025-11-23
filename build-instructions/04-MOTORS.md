# Ayiti Motors - Build Instructions

**Phase 1: Vehicle Marketplace**

## Overview
A marketplace for buying and selling vehicles in Haiti. Cars, motorcycles, trucks, and parts. Connect sellers with buyers, support local auto economy.

## Tech Stack
- **Backend:** Node.js + Express
- **Frontend:** HTML/CSS/JavaScript (Vanilla)
- **Database:** MySQL (via shared config)
- **Port:** 3005

## Folder Structure
```
motors/
├── server.js
├── package.json
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── routes/
│   ├── vehicles.js
│   ├── parts.js
│   └── inquiries.js
└── models/
    ├── Vehicle.js
    └── Part.js
```

## Database Tables

### vehicles
```sql
CREATE TABLE vehicles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    seller_id INT NOT NULL,
    type ENUM('car', 'motorcycle', 'truck', 'suv', 'van', 'bus') NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT,
    price DECIMAL(12,2) NOT NULL,
    mileage INT,
    fuel_type ENUM('gasoline', 'diesel', 'electric', 'hybrid') DEFAULT 'gasoline',
    transmission ENUM('automatic', 'manual') DEFAULT 'manual',
    color VARCHAR(30),
    condition_rating ENUM('excellent', 'good', 'fair', 'needs_work') DEFAULT 'good',
    description TEXT,
    location VARCHAR(100),
    city VARCHAR(50),
    image_url VARCHAR(255),
    featured BOOLEAN DEFAULT FALSE,
    sold BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id)
);
```

### vehicle_parts
```sql
CREATE TABLE vehicle_parts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    seller_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    category ENUM('engine', 'transmission', 'brakes', 'electrical', 'body', 'interior', 'tires', 'other') NOT NULL,
    compatible_makes VARCHAR(255),  -- JSON array or comma-separated
    price DECIMAL(10,2) NOT NULL,
    condition_type ENUM('new', 'used', 'refurbished') DEFAULT 'used',
    description TEXT,
    location VARCHAR(100),
    image_url VARCHAR(255),
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id)
);
```

### vehicle_inquiries
```sql
CREATE TABLE vehicle_inquiries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_id INT,
    part_id INT,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    message TEXT NOT NULL,
    phone VARCHAR(20),
    status ENUM('new', 'read', 'replied', 'closed') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (part_id) REFERENCES vehicle_parts(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES users(id)
);
```

## API Endpoints

### Vehicles
- `GET /api/vehicles` - All vehicles (with filters)
- `GET /api/vehicles/:id` - Single vehicle details
- `POST /api/vehicles` - Create listing
- `PUT /api/vehicles/:id` - Update listing
- `DELETE /api/vehicles/:id` - Remove listing
- `GET /api/vehicles/featured` - Featured vehicles
- `GET /api/vehicles/type/:type` - By vehicle type

### Parts
- `GET /api/parts` - All parts
- `GET /api/parts/:id` - Part details
- `POST /api/parts` - Create part listing
- `GET /api/parts/category/:category` - By category

### Inquiries
- `POST /api/inquiries` - Send inquiry
- `GET /api/inquiries/seller` - Seller's inquiries
- `GET /api/inquiries/buyer` - Buyer's inquiries
- `PUT /api/inquiries/:id/status` - Update status

## Features (Phase 1)
1. Browse vehicles by type (car, motorcycle, truck)
2. Search by make, model, year
3. Filter by price range, fuel type, transmission
4. View vehicle details with photos
5. Contact seller via inquiry
6. Parts marketplace section
7. Featured listings carousel
8. Mobile-responsive grid

## Shared Integration
```javascript
const db = require('../shared/config/database');
const User = require('../shared/models/User');
```

## UI Design
- Theme: Dark grays and accent colors (#1F2937, #3B82F6, #EF4444)
- Automotive styling
- Large vehicle images
- Filter sidebar
- Quick contact buttons

## Seed Data
- 10 sample vehicles (mix of types)
- 5 sample parts
- Common makes: Toyota, Honda, Nissan, Hyundai

## Build Order
1. Create folder structure
2. Set up Express server
3. Create database models
4. Build vehicles routes
5. Build parts routes
6. Build inquiries routes
7. Create frontend UI
8. Add search and filters
9. Seed sample data
