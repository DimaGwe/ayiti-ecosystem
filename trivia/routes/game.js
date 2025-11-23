/**
 * Game Routes
 * API endpoints for trivia game flow
 */

const express = require('express');
const router = express.Router();
const { Question, Answer, GameSession, Leaderboard, User } = require('../models');
const { addCredits } = require('../../shared/utils/credits');
const { Op } = require('sequelize');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  next();
};

/**
 * GET /api/game/start
 * Start a new game session
 */
router.get('/start', requireAuth, async (req, res) => {
  try {
    // Check for any incomplete sessions
    const existingSession = await GameSession.findOne({
      where: {
        userId: req.user.id,
        completedAt: null
      }
    });

    if (existingSession) {
      // Return existing session
      return res.json({
        success: true,
        session: {
          id: existingSession.id,
          score: existingSession.score,
          questionsAnswered: existingSession.questionsAnswered,
          totalQuestions: GameSession.QUESTIONS_PER_GAME,
          resumed: true
        }
      });
    }

    // Get random questions (10 questions, mix of categories and difficulties)
    const questions = await Question.findAll({
      order: sequelize.random(),
      limit: GameSession.QUESTIONS_PER_GAME,
      attributes: ['id']
    });

    if (questions.length < GameSession.QUESTIONS_PER_GAME) {
      return res.status(400).json({
        success: false,
        error: 'Not enough questions available. Please seed the database.'
      });
    }

    const questionIds = questions.map(q => q.id);

    // Create new session
    const session = await GameSession.create({
      userId: req.user.id,
      questionIds: questionIds,
      score: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      currentQuestionIndex: 0
    });

    res.json({
      success: true,
      session: {
        id: session.id,
        score: 0,
        questionsAnswered: 0,
        totalQuestions: GameSession.QUESTIONS_PER_GAME,
        timePerQuestion: GameSession.TIME_PER_QUESTION
      }
    });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start game'
    });
  }
});

// Need to import sequelize for random()
const sequelize = require('../../shared/config/database');

/**
 * GET /api/game/question
 * Get the current question for active session
 */
router.get('/question', requireAuth, async (req, res) => {
  try {
    // Find active session
    const session = await GameSession.findOne({
      where: {
        userId: req.user.id,
        completedAt: null
      }
    });

    if (!session) {
      return res.status(400).json({
        success: false,
        error: 'No active game session. Start a new game first.'
      });
    }

    // Check if game is complete
    if (session.currentQuestionIndex >= GameSession.QUESTIONS_PER_GAME) {
      return res.json({
        success: true,
        gameComplete: true,
        score: session.score,
        correctAnswers: session.correctAnswers
      });
    }

    // Get current question
    const questionIds = session.questionIds;
    const currentQuestionId = questionIds[session.currentQuestionIndex];

    const question = await Question.findByPk(currentQuestionId, {
      include: [{
        model: Answer,
        as: 'answers',
        attributes: ['id', 'answerText']
      }]
    });

    if (!question) {
      return res.status(500).json({
        success: false,
        error: 'Question not found'
      });
    }

    // Shuffle answers
    const shuffledAnswers = question.answers.sort(() => Math.random() - 0.5);

    res.json({
      success: true,
      question: {
        id: question.id,
        category: question.category,
        text: question.questionText,
        difficulty: question.difficulty,
        points: Question.getPoints(question.difficulty),
        answers: shuffledAnswers.map(a => ({
          id: a.id,
          text: a.answerText
        }))
      },
      progress: {
        current: session.currentQuestionIndex + 1,
        total: GameSession.QUESTIONS_PER_GAME,
        score: session.score,
        timeLimit: GameSession.TIME_PER_QUESTION
      }
    });
  } catch (error) {
    console.error('Error getting question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get question'
    });
  }
});

/**
 * POST /api/game/answer
 * Submit an answer and get result
 */
router.post('/answer', requireAuth, async (req, res) => {
  try {
    const { answerId, timedOut } = req.body;

    // Find active session
    const session = await GameSession.findOne({
      where: {
        userId: req.user.id,
        completedAt: null
      }
    });

    if (!session) {
      return res.status(400).json({
        success: false,
        error: 'No active game session'
      });
    }

    // Get current question
    const questionIds = session.questionIds;
    const currentQuestionId = questionIds[session.currentQuestionIndex];

    const question = await Question.findByPk(currentQuestionId, {
      include: [{
        model: Answer,
        as: 'answers'
      }]
    });

    // Find correct answer
    const correctAnswer = question.answers.find(a => a.isCorrect);
    let isCorrect = false;
    let pointsEarned = 0;

    if (!timedOut && answerId) {
      // Check if selected answer is correct
      const selectedAnswer = question.answers.find(a => a.id === answerId);
      isCorrect = selectedAnswer && selectedAnswer.isCorrect;

      if (isCorrect) {
        pointsEarned = Question.getPoints(question.difficulty);
        session.score += pointsEarned;
        session.correctAnswers += 1;
      }
    }

    // Update session
    session.questionsAnswered += 1;
    session.currentQuestionIndex += 1;
    await session.save();

    // Check if game is complete
    const gameComplete = session.currentQuestionIndex >= GameSession.QUESTIONS_PER_GAME;

    res.json({
      success: true,
      result: {
        correct: isCorrect,
        pointsEarned,
        correctAnswerId: correctAnswer.id,
        correctAnswerText: correctAnswer.answerText
      },
      progress: {
        current: session.currentQuestionIndex,
        total: GameSession.QUESTIONS_PER_GAME,
        score: session.score,
        correctAnswers: session.correctAnswers
      },
      gameComplete
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit answer'
    });
  }
});

/**
 * POST /api/game/end
 * End the game session and calculate rewards
 */
router.post('/end', requireAuth, async (req, res) => {
  try {
    // Find active session
    const session = await GameSession.findOne({
      where: {
        userId: req.user.id,
        completedAt: null
      }
    });

    if (!session) {
      return res.status(400).json({
        success: false,
        error: 'No active game session'
      });
    }

    // Calculate credits earned (score / 10)
    const creditsEarned = Math.floor(session.score / 10);

    // Mark session as complete
    session.completedAt = new Date();
    session.creditsEarned = creditsEarned;
    await session.save();

    // Award credits to user
    if (creditsEarned > 0) {
      await addCredits(
        req.user.id,
        creditsEarned,
        'Trivia game completion',
        { sessionId: session.id, score: session.score }
      );
    }

    // Update leaderboard
    let leaderboardEntry = await Leaderboard.findOne({
      where: { userId: req.user.id }
    });

    if (leaderboardEntry) {
      leaderboardEntry.totalScore += session.score;
      leaderboardEntry.gamesPlayed += 1;
      leaderboardEntry.totalCorrect += session.correctAnswers;
      leaderboardEntry.totalQuestions += session.questionsAnswered;
      if (session.score > leaderboardEntry.bestScore) {
        leaderboardEntry.bestScore = session.score;
      }
      await leaderboardEntry.save();
    } else {
      await Leaderboard.create({
        userId: req.user.id,
        totalScore: session.score,
        gamesPlayed: 1,
        bestScore: session.score,
        totalCorrect: session.correctAnswers,
        totalQuestions: session.questionsAnswered
      });
    }

    // Get updated user credits
    const user = await User.findByPk(req.user.id);

    res.json({
      success: true,
      summary: {
        score: session.score,
        correctAnswers: session.correctAnswers,
        totalQuestions: session.questionsAnswered,
        accuracy: Math.round((session.correctAnswers / session.questionsAnswered) * 100),
        creditsEarned,
        totalCredits: user.credits
      }
    });
  } catch (error) {
    console.error('Error ending game:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end game'
    });
  }
});

/**
 * DELETE /api/game/abandon
 * Abandon current game without rewards
 */
router.delete('/abandon', requireAuth, async (req, res) => {
  try {
    const session = await GameSession.findOne({
      where: {
        userId: req.user.id,
        completedAt: null
      }
    });

    if (session) {
      await session.destroy();
    }

    res.json({
      success: true,
      message: 'Game abandoned'
    });
  } catch (error) {
    console.error('Error abandoning game:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to abandon game'
    });
  }
});

/**
 * GET /api/game/stats
 * Get user's game statistics
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const leaderboardEntry = await Leaderboard.findOne({
      where: { userId: req.user.id }
    });

    if (!leaderboardEntry) {
      return res.json({
        success: true,
        stats: {
          gamesPlayed: 0,
          totalScore: 0,
          bestScore: 0,
          accuracy: 0,
          rank: null
        }
      });
    }

    // Get user's rank
    const rank = await Leaderboard.count({
      where: {
        totalScore: { [Op.gt]: leaderboardEntry.totalScore }
      }
    }) + 1;

    res.json({
      success: true,
      stats: {
        gamesPlayed: leaderboardEntry.gamesPlayed,
        totalScore: leaderboardEntry.totalScore,
        bestScore: leaderboardEntry.bestScore,
        accuracy: leaderboardEntry.totalQuestions > 0
          ? Math.round((leaderboardEntry.totalCorrect / leaderboardEntry.totalQuestions) * 100)
          : 0,
        rank
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats'
    });
  }
});

module.exports = router;
