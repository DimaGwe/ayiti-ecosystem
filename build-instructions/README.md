# Ayiti Ecosystem - Build Instructions

This folder contains detailed build instructions for each app in the Ayiti ecosystem.

## Build Order

| # | App | Port | Description | Status |
|---|-----|------|-------------|--------|
| 1 | [Trivia](01-TRIVIA.md) | 3002 | Play-to-earn quiz game | To Build |
| 2 | [Green](02-GREEN.md) | 3003 | Recycling rewards platform | To Build |
| 3 | [Farms](03-FARMS.md) | 3004 | Agriculture marketplace | To Build |
| 4 | [Motors](04-MOTORS.md) | 3005 | Vehicle marketplace | To Build |
| 5 | [Catch](05-CATCH.md) | 3006 | Fishing/seafood marketplace | To Build |
| 6 | [Boats](06-BOATS.md) | 3007 | Boat services platform | To Build |

## Already Built

- **shared/** - Shared utilities, database config, User model, credits system
- **home/** (port 3000) - Landing page / portal
- **academy/** (port 3001) - Skills Academy - courses, jobs, certifications

## Shared Code

All apps must use the shared library located at `../shared/`:

```javascript
// Database connection
const db = require('../shared/config/database');

// User model (authentication, profile)
const User = require('../shared/models/User');

// Credits system
const { addCredits, deductCredits, getBalance } = require('../shared/utils/credits');
```

## Tech Stack (All Apps)

- **Backend:** Node.js + Express
- **Frontend:** HTML/CSS/JavaScript (Vanilla)
- **Database:** MySQL
- **Styling:** Tailwind CSS (via CDN) or custom CSS

## Key Patterns

### Server Setup
```javascript
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/...', require('./routes/...'));

const PORT = process.env.PORT || 300X;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### Route Pattern
```javascript
const express = require('express');
const router = express.Router();
const db = require('../../shared/config/database');

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM ...');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
```

## Building an App

For each app:

1. Read the instruction file (e.g., `01-TRIVIA.md`)
2. Create the folder structure as specified
3. Create `package.json` with required dependencies
4. Set up `server.js` with Express
5. Create database models in `models/`
6. Create API routes in `routes/`
7. Build the frontend in `public/`
8. Add seed data if specified
9. Test by running `npm install && npm start`

## Database

All tables are in the same MySQL database. The shared config handles the connection:

```javascript
// shared/config/database.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ayiti_ecosystem',
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = pool;
```

## Credits System

The ecosystem uses a unified credits system:
- Users earn credits (playing trivia, recycling, selling)
- Users spend credits (buying products, services)
- Credits are tracked in the `users` table (`credits` column)

## Notes for Claude Code

- Follow the folder structure exactly as specified
- Use the shared library for database and user operations
- Each app should be self-contained and runnable independently
- Test database tables should be created via SQL scripts or on first run
- Use responsive design (mobile-first)
- Keep code simple and readable
