// API Configuration and Helper Functions
// This file handles all communication between frontend and backend

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Generic fetch wrapper for API calls
 * @param {string} endpoint - API endpoint (e.g., '/trips')
 * @param {object} options - Fetch options (method, body, headers)
 * @returns {Promise} Response data
 */
async function apiCall(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    // Handle error responses
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Call Error (${endpoint}):`, error);
    throw error;
  }
}

// ===== AUTH API CALLS =====
async function registerUser(email, password, name) {
  return apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

async function loginUser(email, password) {
  const response = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  // Store token if login successful
  if (response.token) {
    localStorage.setItem('authToken', response.token);
  }
  
  return response;
}

async function logoutUser() {
  localStorage.removeItem('authToken');
}

// ===== TRIPS API CALLS =====
async function fetchTrips() {
  return apiCall('/trips', { method: 'GET' });
}

async function fetchTripById(tripId) {
  return apiCall(`/trips/${tripId}`, { method: 'GET' });
}

async function createTrip(tripData) {
  return apiCall('/trips', {
    method: 'POST',
    body: JSON.stringify(tripData),
  });
}

async function updateTrip(tripId, tripData) {
  return apiCall(`/trips/${tripId}`, {
    method: 'PUT',
    body: JSON.stringify(tripData),
  });
}

async function deleteTrip(tripId) {
  return apiCall(`/trips/${tripId}`, { method: 'DELETE' });
}

// ===== ACTIVITIES API CALLS =====
async function fetchActivities(tripId) {
  return apiCall(`/activities?tripId=${tripId}`, { method: 'GET' });
}

async function createActivity(activityData) {
  return apiCall('/activities', {
    method: 'POST',
    body: JSON.stringify(activityData),
  });
}

async function deleteActivity(activityId) {
  return apiCall(`/activities/${activityId}`, { method: 'DELETE' });
}

// ===== USER API CALLS =====
async function fetchUserProfile() {
  return apiCall('/user/profile', { method: 'GET' });
}

async function updateUserProfile(userData) {
  return apiCall('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
}

// ===== TEST CONNECTION =====
async function testBackendConnection() {
  try {
    const response = await apiCall('/test', { method: 'GET' });
    console.log('✅ Backend connected:', response);
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return false;
  }
}
