# Ayiti Boats - Build Instructions

**Phase 1: Boat Services Platform**

## Overview
A platform for boat services - rentals, tours, water taxi, and boat sales. Connect boat owners with customers for maritime transportation and tourism.

## Tech Stack
- **Backend:** Node.js + Express
- **Frontend:** HTML/CSS/JavaScript (Vanilla)
- **Database:** MySQL (via shared config)
- **Port:** 3007

## Folder Structure
```
boats/
├── server.js
├── package.json
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── routes/
│   ├── boats.js
│   ├── services.js
│   └── bookings.js
└── models/
    ├── Boat.js
    └── Booking.js
```

## Database Tables

### boats
```sql
CREATE TABLE boats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    owner_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('fishing', 'tour', 'taxi', 'cargo', 'sailboat', 'speedboat', 'other') NOT NULL,
    capacity INT NOT NULL,  -- number of passengers
    length_ft INT,
    engine_type VARCHAR(50),
    year_built INT,
    description TEXT,
    home_port VARCHAR(100),
    image_url VARCHAR(255),
    for_sale BOOLEAN DEFAULT FALSE,
    sale_price DECIMAL(12,2),
    active BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);
```

### boat_services
```sql
CREATE TABLE boat_services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    boat_id INT NOT NULL,
    service_type ENUM('rental', 'tour', 'taxi', 'fishing_trip', 'private_charter') NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    duration_hours INT,
    price DECIMAL(10,2) NOT NULL,
    price_type ENUM('per_hour', 'per_trip', 'per_person') DEFAULT 'per_trip',
    max_passengers INT,
    departure_port VARCHAR(100),
    destination VARCHAR(200),
    includes TEXT,  -- what's included
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (boat_id) REFERENCES boats(id)
);
```

### boat_bookings
```sql
CREATE TABLE boat_bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_id INT NOT NULL,
    boat_id INT NOT NULL,
    customer_id INT NOT NULL,
    owner_id INT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME,
    passengers INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    special_requests TEXT,
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES boat_services(id),
    FOREIGN KEY (boat_id) REFERENCES boats(id),
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);
```

### ports
```sql
CREATE TABLE ports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(50),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    description TEXT,
    facilities TEXT,  -- available facilities
    active BOOLEAN DEFAULT TRUE
);
```

## API Endpoints

### Boats
- `GET /api/boats` - All boats (with filters)
- `GET /api/boats/:id` - Boat details
- `POST /api/boats` - Register boat (owner)
- `PUT /api/boats/:id` - Update boat
- `DELETE /api/boats/:id` - Remove boat
- `GET /api/boats/for-sale` - Boats for sale
- `GET /api/boats/type/:type` - By boat type

### Services
- `GET /api/services` - All available services
- `GET /api/services/:id` - Service details
- `POST /api/services` - Create service (boat owner)
- `PUT /api/services/:id` - Update service
- `GET /api/services/type/:type` - By service type
- `GET /api/services/boat/:boatId` - Services for a boat

### Bookings
- `POST /api/bookings` - Make booking
- `GET /api/bookings/customer` - Customer's bookings
- `GET /api/bookings/owner` - Owner's bookings
- `PUT /api/bookings/:id/status` - Update booking status
- `GET /api/bookings/availability?serviceId=&date=` - Check availability

### Ports
- `GET /api/ports` - All ports

## Features (Phase 1)
1. Browse boat services by type
2. View boat profiles and photos
3. Search by port, service type, capacity
4. Book tours and rentals
5. Water taxi booking
6. Boats for sale section
7. Booking calendar (simple date picker)
8. Mobile-responsive design

## Service Types
1. **Tours** - Island hopping, coastal tours, sunset cruises
2. **Water Taxi** - Point-to-point transportation
3. **Fishing Trips** - Guided fishing expeditions
4. **Private Charter** - Full boat rental
5. **Rentals** - Self-operated boat rental

## Shared Integration
```javascript
const db = require('../shared/config/database');
const User = require('../shared/models/User');
const { deductCredits, addCredits } = require('../shared/utils/credits');
```

## UI Design
- Theme: Navy blue and white (#1E3A8A, #3B82F6, #FFFFFF)
- Nautical styling
- Large boat images
- Service cards with pricing
- Simple booking form
- Port locations

## Seed Data
- 5 sample boats
- 10 sample services (mix of types)
- Main ports: Port-au-Prince, Cap-Haïtien, Jacmel, Île-à-Vache, Les Cayes

## Popular Routes to Include
- Port-au-Prince → Île de la Gonâve
- Cap-Haïtien → Île de la Tortue
- Jacmel coastal tours
- Île-à-Vache day trips

## Build Order
1. Create folder structure
2. Set up Express server
3. Create database models
4. Build boats routes
5. Build services routes
6. Build bookings routes
7. Add ports reference data
8. Create frontend UI
9. Seed sample data
