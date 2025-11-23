/**
 * Ayiti Farms - Frontend Application
 * Agriculture Marketplace
 */

// ==================== State ====================
let currentUser = null;
let listings = [];
let categories = [];
let currentOffset = 0;
const LIMIT = 12;
let currentFilters = {};
let selectedListing = null;

const categoryIcons = {
  vegetables: '&#127813;',
  fruits: '&#127822;',
  grains: '&#127806;',
  livestock: '&#128004;',
  dairy: '&#129371;',
  eggs: '&#129370;',
  herbs: '&#127807;',
  other: '&#128230;'
};

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupNavigation();
  loadCategories();
  loadListings();
  setupListingForm();
});

// ==================== Authentication ====================
async function checkAuth() {
  try {
    const response = await fetch('/api/user');
    const data = await response.json();

    if (data.success && data.user) {
      currentUser = data.user;
      showUserInfo();
      showAuthenticatedSections();
    } else {
      hideUserInfo();
      showUnauthenticatedSections();
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

function showAuthenticatedSections() {
  document.getElementById('sell-login-prompt').classList.add('hidden');
  document.getElementById('sell-form-container').classList.remove('hidden');
  document.getElementById('orders-login-prompt').classList.add('hidden');
  document.getElementById('orders-container').classList.remove('hidden');
  loadMyListings();
}

function showUnauthenticatedSections() {
  document.getElementById('sell-login-prompt').classList.remove('hidden');
  document.getElementById('sell-form-container').classList.add('hidden');
  document.getElementById('orders-login-prompt').classList.remove('hidden');
  document.getElementById('orders-container').classList.add('hidden');
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
      loadSectionData(sectionId);
    } else {
      section.classList.add('hidden');
    }
  });
}

function loadSectionData(sectionId) {
  switch (sectionId) {
    case 'browse':
      if (listings.length === 0) loadListings();
      break;
    case 'sell':
      if (currentUser) loadMyListings();
      break;
    case 'orders':
      if (currentUser) {
        loadPurchases();
        loadSales();
      }
      break;
  }
}

// ==================== Categories ====================
async function loadCategories() {
  try {
    const response = await fetch('/api/categories');
    const data = await response.json();

    if (data.success) {
      categories = data.categories;
      renderCategories();
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

function renderCategories() {
  const container = document.getElementById('categories');

  container.innerHTML = categories.map(cat => `
    <div class="category-card" data-category="${cat.name}" onclick="filterByCategory('${cat.name}')">
      <div class="category-icon">${cat.icon || categoryIcons[cat.name] || '&#128230;'}</div>
      <span class="category-name">${cat.nameHt || cat.name}</span>
      <span class="category-count">${cat.listingCount || 0} listings</span>
    </div>
  `).join('');
}

function filterByCategory(categoryName) {
  // Toggle category selection
  const cards = document.querySelectorAll('.category-card');
  cards.forEach(card => {
    if (card.dataset.category === categoryName) {
      card.classList.toggle('active');
    } else {
      card.classList.remove('active');
    }
  });

  // Update filter
  const activeCard = document.querySelector('.category-card.active');
  if (activeCard) {
    currentFilters.category = categoryName;
    document.getElementById('category-filter').value = categoryName;
  } else {
    delete currentFilters.category;
    document.getElementById('category-filter').value = '';
  }

  // Reload listings
  currentOffset = 0;
  loadListings();
}

// ==================== Listings ====================
async function loadListings(append = false) {
  const grid = document.getElementById('listings-grid');

  if (!append) {
    grid.innerHTML = '<p class="loading">Loading fresh products...</p>';
    currentOffset = 0;
  }

  try {
    // Build query string
    const params = new URLSearchParams({
      limit: LIMIT,
      offset: currentOffset
    });

    if (currentFilters.category) params.append('category', currentFilters.category);
    if (currentFilters.city) params.append('city', currentFilters.city);
    if (currentFilters.organic) params.append('organic', 'true');
    if (currentFilters.minPrice) params.append('minPrice', currentFilters.minPrice);
    if (currentFilters.maxPrice) params.append('maxPrice', currentFilters.maxPrice);
    if (currentFilters.search) params.append('search', currentFilters.search);

    const response = await fetch(`/api/listings?${params.toString()}`);
    const data = await response.json();

    if (data.success) {
      if (append) {
        listings = [...listings, ...data.listings];
      } else {
        listings = data.listings;
      }

      renderListings(append);

      // Show/hide load more button
      const loadMoreContainer = document.getElementById('load-more-container');
      if (data.listings.length === LIMIT && data.total > listings.length) {
        loadMoreContainer.classList.remove('hidden');
      } else {
        loadMoreContainer.classList.add('hidden');
      }
    }
  } catch (error) {
    console.error('Error loading listings:', error);
    if (!append) {
      grid.innerHTML = '<p class="empty-state">Failed to load listings. Please try again.</p>';
    }
  }
}

function renderListings(append = false) {
  const grid = document.getElementById('listings-grid');

  if (listings.length === 0) {
    grid.innerHTML = '<p class="empty-state">No products found. Try adjusting your filters.</p>';
    return;
  }

  const html = listings.map(listing => `
    <div class="listing-card" onclick="openListingModal(${listing.id})">
      ${listing.imageUrl
        ? `<img src="${listing.imageUrl}" alt="${listing.title}" class="listing-image">`
        : `<div class="listing-placeholder">${categoryIcons[listing.category] || '&#127806;'}</div>`
      }
      <div class="listing-body">
        <div class="listing-header">
          <div>
            <h3 class="listing-title">${listing.title}</h3>
            <div class="listing-badges">
              ${listing.organic ? '<span class="badge badge-organic">Organic</span>' : ''}
              <span class="badge badge-category">${listing.category}</span>
            </div>
          </div>
        </div>
        <div class="listing-price">
          ${listing.price} <span>credits ${listing.unit}</span>
        </div>
        <div class="listing-meta">
          <span class="listing-location">&#128205; ${listing.city || 'Haiti'}</span>
          ${listing.quantityAvailable ? `<span>${listing.quantityAvailable} available</span>` : ''}
        </div>
        ${listing.seller ? `
          <div class="listing-seller">
            <img src="${listing.seller.avatar || ''}" alt="" class="seller-avatar">
            <span class="seller-name">${listing.seller.name}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');

  if (append) {
    grid.innerHTML += html;
  } else {
    grid.innerHTML = html;
  }
}

function loadMoreListings() {
  currentOffset += LIMIT;
  loadListings(true);
}

// ==================== Filters ====================
function applyFilters() {
  currentFilters = {
    category: document.getElementById('category-filter').value,
    city: document.getElementById('city-filter').value,
    organic: document.getElementById('organic-filter').checked,
    minPrice: document.getElementById('min-price').value,
    maxPrice: document.getElementById('max-price').value
  };

  // Update category cards
  document.querySelectorAll('.category-card').forEach(card => {
    card.classList.toggle('active', card.dataset.category === currentFilters.category);
  });

  currentOffset = 0;
  loadListings();
}

function performSearch() {
  const searchInput = document.getElementById('hero-search');
  currentFilters.search = searchInput.value.trim();
  currentOffset = 0;
  loadListings();
}

// ==================== Listing Modal ====================
async function openListingModal(listingId) {
  const modal = document.getElementById('listing-modal');
  const modalBody = document.getElementById('modal-body');

  modalBody.innerHTML = '<p class="loading">Loading...</p>';
  modal.classList.remove('hidden');

  try {
    const response = await fetch(`/api/listings/${listingId}`);
    const data = await response.json();

    if (data.success) {
      selectedListing = data.listing;
      renderListingModal(data.listing);
    } else {
      modalBody.innerHTML = '<p class="empty-state">Listing not found</p>';
    }
  } catch (error) {
    console.error('Error loading listing:', error);
    modalBody.innerHTML = '<p class="empty-state">Failed to load listing</p>';
  }
}

function renderListingModal(listing) {
  const modalBody = document.getElementById('modal-body');
  const isOwner = currentUser && listing.seller && currentUser.id === listing.seller.id;

  modalBody.innerHTML = `
    ${listing.imageUrl
      ? `<img src="${listing.imageUrl}" alt="${listing.title}" class="modal-image">`
      : `<div class="modal-placeholder">${categoryIcons[listing.category] || '&#127806;'}</div>`
    }

    <h2 class="modal-title">${listing.title}</h2>

    <div class="modal-badges">
      ${listing.organic ? '<span class="badge badge-organic">Organic</span>' : ''}
      <span class="badge badge-category">${listing.category}</span>
    </div>

    <div class="modal-price">
      ${listing.price} <span>credits ${listing.unit}</span>
    </div>

    ${listing.description ? `<p class="modal-description">${listing.description}</p>` : ''}

    <div class="modal-meta">
      <div class="modal-meta-item">
        <span class="modal-meta-label">Location</span>
        <span class="modal-meta-value">${listing.city || listing.location || 'Haiti'}</span>
      </div>
      <div class="modal-meta-item">
        <span class="modal-meta-label">Available</span>
        <span class="modal-meta-value">${listing.quantityAvailable ? listing.quantityAvailable + ' ' + listing.unit : 'In Stock'}</span>
      </div>
    </div>

    ${listing.seller ? `
      <div class="modal-seller">
        <img src="${listing.seller.avatar || ''}" alt="" class="modal-seller-avatar">
        <div class="modal-seller-info">
          <div class="modal-seller-name">${listing.seller.name}</div>
          <div class="modal-seller-location">${listing.seller.location || 'Haiti'}</div>
        </div>
      </div>
    ` : ''}

    ${!isOwner && listing.available ? `
      <div class="modal-order-form">
        <h4>Place Order</h4>
        <form id="order-form" onsubmit="placeOrder(event)">
          <div class="form-row">
            <div class="form-group">
              <label for="order-quantity">Quantity</label>
              <input type="number" id="order-quantity" min="0.01" step="0.01" value="1" required
                ${listing.quantityAvailable ? `max="${listing.quantityAvailable}"` : ''}>
            </div>
            <div class="form-group">
              <label for="order-delivery">Delivery Method</label>
              <select id="order-delivery">
                <option value="pickup">Pickup</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>
          </div>
          <div class="form-group" id="delivery-address-group" style="display:none;">
            <label for="order-address">Delivery Address</label>
            <textarea id="order-address" rows="2" placeholder="Enter delivery address"></textarea>
          </div>
          <div class="form-group">
            <label for="order-notes">Notes (Optional)</label>
            <textarea id="order-notes" rows="2" placeholder="Any special requests?"></textarea>
          </div>
          <div id="order-total" style="margin-bottom:1rem; font-weight:600;">
            Total: ${listing.price} credits
          </div>
          <button type="submit" class="btn btn-primary btn-block" ${!currentUser ? 'disabled' : ''}>
            ${currentUser ? 'Place Order' : 'Sign in to Order'}
          </button>
        </form>
      </div>
    ` : isOwner ? `
      <div style="margin-top:1rem;">
        <button class="btn btn-outline btn-block" onclick="editListing(${listing.id})">Edit Listing</button>
      </div>
    ` : ''}
  `;

  // Setup delivery address toggle
  const deliverySelect = document.getElementById('order-delivery');
  if (deliverySelect) {
    deliverySelect.addEventListener('change', (e) => {
      const addressGroup = document.getElementById('delivery-address-group');
      addressGroup.style.display = e.target.value === 'delivery' ? 'block' : 'none';
    });
  }

  // Setup quantity change for total calculation
  const quantityInput = document.getElementById('order-quantity');
  if (quantityInput) {
    quantityInput.addEventListener('input', () => {
      const qty = parseFloat(quantityInput.value) || 0;
      const total = qty * listing.price;
      document.getElementById('order-total').textContent = `Total: ${total.toFixed(2)} credits`;
    });
  }
}

function closeModal() {
  document.getElementById('listing-modal').classList.add('hidden');
  selectedListing = null;
}

// ==================== Place Order ====================
async function placeOrder(e) {
  e.preventDefault();

  if (!currentUser) {
    alert('Please sign in to place an order');
    return;
  }

  if (!selectedListing) return;

  const quantity = parseFloat(document.getElementById('order-quantity').value);
  const deliveryMethod = document.getElementById('order-delivery').value;
  const deliveryAddress = document.getElementById('order-address')?.value;
  const notes = document.getElementById('order-notes').value;

  const totalPrice = quantity * selectedListing.price;

  if (currentUser.credits < totalPrice) {
    alert(`Insufficient credits. You need ${totalPrice} credits but have ${currentUser.credits}.`);
    return;
  }

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listingId: selectedListing.id,
        quantity,
        deliveryMethod,
        deliveryAddress,
        notes
      })
    });

    const data = await response.json();

    if (data.success) {
      alert(`Order placed successfully! Order #${data.order.id}`);
      currentUser.credits = data.newBalance;
      document.getElementById('user-credits').textContent = `${data.newBalance} credits`;
      closeModal();
      loadListings();
    } else {
      alert(data.error || 'Failed to place order');
    }
  } catch (error) {
    console.error('Error placing order:', error);
    alert('Failed to place order. Please try again.');
  }
}

// ==================== Create Listing ====================
function setupListingForm() {
  const form = document.getElementById('listing-form');
  if (form) {
    form.addEventListener('submit', createListing);
  }
}

async function createListing(e) {
  e.preventDefault();

  if (!currentUser) {
    alert('Please sign in to create a listing');
    return;
  }

  const formData = {
    title: document.getElementById('listing-title').value,
    category: document.getElementById('listing-category').value,
    description: document.getElementById('listing-description').value,
    price: document.getElementById('listing-price').value,
    unit: document.getElementById('listing-unit').value,
    quantityAvailable: document.getElementById('listing-quantity').value || null,
    city: document.getElementById('listing-city').value,
    location: document.getElementById('listing-location').value,
    imageUrl: document.getElementById('listing-image').value,
    organic: document.getElementById('listing-organic').checked
  };

  try {
    const response = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (data.success) {
      alert('Listing created successfully!');
      document.getElementById('listing-form').reset();
      loadMyListings();
      loadCategories();
    } else {
      alert(data.error || 'Failed to create listing');
    }
  } catch (error) {
    console.error('Error creating listing:', error);
    alert('Failed to create listing. Please try again.');
  }
}

// ==================== My Listings ====================
async function loadMyListings() {
  if (!currentUser) return;

  const container = document.getElementById('my-listings');

  try {
    const response = await fetch(`/api/listings/seller/${currentUser.id}`);
    const data = await response.json();

    if (data.success && data.listings.length > 0) {
      container.innerHTML = data.listings.map(listing => `
        <div class="my-listing-card">
          <div class="my-listing-info">
            <div class="my-listing-title">${listing.title}</div>
            <div class="my-listing-price">${listing.price} credits ${listing.unit}</div>
            <div class="my-listing-status">${listing.available ? 'Active' : 'Inactive'}</div>
          </div>
          <div class="my-listing-actions">
            <button class="btn btn-sm btn-outline" onclick="editListing(${listing.id})">Edit</button>
            <button class="btn btn-sm btn-outline" onclick="toggleListing(${listing.id}, ${listing.available})">
              ${listing.available ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p class="empty-state">You haven\'t listed any products yet</p>';
    }
  } catch (error) {
    console.error('Error loading my listings:', error);
    container.innerHTML = '<p class="empty-state">Failed to load your listings</p>';
  }
}

async function toggleListing(id, currentState) {
  try {
    const response = await fetch(`/api/listings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available: !currentState })
    });

    const data = await response.json();

    if (data.success) {
      loadMyListings();
      loadListings();
    } else {
      alert(data.error || 'Failed to update listing');
    }
  } catch (error) {
    console.error('Error toggling listing:', error);
    alert('Failed to update listing');
  }
}

function editListing(id) {
  // For now, just alert. Could implement a more complex edit flow
  alert('Edit functionality coming soon! For now, you can hide/show listings.');
}

// ==================== Orders ====================
function switchOrderTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  document.getElementById('purchases-tab').classList.toggle('hidden', tab !== 'purchases');
  document.getElementById('sales-tab').classList.toggle('hidden', tab !== 'sales');
}

async function loadPurchases() {
  if (!currentUser) return;

  const container = document.getElementById('purchases-list');

  try {
    const response = await fetch('/api/orders/buyer');
    const data = await response.json();

    if (data.success && data.orders.length > 0) {
      container.innerHTML = data.orders.map(order => renderOrderCard(order, 'buyer')).join('');
    } else {
      container.innerHTML = '<p class="empty-state">You haven\'t made any purchases yet</p>';
    }
  } catch (error) {
    console.error('Error loading purchases:', error);
    container.innerHTML = '<p class="empty-state">Failed to load orders</p>';
  }
}

async function loadSales() {
  if (!currentUser) return;

  const container = document.getElementById('sales-list');

  try {
    const response = await fetch('/api/orders/seller');
    const data = await response.json();

    if (data.success && data.orders.length > 0) {
      container.innerHTML = data.orders.map(order => renderOrderCard(order, 'seller')).join('');
    } else {
      container.innerHTML = '<p class="empty-state">You haven\'t made any sales yet</p>';
    }
  } catch (error) {
    console.error('Error loading sales:', error);
    container.innerHTML = '<p class="empty-state">Failed to load orders</p>';
  }
}

function renderOrderCard(order, role) {
  const person = role === 'buyer' ? order.seller : order.buyer;
  const personLabel = role === 'buyer' ? 'Seller' : 'Buyer';

  return `
    <div class="order-card">
      <div class="order-header">
        <span class="order-id">Order #${order.id}</span>
        <span class="order-status ${order.status}">${order.status}</span>
      </div>
      <div class="order-content">
        <div class="order-image">${categoryIcons[order.listing?.category] || '&#127806;'}</div>
        <div class="order-details">
          <div class="order-title">${order.listing?.title || 'Product'}</div>
          <div class="order-quantity">${order.quantity} ${order.listing?.unit || 'units'}</div>
          ${person ? `
            <div class="order-person">
              <span>${personLabel}: ${person.name}</span>
            </div>
          ` : ''}
        </div>
        <div class="order-total">
          <div class="order-price">${order.totalPrice} credits</div>
          <div class="order-date">${formatDate(order.createdAt)}</div>
        </div>
      </div>
      ${role === 'seller' && order.status !== 'delivered' && order.status !== 'cancelled' ? `
        <div class="order-actions">
          ${order.status === 'pending' ? `
            <button class="btn btn-sm btn-primary" onclick="updateOrderStatus(${order.id}, 'confirmed')">Confirm</button>
            <button class="btn btn-sm btn-outline" onclick="updateOrderStatus(${order.id}, 'cancelled')">Cancel</button>
          ` : order.status === 'confirmed' ? `
            <button class="btn btn-sm btn-primary" onclick="updateOrderStatus(${order.id}, 'ready')">Mark Ready</button>
          ` : order.status === 'ready' ? `
            <button class="btn btn-sm btn-primary" onclick="updateOrderStatus(${order.id}, 'delivered')">Mark Delivered</button>
          ` : ''}
        </div>
      ` : role === 'buyer' && order.status === 'pending' ? `
        <div class="order-actions">
          <button class="btn btn-sm btn-outline" onclick="updateOrderStatus(${order.id}, 'cancelled')">Cancel Order</button>
        </div>
      ` : ''}
    </div>
  `;
}

async function updateOrderStatus(orderId, status) {
  try {
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    const data = await response.json();

    if (data.success) {
      loadPurchases();
      loadSales();

      // If delivered, seller received credits
      if (status === 'delivered') {
        checkAuth(); // Refresh user info
      }
    } else {
      alert(data.error || 'Failed to update order');
    }
  } catch (error) {
    console.error('Error updating order:', error);
    alert('Failed to update order');
  }
}

// ==================== Utilities ====================
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
