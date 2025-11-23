# Ayiti Trivia - Build Instructions

**Phase 1: Core Trivia Game**

## Overview
A play-to-earn trivia game where users answer questions to earn credits. Part of the Haiti Skills ecosystem.

## Tech Stack
- **Backend:** Node.js + Express
- **Frontend:** HTML/CSS/JavaScript (Vanilla)
- **Database:** MySQL (via shared config)
- **Port:** 3002

## Folder Structure
```
trivia/
├── server.js           # Express server
├── package.json
├── public/
│   ├── index.html      # Game UI
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── game.js     # Game logic
├── routes/
│   ├── game.js         # Game endpoints
│   └── leaderboard.js  # Leaderboard endpoints
└── models/
    ├── Question.js
    └── GameSession.js
```

## Database Tables

### questions
```sql
CREATE TABLE questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### answers
```sql
CREATE TABLE answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question_id INT NOT NULL,
    answer_text VARCHAR(255) NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (question_id) REFERENCES questions(id)
);
```

### game_sessions
```sql
CREATE TABLE game_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    score INT DEFAULT 0,
    questions_answered INT DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### leaderboard
```sql
CREATE TABLE leaderboard (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    total_score INT DEFAULT 0,
    games_played INT DEFAULT 0,
    best_score INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## API Endpoints

### Game
- `GET /api/game/start` - Start new game session
- `GET /api/game/question` - Get next question (4 answers)
- `POST /api/game/answer` - Submit answer, get result
- `POST /api/game/end` - End session, calculate rewards

### Leaderboard
- `GET /api/leaderboard` - Top 10 players
- `GET /api/leaderboard/user/:id` - User's stats

## Features (Phase 1)
1. Multiple choice questions (4 options)
2. Categories: Haiti History, Geography, Culture, General Knowledge
3. Timer: 15 seconds per question
4. Scoring: Easy=10, Medium=20, Hard=30 points
5. 10 questions per game
6. Credits reward: score / 10 credits
7. Leaderboard (top 10)
8. Mobile-responsive UI

## Shared Integration
```javascript
// Use shared database config
const db = require('../shared/config/database');

// Use shared User model
const User = require('../shared/models/User');

// Award credits after game
const { addCredits } = require('../shared/utils/credits');
```

## UI Design
- Dark theme (bg-gray-900)
- Accent color: Purple (#8B5CF6)
- Card-based question display
- Progress bar for timer
- Animated correct/wrong feedback
- Haiti flag colors accent

## Sample Questions (seed)
Include 20 starter questions across categories:
- 5 Haiti History
- 5 Haiti Geography
- 5 Haiti Culture
- 5 General Knowledge

## Build Order
1. Create folder structure
2. Set up Express server with CORS
3. Create database models
4. Build API routes
5. Create frontend HTML/CSS
6. Implement game.js logic
7. Add seed script for questions
8. Test game flow
