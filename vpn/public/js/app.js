/**
 * Ayiti VPN (Pwotek) - Main Application JavaScript
 */

// ==================== Theme Toggle ====================

const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  // Load saved theme
  const savedTheme = localStorage.getItem('pwotek_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('pwotek_theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  if (theme === 'light') {
    toggle.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    `;
  } else {
    toggle.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    `;
  }
}

// ==================== User Area ====================

function updateUserArea(user) {
  const userArea = document.getElementById('userArea');
  if (!userArea) return;

  if (user) {
    userArea.innerHTML = `
      <div class="flex gap-sm" style="align-items: center;">
        <img src="${user.avatar || 'https://via.placeholder.com/32'}" alt="${user.name}"
          style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
        <div style="line-height: 1.2;">
          <div style="font-weight: 500; font-size: 0.875rem;">${user.name}</div>
          <div style="font-size: 0.75rem; color: var(--accent-purple);">${user.credits} credits</div>
        </div>
        <a href="/auth/logout" class="btn btn-sm btn-secondary" style="margin-left: 0.5rem;">Logout</a>
      </div>
    `;
  } else {
    userArea.innerHTML = `
      <a href="/auth/google" class="btn btn-primary">Sign In</a>
    `;
  }
}

// Check authentication on page load
async function checkAuthGlobal() {
  try {
    const response = await fetch('/api/user');
    const data = await response.json();

    if (data.success && data.user) {
      updateUserArea(data.user);
      return data.user;
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  }
  return null;
}

// ==================== API Helpers ====================

async function apiGet(url) {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('API GET error:', error);
    return { success: false, error: error.message };
  }
}

async function apiPost(url, data = {}) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('API POST error:', error);
    return { success: false, error: error.message };
  }
}

async function apiPut(url, data = {}) {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('API PUT error:', error);
    return { success: false, error: error.message };
  }
}

async function apiDelete(url) {
  try {
    const response = await fetch(url, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error('API DELETE error:', error);
    return { success: false, error: error.message };
  }
}

// ==================== Utility Functions ====================

// Format bytes to human readable
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format relative time
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatDate(dateString);
}

// Show toast notification
function showToast(message, type = 'info') {
  // Remove existing toasts
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    color: white;
    font-weight: 500;
    z-index: 9999;
    animation: slideIn 0.3s ease;
    background-color: ${type === 'success' ? 'var(--status-success)' :
      type === 'error' ? 'var(--status-error)' :
      type === 'warning' ? 'var(--status-warning)' :
      'var(--status-info)'};
  `;
  toast.textContent = message;

  document.body.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add toast animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// ==================== Modal Helpers ====================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Close modal on outside click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(overlay => {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  }
});

// ==================== Initialize ====================

document.addEventListener('DOMContentLoaded', () => {
  // Check auth for all pages
  checkAuthGlobal();
});
