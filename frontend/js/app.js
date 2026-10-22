// AnnaSetu Main Application Controller

const CATEGORIES = ['Food', 'Water', 'Clothing', 'Blankets', 'Hygiene', 'Medical supplies'];
const URGENCIES = ['Low', 'Medium', 'High', 'Critical'];

// App State
const state = {
  user: Api.getUser(),
  currentTab: '',
  donations: [],
  requests: [],
  volunteers: [],
  users: [],
  matches: [],
  reports: null,
  notifications: [],
  filters: {
    search: '',
    category: '',
    status: ''
  }
};

// Utilities
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (str) =>
  String(str ?? '').replace(/[&<>'"]/g, (tag) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));

// Toast Notification
function showToast(message, type = 'success') {
  const container = $('#toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'error' ? '⚠️' : type === 'warning' ? '🔔' : '✅'}</span>
    <span style="flex: 1">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Modal Helpers
function openModal(title, bodyHtml, footerHtml = '') {
  let modal = $('#app-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'app-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title">${escapeHtml(title)}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
    </div>
  `;
  modal.style.display = 'flex';
}

function closeModal() {
  const modal = $('#app-modal');
  if (modal) modal.style.display = 'none';
}

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('annasetu_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('annasetu_theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = $('#theme-toggle');
  if (btn) btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
}

// Header Navigation
function renderNav() {
  const user = state.user;
  const navRight = $('#nav-actions');
  if (!navRight) return;

  const unreadCount = state.notifications.filter((n) => !n.is_read).length;

  if (user) {
    navRight.innerHTML = `
      <button class="btn btn-secondary btn-sm" onclick="openDemoModal()">⚡ Switch Role</button>
      <button class="btn btn-icon" id="theme-toggle" onclick="toggleTheme()" title="Toggle Dark/Light Mode">🌙</button>
      <button class="btn btn-icon" style="position: relative" onclick="switchTab('Notifications')" title="Notifications">
        🔔
        ${unreadCount > 0 ? `<span style="position:absolute; top:-4px; right:-4px; background:var(--critical); color:#fff; font-size:10px; font-weight:700; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center;">${unreadCount}</span>` : ''}
      </button>
      <div style="display: flex; align-items: center; gap: 8px; margin-left: 6px;">
        <span style="font-weight: 600; font-size: 0.9rem;">${escapeHtml(user.name)}</span>
        <span class="pill pill-${user.role}">${user.role}</span>
        <button class="btn btn-secondary btn-sm" onclick="logout()">Logout</button>
      </div>
    `;
  } else {
    navRight.innerHTML = `
      <button class="btn btn-secondary btn-sm" onclick="openDemoModal()">⚡ Quick Role Access</button>
      <button class="btn btn-icon" id="theme-toggle" onclick="toggleTheme()" title="Toggle Dark/Light Mode">🌙</button>
      <button class="btn btn-secondary btn-sm" onclick="renderAuth('login')">Login</button>
      <button class="btn btn-primary btn-sm" onclick="renderAuth('register')">Register</button>
    `;
  }
  initTheme();
}

// Quick Role Account Switcher
function openDemoModal() {
  const accounts = [
    { role: 'donor', name: 'The Grand Palace Kitchens (Donor)', email: 'donor@annasetu.org', icon: '🍲' },
    { role: 'ngo', name: 'Seva Food Relief Foundation (NGO)', email: 'ngo@annasetu.org', icon: '🤝' },
    { role: 'volunteer', name: 'Rahul Sharma (Volunteer Dispatch)', email: 'volunteer@annasetu.org', icon: '🚴' },
    { role: 'beneficiary', name: 'Yamuna Community Relief Shelter (Beneficiary)', email: 'beneficiary@annasetu.org', icon: '🆘' },
    { role: 'admin', name: 'National Relief Coordinator (Admin)', email: 'admin@annasetu.org', icon: '🛡️' }
  ];

  const body = `
    <p style="color:var(--text-muted); margin-bottom:16px;">Select a verified organizational account to access its dashboard immediately:</p>
    <div style="display:flex; flex-direction:column; gap:10px;">
      ${accounts.map((acc) => `
        <button class="btn btn-secondary" style="justify-content: flex-start; padding: 12px 16px; text-align:left;" onclick="quickLogin('${acc.email}')">
          <span style="font-size:1.4rem;">${acc.icon}</span>
          <div style="margin-left: 10px;">
            <div style="font-weight:700;">${acc.name}</div>
            <div style="font-size:0.8rem; color:var(--text-muted);">${acc.email}</div>
          </div>
        </button>
      `).join('')}
    </div>
  `;

  openModal('⚡ Quick Role Account Access', body);
}

async function quickLogin(email) {
  try {
    const res = await Api.post('/login', { email, password: 'AnnaSetu@1234' });
    Api.setToken(res.token);
    Api.setUser(res.user);
    state.user = res.user;
    closeModal();
    showToast(`Logged in as ${res.user.name} (${res.user.role})`);
    renderApp();
  } catch (err) {
    showToast(Array.isArray(err) ? err[0] : 'Account login failed', 'error');
  }
}

// Landing View
function renderLanding() {
  const container = $('#app-root');
  if (!container) return;

  container.innerHTML = `
    <section class="hero">
      <div class="hero-pill">🌾 AnnaSetu Resource Redistribution Platform</div>
      <h1>Turning Surplus into <span class="gradient">Community Support</span></h1>
      <p>A unified digital bridge connecting food donors, verified NGOs, volunteer logistics, and community relief centers to eliminate waste and deliver real-time emergency support.</p>
      <div class="hero-actions">
        <button class="btn btn-primary" onclick="renderAuth('register', 'donor')">🍲 Donate Resources</button>
        <button class="btn btn-accent" onclick="renderAuth('register', 'beneficiary')">🆘 Request Emergency Help</button>
        <button class="btn btn-secondary" onclick="openDemoModal()">⚡ Explore Platform Roles</button>
      </div>
    </section>

    <!-- Emergency Needs Banner -->
    <div class="alert-banner">
      <div class="alert-content">
        <span>🚨</span>
        <span>Active Relief Coordinator: Emergency requests for Water, Food, and Medical kits are actively being dispatched.</span>
      </div>
      <button class="btn btn-danger btn-sm" onclick="renderAuth('login')">View Emergency Needs</button>
    </div>

    <!-- Impact Counters -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-num">12,450+</div>
        <div class="metric-label">Meals Redistributed (Units)</div>
      </div>
      <div class="metric-card">
        <div class="metric-num">350+</div>
        <div class="metric-label">Food Donations Coordinated</div>
      </div>
      <div class="metric-card">
        <div class="metric-num">85+</div>
        <div class="metric-label">Verified NGO Partners</div>
      </div>
      <div class="metric-card">
        <div class="metric-num">100%</div>
        <div class="metric-label">Transparent Audit Trail</div>
      </div>
    </div>

    <!-- 4-Step Process Flow -->
    <section class="process-section">
      <div class="section-title">
        <h2>How AnnaSetu Works</h2>
        <p>A transparent, four-tier lifecycle verified at every touchpoint.</p>
      </div>
      <div class="steps-grid">
        <div class="step-card">
          <div class="step-badge">1</div>
          <div class="step-title">Donors List Surplus</div>
          <div class="step-desc">Restaurants, caterers, and individuals list surplus food & essentials with pickup location and deadline.</div>
        </div>
        <div class="step-card">
          <div class="step-badge">2</div>
          <div class="step-title">NGOs Review & Approve</div>
          <div class="step-desc">Verified NGOs evaluate food quality, approve listings, and pair them with active community requests.</div>
        </div>
        <div class="step-card">
          <div class="step-badge">3</div>
          <div class="step-title">Volunteer Dispatch</div>
          <div class="step-desc">Available volunteers are assigned with turnkey pickup and delivery routing details.</div>
        </div>
        <div class="step-card">
          <div class="step-badge">4</div>
          <div class="step-title">Safe Delivery & Verification</div>
          <div class="step-desc">Delivery is confirmed, auto-fulfilling linked beneficiary requests with complete history logging.</div>
        </div>
      </div>
    </section>
  `;
}

// Authentication View
function renderAuth(mode = 'login', presetRole = 'donor') {
  const isReg = mode === 'register';
  const container = $('#app-root');

  container.innerHTML = `
    <div style="max-width: 440px; margin: 40px auto;">
      <div class="card" style="box-shadow: var(--shadow-lg);">
        <h2 style="margin-bottom: 8px;">${isReg ? 'Create an Account' : 'Welcome Back'}</h2>
        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom: 20px;">
          ${isReg ? 'Join the AnnaSetu relief network to start donating or requesting help.' : 'Sign in to access your role-based dashboard.'}
        </p>

        <form id="auth-form" onsubmit="handleAuthSubmit(event, '${mode}')">
          ${isReg ? `
            <div class="form-group">
              <label class="form-label">Full Name / Organization</label>
              <input class="form-control" id="auth-name" required placeholder="e.g. Hope Relief Kitchen">
            </div>
            <div class="form-group">
              <label class="form-label">Account Role</label>
              <select class="form-control" id="auth-role">
                <option value="donor" ${presetRole === 'donor' ? 'selected' : ''}>Donor (Restaurants, Caterers, Citizens)</option>
                <option value="ngo" ${presetRole === 'ngo' ? 'selected' : ''}>NGO / Relief Organization</option>
                <option value="volunteer" ${presetRole === 'volunteer' ? 'selected' : ''}>Volunteer Dispatch</option>
                <option value="beneficiary" ${presetRole === 'beneficiary' ? 'selected' : ''}>Beneficiary / Community Representative</option>
              </select>
            </div>
          ` : ''}

          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input class="form-control" type="email" id="auth-email" required placeholder="name@example.com">
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input class="form-control" type="password" id="auth-password" required placeholder="${isReg ? 'Minimum 8 characters' : 'Enter your password'}">
          </div>

          <div id="auth-error" style="color:var(--critical); font-size:0.86rem; margin-bottom:12px;"></div>

          <button class="btn btn-primary" type="submit" style="width: 100%; margin-bottom: 12px;">
            ${isReg ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        <div style="text-align:center; margin-top: 16px; font-size:0.9rem; color:var(--text-muted);">
          ${isReg ? `Already registered? <a href="javascript:void(0)" onclick="renderAuth('login')" style="color:var(--primary); font-weight:600;">Sign In</a>` : `Don't have an account? <a href="javascript:void(0)" onclick="renderAuth('register')" style="color:var(--primary); font-weight:600;">Register here</a>`}
        </div>

        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); text-align: center;">
          <button class="btn btn-secondary btn-sm" onclick="openDemoModal()">⚡ Quick Role Access</button>
        </div>
      </div>
    </div>
  `;
}

async function handleAuthSubmit(e, mode) {
  e.preventDefault();
  const errorBox = $('#auth-error');
  errorBox.innerHTML = '';

  const email = $('#auth-email').value.trim();
  const password = $('#auth-password').value;

  try {
    if (mode === 'register') {
      const name = $('#auth-name').value.trim();
      const role = $('#auth-role').value;
      await Api.post('/register', { name, email, password, role });
      showToast('Registration successful! Please login.');
      renderAuth('login');
    } else {
      const res = await Api.post('/login', { email, password });
      Api.setToken(res.token);
      Api.setUser(res.user);
      state.user = res.user;
      showToast(`Welcome back, ${res.user.name}!`);
      renderApp();
    }
  } catch (err) {
    const msgs = Array.isArray(err) ? err : [err.message || 'Authentication error'];
    errorBox.innerHTML = msgs.map(escapeHtml).join('<br>');
  }
}

async function logout() {
  try {
    await Api.post('/logout');
  } catch (e) {
    // ignore
  }
  Api.setToken(null);
  Api.setUser(null);
  state.user = null;
  state.currentTab = '';
  showToast('Logged out successfully');
  renderApp();
}

// Tab Configurations per Role
const ROLE_TABS = {
  donor: ['My Donations', 'New Donation', 'Open Requests'],
  ngo: ['Review Donations', 'Available Listings', 'Smart Matches', 'Emergency Requests', 'New Request'],
  volunteer: ['My Tasks'],
  beneficiary: ['My Requests', 'New Request'],
  admin: ['Analytics & Reports', 'All Donations', 'Emergency Requests', 'User Verification']
};

function renderDashboard() {
  const user = state.user;
  const container = $('#app-root');
  const roleTabs = ROLE_TABS[user.role] || [];
  const allTabs = [...roleTabs, 'Notifications', 'Profile'];

  if (!state.currentTab || !allTabs.includes(state.currentTab)) {
    state.currentTab = allTabs[0];
  }

  container.innerHTML = `
    <!-- Tabs Header -->
    <div class="tabs-nav">
      ${allTabs.map((t) => `
        <button class="tab-btn ${t === state.currentTab ? 'active' : ''}" onclick="switchTab('${t}')">
          ${t}
        </button>
      `).join('')}
    </div>

    <!-- Active Tab Content Area -->
    <div id="tab-content">
      <div style="text-align:center; padding: 40px; color:var(--text-muted);">Loading data...</div>
    </div>
  `;

  loadActiveTabData();
}

function switchTab(tabName) {
  state.currentTab = tabName;
  renderDashboard();
}

// Load Tab Content Data
async function loadActiveTabData() {
  const contentArea = $('#tab-content');
  if (!contentArea) return;

  try {
    const tab = state.currentTab;

    if (tab === 'Notifications') {
      await renderNotificationsTab(contentArea);
    } else if (tab === 'Profile') {
      await renderProfileTab(contentArea);
    } else if (tab === 'Analytics & Reports') {
      await renderReportsTab(contentArea);
    } else if (tab === 'User Verification') {
      await renderUsersTab(contentArea);
    } else if (tab === 'Smart Matches') {
      await renderMatchesTab(contentArea);
    } else if (tab === 'New Donation') {
      await renderNewDonationForm(contentArea);
    } else if (tab === 'New Request') {
      await renderNewRequestForm(contentArea);
    } else if (['Emergency Requests', 'Open Requests', 'My Requests'].includes(tab)) {
      await renderRequestsTab(contentArea);
    } else {
      // Donations-based views (My Donations, Review Donations, Available Listings, All Donations, My Tasks)
      await renderDonationsTab(contentArea);
    }
  } catch (err) {
    console.error('Error loading tab:', err);
    contentArea.innerHTML = `<div class="card" style="color:var(--critical);">${escapeHtml(Array.isArray(err) ? err[0] : 'Failed to load content')}</div>`;
  }
}

// Tab: Donations List View
async function renderDonationsTab(container) {
  const donations = await Api.get('/donations');
  state.donations = donations;

  let vols = [];
  if (state.user.role === 'ngo' || state.user.role === 'admin') {
    vols = await Api.get('/volunteers');
    state.volunteers = vols;
  }

  // Filter Bar
  const filterHtml = `
    <div class="filter-bar">
      <input class="form-control filter-input" placeholder="🔍 Search donations by title..." value="${escapeHtml(state.filters.search)}" oninput="applyFilters('search', this.value)">
      <select class="form-control filter-select" onchange="applyFilters('category', this.value)">
        <option value="">All Categories</option>
        ${CATEGORIES.map((c) => `<option value="${c}" ${state.filters.category === c ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
      <select class="form-control filter-select" onchange="applyFilters('status', this.value)">
        <option value="">All Statuses</option>
        ${['Created', 'Submitted', 'UnderReview', 'Approved', 'Available', 'Assigned', 'InTransit', 'Delivered', 'Rejected', 'Cancelled'].map((s) => `
          <option value="${s}" ${state.filters.status === s ? 'selected' : ''}>${s}</option>
        `).join('')}
      </select>
    </div>
  `;

  let filtered = donations;
  if (state.filters.search) {
    const q = state.filters.search.toLowerCase();
    filtered = filtered.filter((d) => d.title.toLowerCase().includes(q));
  }
  if (state.filters.category) {
    filtered = filtered.filter((d) => d.category === state.filters.category);
  }
  if (state.filters.status) {
    filtered = filtered.filter((d) => d.status === state.filters.status);
  }

  // Role-specific view subsets
  if (state.currentTab === 'Review Donations') {
    filtered = filtered.filter((d) => ['Submitted', 'UnderReview'].includes(d.status));
  } else if (state.currentTab === 'Available Listings') {
    filtered = filtered.filter((d) => d.status === 'Available');
  }

  const listHtml = filtered.length
    ? filtered.map((d) => renderDonationCard(d, vols)).join('')
    : `<div class="card" style="text-align:center; padding: 40px; color:var(--text-muted);">
        No donations found matching the current criteria.
       </div>`;

  container.innerHTML = filterHtml + listHtml;
}

function applyFilters(key, val) {
  state.filters[key] = val;
  const contentArea = $('#tab-content');
  if (contentArea) renderDonationsTab(contentArea);
}

// Render Individual Donation Card
function renderDonationCard(d, vols) {
  const me = state.user;
  const isOwnerNgo = d.ngo_id === me.id;

  // Build role-permitted actions based on Finite State Machine
  let actions = [];

  if (d.status === 'Created' && me.role === 'donor') {
    actions.push(`<button class="btn btn-primary btn-sm" onclick="handleDonationAction(${d.id}, 'submit')">🚀 Submit for Review</button>`);
    actions.push(`<button class="btn btn-secondary btn-sm" onclick="openEditDonationModal(${d.id})">✏️ Edit</button>`);
    actions.push(`<button class="btn btn-danger btn-sm" onclick="handleDonationAction(${d.id}, 'cancel')">Cancel</button>`);
  }

  if (d.status === 'Submitted') {
    if (me.role === 'ngo') {
      actions.push(`<button class="btn btn-primary btn-sm" onclick="handleDonationAction(${d.id}, 'review')">🔍 Start Review</button>`);
    }
    if (me.role === 'donor' || me.role === 'admin') {
      actions.push(`<button class="btn btn-danger btn-sm" onclick="handleDonationAction(${d.id}, 'cancel')">Cancel</button>`);
    }
  }

  if (d.status === 'UnderReview' && me.role === 'ngo' && isOwnerNgo) {
    actions.push(`<button class="btn btn-primary btn-sm" onclick="handleDonationAction(${d.id}, 'approve')">✅ Approve</button>`);
    actions.push(`<button class="btn btn-danger btn-sm" onclick="handleDonationAction(${d.id}, 'reject')">❌ Reject</button>`);
  }

  if (d.status === 'Approved') {
    if (me.role === 'ngo' && isOwnerNgo) {
      actions.push(`<button class="btn btn-accent btn-sm" onclick="handleDonationAction(${d.id}, 'release')">📢 Mark Available</button>`);
    }
    if (me.role === 'donor' || me.role === 'admin') {
      actions.push(`<button class="btn btn-danger btn-sm" onclick="handleDonationAction(${d.id}, 'cancel')">Cancel</button>`);
    }
  }

  if (d.status === 'Rejected' && me.role === 'donor') {
    actions.push(`<button class="btn btn-primary btn-sm" onclick="handleDonationAction(${d.id}, 'reopen')">🔄 Edit & Resubmit</button>`);
  }

  if (d.status === 'Available' && me.role === 'ngo' && isOwnerNgo) {
    actions.push(`<button class="btn btn-primary btn-sm" onclick="openAssignModal(${d.id})">🚴 Assign Volunteer</button>`);
  }

  if (d.status === 'Assigned' && me.role === 'volunteer') {
    actions.push(`<button class="btn btn-primary btn-sm" onclick="handleDonationAction(${d.id}, 'start')">🚀 Start Delivery</button>`);
  }

  if (d.status === 'InTransit' && me.role === 'volunteer') {
    actions.push(`<button class="btn btn-accent btn-sm" onclick="handleDonationAction(${d.id}, 'deliver')">📦 Mark Delivered</button>`);
  }

  return `
    <div class="card">
      <div class="card-header">
        <div>
          <span class="card-title">${escapeHtml(d.title)}</span>
          <span class="pill pill-${d.status}" style="margin-left: 8px;">${d.status}</span>
          <span class="pill" style="background:var(--bg-subtle);">${escapeHtml(d.category)}</span>
        </div>
        <div style="font-weight: 700; color: var(--primary);">× ${d.quantity} units</div>
      </div>

      <div class="card-meta">
        <div>📍 <b>Pickup:</b> ${escapeHtml(d.pickup)}</div>
        ${d.servings ? `<div>👥 <b>Servings:</b> ${d.servings}</div>` : ''}
        ${d.deadline ? `<div>⏰ <b>Consume By:</b> ${escapeHtml(d.deadline)}</div>` : ''}
        <div>👤 <b>Donor:</b> ${escapeHtml(d.donor_name)}</div>
        ${d.delivery_location ? `<div>🎯 <b>Deliver To:</b> ${escapeHtml(d.delivery_location)}</div>` : ''}
        ${d.volunteer_name ? `<div>🚴 <b>Volunteer:</b> ${escapeHtml(d.volunteer_name)}</div>` : ''}
      </div>

      ${d.description ? `<div class="card-body">${escapeHtml(d.description)}</div>` : ''}

      <div class="card-actions">
        ${actions.join('')}
        <button class="btn btn-secondary btn-sm" onclick="openHistoryModal(${d.id})">📜 History</button>
      </div>
    </div>
  `;
}

// Lifecycle Actions
async function handleDonationAction(id, action, extra = {}) {
  if (action === 'cancel' && !confirm('Are you sure you want to cancel this listing?')) {
    return;
  }

  try {
    const res = await Api.post('/donations/action', { id, action, ...extra });
    showToast(`Donation status updated to ${res.status}`);
    loadActiveTabData();
  } catch (err) {
    showToast(Array.isArray(err) ? err[0] : 'Action failed', 'error');
  }
}

// Assign Volunteer Modal
function openAssignModal(donationId) {
  const vols = state.volunteers;
  if (!vols.length) {
    showToast('No verified, available volunteers are currently online.', 'warning');
    return;
  }

  const body = `
    <div class="form-group">
      <label class="form-label">Select Verified Volunteer</label>
      <select class="form-control" id="modal-vol-id">
        ${vols.map((v) => `<option value="${v.id}">${escapeHtml(v.name)} (${escapeHtml(v.phone || 'Active')})</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Delivery Destination Location</label>
      <input class="form-control" id="modal-delivery-loc" placeholder="e.g. Community Shelter #4, Gate B" required>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="submitVolunteerAssignment(${donationId})">Confirm Assignment</button>
  `;

  openModal('🚴 Dispatch Volunteer', body, footer);
}

async function submitVolunteerAssignment(donationId) {
  const volunteer_id = $('#modal-vol-id').value;
  const delivery_location = $('#modal-delivery-loc').value.trim();

  if (!delivery_location) {
    showToast('Delivery location is required', 'error');
    return;
  }

  closeModal();
  await handleDonationAction(donationId, 'assign', { volunteer_id, delivery_location });
}

// Edit Donation Modal
function openEditDonationModal(donationId) {
  const d = state.donations.find((item) => item.id === donationId);
  if (!d) return;

  const body = `
    <div class="form-group">
      <label class="form-label">Listing Title</label>
      <input class="form-control" id="edit-title" value="${escapeHtml(d.title)}">
    </div>
    <div class="form-group">
      <label class="form-label">Category</label>
      <select class="form-control" id="edit-cat">
        ${CATEGORIES.map((c) => `<option value="${c}" ${d.category === c ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Quantity (1-500)</label>
      <input class="form-control" type="number" id="edit-qty" value="${d.quantity}">
    </div>
    <div class="form-group">
      <label class="form-label">Pickup Location</label>
      <input class="form-control" id="edit-pickup" value="${escapeHtml(d.pickup)}">
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="form-control" id="edit-desc">${escapeHtml(d.description || '')}</textarea>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveDonationEdit(${donationId})">Save Changes</button>
  `;

  openModal('✏️ Edit Donation Listing', body, footer);
}

async function saveDonationEdit(donationId) {
  const title = $('#edit-title').value.trim();
  const category = $('#edit-cat').value;
  const quantity = Number($('#edit-qty').value);
  const pickup = $('#edit-pickup').value.trim();
  const description = $('#edit-desc').value.trim();

  try {
    await Api.post('/donations/edit', { id: donationId, title, category, quantity, pickup, description });
    closeModal();
    showToast('Donation updated successfully');
    loadActiveTabData();
  } catch (err) {
    showToast(Array.isArray(err) ? err[0] : 'Failed to update donation', 'error');
  }
}

// History Timeline Modal
async function openHistoryModal(donationId) {
  try {
    const history = await Api.get(`/history?donation_id=${donationId}`);
    const timelineHtml = `
      <div class="timeline">
        ${history.map((h) => `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-status">${h.status}</div>
            <div class="timeline-time">${h.at}</div>
          </div>
        `).join('')}
      </div>
    `;
    openModal('📜 Lifecycle Audit History', timelineHtml);
  } catch (err) {
    showToast(Array.isArray(err) ? err[0] : 'Failed to fetch history', 'error');
  }
}

// Tab: New Donation Form
async function renderNewDonationForm(container) {
  const requests = await Api.get('/requests');

  container.innerHTML = `
    <div class="card" style="max-width: 600px; margin: 0 auto;">
      <h2 style="margin-bottom: 16px;">List Surplus Resources</h2>
      <form id="new-donation-form" onsubmit="handleCreateDonation(event)">
        <div class="form-group">
          <label class="form-label">Title / Item Description *</label>
          <input class="form-control" id="d-title" required placeholder="e.g. 50 Packaged Meals from Wedding Reception">
          <div class="form-help">Must be 3-100 characters</div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div class="form-group">
            <label class="form-label">Resource Category *</label>
            <select class="form-control" id="d-cat">
              ${CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Quantity Units *</label>
            <input class="form-control" type="number" id="d-qty" min="1" max="500" required placeholder="1 - 500">
            <div class="form-help">Allowed range: 1 to 500</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div class="form-group">
            <label class="form-label">Estimated Servings (Optional)</label>
            <input class="form-control" type="number" id="d-servings" placeholder="1 - 1000">
          </div>
          <div class="form-group">
            <label class="form-label">Consume By Deadline (Optional)</label>
            <input class="form-control" type="datetime-local" id="d-deadline">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Pickup Location & Access Instructions *</label>
          <input class="form-control" id="d-pickup" required placeholder="e.g. Grand Kitchens, Rear Loading Bay 2">
        </div>

        <div class="form-group">
          <label class="form-label">Respond to Community Request (Optional)</label>
          <select class="form-control" id="d-request-id">
            <option value="">-- None (General Surplus) --</option>
            ${requests.map((r) => `
              <option value="${r.id}">[${r.urgency}] #${r.id} ${r.category} ×${r.quantity} at ${escapeHtml(r.location)}</option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Special Handling Notes</label>
          <textarea class="form-control" id="d-desc" placeholder="Vegetarian, requires refrigeration, allergen warnings, etc."></textarea>
        </div>

        <button class="btn btn-primary" type="submit" style="width: 100%; padding: 12px;">Create Donation Listing</button>
      </form>
    </div>
  `;
}

async function handleCreateDonation(e) {
  e.preventDefault();

  const title = $('#d-title').value.trim();
  const category = $('#d-cat').value;
  const quantity = Number($('#d-qty').value);
  const servings = $('#d-servings').value ? Number($('#d-servings').value) : null;
  const deadline = $('#d-deadline').value || null;
  const pickup = $('#d-pickup').value.trim();
  const request_id = $('#d-request-id').value || null;
  const description = $('#d-desc').value.trim();

  try {
    const res = await Api.post('/donations', {
      title,
      category,
      quantity,
      servings,
      deadline,
      pickup,
      request_id,
      description
    });
    showToast('Donation created! Now submit it for NGO review.');
    switchTab('My Donations');
  } catch (err) {
    showToast(Array.isArray(err) ? err[0] : 'Failed to create donation', 'error');
  }
}

// Tab: New Request Form
async function renderNewRequestForm(container) {
  container.innerHTML = `
    <div class="card" style="max-width: 600px; margin: 0 auto;">
      <h2 style="margin-bottom: 16px;">Raise Emergency Relief Request</h2>
      <form id="new-req-form" onsubmit="handleCreateRequest(event)">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div class="form-group">
            <label class="form-label">Resource Type *</label>
            <select class="form-control" id="r-cat">
              ${CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Quantity Required (1-500) *</label>
            <input class="form-control" type="number" id="r-qty" min="1" max="500" required placeholder="Units required">
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div class="form-group">
            <label class="form-label">Urgency Level *</label>
            <select class="form-control" id="r-urgency">
              ${URGENCIES.map((u) => `<option value="${u}" ${u === 'High' ? 'selected' : ''}>${u}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Delivery Location *</label>
            <input class="form-control" id="r-loc" required placeholder="Relief Camp A, Sector 4">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Situation Details</label>
          <textarea class="form-control" id="r-desc" placeholder="Describe the community need, number of individuals affected, etc."></textarea>
        </div>

        <button class="btn btn-accent" type="submit" style="width: 100%; padding: 12px;">Submit Urgent Relief Request</button>
      </form>
    </div>
  `;
}

async function handleCreateRequest(e) {
  e.preventDefault();

  const category = $('#r-cat').value;
  const quantity = Number($('#r-qty').value);
  const urgency = $('#r-urgency').value;
  const location = $('#r-loc').value.trim();
  const description = $('#r-desc').value.trim();

  try {
    await Api.post('/requests', { category, quantity, urgency, location, description });
    showToast('Emergency request submitted! NGOs and dispatchers notified.');
    switchTab(state.user.role === 'beneficiary' ? 'My Requests' : 'Emergency Requests');
  } catch (err) {
    showToast(Array.isArray(err) ? err[0] : 'Failed to submit request', 'error');
  }
}

// Tab: Requests List View
async function renderRequestsTab(container) {
  const requests = await Api.get('/requests');
  state.requests = requests;

  if (!requests.length) {
    container.innerHTML = `<div class="card" style="text-align:center; padding: 40px; color:var(--text-muted);">No active relief requests right now.</div>`;
    return;
  }

  container.innerHTML = requests.map((r) => `
    <div class="card">
      <div class="card-header">
        <div>
          <span class="card-title">#${r.id} ${escapeHtml(r.category)}</span>
          <span class="pill pill-${r.urgency}">${r.urgency} Urgency</span>
          <span class="pill pill-${r.status}">${r.status}</span>
        </div>
        <div style="font-weight: 700; color: var(--primary);">Needs: ${r.quantity} units</div>
      </div>

      <div class="card-meta">
        <div>📍 <b>Location:</b> ${escapeHtml(r.location)}</div>
        <div>👤 <b>Requested By:</b> ${escapeHtml(r.requester)} ${r.requester_phone ? `(${escapeHtml(r.requester_phone)})` : ''}</div>
        <div>📅 <b>Raised:</b> ${r.created}</div>
      </div>

      ${r.description ? `<div class="card-body">${escapeHtml(r.description)}</div>` : ''}

      ${(state.user.role === 'ngo' || state.user.role === 'admin') ? `
        <div class="card-actions">
          ${r.status === 'Open' ? `<button class="btn btn-primary btn-sm" onclick="updateRequestStatus(${r.id}, 'In Progress')">Start Processing</button>` : ''}
          ${r.status === 'In Progress' ? `<button class="btn btn-accent btn-sm" onclick="updateRequestStatus(${r.id}, 'Fulfilled')">Mark Fulfilled</button>` : ''}
        </div>
      ` : ''}
    </div>
  `).join('');
}

async function updateRequestStatus(id, status) {
  try {
    await Api.post('/requests/status', { id, status });
    showToast(`Request marked as ${status}`);
    loadActiveTabData();
  } catch (err) {
    showToast(Array.isArray(err) ? err[0] : 'Failed to update request', 'error');
  }
}

// Tab: Smart Matches View
async function renderMatchesTab(container) {
  const matches = await Api.get('/matches');

  const banner = `
    <div class="card" style="background:var(--primary-light); border-color:rgba(16,185,129,0.3); margin-bottom:20px;">
      <b>🤖 Smart Redistribution Algorithm</b>
      <p style="font-size:0.88rem; color:var(--text-muted); margin-top:4px;">
        Automatically matches submitted and available donations with urgent community requests based on category parity, urgency tier ranking, and minimal quantity delta.
      </p>
    </div>
  `;

  if (!matches.length) {
    container.innerHTML = banner + `<div class="card" style="text-align:center; padding: 40px; color:var(--text-muted);">No matching pairs found currently.</div>`;
    return;
  }

  const list = matches.map((m) => `
    <div class="card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
      <div>
        <div style="font-weight:700; font-size:1.05rem;">Donation #${m.donation_id}: ${escapeHtml(m.title)} (${m.donation_qty} units)</div>
        <div style="font-size:0.86rem; color:var(--text-muted); margin-top:4px;">
          Matches Request #${m.request_id} needing <b>${m.request_qty} units</b> at 📍 ${escapeHtml(m.location)}
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <span class="pill pill-${m.urgency}">${m.urgency}</span>
        <button class="btn btn-primary btn-sm" onclick="switchTab('Review Donations')">Handle Listing</button>
      </div>
    </div>
  `).join('');

  container.innerHTML = banner + list;
}

// Tab: Users & Verification (Admin)
async function renderUsersTab(container) {
  const users = await Api.get('/users');

  container.innerHTML = `
    <div class="card">
      <h3 style="margin-bottom: 16px;">User Verification & Role Administration</h3>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border); color:var(--text-muted);">
              <th style="padding: 10px;">ID</th>
              <th style="padding: 10px;">Name / Org</th>
              <th style="padding: 10px;">Email</th>
              <th style="padding: 10px;">Role</th>
              <th style="padding: 10px;">Verification</th>
              <th style="padding: 10px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${users.map((u) => `
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 10px;">#${u.id}</td>
                <td style="padding: 10px; font-weight:600;">${escapeHtml(u.name)}</td>
                <td style="padding: 10px;">${escapeHtml(u.email)}</td>
                <td style="padding: 10px;"><span class="pill pill-${u.role}">${u.role}</span></td>
                <td style="padding: 10px;">
                  ${u.verified ? `<span class="pill pill-Approved">Verified</span>` : `<span class="pill pill-Critical">Pending</span>`}
                </td>
                <td style="padding: 10px; text-align: right;">
                  ${!u.verified && ['ngo', 'volunteer'].includes(u.role) ? `
                    <button class="btn btn-primary btn-sm" onclick="verifyUserAccount(${u.id})">Verify Account</button>
                  ` : '<span style="color:var(--text-subtle);">Active</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function verifyUserAccount(userId) {
  try {
    await Api.post('/users/verify', { id: userId });
    showToast('User verified successfully');
    loadActiveTabData();
  } catch (err) {
    showToast(Array.isArray(err) ? err[0] : 'Failed to verify user', 'error');
  }
}

// Tab: Analytics & Reports (Admin)
async function renderReportsTab(container) {
  const rep = await Api.get('/reports');

  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h2>Platform Performance & Impact</h2>
      <p style="color:var(--text-muted); font-size:0.9rem;">Live analytics generated directly from persistent PostgreSQL (Neon) transaction records.</p>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-num">${rep.donations_created}</div>
        <div class="metric-label">Donations Created</div>
      </div>
      <div class="metric-card">
        <div class="metric-num">${rep.donations_delivered}</div>
        <div class="metric-label">Delivered Successfully</div>
      </div>
      <div class="metric-card">
        <div class="metric-num">${rep.quantity_delivered_units}</div>
        <div class="metric-label">Total Units Distributed</div>
      </div>
      <div class="metric-card">
        <div class="metric-num">${rep.active_requests}</div>
        <div class="metric-label">Active Emergency Requests</div>
      </div>
      <div class="metric-card">
        <div class="metric-num">${rep.completed_tasks}</div>
        <div class="metric-label">Volunteer Tasks Completed</div>
      </div>
      <div class="metric-card">
        <div class="metric-num">${rep.users}</div>
        <div class="metric-label">Total Registered Users</div>
      </div>
    </div>
  `;
}

// Tab: Notifications
async function renderNotificationsTab(container) {
  const notifs = await Api.get('/notifications');
  state.notifications = notifs;

  // Mark all read in backend
  Api.post('/notifications/read').then(() => {
    state.notifications.forEach((n) => (n.is_read = 1));
    renderNav();
  });

  if (!notifs.length) {
    container.innerHTML = `<div class="card" style="text-align:center; padding: 40px; color:var(--text-muted);">No notifications yet.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="card">
      <h3 style="margin-bottom: 16px;">Notification Center</h3>
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${notifs.map((n) => `
          <div style="padding: 12px 16px; border-radius: var(--radius-md); background: ${n.is_read ? 'var(--bg-surface)' : 'var(--primary-light)'}; border: 1px solid var(--border);">
            <div style="font-size:0.92rem; font-weight:${n.is_read ? '500' : '700'};">${escapeHtml(n.message)}</div>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-top:4px;">${n.created}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Tab: Profile Settings
async function renderProfileTab(container) {
  const profile = await Api.get('/profile');

  container.innerHTML = `
    <div class="card" style="max-width: 520px; margin: 0 auto;">
      <h3 style="margin-bottom: 16px;">Profile & Account Settings</h3>
      <form id="profile-form" onsubmit="handleSaveProfile(event)">
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input class="form-control" id="p-name" value="${escapeHtml(profile.name)}" required>
        </div>

        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input class="form-control" value="${escapeHtml(profile.email)}" disabled style="opacity:0.75;">
        </div>

        <div class="form-group">
          <label class="form-label">Phone Number</label>
          <input class="form-control" id="p-phone" value="${escapeHtml(profile.phone || '')}" placeholder="+91 98765 43210">
        </div>

        <div class="form-group">
          <label class="form-label">Physical Address</label>
          <input class="form-control" id="p-address" value="${escapeHtml(profile.address || '')}" placeholder="Street, City, Pin">
        </div>

        ${profile.role === 'ngo' ? `
          <div class="form-group">
            <label class="form-label">Organization Name</label>
            <input class="form-control" id="p-org" value="${escapeHtml(profile.org_name || '')}">
          </div>
        ` : ''}

        ${profile.role === 'volunteer' ? `
          <div class="form-group">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="checkbox" id="p-avail" ${profile.available ? 'checked' : ''} style="width:18px; height:18px;">
              <span style="font-weight:600;">Available for pickup and delivery tasks</span>
            </label>
          </div>
        ` : ''}

        <div style="font-size:0.86rem; color:var(--text-muted); margin-bottom:16px;">
          Account Status: ${profile.verified ? '<span class="pill pill-Approved">Verified</span>' : '<span class="pill pill-Critical">Pending Admin Verification</span>'}
        </div>

        <button class="btn btn-primary" type="submit" style="width: 100%;">Save Profile</button>
      </form>
    </div>
  `;
}

async function handleSaveProfile(e) {
  e.preventDefault();

  const name = $('#p-name').value.trim();
  const phone = $('#p-phone').value.trim();
  const address = $('#p-address').value.trim();
  const org_name = $('#p-org') ? $('#p-org').value.trim() : null;
  const available = $('#p-avail') ? $('#p-avail').checked : true;

  try {
    await Api.post('/profile', { name, phone, address, org_name, available });
    state.user.name = name;
    Api.setUser(state.user);
    renderNav();
    showToast('Profile saved successfully');
  } catch (err) {
    showToast(Array.isArray(err) ? err[0] : 'Failed to update profile', 'error');
  }
}

// Master Render Router
function renderApp() {
  renderNav();
  if (state.user) {
    renderDashboard();
  } else {
    renderLanding();
  }
}

// Global Event Listeners
window.addEventListener('auth:expired', () => {
  state.user = null;
  showToast('Session expired. Please log in again.', 'warning');
  renderApp();
});

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderApp();
});
