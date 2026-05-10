// ============================================================
// Traveloop — API Client (Single Source of Truth)
// All frontend-to-backend communication goes through here.
// Backend: Flask on http://localhost:5000
// ============================================================

const API_BASE_URL = window.location.protocol === 'file:' ? 'http://localhost:5000/api' : window.location.origin + '/api';
const TOKEN_KEY = 'authToken';
const USER_KEY = 'traveloop_user';

// ===== CORE FETCH WRAPPER =====
async function apiCall(endpoint, options = {}) {
  const defaultHeaders = { 'Content-Type': 'application/json' };

  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    defaultHeaders['Authorization'] = 'Bearer ' + token;
  }

  try {
    const response = await fetch(API_BASE_URL + endpoint, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || data.message || 'API Error: ' + response.status);
    }

    return data;
  } catch (error) {
    console.error('API Call Error (' + endpoint + '):', error);
    throw error;
  }
}

// ===== AUTH =====
async function registerUser(payload) {
  // payload: { name, email, password, phone, city, country, profilePic }
  const data = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (data.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
  }
  if (data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }
  return data;
}

async function loginUser(email, password) {
  const data = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
  }
  if (data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }
  return data;
}

function logoutUser() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = 'login.html';
}

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); }
  catch { return null; }
}

function isLoggedIn() {
  return !!localStorage.getItem(TOKEN_KEY);
}

// ===== TRIPS =====
async function fetchTrips() {
  return apiCall('/trips', { method: 'GET' });
}

async function fetchTripById(tripId) {
  return apiCall('/trips/' + tripId, { method: 'GET' });
}

async function createTrip(tripData) {
  return apiCall('/trips', {
    method: 'POST',
    body: JSON.stringify(tripData),
  });
}

async function updateTrip(tripId, tripData) {
  return apiCall('/trips/' + tripId, {
    method: 'PUT',
    body: JSON.stringify(tripData),
  });
}

async function deleteTrip(tripId) {
  return apiCall('/trips/' + tripId, { method: 'DELETE' });
}

// ===== ITINERARY =====
async function fetchItinerary(tripId) {
  return apiCall('/trips/' + tripId + '/itinerary', { method: 'GET' });
}

// ===== ACTIVITIES =====
async function fetchActivities() {
  return apiCall('/activities', { method: 'GET' });
}

// ===== COMMUNITY =====
async function fetchCommunityPosts() {
  return apiCall('/community', { method: 'GET' });
}

async function createCommunityPost(postData) {
  return apiCall('/community', {
    method: 'POST',
    body: JSON.stringify(postData),
  });
}

// ===== NOTES =====
async function fetchNotes(tripId) {
  const query = tripId ? '?tripId=' + tripId : '';
  return apiCall('/notes' + query, { method: 'GET' });
}

async function createNote(noteData) {
  return apiCall('/notes', {
    method: 'POST',
    body: JSON.stringify(noteData),
  });
}

// ===== INVOICES =====
async function fetchInvoices() {
  return apiCall('/invoices', { method: 'GET' });
}

async function fetchInvoiceById(invoiceId) {
  return apiCall('/invoices/' + invoiceId, { method: 'GET' });
}

async function markInvoicePaid(invoiceId) {
  return apiCall('/invoices/' + invoiceId + '/mark-paid', { method: 'PUT' });
}

// ===== CHECKLISTS =====
async function fetchChecklists() {
  return apiCall('/checklists', { method: 'GET' });
}

async function updateChecklist(checklistId, data) {
  return apiCall('/checklists/' + checklistId, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ===== USER PROFILE =====
async function fetchUserProfile() {
  const user = getStoredUser();
  const userId = user ? user.id : '';
  return apiCall('/user/profile?userId=' + userId, { method: 'GET' });
}

async function updateUserProfile(userData) {
  const user = getStoredUser();
  const userId = user ? user.id : '';
  return apiCall('/user/profile?userId=' + userId, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
}

// ===== ADMIN =====
async function fetchAdminAnalytics() {
  return apiCall('/admin/analytics', { method: 'GET' });
}

async function fetchAdminUsers() {
  return apiCall('/admin/users', { method: 'GET' });
}

// ===== CONNECTION TEST =====
async function testBackendConnection() {
  try {
    const data = await apiCall('/test', { method: 'GET' });
    console.log('[OK] Backend connected:', data.message);
    return true;
  } catch (error) {
    console.warn('[WARN] Backend not reachable. Running in offline/static mode.');
    return false;
  }
}
