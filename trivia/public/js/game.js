/**
 * Ayiti Trivia - Game Logic
 * Handles game flow, API calls, and UI updates
 */

// ==================== State ====================
const state = {
  user: null,
  currentView: 'home',
  gameSession: null,
  currentQuestion: null,
  timer: null,
  timeRemaining: 15,
  isAnswering: false
};

// ==================== DOM Elements ====================
const elements = {
  // Views
  homeView: document.getElementById('home-view'),
  gameView: document.getElementById('game-view'),
  resultsView: document.getElementById('results-view'),
  leaderboardView: document.getElementById('leaderboard-view'),

  // User
  userInfo: document.getElementById('user-info'),
  loginBtn: document.getElementById('login-btn'),
  logoutBtn: document.getElementById('logout-btn'),
  userAvatar: document.getElementById('user-avatar'),
  userName: document.getElementById('user-name'),
  userCredits: document.getElementById('user-credits'),

  // Home
  startGameBtn: document.getElementById('start-game-btn'),
  loginPrompt: document.getElementById('login-prompt'),
  userStats: document.getElementById('user-stats'),

  // Game
  questionNumber: document.getElementById('question-number'),
  totalQuestions: document.getElementById('total-questions'),
  currentScore: document.getElementById('current-score'),
  timerBar: document.getElementById('timer-bar'),
  timerSeconds: document.getElementById('timer-seconds'),
  questionCategory: document.getElementById('question-category'),
  questionDifficulty: document.getElementById('question-difficulty'),
  questionPoints: document.getElementById('question-points'),
  questionText: document.getElementById('question-text'),
  answersContainer: document.getElementById('answers-container'),
  feedback: document.getElementById('feedback'),
  feedbackIcon: document.getElementById('feedback-icon'),
  feedbackText: document.getElementById('feedback-text'),
  nextQuestionBtn: document.getElementById('next-question-btn'),

  // Results
  finalScore: document.getElementById('final-score'),
  resultCorrect: document.getElementById('result-correct'),
  resultTotal: document.getElementById('result-total'),
  resultAccuracy: document.getElementById('result-accuracy'),
  creditsEarned: document.getElementById('credits-earned'),
  creditsTotal: document.getElementById('credits-total'),
  playAgainBtn: document.getElementById('play-again-btn'),
  viewLeaderboardBtn: document.getElementById('view-leaderboard-btn'),

  // Leaderboard
  leaderboardList: document.getElementById('leaderboard-list'),
  backHomeBtn: document.getElementById('back-home-btn'),

  // Stats
  statGames: document.getElementById('stat-games'),
  statScore: document.getElementById('stat-score'),
  statBest: document.getElementById('stat-best'),
  statAccuracy: document.getElementById('stat-accuracy')
};

// ==================== API Functions ====================
const api = {
  async getUser() {
    try {
      const res = await fetch('/api/user');
      const data = await res.json();
      return data.success ? data.user : null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  async startGame() {
    try {
      const res = await fetch('/api/game/start');
      return await res.json();
    } catch (error) {
      console.error('Error starting game:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async getQuestion() {
    try {
      const res = await fetch('/api/game/question');
      return await res.json();
    } catch (error) {
      console.error('Error getting question:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async submitAnswer(answerId, timedOut = false) {
    try {
      const res = await fetch('/api/game/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerId, timedOut })
      });
      return await res.json();
    } catch (error) {
      console.error('Error submitting answer:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async endGame() {
    try {
      const res = await fetch('/api/game/end', {
        method: 'POST'
      });
      return await res.json();
    } catch (error) {
      console.error('Error ending game:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async getStats() {
    try {
      const res = await fetch('/api/game/stats');
      return await res.json();
    } catch (error) {
      console.error('Error getting stats:', error);
      return { success: false };
    }
  },

  async getLeaderboard() {
    try {
      const res = await fetch('/api/leaderboard');
      return await res.json();
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return { success: false };
    }
  }
};

// ==================== View Management ====================
function showView(viewName) {
  // Hide all views
  elements.homeView.classList.add('hidden');
  elements.gameView.classList.add('hidden');
  elements.resultsView.classList.add('hidden');
  elements.leaderboardView.classList.add('hidden');

  // Show requested view
  switch (viewName) {
    case 'home':
      elements.homeView.classList.remove('hidden');
      break;
    case 'game':
      elements.gameView.classList.remove('hidden');
      break;
    case 'results':
      elements.resultsView.classList.remove('hidden');
      break;
    case 'leaderboard':
      elements.leaderboardView.classList.remove('hidden');
      loadLeaderboard();
      break;
  }

  state.currentView = viewName;

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
}

// ==================== User Management ====================
function updateUserUI() {
  if (state.user) {
    elements.userInfo.classList.remove('hidden');
    elements.loginBtn.classList.add('hidden');
    elements.userName.textContent = state.user.name;
    elements.userCredits.textContent = state.user.credits;
    elements.startGameBtn.classList.remove('hidden');
    elements.loginPrompt.classList.add('hidden');
    elements.userStats.classList.remove('hidden');

    if (state.user.avatar) {
      elements.userAvatar.src = state.user.avatar;
      elements.userAvatar.classList.remove('hidden');
    }

    loadUserStats();
  } else {
    elements.userInfo.classList.add('hidden');
    elements.loginBtn.classList.remove('hidden');
    elements.startGameBtn.classList.add('hidden');
    elements.loginPrompt.classList.remove('hidden');
    elements.userStats.classList.add('hidden');
  }
}

async function loadUserStats() {
  const result = await api.getStats();
  if (result.success) {
    elements.statGames.textContent = result.stats.gamesPlayed;
    elements.statScore.textContent = result.stats.totalScore;
    elements.statBest.textContent = result.stats.bestScore;
    elements.statAccuracy.textContent = result.stats.accuracy + '%';
  }
}

// ==================== Game Logic ====================
async function startGame() {
  const result = await api.startGame();

  if (!result.success) {
    alert(result.error || 'Failed to start game');
    return;
  }

  state.gameSession = result.session;
  elements.totalQuestions.textContent = result.session.totalQuestions;
  elements.currentScore.textContent = result.session.score || 0;

  showView('game');
  loadQuestion();
}

async function loadQuestion() {
  state.isAnswering = false;
  elements.feedback.classList.add('hidden');
  elements.answersContainer.innerHTML = '<div class="loading">Loading question...</div>';

  const result = await api.getQuestion();

  if (!result.success) {
    alert(result.error || 'Failed to load question');
    showView('home');
    return;
  }

  if (result.gameComplete) {
    endGame();
    return;
  }

  state.currentQuestion = result.question;

  // Update UI
  elements.questionNumber.textContent = result.progress.current;
  elements.currentScore.textContent = result.progress.score;
  elements.questionCategory.textContent = result.question.category;
  elements.questionDifficulty.textContent = result.question.difficulty.charAt(0).toUpperCase() + result.question.difficulty.slice(1);
  elements.questionDifficulty.className = 'difficulty-badge ' + result.question.difficulty;
  elements.questionPoints.textContent = '+' + result.question.points + ' pts';
  elements.questionText.textContent = result.question.text;

  // Render answers
  elements.answersContainer.innerHTML = result.question.answers.map(answer => `
    <button class="answer-btn" data-id="${answer.id}">
      ${answer.text}
    </button>
  `).join('');

  // Add click handlers
  document.querySelectorAll('.answer-btn').forEach(btn => {
    btn.addEventListener('click', () => selectAnswer(parseInt(btn.dataset.id)));
  });

  // Start timer
  startTimer(result.progress.timeLimit || 15);
}

function startTimer(seconds) {
  state.timeRemaining = seconds;
  elements.timerSeconds.textContent = seconds;
  elements.timerBar.style.width = '100%';
  elements.timerBar.classList.remove('warning', 'danger');

  if (state.timer) {
    clearInterval(state.timer);
  }

  state.timer = setInterval(() => {
    state.timeRemaining--;
    elements.timerSeconds.textContent = state.timeRemaining;

    const percent = (state.timeRemaining / seconds) * 100;
    elements.timerBar.style.width = percent + '%';

    if (state.timeRemaining <= 5) {
      elements.timerBar.classList.add('danger');
    } else if (state.timeRemaining <= 10) {
      elements.timerBar.classList.add('warning');
    }

    if (state.timeRemaining <= 0) {
      clearInterval(state.timer);
      handleTimeout();
    }
  }, 1000);
}

function stopTimer() {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
}

async function selectAnswer(answerId) {
  if (state.isAnswering) return;
  state.isAnswering = true;
  stopTimer();

  // Disable all answer buttons
  document.querySelectorAll('.answer-btn').forEach(btn => {
    btn.disabled = true;
    if (parseInt(btn.dataset.id) === answerId) {
      btn.classList.add('selected');
    }
  });

  const result = await api.submitAnswer(answerId);

  if (!result.success) {
    alert(result.error || 'Failed to submit answer');
    return;
  }

  showFeedback(result, answerId);
}

async function handleTimeout() {
  if (state.isAnswering) return;
  state.isAnswering = true;

  document.querySelectorAll('.answer-btn').forEach(btn => {
    btn.disabled = true;
  });

  const result = await api.submitAnswer(null, true);

  if (!result.success) {
    alert(result.error || 'Failed to submit answer');
    return;
  }

  showFeedback(result, null, true);
}

function showFeedback(result, selectedAnswerId, timedOut = false) {
  // Highlight correct/incorrect answers
  document.querySelectorAll('.answer-btn').forEach(btn => {
    const id = parseInt(btn.dataset.id);
    if (id === result.result.correctAnswerId) {
      btn.classList.add('correct');
    } else if (id === selectedAnswerId && !result.result.correct) {
      btn.classList.add('incorrect');
    }
  });

  // Update score
  elements.currentScore.textContent = result.progress.score;

  // Show feedback message
  elements.feedback.classList.remove('hidden', 'correct', 'incorrect', 'timeout');

  if (timedOut) {
    elements.feedback.classList.add('timeout');
    elements.feedbackText.textContent = `Time's up! The correct answer was: ${result.result.correctAnswerText}`;
  } else if (result.result.correct) {
    elements.feedback.classList.add('correct');
    elements.feedbackText.textContent = `Correct! +${result.result.pointsEarned} points`;
  } else {
    elements.feedback.classList.add('incorrect');
    elements.feedbackText.textContent = `Incorrect. The answer was: ${result.result.correctAnswerText}`;
  }

  // Update next button text if game is complete
  if (result.gameComplete) {
    elements.nextQuestionBtn.textContent = 'See Results';
  } else {
    elements.nextQuestionBtn.textContent = 'Next Question';
  }
}

async function nextQuestion() {
  const result = await api.getQuestion();

  if (result.gameComplete) {
    endGame();
  } else {
    loadQuestion();
  }
}

async function endGame() {
  const result = await api.endGame();

  if (!result.success) {
    alert(result.error || 'Failed to end game');
    showView('home');
    return;
  }

  // Update results UI
  elements.finalScore.textContent = result.summary.score;
  elements.resultCorrect.textContent = result.summary.correctAnswers;
  elements.resultTotal.textContent = result.summary.totalQuestions;
  elements.resultAccuracy.textContent = result.summary.accuracy + '%';
  elements.creditsEarned.textContent = result.summary.creditsEarned;
  elements.creditsTotal.textContent = result.summary.totalCredits;

  // Update user credits in header
  if (state.user) {
    state.user.credits = result.summary.totalCredits;
    elements.userCredits.textContent = result.summary.totalCredits;
  }

  state.gameSession = null;
  showView('results');
}

// ==================== Leaderboard ====================
async function loadLeaderboard() {
  elements.leaderboardList.innerHTML = '<div class="loading">Loading leaderboard...</div>';

  const result = await api.getLeaderboard();

  if (!result.success) {
    elements.leaderboardList.innerHTML = '<p>Failed to load leaderboard</p>';
    return;
  }

  if (result.leaderboard.length === 0) {
    elements.leaderboardList.innerHTML = '<p>No entries yet. Be the first to play!</p>';
    return;
  }

  elements.leaderboardList.innerHTML = result.leaderboard.map((entry, index) => {
    const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
    const topClass = index < 3 ? 'top-3' : '';

    return `
      <div class="leaderboard-entry ${topClass}">
        <div class="leaderboard-rank ${rankClass}">${entry.rank}</div>
        <div class="leaderboard-avatar">
          ${entry.avatar ? `<img src="${entry.avatar}" alt="${entry.name}">` : entry.name.charAt(0).toUpperCase()}
        </div>
        <div class="leaderboard-info">
          <div class="leaderboard-name">${entry.name}</div>
          <div class="leaderboard-games">${entry.gamesPlayed} games • ${entry.accuracy}% accuracy</div>
        </div>
        <div class="leaderboard-score">${entry.totalScore}</div>
      </div>
    `;
  }).join('');
}

// ==================== Event Listeners ====================
function initEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view === 'home' && state.currentView === 'game') {
        if (!confirm('Are you sure you want to leave the game? Your progress will be lost.')) {
          return;
        }
      }
      showView(view);
    });
  });

  // Start game
  elements.startGameBtn.addEventListener('click', startGame);

  // Next question
  elements.nextQuestionBtn.addEventListener('click', nextQuestion);

  // Play again
  elements.playAgainBtn.addEventListener('click', startGame);

  // View leaderboard
  elements.viewLeaderboardBtn.addEventListener('click', () => showView('leaderboard'));

  // Back to home
  elements.backHomeBtn.addEventListener('click', () => showView('home'));

  // Logout
  elements.logoutBtn.addEventListener('click', () => {
    window.location.href = '/auth/logout';
  });
}

// ==================== Initialize ====================
async function init() {
  initEventListeners();

  // Check for logged in user
  state.user = await api.getUser();
  updateUserUI();

  // Show home view
  showView('home');
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
