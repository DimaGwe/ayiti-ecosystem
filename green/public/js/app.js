/**
 * Ayiti Green - Frontend Application
 * Recycling Rewards Platform
 */

// ==================== State ====================
let currentUser = null;
let collectionPoints = [];
const wasteIcons = {
  plastic: '&#129717;',
  paper: '&#128220;',
  metal: '&#129691;',
  glass: '&#129346;',
  organic: '&#127823;',
  electronics: '&#128241;'
};

const creditRates = {
  plastic: 5,
  paper: 3,
  metal: 8,
  glass: 4,
  organic: 2,
  electronics: 10
};

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupNavigation();
  setupRecyclingForm();
  loadCommunityStats();
});

// ==================== Authentication ====================
async function checkAuth() {
  try {
    const response = await fetch('/api/user');
    const data = await response.json();

    if (data.success && data.user) {
      currentUser = data.user;
      showUserInfo();
      loadHistory();
      loadMyImpact();
    } else {
      hideUserInfo();
      showLoginPrompt();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    hideUserInfo();
  }
}

function showUserInfo() {
  const userInfo = document.getElementById('user-info');
  const loginBtn = document.getElementById('login-btn');
  const avatar = document.getElementById('user-avatar');
  const name = document.getElementById('user-name');
  const credits = document.getElementById('user-credits');

  if (currentUser) {
    avatar.src = currentUser.avatar || '/images/default-avatar.png';
    name.textContent = currentUser.name;
    credits.textContent = `${currentUser.credits} credits`;

    userInfo.classList.remove('hidden');
    loginBtn.classList.add('hidden');
  }
}

function hideUserInfo() {
  document.getElementById('user-info').classList.add('hidden');
  document.getElementById('login-btn').classList.remove('hidden');
}

function showLoginPrompt() {
  const impactDashboard = document.getElementById('impact-dashboard');
  const loginPrompt = document.getElementById('login-prompt');

  if (impactDashboard) impactDashboard.classList.add('hidden');
  if (loginPrompt) loginPrompt.classList.remove('hidden');
}

// ==================== Navigation ====================
function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;

      // Update active link
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Show selected section
      showSection(section);
    });
  });
}

function showSection(sectionId) {
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
    if (section.id === sectionId) {
      section.classList.remove('hidden');
      // Load section data
      loadSectionData(sectionId);
    } else {
      section.classList.add('hidden');
    }
  });
}

function loadSectionData(sectionId) {
  switch (sectionId) {
    case 'locations':
      loadLocations();
      break;
    case 'impact':
      loadMyImpact();
      break;
    case 'community':
      loadCommunityStats();
      loadLeaderboard();
      break;
  }
}

// ==================== Recycling Form ====================
function setupRecyclingForm() {
  const form = document.getElementById('recycling-form');
  const wasteCards = document.querySelectorAll('.waste-type-card');
  const weightInput = document.getElementById('weight');

  // Load collection points for dropdown
  loadCollectionPointsDropdown();

  // Update preview when waste type or weight changes
  wasteCards.forEach(card => {
    card.addEventListener('click', updateCreditsPreview);
  });

  weightInput.addEventListener('input', updateCreditsPreview);

  // Handle form submission
  form.addEventListener('submit', handleRecyclingSubmit);
}

function updateCreditsPreview() {
  const selectedWaste = document.querySelector('input[name="wasteType"]:checked');
  const weight = parseFloat(document.getElementById('weight').value) || 0;
  const preview = document.getElementById('credits-preview');
  const previewAmount = document.getElementById('preview-amount');

  if (selectedWaste && weight > 0) {
    const credits = Math.floor(weight * creditRates[selectedWaste.value]);
    previewAmount.textContent = `${credits} credits`;
    preview.classList.remove('hidden');
  } else {
    preview.classList.add('hidden');
  }
}

async function handleRecyclingSubmit(e) {
  e.preventDefault();

  if (!currentUser) {
    alert('Please sign in to log recycling');
    return;
  }

  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging...';

  const formData = {
    wasteType: document.querySelector('input[name="wasteType"]:checked')?.value,
    weightKg: document.getElementById('weight').value,
    collectionPointId: document.getElementById('collection-point').value || null
  };

  try {
    const response = await fetch('/api/recycling/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (data.success) {
      showSuccessMessage(data);
      updateUserCredits(data.newBalance);
      loadHistory();
      loadCommunityStats();
    } else {
      alert(data.error || 'Failed to log recycling');
    }
  } catch (error) {
    console.error('Error logging recycling:', error);
    alert('Failed to log recycling. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Log Recycling';
  }
}

function showSuccessMessage(data) {
  const form = document.getElementById('recycling-form');
  const successMsg = document.getElementById('success-message');
  const details = document.getElementById('success-details');

  details.innerHTML = `
    You earned <strong>${data.creditsEarned} credits</strong> for recycling
    ${data.log.weightKg}kg of ${data.log.wasteType}!<br>
    <small>CO2 Saved: ${data.impact.co2Saved}kg</small>
  `;

  form.classList.add('hidden');
  successMsg.classList.remove('hidden');
}

function resetForm() {
  const form = document.getElementById('recycling-form');
  const successMsg = document.getElementById('success-message');

  form.reset();
  form.classList.remove('hidden');
  successMsg.classList.add('hidden');
  document.getElementById('credits-preview').classList.add('hidden');
}

function updateUserCredits(newBalance) {
  if (currentUser) {
    currentUser.credits = newBalance;
    document.getElementById('user-credits').textContent = `${newBalance} credits`;
  }
}

// ==================== Collection Points ====================
async function loadCollectionPointsDropdown() {
  try {
    const response = await fetch('/api/locations');
    const data = await response.json();

    if (data.success) {
      collectionPoints = data.locations;
      const select = document.getElementById('collection-point');

      data.locations.forEach(point => {
        const option = document.createElement('option');
        option.value = point.id;
        option.textContent = `${point.name} - ${point.city || 'Unknown'}`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading collection points:', error);
  }
}

async function loadLocations() {
  const grid = document.getElementById('locations-grid');
  grid.innerHTML = '<p class="loading">Loading collection points...</p>';

  try {
    const city = document.getElementById('city-filter')?.value || '';
    const material = document.getElementById('material-filter')?.value || '';

    let url = '/api/locations';
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (material) params.append('accepts', material);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.success && data.locations.length > 0) {
      grid.innerHTML = data.locations.map(point => `
        <div class="location-card">
          <h3 class="location-name">${point.name}</h3>
          <p class="location-address">
            ${point.address || ''}<br>
            ${point.city || ''}
          </p>
          <div class="location-accepts">
            ${(point.accepts || []).map(type =>
              `<span class="location-tag">${type}</span>`
            ).join('')}
          </div>
          <div class="location-meta">
            <span>${point.hours || 'Hours not listed'}</span>
            <span>${point.phone || ''}</span>
          </div>
        </div>
      `).join('');
    } else {
      grid.innerHTML = '<p class="empty-state">No collection points found</p>';
    }
  } catch (error) {
    console.error('Error loading locations:', error);
    grid.innerHTML = '<p class="empty-state">Failed to load collection points</p>';
  }

  // Setup filter listeners
  document.getElementById('city-filter')?.addEventListener('change', loadLocations);
  document.getElementById('material-filter')?.addEventListener('change', loadLocations);
}

// ==================== History ====================
async function loadHistory() {
  if (!currentUser) return;

  const historyList = document.getElementById('history-list');

  try {
    const response = await fetch('/api/recycling/history?limit=10');
    const data = await response.json();

    if (data.success && data.history.length > 0) {
      historyList.innerHTML = data.history.map(log => `
        <div class="history-item">
          <div class="history-item-info">
            <span class="history-item-icon">${wasteIcons[log.wasteType] || ''}</span>
            <div class="history-item-details">
              <span class="history-item-type">${log.wasteType} - ${log.weightKg}kg</span>
              <span class="history-item-date">${formatDate(log.createdAt)}</span>
            </div>
          </div>
          <span class="history-item-credits">+${log.creditsEarned} credits</span>
        </div>
      `).join('');
    } else {
      historyList.innerHTML = '<p class="empty-state">No recycling history yet. Start recycling to earn credits!</p>';
    }
  } catch (error) {
    console.error('Error loading history:', error);
    historyList.innerHTML = '<p class="empty-state">Failed to load history</p>';
  }
}

// ==================== Impact ====================
async function loadMyImpact() {
  if (!currentUser) {
    showLoginPrompt();
    return;
  }

  const dashboard = document.getElementById('impact-dashboard');
  const loginPrompt = document.getElementById('login-prompt');

  if (dashboard) dashboard.classList.remove('hidden');
  if (loginPrompt) loginPrompt.classList.add('hidden');

  try {
    const response = await fetch(`/api/impact/user/${currentUser.id}`);
    const data = await response.json();

    if (data.success) {
      const impact = data.impact;

      // Update summary cards
      document.getElementById('my-total-kg').textContent = impact.totalKg.toFixed(1);
      document.getElementById('my-co2-saved').textContent = impact.co2SavedKg.toFixed(1);
      document.getElementById('my-trees-saved').textContent = impact.treesSaved.toFixed(2);

      // Update breakdown
      document.getElementById('my-plastic').textContent = `${impact.plasticKg.toFixed(1)} kg`;
      document.getElementById('my-paper').textContent = `${impact.paperKg.toFixed(1)} kg`;
      document.getElementById('my-metal').textContent = `${impact.metalKg.toFixed(1)} kg`;
      document.getElementById('my-glass').textContent = `${impact.glassKg.toFixed(1)} kg`;
      document.getElementById('my-organic').textContent = `${impact.organicKg.toFixed(1)} kg`;
      document.getElementById('my-electronics').textContent = `${impact.electronicsKg.toFixed(1)} kg`;
    }
  } catch (error) {
    console.error('Error loading impact:', error);
  }
}

// ==================== Community ====================
async function loadCommunityStats() {
  try {
    const response = await fetch('/api/impact/community');
    const data = await response.json();

    if (data.success) {
      const community = data.community;

      // Update hero stats
      document.getElementById('community-kg').textContent = formatNumber(community.totalKg);
      document.getElementById('community-co2').textContent = formatNumber(community.co2SavedKg);
      document.getElementById('community-trees').textContent = community.treesSaved.toFixed(1);

      // Update community section stats
      document.getElementById('total-recycled').textContent = formatNumber(community.totalKg);
      document.getElementById('total-co2').textContent = formatNumber(community.co2SavedKg);
      document.getElementById('total-trees').textContent = community.treesSaved.toFixed(1);
      document.getElementById('total-recyclers').textContent = community.uniqueRecyclers;
    }
  } catch (error) {
    console.error('Error loading community stats:', error);
  }
}

async function loadLeaderboard() {
  const leaderboard = document.getElementById('leaderboard');

  try {
    const response = await fetch('/api/impact/leaderboard?limit=10');
    const data = await response.json();

    if (data.success && data.leaderboard.length > 0) {
      leaderboard.innerHTML = data.leaderboard.map(entry => `
        <div class="leaderboard-item">
          <span class="leaderboard-rank">${entry.rank}</span>
          <img class="leaderboard-avatar" src="${entry.user?.avatar || '/images/default-avatar.png'}" alt="">
          <span class="leaderboard-name">${entry.user?.name || 'Anonymous'}</span>
          <div class="leaderboard-stats">
            <div class="leaderboard-kg">${entry.totalKg.toFixed(1)} kg</div>
            <div class="leaderboard-co2">${entry.co2SavedKg.toFixed(1)} kg CO2</div>
          </div>
        </div>
      `).join('');
    } else {
      leaderboard.innerHTML = '<p class="empty-state">No recyclers yet. Be the first!</p>';
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    leaderboard.innerHTML = '<p class="empty-state">Failed to load leaderboard</p>';
  }
}

// ==================== Utilities ====================
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toFixed(1);
}
