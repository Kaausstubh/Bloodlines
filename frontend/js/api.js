/* ===== SHARED JS API LAYER ===== */
const API_BASE = 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('sbn_token');
const getUser = () => JSON.parse(localStorage.getItem('sbn_user') || 'null');
const setAuth = (token, user) => { localStorage.setItem('sbn_token', token); localStorage.setItem('sbn_user', JSON.stringify(user)); };
const clearAuth = () => { localStorage.removeItem('sbn_token'); localStorage.removeItem('sbn_user'); };

const authHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` });

const api = {
  get: async (endpoint) => {
    const res = await fetch(`${API_BASE}${endpoint}`, { headers: authHeaders() });
    return res.json();
  },
  post: async (endpoint, body) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(body)
    });
    return res.json();
  },
  put: async (endpoint, body = {}) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT', headers: authHeaders(), body: JSON.stringify(body)
    });
    return res.json();
  },
  delete: async (endpoint) => {
    const res = await fetch(`${API_BASE}${endpoint}`, { method: 'DELETE', headers: authHeaders() });
    return res.json();
  }
};

// ===== TOAST NOTIFICATIONS =====
const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);

function showToast(message, type = 'info', duration = 4000) {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span style="font-size:1.2rem">${icons[type]}</span><span style="font-size:0.9rem">${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.35s ease forwards';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ===== AUTH GUARD =====
function requireAuth(allowedRoles = []) {
  const token = getToken();
  const user = getUser();
  if (!token || !user) { window.location.href = '/login.html'; return null; }
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    window.location.href = `/${user.role}/dashboard.html`;
    return null;
  }
  return user;
}

// ===== TIME HELPERS =====
function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ===== RENDER STARS =====
function renderStars(rating, max = 5) {
  let html = '<div class="donor-rating">';
  for (let i = 1; i <= max; i++) {
    html += `<span class="star ${i <= Math.round(rating) ? '' : 'empty'}">★</span>`;
  }
  html += '</div>';
  return html;
}

// ===== BLOOD GROUP BADGE =====
function bloodBadge(group) {
  return `<span class="blood-badge">${group || '?'}</span>`;
}

// ===== URGENCY BADGE =====
function urgencyBadge(u) {
  const map = { emergency: 'badge-red', urgent: 'badge-yellow', normal: 'badge-blue' };
  return `<span class="badge ${map[u] || 'badge-gray'}">${u}</span>`;
}

// ===== STATUS BADGE =====
function statusBadge(s) {
  const map = { open: 'badge-yellow', matched: 'badge-blue', fulfilled: 'badge-green', cancelled: 'badge-gray' };
  return `<span class="badge ${map[s] || 'badge-gray'}">${s}</span>`;
}

// ===== NOTIFICATION BADGE UPDATE =====
function updateNotifBadge(count) {
  const badge = document.getElementById('notif-badge');
  if (badge) {
    badge.textContent = count > 0 ? (count > 99 ? '99+' : count) : '';
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}
