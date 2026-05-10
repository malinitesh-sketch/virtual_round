require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createPool } = require('./mysql');

const { authRequired } = require('./middleware-auth');
const authRoutes = require('./routes-auth-mysql');
const tripsRoutes = require('./routes-trips-mysql');
const activitiesRoutes = require('./routes-activities-mysql');

const pool = createPool();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====
// CORS configuration - Allow requests from frontend
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'file://',
    '*' // For development - restrict in production
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== ROUTES =====
// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Traveloop Backend API is running',
    timestamp: new Date()
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is connected to frontend!',
    data: { user: 'James A.', app: 'Traveloop' }
  });
});

// ===== API ROUTES (MySQL-backed) =====

// Auth
app.post('/api/auth/register', authRoutes.register);
app.post('/api/auth/login', authRoutes.login);

// Trips
app.get('/api/trips', tripsRoutes.listTrips);
app.post('/api/trips', authRequired, tripsRoutes.createTrip);

// Activities
app.get('/api/activities', authRequired, activitiesRoutes.listActivities);
app.post('/api/activities', authRequired, activitiesRoutes.createActivity);

// User profile
app.get('/api/user/profile', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, profile_pic FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profile_pic || null
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to fetch profile', details: String(err?.message || err) });
  }
});

// ===== ERROR HANDLING =====
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     Traveloop Backend API              ║
║     Running on port ${PORT}             ║
║     Travel Beyond Gravity ✈️            ║
╚════════════════════════════════════════╝
  `);
  console.log(`API Documentation available at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
